import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const { res } = await requireSession();
  if (res) return res;

  const links = await prisma.exerciseLink.findMany();
  const map: Record<string, string> = {};
  for (const l of links) map[l.exerciseName] = l.url;
  return NextResponse.json(map);
}
