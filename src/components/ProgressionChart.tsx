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
  avgWeight: number;
}

export function ProgressionChartInner({ data, unit = "kg" }: { data: DataPoint[]; unit?: WeightUnit }) {
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
          <linearGradient id="progression-gradient" x1="0" y1="0" x2="0" y2="1">
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
          dataKey="avgWeight"
          fill="url(#progression-gradient)"
          stroke="none"
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="avgWeight"
          stroke="var(--color-chart-line)"
          strokeWidth={2}
          dot={false}
          activeDot={false}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
          name="Avg Weight"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
