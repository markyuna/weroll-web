// Archivo: components/route-builder-loader.tsx
// Client component: hace el dynamic import con ssr:false (obligatorio fuera
// de un Server Component en Next.js App Router).
"use client";

import dynamic from "next/dynamic";

export const RouteBuilderLoader = dynamic(
  () => import("./route-builder").then((mod) => mod.RouteBuilder),
  {
    ssr: false,
    loading: () => <p className="text-sm text-zinc-500">…</p>,
  }
);
