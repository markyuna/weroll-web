export type Difficulty = "principiante" | "intermedio" | "avanzado";

export const DIFFICULTY_LABELS: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export const DIFFICULTY_STYLES: Record<string, string> = {
  principiante: "bg-emerald-400/10 text-emerald-400",
  intermedio: "bg-amber-400/10 text-amber-400",
  avanzado: "bg-rose-400/10 text-rose-400",
};

export function formatEventDateTime(iso: string): string {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
