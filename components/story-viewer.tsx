// Archivo: components/story-viewer.tsx
// Client component: visor de historias a pantalla completa, estilo
// Instagram — barra de progreso por historia, avance automático, tap
// izquierda/derecha para navegar. Registra la vista al mostrar cada una.
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { markStoryViewed, getStoryImageUrl, type EventStory } from "@/lib/event-stories";
import { InstagramEmbed } from "./instagram-embed";
import { Avatar } from "./avatar";

const DURATION_MS = 6000;

export function StoryViewer({
  stories,
  initialIndex,
  viewerId,
  onClose,
}: {
  stories: EventStory[];
  initialIndex: number;
  viewerId: string;
  onClose: () => void;
}) {
  const t = useTranslations("StoryViewer");
  const supabase = createClient();
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const story = stories[index];

  useEffect(() => {
    if (story) markStoryViewed(supabase, story.id, viewerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de historia
  }, [story?.id]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1 < stories.length ? i + 1 : -1));
    }, DURATION_MS);
    return () => clearTimeout(timer);
  }, [index, paused, stories.length]);

  useEffect(() => {
    if (index === -1) onClose();
  }, [index, onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1 < stories.length ? i + 1 : -1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [stories.length, onClose]);

  if (!story) return null;

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function goNext() {
    setIndex((i) => (i + 1 < stories.length ? i + 1 : -1));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-2">
          {stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width: i < index ? "100%" : i > index ? "0%" : undefined,
                  animation: i === index && !paused ? `weroll-story-progress ${DURATION_MS}ms linear forwards` : undefined,
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 top-4 z-10 flex items-center gap-2 px-3 pt-2">
          <Avatar username={story.author?.username ?? "?"} avatarUrl={story.author?.avatar_url ?? null} size={28} />
          <span className="text-sm font-medium text-white drop-shadow">
            {story.author?.display_name || story.author?.username || "?"}
          </span>
          <span className="ml-auto text-xs text-white/70">{t("expiryHint")}</span>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white text-xl leading-none px-2">
            ✕
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          {story.instagram_url ? (
            <div className="max-h-full w-full overflow-y-auto" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              <InstagramEmbed url={story.instagram_url} />
            </div>
          ) : story.storage_path ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL pública de Storage, dominio no fijo
            <img
              src={getStoryImageUrl(supabase, story.storage_path)}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : null}

          <button
            type="button"
            aria-label={t("prev")}
            onClick={goPrev}
            className="absolute inset-y-0 left-0 w-1/3 cursor-pointer"
          />
          <button
            type="button"
            aria-label={t("next")}
            onClick={goNext}
            className="absolute inset-y-0 right-0 w-2/3 cursor-pointer"
          />
        </div>

        <div className="p-3 text-center">
          <Link href={`/eventos/${story.event_id}`} onClick={onClose} className="text-sm text-amber-300 hover:underline">
            {t("viewEvent")}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes weroll-story-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
