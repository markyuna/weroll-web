// Archivo: app/[locale]/eventos/[id]/invite-actions.ts
// Server Action: el organizador invita a un buddy a su evento.
"use server";

import { createClient } from "@/lib/supabase/server";
import { createInvitations } from "@/lib/invitation-actions";

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

  return createInvitations({ type: "event", targetId: eventId, targetTitle: event.title, inviteeIds: [buddyId] });
}
