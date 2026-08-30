"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, TrendingUp, PieChart, Shield, Target, Zap, Star,
  Calculator, ArrowUpRight, ArrowDownRight, ChevronRight, ChevronDown,
  BookOpen, Users, Clock, Filter, X, GitCompare, RefreshCw,
  BarChart3, Layers, Globe, Building2, AlertTriangle, Info,
  Briefcase, DollarSign, Award, Activity,
} from "lucide-react";
import { MUTUAL_FUNDS, searchMutualFunds, type MutualFundEntry } from "@/lib/mutualfunds";
import { generateFundDetail, generateMFSparkline, getCategoryInsights, getBenchmarkReturns, type FundDetailedInfo } from "@/lib/mf-data";
import { simulateSIP } from "@/lib/mf-engine";
import { DataSourceBadge, TimestampBadge } from "@/components/TrustBadges";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — INSTITUTIONAL MF EXPLORER
   Groww + ValueResearch + Morningstar grade
   ═══════════════════════════════════════════════════════════════ */

type MFView = "discover" | "categories" | "search" | "calculators" | "compare" | "watchlist";
type CalcTab = "sip" | "lumpsum" | "swp" | "xirr";

// ─── Category definitions (Groww-style) ─────────────────────────
const MF_CATEGORIES_FULL = [
  { id: "equity", label: "Equity", icon: <TrendingUp size={16} />, color: "#6366f1", subcategories: ["Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "Multi Cap", "Large & Mid Cap", "Value", "Contra", "Focused", "Dividend Yield"] },
  { id: "debt", label: "Debt", icon: <Shield size={16} />, color: "#0ea5e9", subcategories: ["Liquid", "Ultra Short Duration", "Short Duration", "Medium Duration", "Long Duration", "Corporate Bond", "Banking & PSU", "Gilt", "Credit Risk", "Dynamic Bond"] },
  { id: "hybrid", label: "Hybrid", icon: <Layers size={16} />, color: "#f59e0b", subcategories: ["Balanced Advantage", "Aggressive Hybrid", "Conservative Hybrid", "Multi Asset", "Arbitrage", "Equity Savings"] },
  { id: "index", label: "Index / ETF", icon: <BarChart3 size={16} />, color: "#10b981", subcategories: ["Nifty 50", "Nifty Next 50", "Nifty Midcap 150", "Nifty Smallcap 250", "S&P 500", "Nasdaq 100", "Nifty Bank", "Sector Index"] },
  { id: "elss", label: "ELSS", icon: <DollarSign size={16} />, color: "#8b5cf6", subcategories: ["Tax Saving"] },
  { id: "international", label: "International", icon: <Globe size={16} />, color: "#ec4899", subcategories: ["US Equity", "Global", "China", "Emerging Markets", "Europe"] },
  { id: "sectoral", label: "Sectoral", icon: <Building2 size={16} />, color: "#ef4444", subcategories: ["Technology", "Healthcare", "Banking", "Infrastructure", "Manufacturing", "Consumption", "Energy"] },
];

// ─── Curated screens ────────────────────────────────────────────
const DISCOVERY_SCREENS = [
  { id: "best-sip", label: "Best SIP Funds", icon: <TrendingUp size={14} />, color: "#10b981", description: "Top funds for systematic investing", filter: (f: MutualFundEntry) => ["Flexi Cap", "Large Cap", "Mid Cap", "ELSS"].includes(f.category) },
  { id: "top-performers", label: "Top Performers", icon: <Award size={14} />, color: "#f59e0b", description: "Highest returns in last 3 years", filter: (f: MutualFundEntry) => f.category !== "Debt" },
  { id: "safest", label: "Safest Funds", icon: <Shield size={14} />, color: "#0ea5e9", description: "Low risk, stable returns", filter: (f: MutualFundEntry) => f.riskLevel === "Low" || f.riskLevel === "Moderate" },
  { id: "elss-tax", label: "Tax Saving ELSS", icon: <DollarSign size={14} />, color: "#8b5cf6", description: "Save tax under 80C", filter: (f: MutualFundEntry) => f.category === "ELSS" },
  { id: "index-passive", label: "Index & Passive", icon: <BarChart3 size={14} />, color: "#6366f1", description: "Low cost, market returns", filter: (f: MutualFundEntry) => f.category === "Index" },
  { id: "high-yield", label: "Income Funds", icon: <PieChart size={14} />, color: "#ef4444", description: "Regular income from debt", filter: (f: MutualFundEntry) => f.category === "Debt" },
];

// ─── Sparkline ──────────────────────────────────────────────────
function Spark({ data, color = "#7c3aed", w = 90, h = 24 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

// ─── Score Ring ──────────────────────────────────────────────────
function Ring({ value, label, size = 56 }: { value: number; label: string; size?: number }) {
  const pct = Math.min(100, value);
  const c = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 3px" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={c} strokeWidth="2.5" strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800, color: c }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

// ─── Riskometer ─────────────────────────────────────────────────
function Riskometer({ level }: { level: string }) {
  const levels = ["Low", "Moderate", "High", "Very High"];
  const idx = levels.indexOf(level);
  const colors = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {levels.map((l, i) => (
        <div key={l} style={{ width: 18, height: 6, borderRadius: 3, background: i <= idx ? colors[i] : "rgba(255,255,255,0.06)" }} title={l} />
      ))}
      <span style={{ fontSize: "0.56rem", fontWeight: 700, color: colors[idx] || "var(--text-muted)", marginLeft: 3 }}>{level}</span>
    </div>
  );
}

function fINR(n: number) { return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${n.toLocaleString("en-IN")}`; }

// ═══════════════════════════════════════════════════════════════
// CALCULATORS
// ═══════════════════════════════════════════════════════════════
function SIPCalculator() {
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(12);
  const totalInvested = monthly * years * 12;
  const r = rate / 100 / 12;
  const n = years * 12;
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const wealth = Math.round(fv);
  const gains = wealth - totalInvested;
  return (
    <div style={{ padding: "20px 24px" }}>
      <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>SIP Calculator</h4>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Monthly SIP (₹)</label>
          <input type="range" min={500} max={200000} step={500} value={monthly} onChange={e => setMonthly(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(monthly)}/month</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Duration (years)</label>
          <input type="range" min={1} max={40} value={years} onChange={e => setYears(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{years} years</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Expected Return (%)</label>
          <input type="range" min={4} max={25} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{rate}% p.a.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Invested</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--text-primary)" }}>{fINR(totalInvested)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Gains</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--success)" }}>{fINR(gains)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Corpus</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#8b5cf6" }}>{fINR(wealth)}</div>
        </div>
      </div>
    </div>
  );
}

function LumpsumCalculator() {
  const [amount, setAmount] = useState(500000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const fv = Math.round(amount * Math.pow(1 + rate / 100, years));
  const gains = fv - amount;
  return (
    <div style={{ padding: "20px 24px" }}>
      <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>Lumpsum Calculator</h4>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Investment Amount (₹)</label>
          <input type="range" min={10000} max={10000000} step={10000} value={amount} onChange={e => setAmount(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(amount)}</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Duration (years)</label>
          <input type="range" min={1} max={30} value={years} onChange={e => setYears(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{years} years</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Expected Return (%)</label>
          <input type="range" min={4} max={25} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{rate}% p.a.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Invested</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--text-primary)" }}>{fINR(amount)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Gains</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--success)" }}>{fINR(gains)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Final Value</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#8b5cf6" }}>{fINR(fv)}</div>
        </div>
      </div>
    </div>
  );
}

function SWPCalculator() {
  const [corpus, setCorpus] = useState(5000000);
  const [monthly, setMonthly] = useState(25000);
  const [rate, setRate] = useState(8);
  const r = rate / 100 / 12;
  const months = r > 0 ? Math.log(1 / (1 - (corpus * r) / monthly)) / Math.log(1 + r) : corpus / monthly;
  const years = Math.max(0, months / 12);
  const totalWithdrawn = monthly * Math.floor(months);
  return (
    <div style={{ padding: "20px 24px" }}>
      <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>SWP Calculator</h4>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Corpus (₹)</label>
          <input type="range" min={100000} max={50000000} step={100000} value={corpus} onChange={e => setCorpus(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(corpus)}</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Monthly Withdrawal (₹)</label>
          <input type="range" min={5000} max={500000} step={5000} value={monthly} onChange={e => setMonthly(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(monthly)}/month</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Expected Return (%)</label>
          <input type="range" min={4} max={15} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{rate}% p.a.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Corpus Lasts</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--accent)" }}>{isFinite(years) ? `${years.toFixed(1)} years` : "Forever ∞"}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Total Withdrawn</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--success)" }}>{isFinite(totalWithdrawn) ? fINR(totalWithdrawn) : "∞"}</div>
        </div>
      </div>
    </div>
  );
}

function XIRRCalculator() {
  const [invested, setInvested] = useState(1200000);
  const [currentVal, setCurrentVal] = useState(1800000);
  const [years, setYears] = useState(5);
  const xirr = (Math.pow(currentVal / invested, 1 / years) - 1) * 100;
  return (
    <div style={{ padding: "20px 24px" }}>
      <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>XIRR Calculator</h4>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Total Invested (₹)</label>
          <input type="range" min={10000} max={10000000} step={10000} value={invested} onChange={e => setInvested(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(invested)}</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Current Value (₹)</label>
          <input type="range" min={10000} max={50000000} step={10000} value={currentVal} onChange={e => setCurrentVal(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(currentVal)}</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Investment Period (years)</label>
          <input type="range" min={1} max={30} step={0.5} value={years} onChange={e => setYears(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{years} years</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
        <div style={{ padding: "14px 16px", borderRadius: 10, background: xirr >= 0 ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${xirr >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}` }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>XIRR</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, color: xirr >= 0 ? "var(--success)" : "var(--danger)" }}>{xirr.toFixed(2)}%</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Absolute Gain</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#8b5cf6" }}>{((currentVal / invested - 1) * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function MFExplorer() {
  const router = useRouter();
  const [view, setView] = useState<MFView>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [discoveryScreen, setDiscoveryScreen] = useState("best-sip");
  const [calcTab, setCalcTab] = useState<CalcTab>("sip");
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [amfiSchemeCount, setAmfiSchemeCount] = useState<number | null>(null);
  const [liveNavDate, setLiveNavDate] = useState<string | null>(null);
  // Live AMFI scheme search (covers all ~14k schemes, incl. verbose names)
  const [liveSchemes, setLiveSchemes] = useState<{ schemeCode: number; schemeName: string; nav: number; navDate: string }[]>([]);
  const [liveSearchLoading, setLiveSearchLoading] = useState(false);
  // D2 — live AMFI NAV overlay for curated fund cards, keyed by fund name
  const [liveNavMap, setLiveNavMap] = useState<Record<string, { nav: number; navDate: string } | null>>({});

  // Load watchlist from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wt_mf_watchlist");
      if (raw) setWatchlist(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Fetch live AMFI scheme count
  useEffect(() => {
    fetch("/api/mf-data?mode=summary")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAmfiSchemeCount(d.totalSchemes);
          setLiveNavDate(d.industry?.navDate || null);
        }
      })
      .catch(() => {});
  }, []);

  // Debounced live AMFI scheme search — finds schemes by their full verbose
  // AMFI names that the curated static list would otherwise miss.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) { setLiveSchemes([]); setLiveSearchLoading(false); return; }
    setLiveSearchLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/mf-data?mode=search&q=${encodeURIComponent(q)}&limit=30`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(d => { if (d.success && Array.isArray(d.results)) setLiveSchemes(d.results); else setLiveSchemes([]); })
        .catch(() => { /* aborted or failed — keep curated results */ })
        .finally(() => setLiveSearchLoading(false));
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [searchQuery]);

  const categoryInsights = useMemo(() => getCategoryInsights(), []);

  // Peer ranking — rank a fund within its category by overall score.
  const categoryRank = useCallback((f: MutualFundEntry): { rank: number; total: number } | null => {
    const peers = MUTUAL_FUNDS.filter(m => m.category === f.category);
    if (peers.length < 2) return null;
    const scored = peers
      .map(m => ({ sym: m.symbol, score: +generateFundDetail(m.symbol, m.name, m.amc, m.category, m.riskLevel).overallScore }))
      .sort((a, b) => b.score - a.score);
    const idx = scored.findIndex(s => s.sym === f.symbol);
    if (idx < 0) return null;
    return { rank: idx + 1, total: scored.length };
  }, []);

  // Filtered funds
  const filteredFunds = useMemo(() => {
    if (searchQuery.trim()) return searchMutualFunds(searchQuery, 50);
    let funds = MUTUAL_FUNDS;
    if (selectedCategory) {
      const cat = MF_CATEGORIES_FULL.find(c => c.id === selectedCategory);
      if (cat) {
        if (selectedSubcategory) {
          funds = funds.filter(f => f.category === selectedSubcategory || f.category.toLowerCase().includes(selectedSubcategory.toLowerCase()));
        } else {
          const allSubs = cat.subcategories.map(s => s.toLowerCase());
          funds = funds.filter(f => allSubs.some(sub => f.category.toLowerCase().includes(sub)) || cat.label.toLowerCase().includes(f.category.toLowerCase().split(" ")[0]));
        }
      }
    }
    return funds;
  }, [searchQuery, selectedCategory, selectedSubcategory]);

  // Discovery
  const discoveryFunds = useMemo(() => {
    const screen = DISCOVERY_SCREENS.find(s => s.id === discoveryScreen);
    return screen ? MUTUAL_FUNDS.filter(screen.filter) : [];
  }, [discoveryScreen]);

  // D2 — Batch-fetch live AMFI NAVs for the funds currently visible so cards
  // show the REAL NAV (not a synthetic estimate). Only names not yet cached.
  useEffect(() => {
    const candidates = new Set<string>();
    discoveryFunds.slice(0, 12).forEach(f => candidates.add(f.name));
    filteredFunds.slice(0, 50).forEach(f => candidates.add(f.name));
    [...compareList, ...watchlist].forEach(sym => {
      const f = MUTUAL_FUNDS.find(m => m.symbol === sym);
      if (f) candidates.add(f.name);
    });
    const missing = [...candidates].filter(n => !(n in liveNavMap)).slice(0, 30);
    if (missing.length === 0) return;
    const ctrl = new AbortController();
    fetch(`/api/mf-data?mode=navmatch&names=${encodeURIComponent(missing.join("|"))}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { if (d.success && d.navs) setLiveNavMap(prev => ({ ...prev, ...d.navs })); })
      .catch(() => { /* keep estimates on failure */ });
    return () => ctrl.abort();
  }, [discoveryFunds, filteredFunds, compareList, watchlist, liveNavMap]);

  // Helpers
  const isInWatchlist = (sym: string) => watchlist.includes(sym);
  const toggleWatchlist = (sym: string) => {
    const next = isInWatchlist(sym) ? watchlist.filter(w => w !== sym) : [...watchlist, sym];
    setWatchlist(next);
    try { localStorage.setItem("wt_mf_watchlist", JSON.stringify(next)); } catch { /* */ }
  };
  const toggleCompare = (sym: string) => {
    setCompareList(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : prev.length < 4 ? [...prev, sym] : prev);
  };

  // ─── Fund Card ─────────────────────────────────────────────────
  const renderFundCard = (f: MutualFundEntry, i: number) => {
    const detail = generateFundDetail(f.symbol, f.name, f.amc, f.category, f.riskLevel);
    const spark = generateMFSparkline(f.symbol, 20);
    const liveNav = liveNavMap[f.name]; // null = no match, undefined = not fetched yet
    const navValue = liveNav ? liveNav.nav : detail.nav;
    const navIsLive = !!liveNav;
    const slug = f.name.toLowerCase().replace(/\s+/g, "-").replace(/[()&]/g, "");
    const isWL = isInWatchlist(f.symbol);
    const isCmp = compareList.includes(f.symbol);
    return (
      <div key={f.symbol + i} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 18px", border: "1px solid var(--border)", transition: "all 0.15s", cursor: "pointer", position: "relative" }}
        onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(74,158,255,0.3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; e.currentTarget.style.transform = "none"; }}>
        {/* Actions */}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
          <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(f.symbol); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: isWL ? "#f59e0b" : "var(--text-muted)", opacity: isWL ? 1 : 0.4 }} title="Watchlist">
            <Star size={12} fill={isWL ? "#f59e0b" : "none"} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); toggleCompare(f.symbol); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: isCmp ? "var(--accent)" : "var(--text-muted)", opacity: isCmp ? 1 : 0.3 }} title="Compare">
            <GitCompare size={12} />
          </button>
        </div>
        {/* Content */}
        <div onClick={() => router.push(`/mf-intelligence/${slug}`)}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3, paddingRight: 50 }}>{f.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.56rem", color: "var(--text-muted)", fontWeight: 600 }}>{f.amc}</span>
              <span style={{ fontSize: "0.5rem", padding: "1px 5px", borderRadius: 3, background: "rgba(74,158,255,0.1)", color: "var(--accent)", fontWeight: 600 }}>{f.category}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                NAV
                <span title={navIsLive ? `Live AMFI NAV${liveNav?.navDate ? ` · ${liveNav.navDate}` : ""}` : "Estimated — live NAV not matched"} style={{
                  fontSize: "0.42rem", fontWeight: 800, padding: "0px 4px", borderRadius: 3, letterSpacing: "0.03em",
                  background: navIsLive ? "rgba(52,211,153,0.12)" : "rgba(140,153,176,0.12)",
                  color: navIsLive ? "var(--success)" : "var(--text-muted)",
                }}>{navIsLive ? "AMFI LIVE" : "EST"}</span>
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>₹{navValue.toFixed(2)}</div>
            </div>
            <Spark data={spark} color={detail.return1y > 0 ? "#10b981" : "#ef4444"} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>1Y Return</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: detail.return1y >= 0 ? "var(--success)" : "var(--danger)" }}>
                {detail.return1y >= 0 ? "+" : ""}{detail.return1y}%
              </div>
            </div>
          </div>
          {/* Returns row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {[{ l: "3Y", v: detail.return3y }, { l: "5Y", v: detail.return5y }].map(r => (
              <div key={r.l} style={{ flex: 1, padding: "5px 8px", borderRadius: 6, background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
                <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>{r.l} CAGR</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: r.v >= 0 ? "var(--success)" : "var(--danger)" }}>{r.v >= 0 ? "+" : ""}{r.v}%</div>
              </div>
            ))}
            <div style={{ flex: 1, padding: "5px 8px", borderRadius: 6, background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
              <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>AUM</div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>{detail.aum}</div>
            </div>
          </div>
          {/* Benchmark + peer rank row */}
          {(() => {
            const bm = getBenchmarkReturns(f.category);
            const out = +(detail.return1y - bm.return1y).toFixed(1);
            const rank = categoryRank(f);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <span title={`Benchmark: ${bm.index} · 1Y ${bm.return1y}%`} style={{
                  fontSize: "0.52rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: out >= 0 ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                  color: out >= 0 ? "var(--success)" : "var(--danger)",
                }}>
                  {out >= 0 ? "▲" : "▼"} {out >= 0 ? "+" : ""}{out}% vs benchmark
                </span>
                {rank && (
                  <span title={`Ranked by overall score within ${f.category}`} style={{
                    fontSize: "0.52rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: "rgba(139,92,246,0.1)", color: "#8b5cf6",
                  }}>
                    #{rank.rank} of {rank.total} in {f.category}
                  </span>
                )}
              </div>
            );
          })()}
          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Riskometer level={f.riskLevel} />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Ring value={+detail.overallScore} label="Score" size={36} />
              <span style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>ER: {detail.expenseRatio}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Compare Modal ─────────────────────────────────────────────
  const renderCompareModal = () => {
    if (!showCompare || compareList.length < 2) return null;
    const funds = compareList.map(sym => {
      const f = MUTUAL_FUNDS.find(m => m.symbol === sym);
      if (!f) return null;
      return { entry: f, detail: generateFundDetail(f.symbol, f.name, f.amc, f.category, f.riskLevel) };
    }).filter(Boolean) as { entry: MutualFundEntry; detail: FundDetailedInfo }[];

    const metrics = [
      { label: "NAV", get: (d: FundDetailedInfo) => `₹${d.nav.toFixed(2)}` },
      { label: "1Y Return", get: (d: FundDetailedInfo) => `${d.return1y >= 0 ? "+" : ""}${d.return1y}%` },
      { label: "3Y Return", get: (d: FundDetailedInfo) => `${d.return3y >= 0 ? "+" : ""}${d.return3y}%` },
      { label: "5Y Return", get: (d: FundDetailedInfo) => `${d.return5y >= 0 ? "+" : ""}${d.return5y}%` },
      { label: "Benchmark", get: (d: FundDetailedInfo) => d.benchmarkIndex },
      { label: "1Y vs Benchmark", get: (d: FundDetailedInfo) => { const o = +(d.return1y - getBenchmarkReturns(d.category).return1y).toFixed(1); return `${o >= 0 ? "+" : ""}${o}%`; } },
      { label: "3Y vs Benchmark", get: (d: FundDetailedInfo) => { const o = +(d.return3y - getBenchmarkReturns(d.category).return3y).toFixed(1); return `${o >= 0 ? "+" : ""}${o}%`; } },
      { label: "Expense Ratio", get: (d: FundDetailedInfo) => `${d.expenseRatio}%` },
      { label: "AUM", get: (d: FundDetailedInfo) => d.aum },
      { label: "Sharpe Ratio", get: (d: FundDetailedInfo) => `${d.sharpe}` },
      { label: "Alpha", get: (d: FundDetailedInfo) => `${d.alpha}` },
      { label: "Max Drawdown", get: (d: FundDetailedInfo) => `-${d.maxDrawdown}%` },
      { label: "Risk", get: (d: FundDetailedInfo) => d.riskometer },
      { label: "Score", get: (d: FundDetailedInfo) => `${d.overallScore}/100` },
      { label: "Fund Manager", get: (d: FundDetailedInfo) => d.fundManager },
      { label: "Exit Load", get: (d: FundDetailedInfo) => d.exitLoad },
    ];

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowCompare(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-obsidian)", borderRadius: 18, padding: "24px 28px", maxWidth: 950, width: "100%", maxHeight: "85vh", overflow: "auto", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Fund Comparison</h3>
            <button onClick={() => setShowCompare(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.64rem" }}>Metric</th>
                  {funds.map(f => (
                    <th key={f.entry.symbol} style={{ textAlign: "right", padding: "8px 12px", fontWeight: 800, color: "var(--accent)", fontSize: "0.68rem" }}>{f.entry.name.split(" ").slice(0, 3).join(" ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.label} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-secondary)" }}>{m.label}</td>
                    {funds.map(f => (
                      <td key={f.entry.symbol} style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700, color: "var(--text-primary)" }}>{m.get(f.detail)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── Navigation ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 2, background: "var(--bg-slate)", borderRadius: 8, padding: 2 }}>
          {(["discover", "categories", "search", "calculators", "compare", "watchlist"] as MFView[]).map(v => (
            <button key={v} onClick={() => { setView(v); setSelectedCategory(null); setSelectedSubcategory(null); }} style={{
              padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: "0.66rem", fontWeight: 600, textTransform: "capitalize",
              background: view === v ? "var(--accent)" : "transparent",
              color: view === v ? "#fff" : "var(--text-secondary)", whiteSpace: "nowrap",
            }}>
              {v === "discover" ? "Discover" : v === "categories" ? "Categories" : v === "calculators" ? "Calculators" : v === "compare" ? `Compare (${compareList.length})` : v === "watchlist" ? `Watchlist (${watchlist.length})` : "Search"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {amfiSchemeCount && <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{amfiSchemeCount.toLocaleString()} AMFI schemes</span>}
          <DataSourceBadge source="AMFI" size="xs" />
          {liveNavDate && <TimestampBadge timestamp={new Date(liveNavDate).getTime()} label="NAV Date" />}
        </div>
      </div>

      {/* ── Search Bar (always visible) ── */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (e.target.value.trim()) setView("search"); }}
          placeholder="Search by fund name, AMC, category..."
          style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.78rem", outline: "none" }}
        />
      </div>

      {/* ═══ DISCOVER VIEW ═══ */}
      {view === "discover" && (
        <>
          {/* Category Heatmap */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <BarChart3 size={15} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--text-primary)" }}>Category Performance</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {categoryInsights.map(cat => (
                <button key={cat.category} onClick={() => { setSelectedCategory(MF_CATEGORIES_FULL.find(c => c.subcategories.some(s => s === cat.category))?.id || null); setSelectedSubcategory(cat.category); setView("categories"); }} style={{
                  background: "var(--bg-card)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)", textAlign: "left", cursor: "pointer", transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{cat.category}</div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                    <div><span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>1Y</span> <span style={{ fontSize: "0.72rem", fontWeight: 700, color: cat.avgReturn1y >= 0 ? "var(--success)" : "var(--danger)" }}>{cat.avgReturn1y}%</span></div>
                    <div><span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>3Y</span> <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>{cat.avgReturn3y}%</span></div>
                    <div><span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>5Y</span> <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>{cat.avgReturn5y}%</span></div>
                  </div>
                  <div style={{ fontSize: "0.54rem", color: "var(--text-muted)" }}>{cat.numSchemes} schemes · {cat.sipTrend}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Discovery Screens */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Zap size={15} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--text-primary)" }}>Smart Discovery</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {DISCOVERY_SCREENS.map(d => (
                <button key={d.id} onClick={() => setDiscoveryScreen(d.id)} style={{
                  padding: "6px 12px", borderRadius: 6, border: discoveryScreen === d.id ? `1px solid ${d.color}` : "1px solid var(--border)",
                  background: discoveryScreen === d.id ? `${d.color}12` : "var(--bg-card)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 600,
                  color: discoveryScreen === d.id ? d.color : "var(--text-secondary)",
                }}>
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {discoveryFunds.slice(0, 12).map((f, i) => renderFundCard(f, i))}
            </div>
          </section>

          {/* AI Market Brief */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-slate))", borderRadius: 14, padding: "18px 22px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Activity size={14} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-primary)" }}>AI Market Brief for MF Investors</span>
                <DataSourceBadge source="AI Estimate" size="xs" />
              </div>
              <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 8px" }}>
                Equity MF inflows remain strong at ₹18,000+ Cr/month via SIPs. Large cap valuations are reasonable after recent consolidation. Small cap AUM concerns flagged by SEBI — prefer SIP over lumpsum. Index funds gaining market share with lowest expense ratios.
              </p>
              <details>
                <summary style={{ fontSize: "0.64rem", color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>Advanced institutional view</summary>
                <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "8px 0 0" }}>
                  Rolling 3Y returns for flexi cap category at 14-18% CAGR — above long-term average. Credit spreads tightening in debt markets, favoring shorter duration. FPI flows positive but concentrated in large caps. SEBI stress testing norms impacting small cap fund AUM growth. Expense ratio compression continuing across categories — direct plans average 0.3-0.8% vs regular 1.5-2.2%.
                </p>
              </details>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: "0.56rem", color: "var(--text-muted)" }}>
                <Info size={10} />
                NAVs &amp; scheme counts are live from AMFI{liveNavDate ? ` (as of ${liveNavDate})` : ""}. Industry AUM, SIP-flow &amp; AMC profile figures are periodic estimates (as of May 2026), not live.
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══ CATEGORIES VIEW ═══ */}
      {view === "categories" && !selectedCategory && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {MF_CATEGORIES_FULL.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{
              background: "var(--bg-card)", borderRadius: 12, padding: "18px 20px", border: "1px solid var(--border)", textAlign: "left", cursor: "pointer", transition: "all 0.15s",
            }} onMouseOver={e => { e.currentTarget.style.borderColor = cat.color; }} onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: cat.color }}>{cat.icon}</div>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{cat.label}</div>
                  <div style={{ fontSize: "0.56rem", color: "var(--text-muted)" }}>{cat.subcategories.length} subcategories</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {cat.subcategories.slice(0, 4).map(sub => (
                  <span key={sub} style={{ fontSize: "0.52rem", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}>{sub}</span>
                ))}
                {cat.subcategories.length > 4 && <span style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>+{cat.subcategories.length - 4}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected category with subcategories */}
      {view === "categories" && selectedCategory && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: "0.74rem", fontWeight: 600 }}>← All Categories</button>
            <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--text-primary)" }}>{MF_CATEGORIES_FULL.find(c => c.id === selectedCategory)?.label}</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={() => setSelectedSubcategory(null)} style={{
              padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.66rem", fontWeight: 600,
              background: !selectedSubcategory ? "var(--accent)" : "var(--bg-slate)", color: !selectedSubcategory ? "#fff" : "var(--text-secondary)",
            }}>All</button>
            {MF_CATEGORIES_FULL.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
              <button key={sub} onClick={() => setSelectedSubcategory(sub)} style={{
                padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.66rem", fontWeight: 600,
                background: selectedSubcategory === sub ? "var(--accent)" : "var(--bg-slate)", color: selectedSubcategory === sub ? "#fff" : "var(--text-secondary)",
              }}>{sub}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {filteredFunds.map((f, i) => renderFundCard(f, i))}
          </div>
          {filteredFunds.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <Search size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>No funds in this subcategory yet</div>
              <div style={{ fontSize: "0.74rem" }}>We are expanding our fund database from AMFI feeds.</div>
            </div>
          )}
        </>
      )}

      {/* ═══ SEARCH VIEW ═══ */}
      {view === "search" && (
        <div>
          {/* Curated funds (full analytics cards) */}
          {filteredFunds.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Star size={13} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--text-primary)" }}>Featured Funds</span>
                <span style={{ fontSize: "0.56rem", color: "var(--text-muted)" }}>full analytics</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 22 }}>
                {filteredFunds.map((f, i) => renderFundCard(f, i))}
              </div>
            </>
          )}

          {/* Live AMFI scheme matches — covers all ~14k schemes incl. verbose names */}
          {(() => {
            const curatedNames = new Set(filteredFunds.map(f => f.name.toLowerCase()));
            const extra = liveSchemes.filter(s => !curatedNames.has(s.schemeName.toLowerCase()));
            if (searchQuery.trim().length < 3) {
              if (filteredFunds.length === 0) {
                return (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                    <Search size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>Type a fund name or AMC to search</div>
                    <div style={{ fontSize: "0.68rem", marginTop: 4 }}>Searches all 14,000+ AMFI schemes</div>
                  </div>
                );
              }
              return null;
            }
            return (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <DataSourceBadge source="AMFI" size="xs" />
                  <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--text-primary)" }}>All AMFI Schemes</span>
                  {liveSearchLoading && <RefreshCw size={11} className="spinning" style={{ color: "var(--text-muted)" }} />}
                  {!liveSearchLoading && <span style={{ fontSize: "0.56rem", color: "var(--text-muted)" }}>{extra.length} live match{extra.length === 1 ? "" : "es"}</span>}
                </div>
                {extra.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                    {extra.map(s => {
                      const slug = s.schemeName.toLowerCase().replace(/\s+/g, "-").replace(/[()&.,/]/g, "");
                      return (
                        <button key={s.schemeCode} onClick={() => router.push(`/mf-intelligence/${slug}`)} className="card card-interactive" style={{
                          textAlign: "left", padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg-card)",
                        }}>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.3 }}>{s.schemeName}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--accent)" }}>₹{s.nav.toFixed(2)}</span>
                            <span style={{ fontSize: "0.54rem", color: "var(--text-muted)" }}>NAV · {s.navDate}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : !liveSearchLoading && filteredFunds.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>No schemes found for &ldquo;{searchQuery}&rdquo;</div>
                    <div style={{ fontSize: "0.68rem", marginTop: 4 }}>Try the AMC name or a shorter keyword.</div>
                  </div>
                ) : null}
              </>
            );
          })()}
        </div>
      )}

      {/* ═══ CALCULATORS VIEW ═══ */}
      {view === "calculators" && (
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--bg-slate)", borderRadius: 8, padding: 2 }}>
            {(["sip", "lumpsum", "swp", "xirr"] as CalcTab[]).map(t => (
              <button key={t} onClick={() => setCalcTab(t)} style={{
                padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
                background: calcTab === t ? "var(--accent)" : "transparent",
                color: calcTab === t ? "#fff" : "var(--text-secondary)",
              }}>{t}</button>
            ))}
          </div>
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
            {calcTab === "sip" && <SIPCalculator />}
            {calcTab === "lumpsum" && <LumpsumCalculator />}
            {calcTab === "swp" && <SWPCalculator />}
            {calcTab === "xirr" && <XIRRCalculator />}
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.62rem", color: "var(--text-muted)" }}>
            <AlertTriangle size={11} style={{ display: "inline", marginRight: 4 }} />
            Calculations are estimates based on assumed constant returns. Actual returns will vary. Past performance does not guarantee future results.
          </div>
        </div>
      )}

      {/* ═══ COMPARE VIEW ═══ */}
      {view === "compare" && (
        <div>
          {compareList.length < 2 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <GitCompare size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>Select 2-4 funds to compare</div>
              <div style={{ fontSize: "0.78rem", marginBottom: 16 }}>Use the ⇄ icon on any fund card to add it for comparison.</div>
              <button onClick={() => setView("discover")} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid var(--accent)", background: "transparent", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>Browse Funds</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--text-primary)" }}>Comparing {compareList.length} Funds</span>
                <button onClick={() => setShowCompare(true)} style={{ padding: "6px 14px", borderRadius: 6, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700 }}>Full Comparison Table</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                {compareList.map((sym, i) => {
                  const f = MUTUAL_FUNDS.find(m => m.symbol === sym);
                  return f ? renderFundCard(f, i) : null;
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ WATCHLIST VIEW ═══ */}
      {view === "watchlist" && (
        <div>
          {watchlist.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {watchlist.map((sym, i) => {
                const f = MUTUAL_FUNDS.find(m => m.symbol === sym);
                return f ? renderFundCard(f, i) : null;
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
              <Star size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>No funds in watchlist</div>
              <div style={{ fontSize: "0.78rem", marginBottom: 16 }}>Click ★ on any fund to add it here.</div>
              <button onClick={() => setView("discover")} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid var(--accent)", background: "transparent", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>Browse Funds</button>
            </div>
          )}
        </div>
      )}

      {/* Compare floating bar */}
      {compareList.length > 0 && view !== "compare" && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "var(--bg-card)", border: "1px solid var(--accent)", borderRadius: 14, padding: "10px 18px", zIndex: 40, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
          <GitCompare size={14} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-primary)" }}>{compareList.length}/4</span>
          {compareList.length >= 2 && (
            <button onClick={() => { setView("compare"); setShowCompare(true); }} style={{ padding: "5px 12px", borderRadius: 5, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 700 }}>Compare</button>
          )}
          <button onClick={() => setCompareList([])} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={12} /></button>
        </div>
      )}

      {renderCompareModal()}
    </div>
  );
}
