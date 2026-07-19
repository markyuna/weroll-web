// Archivo: app/[locale]/not-found.tsx
// 404 dentro de un idioma válido (p. ej. evento o usuario inexistente).
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center">
      <span className="text-6xl" aria-hidden>
        🛼
      </span>
      <h1 className="text-6xl font-bold text-gradient-brand tracking-tight">404</h1>
      <p className="text-zinc-400">{t("message")}</p>
      <Link
        href="/"
        className="mt-3 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-amber-400/60 hover:text-amber-300"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
