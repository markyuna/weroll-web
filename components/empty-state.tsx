// Archivo: components/empty-state.tsx
// Estado vacío del sistema: emoji estático grande, mensaje amable y CTA
// opcional, dentro de un marco punteado discreto.
import type { ReactNode } from "react";

export function EmptyState({
  emoji,
  children,
  cta,
  className = "",
}: {
  emoji: string;
  /** Mensaje principal (ya traducido). */
  children: ReactNode;
  /** CTA opcional, normalmente un <Link>. */
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-dashed border-zinc-800 px-6 py-12 text-center ${className}`}
    >
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
      <div className="text-zinc-400 mt-3 mx-auto max-w-md">{children}</div>
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}
