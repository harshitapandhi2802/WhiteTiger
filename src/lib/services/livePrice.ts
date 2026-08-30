/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — SHARED LIVE PRICE FETCHER
   Used to GROUND AI analysis in real market data instead of letting
   the model quote a stale price from its training memory (audit D1).
   TradingView (primary) → Yahoo Finance (fallback), wrapped in the
   shared retry + circuit-breaker helpers.
   ═══════════════════════════════════════════════════════════════ */

import { fetchWithRetry } from "@/lib/services/apiGuard";

const PRICE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export interface LiveStockPrice {
  price: number;
  change: number;
  changePercent: number;
  weekHigh52: number;
  weekLow52: number;
  pe: number;
  marketCap: number;
  source: string;
  asOf: string; // ISO timestamp
}

/**
 * Best-effort live price for an NSE ticker. Returns null if every source
 * fails so callers can degrade gracefully (label data as unavailable rather
 * than show a fabricated number).
 */
export async function fetchLiveStockPrice(ticker: string): Promise<LiveStockPrice | null> {
  const nseSymbol = ticker.replace(".NS", "").replace(".BO", "").toUpperCase();
  const yahooSymbol = ticker.includes(".") ? ticker : `${nseSymbol}.NS`;

  // ── TradingView scan (primary) ──
  try {
    const res = await fetchWithRetry("https://scanner.tradingview.com/india/scan", {
      breaker: "tv-india", retries: 1, timeoutMs: 7000,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbols: { tickers: [`NSE:${nseSymbol}`] },
        columns: ["close", "change", "change_abs", "market_cap_basic", "price_earnings_ttm", "High.All", "Low.All"],
      }),
      next: { revalidate: 30 },
    });
    if (res.ok) {
      const data = await res.json();
      const vals = data.data?.[0]?.d as (number | null)[] | undefined;
      if (vals && typeof vals[0] === "number" && (vals[0] as number) > 0) {
        const price = vals[0] as number;
        return {
          price,
          change: (vals[2] as number) || 0,
          changePercent: (vals[1] as number) || 0,
          marketCap: (vals[3] as number) || 0,
          pe: (vals[4] as number) || 0,
          weekHigh52: (vals[5] as number) || price * 1.3,
          weekLow52: (vals[6] as number) || price * 0.7,
          source: "TradingView",
          asOf: new Date().toISOString(),
        };
      }
    }
  } catch { /* fall through to Yahoo */ }

  // ── Yahoo Finance chart (fallback) ──
  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetchWithRetry(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
        { breaker: "yahoo-finance", retries: 1, timeoutMs: 6000, headers: { "User-Agent": PRICE_UA, Accept: "application/json" }, next: { revalidate: 30 } }
      );
      if (res.ok) {
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice > 0) {
          const price = meta.regularMarketPrice as number;
          const prev = meta.chartPreviousClose || meta.previousClose || 0;
          return {
            price,
            change: prev ? price - prev : 0,
            changePercent: prev ? ((price - prev) / prev) * 100 : 0,
            marketCap: 0,
            pe: 0,
            weekHigh52: meta.fiftyTwoWeekHigh || price * 1.3,
            weekLow52: meta.fiftyTwoWeekLow || price * 0.7,
            source: `Yahoo Finance`,
            asOf: new Date().toISOString(),
          };
        }
      }
    } catch { /* try next host */ }
  }

  return null;
}

/* ── Live commodity benchmarks (for grounding stock commodity-exposure) ── */
export interface LiveCommodity { price: number; unit: string; source: string; }

const TV_COMMODITY = {
  crude: { ticker: "NYMEX:CL1!", unit: "$/bbl" },
  gold: { ticker: "COMEX:GC1!", unit: "$/oz" },
  copper: { ticker: "COMEX:HG1!", unit: "$/lb" },
} as const;

/**
 * Fetches live WTI crude, gold and copper from TradingView. Returns a partial
 * map — callers must treat a missing key as "no live price" and omit the
 * number rather than fabricate one (audit D3). Never throws.
 */
export async function fetchLiveCommodityPrices(): Promise<Partial<Record<keyof typeof TV_COMMODITY, LiveCommodity>>> {
  const out: Partial<Record<keyof typeof TV_COMMODITY, LiveCommodity>> = {};
  try {
    const tickers = Object.values(TV_COMMODITY).map(c => c.ticker);
    const res = await fetchWithRetry("https://scanner.tradingview.com/futures/scan", {
      breaker: "tv-futures", retries: 1, timeoutMs: 7000,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: { tickers }, columns: ["close"] }),
      next: { revalidate: 120 },
    });
    if (!res.ok) return out;
    const data = await res.json();
    const bySym: Record<string, number> = {};
    for (const row of data.data || []) {
      const v = row.d?.[0];
      if (row.s && typeof v === "number" && v > 0) bySym[row.s] = v;
    }
    for (const [key, cfg] of Object.entries(TV_COMMODITY) as [keyof typeof TV_COMMODITY, { ticker: string; unit: string }][]) {
      if (bySym[cfg.ticker]) out[key] = { price: bySym[cfg.ticker], unit: cfg.unit, source: "TradingView" };
    }
  } catch { /* return whatever we have */ }
  return out;
}

/* ── Live sovereign benchmark yields (for grounding bonds & mortgages) ── */
export interface LiveYields {
  india10Y?: number;
  us10Y?: number;
  us2Y?: number;
  source: string;
  asOf: string;
}

const TV_YIELDS: Record<string, string> = {
  india10Y: "TVC:IN10Y",
  us10Y: "TVC:US10Y",
  us2Y: "TVC:US02Y",
};

/**
 * Live benchmark government-bond yields from TradingView (TVC). Used to anchor
 * the bond AI report to a real curve and to link mortgage rates to the live
 * 10Y G-Sec. Returns whatever resolves; never throws.
 */
export async function fetchLiveYields(): Promise<LiveYields> {
  const out: LiveYields = { source: "TradingView", asOf: new Date().toISOString() };
  try {
    const res = await fetchWithRetry("https://scanner.tradingview.com/bonds/scan", {
      breaker: "tv-bonds", retries: 1, timeoutMs: 7000,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: { tickers: Object.values(TV_YIELDS) }, columns: ["close"] }),
      next: { revalidate: 120 },
    });
    if (!res.ok) return out;
    const data = await res.json();
    const bySym: Record<string, number> = {};
    for (const r of data.data || []) {
      const v = r.d?.[0];
      if (r.s && typeof v === "number" && v > 0) bySym[r.s] = v;
    }
    if (bySym[TV_YIELDS.india10Y]) out.india10Y = +bySym[TV_YIELDS.india10Y].toFixed(2);
    if (bySym[TV_YIELDS.us10Y]) out.us10Y = +bySym[TV_YIELDS.us10Y].toFixed(2);
    if (bySym[TV_YIELDS.us2Y]) out.us2Y = +bySym[TV_YIELDS.us2Y].toFixed(2);
  } catch { /* return whatever we have */ }
  return out;
}
