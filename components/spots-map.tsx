// Archivo: components/spots-map.tsx
// Client component: mapa interactivo de spots (Leaflet no soporta SSR).
// Incluye el flujo de creación de spots por usuarios autenticados.
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { QualityStars } from "./quality-stars";
import { SpotFormPanel, type DraftSpot } from "./spot-form-panel";
import { SpotReportBadge } from "./spot-report-badge";
import { ReportButton } from "./report-button";
import { createClient } from "@/lib/supabase/client";
import { LiveSessionControls, LiveSessionMarkers, useLiveSessions } from "./live-sessions";
import type { SpotData } from "@/lib/spots";
import type { SpotReport } from "@/lib/spot-reports";
import type { LiveSession } from "@/lib/live-sessions";

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

// Mismo icono con un filtro CSS (ver globals.css) para distinguir el marker
// del spot que se está creando de los ya guardados.
const draftMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "weroll-draft-marker",
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

function MapClickHandler({
  active,
  onPlace,
}: {
  active: boolean;
  onPlace: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string | null; country: string | null }> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
    if (!res.ok) return { city: null, country: null };
    return await res.json();
  } catch {
    return { city: null, country: null };
  }
}

export function SpotsMap({
  spots,
  userId,
  reportsBySpot,
  initialLiveSessions,
}: {
  spots: SpotData[];
  userId: string | null;
  reportsBySpot: Record<string, SpotReport>;
  initialLiveSessions: LiveSession[];
}) {
  const t = useTranslations("Spots");
  const tForm = useTranslations("SpotForm");
  const router = useRouter();
  const supabase = createClient();
  const [localSpots, setLocalSpots] = useState(spots);
  const [isPlacing, setIsPlacing] = useState(false);
  const [draft, setDraft] = useState<DraftSpot | null>(null);
  const { activeSessions, mySession, now, createSession, endSession } = useLiveSessions(
    initialLiveSessions,
    userId
  );

  async function runGeocode(lat: number, lng: number) {
    const result = await reverseGeocode(lat, lng);
    setDraft((current) => {
      // El usuario pudo haber movido el marker de nuevo mientras esperábamos.
      if (!current || current.lat !== lat || current.lng !== lng) return current;
      return {
        ...current,
        city: result.city ?? current.city,
        country: result.country ?? current.country,
        geocoding: false,
      };
    });
  }

  function handlePlace(lat: number, lng: number) {
    setIsPlacing(false);
    setDraft({
      lat,
      lng,
      name: "",
      description: "",
      spot_type: "punto_encuentro",
      surface_quality: 3,
      city: "",
      country: "",
      geocoding: true,
      saving: false,
      error: null,
    });
    runGeocode(lat, lng);
  }

  function handleDragEnd(lat: number, lng: number) {
    setDraft((current) => (current ? { ...current, lat, lng, geocoding: true } : current));
    runGeocode(lat, lng);
  }

  function handleDraftChange(patch: Partial<DraftSpot>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  async function handleSave() {
    if (!draft || !userId) return;

    if (!draft.name.trim()) {
      setDraft({ ...draft, error: tForm("errorNameRequired") });
      return;
    }

    setDraft({ ...draft, saving: true, error: null });

    const { data, error } = await supabase
      .from("spots")
      .insert({
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        spot_type: draft.spot_type,
        surface_quality: draft.surface_quality,
        city: draft.city.trim() || null,
        country: draft.country.trim() || null,
        latitude: draft.lat,
        longitude: draft.lng,
        created_by: userId,
      })
      .select("id, name, description, city, country, latitude, longitude, surface_quality")
      .single();

    if (error || !data) {
      setDraft((current) =>
        current ? { ...current, saving: false, error: tForm("errorSave") } : current
      );
      return;
    }

    setLocalSpots((prev) => [...prev, { ...data, upcoming_count: [{ count: 0 }] }]);
    setDraft(null);
    router.refresh();
  }

  function handleCancel() {
    setDraft(null);
    setIsPlacing(false);
  }

  const center: [number, number] =
    localSpots.length > 0 ? [localSpots[0].latitude, localSpots[0].longitude] : [20, 0];
  const zoom = localSpots.length > 0 ? 13 : 2;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {userId ? (
          <button
            type="button"
            onClick={() => {
              if (isPlacing) {
                setIsPlacing(false);
              } else {
                setDraft(null);
                setIsPlacing(true);
              }
            }}
            className={
              isPlacing
                ? "rounded-lg border border-zinc-700 text-zinc-300 font-medium px-4 py-2 text-sm hover:border-zinc-500 transition"
                : "rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition"
            }
          >
            {isPlacing ? tForm("cancel") : t("addButton")}
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-amber-400 text-zinc-950 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition"
          >
            {t("addButton")}
          </Link>
        )}

        {isPlacing && <p className="text-sm text-amber-400">{t("placingHint")}</p>}
      </div>

      <LiveSessionControls
        userId={userId}
        mySession={mySession}
        onCreate={createSession}
        onEnd={endSession}
      />

      <div className="min-h-[60vh] rounded-xl overflow-hidden border border-zinc-800">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className={`h-full min-h-[60vh] w-full ${isPlacing ? "cursor-crosshair" : ""}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds spots={localSpots} />
          <MapClickHandler active={isPlacing} onPlace={handlePlace} />

          {localSpots.map((spot) => {
            const upcomingCount = spot.upcoming_count?.[0]?.count ?? 0;
            return (
              <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={markerIcon}>
                <Popup className="weroll-popup">
                  <div className="min-w-40">
                    <p className="font-semibold text-white">{spot.name}</p>
                    {spot.city && <p className="text-sm text-zinc-300">{spot.city}</p>}
                    <div className="mt-1.5">
                      <QualityStars
                        quality={spot.surface_quality}
                        label={t("qualityLabel", { value: spot.surface_quality ?? 0 })}
                      />
                    </div>
                    <p className="text-sm text-zinc-300 mt-1.5">{t("upcomingCount", { count: upcomingCount })}</p>
                    <SpotReportBadge report={reportsBySpot[spot.id] ?? null} />
                    <Link
                      href={`/eventos?spot=${spot.id}`}
                      className="inline-block mt-2 text-sm font-medium text-amber-400 hover:underline"
                    >
                      {t("viewEvents")}
                    </Link>
                    <div className="mt-2">
                      <ReportButton spotId={spot.id} userId={userId} />
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <LiveSessionMarkers
            sessions={activeSessions}
            userId={userId}
            now={now}
            onEnd={endSession}
          />

          {draft && (
            <Marker
              position={[draft.lat, draft.lng]}
              icon={draftMarkerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target as L.Marker;
                  const { lat, lng } = marker.getLatLng();
                  handleDragEnd(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {draft && (
        <SpotFormPanel
          draft={draft}
          onChange={handleDraftChange}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
