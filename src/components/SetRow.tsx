"use client";

export interface SetInput {
  reps: string;
  weight: string;
  rir: string;
}

interface SetRowProps {
  index: number;
  data: SetInput;
  onChange: (data: SetInput) => void;
  onRemove?: () => void;
}

export function SetRow({ index, data, onChange, onRemove }: SetRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted text-xs w-6 text-right shrink-0">
        {index + 1}
      </span>
      <input
        type="text"
        inputMode="decimal"
        placeholder="kg"
        value={data.weight}
        onChange={(e) => onChange({ ...data, weight: e.target.value })}
        className="w-full h-11 bg-surface border border-border text-accent text-center text-sm rounded px-2 focus:border-accent focus:outline-none"
      />
      <input
        type="text"
        inputMode="numeric"
        placeholder="reps"
        value={data.reps}
        onChange={(e) => onChange({ ...data, reps: e.target.value })}
        className="w-full h-11 bg-surface border border-border text-accent text-center text-sm rounded px-2 focus:border-accent focus:outline-none"
      />
      <select
        value={data.rir}
        onChange={(e) => onChange({ ...data, rir: e.target.value })}
        className="w-full h-11 bg-surface border border-border text-accent text-center text-sm rounded px-1 focus:border-accent focus:outline-none appearance-none"
      >
        <option value="">RIR</option>
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted hover:text-red-500 text-lg shrink-0 w-6"
        >
          ×
        </button>
      )}
    </div>
  );
}
