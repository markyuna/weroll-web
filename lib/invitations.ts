// Archivo: lib/invitations.ts
// Tipos y queries de invitations. Sin dependencias de servidor: seguro de
// importar desde Server y Client Components. Las mutaciones (que notifican
// con el cliente admin) viven en lib/invitation-actions.ts.
import type { SupabaseClient } from "@supabase/supabase-js";

export type InvitationType = "event" | "group";
export type InvitationStatus = "pending" | "accepted" | "declined";

/**
 * De `buddyIds`, cuáles ya NO deberían aparecer en el picker de invitar
 * porque ya participan en `targetId` o ya tienen una invitación pendiente.
 * Usado por components/invite-buddies-panel.tsx vía la página de detalle.
 */
export async function getInvitationExclusionSet(
  supabase: SupabaseClient,
  {
    type,
    targetId,
    buddyIds,
  }: { type: InvitationType; targetId: string; buddyIds: string[] }
): Promise<Set<string>> {
  if (buddyIds.length === 0) return new Set();

  const [{ data: pendingInvites }, { data: participants }] = await Promise.all([
    supabase
      .from("invitations")
      .select("invitee_id")
      .eq("type", type)
      .eq("target_id", targetId)
      .eq("status", "pending")
      .in("invitee_id", buddyIds),
    type === "event"
      ? supabase.from("event_attendees").select("profile_id").eq("event_id", targetId).in("profile_id", buddyIds)
      : supabase.from("group_members").select("profile_id").eq("group_id", targetId).in("profile_id", buddyIds),
  ]);

  const excluded = new Set<string>();
  for (const row of pendingInvites ?? []) excluded.add(row.invitee_id as string);
  for (const row of participants ?? []) excluded.add(row.profile_id as string);
  return excluded;
}
