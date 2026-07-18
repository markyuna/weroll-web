// Archivo: app/[locale]/grupos/nuevo/page.tsx
// Server Component: solo para usuarios autenticados; redirige a /login si no hay sesión.
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createGroup } from "./actions";

export default async function NuevoGrupoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("GrupoNuevo");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const field = (name: string) => (typeof sp[name] === "string" ? (sp[name] as string) : "");

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/grupos" className="text-sm text-amber-400 hover:underline">
          {t("back")}
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4 mb-1">
          {t.rich("title", {
            amber: (chunks) => <span className="text-amber-400">{chunks}</span>,
          })}
        </h1>
        <p className="text-zinc-400 mb-8">{t("subtitle")}</p>

        {error && (
          <p className="text-sm text-red-400 mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2">
            {error}
          </p>
        )}

        <form action={createGroup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-zinc-300 mb-1">
              {t("fieldName")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={field("name")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm text-zinc-300 mb-1">
              {t("fieldDescription")}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={field("description")}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm text-zinc-300 mb-1">
                {t("fieldCity")}
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                defaultValue={field("city")}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm text-zinc-300 mb-1">
                {t("fieldCountry")}
              </label>
              <input
                id="country"
                name="country"
                type="text"
                required
                defaultValue={field("country")}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-amber-400 text-zinc-950 font-semibold py-2 hover:bg-amber-300 transition"
          >
            {t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
