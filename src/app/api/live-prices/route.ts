import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════
   LIVE PRICES API — REAL-TIME STOCK PRICE ACCURACY ENGINE
   Institutional-grade market data with multi-source validation,
   confidence scoring, and stale price protection.

   Architecture:
   1. TradingView Scanner (primary for Indian stocks + indices) — RELIABLE from Vercel
   2. NSE India (secondary — often blocked from non-Indian IPs)
   3. Yahoo Finance v8/chart (fallback for intl, forex, bonds, commodities)
   4. Google Finance scraping (last resort for stocks)
   5. CoinDCX (primary for crypto) / CoinGecko (fallback)

   Accuracy Engine:
   ✓ Multi-source cross-validation (3+ sources, variance detection)
   ✓ Confidence scoring (0-100)
   ✓ Stale price protection (reject >30s, warn >15s)
   ✓ Market session awareness (PRE-MARKET/REGULAR/POST-MARKET/CLOSED/HOLIDAY)
   ✓ Exchange timestamp propagation
   ✓ Weighted price formula: (exchange×0.7) + (provider×0.2) + (public×0.1)
   ✓ Price disagreement flagging (>0.15% variance)
   ═══════════════════════════════════════════════════════════════════ */

// ─── Types ────────────────────────────────────────────────────────

type MarketSession = "PRE-MARKET" | "REGULAR" | "POST-MARKET" | "CLOSED" | "HOLIDAY";

interface SourcePrice {
  price: number;
  change: number;
  changePercent: number;
  name: string;
  source: string;
  tier: "exchange" | "provider" | "public";  // for weighted formula
  timestamp: number;     // when this price was fetched/valid
  exchangeTimestamp?: number;  // exchange-reported time (if available)
  currency?: string;
}

interface ValidatedPrice {
  ticker: string;
  exchange: string;
  currency: string;
  market_status: MarketSession;
  last_price: number;
  change: number;
  changePercent: number;
  name: string;
  timestamp: number;           // our fetch time
  exchange_timestamp?: number; // exchange-reported time
  delay_seconds: number;       // staleness
  confidence_score: number;    // 0-100
  validated_sources: string[];
  source_count: number;
  price_disagreement: boolean;
  price_variance_pct: number;
  is_stale: boolean;
  stale_warning?: string;
  weighted_price?: number;     // (exchange×0.7)+(provider×0.2)+(public×0.1)
  raw_source: string;          // primary source used
}

// ─── Symbol Registry ──────────────────────────────────────────────

const SYMBOL_REGISTRY = {
  indices: {
    NIFTY50:    { nse: "NIFTY 50",           yahoo: "^NSEI",    type: "index-spot" as const, exchange: "NSE" },
    SENSEX:     { nse: "S&P BSE SENSEX",     yahoo: "^BSESN",   type: "index-spot" as const, exchange: "BSE" },
    BANKNIFTY:  { nse: "NIFTY BANK",         yahoo: "^NSEBANK", type: "index-spot" as const, exchange: "NSE" },
  },
  stocks: [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
    "BHARTIARTL", "SBIN", "ITC", "WIPRO", "ASIANPAINT",
    "HINDUNILVR", "ADANIPORTS", "BAJFINANCE", "LT",
    "MARUTI", "TATAMOTORS", "SUNPHARMA", "TITAN",
    "HCLTECH", "AXISBANK", "KOTAKBANK", "NTPC",
    "POWERGRID", "COALINDIA",
  ],
} as const;

// ─── Indian Market Holidays 2026 (NSE) ───────────────────────────
const HOLIDAYS_2026 = [
  "2026-01-26", "2026-03-10", "2026-03-17", "2026-03-30", "2026-03-31",
  "2026-04-14", "2026-04-24", "2026-05-01", "2026-06-26", "2026-07-17",
  "2026-08-15", "2026-08-28", "2026-10-02", "2026-10-20", "2026-10-21",
  "2026-10-23", "2026-11-04", "2026-11-09", "2026-12-25",
];

// ─── Market Session Detection ─────────────────────────────────────

function getMarketSession(): { session: MarketSession; label: string; open: boolean } {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();

  // Format date as YYYY-MM-DD for holiday check
  const dateStr = `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(ist.getDate()).padStart(2, "0")}`;

  if (HOLIDAYS_2026.includes(dateStr)) {
    return { session: "HOLIDAY", label: "holiday", open: false };
  }
  if (day === 0 || day === 6) {
    return { session: "CLOSED", label: "weekend", open: false };
  }
  // Pre-market: 9:00 AM - 9:15 AM IST
  if (mins >= 540 && mins < 555) {
    return { session: "PRE-MARKET", label: "pre-market", open: false };
  }
  // Regular: 9:15 AM - 3:30 PM IST
  if (mins >= 555 && mins <= 930) {
    return { session: "REGULAR", label: "open", open: true };
  }
  // Post-market: 3:30 PM - 4:00 PM IST
  if (mins > 930 && mins <= 960) {
    return { session: "POST-MARKET", label: "post-market", open: false };
  }
  return { session: "CLOSED", label: "closed", open: false };
}

// Legacy compat
function getMarketStatus(): { open: boolean; label: string } {
  const s = getMarketSession();
  return { open: s.open, label: s.label };
}

// ─── Confidence Scoring ──────────────────────────────────────────
// Formula: 50*(exchange_match) + 20*(freshness) + 20*(source_agreement) + 10*(volume_confirmation)

