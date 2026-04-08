"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
          unit=" min"
        />
        <Tooltip
          cursor={false}
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
          formatter={(value: number) => [`${value} min`, "Duration"]}
        />
        <Bar
          dataKey="minutes"
          fill="var(--color-chart-bar-1)"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
