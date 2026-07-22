// Archivo: app/[locale]/eventos/page.tsx
// Server Component: lista las próximas randonnées, ordenadas por fecha.
// Acepta ?spot=<id> para filtrar por spot.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEventAttendeeAvatars,
  getUpcomingEvents,
  getVirtualInstances,
  type EventCardData,
} from "@/lib/events";
import { getBuddyOrganizerIds } from "@/lib/buddy-requests";
import { getStoryRingStatuses } from "@/lib/event-stories";
import { EventCard } from "@/components/event-card";
import { PageHeader, AmberChunk } from "@/components/page-header";
import { FilterChip } from "@/components/filter-chip";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("Eventos");
  const supabase = await createClient();
  const sp = await searchParams;
  const spotId = typeof sp.spot === "string" ? sp.spot : undefined;

  const [{ data: events, error }, virtualInstances, { data: { user } }, spotResult] = await Promise.all([
    getUpcomingEvents(supabase, { spotId }),
    getVirtualInstances(supabase, { spotId }),
    supabase.auth.getUser(),
    spotId
      ? supabase.from("spots").select("name, city").eq("id", spotId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const filterSpot = spotResult.data as { name: string; city: string | null } | null;

  // Avatares apilados: solo aplican a eventos reales (las instancias
  // virtuales no tienen asistentes todavía).
  const avatarsByEvent = await getEventAttendeeAvatars(
    supabase,
    (events ?? []).map((event) => event.id)
  );

  const allOrganizerIds = [
    ...(events ?? []).map((e) => e.organizer?.id).filter((id): id is string => Boolean(id)),
    ...virtualInstances.map((i) => i.event.organizer?.id).filter((id): id is string => Boolean(id)),
  ];
  const buddyOrganizerIds = user
    ? await getBuddyOrganizerIds(supabase, user.id, allOrganizerIds)
    : new Set<string>();

  const storyStatuses = user
    ? await getStoryRingStatuses(supabase, user.id, (events ?? []).map((e) => e.id))
    : new Map();

  // Eventos reales + instancias virtuales de las series recurrentes,
  // intercalados por fecha. Las virtuales enlazan al padre con ?occurrence=.
  type ListItem = { key: string; event: EventCardData; href?: string; recurring: boolean };
  const items: ListItem[] = [
    ...(events ?? []).map((event) => ({
      key: event.id,
      event,
      recurring: Boolean(event.recurrence_rule),
    })),
    ...virtualInstances.map((instance) => ({
      key: `${instance.parentId}-${instance.occurrenceIso}`,
      event: instance.event,
      href: `/eventos/${instance.parentId}?occurrence=${encodeURIComponent(instance.occurrenceIso)}`,
      recurring: true,
    })),
  ].sort(
    (a, b) => new Date(a.event.starts_at).getTime() - new Date(b.event.starts_at).getTime()
  );

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={t.rich("title", { amber: AmberChunk })}
          subtitle={t("subtitle")}
          action={
            user && (
              <Link
                href="/eventos/nuevo"
                className="inline-block rounded-lg bg-gradient-brand text-zinc-950 font-semibold px-4 py-2 text-sm shadow-glow transition duration-300 hover:shadow-glow-strong hover:-translate-y-0.5 hover:brightness-110"
              >
                {t("createCta")}
              </Link>
            )
          }
        />

        {spotId && (
          <div className="-mt-4 mb-6 flex items-center gap-2 text-sm">
            <span className="text-zinc-400">{t("filteringBy")}</span>
            <FilterChip href="/eventos">
              {filterSpot ? `${filterSpot.name}${filterSpot.city ? ` · ${filterSpot.city}` : ""}` : "—"}
              <span aria-hidden>✕</span>
              <span className="sr-only">{t("clearFilter")}</span>
            </FilterChip>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{t("loadError")}</p>}

        {!error && items.length === 0 && (
          <EmptyState emoji="🛼">
            <p>{spotId ? t("emptySpot") : t("empty")}</p>
          </EmptyState>
        )}

        <ul className="space-y-4">
          {items.map((item, i) => (
            <li key={item.key}>
              <Reveal delay={Math.min(i * 50, 250)}>
                <EventCard
                  event={item.event}
                  href={item.href}
                  recurring={item.recurring}
                  attendeeAvatars={item.href ? undefined : avatarsByEvent.get(item.event.id)}
                  isBuddyOrganizer={Boolean(item.event.organizer && buddyOrganizerIds.has(item.event.organizer.id))}
                  storyStatus={item.href ? "none" : (storyStatuses.get(item.event.id) ?? "none")}
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
