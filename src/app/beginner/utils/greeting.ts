// Time-based greeting + market status helpers

export function getGreeting(): string {
  const hour = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false });
  const h = parseInt(hour, 10);
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function isMarketOpen(): { open: boolean; label: string; color: string } {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay(); // 0=Sun, 6=Sat
  const h = ist.getHours();
  const m = ist.getMinutes();
  const mins = h * 60 + m;

  if (day === 0 || day === 6) return { open: false, label: "Closed (Weekend)", color: "#64748b" };
  if (mins >= 555 && mins <= 930) return { open: true, label: "Market Open", color: "#10b981" };
  if (mins < 555) return { open: false, label: "Opens at 9:15 AM", color: "#f59e0b" };
  return { open: false, label: "Closed for today", color: "#64748b" };
}

export function getMarketMood(niftyChange: number): {
  emoji: string;
  label: string;
  color: string;
  message: string;
  score: number; // 0-100
} {
  if (niftyChange >= 1.5) return { emoji: "🚀", label: "Greedy", color: "#10b981", message: "Markets are on fire today! Great time to stay invested, but don't chase prices.", score: 90 };
  if (niftyChange >= 0.5) return { emoji: "😊", label: "Optimistic", color: "#34d399", message: "Markets are looking positive today. Most stocks are in the green zone!", score: 72 };
  if (niftyChange >= -0.3) return { emoji: "😐", label: "Neutral", color: "#f59e0b", message: "Markets are calm today. No big moves — a normal day for investors.", score: 50 };
  if (niftyChange >= -1) return { emoji: "😟", label: "Cautious", color: "#f97316", message: "Markets are slightly down, but this is perfectly normal. Stay patient!", score: 32 };
  return { emoji: "😰", label: "Fearful", color: "#ef4444", message: "Markets are having a rough day. Remember — short-term dips are temporary for long-term investors.", score: 15 };
}
