"use client";
import { useState, useMemo } from "react";
import { useForexRates } from "@/hooks/useMarketData";
import { COLORS, card, SectionHeader, AIExplanation, Disclaimer, UpsellBanner, Accordion } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER FOREX TAB v4 — IMMERSIVE CURRENCY DASHBOARD
   Large cards, fullscreen chart modal, live converter,
   macro context, and AI explanations.
   ═══════════════════════════════════════════════════════════════ */

const CURRENCIES = [
  { pair: "USDINR", from: "USD", to: "INR", label: "US Dollar", emoji: "🇺🇸", fallback: 83.45, tradingView: "FX_IDC:USDINR", color: "#3b82f6",
    whyMoving: "USD/INR moves based on US Federal Reserve interest rate decisions, India's trade deficit, oil prices, and FII investment flows into Indian markets.",
    whatMeans: "When the dollar strengthens against the rupee, your foreign trips become more expensive, imported goods cost more, and petrol prices may rise. A weaker dollar is generally good for the Indian economy." },
  { pair: "EURINR", from: "EUR", to: "INR", label: "Euro", emoji: "🇪🇺", fallback: 90.20, tradingView: "FX_IDC:EURINR", color: "#6366f1",
    whyMoving: "EUR/INR moves based on European Central Bank decisions, Eurozone economic health, and relative strength of the dollar.",
    whatMeans: "The Euro affects students studying in Europe and anyone buying European products. When EUR/INR rises, European travel and education becomes costlier." },
  { pair: "GBPINR", from: "GBP", to: "INR", label: "British Pound", emoji: "🇬🇧", fallback: 105.80, tradingView: "FX_IDC:GBPINR", color: "#dc2626",
    whyMoving: "GBP/INR is influenced by Bank of England rate decisions, UK economic data, and Brexit-related developments.",
    whatMeans: "The pound matters for UK education aspirants and IT companies with UK clients. A rising GBP means higher fees for UK universities." },
  { pair: "JPYINR", from: "JPY", to: "INR", label: "Japanese Yen (per 100)", emoji: "🇯🇵", fallback: 0.56, tradingView: "FX_IDC:JPYINR", color: "#ef4444",
    whyMoving: "JPY/INR moves based on Bank of Japan's ultra-low interest rate policy, carry trade dynamics, and Japanese economic data.",
    whatMeans: "The yen is considered a safe-haven currency. When global markets are fearful, money flows into yen. A strong yen can make Japanese cars and electronics cheaper." },
  { pair: "AEDINR", from: "AED", to: "INR", label: "UAE Dirham", emoji: "🇦🇪", fallback: 22.72, tradingView: "FX_IDC:AEDINR", color: "#059669",
    whyMoving: "AED is pegged to the USD, so AED/INR mostly follows USD/INR. Oil prices also play a role since UAE is a major oil exporter.",
    whatMeans: "This rate matters hugely for Indian workers in Gulf countries sending money home. A stronger AED means more rupees for every dirham they send." },
  { pair: "SGDINR", from: "SGD", to: "INR", label: "Singapore Dollar", emoji: "🇸🇬", fallback: 62.30, tradingView: "FX_IDC:SGDINR", color: "#8b5cf6",
    whyMoving: "SGD/INR is influenced by Singapore's monetary policy (which manages the currency band), Asian economic conditions, and tech sector performance.",
    whatMeans: "Important for IT professionals working in Singapore. A stronger SGD means more value when sending money back to India." },
];

const IMPACT_EXAMPLES = [
  { emoji: "✈️", title: "Travelling to USA?", text: "If USD/INR goes from ₹83 to ₹85, your US trip becomes 2.4% more expensive. A $2000 budget would cost ₹4,000 more." },
  { emoji: "📱", title: "Buying an iPhone?", text: "Apple prices iPhones in USD. When rupee weakens, Apple may increase India prices. A ₹2 rupee fall = ₹1,500-2,000 increase in iPhone price." },
  { emoji: "⛽", title: "Petrol price going up?", text: "India imports 85% of its oil (priced in USD). When rupee weakens against dollar, oil becomes more expensive, pushing up petrol and diesel prices." },
  { emoji: "🎓", title: "Studying abroad?", text: "If you're planning to study in UK/US, a weaker rupee means higher fees in INR. Many students start SIP in foreign currency funds to hedge this risk." },
];

