// Archivo: components/route-display-map.tsx
// Client component: muestra el trazado de una randonnée (solo lectura).
"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@/i18n/navigation";
import { avatarColor, avatarInitial } from "@/components/avatar";
import type { LatLng } from "@/lib/geo";

export type MapAttendee = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

const AVATAR_ICON_SIZE = 32;
const MAX_ATTENDEE_MARKERS = 8;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Los iconos de Leaflet son HTML plano (no React), de ahí los estilos en
// línea y el escapado manual; la fila de avatares se despliega hacia la
// derecha desplazando el iconAnchor por índice.
function circleIcon(inner: string, index: number, background: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:${AVATAR_ICON_SIZE}px;height:${AVATAR_ICON_SIZE}px;border-radius:9999px;border:2px solid #fbbf24;background:${background};overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.5);">${inner}</div>`,
    iconSize: [AVATAR_ICON_SIZE, AVATAR_ICON_SIZE],
    iconAnchor: [18 - index * 24, 44],
  });
}

function attendeeDivIcon(attendee: MapAttendee, index: number): L.DivIcon {
  if (attendee.avatarUrl) {
    return circleIcon(
      `<img src="${escapeHtml(attendee.avatarUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;" />`,
      index,
      "#18181b"
    );
  }
  const { background, color } = avatarColor(attendee.username);
  return circleIcon(
    `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;color:${color};font-weight:600;font-size:14px;">${escapeHtml(avatarInitial(attendee.username))}</span>`,
    index,
    background
  );
}

function extraCountDivIcon(count: number, index: number): L.DivIcon {
  return circleIcon(
    `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;color:#e4e4e7;font-weight:600;font-size:12px;">+${count}</span>`,
    index,
    "#27272a"
  );
}

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
  attendees = [],
}: {
  points: LatLng[];
  pauseSpot: { name: string; position: LatLng } | null;
  attendees?: MapAttendee[];
}) {
  const t = useTranslations("RouteDisplay");

  if (points.length < 2) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const visibleAttendees = attendees.slice(0, MAX_ATTENDEE_MARKERS);
  const extraCount = attendees.length - visibleAttendees.length;

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

        {visibleAttendees.map((attendee, i) => (
          <Marker
            key={attendee.username}
            position={start}
            icon={attendeeDivIcon(attendee, i)}
            zIndexOffset={500 + i}
          >
            <Popup className="weroll-popup">
              <Link href={`/u/${attendee.username}`} className="text-amber-400 hover:underline">
                {attendee.displayName || attendee.username}
              </Link>
            </Popup>
          </Marker>
        ))}
        {extraCount > 0 && (
          <Marker
            position={start}
            icon={extraCountDivIcon(extraCount, visibleAttendees.length)}
            zIndexOffset={500 + visibleAttendees.length}
          >
            <Popup className="weroll-popup">{t("moreAttendees", { count: extraCount })}</Popup>
          </Marker>
        )}

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
