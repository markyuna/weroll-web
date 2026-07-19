// Archivo: components/delete-event-button.tsx
// Client component: confirmación nativa antes de invocar el Server Action
// de borrado (necesita window.confirm, por eso no puede ser Server).
"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";

export function DeleteEventButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const t = useTranslations("EventoEditar");
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(() => {
      onDelete();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-red-400/40 text-red-400 font-medium px-4 py-2 text-sm hover:bg-red-400/10 transition disabled:opacity-50"
    >
      {pending ? t("deleting") : t("deleteButton")}
    </button>
  );
}
