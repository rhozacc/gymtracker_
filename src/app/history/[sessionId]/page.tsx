"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/swr";
import { getExerciseById, getDayLabel, getDayDefinition } from "@/lib/program";
import { useUnit } from "@/lib/useUnit";
import { kgToDisplay } from "@/lib/units";
import { formatDate, calculateVolume, formatDuration } from "@/lib/utils";

interface SetDetail {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  rir: number | null;
}

interface ExtraDetail {
  id: string;
  label: string;
  minutes: number;
}

interface SessionDetail {
  id: string;
  date: string;
  dayType: string;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  extras: ExtraDetail[] | null;
  sets: SetDetail[];
  debrief: { energy: number; pump: number; mood: number } | null;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { unit } = useUnit();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: session, isLoading } = useSWR<SessionDetail>(
    `/api/sessions/${params.sessionId}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-surface rounded animate-pulse" />
        <div className="h-40 bg-surface rounded animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <p className="text-muted text-center py-8">Session not found.</p>;
  }

  // Group sets by exercise
  const grouped = new Map<string, SetDetail[]>();
  for (const set of session.sets) {
    const existing = grouped.get(set.exerciseId) || [];
    existing.push(set);
    grouped.set(set.exerciseId, existing);
  }

  const totalVolume = calculateVolume(session.sets);
  const dayDef = getDayDefinition(session.dayType);
  const duration =
    session.startedAt && session.endedAt
      ? formatDuration(session.startedAt, session.endedAt)
      : null;

  // Order exercises by the program definition order
  const orderedExercises = dayDef
    ? dayDef.exercises
        .map((ex) => ({ id: ex.id, sets: grouped.get(ex.id) }))
        .filter((e) => e.sets && e.sets.length > 0)
    : Array.from(grouped.entries()).map(([id, sets]) => ({ id, sets }));

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={() => router.back()}
          className="text-muted text-sm mb-2 hover:text-accent"
        >
          &larr; Back
        </button>
        <div className="flex justify-between items-baseline">
          <h1 className="text-lg font-medium">
            {getDayLabel(session.dayType)}
          </h1>
          <span className="text-muted text-xs">
            {formatDate(session.date)}
          </span>
        </div>
        <div className="text-muted text-xs mt-1">
          {session.sets.length} sets &middot;{" "}
          {Math.round(kgToDisplay(totalVolume, unit)).toLocaleString()} {unit} total volume
          {duration && <span className="ml-2">&middot; {duration}</span>}
        </div>
      </div>

      {orderedExercises.map(({ id, sets }) => {
        const ex = getExerciseById(id);
        const exSets = sets!;
        const exVolume = calculateVolume(exSets);
        const topOfRange = ex?.repRange[1] || 0;
        const allHitTop =
          ex && exSets.every((s) => s.reps >= topOfRange);

        return (
          <div key={id} className="border border-border rounded p-3">
            <div className="flex justify-between items-baseline mb-2">
              <h2 className="text-sm font-medium">
                {ex?.name || id}
              </h2>
              <div className="flex items-center gap-2">
                {allHitTop && (
                  <span className="text-green-400 text-[10px]">
                    OVERLOAD MET
                  </span>
                )}
                <span className="text-muted text-xs">
                  {Math.round(kgToDisplay(exVolume, unit))} {unit}
                </span>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs">
                  <th className="text-left font-normal w-10">Set</th>
                  <th className="text-right font-normal">Weight</th>
                  <th className="text-right font-normal">Reps</th>
                  <th className="text-right font-normal">RIR</th>
                </tr>
              </thead>
              <tbody>
                {exSets.map((s) => (
                  <tr key={s.id} className="border-t border-border/50">
                    <td className="py-1 text-muted">{s.setNumber}</td>
                    <td className="py-1 text-right">
                      {kgToDisplay(s.weight, unit)} {unit}
                    </td>
                    <td className="py-1 text-right">{s.reps}</td>
                    <td className="py-1 text-right text-muted">
                      {s.rir !== null ? s.rir : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {session.extras && Array.isArray(session.extras) && session.extras.length > 0 && (
        <div className="border border-border rounded p-3">
          <div className="text-muted text-xs mb-2">Extras</div>
          <div className="flex flex-wrap gap-2">
            {(session.extras as ExtraDetail[]).map((extra) => (
              <span
                key={extra.id}
                className="inline-flex items-center gap-1.5 bg-accent/5 border border-border rounded-full px-3 py-1 text-xs"
              >
                <span className="font-medium">{extra.label}</span>
                <span className="text-muted">{extra.minutes} min</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {session.debrief && (
        <div className="border border-border rounded p-3">
          <div className="text-muted text-xs mb-2">Debrief</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted">Energy</span>
              <div className="text-accent font-medium">{session.debrief.energy}/5</div>
            </div>
            <div>
              <span className="text-muted">Pump</span>
              <div className="text-accent font-medium">{session.debrief.pump}/5</div>
            </div>
            <div>
              <span className="text-muted">Mood</span>
              <div className="text-accent font-medium">{session.debrief.mood}/5</div>
            </div>
          </div>
        </div>
      )}

      {session.notes && (
        <div className="border border-border rounded p-3">
          <div className="text-muted text-xs mb-1">Notes</div>
          <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-red-400 text-sm hover:text-red-300"
          >
            Delete session
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                setDeleting(true);
                await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
                await mutate("/api/sessions");
                router.replace("/history");
              }}
              disabled={deleting}
              className="text-red-400 text-sm font-medium hover:text-red-300 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-muted text-sm hover:text-accent"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
