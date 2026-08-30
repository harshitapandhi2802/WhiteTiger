/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — PLAN ENTITLEMENT (server-side, tamper-proof)

   The client stores the active plan in localStorage, which a user could
   hand-edit to fabricate a paid tier. To close that bypass, payment
   verification issues an HMAC-signed entitlement token that encodes the
   plan + paymentId + expiry. The token can only be produced with the
   server secret, so a fabricated localStorage plan won't carry a valid
   token and is rejected server-side (see /api/payment/validate).

   This is the realistic server-side validation given there is no database
   in this project — entitlement authenticity is cryptographically
   enforced. (Per-user usage *metering* would still need a KV/DB.)
   ═══════════════════════════════════════════════════════════════ */

import crypto from "crypto";

export type PlanTier = "free" | "starter" | "pro" | "elite";

export const PLAN_LIMITS: Record<PlanTier, number> = {
  free: 5,
  starter: 20,
  pro: 100,
  elite: 300,
};

export interface EntitlementPayload {
  plan: PlanTier;
  paymentId: string;
  exp: number; // epoch ms expiry
}

function secret(): string {
  // Dedicated secret if provided, else reuse the Razorpay signing secret
  // (already required for payments). Never ships to the client.
  return process.env.ENTITLEMENT_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Produce a signed token: base64url(payload).base64url(hmac). */
export function signEntitlement(plan: PlanTier, paymentId: string, ttlDays = 30): string | null {
  const key = secret();
  if (!key) return null;
  const payload: EntitlementPayload = {
    plan,
    paymentId,
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", key).update(body).digest());
  return `${body}.${sig}`;
}

export interface VerifyResult {
  valid: boolean;
  plan: PlanTier;
  reason?: string;
  expiresAt?: string;
}

/** Verify a token's signature + expiry. Returns free tier when invalid. */
export function verifyEntitlement(token: string | null | undefined): VerifyResult {
  const key = secret();
  if (!key) return { valid: false, plan: "free", reason: "server-misconfigured" };
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, plan: "free", reason: "missing-token" };
  }
  const [body, sig] = token.split(".");
  const expected = b64url(crypto.createHmac("sha256", key).update(body).digest());

  // Constant-time signature comparison.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, plan: "free", reason: "bad-signature" };
  }

  let payload: EntitlementPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { valid: false, plan: "free", reason: "corrupt-payload" };
  }

  if (!payload.exp || payload.exp < Date.now()) {
    return { valid: false, plan: "free", reason: "expired" };
  }
  if (!PLAN_LIMITS[payload.plan]) {
    return { valid: false, plan: "free", reason: "unknown-plan" };
  }

  return { valid: true, plan: payload.plan, expiresAt: new Date(payload.exp).toISOString() };
}
