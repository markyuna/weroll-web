// Archivo: app/[locale]/buddies/page.tsx
// Server Component: requiere sesión. Lista patinadores de mi ciudad o de mis
// grupos ordenados por compatibilidad (tipo de patín > nivel > estilo).
// Los atributos que coinciden con mi perfil se resaltan en ámbar.
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBuddies } from "@/lib/buddies";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { FilterChip } from "@/components/filter-chip";
import { PageHeader, AmberChunk } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";

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
        <PageHeader title={t.rich("title", { amber: AmberChunk })} subtitle={t("subtitle")} />

        {buddies.length === 0 ? (
          <EmptyState emoji="🤝">
            <p>{t("empty")}</p>
            <p className="mt-2 text-sm">
              {t("emptyHint")}{" "}
              <Link href="/perfil" className="text-amber-400 hover:underline">
                {t("emptyHintLink")}
              </Link>
            </p>
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {buddies.map((buddy, i) => {
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
                <li key={buddy.id}>
                  <Reveal delay={(i % 2) * 50} className="h-full">
                    <Card interactive className="flex h-full flex-col gap-3 p-5">
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
                        <FilterChip active={buddy.matchesType}>{skateTypeLabel}</FilterChip>
                      )}
                      {skillLevelLabel && (
                        <FilterChip active={buddy.matchesLevel}>{skillLevelLabel}</FilterChip>
                      )}
                      {skateStyleLabel && (
                        <FilterChip active={buddy.matchesStyle}>{skateStyleLabel}</FilterChip>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/u/${buddy.username}`}
                    className="mt-auto rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm text-center font-medium px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition"
                  >
                    {t("viewProfile")}
                  </Link>
                    </Card>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
