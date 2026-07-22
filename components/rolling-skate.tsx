"use client";

import Lottie from "lottie-react";
import skateLottie from "@/public/u9ctATSOoA.json";

export function RollingSkate() {
  return (
    <>
      <div className="animate-roll-skate-container absolute top-0 left-1/2 -translate-x-1/2 -translate-y-24 pointer-events-none w-24 h-20">
        <Lottie
          animationData={skateLottie}
          loop={true}
          autoplay={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <style>{`
        @keyframes roll-skate-container {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }

        .animate-roll-skate-container {
          animation: roll-skate-container 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
