// Archivo: app/[locale]/notificaciones/page.tsx
// Server Component: lista completa de notificaciones del usuario logueado.
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/notifications";
import { NotificationsClientList } from "./notifications-client-list";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

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
        <PageHeader title={t("pageTitle")} />
        {notifications.length === 0 ? (
          <EmptyState emoji="🔔">
            <p>{t("empty")}</p>
          </EmptyState>
        ) : (
          <NotificationsClientList initialNotifications={notifications} locale={locale} />
        )}
      </div>
    </main>
  );
}
