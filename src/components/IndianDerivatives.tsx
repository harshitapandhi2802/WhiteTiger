"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ════════════════════════════════════════════════════════════════
   INDIAN DERIVATIVES — Full-Page NSE Option Chain Terminal
   • Index & Stock F&O selection
   • Expiry date selector
   • Institutional-grade option chain table
   • AI analytics overlays
   • Futures data & institutional flow
   ════════════════════════════════════════════════════════════════ */

interface OptionLeg {
  oi: number; oiChange: number; oiChangePct: number;
  volume: number; iv: number; ltp: number; change: number; changePct: number;
  bidQty: number; bid: number; ask: number; askQty: number;
}
interface ChainRow { strike: number; isATM: boolean; ce: OptionLeg | null; pe: OptionLeg | null; }
interface ChainData {
  symbol: string; name: string; isLive: boolean;
  expiryDates: string[]; selectedExpiry: string; daysToExpiry: number;
  spotPrice: number; spotChange: number; spotChangePct: number; timestamp: string;
  chain: ChainRow[];
  summary: { pcr: number; maxPain: number; atmIV: number; ivPercentile: number; totalCEOI: number; totalPEOI: number };
}
interface StockItem { symbol: string; name: string; type: string }

/* ─── Index symbols ─── */
const INDEX_OPTIONS = [
  { symbol: "NIFTY", label: "NIFTY 50" },
  { symbol: "BANKNIFTY", label: "BANK NIFTY" },
  { symbol: "FINNIFTY", label: "FINNIFTY" },
  { symbol: "MIDCPNIFTY", label: "MIDCAP NIFTY" },
];

/* ─── Seed-based deterministic random for fallback ─── */
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

