// Archivo: app/api/profiles/search/route.ts
// Búsqueda de patinadores por username o nombre visible, usada por el campo
// de búsqueda de /buddies. Dos consultas ilike separadas en vez de un
// .or() (ver lib/buddies.ts): la query del usuario es texto libre y podría
// romper la sintaxis or= de PostgREST si trae comas o paréntesis.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_RESULTS = 20;

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  skate_type: string | null;
};

const PROFILE_COLUMNS = "id, username, display_name, avatar_url, city, skate_type";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${query}%`;
  const [byUsername, byDisplayName] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .ilike("username", pattern)
      .limit(MAX_RESULTS)
      .overrideTypes<ProfileRow[], { merge: false }>(),
    supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .ilike("display_name", pattern)
      .limit(MAX_RESULTS)
      .overrideTypes<ProfileRow[], { merge: false }>(),
  ]);

  const merged = new Map<string, ProfileRow>();
  for (const row of byUsername.data ?? []) merged.set(row.id, row);
  for (const row of byDisplayName.data ?? []) merged.set(row.id, row);

  const results = [...merged.values()]
    .sort((a, b) => a.username.localeCompare(b.username))
    .slice(0, MAX_RESULTS);

  return NextResponse.json({ results });
}
