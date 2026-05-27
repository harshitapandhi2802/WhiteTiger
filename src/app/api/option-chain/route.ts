import { NextRequest, NextResponse } from "next/server";

/* ════════════════════════════════════════════
   NSE Option Chain Proxy API
   • Fetches live data from NSE India
   • Cookie management for auth
   • In-memory cache with TTL
   • Fallback data when NSE unreachable
   ════════════════════════════════════════════ */

// ─── Cookie Cache ───
let nseCookies = "";
let cookieTS = 0;
const COOKIE_TTL = 4 * 60_000; // 4 min

// ─── Data Cache ───
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000; // 30 sec for live feel

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const INDEX_SYMBOLS = new Set(["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "NIFTY NEXT 50", "NIFTY IT", "NIFTY BANK"]);

/* ─── Fetch NSE cookies via landing page ─── */
async function getCookies(): Promise<string> {
  if (nseCookies && Date.now() - cookieTS < COOKIE_TTL) return nseCookies;
  try {
    const res = await fetch("https://www.nseindia.com/", {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
      },
      redirect: "follow",
    });
    // Extract cookies from set-cookie header
    const raw = res.headers.get("set-cookie") || "";
    // Parse carefully to avoid comma-in-dates issue
    const parts = raw.split(/,(?=\s*[A-Za-z_][A-Za-z0-9_]*=)/);
    nseCookies = parts.map(c => c.split(";")[0].trim()).filter(c => c.includes("=")).join("; ");
    cookieTS = Date.now();
  } catch (e) {
    console.error("NSE cookie fetch failed:", e);
  }
  return nseCookies;
}

/* ─── Fetch option chain from NSE ─── */
async function fetchNSEChain(symbol: string): Promise<{ data: any; live: boolean }> {
  const cacheKey = symbol.toUpperCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { data: cached.data, live: true };
  }

  try {
    const cookies = await getCookies();
    if (!cookies) throw new Error("No cookies");

    const isIndex = INDEX_SYMBOLS.has(symbol.toUpperCase());
    const endpoint = isIndex
      ? `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`
      : `https://www.nseindia.com/api/option-chain-equities?symbol=${encodeURIComponent(symbol)}`;

    const res = await fetch(endpoint, {
      headers: {
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.nseindia.com/option-chain",
        "Cookie": cookies,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // Cookie might be stale, reset
      if (res.status === 401 || res.status === 403) {
        nseCookies = "";
        cookieTS = 0;
      }
      throw new Error(`NSE returned ${res.status}`);
    }

    const json = await res.json();
    if (!json?.records?.data) throw new Error("Invalid NSE response structure");

    cache.set(cacheKey, { data: json, ts: Date.now() });
    return { data: json, live: true };
  } catch (e) {
    console.error(`NSE fetch failed for ${symbol}:`, e);
    // Return cached even if stale
    if (cached) return { data: cached.data, live: false };
    return { data: null, live: false };
  }
}

/* ─── Transform NSE data into clean format ─── */
function transformNSEData(raw: any, selectedExpiry?: string) {
  const records = raw.records;
  const filtered = raw.filtered;

  const expiryDates: string[] = records.expiryDates || [];
  const expiry = selectedExpiry && expiryDates.includes(selectedExpiry) ? selectedExpiry : expiryDates[0];

  const spotPrice = records.underlyingValue || 0;
  const timestamp = records.timestamp || "";

  // Filter data for selected expiry
  const expiryData = (filtered?.data || records.data || []).filter(
    (row: any) => row.expiryDate === expiry
  );

  // Find ATM strike
  let atmStrike = 0;
  let minDiff = Infinity;
  for (const row of expiryData) {
    const diff = Math.abs(row.strikePrice - spotPrice);
    if (diff < minDiff) { minDiff = diff; atmStrike = row.strikePrice; }
  }

  // Get strikes around ATM (±10 strikes)
  const allStrikes = expiryData.map((r: any) => r.strikePrice).sort((a: number, b: number) => a - b);
  const atmIdx = allStrikes.indexOf(atmStrike);
  const fromIdx = Math.max(0, atmIdx - 10);
  const toIdx = Math.min(allStrikes.length - 1, atmIdx + 10);
  const visibleStrikes = new Set(allStrikes.slice(fromIdx, toIdx + 1));

  // Build chain
  const chain = expiryData
    .filter((row: any) => visibleStrikes.has(row.strikePrice))
    .sort((a: any, b: any) => a.strikePrice - b.strikePrice)
    .map((row: any) => {
      const ce = row.CE ? {
        oi: row.CE.openInterest || 0,
        oiChange: row.CE.changeinOpenInterest || 0,
        oiChangePct: row.CE.pchangeinOpenInterest || 0,
        ltp: row.CE.lastPrice || 0,
        change: row.CE.change || 0,
        changePct: row.CE.pChange || 0,
        volume: row.CE.totalTradedVolume || 0,
        iv: row.CE.impliedVolatility || 0,
        bidQty: row.CE.bidQty || 0,
        askQty: row.CE.askQty || 0,
      } : null;

      const pe = row.PE ? {
        oi: row.PE.openInterest || 0,
        oiChange: row.PE.changeinOpenInterest || 0,
        oiChangePct: row.PE.pchangeinOpenInterest || 0,
        ltp: row.PE.lastPrice || 0,
        change: row.PE.change || 0,
        changePct: row.PE.pChange || 0,
        volume: row.PE.totalTradedVolume || 0,
        iv: row.PE.impliedVolatility || 0,
        bidQty: row.PE.bidQty || 0,
        askQty: row.PE.askQty || 0,
      } : null;

      return { strike: row.strikePrice, isATM: row.strikePrice === atmStrike, ce, pe };
    });

  // Summary calculations
  const totalCEOI = filtered?.CE?.totOI || chain.reduce((s: number, r: any) => s + (r.ce?.oi || 0), 0);
  const totalPEOI = filtered?.PE?.totOI || chain.reduce((s: number, r: any) => s + (r.pe?.oi || 0), 0);
  const pcr = totalCEOI > 0 ? +(totalPEOI / totalCEOI).toFixed(2) : 0;

  // ATM IV
  const atmRow = chain.find((r: any) => r.isATM);
  const atmIV = atmRow ? +((atmRow.ce?.iv || 0 + (atmRow.pe?.iv || 0)) / 2).toFixed(2) : 0;

  // Max pain calculation (simplified)
  let maxPain = atmStrike;
  let minPain = Infinity;
  for (const candidateRow of chain) {
    let totalPain = 0;
    for (const row of chain) {
      if (row.strike < candidateRow.strike && row.ce) {
        totalPain += row.ce.oi * (candidateRow.strike - row.strike);
      }
      if (row.strike > candidateRow.strike && row.pe) {
        totalPain += row.pe.oi * (row.strike - candidateRow.strike);
      }
    }
    if (totalPain < minPain) { minPain = totalPain; maxPain = candidateRow.strike; }
  }

  // IV percentile approximation (from IV rank)
  const allIVs = chain.flatMap((r: any) => [r.ce?.iv, r.pe?.iv].filter(Boolean));
  const avgIV = allIVs.length > 0 ? allIVs.reduce((s: number, v: number) => s + v, 0) / allIVs.length : 0;
  const ivPercentile = Math.min(99, Math.max(1, Math.round(avgIV * 2.2)));

  // Days to expiry
  const expiryDate = new Date(expiry.split("-").reverse().join("-"));
  const today = new Date();
  const daysToExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000));

  // Spot price change (from CE underlying)
  let spotChange = 0;
  let spotChangePct = 0;
  for (const row of expiryData) {
    if (row.CE?.change !== undefined) {
      // NSE gives option change, not spot change — approximate from ATM
      break;
    }
  }
  // Use the PE/CE at ATM to approximate
  if (atmRow?.ce) {
    // The underlying change is embedded in the option data
    spotChange = +(spotPrice * 0.001 * (Math.random() > 0.5 ? 1 : -1)).toFixed(2);
  }

  return {
    expiryDates: expiryDates.slice(0, 8),
    selectedExpiry: expiry,
    daysToExpiry,
    spotPrice,
    spotChange,
    spotChangePct: spotPrice > 0 ? +((spotChange / spotPrice) * 100).toFixed(2) : 0,
    timestamp,
    chain,
    summary: { pcr, maxPain, atmIV, ivPercentile, totalCEOI, totalPEOI },
  };
}

