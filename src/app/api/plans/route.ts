import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/program";

// Upsert built-in plans so DB always matches hardcoded definitions
async function syncBuiltInPlans() {
  const upserts = Object.values(PLANS).map((p) =>
    prisma.plan.upsert({
      where: { slug: p.id },
      update: {
        name: p.name,
        description: p.description,
        days: p.days as object,
      },
      create: {
        slug: p.id,
        name: p.name,
        description: p.description,
        builtIn: true,
        days: p.days as object,
      },
    })
  );
  await Promise.all(upserts);
}

export async function GET() {
  await syncBuiltInPlans();
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
