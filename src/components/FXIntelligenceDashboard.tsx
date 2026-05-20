"use client";
import { useState, useCallback } from "react";
import type {
  FXIntelligenceData, FXSectionId, FXMarketOverview, TradingActivity,
  MarketEvent, CentralBankIntel, BondYieldAnalysis, TechnicalAnalysis,
  QuantModel, CorrelationEntry, InstitutionalView, SentimentEngine,
  AIForecast, SmartInsight,
} from "@/lib/fx-intelligence";
import { FX_DASHBOARD_SECTIONS, CURRENCY_SYMBOLS } from "@/lib/fx-intelligence";

// ═══════════════════════════════════════════════
// Utility Components
// ═══════════════════════════════════════════════

function SignalBadge({ signal, size = "sm" }: { signal: string; size?: "sm" | "md" | "lg" }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    bullish: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    strong_bullish: { bg: "#c8e6c9", color: "#1b5e20", border: "#66bb6a" },
    buy: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    strong_buy: { bg: "#c8e6c9", color: "#1b5e20", border: "#66bb6a" },
    bearish: { bg: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
    strong_bearish: { bg: "#ffcdd2", color: "#b71c1c", border: "#e57373" },
    sell: { bg: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
    strong_sell: { bg: "#ffcdd2", color: "#b71c1c", border: "#e57373" },
    neutral: { bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
    hold: { bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
    hawkish: { bg: "#fce4ec", color: "#880e4f", border: "#f48fb1" },
    dovish: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    risk_on: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    risk_off: { bg: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
    net_buying: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    net_selling: { bg: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
    net_long: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
    net_short: { bg: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
    balanced: { bg: "#e3f2fd", color: "#0d47a1", border: "#90caf9" },
    active: { bg: "#e8eaf6", color: "#283593", border: "#9fa8da" },
    moderate: { bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
    minimal: { bg: "#fafafa", color: "#757575", border: "#e0e0e0" },
    high: { bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
    low: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    deep: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    thin: { bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
    widening: { bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
    narrowing: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
    stable: { bg: "#e3f2fd", color: "#0d47a1", border: "#90caf9" },
  };
  const c = colors[signal] || colors.neutral;
  const fontSize = size === "lg" ? "0.78rem" : size === "md" ? "0.68rem" : "0.6rem";
  const padding = size === "lg" ? "4px 12px" : size === "md" ? "3px 10px" : "2px 8px";
  return (
    <span style={{
      fontSize, fontWeight: 700, padding, borderRadius: 6,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap",
    }}>
      {signal.replace(/_/g, " ")}
    </span>
  );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 10, background: "#f8f9ff",
      border: "1px solid #e8eaf6", flex: "1 1 140px", minWidth: 130,
    }}>
      <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: accent || "#1a1a2e" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.62rem", color: "#888", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "#2962ff", height = 6 }: { value: number; max?: number; color?: string; height?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ width: "100%", height, borderRadius: height, background: "#e8eaf6", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: height, background: color, transition: "width 0.5s ease" }} />
    </div>
  );
}

function GaugeScore({ value, label, max = 100 }: { value: number; label: string; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "#2e7d32" : pct >= 40 ? "#e65100" : "#c62828";
  return (
    <div style={{ textAlign: "center", flex: "1 1 100px" }}>
      <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 6px" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8eaf6" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, color }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

function CorrelationBar({ value, label }: { value: number; label: string }) {
  const w = Math.abs(value) * 100;
  const color = value > 0.3 ? "#2e7d32" : value < -0.3 ? "#c62828" : "#e65100";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ width: 90, fontSize: "0.72rem", fontWeight: 600, color: "#555", textAlign: "right" }}>{label}</div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f0f0f0", overflow: "hidden", position: "relative" }}>
          <div style={{
            position: "absolute",
            left: value >= 0 ? "50%" : `${50 - w / 2}%`,
            width: `${w / 2}%`, height: "100%",
            background: color, borderRadius: 4, transition: "all 0.5s",
          }} />
          <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "#ccc" }} />
        </div>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color, minWidth: 40, textAlign: "right" }}>{value.toFixed(2)}</span>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
// Section Components
// ═══════════════════════════════════════════════

function OverviewSection({ data, pair, quoteSymbol }: { data: FXMarketOverview; pair: string; quoteSymbol: string }) {
  const isPositive = data.intradayChangePct >= 0;
  return (
    <div>
      {/* Hero rate display */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        borderRadius: 14, padding: "24px 28px", marginBottom: 16, color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>{pair}</span>
          <SignalBadge signal={data.institutionalSentiment} size="md" />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
          <span style={{ fontSize: "2.8rem", fontWeight: 900, letterSpacing: -1 }}>{quoteSymbol}{data.currentRate.toFixed(data.currentRate > 100 ? 2 : 4)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: isPositive ? "#69f0ae" : "#ff5252" }}>
              {isPositive ? "▲" : "▼"} {Math.abs(data.intradayChange).toFixed(4)}
            </span>
            <span style={{
              fontSize: "0.85rem", fontWeight: 700, padding: "3px 10px", borderRadius: 6,
              background: isPositive ? "rgba(105,240,174,0.15)" : "rgba(255,82,82,0.15)",
              color: isPositive ? "#69f0ae" : "#ff5252",
            }}>
              {isPositive ? "+" : ""}{data.intradayChangePct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: "0.72rem", opacity: 0.8 }}>
          <span>Day: {data.dailyLow.toFixed(4)} — {data.dailyHigh.toFixed(4)}</span>
          <span>52W: {data.week52Low.toFixed(2)} — {data.week52High.toFixed(2)}</span>
          <span>Liquidity: <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{data.liquidity}</span></span>
        </div>
      </div>

      {/* Performance grid */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <StatBox label="1 Week" value={`${data.weeklyPerf >= 0 ? "+" : ""}${data.weeklyPerf.toFixed(2)}%`} accent={data.weeklyPerf >= 0 ? "#2e7d32" : "#c62828"} />
        <StatBox label="1 Month" value={`${data.monthlyPerf >= 0 ? "+" : ""}${data.monthlyPerf.toFixed(2)}%`} accent={data.monthlyPerf >= 0 ? "#2e7d32" : "#c62828"} />
        <StatBox label="YTD" value={`${data.ytdPerf >= 0 ? "+" : ""}${data.ytdPerf.toFixed(2)}%`} accent={data.ytdPerf >= 0 ? "#2e7d32" : "#c62828"} />
        <StatBox label="Bid-Ask Spread" value={data.bidAskSpread} />
      </div>

      {/* Volatility */}
      <div style={{ background: "#f8f9ff", borderRadius: 12, padding: 16, border: "1px solid #e8eaf6" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#555", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Volatility Surface</div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Realized 30D", val: data.volatility.realized30d },
            { label: "Implied 1M", val: data.volatility.implied1m },
            { label: "Implied 3M", val: data.volatility.implied3m },
          ].map(v => (
            <div key={v.label} style={{ flex: 1 }}>
              <div style={{ fontSize: "0.6rem", color: "#999", marginBottom: 4 }}>{v.label}</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>{v.val.toFixed(1)}%</div>
              <ProgressBar value={v.val} max={30} color={v.val > 15 ? "#c62828" : v.val > 10 ? "#e65100" : "#2962ff"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradingSection({ data }: { data: TradingActivity }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <StatBox label="Daily Volume" value={data.dailyVolume} />
        <StatBox label="Futures OI" value={data.futuresOI} />
        <StatBox label="Options OI" value={data.optionsOI} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 8 }}>Institutional Flow</div>
          <SignalBadge signal={data.institutionalFlow} size="md" />
          <div style={{ fontSize: "0.68rem", color: "#666", marginTop: 8 }}>{data.spotActivity}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 8 }}>Central Bank Activity</div>
          <SignalBadge signal={data.centralBankParticipation} size="md" />
          <div style={{ fontSize: "0.68rem", color: "#666", marginTop: 8 }}>
            Retail: {data.retailVsInstitutional.retail}% | Institutional: {data.retailVsInstitutional.institutional}%
          </div>
        </div>
      </div>
      {/* Participation bar */}
      <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 8 }}>Market Participation Split</div>
        <div style={{ height: 24, borderRadius: 12, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${data.retailVsInstitutional.institutional}%`, background: "linear-gradient(90deg, #1a237e, #283593)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.6rem", fontWeight: 700 }}>
            Institutional {data.retailVsInstitutional.institutional}%
          </div>
          <div style={{ width: `${data.retailVsInstitutional.retail}%`, background: "linear-gradient(90deg, #e8eaf6, #c5cae9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#37474f", fontSize: "0.6rem", fontWeight: 700 }}>
            Retail {data.retailVsInstitutional.retail}%
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {data.majorSessions.map(s => (
            <span key={s} style={{ fontSize: "0.6rem", fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "#e8eaf6", color: "#283593" }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventsSection({ events }: { events: MarketEvent[] }) {
  const impactColors = { bullish: "#2e7d32", bearish: "#c62828", neutral: "#e65100" };
  const magColors = { high: "#c62828", medium: "#e65100", low: "#888" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {events.map((ev, i) => (
        <div key={i} style={{
          padding: "14px 16px", borderRadius: 10, background: "#fff",
          border: "1px solid #eef0f2", borderLeft: `4px solid ${impactColors[ev.impact]}`,
          transition: "all 0.15s",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.55rem", fontWeight: 700, color: impactColors[ev.impact], background: `${impactColors[ev.impact]}12`, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>
                {ev.impact === "bullish" ? "▲" : ev.impact === "bearish" ? "▼" : "●"} {ev.impact}
              </span>
              <span style={{ fontSize: "0.55rem", fontWeight: 700, color: magColors[ev.magnitude], textTransform: "uppercase" }}>
                {ev.magnitude} impact
              </span>
            </div>
            <span style={{ fontSize: "0.6rem", color: "#999" }}>{ev.date}</span>
          </div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{ev.title}</div>
          <div style={{ fontSize: "0.68rem", color: "#666", lineHeight: 1.5, marginBottom: 4 }}>{ev.explanation}</div>
          <div style={{ fontSize: "0.62rem", color: "#2962ff", fontWeight: 600, fontStyle: "italic" }}>Future: {ev.futureImplication}</div>
        </div>
      ))}
    </div>
  );
}

function CentralBankSection({ banks }: { banks: CentralBankIntel[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: banks.length > 1 ? "1fr 1fr" : "1fr", gap: 14 }}>
      {banks.map((cb, i) => (
        <div key={i} style={{
          padding: 18, borderRadius: 12, background: "linear-gradient(135deg, #f8f9ff, #f0f4ff)",
          border: "1px solid #e8eaf6",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a1a2e" }}>{cb.bank}</div>
              <div style={{ fontSize: "0.62rem", color: "#999", marginTop: 2 }}>Next: {cb.nextMeeting}</div>
            </div>
            <SignalBadge signal={cb.stance} size="lg" />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ padding: "10px 16px", borderRadius: 8, background: "#fff", border: "1px solid #e0e0e0", textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase" }}>Policy Rate</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1a237e" }}>{cb.currentRate.toFixed(2)}%</div>
            </div>
          </div>
          <div style={{ fontSize: "0.68rem", color: "#555", lineHeight: 1.5, marginBottom: 8 }}>
            <strong>Last Action:</strong> {cb.lastAction}
          </div>
          <div style={{ fontSize: "0.68rem", color: "#555", lineHeight: 1.5, marginBottom: 8 }}>
            <strong>Guidance:</strong> {cb.forwardGuidance}
          </div>
          <div style={{ fontSize: "0.62rem", color: "#2962ff", fontWeight: 600 }}>
            Rate Path: {cb.ratePathExpected}
          </div>
        </div>
      ))}
    </div>
  );
}

function BondsSection({ data }: { data: BondYieldAnalysis }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <StatBox label="US 10Y Treasury" value={`${data.usTreasury10Y.toFixed(2)}%`} accent="#1a237e" />
        <StatBox label="Domestic 10Y" value={`${data.domesticBond10Y.toFixed(2)}%`} accent="#283593" />
        <StatBox label="Yield Spread" value={`${data.yieldSpread > 0 ? "+" : ""}${data.yieldSpread.toFixed(0)} bps`} accent={data.yieldSpread > 0 ? "#2e7d32" : "#c62828"} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Spread Direction</div>
          <SignalBadge signal={data.spreadDirection} size="md" />
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Carry Score</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: data.carryTradeScore >= 7 ? "#2e7d32" : data.carryTradeScore >= 4 ? "#e65100" : "#c62828" }}>{data.carryTradeScore}/10</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Yield Curve</div>
          <SignalBadge signal={data.yieldCurveShape} size="md" />
        </div>
      </div>
      <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#fffde7", border: "1px solid #fff9c4", fontSize: "0.68rem", color: "#555" }}>
        <strong style={{ color: "#f57f17" }}>Risk Premium:</strong> {data.riskPremium}
      </div>
    </div>
  );
}

function TechnicalsSection({ data }: { data: TechnicalAnalysis }) {
  const rsiColor = data.rsi > 70 ? "#c62828" : data.rsi < 30 ? "#2e7d32" : "#e65100";
  return (
    <div>
      {/* Trend & RSI header */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Trend</div>
          <SignalBadge signal={data.trend} size="lg" />
          <div style={{ fontSize: "0.65rem", color: "#666", marginTop: 6 }}>{data.momentum}</div>
        </div>
        <div style={{ flex: 1, padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>RSI (14)</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 900, color: rsiColor }}>{data.rsi.toFixed(1)}</div>
          <div style={{ fontSize: "0.6rem", color: rsiColor, fontWeight: 600 }}>
            {data.rsi > 70 ? "OVERBOUGHT" : data.rsi < 30 ? "OVERSOLD" : "NEUTRAL ZONE"}
          </div>
          <div style={{ marginTop: 6 }}>
            <ProgressBar value={data.rsi} max={100} color={rsiColor} height={4} />
          </div>
        </div>
      </div>

      {/* MACD & Bollinger */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 8 }}>MACD</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
            <div><span style={{ fontSize: "0.55rem", color: "#999" }}>Line</span><br /><span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{data.macd.value.toFixed(4)}</span></div>
            <div><span style={{ fontSize: "0.55rem", color: "#999" }}>Signal</span><br /><span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{data.macd.signal.toFixed(4)}</span></div>
            <div><span style={{ fontSize: "0.55rem", color: "#999" }}>Hist</span><br /><span style={{ fontWeight: 700, fontSize: "0.82rem", color: data.macd.histogram >= 0 ? "#2e7d32" : "#c62828" }}>{data.macd.histogram.toFixed(4)}</span></div>
          </div>
          <div style={{ fontSize: "0.62rem", color: "#666" }}>{data.macd.interpretation}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 8 }}>Bollinger Bands</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <div><span style={{ fontSize: "0.55rem", color: "#c62828" }}>Upper</span><br /><span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{data.bollingerBands.upper.toFixed(4)}</span></div>
            <div><span style={{ fontSize: "0.55rem", color: "#e65100" }}>Mid</span><br /><span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{data.bollingerBands.middle.toFixed(4)}</span></div>
            <div><span style={{ fontSize: "0.55rem", color: "#2e7d32" }}>Lower</span><br /><span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{data.bollingerBands.lower.toFixed(4)}</span></div>
          </div>
          <div style={{ fontSize: "0.62rem", color: "#666" }}>Position: {data.bollingerBands.position?.replace(/_/g, " ")}</div>
        </div>
      </div>

      {/* Moving Averages */}
      <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", marginBottom: 16 }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 10 }}>Moving Averages</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "20 DMA", val: data.movingAverages.ma20 },
            { label: "50 DMA", val: data.movingAverages.ma50 },
            { label: "100 DMA", val: data.movingAverages.ma100 },
            { label: "200 DMA", val: data.movingAverages.ma200 },
          ].map(ma => (
            <div key={ma.label} style={{ textAlign: "center", padding: "8px 4px", background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0" }}>
              <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999" }}>{ma.label}</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1a237e" }}>{ma.val.toFixed(4)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Levels */}
      <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 10 }}>Key Levels</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.keyLevels.map((lvl, i) => {
            const c = lvl.type === "resistance" ? "#c62828" : lvl.type === "support" ? "#2e7d32" : "#2962ff";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#fff", borderRadius: 6, border: `1px solid ${c}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#444" }}>{lvl.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: c }}>{lvl.value.toFixed(4)}</span>
                  <span style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase" }}>{lvl.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuantSection({ models }: { models: QuantModel[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {models.map((m, i) => (
        <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1a1a2e" }}>{m.name}</span>
              <SignalBadge signal={m.signal} />
            </div>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#2962ff" }}>{m.value}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: "0.6rem", color: "#999" }}>Confidence</span>
            <div style={{ flex: 1 }}><ProgressBar value={m.confidence} color="#2962ff" /></div>
            <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>{m.confidence}%</span>
          </div>
          <div style={{ fontSize: "0.65rem", color: "#666", lineHeight: 1.4 }}>{m.description}</div>
        </div>
      ))}
    </div>
  );
}

function CorrelationsSection({ data }: { data: CorrelationEntry[] }) {
  return (
    <div>
      <div style={{ padding: 16, borderRadius: 12, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Cross-Asset Correlation Matrix</div>
        {data.map((c, i) => (
          <div key={i}>
            <CorrelationBar value={c.correlation} label={c.asset} />
            <div style={{ fontSize: "0.58rem", color: "#888", marginLeft: 100, marginBottom: 8, marginTop: -4 }}>{c.significance}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
        <span style={{ fontSize: "0.58rem", color: "#2e7d32", fontWeight: 600 }}>+1.0 Strong Positive</span>
        <span style={{ fontSize: "0.58rem", color: "#999" }}>|</span>
        <span style={{ fontSize: "0.58rem", color: "#e65100", fontWeight: 600 }}>0 Neutral</span>
        <span style={{ fontSize: "0.58rem", color: "#999" }}>|</span>
        <span style={{ fontSize: "0.58rem", color: "#c62828", fontWeight: 600 }}>-1.0 Strong Negative</span>
      </div>
    </div>
  );
}

function InstitutionalSection({ views }: { views: InstitutionalView[] }) {
  const outlookColors = { bullish: "#2e7d32", bearish: "#c62828", neutral: "#e65100" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Consensus bar */}
      <div style={{ padding: 14, borderRadius: 10, background: "linear-gradient(135deg, #1a1a2e, #16213e)", color: "#fff", marginBottom: 4 }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Institutional Consensus</div>
        <div style={{ display: "flex", gap: 12 }}>
          {["bullish", "neutral", "bearish"].map(o => {
            const count = views.filter(v => v.outlook === o).length;
            return (
              <div key={o} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: outlookColors[o as keyof typeof outlookColors] }}>{count}</div>
                <div style={{ fontSize: "0.58rem", textTransform: "uppercase", opacity: 0.7 }}>{o}</div>
              </div>
            );
          })}
        </div>
      </div>
      {views.map((v, i) => (
        <div key={i} style={{
          padding: "12px 16px", borderRadius: 10, background: "#fff",
          border: "1px solid #eef0f2", borderLeft: `4px solid ${outlookColors[v.outlook]}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1a1a2e" }}>{v.firm}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SignalBadge signal={v.outlook} />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2962ff" }}>Target: {v.target}</span>
            </div>
          </div>
          <div style={{ fontSize: "0.65rem", color: "#666", marginBottom: 3 }}><strong>Theme:</strong> {v.theme}</div>
          <div style={{ fontSize: "0.62rem", color: "#c62828" }}><strong>Risk:</strong> {v.keyRisk}</div>
        </div>
      ))}
    </div>
  );
}

function SentimentSection({ data }: { data: SentimentEngine }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        <GaugeScore value={data.overallScore} label="Overall" />
        <GaugeScore value={data.institutionalConfidence} label="Inst. Confidence" />
        <GaugeScore value={data.fearGreed} label="Fear & Greed" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Risk Appetite</div>
          <SignalBadge signal={data.riskAppetite} size="lg" />
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Safe Haven</div>
          <SignalBadge signal={data.safeHavenDemand} size="lg" />
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", textAlign: "center" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", marginBottom: 6 }}>Spec. Position</div>
          <SignalBadge signal={data.speculativePositioning} size="lg" />
        </div>
      </div>
    </div>
  );
}

function ForecastSection({ data }: { data: AIForecast }) {
  return (
    <div>
      {/* Timeline forecasts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Short-Term (1D–1W)", ...data.shortTerm, color: "#2962ff" },
          { label: "Medium-Term (1M–3M)", ...data.mediumTerm, color: "#7c4dff" },
          { label: "Long-Term (6M–1Y)", ...data.longTerm, color: "#1a237e" },
        ].map(f => (
          <div key={f.label} style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", borderLeft: `4px solid ${f.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: f.color }}>{f.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1a1a2e" }}>{f.range}</span>
                <span style={{ fontSize: "0.58rem", fontWeight: 600, color: "#999" }}>{f.confidence}% conf.</span>
              </div>
            </div>
            <div style={{ fontSize: "0.68rem", color: "#555", lineHeight: 1.4 }}>{f.outlook}</div>
            <div style={{ marginTop: 6 }}><ProgressBar value={f.confidence} color={f.color} height={3} /></div>
          </div>
        ))}
      </div>

      {/* Scenarios */}
      <div style={{ padding: 16, borderRadius: 12, background: "linear-gradient(135deg, #1a1a2e, #0f3460)", color: "#fff", marginBottom: 16 }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Scenario Analysis</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Bull Case", ...data.scenarios.bull, color: "#69f0ae" },
            { label: "Base Case", ...data.scenarios.base, color: "#82b1ff" },
            { label: "Bear Case", ...data.scenarios.bear, color: "#ff5252" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, color: s.color, textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900 }}>{s.target}</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: s.color, marginTop: 4 }}>{s.probability}%</div>
              <div style={{ fontSize: "0.58rem", opacity: 0.7, marginTop: 4 }}>{s.catalyst}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Catalysts */}
      <div style={{ padding: 14, borderRadius: 10, background: "#fffde7", border: "1px solid #fff9c4" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#f57f17", textTransform: "uppercase", marginBottom: 8 }}>Key Catalysts to Watch</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {data.catalysts.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.68rem", color: "#555" }}>
              <span style={{ color: "#f57f17", fontWeight: 700 }}>{i + 1}.</span> {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightsSection({ insights }: { insights: SmartInsight[] }) {
  const typeConfig = {
    warning: { icon: "⚠️", color: "#e65100", bg: "#fff3e0", border: "#ffcc80" },
    opportunity: { icon: "💡", color: "#2e7d32", bg: "#e8f5e9", border: "#a5d6a7" },
    info: { icon: "📊", color: "#0d47a1", bg: "#e3f2fd", border: "#90caf9" },
    risk: { icon: "🔴", color: "#c62828", bg: "#ffebee", border: "#ef9a9a" },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {insights.map((ins, i) => {
        const cfg = typeConfig[ins.type] || typeConfig.info;
        return (
          <div key={i} style={{
            padding: "12px 16px", borderRadius: 10, background: cfg.bg,
            border: `1px solid ${cfg.border}`, borderLeft: `4px solid ${cfg.color}`,
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ fontSize: "1.1rem" }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                {ins.urgency === "high" && (
                  <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#fff", background: "#c62828", padding: "1px 5px", borderRadius: 3, textTransform: "uppercase" }}>urgent</span>
                )}
                <span style={{ fontSize: "0.55rem", fontWeight: 600, color: cfg.color, textTransform: "uppercase" }}>{ins.type}</span>
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#333", lineHeight: 1.4 }}>{ins.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Main Dashboard Component
// ═══════════════════════════════════════════════

interface FXIntelligenceDashboardProps {
  pair: string;
  pairName: string;
  base: string;
  quote: string;
  symbol: string;
  category: string;
  onClose: () => void;
}

export default function FXIntelligenceDashboard({ pair, pairName, base, quote, symbol, category, onClose }: FXIntelligenceDashboardProps) {
  const [data, setData] = useState<FXIntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<FXSectionId>("overview");
  const [fetched, setFetched] = useState(false);

  const quoteSymbol = CURRENCY_SYMBOLS[quote] || "$";

  const fetchIntelligence = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/fx-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, pair, name: pairName, base, quote, category }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const result = await res.json();
      setData(result as FXIntelligenceData);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load intelligence");
    } finally {
      setLoading(false);
    }
  }, [symbol, pair, pairName, base, quote, category]);

  // Auto-fetch on mount
  if (!fetched && !loading) {
    fetchIntelligence();
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e0e3e8", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "20px 24px", color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: loading ? "#ff9800" : "#00e676", boxShadow: `0 0 8px ${loading ? "rgba(255,152,0,0.5)" : "rgba(0,230,118,0.5)"}` }} />
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.8 }}>
              Institutional FX Intelligence
            </span>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer",
            fontSize: "0.72rem", fontWeight: 600, transition: "all 0.2s",
          }}>
            Close Dashboard
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: "1.8rem", fontWeight: 900 }}>{pair}</span>
          <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>{pairName}</span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: "0.62rem", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>{category}</span>
          <span style={{ fontSize: "0.62rem", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>{base} / {quote}</span>
          {data?.generatedAt && (
            <span style={{ fontSize: "0.58rem", opacity: 0.6, display: "flex", alignItems: "center" }}>
              Updated: {new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
            </span>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div style={{
        display: "flex", gap: 4, padding: "10px 16px",
        borderBottom: "1px solid #e5e7eb", background: "#f8f9ff",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {FX_DASHBOARD_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid",
              borderColor: activeSection === sec.id ? "#2962ff" : "transparent",
              background: activeSection === sec.id ? "#e8edff" : "transparent",
              color: activeSection === sec.id ? "#2962ff" : "#666",
              fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
              whiteSpace: "nowrap", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 4,
            }}>
            <span style={{ fontSize: "0.75rem" }}>{sec.icon}</span>
            {sec.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px", minHeight: 400 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{
              width: 48, height: 48, border: "3px solid #e8eaf6", borderTopColor: "#2962ff",
              borderRadius: "50%", margin: "0 auto 16px",
              animation: "fx-spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>Generating Intelligence...</div>
            <div style={{ fontSize: "0.72rem", color: "#999" }}>
              Analyzing {pair} across 13 institutional dimensions
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
              {["Central Banks", "Bond Yields", "Technicals", "Quant Models", "Correlations", "Sentiment"].map((s, i) => (
                <span key={s} style={{
                  fontSize: "0.58rem", fontWeight: 600, padding: "3px 8px", borderRadius: 4,
                  background: "#e8eaf6", color: "#283593",
                  animation: `fx-shimmer 2s infinite ${i * 0.3}s`,
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#c62828", marginBottom: 8 }}>Intelligence Generation Failed</div>
            <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: 16 }}>{error}</div>
            <button onClick={fetchIntelligence} style={{
              padding: "8px 20px", borderRadius: 8, background: "#2962ff",
              color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem",
            }}>Retry</button>
          </div>
        )}

        {data && !loading && (
          <>
            {activeSection === "overview" && data.overview && <OverviewSection data={data.overview} pair={pair} quoteSymbol={quoteSymbol} />}
            {activeSection === "trading" && data.trading && <TradingSection data={data.trading} />}
            {activeSection === "events" && data.events && <EventsSection events={data.events} />}
            {activeSection === "centralbanks" && data.centralBanks && <CentralBankSection banks={data.centralBanks} />}
            {activeSection === "bonds" && data.bonds && <BondsSection data={data.bonds} />}
            {activeSection === "technicals" && data.technicals && <TechnicalsSection data={data.technicals} />}
            {activeSection === "quant" && data.quantModels && <QuantSection models={data.quantModels} />}
            {activeSection === "correlations" && data.correlations && <CorrelationsSection data={data.correlations} />}
            {activeSection === "institutional" && data.institutionalViews && <InstitutionalSection views={data.institutionalViews} />}
            {activeSection === "sentiment" && data.sentiment && <SentimentSection data={data.sentiment} />}
            {activeSection === "forecast" && data.forecast && <ForecastSection data={data.forecast} />}
            {activeSection === "insights" && data.insights && <InsightsSection insights={data.insights} />}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 24px", borderTop: "1px solid #e5e7eb", background: "#f8f9fa",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#2962ff" }} />
          <span style={{ fontSize: "0.56rem", color: "#aaa", fontWeight: 600, letterSpacing: 0.5 }}>
            MOONLIGHT FX INTELLIGENCE ENGINE
          </span>
        </div>
        <button onClick={fetchIntelligence} disabled={loading} style={{
          background: "none", border: "none", cursor: loading ? "wait" : "pointer",
          color: "#2962ff", fontSize: "0.65rem", fontWeight: 700,
        }}>
          {loading ? "Generating..." : "Refresh Intelligence"}
        </button>
      </div>

      <style>{`
        @keyframes fx-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fx-shimmer { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
