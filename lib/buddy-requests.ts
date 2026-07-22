// Archivo: lib/buddy-requests.ts
// Queries del sistema de buddies real (tabla buddy_requests). Sin
// dependencias de servidor: seguro de importar desde Server y Client
// Components. Las mutaciones (con notificación vía cliente admin) viven en
// app/[locale]/buddies/actions.ts.
import type { SupabaseClient } from "@supabase/supabase-js";

export type BuddyRequestStatus = "pending" | "accepted" | "declined";

export type BuddyRelationship =
  | { state: "none" }
  | { state: "sent" }
  | { state: "received" }
  | { state: "buddies" };

type RequestRow = {
  requester_id: string;
  addressee_id: string;
  status: BuddyRequestStatus;
};

/** La relación entre `meId` y `otherId`, vista desde `meId`. */
export async function getBuddyRelationship(
  supabase: SupabaseClient,
  meId: string,
  otherId: string
): Promise<BuddyRelationship> {
  const { data } = await supabase
    .from("buddy_requests")
    .select("requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${meId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${meId})`
    )
    .maybeSingle()
    .overrideTypes<RequestRow | null, { merge: false }>();

  if (!data || data.status === "declined") return { state: "none" };
  if (data.status === "accepted") return { state: "buddies" };
  return { state: data.requester_id === meId ? "sent" : "received" };
}

export type BuddyProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
};

const PROFILE_COLUMNS = "id, username, display_name, avatar_url, city";

/** Mis buddies aceptados (el otro perfil de cada par), por nombre. */
export async function getMyBuddies(
  supabase: SupabaseClient,
  userId: string
): Promise<BuddyProfile[]> {
  const [asRequester, asAddressee] = await Promise.all([
    supabase
      .from("buddy_requests")
      .select(`addressee:profiles!buddy_requests_addressee_id_fkey ( ${PROFILE_COLUMNS} )`)
      .eq("requester_id", userId)
      .eq("status", "accepted")
      .overrideTypes<{ addressee: BuddyProfile | null }[], { merge: false }>(),
    supabase
      .from("buddy_requests")
      .select(`requester:profiles!buddy_requests_requester_id_fkey ( ${PROFILE_COLUMNS} )`)
      .eq("addressee_id", userId)
      .eq("status", "accepted")
      .overrideTypes<{ requester: BuddyProfile | null }[], { merge: false }>(),
  ]);

  const buddies: BuddyProfile[] = [
    ...(asRequester.data ?? []).flatMap((r) => (r.addressee ? [r.addressee] : [])),
    ...(asAddressee.data ?? []).flatMap((r) => (r.requester ? [r.requester] : [])),
  ];
  buddies.sort((a, b) => a.username.localeCompare(b.username));
  return buddies;
}

export type PendingRequest = {
  requester: BuddyProfile;
  created_at: string;
};

/** Solicitudes pendientes recibidas (para la pestaña "Solicitudes"). */
export async function getPendingRequestsReceived(
  supabase: SupabaseClient,
  userId: string
): Promise<PendingRequest[]> {
  const { data } = await supabase
    .from("buddy_requests")
    .select(`created_at, requester:profiles!buddy_requests_requester_id_fkey ( ${PROFILE_COLUMNS} )`)
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .overrideTypes<{ created_at: string; requester: BuddyProfile | null }[], { merge: false }>();

  return (data ?? []).flatMap((r) => (r.requester ? [{ requester: r.requester, created_at: r.created_at }] : []));
}

export async function getPendingRequestsCount(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("buddy_requests")
    .select("id", { count: "exact", head: true })
    .eq("addressee_id", userId)
    .eq("status", "pending");
  return count ?? 0;
}
