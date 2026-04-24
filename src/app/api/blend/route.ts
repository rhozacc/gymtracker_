import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DayDefinition } from "@/lib/program";

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function fetchKnownExerciseIds(userId: string): Promise<string[]> {
  const rows = await prisma.set.findMany({
    where: { session: { userId } },
    select: { exerciseId: true },
    distinct: ["exerciseId"],
    take: 500,
  });
  return rows.map((r) => r.exerciseId);
}

export async function POST(req: NextRequest) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const session = await auth.api.getSession({ headers: await headers() });
  const hostName = session?.user?.name ?? "Host";

  const body = await req.json().catch(() => ({}));
  const hostDayType: string | undefined = body.dayType;
  const hostDay: DayDefinition | undefined = body.day;

  const hostKnownExercises = await fetchKnownExerciseIds(userId!);

  let token = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateToken();
    const existing = await prisma.blendInvite.findUnique({
      where: { token: candidate },
    });
    if (!existing) {
      token = candidate;
      break;
    }
  }
  if (!token) {
    return NextResponse.json({ error: "Try again" }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const invite = await prisma.blendInvite.create({
    data: {
      token,
      hostId: userId!,
      hostName,
      hostDayType: hostDayType ?? null,
      hostDay: hostDay ? (hostDay as object) : undefined,
      hostKnownExercises,
      expiresAt,
    },
  });

  return NextResponse.json({ token: invite.token, expiresAt: invite.expiresAt });
}
