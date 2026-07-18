// Archivo: components/header-actions.ts
// Server Action: cierra sesión y revalida el layout para que el header
// (y cualquier página cacheada) refleje el estado sin recarga manual.
"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: "/", locale });
}
