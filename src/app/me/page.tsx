"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { getDayShortLabel } from "@/lib/program";
import { formatDate, formatDuration } from "@/lib/utils";

interface DebriefEntry {
  id: string;
  sessionId: string;
  energy: number;
  pump: number;
  mood: number;
  createdAt: string;
  session: {
    date: string;
    dayType: string;
    startedAt: string | null;
    endedAt: string | null;
  };
}

function ScoreBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-sm ${
            i < value ? "bg-accent" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

export default function MePage() {
  const { data: debriefs, isLoading } = useSWR<DebriefEntry[]>(
    "/api/debrief",
    fetcher
  );

  const avgEnergy =
    debriefs && debriefs.length > 0
      ? debriefs.reduce((s, d) => s + d.energy, 0) / debriefs.length
      : 0;
  const avgPump =
    debriefs && debriefs.length > 0
      ? debriefs.reduce((s, d) => s + d.pump, 0) / debriefs.length
      : 0;
  const avgMood =
    debriefs && debriefs.length > 0
      ? debriefs.reduce((s, d) => s + d.mood, 0) / debriefs.length
      : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-medium">Me</h1>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface rounded animate-pulse" />
          ))}
        </div>
      )}

      {debriefs && debriefs.length === 0 && (
        <p className="text-muted text-sm text-center py-8">
          No debrief data yet. Finish a session to log how you felt!
        </p>
      )}

      {debriefs && debriefs.length > 0 && (
        <>
          {/* Averages */}
          <div className="border border-border rounded p-4 space-y-3">
            <div className="text-muted text-xs mb-1">
              Averages ({debriefs.length} sessions)
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Energy</span>
                <span className="text-muted text-xs w-8 text-right">
                  {avgEnergy.toFixed(1)}
                </span>
              </div>
              <ScoreBar value={Math.round(avgEnergy)} />

              <div className="flex items-center justify-between text-sm">
                <span>Pump</span>
                <span className="text-muted text-xs w-8 text-right">
                  {avgPump.toFixed(1)}
                </span>
              </div>
              <ScoreBar value={Math.round(avgPump)} />

              <div className="flex items-center justify-between text-sm">
                <span>Mood</span>
                <span className="text-muted text-xs w-8 text-right">
                  {avgMood.toFixed(1)}
                </span>
              </div>
              <ScoreBar value={Math.round(avgMood)} />
            </div>
          </div>

          {/* Recent debriefs */}
          <div>
            <div className="text-muted text-xs mb-3">Recent sessions</div>
            <div className="space-y-2">
              {debriefs.slice(0, 20).map((d) => {
                const duration =
                  d.session.startedAt && d.session.endedAt
                    ? formatDuration(d.session.startedAt, d.session.endedAt)
                    : null;
                return (
                  <div
                    key={d.id}
                    className="border border-border rounded p-3"
                  >
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-medium">
                        {getDayShortLabel(d.session.dayType)}
                      </span>
                      <div className="text-muted text-xs">
                        {formatDate(d.session.date)}
                        {duration && (
                          <span className="ml-2">{duration}</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted">Energy</span>
                        <div className="mt-0.5">
                          <ScoreBar value={d.energy} />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted">Pump</span>
                        <div className="mt-0.5">
                          <ScoreBar value={d.pump} />
                        </div>
                      </div>
                      <div>
                        <span className="text-muted">Mood</span>
                        <div className="mt-0.5">
                          <ScoreBar value={d.mood} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
