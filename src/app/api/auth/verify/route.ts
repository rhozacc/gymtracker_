import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { headers } from "next/headers";

type Attempt = { count: number; firstAt: number };
const attempts = new Map<string, Attempt>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function clientKey(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  const appPin = process.env.APP_PIN;
  if (!appPin) {
    return NextResponse.json({ valid: false }, { status: 500 });
  }

  const key = clientKey(await headers());
  const now = Date.now();
  const prev = attempts.get(key);
  if (prev && now - prev.firstAt > WINDOW_MS) {
    attempts.delete(key);
  }
  const cur = attempts.get(key);
  if (cur && cur.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { valid: false, error: "Too many attempts" },
      { status: 429 }
    );
  }

  const { pin } = await request.json();
  const valid = typeof pin === "string" && constantTimeEqual(pin, appPin);

  if (!valid) {
    const slot = attempts.get(key) ?? { count: 0, firstAt: now };
    slot.count += 1;
    attempts.set(key, slot);
  } else {
    attempts.delete(key);
  }

  return NextResponse.json({ valid });
}
