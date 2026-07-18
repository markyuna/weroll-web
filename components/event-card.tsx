// Archivo: components/event-card.tsx
// Tarjeta de evento compartida entre /eventos y la landing.
// El título enlaza al evento y el grupo (si existe) enlaza al grupo; por eso
// la tarjeta ya no es un único <Link> gigante (evita anidar dos <a>).
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DIFFICULTY_STYLES, formatEventDateTime, type EventCardData } from "@/lib/events";

export async function EventCard({ event }: { event: EventCardData }) {
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
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-amber-400 transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/eventos/${event.id}`} className="text-lg font-semibold text-white hover:underline">
            {event.title}
          </Link>
          <p className="text-sm text-zinc-400 mt-1">
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
        {difficultyLabel && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle}`}>
            {difficultyLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 text-sm text-zinc-400">
        {event.distance_km != null && <span>{event.distance_km} km</span>}
        <span className="text-amber-400 font-medium">
          {t("attendeeCount", { count: attendeeCount })}
        </span>
      </div>
    </div>
  );
}
