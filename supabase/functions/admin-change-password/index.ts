import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BodySchema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: z.string().min(10).max(200),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      { error: "New password must be at least 10 characters", fields: parsed.error.flatten().fieldErrors },
      400,
    );
  }
  const { current_password, new_password } = parsed.data;
  if (current_password === new_password) {
    return json({ error: "New password must differ from the current one" }, 400);
  }

  // 1. Validate the caller's JWT.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user?.email) return json({ error: "Unauthorized" }, 401);
  const callerId = userData.user.id;
  const email = userData.user.email;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    null;
  const audit = (kind: string, detail: string) =>
    admin.from("security_events").insert({ kind, actor: email, detail, ip });

  // 2. Only admins / super admins may use this flow.
  const { data: roleRows, error: roleErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .in("role", ["admin", "super_admin"]);
  if (roleErr) return json({ error: "Role check failed" }, 500);
  if (!roleRows?.length) {
    await audit("failed_login", "Password change denied: admin role required");
    return json({ error: "Forbidden: admin or super_admin role required" }, 403);
  }
  const role = roleRows.some((r) => r.role === "super_admin") ? "super_admin" : "admin";

  // 3. Re-authenticate with the current password before allowing the change.
  const verifyClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { error: signInErr } = await verifyClient.auth.signInWithPassword({
    email,
    password: current_password,
  });
  if (signInErr) {
    await audit("failed_login", `Password change rejected: current password incorrect (${role})`);
    return json({ error: "Current password is incorrect" }, 401);
  }
  await verifyClient.auth.signOut();

  // 4. Apply the new password.
  const { error: updErr } = await admin.auth.admin.updateUserById(callerId, {
    password: new_password,
  });
  if (updErr) {
    console.error("admin-change-password error", updErr.message);
    return json({ error: updErr.message || "Could not update password" }, 400);
  }

  await audit(
    "admin_action",
    `Password changed by ${role} ${email} at ${new Date().toISOString()} (current password verified)`,
  );

  return json({ ok: true });
});
