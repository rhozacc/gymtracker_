"use client";

import { createPortal } from "react-dom";

interface EndSessionModalProps {
  onAbandon: () => void;
  onRecord: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export function EndSessionModal({
  onAbandon,
  onRecord,
  onCancel,
  saving,
}: EndSessionModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col justify-end bg-bg">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        <h2 className="text-2xl font-medium">End this session?</h2>
        <p className="text-muted text-sm mt-2 text-center">
          Choose what to do with your progress so far.
        </p>
      </div>

      <div className="px-4 pb-10 space-y-3 w-full max-w-lg mx-auto">
        <button
          onClick={onRecord}
          disabled={saving}
          className="w-full h-14 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Record completed sets"}
        </button>
        <button
          onClick={onAbandon}
          disabled={saving}
          className="w-full h-14 border border-red-400 text-red-400 font-medium rounded text-sm hover:bg-red-400/10 transition-colors disabled:opacity-50"
        >
          Abandon session
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="w-full h-12 text-muted text-sm hover:text-accent transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}
