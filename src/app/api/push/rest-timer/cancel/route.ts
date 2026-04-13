import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function POST(req: Request) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const { timerId } = await req.json();

  await prisma.restTimerPush.updateMany({
    where: { userId: userId!, ...(timerId ? { timerId } : {}) },
    data: { cancelled: true },
  });

  return NextResponse.json({ ok: true });
}
