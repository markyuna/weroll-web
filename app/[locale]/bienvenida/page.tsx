// Archivo: app/[locale]/bienvenida/page.tsx
// Server Component: onboarding de 3 pasos tras el registro. Requiere sesión.
// Las ciudades sugeridas para el paso 1 salen de los grupos ya existentes.
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export default async function BienvenidaPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const [{ data: profile }, { data: groupCities }] = await Promise.all([
    supabase
      .from("profiles")
      .select("city, skate_type, skill_level")
      .eq("id", user.id)
      .maybeSingle()
      .overrideTypes<
        { city: string | null; skate_type: string | null; skill_level: string | null } | null,
        { merge: false }
      >(),
    supabase
      .from("groups")
      .select("city")
      .order("city", { ascending: true })
      .overrideTypes<{ city: string }[], { merge: false }>(),
  ]);

  const citySuggestions = [...new Set((groupCities ?? []).map((g) => g.city))];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <OnboardingWizard
          userId={user.id}
          initialCity={profile?.city ?? ""}
          initialSkateType={profile?.skate_type ?? ""}
          initialSkillLevel={profile?.skill_level ?? ""}
          citySuggestions={citySuggestions}
        />
      </div>
    </main>
  );
}
