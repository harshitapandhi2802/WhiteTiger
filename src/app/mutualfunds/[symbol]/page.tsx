"use client";
import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MUTUAL_FUNDS, type MutualFundEntry,
} from "@/lib/mutualfunds";
import {
  generateFundDetail, generateMFRisks, generateMFDrivers, generateMFSparkline, getCategoryInsights,
  MF_GLOSSARY, MF_GLOSSARY_CATEGORIES, MF_QUANT_MODELS, MF_AI_FEATURES, MF_DATA_SOURCES,
  type FundDetailedInfo, type MFRisk, type MFDriver, type MFTerm,
} from "@/lib/mf-data";

/* ═══════════════════════════════════════════════════════════════
   FULL-SCREEN MUTUAL FUND INTELLIGENCE PAGE
   /mutualfunds/[symbol] — Morningstar + Value Research + Bloomberg
   ═══════════════════════════════════════════════════════════════ */

function resolveFund(slug: string): MutualFundEntry | null {
  const decoded = decodeURIComponent(slug).toUpperCase().replace(/-/g, "-");
  let entry = MUTUAL_FUNDS.find(f => f.symbol === decoded);
  if (entry) return entry;
  entry = MUTUAL_FUNDS.find(f => f.symbol.toLowerCase() === decoded.toLowerCase());
  if (entry) return entry;
  const lower = decodeURIComponent(slug).toLowerCase().replace(/-/g, " ");
  entry = MUTUAL_FUNDS.find(f => f.name.toLowerCase().includes(lower));
  if (entry) return entry;
  entry = MUTUAL_FUNDS.find(f => f.symbol.toLowerCase().includes(decoded.toLowerCase()));
  return entry || null;
}

/* ─── Utility Components ─── */
function Spark({ data, color = "#69f0ae", w = 200, h = 40 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`hmf-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#hmf-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bar({ value, max = 100, color = "#7c3aed", h = 6 }: { value: number; max?: number; color?: string; h?: number }) {
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: "#ede9fe", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%`, height: "100%", borderRadius: h, background: color, transition: "width 0.4s" }} />
    </div>
  );
}

function ScoreRing({ value, label, size = 72 }: { value: number; label: string; size?: number }) {
  const pct = Math.min(100, Math.abs(value));
  const color = value > 70 ? "#00c853" : value > 45 ? "#7c3aed" : value > 25 ? "#ff9800" : "#ef5350";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 4px" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 900, color }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function Badge({ text, variant = "neutral" }: { text: string; variant?: "green" | "red" | "orange" | "blue" | "neutral" | "purple" | "teal" }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    green: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    red: { bg: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
    orange: { bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
    blue: { bg: "#e3f2fd", color: "#0d47a1", border: "#90caf9" },
    purple: { bg: "#f3e5f5", color: "#6a1b9a", border: "#ce93d8" },
    teal: { bg: "#e0f2f1", color: "#004d40", border: "#80cbc4" },
    neutral: { bg: "#f5f5f5", color: "#616161", border: "#e0e0e0" },
  };
  const c = colors[variant];
  return (
    <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

/* ─── Sector Allocation Bar Chart ─── */
function SectorChart({ data }: { data: { sector: string; weight: number }[] }) {
  const sorted = [...data].sort((a, b) => b.weight - a.weight).slice(0, 8);
  const colors = ["#7c3aed", "#2962ff", "#00897b", "#e65100", "#c62828", "#00838f", "#4527a0", "#ff6f00"];
  return (
    <div>
      {sorted.map((s, i) => (
        <div key={s.sector} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 90, fontSize: "0.62rem", fontWeight: 600, color: "#555", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sector}</div>
          <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#f0f0f5", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, s.weight * 3)}%`, height: "100%", borderRadius: 5, background: colors[i % colors.length], transition: "width 0.4s" }} />
          </div>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: colors[i % colors.length], minWidth: 35, textAlign: "right" }}>{s.weight}%</span>
        </div>
      ))}
    </div>
  );
}

