"use client";

import { useState } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getAllExercises } from "@/lib/program";
import { StreakCalendar } from "@/components/StreakCalendar";

const VolumeChart = dynamic(
  () => import("@/components/VolumeChart").then((m) => m.VolumeChartInner),
  {
    ssr: false,
    loading: () => <div className="h-[280px] bg-surface rounded animate-pulse" />,
  }
);

const ProgressionChart = dynamic(
  () =>
    import("@/components/ProgressionChart").then(
      (m) => m.ProgressionChartInner
    ),
  {
    ssr: false,
    loading: () => <div className="h-[280px] bg-surface rounded animate-pulse" />,
  }
);

interface SessionSummary {
  id: string;
  date: string;
  dayType: string;
}

interface SetData {
  exerciseId: string;
  reps: number;
  weight: number;
}

interface SessionWithSets {
  id: string;
  date: string;
  dayType: string;
  sets: SetData[];
}

export default function ChartsPage() {
  const [selectedExercise, setSelectedExercise] = useState(
    getAllExercises()[0]?.id || ""
  );

  const { data: volumeData } = useSWR("/api/volume/weekly", fetcher);
  const { data: sessions } = useSWR<SessionSummary[]>("/api/sessions", fetcher);

  // Fetch all sessions with sets for progression chart
  const { data: allSessions } = useSWR<SessionWithSets[]>(
    "/api/sessions?detail=1",
    async (url: string) => {
      const summaries = await fetcher(url);
      // Fetch each session's details for exercise-level data
      const detailed = await Promise.all(
        summaries.slice(0, 50).map(async (s: SessionSummary) => {
          const detail = await fetcher(`/api/sessions/${s.id}`);
          return detail;
        })
      );
      return detailed;
    }
  );

  // Compute per-exercise progression data
  const progressionData = (() => {
    if (!allSessions) return [];
    const points: { date: string; avgWeight: number }[] = [];

    for (const session of allSessions) {
      const exSets = session.sets?.filter(
        (s: SetData) => s.exerciseId === selectedExercise
      );
      if (!exSets || exSets.length === 0) continue;
      const avgWeight =
        exSets.reduce((sum: number, s: SetData) => sum + s.weight, 0) /
        exSets.length;
      points.push({ date: session.date, avgWeight: Math.round(avgWeight * 10) / 10 });
    }

    return points.reverse();
  })();

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-medium">Charts</h1>

      <div>
        <h2 className="text-muted text-xs mb-3">Weekly volume</h2>
        {volumeData && volumeData.length > 0 ? (
          <VolumeChart data={volumeData} />
        ) : (
          <div className="text-muted text-sm text-center py-8 border border-border rounded">
            No data yet.
          </div>
        )}
      </div>

      <div>
        <h2 className="text-muted text-xs mb-3">Exercise progression</h2>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full h-10 bg-surface border border-border text-accent text-sm rounded px-3 mb-3 focus:border-accent focus:outline-none"
        >
          {getAllExercises().map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <ProgressionChart data={progressionData} />
      </div>

      <div>
        <h2 className="text-muted text-xs mb-3">Activity (last 12 weeks)</h2>
        <StreakCalendar sessions={sessions || []} />
      </div>
    </div>
  );
}
