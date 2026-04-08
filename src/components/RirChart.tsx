"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

interface DataPoint {
  date: string;
  avgRir: number;
}

export function RirChartInner({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-8">No RIR data yet.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="rir-gradient" x1="0" y1="0" x2="0" y2="1">
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
          domain={[0, 5]}
          ticks={[0, 1, 2, 3, 4, 5]}
        />
        <ReferenceLine
          y={2}
          stroke="var(--color-chart-bar-1)"
          strokeDasharray="3 3"
          strokeOpacity={0.3}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatValue={(v) => v.toFixed(1)}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="avgRir"
          fill="url(#rir-gradient)"
          stroke="none"
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="avgRir"
          stroke="var(--color-chart-line)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--color-chart-line)", stroke: "var(--color-bg)", strokeWidth: 2 }}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
          name="Avg RIR"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
