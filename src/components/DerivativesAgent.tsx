"use client";
import { useState, useEffect, useCallback } from "react";
import type {
  RegimeSignals, PositionSignal, ProbabilitySet, MonteCarloResult,
  SmartMoneyAlert, QuantScores, CorrelationPair, SupportResistance,
  GEXData, VolatilityIntelligence, OptionsStrategy, CopilotNarrative,
  StressScenario,
} from "@/lib/quant-engine";

/* ════════════════════════════════════════════════════════════════
   DERIVATIVES AGENT DASHBOARD v2.0
   AI Copilot · GEX · Strategy Engine · Vol Intelligence · Stress Tests
   ════════════════════════════════════════════════════════════════ */

interface AgentData {
  symbol: string; spotPrice: number; spotChange: number; spotChangePct: number;
  timestamp: string; pcr: number; ivPercentile: number; atmIV: number;
  totalCallOI: number; totalPutOI: number;
  regime: RegimeSignals; positioning: PositionSignal; probabilities: ProbabilitySet;
  monteCarlo: MonteCarloResult; alerts: SmartMoneyAlert[];
  quantScores: QuantScores; correlations: CorrelationPair[];
  supportResistance: SupportResistance;
  // v2.0
  gex: GEXData;
  volatilityIntelligence: VolatilityIntelligence;
  strategies: OptionsStrategy[];
  copilot: CopilotNarrative;
  stressTests: StressScenario[];
}

/* ─── SECTION NAV ─── */
const SECTIONS = [
  { id: "copilot", label: "AI Copilot", icon: "🤖" },
  { id: "gex", label: "GEX Engine", icon: "⚡" },
  { id: "strategies", label: "Strategies", icon: "🎯" },
  { id: "smartmoney", label: "Smart Money", icon: "🐋" },
  { id: "probability", label: "Probabilities", icon: "🎲" },
  { id: "montecarlo", label: "Monte Carlo", icon: "📊" },
  { id: "volatility", label: "Vol Intel", icon: "🌊" },
  { id: "stress", label: "Stress Test", icon: "💥" },
  { id: "quant", label: "Quant Scores", icon: "📈" },
  { id: "support", label: "S&R Zones", icon: "🛡️" },
  { id: "correlation", label: "Correlations", icon: "🔗" },
  { id: "alerts", label: "Alert Feed", icon: "🚨" },
];

/* ─── Small reusable components ─── */
function GaugeArc({ value, max, color, size = 80, label }: { value: number; max: number; color: string; size?: number; label: string }) {
  const pct = Math.min(1, value / max);
  const angle = pct * 180;
  const rad = (angle - 90) * Math.PI / 180;
  const nx = size / 2 + Math.cos(rad) * (size * 0.35);
  const ny = size / 2 + Math.sin(rad) * (size * 0.35);
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox={`0 0 ${size} ${size * 0.65}`} style={{ width: size }}>
        <path d={`M ${size * 0.1} ${size * 0.55} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.9} ${size * 0.55}`}
          fill="none" stroke="#e5e7ed" strokeWidth={size * 0.08} strokeLinecap="round" />
        <path d={`M ${size * 0.1} ${size * 0.55} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.9} ${size * 0.55}`}
          fill="none" stroke={color} strokeWidth={size * 0.08} strokeLinecap="round"
          strokeDasharray={`${pct * size * 1.26} ${size * 1.26}`} />
        <line x1={size / 2} y1={size * 0.55} x2={nx} y2={ny} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <circle cx={size / 2} cy={size * 0.55} r={3} fill={color} />
        <text x={size / 2} y={size * 0.45} textAnchor="middle" fontSize={size * 0.18} fontWeight="900" fill="var(--text-primary)">{value}%</text>
      </svg>
      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", marginTop: -4 }}>{label}</div>
    </div>
  );
}

