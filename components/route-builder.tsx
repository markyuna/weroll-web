// Archivo: components/route-builder.tsx
// Client component: paso opcional "Dibujar recorrido" en /eventos/nuevo.
// Cada clic en el mapa añade un punto a la polyline; también permite
// importar un GPX. Guarda el resultado en inputs del propio <form> del
// Server Component padre (route_polyline como jsonb, pause_spot_id).
"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { totalDistanceKm, type LatLng } from "@/lib/geo";
import { parseGpx, simplifyPoints, GpxParseError } from "@/lib/gpx";

type SpotOption = { id: string; name: string; city: string | null; latitude: number; longitude: number };

function ClickToAddPoint({ onAdd }: { onAdd: (point: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function RouteBuilder({ spots }: { spots: SpotOption[] }) {
  const t = useTranslations("RouteBuilder");
  const [expanded, setExpanded] = useState(false);
  const [points, setPoints] = useState<LatLng[]>([]);
  const [pauseSpotId, setPauseSpotId] = useState("");
  const [gpxError, setGpxError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const distanceKm = useMemo(() => totalDistanceKm(points), [points]);

  const center: LatLng =
    spots.length > 0
      ? [
          spots.reduce((sum, s) => sum + s.latitude, 0) / spots.length,
          spots.reduce((sum, s) => sum + s.longitude, 0) / spots.length,
        ]
      : [20, 0];

  function applyPoints(next: LatLng[]) {
    setPoints(next);
    const distanceInput = document.getElementById("distance_km") as HTMLInputElement | null;
    if (distanceInput && next.length > 1) {
      distanceInput.value = totalDistanceKm(next).toFixed(2);
    }
  }

  function handleAddPoint(point: LatLng) {
    applyPoints([...points, point]);
  }

  function handleUndo() {
    applyPoints(points.slice(0, -1));
  }

  function handleClear() {
    applyPoints([]);
  }

  async function handleGpxFile(file: File) {
    setGpxError(null);
    try {
      const text = await file.text();
      const parsed = parseGpx(text);
      applyPoints(simplifyPoints(parsed));
    } catch (err) {
      setGpxError(err instanceof GpxParseError ? t("gpxError") : t("gpxErrorGeneric"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name="route_polyline" value={points.length > 1 ? JSON.stringify(points) : ""} readOnly />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-sm text-amber-400 hover:underline"
      >
        {expanded ? t("hide") : t("show")}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-zinc-400">{t("hint")}</p>

          <div className="h-72 rounded-xl overflow-hidden border border-zinc-800 cursor-crosshair">
            <MapContainer center={center} zoom={spots.length > 0 ? 12 : 2} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickToAddPoint onAdd={handleAddPoint} />
              {points.length > 1 && <Polyline positions={points} pathOptions={{ color: "#fbbf24", weight: 4 }} />}
              {points.map((p, i) => (
                <CircleMarker
                  key={i}
                  center={p}
                  radius={4}
                  pathOptions={{ color: "#fbbf24", fillColor: "#fbbf24", fillOpacity: 1 }}
                />
              ))}
            </MapContainer>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={points.length === 0}
              onClick={handleUndo}
              className="rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium px-3 py-1.5 hover:border-zinc-500 transition disabled:opacity-50"
            >
              {t("undo")}
            </button>
            <button
              type="button"
              disabled={points.length === 0}
              onClick={handleClear}
              className="rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium px-3 py-1.5 hover:border-zinc-500 transition disabled:opacity-50"
            >
              {t("clear")}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium px-3 py-1.5 hover:border-amber-400 hover:text-amber-400 transition"
            >
              {t("importGpx")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx,application/gpx+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleGpxFile(file);
              }}
            />
            <span className="text-sm text-amber-400 font-medium ml-auto">
              {t("distance", { km: distanceKm.toFixed(2) })}
            </span>
          </div>

          {gpxError && <p className="text-sm text-red-400">{gpxError}</p>}

          {spots.length > 0 && (
            <div>
              <label htmlFor="pause_spot_id" className="block text-sm text-zinc-300 mb-1">
                {t("pauseSpot")}
              </label>
              <select
                id="pause_spot_id"
                name="pause_spot_id"
                value={pauseSpotId}
                onChange={(e) => setPauseSpotId(e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">{t("pauseSpotNone")}</option>
                {spots.map((spot) => (
                  <option key={spot.id} value={spot.id}>
                    {spot.name}
                    {spot.city ? ` — ${spot.city}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
