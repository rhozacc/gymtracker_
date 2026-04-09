"use client";

interface BiometricConfirmModalProps {
  pin: string;
  busy: boolean;
  error: string;
  onPinChange: (pin: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BiometricConfirmModal({
  pin,
  busy,
  error,
  onPinChange,
  onConfirm,
  onCancel,
}: BiometricConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg/90">
      <div className="bg-surface border border-border rounded-lg p-6 max-w-xs w-full mx-4 text-center">
        <h2 className="text-sm font-medium mb-2">Disable biometric login?</h2>
        <p className="text-muted text-xs mb-4">Enter your PIN to confirm</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            onPinChange(
              (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4)
            );
          }}
          placeholder="PIN"
          className="w-full h-10 bg-bg border border-border text-text text-center text-lg rounded mb-2 focus:border-accent focus:outline-none"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <div className="flex gap-3 mt-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 border border-border text-muted rounded text-sm hover:text-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pin.length < 4 || busy}
            className="flex-1 h-10 bg-red-500 text-white font-medium rounded text-sm hover:bg-red-400 disabled:opacity-50 transition-colors"
          >
            {busy ? "..." : "Disable"}
          </button>
        </div>
      </div>
    </div>
  );
}
