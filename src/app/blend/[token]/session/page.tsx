"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { checkOverload, OverloadResult } from "@/lib/overload";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay, displayToKg, getIncrements } from "@/lib/units";
import { GuidedSession } from "@/components/GuidedSession";
import { EndSessionModal } from "@/components/EndSessionModal";
import type { SetInput } from "@/components/SetRow";
import type { BlendedDayDefinition, BlendedExercise } from "@/lib/blend";
import type { ExerciseAlternative } from "@/lib/program";
import { savePendingSession } from "@/lib/pendingSessions";
import { useNavVisibility } from "@/lib/useNavVisibility";

interface ExerciseState {
  exerciseId: string;
  sets: SetInput[];
}

interface PartnerProgress {
  exerciseIndex: number;
  setIndex: number;
}


export default function BlendSessionPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { unit } = useUnit();
  const increments = getIncrements(unit);
  const { setNavVisible } = useNavVisibility();

  const [blendedDay, setBlendedDay] = useState<BlendedDayDefinition | null>(null);
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [overloads, setOverloads] = useState<Record<string, OverloadResult>>({});
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [guidedPosition, setGuidedPosition] = useState({ exerciseIndex: 0, setIndex: 0 });
  const [sessionKey] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [partnerProgress, setPartnerProgress] = useState<PartnerProgress | null>(null);
  const [partnerName, setPartnerName] = useState<string>("");

  const startedAtRef = useRef(new Date().toISOString());
  const guidedPositionRef = useRef({ exerciseIndex: 0, setIndex: 0 });
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setNavVisible(false);
    return () => setNavVisible(true);
  }, [setNavVisible]);

  // Load invite + initialize session
  useEffect(() => {
    if (!token) return;
    async function load() {
      const res = await fetch(`/api/blend/${token}`);
      const data = await res.json();

      if (!data.blendedDay) {
        setLoadState("error");
        return;
      }

      const day = data.blendedDay as BlendedDayDefinition;
      setBlendedDay(day);
      setPartnerName(data.isHost ? data.guestName ?? "" : data.hostName ?? "");

      const warmupsEnabled = localStorage.getItem("gym-disable-warmups") !== "true";

      // Initialize exercise states
      const initExercises: ExerciseState[] = day.exercises.map((ex) => ({
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
      }));

      // Fetch overloads for all exercises
      const results: Record<string, OverloadResult> = {};
      const rawSets: Record<string, { reps: number; weight: number; rir: number | null }[]> = {};

      await Promise.all(
        day.exercises.map(async (ex) => {
          try {
            const r = await fetch(`/api/sets/${ex.id}`);
            const lastSetData = await r.json();
            rawSets[ex.id] = lastSetData;
            results[ex.id] = checkOverload(ex, lastSetData);
          } catch { /* non-critical */ }
        })
      );

      setOverloads(results);

      // Pre-fill weights from overload data
      const filled = initExercises.map((exState) => {
        const ol = results[exState.exerciseId];
        const raw = rawSets[exState.exerciseId] ?? [];
        if (!ol || ol.lastWeight === 0) return exState;
        const warmupCount = exState.sets.filter((s) => s.isWarmup).length;
        return {
          ...exState,
          sets: exState.sets.map((s, i) => {
            const workingIdx = i - warmupCount;
            const rawSet = s.isWarmup ? null : raw[Math.min(workingIdx, raw.length - 1)] ?? null;
            if (s.isWarmup) {
              const warmupKg = Math.floor((ol.lastWeight * 0.5) / 2.5) * 2.5;
              return { ...s, weight: kgToDisplay(warmupKg, unit).toString() };
            }
            const baseKg =
              ol.status === "go_up" || ol.status === "almost_ready"
                ? ol.suggestedWeight
                : rawSet?.weight ?? ol.lastWeight;
            return {
              ...s,
              weight: kgToDisplay(baseKg, unit).toString(),
              reps: s.reps || (rawSet?.reps?.toString() ?? ""),
              rir: s.rir || (rawSet?.rir?.toString() ?? ""),
            };
          }),
        };
      });

      setExercises(filled);
      setLoadState("ready");
    }
    load().catch(() => setLoadState("error"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Stream partner progress over SSE (auto-reconnects; pauses when backgrounded)
  useEffect(() => {
    if (loadState !== "ready") return;

    const connect = () => {
      if (eventSourceRef.current || document.hidden) return;
      const es = new EventSource(`/api/blend/${token}/progress/stream`);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.partner) setPartnerProgress(data.partner as PartnerProgress);
          if (data.partnerName) setPartnerName(data.partnerName);
        } catch { /* ignore malformed frame */ }
      };
      // Server closes the stream when the blend is no longer active.
      es.addEventListener("done", () => {
        es.close();
        if (eventSourceRef.current === es) eventSourceRef.current = null;
      });
      // On error EventSource auto-reconnects; nothing to do here.
    };

    const disconnect = () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };

    const onVisibility = () => {
      if (document.hidden) disconnect();
      else connect();
    };

    connect();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      disconnect();
    };
  }, [loadState, token]);

  const postProgress = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      fetch(`/api/blend/${token}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseIndex, setIndex }),
      }).catch(() => {});
    },
    [token]
  );

  function updateSet(exIdx: number, setIdx: number, data: SetInput) {
    setExercises((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], sets: [...next[exIdx].sets] };
      next[exIdx].sets[setIdx] = data;
      return next;
    });
  }

  function addSet(exIdx: number) {
    setExercises((prev) => {
      const next = [...prev];
      const last = next[exIdx].sets[next[exIdx].sets.length - 1];
      next[exIdx] = {
        ...next[exIdx],
        sets: [...next[exIdx].sets, { reps: "", weight: last?.weight ?? "", rir: "", done: false }],
      };
      return next;
    });
  }

  async function handleSwitchAlternative(exIdx: number, alt: ExerciseAlternative) {
    let altOverload: OverloadResult | null = null;
    try {
      const res = await fetch(`/api/sets/${alt.id}`);
      const rawSets = await res.json();
      if (blendedDay) altOverload = checkOverload(blendedDay.exercises[exIdx], rawSets);
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

    if (altOverload) setOverloads((prev) => ({ ...prev, [alt.id]: altOverload! }));
  }

  async function finish() {
    if (!blendedDay) return;
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
        const reps = parseInt(s.reps);
        const displayWeight = parseFloat(s.weight);
        if (s.isWarmup) {
          if (!isNaN(reps) && !isNaN(displayWeight) && reps > 0 && displayWeight > 0) {
            allSets.push({ exerciseId: ex.exerciseId, setNumber: 0, reps, weight: displayToKg(displayWeight, unit), isWarmup: true });
          }
          continue;
        }
        if (isNaN(reps) || isNaN(displayWeight) || reps <= 0 || displayWeight <= 0) continue;
        allSets.push({ exerciseId: ex.exerciseId, setNumber: setNum++, reps, weight: displayToKg(displayWeight, unit), rir: s.rir ? parseInt(s.rir) : undefined });
      }
    }

    if (allSets.length === 0) {
      router.replace("/");
      return;
    }

    const payload = {
      date: new Date().toISOString(),
      dayType: "blended",
      startedAt: startedAtRef.current,
      endedAt: new Date().toISOString(),
      sets: allSets,
    };

    setSaving(true);
    let savedSessionId: string | null = null;
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        savedSessionId = data?.id ?? null;
      } else {
        savePendingSession(payload);
      }
    } catch {
      savePendingSession(payload);
    }
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setSaving(false);

    // Tell the blend invite which session belongs to this user, then route
    // to the comparison summary
    if (savedSessionId) {
      try {
        await fetch(`/api/blend/${token}/finish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: savedSessionId }),
        });
      } catch { /* non-critical */ }
      router.replace(`/blend/${token}/summary`);
    } else {
      // Save failed (offline) — go home, regular pending-session sync will pick it up
      router.replace("/");
    }
  }

  if (loadState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted text-sm">Blending sessions...</p>
      </div>
    );
  }

  if (loadState === "error" || !blendedDay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <p className="text-text font-medium">Couldn&apos;t load blended session</p>
        <button onClick={() => router.replace("/")} className="text-accent text-sm">Go home</button>
      </div>
    );
  }

  // Live side-by-side comparison data
  const total = blendedDay.exercises.length;
  const myPos = guidedPosition;
  const myExercise = blendedDay.exercises[myPos.exerciseIndex];
  const partnerExercise =
    partnerProgress != null && blendedDay
      ? blendedDay.exercises[partnerProgress.exerciseIndex]
      : null;

  const setsTotalFor = (idx: number | undefined) =>
    idx != null
      ? exercises[idx]?.sets.filter((s) => !s.isWarmup).length ??
        blendedDay.exercises[idx]?.sets ??
        0
      : 0;

  const mySetsTotal = setsTotalFor(myPos.exerciseIndex);
  const partnerSetsTotal = setsTotalFor(partnerProgress?.exerciseIndex);

  // Position percentage for the progress bars (by exercise index)
  const myPct = total > 0 ? (myPos.exerciseIndex / total) * 100 : 0;
  const partnerPct =
    partnerProgress != null && total > 0
      ? (partnerProgress.exerciseIndex / total) * 100
      : 0;
  const iAmAhead =
    partnerProgress != null && myPos.exerciseIndex > partnerProgress.exerciseIndex;
  const partnerAhead =
    partnerProgress != null && partnerProgress.exerciseIndex > myPos.exerciseIndex;

  return (
    <div className="space-y-4 pb-4">
      {/* Side-by-side live progress */}
      {partnerName && (
        <div className="px-4 pt-4">
          <div className="border border-border rounded-lg p-3 bg-surface space-y-2.5">
            {/* You row */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="text-accent font-medium">You</span>
                  {iAmAhead && (
                    <span className="text-[9px] uppercase tracking-widest text-accent/70">
                      ahead
                    </span>
                  )}
                </span>
                <span className="text-muted truncate max-w-[55%]">
                  {myExercise
                    ? `${myExercise.name} · ${myPos.setIndex + 1}/${mySetsTotal}`
                    : "—"}
                </span>
              </div>
              <div className="h-1 rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width] duration-300"
                  style={{ width: `${myPct}%` }}
                />
              </div>
            </div>

            {/* Partner row */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="text-muted font-medium">{partnerName}</span>
                  {partnerAhead && (
                    <span className="text-[9px] uppercase tracking-widest text-text/60">
                      ahead
                    </span>
                  )}
                </span>
                <span className="text-muted truncate max-w-[55%]">
                  {partnerExercise
                    ? `${partnerExercise.name} · ${(partnerProgress?.setIndex ?? 0) + 1}/${partnerSetsTotal}`
                    : "warming up"}
                </span>
              </div>
              <div className="h-1 rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full bg-text/50 transition-[width] duration-300"
                  style={{ width: `${partnerPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Session label row */}
      <div className="flex items-center gap-2 px-4">
        <button
          onClick={() => router.push("/")}
          className="text-muted hover:text-accent transition-colors py-1 pr-1 shrink-0"
          aria-label="Home"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-medium truncate">{blendedDay.label}</h1>
        </div>
      </div>

      <GuidedSession
        key={sessionKey}
        day={blendedDay}
        exercises={exercises}
        overloads={overloads}
        unit={unit}
        increments={increments}
        initialPosition={guidedPosition}
        initialRestEndsAt={null}
        initialRestDuration={0}
        updateSet={updateSet}
        onAddSet={addSet}
        onFinish={finish}
        onStop={() => setShowEndModal(true)}
        onPositionChange={(ei, si) => {
          guidedPositionRef.current = { exerciseIndex: ei, setIndex: si };
          setGuidedPosition({ exerciseIndex: ei, setIndex: si });
          postProgress(ei, si);
        }}
        onSwitchAlternative={handleSwitchAlternative}
        onRestStart={() => {}}
      />

      {showEndModal && (
        <EndSessionModal
          saving={saving}
          onAbandon={() => {
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
            router.replace("/");
          }}
          onRecord={async () => {
            setShowEndModal(false);
            await finish();
          }}
          onCancel={() => setShowEndModal(false)}
        />
      )}
    </div>
  );
}
