const HANDLE_RE = /^[a-z0-9_](\.?[a-z0-9_]){0,29}$/;

/**
 * Acepta "@marta", "marta" o una URL de instagram.com y devuelve el
 * usuario normalizado (sin @, en minúsculas) o null si no es válido.
 */
export function normalizeInstagramHandle(input: string): string | null {
  let v = input.trim().toLowerCase();
  if (!v) return null;

  const urlMatch = v.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/);
  if (urlMatch) v = urlMatch[1];

  v = v.replace(/^@/, "").replace(/\/+$/, "");

  return HANDLE_RE.test(v) ? v : null;
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}
