"use client";

export function RollingSkate() {
  return (
    <>
      <svg
        className="animate-roll-skate w-16 h-12 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-none"
        viewBox="0 0 40 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* RUEDAS */}
        {/* Rueda frontal izquierda */}
        <circle cx="8" cy="26" r="4" fill="currentColor" className="text-amber-400" />
        <circle cx="8" cy="26" r="2.5" fill="currentColor" className="text-amber-900" />
        <circle cx="8" cy="26" r="1" fill="currentColor" className="text-amber-300" />

        {/* Rueda trasera izquierda */}
        <circle cx="16" cy="26" r="4" fill="currentColor" className="text-amber-400" />
        <circle cx="16" cy="26" r="2.5" fill="currentColor" className="text-amber-900" />
        <circle cx="16" cy="26" r="1" fill="currentColor" className="text-amber-300" />

        {/* Rueda frontal derecha */}
        <circle cx="24" cy="26" r="4" fill="currentColor" className="text-amber-400" />
        <circle cx="24" cy="26" r="2.5" fill="currentColor" className="text-amber-900" />
        <circle cx="24" cy="26" r="1" fill="currentColor" className="text-amber-300" />

        {/* Rueda trasera derecha */}
        <circle cx="32" cy="26" r="4" fill="currentColor" className="text-amber-400" />
        <circle cx="32" cy="26" r="2.5" fill="currentColor" className="text-amber-900" />
        <circle cx="32" cy="26" r="1" fill="currentColor" className="text-amber-300" />

        {/* EJES */}
        <line x1="8" y1="22" x2="8" y2="26" stroke="currentColor" strokeWidth="1" className="text-amber-600" />
        <line x1="16" y1="22" x2="16" y2="26" stroke="currentColor" strokeWidth="1" className="text-amber-600" />
        <line x1="24" y1="22" x2="24" y2="26" stroke="currentColor" strokeWidth="1" className="text-amber-600" />
        <line x1="32" y1="22" x2="32" y2="26" stroke="currentColor" strokeWidth="1" className="text-amber-600" />

        {/* BOTA - SIMPLIFICADA Y CLARA */}
        {/* Plataforma base (donde va el pie) */}
        <rect x="12" y="18" width="16" height="4" rx="2" fill="currentColor" className="text-amber-600" />

        {/* Parte principal del boot (forma de bota) */}
        <rect x="13" y="10" width="14" height="8" rx="3" fill="currentColor" className="text-amber-400" stroke="currentColor" strokeWidth="1.5" />

        {/* Tobillo/caña (parte que sube) */}
        <rect x="15" y="6" width="10" height="4" rx="2" fill="currentColor" className="text-amber-500" stroke="currentColor" strokeWidth="1.5" />

        {/* Borde superior del tobillo */}
        <line x1="15" y1="6" x2="25" y2="6" stroke="currentColor" strokeWidth="1.5" className="text-amber-600" />

        {/* LAZOS/CORDONES */}
        <line x1="14" y1="12" x2="26" y2="12" stroke="currentColor" strokeWidth="1.5" className="text-amber-900" strokeLinecap="round" />
        <line x1="14" y1="15" x2="26" y2="15" stroke="currentColor" strokeWidth="1.5" className="text-amber-900" strokeLinecap="round" />

        {/* FRENO TRASERO (pequeño) */}
        <path
          d="M 29 18 L 31 16 L 31 20 Z"
          fill="currentColor"
          className="text-amber-700"
          stroke="currentColor"
          strokeWidth="1"
        />

        {/* LÍNEA CENTRAL DE DIVISIÓN */}
        <line x1="20" y1="10" x2="20" y2="18" stroke="currentColor" strokeWidth="0.8" className="text-amber-900" opacity="0.3" />
      </svg>

      <style>{`
        @keyframes roll-skate {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }

        .animate-roll-skate {
          animation: roll-skate 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
