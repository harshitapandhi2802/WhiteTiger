"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Search, AlertCircle, Zap, ChevronDown, Shield, Globe,
  Package, Users, Anchor, BarChart3, Target, Activity, FileText,
  X, Check, Layers, Flame, Bitcoin, Coins, Droplets, Factory,
  DollarSign, PiggyBank, ArrowUpRight, ArrowDownRight, RefreshCw, Building2,
  Brain, Cpu, Pill, Car, Landmark, Wifi, Monitor, Gem, Sparkles, ChevronLeft
} from "lucide-react";
import { incrementUsage, canAnalyze, remainingAnalyses, getPlan, activatePlan } from "@/lib/usage";
import { searchStocks, NSE_STOCKS, STOCK_SECTORS as LIB_STOCK_SECTORS, MCAP_FILTERS, type StockEntry } from "@/lib/stocks";
import { searchCommodities, MCX_COMMODITIES, COMMODITY_CATEGORIES, type CommodityEntry } from "@/lib/commodities";
import { searchCrypto, CRYPTO_LIST, CRYPTO_CATEGORIES, type CryptoEntry } from "@/lib/crypto";
import { searchCurrencies, CURRENCY_LIST, CURRENCY_CATEGORIES, type CurrencyEntry } from "@/lib/currencies";
import { searchMutualFunds, MUTUAL_FUNDS, MF_CATEGORIES, type MutualFundEntry } from "@/lib/mutualfunds";
import { searchBonds, BONDS_LIST, BOND_CATEGORIES, type BondEntry } from "@/lib/bonds";
import { INTL_INDICES, INTL_STOCKS, INTL_COUNTRIES, getIndicesByCountry, getStocksForIndex } from "@/lib/international";
import { ScoreGauge, ScenarioTable, TagList, renderMarkdown, getRatingBadge, getOutlookBadge } from "@/components/DashboardWidgets";
import { MiniSparkline, TradingViewChart, MarketTicker, ScrollingTicker, MarketPulseBar, LiveChartGrid } from "@/components/LiveCharts";
import { IntelligenceColumn } from "@/components/IntelligenceColumn";
import { DerivativesPanel } from "@/components/DerivativesPanel";
import { IndianDerivativesPage } from "@/components/IndianDerivatives";
import { GlobalDerivativesTerminal } from "@/components/GlobalDerivatives";
import { DerivativesAgentDashboard } from "@/components/DerivativesAgent";
import { RealEstateDashboard } from "@/components/RealEstateDashboard";
import { RealEstatePanel } from "@/components/RealEstatePanel";
import FXIntelligenceDashboard from "@/components/FXIntelligenceDashboard";
import FXPlatform from "@/components/fx/FXPlatform";
import WealthAdvisoryDashboard from "@/components/WealthAdvisoryDashboard";
import TaxIntelligenceDashboard from "@/components/TaxIntelligenceDashboard";
import MFPlatform from "@/components/mf/MFPlatform";
import BondsPlatform from "@/components/bonds/BondsPlatform";
import CryptoPlatform from "@/components/crypto/CryptoPlatform";
import { DataHealthMonitor } from "@/components/DataHealth";
import SplashScreen from "@/components/mobile/SplashScreen";
import FloatingAI from "@/components/mobile/FloatingAI";
import MobileHome from "@/components/mobile-lite/MobileHome";
import MobileMarkets from "@/components/mobile-lite/MobileMarkets";
import MobileSearch from "@/components/mobile-lite/MobileSearch";
import BottomNav from "@/components/mobile-lite/BottomNav";
import {
  useStockPrices, useCommodityPrices, useForexRates, useMFNavs, useInternationalPrices,
} from "@/hooks/useMarketData";

type MainTab = "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international" | "derivatives" | "realestate" | "wealth" | "tax";
type ResultView = "dashboard" | "report";

declare global { interface Window { Razorpay: new (o: Record<string, unknown>) => { open: () => void }; } }

/* ═══ Stock Sector Categories — from lib, limited for dashboard ═══ */
const STOCK_SECTORS = LIB_STOCK_SECTORS.slice(0, 20); // show top 20 sectors on dashboard

/* Top 50 stocks for the main dashboard — curated for visibility */
const TOP_50_TICKERS = new Set([
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "SBIN.NS",
  "ITC.NS", "HINDUNILVR.NS", "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS",
  "TITAN.NS", "BAJFINANCE.NS", "SUNPHARMA.NS", "WIPRO.NS", "HCLTECH.NS", "TATAMOTORS.NS",
  "ULTRACEMCO.NS", "NESTLEIND.NS", "POWERGRID.NS", "NTPC.NS", "M&M.NS", "BAJAJFINSV.NS",
  "TECHM.NS", "TATASTEEL.NS", "INDUSINDBK.NS", "ADANIENT.NS", "ADANIPORTS.NS", "ADANIGREEN.NS",
  "GRASIM.NS", "CIPLA.NS", "DRREDDY.NS", "COALINDIA.NS", "EICHERMOT.NS", "BRITANNIA.NS",
  "DIVISLAB.NS", "BAJAJ-AUTO.NS", "HEROMOTOCO.NS", "JSWSTEEL.NS", "SBILIFE.NS", "HDFCLIFE.NS",
  "APOLLOHOSP.NS", "TATACONSUM.NS", "HINDALCO.NS", "BPCL.NS", "ONGC.NS", "ZOMATO.NS",
]);

