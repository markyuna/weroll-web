// Archivo: components/story-composer.tsx
// Client component: publicar una historia — foto propia (comprimida en el
// cliente y subida a Storage) o un enlace de reel/story de Instagram.
"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";
import { publishStory } from "@/app/[locale]/eventos/[id]/story-actions";

type Mode = "photo" | "instagram";

export function StoryComposer({ eventId, userId }: { eventId: string; userId: string }) {
  const t = useTranslations("StoryComposer");
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>("photo");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setExpanded(false);
    setMode("photo");
    setInstagramUrl("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("errorInvalidType"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await compressImage(file);
      const path = `${userId}/${eventId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (uploadError) {
        setError(`${t("errorSubmit")} (${uploadError.message})`);
        setBusy(false);
        return;
      }
      const result = await publishStory({ eventId, storagePath: path });
      if (result.error) {
        setError(t("errorSubmit"));
        setBusy(false);
        return;
      }
      reset();
      router.refresh();
    } catch {
      setError(t("errorSubmit"));
    } finally {
      setBusy(false);
    }
  }

  async function handleInstagramSubmit() {
    const trimmed = instagramUrl.trim();
    if (!/^https?:\/\/(www\.)?instagram\.com\//.test(trimmed)) {
      setError(t("errorInvalidUrl"));
      return;
    }
    setBusy(true);
    setError(null);
    const result = await publishStory({ eventId, instagramUrl: trimmed });
    setBusy(false);
    if (result.error) {
      setError(t("errorSubmit"));
      return;
    }
    reset();
    router.refresh();
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-lg border border-amber-400/50 text-amber-400 font-medium px-4 py-2 text-sm hover:bg-amber-400/10 transition"
      >
        {t("show")}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-amber-400 uppercase tracking-wide">{t("title")}</p>
        <button type="button" onClick={reset} className="text-sm text-zinc-500 hover:text-zinc-300 transition">
          {t("cancel")}
        </button>
      </div>
      <p className="text-xs text-zinc-500 mb-3">{t("expiryHint")}</p>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode("photo")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${mode === "photo" ? "bg-amber-400 text-zinc-950" : "border border-zinc-700 text-zinc-300"}`}
        >
          {t("modePhoto")}
        </button>
        <button
          type="button"
          onClick={() => setMode("instagram")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${mode === "instagram" ? "bg-amber-400 text-zinc-950" : "border border-zinc-700 text-zinc-300"}`}
        >
          {t("modeInstagram")}
        </button>
      </div>

      {mode === "photo" ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition disabled:opacity-50"
          >
            {busy ? t("uploading") : t("choosePhoto")}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder={t("instagramPlaceholder")}
            className="min-w-0 flex-1 rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="button"
            disabled={busy || !instagramUrl.trim()}
            onClick={handleInstagramSubmit}
            className="rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition disabled:opacity-50"
          >
            {busy ? t("uploading") : t("publish")}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </div>
  );
}
