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
import { ChartTooltip } from "./ChartTooltip";

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
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="var(--color-chart-axis)"
          fontSize={10}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={false}
          content={
            <ChartTooltip
              formatLabel={formatWeek}
              formatValue={(v, name) => `${v} sets`}
            />
          }
        />
        <Legend
          wrapperStyle={{ fontSize: "10px", color: "var(--color-muted)", letterSpacing: "0.05em" }}
          iconType="circle"
        />
        {MUSCLE_GROUPS.map((mg, i) => (
          <Bar
            key={mg}
            dataKey={mg}
            stackId="vol"
            fill={BAR_VARS[i % BAR_VARS.length]}
            name={mg}
            radius={
              i === MUSCLE_GROUPS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
            }
            isAnimationActive={true}
            animationDuration={800}
            animationBegin={i * 100}
            animationEasing="ease-out"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
