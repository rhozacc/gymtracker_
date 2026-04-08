import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/program";

// Sync built-in plans: create if missing, but don't overwrite user edits (e.g. exercise renames)
async function syncBuiltInPlans() {
  const ops = Object.values(PLANS).map(async (p) => {
    const existing = await prisma.plan.findUnique({ where: { slug: p.id } });
    if (!existing) {
      await prisma.plan.create({
        data: {
          slug: p.id,
          name: p.name,
          description: p.description,
          builtIn: true,
          days: p.days as object,
        },
      });
    }
  });
  await Promise.all(ops);
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
