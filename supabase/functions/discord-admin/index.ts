/**
 * Admin-only Discord control surface for the Terra Explorer web dashboard.
 *
 * Never returns secret values — only whether each secret is configured, plus
 * public metadata fetched from Discord with the bot token (server side only).
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const BodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({ action: z.literal("register_commands") }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SUB = (name: string, description: string, withQuery = false) => ({
  type: 1,
  name,
  description,
  ...(withQuery
    ? { options: [{ type: 3, name: "query", description: "Display name to look up", required: true }] }
    : {}),
});

const COMMAND = {
  name: "terra",
  description: "Terra Explorer administration",
  options: [
    SUB("dashboard", "Overview of the platform"),
    SUB("stats", "Key platform statistics"),
    SUB("users", "Recently registered explorers"),
    SUB("user", "Look up a single account", true),
    SUB("mods", "Latest mods and their status"),
    SUB("reports", "Open reports and feedback"),
    SUB("locations", "Locations and 3D content"),
    SUB("system", "Service health"),
    SUB("audit", "Recent admin audit entries"),
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  const caller = userData?.user;
  if (userErr || !caller) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const APP_ID = Deno.env.get("DISCORD_APPLICATION_ID") ?? "";
  const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY") ?? "";
  const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") ?? "";
  const GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") ?? "";
  const ADMIN_ROLE_ID = Deno.env.get("DISCORD_ADMIN_ROLE_ID") ?? "";

  try {
    if (parsed.data.action === "status") {
      const configured = {
        applicationId: !!APP_ID,
        publicKey: !!PUBLIC_KEY,
        botToken: !!BOT_TOKEN,
        guildId: !!GUILD_ID,
        adminRoleId: !!ADMIN_ROLE_ID,
      };

      let bot: { username: string } | null = null;
      let guild: { name: string; memberCount: number | null } | null = null;
      let botError: string | null = null;

      if (BOT_TOKEN) {
        const meRes = await fetch("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bot ${BOT_TOKEN}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          bot = { username: `${me.username}` };
        } else {
          botError = "Bot token rejected by Discord";
        }

        if (GUILD_ID && meRes.ok) {
          const gRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`, {
            headers: { Authorization: `Bot ${BOT_TOKEN}` },
          });
          if (gRes.ok) {
            const g = await gRes.json();
            guild = { name: g.name, memberCount: g.approximate_member_count ?? null };
          } else {
            botError = "Bot is not a member of the configured server";
          }
        }
      }

      const { data: lastActivity } = await admin
        .from("admin_audit_logs")
        .select("action, actor_label, created_at")
        .eq("source", "discord")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const interactionsUrl = `${SUPABASE_URL}/functions/v1/discord-interactions`;

      return json({ configured, bot, guild, botError, lastActivity: lastActivity ?? null, interactionsUrl });
    }

    // register_commands
    if (!APP_ID || !BOT_TOKEN) return json({ error: "Discord application id and bot token must be configured first" }, 400);
    const url = GUILD_ID
      ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
      : `https://discord.com/api/v10/applications/${APP_ID}/commands`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(COMMAND),
    });
    if (!res.ok) {
      console.error("command registration failed", res.status, await res.text());
      return json({ error: "Discord rejected the command registration" }, 400);
    }
    await admin.from("admin_audit_logs").insert({
      actor_user_id: caller.id,
      actor_label: caller.email ?? "admin",
      source: "web",
      action: "discord_register_commands",
      target_type: "discord_application",
      target_id: APP_ID,
      status: "success",
      metadata: { scope: GUILD_ID ? "guild" : "global" },
    });
    return json({ ok: true, scope: GUILD_ID ? "guild" : "global" });
  } catch (e) {
    console.error("discord-admin failed:", e);
    return json({ error: "Request failed" }, 500);
  }
});
