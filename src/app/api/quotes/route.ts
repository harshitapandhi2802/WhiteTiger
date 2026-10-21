/**
 * Live quotes for specific Indian stocks (used by the paper portfolio).
 *
 *   GET /api/quotes?ids=RELIANCE,TCS,500325
 *
 * Accepts NSE symbols or BSE scrip codes from the bundled stock universe
 * (unknown ids are ignored). Source: TradingView India scanner, the same
 * feed the Stocks tab uses. Missing quotes are left out, never guessed.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry, rateLimitResponse } from "@/lib/services/apiGuard";
import { findStock, quoteKey } from "@/lib/stocks";

const MAX_IDS = 60;

export async function GET(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "quotes", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const ids = (req.nextUrl.searchParams.get("ids") || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, MAX_IDS);
  const tickers = new Map<string, string>(); // TradingView ticker → our quote key
  for (const id of ids) {
    const s = findStock(id);
    if (!s) continue;
    const key = quoteKey(s);
    tickers.set(s.nseSymbol ? `NSE:${s.nseSymbol}` : `BSE:${s.bseCode}`, key);
  }
  if (tickers.size === 0) return NextResponse.json({ quotes: {}, fetchedAt: Date.now(), source: "none" });

  try {
    const res = await fetchWithRetry("https://scanner.tradingview.com/india/scan", {
      breaker: "tv-india", retries: 1, timeoutMs: 8000, method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: { tickers: [...tickers.keys()] }, columns: ["close", "change", "change_abs", "description"] }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`TradingView responded ${res.status}`);
    const data = await res.json();
    const quotes: Record<string, { price: number; change: number; changePercent: number; name: string }> = {};
    for (const row of data.data || []) {
      const key = tickers.get(row.s);
      const [close, pct, abs, name] = row.d || [];
      if (!key || typeof close !== "number" || !(close > 0)) continue;
      quotes[key] = { price: close, changePercent: typeof pct === "number" ? pct : 0, change: typeof abs === "number" ? abs : 0, name: name || key };
    }
    return NextResponse.json({ quotes, fetchedAt: Date.now(), source: "TradingView (NSE/BSE)" });
  } catch (err) {
    console.error("[quotes]", err);
    return NextResponse.json({ quotes: {}, fetchedAt: Date.now(), source: "unavailable", error: "Live quotes are unavailable right now." }, { status: 502 });
  }
}