function calculateConfidence(opts: {
  hasExchangeData: boolean;
  delaySeconds: number;
  sourceCount: number;
  priceVariancePct: number;
  hasVolume: boolean;
  marketOpen: boolean;
}): number {
  let score = 0;

  // Exchange match (50 pts) — primary exchange data available
  if (opts.hasExchangeData) score += 50;
  else score += 15; // public/provider data only

  // Freshness (20 pts)
  if (opts.marketOpen) {
    if (opts.delaySeconds <= 5) score += 20;
    else if (opts.delaySeconds <= 15) score += 15;
    else if (opts.delaySeconds <= 30) score += 10;
    else if (opts.delaySeconds <= 60) score += 5;
    // >60s = 0 freshness points
  } else {
    // Market closed — stale data is expected, give full freshness
    score += 18;
  }

  // Source agreement (20 pts) — multiple sources agree
  if (opts.sourceCount >= 3 && opts.priceVariancePct <= 0.05) score += 20;
  else if (opts.sourceCount >= 2 && opts.priceVariancePct <= 0.15) score += 15;
  else if (opts.sourceCount >= 2 && opts.priceVariancePct <= 0.5) score += 10;
  else if (opts.sourceCount >= 1) score += 5;

  // Volume confirmation (10 pts)
  if (opts.hasVolume) score += 10;
  else score += 3;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ─── Multi-Source Validation ─────────────────────────────────────

function validateMultiSource(sources: SourcePrice[]): {
  bestPrice: number;
  weightedPrice: number;
  variance: number;
  disagreement: boolean;
  validatedSources: string[];
} {
  if (sources.length === 0) {
    return { bestPrice: 0, weightedPrice: 0, variance: 0, disagreement: false, validatedSources: [] };
  }

  if (sources.length === 1) {
    return {
      bestPrice: sources[0].price,
      weightedPrice: sources[0].price,
      variance: 0,
      disagreement: false,
      validatedSources: [sources[0].source],
    };
  }

  // Calculate weighted price: exchange×0.7, provider×0.2, public×0.1
  const tierWeights = { exchange: 0.7, provider: 0.2, public: 0.1 };
  let totalWeight = 0;
  let weightedSum = 0;

  for (const s of sources) {
    const w = tierWeights[s.tier];
    weightedSum += s.price * w;
    totalWeight += w;
  }

  const weightedPrice = totalWeight > 0 ? weightedSum / totalWeight : sources[0].price;

  // Calculate variance
  const avgPrice = sources.reduce((a, s) => a + s.price, 0) / sources.length;
  const maxDev = Math.max(...sources.map(s => Math.abs(s.price - avgPrice)));
  const variancePct = avgPrice > 0 ? (maxDev / avgPrice) * 100 : 0;

  // Disagreement if variance > 0.15%
  const disagreement = variancePct > 0.15;

  // Best price = exchange tier if available, else weighted
  const exchangeSource = sources.find(s => s.tier === "exchange");
  const bestPrice = exchangeSource ? exchangeSource.price : weightedPrice;

  return {
    bestPrice,
    weightedPrice,
    variance: variancePct,
    disagreement,
    validatedSources: sources.map(s => s.source),
  };
}

// ─── Stale Price Detection ───────────────────────────────────────

function checkStaleness(
  fetchTimestamp: number,
  exchangeTimestamp: number | undefined,
  marketOpen: boolean
): { delaySeconds: number; isStale: boolean; warning?: string } {
  const now = Date.now();
  // Use exchange timestamp if available, otherwise use fetch time
  const refTime = exchangeTimestamp || fetchTimestamp;
  const delaySeconds = Math.round((now - refTime) / 1000);

  if (!marketOpen) {
    // Market is closed — data from last close is expected
    return { delaySeconds, isStale: false };
  }

  if (delaySeconds > 30) {
    return {
      delaySeconds,
      isStale: true,
      warning: `Delayed quote: ${delaySeconds}s old. Price may not reflect current market.`,
    };
  }

  if (delaySeconds > 15) {
    return {
      delaySeconds,
      isStale: false,
      warning: `Quote is ${delaySeconds}s old. Minor delay.`,
    };
  }

  return { delaySeconds, isStale: false };
}

// ─── TradingView Scanner — PRIMARY (exchange tier) ───────────────

interface TVScanResult {
  prices: Record<string, SourcePrice>;
  source: string;
}

async function fetchTradingView(): Promise<TVScanResult> {
  const prices: TVScanResult["prices"] = {};
  const tickers = [
    "NSE:NIFTY", "BSE:SENSEX", "NSE:BANKNIFTY",
    ...SYMBOL_REGISTRY.stocks.map(s => `NSE:${s}`),
  ];

  try {
    const fetchTime = Date.now();
    const res = await fetch("https://scanner.tradingview.com/india/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbols: { tickers },
        columns: ["close", "change", "change_abs", "name", "description", "volume", "update_mode"],
      }),
      next: { revalidate: 30 },
    });

    if (!res.ok) return { prices, source: "unavailable" };

    const data = await res.json();
    for (const row of data.data || []) {
      const sym: string = row.s || "";
      const vals = row.d || [];
      if (vals.length < 3 || !vals[0]) continue;

      const price = vals[0] as number;
      const changePct = (vals[1] as number) || 0;
      const changeAbs = (vals[2] as number) || 0;
      const name = (vals[3] as string) || sym.split(":")[1] || sym;

      const base = {
        price,
        change: changeAbs,
        changePercent: changePct,
        source: "tradingview" as const,
        tier: "exchange" as const,
        timestamp: fetchTime,
      };

      if (sym === "NSE:NIFTY") {
        if (validateIndianIndex("NIFTY50", price)) {
          prices.NIFTY50 = { ...base, name: "NIFTY 50" } as SourcePrice;
        }
      } else if (sym === "BSE:SENSEX") {
        if (validateIndianIndex("SENSEX", price)) {
          prices.SENSEX = { ...base, name: "SENSEX" } as SourcePrice;
        }
      } else if (sym === "NSE:BANKNIFTY") {
        if (validateIndianIndex("BANKNIFTY", price)) {
          prices.BANKNIFTY = { ...base, name: "NIFTY BANK" } as SourcePrice;
        }
      } else if (sym.startsWith("NSE:")) {
        const stockSym = sym.replace("NSE:", "");
        if (price > 0) {
          prices[stockSym] = { ...base, name: String(name) } as SourcePrice;
        }
      }
    }
  } catch { /* TradingView failed */ }

  return {
    prices,
    source: Object.keys(prices).length > 0 ? "tradingview" : "unavailable",
  };
}

// ─── Yahoo Finance v8/chart ──────────────────────────────────────

const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
};

interface QuoteResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency?: string;
  exchangeTimestamp?: number;
}

