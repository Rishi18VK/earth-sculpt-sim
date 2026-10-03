/**
 * Posts Terra Explorer alerts to the configured Discord channel webhook.
 * Signed-in users only; admin-only for admin/security/test events.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const Body = z.object({
  kind: z.enum(["test", "admin", "security", "donation", "feedback"]),
  title: z.string().min(1).max(200),
  description: z.string().max(1500).optional(),
  fields: z.record(z.string().max(300)).optional(),
});

const COLORS = { test: 0x22d3ee, admin: 0x6366f1, security: 0xef4444, donation: 0x22c55e, feedback: 0xf59e0b };

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const WEBHOOK = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!WEBHOOK) return json({ error: "Discord webhook not configured" }, 500);

  const auth = req.headers.get("Authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) return json({ error: "Unauthorized" }, 401);

  let parsed;
  try { parsed = Body.safeParse(await req.json()); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const b = parsed.data;

  if (["test", "admin", "security"].includes(b.kind)) {
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);
  }

  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Terra Explorer",
      embeds: [{
        title: b.title,
        description: b.description,
        color: COLORS[b.kind],
        fields: Object.entries(b.fields ?? {}).slice(0, 20).map(([name, value]) => ({ name, value: value || "—", inline: true })),
        footer: { text: `${b.kind} • ${u.user.email ?? "user"}` },
        timestamp: new Date().toISOString(),
      }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Discord webhook failed", res.status, t);
    return json({ error: "Discord webhook failed", status: res.status, details: t }, 502);
  }
  return json({ ok: true });
});
