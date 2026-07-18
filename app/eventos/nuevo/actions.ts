// Archivo: app/eventos/nuevo/actions.ts
// Server Action: valida y crea el evento; el organizador queda como asistente.
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DIFFICULTIES = ["principiante", "intermedio", "avanzado"];

function backToFormWithError(message: string, values: Record<string, string>): never {
  const params = new URLSearchParams({ error: message, ...values });
  redirect(`/eventos/nuevo?${params.toString()}`);
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

  if (!title) backToFormWithError("El título es obligatorio.", values);
  if (!description) backToFormWithError("La descripción es obligatoria.", values);
  if (!spotId) backToFormWithError("Selecciona un spot.", values);
  if (!DIFFICULTIES.includes(difficulty)) {
    backToFormWithError("Selecciona una dificultad válida.", values);
  }
  if (!startsAtLocal) {
    backToFormWithError("La fecha y hora de inicio son obligatorias.", values);
  }

  const startsAtDate = new Date(startsAtLocal);
  if (Number.isNaN(startsAtDate.getTime())) {
    backToFormWithError("La fecha y hora no son válidas.", values);
  }
  if (startsAtDate.getTime() <= Date.now()) {
    backToFormWithError("La fecha de inicio debe ser futura.", values);
  }

  let distanceKm: number | null = null;
  if (distanceRaw) {
    const parsed = Number(distanceRaw);
    if (Number.isNaN(parsed) || parsed <= 0) {
      backToFormWithError("La distancia debe ser un número positivo.", values);
    }
    distanceKm = parsed;
  }

  let maxParticipants: number | null = null;
  if (maxRaw) {
    const parsed = Number(maxRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      backToFormWithError("El máximo de participantes debe ser un entero positivo.", values);
    }
    maxParticipants = parsed;
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      title,
      description,
      spot_id: spotId,
      organizer_id: user.id,
      starts_at: startsAtDate.toISOString(),
      difficulty,
      distance_km: distanceKm,
      max_participants: maxParticipants,
    })
    .select("id")
    .single();

  if (error || !event) {
    backToFormWithError("No se pudo crear el evento. Inténtalo de nuevo.", values);
  }

  await supabase.from("event_attendees").insert({
    event_id: event.id,
    profile_id: user.id,
    status: "asistire",
  });

  redirect(`/eventos/${event.id}`);
}
