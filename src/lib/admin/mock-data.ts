/**
 * Mock data layer for the Admin Panel.
 *
 * Every export here is shaped like the eventual backend response so each
 * section can swap `mockX` for a real query without touching components.
 * Example: `const users = await listUsers()` → replace body with a
 * supabase.from("profiles").select(...) call, keep the return type.
 */

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: "admin" | "moderator" | "user";
  status: "active" | "suspended" | "banned";
  registeredAt: string;
  lastLoginAt: string;
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
  ip: string;
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

const iso = (daysAgo: number, h = 12) =>
  new Date(Date.now() - daysAgo * 864e5 - h * 36e5).toISOString();

export const APP_VERSION = "2.4.0";
export const BUILD_SHA = "a7f3c91";

export const mockOverview = {
  totalUsers: 12847,
  onlineUsers: 218,
  visitorsToday: 3912,
  registeredUsers: 12847,
  activeSessions: 341,
  totalDonations: 184320,
  totalTerrains: 68,
  totalLandmarks: 142,
  totalModDownloads: 45210,
  websiteStatus: "operational" as "operational" | "degraded" | "maintenance",
  appVersion: APP_VERSION,
};

const NAMES = [
  "Aarav Mehta", "Sofia Rossi", "Liam O'Brien", "Yuki Tanaka", "Noah Becker",
  "Amara Okafor", "Elena Petrova", "Diego Alvarez", "Chloe Dubois", "Rishit Sharma",
  "Mia Andersen", "Omar Haddad", "Grace Kim", "Lucas Silva", "Ines Ferreira",
];
const COUNTRIES = ["India", "USA", "Germany", "Japan", "Brazil", "France", "Nigeria", "Italy"];

export const mockUsers: AdminUser[] = NAMES.map((displayName, i) => ({
  id: `usr_${(1000 + i).toString()}`,
  displayName,
  email: `${displayName.toLowerCase().replace(/[^a-z]/g, ".")}@example.com`,
  avatarUrl: null,
  role: i === 0 ? "admin" : i < 3 ? "moderator" : "user",
  status: i === 11 ? "suspended" : i === 13 ? "banned" : "active",
  registeredAt: iso(120 - i * 7),
  lastLoginAt: iso(i % 9, i),
  xp: 12000 - i * 640,
  country: COUNTRIES[i % COUNTRIES.length],
}));

export const mockAnalytics = {
  dau: Array.from({ length: 14 }, (_, i) => ({
    date: iso(13 - i).slice(5, 10),
    value: 1800 + Math.round(Math.sin(i / 2) * 400) + i * 45,
  })),
  mau: Array.from({ length: 6 }, (_, i) => ({
    month: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"][i],
    value: 24000 + i * 2600,
  })),
  topTerrains: [
    { name: "Himalayan Ridge", visits: 8420 },
    { name: "Dudhsagar Falls", visits: 7310 },
    { name: "Sahara Dunes", visits: 5980 },
    { name: "Arctic Shelf", visits: 4120 },
    { name: "Amazon Basin", visits: 3640 },
  ],
  popularLandmarks: [
    { name: "Mount Everest", visits: 6210 },
    { name: "Grand Canyon", visits: 5480 },
    { name: "Mount Fuji", visits: 4390 },
    { name: "Uluru", visits: 2870 },
  ],
  avgSessionMinutes: 14.7,
  browsers: [
    { name: "Chrome", pct: 62 },
    { name: "Safari", pct: 21 },
    { name: "Edge", pct: 10 },
    { name: "Firefox", pct: 7 },
  ],
  devices: [
    { name: "Desktop", pct: 54 },
    { name: "Mobile", pct: 39 },
    { name: "Tablet", pct: 7 },
  ],
  countries: [
    { name: "India", pct: 34 },
    { name: "United States", pct: 22 },
    { name: "Germany", pct: 11 },
    { name: "Japan", pct: 9 },
    { name: "Brazil", pct: 8 },
    { name: "Other", pct: 16 },
  ],
};

export const mockDonations: Donation[] = [
  { id: "don_01", supporter: "Aarav Mehta", amount: 2500, method: "UPI", message: "Love the terrain engine!", createdAt: iso(0, 2) },
  { id: "don_02", supporter: "Sofia Rossi", amount: 1200, method: "UPI", message: null, createdAt: iso(0, 7) },
  { id: "don_03", supporter: "Liam O'Brien", amount: 5000, method: "Card", message: "Keep shipping.", createdAt: iso(1, 3) },
  { id: "don_04", supporter: "Yuki Tanaka", amount: 800, method: "UPI", message: "Fuji looks amazing", createdAt: iso(2, 5) },
  { id: "don_05", supporter: "Amara Okafor", amount: 3200, method: "Card", message: null, createdAt: iso(3, 9) },
  { id: "don_06", supporter: "Diego Alvarez", amount: 450, method: "UPI", message: "Thanks!", createdAt: iso(5, 1) },
  { id: "don_07", supporter: "Elena Petrova", amount: 7600, method: "Card", message: "For the 3D printing feature", createdAt: iso(8, 4) },
];

export const mockMods: ModEntry[] = [
  { id: "mod_01", name: "Volcanic Biome Pack", author: "Rishit Sharma", version: "1.2.0", status: "pending", downloads: 0, featured: false, submittedAt: iso(0, 4) },
  { id: "mod_02", name: "Retro Explorer Skin", author: "Mia Andersen", version: "2.0.1", status: "approved", downloads: 8420, featured: true, submittedAt: iso(12) },
  { id: "mod_03", name: "Hyper Water Shader", author: "Lucas Silva", version: "0.9.4", status: "approved", downloads: 15230, featured: true, submittedAt: iso(30) },
  { id: "mod_04", name: "Cursed Textures", author: "anon_dev", version: "1.0.0", status: "rejected", downloads: 0, featured: false, submittedAt: iso(6) },
  { id: "mod_05", name: "Low-Poly Trees", author: "Grace Kim", version: "1.4.2", status: "approved", downloads: 6110, featured: false, submittedAt: iso(21) },
];

