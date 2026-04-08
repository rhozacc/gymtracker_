import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/program";

// Seed built-in plans if the table is empty
async function ensureSeeded() {
  const count = await prisma.plan.count();
  if (count > 0) return;

  const inserts = Object.values(PLANS).map((p) =>
    prisma.plan.create({
      data: {
        slug: p.id,
        name: p.name,
        description: p.description,
        builtIn: true,
        days: p.days as object,
      },
    })
  );
  await Promise.all(inserts);
}

export async function GET() {
  await ensureSeeded();
  const plans = await prisma.plan.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { slug, name, description, days } = body;

  if (!slug || !name || !days) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const plan = await prisma.plan.create({
    data: {
      slug,
      name,
      description: description || "Custom plan",
      builtIn: false,
      days: days as object,
    },
  });

  return NextResponse.json(plan);
}