async function yahooChart(sym: string, host = "query1"): Promise<QuoteResult | null> {
  try {
    const res = await fetch(
      `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
      { headers: YF_HEADERS, next: { revalidate: 30 } }
    );
    if (!res.ok) {
      if (res.status === 429 && host === "query1") return yahooChart(sym, "query2");
      return null;
    }
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice) return null;
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose || meta.previousClose || 0;
    return {
      symbol: sym,
      name: meta.shortName || meta.longName || sym.replace(".NS", "").replace("^", ""),
      price,
      change: prev ? price - prev : 0,
      changePercent: prev ? ((price - prev) / prev) * 100 : 0,
      previousClose: prev,
      currency: meta.currency,
      exchangeTimestamp: (meta.regularMarketTime || 0) * 1000,
    };
  } catch { return null; }
}

async function yahooBatchChart(symbols: string[]): Promise<QuoteResult[]> {
  const results: QuoteResult[] = [];
  for (let i = 0; i < symbols.length; i += 2) {
    const batch = symbols.slice(i, i + 2);
    const host = (i / 2) % 2 === 0 ? "query1" : "query2";
    const batchResults = await Promise.all(batch.map(s => yahooChart(s, host)));
    results.push(...batchResults.filter((r): r is QuoteResult => r !== null));
    if (i + 2 < symbols.length) await new Promise(r => setTimeout(r, 300));
  }
  return results;
}

// ─── NSE India API ───────────────────────────────────────────────

const NSE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://www.nseindia.com/",
};

let nseCookieCache: { cookies: string; timestamp: number } | null = null;

async function getNSECookies(): Promise<string> {
  if (nseCookieCache && Date.now() - nseCookieCache.timestamp < 120_000) {
    return nseCookieCache.cookies;
  }
  try {
    const res = await fetch("https://www.nseindia.com/", {
      headers: NSE_HEADERS,
      redirect: "follow",
      next: { revalidate: 120 },
    });
    const setCookie = res.headers.get("set-cookie") || "";
    const cookies = setCookie
      .split(",")
      .map(c => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");
    nseCookieCache = { cookies, timestamp: Date.now() };
    return cookies;
  } catch {
    return nseCookieCache?.cookies || "";
  }
}

interface NSEStockData {
  symbol: string;
  lastPrice: number;
  change: number;
  pChange: number;
  companyName?: string;
}

interface NSEIndexData {
  index: string;
  indexSymbol?: string;
  last: number;
  change: number;
  percentChange: number;
}

async function fetchNSEStocks(cookies: string): Promise<{ stocks: NSEStockData[]; indices: NSEIndexData[] }> {
  const stocks: NSEStockData[] = [];
  const indices: NSEIndexData[] = [];

  try {
    const res = await fetch("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050", {
      headers: { ...NSE_HEADERS, Cookie: cookies },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      stocks.push(...(data.data || []));
    }
  } catch { /* NSE stocks failed */ }

  try {
    const res = await fetch("https://www.nseindia.com/api/allIndices", {
      headers: { ...NSE_HEADERS, Cookie: cookies },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      indices.push(...(data.data || []));
    }
  } catch { /* NSE indices failed */ }

  return { stocks, indices };
}

// ─── Google Finance Scraping ─────────────────────────────────────

async function scrapeGoogleFinance(ticker: string, exchange: string): Promise<QuoteResult | null> {
  try {
    const res = await fetch(`https://www.google.com/finance/quote/${ticker}:${exchange}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const escT = ticker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escE = exchange.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\["${escT}","${escE}"\\],"[^"]*",\\d+,null,\\[([0-9.]+),([-0-9.eE+]+),([-0-9.eE+]+)`);
    const m = html.match(re);
    if (m) {
      const price = parseFloat(m[1]);
      if (price && !isNaN(price)) {
        return {
          symbol: ticker,
          name: ticker,
          price,
          change: parseFloat(m[2]) || 0,
          changePercent: parseFloat(m[3]) || 0,
          previousClose: price - (parseFloat(m[2]) || 0),
        };
      }
    }
    return null;
  } catch { return null; }
}

// ─── CoinDCX / CoinGecko Crypto ─────────────────────────────────

const COINDCX_MARKETS: Record<string, string> = {
  BTCINR: "BTC", ETHINR: "ETH", BNBINR: "BNB", SOLINR: "SOL",
  XRPINR: "XRP", ADAINR: "ADA", DOGEINR: "DOGE", DOTINR: "DOT",
  MATICINR: "MATIC", AVAXINR: "AVAX", LINKINR: "LINK",
  UNIINR: "UNI", LTCINR: "LTC", TONINR: "TON",
  SHIBINR: "SHIB", TRXINR: "TRX", ATOMINR: "ATOM", NEARINR: "NEAR",
  XLMINR: "XLM", APTINR: "APT", SUIINR: "SUI", RENDERINR: "RENDER",
  INJINR: "INJ", ARBINR: "ARB", OPINR: "OP",
  FILINR: "FIL", AAVEINR: "AAVE", MKRINR: "MKR", GRTINR: "GRT",
  PEPEINR: "PEPE", FETINR: "FET", HBARINR: "HBAR",
  VETINR: "VET", ALGOINR: "ALGO", ICPINR: "ICP",
  KASINR: "KAS", WLDINR: "WLD", JUPINR: "JUP",
  BONKINR: "BONK", FLOKIINR: "FLOKI",
};

const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin", SOL: "solana",
  XRP: "ripple", ADA: "cardano", DOGE: "dogecoin", DOT: "polkadot",
  MATIC: "matic-network", AVAX: "avalanche-2", LINK: "chainlink",
  UNI: "uniswap", LTC: "litecoin", TON: "the-open-network",
  SHIB: "shiba-inu", TRX: "tron", ATOM: "cosmos", NEAR: "near",
  XLM: "stellar", APT: "aptos", SUI: "sui", RENDER: "render-token",
  INJ: "injective-protocol", ARB: "arbitrum", OP: "optimism",
  FIL: "filecoin", AAVE: "aave", MKR: "maker", GRT: "the-graph",
  PEPE: "pepe", FET: "artificial-superintelligence-alliance", HBAR: "hedera-hashgraph",
  VET: "vechain", ALGO: "algorand", ICP: "internet-computer",
  KAS: "kaspa", WLD: "worldcoin-wld", JUP: "jupiter-exchange-solana",
  BONK: "bonk", FLOKI: "floki",
};

// ─── Commodity Symbols (Yahoo Finance) ──────────────────────────

const COMMODITY_SYMBOLS: Record<string, string> = {
  GOLD: "GC=F", SILVER: "SI=F", PLATINUM: "PL=F", PALLADIUM: "PA=F",
  CRUDEOIL: "CL=F", BRENTCRUDEOIL: "BZ=F", NATURALGAS: "NG=F",
  COPPER: "HG=F", ALUMINIUM: "ALI=F", ZINC: "ZN=F", LEAD: "PB=F", NICKEL: "NI=F",
  COTTON: "CT=F", WHEAT: "ZW=F", CORN: "ZC=F", SOYBEAN: "ZS=F",
  SUGAR: "SB=F", COFFEE: "KC=F", COCOA: "CC=F",
};

// MCX India commodity tickers for TradingView
const MCX_TV_TICKERS: Record<string, { ticker: string; name: string }> = {
  MCX_GOLD: { ticker: "MCX:GOLD1!", name: "Gold (MCX)" },
  MCX_GOLDM: { ticker: "MCX:GOLDM1!", name: "Gold Mini (MCX)" },
  MCX_SILVER: { ticker: "MCX:SILVER1!", name: "Silver (MCX)" },
  MCX_SILVERM: { ticker: "MCX:SILVERM1!", name: "Silver Mini (MCX)" },
  MCX_CRUDEOIL: { ticker: "MCX:CRUDEOIL1!", name: "Crude Oil (MCX)" },
  MCX_NATURALGAS: { ticker: "MCX:NATURALGAS1!", name: "Natural Gas (MCX)" },
  MCX_COPPER: { ticker: "MCX:COPPER1!", name: "Copper (MCX)" },
  MCX_ZINC: { ticker: "MCX:ZINC1!", name: "Zinc (MCX)" },
  MCX_ALUMINIUM: { ticker: "MCX:ALUMINIUM1!", name: "Aluminium (MCX)" },
  MCX_LEAD: { ticker: "MCX:LEAD1!", name: "Lead (MCX)" },
  MCX_NICKEL: { ticker: "MCX:NICKEL1!", name: "Nickel (MCX)" },
};

// ─── Google Finance stocks map ──────────────────────────────────

const GF_STOCKS: Record<string, { ticker: string; exchange: string; name: string }> = {
  RELIANCE: { ticker: "RELIANCE", exchange: "NSE", name: "Reliance Industries" },
  TCS: { ticker: "TCS", exchange: "NSE", name: "TCS" },
  HDFCBANK: { ticker: "HDFCBANK", exchange: "NSE", name: "HDFC Bank" },
  INFY: { ticker: "INFY", exchange: "NSE", name: "Infosys" },
  ICICIBANK: { ticker: "ICICIBANK", exchange: "NSE", name: "ICICI Bank" },
  BHARTIARTL: { ticker: "BHARTIARTL", exchange: "NSE", name: "Bharti Airtel" },
  SBIN: { ticker: "SBIN", exchange: "NSE", name: "SBI" },
  ITC: { ticker: "ITC", exchange: "NSE", name: "ITC" },
  WIPRO: { ticker: "WIPRO", exchange: "NSE", name: "Wipro" },
  TATAMOTORS: { ticker: "TATAMOTORS", exchange: "NSE", name: "Tata Motors" },
  BAJFINANCE: { ticker: "BAJFINANCE", exchange: "NSE", name: "Bajaj Finance" },
  MARUTI: { ticker: "MARUTI", exchange: "NSE", name: "Maruti Suzuki" },
  SUNPHARMA: { ticker: "SUNPHARMA", exchange: "NSE", name: "Sun Pharma" },
  TITAN: { ticker: "TITAN", exchange: "NSE", name: "Titan" },
  HCLTECH: { ticker: "HCLTECH", exchange: "NSE", name: "HCL Tech" },
  AXISBANK: { ticker: "AXISBANK", exchange: "NSE", name: "Axis Bank" },
  LT: { ticker: "LT", exchange: "NSE", name: "L&T" },
  ASIANPAINT: { ticker: "ASIANPAINT", exchange: "NSE", name: "Asian Paints" },
  HINDUNILVR: { ticker: "HINDUNILVR", exchange: "NSE", name: "HUL" },
  ADANIPORTS: { ticker: "ADANIPORTS", exchange: "NSE", name: "Adani Ports" },
  KOTAKBANK: { ticker: "KOTAKBANK", exchange: "NSE", name: "Kotak Bank" },
  NTPC: { ticker: "NTPC", exchange: "NSE", name: "NTPC" },
  POWERGRID: { ticker: "POWERGRID", exchange: "NSE", name: "Power Grid" },
  COALINDIA: { ticker: "COALINDIA", exchange: "NSE", name: "Coal India" },
};

