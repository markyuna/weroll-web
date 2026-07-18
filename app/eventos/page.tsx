// Archivo: app/eventos/page.tsx
// Server Component: lista las próximas randonnées, ordenadas por fecha.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingEvents } from "@/lib/events";
import { EventCard } from "@/components/event-card";

export default async function EventosPage() {
  const supabase = await createClient();

  const [{ data: events, error }, { data: { user } }] = await Promise.all([
    getUpcomingEvents(supabase),
    supabase.auth.getUser(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-3xl font-bold text-white">
            Próximas <span className="text-amber-400">randonnées</span>
          </h1>
          {user && (
            <Link
              href="/eventos/nuevo"
              className="shrink-0 rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition"
            >
              + Crear randonnée
            </Link>
          )}
        </div>
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
          {events?.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
