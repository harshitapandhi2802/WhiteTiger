"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   WHITE TIGER — MUTUAL FUND INTELLIGENCE ENGINE
   Category-first discovery · Real-time AMFI data · AI Intelligence

   Flow: Categories → Subcategories → Fund List → Fund Analysis
   Data: 51 AMCs · 14,000+ schemes · Live NAV from AMFI India
   ═══════════════════════════════════════════════════════════════════════════ */

// ═══ TYPES ═══
interface AMCSummary {
  name: string; slug: string; schemeCount: number; categories: string[];
  lastUpdated: string; equitySchemes: number; debtSchemes: number;
  hybridSchemes: number; indexSchemes: number;
  parentCompany?: string; ceo?: string; cio?: string;
  aumEstimate?: string; aumNumeric?: number; marketSharePct?: number;
  founded?: number; category?: string; strengths?: string[]; weaknesses?: string[];
  ownershipStructure?: string;
}

interface IndustryStats {
  totalAUM: string; totalAUMNote: string; monthlySIPFlows: string;
  sipFlowsMonth: string; totalFolios: string; uniqueInvestors: string;
  liveSchemeCount: number; liveAMCCount: number; navDate: string;
  lastFetched: string; dataSource: string; disclaimer: string;
}

interface AMFIScheme {
  schemeCode: number; isinGrowth: string; schemeName: string;
  nav: number; navDate: string; amcName: string;
  schemeType: string; schemeCategory: string;
}

interface APIResponse {
  success: boolean; industry: IndustryStats; amcs: AMCSummary[];
  totalAMCs: number; totalSchemes: number; categories: string[];
}

// ═══ CATEGORY DEFINITIONS ═══
// Maps AMFI's raw categories into user-friendly groups

interface CategoryDef {
  id: string;
  label: string;
  icon: string;
  color: string;        // primary color
  gradient: string;     // card gradient
  description: string;
  amfiPrefixes: string[]; // AMFI category prefixes to match
  aiInsight: string;     // AI tip for category
}

const MAIN_CATEGORIES: CategoryDef[] = [
  { id: "equity", label: "Equity Funds", icon: "📈", color: "#4A9EFF", gradient: "linear-gradient(135deg, rgba(74,158,255,0.12), rgba(74,158,255,0.04))", description: "Invest in stocks for long-term wealth creation", amfiPrefixes: ["Equity Scheme"], aiInsight: "Best for 5+ year horizon. Historically delivers 12-15% CAGR over long periods." },
  { id: "debt", label: "Debt Funds", icon: "🏦", color: "#34D399", gradient: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.04))", description: "Stable income from bonds & fixed-income securities", amfiPrefixes: ["Debt Scheme"], aiInsight: "Lower risk than equity. Suitable for 1-3 year goals with 6-8% expected returns." },
  { id: "hybrid", label: "Hybrid Funds", icon: "⚖️", color: "#FBBF24", gradient: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.04))", description: "Mix of equity & debt for balanced growth", amfiPrefixes: ["Hybrid Scheme"], aiInsight: "Ideal for moderate risk-takers. Auto-balances between equity and debt." },
  { id: "index", label: "Index & ETFs", icon: "📊", color: "#818CF8", gradient: "linear-gradient(135deg, rgba(129,140,248,0.12), rgba(129,140,248,0.04))", description: "Track market indices at lowest cost", amfiPrefixes: ["Other Scheme - Index", "Other Scheme - Other  ETF"], aiInsight: "Lowest expense ratios (0.05-0.2%). Warren Buffett's recommended approach for most investors." },
  { id: "elss", label: "ELSS (Tax Saving)", icon: "🛡️", color: "#F472B6", gradient: "linear-gradient(135deg, rgba(244,114,182,0.12), rgba(244,114,182,0.04))", description: "Save tax under Section 80C with 3-year lock-in", amfiPrefixes: ["Equity Scheme - ELSS", "ELSS"], aiInsight: "Dual benefit: Tax saving + equity returns. ₹1.5L annual limit under 80C." },
  { id: "solution", label: "Solution Oriented", icon: "🎯", color: "#FB923C", gradient: "linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))", description: "Retirement & children's future planning", amfiPrefixes: ["Solution Oriented Scheme"], aiInsight: "Goal-based investing with built-in lock-in periods. Align with specific life goals." },
  { id: "gold", label: "Gold & Commodities", icon: "🥇", color: "#C5A572", gradient: "linear-gradient(135deg, rgba(197,165,114,0.12), rgba(197,165,114,0.04))", description: "Hedge against inflation with precious metals", amfiPrefixes: ["Other Scheme - Gold ETF"], aiInsight: "Portfolio diversifier. Gold performs well during equity market downturns." },
  { id: "fof", label: "Fund of Funds", icon: "🌐", color: "#6EE7B7", gradient: "linear-gradient(135deg, rgba(110,231,183,0.12), rgba(110,231,183,0.04))", description: "Invest in other funds, including international", amfiPrefixes: ["Other Scheme - FoF"], aiInsight: "Access global markets or multi-fund strategies via single investment." },
];

// Subcategory definitions with AI insights
interface SubcategoryDef {
  label: string;
  amfiKey: string;      // exact AMFI category string to match
  riskLevel: string;
  aiTip: string;
  icon: string;
}

