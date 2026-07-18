// Archivo: app/perfil/actions.ts
// Server Action: actualiza los datos editables del perfil del usuario logueado.
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SKATE_TYPES } from "@/lib/profiles";

const SKILL_LEVELS = ["principiante", "intermedio", "avanzado"];

function backToFormWithError(message: string, values: Record<string, string>): never {
  const params = new URLSearchParams({ error: message, ...values });
  redirect(`/perfil?${params.toString()}`);
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = ((formData.get("display_name") as string) ?? "").trim();
  const city = ((formData.get("city") as string) ?? "").trim();
  const country = ((formData.get("country") as string) ?? "").trim();
  const skateType = ((formData.get("skate_type") as string) ?? "").trim();
  const skillLevel = ((formData.get("skill_level") as string) ?? "").trim();
  const bio = ((formData.get("bio") as string) ?? "").trim();

  const values = {
    display_name: displayName,
    city,
    country,
    skate_type: skateType,
    skill_level: skillLevel,
    bio,
  };

  if (skateType && !SKATE_TYPES.includes(skateType as (typeof SKATE_TYPES)[number])) {
    backToFormWithError("Tipo de patín no válido.", values);
  }
  if (skillLevel && !SKILL_LEVELS.includes(skillLevel)) {
    backToFormWithError("Nivel no válido.", values);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      city: city || null,
      country: country || null,
      skate_type: skateType || null,
      skill_level: skillLevel || null,
      bio: bio || null,
    })
    .eq("id", user.id);

  if (error) {
    backToFormWithError("No se pudo guardar tu perfil. Inténtalo de nuevo.", values);
  }

  revalidatePath("/perfil");
  redirect("/perfil?success=1");
}
