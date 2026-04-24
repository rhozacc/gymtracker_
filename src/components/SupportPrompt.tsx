"use client";

import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import { MESSAGES } from "@/lib/support-prompt";

type Phase = "in" | "show" | "out";

const ICONS = [
  // shake
  <svg key="shake" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2h8l1 4H7L8 2z" />
    <rect x="6" y="6" width="12" height="14" rx="2" />
    <line x1="12" y1="10" x2="12" y2="16" />
    <line x1="9" y1="13" x2="15" y2="13" />
  </svg>,
  // coffee
  <svg key="coffee" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>,
  // pizza
  <svg key="pizza" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 22h20L12 2z" />
    <circle cx="12" cy="13" r="1.8" fill="var(--accent)" stroke="none" />
    <circle cx="9" cy="17.5" r="1.2" fill="var(--accent)" stroke="none" />
    <circle cx="15" cy="17.5" r="1.2" fill="var(--accent)" stroke="none" />
  </svg>,
  // pre-workout / lightning
  <svg key="zap" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>,
  // lightbulb
  <svg key="bulb" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18" />
    <line x1="10" y1="22" x2="14" y2="22" />
    <path d="M12 2a7 7 0 0 1 7 7c0 3.17-2.11 5.86-5 6.72V17H10v-1.28C7.11 14.86 5 12.17 5 9a7 7 0 0 1 7-7z" />
  </svg>,
];

const SPARKS = [
  { sx: "-32px", sy: "-52px", delay: "0s",    left: "18%", size: 8 },
  { sx: "22px",  sy: "-64px", delay: "0.04s", left: "33%", size: 5 },
  { sx: "-18px", sy: "-48px", delay: "0.09s", left: "50%", size: 9 },
  { sx: "38px",  sy: "-56px", delay: "0.06s", left: "64%", size: 5 },
  { sx: "-28px", sy: "-44px", delay: "0.12s", left: "76%", size: 7 },
  { sx: "12px",  sy: "-68px", delay: "0.03s", left: "43%", size: 6 },
  { sx: "-10px", sy: "-38px", delay: "0.15s", left: "28%", size: 4 },
  { sx: "28px",  sy: "-42px", delay: "0.07s", left: "58%", size: 4 },
];

interface SupportPromptProps {
  message: string;
  stripeUrl: string;
  onClose: () => void;
}