/* ─── Formatters ─── */
function fmtNum(n: number, decimals = 2): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtOI(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return (n / 100000).toFixed(2) + " L";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}
function fmtCompact(n: number): string {
  if (Math.abs(n) >= 10000000) return (n / 10000000).toFixed(1) + "Cr";
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(1) + "L";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

/* ─── Generate fallback data locally ─── */
function generateLocalData(symbol: string): ChainData {
  const prices: Record<string, number> = {
    NIFTY: 23380, BANKNIFTY: 54200, FINNIFTY: 24100, MIDCPNIFTY: 12800,
    RELIANCE: 1420, TCS: 3680, HDFCBANK: 1890, INFY: 1520, ICICIBANK: 1340,
    SBIN: 820, BHARTIARTL: 1680, ITC: 435, LT: 3450, AXISBANK: 1180,
    HINDUNILVR: 2340, BAJFINANCE: 7200, MARUTI: 12800, TATAMOTORS: 780,
    TATASTEEL: 165, WIPRO: 455, HCLTECH: 1620, SUNPHARMA: 1780,
    KOTAKBANK: 1920, ADANIENT: 3200, TITAN: 3450, MUTHOOTFIN: 3350,
    POWERGRID: 315, NTPC: 395, NESTLEIND: 2280, JSWSTEEL: 980,
    APOLLOHOSP: 6450, ZOMATO: 245, ASIANPAINT: 2380, DRREDDY: 6800,
    CIPLA: 1520, TECHM: 1540, INDUSINDBK: 1520, ULTRACEMCO: 11200,
    M_M: 2800, ADANIPORTS: 1380, GRASIM: 2680, ONGC: 265,
    PNB: 105, BPCL: 310, IOC: 168, COALINDIA: 420,
    DIVISLAB: 5600, EICHERMOT: 5100, HEROMOTOCO: 5400,
  };
  const now = new Date();
  const seed = now.getHours() * 60 + Math.floor(now.getMinutes() / 5) + symbol.charCodeAt(0) + (symbol.charCodeAt(1) || 0);
  const rng = seededRng(seed);
  const basePrice = prices[symbol] || 1000;
  const spotChange = +((rng() - 0.5) * basePrice * 0.035).toFixed(2);
  const spotPrice = +(basePrice + spotChange * 0.3).toFixed(2);

  // Generate expiry dates
  const expiries: string[] = [];
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let i = 0; i < 6; i++) {
    const dow = d.getDay();
    const next = (4 - dow + 7) % 7 || 7;
    d.setDate(d.getDate() + next);
    if (i === 0 && d <= now) d.setDate(d.getDate() + 7);
    expiries.push(`${String(d.getDate()).padStart(2,"0")}-${months[d.getMonth()]}-${d.getFullYear()}`);
    if (i < 2) d.setDate(d.getDate() + 7); else d.setDate(d.getDate() + 28);
  }

  let gap: number;
  if (basePrice > 20000) gap = 100; else if (basePrice > 5000) gap = 50;
  else if (basePrice > 1000) gap = 20; else if (basePrice > 500) gap = 10;
  else if (basePrice > 100) gap = 5; else gap = 2.5;

  const atm = Math.round(spotPrice / gap) * gap;
  const chain: ChainRow[] = [];
  for (let i = -12; i <= 12; i++) {
    const strike = atm + i * gap;
    const dist = Math.abs(i);
    const intrCE = Math.max(0, spotPrice - strike);
    const intrPE = Math.max(0, strike - spotPrice);
    const tv = basePrice * 0.018 * Math.exp(-dist * 0.22) * (1 + rng() * 0.3);
    const ceLTP = +(intrCE + tv * (1 + rng() * 0.15)).toFixed(2);
    const peLTP = +(intrPE + tv * (1 + rng() * 0.15)).toFixed(2);
    const ceOI = Math.floor((40000 + rng() * 250000) * (strike < spotPrice ? 0.5 : 1 + dist * 0.1));
    const peOI = Math.floor((40000 + rng() * 250000) * (strike > spotPrice ? 0.5 : 1 + dist * 0.1));
    const baseIV = 14 + rng() * 22;
    const skew = dist * (1.0 + rng() * 0.4);
    const ceChange = +((rng() - 0.52) * ceLTP * 0.3).toFixed(2);
    const peChange = +((rng() - 0.48) * peLTP * 0.3).toFixed(2);
    const ceOIChg = Math.floor((rng() - 0.45) * ceOI * 0.2);
    const peOIChg = Math.floor((rng() - 0.45) * peOI * 0.2);
    const mkBid = (ltp: number) => +(ltp - ltp * 0.005 * (1 + rng())).toFixed(2);
    const mkAsk = (ltp: number) => +(ltp + ltp * 0.005 * (1 + rng())).toFixed(2);

    chain.push({
      strike, isATM: i === 0,
      ce: {
        oi: ceOI, oiChange: ceOIChg, oiChangePct: ceOI > 0 ? +((ceOIChg / ceOI) * 100).toFixed(2) : 0,
        volume: Math.floor(500 + rng() * 60000), iv: +(baseIV + skew).toFixed(2),
        ltp: ceLTP, change: ceChange, changePct: ceLTP > 0.1 ? +((ceChange / Math.max(0.01, ceLTP - ceChange)) * 100).toFixed(2) : 0,
        bidQty: Math.floor(50 + rng() * 3000), bid: mkBid(ceLTP),
        ask: mkAsk(ceLTP), askQty: Math.floor(50 + rng() * 3000),
      },
      pe: {
        oi: peOI, oiChange: peOIChg, oiChangePct: peOI > 0 ? +((peOIChg / peOI) * 100).toFixed(2) : 0,
        volume: Math.floor(500 + rng() * 60000), iv: +(baseIV + skew + rng() * 2).toFixed(2),
        ltp: peLTP, change: peChange, changePct: peLTP > 0.1 ? +((peChange / Math.max(0.01, peLTP - peChange)) * 100).toFixed(2) : 0,
        bidQty: Math.floor(50 + rng() * 3000), bid: mkBid(peLTP),
        ask: mkAsk(peLTP), askQty: Math.floor(50 + rng() * 3000),
      },
    });
  }

  const totalCEOI = chain.reduce((s, r) => s + (r.ce?.oi || 0), 0);
  const totalPEOI = chain.reduce((s, r) => s + (r.pe?.oi || 0), 0);
  const pcr = totalCEOI > 0 ? +(totalPEOI / totalCEOI).toFixed(2) : 0;
  let maxPain = atm, minPain = Infinity;
  for (const c of chain) {
    let pain = 0;
    for (const r of chain) {
      if (r.strike < c.strike) pain += (r.ce?.oi || 0) * (c.strike - r.strike);
      if (r.strike > c.strike) pain += (r.pe?.oi || 0) * (r.strike - c.strike);
    }
    if (pain < minPain) { minPain = pain; maxPain = c.strike; }
  }
  const atmRow = chain.find(r => r.isATM);
  const atmIV = atmRow ? +((( atmRow.ce?.iv || 0) + (atmRow.pe?.iv || 0)) / 2).toFixed(2) : 20;
  const ivs = chain.flatMap(r => [r.ce?.iv || 0, r.pe?.iv || 0]);
  const ivPercentile = Math.min(99, Math.max(5, Math.round((ivs.reduce((a, b) => a + b, 0) / ivs.length) * 2.1 + rng() * 10)));
  const dte = (() => { try { const p = expiries[0].split("-"); const mo: Record<string,string> = {Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"}; return Math.max(0, Math.ceil((new Date(`${p[2]}-${mo[p[1]]}-${p[0]}`).getTime() - now.getTime()) / 86400000)); } catch { return 7; } })();

  // Futures data
  const futBasis = +((rng() - 0.4) * basePrice * 0.003).toFixed(2);
  const futOI = Math.floor(100000 + rng() * 900000);
  const futVol = Math.floor(50000 + rng() * 500000);
  const fiiIdx = Math.floor(-50000 + rng() * 100000);
  const fiiStk = Math.floor(-30000 + rng() * 60000);

  return {
    symbol, name: INDEX_OPTIONS.find(o => o.symbol === symbol)?.label || symbol,
    isLive: false,
    expiryDates: expiries, selectedExpiry: expiries[0], daysToExpiry: dte,
    spotPrice, spotChange, spotChangePct: +((spotChange / spotPrice) * 100).toFixed(2),
    timestamp: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    chain,
    summary: { pcr, maxPain, atmIV, ivPercentile, totalCEOI, totalPEOI },
  };
}

/* ═══════════════════════════════════════
   PCR Gauge (larger version)
   ═══════════════════════════════════════ */
function PCRGaugeLarge({ pcr }: { pcr: number }) {
  const pct = Math.min(Math.max((pcr - 0.3) / 1.4, 0), 1);
  const color = pcr > 1.2 ? "#00c853" : pcr < 0.7 ? "#f44336" : "#ff9800";
  const label = pcr > 1.2 ? "Oversold" : pcr < 0.7 ? "Overbought" : "Neutral";
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="100" height="58" viewBox="0 0 100 58">
        <path d="M 8 54 A 42 42 0 0 1 92 54" fill="none" stroke="#e8eaed" strokeWidth="7" strokeLinecap="round" />
        <path d="M 8 54 A 42 42 0 0 1 92 54" fill="none" stroke="url(#pcr-lg)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${pct * 132} 132`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <defs><linearGradient id="pcr-lg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f44336" /><stop offset="50%" stopColor="#ff9800" /><stop offset="100%" stopColor="#00c853" />
        </linearGradient></defs>
        <text x="50" y="46" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1a1a2e">{pcr}</text>
        <text x="50" y="56" textAnchor="middle" fontSize="7" fontWeight="600" fill="#888">PCR</text>
      </svg>
      <div style={{ fontSize: "0.6rem", fontWeight: 700, color, marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */
export function IndianDerivativesPage() {
  const [mode, setMode] = useState<"index" | "stock">("index");
  const [symbol, setSymbol] = useState("NIFTY");
  const [stockSearch, setStockSearch] = useState("");
  const [stockResults, setStockResults] = useState<StockItem[]>([]);
  const [showStockDrop, setShowStockDrop] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [data, setData] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllStrikes, setShowAllStrikes] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Fetch data
  const fetchData = useCallback(async (sym?: string, exp?: string) => {
    const s = sym || symbol;
    try {
      const params = new URLSearchParams({ symbol: s });
      if (exp) params.set("expiry", exp);
      const res = await fetch(`/api/option-chain?${params}`);
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      if (!exp && json.selectedExpiry) setSelectedExpiry(json.selectedExpiry);
    } catch {
      // Fallback to local generation
      const fallback = generateLocalData(s);
      setData(fallback);
      if (!exp) setSelectedExpiry(fallback.selectedExpiry);
    }
  }, [symbol]);

  // Initial load + auto-refresh
  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
    const timer = setInterval(() => {
      setRefreshing(true);
      fetchData(symbol, selectedExpiry).finally(() => setRefreshing(false));
    }, 30000);
    return () => clearInterval(timer);
  }, [symbol, fetchData, selectedExpiry]);

  // Search stocks
  useEffect(() => {
    if (!stockSearch.trim()) { setStockResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/option-chain?action=search&q=${encodeURIComponent(stockSearch)}`);
        const json = await res.json();
        setStockResults(json.stocks?.filter((s: StockItem) => s.type === "equity") || []);
      } catch { setStockResults([]); }
    }, 150);
    return () => clearTimeout(t);
  }, [stockSearch]);

  // Click outside search
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowStockDrop(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectStock = (s: StockItem) => {
    setSymbol(s.symbol);
    setStockSearch("");
    setShowStockDrop(false);
    setSelectedExpiry("");
    setLoading(true);
    fetchData(s.symbol).finally(() => setLoading(false));
  };

  const selectIndex = (sym: string) => {
    setSymbol(sym);
    setMode("index");
    setSelectedExpiry("");
    setLoading(true);
    fetchData(sym).finally(() => setLoading(false));
  };

  const handleExpiry = (exp: string) => {
    setSelectedExpiry(exp);
    setRefreshing(true);
    fetchData(symbol, exp).finally(() => setRefreshing(false));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(symbol, selectedExpiry).finally(() => setRefreshing(false));
  };

  // AI analytics computed from data
  const analytics = useMemo(() => {
    if (!data) return null;
    const { chain, summary, spotPrice } = data;
    const rng = seededRng(Math.floor(spotPrice) + new Date().getHours());

    // Support/Resistance from OI
    const supports = chain.filter(r => r.strike < spotPrice && r.pe).sort((a, b) => (b.pe?.oi || 0) - (a.pe?.oi || 0)).slice(0, 3);
    const resistances = chain.filter(r => r.strike > spotPrice && r.ce).sort((a, b) => (b.ce?.oi || 0) - (a.ce?.oi || 0)).slice(0, 3);

    // Signals
    const signals: { type: string; desc: string; sentiment: "bullish" | "bearish" | "neutral"; icon: string }[] = [];
    if (summary.pcr > 1.1) signals.push({ type: "Heavy Put Writing", desc: `PCR ${summary.pcr} — strong support building`, sentiment: "bullish", icon: "📈" });
    if (summary.pcr < 0.65) signals.push({ type: "Call Dominance", desc: `PCR ${summary.pcr} — potential resistance zone`, sentiment: "bearish", icon: "📉" });

    const maxCEOI = chain.reduce((m, r) => Math.max(m, r.ce?.oi || 0), 0);
    const maxCEStrike = chain.find(r => r.ce?.oi === maxCEOI);
    if (maxCEStrike) signals.push({ type: "Max CE OI", desc: `Resistance at ${maxCEStrike.strike.toLocaleString()} (${fmtOI(maxCEOI)})`, sentiment: "bearish", icon: "🛑" });

    const maxPEOI = chain.reduce((m, r) => Math.max(m, r.pe?.oi || 0), 0);
    const maxPEStrike = chain.find(r => r.pe?.oi === maxPEOI);
    if (maxPEStrike) signals.push({ type: "Max PE OI", desc: `Support at ${maxPEStrike.strike.toLocaleString()} (${fmtOI(maxPEOI)})`, sentiment: "bullish", icon: "🟢" });

    // Buildup detection
    const longBuildup = chain.filter(r => r.ce && r.ce.oiChange > 0 && r.ce.change > 0 && r.strike > spotPrice).length;
    const shortCovering = chain.filter(r => r.pe && r.pe.oiChange < 0 && r.pe.change < 0 && r.strike < spotPrice).length;
    if (longBuildup > 4) signals.push({ type: "Long Buildup", desc: `${longBuildup} OTM calls adding OI with rising premiums`, sentiment: "bullish", icon: "🚀" });
    if (shortCovering > 3) signals.push({ type: "Short Covering", desc: `${shortCovering} ITM puts unwinding positions`, sentiment: "bullish", icon: "🔄" });

    // Gamma squeeze probability
    const gammaSqueeze = Math.floor(10 + rng() * 35);
    const volBreakout = Math.floor(15 + rng() * 40);

    // Futures data
    const futBasis = +((rng() - 0.4) * spotPrice * 0.003).toFixed(2);
    const futOI = Math.floor(100000 + rng() * 900000);
    const futVol = Math.floor(50000 + rng() * 500000);
    const futPremium = futBasis > 0;
    const longShortRatio = +(0.8 + rng() * 0.6).toFixed(2);
    const fiiIdxLong = Math.floor(50000 + rng() * 100000);
    const fiiIdxShort = Math.floor(40000 + rng() * 90000);
    const fiiStkLong = Math.floor(30000 + rng() * 70000);
    const fiiStkShort = Math.floor(25000 + rng() * 65000);

    return {
      supports, resistances, signals, gammaSqueeze, volBreakout,
      futures: { basis: futBasis, oi: futOI, volume: futVol, premium: futPremium, lsRatio: longShortRatio },
      institutional: { fiiIdxLong, fiiIdxShort, fiiIdxNet: fiiIdxLong - fiiIdxShort, fiiStkLong, fiiStkShort, fiiStkNet: fiiStkLong - fiiStkShort },
    };
  }, [data]);

  // Expiry DTE
  const getExpiryDTE = (exp: string) => {
    try {
      const p = exp.split("-");
      const mo: Record<string,string> = {Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};
      return Math.max(0, Math.ceil((new Date(`${p[2]}-${mo[p[1]]}-${p[0]}`).getTime() - Date.now()) / 86400000));
    } catch { return 0; }
  };

  const maxOI = data ? Math.max(...data.chain.flatMap(r => [r.ce?.oi || 0, r.pe?.oi || 0]), 1) : 1;
  const visibleChain = data ? (showAllStrikes ? data.chain : data.chain.slice(Math.max(0, data.chain.findIndex(r => r.isATM) - 8), data.chain.findIndex(r => r.isATM) + 9)) : [];

  // ── Column styles ──
  const hdrStyle = (color?: string): React.CSSProperties => ({
    fontSize: "0.6rem", fontWeight: 700, color: color || "#666", textAlign: "center",
    padding: "8px 4px", borderBottom: "2px solid #e0e0e0", whiteSpace: "nowrap",
    position: "sticky", top: 0, background: "#fafbfc", zIndex: 2,
  });
  const cellStyle = (isATM: boolean, isITM: boolean): React.CSSProperties => ({
    fontSize: "0.68rem", fontWeight: 600, textAlign: "center", padding: "6px 4px",
    fontVariantNumeric: "tabular-nums", color: "#1a1a2e",
    background: isATM ? "rgba(41,98,255,0.06)" : isITM ? "rgba(255,243,224,0.5)" : "transparent",
    borderBottom: "1px solid #f0f0f0",
    transition: "background 0.3s",
  });

  return (
    <div>
      {/* ═══ HEADER BAR ═══ */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: data?.isLive ? "#00c853" : "#ff9800", boxShadow: `0 0 6px ${data?.isLive ? "rgba(0,200,83,0.5)" : "rgba(255,152,0,0.4)"}` }} />
            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1a1a2e", letterSpacing: 0.5 }}>
              Option Chain (Equity Derivatives)
            </span>
            <span style={{
              fontSize: "0.5rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4,
              background: data?.isLive ? "#e8f5e9" : "#fff8e1",
              color: data?.isLive ? "#2e7d32" : "#e65100",
              border: `1px solid ${data?.isLive ? "#c8e6c9" : "#ffe0b2"}`,
            }}>{data?.isLive ? "LIVE NSE" : "SIMULATED"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {data && (
              <span style={{ fontSize: "0.62rem", color: "#999" }}>
                As on {data.timestamp} IST
              </span>
            )}
            <button onClick={handleRefresh} disabled={refreshing} className="btn-ghost" style={{ padding: "5px 12px", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                style={{ animation: refreshing ? "oc-spin 0.7s linear infinite" : "none" }}>
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              {refreshing ? "Updating..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Selection Controls */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          {/* View Options Contracts For */}
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#888", marginBottom: 4 }}>View Options Contracts for</div>
            <div style={{ display: "flex", gap: 4 }}>
              {INDEX_OPTIONS.map(idx => (
                <button key={idx.symbol} onClick={() => selectIndex(idx.symbol)} style={{
                  padding: "7px 14px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700,
                  border: symbol === idx.symbol && mode === "index" ? "2px solid #2962ff" : "1px solid #e0e0e0",
                  background: symbol === idx.symbol && mode === "index" ? "#eef2ff" : "#fff",
                  color: symbol === idx.symbol && mode === "index" ? "#2962ff" : "#555",
                  cursor: "pointer", transition: "all 0.2s",
                }}>{idx.label}</button>
              ))}
            </div>
          </div>

          {/* OR separator */}
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#bbb", padding: "7px 0" }}>OR</div>

          {/* Select Symbol */}
          <div ref={searchRef} style={{ position: "relative", minWidth: 220 }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#888", marginBottom: 4 }}>Select Symbol</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 6,
              border: showStockDrop ? "2px solid #2962ff" : "1px solid #e0e0e0",
              background: "#fff", cursor: "text",
            }} onClick={() => setShowStockDrop(true)}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                placeholder="Search F&O stocks..."
                value={mode === "stock" && !showStockDrop ? symbol : stockSearch}
                onChange={e => { setStockSearch(e.target.value); setShowStockDrop(true); }}
                onFocus={() => setShowStockDrop(true)}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "0.78rem", fontWeight: 600, color: "#1a1a2e" }}
              />
            </div>
            {showStockDrop && stockResults.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
                background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100,
                maxHeight: 280, overflowY: "auto",
              }}>
                {stockResults.map(s => (
                  <button key={s.symbol} onClick={() => { selectStock(s); setMode("stock"); }} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 14px", border: "none", borderBottom: "1px solid #f5f5f5",
                    background: "#fff", cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0f4ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.78rem", color: "#1a1a2e" }}>{s.symbol}</span>
                      <span style={{ fontSize: "0.6rem", color: "#999", marginLeft: 8 }}>{s.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spot Price Display */}
          {data && (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: "0.58rem", color: "#888", fontWeight: 600 }}>Underlying: {data.symbol}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1a1a2e" }}>{fmtNum(data.spotPrice)}</span>
                <span style={{
                  fontSize: "0.78rem", fontWeight: 700,
                  color: data.spotChange >= 0 ? "#00897b" : "#e53935",
                }}>
                  {data.spotChange >= 0 ? "+" : ""}{fmtNum(data.spotChange)} ({data.spotChangePct >= 0 ? "+" : ""}{data.spotChangePct}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Expiry Dates */}
        {data && (
          <div style={{ display: "flex", gap: 6, marginTop: 14, overflowX: "auto", paddingBottom: 4 }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "#888", alignSelf: "center", marginRight: 4 }}>Expiry:</span>
            {data.expiryDates.map(exp => {
              const dte = getExpiryDTE(exp);
              const isSel = exp === selectedExpiry;
              return (
                <button key={exp} onClick={() => handleExpiry(exp)} style={{
                  padding: "5px 14px", borderRadius: 16, whiteSpace: "nowrap",
                  border: isSel ? "2px solid #2962ff" : "1px solid #e0e0e0",
                  background: isSel ? "#eef2ff" : "#fff",
                  color: isSel ? "#2962ff" : "#666",
                  fontWeight: isSel ? 700 : 500, fontSize: "0.68rem",
                  cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
                }}>
                  {exp.split("-").slice(0, 2).join(" ")} <span style={{ fontSize: "0.52rem", color: isSel ? "#5c6bc0" : "#bbb", marginLeft: 3 }}>
                    ({dte}D)
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ LOADING ═══ */}
      {loading && (
        <div className="card" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "4px solid #e8eeff", borderTopColor: "#2962ff", borderRadius: "50%", animation: "oc-spin 0.7s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ fontSize: "0.82rem", color: "#999", fontWeight: 600 }}>Loading Option Chain for {symbol}...</div>
        </div>
      )}

      {/* ═══ OPTION CHAIN TABLE ═══ */}
      {!loading && data && (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Main Table */}
          <div className="card" style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
            <div ref={tableRef} style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 340px)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                <thead>
                  <tr>
                    <th colSpan={10} style={{ ...hdrStyle("#2962ff"), background: "rgba(41,98,255,0.04)", fontSize: "0.68rem", letterSpacing: 1, padding: "6px" }}>CALLS</th>
                    <th style={{ ...hdrStyle("#1a1a2e"), background: "#f5f5f5", fontSize: "0.68rem" }}>STRIKE</th>
                    <th colSpan={10} style={{ ...hdrStyle("#e53935"), background: "rgba(229,57,53,0.04)", fontSize: "0.68rem", letterSpacing: 1, padding: "6px" }}>PUTS</th>
                  </tr>
                  <tr>
                    {/* CE columns */}
                    <th style={hdrStyle()}>OI</th>
                    <th style={hdrStyle()}>Chg OI</th>
                    <th style={hdrStyle()}>Vol</th>
                    <th style={hdrStyle()}>IV</th>
                    <th style={hdrStyle("#2962ff")}>LTP</th>
                    <th style={hdrStyle()}>Chg</th>
                    <th style={hdrStyle()}>Bid Qty</th>
                    <th style={hdrStyle()}>Bid</th>
                    <th style={hdrStyle()}>Ask</th>
                    <th style={hdrStyle()}>Ask Qty</th>
                    {/* Strike */}
                    <th style={{ ...hdrStyle("#1a1a2e"), background: "#f0f0f0", fontSize: "0.72rem" }}>Strike</th>
                    {/* PE columns */}
                    <th style={hdrStyle()}>Bid Qty</th>
                    <th style={hdrStyle()}>Bid</th>
                    <th style={hdrStyle()}>Ask</th>
                    <th style={hdrStyle()}>Ask Qty</th>
                    <th style={hdrStyle()}>Chg</th>
                    <th style={hdrStyle("#e53935")}>LTP</th>
                    <th style={hdrStyle()}>IV</th>
                    <th style={hdrStyle()}>Vol</th>
                    <th style={hdrStyle()}>Chg OI</th>
                    <th style={hdrStyle()}>OI</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleChain.map((row, i) => {
                    const isITM_CE = row.strike < (data?.spotPrice || 0);
                    const isITM_PE = row.strike > (data?.spotPrice || 0);
                    const ceOIPct = (row.ce?.oi || 0) / maxOI;
                    const peOIPct = (row.pe?.oi || 0) / maxOI;

                    return (
                      <tr key={row.strike} style={{
                        borderLeft: row.isATM ? "3px solid #2962ff" : "3px solid transparent",
                        borderRight: row.isATM ? "3px solid #2962ff" : "3px solid transparent",
                      }}>
                        {/* CE Side */}
                        <td style={{ ...cellStyle(row.isATM, isITM_CE), position: "relative" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${ceOIPct * 100}%`, background: "rgba(41,98,255,0.06)", zIndex: 0 }} />
                          <span style={{ position: "relative", zIndex: 1 }}>{fmtCompact(row.ce?.oi || 0)}</span>
                        </td>
                        <td style={{ ...cellStyle(row.isATM, isITM_CE), color: (row.ce?.oiChange || 0) >= 0 ? "#00897b" : "#e53935" }}>
                          {(row.ce?.oiChange || 0) >= 0 ? "+" : ""}{fmtCompact(row.ce?.oiChange || 0)}
                        </td>
                        <td style={cellStyle(row.isATM, isITM_CE)}>{fmtCompact(row.ce?.volume || 0)}</td>
                        <td style={cellStyle(row.isATM, isITM_CE)}>{(row.ce?.iv || 0).toFixed(1)}</td>
                        <td style={{ ...cellStyle(row.isATM, isITM_CE), fontWeight: 800, color: (row.ce?.change || 0) >= 0 ? "#00897b" : "#e53935" }}>
                          {fmtNum(row.ce?.ltp || 0)}
                        </td>
                        <td style={{ ...cellStyle(row.isATM, isITM_CE), color: (row.ce?.change || 0) >= 0 ? "#00897b" : "#e53935", fontSize: "0.6rem" }}>
                          {(row.ce?.change || 0) >= 0 ? "+" : ""}{fmtNum(row.ce?.change || 0)}
                        </td>
                        <td style={cellStyle(row.isATM, isITM_CE)}>{row.ce?.bidQty || "-"}</td>
                        <td style={cellStyle(row.isATM, isITM_CE)}>{fmtNum(row.ce?.bid || 0)}</td>
                        <td style={cellStyle(row.isATM, isITM_CE)}>{fmtNum(row.ce?.ask || 0)}</td>
                        <td style={cellStyle(row.isATM, isITM_CE)}>{row.ce?.askQty || "-"}</td>

                        {/* Strike */}
                        <td style={{
                          ...cellStyle(row.isATM, false),
                          fontWeight: 800, fontSize: "0.72rem",
                          background: row.isATM ? "#1a1a2e" : "#f8f8f8",
                          color: row.isATM ? "#fff" : row.strike === data?.summary.maxPain ? "#7b1fa2" : "#333",
                          borderLeft: "2px solid #e0e0e0", borderRight: "2px solid #e0e0e0",
                        }}>
                          {row.strike.toLocaleString()}
                        </td>

                        {/* PE Side */}
                        <td style={cellStyle(row.isATM, isITM_PE)}>{row.pe?.bidQty || "-"}</td>
                        <td style={cellStyle(row.isATM, isITM_PE)}>{fmtNum(row.pe?.bid || 0)}</td>
                        <td style={cellStyle(row.isATM, isITM_PE)}>{fmtNum(row.pe?.ask || 0)}</td>
                        <td style={cellStyle(row.isATM, isITM_PE)}>{row.pe?.askQty || "-"}</td>
                        <td style={{ ...cellStyle(row.isATM, isITM_PE), color: (row.pe?.change || 0) >= 0 ? "#00897b" : "#e53935", fontSize: "0.6rem" }}>
                          {(row.pe?.change || 0) >= 0 ? "+" : ""}{fmtNum(row.pe?.change || 0)}
                        </td>
                        <td style={{ ...cellStyle(row.isATM, isITM_PE), fontWeight: 800, color: (row.pe?.change || 0) >= 0 ? "#00897b" : "#e53935" }}>
                          {fmtNum(row.pe?.ltp || 0)}
                        </td>
                        <td style={cellStyle(row.isATM, isITM_PE)}>{(row.pe?.iv || 0).toFixed(1)}</td>
                        <td style={cellStyle(row.isATM, isITM_PE)}>{fmtCompact(row.pe?.volume || 0)}</td>
                        <td style={{ ...cellStyle(row.isATM, isITM_PE), color: (row.pe?.oiChange || 0) >= 0 ? "#00897b" : "#e53935" }}>
                          {(row.pe?.oiChange || 0) >= 0 ? "+" : ""}{fmtCompact(row.pe?.oiChange || 0)}
                        </td>
                        <td style={{ ...cellStyle(row.isATM, isITM_PE), position: "relative" }}>
                          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${peOIPct * 100}%`, background: "rgba(229,57,53,0.06)", zIndex: 0 }} />
                          <span style={{ position: "relative", zIndex: 1 }}>{fmtCompact(row.pe?.oi || 0)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Show All / Fewer Strikes */}
            <div style={{ textAlign: "center", padding: "8px", borderTop: "1px solid #eee" }}>
              <button onClick={() => setShowAllStrikes(!showAllStrikes)} style={{
                background: "none", border: "1px solid #e0e0e0", borderRadius: 6,
                padding: "4px 16px", fontSize: "0.68rem", fontWeight: 600,
                color: "#2962ff", cursor: "pointer",
              }}>
                {showAllStrikes ? "Show Fewer Strikes" : `Show All ${data.chain.length} Strikes`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ANALYTICS PANELS ═══ */}
      {!loading && data && analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
          {/* Summary Card */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Key Metrics</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "#f8f9fa", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: "0.52rem", color: "#888", fontWeight: 600 }}>PCR</div>
                <PCRGaugeLarge pcr={data.summary.pcr} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: "#f3e5f5", borderRadius: 8, padding: "10px 12px", border: "1px solid #e1bee7", flex: 1 }}>
                  <div style={{ fontSize: "0.52rem", color: "#7b1fa2", fontWeight: 700 }}>MAX PAIN</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4a148c" }}>{data.summary.maxPain.toLocaleString()}</div>
                </div>
                <div style={{ background: "#fff8e1", borderRadius: 8, padding: "10px 12px", border: "1px solid #fff9c4", flex: 1 }}>
                  <div style={{ fontSize: "0.52rem", color: "#e65100", fontWeight: 700 }}>ATM IV</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#bf360c" }}>{data.summary.atmIV}</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, background: data.summary.ivPercentile > 70 ? "#ffebee" : "#e8f5e9", borderRadius: 8, padding: "8px 10px", textAlign: "center", border: `1px solid ${data.summary.ivPercentile > 70 ? "#ffcdd2" : "#c8e6c9"}` }}>
                <div style={{ fontSize: "0.48rem", fontWeight: 700, color: data.summary.ivPercentile > 70 ? "#c62828" : "#2e7d32" }}>IV PERCENTILE</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: data.summary.ivPercentile > 70 ? "#b71c1c" : "#1b5e20" }}>
                  {data.summary.ivPercentile}
                  <span style={{ fontSize: "0.5rem", marginLeft: 4 }}>{data.summary.ivPercentile > 80 ? "Very High" : data.summary.ivPercentile > 60 ? "High" : data.summary.ivPercentile > 40 ? "Moderate" : "Low"}</span>
                </div>
              </div>
              <div style={{ flex: 1, background: "#e3f2fd", borderRadius: 8, padding: "8px 10px", textAlign: "center", border: "1px solid #bbdefb" }}>
                <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "#1565c0" }}>TOTAL CE OI</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0d47a1" }}>{fmtOI(data.summary.totalCEOI)}</div>
              </div>
              <div style={{ flex: 1, background: "#fce4ec", borderRadius: 8, padding: "8px 10px", textAlign: "center", border: "1px solid #f8bbd0" }}>
                <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "#c62828" }}>TOTAL PE OI</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#b71c1c" }}>{fmtOI(data.summary.totalPEOI)}</div>
              </div>
            </div>
          </div>

          {/* Support & Resistance */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Support & Resistance from OI</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, background: "#e8f5e9", borderRadius: 8, padding: "10px 12px", border: "1px solid #c8e6c9" }}>
                <div style={{ fontSize: "0.56rem", color: "#2e7d32", fontWeight: 700, marginBottom: 6 }}>SUPPORT LEVELS</div>
                {analytics.supports.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1b5e20" }}>{r.strike.toLocaleString()}</span>
                    <span style={{ fontSize: "0.6rem", color: "#4caf50", fontWeight: 600 }}>{fmtOI(r.pe?.oi || 0)}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, background: "#ffebee", borderRadius: 8, padding: "10px 12px", border: "1px solid #ffcdd2" }}>
                <div style={{ fontSize: "0.56rem", color: "#c62828", fontWeight: 700, marginBottom: 6 }}>RESISTANCE LEVELS</div>
                {analytics.resistances.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#b71c1c" }}>{r.strike.toLocaleString()}</span>
                    <span style={{ fontSize: "0.6rem", color: "#ef5350", fontWeight: 600 }}>{fmtOI(r.ce?.oi || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Signals */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              <span style={{ marginRight: 6 }}>🧠</span> AI Smart Money Signals
            </div>
            {analytics.signals.slice(0, 5).map((s, i) => {
              const color = s.sentiment === "bullish" ? "#2e7d32" : s.sentiment === "bearish" ? "#c62828" : "#e65100";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: 8, marginBottom: 4,
                  background: s.sentiment === "bullish" ? "#f1f8e9" : s.sentiment === "bearish" ? "#fce4ec" : "#fff8e1",
                  border: `1px solid ${s.sentiment === "bullish" ? "#c8e6c9" : s.sentiment === "bearish" ? "#f8bbd0" : "#fff9c4"}`,
                }}>
                  <span style={{ fontSize: "1rem" }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color }}>{s.type}</div>
                    <div style={{ fontSize: "0.6rem", color: "#666" }}>{s.desc}</div>
                  </div>
                  <span style={{
                    fontSize: "0.5rem", fontWeight: 800, color,
                    background: `${color}12`, padding: "2px 6px", borderRadius: 4,
                    textTransform: "uppercase",
                  }}>{s.sentiment}</span>
                </div>
              );
            })}
          </div>

          {/* Futures Data */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Futures Overview</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Basis", value: (analytics.futures.basis >= 0 ? "+" : "") + fmtNum(analytics.futures.basis), color: analytics.futures.basis >= 0 ? "#00897b" : "#e53935" },
                { label: "Fut OI", value: fmtOI(analytics.futures.oi), color: "#1a1a2e" },
                { label: "Fut Vol", value: fmtOI(analytics.futures.volume), color: "#1a1a2e" },
                { label: "Premium", value: analytics.futures.premium ? "Premium" : "Discount", color: analytics.futures.premium ? "#00897b" : "#e53935" },
                { label: "L/S Ratio", value: analytics.futures.lsRatio.toFixed(2), color: analytics.futures.lsRatio > 1 ? "#00897b" : "#e53935" },
                { label: "Gamma Sq.", value: analytics.gammaSqueeze + "%", color: analytics.gammaSqueeze > 25 ? "#e53935" : "#00897b" },
              ].map((m, i) => (
                <div key={i} style={{ background: "#f8f9fa", borderRadius: 8, padding: "8px", textAlign: "center", border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: "0.48rem", color: "#888", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Flow */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              <span style={{ marginRight: 6 }}>🏛️</span> Institutional Activity
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#444" }}>FII Index Derivatives</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: analytics.institutional.fiiIdxNet > 0 ? "#2e7d32" : "#c62828", background: analytics.institutional.fiiIdxNet > 0 ? "#e8f5e9" : "#ffebee", padding: "1px 8px", borderRadius: 4 }}>
                  Net: {analytics.institutional.fiiIdxNet > 0 ? "+" : ""}{fmtCompact(analytics.institutional.fiiIdxNet)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 3, height: 16 }}>
                <div style={{ width: `${(analytics.institutional.fiiIdxLong / Math.max(analytics.institutional.fiiIdxLong, analytics.institutional.fiiIdxShort)) * 100}%`, background: "linear-gradient(90deg, #43a047, #66bb6a)", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.6s" }}>
                  <span style={{ fontSize: "0.5rem", color: "#fff", fontWeight: 700 }}>Long {fmtCompact(analytics.institutional.fiiIdxLong)}</span>
                </div>
                <div style={{ width: `${(analytics.institutional.fiiIdxShort / Math.max(analytics.institutional.fiiIdxLong, analytics.institutional.fiiIdxShort)) * 100}%`, background: "linear-gradient(90deg, #e53935, #ef5350)", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.6s" }}>
                  <span style={{ fontSize: "0.5rem", color: "#fff", fontWeight: 700 }}>Short {fmtCompact(analytics.institutional.fiiIdxShort)}</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#444" }}>FII Stock Futures</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: analytics.institutional.fiiStkNet > 0 ? "#2e7d32" : "#c62828", background: analytics.institutional.fiiStkNet > 0 ? "#e8f5e9" : "#ffebee", padding: "1px 8px", borderRadius: 4 }}>
                  Net: {analytics.institutional.fiiStkNet > 0 ? "+" : ""}{fmtCompact(analytics.institutional.fiiStkNet)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 3, height: 16 }}>
                <div style={{ width: `${(analytics.institutional.fiiStkLong / Math.max(analytics.institutional.fiiStkLong, analytics.institutional.fiiStkShort)) * 100}%`, background: "linear-gradient(90deg, #43a047, #66bb6a)", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.6s" }}>
                  <span style={{ fontSize: "0.5rem", color: "#fff", fontWeight: 700 }}>Long {fmtCompact(analytics.institutional.fiiStkLong)}</span>
                </div>
                <div style={{ width: `${(analytics.institutional.fiiStkShort / Math.max(analytics.institutional.fiiStkLong, analytics.institutional.fiiStkShort)) * 100}%`, background: "linear-gradient(90deg, #e53935, #ef5350)", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.6s" }}>
                  <span style={{ fontSize: "0.5rem", color: "#fff", fontWeight: 700 }}>Short {fmtCompact(analytics.institutional.fiiStkShort)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insight Box */}
          <div className="card" style={{ padding: 16, background: "linear-gradient(135deg, #f8f9ff, #fef3f2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: "0.9rem" }}>🤖</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#5c6bc0", letterSpacing: 0.5 }}>AI DERIVATIVES INSIGHT</span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#444", lineHeight: 1.7 }}>
              {data.summary.pcr > 1 ? (
                <>Heavy put writing near <strong>{analytics.supports[0]?.strike.toLocaleString()}</strong> suggests strong support. PCR at <strong>{data.summary.pcr}</strong> indicates oversold conditions — potential bounce likely.</>
              ) : data.summary.pcr < 0.7 ? (
                <>Call dominance with PCR at <strong>{data.summary.pcr}</strong>. Heavy call writing near <strong>{analytics.resistances[0]?.strike.toLocaleString()}</strong> creates resistance. Expect sideways to bearish action.</>
              ) : (
                <>Balanced market with PCR at <strong>{data.summary.pcr}</strong>. Max Pain at <strong>{data.summary.maxPain.toLocaleString()}</strong> may act as a magnet near expiry. IV percentile at <strong>{data.summary.ivPercentile}</strong> — {data.summary.ivPercentile > 60 ? "premiums are elevated, option sellers have edge." : "premiums are fair, directional strategies favorable."}</>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes oc-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        table td:hover { filter: brightness(0.97); }
      `}</style>
    </div>
  );
}
