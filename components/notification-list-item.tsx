// Archivo: components/notification-list-item.tsx
// Client component: una fila de notificación, reusada por el dropdown de
// la campana (header) y por /notificaciones. Si tiene event_id navega al
// evento al hacer clic; si no (evento eliminado), solo marca como leída.
// Las invitaciones (event_invite/group_invite con invitationId) no navegan
// al hacer clic: muestran Aceptar/Rechazar en la propia fila.
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/relative-time";
import { acceptInvitation, declineInvitation } from "@/lib/invitation-actions";
import {
  FIELD_LABEL_KEYS,
  getPayloadTitle,
  isBuddyPayload,
  isGroupInvitePayload,
  isInvitationPayload,
  isModifiedPayload,
  type NotificationRow,
} from "@/lib/notifications";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resolved, setResolved] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unread = !notification.read_at;
  const buddyPayload = isBuddyPayload(notification.payload) ? notification.payload : null;
  const buddyName = buddyPayload?.fromDisplayName || buddyPayload?.fromUsername || "";
  const groupInvitePayload = isGroupInvitePayload(notification.payload) ? notification.payload : null;
  const invitationPayload = isInvitationPayload(notification.payload) ? notification.payload : null;
  const isPendingInvitation = invitationPayload !== null && resolved === null;

  let title: string;
  let subtitle: string;
  switch (notification.type) {
    case "evento_modificado":
      title = getPayloadTitle(notification.payload);
      subtitle = t("modified");
      break;
    case "evento_cancelado":
      title = getPayloadTitle(notification.payload);
      subtitle = t("cancelled");
      break;
    case "buddy_request":
      title = t("buddyRequestTitle", { name: buddyName });
      subtitle = t("buddyRequest");
      break;
    case "buddy_accepted":
      title = t("buddyAcceptedTitle", { name: buddyName });
      subtitle = t("buddyAccepted");
      break;
    case "event_invite":
      title = getPayloadTitle(notification.payload);
      subtitle = t("eventInvite", { name: buddyName });
      break;
    case "group_invite":
      title = getPayloadTitle(notification.payload);
      subtitle = t("groupInvite", { name: buddyName });
      break;
    case "event_left":
      title = getPayloadTitle(notification.payload);
      subtitle = t("eventLeft", { name: buddyName });
      break;
    case "group_left":
      title = getPayloadTitle(notification.payload);
      subtitle = t("groupLeft", { name: buddyName });
      break;
    case "invitation_accepted":
      title = getPayloadTitle(notification.payload);
      subtitle = t("invitationAccepted", { name: buddyName });
      break;
    case "event_story":
      title = getPayloadTitle(notification.payload);
      subtitle = t("eventStory", { name: buddyName });
      break;
    default:
      title = getPayloadTitle(notification.payload);
      subtitle = "";
  }

  function handleClick() {
    if (unread) onRead(notification.id);
  }

  function handleAccept() {
    if (!invitationPayload) return;
    if (unread) onRead(notification.id);
    setError(null);
    startTransition(async () => {
      const result = await acceptInvitation(invitationPayload.invitationId);
      if (result.error || !result.target) {
        setError(t("invitationError"));
        return;
      }
      setResolved("accepted");
      router.push(result.target);
    });
  }

  function handleDecline() {
    if (!invitationPayload) return;
    if (unread) onRead(notification.id);
    setError(null);
    startTransition(async () => {
      const result = await declineInvitation(invitationPayload.invitationId);
      if (result.error) {
        setError(t("invitationError"));
        return;
      }
      setResolved("declined");
    });
  }

  const body = (
    <div className={`px-4 py-3 text-sm ${unread ? "bg-amber-400/5" : ""} ${isPendingInvitation ? "" : "hover:bg-zinc-800"} transition`}>
      <p className="font-medium text-zinc-100">{title}</p>
      <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
      {isModifiedPayload(notification.payload) && (
        <ul className="mt-1 space-y-0.5">
          {notification.payload.changes.map((c, i) => (
            <li key={i} className="text-xs text-zinc-500">
              {tFields(FIELD_LABEL_KEYS[c.field])}: {c.before} → {c.after}
            </li>
          ))}
        </ul>
      )}

      {isPendingInvitation && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={handleAccept}
            className="rounded-lg bg-amber-400 text-zinc-950 font-semibold px-3 py-1 text-xs hover:bg-amber-300 transition disabled:opacity-50"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleDecline}
            className="rounded-lg border border-zinc-700 text-zinc-400 font-medium px-3 py-1 text-xs hover:border-zinc-500 transition disabled:opacity-50"
          >
            {t("decline")}
          </button>
        </div>
      )}
      {resolved === "declined" && <p className="mt-1 text-xs text-zinc-500">{t("invitationDeclined")}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      <p className="text-[11px] text-zinc-600 mt-1">{formatRelativeTime(notification.created_at, locale)}</p>
    </div>
  );

  if (isPendingInvitation) {
    return (
      <div role="menuitem" className="cursor-default">
        {body}
      </div>
    );
  }

  if (notification.event_id) {
    return (
      <Link href={`/eventos/${notification.event_id}`} role="menuitem" onClick={handleClick} className="block">
        {body}
      </Link>
    );
  }

  if (groupInvitePayload) {
    return (
      <Link href={`/grupos/${groupInvitePayload.groupId}`} role="menuitem" onClick={handleClick} className="block">
        {body}
      </Link>
    );
  }

  if (buddyPayload) {
    return (
      <Link href={`/u/${buddyPayload.fromUsername}`} role="menuitem" onClick={handleClick} className="block">
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
