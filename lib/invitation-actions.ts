// Archivo: lib/invitation-actions.ts
// Server Actions del flujo de invitaciones (evento/grupo) con aceptar/
// rechazar. Los inserts/updates de la fila propia los cubre RLS, pero
// notificar a la otra persona necesita el cliente admin (su user_id no es
// el auth.uid() actual) — mismo patrón que buddies/actions.ts.
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InvitationType } from "@/lib/invitations";

async function getMyProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("username, display_name").eq("id", userId).single();
  return data as { username: string; display_name: string | null } | null;
}

/**
 * Crea invitaciones pendientes para `inviteeIds` y notifica a cada uno. Si
 * alguien ya tiene una invitación (en cualquier estado) para este target, se
 * omite en silencio — no se puede reinvitar tras un rechazo.
 */
export async function createInvitations({
  type,
  targetId,
  targetTitle,
  inviteeIds,
}: {
  type: InvitationType;
  targetId: string;
  targetTitle: string;
  inviteeIds: string[];
}): Promise<{ error?: string }> {
  if (inviteeIds.length === 0) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const { data: existing } = await supabase
    .from("invitations")
    .select("invitee_id")
    .eq("type", type)
    .eq("target_id", targetId)
    .in("invitee_id", inviteeIds);
  const alreadyInvited = new Set((existing ?? []).map((r) => r.invitee_id as string));
  const newInviteeIds = inviteeIds.filter((id) => !alreadyInvited.has(id));
  if (newInviteeIds.length === 0) return {};

  const { data: inserted, error } = await supabase
    .from("invitations")
    .insert(newInviteeIds.map((inviteeId) => ({ type, target_id: targetId, inviter_id: user.id, invitee_id: inviteeId })))
    .select("id, invitee_id");

  if (error || !inserted) return { error: "submit" };

  const me = await getMyProfile(supabase, user.id);
  const admin = createAdminClient();
  await admin.from("notifications").insert(
    inserted.map((row) => ({
      user_id: row.invitee_id,
      type: type === "event" ? "event_invite" : "group_invite",
      event_id: type === "event" ? targetId : null,
      payload: {
        title: targetTitle,
        fromUsername: me?.username ?? "",
        fromDisplayName: me?.display_name ?? null,
        invitationId: row.id,
        ...(type === "group" ? { groupId: targetId } : {}),
      },
    }))
  );

  return {};
}

async function getInvitationForInvitee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invitationId: string,
  userId: string
) {
  const { data } = await supabase
    .from("invitations")
    .select("id, type, target_id, inviter_id, invitee_id, status")
    .eq("id", invitationId)
    .maybeSingle();
  if (!data || data.invitee_id !== userId) return null;
  return data;
}

export async function acceptInvitation(invitationId: string): Promise<{ error?: string; target?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const invitation = await getInvitationForInvitee(supabase, invitationId, user.id);
  if (!invitation) return { error: "not_found" };
  if (invitation.status === "declined") return { error: "already_declined" };

  if (invitation.status === "pending") {
    await supabase.from("invitations").update({ status: "accepted" }).eq("id", invitationId);
  }

  const { data: target } = await supabase
    .from(invitation.type === "event" ? "events" : "groups")
    .select(invitation.type === "event" ? "title" : "name")
    .eq("id", invitation.target_id)
    .maybeSingle();
  const targetTitle = (target as { title?: string; name?: string } | null)?.title ?? (target as { name?: string } | null)?.name ?? "";

  if (invitation.type === "event") {
    await supabase
      .from("event_attendees")
      .upsert({ event_id: invitation.target_id, profile_id: user.id, status: "asistire" }, { onConflict: "event_id,profile_id" });
  } else {
    await supabase
      .from("group_members")
      .upsert({ group_id: invitation.target_id, profile_id: user.id, role: "member" }, { onConflict: "group_id,profile_id" });
  }

  const me = await getMyProfile(supabase, user.id);
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: invitation.inviter_id,
    type: "invitation_accepted",
    event_id: invitation.type === "event" ? invitation.target_id : null,
    payload: {
      title: targetTitle,
      fromUsername: me?.username ?? "",
      fromDisplayName: me?.display_name ?? null,
      ...(invitation.type === "group" ? { groupId: invitation.target_id } : {}),
    },
  });

  return { target: invitation.type === "event" ? `/eventos/${invitation.target_id}` : `/grupos/${invitation.target_id}` };
}

export async function declineInvitation(invitationId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const invitation = await getInvitationForInvitee(supabase, invitationId, user.id);
  if (!invitation) return { error: "not_found" };

  if (invitation.status === "pending") {
    await supabase.from("invitations").update({ status: "declined" }).eq("id", invitationId);
  }
  return {};
}
