"use client";

interface PayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string;
  formatLabel?: (label: string) => string;
  formatValue?: (value: number, name: string) => string;
}

const defaultFormatLabel = (label: string) =>
  new Date(label).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export function ChartTooltip({
  active,
  payload,
  label,
  formatLabel = defaultFormatLabel,
  formatValue,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-surface/95 chart-tooltip px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-wide text-muted mb-1">
        {formatLabel(label ?? "")}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium" style={{ color: entry.color }}>
            {formatValue
              ? formatValue(entry.value, entry.name)
              : entry.value}
          </span>
          <span className="text-[10px] text-muted">{entry.name}</span>
        </div>
      ))}
    </div>
  );
}
