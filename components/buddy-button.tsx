// Archivo: components/buddy-button.tsx
// Client component: botón de relación de buddy en /u/[username], con los
// 4 estados de BuddyRelationship. Llama a las Server Actions directamente
// (sin <form>) y refresca la ruta para reflejar el nuevo estado.
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { sendBuddyRequest, acceptBuddyRequest, declineBuddyRequest } from "@/app/[locale]/buddies/actions";
import type { BuddyRelationship } from "@/lib/buddy-requests";

export function BuddyButton({
  otherUserId,
  initialRelationship,
}: {
  otherUserId: string;
  initialRelationship: BuddyRelationship;
}) {
  const t = useTranslations("BuddyButton");
  const router = useRouter();
  const [relationship, setRelationship] = useState(initialRelationship);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendBuddyRequest(otherUserId);
      if (result.error) {
        setError(t("error"));
        return;
      }
      setRelationship({ state: "sent" });
      router.refresh();
    });
  }

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptBuddyRequest(otherUserId);
      if (result.error) {
        setError(t("error"));
        return;
      }
      setRelationship({ state: "buddies" });
      router.refresh();
    });
  }

  function handleDecline() {
    setError(null);
    startTransition(async () => {
      const result = await declineBuddyRequest(otherUserId);
      if (result.error) {
        setError(t("error"));
        return;
      }
      setRelationship({ state: "none" });
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      {relationship.state === "none" && (
        <button
          type="button"
          disabled={pending}
          onClick={handleSend}
          className="rounded-lg bg-gradient-brand text-zinc-950 font-semibold px-4 py-2 text-sm transition hover:brightness-110 disabled:opacity-50"
        >
          {t("add")}
        </button>
      )}

      {relationship.state === "sent" && (
        <span className="inline-block rounded-lg border border-zinc-700 text-zinc-400 font-medium px-4 py-2 text-sm">
          {t("sent")}
        </span>
      )}

      {relationship.state === "received" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={handleAccept}
            className="rounded-lg bg-gradient-brand text-zinc-950 font-semibold px-4 py-2 text-sm transition hover:brightness-110 disabled:opacity-50"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleDecline}
            className="rounded-lg border border-zinc-700 text-zinc-400 font-medium px-3 py-2 text-sm hover:border-zinc-500 transition disabled:opacity-50"
          >
            {t("decline")}
          </button>
        </div>
      )}

      {relationship.state === "buddies" && (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-300 font-medium px-4 py-2 text-sm">
          {t("buddies")}
        </span>
      )}

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
