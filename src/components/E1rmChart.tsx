"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type WeightUnit } from "@/lib/units";
import { ChartTooltip } from "./ChartTooltip";

interface DataPoint {
  date: string;
  e1rm: number;
}

export function E1rmChartInner({
  data,
  unit = "kg",
}: {
  data: DataPoint[];
  unit?: WeightUnit;
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-8">
        No data yet for this exercise.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="e1rm-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-line)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-chart-line)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          unit={` ${unit}`}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatValue={(v) => `${v.toFixed(1)} ${unit}`}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="e1rm"
          fill="url(#e1rm-gradient)"
          stroke="none"
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="e1rm"
          stroke="var(--color-chart-line)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-chart-line)", stroke: "var(--color-bg)", strokeWidth: 2 }}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
          name="Est. 1RM"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
