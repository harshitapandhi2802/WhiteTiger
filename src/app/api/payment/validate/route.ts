import { NextRequest, NextResponse } from "next/server";
import { verifyEntitlement, PLAN_LIMITS } from "@/lib/entitlement";

/**
 * Validates a stored entitlement token server-side. The client calls this on
 * load; if the token is missing/tampered/expired, the response downgrades the
 * user to the free tier — closing the localStorage plan-fabrication bypass.
 */
export async function POST(req: NextRequest) {
  try {
    let token: string | undefined;
    try {
      const body = await req.json();
      token = body?.token;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const result = verifyEntitlement(token);
    return NextResponse.json({
      valid: result.valid,
      plan: result.plan,
      limit: PLAN_LIMITS[result.plan],
      expiresAt: result.expiresAt ?? null,
      reason: result.reason ?? null,
    });
  } catch {
    // Fail safe: treat as free tier rather than crashing.
    return NextResponse.json({ valid: false, plan: "free", limit: PLAN_LIMITS.free }, { status: 200 });
  }
}