const SUBCATEGORY_MAP: Record<string, SubcategoryDef[]> = {
  equity: [
    { label: "Large Cap", amfiKey: "Equity Scheme - Large Cap Fund", riskLevel: "High", aiTip: "Top 100 companies by market cap. Most stable equity category.", icon: "🏢" },
    { label: "Mid Cap", amfiKey: "Equity Scheme - Mid Cap Fund", riskLevel: "Very High", aiTip: "Companies ranked 101-250. Higher growth potential with more volatility.", icon: "🏗️" },
    { label: "Small Cap", amfiKey: "Equity Scheme - Small Cap Fund", riskLevel: "Very High", aiTip: "Companies ranked 251+. Highest growth potential but highest risk.", icon: "🚀" },
    { label: "Multi Cap", amfiKey: "Equity Scheme - Multi Cap Fund", riskLevel: "Very High", aiTip: "Mandated 25% each in large, mid, small cap. True diversification.", icon: "🎯" },
    { label: "Flexi Cap", amfiKey: "Equity Scheme - Flexi Cap Fund", riskLevel: "Very High", aiTip: "Fund manager decides allocation across caps. Maximum flexibility.", icon: "🔄" },
    { label: "Large & Mid Cap", amfiKey: "Equity Scheme - Large & Mid Cap Fund", riskLevel: "Very High", aiTip: "Min 35% each in large and mid cap. Balanced equity approach.", icon: "📐" },
    { label: "Focused Funds", amfiKey: "Equity Scheme - Focused Fund", riskLevel: "Very High", aiTip: "Maximum 30 stocks. Concentrated bets = higher alpha potential.", icon: "🎯" },
    { label: "Value Funds", amfiKey: "Equity Scheme - Value Fund", riskLevel: "Very High", aiTip: "Buy undervalued stocks. Requires patience but rewarding long-term.", icon: "💎" },
    { label: "Contra Funds", amfiKey: "Equity Scheme - Contra Fund", riskLevel: "Very High", aiTip: "Goes against market consensus. Contrarian strategy needs long holding.", icon: "🔀" },
    { label: "Dividend Yield", amfiKey: "Equity Scheme - Dividend Yield Fund", riskLevel: "High", aiTip: "Invests in high-dividend stocks. Relatively defensive equity play.", icon: "💰" },
    { label: "Sectoral / Thematic", amfiKey: "Equity Scheme - Sectoral/ Thematic", riskLevel: "Very High", aiTip: "Concentrated in one sector. High risk-high reward. Time your entry.", icon: "⚡" },
    { label: "ELSS (Tax Saver)", amfiKey: "Equity Scheme - ELSS", riskLevel: "Very High", aiTip: "3-year lock-in. Tax benefit under 80C up to ₹1.5L/year.", icon: "🛡️" },
  ],
  debt: [
    { label: "Liquid Funds", amfiKey: "Debt Scheme - Liquid Fund", riskLevel: "Low", aiTip: "Park money for days to weeks. Near-zero risk. Better than savings account.", icon: "💧" },
    { label: "Overnight Funds", amfiKey: "Debt Scheme - Overnight Fund", riskLevel: "Low", aiTip: "Invest in 1-day maturity papers. Safest MF category.", icon: "🌙" },
    { label: "Ultra Short Duration", amfiKey: "Debt Scheme - Ultra Short Duration Fund", riskLevel: "Low to Moderate", aiTip: "3-6 month Macaulay duration. Better than liquid for 1-3 month horizon.", icon: "⏱️" },
    { label: "Low Duration", amfiKey: "Debt Scheme - Low Duration Fund", riskLevel: "Low to Moderate", aiTip: "6-12 month duration. Good for short-term surplus parking.", icon: "📅" },
    { label: "Short Duration", amfiKey: "Debt Scheme - Short Duration Fund", riskLevel: "Moderate", aiTip: "1-3 year duration. Balance between returns and stability.", icon: "📆" },
    { label: "Medium Duration", amfiKey: "Debt Scheme - Medium Duration Fund", riskLevel: "Moderate", aiTip: "3-4 year duration. Suitable for medium-term goals.", icon: "📋" },
    { label: "Medium to Long Duration", amfiKey: "Debt Scheme - Medium to Long Duration Fund", riskLevel: "Moderate to High", aiTip: "4-7 year duration. Interest rate sensitive.", icon: "📊" },
    { label: "Long Duration", amfiKey: "Debt Scheme - Long Duration Fund", riskLevel: "High", aiTip: "7+ year duration. Highly sensitive to rate changes. For rate-fall bets.", icon: "📈" },
    { label: "Dynamic Bond", amfiKey: "Debt Scheme - Dynamic Bond", riskLevel: "Moderate", aiTip: "Manager adjusts duration dynamically. No duration timing needed from you.", icon: "🔄" },
    { label: "Corporate Bond", amfiKey: "Debt Scheme - Corporate Bond Fund", riskLevel: "Moderate", aiTip: "Min 80% in AA+ bonds. Good risk-return for 2-3 year horizon.", icon: "🏛️" },
    { label: "Credit Risk", amfiKey: "Debt Scheme - Credit Risk Fund", riskLevel: "Moderate to High", aiTip: "Invests in lower-rated bonds for higher yield. Credit default risk exists.", icon: "⚠️" },
    { label: "Banking & PSU", amfiKey: "Debt Scheme - Banking and PSU Fund", riskLevel: "Low to Moderate", aiTip: "Min 80% in bank/PSU debt. Among the safest debt categories.", icon: "🏦" },
    { label: "Gilt Funds", amfiKey: "Debt Scheme - Gilt Fund", riskLevel: "Moderate to High", aiTip: "100% government securities. Zero credit risk but interest rate risk.", icon: "🇮🇳" },
    { label: "Gilt 10Y Constant", amfiKey: "Debt Scheme - Gilt Fund with 10 year constant duration", riskLevel: "High", aiTip: "Gilt with 10-year constant duration. Pure rate play.", icon: "🔟" },
    { label: "Money Market", amfiKey: "Debt Scheme - Money Market Fund", riskLevel: "Low", aiTip: "Up to 1-year maturity instruments. Good for short-term parking.", icon: "💵" },
    { label: "Floater Funds", amfiKey: "Debt Scheme - Floater Fund", riskLevel: "Low to Moderate", aiTip: "Min 65% in floating rate instruments. Natural hedge against rate hikes.", icon: "🔃" },
  ],
  hybrid: [
    { label: "Aggressive Hybrid", amfiKey: "Hybrid Scheme - Aggressive Hybrid Fund", riskLevel: "Very High", aiTip: "65-80% equity + 20-35% debt. Good first equity fund for beginners.", icon: "🔥" },
    { label: "Balanced Advantage (BAF)", amfiKey: "Hybrid Scheme - Dynamic Asset Allocation or Balanced Advantage", riskLevel: "High", aiTip: "Dynamically shifts equity/debt based on valuations. All-weather fund.", icon: "⚖️" },
    { label: "Conservative Hybrid", amfiKey: "Hybrid Scheme - Conservative Hybrid Fund", riskLevel: "Moderate", aiTip: "75-90% debt + 10-25% equity. Monthly income with small equity kicker.", icon: "🛡️" },
    { label: "Multi Asset Allocation", amfiKey: "Hybrid Scheme - Multi Asset Allocation", riskLevel: "High", aiTip: "Min 10% each in 3+ asset classes. Ultimate diversification.", icon: "🌐" },
    { label: "Arbitrage Funds", amfiKey: "Hybrid Scheme - Arbitrage Fund", riskLevel: "Low", aiTip: "Equity taxation + debt-like returns. Tax-efficient FD alternative.", icon: "📐" },
    { label: "Equity Savings", amfiKey: "Hybrid Scheme - Equity Savings", riskLevel: "Moderate", aiTip: "Equity + debt + arbitrage mix. Lower volatility than pure equity.", icon: "💼" },
    { label: "Balanced Hybrid", amfiKey: "Hybrid Scheme - Balanced Hybrid Fund", riskLevel: "High", aiTip: "40-60% equity and 40-60% debt. Truly balanced allocation.", icon: "🤝" },
  ],
  index: [
    { label: "Index Funds", amfiKey: "Other Scheme - Index Funds", riskLevel: "High", aiTip: "Passively track indices like Nifty 50, Sensex. Lowest costs.", icon: "📊" },
    { label: "ETFs", amfiKey: "Other Scheme - Other  ETFs", riskLevel: "High", aiTip: "Exchange-traded. Trade like stocks with index fund benefits.", icon: "📉" },
  ],
  elss: [
    { label: "ELSS", amfiKey: "Equity Scheme - ELSS", riskLevel: "Very High", aiTip: "Equity-linked savings. 3-year lock-in. Best tax-saving MF option.", icon: "🛡️" },
  ],
  solution: [
    { label: "Retirement Funds", amfiKey: "Solution Oriented Scheme - Retirement Fund", riskLevel: "High", aiTip: "5-year lock-in. Designed for retirement corpus building.", icon: "🏖️" },
    { label: "Children's Funds", amfiKey: "Solution Oriented Scheme - Children's Fund", riskLevel: "High", aiTip: "5-year lock-in. For child's education or marriage planning.", icon: "👶" },
  ],
  gold: [
    { label: "Gold ETFs", amfiKey: "Other Scheme - Gold ETF", riskLevel: "Moderate", aiTip: "Digital gold via demat. No storage hassle. Tracks gold prices.", icon: "🥇" },
  ],
  fof: [
    { label: "FoF — Domestic", amfiKey: "Other Scheme - FoF Domestic", riskLevel: "Varies", aiTip: "Invests in other Indian mutual fund schemes.", icon: "🇮🇳" },
    { label: "FoF — Overseas", amfiKey: "Other Scheme - FoF Overseas", riskLevel: "Very High", aiTip: "Invest in global markets — US, Europe, Emerging Markets.", icon: "🌍" },
  ],
};

