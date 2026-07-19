"use client";
// Archivo: components/mobile-nav.tsx
// Client component: hamburguesa + panel desplegable del header en móvil
// (< md). El panel se ancla al <header> (sticky, y por tanto posicionado).
// Marca el enlace activo con usePathname y se cierra al navegar, con Escape
// o al hacer clic fuera.
import { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

export function MobileNav({
  links,
  label,
}: {
  links: { href: string; label: string }[];
  /** Etiqueta accesible del botón (Header.menuLabel). */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition hover:border-amber-400 hover:text-amber-300"
      >
        <span
          className={`absolute h-0.5 w-4 rounded-full bg-current transition duration-300 ${
            open ? "rotate-45" : "-translate-y-1"
          }`}
        />
        <span
          className={`absolute h-0.5 w-4 rounded-full bg-current transition duration-300 ${
            open ? "-rotate-45" : "translate-y-1"
          }`}
        />
      </button>

      {open && (
        <nav className="animate-menu-in absolute inset-x-0 top-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-lg shadow-black/40">
          <div className="mx-auto max-w-3xl px-4 py-3 flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-amber-400/10 text-amber-300"
                      : "text-zinc-200 hover:bg-zinc-900 hover:text-amber-300"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
