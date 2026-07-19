// Archivo: components/icon-tile.tsx
// Tile de gradiente con icono (emoji). Escala y rota al hover del ancestro
// con clase `group`, como las features de la home.
import type { ReactNode } from "react";

const SIZES = {
  sm: "h-10 w-10 rounded-lg text-xl",
  md: "h-12 w-12 rounded-xl text-2xl",
} as const;

export function IconTile({
  icon,
  size = "md",
  className = "",
}: {
  icon: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-amber-400/20 to-orange-500/10 transition duration-300 group-hover:scale-110 group-hover:rotate-6 ${SIZES[size]} ${className}`}
      aria-hidden
    >
      {icon}
    </span>
  );
}
