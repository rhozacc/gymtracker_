"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

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
          domain={[0, 5]}
          ticks={[0, 1, 2, 3, 4, 5]}
        />
        <ReferenceLine
          y={2}
          stroke="var(--color-chart-bar-1)"
          strokeDasharray="3 3"
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
          formatter={(value: number) => [value.toFixed(1), "Avg RIR"]}
        />
        <Line
          type="monotone"
          dataKey="avgRir"
          stroke="var(--color-chart-line)"
          strokeWidth={2}
          dot={{ fill: "var(--color-chart-line)", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
