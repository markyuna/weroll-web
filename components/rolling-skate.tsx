"use client";

export function RollingSkate() {
  return (
    <>
      <svg
        className="animate-roll-skate w-10 h-10 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rueda izquierda */}
        <circle cx="6" cy="20" r="3" fill="currentColor" className="text-amber-400" />

        {/* Rueda derecha */}
        <circle cx="18" cy="20" r="3" fill="currentColor" className="text-amber-400" />

        {/* Eje izquierdo */}
        <line x1="6" y1="17" x2="6" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-amber-300" />

        {/* Eje derecho */}
        <line x1="18" y1="17" x2="18" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-amber-300" />

        {/* Carcasa/boot del patín */}
        <path
          d="M 4 14 Q 4 10 6 8 L 18 8 Q 20 10 20 14 L 20 16 Q 20 17 19 17 L 5 17 Q 4 17 4 16 Z"
          fill="currentColor"
          className="text-amber-400"
        />

        {/* Detalle interior (contraste) */}
        <path
          d="M 6 10 L 18 10"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-amber-900"
          strokeLinecap="round"
        />

        {/* Punta del patín */}
        <path
          d="M 10 8 L 8 6 Q 8 5 9 5 L 10 5 Z"
          fill="currentColor"
          className="text-amber-500"
        />
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
