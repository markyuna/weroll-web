// Archivo: components/header.tsx
// Server Component: header global, refleja el estado de sesión leído con
// el cliente server de Supabase, e incluye el selector de idioma.
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";
import { LanguageSwitcher } from "./language-switcher";

export async function Header() {
  const t = await getTranslations("Header");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link href="/" className="text-lg font-bold text-white shrink-0">
          We<span className="text-amber-400">Roll</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-300">
          <Link href="/eventos" className="whitespace-nowrap hover:text-amber-400 transition">
            {t("eventos")}
          </Link>
          <Link href="/spots" className="whitespace-nowrap hover:text-amber-400 transition">
            {t("spots")}
          </Link>
          <Link href="/grupos" className="whitespace-nowrap hover:text-amber-400 transition">
            {t("grupos")}
          </Link>

          {user ? (
            <UserMenu username={username} avatarUrl={avatarUrl} />
          ) : (
            <>
              <Link href="/login" className="whitespace-nowrap hover:text-amber-400 transition">
                {t("login")}
              </Link>
              <Link
                href="/registro"
                className="whitespace-nowrap rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300 transition"
              >
                {t("signup")}
              </Link>
            </>
          )}

          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