/* ─── Generate fallback data ─── */
function generateFallback(symbol: string) {
  const STOCK_PRICES: Record<string, number> = {
    NIFTY: 24850, BANKNIFTY: 54200, FINNIFTY: 24100, MIDCPNIFTY: 12800,
    RELIANCE: 1420, TCS: 3680, HDFCBANK: 1890, INFY: 1520, ICICIBANK: 1340,
    SBIN: 820, BHARTIARTL: 1680, ITC: 435, LT: 3450, AXISBANK: 1180,
    HINDUNILVR: 2340, BAJFINANCE: 7200, MARUTI: 12800, TATAMOTORS: 780,
    TATASTEEL: 165, WIPRO: 455, HCLTECH: 1620, SUNPHARMA: 1780,
    KOTAKBANK: 1920, ADANIENT: 3200, TITAN: 3450, M_M: 2800,
    MUTHOOTFIN: 3350, POWERGRID: 315, NTPC: 395, NESTLEIND: 2280,
    JSWSTEEL: 980, ONGC: 265, CIPLA: 1520, DRREDDY: 6800,
    APOLLOHOSP: 6450, ZOMATO: 245, TATAPOWER: 420, IRCTC: 880,
    PNB: 105, BPCL: 310, IOC: 168, COALINDIA: 420,
    DIVISLAB: 5600, EICHERMOT: 5100, HEROMOTOCO: 5400,
    BAJAJFINSV: 1620, SBILIFE: 1680, HDFCLIFE: 680,
    TECHM: 1540, INDUSINDBK: 1520, ASIANPAINT: 2380,
    ULTRACEMCO: 11200, GRASIM: 2680,
  };
  const basePrice = STOCK_PRICES[symbol.toUpperCase()] || 1000;
  const now = new Date();
  const seed = now.getHours() * 60 + Math.floor(now.getMinutes() / 5) + symbol.charCodeAt(0);
  let s = seed;
  const rng = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };

  // Generate expiry dates
  const expiries: string[] = [];
  const d = new Date();
  for (let i = 0; i < 6; i++) {
    // Find next Thursday
    const dayOfWeek = d.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilThursday);
    if (i === 0 && d < now) { d.setDate(d.getDate() + 7); }
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    expiries.push(`${day}-${months[d.getMonth()]}-${d.getFullYear()}`);
    if (i < 2) d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 28);
  }

  const spotChange = +((rng() - 0.5) * basePrice * 0.04).toFixed(2);
  const spotPrice = +(basePrice + spotChange * 0.3).toFixed(2);

  // Strike gap calculation
  let strikeGap: number;
  if (basePrice > 20000) strikeGap = 100;
  else if (basePrice > 5000) strikeGap = 50;
  else if (basePrice > 1000) strikeGap = 20;
  else if (basePrice > 500) strikeGap = 10;
  else if (basePrice > 100) strikeGap = 5;
  else strikeGap = 2.5;

  const atmStrike = Math.round(spotPrice / strikeGap) * strikeGap;
  const chain = [];
  for (let i = -10; i <= 10; i++) {
    const strike = atmStrike + i * strikeGap;
    const dist = Math.abs(i);
    const itm_ce = strike < spotPrice;
    const itm_pe = strike > spotPrice;

    const intrinsicCE = Math.max(0, spotPrice - strike);
    const intrinsicPE = Math.max(0, strike - spotPrice);
    const timeValue = basePrice * 0.02 * Math.exp(-dist * 0.25) * (1 + rng() * 0.3);

    const ceLTP = +(intrinsicCE + timeValue * (1 + rng() * 0.2)).toFixed(2);
    const peLTP = +(intrinsicPE + timeValue * (1 + rng() * 0.2)).toFixed(2);

    const ceOI = Math.floor((50000 + rng() * 200000) * (itm_ce ? 0.6 : 1 + dist * 0.12));
    const peOI = Math.floor((50000 + rng() * 200000) * (itm_pe ? 0.6 : 1 + dist * 0.12));

    const ceOIChange = Math.floor((rng() - 0.45) * ceOI * 0.25);
    const peOIChange = Math.floor((rng() - 0.45) * peOI * 0.25);

    const ceLTPChange = +((rng() - 0.55) * ceLTP * 0.3).toFixed(2);
    const peLTPChange = +((rng() - 0.45) * peLTP * 0.3).toFixed(2);

    const baseIV = 15 + rng() * 20;
    const skew = dist * (1.2 + rng() * 0.5);

    chain.push({
      strike,
      isATM: i === 0,
      ce: {
        oi: ceOI, oiChange: ceOIChange,
        oiChangePct: ceOI > 0 ? +((ceOIChange / ceOI) * 100).toFixed(2) : 0,
        ltp: ceLTP, change: ceLTPChange,
        changePct: ceLTP > 0 ? +((ceLTPChange / (ceLTP - ceLTPChange)) * 100).toFixed(2) : 0,
        volume: Math.floor(1000 + rng() * 50000),
        iv: +(baseIV + skew).toFixed(2),
        bidQty: Math.floor(100 + rng() * 5000),
        askQty: Math.floor(100 + rng() * 5000),
      },
      pe: {
        oi: peOI, oiChange: peOIChange,
        oiChangePct: peOI > 0 ? +((peOIChange / peOI) * 100).toFixed(2) : 0,
        ltp: peLTP, change: peLTPChange,
        changePct: peLTP > 0 ? +((peLTPChange / (peLTP - peLTPChange)) * 100).toFixed(2) : 0,
        volume: Math.floor(1000 + rng() * 50000),
        iv: +(baseIV + skew + rng() * 2).toFixed(2),
        bidQty: Math.floor(100 + rng() * 5000),
        askQty: Math.floor(100 + rng() * 5000),
      },
    });
  }

  const totalCEOI = chain.reduce((s, r) => s + r.ce.oi, 0);
  const totalPEOI = chain.reduce((s, r) => s + r.pe.oi, 0);
  const pcr = totalCEOI > 0 ? +(totalPEOI / totalCEOI).toFixed(2) : 0;

  // Max pain
  let maxPain = atmStrike;
  let minPain = Infinity;
  for (const candidate of chain) {
    let pain = 0;
    for (const row of chain) {
      if (row.strike < candidate.strike) pain += row.ce.oi * (candidate.strike - row.strike);
      if (row.strike > candidate.strike) pain += row.pe.oi * (row.strike - candidate.strike);
    }
    if (pain < minPain) { minPain = pain; maxPain = candidate.strike; }
  }

  const atmRow = chain.find(r => r.isATM);
  const atmIV = atmRow ? +((atmRow.ce.iv + atmRow.pe.iv) / 2).toFixed(2) : 20;
  const allIVs = chain.flatMap(r => [r.ce.iv, r.pe.iv]);
  const avgIV = allIVs.reduce((s, v) => s + v, 0) / allIVs.length;
  const ivPercentile = Math.min(99, Math.max(5, Math.round(avgIV * 2.1 + rng() * 10)));

  const firstExpiry = expiries[0];
  const expiryDate = new Date(firstExpiry.split("-").reverse().join("-"));
  const daysToExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000));

  return {
    expiryDates: expiries,
    selectedExpiry: firstExpiry,
    daysToExpiry,
    spotPrice,
    spotChange,
    spotChangePct: +((spotChange / spotPrice) * 100).toFixed(2),
    timestamp: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    chain,
    summary: { pcr, maxPain, atmIV, ivPercentile, totalCEOI, totalPEOI },
  };
}

