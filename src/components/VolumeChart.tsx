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
import { ChartTooltip } from "./ChartTooltip";

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
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="var(--color-chart-axis)"
          fontSize={10}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(kgToDisplay(v, unit) / 1000)}k`}
        />
        <Tooltip
          cursor={{ fill: "var(--color-accent)", fillOpacity: 0.04 }}
          content={
            <ChartTooltip
              formatLabel={formatWeek}
              formatValue={(v) => `${Math.round(kgToDisplay(v, unit))} ${unit}`}
            />
          }
        />
        <Legend
          wrapperStyle={{ fontSize: "10px", color: "var(--color-muted)", letterSpacing: "0.05em" }}
          iconType="circle"
        />
        {dayTypes.map((dt, i) => (
          <Bar
            key={dt}
            dataKey={dt}
            stackId="vol"
            fill={BAR_VARS[i % BAR_VARS.length]}
            name={getDayShortLabel(dt)}
            radius={i === dayTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationBegin={i * 100}
            animationEasing="ease-out"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
