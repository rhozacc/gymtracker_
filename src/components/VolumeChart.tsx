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
import { type WeightUnit, kgToDisplay } from "@/lib/units";

interface WeekData {
  week: string;
  total: number;
  [dayType: string]: number | string;
}

const BAR_VARS = [
  "var(--color-chart-bar-1)",
  "var(--color-chart-bar-2)",
  "var(--color-chart-bar-3)",
  "var(--color-chart-bar-4)",
  "var(--color-chart-bar-5)",
];

function formatWeek(w: string) {
  const d = new Date(w + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function VolumeChartInner({ data, unit = "kg" }: { data: WeekData[]; unit?: WeightUnit }) {
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
          stroke="var(--color-chart-axis)"
          fontSize={10}
        />
        <YAxis stroke="var(--color-chart-axis)" fontSize={10} tickFormatter={(v) => `${Math.round(kgToDisplay(v, unit) / 1000)}k`} />
        <Tooltip
          cursor={false}
          contentStyle={{
            background: "var(--color-chart-tooltip-bg)",
            border: "1px solid var(--color-chart-tooltip-border)",
            borderRadius: "4px",
            fontSize: "12px",
          }}
          labelFormatter={formatWeek}
          formatter={(value: number) => [`${Math.round(kgToDisplay(value, unit))} ${unit}`]}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        {dayTypes.map((dt, i) => (
          <Bar
            key={dt}
            dataKey={dt}
            stackId="vol"
            fill={BAR_VARS[i % BAR_VARS.length]}
            name={getDayShortLabel(dt)}
            radius={i === dayTypes.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