// ═══ UTILITY COMPONENTS ═══

function LiveDot({ size = 7 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span style={{
        width: size, height: size, borderRadius: "50%", background: "var(--success)",
        boxShadow: "0 0 6px rgba(52,211,153,0.5)",
        animation: "wtPulse 2s ease-in-out infinite",
      }} />
      <style>{`@keyframes wtPulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
    </span>
  );
}

function SourceBadge({ source, date }: { source: string; date?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 4,
      background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.12)",
      fontSize: "0.5rem", fontWeight: 600, color: "#6ee7b7",
    }}>✓ {source}{date ? ` · ${date}` : ""}</span>
  );
}

function LoadingBar() {
  return (
    <div style={{ textAlign: "center", padding: "100px 0" }}>
      <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>⏳</div>
      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Connecting to AMFI India</div>
      <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>Fetching real-time NAV data for 14,000+ schemes...</div>
      <div style={{ margin: "20px auto", width: 200, height: 3, borderRadius: 2, background: "var(--bg-slate)", overflow: "hidden" }}>
        <div style={{ width: "40%", height: "100%", background: "var(--accent)", borderRadius: 2, animation: "wtLoadBar 1.5s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes wtLoadBar { 0%{width:0%;margin-left:0} 50%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }`}</style>
    </div>
  );
}

// ═══ VIEW MODES ═══
type ViewMode = "home" | "subcategory" | "fundlist" | "amcs";

