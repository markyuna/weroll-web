// Archivo: components/spots-map-loader.tsx
// Client component: hace el dynamic import con ssr:false.
// Next.js no permite ssr:false directamente en un Server Component,
// así que esta indirección vive del lado del cliente.
"use client";

import dynamic from "next/dynamic";

export const SpotsMapLoader = dynamic(
  () => import("./spots-map").then((mod) => mod.SpotsMap),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[60vh] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <p className="text-zinc-400">Cargando mapa…</p>
      </div>
    ),
  }
);
