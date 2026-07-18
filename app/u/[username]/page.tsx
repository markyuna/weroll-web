// Archivo: app/u/[username]/page.tsx
// Server Component público: perfil de cualquier usuario por username.
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/events";
import { SKATE_TYPE_LABELS } from "@/lib/profiles";

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, city, country, skate_type, skill_level, bio")
    .eq("username", username)
    .maybeSingle()
    .overrideTypes<
      {
        id: string;
        username: string;
        display_name: string | null;
        city: string | null;
        country: string | null;
        skate_type: string | null;
        skill_level: string | null;
        bio: string | null;
      } | null,
      { merge: false }
    >();

  if (!profile) {
    notFound();
  }

  const { data: upcoming } = await supabase
    .from("event_attendees")
    .select("events!inner ( id, title, starts_at )")
    .eq("profile_id", profile.id)
    .eq("status", "asistire")
    .gt("events.starts_at", new Date().toISOString())
    .order("starts_at", { referencedTable: "events", ascending: true })
    .overrideTypes<{ events: { id: string; title: string; starts_at: string } }[], { merge: false }>();

  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/eventos" className="text-sm text-amber-400 hover:underline">
          ← Volver a eventos
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4">
          {profile.display_name || profile.username}
        </h1>
        <p className="text-zinc-400">@{profile.username}</p>

        {location && <p className="text-zinc-400 mt-2">{location}</p>}

        {(profile.skate_type || profile.skill_level) && (
          <p className="text-zinc-400 mt-1">
            {profile.skate_type ? SKATE_TYPE_LABELS[profile.skate_type] ?? profile.skate_type : null}
            {profile.skate_type && profile.skill_level ? " · " : ""}
            {profile.skill_level
              ? profile.skill_level.charAt(0).toUpperCase() + profile.skill_level.slice(1)
              : null}
          </p>
        )}

        {profile.bio && <p className="text-zinc-200 mt-6 leading-relaxed">{profile.bio}</p>}

        <div className="mt-10">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            Próximas randonnées
          </h2>
          {upcoming && upcoming.length > 0 ? (
            <ul className="space-y-3">
              {upcoming.map((rsvp) => (
                <li key={rsvp.events.id}>
                  <Link
                    href={`/eventos/${rsvp.events.id}`}
                    className="block rounded-xl bg-zinc-900 border border-zinc-800 p-4 hover:border-amber-400 transition"
                  >
                    <p className="text-white font-medium">{rsvp.events.title}</p>
                    <p className="text-sm text-zinc-400">{formatEventDateTime(rsvp.events.starts_at)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">Sin randonnées próximas confirmadas.</p>
          )}
        </div>
      </div>
    </main>
  );
}
