import type { SupabaseClient } from "@supabase/supabase-js";

export const BADGE_IDS = ["primera_rando", "organizador", "explorador", "madrugador"] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export const BADGE_ICONS: Record<string, string> = {
  primera_rando: "🎉",
  organizador: "🗓️",
  explorador: "🧭",
  madrugador: "🌅",
};

// level = floor(sqrt(xp / 100)) + 1  ⇔  el nivel L empieza en xp = (L-1)² * 100
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100;
}

export function getLevelProgress(xp: number) {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const span = nextLevelXp - currentLevelXp;
  const progress = span > 0 ? Math.min(1, Math.max(0, (xp - currentLevelXp) / span)) : 1;

  return { level, currentLevelXp, nextLevelXp, progress };
}

export type GamificationData = {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
  earnedBadgeIds: Set<string>;
  allBadges: { id: string; sort_order: number }[];
};

export async function getGamificationData(
  supabase: SupabaseClient,
  userId: string
): Promise<GamificationData> {
  const [{ data: xpRows }, { data: earnedBadges }, { data: allBadges }] = await Promise.all([
    supabase.from("xp_events").select("points").eq("user_id", userId),
    supabase.from("user_badges").select("badge_id").eq("user_id", userId),
    supabase.from("badges").select("id, sort_order").order("sort_order", { ascending: true }),
  ]);

  const totalXp = ((xpRows as { points: number }[] | null) ?? []).reduce(
    (sum, row) => sum + row.points,
    0
  );
  const earnedBadgeIds = new Set(
    ((earnedBadges as { badge_id: string }[] | null) ?? []).map((row) => row.badge_id)
  );

  return {
    totalXp,
    earnedBadgeIds,
    allBadges: (allBadges as { id: string; sort_order: number }[] | null) ?? [],
    ...getLevelProgress(totalXp),
  };
}
