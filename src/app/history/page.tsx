"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { getDayLabel } from "@/lib/program";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";
import { formatDate, formatDuration } from "@/lib/utils";

interface SessionSummary {
  id: string;
  date: string;
  dayType: string;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  setCount: number;
  totalVolume: number;
}

export default function HistoryPage() {
  const { unit } = useUnit();
  const { data: sessions, isLoading } = useSWR<SessionSummary[]>(
    "/api/sessions",
    fetcher
  );

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium">History</h1>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface rounded animate-pulse" />
          ))}
        </div>
      )}

      {sessions && sessions.length === 0 && (
        <p className="text-muted text-sm text-center py-8">
          No sessions yet. Go log one!
        </p>
      )}

      {sessions?.map((s) => {
        const duration =
          s.startedAt && s.endedAt
            ? formatDuration(s.startedAt, s.endedAt)
            : null;
        return (
          <Link
            key={s.id}
            href={`/history/${s.id}`}
            className="block border border-border rounded p-3 hover:border-muted transition-colors"
          >
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium">
                {getDayLabel(s.dayType)}
              </span>
              <span className="text-muted text-xs">{formatDate(s.date)}</span>
            </div>
            <div className="text-muted text-xs mt-1">
              {s.setCount} sets &middot;{" "}
              {Math.round(kgToDisplay(s.totalVolume, unit)).toLocaleString()}{" "}
              {unit}
              {duration && <span className="ml-2">&middot; {duration}</span>}
            </div>
            {s.notes && (
              <div className="text-muted text-xs mt-1 truncate">{s.notes}</div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
