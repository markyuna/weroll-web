// Archivo: components/badges-grid.tsx
// Server Component: grid de badges; los no obtenidos salen en gris/opacos.
import { getTranslations } from "next-intl/server";
import { BADGE_ICONS } from "@/lib/gamification";

export async function BadgesGrid({
  allBadges,
  earnedBadgeIds,
}: {
  allBadges: { id: string; sort_order: number }[];
  earnedBadgeIds: Set<string>;
}) {
  const t = await getTranslations("Badges");

  if (allBadges.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {allBadges.map((badge) => {
        const earned = earnedBadgeIds.has(badge.id);
        return (
          <div
            key={badge.id}
            title={t(`${badge.id}.description`)}
            className={`rounded-xl border p-3 text-center transition ${
              earned
                ? "border-amber-400/40 bg-amber-400/5"
                : "border-zinc-800 bg-zinc-900 opacity-40 grayscale"
            }`}
          >
            <p className="text-2xl">{BADGE_ICONS[badge.id] ?? "🏅"}</p>
            <p className={`text-xs mt-1 font-medium ${earned ? "text-white" : "text-zinc-500"}`}>
              {t(`${badge.id}.name`)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
