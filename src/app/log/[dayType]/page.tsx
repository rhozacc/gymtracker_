"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { checkOverload, OverloadResult } from "@/lib/overload";
import type { ExerciseAlternative } from "@/lib/program";
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
import type { ExtraOption } from "@/lib/extras";
import { suggestExtra, recordExtrasHistory } from "@/lib/extras-suggest";
import { useBackgroundNotification } from "@/lib/useBackgroundNotification";
import { useNavVisibility } from "@/lib/useNavVisibility";
import { useTheme } from "@/lib/useTheme";
import { getJson, setJson } from "@/lib/storage";
import { useSessionBackup } from "./hooks/useSessionBackup";
import { savePendingSession } from "@/lib/pendingSessions";
import { incrementSessionCount, shouldShowSupportPrompt, recordSupportPromptShown } from "@/lib/support-prompt";
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

  // Session flow — one value instead of four booleans:
  //   idle      → standard list, no active session
  //   guided    → guided card-by-card session in progress
  //   extras    → post-guided extras screen (before review)
  //   list-view → user switched from guided to full list mid-session
  //   reviewing → guided done, reviewing sets before saving
  type SessionMode = "idle" | "guided" | "extras" | "list-view" | "reviewing";
  const [sessionMode, setSessionMode] = useState<SessionMode>("idle");

  // Shared rest timer — persists when switching to list-view mid-rest
  const [sharedRestEndsAt, setSharedRestEndsAt] = useState<number | null>(null);
  const [sharedRestDuration, setSharedRestDuration] = useState(0);
  const [listViewRestRemaining, setListViewRestRemaining] = useState(0);

  useEffect(() => {
    if (sessionMode !== "list-view" || !sharedRestEndsAt) {
      setListViewRestRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((sharedRestEndsAt - Date.now()) / 1000));
      setListViewRestRemaining(remaining);
      if (remaining === 0) setSharedRestEndsAt(null);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [sessionMode, sharedRestEndsAt]);
  const [showEndModal, setShowEndModal] = useState(false);
  // Persists the guided session position across list-view switches and backup restores
  const [guidedPosition, setGuidedPosition] = useState({ exerciseIndex: 0, setIndex: 0 });
  const guidedPositionRef = useRef({ exerciseIndex: 0, setIndex: 0 });
  // Incrementing this key force-remounts GuidedSession so initialPosition takes effect
  const [sessionKey, setSessionKey] = useState(0);
  const { requestPermission } = useBackgroundNotification();
  const { setNavVisible } = useNavVisibility();
  const { theme, toggleTheme } = useTheme();

  const [extrasSuggestion, setExtrasSuggestion] = useState<ExtraOption | null>(null);

  // Track extra sets added during guided session
  const guidedExtraSets = useRef<string[]>([]); // exercise names
  const [showPlanUpdatePrompt, setShowPlanUpdatePrompt] = useState(false);

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

  // Backup is written for any active session (guided or list-view), so mid-session
  // edits in list mode survive a crash / navigation. Idle mode still skips backup.
  guidedModeRef.current = sessionMode !== "idle";

  const { backupFound, writeBackup, patchPositionInBackup, restoreBackup, clearBackup } =
    useSessionBackup(dayType, startedAtRef, guidedModeRef);

  // Auto-start guided mode if ?guided=true
  useEffect(() => {
    if (searchParams.get("guided") === "true") {
      setSessionMode("guided");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-restore unfinished session silently — no modal. User can end via End Session flow.
  useEffect(() => {
    if (!backupFound) return;
    const pos = restoreBackup(setExercises);
    const resolved = pos ?? { exerciseIndex: 0, setIndex: 0 };
    guidedPositionRef.current = resolved;
    setGuidedPosition(resolved);
    setSessionKey((k) => k + 1);
    setSessionMode("guided");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backupFound]);

  // Hide navbar during any active session
  useEffect(() => {
    if (sessionMode !== "idle") {
      setNavVisible(false);
    } else {
      setNavVisible(true);
    }
    return () => setNavVisible(true);
  }, [sessionMode, setNavVisible]);

  // Exit confirmation when session is in progress
  useEffect(() => {
    if (sessionMode === "idle") return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionMode]);

  useEffect(() => {
    if (!day) return;
    if (initializedForDayRef.current === dayType) return;
    initializedForDayRef.current = dayType;

    const warmupsEnabled = localStorage.getItem("gym-disable-warmups") !== "true";
    const warmupPrefsMap: Record<string, boolean> = warmupsEnabled
      ? getJson("gym-warmup-prefs", {} as Record<string, boolean>)
      : {};
    setExercises(
      day.exercises.map((ex) => {
        const exWarmupOn = warmupsEnabled && warmupPrefsMap[ex.id] !== false;
        return {
          exerciseId: ex.id,
          sets: [
            ...(exWarmupOn
              ? [{ reps: ex.repRange[0].toString(), weight: "", rir: "", done: false, isWarmup: true }]
              : []),
            ...Array.from({ length: ex.sets }, () => ({
              reps: ex.repRange[0].toString(),
              weight: "",
              rir: "",
              done: false,
            })),
          ],
        };
      })
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

          const warmupCount = exState.sets.filter((s) => s.isWarmup).length;
          return {
            ...exState,
            sets: exState.sets.map((s, i) => {
              const workingIdx = i - warmupCount;
              const rawIdx = s.isWarmup ? -1 : Math.min(workingIdx, raw.length - 1);
              const rawSet = rawIdx >= 0 ? raw[rawIdx] : null;

              if (s.isWarmup) {
                // Warmup always uses last actual weight — never the suggested progression weight.
                // rawIdx is -1 for warmup (i=0) so rawSet is always null here; use lastWeight.
                const warmupKg = Math.floor((ol.lastWeight * 0.5) / 2.5) * 2.5;
                return {
                  ...s,
                  weight: s.weight || kgToDisplay(warmupKg, unit).toString(),
                };
              }

              // Working sets: use suggested weight when overload target is set
              let baseKg: number;
              if (ol.status === "go_up" || ol.status === "almost_ready") {
                // Use suggestedWeight so the prefilled value always matches the banner
                baseKg = ol.suggestedWeight;
              } else {
                baseKg = rawSet?.weight ?? ol.lastWeight;
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

  async function handleSwitchAlternative(exIdx: number, alt: ExerciseAlternative) {
    // Fetch history for the alternative so we can pre-fill weight
    let altOverload: OverloadResult | null = null;
    try {
      const res = await fetch(`/api/sets/${alt.id}`);
      const rawSets = await res.json();
      altOverload = checkOverload(day.exercises[exIdx], rawSets);
    } catch { /* non-critical */ }

    setExercises((prev) => {
      const next = [...prev];
      const baseKg = altOverload?.lastWeight ?? 0;
      next[exIdx] = {
        ...next[exIdx],
        exerciseId: alt.id,
        sets: next[exIdx].sets.map((s) => {
          if (s.isWarmup) {
            const warmupKg = baseKg > 0 ? Math.floor((baseKg * 0.5) / 2.5) * 2.5 : 0;
            return { ...s, weight: warmupKg > 0 ? kgToDisplay(warmupKg, unit).toString() : "", done: false };
          }
          return { ...s, weight: baseKg > 0 ? kgToDisplay(baseKg, unit).toString() : "", done: false };
        }),
      };
      return next;
    });

    if (altOverload) {
      setOverloads((prev) => ({ ...prev, [alt.id]: altOverload! }));
    }

    // Remember this alternative for future sessions (fork icon)
    const origId = day.exercises[exIdx].id;
    const stored = getJson<Record<string, ExerciseAlternative[]>>("gym-alt-history", {});
    if (!stored[origId]) stored[origId] = [];
    if (!stored[origId].some((a) => a.id === alt.id)) {
      stored[origId].push(alt);
    }
    setJson("gym-alt-history", stored);
  }

  function updateSet(exIdx: number, setIdx: number, data: SetInput) {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets] };
      next[exIdx].sets[setIdx] = data;
      writeBackup(next, guidedPositionRef.current);
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

  function addSetGuided(exIdx: number) {
    const exName = day.exercises[exIdx]?.name;
    if (exName) guidedExtraSets.current.push(exName);
    addSet(exIdx);
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

  function continueAfterGuidedFinish() {
    const extrasDisabled = localStorage.getItem("gym-disable-extras") === "true";
    if (!extrasDisabled) {
      const sessionMins =
        (Date.now() - new Date(startedAtRef.current).getTime()) / 60000;
      const suggestion = suggestExtra(dayType, sessionMins);
      recordExtrasHistory(suggestion.id, suggestion.category, dayType);
      setExtrasSuggestion(suggestion);
      setSessionMode("extras");
      return;
    }
    setSessionMode("reviewing");
  }

  function handleGuidedFinish() {
    if (guidedExtraSets.current.length > 0) {
      setShowPlanUpdatePrompt(true);
      return;
    }
    continueAfterGuidedFinish();
  }

  function handleExtrasFinish(completed: boolean) {
    // Only log to DB if user actually did the extra (not skipped)
    if (completed && extrasSuggestion) {
      fetch("/api/extras/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: extrasSuggestion.id,
          category: extrasSuggestion.category,
          dayType,
        }),
      }).catch(() => {/* non-critical */});
    }
    setSessionMode("reviewing");
  }

  function handleListView() {
    setSessionMode("list-view");
  }

  function handleEndSessionAbandon() {
    clearBackup();
    setShowEndModal(false);
    setSessionMode("idle");
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
      isWarmup?: boolean;
    }[] = [];

    for (const ex of exercises) {
      let setNum = 1;
      for (const s of ex.sets) {
        if (s.isWarmup) {
          const reps = parseInt(s.reps);
          const displayWeight = parseFloat(s.weight);
          if (!isNaN(reps) && !isNaN(displayWeight) && reps > 0 && displayWeight > 0) {
            allSets.push({
              exerciseId: ex.exerciseId,
              setNumber: 0,
              reps,
              weight: displayToKg(displayWeight, unit),
              isWarmup: true,
            });
          }
          continue;
        }
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
          isWarmup: false,
        });
      }
    }

    if (allSets.length === 0) return;

    const sessionPayload = {
      date: new Date().toISOString(),
      dayType,
      notes: notes.trim() || undefined,
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
      sets: allSets,
    };

    setSaving(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionPayload),
      });

      if (res.ok) {
        const { id } = await res.json();
        clearBackup();
        incrementSessionCount();
        if (shouldShowSupportPrompt()) {
          recordSupportPromptShown();
          localStorage.setItem("gym-support-pending", "1");
        }
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
      } else {
        // DB error — persist locally, sync when recovered
        savePendingSession(sessionPayload);
        clearBackup();
        setSaving(false);
        router.replace("/");
        return;
      }
    } catch {
      // Network error — persist locally, sync when recovered
      savePendingSession(sessionPayload);
      clearBackup();
      setSaving(false);
      router.replace("/");
      return;
    }

    setSaving(false);
  }

  // Guided extras screen (after guided session, before review)
  if (sessionMode === "extras") {
    return (
      <ExtrasSession
        extras={extrasSuggestion ? [extrasSuggestion] : []}
        onFinish={() => handleExtrasFinish(true)}
        onSkip={() => handleExtrasFinish(false)}
      />
    );
  }

  // Post-session flow (extras → debrief)
  if (savedSessionId) {
    return <PostSessionFlow sessionId={savedSessionId} summaryData={summaryData} unit={unit} />;
  }

  return (
    <div className={`space-y-6 ${sessionMode === "idle" ? "pb-32" : ""}`}>
      <Toast message="Session saved!" visible={toast} onDone={hideToast} />

      {showTimer && timerSeconds > 0 && (
        <RestTimer
          seconds={timerSeconds}
          onDismiss={() => setShowTimer(false)}
        />
      )}

      <div className="flex items-start gap-2">
        <button
          onClick={() => (sessionMode === "idle" ? router.back() : router.push("/"))}
          className="text-muted hover:text-accent transition-colors py-1 pr-1 shrink-0"
          aria-label={sessionMode === "idle" ? "Back" : "Home (session stays in progress)"}
          title={sessionMode === "idle" ? "Back" : "Home — session stays in progress"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium">{day.label}</h1>
          {sessionMode === "guided" && (
            <button
              onClick={handleListView}
              className="text-muted text-xs mt-1 hover:text-accent transition-colors"
            >
              Show List View
            </button>
          )}
          {sessionMode === "list-view" && (
            <button
              onClick={() => setSessionMode("guided")}
              className="text-muted text-xs mt-1 hover:text-accent transition-colors"
            >
              Show Guided View
            </button>
          )}
        </div>
        {sessionMode === "guided" && (
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

      {sessionMode === "guided" ? (
        <GuidedSession
          key={sessionKey}
          day={day}
          exercises={exercises}
          overloads={overloads}
          unit={unit}
          increments={increments}
          initialPosition={guidedPosition}
          initialRestEndsAt={sharedRestEndsAt}
          initialRestDuration={sharedRestDuration}
          updateSet={updateSet}
          onAddSet={addSetGuided}
          onFinish={handleGuidedFinish}
          onStop={() => setShowEndModal(true)}
          onPositionChange={(ei, si) => {
              guidedPositionRef.current = { exerciseIndex: ei, setIndex: si };
              setGuidedPosition({ exerciseIndex: ei, setIndex: si });
              patchPositionInBackup({ exerciseIndex: ei, setIndex: si });
            }}
          onSwitchAlternative={handleSwitchAlternative}
          onRestStart={(endsAt, duration) => {
            setSharedRestEndsAt(endsAt);
            setSharedRestDuration(duration);
          }}
        />
      ) : (
        <StandardModeView
          day={day}
          exercises={exercises}
          overloads={overloads}
          unit={unit}
          increments={increments}
          wasGuidedMode={sessionMode === "list-view" || sessionMode === "reviewing"}
          guidedCompleted={sessionMode === "reviewing"}
          restRemaining={listViewRestRemaining}
          saving={saving}
          notes={notes}
          onNotesChange={setNotes}
          onContinueGuided={() => setSessionMode("guided")}
          onJumpToExercise={(exIdx) => {
            const sets = exercises[exIdx]?.sets ?? [];
            // Prefer first undone working set; fall back to any undone, then first set.
            // Skipping warmup here prevents jumping *back* to warmup after the user is
            // clearly past it — if they wanted warmup they'd have started from scratch.
            const firstUndoneWorking = sets.findIndex((s) => !s.done && !s.isWarmup);
            const firstWorking = sets.findIndex((s) => !s.isWarmup);
            const setIdx =
              firstUndoneWorking >= 0
                ? firstUndoneWorking
                : firstWorking >= 0
                  ? firstWorking
                  : 0;
            const pos = { exerciseIndex: exIdx, setIndex: setIdx };
            guidedPositionRef.current = pos;
            setGuidedPosition(pos);
            setSessionKey((k) => k + 1);
            setSessionMode("guided");
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

      {showPlanUpdatePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm space-y-4">
            <div>
              <p className="text-base font-semibold">Extra sets logged</p>
              <p className="text-muted text-sm mt-2">
                You added sets for{" "}
                {Array.from(new Set(guidedExtraSets.current)).join(", ")}.
                Want to update your plan to match?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPlanUpdatePrompt(false);
                  router.push("/plan");
                }}
                className="flex-1 h-11 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 transition-opacity"
              >
                Update plan
              </button>
              <button
                onClick={() => {
                  setShowPlanUpdatePrompt(false);
                  continueAfterGuidedFinish();
                }}
                className="flex-1 h-11 border border-border text-muted rounded text-sm hover:border-accent hover:text-accent transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
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
