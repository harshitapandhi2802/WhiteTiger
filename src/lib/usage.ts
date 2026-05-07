// Simple cookie-based usage tracking for free tier (3 analyses/month)
// In production, replace with DB-backed tracking per user account

const FREE_LIMIT = 3;
const STORAGE_KEY = "ml_usage";

interface UsageData {
  count: number;
  month: string; // "YYYY-MM"
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  return getUsage().count < FREE_LIMIT;
}

export function remainingAnalyses(): number {
  return Math.max(0, FREE_LIMIT - getUsage().count);
}
