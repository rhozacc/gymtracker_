"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CompareData {
  weeks: { week: string; mine: number; avg: number }[];
  percentile: number;
}

function formatWeek(w: string) {
  const d = new Date(w + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function YouVsAllChartInner({
  data,
  unit,
}: {
  data: { week: string; mine: number; avg: number }[];
  unit: string;
}) {
  const u = unit as "kg" | "lbs";
  const display = data.map((d) => ({
    week: d.week,
    You: Math.round(kgToDisplay(d.mine, u)),
    Avg: Math.round(kgToDisplay(d.avg, u)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={display} barCategoryGap="30%" barGap={2}>
        <XAxis
          dataKey="week"
          tickFormatter={formatWeek}
          stroke="var(--color-chart-axis)"
          fontSize={9}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          stroke="var(--color-chart-axis)"
          fontSize={9}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          width={28}
        />
        <Tooltip
          cursor={{ fill: "var(--color-surface)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-surface border border-border rounded px-2 py-1 text-[11px] space-y-0.5">
                <p className="text-muted">{formatWeek(label as string)}</p>
                {payload.map((p) => (
                  <p key={p.name} className="text-text">
                    <span style={{ color: p.color as string }}>{p.name}: </span>
                    {Number(p.value).toLocaleString()} {unit}
                  </p>
                ))}
              </div>
            );
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey="You" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Avg" fill="var(--color-accent)" opacity={0.3} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const YouVsAllChart = dynamic(
  () => import("@/components/social/YouVsAllScreen").then((m) => m.YouVsAllChartInner),
  { ssr: false, loading: () => <div className="h-[220px] bg-surface rounded animate-pulse" /> }
);

export function YouVsAllScreen() {
  const { unit } = useUnit();
  const { data } = useSWR<CompareData>("/api/social/compare", fetcher, {
    revalidateOnFocus: false,
  });

  const percentile = data?.percentile ?? null;

  const blurb =
    percentile === null ? null
    : percentile === 0 ? "Just getting started this week."
    : percentile >= 90 ? `Top ${100 - percentile}% this week.`
    : percentile >= 50 ? "Above average this week."
    : "Below average this week — keep going.";

  return (
    <>
      {blurb && <p className="text-muted text-xs mb-3">{blurb}</p>}
      {data ? (
        <>
          <YouVsAllChart data={data.weeks} unit={unit} />
          {data.weeks.length < 2 && (
            <p className="text-muted text-xs text-center mt-3">More weeks needed to compare.</p>
          )}
        </>
      ) : (
        <div className="h-[220px] bg-surface rounded animate-pulse" />
      )}
    </>
  );
}
