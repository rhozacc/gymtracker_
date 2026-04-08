import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const body = await req.json();
  const { name, description, days } = body;

  const plan = await prisma.plan.update({
    where: { slug: params.slug },
    data: {
      name,
      description,
      days: days as object,
    },
  });

  return NextResponse.json(plan);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const plan = await prisma.plan.findUnique({ where: { slug: params.slug } });
  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (plan.builtIn) {
    return NextResponse.json({ error: "Cannot delete built-in plan" }, { status: 400 });
  }

  await prisma.plan.delete({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true });
}
