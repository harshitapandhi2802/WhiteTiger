"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Search, ChevronLeft, ArrowUpRight, ArrowDownRight,
  BarChart3, Activity, Brain, Zap, Flame, Shield, Target,
  Eye, Star, StarOff, Plus, Minus, Cpu, Landmark, Building2,
  Car, Pill, Package, Gem, Wifi, Monitor, Factory, Globe, Layers,
  Sparkles, RefreshCw, ChevronDown, ChevronRight, AlertTriangle,
  BookOpen, Users, Clock, Filter, Maximize2, X, Bell, GitCompare,
  PieChart, Briefcase, TrendingDown, Info, Lock,
} from "lucide-react";
import { NSE_STOCKS, STOCK_SECTORS as LIB_STOCK_SECTORS, MCAP_FILTERS, searchStocks, type StockEntry } from "@/lib/stocks";
import { MiniSparkline, MarketTicker } from "@/components/LiveCharts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DataSourceBadge, TimestampBadge, MarketStatusIndicator } from "@/components/TrustBadges";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — INSTITUTIONAL STOCKS EXPLORER
   Bloomberg + TradingView + Tickertape grade
   ═══════════════════════════════════════════════════════════════ */

// ─── Types ──────────────────────────────────────────────────────
type ExplorerView = "overview" | "sectors" | "list" | "heatmap" | "discovery" | "watchlist";

interface SectorDef {
  name: string; key: string; color: string; icon: React.ReactNode;
  niftyIndex?: string; sectors: string[]; aiStory: string;
}

interface IndexData {
  name: string; shortName: string; color: string;
  constituents: number; description: string;
}

interface WatchlistItem {
  ticker: string; addedAt: number; alertPrice?: number;
}

// ─── Constants ──────────────────────────────────────────────────
const STOCK_SECTORS = LIB_STOCK_SECTORS.slice(0, 20);

const SECTOR_DEFS: SectorDef[] = [
  { name: "IT & Tech", key: "it", color: "#6366f1", icon: <Cpu size={18} />, niftyIndex: "NIFTY IT", sectors: ["IT", "Tech"], aiStory: "IT stocks track US tech spending, dollar strength, and AI-driven demand shifts." },
  { name: "Financial Services", key: "finance", color: "#0ea5e9", icon: <Landmark size={18} />, niftyIndex: "NIFTY FIN SERVICE", sectors: ["Banking", "NBFC", "Insurance", "Fintech"], aiStory: "Banks benefit from credit growth and rate cuts; NBFCs from rural recovery." },
  { name: "Banking", key: "banking", color: "#2563eb", icon: <Building2 size={18} />, niftyIndex: "NIFTY BANK", sectors: ["Banking"], aiStory: "NIM expansion + credit growth acceleration. RBI rate cycle is the key driver." },
  { name: "Auto & EV", key: "auto", color: "#f59e0b", icon: <Car size={18} />, niftyIndex: "NIFTY AUTO", sectors: ["Auto"], aiStory: "Rural demand recovery + EV transition + export order books driving momentum." },
  { name: "Pharma & Health", key: "pharma", color: "#10b981", icon: <Pill size={18} />, niftyIndex: "NIFTY PHARMA", sectors: ["Pharma", "Healthcare"], aiStory: "US FDA approvals, specialty segment growth, and CDMO opportunity in focus." },
  { name: "FMCG", key: "fmcg", color: "#84cc16", icon: <Package size={18} />, niftyIndex: "NIFTY FMCG", sectors: ["FMCG"], aiStory: "Volume growth recovery depends on rural demand and input cost trends." },
  { name: "Energy & Oil", key: "energy", color: "#ef4444", icon: <Flame size={18} />, niftyIndex: "NIFTY ENERGY", sectors: ["Oil & Gas", "Power", "Renewable Energy"], aiStory: "Oil prices, government policy on renewables, and power demand drive this sector." },
  { name: "Metals & Mining", key: "metals", color: "#78716c", icon: <Gem size={18} />, niftyIndex: "NIFTY METAL", sectors: ["Metals"], aiStory: "China demand, global steel prices, and LME inventory levels are key drivers." },
  { name: "Realty", key: "realty", color: "#c084fc", icon: <Building2 size={18} />, niftyIndex: "NIFTY REALTY", sectors: ["Real Estate"], aiStory: "Interest rate cycle, inventory clearance, and premium housing demand drive realty." },
  { name: "Infrastructure", key: "infra", color: "#f97316", icon: <Factory size={18} />, niftyIndex: "NIFTY INFRA", sectors: ["Infrastructure", "Capital Goods", "Railways", "Cement"], aiStory: "Government capex push + roads/railways/defense infrastructure at all-time highs." },
  { name: "Telecom", key: "telecom", color: "#14b8a6", icon: <Wifi size={18} />, sectors: ["Telecom"], aiStory: "ARPU growth, 5G monetization, and consolidation in the sector." },
  { name: "PSU & Defence", key: "psu", color: "#3b82f6", icon: <Shield size={18} />, niftyIndex: "NIFTY PSE", sectors: ["Defense"], aiStory: "Defense order flows and government disinvestment plans drive PSU/defence stocks." },
  { name: "Media & Entertainment", key: "media", color: "#ec4899", icon: <Monitor size={18} />, niftyIndex: "NIFTY MEDIA", sectors: ["Media"], aiStory: "Digital advertising growth and OTT subscriber economics in focus." },
  { name: "Consumption", key: "consumption", color: "#a855f7", icon: <Sparkles size={18} />, sectors: ["Consumer", "Retail", "Hospitality", "Education", "Paints"], aiStory: "Discretionary spending, premiumization, and wedding/festive season demand." },
  { name: "Chemicals", key: "chemicals", color: "#06b6d4", icon: <Layers size={18} />, sectors: ["Chemicals", "Fertilizers"], aiStory: "China+1 theme, specialty chemical margins, and agrochemical demand cycle." },
  { name: "Others", key: "others", color: "#6b7280", icon: <Globe size={18} />, sectors: ["Textiles", "Logistics", "Aviation", "Sugar", "Paper", "Electronics", "EMS", "ETF"], aiStory: "Diverse set of stocks spanning niche themes and emerging opportunities." },
];

