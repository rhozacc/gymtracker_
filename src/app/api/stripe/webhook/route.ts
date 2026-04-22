import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_COLOR_KEYS = ["violet", "warm", "rose"] as const;
type ColorKey = (typeof VALID_COLOR_KEYS)[number];

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let event: Stripe.Event;
  try {
    const body = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const ref = session.client_reference_id;

    if (ref && ref.includes(":")) {
      const colonIdx = ref.lastIndexOf(":");
      const userId = ref.slice(0, colonIdx);
      const colorKey = ref.slice(colonIdx + 1) as ColorKey;

      if (userId && VALID_COLOR_KEYS.includes(colorKey as ColorKey)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { unlockedColors: true },
        });

        if (user && !user.unlockedColors.includes(colorKey)) {
          await prisma.user.update({
            where: { id: userId },
            data: { unlockedColors: { push: colorKey } },
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
