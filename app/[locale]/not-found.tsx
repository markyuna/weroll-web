// Archivo: app/[locale]/not-found.tsx
// 404 dentro de un idioma válido (p. ej. evento o usuario inexistente).
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-2 bg-zinc-950 px-4 text-center">
      <h1 className="text-2xl font-bold text-white">404</h1>
      <p className="text-zinc-400">{t("message")}</p>
      <Link href="/" className="text-amber-400 hover:underline">
        {t("backHome")}
      </Link>
    </main>
  );
}
