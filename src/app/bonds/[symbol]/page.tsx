"use client";
import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BONDS_LIST, type BondEntry,
} from "@/lib/bonds";
import {
  generateBondDetail, generateYieldCurve, generateBondRisks, generateBondDrivers,
  generateBondSparkline, getGlobalBondMarkets,
  BOND_GLOSSARY, BOND_GLOSSARY_CATEGORIES,
  BOND_QUANT_MODELS, BOND_DERIVATIVES, BOND_AI_FEATURES, BOND_DATA_SOURCES,
  type BondDetailedInfo, type YieldCurvePoint, type BondRisk, type BondDriver,
  type BondTerm, type GlobalBondMarket,
} from "@/lib/bond-data";

/* ═══════════════════════════════════════════════════════════════
   FULL-SCREEN BOND INTELLIGENCE PAGE
   /bonds/[symbol] — Immersive Bloomberg-grade Fixed Income Terminal
   ═══════════════════════════════════════════════════════════════ */

/* ─── Resolve bond slug ─── */
function resolveBond(slug: string): BondEntry | null {
  const decoded = decodeURIComponent(slug).toUpperCase().replace(/-/g, "");
  let entry = BONDS_LIST.find(b => b.symbol === decoded);
  if (entry) return entry;
  entry = BONDS_LIST.find(b => b.symbol.toLowerCase() === decoded.toLowerCase());
  if (entry) return entry;
  const nameLower = decodeURIComponent(slug).toLowerCase().replace(/-/g, " ");
  entry = BONDS_LIST.find(b => b.name.toLowerCase().includes(nameLower));
  if (entry) return entry;
  entry = BONDS_LIST.find(b => b.symbol.toLowerCase().includes(decoded.toLowerCase()));
  return entry || null;
}

/* ─── Utility Components ─── */
function Spark({ data, color = "#69f0ae", w = 200, h = 40 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`hbd-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#hbd-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bar({ value, max = 100, color = "#00897b", h = 6 }: { value: number; max?: number; color?: string; h?: number }) {
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: "#e8eaf6", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%`, height: "100%", borderRadius: h, background: color, transition: "width 0.4s" }} />
    </div>
  );
}

