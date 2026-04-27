import type { MomentumResult } from "@/lib/momentum";

const SEGMENTS = 10;

function Meter({
  label,
  value,
  readout,
}: {
  label: string;
  value: number;
  readout: string;
}) {
  const filled = Math.max(0, Math.min(SEGMENTS, Math.round(value * SEGMENTS)));
  return (
    <div className="flex items-center gap-3 text-[10px]">
      <span className="text-muted uppercase tracking-widest w-12 shrink-0">
        {label}
      </span>
      <div className="flex gap-0.5 flex-1 min-w-0">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isOn = i < filled;
          const opacity = isOn ? 1 - (i / (SEGMENTS - 1)) * 0.4 : undefined;
          return (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-sm"
              style={
                isOn
                  ? { backgroundColor: "var(--color-accent)", opacity }
                  : { backgroundColor: "var(--color-border)" }
              }
            />
          );
        })}
      </div>
      <span className="text-muted text-right shrink-0 tabular-nums" style={{ minWidth: "5.25rem" }}>
        {readout}
      </span>
    </div>
  );
}

interface Props {
  result: MomentumResult | null;
}

export function MomentumScore({ result }: Props) {
  if (result === null) {
    return (
      <div className="border border-border rounded-lg p-4 animate-pulse">
        <div className="h-7 w-40 bg-surface rounded mb-2" />
        <div className="h-3 w-56 bg-surface rounded mb-4" />
        <div className="h-1.5 w-full bg-surface rounded mb-2" />
        <div className="h-1.5 w-full bg-surface rounded mb-3" />
        <div className="h-3 w-44 bg-surface rounded" />
      </div>
    );
  }

  const { tier, limiter, volume, progression, volumeReadout, progressionReadout } = result;

  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-2xl font-bold uppercase tracking-tight leading-none">
        {tier.label}
      </p>
      <p className="text-xs text-muted mt-1.5 mb-4">
        <span className="text-text">{tier.subtitle}</span>
        <span className="mx-1.5">—</span>
        <span>{limiter}</span>
      </p>

      <div className="space-y-1.5">
        <Meter label="Volume" value={volume} readout={volumeReadout} />
        <Meter label="Lifts" value={progression} readout={progressionReadout} />
      </div>

      <p className="text-[10px] text-muted mt-3">
        Last 4 weeks: training volume vs targets, lift progress, recovery.
      </p>
    </div>
  );
}
