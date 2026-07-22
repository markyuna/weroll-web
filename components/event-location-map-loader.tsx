// Archivo: components/event-location-map-loader.tsx
// Client component: dynamic import con ssr:false (Leaflet no soporta SSR).
"use client";

import dynamic from "next/dynamic";

export const EventLocationMapLoader = dynamic(
  () => import("./event-location-map").then((mod) => mod.EventLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <p className="text-zinc-400">…</p>
      </div>
    ),
  }
);
