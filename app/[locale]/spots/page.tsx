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
import { PageHeader, AmberChunk } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";

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
        <PageHeader title={t.rich("title", { amber: AmberChunk })} subtitle={t("subtitle")} />

        {error && <p className="text-sm text-red-400 mb-6">{t("loadError")}</p>}

        <SpotsMapLoader
          spots={spots ?? []}
          userId={user?.id ?? null}
          reportsBySpot={reportsBySpot}
          initialLiveSessions={liveSessions}
        />

        {spots && spots.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 mt-8">
            {spots.map((spot, i) => (
              <li key={spot.id}>
                <Reveal delay={(i % 2) * 50} className="h-full">
                  <SpotCard spot={spot} userId={user?.id ?? null} report={reportsBySpot[spot.id] ?? null} />
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          !error && (
            <EmptyState emoji="🗺️" className="mt-8">
              <p>{t("empty")}</p>
            </EmptyState>
          )
        )}
      </div>
    </main>
  );
}
