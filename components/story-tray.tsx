// Archivo: components/story-tray.tsx
// Client component: punto de entrada a las historias de un evento — anillo
// ámbar si hay alguna sin ver, gris si ya las vi todas. Abre StoryViewer.
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Avatar } from "./avatar";
import type { EventStory } from "@/lib/event-stories";

const StoryViewer = dynamic(() => import("./story-viewer").then((m) => m.StoryViewer), { ssr: false });

export function StoryTray({
  stories,
  viewerId,
  seenStoryIds,
  autoOpen = false,
  size = 40,
}: {
  stories: EventStory[];
  viewerId: string;
  seenStoryIds: string[];
  autoOpen?: boolean;
  size?: number;
}) {
  const t = useTranslations("StoryViewer");
  const [open, setOpen] = useState(() => autoOpen && stories.length > 0);
  const seen = new Set(seenStoryIds);
  const hasUnseen = stories.some((s) => !seen.has(s.id));

  if (stories.length === 0) return null;
  const firstAuthor = stories[0].author;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-2"
      >
        <span className={`flex rounded-full p-0.5 ${hasUnseen ? "bg-gradient-brand" : "bg-zinc-700"}`}>
          <Avatar
            username={firstAuthor?.username ?? "?"}
            avatarUrl={firstAuthor?.avatar_url ?? null}
            size={size}
            className="ring-2 ring-zinc-950"
          />
        </span>
        <span className={`text-xs font-medium ${hasUnseen ? "text-amber-400" : "text-zinc-500"}`}>
          {t("cta", { count: stories.length })}
        </span>
      </button>

      {open && (
        <StoryViewer stories={stories} initialIndex={0} viewerId={viewerId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
