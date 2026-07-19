// Archivo: app/[locale]/perfil/actions.ts
// Server Action: actualiza los datos editables del perfil del usuario logueado.
"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { SKATE_TYPES, SKATE_STYLES } from "@/lib/profiles";

const SKILL_LEVELS = ["principiante", "intermedio", "avanzado"];

export async function updateProfile(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Perfil" });

  function backToFormWithError(message: string, values: Record<string, string>): never {
    const params = new URLSearchParams({ error: message, ...values });
    return redirect({ href: `/perfil?${params.toString()}`, locale });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const displayName = ((formData.get("display_name") as string) ?? "").trim();
  const city = ((formData.get("city") as string) ?? "").trim();
  const country = ((formData.get("country") as string) ?? "").trim();
  const skateType = ((formData.get("skate_type") as string) ?? "").trim();
  const skateStyle = ((formData.get("skate_style") as string) ?? "").trim();
  const skillLevel = ((formData.get("skill_level") as string) ?? "").trim();
  const bio = ((formData.get("bio") as string) ?? "").trim();
  const hideFromRankings = formData.get("hide_from_rankings") === "on";

  const values = {
    display_name: displayName,
    city,
    country,
    skate_type: skateType,
    skate_style: skateStyle,
    skill_level: skillLevel,
    bio,
    hide_from_rankings: hideFromRankings ? "on" : "",
  };

  if (skateType && !SKATE_TYPES.includes(skateType as (typeof SKATE_TYPES)[number])) {
    backToFormWithError(t("errorSkateType"), values);
  }
  if (skateStyle && !SKATE_STYLES.includes(skateStyle as (typeof SKATE_STYLES)[number])) {
    backToFormWithError(t("errorSkateStyle"), values);
  }
  if (skillLevel && !SKILL_LEVELS.includes(skillLevel)) {
    backToFormWithError(t("errorSkillLevel"), values);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      city: city || null,
      country: country || null,
      skate_type: skateType || null,
      skate_style: skateStyle || null,
      skill_level: skillLevel || null,
      bio: bio || null,
      hide_from_rankings: hideFromRankings,
    })
    .eq("id", user.id);

  if (error) {
    backToFormWithError(t("errorSubmit"), values);
  }

  revalidatePath(`/${locale}/perfil`);
  redirect({ href: "/perfil?success=1", locale });
}
