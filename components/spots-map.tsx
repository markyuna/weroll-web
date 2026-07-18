// Archivo: components/spots-map.tsx
// Client component: mapa interactivo de spots (Leaflet no soporta SSR).
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { QualityStars } from "./quality-stars";
import type { SpotData } from "@/lib/spots";

// Bug conocido: los iconos por defecto de Leaflet apuntan a rutas que los
// bundlers no resuelven. Se reconstruyen apuntando a los assets de unpkg.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ spots }: { spots: SpotData[] }) {
  const map = useMap();

  useEffect(() => {
    if (spots.length === 0) return;
    if (spots.length === 1) {
      map.setView([spots[0].latitude, spots[0].longitude], 14);
      return;
    }
    const bounds = L.latLngBounds(spots.map((s) => [s.latitude, s.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, spots]);

  return null;
}

export function SpotsMap({ spots }: { spots: SpotData[] }) {
  if (spots.length === 0) {
    return (
      <div className="min-h-[60vh] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <p className="text-zinc-400">Todavía no hay spots con ubicación.</p>
      </div>
    );
  }

  const center: [number, number] = [spots[0].latitude, spots[0].longitude];

  return (
    <div className="min-h-[60vh] rounded-xl overflow-hidden border border-zinc-800">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full min-h-[60vh] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds spots={spots} />
        {spots.map((spot) => {
          const upcomingCount = spot.upcoming_count?.[0]?.count ?? 0;
          return (
            <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={markerIcon}>
              <Popup className="weroll-popup">
                <div className="min-w-40">
                  <p className="font-semibold text-white">{spot.name}</p>
                  {spot.city && <p className="text-sm text-zinc-300">{spot.city}</p>}
                  <div className="mt-1.5">
                    <QualityStars quality={spot.surface_quality} />
                  </div>
                  <p className="text-sm text-zinc-300 mt-1.5">
                    {upcomingCount} {upcomingCount === 1 ? "randonnée próxima" : "randonnées próximas"}
                  </p>
                  <Link
                    href={`/eventos?spot=${spot.id}`}
                    className="inline-block mt-2 text-sm font-medium text-amber-400 hover:underline"
                  >
                    Ver randonnées
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
