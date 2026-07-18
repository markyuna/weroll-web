// Archivo: components/report-button.tsx
// Client component: botón "Reportar estado" + mini-formulario inline.
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { REPORT_TYPES, REPORT_ICONS } from "@/lib/spot-reports";

export function ReportButton({ spotId, userId }: { spotId: string; userId: string | null }) {
  const t = useTranslations("SpotReport");
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    return (
      <Link href="/login" className="text-xs text-amber-400 hover:underline">
        {t("loginPrompt")}
      </Link>
    );
  }

  function submit(type: string) {
    setError(null);
    startTransition(async () => {
      const { error: insertError } = await supabase.from("spot_reports").insert({
        spot_id: spotId,
        profile_id: userId,
        report_type: type,
        comment: comment.trim() || null,
      });

      if (insertError) {
        setError(t("error"));
        return;
      }

      setOpen(false);
      setComment("");
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-xs text-amber-400 hover:underline"
      >
        {t("reportCta")}
      </button>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {REPORT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            disabled={pending}
            onClick={() => submit(type)}
            className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:border-amber-400 hover:text-amber-400 transition disabled:opacity-50"
          >
            {REPORT_ICONS[type]} {t(`types.${type}`)}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("commentPlaceholder")}
        rows={2}
        className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }}
        className="text-xs text-zinc-400 hover:underline"
      >
        {t("cancel")}
      </button>
    </div>
  );
}
