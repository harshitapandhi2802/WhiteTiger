"use client";
import { useState } from "react";
import {
  CITIES_RE, INFRA_PROJECTS, STOCK_IMPACTS, CAPITAL_FLOWS, AI_INSIGHTS,
} from "@/lib/realestate";

/* ════════════════════════════════════════════════════════════════
   REAL ESTATE MARKET IMPACT — Right Sidebar Panel
   Live property pulse, infra tracker, stock impact, smart money
   ════════════════════════════════════════════════════════════════ */

export function RealEstatePanel() {
  const [section, setSection] = useState<"pulse" | "impact">("pulse");

  const topCities = [...CITIES_RE].sort((a, b) => b.priceAppreciation - a.priceAppreciation).slice(0, 6);
  const topInfra = INFRA_PROJECTS.filter(p => p.status === "Under Construction").slice(0, 4);

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid var(--border)",
      overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px",
        background: "linear-gradient(135deg, #1a3a2a, #2d5a3d)",
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: "1rem" }}>🏠</span>
          <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>Real Estate Intelligence</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {(["pulse", "impact"] as const).map(s => (
            <button key={s} onClick={() => setSection(s)} style={{
              flex: 1, padding: "4px 0", borderRadius: 5, border: "none",
              background: section === s ? "rgba(255,255,255,0.2)" : "transparent",
              color: section === s ? "#fff" : "rgba(255,255,255,0.5)",
              fontSize: "0.58rem", fontWeight: 700, cursor: "pointer",
            }}>{s === "pulse" ? "Market Pulse" : "Stock Impact"}</button>
          ))}
        </div>
      </div>

      <div style={{ maxHeight: "calc(100vh - 140px)", overflowY: "auto", scrollbarWidth: "thin" }}>

      {section === "pulse" && (
        <div style={{ padding: "10px 12px" }}>

          {/* ─ City Growth Pulse ─ */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00c853", animation: "pulse 2s infinite" }} />
              Top Growing Cities
            </div>
            {topCities.map(c => (
              <div key={c.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 0", borderBottom: "1px solid var(--border-light)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.85rem" }}>{c.flag}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.72rem" }}>{c.name}</div>
                    <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>Yield {c.rentalYield}%</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: "0.72rem", fontWeight: 800,
                    color: "#00833a",
                  }}>+{c.priceAppreciation}%</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 2,
                    padding: "1px 6px", borderRadius: 4,
                    background: c.investmentScore >= 85 ? "#e8faf0" : c.investmentScore >= 75 ? "#e8eeff" : "#fff8e8",
                    fontSize: "0.55rem", fontWeight: 700,
                    color: c.investmentScore >= 85 ? "#00833a" : c.investmentScore >= 75 ? "#2962ff" : "#e65100",
                  }}>{c.investmentScore}/100</div>
                </div>
              </div>
            ))}
          </div>

          {/* ─ Sector Momentum ─ */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Sector Momentum
            </div>
            {[
              { name: "Data Centers", icon: "🖥️", growth: "+14.2%", signal: "Strong" },
              { name: "Warehousing", icon: "🏭", growth: "+9.5%", signal: "Strong" },
              { name: "Luxury Homes", icon: "🏰", growth: "+8.5%", signal: "Strong" },
              { name: "Hospitality", icon: "🏨", growth: "+7.8%", signal: "Stable" },
              { name: "Office", icon: "🏢", growth: "+2.1%", signal: "Weak" },
            ].map(s => (
              <div key={s.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 8px", marginBottom: 3, borderRadius: 6,
                background: "var(--bg-secondary)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.75rem" }}>{s.icon}</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>{s.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#00833a" }}>{s.growth}</span>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: s.signal === "Strong" ? "#00c853" : s.signal === "Stable" ? "#ff9800" : "#ef5350",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* ─ Infrastructure Spotlight ─ */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              🚧 Infra Impact Tracker
            </div>
            {topInfra.map(p => (
              <div key={p.name} style={{
                padding: "8px 10px", marginBottom: 6, borderRadius: 8,
                border: "1px solid var(--border-light)", background: "#fafbfc",
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.68rem", marginBottom: 3 }}>{p.flag} {p.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{p.type} · {p.completion}</span>
                  <span style={{
                    padding: "1px 6px", borderRadius: 4,
                    fontSize: "0.55rem", fontWeight: 700,
                    background: "#e8faf0", color: "#00833a",
                  }}>{p.priceImpact.split(" ")[0]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ─ Smart Money Flow ─ */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              💰 Smart Money Flow
            </div>
            {CAPITAL_FLOWS.slice(0, 4).map((f, i) => (
              <div key={i} style={{
                padding: "7px 10px", marginBottom: 4, borderRadius: 6,
                borderLeft: `3px solid ${f.trend === "Rising" ? "#00c853" : "#ff9800"}`,
                background: "var(--bg-secondary)",
              }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, marginBottom: 2 }}>
                  {f.source} → {f.destination}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{f.sector}</span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--text-primary)" }}>{f.amount}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ─ AI Insight Feed ─ */}
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              🤖 AI Insights
            </div>
            {AI_INSIGHTS.slice(0, 3).map((ins, i) => {
              const tc = ins.type === "opportunity" ? "#00c853" : ins.type === "risk" ? "#ef5350" : ins.type === "trend" ? "#2962ff" : "#ff9800";
              return (
                <div key={i} style={{
                  padding: "8px 10px", marginBottom: 6, borderRadius: 8,
                  borderLeft: `3px solid ${tc}`, background: `${tc}04`,
                }}>
                  <div style={{ fontWeight: 700, fontSize: "0.68rem", marginBottom: 3, lineHeight: 1.4 }}>{ins.title}</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {ins.body.slice(0, 100)}...
                  </div>
                  <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", marginTop: 3 }}>{ins.timestamp}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {section === "impact" && (
        <div style={{ padding: "10px 12px" }}>
          {/* Stock Impact visual */}
          <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Real Estate → Stock Market
          </div>

          {STOCK_IMPACTS.map(si => {
            const sc = si.currentSignal === "Bullish" ? "#00c853" : si.currentSignal === "Bearish" ? "#ef5350" : "#ff9800";
            return (
              <div key={si.sector} style={{
                marginBottom: 10, padding: "10px 12px", borderRadius: 8,
                border: "1px solid var(--border-light)",
                background: `${sc}04`,
              }}>
                {/* Flow diagram */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: "1rem" }}>🏠</span>
                  <div style={{
                    flex: 1, height: 2,
                    background: `linear-gradient(90deg, ${sc}, ${sc}40)`,
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", right: -3, top: -3, width: 8, height: 8,
                      borderRadius: "50%", background: sc,
                    }} />
                  </div>
                  <span style={{ fontSize: "1rem" }}>{si.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: "0.72rem" }}>{si.sector}</span>
                  <span style={{
                    padding: "1px 6px", borderRadius: 4,
                    fontSize: "0.55rem", fontWeight: 700,
                    background: `${sc}15`, color: sc,
                  }}>{si.currentSignal}</span>
                </div>

                {/* Stocks */}
                {si.stocks.map(s => {
                  const ic = s.impact === "Positive" ? "#00c853" : s.impact === "Negative" ? "#ef5350" : "#ff9800";
                  return (
                    <div key={s.ticker} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "4px 0", borderBottom: "1px solid var(--border-light)",
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.65rem" }}>{s.name}</div>
                        <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", lineHeight: 1.3, maxWidth: 180 }}>{s.reason.slice(0, 60)}</div>
                      </div>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", background: ic, flexShrink: 0,
                      }} />
                    </div>
                  );
                })}

                <div style={{
                  marginTop: 6, fontSize: "0.55rem", color: "var(--text-muted)",
                  display: "flex", justifyContent: "space-between",
                }}>
                  <span>Correlation: <strong style={{ color: si.reCorrelation > 0.7 ? "#00c853" : "#ff9800" }}>{si.reCorrelation.toFixed(2)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
    </div>
  );
}
