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
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-bg/90">
      <div className="bg-surface border border-border rounded-lg p-6 mx-4 max-w-sm w-full space-y-4">
        <h2 className="text-lg font-medium">End this session?</h2>
        <p className="text-muted text-sm">
          Choose what to do with your progress so far.
        </p>

        <div className="space-y-2 pt-2">
          <button
            onClick={onRecord}
            disabled={saving}
            className="w-full h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Record completed sets"}
          </button>
          <button
            onClick={onAbandon}
            disabled={saving}
            className="w-full h-12 border border-red-400 text-red-400 font-medium rounded text-sm hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            Abandon session
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="w-full h-10 text-muted text-sm hover:text-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
