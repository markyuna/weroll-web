// Archivo: app/[locale]/notificaciones/notifications-client-list.tsx
// Client component: gestiona el estado local "leída" de la lista completa
// de notificaciones (mismo patrón que el dropdown de la campana).
"use client";

import { useState, useTransition } from "react";
import { markNotificationRead } from "@/components/notification-actions";
import { NotificationListItem } from "@/components/notification-list-item";
import type { NotificationRow } from "@/lib/notifications";

export function NotificationsClientList({
  initialNotifications,
  locale,
}: {
  initialNotifications: NotificationRow[];
  locale: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [, startTransition] = useTransition();

  function handleRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    startTransition(() => {
      markNotificationRead(id);
    });
  }

  return (
    <div className="rounded-xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
      {notifications.map((n) => (
        <NotificationListItem key={n.id} notification={n} locale={locale} onRead={handleRead} />
      ))}
    </div>
  );
}
