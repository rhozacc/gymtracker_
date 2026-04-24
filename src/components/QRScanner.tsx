"use client";

import { useEffect, useRef, useState } from "react";

// Minimal type for BarcodeDetector (not yet in TS lib.dom for all targets)
interface BarcodeDetectorResult {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement | ImageBitmapSource): Promise<BarcodeDetectorResult[]>;
}
interface BarcodeDetectorCtor {
  new (opts: { formats: string[] }): BarcodeDetectorLike;
}
declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

interface QRScannerProps {
  onDetected: (value: string) => void;
  onClose: () => void;
}

/**
 * Fullscreen QR scanner. Uses BarcodeDetector on Chromium. On unsupported
 * browsers (iOS Safari), shows a message telling the user to use the
 * native camera app — it auto-detects QR codes and offers to open the link.
 */
export function QRScanner({ onDetected, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<"starting" | "scanning" | "unsupported" | "denied">("starting");
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      typeof window.BarcodeDetector !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;

    if (!supported) {
      setState("unsupported");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setState("scanning");

        const detector = new window.BarcodeDetector!({ formats: ["qr_code"] });

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0 && !detected) {
              setDetected(true);
              onDetected(results[0].rawValue);
              return;
            }
          } catch { /* frame failure; keep trying */ }
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        if (!cancelled) setState("denied");
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [onDetected, detected]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        {state === "scanning" && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="relative"
                style={{ width: "min(70vw, 320px)", height: "min(70vw, 320px)" }}
              >
                {[
                  "top-0 left-0 border-t-2 border-l-2",
                  "top-0 right-0 border-t-2 border-r-2",
                  "bottom-0 left-0 border-b-2 border-l-2",
                  "bottom-0 right-0 border-b-2 border-r-2",
                ].map((cls, i) => (
                  <span
                    key={i}
                    className={`absolute w-10 h-10 ${cls}`}
                    style={{ borderColor: "var(--accent)" }}
                  />
                ))}
                <div
                  className="absolute left-0 right-0 h-0.5"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 0 12px var(--accent)",
                    animation: "scan-line 2.2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          </>
        )}

        {state === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/70 text-sm">Starting camera...</p>
          </div>
        )}

        {state === "unsupported" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-white font-medium">Use your phone&apos;s camera app</p>
            <p className="text-white/60 text-sm">
              In-app scanning isn&apos;t supported in this browser. Open your
              native camera and point it at the QR code — it&apos;ll offer to
              open the link.
            </p>
          </div>
        )}

        {state === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-white font-medium">Camera permission denied</p>
            <p className="text-white/60 text-sm">
              Enter the 6-character code manually instead.
            </p>
          </div>
        )}
      </div>

      <div className="p-6 flex justify-center bg-black">
        <button
          onClick={onClose}
          className="px-6 h-11 border border-white/30 text-white/90 rounded-lg text-sm hover:border-white transition-colors"
        >
          Close
        </button>
      </div>

      <style>{`
        @keyframes scan-line {
          0%   { top: 0;    opacity: 0.3; }
          50%  { top: 100%; opacity: 1;   }
          100% { top: 0;    opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
