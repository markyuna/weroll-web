// Archivo: components/avatar.tsx
// Avatar reutilizable: foto si existe, si no iniciales sobre un color
// derivado del username. Sin "use client" a propósito: se usa igual desde
// Server Components (tarjetas, listas) y Client Components (menú, mapa).
// Colores en línea (no clases Tailwind) para poder reutilizar la misma
// paleta en el HTML plano de los divIcon de Leaflet.

const PALETTE: { background: string; color: string }[] = [
  { background: "#fbbf24", color: "#18181b" }, // amber
  { background: "#34d399", color: "#18181b" }, // emerald
  { background: "#38bdf8", color: "#18181b" }, // sky
  { background: "#fb7185", color: "#18181b" }, // rose
  { background: "#a78bfa", color: "#18181b" }, // violet
  { background: "#fb923c", color: "#18181b" }, // orange
  { background: "#2dd4bf", color: "#18181b" }, // teal
  { background: "#f472b6", color: "#18181b" }, // pink
];

export function avatarColor(username: string): { background: string; color: string } {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function avatarInitial(username: string): string {
  return (username.charAt(0) || "?").toUpperCase();
}

export function Avatar({
  username,
  avatarUrl,
  size = 32,
  className = "",
}: {
  username: string;
  avatarUrl: string | null;
  /** Lado en píxeles (el componente siempre es cuadrado y redondo). */
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar_url es una URL externa arbitraria (sin dominio fijo que configurar en next/image)
      <img
        src={avatarUrl}
        alt=""
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const { background, color } = avatarColor(username);
  return (
    <span
      style={{ width: size, height: size, background, color, fontSize: Math.round(size * 0.45) }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
      aria-hidden
    >
      {avatarInitial(username)}
    </span>
  );
}
