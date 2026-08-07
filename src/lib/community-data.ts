import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  distanceKm: number;
  collectibles: number;
  terrains: number;
}

export interface CommunityShot {
  id: string;
  userId: string;
  author: string;
  avatarUrl: string | null;
  title: string;
  imageUrl: string;
  biome: string;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface CommunityCreator {
  userId: string;
  name: string;
  avatarUrl: string | null;
  mods: number;
  downloads: number;
}

export interface AchievementRow {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_leaderboard", { _limit: limit });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    userId: r.user_id,
    name: r.display_name ?? "Explorer",
    avatarUrl: r.avatar_url,
    xp: r.xp ?? 0,
    level: r.level ?? 1,
    distanceKm: Math.round(Number(r.distance_explored ?? 0)),
    collectibles: r.collectibles_found ?? 0,
    terrains: r.terrains_generated ?? 0,
  }));
}

export async function fetchScreenshots(): Promise<CommunityShot[]> {
  const [{ data: shots, error }, { data: auth }] = await Promise.all([
    supabase
      .from("community_screenshots")
      .select("id, user_id, title, image_url, biome, created_at")
      .order("created_at", { ascending: false })
      .limit(48),
    supabase.auth.getUser(),
  ]);
  if (error) throw error;
  const rows = shots ?? [];
  if (!rows.length) return [];

  const ids = [...new Set(rows.map((r) => r.user_id))];
  const [{ data: profiles }, { data: likes }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids),
    supabase.from("community_likes").select("screenshot_id, user_id"),
  ]);

  const byUser = new Map((profiles ?? []).map((p) => [p.id, p]));
  const me = auth.user?.id;

  return rows.map((s) => {
    const mine = (likes ?? []).filter((l) => l.screenshot_id === s.id);
    return {
      id: s.id,
      userId: s.user_id,
      author: byUser.get(s.user_id)?.display_name ?? "Explorer",
      avatarUrl: byUser.get(s.user_id)?.avatar_url ?? null,
      title: s.title,
      imageUrl: s.image_url,
      biome: s.biome,
      likes: mine.length,
      likedByMe: !!me && mine.some((l) => l.user_id === me),
      createdAt: s.created_at,
    };
  });
}

export async function toggleLike(screenshotId: string, liked: boolean) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to like screenshots.");
  if (liked) {
    const { error } = await supabase
      .from("community_likes")
      .delete()
      .eq("screenshot_id", screenshotId)
      .eq("user_id", auth.user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("community_likes")
      .insert({ screenshot_id: screenshotId, user_id: auth.user.id });
    if (error) throw error;
  }
}

export async function shareScreenshot(input: { title: string; imageUrl: string; biome: string }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to share a screenshot.");
  const { error } = await supabase.from("community_screenshots").insert({
    user_id: auth.user.id,
    title: input.title,
    image_url: input.imageUrl,
    biome: input.biome,
  });
  if (error) throw error;
}

export async function fetchCreators(): Promise<CommunityCreator[]> {
  const { data, error } = await supabase
    .from("mods")
    .select("user_id, author, downloads")
    .eq("enabled", true);
  if (error) throw error;
  const map = new Map<string, CommunityCreator>();
  (data ?? []).forEach((m) => {
    const key = m.user_id ?? m.author;
    const prev = map.get(key);
    map.set(key, {
      userId: key,
      name: m.author,
      avatarUrl: null,
      mods: (prev?.mods ?? 0) + 1,
      downloads: (prev?.downloads ?? 0) + (m.downloads ?? 0),
    });
  });
  return [...map.values()].sort((a, b) => b.downloads - a.downloads || b.mods - a.mods).slice(0, 6);
}

export async function fetchAchievements(): Promise<AchievementRow[]> {
  const [{ data: all, error }, { data: auth }] = await Promise.all([
    supabase.from("achievements").select("id, code, title, description, icon, xp_reward").order("xp_reward"),
    supabase.auth.getUser(),
  ]);
  if (error) throw error;
  let unlockedIds: string[] = [];
  if (auth.user) {
    const { data: mine } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", auth.user.id);
    unlockedIds = (mine ?? []).map((m) => m.achievement_id);
  }
  return (all ?? []).map((a) => ({
    id: a.id,
    code: a.code,
    title: a.title,
    description: a.description ?? "",
    icon: a.icon ?? "🏆",
    xpReward: a.xp_reward ?? 0,
    unlocked: unlockedIds.includes(a.id),
  }));
}

export async function fetchCommunityStats() {
  const [{ count: explorers }, { count: shots }, { data: active }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("community_screenshots").select("id", { count: "exact", head: true }),
    supabase.from("user_progress").select("updated_at"),
  ]);
  const dayAgo = Date.now() - 864e5;
  return {
    explorers: explorers ?? 0,
    shots: shots ?? 0,
    activeToday: (active ?? []).filter((p) => new Date(p.updated_at).getTime() >= dayAgo).length,
  };
}
