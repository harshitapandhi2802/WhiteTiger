"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  generateCurrencyStrength, generateFXHeatmap, generateMacroDrivers,
  generateRiskAnalysis, generateEconCalendar, generateFXSparkline,
  type CurrencyStrength, type HeatmapCell, type EconEvent,
} from "@/lib/fx-data";
import {
  generateForexCopilot, generateCentralBankIntel, generateForexStories,
  generateTechnicalAnalysis, generateTravelInsights, getConversionRate,
  getSessionStatus, MARKET_SESSIONS, FOREX_MARKET_IMPACTS, FOREX_NAV_SECTIONS,
  CONVERTER_CURRENCIES, type ForexSection, type ConversionRate,
} from "@/lib/forex-engine";

/* ═══════════════════════════════════════════════════════════════
   MOONLIGHT FOREX INTELLIGENCE PLATFORM v2.0
   AI Copilot · Converter · Central Banks · Story Feed · Technicals
   Market Clocks · Travel FX · Heatmap · Risk · Impact Engine
   ═══════════════════════════════════════════════════════════════ */

/* ─── Utility: Mini Sparkline SVG ─── */
function Spark({ data, color = "#2962ff", w = 100, h = 28 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const uid = `sfx-${color.replace("#", "")}-${w}`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Score Ring ─── */
function ScoreRing({ value, label, size = 68, max = 100 }: { value: number; label: string; size?: number; max?: number }) {
  const pct = (Math.abs(value) / max) * 100;
  const color = value > 30 ? "#00c853" : value > 0 ? "#2962ff" : value > -30 ? "#ff9800" : "#ef5350";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 4px" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8eaf6" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 800, color }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

/* ─── Badge ─── */
function Badge({ text, variant = "neutral" }: { text: string; variant?: "green" | "red" | "orange" | "blue" | "neutral" | "purple" }) {
  const colors: Record<string, { bg: string; color: string }> = {
    green: { bg: "#e8f5e9", color: "#1b5e20" }, red: { bg: "#ffebee", color: "#b71c1c" },
    orange: { bg: "#fff3e0", color: "#e65100" }, blue: { bg: "#e3f2fd", color: "#0d47a1" },
    purple: { bg: "#f3e5f5", color: "#6a1b9a" }, neutral: { bg: "#f5f5f5", color: "#616161" },
  };
  const c = colors[variant] || colors.neutral;
  return <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{text}</span>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PLATFORM COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function FXPlatform({ pair = "USD/INR", base = "USD", quote = "INR" }: { pair?: string; base?: string; quote?: string }) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ForexSection>("copilot");
  const [mode, setMode] = useState<"beginner" | "institutional">("beginner");

  // Converter state
  const [convFrom, setConvFrom] = useState("USD");
  const [convTo, setConvTo] = useState("INR");
  const [convAmount, setConvAmount] = useState(1000);

  // Travel currency
  const [travelCurrency, setTravelCurrency] = useState("USD");

  // Heatmap period
  const [heatPeriod, setHeatPeriod] = useState<"1d" | "1w" | "1m">("1d");

  // Memoized data
  const copilot = useMemo(() => generateForexCopilot(), []);
  const centralBanks = useMemo(() => generateCentralBankIntel(), []);
  const stories = useMemo(() => generateForexStories(), []);
  const strength = useMemo(() => generateCurrencyStrength(), []);
  const heatmap = useMemo(() => generateFXHeatmap(), []);
  const technicals = useMemo(() => generateTechnicalAnalysis(pair, base, quote), [pair, base, quote]);
  const calendar = useMemo(() => generateEconCalendar(base, quote), [base, quote]);
  const riskData = useMemo(() => generateRiskAnalysis(pair, base, quote), [pair, base, quote]);
  const macroDrivers = useMemo(() => generateMacroDrivers(base, quote), [base, quote]);
  const convRate = useMemo(() => getConversionRate(convFrom, convTo), [convFrom, convTo]);
  const travelData = useMemo(() => generateTravelInsights(travelCurrency), [travelCurrency]);
  const sparkData = useMemo(() => generateFXSparkline(pair), [pair]);

  const heatCurrencies = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 4px 28px rgba(0,0,0,0.06)" }}>

      {/* ═══ HERO HEADER ═══ */}
      <div style={{
        background: "linear-gradient(135deg, #0a0e27 0%, #131740 40%, #1a237e 100%)",
        padding: "24px 28px 16px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.5rem" }}>🌐</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900 }}>Forex Intelligence Terminal</h2>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: "0.55rem", fontWeight: 700, background: "rgba(0,200,83,0.12)", color: "#69f0ae" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#69f0ae", animation: "fx-pulse 2s infinite" }} />LIVE
                  </span>
                </div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  AI Macro Strategist · Central Bank Intelligence · Currency Analytics
                </div>
              </div>
            </div>
            <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
              {(["beginner", "institutional"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: "5px 14px", border: "none", cursor: "pointer", fontSize: "0.62rem", fontWeight: 700, textTransform: "capitalize",
                  background: mode === m ? "rgba(41,98,255,0.6)" : "rgba(255,255,255,0.04)",
                  color: mode === m ? "#fff" : "rgba(255,255,255,0.4)", transition: "all 0.2s",
                }}>{m === "beginner" ? "🎓" : "🏛️"} {m}</button>
              ))}
            </div>
          </div>

          {/* Copilot Quick Summary */}
          <div style={{ padding: "10px 16px", borderRadius: 10, background: `${copilot.moodColor}12`, border: `1px solid ${copilot.moodColor}25`, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 700, color: copilot.moodColor }}>
              {copilot.moodEmoji} {copilot.headline}
            </div>
          </div>

          {/* Session Clocks Row */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {MARKET_SESSIONS.map(session => {
              const status = getSessionStatus(session);
              return (
                <div key={session.city} style={{
                  minWidth: 100, padding: "8px 12px", borderRadius: 10,
                  background: status.isOpen ? "rgba(0,200,83,0.08)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${status.isOpen ? "rgba(0,200,83,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <span style={{ fontSize: "0.85rem" }}>{session.flag}</span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#fff" }}>{session.city}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: status.color, boxShadow: status.isOpen ? `0 0 6px ${status.color}` : "none" }} />
                    <span style={{ fontSize: "0.55rem", fontWeight: 600, color: status.color }}>{status.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ SECTION NAV ═══ */}
      <div style={{
        display: "flex", gap: 3, padding: "8px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)", overflowX: "auto",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {FOREX_NAV_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "7px 12px", borderRadius: 10, whiteSpace: "nowrap",
            border: activeSection === sec.id ? "1.5px solid #0d47a1" : "1px solid transparent",
            background: activeSection === sec.id ? "#e3f2fd" : "transparent",
            color: activeSection === sec.id ? "#0d47a1" : "var(--text-muted)",
            fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
          }}>
            <span style={{ fontSize: "0.78rem" }}>{sec.icon}</span> {sec.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: "24px 28px", minHeight: 450, background: "#fff" }}>

        {/* ═══ AI COPILOT ═══ */}
        {activeSection === "copilot" && (
          <div>
            <div style={{ borderRadius: 16, padding: "24px 28px", marginBottom: 20, background: "linear-gradient(135deg, #0a0e27, #1a237e)", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: "1.5rem" }}>🧠</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900 }}>AI Forex Copilot</h3>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)" }}>Macro strategist · FX analyst · Geopolitical engine</div>
                </div>
                <div style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 8, background: `${copilot.moodColor}20`, color: copilot.moodColor, fontSize: "0.68rem", fontWeight: 800 }}>
                  {copilot.moodEmoji} {copilot.marketMood}
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 16 }}>
                {copilot.summary}
              </div>

              {mode === "beginner" && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(41,98,255,0.1)", border: "1px solid rgba(41,98,255,0.2)", marginBottom: 16, fontSize: "0.78rem", color: "#82b1ff", lineHeight: 1.6 }}>
                  🎓 <strong>Beginner Summary:</strong> {copilot.beginnerSummary}
                </div>
              )}

              {/* Key Drivers */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#82b1ff", textTransform: "uppercase", marginBottom: 8 }}>📊 Key Market Drivers</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {copilot.keyDrivers.map((d, i) => {
                    const dirC = d.direction === "Bullish USD" ? "#00c853" : d.direction === "Bearish USD" ? "#ef5350" : "#ff9800";
                    return (
                      <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                          <span style={{ fontSize: "0.85rem" }}>{d.icon}</span>
                          <span style={{ fontWeight: 800, fontSize: "0.72rem" }}>{d.driver}</span>
                          <span style={{ marginLeft: "auto", fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: `${dirC}20`, color: dirC }}>{d.direction}</span>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{d.impact}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Central Bank Watch */}
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 14 }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ffd740", textTransform: "uppercase", marginBottom: 4 }}>🏛️ Central Bank Watch</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{copilot.centralBankWatch}</div>
              </div>

              {/* Trade Ideas */}
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#69f0ae", textTransform: "uppercase", marginBottom: 8 }}>💡 AI Trade Ideas</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {copilot.tradeIdeas.map((t, i) => (
                    <div key={i} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: t.direction === "Long" ? "rgba(0,200,83,0.08)" : "rgba(239,83,80,0.08)", border: `1px solid ${t.direction === "Long" ? "rgba(0,200,83,0.15)" : "rgba(239,83,80,0.15)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "#fff" }}>{t.pair}</span>
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "1px 8px", borderRadius: 6, background: t.direction === "Long" ? "#00c853" : "#ef5350", color: "#fff" }}>{t.direction}</span>
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{t.rationale}</div>
                      <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>Confidence: {t.confidence}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CURRENCY CONVERTER ═══ */}
        {activeSection === "converter" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>💱 AI-Powered Currency Converter</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>Real-time rates · Historical trends · AI explanations</p>

            {/* Converter Box */}
            <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #f8f9ff, #fff)", border: "1px solid var(--border)", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                {/* From */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>From</label>
                  <select value={convFrom} onChange={e => setConvFrom(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.85rem", fontWeight: 700, background: "#fff" }}>
                    {CONVERTER_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                  </select>
                </div>
                {/* Swap button */}
                <button onClick={() => { setConvFrom(convTo); setConvTo(convFrom); }} style={{ marginTop: 18, width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border)", background: "#fff", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>⇄</button>
                {/* To */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>To</label>
                  <select value={convTo} onChange={e => setConvTo(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: "0.85rem", fontWeight: 700, background: "#fff" }}>
                    {CONVERTER_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Amount & Result */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Amount</label>
                  <input type="number" min={0} value={convAmount || ""} onChange={e => setConvAmount(Number(e.target.value) || 0)} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", fontSize: "1.1rem", fontWeight: 800 }} />
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, paddingBottom: 8 }}>=</div>
                <div style={{ flex: 1, padding: "12px 18px", borderRadius: 12, background: "#0d47a1", color: "#fff" }}>
                  <div style={{ fontSize: "0.6rem", fontWeight: 600, opacity: 0.5, marginBottom: 2 }}>Converted Amount</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>
                    {CONVERTER_CURRENCIES.find(c => c.code === convTo)?.symbol}{(convAmount * convRate.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ padding: "18px 22px", borderRadius: 14, background: "#fff", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Exchange Rate</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0d47a1", marginBottom: 4 }}>1 {convFrom} = {convRate.rate < 1 ? convRate.rate.toFixed(6) : convRate.rate.toFixed(4)} {convTo}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>1 {convTo} = {convRate.inverse < 1 ? convRate.inverse.toFixed(6) : convRate.inverse.toFixed(4)} {convFrom}</div>
                <div style={{ marginTop: 10 }}><Spark data={convRate.sparkline} color={convRate.change1m >= 0 ? "#00c853" : "#ef5350"} w={280} h={50} /></div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {[{ label: "24h", val: convRate.change24h }, { label: "1W", val: convRate.change1w }, { label: "1M", val: convRate.change1m }].map(p => (
                    <span key={p.label} style={{ padding: "3px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: p.val >= 0 ? "#e8f5e9" : "#ffebee", color: p.val >= 0 ? "#00833a" : "#c62828" }}>
                      {p.label}: {p.val >= 0 ? "+" : ""}{p.val}%
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "18px 22px", borderRadius: 14, background: "rgba(41,98,255,0.03)", border: "1px solid rgba(41,98,255,0.08)" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#0d47a1", textTransform: "uppercase", marginBottom: 8 }}>🤖 AI: Why This Rate?</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{convRate.aiExplanation}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <div style={{ padding: "6px 10px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                    <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>52W High</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 800 }}>{convRate.high52w}</div>
                  </div>
                  <div style={{ padding: "6px 10px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                    <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>52W Low</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 800 }}>{convRate.low52w}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick conversions */}
            <h3 style={{ fontSize: "0.92rem", fontWeight: 800, margin: "0 0 10px" }}>⚡ Quick Conversions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {[100, 500, 1000, 5000, 10000, 50000].map(amt => (
                <div key={amt} style={{ padding: "10px 14px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{amt.toLocaleString()} {convFrom}</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0d47a1" }}>= {(amt * convRate.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })} {convTo}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CURRENCY STRENGTH ═══ */}
        {activeSection === "strength" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>💪 Global Currency Strength Matrix</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>Relative currency strength rankings across 15 global currencies</p>

            {mode === "beginner" && (
              <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.78rem", color: "#1a73e8", lineHeight: 1.6 }}>
                🎓 <strong>How to read:</strong> Green bars = strong currencies (money flowing in). Red bars = weak currencies (money flowing out). The strongest currency is at the top.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {strength.map((cur, i) => {
                const barColor = cur.score > 30 ? "#00c853" : cur.score > 0 ? "#2962ff" : cur.score > -30 ? "#ff9800" : "#ef5350";
                const trendColor = cur.trend.includes("Bull") ? "#00c853" : cur.trend.includes("Bear") ? "#ef5350" : "#ff9800";
                return (
                  <div key={cur.currency} style={{ padding: "10px 16px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, minWidth: 24, color: i < 3 ? "#00833a" : i >= strength.length - 3 ? "#c62828" : "var(--text-secondary)" }}>#{i + 1}</span>
                    <span style={{ fontWeight: 900, fontSize: "0.92rem", minWidth: 36 }}>{cur.currency}</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 10, background: "#e8eaf6", borderRadius: 5, overflow: "hidden", position: "relative" }}>
                        <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "#bbb" }} />
                        {cur.score >= 0 ? (
                          <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: `${Math.min(50, cur.score / 2)}%`, background: barColor, borderRadius: "0 5px 5px 0", transition: "width 0.6s" }} />
                        ) : (
                          <div style={{ position: "absolute", right: "50%", top: 0, height: "100%", width: `${Math.min(50, Math.abs(cur.score) / 2)}%`, background: barColor, borderRadius: "5px 0 0 5px", transition: "width 0.6s" }} />
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: barColor, minWidth: 36, textAlign: "right" }}>{cur.score > 0 ? "+" : ""}{cur.score}</span>
                    <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${trendColor}10`, color: trendColor, minWidth: 70, textAlign: "center" }}>{cur.trend}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[{ label: "1D", val: cur.momentum1d }, { label: "1W", val: cur.momentum1w }, { label: "1M", val: cur.momentum1m }].map(m => (
                        <span key={m.label} style={{ fontSize: "0.52rem", fontWeight: 700, padding: "1px 4px", borderRadius: 3, background: Number(m.val) >= 0 ? "#e8f5e9" : "#ffebee", color: Number(m.val) >= 0 ? "#00833a" : "#c62828" }}>
                          {m.label}: {Number(m.val) >= 0 ? "+" : ""}{m.val}%
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CENTRAL BANKS ═══ */}
        {activeSection === "macro" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>🏛️ Global Central Bank Intelligence</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>How central bank actions impact currencies globally</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {centralBanks.map((cb, i) => (
                <div key={i} style={{ borderRadius: 14, overflow: "hidden", border: `1px solid var(--border)`, borderLeft: `4px solid ${cb.stanceColor}` }}>
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.5rem" }}>{cb.flag}</span>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: "0.95rem" }}>{cb.name} ({cb.abbr})</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Currency: {cb.currency} · Next: {cb.nextMeeting}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0d47a1" }}>{cb.currentRate}</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{cb.rateChange}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                      <Badge text={cb.stance} variant={cb.stance === "Hawkish" ? "red" : cb.stance === "Dovish" ? "blue" : "orange"} />
                      <Badge text={`Inflation: ${cb.currentInflation}`} variant="neutral" />
                      <Badge text={`Target: ${cb.inflationTarget}`} variant="green" />
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>
                      {cb.aiAnalysis}
                    </div>

                    {mode === "beginner" && (
                      <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.75rem", color: "#1a73e8", lineHeight: 1.6 }}>
                        🎓 {cb.beginnerExplanation}
                      </div>
                    )}

                    <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(0,105,92,0.04)", fontSize: "0.72rem", color: "#00695c", lineHeight: 1.5 }}>
                      💱 <strong>Currency Impact:</strong> {cb.currencyImpact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STORY FEED ═══ */}
        {activeSection === "stories" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>📰 AI Forex Story Feed</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>Daily currency narratives · Macro stories · Institutional insights</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stories.map((story, i) => {
                const sentC = story.sentiment === "Bullish" ? "#00c853" : story.sentiment === "Bearish" ? "#c62828" : "#ff9800";
                const impC = story.impact === "High" ? "#c62828" : story.impact === "Medium" ? "#e65100" : "#2962ff";
                return (
                  <div key={i} style={{ padding: "18px 22px", borderRadius: 14, background: "#fff", border: "1px solid var(--border)", borderLeft: `4px solid ${sentC}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: "1.2rem" }}>{story.icon}</span>
                      <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${impC}10`, color: impC }}>{story.impact} Impact</span>
                      <Badge text={story.category} variant="purple" />
                      <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: "auto" }}>{story.timestamp}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.4, marginBottom: 8 }}>{story.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>{story.summary}</div>

                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "linear-gradient(135deg, rgba(41,98,255,0.04), rgba(124,58,237,0.04))", border: "1px solid rgba(41,98,255,0.08)", marginBottom: 8 }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", marginBottom: 4 }}>🤖 AI Institutional Insight</div>
                      <div style={{ fontSize: "0.75rem", color: "#1a73e8", lineHeight: 1.6 }}>{story.aiInsight}</div>
                    </div>

                    {mode === "beginner" && (
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,200,83,0.04)", border: "1px solid rgba(0,200,83,0.08)", fontSize: "0.72rem", color: "#00833a", lineHeight: 1.5 }}>
                        🎓 {story.beginnerTakeaway}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      {story.affectedPairs.map(p => (
                        <span key={p} onClick={() => { const slug = p.replace("/", "").toLowerCase(); router.push(`/currency/${slug}`); }} style={{ padding: "3px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700, background: "#e3f2fd", color: "#0d47a1", cursor: "pointer" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TECHNICALS ═══ */}
        {activeSection === "technicals" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>📊 Technical Analysis — {pair}</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>8 indicators · Support/Resistance · Trend strength</p>

            {/* Overall Signal */}
            <div style={{ padding: "20px 24px", borderRadius: 14, marginBottom: 20, background: `${technicals.overallColor}08`, border: `2px solid ${technicals.overallColor}25`, display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: technicals.overallColor }}>{technicals.overallSignal}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Overall Signal</div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <ScoreRing value={technicals.buyCount} label="Buy" size={58} max={8} />
                <ScoreRing value={technicals.neutralCount} label="Neutral" size={58} max={8} />
                <ScoreRing value={technicals.sellCount} label="Sell" size={58} max={8} />
              </div>
              <div style={{ flex: 1 }}><Spark data={sparkData} color={technicals.overallColor} w={200} h={50} /></div>
              <div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Trend Strength</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: technicals.trendStrength > 60 ? "#00c853" : "#ff9800" }}>{technicals.trendStrength}%</div>
              </div>
            </div>

            {/* Indicators */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {technicals.indicators.map((ind, i) => (
                <div key={i} style={{ padding: "12px 18px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.82rem" }}>{ind.abbr}</div>
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{ind.name}</div>
                  </div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, minWidth: 70 }}>{typeof ind.value === "number" && ind.value < 1 && ind.value > -1 ? ind.value.toFixed(5) : ind.value}</div>
                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 800, background: `${ind.signalColor}15`, color: ind.signalColor, minWidth: 50, textAlign: "center" }}>{ind.signal}</span>
                  <div style={{ flex: 1, fontSize: "0.72rem", color: "var(--text-secondary)" }}>{ind.description}</div>
                </div>
              ))}
            </div>

            {/* Support/Resistance */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(198,40,40,0.04)", border: "1px solid rgba(198,40,40,0.1)" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#c62828", textTransform: "uppercase", marginBottom: 6 }}>Resistance Levels</div>
                {technicals.resistanceLevels.map((r, i) => (
                  <div key={i} style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c62828", padding: "2px 0" }}>R{i + 1}: {r}</div>
                ))}
              </div>
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.1)", textAlign: "center" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#0d47a1", textTransform: "uppercase", marginBottom: 6 }}>Pivot Point</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0d47a1" }}>{technicals.pivotPoint}</div>
              </div>
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(0,200,83,0.04)", border: "1px solid rgba(0,200,83,0.1)" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#00833a", textTransform: "uppercase", marginBottom: 6 }}>Support Levels</div>
                {technicals.supportLevels.map((s, i) => (
                  <div key={i} style={{ fontSize: "0.82rem", fontWeight: 700, color: "#00833a", padding: "2px 0" }}>S{i + 1}: {s}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ECONOMIC CALENDAR ═══ */}
        {activeSection === "calendar" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>📅 Live Economic Calendar</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>Key events affecting {base}/{quote} with AI impact analysis</p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "#0d47a1", color: "#fff" }}>
                    {["Date", "Time", "Country", "Event", "Impact", "Previous", "Forecast", "Actual"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: h === "Event" ? "left" : "center", fontSize: "0.62rem", textTransform: "uppercase", fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calendar.map((ev, i) => {
                    const impC = ev.impact === "High" ? "#c62828" : ev.impact === "Medium" ? "#e65100" : "#2962ff";
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: ev.impact === "High" ? "rgba(198,40,40,0.02)" : "transparent" }}>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{ev.date}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>{ev.time}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{ev.country}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>{ev.event}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.6rem", fontWeight: 700, background: `${impC}10`, color: impC }}>{ev.impact}</span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>{ev.previous}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#0d47a1", fontWeight: 700 }}>{ev.forecast}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800 }}>{ev.actual}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {mode === "beginner" && (
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.78rem", color: "#1a73e8", lineHeight: 1.6 }}>
                🎓 <strong>How to read:</strong> &quot;High Impact&quot; events cause the biggest currency moves (50-200 pips). When the &quot;Actual&quot; number differs from &quot;Forecast&quot;, expect volatility. CPI, NFP, and central bank decisions are the most important events.
              </div>
            )}
          </div>
        )}

        {/* ═══ FX IMPACT ═══ */}
        {activeSection === "impact" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>🌐 Forex ↔ Global Market Impact Engine</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>How currencies affect stocks, commodities, trade, and your money</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {FOREX_MARKET_IMPACTS.map((impact, i) => (
                <div key={i} style={{ padding: "18px 22px", borderRadius: 14, background: "#fff", border: "1px solid var(--border)", borderTop: `3px solid ${impact.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "1.4rem" }}>{impact.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{impact.title}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700, background: `${impact.color}10`, color: impact.color }}>{impact.fxDirection}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700, background: "var(--bg-secondary)", color: "var(--text-muted)" }}>{impact.marketImpact}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{impact.mechanism}</div>
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-secondary)", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 8 }}>
                    📌 <strong>Example:</strong> {impact.example}
                  </div>
                  {mode === "beginner" && (
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.72rem", color: "#1a73e8", lineHeight: 1.5 }}>
                      🎓 {impact.beginnerExplanation}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {impact.affectedPairs.map(p => (
                      <span key={p} style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.55rem", fontWeight: 700, background: "#e3f2fd", color: "#0d47a1" }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TRAVEL FX ═══ */}
        {activeSection === "travel" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>✈️ Travel & Business FX Engine</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>Practical currency intelligence for travel, education, and business</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)" }}>Target Currency</label>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {["USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED", "JPY"].map(c => (
                  <button key={c} onClick={() => setTravelCurrency(c)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                    border: travelCurrency === c ? "1.5px solid #0d47a1" : "1px solid var(--border)",
                    background: travelCurrency === c ? "#e3f2fd" : "#fff",
                    color: travelCurrency === c ? "#0d47a1" : "var(--text-muted)",
                  }}>{CONVERTER_CURRENCIES.find(cc => cc.code === c)?.flag} {c}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {travelData.map((item, i) => (
                <div key={i} style={{ padding: "16px 20px", borderRadius: 12, background: "#fff", border: "1px solid var(--border)", borderLeft: "4px solid #0d47a1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "1.3rem" }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.82rem" }}>{item.category}</div>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{item.description}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>INR Cost</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800 }}>₹{item.amountINR.toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>→</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>{travelCurrency} Equivalent</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0d47a1" }}>{CONVERTER_CURRENCIES.find(c => c.code === travelCurrency)?.symbol}{item.amountForeign}</div>
                    </div>
                  </div>
                  <div style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(255,152,0,0.04)", border: "1px solid rgba(255,152,0,0.08)", fontSize: "0.68rem", color: "#e65100", lineHeight: 1.5 }}>
                    💡 {item.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MARKET CLOCKS ═══ */}
        {activeSection === "clocks" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>🕐 Live Global Market Sessions</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>Trading sessions, volatility windows, and active currency pairs</p>

            {mode === "beginner" && (
              <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.78rem", color: "#1a73e8", lineHeight: 1.6 }}>
                🎓 <strong>FX markets trade 24/5.</strong> Different sessions have different levels of activity. The London-New York overlap (1:00-5:00 PM UTC) is the most active period with the tightest spreads and highest volatility.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {MARKET_SESSIONS.map(session => {
                const status = getSessionStatus(session);
                return (
                  <div key={session.city} style={{
                    padding: "20px 24px", borderRadius: 14, border: "1px solid var(--border)",
                    borderTop: `3px solid ${session.color}`,
                    background: status.isOpen ? `${session.color}04` : "#fff",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.8rem" }}>{session.flag}</span>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: "1rem" }}>{session.city}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{session.timezone}</div>
                        </div>
                      </div>
                      <div style={{
                        padding: "4px 12px", borderRadius: 8,
                        background: status.isOpen ? "rgba(0,200,83,0.1)" : "rgba(117,117,117,0.06)",
                        border: `1px solid ${status.color}20`,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color, boxShadow: status.isOpen ? `0 0 8px ${status.color}` : "none", animation: status.isOpen ? "fx-pulse 2s infinite" : "none" }} />
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: status.color }}>{status.status}</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                        <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Local Hours</div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>{session.openHour}:00 – {session.closeHour}:00</div>
                      </div>
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                        <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Volatility</div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: session.peakVolatility.includes("High") ? "#c62828" : session.peakVolatility.includes("Medium") ? "#e65100" : "#2962ff" }}>{session.peakVolatility}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Active Pairs</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {session.activePairs.map(p => (
                          <span key={p} style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700, background: `${session.color}08`, color: session.color }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ HEATMAP ═══ */}
        {activeSection === "heatmap" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>🗺️ FX Cross-Rate Heatmap</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 12 }}>G8 currency pair performance at a glance</p>

            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {(["1d", "1w", "1m"] as const).map(p => (
                <button key={p} onClick={() => setHeatPeriod(p)} style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                  border: heatPeriod === p ? "1.5px solid #0d47a1" : "1px solid var(--border)",
                  background: heatPeriod === p ? "#e3f2fd" : "#fff",
                  color: heatPeriod === p ? "#0d47a1" : "var(--text-muted)",
                }}>{p === "1d" ? "1 Day" : p === "1w" ? "1 Week" : "1 Month"}</button>
              ))}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: "0.72rem" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px 12px", background: "#0d47a1", color: "#fff", fontWeight: 800, fontSize: "0.62rem" }}></th>
                    {heatCurrencies.map(c => <th key={c} style={{ padding: "8px 12px", background: "#0d47a1", color: "#fff", fontWeight: 800, fontSize: "0.68rem" }}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {heatCurrencies.map(row => (
                    <tr key={row}>
                      <td style={{ padding: "8px 12px", fontWeight: 800, background: "#f5f5f5", fontSize: "0.72rem" }}>{row}</td>
                      {heatCurrencies.map(col => {
                        if (row === col) return <td key={col} style={{ padding: "8px 12px", background: "#e8eaf6", textAlign: "center", fontSize: "0.6rem", color: "#888" }}>—</td>;
                        const cell = heatmap.find(h => h.base === row && h.quote === col);
                        const val = cell ? (heatPeriod === "1d" ? cell.change1d : heatPeriod === "1w" ? cell.change1w : cell.change1m) : 0;
                        const num = Number(val);
                        const intensity = Math.min(1, Math.abs(num) / (heatPeriod === "1m" ? 4 : 2));
                        const bg = num > 0 ? `rgba(0,200,83,${intensity * 0.4})` : num < 0 ? `rgba(239,83,80,${intensity * 0.4})` : "transparent";
                        const color = num > 0 ? "#00833a" : num < 0 ? "#c62828" : "#888";
                        return (
                          <td key={col} style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, background: bg, color, cursor: "pointer", transition: "all 0.2s" }}>
                            {num > 0 ? "+" : ""}{num}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {mode === "beginner" && (
              <div style={{ marginTop: 14, padding: "10px 16px", borderRadius: 10, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.78rem", color: "#1a73e8", lineHeight: 1.6 }}>
                🎓 <strong>How to read:</strong> Each cell shows how much the row currency gained/lost against the column currency. Green = row currency strengthened. Red = row currency weakened. Deeper color = bigger move.
              </div>
            )}
          </div>
        )}

        {/* ═══ RISK ═══ */}
        {activeSection === "risk" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>⚠️ Risk Analysis — {pair}</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>Risk factors, stress scenarios, and institutional risk assessment</p>

            <div style={{ padding: "18px 22px", borderRadius: 14, marginBottom: 20, background: "rgba(198,40,40,0.04)", border: "1px solid rgba(198,40,40,0.12)", display: "flex", alignItems: "center", gap: 20 }}>
              <ScoreRing value={riskData.riskScore} label="Risk Score" size={80} />
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 800 }}>Overall FX Risk Assessment</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {riskData.riskScore > 60 ? "Elevated risk — position sizing should be reduced" : riskData.riskScore > 40 ? "Moderate risk — normal position sizing appropriate" : "Low risk — favorable conditions for FX exposure"}
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <h3 style={{ fontSize: "0.92rem", fontWeight: 800, margin: "0 0 10px" }}>🔴 Risk Factors</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {riskData.risks.slice(0, 6).map((risk, i) => {
                const sevC = risk.severity === "Critical" ? "#c62828" : risk.severity === "High" ? "#e65100" : "#ff9800";
                return (
                  <div key={i} style={{ padding: "12px 18px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)", borderLeft: `4px solid ${sevC}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.82rem" }}>{risk.name}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Badge text={risk.severity} variant={risk.severity === "Critical" ? "red" : risk.severity === "High" ? "orange" : "blue"} />
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: sevC }}>{risk.probability}% probability</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{risk.description}</div>
                  </div>
                );
              })}
            </div>

            {/* Stress Scenarios */}
            <h3 style={{ fontSize: "0.92rem", fontWeight: 800, margin: "0 0 10px" }}>📉 Stress Test Scenarios</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
              {riskData.scenarios.map((sc, i) => {
                const typeC = sc.type === "Bull" ? "#00c853" : sc.type === "Bear" ? "#c62828" : "#7c3aed";
                return (
                  <div key={i} style={{ padding: "14px 18px", borderRadius: 12, background: `${typeC}04`, border: `1px solid ${typeC}15`, borderTop: `3px solid ${typeC}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.82rem", color: typeC }}>{sc.name}</div>
                      <Badge text={sc.type} variant={sc.type === "Bull" ? "green" : sc.type === "Bear" ? "red" : "purple"} />
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 6 }}>{sc.description}</div>
                    <div style={{ display: "flex", gap: 8, fontSize: "0.6rem" }}>
                      <span style={{ fontWeight: 700, color: typeC }}>Impact: {sc.impactPips} pips</span>
                      <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>Probability: {sc.probability}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{ padding: "10px 28px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0d47a1" }} />
          <span style={{ fontSize: "0.56rem", color: "#aaa", fontWeight: 600, letterSpacing: 0.5 }}>MOONLIGHT FOREX INTELLIGENCE TERMINAL · v2.0</span>
        </div>
        <span style={{ fontSize: "0.52rem", color: "#bbb" }}>Not financial advice. Rates are indicative. Consult a licensed advisor.</span>
      </div>

      <style>{`
        @keyframes fx-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
        }
      `}</style>
    </div>
  );
}
