import type { MomentumResult } from "@/lib/momentum";

// Threshold positions on the 0–1 axis (mirrors the quadrant boundaries
// used by `classify` in lib/momentum.ts).
const THRESHOLDS = [0.4, 0.7] as const;
const ZONE_LABELS = ["Atrophy", "Maintenance", "Hypertrophy"] as const;

// Centers of each zone — used to position labels.
// Atrophy 0–40 → 20%, Maintenance 40–70 → 55%, Hypertrophy 70–100 → 85%
const ZONE_CENTERS = [0.2, 0.55, 0.85];

function StateBar({
  label,
  value,
  readout,
}: {
  label: string;
  value: number;
  readout: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted">
          {label}
        </span>
        <span className="text-[10px] text-muted">{readout}</span>
      </div>
      <div
        className="relative h-1 rounded-full"
        style={{ backgroundColor: "var(--color-border)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "var(--color-accent)" }}
        />
      </div>
      <div className="relative h-1.5 mt-1">
        {THRESHOLDS.map((t) => (
          <svg
            key={t}
            className="absolute top-0"
            style={{ left: `${t * 100}%`, transform: "translateX(-50%)" }}
            width="6"
            height="5"
            viewBox="0 0 6 5"
            aria-hidden="true"
          >
            <polygon points="3,0 6,5 0,5" fill="var(--color-muted)" />
          </svg>
        ))}
      </div>
    </div>
  );
}

interface Props {
  result: MomentumResult | null;
}

export function MomentumScore({ result }: Props) {
  if (result === null) {
    return (
      <div className="border border-border rounded-lg p-4 animate-pulse space-y-4">
        <div className="space-y-2">
          <div className="h-3 w-full bg-surface rounded" />
          <div className="h-1 w-full bg-surface rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-surface rounded" />
          <div className="h-1 w-full bg-surface rounded" />
        </div>
        <div className="h-3 w-44 bg-surface rounded" />
      </div>
    );
  }

  const { limiter, volume, progression, volumeReadout, progressionReadout } = result;

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="space-y-4">
        <StateBar label="Volume" value={volume} readout={volumeReadout} />
        <StateBar label="Lifts" value={progression} readout={progressionReadout} />
      </div>

      <div className="relative h-3 mt-3">
        {ZONE_LABELS.map((zone, i) => (
          <span
            key={zone}
            className="absolute top-0 text-[9px] uppercase tracking-wider text-muted"
            style={{ left: `${ZONE_CENTERS[i] * 100}%`, transform: "translateX(-50%)" }}
          >
            {zone}
          </span>
        ))}
      </div>

      <div className="border-t border-border mt-4 pt-3 space-y-1">
        <p className="text-xs text-text">{limiter}</p>
        <p className="text-[10px] text-muted">
          Last 4 weeks: training volume vs targets, lift progress, recovery.
        </p>
      </div>
    </div>
  );
}
