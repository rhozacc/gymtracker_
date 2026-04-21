import type { MomentumResult } from "@/lib/momentum";

interface Props {
  result: MomentumResult | null;
}

export function MomentumScore({ result }: Props) {
  if (result === null) {
    return (
      <div className="border border-border rounded-lg p-4 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="h-10 w-20 bg-surface rounded" />
          <div className="h-8 w-24 bg-surface rounded" />
        </div>
        <div className="border-t border-border my-3" />
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-surface rounded" />
          <div className="flex-1 h-12 bg-surface rounded" />
          <div className="flex-1 h-12 bg-surface rounded" />
        </div>
      </div>
    );
  }

  const subs = [
    { label: "Freq", value: result.frequency },
    { label: "Progression", value: result.progression },
    { label: "Recovery", value: result.recovery },
  ];

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tabular-nums text-accent leading-none">
            {result.score}
          </span>
          <span className="text-sm text-muted">/100</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
            Momentum
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            {result.sessionCount} session{result.sessionCount !== 1 ? "s" : ""} · 28 days
          </p>
        </div>
      </div>

      <div className="border-t border-border my-3" />

      <div className="flex gap-2">
        {subs.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center border border-border rounded px-3 py-2 flex-1"
          >
            <span className="text-lg font-bold tabular-nums">
              {Math.round(value * 100)}
            </span>
            <span className="text-[9px] font-medium uppercase tracking-widest text-muted mt-0.5">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
