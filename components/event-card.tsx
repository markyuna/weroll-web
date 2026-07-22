// Archivo: components/event-card.tsx
// Tarjeta de evento compartida entre /eventos y la landing.
// El título enlaza al evento y el grupo (si existe) enlaza al grupo; por eso
// la tarjeta ya no es un único <Link> gigante (evita anidar dos <a>).
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DIFFICULTY_STYLES, formatEventDateTime, type AttendeeAvatar, type EventCardData } from "@/lib/events";
import { Avatar } from "./avatar";
import { Card } from "./card";

export async function EventCard({
  event,
  href,
  recurring = false,
  attendeeAvatars,
  isBuddyOrganizer = false,
}: {
  event: EventCardData;
  /** Enlace alternativo, p. ej. una instancia virtual de un evento recurrente. */
  href?: string;
  recurring?: boolean;
  /** Hasta 4 avatares de asistentes confirmados, apilados junto al contador. */
  attendeeAvatars?: AttendeeAvatar[];
  /** El organizador es buddy aceptado del usuario que ve la tarjeta. */
  isBuddyOrganizer?: boolean;
}) {
  const locale = await getLocale();
  const t = await getTranslations("Eventos");
  const tDifficulty = await getTranslations("Difficulty");

  const attendeeCount = event.attendee_count?.[0]?.count ?? 0;
  const city = event.spots?.city;
  const difficultyStyle = DIFFICULTY_STYLES[event.difficulty as string] ?? "bg-zinc-800 text-zinc-300";
  const difficultyLabel = event.difficulty
    ? (tDifficulty.has(event.difficulty) ? tDifficulty(event.difficulty) : event.difficulty)
    : null;

  return (
    <Card interactive className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={href ?? `/eventos/${event.id}`} className="text-lg font-semibold text-white hover:underline">
            {event.title}
          </Link>
          <p className="text-sm text-zinc-400 mt-1">
            {recurring && <span className="text-amber-400 mr-1" aria-hidden>↻</span>}
            {formatEventDateTime(event.starts_at, locale)}
            {city ? ` · ${city}` : ""}
          </p>
          {event.groups && (
            <Link
              href={`/grupos/${event.groups.id}`}
              className="inline-block text-xs text-amber-400 hover:underline mt-1"
            >
              {event.groups.name}
            </Link>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {event.organizer && (
            <Link
              href={`/u/${event.organizer.username}`}
              className="group/organizer flex items-center gap-1.5"
            >
              <span className="text-right text-xs leading-tight text-zinc-500">
                {t("organizerLabel")}
                <br />
                <span className="text-zinc-300 group-hover/organizer:text-amber-400 transition">
                  {event.organizer.display_name || event.organizer.username}
                </span>
                {isBuddyOrganizer && <span className="ml-1 text-amber-400">✓ {t("organizerBuddy")}</span>}
              </span>
              <Avatar
                username={event.organizer.username}
                avatarUrl={event.organizer.avatar_url}
                size={28}
                className={isBuddyOrganizer ? "ring-2 ring-amber-400/60" : "ring-2 ring-zinc-800"}
              />
            </Link>
          )}
          {difficultyLabel && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle}`}>
              {difficultyLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm text-zinc-400">
        {event.distance_km != null && <span>{event.distance_km} km</span>}
        {attendeeAvatars && attendeeAvatars.length > 0 && (
          <span className="flex -space-x-2">
            {attendeeAvatars.map((a) => (
              <Avatar
                key={a.username}
                username={a.username}
                avatarUrl={a.avatar_url}
                size={24}
                className="ring-2 ring-zinc-900"
              />
            ))}
          </span>
        )}
        <span className="text-amber-400 font-medium">
          {t("attendeeCount", { count: attendeeCount })}
        </span>
      </div>
    </Card>
  );
}
