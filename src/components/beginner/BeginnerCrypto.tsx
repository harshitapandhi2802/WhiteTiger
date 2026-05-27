"use client";
import { useState, useMemo } from "react";
import { useCryptoPrices } from "@/hooks/useMarketData";
import { COLORS, card, SectionHeader, AIExplanation, RiskMeter, Disclaimer, UpsellBanner, Accordion } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER CRYPTO TAB v4 — IMMERSIVE DASHBOARD
   Large cards, fullscreen chart modal, AI analysis panel,
   modern CoinDCX/Binance-Lite inspired experience.
   ═══════════════════════════════════════════════════════════════ */

const CRYPTO_GUIDE = [
  { symbol: "BTC", name: "Bitcoin", emoji: "₿", color: "#f7931a", risk: "high" as const, tradingView: "BINANCE:BTCUSDT",
    desc: "The first and largest cryptocurrency. Like digital gold — limited supply of 21 million coins. Created in 2009 by the mysterious Satoshi Nakamoto.",
    verdict: "The safest crypto bet for beginners. Think of it as a 5-10 year investment in digital store of value.",
    whyMoving: "Bitcoin moves based on global investor sentiment, institutional adoption (ETF flows), regulation news, and macroeconomic conditions like interest rates.",
    whatMeans: "If Bitcoin is going up, it usually means big investors are confident about crypto's future. If it's falling, it could be short-term profit-taking — not necessarily bad for long-term holders." },
  { symbol: "ETH", name: "Ethereum", emoji: "⟠", color: "#627eea", risk: "high" as const, tradingView: "BINANCE:ETHUSDT",
    desc: "The second largest crypto. Not just money — it powers apps, NFTs, and DeFi. Think of Bitcoin as gold and Ethereum as a tech company.",
    verdict: "Strong technology backing. Most real-world crypto applications run on Ethereum.",
    whyMoving: "Ethereum moves with Bitcoin but also reacts to DeFi activity, NFT trends, network upgrades, and Layer-2 adoption rates.",
    whatMeans: "When Ethereum rises, it often means developers and businesses are building more blockchain applications. It's a bet on the future of decentralized technology." },
  { symbol: "SOL", name: "Solana", emoji: "◎", color: "#14f195", risk: "very-high" as const, tradingView: "BINANCE:SOLUSDT",
    desc: "A faster, cheaper alternative to Ethereum. Popular with developers building new apps. Known for speed but has had outage issues.",
    verdict: "Higher risk, higher potential reward. Only invest if you understand and accept the volatility.",
    whyMoving: "Solana moves based on ecosystem growth, new app launches, network reliability, and competition with Ethereum.",
    whatMeans: "Solana rising means its app ecosystem is growing. But network outages in the past are a risk — it's like investing in a promising but young tech startup." },
  { symbol: "XRP", name: "XRP", emoji: "✕", color: "#00aae4", risk: "very-high" as const, tradingView: "BINANCE:XRPUSDT",
    desc: "Designed for fast international money transfers. Used by some banks for cross-border payments. Had legal issues with SEC in the US.",
    verdict: "Risky due to regulatory uncertainty. Not recommended for beginners.",
    whyMoving: "XRP moves heavily based on legal developments (SEC lawsuit), bank partnerships, and cross-border payment adoption.",
    whatMeans: "XRP is closely tied to regulatory news. A favorable court ruling can spike it 30%+ overnight. High risk, unpredictable — better suited for experienced investors." },
  { symbol: "BNB", name: "BNB", emoji: "◆", color: "#f3ba2f", risk: "high" as const, tradingView: "BINANCE:BNBUSDT",
    desc: "Binance's own token. Used to pay fees on the world's largest crypto exchange. Its value is tied to Binance's success.",
    verdict: "Tied to one company's success. Useful if you trade on Binance, but concentrated risk.",
    whyMoving: "BNB moves based on Binance exchange volume, new token launches on BNB Chain, and regulatory actions against Binance.",
    whatMeans: "BNB rising means Binance is doing well as a business. But if regulators crack down on Binance, BNB could fall sharply — it's tied to one company." },
  { symbol: "DOGE", name: "Dogecoin", emoji: "🐕", color: "#c2a633", risk: "very-high" as const, tradingView: "BINANCE:DOGEUSDT",
    desc: "Started as a joke but became one of the top cryptocurrencies. Often moves based on social media trends and celebrity endorsements.",
    verdict: "Extremely speculative. Only invest money you're fully prepared to lose. Not recommended for serious investing.",
    whyMoving: "Dogecoin moves based on social media hype, Elon Musk's tweets, and meme culture. It has no fundamental technology advantage.",
    whatMeans: "When Dogecoin pumps, it's usually hype-driven. These pumps often crash back down quickly. Treat it as entertainment, not investment." },
];

