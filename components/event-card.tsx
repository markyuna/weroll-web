// Archivo: components/event-card.tsx
// Tarjeta de evento compartida entre /eventos y la landing.
import Link from "next/link";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_STYLES,
  formatEventDateTime,
  type EventCardData,
} from "@/lib/events";

export function EventCard({ event }: { event: EventCardData }) {
  const attendeeCount = event.attendee_count?.[0]?.count ?? 0;
  const city = event.spots?.city;
  const difficultyStyle = DIFFICULTY_STYLES[event.difficulty as string] ?? "bg-zinc-800 text-zinc-300";
  const difficultyLabel = DIFFICULTY_LABELS[event.difficulty as string] ?? event.difficulty;

  return (
    <Link
      href={`/eventos/${event.id}`}
      className="block rounded-xl bg-zinc-900 border border-zinc-800 p-5 hover:border-amber-400 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <p className="text-sm text-zinc-400 mt-1">
            {formatEventDateTime(event.starts_at)}
            {city ? ` · ${city}` : ""}
          </p>
        </div>
        {event.difficulty && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyle}`}>
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
  );
}
