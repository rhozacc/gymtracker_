"use client";

import { useState, useEffect, ReactNode, useRef } from "react";

export function PinGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setAuthed(sessionStorage.getItem("gym-auth") === "true");
  }, []);

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

  if (authed === null) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
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

  return <>{children}</>;
}
