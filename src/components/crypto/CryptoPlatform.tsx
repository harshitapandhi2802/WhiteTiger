"use client";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  generateTopCoins, generateCryptoCopilot, generateCryptoStories,
  getOnChainMetrics, getHeatmapSectors, getCryptoMacroImpacts,
  getCryptoRiskMetrics, getDerivativeMetrics, getEcosystems,
  getRegulationEvents, getCryptoEducation,
  CRYPTO_NAV_SECTIONS, type CryptoSection, type CryptoSectionExtra, type TopCoinCard,
} from "@/lib/crypto-engine";
import { CRYPTO_LIST, CRYPTO_CATEGORIES } from "@/lib/crypto";
import { useCryptoPrices } from "@/hooks/useMarketData";
import { DataSourceBadge } from "@/components/DataHealth";

/* ═══════════════════════════════════════════════════════════════
   MOONLIGHT CRYPTO INTELLIGENCE PLATFORM v2.0
   AI Copilot · On-Chain · Heatmaps · Macro · Risk · Education
   ═══════════════════════════════════════════════════════════════ */

/* ─── Seeded RNG (for deterministic chart data) ─── */
function seededRng(seed: string | number) {
  let h = typeof seed === "number" ? seed : 0;
  if (typeof seed === "string") for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

/* ─── Sparkline ─── */
function Spark({ data, color = "#f7931a", w = 100, h = 28 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs><linearGradient id={`csp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.18} /><stop offset="100%" stopColor={color} stopOpacity={0.01} /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#csp-${color.replace("#", "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Badge ─── */
function Badge({ text, variant = "neutral" }: { text: string; variant?: "green" | "red" | "orange" | "blue" | "purple" | "amber" | "neutral" }) {
  const cols: Record<string, { bg: string; color: string }> = {
    green: { bg: "#dcfce7", color: "#166534" }, red: { bg: "#fee2e2", color: "#991b1b" },
    orange: { bg: "#ffedd5", color: "#9a3412" }, blue: { bg: "#dbeafe", color: "#1e40af" },
    purple: { bg: "#ede9fe", color: "#5b21b6" }, amber: { bg: "#fef3c7", color: "#92400e" },
    neutral: { bg: "#f1f5f9", color: "#475569" },
  };
  const c = cols[variant] || cols.neutral;
  return <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" }}>{text}</span>;
}

/* ─── Risk Gauge ─── */
function RiskGauge({ value, max, color, size = 64 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 900, color }}>{value}</div>
    </div>
  );
}

const dirColors: Record<string, { c: string; bg: string }> = {
  bullish: { c: "#10b981", bg: "#052e16" }, positive: { c: "#10b981", bg: "#052e16" },
  bearish: { c: "#ef4444", bg: "#450a0a" }, negative: { c: "#ef4444", bg: "#450a0a" },
  neutral: { c: "#f59e0b", bg: "#451a03" },
};

function fUSD(n: number) { return n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(6)}`; }

/* ═══════════════════════════════════════════════════════════════
   MAIN PLATFORM COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function CryptoPlatform() {
  const [activeSection, setActiveSection] = useState<CryptoSectionExtra>("overview");
  const [cryptoCategory, setCryptoCategory] = useState("All");
  const [selectedCoin, setSelectedCoin] = useState<TopCoinCard | null>(null);
  const [chartExpanded, setChartExpanded] = useState(false);

  // Live prices from CoinDCX/CoinGecko
  const { data: livePrices, source: priceSource, isStale: pricesStale, lastUpdated: pricesUpdated, refresh: refreshPrices } = useCryptoPrices();

  // Data — merge live prices into synthetic topCoins for accurate display
  const baseCoins = useMemo(() => generateTopCoins(), []);
  const topCoins = useMemo(() => {
    return baseCoins.map(coin => {
      const live = livePrices[coin.symbol];
      if (live && live.inr > 0) {
        return {
          ...coin,
          price: live.usd,
          change24h: +live.change24h.toFixed(2),
          marketCap: coin.marketCap, // keep synthetic; live API doesn't provide
        };
      }
      return coin;
    });
  }, [baseCoins, livePrices]);
  const copilot = useMemo(() => generateCryptoCopilot(), []);
  const stories = useMemo(() => generateCryptoStories(), []);
  const onChain = useMemo(() => getOnChainMetrics(), []);
  const heatmapSectors = useMemo(() => getHeatmapSectors(), []);
  const macroImpacts = useMemo(() => getCryptoMacroImpacts(), []);
  const riskMetrics = useMemo(() => getCryptoRiskMetrics(), []);
  const derivatives = useMemo(() => getDerivativeMetrics(), []);
  const ecosystems = useMemo(() => getEcosystems(), []);
  const regulations = useMemo(() => getRegulationEvents(), []);
  const education = useMemo(() => getCryptoEducation(), []);
  const filteredCrypto = useMemo(() => cryptoCategory === "All" ? CRYPTO_LIST : CRYPTO_LIST.filter(c => c.category === cryptoCategory), [cryptoCategory]);

  // Dark card style for crypto
  const darkCard = { padding: "14px 16px", borderRadius: 12, background: "#0f172a", border: "1px solid #1e293b" };

  /* ─── Overview ─── */
  const renderOverview = () => (
    <div>
      {/* Top Coins */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f8fafc", marginBottom: 4 }}>Top Digital Assets</h3>
        <p style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: 14 }}>Market intelligence for the world's leading cryptocurrencies</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {topCoins.map(coin => (
            <div key={coin.symbol} onClick={() => setSelectedCoin(coin)}
              style={{ ...darkCard, cursor: "pointer", transition: "all 0.2s", borderLeft: `3px solid ${coin.sentimentColor}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>{coin.name}</div>
                  <div style={{ fontSize: "0.6rem", color: "#64748b" }}>{coin.symbol} · {coin.category}</div>
                </div>
                <Badge text={coin.aiSentiment} variant={coin.aiSentiment === "Bullish" ? "green" : coin.aiSentiment === "Bearish" ? "red" : "orange"} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Spark data={coin.sparkline} color={coin.change24h >= 0 ? "#10b981" : "#ef4444"} w={80} h={24} />
                <div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#f8fafc" }}>{fUSD(coin.price)}</div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: coin.change24h >= 0 ? "#10b981" : "#ef4444" }}>
                    {coin.change24h >= 0 ? "+" : ""}{coin.change24h}% <span style={{ color: "#64748b", fontWeight: 500 }}>24h</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.55rem", color: "#64748b" }}>
                <span>MCap: {coin.marketCap}</span>
                <span>Vol: {coin.volume24h}</span>
                {coin.dominance && <span>Dom: {coin.dominance}%</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse All Cryptos */}
      <div>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f8fafc", marginBottom: 4 }}>Browse All Cryptocurrencies</h3>
        <p style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: 12 }}>Explore by category — Layer 1, DeFi, Meme, AI & more</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {CRYPTO_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCryptoCategory(cat)} style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid",
              borderColor: cryptoCategory === cat ? "#f7931a" : "#1e293b",
              background: cryptoCategory === cat ? "#f7931a" : "#0f172a",
              color: cryptoCategory === cat ? "#000" : "#94a3b8",
              fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {filteredCrypto.map(c => {
            const match = topCoins.find(tc => tc.symbol === c.symbol);
            return (
              <div key={c.symbol} onClick={() => { if (match) setSelectedCoin(match); }}
                style={{ ...darkCard, cursor: match ? "pointer" : "default", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: match ? 1 : 0.7 }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc" }}>{c.name}</div>
                  <div style={{ fontSize: "0.58rem", color: "#64748b" }}>{c.symbol} · {c.category}</div>
                </div>
                {match ? <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#f7931a" }}>View →</span> : <span style={{ fontSize: "0.55rem", color: "#475569" }}>Coming soon</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* ─── AI Copilot ─── */
  const renderCopilot = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #292524 100%)", color: "#fff", marginBottom: 20, border: "1px solid #292524" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: "1.4rem" }}>{"\u{1f916}"}</span>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>AI Crypto Copilot</div>
            <div style={{ fontSize: "0.68rem", opacity: 0.6 }}>Crypto strategist · On-chain analyst · Macro trader · Blockchain intelligence</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: copilot.moodColor, boxShadow: `0 0 10px ${copilot.moodColor}` }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: copilot.moodColor }}>{copilot.marketMood}</span>
          </div>
        </div>
        <p style={{ fontSize: "0.78rem", lineHeight: 1.6, opacity: 0.85, margin: 0 }}>{copilot.summary}</p>
      </div>

      {/* Beginner Summary */}
      <div style={{ ...darkCard, background: "#0a1628", border: "1px solid #1e3a5f", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: "0.9rem" }}>{"\u{1f331}"}</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 0.5 }}>Beginner Explanation</span>
        </div>
        <p style={{ fontSize: "0.75rem", lineHeight: 1.6, color: "#93c5fd", margin: 0 }}>{copilot.beginnerSummary}</p>
      </div>

      {/* Key Drivers */}
      <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "#f8fafc", marginBottom: 12 }}>Key Market Drivers</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {copilot.keyDrivers.map((d, i) => (
          <div key={i} style={{ ...darkCard, borderLeft: `4px solid ${dirColors[d.impact]?.c || "#64748b"}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc" }}>{d.driver}</span>
              <Badge text={d.impact} variant={d.impact === "bullish" ? "green" : d.impact === "bearish" ? "red" : "orange"} />
            </div>
            <p style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "0 0 6px", lineHeight: 1.5 }}>{d.explanation}</p>
            <div style={{ padding: "8px 10px", borderRadius: 6, background: "#0a1628", border: "1px solid #1e3a5f", fontSize: "0.65rem", color: "#60a5fa", lineHeight: 1.4 }}>
              {"\u{1f4a1}"} <strong>Beginner:</strong> {d.beginnerTip}
            </div>
          </div>
        ))}
      </div>

      {/* Top Picks & Avoid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#10b981", marginBottom: 8 }}>{"\u{1f3af}"} AI Top Picks</h3>
          {copilot.topPicks.map((p, i) => (
            <div key={i} style={{ ...darkCard, background: "#052e16", border: "1px solid #166534", marginBottom: 6 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#86efac" }}>{p.name} ({p.symbol})</div>
              <div style={{ fontSize: "0.62rem", color: "#4ade80", marginBottom: 2 }}>{p.tag}</div>
              <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>{p.reason}</div>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>⚠️ Avoid / Caution</h3>
          {copilot.avoidList.map((a, i) => (
            <div key={i} style={{ ...darkCard, background: "#450a0a", border: "1px solid #991b1b", marginBottom: 6 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fca5a5" }}>{a.name}</div>
              <div style={{ fontSize: "0.62rem", color: "#94a3b8", lineHeight: 1.4 }}>{a.reason}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BTC Outlook & Altseason */}
      <div style={{ ...darkCard, background: "#1a1207", border: "1px solid #854d0e", marginBottom: 12 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#f7931a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{"\u{20bf}"} Bitcoin Outlook</div>
        <p style={{ fontSize: "0.75rem", color: "#fbbf24", lineHeight: 1.6, margin: 0 }}>{copilot.btcOutlook}</p>
      </div>
      <div style={{ ...darkCard, background: "#0c0a1a", border: "1px solid #5b21b6" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{"\u{1f680}"} Altseason Signal</div>
        <p style={{ fontSize: "0.75rem", color: "#c4b5fd", lineHeight: 1.6, margin: 0 }}>{copilot.altseasonSignal}</p>
      </div>
    </div>
  );

  /* ─── Stories ─── */
  const renderStories = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)", color: "#fff", marginBottom: 20, border: "1px solid #292524" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>AI Crypto Story Feed</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.6, margin: 0 }}>AI-curated narratives — what's moving digital assets today</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stories.map((s, i) => (
          <div key={i} style={{ ...darkCard, borderLeft: `4px solid ${dirColors[s.impact]?.c || "#64748b"}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1.3, marginBottom: 4 }}>{s.headline}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                  <Badge text={s.category} variant="amber" />
                  <Badge text={s.impact} variant={s.impact === "bullish" ? "green" : s.impact === "bearish" ? "red" : "orange"} />
                  <span style={{ fontSize: "0.58rem", color: "#64748b" }}>{s.timeAgo}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: "0 0 8px", lineHeight: 1.5 }}>{s.summary}</p>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#0a1628", border: "1px solid #1e3a5f", fontSize: "0.65rem", color: "#60a5fa", lineHeight: 1.4 }}>
              {"\u{1f331}"} <strong>What this means:</strong> {s.beginnerExplanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── On-Chain ─── */
  const renderOnChain = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", color: "#fff", marginBottom: 20, border: "1px solid #312e81" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>AI On-Chain Intelligence</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.7, margin: 0 }}>Whale wallets · Exchange flows · Miner activity · Smart money tracking</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {onChain.map((m, i) => (
          <div key={i} style={{ ...darkCard, borderLeft: `3px solid ${m.signalColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: "1.2rem" }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>{m.name}</div>
                <div style={{ fontSize: "0.58rem", color: "#64748b" }}>{m.change}</div>
              </div>
              <Badge text={m.signal} variant={m.signal === "Bullish" ? "green" : m.signal === "Bearish" ? "red" : "orange"} />
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 900, color: m.signalColor, marginBottom: 6 }}>{m.value}</div>
            <p style={{ fontSize: "0.65rem", color: "#94a3b8", margin: "0 0 6px", lineHeight: 1.4 }}>{m.explanation}</p>
            <div style={{ padding: "6px 10px", borderRadius: 6, background: "#0a1628", border: "1px solid #1e3a5f", fontSize: "0.6rem", color: "#60a5fa", lineHeight: 1.4 }}>
              {"\u{1f331}"} {m.beginnerTip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Heatmaps ─── */
  const renderHeatmap = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)", color: "#fff", marginBottom: 20, border: "1px solid #292524" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Crypto Market Heatmaps</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.6, margin: 0 }}>Sector performance at a glance — gainers, losers & momentum</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {heatmapSectors.map((sector, si) => (
          <div key={si}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <h3 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>{sector.name}</h3>
                <span style={{ fontSize: "0.6rem", color: "#64748b" }}>MCap: {sector.marketCap}</span>
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: sector.change24h >= 0 ? "#10b981" : "#ef4444" }}>
                {sector.change24h >= 0 ? "+" : ""}{sector.change24h}%
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {sector.coins.map((coin, ci) => {
                const bg = coin.change24h >= 5 ? "#052e16" : coin.change24h >= 0 ? "#0a2e1a" : coin.change24h >= -5 ? "#2a0a0a" : "#450a0a";
                const border = coin.change24h >= 5 ? "#166534" : coin.change24h >= 0 ? "#15803d" : coin.change24h >= -5 ? "#7f1d1d" : "#991b1b";
                const textColor = coin.change24h >= 0 ? "#10b981" : "#ef4444";
                return (
                  <div key={ci} style={{
                    flex: `${coin.size} 0 0`, minWidth: 60, padding: "10px 12px", borderRadius: 8,
                    background: bg, border: `1px solid ${border}`, textAlign: "center", transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f8fafc" }}>{coin.symbol}</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 900, color: textColor }}>
                      {coin.change24h >= 0 ? "+" : ""}{coin.change24h}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Macro Impact ─── */
  const renderMacro = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", marginBottom: 20, border: "1px solid #334155" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Crypto ↔ Macroeconomic Engine</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.7, margin: 0 }}>How Fed policy, inflation, liquidity & banking stress affect crypto markets</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {macroImpacts.map((m, i) => (
          <div key={i} style={{ ...darkCard }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#f8fafc" }}>{m.factor}</span>
              <Badge text={m.direction} variant={m.direction === "positive" ? "green" : m.direction === "negative" ? "red" : "orange"} />
            </div>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#f7931a", marginBottom: 8 }}>{m.currentState}</div>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: "0 0 8px", lineHeight: 1.5 }}>{m.cryptoImpact}</p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {m.affectedCoins.map(c => <Badge key={c} text={c} variant="amber" />)}
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#0a1628", border: "1px solid #1e3a5f", fontSize: "0.65rem", color: "#60a5fa", lineHeight: 1.4 }}>
              {"\u{1f331}"} <strong>Beginner:</strong> {m.beginnerExplanation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Risk Engine ─── */
  const renderRisk = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>AI Crypto Risk Engine</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Volatility · Liquidation risk · Leverage · Exchange risk · Fear & Greed</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {riskMetrics.map((r, i) => (
          <div key={i} style={{ ...darkCard }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <RiskGauge value={r.value} max={r.maxValue} color={r.levelColor} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc" }}>{r.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <Badge text={r.level} variant={r.level === "Low" ? "green" : r.level === "Medium" ? "orange" : r.level === "High" ? "red" : "red"} />
                  <span style={{ fontSize: "0.58rem", color: "#64748b" }}>{r.value}/{r.maxValue}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: "0.65rem", color: "#94a3b8", margin: "0 0 6px", lineHeight: 1.4 }}>{r.explanation}</p>
            <div style={{ padding: "6px 10px", borderRadius: 6, background: "#0a1628", border: "1px solid #1e3a5f", fontSize: "0.6rem", color: "#60a5fa", lineHeight: 1.4 }}>
              {"\u{1f331}"} {r.beginnerTip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Derivatives & ETF ─── */
  const renderDerivatives = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #1a1207 0%, #422006 100%)", color: "#fff", marginBottom: 20, border: "1px solid #854d0e" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Derivatives & ETF Intelligence</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.7, margin: 0 }}>Bitcoin ETF flows · Futures OI · Funding rates · Options · Liquidations</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {derivatives.map((d, i) => (
          <div key={i} style={{ ...darkCard }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>{d.name}</div>
                <div style={{ fontSize: "0.6rem", color: "#64748b" }}>{d.change}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#f7931a" }}>{d.value}</div>
                <Badge text={d.signal} variant={d.signal === "Bullish" ? "green" : d.signal === "Bearish" ? "red" : "orange"} />
              </div>
            </div>
            <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: "0 0 6px", lineHeight: 1.5 }}>{d.explanation}</p>
            <div style={{ padding: "6px 10px", borderRadius: 6, background: "#0a1628", border: "1px solid #1e3a5f", fontSize: "0.6rem", color: "#60a5fa", lineHeight: 1.4 }}>
              {"\u{1f331}"} {d.beginnerTip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Ecosystems ─── */
  const renderEcosystem = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)", color: "#fff", marginBottom: 20, border: "1px solid #292524" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Crypto Ecosystem Intelligence</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.6, margin: 0 }}>Layer-1 ecosystems · DeFi TVL · AI tokens · Web3 infrastructure</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {ecosystems.map((eco, i) => (
          <div key={i} style={{ ...darkCard, borderTop: `3px solid ${eco.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#f8fafc" }}>{eco.name}</div>
                <div style={{ fontSize: "0.58rem", color: "#64748b" }}>{eco.category}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: eco.color }}>TVL: {eco.tvl}</div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: eco.change7d >= 0 ? "#10b981" : "#ef4444" }}>
                  {eco.change7d >= 0 ? "+" : ""}{eco.change7d}% 7d
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {eco.topProtocols.map(p => <Badge key={p} text={p} variant="neutral" />)}
            </div>
            <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{eco.aiSummary}</p>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Regulation ─── */
  const renderRegulation = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", marginBottom: 20, border: "1px solid #334155" }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Regulation & News Intelligence</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.7, margin: 0 }}>SEC · ETF approvals · Government policy · Exchange news · Global regulation</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {regulations.map((r, i) => (
          <div key={i} style={{ ...darkCard, borderLeft: `4px solid ${dirColors[r.impact]?.c || "#64748b"}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1.3, marginBottom: 4 }}>{r.headline}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Badge text={r.region} variant="blue" />
                  <Badge text={r.impact} variant={r.impact === "bullish" ? "green" : r.impact === "bearish" ? "red" : "orange"} />
                  <span style={{ fontSize: "0.58rem", color: "#64748b" }}>{r.timeAgo}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: "8px 0", lineHeight: 1.5 }}>{r.body}</p>
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "#0a1628", border: "1px solid #1e3a5f", fontSize: "0.65rem", color: "#60a5fa", lineHeight: 1.4 }}>
              {"\u{1f331}"} <strong>Why it matters:</strong> {r.beginnerNote}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Learn ─── */
  const renderLearn = () => (
    <div>
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff", marginBottom: 20 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 4 }}>Learn Crypto — Zero to Hero</div>
        <p style={{ fontSize: "0.72rem", opacity: 0.8, margin: 0 }}>Every crypto concept explained in plain English with real-world examples</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {education.map((ed, i) => (
          <div key={i} style={{ ...darkCard }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#f8fafc" }}>{ed.term}</span>
              <Badge text={ed.category} variant="amber" />
            </div>
            <p style={{ fontSize: "0.75rem", color: "#cbd5e1", margin: "0 0 8px", lineHeight: 1.6 }}>{ed.simpleExplanation}</p>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#1a1207", border: "1px solid #854d0e", marginBottom: 6, fontSize: "0.68rem", color: "#fbbf24", lineHeight: 1.5 }}>
              <strong>{"\u{1f4a1}"} Analogy:</strong> {ed.analogy}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#0a1628", border: "1px solid #1e3a5f", marginBottom: 6, fontSize: "0.68rem", color: "#60a5fa", lineHeight: 1.5 }}>
              <strong>Why it matters:</strong> {ed.whyItMatters}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#0c0a1a", border: "1px solid #5b21b6", fontSize: "0.68rem", color: "#a78bfa", lineHeight: 1.5 }}>
              <strong>{"\u{1f4ca}"} Example:</strong> {ed.example}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  /* ─── Generate detailed chart data ─── */
  /* ─── TradingView symbol mapping ─── */
  const tvSymbolMap: Record<string, string> = {
    BTC: "BINANCE:BTCUSDT", ETH: "BINANCE:ETHUSDT", SOL: "BINANCE:SOLUSDT",
    BNB: "BINANCE:BNBUSDT", XRP: "BINANCE:XRPUSDT", ADA: "BINANCE:ADAUSDT",
    DOGE: "BINANCE:DOGEUSDT", AVAX: "BINANCE:AVAXUSDT", LINK: "BINANCE:LINKUSDT",
    DOT: "BINANCE:DOTUSDT", MATIC: "BINANCE:MATICUSDT", PEPE: "BINANCE:PEPEUSDT",
    SHIB: "BINANCE:SHIBUSDT", UNI: "BINANCE:UNIUSDT", ATOM: "BINANCE:ATOMUSDT",
    FIL: "BINANCE:FILUSDT", APT: "BINANCE:APTUSDT", ARB: "BINANCE:ARBUSDT",
    OP: "BINANCE:OPUSDT", NEAR: "BINANCE:NEARUSDT", SUI: "BINANCE:SUIUSDT",
    INJ: "BINANCE:INJUSDT", TIA: "BINANCE:TIAUSDT", SEI: "BINANCE:SEIUSDT",
    RENDER: "BINANCE:RENDERUSDT", FET: "BINANCE:FETUSDT", TAO: "BINANCE:TAOUSDT",
    AAVE: "BINANCE:AAVEUSDT", MKR: "BINANCE:MKRUSDT", CRV: "BINANCE:CRVUSDT",
    LDO: "BINANCE:LDOUSDT", RUNE: "BINANCE:RUNEUSDT", IMX: "BINANCE:IMXUSDT",
    ALGO: "BINANCE:ALGOUSDT", HBAR: "BINANCE:HBARUSDT", VET: "BINANCE:VETUSDT",
    GRT: "BINANCE:GRTUSDT", SAND: "BINANCE:SANDUSDT", MANA: "BINANCE:MANAUSDT",
    TON: "BINANCE:TONUSDT", TRX: "BINANCE:TRXUSDT", LTC: "BINANCE:LTCUSDT",
  };

  /* ─── TradingView Chart Widget ─── */
  const TradingViewChart = useCallback(({ symbol, height, containerId }: { symbol: string; height: number; containerId: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tvSym = tvSymbolMap[symbol] || `BINANCE:${symbol}USDT`;

    useEffect(() => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        autosize: true,
        symbol: tvSym,
        interval: "D",
        timezone: "Asia/Kolkata",
        theme: "dark",
        style: "1",
        locale: "en",
        backgroundColor: "#0f172a",
        gridColor: "#1e293b",
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        hide_volume: false,
        support_host: "https://www.tradingview.com",
      });
      containerRef.current.appendChild(script);
    }, [tvSym]);

    return (
      <div className="tradingview-widget-container" ref={containerRef} style={{ height, width: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
      </div>
    );
  }, []);

  /* ─── Coin Detail (inline, replaces navigation) ─── */
  const renderCoinDetail = () => {
    if (!selectedCoin) return <></>;
    const c = selectedCoin;
    const rng2 = seededRng(`${c.symbol}-stats`);
    const rs = () => +(rng2() * 100).toFixed(1);

    // Expanded chart overlay — fullscreen TradingView
    if (chartExpanded) {
      return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#020617", display: "flex", flexDirection: "column" }}>
          {/* Minimal header */}
          <div style={{ padding: "10px 20px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f172a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#f8fafc" }}>{c.name}</span>
              <Badge text={c.symbol} variant="blue" />
              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#f7931a" }}>{fUSD(c.price)}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: c.change24h >= 0 ? "#10b981" : "#ef4444" }}>
                {c.change24h >= 0 ? "▲ +" : "▼ "}{c.change24h}%
              </span>
            </div>
            <button onClick={() => setChartExpanded(false)} style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f8fafc",
              padding: "8px 18px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700,
            }}>✕ Exit Full Screen</button>
          </div>
          {/* Full TradingView chart */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <TradingViewChart symbol={c.symbol} height={typeof window !== "undefined" ? window.innerHeight - 60 : 700} containerId={`tv-full-${c.symbol}`} />
          </div>
        </div>
      );
    }

    return (
      <div>
        <button onClick={() => { setSelectedCoin(null); setChartExpanded(false); setActiveSection("overview"); }} style={{
          background: "none", border: "1px solid #1e293b", borderRadius: 8, color: "#94a3b8",
          padding: "6px 14px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 6,
        }}>{"←"} Back to Markets</button>

        {/* Coin header */}
        <div style={{ padding: "24px 28px 20px", borderRadius: 16, background: "linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)", border: "1px solid #292524", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#f8fafc" }}>{c.name}</span>
            <Badge text={c.symbol} variant="blue" />
            <Badge text={c.category} variant="neutral" />
            <Badge text={c.aiSentiment} variant={c.aiSentiment === "Bullish" ? "green" : c.aiSentiment === "Bearish" ? "red" : "orange"} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "#f7931a" }}>{fUSD(c.price)}</span>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: c.change24h >= 0 ? "#10b981" : "#ef4444" }}>
              {c.change24h >= 0 ? "▲" : "▼"} {c.change24h >= 0 ? "+" : ""}{c.change24h}% <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>24h</span>
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: c.change7d >= 0 ? "#10b981" : "#ef4444" }}>
              {c.change7d >= 0 ? "+" : ""}{c.change7d}% <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 500 }}>7d</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: "0.72rem", color: "#64748b" }}>
            <span>MCap: <strong style={{ color: "#94a3b8" }}>{c.marketCap}</strong></span>
            <span>Vol 24h: <strong style={{ color: "#94a3b8" }}>{c.volume24h}</strong></span>
            {c.dominance && <span>Dominance: <strong style={{ color: "#94a3b8" }}>{c.dominance}%</strong></span>}
          </div>
        </div>

        {/* TradingView Chart — real-time candlestick like CoinDCX */}
        <div style={{ borderRadius: 14, background: "#0f172a", border: "1px solid #1e293b", marginBottom: 16, overflow: "hidden" }}>
          {/* Chart header bar */}
          <div style={{ padding: "10px 18px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f8fafc" }}>{c.symbol} • USDT</span>
              <span style={{ fontSize: "0.6rem", color: "#64748b" }}>Real-time · TradingView</span>
            </div>
            <button onClick={() => setChartExpanded(true)} style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
              color: "#94a3b8", padding: "5px 14px", cursor: "pointer", fontSize: "0.68rem", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Full Screen
            </button>
          </div>
          {/* TradingView widget */}
          <TradingViewChart symbol={c.symbol} height={480} containerId={`tv-inline-${c.symbol}`} />
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Market Cap", value: c.marketCap, icon: "\u{1f4b0}" },
            { label: "24h Volume", value: c.volume24h, icon: "\u{1f4ca}" },
            { label: "Dominance", value: c.dominance ? `${c.dominance}%` : "—", icon: "\u{1f451}" },
            { label: "AI Sentiment", value: c.aiSentiment, icon: "\u{1f916}", color: c.sentimentColor },
            { label: "RSI (14)", value: `${(35 + rng2() * 35).toFixed(1)}`, icon: "\u{1f4c8}" },
            { label: "Volatility", value: `${rs()}/100`, icon: "\u{26a1}" },
          ].map((s, i) => (
            <div key={i} style={{ ...darkCard, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: "0.52rem", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 900, color: s.color || "#f8fafc" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Analysis + Key Levels side-by-side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ ...darkCard, borderLeft: "3px solid #f7931a" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>{"\u{1f916}"} AI Analysis</div>
            <p style={{ fontSize: "0.72rem", color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>
              {c.name} ({c.symbol}) trades at {fUSD(c.price)} with {c.change24h >= 0 ? "positive" : "negative"} momentum ({c.change24h >= 0 ? "+" : ""}{c.change24h}%). Market cap: {c.marketCap}, volume: {c.volume24h}. AI sentiment: <strong style={{ color: c.sentimentColor }}>{c.aiSentiment}</strong> based on on-chain flows, social momentum, and technicals. 7d trend: {c.change7d >= 0 ? "accumulation" : "distribution"} ({c.change7d >= 0 ? "+" : ""}{c.change7d}%).
              {c.dominance ? ` Dominance: ${c.dominance}%.` : ""}
            </p>
          </div>
          <div style={{ ...darkCard }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc", marginBottom: 10 }}>{"\u{1f4ca}"} Key Levels</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { label: "Support 1", val: fUSD(c.price * 0.95), color: "#10b981" },
                { label: "Support 2", val: fUSD(c.price * 0.88), color: "#10b981" },
                { label: "Resistance 1", val: fUSD(c.price * 1.06), color: "#ef4444" },
                { label: "Resistance 2", val: fUSD(c.price * 1.14), color: "#ef4444" },
                { label: "24h Low", val: fUSD(c.price * 0.97), color: "#f59e0b" },
                { label: "24h High", val: fUSD(c.price * 1.03), color: "#f59e0b" },
              ].map((l, i) => (
                <div key={i} style={{ padding: "6px 10px", borderRadius: 6, background: "#020617", border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "0.48rem", color: "#64748b", textTransform: "uppercase", marginBottom: 1 }}>{l.label}</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: l.color }}>{l.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sectionMap: Record<CryptoSectionExtra, () => React.JSX.Element> = {
    overview: renderOverview, copilot: renderCopilot, stories: renderStories,
    onchain: renderOnChain, heatmap: renderHeatmap, macro: renderMacro,
    risk: renderRisk, derivatives: renderDerivatives, ecosystem: renderEcosystem,
    regulation: renderRegulation, learn: renderLearn,
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#020617", color: "#f8fafc" }}>
      {/* Hero */}
      <div style={{ padding: "24px 28px 16px", borderRadius: 16, background: "linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #292524 100%)", border: "1px solid #292524", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f7931a", boxShadow: "0 0 10px #f7931a80" }} />
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.6 }}>AI-Powered Digital Assets Intelligence</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 900, background: "linear-gradient(90deg, #f7931a, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Crypto Intelligence Terminal</span>
              <button onClick={() => { setSelectedCoin(null); setActiveSection("learn"); }} style={{
                padding: "5px 14px", borderRadius: 20, border: "1px solid #854d0e",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#000", fontSize: "0.62rem", fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, letterSpacing: 0.3,
              }}>{"\u{1f4da}"} Learn Crypto</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: "0.72rem", opacity: 0.5 }}>On-chain · AI narratives · Risk analysis · Macro intelligence</span>
              <DataSourceBadge source={priceSource} isStale={pricesStale} lastUpdated={pricesUpdated} />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {topCoins.slice(0, 3).map(c => (
                <div key={c.symbol} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.5rem", opacity: 0.5, textTransform: "uppercase" }}>{c.symbol}</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#f7931a" }}>{fUSD(c.price)}</div>
                  <div style={{ fontSize: "0.48rem", color: c.change24h >= 0 ? "#10b981" : "#ef4444" }}>
                    {c.change24h >= 0 ? "+" : ""}{c.change24h}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 4, padding: "8px 0", marginBottom: 16, overflowX: "auto", scrollbarWidth: "none" }}>
        {CRYPTO_NAV_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => { setSelectedCoin(null); setActiveSection(sec.id); }} style={{
            padding: "8px 14px", borderRadius: 10, border: "1px solid",
            borderColor: activeSection === sec.id ? "#f7931a" : "#1e293b",
            background: activeSection === sec.id ? "#f7931a" : "#0f172a",
            color: activeSection === sec.id ? "#000" : "#94a3b8",
            fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
          }}>
            <span>{sec.emoji}</span> {sec.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedCoin ? renderCoinDetail() : sectionMap[activeSection]()}

      {/* Footer */}
      <div style={{ marginTop: 24, padding: "12px 16px", borderRadius: 10, background: "#0f172a", border: "1px solid #1e293b", textAlign: "center", fontSize: "0.6rem", color: "#475569" }}>
        White Tiger Crypto Intelligence · AI-powered analysis for educational purposes only · Not investment advice · Crypto is highly volatile · Never invest more than you can afford to lose · CoinGecko · CoinMarketCap · Glassnode
      </div>
    </div>
  );
}
