"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { checkOverload, OverloadResult } from "@/lib/overload";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay, displayToKg, getIncrements } from "@/lib/units";
import type { SetInput } from "@/components/SetRow";
import { GuidedSession } from "@/components/GuidedSession";
import { ExtrasSession } from "@/components/ExtrasSession";
import { computeSummary } from "@/components/PostWorkoutSummary";
import { Toast } from "@/components/Toast";
import { EndSessionModal } from "@/components/EndSessionModal";
import { ExerciseRenameModal } from "@/components/ExerciseRenameModal";
import { RestTimer } from "@/components/RestTimer";
import { useExtras } from "@/lib/useExtras";
import { useBeep } from "@/lib/useBeep";
import { useBackgroundNotification } from "@/lib/useBackgroundNotification";
import { useNavVisibility } from "@/lib/useNavVisibility";
import { useTheme } from "@/lib/useTheme";
import { useSessionBackup } from "./hooks/useSessionBackup";
import { PostSessionFlow } from "./views/PostSessionFlow";
import { StandardModeView } from "./views/StandardModeView";
import type { ExerciseState } from "./types";

export default function LogPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { plan, planId, refreshPlans } = useProgram();
  const { unit } = useUnit();
  const dayType = params.dayType as string;
  const day = plan.days[dayType];

  const startedAtRef = useRef<string>(new Date().toISOString());
  const initializedForDayRef = useRef<string | null>(null);
  const guidedModeRef = useRef(false);

  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [overloads, setOverloads] = useState<Record<string, OverloadResult>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  // Rest timer state (standard mode)
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Guided mode state
  const [guidedMode, setGuidedMode] = useState(false);
  const [wasGuidedMode, setWasGuidedMode] = useState(false);
  const [guidedCompleted, setGuidedCompleted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const { initAudio } = useBeep();
  const { requestPermission } = useBackgroundNotification();
  const { setNavVisible } = useNavVisibility();
  const { theme, toggleTheme } = useTheme();

  // Guided extras state (during workout, before review)
  const { selectedExtras } = useExtras();
  const [guidedExtrasMode, setGuidedExtrasMode] = useState(false);

  // Post-session flow state
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ReturnType<typeof computeSummary> | null>(null);

  // Exercise rename modal
  const [renameTarget, setRenameTarget] = useState<{
    exerciseId: string;
    exerciseName: string;
  } | null>(null);

  const hideToast = useCallback(() => setToast(false), []);
  const increments = getIncrements(unit);

  guidedModeRef.current = guidedMode;

  const { backupFound, backupStartedAt, writeBackup, restoreBackup, discardBackup, clearBackup } =
    useSessionBackup(dayType, startedAtRef, guidedModeRef);

  // Auto-start guided mode if ?guided=true
  useEffect(() => {
    if (searchParams.get("guided") === "true") {
      setGuidedMode(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide navbar when in guided mode or reviewing after guided
  useEffect(() => {
    if (guidedMode || wasGuidedMode) {
      setNavVisible(false);
    } else {
      setNavVisible(true);
    }
    return () => setNavVisible(true);
  }, [guidedMode, wasGuidedMode, setNavVisible]);

  // Exit confirmation when session is in progress
  useEffect(() => {
    if (!guidedMode && !wasGuidedMode) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [guidedMode, wasGuidedMode]);

  useEffect(() => {
    if (!day) return;
    if (initializedForDayRef.current === dayType) return;
    initializedForDayRef.current = dayType;

    const warmupsEnabled = localStorage.getItem("gym-disable-warmups") !== "true";
    setExercises(
      day.exercises.map((ex) => ({
        exerciseId: ex.id,
        sets: [
          ...(warmupsEnabled
            ? [{ reps: ex.repRange[0].toString(), weight: "", rir: "", done: false, isWarmup: true }]
            : []),
          ...Array.from({ length: ex.sets }, () => ({
            reps: ex.repRange[0].toString(),
            weight: "",
            rir: "",
            done: false,
          })),
        ],
      }))
    );

    async function fetchOverloads() {
      const results: Record<string, OverloadResult> = {};
      const rawSets: Record<string, { reps: number; weight: number; rir: number | null }[]> = {};

      await Promise.all(
        day.exercises.map(async (ex) => {
          const res = await fetch(`/api/sets/${ex.id}`);
          const lastSetData = await res.json();
          rawSets[ex.id] = lastSetData;
          const result = checkOverload(ex, lastSetData);
          results[ex.id] = result;
        })
      );
      setOverloads(results);

      setExercises((prev) =>
        prev.map((exState) => {
          const ol = results[exState.exerciseId];
          const raw = rawSets[exState.exerciseId] || [];
          if (!ol || ol.lastWeight === 0) return exState;

          return {
            ...exState,
            sets: exState.sets.map((s, i) => {
              // i=0 is warmup; working sets start at i=1, mapped to raw[i-1]
              const rawIdx = Math.min(i - 1, raw.length - 1);
              const rawSet = rawIdx >= 0 ? raw[rawIdx] : null;

              let baseKg: number;
              if (ol.status === "go_up" || ol.status === "almost_ready") {
                // Use suggestedWeight so the prefilled value always matches the banner
                baseKg = ol.suggestedWeight;
              } else {
                baseKg = rawSet?.weight ?? ol.lastWeight;
              }

              if (s.isWarmup) {
                // Round warmup weight down to nearest 2.5 kg plate increment
                const warmupKg = Math.floor((baseKg * 0.5) / 2.5) * 2.5;
                return {
                  ...s,
                  weight: s.weight || kgToDisplay(warmupKg, unit).toString(),
                };
              }

              return {
                ...s,
                weight: s.weight || kgToDisplay(baseKg, unit).toString(),
                reps: s.reps || (rawSet?.reps?.toString() ?? ""),
                rir: s.rir || (rawSet?.rir?.toString() ?? ""),
              };
            }),
          };
        })
      );
    }
    fetchOverloads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, dayType]);

  if (!day) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">Unknown day type: {dayType}</p>
      </div>
    );
  }

  function updateSet(exIdx: number, setIdx: number, data: SetInput) {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets] };
      next[exIdx].sets[setIdx] = data;
      writeBackup(next);
      return next;
    });
  }

  function addSet(exIdx: number) {
    setExercises((prev) => {
      const next = [...prev];
      const lastSet = next[exIdx].sets[next[exIdx].sets.length - 1];
      next[exIdx] = {
        ...next[exIdx],
        sets: [
          ...next[exIdx].sets,
          { reps: "", weight: lastSet?.weight || "", rir: "", done: false },
        ],
      };
      return next;
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises((prev) => {
      const next = [...prev];
      if (next[exIdx].sets.length <= 1) return prev;
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.filter((_, i) => i !== setIdx),
      };
      return next;
    });
  }

  function markDone(exIdx: number) {
    const exercise = day.exercises[exIdx];
    setTimerSeconds(exercise.rest);
    setShowTimer(true);
  }

  function handleGuidedFinish() {
    const extrasDisabled = localStorage.getItem("gym-disable-extras") === "true";
    if (!extrasDisabled && selectedExtras.length > 0) {
      setGuidedExtrasMode(true);
      return;
    }
    setGuidedMode(false);
    setWasGuidedMode(true);
    setGuidedCompleted(true);
  }

  function handleExtrasFinish() {
    setGuidedExtrasMode(false);
    setGuidedMode(false);
    setWasGuidedMode(true);
    setGuidedCompleted(true);
  }

  function handleListView() {
    setGuidedMode(false);
    setWasGuidedMode(true);
  }

  function handleEndSessionAbandon() {
    clearBackup();
    setShowEndModal(false);
    setWasGuidedMode(false);
    router.replace("/");
  }

  async function handleEndSessionRecord() {
    setShowEndModal(false);
    await finish();
  }

  async function finish() {
    const allSets: {
      exerciseId: string;
      setNumber: number;
      reps: number;
      weight: number;
      rir?: number;
    }[] = [];

    for (const ex of exercises) {
      let setNum = 1;
      for (const s of ex.sets) {
        if (s.isWarmup) continue;
        const reps = parseInt(s.reps);
        const displayWeight = parseFloat(s.weight);
        if (isNaN(reps) || isNaN(displayWeight) || reps <= 0 || displayWeight <= 0) continue;
        const weight = displayToKg(displayWeight, unit);
        allSets.push({
          exerciseId: ex.exerciseId,
          setNumber: setNum++,
          reps,
          weight,
          rir: s.rir ? parseInt(s.rir) : undefined,
        });
      }
    }

    if (allSets.length === 0) return;

    setSaving(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        dayType,
        notes: notes.trim() || undefined,
        startedAt: startedAtRef.current,
        endedAt: new Date().toISOString(),
        sets: allSets,
      }),
    });

    if (res.ok) {
      const { id } = await res.json();
      clearBackup();
      const debriefDisabled = localStorage.getItem("gym-disable-debrief") === "true";
      if (debriefDisabled) {
        setSaving(false);
        router.replace("/");
        return;
      }
      setSavedSessionId(id);
      const exLookup: Record<string, string> = {};
      for (const ex of day.exercises) exLookup[ex.id] = ex.name;
      setSummaryData(
        computeSummary(exercises, overloads, exLookup, startedAtRef.current, unit, displayToKg)
      );
    }
    setSaving(false);
  }

  // Guided extras screen (after guided session, before review)
  if (guidedExtrasMode && guidedMode) {
    return (
      <ExtrasSession
        extras={selectedExtras}
        onFinish={handleExtrasFinish}
        onSkip={handleExtrasFinish}
      />
    );
  }

  // Post-session flow (extras → debrief)
  if (savedSessionId) {
    return <PostSessionFlow sessionId={savedSessionId} summaryData={summaryData} unit={unit} />;
  }

  return (
    <div className={`space-y-6 ${!guidedMode ? "pb-32" : ""}`}>
      {backupFound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm space-y-4">
            <div>
              <p className="text-base font-semibold">Oops, but no sweat!</p>
              {backupStartedAt && (
                <p className="text-muted text-xs mt-1">
                  Session from{" "}
                  {new Date(backupStartedAt).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <p className="text-muted text-sm mt-2">
                Your last session didn&apos;t finish. Pick up where you left off?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => restoreBackup(setExercises)}
                className="flex-1 h-11 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
              >
                Continue on
              </button>
              <button
                onClick={discardBackup}
                className="flex-1 h-11 border border-border text-muted rounded text-sm hover:border-accent hover:text-accent transition-colors"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message="Session saved!" visible={toast} onDone={hideToast} />

      {showTimer && timerSeconds > 0 && (
        <RestTimer
          seconds={timerSeconds}
          onDismiss={() => setShowTimer(false)}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          {!wasGuidedMode && !guidedMode && (
            <button
              onClick={() => router.back()}
              className="text-muted text-sm mb-2 hover:text-accent"
            >
              &larr; Back
            </button>
          )}
          <h1 className="text-lg font-medium">{day.label}</h1>
          {guidedMode && (
            <button
              onClick={handleListView}
              className="text-muted text-xs mt-1 hover:text-accent transition-colors"
            >
              Show List View
            </button>
          )}
        </div>
        {guidedMode && (
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:border-accent hover:text-accent transition-colors flex-shrink-0"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {guidedMode ? (
        <GuidedSession
          day={day}
          exercises={exercises}
          overloads={overloads}
          unit={unit}
          increments={increments}
          updateSet={updateSet}
          onFinish={handleGuidedFinish}
          onStop={() => setShowEndModal(true)}
        />
      ) : (
        <StandardModeView
          day={day}
          exercises={exercises}
          overloads={overloads}
          unit={unit}
          increments={increments}
          wasGuidedMode={wasGuidedMode}
          guidedCompleted={guidedCompleted}
          saving={saving}
          notes={notes}
          onNotesChange={setNotes}
          onContinueGuided={() => {
            setWasGuidedMode(false);
            setGuidedMode(true);
          }}
          onFinish={finish}
          onEndSession={() => setShowEndModal(true)}
          onUpdateSet={updateSet}
          onAddSet={addSet}
          onRemoveSet={removeSet}
          onMarkDone={markDone}
          onRenameExercise={(id, name) => setRenameTarget({ exerciseId: id, exerciseName: name })}
        />
      )}

      {showEndModal && (
        <EndSessionModal
          saving={saving}
          onAbandon={handleEndSessionAbandon}
          onRecord={handleEndSessionRecord}
          onCancel={() => setShowEndModal(false)}
        />
      )}

      {renameTarget && (
        <ExerciseRenameModal
          exerciseName={renameTarget.exerciseName}
          exerciseId={renameTarget.exerciseId}
          planSlug={planId}
          dayKey={dayType}
          onDone={() => {
            setRenameTarget(null);
            refreshPlans();
            window.location.reload();
          }}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
}
