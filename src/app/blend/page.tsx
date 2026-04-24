"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useProgram } from "@/lib/useProgram";
import { useTheme } from "@/lib/useTheme";
import { QRScanner } from "@/components/QRScanner";

function getNextDayType(dayKeys: string[]): string {
  return dayKeys[0] ?? "";
}

type Mode = "intro" | "choose" | "create" | "scan";

export default function BlendPage() {
  const router = useRouter();
  const { plan } = useProgram();
  const { theme } = useTheme();
  const dayKeys = Object.keys(plan.days);

  const [mode, setMode] = useState<Mode>("intro");
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [createStatus, setCreateStatus] = useState<"idle" | "creating" | "waiting" | "joined" | "error">("idle");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Play intro animation, then show mode chooser
  useEffect(() => {
    const t = setTimeout(() => setMode("choose"), 900);
    return () => clearTimeout(t);
  }, []);

  // Default day selection
  useEffect(() => {
    if (dayKeys.length > 0 && !selectedDay) setSelectedDay(getNextDayType(dayKeys));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKeys.length]);

  const createInvite = useCallback(
    async (dayType: string) => {
      const day = plan.days[dayType];
      if (!day) return;
      setCreateStatus("creating");
      try {
        const res = await fetch("/api/blend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dayType, day }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setToken(data.token);
        setExpiresAt(new Date(data.expiresAt));
        setCreateStatus("waiting");
      } catch {
        setCreateStatus("error");
      }
    },
    [plan]
  );

  // When entering create mode, kick off invite creation
  useEffect(() => {
    if (mode === "create" && selectedDay && createStatus === "idle") {
      createInvite(selectedDay);
    }
  }, [mode, selectedDay, createStatus, createInvite]);

  // Generate QR from token
  useEffect(() => {
    if (!token) return setQrDataUrl(null);
    const url = `${window.location.origin}/blend/${token}`;
    QRCode.toDataURL(url, {
      width: 640,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: theme === "dark" ? "#e8e8e8" : "#111111",
        light: "#00000000",
      },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [token, theme]);

  // Poll for guest join → go to confirm page
  useEffect(() => {
    if (createStatus !== "waiting" || !token) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/blend/${token}`);
        const data = await res.json();
        if (data.status === "previewing" || data.status === "active") {
          clearInterval(pollRef.current!);
          setGuestName(data.guestName);
          setCreateStatus("joined");
          setTimeout(() => router.push(`/blend/${token}/confirm`), 1200);
        } else if (data.status === "expired" || !res.ok) {
          clearInterval(pollRef.current!);
          setCreateStatus("error");
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(pollRef.current!);
  }, [createStatus, token, router]);

  async function handleShare() {
    if (!token) return;
    const url = `${window.location.origin}/blend/${token}`;
    const text = `Join my blended gym session! Code: ${token}`;
    if (navigator.share) {
      await navigator.share({ title: "gymtracker_ blend", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDayChange(day: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    setToken(null);
    setCreateStatus("idle");
    setSelectedDay(day);
  }

  function handleScannerDetected(value: string) {
    // Extract the token from the scanned URL. Accept both full URLs and
    // bare 6-char codes.
    let extractedToken: string | null = null;
    try {
      const u = new URL(value);
      const m = u.pathname.match(/\/blend\/([A-Z0-9]{6})/i);
      if (m) extractedToken = m[1].toUpperCase();
    } catch {
      const m = value.trim().match(/^([A-Z0-9]{6})$/i);
      if (m) extractedToken = m[1].toUpperCase();
    }
    if (extractedToken) {
      router.push(`/blend/${extractedToken}`);
    } else {
      setMode("choose");
    }
  }

  const timeLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 60000))
    : 0;

  return (
    <div className="fixed inset-0 bg-bg overflow-hidden">
      {/* Intro accent dot expansion — covers the whole viewport on mount */}
      <div
        className="absolute z-30 rounded-full pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          width: "16px",
          height: "16px",
          backgroundColor: "var(--accent)",
          transform: "translate(-50%, -50%) scale(0)",
          animation: mode === "intro"
            ? "blend-dot-expand 900ms cubic-bezier(0.65, 0, 0.35, 1) forwards"
            : "none",
          opacity: mode === "intro" ? 1 : 0,
        }}
      />

      {/* Main content — hidden until intro finishes */}
      <div
        className="relative z-10 min-h-screen flex flex-col"
        style={{
          opacity: mode === "intro" ? 0 : 1,
          transform: mode === "intro" ? "scale(0.96)" : "scale(1)",
          transition: "opacity 400ms ease 200ms, transform 400ms ease 200ms",
        }}
      >
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => router.back()}
            className="text-muted hover:text-accent transition-colors"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold tracking-tight">Blend</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start p-6 space-y-6 max-w-sm mx-auto w-full overflow-y-auto">
          {/* Mode chooser */}
          {mode === "choose" && (
            <div className="w-full space-y-4 mt-8 animate-fade-in">
              <div className="text-center">
                <p className="text-3xl font-bold leading-tight">Tag team.</p>
                <p className="text-muted text-sm mt-2">
                  Merge two plans into one session. Same exercises, your own weights.
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  onClick={() => setMode("create")}
                  className="w-full h-14 bg-accent text-bg font-bold rounded-xl text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <line x1="14" y1="14" x2="21" y2="14" />
                    <line x1="14" y1="17" x2="17" y2="17" />
                    <line x1="20" y1="17" x2="21" y2="17" />
                    <line x1="14" y1="20" x2="21" y2="20" />
                  </svg>
                  Create code
                </button>
                <button
                  onClick={() => setMode("scan")}
                  className="w-full h-14 border-2 border-border text-text font-medium rounded-xl text-base hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-3"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                  </svg>
                  Scan friend&apos;s code
                </button>
              </div>
            </div>
          )}

          {/* Create mode */}
          {mode === "create" && (
            <div className="w-full space-y-5 animate-fade-in">
              {/* Day selector */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                  Your day
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {dayKeys.map((key) => {
                    const day = plan.days[key];
                    if (!day) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => handleDayChange(key)}
                        className={`w-full text-left border rounded p-2.5 text-sm transition-colors ${
                          selectedDay === key
                            ? "border-accent bg-accent/5 text-text"
                            : "border-border text-muted hover:border-muted"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {createStatus === "waiting" && token && (
                <div className="w-full space-y-5 text-center">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                    Point your friend&apos;s camera
                  </p>

                  <div className="relative mx-auto" style={{ width: 280, height: 280 }}>
                    {qrDataUrl ? (
                      <>
                        <div
                          className="absolute inset-0 rounded-2xl border-2 border-accent/30"
                          style={{ boxShadow: "0 0 50px rgba(57, 255, 20, 0.2)" }}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrDataUrl}
                          alt="Blend invite QR"
                          className="w-full h-full p-4"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-surface rounded-2xl animate-pulse" />
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
                      or enter code
                    </p>
                    <div className="font-mono text-4xl font-bold tracking-[0.3em] text-accent mt-1">
                      {token}
                    </div>
                    <p className="text-[11px] text-muted mt-1">expires in {timeLeft} min</p>
                  </div>

                  <button
                    onClick={handleShare}
                    className="w-full h-11 border border-border text-muted rounded-lg text-sm hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    {copied ? "Copied!" : "Share link"}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <p className="text-[11px] text-muted">waiting for partner</p>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="flex justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-accent"
                        style={{ animation: `blend-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {createStatus === "creating" && (
                <div className="text-muted text-sm text-center py-6">Creating invite...</div>
              )}

              {createStatus === "joined" && (
                <div className="text-center space-y-2 py-6">
                  <p className="text-accent font-bold text-xl">{guestName} joined!</p>
                  <p className="text-muted text-sm">Loading the blended plan...</p>
                </div>
              )}

              {createStatus === "error" && (
                <div className="text-center space-y-4 py-6">
                  <p className="text-muted text-sm">Something went wrong.</p>
                  <button
                    onClick={() => {
                      setCreateStatus("idle");
                      createInvite(selectedDay);
                    }}
                    className="text-accent text-sm hover:opacity-75 transition-opacity"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {mode === "scan" && (
          <QRScanner onDetected={handleScannerDetected} onClose={() => setMode("choose")} />
        )}
      </div>

      <style>{`
        @keyframes blend-dot-expand {
          0%   { transform: translate(-50%, -50%) scale(0);    opacity: 1; }
          60%  { transform: translate(-50%, -50%) scale(220);  opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(260);  opacity: 0; }
        }
        @keyframes blend-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes blend-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: blend-fade-in 400ms ease-out forwards; }
      `}</style>
    </div>
  );
}
