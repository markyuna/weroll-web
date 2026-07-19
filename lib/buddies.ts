// Archivo: lib/buddies.ts
// Buddy Match: candidatos (misma ciudad o compañeros de grupo) ordenados por
// compatibilidad con el perfil propio. La puntuación es lexicográfica según
// el criterio pedido — mismo tipo de patín primero (peso 4), luego mismo
// nivel (2), luego mismo estilo (1) — así ningún par de criterios menores
// supera a uno mayor.
import type { SupabaseClient } from "@supabase/supabase-js";

export type BuddyCriteria = {
  id: string;
  city: string | null;
  skate_type: string | null;
  skate_style: string | null;
  skill_level: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  skate_type: string | null;
  skate_style: string | null;
  skill_level: string | null;
};

export type Buddy = ProfileRow & {
  score: number;
  matchesType: boolean;
  matchesLevel: boolean;
  matchesStyle: boolean;
};

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, city, country, skate_type, skate_style, skill_level";

// "ambos" es comodín: quien patina inline y quad es compatible con cualquiera
// que tenga tipo declarado, y viceversa.
function skateTypeMatches(mine: string | null, theirs: string | null): boolean {
  if (!mine || !theirs) return false;
  return mine === theirs || mine === "ambos" || theirs === "ambos";
}

export async function getBuddies(
  supabase: SupabaseClient,
  me: BuddyCriteria
): Promise<Buddy[]> {
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("profile_id", me.id)
    .overrideTypes<{ group_id: string }[], { merge: false }>();
  const groupIds = (myMemberships ?? []).map((m) => m.group_id);

  // Dos consultas separadas (ciudad / grupos) en vez de un .or(): el nombre
  // de ciudad es texto libre y embeberlo en la sintaxis or= de PostgREST es
  // frágil con comas o paréntesis.
  const [cityResult, groupResult] = await Promise.all([
    me.city
      ? supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .ilike("city", me.city)
          .neq("id", me.id)
          .overrideTypes<ProfileRow[], { merge: false }>()
      : Promise.resolve({ data: [] as ProfileRow[] }),
    groupIds.length > 0
      ? supabase
          .from("group_members")
          .select(`profiles ( ${PROFILE_COLUMNS} )`)
          .in("group_id", groupIds)
          .neq("profile_id", me.id)
          .overrideTypes<{ profiles: ProfileRow | null }[], { merge: false }>()
      : Promise.resolve({ data: [] as { profiles: ProfileRow | null }[] }),
  ]);

  const candidates = new Map<string, ProfileRow>();
  for (const row of cityResult.data ?? []) {
    candidates.set(row.id, row);
  }
  for (const row of groupResult.data ?? []) {
    if (row.profiles) candidates.set(row.profiles.id, row.profiles);
  }

  const buddies: Buddy[] = [...candidates.values()].map((profile) => {
    const matchesType = skateTypeMatches(me.skate_type, profile.skate_type);
    const matchesLevel = Boolean(me.skill_level) && me.skill_level === profile.skill_level;
    const matchesStyle = Boolean(me.skate_style) && me.skate_style === profile.skate_style;
    return {
      ...profile,
      matchesType,
      matchesLevel,
      matchesStyle,
      score: (matchesType ? 4 : 0) + (matchesLevel ? 2 : 0) + (matchesStyle ? 1 : 0),
    };
  });

  buddies.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
  return buddies;
}
