// Archivo: app/[locale]/buddies/actions.ts
// Server Actions: mutan buddy_requests con el cliente normal (RLS ya cubre
// "cada parte gestiona lo suyo"), pero la notificación a la otra persona
// necesita el cliente admin porque su user_id no es el auth.uid() actual
// (mismo patrón que lib/notify-event-change.ts).
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { error?: string };

async function getMyProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .single();
  return data as { username: string; display_name: string | null } | null;
}

export async function sendBuddyRequest(otherUserId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };
  if (user.id === otherUserId) return { error: "invalid" };

  const { data: existing } = await supabase
    .from("buddy_requests")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing && existing.status !== "declined") {
    // Ya hay una pendiente o ya son buddies: nada que hacer.
    return {};
  }

  const { error } = existing
    ? await supabase
        .from("buddy_requests")
        .update({ requester_id: user.id, addressee_id: otherUserId, status: "pending", created_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabase.from("buddy_requests").insert({ requester_id: user.id, addressee_id: otherUserId, status: "pending" });

  if (error) return { error: "submit" };

  const me = await getMyProfile(supabase, user.id);
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: otherUserId,
    type: "buddy_request",
    payload: { fromUsername: me?.username ?? "", fromDisplayName: me?.display_name ?? null },
  });

  return {};
}

export async function acceptBuddyRequest(otherUserId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const { error } = await supabase
    .from("buddy_requests")
    .update({ status: "accepted" })
    .eq("requester_id", otherUserId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "submit" };

  const me = await getMyProfile(supabase, user.id);
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: otherUserId,
    type: "buddy_accepted",
    payload: { fromUsername: me?.username ?? "", fromDisplayName: me?.display_name ?? null },
  });

  return {};
}

export async function declineBuddyRequest(otherUserId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const { error } = await supabase
    .from("buddy_requests")
    .update({ status: "declined" })
    .eq("requester_id", otherUserId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) return { error: "submit" };
  return {};
}
