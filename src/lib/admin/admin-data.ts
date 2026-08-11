/**
 * Live admin data layer — every function here talks to the Lovable Cloud backend.
 * Access is enforced server-side by RLS policies / security-definer guards,
 * so these calls simply fail for non-admins.
 */
import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended" | "banned";
  registeredAt: string;
  lastLoginAt: string | null;
  xp: number;
  country: string;
}

export interface Donation {
  id: string;
  supporter: string;
  amount: number;
  method: string;
  message: string | null;
  createdAt: string;
}

export interface ModEntry {
  id: string;
  name: string;
  author: string;
  version: string;
  status: "pending" | "approved" | "rejected";
  downloads: number;
  featured: boolean;
  submittedAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  kind: "terrain" | "landmark";
  description: string;
  media: number;
  published: boolean;
  updatedAt: string;
}

export interface FeedbackItem {
  id: string;
  user: string;
  type: "feedback" | "feature" | "bug";
  title: string;
  detail: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  kind: "login" | "failed_login" | "admin_action" | "session";
  actor: string;
  detail: string;
  ip: string | null;
  at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | "supporters" | "admins";
  channel: "in_app" | "email" | "release_note";
  publishedAt: string | null;
}

export interface AppSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  primaryColor: string;
  theme: "dark" | "light" | "system";
  maintenanceMode: boolean;
  features: { key: string; label: string; enabled: boolean }[];
}

export const APP_VERSION = "2.4.0";

/* ------------------------------------------------------------------ users */

interface AdminUserRow {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  status: string | null;
  registered_at: string;
  last_login_at: string | null;
  xp: number | null;
  country: string | null;
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data: res, error } = await supabase.functions.invoke("app-data", {
    body: { action: "admin_list_users" },
  });
  if (error) throw error;
  return ((res?.data ?? []) as AdminUserRow[]).map((u) => ({
    id: u.id,
    displayName: u.display_name ?? "Explorer",
    email: u.email ?? "",
    avatarUrl: u.avatar_url,
    role: (u.role ?? "user") as AdminUser["role"],
    status: (u.status ?? "active") as AdminUser["status"],
    registeredAt: u.registered_at,
    lastLoginAt: u.last_login_at,
    xp: u.xp ?? 0,
    country: u.country ?? "—",
  }));
}

export async function setUserStatus(id: string, status: AdminUser["status"]) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) throw error;
  await logSecurityEvent("admin_action", `Set user ${id} status to ${status}`);
}

/* -------------------------------------------------------------- donations */

export async function listDonations(): Promise<Donation[]> {
  const { data, error } = await supabase
    .from("donations")
    .select("id, amount, payment_method, message, created_at, user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const names = await displayNames(ids);
  return rows.map((d) => ({
    id: d.id,
    supporter: names[d.user_id] ?? "Anonymous",
    amount: Number(d.amount),
    method: d.payment_method,
    message: d.message,
    createdAt: d.created_at,
  }));
}

async function displayNames(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.display_name ?? "Explorer"]));
}

/* ------------------------------------------------------------------- mods */

export async function listMods(): Promise<ModEntry[]> {
  const { data, error } = await supabase
    .from("mods")
    .select("id, name, author, version, status, downloads, featured, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    author: m.author,
    version: m.version,
    status: (m.status ?? "pending") as ModEntry["status"],
    downloads: m.downloads ?? 0,
    featured: !!m.featured,
    submittedAt: m.created_at,
  }));
}

export async function updateMod(id: string, patch: Partial<Pick<ModEntry, "status" | "featured">>) {
  const { error } = await supabase.from("mods").update(patch).eq("id", id);
  if (error) throw error;
  await logSecurityEvent("admin_action", `Updated mod ${id}: ${JSON.stringify(patch)}`);
}

/* ---------------------------------------------------------------- content */

