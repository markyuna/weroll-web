// Archivo: app/[locale]/eventos/[id]/page.tsx
// Server Component: detalle de un evento, asistentes confirmados y RSVP.
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTY_STYLES, formatEventDateTime } from "@/lib/events";
import {
  RECURRENCE_SUMMARY_KEYS,
  formatRuleTime,
  formatRuleWeekday,
  nextOccurrences,
  parseRule,
} from "@/lib/recurrence";
import { RouteDisplayMapLoader } from "@/components/route-display-map-loader";
import { EventLocationMapLoader } from "@/components/event-location-map-loader";
import { InviteBuddiesPanel } from "@/components/invite-buddies-panel";
import { getMyBuddies, getBuddyOrganizerIds } from "@/lib/buddy-requests";
import { getInvitationExclusionSet } from "@/lib/invitations";
import { getActiveEventStories, getSeenStoryIds } from "@/lib/event-stories";
import { StoryTray } from "@/components/story-tray";
import { StoryComposer } from "@/components/story-composer";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { RsvpButtons } from "./rsvp-buttons";

export default async function EventoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const t = await getTranslations("EventoDetalle");
  const tDifficulty = await getTranslations("Difficulty");
  const tEdit = await getTranslations("EventoEditar");
  const tRecurrence = await getTranslations("Recurrence");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, organizer_id, starts_at, difficulty, distance_km, route_polyline, recurrence_rule, parent_event_id, latitude, longitude, spots!spot_id ( name, city, country, description ), groups ( id, name ), pause_spot:spots!pause_spot_id ( name, latitude, longitude ), organizer:profiles!organizer_id ( username, display_name, avatar_url )"
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
        recurrence_rule: string | null;
        parent_event_id: string | null;
        latitude: number | null;
        longitude: number | null;
        spots: { name: string; city: string | null; country: string | null; description: string | null } | null;
        groups: { id: string; name: string } | null;
        pause_spot: { name: string; latitude: number; longitude: number } | null;
        organizer: { username: string; display_name: string | null; avatar_url: string | null } | null;
      } | null,
      { merge: false }
    >();

  if (!event) {
    notFound();
  }

  // Serie recurrente: ?occurrence=<ISO> muestra una instancia virtual (una
  // fecha futura calculada de la regla que aún no existe en la base). Si esa
  // fecha ya se materializó, redirigimos al evento hijo real.
  const rule =
    event.recurrence_rule && !event.parent_event_id ? parseRule(event.recurrence_rule) : null;
  let virtualStartsAt: string | null = null;

  if (rule && typeof sp.occurrence === "string") {
    const requested = new Date(sp.occurrence);
    if (!Number.isNaN(requested.getTime())) {
      const { data: children } = await supabase
        .from("events")
        .select("id, starts_at")
        .eq("parent_event_id", event.id)
        .overrideTypes<{ id: string; starts_at: string }[], { merge: false }>();

      const existing = children?.find(
        (child) => new Date(child.starts_at).getTime() === requested.getTime()
      );
      if (existing) {
        redirect({ href: `/eventos/${existing.id}`, locale });
      }

      const baseStartsAt = new Date(event.starts_at);
      const excludeTimes = new Set(
        (children ?? []).map((child) => new Date(child.starts_at).getTime())
      );
      excludeTimes.add(baseStartsAt.getTime());
      const upcoming = nextOccurrences(rule, baseStartsAt, {
        after: new Date(),
        count: 4,
        excludeTimes,
      });
      if (upcoming.some((occurrence) => occurrence.getTime() === requested.getTime())) {
        virtualStartsAt = requested.toISOString();
      }
    }
  }

  const isVirtual = virtualStartsAt !== null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  type AttendeeRow = {
    profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
  };

  const isOrganizer = user?.id === event.organizer_id;

  // Una instancia virtual todavía no tiene fila propia, así que tampoco
  // tiene asistentes ni RSVP previo del usuario.
  const [{ data: attendees }, { data: myAttendance }, myBuddies, organizerBuddyIds] = await Promise.all([
    isVirtual
      ? Promise.resolve({ data: [] as AttendeeRow[] })
      : supabase
          .from("event_attendees")
          .select("profiles ( username, display_name, avatar_url )")
          .eq("event_id", id)
          .eq("status", "asistire")
          .order("responded_at", { ascending: true })
          .overrideTypes<AttendeeRow[], { merge: false }>(),
    user && !isVirtual
      ? supabase
          .from("event_attendees")
          .select("status")
          .eq("event_id", id)
          .eq("profile_id", user.id)
          .maybeSingle()
          .overrideTypes<{ status: string } | null, { merge: false }>()
      : Promise.resolve({ data: null as { status: string } | null }),
    isOrganizer && user ? getMyBuddies(supabase, user.id) : Promise.resolve([]),
    user && !isOrganizer ? getBuddyOrganizerIds(supabase, user.id, [event.organizer_id]) : Promise.resolve(new Set<string>()),
  ]);
  const isOrganizerBuddy = organizerBuddyIds.has(event.organizer_id);

  // No mostrar en el picker a quien ya asiste o ya tiene una invitación
  // pendiente a este evento.
  let buddiesToInvite = myBuddies;
  if (isOrganizer && myBuddies.length > 0) {
    const excluded = await getInvitationExclusionSet(supabase, {
      type: "event",
      targetId: event.id,
      buddyIds: myBuddies.map((b) => b.id),
    });
    buddiesToInvite = myBuddies.filter((b) => !excluded.has(b.id));
  }

  const canPublishStory = isOrganizer || myAttendance?.status === "asistire";
  const activeStories = isVirtual ? [] : await getActiveEventStories(supabase, event.id);
  const seenStoryIds = user
    ? [...(await getSeenStoryIds(supabase, user.id, activeStories.map((s) => s.id)))]
    : [];
  const autoOpenStories = sp.stories === "1";

  const recurrenceSummary = rule
    ? tRecurrence(RECURRENCE_SUMMARY_KEYS[rule.freq], {
        day: formatRuleWeekday(rule.day, locale),
        time: formatRuleTime(rule, locale),
        nth: String(rule.nth ?? 1),
      })
    : null;

  const difficultyStyle =
    DIFFICULTY_STYLES[event.difficulty as string] ?? "bg-zinc-800 text-zinc-300";
  const difficultyLabel = event.difficulty
    ? (tDifficulty.has(event.difficulty) ? tDifficulty(event.difficulty) : event.difficulty)
    : null;

  return (
    <main className="relative min-h-screen bg-zinc-950 px-4 py-16 overflow-x-clip">
      {/* Acento único de las páginas de detalle: rejilla del hero, tenue. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-30" aria-hidden>
        <div className="hero-grid absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <Link href="/eventos" className="text-sm text-amber-400 hover:underline">
          {t("back")}
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="font-display text-4xl sm:text-5xl uppercase leading-[0.95] text-white tracking-tight">{event.title}</h1>
          {difficultyLabel && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle}`}
            >
              {difficultyLabel}
            </span>
          )}
        </div>

        {isOrganizer && (
          <Link
            href={`/eventos/${event.id}/editar`}
            className="inline-block text-sm text-amber-400 hover:underline mt-2"
          >
            {tEdit("editLink")}
          </Link>
        )}

        <p className="text-zinc-400 mt-1">
          {formatEventDateTime(virtualStartsAt ?? event.starts_at, locale)}
        </p>
        {recurrenceSummary && (
          <p className="text-sm text-amber-400 mt-1">
            <span aria-hidden>↻</span> {recurrenceSummary}
          </p>
        )}
        {isVirtual && <p className="text-sm text-zinc-500 mt-1">{tRecurrence("virtualHint")}</p>}
        {event.distance_km != null && (
          <p className="text-zinc-400 mt-1">{event.distance_km} km</p>
        )}
        {event.groups && (
          <Link href={`/grupos/${event.groups.id}`} className="inline-block text-sm text-amber-400 hover:underline mt-1">
            {event.groups.name}
          </Link>
        )}

        {event.organizer && (
          <Link
            href={`/u/${event.organizer.username}`}
            className="group/organizer mt-4 inline-flex items-center gap-2"
          >
            <Avatar
              username={event.organizer.username}
              avatarUrl={event.organizer.avatar_url}
              size={32}
              className={isOrganizerBuddy ? "ring-2 ring-amber-400/60" : "ring-2 ring-zinc-800"}
            />
            <span className="text-sm text-zinc-400">
              {t("organizerLabel")}{" "}
              <span className="text-zinc-200 group-hover/organizer:text-amber-400 transition">
                {event.organizer.display_name || event.organizer.username}
              </span>
              {isOrganizerBuddy && <span className="ml-1 text-amber-400">✓ {t("organizerBuddy")}</span>}
            </span>
          </Link>
        )}

        {(activeStories.length > 0 || canPublishStory) && !isVirtual && (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {activeStories.length > 0 && user && (
              <StoryTray
                stories={activeStories}
                viewerId={user.id}
                seenStoryIds={seenStoryIds}
                autoOpen={autoOpenStories}
              />
            )}
            {canPublishStory && user && <StoryComposer eventId={event.id} userId={user.id} />}
          </div>
        )}

        {event.description && (
          <p className="text-zinc-200 mt-6 leading-relaxed">{event.description}</p>
        )}

        <Card className="mt-8 p-5">
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
          ) : event.latitude != null && event.longitude != null ? (
            <div className="mt-3">
              <EventLocationMapLoader position={[event.latitude, event.longitude]} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">{t("meetingPointTbd")}</p>
          )}
        </Card>

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
              attendees={(attendees ?? []).flatMap((a) =>
                a.profiles
                  ? [
                      {
                        username: a.profiles.username,
                        displayName: a.profiles.display_name,
                        avatarUrl: a.profiles.avatar_url,
                      },
                    ]
                  : []
              )}
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
            materializeOccurrence={virtualStartsAt}
          />
        </div>

        {isOrganizer && !isVirtual && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
              {t("inviteBuddiesTitle")}
            </h2>
            <InviteBuddiesPanel eventId={event.id} buddies={buddiesToInvite} hasAnyBuddies={myBuddies.length > 0} />
          </div>
        )}

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
                      className="flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 py-1 pl-1 pr-3 text-sm text-zinc-200 hover:border-amber-400 hover:text-amber-400 transition"
                    >
                      <Avatar username={a.profiles.username} avatarUrl={a.profiles.avatar_url} size={22} />
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
