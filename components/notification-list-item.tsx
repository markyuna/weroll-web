// Archivo: components/notification-list-item.tsx
// Client component: una fila de notificación, reusada por el dropdown de
// la campana (header) y por /notificaciones. Si tiene event_id navega al
// evento al hacer clic; si no (evento eliminado), solo marca como leída.
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/relative-time";
import { FIELD_LABEL_KEYS, isModifiedPayload, type NotificationRow } from "@/lib/notifications";

export function NotificationListItem({
  notification,
  locale,
  onRead,
}: {
  notification: NotificationRow;
  locale: string;
  onRead: (id: string) => void;
}) {
  const t = useTranslations("Notifications");
  const tFields = useTranslations("EventoNuevo");
  const unread = !notification.read_at;

  const body = (
    <div className={`px-4 py-3 text-sm ${unread ? "bg-amber-400/5" : ""} hover:bg-zinc-800 transition`}>
      <p className="font-medium text-zinc-100">{notification.payload?.title ?? ""}</p>
      <p className="text-xs text-zinc-400 mt-0.5">
        {notification.type === "evento_modificado" ? t("modified") : t("cancelled")}
      </p>
      {isModifiedPayload(notification.payload) && (
        <ul className="mt-1 space-y-0.5">
          {notification.payload.changes.map((c, i) => (
            <li key={i} className="text-xs text-zinc-500">
              {tFields(FIELD_LABEL_KEYS[c.field])}: {c.before} → {c.after}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-zinc-600 mt-1">{formatRelativeTime(notification.created_at, locale)}</p>
    </div>
  );

  function handleClick() {
    if (unread) onRead(notification.id);
  }

  if (notification.event_id) {
    return (
      <Link href={`/eventos/${notification.event_id}`} role="menuitem" onClick={handleClick} className="block">
        {body}
      </Link>
    );
  }

  return (
    <div role="menuitem" onClick={handleClick} className="cursor-default">
      {body}
    </div>
  );
}
