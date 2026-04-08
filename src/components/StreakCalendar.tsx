"use client";

import { getDayShortLabel } from "@/lib/program";

interface Props {
  sessions: { date: string; dayType: string }[];
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const DAY_TYPE_COLORS = [
  "var(--color-chart-bar-1)",
  "var(--color-chart-bar-2)",
  "var(--color-chart-bar-3)",
  "var(--color-chart-bar-4)",
  "var(--color-chart-bar-5)",
];

export function StreakCalendar({ sessions }: Props) {
  const weeks = 12;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Build a set of dates that had sessions
  const sessionDates = new Map<string, string>();
  for (const s of sessions) {
    const key = new Date(s.date).toISOString().split("T")[0];
    sessionDates.set(key, s.dayType);
  }

  // Build dayType -> color mapping (stable order based on first appearance)
  const uniqueDayTypes: string[] = [];
  for (const s of sessions) {
    if (!uniqueDayTypes.includes(s.dayType)) uniqueDayTypes.push(s.dayType);
  }
  const dayTypeColorMap = new Map<string, string>();
  uniqueDayTypes.forEach((dt, i) => {
    dayTypeColorMap.set(dt, DAY_TYPE_COLORS[i % DAY_TYPE_COLORS.length]);
  });

  // Find the Monday `weeks` weeks ago
  const startDay = new Date(today);
  const dayOfWeek = startDay.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDay.setUTCDate(startDay.getUTCDate() + mondayOffset - (weeks - 1) * 7);

  const cells: { date: string; dayType: string | null; future: boolean }[] = [];
  const cursor = new Date(startDay);
  for (let i = 0; i < weeks * 7; i++) {
    const key = cursor.toISOString().split("T")[0];
    cells.push({
      date: key,
      dayType: sessionDates.get(key) || null,
      future: cursor > today,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return (
    <div>
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
                  className="w-[18px] h-[18px] rounded-[4px] streak-cell-active"
                  style={{
                    backgroundColor:
                      dayTypeColorMap.get(cell.dayType) || "var(--color-accent)",
                  }}
                  title={`${cell.date} — ${getDayShortLabel(cell.dayType)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      {uniqueDayTypes.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {uniqueDayTypes.map((dt) => (
            <div key={dt} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-[2px]"
                style={{ backgroundColor: dayTypeColorMap.get(dt) }}
              />
              <span className="text-muted text-[10px]">
                {getDayShortLabel(dt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
