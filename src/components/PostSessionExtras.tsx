"use client";

import { useState } from "react";

interface Extra {
  id: string;
  label: string;
  description: string;
  estimatedMin: number;
  icon: string;
}

const EXTRAS: Extra[] = [
  { id: "abs", label: "Abs", description: "Core circuit", estimatedMin: 8, icon: "◎" },
  { id: "cardio", label: "Cardio", description: "Treadmill, bike, or stairs", estimatedMin: 15, icon: "♥" },
  { id: "stretching", label: "Stretching", description: "Cooldown & mobility", estimatedMin: 10, icon: "↔" },
];

interface PostSessionExtrasProps {
  sessionId: string;
  onDone: () => void;
}

export function PostSessionExtras({ sessionId, onDone }: PostSessionExtrasProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [durations, setDurations] = useState<Record<string, string>>(
    Object.fromEntries(EXTRAS.map((e) => [e.id, e.estimatedMin.toString()]))
  );
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const hasSelection = Object.values(selected).some(Boolean);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  async function save() {
    if (!hasSelection) {
      onDone();
      return;
    }

    const extras = EXTRAS.filter((e) => selected[e.id]).map((e) => ({
      id: e.id,
      label: e.label,
      minutes: parseInt(durations[e.id]) || e.estimatedMin,
    }));

    setSaving(true);
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extras }),
    });
    onDone();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium">Extras</h1>
        <p className="text-muted text-xs mt-1">Add anything else you did today</p>
      </div>

      <div className="space-y-3">
        {EXTRAS.map((extra) => {
          const isSelected = !!selected[extra.id];
          return (
            <button
              key={extra.id}
              onClick={() => toggle(extra.id)}
              className={`w-full text-left border rounded-lg p-4 transition-colors ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface hover:border-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{extra.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{extra.label}</div>
                    <div className="text-muted text-xs">{extra.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted text-xs">~{extra.estimatedMin} min</span>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-accent bg-accent" : "border-border"
                    }`}
                  >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-bg">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Duration input when selected */}
              {isSelected && (
                <div className="mt-3 ml-11 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={durations[extra.id]}
                    onChange={(e) =>
                      setDurations((prev) => ({ ...prev, [extra.id]: e.target.value }))
                    }
                    className="w-16 h-8 bg-bg border border-border text-text text-sm rounded px-2 text-center focus:border-accent focus:outline-none"
                  />
                  <span className="text-muted text-xs">min</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onDone}
          className="flex-1 h-12 border border-border text-muted rounded text-sm hover:text-accent hover:border-muted transition-colors"
        >
          Skip
        </button>
        <button
          onClick={save}
          disabled={saving || !hasSelection}
          className="flex-1 h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : `Add ${selectedCount} extra${selectedCount !== 1 ? "s" : ""}`}
        </button>
      </div>

      {hasSelection && (
        <p className="text-muted text-[10px] text-center">
          Total: ~{EXTRAS.filter((e) => selected[e.id]).reduce((sum, e) => sum + (parseInt(durations[e.id]) || e.estimatedMin), 0)} min
        </p>
      )}
    </div>
  );
}
