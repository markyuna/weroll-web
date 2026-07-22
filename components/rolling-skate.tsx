"use client";

export function RollingSkate() {
  return (
    <>
      <svg
        className="animate-roll-skate w-14 h-10 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-none"
        viewBox="0 0 32 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rueda izquierda - grande y clara */}
        <circle cx="4" cy="19" r="4" fill="currentColor" className="text-amber-400" />
        <circle cx="4" cy="19" r="2.5" fill="currentColor" className="text-amber-900" />
        <circle cx="4" cy="19" r="1" fill="currentColor" className="text-amber-300" />

        {/* Rueda derecha - grande y clara */}
        <circle cx="28" cy="19" r="4" fill="currentColor" className="text-amber-400" />
        <circle cx="28" cy="19" r="2.5" fill="currentColor" className="text-amber-900" />
        <circle cx="28" cy="19" r="1" fill="currentColor" className="text-amber-300" />

        {/* Eje izquierdo */}
        <line x1="4" y1="15" x2="4" y2="19" stroke="currentColor" strokeWidth="2" className="text-amber-600" />

        {/* Eje derecho */}
        <line x1="28" y1="15" x2="28" y2="19" stroke="currentColor" strokeWidth="2" className="text-amber-600" />

        {/* Base del boot (plataforma) */}
        <rect x="4" y="13" width="24" height="2" rx="1" fill="currentColor" className="text-amber-600" />

        {/* Boot principal (carcasa del patín) */}
        <path
          d="M 6 13 L 8 6 Q 8 4 10 4 L 22 4 Q 24 4 24 6 L 26 13 Z"
          fill="currentColor"
          className="text-amber-400"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Apertura del boot (donde entra el pie) */}
        <ellipse cx="16" cy="8" rx="6" ry="3" fill="currentColor" className="text-amber-900" opacity="0.4" />

        {/* Detalles aerodinámicos - líneas de velocidad */}
        <line x1="10" y1="6" x2="10" y2="10" stroke="currentColor" strokeWidth="1" className="text-amber-600" opacity="0.6" />
        <line x1="16" y1="5" x2="16" y2="11" stroke="currentColor" strokeWidth="1" className="text-amber-600" opacity="0.6" />
        <line x1="22" y1="6" x2="22" y2="10" stroke="currentColor" strokeWidth="1" className="text-amber-600" opacity="0.6" />
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
