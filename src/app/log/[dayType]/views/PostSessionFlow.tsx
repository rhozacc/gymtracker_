"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostSessionExtras } from "@/components/PostSessionExtras";
import { PostWorkoutSummary, computeSummary } from "@/components/PostWorkoutSummary";
import { Debrief } from "@/components/Debrief";
import type { WeightUnit } from "@/lib/units";

type SummaryData = ReturnType<typeof computeSummary>;

interface PostSessionFlowProps {
  sessionId: string;
  summaryData: SummaryData | null;
  unit: WeightUnit;
}

export function PostSessionFlow({ sessionId, summaryData, unit }: PostSessionFlowProps) {
  const router = useRouter();
  const [debriefMode, setDebriefMode] = useState(false);

  if (!debriefMode) {
    return (
      <div className="py-4">
        <PostSessionExtras
          sessionId={sessionId}
          onDone={() => setDebriefMode(true)}
        />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      <h1 className="text-lg font-medium">Session Complete</h1>
      {summaryData && (
        <PostWorkoutSummary
          durationMs={summaryData.durationMs}
          totalVolumeKg={summaryData.totalVolumeKg}
          setCount={summaryData.setCount}
          exerciseCount={summaryData.exerciseCount}
          unit={unit}
          weightUps={summaryData.weightUps}
          topE1rm={summaryData.topE1rm}
        />
      )}
      <div className="border-t border-border pt-6">
        <Debrief
          sessionId={sessionId}
          onDone={() => router.push("/")}
        />
      </div>
    </div>
  );
}