/* ── Fullscreen Forex Analysis Modal ──────────────────────────── */
function ForexAnalysis({ pair, onClose }: {
  pair: typeof CURRENCIES[0] & { rate: number; change: number };
  onClose: () => void;
}) {
  const [timeframe, setTimeframe] = useState("1D");
  const [convertAmount, setConvertAmount] = useState("1000");
  const [convertDir, setConvertDir] = useState<"to" | "from">("to"); // to = FROM→INR, from = INR→FROM
  const timeframes = ["1H", "4H", "1D", "1W", "1M", "3M", "1Y"];
  const intervalMap: Record<string, string> = { "1H": "60", "4H": "240", "1D": "D", "1W": "W", "1M": "M", "3M": "M", "1Y": "M" };
  const rangeMap: Record<string, string> = { "1H": "1D", "4H": "5D", "1D": "3M", "1W": "6M", "1M": "12M", "3M": "36M", "1Y": "60M" };

  const convertedValue = useMemo(() => {
    const num = parseFloat(convertAmount) || 0;
    if (convertDir === "to") return (num * pair.rate).toFixed(2);
    return (num / pair.rate).toFixed(2);
  }, [convertAmount, convertDir, pair.rate]);

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
        animation: "forexModalIn 0.3s ease-out",
      }}>
        {/* ── LEFT: Chart (75%) ── */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", borderRight: `1px solid ${COLORS.divider}` }}>
          <div style={{
            padding: "16px 24px", borderBottom: `1px solid ${COLORS.divider}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: "2rem" }}>{pair.emoji}</span>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{pair.label}</div>
                <div style={{ fontSize: "0.72rem", color: COLORS.textDim }}>{pair.from}/INR</div>
              </div>
              <div style={{ marginLeft: 12 }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>&#8377;{pair.rate.toFixed(2)}</div>
                <span style={{
                  fontSize: "0.82rem", fontWeight: 700,
                  color: pair.change >= 0 ? COLORS.accent : COLORS.red,
                }}>
                  {pair.change >= 0 ? "▲" : "▼"} {Math.abs(pair.change).toFixed(2)}%
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 40, height: 40, borderRadius: 12, background: COLORS.bg,
              border: "none", cursor: "pointer", fontSize: "1.1rem", color: COLORS.textDim,
            }}>&#10005;</button>
          </div>

          <div style={{ padding: "10px 24px", display: "flex", gap: 6, borderBottom: `1px solid ${COLORS.dividerLight}` }}>
            {timeframes.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid",
                borderColor: timeframe === tf ? pair.color : COLORS.cardBorder,
                background: timeframe === tf ? `${pair.color}10` : "transparent",
                color: timeframe === tf ? pair.color : COLORS.textMuted,
                fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
              }}>{tf}</button>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <iframe
              key={`${pair.tradingView}-${timeframe}`}
              src={`https://s.tradingview.com/widgetembed/?symbol=${pair.tradingView}&interval=${intervalMap[timeframe] || "D"}&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=ffffff&theme=light&style=3&timezone=Asia%2FKolkata&withdateranges=1&showpopupbutton=0&locale=en&range=${rangeMap[timeframe] || "3M"}`}
              style={{ width: "100%", height: "100%", border: "none" }}
              loading="eager"
              title={`${pair.label} chart`}
            />
          </div>
        </div>

        {/* ── RIGHT: Analysis Panel (25%) ── */}
        <div style={{
          flex: 1, minWidth: 280, maxWidth: 360,
          overflowY: "auto", padding: "20px",
          display: "flex", flexDirection: "column", gap: 16,
          background: COLORS.bg,
        }}>
          {/* Live converter */}
          <div style={{ padding: "16px", borderRadius: 14, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Currency Converter</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: "0.6rem", color: COLORS.textDim, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  {convertDir === "to" ? pair.from : "INR"}
                </label>
                <input type="number" value={convertAmount} onChange={e => setConvertAmount(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: COLORS.bg, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textPrimary, fontSize: "1rem", fontWeight: 700, outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={() => setConvertDir(d => d === "to" ? "from" : "to")} style={{
                alignSelf: "center", width: 32, height: 32, borderRadius: "50%",
                background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`,
                cursor: "pointer", fontSize: "0.9rem", color: COLORS.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>&#8645;</button>
              <div style={{ padding: "14px", borderRadius: 12, background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`, textAlign: "center" }}>
                <div style={{ fontSize: "0.55rem", color: COLORS.textDim, marginBottom: 2 }}>{convertDir === "to" ? "INR" : pair.from}</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: COLORS.accent }}>
                  {convertDir === "to" ? "₹" : ""}{parseFloat(convertedValue).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  {convertDir === "from" ? ` ${pair.from}` : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Current Rate", value: `₹${pair.rate.toFixed(2)}` },
              { label: "24h Change", value: `${pair.change >= 0 ? "+" : ""}${pair.change.toFixed(2)}%`, color: pair.change >= 0 ? COLORS.accent : COLORS.red },
            ].map(s => (
              <div key={s.label} style={{ padding: "10px 14px", borderRadius: 12, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
                <div style={{ fontSize: "0.58rem", color: COLORS.textDim, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: s.color || COLORS.textPrimary }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Why is it moving */}
          <div>
            <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Why is it moving?</h3>
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
              <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.65, margin: 0 }}>{pair.whyMoving}</p>
            </div>
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
            <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.65, margin: 0 }}>{pair.whatMeans}</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes forexModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */
export default function BeginnerForex() {
  const { data: liveForex, loading } = useForexRates();
  const [selectedPair, setSelectedPair] = useState<(typeof CURRENCIES[0] & { rate: number; change: number }) | null>(null);
  const [fromAmount, setFromAmount] = useState("1000");
  const [activePair, setActivePair] = useState("USDINR");

  const rates = useMemo(() => {
    return CURRENCIES.map(c => {
      const live = liveForex[c.pair];
      return { ...c, rate: live?.rate || c.fallback, change: live?.change24h || 0 };
    });
  }, [liveForex]);

  const selected = rates.find(r => r.pair === activePair) || rates[0];
  const converted = useMemo(() => {
    const num = parseFloat(fromAmount) || 0;
    return (num * selected.rate).toFixed(2);
  }, [fromAmount, selected.rate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {selectedPair && <ForexAnalysis pair={selectedPair} onClose={() => setSelectedPair(null)} />}

      <AIExplanation
        emoji="💱"
        text="Forex (Foreign Exchange) is the market where currencies are traded. When you travel abroad, buy imported goods, or pay for international services, you're using forex. The USD/INR rate affects everything from petrol prices to iPhone costs. Understanding forex helps you make smarter financial decisions."
      />

      {/* ── LARGE CURRENCY CONVERTER ── */}
      <div style={{ ...card({ padding: "28px" }) }}>
        <SectionHeader emoji="🔄" title="Currency Converter" subtitle="Convert any amount instantly with live rates" />
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: "0.72rem", color: COLORS.textDim, fontWeight: 600, display: "block", marginBottom: 6 }}>Amount ({selected.from})</label>
            <input type="number" value={fromAmount} onChange={e => setFromAmount(e.target.value)}
              style={{ width: "100%", padding: "14px 18px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textPrimary, fontSize: "1.3rem", fontWeight: 800, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ fontSize: "1.5rem", color: COLORS.textDim }}>&#8594;</div>
          <div style={{ flex: 1, minWidth: 200, padding: "20px", borderRadius: 16, background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`, textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", color: COLORS.textDim, marginBottom: 4 }}>You get (INR)</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: COLORS.accent }}>&#8377;{parseFloat(converted).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: "0.68rem", color: COLORS.textMuted, marginTop: 6 }}>Rate: 1 {selected.from} = &#8377;{selected.rate.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* ── LARGE CURRENCY CARDS ── */}
      <div>
        <SectionHeader emoji="🌍" title="Live Currency Rates" subtitle="Tap any currency for fullscreen chart + analysis" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rates.map(r => (
            <div key={r.pair} style={{
              ...card({ padding: "20px 24px", cursor: "pointer" }),
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderColor: activePair === r.pair ? r.color + "30" : COLORS.cardBorder,
              background: activePair === r.pair ? r.color + "05" : "#ffffff",
            }}
              onClick={() => { setActivePair(r.pair); setSelectedPair(r); }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: "2.2rem" }}>{r.emoji}</span>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: "0.68rem", color: COLORS.textDim, fontWeight: 600 }}>{r.from}/INR</div>
                </div>
              </div>

              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 20 }}>
                <div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900 }}>&#8377;{r.rate.toFixed(2)}</div>
                  <div style={{
                    fontSize: "0.78rem", fontWeight: 700,
                    color: r.change >= 0 ? COLORS.accent : COLORS.red,
                  }}>
                    {r.change >= 0 ? "▲" : "▼"} {Math.abs(r.change).toFixed(2)}%
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", color: r.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  Chart <span>&#8594;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Disclaimer />
      </div>

      {/* ── REAL WORLD IMPACT — LARGER ── */}
      <div>
        <SectionHeader emoji="🏷️" title="How Forex Affects Your Life" subtitle="Real-world examples you can relate to" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {IMPACT_EXAMPLES.map((ex, i) => (
            <div key={i} style={{ ...card({ padding: "20px" }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: "1.5rem" }}>{ex.emoji}</span>
                <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>{ex.title}</div>
              </div>
              <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.65, margin: 0 }}>{ex.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY CURRENCIES MOVE ── */}
      <div>
        <SectionHeader emoji="📚" title="Why Do Currencies Move?" />
        <Accordion items={[
          { title: "Interest Rates (RBI vs Fed)", emoji: "🏦", content: "When India's RBI raises interest rates, foreign investors bring money to India for better returns, increasing demand for INR and strengthening it. When the US Fed raises rates, money flows out of India, weakening the rupee." },
          { title: "Trade Balance", emoji: "⚖️", content: "India imports more than it exports (especially oil). This means India needs more dollars than the world needs rupees. More demand for dollars = weaker rupee. When oil prices rise, INR usually weakens." },
          { title: "Foreign Investment (FII/FDI)", emoji: "🌍", content: "When foreign investors buy Indian stocks, they convert USD to INR (rupee strengthens). When they sell and take money out, they convert INR to USD (rupee weakens). FII flows have huge impact on INR." },
          { title: "Inflation", emoji: "📈", content: "If India's inflation is higher than the US, Indian goods become relatively expensive, exports fall, and the rupee weakens. Low inflation = stable currency. This is why RBI targets 4% inflation." },
        ]} />
      </div>

      <UpsellBanner text="Access professional forex analytics and live pair charts in Advanced Mode" />
    </div>
  );
}
