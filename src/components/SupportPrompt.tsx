"use client";

import { createPortal } from "react-dom";

interface SupportPromptProps {
  message: string;
  stripeUrl: string;
  onClose: () => void;
}

export function SupportPrompt({ message, stripeUrl, onClose }: SupportPromptProps) {
  if (!stripeUrl) return null;

  function handleSupport() {
    window.open(stripeUrl, "_blank", "noopener,noreferrer");
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[400] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-xl px-4 pb-10 pt-6 w-full max-w-lg mx-auto space-y-4">
        <div>
          <p className="text-lg font-medium">{message}</p>
          <p className="text-muted text-sm mt-1">
            Built by one person. If it&apos;s helping your training, this means a lot.
          </p>
        </div>
        <button
          onClick={handleSupport}
          className="w-full h-14 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
        >
          Support the app
        </button>
        <button
          onClick={onClose}
          className="w-full h-10 text-muted text-sm hover:text-text transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>,
    document.body
  );
}
