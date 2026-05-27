// ═══════════════════════════════════════════════════════════════════════════
// CENTRALIZED MARKET DATA SERVICE
// Single source of truth for all live market data across White Tiger
// Handles: Caching, Fallbacks, Rate Limiting, Error Recovery, Staleness
// ═══════════════════════════════════════════════════════════════════════════

export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  name?: string;
  currency?: string;
  timestamp: number;
  source: string;
  isStale: boolean;
}

export interface CryptoPriceData {
  usd: number;
  inr: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  timestamp: number;
  source: string;
  isStale: boolean;
}

export interface ForexRateData {
  rate: number;
  change24h: number;
  timestamp: number;
  source: string;
  isStale: boolean;
}

export interface MFNavData {
  nav: number;
  date: string;
  name: string;
  timestamp: number;
  source: string;
  isStale: boolean;
}

export interface BondYieldData {
  yield: number;
  change: number;
  name: string;
  timestamp: number;
  source: string;
  isStale: boolean;
}

export interface DataHealth {
  status: "healthy" | "degraded" | "offline";
  lastUpdate: number;
  source: string;
  latencyMs: number;
  errorCount: number;
  staleDataCount: number;
}

// ─── Cache Configuration ─────────────────────────────────────────
const CACHE_TTL: Record<string, number> = {
  crypto: 15_000,      // 15 sec — fast-moving
  stocks: 30_000,      // 30 sec — market hours
  commodities: 60_000, // 1 min
  forex: 30_000,       // 30 sec
  mf: 3600_000,        // 1 hour — NAV updates daily
  bonds: 300_000,      // 5 min
  international: 60_000, // 1 min
};

const STALE_THRESHOLD = 5 * 60_000; // 5 min = data is stale

// ─── In-Memory Cache ─────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  source: string;
  fetchLatency: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const healthMetrics: Record<string, { errors: number; lastSuccess: number; lastLatency: number }> = {};
let fetchInProgress = new Map<string, Promise<unknown>>();

// ─── Deduplication: prevent concurrent identical fetches ─────────
function deduplicatedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = fetchInProgress.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher().finally(() => fetchInProgress.delete(key));
  fetchInProgress.set(key, promise);
  return promise;
}

// ─── Cache helpers ───────────────────────────────────────────────
function getCached<T>(key: string, ttl: number): CacheEntry<T> | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp < ttl) return entry;
  return null; // expired
}

function getStaleCache<T>(key: string): CacheEntry<T> | null {
  return (cache.get(key) as CacheEntry<T> | undefined) || null;
}

function setCache<T>(key: string, data: T, source: string, latency: number): void {
  cache.set(key, { data, timestamp: Date.now(), source, fetchLatency: latency });
}

// ─── Track health metrics ────────────────────────────────────────
function recordSuccess(type: string, latency: number): void {
  if (!healthMetrics[type]) healthMetrics[type] = { errors: 0, lastSuccess: 0, lastLatency: 0 };
  healthMetrics[type].lastSuccess = Date.now();
  healthMetrics[type].lastLatency = latency;
  healthMetrics[type].errors = Math.max(0, healthMetrics[type].errors - 1); // decay errors
}

