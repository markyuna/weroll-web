// Archivo: app/[locale]/eventos/[id]/page.tsx
// Server Component: detalle de un evento, asistentes confirmados y RSVP.
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTY_STYLES, formatEventDateTime } from "@/lib/events";
import { RouteDisplayMapLoader } from "@/components/route-display-map-loader";
import { RsvpButtons } from "./rsvp-buttons";

export default async function EventoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("EventoDetalle");
  const tDifficulty = await getTranslations("Difficulty");
  const tEdit = await getTranslations("EventoEditar");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, organizer_id, starts_at, difficulty, distance_km, route_polyline, spots!spot_id ( name, city, country, description ), groups ( id, name ), pause_spot:spots!pause_spot_id ( name, latitude, longitude )"
    )
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<
      {
        id: string;
        title: string;
        description: string | null;
        organizer_id: string;
        starts_at: string;
        difficulty: string | null;
        distance_km: number | null;
        route_polyline: [number, number][] | null;
        spots: { name: string; city: string | null; country: string | null; description: string | null } | null;
        groups: { id: string; name: string } | null;
        pause_spot: { name: string; latitude: number; longitude: number } | null;
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
  const difficultyLabel = event.difficulty
    ? (tDifficulty.has(event.difficulty) ? tDifficulty(event.difficulty) : event.difficulty)
    : null;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/eventos" className="text-sm text-amber-400 hover:underline">
          {t("back")}
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-white">{event.title}</h1>
          {difficultyLabel && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle}`}
            >
              {difficultyLabel}
            </span>
          )}
        </div>

        {user?.id === event.organizer_id && (
          <Link
            href={`/eventos/${event.id}/editar`}
            className="inline-block text-sm text-amber-400 hover:underline mt-2"
          >
            {tEdit("editLink")}
          </Link>
        )}

        <p className="text-zinc-400 mt-1">{formatEventDateTime(event.starts_at, locale)}</p>
        {event.distance_km != null && (
          <p className="text-zinc-400 mt-1">{event.distance_km} km</p>
        )}
        {event.groups && (
          <Link href={`/grupos/${event.groups.id}`} className="inline-block text-sm text-amber-400 hover:underline mt-1">
            {event.groups.name}
          </Link>
        )}

        {event.description && (
          <p className="text-zinc-200 mt-6 leading-relaxed">{event.description}</p>
        )}

        <div className="mt-8 rounded-xl bg-zinc-900 border border-zinc-800 p-5">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
            {t("meetingPoint")}
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
            <p className="mt-2 text-sm text-zinc-400">{t("meetingPointTbd")}</p>
          )}
        </div>

        {event.route_polyline && event.route_polyline.length > 1 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
              {t("routeTitle")}
            </h2>
            <RouteDisplayMapLoader
              points={event.route_polyline}
              pauseSpot={
                event.pause_spot
                  ? { name: event.pause_spot.name, position: [event.pause_spot.latitude, event.pause_spot.longitude] }
                  : null
              }
            />
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            {t("rsvpTitle")}
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
            {t("attendeesTitle", { count: attendees?.length ?? 0 })}
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
                    {t("unknownUser")}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">{t("noAttendees")}</p>
          )}
        </div>
      </div>
    </main>
  );
}
