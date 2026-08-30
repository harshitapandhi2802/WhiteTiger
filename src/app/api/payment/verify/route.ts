import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { signEntitlement, type PlanTier } from "@/lib/entitlement";

export async function POST(req: NextRequest) {
  try {
    // Fail closed if the signing secret is not configured — never crash the route.
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("Payment verify: RAZORPAY_KEY_SECRET is not configured");
      return NextResponse.json(
        { error: "Payment verification is temporarily unavailable" },
        { status: 503 }
      );
    }

    let payload: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      plan?: string;
    };
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = payload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    // Constant-time comparison to avoid timing attacks on the signature check.
    const expectedBuf = Buffer.from(expectedSignature, "hex");
    const providedBuf = Buffer.from(razorpay_signature, "hex");
    const signatureValid =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf);

    if (!signatureValid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Issue a tamper-proof entitlement token so the plan can be validated
    // server-side later (a fabricated localStorage plan won't have one).
    const entitlement = signEntitlement((plan || "free") as PlanTier, razorpay_payment_id);

    return NextResponse.json({
      verified: true,
      plan,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      entitlement,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Payment verify error:", msg);
    return NextResponse.json({ error: "Payment verification error" }, { status: 500 });
  }
}
