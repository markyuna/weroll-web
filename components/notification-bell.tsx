// Archivo: components/notification-bell.tsx
// Client component: icono de campana con contador de no leídas y dropdown
// (necesita estado de apertura y detección de clic fuera, por eso no
// puede ser Server). Recibe la carga inicial ya resuelta por el header
// (Server Component) para evitar un round-trip extra al abrir.
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { markNotificationRead } from "./notification-actions";
import { NotificationListItem } from "./notification-list-item";
import type { NotificationRow } from "@/lib/notifications";

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
  locale,
}: {
  initialNotifications: NotificationRow[];
  initialUnreadCount: number;
  locale: string;
}) {
  const t = useTranslations("Notifications");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

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

  function handleRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    startTransition(() => {
      markNotificationRead(id);
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("bellLabel")}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 hover:border-amber-400 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-5 w-5 text-zinc-300"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-zinc-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="fixed left-4 right-4 top-16 z-50 max-h-96 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-lg shadow-black/40 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80"
        >
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">{t("empty")}</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} onClick={() => setOpen(false)}>
                <NotificationListItem notification={n} locale={locale} onRead={handleRead} />
              </div>
            ))
          )}
          <div className="my-1 border-t border-zinc-800" />
          <Link
            href="/notificaciones"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-center text-sm text-amber-400 hover:bg-zinc-800 transition"
          >
            {t("viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
