// Archivo: app/[locale]/eventos/[id]/editar/actions.ts
// Server Actions: solo el organizador puede editar/borrar su evento. Si
// cambian campos relevantes (o se borra), notifica a los asistentes
// confirmados (in-app + email) vía lib/notify-event-change.ts.
"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/events";
import { notifyEventCancelled, notifyEventModified } from "@/lib/notify-event-change";
import type { FieldChange } from "@/lib/notifications";

const DIFFICULTIES = ["principiante", "intermedio", "avanzado"];

function siteEventUrl(locale: string, eventId: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  return `${siteUrl}/${locale}/eventos/${eventId}`;
}

async function getConfirmedAttendeeIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  excludeUserId: string
) {
  const { data } = await supabase
    .from("event_attendees")
    .select("profile_id")
    .eq("event_id", eventId)
    .eq("status", "asistire")
    .neq("profile_id", excludeUserId);
  return (data ?? []).map((r) => r.profile_id as string);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "EventoNuevo" });
  const tEdit = await getTranslations({ locale, namespace: "EventoEditar" });
  const tDifficulty = await getTranslations({ locale, namespace: "Difficulty" });

  function backToFormWithError(message: string, values: Record<string, string>): never {
    const params = new URLSearchParams({ error: message, ...values });
    return redirect({ href: `/eventos/${eventId}/editar?${params.toString()}`, locale });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: before } = await supabase
    .from("events")
    .select(
      "id, title, description, organizer_id, spot_id, starts_at, distance_km, max_participants, difficulty, spots!spot_id ( name )"
    )
    .eq("id", eventId)
    .maybeSingle()
    .overrideTypes<
      {
        id: string;
        title: string;
        description: string | null;
        organizer_id: string;
        spot_id: string | null;
        starts_at: string;
        distance_km: number | null;
        max_participants: number | null;
        difficulty: string | null;
        spots: { name: string } | null;
      } | null,
      { merge: false }
    >();

  if (!before) {
    redirect({ href: "/eventos", locale });
    return;
  }
  if (before.organizer_id !== user.id) {
    redirect({ href: `/eventos/${eventId}`, locale });
    return;
  }

  const title = ((formData.get("title") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const spotId = ((formData.get("spot_id") as string) ?? "").trim();
  const startsAtLocal = ((formData.get("starts_at") as string) ?? "").trim();
  const difficulty = ((formData.get("difficulty") as string) ?? "").trim();
  const distanceRaw = ((formData.get("distance_km") as string) ?? "").trim();
  const maxRaw = ((formData.get("max_participants") as string) ?? "").trim();

  const values = {
    title,
    description,
    spot_id: spotId,
    starts_at: startsAtLocal,
    difficulty,
    distance_km: distanceRaw,
    max_participants: maxRaw,
  };

  if (!title) backToFormWithError(t("errorTitleRequired"), values);
  if (!description) backToFormWithError(t("errorDescriptionRequired"), values);
  if (!spotId) backToFormWithError(t("errorSpotRequired"), values);
  if (!DIFFICULTIES.includes(difficulty)) {
    backToFormWithError(t("errorDifficultyInvalid"), values);
  }
  if (!startsAtLocal) {
    backToFormWithError(t("errorStartsAtRequired"), values);
  }

  const startsAtDate = new Date(startsAtLocal);
  if (Number.isNaN(startsAtDate.getTime())) {
    backToFormWithError(t("errorStartsAtInvalid"), values);
  }
  if (startsAtDate.getTime() <= Date.now()) {
    backToFormWithError(t("errorStartsAtPast"), values);
  }

  let distanceKm: number | null = null;
  if (distanceRaw) {
    const parsed = Number(distanceRaw);
    if (Number.isNaN(parsed) || parsed <= 0) {
      backToFormWithError(t("errorDistanceInvalid"), values);
    }
    distanceKm = parsed;
  }

  let maxParticipants: number | null = null;
  if (maxRaw) {
    const parsed = Number(maxRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      backToFormWithError(t("errorMaxParticipantsInvalid"), values);
    }
    maxParticipants = parsed;
  }

  let newSpotName: string | null = before.spots?.name ?? null;
  if (spotId !== (before.spot_id ?? "")) {
    const { data: spot } = await supabase.from("spots").select("name").eq("id", spotId).maybeSingle();
    newSpotName = spot?.name ?? null;
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({
      title,
      description,
      spot_id: spotId,
      starts_at: startsAtDate.toISOString(),
      difficulty,
      distance_km: distanceKm,
      max_participants: maxParticipants,
    })
    .eq("id", eventId);

  if (updateError) {
    backToFormWithError(tEdit("errorSubmit"), values);
  }

  const changes: FieldChange[] = [];
  if (before.title !== title) {
    changes.push({ field: "title", before: before.title, after: title });
  }
  if (new Date(before.starts_at).getTime() !== startsAtDate.getTime()) {
    changes.push({
      field: "starts_at",
      before: formatEventDateTime(before.starts_at, locale),
      after: formatEventDateTime(startsAtDate.toISOString(), locale),
    });
  }
  if ((before.spot_id ?? "") !== spotId) {
    changes.push({ field: "spot_id", before: before.spots?.name ?? "—", after: newSpotName ?? "—" });
  }
  if ((before.distance_km ?? null) !== distanceKm) {
    changes.push({
      field: "distance_km",
      before: before.distance_km != null ? String(before.distance_km) : "—",
      after: distanceKm != null ? String(distanceKm) : "—",
    });
  }
  if ((before.difficulty ?? "") !== difficulty) {
    changes.push({
      field: "difficulty",
      before:
        before.difficulty && tDifficulty.has(before.difficulty)
          ? tDifficulty(before.difficulty)
          : (before.difficulty ?? "—"),
      after: tDifficulty.has(difficulty) ? tDifficulty(difficulty) : difficulty,
    });
  }

  if (changes.length > 0) {
    const attendeeIds = await getConfirmedAttendeeIds(supabase, eventId, user.id);
    if (attendeeIds.length > 0) {
      await notifyEventModified({
        locale,
        eventId,
        eventTitle: title,
        eventUrl: siteEventUrl(locale, eventId),
        attendeeIds,
        changes,
      });
    }
  }

  redirect({ href: `/eventos/${eventId}`, locale });
}

export async function deleteEvent(eventId: string) {
  const locale = await getLocale();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title, organizer_id, starts_at, spots!spot_id ( name )")
    .eq("id", eventId)
    .maybeSingle()
    .overrideTypes<
      { id: string; title: string; organizer_id: string; starts_at: string; spots: { name: string } | null } | null,
      { merge: false }
    >();

  if (!event) {
    redirect({ href: "/eventos", locale });
    return;
  }
  if (event.organizer_id !== user.id) {
    redirect({ href: `/eventos/${eventId}`, locale });
    return;
  }

  const attendeeIds = await getConfirmedAttendeeIds(supabase, eventId, user.id);

  if (attendeeIds.length > 0) {
    await notifyEventCancelled({
      locale,
      eventId,
      eventTitle: event.title,
      eventUrl: siteEventUrl(locale, eventId),
      attendeeIds,
      startsAt: formatEventDateTime(event.starts_at, locale),
      spotName: event.spots?.name ?? null,
    });
  }

  await supabase.from("events").delete().eq("id", eventId);

  redirect({ href: "/eventos", locale });
}
