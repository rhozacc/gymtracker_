"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
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
  const [confirmNuke, setConfirmNuke] = useState(false);
  const [nuking, setNuking] = useState(false);
  const { data: sessions, isLoading } = useSWR<SessionSummary[]>(
    "/api/sessions",
    fetcher
  );

  const handleDeleteAll = async () => {
    setNuking(true);
    await fetch("/api/sessions", { method: "DELETE" });
    await mutate("/api/sessions");
    setNuking(false);
    setConfirmNuke(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted hover:text-text transition-colors" aria-label="Back to home">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4L6 9l5 5"/>
            </svg>
          </Link>
          <h1 className="text-lg font-medium">History</h1>
        </div>
        {sessions && sessions.length > 0 && !confirmNuke && (
          <button
            onClick={() => setConfirmNuke(true)}
            className="text-red-400 text-xs hover:text-red-300"
          >
            Delete all
          </button>
        )}
        {confirmNuke && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteAll}
              disabled={nuking}
              className="text-red-400 text-xs font-medium hover:text-red-300 disabled:opacity-50"
            >
              {nuking ? "Deleting..." : "Confirm nuke"}
            </button>
            <button
              onClick={() => setConfirmNuke(false)}
              className="text-muted text-xs hover:text-accent"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

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