export function SupportPrompt({ stripeUrl, onClose }: SupportPromptProps) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("in");
  const [zapCta, setZapCta] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clear = () => { if (timer.current) clearTimeout(timer.current); };
    clear();
    if (phase === "in")   timer.current = setTimeout(() => setPhase("show"), 400);
    if (phase === "show") timer.current = setTimeout(() => setPhase("out"),  2800);
    if (phase === "out")  timer.current = setTimeout(() => {
      setIdx(i => (i + 1) % MESSAGES.length);
      setPhase("in");
    }, 260);
    return clear;
  }, [phase]);

  if (!stripeUrl) return null;

  function handleSupport() {
    setZapCta(true);
    setTimeout(() => {
      window.open(stripeUrl, "_blank", "noopener,noreferrer");
      onClose();
    }, 400);
  }

  const iconAnim =
    phase === "out"  ? "sp-zap-out 0.24s ease-in forwards" :
    phase === "in"   ? "sp-zap-in 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards" :
                       "sp-bob 2.4s ease-in-out infinite";

  const textAnim =
    phase === "out" ? "sp-text-out 0.2s ease-in forwards" :
    phase === "in"  ? "sp-text-in 0.28s ease-out 0.1s both" :
                      "none";

  return createPortal(
    <>
      <style>{`
        @keyframes sp-fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes sp-slide-up {
          0%   { transform:translateY(110%); opacity:0; }
          55%  { transform:translateY(-12px); opacity:1; }
          75%  { transform:translateY(6px); }
          100% { transform:translateY(0); }
        }
        @keyframes sp-bob {
          0%,100% { transform:translateY(0) scale(1); }
          50%     { transform:translateY(-8px) scale(1.04); }
        }
        @keyframes sp-zap-out {
          0%   { transform:scale(1);    opacity:1; filter:blur(0px)  drop-shadow(0 0 10px var(--accent)); }
          45%  { transform:scale(0.18); opacity:1; filter:blur(4px)  drop-shadow(0 0 20px var(--accent)); }
          100% { transform:scale(0.03); opacity:0; filter:blur(8px); }
        }
        @keyframes sp-zap-in {
          0%   { transform:scale(0.03); opacity:0; filter:blur(8px); }
          55%  { transform:scale(1.24); opacity:1; filter:blur(0px) drop-shadow(0 0 18px var(--accent)); }
          100% { transform:scale(1);    opacity:1; filter:blur(0px) drop-shadow(0 0 8px var(--accent)); }
        }
        @keyframes sp-text-out {
          from { opacity:1; transform:translateY(0); }
          to   { opacity:0; transform:translateY(-12px); }
        }
        @keyframes sp-text-in {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes sp-glow {
          0%,100% { box-shadow:0 0 14px 4px var(--accent), 0 0 36px 10px color-mix(in srgb,var(--accent) 28%,transparent); }
          50%     { box-shadow:0 0 28px 8px var(--accent), 0 0 70px 20px color-mix(in srgb,var(--accent) 50%,transparent); }
        }
        @keyframes sp-zap-cta {
          0%   { transform:scale(1) rotate(0deg); }
          20%  { transform:scale(1.1) rotate(-3deg); }
          40%  { transform:scale(1.18) rotate(3deg); }
          60%  { transform:scale(1.08) rotate(-2deg); }
          80%  { transform:scale(0.95); }
          100% { transform:scale(1); }
        }
        @keyframes sp-spark {
          0%   { transform:translate(0,0) scale(1); opacity:1; }
          100% { transform:translate(var(--sx),var(--sy)) scale(0); opacity:0; }
        }
        @keyframes sp-line-glow {
          0%,100% { opacity:1; }
          50%     { opacity:0.4; }
        }
        @keyframes sp-ring-pulse {
          0%,100% { box-shadow:0 0 28px 6px color-mix(in srgb,var(--accent) 40%,transparent), inset 0 0 12px 2px color-mix(in srgb,var(--accent) 15%,transparent); }
          50%     { box-shadow:0 0 48px 14px color-mix(in srgb,var(--accent) 60%,transparent), inset 0 0 22px 5px color-mix(in srgb,var(--accent) 25%,transparent); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[400] flex flex-col justify-end"
        style={{ animation: "sp-fade-in 0.2s ease forwards" }}
      >
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

        <div
          className="relative bg-surface border border-border border-b-0 rounded-t-2xl px-5 pb-10 pt-8 w-full max-w-lg mx-auto space-y-5 overflow-hidden"
          style={{ animation: "sp-slide-up 0.52s cubic-bezier(0.34,1.4,0.64,1) forwards" }}
        >
          {/* Pulsing top edge */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "var(--accent)", boxShadow: "0 0 18px 4px var(--accent)", animation: "sp-line-glow 1.6s ease-in-out infinite" }}
          />

          {/* Open sparks */}
          {SPARKS.map((s, i) => (
            <span key={i} style={{
              position: "absolute", top: "12px", left: s.left,
              width: s.size, height: s.size, borderRadius: "50%",
              background: "var(--accent)", boxShadow: "0 0 6px 2px var(--accent)",
              "--sx": s.sx, "--sy": s.sy,
              animation: `sp-spark 0.75s ease-out ${s.delay} forwards`,
            } as React.CSSProperties} />
          ))}

          {/* Cycling icon */}
          <div className="flex justify-center pt-2">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: "color-mix(in srgb,var(--accent) 10%,transparent)",
                border: "2px solid var(--accent)",
                animation: "sp-ring-pulse 2s ease-in-out infinite",
              }}
            >
              <div style={{ animation: iconAnim }}>
                {ICONS[idx]}
              </div>
            </div>
          </div>

          {/* Cycling text */}
          <div className="text-center space-y-1.5" style={{ minHeight: "64px" }}>
            <p
              className="text-2xl font-bold"
              style={{
                animation: textAnim,
                textShadow: "0 0 20px var(--accent), 0 0 40px color-mix(in srgb,var(--accent) 40%,transparent)",
              }}
            >
              {MESSAGES[idx]}
            </p>
            <p className="text-muted text-sm">
              Built by one person. If it&apos;s helping your training, this means a lot.
            </p>
          </div>

          <button
            onClick={handleSupport}
            className="w-full h-14 bg-accent text-bg font-bold rounded text-base"
            style={{
              boxShadow: "0 0 20px 5px var(--accent)",
              animation: zapCta ? "sp-zap-cta 0.38s ease-out forwards" : "sp-glow 1.8s ease-in-out infinite",
            }}
          >
            Support the app
          </button>

          <button onClick={onClose} className="w-full h-10 text-muted text-sm hover:text-text transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