export async function listContent(): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from("content_items")
    .select("id, title, kind, description, media_count, published, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    kind: (c.kind ?? "terrain") as ContentItem["kind"],
    description: c.description ?? "",
    media: c.media_count ?? 0,
    published: !!c.published,
    updatedAt: c.updated_at,
  }));
}

export async function saveContent(id: string, patch: { description?: string; published?: boolean; title?: string }) {
  const { error } = await supabase.from("content_items").update(patch).eq("id", id);
  if (error) throw error;
}

export async function createContent(title: string, kind: ContentItem["kind"]) {
  const { error } = await supabase.from("content_items").insert({ title, kind });
  if (error) throw error;
}

/* --------------------------------------------------------------- feedback */

export async function listFeedback(): Promise<FeedbackItem[]> {
  const { data, error } = await supabase
    .from("feedback")
    .select("id, user_id, type, title, detail, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const names = await displayNames([...new Set(rows.map((r) => r.user_id))]);
  return rows.map((f) => ({
    id: f.id,
    user: names[f.user_id] ?? "Explorer",
    type: (f.type ?? "feedback") as FeedbackItem["type"],
    title: f.title,
    detail: f.detail ?? "",
    status: (f.status ?? "open") as FeedbackItem["status"],
    createdAt: f.created_at,
  }));
}

export async function setFeedbackStatus(id: string, status: FeedbackItem["status"]) {
  const { error } = await supabase.from("feedback").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function submitFeedback(input: { type: FeedbackItem["type"]; title: string; detail: string }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You must be signed in to send feedback.");
  const { error } = await supabase.from("feedback").insert({ ...input, user_id: auth.user.id });
  if (error) throw error;
}

/* --------------------------------------------------------------- security */

export async function listSecurityEvents(): Promise<SecurityEvent[]> {
  const { data, error } = await supabase
    .from("security_events")
    .select("id, kind, actor, detail, ip, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((e) => ({
    id: e.id,
    kind: (e.kind ?? "admin_action") as SecurityEvent["kind"],
    actor: e.actor,
    detail: e.detail ?? "",
    ip: e.ip,
    at: e.created_at,
  }));
}

export async function logSecurityEvent(kind: SecurityEvent["kind"], detail: string) {
  const { data: auth } = await supabase.auth.getUser();
  await supabase.from("security_events").insert({
    kind,
    detail,
    actor: auth.user?.email ?? "system",
  });
}

/* ---------------------------------------------------------- announcements */

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, audience, channel, published_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body ?? "",
    audience: (a.audience ?? "all") as Announcement["audience"],
    channel: (a.channel ?? "in_app") as Announcement["channel"],
    publishedAt: a.published_at,
  }));
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  audience: Announcement["audience"];
  channel: Announcement["channel"];
  publish: boolean;
}) {
  const { error } = await supabase.from("announcements").insert({
    title: input.title,
    body: input.body,
    audience: input.audience,
    channel: input.channel,
    published_at: input.publish ? new Date().toISOString() : null,
  });
  if (error) throw error;
}

/* ----------------------------------------------------------- app settings */

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("site_name, tagline, support_email, primary_color, theme, maintenance_mode, features")
    .maybeSingle();
  if (error) throw error;
  return {
    siteName: data?.site_name ?? "Terra Explorer",
    tagline: data?.tagline ?? "",
    supportEmail: data?.support_email ?? "",
    primaryColor: data?.primary_color ?? "#3ba9ff",
    theme: (data?.theme ?? "dark") as AppSettings["theme"],
    maintenanceMode: !!data?.maintenance_mode,
    features: (data?.features as AppSettings["features"]) ?? [],
  };
}

export async function saveAppSettings(s: AppSettings) {
  const { error } = await supabase
    .from("app_settings")
    .update({
      site_name: s.siteName,
      tagline: s.tagline,
      support_email: s.supportEmail,
      primary_color: s.primaryColor,
      theme: s.theme,
      maintenance_mode: s.maintenanceMode,
      features: s.features,
    })
    .eq("id", true);
  if (error) throw error;
}

