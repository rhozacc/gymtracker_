import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

function isOwner(email: string) {
  return email === process.env.OWNER_EMAIL;
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
}

export async function POST(req: Request) {
  const { email, res } = await requireSession();
  if (res) return res;
  if (!isOwner(email!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const exerciseName = normalizeName(body.exerciseName ?? "");
  const url = body.url?.trim();
  if (!exerciseName || !url) return NextResponse.json({ error: "exerciseName and url required" }, { status: 400 });

  const entry = await prisma.exerciseLink.upsert({
    where: { exerciseName },
    update: { url },
    create: { exerciseName, url },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: Request) {
  const { email, res } = await requireSession();
  if (res) return res;
  if (!isOwner(email!)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const exerciseName = normalizeName(body.exerciseName ?? "");
  if (!exerciseName) return NextResponse.json({ error: "exerciseName required" }, { status: 400 });

  await prisma.exerciseLink.deleteMany({ where: { exerciseName } });
  return NextResponse.json({ deleted: true });
}
