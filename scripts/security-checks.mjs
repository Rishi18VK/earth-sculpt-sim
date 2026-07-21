#!/usr/bin/env node
/**
 * Automated security regression checks.
 * Guards against reintroducing previously-fixed security findings.
 *
 * Fixed findings covered:
 *  1. SUPA_anon_security_definer_function_executable
 *  2. SUPA_authenticated_security_definer_function_executable
 *     -> public.handle_new_user() must NOT be EXECUTE-granted to anon/authenticated/PUBLIC
 *  3. SUPA_auth_leaked_password_protection
 *     -> supabase/config.toml must enable password HIBP protection
 *  4. SUPA_pg_graphql_anon_table_exposed
 *  5. SUPA_pg_graphql_authenticated_table_exposed
 *     -> pg_graphql extension must not be (re)created
 *  6. SUPA_public_bucket_allows_listing
 *     -> no broad SELECT policy on storage.objects for the "mods" bucket
 *  7. mods_missing_update_check
 *     -> UPDATE policy on public.mods must include WITH CHECK (auth.uid() = user_id)
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const CONFIG_TOML = join(ROOT, "supabase", "config.toml");

const failures = [];
const fail = (id, msg) => failures.push(`✗ [${id}] ${msg}`);
const ok = (id, msg) => console.log(`✓ [${id}] ${msg}`);

// Load all migration SQL, newest last
const migrationFiles = existsSync(MIGRATIONS_DIR)
  ? readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()
  : [];
const migrations = migrationFiles.map((f) => ({
  file: f,
  sql: readFileSync(join(MIGRATIONS_DIR, f), "utf8"),
}));
const allSql = migrations.map((m) => m.sql).join("\n");
const allSqlNorm = allSql.replace(/\s+/g, " ").toLowerCase();

// --- 1 & 2: handle_new_user must not be executable by anon/authenticated/public ---
{
  const id = "SUPA_security_definer_function_executable";
  // Find any GRANT EXECUTE ... handle_new_user ... TO ... (anon|authenticated|public)
  const badGrant = /grant\s+execute[^;]*handle_new_user[^;]*to\s+[^;]*(anon|authenticated|public)/i;
  // Also flag CREATE FUNCTION without matching REVOKE afterwards
  const hasRevoke = /revoke\s+execute[^;]*handle_new_user[^;]*from\s+[^;]*(public|anon|authenticated)/i.test(allSql);
  if (badGrant.test(allSql)) {
    fail(id, "A migration GRANTs EXECUTE on handle_new_user to anon/authenticated/PUBLIC.");
  } else if (!hasRevoke) {
    fail(id, "No REVOKE EXECUTE on handle_new_user from PUBLIC/anon/authenticated found.");
  } else {
    ok(id, "handle_new_user execute privileges are revoked from anon/authenticated/PUBLIC.");
  }
}

// --- 3: Leaked password protection ---
{
  const id = "SUPA_auth_leaked_password_protection";
  if (!existsSync(CONFIG_TOML)) {
    fail(id, "supabase/config.toml is missing.");
  } else {
    const cfg = readFileSync(CONFIG_TOML, "utf8");
    // Accept either password_hibp_enabled = true or enable_password_hibp = true
    if (/(password_hibp_enabled|enable_password_hibp)\s*=\s*true/i.test(cfg)) {
      ok(id, "Leaked password protection (HIBP) is enabled.");
    } else {
      fail(id, "Leaked password protection is not enabled in supabase/config.toml.");
    }
  }
}

// --- 4 & 5: pg_graphql must not be re-enabled ---
{
  const id = "SUPA_pg_graphql_exposed";
  // Look at the LATEST state: was pg_graphql dropped and never re-created after?
  const events = [];
  for (const m of migrations) {
    const lower = m.sql.toLowerCase();
    const createIdx = lower.search(/create\s+extension[^;]*pg_graphql/);
    const dropIdx = lower.search(/drop\s+extension[^;]*pg_graphql/);
    if (createIdx !== -1) events.push({ file: m.file, at: createIdx, kind: "create" });
    if (dropIdx !== -1) events.push({ file: m.file, at: dropIdx, kind: "drop" });
  }
  const last = events[events.length - 1];
  if (last && last.kind === "create") {
    fail(id, `pg_graphql extension is re-created in migration ${last.file}.`);
  } else {
    ok(id, "pg_graphql extension is not enabled by any active migration.");
  }
}

// --- 6: no broad SELECT policy on storage.objects for the "mods" bucket ---
{
  const id = "SUPA_public_bucket_allows_listing";
  // Flag CREATE POLICY on storage.objects that references bucket_id = 'mods' with FOR SELECT (or ALL)
  // and does not scope by owner = auth.uid().
  const policyRe = /create\s+policy[\s\S]*?on\s+storage\.objects[\s\S]*?;/gi;
  let offenders = [];
  for (const m of migrations) {
    const matches = m.sql.match(policyRe) || [];
    for (const p of matches) {
      const lower = p.toLowerCase();
      const touchesMods = /bucket_id\s*=\s*'mods'/.test(lower);
      const isSelect = /for\s+(select|all)/.test(lower);
      const ownerScoped = /owner\s*=\s*auth\.uid\(\)/.test(lower);
      // Check whether a later migration DROPs this policy by name
      const nameMatch = p.match(/create\s+policy\s+"([^"]+)"/i);
      const policyName = nameMatch?.[1];
      const droppedLater = policyName &&
        new RegExp(`drop\\s+policy[^;]*"${policyName.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}"`, "i").test(
          migrations.slice(migrations.findIndex((x) => x.file === m.file) + 1).map((x) => x.sql).join("\n")
        );
      if (touchesMods && isSelect && !ownerScoped && !droppedLater) {
        offenders.push(`${m.file}: ${policyName ?? "<unnamed>"}`);
      }
    }
  }
  if (offenders.length) {
    fail(id, `Broad SELECT policy on storage.objects for "mods" bucket found: ${offenders.join(", ")}`);
  } else {
    ok(id, `No unrestricted SELECT policy on storage.objects for "mods" bucket.`);
  }
}

// --- 7: mods UPDATE policy must have WITH CHECK ---
{
  const id = "mods_missing_update_check";
  const policyRe = /create\s+policy[\s\S]*?on\s+public\.mods[\s\S]*?;/gi;
  const updatePolicies = (allSql.match(policyRe) || []).filter((p) =>
    /for\s+(update|all)/i.test(p)
  );
  if (updatePolicies.length === 0) {
    fail(id, "No UPDATE policy on public.mods found (expected one with WITH CHECK).");
  } else {
    const missing = updatePolicies.filter((p) => !/with\s+check\s*\(/i.test(p));
    if (missing.length) {
      fail(id, `An UPDATE/ALL policy on public.mods is missing WITH CHECK clause.`);
    } else {
      ok(id, "All UPDATE/ALL policies on public.mods include a WITH CHECK clause.");
    }
  }
}

if (failures.length) {
  console.error("\nSecurity regression checks FAILED:");
  for (const f of failures) console.error("  " + f);
  console.error(
    "\nThese guards prevent previously-fixed security findings from regressing.\n" +
      "If a change is intentional, update scripts/security-checks.mjs accordingly."
  );
  process.exit(1);
}
console.log("\nAll security regression checks passed.");