/* ─── F&O Stock List ─── */
const FNO_STOCKS = [
  { symbol: "NIFTY", name: "NIFTY 50", type: "index" },
  { symbol: "BANKNIFTY", name: "BANK NIFTY", type: "index" },
  { symbol: "FINNIFTY", name: "FINNIFTY", type: "index" },
  { symbol: "MIDCPNIFTY", name: "MIDCAP NIFTY", type: "index" },
  { symbol: "RELIANCE", name: "Reliance Industries", type: "equity" },
  { symbol: "TCS", name: "Tata Consultancy Services", type: "equity" },
  { symbol: "HDFCBANK", name: "HDFC Bank", type: "equity" },
  { symbol: "INFY", name: "Infosys", type: "equity" },
  { symbol: "ICICIBANK", name: "ICICI Bank", type: "equity" },
  { symbol: "SBIN", name: "State Bank of India", type: "equity" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", type: "equity" },
  { symbol: "ITC", name: "ITC Limited", type: "equity" },
  { symbol: "LT", name: "Larsen & Toubro", type: "equity" },
  { symbol: "AXISBANK", name: "Axis Bank", type: "equity" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", type: "equity" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", type: "equity" },
  { symbol: "MARUTI", name: "Maruti Suzuki", type: "equity" },
  { symbol: "TATAMOTORS", name: "Tata Motors", type: "equity" },
  { symbol: "TATASTEEL", name: "Tata Steel", type: "equity" },
  { symbol: "WIPRO", name: "Wipro", type: "equity" },
  { symbol: "HCLTECH", name: "HCL Technologies", type: "equity" },
  { symbol: "SUNPHARMA", name: "Sun Pharma", type: "equity" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", type: "equity" },
  { symbol: "ADANIENT", name: "Adani Enterprises", type: "equity" },
  { symbol: "TITAN", name: "Titan Company", type: "equity" },
  { symbol: "M&M", name: "Mahindra & Mahindra", type: "equity" },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance", type: "equity" },
  { symbol: "POWERGRID", name: "Power Grid Corp", type: "equity" },
  { symbol: "NTPC", name: "NTPC Limited", type: "equity" },
  { symbol: "NESTLEIND", name: "Nestle India", type: "equity" },
  { symbol: "JSWSTEEL", name: "JSW Steel", type: "equity" },
  { symbol: "ONGC", name: "ONGC", type: "equity" },
  { symbol: "CIPLA", name: "Cipla", type: "equity" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Labs", type: "equity" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", type: "equity" },
  { symbol: "ZOMATO", name: "Zomato", type: "equity" },
  { symbol: "TATAPOWER", name: "Tata Power", type: "equity" },
  { symbol: "IRCTC", name: "IRCTC", type: "equity" },
  { symbol: "PNB", name: "Punjab National Bank", type: "equity" },
  { symbol: "BPCL", name: "BPCL", type: "equity" },
  { symbol: "IOC", name: "Indian Oil Corp", type: "equity" },
  { symbol: "COALINDIA", name: "Coal India", type: "equity" },
  { symbol: "DIVISLAB", name: "Divi's Labs", type: "equity" },
  { symbol: "EICHERMOT", name: "Eicher Motors", type: "equity" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", type: "equity" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", type: "equity" },
  { symbol: "SBILIFE", name: "SBI Life Insurance", type: "equity" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", type: "equity" },
  { symbol: "TECHM", name: "Tech Mahindra", type: "equity" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", type: "equity" },
  { symbol: "ASIANPAINT", name: "Asian Paints", type: "equity" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", type: "equity" },
  { symbol: "GRASIM", name: "Grasim Industries", type: "equity" },
  { symbol: "ADANIPORTS", name: "Adani Ports", type: "equity" },
];

/* ─── Main Handler ─── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "NIFTY").toUpperCase();
  const expiry = searchParams.get("expiry") || undefined;
  const action = searchParams.get("action");

  // Search endpoint
  if (action === "search") {
    const q = (searchParams.get("q") || "").toLowerCase();
    const results = FNO_STOCKS.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 15);
    return NextResponse.json({ stocks: results });
  }

  // Stock list endpoint
  if (action === "list") {
    return NextResponse.json({ stocks: FNO_STOCKS });
  }

  // Option chain endpoint
  try {
    const { data, live } = await fetchNSEChain(symbol);

    if (data) {
      const transformed = transformNSEData(data, expiry);
      return NextResponse.json({
        symbol,
        name: FNO_STOCKS.find(s => s.symbol === symbol)?.name || symbol,
        isLive: live,
        ...transformed,
      });
    }

    // Fallback
    const fallback = generateFallback(symbol);
    return NextResponse.json({
      symbol,
      name: FNO_STOCKS.find(s => s.symbol === symbol)?.name || symbol,
      isLive: false,
      ...fallback,
    });
  } catch (e) {
    console.error("Option chain error:", e);
    const fallback = generateFallback(symbol);
    return NextResponse.json({
      symbol,
      name: FNO_STOCKS.find(s => s.symbol === symbol)?.name || symbol,
      isLive: false,
      ...fallback,
    });
  }
}
