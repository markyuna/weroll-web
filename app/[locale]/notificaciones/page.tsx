// Archivo: app/[locale]/notificaciones/page.tsx
// Server Component: lista completa de notificaciones del usuario logueado.
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/notifications";
import { NotificationsClientList } from "./notifications-client-list";

export default async function NotificacionesPage() {
  const locale = await getLocale();
  const t = await getTranslations("Notifications");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const notifications = await getNotifications(supabase, user.id, 50);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-8">{t("pageTitle")}</h1>
        {notifications.length === 0 ? (
          <p className="text-sm text-zinc-400">{t("empty")}</p>
        ) : (
          <NotificationsClientList initialNotifications={notifications} locale={locale} />
        )}
      </div>
    </main>
  );
}
