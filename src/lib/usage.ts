const FREE_LIMIT = 5;
const STORAGE_KEY = "wt_usage";
const PLAN_KEY = "wt_plan";

// Migration: move old keys to new ones (one-time)
if (typeof window !== "undefined") {
  try {
    const oldUsage = localStorage.getItem("ml_usage");
    const oldPlan = localStorage.getItem("ml_plan");
    if (oldUsage) { localStorage.setItem("wt_usage", oldUsage); localStorage.removeItem("ml_usage"); }
    if (oldPlan) { localStorage.setItem("wt_plan", oldPlan); localStorage.removeItem("ml_plan"); }
  } catch { /* ignore */ }
}

interface UsageData {
  count: number;
  month: string;
}

export interface PlanData {
  plan: "free" | "starter" | "pro" | "elite";
  limit: number;
  paymentId?: string;
  activatedAt?: string;
  expiresAt?: string;
  token?: string; // server-signed entitlement (HMAC) — verified server-side
}

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  starter: 20,
  pro: 100,
  elite: 300,
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getPlan(): PlanData {
  if (typeof window === "undefined") return { plan: "free", limit: FREE_LIMIT };
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return { plan: "free", limit: FREE_LIMIT };
    const data: PlanData = JSON.parse(raw);
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      localStorage.removeItem(PLAN_KEY);
      return { plan: "free", limit: FREE_LIMIT };
    }
    return data;
  } catch {
    return { plan: "free", limit: FREE_LIMIT };
  }
}

export function activatePlan(plan: string, paymentId: string, token?: string): void {
  if (typeof window === "undefined") return;
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);

  const data: PlanData = {
    plan: plan as PlanData["plan"],
    limit: PLAN_LIMITS[plan] || FREE_LIMIT,
    paymentId,
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    token,
  };
  localStorage.setItem(PLAN_KEY, JSON.stringify(data));

  const usage = getUsage();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: usage.count, month: currentMonth() }));
}

/**
 * Confirms a stored paid plan with the server. A hand-fabricated localStorage
 * plan won't carry a valid HMAC token, so this downgrades it to free.
 * Free plans need no check. Returns the effective plan after validation.
 */
export async function validatePlanServerSide(): Promise<PlanData> {
  if (typeof window === "undefined") return { plan: "free", limit: FREE_LIMIT };
  const current = getPlan();
  if (current.plan === "free") return current;
  try {
    const res = await fetch("/api/payment/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: current.token }),
    });
    const v = await res.json();
    if (!v.valid || v.plan !== current.plan) {
      // Tampered / expired / unsigned paid plan → reset to free.
      localStorage.removeItem(PLAN_KEY);
      return { plan: "free", limit: FREE_LIMIT };
    }
    return current;
  } catch {
    // Network failure: don't punish a paying user — keep current plan.
    return current;
  }
}

export function getUsage(): UsageData {
  if (typeof window === "undefined") return { count: 0, month: currentMonth() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, month: currentMonth() };
    const data: UsageData = JSON.parse(raw);
    if (data.month !== currentMonth()) return { count: 0, month: currentMonth() };
    return data;
  } catch {
    return { count: 0, month: currentMonth() };
  }
}

export function incrementUsage(): void {
  if (typeof window === "undefined") return;
  const usage = getUsage();
  const next = { count: usage.count + 1, month: currentMonth() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function canAnalyze(): boolean {
  const plan = getPlan();
  return getUsage().count < plan.limit;
}

export function remainingAnalyses(): number {
  const plan = getPlan();
  return Math.max(0, plan.limit - getUsage().count);
}

export function getLimit(): number {
  return getPlan().limit;
}
