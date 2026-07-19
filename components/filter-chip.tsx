// Archivo: components/filter-chip.tsx
// Chip de filtro/atributo con el estilo del badge del hero (sin pulso).
// `active` lo pinta en ámbar; con `href` se vuelve enlace (p. ej. quitar
// un filtro o navegar a él).
import { Link } from "@/i18n/navigation";
import type { ComponentProps, ReactNode } from "react";

const BASE = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium";
const ACTIVE = "border-amber-400/30 bg-amber-400/10 text-amber-300";
const INACTIVE = "border-zinc-700 bg-zinc-800/60 text-zinc-400";

export function FilterChip({
  children,
  active = true,
  href,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  href?: ComponentProps<typeof Link>["href"];
  className?: string;
}) {
  const classes = `${BASE} ${active ? ACTIVE : INACTIVE} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} transition hover:border-amber-400/60 ${active ? "hover:text-amber-200" : "hover:text-amber-300"}`}
      >
        {children}
      </Link>
    );
  }
  return <span className={classes}>{children}</span>;
}
