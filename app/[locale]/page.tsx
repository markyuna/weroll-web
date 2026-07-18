// Archivo: app/[locale]/page.tsx
// Server Component: landing de WeRoll.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingEvents } from "@/lib/events";
import { EventCard } from "@/components/event-card";

export default async function Home() {
  const t = await getTranslations("Home");
  const supabase = await createClient();

  const [{ data: events }, { data: { user } }] = await Promise.all([
    getUpcomingEvents(supabase, { limit: 3 }),
    supabase.auth.getUser(),
  ]);

  return (
    <main className="bg-zinc-950">
      <section className="px-4 pt-24 pb-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            {t.rich("heroTitle", {
              amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
            })}
          </h1>
          <p className="text-zinc-400 mt-4 text-lg">{t("heroSubtitle")}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link
              href="/eventos"
              className="w-full sm:w-auto rounded-lg bg-amber-400 text-zinc-950 font-semibold px-6 py-3 hover:bg-amber-300 transition"
            >
              {t("ctaViewEvents")}
            </Link>
            {user ? (
              <Link
                href="/eventos/nuevo"
                className="w-full sm:w-auto rounded-lg border border-zinc-700 text-zinc-200 font-semibold px-6 py-3 hover:border-amber-400 hover:text-amber-400 transition"
              >
                {t("ctaCreateEvent")}
              </Link>
            ) : (
              <Link
                href="/registro"
                className="w-full sm:w-auto rounded-lg border border-zinc-700 text-zinc-200 font-semibold px-6 py-3 hover:border-amber-400 hover:text-amber-400 transition"
              >
                {t("ctaSignup")}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            {t.rich("upcomingTitle", {
              amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
            })}
          </h2>

          {events && events.length > 0 ? (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-400">
              {t("noEvents")}{" "}
              <Link href="/eventos" className="text-amber-400 hover:underline">
                {t("noEventsCta")}
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section className="px-4 pb-24 pt-16 border-t border-zinc-800">
        <div className="mx-auto max-w-3xl grid gap-8 sm:grid-cols-3 text-center">
          <div>
            <p className="text-amber-400 text-2xl font-bold mb-2">01</p>
            <h3 className="text-white font-semibold mb-1">{t("feature1Title")}</h3>
            <p className="text-sm text-zinc-400">{t("feature1Body")}</p>
          </div>
          <div>
            <p className="text-amber-400 text-2xl font-bold mb-2">02</p>
            <h3 className="text-white font-semibold mb-1">{t("feature2Title")}</h3>
            <p className="text-sm text-zinc-400">{t("feature2Body")}</p>
          </div>
          <div>
            <p className="text-amber-400 text-2xl font-bold mb-2">03</p>
            <h3 className="text-white font-semibold mb-1">{t("feature3Title")}</h3>
            <p className="text-sm text-zinc-400">{t("feature3Body")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
