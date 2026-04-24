"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProgram } from "@/lib/useProgram";
import { BLEND_ICONS, SEQUENCE_LENGTH, iconById } from "@/lib/blend-icons";

function getNextDayType(dayKeys: string[]): string {
  return dayKeys[0] ?? "";
}

type Phase = "intro" | "picker" | "submitting" | "waiting" | "matched" | "error";

export default function BlendPage() {
  const router = useRouter();
  const { plan } = useProgram();
  const dayKeys = Object.keys(plan.days);

  const [phase, setPhase] = useState<Phase>("intro");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [sequence, setSequence] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [tick, setTick] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Intro animation → picker
  useEffect(() => {
    const t = setTimeout(() => setPhase("picker"), 900);
    return () => clearTimeout(t);
  }, []);

  // Default day selection
  useEffect(() => {
    if (dayKeys.length > 0 && !selectedDay) setSelectedDay(getNextDayType(dayKeys));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKeys.length]);

  // Countdown ticker while waiting
  useEffect(() => {
    if (phase !== "waiting") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const handleIconTap = useCallback((iconId: string) => {
    setSequence((prev) => {
      if (prev.includes(iconId)) {
        return prev.filter((id) => id !== iconId);
      }
      if (prev.length >= SEQUENCE_LENGTH) return prev;
      return [...prev, iconId];
    });
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(8);
    }
  }, []);

  const submit = useCallback(async () => {
    if (sequence.length !== SEQUENCE_LENGTH || !selectedDay) return;
    const day = plan.days[selectedDay];
    if (!day) return;

    setPhase("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/blend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence, dayType: selectedDay, day }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error ?? "Failed to blend");
        setPhase("error");
        return;
      }
      const data = (await res.json()) as {
        action: "created" | "joined" | "resumed";
        token: string;
        expiresAt?: string;
      };
      setToken(data.token);
      if (data.expiresAt) setExpiresAt(new Date(data.expiresAt));

      if (data.action === "joined") {
        setPhase("matched");
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        setTimeout(() => router.push(`/blend/${data.token}/confirm`), 900);
      } else {
        setPhase("waiting");
      }
    } catch {
      setErrorMsg("Network error");
      setPhase("error");
    }
  }, [sequence, selectedDay, plan, router]);

  // Poll for partner match while waiting
  useEffect(() => {
    if (phase !== "waiting" || !token) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/blend/${token}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "previewing" || data.status === "active") {
          clearInterval(pollRef.current!);
          setPhase("matched");
          if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
          setTimeout(() => router.push(`/blend/${token}/confirm`), 900);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(pollRef.current!);
  }, [phase, token, router]);

  // Expire while waiting
  useEffect(() => {
    if (phase !== "waiting" || !expiresAt) return;
    if (Date.now() > expiresAt.getTime()) {
      setPhase("error");
      setErrorMsg("Handshake timed out — try again");
    }
  }, [phase, expiresAt, tick]);

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setSequence([]);
    setToken(null);
    setExpiresAt(null);
    setErrorMsg("");
    setPhase("picker");
  }

  const secondsLeft =
    phase === "waiting" && expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000))
      : 0;

  return (
    <div className="fixed inset-0 bg-bg overflow-hidden">
      {/* Intro dot expansion */}
      <div
        className="absolute z-30 rounded-full pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          width: "16px",
          height: "16px",
          backgroundColor: "var(--accent)",
          transform: "translate(-50%, -50%) scale(0)",
          animation: phase === "intro"
            ? "blend-dot-expand 900ms cubic-bezier(0.65, 0, 0.35, 1) forwards"
            : "none",
          opacity: phase === "intro" ? 1 : 0,
        }}
      />

      <div
        className="relative z-10 min-h-screen flex flex-col"
        style={{
          opacity: phase === "intro" ? 0 : 1,
          transform: phase === "intro" ? "scale(0.96)" : "scale(1)",
          transition: "opacity 400ms ease 200ms, transform 400ms ease 200ms",
        }}
      >
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => router.back()}
            className="text-muted hover:text-accent transition-colors"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold tracking-tight">Blend</h1>
        </div>

        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full p-4 pb-32 overflow-y-auto">
          {phase === "picker" && (
            <PickerUI
              plan={plan}
              dayKeys={dayKeys}
              selectedDay={selectedDay}
              onDayChange={setSelectedDay}
              sequence={sequence}
              onIconTap={handleIconTap}
            />
          )}

          {(phase === "submitting" || phase === "waiting") && (
            <WaitingUI
              sequence={sequence}
              submitting={phase === "submitting"}
              secondsLeft={secondsLeft}
              onCancel={reset}
            />
          )}

          {phase === "matched" && <MatchedUI sequence={sequence} />}

          {phase === "error" && <ErrorUI message={errorMsg} onRetry={reset} />}
        </div>

        {phase === "picker" && (
          <div className="fixed bottom-0 inset-x-0 border-t border-border bg-bg/95 backdrop-blur-sm p-4 max-w-sm mx-auto">
            <button
              onClick={submit}
              disabled={sequence.length !== SEQUENCE_LENGTH || !selectedDay}
              className="w-full h-12 bg-accent text-bg font-bold rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {sequence.length === SEQUENCE_LENGTH
                ? "Blend with your friend"
                : `Pick ${SEQUENCE_LENGTH - sequence.length} more`}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blend-dot-expand {
          0%   { transform: translate(-50%, -50%) scale(0);   opacity: 1; }
          60%  { transform: translate(-50%, -50%) scale(220); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(260); opacity: 0; }
        }
        @keyframes blend-slot-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes blend-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes blend-match-bloom {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function PickerUI({
  plan,
  dayKeys,
  selectedDay,
  onDayChange,
  sequence,
  onIconTap,
}: {
  plan: ReturnType<typeof useProgram>["plan"];
  dayKeys: string[];
  selectedDay: string;
  onDayChange: (d: string) => void;
  sequence: string[];
  onIconTap: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
          Your day
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {dayKeys.map((key) => {
            const day = plan.days[key];
            if (!day) return null;
            return (
              <button
                key={key}
                onClick={() => onDayChange(key)}
                className={`w-full text-left border rounded p-2.5 text-sm transition-colors ${
                  selectedDay === key
                    ? "border-accent bg-accent/5 text-text"
                    : "border-border text-muted hover:border-muted"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-2xl font-bold leading-tight">Tap 3 icons together.</p>
          <p className="text-muted text-sm">
            Agree with your friend on any 3 icons in the same order. Tap them both here.
          </p>
        </div>

        <div className="flex justify-center gap-3 py-3">
          {Array.from({ length: SEQUENCE_LENGTH }).map((_, i) => {
            const picked = sequence[i];
            const icon = picked ? iconById(picked) : null;
            return (
              <div
                key={i}
                className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-colors ${
                  picked
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-dashed border-border text-border"
                }`}
                style={
                  picked
                    ? {
                        animation: "blend-slot-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                        boxShadow: "0 0 20px rgba(57, 255, 20, 0.2)",
                      }
                    : undefined
                }
              >
                {icon ? (
                  <span style={{ transform: "scale(1.4)" }}>{icon.svg}</span>
                ) : (
                  <span className="text-2xl font-bold opacity-40">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {BLEND_ICONS.map((icon) => {
          const picked = sequence.includes(icon.id);
          const pickedIdx = sequence.indexOf(icon.id);
          return (
            <button
              key={icon.id}
              onClick={() => onIconTap(icon.id)}
              disabled={!picked && sequence.length >= SEQUENCE_LENGTH}
              className={`relative aspect-square rounded-lg border flex items-center justify-center transition-all ${
                picked
                  ? "border-accent bg-accent/10 text-accent scale-95"
                  : "border-border text-muted hover:border-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
              }`}
              aria-label={icon.label}
              style={picked ? { boxShadow: "0 0 16px rgba(57, 255, 20, 0.25)" } : undefined}
            >
              {icon.svg}
              {picked && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-bg text-[9px] font-bold flex items-center justify-center">
                  {pickedIdx + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WaitingUI({
  sequence,
  submitting,
  secondsLeft,
  onCancel,
}: {
  sequence: string[];
  submitting: boolean;
  secondsLeft: number;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 pt-10">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
        Your handshake
      </p>
      <div className="flex gap-3">
        {sequence.map((id, i) => {
          const icon = iconById(id);
          return (
            <div
              key={i}
              className="w-16 h-16 rounded-xl border-2 border-accent bg-accent/10 text-accent flex items-center justify-center"
              style={{ boxShadow: "0 0 20px rgba(57, 255, 20, 0.2)" }}
            >
              {icon?.svg}
            </div>
          );
        })}
      </div>

      <div className="text-center space-y-2">
        <p className="text-xl font-bold">
          {submitting ? "Sending..." : "Waiting for your friend"}
        </p>
        {!submitting && (
          <p className="text-muted text-sm">
            When they tap the same 3 icons, you&apos;re in.
          </p>
        )}
        {!submitting && secondsLeft > 0 && (
          <p className="text-[11px] text-muted">expires in {secondsLeft}s</p>
        )}
      </div>

      <div className="flex justify-center gap-1.5 pt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent"
            style={{ animation: `blend-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <button
        onClick={onCancel}
        className="text-muted text-sm hover:text-accent transition-colors mt-2"
      >
        Cancel
      </button>
    </div>
  );
}

function MatchedUI({ sequence }: { sequence: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 pt-10">
      <div className="flex gap-3">
        {sequence.map((id, i) => {
          const icon = iconById(id);
          return (
            <div
              key={i}
              className="w-20 h-20 rounded-xl border-2 border-accent bg-accent/20 text-accent flex items-center justify-center"
              style={{
                boxShadow: "0 0 40px rgba(57, 255, 20, 0.5)",
                animation: `blend-match-bloom 500ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms both`,
              }}
            >
              <span style={{ transform: "scale(1.4)" }}>{icon?.svg}</span>
            </div>
          );
        })}
      </div>
      <p className="text-accent font-bold text-2xl">Matched!</p>
      <p className="text-muted text-sm">Loading the blended plan...</p>
    </div>
  );
}

function ErrorUI({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
      <p className="text-text font-medium">{message || "Something went wrong"}</p>
      <button
        onClick={onRetry}
        className="h-11 px-6 border border-border text-muted rounded-lg text-sm hover:border-accent hover:text-accent transition-colors"
      >
        Try another handshake
      </button>
    </div>
  );
}
