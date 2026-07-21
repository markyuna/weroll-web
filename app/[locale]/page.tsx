// Archivo: app/[locale]/page.tsx
// Server Component: landing de WeRoll.
// Las animaciones de entrada del hero son CSS puro (animate-fade-up con
// retardos inline); lo que está bajo el fold usa <Reveal> (IntersectionObserver).
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingEvents } from "@/lib/events";
import { EventCard } from "@/components/event-card";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/card";
import { IconTile } from "@/components/icon-tile";

const FEATURES = [
  { icon: "👥", href: "/grupos", key: 1 },
  { icon: "📍", href: "/spots", key: 2 },
  { icon: "✅", href: "/eventos", key: 3 },
  { icon: "🤝", href: "/buddies", key: 4 },
  { icon: "🏆", href: "/retos", key: 5 },
  { icon: "📡", href: "/spots", key: 6 },
] as const;

export default async function Home() {
  const t = await getTranslations("Home");
  const supabase = await createClient();

  const [{ data: events }, { data: { user } }] = await Promise.all([
    getUpcomingEvents(supabase, { limit: 3 }),
    supabase.auth.getUser(),
  ]);

  const marqueeItems = [1, 2, 3, 4, 5, 6].map((n) => t(`marquee${n}`));

  return (
    <main className="bg-zinc-950 overflow-x-clip">
      {/* ===== Hero ===== */}
      <section className="relative px-4 pt-24 pb-20 text-center">
        {/* Decoración: rejilla + blobs de gradiente a la deriva. */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="hero-grid absolute inset-0" />
          <div className="animate-blob absolute -top-24 left-1/2 -ml-96 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="animate-blob absolute top-10 left-1/2 ml-16 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl [animation-delay:-6s]" />
          <div className="animate-blob absolute top-64 left-1/2 -ml-40 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl [animation-delay:-12s]" />
        </div>

        {/* Emojis flotantes, solo en pantallas anchas para no estorbar. */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          <span className="animate-float absolute top-28 left-[12%] text-4xl opacity-60">🛼</span>
          <span className="animate-float absolute top-48 right-[14%] text-3xl opacity-50 [animation-delay:-2s]">⚡</span>
          <span className="animate-float absolute bottom-16 left-[20%] text-2xl opacity-40 [animation-delay:-4s]">🔥</span>
          <span className="animate-float absolute bottom-24 right-[22%] text-3xl opacity-50 [animation-delay:-5s]">🌙</span>
        </div>

        <div className="relative mx-auto max-w-2xl">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-medium text-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            {t("heroBadge")}
          </span>

          <h1 className="animate-fade-up font-display mt-6 text-5xl sm:text-7xl uppercase text-white leading-[0.95] tracking-tight [animation-delay:100ms]">
            {t.rich("heroTitle", {
              amber: (chunks) => <span className="text-gradient-brand">{chunks}</span>,
            })}
          </h1>
          <p className="animate-fade-up text-zinc-400 mt-5 text-lg sm:text-xl [animation-delay:200ms]">
            {t("heroSubtitle")}
          </p>

          <div className="animate-fade-up flex flex-col sm:flex-row items-center justify-center gap-4 mt-9 [animation-delay:300ms]">
            <Link
              href="/eventos"
              className="w-full sm:w-auto rounded-xl bg-gradient-brand text-zinc-950 font-semibold px-7 py-3.5 shadow-glow transition duration-300 hover:shadow-glow-strong hover:-translate-y-0.5 hover:brightness-110"
            >
              {t("ctaViewEvents")}
            </Link>
            {user ? (
              <Link
                href="/eventos/nuevo"
                className="w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-900/60 text-zinc-200 font-semibold px-7 py-3.5 backdrop-blur transition duration-300 hover:border-amber-400/60 hover:text-amber-300 hover:-translate-y-0.5"
              >
                {t("ctaCreateEvent")}
              </Link>
            ) : (
              <Link
                href="/registro"
                className="w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-900/60 text-zinc-200 font-semibold px-7 py-3.5 backdrop-blur transition duration-300 hover:border-amber-400/60 hover:text-amber-300 hover:-translate-y-0.5"
              >
                {t("ctaSignup")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ===== Marquee ===== */}
      <section className="relative border-y border-zinc-800/80 bg-zinc-900/40 py-4 overflow-hidden">
        <div className="animate-marquee flex w-max items-center">
          {/* Contenido duplicado para que el bucle sea continuo. */}
          {[false, true].map((clone) => (
            <div
              key={clone ? "clone" : "original"}
              className="flex shrink-0 items-center"
              aria-hidden={clone}
            >
              {marqueeItems.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-8 pr-8 text-sm font-semibold uppercase tracking-widest text-zinc-500"
                >
                  {item}
                  <span className="text-amber-400/70">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        {/* Desvanecido en los bordes del marquee. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent" aria-hidden />
      </section>

      {/* ===== Próximas randonnées ===== */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl uppercase text-white mb-8">
              {t.rich("upcomingTitle", {
                amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
              })}
            </h2>
          </Reveal>

          {events && events.length > 0 ? (
            <ul className="space-y-4">
              {events.map((event, i) => (
                <li key={event.id}>
                  <Reveal delay={i * 120}>
                    <EventCard event={event} />
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <Reveal>
              <p className="text-zinc-400">
                {t("noEvents")}{" "}
                <Link href="/eventos" className="text-amber-400 hover:underline">
                  {t("noEventsCta")}
                </Link>
                .
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="px-4 py-20 border-t border-zinc-800/80">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl uppercase text-white text-center mb-12">
              {t.rich("featuresTitle", {
                amber: (chunks) => <span className="text-gradient-brand">{chunks}</span>,
              })}
            </h2>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.key} delay={(i % 3) * 100} className="h-full">
                <Card href={feature.href} className="group h-full p-6">
                  <div className="flex h-full flex-col">
                    <IconTile icon={feature.icon} className="mb-4" />
                    <h3 className="text-white font-semibold mb-1.5 group-hover:text-amber-300 transition">
                      {t(`feature${feature.key}Title`)}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{t(`feature${feature.key}Body`)}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA final ===== */}
      <section className="px-4 pb-24 pt-4">
        <Reveal className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-brand px-6 py-14 text-center shadow-2xl shadow-amber-500/20">
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-orange-700/25 blur-2xl" aria-hidden />
            <span className="text-4xl" aria-hidden>🛼</span>
            <h2 className="font-display mt-3 text-4xl sm:text-5xl uppercase text-zinc-950 tracking-tight">
              {t("ctaFinalTitle")}
            </h2>
            <p className="mt-3 text-zinc-900/80 text-lg max-w-xl mx-auto">{t("ctaFinalBody")}</p>
            <Link
              href={user ? "/eventos/nuevo" : "/registro"}
              className="mt-8 inline-block rounded-xl bg-zinc-950 px-8 py-3.5 font-semibold text-amber-300 transition duration-300 hover:bg-zinc-900 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-950/40"
            >
              {user ? t("ctaCreateEvent") : t("ctaFinalButton")}
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
