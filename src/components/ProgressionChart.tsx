"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  avgWeight: number;
}

export function ProgressionChartInner({ data }: { data: DataPoint[] }) {
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
          stroke="#666"
          fontSize={10}
          tickFormatter={(d) =>
            new Date(d).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
        />
        <YAxis stroke="#666" fontSize={10} unit=" kg" />
        <Tooltip
          contentStyle={{
            background: "#111",
            border: "1px solid #222",
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
          formatter={(value: number) => [`${value.toFixed(1)} kg`, "Avg Weight"]}
        />
        <Line
          type="monotone"
          dataKey="avgWeight"
          stroke="#f0f0f0"
          strokeWidth={2}
          dot={{ fill: "#f0f0f0", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
