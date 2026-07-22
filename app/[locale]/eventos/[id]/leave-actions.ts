// Archivo: app/[locale]/eventos/[id]/leave-actions.ts
// Server Action: salir de un evento (borra el RSVP). El delete lo cubre
// RLS ("quitar mi rsvp"), pero notificar a los demás asistentes
// confirmados necesita el cliente admin (su user_id no es el auth.uid()).
"use server";

import { createClient } from "@/lib/supabase/server";
import { notifySafely } from "@/lib/notify-safely";

export async function leaveEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const [{ data: event }, { data: me }, { data: remainingAttendees }] = await Promise.all([
    supabase.from("events").select("title").eq("id", eventId).single(),
    supabase.from("profiles").select("username, display_name").eq("id", user.id).single(),
    supabase
      .from("event_attendees")
      .select("profile_id")
      .eq("event_id", eventId)
      .eq("status", "asistire")
      .neq("profile_id", user.id),
  ]);

  const { error } = await supabase
    .from("event_attendees")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) return { error: "submit" };

  const recipients = (remainingAttendees ?? []).map((a) => a.profile_id as string);
  if (recipients.length > 0 && event) {
    await notifySafely(
      recipients.map((profileId) => ({
        user_id: profileId,
        type: "event_left",
        event_id: eventId,
        payload: {
          title: event.title,
          fromUsername: me?.username ?? "",
          fromDisplayName: me?.display_name ?? null,
        },
      }))
    );
  }

  return {};
}
