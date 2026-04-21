"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { fetcher } from "@/lib/swr";
import { getExerciseById } from "@/lib/program";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay, displayToKg } from "@/lib/units";
import { estimateE1RM } from "@/lib/e1rm";
import { checkOverload } from "@/lib/overload";
import {
  getStandard,
  computeStanding,
  linearRegressionSlope,
  TIER_ORDER,
  type TierName,
} from "@/lib/standards";

const ExerciseStatsChart = dynamic(
  () =>
    import("@/components/ExerciseStatsChart").then(
      (m) => m.ExerciseStatsChartInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] bg-surface rounded animate-pulse" />
    ),
  }
);

interface ChartSession {
  id: string;
  date: string;
  sets: {
    exerciseId: string;
    reps: number;
    weight: number;
    rir: number | null;
  }[];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-4">
      {children}
    </p>
  );
}

const TIER_LABELS: Record<TierName, string> = {
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
};

const BW_KEY = "gym-bodyweight-kg";

export default function ExerciseStatsPage() {
  const params = useParams();
  const exerciseId = params.exerciseId as string;
  const { unit } = useUnit();
  const exercise = getExerciseById(exerciseId);

  const [bodyweightKg, setBodyweightKg] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem(BW_KEY);
    return v ? parseFloat(v) : null;
  });
  const [bwInput, setBwInput] = useState("");

  const { data: chartSessions } = useSWR<ChartSession[]>(
    "/api/charts/data",
    fetcher
  );

  const e1rmPoints = useMemo(() => {
    if (!chartSessions) return [];
    const points: { date: string; e1rm: number; actualWeight: number }[] = [];
    for (const session of chartSessions) {
      const exSets = session.sets.filter((s) => s.exerciseId === exerciseId);
      if (exSets.length === 0) continue;
      const bestE1rm = Math.max(
        ...exSets.map((s) => estimateE1RM(s.weight, s.reps))
      );
      const maxWeight = Math.max(...exSets.map((s) => s.weight));
      points.push({
        date: session.date,
        e1rm: Math.round(kgToDisplay(bestE1rm, unit) * 10) / 10,
        actualWeight: Math.round(kgToDisplay(maxWeight, unit) * 10) / 10,
      });
    }
    return points;
  }, [chartSessions, exerciseId, unit]);

  // Raw kg E1RM points for standards comparison and projection
  const e1rmPointsKg = useMemo(() => {
    if (!chartSessions) return [];
    const points: { date: string; e1rm: number }[] = [];
    for (const session of chartSessions) {
      const exSets = session.sets.filter((s) => s.exerciseId === exerciseId);
      if (exSets.length === 0) continue;
      const bestE1rm = Math.max(
        ...exSets.map((s) => estimateE1RM(s.weight, s.reps))
      );
      points.push({ date: session.date, e1rm: bestE1rm });
    }
    return points;
  }, [chartSessions, exerciseId]);

  const bestE1rmKg = useMemo(
    () =>
      e1rmPointsKg.length > 0
        ? Math.max(...e1rmPointsKg.map((p) => p.e1rm))
        : null,
    [e1rmPointsKg]
  );

  // Compute overload status from the most recent session's sets
  const overload = useMemo(() => {
    if (!chartSessions || !exercise) return null;
    // Find the most recent session containing this exercise
    for (let i = chartSessions.length - 1; i >= 0; i--) {
      const sets = chartSessions[i].sets.filter((s) => s.exerciseId === exerciseId);
      if (sets.length > 0) return checkOverload(exercise, sets);
    }
    return null;
  }, [chartSessions, exerciseId, exercise]);

  const bestE1rm = useMemo(
    () => (e1rmPoints.length > 0 ? Math.max(...e1rmPoints.map((p) => p.e1rm)) : null),
    [e1rmPoints]
  );

  const recentTrend = useMemo(() => {
    if (e1rmPoints.length < 4) return null;
    const recent = e1rmPoints.slice(-3).reduce((s, p) => s + p.e1rm, 0) / 3;
    const prev = e1rmPoints.slice(-6, -3).reduce((s, p) => s + p.e1rm, 0) / 3;
    if (prev === 0) return null;
    return Math.round(((recent - prev) / prev) * 1000) / 10; // percent, 1 dp
  }, [e1rmPoints]);

  const standard = useMemo(() => getStandard(exerciseId), [exerciseId]);

  const standardsData = useMemo(() => {
    if (!standard || bodyweightKg === null || bestE1rmKg === null) return null;
    return computeStanding(bestE1rmKg, bodyweightKg, standard);
  }, [standard, bodyweightKg, bestE1rmKg]);

  const projectionWeeks = useMemo(() => {
    if (
      !standardsData?.nextThresholdKg ||
      bestE1rmKg === null ||
      e1rmPointsKg.length < 3
    )
      return null;
    if (standardsData.nextThresholdKg <= bestE1rmKg) return null;
    const slope = linearRegressionSlope(e1rmPointsKg); // kg/day
    if (slope <= 0) return null;
    const daysTo = (standardsData.nextThresholdKg - bestE1rmKg) / slope;
    const weeks = Math.round(daysTo / 7);
    return weeks > 0 && weeks < 104 ? weeks : null;
  }, [standardsData, bestE1rmKg, e1rmPointsKg]);

  function saveBw() {
    const raw = parseFloat(bwInput);
    if (isNaN(raw) || raw <= 0) return;
    const kg = unit === "lbs" ? displayToKg(raw, "lbs") : raw;
    localStorage.setItem(BW_KEY, String(kg));
    setBodyweightKg(kg);
    setBwInput("");
  }

  const exerciseName = exercise?.name ?? exerciseId.replace(/_/g, " ");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-muted hover:text-text transition-colors"
          aria-label="Back to home"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4L6 9l5 5" />
          </svg>
        </Link>
        <h1 className="text-lg font-medium">{exerciseName}</h1>
      </div>

      {/* Summary stats */}
      {e1rmPoints.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border rounded p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-1">
              Best Est. 1RM
            </p>
            <p className="text-xl font-bold">
              {bestE1rm?.toFixed(1)}
              <span className="text-sm font-normal text-muted ml-1">{unit}</span>
            </p>
          </div>
          <div className="border border-border rounded p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-1">
              Sessions
            </p>
            <p className="text-xl font-bold">
              {e1rmPoints.length}
              {recentTrend !== null && (
                <span
                  className={`text-sm font-medium ml-2 ${
                    recentTrend >= 0 ? "text-accent" : "text-red-400"
                  }`}
                >
                  {recentTrend >= 0 ? "+" : ""}
                  {recentTrend}%
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Load up recommendation */}
      {overload && (overload.status === "go_up" || overload.status === "almost_ready") && (
        <div className={`border rounded p-3 ${overload.status === "go_up" ? "border-accent/40 bg-accent/5" : "border-border"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide ${overload.status === "go_up" ? "text-accent" : "text-muted"}`}>
                {overload.status === "go_up" ? "Ready to load up" : "Almost ready"}
              </p>
              <p className="text-sm mt-1">
                {overload.status === "go_up" ? (
                  <>
                    <span className="text-muted">{kgToDisplay(overload.lastWeight, unit)} {unit}</span>
                    <span className="text-muted mx-2">→</span>
                    <span className="text-accent font-medium">{kgToDisplay(overload.suggestedWeight, unit)} {unit}</span>
                  </>
                ) : (
                  <span className="text-muted">{kgToDisplay(overload.lastWeight, unit)} {unit} — keep pushing</span>
                )}
              </p>
            </div>
            {overload.status === "go_up" && (
              <div className="text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart section */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        <SectionLabel>Strength over time</SectionLabel>
        <div>
          <div className="flex gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-[10px] text-text">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "var(--color-accent)" }} />
              Max weight
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted">
              <span className="w-2.5 h-2.5 rounded-full inline-block opacity-45" style={{ backgroundColor: "var(--color-accent)" }} />
              Est. 1RM
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted">
              <span className="inline-block w-5 border-t border-dashed opacity-35" style={{ borderColor: "var(--color-accent)" }} />
              Projection
            </span>
          </div>
          <ExerciseStatsChart
            data={e1rmPoints}
            unit={unit}
            suggestedWeight={overload?.status === "go_up" ? kgToDisplay(overload.suggestedWeight, unit) : undefined}
          />
        </div>
      </div>

      {/* Strength standards */}
      {standard !== null && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <SectionLabel>Strength standards</SectionLabel>

          {bodyweightKg === null ? (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Enter your bodyweight to see where you stand.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  value={bwInput}
                  onChange={(e) => setBwInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveBw()}
                  placeholder={unit === "kg" ? "e.g. 80" : "e.g. 176"}
                  className="flex-1 bg-bg border border-border text-text text-sm rounded px-3 py-2 focus:border-accent focus:outline-none"
                />
                <button
                  onClick={saveBw}
                  className="bg-accent text-bg text-sm font-medium px-4 rounded"
                >
                  Set
                </button>
              </div>
              <p className="text-[10px] text-muted/60">in {unit}</p>
            </div>
          ) : bestE1rmKg === null ? (
            <p className="text-xs text-muted py-2">
              Log some sets to see your standing.
            </p>
          ) : standardsData ? (
            <div className="space-y-3">
              {/* Tier chips */}
              <div className="grid grid-cols-4 gap-1.5">
                {TIER_ORDER.map((tier) => {
                  const active = tier === standardsData.currentTier;
                  const isNext = tier === standardsData.nextTier;
                  const thresholdDisplay = kgToDisplay(
                    standardsData.thresholds[tier],
                    unit
                  ).toFixed(0);
                  return (
                    <div
                      key={tier}
                      className={`text-center py-2 px-1 rounded border transition-colors ${
                        active
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : isNext
                          ? "border-border text-muted"
                          : "border-border text-muted/50"
                      }`}
                    >
                      <p className={`text-[11px] font-medium ${active ? "text-accent" : isNext ? "text-muted" : "text-muted/50"}`}>
                        {TIER_LABELS[tier]}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${active ? "text-accent/70" : "text-muted/40"}`}>
                        {thresholdDisplay}
                        <span className="ml-0.5">{unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Narrative */}
              <p className="text-xs text-muted leading-relaxed">
                {standardsData.currentTier === null ? (
                  <>
                    Working toward{" "}
                    <span className="text-text">Novice</span> —{" "}
                    {kgToDisplay(standardsData.thresholds.novice, unit).toFixed(1)}{" "}
                    {unit} target
                    {projectionWeeks !== null && (
                      <span className="text-accent">
                        {" "}· ~{projectionWeeks} week{projectionWeeks !== 1 ? "s" : ""} at this pace
                      </span>
                    )}
                  </>
                ) : standardsData.nextTier === null ? (
                  <span className="text-accent">
                    Elite — you&apos;re in the top tier.
                  </span>
                ) : (
                  <>
                    <span className="text-text">
                      {TIER_LABELS[standardsData.currentTier]}
                    </span>
                    {" · next: "}
                    <span className="text-text">
                      {TIER_LABELS[standardsData.nextTier]}
                    </span>{" "}
                    (
                    {kgToDisplay(standardsData.nextThresholdKg!, unit).toFixed(1)}{" "}
                    {unit})
                    {projectionWeeks !== null && (
                      <span className="text-accent">
                        {" "}· ~{projectionWeeks} week{projectionWeeks !== 1 ? "s" : ""} at this pace
                      </span>
                    )}
                  </>
                )}
              </p>

              {/* Bodyweight edit */}
              <button
                onClick={() => {
                  setBodyweightKg(null);
                  setBwInput("");
                }}
                className="text-[10px] text-muted/50 hover:text-muted transition-colors"
              >
                bodyweight: {kgToDisplay(bodyweightKg, unit).toFixed(1)} {unit} · edit
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Explainer */}
      <div className="border-t border-border pt-4">
        <p className="text-muted text-xs leading-relaxed">
          <span className="text-text">Large dots</span> = max weight you lifted that session.{" "}
          <span className="text-text">Small dots</span> = estimated 1RM (Epley: weight &times; (1 + reps &divide; 30)).{" "}
          The dashed line projects your 1RM trend 8 weeks out.
          {overload?.status === "go_up" && " The accent target line shows your next suggested weight."}
        </p>
      </div>
    </div>
  );
}
