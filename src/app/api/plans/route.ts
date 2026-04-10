import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/program";
import { requireSession } from "@/lib/api-auth";

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
    } else if (existing.builtIn) {
      await prisma.plan.update({
        where: { slug: p.id },
        data: { name: p.name, description: p.description, days: p.days as object },
      });
    }
  });
  await Promise.all(ops);
}

export async function GET() {
  const { userId, res } = await requireSession();
  if (res) return res;

  await syncBuiltInPlans();
  const plans = await prisma.plan.findMany({
    where: { OR: [{ builtIn: true }, { userId }] },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const body = await req.json();
  const { slug, name, description, days } = body;

  if (!slug || !name || !days) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const plan = await prisma.plan.create({
    data: {
      userId,
      slug,
      name,
      description: description || "Custom plan",
      builtIn: false,
      days: days as object,
    },
  });

  return NextResponse.json(plan);
}