export const mockContent: ContentItem[] = [
  { id: "ct_01", title: "Dudhsagar Falls", kind: "terrain", description: "Four-tiered waterfall terrain with volumetric mist.", media: 8, published: true, updatedAt: iso(2) },
  { id: "ct_02", title: "Sahara Dunes", kind: "terrain", description: "Wind-shaped dune field with heat haze.", media: 5, published: true, updatedAt: iso(9) },
  { id: "ct_03", title: "Mount Everest", kind: "landmark", description: "Highest point above sea level, 8,849 m.", media: 12, published: true, updatedAt: iso(4) },
  { id: "ct_04", title: "Atacama Plateau", kind: "terrain", description: "Draft terrain awaiting height data.", media: 1, published: false, updatedAt: iso(1) },
  { id: "ct_05", title: "Uluru", kind: "landmark", description: "Sandstone monolith in Central Australia.", media: 6, published: true, updatedAt: iso(15) },
];

export const mockFeedback: FeedbackItem[] = [
  { id: "fb_01", user: "Chloe Dubois", type: "bug", title: "Minimap freezes on biome switch", detail: "Happens on Safari 17 after 3 switches.", status: "open", createdAt: iso(0, 3) },
  { id: "fb_02", user: "Noah Becker", type: "feature", title: "Add STL scale presets", detail: "1:50000 and 1:25000 would help printing.", status: "in_progress", createdAt: iso(2) },
  { id: "fb_03", user: "Omar Haddad", type: "feedback", title: "Loading screen is gorgeous", detail: "Just wanted to say it feels premium.", status: "resolved", createdAt: iso(5) },
  { id: "fb_04", user: "Ines Ferreira", type: "bug", title: "Donation QR not scanning on iOS", detail: "Contrast too low in light mode.", status: "resolved", createdAt: iso(7) },
  { id: "fb_05", user: "Liam O'Brien", type: "feature", title: "Multiplayer exploration", detail: "Shared sessions with friends.", status: "open", createdAt: iso(11) },
];

export const mockSecurity: SecurityEvent[] = [
  { id: "se_01", kind: "failed_login", actor: "unknown@mail.ru", detail: "Invalid password (attempt 4)", ip: "185.220.101.4", at: iso(0, 1) },
  { id: "se_02", kind: "admin_action", actor: "Aarav Mehta", detail: "Suspended user usr_1011", ip: "49.36.12.88", at: iso(0, 3) },
  { id: "se_03", kind: "login", actor: "Sofia Rossi", detail: "Signed in with password", ip: "93.42.18.201", at: iso(0, 6) },
  { id: "se_04", kind: "session", actor: "Yuki Tanaka", detail: "Session revoked by admin", ip: "126.11.4.72", at: iso(1, 2) },
  { id: "se_05", kind: "admin_action", actor: "Aarav Mehta", detail: "Approved mod mod_02", ip: "49.36.12.88", at: iso(1, 8) },
  { id: "se_06", kind: "failed_login", actor: "grace.kim@example.com", detail: "Invalid password (attempt 1)", ip: "203.0.113.9", at: iso(2, 5) },
];

export const mockAnnouncements: Announcement[] = [
  { id: "an_01", title: "Terra Explorer 2.4 is live", body: "Real-time day/night cycle and character customization.", audience: "all", channel: "release_note", publishedAt: iso(3) },
  { id: "an_02", title: "Scheduled maintenance", body: "Backend upgrade on Sunday 02:00–03:00 UTC.", audience: "all", channel: "in_app", publishedAt: iso(9) },
  { id: "an_03", title: "Supporter badge refresh", body: "New platinum tier artwork for supporters.", audience: "supporters", channel: "email", publishedAt: null },
];

export const mockSettings = {
  siteName: "Terra Explorer",
  tagline: "Explore Earth in stunning 3D",
  supportEmail: "support@terraexplorer.app",
  primaryColor: "#3ba9ff",
  theme: "dark" as "dark" | "light" | "system",
  maintenanceMode: false,
  features: [
    { key: "mods", label: "Community mods", enabled: true },
    { key: "donations", label: "Donations", enabled: true },
    { key: "multiplayer", label: "Multiplayer (beta)", enabled: false },
    { key: "stl_export", label: "STL export", enabled: true },
    { key: "community", label: "Community feed", enabled: true },
  ],
};

export const mockDeveloper = {
  build: { version: APP_VERSION, sha: BUILD_SHA, builtAt: iso(0, 5), node: "20.11.0", bundleKb: 1284 },
  repo: { name: "terra-explorer/web", branch: "main", openPRs: 3, openIssues: 11, lastCommit: "feat: explorer share flow" },
  deployments: [
    { id: "dp_01", env: "production", version: "2.4.0", status: "success", at: iso(0, 5) },
    { id: "dp_02", env: "preview", version: "2.4.0-rc.2", status: "success", at: iso(1, 3) },
    { id: "dp_03", env: "production", version: "2.3.9", status: "rolled_back", at: iso(4) },
    { id: "dp_04", env: "production", version: "2.3.8", status: "success", at: iso(9) },
  ],
  env: [
    { key: "VITE_SUPABASE_URL", value: "configured" },
    { key: "VITE_SUPABASE_PUBLISHABLE_KEY", value: "configured" },
    { key: "NODE_ENV", value: "production" },
    { key: "MOD_API_VERSION", value: "1.0.0" },
  ],
};

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
