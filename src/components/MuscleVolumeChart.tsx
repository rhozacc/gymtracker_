"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MUSCLE_GROUPS } from "@/lib/muscleGroups";

interface WeekData {
  week: string;
  [muscleGroup: string]: number | string;
}

const BAR_VARS = [
  "var(--color-chart-bar-1)",
  "var(--color-chart-bar-2)",
  "var(--color-chart-bar-3)",
  "var(--color-chart-bar-4)",
  "var(--color-chart-bar-5)",
];

function formatWeek(w: string) {
  const d = new Date(w + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MuscleVolumeChartInner({ data }: { data: WeekData[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-8">No data yet.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis
          dataKey="week"
          tickFormatter={formatWeek}
          stroke="var(--color-chart-axis)"
          fontSize={10}
        />
        <YAxis
          stroke="var(--color-chart-axis)"
          fontSize={10}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-chart-tooltip-bg)",
            border: "1px solid var(--color-chart-tooltip-border)",
            borderRadius: "4px",
            fontSize: "12px",
          }}
          labelFormatter={formatWeek}
          formatter={(value: number, name: string) => [
            `${value} sets`,
            name,
          ]}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        {MUSCLE_GROUPS.map((mg, i) => (
          <Bar
            key={mg}
            dataKey={mg}
            stackId="vol"
            fill={BAR_VARS[i % BAR_VARS.length]}
            name={mg}
            radius={
              i === MUSCLE_GROUPS.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
