"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ════════════════════════════════════════════════════════════════════════════
   GLOBAL DERIVATIVES TERMINAL — Institutional Multi-Exchange Platform
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Seed-based deterministic random ─── */
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

/* ─── Formatters ─── */
function fmtPrice(n: number, d = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtVol(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}
function fmtOI(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

/* ════════════════════════════════════════════════════════════════════════════
   EXCHANGE & CONTRACT DEFINITIONS
   ═══════════════════════════════════════════════════════════════════════════ */

interface ContractSpec {
  symbol: string;
  name: string;
  assetClass: string;
  tickSize: number;
  contractSize: string;
  basePrice: number;
  currency: string;
  priceDecimals: number;
  margin: string;
}

interface ExchangeInfo {
  id: string;
  name: string;
  shortName: string;
  flag: string;
  country: string;
  timezone: string;
  hours: string;
  color: string;
  contracts: ContractSpec[];
}

const EXCHANGES: ExchangeInfo[] = [
  {
    id: "cme", name: "CME Group", shortName: "CME", flag: "🇺🇸", country: "United States",
    timezone: "CT", hours: "17:00-16:00 CT", color: "#2962ff",
    contracts: [
      { symbol: "ES", name: "E-mini S&P 500", assetClass: "Equity Index", tickSize: 0.25, contractSize: "$50 × Index", basePrice: 5420, currency: "USD", priceDecimals: 2, margin: "$12,650" },
      { symbol: "NQ", name: "Nasdaq 100", assetClass: "Equity Index", tickSize: 0.25, contractSize: "$20 × Index", basePrice: 19250, currency: "USD", priceDecimals: 2, margin: "$18,700" },
      { symbol: "CL", name: "WTI Crude Oil", assetClass: "Energy", tickSize: 0.01, contractSize: "1,000 bbl", basePrice: 78.50, currency: "USD", priceDecimals: 2, margin: "$6,600" },
      { symbol: "GC", name: "Gold Futures", assetClass: "Metals", tickSize: 0.10, contractSize: "100 oz", basePrice: 2345, currency: "USD", priceDecimals: 1, margin: "$10,500" },
      { symbol: "ZN", name: "10Y Treasury Note", assetClass: "Interest Rate", tickSize: 0.015625, contractSize: "$100,000 FV", basePrice: 110.28, currency: "USD", priceDecimals: 4, margin: "$2,200" },
      { symbol: "VX", name: "VIX Futures", assetClass: "Volatility", tickSize: 0.05, contractSize: "$1,000 × Index", basePrice: 14.80, currency: "USD", priceDecimals: 2, margin: "$8,525" },
      { symbol: "6E", name: "EUR/USD Futures", assetClass: "FX", tickSize: 0.00005, contractSize: "€125,000", basePrice: 1.0850, currency: "USD", priceDecimals: 5, margin: "$2,600" },
      { symbol: "ZC", name: "Corn Futures", assetClass: "Agriculture", tickSize: 0.25, contractSize: "5,000 bu", basePrice: 445, currency: "USc", priceDecimals: 2, margin: "$1,500" },
      { symbol: "SR3", name: "SOFR Futures", assetClass: "Interest Rate", tickSize: 0.0025, contractSize: "$2,500/bp", basePrice: 95.72, currency: "USD", priceDecimals: 4, margin: "$825" },
      { symbol: "SI", name: "Silver Futures", assetClass: "Metals", tickSize: 0.005, contractSize: "5,000 oz", basePrice: 29.45, currency: "USD", priceDecimals: 3, margin: "$9,000" },
    ],
  },
  {
    id: "eurex", name: "Eurex Exchange", shortName: "EUREX", flag: "🇪🇺", country: "Europe",
    timezone: "CET", hours: "08:00-22:00 CET", color: "#1565c0",
    contracts: [
      { symbol: "FGBL", name: "Euro Bund Futures", assetClass: "Interest Rate", tickSize: 0.01, contractSize: "€100,000 FV", basePrice: 131.50, currency: "EUR", priceDecimals: 2, margin: "€3,200" },
      { symbol: "FGBM", name: "Euro Bobl Futures", assetClass: "Interest Rate", tickSize: 0.01, contractSize: "€100,000 FV", basePrice: 117.80, currency: "EUR", priceDecimals: 2, margin: "€1,700" },
      { symbol: "FESX", name: "EURO STOXX 50", assetClass: "Equity Index", tickSize: 1, contractSize: "€10 × Index", basePrice: 5050, currency: "EUR", priceDecimals: 0, margin: "€4,900" },
      { symbol: "FDAX", name: "DAX Futures", assetClass: "Equity Index", tickSize: 0.5, contractSize: "€25 × Index", basePrice: 18650, currency: "EUR", priceDecimals: 1, margin: "€19,800" },
      { symbol: "FESB", name: "STOXX Banks Futures", assetClass: "Equity Index", tickSize: 0.5, contractSize: "€50 × Index", basePrice: 134, currency: "EUR", priceDecimals: 1, margin: "€3,400" },
    ],
  },
  {
    id: "ice", name: "ICE Futures Europe", shortName: "ICE", flag: "🇬🇧", country: "United Kingdom",
    timezone: "GMT", hours: "01:00-23:00 GMT", color: "#00695c",
    contracts: [
      { symbol: "B", name: "Brent Crude Oil", assetClass: "Energy", tickSize: 0.01, contractSize: "1,000 bbl", basePrice: 82.20, currency: "USD", priceDecimals: 2, margin: "$7,000" },
      { symbol: "TTF", name: "Dutch TTF Gas", assetClass: "Energy", tickSize: 0.001, contractSize: "1 MW/therm", basePrice: 34.50, currency: "EUR", priceDecimals: 3, margin: "€5,200" },
      { symbol: "G", name: "Gas Oil Futures", assetClass: "Energy", tickSize: 0.25, contractSize: "100 MT", basePrice: 745, currency: "USD", priceDecimals: 2, margin: "$7,800" },
      { symbol: "CC", name: "Cocoa Futures", assetClass: "Agriculture", tickSize: 1, contractSize: "10 MT", basePrice: 8420, currency: "USD", priceDecimals: 0, margin: "$8,500" },
      { symbol: "KC", name: "Coffee Futures", assetClass: "Agriculture", tickSize: 0.05, contractSize: "37,500 lb", basePrice: 228, currency: "USc", priceDecimals: 2, margin: "$6,200" },
    ],
  },
  {
    id: "lme", name: "London Metal Exchange", shortName: "LME", flag: "🇬🇧", country: "United Kingdom",
    timezone: "GMT", hours: "01:00-19:00 GMT", color: "#4527a0",
    contracts: [
      { symbol: "CA", name: "Copper Futures", assetClass: "Base Metals", tickSize: 0.5, contractSize: "25 MT", basePrice: 9650, currency: "USD", priceDecimals: 1, margin: "$11,400" },
      { symbol: "AH", name: "Aluminium Futures", assetClass: "Base Metals", tickSize: 0.5, contractSize: "25 MT", basePrice: 2520, currency: "USD", priceDecimals: 1, margin: "$5,800" },
      { symbol: "NI", name: "Nickel Futures", assetClass: "Base Metals", tickSize: 1, contractSize: "6 MT", basePrice: 17850, currency: "USD", priceDecimals: 0, margin: "$15,600" },
      { symbol: "ZS", name: "Zinc Futures", assetClass: "Base Metals", tickSize: 0.5, contractSize: "25 MT", basePrice: 2780, currency: "USD", priceDecimals: 1, margin: "$4,200" },
    ],
  },
  {
    id: "jpx", name: "Japan Exchange Group", shortName: "JPX", flag: "🇯🇵", country: "Japan",
    timezone: "JST", hours: "08:45-15:15 JST", color: "#c62828",
    contracts: [
      { symbol: "NK225", name: "Nikkei 225 Futures", assetClass: "Equity Index", tickSize: 5, contractSize: "¥1,000 × Index", basePrice: 38500, currency: "JPY", priceDecimals: 0, margin: "¥1,500,000" },
      { symbol: "JGB", name: "JGB Futures", assetClass: "Interest Rate", tickSize: 0.01, contractSize: "¥100M FV", basePrice: 143.50, currency: "JPY", priceDecimals: 2, margin: "¥600,000" },
      { symbol: "TOPIX", name: "TOPIX Futures", assetClass: "Equity Index", tickSize: 0.5, contractSize: "¥10,000 × Index", basePrice: 2720, currency: "JPY", priceDecimals: 1, margin: "¥900,000" },
    ],
  },
  {
    id: "hkex", name: "Hong Kong Exchanges", shortName: "HKEX", flag: "🇭🇰", country: "Hong Kong",
    timezone: "HKT", hours: "09:15-16:30 HKT", color: "#e65100",
    contracts: [
      { symbol: "HSI", name: "Hang Seng Index", assetClass: "Equity Index", tickSize: 1, contractSize: "HK$50 × Index", basePrice: 18200, currency: "HKD", priceDecimals: 0, margin: "HK$98,000" },
      { symbol: "HHI", name: "H-Shares Index", assetClass: "Equity Index", tickSize: 1, contractSize: "HK$50 × Index", basePrice: 6450, currency: "HKD", priceDecimals: 0, margin: "HK$56,000" },
      { symbol: "HHT", name: "Hang Seng TECH", assetClass: "Equity Index", tickSize: 1, contractSize: "HK$50 × Index", basePrice: 4180, currency: "HKD", priceDecimals: 0, margin: "HK$32,000" },
    ],
  },
  {
    id: "sgx", name: "Singapore Exchange", shortName: "SGX", flag: "🇸🇬", country: "Singapore",
    timezone: "SGT", hours: "08:30-18:15 SGT", color: "#00838f",
    contracts: [
      { symbol: "IN", name: "SGX Nifty 50", assetClass: "Equity Index", tickSize: 0.5, contractSize: "$2 × Index", basePrice: 22480, currency: "USD", priceDecimals: 1, margin: "$1,200" },
      { symbol: "CN", name: "FTSE China A50", assetClass: "Equity Index", tickSize: 1, contractSize: "$1 × Index", basePrice: 12650, currency: "USD", priceDecimals: 0, margin: "$1,450" },
      { symbol: "FEF", name: "Iron Ore 62%", assetClass: "Commodities", tickSize: 0.01, contractSize: "100 MT", basePrice: 108.50, currency: "USD", priceDecimals: 2, margin: "$2,800" },
    ],
  },
  {
    id: "nse", name: "National Stock Exchange", shortName: "NSE", flag: "🇮🇳", country: "India",
    timezone: "IST", hours: "09:15-15:30 IST", color: "#1a237e",
    contracts: [
      { symbol: "NIFTY", name: "Nifty 50 Futures", assetClass: "Equity Index", tickSize: 0.05, contractSize: "75 units", basePrice: 22500, currency: "INR", priceDecimals: 2, margin: "₹1,20,000" },
      { symbol: "BANKNIFTY", name: "Bank Nifty Futures", assetClass: "Equity Index", tickSize: 0.05, contractSize: "15 units", basePrice: 48200, currency: "INR", priceDecimals: 2, margin: "₹1,45,000" },
      { symbol: "FINNIFTY", name: "Fin Nifty Futures", assetClass: "Equity Index", tickSize: 0.05, contractSize: "25 units", basePrice: 21800, currency: "INR", priceDecimals: 2, margin: "₹85,000" },
      { symbol: "USDINR", name: "USD/INR Futures", assetClass: "FX", tickSize: 0.0025, contractSize: "$1,000", basePrice: 83.45, currency: "INR", priceDecimals: 4, margin: "₹2,800" },
    ],
  },
  {
    id: "shfe", name: "Shanghai Futures Exchange", shortName: "SHFE", flag: "🇨🇳", country: "China",
    timezone: "CST", hours: "09:00-15:00 CST", color: "#b71c1c",
    contracts: [
      { symbol: "CU", name: "Copper Futures", assetClass: "Base Metals", tickSize: 10, contractSize: "5 MT", basePrice: 72500, currency: "CNY", priceDecimals: 0, margin: "¥45,000" },
      { symbol: "SC", name: "Crude Oil Futures", assetClass: "Energy", tickSize: 0.1, contractSize: "1,000 bbl", basePrice: 580, currency: "CNY", priceDecimals: 1, margin: "¥55,000" },
      { symbol: "RB", name: "Steel Rebar", assetClass: "Base Metals", tickSize: 1, contractSize: "10 MT", basePrice: 3650, currency: "CNY", priceDecimals: 0, margin: "¥4,500" },
    ],
  },
];

const ASSET_CLASS_COLORS: Record<string, string> = {
  "Equity Index": "#2962ff",
  "Energy": "#e65100",
  "Metals": "#ff8f00",
  "Base Metals": "#6a1b9a",
  "Interest Rate": "#00695c",
  "Volatility": "#c62828",
  "FX": "#00838f",
  "Agriculture": "#33691e",
  "Commodities": "#4e342e",
};

/* ════════════════════════════════════════════════════════════════════════════
   LIVE DATA GENERATION — Simulates real-time market data
   ═══════════════════════════════════════════════════════════════════════════ */

interface FuturesRow {
  symbol: string; name: string; assetClass: string;
  last: number; change: number; changePct: number;
  high: number; low: number; open: number; settle: number;
  volume: number; oi: number; oiChange: number;
  bid: number; ask: number; bidSize: number; askSize: number;
  currency: string; priceDecimals: number;
  contractSize: string; tickSize: number; margin: string;
}

interface OptionRow {
  strike: number; isATM: boolean;
  callBid: number; callAsk: number; callLast: number; callChange: number;
  callVol: number; callOI: number; callIV: number; callDelta: number; callGamma: number; callTheta: number;
  putBid: number; putAsk: number; putLast: number; putChange: number;
  putVol: number; putOI: number; putIV: number; putDelta: number; putGamma: number; putTheta: number;
}

function generateFuturesData(exchange: ExchangeInfo, tick: number): FuturesRow[] {
  return exchange.contracts.map((c, i) => {
    const rng = seededRng(tick * 1000 + i * 77 + c.basePrice);
    const drift = (rng() - 0.48) * c.basePrice * 0.025;
    const last = +(c.basePrice + drift).toFixed(c.priceDecimals);
    const change = +(drift).toFixed(c.priceDecimals);
    const changePct = +((change / c.basePrice) * 100).toFixed(2);
    const spread = c.basePrice * 0.0003;
    const vol = Math.floor(50000 + rng() * 500000);
    const oi = Math.floor(200000 + rng() * 2000000);
    return {
      symbol: c.symbol, name: c.name, assetClass: c.assetClass,
      last, change, changePct,
      high: +(last + Math.abs(drift) * 0.3 + rng() * c.basePrice * 0.005).toFixed(c.priceDecimals),
      low: +(last - Math.abs(drift) * 0.3 - rng() * c.basePrice * 0.005).toFixed(c.priceDecimals),
      open: +(c.basePrice + (rng() - 0.5) * c.basePrice * 0.008).toFixed(c.priceDecimals),
      settle: +(c.basePrice - (rng() - 0.5) * c.basePrice * 0.003).toFixed(c.priceDecimals),
      volume: vol, oi, oiChange: Math.floor((rng() - 0.45) * oi * 0.05),
      bid: +(last - spread * rng()).toFixed(c.priceDecimals),
      ask: +(last + spread * rng()).toFixed(c.priceDecimals),
      bidSize: Math.floor(10 + rng() * 200), askSize: Math.floor(10 + rng() * 200),
      currency: c.currency, priceDecimals: c.priceDecimals,
      contractSize: c.contractSize, tickSize: c.tickSize, margin: c.margin,
    };
  });
}

function generateOptionsChain(contract: ContractSpec, tick: number): { chain: OptionRow[]; expiries: string[]; spot: number } {
  const rng = seededRng(tick * 100 + contract.basePrice);
  const drift = (rng() - 0.48) * contract.basePrice * 0.015;
  const spot = +(contract.basePrice + drift).toFixed(contract.priceDecimals);

  // Generate strike prices around spot
  const strikeGap = contract.basePrice > 10000 ? 100 : contract.basePrice > 1000 ? 25 : contract.basePrice > 100 ? 5 : contract.basePrice > 10 ? 0.5 : 0.01;
  const atmStrike = Math.round(spot / strikeGap) * strikeGap;
  const numStrikes = 15;
  const strikes: number[] = [];
  for (let i = -numStrikes; i <= numStrikes; i++) {
    strikes.push(+(atmStrike + i * strikeGap).toFixed(contract.priceDecimals));
  }

  // Generate expiry dates
  const now = new Date();
  const expiries: string[] = [];
  for (let w = 0; w < 6; w++) {
    const d = new Date(now);
    d.setDate(d.getDate() + (w === 0 ? 3 : w * 7 + (w > 2 ? (w - 2) * 14 : 0)));
    // Find next Friday
    while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
    expiries.push(d.toISOString().split("T")[0]);
  }

  const dte = Math.max(1, Math.ceil((new Date(expiries[0]).getTime() - now.getTime()) / 86400000));
  const baseIV = 0.15 + rng() * 0.15;

  const chain: OptionRow[] = strikes.map((strike) => {
    const r = seededRng(tick * 10 + strike * 7);
    const moneyness = (spot - strike) / spot;
    const isATM = strike === atmStrike;
    const callITM = spot > strike;
    const putITM = spot < strike;
    const intrinsicCall = Math.max(0, spot - strike);
    const intrinsicPut = Math.max(0, strike - spot);
    const skew = 1 + Math.abs(moneyness) * 2;
    const iv = baseIV * skew + (r() - 0.5) * 0.02;
    const timeValue = spot * iv * Math.sqrt(dte / 365) * 0.4;

    const callLast = +(intrinsicCall + timeValue * (callITM ? 0.6 : 1.2) * (0.8 + r() * 0.4)).toFixed(contract.priceDecimals);
    const putLast = +(intrinsicPut + timeValue * (putITM ? 0.6 : 1.2) * (0.8 + r() * 0.4)).toFixed(contract.priceDecimals);
    const spread = Math.max(contract.tickSize, callLast * 0.01);

    const callDelta = callITM ? 0.5 + moneyness * 2 : 0.5 - Math.abs(moneyness) * 2;
    const putDelta = callDelta - 1;
    const gamma = (0.04 / (1 + Math.abs(moneyness) * 10)) * (r() * 0.5 + 0.75);
    const theta = -(callLast * 0.03 + r() * callLast * 0.02);

    return {
      strike, isATM,
      callBid: +(callLast - spread * r()).toFixed(contract.priceDecimals),
      callAsk: +(callLast + spread * r()).toFixed(contract.priceDecimals),
      callLast, callChange: +((r() - 0.45) * callLast * 0.15).toFixed(contract.priceDecimals),
      callVol: Math.floor(100 + r() * (isATM ? 50000 : 8000)),
      callOI: Math.floor(500 + r() * (isATM ? 200000 : 30000)),
      callIV: +(iv * 100).toFixed(1),
      callDelta: +Math.max(-1, Math.min(1, callDelta)).toFixed(3),
      callGamma: +gamma.toFixed(4),
      callTheta: +theta.toFixed(2),
      putBid: +(putLast - spread * r()).toFixed(contract.priceDecimals),
      putAsk: +(putLast + spread * r()).toFixed(contract.priceDecimals),
      putLast, putChange: +((r() - 0.45) * putLast * 0.15).toFixed(contract.priceDecimals),
      putVol: Math.floor(100 + r() * (isATM ? 45000 : 7000)),
      putOI: Math.floor(500 + r() * (isATM ? 180000 : 25000)),
      putIV: +(iv * 100 + (r() - 0.5) * 3).toFixed(1),
      putDelta: +Math.max(-1, Math.min(1, putDelta)).toFixed(3),
      putGamma: +gamma.toFixed(4),
      putTheta: +theta.toFixed(2),
    };
  });

  return { chain, expiries, spot };
}

/* ════════════════════════════════════════════════════════════════════════════
   ANALYTICS DATA GENERATION
   ═══════════════════════════════════════════════════════════════════════════ */

interface FuturesCurvePoint { month: string; price: number; oi: number }
interface CorrelationPair { a: string; b: string; corr: number }

function generateFuturesCurve(contract: ContractSpec, tick: number): FuturesCurvePoint[] {
  const rng = seededRng(tick + contract.basePrice * 3);
  const isContango = rng() > 0.4;
  const months = ["Jun 24", "Jul 24", "Aug 24", "Sep 24", "Oct 24", "Nov 24", "Dec 24", "Mar 25", "Jun 25", "Sep 25", "Dec 25"];
  return months.map((month, i) => {
    const curveFactor = isContango ? 1 + i * 0.004 * (0.8 + rng() * 0.4) : 1 - i * 0.003 * (0.8 + rng() * 0.4);
    return {
      month,
      price: +(contract.basePrice * curveFactor + (rng() - 0.5) * contract.basePrice * 0.003).toFixed(contract.priceDecimals),
      oi: Math.floor(50000 + rng() * 400000 * Math.max(0.2, 1 - i * 0.08)),
    };
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

type ViewTab = "futures" | "options" | "analytics" | "calendar" | "specs";

export function GlobalDerivativesTerminal() {
  const [exchange, setExchange] = useState(EXCHANGES[0]);
  const [viewTab, setViewTab] = useState<ViewTab>("futures");
  const [selectedContract, setSelectedContract] = useState(EXCHANGES[0].contracts[0]);
  const [tick, setTick] = useState(Date.now());
  const [selectedExpiry, setSelectedExpiry] = useState(0);
  const [showAllStrikes, setShowAllStrikes] = useState(false);
  const [showGreeks, setShowGreeks] = useState(false);
  const [contractFilter, setContractFilter] = useState<string>("All");
  const tickRef = useRef(tick);
  tickRef.current = tick;

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const iv = setInterval(() => setTick(Date.now()), 3000);
    return () => clearInterval(iv);
  }, []);

  // Reset contract when exchange changes
  useEffect(() => {
    setSelectedContract(exchange.contracts[0]);
    setContractFilter("All");
  }, [exchange]);

  const futuresData = useMemo(() => generateFuturesData(exchange, tick), [exchange, tick]);
  const optionsData = useMemo(() => generateOptionsChain(selectedContract, tick), [selectedContract, tick]);
  const futuresCurve = useMemo(() => generateFuturesCurve(selectedContract, tick), [selectedContract, tick]);

  // Asset classes for current exchange
  const assetClasses = useMemo(() => {
    const s = new Set(exchange.contracts.map(c => c.assetClass));
    return ["All", ...Array.from(s)];
  }, [exchange]);

  const filteredFutures = useMemo(() => {
    if (contractFilter === "All") return futuresData;
    return futuresData.filter(f => f.assetClass === contractFilter);
  }, [futuresData, contractFilter]);

  // Options chain filtered
  const visibleChain = useMemo(() => {
    if (showAllStrikes) return optionsData.chain;
    const atmIdx = optionsData.chain.findIndex(r => r.isATM);
    const start = Math.max(0, atmIdx - 8);
    const end = Math.min(optionsData.chain.length, atmIdx + 9);
    return optionsData.chain.slice(start, end);
  }, [optionsData, showAllStrikes]);

  // Summary stats
  const totalCallOI = optionsData.chain.reduce((s, r) => s + r.callOI, 0);
  const totalPutOI = optionsData.chain.reduce((s, r) => s + r.putOI, 0);
  const pcr = totalCallOI > 0 ? +(totalPutOI / totalCallOI).toFixed(2) : 0;
  const maxPainStrike = useMemo(() => {
    let min = Infinity, mp = optionsData.chain[0]?.strike || 0;
    optionsData.chain.forEach(r => {
      const pain = optionsData.chain.reduce((s, o) => s + Math.max(0, o.strike - r.strike) * o.callOI + Math.max(0, r.strike - o.strike) * o.putOI, 0);
      if (pain < min) { min = pain; mp = r.strike; }
    });
    return mp;
  }, [optionsData]);

  /* ═══ Top-level 10 macro contracts heatmap ═══ */
  const macroContracts = useMemo(() => {
    const top10 = [
      { exId: "cme", sym: "ES" }, { exId: "cme", sym: "NQ" }, { exId: "cme", sym: "CL" },
      { exId: "cme", sym: "GC" }, { exId: "cme", sym: "ZN" }, { exId: "cme", sym: "VX" },
      { exId: "cme", sym: "6E" }, { exId: "ice", sym: "B" }, { exId: "eurex", sym: "FGBL" },
      { exId: "jpx", sym: "NK225" },
    ];
    return top10.map(({ exId, sym }) => {
      const ex = EXCHANGES.find(e => e.id === exId)!;
      const c = ex.contracts.find(cc => cc.symbol === sym)!;
      const rng = seededRng(tick * 10 + c.basePrice);
      const drift = (rng() - 0.48) * c.basePrice * 0.02;
      return {
        symbol: sym, name: c.name, flag: ex.flag,
        price: +(c.basePrice + drift).toFixed(c.priceDecimals),
        change: +((drift / c.basePrice) * 100).toFixed(2),
        currency: c.currency,
      };
    });
  }, [tick]);

  return (
    <div style={{ padding: 0 }}>

      {/* ═══ MACRO TICKER BAR ═══ */}
      <div style={{
        display: "flex", gap: 0, overflowX: "auto",
        background: "linear-gradient(135deg, #0a0e17 0%, #111827 50%, #0a0e17 100%)",
        borderRadius: 12, marginBottom: 16, scrollbarWidth: "none",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {macroContracts.map(c => (
          <div key={c.symbol} style={{
            padding: "10px 16px", borderRight: "1px solid rgba(255,255,255,0.06)",
            minWidth: 140, cursor: "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: "0.65rem" }}>{c.flag}</span>
              <span style={{ color: "#94a3b8", fontSize: "0.68rem", fontWeight: 600 }}>{c.symbol}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: "#fff", fontSize: "0.82rem", fontWeight: 700, fontFamily: "monospace" }}>
                {fmtPrice(c.price, c.currency === "JPY" ? 0 : 2)}
              </span>
              <span style={{
                fontSize: "0.68rem", fontWeight: 700,
                color: c.change >= 0 ? "#22c55e" : "#ef4444",
              }}>
                {c.change >= 0 ? "+" : ""}{c.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ EXCHANGE SELECTOR ═══ */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16,
        padding: "12px 16px", background: "#fff", borderRadius: 12,
        border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", alignSelf: "center", marginRight: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>EXCHANGE</span>
        {EXCHANGES.map(ex => (
          <button key={ex.id} onClick={() => setExchange(ex)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 8, border: "none",
            background: exchange.id === ex.id ? ex.color : "var(--bg-secondary)",
            color: exchange.id === ex.id ? "#fff" : "var(--text-secondary)",
            fontWeight: exchange.id === ex.id ? 700 : 600, fontSize: "0.78rem",
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: exchange.id === ex.id ? `0 2px 8px ${ex.color}33` : "none",
          }}>
            <span style={{ fontSize: "0.85rem" }}>{ex.flag}</span>
            {ex.shortName}
          </button>
        ))}
      </div>

      {/* ═══ EXCHANGE HEADER ═══ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", background: "#fff", borderRadius: "12px 12px 0 0",
        borderBottom: `3px solid ${exchange.color}`,
        border: "1px solid var(--border)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.4rem" }}>{exchange.flag}</span>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {exchange.name}
              </h2>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {exchange.country} · {exchange.timezone} · {exchange.hours}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 6,
            background: "#e8faf0", fontSize: "0.7rem", fontWeight: 700, color: "#00833a",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c853", animation: "pulse 2s infinite" }} />
            SIMULATED
          </div>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
            {exchange.contracts.length} contracts
          </span>
        </div>
      </div>

      {/* ═══ VIEW TABS ═══ */}
      <div style={{
        display: "flex", background: "#fff", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)",
      }}>
        {([
          { id: "futures" as ViewTab, label: "📊 Futures Prices", desc: "Live quotes" },
          { id: "options" as ViewTab, label: "📋 Options Chain", desc: "Full chain" },
          { id: "analytics" as ViewTab, label: "📈 Analytics", desc: "Curves & vol" },
          { id: "calendar" as ViewTab, label: "📅 Calendar", desc: "Expiries" },
          { id: "specs" as ViewTab, label: "📑 Specs", desc: "Contract details" },
        ]).map(t => (
          <button key={t.id} onClick={() => setViewTab(t.id)} style={{
            flex: 1, padding: "12px 8px", border: "none",
            borderBottom: viewTab === t.id ? `3px solid ${exchange.color}` : "3px solid transparent",
            background: viewTab === t.id ? `${exchange.color}08` : "transparent",
            color: viewTab === t.id ? exchange.color : "var(--text-muted)",
            fontWeight: viewTab === t.id ? 700 : 600, fontSize: "0.78rem",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT AREA ═══ */}
      <div style={{
        background: "#fff", border: "1px solid var(--border)", borderTop: "none",
        borderRadius: "0 0 12px 12px", minHeight: 500,
      }}>

        {/* ── FUTURES TABLE ── */}
        {viewTab === "futures" && (
          <div>
            {/* Asset class filter */}
            <div style={{ display: "flex", gap: 4, padding: "12px 16px", borderBottom: "1px solid var(--border-light)", flexWrap: "wrap" }}>
              {assetClasses.map(ac => (
                <button key={ac} onClick={() => setContractFilter(ac)} style={{
                  padding: "4px 12px", borderRadius: 6, border: "none",
                  background: contractFilter === ac ? (ASSET_CLASS_COLORS[ac] || exchange.color) : "var(--bg-secondary)",
                  color: contractFilter === ac ? "#fff" : "var(--text-muted)",
                  fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                }}>{ac}</button>
              ))}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    {["Contract", "Last", "Chg", "%Chg", "Bid", "Ask", "High", "Low", "Volume", "Open Int", "OI Chg"].map(h => (
                      <th key={h} style={{
                        padding: "10px 12px", textAlign: h === "Contract" ? "left" : "right",
                        fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        borderBottom: "1px solid var(--border)",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFutures.map((row, i) => (
                    <tr key={row.symbol}
                      onClick={() => { setSelectedContract(exchange.contracts.find(c => c.symbol === row.symbol)!); setViewTab("options"); }}
                      style={{
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border-light)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            background: ASSET_CLASS_COLORS[row.assetClass] || "#666",
                            color: "#fff", padding: "2px 6px", borderRadius: 4,
                            fontSize: "0.62rem", fontWeight: 800, minWidth: 32, textAlign: "center",
                          }}>{row.symbol}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{row.name}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{row.assetClass}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "var(--text-primary)" }}>
                        {fmtPrice(row.last, row.priceDecimals)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: row.change >= 0 ? "#00833a" : "#c62828" }}>
                        {row.change >= 0 ? "+" : ""}{fmtPrice(row.change, row.priceDecimals)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 4, fontWeight: 700, fontSize: "0.72rem", fontFamily: "monospace",
                          background: row.changePct >= 0 ? "#e8faf0" : "#ffebed",
                          color: row.changePct >= 0 ? "#00833a" : "#c62828",
                        }}>
                          {row.changePct >= 0 ? "+" : ""}{row.changePct}%
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        {fmtPrice(row.bid, row.priceDecimals)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        {fmtPrice(row.ask, row.priceDecimals)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", color: "#00833a", fontSize: "0.74rem" }}>
                        {fmtPrice(row.high, row.priceDecimals)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", color: "#c62828", fontSize: "0.74rem" }}>
                        {fmtPrice(row.low, row.priceDecimals)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                        {fmtVol(row.volume)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                        {fmtOI(row.oi)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: row.oiChange >= 0 ? "#00833a" : "#c62828" }}>
                        {row.oiChange >= 0 ? "+" : ""}{fmtOI(row.oiChange)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick summary bar */}
            <div style={{
              display: "flex", gap: 0, padding: 0, borderTop: "1px solid var(--border)",
              background: "var(--bg-secondary)", borderRadius: "0 0 12px 12px",
            }}>
              {[
                { label: "Contracts", value: String(filteredFutures.length) },
                { label: "Total Volume", value: fmtVol(filteredFutures.reduce((s, r) => s + r.volume, 0)) },
                { label: "Total OI", value: fmtOI(filteredFutures.reduce((s, r) => s + r.oi, 0)) },
                { label: "Gainers", value: String(filteredFutures.filter(r => r.change > 0).length), color: "#00833a" },
                { label: "Losers", value: String(filteredFutures.filter(r => r.change < 0).length), color: "#c62828" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, padding: "10px 16px", borderRight: "1px solid var(--border-light)", textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: s.color || "var(--text-primary)", fontFamily: "monospace" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── OPTIONS CHAIN ── */}
        {viewTab === "options" && (
          <div>
            {/* Contract selector + expiry */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", alignSelf: "center", marginRight: 4 }}>CONTRACT</span>
                {exchange.contracts.map(c => (
                  <button key={c.symbol} onClick={() => setSelectedContract(c)} style={{
                    padding: "4px 10px", borderRadius: 6, border: "none",
                    background: selectedContract.symbol === c.symbol ? exchange.color : "var(--bg-secondary)",
                    color: selectedContract.symbol === c.symbol ? "#fff" : "var(--text-muted)",
                    fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
                  }}>{c.symbol}</button>
                ))}
              </div>
              <div style={{ height: 20, width: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", alignSelf: "center", marginRight: 4 }}>EXPIRY</span>
                {optionsData.expiries.map((exp, i) => {
                  const d = new Date(exp);
                  const dte = Math.max(1, Math.ceil((d.getTime() - Date.now()) / 86400000));
                  return (
                    <button key={exp} onClick={() => setSelectedExpiry(i)} style={{
                      padding: "4px 10px", borderRadius: 6, border: "none",
                      background: selectedExpiry === i ? exchange.color : "var(--bg-secondary)",
                      color: selectedExpiry === i ? "#fff" : "var(--text-muted)",
                      fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                    }}>
                      {d.toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      <span style={{ opacity: 0.7, marginLeft: 4 }}>{dte}d</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button onClick={() => setShowGreeks(!showGreeks)} style={{
                  padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)",
                  background: showGreeks ? exchange.color : "transparent",
                  color: showGreeks ? "#fff" : "var(--text-muted)",
                  fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                }}>Greeks</button>
                <button onClick={() => setShowAllStrikes(!showAllStrikes)} style={{
                  padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-muted)",
                  fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
                }}>{showAllStrikes ? "Near ATM" : "All Strikes"}</button>
              </div>
            </div>

            {/* Spot info bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16, padding: "8px 16px",
              background: `${exchange.color}08`, borderBottom: "1px solid var(--border-light)",
            }}>
              <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                {selectedContract.name}
              </span>
              <span style={{ fontWeight: 800, fontSize: "1rem", fontFamily: "monospace", color: "var(--text-primary)" }}>
                {fmtPrice(optionsData.spot, selectedContract.priceDecimals)}
              </span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00833a" }}>
                {selectedContract.currency}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
                {[
                  { label: "PCR", value: pcr.toFixed(2), color: pcr > 1 ? "#00833a" : "#c62828" },
                  { label: "Max Pain", value: fmtPrice(maxPainStrike, selectedContract.priceDecimals) },
                  { label: "Call OI", value: fmtOI(totalCallOI), color: "#2962ff" },
                  { label: "Put OI", value: fmtOI(totalPutOI), color: "#c62828" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: s.color || "var(--text-primary)", fontFamily: "monospace" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Options table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    <th colSpan={showGreeks ? 10 : 7} style={{ textAlign: "center", padding: "6px", background: "#e8eeff", color: "#2962ff", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.08em" }}>CALLS</th>
                    <th style={{ textAlign: "center", padding: "6px", background: "#1a1d29", color: "#fff", fontWeight: 800, fontSize: "0.7rem" }}>STRIKE</th>
                    <th colSpan={showGreeks ? 10 : 7} style={{ textAlign: "center", padding: "6px", background: "#ffebed", color: "#c62828", fontWeight: 800, fontSize: "0.7rem", letterSpacing: "0.08em" }}>PUTS</th>
                  </tr>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    {/* Call headers */}
                    {["OI", "Vol", "IV", ...(showGreeks ? ["Δ", "Γ", "Θ"] : []), "Bid", "Ask", "Last", "Chg"].map(h => (
                      <th key={"c" + h} style={{
                        padding: "6px 8px", textAlign: "right", fontSize: "0.62rem", fontWeight: 700,
                        color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                    {/* Strike */}
                    <th style={{ padding: "6px 8px", textAlign: "center", fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>STRIKE</th>
                    {/* Put headers */}
                    {["Chg", "Last", "Bid", "Ask", ...(showGreeks ? ["Δ", "Γ", "Θ"] : []), "IV", "Vol", "OI"].map(h => (
                      <th key={"p" + h} style={{
                        padding: "6px 8px", textAlign: "right", fontSize: "0.62rem", fontWeight: 700,
                        color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleChain.map(row => {
                    const callITM = optionsData.spot > row.strike;
                    const putITM = optionsData.spot < row.strike;
                    const maxOI = Math.max(...optionsData.chain.map(r => Math.max(r.callOI, r.putOI)));
                    return (
                      <tr key={row.strike} style={{
                        borderBottom: "1px solid var(--border-light)",
                        background: row.isATM ? "#1a1d29" : callITM ? "#fffde7" : "transparent",
                      }}>
                        {/* Call side */}
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", position: "relative" }}>
                          <div style={{
                            position: "absolute", left: 0, top: 0, bottom: 0,
                            width: `${(row.callOI / maxOI) * 100}%`,
                            background: "rgba(41,98,255,0.08)", borderRadius: 2,
                          }} />
                          <span style={{ position: "relative", color: row.isATM ? "#93c5fd" : "var(--text-secondary)" }}>{fmtOI(row.callOI)}</span>
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#d1d5db" : "var(--text-muted)" }}>{fmtVol(row.callVol)}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: row.isATM ? "#fbbf24" : "#6366f1" }}>{row.callIV}%</td>
                        {showGreeks && <>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#93c5fd" : "var(--text-muted)", fontSize: "0.68rem" }}>{row.callDelta}</td>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#93c5fd" : "var(--text-muted)", fontSize: "0.68rem" }}>{row.callGamma}</td>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#fca5a5" : "#c62828", fontSize: "0.68rem" }}>{row.callTheta}</td>
                        </>}
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#d1d5db" : "var(--text-secondary)" }}>{fmtPrice(row.callBid, selectedContract.priceDecimals)}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#d1d5db" : "var(--text-secondary)" }}>{fmtPrice(row.callAsk, selectedContract.priceDecimals)}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: row.isATM ? "#fff" : "var(--text-primary)" }}>
                          {fmtPrice(row.callLast, selectedContract.priceDecimals)}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: row.callChange >= 0 ? "#22c55e" : "#ef4444" }}>
                          {row.callChange >= 0 ? "+" : ""}{fmtPrice(row.callChange, selectedContract.priceDecimals)}
                        </td>

                        {/* Strike */}
                        <td style={{
                          padding: "5px 10px", textAlign: "center", fontWeight: 900, fontFamily: "monospace",
                          background: row.isATM ? exchange.color : "#f8f9fb",
                          color: row.isATM ? "#fff" : "var(--text-primary)",
                          borderLeft: "2px solid " + (row.isATM ? exchange.color : "var(--border)"),
                          borderRight: "2px solid " + (row.isATM ? exchange.color : "var(--border)"),
                          fontSize: "0.78rem",
                        }}>
                          {fmtPrice(row.strike, selectedContract.priceDecimals)}
                        </td>

                        {/* Put side */}
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: row.putChange >= 0 ? "#22c55e" : "#ef4444" }}>
                          {row.putChange >= 0 ? "+" : ""}{fmtPrice(row.putChange, selectedContract.priceDecimals)}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: row.isATM ? "#fff" : "var(--text-primary)" }}>
                          {fmtPrice(row.putLast, selectedContract.priceDecimals)}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#d1d5db" : "var(--text-secondary)" }}>{fmtPrice(row.putBid, selectedContract.priceDecimals)}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#d1d5db" : "var(--text-secondary)" }}>{fmtPrice(row.putAsk, selectedContract.priceDecimals)}</td>
                        {showGreeks && <>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#fca5a5" : "#c62828", fontSize: "0.68rem" }}>{row.putDelta}</td>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#93c5fd" : "var(--text-muted)", fontSize: "0.68rem" }}>{row.putGamma}</td>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#fca5a5" : "#c62828", fontSize: "0.68rem" }}>{row.putTheta}</td>
                        </>}
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: row.isATM ? "#fbbf24" : "#6366f1" }}>{row.putIV}%</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", color: row.isATM ? "#d1d5db" : "var(--text-muted)" }}>{fmtVol(row.putVol)}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "monospace", position: "relative" }}>
                          <div style={{
                            position: "absolute", right: 0, top: 0, bottom: 0,
                            width: `${(row.putOI / maxOI) * 100}%`,
                            background: "rgba(244,67,54,0.08)", borderRadius: 2,
                          }} />
                          <span style={{ position: "relative", color: row.isATM ? "#fca5a5" : "var(--text-secondary)" }}>{fmtOI(row.putOI)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {viewTab === "analytics" && (
          <div style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Futures Term Structure */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, gridColumn: "1 / -1" }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 800, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  📊 Futures Term Structure — {selectedContract.name}
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700,
                    background: futuresCurve[1]?.price > futuresCurve[0]?.price ? "#fff8e8" : "#e8faf0",
                    color: futuresCurve[1]?.price > futuresCurve[0]?.price ? "#e65100" : "#00833a",
                  }}>
                    {futuresCurve[1]?.price > futuresCurve[0]?.price ? "CONTANGO" : "BACKWARDATION"}
                  </span>
                </h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 0, height: 180 }}>
                  {futuresCurve.map((pt, i) => {
                    const min = Math.min(...futuresCurve.map(p => p.price));
                    const max = Math.max(...futuresCurve.map(p => p.price));
                    const range = max - min || 1;
                    const h = ((pt.price - min) / range) * 140 + 20;
                    return (
                      <div key={pt.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>
                          {fmtPrice(pt.price, selectedContract.priceDecimals > 2 ? 2 : selectedContract.priceDecimals)}
                        </span>
                        <div style={{
                          width: "70%", height: h, borderRadius: "4px 4px 0 0",
                          background: i === 0 ? exchange.color : `${exchange.color}${Math.floor(30 + (1 - i / futuresCurve.length) * 70).toString(16).padStart(2, "0")}`,
                          transition: "height 0.5s",
                        }} />
                        <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>{pt.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OI Distribution */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 800, marginBottom: 12 }}>🔥 Open Interest Distribution</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {optionsData.chain.filter((_, i) => i % 3 === 0).slice(0, 12).map(row => {
                    const maxOI = Math.max(...optionsData.chain.map(r => Math.max(r.callOI, r.putOI)));
                    return (
                      <div key={row.strike} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "40%", display: "flex", justifyContent: "flex-end" }}>
                          <div style={{
                            height: 14, width: `${(row.callOI / maxOI) * 100}%`,
                            background: "linear-gradient(90deg, transparent, #2962ff40)",
                            borderRadius: "4px 0 0 4px",
                          }} />
                        </div>
                        <span style={{
                          width: 60, textAlign: "center", fontSize: "0.62rem", fontWeight: 700,
                          fontFamily: "monospace",
                          background: row.isATM ? "#1a1d29" : "var(--bg-secondary)",
                          color: row.isATM ? "#fff" : "var(--text-primary)",
                          borderRadius: 3, padding: "1px 4px",
                        }}>
                          {row.strike}
                        </span>
                        <div style={{ width: "40%", display: "flex" }}>
                          <div style={{
                            height: 14, width: `${(row.putOI / maxOI) * 100}%`,
                            background: "linear-gradient(90deg, #f4433640, transparent)",
                            borderRadius: "0 4px 4px 0",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: "0.6rem", color: "#2962ff", fontWeight: 700 }}>← Call OI</span>
                    <span style={{ fontSize: "0.6rem", color: "#f44336", fontWeight: 700 }}>Put OI →</span>
                  </div>
                </div>
              </div>

              {/* IV Smile */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 800, marginBottom: 12 }}>😊 Implied Volatility Smile</h3>
                <svg viewBox="0 0 400 200" style={{ width: "100%", height: 180 }}>
                  {/* Grid */}
                  {[0, 50, 100, 150, 200].map(y => (
                    <line key={y} x1="40" y1={y} x2="380" y2={y} stroke="#e5e7ed" strokeWidth="0.5" />
                  ))}
                  {/* Call IV line */}
                  <polyline
                    fill="none" stroke="#2962ff" strokeWidth="2.5"
                    points={visibleChain.map((r, i) => {
                      const x = 40 + (i / (visibleChain.length - 1)) * 340;
                      const minIV = Math.min(...visibleChain.map(rr => rr.callIV));
                      const maxIV = Math.max(...visibleChain.map(rr => rr.callIV));
                      const range = maxIV - minIV || 1;
                      const y = 180 - ((r.callIV - minIV) / range) * 160;
                      return `${x},${y}`;
                    }).join(" ")}
                  />
                  {/* Put IV line */}
                  <polyline
                    fill="none" stroke="#f44336" strokeWidth="2.5" strokeDasharray="6,3"
                    points={visibleChain.map((r, i) => {
                      const x = 40 + (i / (visibleChain.length - 1)) * 340;
                      const minIV = Math.min(...visibleChain.map(rr => rr.putIV));
                      const maxIV = Math.max(...visibleChain.map(rr => rr.putIV));
                      const range = maxIV - minIV || 1;
                      const y = 180 - ((r.putIV - minIV) / range) * 160;
                      return `${x},${y}`;
                    }).join(" ")}
                  />
                  {/* ATM marker */}
                  {visibleChain.map((r, i) => r.isATM ? (
                    <g key="atm">
                      <line x1={40 + (i / (visibleChain.length - 1)) * 340} y1="10" x2={40 + (i / (visibleChain.length - 1)) * 340} y2="190" stroke={exchange.color} strokeWidth="1" strokeDasharray="4,2" />
                      <text x={40 + (i / (visibleChain.length - 1)) * 340} y="8" textAnchor="middle" fontSize="8" fill={exchange.color} fontWeight="700">ATM</text>
                    </g>
                  ) : null)}
                  {/* Legend */}
                  <rect x="280" y="5" width="10" height="3" fill="#2962ff" />
                  <text x="295" y="8" fontSize="7" fill="#666">Call IV</text>
                  <rect x="330" y="5" width="10" height="3" fill="#f44336" />
                  <text x="345" y="8" fontSize="7" fill="#666">Put IV</text>
                </svg>
              </div>

              {/* Key Metrics */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 800, marginBottom: 12 }}>📐 Key Metrics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Put/Call Ratio", value: pcr.toFixed(2), color: pcr > 1 ? "#00833a" : "#c62828" },
                    { label: "Max Pain", value: fmtPrice(maxPainStrike, selectedContract.priceDecimals), color: "#6366f1" },
                    { label: "Total Call OI", value: fmtOI(totalCallOI), color: "#2962ff" },
                    { label: "Total Put OI", value: fmtOI(totalPutOI), color: "#c62828" },
                    { label: "ATM Call IV", value: (optionsData.chain.find(r => r.isATM)?.callIV || 0).toFixed(1) + "%", color: "#e65100" },
                    { label: "ATM Put IV", value: (optionsData.chain.find(r => r.isATM)?.putIV || 0).toFixed(1) + "%", color: "#e65100" },
                    { label: "Call Volume", value: fmtVol(optionsData.chain.reduce((s, r) => s + r.callVol, 0)), color: "#2962ff" },
                    { label: "Put Volume", value: fmtVol(optionsData.chain.reduce((s, r) => s + r.putVol, 0)), color: "#c62828" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "8px 10px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: m.color, fontFamily: "monospace" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PCR Gauge */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, textAlign: "center" }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 800, marginBottom: 12 }}>⚖️ Put/Call Sentiment</h3>
                <svg viewBox="0 0 200 120" style={{ width: 200, margin: "0 auto" }}>
                  {/* Gauge arc */}
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7ed" strokeWidth="12" strokeLinecap="round" />
                  {/* Red zone */}
                  <path d="M 20 100 A 80 80 0 0 1 60 35" fill="none" stroke="#f4433640" strokeWidth="12" strokeLinecap="round" />
                  {/* Green zone */}
                  <path d="M 140 35 A 80 80 0 0 1 180 100" fill="none" stroke="#00c85340" strokeWidth="12" strokeLinecap="round" />
                  {/* Needle */}
                  {(() => {
                    const pcrClamped = Math.min(2, Math.max(0, pcr));
                    const angle = -90 + (pcrClamped / 2) * 180;
                    const rad = (angle * Math.PI) / 180;
                    const nx = 100 + Math.cos(rad) * 65;
                    const ny = 100 + Math.sin(rad) * 65;
                    return <line x1="100" y1="100" x2={nx} y2={ny} stroke={exchange.color} strokeWidth="3" strokeLinecap="round" />;
                  })()}
                  <circle cx="100" cy="100" r="5" fill={exchange.color} />
                  <text x="100" y="90" textAnchor="middle" fontSize="18" fontWeight="900" fill="var(--text-primary)">{pcr.toFixed(2)}</text>
                  <text x="100" y="115" textAnchor="middle" fontSize="8" fill="var(--text-muted)">
                    {pcr > 1.3 ? "BULLISH" : pcr < 0.7 ? "BEARISH" : "NEUTRAL"}
                  </text>
                  <text x="20" y="115" fontSize="7" fill="#c62828">0</text>
                  <text x="175" y="115" fontSize="7" fill="#00833a">2</text>
                </svg>
              </div>

              {/* Cross-Exchange Correlation */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 800, marginBottom: 12 }}>🔗 Cross-Asset Correlations</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { a: "ES", b: "NQ", corr: 0.94 },
                    { a: "ES", b: "GC", corr: -0.32 },
                    { a: "CL", b: "B", corr: 0.97 },
                    { a: "GC", b: "SI", corr: 0.88 },
                    { a: "ES", b: "VX", corr: -0.85 },
                    { a: "CL", b: "6E", corr: 0.42 },
                    { a: "ZN", b: "ES", corr: -0.48 },
                  ].map((pair, i) => {
                    const rng = seededRng(tick + i);
                    const jitter = (rng() - 0.5) * 0.06;
                    const c = +(pair.corr + jitter).toFixed(2);
                    return (
                      <div key={pair.a + pair.b} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 70, fontSize: "0.68rem", fontWeight: 700, fontFamily: "monospace" }}>
                          {pair.a}/{pair.b}
                        </span>
                        <div style={{ flex: 1, height: 12, background: "var(--bg-secondary)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                          <div style={{
                            position: "absolute",
                            left: c >= 0 ? "50%" : `${50 + c * 50}%`,
                            width: `${Math.abs(c) * 50}%`,
                            height: "100%",
                            background: c >= 0 ? "#2962ff" : "#f44336",
                            borderRadius: 6,
                            transition: "all 0.3s",
                          }} />
                        </div>
                        <span style={{
                          width: 40, textAlign: "right", fontSize: "0.72rem", fontWeight: 800, fontFamily: "monospace",
                          color: c >= 0 ? "#2962ff" : "#f44336",
                        }}>{c >= 0 ? "+" : ""}{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPIRY CALENDAR ── */}
        {viewTab === "calendar" && (
          <div style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: 16 }}>📅 Upcoming Expiry Calendar</h3>

            {/* Monthly calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {(() => {
                const now = new Date();
                const months: { name: string; year: number; month: number }[] = [];
                for (let i = 0; i < 3; i++) {
                  const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                  months.push({ name: d.toLocaleDateString("en-US", { month: "long" }), year: d.getFullYear(), month: d.getMonth() });
                }

                return months.map(m => {
                  const firstDay = new Date(m.year, m.month, 1).getDay();
                  const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
                  const days: (number | null)[] = [];
                  for (let i = 0; i < firstDay; i++) days.push(null);
                  for (let i = 1; i <= daysInMonth; i++) days.push(i);

                  // Generate some expiry dates (typically 3rd Thursday/Friday + monthly)
                  const expiryDays: Set<number> = new Set();
                  // Find third Thursday
                  let thCount = 0;
                  for (let d = 1; d <= daysInMonth; d++) {
                    if (new Date(m.year, m.month, d).getDay() === 4) {
                      thCount++;
                      if (thCount === 3) { expiryDays.add(d); break; }
                    }
                  }
                  // Last Thursday of month
                  for (let d = daysInMonth; d >= 1; d--) {
                    if (new Date(m.year, m.month, d).getDay() === 4) { expiryDays.add(d); break; }
                  }
                  // Weekly expiries on Thursdays
                  for (let d = 1; d <= daysInMonth; d++) {
                    if (new Date(m.year, m.month, d).getDay() === 4) expiryDays.add(d);
                  }

                  return (
                    <div key={m.name} style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ padding: "10px 14px", background: exchange.color, color: "#fff", fontWeight: 800, fontSize: "0.82rem", textAlign: "center" }}>
                        {m.name} {m.year}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, padding: 8 }}>
                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                          <div key={d + i} style={{ textAlign: "center", fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", padding: "2px 0" }}>{d}</div>
                        ))}
                        {days.map((d, i) => {
                          const isExpiry = d !== null && expiryDays.has(d);
                          const isToday = d === now.getDate() && m.month === now.getMonth();
                          return (
                            <div key={i} style={{
                              textAlign: "center", padding: "4px 2px",
                              fontSize: "0.7rem", fontWeight: isExpiry ? 800 : 500,
                              color: d === null ? "transparent" : isExpiry ? "#fff" : isToday ? exchange.color : "var(--text-secondary)",
                              background: isExpiry ? "#c62828" : isToday ? `${exchange.color}15` : "transparent",
                              borderRadius: 4,
                            }}>
                              {d || ""}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Upcoming expiries list */}
            <div style={{ marginTop: 20, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", background: "var(--bg-secondary)", fontWeight: 800, fontSize: "0.78rem" }}>
                Upcoming Expiries — All Exchanges
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-secondary)" }}>
                    {["Date", "Exchange", "Contract", "Type", "DTE"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const now = new Date();
                    const expiries: { date: Date; exchange: string; flag: string; contract: string; type: string }[] = [];

                    EXCHANGES.forEach(ex => {
                      ex.contracts.forEach(c => {
                        // Generate monthly + weekly expiries
                        for (let w = 0; w < 8; w++) {
                          const d = new Date(now);
                          d.setDate(d.getDate() + w * 7);
                          while (d.getDay() !== 4 && d.getDay() !== 5) d.setDate(d.getDate() + 1);
                          if (d > now) {
                            expiries.push({
                              date: new Date(d),
                              exchange: ex.shortName,
                              flag: ex.flag,
                              contract: `${c.symbol} — ${c.name}`,
                              type: w % 4 === 3 ? "Monthly" : "Weekly",
                            });
                          }
                        }
                      });
                    });

                    expiries.sort((a, b) => a.date.getTime() - b.date.getTime());
                    const seen = new Set<string>();
                    return expiries.filter(e => {
                      const key = e.date.toISOString().split("T")[0] + e.exchange + e.contract;
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    }).slice(0, 20).map((e, i) => {
                      const dte = Math.ceil((e.date.getTime() - now.getTime()) / 86400000);
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 700, fontFamily: "monospace" }}>
                            {e.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{ fontSize: "0.8rem", marginRight: 4 }}>{e.flag}</span>
                            {e.exchange}
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{e.contract}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700,
                              background: e.type === "Monthly" ? "#ffebed" : "#e8eeff",
                              color: e.type === "Monthly" ? "#c62828" : "#2962ff",
                            }}>{e.type}</span>
                          </td>
                          <td style={{
                            padding: "8px 12px", fontWeight: 800, fontFamily: "monospace",
                            color: dte <= 3 ? "#c62828" : dte <= 7 ? "#e65100" : "var(--text-primary)",
                          }}>{dte}d</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CONTRACT SPECS ── */}
        {viewTab === "specs" && (
          <div style={{ padding: 20 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: 16 }}>📑 Contract Specifications — {exchange.name}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340, 1fr))", gap: 16 }}>
              {exchange.contracts.map(c => (
                <div key={c.symbol} style={{
                  border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{
                    padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-light)",
                    background: `${ASSET_CLASS_COLORS[c.assetClass] || exchange.color}08`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        background: ASSET_CLASS_COLORS[c.assetClass] || exchange.color,
                        color: "#fff", padding: "4px 10px", borderRadius: 6,
                        fontSize: "0.78rem", fontWeight: 900,
                      }}>{c.symbol}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{c.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{c.assetClass}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    {[
                      { label: "Contract Size", value: c.contractSize },
                      { label: "Tick Size", value: String(c.tickSize) },
                      { label: "Currency", value: c.currency },
                      { label: "Initial Margin", value: c.margin },
                      { label: "Price Decimals", value: String(c.priceDecimals) },
                      { label: "Exchange", value: exchange.name },
                    ].map(s => (
                      <div key={s.label} style={{
                        display: "flex", justifyContent: "space-between",
                        padding: "5px 0", borderBottom: "1px solid var(--border-light)",
                        fontSize: "0.75rem",
                      }}>
                        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ═══ PULSE ANIMATION ═══ */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
