// Archivo: components/spot-card.tsx
// Tarjeta de spot: nombre, ciudad, calidad del pavimento, próximas randonnées,
// último reporte de estado y botón para reportar.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { QualityStars } from "./quality-stars";
import { SpotReportBadge } from "./spot-report-badge";
import { ReportButton } from "./report-button";
import type { SpotData } from "@/lib/spots";
import type { SpotReport } from "@/lib/spot-reports";
import { Card } from "./card";

export async function SpotCard({
  spot,
  userId,
  report,
}: {
  spot: SpotData;
  userId: string | null;
  report: SpotReport | null;
}) {
  const t = await getTranslations("Spots");
  const upcomingCount = spot.upcoming_count?.[0]?.count ?? 0;
  const location = [spot.city, spot.country].filter(Boolean).join(", ");

  return (
    <Card className="h-full p-5">
      <h3 className="text-lg font-semibold text-white">{spot.name}</h3>
      {location && <p className="text-sm text-zinc-400 mt-1">{location}</p>}

      <div className="mt-3">
        <QualityStars quality={spot.surface_quality} label={t("qualityLabel", { value: spot.surface_quality ?? 0 })} />
      </div>

      {spot.description && (
        <p className="text-sm text-zinc-400 mt-3">{spot.description}</p>
      )}

      <SpotReportBadge report={report} />

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-amber-400 font-medium">
          {t("upcomingCount", { count: upcomingCount })}
        </span>
        <Link
          href={`/eventos?spot=${spot.id}`}
          className="text-sm text-zinc-300 hover:text-amber-400 transition"
        >
          {t("viewEvents")}
        </Link>
      </div>

      <div className="mt-2">
        <ReportButton spotId={spot.id} userId={userId} />
      </div>
    </Card>
  );
}
