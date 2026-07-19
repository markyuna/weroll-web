// Archivo: components/avatar-uploader.tsx
// Client component: subida de foto de perfil con preview. Recorta al centro
// en cuadrado y redimensiona a 256×256 con canvas (sin librerías) antes de
// subir a Storage bajo el prefijo {user_id}/; guarda la URL pública en
// profiles.avatar_url. JPEG en vez de WebP porque canvas.toBlob("image/webp")
// no está garantizado en todos los navegadores (Safari devuelve PNG).
"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./avatar";

const SIDE = 256;

async function resizeToSquare(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new window.Image();
    img.src = url;
    await img.decode();
    const crop = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - crop) / 2;
    const sy = (img.naturalHeight - crop) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = SIDE;
    canvas.height = SIDE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d no disponible");
    ctx.drawImage(img, sx, sy, crop, crop, 0, 0, SIDE, SIDE);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!blob) throw new Error("no se pudo codificar la imagen");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarUploader({
  userId,
  username,
  avatarUrl,
}: {
  userId: string;
  username: string;
  avatarUrl: string | null;
}) {
  const t = useTranslations("Perfil");
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetPending() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingBlob(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFileChange(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("avatarInvalidType"));
      return;
    }
    try {
      const blob = await resizeToSquare(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPendingBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setError(t("avatarError"));
    }
  }

  async function removeStaleFiles(keepName: string | null) {
    // Limpieza best-effort del prefijo propio; si falla no es grave.
    const { data: files } = await supabase.storage.from("avatars").list(userId);
    const stale = (files ?? [])
      .filter((f) => f.name !== keepName)
      .map((f) => `${userId}/${f.name}`);
    if (stale.length > 0) {
      await supabase.storage.from("avatars").remove(stale);
    }
  }

  async function save() {
    if (!pendingBlob) return;
    setBusy(true);
    setError(null);
    // Nombre con timestamp para no pelear con la caché de la CDN al reemplazar.
    const name = `avatar-${Date.now()}.jpg`;
    const path = `${userId}/${name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, pendingBlob, { contentType: "image/jpeg" });
    if (uploadError) {
      // El detalle técnico (p. ej. "Bucket not found", violación de RLS)
      // acompaña al mensaje traducido: sin él es imposible diagnosticar.
      setError(`${t("avatarError")} (${uploadError.message})`);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", userId);
    if (updateError) {
      setError(`${t("avatarError")} (${updateError.message})`);
      setBusy(false);
      return;
    }
    await removeStaleFiles(name);
    resetPending();
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);
    if (updateError) {
      setError(t("avatarError"));
      setBusy(false);
      return;
    }
    await removeStaleFiles(null);
    resetPending();
    setBusy(false);
    router.refresh();
  }

  const buttonClass =
    "rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm px-3 py-1.5 hover:border-amber-400 hover:text-amber-400 transition disabled:opacity-50";

  return (
    <div>
      <div className="flex items-center gap-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview local (blob URL) generada en el cliente
          <img src={previewUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <Avatar username={username} avatarUrl={avatarUrl} size={80} />
        )}

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          {pendingBlob ? (
            <>
              <button type="button" disabled={busy} onClick={save} className="rounded-lg bg-amber-400 text-zinc-950 text-sm font-semibold px-3 py-1.5 hover:bg-amber-300 transition disabled:opacity-50">
                {t("avatarSave")}
              </button>
              <button type="button" disabled={busy} onClick={resetPending} className={buttonClass}>
                {t("avatarCancel")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className={buttonClass}
              >
                {avatarUrl ? t("avatarChange") : t("avatarUpload")}
              </button>
              {avatarUrl && (
                <button type="button" disabled={busy} onClick={remove} className={buttonClass}>
                  {t("avatarRemove")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
