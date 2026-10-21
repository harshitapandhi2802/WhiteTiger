/**
 * Option chain from NSE's website (nseindia.com), the same data NSE shows
 * on its Option Chain page.
 *
 *   GET /api/fno/option-chain?underlying=NIFTY[&expiry=YYYY-MM-DD]
 *
 * underlying: an index (NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY, NIFTYNXT50)
 * or an F&O stock symbol (RELIANCE, TCS…).
 *
 * NSE sends prices, OI, volume and IV but no Greeks; delta/gamma/theta/vega
 * are calculated from NSE's IV (see lib/nse-chain). If NSE can't be reached,
 * the last good snapshot is returned marked stale; with none, an error. It
 * never falls back to generated data.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry, rateLimitResponse } from "@/lib/services/apiGuard";
import { NSE_INDICES, NSE_SYMBOL_RE, parseNseChain, parseNseExpiries, isoToNseDate, nseTimestampMs } from "@/lib/nse-chain";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/option-chain",
};

const CHAIN_FRESH_MS = 30_000;
const EXPIRY_TTL_MS = 30 * 60_000;
const STALE_MAX_MS = 6 * 3_600_000;

const expiryCache = new Map<string, { at: number; list: string[] }>();
const chainCache = new Map<string, { at: number; body: Record<string, unknown> }>();

/** A fresh NSE session cookie. Never reused: NSE stalls requests that carry an old one. */
async function freshCookie(): Promise<string> {
  const res = await fetchWithRetry("https://www.nseindia.com/option-chain", {
    breaker: "nse-cookie", retries: 0, timeoutMs: 5000,
    headers: { ...BROWSER_HEADERS, Accept: "text/html" }, redirect: "follow", cache: "no-store",
  });
  const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return list.map(c => c.split(";")[0].trim()).filter(Boolean).join("; ");
}

/** GET an NSE API path: first without a cookie, then once with a fresh session cookie. */
async function nseJson(path: string): Promise<unknown> {
  let lastError: unknown = null;
  for (const withCookie of [false, true]) {
    try {
      const headers: Record<string, string> = { ...BROWSER_HEADERS };
      if (withCookie) headers.Cookie = await freshCookie();
      const res = await fetchWithRetry(`https://www.nseindia.com/api/${path}`, {
        retries: 0, timeoutMs: 6000, headers, cache: "no-store",
      });
      if (res.status === 404) throw Object.assign(new Error("NSE has no option chain for this symbol"), { final: true });
      const type = res.headers.get("content-type") || "";
      if (res.ok && type.includes("json")) return await res.json();
      lastError = new Error(`NSE responded ${res.status}`);
    } catch (err) {
      if ((err as { final?: boolean }).final) throw err;
      lastError = err;
    }
  }
  throw new Error(`NSE did not return data (${lastError instanceof Error ? lastError.message : "unavailable"})`);
}

async function expiries(symbol: string): Promise<string[]> {
  const hit = expiryCache.get(symbol);
  if (hit && Date.now() - hit.at < EXPIRY_TTL_MS) return hit.list;
  const json = await nseJson(`option-chain-contract-info?symbol=${encodeURIComponent(symbol)}`);
  const today = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10); // IST date
  const list = parseNseExpiries(json).filter(d => d >= today);
  if (list.length) expiryCache.set(symbol, { at: Date.now(), list });
  return list;
}

export async function GET(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "fno-chain", limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  const symbol = (req.nextUrl.searchParams.get("underlying") || "NIFTY").toUpperCase().trim();
  if (!NSE_SYMBOL_RE.test(symbol)) return NextResponse.json({ status: "error", message: "Enter a valid NSE symbol" }, { status: 400 });
  const isIndex = symbol in NSE_INDICES;
  const asked = req.nextUrl.searchParams.get("expiry");

  try {
    const list = await expiries(symbol);
    if (list.length === 0) {
      return NextResponse.json({ status: "error", message: `${symbol} has no listed options on NSE` }, { status: 404 });
    }
    const expiry = asked && list.includes(asked) ? asked : list[0];
    const key = `${symbol}:${expiry}`;
    const hit = chainCache.get(key);
    if (hit && Date.now() - hit.at < CHAIN_FRESH_MS) return NextResponse.json(hit.body);

    const json = await nseJson(
      `option-chain-v3?type=${isIndex ? "Indices" : "Equity"}&symbol=${encodeURIComponent(symbol)}&expiry=${isoToNseDate(expiry)}`,
    );
    const chain = parseNseChain(json);
    if (chain.rows.length === 0 || chain.spot === null) throw new Error("NSE returned an empty option chain");

    const body = {
      ...chain,
      status: "ok",
      underlying: symbol,
      label: isIndex ? NSE_INDICES[symbol].label : symbol,
      expiry, expiries: list,
      lotSize: null,
      source: "NSE India website (nseindia.com)",
      greeksCalculated: true,
      dataTimeMs: nseTimestampMs(chain.dataTime),
      fetchedAt: Date.now(),
    };
    chainCache.set(key, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (err) {
    console.error("[fno/option-chain]", symbol, err);
    const prefix = `${symbol}:`;
    const stale = [...chainCache.entries()]
      .filter(([k, v]) => k.startsWith(prefix) && (!asked || k === `${symbol}:${asked}`) && Date.now() - v.at < STALE_MAX_MS)
      .sort((a, b) => b[1].at - a[1].at)[0];
    if (stale) return NextResponse.json({ ...stale[1].body, stale: true });
    const message = err instanceof Error ? err.message : "Option chain unavailable";
    return NextResponse.json({ status: "error", message }, { status: 502 });
  }
}
