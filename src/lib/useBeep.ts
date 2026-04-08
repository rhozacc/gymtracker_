"use client";

import { useRef, useCallback } from "react";

export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
  }, []);

  const playBeep = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
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
  }, []);

  return { playBeep, initAudio };
}
