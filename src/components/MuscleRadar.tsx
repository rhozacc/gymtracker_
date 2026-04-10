"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// Weekly set targets per muscle group (MEV-ish baseline)
const MUSCLE_TARGETS: Record<string, number> = {
  Chest: 10,
  Back: 12,
  Shoulders: 10,
  Legs: 14,
  Arms: 8,
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

  const ratios = data.map((d) => d.sets / (MUSCLE_TARGETS[d.muscle] ?? 10));
  // 1.25 = the 20% buffer: ratio 1.0–1.25 fits within the outer 20% without
  // moving the ring. Beyond 1.25× the ring starts compressing inward.
  const globalMax = Math.max(...ratios, 1.25);

  const normalized = data.map((d, i) => ({
    muscle: d.muscle,
    actual: ratios[i] / globalMax,
    target: 1 / globalMax, // 0.8 at baseline, shrinks when globalMax > 1.25
  }));

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
            name="Target"
            dataKey="target"
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
      <p className="text-[10px] text-muted text-center -mt-2">
        <span className="inline-block w-4 border-t border-dashed border-muted align-middle mr-1" />
        weekly target
      </p>
    </div>
  );
}
