"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { checkOverload, OverloadResult } from "@/lib/overload";
import { useProgram } from "@/lib/useProgram";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay, displayToKg, getIncrements, type WeightUnit } from "@/lib/units";
import { SetRow, SetInput } from "@/components/SetRow";
import { OverloadBanner } from "@/components/OverloadBanner";
import { RestTimer } from "@/components/RestTimer";
import { GuidedSession } from "@/components/GuidedSession";
import { ExtrasSession } from "@/components/ExtrasSession";
import { Debrief } from "@/components/Debrief";
import { PostSessionExtras } from "@/components/PostSessionExtras";
import { PostWorkoutSummary, computeSummary } from "@/components/PostWorkoutSummary";
import { Toast } from "@/components/Toast";
import { EndSessionModal } from "@/components/EndSessionModal";
import { ExerciseRenameModal } from "@/components/ExerciseRenameModal";
import { useExtras } from "@/lib/useExtras";
import { useBeep } from "@/lib/useBeep";
import { useBackgroundNotification } from "@/lib/useBackgroundNotification";
import { useNavVisibility } from "@/lib/useNavVisibility";

const BACKUP_KEY = "gym-guided-backup";

interface BackupData {
  dayType: string;
  startedAt: string;
  exercises: { exerciseId: string; sets: SetInput[] }[];
}

