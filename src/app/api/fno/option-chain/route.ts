/**
 * Live option chain from the Upstox v2 API (broker market data).
 *
 *   GET /api/fno/option-chain?underlying=NIFTY[&expiry=YYYY-MM-DD]
 *
 * Needs UPSTOX_ACCESS_TOKEN (an Upstox analytics token: long-lived,
 * read-only market data). Without it the route answers
 * { status: "not_connected" } — it never falls back to generated data.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry, rateLimitResponse } from "@/lib/services/apiGuard";
import { UNDERLYINGS, parseUpstoxChain, parseExpiries, parseLotSize } from "@/lib/upstox-chain";

const API = "https://api.upstox.com/v2";
const FRESH_MS = 15_000;
const EXPIRY_TTL_MS = 6 * 3_600_000;

const chainCache = new Map<string, { at: number; body: unknown }>();
const expiryCache = new Map<string, { at: number; list: string[]; lots: Record<string, number> }>();

function headers(token: string) {
  return { Accept: "application/json", Authorization: `Bearer ${token}` };
}

async function expiries(key: string, token: string): Promise<{ list: string[]; lots: Record<string, number> }> {
  const hit = expiryCache.get(key);
  if (hit && Date.now() - hit.at < EXPIRY_TTL_MS) return hit;
  const res = await fetchWithRetry(`${API}/option/contract?instrument_key=${encodeURIComponent(key)}`, {
    breaker: "upstox-contracts", retries: 1, timeoutMs: 8000, headers: headers(token), cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstox contracts responded ${res.status}`);
  const today = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10); // IST date
  const json = await res.json();
  const list = parseExpiries(json).filter(d => d >= today);
  const lots: Record<string, number> = {};
  for (const d of list) { const n = parseLotSize(json, d); if (n) lots[d] = n; }
  const entry = { at: Date.now(), list, lots };
  expiryCache.set(key, entry);
  return entry;
}

export async function GET(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "fno-chain", limit: 40, windowMs: 60_000 });
  if (limited) return limited;

  const underlying = (req.nextUrl.searchParams.get("underlying") || "NIFTY").toUpperCase();
  const def = UNDERLYINGS[underlying];
  if (!def) return NextResponse.json({ status: "error", message: "Unknown underlying" }, { status: 400 });

  const token = process.env.UPSTOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({
      status: "not_connected",
      message: "The live option chain needs a broker data connection, which isn't set up yet.",
    }, { status: 503 });
  }

  try {
    const { list, lots } = await expiries(def.key, token);
    const asked = req.nextUrl.searchParams.get("expiry");
    const expiry = asked && list.includes(asked) ? asked : list[0];
    if (!expiry) throw new Error("No upcoming expiries returned");

    const cacheKey = `${underlying}:${expiry}`;
    const hit = chainCache.get(cacheKey);
    if (hit && Date.now() - hit.at < FRESH_MS) return NextResponse.json(hit.body);

    const res = await fetchWithRetry(
      `${API}/option/chain?instrument_key=${encodeURIComponent(def.key)}&expiry_date=${expiry}`,
      { breaker: "upstox-chain", retries: 1, timeoutMs: 8000, headers: headers(token), cache: "no-store" },
    );
    if (res.status === 401) throw new Error("Upstox rejected the access token (expired or revoked)");
    if (!res.ok) throw new Error(`Upstox option chain responded ${res.status}`);

    const chain = parseUpstoxChain(await res.json());
    if (chain.rows.length === 0 || chain.spot === null) throw new Error("Upstox returned an empty chain");

    const body = {
      ...chain,
      status: "ok", underlying, label: def.label, step: def.step,
      expiry, expiries: list, lotSize: lots[expiry] ?? null, source: "Upstox (NSE/BSE via broker API)",
      fetchedAt: Date.now(),
    };
    chainCache.set(cacheKey, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (err) {
    console.error("[fno/option-chain]", err);
    const stale = [...chainCache.entries()].find(([k]) => k.startsWith(`${underlying}:`));
    if (stale) return NextResponse.json({ ...(stale[1].body as object), stale: true });
    return NextResponse.json({ status: "error", message: err instanceof Error ? err.message : "Option chain unavailable" }, { status: 502 });
  }
}
