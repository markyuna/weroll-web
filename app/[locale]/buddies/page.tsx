// Archivo: app/[locale]/buddies/page.tsx
// Server Component: requiere sesión. Lista patinadores de mi ciudad o de mis
// grupos ordenados por compatibilidad (tipo de patín > nivel > estilo).
// Los atributos que coinciden con mi perfil se resaltan en ámbar.
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBuddies } from "@/lib/buddies";
import { Avatar } from "@/components/avatar";

function AttributeChip({ label, matches }: { label: string; matches: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        matches ? "bg-amber-400/10 text-amber-400" : "bg-zinc-800 text-zinc-400"
      }`}
    >
      {label}
    </span>
  );
}

export default async function BuddiesPage() {
  const locale = await getLocale();
  const t = await getTranslations("Buddies");
  const tSkateType = await getTranslations("SkateType");
  const tSkateStyle = await getTranslations("SkateStyle");
  const tDifficulty = await getTranslations("Difficulty");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("id, city, skate_type, skate_style, skill_level")
    .eq("id", user.id)
    .maybeSingle()
    .overrideTypes<
      {
        id: string;
        city: string | null;
        skate_type: string | null;
        skate_style: string | null;
        skill_level: string | null;
      } | null,
      { merge: false }
    >();

  const buddies = me ? await getBuddies(supabase, me) : [];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white mb-1">
          {t.rich("title", {
            amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
          })}
        </h1>
        <p className="text-zinc-400 mb-8">{t("subtitle")}</p>

        {buddies.length === 0 ? (
          <div className="text-zinc-400">
            <p>{t("empty")}</p>
            <p className="mt-2 text-sm">
              {t("emptyHint")}{" "}
              <Link href="/perfil" className="text-amber-400 hover:underline">
                {t("emptyHintLink")}
              </Link>
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {buddies.map((buddy) => {
              const skateTypeLabel =
                buddy.skate_type && tSkateType.has(buddy.skate_type)
                  ? tSkateType(buddy.skate_type)
                  : buddy.skate_type;
              const skillLevelLabel =
                buddy.skill_level && tDifficulty.has(buddy.skill_level)
                  ? tDifficulty(buddy.skill_level)
                  : buddy.skill_level;
              const skateStyleLabel =
                buddy.skate_style && tSkateStyle.has(buddy.skate_style)
                  ? tSkateStyle(buddy.skate_style)
                  : buddy.skate_style;

              return (
                <li
                  key={buddy.id}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar username={buddy.username} avatarUrl={buddy.avatar_url} size={48} />
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">
                        {buddy.display_name || buddy.username}
                      </p>
                      <p className="text-sm text-zinc-400 truncate">
                        @{buddy.username}
                        {buddy.city ? ` · ${buddy.city}` : ""}
                      </p>
                    </div>
                  </div>

                  {(skateTypeLabel || skillLevelLabel || skateStyleLabel) && (
                    <div className="flex flex-wrap gap-2">
                      {skateTypeLabel && (
                        <AttributeChip label={skateTypeLabel} matches={buddy.matchesType} />
                      )}
                      {skillLevelLabel && (
                        <AttributeChip label={skillLevelLabel} matches={buddy.matchesLevel} />
                      )}
                      {skateStyleLabel && (
                        <AttributeChip label={skateStyleLabel} matches={buddy.matchesStyle} />
                      )}
                    </div>
                  )}

                  <Link
                    href={`/u/${buddy.username}`}
                    className="mt-auto rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm text-center font-medium px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition"
                  >
                    {t("viewProfile")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
