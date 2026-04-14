"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// MEV = minimum to prevent atrophy; MAV = minimum to drive hypertrophy
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

export function MuscleRadarInner({ data }: MuscleRadarProps) {
  if (data.length === 0 || data.every((d) => d.sets === 0)) {
    return (
      <p className="text-muted text-sm text-center py-8 border border-border rounded">
        No data this week yet.
      </p>
    );
  }

  // Normalise everything against MAV so MAV ring sits at ratio=1.0
  const mavRatios = data.map((d) => d.sets / (MAV_TARGETS[d.muscle] ?? 12));
  const globalMax = Math.max(...mavRatios, 1.25);

  const normalized = data.map((d, i) => {
    const mev = MEV_TARGETS[d.muscle] ?? 10;
    const mav = MAV_TARGETS[d.muscle] ?? 12;
    return {
      muscle: d.muscle,
      actual: mavRatios[i] / globalMax,
      mav: 1 / globalMax,
      mev: (mev / mav) / globalMax,
    };
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={normalized}>
          <PolarGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="muscle"
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
          />
          <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
          <Radar
            name="mev"
            dataKey="mev"
            stroke="var(--color-muted)"
            fill="none"
            strokeDasharray="3 3"
            strokeWidth={1}
            strokeOpacity={0.5}
          />
          <Radar
            name="mav"
            dataKey="mav"
            stroke="var(--color-muted)"
            fill="none"
            strokeDasharray="4 3"
            strokeWidth={1.5}
          />
          <Radar
            name="Sets"
            dataKey="actual"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted text-center -mt-2 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t border-dashed border-muted opacity-50" />
          atrophy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 border-t border-dashed border-muted" />
          hypertrophy
        </span>
      </p>
    </div>
  );
}
