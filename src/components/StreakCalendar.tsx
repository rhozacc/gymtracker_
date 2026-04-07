"use client";

interface Props {
  sessions: { date: string; dayType: string }[];
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

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

  function getCellColor(dayType: string | null, future: boolean) {
    if (future) return "bg-bg";
    if (!dayType) return "bg-surface";
    return "bg-accent";
  }

  return (
    <div>
      <div className="grid grid-cols-[auto_repeat(12,1fr)] gap-[3px]">
        {/* Day labels column */}
        {DAY_LABELS.map((label, i) => (
          <div
            key={`label-${i}`}
            className="text-muted text-[9px] flex items-center justify-end pr-1 h-[18px]"
          >
            {i % 2 === 0 ? label : ""}
          </div>
        ))}
        {/* This won't work right with CSS grid — need to restructure */}
      </div>
      {/* Simpler approach: column-based */}
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
              if (!cell) return <div key={dayIdx} className="w-[18px] h-[18px]" />;
              return (
                <div
                  key={dayIdx}
                  className={`w-[18px] h-[18px] rounded-[3px] ${getCellColor(
                    cell.dayType,
                    cell.future
                  )}`}
                  title={`${cell.date}${cell.dayType ? ` — ${cell.dayType}` : ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
