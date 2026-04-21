"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Weekly set targets per muscle group (RP Strength / meta-analysis consensus)
const MEV_TARGETS: Record<string, number> = {
  Chest: 10,
  Back: 12,
  Shoulders: 10,
  Legs: 14,
  Arms: 8,
};
const MAV_TARGETS: Record<string, number> = {
  Chest: 12,
  Back: 14,
  Shoulders: 12,
  Legs: 18,
  Arms: 10,
};

interface MuscleRadarProps {
  data: { muscle: string; sets: number }[];
}

// Custom axis label: muscle name + actual set count
function CustomTick({
  payload,
  x,
  y,
  data,
}: {
  payload?: { value: string };
  x?: number;
  y?: number;
  data: { muscle: string; sets: number }[];
}) {
  if (!payload || x === undefined || y === undefined) return null;
  const muscle = payload.value;
  const sets = data.find((d) => d.muscle === muscle)?.sets ?? 0;
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
      <tspan
        x={x}
        dy="-7"
        fill="var(--color-muted)"
        fontSize={10}
        fontFamily="inherit"
      >
        {muscle}
      </tspan>
      <tspan
        x={x}
        dy="15"
        fill={sets > 0 ? "var(--color-accent)" : "var(--color-muted)"}
        fontSize={12}
        fontWeight="600"
        fontFamily="inherit"
      >
        {sets > 0 ? sets : "—"}
      </tspan>
    </text>
  );
}

// Custom tooltip
function RadarTooltip({ active, payload }: { active?: boolean; payload?: { payload: { muscle: string; actual: number; mav: number; mev: number }; name: string }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const mev = MEV_TARGETS[d.muscle] ?? 10;
  const mav = MAV_TARGETS[d.muscle] ?? 12;
  return (
    <div className="bg-surface border border-border rounded px-3 py-2 text-xs space-y-0.5">
      <p className="font-medium text-text">{d.muscle}</p>
      <p className="text-muted">MEV: {mev} sets &middot; MAV: {mav} sets</p>
    </div>
  );
}

export function MuscleRadarInner({ data }: MuscleRadarProps) {
  if (data.length === 0 || data.every((d) => d.sets === 0)) {
    return (
      <p className="text-muted text-sm text-center py-8 border border-border rounded">
        No data this week yet.
      </p>
    );
  }

  // Largest MAV group (Legs = 18) anchors at 90% of the axis.
  // If any actual value overshoots, rescale so the max actual sits at 90%.
  const maxMAV = Math.max(...Object.values(MAV_TARGETS));
  const maxActual = Math.max(...data.map((d) => d.sets));
  const axisMax = Math.max(maxMAV, maxActual) / 0.9;

  const normalized = data.map((d) => {
    const mev = MEV_TARGETS[d.muscle] ?? 10;
    const mav = MAV_TARGETS[d.muscle] ?? 12;
    return {
      muscle: d.muscle,
      actual: d.sets / axisMax,
      mav: mav / axisMax,
      mev: mev / axisMax,
    };
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={normalized}>
          <PolarGrid stroke="var(--color-border)" strokeDasharray="2 4" />
          <PolarAngleAxis
            dataKey="muscle"
            tick={(props) => <CustomTick {...props} data={data} />}
            tickLine={false}
          />
          <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
          <Tooltip content={<RadarTooltip />} />
          {/* MEV ring — minimum to prevent atrophy */}
          <Radar
            name="mev"
            dataKey="mev"
            stroke="var(--color-accent)"
            fill="none"
            strokeDasharray="3 4"
            strokeWidth={0.75}
            strokeOpacity={0.28}
            dot={false}
          />
          {/* MAV ring — minimum for hypertrophy */}
          <Radar
            name="mav"
            dataKey="mav"
            stroke="var(--color-accent)"
            fill="none"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            dot={false}
          />
          {/* Actual weekly sets */}
          <Radar
            name="Sets"
            dataKey="actual"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.18}
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-accent)", strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted text-center -mt-2 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t border-dashed" style={{ borderColor: "var(--color-accent)", opacity: 0.35 }} />
          Atrophy floor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t border-dashed border-accent opacity-50" />
          Growth target
        </span>
      </p>
    </div>
  );
}
