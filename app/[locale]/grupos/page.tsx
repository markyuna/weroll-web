// Archivo: app/[locale]/grupos/page.tsx
// Server Component: lista de grupos con buscador por ciudad (GET, sin JS).
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroups } from "@/lib/groups";
import { GroupCard } from "@/components/group-card";
import { PageHeader, AmberChunk } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";

export default async function GruposPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("Grupos");
  const supabase = await createClient();
  const sp = await searchParams;
  const city = typeof sp.city === "string" ? sp.city : "";

  const [{ data: groups, error }, { data: { user } }] = await Promise.all([
    getGroups(supabase, { city: city || undefined }),
    supabase.auth.getUser(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title={t.rich("title", { amber: AmberChunk })}
          subtitle={t("subtitle")}
          action={
            user && (
              <Link
                href="/grupos/nuevo"
                className="inline-block rounded-lg bg-gradient-brand text-zinc-950 font-semibold px-4 py-2 text-sm shadow-glow transition duration-300 hover:shadow-glow-strong hover:-translate-y-0.5 hover:brightness-110"
              >
                {t("createCta")}
              </Link>
            )
          }
        />

        <form className="-mt-2 flex gap-2 mb-8">
          <input
            type="text"
            name="city"
            defaultValue={city}
            placeholder={t("searchPlaceholder")}
            className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            className="rounded-lg border border-zinc-700 text-zinc-200 font-medium px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition"
          >
            {t("search")}
          </button>
        </form>

        {error && <p className="text-sm text-red-400">{t("loadError")}</p>}

        {!error && (!groups || groups.length === 0) && (
          <EmptyState emoji={city ? "🔍" : "👥"}>
            <p>{city ? t("noResults") : t("empty")}</p>
          </EmptyState>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {groups?.map((group, i) => (
            <li key={group.id}>
              <Reveal delay={(i % 2) * 50} className="h-full">
                <GroupCard group={group} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
