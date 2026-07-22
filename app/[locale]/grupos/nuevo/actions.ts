// Archivo: app/[locale]/grupos/nuevo/actions.ts
// Server Action: crea el grupo y añade al creador como admin.
"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { createInvitations } from "@/lib/invitation-actions";

export async function createGroup(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "GrupoNuevo" });

  function backToFormWithError(message: string, values: Record<string, string>): never {
    const params = new URLSearchParams({ error: message, ...values });
    return redirect({ href: `/grupos/nuevo?${params.toString()}`, locale });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const name = ((formData.get("name") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const city = ((formData.get("city") as string) ?? "").trim();
  const country = ((formData.get("country") as string) ?? "").trim();

  const values = { name, description, city, country };

  if (!name) backToFormWithError(t("errorNameRequired"), values);
  if (!city) backToFormWithError(t("errorCityRequired"), values);
  if (!country) backToFormWithError(t("errorCountryRequired"), values);

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name,
      description: description || null,
      city,
      country,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !group) {
    backToFormWithError(t("errorSubmit"), values);
  }

  await supabase.from("group_members").insert({
    group_id: group.id,
    profile_id: user.id,
    role: "admin",
  });

  const inviteBuddyIds = formData.getAll("invite_buddy_ids").filter((v): v is string => typeof v === "string");
  if (inviteBuddyIds.length > 0) {
    await createInvitations({ type: "group", targetId: group.id, targetTitle: name, inviteeIds: inviteBuddyIds });
  }

  redirect({ href: `/grupos/${group.id}`, locale });
}
