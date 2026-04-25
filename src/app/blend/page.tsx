"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { useProgram } from "@/lib/useProgram";
import { BLEND_ICONS, SEQUENCE_LENGTH, iconById } from "@/lib/blend-icons";

type Phase =
  | "intro"
  | "day-pick"
  | "challenge"
  | "submitting"
  | "waiting"
  | "matched"
  | "error";

interface SessionSummary {
  dayType: string;
}

function nextDayType(lastDayType: string | undefined, dayKeys: string[]): string {
  if (!lastDayType || dayKeys.length === 0) return dayKeys[0] ?? "";
  const i = dayKeys.indexOf(lastDayType);
  if (i === -1) return dayKeys[0] ?? "";
  return dayKeys[(i + 1) % dayKeys.length];
}

export default function BlendPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { plan } = useProgram();
  const dayKeys = Object.keys(plan.days).sort((a, b) => {
    const numA = parseInt(plan.days[a].label.match(/Day (\d+)/)?.[1] ?? "0", 10);
    const numB = parseInt(plan.days[b].label.match(/Day (\d+)/)?.[1] ?? "0", 10);
    return numA - numB;
  });

  // Read the same "next day" logic as home — inherit the default
  const { data: sessions } = useSWR<SessionSummary[]>("/api/sessions", fetcher, {
    revalidateOnFocus: false,
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [daySeeded, setDaySeeded] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [tick, setTick] = useState(0);
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerDayLabel, setPartnerDayLabel] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Intro → day-pick
  useEffect(() => {
    const t = setTimeout(() => setPhase("day-pick"), 900);
    return () => clearTimeout(t);
  }, []);

  // Seed default day:
  // 1. ?day= param (from home button)
  // 2. Next day after last session (same logic as home)
  // 3. First day in plan
  useEffect(() => {
    if (daySeeded) return;
    if (dayKeys.length === 0) return;
    const fromQuery = searchParams.get("day");
    if (fromQuery && plan.days[fromQuery]) {
      setSelectedDay(fromQuery);
      setDaySeeded(true);
      return;
    }
    if (sessions) {
      const last = sessions[0]?.dayType;
      setSelectedDay(nextDayType(last, dayKeys));
      setDaySeeded(true);
    }
  }, [searchParams, sessions, dayKeys, plan, daySeeded]);

  // Waiting countdown ticker
  useEffect(() => {
    if (phase !== "waiting") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const handleIconTap = useCallback((iconId: string) => {
    setSequence((prev) => {
      if (prev.includes(iconId)) return prev.filter((id) => id !== iconId);
      if (prev.length >= SEQUENCE_LENGTH) return prev;
      return [...prev, iconId];
    });
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
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
        await loadPartnerInfo(data.token);
        setPhase("matched");
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      } else {
        setPhase("waiting");
      }
    } catch {
      setErrorMsg("Network error");
      setPhase("error");
    }
  }, [sequence, selectedDay, plan]);

  async function loadPartnerInfo(t: string) {
    try {
      const r = await fetch(`/api/blend/${t}`);
      if (!r.ok) return;
      const d = await r.json();
      const partner = d.isHost ? d.guestName : d.hostName;
      const partnerDay = d.isHost ? d.guestDay : d.hostDay;
      setPartnerName(partner ?? "");
      setPartnerDayLabel(partnerDay?.label ?? "");
    } catch { /* non-critical */ }
  }

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
          const partner = data.isHost ? data.guestName : data.hostName;
          const partnerDay = data.isHost ? data.guestDay : data.hostDay;
          setPartnerName(partner ?? "");
          setPartnerDayLabel(partnerDay?.label ?? "");
          setPhase("matched");
          if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(pollRef.current!);
  }, [phase, token]);

  // Advance from matched → confirm page after a moment
  useEffect(() => {
    if (phase !== "matched" || !token) return;
    const t = setTimeout(() => router.push(`/blend/${token}/confirm`), 2600);
    return () => clearTimeout(t);
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
    setPartnerName("");
    setPartnerDayLabel("");
    setPhase("day-pick");
  }

  const secondsLeft =
    phase === "waiting" && expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000))
      : 0;

  return (
    <div className="fixed inset-0 bg-bg overflow-hidden">
      {/* Intro accent dot */}
      <div
        className="absolute z-30 rounded-full pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          width: "16px",
          height: "16px",
          backgroundColor: "var(--accent)",
          transform: "translate(-50%, -50%) scale(0)",
          animation:
            phase === "intro"
              ? "blend-dot-expand 900ms cubic-bezier(0.65, 0, 0.35, 1) forwards"
              : "none",
          opacity: phase === "intro" ? 1 : 0,
        }}
      />

      {/* Each screen is its own viewport-bound layout — no scrolling needed */}
      <div
        className="relative z-10 h-full flex flex-col"
        style={{
          opacity: phase === "intro" ? 0 : 1,
          transform: phase === "intro" ? "scale(0.96)" : "scale(1)",
          transition: "opacity 400ms ease 200ms, transform 400ms ease 200ms",
        }}
      >
        {phase === "day-pick" && (
          <DayPickScreen
            plan={plan}
            dayKeys={dayKeys}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            onBack={() => router.back()}
            onContinue={() => setPhase("challenge")}
          />
        )}

        {phase === "challenge" && (
          <ChallengeScreen
            sequence={sequence}
            onIconTap={handleIconTap}
            onBack={() => setPhase("day-pick")}
            onSubmit={submit}
          />
        )}

        {(phase === "submitting" || phase === "waiting") && (
          <WaitingScreen
            sequence={sequence}
            submitting={phase === "submitting"}
            secondsLeft={secondsLeft}
            onCancel={reset}
          />
        )}

        {phase === "matched" && (
          <YoureOnScreen
            partnerName={partnerName}
            partnerDayLabel={partnerDayLabel}
            sequence={sequence}
          />
        )}

        {phase === "error" && <ErrorScreen message={errorMsg} onRetry={reset} />}
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
          100% { transform: scale(1);    opacity: 1; }
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
        @keyframes blend-title-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blend-partner-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(57,255,20,0.2); }
          50%      { box-shadow: 0 0 40px rgba(57,255,20,0.5); }
        }
      `}</style>
    </div>
  );
}

// ── Screen 1: pick your day ──────────────────────────────────────────────────

function DayPickScreen({
  plan,
  dayKeys,
  selectedDay,
  onDayChange,
  onBack,
  onContinue,
}: {
  plan: ReturnType<typeof useProgram>["plan"];
  dayKeys: string[];
  selectedDay: string;
  onDayChange: (d: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full p-4">
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onBack}
          className="text-muted hover:text-accent transition-colors"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight">Blend</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <div className="space-y-2">
          <p className="text-3xl font-bold tracking-tight leading-tight">
            Tag team<span className="text-accent">.</span>
          </p>
          <p className="text-muted text-sm leading-snug">
            Pair with a friend at the gym. Your plans merge into one shared
            session — same exercises, your own weights.
          </p>
        </div>

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
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onBack}
          className="h-12 px-5 border border-border text-muted rounded-lg text-sm hover:border-muted transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!selectedDay}
          className="flex-1 h-12 bg-accent text-bg font-bold rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          Blend Sessions Now
        </button>
      </div>
    </div>
  );
}

// ── Screen 2: tap 3 icons challenge ──────────────────────────────────────────

function ChallengeScreen({
  sequence,
  onIconTap,
  onBack,
  onSubmit,
}: {
  sequence: string[];
  onIconTap: (id: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col h-full max-w-sm mx-auto w-full p-4">
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onBack}
          className="text-muted hover:text-accent transition-colors"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight">The handshake</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 min-h-0">
        <div className="space-y-1 text-center">
          <p className="text-xl font-bold leading-tight">
            Tap 3 icons together.
          </p>
          <p className="text-muted text-xs leading-snug">
            Agree on any 3 with your friend — same order, same icons.
          </p>
        </div>

        {/* Slots */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: SEQUENCE_LENGTH }).map((_, i) => {
            const picked = sequence[i];
            const icon = picked ? iconById(picked) : null;
            return (
              <div
                key={i}
                className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-colors ${
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
                  <span style={{ transform: "scale(1.2)" }}>{icon.svg}</span>
                ) : (
                  <span className="text-xl font-bold opacity-40">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-1.5">
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

      <div className="pt-2">
        <button
          onClick={onSubmit}
          disabled={sequence.length !== SEQUENCE_LENGTH}
          className="w-full h-12 bg-accent text-bg font-bold rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
        >
          {sequence.length === SEQUENCE_LENGTH
            ? "Blend with your friend"
            : `Pick ${SEQUENCE_LENGTH - sequence.length} more`}
        </button>
      </div>
    </div>
  );
}

// ── Screen 3: waiting for partner ────────────────────────────────────────────

function WaitingScreen({
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
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 text-center">
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

      <div className="space-y-1">
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

      <div className="flex justify-center gap-1.5">
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
        className="text-muted text-sm hover:text-accent transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Screen 4: You're on! ─────────────────────────────────────────────────────

function YoureOnScreen({
  partnerName,
  partnerDayLabel,
  sequence,
}: {
  partnerName: string;
  partnerDayLabel: string;
  sequence: string[];
}) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full p-6 overflow-hidden">
      {/* Accent bloom backdrop */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          width: "12px",
          height: "12px",
          backgroundColor: "var(--accent)",
          transform: "translate(-50%, -50%) scale(0)",
          animation: "blend-dot-expand 1200ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
          opacity: 0.2,
        }}
      />

      <div className="relative z-10 text-center space-y-6 max-w-sm">
        <p
          className="text-5xl font-bold tracking-tight"
          style={{ animation: "blend-title-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both" }}
        >
          You&apos;re on.
        </p>

        {/* Matched icons */}
        <div
          className="flex justify-center gap-3"
          style={{ animation: "blend-title-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 400ms both" }}
        >
          {sequence.map((id, i) => {
            const icon = iconById(id);
            return (
              <div
                key={i}
                className="w-14 h-14 rounded-xl border-2 border-accent bg-accent/15 text-accent flex items-center justify-center"
                style={{
                  boxShadow: "0 0 24px rgba(57,255,20,0.4)",
                  animation: `blend-match-bloom 500ms cubic-bezier(0.22, 1, 0.36, 1) ${500 + i * 80}ms both`,
                }}
              >
                {icon?.svg}
              </div>
            );
          })}
        </div>

        {/* Partner info */}
        <div
          className="border border-accent/40 rounded-xl p-4 bg-surface/50 space-y-1"
          style={{
            animation: "blend-title-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) 800ms both, blend-partner-glow 2.4s ease-in-out 1400ms infinite",
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
            Paired with
          </p>
          <p className="text-2xl font-bold">{partnerName || "your partner"}</p>
          {partnerDayLabel && (
            <p className="text-accent text-sm font-medium">{partnerDayLabel}</p>
          )}
        </div>

        <p
          className="text-muted text-xs"
          style={{ animation: "blend-title-rise 500ms ease 1400ms both" }}
        >
          Prepping the blended plan...
        </p>
      </div>
    </div>
  );
}

// ── Error ────────────────────────────────────────────────────────────────────

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
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
