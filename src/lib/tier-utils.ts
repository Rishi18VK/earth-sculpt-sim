export type Tier = "none" | "bronze" | "silver" | "gold" | "platinum";

export const TIER_THRESHOLDS: Record<Exclude<Tier, "none">, number> = {
  bronze: 99,
  silver: 499,
  gold: 1999,
  platinum: 4999,
};

export const TIER_META: Record<Tier, { label: string; emoji: string; className: string }> = {
  none: { label: "Supporter", emoji: "✨", className: "bg-muted text-muted-foreground" },
  bronze: { label: "Bronze", emoji: "🥉", className: "tier-bronze" },
  silver: { label: "Silver", emoji: "🥈", className: "tier-silver" },
  gold: { label: "Gold", emoji: "🥇", className: "tier-gold" },
  platinum: { label: "Platinum", emoji: "👑", className: "tier-platinum" },
};

export function tierFor(amount: number): Tier {
  if (amount >= TIER_THRESHOLDS.platinum) return "platinum";
  if (amount >= TIER_THRESHOLDS.gold) return "gold";
  if (amount >= TIER_THRESHOLDS.silver) return "silver";
  if (amount >= TIER_THRESHOLDS.bronze) return "bronze";
  return "none";
}

export function nextTier(t: Tier): { next: Tier; threshold: number } | null {
  const order: Tier[] = ["none", "bronze", "silver", "gold", "platinum"];
  const idx = order.indexOf(t);
  if (idx < 0 || idx >= order.length - 1) return null;
  const next = order[idx + 1] as Exclude<Tier, "none">;
  return { next, threshold: TIER_THRESHOLDS[next] };
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}
export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, into: remaining, needed: xpForLevel(level) };
}
