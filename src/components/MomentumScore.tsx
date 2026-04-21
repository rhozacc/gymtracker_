import type { MomentumResult } from "@/lib/momentum";

const RADIUS = 27;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-surface flex-shrink-0" style={{ width: 72, height: 72 }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-surface rounded" />
            <div className="h-4 w-16 bg-surface rounded" />
            <div className="h-3 w-24 bg-surface rounded" />
          </div>
        </div>
        <div className="border-t border-border mt-3 pt-3">
          <div className="h-3 w-48 bg-surface rounded" />
        </div>
      </div>
    );
  }

  const offset = CIRCUMFERENCE * (1 - result.score / 100);

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* Arc gauge */}
        <div className="relative flex-shrink-0" style={{ width: 72, height: 72 }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle
              cx="36" cy="36" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-border"
            />
            <circle
              cx="36" cy="36" r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-accent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold tabular-nums text-accent leading-none">
              {result.score}
            </span>
          </div>
        </div>

        {/* Label */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
            Momentum
          </p>
          <p className="text-sm font-medium mt-0.5">
            {result.score >= 75
              ? "Strong week"
              : result.score >= 50
              ? "Building"
              : result.score >= 25
              ? "Gaining ground"
              : "Getting started"}
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            {result.sessionCount} session{result.sessionCount !== 1 ? "s" : ""} · 28 days
          </p>
        </div>
      </div>

      <div className="border-t border-border mt-3 pt-3">
        <p className="text-xs text-muted">{getInsight(result)}</p>
      </div>
    </div>
  );
}
