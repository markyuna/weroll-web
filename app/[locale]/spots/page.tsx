// Archivo: app/[locale]/spots/page.tsx
// Server Component: consulta todos los spots, el nº de randonnées futuras y
// el último reporte de estado por spot; el mapa (Leaflet) vive aparte.
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getSpotsWithUpcomingCounts } from "@/lib/spots";
import { getRecentReportsBySpot } from "@/lib/spot-reports";
import { getActiveLiveSessions } from "@/lib/live-sessions";
import { SpotsMapLoader } from "@/components/spots-map-loader";
import { SpotCard } from "@/components/spot-card";

export default async function SpotsPage() {
  const t = await getTranslations("Spots");
  const supabase = await createClient();
  const [{ data: spots, error }, { data: { user } }, reportsBySpot, liveSessions] = await Promise.all([
    getSpotsWithUpcomingCounts(supabase),
    supabase.auth.getUser(),
    getRecentReportsBySpot(supabase),
    getActiveLiveSessions(supabase),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-1">
          {t.rich("title", {
            amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
          })}
        </h1>
        <p className="text-zinc-400 mb-8">{t("subtitle")}</p>

        {error && <p className="text-sm text-red-400 mb-6">{t("loadError")}</p>}

        <SpotsMapLoader
          spots={spots ?? []}
          userId={user?.id ?? null}
          reportsBySpot={reportsBySpot}
          initialLiveSessions={liveSessions}
        />

        {spots && spots.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 mt-8">
            {spots.map((spot) => (
              <li key={spot.id}>
                <SpotCard spot={spot} userId={user?.id ?? null} report={reportsBySpot[spot.id] ?? null} />
              </li>
            ))}
          </ul>
        ) : (
          !error && <p className="text-zinc-400 mt-8">{t("empty")}</p>
        )}
      </div>
    </main>
  );
}