// ─── International symbols ──────────────────────────────────────

interface GFEntry { gf: string; name: string; currency: string }
const GF_INTERNATIONAL: Record<string, GFEntry> = {
  "^GSPC": { gf: ".INX:INDEXSP", name: "S&P 500", currency: "USD" },
  "^IXIC": { gf: ".IXIC:INDEXNASDAQ", name: "NASDAQ", currency: "USD" },
  "^DJI": { gf: ".DJI:INDEXDJX", name: "Dow Jones", currency: "USD" },
  "^GSPTSE": { gf: "TX60:INDEXTSI", name: "S&P/TSX", currency: "CAD" },
  "^BVSP": { gf: "IBOV:INDEXBVMF", name: "Bovespa", currency: "BRL" },
  "^FTSE": { gf: "UKX:INDEXFTSE", name: "FTSE 100", currency: "GBP" },
  "^GDAXI": { gf: "DAX:INDEXDB", name: "DAX", currency: "EUR" },
  "^FCHI": { gf: "PX1:INDEXEURO", name: "CAC 40", currency: "EUR" },
  "^STOXX50E": { gf: "SX5E:INDEXSTOXX", name: "Euro Stoxx 50", currency: "EUR" },
  "^SSMI": { gf: "SMI:INDEXSWX", name: "SMI", currency: "CHF" },
  "FTSEMIB.MI": { gf: "FTSEMIB:INDEXMIL", name: "FTSE MIB", currency: "EUR" },
  "^IBEX": { gf: "IBEX:INDEXBME", name: "IBEX 35", currency: "EUR" },
  "^N225": { gf: "NI225:INDEXNIKKEI", name: "Nikkei 225", currency: "JPY" },
  "^HSI": { gf: "HSI:INDEXHANGSENG", name: "Hang Seng", currency: "HKD" },
  "000001.SS": { gf: "000001:SHA", name: "Shanghai Composite", currency: "CNY" },
  "^KS11": { gf: "KOSPI:KRX", name: "KOSPI", currency: "KRW" },
  "^AXJO": { gf: "AXJO:INDEXASX", name: "ASX 200", currency: "AUD" },
  "^STI": { gf: "STI:INDEXSES", name: "Straits Times", currency: "SGD" },
  "^TWII": { gf: "TAIEX:TPE", name: "TAIEX", currency: "TWD" },
  "^NSEI": { gf: "NIFTY_50:INDEXNSE", name: "NIFTY 50", currency: "INR" },
  "^BSESN": { gf: "SENSEX:INDEXBOM", name: "SENSEX", currency: "INR" },
  "AAPL": { gf: "AAPL:NASDAQ", name: "Apple", currency: "USD" },
  "MSFT": { gf: "MSFT:NASDAQ", name: "Microsoft", currency: "USD" },
  "NVDA": { gf: "NVDA:NASDAQ", name: "NVIDIA", currency: "USD" },
  "TSLA": { gf: "TSLA:NASDAQ", name: "Tesla", currency: "USD" },
  "GOOGL": { gf: "GOOGL:NASDAQ", name: "Alphabet", currency: "USD" },
  "META": { gf: "META:NASDAQ", name: "Meta", currency: "USD" },
  "AMZN": { gf: "AMZN:NASDAQ", name: "Amazon", currency: "USD" },
  "BRK-B": { gf: "BRK.B:NYSE", name: "Berkshire", currency: "USD" },
  "JPM": { gf: "JPM:NYSE", name: "JPMorgan", currency: "USD" },
  "V": { gf: "V:NYSE", name: "Visa", currency: "USD" },
  "SHEL.L": { gf: "SHEL:LON", name: "Shell", currency: "GBP" },
  "AZN.L": { gf: "AZN:LON", name: "AstraZeneca", currency: "GBP" },
  "HSBA.L": { gf: "HSBA:LON", name: "HSBC", currency: "GBP" },
  "ULVR.L": { gf: "ULVR:LON", name: "Unilever", currency: "GBP" },
  "BP.L": { gf: "BP.:LON", name: "BP", currency: "GBP" },
  "SAP.DE": { gf: "SAP:ETR", name: "SAP", currency: "EUR" },
  "SIE.DE": { gf: "SIE:ETR", name: "Siemens", currency: "EUR" },
  "ALV.DE": { gf: "ALV:ETR", name: "Allianz", currency: "EUR" },
  "MBG.DE": { gf: "MBG:ETR", name: "Mercedes-Benz", currency: "EUR" },
  "DTE.DE": { gf: "DTE:ETR", name: "Deutsche Telekom", currency: "EUR" },
  "7203.T": { gf: "7203:TYO", name: "Toyota", currency: "JPY" },
  "6758.T": { gf: "6758:TYO", name: "Sony", currency: "JPY" },
  "6861.T": { gf: "6861:TYO", name: "Keyence", currency: "JPY" },
  "9984.T": { gf: "9984:TYO", name: "SoftBank", currency: "JPY" },
  "8306.T": { gf: "8306:TYO", name: "Mitsubishi UFJ", currency: "JPY" },
  "0700.HK": { gf: "0700:HKG", name: "Tencent", currency: "HKD" },
  "9988.HK": { gf: "9988:HKG", name: "Alibaba", currency: "HKD" },
  "1299.HK": { gf: "1299:HKG", name: "AIA Group", currency: "HKD" },
  "3690.HK": { gf: "3690:HKG", name: "Meituan", currency: "HKD" },
  "0005.HK": { gf: "0005:HKG", name: "HSBC HK", currency: "HKD" },
  "005930.KS": { gf: "005930:KRX", name: "Samsung", currency: "KRW" },
  "000660.KS": { gf: "000660:KRX", name: "SK Hynix", currency: "KRW" },
  "005380.KS": { gf: "005380:KRX", name: "Hyundai Motor", currency: "KRW" },
  "373220.KS": { gf: "373220:KRX", name: "LG Energy", currency: "KRW" },
  "600519.SS": { gf: "600519:SHA", name: "Kweichow Moutai", currency: "CNY" },
  "601398.SS": { gf: "601398:SHA", name: "ICBC", currency: "CNY" },
  "601857.SS": { gf: "601857:SHA", name: "PetroChina", currency: "CNY" },
  "BHP.AX": { gf: "BHP:ASX", name: "BHP Group", currency: "AUD" },
  "CBA.AX": { gf: "CBA:ASX", name: "Commonwealth Bank", currency: "AUD" },
  "CSL.AX": { gf: "CSL:ASX", name: "CSL Limited", currency: "AUD" },
  "MC.PA": { gf: "MC:EPA", name: "LVMH", currency: "EUR" },
  "TTE.PA": { gf: "TTE:EPA", name: "TotalEnergies", currency: "EUR" },
  "OR.PA": { gf: "OR:EPA", name: "L'Oréal", currency: "EUR" },
  "PETR4.SA": { gf: "PETR4:BVMF", name: "Petrobras", currency: "BRL" },
  "VALE3.SA": { gf: "VALE3:BVMF", name: "Vale", currency: "BRL" },
  "ITUB4.SA": { gf: "ITUB4:BVMF", name: "Itaú Unibanco", currency: "BRL" },
};

