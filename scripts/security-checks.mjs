#!/usr/bin/env node
/**
 * Automated security regression checks.
 * Guards against reintroducing previously-fixed security findings.
 *
 * Covered findings:
 *  - SUPA_anon_security_definer_function_executable
 *  - SUPA_authenticated_security_definer_function_executable
 *  - SUPA_auth_leaked_password_protection
 *  - SUPA_pg_graphql_anon_table_exposed
 *  - SUPA_pg_graphql_authenticated_table_exposed
 *  - SUPA_public_bucket_allows_listing
 *  - mods_missing_update_check
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const CONFIG_TOML = join(ROOT, "supabase", "config.toml");

const failures = [];
const fail = (id, msg) => failures.push(`✗ [${id}] ${msg}`);
const ok = (id, msg) => console.log(`✓ [${id}] ${msg}`);

const migrationFiles = existsSync(MIGRATIONS_DIR)
  ? readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()
  : [];
const migrations = migrationFiles.map((f) => ({
  file: f,
  sql: readFileSync(join(MIGRATIONS_DIR, f), "utf8"),
}));
const allSql = migrations.map((m) => m.sql).join("\n");

/** Split SQL into semicolon-terminated statements (naive but sufficient here). */
function splitStatements(sql) {
  const stmts = [];
  let buf = "";
  let inString = false;
  let inDollar = false;
  let dollarTag = "";
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    buf += c;
    if (inDollar) {
      if (sql.startsWith(dollarTag, i)) {
        buf += dollarTag.slice(1);
        i += dollarTag.length - 1;
        inDollar = false;
      }
      continue;
    }
    if (c === "'" && sql[i - 1] !== "\\") inString = !inString;
    if (!inString && c === "$") {
      const m = sql.slice(i).match(/^\$[a-zA-Z_]*\$/);
      if (m) {
        dollarTag = m[0];
        buf += dollarTag.slice(1);
        i += dollarTag.length - 1;
        inDollar = true;
        continue;
      }
    }
    if (!inString && c === ";") {
      stmts.push(buf);
      buf = "";
    }
  }
  if (buf.trim()) stmts.push(buf);
  return stmts;
}

/** Return the set of policies (by table + name) that are effective at the end
 *  of all migrations — i.e. created and not later dropped or replaced without
 *  a follow-up CREATE. */
function effectivePolicies() {
  const effective = new Map(); // key: `${table}::${name}` -> { sql, table, name }
  for (const m of migrations) {
    for (const stmt of splitStatements(m.sql)) {
      const s = stmt.trim();
      const createMatch = s.match(
        /^create\s+policy\s+"([^"]+)"\s+on\s+([a-z_.]+)/i
      );
      const dropMatch = s.match(
        /^drop\s+policy(?:\s+if\s+exists)?\s+"([^"]+)"\s+on\s+([a-z_.]+)/i
      );
      if (dropMatch) {
        effective.delete(`${dropMatch[2].toLowerCase()}::${dropMatch[1]}`);
      }
      if (createMatch) {
        const key = `${createMatch[2].toLowerCase()}::${createMatch[1]}`;
        effective.set(key, { sql: s, table: createMatch[2].toLowerCase(), name: createMatch[1] });
      }
    }
  }
  return [...effective.values()];
}

const policies = effectivePolicies();

// --- handle_new_user must not be EXECUTE-granted to anon/authenticated/PUBLIC ---
{
  const id = "SUPA_security_definer_function_executable";
  const stmts = splitStatements(allSql).map((s) => s.trim());
  const badGrant = stmts.some((s) =>
    /^grant\s+execute[\s\S]*handle_new_user[\s\S]*to\s+[\s\S]*(anon|authenticated|public)/i.test(s)
  );
  const hasRevoke = stmts.some((s) =>
    /^revoke\s+execute[\s\S]*handle_new_user[\s\S]*from\s+[\s\S]*(public|anon|authenticated)/i.test(s)
  );
  if (badGrant) fail(id, "A migration GRANTs EXECUTE on handle_new_user to anon/authenticated/PUBLIC.");
  else if (!hasRevoke) fail(id, "No REVOKE EXECUTE on handle_new_user from PUBLIC/anon/authenticated found.");
  else ok(id, "handle_new_user execute privileges are revoked from anon/authenticated/PUBLIC.");
}

// --- Leaked password protection (HIBP) enabled in config.toml ---
{
  const id = "SUPA_auth_leaked_password_protection";
  const cfg = existsSync(CONFIG_TOML) ? readFileSync(CONFIG_TOML, "utf8") : "";
  if (/(enable_password_hibp|password_hibp_enabled)\s*=\s*true/i.test(cfg)) {
    ok(id, "Leaked password protection (HIBP) is enabled in supabase/config.toml.");
  } else {
    fail(id, "supabase/config.toml must set enable_password_hibp = true under [auth].");
  }
}

// --- pg_graphql extension must not be effectively enabled ---
{
  const id = "SUPA_pg_graphql_exposed";
  let enabled = false;
  for (const m of migrations) {
    for (const s of splitStatements(m.sql).map((x) => x.trim())) {
      if (/^create\s+extension[^;]*pg_graphql/i.test(s)) enabled = true;
      if (/^drop\s+extension[^;]*pg_graphql/i.test(s)) enabled = false;
    }
  }
  if (enabled) fail(id, "pg_graphql extension is enabled by the latest migration state.");
  else ok(id, "pg_graphql extension is not enabled by any active migration.");
}

// --- No broad SELECT policy on storage.objects for the "mods" bucket ---
{
  const id = "SUPA_public_bucket_allows_listing";
  const offenders = policies.filter((p) => {
    if (p.table !== "storage.objects") return false;
    const lower = p.sql.toLowerCase();
    if (!/bucket_id\s*=\s*'mods'/.test(lower)) return false;
    if (!/for\s+(select|all)/.test(lower)) return false;
    // Owner/user scoping via storage.foldername or owner column is acceptable.
    const scoped =
      /storage\.foldername\(name\)\)\[1\]\s*=\s*auth\.uid\(\)::text/.test(lower) ||
      /owner\s*=\s*auth\.uid\(\)/.test(lower);
    return !scoped;
  });
  if (offenders.length) {
    fail(
      id,
      `Unrestricted SELECT policy on storage.objects for "mods" bucket: ${offenders
        .map((o) => `"${o.name}"`)
        .join(", ")}`
    );
  } else {
    ok(id, `No unrestricted SELECT policy on storage.objects for "mods" bucket.`);
  }
}

// --- public.mods UPDATE policy must include WITH CHECK ---
{
  const id = "mods_missing_update_check";
  const updatePolicies = policies.filter(
    (p) => p.table === "public.mods" && /for\s+(update|all)/i.test(p.sql)
  );
  if (updatePolicies.length === 0) {
    fail(id, "No effective UPDATE policy on public.mods found (expected one with WITH CHECK).");
  } else {
    const missing = updatePolicies.filter((p) => !/with\s+check\s*\(/i.test(p.sql));
    if (missing.length) {
      fail(
        id,
        `UPDATE policy on public.mods is missing WITH CHECK: ${missing.map((p) => `"${p.name}"`).join(", ")}`
      );
    } else {
      ok(id, "Effective UPDATE policies on public.mods include a WITH CHECK clause.");
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
