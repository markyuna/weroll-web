// Archivo: components/event-location-picker.tsx
// Client component: alternativa a elegir un spot en /eventos/nuevo — marca
// un único punto en el mapa y lo guarda en los inputs ocultos latitude/
// longitude del <form> padre. Mutuamente excluyente con el <select> de spot:
// elegir un spot limpia el punto marcado, y viceversa (se escuchan por DOM,
// igual que RouteBuilder con #spot_id).
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickToPlace({ onPlace }: { onPlace: (point: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPlace([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function EventLocationPicker({
  defaultCenter = [20, 0],
  initialPoint = null,
}: {
  defaultCenter?: LatLng;
  initialPoint?: LatLng | null;
}) {
  const t = useTranslations("EventLocationPicker");
  const [expanded, setExpanded] = useState(initialPoint !== null);
  const [point, setPoint] = useState<LatLng | null>(initialPoint);
  const [spotChosen, setSpotChosen] = useState(false);

  // Si el usuario elige un spot en el <select> del form padre, este punto
  // manual deja de tener sentido: se limpia y se colapsa el panel.
  useEffect(() => {
    const select = document.getElementById("spot_id") as HTMLSelectElement | null;
    if (!select) return;
    const apply = () => {
      const hasSpot = Boolean(select.value);
      setSpotChosen(hasSpot);
      if (hasSpot) {
        setPoint(null);
        setExpanded(false);
      }
    };
    apply();
    select.addEventListener("change", apply);
    return () => select.removeEventListener("change", apply);
  }, []);

  function handlePlace(next: LatLng) {
    setPoint(next);
    const select = document.getElementById("spot_id") as HTMLSelectElement | null;
    if (select) select.value = "";
  }

  if (spotChosen) return null;

  return (
    <div>
      <input type="hidden" name="latitude" value={point ? point[0] : ""} readOnly />
      <input type="hidden" name="longitude" value={point ? point[1] : ""} readOnly />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={
          expanded
            ? "rounded-lg border border-zinc-700 text-zinc-300 font-medium px-4 py-2 text-sm hover:border-zinc-500 transition"
            : "rounded-lg border border-amber-400/50 text-amber-400 font-medium px-4 py-2 text-sm hover:bg-amber-400/10 transition"
        }
      >
        {point ? t("pointSet") : expanded ? t("hide") : t("show")}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-zinc-400">{t("hint")}</p>
          <div className="h-64 rounded-xl overflow-hidden border border-zinc-800 cursor-crosshair">
            <MapContainer center={point ?? defaultCenter} zoom={point ? 14 : 2} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickToPlace onPlace={handlePlace} />
              {point && (
                <Marker
                  position={point}
                  icon={markerIcon}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target as L.Marker;
                      const { lat, lng } = marker.getLatLng();
                      handlePlace([lat, lng]);
                    },
                  }}
                />
              )}
            </MapContainer>
          </div>
          {point && (
            <p className="text-xs text-zinc-500">
              {point[0].toFixed(5)}, {point[1].toFixed(5)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
