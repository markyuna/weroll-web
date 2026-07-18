// Archivo: app/eventos/page.tsx
// Server Component: lista las próximas randonnées, ordenadas por fecha.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTY_LABELS, DIFFICULTY_STYLES, formatEventDateTime } from "@/lib/events";

export default async function EventosPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, title, starts_at, difficulty, distance_km, spots ( city ), attendee_count:event_attendees(count)"
    )
    .gt("starts_at", new Date().toISOString())
    .eq("event_attendees.status", "asistire")
    .order("starts_at", { ascending: true })
    .overrideTypes<
      {
        id: string;
        title: string;
        starts_at: string;
        difficulty: string | null;
        distance_km: number | null;
        spots: { city: string | null } | null;
        attendee_count: { count: number }[];
      }[],
      { merge: false }
    >();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-1">
          Próximas <span className="text-amber-400">randonnées</span>
        </h1>
        <p className="text-zinc-400 mb-8">
          Encuentra tu próxima ruta y confirma tu asistencia.
        </p>

        {error && (
          <p className="text-sm text-red-400">
            No se pudieron cargar los eventos. Inténtalo de nuevo más tarde.
          </p>
        )}

        {!error && (!events || events.length === 0) && (
          <p className="text-zinc-400">
            No hay randonnées programadas por ahora. ¡Vuelve pronto!
          </p>
        )}

        <ul className="space-y-4">
          {events?.map((event) => {
            const attendeeCount = event.attendee_count?.[0]?.count ?? 0;
            const city = event.spots?.city;
            const difficultyStyle =
              DIFFICULTY_STYLES[event.difficulty as string] ?? "bg-zinc-800 text-zinc-300";
            const difficultyLabel =
              DIFFICULTY_LABELS[event.difficulty as string] ?? event.difficulty;

            return (
              <li key={event.id}>
                <Link
                  href={`/eventos/${event.id}`}
                  className="block rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-amber-400 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{event.title}</h2>
                      <p className="text-sm text-zinc-400 mt-1">
                        {formatEventDateTime(event.starts_at)}
                        {city ? ` · ${city}` : ""}
                      </p>
                    </div>
                    {event.difficulty && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle}`}
                      >
                        {difficultyLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-zinc-400">
                    {event.distance_km != null && <span>{event.distance_km} km</span>}
                    <span className="text-amber-400 font-medium">
                      {attendeeCount} {attendeeCount === 1 ? "asistente" : "asistentes"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
