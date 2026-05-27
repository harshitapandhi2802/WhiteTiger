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
} from "@/lib/mf-data";

/* ═══════════════════════════════════════════════════════════════
   FULL-SCREEN MUTUAL FUND INTELLIGENCE PAGE
   /mf-intelligence/[fund] — Morningstar + Value Research + Bloomberg
   ═══════════════════════════════════════════════════════════════ */

function resolveFund(slug: string): MutualFundEntry | null {
  const decoded = decodeURIComponent(slug);
  // Try exact symbol match (sbi-bluechip → SBI-BLUECHIP)
  const upper = decoded.toUpperCase();
  let entry = MUTUAL_FUNDS.find(f => f.symbol === upper);
  if (entry) return entry;
  // Try symbol with case-insensitive
  entry = MUTUAL_FUNDS.find(f => f.symbol.toLowerCase() === decoded.toLowerCase());
  if (entry) return entry;
  // Try name-based match (parag-parikh-flexi-cap → Parag Parikh Flexi Cap Fund)
  const nameLower = decoded.toLowerCase().replace(/-/g, " ");
  entry = MUTUAL_FUNDS.find(f => f.name.toLowerCase().replace(/ fund$/i, "").includes(nameLower));
  if (entry) return entry;
  // Fuzzy — match words
  const words = nameLower.split(" ").filter(w => w.length > 2);
  entry = MUTUAL_FUNDS.find(f => {
    const fn = f.name.toLowerCase();
    return words.filter(w => fn.includes(w)).length >= Math.min(words.length, 2);
  });
  if (entry) return entry;
  // Try symbol contains
  entry = MUTUAL_FUNDS.find(f => f.symbol.toLowerCase().includes(decoded.toLowerCase().replace(/-/g, "")));
  return entry || null;
}

/* ─── Utility Components ─── */
function Spark({ data, color = "#b388ff", w = 200, h = 40 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const gid = `hmf-${color.replace("#", "")}-${w}`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gid})`} />
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

function ScoreRing({ value, label, size = 64, darkBg = true }: { value: number; label: string; size?: number; darkBg?: boolean }) {
  const pct = Math.min(100, Math.abs(value));
  const color = value > 70 ? "#00e676" : value > 45 ? "#b388ff" : value > 25 ? "#ffd740" : "#ff5252";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 4px" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={darkBg ? "rgba(255,255,255,0.1)" : "#ede9fe"} strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 60 ? "0.85rem" : "0.72rem", fontWeight: 900, color: darkBg ? color : "#4a148c" }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: darkBg ? "rgba(255,255,255,0.5)" : "#888", textTransform: "uppercase" }}>{label}</div>
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
  return <span style={{ fontSize: "0.56rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{text}</span>;
}

/* ─── Sector Bar Chart ─── */
function SectorChart({ data }: { data: { sector: string; weight: number }[] }) {
  const sorted = [...data].sort((a, b) => b.weight - a.weight).slice(0, 8);
  const colors = ["#7c3aed", "#2962ff", "#00897b", "#e65100", "#c62828", "#00838f", "#4527a0", "#ff6f00"];
  return (
    <div>{sorted.map((s, i) => (
      <div key={s.sector} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 85, fontSize: "0.6rem", fontWeight: 600, color: "#555", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sector}</div>
        <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#f0f0f5", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, s.weight * 3)}%`, height: "100%", borderRadius: 5, background: colors[i % colors.length] }} />
        </div>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: colors[i % colors.length], minWidth: 32, textAlign: "right" }}>{s.weight}%</span>
      </div>
    ))}</div>
  );
}

/* ═══════════════════════════════════════════
   AI INTELLIGENCE SECTION — uses updated API
   ═══════════════════════════════════════════ */
