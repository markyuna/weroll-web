"use client";

import { useEffect } from "react";

export function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg font-bold text-white z-50 shadow-lg animate-fade-up ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {message}
    </div>
  );
}