interface ExerciseState {
  exerciseId: string;
  sets: SetInput[];
}

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

  // Guided extras state (during workout, before review)
  const { selectedExtras } = useExtras();
  const [guidedExtrasMode, setGuidedExtrasMode] = useState(false);

  // Post-session flow: extras → summary + debrief
  const [extrasMode, setExtrasMode] = useState(false);
  const [debriefMode, setDebriefMode] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  // Backup recovery banner
  const [backupFound, setBackupFound] = useState(false);

  // Post-workout summary
  const [summaryData, setSummaryData] = useState<ReturnType<typeof computeSummary> | null>(null);

  // Exercise rename modal
  const [renameTarget, setRenameTarget] = useState<{
    exerciseId: string;
    exerciseName: string;
  } | null>(null);

  const hideToast = useCallback(() => setToast(false), []);
  const increments = getIncrements(unit);

  // Auto-start guided mode if ?guided=true
  useEffect(() => {
    if (searchParams.get("guided") === "true") {
      setGuidedMode(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for a backup from a crashed session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return;
      const backup: BackupData = JSON.parse(raw);
      if (backup.dayType === dayType) {
        setBackupFound(true);
      }
    } catch {
      // Ignore corrupt backup
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function restoreBackup() {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return;
      const backup: BackupData = JSON.parse(raw);
      if (backup.dayType === dayType && backup.exercises) {
        startedAtRef.current = backup.startedAt;
        setExercises(backup.exercises);
        setBackupFound(false);
      }
    } catch {
      setBackupFound(false);
    }
  }

  function discardBackup() {
    localStorage.removeItem(BACKUP_KEY);
    setBackupFound(false);
  }

  // Write exercises to localStorage whenever they change in guided mode
  // We do this via a ref so we can call it from updateSet without stale closures
  const guidedModeRef = useRef(false);
  guidedModeRef.current = guidedMode;

  function writeBackup(updatedExercises: ExerciseState[]) {
    if (!guidedModeRef.current) return;
    try {
      const backup: BackupData = {
        dayType,
        startedAt: startedAtRef.current,
        exercises: updatedExercises,
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    } catch {
      // Storage may be full — not critical
    }
  }

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

    // Initialize exercise state with default rep range minimum
    setExercises(
      day.exercises.map((ex) => ({
        exerciseId: ex.id,
        sets: Array.from({ length: ex.sets }, () => ({
          reps: ex.repRange[0].toString(),
          weight: "",
          rir: "",
          done: false,
        })),
      }))
    );

    // Fetch overload data and pre-fill weights from last session
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

      // Per-set weight prefill: if overload is ready use suggested weight for all sets;
      // otherwise use the per-set weight recorded in the previous session.
      setExercises((prev) =>
        prev.map((exState) => {
          const ol = results[exState.exerciseId];
          const raw = rawSets[exState.exerciseId] || [];
          if (!ol || ol.lastWeight === 0) return exState;

          return {
            ...exState,
            sets: exState.sets.map((s, i) => {
              let prefillKg: number;
              if (ol.status === "go_up") {
                // Increment uniformly across all sets
                prefillKg = ol.suggestedWeight;
              } else {
                // Use the per-set weight from last session (fall back to max weight)
                const lastSetWeight = raw[Math.min(i, raw.length - 1)]?.weight;
                prefillKg = lastSetWeight ?? ol.lastWeight;
              }
              const prefillWeight = kgToDisplay(prefillKg, unit).toString();
              return {
                ...s,
                weight: s.weight || prefillWeight,
                reps: s.reps || (raw[i]?.reps?.toString() ?? ""),
                rir: s.rir || (raw[i]?.rir?.toString() ?? ""),
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
      // Persist backup on every change during guided mode
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

  // Called when guided session finishes — show review screen instead of saving immediately
  function handleGuidedFinish() {
    // If extras are selected, run them before dropping to review
    if (selectedExtras.length > 0) {
      setGuidedExtrasMode(true);
      return;
    }
    setGuidedMode(false);
    setWasGuidedMode(true);
    setGuidedCompleted(true);
    // Backup stays until the user confirms save
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
    localStorage.removeItem(BACKUP_KEY);
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
      setSavedSessionId(id);
      // Clear crash-recovery backup after successful save
      localStorage.removeItem(BACKUP_KEY);
      // Compute summary before showing debrief
      const exLookup: Record<string, string> = {};
      for (const ex of day.exercises) exLookup[ex.id] = ex.name;
      setSummaryData(
        computeSummary(exercises, overloads, exLookup, startedAtRef.current, unit, displayToKg)
      );
      setExtrasMode(true);
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

  // Post-session extras screen (abs, cardio, stretching)
  if (extrasMode && savedSessionId) {
    return (
      <div className="py-4">
        <PostSessionExtras
          sessionId={savedSessionId}
          onDone={() => {
            setExtrasMode(false);
            setDebriefMode(true);
          }}
        />
      </div>
    );
  }

  // Debrief screen with post-workout summary
  if (debriefMode && savedSessionId) {
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
            sessionId={savedSessionId}
            onDone={() => router.push("/")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${!guidedMode ? "pb-32" : ""}`}>
      <Toast message="Session saved!" visible={toast} onDone={hideToast} />

      {/* Standard mode rest timer */}
      {showTimer && timerSeconds > 0 && (
        <RestTimer
          seconds={timerSeconds}
          onDismiss={() => setShowTimer(false)}
        />
      )}

      {/* Crash-recovery banner */}
      {backupFound && !guidedMode && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-400">Previous session recovered</p>
            <p className="text-xs text-muted mt-0.5">
              Looks like a session didn&apos;t finish saving. Restore your data?
            </p>
          </div>
          <div className="flex gap-2 shrink-0 mt-0.5">
            <button
              onClick={restoreBackup}
              className="text-xs px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
            >
              Restore
            </button>
            <button
              onClick={discardBackup}
              className="text-xs px-3 py-1.5 border border-border text-muted rounded hover:text-accent transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

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
        <>
          {/* Continue Guided Session — sticky top, only when not yet completed */}
          {wasGuidedMode && !guidedCompleted && (
            <div className="sticky top-0 z-40">
              <button
                onClick={() => {
                  setWasGuidedMode(false);
                  setGuidedMode(true);
                }}
                className="w-full h-14 bg-accent text-bg font-medium rounded-lg text-base hover:opacity-90 transition-opacity"
              >
                Continue Guided Session
              </button>
            </div>
          )}

          {/* Review / standard edit view */}
          {day.exercises.map((ex, exIdx) => {
            const ol = overloads[ex.id];
            const exState = exercises[exIdx];
            if (!exState) return null;

            return (
              <div key={ex.id} className="border border-border rounded p-3">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-medium">{ex.name}</h2>
                    <button
                      onClick={() =>
                        setRenameTarget({
                          exerciseId: ex.id,
                          exerciseName: ex.name,
                        })
                      }
                      className="text-muted hover:text-accent transition-colors p-0.5"
                      aria-label="Rename exercise"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                  <span className="text-muted text-xs">
                    {ex.sets} &times; {ex.repRange[0]}–{ex.repRange[1]}
                    <span className="ml-1 text-muted/50">{ex.rest}s rest</span>
                  </span>
                </div>

                {ol?.lastWeight > 0 && (
                  <div className="text-muted text-xs mb-2">
                    Last: {kgToDisplay(ol.lastWeight, unit)} {unit} &times; [{ol.lastReps.join(", ")}]
                  </div>
                )}

                {(ol?.status === "go_up" || ol?.status === "almost_ready") && (
                  <OverloadBanner suggestedWeight={kgToDisplay(ol.suggestedWeight, unit)} unit={unit} variant={ol.status} />
                )}

                <div className="space-y-2 mb-2">
                  <div className="flex items-center gap-1.5 text-muted text-[10px]">
                    <span className="w-8 shrink-0" />
                    <span className="w-full text-center">{unit.toUpperCase()}</span>
                    <span className="w-full text-center">REPS</span>
                    <span className="w-full text-center">RIR</span>
                    <span className="w-6 shrink-0" />
                  </div>
                  {exState.sets.map((s, sIdx) => (
                    <SetRow
                      key={sIdx}
                      index={sIdx}
                      data={s}
                      onChange={(d) => updateSet(exIdx, sIdx, d)}
                      onRemove={
                        exState.sets.length > 1
                          ? () => removeSet(exIdx, sIdx)
                          : undefined
                      }
                      onDone={() => markDone(exIdx)}
                      increments={increments}
                      unitLabel={unit}
                      showIncrements={false}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(exIdx)}
                  className="text-muted text-xs hover:text-accent"
                >
                  + Add set
                </button>
              </div>
            );
          })}

          <div>
            <textarea
              placeholder="Session notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-20 bg-surface border border-border text-text text-sm rounded p-3 resize-none focus:border-accent focus:outline-none"
            />
          </div>

          {guidedCompleted ? (
            <button
              onClick={finish}
              disabled={saving}
              className="w-full h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving..." : "Record Session"}
            </button>
          ) : wasGuidedMode ? (
            <button
              onClick={() => setShowEndModal(true)}
              className="w-full h-12 border border-red-400 text-red-400 font-medium rounded text-sm hover:bg-red-400/10 transition-colors"
            >
              End Session
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="w-full h-12 bg-accent text-bg font-medium rounded text-sm hover:bg-white disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Finish Session"}
            </button>
          )}
        </>
      )}


      {/* End session confirmation modal */}
      {showEndModal && (
        <EndSessionModal
          saving={saving}
          onAbandon={handleEndSessionAbandon}
          onRecord={handleEndSessionRecord}
          onCancel={() => setShowEndModal(false)}
        />
      )}

      {/* Exercise rename modal */}
      {renameTarget && (
        <ExerciseRenameModal
          exerciseName={renameTarget.exerciseName}
          exerciseId={renameTarget.exerciseId}
          planSlug={planId}
          dayKey={dayType}
          onDone={() => {
            setRenameTarget(null);
            refreshPlans();
            // Force page reload to pick up renamed exercise
            window.location.reload();
          }}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
}
