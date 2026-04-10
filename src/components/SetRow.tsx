"use client";

export interface SetInput {
  reps: string;
  weight: string;
  rir: string;
  done: boolean;
  isWarmup?: boolean;
}

interface SetRowProps {
  index: number;
  data: SetInput;
  onChange: (data: SetInput) => void;
  onRemove?: () => void;
  onDone: () => void;
  increments: number[];
  unitLabel: string;
  showIncrements?: boolean;
}

export function SetRow({
  index,
  data,
  onChange,
  onRemove,
  onDone,
  increments,
  unitLabel,
  showIncrements = true,
}: SetRowProps) {
  function adjustWeight(delta: number) {
    const current = parseFloat(data.weight) || 0;
    const newVal = Math.max(0, current + delta);
    const rounded = Math.round(newVal * 100) / 100;
    onChange({ ...data, weight: rounded.toString() });
  }

  function handleCheckDone() {
    if (!data.weight && !data.reps) return;
    navigator.vibrate?.(100);
    onChange({ ...data, done: true });
    onDone();
  }

  return (
    <div
      className={`rounded transition-colors ${data.isWarmup ? "opacity-60" : ""} ${
        data.done ? "border-l-2 border-green-500 bg-green-950/10 pl-1" : ""
      }`}
    >
      {/* Row 1: check | weight | reps | rir | remove */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCheckDone}
          className={`shrink-0 w-8 h-8 rounded-full border text-xs flex items-center justify-center transition-colors ${
            data.done
              ? "bg-green-600 border-green-600 text-white"
              : "border-border text-muted hover:border-accent hover:text-accent"
          }`}
        >
          {data.done ? "✓" : data.isWarmup ? "W" : index}
        </button>
        <input
          type="text"
          inputMode="decimal"
          placeholder={unitLabel}
          value={data.weight}
          onChange={(e) => onChange({ ...data, weight: e.target.value })}
          className="w-full h-10 bg-surface border border-border text-text text-center text-sm rounded px-1 focus:border-accent focus:outline-none"
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="reps"
          value={data.reps}
          onChange={(e) => onChange({ ...data, reps: e.target.value })}
          className="w-full h-10 bg-surface border border-border text-text text-center text-sm rounded px-1 focus:border-accent focus:outline-none"
        />
        {data.isWarmup ? (
          <span className="w-full h-10 shrink-0" />
        ) : (
          <select
            value={data.rir}
            onChange={(e) => onChange({ ...data, rir: e.target.value })}
            className="w-full h-10 bg-surface border border-border text-text text-center text-sm rounded px-0.5 focus:border-accent focus:outline-none appearance-none"
          >
            <option value="">RIR</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        )}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted hover:text-red-500 text-lg shrink-0 w-6"
          >
            ×
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
      </div>

      {showIncrements && (
        <div className="flex gap-1 mt-1.5 overflow-x-auto pb-1 pl-9">
          {increments.map((inc) => (
            <button
              key={`minus-${inc}`}
              type="button"
              onClick={() => adjustWeight(-inc)}
              className="h-7 min-w-[36px] px-1 bg-surface border border-border rounded text-[10px] text-muted active:bg-border transition-colors shrink-0"
            >
              −{inc}
            </button>
          ))}
          <span className="w-px bg-border shrink-0" />
          {increments.map((inc) => (
            <button
              key={`plus-${inc}`}
              type="button"
              onClick={() => adjustWeight(inc)}
              className="h-7 min-w-[36px] px-1 bg-surface border border-border rounded text-[10px] text-accent active:bg-border transition-colors shrink-0"
            >
              +{inc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
