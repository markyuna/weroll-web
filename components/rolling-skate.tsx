"use client";

export function RollingSkate() {
  return (
    <>
      <svg
        className="animate-roll-skate w-14 h-12 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-none"
        viewBox="0 0 32 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* RUEDAS */}
        <circle cx="5" cy="28" r="4" fill="currentColor" className="text-gray-800" />
        <circle cx="5" cy="28" r="2" fill="currentColor" className="text-gray-600" />

        <circle cx="12" cy="28" r="4" fill="currentColor" className="text-gray-800" />
        <circle cx="12" cy="28" r="2" fill="currentColor" className="text-gray-600" />

        <circle cx="20" cy="28" r="4" fill="currentColor" className="text-gray-800" />
        <circle cx="20" cy="28" r="2" fill="currentColor" className="text-gray-600" />

        <circle cx="27" cy="28" r="4" fill="currentColor" className="text-gray-800" />
        <circle cx="27" cy="28" r="2" fill="currentColor" className="text-gray-600" />

        {/* PLATAFORMA BASE */}
        <line x1="5" y1="24" x2="27" y2="24" stroke="currentColor" strokeWidth="2" className="text-gray-700" />

        {/* BOOT PRINCIPAL - PARTE BAJA */}
        <path
          d="M 6 24 L 8 18 L 24 18 L 26 24 Z"
          fill="currentColor"
          className="text-gray-500"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* BOOT PRINCIPAL - PARTE MEDIA */}
        <rect x="8" y="12" width="16" height="6" rx="2" fill="currentColor" className="text-gray-600" stroke="currentColor" strokeWidth="1.5" />

        {/* TOBILLO/CAÑA */}
        <path
          d="M 10 12 Q 10 8 12 6 L 20 6 Q 22 8 22 12"
          fill="currentColor"
          className="text-gray-700"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* BORDE SUPERIOR TOBILLO */}
        <line x1="12" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" className="text-gray-800" />

        {/* CIERRE/VELCRO (lado izquierdo) */}
        <rect x="6" y="13" width="2" height="7" rx="1" fill="currentColor" className="text-gray-500" />
        <line x1="6.5" y1="14" x2="7.5" y2="14" stroke="currentColor" strokeWidth="0.5" className="text-gray-700" />
        <line x1="6.5" y1="16" x2="7.5" y2="16" stroke="currentColor" strokeWidth="0.5" className="text-gray-700" />
        <line x1="6.5" y1="18" x2="7.5" y2="18" stroke="currentColor" strokeWidth="0.5" className="text-gray-700" />

        {/* ACCESO/APERTURA (detalle azul) */}
        <rect x="18" y="15" width="5" height="3" rx="1" fill="currentColor" stroke="currentColor" strokeWidth="1" className="text-blue-400" />

        {/* LÍNEA CENTRAL DECORATIVA */}
        <line x1="16" y1="12" x2="16" y2="18" stroke="currentColor" strokeWidth="1" className="text-gray-800" opacity="0.4" />
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
