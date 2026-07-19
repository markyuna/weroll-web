// Archivo: lib/live-sessions.ts
// Tipos y consultas de las sesiones en vivo "Roll with me".
import type { SupabaseClient } from "@supabase/supabase-js";

export type LiveSessionProfile = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type LiveSessionRow = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  message: string | null;
  skate_type: string | null;
  started_at: string;
  expires_at: string;
};

export type LiveSession = LiveSessionRow & { profiles: LiveSessionProfile | null };

export const LIVE_SESSION_DURATIONS_H = [1, 2, 3] as const;

// Redondeo de privacidad: 0.003° de latitud ≈ 333 m (en longitud algo menos,
// según la latitud). La posición exacta nunca sale del navegador.
const COORD_STEP = 0.003;
export function roundCoordinate(value: number): number {
  return Math.round(value / COORD_STEP) * COORD_STEP;
}

export async function getActiveLiveSessions(supabase: SupabaseClient): Promise<LiveSession[]> {
  const { data } = await supabase
    .from("live_sessions")
    .select(
      "id, user_id, latitude, longitude, message, skate_type, started_at, expires_at, profiles ( username, display_name, avatar_url )"
    )
    .gt("expires_at", new Date().toISOString())
    .order("started_at", { ascending: true })
    .overrideTypes<LiveSession[], { merge: false }>();
  return data ?? [];
}
