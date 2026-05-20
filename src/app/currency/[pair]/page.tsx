"use client";
import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CURRENCY_LIST, type CurrencyEntry,
} from "@/lib/currencies";
import {
  CENTRAL_BANKS, CURRENCY_SYMBOLS,
  FX_DASHBOARD_SECTIONS, type FXIntelligenceData, type FXSectionId,
} from "@/lib/fx-intelligence";
import {
  generatePairInfo, generateCurrencyStrength, generateFXHeatmap,
  generateMacroDrivers, generateRiskAnalysis, generateEconCalendar, generateFXSparkline,
  FX_GLOSSARY, FX_GLOSSARY_CATEGORIES, FX_DERIVATIVES, HEDGING_STRATEGIES,
  QUANT_MODELS, AI_FEATURES, DATA_SOURCES,
  type CurrencyPairInfo, type CurrencyStrength, type MacroDriver,
  type RiskFactor, type StressScenario, type FXTerm,
  type EconEvent,
} from "@/lib/fx-data";

/* ═══════════════════════════════════════════════════════════════
   FULL-SCREEN CURRENCY PAIR INTELLIGENCE PAGE
   /currency/[pair] — Immersive Bloomberg-grade FX Terminal
   ═══════════════════════════════════════════════════════════════ */

/* ─── Resolve pair slug ─── */
function resolvePair(slug: string): CurrencyEntry | null {
  const decoded = decodeURIComponent(slug).toUpperCase().replace(/-/g, "");
  // Try exact symbol match (e.g., "usdinr" -> "USDINR")
  let entry = CURRENCY_LIST.find(c => c.symbol === decoded);
  if (entry) return entry;
  // Try pair match (e.g., "usd-inr" -> "USD/INR")
  const pairStr = decodeURIComponent(slug).toUpperCase().replace(/-/g, "/");
  entry = CURRENCY_LIST.find(c => c.pair === pairStr);
  if (entry) return entry;
  // Fuzzy match
  const fuzzy = decoded.replace(/[^A-Z]/g, "");
  entry = CURRENCY_LIST.find(c => c.symbol === fuzzy);
  if (entry) return entry;
  // Try name match
  const nameLower = decodeURIComponent(slug).toLowerCase().replace(/-/g, " ");
  entry = CURRENCY_LIST.find(c => c.name.toLowerCase().includes(nameLower));
  return entry || null;
}

/* ─── Utility Components ─── */

function Spark({ data, color = "#69f0ae", w = 200, h = 40 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`hfx-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#hfx-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bar({ value, max = 100, color = "#2962ff", h = 6 }: { value: number; max?: number; color?: string; h?: number }) {
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: "#e8eaf6", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%`, height: "100%", borderRadius: h, background: color, transition: "width 0.4s" }} />
    </div>
  );
}

