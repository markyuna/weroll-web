// Archivo: app/eventos/[id]/page.tsx
// Server Component: detalle de un evento, asistentes confirmados y RSVP.
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTY_LABELS, DIFFICULTY_STYLES, formatEventDateTime } from "@/lib/events";
import { RsvpButtons } from "./rsvp-buttons";

export default async function EventoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, starts_at, difficulty, distance_km, spots ( name, city, country, description )"
    )
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<
      {
        id: string;
        title: string;
        description: string | null;
        starts_at: string;
        difficulty: string | null;
        distance_km: number | null;
        spots: { name: string; city: string | null; country: string | null; description: string | null } | null;
      } | null,
      { merge: false }
    >();

  if (!event) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: attendees }, { data: myAttendance }] = await Promise.all([
    supabase
      .from("event_attendees")
      .select("profiles ( username )")
      .eq("event_id", id)
      .eq("status", "asistire")
      .order("responded_at", { ascending: true })
      .overrideTypes<{ profiles: { username: string } | null }[], { merge: false }>(),
    user
      ? supabase
          .from("event_attendees")
          .select("status")
          .eq("event_id", id)
          .eq("profile_id", user.id)
          .maybeSingle()
          .overrideTypes<{ status: string } | null, { merge: false }>()
      : Promise.resolve({ data: null as { status: string } | null }),
  ]);

  const difficultyStyle =
    DIFFICULTY_STYLES[event.difficulty as string] ?? "bg-zinc-800 text-zinc-300";
  const difficultyLabel = DIFFICULTY_LABELS[event.difficulty as string] ?? event.difficulty;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/eventos" className="text-sm text-amber-400 hover:underline">
          ← Volver a eventos
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">{event.title}</h1>
          {event.difficulty && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle}`}
            >
              {difficultyLabel}
            </span>
          )}
        </div>

        <p className="text-zinc-400 mt-1">{formatEventDateTime(event.starts_at)}</p>
        {event.distance_km != null && (
          <p className="text-zinc-400 mt-1">{event.distance_km} km</p>
        )}

        {event.description && (
          <p className="text-zinc-200 mt-6 leading-relaxed">{event.description}</p>
        )}

        <div className="mt-8 rounded-xl bg-zinc-900 border border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
            Punto de encuentro
          </h2>
          {event.spots ? (
            <div className="mt-2 text-zinc-200">
              <p className="font-medium">{event.spots.name}</p>
              {(event.spots.city || event.spots.country) && (
                <p className="text-sm text-zinc-400">
                  {[event.spots.city, event.spots.country].filter(Boolean).join(", ")}
                </p>
              )}
              {event.spots.description && (
                <p className="text-sm text-zinc-400 mt-2">{event.spots.description}</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">Por confirmar.</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            ¿Vienes?
          </h2>
          <RsvpButtons
            eventId={event.id}
            userId={user?.id ?? null}
            initialStatus={
              (myAttendance?.status as "asistire" | "tal_vez" | "no_asistire" | undefined) ?? null
            }
          />
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            Asistentes confirmados ({attendees?.length ?? 0})
          </h2>
          {attendees && attendees.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {attendees.map((a, i) =>
                a.profiles?.username ? (
                  <li key={i}>
                    <Link
                      href={`/u/${a.profiles.username}`}
                      className="block rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:border-amber-400 hover:text-amber-400 transition"
                    >
                      {a.profiles.username}
                    </Link>
                  </li>
                ) : (
                  <li
                    key={i}
                    className="rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-sm text-zinc-200"
                  >
                    usuario
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">Aún nadie ha confirmado. ¡Sé el primero!</p>
          )}
        </div>
      </div>
    </main>
  );
}
