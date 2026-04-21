import type { MomentumResult } from "@/lib/momentum";

const SEGMENTS = 7;

function getInsight(r: MomentumResult): string {
  const { score, frequency, progression, recovery, sessionCount, exercisesTracked, exercisesImproving } = r;

  if (sessionCount === 0) return "No sessions logged in the last 28 days";
  if (sessionCount < 3) return "More sessions will unlock the full score";

  if (score >= 75) {
    if (exercisesTracked > 0 && exercisesImproving > 0) {
      return `Progressing on ${exercisesImproving} of ${exercisesTracked} exercises — keep loading`;
    }
    return "Consistent training and good recovery — keep the pressure on";
  }

  const progressionIsWeakest = progression <= frequency && progression <= recovery;
  const frequencyIsWeakest = frequency < progression && frequency <= recovery;

  if (progressionIsWeakest) {
    if (exercisesTracked === 0) return "Train the same exercises in both weeks to track progress";
    const plateaued = exercisesTracked - exercisesImproving;
    if (plateaued > 0) {
      return `${plateaued} exercise${plateaued !== 1 ? "s" : ""} flat or declining — try adding weight`;
    }
    return "Progression mixed — revisit your loading plan";
  }

  if (frequencyIsWeakest) {
    return "Consistency gap — aim for at least 1 session per week";
  }

  return "Recovery dragging — log post-workout debrief or add rest days";
}

interface Props {
  result: MomentumResult | null;
}

export function MomentumScore({ result }: Props) {
  if (result === null) {
    return (
      <div className="border border-border rounded-lg p-4 animate-pulse">
        <div className="h-4 w-24 bg-surface rounded mb-3" />
        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <div key={i} className="h-2 flex-1 rounded-sm bg-surface" />
          ))}
        </div>
        <div className="h-3 w-32 bg-surface rounded" />
      </div>
    );
  }

  const activeCount = Math.round((result.score / 100) * SEGMENTS);

  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-base font-bold mb-3">Momentum</p>

      <div className="flex gap-1.5 mb-2">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isActive = i < activeCount;
          // Brightness fades left-to-right among active segments
          const opacity = isActive
            ? 1 - (i / (SEGMENTS - 1)) * 0.55
            : undefined;
          return (
            <div
              key={i}
              className="h-2 flex-1 rounded-sm"
              style={
                isActive
                  ? { backgroundColor: "var(--accent)", opacity }
                  : { backgroundColor: "var(--border)" }
              }
            />
          );
        })}
      </div>

      <p className="text-[11px] text-muted">Based on last 4 weeks</p>

      {result.sessionCount > 0 && (
        <div className="border-t border-border mt-3 pt-3">
          <p className="text-xs text-muted">{getInsight(result)}</p>
        </div>
      )}
    </div>
  );
}
