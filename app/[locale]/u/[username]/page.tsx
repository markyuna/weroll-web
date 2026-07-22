// Archivo: app/[locale]/u/[username]/page.tsx
// Server Component público: perfil de cualquier usuario por username.
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/events";
import { getGamificationData } from "@/lib/gamification";
import { XpLevelCard } from "@/components/xp-level-card";
import { BadgesGrid } from "@/components/badges-grid";
import { Avatar } from "@/components/avatar";
import { instagramUrl } from "@/lib/instagram";

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
  const tGamification = await getTranslations("Gamification");
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, city, country, skate_type, skate_style, skill_level, bio, instagram_handle"
    )
    .eq("username", username)
    .maybeSingle()
    .overrideTypes<
      {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        city: string | null;
        country: string | null;
        skate_type: string | null;
        skate_style: string | null;
        skill_level: string | null;
        bio: string | null;
        instagram_handle: string | null;
      } | null,
      { merge: false }
    >();

  if (!profile) {
    notFound();
  }

  const [{ data: upcoming }, gamification] = await Promise.all([
    supabase
      .from("event_attendees")
      .select("events!inner ( id, title, starts_at )")
      .eq("profile_id", profile.id)
      .eq("status", "asistire")
      .gt("events.starts_at", new Date().toISOString())
      .order("starts_at", { referencedTable: "events", ascending: true })
      .overrideTypes<{ events: { id: string; title: string; starts_at: string } }[], { merge: false }>(),
    getGamificationData(supabase, profile.id),
  ]);

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
    <main className="relative min-h-screen bg-zinc-950 px-4 py-16 overflow-x-clip">
      {/* Acento único del perfil: blob estático muy desvanecido tras la cabecera. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-lg">
        <Link href="/eventos" className="text-sm text-amber-400 hover:underline">
          {t("back")}
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <Avatar
            username={profile.username}
            avatarUrl={profile.avatar_url}
            size={72}
            className="ring-2 ring-amber-400/40"
          />
          <div>
            <h1 className="font-display text-4xl sm:text-5xl uppercase leading-[0.95] text-white tracking-tight">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-zinc-400">@{profile.username}</p>
          </div>
        </div>

        {location && <p className="text-zinc-400 mt-2">{location}</p>}

        {(skateTypeLabel || skateStyleLabel || skillLevelLabel) && (
          <p className="text-zinc-400 mt-1">
            {[skateTypeLabel, skateStyleLabel, skillLevelLabel].filter(Boolean).join(" · ")}
          </p>
        )}

        {profile.instagram_handle && (
          <a
            href={instagramUrl(profile.instagram_handle)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-sm text-zinc-300 transition hover:border-amber-400 hover:text-amber-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-4 w-4"
              aria-hidden
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4.2" />
              <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
            </svg>
            @{profile.instagram_handle}
          </a>
        )}

        {profile.bio && <p className="text-zinc-200 mt-6 leading-relaxed">{profile.bio}</p>}

        <div className="mt-8 space-y-4">
          <XpLevelCard data={gamification} />
          <div>
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
              {tGamification("badgesTitle")}
            </h2>
            <BadgesGrid allBadges={gamification.allBadges} earnedBadgeIds={gamification.earnedBadgeIds} />
          </div>
        </div>

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