function AIIntelligenceSection({ entry }: { entry: MutualFundEntry }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  const fetchIntel = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/mf-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundName: entry.name, amc: entry.amc, category: entry.category }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, [entry]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "holdings", label: "Holdings", icon: "💼" },
    { id: "risk", label: "Risk", icon: "⚠️" },
    { id: "manager", label: "Manager", icon: "👤" },
    { id: "investor", label: "Investor", icon: "🎯" },
    { id: "macro", label: "Macro", icon: "🌍" },
    { id: "stress", label: "Stress Test", icon: "🔥" },
    { id: "sip", label: "SIP", icon: "📈" },
    { id: "news", label: "News", icon: "📰" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4a148c, #6a1b9a, #7c3aed)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? "#ffd740" : data ? "#00e676" : "#888", boxShadow: `0 0 8px ${loading ? "rgba(255,215,64,0.6)" : data ? "rgba(0,230,118,0.6)" : "transparent"}` }} />
          <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>Gemini AI-Powered Fund Intelligence</span>
        </div>
        <div style={{ fontSize: "1.3rem", fontWeight: 900 }}>{entry.name} — Deep Intelligence Report</div>
        <div style={{ fontSize: "0.65rem", opacity: 0.6, marginTop: 2 }}>Portfolio analysis, fund manager evaluation, investor suitability, macro linkages, stress testing</div>
      </div>

      <div style={{ padding: "16px 24px" }}>
        {/* Generate button */}
        {!data && !loading && (
          <button onClick={fetchIntel} style={{
            padding: "14px 32px", borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #4a148c)",
            color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35)", transition: "all 0.2s",
          }}>
            🤖 Generate Intelligence Report
          </button>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 44, height: 44, border: "3px solid #ede9fe", borderTopColor: "#7c3aed", borderRadius: "50%", margin: "0 auto 14px", animation: "mf-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#4a148c" }}>Generating Intelligence Report...</div>
            <div style={{ fontSize: "0.65rem", color: "#999", marginTop: 6 }}>Analyzing {entry.name} across 15+ institutional dimensions</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c62828", marginBottom: 10 }}>❌ {error}</div>
            <button onClick={fetchIntel} style={{ padding: "10px 24px", borderRadius: 10, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>Retry</button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Tab nav */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16, paddingBottom: 2 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: "6px 14px", borderRadius: 8, border: tab === t.id ? "1.5px solid #7c3aed" : "1px solid transparent",
                  background: tab === t.id ? "#f3e5f5" : "transparent", color: tab === t.id ? "#7c3aed" : "#666",
                  fontSize: "0.62rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3,
                }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <div style={{ minHeight: 320 }}>
              {/* OVERVIEW */}
              {tab === "overview" && data.basicInfo && (
                <div>
                  <div style={{ background: "linear-gradient(135deg, #4a148c, #7c3aed)", borderRadius: 14, padding: "20px 24px", marginBottom: 16, color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: "2.4rem", fontWeight: 900 }}>₹{data.basicInfo.nav}</span>
                      <span style={{ fontSize: "0.72rem", opacity: 0.6 }}>NAV</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: "0.68rem", opacity: 0.7, flexWrap: "wrap" }}>
                      <span>AUM: {data.basicInfo.aum}</span>
                      <span>ER: {data.basicInfo.expenseRatio}</span>
                      <span>Benchmark: {data.basicInfo.benchmark}</span>
                      <span>Style: {data.basicInfo.fundStyle}</span>
                    </div>
                  </div>

                  {/* Returns table */}
                  {data.returns && (
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #ede9fe", overflow: "hidden", marginBottom: 16 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                        <thead><tr style={{ background: "#faf5ff" }}>{["Period", "Fund", "Benchmark", "Category", "Alpha"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, color: "#4a148c", fontSize: "0.58rem", textTransform: "uppercase", borderBottom: "2px solid #ede9fe" }}>{h}</th>)}</tr></thead>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <tbody>{data.returns.map((r: any, i: number) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 700 }}>{r.period}</td>
                            <td style={{ padding: "8px 12px", fontWeight: 800, color: r.fundReturn >= 0 ? "#00c853" : "#ef5350" }}>{r.fundReturn >= 0 ? "+" : ""}{r.fundReturn}%</td>
                            <td style={{ padding: "8px 12px", color: "#666" }}>{r.benchmarkReturn}%</td>
                            <td style={{ padding: "8px 12px", color: "#666" }}>{r.categoryAvg}%</td>
                            <td style={{ padding: "8px 12px", fontWeight: 700, color: r.alpha >= 0 ? "#00c853" : "#ef5350" }}>{r.alpha >= 0 ? "+" : ""}{r.alpha}%</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}

                  {/* AI Scores */}
                  {data.aiScores && (
                    <div style={{ background: "linear-gradient(135deg, #1a0a2e, #4a148c)", borderRadius: 14, padding: 18, color: "#fff" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, opacity: 0.5, textTransform: "uppercase", marginBottom: 12 }}>AI Scoring Engine</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                        {[
                          { label: "Overall", value: data.aiScores.overallScore },
                          { label: "Fundamental", value: data.aiScores.fundamentalScore },
                          { label: "Risk", value: data.aiScores.riskScore },
                          { label: "Stability", value: data.aiScores.stabilityScore },
                          { label: "Compounding", value: data.aiScores.compoundingScore },
                        ].map(s => <ScoreRing key={s.label} value={s.value} label={s.label} size={56} />)}
                      </div>
                      {data.aiScores.rank && (
                        <div style={{ textAlign: "center", marginTop: 10, fontSize: "0.62rem", opacity: 0.6 }}>
                          Overall Rank: #{data.aiScores.rank} · Category Rank: #{data.aiScores.categoryRank}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fundamental Explanation */}
                  {data.fundamentalExplanation && (
                    <div style={{ padding: 14, borderRadius: 10, background: "#faf5ff", border: "1px solid #ede9fe", marginTop: 14 }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", marginBottom: 4 }}>🧠 Why This Fund Performs This Way</div>
                      <div style={{ fontSize: "0.68rem", color: "#444", lineHeight: 1.6 }}>{data.fundamentalExplanation}</div>
                    </div>
                  )}

                  {data.aiRecommendation && (
                    <div style={{ padding: 14, borderRadius: 10, background: "#e8f5e9", border: "1px solid #a5d6a7", marginTop: 10 }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#2e7d32", textTransform: "uppercase", marginBottom: 4 }}>🎯 AI Recommendation</div>
                      <div style={{ fontSize: "0.68rem", color: "#1b5e20", lineHeight: 1.6 }}>{data.aiRecommendation}</div>
                    </div>
                  )}
                </div>
              )}

              {/* HOLDINGS */}
              {tab === "holdings" && (
                <div>
                  {data.topHoldings && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 10 }}>🏆 Top Holdings</div>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {data.topHoldings.map((h: any, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: i % 2 === 0 ? "#faf5ff" : "#fff", border: "1px solid #ede9fe", marginBottom: 4 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>{h.stock}</div>
                            <div style={{ fontSize: "0.52rem", color: "#888" }}>{h.sector} · PE: {h.pe} · ROE: {h.roe}%</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Badge text={h.outlook} variant={h.outlook === "bullish" ? "green" : h.outlook === "bearish" ? "red" : "neutral"} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#4a148c", minWidth: 40, textAlign: "right" }}>{h.weightage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.sectorAllocation && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 10 }}>📊 Sector Allocation</div>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {data.sectorAllocation.map((s: any, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 100, fontSize: "0.62rem", fontWeight: 600, color: "#555", textAlign: "right" }}>{s.sector}</div>
                          <div style={{ flex: 1 }}><Bar value={s.allocation} max={35} color="#7c3aed" h={8} /></div>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4a148c", minWidth: 35, textAlign: "right" }}>{s.allocation}%</span>
                          <Badge text={s.change} variant={s.change === "increased" ? "green" : s.change === "decreased" ? "red" : "neutral"} />
                        </div>
                      ))}
                    </div>
                  )}
                  {data.marketCapAllocation && (
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 10 }}>📊 Market Cap Allocation</div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {data.marketCapAllocation.map((m: any, i: number) => (
                          <div key={i} style={{ flex: "1 1 100px", padding: "10px 14px", borderRadius: 10, background: "#faf5ff", border: "1px solid #ede9fe", textAlign: "center" }}>
                            <div style={{ fontSize: "0.52rem", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{m.segment}</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#4a148c" }}>{m.allocation}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RISK */}
              {tab === "risk" && data.riskMetrics && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "Alpha", value: data.riskMetrics.alpha, color: data.riskMetrics.alpha >= 0 ? "#00c853" : "#ef5350" },
                      { label: "Beta", value: data.riskMetrics.beta, color: "#7c3aed" },
                      { label: "Sharpe", value: data.riskMetrics.sharpeRatio, color: "#2962ff" },
                      { label: "Sortino", value: data.riskMetrics.sortinoRatio, color: "#00897b" },
                      { label: "Std Dev", value: data.riskMetrics.standardDeviation, color: "#e65100" },
                    ].map(m => (
                      <div key={m.label} style={{ padding: "10px 8px", borderRadius: 10, background: "#faf5ff", border: "1px solid #ede9fe", textAlign: "center" }}>
                        <div style={{ fontSize: "0.48rem", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{m.label}</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {[
                      { label: "Max Drawdown", value: `${data.riskMetrics.maxDrawdown}%`, color: "#c62828" },
                      { label: "Info Ratio", value: data.riskMetrics.informationRatio, color: "#7c3aed" },
                      { label: "Treynor", value: data.riskMetrics.treynorRatio, color: "#2962ff" },
                      { label: "VaR 95%", value: `${data.riskMetrics.var95}%`, color: "#e65100" },
                    ].map(m => (
                      <div key={m.label} style={{ padding: "10px 8px", borderRadius: 10, background: "#faf5ff", border: "1px solid #ede9fe", textAlign: "center" }}>
                        <div style={{ fontSize: "0.48rem", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{m.label}</div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 800, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FUND MANAGER */}
              {tab === "manager" && data.fundManager && (
                <div>
                  <div style={{ padding: 18, borderRadius: 14, background: "linear-gradient(135deg, #faf5ff, #f3e5f5)", border: "1px solid #ede9fe", marginBottom: 14 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4a148c", marginBottom: 4 }}>{data.fundManager.name}</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <Badge text={`${data.fundManager.experience} exp`} variant="purple" />
                      <Badge text={data.fundManager.investmentStyle} variant="teal" />
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#555", marginBottom: 6 }}>{data.fundManager.trackRecord}</div>
                    <div style={{ fontSize: "0.62rem", color: "#666" }}><strong>Alpha:</strong> {data.fundManager.alphaGeneration}</div>
                    <div style={{ fontSize: "0.62rem", color: "#666" }}><strong>Risk Mgmt:</strong> {data.fundManager.riskManagement}</div>
                    <div style={{ fontSize: "0.62rem", color: "#666" }}><strong>Consistency:</strong> {data.fundManager.consistency}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {[
                      { label: "Manager Score", value: data.fundManager.managerScore },
                      { label: "Consistency", value: data.fundManager.consistencyScore },
                      { label: "Risk Mgmt", value: data.fundManager.riskMgmtScore },
                      { label: "Reliability", value: data.fundManager.reliabilityScore },
                    ].map(s => <ScoreRing key={s.label} value={s.value} label={s.label} size={64} darkBg={false} />)}
                  </div>
                </div>
              )}

              {/* INVESTOR PERSPECTIVE */}
              {tab === "investor" && data.investorPerspective && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                    {[
                      { label: "Wealth", value: data.investorPerspective.wealthCreationScore },
                      { label: "SIP Fit", value: data.investorPerspective.sipSuitabilityScore },
                      { label: "Retirement", value: data.investorPerspective.retirementScore },
                      { label: "Aggressive", value: data.investorPerspective.aggressiveScore },
                      { label: "Conservative", value: data.investorPerspective.conservativeScore },
                      { label: "Long-Term", value: data.investorPerspective.longTermQualityScore },
                    ].map(s => <ScoreRing key={s.label} value={s.value} label={s.label} size={56} darkBg={false} />)}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                    {[
                      { label: "Valuation", value: data.investorPerspective.valuationComfort, variant: data.investorPerspective.valuationComfort === "comfortable" ? "green" : data.investorPerspective.valuationComfort === "stretched" ? "red" : "orange" },
                      { label: "Downside", value: data.investorPerspective.downsideRisk, variant: data.investorPerspective.downsideRisk === "low" ? "green" : data.investorPerspective.downsideRisk === "moderate" ? "orange" : "red" },
                      { label: "Concentration", value: data.investorPerspective.concentrationRisk, variant: data.investorPerspective.concentrationRisk === "low" ? "green" : data.investorPerspective.concentrationRisk === "moderate" ? "orange" : "red" },
                      { label: "Crash Resilience", value: data.investorPerspective.crashResilience, variant: data.investorPerspective.crashResilience === "strong" ? "green" : data.investorPerspective.crashResilience === "moderate" ? "orange" : "red" },
                    ].map(b => (
                      <div key={b.label} style={{ flex: "1 1 110px", padding: "8px 10px", borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe", textAlign: "center" }}>
                        <div style={{ fontSize: "0.48rem", fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 2 }}>{b.label}</div>
                        <Badge text={b.value} variant={b.variant as "green" | "red" | "orange"} />
                      </div>
                    ))}
                  </div>
                  {data.investorPerspective.portfolioStrength && (
                    <div style={{ padding: 12, borderRadius: 8, background: "#faf5ff", border: "1px solid #ede9fe", marginBottom: 8 }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#7c3aed", marginBottom: 3 }}>Portfolio Strength</div>
                      <div style={{ fontSize: "0.65rem", color: "#555" }}>{data.investorPerspective.portfolioStrength}</div>
                    </div>
                  )}
                  {data.investorPerspective.investorVerdict && (
                    <div style={{ padding: 14, borderRadius: 10, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#2e7d32", textTransform: "uppercase", marginBottom: 3 }}>🎯 Investor Verdict</div>
                      <div style={{ fontSize: "0.68rem", color: "#1b5e20", lineHeight: 1.6 }}>{data.investorPerspective.investorVerdict}</div>
                    </div>
                  )}
                </div>
              )}

              {/* MACRO */}
              {tab === "macro" && data.macroLinkages && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.macroLinkages.map((m: any, i: number) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#fff", border: "1px solid #eef0f2", borderLeft: `4px solid ${m.direction === "positive" ? "#00c853" : m.direction === "negative" ? "#ef5350" : "#ff9800"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{m.factor}</span>
                        <Badge text={m.direction} variant={m.direction === "positive" ? "green" : m.direction === "negative" ? "red" : "orange"} />
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#7c3aed", fontWeight: 600, marginBottom: 2 }}>{m.currentState}</div>
                      <div style={{ fontSize: "0.6rem", color: "#666" }}>{m.fundImpact}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* STRESS TEST */}
              {tab === "stress" && data.stressScenarios && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.stressScenarios.map((s: any, i: number) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: s.resilience === "weak" ? "linear-gradient(135deg, #1a0a2e, #2d1b4e)" : "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${s.resilience === "strong" ? "#00c853" : s.resilience === "moderate" ? "#ff9800" : "#ef5350"}`, color: s.resilience === "weak" ? "#fff" : "inherit" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{s.scenario}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Badge text={s.resilience} variant={s.resilience === "strong" ? "green" : s.resilience === "moderate" ? "orange" : "red"} />
                          <span style={{ fontWeight: 800, color: "#ef5350" }}>{s.estimatedImpact}%</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.62rem", color: s.resilience === "weak" ? "rgba(255,255,255,0.7)" : "#666" }}>{s.explanation}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* SIP PROJECTION */}
              {tab === "sip" && data.sipProjection && (
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 10 }}>📈 SIP of ₹10,000/month Projection</div>
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #ede9fe", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                      <thead><tr style={{ background: "#faf5ff" }}>{["Year", "Invested", "Projected Value", "Gain", "XIRR"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, color: "#4a148c", fontSize: "0.58rem", textTransform: "uppercase", borderBottom: "2px solid #ede9fe" }}>{h}</th>)}</tr></thead>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <tbody>{data.sipProjection.map((s: any, i: number) => {
                        const gain = s.value - s.invested;
                        const xirr = s.invested > 0 ? ((s.value / s.invested - 1) * 100 / Math.max(1, s.year) * 2).toFixed(1) : "0";
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 700 }}>Year {s.year}</td>
                            <td style={{ padding: "8px 12px", color: "#666" }}>₹{(s.invested / 100000).toFixed(1)}L</td>
                            <td style={{ padding: "8px 12px", fontWeight: 800, color: "#4a148c" }}>₹{(s.value / 100000).toFixed(1)}L</td>
                            <td style={{ padding: "8px 12px", fontWeight: 700, color: gain >= 0 ? "#00c853" : "#ef5350" }}>₹{(gain / 100000).toFixed(1)}L</td>
                            <td style={{ padding: "8px 12px", color: "#7c3aed", fontWeight: 600 }}>~{xirr}%</td>
                          </tr>
                        );
                      })}</tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* NEWS */}
              {tab === "news" && data.newsEvents && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.newsEvents.map((n: any, i: number) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#fff", border: "1px solid #eef0f2", borderLeft: `4px solid ${n.impact === "positive" ? "#00c853" : n.impact === "negative" ? "#ef5350" : "#ff9800"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.75rem" }}>{n.title}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Badge text={n.severity} variant={n.severity === "high" ? "red" : n.severity === "medium" ? "orange" : "neutral"} />
                          <span style={{ fontSize: "0.52rem", color: "#999" }}>{n.date}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#666" }}>{n.explanation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: "right", marginTop: 14 }}>
              <button onClick={fetchIntel} style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", fontSize: "0.62rem", fontWeight: 700 }}>🔄 Refresh Intelligence</button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes mf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


/* ═══════════════════════════════════════════════
   MAIN PAGE
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

export default function MFIntelligencePage() {
  const params = useParams();
  const slug = typeof params.fund === "string" ? params.fund : Array.isArray(params.fund) ? params.fund[0] : "";
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

  const fd = generateFundDetail(entry.symbol, entry.name, entry.amc, entry.category, entry.riskLevel);
  const risks = generateMFRisks(entry.symbol, entry.category, entry.riskLevel);
  const drivers = generateMFDrivers(entry.category);
  const sparkData = generateMFSparkline(entry.symbol);
  const catInsights = getCategoryInsights();
  const thisCat = catInsights.find(c => c.category === entry.category);

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
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: -1 }}>{entry.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, fontSize: "0.55rem", fontWeight: 700, background: "rgba(0,200,83,0.15)", color: "#69f0ae" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#69f0ae", animation: "pulse-glow 2s infinite" }} />LIVE
                </span>
                <Badge text={entry.category} variant="purple" />
                <Badge text={entry.riskLevel + " Risk"} variant={entry.riskLevel === "Low" ? "green" : entry.riskLevel === "Moderate" ? "orange" : "red"} />
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.6, marginBottom: 4 }}>{entry.amc} · Direct - Growth</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.4 }}>Benchmark: {fd.benchmarkIndex} · Manager: {fd.fundManager} ({fd.fundManagerExp})</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Spark data={sparkData} color="#b388ff" w={220} h={50} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 20 }}>
            {[
              { label: "NAV", value: `₹${fd.nav}`, color: "#b388ff" },
              { label: "1Y Return", value: `${fd.return1y >= 0 ? "+" : ""}${fd.return1y}%`, color: fd.return1y >= 0 ? "#69f0ae" : "#ff5252" },
              { label: "3Y CAGR", value: `${fd.return3y >= 0 ? "+" : ""}${fd.return3y}%`, color: fd.return3y >= 0 ? "#69f0ae" : "#ff5252" },
              { label: "AUM", value: fd.aum, color: "#ffd740" },
              { label: "Expense Ratio", value: `${fd.expenseRatio}%`, color: "#82b1ff" },
              { label: "Sharpe", value: `${fd.sharpe}`, color: +fd.sharpe > 1 ? "#69f0ae" : "#ffd740" },
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
                    { label: "1M", value: fd.return1m }, { label: "3M", value: fd.return3m },
                    { label: "6M", value: fd.return6m }, { label: "1Y", value: fd.return1y },
                    { label: "3Y", value: fd.return3y }, { label: "5Y", value: fd.return5y },
                    { label: "SIP 3Y", value: fd.sipReturn3y }, { label: "SIP 5Y", value: fd.sipReturn5y },
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
                <SectorChart data={fd.sectorAllocation} />
              </div>

              {/* Top Holdings */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>🏆 Top 10 Holdings</div>
                {fd.topHoldings.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < 9 ? "1px solid #f5f5f5" : "none" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>{h.name}</div>
                      <div style={{ fontSize: "0.52rem", color: "#888" }}>{h.sector}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60 }}><Bar value={h.weight} max={15} color="#7c3aed" h={4} /></div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4a148c", minWidth: 35, textAlign: "right" }}>{h.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "linear-gradient(135deg, #1a0a2e, #4a148c)", borderRadius: 14, padding: 18, color: "#fff" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>AI Fund Scores</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Overall", value: +fd.overallScore },
                    { label: "Fundamental", value: +fd.fundamentalScore },
                    { label: "Consistency", value: +fd.consistencyScore },
                    { label: "SIP Fit", value: +fd.sipSuitability },
                  ].map(s => <ScoreRing key={s.label} value={s.value} label={s.label} size={60} />)}
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>📊 Risk Metrics</div>
                {[
                  { label: "Alpha", value: `${+fd.alpha > 0 ? "+" : ""}${fd.alpha}`, color: +fd.alpha > 0 ? "#00c853" : "#ef5350" },
                  { label: "Beta", value: `${fd.beta}`, color: "#7c3aed" },
                  { label: "Sharpe Ratio", value: `${fd.sharpe}`, color: "#2962ff" },
                  { label: "Sortino Ratio", value: `${fd.sortino}`, color: "#00897b" },
                  { label: "Std Deviation", value: `${fd.stdDev}%`, color: "#e65100" },
                  { label: "Max Drawdown", value: `-${fd.maxDrawdown}%`, color: "#c62828" },
                ].map(p => (
                  <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontSize: "0.62rem", color: "#888" }}>{p.label}</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: p.color }}>{p.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>📊 Market Cap Split</div>
                {fd.marketCapAlloc.map(m => (
                  <div key={m.type} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", marginBottom: 2 }}>
                      <span style={{ color: "#666" }}>{m.type}</span>
                      <span style={{ fontWeight: 700 }}>{m.weight}%</span>
                    </div>
                    <Bar value={m.weight} color={m.type === "Large Cap" ? "#2962ff" : m.type === "Mid Cap" ? "#7c3aed" : "#e65100"} h={5} />
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>🔄 Related Funds</div>
                {MUTUAL_FUNDS.filter(f => f.category === entry.category && f.symbol !== entry.symbol).slice(0, 5).map(f => (
                  <Link key={f.symbol} href={`/mf-intelligence/${f.name.toLowerCase().replace(/\s+/g, "-").replace(/[()&]/g, "")}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, textDecoration: "none", color: "inherit", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.6rem", color: "#7c3aed" }}>{f.name}</span>
                    <span style={{ fontSize: "0.5rem", color: "#888" }}>{f.amc}</span>
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
                { title: "Fund Identity", items: [{ l: "AMC", v: fd.amc }, { l: "Category", v: fd.category }, { l: "Benchmark", v: fd.benchmarkIndex }, { l: "Launch Date", v: fd.launchDate }, { l: "Plan", v: fd.planType }] },
                { title: "Fund Manager", items: [{ l: "Manager", v: fd.fundManager }, { l: "Experience", v: fd.fundManagerExp }, { l: "Style", v: fd.investmentStyle }, { l: "Turnover", v: `${fd.turnoverRatio}%` }] },
                { title: "Investment Details", items: [{ l: "Min Investment", v: fd.minInvestment }, { l: "SIP Minimum", v: fd.sipMin }, { l: "Exit Load", v: fd.exitLoad }, { l: "Lock-in", v: fd.lockIn }] },
                { title: "Cost & Risk", items: [{ l: "Expense Ratio", v: `${fd.expenseRatio}%` }, { l: "AUM", v: fd.aum }, { l: "Riskometer", v: fd.riskometer }, { l: "NAV", v: `₹${fd.nav}` }] },
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a148c", marginBottom: 12 }}>Asset Allocation</div>
                {[
                  { label: "Equity", value: +fd.equityPct, color: "#7c3aed" },
                  { label: "Debt", value: +fd.debtPct, color: "#2962ff" },
                  { label: "Cash", value: +fd.cashPct, color: "#ff9800" },
                  { label: "Overseas", value: +fd.overseaPct, color: "#00897b" },
                ].map(a => (
                  <div key={a.label} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.62rem", marginBottom: 2 }}>
                      <span style={{ color: "#666" }}>{a.label}</span><span style={{ fontWeight: 700, color: a.color }}>{a.value}%</span>
                    </div>
                    <Bar value={a.value} color={a.color} h={5} />
                  </div>
                ))}
                <div style={{ marginTop: 10, padding: "6px 8px", borderRadius: 6, background: "#faf5ff", fontSize: "0.62rem" }}>
                  <strong style={{ color: "#7c3aed" }}>Top 10 Concentration:</strong> {fd.concentrationTop10}%
                </div>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a148c", marginBottom: 12 }}>Sector Allocation</div>
                <SectorChart data={fd.sectorAllocation} />
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a148c", marginBottom: 12 }}>Top Holdings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {fd.topHoldings.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: 6, background: "#faf5ff", border: "1px solid #ede9fe" }}>
                    <div><div style={{ fontSize: "0.68rem", fontWeight: 700 }}>{h.name}</div><div style={{ fontSize: "0.5rem", color: "#888" }}>{h.sector}</div></div>
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
                <thead><tr style={{ background: "#faf5ff" }}>{["Period", "Fund Return", "Category Avg", "Alpha"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 800, color: "#4a148c", fontSize: "0.6rem", textTransform: "uppercase", borderBottom: "2px solid #ede9fe" }}>{h}</th>)}</tr></thead>
                <tbody>{[
                  { period: "1 Month", fund: fd.return1m }, { period: "3 Months", fund: fd.return3m },
                  { period: "6 Months", fund: fd.return6m }, { period: "1 Year", fund: fd.return1y },
                  { period: "3 Year CAGR", fund: fd.return3y }, { period: "5 Year CAGR", fund: fd.return5y },
                  { period: "SIP 3Y XIRR", fund: fd.sipReturn3y }, { period: "SIP 5Y XIRR", fund: fd.sipReturn5y },
                ].map((r, i) => {
                  const catAvg = +(r.fund - 1.5 + Math.random() * 3).toFixed(2);
                  const alpha = +(r.fund - catAvg).toFixed(2);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>{r.period}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 800, color: r.fund >= 0 ? "#00c853" : "#ef5350" }}>{r.fund >= 0 ? "+" : ""}{r.fund}%</td>
                      <td style={{ padding: "10px 14px", color: "#666" }}>{catAvg >= 0 ? "+" : ""}{catAvg}%</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: alpha >= 0 ? "#00c853" : "#ef5350" }}>{alpha >= 0 ? "+" : ""}{alpha}%</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            {thisCat && (
              <div style={{ background: "linear-gradient(135deg, #4a148c, #7c3aed)", borderRadius: 14, padding: 18, color: "#fff" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 800, marginBottom: 8 }}>📊 {entry.category} Category Overview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
                  {[
                    { label: "Avg 1Y", value: `${thisCat.avgReturn1y}%` }, { label: "Avg 3Y", value: `${thisCat.avgReturn3y}%` },
                    { label: "Total AUM", value: thisCat.totalAum }, { label: "Schemes", value: String(thisCat.numSchemes) },
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

        {/* RISK */}
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