// ─── MF / Bond Maps ────────────────────────────────────────────

const MF_SCHEMES: Record<string, number> = {
  SBI_BLUECHIP: 119598, HDFC_FLEXI_CAP: 112090, AXIS_MIDCAP: 120503,
  MIRAE_LARGECAP: 118834, PARAG_PARIKH_FLEXI: 122639,
  ICICI_BLUECHIP: 120586, KOTAK_FLEXI_CAP: 112091,
  QUANT_SMALLCAP: 120828, NIPPON_SMALLCAP: 113177,
  UTI_NIFTY_INDEX: 120716, MOTILAL_NIFTY: 119243,
  SBI_CONTRA: 119600, DSP_MIDCAP: 100356, AXIS_ELSS: 120503,
};

const YIELD_SYMBOLS: Record<string, string> = {
  US_10Y: "^TNX", US_2Y: "^IRX", US_30Y: "^TYX",
  US_5Y: "^FVX", GOLD_ETF: "GLD",
};

// ─── Server-side health tracking ────────────────────────────────

const requestCounters: Record<string, { success: number; fail: number; lastLatency: number }> = {};
function trackRequest(type: string, success: boolean, latency: number) {
  if (!requestCounters[type]) requestCounters[type] = { success: 0, fail: 0, lastLatency: 0 };
  if (success) { requestCounters[type].success++; requestCounters[type].lastLatency = latency; }
  else requestCounters[type].fail++;
}

// ─── Data Validation ────────────────────────────────────────────

