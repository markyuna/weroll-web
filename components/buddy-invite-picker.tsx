// Archivo: components/buddy-invite-picker.tsx
// Client component: sección "Invitar buddies" reutilizada en los formularios
// de creación de evento y de grupo. Las casillas son inputs reales del
// <form> padre (name="invite_buddy_ids"), así que el Server Action las lee
// con formData.getAll("invite_buddy_ids") sin JS extra en el submit — el
// único estado de cliente es para el toggle "seleccionar todos".
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "./avatar";
import type { BuddyProfile } from "@/lib/buddy-requests";

export function BuddyInvitePicker({ buddies }: { buddies: BuddyProfile[] }) {
  const t = useTranslations("BuddyPicker");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (buddies.length === 0) return null;

  const allSelected = selected.size === buddies.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(buddies.map((b) => b.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-zinc-300">{t("sectionTitle")}</p>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-amber-400 hover:underline"
        >
          {allSelected ? t("deselectAll") : t("selectAll")}
        </button>
      </div>

      <ul className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        {buddies.map((buddy) => (
          <li key={buddy.id}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="invite_buddy_ids"
                value={buddy.id}
                checked={selected.has(buddy.id)}
                onChange={() => toggleOne(buddy.id)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-amber-400"
              />
              <Avatar username={buddy.username} avatarUrl={buddy.avatar_url} size={28} />
              <span className="text-sm text-zinc-200 truncate">{buddy.display_name || buddy.username}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
