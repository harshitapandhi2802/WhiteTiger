"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";


type MainTab = "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international" | "derivatives" | "realestate" | "wealth" | "tax";

/* ─── Deterministic seed-based random ─── */
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

/* ─── Collapsible Section Wrapper ─── */
function CollapsibleSection({ title, icon, defaultOpen = true, badge, children }: {
  title: string; icon: string; defaultOpen?: boolean; badge?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "5px 6px", background: "none", border: "none", cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: "0.72rem" }}>{icon}</span>
          <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</span>
          {badge && <span style={{ fontSize: "0.46rem", fontWeight: 700, background: "#e8eeff", color: "#2962ff", padding: "1px 5px", borderRadius: 3 }}>{badge}</span>}
        </div>
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth={2.5}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div style={{
        maxHeight: open ? 2000 : 0, overflow: "hidden",
        transition: "max-height 0.35s ease, opacity 0.25s ease",
        opacity: open ? 1 : 0,
      }}>
        {children}
      </div>
    </div>
  );
}

/* ─── AI Insight Mode Toggle ─── */
function AIInsightBox({ beginner, institutional }: { beginner: string; institutional: string }) {
  const [mode, setMode] = useState<"beginner" | "institutional">("beginner");
  return (
    <div style={{ background: "linear-gradient(135deg, #f0f4ff, #fef3f2)", borderRadius: 8, padding: "7px 9px", border: "1px solid #e0e5f0", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: "0.6rem" }}>🤖</span>
          <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "#5c6bc0", letterSpacing: 0.3 }}>AI INSIGHT</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {(["beginner", "institutional"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "1px 5px", borderRadius: 3, border: "none", cursor: "pointer",
              background: mode === m ? "#5c6bc0" : "rgba(0,0,0,0.04)",
              color: mode === m ? "#fff" : "#999",
              fontSize: "0.44rem", fontWeight: 700, textTransform: "uppercase",
              transition: "all 0.2s",
            }}>{m === "beginner" ? "Simple" : "Pro"}</button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: "0.56rem", color: "#444", lineHeight: 1.5, fontStyle: "italic" }}>
        {mode === "beginner" ? beginner : institutional}
      </div>
    </div>
  );
}

/* ─── Mini Risk Meter Bar ─── */
function RiskMeter({ label, value, color, max = 100 }: { label: string; value: number; color: string; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: "0.52rem", fontWeight: 600, color: "#666" }}>{label}</span>
        <span style={{ fontSize: "0.52rem", fontWeight: 800, color }}>{value.toFixed(0)}%</span>
      </div>
      <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

/* ─── Mini Score Gauge (circular) ─── */
function MiniGauge({ value, label, size = 44, color }: { value: number; label: string; size?: number; color: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / 100, 1);
  const dash = pct * circ * 0.75;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={3}
          strokeDasharray={`${circ * 0.75} ${circ}`} strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.26} fontWeight={800} fill="#1a1a2e">{value}</text>
      </svg>
      <div style={{ fontSize: "0.42rem", fontWeight: 600, color: "#888", marginTop: -2, letterSpacing: 0.2 }}>{label}</div>
    </div>
  );
}

