import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const PLANS: Record<string, { amount: number; name: string; analyses: number }> = {
  starter: { amount: 19900, name: "Starter", analyses: 20 },
  pro: { amount: 49900, name: "Pro", analyses: 100 },
  elite: { amount: 99900, name: "Elite", analyses: 300 },
};

export async function POST(req: NextRequest) {
  const { plan } = await req.json();

  const planConfig = PLANS[plan];
  if (!planConfig) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: planConfig.amount,
      currency: "INR",
      receipt: `ml_${plan}_${Date.now()}`,
      notes: {
        plan,
        analyses: String(planConfig.analyses),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      planName: planConfig.name,
      analyses: planConfig.analyses,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Razorpay order error:", msg);
    return NextResponse.json({ error: `Payment setup failed: ${msg}` }, { status: 500 });
  }
}
