"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";

interface PerExerciseStats {
  sets: number;
  totalReps: number;
  volumeKg: number;
  topWeightKg: number;
}

interface SummaryRow {
  id: string;
  name: string;
  host: PerExerciseStats;
  guest: PerExerciseStats;
}

interface SummaryData {
  hostName: string;
  guestName: string | null;
  isHost: boolean;
  hostFinished: boolean;
  guestFinished: boolean;
  blendedDayLabel: string;
  exercises: SummaryRow[];
  totals: {
    host: { sets: number; totalReps: number; volumeKg: number; durationMin: number | null };
    guest: { sets: number; totalReps: number; volumeKg: number; durationMin: number | null };
  };
}

export default function BlendSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { unit } = useUnit();

  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/blend/${token}/summary`);
        if (!res.ok) {
          setError("Couldn't load summary");
          return;
        }
        const json = (await res.json()) as SummaryData;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Network error");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  // Poll until partner finishes
  useEffect(() => {
    if (!data) return;
    if (data.hostFinished && data.guestFinished) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/blend/${token}/summary`);
        if (!res.ok) return;
        const json = (await res.json()) as SummaryData;
        setData(json);
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(pollRef.current!);
  }, [data, token]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
        <p className="text-text font-medium">{error}</p>
        <button
          onClick={() => router.replace("/")}
          className="text-accent text-sm hover:opacity-75 transition-opacity"
        >
          Go home
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted text-sm">Crunching the numbers...</p>
      </div>
    );
  }

  const myName = data.isHost ? data.hostName : data.guestName ?? "You";
  const partnerName = data.isHost ? data.guestName : data.hostName;
  const myTotals = data.isHost ? data.totals.host : data.totals.guest;
  const partnerTotals = data.isHost ? data.totals.guest : data.totals.host;
  const partnerFinished = data.isHost ? data.guestFinished : data.hostFinished;

  const myVolDisplay = Math.round(kgToDisplay(myTotals.volumeKg, unit));
  const partnerVolDisplay = Math.round(kgToDisplay(partnerTotals.volumeKg, unit));
  const volumeDelta = myVolDisplay - partnerVolDisplay;

  const winnerLine = !partnerFinished
    ? `${partnerName ?? "Your partner"} is still going...`
    : volumeDelta > 0
    ? `You out-lifted ${partnerName} by ${volumeDelta.toLocaleString()} ${unit}.`
    : volumeDelta < 0
    ? `${partnerName} out-lifted you by ${Math.abs(volumeDelta).toLocaleString()} ${unit}.`
    : `Dead even — ${myVolDisplay.toLocaleString()} ${unit} each.`;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <h1 className="text-xl font-bold tracking-tight">Blended done</h1>
      </div>

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full p-4 pb-24 space-y-6">
        {/* Hero */}
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
            {data.blendedDayLabel}
          </p>
          <p className="text-2xl font-bold leading-tight">{winnerLine}</p>
        </div>

        {/* Totals strip */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label={`${myName} ${unit}`} value={myVolDisplay.toLocaleString()} highlight />
          <Stat
            label={`${partnerName ?? "Partner"} ${unit}`}
            value={partnerFinished ? partnerVolDisplay.toLocaleString() : "—"}
          />
          <Stat
            label="Δ"
            value={
              partnerFinished
                ? volumeDelta === 0
                  ? "0"
                  : `${volumeDelta > 0 ? "+" : ""}${volumeDelta.toLocaleString()}`
                : "—"
            }
          />
        </div>

        {/* Sets / time row */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Your sets" value={myTotals.sets.toString()} />
          <Stat
            label="Their sets"
            value={partnerFinished ? partnerTotals.sets.toString() : "—"}
          />
          <Stat
            label="Time"
            value={myTotals.durationMin != null ? `${myTotals.durationMin}m` : "—"}
          />
        </div>

        {/* Per-exercise comparison */}
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
            By exercise
          </p>
          <div className="space-y-2">
            {data.exercises.map((row) => (
              <ExerciseRow
                key={row.id}
                row={row}
                myStats={data.isHost ? row.host : row.guest}
                partnerStats={data.isHost ? row.guest : row.host}
                partnerFinished={partnerFinished}
                unit={unit}
              />
            ))}
          </div>
        </div>

        {!partnerFinished && (
          <div className="border border-border rounded-lg p-3 text-center">
            <p className="text-[11px] text-muted">
              We&apos;ll update the comparison once {partnerName ?? "your partner"} wraps up.
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-bg/95 backdrop-blur-sm p-4 max-w-sm mx-auto">
        <button
          onClick={() => router.replace("/")}
          className="w-full h-12 bg-accent text-bg font-bold rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center border rounded-lg px-2 py-3 ${
        highlight ? "border-accent bg-accent/5" : "border-border"
      }`}
    >
      <span className={`text-xl font-bold tabular-nums ${highlight ? "text-accent" : ""}`}>
        {value}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-widest text-muted mt-0.5 text-center truncate max-w-full">
        {label}
      </span>
    </div>
  );
}

function ExerciseRow({
  row,
  myStats,
  partnerStats,
  partnerFinished,
  unit,
}: {
  row: SummaryRow;
  myStats: PerExerciseStats;
  partnerStats: PerExerciseStats;
  partnerFinished: boolean;
  unit: "kg" | "lbs";
}) {
  const myVol = Math.round(kgToDisplay(myStats.volumeKg, unit));
  const partnerVol = partnerFinished ? Math.round(kgToDisplay(partnerStats.volumeKg, unit)) : 0;
  const max = Math.max(myVol, partnerVol, 1);
  const myPct = (myVol / max) * 100;
  const partnerPct = (partnerVol / max) * 100;

  return (
    <div className="border border-border rounded p-2.5 space-y-1.5">
      <p className="text-sm font-medium truncate">{row.name}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-accent font-medium w-10 flex-shrink-0">You</span>
          <div className="flex-1 h-2 rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${myPct}%` }}
            />
          </div>
          <span className="text-muted tabular-nums w-16 text-right text-[11px]">
            {myVol.toLocaleString()} {unit}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-text/70 font-medium w-10 flex-shrink-0">Them</span>
          <div className="flex-1 h-2 rounded-full bg-border/40 overflow-hidden">
            <div
              className="h-full bg-text/50 transition-[width] duration-500"
              style={{ width: `${partnerPct}%` }}
            />
          </div>
          <span className="text-muted tabular-nums w-16 text-right text-[11px]">
            {partnerFinished ? `${partnerVol.toLocaleString()} ${unit}` : "—"}
          </span>
        </div>
      </div>
      {(myStats.sets > 0 || partnerStats.sets > 0) && (
        <div className="flex justify-between text-[10px] text-muted/80 pt-0.5">
          <span>
            {myStats.sets} sets · top {Math.round(kgToDisplay(myStats.topWeightKg, unit))} {unit}
          </span>
          {partnerFinished && (
            <span>
              {partnerStats.sets} sets · top {Math.round(kgToDisplay(partnerStats.topWeightKg, unit))} {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
