// Archivo: app/[locale]/grupos/page.tsx
// Server Component: lista de grupos con buscador por ciudad (GET, sin JS).
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroups } from "@/lib/groups";
import { GroupCard } from "@/components/group-card";

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
        <div className="flex items-start justify-between gap-4 mb-1">
          <h1 className="text-3xl font-bold text-white">
            {t.rich("title", {
              amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
            })}
          </h1>
          {user && (
            <Link
              href="/grupos/nuevo"
              className="shrink-0 rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition"
            >
              {t("createCta")}
            </Link>
          )}
        </div>
        <p className="text-zinc-400 mb-6">{t("subtitle")}</p>

        <form className="flex gap-2 mb-8">
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
          <p className="text-zinc-400">{city ? t("noResults") : t("empty")}</p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {groups?.map((group) => (
            <li key={group.id}>
              <GroupCard group={group} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