/* --------------------------------------------------------------- overview */

export interface Overview {
  totalUsers: number;
  activeWeek: number;
  signupsToday: number;
  totalDonations: number;
  totalTerrains: number;
  totalLandmarks: number;
  totalModDownloads: number;
  maintenanceMode: boolean;
  avgSessionMinutes: number;
}

export interface AnalyticsData {
  signups: { date: string; value: number }[];
  cumulative: { month: string; value: number }[];
  topBiomes: { name: string; visits: number }[];
  popularLandmarks: { name: string; visits: number }[];
  avgSessionMinutes: number;
  graphics: { name: string; pct: number }[];
  themes: { name: string; pct: number }[];
  countries: { name: string; pct: number }[];
}

const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export async function getAnalytics(): Promise<{ overview: Overview; analytics: AnalyticsData }> {
  const [profilesRes, statsRes, donationsRes, contentRes, modsRes, shotsRes, settingsRes, appSettings] =
    await Promise.all([
      supabase.from("profiles").select("id, created_at, country"),
      supabase.from("user_stats").select("id, time_spent_seconds, updated_at"),
      supabase.from("donations").select("amount"),
      supabase.from("content_items").select("kind, title, media_count, published"),
      supabase.from("mods").select("downloads"),
      supabase.from("community_screenshots").select("biome"),
      supabase.from("user_settings").select("graphics, theme"),
      getAppSettings(),
    ]);

  const profiles = profilesRes.data ?? [];
  const stats = statsRes.data ?? [];
  const donations = donationsRes.data ?? [];
  const content = contentRes.data ?? [];
  const mods = modsRes.data ?? [];
  const shots = shotsRes.data ?? [];
  const settings = settingsRes.data ?? [];

  const today = dayKey(new Date());
  const weekAgo = Date.now() - 7 * 864e5;

  const signups = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5);
    const key = dayKey(d);
    return {
      date: key.slice(5),
      value: profiles.filter((p) => dayKey(p.created_at) === key).length,
    };
  });

  const cumulative = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i), 1);
    d.setHours(23, 59, 59, 999);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
    return {
      month: d.toLocaleString(undefined, { month: "short" }),
      value: profiles.filter((p) => new Date(p.created_at).getTime() <= end).length,
    };
  });

  const avgSessionMinutes = stats.length
    ? Math.round((stats.reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0) / stats.length / 60) * 10) / 10
    : 0;

  const pct = <T,>(rows: T[], pick: (r: T) => string | null) => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      const k = pick(r);
      if (!k) return;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
    return [...counts.entries()]
      .map(([name, n]) => ({ name, pct: Math.round((n / total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6);
  };

  const biomeCounts = new Map<string, number>();
  shots.forEach((s) => biomeCounts.set(s.biome, (biomeCounts.get(s.biome) ?? 0) + 1));

  return {
    overview: {
      totalUsers: profiles.length,
      activeWeek: stats.filter((s) => new Date(s.updated_at).getTime() >= weekAgo).length,
      signupsToday: profiles.filter((p) => dayKey(p.created_at) === today).length,
      totalDonations: donations.reduce((s, d) => s + Number(d.amount), 0),
      totalTerrains: content.filter((c) => c.kind === "terrain").length,
      totalLandmarks: content.filter((c) => c.kind === "landmark").length,
      totalModDownloads: mods.reduce((s, m) => s + (m.downloads ?? 0), 0),
      maintenanceMode: appSettings.maintenanceMode,
      avgSessionMinutes,
    },
    analytics: {
      signups,
      cumulative,
      topBiomes: [...biomeCounts.entries()]
        .map(([name, visits]) => ({ name, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5),
      popularLandmarks: content
        .filter((c) => c.kind === "landmark")
        .map((c) => ({ name: c.title, visits: c.media_count ?? 0 }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5),
      avgSessionMinutes,
      graphics: pct(settings, (s) => s.graphics),
      themes: pct(settings, (s) => s.theme),
      countries: pct(profiles, (p) => p.country),
    },
  };
}

/* ------------------------------------------------------------------- csv */

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------- players */

export interface PlayerRow {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  distance: number;
  collectibles: number;
  terrains: number;
  minutes: number;
  status: string;
}

export async function listPlayers(): Promise<PlayerRow[]> {
  const [profilesRes, statsRes, progressRes] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url, status"),
    supabase.from("user_stats").select("id, distance_explored, collectibles_found, terrains_generated, time_spent_seconds"),
    supabase.from("user_progress").select("user_id, xp, level"),
  ]);
  const stats = new Map((statsRes.data ?? []).map((s) => [s.id, s]));
  const prog = new Map((progressRes.data ?? []).map((p) => [p.user_id, p]));
  return (profilesRes.data ?? [])
    .map((p) => {
      const s = stats.get(p.id);
      const g = prog.get(p.id);
      return {
        id: p.id,
        displayName: p.display_name ?? "Explorer",
        avatarUrl: p.avatar_url,
        xp: g?.xp ?? 0,
        level: g?.level ?? 1,
        distance: Number(s?.distance_explored ?? 0),
        collectibles: s?.collectibles_found ?? 0,
        terrains: s?.terrains_generated ?? 0,
        minutes: Math.round((s?.time_spent_seconds ?? 0) / 60),
        status: p.status ?? "active",
      };
    })
    .sort((a, b) => b.xp - a.xp);
}

export async function grantXp(userId: string, amount: number) {
  const { error } = await supabase.functions.invoke("game-progress", {
    body: { action: "grant_xp", user_id: userId, amount },
  });
  if (error) throw error;
}

/* ---------------------------------------------------------- media library */

export interface MediaItem {
  id: string;
  title: string;
  imageUrl: string;
  biome: string;
  author: string;
  createdAt: string;
}

export async function listMedia(): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from("community_screenshots")
    .select("id, title, image_url, biome, created_at, user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const names = await displayNames([...new Set(rows.map((r) => r.user_id))]);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    biome: r.biome,
    author: names[r.user_id] ?? "Explorer",
    createdAt: r.created_at,
  }));
}

