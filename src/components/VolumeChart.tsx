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
import { getDayShortLabel } from "@/lib/program";

interface WeekData {
  week: string;
  total: number;
  [dayType: string]: number | string;
}

const BAR_COLORS = ["#f0f0f0", "#c0c0c0", "#888888", "#666666", "#444444"];

function formatWeek(w: string) {
  const d = new Date(w + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function VolumeChartInner({ data }: { data: WeekData[] }) {
  // Discover all dayType keys from the data
  const dayTypes = Array.from(
    new Set(
      data.flatMap((d) =>
        Object.keys(d).filter((k) => k !== "week" && k !== "total")
      )
    )
  );

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
        {dayTypes.map((dt, i) => (
          <Bar
            key={dt}
            dataKey={dt}
            stackId="vol"
            fill={BAR_COLORS[i % BAR_COLORS.length]}
            name={getDayShortLabel(dt)}
            radius={i === dayTypes.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
