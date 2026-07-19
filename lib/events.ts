import type { SupabaseClient } from "@supabase/supabase-js";
import { nextOccurrences, parseRule } from "@/lib/recurrence";

export type Difficulty = "principiante" | "intermedio" | "avanzado";

export type EventCardData = {
  id: string;
  title: string;
  starts_at: string;
  difficulty: string | null;
  distance_km: number | null;
  recurrence_rule?: string | null;
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
      "id, title, starts_at, difficulty, distance_km, recurrence_rule, spots!spot_id ( city ), groups ( id, name ), attendee_count:event_attendees(count)"
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

export type AttendeeAvatar = { username: string; avatar_url: string | null };

/**
 * Hasta `perEvent` avatares de asistentes confirmados por evento, en orden
 * de respuesta, para las pilas de avatares de las tarjetas. Una sola consulta
 * batch para toda la lista.
 */
export async function getEventAttendeeAvatars(
  supabase: SupabaseClient,
  eventIds: string[],
  perEvent = 4
): Promise<Map<string, AttendeeAvatar[]>> {
  const byEvent = new Map<string, AttendeeAvatar[]>();
  if (eventIds.length === 0) return byEvent;

  const { data } = await supabase
    .from("event_attendees")
    .select("event_id, profiles ( username, avatar_url )")
    .in("event_id", eventIds)
    .eq("status", "asistire")
    .order("responded_at", { ascending: true })
    .overrideTypes<{ event_id: string; profiles: AttendeeAvatar | null }[], { merge: false }>();

  for (const row of data ?? []) {
    if (!row.profiles) continue;
    const list = byEvent.get(row.event_id) ?? [];
    if (list.length < perEvent) {
      list.push(row.profiles);
      byEvent.set(row.event_id, list);
    }
  }
  return byEvent;
}

export type VirtualInstance = {
  parentId: string;
  occurrenceIso: string;
  event: EventCardData;
};

/**
 * Próximas instancias virtuales de los eventos recurrentes: se calculan a
 * partir de recurrence_rule y NO existen en la base. Se excluyen la fecha del
 * propio evento padre (que ya es un evento real) y las instancias ya
 * materializadas (hijas con parent_event_id).
 */
export async function getVirtualInstances(
  supabase: SupabaseClient,
  options: { spotId?: string; groupId?: string; perEvent?: number } = {}
): Promise<VirtualInstance[]> {
  let query = supabase
    .from("events")
    .select(
      "id, title, starts_at, difficulty, distance_km, recurrence_rule, spots!spot_id ( city ), groups ( id, name )"
    )
    .not("recurrence_rule", "is", null)
    .is("parent_event_id", null);

  if (options.spotId) {
    query = query.eq("spot_id", options.spotId);
  }
  if (options.groupId) {
    query = query.eq("group_id", options.groupId);
  }

  const { data: parents } = await query.overrideTypes<
    {
      id: string;
      title: string;
      starts_at: string;
      difficulty: string | null;
      distance_km: number | null;
      recurrence_rule: string;
      spots: { city: string | null } | null;
      groups: { id: string; name: string } | null;
    }[],
    { merge: false }
  >();

  if (!parents || parents.length === 0) return [];

  const { data: children } = await supabase
    .from("events")
    .select("parent_event_id, starts_at")
    .in(
      "parent_event_id",
      parents.map((p) => p.id)
    )
    .overrideTypes<{ parent_event_id: string; starts_at: string }[], { merge: false }>();

  const materialized = new Map<string, Set<number>>();
  for (const child of children ?? []) {
    const set = materialized.get(child.parent_event_id) ?? new Set<number>();
    set.add(new Date(child.starts_at).getTime());
    materialized.set(child.parent_event_id, set);
  }

  const now = new Date();
  const instances: VirtualInstance[] = [];
  for (const parent of parents) {
    const rule = parseRule(parent.recurrence_rule);
    if (!rule) continue;

    const base = new Date(parent.starts_at);
    const excludeTimes = new Set(materialized.get(parent.id) ?? []);
    excludeTimes.add(base.getTime());

    for (const occurrence of nextOccurrences(rule, base, {
      after: now,
      count: options.perEvent ?? 4,
      excludeTimes,
    })) {
      instances.push({
        parentId: parent.id,
        occurrenceIso: occurrence.toISOString(),
        event: {
          id: parent.id,
          title: parent.title,
          starts_at: occurrence.toISOString(),
          difficulty: parent.difficulty,
          distance_km: parent.distance_km,
          recurrence_rule: parent.recurrence_rule,
          spots: parent.spots,
          groups: parent.groups,
          attendee_count: [],
        },
      });
    }
  }
  return instances;
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
