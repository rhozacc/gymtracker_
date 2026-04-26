"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/program";
import { blendDays } from "@/lib/blend";
import type { BlendedDayDefinition, BlendedExercise } from "@/lib/blend";

type SimPick = { planId: string; dayType: string; label: string };

function DayPicker({
  title,
  selected,
  onSelect,
}: {
  title: string;
  selected: SimPick | null;
  onSelect: (pick: SimPick) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-3">{title}</p>
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {Object.values(PLANS).map((plan) => (
          <div key={plan.id} className="border border-border rounded">
            <button
              onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
            >
              <span className="text-sm font-medium">{plan.name}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted transition-transform"
                style={{ transform: expanded === plan.id ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expanded === plan.id && (
              <div className="border-t border-border divide-y divide-border/50">
                {Object.entries(plan.days).map(([dayType, day]) => {
                  const isSelected = selected?.planId === plan.id && selected?.dayType === dayType;
                  return (
                    <button
                      key={dayType}
                      onClick={() => onSelect({ planId: plan.id, dayType, label: day.label })}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                        isSelected ? "bg-accent/10" : "hover:bg-surface"
                      }`}
                    >
                      <div>
                        <p className={`text-sm ${isSelected ? "text-accent font-medium" : "text-text"}`}>
                          {day.label}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">{day.exercises.length} exercises</p>
                      </div>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent flex-shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BlendResultView({
  result,
  youPick,
  partnerPick,
}: {
  result: BlendedDayDefinition;
  youPick: SimPick;
  partnerPick: SimPick;
}) {
  const exercises = result.exercises as BlendedExercise[];
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="text-center space-y-0.5 mb-4">
        <p className="text-accent font-medium">{result.label}</p>
        <p className="text-muted text-xs">{exercises.length} exercises</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {exercises.map((ex, i) => {
          const isHero = ex.isHero || ex.owner === "shared";
          return (
            <div
              key={`${i}-${ex.id}`}
              className={`flex items-center justify-between py-2.5 px-3 rounded-md border ${
                isHero ? "border-accent bg-accent/5" : "border-border"
              }`}
              style={isHero ? { boxShadow: "0 0 16px rgba(57,255,20,0.12)" } : {}}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {isHero && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-bg bg-accent rounded px-1.5 py-0.5 leading-none">
                      H2H
                    </span>
                  )}
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                </div>
                <p className="text-[10px] text-muted mt-0.5">
                  {ex.sets} × {ex.repRange[0]}–{ex.repRange[1]}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 ml-2">
                <span className={`text-[10px] font-medium uppercase tracking-widest ${isHero ? "text-accent" : "text-muted"}`}>
                  {isHero ? "Both" : ex.ownerName}
                </span>
                {ex.newForPartner && !isHero && (
                  <span className="text-[9px] text-accent/70 uppercase tracking-widest">new</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-border text-center">
        <p className="text-[10px] text-muted">
          {youPick.label.split("—")[1]?.trim() ?? youPick.label} × {partnerPick.label.split("—")[1]?.trim() ?? partnerPick.label}
        </p>
      </div>
    </div>
  );
}

export default function BlendSimulatorPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [youPick, setYouPick] = useState<SimPick | null>(null);
  const [partnerPick, setPartnerPick] = useState<SimPick | null>(null);
  const [result, setResult] = useState<BlendedDayDefinition | null>(null);

  function computeBlend(partner: SimPick) {
    if (!youPick) return;
    const yourDay = PLANS[youPick.planId]?.days[youPick.dayType];
    const partnerDay = PLANS[partner.planId]?.days[partner.dayType];
    if (!yourDay || !partnerDay) return;
    const blended = blendDays(yourDay.exercises, partnerDay.exercises, {
      hostName: "You",
      guestName: "Partner",
      hostDayLabel: youPick.label,
      guestDayLabel: partner.label,
      shuffleSeed: Math.floor(Math.random() * 0xffffffff),
    });
    setResult(blended);
    setStep(3);
  }

  function handleBack() {
    if (step === 1) {
      router.push("/settings");
    } else {
      setStep((s) => (s - 1) as 1 | 2 | 3);
    }
  }

  return (
    <div className="fixed inset-0 bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
        <button
          onClick={handleBack}
          className="text-muted transition-colors"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium">Blend Simulator</p>
          <p className="text-[10px] text-muted uppercase tracking-widest">Step {step} of 3</p>
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`rounded-full transition-all duration-300 ${
                s === step ? "w-4 h-1.5 bg-accent" : s < step ? "w-1.5 h-1.5 bg-accent/50" : "w-1.5 h-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-4 pb-8 max-w-sm mx-auto w-full">
        {step === 1 && (
          <>
            <DayPicker title="Your day" selected={youPick} onSelect={setYouPick} />
            <div className="pt-4 flex-shrink-0">
              <button
                onClick={() => { if (youPick) setStep(2); }}
                disabled={!youPick}
                className="w-full h-12 bg-accent text-bg font-bold rounded-lg text-sm disabled:opacity-40"
              >
                Next — pick partner&apos;s day
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DayPicker title="Partner's day" selected={partnerPick} onSelect={setPartnerPick} />
            <div className="pt-4 flex-shrink-0">
              <button
                onClick={() => { if (partnerPick) computeBlend(partnerPick); }}
                disabled={!partnerPick}
                className="w-full h-12 bg-accent text-bg font-bold rounded-lg text-sm disabled:opacity-40"
              >
                Preview blend
              </button>
            </div>
          </>
        )}

        {step === 3 && result && youPick && partnerPick && (
          <>
            <BlendResultView result={result} youPick={youPick} partnerPick={partnerPick} />
            <div className="pt-4 flex gap-2 flex-shrink-0">
              <button
                onClick={() => { setResult(null); setStep(2); }}
                className="flex-1 h-12 border border-border text-muted rounded-lg text-sm hover:border-accent hover:text-accent transition-colors"
              >
                Reshake
              </button>
              <button
                onClick={() => router.push("/settings")}
                className="flex-1 h-12 bg-accent text-bg font-bold rounded-lg text-sm"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
