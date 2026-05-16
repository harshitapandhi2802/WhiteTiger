"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Target, Shield,
  Zap, Globe, Users, Building2, AlertCircle, ChevronDown, ChevronUp, Maximize2, X
} from "lucide-react";
import { NSE_STOCKS } from "@/lib/stocks";

/* ═══ Types ═══ */
interface StockData {
  success: boolean; symbol: string; companyName: string; sector: string; industry: string;
  source: string; generatedAt: string;
  hero: { cmp: number; changePercent: number; volume: number; mcap: number; pe: number; pb: number; eps: number; bookValue: number; divYield: number; weekHigh52: number; weekLow52: number; faceValue: number };
  sentiment: { label: string; confidence: number };
  aiScores: { overallScore: number; qualityScore: number; valuationScore: number; momentumScore: number; growthScore: number; riskScore: number };
  analystConsensus: { rating: string; targetPrice: number; analystCount: number; upside: number };
  fairValue: { dcfValue: number; upside: number; method: string };
  fundamentals: { revenue: number; pat: number; ebitdaMargin: number; grossMargin?: number; ebitMargin?: number; patMargin?: number; roe: number; roce: number; debtEquity: number; promoterHolding: number; fiiHolding: number; diiHolding: number; publicHolding: number };
  technicals: { rsi: number; macd: number; sma20: number; sma50: number; sma200: number; atr: number; support: number; resistance: number };
  priceDrivers: { driver: string; detail: string; direction: string }[];
  peerComparison: { symbol: string; pe: number; pb: number; roe: number; mcap: number }[];
  returns: Record<string, number>;
  quarterlyResults: { quarter: string; revenue: number; pat: number; ebitdaMargin: number; epsGrowth: number }[];
  newsEvents: { title: string; date: string; impact: string; severity: string }[];
  shareholdingTrend: { quarter: string; promoter: number; fii: number; dii: number; public: number }[];
  // Institutional deep analysis
  revenueBreakdown?: { segments: { name: string; share: number; growth: number }[]; geography: { region: string; share: number }[] };
  marginAnalysis?: { current: { grossMargin: number; ebitdaMargin: number; ebitMargin: number; patMargin: number }; trend: { year: string; grossMargin: number; ebitdaMargin: number; patMargin: number }[] };
  annualFinancials?: { year: string; revenue: number; ebitda: number; pat: number; eps: number; revenueGrowth: number; patGrowth: number }[];
  returnRatios?: { roe: number; roce: number; roic: number; rota: number; assetTurnover: number; capitalTurnover: number; incrementalRoce: number; spreadOverCoC: number; costOfEquity: number; wacc: number };
  balanceSheet?: { totalDebt: number; cash: number; netDebt: number; netWorth: number; longTermDebt: number; shortTermDebt: number; debtEquity: number; netDebtEbitda: number; interestCoverage: number; currentRatio: number; quickRatio: number; tangibleBookValue: number; contingentLiabilities: number; goodwill: number };
  cashFlows?: { cfo: number; capex: number; fcf: number; fcfYield: number; maintenanceCapex: number; growthCapex: number; dividendPaid: number; buybacks: number; cashConversion: number; capexIntensity: number; fcfMargin: number; cfoPat: number; trend: { year: string; cfo: number; capex: number; fcf: number }[] };
  workingCapital?: { receivableDays: number; payableDays: number; inventoryDays: number; ccc: number; wcAsRevenue: number; trend: { year: string; receivableDays: number; payableDays: number; inventoryDays: number }[] };
  dcfValuation?: { wacc: number; terminalGrowth: number; beta: number; riskFreeRate: number; erp: number; fcfProjections: { year: string; fcf: number; pvFcf: number }[]; terminalValue: number; pvTerminal: number; enterpriseValue: number; equityValue: number; sharesOutstanding: number; intrinsicValue: number; upside: number; sensitivity: { wacc: number; tg: number; value: number }[] };
  relativeValuation?: { currentPe: number; forwardPe: number; sectorAvgPe: number; histAvgPe: number; evEbitda: number; evSales: number; pegRatio: number; priceToFcf: number; premiumDiscount: number; historicalBands: { low: number; avg: number; high: number }; peersComparison: { symbol: string; pe: number; pb: number; roe: number; mcap: number; evEbitda: number; pegRatio: number; fcfYield: number }[] };
  scenarios?: { bull: { probability: number; eps: number; pe: number; targetPrice: number; narrative: string }; base: { probability: number; eps: number; pe: number; targetPrice: number; narrative: string }; bear: { probability: number; eps: number; pe: number; targetPrice: number; narrative: string } };
  stressTests?: { scenario: string; epsImpact: number; priceImpact: number; bsResilience: string }[];
  earningsQuality?: { cashConversionScore: number; accountingQualityScore: number; revenueQualityScore: number; earningsPersistenceScore: number; overallEarningsScore: number; financialStrengthScore: number; cfoPATRatio: number; accrualRatio: number; otherIncomeShare: number; exceptionalItems: number; relatedPartyTransactions: string; auditorObservations: string; flags: string[] };
  reRatingCatalysts?: { upsideCatalysts: string[]; downsideRisks: string[]; multipeExpansionPotential: number; institutionalOwnershipTrend: string; governanceScore: number };
  investmentConclusion?: { fairValueLow: number; fairValueMid: number; fairValueHigh: number; marginOfSafety: number; riskRewardRatio: string; expectedReturn12M: number; downsideRisk: number; view: string; keyMonitorables: string[] };
}

type SectionId = "overview" | "drivers" | "technicals" | "fundamentals" | "valuation" | "ownership" | "financials" | "peers" | "news" | "risk" | "dcf" | "scenarios" | "earnings" | "conclusion";

