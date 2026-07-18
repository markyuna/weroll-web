// Archivo: app/[locale]/u/[username]/page.tsx
// Server Component público: perfil de cualquier usuario por username.
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/events";

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const t = await getTranslations("PerfilPublico");
  const tSkateType = await getTranslations("SkateType");
  const tSkateStyle = await getTranslations("SkateStyle");
  const tDifficulty = await getTranslations("Difficulty");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, city, country, skate_type, skate_style, skill_level, bio")
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
        skate_style: string | null;
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
  const skateTypeLabel =
    profile.skate_type && tSkateType.has(profile.skate_type)
      ? tSkateType(profile.skate_type)
      : profile.skate_type;
  const skateStyleLabel =
    profile.skate_style && tSkateStyle.has(profile.skate_style)
      ? tSkateStyle(profile.skate_style)
      : profile.skate_style;
  const skillLevelLabel =
    profile.skill_level && tDifficulty.has(profile.skill_level)
      ? tDifficulty(profile.skill_level)
      : profile.skill_level;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/eventos" className="text-sm text-amber-400 hover:underline">
          {t("back")}
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4">
          {profile.display_name || profile.username}
        </h1>
        <p className="text-zinc-400">@{profile.username}</p>

        {location && <p className="text-zinc-400 mt-2">{location}</p>}

        {(skateTypeLabel || skateStyleLabel || skillLevelLabel) && (
          <p className="text-zinc-400 mt-1">
            {[skateTypeLabel, skateStyleLabel, skillLevelLabel].filter(Boolean).join(" · ")}
          </p>
        )}

        {profile.bio && <p className="text-zinc-200 mt-6 leading-relaxed">{profile.bio}</p>}

        <div className="mt-10">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            {t("upcomingTitle")}
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
                    <p className="text-sm text-zinc-400">
                      {formatEventDateTime(rsvp.events.starts_at, locale)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">{t("noUpcoming")}</p>
          )}
        </div>
      </div>
    </main>
  );
}
