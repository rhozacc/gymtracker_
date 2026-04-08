"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

interface DataPoint {
  date: string;
  energy: number;
  pump: number;
  mood: number;
}

export function DebriefChartInner({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-8">
        No debrief data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="debrief-energy-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-line)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--color-chart-line)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="debrief-pump-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-line-2)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--color-chart-line-2)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="debrief-mood-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-line-3)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--color-chart-line-3)" stopOpacity={0} />
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
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "10px", color: "var(--color-muted)", letterSpacing: "0.05em" }}
          iconType="circle"
        />
        <Area
          type="monotone"
          dataKey="energy"
          fill="url(#debrief-energy-gradient)"
          stroke="none"
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="pump"
          fill="url(#debrief-pump-gradient)"
          stroke="none"
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="mood"
          fill="url(#debrief-mood-gradient)"
          stroke="none"
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="energy"
          stroke="var(--color-chart-line)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-chart-line)", stroke: "var(--color-bg)", strokeWidth: 2 }}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
          name="Energy"
        />
        <Line
          type="monotone"
          dataKey="pump"
          stroke="var(--color-chart-line-2)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-chart-line-2)", stroke: "var(--color-bg)", strokeWidth: 2 }}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
          name="Pump"
        />
        <Line
          type="monotone"
          dataKey="mood"
          stroke="var(--color-chart-line-3)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-chart-line-3)", stroke: "var(--color-bg)", strokeWidth: 2 }}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
          name="Mood"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
