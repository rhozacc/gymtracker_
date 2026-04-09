"use client";

import { useState, useEffect, ReactNode, useRef } from "react";
import {
  isBiometricSupported,
  isBiometricEnrolled,
  authenticateWithBiometric,
  registerBiometric,
  wasEnrollmentDismissed,
  dismissEnrollment,
} from "@/lib/webauthn";
import { Welcome, useOnboarded } from "@/components/Welcome";

type Phase = "loading" | "biometric-attempt" | "pin" | "enroll-prompt";

export function PinGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const { onboarded, checked: onboardChecked } = useOnboarded();
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome after auth if not onboarded
  useEffect(() => {
    if (authed && onboardChecked && !onboarded) {
      setShowWelcome(true);
    }
  }, [authed, onboardChecked, onboarded]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Already authenticated this session
    if (sessionStorage.getItem("gym-auth") === "true") {
      setAuthed(true);
      return;
    }

    // Check if biometric is enrolled
    isBiometricEnrolled().then((enrolled) => {
      if (enrolled) {
        setPhase("biometric-attempt");
        attemptBiometric();
      } else {
        setPhase("pin");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function attemptBiometric() {
    const success = await authenticateWithBiometric();
    if (success) {
      sessionStorage.setItem("gym-auth", "true");
      setAuthed(true);
    } else {
      setPhase("pin");
    }
  }

  async function verify(fullPin: string) {
    setLoading(true);
    setError(false);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: fullPin }),
    });
    const data = await res.json();

    if (data.valid) {
      sessionStorage.setItem("gym-auth", "true");

      // Check if we should offer biometric enrollment
      const supported = await isBiometricSupported();
      const enrolled = localStorage.getItem("gym-biometric") === "true";
      const dismissed = wasEnrollmentDismissed();

      if (supported && !enrolled && !dismissed) {
        setLoading(false);
        setPhase("enroll-prompt");
        return;
      }

      setAuthed(true);
    } else {
      setError(true);
      setPin(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  }

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    setError(false);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 3) {
      const fullPin = next.join("");
      if (fullPin.length === 4) {
        verify(fullPin);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleEnroll() {
    setLoading(true);
    await registerBiometric();
    setLoading(false);
    setAuthed(true);
  }

  function handleDismissEnroll() {
    dismissEnrollment();
    setAuthed(true);
  }

  if (authed) {
    return (
      <>
        {showWelcome && <Welcome onDone={() => setShowWelcome(false)} />}
        {children}
      </>
    );
  }

  // Loading state
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Biometric attempt — show spinner while Face ID / Touch ID prompt is active
  if (phase === "biometric-attempt") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent mx-auto mb-4">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-muted text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Enrollment prompt — shown after PIN success
  if (phase === "enroll-prompt") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center max-w-xs px-4">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent mx-auto mb-6">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <h1 className="text-accent text-lg font-medium mb-2">Enable Face ID?</h1>
          <p className="text-muted text-sm mb-8">
            Use biometric login for faster access next time
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDismissEnroll}
              className="flex-1 h-12 border border-border text-muted rounded text-sm hover:text-accent hover:border-muted transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleEnroll}
              disabled={loading}
              className="flex-1 h-12 bg-accent text-bg font-medium rounded text-sm hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Setting up..." : "Enable"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PIN screen
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-accent text-lg font-medium mb-8">Enter PIN</h1>
        <div className="flex gap-3 justify-center mb-6">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="w-14 h-14 bg-surface border border-border text-text text-center text-2xl font-bold rounded focus:border-accent focus:outline-none disabled:opacity-50"
              autoFocus={i === 0}
            />
          ))}
        </div>
        {error && (
          <p className="text-red-500 text-sm">Wrong PIN. Try again.</p>
        )}
        {loading && (
          <div className="flex justify-center">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
