import type { SupabaseClient } from "@supabase/supabase-js";

export type Difficulty = "principiante" | "intermedio" | "avanzado";

export type EventCardData = {
  id: string;
  title: string;
  starts_at: string;
  difficulty: string | null;
  distance_km: number | null;
  spots: { city: string | null } | null;
  attendee_count: { count: number }[];
};

export function getUpcomingEvents(
  supabase: SupabaseClient,
  options: { limit?: number; spotId?: string } = {}
) {
  let query = supabase
    .from("events")
    .select(
      "id, title, starts_at, difficulty, distance_km, spots ( city ), attendee_count:event_attendees(count)"
    )
    .gt("starts_at", new Date().toISOString())
    .eq("event_attendees.status", "asistire")
    .order("starts_at", { ascending: true });

  if (options.spotId) {
    query = query.eq("spot_id", options.spotId);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query.overrideTypes<EventCardData[], { merge: false }>();
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const DIFFICULTY_STYLES: Record<string, string> = {
  principiante: "bg-emerald-400/10 text-emerald-400",
  intermedio: "bg-amber-400/10 text-amber-400",
  avanzado: "bg-rose-400/10 text-rose-400",
};

export const RSVP_LABELS: Record<string, string> = {
  asistire: "Asistiré",
  tal_vez: "Tal vez",
  no_asistire: "No asistiré",
};

export const RSVP_STYLES: Record<string, string> = {
  asistire: "bg-emerald-400/10 text-emerald-400",
  tal_vez: "bg-amber-400/10 text-amber-400",
  no_asistire: "bg-zinc-800 text-zinc-400",
};

export function formatEventDateTime(iso: string): string {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
