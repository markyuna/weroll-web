// Archivo: app/[locale]/eventos/page.tsx
// Server Component: lista las próximas randonnées, ordenadas por fecha.
// Acepta ?spot=<id> para filtrar por spot.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingEvents } from "@/lib/events";
import { EventCard } from "@/components/event-card";

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("Eventos");
  const supabase = await createClient();
  const sp = await searchParams;
  const spotId = typeof sp.spot === "string" ? sp.spot : undefined;

  const [{ data: events, error }, { data: { user } }, spotResult] = await Promise.all([
    getUpcomingEvents(supabase, { spotId }),
    supabase.auth.getUser(),
    spotId
      ? supabase.from("spots").select("name, city").eq("id", spotId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const filterSpot = spotResult.data as { name: string; city: string | null } | null;

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
              href="/eventos/nuevo"
              className="shrink-0 rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition"
            >
              {t("createCta")}
            </Link>
          )}
        </div>
        <p className="text-zinc-400 mb-4">{t("subtitle")}</p>

        {spotId && (
          <div className="mb-6 flex items-center gap-2 text-sm">
            <span className="text-zinc-400">
              {t("filteringBy")}{" "}
              <span className="text-white font-medium">
                {filterSpot ? `${filterSpot.name}${filterSpot.city ? ` · ${filterSpot.city}` : ""}` : "—"}
              </span>
            </span>
            <Link href="/eventos" className="text-amber-400 hover:underline">
              {t("clearFilter")}
            </Link>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{t("loadError")}</p>}

        {!error && (!events || events.length === 0) && (
          <p className="text-zinc-400">{spotId ? t("emptySpot") : t("empty")}</p>
        )}

        <ul className="space-y-4">
          {events?.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