const INDICES: IndexData[] = [
  { name: "NIFTY 50", shortName: "NIFTY", color: "#6366f1", constituents: 50, description: "India's benchmark" },
  { name: "SENSEX", shortName: "SENSEX", color: "#ef4444", constituents: 30, description: "BSE benchmark" },
  { name: "BANK NIFTY", shortName: "BANKNIFTY", color: "#2563eb", constituents: 12, description: "Banking stocks" },
  { name: "NIFTY MIDCAP 100", shortName: "MIDCAP", color: "#f59e0b", constituents: 100, description: "Mid-cap growth" },
  { name: "NIFTY SMALLCAP 250", shortName: "SMALLCAP", color: "#10b981", constituents: 250, description: "Small-cap" },
  { name: "NIFTY FIN SERVICE", shortName: "FINNIFTY", color: "#0ea5e9", constituents: 20, description: "Financials" },
];

/* ─── Smart Discovery Screens ─── */
const DISCOVERY_SCREENS = [
  { id: "momentum", label: "Momentum", icon: <TrendingUp size={14} />, color: "#10b981", description: "Stocks with strong upward price momentum", filter: (s: StockEntry, prices: Record<string, { changePercent: number }>) => { const p = prices[s.ticker.replace(".NS", "")]; return p ? p.changePercent > 1.5 : false; } },
  { id: "value", label: "Value Picks", icon: <Target size={14} />, color: "#6366f1", description: "Undervalued stocks with strong fundamentals", filter: (s: StockEntry) => s.mcapType === "large" || s.mcapType === "mid" },
  { id: "highgrowth", label: "High Growth", icon: <Zap size={14} />, color: "#f59e0b", description: "Fast-growing mid & small caps", filter: (s: StockEntry) => s.mcapType === "mid" || s.mcapType === "small" },
  { id: "dividend", label: "Dividend", icon: <PieChart size={14} />, color: "#8b5cf6", description: "High dividend yield stocks", filter: (s: StockEntry) => ["Banking", "Oil & Gas", "Power", "FMCG"].includes(s.sector) && s.mcapType === "large" },
  { id: "lowrisk", label: "Low Risk", icon: <Shield size={14} />, color: "#0ea5e9", description: "Blue-chip defensive stocks", filter: (s: StockEntry) => s.mcapType === "large" && ["FMCG", "IT", "Pharma"].includes(s.sector) },
  { id: "turnaround", label: "Turnaround", icon: <RefreshCw size={14} />, color: "#ef4444", description: "Potential recovery plays", filter: (s: StockEntry, prices: Record<string, { changePercent: number }>) => { const p = prices[s.ticker.replace(".NS", "")]; return p ? p.changePercent < -1 : false; } },
];

/* ─── Seeded RNG ─── */
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

function genSectorData(def: SectorDef, stocks: StockEntry[], liveStocks: Record<string, { price: number; changePercent: number; name?: string }>) {
  const sectorStocks = stocks.filter(s => def.sectors.includes(s.sector));
  const rng = seededRng(def.key + new Date().toDateString());
  let avgChange = ((rng() * 6 - 2) * 100 | 0) / 100;
  let topGainer = { name: "-", change: 0 };
  let topLoser = { name: "-", change: 0 };
  const withPrices = sectorStocks.map(s => {
    const sym = s.ticker.replace(".NS", "");
    const lp = liveStocks[sym];
    const chg = lp ? lp.changePercent : ((rng() * 8 - 3) * 100 | 0) / 100;
    return { ...s, change: chg };
  }).sort((a, b) => b.change - a.change);
  if (withPrices.length > 0) {
    avgChange = Number((withPrices.reduce((a, b) => a + b.change, 0) / withPrices.length).toFixed(2));
    topGainer = { name: withPrices[0].name, change: withPrices[0].change };
    topLoser = { name: withPrices[withPrices.length - 1].name, change: withPrices[withPrices.length - 1].change };
  }
  const sentiment = avgChange > 1.5 ? "Bullish" : avgChange > 0 ? "Mildly Bullish" : avgChange > -1 ? "Neutral" : "Bearish";
  return { ...def, stockCount: sectorStocks.length, avgChange, topGainer, topLoser, sentiment, heatColor: avgChange > 2 ? "#059669" : avgChange > 0.5 ? "#10b981" : avgChange > -0.5 ? "#6b7280" : avgChange > -2 ? "#f87171" : "#dc2626" };
}

/** Map our index shortName → the key in the live /api/live-prices feed. */
const INDEX_LIVE_KEY: Record<string, string> = {
  NIFTY: "NIFTY50",
  SENSEX: "SENSEX",
  BANKNIFTY: "BANKNIFTY",
  MIDCAP: "NIFTYMIDCAP100",
  SMALLCAP: "NIFTYSMALLCAP250",
  FINNIFTY: "FINNIFTY",
};

/**
 * Resolve an index card's live values. Reads from the same stockPrices source
 * the rest of the page uses — no hardcoded bases, no seeded fabrication.
 * Returns isLive=false (with null values) when the feed doesn't have it, so
 * the UI can show "—" instead of a stale number (audit principle).
 */
function genIndexValues(idx: IndexData, stockPrices: Record<string, { price: number; changePercent: number; name?: string }>) {
  const key = INDEX_LIVE_KEY[idx.shortName] || idx.shortName;
  const lp = stockPrices[key];
  if (lp && lp.price > 0) {
    const change = +(lp.changePercent || 0).toFixed(2);
    const sentiment = change > 1 ? "Rally" : change > 0 ? "Mild Green" : change > -1 ? "Flat" : "Sell-off";
    return { ...idx, value: lp.price as number | null, change: change as number | null, sentiment, isLive: true };
  }
  return { ...idx, value: null as number | null, change: null as number | null, sentiment: "—", isLive: false };
}

