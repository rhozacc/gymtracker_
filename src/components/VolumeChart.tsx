"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface WeekData {
  week: string;
  upper_a: number;
  lower: number;
  full: number;
  total: number;
}

function formatWeek(w: string) {
  const d = new Date(w + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function VolumeChartInner({ data }: { data: WeekData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis
          dataKey="week"
          tickFormatter={formatWeek}
          stroke="#666"
          fontSize={10}
        />
        <YAxis stroke="#666" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip
          contentStyle={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: "4px",
            fontSize: "12px",
          }}
          labelFormatter={formatWeek}
          formatter={(value: number) => [`${Math.round(value)} kg`]}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar
          dataKey="upper_a"
          stackId="vol"
          fill="#f0f0f0"
          name="Upper"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="lower"
          stackId="vol"
          fill="#888"
          name="Lower"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="full"
          stackId="vol"
          fill="#444"
          name="Full"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
