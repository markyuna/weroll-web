"use client";

export function RollingSkate() {
  return (
    <>
      <svg
        className="animate-roll-skate w-12 h-10 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 pointer-events-none"
        viewBox="0 0 28 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rueda izquierda con brillo */}
        <circle cx="5" cy="20" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400" />
        <circle cx="5" cy="20" r="2" fill="currentColor" className="text-amber-300" />

        {/* Rueda derecha */}
        <circle cx="23" cy="20" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400" />
        <circle cx="23" cy="20" r="2" fill="currentColor" className="text-amber-300" />

        {/* Carcasa futurista */}
        <path
          d="M 3 14 L 5 8 L 23 8 L 25 14 Q 25 16 23 17 L 5 17 Q 3 16 3 14 Z"
          fill="currentColor"
          className="text-amber-400"
        />

        {/* Detalles aerodinámicos */}
        <path
          d="M 6 10 L 22 10"
          stroke="currentColor"
          strokeWidth="1"
          className="text-amber-950"
        />
        <path
          d="M 7 12 L 21 12"
          stroke="currentColor"
          strokeWidth="1"
          className="text-amber-900"
        />

        {/* Punta dinámica */}
        <path
          d="M 3 14 L 2 12 Q 2 10 3 9 L 4 8 Z"
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
