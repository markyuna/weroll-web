import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("Footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black border-t border-zinc-800 mt-20 overflow-hidden">
      {/* Líneas decorativas animadas */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 animate-pulse opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 animate-pulse opacity-60" />

      {/* Línea diagonal animada */}
      <div className="pointer-events-none absolute top-12 left-1/4 w-96 h-1 bg-gradient-to-r from-cyan-400 to-transparent rotate-45 opacity-20 animate-slide-x" />

      <div className="max-w-7xl mx-auto px-6 py-8 md:py-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 mb-6 md:mb-12">
          {/* Logo y descripción */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
              We<span className="text-amber-400">Roll</span>
            </h3>
            <p className="text-sm text-zinc-400">{t("tagline")}</p>
          </div>

          {/* Links animados */}
          <div>
            <h4 className="font-bold text-white mb-2 md:mb-4 text-sm uppercase tracking-widest">
              {t("navTitle")}
            </h4>
            <ul className="space-y-1.5 md:space-y-3 text-sm">
              <li>
                <Link href="/eventos" className="group relative text-zinc-400 hover:text-amber-400 transition-colors duration-300">
                  {t("navEventos")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
              <li>
                <Link href="/spots" className="group relative text-zinc-400 hover:text-amber-400 transition-colors duration-300">
                  {t("navSpots")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
              <li>
                <Link href="/retos" className="group relative text-zinc-400 hover:text-amber-400 transition-colors duration-300">
                  {t("navChallenges")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-full transition-all duration-300" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Redes sociales */}
          <div>
            <h4 className="font-bold text-white mb-2 md:mb-4 text-sm uppercase tracking-widest">
              {t("followTitle")}
            </h4>
            <ul className="space-y-1.5 md:space-y-3 text-sm">
              <li>
                <a href="#" className="group relative text-zinc-400 hover:text-pink-400 transition-colors duration-300">
                  {t("instagram")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-purple-500 group-hover:w-full transition-all duration-300" />
                </a>
              </li>
              <li>
                <a href="#" className="group relative text-zinc-400 hover:text-cyan-400 transition-colors duration-300">
                  {t("twitter")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:w-full transition-all duration-300" />
                </a>
              </li>
              <li>
                <a href="#" className="group relative text-zinc-400 hover:text-purple-400 transition-colors duration-300">
                  {t("discord")}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-indigo-500 group-hover:w-full transition-all duration-300" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Mascota animada */}
        <div className="pointer-events-none absolute bottom-24 right-4 w-16 h-16 md:bottom-16 md:right-6 md:w-32 md:h-32 animate-float drop-shadow-2xl">
          <Image
            src="/icon_roll.png"
            alt="WeRoll mascota"
            width={128}
            height={128}
            className="w-full h-full object-contain filter drop-shadow-lg"
          />
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-zinc-800 pt-4 mt-4 md:pt-8 md:mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs md:text-sm text-zinc-500">
            <p>{t("copyright", { year: currentYear })}</p>
            <div className="flex gap-4 md:gap-6 mt-2 md:mt-0">
              <a href="#" className="group relative hover:text-amber-400 transition-colors duration-300">
                {t("privacy")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300" />
              </a>
              <a href="#" className="group relative hover:text-amber-400 transition-colors duration-300">
                {t("terms")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300" />
              </a>
              <Link href="/contacto" className="group relative hover:text-amber-400 transition-colors duration-300">
                {t("contact")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos animados */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(-5deg);
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
          }
        }

        @keyframes slide-x {
          0% {
            transform: translateX(-100%) rotateZ(45deg);
          }
          100% {
            transform: translateX(100%) rotateZ(45deg);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-slide-x {
          animation: slide-x 4s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
}
