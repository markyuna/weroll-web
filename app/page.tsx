// Archivo: app/page.tsx
// Server Component: landing de WeRoll.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingEvents } from "@/lib/events";
import { EventCard } from "@/components/event-card";

export default async function Home() {
  const supabase = await createClient();

  const [{ data: events }, { data: { user } }] = await Promise.all([
    getUpcomingEvents(supabase, { limit: 3 }),
    supabase.auth.getUser(),
  ]);

  return (
    <main className="bg-zinc-950">
      <section className="px-4 pt-24 pb-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Encuentra tu próxima <span className="text-amber-400">randonnée</span>
          </h1>
          <p className="text-zinc-400 mt-4 text-lg">
            Descubre rutas de patinaje cerca de ti y entérate de quién más estará rodando.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link
              href="/eventos"
              className="w-full sm:w-auto rounded-lg bg-amber-400 text-zinc-950 font-semibold px-6 py-3 hover:bg-amber-300 transition"
            >
              Ver randonnées
            </Link>
            {user ? (
              <Link
                href="/eventos/nuevo"
                className="w-full sm:w-auto rounded-lg border border-zinc-700 text-zinc-200 font-semibold px-6 py-3 hover:border-amber-400 hover:text-amber-400 transition"
              >
                Crear randonnée
              </Link>
            ) : (
              <Link
                href="/registro"
                className="w-full sm:w-auto rounded-lg border border-zinc-700 text-zinc-200 font-semibold px-6 py-3 hover:border-amber-400 hover:text-amber-400 transition"
              >
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            Próximas <span className="text-amber-400">randonnées</span>
          </h2>

          {events && events.length > 0 ? (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-400">
              Todavía no hay randonnées programadas.{" "}
              <Link href="/eventos" className="text-amber-400 hover:underline">
                Sé el primero en crear una
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section className="px-4 pb-24 pt-16 border-t border-zinc-800">
        <div className="mx-auto max-w-3xl grid gap-8 sm:grid-cols-3 text-center">
          <div>
            <p className="text-amber-400 text-2xl font-bold mb-2">01</p>
            <h3 className="text-white font-semibold mb-1">Encuentra tu grupo</h3>
            <p className="text-sm text-zinc-400">
              Conecta con patinadores de tu ciudad y comparte cada randonnée.
            </p>
          </div>
          <div>
            <p className="text-amber-400 text-2xl font-bold mb-2">02</p>
            <h3 className="text-white font-semibold mb-1">Descubre spots</h3>
            <p className="text-sm text-zinc-400">
              Explora los puntos de encuentro habituales para rodar en cada ciudad.
            </p>
          </div>
          <div>
            <p className="text-amber-400 text-2xl font-bold mb-2">03</p>
            <h3 className="text-white font-semibold mb-1">Confirma tu asistencia</h3>
            <p className="text-sm text-zinc-400">
              Marca si asistirás, tal vez o no, y mira quién más se apunta.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
