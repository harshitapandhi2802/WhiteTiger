"use client";
import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, TrendingDown, Brain, Zap, Shield, Target,
  BarChart3, Globe, Users, AlertTriangle, ChevronDown, ChevronRight,
  Activity, Eye, Crosshair, Flame, Layers, MessageSquare, Sparkles,
  BookOpen, DollarSign, PieChart, Lock, Unlock, Radio, Lightbulb, ArrowUpRight,
  CheckCircle, XCircle, Info, Clock, History, ThumbsUp, ThumbsDown,
  Award, Database, FileWarning,
} from "lucide-react";
import { findStock } from "@/lib/stocks";
import dynamicImport from "next/dynamic";

// BI Suite loaded on demand (large component, only renders when stock page opens)
const BusinessIntelligenceSuite = dynamicImport(() => import("@/components/stocks/BusinessIntelligenceSuite").then(m => ({ default: m.BusinessIntelligenceSuite })), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */
interface StockData {
  success: boolean; symbol: string; companyName: string; sector: string; industry: string;
  source: string; generatedAt: string;
  fundamentalsProvenance?: { priceSource: string; priceAsOf: string | null; fundamentalsSource: string; fundamentalsAsOf: string; note: string };
  hero: { cmp: number; changePercent: number; volume: number | null; mcap: number | null; pe: number | null; pb: number | null; eps: number | null; bookValue: number | null; divYield: number | null; weekHigh52: number | null; weekLow52: number | null; faceValue: number | null };
  error?: string; message?: string;
  provenance?: { quote: { source: string; asOf: string; symbol: string }; technicals: { source: string } | null; illustrative: string[] };
  sentiment: { label: string; confidence: number };
  aiScores: { overallScore: number; qualityScore: number; valuationScore: number; momentumScore: number; growthScore: number; riskScore: number };
  analystConsensus: { rating: string; targetPrice: number; analystCount: number; upside: number };
  fairValue: { dcfValue: number; upside: number; method: string };
  fundamentals: { revenue: number; pat: number; ebitdaMargin: number; grossMargin?: number; ebitMargin?: number; patMargin?: number; roe: number; roce: number; debtEquity: number; promoterHolding: number; fiiHolding: number; diiHolding: number; publicHolding: number };
  technicals: { rsi: number | null; macd: number | null; sma20: number | null; sma50: number | null; sma200: number | null; atr: number | null; support: number | null; resistance: number | null };
  priceDrivers: { driver: string; detail: string; direction: string }[];
  peerComparison: { symbol: string; pe: number; pb: number; roe: number; mcap: number }[];
  returns: Record<string, number>;
  quarterlyResults: { quarter: string; revenue: number; pat: number; ebitdaMargin: number; epsGrowth: number }[];
  newsEvents: { title: string; date: string; impact: string; severity: string }[];
  shareholdingTrend: { quarter: string; promoter: number; fii: number; dii: number; public: number }[];
  revenueBreakdown?: { segments: { name: string; share: number; growth: number }[]; geography: { region: string; share: number }[] };
  marginAnalysis?: { current: { grossMargin: number; ebitdaMargin: number; ebitMargin: number; patMargin: number }; trend: { year: string; grossMargin: number; ebitdaMargin: number; patMargin: number }[] };
  annualFinancials?: { year: string; revenue: number; ebitda: number; pat: number; eps: number; revenueGrowth: number; patGrowth: number }[];
  returnRatios?: { roe: number; roce: number; roic: number; rota: number; assetTurnover: number; capitalTurnover: number; incrementalRoce: number; spreadOverCoC: number; costOfEquity: number; wacc: number };
  balanceSheet?: { totalDebt: number; cash: number; netDebt: number; netWorth: number; longTermDebt: number; shortTermDebt: number; debtEquity: number; netDebtEbitda: number; interestCoverage: number; currentRatio: number; quickRatio: number; tangibleBookValue: number; contingentLiabilities: number; goodwill: number };
  cashFlows?: { cfo: number; capex: number; fcf: number; fcfYield: number; maintenanceCapex: number; growthCapex: number; dividendPaid: number; buybacks: number; cashConversion: number; capexIntensity: number; fcfMargin: number; cfoPat: number; trend: { year: string; cfo: number; capex: number; fcf: number }[] };
  workingCapital?: { receivableDays: number; payableDays: number; inventoryDays: number; ccc: number; wcAsRevenue: number; trend: { year: string; receivableDays: number; payableDays: number; inventoryDays: number }[] };
  dcfValuation?: { wacc: number; terminalGrowth: number; beta: number; riskFreeRate: number; erp: number; fcfProjections: { year: string; fcf: number; pvFcf: number }[]; terminalValue: number; pvTerminal: number; enterpriseValue: number; equityValue: number; sharesOutstanding: number; intrinsicValue: number; upside: number; sensitivity: { wacc: number; tg: number; value: number }[] };
  relativeValuation?: { currentPe: number; forwardPe: number; sectorAvgPe: number; histAvgPe: number; evEbitda: number; evSales: number; pegRatio: number; priceToFcf: number; premiumDiscount: number; historicalBands: { low: number; avg: number; high: number }; peersComparison: { symbol: string; pe: number; pb: number; roe: number; mcap: number; evEbitda: number; pegRatio: number; fcfYield: number }[] };
  scenarios?: { bull: ScenarioCase; base: ScenarioCase; bear: ScenarioCase };
  stressTests?: { scenario: string; epsImpact: number; priceImpact: number; bsResilience: string }[];
  earningsQuality?: { cashConversionScore: number; accountingQualityScore: number; revenueQualityScore: number; earningsPersistenceScore: number; overallEarningsScore: number; financialStrengthScore: number; cfoPATRatio: number; accrualRatio: number; otherIncomeShare: number; exceptionalItems: number; relatedPartyTransactions: string; auditorObservations: string; flags: string[] };
  reRatingCatalysts?: { upsideCatalysts: string[]; downsideRisks: string[]; multipeExpansionPotential: number; institutionalOwnershipTrend: string; governanceScore: number };
  investmentConclusion?: { fairValueLow: number; fairValueMid: number; fairValueHigh: number; marginOfSafety: number; riskRewardRatio: string; expectedReturn12M: number; downsideRisk: number; view: string; keyMonitorables: string[] };
  // AI Workflow Engine
  aiCopilot?: { narrative: string; movementReasons: { technical: string[]; macro: string[]; institutional: string[]; sentiment: string[] } };
  smartMoney?: { accumulationDistribution: string; adSignal: string; blockDeals: { date: string; quantity: string; value: string; buyer: string; type: "Buy" | "Sell" }[]; deliveryData: { avgDeliveryPercent: number; todayDelivery: number; volumeVsAvg: number; interpretation: string }; derivativesPosition: { futuresOI: string; oiChange: string; putCallRatio: number; maxPainStrike: number; interpretation: string }; insiderActivity: { who: string; action: string; shares: string; date: string }[] };
  aiRiskEngine?: { overallRiskLevel: string; riskBreakdown: { category: string; level: string; score: number; detail: string }[]; worstCaseDrawdown: number; recoveryTime: string; hedgingSuggestion: string };
  aiOpportunityEngine?: { opportunityType: string; conviction: string; timeHorizon: string; idealEntryZone: string; targetZone: string; stopLoss: string; positionSizing: string; thesis: string; sectorRotationSignal: string };
  earningsIntelligence?: { lastQuarterSummary: string; managementCommentary: string[]; earningsSurpriseHistory: { quarter: string; surprise: number }[]; nextEarningsDate: string; consensusEPS: number; epsRevisionTrend: string };
  geopoliticalImpact?: { commodityExposure: { commodity: string; currentPrice: string; impact: string; severity: string }[]; geopoliticalRisks: { event: string; impact: string; probability: string }[]; currencyImpact: { usdInr: number; direction: string; impact: string }; interestRateImpact: { repoRate: string; outlook: string; impact: string } };
  // Trust Intelligence Layer
  whiteTigerScore?: { overall: number; label: string; breakdown: { macro: number; technicals: number; sentiment: number; valuation: number; institutional: number; risk: number }; weights: string };
  sourceAttribution?: { priceSource: string; priceVerified: boolean; fundamentalsSource: string; analysisEngine: string; dataTimestamp: string; dataSources: string[]; disclaimer: string };
  analysisRisks?: { risk: string; detail: string; severity: string }[];
  actionability?: { score: string; label: string; color: string; detail: string };
  marketMemory?: { event: string; context: string; relevance: string }[];
  confidenceBreakdown?: { overall: number; dataQuality: number; historicalAccuracy: number; macroAlignment: number; volatilityAdjusted: number; newsConfirmation: number; sentimentConsistency: number; level: string };
  analysisReasoning?: { bullishFactors: string[]; bearishFactors: string[]; neutralFactors: string[] };
  analysisVersion?: string;
  trustFeatures?: string[];
}
interface ScenarioCase { probability: number; eps: number; pe: number; targetPrice: number; narrative: string }

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
/** Formats a live figure; null/undefined/NaN render as an em dash, never as a guess. */
function fmtNum(v: number | null | undefined, f: (n: number) => string): string {
  return typeof v === "number" && Number.isFinite(v) ? f(v) : "—";
}

const WITHHELD_COPY: Record<string, string> = {
  copilot: "AI narrative for this stock",
  trust: "White Tiger composite score",
  movement: "Drivers behind today's move",
  smartmoney: "Institutional & derivatives positioning",
  risk: "Risk assessment",
  opportunity: "Entry, target and stop-loss zones",
  earnings: "Earnings-quality analysis",
  geopolitical: "Macro and geopolitical exposure",
  fundamentals: "Reported financials, shareholding and news",
  valuation: "DCF, relative valuation and scenarios",
  technicals: "Technical indicators",
};

/** Shown instead of a section whose data is not yet connected to a verified source. */
function WithheldSection({ id }: { id: string }) {
  return (
    <div style={{ border: "1px dashed #d1d5db", borderRadius: 12, padding: "18px 20px", background: "#fafafa" }}>
      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151" }}>{WITHHELD_COPY[id] ?? "This section"} — coming soon</div>
      <div style={{ fontSize: "0.74rem", color: "#6b7280", marginTop: 4, lineHeight: 1.5 }}>
        We&apos;ll show this once it&apos;s connected to verified company and exchange data. Until then we don&apos;t display estimated figures for real companies.
      </div>
    </div>
  );
}

function pointerText(value: number, type: string): string {
  switch (type) {
    case "pe": return value < 15 ? "Attractively valued relative to earnings" : value < 25 ? "Fairly priced for the growth delivered" : value < 40 ? "Premium valuation — market expects high growth" : "Expensive — needs sustained earnings acceleration to justify";
    case "pb": return value < 1 ? "Trading below book — potential deep value or distress" : value < 3 ? "Reasonable price relative to net assets" : "High premium to book — intangible value dominant";
    case "roe": return value > 20 ? "Excellent capital efficiency — generates strong shareholder returns" : value > 12 ? "Adequate returns on equity — in line with cost of capital" : "Below-par returns — capital not being deployed efficiently";
    case "roce": return value > 20 ? "Superior capital allocation — business earns well above its cost" : value > 12 ? "Decent returns on total capital employed" : "Weak returns — may be destroying value for stakeholders";
    case "de": return value < 0.1 ? "Virtually debt-free — strong balance sheet" : value < 0.5 ? "Conservative leverage — comfortable debt servicing" : value < 1 ? "Moderate leverage — manageable but monitor in downturns" : "Highly leveraged — vulnerable to rate hikes and cash flow disruption";
    case "rsi": return value > 70 ? "Overbought — momentum stretched, potential pullback ahead" : value < 30 ? "Oversold — selling exhaustion, may see mean reversion" : "Neutral momentum — no extreme directional signal";
    case "divyield": return value > 3 ? "Attractive dividend income — management returning cash to shareholders" : value > 1 ? "Moderate payout — balanced between growth reinvestment and distributions" : "Minimal/no dividend — profits retained for reinvestment";
    case "margin": return value > 25 ? "High-margin business with strong pricing power" : value > 15 ? "Healthy margins indicative of competitive advantage" : "Thin margins — operationally leveraged, sensitive to cost pressures";
    default: return "";
  }
}

/* ═══════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function ConfidenceMeter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color }}>{value}%</span>
        </div>
        <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${value}%`, height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 3, transition: "width 1.5s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
      </div>
    </div>
  );
}

function AIInsightCard({ icon, title, children, accentColor = "#6366f1", defaultOpen = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; accentColor?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", transition: "box-shadow 0.3s", boxShadow: open ? "0 4px 24px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accentColor}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a2e" }}>{title}</div>
        </div>
        <div style={{ color: "#9ca3af", transition: "transform 0.3s", transform: open ? "rotate(90deg)" : "none" }}>
          <ChevronRight size={16} />
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 22px 22px", borderTop: `1px solid ${accentColor}15` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "2px solid #1a1a2e", display: "flex", alignItems: "flex-start", gap: 12 }}>
      {icon && <div style={{ color: "#6366f1", marginTop: 2 }}>{icon}</div>}
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "0.78rem", color: "#6b7280", margin: "4px 0 0", lineHeight: 1.4 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Low: { bg: "#f0fdf4", text: "#059669" },
    Moderate: { bg: "#fffbeb", text: "#d97706" },
    High: { bg: "#fef2f2", text: "#dc2626" },
    strong: { bg: "#f0fdf4", text: "#059669" },
    moderate: { bg: "#fffbeb", text: "#d97706" },
    weak: { bg: "#fef2f2", text: "#dc2626" },
  };
  const c = colors[level] || colors["Moderate"];
  return (
    <span style={{ padding: "3px 10px", borderRadius: 5, fontSize: "0.68rem", fontWeight: 700, background: c.bg, color: c.text, textTransform: "uppercase" }}>{level}</span>
  );
}

/* ═══ Typing animation hook ═══ */
function useTypingAnimation(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(timer); setDone(true); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return { displayed, done };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  // Exact identifier match only (NSE symbol, BSE scrip code, ISIN). No fuzzy or invented fallbacks.
  const stock = findStock(symbol);
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [activeNav, setActiveNav] = useState("copilot");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!stock) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    fetch("/api/stock-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: stock.ticker, companyName: stock.name }),
    })
      .then(async r => {
        const body = await r.json().catch(() => null);
        if (r.ok || body?.error === "live_quote_unavailable") { setData(body); return; }
        // Signed out (401), monthly/daily limit (429) or a server problem: say which.
        setData(null);
        setLoadError({
          status: r.status,
          message: body?.message || body?.error || "Something went wrong while preparing this analysis.",
        });
      })
      .catch(() => setLoadError({ status: 0, message: "Couldn't reach White Tiger. Check your connection and try again." }))
      .finally(() => setLoading(false));
  }, [stock?.ticker, stock?.name, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollTo = (id: string) => {
    setActiveNav(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!stock) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>We couldn&apos;t find &ldquo;{decodeURIComponent(symbol)}&rdquo;</div>
        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", maxWidth: 420 }}>
          It isn&apos;t an NSE symbol, BSE scrip code or ISIN in our verified listing. Try searching by company name instead.
        </div>
        <a href="/analyze" style={{ marginTop: 8, color: "#818cf8", fontWeight: 600 }}>Back to search</a>
      </div>
    );
  }

  /* ═══ LOADING STATE ═══ */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <div style={{ position: "absolute", inset: 0, border: "3px solid rgba(99,102,241,0.15)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ position: "absolute", inset: 8, border: "2px solid rgba(168,85,247,0.15)", borderBottomColor: "#a855f7", borderRadius: "50%", animation: "spin 1.5s linear infinite reverse" }} />
          <Brain size={20} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#6366f1" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700, marginBottom: 6 }}>AI Analyzing {stock.name}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>Generating institutional-grade intelligence...</div>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
          {["Market Data", "Fundamentals", "Smart Money", "Risk Analysis", "Opportunities"].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0, animation: `fadeIn 0.5s ease forwards ${i * 0.4}s` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: `pulse 1.5s ease infinite ${i * 0.3}s` }} />
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{step}</span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { to { opacity: 1; } }
          @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        `}</style>
      </div>
    );
  }

  if (!data) {
    const signIn = loadError?.status === 401;
    const canRetry = !signIn && loadError?.status !== 429;
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{stock.name}</div>
        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.65)", maxWidth: 460, lineHeight: 1.55 }}>
          {loadError?.message ?? "Something went wrong while preparing this analysis."}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {signIn && <a href="/analyze" style={{ padding: "9px 16px", borderRadius: 9, background: "#4A9EFF", color: "#fff", fontWeight: 700, textDecoration: "none" }}>Sign in with Google</a>}
          {canRetry && <button onClick={() => setAttempt(a => a + 1)} style={{ padding: "9px 16px", borderRadius: 9, background: "#4A9EFF", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>Try again</button>}
          <a href="/analyze" style={{ padding: "9px 16px", color: "#818cf8", fontWeight: 600 }}>Back to search</a>
        </div>
      </div>
    );
  }

  if (data.success === false) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{stock.name}</div>
        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", maxWidth: 440 }}>
          Live market data for this security is temporarily unavailable. We don&apos;t show estimated prices, so please try again shortly.
        </div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{[stock.nseSymbol && `NSE: ${stock.nseSymbol}`, stock.bseCode && `BSE: ${stock.bseCode}`, stock.isin].filter(Boolean).join(" · ")}</div>
        <a href="/analyze" style={{ marginTop: 8, color: "#818cf8", fontWeight: 600 }}>Back to search</a>
      </div>
    );
  }

  const withheld = (id: string) => !data.provenance || data.provenance.illustrative.includes(id);
  const quoteAsOf = data.provenance ? new Date(data.provenance.quote.asOf).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null;

  const isPositive = data.hero.changePercent >= 0;

  const navItems = [
    { id: "copilot", label: "AI Copilot", icon: <Brain size={13} /> },
    { id: "trust", label: "Trust Score", icon: <Award size={13} /> },
    { id: "movement", label: "Why Moving", icon: <Zap size={13} /> },
    { id: "smartmoney", label: "Smart Money", icon: <Eye size={13} /> },
    { id: "risk", label: "Risk Engine", icon: <Shield size={13} /> },
    { id: "opportunity", label: "Opportunity", icon: <Target size={13} /> },
    { id: "earnings", label: "Earnings AI", icon: <BookOpen size={13} /> },
    { id: "geopolitical", label: "Macro/Geo", icon: <Globe size={13} /> },
    { id: "fundamentals", label: "Fundamentals", icon: <BarChart3 size={13} /> },
    { id: "valuation", label: "Valuation", icon: <DollarSign size={13} /> },
    { id: "technicals", label: "Technicals", icon: <Activity size={13} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", color: "#1a1a2e", fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}>

      {/* ═══════════════════════════════════════════
          HEADER — Premium Sticky
          ═══════════════════════════════════════════ */}
      <header style={{ background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16162a 100%)", color: "#fff", padding: "20px 40px", position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(99,102,241,0.15)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1260, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Link href="/analyze" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", transition: "color 0.2s" }}>
                <ArrowLeft size={14} /> Stocks
              </Link>
              <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{data.companyName}</span>
                  <span style={{ fontSize: "0.66rem", padding: "3px 8px", borderRadius: 5, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontWeight: 600 }}>{data.symbol}</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{[data.sector, data.industry, ...(stock.exchanges ?? []), stock.isin].filter(Boolean).join(" · ")}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* Official NSE Link */}
              <a
                href={stock.nseSymbol ? `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(stock.nseSymbol)}` : `https://www.bseindia.com/stock-share-price/${encodeURIComponent(stock.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}/${encodeURIComponent((stock.bseId || stock.bseCode || "").toLowerCase())}/${stock.bseCode}/`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", borderRadius: 8,
                  background: "rgba(41,98,255,0.12)", border: "1px solid rgba(41,98,255,0.25)",
                  color: "#93b4ff", fontSize: "0.72rem", fontWeight: 700,
                  textDecoration: "none", transition: "all 0.2s",
                }}
              >
                {stock.nseSymbol ? "NSE" : "BSE"} Official <ArrowUpRight size={12} />
              </a>
              {/* AI Sentiment Badge */}
              {!withheld("copilot") && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <Sparkles size={13} style={{ color: "#a5b4fc" }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a5b4fc" }}>AI: {data.sentiment.label}</span>
                <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)" }}>{data.sentiment.confidence}%</span>
              </div>
              )}

              {/* Price Block */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em" }}>₹{data.hero.cmp.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isPositive ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isPositive ? "+" : ""}{data.hero.changePercent.toFixed(2)}%
                </div>
                {/* D5 — price provenance */}
                {(() => {
                  const live = data.source?.startsWith("live");
                  const src = data.fundamentalsProvenance?.priceSource;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 4, fontSize: "0.56rem", fontWeight: 700 }}>
                      <span style={{ padding: "1px 6px", borderRadius: 4, background: live ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)", color: live ? "#4ade80" : "#fbbf24" }}>
                        {live ? `● LIVE${src ? ` · ${src}` : ""}` : "● EST — verify on NSE"}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* White Tiger Score Badge */}
              {data.whiteTigerScore && !withheld("trust") && (
                <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, padding: "10px 18px", textAlign: "center", minWidth: 70 }}>
                  <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>WT Score</div>
                  <div style={{ fontSize: "1rem", fontWeight: 900, color: data.whiteTigerScore.overall >= 70 ? "#4ade80" : data.whiteTigerScore.overall >= 50 ? "#fbbf24" : "#f87171", marginTop: 2 }}>
                    {data.whiteTigerScore.overall}
                  </div>
                </div>
              )}

              {/* AI View Badge — only when valuation is sourced, never from template values */}
              {/* AI BUY/SELL/HOLD badge removed (neutral research) */}
              {data.provenance && (
                <div style={{ borderRadius: 10, padding: "8px 14px", border: "1px solid rgba(255,255,255,0.12)", textAlign: "left" }}>
                  <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Live quote</div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a5b4fc", marginTop: 2 }}>{data.provenance.quote.symbol} · {quoteAsOf}</div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Pills */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)} title={withheld(n.id) ? "Coming soon" : undefined} style={{
                opacity: withheld(n.id) ? 0.45 : 1,
                display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7,
                border: "none", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, whiteSpace: "nowrap",
                background: activeNav === n.id ? "rgba(99,102,241,0.2)" : "transparent",
                color: activeNav === n.id ? "#a5b4fc" : "rgba(255,255,255,0.45)",
                transition: "all 0.2s",
              }}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT — AI-First Flow
          ═══════════════════════════════════════════ */}
      <div style={{ maxWidth: 1260, margin: "0 auto", padding: "28px 40px 80px" }}>

        {/* ════════════════════════════════════════════════════════
            SECTION 1: AI COPILOT — THE MAIN INTELLIGENCE LAYER
            ════════════════════════════════════════════════════════ */}
        <section ref={el => { sectionRefs.current["copilot"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("copilot") ? <WithheldSection id="copilot" /> : (<>
          <div style={{ background: "linear-gradient(135deg, #0f0f23, #1a1035)", borderRadius: 18, padding: "32px 36px", color: "#fff", position: "relative", overflow: "hidden" }}>
            {/* Background decoration */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
            <div style={{ position: "absolute", bottom: -40, left: "30%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={20} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.01em" }}>White Tiger AI Copilot</div>
                  <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.4)" }}>Real-time institutional intelligence for {data.companyName}</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <Radio size={10} style={{ color: "#4ade80", animation: "pulse 2s ease infinite" }} />
                  <span style={{ fontSize: "0.62rem", color: "#4ade80", fontWeight: 600 }}>LIVE</span>
                </div>
              </div>

              {/* AI Narrative — The Main Intelligence */}
              {data.aiCopilot && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "20px 24px", border: "1px solid rgba(99,102,241,0.12)", lineHeight: 1.75 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <MessageSquare size={14} style={{ color: "#a5b4fc" }} />
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.04em" }}>AI Market Narrative</span>
                    </div>
                    <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.88)", margin: 0, fontWeight: 400, letterSpacing: "0.01em" }}>
                      {data.aiCopilot.narrative}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Intelligence Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Market Cap", value: fmtNum(data.hero.mcap, n => `₹${(n / 100).toFixed(0)}K Cr`), icon: <Layers size={14} /> },
                  { label: "AI Confidence", value: `${data.sentiment.confidence}%`, icon: <Brain size={14} />, color: data.sentiment.confidence > 70 ? "#4ade80" : "#fbbf24" },
                  { label: "Risk Level", value: data.aiRiskEngine?.overallRiskLevel || "Moderate", icon: <Shield size={14} />, color: data.aiRiskEngine?.overallRiskLevel === "Low" ? "#4ade80" : data.aiRiskEngine?.overallRiskLevel === "High" ? "#f87171" : "#fbbf24" },
                  
                ].map((m, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ color: m.color || "rgba(255,255,255,0.4)" }}>{m.icon}</span>
                      <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase" }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: m.color || "#fff" }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>)}
        </section>

        {/* ════════════════════════════════════════════════════════
            TRUST INTELLIGENCE — White Tiger Score + Source + Risks
            ════════════════════════════════════════════════════════ */}
        <section ref={el => { sectionRefs.current["trust"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("trust") ? <WithheldSection id="trust" /> : (<>
          {/* ── White Tiger Score Card ── */}
          {data.whiteTigerScore && (
            <div style={{ background: "linear-gradient(135deg, #0f1628, #162040)", borderRadius: 18, padding: "28px 32px", color: "#fff", marginBottom: 18, border: "1px solid rgba(99,102,241,0.15)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
                {/* Score circle */}
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ position: "relative", width: 100, height: 100 }}>
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none"
                        stroke={data.whiteTigerScore.overall >= 70 ? "#4ade80" : data.whiteTigerScore.overall >= 50 ? "#fbbf24" : "#f87171"}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${data.whiteTigerScore.overall * 2.64} 264`}
                        transform="rotate(-90 50 50)"
                        style={{ transition: "stroke-dasharray 2s cubic-bezier(0.4,0,0.2,1)" }}
                      />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "1.6rem", fontWeight: 900, color: data.whiteTigerScore.overall >= 70 ? "#4ade80" : data.whiteTigerScore.overall >= 50 ? "#fbbf24" : "#f87171" }}>
                        {data.whiteTigerScore.overall}
                      </span>
                      <span style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>/ 100</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Award size={18} style={{ color: "#a5b4fc" }} />
                      <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>White Tiger Score</span>
                    </div>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 700,
                      padding: "4px 12px", borderRadius: 6,
                      background: data.whiteTigerScore.overall >= 70 ? "rgba(74,222,128,0.12)" : data.whiteTigerScore.overall >= 50 ? "rgba(251,191,36,0.12)" : "rgba(248,113,113,0.12)",
                      color: data.whiteTigerScore.overall >= 70 ? "#4ade80" : data.whiteTigerScore.overall >= 50 ? "#fbbf24" : "#f87171",
                    }}>
                      {data.whiteTigerScore.label}
                    </span>
                    <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                      {data.whiteTigerScore.weights}
                    </div>
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div style={{ flex: 1, maxWidth: 420, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Valuation", value: data.whiteTigerScore.breakdown.valuation, weight: "25%", color: "#6366f1" },
                    { label: "Macro", value: data.whiteTigerScore.breakdown.macro, weight: "20%", color: "#0ea5e9" },
                    { label: "Technicals", value: data.whiteTigerScore.breakdown.technicals, weight: "15%", color: "#8b5cf6" },
                    { label: "Institutional", value: data.whiteTigerScore.breakdown.institutional, weight: "15%", color: "#a855f7" },
                    { label: "Risk", value: data.whiteTigerScore.breakdown.risk, weight: "15%", color: "#14b8a6" },
                    { label: "Sentiment", value: data.whiteTigerScore.breakdown.sentiment, weight: "10%", color: "#f59e0b" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.45)", fontWeight: 600, width: 75, textAlign: "right" }}>{item.label} ({item.weight})</span>
                      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${item.value}%`, height: "100%", background: item.color, borderRadius: 3, transition: "width 1.5s ease" }} />
                      </div>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: item.color, minWidth: 28 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Source Attribution + Actionability Row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            {/* Source Attribution */}
            {data.sourceAttribution && (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Database size={16} style={{ color: "#6366f1" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>Data Sources</span>
                  {data.sourceAttribution.priceVerified && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.6rem", fontWeight: 700, color: "#059669", background: "#f0fdf4", padding: "2px 8px", borderRadius: 4, marginLeft: "auto" }}>
                      <CheckCircle size={10} /> VERIFIED
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.sourceAttribution.dataSources.map((src, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: i === 0 ? "#4ade80" : "#6366f1", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.76rem", color: "#4b5563" }}>{src}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: "0.62rem", color: "#9ca3af", lineHeight: 1.5 }}>
                  Price: {data.sourceAttribution.priceSource} · Engine: {data.sourceAttribution.analysisEngine}
                </div>
              </div>
            )}

            {/* Actionability Score */}
            {data.actionability && (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Target size={16} style={{ color: data.actionability.color }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>Actionability</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <span style={{
                    fontSize: "1.2rem", fontWeight: 900, color: data.actionability.color,
                  }}>
                    {data.actionability.label}
                  </span>
                  <span style={{
                    fontSize: "0.66rem", fontWeight: 700,
                    padding: "4px 10px", borderRadius: 5,
                    background: `${data.actionability.color}12`,
                    color: data.actionability.color,
                  }}>
                    {data.actionability.score}
                  </span>
                </div>
                <p style={{ fontSize: "0.76rem", color: "#6b7280", lineHeight: 1.55, margin: 0 }}>
                  {data.actionability.detail}
                </p>

                {/* Confidence */}
                {data.confidenceBreakdown && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#6b7280" }}>AI Confidence</span>
                      <span style={{
                        fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: data.confidenceBreakdown.level === "High Confidence" ? "#f0fdf4" : data.confidenceBreakdown.level === "Medium Confidence" ? "#fffbeb" : "#fef2f2",
                        color: data.confidenceBreakdown.level === "High Confidence" ? "#059669" : data.confidenceBreakdown.level === "Medium Confidence" ? "#d97706" : "#dc2626",
                      }}>
                        {data.confidenceBreakdown.level}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[
                        { label: "Data Quality", value: data.confidenceBreakdown.dataQuality },
                        { label: "Macro Fit", value: data.confidenceBreakdown.macroAlignment },
                        { label: "Historical", value: data.confidenceBreakdown.historicalAccuracy },
                        { label: "Sentiment", value: data.confidenceBreakdown.sentimentConsistency },
                      ].map(c => (
                        <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.58rem", color: "#9ca3af", width: 60 }}>{c.label}</span>
                          <div style={{ flex: 1, height: 4, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${c.value}%`, height: "100%", background: c.value >= 70 ? "#4ade80" : c.value >= 45 ? "#fbbf24" : "#f87171", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#6b7280", minWidth: 22 }}>{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Analysis Reasoning — Why This Conclusion ── */}
          {data.analysisReasoning && (data.analysisReasoning.bullishFactors.length > 0 || data.analysisReasoning.bearishFactors.length > 0) && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "22px 24px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Lightbulb size={16} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a2e" }}>Why This Conclusion?</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: data.analysisReasoning.bearishFactors.length > 0 ? "1fr 1fr" : "1fr", gap: 20 }}>
                {data.analysisReasoning.bullishFactors.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <TrendingUp size={13} style={{ color: "#059669" }} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>Bullish Factors</span>
                    </div>
                    {data.analysisReasoning.bullishFactors.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <CheckCircle size={12} style={{ color: "#4ade80", marginTop: 3, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.76rem", color: "#4b5563", lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
                {data.analysisReasoning.bearishFactors.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <TrendingDown size={13} style={{ color: "#dc2626" }} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>Bearish Factors</span>
                    </div>
                    {data.analysisReasoning.bearishFactors.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <XCircle size={12} style={{ color: "#f87171", marginTop: 3, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.76rem", color: "#4b5563", lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {data.analysisReasoning.neutralFactors.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Info size={13} style={{ color: "#6b7280" }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#6b7280" }}>Neutral</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {data.analysisReasoning.neutralFactors.map((f, i) => (
                      <span key={i} style={{ fontSize: "0.7rem", color: "#6b7280", background: "#f9fafb", padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Risks to This Analysis ── */}
          {data.analysisRisks && data.analysisRisks.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "22px 24px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <FileWarning size={16} style={{ color: "#dc2626" }} />
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a2e" }}>Risks to This Analysis</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {data.analysisRisks.map((r, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: r.severity === "high" ? "#fef2f2" : r.severity === "medium" ? "#fffbeb" : "#f0fdf4",
                    border: `1px solid ${r.severity === "high" ? "#fecaca" : r.severity === "medium" ? "#fde68a" : "#bbf7d0"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <AlertTriangle size={12} style={{ color: r.severity === "high" ? "#dc2626" : r.severity === "medium" ? "#d97706" : "#059669" }} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: r.severity === "high" ? "#dc2626" : r.severity === "medium" ? "#92400e" : "#065f46" }}>
                        {r.risk}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "#4b5563", lineHeight: 1.5, margin: 0 }}>{r.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Market Memory — Historical Parallels ── */}
          {data.marketMemory && data.marketMemory.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <History size={16} style={{ color: "#8b5cf6" }} />
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a2e" }}>Market Memory</span>
                <span style={{ fontSize: "0.6rem", color: "#9ca3af", fontWeight: 500, marginLeft: 4 }}>Historical parallels for context</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.marketMemory.map((m, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 14, padding: "14px 16px", borderRadius: 10,
                    background: m.relevance === "high" ? "rgba(99,102,241,0.04)" : "#f9fafb",
                    border: `1px solid ${m.relevance === "high" ? "rgba(99,102,241,0.12)" : "#f3f4f6"}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: m.relevance === "high" ? "rgba(139,92,246,0.1)" : "rgba(107,114,128,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Clock size={16} style={{ color: m.relevance === "high" ? "#8b5cf6" : "#9ca3af" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{m.event}</div>
                      <p style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.55, margin: 0 }}>{m.context}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)}
        </section>

        {/* Key Metrics Quick Strip */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1, background: "#e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            {[
              { label: "P/E", value: fmtNum(data.hero.pe, n => n.toFixed(1) + "x") },
              { label: "P/B", value: fmtNum(data.hero.pb, n => n.toFixed(1) + "x") },
              { label: "EPS", value: fmtNum(data.hero.eps, n => `₹${n.toFixed(2)}`) },
              { label: "Mkt Cap", value: fmtNum(data.hero.mcap, n => `₹${n.toLocaleString("en-IN")} Cr`) },
              { label: "Book Value", value: fmtNum(data.hero.bookValue, n => `₹${n.toLocaleString("en-IN")}`) },
              { label: "Volume", value: fmtNum(data.hero.volume, n => n.toLocaleString("en-IN")) },
              { label: "Div Yield", value: fmtNum(data.hero.divYield, n => `${n}%`) },
              { label: "52W Range", value: data.hero.weekLow52 != null && data.hero.weekHigh52 != null ? `₹${data.hero.weekLow52}–${data.hero.weekHigh52}` : "—" },
            ].map((m, i) => (
              <div key={i} style={{ background: "#fff", padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.58rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a1a2e" }}>{m.value}</div>
              </div>
            ))}
          </div>
          {/* D5 — fundamentals provenance */}
          {data.fundamentalsProvenance && (() => {
            const fp = data.fundamentalsProvenance!;
            const liveF = fp.fundamentalsSource !== "static-profile";
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.62rem", color: liveF ? "#059669" : "#b45309" }}>
                <Info size={11} />
                <span style={{ fontWeight: 600 }}>
                  {liveF
                    ? `Valuation metrics live from ${fp.fundamentalsSource}.`
                    : `Valuation metrics are estimates as of ${fp.fundamentalsAsOf} — verify the latest on NSE/screener.`}
                </span>
              </div>
            );
          })()}
        </section>

        {/* ════════════════════════════════════════════════════════
            BUSINESS INTELLIGENCE SUITE — 5 institutional sub-tabs
            (Business · Industry · Competitors · Ownership · AI Analyst)
            ════════════════════════════════════════════════════════ */}
        <BusinessIntelligenceSuite ticker={data.symbol} companyName={data.companyName} />

        {/* ════════════════════════════════════════════════════════
            SECTION 2: WHY IS THIS STOCK MOVING?
            ════════════════════════════════════════════════════════ */}
        <section ref={el => { sectionRefs.current["movement"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("movement") ? <WithheldSection id="movement" /> : (<>
          <SectionHeading title="Why Is This Stock Moving?" subtitle="AI-powered analysis connecting technical, macro, institutional, and sentiment factors" icon={<Zap size={18} />} />

          {data.aiCopilot?.movementReasons && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {([
                { key: "technical" as const, title: "Technical Signals", icon: <Activity size={15} />, color: "#6366f1" },
                { key: "macro" as const, title: "Macro Environment", icon: <Globe size={15} />, color: "#0ea5e9" },
                { key: "institutional" as const, title: "Institutional Activity", icon: <Users size={15} />, color: "#8b5cf6" },
                { key: "sentiment" as const, title: "Market Sentiment", icon: <MessageSquare size={15} />, color: "#f59e0b" },
              ]).map(cat => (
                <div key={cat.key} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${cat.color}10`, display: "flex", alignItems: "center", justifyContent: "center", color: cat.color }}>{cat.icon}</div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{cat.title}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {data.aiCopilot!.movementReasons[cat.key].map((reason, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: cat.color, marginTop: 7, flexShrink: 0, opacity: 0.7 }} />
                        <span style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.55 }}>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Price Drivers */}
          <div style={{ marginTop: 18, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Flame size={14} style={{ color: "#f59e0b" }} /> Key Price Catalysts
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {data.priceDrivers.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: i < data.priceDrivers.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: d.direction === "positive" ? "#059669" : d.direction === "negative" ? "#dc2626" : "#d97706" }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#1a1a2e", marginBottom: 2 }}>{d.driver}</div>
                    <div style={{ fontSize: "0.76rem", color: "#6b7280", lineHeight: 1.5 }}>{d.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 3: SMART MONEY TRACKER
            ════════════════════════════════════════════════════════ */}
        {/* removed: neutral research, no ratings/targets */}

        {/* ════════════════════════════════════════════════════════
            SECTION 4: AI RISK ENGINE
            ════════════════════════════════════════════════════════ */}
        {data.aiRiskEngine && (
          <section ref={el => { sectionRefs.current["risk"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("risk") ? <WithheldSection id="risk" /> : (<>
            <SectionHeading title="AI Risk Engine" subtitle="Multi-dimensional risk assessment with AI-powered hedging suggestions" icon={<Shield size={18} />} />

            {/* Risk Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: data.aiRiskEngine.overallRiskLevel === "Low" ? "linear-gradient(135deg, #f0fdf4, #ecfdf5)" : data.aiRiskEngine.overallRiskLevel === "High" ? "linear-gradient(135deg, #fef2f2, #fff1f2)" : "linear-gradient(135deg, #fffbeb, #fef3c7)", borderRadius: 14, padding: "24px", textAlign: "center", border: `1px solid ${data.aiRiskEngine.overallRiskLevel === "Low" ? "#bbf7d0" : data.aiRiskEngine.overallRiskLevel === "High" ? "#fecaca" : "#fde68a"}` }}>
                <Shield size={28} style={{ color: data.aiRiskEngine.overallRiskLevel === "Low" ? "#059669" : data.aiRiskEngine.overallRiskLevel === "High" ? "#dc2626" : "#d97706", marginBottom: 10 }} />
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: data.aiRiskEngine.overallRiskLevel === "Low" ? "#059669" : data.aiRiskEngine.overallRiskLevel === "High" ? "#dc2626" : "#d97706" }}>
                  {data.aiRiskEngine.overallRiskLevel} Risk
                </div>
                <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: 8 }}>Worst-case drawdown: <strong>{data.aiRiskEngine.worstCaseDrawdown}%</strong></div>
                <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: 4 }}>Recovery time: <strong>{data.aiRiskEngine.recoveryTime}</strong></div>
              </div>

              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 14 }}>Risk Breakdown</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.aiRiskEngine.riskBreakdown.map((risk, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "#374151" }}>{risk.category}</span>
                        <RiskBadge level={risk.level} />
                      </div>
                      <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{
                          width: `${risk.score}%`, height: "100%", borderRadius: 3,
                          background: risk.level === "Low" ? "#059669" : risk.level === "Moderate" ? "#d97706" : "#dc2626",
                        }} />
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#6b7280", lineHeight: 1.4 }}>{risk.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hedging Suggestion */}
            <div style={{ background: "linear-gradient(135deg, #eff6ff, #f0f9ff)", borderRadius: 12, padding: "16px 20px", border: "1px solid #bfdbfe", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Shield size={16} style={{ color: "#3b82f6", marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>AI Hedging Suggestion</div>
                <div style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.5 }}>{data.aiRiskEngine.hedgingSuggestion}</div>
              </div>
            </div>
          </>)}
        </section>
        )}

        {/* ════════════════════════════════════════════════════════
            SECTION 5: AI OPPORTUNITY ENGINE
            ════════════════════════════════════════════════════════ */}
        {/* removed: neutral research, no ratings/targets */}

        {/* ════════════════════════════════════════════════════════
            SECTION 6: EARNINGS INTELLIGENCE
            ════════════════════════════════════════════════════════ */}
        {data.earningsIntelligence && (
          <section ref={el => { sectionRefs.current["earnings"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("earnings") ? <WithheldSection id="earnings" /> : (<>
            <SectionHeading title="Earnings Intelligence" subtitle="AI-summarized quarterly results, management commentary, and consensus tracking" icon={<BookOpen size={18} />} />

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
              {/* Last Quarter AI Summary */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Brain size={14} style={{ color: "#6366f1" }} />
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151" }}>AI Earnings Summary</span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#4b5563", lineHeight: 1.65, margin: "0 0 18px" }}>{data.earningsIntelligence.lastQuarterSummary}</p>

                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 10 }}>Management Commentary Highlights</div>
                {data.earningsIntelligence.managementCommentary.map((c, i) => (
                  <div key={i} style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, marginBottom: 8, fontSize: "0.76rem", color: "#4b5563", lineHeight: 1.55, fontStyle: "italic", borderLeft: "3px solid #6366f1" }}>
                    {c}
                  </div>
                ))}
              </div>

              {/* Earnings Surprise + Consensus */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px", flex: 1 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 12 }}>Earnings Surprise History</div>
                  {data.earningsIntelligence.earningsSurpriseHistory.map((e, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < data.earningsIntelligence!.earningsSurpriseHistory.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <span style={{ fontSize: "0.76rem", color: "#6b7280" }}>{e.quarter}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: e.surprise > 0 ? "#059669" : "#dc2626" }}>{e.surprise > 0 ? "+" : ""}{e.surprise}%</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Next Earnings</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a2e" }}>{data.earningsIntelligence.nextEarningsDate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Consensus EPS</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a2e" }}>₹{data.earningsIntelligence.consensusEPS}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "#f8fafc", borderRadius: 6, fontSize: "0.72rem", color: "#4b5563" }}>
                    <Sparkles size={11} style={{ color: "#6366f1", marginRight: 4, verticalAlign: "middle" }} />
                    {data.earningsIntelligence.epsRevisionTrend}
                  </div>
                </div>
              </div>
            </div>
          </>)}
        </section>
        )}

        {/* ════════════════════════════════════════════════════════
            SECTION 7: GEOPOLITICAL & COMMODITY IMPACT
            ════════════════════════════════════════════════════════ */}
        {data.geopoliticalImpact && (
          <section ref={el => { sectionRefs.current["geopolitical"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("geopolitical") ? <WithheldSection id="geopolitical" /> : (<>
            <SectionHeading title="Geopolitical & Macro Impact" subtitle="How global events, commodities, currencies, and interest rates affect this stock" icon={<Globe size={18} />} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {/* Commodity Exposure */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
                <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Flame size={14} style={{ color: "#f59e0b" }} /> Commodity Exposure
                </div>
                {data.geopoliticalImpact.commodityExposure.map((c, i) => (
                  <div key={i} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: i < data.geopoliticalImpact!.commodityExposure.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{c.commodity}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>{c.currentPrice}</span>
                        <RiskBadge level={c.severity === "high" ? "High" : c.severity === "medium" ? "Moderate" : "Low"} />
                      </div>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.5 }}>{c.impact}</div>
                  </div>
                ))}
              </div>

              {/* Geopolitical Risks */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
                <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={14} style={{ color: "#dc2626" }} /> Geopolitical Risk Factors
                </div>
                {data.geopoliticalImpact.geopoliticalRisks.map((r, i) => (
                  <div key={i} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: i < data.geopoliticalImpact!.geopoliticalRisks.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{r.event}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#6b7280", background: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>P: {r.probability}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.5 }}>{r.impact}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Currency & Interest Rate */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <DollarSign size={14} style={{ color: "#0ea5e9" }} />
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151" }}>Currency Impact</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>USD/INR</span>
                  <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a1a2e" }}>₹{data.geopoliticalImpact.currencyImpact.usdInr}</span>
                </div>
                <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>{data.geopoliticalImpact.currencyImpact.direction}</div>
                <div style={{ fontSize: "0.74rem", color: "#4b5563", lineHeight: 1.5, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>{data.geopoliticalImpact.currencyImpact.impact}</div>
              </div>

              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Activity size={14} style={{ color: "#8b5cf6" }} />
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151" }}>Interest Rate Impact</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>Repo Rate</span>
                  <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a1a2e" }}>{data.geopoliticalImpact.interestRateImpact.repoRate}</span>
                </div>
                <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>{data.geopoliticalImpact.interestRateImpact.outlook}</div>
                <div style={{ fontSize: "0.74rem", color: "#4b5563", lineHeight: 1.5, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>{data.geopoliticalImpact.interestRateImpact.impact}</div>
              </div>
            </div>
          </>)}
        </section>
        )}

        {/* ════════════════════════════════════════════════════════
            SECTION 8: DEEP ANALYSIS (Expandable Cards)
            Supporting data behind AI insights
            ════════════════════════════════════════════════════════ */}
        <section ref={el => { sectionRefs.current["fundamentals"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("fundamentals") ? <WithheldSection id="fundamentals" /> : (<>
          <SectionHeading title="Deep Analysis" subtitle="Detailed fundamentals, financials, and institutional data supporting AI insights" icon={<BarChart3 size={18} />} />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Fundamentals */}
            <AIInsightCard icon={<PieChart size={17} />} title="Fundamental Analysis — Valuation & Profitability" accentColor="#6366f1" defaultOpen>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 16 }}>
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 14 }}>Valuation</div>
                  {[
                    { label: "P/E Ratio", value: fmtNum(data.hero.pe, n => `${n.toFixed(1)}x`), note: data.hero.pe != null ? pointerText(data.hero.pe, "pe") : "Not available" },
                    { label: "P/B Ratio", value: fmtNum(data.hero.pb, n => `${n.toFixed(1)}x`), note: data.hero.pb != null ? pointerText(data.hero.pb, "pb") : "Not available" },
                    { label: "Dividend Yield", value: fmtNum(data.hero.divYield, n => `${n}%`), note: data.hero.divYield != null ? pointerText(data.hero.divYield, "divyield") : "Not available" },
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: i < 2 ? "1px solid #e5e7eb" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>{item.label}</span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a1a2e" }}>{item.value}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.4 }}>{item.note}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 14 }}>Profitability & Returns</div>
                  {[
                    { label: "ROE", value: `${data.fundamentals.roe}%`, note: pointerText(data.fundamentals.roe, "roe") },
                    { label: "ROCE", value: `${data.fundamentals.roce}%`, note: pointerText(data.fundamentals.roce, "roce") },
                    { label: "EBITDA Margin", value: `${data.fundamentals.ebitdaMargin}%`, note: pointerText(data.fundamentals.ebitdaMargin, "margin") },
                    { label: "Debt/Equity", value: data.fundamentals.debtEquity.toFixed(2), note: pointerText(data.fundamentals.debtEquity, "de") },
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: i < 3 ? "1px solid #e5e7eb" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>{item.label}</span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1a1a2e" }}>{item.value}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.4 }}>{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </AIInsightCard>

            {/* Revenue & Margins */}
            {data.revenueBreakdown && (
              <AIInsightCard icon={<BarChart3 size={17} />} title="Revenue Breakdown & Margin Analysis" accentColor="#0ea5e9">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 16 }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 10 }}>Revenue by Segment</div>
                    {data.revenueBreakdown.segments.map((s, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4 }}>
                          <span style={{ color: "#374151", fontWeight: 500 }}>{s.name}</span>
                          <span style={{ color: "#1a1a2e", fontWeight: 700 }}>{s.share}% <span style={{ fontSize: "0.68rem", color: s.growth > 0 ? "#059669" : "#dc2626" }}>({s.growth > 0 ? "+" : ""}{s.growth}% YoY)</span></span>
                        </div>
                        <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                          <div style={{ width: `${s.share}%`, height: "100%", background: "#6366f1", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 10 }}>Revenue by Geography</div>
                    {data.revenueBreakdown.geography.map((g, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: 4 }}>
                          <span style={{ color: "#374151", fontWeight: 500 }}>{g.region}</span>
                          <span style={{ color: "#1a1a2e", fontWeight: 700 }}>{g.share}%</span>
                        </div>
                        <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                          <div style={{ width: `${g.share}%`, height: "100%", background: "#0ea5e9", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {data.marginAnalysis && (
                  <div style={{ marginTop: 18, borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "10px 16px", textAlign: "left", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Year</th>
                          <th style={{ padding: "10px 16px", textAlign: "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Gross %</th>
                          <th style={{ padding: "10px 16px", textAlign: "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>EBITDA %</th>
                          <th style={{ padding: "10px 16px", textAlign: "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>PAT %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.marginAnalysis.trend.map((t, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "10px 16px", fontWeight: 600, color: "#374151" }}>{t.year}</td>
                            <td style={{ padding: "10px 16px", textAlign: "right", color: "#374151" }}>{t.grossMargin}%</td>
                            <td style={{ padding: "10px 16px", textAlign: "right", color: "#374151" }}>{t.ebitdaMargin}%</td>
                            <td style={{ padding: "10px 16px", textAlign: "right", color: "#374151" }}>{t.patMargin}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </AIInsightCard>
            )}

            {/* Financial Statements */}
            <AIInsightCard icon={<DollarSign size={17} />} title="Financial Performance — Annual & Quarterly" accentColor="#059669">
              <div style={{ paddingTop: 16 }}>
                {data.annualFinancials && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 8 }}>Annual (₹ Cr)</div>
                    <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc" }}>
                            {["Year", "Revenue", "EBITDA", "PAT", "EPS (₹)", "Rev Gr%", "PAT Gr%"].map(h => (
                              <th key={h} style={{ padding: "10px 12px", textAlign: h === "Year" ? "left" : "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.annualFinancials.map((f, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "10px 12px", fontWeight: 600, color: "#374151" }}>{f.year}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>₹{f.revenue.toLocaleString()}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>₹{f.ebitda.toLocaleString()}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>₹{f.pat.toLocaleString()}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>₹{f.eps}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: f.revenueGrowth >= 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>{f.revenueGrowth > 0 ? "+" : ""}{f.revenueGrowth}%</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", color: f.patGrowth >= 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>{f.patGrowth > 0 ? "+" : ""}{f.patGrowth}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 8 }}>Quarterly (₹ Cr)</div>
                  <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["Quarter", "Revenue", "PAT", "EBITDA %", "EPS Gr%"].map(h => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: h === "Quarter" ? "left" : "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.quarterlyResults.map((q, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 600, color: "#374151" }}>{q.quarter}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>₹{q.revenue.toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>₹{q.pat.toLocaleString()}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>{q.ebitdaMargin}%</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: q.epsGrowth >= 0 ? "#059669" : "#dc2626", fontWeight: 600 }}>{q.epsGrowth > 0 ? "+" : ""}{q.epsGrowth}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </AIInsightCard>

            {/* Balance Sheet & Cash Flows */}
            {(data.balanceSheet || data.cashFlows) && (
              <AIInsightCard icon={<Layers size={17} />} title="Balance Sheet & Cash Flow Analysis" accentColor="#8b5cf6">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 16 }}>
                  {data.balanceSheet && (
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 10 }}>Balance Sheet Health</div>
                      {[
                        { label: "Total Debt", value: `₹${data.balanceSheet.totalDebt.toLocaleString()} Cr`, note: data.balanceSheet.debtEquity < 0.3 ? "Low leverage" : data.balanceSheet.debtEquity < 1 ? "Moderate debt" : "High debt load" },
                        { label: "Cash", value: `₹${data.balanceSheet.cash.toLocaleString()} Cr`, note: "Liquidity buffer" },
                        { label: "Net Debt/EBITDA", value: `${data.balanceSheet.netDebtEbitda}x`, note: data.balanceSheet.netDebtEbitda < 1 ? "Can repay within 1yr" : "Monitor" },
                        { label: "Interest Coverage", value: `${data.balanceSheet.interestCoverage}x`, note: data.balanceSheet.interestCoverage > 8 ? "Comfortable" : "Adequate" },
                        { label: "Current Ratio", value: data.balanceSheet.currentRatio.toString(), note: data.balanceSheet.currentRatio > 2 ? "Strong liquidity" : "Adequate" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #f3f4f6" : "none" }}>
                          <div>
                            <span style={{ fontSize: "0.76rem", color: "#374151" }}>{item.label}</span>
                            <span style={{ fontSize: "0.64rem", color: "#9ca3af", marginLeft: 6 }}>{item.note}</span>
                          </div>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.cashFlows && (
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 10 }}>Cash Flow Analysis</div>
                      {[
                        { label: "Operating CF", value: `₹${data.cashFlows.cfo.toLocaleString()} Cr` },
                        { label: "Free Cash Flow", value: `₹${data.cashFlows.fcf.toLocaleString()} Cr` },
                        { label: "FCF Yield", value: `${data.cashFlows.fcfYield}%` },
                        { label: "CFO/PAT", value: `${data.cashFlows.cfoPat}%` },
                        { label: "Capex Intensity", value: `${data.cashFlows.capexIntensity}%` },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? "1px solid #f3f4f6" : "none" }}>
                          <span style={{ fontSize: "0.76rem", color: "#374151" }}>{item.label}</span>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AIInsightCard>
            )}
          </div>
        </>)}
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 9: VALUATION
            ════════════════════════════════════════════════════════ */}
        <section ref={el => { sectionRefs.current["valuation"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("valuation") ? <WithheldSection id="valuation" /> : (<>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* DCF */}
            {/* removed: neutral research, no ratings/targets */}

            {/* Scenarios */}
            {/* removed: neutral research, no ratings/targets */}
          </div>
        </>)}
        </section>

        {/* ════════════════════════════════════════════════════════
            SECTION 10: TECHNICALS & OWNERSHIP
            ════════════════════════════════════════════════════════ */}
        <section ref={el => { sectionRefs.current["technicals"] = el; }} style={{ marginBottom: 36 }}>
          {withheld("technicals") ? <WithheldSection id="technicals" /> : (<>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Technicals */}
            <AIInsightCard icon={<Activity size={17} />} title="Technical Analysis" accentColor="#f59e0b" defaultOpen>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, paddingTop: 16 }}>
                {[
                  { label: "RSI (14)", value: fmtNum(data.technicals.rsi, n => n.toString()), note: data.technicals.rsi != null ? pointerText(data.technicals.rsi, "rsi") : "Not available" },
                  { label: "MACD", value: fmtNum(data.technicals.macd, n => n.toString()), note: data.technicals.macd == null ? "Not available" : data.technicals.macd > 0 ? "MACD line above zero — upward momentum" : "MACD line below zero — downward momentum" },
                  { label: "SMA 200", value: fmtNum(data.technicals.sma200, n => `₹${n.toLocaleString()}`), note: data.technicals.sma200 == null ? "Not available" : data.hero.cmp > data.technicals.sma200 ? `${((data.hero.cmp/data.technicals.sma200 - 1)*100).toFixed(0)}% above` : `${((1 - data.hero.cmp/data.technicals.sma200)*100).toFixed(0)}% below` },
                  { label: "Support (pivot S1)", value: fmtNum(data.technicals.support, n => `₹${n.toLocaleString()}`), note: "Monthly classic pivot" },
                  { label: "Resistance (pivot R1)", value: fmtNum(data.technicals.resistance, n => `₹${n.toLocaleString()}`), note: "Monthly classic pivot" },
                  { label: "ATR (14)", value: fmtNum(data.technicals.atr, n => n.toString()), note: "Average daily range" },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "14px 16px", background: "#f8fafc", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.74rem", color: "#6b7280", fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1a1a2e" }}>{item.value}</span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#6b7280", lineHeight: 1.4 }}>{item.note}</div>
                  </div>
                ))}
              </div>
            </AIInsightCard>

            {/* Shareholding */}
            <AIInsightCard icon={<Users size={17} />} title="Shareholding Pattern & Ownership Trend" accentColor="#0ea5e9">
              <div style={{ paddingTop: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Promoter", value: data.fundamentals.promoterHolding, color: "#1a1a2e" },
                    { label: "FII", value: data.fundamentals.fiiHolding, color: "#6366f1" },
                    { label: "DII", value: data.fundamentals.diiHolding, color: "#0ea5e9" },
                    { label: "Public", value: data.fundamentals.publicHolding, color: "#f59e0b" },
                  ].map((h, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "14px", background: "#f8fafc", borderRadius: 10 }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: h.color }}>{h.value}%</div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", marginTop: 4 }}>{h.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Quarter", "Promoter", "FII", "DII", "Public"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: h === "Quarter" ? "left" : "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.shareholdingTrend.map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#374151" }}>{row.quarter}</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#374151" }}>{row.promoter.toFixed(1)}%</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#374151" }}>{row.fii.toFixed(1)}%</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#374151" }}>{row.dii.toFixed(1)}%</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#374151" }}>{row.public.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AIInsightCard>

            {/* Stress Tests & Catalysts */}
            {data.stressTests && data.reRatingCatalysts && (
              <AIInsightCard icon={<AlertTriangle size={17} />} title="Stress Tests, Catalysts & Risks" accentColor="#dc2626">
                <div style={{ paddingTop: 16 }}>
                  <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 18 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Scenario</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>EPS Impact</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Price Impact</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #e5e7eb" }}>Resilience</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.stressTests.map((st, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#374151" }}>{st.scenario}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#dc2626", fontWeight: 600 }}>{st.epsImpact}%</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#dc2626", fontWeight: 600 }}>{st.priceImpact}%</td>
                            <td style={{ padding: "10px 14px", textAlign: "right" }}><RiskBadge level={st.bsResilience} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>Upside Catalysts</div>
                      {data.reRatingCatalysts.upsideCatalysts.map((c, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                          <span style={{ color: "#059669", fontWeight: 800, fontSize: "0.68rem", marginTop: 3 }}>▲</span>
                          <span style={{ fontSize: "0.76rem", color: "#374151", lineHeight: 1.5 }}>{c}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", marginBottom: 10 }}>Downside Risks</div>
                      {data.reRatingCatalysts.downsideRisks.map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                          <span style={{ color: "#dc2626", fontWeight: 800, fontSize: "0.68rem", marginTop: 3 }}>▼</span>
                          <span style={{ fontSize: "0.76rem", color: "#374151", lineHeight: 1.5 }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AIInsightCard>
            )}

            {/* Earnings Quality */}
            {data.earningsQuality && (
              <AIInsightCard icon={<Eye size={17} />} title="Earnings Quality Assessment" accentColor="#8b5cf6">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 16 }}>
                  <div>
                    {[
                      { label: "CFO/PAT Ratio", value: `${data.earningsQuality.cfoPATRatio}%`, good: data.earningsQuality.cfoPATRatio > 80 },
                      { label: "Accrual Ratio", value: `${data.earningsQuality.accrualRatio}%`, good: data.earningsQuality.accrualRatio < 8 },
                      { label: "Other Income", value: `${data.earningsQuality.otherIncomeShare}%`, good: data.earningsQuality.otherIncomeShare < 10 },
                      { label: "Related Party", value: data.earningsQuality.relatedPartyTransactions, good: data.earningsQuality.relatedPartyTransactions === "minimal" },
                      { label: "Auditor", value: data.earningsQuality.auditorObservations, good: data.earningsQuality.auditorObservations === "clean" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #f3f4f6" : "none" }}>
                        <span style={{ fontSize: "0.76rem", color: "#6b7280" }}>{item.label}</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: item.good ? "#059669" : "#d97706" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", marginBottom: 10 }}>Flags</div>
                    {data.earningsQuality.flags.map((flag, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: "0.78rem", color: flag.startsWith("✓") ? "#059669" : "#d97706" }}>{flag.startsWith("✓") ? "✓" : "⚠"}</span>
                        <span style={{ fontSize: "0.74rem", color: "#4b5563", lineHeight: 1.5 }}>{flag.slice(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AIInsightCard>
            )}

            {/* News & Key Monitorables */}
            <AIInsightCard icon={<Radio size={17} />} title="Recent News & Key Monitorables" accentColor="#f59e0b">
              <div style={{ paddingTop: 16 }}>
                <div style={{ marginBottom: 20 }}>
                  {data.newsEvents.map((n, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: i < data.newsEvents.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: n.impact === "positive" ? "#059669" : n.impact === "negative" ? "#dc2626" : "#d97706" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#1a1a2e", marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: "0.66rem", color: "#6b7280" }}>{n.date} · <span style={{ fontWeight: 600, textTransform: "uppercase", color: n.severity === "high" ? "#dc2626" : "#6b7280" }}>{n.severity}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* removed: neutral research, no ratings/targets */}
              </div>
            </AIInsightCard>
          </div>
        </>)}
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer style={{ borderTop: "2px solid #1a1a2e", paddingTop: 24, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <Brain size={16} style={{ color: "#6366f1" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a1a2e" }}>White Tiger AI Intelligence Engine</span>
            {data.analysisVersion && (
              <span style={{ fontSize: "0.58rem", color: "#9ca3af", fontWeight: 600, background: "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>v{data.analysisVersion}</span>
            )}
          </div>
          {data.sourceAttribution?.disclaimer ? (
            <div style={{ fontSize: "0.66rem", color: "#9ca3af", lineHeight: 1.6 }}>{data.sourceAttribution.disclaimer}</div>
          ) : (
            <div style={{ fontSize: "0.66rem", color: "#9ca3af", lineHeight: 1.6 }}>
              AI-generated equity research for educational purposes only. Not investment advice. Always do your own research.
            </div>
          )}
          <div style={{ fontSize: "0.6rem", color: "#9ca3af", marginTop: 6 }}>Generated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
          {data.trustFeatures && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {data.trustFeatures.map((f) => (
                <span key={f} style={{ fontSize: "0.52rem", color: "#a5b4fc", background: "rgba(99,102,241,0.06)", padding: "2px 8px", borderRadius: 3, border: "1px solid rgba(99,102,241,0.1)" }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
