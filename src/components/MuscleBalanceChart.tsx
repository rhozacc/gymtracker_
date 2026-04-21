"use client";

import {
  BarChart,
  Bar,
  XAxis,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";

interface MuscleBalanceData {
  muscle: string;
  delta: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: MuscleBalanceData }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const sign = d.delta > 0 ? "+" : "";
  return (
    <div className="bg-surface border border-border rounded px-3 py-2 text-xs">
      <p className="font-medium text-text">{d.muscle}</p>
      <p className="text-muted">{sign}{d.delta}% vs your average</p>
    </div>
  );
}

function BarLabel({
  x,
  y,
  width,
  height,
  value,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}) {
  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined ||
    value === undefined
  )
    return null;

  const isPositive = value >= 0;
  const labelY = isPositive ? y - 5 : y + height + 12;
  const text = value > 0 ? `+${value}` : `${value}`;

  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fill={isPositive ? "var(--color-accent)" : "var(--color-muted)"}
      fontSize={10}
      fontFamily="inherit"
      fontWeight="500"
    >
      {text}
    </text>
  );
}

export default function MuscleBalanceChart({
  data,
}: {
  data: MuscleBalanceData[];
}) {
  if (!data || data.length < 2) {
    return (
      <p className="text-muted text-sm text-center py-8 border border-border rounded">
        Not enough data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        margin={{ top: 22, right: 8, bottom: 0, left: 8 }}
        barCategoryGap="35%"
      >
        <XAxis
          dataKey="muscle"
          tick={{ fill: "var(--color-muted)", fontSize: 11, fontFamily: "inherit" }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "var(--color-border)", opacity: 0.25 }}
        />
        <Bar dataKey="delta" label={<BarLabel />} isAnimationActive={true} animationDuration={600}>
          {data.map((entry) => (
            <Cell
              key={entry.muscle}
              fill={entry.delta >= 0 ? "var(--color-accent)" : "var(--color-muted)"}
              fillOpacity={entry.delta >= 0 ? 0.85 : 0.4}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