/* ─── Generate all derivatives + quant data ─── */
function generateDerivativesData(tab: MainTab) {
  const now = new Date();
  const seed = now.getHours() * 3600 + Math.floor(now.getMinutes() / 5) * 300 + tab.charCodeAt(0);
  const rng = seededRandom(seed);

  const FUTURES_BY_TAB: Record<string, { name: string; base: number; currency: string }[]> = {
    stocks: [
      { name: "SGX Nifty", base: 23250, currency: "" },
      { name: "Dow Futures", base: 42800, currency: "$" },
      { name: "Nasdaq Futures", base: 18950, currency: "$" },
      { name: "S&P 500 Futures", base: 5420, currency: "$" },
      { name: "Nikkei Futures", base: 38200, currency: "¥" },
      { name: "DAX Futures", base: 18800, currency: "€" },
      { name: "FTSE Futures", base: 8250, currency: "£" },
      { name: "Hang Seng Futures", base: 18500, currency: "HK$" },
    ],
    commodities: [
      { name: "Gold Futures", base: 2420, currency: "$" },
      { name: "Silver Futures", base: 31.5, currency: "$" },
      { name: "Crude Oil (WTI)", base: 82, currency: "$" },
      { name: "Brent Crude", base: 86, currency: "$" },
      { name: "Natural Gas", base: 2.9, currency: "$" },
      { name: "Copper Futures", base: 4.65, currency: "$" },
      { name: "MCX Gold", base: 72500, currency: "₹" },
      { name: "MCX Crude", base: 6850, currency: "₹" },
    ],
    crypto: [
      { name: "BTC Perpetual", base: 68500, currency: "$" },
      { name: "ETH Perpetual", base: 3750, currency: "$" },
      { name: "BTC Jun Futures", base: 69200, currency: "$" },
      { name: "ETH Jun Futures", base: 3820, currency: "$" },
      { name: "SOL Perpetual", base: 175, currency: "$" },
      { name: "BTC Sep Futures", base: 70100, currency: "$" },
      { name: "BTC Options OI", base: 18.5, currency: "$" },
      { name: "ETH Options OI", base: 6.2, currency: "$" },
    ],
    currency: [
      { name: "USD/INR Futures", base: 83.45, currency: "₹" },
      { name: "EUR/INR Futures", base: 90.2, currency: "₹" },
      { name: "GBP/INR Futures", base: 106.8, currency: "₹" },
      { name: "JPY/INR Futures", base: 0.538, currency: "₹" },
      { name: "EUR/USD Futures", base: 1.082, currency: "$" },
      { name: "GBP/USD Futures", base: 1.275, currency: "$" },
      { name: "USD/JPY Futures", base: 155.2, currency: "¥" },
      { name: "DXY Futures", base: 104.2, currency: "" },
    ],
    mutualfunds: [
      { name: "SGX Nifty", base: 23250, currency: "" },
      { name: "Nifty Bank Futures", base: 49800, currency: "" },
      { name: "Nifty IT Futures", base: 34200, currency: "" },
      { name: "Nifty Midcap Fut", base: 52100, currency: "" },
      { name: "S&P 500 Futures", base: 5420, currency: "$" },
      { name: "Gold Futures", base: 2420, currency: "$" },
    ],
    debt: [
      { name: "US 10Y Note Fut", base: 109.5, currency: "$" },
      { name: "US 30Y Bond Fut", base: 118.2, currency: "$" },
      { name: "US 2Y Note Fut", base: 102.8, currency: "$" },
      { name: "Euro-Bund Fut", base: 131.5, currency: "€" },
      { name: "JGB 10Y Futures", base: 143.8, currency: "¥" },
      { name: "India G-Sec Fut", base: 101.2, currency: "₹" },
    ],
    international: [
      { name: "S&P 500 Futures", base: 5420, currency: "$" },
      { name: "Nasdaq Futures", base: 18950, currency: "$" },
      { name: "Dow Futures", base: 42800, currency: "$" },
      { name: "DAX Futures", base: 18800, currency: "€" },
      { name: "FTSE Futures", base: 8250, currency: "£" },
      { name: "Nikkei Futures", base: 38200, currency: "¥" },
      { name: "Hang Seng Futures", base: 18500, currency: "HK$" },
      { name: "SGX Nifty", base: 23250, currency: "" },
    ],
  };

  const GLOBAL_CONTRACTS = [
    { name: "S&P 500 Fut", base: 5420, currency: "$" },
    { name: "Nasdaq Fut", base: 18950, currency: "$" },
    { name: "Dow Fut", base: 42800, currency: "$" },
    { name: "SGX Nifty", base: 23250, currency: "" },
    { name: "Nikkei Fut", base: 38200, currency: "¥" },
    { name: "Hang Seng Fut", base: 18500, currency: "HK$" },
    { name: "DAX Fut", base: 18800, currency: "€" },
    { name: "FTSE Fut", base: 8250, currency: "£" },
    { name: "Crude Oil WTI", base: 82, currency: "$" },
    { name: "Brent Crude", base: 86, currency: "$" },
    { name: "Gold Fut", base: 2420, currency: "$" },
    { name: "Nat Gas Fut", base: 2.9, currency: "$" },
    { name: "Bitcoin Fut", base: 68500, currency: "$" },
    { name: "US 10Y Bond", base: 109.5, currency: "$" },
  ];

  const futuresList = FUTURES_BY_TAB[tab] || FUTURES_BY_TAB.stocks;
  const futures = futuresList.map(f => {
    const changePct = (rng() - 0.48) * 3.5;
    const change = f.base * changePct / 100;
    const oi = Math.floor(50000 + rng() * 450000);
    const oiChange = Math.floor((rng() - 0.45) * 30000);
    const volume = Math.floor(10000 + rng() * 200000);
    const volSpike = rng() > 0.75;
    return {
      name: f.name, price: +(f.base + change).toFixed(f.base < 10 ? 3 : f.base < 100 ? 2 : f.base < 1000 ? 1 : 0),
      change: +change.toFixed(2), changePercent: +changePct.toFixed(2),
      oi, oiChange, currency: f.currency, volume, volSpike,
      signal: changePct > 1.2 ? "Bullish" : changePct < -1.2 ? "Bearish" : "Neutral",
      volatility: +(8 + rng() * 28).toFixed(1),
    };
  });

  const globalContracts = GLOBAL_CONTRACTS.map(f => {
    const changePct = (rng() - 0.48) * 3.5;
    const change = f.base * changePct / 100;
    const oi = Math.floor(50000 + rng() * 450000);
    const oiChange = Math.floor((rng() - 0.45) * 30000);
    const volume = Math.floor(10000 + rng() * 200000);
    const volSpike = rng() > 0.7;
    return {
      name: f.name, price: +(f.base + change).toFixed(f.base < 10 ? 3 : f.base < 100 ? 2 : f.base < 1000 ? 1 : 0),
      change: +change.toFixed(2), changePercent: +changePct.toFixed(2),
      oi, oiChange, currency: f.currency, volume, volSpike,
      signal: changePct > 1.2 ? "Bullish" as const : changePct < -1.2 ? "Bearish" as const : "Neutral" as const,
      volatility: +(8 + rng() * 28).toFixed(1),
    };
  });

  // PCR
  const pcr = +(0.6 + rng() * 0.9).toFixed(2);
  const pcrSignal = pcr > 1.2 ? "Oversold" : pcr < 0.7 ? "Overbought" : "Neutral";

  // Max Pain + Spot
  const spotBase = tab === "stocks" ? 23250 : tab === "crypto" ? 68500 : tab === "commodities" ? 2420 : tab === "currency" ? 83.45 : tab === "debt" ? 109.5 : tab === "mutualfunds" ? 23250 : 5420;
  const maxPain = Math.round(spotBase * (0.985 + rng() * 0.03));

  // IV
  const iv = +(12 + rng() * 25).toFixed(1);
  const ivRank = Math.floor(20 + rng() * 65);
  const ivPercentile = Math.floor(ivRank + rng() * 15);

  // FII/DII
  const fiiLong = Math.floor(40000 + rng() * 80000);
  const fiiShort = Math.floor(35000 + rng() * 75000);
  const diiLong = Math.floor(30000 + rng() * 60000);
  const diiShort = Math.floor(25000 + rng() * 55000);

  // Signals
  const signalTypes = [
    { type: "Long Buildup", sentiment: "bullish" as const, icon: "📈" },
    { type: "Short Covering", sentiment: "bullish" as const, icon: "🔄" },
    { type: "Short Buildup", sentiment: "bearish" as const, icon: "📉" },
    { type: "Long Unwinding", sentiment: "bearish" as const, icon: "⚠️" },
    { type: "Whale Activity", sentiment: "neutral" as const, icon: "🐋" },
    { type: "Gamma Squeeze", sentiment: "bullish" as const, icon: "🚀" },
    { type: "OI Spike", sentiment: "neutral" as const, icon: "⚡" },
    { type: "IV Crush Alert", sentiment: "bearish" as const, icon: "💥" },
  ];
  const signals: (typeof signalTypes[number] & { message: string; value: string })[] = [];
  const usedIdx = new Set<number>();
  for (let i = 0; i < 4; i++) {
    let idx: number;
    do { idx = Math.floor(rng() * signalTypes.length); } while (usedIdx.has(idx));
    usedIdx.add(idx);
    const s = signalTypes[idx];
    const messages: Record<string, string[]> = {
      stocks: ["NIFTY 23200 CE", "BANKNIFTY 49500 PE", "NIFTY 23400 CE", "RELIANCE Futures", "HDFCBANK 1680 CE"],
      crypto: ["BTC $70K Call", "ETH $4000 Put", "BTC $65K Put", "SOL $200 Call", "BTC Quarterly"],
      commodities: ["Gold $2450 Call", "Crude $85 Call", "Silver $33 Call", "MCX Gold 73000 CE", "NG $3.0 Put"],
      currency: ["USDINR 84 CE", "EURINR 91 CE", "USDINR 83 PE", "GBPUSD 1.28 Call", "DXY 105 Put"],
      mutualfunds: ["NIFTY 23500 CE", "BANKNIFTY 50000 CE", "NIFTY 22800 PE", "NIFTY Midcap Fut"],
      debt: ["US 10Y 4.5% Put", "India G-Sec Fut", "Euro-Bund Call", "US 2Y Note Fut"],
      international: ["S&P 5500 Call", "Nasdaq 19500 Call", "DAX 19000 Put", "Nikkei 40K Call"],
    };
    const msgs = messages[tab] || messages.stocks;
    signals.push({ ...s, message: msgs[Math.floor(rng() * msgs.length)], value: `${(rng() * 5 + 1).toFixed(1)}L contracts` });
  }

  // Option Chain (11 strikes around ATM)
  const atmStrike = tab === "stocks" ? Math.round(spotBase / 50) * 50
    : tab === "crypto" ? Math.round(spotBase / 1000) * 1000
    : tab === "commodities" ? Math.round(spotBase / 10) * 10
    : tab === "debt" ? Math.round(spotBase * 2) / 2
    : Math.round(spotBase * 100) / 100;

  const strikeGap = tab === "stocks" ? 50 : tab === "crypto" ? 1000 : tab === "commodities" ? 10 : tab === "debt" ? 0.5 : 0.25;
  const optionChain = [];
  for (let i = -5; i <= 5; i++) {
    const strike = +(atmStrike + i * strikeGap).toFixed(2);
    const distFromATM = Math.abs(i);
    const ceOI = Math.floor((80000 + rng() * 200000) * (1 + distFromATM * 0.15) * (i > 0 ? 1.3 : 0.8));
    const peOI = Math.floor((80000 + rng() * 200000) * (1 + distFromATM * 0.15) * (i < 0 ? 1.3 : 0.8));
    const ceGEX = +(rng() * 2 - 0.5).toFixed(2);
    const peGEX = +(rng() * -2 + 0.5).toFixed(2);
    const ceDelta = +(0.9 - distFromATM * 0.12 - rng() * 0.05).toFixed(2);
    const peDelta = +(-0.9 + distFromATM * 0.12 + rng() * 0.05).toFixed(2);
    optionChain.push({
      strike, isATM: i === 0,
      ceOI, ceOIChange: Math.floor((rng() - 0.45) * 20000),
      ceVolume: Math.floor(5000 + rng() * 50000),
      ceIV: +(iv - 2 + rng() * 4 + distFromATM * 0.8).toFixed(1),
      ceGEX, ceDelta: Math.max(-1, Math.min(1, ceDelta)),
      peOI, peOIChange: Math.floor((rng() - 0.45) * 20000),
      peVolume: Math.floor(5000 + rng() * 50000),
      peIV: +(iv - 2 + rng() * 4 + distFromATM * 0.8).toFixed(1),
      peGEX, peDelta: Math.max(-1, Math.min(0, peDelta)),
      whaleActivity: rng() > 0.82,
    });
  }

  // AI Quant Engine scores
  const bullProb = Math.floor(35 + rng() * 45);
  const bearProb = 100 - bullProb;
  const volProb = Math.floor(20 + rng() * 55);
  const liquidityStress = Math.floor(10 + rng() * 60);
  const momentum = Math.floor(25 + rng() * 55);
  const instAccum = Math.floor(30 + rng() * 50);
  const fearIndex = Math.floor(15 + rng() * 65);
  const crashRisk = Math.floor(5 + rng() * 35);

  // Market Regime
  const regimes = [
    { label: "Bull Market", color: "#00c853", bg: "#e8faf0" },
    { label: "Bear Market", color: "#f44336", bg: "#ffebee" },
    { label: "Sideways", color: "#ff9800", bg: "#fff8e1" },
    { label: "Panic Phase", color: "#d32f2f", bg: "#ffcdd2" },
    { label: "Accumulation", color: "#2962ff", bg: "#e8eeff" },
    { label: "Distribution", color: "#e65100", bg: "#fff3e0" },
    { label: "High Volatility", color: "#7b1fa2", bg: "#f3e5f5" },
  ];
  const regime = regimes[Math.floor(rng() * regimes.length)];

  // Gamma squeeze probability
  const gammaSqueeze = Math.floor(5 + rng() * 40);
  const volBreakout = Math.floor(10 + rng() * 50);

  // Monte Carlo scenarios
  const basePriceForScenario = spotBase;
  const bestCase = +(basePriceForScenario * (1 + 0.02 + rng() * 0.06)).toFixed(2);
  const baseCase = +(basePriceForScenario * (1 - 0.005 + rng() * 0.015)).toFixed(2);
  const worstCase = +(basePriceForScenario * (1 - 0.02 - rng() * 0.06)).toFixed(2);
  const expectedMove = +((rng() * 2.5 + 0.5)).toFixed(2);

  // Sector derivatives activity
  const sectors = tab === "stocks" ? ["Banking", "IT", "FMCG", "Pharma", "Auto", "Metal"] :
    tab === "crypto" ? ["Layer 1", "DeFi", "NFT", "Layer 2", "Exchange", "Meme"] :
    tab === "commodities" ? ["Energy", "Precious", "Base Metal", "Agri", "Soft", "Industrial"] :
    ["Major", "Minor", "Exotic", "EM", "Cross", "Index"];
  const sectorActivity = sectors.map(s => ({
    name: s,
    ce: Math.floor(10000 + rng() * 90000),
    pe: Math.floor(10000 + rng() * 90000),
    dominance: rng() > 0.5 ? "Call" as const : "Put" as const,
  }));

  // Block & bulk deals
  const blockDeals = Math.floor(2 + rng() * 8);
  const bulkDeals = Math.floor(1 + rng() * 5);
  const hedgingActivity = Math.floor(30 + rng() * 50);

  return {
    futures, globalContracts, pcr, pcrSignal, maxPain, iv, ivRank, ivPercentile,
    fii: { long: fiiLong, short: fiiShort, net: fiiLong - fiiShort },
    dii: { long: diiLong, short: diiShort, net: diiLong - diiShort },
    signals, optionChain, spotPrice: spotBase,
    quant: { bullProb, bearProb, volProb, liquidityStress, momentum, instAccum, fearIndex, crashRisk },
    regime, gammaSqueeze, volBreakout,
    monteCarlo: { bestCase, baseCase, worstCase, expectedMove },
    sectorActivity, blockDeals, bulkDeals, hedgingActivity,
  };
}

