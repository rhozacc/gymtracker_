"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { PROGRAM, getExerciseById } from "@/lib/program";
import { formatDate, calculateVolume } from "@/lib/utils";

interface SetDetail {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  rir: number | null;
}

interface SessionDetail {
  id: string;
  date: string;
  dayType: string;
  notes: string | null;
  sets: SetDetail[];
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
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
  const dayDef = PROGRAM[session.dayType];

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
            {dayDef?.label || session.dayType}
          </h1>
          <span className="text-muted text-xs">
            {formatDate(session.date)}
          </span>
        </div>
        <div className="text-muted text-xs mt-1">
          {session.sets.length} sets &middot;{" "}
          {Math.round(totalVolume).toLocaleString()} kg total volume
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
                  {Math.round(exVolume)} kg
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
                    <td className="py-1 text-right">{s.weight} kg</td>
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

      {session.notes && (
        <div className="border border-border rounded p-3">
          <div className="text-muted text-xs mb-1">Notes</div>
          <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}
    </div>
  );
}
