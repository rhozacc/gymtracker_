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
  Cell,
} from "recharts";

interface HourlyData {
  hourly: { hour: number; volume: number }[];
}

function formatHour(h: number) {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

export function PeakHoursChartInner({
  data,
  unit,
}: {
  data: { hour: number; volume: number }[];
  unit: string;
}) {
  const maxVol = Math.max(...data.map((d) => d.volume), 1);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="20%">
        <XAxis
          dataKey="hour"
          tickFormatter={formatHour}
          stroke="var(--color-chart-axis)"
          fontSize={9}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: "var(--color-surface)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload as { hour: number; volume: number };
            return (
              <div className="bg-surface border border-border rounded px-2 py-1 text-[11px]">
                <span className="text-muted">{formatHour(row.hour)} — </span>
                <span className="text-text font-medium">
                  {Math.round(kgToDisplay(row.volume, unit as "kg" | "lbs") / 1000)}k {unit}
                </span>
              </div>
            );
          }}
        />
        <Bar dataKey="volume" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.hour}
              fill="var(--color-accent)"
              opacity={0.15 + 0.85 * (entry.volume / maxVol)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const PeakHoursChart = dynamic(
  () => import("@/components/social/PeakHoursScreen").then((m) => m.PeakHoursChartInner),
  { ssr: false, loading: () => <div className="h-[200px] bg-surface rounded animate-pulse" /> }
);

export function PeakHoursScreen() {
  const { unit } = useUnit();
  const { data } = useSWR<HourlyData>("/api/social/hourly", fetcher, {
    revalidateOnFocus: false,
  });

  return (
    <>
      <p className="text-muted text-xs mb-3">When the community trains — last 7 days (UTC)</p>
      {data ? (
        <PeakHoursChart data={data.hourly} unit={unit} />
      ) : (
        <div className="h-[200px] bg-surface rounded animate-pulse" />
      )}
    </>
  );
}
