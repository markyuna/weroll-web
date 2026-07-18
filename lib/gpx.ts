import type { LatLng } from "./geo";

export class GpxParseError extends Error {}

export function parseGpx(xmlText: string): LatLng[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  if (doc.querySelector("parsererror")) {
    throw new GpxParseError("invalid-xml");
  }

  const trkpts = Array.from(doc.getElementsByTagName("trkpt"));
  if (trkpts.length === 0) {
    throw new GpxParseError("no-track-points");
  }

  const points: LatLng[] = trkpts.map((pt) => [
    parseFloat(pt.getAttribute("lat") ?? "NaN"),
    parseFloat(pt.getAttribute("lon") ?? "NaN"),
  ]);

  if (points.some(([lat, lon]) => Number.isNaN(lat) || Number.isNaN(lon))) {
    throw new GpxParseError("invalid-coordinates");
  }

  return points;
}

// Submuestreo uniforme: conserva como mucho maxPoints puntos (siempre
// incluye el primero y el último) para no inflar el jsonb con tracks GPS
// de miles de puntos.
export function simplifyPoints(points: LatLng[], maxPoints = 500): LatLng[] {
  if (points.length <= maxPoints) return points;

  const step = (points.length - 1) / (maxPoints - 1);
  const result: LatLng[] = [];
  for (let i = 0; i < maxPoints; i++) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
}