/* ═══ Stock Card Component ═══ */
function StockCard({ s, stockPrices }: { s: StockEntry; stockPrices: Record<string, { price: number; changePercent: number; name?: string }> }) {
  const sym = s.ticker.replace(".NS", "");
  const livePrice = stockPrices[sym];
  const change = livePrice?.changePercent || 0;
  const slug = sym.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const nseUrl = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(sym)}`;
  return (
    <button key={s.ticker} onClick={() => { window.location.href = `/stocks/${slug}`; }} className="card fx-pair-card" style={{
      padding: 0, textAlign: "left", cursor: "pointer",
      border: "0.5px solid var(--border)", background: "var(--bg-midnight)", overflow: "hidden", transition: "all 0.2s ease-out", position: "relative",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: change >= 0 ? "var(--success)" : "var(--danger)" }} />
      {/* Official NSE Link — top right */}
      <a
        href={nseUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        title={`View ${sym} on NSE India`}
        style={{
          position: "absolute", top: 8, right: 8, zIndex: 2,
          display: "flex", alignItems: "center", gap: 3,
          padding: "3px 8px", borderRadius: 6,
          background: "rgba(74,158,255,0.06)", border: "0.5px solid rgba(74,158,255,0.12)",
          color: "#4A9EFF", fontSize: "0.52rem", fontWeight: 600,
          textDecoration: "none", transition: "all 0.2s",
        }}
      >
        NSE <ArrowUpRight size={10} />
      </a>
      <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)", marginBottom: 2 }}>{s.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 600 }}>{sym}</span>
            <span className="badge badge-gray" style={{ padding: "1px 6px", fontSize: "0.56rem" }}>{s.sector}</span>
          </div>
        </div>
        <MiniSparkline seed={s.ticker} positive={change >= 0} width={58} height={24} />
      </div>
      <div style={{ padding: "0 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {livePrice ? (
          <>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>₹{livePrice.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            <span style={{
              fontSize: "0.74rem", fontWeight: 700,
              color: change >= 0 ? "var(--success)" : "var(--danger)",
              background: change >= 0 ? "var(--success-bg)" : "var(--danger-bg)",
              padding: "2px 7px", borderRadius: 5, display: "flex", alignItems: "center", gap: 2,
            }}>
              {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(change).toFixed(2)}%
            </span>
          </>
        ) : (
          <span style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>View Analysis →</span>
        )}
      </div>
    </button>
  );
}

/* ═══ Sector Definitions for Stocks Explorer ═══ */
interface SectorDef {
  name: string; key: string; color: string; icon: React.ReactNode;
  niftyIndex?: string; sectors: string[]; aiStory: string;
}

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

/* ═══ INDEX DATA ═══ */
interface IndexData { name: string; shortName: string; color: string; constituents: number; description: string; }
const INDICES: IndexData[] = [
  { name: "NIFTY 50", shortName: "NIFTY", color: "#6366f1", constituents: 50, description: "India's benchmark — Top 50 companies by market cap" },
  { name: "SENSEX", shortName: "SENSEX", color: "#ef4444", constituents: 30, description: "BSE benchmark — 30 largest companies" },
  { name: "BANK NIFTY", shortName: "BANKNIFTY", color: "#2563eb", constituents: 12, description: "Top banking stocks — interest rate sensitive" },
  { name: "NIFTY MIDCAP 100", shortName: "MIDCAP", color: "#f59e0b", constituents: 100, description: "Mid-sized growth companies — higher beta" },
  { name: "NIFTY SMALLCAP 250", shortName: "SMALLCAP", color: "#10b981", constituents: 250, description: "Small companies — high growth, high risk" },
  { name: "NIFTY FIN SERVICE", shortName: "FINNIFTY", color: "#0ea5e9", constituents: 20, description: "Banks, NBFCs, Insurance — financial ecosystem" },
];

/* ═══ Seeded RNG for deterministic data ═══ */
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

function genIndexValues(idx: IndexData) {
  const rng = seededRng(idx.shortName + new Date().toDateString());
  const bases: Record<string, number> = { NIFTY: 24812, SENSEX: 81340, BANKNIFTY: 52340, MIDCAP: 58200, SMALLCAP: 17450, FINNIFTY: 24100 };
  const base = bases[idx.shortName] || 20000;
  const change = ((rng() * 4 - 1.5) * 100 | 0) / 100;
  const value = base + Math.round(base * change / 100);
  const sentiment = change > 1 ? "Bullish" : change > 0 ? "Positive" : change > -1 ? "Neutral" : "Bearish";
  return { ...idx, value, change, sentiment };
}

/* ═══ Sector-First Stocks Explorer Component (DARK THEME) ═══ */
function StocksExplorer({ stockPrices, forexPrices }: { stockPrices: Record<string, { price: number; changePercent: number; name?: string }>; forexPrices: Record<string, { rate: number; change24h: number }> }) {
  const [activeSector, setActiveSector] = useState<SectorDef | null>(null);
  const [view, setView] = useState<"sectors" | "list" | "heatmap">("sectors");
  const [mcap, setMcap] = useState("All");
  const [explorerSearch, setExplorerSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);

  const indices = useMemo(() => INDICES.map(genIndexValues), []);
  const sectorData = useMemo(() => SECTOR_DEFS.map(def => genSectorData(def, NSE_STOCKS, stockPrices)), [stockPrices]);

  const filtered = useMemo(() => {
    let stocks = NSE_STOCKS as StockEntry[];
    if (activeSector) stocks = stocks.filter(s => activeSector.sectors.includes(s.sector));
    if (mcap !== "All") {
      const map: Record<string, string> = { "Large Cap": "large", "Mid Cap": "mid", "Small Cap": "small", "SME/Micro": "sme" };
      stocks = stocks.filter(s => s.mcapType === map[mcap]);
    }
    if (explorerSearch.trim()) {
      const q = explorerSearch.toLowerCase();
      stocks = stocks.filter(s => s.name.toLowerCase().includes(q) || s.ticker.toLowerCase().replace(".ns", "").includes(q) || s.sector.toLowerCase().includes(q));
    }
    return stocks;
  }, [activeSector, mcap, explorerSearch]);

  const visible = filtered.slice(0, visibleCount);

  const openSector = (def: SectorDef) => { setActiveSector(def); setView("list"); setVisibleCount(50); setExplorerSearch(""); setMcap("All"); };
  const backToSectors = () => { setActiveSector(null); setView("sectors"); setVisibleCount(50); setExplorerSearch(""); };

  const activeSectorData = activeSector ? sectorData.find(s => s.key === activeSector.key) : null;
  const rng = seededRng("market-" + new Date().toDateString());
  const niftyChange = ((rng() * 3 - 1) * 100 | 0) / 100;

  /* Stock row renderer (shared between sector detail + list view) */
  const renderStockRow = (s: StockEntry, i: number) => {
    const sym = s.ticker.replace(".NS", "");
    const slug = sym.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const lp = stockPrices[sym];
    let h = 0; for (let c = 0; c < s.ticker.length; c++) { h = ((h << 5) - h) + s.ticker.charCodeAt(c); h |= 0; }
    const price = lp ? lp.price : Math.abs(h % 9000) + 50;
    const change = lp ? lp.changePercent : ((h % 800) - 400) / 100;
    return (
      <Link key={`${s.ticker}-${i}`} href={`/stocks/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ display: "grid", gridTemplateColumns: "32px 1.8fr 0.8fr 0.7fr 80px", alignItems: "center", padding: "12px 18px", borderBottom: "1px solid var(--border)", transition: "all 0.15s", cursor: "pointer" }}
          onMouseOver={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }} onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}>
          <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary)" }}>{s.name}</div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", display: "flex", gap: 6, marginTop: 2 }}>
              <span>{sym}</span>
              {s.mcapType && <span style={{ background: s.mcapType === "large" ? "rgba(59,130,246,0.15)" : s.mcapType === "mid" ? "rgba(245,158,11,0.15)" : "rgba(236,72,153,0.15)", color: s.mcapType === "large" ? "#60a5fa" : s.mcapType === "mid" ? "#fbbf24" : "#f472b6", padding: "0 5px", borderRadius: 3, fontSize: "0.54rem", fontWeight: 700, textTransform: "uppercase" }}>{s.mcapType}</span>}
            </div>
          </div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)", textAlign: "right" }}>₹{price.toLocaleString("en-IN")}</div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: change >= 0 ? "var(--success)" : "var(--danger)", display: "inline-flex", alignItems: "center", gap: 2 }}>
              {change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />} {Math.abs(change).toFixed(2)}%
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}><MiniSparkline seed={s.ticker} positive={change >= 0} width={60} height={22} /></div>
        </div>
      </Link>
    );
  };

  /* Mcap filter buttons */
  const renderMcapFilters = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {MCAP_FILTERS.map(m => (
          <button key={m} onClick={() => { setMcap(m); setVisibleCount(50); }} style={{
            padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600,
            background: mcap === m ? "var(--accent)" : "var(--bg-slate)", color: mcap === m ? "#fff" : "var(--text-secondary)",
          }}>{m}</button>
        ))}
      </div>
      <span style={{ marginLeft: "auto", fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 600 }}>{filtered.length} stocks</span>
    </div>
  );

  /* Stock table container */
  const renderStockTable = () => (
    <>
      <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "32px 1.8fr 0.8fr 0.7fr 80px", padding: "10px 18px", borderBottom: "1px solid var(--border)", fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span>#</span><span>Company</span><span style={{ textAlign: "right" }}>Price</span><span style={{ textAlign: "right" }}>Change</span><span style={{ textAlign: "right" }}>Trend</span>
        </div>
        {visible.map((s: StockEntry, i: number) => renderStockRow(s, i))}
      </div>
      {visibleCount < filtered.length && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <button onClick={() => setVisibleCount(v => v + 50)} style={{ padding: "10px 32px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Load More ({(filtered.length - visibleCount).toLocaleString()} remaining)
          </button>
        </div>
      )}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <Search size={32} style={{ color: "var(--text-muted)", marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>No stocks found</div>
          <div style={{ fontSize: "0.82rem" }}>Try a different search term or adjust your filters.</div>
        </div>
      )}
    </>
  );

  return (
    <div>
      {/* ── View Mode Toggle + Search ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {activeSector ? (
            <button onClick={backToSectors} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.76rem", fontWeight: 600 }}>
              <ChevronLeft size={14} /> Market Overview
            </button>
          ) : (
            <div style={{ display: "flex", gap: 2, background: "var(--bg-slate)", borderRadius: 8, padding: 2 }}>
              {(["sectors", "list", "heatmap"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize",
                  background: view === v ? "var(--accent)" : "transparent",
                  color: view === v ? "#fff" : "var(--text-secondary)",
                }}>{v === "heatmap" ? "Heat Map" : v === "sectors" ? "Sectors" : "All Stocks"}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: "relative", width: 260 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input value={explorerSearch} onChange={e => { setExplorerSearch(e.target.value); setVisibleCount(50); if (e.target.value && !activeSector) setView("list"); }}
            placeholder="Search stocks, sectors..."
            style={{ width: "100%", padding: "9px 14px 9px 32px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.78rem", outline: "none" }}
          />
        </div>
      </div>

      {/* Charts */}
      <LiveChartGrid tab="stocks" />

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

      {/* ═══ SECTOR DETAIL VIEW ═══ */}
      {activeSector && activeSectorData && (
        <>
          <div style={{ background: `linear-gradient(135deg, ${activeSector.color}10, ${activeSector.color}20)`, borderRadius: 16, padding: "24px 28px", marginBottom: 20, border: `1px solid ${activeSector.color}30` }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Brain size={16} style={{ color: activeSector.color }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: activeSector.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>AI Sector Story</span>
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>{activeSector.aiStory}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
                  <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "3px 10px", borderRadius: 5, background: activeSectorData.avgChange >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", color: activeSectorData.avgChange >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {activeSectorData.sentiment}
                  </span>
                  <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>·</span>
                  <span style={{ fontSize: "0.66rem", color: "var(--text-secondary)" }}>
                    Avg: <strong style={{ color: activeSectorData.avgChange >= 0 ? "var(--success)" : "var(--danger)" }}>{activeSectorData.avgChange > 0 ? "+" : ""}{activeSectorData.avgChange}%</strong>
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, minWidth: 240 }}>
                <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: "12px 16px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Top Gainer</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{activeSectorData.topGainer.name.split(" ").slice(0, 2).join(" ")}</div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--success)" }}>+{activeSectorData.topGainer.change.toFixed(2)}%</div>
                </div>
                <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: "12px 16px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Top Loser</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{activeSectorData.topLoser.name.split(" ").slice(0, 2).join(" ")}</div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--danger)" }}>{activeSectorData.topLoser.change.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </div>
          {renderMcapFilters()}
          {renderStockTable()}
        </>
      )}

      {/* ═══ SECTOR-FIRST OVERVIEW ═══ */}
      {!activeSector && view === "sectors" && (
        <>
          {/* Market Indices */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Activity size={16} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-primary)" }}>Market Indices</span>
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 500 }}>Live market pulse</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {indices.map((idx) => (
                <div key={idx.shortName} style={{ background: "var(--bg-card)", borderRadius: 14, padding: "18px 18px 14px", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: idx.color }} />
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>{idx.shortName}</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>{idx.value.toLocaleString("en-IN")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    {idx.change >= 0 ? <ArrowUpRight size={12} style={{ color: "var(--success)" }} /> : <ArrowDownRight size={12} style={{ color: "var(--danger)" }} />}
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, color: idx.change >= 0 ? "var(--success)" : "var(--danger)" }}>{idx.change > 0 ? "+" : ""}{idx.change}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.56rem", fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: idx.change >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", color: idx.change >= 0 ? "var(--success)" : "var(--danger)" }}>{idx.sentiment}</span>
                    <MiniSparkline seed={idx.shortName} positive={idx.change >= 0} width={50} height={18} />
                  </div>
                  <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", marginTop: 6 }}>{idx.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Market Brief */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-slate))", borderRadius: 16, padding: "22px 28px", color: "#fff", position: "relative", overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,158,255,0.08) 0%, transparent 70%)" }} />
              <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", gap: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Brain size={18} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)" }}>AI Market Intelligence</span>
                    <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
                    {niftyChange > 0
                      ? "Markets are showing strength with broad-based participation. Banking and infrastructure sectors are leading the rally driven by strong credit growth data and government capex push. FIIs are net buyers, signaling renewed confidence."
                      : "Markets are consolidating after a strong rally phase. Global headwinds from rising US bond yields and Dollar Index strength are weighing on sentiment. Mid and small-caps are showing relative outperformance with selective buying."
                    }
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sector Explorer */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <BarChart3 size={16} style={{ color: "var(--accent)" }} />
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-primary)" }}>Sector Explorer</span>
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 500 }}>Click any sector to explore stocks</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {sectorData.map((sec) => (
                <button key={sec.key} onClick={() => openSector(sec)} style={{
                  background: "var(--bg-card)", borderRadius: 14, padding: "20px 20px 16px", border: "1px solid var(--border)", textAlign: "left", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden",
                }} onMouseOver={e => { e.currentTarget.style.borderColor = sec.color; e.currentTarget.style.boxShadow = `0 4px 20px ${sec.color}20`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: sec.heatColor, opacity: 0.8 }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sec.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: sec.color }}>{sec.icon}</div>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{sec.name}</div>
                        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 500 }}>{sec.stockCount} stocks</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.92rem", fontWeight: 800, color: sec.avgChange >= 0 ? "var(--success)" : "var(--danger)" }}>{sec.avgChange > 0 ? "+" : ""}{sec.avgChange}%</div>
                      <div style={{ fontSize: "0.54rem", fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: sec.sentiment.includes("Bull") ? "rgba(52,211,153,0.12)" : sec.sentiment.includes("Bear") ? "rgba(248,113,113,0.12)" : "rgba(140,153,176,0.1)", color: sec.sentiment.includes("Bull") ? "var(--success)" : sec.sentiment.includes("Bear") ? "var(--danger)" : "var(--text-secondary)" }}>{sec.sentiment}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}><MiniSparkline seed={sec.key} positive={sec.avgChange >= 0} width={200} height={28} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem" }}>
                    <span style={{ color: "var(--success)" }}>▲ {sec.topGainer.name.split(" ")[0]}</span>
                    <span style={{ color: "var(--danger)" }}>▼ {sec.topLoser.name.split(" ")[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* "What This Means" AI Cards */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Zap size={16} style={{ color: "var(--warning)" }} />
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>What This Means</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {[
                { text: "Rising oil prices may negatively affect paint, aviation, and chemical companies while benefiting upstream oil & gas stocks.", color: "#ef4444", sector: "Energy vs Consumption" },
                { text: "Lower interest rates support real estate, auto (financing), and banking stocks through cheaper credit and higher loan growth.", color: "#60a5fa", sector: "Rates vs Financials" },
                { text: "Rupee weakness benefits IT exporters (revenue in USD) but pressures importers like oil marketing companies and electronics.", color: "var(--success)", sector: "FX vs IT/Energy" },
              ].map((card, i) => (
                <div key={i} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "18px 20px", border: "1px solid var(--border)", borderLeft: `3px solid ${card.color}` }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, color: card.color, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{card.sector}</div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>{card.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Link to full explorer */}
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Link href="/stocks" style={{
              padding: "12px 28px", borderRadius: 10, fontSize: "0.82rem", fontWeight: 700, textDecoration: "none",
              background: "linear-gradient(135deg, var(--accent-deep), var(--accent))", color: "#fff",
              display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 12px rgba(74,158,255,0.2)",
            }}>
              Full Stock Explorer — All {NSE_STOCKS.length}+ NSE Stocks →
            </Link>
          </div>
        </>
      )}

      {/* ═══ HEATMAP VIEW ═══ */}
      {!activeSector && view === "heatmap" && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <Flame size={16} style={{ color: "var(--danger)" }} />
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-primary)" }}>Market Heatmap</span>
            <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Size = relative market cap · Color = daily change</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, background: "var(--bg-card)", borderRadius: 16, padding: 16, border: "1px solid var(--border)" }}>
            {sectorData.map((sec) => {
              const sectorStocks = (NSE_STOCKS as StockEntry[]).filter(s => sec.sectors.includes(s.sector)).slice(0, 12);
              return (
                <div key={sec.key} style={{ flex: `${Math.max(sec.stockCount, 8)} 0 0`, minWidth: 120 }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, color: sec.color, marginBottom: 4, paddingLeft: 4 }}>{sec.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {sectorStocks.map(s => {
                      const sym = s.ticker.replace(".NS", "");
                      const lp = stockPrices[sym];
                      let h2 = 0;
                      for (let c = 0; c < s.ticker.length; c++) { h2 = ((h2 << 5) - h2) + s.ticker.charCodeAt(c); h2 |= 0; }
                      const chg = lp ? lp.changePercent : ((h2 % 800) - 400) / 100;
                      const intensity = Math.min(Math.abs(chg) / 4, 1);
                      const bg = chg >= 0 ? `rgba(52, 211, 153, ${0.12 + intensity * 0.45})` : `rgba(248, 113, 113, ${0.12 + intensity * 0.45})`;
                      const size = s.mcapType === "large" ? 72 : s.mcapType === "mid" ? 58 : 48;
                      return (
                        <Link key={sym} href={`/stocks/${sym.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} style={{ textDecoration: "none" }}>
                          <div style={{ width: size, height: size, borderRadius: 6, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.15s" }}
                            onMouseOver={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                            <span style={{ fontSize: "0.54rem", fontWeight: 700, color: chg >= 0 ? "#6ee7b7" : "#fca5a5" }}>{sym.slice(0, 6)}</span>
                            <span style={{ fontSize: "0.52rem", fontWeight: 800, color: chg >= 0 ? "var(--success)" : "var(--danger)" }}>{chg >= 0 ? "+" : ""}{chg.toFixed(1)}%</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 14 }}>
            {[{ bg: "rgba(248,113,113,0.5)", label: "Strong Decline" }, { bg: "rgba(248,113,113,0.15)", label: "Mild Decline" }, { bg: "rgba(52,211,153,0.15)", label: "Mild Gain" }, { bg: "rgba(52,211,153,0.5)", label: "Strong Gain" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 18, height: 10, borderRadius: 2, background: l.bg }} />
                <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ ALL STOCKS LIST VIEW ═══ */}
      {!activeSector && view === "list" && (
        <>
          {renderMcapFilters()}
          {renderStockTable()}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function AnalyzePage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTab>("stocks");
  const [resultView, setResultView] = useState<ResultView>("dashboard");

  // Stock state
  const [stockQuery, setStockQuery] = useState("");
  const [stockTicker, setStockTicker] = useState("");
  const [stockName, setStockName] = useState("");
  const [stockSuggestions, setStockSuggestions] = useState<StockEntry[]>([]);
  const [showStockDrop, setShowStockDrop] = useState(false);
  const [stockIdx, setStockIdx] = useState(-1);

  // Commodity state
  const [commQuery, setCommQuery] = useState("");
  const [commSymbol, setCommSymbol] = useState("");
  const [commSelected, setCommSelected] = useState<CommodityEntry | null>(null);
  const [commSuggestions, setCommSuggestions] = useState<CommodityEntry[]>([]);
  const [showCommDrop, setShowCommDrop] = useState(false);
  const [commIdx, setCommIdx] = useState(-1);
  const [commCategory, setCommCategory] = useState("All");

  // Crypto state
  const [cryptoQuery, setCryptoQuery] = useState("");
  const [cryptoSymbol, setCryptoSymbol] = useState("");
  const [cryptoSelected, setCryptoSelected] = useState<CryptoEntry | null>(null);
  const [cryptoSuggestions, setCryptoSuggestions] = useState<CryptoEntry[]>([]);
  const [showCryptoDrop, setShowCryptoDrop] = useState(false);
  const [cryptoIdx, setCryptoIdx] = useState(-1);
  const [cryptoCategory, setCryptoCategory] = useState("All");

  // Currency state
  const [currQuery, setCurrQuery] = useState("");
  const [currSymbol, setCurrSymbol] = useState("");
  const [currSelected, setCurrSelected] = useState<CurrencyEntry | null>(null);
  const [currSuggestions, setCurrSuggestions] = useState<CurrencyEntry[]>([]);
  const [showCurrDrop, setShowCurrDrop] = useState(false);
  const [currIdx, setCurrIdx] = useState(-1);
  const [currCategory, setCurrCategory] = useState("All");
  const [fxIntelPair, setFxIntelPair] = useState<CurrencyEntry | null>(null);

  // Mutual Fund state
  const [mfQuery, setMfQuery] = useState("");
  const [mfSymbol, setMfSymbol] = useState("");
  const [mfSelected, setMfSelected] = useState<MutualFundEntry | null>(null);
  const [mfSuggestions, setMfSuggestions] = useState<MutualFundEntry[]>([]);
  const [showMfDrop, setShowMfDrop] = useState(false);
  const [mfIdx, setMfIdx] = useState(-1);
  const [mfCategory, setMfCategory] = useState("All");

  // Debt/Bond state
  const [debtQuery, setDebtQuery] = useState("");
  const [debtSymbol, setDebtSymbol] = useState("");
  const [debtSelected, setDebtSelected] = useState<BondEntry | null>(null);
  const [debtSuggestions, setDebtSuggestions] = useState<BondEntry[]>([]);
  const [showDebtDrop, setShowDebtDrop] = useState(false);
  const [debtIdx, setDebtIdx] = useState(-1);
  const [debtCategory, setDebtCategory] = useState("All");

  // International state
  const [intlRegion, setIntlRegion] = useState<string>("All");
  const [intlExpandedIndex, setIntlExpandedIndex] = useState<string | null>(null);
  const [intlPrices, setIntlPrices] = useState<Record<string, { price: number; change: number; changePercent: number; name: string; currency: string }>>({});

  // Live prices via centralized hooks (auto-refresh, caching, fallbacks)
  const { data: liveStocks, loading: stocksHookLoading, refresh: refreshStocks } = useStockPrices();
  const { data: liveCommodities, loading: commoditiesHookLoading, refresh: refreshCommodities } = useCommodityPrices();
  const { data: liveForex, loading: forexHookLoading, refresh: refreshForex } = useForexRates();
  const { data: liveMF, loading: mfHookLoading, refresh: refreshMF } = useMFNavs();
  const { data: liveIntl, loading: intlHookLoading, refresh: refreshIntl } = useInternationalPrices();

  // Adapt hook data to existing prop shapes
  const stockPrices = useMemo(() => {
    const out: Record<string, { price: number; change: number; changePercent: number; name: string }> = {};
    for (const [sym, d] of Object.entries(liveStocks)) {
      out[sym] = { price: d.price, change: d.change, changePercent: d.changePercent, name: d.name || sym };
    }
    return out;
  }, [liveStocks]);

  const commodityPrices = useMemo(() => {
    const out: Record<string, { price: number; change: number; changePercent: number; name: string; currency: string }> = {};
    for (const [sym, d] of Object.entries(liveCommodities)) {
      out[sym] = { price: d.price, change: d.change, changePercent: d.changePercent, name: d.name || sym, currency: d.currency || "USD" };
    }
    return out;
  }, [liveCommodities]);

  const cryptoPrices = useMemo(() => {
    const out: Record<string, { usd: number; inr: number; change24h: number }> = {};
    // crypto is handled by CryptoPlatform now, but keep for backward compat
    return out;
  }, []);

  const forexPrices = useMemo(() => {
    const out: Record<string, { rate: number; change24h: number }> = {};
    for (const [sym, d] of Object.entries(liveForex)) {
      out[sym] = { rate: d.rate, change24h: d.change24h };
    }
    return out;
  }, [liveForex]);

  const mfPrices = useMemo(() => {
    const out: Record<string, { nav: number; date: string; name: string }> = {};
    for (const [sym, d] of Object.entries(liveMF)) {
      out[sym] = { nav: d.nav, date: d.date, name: d.name };
    }
    return out;
  }, [liveMF]);

  const pricesLoading = stocksHookLoading || commoditiesHookLoading;
  const forexLoading = forexHookLoading;

  // Shared state
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [scores, setScores] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(5);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [analysisType, setAnalysisType] = useState<MainTab>("stocks");

  // Splash screen & mobile state
  const [showSplash, setShowSplash] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"home" | "markets" | "ai" | "search" | "profile" | "tab">("home");
  type MobileNavView = "home" | "markets" | "ai" | "search" | "profile";

  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Check if splash was already shown this session + detect mobile
  useEffect(() => {
    const splashShown = sessionStorage.getItem("wt-splash-shown");
    if (splashShown) setShowSplash(false);
    // Detect mobile
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setRemaining(remainingAnalyses());
    setCurrentPlan(getPlan().plan);
    if (!document.getElementById("razorpay-script")) {
      const s = document.createElement("script");
      s.id = "razorpay-script"; s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowStockDrop(false); setShowCommDrop(false); setShowCryptoDrop(false); setShowCurrDrop(false); setShowMfDrop(false); setShowDebtDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Backward-compat aliases — hooks handle fetching/refresh automatically
  const fetchCryptoPrices = useCallback(() => {}, []);
  const fetchStockPrices = useCallback(() => refreshStocks(), [refreshStocks]);
  const fetchCommodityPrices = useCallback(() => refreshCommodities(), [refreshCommodities]);
  const fetchForexPrices = useCallback(() => refreshForex(), [refreshForex]);
  const fetchMfPrices = useCallback(() => refreshMF(), [refreshMF]);
  const fetchIntlPrices = useCallback(() => refreshIntl(), [refreshIntl]);

  const fetchIntlStockPrices = useCallback(async (indexSymbol: string) => {
    const stocks = getStocksForIndex(indexSymbol);
    if (stocks.length === 0) return;
    const symbols = stocks.map(s => s.yahooSymbol).join(",");
    try {
      const res = await fetch(`/api/live-prices?type=intl-stocks&symbols=${encodeURIComponent(symbols)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.prices && Object.keys(data.prices).length > 0) {
          setIntlPrices(prev => ({ ...prev, ...data.prices }));
        }
      }
    } catch { /* silent fail */ }
  }, []);

  // Merge international hook data into local intlPrices state
  useEffect(() => {
    if (Object.keys(liveIntl).length > 0) {
      const merged: Record<string, { price: number; change: number; changePercent: number; name: string; currency: string }> = {};
      for (const [sym, d] of Object.entries(liveIntl)) {
        merged[sym] = { price: d.price, change: d.change, changePercent: d.changePercent, name: d.name || sym, currency: d.currency || "USD" };
      }
      setIntlPrices(prev => ({ ...prev, ...merged }));
    }
  }, [liveIntl]);

  // Auto-refresh is now handled by centralized useMarketData hooks

  // Clear results when switching tabs
  function switchMainTab(tab: MainTab) {
    if (tab === "mutualfunds") { router.push("/mf-intelligence"); return; }
    if (tab === "commodities") { router.push("/commodity-intelligence"); return; }
    setMainTab(tab);
    setAnalysis(""); setScores(null); setError("");
  }

  /* ── Stock search ── */
  const handleStockSearch = useCallback((val: string) => {
    setStockQuery(val);
    if (val.trim().length >= 1) {
      const r = searchStocks(val); setStockSuggestions(r); setShowStockDrop(r.length > 0); setStockIdx(-1);
    } else { setStockSuggestions([]); setShowStockDrop(false); }
  }, []);

  function selectStock(s: StockEntry) {
    const slug = s.ticker.replace(".NS", "").replace(".BO", "").toLowerCase().replace(/[^a-z0-9]/g, "-");
    window.location.href = `/stocks/${slug}`;
  }

  /* ── Commodity search ── */
  const handleCommSearch = useCallback((val: string) => {
    setCommQuery(val);
    if (val.trim().length >= 1) {
      const r = searchCommodities(val); setCommSuggestions(r); setShowCommDrop(r.length > 0); setCommIdx(-1);
    } else { setCommSuggestions([]); setShowCommDrop(false); }
  }, []);

  function selectCommodity(c: CommodityEntry) {
    setCommQuery(c.name); setCommSymbol(c.symbol); setCommSelected(c); setShowCommDrop(false);
  }

  /* ── Crypto search ── */
  const handleCryptoSearch = useCallback((val: string) => {
    setCryptoQuery(val);
    if (val.trim().length >= 1) {
      const r = searchCrypto(val); setCryptoSuggestions(r); setShowCryptoDrop(r.length > 0); setCryptoIdx(-1);
    } else { setCryptoSuggestions([]); setShowCryptoDrop(false); }
  }, []);

  function selectCrypto(c: CryptoEntry) {
    setCryptoQuery(c.name); setCryptoSymbol(c.symbol); setCryptoSelected(c); setShowCryptoDrop(false);
  }

  /* ── Currency search ── */
  const handleCurrSearch = useCallback((val: string) => {
    setCurrQuery(val);
    if (val.trim().length >= 1) {
      const r = searchCurrencies(val); setCurrSuggestions(r); setShowCurrDrop(r.length > 0); setCurrIdx(-1);
    } else { setCurrSuggestions([]); setShowCurrDrop(false); }
  }, []);

  function selectCurrency(c: CurrencyEntry) {
    setCurrQuery(c.name); setCurrSymbol(c.symbol); setCurrSelected(c); setShowCurrDrop(false);
  }

  /* ── MF search ── */
  const handleMfSearch = useCallback((val: string) => {
    setMfQuery(val);
    if (val.trim().length >= 1) {
      const r = searchMutualFunds(val); setMfSuggestions(r); setShowMfDrop(r.length > 0); setMfIdx(-1);
    } else { setMfSuggestions([]); setShowMfDrop(false); }
  }, []);

  function selectMf(f: MutualFundEntry) {
    setMfQuery(f.name); setMfSymbol(f.symbol); setMfSelected(f); setShowMfDrop(false);
  }

  /* ── Debt search ── */
  const handleDebtSearch = useCallback((val: string) => {
    setDebtQuery(val);
    if (val.trim().length >= 1) {
      const r = searchBonds(val); setDebtSuggestions(r); setShowDebtDrop(r.length > 0); setDebtIdx(-1);
    } else { setDebtSuggestions([]); setShowDebtDrop(false); }
  }, []);

  function selectDebt(b: BondEntry) {
    setDebtQuery(b.name); setDebtSymbol(b.symbol); setDebtSelected(b); setShowDebtDrop(false);
  }

  /* ── Analyze ── */
  async function handleAnalyze(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!canAnalyze()) { setShowUpgrade(true); return; }

    let url = ""; let body: Record<string, string> = {};

    if (mainTab === "stocks") {
      const t = stockTicker || stockQuery.trim().toUpperCase();
      if (!t) return;
      const slug = t.replace(".NS", "").replace(".BO", "").toLowerCase().replace(/[^a-z0-9]/g, "-");
      window.location.href = `/stocks/${slug}`;
      return;
    } else if (mainTab === "commodities") {
      const sym = commSymbol || commQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-commodity";
      body = { symbol: sym, name: commSelected?.name || commQuery, category: commSelected?.category || "", exchange: commSelected?.exchange || "MCX", unit: commSelected?.unit || "" };
    } else if (mainTab === "crypto") {
      const sym = cryptoSymbol || cryptoQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-crypto";
      body = { symbol: sym, name: cryptoSelected?.name || cryptoQuery, category: cryptoSelected?.category || "", pair: cryptoSelected?.pair || sym + "/INR" };
    } else if (mainTab === "currency") {
      const sym = currSymbol || currQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-currency";
      body = { symbol: sym, name: currSelected?.name || currQuery, category: currSelected?.category || "", pair: currSelected?.pair || sym, base: currSelected?.base || "", quote: currSelected?.quote || "" };
    } else if (mainTab === "mutualfunds") {
      const sym = mfSymbol || mfQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-mf";
      body = { symbol: sym, name: mfSelected?.name || mfQuery, category: mfSelected?.category || "", amc: mfSelected?.amc || "", riskLevel: mfSelected?.riskLevel || "" };
    } else {
      const sym = debtSymbol || debtQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-debt";
      body = { symbol: sym, name: debtSelected?.name || debtQuery, category: debtSelected?.category || "", type: debtSelected?.type || "", tenure: debtSelected?.tenure || "", coupon: debtSelected?.coupon || "", rating: debtSelected?.rating || "", issuer: debtSelected?.issuer || "" };
    }

    setLoading(true); setError(""); setAnalysis(""); setScores(null); setAnalysisType(mainTab);

    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      incrementUsage(); setRemaining(remainingAnalyses());
      setAnalysis(data.analysis); setScores(data.scores); setResultView("dashboard");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  /* ── Payment ── */
  async function handlePayment(plan: string) {
    setPaymentLoading(plan); setPaymentSuccess("");
    try {
      const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount, currency: data.currency,
        name: "White Tiger", description: `${data.planName} Plan — ${data.analyses} analyses/month`,
        order_id: data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await fetch("/api/payment/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...response, plan }) });
          const vd = await v.json();
          if (vd.verified) { activatePlan(plan, response.razorpay_payment_id); setRemaining(remainingAnalyses()); setCurrentPlan(plan); setPaymentSuccess(data.planName); setTimeout(() => setShowUpgrade(false), 2000); }
          else setError("Payment verification failed.");
          setPaymentLoading("");
        },
        modal: { ondismiss: () => setPaymentLoading("") },
        theme: { color: "#2962ff" },
      };
      new window.Razorpay(options).open();
    } catch (err) { setError(err instanceof Error ? err.message : "Payment failed"); setPaymentLoading(""); }
  }

  // Filtered lists for browse
  const filteredComm = commCategory === "All" ? MCX_COMMODITIES : MCX_COMMODITIES.filter(c => c.category === commCategory);
  const filteredCrypto = cryptoCategory === "All" ? CRYPTO_LIST : CRYPTO_LIST.filter(c => c.category === cryptoCategory);
  const filteredCurr = currCategory === "All" ? CURRENCY_LIST : CURRENCY_LIST.filter(c => c.category === currCategory);
  const filteredMf = mfCategory === "All" ? MUTUAL_FUNDS : MUTUAL_FUNDS.filter(f => f.category === mfCategory);
  const filteredDebt = debtCategory === "All" ? BONDS_LIST : BONDS_LIST.filter(b => b.category === debtCategory);

  const analysisName = analysisType === "stocks" ? (stockName || stockTicker) : analysisType === "commodities" ? (commSelected?.name || commSymbol) : analysisType === "crypto" ? (cryptoSelected?.name || cryptoSymbol) : analysisType === "currency" ? (currSelected?.name || currSymbol) : analysisType === "mutualfunds" ? (mfSelected?.name || mfSymbol) : (debtSelected?.name || debtSymbol);
  const analysisSymbol = analysisType === "stocks" ? stockTicker : analysisType === "commodities" ? commSymbol : analysisType === "crypto" ? cryptoSymbol : analysisType === "currency" ? currSymbol : analysisType === "mutualfunds" ? mfSymbol : debtSymbol;

  const rating = scores ? getRatingBadge((scores as Record<string, unknown>).investmentRating as string || (scores as Record<string, unknown>).rating as string || "") : analysis ? getRatingBadge(analysis) : null;
  const outlook = scores ? getOutlookBadge((scores as Record<string, unknown>).outlook as string || "") : null;

  const sc = (scores as Record<string, unknown>)?.scores as Record<string, number> | undefined;

  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "100vh" }}>
      {/* ── Splash Screen ── */}
      {showSplash && (
        <SplashScreen onComplete={() => {
          setShowSplash(false);
          sessionStorage.setItem("wt-splash-shown", "1");
        }} />
      )}

      {/* ── Floating AI Button (desktop only, mobile has nav) ── */}
      {!isMobile && <FloatingAI />}

      {/* ══════ MOBILE EXPERIENCE ══════ */}
      {isMobile && mobileView !== "tab" && (
        <>
          {/* Mobile Views */}
          {mobileView === "home" && (
            <MobileHome
              marketItems={[
                ...(stockPrices.NIFTY50 ? [{ name: "NIFTY 50", symbol: "NIFTY", price: stockPrices.NIFTY50.price.toLocaleString("en-IN"), change: stockPrices.NIFTY50.changePercent }] : []),
                ...(stockPrices.SENSEX ? [{ name: "SENSEX", symbol: "SENSEX", price: stockPrices.SENSEX.price.toLocaleString("en-IN"), change: stockPrices.SENSEX.changePercent }] : []),
                ...(commodityPrices.GOLD ? [{ name: "Gold", symbol: "GOLD", price: `$${commodityPrices.GOLD.price.toFixed(2)}`, change: commodityPrices.GOLD.changePercent }] : []),
                ...(forexPrices.USDINR ? [{ name: "USD/INR", symbol: "USDINR", price: `₹${forexPrices.USDINR.rate.toFixed(2)}`, change: forexPrices.USDINR.change24h }] : []),
                ...(commodityPrices.CRUDEOIL ? [{ name: "Crude Oil", symbol: "OIL", price: `$${commodityPrices.CRUDEOIL.price.toFixed(2)}`, change: commodityPrices.CRUDEOIL.changePercent }] : []),
                ...(stockPrices.BANKNIFTY ? [{ name: "Bank Nifty", symbol: "BANKNIFTY", price: stockPrices.BANKNIFTY.price.toLocaleString("en-IN"), change: stockPrices.BANKNIFTY.changePercent }] : []),
              ]}
              onTabSelect={(tab) => { switchMainTab(tab); setMobileView("tab"); }}
              onSearch={() => setMobileView("search")}
            />
          )}
          {mobileView === "markets" && (
            <MobileMarkets
              onTabSelect={(tab) => { switchMainTab(tab); setMobileView("tab"); }}
              onBack={() => setMobileView("home")}
            />
          )}
          {mobileView === "search" && (
            <MobileSearch onBack={() => setMobileView("home")} />
          )}
          {mobileView === "ai" && (
            <div style={{ minHeight: "100vh", background: "var(--bg-obsidian)", padding: "60px 20px 90px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(74,158,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Zap size={24} color="#4A9EFF" />
              </div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>AI Assistant</h2>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto 24px" }}>
                Select any stock, crypto, or asset to get instant AI-powered analysis.
              </p>
              <button onClick={() => setMobileView("search")} style={{
                padding: "14px 28px", borderRadius: 14, border: "none",
                background: "#4A9EFF", color: "#fff", fontWeight: 700,
                fontSize: "0.92rem", cursor: "pointer",
              }}>
                Search & Analyze
              </button>
            </div>
          )}
          {mobileView === "profile" && (
            <div style={{ minHeight: "100vh", background: "var(--bg-obsidian)", padding: "60px 20px 90px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Users size={24} color="var(--text-muted)" />
              </div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>Profile</h2>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
                {currentPlan === "free" ? "Free Plan · " : `${currentPlan.toUpperCase()} Plan · `}{remaining} analyses left
              </p>
              {currentPlan === "free" && (
                <button onClick={() => setShowUpgrade(true)} style={{
                  padding: "14px 28px", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #4A9EFF, #1E5FBF)", color: "#fff",
                  fontWeight: 700, fontSize: "0.92rem", cursor: "pointer",
                  boxShadow: "0 6px 24px rgba(74,158,255,0.25)",
                }}>
                  Upgrade Plan
                </button>
              )}
            </div>
          )}

          {/* Mobile Bottom Nav */}
          <BottomNav
            active={(mobileView as string) === "tab" ? "home" : mobileView as MobileNavView}
            onChange={(v) => {
              if (v === "home" || v === "markets" || v === "search" || v === "ai" || v === "profile") {
                setMobileView(v);
              }
            }}
          />
        </>
      )}

      {/* ══════ DESKTOP + MOBILE-TAB EXPERIENCE ══════ */}
      {(!isMobile || mobileView === "tab") && (
      <>

      {/* Mobile back button when viewing a specific tab */}
      {isMobile && mobileView === "tab" && (
        <div style={{
          padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
          position: "sticky", top: 0, zIndex: 45,
          background: "var(--bg-obsidian)",
          borderBottom: "0.5px solid rgba(232,237,245,0.04)",
        }}>
          <button onClick={() => setMobileView("home")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#4A9EFF", fontSize: "0.85rem", fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4, padding: 0,
          }}>
            ← Back
          </button>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>
            {mainTab === "mutualfunds" ? "Mutual Funds" : mainTab === "realestate" ? "Real Estate" : mainTab === "currency" ? "Forex" : mainTab === "debt" ? "Bonds" : mainTab}
          </span>
        </div>
      )}

      {/* ── Scrolling Ticker ── */}
      <ScrollingTicker items={[
        ...(Object.keys(stockPrices).length > 0
          ? Object.entries(stockPrices).slice(0, 10).map(([sym, d]) => ({ name: d.name, symbol: sym, price: `₹${d.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, change: d.changePercent }))
          : []
        ),
        ...(Object.keys(commodityPrices).length > 0
          ? ["GOLD", "CRUDEOIL", "SILVER", "NATURALGAS"].filter(s => commodityPrices[s]).map(s => ({
              name: commodityPrices[s].name, symbol: s,
              price: `$${commodityPrices[s].price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
              change: commodityPrices[s].changePercent,
            }))
          : []
        ),
        ...(Object.keys(cryptoPrices).length > 0
          ? ["BTC", "ETH", "SOL", "BNB", "XRP"].filter(s => cryptoPrices[s]).map(s => ({
              name: s === "BTC" ? "Bitcoin" : s === "ETH" ? "Ethereum" : s === "SOL" ? "Solana" : s === "BNB" ? "BNB" : "XRP",
              symbol: s,
              price: `$${cryptoPrices[s].usd?.toLocaleString("en-US") || "0"}`,
              change: cryptoPrices[s].change24h || 0,
            }))
          : []
        ),
        ...(Object.keys(forexPrices).length > 0
          ? ["USDINR", "EURUSD", "GBPUSD"].filter(s => forexPrices[s]).map(s => ({
              name: s, symbol: s,
              price: s.includes("INR") ? `₹${forexPrices[s].rate.toFixed(2)}` : `$${forexPrices[s].rate.toFixed(4)}`,
              change: forexPrices[s].change24h || 0,
            }))
          : []
        ),
      ]} />

      {/* ── Mobile PWA Styles ── */}
      <style>{`
        .wt-tabs-scroll { display: flex; gap: 2px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .wt-tabs-scroll::-webkit-scrollbar { display: none; }
        .wt-mobile-bottom { display: none; }
        .wt-desktop-right { display: flex; }
        .wt-brand-text { display: inline; }
        .wt-main-content { padding: 24px; }
        @media (max-width: 1024px) {
          .wt-tabs-scroll { margin-left: 0 !important; }
          .wt-brand-text { display: none !important; }
        }
        @media (max-width: 768px) {
          .wt-desktop-right { display: none !important; }
          .wt-tabs-scroll { display: none !important; }
          .wt-mobile-bottom {
            display: flex !important;
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
            background: var(--bg-obsidian, #0A0E1A);
            border-top: 0.5px solid rgba(232,237,245,0.08);
            padding: 4px 0 env(safe-area-inset-bottom, 6px);
            justify-content: space-around;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }
          .wt-main-content { padding: 12px !important; padding-bottom: 80px !important; }
          .navbar { padding: 0 12px !important; height: 52px !important; }
          /* Mobile: flex layout goes vertical */
          .wt-main-content > div[style*="display: flex"][style*="gap: 20"] {
            flex-direction: column !important;
          }
          /* Hide commodity/forex sidebars on mobile */
          div[style*="width: 270, minWidth: 270"] { display: none !important; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <div className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <Image src="/logo.png" alt="White Tiger" width={30} height={30} style={{ borderRadius: 6 }} />
            <span className="wt-brand-text" style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>White Tiger</span>
          </Link>

          {/* Main Tabs — scrollable on mobile */}
          <div className="wt-tabs-scroll" style={{ marginLeft: 12, background: "var(--bg-secondary)", borderRadius: 10, padding: 3 }}>
            {([
              { id: "stocks" as MainTab, label: "Stocks", icon: <TrendingUp size={14} />, color: "#4A9EFF" },
              { id: "commodities" as MainTab, label: "Commodities", icon: <Flame size={14} />, color: "#FBBF24" },
              { id: "crypto" as MainTab, label: "Crypto", icon: <Bitcoin size={14} />, color: "#f7931a" },
              { id: "currency" as MainTab, label: "Forex", icon: <DollarSign size={14} />, color: "#34D399" },
              { id: "mutualfunds" as MainTab, label: "MF", icon: <PiggyBank size={14} />, color: "#a78bfa" },
              { id: "debt" as MainTab, label: "Bonds", icon: <Shield size={14} />, color: "#34D399" },
              { id: "international" as MainTab, label: "Global", icon: <Globe size={14} />, color: "#4A9EFF" },
              { id: "realestate" as MainTab, label: "Real Estate", icon: <Building2 size={14} />, color: "#C5A572" },
              { id: "derivatives" as MainTab, label: "F&O", icon: <Layers size={14} />, color: "#F87171" },
              { id: "wealth" as MainTab, label: "Wealth", icon: <Target size={14} />, color: "#7BB8FF" },
              { id: "tax" as MainTab, label: "Tax", icon: <FileText size={14} />, color: "#4A9EFF" },
            ]).map(t => (
              <button key={t.id} onClick={() => switchMainTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0,
                border: mainTab === t.id ? "0.5px solid rgba(232,237,245,0.08)" : "0.5px solid transparent",
                background: mainTab === t.id ? "var(--bg-slate)" : "transparent",
                color: mainTab === t.id ? t.color : "var(--text-muted)",
                fontWeight: mainTab === t.id ? 600 : 500, fontSize: "0.82rem", cursor: "pointer",
                boxShadow: "none",
                transition: "all 0.2s ease-out",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
        </div>

        <div className="wt-desktop-right" style={{ alignItems: "center", gap: 14, flexShrink: 0 }}>
          {currentPlan !== "free" && <span className="badge badge-blue" style={{ textTransform: "uppercase" }}>{currentPlan}</span>}
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>{remaining}</span> left
          </span>
          {currentPlan === "free" && (
            <button onClick={() => setShowUpgrade(true)} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
              <Zap size={13} /> Upgrade
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="wt-mobile-bottom">
        {([
          { id: "stocks" as MainTab, icon: <TrendingUp size={20} />, label: "Stocks" },
          { id: "crypto" as MainTab, icon: <Bitcoin size={20} />, label: "Crypto" },
          { id: "currency" as MainTab, icon: <DollarSign size={20} />, label: "Forex" },
          { id: "derivatives" as MainTab, icon: <Layers size={20} />, label: "F&O" },
          { id: null, icon: <BarChart3 size={20} />, label: "More" },
        ] as { id: MainTab | null; icon: React.ReactNode; label: string }[]).map(t => (
          <button key={t.label} onClick={() => {
            if (t.id === null) { setShowMoreMenu(true); }
            else { switchMainTab(t.id); setShowMoreMenu(false); }
          }} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "none", border: "none", cursor: "pointer",
            color: t.id !== null && mainTab === t.id ? "#4A9EFF" : (t.id === null && showMoreMenu ? "#4A9EFF" : "var(--text-muted)"),
            fontSize: "0.6rem", fontWeight: (t.id !== null && mainTab === t.id) || (t.id === null && showMoreMenu) ? 700 : 500,
            padding: "6px 0", minWidth: 56,
            transition: "all 0.2s",
            position: "relative",
          }}>
            {/* Active indicator dot */}
            {t.id !== null && mainTab === t.id && (
              <div style={{
                position: "absolute", top: 0, width: 4, height: 4,
                borderRadius: "50%", background: "#4A9EFF",
              }} />
            )}
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── More Menu Bottom Sheet ── */}
      {showMoreMenu && (
        <>
          <div onClick={() => setShowMoreMenu(false)} style={{
            position: "fixed", inset: 0, zIndex: 998,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
            background: "var(--bg-midnight, #14213D)",
            borderRadius: "20px 20px 0 0",
            border: "0.5px solid rgba(232,237,245,0.08)",
            borderBottom: "none",
            padding: "8px 16px calc(16px + env(safe-area-inset-bottom, 8px))",
            animation: "mobileSlideUp 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 16px" }} />
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              All Markets
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {([
                { id: "stocks" as MainTab, icon: <TrendingUp size={22} />, label: "Stocks", color: "#4A9EFF" },
                { id: "commodities" as MainTab, icon: <Flame size={22} />, label: "Commodities", color: "#FBBF24" },
                { id: "crypto" as MainTab, icon: <Bitcoin size={22} />, label: "Crypto", color: "#f7931a" },
                { id: "currency" as MainTab, icon: <DollarSign size={22} />, label: "Forex", color: "#34D399" },
                { id: "mutualfunds" as MainTab, icon: <PiggyBank size={22} />, label: "Mutual Funds", color: "#a78bfa" },
                { id: "debt" as MainTab, icon: <Shield size={22} />, label: "Bonds", color: "#34D399" },
                { id: "international" as MainTab, icon: <Globe size={22} />, label: "Global", color: "#4A9EFF" },
                { id: "realestate" as MainTab, icon: <Building2 size={22} />, label: "Real Estate", color: "#C5A572" },
                { id: "derivatives" as MainTab, icon: <Layers size={22} />, label: "F&O", color: "#F87171" },
                { id: "wealth" as MainTab, icon: <Target size={22} />, label: "Wealth", color: "#7BB8FF" },
                { id: "tax" as MainTab, icon: <FileText size={22} />, label: "Tax", color: "#4A9EFF" },
              ]).map(t => (
                <button key={t.id} onClick={() => { switchMainTab(t.id); setShowMoreMenu(false); }} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "14px 4px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: mainTab === t.id ? `${t.color}15` : "rgba(255,255,255,0.02)",
                  transition: "all 0.2s",
                }}>
                  <div style={{
                    color: mainTab === t.id ? t.color : "var(--text-muted)",
                    transition: "color 0.2s",
                  }}>{t.icon}</div>
                  <span style={{
                    fontSize: "0.62rem", fontWeight: mainTab === t.id ? 700 : 500,
                    color: mainTab === t.id ? t.color : "rgba(255,255,255,0.4)",
                    textAlign: "center", lineHeight: 1.2,
                  }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Main Content ── */}
      <div className="wt-main-content" style={{ maxWidth: 1920, margin: "0 auto", display: "flex", gap: 20 }}>
        {/* Left: Intelligence Column (desktop only, hidden on crypto) */}
        {mainTab !== "crypto" && (
        <div className="intel-sidebar" style={{ width: 300, minWidth: 280, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 20 }}>
            <IntelligenceColumn tab={mainTab} />
          </div>
        </div>
        )}

        {/* Center: Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* ══════ STOCKS TAB ══════ */}
        {mainTab === "stocks" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search stocks — company name or ticker (e.g. Reliance, TCS)"
                      value={stockQuery} onChange={e => handleStockSearch(e.target.value)}
                      onFocus={() => { if (stockSuggestions.length > 0) setShowStockDrop(true); }}
                      onKeyDown={e => {
                        if (!showStockDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setStockIdx(i => Math.min(i + 1, stockSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setStockIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && stockIdx >= 0) { e.preventDefault(); selectStock(stockSuggestions[stockIdx]); }
                        else if (e.key === "Escape") setShowStockDrop(false);
                      }}
                    />
                  </div>
                  {showStockDrop && (
                    <div className="search-dropdown">
                      {stockSuggestions.map((s, i) => (
                        <div key={s.ticker} className={`search-item ${i === stockIdx ? "active" : ""}`} onClick={() => selectStock(s)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{s.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.sector}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent)" }}>{s.ticker.replace(".NS", "")}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>NSE</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!stockTicker && !stockQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "stocks" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {stockTicker && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{stockName}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{stockTicker}</span>
                  <button onClick={() => { setStockTicker(""); setStockName(""); setStockQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ COMMODITIES TAB ══════ */}
        {mainTab === "commodities" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search commodities — Gold, Crude Oil, Aluminium, Brent, NYMEX..."
                      value={commQuery} onChange={e => handleCommSearch(e.target.value)}
                      onFocus={() => { if (commSuggestions.length > 0) setShowCommDrop(true); }}
                      onKeyDown={e => {
                        if (!showCommDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setCommIdx(i => Math.min(i + 1, commSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setCommIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && commIdx >= 0) { e.preventDefault(); selectCommodity(commSuggestions[commIdx]); }
                        else if (e.key === "Escape") setShowCommDrop(false);
                      }}
                    />
                  </div>
                  {showCommDrop && (
                    <div className="search-dropdown">
                      {commSuggestions.map((c, i) => (
                        <div key={c.symbol + i} className={`search-item ${i === commIdx ? "active" : ""}`} onClick={() => { const slug = c.name.toLowerCase().replace(/\s+/g, "-").replace(/[()&]/g, ""); window.location.href = `/commodities/${slug}`; }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.category} · {c.unit}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent)" }}>{c.symbol}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{c.exchange}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!commSymbol && !commQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "commodities" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {commSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{commSelected.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{commSelected.symbol} · {commSelected.exchange}</span>
                  <button onClick={() => { setCommSymbol(""); setCommSelected(null); setCommQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              {/* Koyfin badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <Globe size={12} /> International market insights powered by Koyfin analytics
              </div>
            </div>

            {/* Category filter + Browse grid */}
            {!analysis && !loading && (
              <div>
                <MarketPulseBar tab="commodities" />
                <LiveChartGrid tab="commodities" />
                <MarketTicker items={
                  Object.keys(commodityPrices).length > 0
                    ? ["GOLD", "SILVER", "CRUDEOIL", "COPPER", "NATURALGAS"].filter(s => commodityPrices[s]).map(s => ({
                        label: s === "CRUDEOIL" ? "CRUDE OIL" : s === "NATURALGAS" ? "NAT GAS" : s,
                        value: `$${commodityPrices[s].price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
                        change: commodityPrices[s].changePercent,
                      }))
                    : [{ label: "Loading...", value: "—" }]
                } />
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  {/* ── Commodity Market Intelligence Sidebar ── */}
                  <div style={{ width: 270, minWidth: 270, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="card" style={{ padding: 16, background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)", color: "#fff", border: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff6d00", boxShadow: "0 0 8px #ff6d0080" }} />
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2 }}>Commodity Intelligence</span>
                      </div>
                      {[
                        { label: "Brent Crude", value: "$74.85", sub: "OPEC+ cuts extended", color: "#ff6d00" },
                        { label: "Gold Spot", value: "$2,415", sub: "Safe-haven demand", color: "#f9a825" },
                        { label: "DXY Index", value: "103.8", sub: "Dollar strength moderate", color: "#ef5350" },
                        { label: "Baltic Dry Index", value: "1,845", sub: "Freight normalizing", color: "#00e676" },
                        { label: "US 10Y Yield", value: "4.25%", sub: "Range-bound", color: "#ff9800" },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: "6px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: item.color }}>{item.value}</span>
                          </div>
                          <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.35)" }}>{item.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div className="card" style={{ padding: 14 }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--text-muted)", marginBottom: 10 }}>Live Alerts</div>
                      {[
                        { icon: "🛢️", text: "OPEC+ extends cuts through Q3 2026", tag: "OPEC" },
                        { icon: "📊", text: "EIA: Crude inventories draw 4.2M bbl", tag: "EIA" },
                        { icon: "🌊", text: "Red Sea disruptions — freight +18%", tag: "RISK" },
                        { icon: "🇨🇳", text: "China PMI 51.2 — expansion continues", tag: "DEMAND" },
                        { icon: "⚡", text: "LME copper stocks at 15-year low", tag: "SUPPLY" },
                      ].map((a, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: i < 4 ? "1px solid var(--border-light)" : "none" }}>
                          <span style={{ fontSize: "0.78rem" }}>{a.icon}</span>
                          <div>
                            <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: "#e6510015", color: "#e65100" }}>{a.tag}</span>
                            <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.4, marginTop: 2 }}>{a.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="card" style={{ padding: 14 }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--text-muted)", marginBottom: 10 }}>Commodity Heatmap</div>
                      {[
                        { name: "Crude Oil", chg: "+1.2%", c: "#2e7d32" }, { name: "Gold", chg: "+0.8%", c: "#2e7d32" },
                        { name: "Silver", chg: "-0.5%", c: "#c62828" }, { name: "Copper", chg: "+2.1%", c: "#2e7d32" },
                        { name: "Natural Gas", chg: "-1.8%", c: "#c62828" }, { name: "Aluminium", chg: "+0.4%", c: "#2e7d32" },
                      ].map((ct, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 5 ? "1px solid var(--border-light)" : "none" }}>
                          <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>{ct.name}</span>
                          <span style={{ fontSize: "0.68rem", fontWeight: 800, color: ct.c }}>{ct.chg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* ── Commodity Cards Grid ── */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {COMMODITY_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCommCategory(cat)} style={{
                      padding: "6px 16px", borderRadius: 20, border: "1px solid",
                      borderColor: commCategory === cat ? "var(--accent)" : "var(--border)",
                      background: commCategory === cat ? "var(--accent)" : "#fff",
                      color: commCategory === cat ? "#fff" : "var(--text-muted)",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                  {filteredComm.map(c => {
                    const liveComm = commodityPrices[c.symbol] || commodityPrices[c.symbol.toUpperCase()];
                    const isPositive = liveComm ? liveComm.changePercent >= 0 : c.name.charCodeAt(0) % 3 !== 0;
                    const catColor = c.category === "Energy" ? "#e65100" : c.category === "Precious Metals" ? "#f9a825" : c.category === "Base Metals" ? "#0d47a1" : c.category === "Agriculture" ? "#2e7d32" : "#7c3aed";
                    const slug = c.name.toLowerCase().replace(/\s+/g, "-").replace(/[()&]/g, "");
                    return (
                      <div key={c.symbol + c.exchange} onClick={() => { window.location.href = `/commodities/${slug}`; }} className="card fx-pair-card" style={{
                        padding: 0, textAlign: "left", cursor: "pointer", overflow: "hidden",
                        border: "1px solid var(--border)", background: "#fff", transition: "all 0.3s", position: "relative",
                        borderTop: `3px solid ${catColor}`,
                      }}>
                        <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 3, color: "var(--text-primary)" }}>{c.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>{c.symbol}</span>
                              <span className="badge badge-gray" style={{ padding: "1px 6px", fontSize: "0.58rem" }}>{c.exchange}</span>
                            </div>
                          </div>
                          <MiniSparkline seed={c.symbol + c.exchange} positive={isPositive} color={catColor} width={64} height={28} />
                        </div>
                        <div style={{ padding: "4px 16px 8px" }}>
                          {liveComm ? (
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1a1a2e" }}>${liveComm.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isPositive ? "#00c853" : "#ef5350" }}>
                                {isPositive ? "▲" : "▼"} {Math.abs(liveComm.changePercent).toFixed(2)}%
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 10 }}>
                              <div>
                                <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Category</div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: catColor }}>{c.category}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Unit</div>
                                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)" }}>{c.unit}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: "8px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-light)" }}>
                          <span className="badge badge-gray" style={{ padding: "2px 8px", fontSize: "0.58rem" }}>{c.category}</span>
                          <span style={{ fontSize: "0.62rem", fontWeight: 700, color: catColor }}>View Analysis →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                  </div>{/* close commodity cards wrapper */}
                </div>{/* close flex layout */}
              </div>
            )}
          </div>
        )}

        {/* ══════ CRYPTO TAB ══════ */}
        {mainTab === "crypto" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search crypto — Bitcoin, Ethereum, Solana, PEPE..."
                      value={cryptoQuery} onChange={e => handleCryptoSearch(e.target.value)}
                      onFocus={() => { if (cryptoSuggestions.length > 0) setShowCryptoDrop(true); }}
                      onKeyDown={e => {
                        if (!showCryptoDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setCryptoIdx(i => Math.min(i + 1, cryptoSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setCryptoIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && cryptoIdx >= 0) { e.preventDefault(); selectCrypto(cryptoSuggestions[cryptoIdx]); }
                        else if (e.key === "Escape") setShowCryptoDrop(false);
                      }}
                    />
                  </div>
                  {showCryptoDrop && (
                    <div className="search-dropdown">
                      {cryptoSuggestions.map((c, i) => (
                        <div key={c.symbol} className={`search-item ${i === cryptoIdx ? "active" : ""}`} onClick={() => selectCrypto(c)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.category}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent)" }}>{c.symbol}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{c.pair}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!cryptoSymbol && !cryptoQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "crypto" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {cryptoSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{cryptoSelected.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{cryptoSelected.symbol} · {cryptoSelected.pair}</span>
                  <button onClick={() => { setCryptoSymbol(""); setCryptoSelected(null); setCryptoQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              {/* CoinDCX badge + refresh */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  <Coins size={12} /> Live prices powered by CoinDCX & CoinGecko
                </div>
                <button onClick={fetchCryptoPrices} disabled={pricesLoading} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem" }}>
                  <RefreshCw size={11} className={pricesLoading ? "spinning" : ""} /> Refresh
                </button>
              </div>
            </div>

            {!analysis && !loading && (
              <CryptoPlatform />
            )}
          </div>
        )}

        {/* ══════ CURRENCY TAB ══════ */}
        {mainTab === "currency" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search forex — USD/INR, EUR/USD, Yen, Dollar..."
                      value={currQuery} onChange={e => handleCurrSearch(e.target.value)}
                      onFocus={() => { if (currSuggestions.length > 0) setShowCurrDrop(true); }}
                      onKeyDown={e => {
                        if (!showCurrDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setCurrIdx(i => Math.min(i + 1, currSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setCurrIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && currIdx >= 0) { e.preventDefault(); selectCurrency(currSuggestions[currIdx]); }
                        else if (e.key === "Escape") setShowCurrDrop(false);
                      }}
                    />
                  </div>
                  {showCurrDrop && (
                    <div className="search-dropdown">
                      {currSuggestions.map((c, i) => (
                        <div key={c.symbol} className={`search-item ${i === currIdx ? "active" : ""}`} onClick={() => selectCurrency(c)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.category}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent)" }}>{c.pair}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!currSymbol && !currQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "currency" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {currSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{currSelected.pair}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{currSelected.name}</span>
                  <button onClick={() => { setCurrSymbol(""); setCurrSelected(null); setCurrQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <DollarSign size={12} /> RBI reference rates · NSE currency futures · Central bank policy analysis
              </div>
            </div>

            {!analysis && !loading && (
              <div>
                {/* Forex Market Ticker */}
                {Object.keys(forexPrices).length > 0 ? (
                  <MarketTicker items={[
                    { label: "USD/INR", value: `₹${(forexPrices.USDINR?.rate || 0).toFixed(2)}`, change: forexPrices.USDINR?.change24h || 0 },
                    { label: "EUR/INR", value: `₹${(forexPrices.EURINR?.rate || 0).toFixed(2)}`, change: forexPrices.EURINR?.change24h || 0 },
                    { label: "GBP/INR", value: `₹${(forexPrices.GBPINR?.rate || 0).toFixed(2)}`, change: forexPrices.GBPINR?.change24h || 0 },
                    { label: "EUR/USD", value: `$${(forexPrices.EURUSD?.rate || 0).toFixed(4)}`, change: forexPrices.EURUSD?.change24h || 0 },
                    { label: "USD/JPY", value: `¥${(forexPrices.USDJPY?.rate || 0).toFixed(2)}`, change: forexPrices.USDJPY?.change24h || 0 },
                  ]} />
                ) : (
                  <MarketTicker items={[{ label: "Loading forex rates...", value: "—" }]} />
                )}
                {/* FX Intelligence Platform */}
                <FXPlatform
                  pair={currSelected?.pair || "USD/INR"}
                  base={currSelected?.base || "USD"}
                  quote={currSelected?.quote || "INR"}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CURRENCY_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setCurrCategory(cat)} style={{
                        padding: "6px 16px", borderRadius: 20, border: "1px solid",
                        borderColor: currCategory === cat ? "var(--accent)" : "var(--border)",
                        background: currCategory === cat ? "var(--accent)" : "#fff",
                        color: currCategory === cat ? "#fff" : "var(--text-muted)",
                        fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                      }}>{cat}</button>
                    ))}
                  </div>
                  <button onClick={fetchForexPrices} disabled={forexLoading} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem" }}>
                    <RefreshCw size={12} className={forexLoading ? "spinning" : ""} /> Refresh Rates
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                  {filteredCurr.map(c => {
                    const fxPrice = forexPrices[c.symbol];
                    const isPositive = fxPrice ? fxPrice.change24h >= 0 : c.name.charCodeAt(0) % 2 === 0;
                    const changeVal = fxPrice ? fxPrice.change24h : (isPositive ? 0.12 : -0.08);
                    const currSymbolDisplay = c.quote === "INR" ? "₹" : c.quote === "JPY" ? "¥" : c.quote === "Index" ? "" : "$";
                    return (
                      <button key={c.symbol} onClick={() => { selectCurrency(c); setFxIntelPair(c); window.location.href = `/currency/${c.symbol.toLowerCase()}`; }} className="card fx-pair-card" style={{
                        padding: 0, textAlign: "left", cursor: "pointer", overflow: "hidden",
                        border: currSymbol === c.symbol ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: "#fff", transition: "all 0.3s", position: "relative",
                      }}>
                        {/* Top accent bar */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${isPositive ? "#00c853" : "#ef5350"}, ${isPositive ? "#00c85360" : "#ef535060"}, transparent)` }} />

                        <div style={{ padding: "16px 16px 8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--accent)", marginBottom: 1 }}>{c.pair}</div>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{c.name}</div>
                            </div>
                            <MiniSparkline seed={c.symbol} positive={isPositive} width={72} height={30} />
                          </div>

                          {/* Rate Display — large and prominent */}
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1a1a2e", letterSpacing: -0.5 }}>
                              {fxPrice ? `${currSymbolDisplay}${fxPrice.rate.toFixed(c.quote === "JPY" ? 2 : c.pair === "DXY" ? 2 : 4)}` : "—"}
                            </span>
                            <span style={{
                              fontSize: "0.72rem", fontWeight: 700,
                              color: isPositive ? "#00c853" : "#ef5350",
                              display: "flex", alignItems: "center", gap: 2,
                            }}>
                              {isPositive ? "▲" : "▼"} {Math.abs(changeVal).toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {/* Bottom: Category + View Link */}
                        <div style={{ padding: "6px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="badge badge-gray" style={{ padding: "2px 8px", fontSize: "0.6rem" }}>{c.category}</span>
                          <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--accent)", display: "flex", alignItems: "center", gap: 3 }}>
                            View Analysis →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ MUTUAL FUNDS TAB ══════ */}
        {mainTab === "mutualfunds" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search funds — SBI Bluechip, Parag Parikh, ELSS, Index..."
                      value={mfQuery} onChange={e => handleMfSearch(e.target.value)}
                      onFocus={() => { if (mfSuggestions.length > 0) setShowMfDrop(true); }}
                      onKeyDown={e => {
                        if (!showMfDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setMfIdx(i => Math.min(i + 1, mfSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setMfIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && mfIdx >= 0) { e.preventDefault(); selectMf(mfSuggestions[mfIdx]); }
                        else if (e.key === "Escape") setShowMfDrop(false);
                      }}
                    />
                  </div>
                  {showMfDrop && (
                    <div className="search-dropdown">
                      {mfSuggestions.map((f, i) => (
                        <div key={f.symbol} className={`search-item ${i === mfIdx ? "active" : ""}`} onClick={() => { const slug = f.name.toLowerCase().replace(/\s+/g, "-").replace(/[()&]/g, ""); window.location.href = `/mf-intelligence/${slug}`; }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{f.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{f.amc} · {f.category}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span className={`badge ${f.riskLevel === "Low" ? "badge-green" : f.riskLevel === "Moderate" ? "badge-yellow" : "badge-red"}`} style={{ fontSize: "0.62rem" }}>{f.riskLevel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!mfSymbol && !mfQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "mutualfunds" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {mfSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{mfSelected.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{mfSelected.amc}</span>
                  <span className={`badge ${mfSelected.riskLevel === "Low" ? "badge-green" : mfSelected.riskLevel === "Moderate" ? "badge-yellow" : "badge-red"}`}>{mfSelected.riskLevel} Risk</span>
                  <button onClick={() => { setMfSymbol(""); setMfSelected(null); setMfQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <PiggyBank size={12} /> Morningstar-grade analysis · SIP strategy · Tax-efficient investing
              </div>
            </div>

            {!analysis && !loading && (
              <div>
                <MFPlatform />
              </div>
            )}
          </div>
        )}

        {/* ══════ DEBT / BONDS TAB ══════ */}
        {mainTab === "debt" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search bonds — G-Sec, T-Bills, Corporate Bonds, PPF, SGB..."
                      value={debtQuery} onChange={e => handleDebtSearch(e.target.value)}
                      onFocus={() => { if (debtSuggestions.length > 0) setShowDebtDrop(true); }}
                      onKeyDown={e => {
                        if (!showDebtDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setDebtIdx(i => Math.min(i + 1, debtSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setDebtIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && debtIdx >= 0) { e.preventDefault(); selectDebt(debtSuggestions[debtIdx]); }
                        else if (e.key === "Escape") setShowDebtDrop(false);
                      }}
                    />
                  </div>
                  {showDebtDrop && (
                    <div className="search-dropdown">
                      {debtSuggestions.map((b, i) => (
                        <div key={b.symbol} className={`search-item ${i === debtIdx ? "active" : ""}`} onClick={() => selectDebt(b)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{b.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.issuer} · {b.tenure}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#00897b" }}>{b.yieldApprox}</div>
                            <span className="badge badge-green" style={{ fontSize: "0.6rem" }}>{b.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!debtSymbol && !debtQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "debt" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {debtSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-blue">{debtSelected.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{debtSelected.issuer} · {debtSelected.tenure}</span>
                  <span className="badge badge-green">{debtSelected.rating}</span>
                  <span className="badge badge-purple">{debtSelected.yieldApprox}</span>
                  <button onClick={() => { setDebtSymbol(""); setDebtSelected(null); setDebtQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <Shield size={12} /> RBI monetary policy · CCIL trading data · Credit analysis · Tax-efficient investing
              </div>
            </div>

            {!analysis && !loading && (
              <BondsPlatform />
            )}
          </div>
        )}

        {/* ── International Markets Tab ── */}
        {mainTab === "international" && (
          <div>
            <MarketPulseBar tab="international" />
            <LiveChartGrid tab="international" />

            {/* Section Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  🏆 Top 25 Stock Markets by Market Capitalization
                </h2>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 }}>
                  Ranked by total market cap · Click any country to see top stocks
                </p>
              </div>
            </div>

            {/* Country Filter Pills */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", overflowX: "auto", paddingBottom: 4 }}>
              <button onClick={() => { setIntlRegion("All"); setIntlExpandedIndex(null); }} style={{
                padding: "6px 16px", borderRadius: 20, border: "1px solid",
                borderColor: intlRegion === "All" ? "#1a73e8" : "var(--border)",
                background: intlRegion === "All" ? "linear-gradient(135deg, #1a73e8, #4285f4)" : "#fff",
                color: intlRegion === "All" ? "#fff" : "var(--text-muted)",
                fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                boxShadow: intlRegion === "All" ? "0 2px 8px rgba(26,115,232,0.3)" : "none",
                whiteSpace: "nowrap",
              }}>🌍 All (25)</button>
              {INTL_COUNTRIES.map(c => {
                const idx = INTL_INDICES.find(i => i.country === c);
                return (
                  <button key={c} onClick={() => { setIntlRegion(c); setIntlExpandedIndex(null); }} style={{
                    padding: "6px 14px", borderRadius: 20, border: "1px solid",
                    borderColor: intlRegion === c ? "#1a73e8" : "var(--border)",
                    background: intlRegion === c ? "linear-gradient(135deg, #1a73e8, #4285f4)" : "#fff",
                    color: intlRegion === c ? "#fff" : "var(--text-secondary)",
                    fontSize: "0.73rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                    boxShadow: intlRegion === c ? "0 2px 8px rgba(26,115,232,0.3)" : "none",
                    display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                  }}>{idx?.flag} {c}</button>
                );
              })}
            </div>

            {/* Country-wise Index Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {getIndicesByCountry(intlRegion).map(idx => {
                const p = intlPrices[idx.yahooSymbol];
                const isExpanded = intlExpandedIndex === idx.symbol;
                const stocks = getStocksForIndex(idx.symbol);
                const changeColor = p && p.change >= 0 ? "#00c853" : "#ff1744";
                const changeIcon = p && p.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />;

                return (
                  <div key={idx.symbol} className="card" style={{
                    overflow: "hidden", border: isExpanded ? "2px solid #1a73e8" : "1px solid var(--border)",
                    transition: "all 0.25s", boxShadow: isExpanded ? "0 4px 20px rgba(26,115,232,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    {/* Index Header */}
                    <button onClick={() => {
                      const next = isExpanded ? null : idx.symbol;
                      setIntlExpandedIndex(next);
                      if (next) fetchIntlStockPrices(next);
                    }} style={{
                      width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: isExpanded ? "linear-gradient(135deg, rgba(26,115,232,0.04), rgba(66,133,244,0.08))" : "#fff",
                      border: "none", cursor: "pointer", transition: "background 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ position: "relative" }}>
                          <span style={{ fontSize: "1.6rem" }}>{idx.flag}</span>
                          <span style={{
                            position: "absolute", top: -6, right: -10,
                            fontSize: "0.55rem", fontWeight: 800, color: "#fff",
                            background: idx.rank <= 3 ? "linear-gradient(135deg, #f59e0b, #d97706)" : idx.rank <= 10 ? "#2962ff" : "#607d8b",
                            borderRadius: 6, padding: "1px 5px", lineHeight: 1.4,
                            border: "1.5px solid #fff",
                          }}>#{idx.rank}</span>
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{idx.name}</div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                            {idx.country} · {idx.symbol}
                            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#2962ff", background: "rgba(41,98,255,0.08)", padding: "1px 6px", borderRadius: 4 }}>
                              MCap {idx.marketCap}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {p ? (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                              {p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", color: changeColor, fontSize: "0.82rem", fontWeight: 700 }}>
                              {changeIcon}
                              {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)} ({p.changePercent >= 0 ? "+" : ""}{p.changePercent.toFixed(2)}%)
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                            <div className="shimmer" style={{ width: 80, height: 16, borderRadius: 4 }} />
                            <div className="shimmer" style={{ width: 60, height: 12, borderRadius: 4 }} />
                          </div>
                        )}
                        <ChevronDown size={18} style={{
                          color: "var(--text-muted)", transition: "transform 0.25s",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        }} />
                      </div>
                    </button>

                    {/* Expanded Stocks */}
                    {isExpanded && stocks.length > 0 && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", background: "rgba(0,0,0,0.01)" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                          Top Constituents
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                          {stocks.map(stk => {
                            const sp = intlPrices[stk.yahooSymbol];
                            const sChangeColor = sp && sp.change >= 0 ? "#00c853" : "#ff1744";
                            return (
                              <div key={stk.ticker} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "10px 14px", borderRadius: 10, background: "#fff",
                                border: "1px solid var(--border)", transition: "box-shadow 0.15s",
                              }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>{stk.name}</div>
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{stk.ticker} · {stk.sector}</div>
                                </div>
                                {sp ? (
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", fontVariantNumeric: "tabular-nums" }}>
                                      {sp.currency === "INR" ? "₹" : sp.currency === "GBP" ? "£" : sp.currency === "EUR" ? "€" : sp.currency === "JPY" ? "¥" : sp.currency === "HKD" ? "HK$" : sp.currency === "KRW" ? "₩" : sp.currency === "CNY" ? "¥" : sp.currency === "BRL" ? "R$" : sp.currency === "AUD" ? "A$" : sp.currency === "SGD" ? "S$" : sp.currency === "TWD" ? "NT$" : sp.currency === "CHF" ? "CHF " : "$"}
                                      {sp.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: sChangeColor }}>
                                      {sp.changePercent >= 0 ? "+" : ""}{sp.changePercent.toFixed(2)}%
                                    </div>
                                  </div>
                                ) : (
                                  <div className="shimmer" style={{ width: 60, height: 14, borderRadius: 4 }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {isExpanded && stocks.length === 0 && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        No constituent data available for this index
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Refresh hint */}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <RefreshCw size={12} /> Prices update every 2 min · Data from Google Finance · Charts by TradingView
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--danger-bg)", border: "1px solid #ffd4d4", borderRadius: "var(--radius)", marginBottom: 20 }}>
            <AlertCircle size={16} color="var(--danger)" />
            <span style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{error}</span>
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }}><X size={14} /></button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, background: "var(--accent-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={18} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  Analyzing {analysisType === "stocks" ? (stockName || stockTicker) : analysisType === "commodities" ? (commSelected?.name || commSymbol) : analysisType === "crypto" ? (cryptoSelected?.name || cryptoSymbol) : analysisType === "currency" ? (currSelected?.name || currSymbol) : (mfSelected?.name || mfSymbol)}...
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {analysisType === "stocks" && "Running 9 modules — DCF, geopolitics, supply chain, ownership, management..."}
                  {analysisType === "commodities" && "Scanning supply-demand, OPEC dynamics, trade routes, Koyfin correlations..."}
                  {analysisType === "crypto" && "Analyzing tokenomics, on-chain data, CoinDCX metrics, regulatory landscape..."}
                  {analysisType === "currency" && "Analyzing central bank policies, carry trades, RBI stance, macro fundamentals..."}
                  {analysisType === "mutualfunds" && "Analyzing NAV performance, portfolio quality, fund manager track record, SIP strategy..."}
                  {analysisType === "debt" && "Analyzing yield curve, RBI policy impact, credit risk, duration sensitivity, tax efficiency..."}
                </div>
              </div>
            </div>
            {[220, 360, 300, 180, 340].map((w, i) => (
              <div key={i} className="shimmer" style={{ height: 14, borderRadius: 6, marginBottom: 10, width: `${w}px`, maxWidth: "100%" }} />
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {analysis && !loading && (
          <div ref={resultsRef}>
            {/* Header */}
            <div className="card" style={{ padding: "16px 24px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {analysisType === "stocks" ? "Stock Research" : analysisType === "commodities" ? "Commodity Research" : analysisType === "crypto" ? "Crypto Research" : analysisType === "currency" ? "Forex Research" : analysisType === "mutualfunds" ? "Mutual Fund Research" : "Debt & Bond Research"}
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{analysisName}</div>
                  </div>
                  <div style={{ height: 28, width: 1, background: "var(--border)" }} />
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{analysisSymbol}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {rating && <span className={`badge ${rating.cls}`}>{rating.label}</span>}
                  {outlook && <span className={`badge ${outlook.cls}`}>{outlook.label}</span>}
                  <span className="badge badge-blue">
                    {analysisType === "commodities" ? "Koyfin Insights" : analysisType === "crypto" ? "CoinDCX" : analysisType === "currency" ? "RBI · NSE Forex" : analysisType === "mutualfunds" ? "Morningstar Grade" : analysisType === "debt" ? "CCIL · RBI Policy" : "AI Research"}
                  </span>
                </div>
              </div>
            </div>

            {/* View tabs */}
            <div className="tab-bar">
              {[
                { id: "dashboard" as ResultView, label: "Dashboard", icon: <BarChart3 size={14} /> },
                { id: "report" as ResultView, label: "Full Report", icon: <FileText size={14} /> },
              ].map(tab => (
                <button key={tab.id} className={`tab-item ${resultView === tab.id ? "active" : ""}`} onClick={() => setResultView(tab.id)}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Dashboard for all types */}
            {resultView === "dashboard" && scores && sc && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ── Price Summary Cards ── */}
                {(() => {
                  const s = scores as Record<string, unknown>;
                  if (analysisType === "stocks") {
                    const cards = [
                      { label: "Current Price", value: s.currentPrice ? `₹${Number(s.currentPrice).toLocaleString("en-IN")}` : "—", color: "var(--text-primary)", cls: "accent" },
                      { label: "Fair Value (DCF)", value: s.fairValue ? `₹${Number(s.fairValue).toLocaleString("en-IN")}` : "—", color: "var(--accent)", cls: "purple" },
                      { label: "12M Target", value: s.targetPrice ? `₹${Number(s.targetPrice).toLocaleString("en-IN")}` : "—", color: "var(--success)", cls: "success" },
                      { label: "Upside", value: s.upside ? `${Number(s.upside) > 0 ? "+" : ""}${s.upside}%` : "—", color: Number(s.upside) >= 0 ? "var(--success)" : "var(--danger)", cls: Number(s.upside) >= 0 ? "success" : "danger" },
                    ];
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                        {cards.map(c => (
                          <div key={c.label} className={`dash-card-gradient ${c.cls}`} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (analysisType === "commodities") {
                    const cards = [
                      { label: "Current Price", value: s.currentPrice ? `₹${Number(s.currentPrice).toLocaleString("en-IN")}` : "—", color: "var(--text-primary)", cls: "warning" },
                      { label: "3M Target", value: s.targetPrice3M ? `₹${Number(s.targetPrice3M).toLocaleString("en-IN")}` : "—", color: "var(--accent)", cls: "accent" },
                      { label: "12M Target", value: s.targetPrice12M ? `₹${Number(s.targetPrice12M).toLocaleString("en-IN")}` : "—", color: "var(--success)", cls: "success" },
                      { label: "Upside", value: s.upside ? `${Number(s.upside) > 0 ? "+" : ""}${s.upside}%` : "—", color: Number(s.upside) >= 0 ? "var(--success)" : "var(--danger)", cls: Number(s.upside) >= 0 ? "success" : "danger" },
                    ];
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                        {cards.map(c => (
                          <div key={c.label} className={`dash-card-gradient ${c.cls}`} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (analysisType === "currency") {
                    const cards = [
                      { label: "Current Rate", value: s.currentRate ? String(Number(s.currentRate).toFixed(4)) : "—", color: "var(--text-primary)" },
                      { label: "3M Target", value: s.target3M ? String(Number(s.target3M).toFixed(4)) : "—", color: "var(--accent)" },
                      { label: "12M Target", value: s.target12M ? String(Number(s.target12M).toFixed(4)) : "—", color: "var(--success)" },
                      { label: "52W Change", value: s.change52W ? `${Number(s.change52W) > 0 ? "+" : ""}${s.change52W}%` : "—", color: Number(s.change52W) >= 0 ? "var(--success)" : "var(--danger)" },
                    ];
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                        {cards.map(c => (
                          <div key={c.label} className="dashboard-card" style={{ textAlign: "center", padding: 16 }}>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (analysisType === "mutualfunds") {
                    const ret = s.returns as Record<string, number> | undefined;
                    const cards = [
                      { label: "Current NAV", value: s.currentNAV ? `₹${Number(s.currentNAV).toLocaleString("en-IN")}` : "—", color: "var(--text-primary)" },
                      { label: "AUM", value: (s.aum as string) || "—", color: "var(--accent)" },
                      { label: "3Y Return", value: ret?.return3Y ? `${ret.return3Y}%` : "—", color: "var(--success)" },
                      { label: "Expense Ratio", value: s.expenseRatio ? `${s.expenseRatio}%` : "—", color: "var(--text-secondary)" },
                    ];
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                        {cards.map(c => (
                          <div key={c.label} className="dashboard-card" style={{ textAlign: "center", padding: 16 }}>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (analysisType === "debt") {
                    const yc = s.yieldComparison as Record<string, number> | undefined;
                    const rbiP = s.rbiPolicy as Record<string, unknown> | undefined;
                    const cards = [
                      { label: "Current Price", value: s.currentPrice ? `₹${Number(s.currentPrice).toFixed(2)}` : "—", color: "var(--text-primary)" },
                      { label: "Yield (YTM)", value: s.ytm ? `${s.ytm}%` : "—", color: "#00897b" },
                      { label: "Modified Duration", value: s.modifiedDuration ? `${s.modifiedDuration}` : "—", color: "var(--accent)" },
                      { label: "Credit Rating", value: (s.creditRating as string) || "—", color: "#7c3aed" },
                    ];
                    return (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                          {cards.map(c => (
                            <div key={c.label} className="dash-card-gradient teal" style={{ textAlign: "center" }}>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                            </div>
                          ))}
                        </div>
                        {rbiP && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">RBI Policy Dashboard</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                              {[
                                { label: "Repo Rate", value: rbiP.repoRate != null ? `${rbiP.repoRate}%` : "—" },
                                { label: "Policy Stance", value: (rbiP.stance as string) || "—" },
                                { label: "Expected Change", value: (rbiP.expectedRateChange as string) || "—" },
                                { label: "CPI Inflation", value: rbiP.inflationRate != null ? `${rbiP.inflationRate}%` : "—" },
                              ].map(item => (
                                <div key={item.label} style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: String(item.value).includes("HAWKISH") ? "var(--danger)" : String(item.value).includes("DOVISH") || String(item.value).includes("ACCOMMODATIVE") ? "var(--success)" : "var(--text-primary)" }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {yc && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">Yield Comparison</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                              {[
                                { label: "This Instrument", value: s.ytm ? `${s.ytm}%` : "—", color: "#00897b" },
                                { label: "Bank FD Rate", value: yc.fdRate ? `${yc.fdRate}%` : "—", color: "var(--text-secondary)" },
                                { label: "G-Sec Benchmark", value: yc.gsecBenchmark ? `${yc.gsecBenchmark}%` : "—", color: "var(--accent)" },
                                { label: "Debt MF Return", value: yc.debtMfReturn ? `${yc.debtMfReturn}%` : "—", color: "#7c3aed" },
                              ].map(item => (
                                <div key={item.label} style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: item.color }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  }
                  /* crypto */
                  const cards = [
                    { label: "Price (USD)", value: s.currentPriceUSD ? `$${Number(s.currentPriceUSD).toLocaleString("en-US")}` : "—", color: "var(--text-primary)" },
                    { label: "Price (INR)", value: s.currentPriceINR ? `₹${Number(s.currentPriceINR).toLocaleString("en-IN")}` : "—", color: "var(--accent)" },
                    { label: "Market Cap", value: (s.marketCap as string) || "—", color: "var(--text-secondary)" },
                    { label: "Upside", value: s.upside ? `${Number(s.upside) > 0 ? "+" : ""}${s.upside}%` : "—", color: Number(s.upside) >= 0 ? "var(--success)" : "var(--danger)" },
                  ];
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                      {cards.map(c => (
                        <div key={c.label} className="dashboard-card" style={{ textAlign: "center", padding: 16 }}>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* ── TradingView Live Chart ── */}
                <TradingViewChart symbol={analysisSymbol || ""} type={analysisType} />

                {/* ── Supply-Demand / On-Chain / Financials Card ── */}
                {(() => {
                  const s = scores as Record<string, unknown>;
                  if (analysisType === "commodities" && s.supplyDemand) {
                    const sd = s.supplyDemand as Record<string, string>;
                    return (
                      <div className="dashboard-card">
                        <div className="dashboard-card-title">Supply-Demand Balance <span className="badge badge-purple" style={{ marginLeft: 8 }}>Koyfin</span></div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                          {[
                            { label: "Global Production", value: sd.globalProduction || "—" },
                            { label: "Global Demand", value: sd.globalDemand || "—" },
                            { label: "Inventory Status", value: sd.inventoryStatus || "—" },
                            { label: "Market Balance", value: sd.marketBalance || "—" },
                          ].map(item => (
                            <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: item.value === "DEFICIT" || item.value === "LOW" ? "var(--danger)" : item.value === "SURPLUS" || item.value === "HIGH" ? "var(--success)" : "var(--text-primary)" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (analysisType === "crypto" && s.onChain) {
                    const oc = s.onChain as Record<string, string>;
                    return (
                      <div className="dashboard-card">
                        <div className="dashboard-card-title">On-Chain Analytics <span className="badge badge-blue" style={{ marginLeft: 8 }}>CoinDCX</span></div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                          {[
                            { label: "Active Addresses", value: oc.activeAddresses || "—" },
                            { label: "TVL", value: oc.tvl || "—" },
                            { label: "Daily Txns", value: oc.dailyTransactions || "—" },
                            { label: "Network Health", value: oc.networkHealth || "—" },
                          ].map(item => (
                            <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: item.value === "STRONG" ? "var(--success)" : item.value === "WEAK" ? "var(--danger)" : "var(--text-primary)" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (analysisType === "currency" && s.centralBanks) {
                    const cb = s.centralBanks as Record<string, unknown>;
                    return (
                      <div className="dashboard-card">
                        <div className="dashboard-card-title">Central Bank Dashboard</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                          {[
                            { label: "Base CB Rate", value: cb.baseCBRate != null ? `${cb.baseCBRate}%` : "—" },
                            { label: "Quote CB Rate", value: cb.quoteCBRate != null ? `${cb.quoteCBRate}%` : "—" },
                            { label: "Rate Differential", value: cb.rateDifferential != null ? `${Number(cb.rateDifferential).toFixed(2)}%` : "—" },
                            { label: "Base Stance", value: (cb.baseStance as string) || "—" },
                            { label: "Quote Stance", value: (cb.quoteStance as string) || "—" },
                          ].map(item => (
                            <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: String(item.value).includes("HAWKISH") ? "var(--danger)" : String(item.value).includes("DOVISH") ? "var(--success)" : "var(--text-primary)" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (analysisType === "mutualfunds" && s.returns) {
                    const ret = s.returns as Record<string, number>;
                    const sip = s.sipReturns as Record<string, number> | undefined;
                    const risk = s.risk as Record<string, unknown> | undefined;
                    return (
                      <>
                        <div className="dashboard-card">
                          <div className="dashboard-card-title">Performance Returns (CAGR)</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                            {[
                              { label: "1Y Return", value: ret.return1Y ? `${ret.return1Y}%` : "—", color: (ret.return1Y || 0) >= 0 ? "var(--success)" : "var(--danger)" },
                              { label: "3Y Return", value: ret.return3Y ? `${ret.return3Y}%` : "—", color: (ret.return3Y || 0) >= 0 ? "var(--success)" : "var(--danger)" },
                              { label: "5Y Return", value: ret.return5Y ? `${ret.return5Y}%` : "—", color: (ret.return5Y || 0) >= 0 ? "var(--success)" : "var(--danger)" },
                              { label: "10Y Return", value: ret.return10Y ? `${ret.return10Y}%` : "—", color: (ret.return10Y || 0) >= 0 ? "var(--success)" : "var(--danger)" },
                              { label: "Benchmark 3Y", value: ret.benchmarkReturn3Y ? `${ret.benchmarkReturn3Y}%` : "—", color: "var(--text-muted)" },
                              { label: "Category Avg 3Y", value: ret.categoryAvgReturn3Y ? `${ret.categoryAvgReturn3Y}%` : "—", color: "var(--text-muted)" },
                            ].map(item => (
                              <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: item.color }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {sip && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">SIP Returns (₹10,000/month)</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                              {[
                                { label: "1 Year SIP", value: sip.sip1Y ? `₹${Number(sip.sip1Y).toLocaleString("en-IN")}` : "—" },
                                { label: "3 Year SIP", value: sip.sip3Y ? `₹${Number(sip.sip3Y).toLocaleString("en-IN")}` : "—" },
                                { label: "5 Year SIP", value: sip.sip5Y ? `₹${Number(sip.sip5Y).toLocaleString("en-IN")}` : "—" },
                              ].map(item => (
                                <div key={item.label} style={{ padding: 14, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--success)" }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {risk && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">Risk Metrics</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                              {[
                                { label: "Sharpe Ratio", value: risk.sharpeRatio != null ? String(risk.sharpeRatio) : "—" },
                                { label: "Std Deviation", value: risk.standardDeviation != null ? `${risk.standardDeviation}%` : "—" },
                                { label: "Beta", value: risk.beta != null ? String(risk.beta) : "—" },
                                { label: "Max Drawdown", value: risk.maxDrawdown != null ? `${risk.maxDrawdown}%` : "—" },
                              ].map(item => (
                                <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  }
                  if (analysisType === "stocks" && s.financials) {
                    const f = s.financials as Record<string, number>;
                    const own = s.ownership as Record<string, number> | undefined;
                    return (
                      <>
                        <div className="dashboard-card">
                          <div className="dashboard-card-title">Financial Snapshot</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                            {[
                              { label: "Revenue CAGR", value: f.revenueCagr ? `${f.revenueCagr}%` : "—" },
                              { label: "EBITDA Margin", value: f.ebitdaMargin ? `${f.ebitdaMargin}%` : "—" },
                              { label: "D/E Ratio", value: f.debtToEquity != null ? String(f.debtToEquity) : "—" },
                              { label: "ROE", value: f.roe ? `${f.roe}%` : "—" },
                            ].map(item => (
                              <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {own && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">Ownership Structure</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                              {[
                                { label: "Promoter", pct: own.promoter, color: "var(--accent)" },
                                { label: "FII/FPI", pct: own.fii, color: "var(--success)" },
                                { label: "DII", pct: own.dii, color: "var(--warning)" },
                                { label: "Retail", pct: own.retail, color: "var(--text-muted)" },
                                { label: "Pledge", pct: own.pledge, color: "var(--danger)" },
                              ].map(item => (
                                <div key={item.label} style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: item.color }}>{item.pct != null ? `${item.pct}%` : "—"}</div>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>{item.label}</div>
                                  <div style={{ height: 4, background: "var(--border-light)", borderRadius: 4, marginTop: 6 }}>
                                    <div style={{ height: "100%", width: `${Math.min(item.pct || 0, 100)}%`, background: item.color, borderRadius: 4 }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  }
                  return null;
                })()}

                {/* ── Correlation Card (Crypto/Commodity) ── */}
                {(() => {
                  const s = scores as Record<string, unknown>;
                  if (analysisType === "crypto" && (s.btcCorrelation != null || s.ethCorrelation != null)) {
                    return (
                      <div className="dashboard-card">
                        <div className="dashboard-card-title">Market Correlations <span className="badge badge-blue" style={{ marginLeft: 8 }}>CoinDCX</span></div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {[
                            { label: "BTC Correlation", value: s.btcCorrelation as number },
                            { label: "ETH Correlation", value: s.ethCorrelation as number },
                          ].map(item => (
                            <div key={item.label} style={{ padding: 14, background: "var(--bg-secondary)", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>{item.label}</span>
                              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>{item.value != null ? item.value.toFixed(2) : "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Score meters — adaptive */}
                <div className="dashboard-card">
                  <div className="dashboard-card-title">
                    {analysisType === "stocks" ? "Risk & Quality Scores" : analysisType === "commodities" ? "Commodity Scores" : analysisType === "crypto" ? "Token Scores" : analysisType === "currency" ? "Currency Scores" : analysisType === "mutualfunds" ? "Fund Quality Scores" : "Bond Quality Scores"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {Object.entries(sc).map(([key, val]) => {
                      const labelMap: Record<string, string> = {
                        geopoliticalRisk: "Geopolitical", commodityRisk: "Commodity Risk", supplyChainStability: "Supply Chain",
                        managementQuality: "Management", foreignOwnershipRisk: "FII Risk", tradeRouteRisk: "Trade Route",
                        pricingPower: "Pricing Power", indiaGrowthPotential: "India Growth",
                        supplyRisk: "Supply Risk", demandStrength: "Demand", volatility: "Volatility",
                        indiaExposure: "India Exposure", usdCorrelation: "USD Correlation", seasonality: "Seasonality",
                        technicalStrength: "Technicals",
                        technology: "Technology", tokenomics: "Tokenomics", adoption: "Adoption",
                        regulatoryRisk: "Regulatory Risk", liquidity: "Liquidity", developerActivity: "Dev Activity",
                        communityStrength: "Community", indiaSuitability: "India Fit",
                        centralBankDivergence: "CB Divergence", carryAttractiveness: "Carry Trade",
                        macroFundamentals: "Macro Strength", liquiditySentiment: "Liquidity",
                        indiaImpact: "India Impact",
                        consistency: "Consistency", riskManagement: "Risk Mgmt",
                        fundManagerQuality: "Fund Manager", portfolioQuality: "Portfolio",
                        expenseEfficiency: "Expense Ratio", alphaGeneration: "Alpha",
                        downsideProtection: "Downside Prot.", sipSuitability: "SIP Fit",
                        creditQuality: "Credit Quality", yieldAttractiveness: "Yield",
                        interestRateSensitivity: "Rate Sensitivity", taxEfficiency: "Tax Efficiency",
                        inflationProtection: "Inflation Prot.", reinvestmentRisk: "Reinvest Risk",
                        portfolioFit: "Portfolio Fit", liquidityScore: "Liquidity",
                      };
                      const iconMap: Record<string, React.ReactNode> = {
                        geopoliticalRisk: <Globe size={14} />, commodityRisk: <Package size={14} />,
                        supplyChainStability: <Layers size={14} />, managementQuality: <Users size={14} />,
                        foreignOwnershipRisk: <Shield size={14} />, tradeRouteRisk: <Anchor size={14} />,
                        pricingPower: <TrendingUp size={14} />, indiaGrowthPotential: <Target size={14} />,
                        supplyRisk: <Factory size={14} />, demandStrength: <TrendingUp size={14} />,
                        volatility: <Activity size={14} />, indiaExposure: <Target size={14} />,
                        usdCorrelation: <Coins size={14} />, seasonality: <BarChart3 size={14} />,
                        technicalStrength: <BarChart3 size={14} />,
                        technology: <Layers size={14} />, tokenomics: <Coins size={14} />,
                        adoption: <Users size={14} />, regulatoryRisk: <Shield size={14} />,
                        liquidity: <Droplets size={14} />, developerActivity: <Activity size={14} />,
                        communityStrength: <Users size={14} />, indiaSuitability: <Target size={14} />,
                        centralBankDivergence: <Globe size={14} />, carryAttractiveness: <Coins size={14} />,
                        macroFundamentals: <BarChart3 size={14} />, liquiditySentiment: <Droplets size={14} />,
                        indiaImpact: <Target size={14} />,
                        consistency: <BarChart3 size={14} />, riskManagement: <Shield size={14} />,
                        fundManagerQuality: <Users size={14} />, portfolioQuality: <Layers size={14} />,
                        expenseEfficiency: <Coins size={14} />, alphaGeneration: <TrendingUp size={14} />,
                        downsideProtection: <Shield size={14} />, sipSuitability: <PiggyBank size={14} />,
                        creditQuality: <Shield size={14} />, yieldAttractiveness: <TrendingUp size={14} />,
                        interestRateSensitivity: <Activity size={14} />, taxEfficiency: <Coins size={14} />,
                        inflationProtection: <Shield size={14} />, reinvestmentRisk: <Activity size={14} />,
                        portfolioFit: <Layers size={14} />, liquidityScore: <Droplets size={14} />,
                      };
                      const invertKeys = ["geopoliticalRisk", "commodityRisk", "foreignOwnershipRisk", "tradeRouteRisk", "supplyRisk", "volatility", "regulatoryRisk", "usdCorrelation", "interestRateSensitivity", "reinvestmentRisk"];
                      return (
                        <ScoreGauge key={key} score={typeof val === "number" ? val : 0} label={labelMap[key] || key} icon={iconMap[key] || <BarChart3 size={14} />} invertColor={invertKeys.includes(key)} />
                      );
                    })}
                  </div>
                </div>

                {/* Scenarios */}
                {(() => {
                  const scenariosRaw = (scores as Record<string, unknown>).scenarios as Record<string, Record<string, unknown>> | undefined;
                  if (!scenariosRaw) return null;
                  const s = scenariosRaw;
                  const rows = [
                    { label: "Bull", target: s.bull?.target ? `₹${Number(s.bull.target).toLocaleString("en-IN")}` : (s.bull?.targetINR ? `₹${Number(s.bull.targetINR).toLocaleString("en-IN")}` : `$${s.bull?.targetUSD || 0}`), probability: Number(s.bull?.probability || 0), trigger: String(s.bull?.trigger || ""), color: "var(--success)", bg: "var(--success-bg)" },
                    { label: "Base", target: s.base?.target ? `₹${Number(s.base.target).toLocaleString("en-IN")}` : (s.base?.targetINR ? `₹${Number(s.base.targetINR).toLocaleString("en-IN")}` : `$${s.base?.targetUSD || 0}`), probability: Number(s.base?.probability || 0), trigger: String(s.base?.trigger || ""), color: "var(--warning)", bg: "var(--warning-bg)" },
                    { label: "Bear", target: s.bear?.target ? `₹${Number(s.bear.target).toLocaleString("en-IN")}` : (s.bear?.targetINR ? `₹${Number(s.bear.targetINR).toLocaleString("en-IN")}` : `$${s.bear?.targetUSD || 0}`), probability: Number(s.bear?.probability || 0), trigger: String(s.bear?.trigger || ""), color: "var(--danger)", bg: "var(--danger-bg)" },
                  ];
                  return <ScenarioTable scenarios={rows} />;
                })()}

                {/* Extra info tags */}
                {((scores as Record<string, unknown>).topProducers || (scores as Record<string, unknown>).competitors || (scores as Record<string, unknown>).topImportCountries) ? (
                  <div className="dashboard-card">
                    <div className="dashboard-card-title">Key Intelligence</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <TagList title="Top Producers" items={((scores as Record<string, unknown>).topProducers as string[]) || []} icon={<Factory size={12} color="var(--accent)" />} />
                      <TagList title="Top Consumers" items={((scores as Record<string, unknown>).topConsumers as string[]) || []} icon={<Users size={12} color="var(--warning)" />} />
                      <TagList title="Import Countries" items={((scores as Record<string, unknown>).topImportCountries as string[]) || []} icon={<Globe size={12} color="var(--success)" />} />
                      <TagList title="Indian Companies" items={((scores as Record<string, unknown>).indianCompaniesExposed as string[]) || []} icon={<TrendingUp size={12} color="var(--accent)" />} />
                      <TagList title="Competitors" items={((scores as Record<string, unknown>).competitors as string[]) || []} icon={<Target size={12} color="var(--danger)" />} />
                      <TagList title="Correlated" items={((scores as Record<string, unknown>).correlatedCommodities as string[]) || ((scores as Record<string, unknown>).ecosystemTokens as string[]) || []} icon={<Activity size={12} color="var(--warning)" />} />
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {resultView === "dashboard" && !scores && (
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)" }}>Dashboard data not available — view Full Report.</p>
              </div>
            )}

            {resultView === "report" && (
              <div className="card" style={{ padding: "24px 32px" }}>
                <div className="prose-light">{renderMarkdown(analysis)}</div>
              </div>
            )}

            <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--warning-bg)", border: "1px solid #ffe0b2", borderRadius: "var(--radius)", fontSize: "0.76rem", color: "#bf6c00" }}>
              AI-generated for informational purposes only. Not SEBI-registered investment advice. Always do your own research.
            </div>
          </div>
        )}

        {/* Empty state — Stocks */}
        {!analysis && !loading && !error && mainTab === "stocks" && (
          <StocksExplorer stockPrices={stockPrices} forexPrices={forexPrices} />
        )}

        {/* ══════ DERIVATIVES (F&O) TAB ══════ */}
        {/* ══════ REAL ESTATE TAB ══════ */}
        {mainTab === "realestate" && (
          <RealEstateDashboard />
        )}

        {mainTab === "wealth" && (
          <WealthAdvisoryDashboard />
        )}

        {mainTab === "tax" && (
          <TaxIntelligenceDashboard />
        )}

        {mainTab === "derivatives" && (
  <div>
    {/* AI Derivatives Agent */}
    <DerivativesAgentDashboard />

    {/* Global Derivatives Terminal */}
    <div style={{ marginTop: 24 }}>
      <GlobalDerivativesTerminal />
    </div>

    {/* NSE India Option Chain */}
    <div style={{ marginTop: 24 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
        padding: "14px 20px", background: "#fff", borderRadius: "12px 12px 0 0",
        borderBottom: "3px solid #1a237e", border: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: "1.4rem" }}>🇮🇳</span>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>NSE India — Live Option Chain</h2>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Real-time NSE F&O data with institutional analytics</span>
        </div>
      </div>
      <IndianDerivativesPage />
    </div>
  </div>
)}

      </div>

        {/* Right: Contextual Intelligence Panel (desktop only) */}
        {mainTab === "realestate" && (
        <div className="derivatives-sidebar" style={{ width: 340, minWidth: 310, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 20 }}>
            <RealEstatePanel />
          </div>
        </div>
        )}
        {mainTab !== "derivatives" && mainTab !== "realestate" && mainTab !== "crypto" && (
        <div className="derivatives-sidebar" style={{ width: 340, minWidth: 310, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 20 }}>
            <DerivativesPanel tab={mainTab} />
          </div>
        </div>
        )}

      {/* ── Upgrade Modal ── */}
      {showUpgrade && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ maxWidth: 800, width: "100%", position: "relative" }}>
            <button onClick={() => { setShowUpgrade(false); setPaymentSuccess(""); }} style={{ position: "absolute", top: -12, right: -12, width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <X size={16} />
            </button>
            {paymentSuccess ? (
              <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, background: "var(--success-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Check size={28} color="var(--success)" />
                </div>
                <h3 style={{ color: "var(--success)", marginBottom: 6 }}>Payment Successful!</h3>
                <p style={{ color: "var(--text-muted)" }}>Your <strong>{paymentSuccess}</strong> plan is now active.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 32 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Choose Your Plan</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Stocks + Commodities + Crypto — all-in-one</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  {[
                    { id: "starter", name: "Starter", price: "₹199", count: 20, color: "#0097a7", features: ["Stocks + Commodities + Crypto", "Risk dashboards", "Priority support"] },
                    { id: "pro", name: "Pro", price: "₹499", count: 100, color: "#2962ff", popular: true, features: ["All Starter features", "Commodity heatmaps", "CoinDCX insights", "Supply chain maps"] },
                    { id: "elite", name: "Elite", price: "₹999", count: 300, color: "#e65100", features: ["All Pro features", "PDF upload", "Portfolio watchlist", "Dedicated support"] },
                  ].map(p => (
                    <div key={p.id} style={{ border: p.popular ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, position: "relative", boxShadow: p.popular ? "0 4px 20px rgba(41,98,255,0.12)" : "none" }}>
                      {p.popular && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "3px 12px", borderRadius: 4 }}>POPULAR</div>}
                      <div style={{ fontSize: "0.7rem", color: p.color, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>{p.name}</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 900 }}>{p.price}<span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></div>
                      <div style={{ background: `${p.color}12`, borderRadius: 6, padding: "6px 0", textAlign: "center", margin: "12px 0", fontSize: "0.85rem", fontWeight: 700, color: p.color }}>{p.count} analyses</div>
                      {p.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                          <Check size={13} color={p.color} /> {f}
                        </div>
                      ))}
                      <button onClick={() => handlePayment(p.id)} disabled={!!paymentLoading} className={p.popular ? "btn-primary" : "btn-ghost"} style={{ width: "100%", marginTop: 12 }}>
                        {paymentLoading === p.id ? "Processing..." : `Get ${p.name}`}
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <button onClick={() => setShowUpgrade(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.82rem" }}>Continue with Free (5/month)</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      {/* Data Health Monitor */}
      <DataHealthMonitor />

      </>
      )}
      {/* end of desktop + mobile-tab conditional */}

      {/* Floating Switch Mode Toggle — removed, advanced-only mode */}
    </div>
  );
}
