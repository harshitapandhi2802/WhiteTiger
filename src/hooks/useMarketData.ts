"use client";
// ═══════════════════════════════════════════════════════════════════════════
// MARKET DATA HOOKS
// React hooks for consuming live market data with auto-refresh,
// loading states, error handling, and staleness detection.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchStockPrices,
  fetchCryptoPrices,
  fetchCommodityPrices,
  fetchForexRates,
  fetchMFNavs,
  fetchInternationalPrices,
  fetchBondYields,
  getDataHealth,
  type PriceData,
  type CryptoPriceData,
  type ForexRateData,
  type MFNavData,
  type BondYieldData,
  type DataHealth,
} from "@/lib/services/marketDataService";

interface UseMarketDataResult<T> {
  data: Record<string, T>;
  loading: boolean;
  error: string | null;
  source: string;
  isStale: boolean;
  lastUpdated: number;
  refresh: () => void;
}

// ─── Auto-refresh intervals (ms) ──────────────────────────────────
const REFRESH_INTERVALS: Record<string, number> = {
  stocks: 30_000,
  crypto: 20_000,
  commodities: 60_000,
  forex: 30_000,
  mf: 300_000,
  international: 60_000,
  bonds: 120_000,
};

/**
 * Generic market data hook with auto-refresh.
 */
function useGenericMarketData<T>(
  type: string,
  fetcher: (force?: boolean) => Promise<Record<string, T>>,
  enabled = true
): UseMarketDataResult<T> {
  const [data, setData] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;
    try {
      setLoading(prev => !prev ? true : prev); // only set if not already loading
      setError(null);
      const result = await fetcher(force);

      if (!mountedRef.current) return;

      if (Object.keys(result).length > 0) {
        setData(result);
        // Extract source from first item
        const firstItem = Object.values(result)[0] as unknown as { source?: string; isStale?: boolean };
        setSource(firstItem?.source || type);
        setIsStale(firstItem?.isStale || false);
        setLastUpdated(Date.now());
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setIsStale(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled, fetcher, type]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) fetchData();

    // Auto-refresh
    const interval = REFRESH_INTERVALS[type] || 60_000;
    intervalRef.current = setInterval(() => {
      if (enabled && mountedRef.current) fetchData();
    }, interval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, type, fetchData]);

  return { data, loading, error, source, isStale, lastUpdated, refresh };
}

// ═══════════════════════════════════════════════════════════════════
// TYPED HOOKS FOR EACH ASSET CLASS
// ═══════════════════════════════════════════════════════════════════

/** Live stock prices from NSE/Google Finance/Yahoo Finance */
export function useStockPrices(enabled = true): UseMarketDataResult<PriceData> {
  return useGenericMarketData("stocks", fetchStockPrices, enabled);
}

/** Live crypto prices from CoinDCX/CoinGecko */
export function useCryptoPrices(enabled = true): UseMarketDataResult<CryptoPriceData> {
  return useGenericMarketData("crypto", fetchCryptoPrices, enabled);
}

/** Live commodity prices from Yahoo Finance */
export function useCommodityPrices(enabled = true): UseMarketDataResult<PriceData> {
  return useGenericMarketData("commodities", fetchCommodityPrices, enabled);
}

/** Live forex rates from Yahoo Finance/exchangerate.host */
export function useForexRates(enabled = true): UseMarketDataResult<ForexRateData> {
  return useGenericMarketData("forex", fetchForexRates, enabled);
}

/** Mutual fund NAVs from mfapi.in */
export function useMFNavs(enabled = true): UseMarketDataResult<MFNavData> {
  return useGenericMarketData("mf", fetchMFNavs, enabled);
}

/** Bond yields from Yahoo Finance */
export function useBondYields(enabled = true): UseMarketDataResult<BondYieldData> {
  return useGenericMarketData("bonds", fetchBondYields, enabled);
}

/** International market prices from Google Finance */
export function useInternationalPrices(symbols?: string, enabled = true): UseMarketDataResult<PriceData> {
  const fetcher = useCallback(
    (force?: boolean) => fetchInternationalPrices(symbols, force),
    [symbols]
  );
  return useGenericMarketData("international", fetcher, enabled);
}

/** Data health status across all feeds */
export function useDataHealth(): Record<string, DataHealth> {
  const [health, setHealth] = useState<Record<string, DataHealth>>({});

  useEffect(() => {
    const update = () => setHealth(getDataHealth());
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, []);

  return health;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITY: Data source badge component helper
// ═══════════════════════════════════════════════════════════════════

export function getSourceColor(source: string): string {
  if (source.includes("nse")) return "#10b981";
  if (source.includes("coindcx")) return "#3b82f6";
  if (source.includes("coingecko")) return "#8b5cf6";
  if (source.includes("yahoo")) return "#6366f1";
  if (source.includes("google")) return "#f59e0b";
  if (source.includes("mfapi")) return "#06b6d4";
  if (source.includes("cached")) return "#f97316";
  if (source.includes("unavailable")) return "#ef4444";
  return "#64748b";
}

export function getSourceLabel(source: string): string {
  if (source.includes("nse")) return "NSE India";
  if (source.includes("coindcx")) return "CoinDCX";
  if (source.includes("coingecko")) return "CoinGecko";
  if (source.includes("yahoo")) return "Yahoo Finance";
  if (source.includes("google")) return "Google Finance";
  if (source.includes("mfapi")) return "AMFI";
  if (source.includes("cached")) return "Cached";
  if (source.includes("unavailable")) return "Offline";
  return source;
}
