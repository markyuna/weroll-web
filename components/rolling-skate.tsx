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
        {/* Rueda izquierda */}
        <g>
          <circle cx="4" cy="20" r="4" fill="currentColor" className="text-amber-400" />
          <circle cx="4" cy="20" r="2.5" fill="currentColor" className="text-black" />
        </g>

        {/* Rueda derecha */}
        <g>
          <circle cx="24" cy="20" r="4" fill="currentColor" className="text-amber-400" />
          <circle cx="24" cy="20" r="2.5" fill="currentColor" className="text-black" />
        </g>

        {/* Boot agresivo */}
        <path
          d="M 6 11 L 8 7 Q 9 5 11 5 L 17 5 Q 19 5 20 7 L 22 11 Q 22.5 13 22 15 L 6 15 Q 5.5 13 6 11 Z"
          fill="currentColor"
          className="text-amber-400"
        />

        {/* Líneas de velocidad */}
        <path d="M 8 9 L 7 9" stroke="currentColor" strokeWidth="1.5" className="text-amber-900" strokeLinecap="round" />
        <path d="M 20 9 L 21 9" stroke="currentColor" strokeWidth="1.5" className="text-amber-900" strokeLinecap="round" />

        {/* Accent diagonal */}
        <path
          d="M 10 6 L 18 14"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-amber-600"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>

      <style>{`
        @keyframes roll-skate {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        .animate-roll-skate {
          animation: roll-skate 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
