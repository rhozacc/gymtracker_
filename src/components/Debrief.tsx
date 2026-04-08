"use client";

import { useState } from "react";

interface DebriefProps {
  sessionId: string;
  onDone: () => void;
}

const QUESTIONS = [
  { key: "energy", label: "How was your energy?", low: "Drained", high: "Wired" },
  { key: "pump", label: "How was the pump?", low: "Nothing", high: "Insane" },
  { key: "mood", label: "How do you feel?", low: "Terrible", high: "Amazing" },
] as const;

export function Debrief({ sessionId, onDone }: DebriefProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const allAnswered = QUESTIONS.every((q) => scores[q.key] !== undefined);

  async function submit() {
    if (!allAnswered) return;
    setSaving(true);
    await fetch("/api/debrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        energy: scores.energy,
        pump: scores.pump,
        mood: scores.mood,
      }),
    });
    onDone();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-medium">Session Complete</h1>
        <p className="text-muted text-xs mt-1">Quick debrief — how did it go?</p>
      </div>

      {QUESTIONS.map((q) => (
        <div key={q.key}>
          <div className="text-sm font-medium mb-3">{q.label}</div>
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = scores[q.key] === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setScores((prev) => ({ ...prev, [q.key]: n }))
                  }
                  className={`flex-1 h-12 rounded border text-sm font-medium transition-colors ${
                    selected
                      ? "bg-accent text-bg border-accent"
                      : "bg-surface border-border text-muted hover:border-muted hover:text-accent"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted mt-1 px-1">
            <span>{q.low}</span>
            <span>{q.high}</span>
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={onDone}
          className="flex-1 h-12 border border-border text-muted rounded text-sm hover:text-accent hover:border-muted transition-colors"
        >
          Skip
        </button>
        <button
          onClick={submit}
          disabled={!allAnswered || saving}
          className="flex-1 h-12 bg-accent text-bg font-medium rounded text-sm hover:bg-white disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Done"}
        </button>
      </div>
    </div>
  );
}
