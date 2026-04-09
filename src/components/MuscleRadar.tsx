"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

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

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid
          stroke="var(--color-border)"
          strokeDasharray="3 3"
        />
        <PolarAngleAxis
          dataKey="muscle"
          tick={{ fill: "var(--color-muted)", fontSize: 10 }}
        />
        <Radar
          name="Sets"
          dataKey="sets"
          stroke="var(--color-accent)"
          fill="var(--color-accent)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
