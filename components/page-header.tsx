// Archivo: components/page-header.tsx
// Cabecera estándar de página interior: H1 (con gradiente de marca en el
// chunk <amber> vía AmberChunk), subtítulo opcional y hueco para una acción
// (p. ej. botón "Crear"). Server-safe.
import type { ReactNode } from "react";

/** Render del chunk <amber> de i18n: `t.rich("title", { amber: AmberChunk })`. */
export function AmberChunk(chunks: ReactNode) {
  return <span className="text-gradient-brand">{chunks}</span>;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-4xl sm:text-5xl uppercase leading-[0.95] text-white tracking-tight">{title}</h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {subtitle && <p className="text-zinc-400 mt-2">{subtitle}</p>}
    </div>
  );
}
