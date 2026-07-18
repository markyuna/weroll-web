// Archivo: components/language-switcher.tsx
// Client component: selector de idioma (ES/EN/FR) en el navbar.
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
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

  function switchTo(nextLocale: string) {
    setOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        className="whitespace-nowrap rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-amber-400 hover:text-amber-400 transition disabled:opacity-50"
      >
        {locale.toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-36 rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-lg shadow-black/40"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              onClick={() => switchTo(l.code)}
              className={`block w-full px-4 py-2 text-left text-sm transition ${
                l.code === locale
                  ? "text-amber-400"
                  : "text-zinc-200 hover:bg-zinc-800 hover:text-amber-400"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
