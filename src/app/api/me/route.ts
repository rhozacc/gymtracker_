import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, unlockedColors: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
