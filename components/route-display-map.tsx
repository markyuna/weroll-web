// Archivo: components/route-display-map.tsx
// Client component: muestra el trazado de una randonnée (solo lectura).
"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";

function FitToRoute({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
  }, [map, points]);

  return null;
}

export function RouteDisplayMap({
  points,
  pauseSpot,
}: {
  points: LatLng[];
  pauseSpot: { name: string; position: LatLng } | null;
}) {
  const t = useTranslations("RouteDisplay");

  if (points.length < 2) return null;

  const start = points[0];
  const end = points[points.length - 1];

  return (
    <div className="min-h-[50vh] rounded-xl overflow-hidden border border-zinc-800">
      <MapContainer center={start} zoom={13} scrollWheelZoom className="h-full min-h-[50vh] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToRoute points={points} />
        <Polyline positions={points} pathOptions={{ color: "#ef4444", weight: 4 }} />

        <CircleMarker center={start} radius={8} pathOptions={{ color: "#4ade80", fillColor: "#4ade80", fillOpacity: 1 }}>
          <Popup className="weroll-popup">{t("start")}</Popup>
        </CircleMarker>

        {pauseSpot && (
          <CircleMarker
            center={pauseSpot.position}
            radius={8}
            pathOptions={{ color: "#fbbf24", fillColor: "#fbbf24", fillOpacity: 1 }}
          >
            <Popup className="weroll-popup">
              {t("pause")}: {pauseSpot.name}
            </Popup>
          </CircleMarker>
        )}

        <CircleMarker center={end} radius={8} pathOptions={{ color: "#f87171", fillColor: "#f87171", fillOpacity: 1 }}>
          <Popup className="weroll-popup">{t("end")}</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
