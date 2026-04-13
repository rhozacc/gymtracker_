"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { type WeightUnit } from "@/lib/units";
import { ChartTooltip } from "./ChartTooltip";

interface DataPoint {
  date: string;
  e1rm: number;
}

interface CombinedPoint {
  date: string;
  actual?: number;
  projected?: number;
}

function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function ExerciseStatsChartInner({
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

  const DAY_MS = 86_400_000;
  const firstMs = new Date(data[0].date).getTime();
  const lastMs = new Date(data[data.length - 1].date).getTime();
  const lastDayX = (lastMs - firstMs) / DAY_MS;

  // Linear regression over all actual points
  const regPoints = data.map((p) => ({
    x: (new Date(p.date).getTime() - firstMs) / DAY_MS,
    y: p.e1rm,
  }));
  const { slope, intercept } = linearRegression(regPoints);

  // Build combined dataset
  const combined: CombinedPoint[] = data.map((p) => ({
    date: p.date,
    actual: p.e1rm,
  }));

  // Attach projected value to the last actual point so the two lines connect
  const lastPoint = combined[combined.length - 1];
  lastPoint.projected = Math.round(
    (slope * lastDayX + intercept) * 10
  ) / 10;

  // Weekly projection for 8 weeks beyond last actual session
  const PROJECTION_WEEKS = 8;
  for (let w = 1; w <= PROJECTION_WEEKS; w++) {
    const dayX = lastDayX + w * 7;
    const projDate = new Date(firstMs + dayX * DAY_MS)
      .toISOString()
      .split("T")[0];
    const projValue = slope * dayX + intercept;
    combined.push({
      date: projDate,
      projected: Math.max(0, Math.round(projValue * 10) / 10),
    });
  }

  // today marker date string
  const todayDate = new Date().toISOString().split("T")[0];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={combined} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="date"
          stroke="var(--color-chart-axis)"
          fontSize={10}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatDate}
          minTickGap={40}
        />
        <YAxis
          stroke="var(--color-chart-axis)"
          fontSize={10}
          axisLine={false}
          tickLine={false}
          unit={` ${unit}`}
          domain={["auto", "auto"]}
          width={52}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatValue={(v, name) =>
                `${v.toFixed(1)} ${unit}${name === "Projected" ? " (proj.)" : ""}`
              }
            />
          }
        />
        {/* Today marker */}
        <ReferenceLine
          x={todayDate}
          stroke="var(--color-muted)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        {/* Actual data — dots, no connecting line */}
        <Line
          type="monotone"
          dataKey="actual"
          stroke="var(--color-chart-line)"
          strokeWidth={0}
          dot={{ r: 4, fill: "var(--color-chart-line)", strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
          connectNulls={false}
          name="Est. 1RM"
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-out"
        />
        {/* Projection — dashed line, no dots */}
        <Line
          type="monotone"
          dataKey="projected"
          stroke="var(--color-chart-line)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          activeDot={false}
          connectNulls={false}
          name="Projected"
          opacity={0.45}
          isAnimationActive={true}
          animationDuration={1000}
          animationEasing="ease-out"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
