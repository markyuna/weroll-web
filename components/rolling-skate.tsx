"use client";

export function RollingSkate() {
  return (
    <>
      <svg
        className="animate-roll-skate w-14 h-11 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-none"
        viewBox="0 0 32 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rueda izquierda delantera */}
        <circle cx="6" cy="24" r="3.5" fill="currentColor" className="text-amber-400" />
        <circle cx="6" cy="24" r="2" fill="currentColor" className="text-amber-900" />

        {/* Rueda derecha delantera */}
        <circle cx="26" cy="24" r="3.5" fill="currentColor" className="text-amber-400" />
        <circle cx="26" cy="24" r="2" fill="currentColor" className="text-amber-900" />

        {/* Soporte/chassis izquierdo */}
        <line x1="6" y1="20" x2="6" y2="24" stroke="currentColor" strokeWidth="1.5" className="text-amber-600" />

        {/* Soporte/chassis derecho */}
        <line x1="26" y1="20" x2="26" y2="24" stroke="currentColor" strokeWidth="1.5" className="text-amber-600" />

        {/* Plataforma base (donde van los pies) */}
        <path
          d="M 6 20 L 8 17 L 24 17 L 26 20 Z"
          fill="currentColor"
          className="text-amber-600"
        />

        {/* Boot/carcasa principal - la bota del patín */}
        <path
          d="M 8 17 Q 8 12 10 10 L 22 10 Q 24 12 24 17"
          fill="currentColor"
          className="text-amber-400"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Tobillo - la parte que sube */}
        <path
          d="M 10 10 Q 10 7 11 6 L 21 6 Q 22 7 22 10"
          fill="currentColor"
          className="text-amber-500"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Talón (trasero del patín) */}
        <circle cx="16" cy="18" r="1.5" fill="currentColor" className="text-amber-900" />

        {/* Detalle: línea del medio del boot (costura) */}
        <line x1="16" y1="11" x2="16" y2="17" stroke="currentColor" strokeWidth="1" className="text-amber-900" opacity="0.5" />
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
