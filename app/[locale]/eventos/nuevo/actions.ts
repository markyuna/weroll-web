// Archivo: app/[locale]/eventos/nuevo/actions.ts
// Server Action: valida y crea el evento; el organizador queda como asistente.
"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createInvitations } from "@/lib/invitation-actions";
import {
  buildRule,
  serializeRule,
  RECURRENCE_FREQS,
  WEEKDAY_CODES,
  type RecurrenceFreq,
  type WeekdayCode,
} from "@/lib/recurrence";

const DIFFICULTIES = ["principiante", "intermedio", "avanzado"];

export async function createEvent(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "EventoNuevo" });

  function backToFormWithError(message: string, values: Record<string, string>): never {
    const params = new URLSearchParams({ error: message, ...values });
    return redirect({ href: `/eventos/nuevo?${params.toString()}`, locale });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const title = ((formData.get("title") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const spotId = ((formData.get("spot_id") as string) ?? "").trim();
  const latitudeRaw = ((formData.get("latitude") as string) ?? "").trim();
  const longitudeRaw = ((formData.get("longitude") as string) ?? "").trim();
  const groupId = ((formData.get("group_id") as string) ?? "").trim();
  const startsAtLocal = ((formData.get("starts_at") as string) ?? "").trim();
  const difficulty = ((formData.get("difficulty") as string) ?? "").trim();
  const distanceRaw = ((formData.get("distance_km") as string) ?? "").trim();
  const maxRaw = ((formData.get("max_participants") as string) ?? "").trim();
  const routePolylineRaw = ((formData.get("route_polyline") as string) ?? "").trim();
  const pauseSpotId = ((formData.get("pause_spot_id") as string) ?? "").trim();
  const recurrence = ((formData.get("recurrence") as string) ?? "none").trim() || "none";
  const recurrenceDay = ((formData.get("recurrence_day") as string) ?? "").trim();
  const recurrenceTime = ((formData.get("recurrence_time") as string) ?? "").trim();

  const values = {
    title,
    description,
    spot_id: spotId,
    group_id: groupId,
    starts_at: startsAtLocal,
    difficulty,
    distance_km: distanceRaw,
    max_participants: maxRaw,
    recurrence,
    recurrence_day: recurrenceDay,
    recurrence_time: recurrenceTime,
  };

  if (!title) backToFormWithError(t("errorTitleRequired"), values);
  if (!description) backToFormWithError(t("errorDescriptionRequired"), values);

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (!spotId) {
    const parsedLat = Number(latitudeRaw);
    const parsedLng = Number(longitudeRaw);
    if (!latitudeRaw || !longitudeRaw || Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      backToFormWithError(t("errorLocationRequired"), values);
    }
    latitude = parsedLat;
    longitude = parsedLng;
  }

  if (!DIFFICULTIES.includes(difficulty)) {
    backToFormWithError(t("errorDifficultyInvalid"), values);
  }

  if (groupId) {
    const { data: membership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!membership) {
      backToFormWithError(t("errorGroupInvalid"), values);
    }
  }
  let startsAtDate: Date;
  let recurrenceRule: string | null = null;

  if (recurrence === "none") {
    if (!startsAtLocal) {
      backToFormWithError(t("errorStartsAtRequired"), values);
    }
    startsAtDate = new Date(startsAtLocal);
    if (Number.isNaN(startsAtDate.getTime())) {
      backToFormWithError(t("errorStartsAtInvalid"), values);
    }
    if (startsAtDate.getTime() <= Date.now()) {
      backToFormWithError(t("errorStartsAtPast"), values);
    }
  } else {
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(recurrenceTime);
    if (
      !RECURRENCE_FREQS.includes(recurrence as RecurrenceFreq) ||
      !WEEKDAY_CODES.includes(recurrenceDay as WeekdayCode) ||
      !timeMatch
    ) {
      backToFormWithError(t("errorRecurrenceInvalid"), values);
    }
    // La primera ocurrencia es la próxima fecha futura que cae en ese día y
    // hora; queda como starts_at del evento "plantilla" de la serie.
    const { rule, firstOccurrence } = buildRule(
      recurrence as RecurrenceFreq,
      recurrenceDay as WeekdayCode,
      Number(timeMatch[1]),
      Number(timeMatch[2]),
      new Date()
    );
    startsAtDate = firstOccurrence;
    recurrenceRule = serializeRule(rule);
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

  let routePolyline: [number, number][] | null = null;
  if (routePolylineRaw) {
    try {
      const parsed = JSON.parse(routePolylineRaw);
      const isValid =
        Array.isArray(parsed) &&
        parsed.length > 1 &&
        parsed.every(
          (p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number")
        );
      routePolyline = isValid ? parsed : null;
    } catch {
      routePolyline = null;
    }
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      title,
      description,
      spot_id: spotId || null,
      latitude,
      longitude,
      group_id: groupId || null,
      organizer_id: user.id,
      starts_at: startsAtDate.toISOString(),
      difficulty,
      distance_km: distanceKm,
      max_participants: maxParticipants,
      route_polyline: routePolyline,
      pause_spot_id: pauseSpotId || null,
      recurrence_rule: recurrenceRule,
    })
    .select("id")
    .single();

  if (error || !event) {
    backToFormWithError(t("errorSubmit"), values);
  }

  await supabase.from("event_attendees").insert({
    event_id: event.id,
    profile_id: user.id,
    status: "asistire",
  });

  const inviteBuddyIds = formData.getAll("invite_buddy_ids").filter((v): v is string => typeof v === "string");
  if (inviteBuddyIds.length > 0) {
    await createInvitations({ type: "event", targetId: event.id, targetTitle: title, inviteeIds: inviteBuddyIds });
  }

  redirect({ href: `/eventos/${event.id}`, locale });
}
