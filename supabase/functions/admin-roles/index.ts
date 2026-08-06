import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const ROLES = ["admin", "moderator", "user"] as const;

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({
    action: z.literal("grant"),
    email: z.string().email().max(320),
    role: z.enum(ROLES),
  }),
  z.object({
    action: z.literal("revoke"),
    user_id: z.string().uuid(),
    role: z.enum(ROLES),
  }),
]);

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

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  // 1. Validate the caller's JWT with a user-scoped client.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
  const callerId = userData.user.id;

  // 2. Privileged client — never used for sign-in.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // 3. Authorize: caller must hold the admin role.
  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    _user_id: callerId,
    _role: "admin",
  });
  if (roleErr) return json({ error: "Role check failed" }, 500);
  if (!isAdmin) return json({ error: "Forbidden: admin role required" }, 403);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const body = parsed.data;

  try {
    if (body.action === "list") {
      const { data: roleRows, error } = await admin
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listErr) throw listErr;
      const emailById = new Map(usersPage.users.map((u) => [u.id, u.email ?? ""]));

      return json({
        roles: (roleRows ?? []).map((r) => ({ ...r, email: emailById.get(r.user_id) ?? "unknown" })),
      });
    }

    if (body.action === "grant") {
      const target = body.email.trim().toLowerCase();
      const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listErr) throw listErr;
      const match = usersPage.users.find((u) => (u.email ?? "").toLowerCase() === target);
      if (!match) return json({ error: "No account found with that email" }, 404);

      const { error } = await admin
        .from("user_roles")
        .upsert({ user_id: match.id, role: body.role }, { onConflict: "user_id,role" });
      if (error) throw error;
      return json({ ok: true, user_id: match.id, role: body.role });
    }

    // revoke
    if (body.user_id === callerId && body.role === "admin") {
      return json({ error: "You cannot revoke your own admin role" }, 400);
    }
    const { error } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", body.user_id)
      .eq("role", body.role);
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error("admin-roles error", e);
    return json({ error: "Operation failed" }, 500);
  }
});
