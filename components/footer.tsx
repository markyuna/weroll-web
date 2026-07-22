import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("Footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Logo y descripción */}
          <div>
            <h3 className="font-display text-2xl font-bold text-white mb-2">
              We<span className="text-amber-400">Roll</span>
            </h3>
            <p className="text-sm text-zinc-400">{t("tagline")}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">
              {t("navTitle")}
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/eventos" className="hover:text-amber-400 transition">
                  {t("navEventos")}
                </Link>
              </li>
              <li>
                <Link href="/spots" className="hover:text-amber-400 transition">
                  {t("navSpots")}
                </Link>
              </li>
              <li>
                <Link href="/buddies" className="hover:text-amber-400 transition">
                  {t("navBuddies")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">
              {t("followTitle")}
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <a href="#" className="hover:text-amber-400 transition">
                  {t("instagram")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-amber-400 transition">
                  {t("twitter")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-amber-400 transition">
                  {t("discord")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-zinc-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500">
            <p>{t("copyright", { year: currentYear })}</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-amber-400 transition">
                {t("privacy")}
              </a>
              <a href="#" className="hover:text-amber-400 transition">
                {t("terms")}
              </a>
              <a href="#" className="hover:text-amber-400 transition">
                {t("contact")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
