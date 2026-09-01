import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const NEW_PASSWORD = Deno.env.get("SUPER_ADMIN_PASSWORD") ?? "";

  if (NEW_PASSWORD.length < 8) {
    return json({ error: "SUPER_ADMIN_PASSWORD is not configured (min 8 characters)" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  // Validate the caller's JWT.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
  const callerId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Only a super admin may apply the stored password — and only to their own account.
  const { data: roleRow, error: roleErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (roleErr) return json({ error: "Role check failed" }, 500);
  if (!roleRow) return json({ error: "Forbidden: super_admin role required" }, 403);

  const { error: updErr } = await admin.auth.admin.updateUserById(callerId, {
    password: NEW_PASSWORD,
  });
  if (updErr) {
    console.error("admin-set-password error", updErr.message);
    return json({ error: "Could not update password" }, 500);
  }

  const at = new Date().toISOString();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    null;

  const { error: logErr } = await admin.from("security_events").insert({
    kind: "admin_action",
    actor: userData.user.email ?? callerId,
    detail: `Super admin password set/changed for ${userData.user.email ?? callerId} at ${at}`,
    ip,
  });
  if (logErr) console.error("audit log insert failed", logErr.message);


  return json({ ok: true });
});
