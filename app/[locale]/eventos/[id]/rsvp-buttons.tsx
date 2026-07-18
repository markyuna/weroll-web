// Archivo: app/[locale]/eventos/[id]/rsvp-buttons.tsx
// Client component: único elemento interactivo de la página de detalle.
// Hace upsert en event_attendees para el usuario logueado.
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

type RsvpStatus = "asistire" | "tal_vez" | "no_asistire";

const OPTIONS: RsvpStatus[] = ["asistire", "tal_vez", "no_asistire"];

export function RsvpButtons({
  eventId,
  userId,
  initialStatus,
}: {
  eventId: string;
  userId: string | null;
  initialStatus: RsvpStatus | null;
}) {
  const t = useTranslations("Rsvp");
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<RsvpStatus | null>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    return (
      <p className="text-sm text-zinc-400">
        <Link href="/login" className="text-amber-400 hover:underline">
          {t("loginPromptLink")}
        </Link>{" "}
        {t("loginPromptSuffix")}
      </p>
    );
  }

  function handleRsvp(next: RsvpStatus) {
    setError(null);
    startTransition(async () => {
      const { error: upsertError } = await supabase
        .from("event_attendees")
        .upsert(
          { event_id: eventId, profile_id: userId, status: next },
          { onConflict: "event_id,profile_id" }
        );

      if (upsertError) {
        setError(t("error"));
        return;
      }

      setStatus(next);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const active = status === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={pending}
              onClick={() => handleRsvp(opt)}
              className={
                active
                  ? "rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 transition disabled:opacity-50"
                  : "rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 px-4 py-2 hover:border-amber-400 transition disabled:opacity-50"
              }
            >
              {t(opt)}
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
