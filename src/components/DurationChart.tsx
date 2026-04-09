"use client";

import {
  LineChart,
  Line,
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
      <LineChart data={data}>
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
          cursor={false}
          content={
            <ChartTooltip
              formatValue={(v) => `${v} min`}
            />
          }
        />
        <Line
          dataKey="minutes"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={{ fill: "var(--color-accent)", r: 3 }}
          activeDot={{ fill: "var(--color-accent)", r: 5 }}
          type="monotone"
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-out"
          name="Duration"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
