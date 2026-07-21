// Archivo: components/onboarding-wizard.tsx
// Wizard de bienvenida en 3 pasos tras el registro. Cada paso que se completa
// (no cuando se "salta") guarda de inmediato en profiles vía el cliente de
// navegador, así el progreso no se pierde si el usuario cierra la pestaña.
"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatEventDateTime } from "@/lib/events";

const SKATE_TYPES = ["inline", "quad"] as const;
const SKILL_LEVELS = ["principiante", "intermedio", "avanzado"] as const;

type NearbyGroup = {
  id: string;
  name: string;
  member_count: { count: number }[];
};

type NearbyEvent = {
  id: string;
  title: string;
  starts_at: string;
  distance_km: number | null;
};

export function OnboardingWizard({
  userId,
  initialCity,
  initialSkateType,
  initialSkillLevel,
  citySuggestions,
}: {
  userId: string;
  initialCity: string;
  initialSkateType: string;
  initialSkillLevel: string;
  citySuggestions: string[];
}) {
  const t = useTranslations("Onboarding");
  const tSkateType = useTranslations("SkateType");
  const tDifficulty = useTranslations("Difficulty");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [city, setCity] = useState(initialCity);
  const [skateType, setSkateType] = useState(initialSkateType);
  const [skillLevel, setSkillLevel] = useState(initialSkillLevel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [group, setGroup] = useState<NearbyGroup | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (step !== 3 || !city.trim()) return;
    let cancelled = false;

    (async () => {
      setLoadingGroup(true);
      const { data: groups } = await supabase
        .from("groups")
        .select("id, name, member_count:group_members(count)")
        .ilike("city", city.trim())
        .limit(1)
        .overrideTypes<NearbyGroup[], { merge: false }>();
      const found = groups?.[0] ?? null;
      if (cancelled) return;
      setGroup(found);

      if (found) {
        const [{ data: membership }, { data: upcoming }] = await Promise.all([
          supabase
            .from("group_members")
            .select("group_id")
            .eq("group_id", found.id)
            .eq("profile_id", userId)
            .maybeSingle(),
          supabase
            .from("events")
            .select("id, title, starts_at, distance_km")
            .eq("group_id", found.id)
            .gt("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
            .limit(3)
            .overrideTypes<NearbyEvent[], { merge: false }>(),
        ]);
        if (cancelled) return;
        setIsMember(Boolean(membership));
        setEvents(upcoming ?? []);
      }
      if (!cancelled) setLoadingGroup(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [step, city, userId, supabase]);

  async function saveAndAdvance(values: Record<string, string | null>) {
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase.from("profiles").update(values).eq("id", userId);
    setSaving(false);
    if (updateError) {
      setError(t("saveError"));
      return;
    }
    setStep((s) => s + 1);
  }

  async function handleJoinGroup() {
    if (!group) return;
    setJoining(true);
    const { error: joinError } = await supabase
      .from("group_members")
      .upsert({ group_id: group.id, profile_id: userId, role: "member" }, { onConflict: "group_id,profile_id" });
    setJoining(false);
    if (!joinError) setIsMember(true);
  }

  function finish() {
    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <p className="text-sm font-medium text-amber-400 mb-2">{t("stepLabel", { step, total: 3 })}</p>
      <div className="flex gap-1.5 mb-8" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition ${n <= step ? "bg-amber-400" : "bg-zinc-800"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h1 className="font-display text-3xl uppercase leading-[0.95] text-white mb-1">
            {t("step1Title")}
          </h1>
          <p className="text-zinc-400 mb-6">{t("step1Subtitle")}</p>

          <label htmlFor="onboarding-city" className="block text-sm text-zinc-300 mb-1">
            {t("cityLabel")}
          </label>
          <input
            id="onboarding-city"
            type="text"
            list="onboarding-city-suggestions"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("cityPlaceholder")}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <datalist id="onboarding-city-suggestions">
            {citySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition"
            >
              {t("skip")}
            </button>
            <button
              type="button"
              disabled={saving || !city.trim()}
              onClick={() => saveAndAdvance({ city: city.trim() })}
              className="rounded-lg bg-gradient-brand text-zinc-950 font-semibold px-6 py-2.5 transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? t("saving") : t("next")}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="font-display text-3xl uppercase leading-[0.95] text-white mb-1">
            {t("step2Title")}
          </h1>
          <p className="text-zinc-400 mb-6">{t("step2Subtitle")}</p>

          <p className="text-sm text-zinc-300 mb-2">{t("skateTypeLabel")}</p>
          <div className="flex gap-2 mb-6">
            {SKATE_TYPES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSkateType(value)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  skateType === value
                    ? "border-amber-400 bg-amber-400/10 text-amber-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {tSkateType(value)}
              </button>
            ))}
          </div>

          <p className="text-sm text-zinc-300 mb-2">{t("skillLevelLabel")}</p>
          <div className="flex flex-col gap-2">
            {SKILL_LEVELS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSkillLevel(value)}
                className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition ${
                  skillLevel === value
                    ? "border-amber-400 bg-amber-400/10 text-amber-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {tDifficulty(value)}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition"
            >
              {t("skip")}
            </button>
            <button
              type="button"
              disabled={saving || !skateType || !skillLevel}
              onClick={() =>
                saveAndAdvance({ skate_type: skateType || null, skill_level: skillLevel || null })
              }
              className="rounded-lg bg-gradient-brand text-zinc-950 font-semibold px-6 py-2.5 transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? t("saving") : t("next")}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="font-display text-3xl uppercase leading-[0.95] text-white mb-1">
            {t("step3Title")}
          </h1>
          <p className="text-zinc-400 mb-6">
            {city.trim()
              ? group
                ? t("step3SubtitleWithGroup", { city: city.trim() })
                : t("step3SubtitleNoGroup", { city: city.trim() })
              : t("step3SubtitleNoCity")}
          </p>

          {city.trim() && loadingGroup && <p className="text-sm text-zinc-500">{t("loadingGroup")}</p>}

          {city.trim() && !loadingGroup && group && (
            <div className="rounded-card border border-zinc-800 bg-zinc-900/60 p-5 mb-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link href={`/grupos/${group.id}`} className="text-white font-semibold hover:underline">
                    {group.name}
                  </Link>
                  <p className="text-sm text-zinc-400">
                    {t("memberCount", { count: group.member_count?.[0]?.count ?? 0 })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isMember || joining}
                  onClick={handleJoinGroup}
                  className="shrink-0 rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition disabled:opacity-50"
                >
                  {isMember ? t("joined") : joining ? t("saving") : t("joinGroup")}
                </button>
              </div>

              {events.length > 0 && (
                <div className="mt-5 pt-5 border-t border-zinc-800">
                  <p className="text-sm font-medium text-zinc-300 mb-3">{t("upcomingEventsTitle")}</p>
                  <ul className="space-y-2">
                    {events.map((event) => (
                      <li key={event.id}>
                        <Link
                          href={`/eventos/${event.id}`}
                          className="block rounded-lg border border-zinc-800 px-3 py-2 hover:border-amber-400/50 transition"
                        >
                          <p className="text-sm text-white">{event.title}</p>
                          <p className="text-xs text-zinc-500">{formatEventDateTime(event.starts_at, locale)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {city.trim() && !loadingGroup && !group && (
            <Link
              href={{ pathname: "/grupos/nuevo", query: { city: city.trim() } }}
              className="mb-6 block rounded-lg border border-dashed border-zinc-700 px-5 py-4 text-center text-sm font-medium text-amber-400 hover:border-amber-400/60 transition"
            >
              {t("createGroupCta", { city: city.trim() })}
            </Link>
          )}

          <button
            type="button"
            onClick={finish}
            className="w-full rounded-lg bg-gradient-brand text-zinc-950 font-semibold py-2.5 transition hover:brightness-110"
          >
            {t("finish")}
          </button>
        </div>
      )}
    </div>
  );
}
