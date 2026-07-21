// Archivo: components/header.tsx
// Server Component: header global, refleja el estado de sesión leído con
// el cliente server de Supabase, e incluye el selector de idioma.
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications, getUnreadNotificationCount, type NotificationRow } from "@/lib/notifications";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";

export async function Header() {
  const t = await getTranslations("Header");
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let notifications: NotificationRow[] = [];
  let unreadCount = 0;
  if (user) {
    const [{ data: profile }, notifs, count] = await Promise.all([
      supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle(),
      getNotifications(supabase, user.id, 8),
      getUnreadNotificationCount(supabase, user.id),
    ]);
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    notifications = notifs;
    unreadCount = count;
  }

  const navLinks = [
    { href: "/eventos", label: t("eventos") },
    { href: "/spots", label: t("spots") },
    { href: "/grupos", label: t("grupos") },
    { href: "/buddies", label: t("buddies") },
    { href: "/retos", label: t("retos") },
  ];
  // En móvil "Iniciar sesión" vive dentro del menú; el botón de registro
  // queda siempre visible en la barra.
  const mobileLinks = user ? navLinks : [...navLinks, { href: "/login", label: t("login") }];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="WeRoll"
            width={1536}
            height={1024}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm text-zinc-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 transition hover:bg-zinc-900 hover:text-amber-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <NotificationBell initialNotifications={notifications} initialUnreadCount={unreadCount} locale={locale} />
              <UserMenu username={username} avatarUrl={avatarUrl} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:inline whitespace-nowrap text-sm text-zinc-300 hover:text-amber-300 transition"
              >
                {t("login")}
              </Link>
              <Link
                href="/registro"
                className="whitespace-nowrap rounded-lg bg-gradient-brand px-3 py-1.5 text-sm font-semibold text-zinc-950 shadow-glow transition hover:brightness-110"
              >
                {t("signup")}
              </Link>
            </>
          )}

          <LanguageSwitcher />
          <MobileNav links={mobileLinks} label={t("menuLabel")} />
        </div>
      </div>
    </header>
  );
}
