// Archivo: components/card.tsx
// Tarjeta base del sistema de diseño: borde zinc, radio de token
// (rounded-card) y, si es interactiva, elevación + sombra ámbar al hover.
// Con `href` se renderiza como Link (interactiva por defecto); sin él, como
// <div> estático salvo que se fuerce `interactive` (p. ej. tarjetas con
// varios enlaces internos, como EventCard).
// No fija display: si el contenido necesita flex/grid, usa un div interior.
import { Link } from "@/i18n/navigation";
import type { ComponentProps, ReactNode } from "react";

const BASE = "rounded-card border border-zinc-800 bg-zinc-900/60";
const HOVER =
  "transition duration-300 ease-out-expo hover:border-amber-400/50 hover:bg-zinc-900 hover:-translate-y-1 hover:shadow-glow-soft";

export function Card({
  href,
  interactive,
  className = "",
  children,
}: {
  href?: ComponentProps<typeof Link>["href"];
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const classes = `${BASE} ${(interactive ?? Boolean(href)) ? HOVER : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={`block ${classes}`}>
        {children}
      </Link>
    );
  }
  return <div className={classes}>{children}</div>;
}
