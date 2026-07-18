import type { SupabaseClient } from "@supabase/supabase-js";

export type SpotData = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  surface_quality: number | null;
  upcoming_count: { count: number }[];
};

export function getSpotsWithUpcomingCounts(supabase: SupabaseClient) {
  return supabase
    .from("spots")
    .select(
      "id, name, description, city, country, latitude, longitude, surface_quality, upcoming_count:events(count)"
    )
    .gt("events.starts_at", new Date().toISOString())
    .order("name", { ascending: true })
    .overrideTypes<SpotData[], { merge: false }>();
}