/* ═══ PCR Gauge Component ═══ */
function PCRGauge({ pcr, signal }: { pcr: number; signal: string }) {
  const angle = Math.min(Math.max((pcr - 0.3) / 1.4, 0), 1) * 180;
  const color = pcr > 1.2 ? "#00c853" : pcr < 0.7 ? "#f44336" : "#ff9800";
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="#e8eaed" strokeWidth="8" strokeLinecap="round" />
        <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="url(#pcr-grad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${angle / 180 * 157} 157`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
        <defs>
          <linearGradient id="pcr-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f44336" />
            <stop offset="50%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#00c853" />
          </linearGradient>
        </defs>
        <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="800" fill="#1a1a2e">{pcr}</text>
        <text x="60" y="68" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">PCR</text>
        <text x="10" y="10" fontSize="7" fill="#999">0.3</text>
        <text x="98" y="10" fontSize="7" fill="#999">1.7</text>
      </svg>
      <div style={{ fontSize: "0.62rem", fontWeight: 700, color, background: `${color}15`, padding: "2px 8px", borderRadius: 4, display: "inline-block", marginTop: 2 }}>{signal}</div>
    </div>
  );
}

/* ═══ OI Bars ═══ */
function OIBars({ optionChain }: { optionChain: ReturnType<typeof generateDerivativesData>["optionChain"] }) {
  const maxOI = Math.max(...optionChain.flatMap(r => [r.ceOI, r.peOI]));
  return (
    <div style={{ fontSize: "0.6rem" }}>
      {optionChain.map((row, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 2, marginBottom: 2,
          background: row.isATM ? "rgba(41,98,255,0.06)" : "transparent",
          borderRadius: 4, padding: "2px 4px",
          border: row.isATM ? "1px solid rgba(41,98,255,0.15)" : "1px solid transparent",
          transition: "background 0.3s",
        }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3 }}>
            <span style={{ color: "#888", fontVariantNumeric: "tabular-nums", fontSize: "0.55rem" }}>{(row.ceOI / 1000).toFixed(0)}K</span>
            <div style={{
              height: 10, borderRadius: 2, background: row.ceOIChange > 0 ? "#4caf50" : "#ef5350",
              width: `${(row.ceOI / maxOI) * 100}%`, minWidth: 2, opacity: 0.7, transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{
            width: 52, textAlign: "center", fontWeight: row.isATM ? 800 : 600,
            color: row.isATM ? "#2962ff" : "#444", fontSize: row.isATM ? "0.62rem" : "0.58rem", flexShrink: 0,
          }}>
            {row.strike.toLocaleString()}
            {row.whaleActivity && <span style={{ fontSize: "0.5rem" }} title="Whale detected">🐋</span>}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{
              height: 10, borderRadius: 2, background: row.peOIChange > 0 ? "#ef5350" : "#4caf50",
              width: `${(row.peOI / maxOI) * 100}%`, minWidth: 2, opacity: 0.7, transition: "width 0.6s ease",
            }} />
            <span style={{ color: "#888", fontVariantNumeric: "tabular-nums", fontSize: "0.55rem" }}>{(row.peOI / 1000).toFixed(0)}K</span>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 4px" }}>
        <span style={{ fontSize: "0.55rem", color: "#4caf50", fontWeight: 700 }}>CE OI</span>
        <span style={{ fontSize: "0.55rem", color: "#888" }}>Strike</span>
        <span style={{ fontSize: "0.55rem", color: "#ef5350", fontWeight: 700 }}>PE OI</span>
      </div>
    </div>
  );
}

