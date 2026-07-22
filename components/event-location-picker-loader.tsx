// Archivo: components/event-location-picker-loader.tsx
// Client component: hace el dynamic import con ssr:false (Leaflet no soporta SSR).
"use client";

import dynamic from "next/dynamic";

export const EventLocationPickerLoader = dynamic(
  () => import("./event-location-picker").then((mod) => mod.EventLocationPicker),
  {
    ssr: false,
    loading: () => <p className="text-sm text-zinc-500">…</p>,
  }
);
