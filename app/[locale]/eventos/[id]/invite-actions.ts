// Archivo: app/[locale]/eventos/[id]/invite-actions.ts
// Server Action: el organizador invita a un buddy a su evento. La
// notificación usa el cliente admin porque el destinatario no es el
// auth.uid() actual (mismo patrón que buddies/actions.ts).
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteBuddyToEvent(eventId: string, buddyId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const { data: event } = await supabase
    .from("events")
    .select("title, organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event || event.organizer_id !== user.id) return { error: "forbidden" };

  const { data: me } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    user_id: buddyId,
    type: "event_invite",
    event_id: eventId,
    payload: {
      title: event.title,
      fromUsername: me?.username ?? "",
      fromDisplayName: me?.display_name ?? null,
    },
  });

  if (error) return { error: "submit" };
  return {};
}
