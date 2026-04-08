"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

interface DataPoint {
  date: string;
  minutes: number;
}

export function DurationChartInner({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-8">
        No duration data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis
          dataKey="date"
          stroke="var(--color-chart-axis)"
          fontSize={10}
          axisLine={false}
          tickLine={false}
          tickFormatter={(d) =>
            new Date(d).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
        />
        <YAxis
          stroke="var(--color-chart-axis)"
          fontSize={10}
          axisLine={false}
          tickLine={false}
          unit=" min"
        />
        <Tooltip
          cursor={{ fill: "var(--color-accent)", fillOpacity: 0.04 }}
          content={
            <ChartTooltip
              formatValue={(v) => `${v} min`}
            />
          }
        />
        <Bar
          dataKey="minutes"
          fill="var(--color-chart-bar-1)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-out"
          name="Duration"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
