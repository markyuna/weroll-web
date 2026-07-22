// Archivo: app/[locale]/buddies/page.tsx
// Server Component: requiere sesión. Tres pestañas: "Descubrir" (sugerencias
// de compatibilidad, sin relación persistente), "Mis buddies" (solicitudes
// aceptadas) y "Solicitudes" (pendientes recibidas, aceptar/rechazar).
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBuddies } from "@/lib/buddies";
import {
  getMyBuddies,
  getPendingRequestsCount,
  getPendingRequestsReceived,
} from "@/lib/buddy-requests";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { FilterChip } from "@/components/filter-chip";
import { PageHeader, AmberChunk } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";
import { BuddySearch } from "@/components/buddy-search";
import { BuddyRequestActions } from "@/components/buddy-request-actions";

const TABS = ["descubrir", "mis-buddies", "solicitudes"] as const;
type Tab = (typeof TABS)[number];

export default async function BuddiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("Buddies");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const sp = await searchParams;
  const requestedTab = typeof sp.tab === "string" ? sp.tab : "descubrir";
  const tab: Tab = TABS.includes(requestedTab as Tab) ? (requestedTab as Tab) : "descubrir";

  const pendingCount = await getPendingRequestsCount(supabase, user.id);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t.rich("title", { amber: AmberChunk })} subtitle={t("subtitle")} />

        <BuddySearch />

        <div className="flex gap-2 border-b border-zinc-800 mb-8">
          {TABS.map((value) => (
            <Link
              key={value}
              href={{ pathname: "/buddies", query: { tab: value } }}
              className={`relative px-3 py-2.5 text-sm font-medium transition ${
                tab === value
                  ? "text-amber-400 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-amber-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t(`tab_${value.replace("-", "_")}`)}
              {value === "solicitudes" && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-semibold text-zinc-950">
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        {tab === "descubrir" && <DiscoverTab userId={user.id} />}
        {tab === "mis-buddies" && <MyBuddiesTab userId={user.id} />}
        {tab === "solicitudes" && <RequestsTab userId={user.id} />}
      </div>
    </main>
  );
}

async function DiscoverTab({ userId }: { userId: string }) {
  const t = await getTranslations("Buddies");
  const tSkateType = await getTranslations("SkateType");
  const tSkateStyle = await getTranslations("SkateStyle");
  const tDifficulty = await getTranslations("Difficulty");
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("profiles")
    .select("id, city, skate_type, skate_style, skill_level")
    .eq("id", userId)
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

  if (buddies.length === 0) {
    return (
      <EmptyState emoji="🤝">
        <p>{t("empty")}</p>
        <p className="mt-2 text-sm">
          {t("emptyHint")}{" "}
          <Link href="/perfil" className="text-amber-400 hover:underline">
            {t("emptyHintLink")}
          </Link>
        </p>
      </EmptyState>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {buddies.map((buddy, i) => {
        const skateTypeLabel =
          buddy.skate_type && tSkateType.has(buddy.skate_type) ? tSkateType(buddy.skate_type) : buddy.skate_type;
        const skillLevelLabel =
          buddy.skill_level && tDifficulty.has(buddy.skill_level) ? tDifficulty(buddy.skill_level) : buddy.skill_level;
        const skateStyleLabel =
          buddy.skate_style && tSkateStyle.has(buddy.skate_style) ? tSkateStyle(buddy.skate_style) : buddy.skate_style;

        return (
          <li key={buddy.id}>
            <Reveal delay={(i % 2) * 50} className="h-full">
              <Card interactive className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <Avatar username={buddy.username} avatarUrl={buddy.avatar_url} size={48} />
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{buddy.display_name || buddy.username}</p>
                    <p className="text-sm text-zinc-400 truncate">
                      @{buddy.username}
                      {buddy.city ? ` · ${buddy.city}` : ""}
                    </p>
                  </div>
                </div>

                {(skateTypeLabel || skillLevelLabel || skateStyleLabel) && (
                  <div className="flex flex-wrap gap-2">
                    {skateTypeLabel && <FilterChip active={buddy.matchesType}>{skateTypeLabel}</FilterChip>}
                    {skillLevelLabel && <FilterChip active={buddy.matchesLevel}>{skillLevelLabel}</FilterChip>}
                    {skateStyleLabel && <FilterChip active={buddy.matchesStyle}>{skateStyleLabel}</FilterChip>}
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
  );
}

async function MyBuddiesTab({ userId }: { userId: string }) {
  const t = await getTranslations("Buddies");
  const supabase = await createClient();
  const buddies = await getMyBuddies(supabase, userId);

  if (buddies.length === 0) {
    return (
      <EmptyState emoji="🛼">
        <p>{t("myBuddiesEmpty")}</p>
      </EmptyState>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {buddies.map((buddy) => (
        <li key={buddy.id}>
          <Card href={`/u/${buddy.username}`} className="flex items-center gap-3 p-4">
            <Avatar username={buddy.username} avatarUrl={buddy.avatar_url} size={48} />
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">{buddy.display_name || buddy.username}</p>
              <p className="text-sm text-zinc-400 truncate">
                @{buddy.username}
                {buddy.city ? ` · ${buddy.city}` : ""}
              </p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

async function RequestsTab({ userId }: { userId: string }) {
  const t = await getTranslations("Buddies");
  const supabase = await createClient();
  const requests = await getPendingRequestsReceived(supabase, userId);

  if (requests.length === 0) {
    return (
      <EmptyState emoji="📬">
        <p>{t("requestsEmpty")}</p>
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map(({ requester }) => (
        <li key={requester.id}>
          <Card className="flex items-center gap-3 p-4">
            <Link href={`/u/${requester.username}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar username={requester.username} avatarUrl={requester.avatar_url} size={44} />
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{requester.display_name || requester.username}</p>
                <p className="text-sm text-zinc-400 truncate">
                  @{requester.username}
                  {requester.city ? ` · ${requester.city}` : ""}
                </p>
              </div>
            </Link>
            <BuddyRequestActions requesterId={requester.id} />
          </Card>
        </li>
      ))}
    </ul>
  );
}
