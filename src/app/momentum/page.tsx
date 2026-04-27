"use client";

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { useProgram } from "@/lib/useProgram";
import {
  computeMomentumScore,
  type MomentumResult,
  type GroupVolume,
} from "@/lib/momentum";

interface ChartSession {
  id: string;
  date: string;
  dayType: string;
  sets: {
    exerciseId: string;
    reps: number;
    weight: number;
    rir: number | null;
  }[];
  debrief: { energy: number; pump: number; mood: number } | null;
}

const ZONE_THRESHOLDS = [0.4, 0.7] as const;
const ZONE_LABELS = ["Atrophy", "Maintenance", "Hypertrophy"] as const;
const ZONE_CENTERS = [0.2, 0.55, 0.85];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-3">
      {children}
    </p>
  );
}

function Triangle({ position }: { position: number }) {
  const clamped = Math.max(0, Math.min(1, position));
  return (
    <svg
      className="absolute top-0"
      style={{ left: `${clamped * 100}%`, transform: "translateX(-50%)" }}
      width="6"
      height="5"
      viewBox="0 0 6 5"
      aria-hidden="true"
    >
      <polygon points="3,0 6,5 0,5" fill="var(--color-muted)" />
    </svg>
  );
}

function StateBar({
  label,
  value,
  readout,
}: {
  label: string;
  value: number;
  readout: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted">
          {label}
        </span>
        <span className="text-[10px] text-muted">{readout}</span>
      </div>
      <div
        className="relative h-1 rounded-full"
        style={{ backgroundColor: "var(--color-border)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "var(--color-accent)" }}
        />
      </div>
      <div className="relative h-1.5 mt-1">
        {ZONE_THRESHOLDS.map((t) => (
          <Triangle key={t} position={t} />
        ))}
      </div>
    </div>
  );
}

function GroupBar({ group }: { group: GroupVolume }) {
  // Bar scaled so MAV sits at ~83% — leaves 17% headroom for over-MAV volume.
  const max = group.mav * 1.2;
  const fill = Math.min(group.weeklySets, max) / max;
  const mevPos = group.mev / max;
  const mavPos = group.mav / max;
  const underMev = group.weeklySets < group.mev;
  const fillColor = underMev
    ? "var(--color-muted)"
    : "var(--color-accent)";

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <span className="text-sm font-medium">{group.group}</span>
        <span className="text-[10px] text-muted tabular-nums">
          {group.weeklySets.toFixed(1)} sets/wk · MEV {group.mev} · MAV{" "}
          {group.mav}
        </span>
      </div>
      <div
        className="relative h-1 rounded-full"
        style={{ backgroundColor: "var(--color-border)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${fill * 100}%`, backgroundColor: fillColor }}
        />
      </div>
      <div className="relative h-1.5 mt-1">
        <Triangle position={mevPos} />
        <Triangle position={mavPos} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center border border-border rounded-lg px-2 py-3">
      <span className="text-2xl font-bold tabular-nums leading-none">
        {value}
      </span>
      {suffix && (
        <span className="text-[9px] text-muted mt-0.5">{suffix}</span>
      )}
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted mt-1.5 text-center">
        {label}
      </span>
    </div>
  );
}

function formatDelta(delta: number): string {
  const pct = delta * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function BackHeader() {
  return (
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
      <h1 className="text-lg font-medium">Momentum</h1>
    </div>
  );
}

export default function MomentumPage() {
  const { plan } = useProgram();

  const { data: chartData } = useSWR<ChartSession[]>(
    "/api/charts/data",
    fetcher
  );
  const { data: contributions } = useSWR<
    Record<string, { group: string; weight: number }[]>
  >("/api/muscle-contributions", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3_600_000,
  });

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const day of Object.values(plan.days)) {
      for (const ex of day.exercises) {
        if (!map[ex.id]) map[ex.id] = ex.name;
      }
    }
    return map;
  }, [plan]);

  const result: MomentumResult | null = useMemo(() => {
    if (!chartData) return null;
    return computeMomentumScore(chartData, {
      contributions: contributions ?? {},
      exerciseName: (id) => nameById[id],
    });
  }, [chartData, contributions, nameById]);

  if (!result) {
    return (
      <div className="space-y-6">
        <BackHeader />
        <div className="border border-border rounded-lg p-4 h-40 animate-pulse" />
        <div className="border border-border rounded-lg p-4 h-56 animate-pulse" />
      </div>
    );
  }

  const sortedGroups = [...result.groupVolumes].sort(
    (a, b) => a.score - b.score
  );

  return (
    <div className="space-y-8">
      <BackHeader />

      {/* ── Headline mirror ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-1">
            Tier
          </p>
          <h2 className="text-3xl font-bold text-accent leading-none">
            {result.tier.label}
          </h2>
          <p className="text-sm text-muted mt-1">{result.tier.subtitle}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="space-y-4">
            <StateBar
              label="Volume"
              value={result.volume}
              readout={result.volumeReadout}
            />
            <StateBar
              label="Lifts"
              value={result.progression}
              readout={result.progressionReadout}
            />
          </div>
          <div className="relative h-3 mt-3">
            {ZONE_LABELS.map((zone, i) => (
              <span
                key={zone}
                className="absolute top-0 text-[9px] uppercase tracking-wider text-muted"
                style={{
                  left: `${ZONE_CENTERS[i] * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {zone}
              </span>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-3 space-y-1">
            <p className="text-xs text-text">{result.limiter}</p>
            <p className="text-[10px] text-muted">
              Last 4 weeks · {result.sessionCount}{" "}
              {result.sessionCount === 1 ? "session" : "sessions"}.
            </p>
          </div>
        </div>
      </section>

      {/* ── Volume detail ───────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Volume detail</SectionLabel>
        <div className="border border-border rounded-lg p-4 space-y-5">
          {sortedGroups.map((g) => (
            <GroupBar key={g.group} group={g} />
          ))}
        </div>
        <p className="text-[10px] text-muted mt-2">
          Weighted weekly sets per group. Triangles mark MEV (minimum to
          grow) and MAV (target). Sorted lowest first.
        </p>
      </section>

      {/* ── Lifts detail ────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Lifts detail</SectionLabel>
        {result.exerciseDeltas.length === 0 ? (
          <div className="border border-border rounded-lg p-4">
            <p className="text-xs text-muted">
              No lifts repeated across the last 14 days vs the prior 14.
              Train the same lifts week to week so progression can be
              tracked.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            {result.exerciseDeltas.map((d) => {
              const name = nameById[d.id] ?? d.id;
              const positive = d.deltaPct >= 0.005;
              const negative = d.deltaPct <= -0.005;
              const color = positive
                ? "text-accent"
                : negative
                ? "text-red-400"
                : "text-muted";
              return (
                <Link
                  key={d.id}
                  href={`/stats/${d.id}`}
                  className="flex items-center justify-between py-2.5 px-4 border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
                >
                  <span className="text-sm">{name}</span>
                  <span
                    className={`text-sm tabular-nums font-medium ${color}`}
                  >
                    {formatDelta(d.deltaPct)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-muted mt-2">
          Best E1RM in last 14 days vs prior 14, sorted lowest first. Tap a
          row for stats.
        </p>
      </section>

      {/* ── Recovery ────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Recovery</SectionLabel>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Energy"
              value={result.recovery.avgEnergy?.toFixed(1) ?? "—"}
              suffix="of 10"
            />
            <Stat
              label="Mood"
              value={result.recovery.avgMood?.toFixed(1) ?? "—"}
              suffix="of 10"
            />
            <Stat
              label="Back-to-back"
              value={String(result.recovery.consecutivePairs)}
              suffix={
                result.recovery.consecutivePairs === 1 ? "day pair" : "day pairs"
              }
            />
          </div>
          <p className="text-[10px] text-muted">
            {result.recovery.debriefCount === 0
              ? "No debriefs in the last 4 weeks — answering the post-session debrief feeds this."
              : `Avg of last ${result.recovery.debriefCount} debrief${
                  result.recovery.debriefCount === 1 ? "" : "s"
                }. Back-to-back days dock sustainability up to 15%, which can drop your tier one rung.`}
          </p>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>How it works</SectionLabel>
        <div className="border border-border rounded-lg p-4 space-y-2 text-xs text-muted leading-relaxed">
          <p>
            <span className="text-text font-medium">MEV / MAV</span> are the
            minimum effective volume and the target weekly sets per muscle.
            Below MEV you're maintaining at best; reaching MAV is the
            hypertrophy sweet spot.
          </p>
          <p>
            <span className="text-text font-medium">Volume</span> averages
            your 5 muscle groups against MEV / MAV.{" "}
            <span className="text-text font-medium">Lifts</span> compares
            best E1RM in the last 14 days vs the prior 14 across exercises
            you've repeated.
          </p>
          <p>
            <span className="text-text font-medium">Tier</span> is the
            Volume × Lifts quadrant. Recovery (energy, mood, consecutive
            days) can knock the tier down a rung when it's the weakest
            signal.
          </p>
        </div>
      </section>
    </div>
  );
}