/* ═══ Helpers ═══ */
function resolveStock(slug: string) {
  const lower = slug.toLowerCase().replace(/-/g, " ");
  const stock = NSE_STOCKS.find(s =>
    s.ticker.replace(".NS", "").toLowerCase() === slug.toLowerCase() ||
    s.name.toLowerCase() === lower ||
    s.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") === slug.toLowerCase()
  );
  if (stock) return stock;
  // fuzzy
  const found = NSE_STOCKS.find(s => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase().split(" ")[0]));
  return found || { name: slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()), ticker: slug.toUpperCase() + ".NS", sector: "Equity" };
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: "0.72rem", fontWeight: 600 }}>
        <span style={{ color: "#94a3b8" }}>{label}</span>
        <span style={{ color }}>{value}/100</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: color || "#e2e8f0" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ═══ Page Component ═══ */
export default function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const stock = resolveStock(symbol);
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [chartFullscreen, setChartFullscreen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/stock-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: stock.ticker, companyName: stock.name }),
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stock.ticker, stock.name]);

  const sections: { id: SectionId; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Activity size={14} /> },
    { id: "drivers", label: "Price Drivers", icon: <Zap size={14} /> },
    { id: "technicals", label: "Technicals", icon: <BarChart3 size={14} /> },
    { id: "fundamentals", label: "Fundamentals", icon: <Target size={14} /> },
    { id: "valuation", label: "Valuation", icon: <TrendingUp size={14} /> },
    { id: "dcf", label: "DCF Model", icon: <BarChart3 size={14} /> },
    { id: "scenarios", label: "Scenarios", icon: <Shield size={14} /> },
    { id: "earnings", label: "Earnings Quality", icon: <Target size={14} /> },
    { id: "ownership", label: "Ownership", icon: <Users size={14} /> },
    { id: "financials", label: "Financials", icon: <Building2 size={14} /> },
    { id: "peers", label: "Peers", icon: <Globe size={14} /> },
    { id: "news", label: "News & Events", icon: <AlertCircle size={14} /> },
    { id: "conclusion", label: "Conclusion", icon: <TrendingUp size={14} /> },
    { id: "risk", label: "Risk", icon: <Shield size={14} /> },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0e1a 0%, #111827 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Loading {stock.name} intelligence...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) return <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#fff", padding: 40 }}>Error loading data.</div>;

  const isPositive = data.hero.changePercent >= 0;
  const sentimentColor = data.sentiment.label.includes("Bullish") ? "#10b981" : data.sentiment.label.includes("Bearish") ? "#ef4444" : "#f59e0b";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0a0e1a 0%, #0f172a 50%, #111827 100%)", color: "#e2e8f0", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* ═══ HEADER ═══ */}
      <header style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(20px)", background: "rgba(10,14,26,0.85)" }}>
        <Link href="/analyze" style={{ color: "#64748b", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f1f5f9" }}>{data.companyName}</span>
          <span style={{ marginLeft: 10, fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>{data.symbol} · {data.sector}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fff" }}>₹{data.hero.cmp.toLocaleString("en-IN")}</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isPositive ? "#10b981" : "#ef4444", background: isPositive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", padding: "4px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? "+" : ""}{data.hero.changePercent}%
          </span>
        </div>
      </header>

      {/* ═══ SECTION TABS ═══ */}
      <nav style={{ padding: "10px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", overflowX: "auto", display: "flex", gap: 4 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s",
            background: activeSection === s.id ? "rgba(99,102,241,0.15)" : "transparent",
            color: activeSection === s.id ? "#818cf8" : "#64748b",
          }}>
            {s.icon} {s.label}
          </button>
        ))}
      </nav>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 110px)" }}>
        {/* LEFT — Main Content Area */}
        <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>

          {/* HERO METRICS */}
          {activeSection === "overview" && (
            <div>
              {/* Top Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
                <MetricCard label="Market Cap" value={`₹${(data.hero.mcap / 100).toFixed(0)}K Cr`} />
                <MetricCard label="P/E Ratio" value={data.hero.pe.toFixed(1)} sub="TTM" />
                <MetricCard label="P/B Ratio" value={data.hero.pb.toFixed(1)} />
                <MetricCard label="EPS" value={`₹${data.hero.eps}`} />
                <MetricCard label="Div. Yield" value={`${data.hero.divYield}%`} color="#10b981" />
                <MetricCard label="Volume" value={`${(data.hero.volume / 1000000).toFixed(1)}M`} />
                <MetricCard label="52W High" value={`₹${data.hero.weekHigh52.toLocaleString()}`} color="#10b981" />
                <MetricCard label="52W Low" value={`₹${data.hero.weekLow52.toLocaleString()}`} color="#ef4444" />
              </div>

              {/* AI Sentiment Card */}
              <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.05) 100%)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Sentiment</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: sentimentColor, marginTop: 4 }}>{data.sentiment.label}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Confidence</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#818cf8" }}>{data.sentiment.confidence}%</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: "0.72rem", color: "#10b981", fontWeight: 600 }}>
                    Target: ₹{data.analystConsensus.targetPrice.toLocaleString()} ({data.analystConsensus.upside > 0 ? "+" : ""}{data.analystConsensus.upside}%)
                  </div>
                  <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: "0.72rem", color: "#818cf8", fontWeight: 600 }}>
                    {data.analystConsensus.rating} · {data.analystConsensus.analystCount} analysts
                  </div>
                  <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: "0.72rem", color: "#f59e0b", fontWeight: 600 }}>
                    Fair Value: ₹{data.fairValue.dcfValue.toLocaleString()} ({data.fairValue.upside > 0 ? "+" : ""}{data.fairValue.upside}%)
                  </div>
                </div>
              </div>

              {/* AI Scores */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>AI Quality Scores</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                  <ScoreBar label="Overall" value={data.aiScores.overallScore} color="#6366f1" />
                  <ScoreBar label="Quality" value={data.aiScores.qualityScore} color="#10b981" />
                  <ScoreBar label="Valuation" value={data.aiScores.valuationScore} color="#f59e0b" />
                  <ScoreBar label="Momentum" value={data.aiScores.momentumScore} color="#06b6d4" />
                  <ScoreBar label="Growth" value={data.aiScores.growthScore} color="#8b5cf6" />
                  <ScoreBar label="Risk" value={data.aiScores.riskScore} color="#ef4444" />
                </div>
              </div>

              {/* Returns */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>Historical Returns</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                  {Object.entries(data.returns).map(([period, ret]) => (
                    <div key={period} style={{ textAlign: "center", padding: "10px 4px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                      <div style={{ fontSize: "0.62rem", color: "#64748b", fontWeight: 600, marginBottom: 4 }}>{period}</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, color: ret >= 0 ? "#10b981" : "#ef4444" }}>{ret > 0 ? "+" : ""}{ret}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRICE DRIVERS */}
          {activeSection === "drivers" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Why {data.symbol} is Moving</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.priceDrivers.map((d, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, background: d.direction === "positive" ? "#10b981" : d.direction === "negative" ? "#ef4444" : "#f59e0b", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#e2e8f0", marginBottom: 3 }}>{d.driver}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.5 }}>{d.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TECHNICALS */}
          {activeSection === "technicals" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Technical Analysis</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
                <MetricCard label="RSI (14)" value={data.technicals.rsi.toString()} color={data.technicals.rsi > 70 ? "#ef4444" : data.technicals.rsi < 30 ? "#10b981" : "#f59e0b"} sub={data.technicals.rsi > 70 ? "Overbought" : data.technicals.rsi < 30 ? "Oversold" : "Neutral"} />
                <MetricCard label="MACD" value={data.technicals.macd.toString()} color={data.technicals.macd > 0 ? "#10b981" : "#ef4444"} />
                <MetricCard label="SMA 20" value={`₹${data.technicals.sma20.toLocaleString()}`} color={data.hero.cmp > data.technicals.sma20 ? "#10b981" : "#ef4444"} sub={data.hero.cmp > data.technicals.sma20 ? "Above" : "Below"} />
                <MetricCard label="SMA 50" value={`₹${data.technicals.sma50.toLocaleString()}`} color={data.hero.cmp > data.technicals.sma50 ? "#10b981" : "#ef4444"} sub={data.hero.cmp > data.technicals.sma50 ? "Above" : "Below"} />
                <MetricCard label="SMA 200" value={`₹${data.technicals.sma200.toLocaleString()}`} color={data.hero.cmp > data.technicals.sma200 ? "#10b981" : "#ef4444"} sub={data.hero.cmp > data.technicals.sma200 ? "Above" : "Below"} />
                <MetricCard label="ATR" value={data.technicals.atr.toString()} sub="Volatility" />
                <MetricCard label="Support" value={`₹${data.technicals.support.toLocaleString()}`} color="#10b981" />
                <MetricCard label="Resistance" value={`₹${data.technicals.resistance.toLocaleString()}`} color="#ef4444" />
              </div>
              {/* Signal Summary */}
              <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700, marginBottom: 8 }}>TECHNICAL SIGNAL</div>
                <div style={{ fontSize: "0.88rem", color: "#e2e8f0", lineHeight: 1.6 }}>
                  {data.symbol} is trading {data.hero.cmp > data.technicals.sma200 ? "above" : "below"} its 200-day SMA (₹{data.technicals.sma200.toLocaleString()}), indicating a {data.hero.cmp > data.technicals.sma200 ? "bullish" : "bearish"} long-term trend. RSI at {data.technicals.rsi} signals {data.technicals.rsi > 70 ? "overbought conditions — consider profit booking" : data.technicals.rsi < 30 ? "oversold conditions — potential buying opportunity" : "neutral momentum"}. Key support at ₹{data.technicals.support.toLocaleString()} and resistance at ₹{data.technicals.resistance.toLocaleString()}.
                </div>
              </div>
            </div>
          )}

          {/* FUNDAMENTALS */}
          {activeSection === "fundamentals" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Fundamental Analysis</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                <MetricCard label="Revenue" value={`₹${(data.fundamentals.revenue / 100).toFixed(0)}K Cr`} />
                <MetricCard label="Net Profit (PAT)" value={`₹${(data.fundamentals.pat / 100).toFixed(0)}K Cr`} color="#10b981" />
                <MetricCard label="EBITDA Margin" value={`${data.fundamentals.ebitdaMargin}%`} />
                <MetricCard label="ROE" value={`${data.fundamentals.roe}%`} color={data.fundamentals.roe > 15 ? "#10b981" : "#f59e0b"} />
                <MetricCard label="ROCE" value={`${data.fundamentals.roce}%`} color={data.fundamentals.roce > 15 ? "#10b981" : "#f59e0b"} />
                <MetricCard label="Debt/Equity" value={data.fundamentals.debtEquity.toFixed(2)} color={data.fundamentals.debtEquity < 0.5 ? "#10b981" : data.fundamentals.debtEquity < 1 ? "#f59e0b" : "#ef4444"} />
              </div>
            </div>
          )}

          {/* VALUATION */}
          {activeSection === "valuation" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Valuation Analysis</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 14, padding: "20px" }}>
                  <div style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Fair Value (DCF)</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#10b981" }}>₹{data.fairValue.dcfValue.toLocaleString()}</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>{data.fairValue.upside > 0 ? "Upside" : "Downside"}: {data.fairValue.upside > 0 ? "+" : ""}{data.fairValue.upside}%</div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 6 }}>Method: {data.fairValue.method}</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "20px" }}>
                  <div style={{ fontSize: "0.68rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Analyst Target</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#818cf8" }}>₹{data.analystConsensus.targetPrice.toLocaleString()}</div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>{data.analystConsensus.rating} · {data.analystConsensus.analystCount} analysts</div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 6 }}>Upside: {data.analystConsensus.upside > 0 ? "+" : ""}{data.analystConsensus.upside}%</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                <MetricCard label="P/E Ratio" value={data.hero.pe.toFixed(1)} sub="TTM" />
                <MetricCard label="P/B Ratio" value={data.hero.pb.toFixed(1)} />
                <MetricCard label="EPS" value={`₹${data.hero.eps}`} />
                <MetricCard label="Book Value" value={`₹${data.hero.bookValue}`} />
                <MetricCard label="Dividend Yield" value={`${data.hero.divYield}%`} color="#10b981" />
                <MetricCard label="CMP" value={`₹${data.hero.cmp.toLocaleString()}`} />
              </div>
            </div>
          )}

          {/* OWNERSHIP */}
          {activeSection === "ownership" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Shareholding Pattern</h3>
              {/* Current Holding */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Promoter", value: data.fundamentals.promoterHolding, color: "#6366f1" },
                  { label: "FII", value: data.fundamentals.fiiHolding, color: "#10b981" },
                  { label: "DII", value: data.fundamentals.diiHolding, color: "#f59e0b" },
                  { label: "Public", value: data.fundamentals.publicHolding, color: "#94a3b8" },
                ].map(h => (
                  <div key={h.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", border: `3px solid ${h.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: h.color }}>{h.value}%</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>{h.label}</div>
                  </div>
                ))}
              </div>
              {/* Trend Table */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Quarter</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#6366f1" }}>Promoter</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#10b981" }}>FII</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#f59e0b" }}>DII</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>Public</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.shareholdingTrend.map(row => (
                      <tr key={row.quarter} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{row.quarter}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{row.promoter.toFixed(1)}%</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{row.fii.toFixed(1)}%</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{row.dii.toFixed(1)}%</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{row.public.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FINANCIALS */}
          {activeSection === "financials" && (
            <div>
              {/* Revenue Breakdown */}
              {data.revenueBreakdown && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12, color: "#f1f5f9" }}>Revenue Segmentation</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.68rem", color: "#818cf8", fontWeight: 700, marginBottom: 10 }}>BY SEGMENT</div>
                      {data.revenueBreakdown.segments.map((s, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 3 }}>
                            <span style={{ color: "#e2e8f0" }}>{s.name}</span>
                            <span style={{ color: "#94a3b8" }}>{s.share}% <span style={{ color: s.growth > 0 ? "#10b981" : "#ef4444", fontSize: "0.65rem" }}>({s.growth > 0 ? "+" : ""}{s.growth}%)</span></span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                            <div style={{ width: `${s.share}%`, height: "100%", background: "#6366f1", borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: 700, marginBottom: 10 }}>BY GEOGRAPHY</div>
                      {data.revenueBreakdown.geography.map((g, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 3 }}>
                            <span style={{ color: "#e2e8f0" }}>{g.region}</span>
                            <span style={{ color: "#94a3b8" }}>{g.share}%</span>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                            <div style={{ width: `${g.share}%`, height: "100%", background: "#10b981", borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Annual Financials */}
              {data.annualFinancials && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12, color: "#f1f5f9" }}>Annual Financials (₹ Cr)</h4>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b" }}>Year</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>Revenue</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>EBITDA</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>PAT</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>EPS</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>Rev Gr%</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>PAT Gr%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.annualFinancials.map(f => (
                          <tr key={f.year} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{f.year}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>₹{f.revenue.toLocaleString()}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>₹{f.ebitda.toLocaleString()}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>₹{f.pat.toLocaleString()}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>₹{f.eps}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: f.revenueGrowth >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>{f.revenueGrowth > 0 ? "+" : ""}{f.revenueGrowth}%</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: f.patGrowth >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>{f.patGrowth > 0 ? "+" : ""}{f.patGrowth}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Margin Analysis */}
              {data.marginAnalysis && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12, color: "#f1f5f9" }}>Margin Trends</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                    <MetricCard label="Gross Margin" value={`${data.marginAnalysis.current.grossMargin}%`} color="#10b981" />
                    <MetricCard label="EBITDA Margin" value={`${data.marginAnalysis.current.ebitdaMargin}%`} color="#818cf8" />
                    <MetricCard label="EBIT Margin" value={`${data.marginAnalysis.current.ebitMargin}%`} color="#f59e0b" />
                    <MetricCard label="PAT Margin" value={`${data.marginAnalysis.current.patMargin}%`} color="#06b6d4" />
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                          <th style={{ padding: "8px 14px", textAlign: "left", color: "#64748b" }}>Year</th>
                          <th style={{ padding: "8px 14px", textAlign: "right", color: "#10b981" }}>Gross %</th>
                          <th style={{ padding: "8px 14px", textAlign: "right", color: "#818cf8" }}>EBITDA %</th>
                          <th style={{ padding: "8px 14px", textAlign: "right", color: "#06b6d4" }}>PAT %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.marginAnalysis.trend.map(t => (
                          <tr key={t.year} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "8px 14px", color: "#e2e8f0", fontWeight: 600 }}>{t.year}</td>
                            <td style={{ padding: "8px 14px", textAlign: "right", color: "#cbd5e1" }}>{t.grossMargin}%</td>
                            <td style={{ padding: "8px 14px", textAlign: "right", color: "#cbd5e1" }}>{t.ebitdaMargin}%</td>
                            <td style={{ padding: "8px 14px", textAlign: "right", color: "#cbd5e1" }}>{t.patMargin}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quarterly Results */}
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12, color: "#f1f5f9" }}>Quarterly Results</h4>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Quarter</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>Revenue (Cr)</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>PAT (Cr)</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>EBITDA %</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>EPS Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.quarterlyResults.map(q => (
                      <tr key={q.quarter} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{q.quarter}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>₹{q.revenue.toLocaleString()}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>₹{q.pat.toLocaleString()}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{q.ebitdaMargin}%</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: q.epsGrowth >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>{q.epsGrowth > 0 ? "+" : ""}{q.epsGrowth}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PEERS */}
          {activeSection === "peers" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Peer Comparison — {data.sector}</h3>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b" }}>Company</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>P/E</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>P/B</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>ROE %</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>MCap (Cr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: "rgba(99,102,241,0.05)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "10px 14px", color: "#818cf8", fontWeight: 700 }}>{data.symbol} ★</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#e2e8f0" }}>{data.hero.pe.toFixed(1)}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#e2e8f0" }}>{data.hero.pb.toFixed(1)}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#e2e8f0" }}>{data.fundamentals.roe}%</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#e2e8f0" }}>₹{data.hero.mcap.toLocaleString()}</td>
                    </tr>
                    {data.peerComparison.map(p => (
                      <tr key={p.symbol} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 14px", color: "#cbd5e1", fontWeight: 600 }}>{p.symbol}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{p.pe.toFixed(1)}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{p.pb.toFixed(1)}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{p.roe}%</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>₹{p.mcap.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NEWS */}
          {activeSection === "news" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>News & Events</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.newsEvents.map((n, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                      background: n.impact === "positive" ? "#10b981" : n.impact === "negative" ? "#ef4444" : "#f59e0b",
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#e2e8f0", marginBottom: 3 }}>{n.title}</div>
                      <div style={{ display: "flex", gap: 8, fontSize: "0.68rem" }}>
                        <span style={{ color: "#64748b" }}>{n.date}</span>
                        <span style={{ color: n.severity === "high" ? "#ef4444" : n.severity === "medium" ? "#f59e0b" : "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{n.severity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RISK */}
          {activeSection === "risk" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Risk Assessment</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontSize: "0.68rem", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Key Risks</div>
                  {[
                    "Sector-specific regulatory changes",
                    `High valuation (${data.hero.pe.toFixed(1)}x PE) leaves limited margin of safety`,
                    "FII outflow risk if global sentiment deteriorates",
                    data.fundamentals.debtEquity > 0.5 ? `Elevated debt (D/E: ${data.fundamentals.debtEquity})` : "Competitive intensity increasing",
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "0.7rem", marginTop: 2 }}>●</span>
                      <span style={{ fontSize: "0.78rem", color: "#e2e8f0", lineHeight: 1.4 }}>{r}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Strengths</div>
                  {[
                    `Strong ROE of ${data.fundamentals.roe}% indicates quality earnings`,
                    data.fundamentals.promoterHolding > 50 ? `High promoter holding (${data.fundamentals.promoterHolding}%) shows skin-in-the-game` : `Institutional interest — FII+DII own ${(data.fundamentals.fiiHolding + data.fundamentals.diiHolding).toFixed(1)}%`,
                    `Market leader in ${data.industry}`,
                    data.fundamentals.debtEquity < 0.3 ? "Near zero-debt balance sheet" : "Consistent earnings track record",
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: "#10b981", fontWeight: 800, fontSize: "0.7rem", marginTop: 2 }}>●</span>
                      <span style={{ fontSize: "0.78rem", color: "#e2e8f0", lineHeight: 1.4 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stress Tests */}
              {data.stressTests && (
                <div style={{ marginTop: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.05)", fontSize: "0.72rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase" }}>Stress Test Results</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b" }}>Scenario</th>
                        <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>EPS Impact</th>
                        <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>Price Impact</th>
                        <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>BS Resilience</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stressTests.map((st, i) => (
                        <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{st.scenario}</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#ef4444", fontWeight: 600 }}>{st.epsImpact}%</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: "#ef4444", fontWeight: 600 }}>{st.priceImpact}%</td>
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: "0.68rem", fontWeight: 600, background: st.bsResilience === "strong" ? "rgba(16,185,129,0.1)" : st.bsResilience === "moderate" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", color: st.bsResilience === "strong" ? "#10b981" : st.bsResilience === "moderate" ? "#f59e0b" : "#ef4444" }}>{st.bsResilience}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══ DCF VALUATION MODEL ═══ */}
          {activeSection === "dcf" && data.dcfValuation && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>DCF Valuation Model (FCFF)</h3>

              {/* Key Assumptions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
                <MetricCard label="WACC" value={`${data.dcfValuation.wacc}%`} color="#818cf8" />
                <MetricCard label="Terminal Growth" value={`${data.dcfValuation.terminalGrowth}%`} color="#10b981" />
                <MetricCard label="Beta" value={data.dcfValuation.beta.toString()} />
                <MetricCard label="Risk-Free Rate" value={`${data.dcfValuation.riskFreeRate}%`} />
                <MetricCard label="ERP" value={`${data.dcfValuation.erp}%`} />
              </div>

              {/* Intrinsic Value Card */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.03))", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "18px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Intrinsic Value</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#818cf8" }}>₹{data.dcfValuation.intrinsicValue.toLocaleString()}</div>
                  <div style={{ fontSize: "0.72rem", color: data.dcfValuation.upside > 0 ? "#10b981" : "#ef4444", marginTop: 4, fontWeight: 600 }}>{data.dcfValuation.upside > 0 ? "+" : ""}{data.dcfValuation.upside}% vs CMP</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Enterprise Value</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#e2e8f0" }}>₹{(data.dcfValuation.enterpriseValue / 100).toFixed(0)}K Cr</div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 4 }}>EV = PV(FCF) + PV(TV)</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Terminal Value</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#e2e8f0" }}>₹{(data.dcfValuation.pvTerminal / 100).toFixed(0)}K Cr</div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: 4 }}>PV of TV ({((data.dcfValuation.pvTerminal / data.dcfValuation.enterpriseValue) * 100).toFixed(0)}% of EV)</div>
                </div>
              </div>

              {/* FCF Projections Table */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.05)", fontSize: "0.72rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase" }}>5-Year FCF Projections (₹ Cr)</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b" }}>Year</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>FCF</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>PV of FCF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dcfValuation.fcfProjections.map((p, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{p.year}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#10b981" }}>₹{p.fcf.toLocaleString()}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>₹{p.pvFcf.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sensitivity Table */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", background: "rgba(245,158,11,0.05)", fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>Sensitivity Analysis (WACC vs Terminal Growth)</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#64748b" }}>WACC</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>Terminal Growth</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#94a3b8" }}>Fair Value/Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dcfValuation.sensitivity.map((s, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i === 2 ? "rgba(99,102,241,0.05)" : undefined }}>
                        <td style={{ padding: "10px 14px", color: "#e2e8f0", fontWeight: 600 }}>{s.wacc.toFixed(1)}%</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#cbd5e1" }}>{s.tg.toFixed(1)}%</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: s.value > data.hero.cmp ? "#10b981" : "#ef4444", fontWeight: 700 }}>₹{s.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Relative Valuation */}
              {data.relativeValuation && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12, color: "#f1f5f9" }}>Relative Valuation</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
                    <MetricCard label="Forward P/E" value={data.relativeValuation.forwardPe.toFixed(1)} sub={`Sector: ${data.relativeValuation.sectorAvgPe.toFixed(1)}x`} />
                    <MetricCard label="EV/EBITDA" value={`${data.relativeValuation.evEbitda}x`} />
                    <MetricCard label="EV/Sales" value={`${data.relativeValuation.evSales}x`} />
                    <MetricCard label="PEG Ratio" value={data.relativeValuation.pegRatio.toString()} color={data.relativeValuation.pegRatio < 1 ? "#10b981" : data.relativeValuation.pegRatio < 2 ? "#f59e0b" : "#ef4444"} />
                    <MetricCard label="P/FCF" value={`${data.relativeValuation.priceToFcf}x`} />
                    <MetricCard label="Premium/Discount" value={`${data.relativeValuation.premiumDiscount > 0 ? "+" : ""}${data.relativeValuation.premiumDiscount}%`} color={data.relativeValuation.premiumDiscount > 20 ? "#ef4444" : "#10b981"} sub="vs Sector avg" />
                  </div>
                  {/* Historical Bands */}
                  <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>Historical Valuation Band</div>
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: "0.78rem" }}>
                      <span style={{ color: "#10b981" }}>Low: ₹{data.relativeValuation.historicalBands.low.toLocaleString()}</span>
                      <span style={{ color: "#f59e0b" }}>Avg: ₹{data.relativeValuation.historicalBands.avg.toLocaleString()}</span>
                      <span style={{ color: "#ef4444" }}>High: ₹{data.relativeValuation.historicalBands.high.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ SCENARIO ANALYSIS ═══ */}
          {activeSection === "scenarios" && data.scenarios && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Scenario Analysis</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
                {(["bull", "base", "bear"] as const).map(scenario => {
                  const s = data.scenarios![scenario];
                  const color = scenario === "bull" ? "#10b981" : scenario === "bear" ? "#ef4444" : "#f59e0b";
                  const bgColor = scenario === "bull" ? "rgba(16,185,129,0.06)" : scenario === "bear" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)";
                  const borderColor = scenario === "bull" ? "rgba(16,185,129,0.15)" : scenario === "bear" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)";
                  return (
                    <div key={scenario} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 14, padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color, textTransform: "uppercase" }}>{scenario} Case</div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 4 }}>{s.probability}%</div>
                      </div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color, marginBottom: 8 }}>₹{s.targetPrice.toLocaleString()}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>EPS: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>₹{s.eps.toFixed(1)}</span></div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>P/E: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{s.pe.toFixed(1)}x</span></div>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.5, borderTop: `1px solid ${borderColor}`, paddingTop: 10 }}>{s.narrative}</div>
                    </div>
                  );
                })}
              </div>

              {/* Balance Sheet & Cash Flows Summary */}
              {data.balanceSheet && data.cashFlows && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Balance Sheet */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px" }}>
                    <div style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Balance Sheet</div>
                    {[
                      { label: "Net Debt", value: `₹${data.balanceSheet.netDebt.toLocaleString()} Cr`, color: data.balanceSheet.netDebt < 0 ? "#10b981" : "#f59e0b" },
                      { label: "Net Debt/EBITDA", value: `${data.balanceSheet.netDebtEbitda}x`, color: data.balanceSheet.netDebtEbitda < 2 ? "#10b981" : "#ef4444" },
                      { label: "Interest Coverage", value: `${data.balanceSheet.interestCoverage}x`, color: data.balanceSheet.interestCoverage > 5 ? "#10b981" : "#f59e0b" },
                      { label: "Current Ratio", value: data.balanceSheet.currentRatio.toString(), color: data.balanceSheet.currentRatio > 1.5 ? "#10b981" : "#f59e0b" },
                      { label: "Tangible Book Value", value: `₹${data.balanceSheet.tangibleBookValue.toLocaleString()} Cr` },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.76rem" }}>
                        <span style={{ color: "#94a3b8" }}>{item.label}</span>
                        <span style={{ color: item.color || "#e2e8f0", fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Cash Flows */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px" }}>
                    <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Cash Flow Analysis</div>
                    {[
                      { label: "Operating CF", value: `₹${data.cashFlows.cfo.toLocaleString()} Cr`, color: "#10b981" },
                      { label: "Free Cash Flow", value: `₹${data.cashFlows.fcf.toLocaleString()} Cr`, color: data.cashFlows.fcf > 0 ? "#10b981" : "#ef4444" },
                      { label: "FCF Yield", value: `${data.cashFlows.fcfYield}%`, color: data.cashFlows.fcfYield > 3 ? "#10b981" : "#f59e0b" },
                      { label: "CFO/PAT", value: `${data.cashFlows.cfoPat}%`, color: data.cashFlows.cfoPat > 100 ? "#10b981" : "#f59e0b" },
                      { label: "Capex Intensity", value: `${data.cashFlows.capexIntensity}%` },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.76rem" }}>
                        <span style={{ color: "#94a3b8" }}>{item.label}</span>
                        <span style={{ color: item.color || "#e2e8f0", fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Working Capital */}
              {data.workingCapital && (
                <div style={{ marginTop: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Working Capital Efficiency</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                    <MetricCard label="Receivable Days" value={data.workingCapital.receivableDays.toString()} />
                    <MetricCard label="Payable Days" value={data.workingCapital.payableDays.toString()} />
                    <MetricCard label="Inventory Days" value={data.workingCapital.inventoryDays.toString()} />
                    <MetricCard label="Cash Conv. Cycle" value={`${data.workingCapital.ccc} days`} color={data.workingCapital.ccc < 30 ? "#10b981" : data.workingCapital.ccc < 60 ? "#f59e0b" : "#ef4444"} />
                    <MetricCard label="WC/Revenue" value={`${data.workingCapital.wcAsRevenue}%`} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ EARNINGS QUALITY ═══ */}
          {activeSection === "earnings" && data.earningsQuality && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Earnings Quality Assessment</h3>

              {/* Scores Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
                {[
                  { label: "Overall Score", value: data.earningsQuality.overallEarningsScore, color: data.earningsQuality.overallEarningsScore > 70 ? "#10b981" : "#f59e0b" },
                  { label: "Cash Conversion", value: data.earningsQuality.cashConversionScore, color: data.earningsQuality.cashConversionScore > 70 ? "#10b981" : "#f59e0b" },
                  { label: "Accounting Quality", value: data.earningsQuality.accountingQualityScore, color: data.earningsQuality.accountingQualityScore > 70 ? "#10b981" : "#f59e0b" },
                  { label: "Revenue Quality", value: data.earningsQuality.revenueQualityScore, color: data.earningsQuality.revenueQualityScore > 70 ? "#10b981" : "#f59e0b" },
                  { label: "Persistence", value: data.earningsQuality.earningsPersistenceScore, color: data.earningsQuality.earningsPersistenceScore > 70 ? "#10b981" : "#f59e0b" },
                  { label: "Financial Strength", value: data.earningsQuality.financialStrengthScore, color: data.earningsQuality.financialStrengthScore > 70 ? "#10b981" : "#f59e0b" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: "0.62rem", color: "#64748b" }}>/ 100</div>
                  </div>
                ))}
              </div>

              {/* Key Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
                <MetricCard label="CFO/PAT" value={`${data.earningsQuality.cfoPATRatio}%`} color={data.earningsQuality.cfoPATRatio > 100 ? "#10b981" : "#f59e0b"} />
                <MetricCard label="Accrual Ratio" value={`${data.earningsQuality.accrualRatio}%`} color={data.earningsQuality.accrualRatio < 5 ? "#10b981" : "#ef4444"} />
                <MetricCard label="Other Income" value={`${data.earningsQuality.otherIncomeShare}%`} sub="of PBT" />
                <MetricCard label="RPT Level" value={data.earningsQuality.relatedPartyTransactions} />
                <MetricCard label="Auditor" value={data.earningsQuality.auditorObservations} />
              </div>

              {/* Flags */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Quality Flags</div>
                {data.earningsQuality.flags.map((flag, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0 }}>{flag.startsWith("✓") ? "" : flag.startsWith("⚠") ? "" : "•"}</span>
                    <span style={{ fontSize: "0.8rem", color: flag.startsWith("✓") ? "#10b981" : flag.startsWith("⚠") ? "#f59e0b" : "#e2e8f0", lineHeight: 1.5 }}>{flag.slice(2)}</span>
                  </div>
                ))}
              </div>

              {/* Re-Rating Catalysts */}
              {data.reRatingCatalysts && (
                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 14, padding: "18px" }}>
                    <div style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Upside Catalysts</div>
                    {data.reRatingCatalysts.upsideCatalysts.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <span style={{ color: "#10b981", fontSize: "0.7rem", marginTop: 3 }}>▲</span>
                        <span style={{ fontSize: "0.76rem", color: "#e2e8f0", lineHeight: 1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 14, padding: "18px" }}>
                    <div style={{ fontSize: "0.68rem", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Downside Risks</div>
                    {data.reRatingCatalysts.downsideRisks.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <span style={{ color: "#ef4444", fontSize: "0.7rem", marginTop: 3 }}>▼</span>
                        <span style={{ fontSize: "0.76rem", color: "#e2e8f0", lineHeight: 1.5 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ INVESTMENT CONCLUSION ═══ */}
          {activeSection === "conclusion" && data.investmentConclusion && (
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "#f1f5f9" }}>Investment Conclusion</h3>

              {/* View Banner */}
              <div style={{
                background: data.investmentConclusion.view.includes("UNDERVALUED") ? "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.03))" : data.investmentConclusion.view.includes("OVERVALUED") ? "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03))" : "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03))",
                border: `1px solid ${data.investmentConclusion.view.includes("UNDERVALUED") ? "rgba(16,185,129,0.2)" : data.investmentConclusion.view.includes("OVERVALUED") ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                borderRadius: 16, padding: "24px", textAlign: "center", marginBottom: 20,
              }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>AI Investment View</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: data.investmentConclusion.view.includes("UNDERVALUED") ? "#10b981" : data.investmentConclusion.view.includes("OVERVALUED") ? "#ef4444" : "#f59e0b" }}>
                  {data.investmentConclusion.view}
                </div>
              </div>

              {/* Fair Value Range */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                <MetricCard label="Fair Value Low" value={`₹${data.investmentConclusion.fairValueLow.toLocaleString()}`} color="#ef4444" />
                <MetricCard label="Fair Value Mid" value={`₹${data.investmentConclusion.fairValueMid.toLocaleString()}`} color="#818cf8" />
                <MetricCard label="Fair Value High" value={`₹${data.investmentConclusion.fairValueHigh.toLocaleString()}`} color="#10b981" />
                <MetricCard label="CMP" value={`₹${data.hero.cmp.toLocaleString()}`} />
              </div>

              {/* Key Numbers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                <MetricCard label="Margin of Safety" value={`${data.investmentConclusion.marginOfSafety}%`} color={data.investmentConclusion.marginOfSafety > 15 ? "#10b981" : data.investmentConclusion.marginOfSafety > 0 ? "#f59e0b" : "#ef4444"} />
                <MetricCard label="Risk:Reward" value={data.investmentConclusion.riskRewardRatio} />
                <MetricCard label="Expected Return (12M)" value={`${data.investmentConclusion.expectedReturn12M > 0 ? "+" : ""}${data.investmentConclusion.expectedReturn12M}%`} color={data.investmentConclusion.expectedReturn12M > 15 ? "#10b981" : "#f59e0b"} />
                <MetricCard label="Downside Risk" value={`${data.investmentConclusion.downsideRisk}%`} color="#ef4444" />
              </div>

              {/* Key Monitorables */}
              <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Key Monitorables</div>
                {data.investmentConclusion.keyMonitorables.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <span style={{ color: "#818cf8", fontWeight: 800, fontSize: "0.72rem", marginTop: 2 }}>{i + 1}.</span>
                    <span style={{ fontSize: "0.8rem", color: "#e2e8f0", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Return Ratios */}
              {data.returnRatios && (
                <div style={{ marginTop: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Return Ratios & Capital Efficiency</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                    <MetricCard label="ROE" value={`${data.returnRatios.roe}%`} color={data.returnRatios.roe > 15 ? "#10b981" : "#f59e0b"} />
                    <MetricCard label="ROCE" value={`${data.returnRatios.roce}%`} color={data.returnRatios.roce > 15 ? "#10b981" : "#f59e0b"} />
                    <MetricCard label="ROIC" value={`${data.returnRatios.roic}%`} color={data.returnRatios.roic > 12 ? "#10b981" : "#f59e0b"} />
                    <MetricCard label="WACC" value={`${data.returnRatios.wacc}%`} />
                    <MetricCard label="Spread over CoC" value={`${data.returnRatios.spreadOverCoC > 0 ? "+" : ""}${data.returnRatios.spreadOverCoC}%`} color={data.returnRatios.spreadOverCoC > 0 ? "#10b981" : "#ef4444"} />
                    <MetricCard label="Incr. ROCE" value={`${data.returnRatios.incrementalRoce}%`} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR — Market Intelligence */}
        <aside style={{ width: 300, minWidth: 280, borderLeft: "1px solid rgba(255,255,255,0.05)", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", maxHeight: "calc(100vh - 110px)" }}>
          {/* Quick Stats */}
          <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(16,185,129,0.05))", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.65rem", color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Quick View</div>
            {[
              { label: "Sector", value: data.sector },
              { label: "Industry", value: data.industry },
              { label: "Market Cap", value: `₹${(data.hero.mcap / 100).toFixed(0)}K Cr` },
              { label: "Face Value", value: `₹${data.hero.faceValue}` },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.72rem" }}>
                <span style={{ color: "#64748b" }}>{item.label}</span>
                <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* AI Verdict */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.65rem", color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>AI Verdict</div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.6 }}>
              {data.companyName} is rated <strong style={{ color: sentimentColor }}>{data.sentiment.label}</strong> with {data.sentiment.confidence}% confidence.
              {data.fairValue.upside > 10 ? ` The stock appears undervalued with ${data.fairValue.upside}% upside to fair value.` : data.fairValue.upside < -10 ? ` Valuations appear stretched with limited upside.` : ` Fairly valued at current levels.`}
            </div>
          </div>

          {/* Sector Alert */}
          <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Sector Watch — {data.sector}</div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.5 }}>
              {data.sector} sector showing {data.hero.changePercent > 0 ? "positive" : "mixed"} momentum. Institutional flows remain {data.fundamentals.fiiHolding > 20 ? "supportive" : "cautious"}. Monitor RBI policy and global cues for sector direction.
            </div>
          </div>

          {/* Key Levels */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Key Levels</div>
            {[
              { label: "Support", value: `₹${data.technicals.support.toLocaleString()}`, color: "#10b981" },
              { label: "Resistance", value: `₹${data.technicals.resistance.toLocaleString()}`, color: "#ef4444" },
              { label: "Target", value: `₹${data.analystConsensus.targetPrice.toLocaleString()}`, color: "#818cf8" },
              { label: "Stop Loss", value: `₹${(data.technicals.support * 0.97).toFixed(0)}`, color: "#ef4444" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "0.72rem" }}>
                <span style={{ color: "#64748b" }}>{l.label}</span>
                <span style={{ color: l.color, fontWeight: 700 }}>{l.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