/* ═══ IV Meter ═══ */
function IVMeter({ iv, ivRank, ivPercentile }: { iv: number; ivRank: number; ivPercentile: number }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[
        { label: "IV", value: `${iv}%`, color: "#1a1a2e" },
        { label: "IV Rank", value: `${ivRank}`, color: ivRank > 50 ? "#e65100" : "#2e7d32" },
        { label: "IV %ile", value: `${ivPercentile}`, color: ivPercentile > 60 ? "#e65100" : "#2e7d32" },
      ].map((m, i) => (
        <div key={i} style={{ flex: 1, background: "#f8f9fa", borderRadius: 8, padding: "8px 10px", textAlign: "center", transition: "transform 0.2s" }}>
          <div style={{ fontSize: "0.52rem", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: m.color }}>{m.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══ FII/DII Position Bars ═══ */
function PositionBars({ fii, dii }: { fii: { long: number; short: number; net: number }; dii: { long: number; short: number; net: number } }) {
  const maxVal = Math.max(fii.long, fii.short, dii.long, dii.short);
  const Bar = ({ label, long, short, net }: { label: string; long: number; short: number; net: number }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#444" }}>{label}</span>
        <span style={{
          fontSize: "0.58rem", fontWeight: 700, color: net > 0 ? "#2e7d32" : "#c62828",
          background: net > 0 ? "#e8f5e9" : "#ffebee", padding: "1px 6px", borderRadius: 4,
        }}>Net: {net > 0 ? "+" : ""}{(net / 1000).toFixed(1)}K</span>
      </div>
      <div style={{ display: "flex", gap: 3, height: 14 }}>
        <div style={{
          width: `${(long / maxVal) * 100}%`, background: "linear-gradient(90deg, #43a047, #66bb6a)",
          borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "width 0.6s ease",
        }}>
          <span style={{ fontSize: "0.48rem", color: "#fff", fontWeight: 700 }}>L {(long / 1000).toFixed(0)}K</span>
        </div>
        <div style={{
          width: `${(short / maxVal) * 100}%`, background: "linear-gradient(90deg, #e53935, #ef5350)",
          borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "width 0.6s ease",
        }}>
          <span style={{ fontSize: "0.48rem", color: "#fff", fontWeight: 700 }}>S {(short / 1000).toFixed(0)}K</span>
        </div>
      </div>
    </div>
  );
  return (
    <div>
      <Bar label="FII Derivatives" long={fii.long} short={fii.short} net={fii.net} />
      <Bar label="DII Derivatives" long={dii.long} short={dii.short} net={dii.net} />
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   MAIN DERIVATIVES PANEL — INSTITUTIONAL QUANT ENGINE
   ═══════════════════════════════════════════════════════════════ */
export function DerivativesPanel({ tab }: { tab: MainTab }) {
  const [data, setData] = useState(() => generateDerivativesData(tab));
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState<"overview" | "quant">("overview");
  const prevTab = useRef(tab);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setData(generateDerivativesData(tab));
      setLoading(false);
    }, 400);
  }, [tab]);

  useEffect(() => {
    if (prevTab.current !== tab) { prevTab.current = tab; refresh(); }
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [tab, refresh]);

  const { futures, globalContracts, pcr, pcrSignal, maxPain, iv, ivRank, ivPercentile, fii, dii, signals, optionChain, quant, regime, gammaSqueeze, volBreakout, monteCarlo, sectorActivity, blockDeals, bulkDeals, hedgingActivity } = data;

  // AI insights based on current data
  const aiInsights = useMemo(() => {
    const bullish = quant.bullProb > 55;
    const highVol = quant.volProb > 45;
    const highFear = quant.fearIndex > 50;
    return {
      beginner: bullish
        ? highVol ? "Markets lean positive but expect bigger swings. Good time to use stop losses." : "Markets look healthy with steady buying. Consider holding positions."
        : highFear ? "Fear is driving selling. Avoid panic decisions, wait for clarity." : "Markets face pressure. Consider reducing exposure or hedging.",
      institutional: bullish
        ? `Positive gamma positioning with ${pcr < 0.8 ? "call-heavy" : "balanced"} PCR at ${pcr}. IV rank ${ivRank} suggests ${ivRank > 50 ? "elevated premium" : "fair pricing"}. Net FII ${fii.net > 0 ? "long" : "short"} bias.`
        : `Negative delta tilt with PCR at ${pcr}. IV percentile ${ivPercentile} indicates ${ivPercentile > 60 ? "hedging demand" : "complacency"}. Monitor ${maxPain.toLocaleString()} max pain for expiry convergence.`,
    };
  }, [quant, pcr, ivRank, ivPercentile, fii.net, maxPain]);

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
      overflow: "hidden", display: "flex", flexDirection: "column",
      height: "100%", minHeight: 500, maxHeight: "calc(100vh - 80px)",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "10px 14px 6px", borderBottom: "1px solid #e5e7eb",
        background: "linear-gradient(135deg, #fef3f2, #fff1f0, #f8f9ff)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: loading ? "#ff9800" : "#00c853",
              boxShadow: `0 0 5px ${loading ? "rgba(255,152,0,0.5)" : "rgba(0,200,83,0.5)"}`,
              animation: loading ? "deriv-pulse 1.5s infinite" : "none",
            }} />
            <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#1a1a2e", letterSpacing: 0.8, textTransform: "uppercase" }}>
              Derivatives Intelligence
            </span>
          </div>
          <button onClick={refresh} disabled={loading} style={{
            background: "#f0f2f5", border: "1px solid #e0e3e8", borderRadius: 5,
            padding: "2px 7px", cursor: loading ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: 3, color: "#666", fontSize: "0.55rem", fontWeight: 600,
          }}>
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              style={{ animation: loading ? "deriv-spin 1s linear infinite" : "none" }}>
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Live
          </button>
        </div>

        {/* Market Regime Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{
            fontSize: "0.46rem", fontWeight: 800, color: regime.color, background: regime.bg,
            padding: "2px 7px", borderRadius: 4, letterSpacing: 0.3, border: `1px solid ${regime.color}30`,
          }}>
            {regime.label.toUpperCase()}
          </span>
          <span style={{ fontSize: "0.44rem", color: "#999" }}>
            Fear: {quant.fearIndex} | Crash Risk: {quant.crashRisk}%
          </span>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {(["overview", "quant"] as const).map(s => (
            <button key={s} onClick={() => setSection(s)} style={{
              flex: 1, padding: "4px 0", borderRadius: 5, border: "none",
              background: section === s ? "#2962ff" : "rgba(0,0,0,0.03)",
              color: section === s ? "#fff" : "#888",
              fontSize: "0.54rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
            }}>{s === "overview" ? "Overview" : "AI Quant"}</button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "8px 10px",
        scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.08) transparent",
      }}>

        {/* ═══ OVERVIEW TAB ═══ */}
        {section === "overview" && (
          <>
            {/* AI Insight Box */}
            <AIInsightBox beginner={aiInsights.beginner} institutional={aiInsights.institutional} />

            {/* ─ Futures Tracker ─ */}
            <CollapsibleSection title="Futures Tracker" icon="📊" badge="LIVE">
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                {futures.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "5px 8px", fontSize: "0.64rem",
                    background: i % 2 === 0 ? "#fafbfc" : "#fff",
                    borderBottom: i < futures.length - 1 ? "1px solid #f5f5f5" : "none",
                    transition: "background 0.2s",
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, color: "#333" }}>{f.name}</span>
                      {f.volSpike && <span style={{ fontSize: "0.4rem", marginLeft: 3, color: "#e65100", fontWeight: 800 }}>VOL</span>}
                    </div>
                    <span style={{ fontWeight: 700, color: "#1a1a2e", fontVariantNumeric: "tabular-nums", marginRight: 6, fontSize: "0.62rem" }}>
                      {f.currency}{f.price.toLocaleString()}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{
                        fontWeight: 700, fontSize: "0.56rem",
                        color: f.changePercent >= 0 ? "#2e7d32" : "#c62828",
                        minWidth: 42, textAlign: "right",
                      }}>
                        {f.changePercent >= 0 ? "+" : ""}{f.changePercent.toFixed(2)}%
                      </span>
                      <span style={{
                        fontSize: "0.38rem", fontWeight: 800,
                        color: f.signal === "Bullish" ? "#2e7d32" : f.signal === "Bearish" ? "#c62828" : "#888",
                        background: f.signal === "Bullish" ? "#e8f5e9" : f.signal === "Bearish" ? "#ffebee" : "#f5f5f5",
                        padding: "1px 3px", borderRadius: 2,
                      }}>
                        {f.signal === "Bullish" ? "B" : f.signal === "Bearish" ? "S" : "N"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* ─ Global Major Contracts ─ */}
            <CollapsibleSection title="Global Contracts" icon="🌍" defaultOpen={false} badge="14">
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                {globalContracts.map((c, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "4px 8px", fontSize: "0.58rem",
                    background: i % 2 === 0 ? "#fafbfc" : "#fff",
                    borderBottom: i < globalContracts.length - 1 ? "1px solid #f5f5f5" : "none",
                  }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontWeight: 600, color: "#333" }}>{c.name}</span>
                      {c.volSpike && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#e65100", flexShrink: 0 }} title="Volume Spike" />}
                    </div>
                    <span style={{ fontWeight: 700, color: "#1a1a2e", fontVariantNumeric: "tabular-nums", marginRight: 5, fontSize: "0.56rem" }}>
                      {c.currency}{c.price.toLocaleString()}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{
                        fontWeight: 700, fontSize: "0.52rem",
                        color: c.changePercent >= 0 ? "#2e7d32" : "#c62828", minWidth: 38, textAlign: "right",
                      }}>
                        {c.changePercent >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
                      </span>
                      <span style={{
                        fontSize: "0.34rem", fontWeight: 800,
                        color: c.signal === "Bullish" ? "#fff" : c.signal === "Bearish" ? "#fff" : "#888",
                        background: c.signal === "Bullish" ? "#43a047" : c.signal === "Bearish" ? "#e53935" : "#e0e0e0",
                        padding: "1px 3px", borderRadius: 2, lineHeight: 1,
                      }}>{c.signal[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 4, display: "flex", gap: 4, justifyContent: "center" }}>
                <span style={{ fontSize: "0.44rem", color: "#43a047", fontWeight: 600 }}>
                  {globalContracts.filter(c => c.signal === "Bullish").length} Bullish
                </span>
                <span style={{ fontSize: "0.44rem", color: "#888" }}>|</span>
                <span style={{ fontSize: "0.44rem", color: "#e53935", fontWeight: 600 }}>
                  {globalContracts.filter(c => c.signal === "Bearish").length} Bearish
                </span>
                <span style={{ fontSize: "0.44rem", color: "#888" }}>|</span>
                <span style={{ fontSize: "0.44rem", color: "#888", fontWeight: 600 }}>
                  {globalContracts.filter(c => c.signal === "Neutral").length} Neutral
                </span>
              </div>
            </CollapsibleSection>

            {/* ─ PCR + Max Pain + IV Row ─ */}
            <CollapsibleSection title="PCR & IV Analysis" icon="🎯">
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <div style={{ flex: 1, background: "#fafbfc", borderRadius: 8, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                  <PCRGauge pcr={pcr} signal={pcrSignal} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ background: "#fafbfc", borderRadius: 8, padding: "8px 10px", border: "1px solid #f0f0f0", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: "0.5rem", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Max Pain</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#7b1fa2" }}>{maxPain.toLocaleString()}</div>
                  </div>
                  <div style={{ background: "#fafbfc", borderRadius: 8, padding: "8px 10px", border: "1px solid #f0f0f0", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: "0.5rem", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Spot Price</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1a1a2e" }}>{data.spotPrice.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <IVMeter iv={iv} ivRank={ivRank} ivPercentile={ivPercentile} />
            </CollapsibleSection>

            {/* ─ FII/DII + Smart Money ─ */}
            <CollapsibleSection title="Institutional Flow" icon="🏛️">
              <div style={{ background: "#fafbfc", borderRadius: 8, padding: "10px 10px 4px", border: "1px solid #f0f0f0", marginBottom: 6 }}>
                <PositionBars fii={fii} dii={dii} />
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 6, fontSize: "0.52rem" }}>
                <div style={{ flex: 1, background: "#f3e8ff", borderRadius: 6, padding: "5px 7px", textAlign: "center", border: "1px solid #e1bee7" }}>
                  <div style={{ color: "#7b1fa2", fontWeight: 700, fontSize: "0.44rem" }}>BLOCK DEALS</div>
                  <div style={{ fontWeight: 800, color: "#4a148c", fontSize: "0.82rem" }}>{blockDeals}</div>
                </div>
                <div style={{ flex: 1, background: "#e3f2fd", borderRadius: 6, padding: "5px 7px", textAlign: "center", border: "1px solid #bbdefb" }}>
                  <div style={{ color: "#1565c0", fontWeight: 700, fontSize: "0.44rem" }}>BULK DEALS</div>
                  <div style={{ fontWeight: 800, color: "#0d47a1", fontSize: "0.82rem" }}>{bulkDeals}</div>
                </div>
                <div style={{ flex: 1, background: "#fff8e1", borderRadius: 6, padding: "5px 7px", textAlign: "center", border: "1px solid #fff9c4" }}>
                  <div style={{ color: "#e65100", fontWeight: 700, fontSize: "0.44rem" }}>HEDGING</div>
                  <div style={{ fontWeight: 800, color: "#bf360c", fontSize: "0.82rem" }}>{hedgingActivity}%</div>
                </div>
              </div>
            </CollapsibleSection>

            {/* ─ Smart Money Signals ─ */}
            <CollapsibleSection title="Smart Money Signals" icon="🧠">
              {signals.map((s, i) => {
                const color = s.sentiment === "bullish" ? "#2e7d32" : s.sentiment === "bearish" ? "#c62828" : "#e65100";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                    borderRadius: 8, marginBottom: 4,
                    background: s.sentiment === "bullish" ? "#f1f8e9" : s.sentiment === "bearish" ? "#fce4ec" : "#fff8e1",
                    border: `1px solid ${s.sentiment === "bullish" ? "#c8e6c9" : s.sentiment === "bearish" ? "#f8bbd0" : "#fff9c4"}`,
                    transition: "transform 0.15s",
                  }}>
                    <span style={{ fontSize: "0.9rem" }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color }}>{s.type}</div>
                      <div style={{ fontSize: "0.56rem", color: "#666" }}>{s.message} · {s.value}</div>
                    </div>
                    <span style={{
                      fontSize: "0.48rem", fontWeight: 800, color,
                      background: `${color}15`, padding: "2px 5px", borderRadius: 3, textTransform: "uppercase",
                    }}>{s.sentiment}</span>
                  </div>
                );
              })}
            </CollapsibleSection>

            {/* ─ Sector Derivatives Activity ─ */}
            <CollapsibleSection title="Sector Activity" icon="📋" defaultOpen={false}>
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 36px", gap: 0, fontSize: "0.48rem", fontWeight: 700, color: "#888", padding: "4px 8px", background: "#f5f5f5" }}>
                  <span>Sector</span><span style={{ textAlign: "right" }}>Calls</span><span style={{ textAlign: "right" }}>Puts</span><span style={{ textAlign: "center" }}>Dom</span>
                </div>
                {sectorActivity.map((s, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 50px 50px 36px", gap: 0,
                    padding: "4px 8px", fontSize: "0.52rem", background: i % 2 ? "#fff" : "#fafbfc",
                    borderBottom: "1px solid #f8f8f8",
                  }}>
                    <span style={{ fontWeight: 600, color: "#444" }}>{s.name}</span>
                    <span style={{ textAlign: "right", color: "#2e7d32", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{(s.ce / 1000).toFixed(0)}K</span>
                    <span style={{ textAlign: "right", color: "#c62828", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{(s.pe / 1000).toFixed(0)}K</span>
                    <span style={{
                      textAlign: "center", fontSize: "0.42rem", fontWeight: 800,
                      color: s.dominance === "Call" ? "#2e7d32" : "#c62828",
                    }}>{s.dominance === "Call" ? "CE" : "PE"}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </>
        )}

        {/* ═══ AI QUANT TAB ═══ */}
        {section === "quant" && (
          <>
            {/* AI Insight for Quant */}
            <AIInsightBox
              beginner={quant.crashRisk > 20 ? "Risk levels are elevated. Consider protecting your portfolio with stop losses." : "Risk levels are manageable. Market conditions are relatively stable."}
              institutional={`Momentum score ${quant.momentum}. Institutional accumulation at ${quant.instAccum}%. Liquidity stress ${quant.liquidityStress}%. ${quant.fearIndex > 50 ? "Elevated fear regime — consider tail hedges." : "Stable regime — carry strategies favorable."}`}
            />

            {/* ─ Market Regime ─ */}
            <CollapsibleSection title="Market Regime Detector" icon="🔍">
              <div style={{
                textAlign: "center", padding: "10px", borderRadius: 10,
                background: regime.bg, border: `2px solid ${regime.color}40`,
                marginBottom: 4,
              }}>
                <div style={{ fontSize: "0.5rem", color: "#888", fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>AI DETECTED REGIME</div>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: regime.color, letterSpacing: 1 }}>{regime.label.toUpperCase()}</div>
                <div style={{ fontSize: "0.5rem", color: "#888", marginTop: 4 }}>
                  Confidence: {Math.floor(65 + (quant.momentum / 100) * 25)}%
                </div>
              </div>
            </CollapsibleSection>

            {/* ─ AI Quant Gauges ─ */}
            <CollapsibleSection title="AI Probability Engine" icon="🧮" badge="AI">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 8 }}>
                <MiniGauge value={quant.bullProb} label="BULL" color="#43a047" />
                <MiniGauge value={quant.bearProb} label="BEAR" color="#e53935" />
                <MiniGauge value={quant.momentum} label="MOM" color="#2962ff" />
                <MiniGauge value={quant.instAccum} label="ACCUM" color="#7b1fa2" />
              </div>
            </CollapsibleSection>

            {/* ─ Risk Meters ─ */}
            <CollapsibleSection title="Risk Analysis Engine" icon="⚡">
              <div style={{ background: "#fafbfc", borderRadius: 8, padding: "10px", border: "1px solid #f0f0f0" }}>
                <RiskMeter label="Volatility Probability" value={quant.volProb} color={quant.volProb > 50 ? "#e53935" : "#ff9800"} />
                <RiskMeter label="Liquidity Stress" value={quant.liquidityStress} color={quant.liquidityStress > 40 ? "#e53935" : "#43a047"} />
                <RiskMeter label="Market Fear Index" value={quant.fearIndex} color={quant.fearIndex > 50 ? "#e53935" : "#ff9800"} />
                <RiskMeter label="Crash Risk Probability" value={quant.crashRisk} color={quant.crashRisk > 20 ? "#e53935" : "#43a047"} max={50} />
                <RiskMeter label="Momentum Score" value={quant.momentum} color={quant.momentum > 50 ? "#43a047" : "#ff9800"} />
                <RiskMeter label="Institutional Accumulation" value={quant.instAccum} color="#2962ff" />
              </div>
            </CollapsibleSection>

            {/* ─ Monte Carlo Scenarios ─ */}
            <CollapsibleSection title="Monte Carlo Scenarios" icon="🎯" badge="SIM">
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #f0f0f0" }}>
                {[
                  { label: "Best Case", value: monteCarlo.bestCase, prob: Math.floor(20 + quant.bullProb * 0.3), color: "#43a047", bg: "#e8f5e9" },
                  { label: "Base Case", value: monteCarlo.baseCase, prob: Math.floor(40 + quant.momentum * 0.2), color: "#2962ff", bg: "#e8eeff" },
                  { label: "Worst Case", value: monteCarlo.worstCase, prob: Math.floor(10 + quant.bearProb * 0.2), color: "#e53935", bg: "#ffebee" },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 10px", background: s.bg, borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.52rem", fontWeight: 700, color: s.color, letterSpacing: 0.3 }}>{s.label}</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1a1a2e" }}>{s.value.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.48rem", color: "#888", fontWeight: 600 }}>Probability</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: s.color }}>{s.prob}%</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 6, background: "#f8f9fa", borderRadius: 8, padding: "8px 10px",
                border: "1px solid #f0f0f0", textAlign: "center",
              }}>
                <div style={{ fontSize: "0.48rem", color: "#888", fontWeight: 600, marginBottom: 2 }}>EXPECTED MOVE (1-WEEK)</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1a1a2e" }}>
                  +/- {monteCarlo.expectedMove}%
                </div>
                <div style={{
                  marginTop: 4, height: 8, borderRadius: 4, overflow: "hidden",
                  background: "linear-gradient(90deg, #e53935, #ff9800, #43a047, #ff9800, #e53935)",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", left: "50%", top: -1, width: 3, height: 10,
                    background: "#1a1a2e", borderRadius: 1, transform: "translateX(-50%)",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  <span style={{ fontSize: "0.42rem", color: "#e53935", fontWeight: 600 }}>-{(monteCarlo.expectedMove * 2).toFixed(1)}%</span>
                  <span style={{ fontSize: "0.42rem", color: "#888", fontWeight: 600 }}>Current</span>
                  <span style={{ fontSize: "0.42rem", color: "#43a047", fontWeight: 600 }}>+{(monteCarlo.expectedMove * 2).toFixed(1)}%</span>
                </div>
              </div>
            </CollapsibleSection>

            {/* ─ IV + PCR Summary for Quant tab ─ */}
            <CollapsibleSection title="Volatility Surface" icon="🌊" defaultOpen={false}>
              <IVMeter iv={iv} ivRank={ivRank} ivPercentile={ivPercentile} />
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ flex: 1, background: "#fff8e1", borderRadius: 8, padding: "6px 10px", border: "1px solid #fff9c4", textAlign: "center" }}>
                    <div style={{ fontSize: "0.44rem", color: "#e65100", fontWeight: 700 }}>VOL BREAKOUT</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#bf360c" }}>{volBreakout}%</div>
                  </div>
                  <div style={{ flex: 1, background: "#fce4ec", borderRadius: 8, padding: "6px 10px", border: "1px solid #f8bbd0", textAlign: "center" }}>
                    <div style={{ fontSize: "0.44rem", color: "#c62828", fontWeight: 700 }}>GAMMA SQUEEZE</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#b71c1c" }}>{gammaSqueeze}%</div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "5px 14px", borderTop: "1px solid #e5e7eb", background: "#f8f9fa",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#e65100" }} />
        <span style={{ fontSize: "0.48rem", color: "#aaa", fontWeight: 600, letterSpacing: 0.4 }}>
          MOONLIGHT QUANT DESK
        </span>
        <span style={{ fontSize: "0.38rem", color: "#ccc" }}>v2.0</span>
      </div>

      <style>{`
        @keyframes deriv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes deriv-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
