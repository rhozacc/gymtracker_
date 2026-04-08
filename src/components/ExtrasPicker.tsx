"use client";

import { useState } from "react";
import { useExtras } from "@/lib/useExtras";
import {
  EXTRAS_BY_CATEGORY,
  CATEGORY_INFO,
  formatExtraValue,
  type ExtraCategory,
  type ExtraOption,
} from "@/lib/extras";

const CATEGORY_ORDER: ExtraCategory[] = ["abs", "cardio", "stretch"];

function OptionCard({
  option,
  selected,
  expanded,
  onToggleExpand,
  onSelect,
}: {
  option: ExtraOption;
  selected: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={`border rounded-lg transition-colors ${
        selected ? "border-accent bg-surface" : "border-border hover:border-muted"
      }`}
    >
      <button onClick={onToggleExpand} className="w-full text-left p-3">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-sm font-medium">{option.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted border border-border rounded-full px-2 py-0.5">
              {option.duration}
            </span>
            {selected && (
              <span className="text-[10px] text-accent border border-accent rounded-full px-2 py-0.5">
                On
              </span>
            )}
            <span className={`text-muted text-xs transition-transform ${expanded ? "rotate-180" : ""}`}>
              ▾
            </span>
          </div>
        </div>
        <p className="text-muted text-xs">{option.description}</p>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <div className="space-y-1">
            {option.exercises.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-foreground/90">{ex.name}</span>
                <span className="text-muted tabular-nums">{formatExtraValue(ex)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`w-full text-xs font-medium rounded-md py-1.5 transition-colors ${
              selected
                ? "text-muted border border-border hover:text-red-400 hover:border-red-400/40"
                : "text-accent border border-accent hover:bg-accent/10"
            }`}
          >
            {selected ? "Remove" : "Select"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ExtrasPicker() {
  const { selection, setExtra } = useExtras();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleSelect(category: ExtraCategory, option: ExtraOption) {
    const current = selection[category];
    setExtra(category, current === option.id ? null : option.id);
  }

  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((cat) => {
        const info = CATEGORY_INFO[cat];
        const options = EXTRAS_BY_CATEGORY[cat];
        const selectedId = selection[cat];

        return (
          <div key={cat}>
            <div className="mb-3">
              <h2 className="text-sm font-medium">{info.label}</h2>
              <p className="text-muted text-xs">{info.description}</p>
            </div>
            <div className="space-y-2">
              {options.map((opt) => (
                <OptionCard
                  key={opt.id}
                  option={opt}
                  selected={selectedId === opt.id}
                  expanded={expandedId === opt.id}
                  onToggleExpand={() =>
                    setExpandedId((prev) => (prev === opt.id ? null : opt.id))
                  }
                  onSelect={() => handleSelect(cat, opt)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
