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

        {/* CHASIS/ESTRUCTURA */}
        {/* Ejes del chasis */}
        <line x1="8" y1="22" x2="8" y2="26" stroke="currentColor" strokeWidth="1" className="text-amber-600" />
        <line x1="16" y1="22" x2="16" y2="26" stroke="currentColor" strokeWidth="1" className="text-amber-600" />
        <line x1="24" y1="22" x2="24" y2="26" stroke="currentColor" strokeWidth="1" className="text-amber-600" />
        <line x1="32" y1="22" x2="32" y2="26" stroke="currentColor" strokeWidth="1" className="text-amber-600" />

        {/* Plataforma base */}
        <path
          d="M 8 22 L 10 19 L 30 19 L 32 22 Z"
          fill="currentColor"
          className="text-amber-600"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* BOTA PRINCIPAL */}
        {/* Parte baja del boot */}
        <path
          d="M 10 19 L 12 13 Q 12 11 13 10 L 27 10 Q 28 11 28 13 L 30 19 Z"
          fill="currentColor"
          className="text-amber-400"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Tobillo/caña (parte que sube) */}
        <path
          d="M 13 10 Q 13 6 14 5 L 26 5 Q 27 6 27 10"
          fill="currentColor"
          className="text-amber-500"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Parte superior del tobillo */}
        <ellipse cx="20" cy="5" rx="8" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-600" />

        {/* LAZOS/CORDONES */}
        <path d="M 14 8 Q 20 9 26 8" stroke="currentColor" strokeWidth="1" className="text-amber-900" strokeLinecap="round" />
        <path d="M 14 12 Q 20 13 26 12" stroke="currentColor" strokeWidth="1" className="text-amber-900" strokeLinecap="round" />

        {/* FRENO TRASERO */}
        <path
          d="M 30 19 L 32 18 Q 33 18 33 19 L 32 20 Z"
          fill="currentColor"
          className="text-amber-700"
          stroke="currentColor"
          strokeWidth="1"
        />

        {/* DETALLES/DECORACIÓN */}
        {/* Línea central del boot */}
        <line x1="20" y1="10" x2="20" y2="19" stroke="currentColor" strokeWidth="0.8" className="text-amber-900" opacity="0.4" />

        {/* Detalle lateral */}
        <path d="M 12 14 L 12 17" stroke="currentColor" strokeWidth="0.8" className="text-amber-900" opacity="0.3" />
        <path d="M 28 14 L 28 17" stroke="currentColor" strokeWidth="0.8" className="text-amber-900" opacity="0.3" />
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