function ScoreRing({ value, label, size = 72 }: { value: number; label: string; size?: number }) {
  const pct = Math.min(100, Math.abs(value));
  const color = value > 60 ? "#00c853" : value > 30 ? "#2962ff" : value > 0 ? "#ff9800" : "#ef5350";
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

function Badge({ text, variant = "neutral" }: { text: string; variant?: "green" | "red" | "orange" | "blue" | "neutral" | "purple" }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    green: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    red: { bg: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
    orange: { bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
    blue: { bg: "#e3f2fd", color: "#0d47a1", border: "#90caf9" },
    purple: { bg: "#f3e5f5", color: "#6a1b9a", border: "#ce93d8" },
    neutral: { bg: "#f5f5f5", color: "#616161", border: "#e0e0e0" },
  };
  const c = colors[variant];
  return (
    <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

/* ─── AI Intelligence Section (API-powered) ─── */
function AIIntelligenceSection({ entry }: { entry: CurrencyEntry }) {
  const [data, setData] = useState<FXIntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<FXSectionId>("overview");

  const quoteSymbol = CURRENCY_SYMBOLS[entry.quote] || "$";

  const fetchIntel = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/fx-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: entry.symbol, pair: entry.pair, name: entry.name, base: entry.base, quote: entry.quote, category: entry.category }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setData(await res.json() as FXIntelligenceData);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }, [entry]);

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? "#ff9800" : data ? "#00e676" : "#888", boxShadow: `0 0 6px ${loading ? "rgba(255,152,0,0.5)" : data ? "rgba(0,230,118,0.5)" : "transparent"}` }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase" }}>AI-Powered Institutional Intelligence</span>
        </div>
        <div style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: 4 }}>{entry.pair} Deep Analysis</div>
        <div style={{ fontSize: "0.68rem", opacity: 0.6 }}>
          13-dimensional analysis: technicals, central banks, quant models, correlations, sentiment, scenarios
        </div>
      </div>

      {/* Action */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
        {!data && !loading && (
          <button onClick={fetchIntel} style={{
            padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg, #2962ff, #1a237e)",
            color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
            boxShadow: "0 4px 16px rgba(41,98,255,0.3)", transition: "all 0.2s",
          }}>
            Generate Intelligence Report
          </button>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e8eaf6", borderTopColor: "#2962ff", borderRadius: "50%", margin: "0 auto 12px", animation: "fx-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>Generating Intelligence...</div>
            <div style={{ fontSize: "0.65rem", color: "#999", marginTop: 4 }}>Analyzing {entry.pair} across 13 institutional dimensions</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c62828", marginBottom: 8 }}>Failed: {error}</div>
            <button onClick={fetchIntel} style={{ padding: "8px 20px", borderRadius: 8, background: "#2962ff", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.72rem" }}>Retry</button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Tab navigation */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16 }}>
              {FX_DASHBOARD_SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => setActiveTab(sec.id)} style={{
                  padding: "6px 12px", borderRadius: 8, border: activeTab === sec.id ? "1.5px solid #2962ff" : "1px solid transparent",
                  background: activeTab === sec.id ? "#e8edff" : "transparent", color: activeTab === sec.id ? "#2962ff" : "#666",
                  fontSize: "0.62rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3,
                }}>
                  <span>{sec.icon}</span> {sec.label}
                </button>
              ))}
            </div>

            {/* Content — render based on tab */}
            <div style={{ minHeight: 300 }}>
              {activeTab === "overview" && data.overview && (
                <div>
                  <div style={{
                    background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
                    borderRadius: 14, padding: "20px 24px", marginBottom: 16, color: "#fff",
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: "2.2rem", fontWeight: 900 }}>{quoteSymbol}{data.overview.currentRate.toFixed(data.overview.currentRate > 100 ? 2 : 4)}</span>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: data.overview.intradayChangePct >= 0 ? "#69f0ae" : "#ff5252" }}>
                        {data.overview.intradayChangePct >= 0 ? "▲" : "▼"} {Math.abs(data.overview.intradayChange).toFixed(4)} ({data.overview.intradayChangePct >= 0 ? "+" : ""}{data.overview.intradayChangePct.toFixed(2)}%)
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: "0.68rem", opacity: 0.7 }}>
                      <span>Day: {data.overview.dailyLow.toFixed(4)} — {data.overview.dailyHigh.toFixed(4)}</span>
                      <span>52W: {data.overview.week52Low.toFixed(2)} — {data.overview.week52High.toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                    {[
                      { label: "1 Week", value: `${data.overview.weeklyPerf >= 0 ? "+" : ""}${data.overview.weeklyPerf.toFixed(2)}%`, color: data.overview.weeklyPerf >= 0 ? "#00c853" : "#ef5350" },
                      { label: "1 Month", value: `${data.overview.monthlyPerf >= 0 ? "+" : ""}${data.overview.monthlyPerf.toFixed(2)}%`, color: data.overview.monthlyPerf >= 0 ? "#00c853" : "#ef5350" },
                      { label: "YTD", value: `${data.overview.ytdPerf >= 0 ? "+" : ""}${data.overview.ytdPerf.toFixed(2)}%`, color: data.overview.ytdPerf >= 0 ? "#00c853" : "#ef5350" },
                      { label: "Spread", value: data.overview.bidAskSpread, color: "#1a237e" },
                    ].map(s => (
                      <div key={s.label} style={{ flex: "1 1 140px", padding: "10px 14px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Volatility */}
                  <div style={{ background: "#f8f9ff", borderRadius: 12, padding: 14, border: "1px solid #e8eaf6" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#555", marginBottom: 10, textTransform: "uppercase" }}>Volatility Surface</div>
                    <div style={{ display: "flex", gap: 14 }}>
                      {[
                        { label: "Realized 30D", val: data.overview.volatility.realized30d },
                        { label: "Implied 1M", val: data.overview.volatility.implied1m },
                        { label: "Implied 3M", val: data.overview.volatility.implied3m },
                      ].map(v => (
                        <div key={v.label} style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.55rem", color: "#999", marginBottom: 3 }}>{v.label}</div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 800, marginBottom: 3 }}>{v.val.toFixed(1)}%</div>
                          <Bar value={v.val} max={30} color={v.val > 15 ? "#c62828" : v.val > 10 ? "#e65100" : "#2962ff"} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "technicals" && data.technicals && (
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>Trend</div>
                      <Badge text={data.technicals.trend.replace(/_/g, " ")} variant={data.technicals.trend.includes("bullish") ? "green" : data.technicals.trend.includes("bearish") ? "red" : "orange"} />
                      <div style={{ fontSize: "0.62rem", color: "#666", marginTop: 6 }}>{data.technicals.momentum}</div>
                    </div>
                    <div style={{ flex: 1, padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>RSI (14)</div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: data.technicals.rsi > 70 ? "#c62828" : data.technicals.rsi < 30 ? "#2e7d32" : "#e65100" }}>{data.technicals.rsi.toFixed(1)}</div>
                      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: data.technicals.rsi > 70 ? "#c62828" : data.technicals.rsi < 30 ? "#2e7d32" : "#e65100" }}>
                        {data.technicals.rsi > 70 ? "OVERBOUGHT" : data.technicals.rsi < 30 ? "OVERSOLD" : "NEUTRAL"}
                      </div>
                    </div>
                  </div>
                  {/* Key Levels */}
                  <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#555", textTransform: "uppercase", marginBottom: 8 }}>Key Levels</div>
                    {data.technicals.keyLevels.map((lvl, i) => {
                      const c = lvl.type === "resistance" ? "#c62828" : lvl.type === "support" ? "#2e7d32" : "#2962ff";
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", background: "#fff", borderRadius: 6, border: `1px solid ${c}15`, marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                            <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>{lvl.label}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: c }}>{lvl.value.toFixed(4)}</span>
                            <span style={{ fontSize: "0.5rem", fontWeight: 600, color: "#999", textTransform: "uppercase" }}>{lvl.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "centralbanks" && data.centralBanks && (
                <div style={{ display: "grid", gridTemplateColumns: data.centralBanks.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
                  {data.centralBanks.map((cb, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 12, background: "linear-gradient(135deg, #f8f9ff, #f0f4ff)", border: "1px solid #e8eaf6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontWeight: 800, fontSize: "1rem" }}>{cb.bank}</div>
                        <Badge text={cb.stance} variant={cb.stance === "hawkish" ? "red" : cb.stance === "dovish" ? "green" : "orange"} />
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1a237e", marginBottom: 8 }}>{cb.currentRate.toFixed(2)}%</div>
                      <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: 4 }}><strong>Last:</strong> {cb.lastAction}</div>
                      <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: 4 }}><strong>Guidance:</strong> {cb.forwardGuidance}</div>
                      <div style={{ fontSize: "0.6rem", color: "#2962ff", fontWeight: 600 }}>Next: {cb.nextMeeting} | Path: {cb.ratePathExpected}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "forecast" && data.forecast && (
                <div>
                  {[
                    { label: "Short-Term (1D–1W)", ...data.forecast.shortTerm, color: "#2962ff" },
                    { label: "Medium-Term (1M–3M)", ...data.forecast.mediumTerm, color: "#7c4dff" },
                    { label: "Long-Term (6M–1Y)", ...data.forecast.longTerm, color: "#1a237e" },
                  ].map(f => (
                    <div key={f.label} style={{ padding: "12px 14px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", borderLeft: `4px solid ${f.color}`, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: f.color }}>{f.label}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>{f.range} ({f.confidence}%)</span>
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#555" }}>{f.outlook}</div>
                    </div>
                  ))}
                  {/* Scenarios */}
                  <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: 12, padding: 16, color: "#fff", marginTop: 12 }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 600, opacity: 0.6, textTransform: "uppercase", marginBottom: 12 }}>Scenario Analysis</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Bull", ...data.forecast.scenarios.bull, color: "#69f0ae" },
                        { label: "Base", ...data.forecast.scenarios.base, color: "#82b1ff" },
                        { label: "Bear", ...data.forecast.scenarios.bear, color: "#ff5252" },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.55rem", fontWeight: 600, color: s.color, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>{s.target}</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: s.color, marginTop: 2 }}>{s.probability}%</div>
                          <div style={{ fontSize: "0.52rem", opacity: 0.6, marginTop: 3 }}>{s.catalyst}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "sentiment" && data.sentiment && (
                <div>
                  <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 16 }}>
                    {[
                      { val: data.sentiment.overallScore, lbl: "Overall" },
                      { val: data.sentiment.institutionalConfidence, lbl: "Confidence" },
                      { val: data.sentiment.fearGreed, lbl: "Fear/Greed" },
                    ].map(g => (
                      <div key={g.lbl} style={{ textAlign: "center" }}>
                        <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto 4px" }}>
                          <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8eaf6" strokeWidth="2.5" />
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke={g.val >= 60 ? "#00c853" : g.val >= 40 ? "#ff9800" : "#ef5350"} strokeWidth="2.5" strokeDasharray={`${g.val * 0.97} 100`} strokeLinecap="round" />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", fontWeight: 800 }}>{g.val}</div>
                        </div>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{g.lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Risk Appetite", val: data.sentiment.riskAppetite },
                      { label: "Safe Haven", val: data.sentiment.safeHavenDemand },
                      { label: "Positioning", val: data.sentiment.speculativePositioning },
                    ].map(s => (
                      <div key={s.label} style={{ padding: 12, borderRadius: 8, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
                        <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                        <Badge text={s.val.replace(/_/g, " ")} variant={s.val.includes("on") || s.val.includes("long") || s.val === "low" ? "green" : s.val.includes("off") || s.val.includes("short") || s.val === "high" ? "red" : "orange"} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "insights" && data.insights && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.insights.map((ins, i) => {
                    const cfg = { warning: { icon: "⚠️", color: "#e65100", bg: "#fff3e0" }, opportunity: { icon: "💡", color: "#2e7d32", bg: "#e8f5e9" }, info: { icon: "📊", color: "#0d47a1", bg: "#e3f2fd" }, risk: { icon: "🔴", color: "#c62828", bg: "#ffebee" } }[ins.type] || { icon: "📊", color: "#0d47a1", bg: "#e3f2fd" };
                    return (
                      <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: cfg.bg, borderLeft: `4px solid ${cfg.color}`, display: "flex", gap: 8 }}>
                        <span>{cfg.icon}</span>
                        <div>
                          {ins.urgency === "high" && <span style={{ fontSize: "0.48rem", fontWeight: 800, color: "#fff", background: "#c62828", padding: "1px 4px", borderRadius: 3, marginRight: 4 }}>URGENT</span>}
                          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#333" }}>{ins.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Remaining tabs show placeholder to generate */}
              {activeTab === "events" && data.events && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.events.map((ev, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#fff", border: "1px solid #eef0f2", borderLeft: `4px solid ${ev.impact === "bullish" ? "#00c853" : ev.impact === "bearish" ? "#ef5350" : "#ff9800"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{ev.title}</span>
                        <span style={{ fontSize: "0.55rem", color: "#999" }}>{ev.date}</span>
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#666" }}>{ev.explanation}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "correlations" && data.correlations && (
                <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                  {data.correlations.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 80, fontSize: "0.68rem", fontWeight: 600, color: "#555", textAlign: "right" }}>{c.asset}</div>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f0f0f0", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "#ccc" }} />
                        <div style={{
                          position: "absolute", left: c.correlation >= 0 ? "50%" : `${50 - Math.abs(c.correlation) * 50}%`,
                          width: `${Math.abs(c.correlation) * 50}%`, height: "100%",
                          background: c.correlation > 0.3 ? "#00c853" : c.correlation < -0.3 ? "#ef5350" : "#ff9800",
                          borderRadius: 4,
                        }} />
                      </div>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: c.correlation > 0.3 ? "#00c853" : c.correlation < -0.3 ? "#ef5350" : "#ff9800", minWidth: 40, textAlign: "right" }}>{c.correlation.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "quant" && data.quantModels && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.quantModels.map((m, i) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{m.name}</span>
                          <Badge text={m.signal} variant={m.signal === "bullish" ? "green" : m.signal === "bearish" ? "red" : "orange"} />
                        </div>
                        <span style={{ fontWeight: 800, color: "#2962ff" }}>{m.value}</span>
                      </div>
                      <div style={{ marginBottom: 4 }}><Bar value={m.confidence} color="#2962ff" h={3} /></div>
                      <div style={{ fontSize: "0.6rem", color: "#666" }}>{m.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "bonds" && data.bonds && (
                <div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    {[
                      { label: "US 10Y", value: `${data.bonds.usTreasury10Y.toFixed(2)}%` },
                      { label: "Domestic 10Y", value: `${data.bonds.domesticBond10Y.toFixed(2)}%` },
                      { label: "Spread", value: `${data.bonds.yieldSpread > 0 ? "+" : ""}${data.bonds.yieldSpread.toFixed(0)} bps` },
                      { label: "Carry Score", value: `${data.bonds.carryTradeScore}/10` },
                    ].map(s => (
                      <div key={s.label} style={{ flex: "1 1 100px", padding: "10px 12px", borderRadius: 8, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                        <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1a237e" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#555", padding: 10, borderRadius: 8, background: "#fffde7", border: "1px solid #fff9c4" }}>
                    <strong style={{ color: "#f57f17" }}>Risk Premium:</strong> {data.bonds.riskPremium}
                  </div>
                </div>
              )}

              {activeTab === "trading" && data.trading && (
                <div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                    {[
                      { label: "Daily Volume", value: data.trading.dailyVolume },
                      { label: "Futures OI", value: data.trading.futuresOI },
                      { label: "Options OI", value: data.trading.optionsOI },
                    ].map(s => (
                      <div key={s.label} style={{ flex: "1 1 100px", padding: "10px 12px", borderRadius: 8, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
                        <div style={{ fontSize: "0.5rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1a237e" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 22, borderRadius: 11, overflow: "hidden", display: "flex" }}>
                    <div style={{ width: `${data.trading.retailVsInstitutional.institutional}%`, background: "linear-gradient(90deg, #1a237e, #283593)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.55rem", fontWeight: 700 }}>Inst. {data.trading.retailVsInstitutional.institutional}%</div>
                    <div style={{ width: `${data.trading.retailVsInstitutional.retail}%`, background: "#e8eaf6", display: "flex", alignItems: "center", justifyContent: "center", color: "#37474f", fontSize: "0.55rem", fontWeight: 700 }}>Retail {data.trading.retailVsInstitutional.retail}%</div>
                  </div>
                </div>
              )}

              {activeTab === "institutional" && data.institutionalViews && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.institutionalViews.map((v, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: "#fff", border: "1px solid #eef0f2", borderLeft: `4px solid ${v.outlook === "bullish" ? "#00c853" : v.outlook === "bearish" ? "#ef5350" : "#ff9800"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{v.firm}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Badge text={v.outlook} variant={v.outlook === "bullish" ? "green" : v.outlook === "bearish" ? "red" : "orange"} />
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#2962ff" }}>{v.target}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#666" }}>{v.theme}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button onClick={fetchIntel} style={{ background: "none", border: "none", cursor: "pointer", color: "#2962ff", fontSize: "0.62rem", fontWeight: 700 }}>Refresh Intelligence</button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes fx-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */

type PageSection = "overview" | "pairinfo" | "drivers" | "risk" | "derivatives" | "quant" | "calendar" | "glossary" | "ai" | "intelligence";

const PAGE_SECTIONS: { id: PageSection; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "intelligence", label: "AI Analysis", icon: "🤖" },
  { id: "pairinfo", label: "Pair Info", icon: "💱" },
  { id: "drivers", label: "Macro Drivers", icon: "📈" },
  { id: "risk", label: "Risk Analysis", icon: "⚠️" },
  { id: "derivatives", label: "Derivatives", icon: "📋" },
  { id: "quant", label: "Quant Models", icon: "🧮" },
  { id: "calendar", label: "Econ Calendar", icon: "📅" },
  { id: "glossary", label: "Glossary", icon: "📖" },
  { id: "ai", label: "AI Features", icon: "🔮" },
];

export default function CurrencyPairPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.pair === "string" ? params.pair : Array.isArray(params.pair) ? params.pair[0] : "";
  const entry = useMemo(() => resolvePair(slug), [slug]);

  const [section, setSection] = useState<PageSection>("overview");

  if (!entry) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafbfc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8 }}>Currency Pair Not Found</h1>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 20 }}>Could not resolve &ldquo;{slug}&rdquo; to a known currency pair.</p>
          <Link href="/analyze" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#2962ff", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const pairInfo = generatePairInfo(entry.pair, entry.base, entry.quote);
  const strength = generateCurrencyStrength();
  const sparkData = generateFXSparkline(entry.pair);
  const riskData = generateRiskAnalysis(entry.pair, entry.base, entry.quote);
  const drivers = generateMacroDrivers(entry.base, entry.quote);
  const calendar = generateEconCalendar(entry.base, entry.quote);
  const baseStrength = strength.find(s => s.currency === entry.base);
  const quoteStrength = strength.find(s => s.currency === entry.quote);
  const quoteSymbol = CURRENCY_SYMBOLS[entry.quote] || "$";
  const baseCB = CENTRAL_BANKS[entry.base];
  const quoteCB = CENTRAL_BANKS[entry.quote];

  return (
    <div style={{ minHeight: "100vh", background: "#fafbfc" }}>
      {/* ═══ CINEMATIC HERO ═══ */}
      <div style={{
        background: "linear-gradient(135deg, #0a0e27 0%, #0f1638 30%, #131d4f 60%, #1a237e 100%)",
        padding: "28px 40px 32px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        {/* Animated dot grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        {/* Gradient glow */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(41,98,255,0.15) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Back link */}
          <Link href="/analyze" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.68rem", fontWeight: 600, marginBottom: 16, transition: "color 0.2s" }}>
            ← Back to MoonLight Dashboard
          </Link>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: -1 }}>{entry.pair}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 12, fontSize: "0.55rem", fontWeight: 700, background: "rgba(0,200,83,0.15)", color: "#69f0ae" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#69f0ae", animation: "pulse-glow 2s infinite" }} />LIVE
                </span>
                <Badge text={entry.category} variant="blue" />
                <Badge text={pairInfo.pairType} variant="purple" />
              </div>
              <div style={{ fontSize: "0.82rem", opacity: 0.6, marginBottom: 4 }}>{entry.name}</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.4 }}>
                {baseCB ? `${baseCB.fullName}` : entry.base} × {quoteCB ? `${quoteCB.fullName}` : entry.quote}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Spark data={sparkData} color="#69f0ae" w={220} h={50} />
            </div>
          </div>

          {/* 6-metric grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 20 }}>
            {[
              { label: "Avg Daily Volume", value: pairInfo.avgDailyVolume, color: "#69f0ae" },
              { label: "30D Volatility", value: `${pairInfo.historicalVol30d}%`, color: "#ffd740" },
              { label: "Max Leverage", value: pairInfo.maxLeverage, color: "#ff80ab" },
              { label: "Pip Value", value: pairInfo.pipValue.split(" ")[0] + " " + pairInfo.pipValue.split(" ")[1], color: "#82b1ff" },
              { label: `${entry.base} Strength`, value: `${baseStrength?.score ?? 0}`, color: (baseStrength?.score ?? 0) > 0 ? "#69f0ae" : "#ff5252" },
              { label: `${entry.quote} Strength`, value: `${quoteStrength?.score ?? 0}`, color: (quoteStrength?.score ?? 0) > 0 ? "#69f0ae" : "#ff5252" },
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
            padding: "8px 16px", borderRadius: 8, border: section === sec.id ? "1.5px solid #1a237e" : "1px solid transparent",
            background: section === sec.id ? "linear-gradient(135deg, #1a237e, #283593)" : "transparent",
            color: section === sec.id ? "#fff" : "#666",
            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
            boxShadow: section === sec.id ? "0 2px 8px rgba(26,35,126,0.2)" : "none",
          }}>
            <span style={{ fontSize: "0.78rem" }}>{sec.icon}</span> {sec.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: "24px 40px 60px", maxWidth: 1200, margin: "0 auto" }}>

        {/* OVERVIEW */}
        {section === "overview" && (
          <div>
            {/* 2-column layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Trading Sessions */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>🕐 Trading Sessions</div>
                  {pairInfo.tradingSessions.map(s => (
                    <div key={s.session} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: s.liquidityLevel === "Peak" ? "rgba(0,200,83,0.04)" : "#fafbfc", border: "1px solid #f0f0f2", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.78rem" }}>{s.session}</div>
                        <div style={{ fontSize: "0.6rem", color: "#888" }}>{s.hours}</div>
                      </div>
                      <Badge text={s.liquidityLevel} variant={s.liquidityLevel === "Peak" || s.liquidityLevel === "Very High" ? "green" : s.liquidityLevel === "High" ? "blue" : "neutral"} />
                    </div>
                  ))}
                </div>

                {/* Cross-Asset Correlations */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>🔗 Cross-Asset Correlations</div>
                  {pairInfo.correlations.map(c => {
                    const absV = Math.abs(c.value);
                    const col = c.value > 0.3 ? "#00c853" : c.value < -0.3 ? "#ef5350" : "#ff9800";
                    return (
                      <div key={c.asset} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 70, fontSize: "0.72rem", fontWeight: 600, color: "#555", textAlign: "right" }}>{c.asset}</div>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f0f0f0", position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "#ccc" }} />
                          <div style={{ position: "absolute", left: c.value >= 0 ? "50%" : `${50 - absV * 50}%`, width: `${absV * 50}%`, height: "100%", background: col, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: col, minWidth: 40, textAlign: "right" }}>{c.value.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Contract Specs */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, marginBottom: 12 }}>📄 Contract Specifications</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Contract Size", value: pairInfo.contractSize.toLocaleString() + " units" },
                      { label: "Tick Size", value: pairInfo.tickSize.toString() },
                      { label: "Standard Lot", value: pairInfo.lotSizes.standard },
                      { label: "Mini Lot", value: pairInfo.lotSizes.mini },
                      { label: "Margin Req", value: pairInfo.marginReq },
                      { label: "Swap Long", value: `${pairInfo.swapLong > 0 ? "+" : ""}${pairInfo.swapLong} pips` },
                      { label: "Swap Short", value: `${pairInfo.swapShort > 0 ? "+" : ""}${pairInfo.swapShort} pips` },
                      { label: "Carry Direction", value: pairInfo.carryDirection },
                    ].map(p => (
                      <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f5f5f5" }}>
                        <span style={{ fontSize: "0.65rem", color: "#888" }}>{p.label}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Risk Score */}
                <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderRadius: 14, padding: 18, color: "#fff" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Risk Assessment</div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    <ScoreRing value={riskData.riskScore} label="Risk Score" size={80} />
                  </div>
                  <div style={{ fontSize: "0.6rem", opacity: 0.5, textAlign: "center" }}>
                    {riskData.riskScore > 60 ? "⚠️ Elevated" : riskData.riskScore > 35 ? "Moderate" : "✅ Low"} risk environment
                  </div>
                </div>

                {/* Upcoming Events */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>📅 Next Events</div>
                  {calendar.slice(0, 5).map((ev, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < 4 ? "1px solid #f0f0f0" : "none" }}>
                      <div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700 }}>{ev.event}</div>
                        <div style={{ fontSize: "0.52rem", color: "#888" }}>{ev.date} | {ev.country}</div>
                      </div>
                      <Badge text={ev.impact} variant={ev.impact === "High" ? "red" : ev.impact === "Medium" ? "orange" : "neutral"} />
                    </div>
                  ))}
                </div>

                {/* Pair Properties */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>🏷️ Pair Properties</div>
                  {[
                    { label: "Commodity Currency", value: pairInfo.isCommodityCurrency ? "Yes ✅" : "No" },
                    { label: "Reserve Currency", value: pairInfo.isReserveCurrency ? "Yes ✅" : "No" },
                    { label: "Safe Haven", value: pairInfo.isSafeHaven ? "Yes ✅" : "No" },
                    { label: "Pipette", value: pairInfo.pipette },
                  ].map(p => (
                    <div key={p.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ fontSize: "0.62rem", color: "#888" }}>{p.label}</span>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700 }}>{p.value}</span>
                    </div>
                  ))}
                </div>

                {/* Related Pairs */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, marginBottom: 10 }}>🔄 Related Pairs</div>
                  {CURRENCY_LIST.filter(c => (c.base === entry.base || c.quote === entry.quote || c.base === entry.quote || c.quote === entry.base) && c.symbol !== entry.symbol).slice(0, 6).map(c => (
                    <Link key={c.symbol} href={`/currency/${c.symbol.toLowerCase()}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, textDecoration: "none", color: "inherit", marginBottom: 3, transition: "background 0.15s" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.72rem", color: "#2962ff" }}>{c.pair}</span>
                      <span style={{ fontSize: "0.58rem", color: "#888" }}>{c.category}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI INTELLIGENCE (API-powered) */}
        {section === "intelligence" && <AIIntelligenceSection entry={entry} />}

        {/* PAIR INFO */}
        {section === "pairinfo" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>💱 {entry.pair} — Complete Pair Information</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { title: "Contract Specifications", items: [{ l: "Contract Size", v: pairInfo.contractSize.toLocaleString() + " units" }, { l: "Standard Lot", v: pairInfo.lotSizes.standard }, { l: "Mini Lot", v: pairInfo.lotSizes.mini }, { l: "Micro Lot", v: pairInfo.lotSizes.micro }] },
                { title: "Pricing", items: [{ l: "Tick Size", v: pairInfo.tickSize.toString() }, { l: "Pip Value", v: pairInfo.pipValue }, { l: "Pipette", v: pairInfo.pipette }] },
                { title: "Margin & Leverage", items: [{ l: "Margin", v: pairInfo.marginReq }, { l: "Leverage", v: pairInfo.maxLeverage }] },
                { title: "Swap & Carry", items: [{ l: "Swap Long", v: `${pairInfo.swapLong} pips/night` }, { l: "Swap Short", v: `${pairInfo.swapShort} pips/night` }, { l: "Carry", v: pairInfo.carryDirection }, { l: "Overnight", v: pairInfo.overnightFinancing }] },
              ].map(g => (
                <div key={g.title} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 16 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#1a237e", marginBottom: 10, textTransform: "uppercase" }}>{g.title}</div>
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

        {/* MACRO DRIVERS */}
        {section === "drivers" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📈 Core Drivers — {entry.pair}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {drivers.map((d, i) => (
                <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${d.impact === "Bullish" ? "#00c853" : d.impact === "Bearish" ? "#ef5350" : "#ff9800"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{d.name}</span>
                      <Badge text={d.category} variant="blue" />
                      <Badge text={d.importance} variant={d.importance === "Critical" ? "red" : d.importance === "High" ? "orange" : "neutral"} />
                    </div>
                    <Badge text={d.impact} variant={d.impact === "Bullish" ? "green" : d.impact === "Bearish" ? "red" : "orange"} />
                  </div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#2962ff", marginBottom: 3 }}>{d.currentState}</div>
                  <div style={{ fontSize: "0.62rem", color: "#666" }}>{d.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RISK */}
        {section === "risk" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>⚠️ Risk Analysis & Stress Testing</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {riskData.risks.map((r, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${r.severity === "Critical" ? "#c62828" : r.severity === "High" ? "#e65100" : "#ff9800"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>{r.name}</span>
                      <Badge text={r.severity} variant={r.severity === "Critical" ? "red" : r.severity === "High" ? "orange" : "blue"} />
                    </div>
                    <span style={{ fontWeight: 800, color: r.probability > 20 ? "#ef5350" : "#888" }}>{r.probability}%</span>
                  </div>
                  <Bar value={r.probability} max={50} color={r.severity === "Critical" ? "#c62828" : "#ff9800"} h={3} />
                  <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 6 }}>{r.description}</div>
                  <div style={{ fontSize: "0.58rem", color: "#999", fontStyle: "italic", marginTop: 3 }}>{r.historicalPrecedent}</div>
                </div>
              ))}
              <h3 style={{ fontSize: "0.85rem", fontWeight: 800, marginTop: 12 }}>Stress Scenarios</h3>
              {riskData.scenarios.map((s, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: s.type === "Tail" ? "linear-gradient(135deg, #1a1a2e, #2d1b4e)" : "#fff", border: "1px solid #e5e7eb", borderLeft: `4px solid ${s.type === "Bull" ? "#00c853" : s.type === "Bear" ? "#ef5350" : "#9c27b0"}`, color: s.type === "Tail" ? "#fff" : "inherit" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>{s.name}</span>
                    <span style={{ fontWeight: 800, color: s.type === "Bull" ? "#00c853" : s.type === "Bear" ? "#ef5350" : "#b388ff" }}>{s.impactPips} pips ({s.probability}%)</span>
                  </div>
                  <div style={{ fontSize: "0.65rem", color: s.type === "Tail" ? "rgba(255,255,255,0.7)" : "#666" }}>{s.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DERIVATIVES */}
        {section === "derivatives" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📋 FX Derivatives & Hedging</h2>
            {FX_DERIVATIVES.map((d, i) => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#1a237e" }}>{d.name}</span>
                  <Badge text={d.type} variant="blue" />
                </div>
                <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: 6 }}>{d.description}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ padding: "6px 8px", borderRadius: 6, background: "#f8f9ff", fontSize: "0.6rem", color: "#444" }}>
                    <strong style={{ color: "#2962ff" }}>Use Case:</strong> {d.institutionalUseCase}
                  </div>
                  <div style={{ padding: "6px 8px", borderRadius: 6, background: "#f8f9ff", fontSize: "0.6rem", color: "#444" }}>
                    <strong style={{ color: "#e65100" }}>Risk:</strong> {d.riskProfile}
                  </div>
                </div>
              </div>
            ))}
            <h3 style={{ fontSize: "0.85rem", fontWeight: 800, margin: "16px 0 12px" }}>Hedging Strategies</h3>
            {HEDGING_STRATEGIES.map((h, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800 }}>{h.name}</span>
                  <Badge text={`Cost: ${h.costIndicator}`} variant={h.costIndicator === "Low" ? "green" : h.costIndicator === "Medium" ? "orange" : "red"} />
                </div>
                <div style={{ fontSize: "0.62rem", color: "#2962ff", fontWeight: 600, marginBottom: 4 }}>{h.suitableFor}</div>
                <div style={{ fontSize: "0.62rem", color: "#555" }}>{h.mechanism}</div>
              </div>
            ))}
          </div>
        )}

        {/* QUANT MODELS */}
        {section === "quant" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🧮 Quantitative FX Models</h2>
            {QUANT_MODELS.map((m, i) => (
              <div key={i} style={{ padding: "16px 18px", borderRadius: 12, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#1a237e", marginBottom: 6 }}>{m.name}</div>
                <div style={{ padding: "6px 10px", borderRadius: 6, background: "#0a0e27", color: "#69f0ae", fontFamily: "monospace", fontSize: "0.68rem", marginBottom: 8 }}>{m.formula}</div>
                <div style={{ fontSize: "0.65rem", color: "#555", marginBottom: 6 }}>{m.interpretation}</div>
                <div style={{ fontSize: "0.6rem", color: "#2962ff", fontWeight: 600 }}>Use Case: {m.institutionalUseCase}</div>
              </div>
            ))}
          </div>
        )}

        {/* CALENDAR */}
        {section === "calendar" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📅 Economic Calendar</h2>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                <thead><tr style={{ background: "#f8f9ff" }}>{["Date", "Time", "Country", "Event", "Impact", "Previous", "Forecast", "Actual"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 800, color: "#1a237e", fontSize: "0.58rem", textTransform: "uppercase", borderBottom: "2px solid #e8eaf6" }}>{h}</th>)}</tr></thead>
                <tbody>{calendar.map((ev, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{ev.date}</td>
                    <td style={{ padding: "8px 12px", color: "#666" }}>{ev.time}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{ev.country}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{ev.event}</td>
                    <td style={{ padding: "8px 12px" }}><Badge text={ev.impact} variant={ev.impact === "High" ? "red" : ev.impact === "Medium" ? "orange" : "neutral"} /></td>
                    <td style={{ padding: "8px 12px", color: "#666" }}>{ev.previous}</td>
                    <td style={{ padding: "8px 12px", color: "#2962ff", fontWeight: 600 }}>{ev.forecast}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{ev.actual}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* GLOSSARY */}
        {section === "glossary" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>📖 FX Glossary</h2>
            {FX_GLOSSARY.map((t, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "#fff", border: "1px solid #e5e7eb", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontWeight: 900, fontSize: "0.78rem", color: "#1a237e" }}>{t.abbr}</span>
                  <span style={{ fontSize: "0.68rem", color: "#555" }}>— {t.term}</span>
                  <Badge text={t.category} variant="blue" />
                </div>
                <div style={{ fontSize: "0.62rem", color: "#333", marginBottom: 4 }}>{t.definition}</div>
                <div style={{ fontSize: "0.55rem", color: "#2962ff" }}><strong>Impact:</strong> {t.currencyImpact}</div>
              </div>
            ))}
          </div>
        )}

        {/* AI FEATURES */}
        {section === "ai" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 16 }}>🔮 AI Intelligence Capabilities</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {AI_FEATURES.map((f, i) => (
                <div key={i} style={{ padding: "18px 20px", borderRadius: 14, background: "linear-gradient(135deg, #0a0e27, #131740)", border: "1px solid rgba(105,240,174,0.15)", color: "#fff" }}>
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
