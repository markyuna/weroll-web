// Archivo: components/user-menu.tsx
// Client component: icono de perfil con menú desplegable (necesita estado
// de apertura/cierre y detección de clic fuera, por eso no puede ser Server).
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signOut } from "./header-actions";
import { Avatar } from "./avatar";

export function UserMenu({
  username,
  avatarUrl,
}: {
  username: string | null;
  avatarUrl: string | null;
}) {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-zinc-700 py-1 pl-1 pr-2 sm:pr-3 hover:border-amber-400 transition"
      >
        <Avatar username={username ?? "?"} avatarUrl={avatarUrl} size={28} />
        <span className="hidden sm:inline max-w-[8rem] truncate text-sm text-zinc-200">
          {username ? `@${username}` : t("myAccount")}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-lg shadow-black/40"
        >
          <Link
            href="/perfil"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-amber-400 transition"
          >
            {t("myProfile")}
          </Link>
          <Link
            href="/perfil#mis-randonnees"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-amber-400 transition"
          >
            {t("myRides")}
          </Link>
          <div className="my-1 border-t border-zinc-800" />
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 hover:text-red-400 transition"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
