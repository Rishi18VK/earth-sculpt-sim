/**
 * Discord Interactions endpoint (slash commands) for Terra Explorer admins.
 *
 * Security model:
 *  - Every request is verified with the application's Ed25519 public key.
 *    Unsigned / badly signed requests are rejected with 401 (Discord requirement).
 *  - Authorization is NOT based on usernames. A caller must either
 *      a) hold the configured Discord admin role in the configured guild, or
 *      b) be listed as active in public.discord_admin_links.
 *  - The service-role key never leaves this function.
 *  - Only aggregate / non-sensitive data is returned; emails and payment
 *    details are never included in Discord payloads.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY") ?? "";
const GUILD_ID = Deno.env.get("DISCORD_GUILD_ID") ?? "";
const ADMIN_ROLE_ID = Deno.env.get("DISCORD_ADMIN_ROLE_ID") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const hexToBytes = (hex: string) => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
};

async function verifySignature(body: string, signature: string, timestamp: string) {
  if (!PUBLIC_KEY || !signature || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBytes(PUBLIC_KEY),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      hexToBytes(signature),
      new TextEncoder().encode(timestamp + body),
    );
  } catch {
    return false;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const EPHEMERAL = 1 << 6;
const reply = (embed: Record<string, unknown>, components: unknown[] = []) =>
  json({ type: 4, data: { embeds: [embed], components, flags: EPHEMERAL } });
const text = (content: string) => json({ type: 4, data: { content, flags: EPHEMERAL } });

const BRAND = 0x3ba9ff;
const DANGER = 0xef4444;

interface Interaction {
  type: number;
  data?: { name?: string; options?: { name: string; value?: string; options?: { name: string; value?: string }[] }[]; custom_id?: string };
  member?: { user?: { id: string; username?: string }; roles?: string[] };
  user?: { id: string; username?: string };
  guild_id?: string;
}

async function authorize(i: Interaction) {
  const user = i.member?.user ?? i.user;
  if (!user?.id) return { ok: false as const, reason: "Unknown caller" };

  const guildOk = !GUILD_ID || i.guild_id === GUILD_ID;
  const roleOk = !!ADMIN_ROLE_ID && guildOk && (i.member?.roles ?? []).includes(ADMIN_ROLE_ID);

  const { data: link } = await admin
    .from("discord_admin_links")
    .select("id, active, user_id")
    .eq("discord_user_id", user.id)
    .maybeSingle();
  const linkOk = !!link?.active;

  if (!roleOk && !linkOk) {
    await audit("discord_command_denied", user, "denied", { guild_id: i.guild_id ?? null });
    return { ok: false as const, reason: "You are not authorized to run Terra Explorer admin commands." };
  }
  if (link?.id) {
    await admin.from("discord_admin_links").update({ last_used_at: new Date().toISOString() }).eq("id", link.id);
  }
  return { ok: true as const, user, linkedUserId: link?.user_id ?? null };
}

async function audit(
  action: string,
  user: { id: string; username?: string } | undefined,
  status: "success" | "denied" | "error",
  metadata: Record<string, unknown> = {},
) {
  await admin.from("admin_audit_logs").insert({
    actor_label: user?.username ? `discord:${user.username}` : "discord:unknown",
    source: "discord",
    action,
    target_type: "discord_user",
    target_id: user?.id ?? null,
    status,
    metadata,
  });
}

const count = async (table: string, build?: (q: any) => any) => {
  let q = admin.from(table).select("id", { count: "exact", head: true });
  if (build) q = build(q);
  const { count: c } = await q;
  return c ?? 0;
};

async function snapshot() {
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const [users, activeWeek, locations, mods, pendingMods, reports, donationsRes] = await Promise.all([
    count("profiles"),
    count("user_stats", (q) => q.gte("updated_at", weekAgo)),
    count("content_items"),
    count("mods"),
    count("mods", (q) => q.eq("status", "pending")),
    count("feedback", (q) => q.eq("status", "open")),
    admin.from("donations").select("amount"),
  ]);
  const donations = donationsRes.data ?? [];
  return {
    users,
    activeWeek,
    locations,
    mods,
    pendingMods,
    reports,
    donationCount: donations.length,
    donationTotal: donations.reduce((s, d) => s + Number(d.amount ?? 0), 0),
  };
}

const NAV_BUTTONS = [
  {
    type: 1,
    components: [
      { type: 2, style: 2, label: "Users", custom_id: "terra:users" },
      { type: 2, style: 2, label: "Mods", custom_id: "terra:mods" },
      { type: 2, style: 2, label: "Reports", custom_id: "terra:reports" },
      { type: 2, style: 2, label: "Locations", custom_id: "terra:locations" },
      { type: 2, style: 2, label: "System", custom_id: "terra:system" },
    ],
  },
];

async function render(topic: string, opt?: string) {
  if (topic === "dashboard" || topic === "stats") {
    const s = await snapshot();
    return reply(
      {
        title: "🌍 TERRA EXPLORER ADMIN",
        color: BRAND,
        fields: [
          { name: "👥 Users", value: `${s.users}`, inline: true },
          { name: "🟢 Active (7d)", value: `${s.activeWeek}`, inline: true },
          { name: "🌎 Locations", value: `${s.locations}`, inline: true },
          { name: "🧩 Mods", value: `${s.mods} (${s.pendingMods} pending)`, inline: true },
          { name: "🚨 Open Reports", value: `${s.reports}`, inline: true },
          { name: "💰 Donations", value: `${s.donationCount} · ₹${s.donationTotal.toLocaleString("en-IN")}`, inline: true },
          { name: "🟢 System", value: "Operational", inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
      NAV_BUTTONS,
    );
  }

  if (topic === "users") {
    const { data } = await admin
      .from("profiles")
      .select("display_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    const rows = (data ?? []).map((p) => `• ${p.display_name ?? "Explorer"} — ${p.status ?? "active"}`);
    return reply({
      title: "👥 Recent users",
      color: BRAND,
      description: rows.length ? rows.join("\n") : "No users yet.",
      footer: { text: "Emails are never shown in Discord." },
    });
  }

  if (topic === "user") {
    if (!opt) return text("Usage: `/terra user <display name>`");
    const { data } = await admin
      .from("profiles")
      .select("id, display_name, status, country, created_at")
      .ilike("display_name", `%${opt.slice(0, 60)}%`)
      .limit(3);
    if (!data?.length) return text("No matching account.");
    return reply({
      title: "👤 User lookup",
      color: BRAND,
      description: data
        .map((u) => `**${u.display_name ?? "Explorer"}**\nStatus: ${u.status ?? "active"} · ${u.country ?? "—"}\nJoined: <t:${Math.floor(new Date(u.created_at).getTime() / 1000)}:R>`)
        .join("\n\n"),
    });
  }

  if (topic === "mods") {
    const { data } = await admin
      .from("mods")
      .select("name, version, author, status, downloads")
      .order("created_at", { ascending: false })
      .limit(10);
    const rows = (data ?? []).map((m) => `• **${m.name}** v${m.version} — ${m.status} · ${m.downloads ?? 0} dl`);
    return reply({ title: "🧩 Mods", color: BRAND, description: rows.length ? rows.join("\n") : "No mods yet." });
  }

  if (topic === "reports") {
    const { data } = await admin
      .from("feedback")
      .select("title, type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    const rows = (data ?? []).map((r) => `• [${r.status}] ${r.type} — ${r.title}`);
    return reply({ title: "🚨 Reports & feedback", color: DANGER, description: rows.length ? rows.join("\n") : "Nothing reported." });
  }

  if (topic === "locations") {
    const { data } = await admin
      .from("content_items")
      .select("title, kind, published, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10);
    const rows = (data ?? []).map((c) => `• ${c.title} — ${c.kind} · ${c.published ? "published" : "hidden"}`);
    return reply({ title: "🌎 Locations & content", color: BRAND, description: rows.length ? rows.join("\n") : "No content yet." });
  }

  if (topic === "system") {
    const t0 = Date.now();
    const { error } = await admin.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
    const ms = Date.now() - t0;
    return reply({
      title: "🩺 System health",
      color: error ? DANGER : BRAND,
      fields: [
        { name: "Database", value: error ? "🔴 Offline" : `🟢 Operational (${ms} ms)`, inline: true },
        { name: "Edge functions", value: "🟢 Operational", inline: true },
        { name: "Discord bot", value: "🟢 Responding", inline: true },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  if (topic === "audit") {
    const { data } = await admin
      .from("admin_audit_logs")
      .select("action, actor_label, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    const rows = (data ?? []).map(
      (a) => `• \`${a.action}\` (${a.status}) — ${a.actor_label} <t:${Math.floor(new Date(a.created_at).getTime() / 1000)}:R>`,
    );
    return reply({ title: "📜 Recent admin audit", color: BRAND, description: rows.length ? rows.join("\n") : "No entries yet." });
  }

  return text("Unknown command. Try `/terra dashboard`.");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!PUBLIC_KEY) return json({ error: "Not configured" }, 503);

  const body = await req.text();
  const ok = await verifySignature(
    body,
    req.headers.get("x-signature-ed25519") ?? "",
    req.headers.get("x-signature-timestamp") ?? "",
  );
  if (!ok) return new Response("invalid request signature", { status: 401 });

  let interaction: Interaction;
  try {
    interaction = JSON.parse(body);
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  // PING
  if (interaction.type === 1) return json({ type: 1 });

  try {
    const auth = await authorize(interaction);
    if (!auth.ok) return text(`⛔ ${auth.reason}`);

    // Button components
    if (interaction.type === 3) {
      const topic = (interaction.data?.custom_id ?? "").split(":")[1] ?? "dashboard";
      await audit(`discord_view_${topic}`, auth.user, "success");
      return await render(topic);
    }

    if (interaction.type === 2) {
      if (interaction.data?.name !== "terra") return text("Unknown command.");
      const sub = interaction.data.options?.[0];
      const topic = sub?.name ?? "dashboard";
      const opt = sub?.options?.[0]?.value;
      await audit(`discord_view_${topic}`, auth.user, "success", opt ? { query: String(opt).slice(0, 80) } : {});
      return await render(topic, opt ? String(opt) : undefined);
    }

    return json({ type: 4, data: { content: "Unsupported interaction.", flags: EPHEMERAL } });
  } catch (e) {
    console.error("discord-interactions failed:", e);
    return text("⚠️ Terra Explorer could not complete that request.");
  }
});
