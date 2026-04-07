import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { pin } = await request.json();
  const valid = pin === process.env.APP_PIN;
  return NextResponse.json({ valid });
}
