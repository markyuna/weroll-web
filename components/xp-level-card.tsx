// Archivo: components/xp-level-card.tsx
// Server Component: XP total, nivel y barra de progreso hacia el siguiente.
import { getTranslations } from "next-intl/server";
import type { GamificationData } from "@/lib/gamification";

export async function XpLevelCard({ data }: { data: GamificationData }) {
  const t = await getTranslations("Gamification");
  const { totalXp, level, currentLevelXp, nextLevelXp, progress } = data;

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-semibold text-white">{t("level", { level })}</p>
        <p className="text-sm text-amber-400 font-medium">{t("xpTotal", { xp: totalXp })}</p>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 mt-1.5">
        {t("progressToNext", {
          current: totalXp - currentLevelXp,
          needed: nextLevelXp - currentLevelXp,
        })}
      </p>
    </div>
  );
}