export default function MFIntelligencePage() {
  // ── State ──
  const [view, setView] = useState<ViewMode>("home");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubcat, setSelectedSubcat] = useState<SubcategoryDef | null>(null);
  const [selectedAMCSlug, setSelectedAMCSlug] = useState<string | null>(null);

  // Data
  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState<APIResponse | null>(null);
  const [fundListData, setFundListData] = useState<AMFIScheme[]>([]);
  const [fundListTotal, setFundListTotal] = useState(0);
  const [fundListLoading, setFundListLoading] = useState(false);
  const [amcDetail, setAmcDetail] = useState<{ amc: AMCSummary; schemesByCategory: Record<string, AMFIScheme[]>; totalSchemes: number } | null>(null);
  const [amcDetailLoading, setAmcDetailLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"nav-high" | "nav-low" | "name" | "amc">("name");
  const [amcFilter, setAmcFilter] = useState("");
  const [schemeSearch, setSchemeSearch] = useState("");

  // ── Fetch industry data ──
  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const res = await fetch("/api/mf-data?mode=summary");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!c) setApiData(json);
      } catch (err) { console.error(err); }
      finally { if (!c) setLoading(false); }
    })();
    const iv = setInterval(async () => {
      try {
        const res = await fetch("/api/mf-data?mode=summary");
        const json = await res.json();
        setApiData(json);
      } catch {}
    }, 30 * 60 * 1000);
    return () => { c = true; clearInterval(iv); };
  }, []);

  // ── Fetch fund list for subcategory ──
  useEffect(() => {
    if (view !== "fundlist" || !selectedSubcat) return;
    let c = false;
    (async () => {
      setFundListLoading(true);
      try {
        const cat = encodeURIComponent(selectedSubcat.amfiKey);
        const q = search ? `&q=${encodeURIComponent(search)}` : "";
        const amc = amcFilter ? `&amc=${encodeURIComponent(amcFilter)}` : "";
        const res = await fetch(`/api/mf-data?mode=schemes&category=${cat}&limit=200${q}${amc}`);
        const json = await res.json();
        if (!c) {
          setFundListData(json.schemes || []);
          setFundListTotal(json.total || 0);
        }
      } catch (err) { console.error(err); }
      finally { if (!c) setFundListLoading(false); }
    })();
    return () => { c = true; };
  }, [view, selectedSubcat, search, amcFilter]);

  // ── Fetch AMC detail ──
  useEffect(() => {
    if (view !== "amcs" || !selectedAMCSlug) { setAmcDetail(null); return; }
    let c = false;
    (async () => {
      setAmcDetailLoading(true);
      try {
        const res = await fetch(`/api/mf-data?mode=amc&name=${encodeURIComponent(selectedAMCSlug)}`);
        const json = await res.json();
        if (!c) setAmcDetail(json);
      } catch (err) { console.error(err); }
      finally { if (!c) setAmcDetailLoading(false); }
    })();
    return () => { c = true; };
  }, [view, selectedAMCSlug]);

  // ── Computed: category scheme counts ──
  const categorySchemeCounts = useMemo(() => {
    if (!apiData?.categories) return {};
    const counts: Record<string, number> = {};
    // We estimate from the categories array structure
    // Each AMC lists its categories, but we need actual scheme counts
    // Use the total scheme count distribution
    for (const cat of MAIN_CATEGORIES) {
      let total = 0;
      for (const amc of apiData.amcs) {
        for (const amcCat of amc.categories) {
          if (cat.amfiPrefixes.some(p => amcCat.startsWith(p) || amcCat === p)) {
            // Estimate: each AMC typically has 3-10 schemes per category
            total += 1; // will be counted as AMC presence, not exact scheme count
          }
        }
      }
      counts[cat.id] = total;
    }
    return counts;
  }, [apiData]);

  // ── Sorted fund list ──
  const sortedFunds = useMemo(() => {
    const list = [...fundListData];
    switch (sortBy) {
      case "nav-high": return list.sort((a, b) => b.nav - a.nav);
      case "nav-low": return list.sort((a, b) => a.nav - b.nav);
      case "amc": return list.sort((a, b) => a.amcName.localeCompare(b.amcName));
      default: return list.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
    }
  }, [fundListData, sortBy]);

  // ── AMC list sorted ──
  const sortedAMCs = useMemo(() => {
    if (!apiData?.amcs) return [];
    let list = apiData.amcs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || (a.parentCompany?.toLowerCase().includes(q)));
    }
    return [...list].sort((a, b) => (b.aumNumeric || 0) - (a.aumNumeric || 0));
  }, [apiData, search]);

  // ── AMC detail filtered schemes ──
  const filteredAmcSchemes = useMemo(() => {
    if (!amcDetail?.schemesByCategory) return {};
    if (!schemeSearch.trim()) return amcDetail.schemesByCategory;
    const q = schemeSearch.toLowerCase();
    const filtered: Record<string, AMFIScheme[]> = {};
    for (const [cat, schemes] of Object.entries(amcDetail.schemesByCategory)) {
      const matched = schemes.filter(s => s.schemeName.toLowerCase().includes(q));
      if (matched.length) filtered[cat] = matched;
    }
    return filtered;
  }, [amcDetail, schemeSearch]);

  // ── Navigation helpers ──
  const goHome = () => { setView("home"); setSelectedCatId(null); setSelectedSubcat(null); setSearch(""); setAmcFilter(""); setSelectedAMCSlug(null); };
  const goCategory = (catId: string) => { setView("subcategory"); setSelectedCatId(catId); setSearch(""); };
  const goFundList = (sub: SubcategoryDef) => { setView("fundlist"); setSelectedSubcat(sub); setSearch(""); setAmcFilter(""); };
  const goAMCs = () => { setView("amcs"); setSelectedAMCSlug(null); setSearch(""); };
  const goAMCDetail = (slug: string) => { setView("amcs"); setSelectedAMCSlug(slug); setSchemeSearch(""); };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); } catch { return iso; }
  };

  const activeCat = MAIN_CATEGORIES.find(c => c.id === selectedCatId);
  const subcats = selectedCatId ? SUBCATEGORY_MAP[selectedCatId] || [] : [];

  const makeFundSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[()&,.'\/]/g, "").replace(/-+/g, "-").slice(0, 80);

  // ═══ RENDER ═══
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-obsidian)", color: "var(--text-primary)" }}>

      {/* ═══ TOP HEADER ═══ */}
      <header style={{
        background: "var(--bg-obsidian)", padding: "12px 32px",
        borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/analyze" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.66rem", fontWeight: 600, padding: "4px 10px", borderRadius: 5, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>← Dashboard</Link>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: -0.5, cursor: "pointer" }} onClick={goHome}>Mutual Fund Intelligence</span>
              <LiveDot />
            </div>
            {apiData && (
              <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginTop: 1, display: "flex", gap: 6, alignItems: "center" }}>
                <span>{apiData.totalAMCs} AMCs · {apiData.totalSchemes.toLocaleString()} Schemes</span>
                <SourceBadge source="AMFI" date={apiData.industry.navDate} />
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumb / Tab navigation */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg-slate)", borderRadius: 7, padding: 2 }}>
          <button onClick={goHome} style={{ padding: "5px 14px", borderRadius: 5, border: "none", cursor: "pointer", fontSize: "0.66rem", fontWeight: 600, background: view === "home" || view === "subcategory" || view === "fundlist" ? "var(--accent)" : "transparent", color: view === "home" || view === "subcategory" || view === "fundlist" ? "#fff" : "var(--text-secondary)" }}>Categories</button>
          <button onClick={goAMCs} style={{ padding: "5px 14px", borderRadius: 5, border: "none", cursor: "pointer", fontSize: "0.66rem", fontWeight: 600, background: view === "amcs" ? "var(--accent)" : "transparent", color: view === "amcs" ? "#fff" : "var(--text-secondary)" }}>AMCs</button>
        </div>
      </header>

      {loading && <LoadingBar />}

      {/* ═══════════════════════════════════════
         VIEW: HOME — Category Grid + Industry Stats
         ═══════════════════════════════════════ */}
      {!loading && view === "home" && apiData && (
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 32px 80px" }}>

          {/* ── Industry Overview Bar ── */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-slate))", borderRadius: 14, padding: "20px 28px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.76rem", fontWeight: 800 }}>Indian Mutual Fund Industry</span>
                  <LiveDot size={6} />
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <SourceBadge source="AMFI India" />
                  <SourceBadge source="SEBI Registered" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {[
                  { l: "Industry AUM", v: apiData.industry.totalAUM, s: "Source: AMFI Reports", c: "var(--success)" },
                  { l: "Total AMCs", v: String(apiData.industry.liveAMCCount), s: "SEBI Registered", c: "var(--accent)" },
                  { l: "Total Schemes", v: apiData.industry.liveSchemeCount.toLocaleString(), s: "Open & Close Ended", c: "var(--accent)" },
                  { l: "Monthly SIP", v: apiData.industry.monthlySIPFlows, s: apiData.industry.sipFlowsMonth, c: "var(--warning)" },
                  { l: "Total Folios", v: apiData.industry.totalFolios, s: "Active investor accounts", c: "var(--accent)" },
                  { l: "NAV Updated", v: apiData.industry.navDate || "—", s: `${formatTime(apiData.industry.lastFetched)}`, c: "var(--text-primary)" },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.44rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{s.l}</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: "0.42rem", color: "var(--text-muted)", marginTop: 1 }}>{s.s}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── AI Insight Banner ── */}
          <div style={{
            marginBottom: 24, padding: "14px 20px", borderRadius: 10,
            background: "linear-gradient(135deg, rgba(74,158,255,0.06), rgba(168,85,247,0.06))",
            border: "1px solid rgba(74,158,255,0.1)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: "1.3rem" }}>🧠</span>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>White Tiger AI Insight</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Start by choosing a category below. Each category has AI-powered analysis to help you understand risk, suitability, and expected returns before you pick a fund.
              </div>
            </div>
          </div>

          {/* ── Category Grid ── */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, marginBottom: 4 }}>Explore by Category</div>
            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>All {apiData.totalSchemes.toLocaleString()} SEBI-registered mutual fund schemes organized by type</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {MAIN_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => goCategory(cat.id)} style={{
                background: cat.gradient, borderRadius: 12, padding: "22px 24px",
                border: `1px solid ${cat.color}22`, textAlign: "left", cursor: "pointer",
                transition: "all 0.2s", position: "relative",
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = cat.color + "55"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}15`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = cat.color + "22"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: "1.6rem", display: "block", marginBottom: 6 }}>{cat.icon}</span>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>{cat.label}</div>
                  </div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: cat.color, opacity: 0.9 }}>
                    {(SUBCATEGORY_MAP[cat.id] || []).length}
                    <div style={{ fontSize: "0.42rem", fontWeight: 600, color: "var(--text-muted)" }}>subcategories</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 10 }}>{cat.description}</div>

                {/* AI tip */}
                <div style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: "0.48rem", fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>🧠 AI Insight</div>
                  <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{cat.aiInsight}</div>
                </div>

                {/* Arrow */}
                <div style={{ position: "absolute", right: 16, bottom: 16, fontSize: "0.8rem", color: cat.color, opacity: 0.5 }}>→</div>
              </button>
            ))}
          </div>

          {/* ── Quick AMC Leaderboard ── */}
          <section style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>Top AMCs by AUM</div>
                <div style={{ fontSize: "0.54rem", color: "var(--text-muted)" }}>Click any AMC for complete scheme listing</div>
              </div>
              <button onClick={goAMCs} style={{ padding: "5px 14px", borderRadius: 5, border: "1px solid var(--border)", background: "transparent", color: "var(--accent)", fontSize: "0.62rem", fontWeight: 700, cursor: "pointer" }}>View All AMCs →</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {sortedAMCs.filter(a => a.aumNumeric).slice(0, 8).map(amc => (
                <button key={amc.slug} onClick={() => goAMCDetail(amc.slug)} style={{
                  background: "var(--bg-card)", borderRadius: 10, padding: "14px 16px",
                  border: "1px solid var(--border)", textAlign: "left", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(74,158,255,0.2)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{amc.name.replace(" Mutual Fund", "")}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--success)" }}>{amc.aumEstimate}</span>
                    <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>{amc.schemeCount} schemes</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <div style={{ marginTop: 28, padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", fontSize: "0.48rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            <strong>Data Sources:</strong> NAV data from AMFI India (amfiindia.com). AUM and market share from AMFI monthly reports. Category classification per SEBI MF guidelines.
            Mutual fund investments are subject to market risks. Past performance does not guarantee future results. Read scheme documents carefully. White Tiger is a research platform.
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         VIEW: SUBCATEGORY — List of subcategories
         ═══════════════════════════════════════ */}
      {!loading && view === "subcategory" && activeCat && (
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 32px 80px" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            <button onClick={goHome} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.66rem", fontWeight: 600 }}>All Categories</button>
            <span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>›</span>
            <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "var(--text-primary)" }}>{activeCat.label}</span>
          </div>

          {/* Category Header */}
          <div style={{ marginBottom: 24, padding: "22px 28px", borderRadius: 14, background: activeCat.gradient, border: `1px solid ${activeCat.color}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: "2.2rem" }}>{activeCat.icon}</span>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: -0.5 }}>{activeCat.label}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 4 }}>{activeCat.description}</div>
                <div style={{ marginTop: 8, padding: "6px 12px", borderRadius: 6, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", display: "inline-block" }}>
                  <span style={{ fontSize: "0.5rem", fontWeight: 700, color: activeCat.color }}>🧠 AI INSIGHT: </span>
                  <span style={{ fontSize: "0.54rem", color: "var(--text-secondary)" }}>{activeCat.aiInsight}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subcategory Grid */}
          <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>
            {subcats.length} Subcategories
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10 }}>
            {subcats.map(sub => (
              <button key={sub.amfiKey} onClick={() => goFundList(sub)} style={{
                background: "var(--bg-card)", borderRadius: 12, padding: "18px 22px",
                border: "1px solid var(--border)", textAlign: "left", cursor: "pointer",
                transition: "all 0.2s", display: "flex", gap: 14, alignItems: "flex-start",
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = activeCat.color + "44"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; e.currentTarget.style.transform = "none"; }}>

                <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{sub.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)" }}>{sub.label}</div>
                    <span style={{
                      fontSize: "0.48rem", fontWeight: 700, padding: "2px 7px", borderRadius: 3,
                      background: sub.riskLevel.includes("Low") ? "rgba(52,211,153,0.1)" : sub.riskLevel.includes("Very High") ? "rgba(248,113,113,0.1)" : sub.riskLevel.includes("High") ? "rgba(251,191,36,0.1)" : "rgba(140,153,176,0.08)",
                      color: sub.riskLevel.includes("Low") ? "var(--success)" : sub.riskLevel.includes("Very High") ? "var(--danger)" : sub.riskLevel.includes("High") ? "var(--warning)" : "var(--text-muted)",
                    }}>{sub.riskLevel} Risk</span>
                  </div>
                  <div style={{ fontSize: "0.56rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 6 }}>{sub.aiTip}</div>
                  <div style={{ fontSize: "0.52rem", color: activeCat.color, fontWeight: 600 }}>View all funds →</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         VIEW: FUND LIST — All funds in subcategory
         ═══════════════════════════════════════ */}
      {!loading && view === "fundlist" && selectedSubcat && activeCat && (
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 32px 80px" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={goHome} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.64rem", fontWeight: 600 }}>Categories</button>
            <span style={{ color: "var(--text-muted)", fontSize: "0.58rem" }}>›</span>
            <button onClick={() => goCategory(activeCat.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.64rem", fontWeight: 600 }}>{activeCat.label}</button>
            <span style={{ color: "var(--text-muted)", fontSize: "0.58rem" }}>›</span>
            <span style={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--text-primary)" }}>{selectedSubcat.label}</span>
          </div>

          {/* Subcategory header */}
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: "1.6rem" }}>{selectedSubcat.icon}</span>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 900, margin: 0, letterSpacing: -0.3 }}>{selectedSubcat.label} Funds</h1>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <span style={{
                  fontSize: "0.5rem", fontWeight: 700, padding: "2px 8px", borderRadius: 3,
                  background: selectedSubcat.riskLevel.includes("Low") ? "rgba(52,211,153,0.1)" : selectedSubcat.riskLevel.includes("Very High") ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                  color: selectedSubcat.riskLevel.includes("Low") ? "var(--success)" : selectedSubcat.riskLevel.includes("Very High") ? "var(--danger)" : "var(--warning)",
                }}>{selectedSubcat.riskLevel} Risk</span>
                <span style={{ fontSize: "0.56rem", color: "var(--text-muted)" }}>{fundListTotal} schemes found</span>
                <SourceBadge source="AMFI Live" />
              </div>
            </div>
          </div>

          {/* AI Insight for subcategory */}
          <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 8, background: "rgba(74,158,255,0.04)", border: "1px solid rgba(74,158,255,0.08)" }}>
            <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "var(--accent)" }}>🧠 AI: </span>
            <span style={{ fontSize: "0.58rem", color: "var(--text-secondary)" }}>{selectedSubcat.aiTip}</span>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fund name..."
              style={{ flex: 1, minWidth: 200, maxWidth: 360, padding: "7px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.68rem", outline: "none" }} />
            <input value={amcFilter} onChange={e => setAmcFilter(e.target.value)} placeholder="Filter by AMC..."
              style={{ width: 200, padding: "7px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.68rem", outline: "none" }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.66rem", outline: "none", cursor: "pointer" }}>
              <option value="name">Sort: Name</option>
              <option value="nav-high">Sort: NAV (High→Low)</option>
              <option value="nav-low">Sort: NAV (Low→High)</option>
              <option value="amc">Sort: AMC</option>
            </select>
          </div>

          {/* Fund Table */}
          {fundListLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: "0.72rem" }}>Loading {selectedSubcat.label} funds from AMFI...</div>
            </div>
          ) : (
            <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Fund Name", "AMC", "NAV", "NAV Date", "Code"].map(h => (
                      <th key={h} style={{ textAlign: h === "NAV" || h === "Code" ? "right" : "left", padding: "10px 14px", fontSize: "0.52rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4, background: "rgba(0,0,0,0.15)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedFunds.map((s, idx) => (
                    <tr key={`${s.schemeCode}-${idx}`} style={{ borderBottom: "1px solid rgba(232,237,245,0.04)" }}
                      onMouseOver={e => (e.currentTarget.style.background = "rgba(74,158,255,0.03)")}
                      onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "10px 14px", maxWidth: 400 }}>
                        <Link href={`/mf-intelligence/${makeFundSlug(s.schemeName)}`} style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.68rem", fontWeight: 600, lineHeight: 1.4, display: "block" }}>
                          {s.schemeName}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "0.58rem", color: "var(--text-muted)" }}>{s.amcName.replace(" Mutual Fund", "")}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: "0.74rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono, monospace)" }}>₹{s.nav.toFixed(4)}</td>
                      <td style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.54rem", color: "var(--text-muted)" }}>{s.navDate}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontSize: "0.56rem", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>{s.schemeCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedFunds.length === 0 && !fundListLoading && (
                <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "1.2rem", marginBottom: 6 }}>🔍</div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700 }}>No funds match your filters</div>
                  <div style={{ fontSize: "0.58rem", marginTop: 4 }}>Try adjusting search or AMC filter</div>
                </div>
              )}
            </div>
          )}
          {sortedFunds.length > 0 && (
            <div style={{ marginTop: 10, fontSize: "0.52rem", color: "var(--text-muted)", textAlign: "center" }}>
              Showing {sortedFunds.length} of {fundListTotal} schemes · Data from AMFI India
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
         VIEW: AMCs — Directory + Detail
         ═══════════════════════════════════════ */}
      {!loading && view === "amcs" && apiData && (
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 32px 80px" }}>

          {/* AMC List */}
          {!selectedAMCSlug && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 900 }}>All AMCs ({apiData.totalAMCs})</div>
                  <div style={{ fontSize: "0.56rem", color: "var(--text-muted)" }}>SEBI-registered Asset Management Companies from AMFI</div>
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search AMCs..."
                  style={{ width: 260, padding: "7px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.68rem", outline: "none" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 10 }}>
                {sortedAMCs.map(amc => (
                  <button key={amc.slug} onClick={() => goAMCDetail(amc.slug)} style={{
                    background: "var(--bg-card)", borderRadius: 12, padding: "18px 20px",
                    border: "1px solid var(--border)", textAlign: "left", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(74,158,255,0.2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(232,237,245,0.08)"; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>{amc.name}</div>
                        {amc.parentCompany && <div style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>{amc.parentCompany}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--accent)" }}>{amc.schemeCount}</div>
                        <div style={{ fontSize: "0.42rem", color: "var(--text-muted)", fontWeight: 600 }}>SCHEMES</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      {amc.aumEstimate && <span style={{ fontSize: "0.56rem", fontWeight: 700, color: "var(--success)" }}>{amc.aumEstimate}</span>}
                      {amc.category && <span style={{ fontSize: "0.44rem", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: amc.category === "Large" ? "rgba(74,158,255,0.1)" : amc.category === "Boutique" ? "rgba(168,85,247,0.1)" : "rgba(140,153,176,0.08)", color: amc.category === "Large" ? "var(--accent)" : amc.category === "Boutique" ? "#c084fc" : "var(--text-muted)" }}>{amc.category}</span>}
                      {amc.ceo && <span style={{ fontSize: "0.46rem", color: "var(--text-muted)" }}>CEO: {amc.ceo}</span>}
                    </div>
                    {/* Scheme breakdown bar */}
                    <div style={{ display: "flex", height: 3, borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
                      {amc.equitySchemes > 0 && <div style={{ flex: amc.equitySchemes, background: "var(--accent)" }} />}
                      {amc.debtSchemes > 0 && <div style={{ flex: amc.debtSchemes, background: "var(--success)" }} />}
                      {amc.hybridSchemes > 0 && <div style={{ flex: amc.hybridSchemes, background: "var(--warning)" }} />}
                      {amc.indexSchemes > 0 && <div style={{ flex: amc.indexSchemes, background: "#c084fc" }} />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* AMC Detail */}
          {selectedAMCSlug && (
            <>
              {amcDetailLoading ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>Loading AMC data from AMFI...</div>
              ) : amcDetail ? (
                <>
                  {/* Header */}
                  <div style={{ padding: "20px 24px", borderRadius: 14, background: "linear-gradient(135deg, var(--bg-card), var(--bg-slate))", border: "1px solid var(--border)", marginBottom: 20 }}>
                    <button onClick={() => setSelectedAMCSlug(null)} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: "0.66rem", fontWeight: 600, marginBottom: 10, display: "block" }}>← All AMCs</button>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>{amcDetail.amc.name}</h1>
                        <div style={{ fontSize: "0.66rem", color: "var(--text-secondary)", marginTop: 4 }}>
                          {[amcDetail.amc.parentCompany, amcDetail.amc.ownershipStructure, amcDetail.totalSchemes + " schemes"].filter(Boolean).join(" · ")}
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                          {amcDetail.amc.aumEstimate && <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(52,211,153,0.08)", color: "var(--success)" }}>AUM: {amcDetail.amc.aumEstimate}</span>}
                          {amcDetail.amc.category && <span style={{ fontSize: "0.52rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(74,158,255,0.08)", color: "var(--accent)" }}>{amcDetail.amc.category} AMC</span>}
                          <SourceBadge source="AMFI" date={amcDetail.amc.lastUpdated} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent)" }}>{amcDetail.totalSchemes}</div>
                        <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL SCHEMES</div>
                      </div>
                    </div>
                  </div>

                  {/* Key metrics */}
                  {(amcDetail.amc.ceo || amcDetail.amc.cio || amcDetail.amc.marketSharePct) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 8, marginBottom: 18 }}>
                      {amcDetail.amc.ceo && <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}><div style={{ fontSize: "0.42rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>CEO</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{amcDetail.amc.ceo}</div></div>}
                      {amcDetail.amc.cio && <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}><div style={{ fontSize: "0.42rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>CIO</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{amcDetail.amc.cio}</div></div>}
                      {amcDetail.amc.marketSharePct !== undefined && <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}><div style={{ fontSize: "0.42rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Mkt Share</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)", marginTop: 2 }}>{amcDetail.amc.marketSharePct}%</div></div>}
                      {amcDetail.amc.founded && <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--border)" }}><div style={{ fontSize: "0.42rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Founded</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{amcDetail.amc.founded}</div></div>}
                    </div>
                  )}

                  {/* Strengths/Weaknesses */}
                  {(amcDetail.amc.strengths || amcDetail.amc.weaknesses) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                      {amcDetail.amc.strengths && (
                        <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: "0.64rem", fontWeight: 800, color: "var(--success)", marginBottom: 6 }}>Strengths</div>
                          {amcDetail.amc.strengths.map((s, i) => <div key={i} style={{ fontSize: "0.6rem", color: "var(--text-secondary)", marginBottom: 3, display: "flex", gap: 4 }}><span style={{ color: "var(--success)" }}>✓</span> {s}</div>)}
                        </div>
                      )}
                      {amcDetail.amc.weaknesses && (
                        <div style={{ background: "var(--bg-card)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: "0.64rem", fontWeight: 800, color: "var(--danger)", marginBottom: 6 }}>Watch Points</div>
                          {amcDetail.amc.weaknesses.map((w, i) => <div key={i} style={{ fontSize: "0.6rem", color: "var(--text-secondary)", marginBottom: 3, display: "flex", gap: 4 }}><span style={{ color: "var(--danger)" }}>⚠</span> {w}</div>)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Schemes */}
                  <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: "18px 20px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>All Schemes</div>
                      <input value={schemeSearch} onChange={e => setSchemeSearch(e.target.value)} placeholder="Search schemes..."
                        style={{ width: 240, padding: "6px 12px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg-slate)", color: "var(--text-primary)", fontSize: "0.64rem", outline: "none" }} />
                    </div>
                    {Object.entries(filteredAmcSchemes).map(([cat, schemes]) => {
                      const displayCat = cat.replace(/^Equity Scheme - |^Debt Scheme - |^Hybrid Scheme - |^Other Scheme - |^Solution Oriented Scheme - /gi, "");
                      return (
                        <div key={cat} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5, paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>{displayCat} ({schemes.length})</div>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                              {schemes.slice(0, 30).map(s => (
                                <tr key={s.schemeCode} style={{ borderBottom: "1px solid rgba(232,237,245,0.03)" }}
                                  onMouseOver={e => (e.currentTarget.style.background = "rgba(74,158,255,0.02)")}
                                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                                  <td style={{ padding: "7px 10px" }}>
                                    <Link href={`/mf-intelligence/${makeFundSlug(s.schemeName)}`} style={{ textDecoration: "none", color: "var(--text-primary)", fontSize: "0.64rem", fontWeight: 600 }}>{s.schemeName}</Link>
                                  </td>
                                  <td style={{ padding: "7px 10px", textAlign: "right", fontSize: "0.68rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>₹{s.nav.toFixed(4)}</td>
                                  <td style={{ padding: "7px 10px", textAlign: "right", fontSize: "0.5rem", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>{s.schemeCode}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {schemes.length > 30 && <div style={{ textAlign: "center", padding: "4px 0", fontSize: "0.52rem", color: "var(--text-muted)" }}>+ {schemes.length - 30} more</div>}
                        </div>
                      );
                    })}
                    {Object.keys(filteredAmcSchemes).length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: "0.72rem" }}>No schemes match</div>}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "0.82rem" }}>AMC not found</div>
                  <button onClick={() => setSelectedAMCSlug(null)} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 5, border: "none", cursor: "pointer", background: "var(--accent)", color: "#fff", fontSize: "0.68rem", fontWeight: 700 }}>Back</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
