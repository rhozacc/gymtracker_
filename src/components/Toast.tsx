"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  visible: boolean;
  onDone: () => void;
}

export function Toast({ message, visible, onDone }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 2000);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-accent text-bg text-sm font-medium px-5 py-3 rounded shadow-lg animate-[fadeIn_100ms_ease-out]">
      {message}
    </div>
  );
}
