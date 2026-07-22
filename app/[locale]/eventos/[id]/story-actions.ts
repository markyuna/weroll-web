// Archivo: app/[locale]/eventos/[id]/story-actions.ts
// Server Action: publica una historia (foto ya subida a Storage, o un
// enlace de Instagram) y notifica a organizador + asistentes confirmados.
// El insert en event_stories lo cubre RLS; notificar a otros necesita el
// cliente admin (su user_id no es el auth.uid() actual).
"use server";

import { createClient } from "@/lib/supabase/server";
import { notifySafely } from "@/lib/notify-safely";

export async function publishStory({
  eventId,
  storagePath,
  instagramUrl,
}: {
  eventId: string;
  storagePath?: string;
  instagramUrl?: string;
}): Promise<{ error?: string }> {
  if (!storagePath && !instagramUrl) return { error: "missing_source" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const { data: event } = await supabase.from("events").select("title, organizer_id").eq("id", eventId).maybeSingle();
  if (!event) return { error: "not_found" };

  const { data: attendance } = await supabase
    .from("event_attendees")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();
  const eligible = event.organizer_id === user.id || attendance?.status === "asistire";
  if (!eligible) return { error: "forbidden" };

  const { error: insertError } = await supabase.from("event_stories").insert({
    event_id: eventId,
    author_id: user.id,
    storage_path: storagePath ?? null,
    instagram_url: instagramUrl ?? null,
  });
  if (insertError) return { error: "submit" };

  const [{ data: me }, { data: attendees }] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", user.id).single(),
    supabase.from("event_attendees").select("profile_id").eq("event_id", eventId).eq("status", "asistire"),
  ]);

  const recipients = new Set<string>([event.organizer_id, ...(attendees ?? []).map((a) => a.profile_id as string)]);
  recipients.delete(user.id);

  if (recipients.size > 0) {
    await notifySafely(
      [...recipients].map((profileId) => ({
        user_id: profileId,
        type: "event_story",
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
