import { NextRequest, NextResponse } from "next/server";

// Razorpay order creation endpoint
// Install razorpay: npm install razorpay
// Then uncomment the import and full implementation below

export async function POST(req: NextRequest) {
  const { plan } = await req.json();

  if (plan !== "pro") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // TODO: uncomment after: npm install razorpay
  // const Razorpay = require("razorpay");
  // const razorpay = new Razorpay({
  //   key_id: process.env.RAZORPAY_KEY_ID,
  //   key_secret: process.env.RAZORPAY_KEY_SECRET,
  // });
  // const order = await razorpay.orders.create({
  //   amount: 29900, // ₹299 in paise
  //   currency: "INR",
  //   receipt: `ml_pro_${Date.now()}`,
  // });
  // return NextResponse.json({ orderId: order.id, amount: order.amount });

  return NextResponse.json({
    message: "Payment integration ready — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local and uncomment the razorpay code above.",
  });
}
