// Archivo: lib/event-stories.ts
// Tipos y queries de historias efímeras de evento. Sin dependencias de
// servidor: seguro de importar desde Server y Client Components.
import type { SupabaseClient } from "@supabase/supabase-js";

export type StoryAuthor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type EventStory = {
  id: string;
  event_id: string;
  author_id: string;
  storage_path: string | null;
  instagram_url: string | null;
  expires_at: string;
  created_at: string;
  // Nullable: si el embed de PostgREST no resuelve el perfil (o el
  // registro está en un estado inconsistente), no debe tumbar el render.
  author: StoryAuthor | null;
};

const STORY_COLUMNS =
  "id, event_id, author_id, storage_path, instagram_url, expires_at, created_at, author:profiles!author_id ( username, display_name, avatar_url )";

/** Historias activas de un evento, más antigua primero (orden de reproducción). */
export async function getActiveEventStories(supabase: SupabaseClient, eventId: string): Promise<EventStory[]> {
  const { data } = await supabase
    .from("event_stories")
    .select(STORY_COLUMNS)
    .eq("event_id", eventId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .overrideTypes<EventStory[], { merge: false }>();
  return data ?? [];
}

export function getStoryImageUrl(supabase: SupabaseClient, storagePath: string): string {
  return supabase.storage.from("stories").getPublicUrl(storagePath).data.publicUrl;
}

export async function getSeenStoryIds(
  supabase: SupabaseClient,
  viewerId: string,
  storyIds: string[]
): Promise<Set<string>> {
  if (storyIds.length === 0) return new Set();
  const { data } = await supabase
    .from("story_views")
    .select("story_id")
    .eq("viewer_id", viewerId)
    .in("story_id", storyIds);
  return new Set((data ?? []).map((r) => r.story_id as string));
}

export async function markStoryViewed(supabase: SupabaseClient, storyId: string, viewerId: string) {
  await supabase.from("story_views").upsert(
    { story_id: storyId, viewer_id: viewerId },
    { onConflict: "story_id,viewer_id", ignoreDuplicates: true }
  );
}

export type StoryRingStatus = "unseen" | "seen" | "none";

/**
 * Para cada evento de `eventIds`: si tiene historias activas y si el
 * usuario ya vio todas ("seen") o le falta alguna ("unseen"). Una sola
 * consulta batch, para tarjetas de lista.
 */
export async function getStoryRingStatuses(
  supabase: SupabaseClient,
  viewerId: string,
  eventIds: string[]
): Promise<Map<string, StoryRingStatus>> {
  const statuses = new Map<string, StoryRingStatus>();
  if (eventIds.length === 0) return statuses;

  const { data: stories } = await supabase
    .from("event_stories")
    .select("id, event_id")
    .in("event_id", eventIds)
    .gt("expires_at", new Date().toISOString())
    .overrideTypes<{ id: string; event_id: string }[], { merge: false }>();

  if (!stories || stories.length === 0) return statuses;

  const seen = await getSeenStoryIds(
    supabase,
    viewerId,
    stories.map((s) => s.id)
  );

  const byEvent = new Map<string, string[]>();
  for (const story of stories) {
    const list = byEvent.get(story.event_id) ?? [];
    list.push(story.id);
    byEvent.set(story.event_id, list);
  }
  for (const [eventId, storyIds] of byEvent) {
    statuses.set(eventId, storyIds.every((id) => seen.has(id)) ? "seen" : "unseen");
  }
  return statuses;
}