function recordError(type: string): void {
  if (!healthMetrics[type]) healthMetrics[type] = { errors: 0, lastSuccess: 0, lastLatency: 0 };
  healthMetrics[type].errors++;
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Fetch live prices for any asset type. Returns cached data if fresh,
 * otherwise fetches from /api/live-prices with automatic fallback to
 * stale cache on error.
 */
export async function fetchLivePrices(
  type: "crypto" | "stocks" | "commodities" | "forex" | "mf" | "international" | "bonds",
  options?: { symbols?: string; force?: boolean }
): Promise<{ data: Record<string, unknown>; source: string; isStale: boolean; latencyMs: number }> {
  const cacheKey = `live-${type}${options?.symbols ? `-${options.symbols}` : ""}`;
  const ttl = CACHE_TTL[type] || 60_000;

  // Check fresh cache first (unless force refresh)
  if (!options?.force) {
    const cached = getCached<Record<string, unknown>>(cacheKey, ttl);
    if (cached) {
      return { data: cached.data, source: cached.source, isStale: false, latencyMs: 0 };
    }
  }

  // Deduplicated fetch
  return deduplicatedFetch(cacheKey, async () => {
    const start = Date.now();
    try {
      let url = `/api/live-prices?type=${type}`;
      if (options?.symbols) url += `&symbols=${encodeURIComponent(options.symbols)}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const latency = Date.now() - start;
      const prices = json.prices || {};
      const source = json.source || type;

      setCache(cacheKey, prices, source, latency);
      recordSuccess(type, latency);

      return { data: prices, source, isStale: false, latencyMs: latency };
    } catch (err) {
      recordError(type);
      // Fallback to stale cache
      const stale = getStaleCache<Record<string, unknown>>(cacheKey);
      if (stale) {
        return {
          data: stale.data,
          source: `${stale.source} (cached)`,
          isStale: true,
          latencyMs: Date.now() - start,
        };
      }
      // No cache at all
      return { data: {}, source: "unavailable", isStale: true, latencyMs: Date.now() - start };
    }
  });
}

/**
 * Fetch stock prices with NSE → Google Finance → Yahoo Finance fallback chain.
 * Returns prices keyed by symbol (e.g., RELIANCE, TCS).
 */
export async function fetchStockPrices(force = false): Promise<Record<string, PriceData>> {
  const result = await fetchLivePrices("stocks", { force });
  const prices: Record<string, PriceData> = {};
  for (const [sym, data] of Object.entries(result.data)) {
    const d = data as { price: number; change: number; changePercent: number; name?: string };
    prices[sym] = {
      price: d.price || 0,
      change: d.change || 0,
      changePercent: d.changePercent || 0,
      name: d.name,
      timestamp: Date.now(),
      source: result.source,
      isStale: result.isStale,
    };
  }
  return prices;
}

/**
 * Fetch crypto prices with CoinDCX → CoinGecko fallback chain.
 * Returns prices keyed by symbol (e.g., BTC, ETH).
 */
export async function fetchCryptoPrices(force = false): Promise<Record<string, CryptoPriceData>> {
  const result = await fetchLivePrices("crypto", { force });
  const prices: Record<string, CryptoPriceData> = {};
  for (const [sym, data] of Object.entries(result.data)) {
    const d = data as { usd: number; inr: number; change24h: number };
    prices[sym] = {
      usd: d.usd || 0,
      inr: d.inr || 0,
      change24h: d.change24h || 0,
      timestamp: Date.now(),
      source: result.source,
      isStale: result.isStale,
    };
  }
  return prices;
}

/**
 * Fetch commodity prices with Yahoo Finance as primary source.
 */
export async function fetchCommodityPrices(force = false): Promise<Record<string, PriceData>> {
  const result = await fetchLivePrices("commodities", { force });
  const prices: Record<string, PriceData> = {};
  for (const [sym, data] of Object.entries(result.data)) {
    const d = data as { price: number; change: number; changePercent: number; name?: string; currency?: string };
    prices[sym] = {
      price: d.price || 0,
      change: d.change || 0,
      changePercent: d.changePercent || 0,
      name: d.name,
      currency: d.currency || "USD",
      timestamp: Date.now(),
      source: result.source,
      isStale: result.isStale,
    };
  }
  return prices;
}

/**
 * Fetch forex rates with Yahoo Finance → exchangerate.host fallback.
 */
export async function fetchForexRates(force = false): Promise<Record<string, ForexRateData>> {
  const result = await fetchLivePrices("forex", { force });
  const rates: Record<string, ForexRateData> = {};
  for (const [sym, data] of Object.entries(result.data)) {
    const d = data as { rate: number; change24h: number };
    rates[sym] = {
      rate: d.rate || 0,
      change24h: d.change24h || 0,
      timestamp: Date.now(),
      source: result.source,
      isStale: result.isStale,
    };
  }
  return rates;
}

/**
 * Fetch mutual fund NAVs from mfapi.in.
 */
export async function fetchMFNavs(force = false): Promise<Record<string, MFNavData>> {
  const result = await fetchLivePrices("mf", { force });
  const navs: Record<string, MFNavData> = {};
  for (const [sym, data] of Object.entries(result.data)) {
    const d = data as { nav: number; date: string; name: string };
    navs[sym] = {
      nav: d.nav || 0,
      date: d.date || "",
      name: d.name || sym,
      timestamp: Date.now(),
      source: result.source,
      isStale: result.isStale,
    };
  }
  return navs;
}

/**
 * Fetch bond yields from Yahoo Finance (Treasury symbols).
 */
export async function fetchBondYields(force = false): Promise<Record<string, BondYieldData>> {
  const result = await fetchLivePrices("bonds", { force });
  const yields: Record<string, BondYieldData> = {};
  for (const [sym, data] of Object.entries(result.data)) {
    const d = data as { yield: number; change: number; name: string };
    yields[sym] = {
      yield: d.yield || 0,
      change: d.change || 0,
      name: d.name || sym,
      timestamp: Date.now(),
      source: result.source,
      isStale: result.isStale,
    };
  }
  return yields;
}

/**
 * Fetch international market prices (indices + stocks).
 */
export async function fetchInternationalPrices(
  symbols?: string,
  force = false
): Promise<Record<string, PriceData>> {
  const result = await fetchLivePrices("international", { symbols, force });
  const prices: Record<string, PriceData> = {};
  for (const [sym, data] of Object.entries(result.data)) {
    const d = data as { price: number; change: number; changePercent: number; name?: string; currency?: string };
    prices[sym] = {
      price: d.price || 0,
      change: d.change || 0,
      changePercent: d.changePercent || 0,
      name: d.name,
      currency: d.currency,
      timestamp: Date.now(),
      source: result.source,
      isStale: result.isStale,
    };
  }
  return prices;
}

/**
 * Get health status for all data feeds.
 */
export function getDataHealth(): Record<string, DataHealth> {
  const now = Date.now();
  const health: Record<string, DataHealth> = {};

  for (const type of Object.keys(CACHE_TTL)) {
    const metrics = healthMetrics[type];
    const cacheEntry = cache.get(`live-${type}`);

    let status: "healthy" | "degraded" | "offline" = "offline";
    if (metrics?.lastSuccess && now - metrics.lastSuccess < STALE_THRESHOLD) {
      status = metrics.errors > 3 ? "degraded" : "healthy";
    } else if (metrics?.lastSuccess && now - metrics.lastSuccess < 30 * 60_000) {
      status = "degraded";
    }

    health[type] = {
      status,
      lastUpdate: metrics?.lastSuccess || 0,
      source: cacheEntry?.source || "none",
      latencyMs: metrics?.lastLatency || 0,
      errorCount: metrics?.errors || 0,
      staleDataCount: cacheEntry && now - cacheEntry.timestamp > STALE_THRESHOLD ? 1 : 0,
    };
  }

  return health;
}

/**
 * Force refresh all data feeds.
 */
export async function refreshAll(): Promise<void> {
  await Promise.allSettled([
    fetchLivePrices("stocks", { force: true }),
    fetchLivePrices("crypto", { force: true }),
    fetchLivePrices("commodities", { force: true }),
    fetchLivePrices("forex", { force: true }),
    fetchLivePrices("mf", { force: true }),
    fetchLivePrices("international", { force: true }),
    fetchLivePrices("bonds", { force: true }),
  ]);
}

/**
 * Clear all caches (useful for debugging).
 */
export function clearCache(): void {
  cache.clear();
  fetchInProgress.clear();
}
