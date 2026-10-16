/**
 * FII/FPI and DII daily trading activity — NSE provisional data.
 *
 * Source: nseindia.com/api/fiidiiTradeReact (the data behind NSE's FII/DII
 * report). Values are ₹ crore, provisional, published after market close.
 *
 * This route never fabricates data: if NSE is unreachable or returns an
 * unexpected/inconsistent shape, it responds { success: false } and the UI
 * shows "unavailable".
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry, rateLimitResponse } from "@/lib/services/apiGuard";
import { parseFiiDii, type Flow } from "@/lib/fiiDii";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/reports/fii-dii",
};

interface FiiDiiPayload {
  success: true;
  tradingDate: string;
  fii: Flow;
  dii: Flow;
  source: string;
  unit: "INR crore";
  provisional: true;
  fetchedAt: number;
  stale?: boolean;
}

const FRESH_MS = 5 * 60_000;
const MAX_STALE_MS = 6 * 3_600_000;
let cache: FiiDiiPayload | null = null;

async function nseCookies(): Promise<string> {
  const res = await fetchWithRetry("https://www.nseindia.com/", {
    breaker: "nse-cookie", retries: 1, timeoutMs: 6000,
    headers: { ...BROWSER_HEADERS, Accept: "text/html" }, redirect: "follow", cache: "no-store",
  });
  // getSetCookie() returns each cookie separately; splitting the joined header on "," breaks on Expires dates.
  const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return list.map(c => c.split(";")[0].trim()).filter(Boolean).join("; ");
}

export async function GET(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "fii-dii", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  if (cache && Date.now() - cache.fetchedAt < FRESH_MS) return NextResponse.json(cache);

  try {
    const cookies = await nseCookies();
    const res = await fetchWithRetry("https://www.nseindia.com/api/fiidiiTradeReact", {
      breaker: "nse-fiidii", retries: 2, timeoutMs: 8000,
      headers: { ...BROWSER_HEADERS, Cookie: cookies }, cache: "no-store",
    });
    if (!res.ok) throw new Error(`NSE responded ${res.status}`);
    const parsed = parseFiiDii(await res.json());
    cache = {
      success: true, ...parsed, source: "NSE India — FII/DII trading activity (provisional)",
      unit: "INR crore", provisional: true, fetchedAt: Date.now(),
    };
    return NextResponse.json(cache);
  } catch (err) {
    if (cache && Date.now() - cache.fetchedAt < MAX_STALE_MS) {
      return NextResponse.json({ ...cache, stale: true });
    }
    return NextResponse.json(
      { success: false, error: "FII/DII data is temporarily unavailable from NSE.", detail: err instanceof Error ? err.message : String(err) },
      { status: 503 }
    );
  }
}
