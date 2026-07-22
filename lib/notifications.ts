// Archivo: lib/notifications.ts
// Tipos y queries de notifications. Sin dependencias de servidor (Resend,
// cliente admin): seguro de importar tanto desde Server como Client
// Components. El envío de emails vive en lib/notify-event-change.ts.
import type { SupabaseClient } from "@supabase/supabase-js";

export type ChangeField = "title" | "starts_at" | "spot_id" | "distance_km" | "difficulty";

export type FieldChange = {
  field: ChangeField;
  before: string;
  after: string;
};

// Claves de messages/*.json, namespace "EventoNuevo", reusadas como
// etiqueta de cada campo tanto en la lista de notificaciones como en el email.
export const FIELD_LABEL_KEYS: Record<ChangeField, string> = {
  title: "fieldTitle",
  starts_at: "fieldStartsAt",
  spot_id: "fieldSpot",
  distance_km: "fieldDistance",
  difficulty: "fieldDifficulty",
};

export type NotificationType =
  | "evento_modificado"
  | "evento_cancelado"
  | "buddy_request"
  | "buddy_accepted"
  | "event_invite"
  | "group_invite"
  | "event_left"
  | "group_left"
  | "invitation_accepted";

export type NotificationPayload =
  | { title: string; changes: FieldChange[] }
  | { title: string; startsAt: string; spot: string | null }
  | { fromUsername: string; fromDisplayName: string | null }
  | { title: string; fromUsername: string; fromDisplayName: string | null }
  | { title: string; fromUsername: string; fromDisplayName: string | null; groupId: string }
  | { title: string; fromUsername: string; fromDisplayName: string | null; invitationId: string }
  | { title: string; fromUsername: string; fromDisplayName: string | null; invitationId: string; groupId: string };

export type NotificationRow = {
  id: string;
  type: NotificationType;
  event_id: string | null;
  payload: NotificationPayload | null;
  read_at: string | null;
  created_at: string;
};

export function isModifiedPayload(
  payload: NotificationPayload | null
): payload is { title: string; changes: FieldChange[] } {
  return !!payload && "changes" in payload;
}

export function isBuddyPayload(
  payload: NotificationPayload | null
): payload is { fromUsername: string; fromDisplayName: string | null; title?: string } {
  return !!payload && "fromUsername" in payload;
}

/** Título del payload si lo tiene (evento_modificado/cancelado, event_invite). */
export function getPayloadTitle(payload: NotificationPayload | null): string {
  return payload && "title" in payload ? payload.title : "";
}

export function isGroupInvitePayload(
  payload: NotificationPayload | null
): payload is { title: string; fromUsername: string; fromDisplayName: string | null; groupId: string } {
  return !!payload && "groupId" in payload;
}

export function isInvitationPayload(
  payload: NotificationPayload | null
): payload is { title: string; fromUsername: string; fromDisplayName: string | null; invitationId: string; groupId?: string } {
  return !!payload && "invitationId" in payload;
}

export async function getUnreadNotificationCount(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function getNotifications(supabase: SupabaseClient, userId: string, limit = 20) {
  const { data } = await supabase
    .from("notifications")
    .select("id, type, event_id, payload, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<NotificationRow[], { merge: false }>();
  return data ?? [];
}
