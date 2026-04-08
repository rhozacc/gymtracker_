"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type WeightUnit } from "@/lib/units";

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
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          stroke="var(--color-chart-axis)"
          fontSize={10}
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
          unit={` ${unit}`}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-chart-tooltip-bg)",
            border: "1px solid var(--color-chart-tooltip-border)",
            borderRadius: "4px",
            fontSize: "12px",
          }}
          labelFormatter={(d) =>
            new Date(d).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          }
          formatter={(value: number) => [
            `${value.toFixed(1)} ${unit}`,
            "Est. 1RM",
          ]}
        />
        <Line
          type="monotone"
          dataKey="e1rm"
          stroke="var(--color-chart-line)"
          strokeWidth={2}
          dot={{ fill: "var(--color-chart-line)", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