export async function deleteMedia(id: string) {
  const { error } = await supabase.from("community_screenshots").delete().eq("id", id);
  if (error) throw error;
  await logSecurityEvent("admin_action", `Removed screenshot ${id}`);
}

export async function deleteContent(id: string) {
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) throw error;
}

/* --------------------------------------------------------- system health */

export interface HealthCheck {
  name: string;
  ok: boolean;
  detail: string;
  ms: number;
}

async function timed(name: string, fn: () => Promise<unknown>): Promise<HealthCheck> {
  const t0 = performance.now();
  try {
    await fn();
    return { name, ok: true, detail: "Operational", ms: Math.round(performance.now() - t0) };
  } catch (e) {
    return { name, ok: false, detail: e instanceof Error ? e.message : "Unavailable", ms: Math.round(performance.now() - t0) };
  }
}

export async function getSystemHealth(): Promise<HealthCheck[]> {
  const must = async (p: PromiseLike<{ error: unknown }>) => {
    const { error } = await p;
    if (error) throw error;
  };
  return Promise.all([
    timed("Database", () => must(supabase.from("profiles").select("id", { count: "exact", head: true }))),
    timed("Authentication", () => supabase.auth.getSession()),
    timed("Storage", () => must(supabase.storage.from("mods").list("", { limit: 1 }).then((r) => ({ error: null })))),
    timed("Leaderboard API", () => must(supabase.functions.invoke("app-data", { body: { action: "leaderboard", limit: 1 } }))),
    timed("Admin API", () => must(supabase.functions.invoke("app-data", { body: { action: "admin_list_users" } }))),
    timed("Settings", () => getAppSettings()),
  ]);
}
