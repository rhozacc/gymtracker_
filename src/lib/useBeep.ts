"use client";

import { useRef, useCallback } from "react";

export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);
  const audioReadyRef = useRef(false);

  const initAudio = useCallback(() => {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AudioContext();
        audioReadyRef.current = true;
      } catch {
        audioReadyRef.current = false;
      }
    } else if (ctxRef.current.state === "suspended") {
      try {
        ctxRef.current.resume().then(() => {
          audioReadyRef.current = true;
        }).catch(() => {
          audioReadyRef.current = false;
        });
      } catch {
        audioReadyRef.current = false;
      }
    }
  }, []);

  const playBeep = useCallback(() => {
    // Try vibration API first (more reliable on iOS)
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
      return;
    }

    // Fallback to Web Audio API
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;

      // Only attempt if context is ready from a prior user gesture
      if (!audioReadyRef.current) {
        return;
      }

      // Try to resume if suspended (though this may not work from a timer on iOS)
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {
          // Resume failed, not much we can do
        });
        return;
      }

      // Triple beep: 880Hz, 150ms each, 200ms apart
      for (let i = 0; i < 3; i++) {
        const startTime = ctx.currentTime + i * 0.2;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      }
    } catch {
      // Silently fail if audio doesn't work
    }
  }, []);

  return { playBeep, initAudio };
}
