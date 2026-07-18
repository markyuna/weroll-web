import type { SupabaseClient } from "@supabase/supabase-js";

export type Difficulty = "principiante" | "intermedio" | "avanzado";

export type EventCardData = {
  id: string;
  title: string;
  starts_at: string;
  difficulty: string | null;
  distance_km: number | null;
  spots: { city: string | null } | null;
  groups: { id: string; name: string } | null;
  attendee_count: { count: number }[];
};

export function getUpcomingEvents(
  supabase: SupabaseClient,
  options: { limit?: number; spotId?: string; groupId?: string } = {}
) {
  let query = supabase
    .from("events")
    .select(
      "id, title, starts_at, difficulty, distance_km, spots!spot_id ( city ), groups ( id, name ), attendee_count:event_attendees(count)"
    )
    .gt("starts_at", new Date().toISOString())
    .eq("event_attendees.status", "asistire")
    .order("starts_at", { ascending: true });

  if (options.spotId) {
    query = query.eq("spot_id", options.spotId);
  }
  if (options.groupId) {
    query = query.eq("group_id", options.groupId);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  return query.overrideTypes<EventCardData[], { merge: false }>();
}

// Las etiquetas (Principiante/Asistiré/...) viven en los mensajes de
// next-intl, namespaces "Difficulty" y "Rsvp" — solo los estilos son fijos.
export const DIFFICULTY_STYLES: Record<string, string> = {
  principiante: "bg-emerald-400/10 text-emerald-400",
  intermedio: "bg-amber-400/10 text-amber-400",
  avanzado: "bg-rose-400/10 text-rose-400",
};

export const RSVP_STYLES: Record<string, string> = {
  asistire: "bg-emerald-400/10 text-emerald-400",
  tal_vez: "bg-amber-400/10 text-amber-400",
  no_asistire: "bg-zinc-800 text-zinc-400",
};

const DATE_LOCALES: Record<string, string> = {
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
};

export function formatEventDateTime(iso: string, locale: string): string {
  const formatted = new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
