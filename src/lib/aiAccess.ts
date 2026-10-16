/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — AI ROUTE ACCESS (server-only)

   Every AI route is wrapped with withAiAccess():
     1. requires a valid signed `wt_session` cookie (401 otherwise)
     2. meters the request per user in Postgres:
        • "analysis" — the plan quota (free 5 / starter 20 / pro 100 /
          elite 300 per calendar month, IST). 402 when used up.
        • "detail"   — AI detail pages (bond / FX / MF / company
          intelligence) that call Gemini on page load. A daily fair-use
          cap, not the plan quota. 429 when reached.
        • "none"     — sign-in only (no AI cost, or a shared cache).
   A use is reserved before the handler runs (so parallel requests
   can't overshoot) and given back if the handler fails (status ≥ 400).

   The paid plan comes from the HMAC entitlement token, sent as the
   httpOnly `wt_ent` cookie (set by /api/payment/verify and
   /api/payment/validate). The first account to use a payment owns it.
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { PLAN_LIMITS, verifyEntitlement, type PlanTier } from "@/lib/entitlement";
import { claimEntitlement, dbConfigured, getUsageCount, refundUsage, reserveUsage } from "@/lib/db";

export type Meter = "analysis" | "detail" | "none";

export const ENTITLEMENT_COOKIE = "wt_ent";

/** Daily fair-use cap on AI detail pages, per plan. */
export const DETAIL_DAILY_LIMITS: Record<PlanTier, number> = {
  free: 30,
  starter: 60,
  pro: 150,
  elite: 300,
};

const PLAN_NAMES: Record<PlanTier, string> = { free: "Free", starter: "Starter", pro: "Pro", elite: "Elite" };

/** "2026-10" for the monthly quota, "2026-10-16" for the daily cap, in India time. */
export function usagePeriod(meter: "analysis" | "detail", now = new Date()): string {
  const ist = new Date(now.getTime() + 330 * 60_000).toISOString();
  return meter === "analysis" ? ist.slice(0, 7) : ist.slice(0, 10);
}

export function entitlementCookieOptions(expiresAt?: string) {
  const maxAge = expiresAt ? Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)) : 30 * 86_400;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function sessionEmail(req: NextRequest): string | null {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value)?.email ?? null;
}

/** The user's paid plan from the entitlement cookie, or free. Needs the database. */
export async function resolvePlan(req: NextRequest, email: string): Promise<PlanTier> {
  const ent = verifyEntitlement(req.cookies.get(ENTITLEMENT_COOKIE)?.value);
  if (!ent.valid || ent.plan === "free") return "free";
  const [body] = (req.cookies.get(ENTITLEMENT_COOKIE)?.value || "").split(".");
  let paymentId = "";
  try { paymentId = JSON.parse(Buffer.from(body, "base64url").toString("utf8")).paymentId || ""; } catch { /* free */ }
  if (!paymentId) return "free";
  const owner = await claimEntitlement(paymentId, email, ent.plan);
  return owner === email.toLowerCase() ? ent.plan : "free";
}

export interface UsageSnapshot {
  plan: PlanTier;
  used: number;
  limit: number;
  remaining: number;
  period: string;
}

export async function usageSnapshot(req: NextRequest, email: string): Promise<UsageSnapshot> {
  const plan = await resolvePlan(req, email);
  const period = usagePeriod("analysis");
  const used = await getUsageCount(email, "analysis", period);
  const limit = PLAN_LIMITS[plan];
  return { plan, used, limit, remaining: Math.max(0, limit - used), period };
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

export function signInRequired() {
  return json(401, {
    error: "Please sign in to use White Tiger's AI analysis. It's free: sign in with Google to get 5 analyses a month.",
    code: "auth_required",
  });
}

type Handler = (req: NextRequest) => Promise<Response>;

export function withAiAccess(meter: Meter, handler: Handler): Handler {
  return async (req: NextRequest) => {
    const email = sessionEmail(req);
    if (!email) return signInRequired();
    if (meter === "none") return handler(req);

    if (!dbConfigured()) {
      console.error("[ai-access] DATABASE_URL not set; blocking metered AI route");
      return json(503, { error: "AI analysis is temporarily unavailable. Please try again later.", code: "usage_unavailable" });
    }

    let plan: PlanTier;
    let reserved: { ok: boolean; used: number };
    const period = usagePeriod(meter);
    const limit = meter === "analysis" ? PLAN_LIMITS : DETAIL_DAILY_LIMITS;
    try {
      plan = await resolvePlan(req, email);
      reserved = await reserveUsage(email, meter, period, limit[plan]);
    } catch (e) {
      console.error("[ai-access] usage check failed:", e instanceof Error ? e.message : e);
      return json(503, { error: "AI analysis is temporarily unavailable. Please try again later.", code: "usage_unavailable" });
    }

    if (!reserved.ok) {
      const upgrade = plan === "elite" ? "" : " Upgrade your plan for more.";
      if (meter === "analysis") {
        return json(402, {
          error: `You've used all ${limit[plan]} AI analyses on the ${PLAN_NAMES[plan]} plan this month.${upgrade}`,
          code: "quota_exceeded", upgrade: plan !== "elite",
          plan, used: reserved.used, limit: limit[plan], remaining: 0, period,
        });
      }
      return json(429, {
        error: `You've reached today's limit of ${limit[plan]} AI insights. It resets at midnight (IST).${upgrade}`,
        code: "daily_limit", upgrade: plan !== "elite", plan, limit: limit[plan],
      });
    }

    let res: Response;
    try {
      res = await handler(req);
    } catch (e) {
      await refundUsage(email, meter, period).catch(() => {});
      throw e;
    }
    if (res.status >= 400) {
      await refundUsage(email, meter, period).catch(() => {});
      return res;
    }
    if (meter === "analysis") {
      try {
        res.headers.set("X-WT-Plan", plan);
        res.headers.set("X-WT-Usage-Used", String(reserved.used));
        res.headers.set("X-WT-Usage-Limit", String(limit[plan]));
        res.headers.set("X-WT-Usage-Remaining", String(Math.max(0, limit[plan] - reserved.used)));
      } catch { /* immutable headers: the client falls back to /api/usage */ }
    }
    return res;
  };
}
