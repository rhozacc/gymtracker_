import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function POST(req: Request) {
  const { userId, res } = await requireSession();
  if (res) return res;

  try {
    const { routineId, category, dayType } = await req.json();

    if (!routineId || !category || !dayType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const entry = await prisma.extrasLog.create({
      data: { userId, routineId, category, dayType },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("extras/log POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
