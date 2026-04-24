"use client";

import { createPortal } from "react-dom";
import { useState } from "react";

interface SupportPromptProps {
  message: string;
  stripeUrl: string;
  onClose: () => void;
}

const SPARKS = [
  { sx: "-32px", sy: "-52px", delay: "0s",     left: "18%", size: 8 },
  { sx: "22px",  sy: "-64px", delay: "0.04s",  left: "33%", size: 5 },
  { sx: "-18px", sy: "-48px", delay: "0.09s",  left: "50%", size: 9 },
  { sx: "38px",  sy: "-56px", delay: "0.06s",  left: "64%", size: 5 },
  { sx: "-28px", sy: "-44px", delay: "0.12s",  left: "76%", size: 7 },
  { sx: "12px",  sy: "-68px", delay: "0.03s",  left: "43%", size: 6 },
  { sx: "-10px", sy: "-38px", delay: "0.15s",  left: "28%", size: 4 },
  { sx: "28px",  sy: "-42px", delay: "0.07s",  left: "58%", size: 4 },
];

export function SupportPrompt({ message, stripeUrl, onClose }: SupportPromptProps) {
  const [zapped, setZapped] = useState(false);

  if (!stripeUrl) return null;

  function handleSupport() {
    setZapped(true);
    setTimeout(() => {
      window.open(stripeUrl, "_blank", "noopener,noreferrer");
      onClose();
    }, 400);
  }

  return createPortal(
    <>
      <style>{`
        @keyframes sp-fade-in   { from { opacity:0 } to { opacity:1 } }
        @keyframes sp-slide-up  {
          0%   { transform: translateY(110%); opacity:0; }
          55%  { transform: translateY(-12px); opacity:1; }
          75%  { transform: translateY(6px); }
          100% { transform: translateY(0); }
        }
        @keyframes sp-icon-pop  {
          0%   { transform: scale(0) rotate(-20deg); opacity:0; }
          65%  { transform: scale(1.25) rotate(6deg); opacity:1; }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes sp-bob       {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes sp-glow      {
          0%,100% { box-shadow: 0 0 14px 4px var(--accent), 0 0 36px 10px color-mix(in srgb,var(--accent) 28%,transparent); }
          50%     { box-shadow: 0 0 28px 8px var(--accent), 0 0 70px 20px color-mix(in srgb,var(--accent) 50%,transparent); }
        }
        @keyframes sp-zap       {
          0%   { transform: scale(1) rotate(0deg); }
          18%  { transform: scale(1.1) rotate(-3deg); }
          36%  { transform: scale(1.18) rotate(3deg); }
          54%  { transform: scale(1.08) rotate(-2deg); }
          72%  { transform: scale(0.95) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes sp-spark     {
          0%   { transform: translate(0,0) scale(1); opacity:1; }
          100% { transform: translate(var(--sx),var(--sy)) scale(0); opacity:0; }
        }
        @keyframes sp-line-glow {
          0%,100% { opacity:1; }
          50%     { opacity:0.5; }
        }
        @keyframes sp-text-pop  {
          0%   { transform: scale(0.85); opacity:0; }
          70%  { transform: scale(1.04); opacity:1; }
          100% { transform: scale(1); opacity:1; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[400] flex flex-col justify-end"
        style={{ animation: "sp-fade-in 0.2s ease forwards" }}
      >
        {/* Backdrop — darker + blur */}
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <div
          className="relative bg-surface border border-border border-b-0 rounded-t-2xl px-5 pb-10 pt-8 w-full max-w-lg mx-auto space-y-5 overflow-hidden"
          style={{ animation: "sp-slide-up 0.52s cubic-bezier(0.34,1.4,0.64,1) forwards" }}
        >
          {/* Glowing top edge */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 18px 4px var(--accent)",
              animation: "sp-line-glow 1.6s ease-in-out infinite",
            }}
          />

          {/* Sparks */}
          {SPARKS.map((s, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                top: "12px",
                left: s.left,
                width: s.size,
                height: s.size,
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 6px 2px var(--accent)",
                "--sx": s.sx,
                "--sy": s.sy,
                animation: `sp-spark 0.75s ease-out ${s.delay} forwards`,
              } as React.CSSProperties}
            />
          ))}

          {/* Big icon */}
          <div
            className="flex justify-center"
            style={{ animation: "sp-icon-pop 0.48s cubic-bezier(0.34,1.56,0.64,1) 0.12s both" }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: "color-mix(in srgb,var(--accent) 10%,transparent)",
                border: "2px solid var(--accent)",
                boxShadow: "0 0 28px 6px color-mix(in srgb,var(--accent) 40%,transparent), inset 0 0 12px 2px color-mix(in srgb,var(--accent) 15%,transparent)",
                animation: "sp-bob 2.2s ease-in-out infinite 0.65s",
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 6px var(--accent))" }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div
            className="text-center space-y-1.5"
            style={{ animation: "sp-text-pop 0.4s ease-out 0.18s both" }}
          >
            <p
              className="text-2xl font-bold"
              style={{ textShadow: "0 0 20px var(--accent), 0 0 40px color-mix(in srgb,var(--accent) 40%,transparent)" }}
            >
              {message}
            </p>
            <p className="text-muted text-sm">
              Built by one person. If it&apos;s helping your training, this means a lot.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleSupport}
            className="w-full h-14 bg-accent text-bg font-bold rounded text-base"
            style={{
              boxShadow: "0 0 20px 5px var(--accent)",
              animation: zapped
                ? "sp-zap 0.38s ease-out forwards"
                : "sp-glow 1.8s ease-in-out infinite",
            }}
          >
            Support the app
          </button>

          <button
            onClick={onClose}
            className="w-full h-10 text-muted text-sm hover:text-text transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
