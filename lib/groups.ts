import type { SupabaseClient } from "@supabase/supabase-js";

export type GroupCardData = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  country: string | null;
  member_count: { count: number }[];
};

export function getGroups(supabase: SupabaseClient, options: { city?: string } = {}) {
  let query = supabase
    .from("groups")
    .select("id, name, description, city, country, member_count:group_members(count)")
    .order("name", { ascending: true });

  if (options.city) {
    query = query.ilike("city", `%${options.city}%`);
  }

  return query.overrideTypes<GroupCardData[], { merge: false }>();
}