/* ─── AI Intelligence Section ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AIIntelligenceSection({ entry }: { entry: MutualFundEntry }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchIntel = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/mf-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: entry.symbol, name: entry.name, amc: entry.amc, category: entry.category, riskLevel: entry.riskLevel }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, [entry]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "portfolio", label: "Portfolio", icon: "📋" },
    { id: "manager", label: "Fund Manager", icon: "👤" },
    { id: "investor", label: "Investor View", icon: "🎯" },
    { id: "macro", label: "Macro Impact", icon: "🌍" },
    { id: "views", label: "Inst. Views", icon: "🏦" },
    { id: "insights", label: "Insights", icon: "⚡" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg, #4a148c, #6a1b9a, #7c3aed)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? "#ff9800" : data ? "#00e676" : "#888", boxShadow: `0 0 6px ${loading ? "rgba(255,152,0,0.5)" : data ? "rgba(0,230,118,0.5)" : "transparent"}` }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>AI-Powered Fund Intelligence</span>
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: 4 }}>{entry.name} — Deep Analysis</div>
        <div style={{ fontSize: "0.68rem", opacity: 0.6 }}>Portfolio quality, fund manager analysis, investor suitability, macro impact, institutional views</div>
      </div>

      <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
        {!data && !loading && (
          <button onClick={fetchIntel} style={{
            padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #4a148c)",
            color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
            boxShadow: "0 4px 16px rgba(124,58,237,0.3)", transition: "all 0.2s",
          }}>
            Generate Intelligence Report
          </button>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #ede9fe", borderTopColor: "#7c3aed", borderRadius: "50%", margin: "0 auto 12px", animation: "mf-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>Generating Fund Intelligence...</div>
            <div style={{ fontSize: "0.65rem", color: "#999", marginTop: 4 }}>Analyzing {entry.name} — portfolio, manager, macro, investor suitability</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c62828", marginBottom: 8 }}>Failed: {error}</div>
            <button onClick={fetchIntel} style={{ padding: "8px 20px", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.72rem" }}>Retry</button>
          </div>
        )}

        {data && !loading && (
          <>
            <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: "6px 12px", borderRadius: 8, border: activeTab === t.id ? "1.5px solid #7c3aed" : "1px solid transparent",
                  background: activeTab === t.id ? "#f3e5f5" : "transparent", color: activeTab === t.id ? "#7c3aed" : "#666",
                  fontSize: "0.62rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3,
                }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <div style={{ minHeight: 300 }}>
              {activeTab === "overview" && data.overview && (
                <div>
                  <div style={{ background: "linear-gradient(135deg, #4a148c, #7c3aed)", borderRadius: 14, padding: "20px 24px", marginBottom: 16, color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: "2.2rem", fontWeight: 900 }}>₹{data.overview.currentNAV?.toFixed(2)}</span>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: data.overview.navChangePct1d >= 0 ? "#69f0ae" : "#ff5252" }}>
                        {data.overview.navChangePct1d >= 0 ? "▲" : "▼"} {Math.abs(data.overview.navChange1d)?.toFixed(2)} ({data.overview.navChangePct1d >= 0 ? "+" : ""}{data.overview.navChangePct1d?.toFixed(2)}%)
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: "0.68rem", opacity: 0.7 }}>
                      <span>AUM: {data.overview.aum}</span>
                      <span>ER: {data.overview.expenseRatio}%</span>
                      <span>Rank: {data.overview.categoryRank}</span>
                      <span>{"⭐".repeat(data.overview.morningstarRating || 3)}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "1Y Return", value: `${data.overview.return1y >= 0 ? "+" : ""}${data.overview.return1y?.toFixed(1)}%`, color: data.overview.return1y >= 0 ? "#00c853" : "#ef5350" },
                      { label: "3Y CAGR", value: `${data.overview.return3y >= 0 ? "+" : ""}${data.overview.return3y?.toFixed(1)}%`, color: data.overview.return3y >= 0 ? "#00c853" : "#ef5350" },
                      { label: "5Y CAGR", value: `${data.overview.return5y >= 0 ? "+" : ""}${data.overview.return5y?.toFixed(1)}%`, color: data.overview.return5y >= 0 ? "#00c853" : "#ef5350" },
                      { label: "Alpha (1Y)", value: `${data.overview.alpha1y >= 0 ? "+" : ""}${data.overview.alpha1y?.toFixed(1)}%`, color: data.overview.alpha1y >= 0 ? "#00c853" : "#ef5350" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "10px 12px", borderRadius: 10, background: "#faf5ff", border: "1px solid #ede9fe" }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#2e7d32", marginBottom: 2 }}>SIP 3Y XIRR</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1b5e20" }}>{data.overview.sipReturn3y >= 0 ? "+" : ""}{data.overview.sipReturn3y?.toFixed(1)}%</div>
                    </div>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#2e7d32", marginBottom: 2 }}>SIP 5Y XIRR</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1b5e20" }}>{data.overview.sipReturn5y >= 0 ? "+" : ""}{data.overview.sipReturn5y?.toFixed(1)}%</div>
                    </div>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#7c3aed", marginBottom: 2 }}>Benchmark 1Y</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4a148c" }}>{data.overview.benchmarkReturn1y >= 0 ? "+" : ""}{data.overview.benchmarkReturn1y?.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "portfolio" && data.portfolioAnalysis && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[
                      { label: "Portfolio PE", value: data.portfolioAnalysis.portfolioPE?.toFixed(1) + "x" },
                      { label: "Portfolio PB", value: data.portfolioAnalysis.portfolioPB?.toFixed(1) + "x" },
                      { label: "Portfolio ROE", value: data.portfolioAnalysis.portfolioROE?.toFixed(1) + "%" },
                      { label: "Top 10 Conc.", value: data.portfolioAnalysis.concentrationTop10?.toFixed(1) + "%" },
                      { label: "Turnover", value: data.portfolioAnalysis.turnoverRatio?.toFixed(0) + "%" },
                      { label: "Cash", value: data.portfolioAnalysis.cashHolding?.toFixed(1) + "%" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "8px 10px", borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe", textAlign: "center" }}>
                        <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "#999", textTransform: "uppercase" }}>{s.label}</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4a148c" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, padding: 12, borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#7c3aed", marginBottom: 6, textTransform: "uppercase" }}>Market Cap</div>
                      {[
                        { label: "Large Cap", value: data.portfolioAnalysis.marketCapBreakdown?.largeCap, color: "#2962ff" },
                        { label: "Mid Cap", value: data.portfolioAnalysis.marketCapBreakdown?.midCap, color: "#7c3aed" },
                        { label: "Small Cap", value: data.portfolioAnalysis.marketCapBreakdown?.smallCap, color: "#e65100" },
                      ].map(m => (
                        <div key={m.label} style={{ marginBottom: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", marginBottom: 2 }}>
                            <span style={{ color: "#666" }}>{m.label}</span>
                            <span style={{ fontWeight: 700, color: m.color }}>{m.value}%</span>
                          </div>
                          <Bar value={m.value} color={m.color} h={4} />
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ede9fe" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#7c3aed", marginBottom: 6, textTransform: "uppercase" }}>Quality</div>
                      <Badge text={`Quality: ${data.portfolioAnalysis.portfolioQuality}`} variant={data.portfolioAnalysis.portfolioQuality === "strong" ? "green" : data.portfolioAnalysis.portfolioQuality === "moderate" ? "orange" : "red"} />
                      <div style={{ marginTop: 8 }}>
                        <Badge text={`Style Drift: ${data.portfolioAnalysis.styleDrift}`} variant={data.portfolioAnalysis.styleDrift === "none" ? "green" : data.portfolioAnalysis.styleDrift === "minor" ? "orange" : "red"} />
                      </div>
                    </div>
                  </div>
                  {data.portfolioAnalysis.topSectors && (
                    <div style={{ padding: 14, borderRadius: 10, background: "#fff", border: "1px solid #ede9fe" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#7c3aed", marginBottom: 8, textTransform: "uppercase" }}>Top Sectors</div>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {data.portfolioAnalysis.topSectors.slice(0, 6).map((s: any, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 600 }}>{s.sector}</span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#4a148c" }}>{s.weight}%</span>
                            <Badge text={s.outlook} variant={s.outlook === "positive" ? "green" : s.outlook === "negative" ? "red" : "neutral"} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "manager" && data.fundManagerAnalysis && (
                <div>
                  <div style={{ padding: 16, borderRadius: 12, background: "linear-gradient(135deg, #faf5ff, #f3e5f5)", border: "1px solid #ede9fe", marginBottom: 14 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4a148c", marginBottom: 4 }}>{data.fundManagerAnalysis.name}</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <Badge text={`${data.fundManagerAnalysis.experience} exp`} variant="purple" />
                      <Badge text={`Tenure: ${data.fundManagerAnalysis.tenure}`} variant="blue" />
                      <Badge text={data.fundManagerAnalysis.investmentStyle} variant="teal" />
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#555", marginBottom: 6 }}>{data.fundManagerAnalysis.trackRecord}</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.5rem", color: "#999", textTransform: "uppercase" }}>Alpha</div>
                        <Badge text={data.fundManagerAnalysis.alphaGeneration} variant={data.fundManagerAnalysis.alphaGeneration === "consistent" ? "green" : data.fundManagerAnalysis.alphaGeneration === "inconsistent" ? "orange" : "red"} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.5rem", color: "#999", textTransform: "uppercase" }}>Risk Taking</div>
                        <Badge text={data.fundManagerAnalysis.riskTaking} variant={data.fundManagerAnalysis.riskTaking === "conservative" ? "green" : data.fundManagerAnalysis.riskTaking === "moderate" ? "blue" : "orange"} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 6px" }}>
                        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ede9fe" strokeWidth="2.5" />
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke={data.fundManagerAnalysis.managerScore > 70 ? "#00c853" : data.fundManagerAnalysis.managerScore > 45 ? "#7c3aed" : "#ff9800"} strokeWidth="2.5" strokeDasharray={`${data.fundManagerAnalysis.managerScore * 0.97} 100`} strokeLinecap="round" />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 900, color: "#4a148c" }}>{data.fundManagerAnalysis.managerScore}</div>
                      </div>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>Manager Score</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "investor" && data.investorPerspective && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[
                      { label: "Wealth Creation", value: data.investorPerspective.wealthCreationScore },
                      { label: "Retirement Fit", value: data.investorPerspective.retirementSuitability },
                      { label: "Crash Resilience", value: data.investorPerspective.crashResilience },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center", padding: 12, borderRadius: 10, background: "#faf5ff", border: "1px solid #ede9fe" }}>
                        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 4px" }}>
                          <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ede9fe" strokeWidth="2.5" />
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke={s.value > 70 ? "#00c853" : s.value > 45 ? "#7c3aed" : "#ff9800"} strokeWidth="2.5" strokeDasharray={`${s.value * 0.97} 100`} strokeLinecap="round" />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800 }}>{s.value}</div>
                        </div>
                        <div style={{ fontSize: "0.52rem", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {[
                    { q: "Long-Term Wealth Creation?", a: data.investorPerspective.isGoodForLongTerm },
                    { q: "Is This Fund Overhyped?", a: data.investorPerspective.isOverhyped },
                  ].map(item => (
                    <div key={item.q} style={{ padding: "10px 14px", borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe", marginBottom: 8 }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#7c3aed", marginBottom: 3 }}>{item.q}</div>
                      <div style={{ fontSize: "0.65rem", color: "#555" }}>{item.a}</div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#e3f2fd", border: "1px solid #90caf9", textAlign: "center" }}>
                      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "#0d47a1", textTransform: "uppercase" }}>Downside Risk</div>
                      <Badge text={data.investorPerspective.downsideRisk} variant={data.investorPerspective.downsideRisk === "low" ? "green" : data.investorPerspective.downsideRisk === "moderate" ? "orange" : "red"} />
                    </div>
                    <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#e8f5e9", border: "1px solid #a5d6a7", textAlign: "center" }}>
                      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "#2e7d32", textTransform: "uppercase" }}>SIP Suitability</div>
                      <Badge text={data.investorPerspective.sipSuitability} variant={data.investorPerspective.sipSuitability === "excellent" ? "green" : data.investorPerspective.sipSuitability === "good" ? "blue" : "orange"} />
                    </div>
                    <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe", textAlign: "center" }}>
                      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "#7c3aed", textTransform: "uppercase" }}>Best For</div>
                      <div style={{ fontSize: "0.58rem", fontWeight: 600, color: "#4a148c", marginTop: 2 }}>{data.investorPerspective.bestSuitedFor}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "macro" && data.macroImpact && (
                <div>
                  {[
                    { label: "Interest Rate Impact", value: data.macroImpact.interestRateImpact, icon: "🏛️" },
                    { label: "Inflation Impact", value: data.macroImpact.inflationImpact, icon: "🔥" },
                    { label: "Global Risk Impact", value: data.macroImpact.globalRiskImpact, icon: "🌍" },
                    { label: "Sector Cycle Position", value: data.macroImpact.sectorCyclePosition, icon: "📈" },
                  ].map(item => (
                    <div key={item.label} style={{ padding: "10px 14px", borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe", marginBottom: 8 }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#7c3aed", marginBottom: 3 }}>{item.icon} {item.label}</div>
                      <div style={{ fontSize: "0.65rem", color: "#555" }}>{item.value}</div>
                    </div>
                  ))}
                  {data.macroImpact.macroVerdict && (
                    <div style={{ padding: 12, borderRadius: 8, background: "#fffde7", border: "1px solid #fff9c4", fontSize: "0.68rem", color: "#555" }}>
                      <strong style={{ color: "#f57f17" }}>Macro Verdict:</strong> {data.macroImpact.macroVerdict}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "views" && data.institutionalViews && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.institutionalViews.map((v: any, i: number) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#fff", border: "1px solid #eef0f2", borderLeft: `4px solid ${v.rating === "buy" || v.rating === "outperform" ? "#00c853" : v.rating === "sell" || v.rating === "underperform" ? "#ef5350" : "#ff9800"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{v.firm}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Badge text={v.rating} variant={v.rating === "buy" || v.rating === "outperform" ? "green" : v.rating === "sell" || v.rating === "underperform" ? "red" : "orange"} />
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#7c3aed" }}>{v.targetReturn}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#666" }}>{v.thesis}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "insights" && data.insights && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.insights.map((ins: any, i: number) => {
                    const cfg: Record<string, { icon: string; color: string; bg: string }> = { warning: { icon: "⚠️", color: "#e65100", bg: "#fff3e0" }, opportunity: { icon: "💡", color: "#2e7d32", bg: "#e8f5e9" }, info: { icon: "📊", color: "#0d47a1", bg: "#e3f2fd" }, risk: { icon: "🔴", color: "#c62828", bg: "#ffebee" } };
                    const c = cfg[ins.type] || cfg.info;
                    return (
                      <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: c.bg, borderLeft: `4px solid ${c.color}`, display: "flex", gap: 8 }}>
                        <span>{c.icon}</span>
                        <div>
                          {ins.urgency === "high" && <span style={{ fontSize: "0.48rem", fontWeight: 800, color: "#fff", background: "#c62828", padding: "1px 4px", borderRadius: 3, marginRight: 4 }}>URGENT</span>}
                          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#333" }}>{ins.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button onClick={fetchIntel} style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", fontSize: "0.62rem", fontWeight: 700 }}>Refresh Intelligence</button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes mf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */

type PageSection = "overview" | "intelligence" | "fundinfo" | "portfolio" | "returns" | "drivers" | "risk" | "quant" | "glossary" | "ai" | "data";

const PAGE_SECTIONS: { id: PageSection; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "intelligence", label: "AI Analysis", icon: "🤖" },
  { id: "fundinfo", label: "Fund Info", icon: "📋" },
  { id: "portfolio", label: "Portfolio", icon: "💼" },
  { id: "returns", label: "Returns", icon: "📈" },
  { id: "drivers", label: "Market Drivers", icon: "🌍" },
  { id: "risk", label: "Risk Analysis", icon: "⚠️" },
  { id: "quant", label: "Quant Models", icon: "🧮" },
  { id: "glossary", label: "Glossary", icon: "📖" },
  { id: "ai", label: "AI Features", icon: "🔮" },
  { id: "data", label: "Data Sources", icon: "🗄️" },
];

export default function MutualFundPage() {
  const params = useParams();
  const slug = typeof params.symbol === "string" ? params.symbol : Array.isArray(params.symbol) ? params.symbol[0] : "";
  const entry = useMemo(() => resolveFund(slug), [slug]);

  const [section, setSection] = useState<PageSection>("overview");
  const [glossaryCat, setGlossaryCat] = useState<string>("All");

  if (!entry) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafbfc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8 }}>Mutual Fund Not Found</h1>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 20 }}>Could not resolve &ldquo;{slug}&rdquo; to a known mutual fund.</p>
          <Link href="/analyze" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#7c3aed", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const fundDetail = generateFundDetail(entry.symbol, entry.name, entry.amc, entry.category, entry.riskLevel);
  const risks = generateMFRisks(entry.symbol, entry.category, entry.riskLevel);
  const drivers = generateMFDrivers(entry.category);
  const sparkData = generateMFSparkline(entry.symbol);
  const catInsights = getCategoryInsights();
  const thisCat = catInsights.find(c => c.category === entry.category);

  const riskColor = entry.riskLevel === "Low" ? "#00c853" : entry.riskLevel === "Moderate" ? "#ff9800" : entry.riskLevel === "Very High" ? "#c62828" : "#f44336";

  const filteredGlossary = glossaryCat === "All" ? MF_GLOSSARY : MF_GLOSSARY.filter(t => t.category === glossaryCat);

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc" }}>
      {/* ═══ CINEMATIC HERO ═══ */}
      <div style={{
        background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 30%, #4a148c 60%, #6a1b9a 100%)",
        padding: "28px 40px 32px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/analyze" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.68rem", fontWeight: 600, marginBottom: 16, transition: "color 0.2s" }}>
            ← Back to White Tiger Dashboard
          </Link>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: -1 }}>{entry.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, fontSize: "0.55rem", fontWeight: 700, background: "rgba(0,200,83,0.15)", color: "#69f0ae" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#69f0ae", animation: "pulse-glow 2s infinite" }} />LIVE
                </span>
                <Badge text={entry.category} variant="purple" />
                <Badge text={entry.riskLevel + " Risk"} variant={entry.riskLevel === "Low" ? "green" : entry.riskLevel === "Moderate" ? "orange" : "red"} />
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.6, marginBottom: 4 }}>{entry.amc} · {fundDetail.planType}</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.4 }}>Benchmark: {fundDetail.benchmarkIndex} · Manager: {fundDetail.fundManager}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Spark data={sparkData} color="#b388ff" w={220} h={50} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 20 }}>
            {[
              { label: "NAV", value: `₹${fundDetail.nav}`, color: "#b388ff" },
              { label: "1Y Return", value: `${fundDetail.return1y >= 0 ? "+" : ""}${fundDetail.return1y}%`, color: fundDetail.return1y >= 0 ? "#69f0ae" : "#ff5252" },
              { label: "3Y CAGR", value: `${fundDetail.return3y >= 0 ? "+" : ""}${fundDetail.return3y}%`, color: fundDetail.return3y >= 0 ? "#69f0ae" : "#ff5252" },
              { label: "AUM", value: fundDetail.aum, color: "#ffd740" },
              { label: "Expense Ratio", value: `${fundDetail.expenseRatio}%`, color: "#82b1ff" },
              { label: "Sharpe", value: `${fundDetail.sharpe}`, color: fundDetail.sharpe > 1 ? "#69f0ae" : "#ffd740" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.48rem", fontWeight: 600, opacity: 0.45, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SECTION TABS ═══ */}
      <div style={{
        display: "flex", gap: 4, padding: "10px 40px",
        borderBottom: "1px solid #e5e7eb", background: "#fff",
        overflowX: "auto", scrollbarWidth: "none", position: "sticky", top: 0, zIndex: 10,
      }}>
        {PAGE_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setSection(sec.id)} style={{
            padding: "8px 16px", borderRadius: 8, border: section === sec.id ? "1.5px solid #4a148c" : "1px solid transparent",
            background: section === sec.id ? "linear-gradient(135deg, #4a148c, #6a1b9a)" : "transparent",
            color: section === sec.id ? "#fff" : "#666",
            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
            boxShadow: section === sec.id ? "0 2px 8px rgba(74,20,140,0.2)" : "none",
          }}>
            <span style={{ fontSize: "0.78rem" }}>{sec.icon}</span> {sec.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: "24px 40px 60px", maxWidth: 1200, margin: "0 auto" }}>

        {/* OVERVIEW */}
        {section === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Returns Grid */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>📈 Performance Returns (CAGR)</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { label: "1M", value: fundDetail.return1m },
                    { label: "3M", value: fundDetail.return3m },
                    { label: "6M", value: fundDetail.return6m },
                    { label: "1Y", value: fundDetail.return1y },
                    { label: "3Y", value: fundDetail.return3y },
                    { label: "5Y", value: fundDetail.return5y },
                    { label: "SIP 3Y", value: fundDetail.sipReturn3y },
                    { label: "SIP 5Y", value: fundDetail.sipReturn5y },
                  ].map(r => (
                    <div key={r.label} style={{ padding: "8px 10px", borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe", textAlign: "center" }}>
                      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{r.label}</div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 800, color: r.value >= 0 ? "#00c853" : "#ef5350" }}>{r.value >= 0 ? "+" : ""}{r.value}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Allocation */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>💼 Sector Allocation</div>
                <SectorChart data={fundDetail.sectorAllocation} />
              </div>

              {/* Top Holdings */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>🏆 Top 10 Holdings</div>
                {fundDetail.topHoldings.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 9 ? "1px solid #f5f5f5" : "none" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>{h.name}</div>
                      <div style={{ fontSize: "0.55rem", color: "#888" }}>{h.sector}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Bar value={h.weight} max={15} color="#7c3aed" h={4} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a148c", minWidth: 35, textAlign: "right" }}>{h.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* AI Scores */}
              <div style={{ background: "linear-gradient(135deg, #1a0a2e, #4a148c)", borderRadius: 14, padding: 18, color: "#fff" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>AI Fund Scores</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Overall", value: +fundDetail.overallScore },
                    { label: "Fundamental", value: +fundDetail.fundamentalScore },
                    { label: "Consistency", value: +fundDetail.consistencyScore },
                    { label: "SIP Fit", value: +fundDetail.sipSuitability },
                  ].map(s => <ScoreRing key={s.label} value={s.value} label={s.label} size={60} />)}
                </div>
              </div>

              {/* Risk Metrics */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>📊 Risk Metrics</div>
                {[
                  { label: "Alpha", value: `${fundDetail.alpha > 0 ? "+" : ""}${fundDetail.alpha}`, color: fundDetail.alpha > 0 ? "#00c853" : "#ef5350" },
                  { label: "Beta", value: `${fundDetail.beta}`, color: "#7c3aed" },
                  { label: "Sharpe Ratio", value: `${fundDetail.sharpe}`, color: "#2962ff" },
                  { label: "Sortino Ratio", value: `${fundDetail.sortino}`, color: "#00897b" },
                  { label: "Std Deviation", value: `${fundDetail.stdDev}%`, color: "#e65100" },
                  { label: "Max Drawdown", value: `-${fundDetail.maxDrawdown}%`, color: "#c62828" },
                ].map(p => (
                  <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontSize: "0.62rem", color: "#888" }}>{p.label}</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: p.color }}>{p.value}</span>
                  </div>
                ))}
              </div>

              {/* Market Cap */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>📊 Market Cap Split</div>
                {fundDetail.marketCapAlloc.map(m => (
                  <div key={m.type} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", marginBottom: 2 }}>
                      <span style={{ color: "#666" }}>{m.type}</span>
                      <span style={{ fontWeight: 700 }}>{m.weight}%</span>
                    </div>
                    <Bar value={m.weight} color={m.type === "Large Cap" ? "#2962ff" : m.type === "Mid Cap" ? "#7c3aed" : "#e65100"} h={5} />
                  </div>
                ))}
              </div>

              {/* Related Funds */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>🔄 Related Funds</div>
                {MUTUAL_FUNDS.filter(f => f.category === entry.category && f.symbol !== entry.symbol).slice(0, 5).map(f => (
                  <Link key={f.symbol} href={`/mutualfunds/${f.symbol.toLowerCase()}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, textDecoration: "none", color: "inherit", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.62rem", color: "#7c3aed" }}>{f.name}</span>
                    <span style={{ fontSize: "0.52rem", color: "#888" }}>{f.amc}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI INTELLIGENCE */}
        {section === "intelligence" && <AIIntelligenceSection entry={entry} />}

        {/* FUND INFO */}
        {section === "fundinfo" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📋 {entry.name} — Complete Fund Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { title: "Fund Identity", items: [{ l: "AMC", v: fundDetail.amc }, { l: "Category", v: fundDetail.category }, { l: "Benchmark", v: fundDetail.benchmarkIndex }, { l: "Launch Date", v: fundDetail.launchDate }, { l: "Plan", v: fundDetail.planType }] },
                { title: "Fund Manager", items: [{ l: "Manager", v: fundDetail.fundManager }, { l: "Experience", v: fundDetail.fundManagerExp }, { l: "Style", v: fundDetail.investmentStyle }, { l: "Turnover", v: `${fundDetail.turnoverRatio}%` }] },
                { title: "Investment Details", items: [{ l: "Min Investment", v: fundDetail.minInvestment }, { l: "SIP Minimum", v: fundDetail.sipMin }, { l: "Exit Load", v: fundDetail.exitLoad }, { l: "Lock-in", v: fundDetail.lockIn }] },
                { title: "Cost & Risk", items: [{ l: "Expense Ratio", v: `${fundDetail.expenseRatio}%` }, { l: "AUM", v: fundDetail.aum }, { l: "Riskometer", v: fundDetail.riskometer }, { l: "NAV", v: `₹${fundDetail.nav}` }] },
              ].map(g => (
                <div key={g.title} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#4a148c", marginBottom: 10, textTransform: "uppercase" }}>{g.title}</div>
                  {g.items.map(it => (
                    <div key={it.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ fontSize: "0.65rem", color: "#666" }}>{it.l}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, maxWidth: "55%", textAlign: "right" }}>{it.v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {section === "portfolio" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>💼 Portfolio Composition</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a148c", marginBottom: 12 }}>Asset Allocation</div>
                {[
                  { label: "Equity", value: +fundDetail.equityPct, color: "#7c3aed" },
                  { label: "Debt", value: +fundDetail.debtPct, color: "#2962ff" },
                  { label: "Cash", value: +fundDetail.cashPct, color: "#ff9800" },
                  { label: "Overseas", value: +fundDetail.overseaPct, color: "#00897b" },
                ].map(a => (
                  <div key={a.label} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", marginBottom: 2 }}>
                      <span style={{ color: "#666" }}>{a.label}</span>
                      <span style={{ fontWeight: 700, color: a.color }}>{a.value}%</span>
                    </div>
                    <Bar value={a.value} color={a.color} h={5} />
                  </div>
                ))}
                <div style={{ marginTop: 10, padding: "6px 8px", borderRadius: 6, background: "#faf5ff", fontSize: "0.62rem" }}>
                  <strong style={{ color: "#7c3aed" }}>Top 10 Concentration:</strong> {fundDetail.concentrationTop10}%
                </div>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a148c", marginBottom: 12 }}>Sector Allocation</div>
                <SectorChart data={fundDetail.sectorAllocation} />
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16, marginTop: 14 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a148c", marginBottom: 12 }}>Top Holdings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {fundDetail.topHoldings.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: 6, background: "#faf5ff", border: "1px solid #ede9fe" }}>
                    <div>
                      <div style={{ fontSize: "0.68rem", fontWeight: 700 }}>{h.name}</div>
                      <div style={{ fontSize: "0.52rem", color: "#888" }}>{h.sector}</div>
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a148c" }}>{h.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RETURNS */}
        {section === "returns" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📈 Detailed Return Analysis</h2>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                <thead><tr style={{ background: "#faf5ff" }}>{["Period", "Fund Return", "Category Avg", "Alpha vs Cat"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 800, color: "#4a148c", fontSize: "0.6rem", textTransform: "uppercase", borderBottom: "2px solid #ede9fe" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { period: "1 Month", fund: fundDetail.return1m, cat: +(fundDetail.return1m - 0.5 + Math.random()).toFixed(2) },
                    { period: "3 Months", fund: fundDetail.return3m, cat: +(fundDetail.return3m - 1 + Math.random() * 2).toFixed(2) },
                    { period: "6 Months", fund: fundDetail.return6m, cat: +(fundDetail.return6m - 1.5 + Math.random() * 3).toFixed(2) },
                    { period: "1 Year", fund: fundDetail.return1y, cat: +(fundDetail.return1y - 2 + Math.random() * 4).toFixed(2) },
                    { period: "3 Year (CAGR)", fund: fundDetail.return3y, cat: +(fundDetail.return3y - 1 + Math.random() * 2).toFixed(2) },
                    { period: "5 Year (CAGR)", fund: fundDetail.return5y, cat: +(fundDetail.return5y - 1 + Math.random() * 2).toFixed(2) },
                    { period: "SIP 3 Year (XIRR)", fund: fundDetail.sipReturn3y, cat: +(fundDetail.sipReturn3y - 1 + Math.random() * 2).toFixed(2) },
                    { period: "SIP 5 Year (XIRR)", fund: fundDetail.sipReturn5y, cat: +(fundDetail.sipReturn5y - 1 + Math.random() * 2).toFixed(2) },
                  ].map((r, i) => {
                    const alpha = +(r.fund - r.cat).toFixed(2);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>{r.period}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: r.fund >= 0 ? "#00c853" : "#ef5350" }}>{r.fund >= 0 ? "+" : ""}{r.fund}%</td>
                        <td style={{ padding: "10px 14px", color: "#666" }}>{r.cat >= 0 ? "+" : ""}{r.cat}%</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: alpha >= 0 ? "#00c853" : "#ef5350" }}>{alpha >= 0 ? "+" : ""}{alpha}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {thisCat && (
              <div style={{ background: "linear-gradient(135deg, #4a148c, #7c3aed)", borderRadius: 14, padding: 18, color: "#fff" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 800, marginBottom: 8 }}>📊 {entry.category} Category Overview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
                  {[
                    { label: "Avg 1Y Return", value: `${thisCat.avgReturn1y}%` },
                    { label: "Avg 3Y CAGR", value: `${thisCat.avgReturn3y}%` },
                    { label: "Total AUM", value: thisCat.totalAum },
                    { label: "Schemes", value: thisCat.numSchemes.toString() },
                  ].map(s => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: "0.48rem", fontWeight: 600, opacity: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: "0.62rem", opacity: 0.7 }}>{thisCat.outlook}</div>
              </div>
            )}
          </div>
        )}

        {/* MACRO DRIVERS */}
        {section === "drivers" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🌍 Market & Macro Drivers</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {drivers.map((d, i) => (
                <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${d.impact === "Positive" ? "#00c853" : d.impact === "Negative" ? "#ef5350" : "#ff9800"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{d.name}</span>
                      <Badge text={d.category} variant="purple" />
                      <Badge text={d.importance} variant={d.importance === "Critical" ? "red" : d.importance === "High" ? "orange" : "neutral"} />
                    </div>
                    <Badge text={d.impact} variant={d.impact === "Positive" ? "green" : d.impact === "Negative" ? "red" : "orange"} />
                  </div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#7c3aed", marginBottom: 3 }}>{d.currentState}</div>
                  <div style={{ fontSize: "0.62rem", color: "#666" }}>{d.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RISK ANALYSIS */}
        {section === "risk" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>⚠️ Risk Analysis — {entry.name}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {risks.map((r, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${r.severity === "Critical" ? "#c62828" : r.severity === "High" ? "#e65100" : r.severity === "Medium" ? "#ff9800" : "#00c853"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>{r.name}</span>
                      <Badge text={r.severity} variant={r.severity === "Critical" ? "red" : r.severity === "High" ? "orange" : r.severity === "Medium" ? "blue" : "green"} />
                    </div>
                    <span style={{ fontWeight: 800, color: +r.probability > 25 ? "#ef5350" : "#888" }}>{r.probability}%</span>
                  </div>
                  <Bar value={+r.probability} max={60} color={r.severity === "Critical" ? "#c62828" : "#ff9800"} h={3} />
                  <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 6 }}>{r.description}</div>
                  <div style={{ fontSize: "0.62rem", color: "#7c3aed", fontWeight: 600, marginTop: 3 }}>Impact: {r.impact}</div>
                  <div style={{ fontSize: "0.58rem", color: "#00897b", marginTop: 3 }}>✅ Mitigation: {r.mitigation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUANT MODELS */}
        {section === "quant" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🧮 Quantitative Fund Analysis Models</h2>
            {MF_QUANT_MODELS.map((m, i) => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#4a148c", marginBottom: 6 }}>{m.name}</div>
                <div style={{ padding: "6px 10px", borderRadius: 6, background: "#1a0a2e", color: "#b388ff", fontFamily: "monospace", fontSize: "0.68rem", marginBottom: 8 }}>{m.formula}</div>
                <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: 6 }}>{m.interpretation}</div>
                <div style={{ fontSize: "0.6rem", color: "#7c3aed", fontWeight: 600, marginBottom: 6 }}>Institutional Use: {m.institutionalUse}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#2e7d32", marginBottom: 3, textTransform: "uppercase" }}>Strengths</div>
                    {m.strengths.map((s, j) => <div key={j} style={{ fontSize: "0.58rem", color: "#555", display: "flex", gap: 4 }}><span style={{ color: "#00c853" }}>✓</span> {s}</div>)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#c62828", marginBottom: 3, textTransform: "uppercase" }}>Weaknesses</div>
                    {m.weaknesses.map((w, j) => <div key={j} style={{ fontSize: "0.58rem", color: "#555", display: "flex", gap: 4 }}><span style={{ color: "#ef5350" }}>✗</span> {w}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GLOSSARY */}
        {section === "glossary" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📖 Mutual Fund Glossary</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {MF_GLOSSARY_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setGlossaryCat(cat)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "1px solid",
                  borderColor: glossaryCat === cat ? "#7c3aed" : "#e0e0e0",
                  background: glossaryCat === cat ? "#7c3aed" : "#fff",
                  color: glossaryCat === cat ? "#fff" : "#666",
                  fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
                }}>{cat}</button>
              ))}
            </div>
            {filteredGlossary.map((t, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontWeight: 900, fontSize: "0.78rem", color: "#4a148c" }}>{t.abbr}</span>
                  <span style={{ fontSize: "0.68rem", color: "#555" }}>— {t.term}</span>
                  <Badge text={t.category} variant="purple" />
                </div>
                <div style={{ fontSize: "0.62rem", color: "#333", marginBottom: 4 }}>{t.definition}</div>
                <div style={{ fontSize: "0.55rem", color: "#7c3aed", marginBottom: 2 }}><strong>Significance:</strong> {t.significance}</div>
                <div style={{ fontSize: "0.52rem", color: "#e65100" }}><strong>Investor Impact:</strong> {t.investorImpact}</div>
              </div>
            ))}
          </div>
        )}

        {/* AI FEATURES */}
        {section === "ai" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🔮 AI Fund Intelligence Capabilities</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {MF_AI_FEATURES.map((f, i) => (
                <div key={i} style={{ padding: "18px 20px", borderRadius: 14, background: "linear-gradient(135deg, #1a0a2e, #4a148c)", border: "1px solid rgba(179,136,255,0.15)", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "1.4rem" }}>{f.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>{f.name}</span>
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>{f.description}</div>
                  <div style={{ fontSize: "0.58rem", color: "#b388ff", fontWeight: 600 }}>{f.capability}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DATA SOURCES */}
        {section === "data" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🗄️ Mutual Fund Data Sources</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {MF_DATA_SOURCES.map((d, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "#4a148c" }}>{d.name}</span>
                    <Badge text={d.category} variant={d.category === "Free" ? "green" : d.category === "Institutional" ? "purple" : "orange"} />
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "#555", marginBottom: 4 }}>{d.coverage}</div>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, color: d.cost === "Free" ? "#00c853" : "#e65100" }}>{d.cost}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
        }
      `}</style>
    </div>
  );
}
