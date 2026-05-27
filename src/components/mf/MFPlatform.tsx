"use client";
import React, { useState, useMemo } from "react";
import {
  generateCuratedLists, generateMFCopilot, simulateSIP, planGoal,
  getSuitability, getBeginnerExplanations, getMarketImpacts,
  MF_NAV_SECTIONS, type MFSection, type InvestorProfile, type CuratedList,
} from "@/lib/mf-engine";
import {
  generateFundDetail, generateMFSparkline, getCategoryInsights,
  MF_GLOSSARY, MF_GLOSSARY_CATEGORIES,
} from "@/lib/mf-data";
import { MUTUAL_FUNDS } from "@/lib/mutualfunds";
import { useMFNavs } from "@/hooks/useMarketData";
import { DataSourceBadge } from "@/components/DataHealth";

/* ═══════════════════════════════════════════════════════════════
   MOONLIGHT MF INTELLIGENCE PLATFORM v2.0
   AI Copilot · SIP Simulator · Goal Planner · Suitability
   Curated Discovery · Market Insights · Learn
   ═══════════════════════════════════════════════════════════════ */

/* ─── Utility: Sparkline ─── */
function Spark({ data, color = "#7c3aed", w = 100, h = 28 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs><linearGradient id={`mfsp-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.15} /><stop offset="100%" stopColor={color} stopOpacity={0.01} /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#mfsp-${color.replace("#","")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Score Ring ─── */
function Ring({ value, label, size = 72, max = 100 }: { value: number; label: string; size?: number; max?: number }) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100);
  const c = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 4px" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={c} strokeWidth="2.5" strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, color: c }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

/* ─── Badge ─── */
function Badge({ text, variant = "neutral" }: { text: string; variant?: "green" | "red" | "orange" | "blue" | "purple" | "neutral" }) {
  const cols: Record<string, { bg: string; color: string }> = {
    green: { bg: "#dcfce7", color: "#166534" }, red: { bg: "#fee2e2", color: "#991b1b" },
    orange: { bg: "#ffedd5", color: "#9a3412" }, blue: { bg: "#dbeafe", color: "#1e40af" },
    purple: { bg: "#ede9fe", color: "#5b21b6" }, neutral: { bg: "#f1f5f9", color: "#475569" },
  };
  const c = cols[variant] || cols.neutral;
  return <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{text}</span>;
}

function fINR(n: number) { return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${n.toLocaleString("en-IN")}`; }

/* ═══════════════════════════════════════════════════════════════
   MAIN PLATFORM COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function MFPlatform() {
  const [activeSection, setActiveSection] = useState<MFSection>("discover");

  // SIP Simulator state
  const [sipAmount, setSipAmount] = useState(10000);
  const [sipYears, setSipYears] = useState(15);
  const [sipReturn, setSipReturn] = useState(12);

  // Goal planner state
  const [goalName, setGoalName] = useState("Retirement");
  const [goalTarget, setGoalTarget] = useState(20000000);
  const [goalYears, setGoalYears] = useState(20);

  // Suitability state
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile>("beginner");

  // Compare state
  const [compareFundA, setCompareFundA] = useState("PPFAS-FLEXI");
  const [compareFundB, setCompareFundB] = useState("MIRAE-LC");

  // Learn state
  const [glossaryCat, setGlossaryCat] = useState("All");

  // Live MF NAV data
  const { data: liveNavs, source: mfSource, isStale: mfStale, lastUpdated: mfUpdated } = useMFNavs();

  // Data
  const curatedLists = useMemo(() => generateCuratedLists(), []);
  const copilot = useMemo(() => generateMFCopilot(), []);
  const sipProjections = useMemo(() => simulateSIP(sipAmount, sipYears, sipReturn), [sipAmount, sipYears, sipReturn]);
  const goalPlan = useMemo(() => planGoal(goalName, goalTarget, goalYears), [goalName, goalTarget, goalYears]);
  const suitability = useMemo(() => getSuitability(investorProfile), [investorProfile]);
  const marketImpacts = useMemo(() => getMarketImpacts(), []);
  const categoryInsights = useMemo(() => getCategoryInsights(), []);

  // Compare data
  const fundAEntry = MUTUAL_FUNDS.find(f => f.symbol === compareFundA);
  const fundBEntry = MUTUAL_FUNDS.find(f => f.symbol === compareFundB);
  const fundADetail = useMemo(() => {
    if (!fundAEntry) return null;
    const detail = generateFundDetail(fundAEntry.symbol, fundAEntry.name, fundAEntry.amc, fundAEntry.category, fundAEntry.riskLevel);
    // Merge live NAV if available
    const liveNav = liveNavs[fundAEntry.symbol];
    if (liveNav && liveNav.nav > 0) return { ...detail, nav: liveNav.nav };
    return detail;
  }, [fundAEntry, liveNavs]);
  const fundBDetail = useMemo(() => {
    if (!fundBEntry) return null;
    const detail = generateFundDetail(fundBEntry.symbol, fundBEntry.name, fundBEntry.amc, fundBEntry.category, fundBEntry.riskLevel);
    const liveNav = liveNavs[fundBEntry.symbol];
    if (liveNav && liveNav.nav > 0) return { ...detail, nav: liveNav.nav };
    return detail;
  }, [fundBEntry, liveNavs]);

  const beginnerExplanationsA = useMemo(() => {
    if (!fundADetail) return [];
    return getBeginnerExplanations({ nav: fundADetail.nav, expenseRatio: +fundADetail.expenseRatio, sharpe: +fundADetail.sharpe, aum: fundADetail.aum, return1y: +fundADetail.return1y, return3y: +fundADetail.return3y, return5y: +fundADetail.return5y, stdDev: +fundADetail.stdDev, maxDrawdown: +fundADetail.maxDrawdown, alpha: +fundADetail.alpha, beta: +fundADetail.beta, category: fundADetail.category });
  }, [fundADetail]);

  const glossaryFiltered = useMemo(() => glossaryCat === "All" ? MF_GLOSSARY : MF_GLOSSARY.filter(t => t.category === glossaryCat), [glossaryCat]);

  const dirColors: Record<string, { c: string; bg: string }> = { positive: { c: "#166534", bg: "#dcfce7" }, negative: { c: "#991b1b", bg: "#fee2e2" }, neutral: { c: "#9a3412", bg: "#ffedd5" } };

  /* ─── Section renderers ─── */

  const renderDiscover = () => (
    <div>
      {/* Category Overview */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>Category Performance</h3>
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 16 }}>Compare returns across mutual fund categories</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {categoryInsights.map(ci => (
            <div key={ci.category} style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", transition: "all 0.2s", cursor: "default" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 }}>{ci.category}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: "1.3rem", fontWeight: 900, color: ci.avgReturn1y >= 15 ? "#10b981" : ci.avgReturn1y >= 8 ? "#f59e0b" : "#64748b" }}>{ci.avgReturn1y}%</span>
                <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>1Y</span>
              </div>
              <div style={{ display: "flex", gap: 8, fontSize: "0.6rem", color: "#94a3b8" }}>
                <span>3Y: {ci.avgReturn3y}%</span>
                <span>5Y: {ci.avgReturn5y}%</span>
              </div>
              <div style={{ fontSize: "0.55rem", color: "#94a3b8", marginTop: 4 }}>{ci.numSchemes} schemes · {ci.totalAum}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Curated Lists */}
      {curatedLists.map(list => (
        <div key={list.id} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: "1.2rem" }}>{list.emoji}</span>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>{list.title}</h3>
              <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: 0 }}>{list.subtitle}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {list.funds.map((fund, fi) => {
              const spark = generateMFSparkline(fund.name.slice(0, 10), 20);
              const slug = fund.name.toLowerCase().replace(/\s+/g, "-").replace(/[()&]/g, "");
              return (
                <div key={fi} onClick={() => { window.location.href = `/mf-intelligence/${slug}`; }} style={{
                  padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0",
                  cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden",
                }}>
                  {fund.badge && (
                    <div style={{ position: "absolute", top: 8, right: 8 }}>
                      <Badge text={fund.badge} variant="purple" />
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: fund.badge ? 60 : 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.3, marginBottom: 2 }}>{fund.name}</div>
                      <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>{fund.amc} · {fund.category}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <Spark data={spark} color={list.color} w={80} h={24} />
                    <div style={{ display: "flex", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: "0.5rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>1Y</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: fund.return1y >= 15 ? "#10b981" : fund.return1y >= 8 ? "#f59e0b" : "#64748b" }}>+{fund.return1y}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.5rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>3Y</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#64748b" }}>+{fund.return3y}%</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <Badge text={fund.riskLevel} variant={fund.riskLevel === "Low" ? "green" : fund.riskLevel === "High" ? "orange" : "red"} />
                      <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>SIP: {fund.sipMin}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#7c3aed" }}>AI Rating</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 900, color: fund.aiRating >= 90 ? "#10b981" : fund.aiRating >= 80 ? "#f59e0b" : "#64748b" }}>{fund.aiRating}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCopilot = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: "1.4rem" }}>🤖</span>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>AI Wealth Copilot</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.7 }}>Wealth advisor · Portfolio strategist · Fund analyst</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: copilot.moodColor, boxShadow: `0 0 8px ${copilot.moodColor}80` }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: copilot.moodColor }}>{copilot.marketMood}</span>
          </div>
        </div>
        <p style={{ fontSize: "0.78rem", lineHeight: 1.6, opacity: 0.9, margin: 0 }}>{copilot.summary}</p>
      </div>

      {/* Beginner Summary */}
      <div style={{ padding: "16px 20px", borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: "0.9rem" }}>🌱</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.5 }}>Beginner Explanation</span>
        </div>
        <p style={{ fontSize: "0.75rem", lineHeight: 1.6, color: "#1e3a5f", margin: 0 }}>{copilot.beginnerSummary}</p>
      </div>

      {/* Key Drivers */}
      <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>Key Market Drivers</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {copilot.keyDrivers.map((d, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${dirColors[d.impact]?.c || "#94a3b8"}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>{d.driver}</span>
              <Badge text={d.impact} variant={d.impact === "positive" ? "green" : d.impact === "negative" ? "red" : "orange"} />
            </div>
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: "0 0 6px", lineHeight: 1.5 }}>{d.explanation}</p>
            <div style={{ padding: "8px 10px", borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.65rem", color: "#166534", lineHeight: 1.4 }}>
              💡 <strong>Beginner Tip:</strong> {d.beginnerTip}
            </div>
          </div>
        ))}
      </div>

      {/* Top Picks & Avoid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#10b981", marginBottom: 8 }}>🎯 AI Top Picks</h3>
          {copilot.topPicks.map((p, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 6 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534" }}>{p.name}</div>
              <div style={{ fontSize: "0.62rem", color: "#4ade80", marginBottom: 2 }}>{p.category} · {p.returnTag}</div>
              <div style={{ fontSize: "0.62rem", color: "#64748b" }}>{p.reason}</div>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>⚠️ Avoid / Be Cautious</h3>
          {copilot.avoidList.map((a, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 6 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#991b1b" }}>{a.name}</div>
              <div style={{ fontSize: "0.62rem", color: "#64748b", lineHeight: 1.4 }}>{a.reason}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SIP Advice */}
      <div style={{ padding: "16px 20px", borderRadius: 12, background: "#faf5ff", border: "1px solid #e9d5ff", marginBottom: 12 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>💰 SIP Strategy</div>
        <p style={{ fontSize: "0.75rem", color: "#4c1d95", lineHeight: 1.6, margin: 0 }}>{copilot.sipAdvice}</p>
      </div>
      <div style={{ padding: "16px 20px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>📈 Market Outlook</div>
        <p style={{ fontSize: "0.75rem", color: "#166534", lineHeight: 1.6, margin: 0 }}>{copilot.marketOutlook}</p>
      </div>
    </div>
  );

  const renderSimulator = () => {
    const maxProj = sipProjections.length > 0 ? Math.max(...sipProjections.map(p => p.value)) : 1;
    return (
      <div>
        <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#fff", marginBottom: 20 }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>AI SIP Wealth Simulator</div>
          <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>See how your money grows with the power of compounding</p>
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ padding: "16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Monthly SIP (₹)</label>
            <input type="range" min={1000} max={100000} step={1000} value={sipAmount} onChange={e => setSipAmount(+e.target.value)}
              style={{ width: "100%", accentColor: "#7c3aed" }} />
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#7c3aed", textAlign: "center" }}>₹{sipAmount.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ padding: "16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Time Period (Years)</label>
            <input type="range" min={1} max={30} value={sipYears} onChange={e => setSipYears(+e.target.value)}
              style={{ width: "100%", accentColor: "#7c3aed" }} />
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#7c3aed", textAlign: "center" }}>{sipYears} years</div>
          </div>
          <div style={{ padding: "16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Expected Return (%)</label>
            <input type="range" min={6} max={20} step={0.5} value={sipReturn} onChange={e => setSipReturn(+e.target.value)}
              style={{ width: "100%", accentColor: "#7c3aed" }} />
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#7c3aed", textAlign: "center" }}>{sipReturn}%</div>
          </div>
        </div>

        {/* Results */}
        {sipProjections.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Invested", value: fINR(sipProjections[sipProjections.length - 1].invested), color: "#64748b" },
                { label: "Projected Value", value: fINR(sipProjections[sipProjections.length - 1].value), color: "#10b981" },
                { label: "Wealth Gained", value: fINR(sipProjections[sipProjections.length - 1].gains), color: "#7c3aed" },
                { label: "Inflation-Adjusted", value: fINR(sipProjections[sipProjections.length - 1].inflationAdjusted), color: "#f59e0b" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Bar Chart */}
            <div style={{ padding: "20px", borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", marginBottom: 16 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Wealth Growth Over Time</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 220, padding: "0 4px" }}>
                {sipProjections.filter((_, i) => sipYears <= 10 || i % Math.ceil(sipYears / 15) === 0 || i === sipProjections.length - 1).map((p, i) => {
                  const h = (p.value / maxProj) * 190;
                  const ih = (p.invested / maxProj) * 190;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ fontSize: "0.48rem", fontWeight: 700, color: "#7c3aed", whiteSpace: "nowrap" }}>{fINR(p.value)}</div>
                      <div style={{ width: "100%", position: "relative" }}>
                        <div style={{ height: Math.max(2, h), background: "linear-gradient(to top, #7c3aed, #a78bfa)", borderRadius: "4px 4px 0 0", position: "relative" }}>
                          <div style={{ position: "absolute", bottom: 0, width: "100%", height: Math.max(1, ih), background: "rgba(255,255,255,0.3)", borderRadius: "0 0 4px 4px" }} />
                        </div>
                      </div>
                      <div style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 600 }}>Y{p.year}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 10, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: "#7c3aed" }} /><span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>Total Value</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(124,58,237,0.3)" }} /><span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>Amount Invested</span></div>
              </div>
            </div>

            {/* Beginner explanation */}
            <div style={{ padding: "14px 18px", borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1e40af", marginBottom: 4 }}>🌱 What This Means</div>
              <p style={{ fontSize: "0.72rem", color: "#1e3a5f", margin: 0, lineHeight: 1.6 }}>
                If you invest ₹{sipAmount.toLocaleString("en-IN")} every month for {sipYears} years at {sipReturn}% annual returns,
                your total investment of {fINR(sipProjections[sipProjections.length - 1].invested)} could grow to <strong>{fINR(sipProjections[sipProjections.length - 1].value)}</strong>.
                {" "}That means you earn {fINR(sipProjections[sipProjections.length - 1].gains)} in wealth gains — the magic of compounding!
                After adjusting for 6% inflation, the real purchasing power would be approximately {fINR(sipProjections[sipProjections.length - 1].inflationAdjusted)}.
              </p>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderGoals = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>AI Goal Planner</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Set your financial goals and get AI-recommended fund allocation</p>
      </div>

      {/* Goal Presets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { name: "Retirement", target: 20000000, years: 20, emoji: "🏖️" },
          { name: "Child Education", target: 5000000, years: 15, emoji: "🎓" },
          { name: "House Purchase", target: 10000000, years: 8, emoji: "🏠" },
          { name: "Wealth Building", target: 50000000, years: 25, emoji: "💎" },
          { name: "Emergency Fund", target: 500000, years: 2, emoji: "🛡️" },
        ].map(g => (
          <button key={g.name} onClick={() => { setGoalName(g.name); setGoalTarget(g.target); setGoalYears(g.years); }}
            style={{
              padding: "8px 16px", borderRadius: 10, border: "1px solid",
              borderColor: goalName === g.name ? "#7c3aed" : "#e2e8f0",
              background: goalName === g.name ? "#ede9fe" : "#fff",
              color: goalName === g.name ? "#5b21b6" : "#64748b",
              fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            }}>{g.emoji} {g.name}</button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ padding: "16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
          <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Target Amount</label>
          <input type="range" min={100000} max={100000000} step={100000} value={goalTarget} onChange={e => setGoalTarget(+e.target.value)} style={{ width: "100%", accentColor: "#7c3aed" }} />
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#7c3aed", textAlign: "center" }}>{fINR(goalTarget)}</div>
        </div>
        <div style={{ padding: "16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
          <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Years to Goal</label>
          <input type="range" min={1} max={30} value={goalYears} onChange={e => setGoalYears(+e.target.value)} style={{ width: "100%", accentColor: "#7c3aed" }} />
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#7c3aed", textAlign: "center" }}>{goalYears} years</div>
        </div>
      </div>

      {/* Results */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ padding: "20px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#166534", textTransform: "uppercase", marginBottom: 4 }}>Required Monthly SIP</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#10b981" }}>₹{goalPlan.monthlySIP.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ padding: "20px", borderRadius: 12, background: "#ede9fe", border: "1px solid #c4b5fd", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#5b21b6", textTransform: "uppercase", marginBottom: 4 }}>Expected Return</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#7c3aed" }}>{goalPlan.expectedReturn}% CAGR</div>
        </div>
        <div style={{ padding: "20px", borderRadius: 12, background: "#dbeafe", border: "1px solid #93c5fd", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#1e40af", textTransform: "uppercase", marginBottom: 4 }}>Success Probability</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#3b82f6" }}>{goalPlan.successProbability}%</div>
        </div>
      </div>

      {/* Suggested Funds */}
      <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>Suggested Fund Allocation</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {goalPlan.suggestedFunds.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `conic-gradient(#7c3aed ${f.allocation * 3.6}deg, #f1f5f9 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 900, color: "#7c3aed" }}>{f.allocation}%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>{f.name}</div>
              <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{f.reason}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSuitability = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>AI Investor Suitability</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Personalized fund recommendations based on your investor profile</p>
      </div>

      {/* Profile Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {([
          { id: "beginner" as InvestorProfile, label: "🌱 Beginner", desc: "New to investing" },
          { id: "aggressive" as InvestorProfile, label: "🚀 Aggressive", desc: "High growth seeker" },
          { id: "conservative" as InvestorProfile, label: "🛡️ Conservative", desc: "Safety first" },
          { id: "retirement" as InvestorProfile, label: "🏖️ Retirement", desc: "Long-term planning" },
          { id: "tax-saver" as InvestorProfile, label: "🧾 Tax Saver", desc: "Section 80C" },
        ]).map(p => (
          <button key={p.id} onClick={() => setInvestorProfile(p.id)} style={{
            padding: "10px 18px", borderRadius: 10, border: "2px solid",
            borderColor: investorProfile === p.id ? "#0ea5e9" : "#e2e8f0",
            background: investorProfile === p.id ? "#e0f2fe" : "#fff",
            color: investorProfile === p.id ? "#0369a1" : "#64748b",
            fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", textAlign: "left",
          }}>
            <div>{p.label}</div>
            <div style={{ fontSize: "0.58rem", fontWeight: 500, opacity: 0.7, marginTop: 2 }}>{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Profile Info */}
      <div style={{ padding: "16px 20px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 20 }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0369a1", marginBottom: 4 }}>{suitability.profileLabel}</div>
        <p style={{ fontSize: "0.72rem", color: "#0c4a6e", margin: 0, lineHeight: 1.5 }}>{suitability.profileDescription}</p>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.62rem", color: "#0369a1", fontWeight: 700 }}>Risk Tolerance:</span>
          <div style={{ flex: 1, maxWidth: 200, height: 6, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}>
            <div style={{ width: `${suitability.riskTolerance}%`, height: "100%", borderRadius: 3, background: suitability.riskTolerance > 60 ? "#ef4444" : suitability.riskTolerance > 35 ? "#f59e0b" : "#10b981" }} />
          </div>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0369a1" }}>{suitability.riskTolerance}/100</span>
        </div>
      </div>

      {/* Asset Allocation Donut */}
      <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20, padding: "16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
        <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
          <svg viewBox="0 0 42 42" style={{ width: "100%", transform: "rotate(-90deg)" }}>
            {(() => { let cum = 0; return suitability.suggestedAllocation.map((a, i) => { const s = cum; cum += a.weight; return <circle key={i} cx="21" cy="21" r="15.5" fill="none" stroke={a.color} strokeWidth="5" strokeDasharray={`${a.weight * 0.97} ${100 - a.weight * 0.97}`} strokeDashoffset={`${-s * 0.97}`} />; }); })()}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "0.55rem", color: "#94a3b8" }}>Allocation</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {suitability.suggestedAllocation.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569", flex: 1 }}>{a.category}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e293b" }}>{a.weight}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Funds */}
      <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>AI Recommended Funds</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {suitability.recommendedFunds.map((f, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>{f.name}</div>
                <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>{f.category}</div>
              </div>
              <Ring value={f.match} label="Match" size={52} />
            </div>
            <p style={{ fontSize: "0.68rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{f.reason}</p>
          </div>
        ))}
      </div>

      {/* SIP Strategy */}
      <div style={{ padding: "14px 18px", borderRadius: 10, background: "#faf5ff", border: "1px solid #e9d5ff", marginBottom: 12 }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>💰 Suggested SIP Strategy</div>
        <p style={{ fontSize: "0.72rem", color: "#4c1d95", margin: 0, lineHeight: 1.6 }}>{suitability.sipStrategy}</p>
      </div>

      {/* Warnings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {suitability.warnings.map((w, i) => (
          <div key={i} style={{ padding: "8px 12px", borderRadius: 6, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: "0.68rem", color: "#9a3412", display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠️</span> {w}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompare = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Fund Comparison</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Side-by-side analysis with AI-powered insights</p>
      </div>

      {/* Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[{ label: "Fund A", value: compareFundA, setter: setCompareFundA }, { label: "Fund B", value: compareFundB, setter: setCompareFundB }].map((sel) => (
          <div key={sel.label} style={{ padding: "12px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>{sel.label}</div>
            <select value={sel.value} onChange={e => sel.setter(e.target.value)} style={{
              width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
              fontSize: "0.75rem", fontWeight: 600, color: "#1e293b", background: "#f8fafc", cursor: "pointer",
            }}>
              {MUTUAL_FUNDS.map(f => <option key={f.symbol} value={f.symbol}>{f.name}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {fundADetail && fundBDetail && (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
            <thead><tr style={{ background: "#7c3aed", color: "#fff" }}>
              <th style={{ padding: "10px 14px", textAlign: "left" }}>Metric</th>
              <th style={{ padding: "10px 14px", textAlign: "right" }}>{fundAEntry?.name?.split(" ").slice(0, 3).join(" ")}</th>
              <th style={{ padding: "10px 14px", textAlign: "right" }}>{fundBEntry?.name?.split(" ").slice(0, 3).join(" ")}</th>
            </tr></thead>
            <tbody>
              {[
                { l: "1Y Return", a: `${fundADetail.return1y}%`, b: `${fundBDetail.return1y}%`, aw: fundADetail.return1y > fundBDetail.return1y },
                { l: "3Y Return", a: `${fundADetail.return3y}%`, b: `${fundBDetail.return3y}%`, aw: fundADetail.return3y > fundBDetail.return3y },
                { l: "5Y Return", a: `${fundADetail.return5y}%`, b: `${fundBDetail.return5y}%`, aw: fundADetail.return5y > fundBDetail.return5y },
                { l: "Expense Ratio", a: `${fundADetail.expenseRatio}%`, b: `${fundBDetail.expenseRatio}%`, aw: fundADetail.expenseRatio < fundBDetail.expenseRatio },
                { l: "Sharpe Ratio", a: fundADetail.sharpe.toString(), b: fundBDetail.sharpe.toString(), aw: +fundADetail.sharpe > +fundBDetail.sharpe },
                { l: "Alpha", a: `${fundADetail.alpha}`, b: `${fundBDetail.alpha}`, aw: +fundADetail.alpha > +fundBDetail.alpha },
                { l: "Max Drawdown", a: `${fundADetail.maxDrawdown}%`, b: `${fundBDetail.maxDrawdown}%`, aw: +fundADetail.maxDrawdown < +fundBDetail.maxDrawdown },
                { l: "AUM", a: fundADetail.aum, b: fundBDetail.aum, aw: false },
                { l: "AI Score", a: fundADetail.overallScore.toString(), b: fundBDetail.overallScore.toString(), aw: +fundADetail.overallScore > +fundBDetail.overallScore },
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#faf5ff" : "#fff", borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#475569" }}>{row.l}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: row.aw ? "#10b981" : "#64748b" }}>{row.a} {row.aw && "✓"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: !row.aw && row.l !== "AUM" ? "#10b981" : "#64748b" }}>{row.b} {!row.aw && row.l !== "AUM" && "✓"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Beginner Explanations for Fund A */}
      {beginnerExplanationsA.length > 0 && (
        <div>
          <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>🌱 Understanding {fundAEntry?.name?.split(" ").slice(0, 3).join(" ")} Metrics</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {beginnerExplanationsA.map((ex, i) => (
              <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "1rem" }}>{ex.emoji}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>{ex.metric}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 900, color: ex.verdictColor }}>{ex.value}</span>
                    <Badge text={ex.verdict} variant={ex.verdict === "good" ? "green" : ex.verdict === "average" ? "orange" : "red"} />
                  </div>
                </div>
                <p style={{ fontSize: "0.68rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{ex.simpleExplanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderInsights = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Market & Macro Impact Engine</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.7, margin: 0 }}>How macroeconomic factors affect your mutual fund investments</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {marketImpacts.map((m, i) => (
          <div key={i} style={{ padding: "16px 20px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${dirColors[m.direction]?.c || "#94a3b8"}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b" }}>{m.factor}</span>
              <Badge text={m.direction} variant={m.direction === "positive" ? "green" : m.direction === "negative" ? "red" : "orange"} />
            </div>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#7c3aed", marginBottom: 4 }}>{m.currentState}</div>
            <p style={{ fontSize: "0.72rem", color: "#475569", margin: "0 0 8px", lineHeight: 1.5 }}>{m.impactOnMF}</p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {m.affectedCategories.map(c => <Badge key={c} text={c} variant="purple" />)}
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.65rem", color: "#1e40af", lineHeight: 1.4 }}>
              🌱 <strong>Beginner Explanation:</strong> {m.beginnerExplanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLearn = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Learn Mutual Funds</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Every term explained in plain English — no jargon, no confusion</p>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {MF_GLOSSARY_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setGlossaryCat(cat)} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid",
            borderColor: glossaryCat === cat ? "#f59e0b" : "#e2e8f0",
            background: glossaryCat === cat ? "#fef3c7" : "#fff",
            color: glossaryCat === cat ? "#92400e" : "#64748b",
            fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
          }}>{cat}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {glossaryFiltered.map((term, i) => (
          <div key={i} style={{ padding: "14px 18px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b" }}>{term.term}</span>
              <Badge text={term.abbr} variant="blue" />
              <Badge text={term.category} variant="neutral" />
            </div>
            <p style={{ fontSize: "0.72rem", color: "#475569", margin: "0 0 6px", lineHeight: 1.5 }}>{term.definition}</p>
            <div style={{ padding: "8px 10px", borderRadius: 6, background: "#faf5ff", border: "1px solid #e9d5ff", fontSize: "0.65rem", color: "#5b21b6", lineHeight: 1.4, marginBottom: 4 }}>
              <strong>Why it matters:</strong> {term.significance}
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.65rem", color: "#166534", lineHeight: 1.4 }}>
              🌱 <strong>For you:</strong> {term.investorImpact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  const sectionMap: Record<MFSection, () => React.JSX.Element> = {
    discover: renderDiscover, copilot: renderCopilot, simulator: renderSimulator,
    goals: renderGoals, suitability: renderSuitability, compare: renderCompare,
    insights: renderInsights, learn: renderLearn,
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Hero */}
      <div style={{ padding: "24px 28px 16px", borderRadius: 16, background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #4c1d95 100%)", color: "#fff", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e676", boxShadow: "0 0 8px #00e67680" }} />
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.8 }}>AI-Powered Wealth Intelligence</span>
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: 4 }}>Mutual Fund Intelligence Terminal</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.72rem", opacity: 0.7 }}>
              Discover · Compare · Plan · Invest — guided by AI
              {mfUpdated > 0 && <DataSourceBadge source={mfSource} isStale={mfStale} lastUpdated={mfUpdated} compact />}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {[
                { label: "SIP Flows", value: "₹25.3K Cr", color: "#00e676" },
                { label: "Nifty PE", value: "22.8x", color: "#ff9800" },
                { label: "RBI Rate", value: "6.50%", color: "#00e676" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.5rem", opacity: 0.6, textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 4, padding: "8px 0", marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {MF_NAV_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
            padding: "8px 16px", borderRadius: 10, border: "1px solid",
            borderColor: activeSection === sec.id ? "#7c3aed" : "#e2e8f0",
            background: activeSection === sec.id ? "#7c3aed" : "#fff",
            color: activeSection === sec.id ? "#fff" : "#64748b",
            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
          }}>
            <span>{sec.emoji}</span> {sec.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {sectionMap[activeSection]()}

      {/* Footer */}
      <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center", fontSize: "0.6rem", color: "#94a3b8" }}>
        White Tiger MF Intelligence · AI-powered analysis is for educational purposes only · Not investment advice · Past performance does not guarantee future results · Data refreshed periodically · AMFI · Value Research · Morningstar
      </div>
    </div>
  );
}
