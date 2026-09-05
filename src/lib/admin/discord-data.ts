/**
 * Admin audit log + Discord integration data layer.
 * All privileged reads/writes are enforced server-side (RLS + edge functions).
 */
import { supabase } from "@/integrations/supabase/client";

export interface AuditEntry {
  id: string;
  actor: string;
  source: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditQuery {
  search?: string;
  action?: string;
  source?: string;
  since?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs(q: AuditQuery = {}): Promise<{ rows: AuditEntry[]; total: number }> {
  const pageSize = q.pageSize ?? 25;
  const page = q.page ?? 0;
  let query = supabase
    .from("admin_audit_logs")
    .select("id, actor_label, source, action, target_type, target_id, status, metadata, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (q.search) query = query.or(`action.ilike.%${q.search}%,actor_label.ilike.%${q.search}%`);
  if (q.action && q.action !== "all") query = query.eq("action", q.action);
  if (q.source && q.source !== "all") query = query.eq("source", q.source);
  if (q.since) query = query.gte("created_at", q.since);

  const { data, error, count } = await query;
  if (error) throw new Error("Could not load audit entries.");
  return {
    total: count ?? 0,
    rows: (data ?? []).map((r) => ({
      id: r.id,
      actor: r.actor_label,
      source: r.source,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      status: r.status,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
      createdAt: r.created_at,
    })),
  };
}

/** Best-effort audit write from the web dashboard. Never throws into the UI. */
export async function recordAdminAction(
  action: string,
  opts: { targetType?: string; targetId?: string; metadata?: Record<string, unknown>; status?: "success" | "error" } = {},
) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("admin_audit_logs").insert({
      actor_user_id: auth.user?.id ?? null,
      actor_label: auth.user?.email ?? "admin",
      source: "web",
      action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ?? null,
      metadata: (opts.metadata ?? {}) as never,
      status: opts.status ?? "success",
    });
  } catch {
    /* audit failures must never block an admin action */
  }
}

/* ------------------------------------------------------------------ discord */

export interface DiscordLink {
  id: string;
  discordUserId: string;
  discordUsername: string | null;
  note: string | null;
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface DiscordStatus {
  configured: {
    applicationId: boolean;
    publicKey: boolean;
    botToken: boolean;
    guildId: boolean;
    adminRoleId: boolean;
  };
  bot: { username: string } | null;
  guild: { name: string; memberCount: number | null } | null;
  botError: string | null;
  lastActivity: { action: string; actor_label: string; created_at: string } | null;
  interactionsUrl: string;
}

export async function getDiscordStatus(): Promise<DiscordStatus> {
  const { data, error } = await supabase.functions.invoke("discord-admin", { body: { action: "status" } });
  if (error) throw new Error("Could not reach the Discord integration service.");
  return data as DiscordStatus;
}

export async function registerDiscordCommands() {
  const { data, error } = await supabase.functions.invoke("discord-admin", {
    body: { action: "register_commands" },
  });
  if (error) throw new Error("Command registration failed. Check the Discord configuration.");
  return data as { ok: boolean; scope: string };
}

export async function listDiscordLinks(): Promise<DiscordLink[]> {
  const { data, error } = await supabase
    .from("discord_admin_links")
    .select("id, discord_user_id, discord_username, note, active, last_used_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load Discord admins.");
  return (data ?? []).map((r) => ({
    id: r.id,
    discordUserId: r.discord_user_id,
    discordUsername: r.discord_username,
    note: r.note,
    active: r.active,
    lastUsedAt: r.last_used_at,
    createdAt: r.created_at,
  }));
}

export async function addDiscordLink(input: { discordUserId: string; discordUsername?: string; note?: string }) {
  if (!/^\d{5,25}$/.test(input.discordUserId)) throw new Error("Enter a numeric Discord user ID.");
  const { error } = await supabase.from("discord_admin_links").insert({
    discord_user_id: input.discordUserId,
    discord_username: input.discordUsername?.trim() || null,
    note: input.note?.trim() || null,
  });
  if (error) throw new Error(error.code === "23505" ? "That Discord account is already linked." : "Could not add link.");
  await recordAdminAction("discord_link_added", { targetType: "discord_user", targetId: input.discordUserId });
}

export async function setDiscordLinkActive(id: string, active: boolean) {
  const { error } = await supabase.from("discord_admin_links").update({ active }).eq("id", id);
  if (error) throw new Error("Could not update link.");
  await recordAdminAction(active ? "discord_link_enabled" : "discord_link_disabled", {
    targetType: "discord_link",
    targetId: id,
  });
}

export async function removeDiscordLink(id: string) {
  const { error } = await supabase.from("discord_admin_links").delete().eq("id", id);
  if (error) throw new Error("Could not remove link.");
  await recordAdminAction("discord_link_removed", { targetType: "discord_link", targetId: id });
}
