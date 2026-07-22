// Archivo: components/invite-buddies-panel.tsx
// Client component: botón "Invitar buddies" en el detalle de un evento
// propio. Al invitar, notifica al buddy con enlace al evento para hacer
// RSVP (event_id ya viaja en la notificación).
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "./avatar";
import { inviteBuddyToEvent } from "@/app/[locale]/eventos/[id]/invite-actions";
import type { BuddyProfile } from "@/lib/buddy-requests";

export function InviteBuddiesPanel({ eventId, buddies }: { eventId: string; buddies: BuddyProfile[] }) {
  const t = useTranslations("InviteBuddies");
  const [expanded, setExpanded] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleInvite(buddyId: string) {
    setError(null);
    setPendingId(buddyId);
    startTransition(async () => {
      const result = await inviteBuddyToEvent(eventId, buddyId);
      setPendingId(null);
      if (result.error) {
        setError(t("error"));
        return;
      }
      setInvited((prev) => new Set(prev).add(buddyId));
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={
          expanded
            ? "rounded-lg border border-zinc-700 text-zinc-300 font-medium px-4 py-2 text-sm hover:border-zinc-500 transition"
            : "rounded-lg border border-amber-400/50 text-amber-400 font-medium px-4 py-2 text-sm hover:bg-amber-400/10 transition"
        }
      >
        {expanded ? t("hide") : t("show")}
      </button>

      {expanded && (
        <div className="mt-3">
          {buddies.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("noBuddies")}</p>
          ) : (
            <ul className="space-y-2">
              {buddies.map((buddy) => {
                const isInvited = invited.has(buddy.id);
                return (
                  <li
                    key={buddy.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                  >
                    <Avatar username={buddy.username} avatarUrl={buddy.avatar_url} size={32} />
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                      {buddy.display_name || buddy.username}
                    </span>
                    <button
                      type="button"
                      disabled={isInvited || pendingId === buddy.id}
                      onClick={() => handleInvite(buddy.id)}
                      className={
                        isInvited
                          ? "shrink-0 rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 px-3 py-1.5 text-sm font-medium"
                          : "shrink-0 rounded-lg bg-amber-400 text-zinc-950 font-semibold px-3 py-1.5 text-sm hover:bg-amber-300 transition disabled:opacity-50"
                      }
                    >
                      {isInvited ? t("invited") : t("invite")}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
