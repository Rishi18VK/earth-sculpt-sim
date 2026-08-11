import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

/**
 * Reads that need elevated privileges. The underlying SECURITY DEFINER
 * routines are no longer executable by anon/authenticated, so they are only
 * reachable here, behind explicit authorization checks.
 */
const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("leaderboard"), limit: z.number().int().min(1).max(100).optional() }),
  z.object({ action: z.literal("admin_list_users") }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    if (body.action === "leaderboard") {
      const { data, error } = await admin.rpc("get_leaderboard", { _limit: body.limit ?? 20 });
      if (error) throw new Error(error.message);
      return json({ data });
    }

    // admin_list_users — requires an authenticated admin caller
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (userErr || !caller) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { data, error } = await admin.rpc("admin_list_users");
    if (error) throw new Error(error.message);
    return json({ data });
  } catch (e) {
    console.error("app-data failed:", e);
    return json({ error: "Request failed" }, 500);
  }
});