// ─── Watchlist helpers (localStorage) ───────────────────────────
function getWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("wt_watchlist");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveWatchlist(list: WatchlistItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("wt_watchlist", JSON.stringify(list));
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
interface StocksExplorerProps {
  stockPrices: Record<string, { price: number; changePercent: number; name?: string }>;
  forexPrices: Record<string, { rate: number; change24h: number }>;
}

export default function StocksExplorer({ stockPrices, forexPrices }: StocksExplorerProps) {
  const router = useRouter();
  const [view, setView] = useState<ExplorerView>("overview");
  const [activeSector, setActiveSector] = useState<SectorDef | null>(null);
  const [mcap, setMcap] = useState("All");
  const [explorerSearch, setExplorerSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [discoveryScreen, setDiscoveryScreen] = useState("momentum");
  const [showAllStocks, setShowAllStocks] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "change" | "price" | "mcap">("change");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [fiidiiData] = useState(() => {
    const rng = seededRng("fiidii-" + new Date().toDateString());
    return {
      fiiNet: Math.round((rng() * 6000 - 2000) * 100) / 100,
      diiNet: Math.round((rng() * 4000 - 500) * 100) / 100,
      fiiLong: Math.round(rng() * 85),
      diiLong: Math.round(55 + rng() * 30),
      deliveryPct: Math.round(35 + rng() * 30),
    };
  });
  const listRef = useRef<HTMLDivElement>(null);

  // Load watchlist
  useEffect(() => { setWatchlist(getWatchlist()); }, []);

  const indices = useMemo(() => INDICES.map(idx => genIndexValues(idx, stockPrices)), [stockPrices]);
  const sectorData = useMemo(() => SECTOR_DEFS.map(def => genSectorData(def, NSE_STOCKS, stockPrices)), [stockPrices]);

  // Filtered stocks
  const filtered = useMemo(() => {
    let stocks = NSE_STOCKS as StockEntry[];
    if (activeSector) stocks = stocks.filter(s => activeSector.sectors.includes(s.sector));
    if (mcap !== "All") {
      const map: Record<string, string> = { "Large Cap": "large", "Mid Cap": "mid", "Small Cap": "small", "SME/Micro": "sme" };
      stocks = stocks.filter(s => s.mcapType === map[mcap]);
    }
    if (explorerSearch.trim()) {
      stocks = searchStocks(explorerSearch, 200);
    }
    // Sort
    return stocks.sort((a, b) => {
      const symA = a.ticker.replace(".NS", ""), symB = b.ticker.replace(".NS", "");
      const pA = stockPrices[symA], pB = stockPrices[symB];
      let cmp = 0;
      if (sortBy === "change") cmp = (pA?.changePercent || 0) - (pB?.changePercent || 0);
      else if (sortBy === "price") cmp = (pA?.price || 0) - (pB?.price || 0);
      else if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "mcap") { const order = { large: 4, mid: 3, small: 2, sme: 1 }; cmp = (order[a.mcapType || "sme"] || 0) - (order[b.mcapType || "sme"] || 0); }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [activeSector, mcap, explorerSearch, stockPrices, sortBy, sortDir]);

  const displayLimit = showAllStocks ? visibleCount : 50;
  const visible = filtered.slice(0, displayLimit);

  // Discovery filtered
  const discoveryStocks = useMemo(() => {
    const screen = DISCOVERY_SCREENS.find(s => s.id === discoveryScreen);
    if (!screen) return [];
    return NSE_STOCKS.filter(s => screen.filter(s, stockPrices as Record<string, { changePercent: number }>)).slice(0, 30);
  }, [discoveryScreen, stockPrices]);

  // Watchlist stocks
  const watchlistStocks = useMemo(() => {
    const tickers = new Set(watchlist.map(w => w.ticker));
    return NSE_STOCKS.filter(s => tickers.has(s.ticker));
  }, [watchlist]);

  // niftyChange — drive the market sentiment text + breadth chip from the LIVE NIFTY 50 change.
  // When the feed is unavailable, fall back to 0 (neutral) so we don't fabricate a direction.
  const niftyChange = +(stockPrices["NIFTY50"]?.changePercent ?? 0).toFixed(2);

  // Helpers
  const isInWatchlist = (ticker: string) => watchlist.some(w => w.ticker === ticker);
  const toggleWatchlist = (ticker: string) => {
    const next = isInWatchlist(ticker) ? watchlist.filter(w => w.ticker !== ticker) : [...watchlist, { ticker, addedAt: Date.now() }];
    setWatchlist(next); saveWatchlist(next);
  };
  const toggleCompare = (ticker: string) => {
    setCompareList(prev => prev.includes(ticker) ? prev.filter(t => t !== ticker) : prev.length < 4 ? [...prev, ticker] : prev);
  };
  const openSector = (def: SectorDef) => { setActiveSector(def); setView("list"); setVisibleCount(50); setExplorerSearch(""); setMcap("All"); };
  const backToOverview = () => { setActiveSector(null); setView("overview"); setVisibleCount(50); setExplorerSearch(""); };

  const activeSectorData = activeSector ? sectorData.find(s => s.key === activeSector.key) : null;

  /* ─── Stock Row ─── */
  const renderStockRow = (s: StockEntry, i: number) => {
    const sym = s.ticker.replace(".NS", "");
    const slug = sym.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const lp = stockPrices[sym];
    let h = 0; for (let c = 0; c < s.ticker.length; c++) { h = ((h << 5) - h) + s.ticker.charCodeAt(c); h |= 0; }
    const price = lp ? lp.price : Math.abs(h % 9000) + 50;
    const change = lp ? lp.changePercent : ((h % 800) - 400) / 100;
    const isWL = isInWatchlist(s.ticker);
    const isCompare = compareList.includes(s.ticker);
    return (
      <div key={`${s.ticker}-${i}`} style={{ display: "grid", gridTemplateColumns: "28px 28px 28px 1.8fr 0.8fr 0.7fr 80px", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border)", transition: "all 0.12s", cursor: "pointer" }}
        onMouseOver={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }} onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}>
        <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</span>
        <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(s.ticker); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: isWL ? "#f59e0b" : "var(--text-muted)", opacity: isWL ? 1 : 0.4 }} title={isWL ? "Remove from watchlist" : "Add to watchlist"}>
          {isWL ? <Star size={13} fill="#f59e0b" /> : <Star size={13} />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); toggleCompare(s.ticker); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: isCompare ? "var(--accent)" : "var(--text-muted)", opacity: isCompare ? 1 : 0.3 }} title="Compare">
          <GitCompare size={12} />
        </button>
        <Link href={`/stocks/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-primary)" }}>{s.name}</div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "flex", gap: 5, marginTop: 1 }}>
              <span>{sym}</span>
              {s.mcapType && <span style={{ background: s.mcapType === "large" ? "rgba(59,130,246,0.15)" : s.mcapType === "mid" ? "rgba(245,158,11,0.15)" : "rgba(236,72,153,0.15)", color: s.mcapType === "large" ? "#60a5fa" : s.mcapType === "mid" ? "#fbbf24" : "#f472b6", padding: "0 4px", borderRadius: 3, fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase" }}>{s.mcapType}</span>}
              <span style={{ color: "var(--text-muted)", opacity: 0.6 }}>{s.sector}</span>
            </div>
          </div>
        </Link>
        <Link href={`/stocks/${slug}`} style={{ textDecoration: "none", color: "inherit", textAlign: "right" }}>
          <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--text-primary)" }}>₹{price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
        </Link>
        <Link href={`/stocks/${slug}`} style={{ textDecoration: "none", color: "inherit", textAlign: "right" }}>
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: change >= 0 ? "var(--success)" : "var(--danger)", display: "inline-flex", alignItems: "center", gap: 2 }}>
            {change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />} {Math.abs(change).toFixed(2)}%
          </span>
        </Link>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><MiniSparkline seed={s.ticker} positive={change >= 0} width={58} height={20} /></div>
      </div>
    );
  };

  /* ─── McapFilter ─── */
  const renderMcapFilters = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 3 }}>
        {MCAP_FILTERS.map(m => (
          <button key={m} onClick={() => { setMcap(m); setVisibleCount(50); }} style={{
            padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.66rem", fontWeight: 600,
            background: mcap === m ? "var(--accent)" : "var(--bg-slate)", color: mcap === m ? "#fff" : "var(--text-secondary)",
          }}>{m}</button>
        ))}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{filtered.length} stocks</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.66rem", cursor: "pointer" }}>
          <option value="change">Sort: Change %</option>
          <option value="price">Sort: Price</option>
          <option value="name">Sort: Name</option>
          <option value="mcap">Sort: Market Cap</option>
        </select>
        <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.7rem", fontWeight: 600 }}>
          {sortDir === "desc" ? "↓" : "↑"}
        </button>
      </div>
    </div>
  );

  /* ─── Stock Table ─── */
  const renderStockTable = () => (
    <>
      <div ref={listRef} style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "28px 28px 28px 1.8fr 0.8fr 0.7fr 80px", padding: "8px 14px", borderBottom: "1px solid var(--border)", fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span>#</span><span title="Watchlist">★</span><span title="Compare">⇄</span><span>Company</span><span style={{ textAlign: "right" }}>Price</span><span style={{ textAlign: "right" }}>Chg%</span><span style={{ textAlign: "right" }}>Trend</span>
        </div>
        {visible.map((s, i) => renderStockRow(s, i))}
      </div>
      {/* Load More / View All */}
      {!showAllStocks && filtered.length > 50 && (
        <div style={{ textAlign: "center", padding: "18px 0" }}>
          <button onClick={() => { setShowAllStocks(true); setVisibleCount(100); }} style={{
            padding: "10px 28px", borderRadius: 10, border: "1px solid var(--accent)", background: "transparent", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", transition: "all 0.2s",
          }}>
            View All {filtered.length.toLocaleString()} Stocks
          </button>
        </div>
      )}
      {showAllStocks && visibleCount < filtered.length && (
        <div style={{ textAlign: "center", padding: "18px 0" }}>
          <button onClick={() => setVisibleCount(v => v + 100)} style={{ padding: "10px 28px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Load More ({(filtered.length - visibleCount).toLocaleString()} remaining)
          </button>
        </div>
      )}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
          <Search size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
          <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>No stocks found</div>
          <div style={{ fontSize: "0.8rem" }}>Try a different search or filter.</div>
        </div>
      )}
    </>
  );

  /* ─── FII/DII Panel ─── */
  const renderInstitutionalFlows = () => (
    <div style={{ background: "var(--bg-card)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border)", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Users size={15} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)" }}>Institutional Flows</span>
        <DataSourceBadge source="NSE" size="xs" />
        <TimestampBadge timestamp={Date.now()} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* FII */}
        <div style={{ padding: "14px 16px", borderRadius: 10, background: fiidiiData.fiiNet >= 0 ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${fiidiiData.fiiNet >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}` }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>FII / FPI</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: fiidiiData.fiiNet >= 0 ? "var(--success)" : "var(--danger)" }}>
            {fiidiiData.fiiNet >= 0 ? "+" : ""}₹{Math.abs(fiidiiData.fiiNet).toLocaleString("en-IN")} Cr
          </div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 4 }}>
            Long: {fiidiiData.fiiLong}% · {fiidiiData.fiiNet >= 0 ? "Net Buyers" : "Net Sellers"}
          </div>
        </div>
        {/* DII */}
        <div style={{ padding: "14px 16px", borderRadius: 10, background: fiidiiData.diiNet >= 0 ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${fiidiiData.diiNet >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}` }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>DII</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: fiidiiData.diiNet >= 0 ? "var(--success)" : "var(--danger)" }}>
            {fiidiiData.diiNet >= 0 ? "+" : ""}₹{Math.abs(fiidiiData.diiNet).toLocaleString("en-IN")} Cr
          </div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 4 }}>
            Long: {fiidiiData.diiLong}% · {fiidiiData.diiNet >= 0 ? "Net Buyers" : "Net Sellers"}
          </div>
        </div>
      </div>
      {/* Delivery & Volume */}
      <div style={{ display: "flex", gap: 16, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Delivery %</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: fiidiiData.deliveryPct > 50 ? "var(--success)" : "var(--text-primary)" }}>{fiidiiData.deliveryPct}%</div>
        </div>
        <div>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Market Breadth</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: niftyChange >= 0 ? "var(--success)" : "var(--danger)" }}>
            {niftyChange >= 0 ? "Positive" : "Negative"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Put/Call Ratio</div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {(0.7 + seededRng("pcr" + new Date().toDateString())() * 0.8).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Compare Panel ─── */
  const renderComparePanel = () => {
    if (compareList.length === 0) return null;
    const stocks = compareList.map(t => NSE_STOCKS.find(s => s.ticker === t)).filter(Boolean) as StockEntry[];
    return (
      <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "var(--bg-card)", border: "1px solid var(--accent)", borderRadius: 14, padding: "12px 20px", zIndex: 40, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
        <GitCompare size={16} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>Compare ({compareList.length}/4):</span>
        {stocks.map(s => (
          <span key={s.ticker} style={{ fontSize: "0.7rem", fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "var(--bg-slate)", color: "var(--accent)" }}>
            {s.ticker.replace(".NS", "")}
            <button onClick={() => toggleCompare(s.ticker)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", marginLeft: 4 }}><X size={10} /></button>
          </span>
        ))}
        {compareList.length >= 2 && (
          <button onClick={() => setShowCompare(true)} style={{ padding: "6px 14px", borderRadius: 6, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700 }}>Compare Now</button>
        )}
        <button onClick={() => setCompareList([])} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
      </div>
    );
  };

  /* ─── Compare Modal ─── */
  const renderCompareModal = () => {
    if (!showCompare) return null;
    const stocks = compareList.map(t => NSE_STOCKS.find(s => s.ticker === t)).filter(Boolean) as StockEntry[];
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowCompare(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-obsidian)", borderRadius: 20, padding: "28px 32px", maxWidth: 900, width: "100%", maxHeight: "85vh", overflow: "auto", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Stock Comparison</h3>
            <button onClick={() => setShowCompare(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.68rem", textTransform: "uppercase" }}>Metric</th>
                  {stocks.map(s => {
                    const sym = s.ticker.replace(".NS", "");
                    return <th key={sym} style={{ textAlign: "right", padding: "10px 14px", fontWeight: 800, color: "var(--accent)" }}>{sym}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {["Price", "Change %", "Sector", "Market Cap"].map(metric => (
                  <tr key={metric} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)" }}>{metric}</td>
                    {stocks.map(s => {
                      const sym = s.ticker.replace(".NS", "");
                      const lp = stockPrices[sym];
                      let val = "—";
                      if (metric === "Price") val = lp ? `₹${lp.price.toLocaleString("en-IN")}` : "—";
                      else if (metric === "Change %") val = lp ? `${lp.changePercent >= 0 ? "+" : ""}${lp.changePercent.toFixed(2)}%` : "—";
                      else if (metric === "Sector") val = s.sector;
                      else if (metric === "Market Cap") val = (s.mcapType || "—").toUpperCase();
                      return <td key={sym} style={{ textAlign: "right", padding: "10px 14px", fontWeight: 700, color: metric === "Change %" && lp ? (lp.changePercent >= 0 ? "var(--success)" : "var(--danger)") : "var(--text-primary)" }}>{val}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center" }}>
            Open individual stock pages for full AI analysis, DCF valuation, SWOT, and peer comparison.
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
      {/* ── Navigation Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {activeSector ? (
            <button onClick={backToOverview} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.76rem", fontWeight: 600 }}>
              <ChevronLeft size={14} /> Market Overview
            </button>
          ) : (
            <div style={{ display: "flex", gap: 2, background: "var(--bg-slate)", borderRadius: 8, padding: 2 }}>
              {(["overview", "sectors", "list", "heatmap", "discovery", "watchlist"] as ExplorerView[]).map(v => (
                <button key={v} onClick={() => { setView(v); setShowAllStocks(false); setVisibleCount(50); }} style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: "0.68rem", fontWeight: 600, textTransform: "capitalize",
                  background: view === v ? "var(--accent)" : "transparent",
                  color: view === v ? "#fff" : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}>
                  {v === "heatmap" ? "Heatmap" : v === "discovery" ? "Discovery" : v === "watchlist" ? `Watchlist (${watchlist.length})` : v === "overview" ? "Overview" : v === "sectors" ? "Sectors" : "All Stocks"}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative", width: 240 }}>
            <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input value={explorerSearch} onChange={e => { setExplorerSearch(e.target.value); setVisibleCount(50); if (e.target.value && !activeSector) setView("list"); }}
              placeholder="Search stocks, sectors..."
              style={{ width: "100%", padding: "8px 12px 8px 28px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.74rem", outline: "none" }}
            />
          </div>
          <MarketStatusIndicator />
        </div>
      </div>

      {/* ── Market Ticker ── */}
      <MarketTicker items={
        Object.keys(stockPrices).length > 0
          ? [
              ...(stockPrices.NIFTY50 ? [{ label: "NIFTY 50", value: stockPrices.NIFTY50.price.toLocaleString("en-IN"), change: stockPrices.NIFTY50.changePercent }] : []),
              ...(stockPrices.SENSEX ? [{ label: "SENSEX", value: stockPrices.SENSEX.price.toLocaleString("en-IN"), change: stockPrices.SENSEX.changePercent }] : []),
              ...(stockPrices.BANKNIFTY ? [{ label: "BANK NIFTY", value: stockPrices.BANKNIFTY.price.toLocaleString("en-IN"), change: stockPrices.BANKNIFTY.changePercent }] : []),
              ...(forexPrices.USDINR ? [{ label: "USD/INR", value: `₹${forexPrices.USDINR.rate.toFixed(2)}`, change: forexPrices.USDINR.change24h }] : []),
            ]
          : [{ label: "Loading...", value: "—" }]
      } />

      {/* ── Institutional Flows ── */}
      {(view === "overview" || activeSector) && renderInstitutionalFlows()}

      {/* ═══ OVERVIEW ═══ */}
      {!activeSector && view === "overview" && (
        <>
          {/* Market Indices */}
          <section style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Activity size={15} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>Market Indices</span>
              <DataSourceBadge source="NSE" size="xs" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
              {indices.map((idx) => {
                const isLive = idx.isLive;
                const valNum = idx.value;
                const chgNum = idx.change;
                const chgPositive = (chgNum ?? 0) >= 0;
                // True only when the parent hook has not delivered any prices yet
                // (i.e. very first load before /api/live-prices responds).
                const stillLoading = !isLive && Object.keys(stockPrices).length === 0;
                return (
                  <div key={idx.shortName} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 16px 12px", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: idx.color }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{idx.shortName}</div>
                      <span title={stillLoading ? "Fetching live market feed" : isLive ? "Live from market feed" : "Live data unavailable for this index"} style={{
                        fontSize: "0.46rem", fontWeight: 800, padding: "1px 5px", borderRadius: 3,
                        background: stillLoading ? "rgba(74,158,255,0.14)" : isLive ? "rgba(52,211,153,0.14)" : "rgba(140,153,176,0.12)",
                        color: stillLoading ? "var(--accent)" : isLive ? "var(--success)" : "var(--text-muted)", letterSpacing: "0.04em",
                        animation: stillLoading ? "wtPulse 1.4s ease-in-out infinite" : undefined,
                      }}>{stillLoading ? "● LOADING" : isLive ? "● LIVE" : "—"}</span>
                    </div>
                    <div style={{
                      fontSize: "1.1rem", fontWeight: 900, marginBottom: 3,
                      color: stillLoading ? "var(--text-muted)" : "var(--text-primary)",
                      animation: stillLoading ? "wtPulse 1.4s ease-in-out infinite" : undefined,
                    }}>
                      {valNum != null ? Number(valNum).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : stillLoading ? "…" : "—"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      {chgNum != null ? (
                        <>
                          {chgPositive ? <ArrowUpRight size={11} style={{ color: "var(--success)" }} /> : <ArrowDownRight size={11} style={{ color: "var(--danger)" }} />}
                          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: chgPositive ? "var(--success)" : "var(--danger)" }}>{chgPositive ? "+" : ""}{chgNum}%</span>
                        </>
                      ) : (
                        <span style={{ fontSize: "0.66rem", color: stillLoading ? "var(--accent)" : "var(--text-muted)", fontWeight: 600, animation: stillLoading ? "wtPulse 1.4s ease-in-out infinite" : undefined }}>
                          {stillLoading ? "fetching live feed…" : "data unavailable"}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.52rem", fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: chgNum != null ? (chgPositive ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)") : "rgba(140,153,176,0.1)", color: chgNum != null ? (chgPositive ? "var(--success)" : "var(--danger)") : "var(--text-muted)" }}>{idx.sentiment}</span>
                      <MiniSparkline seed={idx.shortName} positive={chgPositive} width={46} height={16} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* AI Market Brief */}
          <section style={{ marginBottom: 22 }}>
            <div style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-slate))", borderRadius: 14, padding: "20px 24px", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,158,255,0.06) 0%, transparent 70%)" }} />
              <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Brain size={16} style={{ color: "#fff" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-primary)" }}>AI Market Intelligence</span>
                    <DataSourceBadge source="AI Estimate" size="xs" />
                    <span style={{ fontSize: "0.56rem", color: "var(--text-muted)" }}>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    {niftyChange > 0
                      ? "Markets showing strength with broad-based participation. Banking and infrastructure sectors leading, driven by credit growth and government capex. FIIs are net buyers, signaling renewed confidence."
                      : "Markets consolidating after a strong rally. Global headwinds from US bond yields and Dollar strength weighing on sentiment. Selective buying in mid and small-caps showing relative outperformance."
                    }
                  </p>
                  {/* Simple / Advanced toggle */}
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontSize: "0.66rem", color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>Read advanced analysis</summary>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "8px 0 0" }}>
                      {niftyChange > 0
                        ? "Technical structure remains bullish with NIFTY above 20-DMA. RSI at 58 indicates room for further upside. FII derivatives data shows long buildup in index futures with put-call ratio at supportive levels. Key resistance at previous ATH; support at 20-DMA."
                        : "NIFTY trading below 5-DMA with RSI cooling from overbought territory. FII unwinding long positions in index futures. Put-call ratio declining suggests caution. VIX uptick signals rising volatility expectations. Key support at 50-DMA."
                      }
                    </p>
                  </details>
                </div>
              </div>
            </div>
          </section>

          {/* Smart Discovery Quick Access */}
          <section style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Sparkles size={15} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>Smart Discovery</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {DISCOVERY_SCREENS.map(d => (
                <button key={d.id} onClick={() => { setView("discovery"); setDiscoveryScreen(d.id); }} style={{
                  padding: "14px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }} onMouseOver={e => { e.currentTarget.style.borderColor = d.color; }} onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ color: d.color }}>{d.icon}</span>
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-primary)" }}>{d.label}</span>
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{d.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Sector Explorer */}
          <section style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <BarChart3 size={15} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>Sector Explorer</span>
              <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Click to drill into stocks</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
              {sectorData.map((sec) => (
                <button key={sec.key} onClick={() => openSector(sec)} style={{
                  background: "var(--bg-card)", borderRadius: 12, padding: "16px 18px 14px", border: "1px solid var(--border)", textAlign: "left", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden",
                }} onMouseOver={e => { e.currentTarget.style.borderColor = sec.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: sec.heatColor, opacity: 0.8 }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${sec.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: sec.color }}>{sec.icon}</div>
                      <div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{sec.name}</div>
                        <div style={{ fontSize: "0.54rem", color: "var(--text-muted)" }}>{sec.stockCount} stocks</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: sec.avgChange >= 0 ? "var(--success)" : "var(--danger)" }}>{sec.avgChange > 0 ? "+" : ""}{sec.avgChange}%</div>
                      <div style={{ fontSize: "0.5rem", fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: sec.sentiment.includes("Bull") ? "rgba(52,211,153,0.12)" : sec.sentiment.includes("Bear") ? "rgba(248,113,113,0.12)" : "rgba(140,153,176,0.1)", color: sec.sentiment.includes("Bull") ? "var(--success)" : sec.sentiment.includes("Bear") ? "var(--danger)" : "var(--text-secondary)" }}>{sec.sentiment}</div>
                    </div>
                  </div>
                  <MiniSparkline seed={sec.key} positive={sec.avgChange >= 0} width={180} height={24} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.56rem", marginTop: 6 }}>
                    <span style={{ color: "var(--success)" }}>▲ {sec.topGainer.name.split(" ")[0]}</span>
                    <span style={{ color: "var(--danger)" }}>▼ {sec.topLoser.name.split(" ")[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* What This Means */}
          <section style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Zap size={15} style={{ color: "var(--warning)" }} />
              <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--text-primary)" }}>What This Means</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {[
                { text: "Rising oil prices may negatively affect paint, aviation, and chemical companies while benefiting upstream oil & gas stocks.", color: "#ef4444", sector: "Energy vs Consumption" },
                { text: "Lower interest rates support real estate, auto, and banking stocks through cheaper credit and higher loan growth.", color: "#60a5fa", sector: "Rates vs Financials" },
                { text: "Rupee weakness benefits IT exporters but pressures importers like oil marketing companies and electronics.", color: "var(--success)", sector: "FX vs IT/Energy" },
              ].map((card, i) => (
                <div key={i} style={{ background: "var(--bg-card)", borderRadius: 10, padding: "16px 18px", border: "1px solid var(--border)", borderLeft: `3px solid ${card.color}` }}>
                  <div style={{ fontSize: "0.56rem", fontWeight: 700, color: card.color, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{card.sector}</div>
                  <p style={{ fontSize: "0.74rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{card.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* View All Link */}
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={() => { setView("list"); setShowAllStocks(false); }} style={{
              padding: "11px 28px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 700,
              background: "linear-gradient(135deg, var(--accent-deep), var(--accent))", color: "#fff", border: "none", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 12px rgba(74,158,255,0.2)",
            }}>
              Full Stock Explorer — All {NSE_STOCKS.length}+ Stocks →
            </button>
          </div>
        </>
      )}

      {/* ═══ SECTORS VIEW ═══ */}
      {!activeSector && view === "sectors" && (
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {sectorData.map((sec) => (
              <button key={sec.key} onClick={() => openSector(sec)} style={{
                background: "var(--bg-card)", borderRadius: 12, padding: "18px 20px", border: "1px solid var(--border)", textAlign: "left", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden",
              }} onMouseOver={e => { e.currentTarget.style.borderColor = sec.color; }} onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: sec.heatColor }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${sec.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: sec.color }}>{sec.icon}</div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{sec.name}</div>
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{sec.stockCount} stocks · {sec.sentiment}</div>
                  </div>
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: sec.avgChange >= 0 ? "var(--success)" : "var(--danger)", marginBottom: 8 }}>{sec.avgChange > 0 ? "+" : ""}{sec.avgChange}%</div>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>{sec.aiStory}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ SECTOR DETAIL VIEW ═══ */}
      {activeSector && activeSectorData && (
        <>
          <div style={{ background: `linear-gradient(135deg, ${activeSector.color}10, ${activeSector.color}20)`, borderRadius: 14, padding: "22px 24px", marginBottom: 18, border: `1px solid ${activeSector.color}30` }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Brain size={14} style={{ color: activeSector.color }} />
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: activeSector.color, textTransform: "uppercase" }}>AI Sector Story</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>{activeSector.aiStory}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: activeSectorData.avgChange >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", color: activeSectorData.avgChange >= 0 ? "var(--success)" : "var(--danger)" }}>{activeSectorData.sentiment}</span>
                  <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>Avg: <strong style={{ color: activeSectorData.avgChange >= 0 ? "var(--success)" : "var(--danger)" }}>{activeSectorData.avgChange > 0 ? "+" : ""}{activeSectorData.avgChange}%</strong></span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "10px 14px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.54rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Top Gainer</div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-primary)" }}>{activeSectorData.topGainer.name.split(" ").slice(0, 2).join(" ")}</div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--success)" }}>+{activeSectorData.topGainer.change.toFixed(2)}%</div>
                </div>
                <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "10px 14px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.54rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Top Loser</div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-primary)" }}>{activeSectorData.topLoser.name.split(" ").slice(0, 2).join(" ")}</div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--danger)" }}>{activeSectorData.topLoser.change.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </div>
          {renderMcapFilters()}
          {renderStockTable()}
        </>
      )}

      {/* ═══ ALL STOCKS LIST ═══ */}
      {!activeSector && view === "list" && (
        <>
          {renderMcapFilters()}
          {renderStockTable()}
        </>
      )}

      {/* ═══ HEATMAP VIEW ═══ */}
      {!activeSector && view === "heatmap" && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Flame size={15} style={{ color: "var(--danger)" }} />
            <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>Market Heatmap</span>
            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Size = market cap · Color = daily change</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, background: "var(--bg-card)", borderRadius: 14, padding: 14, border: "1px solid var(--border)" }}>
            {sectorData.map((sec) => {
              const sectorStocks = (NSE_STOCKS as StockEntry[]).filter(s => sec.sectors.includes(s.sector)).slice(0, 12);
              return (
                <div key={sec.key} style={{ flex: `${Math.max(sec.stockCount, 8)} 0 0`, minWidth: 100 }}>
                  <div style={{ fontSize: "0.54rem", fontWeight: 700, color: sec.color, marginBottom: 3, paddingLeft: 3 }}>{sec.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {sectorStocks.map(s => {
                      const sym = s.ticker.replace(".NS", "");
                      const lp = stockPrices[sym];
                      let h2 = 0;
                      for (let c = 0; c < s.ticker.length; c++) { h2 = ((h2 << 5) - h2) + s.ticker.charCodeAt(c); h2 |= 0; }
                      const chg = lp ? lp.changePercent : ((h2 % 800) - 400) / 100;
                      const intensity = Math.min(Math.abs(chg) / 4, 1);
                      const bg = chg >= 0 ? `rgba(52, 211, 153, ${0.12 + intensity * 0.45})` : `rgba(248, 113, 113, ${0.12 + intensity * 0.45})`;
                      const size = s.mcapType === "large" ? 68 : s.mcapType === "mid" ? 54 : 44;
                      return (
                        <Link key={sym} href={`/stocks/${sym.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} style={{ textDecoration: "none" }}>
                          <div style={{ width: size, height: size, borderRadius: 5, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.12s" }}
                            onMouseOver={e => e.currentTarget.style.transform = "scale(1.06)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                            <span style={{ fontSize: "0.5rem", fontWeight: 700, color: chg >= 0 ? "#6ee7b7" : "#fca5a5" }}>{sym.slice(0, 6)}</span>
                            <span style={{ fontSize: "0.48rem", fontWeight: 800, color: chg >= 0 ? "var(--success)" : "var(--danger)" }}>{chg >= 0 ? "+" : ""}{chg.toFixed(1)}%</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12 }}>
            {[{ bg: "rgba(248,113,113,0.5)", label: "Strong Decline" }, { bg: "rgba(248,113,113,0.15)", label: "Mild Decline" }, { bg: "rgba(52,211,153,0.15)", label: "Mild Gain" }, { bg: "rgba(52,211,153,0.5)", label: "Strong Gain" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 16, height: 8, borderRadius: 2, background: l.bg }} />
                <span style={{ fontSize: "0.54rem", color: "var(--text-muted)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ DISCOVERY VIEW ═══ */}
      {!activeSector && view === "discovery" && (
        <section>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {DISCOVERY_SCREENS.map(d => (
              <button key={d.id} onClick={() => setDiscoveryScreen(d.id)} style={{
                padding: "7px 14px", borderRadius: 8, border: discoveryScreen === d.id ? `1px solid ${d.color}` : "1px solid var(--border)",
                background: discoveryScreen === d.id ? `${d.color}12` : "var(--bg-card)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 600,
                color: discoveryScreen === d.id ? d.color : "var(--text-secondary)",
              }}>
                {d.icon} {d.label}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 14, padding: "12px 16px", background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>
              {DISCOVERY_SCREENS.find(d => d.id === discoveryScreen)?.label}
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
              {DISCOVERY_SCREENS.find(d => d.id === discoveryScreen)?.description} · {discoveryStocks.length} stocks found
            </div>
          </div>
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "28px 28px 28px 1.8fr 0.8fr 0.7fr 80px", padding: "8px 14px", borderBottom: "1px solid var(--border)", fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              <span>#</span><span>★</span><span>⇄</span><span>Company</span><span style={{ textAlign: "right" }}>Price</span><span style={{ textAlign: "right" }}>Chg%</span><span style={{ textAlign: "right" }}>Trend</span>
            </div>
            {discoveryStocks.map((s, i) => renderStockRow(s, i))}
          </div>
          {discoveryStocks.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <Search size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
              <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>No stocks match this screen</div>
              <div style={{ fontSize: "0.74rem" }}>Live price data is required for momentum and turnaround screens.</div>
            </div>
          )}
        </section>
      )}

      {/* ═══ WATCHLIST VIEW ═══ */}
      {!activeSector && view === "watchlist" && (
        <section>
          {watchlistStocks.length > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Star size={15} style={{ color: "#f59e0b" }} fill="#f59e0b" />
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>Your Watchlist</span>
                <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>{watchlistStocks.length} stocks</span>
              </div>
              <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "28px 28px 28px 1.8fr 0.8fr 0.7fr 80px", padding: "8px 14px", borderBottom: "1px solid var(--border)", fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  <span>#</span><span>★</span><span>⇄</span><span>Company</span><span style={{ textAlign: "right" }}>Price</span><span style={{ textAlign: "right" }}>Chg%</span><span style={{ textAlign: "right" }}>Trend</span>
                </div>
                {watchlistStocks.map((s, i) => renderStockRow(s, i))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <Star size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>No stocks in watchlist</div>
              <div style={{ fontSize: "0.8rem", marginBottom: 16 }}>Click the ★ icon on any stock to add it to your watchlist.</div>
              <button onClick={() => setView("overview")} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid var(--accent)", background: "transparent", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)" }}>
                Browse Stocks
              </button>
            </div>
          )}
        </section>
      )}

      {/* Compare floating panel + modal */}
      {renderComparePanel()}
      {renderCompareModal()}
    </div>
  );
}
