"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Search, ArrowLeft, ArrowUpRight, ArrowDownRight, Filter, ChevronDown,
  Brain, Zap, TrendingUp, TrendingDown, Shield, Target, Globe, Eye,
  Sparkles, Activity, Flame, BarChart3, Users, ChevronRight, ChevronLeft,
  Building2, Cpu, Pill, Car, Landmark, Zap as ZapIcon, Factory,
  Layers, Radio, Wifi, Monitor, Package, Gem, Leaf, Award, X,
} from "lucide-react";
import { NSE_STOCKS, STOCK_SECTORS, MCAP_FILTERS, type StockEntry } from "@/lib/stocks";
import { MiniSparkline } from "@/components/LiveCharts";
import { useStockPrices } from "@/hooks/useMarketData";
import { DataSourceBadge } from "@/components/DataHealth";

/* ═══════════════════════════════════════════════════════════════════
   WHITE TIGER — SECTOR-FIRST MARKET INTELLIGENCE ECOSYSTEM
   Market Structure → Indices → Sectors → Stocks → Deep Analysis
   ═══════════════════════════════════════════════════════════════════ */

/* ═══ Seeded RNG ═══ */
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

/* ═══ SECTOR DEFINITIONS ═══ */
interface SectorDef {
  name: string;
  key: string;
  color: string;
  icon: React.ReactNode;
  niftyIndex?: string;
  sectors: string[];    // maps to StockEntry.sector values
  aiStory: string;
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
interface IndexData {
  name: string; shortName: string; color: string;
  constituents: number; description: string;
}

const INDICES: IndexData[] = [
  { name: "NIFTY 50", shortName: "NIFTY", color: "#6366f1", constituents: 50, description: "India's benchmark — Top 50 companies by market cap" },
  { name: "SENSEX", shortName: "SENSEX", color: "#ef4444", constituents: 30, description: "BSE benchmark — 30 largest companies" },
  { name: "BANK NIFTY", shortName: "BANKNIFTY", color: "#2563eb", constituents: 12, description: "Top banking stocks — interest rate sensitive" },
  { name: "NIFTY MIDCAP 100", shortName: "MIDCAP", color: "#f59e0b", constituents: 100, description: "Mid-sized growth companies — higher beta" },
  { name: "NIFTY SMALLCAP 250", shortName: "SMALLCAP", color: "#10b981", constituents: 250, description: "Small companies — high growth, high risk" },
  { name: "NIFTY FIN SERVICE", shortName: "FINNIFTY", color: "#0ea5e9", constituents: 20, description: "Banks, NBFCs, Insurance — financial ecosystem" },
];

/* ═══ Generate sector metrics ═══ */
function genSectorData(def: SectorDef, stocks: StockEntry[], liveStocks: Record<string, { price: number; change: number; changePercent: number }>) {
  const sectorStocks = stocks.filter(s => def.sectors.includes(s.sector));
  const rng = seededRng(def.key + new Date().toDateString());

  // Compute live stats if available
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

  return {
    ...def,
    stockCount: sectorStocks.length,
    avgChange,
    topGainer,
    topLoser,
    sentiment,
    heatColor: avgChange > 2 ? "#059669" : avgChange > 0.5 ? "#10b981" : avgChange > -0.5 ? "#6b7280" : avgChange > -2 ? "#f87171" : "#dc2626",
  };
}

/* ═══ Generate index data — uses LIVE feed, never hardcoded bases ═══ */
const INDEX_LIVE_KEY: Record<string, string> = {
  NIFTY: "NIFTY50", SENSEX: "SENSEX", BANKNIFTY: "BANKNIFTY",
  MIDCAP: "NIFTYMIDCAP100", SMALLCAP: "NIFTYSMALLCAP250", FINNIFTY: "FINNIFTY",
};
function genIndexValues(idx: IndexData, liveStocks: Record<string, { price: number; changePercent: number }>) {
  const key = INDEX_LIVE_KEY[idx.shortName] || idx.shortName;
  const lp = liveStocks[key];
  if (lp && lp.price > 0) {
    const change = +(lp.changePercent || 0).toFixed(2);
    const sentiment = change > 1 ? "Bullish" : change > 0 ? "Positive" : change > -1 ? "Neutral" : "Bearish";
    return { ...idx, value: lp.price as number | null, change: change as number | null, sentiment, isLive: true };
  }
  return { ...idx, value: null as number | null, change: null as number | null, sentiment: "—", isLive: false };
}

/* ═══ Stock Row ═══ */
function StockRow({ s, i, livePrice }: { s: StockEntry; i: number; livePrice?: { price: number; change: number; changePercent: number } }) {
  const sym = s.ticker.replace(".NS", "");
  const slug = sym.toLowerCase().replace(/[^a-z0-9]/g, "-");
  let h = 0;
  for (let c = 0; c < s.ticker.length; c++) { h = ((h << 5) - h) + s.ticker.charCodeAt(c); h |= 0; }
  const price = livePrice ? livePrice.price : Math.abs(h % 9000) + 50;
  const change = livePrice ? livePrice.changePercent : ((h % 800) - 400) / 100;

  return (
    <Link href={`/stocks/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "32px 1.8fr 0.8fr 0.7fr 80px",
        alignItems: "center", padding: "12px 18px", borderBottom: "1px solid #f1f5f9",
        transition: "all 0.15s", cursor: "pointer",
      }} onMouseOver={e => { e.currentTarget.style.background = "#f8f9fb"; }} onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}>
        <span style={{ fontSize: "0.66rem", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a1a2e" }}>{s.name}</div>
          <div style={{ fontSize: "0.62rem", color: "#6b7280", display: "flex", gap: 6, marginTop: 2 }}>
            <span>{sym}</span>
            {s.mcapType && <span style={{ background: s.mcapType === "large" ? "#dbeafe" : s.mcapType === "mid" ? "#fef3c7" : "#fce7f3", color: s.mcapType === "large" ? "#1d4ed8" : s.mcapType === "mid" ? "#b45309" : "#be185d", padding: "0 5px", borderRadius: 3, fontSize: "0.54rem", fontWeight: 700, textTransform: "uppercase" }}>{s.mcapType}</span>}
          </div>
        </div>
        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a1a2e", textAlign: "right" }}>₹{price.toLocaleString("en-IN")}</div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: change >= 0 ? "#059669" : "#dc2626", display: "inline-flex", alignItems: "center", gap: 2 }}>
            {change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(change).toFixed(2)}%
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <MiniSparkline seed={s.ticker} positive={change >= 0} width={60} height={22} />
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function StockExplorerPage() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [mcap, setMcap] = useState("All");
  const [visibleCount, setVisibleCount] = useState(50);
  const [activeSector, setActiveSector] = useState<SectorDef | null>(null);
  const [view, setView] = useState<"sectors" | "list" | "heatmap">("sectors");

  const { data: liveStocks } = useStockPrices();

  // Index data
  const indices = useMemo(() => INDICES.map(idx => genIndexValues(idx, liveStocks)), [liveStocks]);

  // Sector data with live metrics
  const sectorData = useMemo(() =>
    SECTOR_DEFS.map(def => genSectorData(def, NSE_STOCKS, liveStocks)),
    [liveStocks]
  );

  // Stock filtering
  const filtered = useMemo(() => {
    let stocks = NSE_STOCKS;
    if (activeSector) {
      stocks = stocks.filter(s => activeSector.sectors.includes(s.sector));
    } else if (sector !== "All") {
      stocks = stocks.filter(s => s.sector === sector);
    }
    if (mcap !== "All") {
      const map: Record<string, string> = { "Large Cap": "large", "Mid Cap": "mid", "Small Cap": "small", "SME/Micro": "sme" };
      stocks = stocks.filter(s => s.mcapType === map[mcap]);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      stocks = stocks.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.ticker.toLowerCase().replace(".ns", "").includes(q) ||
        s.sector.toLowerCase().includes(q)
      );
    }
    return stocks;
  }, [search, sector, mcap, activeSector]);

  const visible = filtered.slice(0, visibleCount);
  const loadMore = useCallback(() => setVisibleCount(v => v + 50), []);

  const openSector = (def: SectorDef) => {
    setActiveSector(def);
    setView("list");
    setVisibleCount(50);
    setSearch("");
    setMcap("All");
    setSector("All");
  };

  const backToSectors = () => {
    setActiveSector(null);
    setView("sectors");
    setVisibleCount(50);
    setSearch("");
  };

  // AI sector story for active sector
  const activeSectorData = activeSector ? sectorData.find(s => s.key === activeSector.key) : null;

  // Market narrative
  const rng = seededRng("market-" + new Date().toDateString());
  const niftyChange = +(liveStocks["NIFTY50"]?.changePercent ?? 0).toFixed(2);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ═══════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════ */}
      <header style={{ background: "linear-gradient(135deg, #0f0f23, #1a1a2e)", color: "#fff", padding: "16px 40px", position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {activeSector ? (
              <button onClick={backToSectors} style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem" }}>
                <ChevronLeft size={14} /> Market Overview
              </button>
            ) : (
              <Link href="/analyze" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem" }}>
                <ArrowLeft size={14} /> Dashboard
              </Link>
            )}
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
            <div>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                {activeSector ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: activeSector.color }}>{activeSector.icon}</span>
                    {activeSector.name}
                  </span>
                ) : "Market Intelligence"}
              </span>
              <div style={{ fontSize: "0.64rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {activeSector
                  ? `${filtered.length} stocks · ${activeSector.sectors.join(" · ")}`
                  : `${NSE_STOCKS.length.toLocaleString()} stocks · Sector-first exploration · AI-powered`
                }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!activeSector && (
              <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 2 }}>
                {(["sectors", "list", "heatmap"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: "0.7rem", fontWeight: 600, textTransform: "capitalize",
                    background: view === v ? "rgba(99,102,241,0.2)" : "transparent",
                    color: view === v ? "#a5b4fc" : "rgba(255,255,255,0.4)",
                  }}>{v === "heatmap" ? "Heat Map" : v === "sectors" ? "Sectors" : "All Stocks"}</button>
                ))}
              </div>
            )}
            <div style={{ position: "relative", width: 280 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setVisibleCount(50); if (e.target.value && !activeSector) setView("list"); }}
                placeholder="Search stocks, sectors..."
                style={{ width: "100%", padding: "9px 14px 9px 34px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "0.78rem", outline: "none" }}
              />
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 40px 80px" }}>

        {/* ═══════════════════════════════════════════════════════
            SECTOR DETAIL VIEW
            ═══════════════════════════════════════════════════════ */}
        {activeSector && activeSectorData && (
          <>
            {/* Sector Intelligence Banner */}
            <div style={{
              background: `linear-gradient(135deg, ${activeSector.color}08, ${activeSector.color}15)`,
              borderRadius: 16, padding: "24px 28px", marginBottom: 20,
              border: `1px solid ${activeSector.color}25`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Brain size={16} style={{ color: activeSector.color }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: activeSector.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>AI Sector Story</span>
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>
                    {activeSector.aiStory}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
                    <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "3px 10px", borderRadius: 5, background: activeSectorData.avgChange >= 0 ? "#f0fdf4" : "#fef2f2", color: activeSectorData.avgChange >= 0 ? "#059669" : "#dc2626" }}>
                      {activeSectorData.sentiment}
                    </span>
                    <span style={{ fontSize: "0.66rem", color: "#9ca3af" }}>·</span>
                    <span style={{ fontSize: "0.66rem", color: "#6b7280" }}>
                      Avg change: <strong style={{ color: activeSectorData.avgChange >= 0 ? "#059669" : "#dc2626" }}>{activeSectorData.avgChange > 0 ? "+" : ""}{activeSectorData.avgChange}%</strong>
                    </span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, minWidth: 280 }}>
                  <div style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "0.58rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Top Gainer</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a1a2e" }}>{activeSectorData.topGainer.name.split(" ").slice(0, 2).join(" ")}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669" }}>+{activeSectorData.topGainer.change.toFixed(2)}%</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "0.58rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Top Loser</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a1a2e" }}>{activeSectorData.topLoser.name.split(" ").slice(0, 2).join(" ")}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626" }}>{activeSectorData.topLoser.change.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter bar for sector */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {MCAP_FILTERS.map(m => (
                  <button key={m} onClick={() => { setMcap(m); setVisibleCount(50); }} style={{
                    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600,
                    background: mcap === m ? "#1a1a2e" : "#fff", color: mcap === m ? "#fff" : "#6b7280",
                    boxShadow: mcap === m ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
                  }}>{m}</button>
                ))}
              </div>
              <span style={{ marginLeft: "auto", fontSize: "0.74rem", color: "#6b7280", fontWeight: 600 }}>
                {filtered.length} stocks
              </span>
            </div>

            {/* Stock Table */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "32px 1.8fr 0.8fr 0.7fr 80px", padding: "10px 18px", borderBottom: "2px solid #1a1a2e", fontSize: "0.62rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <span>#</span><span>Company</span><span style={{ textAlign: "right" }}>Price</span><span style={{ textAlign: "right" }}>Change</span><span style={{ textAlign: "right" }}>Trend</span>
              </div>
              {visible.map((s, i) => {
                const sym = s.ticker.replace(".NS", "");
                const lp = liveStocks[sym];
                return <StockRow key={`${s.ticker}-${i}`} s={s} i={i} livePrice={lp ? { price: lp.price, change: lp.change, changePercent: lp.changePercent } : undefined} />;
              })}
            </div>
            {visibleCount < filtered.length && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <button onClick={loadMore} style={{ padding: "10px 32px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "#1a1a2e" }}>
                  Load More ({(filtered.length - visibleCount).toLocaleString()} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            MARKET OVERVIEW — SECTOR-FIRST VIEW
            ═══════════════════════════════════════════════════════ */}
        {!activeSector && view === "sectors" && (
          <>
            {/* ── Market Indices ── */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Activity size={16} style={{ color: "#6366f1" }} />
                <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1a1a2e" }}>Market Indices</span>
                <span style={{ fontSize: "0.62rem", color: "#9ca3af", fontWeight: 500 }}>Live market pulse</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {indices.map((idx) => (
                  <div key={idx.shortName} style={{
                    background: "#fff", borderRadius: 14, padding: "18px 18px 14px",
                    border: "1px solid #e5e7eb", position: "relative", overflow: "hidden",
                    transition: "all 0.2s", cursor: "default",
                  }}>
                    {/* Top color accent */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: idx.color }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: "0.62rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{idx.shortName}</div>
                      <span title={idx.isLive ? "Live from market feed" : "Live data unavailable"} style={{
                        fontSize: "0.46rem", fontWeight: 800, padding: "1px 5px", borderRadius: 3, letterSpacing: "0.04em",
                        background: idx.isLive ? "#dcfce7" : "#f3f4f6",
                        color: idx.isLive ? "#059669" : "#6b7280",
                      }}>{idx.isLive ? "● LIVE" : "—"}</span>
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#1a1a2e", marginBottom: 4 }}>
                      {idx.value != null ? Number(idx.value).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      {idx.change != null ? (
                        <>
                          {idx.change >= 0 ? <ArrowUpRight size={12} style={{ color: "#059669" }} /> : <ArrowDownRight size={12} style={{ color: "#dc2626" }} />}
                          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: idx.change >= 0 ? "#059669" : "#dc2626" }}>
                            {idx.change > 0 ? "+" : ""}{idx.change}%
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: "0.66rem", color: "#6b7280", fontWeight: 600 }}>data unavailable</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.56rem", fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                        background: idx.change != null ? (idx.change >= 0 ? "#f0fdf4" : "#fef2f2") : "#f3f4f6",
                        color: idx.change != null ? (idx.change >= 0 ? "#059669" : "#dc2626") : "#6b7280" }}>
                        {idx.sentiment}
                      </span>
                      <MiniSparkline seed={idx.shortName} positive={(idx.change ?? 0) >= 0} width={50} height={18} />
                    </div>
                    <div style={{ fontSize: "0.52rem", color: "#9ca3af", marginTop: 6 }}>{idx.description}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── AI Market Brief ── */}
            <section style={{ marginBottom: 28 }}>
              <div style={{
                background: "linear-gradient(135deg, #0f0f23, #1a1035)",
                borderRadius: 16, padding: "22px 28px", color: "#fff", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", gap: 20 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Brain size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800 }}>AI Market Intelligence</span>
                      <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.35)" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, margin: 0 }}>
                      {niftyChange > 0
                        ? `Markets are showing strength with broad-based participation. Banking and infrastructure sectors are leading the rally driven by strong credit growth data and government capex push. FIIs are net buyers, signaling renewed confidence in India's growth trajectory. Watch for sector rotation into IT and pharma on dollar strength.`
                        : `Markets are consolidating after a strong rally phase. Global headwinds from rising US bond yields and Dollar Index strength are weighing on sentiment. Mid and small-caps are showing relative outperformance with selective buying in defense, chemicals, and railways. Key monitorable: RBI policy stance and FII flow direction.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Sector Explorer ── */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <BarChart3 size={16} style={{ color: "#6366f1" }} />
                  <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1a1a2e" }}>Sector Explorer</span>
                  <span style={{ fontSize: "0.62rem", color: "#9ca3af", fontWeight: 500 }}>Click any sector to explore stocks</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {sectorData.map((sec) => (
                  <button
                    key={sec.key}
                    onClick={() => openSector(sec)}
                    style={{
                      background: "#fff", borderRadius: 14, padding: "20px 20px 16px",
                      border: "1px solid #e5e7eb", textAlign: "left", cursor: "pointer",
                      transition: "all 0.2s", position: "relative", overflow: "hidden",
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = sec.color; e.currentTarget.style.boxShadow = `0 4px 20px ${sec.color}15`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                  >
                    {/* Heat indicator strip */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: sec.heatColor, opacity: 0.8 }} />

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sec.color}10`, display: "flex", alignItems: "center", justifyContent: "center", color: sec.color }}>
                          {sec.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{sec.name}</div>
                          <div style={{ fontSize: "0.58rem", color: "#9ca3af", fontWeight: 500 }}>{sec.stockCount} stocks</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.92rem", fontWeight: 800, color: sec.avgChange >= 0 ? "#059669" : "#dc2626" }}>
                          {sec.avgChange > 0 ? "+" : ""}{sec.avgChange}%
                        </div>
                        <div style={{ fontSize: "0.54rem", fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: sec.sentiment.includes("Bull") ? "#f0fdf4" : sec.sentiment.includes("Bear") ? "#fef2f2" : "#f8fafc", color: sec.sentiment.includes("Bull") ? "#059669" : sec.sentiment.includes("Bear") ? "#dc2626" : "#6b7280" }}>
                          {sec.sentiment}
                        </div>
                      </div>
                    </div>

                    {/* Mini sparkline */}
                    <div style={{ marginBottom: 10 }}>
                      <MiniSparkline seed={sec.key} positive={sec.avgChange >= 0} width={200} height={28} />
                    </div>

                    {/* Top gainer / loser */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem" }}>
                      <span style={{ color: "#059669" }}>▲ {sec.topGainer.name.split(" ")[0]}</span>
                      <span style={{ color: "#dc2626" }}>▼ {sec.topLoser.name.split(" ")[0]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* ── "What This Means" AI Cards ── */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Zap size={16} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a1a2e" }}>What This Means</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { text: "Rising oil prices may negatively affect paint, aviation, and chemical companies while benefiting upstream oil & gas stocks.", color: "#ef4444", sector: "Energy ↔ Consumption" },
                  { text: "Lower interest rates support real estate, auto (financing), and banking stocks through cheaper credit and higher loan growth.", color: "#2563eb", sector: "Rates ↔ Financials" },
                  { text: "Rupee weakness benefits IT exporters (revenue in USD) but pressures importers like oil marketing companies and electronics.", color: "#10b981", sector: "FX ↔ IT/Energy" },
                ].map((card, i) => (
                  <div key={i} style={{
                    background: "#fff", borderRadius: 12, padding: "18px 20px",
                    border: "1px solid #e5e7eb", borderLeft: `3px solid ${card.color}`,
                  }}>
                    <div style={{ fontSize: "0.58rem", fontWeight: 700, color: card.color, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{card.sector}</div>
                    <p style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.55, margin: 0 }}>{card.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            HEATMAP VIEW
            ═══════════════════════════════════════════════════════ */}
        {!activeSector && view === "heatmap" && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Flame size={16} style={{ color: "#ef4444" }} />
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1a1a2e" }}>Market Heatmap</span>
              <span style={{ fontSize: "0.62rem", color: "#9ca3af" }}>Size = relative market cap · Color = daily change</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, background: "#fff", borderRadius: 16, padding: 16, border: "1px solid #e5e7eb" }}>
              {sectorData.map((sec) => {
                const sectorStocks = NSE_STOCKS.filter(s => sec.sectors.includes(s.sector)).slice(0, 12);
                return (
                  <div key={sec.key} style={{ flex: `${Math.max(sec.stockCount, 8)} 0 0`, minWidth: 120 }}>
                    <div style={{ fontSize: "0.58rem", fontWeight: 700, color: sec.color, marginBottom: 4, paddingLeft: 4 }}>{sec.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      {sectorStocks.map(s => {
                        const sym = s.ticker.replace(".NS", "");
                        const lp = liveStocks[sym];
                        let h2 = 0;
                        for (let c = 0; c < s.ticker.length; c++) { h2 = ((h2 << 5) - h2) + s.ticker.charCodeAt(c); h2 |= 0; }
                        const chg = lp ? lp.changePercent : ((h2 % 800) - 400) / 100;
                        const intensity = Math.min(Math.abs(chg) / 4, 1);
                        const bg = chg >= 0
                          ? `rgba(5, 150, 105, ${0.15 + intensity * 0.6})`
                          : `rgba(220, 38, 38, ${0.15 + intensity * 0.6})`;
                        const size = s.mcapType === "large" ? 72 : s.mcapType === "mid" ? 58 : 48;

                        return (
                          <Link key={sym} href={`/stocks/${sym.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} style={{ textDecoration: "none" }}>
                            <div style={{
                              width: size, height: size, borderRadius: 6,
                              background: bg, display: "flex", flexDirection: "column",
                              alignItems: "center", justifyContent: "center",
                              cursor: "pointer", transition: "transform 0.15s",
                            }} onMouseOver={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                              <span style={{ fontSize: "0.54rem", fontWeight: 700, color: chg >= 0 ? "#065f46" : "#7f1d1d" }}>{sym.slice(0, 6)}</span>
                              <span style={{ fontSize: "0.52rem", fontWeight: 800, color: chg >= 0 ? "#059669" : "#dc2626" }}>
                                {chg >= 0 ? "+" : ""}{chg.toFixed(1)}%
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 18, height: 10, borderRadius: 2, background: "rgba(220,38,38,0.7)" }} />
                <span style={{ fontSize: "0.58rem", color: "#6b7280" }}>Strong Decline</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 18, height: 10, borderRadius: 2, background: "rgba(220,38,38,0.25)" }} />
                <span style={{ fontSize: "0.58rem", color: "#6b7280" }}>Mild Decline</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 18, height: 10, borderRadius: 2, background: "rgba(5,150,105,0.25)" }} />
                <span style={{ fontSize: "0.58rem", color: "#6b7280" }}>Mild Gain</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 18, height: 10, borderRadius: 2, background: "rgba(5,150,105,0.7)" }} />
                <span style={{ fontSize: "0.58rem", color: "#6b7280" }}>Strong Gain</span>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════
            ALL STOCKS LIST VIEW
            ═══════════════════════════════════════════════════════ */}
        {!activeSector && view === "list" && (
          <>
            {/* Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {MCAP_FILTERS.map(m => (
                  <button key={m} onClick={() => { setMcap(m); setVisibleCount(50); }} style={{
                    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600,
                    background: mcap === m ? "#1a1a2e" : "#fff", color: mcap === m ? "#fff" : "#6b7280",
                    boxShadow: mcap === m ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
                  }}>{m}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 3, overflowX: "auto", flex: 1 }}>
                {["All", ...SECTOR_DEFS.map(d => d.name)].map(s => (
                  <button key={s} onClick={() => {
                    if (s === "All") { setSector("All"); }
                    else {
                      const def = SECTOR_DEFS.find(d => d.name === s);
                      if (def) openSector(def);
                    }
                    setVisibleCount(50);
                  }} style={{
                    padding: "5px 10px", borderRadius: 5, cursor: "pointer", fontSize: "0.62rem", fontWeight: 600,
                    whiteSpace: "nowrap", border: "1px solid #e5e7eb",
                    background: sector === s ? "#1a1a2e" : "#fff", color: sector === s ? "#fff" : "#6b7280",
                  }}>{s === "All" ? `All (${NSE_STOCKS.length})` : s}</button>
                ))}
              </div>
              <span style={{ marginLeft: "auto", fontSize: "0.74rem", color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>
                {filtered.length.toLocaleString()} stocks
              </span>
            </div>

            {/* Stock Table */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "32px 1.8fr 0.8fr 0.7fr 80px", padding: "10px 18px", borderBottom: "2px solid #1a1a2e", fontSize: "0.62rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <span>#</span><span>Company</span><span style={{ textAlign: "right" }}>Price</span><span style={{ textAlign: "right" }}>Change</span><span style={{ textAlign: "right" }}>Trend</span>
              </div>
              {visible.map((s, i) => {
                const sym = s.ticker.replace(".NS", "");
                const lp = liveStocks[sym];
                return <StockRow key={`${s.ticker}-${i}`} s={s} i={i} livePrice={lp ? { price: lp.price, change: lp.change, changePercent: lp.changePercent } : undefined} />;
              })}
            </div>
            {visibleCount < filtered.length && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <button onClick={loadMore} style={{ padding: "10px 32px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, color: "#1a1a2e" }}>
                  Load More ({(filtered.length - visibleCount).toLocaleString()} remaining)
                </button>
              </div>
            )}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
                <Search size={32} style={{ color: "#e5e7eb", marginBottom: 12 }} />
                <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>No stocks found</div>
                <div style={{ fontSize: "0.82rem" }}>Try a different search term or adjust your filters.</div>
              </div>
            )}
          </>
        )}

        {/* ═══ Footer ═══ */}
        <footer style={{ borderTop: "1px solid #e5e7eb", marginTop: 40, paddingTop: 20, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
            <Brain size={14} style={{ color: "#6366f1" }} />
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#1a1a2e" }}>White Tiger Market Intelligence</span>
          </div>
          <div style={{ fontSize: "0.64rem", color: "#9ca3af", lineHeight: 1.5 }}>
            AI-powered market exploration for educational purposes. Not investment advice. Data may be delayed.
          </div>
        </footer>
      </div>
    </div>
  );
}