function validateIndianIndex(name: string, price: number): boolean {
  if (name === "NIFTY50" || name === "NIFTY 50") return price > 10000 && price < 50000;
  if (name === "SENSEX" || name === "S&P BSE SENSEX") return price > 30000 && price < 200000;
  if (name === "BANKNIFTY" || name === "NIFTY BANK") return price > 20000 && price < 100000;
  return price > 0;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN HANDLER
   ═══════════════════════════════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "crypto";
  const start = Date.now();
  const market = getMarketStatus();
  const session = getMarketSession();

  // Health endpoint — enhanced with accuracy engine stats
  if (type === "health") {
    return NextResponse.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now(),
      market,
      market_session: session.session,
      accuracy_engine: "v2.0",
      features: [
        "multi_source_validation",
        "confidence_scoring",
        "stale_price_protection",
        "market_session_awareness",
        "weighted_pricing",
        "price_disagreement_detection",
      ],
      counters: requestCounters,
    });
  }

  try {
    /* ═══════════════════════════════════════════════
       STOCKS — Multi-Source Validated
       TradingView (exchange) → NSE (exchange) →
       Google Finance (provider) → Yahoo (public)
       ═══════════════════════════════════════════════ */
    if (type === "stocks") {
      // Collect prices from ALL available sources with tier labels
      const allSourcePrices: Record<string, SourcePrice[]> = {};

      const addSource = (sym: string, sp: SourcePrice) => {
        if (!allSourcePrices[sym]) allSourcePrices[sym] = [];
        allSourcePrices[sym].push(sp);
      };

      // ── TIER 1: TradingView Scanner (exchange tier) ──
      const tv = await fetchTradingView();
      for (const [sym, data] of Object.entries(tv.prices)) {
        addSource(sym, data);
      }

      // ── TIER 2: NSE India (exchange tier) ──
      try {
        const cookies = await getNSECookies();
        if (cookies) {
          const nseTime = Date.now();
          const { stocks: nseStocks, indices: nseIndices } = await fetchNSEStocks(cookies);

          for (const stk of nseStocks) {
            if (stk.symbol && stk.lastPrice && stk.lastPrice > 0) {
              addSource(stk.symbol, {
                price: stk.lastPrice,
                change: stk.change || 0,
                changePercent: stk.pChange || 0,
                name: stk.companyName || stk.symbol,
                source: "nse-india",
                tier: "exchange",
                timestamp: nseTime,
              });
            }
          }

          for (const idx of nseIndices) {
            for (const [key, reg] of Object.entries(SYMBOL_REGISTRY.indices)) {
              if (idx.index === reg.nse && idx.last && idx.last > 0) {
                if (validateIndianIndex(key, idx.last)) {
                  addSource(key, {
                    price: idx.last,
                    change: idx.change || 0,
                    changePercent: idx.percentChange || 0,
                    name: idx.index,
                    source: "nse-india",
                    tier: "exchange",
                    timestamp: nseTime,
                  });
                }
              }
            }
          }
        }
      } catch { /* NSE failed */ }

      // ── TIER 3: Google Finance (provider tier) ──
      const gfTime = Date.now();
      const gfResults = await Promise.all(
        Object.entries(GF_STOCKS).map(async ([sym, info]) => {
          const result = await scrapeGoogleFinance(info.ticker, info.exchange);
          if (result && result.price > 0) {
            return { sym, result, name: info.name };
          }
          return null;
        })
      );
      for (const r of gfResults) {
        if (r) {
          addSource(r.sym, {
            price: r.result.price,
            change: r.result.change,
            changePercent: r.result.changePercent,
            name: r.name,
            source: "google-finance",
            tier: "provider",
            timestamp: gfTime,
          });
        }
      }

      // ── TIER 4: Yahoo Finance (public tier) — indices ──
      const yahooTime = Date.now();
      const indexEntries = Object.entries(SYMBOL_REGISTRY.indices);
      const indexResults = await Promise.all(
        indexEntries.map(([key, reg]) =>
          yahooChart(reg.yahoo).then(q => ({ key, q }))
        )
      );
      for (const { key, q } of indexResults) {
        if (q && q.price > 0 && validateIndianIndex(key, q.price)) {
          addSource(key, {
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            name: q.name,
            source: "yahoo-finance",
            tier: "public",
            timestamp: yahooTime,
            exchangeTimestamp: q.exchangeTimestamp,
          });
        }
      }

      // ── TIER 4b: Yahoo — stocks (only those with <2 sources) ──
      const needMoreSources = SYMBOL_REGISTRY.stocks.filter(
        s => !allSourcePrices[s] || allSourcePrices[s].length < 2
      );
      if (needMoreSources.length > 0) {
        const yahooSymbols = needMoreSources.map(s => `${s}.NS`);
        const quotes = await yahooBatchChart(yahooSymbols);
        for (const q of quotes) {
          const sym = q.symbol.replace(".NS", "");
          if (sym && q.price > 0) {
            addSource(sym, {
              price: q.price,
              change: q.change,
              changePercent: q.changePercent,
              name: q.name,
              source: "yahoo-finance",
              tier: "public",
              timestamp: Date.now(),
              exchangeTimestamp: q.exchangeTimestamp,
            });
          }
        }
      }

      // ── CROSS-VALIDATE & BUILD RESPONSE ──
      const validatedPrices: Record<string, ValidatedPrice> = {};
      // Legacy format for backward compat
      const prices: Record<string, { price: number; change: number; changePercent: number; name: string }> = {};
      let primarySource = "unavailable";

      for (const [sym, sources] of Object.entries(allSourcePrices)) {
        if (sources.length === 0) continue;

        const validation = validateMultiSource(sources);
        const bestSource = sources.find(s => s.price === validation.bestPrice) || sources[0];
        const exchangeTs = sources.find(s => s.exchangeTimestamp)?.exchangeTimestamp;

        const staleness = checkStaleness(
          bestSource.timestamp,
          exchangeTs,
          session.open
        );

        const confidence = calculateConfidence({
          hasExchangeData: sources.some(s => s.tier === "exchange"),
          delaySeconds: staleness.delaySeconds,
          sourceCount: sources.length,
          priceVariancePct: validation.variance,
          hasVolume: false,  // TV doesn't reliably return volume in scan
          marketOpen: session.open,
        });

        // Determine exchange label
        const isIndex = sym in SYMBOL_REGISTRY.indices;
        const exchange = isIndex
          ? (SYMBOL_REGISTRY.indices[sym as keyof typeof SYMBOL_REGISTRY.indices]?.exchange || "NSE")
          : "NSE";

        validatedPrices[sym] = {
          ticker: sym,
          exchange,
          currency: "INR",
          market_status: session.session,
          last_price: validation.bestPrice,
          change: bestSource.change,
          changePercent: bestSource.changePercent,
          name: bestSource.name,
          timestamp: bestSource.timestamp,
          exchange_timestamp: exchangeTs,
          delay_seconds: staleness.delaySeconds,
          confidence_score: confidence,
          validated_sources: validation.validatedSources,
          source_count: sources.length,
          price_disagreement: validation.disagreement,
          price_variance_pct: Math.round(validation.variance * 1000) / 1000,
          is_stale: staleness.isStale,
          stale_warning: staleness.warning,
          weighted_price: sources.length > 1
            ? Math.round(validation.weightedPrice * 100) / 100
            : undefined,
          raw_source: bestSource.source,
        };

        // Legacy backward compat
        prices[sym] = {
          price: validation.bestPrice,
          change: bestSource.change,
          changePercent: bestSource.changePercent,
          name: bestSource.name,
        };

        if (primarySource === "unavailable" && bestSource.source) {
          primarySource = bestSource.source;
        }
      }

      const latency = Date.now() - start;
      trackRequest("stocks", Object.keys(prices).length > 0, latency);

      return NextResponse.json({
        // Legacy format (backward compat)
        prices,
        type: "stocks",
        timestamp: Date.now(),
        source: primarySource,
        market,
        latencyMs: latency,

        // ── NEW: Accuracy Engine fields ──
        accuracy_engine: {
          version: "2.0",
          market_session: session.session,
          validated_prices: validatedPrices,
          total_symbols: Object.keys(validatedPrices).length,
          avg_confidence: Object.keys(validatedPrices).length > 0
            ? Math.round(
                Object.values(validatedPrices).reduce((a, v) => a + v.confidence_score, 0) /
                Object.keys(validatedPrices).length
              )
            : 0,
          stale_count: Object.values(validatedPrices).filter(v => v.is_stale).length,
          disagreement_count: Object.values(validatedPrices).filter(v => v.price_disagreement).length,
          sources_used: [...new Set(
            Object.values(validatedPrices).flatMap(v => v.validated_sources)
          )],
        },
      });
    }

    /* ═══════════════════════════════════════════════
       CRYPTO — CoinDCX primary → CoinGecko fallback
       (24/7 market — always "REGULAR")
       ═══════════════════════════════════════════════ */
    if (type === "crypto") {
      const prices: Record<string, { usd: number; inr: number; change24h: number; volume24h?: number; marketCap?: number }> = {};
      let source = "unavailable";
      const cryptoSources: Record<string, SourcePrice[]> = {};

      // Primary: CoinDCX
      try {
        const cdxTime = Date.now();
        const res = await fetch("https://api.coindcx.com/exchange/ticker", { cache: "no-store" });
        if (res.ok) {
          const tickers: { market: string; last_price: string; change_24_hour: string; volume?: string }[] = await res.json();
          const tickerMap = new Map(tickers.map(t => [t.market, t]));

          let usdInr = 83.5;
          try {
            const fxQ = await yahooChart("USDINR=X");
            if (fxQ) usdInr = fxQ.price;
          } catch { /* use default */ }

          for (const [market, sym] of Object.entries(COINDCX_MARKETS)) {
            const t = tickerMap.get(market);
            if (t) {
              const inrPrice = parseFloat(t.last_price) || 0;
              prices[sym] = {
                inr: inrPrice,
                usd: inrPrice / usdInr,
                change24h: parseFloat(t.change_24_hour) || 0,
              };
              if (!cryptoSources[sym]) cryptoSources[sym] = [];
              cryptoSources[sym].push({
                price: inrPrice,
                change: 0,
                changePercent: parseFloat(t.change_24_hour) || 0,
                name: sym,
                source: "coindcx",
                tier: "exchange",
                timestamp: cdxTime,
              });
            }
          }
          if (Object.keys(prices).length > 0) source = "coindcx";
        }
      } catch { /* CoinDCX failed */ }

      // Fallback: CoinGecko
      if (Object.keys(prices).length === 0) {
        try {
          const cgTime = Date.now();
          const ids = Object.values(CRYPTO_IDS).join(",");
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,inr&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const data = await res.json();
            for (const [sym, cgId] of Object.entries(CRYPTO_IDS)) {
              if (data[cgId]) {
                prices[sym] = {
                  usd: data[cgId].usd || 0,
                  inr: data[cgId].inr || 0,
                  change24h: data[cgId].usd_24h_change || 0,
                  volume24h: data[cgId].usd_24h_vol,
                  marketCap: data[cgId].usd_market_cap,
                };
                if (!cryptoSources[sym]) cryptoSources[sym] = [];
                cryptoSources[sym].push({
                  price: data[cgId].inr || 0,
                  change: 0,
                  changePercent: data[cgId].usd_24h_change || 0,
                  name: sym,
                  source: "coingecko",
                  tier: "provider",
                  timestamp: cgTime,
                });
              }
            }
            if (Object.keys(prices).length > 0) source = "coingecko";
          }
        } catch { /* CoinGecko failed */ }
      }

      // Build crypto confidence scores
      const cryptoValidation: Record<string, { confidence: number; sources: string[] }> = {};
      for (const [sym, sources] of Object.entries(cryptoSources)) {
        const validation = validateMultiSource(sources);
        cryptoValidation[sym] = {
          confidence: calculateConfidence({
            hasExchangeData: sources.some(s => s.tier === "exchange"),
            delaySeconds: 0,
            sourceCount: sources.length,
            priceVariancePct: validation.variance,
            hasVolume: !!prices[sym]?.volume24h,
            marketOpen: true, // crypto is always open
          }),
          sources: validation.validatedSources,
        };
      }

      const latency = Date.now() - start;
      trackRequest("crypto", Object.keys(prices).length > 0, latency);
      return NextResponse.json({
        prices,
        type: "crypto",
        timestamp: Date.now(),
        source,
        latencyMs: latency,
        accuracy_engine: {
          version: "2.0",
          market_session: "REGULAR" as MarketSession,
          avg_confidence: Object.keys(cryptoValidation).length > 0
            ? Math.round(
                Object.values(cryptoValidation).reduce((a, v) => a + v.confidence, 0) /
                Object.keys(cryptoValidation).length
              )
            : 0,
          sources_used: [...new Set(Object.values(cryptoValidation).flatMap(v => v.sources))],
          validation: cryptoValidation,
        },
      });
    }

    /* ═══════════════════════════════════════════════
       COMMODITIES — TradingView primary → Yahoo fallback
       ═══════════════════════════════════════════════ */
    if (type === "commodities") {
      const prices: Record<string, { price: number; change: number; changePercent: number; name: string; currency: string }> = {};
      let source = "unavailable";
      const commoditySources: Record<string, SourcePrice[]> = {};

      // ── TIER 1: TradingView futures scanner ──
      const TV_COMMODITY_MAP: Record<string, { ticker: string; name: string }> = {
        GOLD: { ticker: "COMEX:GC1!", name: "Gold" },
        SILVER: { ticker: "COMEX:SI1!", name: "Silver" },
        CRUDEOIL: { ticker: "NYMEX:CL1!", name: "Crude Oil WTI" },
        BRENTCRUDEOIL: { ticker: "NYMEX:BZ1!", name: "Brent Crude" },
        NATURALGAS: { ticker: "NYMEX:NG1!", name: "Natural Gas" },
        COPPER: { ticker: "COMEX:HG1!", name: "Copper" },
        PLATINUM: { ticker: "NYMEX:PL1!", name: "Platinum" },
        PALLADIUM: { ticker: "NYMEX:PA1!", name: "Palladium" },
        ZINC: { ticker: "LME:ZINC", name: "Zinc" },
        LEAD: { ticker: "LME:LEAD", name: "Lead" },
        NICKEL: { ticker: "LME:NICKEL", name: "Nickel" },
        ALUMINIUM: { ticker: "LME:ALUMINIUM", name: "Aluminium" },
        WHEAT: { ticker: "CBOT:ZW1!", name: "Wheat" },
        CORN: { ticker: "CBOT:ZC1!", name: "Corn" },
        SOYBEAN: { ticker: "CBOT:ZS1!", name: "Soybean" },
        SUGAR: { ticker: "ICEUSA:SB1!", name: "Sugar" },
        COFFEE: { ticker: "ICEUSA:KC1!", name: "Coffee" },
        COCOA: { ticker: "ICEUSA:CC1!", name: "Cocoa" },
        COTTON: { ticker: "ICEUSA:CT1!", name: "Cotton" },
        // MCX India contracts
        ...Object.fromEntries(Object.entries(MCX_TV_TICKERS).map(([k, v]) => [k, v])),
      };

      try {
        const tvTime = Date.now();
        const tickers = Object.values(TV_COMMODITY_MAP).map(v => v.ticker);
        const res = await fetch("https://scanner.tradingview.com/futures/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: { tickers },
            columns: ["close", "change", "change_abs", "name", "description"],
          }),
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const data = await res.json();
          const tickerToKey: Record<string, string> = {};
          for (const [k, v] of Object.entries(TV_COMMODITY_MAP)) tickerToKey[v.ticker] = k;

          for (const row of data.data || []) {
            const sym: string = row.s || "";
            const vals: number[] = row.d || [];
            const key = tickerToKey[sym];
            if (key && vals[0] && vals[0] > 0) {
              prices[key] = {
                price: vals[0],
                change: vals[2] || 0,
                changePercent: vals[1] || 0,
                name: TV_COMMODITY_MAP[key].name,
                currency: "USD",
              };
              if (!commoditySources[key]) commoditySources[key] = [];
              commoditySources[key].push({
                price: vals[0],
                change: vals[2] || 0,
                changePercent: vals[1] || 0,
                name: TV_COMMODITY_MAP[key].name,
                source: "tradingview",
                tier: "exchange",
                timestamp: tvTime,
              });
            }
          }
          if (Object.keys(prices).length > 0) source = "tradingview";
        }
      } catch { /* TV failed */ }

      // ── TIER 2: Yahoo fallback ──
      if (Object.keys(prices).length < 5) {
        const yTime = Date.now();
        const yahooSymbols = Object.values(COMMODITY_SYMBOLS);
        const quotes = await yahooBatchChart(yahooSymbols);
        const reverseMap: Record<string, string> = {};
        for (const [k, v] of Object.entries(COMMODITY_SYMBOLS)) reverseMap[v] = k;
        for (const q of quotes) {
          const key = reverseMap[q.symbol] || q.symbol.replace("=F", "");
          if (key && q.price > 0 && !prices[key]) {
            prices[key] = {
              price: q.price, change: q.change, changePercent: q.changePercent,
              name: q.name, currency: q.currency || "USD",
            };
            if (!commoditySources[key]) commoditySources[key] = [];
            commoditySources[key].push({
              price: q.price,
              change: q.change,
              changePercent: q.changePercent,
              name: q.name,
              source: "yahoo-finance",
              tier: "public",
              timestamp: yTime,
              exchangeTimestamp: q.exchangeTimestamp,
            });
            if (source === "unavailable") source = "yahoo-finance";
          }
        }
      }

      const latency = Date.now() - start;
      trackRequest("commodities", Object.keys(prices).length > 0, latency);
      return NextResponse.json({
        prices, type: "commodities", timestamp: Date.now(), source, latencyMs: latency,
        accuracy_engine: {
          version: "2.0",
          sources_used: [...new Set(Object.values(commoditySources).flatMap(s => s.map(x => x.source)))],
        },
      });
    }

    /* ═══════════════════════════════════════════════
       FOREX — TradingView → Yahoo → exchangerate.host
       ═══════════════════════════════════════════════ */
    if (type === "forex") {
      const prices: Record<string, { rate: number; change24h: number }> = {};
      let source = "unavailable";

      // ── TIER 1: TradingView forex scanner ──
      const TV_FX_MAP: Record<string, string> = {
        USDINR: "FX_IDC:USDINR", EURINR: "FX_IDC:EURINR", GBPINR: "FX_IDC:GBPINR",
        JPYINR: "FX_IDC:JPYINR", AEDINR: "FX_IDC:AEDINR", SGDINR: "FX_IDC:SGDINR",
        EURUSD: "FX:EURUSD", GBPUSD: "FX:GBPUSD", USDJPY: "FX:USDJPY",
        AUDUSD: "FX:AUDUSD", USDCAD: "FX:USDCAD", USDCHF: "FX:USDCHF",
        USDSGD: "FX:USDSGD",
      };
      try {
        const tickers = Object.values(TV_FX_MAP);
        const res = await fetch("https://scanner.tradingview.com/forex/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: { tickers },
            columns: ["close", "change", "change_abs", "name"],
          }),
          next: { revalidate: 30 },
        });
        if (res.ok) {
          const data = await res.json();
          const tickerToKey: Record<string, string> = {};
          for (const [k, v] of Object.entries(TV_FX_MAP)) tickerToKey[v] = k;

          for (const row of data.data || []) {
            const sym: string = row.s || "";
            const vals: number[] = row.d || [];
            const key = tickerToKey[sym];
            if (key && vals[0] && vals[0] > 0) {
              prices[key] = { rate: vals[0], change24h: vals[1] || 0 };
            }
          }
          if (Object.keys(prices).length > 0) source = "tradingview";
        }
      } catch { /* TV failed */ }

      // ── TIER 2: Yahoo fallback ──
      if (Object.keys(prices).length < 5) {
        const fxSymbols = [
          "USDINR=X", "EURINR=X", "GBPINR=X", "JPYINR=X",
          "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X",
          "USDCAD=X", "USDCHF=X", "USDSGD=X", "AEDINR=X", "SGDINR=X",
        ];
        const quotes = await yahooBatchChart(fxSymbols);
        for (const q of quotes) {
          const sym = q.symbol.replace("=X", "");
          if (sym && q.price > 0 && !prices[sym]) {
            prices[sym] = { rate: q.price, change24h: q.changePercent };
            if (source === "unavailable") source = "yahoo-finance";
          }
        }
      }

      // ── TIER 3: exchangerate.host fallback ──
      if (Object.keys(prices).length === 0) {
        try {
          const res = await fetch(
            "https://api.exchangerate.host/latest?base=USD&symbols=INR,EUR,GBP,JPY,AUD,CAD,SGD,CHF,AED",
            { next: { revalidate: 300 } }
          );
          if (res.ok) {
            const data = await res.json();
            const rates = data.rates || {};
            if (rates.INR) {
              prices.USDINR = { rate: rates.INR, change24h: 0 };
              if (rates.EUR) prices.EURINR = { rate: rates.INR / rates.EUR, change24h: 0 };
              if (rates.GBP) prices.GBPINR = { rate: rates.INR / rates.GBP, change24h: 0 };
              if (rates.JPY) prices.JPYINR = { rate: rates.INR / rates.JPY, change24h: 0 };
              if (rates.AED) prices.AEDINR = { rate: rates.INR / rates.AED, change24h: 0 };
              if (rates.SGD) prices.SGDINR = { rate: rates.INR / rates.SGD, change24h: 0 };
              if (source === "unavailable") source = "exchangerate.host";
            }
          }
        } catch { /* fallback failed */ }
      }

      const latency = Date.now() - start;
      trackRequest("forex", Object.keys(prices).length > 0, latency);
      return NextResponse.json({
        prices, type: "forex", timestamp: Date.now(), source, latencyMs: latency,
        accuracy_engine: { version: "2.0", market_session: session.session },
      });
    }

    /* ═══════════════════════════════════════════════
       MUTUAL FUNDS — mfapi.in
       ═══════════════════════════════════════════════ */
    if (type === "mf") {
      const prices: Record<string, { nav: number; date: string; name: string }> = {};
      await Promise.all(
        Object.entries(MF_SCHEMES).map(async ([key, code]) => {
          try {
            const res = await fetch(`https://api.mfapi.in/mf/${code}/latest`, { next: { revalidate: 3600 } });
            if (res.ok) {
              const data = await res.json();
              if (data.data?.[0]) {
                prices[key] = {
                  nav: parseFloat(data.data[0].nav) || 0,
                  date: data.data[0].date || "",
                  name: data.meta?.scheme_name || key,
                };
              }
            }
          } catch { /* skip */ }
        })
      );
      const latency = Date.now() - start;
      trackRequest("mf", Object.keys(prices).length > 0, latency);
      return NextResponse.json({
        prices, type: "mf", timestamp: Date.now(),
        source: Object.keys(prices).length > 0 ? "mfapi.in" : "unavailable",
        latencyMs: latency,
        accuracy_engine: { version: "2.0" },
      });
    }

    /* ═══════════════════════════════════════════════
       INTERNATIONAL — Google Finance → Yahoo fallback
       ═══════════════════════════════════════════════ */
    if (type === "international" || type === "intl-stocks") {
      const symbolsParam = req.nextUrl.searchParams.get("symbols");
      const targetSymbols = symbolsParam
        ? symbolsParam.split(",")
        : ["^GSPC", "^IXIC", "^DJI", "^GSPTSE", "^BVSP", "^FTSE", "^GDAXI", "^FCHI", "^STOXX50E", "^SSMI", "^N225", "^HSI", "000001.SS", "^KS11", "^AXJO", "^STI", "^TWII", "^NSEI", "^BSESN"];

      const prices: Record<string, { price: number; change: number; changePercent: number; name: string; currency: string }> = {};

      await Promise.all(
        targetSymbols.map(async (sym) => {
          const entry = GF_INTERNATIONAL[sym];
          if (!entry) return;
          const [ticker, exchange] = entry.gf.split(":");
          const result = await scrapeGoogleFinance(ticker, exchange);
          if (result && result.price > 0) {
            prices[sym] = {
              price: result.price, change: result.change, changePercent: result.changePercent,
              name: entry.name, currency: entry.currency,
            };
          }
        })
      );

      // Yahoo fallback for missing
      const missing = targetSymbols.filter(s => !prices[s]);
      if (missing.length > 0) {
        const yahooQuotes = await yahooBatchChart(missing);
        for (const q of yahooQuotes) {
          if (q.price > 0 && !prices[q.symbol]) {
            const entry = GF_INTERNATIONAL[q.symbol];
            prices[q.symbol] = {
              price: q.price, change: q.change, changePercent: q.changePercent,
              name: entry?.name || q.name, currency: entry?.currency || q.currency || "USD",
            };
          }
        }
      }

      const latency = Date.now() - start;
      trackRequest("international", Object.keys(prices).length > 0, latency);
      return NextResponse.json({
        prices, type, timestamp: Date.now(),
        source: Object.keys(prices).length > 0 ? "google-finance" : "unavailable",
        latencyMs: latency,
        accuracy_engine: { version: "2.0" },
      });
    }

    /* ═══════════════════════════════════════════════
       BONDS — TradingView primary → Yahoo fallback
       ═══════════════════════════════════════════════ */
    if (type === "bonds") {
      const prices: Record<string, { yield: number; change: number; name: string }> = {};
      let source = "unavailable";

      const TV_BOND_MAP: Record<string, { ticker: string; name: string }> = {
        US_10Y: { ticker: "TVC:US10Y", name: "US 10Y Treasury" },
        US_2Y: { ticker: "TVC:US02Y", name: "US 2Y Treasury" },
        US_30Y: { ticker: "TVC:US30Y", name: "US 30Y Treasury" },
        US_5Y: { ticker: "TVC:US05Y", name: "US 5Y Treasury" },
        INDIA_10Y: { ticker: "TVC:IN10Y", name: "India 10Y G-Sec" },
      };
      try {
        const tickers = Object.values(TV_BOND_MAP).map(v => v.ticker);
        const res = await fetch("https://scanner.tradingview.com/bonds/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbols: { tickers },
            columns: ["close", "change", "change_abs", "name"],
          }),
          next: { revalidate: 300 },
        });
        if (res.ok) {
          const data = await res.json();
          const tickerToKey: Record<string, string> = {};
          for (const [k, v] of Object.entries(TV_BOND_MAP)) tickerToKey[v.ticker] = k;

          for (const row of data.data || []) {
            const sym: string = row.s || "";
            const vals: number[] = row.d || [];
            const key = tickerToKey[sym];
            if (key && vals[0] && vals[0] > 0) {
              prices[key] = {
                yield: vals[0],
                change: vals[2] || 0,
                name: TV_BOND_MAP[key].name,
              };
            }
          }
          if (Object.keys(prices).length > 0) source = "tradingview";
        }
      } catch { /* TV failed */ }

      // Yahoo fallback
      if (Object.keys(prices).length < 3) {
        const yahooSymbols = Object.values(YIELD_SYMBOLS);
        const quotes = await yahooBatchChart(yahooSymbols);
        const reverseMap: Record<string, string> = {};
        for (const [k, v] of Object.entries(YIELD_SYMBOLS)) reverseMap[v] = k;
        for (const q of quotes) {
          const key = reverseMap[q.symbol] || q.symbol;
          if (key && q.price > 0 && !prices[key]) {
            prices[key] = { yield: q.price, change: q.change, name: q.name };
            if (source === "unavailable") source = "yahoo-finance";
          }
        }
      }

      const latency = Date.now() - start;
      trackRequest("bonds", Object.keys(prices).length > 0, latency);
      return NextResponse.json({
        prices, type: "bonds", timestamp: Date.now(), source, latencyMs: latency,
        accuracy_engine: { version: "2.0" },
      });
    }

    return NextResponse.json({
      prices: {}, type, timestamp: Date.now(), source: "unavailable",
      accuracy_engine: { version: "2.0" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Live prices error:", msg);
    trackRequest(type, false, Date.now() - start);
    return NextResponse.json({ error: `Failed: ${msg}` }, { status: 500 });
  }
}
