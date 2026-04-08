"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
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
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Line
          type="monotone"
          dataKey="energy"
          stroke="var(--color-chart-line)"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Energy"
        />
        <Line
          type="monotone"
          dataKey="pump"
          stroke="var(--color-chart-line-2)"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Pump"
        />
        <Line
          type="monotone"
          dataKey="mood"
          stroke="var(--color-chart-line-3)"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Mood"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
