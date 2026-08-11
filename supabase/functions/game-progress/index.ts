import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

/**
 * Trusted writer for all progression data (XP, levels, achievements, daily
 * rewards). The client can no longer write these tables directly: RLS + GRANTs
 * only allow reads, so every mutation must pass the rules enforced here.
 */

// Server-known XP table. The client sends an action name, never an amount.
const XP_ACTIONS: Record<string, number> = {
  terrain_generated: 5,
  collectible_found: 5,
  landmark_visited: 10,
  screenshot_shared: 15,
  mod_published: 25,
};

const DAILY_REWARD_XP = 50;

// Server-verified unlock criteria per achievement code.
type Ctx = {
  stats: { distance_explored: number; terrains_generated: number; time_spent_seconds: number; collectibles_found: number };
  mods: number;
  donations: number;
};
const CRITERIA: Record<string, (c: Ctx) => boolean> = {
  first_steps: (c) => c.stats.terrains_generated >= 1,
  night_owl: (c) => c.stats.time_spent_seconds >= 600,
  cartographer: (c) => c.stats.terrains_generated >= 10,
  modder: (c) => c.mods >= 1,
  real_earth: (c) => c.stats.distance_explored >= 1,
  collector_10: (c) => c.stats.collectibles_found >= 10,
  supporter: (c) => c.donations >= 1,
  globe_trotter: (c) => c.stats.distance_explored >= 50,
};

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("award_xp"), reason: z.enum(Object.keys(XP_ACTIONS) as [string, ...string[]]) }),
  z.object({ action: z.literal("claim_daily_reward") }),
  z.object({ action: z.literal("unlock_achievement"), code: z.string().min(1).max(64) }),
  z.object({ action: z.literal("grant_xp"), user_id: z.string().uuid(), amount: z.number().int().min(-100000).max(100000) }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const levelFromXp = (xp: number) => Math.max(1, Math.floor(xp / 500) + 1);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const caller = userData?.user;
  if (userErr || !caller) return json({ error: "Unauthorized" }, 401);

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const body = parsed.data;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const addXp = async (userId: string, delta: number) => {
    const { data } = await admin.from("user_progress").select("xp").eq("user_id", userId).maybeSingle();
    const xp = Math.max(0, (data?.xp ?? 0) + delta);
    const { error } = await admin
      .from("user_progress")
      .upsert({ user_id: userId, xp, level: levelFromXp(xp) }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { xp, level: levelFromXp(xp) };
  };

  try {
    if (body.action === "award_xp") {
      const amount = XP_ACTIONS[body.reason];
      const progress = await addXp(caller.id, amount);
      return json({ awarded: amount, ...progress });
    }

    if (body.action === "claim_daily_reward") {
      // Server date only — a client-supplied day is never trusted.
      const today = new Date().toISOString().slice(0, 10);
      const { error: insErr } = await admin
        .from("daily_rewards_log")
        .insert({ user_id: caller.id, day: today, reward_type: "xp", amount: DAILY_REWARD_XP });
      if (insErr) return json({ error: "Daily reward already claimed today" }, 409);
      const progress = await addXp(caller.id, DAILY_REWARD_XP);
      return json({ awarded: DAILY_REWARD_XP, ...progress });
    }

    if (body.action === "unlock_achievement") {
      const { data: ach } = await admin
        .from("achievements")
        .select("id, code, xp_reward")
        .eq("code", body.code)
        .maybeSingle();
      if (!ach) return json({ error: "Unknown achievement" }, 404);

      const { data: existing } = await admin
        .from("user_achievements")
        .select("id")
        .eq("user_id", caller.id)
        .eq("achievement_id", ach.id)
        .maybeSingle();
      if (existing) return json({ unlocked: false, reason: "already_unlocked" });

      const [{ data: stats }, mods, donations] = await Promise.all([
        admin
          .from("user_stats")
          .select("distance_explored, terrains_generated, time_spent_seconds, collectibles_found")
          .eq("id", caller.id)
          .maybeSingle(),
        admin.from("mods").select("id", { count: "exact", head: true }).eq("user_id", caller.id),
        admin.from("donations").select("id", { count: "exact", head: true }).eq("user_id", caller.id),
      ]);

      const ctx: Ctx = {
        stats: {
          distance_explored: Number(stats?.distance_explored ?? 0),
          terrains_generated: stats?.terrains_generated ?? 0,
          time_spent_seconds: stats?.time_spent_seconds ?? 0,
          collectibles_found: stats?.collectibles_found ?? 0,
        },
        mods: mods.count ?? 0,
        donations: donations.count ?? 0,
      };

      const check = CRITERIA[ach.code];
      if (!check || !check(ctx)) return json({ unlocked: false, reason: "criteria_not_met" });

      const { error: achErr } = await admin
        .from("user_achievements")
        .insert({ user_id: caller.id, achievement_id: ach.id });
      if (achErr) return json({ unlocked: false, reason: "already_unlocked" });

      const progress = await addXp(caller.id, ach.xp_reward ?? 0);
      return json({ unlocked: true, achievement_id: ach.id, awarded: ach.xp_reward ?? 0, ...progress });
    }

    // grant_xp — admin only
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);
    const progress = await addXp(body.user_id, body.amount);
    await admin.from("security_events").insert({
      kind: "admin_action",
      actor: caller.email ?? caller.id,
      detail: `Adjusted XP for ${body.user_id} by ${body.amount}`,
    });
    return json({ ...progress });
  } catch (e) {
    console.error("game-progress failed:", e);
    return json({ error: "Request failed" }, 500);
  }
});
