// Archivo: components/spot-card.tsx
// Tarjeta de spot: nombre, ciudad, calidad del pavimento, próximas randonnées.
import Link from "next/link";
import { QualityStars } from "./quality-stars";
import type { SpotData } from "@/lib/spots";

export function SpotCard({ spot }: { spot: SpotData }) {
  const upcomingCount = spot.upcoming_count?.[0]?.count ?? 0;
  const location = [spot.city, spot.country].filter(Boolean).join(", ");

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
      <h3 className="text-lg font-semibold text-white">{spot.name}</h3>
      {location && <p className="text-sm text-zinc-400 mt-1">{location}</p>}

      <div className="mt-3">
        <QualityStars quality={spot.surface_quality} />
      </div>

      {spot.description && (
        <p className="text-sm text-zinc-400 mt-3">{spot.description}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-amber-400 font-medium">
          {upcomingCount} {upcomingCount === 1 ? "randonnée próxima" : "randonnées próximas"}
        </span>
        <Link
          href={`/eventos?spot=${spot.id}`}
          className="text-sm text-zinc-300 hover:text-amber-400 transition"
        >
          Ver randonnées →
        </Link>
      </div>
    </div>
  );
}
