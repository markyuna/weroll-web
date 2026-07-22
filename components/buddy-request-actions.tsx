// Archivo: components/buddy-request-actions.tsx
// Client component: aceptar/rechazar una solicitud recibida, en la pestaña
// "Solicitudes" de /buddies.
"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { acceptBuddyRequest, declineBuddyRequest } from "@/app/[locale]/buddies/actions";

export function BuddyRequestActions({ requesterId }: { requesterId: string }) {
  const t = useTranslations("BuddyButton");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      await acceptBuddyRequest(requesterId);
      router.refresh();
    });
  }

  function handleDecline() {
    startTransition(async () => {
      await declineBuddyRequest(requesterId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        disabled={pending}
        onClick={handleAccept}
        className="rounded-lg bg-gradient-brand text-zinc-950 font-semibold px-3 py-1.5 text-sm transition hover:brightness-110 disabled:opacity-50"
      >
        {t("accept")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={handleDecline}
        className="rounded-lg border border-zinc-700 text-zinc-400 font-medium px-3 py-1.5 text-sm hover:border-zinc-500 transition disabled:opacity-50"
      >
        {t("decline")}
      </button>
    </div>
  );
}
