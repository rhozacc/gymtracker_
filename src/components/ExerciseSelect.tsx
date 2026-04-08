"use client";

import { useState, useRef, useEffect } from "react";

interface ExerciseOption {
  id: string;
  name: string;
  setCount: number;
}

interface Props {
  options: ExerciseOption[];
  value: string;
  onChange: (id: string) => void;
}

export function ExerciseSelect({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const selected = options.find((o) => o.id === value);
  const maxSets = Math.max(...options.map((o) => o.setCount), 1);
  const sorted = [...options].sort((a, b) => b.setCount - a.setCount);

  return (
    <div ref={ref} className="relative mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-10 bg-surface border border-border text-text text-sm rounded px-3 text-left flex items-center justify-between focus:border-accent focus:outline-none"
      >
        <span className="truncate">{selected?.name || "Select exercise"}</span>
        <svg
          className={`w-4 h-4 text-muted shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded shadow-lg max-h-[320px] overflow-y-auto">
          {sorted.map((ex) => {
            const pct = maxSets > 0 ? (ex.setCount / maxSets) * 100 : 0;
            const isSelected = ex.id === value;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  onChange(ex.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm relative overflow-hidden ${
                  isSelected ? "text-accent font-medium" : "text-text"
                }`}
              >
                <div
                  className="absolute inset-y-0 left-0 opacity-[0.08]"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: "var(--color-accent)",
                  }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="truncate">{ex.name}</span>
                  {ex.setCount > 0 && (
                    <span className="text-[10px] text-muted ml-2 tabular-nums">
                      {ex.setCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
