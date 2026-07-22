// Archivo: lib/image-compress.ts
// Redimensiona (máx. lado más largo) y comprime a JPEG bajando calidad
// hasta caber en maxBytes. Sin librerías, solo canvas — mismo enfoque que
// components/avatar-uploader.tsx pero conservando el aspect ratio.
const MAX_DIMENSION = 1600;
const MAX_BYTES = 500_000;
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45];

export async function compressImage(
  file: File,
  { maxDimension = MAX_DIMENSION, maxBytes = MAX_BYTES } = {}
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new window.Image();
    img.src = url;
    await img.decode();

    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d no disponible");
    ctx.drawImage(img, 0, 0, width, height);

    let blob: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= maxBytes) return blob;
    }
    if (!blob) throw new Error("no se pudo codificar la imagen");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
