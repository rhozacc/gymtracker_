import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { pushToUser } from "@/lib/web-push";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { seconds, nextExercise, timerId } = await req.json();
  if (!seconds || !timerId) {
    return NextResponse.json({ error: "seconds and timerId required" }, { status: 400 });
  }

  // Register this timer (enables cancellation)
  await prisma.restTimerPush.upsert({
    where: { userId: userId! },
    update: { timerId, cancelled: false },
    create: { userId: userId!, timerId, cancelled: false },
  });

  // Wait for the rest period
  await new Promise((r) => setTimeout(r, Math.min(seconds, 295) * 1000));

  // Check if cancelled before firing
  const timer = await prisma.restTimerPush.findUnique({ where: { userId: userId! } });
  if (!timer || timer.timerId !== timerId || timer.cancelled) {
    return NextResponse.json({ ok: true, fired: false });
  }

  const doneBody = nextExercise
    ? `Time to lift! ${nextExercise.name} — ${nextExercise.weight} × ${nextExercise.reps}`
    : "Time to lift!";

  await pushToUser(userId!, {
    title: "Rest Complete",
    body: doneBody,
    tag: "gym-rest-timer",
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
  });

  return NextResponse.json({ ok: true, fired: true });
}
