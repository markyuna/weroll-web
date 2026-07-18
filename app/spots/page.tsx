// Archivo: app/spots/page.tsx
// Server Component: consulta todos los spots y el nº de randonnées futuras
// por spot; el mapa interactivo (Leaflet) vive en un client component aparte.
import { createClient } from "@/lib/supabase/server";
import { getSpotsWithUpcomingCounts } from "@/lib/spots";
import { SpotsMapLoader } from "@/components/spots-map-loader";
import { SpotCard } from "@/components/spot-card";

export default async function SpotsPage() {
  const supabase = await createClient();
  const { data: spots, error } = await getSpotsWithUpcomingCounts(supabase);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-1">
          <span className="text-amber-400">Spots</span> de patinaje
        </h1>
        <p className="text-zinc-400 mb-8">
          Los puntos de encuentro y rutas habituales de la comunidad.
        </p>

        {error && (
          <p className="text-sm text-red-400 mb-6">
            No se pudieron cargar los spots. Inténtalo de nuevo más tarde.
          </p>
        )}

        <SpotsMapLoader spots={spots ?? []} />

        {spots && spots.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 mt-8">
            {spots.map((spot) => (
              <li key={spot.id}>
                <SpotCard spot={spot} />
              </li>
            ))}
          </ul>
        ) : (
          !error && <p className="text-zinc-400 mt-8">Todavía no hay spots registrados.</p>
        )}
      </div>
    </main>
  );
}
