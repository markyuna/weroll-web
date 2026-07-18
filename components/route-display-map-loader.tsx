// Archivo: components/route-display-map-loader.tsx
// Client component: dynamic import con ssr:false para el mapa de solo lectura.
"use client";

import dynamic from "next/dynamic";

export const RouteDisplayMapLoader = dynamic(
  () => import("./route-display-map").then((mod) => mod.RouteDisplayMap),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[50vh] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <p className="text-zinc-400">…</p>
      </div>
    ),
  }
);
