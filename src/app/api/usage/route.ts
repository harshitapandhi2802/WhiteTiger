import { NextRequest, NextResponse } from "next/server";
import { dbConfigured } from "@/lib/db";
import { sessionEmail, usageSnapshot } from "@/lib/aiAccess";

/**
 * The signed-in user's AI analysis count for this month, from the database.
 * The /analyze page shows this instead of the browser-only counter.
 */
export async function GET(req: NextRequest) {
  const authConfigured = !!(process.env.SESSION_SECRET || process.env.ENTITLEMENT_SECRET || process.env.RAZORPAY_KEY_SECRET);
  const email = sessionEmail(req);
  if (!email) return NextResponse.json({ signedIn: false, authConfigured }, { headers: { "Cache-Control": "no-store" } });
  if (!dbConfigured()) {
    return NextResponse.json({ signedIn: true, authConfigured, error: "usage_unavailable" }, { status: 503 });
  }
  try {
    const snap = await usageSnapshot(req, email);
    return NextResponse.json({ signedIn: true, authConfigured, email, ...snap }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[usage] failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ signedIn: true, authConfigured, error: "usage_unavailable" }, { status: 503 });
  }
}