/* ── Fullscreen Coin Analysis Modal ───────────────────────────── */
function CoinAnalysis({ coin, onClose }: {
  coin: typeof CRYPTO_GUIDE[0] & { price: number; change: number; volume: number };
  onClose: () => void;
}) {
  const [timeframe, setTimeframe] = useState("1D");
  const timeframes = ["1H", "4H", "1D", "1W", "1M", "3M", "1Y"];
  const intervalMap: Record<string, string> = { "1H": "60", "4H": "240", "1D": "D", "1W": "W", "1M": "M", "3M": "M", "1Y": "M" };
  const rangeMap: Record<string, string> = { "1H": "1D", "4H": "5D", "1D": "3M", "1W": "6M", "1M": "12M", "3M": "36M", "1Y": "60M" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "stretch", justifyContent: "center",
      padding: "12px",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 1200, borderRadius: 20,
        background: "#ffffff", overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "row",
        animation: "cryptoModalIn 0.3s ease-out",
      }}>
        {/* ── LEFT: Chart Area (75%) ── */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", borderRight: `1px solid ${COLORS.divider}` }}>
          {/* Chart header */}
          <div style={{
            padding: "16px 24px", borderBottom: `1px solid ${COLORS.divider}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: `${coin.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.4rem", fontWeight: 800, color: coin.color,
              }}>{coin.emoji}</div>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: COLORS.textPrimary }}>{coin.name}</div>
                <div style={{ fontSize: "0.72rem", color: COLORS.textDim }}>{coin.symbol}/USDT</div>
              </div>
              <div style={{ marginLeft: 12 }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: COLORS.textPrimary }}>
                  &#8377;{coin.price >= 100 ? coin.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : coin.price.toFixed(2)}
                </div>
                <span style={{
                  fontSize: "0.82rem", fontWeight: 700,
                  color: coin.change >= 0 ? COLORS.accent : COLORS.red,
                }}>
                  {coin.change >= 0 ? "▲" : "▼"} {Math.abs(coin.change).toFixed(2)}%
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 40, height: 40, borderRadius: 12, background: COLORS.bg,
              border: "none", cursor: "pointer", fontSize: "1.1rem", color: COLORS.textDim,
            }}>&#10005;</button>
          </div>

          {/* Timeframe selector */}
          <div style={{ padding: "10px 24px", display: "flex", gap: 6, borderBottom: `1px solid ${COLORS.dividerLight}` }}>
            {timeframes.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid",
                borderColor: timeframe === tf ? COLORS.accent : COLORS.cardBorder,
                background: timeframe === tf ? COLORS.accentSoft : "transparent",
                color: timeframe === tf ? COLORS.accent : COLORS.textMuted,
                fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
              }}>{tf}</button>
            ))}
          </div>

          {/* TradingView Chart — takes remaining space */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <iframe
              key={`${coin.tradingView}-${timeframe}`}
              src={`https://s.tradingview.com/widgetembed/?symbol=${coin.tradingView}&interval=${intervalMap[timeframe] || "D"}&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=ffffff&studies=MASimple%7B20%7D&theme=light&style=1&timezone=Asia%2FKolkata&withdateranges=1&showpopupbutton=0&locale=en&range=${rangeMap[timeframe] || "3M"}`}
              style={{ width: "100%", height: "100%", border: "none" }}
              loading="eager"
              title={`${coin.name} chart`}
            />
          </div>
        </div>

        {/* ── RIGHT: AI Analysis Panel (25%) ── */}
        <div style={{
          flex: 1, minWidth: 280, maxWidth: 360,
          overflowY: "auto", padding: "20px",
          display: "flex", flexDirection: "column", gap: 16,
          background: COLORS.bg,
        }}>
          {/* Quick stats */}
          <div>
            <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Quick Stats</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Current Price", value: `₹${coin.price >= 100 ? coin.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : coin.price.toFixed(2)}` },
                { label: "24h Change", value: `${coin.change >= 0 ? "+" : ""}${coin.change.toFixed(2)}%`, color: coin.change >= 0 ? COLORS.accent : COLORS.red },
                { label: "24h Volume", value: coin.volume > 0 ? `₹${(coin.volume / 10000000).toFixed(1)} Cr` : "N/A" },
              ].map(s => (
                <div key={s.label} style={{ padding: "10px 14px", borderRadius: 12, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
                  <div style={{ fontSize: "0.58rem", color: COLORS.textDim, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: s.color || COLORS.textPrimary }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk meter */}
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
            <div style={{ fontSize: "0.62rem", color: COLORS.textDim, fontWeight: 600, marginBottom: 8 }}>RISK LEVEL</div>
            <RiskMeter level={coin.risk} />
          </div>

          {/* Sentiment meter */}
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
            <div style={{ fontSize: "0.62rem", color: COLORS.textDim, fontWeight: 600, marginBottom: 8 }}>MARKET SENTIMENT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: coin.change > 2 ? COLORS.greenSoft : coin.change < -2 ? COLORS.redSoft : COLORS.amberSoft,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem",
              }}>
                {coin.change > 2 ? "😊" : coin.change < -2 ? "😟" : "😐"}
              </div>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: coin.change > 2 ? COLORS.accent : coin.change < -2 ? COLORS.red : COLORS.amber }}>
                  {coin.change > 2 ? "Greedy" : coin.change < -2 ? "Fearful" : "Neutral"}
                </div>
                <div style={{ fontSize: "0.6rem", color: COLORS.textDim }}>Fear & Greed Indicator</div>
              </div>
            </div>
          </div>

          {/* AI explanation */}
          <div>
            <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>AI Explanation</h3>
            <AIExplanation emoji="🤖" text={coin.verdict} />
          </div>

          {/* Why is it moving */}
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.textPrimary, marginBottom: 6 }}>Why is {coin.name} moving?</div>
            <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.65, margin: 0 }}>{coin.whyMoving}</p>
          </div>

          {/* What this means */}
          <div style={{
            padding: "14px 16px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(251,191,36,0.02))",
            border: "1px solid rgba(245,158,11,0.12)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: "0.85rem" }}>&#128161;</span>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, color: COLORS.amber, textTransform: "uppercase" }}>What This Means For You</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.65, margin: 0 }}>{coin.whatMeans}</p>
          </div>

          {/* About */}
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.textPrimary, marginBottom: 6 }}>About {coin.name}</div>
            <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.65, margin: 0 }}>{coin.desc}</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cryptoModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (max-width: 768px) {
          .crypto-analysis-modal > div:first-child {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function BeginnerCrypto() {
  const { data: liveCrypto, loading } = useCryptoPrices();
  const [selectedCoin, setSelectedCoin] = useState<(typeof CRYPTO_GUIDE[0] & { price: number; change: number; volume: number }) | null>(null);

  const cryptoWithPrices = useMemo(() => {
    return CRYPTO_GUIDE.map(c => {
      const live = liveCrypto[c.symbol];
      return {
        ...c,
        price: live?.inr || 0,
        change: live?.change24h || 0,
        volume: live?.volume24h || 0,
      };
    });
  }, [liveCrypto]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {selectedCoin && <CoinAnalysis coin={selectedCoin} onClose={() => setSelectedCoin(null)} />}

      <AIExplanation
        emoji="⛓️"
        text="Cryptocurrency is digital money that works without banks. It uses blockchain technology — a transparent, secure ledger that records every transaction. While crypto can give high returns, it's extremely volatile. Only invest money you can afford to lose completely, and never more than 5-10% of your total portfolio."
      />

      {/* ── SAFETY TIPS ── */}
      <div style={{
        ...card({ background: "linear-gradient(135deg, rgba(239,68,68,0.04), rgba(245,158,11,0.02))", border: "1px solid rgba(239,68,68,0.12)", padding: "24px" }),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: "1.3rem" }}>&#9888;&#65039;</span>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0, color: COLORS.amber }}>Beginner Safety Tips</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "&#10005;", text: "Never invest more than you can afford to lose" },
            { icon: "&#10005;", text: "Stick to Bitcoin and Ethereum — avoid meme coins" },
            { icon: "&#10005;", text: "Don't chase FOMO pumps" },
            { icon: "&#10005;", text: "India taxes crypto profits at 30%" },
            { icon: "&#10005;", text: "Use only regulated exchanges" },
            { icon: "&#10005;", text: "Never share your wallet seed phrase" },
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.75rem", color: COLORS.red, fontWeight: 700, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: tip.icon }} />
              <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.5 }}>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── LARGE CRYPTO CARDS ── */}
      <div>
        <SectionHeader emoji="🪙" title="Live Cryptocurrency Prices" subtitle="Tap any coin for fullscreen chart + AI analysis" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cryptoWithPrices.map(coin => (
            <div
              key={coin.symbol}
              onClick={() => setSelectedCoin(coin)}
              style={{
                ...card({ padding: "20px 24px", cursor: "pointer" }),
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `${coin.color}12`, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", fontWeight: 800, color: coin.color,
                }}>{coin.emoji}</div>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: 2 }}>{coin.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.68rem", color: COLORS.textDim, fontWeight: 600 }}>{coin.symbol}</span>
                    <RiskMeter level={coin.risk} />
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 20 }}>
                {/* Mini sparkline placeholder */}
                <div style={{ width: 80, height: 36, borderRadius: 8, overflow: "hidden", opacity: 0.8 }}>
                  <iframe
                    src={`https://s.tradingview.com/embed-widget/mini-symbol-overview/?symbol=${coin.tradingView}&dateRange=1D&trendLineColor=${encodeURIComponent(coin.change >= 0 ? "#059669" : "#dc2626")}&underLineColor=${encodeURIComponent(coin.change >= 0 ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)")}&underLineBottomColor=${encodeURIComponent("rgba(0,0,0,0)")}&isTransparent=true&autosize=true&locale=en`}
                    style={{ width: 120, height: 80, border: "none", pointerEvents: "none", marginTop: -20, marginLeft: -20 }}
                    loading="lazy"
                    title={`${coin.symbol} mini`}
                  />
                </div>

                <div>
                  {coin.price > 0 ? (
                    <>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900 }}>
                        &#8377;{coin.price >= 100 ? coin.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : coin.price.toFixed(2)}
                      </div>
                      <div style={{
                        fontSize: "0.78rem", fontWeight: 700,
                        color: coin.change >= 0 ? COLORS.accent : COLORS.red,
                      }}>
                        {coin.change >= 0 ? "▲" : "▼"} {Math.abs(coin.change).toFixed(2)}%
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: COLORS.textDim }}>Loading...</div>
                  )}
                </div>

                <div style={{ fontSize: "0.72rem", color: COLORS.accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  View <span>&#8594;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Disclaimer />
      </div>

      {/* ── CRYPTO CONCEPTS ── */}
      <div>
        <SectionHeader emoji="🎓" title="Crypto Concepts Simplified" />
        <Accordion items={[
          { title: "What is Blockchain?", emoji: "⛓️", content: "Imagine a shared Google Sheet that everyone can see but no one can cheat on. Every transaction is recorded in a 'block' and linked to the previous block, creating a 'chain.' This makes it nearly impossible to fake transactions." },
          { title: "What is Mining?", emoji: "⛏️", content: "Mining is like solving a very hard math puzzle. Computers compete to solve it, and the winner gets to add the next block of transactions and earns Bitcoin as a reward. This is what keeps the network running and secure." },
          { title: "What is a Wallet?", emoji: "👛", content: "A crypto wallet stores your private keys — the passwords that prove you own your crypto. There are 'hot wallets' (apps, online) and 'cold wallets' (hardware devices). Never share your seed phrase — it's like your bank password." },
          { title: "Why does crypto price change so much?", emoji: "🎢", content: "Crypto has no company profits, dividends, or assets backing it. Prices move based on: supply and demand, Elon Musk's tweets, government regulations, global economic fears, and pure speculation. This is why it's so volatile." },
          { title: "Is crypto legal in India?", emoji: "🇮🇳", content: "Yes, crypto is legal in India but heavily taxed. You pay 30% tax on any profits with no deductions for losses. There's also 1% TDS on every transaction above ₹10,000. It's legal to buy, sell, and hold crypto." },
        ]} />
      </div>

      <UpsellBanner text="Access live crypto intelligence and advanced charts in Advanced Mode" />
    </div>
  );
}
