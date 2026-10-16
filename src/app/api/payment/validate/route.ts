import { NextRequest, NextResponse } from "next/server";
import { verifyEntitlement, PLAN_LIMITS } from "@/lib/entitlement";
import { ENTITLEMENT_COOKIE, entitlementCookieOptions } from "@/lib/aiAccess";

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
    const res = NextResponse.json({
      valid: result.valid,
      plan: result.plan,
      limit: PLAN_LIMITS[result.plan],
      expiresAt: result.expiresAt ?? null,
      reason: result.reason ?? null,
    });
    // Plans bought before the AI routes checked plans server-side only live in
    // localStorage; copying a valid token into the cookie carries them over.
    if (result.valid && token) res.cookies.set(ENTITLEMENT_COOKIE, token, entitlementCookieOptions(result.expiresAt));
    else res.cookies.delete(ENTITLEMENT_COOKIE);
    return res;
  } catch {
    // Fail safe: treat as free tier rather than crashing.
    return NextResponse.json({ valid: false, plan: "free", limit: PLAN_LIMITS.free }, { status: 200 });
  }
}
