"use client";

import Link from "next/link";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getDayLabel, PlanDefinition } from "@/lib/program";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";
import { calculateStreak, formatDate } from "@/lib/utils";
import { StreakCalendar } from "@/components/StreakCalendar";

const VolumeChart = dynamic(
  () => import("@/components/VolumeChart").then((m) => m.VolumeChartInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] bg-surface rounded animate-pulse" />
    ),
  }
);

interface SessionSummary {
  id: string;
  date: string;
  dayType: string;
  setCount: number;
  totalVolume: number;
}

function getNextDayType(
  lastDayType: string | undefined,
  plan: PlanDefinition
): string {
  const dayKeys = Object.keys(plan.days);
  if (!lastDayType || dayKeys.length === 0) return dayKeys[0];
  const lastIdx = dayKeys.indexOf(lastDayType);
  if (lastIdx === -1) return dayKeys[0];
  return dayKeys[(lastIdx + 1) % dayKeys.length];
}

export default function Dashboard() {
  const { plan } = useProgram();
  const { unit } = useUnit();
  const { data: sessions, error: sessionsError } = useSWR<SessionSummary[]>("/api/sessions", fetcher);
  const { data: volumeData } = useSWR("/api/volume/weekly", fetcher);

  const streak = sessions ? calculateStreak(sessions) : 0;
  const lastSession = sessions?.[0];
  const nextDayType = getNextDayType(lastSession?.dayType, plan);

  return (
    <div className="space-y-6">
      {sessionsError && (
        <div className="border border-red-500/30 bg-red-950/20 rounded p-3 text-sm">
          <span className="text-red-400 font-medium">No database connected.</span>
          <span className="text-muted ml-1">
            Sessions won&apos;t be saved. Add a Neon Postgres database in your Vercel project settings.
          </span>
        </div>
      )}

      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-medium">Gym Tracker</h1>
          <span className="text-muted text-xs">{plan.name}</span>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold">{streak}</span>
          <span className="text-muted text-sm ml-1">week streak</span>
        </div>
      </div>

      {sessions && sessions.length > 0 && (
        <StreakCalendar sessions={sessions} />
      )}

      {lastSession && (
        <Link
          href={`/history/${lastSession.id}`}
          className="block border border-border rounded p-3 hover:border-muted transition-colors"
        >
          <div className="text-muted text-xs mb-1">Last session</div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm">
              {getDayLabel(lastSession.dayType)}
            </span>
            <span className="text-muted text-xs">
              {formatDate(lastSession.date)}
            </span>
          </div>
          <div className="text-muted text-xs mt-1">
            {lastSession.setCount} sets &middot;{" "}
            {Math.round(kgToDisplay(lastSession.totalVolume, unit)).toLocaleString()}{" "}
            {unit} volume
          </div>
        </Link>
      )}

      <div>
        <div className="text-muted text-xs mb-3">Start session</div>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(plan.days).map(([key, day]) => {
            const isNext = key === nextDayType;
            return (
              <Link
                key={key}
                href={`/log/${key}`}
                className={`border rounded p-3 transition-colors text-sm ${
                  isNext
                    ? "border-accent animate-pulse-border"
                    : "border-border hover:border-muted"
                }`}
              >
                {day.label}
                <span className="text-muted ml-2 text-xs">
                  {day.exercises.length} exercises
                </span>
                {isNext && (
                  <span className="text-accent text-xs ml-2">Next up</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-muted text-xs mb-3">
          Weekly volume (last 16 weeks)
        </div>
        {volumeData && volumeData.length > 0 ? (
          <VolumeChart data={volumeData} unit={unit} />
        ) : (
          <div className="text-muted text-sm text-center py-8 border border-border rounded">
            No data yet. Log your first session!
          </div>
        )}
      </div>
    </div>
  );
}