function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: "0.7rem", fontWeight: 800, color, fontFamily: "monospace" }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${(Math.abs(value) / max) * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)", padding: 18, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <h3 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px 0" }}>
      {icon} {title}
      {badge && <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: "0.6rem", fontWeight: 800, background: "#e8eeff", color: "#2962ff" }}>{badge}</span>}
    </h3>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export function DerivativesAgentDashboard() {
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("NIFTY");
  const [mode, setMode] = useState<"beginner" | "institutional">("institutional");
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  const [expandedStress, setExpandedStress] = useState<number | null>(null);

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/derivatives-agent?symbol=${symbol}`);
      if (res.ok) setData(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => {
    setLoading(true);
    fetchAgent();
    const iv = setInterval(fetchAgent, 10000);
    return () => clearInterval(iv);
  }, [fetchAgent]);

  if (loading && !data) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 16px", width: 24, height: 24 }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Initializing AI Derivatives Copilot...</p>
      </div>
    );
  }
  if (!data) return null;

  const d = data;
  const mc = d.monteCarlo;
  const vi = d.volatilityIntelligence;
  const gex = d.gex;
  const cop = d.copilot;

  const scrollTo = (id: string) => {
    document.getElementById(`deriv-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* ═══ AGENT HEADER ═══ */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px", background: "linear-gradient(135deg, #0a0e17, #1a1d29)",
        borderRadius: 14, marginBottom: 12, color: "#fff", flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #2962ff, #448aff)", fontSize: "1.4rem",
          }}>🤖</div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>AI Derivatives Copilot</h2>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>GEX Engine + Strategy AI + Vol Intelligence + Smart Money Tracker</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["NIFTY", "BANKNIFTY", "FINNIFTY"].map(s => (
              <button key={s} onClick={() => setSymbol(s)} style={{
                padding: "5px 12px", borderRadius: 6, border: "none",
                background: symbol === s ? "#2962ff" : "rgba(255,255,255,0.08)",
                color: symbol === s ? "#fff" : "#94a3b8",
                fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
              }}>{s}</button>
            ))}
          </div>
          <button onClick={() => setMode(m => m === "beginner" ? "institutional" : "beginner")} style={{
            padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)",
            background: mode === "beginner" ? "rgba(255,193,7,0.15)" : "transparent",
            color: mode === "beginner" ? "#ffc107" : "#94a3b8", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
          }}>
            {mode === "beginner" ? "Learn Mode" : "Pro Mode"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(0,200,83,0.15)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00c853", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#00c853" }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* ═══ SECTION NAV PILLS ═══ */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", padding: "8px 0 12px", marginBottom: 8,
        position: "sticky", top: 0, zIndex: 20, background: "var(--bg-primary)",
      }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)} style={{
            padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)",
            background: "#fff", color: "var(--text-secondary)",
            fontSize: "0.65rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* ═══ SPOT + REGIME + MOOD BAR ═══ */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 180px", padding: "14px 18px", background: "#fff", borderRadius: 10, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.symbol} Spot</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 900, fontFamily: "monospace" }}>{d.spotPrice.toLocaleString("en-IN")}</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: d.spotChangePct >= 0 ? "#00833a" : "#c62828" }}>
              {d.spotChangePct >= 0 ? "+" : ""}{d.spotChangePct}%
            </span>
          </div>
        </div>
        <div style={{ flex: "1 1 220px", padding: "14px 18px", background: "#fff", borderRadius: 10, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Market Regime</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: "1.1rem" }}>{d.regime.icon}</span>
            <span style={{ padding: "4px 12px", borderRadius: 6, fontWeight: 800, fontSize: "0.75rem", background: `${d.regime.color}15`, color: d.regime.color }}>
              {d.regime.regime.replace(/_/g, " ")}
            </span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: d.regime.color }}>{d.regime.confidence}%</span>
          </div>
          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
            {mode === "beginner" ? d.regime.beginnerDescription : d.regime.description}
          </p>
        </div>
        <div style={{ flex: "1 1 160px", padding: "14px 18px", background: "#fff", borderRadius: 10, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Market Mood</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: "1.8rem" }}>{cop.moodEmoji}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: cop.moodColor }}>{cop.marketMood}</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{d.positioning.label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KEY METRICS ROW ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: 16 }}>
        {[
          { label: "PCR", value: d.pcr.toFixed(2), color: d.pcr > 1 ? "#1b5e20" : "#c62828" },
          { label: "ATM IV", value: d.atmIV + "%", color: "#6366f1" },
          { label: "IV %ile", value: d.ivPercentile + "%", color: d.ivPercentile > 70 ? "#c62828" : "#1565c0" },
          { label: "GEX", value: (gex.totalGEX > 0 ? "+" : "") + gex.totalGEX + "M", color: gex.totalGEX > 0 ? "#1b5e20" : "#c62828" },
          { label: "Dealer", value: gex.dealerPositioning.replace(/_/g, " "), color: gex.dealerPositioning === "SHORT_GAMMA" ? "#c62828" : "#1b5e20" },
          { label: "Max Pain", value: d.supportResistance.maxPain.toLocaleString(), color: "#e65100" },
          { label: "Gamma Wall", value: gex.gammaWallStrike.toLocaleString(), color: "#6a1b9a" },
          { label: "Expected Move", value: "±" + mc.expectedMovePct + "%", color: "#00695c" },
          { label: "VaR 95%", value: mc.var95 + "%", color: "#c62828" },
          { label: "Squeeze Prob", value: gex.gammaSqueezeProbability + "%", color: "#ff6f00" },
        ].map(m => (
          <div key={m.label} style={{ padding: "8px 10px", background: "#fff", borderRadius: 10, border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 900, color: m.color, fontFamily: "monospace", marginTop: 2 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
         SECTION 1: AI COPILOT NARRATIVE
         ════════════════════════════════════════════════════════ */}
      <div id="deriv-copilot" style={{ marginBottom: 16 }}>
        <Card style={{
          background: "linear-gradient(135deg, #0a0e17 0%, #1a1d29 50%, #0d1117 100%)",
          border: "1px solid #2962ff30", color: "#fff",
        }}>
          <SectionTitle icon="🤖" title="AI Derivatives Copilot" badge="LIVE" />
          <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: 8, lineHeight: 1.4, color: "#e0e7ff" }}>
            {cop.headline}
          </div>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.7, marginBottom: 14 }}>
            {mode === "beginner" ? cop.beginnerStory : cop.summary}
          </p>

          {/* Action Items */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#60a5fa", marginBottom: 8, textTransform: "uppercase" }}>Action Items</div>
            {cop.actionItems.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.7rem", color: "#60a5fa", fontWeight: 800, minWidth: 18 }}>{i + 1}.</span>
                <span style={{ fontSize: "0.72rem", color: "#cbd5e1", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Risk Warning */}
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#ef4444" }}>RISK: </span>
            <span style={{ fontSize: "0.68rem", color: "#fca5a5", lineHeight: 1.5 }}>{cop.riskWarning}</span>
          </div>

          {mode === "institutional" && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(41,98,255,0.08)", border: "1px solid rgba(41,98,255,0.15)" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#60a5fa", marginBottom: 4 }}>INSTITUTIONAL BRIEF</div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "monospace", lineHeight: 1.6 }}>{cop.institutionalBrief}</div>
            </div>
          )}
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════
         SECTION 2: GEX ENGINE
         ════════════════════════════════════════════════════════ */}
      <div id="deriv-gex" style={{ marginBottom: 16 }}>
        <Card>
          <SectionTitle icon="⚡" title="Gamma Exposure (GEX) Engine" badge={gex.dealerPositioning.replace(/_/g, " ")} />

          {mode === "beginner" && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fffde7", border: "1px solid #fff9c4", marginBottom: 14 }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#f57f17", marginBottom: 4 }}>What is GEX?</div>
              <p style={{ fontSize: "0.7rem", color: "#5d4037", lineHeight: 1.6, margin: 0 }}>
                GEX (Gamma Exposure) measures how market makers need to hedge. Positive GEX = they sell rallies & buy dips (calm market). Negative GEX = they buy rallies & sell dips (volatile market). It&apos;s like knowing whether the market has shock absorbers ON or OFF.
              </p>
            </div>
          )}

          {/* Dealer Positioning Card */}
          <div style={{
            padding: "14px 18px", borderRadius: 10, marginBottom: 14,
            background: gex.dealerPositioning === "SHORT_GAMMA" ? "linear-gradient(135deg, #fce4ec, #ffebee)" : gex.dealerPositioning === "LONG_GAMMA" ? "linear-gradient(135deg, #e8f5e9, #f1f8e9)" : "linear-gradient(135deg, #eceff1, #f5f5f5)",
            border: `1px solid ${gex.dealerPositioning === "SHORT_GAMMA" ? "#ef9a9a" : gex.dealerPositioning === "LONG_GAMMA" ? "#a5d6a7" : "#bdbdbd"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: "0.85rem", color: gex.dealerPositioning === "SHORT_GAMMA" ? "#c62828" : "#1b5e20" }}>
                {gex.dealerPositioning === "SHORT_GAMMA" ? "Dealers SHORT Gamma" : gex.dealerPositioning === "LONG_GAMMA" ? "Dealers LONG Gamma" : "Dealers NEUTRAL Gamma"}
              </span>
              <span style={{ fontWeight: 900, fontSize: "1.1rem", fontFamily: "monospace", color: gex.totalGEX > 0 ? "#1b5e20" : "#c62828" }}>
                {gex.totalGEX > 0 ? "+" : ""}{gex.totalGEX}M
              </span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              {mode === "beginner" ? gex.beginnerExplanation : gex.dealerDescription}
            </p>
          </div>

          {/* GEX Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Gamma Wall", value: gex.gammaWallStrike.toLocaleString(), color: "#6a1b9a" },
              { label: "Flip Zone", value: gex.flipZone.toLocaleString(), color: "#1565c0" },
              { label: "Squeeze Prob", value: gex.gammaSqueezeProbability + "%", color: "#ff6f00" },
              { label: "Vol Crush Prob", value: gex.volCrushProbability + "%", color: "#00897b" },
            ].map(m => (
              <div key={m.label} style={{ padding: "8px 10px", background: "var(--bg-secondary)", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{m.label}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 900, color: m.color, fontFamily: "monospace" }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* GEX Bar Chart */}
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>GEX by Strike</div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {gex.gexByStrike.filter(r => Math.abs(r.gex) > 0.5).slice(0, 12).map(row => {
              const maxAbs = Math.max(...gex.gexByStrike.map(r => Math.abs(r.gex)), 1);
              const pct = Math.abs(row.gex) / maxAbs * 100;
              const isSpot = Math.abs(row.strike - d.spotPrice) < (d.spotPrice > 40000 ? 100 : 50);
              return (
                <div key={row.strike} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: isSpot ? 900 : 700, fontFamily: "monospace", width: 55, color: isSpot ? "#2962ff" : "var(--text-secondary)" }}>
                    {row.strike.toLocaleString()}
                  </span>
                  <div style={{ flex: 1, height: 12, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: row.gex >= 0 ? "50%" : `${50 - pct / 2}%`,
                      width: `${pct / 2}%`,
                      height: "100%", borderRadius: 3,
                      background: row.gex >= 0 ? "#22c55e" : "#ef4444",
                    }} />
                  </div>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, fontFamily: "monospace", width: 40, textAlign: "right", color: row.gex >= 0 ? "#1b5e20" : "#c62828" }}>
                    {row.gex > 0 ? "+" : ""}{row.gex}
                  </span>
                </div>
              );
            })}
          </div>

          {mode === "beginner" && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#e3f2fd", border: "1px solid #bbdefb" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#1565c0", marginBottom: 4 }}>Reading the GEX Chart</div>
              <p style={{ fontSize: "0.68rem", color: "#37474f", lineHeight: 1.6, margin: 0 }}>
                Green bars (positive GEX) = market makers act as shock absorbers at these strikes. Red bars (negative GEX) = market makers amplify moves near these strikes. The biggest bar is the &quot;gamma wall&quot; — the price level with the strongest magnetic pull.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════
         SECTION 3: AI OPTIONS STRATEGY ENGINE
         ════════════════════════════════════════════════════════ */}
      <div id="deriv-strategies" style={{ marginBottom: 16 }}>
        <Card>
          <SectionTitle icon="🎯" title="AI Options Strategy Engine" badge={`${d.strategies.length} strategies`} />

          {mode === "beginner" && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f3e5f5", border: "1px solid #e1bee7", marginBottom: 14 }}>
              <p style={{ fontSize: "0.7rem", color: "#4a148c", lineHeight: 1.6, margin: 0 }}>
                The AI analyzes current market conditions and recommends options strategies. Each strategy has different risk/reward profiles. Click any strategy to see the full breakdown with beginner-friendly explanations.
              </p>
            </div>
          )}

          {d.strategies.map((strat, i) => (
            <div key={i} style={{
              marginBottom: 10, borderRadius: 10,
              border: `1px solid ${strat.type === "BULLISH" ? "#a5d6a7" : strat.type === "BEARISH" ? "#ef9a9a" : strat.type === "VOLATILITY" ? "#ce93d8" : "#90caf9"}`,
              overflow: "hidden",
            }}>
              <div
                onClick={() => setExpandedStrategy(expandedStrategy === i ? null : i)}
                style={{
                  padding: "12px 16px", cursor: "pointer",
                  background: strat.type === "BULLISH" ? "#f1f8e9" : strat.type === "BEARISH" ? "#ffebee" : strat.type === "VOLATILITY" ? "#fce4ec" : "#e3f2fd",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.2rem" }}>{strat.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.82rem" }}>{strat.name}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{strat.idealFor.split('.')[0]}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 800,
                    background: strat.type === "BULLISH" ? "#1b5e2018" : strat.type === "BEARISH" ? "#c6282818" : "#6a1b9a18",
                    color: strat.type === "BULLISH" ? "#1b5e20" : strat.type === "BEARISH" ? "#c62828" : "#6a1b9a",
                  }}>{strat.type}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2962ff" }}>{strat.confidence}%</div>
                    <div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>confidence</div>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{expandedStrategy === i ? "▲" : "▼"}</span>
                </div>
              </div>

              {expandedStrategy === i && (
                <div style={{ padding: "14px 16px", background: "#fff" }}>
                  {/* Legs */}
                  <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Strategy Legs</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {strat.legs.map((leg, li) => (
                      <div key={li} style={{
                        padding: "6px 12px", borderRadius: 6,
                        background: leg.action === "BUY" ? "#e8f5e9" : "#ffebee",
                        border: `1px solid ${leg.action === "BUY" ? "#a5d6a7" : "#ef9a9a"}`,
                        fontSize: "0.68rem", fontWeight: 700,
                      }}>
                        <span style={{ color: leg.action === "BUY" ? "#1b5e20" : "#c62828", fontWeight: 800 }}>{leg.action}</span>
                        {" "}{leg.type} {leg.strike} @ {leg.premium}
                      </div>
                    ))}
                  </div>

                  {/* Risk/Reward Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div style={{ padding: "8px 10px", background: "#e8faf0", borderRadius: 6 }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#1b5e20", textTransform: "uppercase" }}>Max Profit</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1b5e20" }}>{strat.maxProfit}</div>
                    </div>
                    <div style={{ padding: "8px 10px", background: "#ffebed", borderRadius: 6 }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#c62828", textTransform: "uppercase" }}>Max Loss</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#c62828" }}>{strat.maxLoss}</div>
                    </div>
                    <div style={{ padding: "8px 10px", background: "#e3f2fd", borderRadius: 6 }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#1565c0", textTransform: "uppercase" }}>Breakeven</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1565c0" }}>{strat.breakeven}</div>
                    </div>
                    <div style={{ padding: "8px 10px", background: "#f3e5f5", borderRadius: 6 }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#6a1b9a", textTransform: "uppercase" }}>Win Probability</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6a1b9a" }}>{strat.winProbability}%</div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>
                      {mode === "beginner" ? "How This Works (Simple)" : "Strategy Notes"}
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                      {mode === "beginner" ? strat.beginnerExplanation : strat.idealFor}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════
         SECTION 4: SMART MONEY TRACKER
         ════════════════════════════════════════════════════════ */}
      <div id="deriv-smartmoney" style={{ marginBottom: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionTitle icon="🐋" title="Smart Money Tracker" badge={`${d.alerts.length} signals`} />
          </div>
          {d.alerts.map(a => {
            const severityColors: Record<string, string> = { critical: "#b71c1c", high: "#e65100", medium: "#1565c0", low: "#546e7a" };
            return (
              <div key={a.id} style={{
                padding: "12px 14px", borderRadius: 10, marginBottom: 8,
                border: `1px solid ${severityColors[a.severity]}30`,
                borderLeft: `4px solid ${a.color}`, background: `${a.color}06`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "var(--text-primary)" }}>{a.title}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {a.estimatedValue && (
                      <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: "0.55rem", fontWeight: 700, background: "#e3f2fd", color: "#1565c0" }}>{a.estimatedValue}</span>
                    )}
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 800,
                      background: `${severityColors[a.severity]}18`, color: severityColors[a.severity],
                      textTransform: "uppercase",
                    }}>{a.severity}</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  {mode === "beginner" ? a.beginnerExplanation : a.institutionalExplanation}
                </p>
              </div>
            );
          })}
        </Card>
      </div>

      {/* ═══ TWO-COLUMN GRID ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* SECTION 5: PROBABILITY ENGINE */}
        <div id="deriv-probability">
          <Card>
            <SectionTitle icon="🎲" title="AI Probability Engine" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <GaugeArc value={d.probabilities.bullish} max={100} color="#1b5e20" label="Bullish" />
              <GaugeArc value={d.probabilities.bearish} max={100} color="#c62828" label="Bearish" />
              <GaugeArc value={d.probabilities.volatilityBreakout} max={100} color="#e65100" label="Vol Breakout" />
              <GaugeArc value={d.probabilities.gammaSqueeze} max={100} color="#ff6f00" label="Gamma Squeeze" />
              <GaugeArc value={d.probabilities.crash} max={100} color="#b71c1c" label="Crash Risk" />
              <GaugeArc value={d.probabilities.trendContinuation} max={100} color="#1565c0" label="Trend Cont." />
            </div>
            {mode === "beginner" && (
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#fffde7", fontSize: "0.65rem", color: "#5d4037", lineHeight: 1.5 }}>
                These gauges show the AI&apos;s estimate of different scenarios happening. Higher % = more likely. Think of it as a weather forecast for the market — it&apos;s not certain, but it helps you prepare.
              </div>
            )}
          </Card>
        </div>

        {/* SECTION 6: MONTE CARLO */}
        <div id="deriv-montecarlo">
          <Card>
            <SectionTitle icon="📊" title="Monte Carlo + VaR" badge="200 sims" />
            <div style={{ marginBottom: 14 }}>
              <svg viewBox="0 0 400 100" style={{ width: "100%", height: 80 }}>
                {mc.distribution.map((p, i) => {
                  const min = mc.worstCase.price * 0.998;
                  const max = mc.bestCase.price * 1.002;
                  const range = max - min;
                  const x = ((p - min) / range) * 380 + 10;
                  const center = ((d.spotPrice - min) / range) * 380 + 10;
                  const dist = Math.abs(x - center);
                  const h = Math.max(5, 80 * Math.exp(-dist * dist / (range * range * 0.3)));
                  return <rect key={i} x={x - 3} y={80 - h} width={6} height={h} rx={2} fill={p < d.spotPrice ? "#ef444480" : "#22c55e80"} />;
                })}
                <line x1={((d.spotPrice - mc.worstCase.price * 0.998) / ((mc.bestCase.price * 1.002) - mc.worstCase.price * 0.998)) * 380 + 10}
                  y1="0" x2={((d.spotPrice - mc.worstCase.price * 0.998) / ((mc.bestCase.price * 1.002) - mc.worstCase.price * 0.998)) * 380 + 10}
                  y2="85" stroke="#2962ff" strokeWidth="2" strokeDasharray="4,2" />
              </svg>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Best", ...mc.bestCase, color: "#1b5e20", bg: "#e8faf0" },
                { label: "Base", ...mc.baseCase, color: "#1565c0", bg: "#e8eeff" },
                { label: "Worst", ...mc.worstCase, color: "#c62828", bg: "#ffebed" },
              ].map(s => (
                <div key={s.label} style={{ padding: "8px", borderRadius: 8, background: s.bg, textAlign: "center" }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, color: s.color, textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{s.price.toLocaleString()}</div>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, color: s.color }}>{s.returnPct >= 0 ? "+" : ""}{s.returnPct}%</div>
                </div>
              ))}
            </div>
            {/* VaR Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <div style={{ padding: "6px 8px", borderRadius: 6, background: "#fff3e0", textAlign: "center" }}>
                <div style={{ fontSize: "0.52rem", fontWeight: 700, color: "#e65100", textTransform: "uppercase" }}>VaR 95%</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#e65100", fontFamily: "monospace" }}>{mc.var95}%</div>
              </div>
              <div style={{ padding: "6px 8px", borderRadius: 6, background: "#fce4ec", textAlign: "center" }}>
                <div style={{ fontSize: "0.52rem", fontWeight: 700, color: "#c62828", textTransform: "uppercase" }}>VaR 99%</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#c62828", fontFamily: "monospace" }}>{mc.var99}%</div>
              </div>
              <div style={{ padding: "6px 8px", borderRadius: 6, background: "#fbe9e7", textAlign: "center" }}>
                <div style={{ fontSize: "0.52rem", fontWeight: 700, color: "#bf360c", textTransform: "uppercase" }}>CVaR</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#bf360c", fontFamily: "monospace" }}>{mc.cvar}%</div>
              </div>
            </div>
            {mode === "beginner" && (
              <div style={{ marginTop: 8, fontSize: "0.63rem", color: "var(--text-muted)", lineHeight: 1.5, padding: "6px 8px", background: "#fffde7", borderRadius: 6 }}>
                VaR = &quot;Value at Risk&quot; — the worst expected loss in 95% of scenarios. CVaR = the average loss in the worst 5% of scenarios. Think of VaR as &quot;how bad could it get normally&quot; and CVaR as &quot;how bad in a crisis.&quot;
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
         SECTION 7: VOLATILITY INTELLIGENCE
         ════════════════════════════════════════════════════════ */}
      <div id="deriv-volatility" style={{ marginBottom: 16 }}>
        <Card>
          <SectionTitle icon="🌊" title="Volatility Intelligence System" badge={vi.ivRegimeLabel} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Current IV", value: vi.currentIV + "%", color: vi.ivRegimeColor },
              { label: "Historical IV", value: vi.historicalIV + "%", color: "#546e7a" },
              { label: "IV Premium", value: (vi.ivPremium > 0 ? "+" : "") + vi.ivPremium + "%", color: vi.ivPremium > 0 ? "#c62828" : "#1b5e20" },
              { label: "Skew Index", value: vi.skewIndex.toString(), color: vi.skewIndex > 1.1 ? "#c62828" : "#1b5e20" },
            ].map(m => (
              <div key={m.label} style={{ padding: "8px 10px", background: "var(--bg-secondary)", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{m.label}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 900, color: m.color, fontFamily: "monospace" }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* IV Regime Bar */}
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 14,
            background: `${vi.ivRegimeColor}10`, border: `1px solid ${vi.ivRegimeColor}30`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: "0.78rem", color: vi.ivRegimeColor }}>{vi.ivRegimeLabel}</span>
              <span style={{ fontWeight: 700, fontSize: "0.7rem", color: "var(--text-muted)" }}>IV Rank: {vi.ivRank}%</span>
            </div>
            <div style={{ height: 8, background: "#e5e7ed", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
              <div style={{
                width: `${vi.ivPercentile}%`, height: "100%", borderRadius: 4,
                background: `linear-gradient(90deg, #1565c0, ${vi.ivRegimeColor})`,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.55rem", color: "var(--text-muted)" }}>
              <span>Low Vol</span><span>Normal</span><span>High Vol</span><span>Extreme</span>
            </div>
          </div>

          {/* Skew + Term Structure */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg-secondary)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Skew Analysis</div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{vi.skewInterpretation}</p>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg-secondary)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Term Structure</span>
                <span style={{
                  padding: "1px 6px", borderRadius: 4, fontSize: "0.55rem", fontWeight: 800,
                  background: vi.termStructure === "BACKWARDATION" ? "#ffebed" : "#e8f5e9",
                  color: vi.termStructure === "BACKWARDATION" ? "#c62828" : "#1b5e20",
                }}>{vi.termStructure}</span>
              </div>
              <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{vi.termStructureDescription}</p>
            </div>
          </div>

          {/* Expected Move */}
          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Expected Move</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Daily", value: "±" + vi.expectedMove.daily, color: "#1565c0" },
              { label: "Weekly", value: "±" + vi.expectedMove.weekly, color: "#6a1b9a" },
              { label: "Monthly", value: "±" + vi.expectedMove.monthly, color: "#c62828" },
            ].map(m => (
              <div key={m.label} style={{ padding: "10px", borderRadius: 8, background: `${m.color}08`, border: `1px solid ${m.color}20`, textAlign: "center" }}>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: m.color, textTransform: "uppercase" }}>{m.label}</div>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: m.color, fontFamily: "monospace" }}>{m.value}</div>
                <div style={{ fontSize: "0.52rem", color: "var(--text-muted)" }}>points</div>
              </div>
            ))}
          </div>

          {/* Probability Cone */}
          <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Probability Cone</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>Days</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#c62828" }}>-2SD</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#e65100" }}>-1SD</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#2962ff" }}>Spot</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#1b5e20" }}>+1SD</th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#1b5e20" }}>+2SD</th>
                </tr>
              </thead>
              <tbody>
                {vi.probabilityCone.map(row => (
                  <tr key={row.days} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "5px 8px", fontWeight: 800 }}>{row.days}d</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: "monospace", color: "#c62828" }}>{row.lower2SD.toLocaleString()}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: "monospace", color: "#e65100" }}>{row.lower1SD.toLocaleString()}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: "monospace", color: "#2962ff", fontWeight: 800 }}>{d.spotPrice.toLocaleString()}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: "monospace", color: "#1b5e20" }}>{row.upper1SD.toLocaleString()}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: "monospace", color: "#1b5e20" }}>{row.upper2SD.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mode === "beginner" && (
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "#fffde7", border: "1px solid #fff9c4" }}>
              <p style={{ fontSize: "0.68rem", color: "#5d4037", lineHeight: 1.6, margin: 0 }}>
                {vi.beginnerSummary}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ════════════════════════════════════════════════════════
         SECTION 8: STRESS TESTING
         ════════════════════════════════════════════════════════ */}
      <div id="deriv-stress" style={{ marginBottom: 16 }}>
        <Card>
          <SectionTitle icon="💥" title="Stress Testing Engine" badge="6 scenarios" />

          {mode === "beginner" && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#e3f2fd", border: "1px solid #bbdefb", marginBottom: 14 }}>
              <p style={{ fontSize: "0.7rem", color: "#1565c0", lineHeight: 1.6, margin: 0 }}>
                Stress tests show what would happen to the market under extreme scenarios. It&apos;s like a fire drill for your portfolio — you hope it never happens, but you want to be prepared.
              </p>
            </div>
          )}

          {d.stressTests.map((scenario, i) => (
            <div key={i} style={{
              marginBottom: 8, borderRadius: 10,
              border: `1px solid ${scenario.color}30`,
              overflow: "hidden",
            }}>
              <div
                onClick={() => setExpandedStress(expandedStress === i ? null : i)}
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  background: `${scenario.color}06`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 800,
                    background: `${scenario.color}18`, color: scenario.color, textTransform: "uppercase",
                  }}>{scenario.severity}</span>
                  <span style={{ fontWeight: 800, fontSize: "0.78rem" }}>{scenario.name}</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, fontFamily: "monospace", color: scenario.spotImpact < 0 ? "#c62828" : "#1b5e20" }}>
                    {scenario.spotImpact > 0 ? "+" : ""}{scenario.spotImpact}%
                  </span>
                  <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{scenario.probability}% prob</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{expandedStress === i ? "▲" : "▼"}</span>
                </div>
              </div>
              {expandedStress === i && (
                <div style={{ padding: "12px 14px", background: "#fff" }}>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 10px 0" }}>
                    {scenario.description}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div style={{ padding: "8px 10px", background: "#ffebed", borderRadius: 6 }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#c62828", textTransform: "uppercase" }}>Spot Impact</div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#c62828" }}>{scenario.spotImpact > 0 ? "+" : ""}{scenario.spotImpact}%</div>
                    </div>
                    <div style={{ padding: "8px 10px", background: "#fff3e0", borderRadius: 6 }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "#e65100", textTransform: "uppercase" }}>IV Impact</div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#e65100" }}>+{scenario.ivImpact}%</div>
                    </div>
                  </div>
                  <div style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: 6, marginBottom: 8 }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Portfolio Impact</div>
                    <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{scenario.portfolioImpact}</p>
                  </div>
                  <div style={{ padding: "8px 12px", background: "#f5f5f5", borderRadius: 6 }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Historical Precedent</div>
                    <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{scenario.historicalPrecedent}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>

      {/* ═══ BOTTOM TWO-COLUMN GRID ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* SECTION 9: QUANT SCORES */}
        <div id="deriv-quant">
          <Card>
            <SectionTitle icon="📈" title="Quantitative Scores" />
            <ScoreBar label="Momentum" value={d.quantScores.momentum} max={100} color={d.quantScores.momentum >= 0 ? "#1b5e20" : "#c62828"} />
            <ScoreBar label="Liquidity" value={d.quantScores.liquidity} color="#1565c0" />
            <ScoreBar label="Volatility" value={d.quantScores.volatility} color="#e65100" />
            <ScoreBar label="Inst. Accumulation" value={d.quantScores.institutionalAccumulation} color="#6a1b9a" />
            <ScoreBar label="Risk-Adj Strength" value={d.quantScores.riskAdjustedStrength} color="#00695c" />
            <ScoreBar label="Rel. Vol Rank" value={d.quantScores.relativeVolatilityRank} color="#c62828" />
          </Card>
        </div>

        {/* SECTION 10: SUPPORT & RESISTANCE */}
        <div id="deriv-support">
          <Card>
            <SectionTitle icon="🛡️" title="Support & Resistance" />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1b5e20", marginBottom: 6, textTransform: "uppercase" }}>Support Zones</div>
              {d.supportResistance.supports.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "monospace", color: "#1b5e20", width: 55 }}>{s.level.toLocaleString()}</span>
                  <div style={{ flex: 1, height: 8, background: "#e8faf0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${s.strength}%`, height: "100%", background: "#00c853", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#1b5e20" }}>{s.strength}%</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#c62828", marginBottom: 6, textTransform: "uppercase" }}>Resistance Zones</div>
              {d.supportResistance.resistances.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "monospace", color: "#c62828", width: 55 }}>{r.level.toLocaleString()}</span>
                  <div style={{ flex: 1, height: 8, background: "#ffebed", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${r.strength}%`, height: "100%", background: "#f44336", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#c62828" }}>{r.strength}%</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: 8, display: "flex", gap: 16 }}>
              <div><span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Max Pain</span><div style={{ fontWeight: 800, fontSize: "0.82rem", fontFamily: "monospace" }}>{d.supportResistance.maxPain.toLocaleString()}</div></div>
              <div><span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Gamma Wall</span><div style={{ fontWeight: 800, fontSize: "0.82rem", fontFamily: "monospace", color: "#6a1b9a" }}>{d.supportResistance.gammaWall.toLocaleString()}</div></div>
            </div>
          </Card>
        </div>

        {/* SECTION 11: CORRELATIONS */}
        <div id="deriv-correlation">
          <Card>
            <SectionTitle icon="🔗" title="Correlation Engine" />
            {d.correlations.map(c => (
              <div key={c.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)" }}>{c.label}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, fontFamily: "monospace", color: c.correlation >= 0 ? "#1565c0" : "#c62828" }}>
                    {c.correlation >= 0 ? "+" : ""}{c.correlation}
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    position: "absolute",
                    left: c.correlation >= 0 ? "50%" : `${50 + c.correlation * 50}%`,
                    width: `${Math.abs(c.correlation) * 50}%`,
                    height: "100%", borderRadius: 3,
                    background: c.correlation >= 0 ? "#2962ff" : "#ef4444",
                  }} />
                </div>
                <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: 2, lineHeight: 1.3 }}>{c.interpretation}</p>
              </div>
            ))}
          </Card>
        </div>

        {/* SECTION 12: PCR GAUGE */}
        <div id="deriv-alerts">
          <Card>
            <SectionTitle icon="🔥" title="PCR Sentiment Gauge" />
            <div style={{ textAlign: "center" }}>
              <svg viewBox="0 0 200 120" style={{ width: 180, margin: "0 auto" }}>
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7ed" strokeWidth="14" strokeLinecap="round" />
                <path d="M 20 100 A 80 80 0 0 1 60 35" fill="none" stroke="#ef444440" strokeWidth="14" strokeLinecap="round" />
                <path d="M 140 35 A 80 80 0 0 1 180 100" fill="none" stroke="#22c55e40" strokeWidth="14" strokeLinecap="round" />
                {(() => {
                  const pcrClamped = Math.min(2, Math.max(0, d.pcr));
                  const angle = -90 + (pcrClamped / 2) * 180;
                  const rad = (angle * Math.PI) / 180;
                  const nx = 100 + Math.cos(rad) * 65;
                  const ny = 100 + Math.sin(rad) * 65;
                  return <line x1="100" y1="100" x2={nx} y2={ny} stroke="#1a1d29" strokeWidth="3" strokeLinecap="round" />;
                })()}
                <circle cx="100" cy="100" r="5" fill="#1a1d29" />
                <text x="100" y="85" textAnchor="middle" fontSize="22" fontWeight="900" fill="var(--text-primary)">{d.pcr.toFixed(2)}</text>
                <text x="100" y="115" textAnchor="middle" fontSize="9" fontWeight="700" fill={d.pcr > 1.3 ? "#1b5e20" : d.pcr < 0.7 ? "#c62828" : "#546e7a"}>
                  {d.pcr > 1.3 ? "BULLISH" : d.pcr < 0.7 ? "BEARISH" : "NEUTRAL"}
                </text>
                <text x="15" y="115" fontSize="7" fill="#c62828" fontWeight="600">Bearish</text>
                <text x="155" y="115" fontSize="7" fill="#1b5e20" fontWeight="600">Bullish</text>
              </svg>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Call OI</div><div style={{ fontWeight: 800, fontSize: "0.8rem", color: "#2962ff", fontFamily: "monospace" }}>{(d.totalCallOI / 100000).toFixed(1)}L</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Put OI</div><div style={{ fontWeight: 800, fontSize: "0.8rem", color: "#c62828", fontFamily: "monospace" }}>{(d.totalPutOI / 100000).toFixed(1)}L</div></div>
            </div>
            {mode === "beginner" && (
              <div style={{ marginTop: 10, fontSize: "0.63rem", color: "var(--text-muted)", lineHeight: 1.5, padding: "6px 8px", background: "#fffde7", borderRadius: 6 }}>
                PCR (Put-Call Ratio) measures fear vs. greed. Above 1.3 = lots of fear (contrarian bullish signal). Below 0.7 = lots of greed (contrarian bearish signal). The market often moves OPPOSITE to the crowd!
              </div>
            )}
          </Card>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
    </div>
  );
}
