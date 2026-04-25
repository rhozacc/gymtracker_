"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import type { BlendedDayDefinition, BlendedExercise } from "@/lib/blend";

interface InviteState {
  status: string;
  hostName: string;
  guestName: string | null;
  blendedDay: BlendedDayDefinition | null;
  hostConfirmed: boolean;
  guestConfirmed: boolean;
  shuffleSeed: number;
  isHost: boolean;
}

export default function BlendConfirmPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<InviteState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeedRef = useRef<number>(0);
  const [shuffleBump, setShuffleBump] = useState(0);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/blend/${token}`);
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const data = (await res.json()) as InviteState;
      // Bump animation key when seed changes (shuffle happened)
      if (data.shuffleSeed !== lastSeedRef.current) {
        lastSeedRef.current = data.shuffleSeed;
        setShuffleBump((b) => b + 1);
      }
      setState(data);
    } catch {
      setLoadError(true);
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Poll while waiting for confirmations / shuffle updates
  useEffect(() => {
    if (!state) return;
    if (state.status === "active" && state.hostConfirmed && state.guestConfirmed) {
      if (pollRef.current) clearInterval(pollRef.current);
      // Both confirmed → show explainer briefly, then jump into session
      setShowExplainer(true);
      return;
    }
    if (!pollRef.current) {
      pollRef.current = setInterval(fetchState, 2000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [state, fetchState]);

  async function handleShuffle() {
    if (shuffling) return;
    setShuffling(true);
    try {
      const res = await fetch(`/api/blend/${token}/shuffle`, { method: "POST" });
      if (res.ok) {
        await fetchState();
      }
    } finally {
      setShuffling(false);
    }
  }

  async function handleConfirm() {
    if (confirming || !state) return;
    const alreadyConfirmed = state.isHost ? state.hostConfirmed : state.guestConfirmed;
    if (alreadyConfirmed) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/blend/${token}/confirm`, { method: "POST" });
      if (res.ok) {
        await fetchState();
      }
    } finally {
      setConfirming(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <p className="text-text font-medium">Couldn&apos;t load blended plan</p>
        <button
          onClick={() => router.replace("/")}
          className="text-accent text-sm hover:opacity-75 transition-opacity"
        >
          Go home
        </button>
      </div>
    );
  }

  if (!state || !state.blendedDay) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted text-sm">Loading blended plan...</p>
      </div>
    );
  }

  // Explainer screen — shown briefly after both confirm, before session starts
  if (showExplainer) {
    return <PostHandshakeExplainer onDone={() => router.replace(`/blend/${token}/session`)} />;
  }

  const myConfirmed = state.isHost ? state.hostConfirmed : state.guestConfirmed;
  const partnerConfirmed = state.isHost ? state.guestConfirmed : state.hostConfirmed;
  const partnerName = state.isHost ? state.guestName : state.hostName;
  const exercises = state.blendedDay.exercises as BlendedExercise[];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => router.push("/")}
          className="text-muted hover:text-accent transition-colors"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight">Blended plan</h1>
      </div>

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full p-4 pb-32">
        {/* Label */}
        <div className="text-center space-y-1 mb-5">
          <p className="text-accent font-medium text-base">{state.blendedDay.label}</p>
          <p className="text-muted text-xs">
            {state.hostName} × {partnerName ?? "partner"} · {exercises.length} exercises
          </p>
        </div>

        {/* Exercise list — bumps when reshuffled */}
        <div
          key={shuffleBump}
          className="space-y-1 animate-blend-list"
          style={{ animation: "blend-list-in 500ms ease-out" }}
        >
          {exercises.map((ex, i) => {
            const isHero = ex.isHero || ex.owner === "shared";
            return (
            <div
              key={`${i}-${ex.id}`}
              className={`flex items-center justify-between py-2.5 px-3 rounded-md border ${
                isHero
                  ? "border-accent bg-accent/5"
                  : "border-border"
              }`}
              style={{
                animation: `blend-row-in 500ms ease-out ${i * 40}ms both`,
                ...(isHero
                  ? { boxShadow: "0 0 16px rgba(57,255,20,0.12)" }
                  : {}),
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {isHero && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-bg bg-accent rounded px-1.5 py-0.5 leading-none">
                      H2H
                    </span>
                  )}
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                </div>
                <p className="text-[10px] text-muted mt-0.5">
                  {ex.sets} × {ex.repRange[0]}-{ex.repRange[1]}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 ml-2">
                <span
                  className={`text-[10px] font-medium uppercase tracking-widest ${
                    isHero
                      ? "text-accent"
                      : ex.owner === "host"
                        ? "text-accent"
                        : "text-muted"
                  }`}
                >
                  {isHero ? "Both" : ex.ownerName}
                </span>
                {ex.newForPartner && !isHero && (
                  <span className="text-[9px] font-medium uppercase tracking-widest text-accent/70">
                    new to {ex.owner === "host" ? partnerName : state.hostName}
                  </span>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Confirmation status row */}
        <div className="mt-6 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                state.hostConfirmed ? "bg-accent" : "bg-border"
              }`}
              style={state.hostConfirmed ? { boxShadow: "0 0 8px var(--accent)" } : undefined}
            />
            <span className={state.hostConfirmed ? "text-text" : "text-muted"}>
              {state.hostName} {state.hostConfirmed ? "ready" : "pending"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={state.guestConfirmed ? "text-text" : "text-muted"}>
              {partnerName ?? "partner"} {state.guestConfirmed ? "ready" : "pending"}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                state.guestConfirmed ? "bg-accent" : "bg-border"
              }`}
              style={state.guestConfirmed ? { boxShadow: "0 0 8px var(--accent)" } : undefined}
            />
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-bg/95 backdrop-blur-sm p-4 flex gap-2 max-w-sm mx-auto">
        <button
          onClick={handleShuffle}
          disabled={shuffling || myConfirmed}
          className="h-12 px-4 border border-border text-muted rounded-lg text-sm hover:border-accent hover:text-accent transition-colors disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: shuffling ? "blend-spin 500ms linear infinite" : undefined }}
          >
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          <span>Shake</span>
        </button>

        <button
          onClick={handleConfirm}
          disabled={confirming || myConfirmed}
          className={`flex-1 h-12 font-bold rounded-lg text-sm transition-all ${
            myConfirmed
              ? "bg-accent/20 text-accent border border-accent"
              : "bg-accent text-bg hover:opacity-90"
          }`}
        >
          {myConfirmed
            ? partnerConfirmed
              ? "Starting..."
              : `Waiting for ${partnerName ?? "partner"}...`
            : "Lock it in"}
        </button>
      </div>

      <style>{`
        @keyframes blend-list-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes blend-row-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blend-spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Fullscreen 1-screen explainer shown once both users confirm.
 * Animates in with an accent bloom, then auto-advances to the session.
 */
function PostHandshakeExplainer({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStep(1), 200));
    timers.push(setTimeout(() => setStep(2), 1600));
    timers.push(setTimeout(() => setStep(3), 3000));
    timers.push(setTimeout(onDone, 4200));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-bg z-[400] flex flex-col items-center justify-center p-8 overflow-hidden">
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          width: "12px",
          height: "12px",
          backgroundColor: "var(--accent)",
          transform: "translate(-50%, -50%) scale(0)",
          animation: "handshake-bloom 1400ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}
      />

      <div className="relative z-10 max-w-sm w-full text-center space-y-6">
        <div
          className="transition-all duration-500"
          style={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <p className="text-4xl font-bold tracking-tight leading-tight">You&apos;re in.</p>
        </div>

        <div
          className="transition-all duration-500 space-y-3 text-muted text-sm"
          style={{
            opacity: step >= 2 ? 1 : 0,
            transform: step >= 2 ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <p>Same workout, your own weights.</p>
          <p>Each of you sees what the other&apos;s doing live — stay in sync or race ahead.</p>
        </div>

        <div
          className="transition-all duration-500"
          style={{
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? "scale(1)" : "scale(0.9)",
          }}
        >
          <p className="text-accent font-bold text-xl">Let&apos;s go.</p>
        </div>
      </div>

      <style>{`
        @keyframes handshake-bloom {
          0%   { transform: translate(-50%, -50%) scale(0);   opacity: 0.9; }
          60%  { transform: translate(-50%, -50%) scale(180); opacity: 0.25; }
          100% { transform: translate(-50%, -50%) scale(240); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