function ScoreRing({ value, label, size = 72 }: { value: number; label: string; size?: number }) {
  const pct = Math.min(100, Math.abs(value));
  const color = value > 60 ? "#00c853" : value > 30 ? "#00897b" : value > 0 ? "#ff9800" : "#ef5350";
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

/* ─── Yield Curve SVG Chart ─── */
function YieldCurveChart({ data }: { data: YieldCurvePoint[] }) {
  const w = 600, h = 200, pad = 40;
  const yields = data.map(d => d.yield);
  const minY = Math.min(...yields) - 0.2, maxY = Math.max(...yields) + 0.2;
  const rangeY = maxY - minY || 1;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (d.yield - minY) / rangeY) * (h - pad * 2);
    return { x, y, ...d };
  });
  const line = pts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxHeight: 220 }}>
      <defs>
        <linearGradient id="yc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00897b" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#00897b" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(frac => {
        const y = pad + frac * (h - pad * 2);
        const yieldVal = maxY - frac * rangeY;
        return (
          <g key={frac}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e0e0e0" strokeWidth={0.5} />
            <text x={pad - 6} y={y + 3} fill="#999" fontSize="8" textAnchor="end">{yieldVal.toFixed(2)}%</text>
          </g>
        );
      })}
      {/* Area */}
      <polygon points={`${pts[0].x},${h - pad} ${line} ${pts[pts.length - 1].x},${h - pad}`} fill="url(#yc-grad)" />
      {/* Line */}
      <polyline points={line} fill="none" stroke="#00897b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Points & labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#00897b" stroke="#fff" strokeWidth={1.5} />
          <text x={p.x} y={h - pad + 14} fill="#666" fontSize="7" textAnchor="middle">{p.tenor}</text>
          <text x={p.x} y={p.y - 8} fill="#00897b" fontSize="7" fontWeight="bold" textAnchor="middle">{p.yield.toFixed(2)}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── AI Intelligence Section (API-powered) ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AIIntelligenceSection({ entry }: { entry: BondEntry }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchIntel = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/bond-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: entry.symbol, name: entry.name, issuer: entry.issuer, coupon: entry.coupon, tenure: entry.tenure, rating: entry.rating, category: entry.category, yieldApprox: entry.yieldApprox }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, [entry]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "credit", label: "Credit", icon: "🛡️" },
    { id: "curve", label: "Yield Curve", icon: "📈" },
    { id: "central", label: "Central Bank", icon: "🏛️" },
    { id: "macro", label: "Macro", icon: "🌍" },
    { id: "views", label: "Inst. Views", icon: "🏦" },
    { id: "trades", label: "Trade Ideas", icon: "💡" },
    { id: "insights", label: "Insights", icon: "⚡" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg, #004d40, #00695c, #00897b)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? "#ff9800" : data ? "#00e676" : "#888", boxShadow: `0 0 6px ${loading ? "rgba(255,152,0,0.5)" : data ? "rgba(0,230,118,0.5)" : "transparent"}` }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>AI-Powered Fixed Income Intelligence</span>
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: 4 }}>{entry.name} — Deep Analysis</div>
        <div style={{ fontSize: "0.68rem", opacity: 0.6 }}>Credit analysis, yield curve dynamics, macro drivers, institutional views, trade ideas</div>
      </div>

      <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
        {!data && !loading && (
          <button onClick={fetchIntel} style={{
            padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #00897b, #004d40)",
            color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
            boxShadow: "0 4px 16px rgba(0,137,123,0.3)", transition: "all 0.2s",
          }}>
            Generate Intelligence Report
          </button>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e0f2f1", borderTopColor: "#00897b", borderRadius: "50%", margin: "0 auto 12px", animation: "bd-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>Generating Bond Intelligence...</div>
            <div style={{ fontSize: "0.65rem", color: "#999", marginTop: 4 }}>Analyzing {entry.name} across credit, macro, and market dimensions</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c62828", marginBottom: 8 }}>Failed: {error}</div>
            <button onClick={fetchIntel} style={{ padding: "8px 20px", borderRadius: 8, background: "#00897b", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.72rem" }}>Retry</button>
          </div>
        )}

        {data && !loading && (
          <>
            <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: "6px 12px", borderRadius: 8, border: activeTab === t.id ? "1.5px solid #00897b" : "1px solid transparent",
                  background: activeTab === t.id ? "#e0f2f1" : "transparent", color: activeTab === t.id ? "#00897b" : "#666",
                  fontSize: "0.62rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3,
                }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            <div style={{ minHeight: 300 }}>
              {activeTab === "overview" && data.overview && (
                <div>
                  <div style={{ background: "linear-gradient(135deg, #004d40, #00695c)", borderRadius: 14, padding: "20px 24px", marginBottom: 16, color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: "2.2rem", fontWeight: 900 }}>₹{data.overview.currentPrice?.toFixed(2)}</span>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: data.overview.priceChange1d >= 0 ? "#69f0ae" : "#ff5252" }}>
                        {data.overview.priceChange1d >= 0 ? "▲" : "▼"} {Math.abs(data.overview.priceChange1d).toFixed(3)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: "0.68rem", opacity: 0.7 }}>
                      <span>YTM: {data.overview.yieldToMaturity?.toFixed(2)}%</span>
                      <span>Duration: {data.overview.duration?.toFixed(2)}</span>
                      <span>DV01: {data.overview.dv01?.toFixed(4)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                    {[
                      { label: "Current Yield", value: `${data.overview.currentYield?.toFixed(2)}%`, color: "#00897b" },
                      { label: "Credit Spread", value: `${data.overview.creditSpread} bps`, color: "#1a237e" },
                      { label: "Liquidity", value: `${data.overview.liquidityScore}/100`, color: "#e65100" },
                      { label: "Bid-Ask", value: data.overview.bidAskSpread, color: "#555" },
                    ].map(s => (
                      <div key={s.label} style={{ flex: "1 1 140px", padding: "10px 14px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#f8f9ff", borderRadius: 12, padding: 14, border: "1px solid #e8eaf6" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#555", marginBottom: 10, textTransform: "uppercase" }}>Price & Yield Changes</div>
                    <div style={{ display: "flex", gap: 14 }}>
                      {[
                        { label: "1 Day", price: data.overview.priceChange1d, yld: data.overview.yieldChange1d },
                        { label: "1 Week", price: data.overview.priceChange1w, yld: data.overview.yieldChange1w },
                        { label: "1 Month", price: data.overview.priceChange1m, yld: data.overview.yieldChange1m },
                      ].map(v => (
                        <div key={v.label} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ fontSize: "0.55rem", color: "#999", marginBottom: 3 }}>{v.label}</div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: v.price >= 0 ? "#00c853" : "#ef5350" }}>{v.price >= 0 ? "+" : ""}{v.price?.toFixed(3)}</div>
                          <div style={{ fontSize: "0.6rem", color: v.yld <= 0 ? "#00c853" : "#ef5350" }}>Yield: {v.yld >= 0 ? "+" : ""}{v.yld?.toFixed(2)} bps</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "credit" && data.creditAnalysis && (
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>Rating</div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#00897b" }}>{data.creditAnalysis.rating}</div>
                      <Badge text={`Outlook: ${data.creditAnalysis.outlook}`} variant={data.creditAnalysis.outlook === "positive" ? "green" : data.creditAnalysis.outlook === "negative" ? "red" : "neutral"} />
                    </div>
                    <div style={{ flex: 1, padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>Credit Score</div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: data.creditAnalysis.creditScore > 70 ? "#00c853" : data.creditAnalysis.creditScore > 40 ? "#ff9800" : "#ef5350" }}>{data.creditAnalysis.creditScore}/100</div>
                      <Badge text={data.creditAnalysis.fundamentalStrength} variant={data.creditAnalysis.fundamentalStrength === "strong" ? "green" : data.creditAnalysis.fundamentalStrength === "moderate" ? "orange" : "red"} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[
                      { label: "Default Prob", value: `${data.creditAnalysis.defaultProbability}%`, color: data.creditAnalysis.defaultProbability > 5 ? "#ef5350" : "#00c853" },
                      { label: "Recovery Rate", value: `${data.creditAnalysis.recoveryRate}%`, color: "#00897b" },
                      { label: "CDS Spread", value: `${data.creditAnalysis.cdsSpread} bps`, color: "#1a237e" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "10px 12px", borderRadius: 8, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {data.creditAnalysis.keyRisks && (
                    <div style={{ padding: 14, borderRadius: 10, background: "#fff3e0", border: "1px solid #ffcc80" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#e65100", marginBottom: 8, textTransform: "uppercase" }}>Key Credit Risks</div>
                      {data.creditAnalysis.keyRisks.map((r: string, i: number) => (
                        <div key={i} style={{ fontSize: "0.68rem", color: "#555", padding: "3px 0", display: "flex", gap: 6 }}>
                          <span style={{ color: "#e65100" }}>⚠️</span> {r}
                        </div>
                      ))}
                    </div>
                  )}
                  {data.creditAnalysis.peerComparison && (
                    <div style={{ padding: 12, borderRadius: 8, background: "#e3f2fd", border: "1px solid #90caf9", marginTop: 10, fontSize: "0.65rem", color: "#0d47a1" }}>
                      <strong>Peer Comparison:</strong> {data.creditAnalysis.peerComparison}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "curve" && data.yieldCurveAnalysis && (
                <div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                    {[
                      { label: "Curve Shape", value: data.yieldCurveAnalysis.curveShape, color: "#00897b" },
                      { label: "2s10s Slope", value: `${data.yieldCurveAnalysis.steepness2s10s} bps`, color: "#1a237e" },
                      { label: "Butterfly", value: `${data.yieldCurveAnalysis.butterFly5s10s30s} bps`, color: "#7c3aed" },
                      { label: "Relative Value", value: data.yieldCurveAnalysis.relativeValue, color: data.yieldCurveAnalysis.relativeValue === "cheap" ? "#00c853" : data.yieldCurveAnalysis.relativeValue === "rich" ? "#ef5350" : "#ff9800" },
                    ].map(s => (
                      <div key={s.label} style={{ flex: "1 1 120px", padding: "10px 14px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: s.color, textTransform: "capitalize" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#2e7d32", textTransform: "uppercase", marginBottom: 2 }}>Rolldown Return</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1b5e20" }}>{data.yieldCurveAnalysis.rolldownReturn6m}</div>
                    </div>
                    <div style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: "#e0f2f1", border: "1px solid #80cbc4" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#00695c", textTransform: "uppercase", marginBottom: 2 }}>Carry Return</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#004d40" }}>{data.yieldCurveAnalysis.carryReturn}</div>
                    </div>
                  </div>
                  {data.yieldCurveAnalysis.interpretation && (
                    <div style={{ padding: 12, borderRadius: 8, background: "#fffde7", border: "1px solid #fff9c4", fontSize: "0.68rem", color: "#555" }}>
                      <strong style={{ color: "#f57f17" }}>Interpretation:</strong> {data.yieldCurveAnalysis.interpretation}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "central" && data.centralBankAnalysis && (
                <div style={{ padding: 16, borderRadius: 12, background: "linear-gradient(135deg, #f8f9ff, #f0f4ff)", border: "1px solid #e8eaf6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: "1rem" }}>{data.centralBankAnalysis.bank}</div>
                    <Badge text={data.centralBankAnalysis.stance?.replace(/_/g, " ")} variant={data.centralBankAnalysis.stance === "hawkish" ? "red" : data.centralBankAnalysis.stance === "dovish" ? "green" : "orange"} />
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#00897b", marginBottom: 8 }}>{data.centralBankAnalysis.currentRate?.toFixed(2)}%</div>
                  {[
                    { label: "Last Action", value: data.centralBankAnalysis.lastAction },
                    { label: "Forward Guidance", value: data.centralBankAnalysis.forwardGuidance },
                    { label: "Rate Path", value: data.centralBankAnalysis.ratePathExpected },
                    { label: "Liquidity", value: data.centralBankAnalysis.liquidityConditions },
                    { label: "QE/QT Status", value: data.centralBankAnalysis.qeQtStatus },
                  ].map(item => (
                    <div key={item.label} style={{ fontSize: "0.65rem", color: "#555", marginBottom: 4 }}>
                      <strong style={{ color: "#333" }}>{item.label}:</strong> {item.value}
                    </div>
                  ))}
                  <div style={{ fontSize: "0.6rem", color: "#00897b", fontWeight: 600, marginTop: 6 }}>Next Meeting: {data.centralBankAnalysis.nextMeeting}</div>
                </div>
              )}

              {activeTab === "macro" && data.macroAnalysis && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[
                      { label: "GDP Growth", value: data.macroAnalysis.gdpGrowth, icon: "📈" },
                      { label: "Inflation", value: data.macroAnalysis.inflation, icon: "🔥" },
                      { label: "Fiscal Deficit", value: data.macroAnalysis.fiscalDeficit, icon: "📋" },
                      { label: "Current Account", value: data.macroAnalysis.currentAccount, icon: "💱" },
                      { label: "FX Reserves", value: data.macroAnalysis.fxReserves, icon: "🏦" },
                      { label: "Debt/GDP", value: data.macroAnalysis.debtToGdp, icon: "📊" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "10px 12px", borderRadius: 8, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", marginBottom: 3 }}>{s.icon} {s.label}</div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1a237e" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#e0f2f1", border: "1px solid #80cbc4" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#00695c", marginBottom: 2 }}>Govt Borrowing</div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#004d40" }}>{data.macroAnalysis.governmentBorrowing}</div>
                    </div>
                    <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: data.macroAnalysis.bondSupplyOutlook === "heavy" ? "#ffebee" : "#e8f5e9", border: `1px solid ${data.macroAnalysis.bondSupplyOutlook === "heavy" ? "#ef9a9a" : "#a5d6a7"}` }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#666", marginBottom: 2 }}>Supply Outlook</div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "capitalize" }}>{data.macroAnalysis.bondSupplyOutlook}</div>
                    </div>
                  </div>
                  {data.macroAnalysis.macroVerdict && (
                    <div style={{ padding: 12, borderRadius: 8, background: "#fffde7", border: "1px solid #fff9c4", fontSize: "0.68rem", color: "#555" }}>
                      <strong style={{ color: "#f57f17" }}>Macro Verdict:</strong> {data.macroAnalysis.macroVerdict}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "views" && data.institutionalViews && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.institutionalViews.map((v: any, i: number) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#fff", border: "1px solid #eef0f2", borderLeft: `4px solid ${v.outlook === "bullish" ? "#00c853" : v.outlook === "bearish" ? "#ef5350" : "#ff9800"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{v.firm}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Badge text={v.outlook} variant={v.outlook === "bullish" ? "green" : v.outlook === "bearish" ? "red" : "orange"} />
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00897b" }}>{v.targetYield}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#666" }}>{v.theme}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "trades" && data.tradeIdeas && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.tradeIdeas.map((t: any, i: number) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${t.type === "carry" ? "#00897b" : t.type === "relative_value" ? "#7c3aed" : t.type === "curve" ? "#2962ff" : "#ff9800"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{t.name}</span>
                          <Badge text={t.type?.replace(/_/g, " ")} variant="blue" />
                          <Badge text={t.direction?.replace(/_/g, " ")} variant={t.direction === "buy" || t.direction === "receive_fixed" ? "green" : "red"} />
                        </div>
                        <span style={{ fontSize: "0.6rem", color: "#888" }}>{t.timeHorizon}</span>
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#555", marginBottom: 3 }}>{t.rationale}</div>
                      <div style={{ fontSize: "0.55rem", color: "#c62828" }}>Risk: {t.risk}</div>
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
              <button onClick={fetchIntel} style={{ background: "none", border: "none", cursor: "pointer", color: "#00897b", fontSize: "0.62rem", fontWeight: 700 }}>Refresh Intelligence</button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes bd-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */

type PageSection = "overview" | "intelligence" | "bondinfo" | "yieldcurve" | "drivers" | "risk" | "derivatives" | "quant" | "global" | "glossary" | "ai" | "data";

const PAGE_SECTIONS: { id: PageSection; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "intelligence", label: "AI Analysis", icon: "🤖" },
  { id: "bondinfo", label: "Bond Info", icon: "📋" },
  { id: "yieldcurve", label: "Yield Curve", icon: "📈" },
  { id: "drivers", label: "Macro Drivers", icon: "🌍" },
  { id: "risk", label: "Risk Analysis", icon: "⚠️" },
  { id: "derivatives", label: "Derivatives", icon: "🔄" },
  { id: "quant", label: "Quant Models", icon: "🧮" },
  { id: "global", label: "Global Markets", icon: "🌐" },
  { id: "glossary", label: "Glossary", icon: "📖" },
  { id: "ai", label: "AI Features", icon: "🔮" },
  { id: "data", label: "Data Sources", icon: "🗄️" },
];

export default function BondPage() {
  const params = useParams();
  const slug = typeof params.symbol === "string" ? params.symbol : Array.isArray(params.symbol) ? params.symbol[0] : "";
  const entry = useMemo(() => resolveBond(slug), [slug]);

  const [section, setSection] = useState<PageSection>("overview");
  const [glossaryCat, setGlossaryCat] = useState<string>("All");

  if (!entry) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafbfc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8 }}>Bond Not Found</h1>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 20 }}>Could not resolve &ldquo;{slug}&rdquo; to a known bond.</p>
          <Link href="/analyze" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#00897b", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const bondDetail = generateBondDetail(entry.symbol, entry.name, entry.issuer, entry.coupon, entry.tenure, entry.rating, entry.yieldApprox, entry.category);
  const yieldCurve = generateYieldCurve();
  const risks = generateBondRisks(entry.symbol, entry.rating);
  const drivers = generateBondDrivers(entry.symbol);
  const sparkData = generateBondSparkline(entry.symbol);
  const globalMarkets = getGlobalBondMarkets();

  const ratingColor = entry.rating === "Sovereign" ? "#00897b" : entry.rating === "AAA" ? "#2962ff" : entry.rating === "AA+" ? "#7c3aed" : "#ff9800";
  const riskScore = risks.reduce((s, r) => s + (r.severity === "Critical" ? 4 : r.severity === "High" ? 3 : r.severity === "Medium" ? 2 : 1) * (+r.probability / 100), 0);
  const normalizedRisk = Math.min(100, Math.round(riskScore * 8));

  const filteredGlossary = glossaryCat === "All" ? BOND_GLOSSARY : BOND_GLOSSARY.filter(t => t.category === glossaryCat);

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc" }}>
      {/* ═══ CINEMATIC HERO ═══ */}
      <div style={{
        background: "linear-gradient(135deg, #0a1f1a 0%, #0d2818 30%, #004d40 60%, #00695c 100%)",
        padding: "28px 40px 32px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,137,123,0.15) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/analyze" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.68rem", fontWeight: 600, marginBottom: 16, transition: "color 0.2s" }}>
            ← Back to White Tiger Dashboard
          </Link>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: -1 }}>{entry.name}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, fontSize: "0.55rem", fontWeight: 700, background: "rgba(0,200,83,0.15)", color: "#69f0ae" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#69f0ae", animation: "pulse-glow 2s infinite" }} />LIVE
                </span>
                <Badge text={entry.rating} variant="teal" />
                <Badge text={entry.category} variant="blue" />
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.6, marginBottom: 4 }}>{entry.issuer} · {entry.tenure} · {entry.type}</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.4 }}>{entry.symbol}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Spark data={sparkData} color="#69f0ae" w={220} h={50} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 20 }}>
            {[
              { label: "Yield (YTM)", value: `${bondDetail.ytm}%`, color: "#69f0ae" },
              { label: "Coupon", value: entry.coupon, color: "#ffd740" },
              { label: "Clean Price", value: `₹${bondDetail.cleanPrice}`, color: "#82b1ff" },
              { label: "Duration", value: `${bondDetail.duration}Y`, color: "#ff80ab" },
              { label: "Credit Rating", value: entry.rating, color: ratingColor === "#00897b" ? "#69f0ae" : "#82b1ff" },
              { label: "Liquidity", value: `${bondDetail.liquidityScore}/100`, color: +bondDetail.liquidityScore > 60 ? "#69f0ae" : "#ffd740" },
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
            padding: "8px 16px", borderRadius: 8, border: section === sec.id ? "1.5px solid #004d40" : "1px solid transparent",
            background: section === sec.id ? "linear-gradient(135deg, #004d40, #00695c)" : "transparent",
            color: section === sec.id ? "#fff" : "#666",
            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
            boxShadow: section === sec.id ? "0 2px 8px rgba(0,77,64,0.2)" : "none",
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
              {/* Yield Curve */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>📈 India Yield Curve</div>
                <YieldCurveChart data={yieldCurve} />
              </div>

              {/* Key Metrics Grid */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>📊 Key Fixed Income Metrics</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "YTM", value: `${bondDetail.ytm}%`, desc: "Yield to Maturity" },
                    { label: "YTW", value: `${bondDetail.ytw}%`, desc: "Yield to Worst" },
                    { label: "Current Yield", value: `${bondDetail.currentYield}%`, desc: "Coupon / Price" },
                    { label: "Mod Duration", value: `${bondDetail.modifiedDuration}`, desc: "Price sensitivity" },
                    { label: "Convexity", value: `${bondDetail.convexity}`, desc: "Duration curvature" },
                    { label: "DV01", value: `₹${bondDetail.dv01}`, desc: "per ₹100 face" },
                    { label: "Clean Price", value: `₹${bondDetail.cleanPrice}`, desc: "Ex-accrued" },
                    { label: "Dirty Price", value: `₹${bondDetail.dirtyPrice}`, desc: "Inc-accrued" },
                    { label: "Accrued Int", value: `₹${bondDetail.accruedInterest}`, desc: "Since last coupon" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "8px 10px", borderRadius: 8, background: "#f8fafb", border: "1px solid #e8eaf6" }}>
                      <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{m.label}</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#004d40" }}>{m.value}</div>
                      <div style={{ fontSize: "0.48rem", color: "#aaa" }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Credit Spread */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>🛡️ Credit & Spread Analysis</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Credit Spread", value: `${bondDetail.creditSpread} bps` },
                    { label: "OAS", value: `${bondDetail.oas} bps` },
                    { label: "Z-Spread", value: `${bondDetail.zSpread} bps` },
                    { label: "Benchmark Yield", value: `${bondDetail.benchmarkYield}%` },
                    { label: "Recovery Rate", value: `${bondDetail.recoveryRate}%` },
                    { label: "Bid-Ask", value: bondDetail.bidAskSpread },
                  ].map(m => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderBottom: "1px solid #f0f0f2" }}>
                      <span style={{ fontSize: "0.65rem", color: "#888" }}>{m.label}</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Risk Score */}
              <div style={{ background: "linear-gradient(135deg, #0a1f1a, #004d40)", borderRadius: 14, padding: 18, color: "#fff" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Risk Assessment</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <ScoreRing value={normalizedRisk} label="Risk Score" size={80} />
                </div>
                <div style={{ fontSize: "0.6rem", opacity: 0.5, textAlign: "center" }}>
                  {normalizedRisk > 60 ? "⚠️ Elevated" : normalizedRisk > 35 ? "Moderate" : "✅ Low"} risk
                </div>
              </div>

              {/* Bond Properties */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>🏷️ Bond Properties</div>
                {[
                  { label: "Type", value: bondDetail.bondType },
                  { label: "Face Value", value: `₹${bondDetail.faceValue}` },
                  { label: "Coupon Type", value: bondDetail.couponType },
                  { label: "Frequency", value: bondDetail.couponFrequency },
                  { label: "Seniority", value: bondDetail.seniority },
                  { label: "Callable", value: bondDetail.callable ? "Yes ✅" : "No" },
                  { label: "Putable", value: bondDetail.putable ? "Yes ✅" : "No" },
                  { label: "Maturity", value: bondDetail.maturityDate },
                ].map(p => (
                  <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontSize: "0.62rem", color: "#888" }}>{p.label}</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700 }}>{p.value}</span>
                  </div>
                ))}
              </div>

              {/* Trading Info */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>📊 Trading</div>
                {[
                  { label: "Volume", value: bondDetail.tradingVolume },
                  { label: "Bid-Ask", value: bondDetail.bidAskSpread },
                  { label: "Liquidity Score", value: `${bondDetail.liquidityScore}/100` },
                  { label: "Country", value: bondDetail.country },
                ].map(p => (
                  <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontSize: "0.62rem", color: "#888" }}>{p.label}</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700 }}>{p.value}</span>
                  </div>
                ))}
              </div>

              {/* Related Bonds */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>🔄 Related Bonds</div>
                {BONDS_LIST.filter(b => b.category === entry.category && b.symbol !== entry.symbol).slice(0, 5).map(b => (
                  <Link key={b.symbol} href={`/bonds/${b.symbol.toLowerCase()}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, textDecoration: "none", color: "inherit", marginBottom: 3, transition: "background 0.15s" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.65rem", color: "#00897b" }}>{b.name}</span>
                    <span style={{ fontSize: "0.55rem", color: "#888" }}>{b.yieldApprox}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI INTELLIGENCE */}
        {section === "intelligence" && <AIIntelligenceSection entry={entry} />}

        {/* BOND INFO */}
        {section === "bondinfo" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📋 {entry.name} — Complete Bond Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { title: "Identity", items: [{ l: "Symbol", v: bondDetail.symbol }, { l: "Issuer", v: bondDetail.issuer }, { l: "Country", v: bondDetail.country }, { l: "Type", v: bondDetail.bondType }, { l: "Seniority", v: bondDetail.seniority }] },
                { title: "Coupon & Maturity", items: [{ l: "Coupon Rate", v: `${bondDetail.couponRate}%` }, { l: "Coupon Type", v: bondDetail.couponType }, { l: "Frequency", v: bondDetail.couponFrequency }, { l: "Maturity", v: bondDetail.maturityDate }, { l: "Face Value", v: `₹${bondDetail.faceValue}` }] },
                { title: "Yield Metrics", items: [{ l: "Current Yield", v: `${bondDetail.currentYield}%` }, { l: "YTM", v: `${bondDetail.ytm}%` }, { l: "YTW", v: `${bondDetail.ytw}%` }, { l: "Benchmark", v: `${bondDetail.benchmarkYield}%` }] },
                { title: "Risk Measures", items: [{ l: "Duration", v: `${bondDetail.duration}` }, { l: "Mod Duration", v: `${bondDetail.modifiedDuration}` }, { l: "Convexity", v: `${bondDetail.convexity}` }, { l: "DV01", v: `₹${bondDetail.dv01}` }] },
                { title: "Pricing", items: [{ l: "Clean Price", v: `₹${bondDetail.cleanPrice}` }, { l: "Dirty Price", v: `₹${bondDetail.dirtyPrice}` }, { l: "Accrued Interest", v: `₹${bondDetail.accruedInterest}` }] },
                { title: "Credit & Spread", items: [{ l: "Rating", v: bondDetail.creditRating }, { l: "Credit Spread", v: `${bondDetail.creditSpread} bps` }, { l: "OAS", v: `${bondDetail.oas} bps` }, { l: "Z-Spread", v: `${bondDetail.zSpread} bps` }, { l: "Recovery", v: `${bondDetail.recoveryRate}%` }] },
              ].map(g => (
                <div key={g.title} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#004d40", marginBottom: 10, textTransform: "uppercase" }}>{g.title}</div>
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

        {/* YIELD CURVE */}
        {section === "yieldcurve" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📈 India Government Yield Curve</h2>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 20, marginBottom: 16 }}>
              <YieldCurveChart data={yieldCurve} />
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                <thead><tr style={{ background: "#f8f9ff" }}>{["Tenor", "Yield (%)", "1D Δ", "1W Δ", "1M Δ"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, color: "#004d40", fontSize: "0.58rem", textTransform: "uppercase", borderBottom: "2px solid #e0f2f1" }}>{h}</th>)}</tr></thead>
                <tbody>{yieldCurve.map((pt, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{pt.tenor}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#004d40" }}>{pt.yield.toFixed(2)}%</td>
                    <td style={{ padding: "8px 12px", color: pt.change1d >= 0 ? "#ef5350" : "#00c853", fontWeight: 600 }}>{pt.change1d >= 0 ? "+" : ""}{pt.change1d.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", color: pt.change1w >= 0 ? "#ef5350" : "#00c853", fontWeight: 600 }}>{pt.change1w >= 0 ? "+" : ""}{pt.change1w.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", color: pt.change1m >= 0 ? "#ef5350" : "#00c853", fontWeight: 600 }}>{pt.change1m >= 0 ? "+" : ""}{pt.change1m.toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* MACRO DRIVERS */}
        {section === "drivers" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🌍 Core Bond Market Drivers</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {drivers.map((d, i) => (
                <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${d.impact === "Bullish" ? "#00c853" : d.impact === "Bearish" ? "#ef5350" : "#ff9800"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{d.name}</span>
                      <Badge text={d.category} variant="teal" />
                      <Badge text={d.importance} variant={d.importance === "Critical" ? "red" : d.importance === "High" ? "orange" : "neutral"} />
                    </div>
                    <Badge text={d.impact} variant={d.impact === "Bullish" ? "green" : d.impact === "Bearish" ? "red" : "orange"} />
                  </div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#00897b", marginBottom: 3 }}>{d.currentState}</div>
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
                <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${r.severity === "Critical" ? "#c62828" : r.severity === "High" ? "#e65100" : r.severity === "Medium" ? "#ff9800" : "#00897b"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>{r.name}</span>
                      <Badge text={r.severity} variant={r.severity === "Critical" ? "red" : r.severity === "High" ? "orange" : r.severity === "Medium" ? "blue" : "green"} />
                    </div>
                    <span style={{ fontWeight: 800, color: +r.probability > 20 ? "#ef5350" : "#888" }}>{r.probability}%</span>
                  </div>
                  <Bar value={+r.probability} max={50} color={r.severity === "Critical" ? "#c62828" : "#ff9800"} h={3} />
                  <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 6 }}>{r.description}</div>
                  <div style={{ fontSize: "0.62rem", color: "#00897b", fontWeight: 600, marginTop: 3 }}>Impact: {r.impact}</div>
                  <div style={{ fontSize: "0.55rem", color: "#999", fontStyle: "italic", marginTop: 3 }}>{r.historicalEvent}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DERIVATIVES */}
        {section === "derivatives" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🔄 Fixed Income Derivatives & Hedging</h2>
            {BOND_DERIVATIVES.map((d, i) => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#004d40" }}>{d.name}</span>
                  <Badge text={d.type} variant="teal" />
                </div>
                <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: 6 }}>{d.description}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ padding: "6px 8px", borderRadius: 6, background: "#e0f2f1", fontSize: "0.6rem", color: "#444" }}>
                    <strong style={{ color: "#00897b" }}>Use Case:</strong> {d.institutionalUse}
                  </div>
                  <div style={{ padding: "6px 8px", borderRadius: 6, background: "#fff3e0", fontSize: "0.6rem", color: "#444" }}>
                    <strong style={{ color: "#e65100" }}>Risk:</strong> {d.riskProfile}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QUANT MODELS */}
        {section === "quant" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🧮 Fixed Income Quantitative Models</h2>
            {BOND_QUANT_MODELS.map((m, i) => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#004d40", marginBottom: 6 }}>{m.name}</div>
                <div style={{ padding: "6px 10px", borderRadius: 6, background: "#0a1f1a", color: "#69f0ae", fontFamily: "monospace", fontSize: "0.68rem", marginBottom: 8 }}>{m.formula}</div>
                <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: 6 }}>{m.interpretation}</div>
                <div style={{ fontSize: "0.6rem", color: "#00897b", fontWeight: 600, marginBottom: 6 }}>Institutional Use: {m.institutionalUse}</div>
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

        {/* GLOBAL MARKETS */}
        {section === "global" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🌐 Global Bond Markets</h2>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                <thead><tr style={{ background: "#e0f2f1" }}>{["Country", "Benchmark", "10Y Yield", "1D Δ", "1M Δ", "Debt/GDP", "Rating", "Policy Rate"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, color: "#004d40", fontSize: "0.58rem", textTransform: "uppercase", borderBottom: "2px solid #b2dfdb" }}>{h}</th>)}</tr></thead>
                <tbody>{globalMarkets.map((m, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0", background: m.country === "India" ? "#e0f2f1" : "transparent" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{m.flag} {m.country}</td>
                    <td style={{ padding: "10px 12px", color: "#666" }}>{m.benchmark}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 800, color: "#004d40" }}>{m.yield10y}%</td>
                    <td style={{ padding: "10px 12px", color: m.change1d >= 0 ? "#ef5350" : "#00c853", fontWeight: 600 }}>{m.change1d >= 0 ? "+" : ""}{m.change1d.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", color: m.change1m >= 0 ? "#ef5350" : "#00c853", fontWeight: 600 }}>{m.change1m >= 0 ? "+" : ""}{m.change1m.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.debtToGdp}%</td>
                    <td style={{ padding: "10px 12px" }}><Badge text={m.rating} variant={m.rating === "AAA" ? "green" : m.rating.startsWith("AA") ? "blue" : m.rating.startsWith("A") ? "teal" : "orange"} /></td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#00897b" }}>{m.policyRate}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* GLOSSARY */}
        {section === "glossary" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📖 Fixed Income Glossary</h2>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {BOND_GLOSSARY_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setGlossaryCat(cat)} style={{
                  padding: "5px 14px", borderRadius: 20, border: "1px solid",
                  borderColor: glossaryCat === cat ? "#00897b" : "#e0e0e0",
                  background: glossaryCat === cat ? "#00897b" : "#fff",
                  color: glossaryCat === cat ? "#fff" : "#666",
                  fontSize: "0.68rem", fontWeight: 600, cursor: "pointer",
                }}>{cat}</button>
              ))}
            </div>
            {filteredGlossary.map((t, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontWeight: 900, fontSize: "0.78rem", color: "#004d40" }}>{t.abbr}</span>
                  <span style={{ fontSize: "0.68rem", color: "#555" }}>— {t.term}</span>
                  <Badge text={t.category} variant="teal" />
                </div>
                <div style={{ fontSize: "0.62rem", color: "#333", marginBottom: 4 }}>{t.definition}</div>
                <div style={{ fontSize: "0.55rem", color: "#00897b", marginBottom: 2 }}><strong>Significance:</strong> {t.significance}</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: "0.52rem", color: "#ef5350" }}><strong>Yield:</strong> {t.yieldImpact}</span>
                  <span style={{ fontSize: "0.52rem", color: "#2962ff" }}><strong>Price:</strong> {t.priceImpact}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI FEATURES */}
        {section === "ai" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🔮 AI Fixed Income Capabilities</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {BOND_AI_FEATURES.map((f, i) => (
                <div key={i} style={{ padding: "18px 20px", borderRadius: 14, background: "linear-gradient(135deg, #0a1f1a, #004d40)", border: "1px solid rgba(105,240,174,0.15)", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "1.4rem" }}>{f.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>{f.name}</span>
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>{f.description}</div>
                  <div style={{ fontSize: "0.58rem", color: "#69f0ae", fontWeight: 600 }}>{f.capability}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DATA SOURCES */}
        {section === "data" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🗄️ Fixed Income Data Sources</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {BOND_DATA_SOURCES.map((d, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "#004d40" }}>{d.name}</span>
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
