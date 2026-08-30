"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  generateSovereignYields, generateBondCopilot, analyzeYieldCurve,
  getLongDurationBonds, generateBondStories, getBondEquityImpacts,
  getEconomicCalendar, getBondEducation,
  BOND_NAV_SECTIONS, type BondSection,
} from "@/lib/bond-engine";
import {
  BOND_GLOSSARY, BOND_GLOSSARY_CATEGORIES, generateBondSparkline,
  getGlobalBondMarkets,
} from "@/lib/bond-data";
import { BONDS_LIST, BOND_CATEGORIES } from "@/lib/bonds";
import { useBondYields } from "@/hooks/useMarketData";
import { DataSourceBadge } from "@/components/DataHealth";

/* ═══════════════════════════════════════════════════════════════
   MOONLIGHT BONDS INTELLIGENCE PLATFORM v2.0
   AI Bond Copilot · Yield Curve Intelligence · Long Duration
   Story Engine · Bond-Equity Impact · Economic Calendar · Learn
   ═══════════════════════════════════════════════════════════════ */

/* ─── Utility: Sparkline ─── */
function Spark({ data, color = "#00897b", w = 100, h = 28 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs><linearGradient id={`bsp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.15} /><stop offset="100%" stopColor={color} stopOpacity={0.01} /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#bsp-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Badge ─── */
function Badge({ text, variant = "neutral" }: { text: string; variant?: "green" | "red" | "orange" | "blue" | "teal" | "purple" | "neutral" }) {
  const cols: Record<string, { bg: string; color: string }> = {
    green: { bg: "#dcfce7", color: "#166534" }, red: { bg: "#fee2e2", color: "#991b1b" },
    orange: { bg: "#ffedd5", color: "#9a3412" }, blue: { bg: "#dbeafe", color: "#1e40af" },
    teal: { bg: "#ccfbf1", color: "#115e59" }, purple: { bg: "#ede9fe", color: "#5b21b6" },
    neutral: { bg: "#f1f5f9", color: "#475569" },
  };
  const c = cols[variant] || cols.neutral;
  return <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{text}</span>;
}

const dirColors: Record<string, { c: string; bg: string }> = {
  bullish: { c: "#166534", bg: "#dcfce7" }, positive: { c: "#166534", bg: "#dcfce7" },
  bearish: { c: "#991b1b", bg: "#fee2e2" }, negative: { c: "#991b1b", bg: "#fee2e2" },
  neutral: { c: "#9a3412", bg: "#ffedd5" },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PLATFORM COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function BondsPlatform() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<BondSection>("overview");
  const [debtCategory, setDebtCategory] = useState("All");
  const [glossaryCat, setGlossaryCat] = useState("All");

  // Live bond yield data
  const { data: liveYields, source: yieldSource, isStale: yieldStale, lastUpdated: yieldUpdated } = useBondYields();

  // Data — merge live yields into synthetic sovereign data
  const sovereignYields = useMemo(() => {
    const base = generateSovereignYields();
    if (Object.keys(liveYields).length === 0) return base;
    // Map live yield keys to country names
    const yieldMap: Record<string, string> = {
      "US_10Y": "United States", "US_2Y": "United States", "US_30Y": "United States", "US_5Y": "United States",
    };
    return base.map(s => {
      // Try to match US yields
      if (s.country === "United States" && liveYields["US_10Y"]) {
        return { ...s, yield10y: liveYields["US_10Y"].yield, change1d: Math.round(liveYields["US_10Y"].change * 100) / 100 };
      }
      return s;
    });
  }, [liveYields]);
  const copilot = useMemo(() => generateBondCopilot(), []);
  const yieldCurve = useMemo(() => analyzeYieldCurve(), []);
  const longDurationBonds = useMemo(() => getLongDurationBonds(), []);
  const stories = useMemo(() => generateBondStories(), []);
  const bondEquity = useMemo(() => getBondEquityImpacts(), []);
  const calendar = useMemo(() => getEconomicCalendar(), []);
  const education = useMemo(() => getBondEducation(), []);
  const globalMarkets = useMemo(() => getGlobalBondMarkets(), []);
  const glossaryFiltered = useMemo(() => glossaryCat === "All" ? BOND_GLOSSARY : BOND_GLOSSARY.filter(t => t.category === glossaryCat), [glossaryCat]);
  const filteredBonds = useMemo(() => debtCategory === "All" ? BONDS_LIST : BONDS_LIST.filter(b => b.category === debtCategory), [debtCategory]);

  /* ─── Section: Overview ─── */
  const renderOverview = () => (
    <div>
      {/* Sovereign Yield Cards */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>Global Sovereign Yields</h3>
        <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: 14 }}>Live benchmark government bond yields across major economies</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 10 }}>
          {sovereignYields.map(s => {
            const spark = generateBondSparkline(s.country, 20);
            return (
              <div key={s.country} style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: "1.2rem" }}>{s.flag}</span>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>{s.country}</div>
                    <div style={{ fontSize: "0.55rem", color: "#94a3b8" }}>{s.benchmark} · {s.rating}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#00897b" }}>{s.yield10y}%</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: s.change1d >= 0 ? "#ef4444" : "#10b981" }}>
                    {s.change1d >= 0 ? "+" : ""}{s.change1d} bps
                  </span>
                </div>
                <Spark data={spark} color="#00897b" w={140} h={22} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: "0.55rem", color: "#94a3b8" }}>
                  <span>Policy: {s.policyRate}%</span>
                  <span>Debt/GDP: {s.debtToGdp}%</span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Badge text={s.outlook} variant={s.outlookColor === "#10b981" ? "green" : s.outlookColor === "#ef4444" ? "red" : s.outlookColor === "#f59e0b" ? "orange" : "neutral"} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bond Categories */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>Indian Fixed Income Universe</h3>
        <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: 12 }}>Browse bonds by category — Government, Corporate, Tax-Free & more</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {BOND_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setDebtCategory(cat)} style={{
              padding: "6px 16px", borderRadius: 20, border: "1px solid",
              borderColor: debtCategory === cat ? "#00897b" : "#e2e8f0",
              background: debtCategory === cat ? "#00897b" : "#fff",
              color: debtCategory === cat ? "#fff" : "#64748b",
              fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {filteredBonds.map(b => {
            const ratingColor = b.rating === "Sovereign" ? "#00897b" : b.rating === "AAA" ? "#2962ff" : b.rating === "AA+" ? "#7c3aed" : "#ff9800";
            const spark = generateBondSparkline(b.symbol, 20);
            return (
              <div key={b.symbol} onClick={() => { router.push(`/bonds/${b.symbol.toLowerCase()}`); }}
                style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ratingColor}`, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: 2, lineHeight: 1.3 }}>{b.name}</div>
                <div style={{ fontSize: "0.62rem", color: "#94a3b8", marginBottom: 8 }}>{b.issuer} · {b.tenure}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <Spark data={spark} color={ratingColor} w={80} h={22} />
                  <div style={{ display: "flex", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: "0.48rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Yield</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#00897b" }}>{b.yieldApprox}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.48rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Coupon</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>{b.coupon}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Badge text={b.category} variant="neutral" />
                    <Badge text={b.rating} variant={b.rating === "Sovereign" ? "teal" : b.rating === "AAA" ? "blue" : "purple"} />
                  </div>
                  <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#00897b" }}>View →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Markets Table */}
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
        <div style={{ padding: "12px 16px", background: "#0f766e", color: "#fff", fontSize: "0.78rem", fontWeight: 800 }}>Global Bond Markets</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
          <thead><tr style={{ background: "#f8fafc" }}>
            <th style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Country</th>
            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b", fontWeight: 600 }}>10Y Yield</th>
            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b", fontWeight: 600 }}>1D</th>
            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b", fontWeight: 600 }}>Policy Rate</th>
            <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b", fontWeight: 600 }}>Rating</th>
          </tr></thead>
          <tbody>
            {globalMarkets.map((m, i) => (
              <tr key={m.country} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{m.flag} {m.country}</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, color: "#00897b" }}>{m.yield10y}%</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: m.change1d >= 0 ? "#ef4444" : "#10b981" }}>{m.change1d >= 0 ? "+" : ""}{m.change1d}</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>{m.policyRate}%</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}><Badge text={m.rating} variant={m.rating === "AAA" ? "green" : m.rating.startsWith("AA") ? "blue" : "neutral"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ─── Section: AI Copilot ─── */
  const renderCopilot = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #115e59 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: "1.4rem" }}>{"\u{1f916}"}</span>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>AI Bond Copilot</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.7 }}>Central bank analyst · Sovereign debt strategist · Credit researcher</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: copilot.moodColor, boxShadow: `0 0 8px ${copilot.moodColor}80` }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: copilot.moodColor }}>{copilot.marketMood}</span>
          </div>
        </div>
        <p style={{ fontSize: "0.78rem", lineHeight: 1.6, opacity: 0.9, margin: 0 }}>{copilot.summary}</p>
      </div>

      {/* Beginner Summary */}
      <div style={{ padding: "16px 20px", borderRadius: 12, background: "#f0fdfa", border: "1px solid #99f6e4", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: "0.9rem" }}>{"\u{1f331}"}</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#115e59", textTransform: "uppercase", letterSpacing: 0.5 }}>Beginner Explanation</span>
        </div>
        <p style={{ fontSize: "0.75rem", lineHeight: 1.6, color: "#134e4a", margin: 0 }}>{copilot.beginnerSummary}</p>
      </div>

      {/* Key Drivers */}
      <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>Key Yield Drivers</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {copilot.keyDrivers.map((d, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${dirColors[d.impact]?.c || "#94a3b8"}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>{d.driver}</span>
              <Badge text={d.impact} variant={d.impact === "bullish" ? "green" : d.impact === "bearish" ? "red" : "orange"} />
            </div>
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: "0 0 6px", lineHeight: 1.5 }}>{d.explanation}</p>
            <div style={{ padding: "8px 10px", borderRadius: 6, background: "#f0fdfa", border: "1px solid #99f6e4", fontSize: "0.65rem", color: "#115e59", lineHeight: 1.4 }}>
              {"\u{1f4a1}"} <strong>Beginner Tip:</strong> {d.beginnerTip}
            </div>
          </div>
        ))}
      </div>

      {/* Top Picks & Avoid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#10b981", marginBottom: 8 }}>{"\u{1f3af}"} AI Top Bond Picks</h3>
          {copilot.topPicks.map((p, i) => (
            <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 6 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534" }}>{p.name}</div>
              <div style={{ fontSize: "0.62rem", color: "#4ade80", marginBottom: 2 }}>{p.type} · {p.yieldTag}</div>
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

      {/* Rate & Global Outlook */}
      <div style={{ padding: "16px 20px", borderRadius: 12, background: "#f0fdfa", border: "1px solid #99f6e4", marginBottom: 12 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0f766e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{"\u{1f3e6}"} Rate Outlook</div>
        <p style={{ fontSize: "0.75rem", color: "#134e4a", lineHeight: 1.6, margin: 0 }}>{copilot.rateOutlook}</p>
      </div>
      <div style={{ padding: "16px 20px", borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{"\u{1f30d}"} Global View</div>
        <p style={{ fontSize: "0.75rem", color: "#1e3a5f", lineHeight: 1.6, margin: 0 }}>{copilot.globalView}</p>
      </div>
    </div>
  );

  /* ─── Section: Yield Curve ─── */
  const renderYieldCurve = () => {
    const maxY = Math.max(...yieldCurve.points.map(p => p.yield));
    const minY = Math.min(...yieldCurve.points.map(p => p.yield));
    const rangeY = maxY - minY || 1;
    const chartH = 200;
    const chartW = 700;
    const pts = yieldCurve.points.map((p, i) => {
      const x = (i / (yieldCurve.points.length - 1)) * chartW;
      const y = chartH - ((p.yield - minY) / rangeY) * (chartH - 30) - 15;
      return `${x},${y}`;
    }).join(" ");

    return (
      <div>
        <div style={{ padding: "24px 28px", borderRadius: 16, background: `linear-gradient(135deg, #0f172a 0%, ${yieldCurve.shapeColor}40 100%)`, color: "#fff", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Yield Curve Intelligence Engine</div>
              <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Real-time yield curve shape analysis with AI interpretation</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6rem", opacity: 0.6, textTransform: "uppercase" }}>Curve Shape</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: yieldCurve.shapeColor }}>{yieldCurve.shape}</div>
              <div style={{ fontSize: "0.62rem", opacity: 0.7 }}>2s10s: {yieldCurve.spread2s10s > 0 ? "+" : ""}{yieldCurve.spread2s10s}%</div>
            </div>
          </div>
        </div>

        {/* Yield Curve Chart */}
        <div style={{ padding: "20px", borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", marginBottom: 20 }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>India Government Bond Yield Curve</div>
          <div style={{ overflowX: "auto" }}>
            <svg width={chartW + 40} height={chartH + 40} style={{ display: "block", margin: "0 auto" }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = chartH - pct * (chartH - 30) - 15;
                const val = (minY + pct * rangeY).toFixed(2);
                return <g key={pct}><line x1={30} y1={y} x2={chartW + 30} y2={y} stroke="#f1f5f9" strokeWidth={1} /><text x={26} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{val}%</text></g>;
              })}
              {/* Area fill */}
              <polygon points={`30,${chartH - 15} ${yieldCurve.points.map((p, i) => `${(i / (yieldCurve.points.length - 1)) * chartW + 30},${chartH - ((p.yield - minY) / rangeY) * (chartH - 30) - 15}`).join(" ")} ${chartW + 30},${chartH - 15}`} fill="url(#ycGrad)" />
              <defs><linearGradient id="ycGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f766e" stopOpacity={0.2} /><stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} /></linearGradient></defs>
              {/* Line */}
              <polyline points={yieldCurve.points.map((p, i) => `${(i / (yieldCurve.points.length - 1)) * chartW + 30},${chartH - ((p.yield - minY) / rangeY) * (chartH - 30) - 15}`).join(" ")} fill="none" stroke="#0f766e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {/* Data points */}
              {yieldCurve.points.map((p, i) => {
                const x = (i / (yieldCurve.points.length - 1)) * chartW + 30;
                const y = chartH - ((p.yield - minY) / rangeY) * (chartH - 30) - 15;
                return <g key={i}><circle cx={x} cy={y} r={4} fill="#fff" stroke="#0f766e" strokeWidth={2} /><text x={x} y={chartH + 15} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600}>{p.tenor}</text><text x={x} y={y - 10} textAnchor="middle" fontSize={8} fill="#0f766e" fontWeight={700}>{p.yield}%</text></g>;
              })}
            </svg>
          </div>
        </div>

        {/* AI Analysis */}
        <div style={{ padding: "16px 20px", borderRadius: 12, background: "#f0fdfa", border: "1px solid #99f6e4", marginBottom: 16 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0f766e", marginBottom: 6 }}>{"\u{1f916}"} AI Yield Curve Analysis</div>
          <p style={{ fontSize: "0.75rem", color: "#134e4a", lineHeight: 1.6, margin: 0 }}>{yieldCurve.aiExplanation}</p>
        </div>

        <div style={{ padding: "14px 18px", borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", marginBottom: 20 }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1e40af", marginBottom: 4 }}>{"\u{1f331}"} What This Means (Beginner)</div>
          <p style={{ fontSize: "0.72rem", color: "#1e3a5f", margin: 0, lineHeight: 1.6 }}>{yieldCurve.beginnerExplanation}</p>
        </div>

        {/* Implications */}
        <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>Market Implications</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {yieldCurve.implications.map((imp, i) => (
            <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${dirColors[imp.direction]?.c || "#94a3b8"}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>{imp.area}</span>
                <Badge text={imp.direction} variant={imp.direction === "positive" ? "green" : imp.direction === "negative" ? "red" : "orange"} />
              </div>
              <p style={{ fontSize: "0.68rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{imp.impact}</p>
            </div>
          ))}
        </div>

        {/* Historical Context */}
        <div style={{ padding: "14px 18px", borderRadius: 10, background: "#faf5ff", border: "1px solid #e9d5ff" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{"\u{1f4dc}"} Historical Context</div>
          <p style={{ fontSize: "0.72rem", color: "#4c1d95", margin: 0, lineHeight: 1.6 }}>{yieldCurve.historicalContext}</p>
        </div>
      </div>
    );
  };

  /* ─── Section: Long Duration ─── */
  const renderLongDuration = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Long-Duration Bond Intelligence</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>30Y · 50Y · 100Y sovereign bonds — pension fund exposure, inflation sensitivity, AI insights</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {longDurationBonds.map((bond, i) => (
          <div key={i} style={{ padding: "20px 24px", borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid #7c3aed` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.4rem" }}>{bond.flag}</span>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b" }}>{bond.name}</div>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{bond.country} · {bond.tenor} Maturity</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#00897b" }}>{bond.yield}%</div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: bond.change1d >= 0 ? "#ef4444" : "#10b981" }}>
                  {bond.change1d >= 0 ? "+" : ""}{bond.change1d} bps
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f8fafc" }}>
                <div style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Duration</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#7c3aed" }}>{bond.duration}</div>
                <div style={{ fontSize: "0.55rem", color: "#94a3b8" }}>1% rate rise ≈ {bond.duration}% price drop</div>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f8fafc" }}>
                <div style={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Convexity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#7c3aed" }}>{bond.convexity}</div>
                <div style={{ fontSize: "0.55rem", color: "#94a3b8" }}>Non-linear price sensitivity</div>
              </div>
            </div>

            {/* Analysis sections */}
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 8, fontSize: "0.68rem", color: "#991b1b", lineHeight: 1.5 }}>
              <strong>{"\u{1f525}"} Inflation Sensitivity:</strong> {bond.inflationSensitivity}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#ede9fe", border: "1px solid #c4b5fd", marginBottom: 8, fontSize: "0.68rem", color: "#5b21b6", lineHeight: 1.5 }}>
              <strong>{"\u{1f3e6}"} Pension Fund Exposure:</strong> {bond.pensionExposure}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f0fdfa", border: "1px solid #99f6e4", marginBottom: 8, fontSize: "0.68rem", color: "#115e59", lineHeight: 1.5 }}>
              <strong>{"\u{1f916}"} AI Insight:</strong> {bond.aiInsight}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.65rem", color: "#1e40af", lineHeight: 1.4 }}>
              {"\u{1f331}"} <strong>Beginner Note:</strong> {bond.beginnerNote}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Section: Stories ─── */
  const renderStories = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Bond Market Story Engine</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.7, margin: 0 }}>AI-curated fixed income narratives — what moved yields today</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stories.map((s, i) => (
          <div key={i} style={{ padding: "16px 20px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${dirColors[s.impact]?.c || "#94a3b8"}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", lineHeight: 1.3, marginBottom: 4 }}>{s.headline}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                  <Badge text={s.category} variant="teal" />
                  <Badge text={s.impact} variant={s.impact === "bullish" ? "green" : s.impact === "bearish" ? "red" : "orange"} />
                  <span style={{ fontSize: "0.58rem", color: "#94a3b8" }}>{s.timeAgo}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#475569", margin: "0 0 8px", lineHeight: 1.5 }}>{s.summary}</p>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#f0fdfa", border: "1px solid #99f6e4", fontSize: "0.65rem", color: "#115e59", lineHeight: 1.4 }}>
              {"\u{1f331}"} <strong>What this means for you:</strong> {s.beginnerExplanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Section: Bond ↔ Equity Impact ─── */
  const renderImpact = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Bond ↔ Stock Market Impact Engine</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>How bond yields and equity markets interact — yield-equity correlation maps</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {bondEquity.map((be, i) => (
          <div key={i} style={{ padding: "18px 22px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1e293b" }}>{be.factor}</span>
              <Badge text={be.direction} variant={be.direction === "positive" ? "green" : be.direction === "negative" ? "red" : "orange"} />
            </div>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#0f766e", marginBottom: 8 }}>{be.currentState}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f0fdfa", border: "1px solid #99f6e4" }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#0f766e", textTransform: "uppercase", marginBottom: 4 }}>{"\u{1f4c9}"} Bond Impact</div>
                <p style={{ fontSize: "0.65rem", color: "#134e4a", margin: 0, lineHeight: 1.4 }}>{be.bondImpact}</p>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#991b1b", textTransform: "uppercase", marginBottom: 4 }}>{"\u{1f4c8}"} Equity Impact</div>
                <p style={{ fontSize: "0.65rem", color: "#7f1d1d", margin: 0, lineHeight: 1.4 }}>{be.equityImpact}</p>
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#faf5ff", border: "1px solid #e9d5ff", fontSize: "0.65rem", color: "#5b21b6", lineHeight: 1.4, marginBottom: 8 }}>
              <strong>Correlation:</strong> {be.correlation}
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.65rem", color: "#1e40af", lineHeight: 1.4 }}>
              {"\u{1f331}"} <strong>Beginner Explanation:</strong> {be.beginnerExplanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Section: Economic Calendar ─── */
  const renderCalendar = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Economic Calendar for Bonds</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Key events that move bond yields — RBI, Fed, auctions, data releases</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {calendar.map((ev, i) => (
          <div key={i} style={{ padding: "16px 20px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${ev.importance === "Critical" ? "#ef4444" : ev.importance === "High" ? "#f59e0b" : "#94a3b8"}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "1.1rem" }}>{ev.flag}</span>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>{ev.event}</div>
                  <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>{ev.country} · {ev.date}</div>
                </div>
              </div>
              <Badge text={ev.importance} variant={ev.importance === "Critical" ? "red" : ev.importance === "High" ? "orange" : "neutral"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div style={{ padding: "6px 10px", borderRadius: 6, background: "#f8fafc", fontSize: "0.6rem" }}>
                <span style={{ color: "#94a3b8", display: "block" }}>Previous</span>
                <span style={{ fontWeight: 700, color: "#475569" }}>{ev.previousValue}</span>
              </div>
              <div style={{ padding: "6px 10px", borderRadius: 6, background: "#f8fafc", fontSize: "0.6rem" }}>
                <span style={{ color: "#94a3b8", display: "block" }}>Consensus</span>
                <span style={{ fontWeight: 700, color: "#475569" }}>{ev.consensus}</span>
              </div>
              <div style={{ padding: "6px 10px", borderRadius: 6, background: "#f8fafc", fontSize: "0.6rem" }}>
                <span style={{ color: "#94a3b8", display: "block" }}>Expected Impact</span>
                <span style={{ fontWeight: 700, color: "#475569" }}>{ev.expectedImpact.slice(0, 40)}...</span>
              </div>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#f0fdfa", border: "1px solid #99f6e4", fontSize: "0.65rem", color: "#115e59", lineHeight: 1.4 }}>
              <strong>{"\u{1f4c9}"} Bond Implication:</strong> {ev.bondImplication}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Section: Learn ─── */
  const renderLearn = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Learn Bonds — From Zero to Hero</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Every bond concept explained in plain English with real-world examples</p>
      </div>

      {/* Education Cards */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>{"\u{1f331}"} Bond Basics — Plain English</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {education.map((ed, i) => (
            <div key={i} style={{ padding: "16px 20px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1e293b" }}>{ed.term}</span>
                <Badge text={ed.category} variant="teal" />
              </div>
              <p style={{ fontSize: "0.75rem", color: "#475569", margin: "0 0 8px", lineHeight: 1.6 }}>{ed.simpleExplanation}</p>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef3c7", border: "1px solid #fde68a", marginBottom: 6, fontSize: "0.68rem", color: "#92400e", lineHeight: 1.5 }}>
                <strong>{"\u{1f4a1}"} Analogy:</strong> {ed.analogy}
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f0fdfa", border: "1px solid #99f6e4", marginBottom: 6, fontSize: "0.68rem", color: "#115e59", lineHeight: 1.5 }}>
                <strong>Why it matters:</strong> {ed.whyItMatters}
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.68rem", color: "#1e40af", lineHeight: 1.5 }}>
                <strong>{"\u{1f4ca}"} Example:</strong> {ed.example}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Glossary */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>{"\u{1f4d6}"} Institutional Bond Glossary</h3>
        <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: 12 }}>Advanced fixed income terminology for deeper understanding</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {BOND_GLOSSARY_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setGlossaryCat(cat)} style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid",
              borderColor: glossaryCat === cat ? "#0f766e" : "#e2e8f0",
              background: glossaryCat === cat ? "#f0fdfa" : "#fff",
              color: glossaryCat === cat ? "#0f766e" : "#64748b",
              fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {glossaryFiltered.map((term, i) => (
            <div key={i} style={{ padding: "14px 18px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e293b" }}>{term.term}</span>
                <Badge text={term.abbr} variant="teal" />
                <Badge text={term.category} variant="neutral" />
              </div>
              <p style={{ fontSize: "0.72rem", color: "#475569", margin: "0 0 6px", lineHeight: 1.5 }}>{term.definition}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div style={{ padding: "6px 10px", borderRadius: 6, background: "#f0fdfa", fontSize: "0.62rem", color: "#115e59", lineHeight: 1.4 }}>
                  <strong>Yield Impact:</strong> {term.yieldImpact}
                </div>
                <div style={{ padding: "6px 10px", borderRadius: 6, background: "#fef2f2", fontSize: "0.62rem", color: "#991b1b", lineHeight: 1.4 }}>
                  <strong>Price Impact:</strong> {term.priceImpact}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  const sectionMap: Record<BondSection, () => React.JSX.Element> = {
    overview: renderOverview, copilot: renderCopilot, yieldcurve: renderYieldCurve,
    longduration: renderLongDuration, stories: renderStories, impact: renderImpact,
    calendar: renderCalendar, learn: renderLearn,
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Hero */}
      <div style={{ padding: "24px 28px 16px", borderRadius: 16, background: "linear-gradient(135deg, #0f766e 0%, #115e59 50%, #134e4a 100%)", color: "#fff", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e676", boxShadow: "0 0 8px #00e67680" }} />
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.8 }}>AI-Powered Fixed Income Intelligence</span>
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: 4 }}>Bond Intelligence Terminal</div>
            <div style={{ fontSize: "0.72rem", opacity: 0.7 }}>Sovereign yields · Yield curve · Credit analysis · AI insights</div>
            {yieldUpdated > 0 && (
              <DataSourceBadge source={yieldSource} isStale={yieldStale} lastUpdated={yieldUpdated} compact />
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {sovereignYields.slice(0, 3).map(s => (
                <div key={s.country} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.5rem", opacity: 0.6, textTransform: "uppercase" }}>{s.flag} {s.benchmark}</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#00e676" }}>{s.yield10y}%</div>
                  <div style={{ fontSize: "0.48rem", color: s.change1d >= 0 ? "#fca5a5" : "#86efac" }}>{s.change1d >= 0 ? "+" : ""}{s.change1d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 4, padding: "8px 0", marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {BOND_NAV_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
            padding: "8px 16px", borderRadius: 10, border: "1px solid",
            borderColor: activeSection === sec.id ? "#0f766e" : "#e2e8f0",
            background: activeSection === sec.id ? "#0f766e" : "#fff",
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
        White Tiger Bond Intelligence · AI-powered analysis is for educational purposes only · Not investment advice · Past performance does not guarantee future results · Data refreshed periodically · RBI · CCIL · FRED · US Treasury
      </div>
    </div>
  );
}
