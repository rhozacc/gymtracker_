"use client";

import { useMemo, useRef, useLayoutEffect, useState } from "react";
import { getDayShortLabel } from "@/lib/program";

interface Props {
  sessions: { date: string; dayType: string; totalVolume?: number }[];
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Opacity levels for volume-based intensity (GitHub-style)
const INTENSITY_OPACITIES = [0.15, 0.3, 0.5, 0.75, 1.0];

const CELL_SIZE = 18;
const CELL_GAP = 3;
// Day-label column: 4px margin + 16px width = ~22px
const DAY_LABEL_WIDTH = 22;

export function StreakCalendar({ sessions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState(12);

  // Measure container and compute how many weeks fit
  useLayoutEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const available = width - DAY_LABEL_WIDTH;
      const colWidth = CELL_SIZE + CELL_GAP;
      const computed = Math.max(4, Math.floor(available / colWidth));
      setWeeks(computed);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Build a map of date -> session info
  const sessionMap = useMemo(() => {
    const map = new Map<string, { dayType: string; volume: number }>();
    for (const s of sessions) {
      const key = new Date(s.date).toISOString().split("T")[0];
      const existing = map.get(key);
      const vol = s.totalVolume ?? 0;
      if (!existing || vol > existing.volume) {
        map.set(key, { dayType: s.dayType, volume: vol });
      }
    }
    return map;
  }, [sessions]);

  // Compute volume range for intensity mapping
  const { minVol, maxVol } = useMemo(() => {
    let min = Infinity;
    let max = 0;
    for (const entry of Array.from<{ dayType: string; volume: number }>(sessionMap.values())) {
      if (entry.volume > 0) {
        min = Math.min(min, entry.volume);
        max = Math.max(max, entry.volume);
      }
    }
    return { minVol: min === Infinity ? 0 : min, maxVol: max };
  }, [sessionMap]);

  function getIntensity(volume: number): number {
    if (maxVol === 0 || maxVol === minVol) return INTENSITY_OPACITIES[2];
    const normalized = (volume - minVol) / (maxVol - minVol);
    const idx = Math.min(
      INTENSITY_OPACITIES.length - 1,
      Math.floor(normalized * INTENSITY_OPACITIES.length)
    );
    return INTENSITY_OPACITIES[idx];
  }

  // Find the Monday `weeks` weeks ago
  const startDay = new Date(today);
  const dayOfWeek = startDay.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDay.setUTCDate(startDay.getUTCDate() + mondayOffset - (weeks - 1) * 7);

  const cells: {
    date: string;
    dayType: string | null;
    volume: number;
    future: boolean;
  }[] = [];
  const cursor = new Date(startDay);
  for (let i = 0; i < weeks * 7; i++) {
    const key = cursor.toISOString().split("T")[0];
    const entry = sessionMap.get(key);
    cells.push({
      date: key,
      dayType: entry?.dayType || null,
      volume: entry?.volume || 0,
      future: cursor > today,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] mr-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="text-muted text-[9px] flex items-center justify-end h-[18px] w-4"
            >
              {i % 2 === 0 ? label : ""}
            </div>
          ))}
        </div>
        {Array.from({ length: weeks }, (_, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, dayIdx) => {
              const cell = cells[weekIdx * 7 + dayIdx];
              if (!cell)
                return <div key={dayIdx} className="w-[18px] h-[18px]" />;

              if (cell.future) {
                return (
                  <div
                    key={dayIdx}
                    className="w-[18px] h-[18px] rounded-[4px] bg-bg"
                    title={cell.date}
                  />
                );
              }

              if (!cell.dayType) {
                return (
                  <div
                    key={dayIdx}
                    className="w-[18px] h-[18px] rounded-[4px] bg-surface"
                    title={cell.date}
                  />
                );
              }

              return (
                <div
                  key={dayIdx}
                  className="w-[18px] h-[18px] rounded-[4px]"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    opacity: getIntensity(cell.volume),
                  }}
                  title={`${cell.date} — ${getDayShortLabel(cell.dayType)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
