"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";

interface OverviewData {
  totalUsers: number;
  activeThisWeek: number;
  totalVolumeKg: number;
  activity: { date: string; volume: number }[];
}

function GlobalHeatmap({ activity }: { activity: { date: string; volume: number }[] }) {
  const CELL_SIZE = 18;
  const WEEKS = 14;
  const INTENSITIES = [0.15, 0.3, 0.5, 0.75, 1.0];

  const dayMap = new Map(activity.map((a) => [a.date, a.volume]));
  const volumes = activity.map((a) => a.volume).filter((v) => v > 0);
  const minVol = volumes.length ? Math.min(...volumes) : 0;
  const maxVol = volumes.length ? Math.max(...volumes) : 0;

  function intensity(vol: number) {
    if (!vol || maxVol === 0 || maxVol === minVol) return null;
    const norm = (vol - minVol) / (maxVol - minVol);
    const idx = Math.min(INTENSITIES.length - 1, Math.floor(norm * INTENSITIES.length));
    return INTENSITIES[idx];
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startDay = new Date(today);
  const dow = startDay.getUTCDay();
  startDay.setUTCDate(startDay.getUTCDate() + (dow === 0 ? -6 : 1 - dow) - (WEEKS - 1) * 7);

  const cells: { date: string; vol: number; future: boolean }[] = [];
  const cursor = new Date(startDay);
  for (let i = 0; i < WEEKS * 7; i++) {
    const key = cursor.toISOString().split("T")[0];
    cells.push({ date: key, vol: dayMap.get(key) ?? 0, future: cursor > today });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const DAY_LABELS = ["M", "", "W", "", "F", "", "S"];

  return (
    <div className="w-full">
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] mr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="text-muted text-[9px] flex items-center justify-end h-[18px] w-4">
              {label}
            </div>
          ))}
        </div>
        {Array.from({ length: WEEKS }, (_, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, di) => {
              const cell = cells[wi * 7 + di];
              if (!cell) return <div key={di} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
              if (cell.future) return <div key={di} className="rounded-[4px] bg-bg" style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
              const op = intensity(cell.vol);
              return (
                <div
                  key={di}
                  className="rounded-[4px]"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: op ? "var(--color-accent)" : "var(--color-surface)",
                    opacity: op ?? 1,
                  }}
                  title={cell.date}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommunityScreen() {
  const { unit } = useUnit();
  const { data } = useSWR<OverviewData>("/api/social/overview", fetcher, {
    revalidateOnFocus: false,
  });

  function formatVol(kg: number) {
    const v = kgToDisplay(kg, unit);
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${Math.round(v / 1000)}k`;
    return String(Math.round(v));
  }

  return (
    <>
      <div className="flex gap-8 mb-6">
        {[
          { label: "Members", value: data ? String(data.totalUsers) : "—" },
          { label: "This week", value: data ? String(data.activeThisWeek) : "—" },
          { label: `${unit} lifted`, value: data ? formatVol(data.totalVolumeKg) : "—" },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="text-muted text-xs mb-2">Global activity</div>
      {data ? (
        <GlobalHeatmap activity={data.activity} />
      ) : (
        <div className="h-[168px] bg-surface rounded animate-pulse" />
      )}
    </>
  );
}
