const RTF_LOCALES: Record<string, string> = { es: "es-ES", en: "en-US", fr: "fr-FR" };

export function formatRelativeTime(iso: string, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(RTF_LOCALES[locale] ?? locale, { numeric: "auto" });
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  return rtf.format(diffHour, "hour");
}
