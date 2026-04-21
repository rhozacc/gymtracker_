import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { validateDays } from "@/lib/validate-plan";

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const body = await req.json();
  const { name, description, days } = body;

  if (days !== undefined) {
    const daysError = validateDays(days);
    if (daysError) {
      return NextResponse.json({ error: daysError }, { status: 400 });
    }
  }

  const plan = await prisma.plan.findUnique({ where: { slug: params.slug } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!plan.builtIn && plan.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.plan.update({
    where: { slug: params.slug },
    data: { name, description, days: days as object },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { userId, res } = await requireSession();
  if (res) return res;

  const plan = await prisma.plan.findUnique({ where: { slug: params.slug } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (plan.builtIn) return NextResponse.json({ error: "Cannot delete built-in plan" }, { status: 400 });
  if (plan.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.plan.delete({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true });
}
