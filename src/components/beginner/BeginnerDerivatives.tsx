"use client";
import { useState } from "react";
import { COLORS, card, SectionHeader, AIExplanation, RiskMeter, Disclaimer, UpsellBanner, Accordion } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER DERIVATIVES TAB
   Options & Futures basics explained simply.
   NO gamma, Greeks, or institutional quant systems.
   Focus on education, risk awareness, and hedging concepts.
   ═══════════════════════════════════════════════════════════════ */

const DERIVATIVE_TYPES = [
  {
    name: "Futures",
    emoji: "📅",
    color: "#6366f1",
    oneLiner: "An agreement to buy/sell at a set price on a future date",
    story: "Imagine you're a farmer growing wheat. You're worried that by harvest time (3 months later), wheat prices might drop. So you make a deal TODAY with a buyer: \"I'll sell you 100 kg of wheat at ₹25/kg in 3 months.\" This is a futures contract! Both parties are OBLIGATED to honor the deal.",
    realWorld: [
      "Farmers lock in crop prices before harvest",
      "Airlines lock in fuel prices months ahead",
      "Companies hedge against currency fluctuations",
    ],
    risk: "very-high" as const,
    warning: "Futures involve leverage — small price moves cause big gains/losses. A 2% market move can wipe out 20-50% of your capital. 95% of retail futures traders lose money.",
  },
  {
    name: "Options",
    emoji: "📋",
    color: "#a855f7",
    oneLiner: "The RIGHT (not obligation) to buy/sell at a set price",
    story: "Imagine you want to buy a flat worth ₹50 lakh. You pay ₹1 lakh as a booking token (premium). Now you have the RIGHT to buy for ₹50L within 3 months. If prices rise to ₹55L — great, you exercise your option and save ₹5L! If prices fall to ₹45L — you walk away and only lose the ₹1L token. This is how options work!",
    realWorld: [
      "Buying insurance is like buying an option (you pay premium for protection)",
      "Booking a hotel with free cancellation is like having an option",
      "EMI lock-in at a fixed rate is like a futures contract",
    ],
    risk: "very-high" as const,
    warning: "90% of option buyers lose money. Option premiums decay daily (time decay). SEBI data shows retail traders lost ₹51,000 crore in F&O in FY24. Beginners should NOT trade options.",
  },
];

const HEDGING_EXAMPLES = [
  { emoji: "🌾", title: "Farmer's Hedge", desc: "A wheat farmer uses futures to lock in selling price at ₹2,500/quintal. Even if market drops to ₹2,000 by harvest, he gets his guaranteed price. He gives up upside but protects against downside." },
  { emoji: "✈️", title: "Airline Fuel Hedge", desc: "IndiGo buys fuel futures for next 6 months at $80/barrel. If oil spikes to $100, they still pay $80. If oil drops to $60, they overpay — but at least costs are predictable for planning." },
  { emoji: "📊", title: "Portfolio Protection", desc: "You own ₹10L in NIFTY stocks and worry about a crash. You buy a NIFTY put option for ₹15,000 (insurance premium). If NIFTY drops 10%, your stocks lose ₹1L but your option makes ₹85,000 — limiting loss to ₹30K." },
];

const STRATEGIES_SIMPLIFIED = [
  { name: "Buy & Hold (No Derivatives Needed)", emoji: "🐢", risk: "low" as const, desc: "Just buy good stocks/MFs and hold for years. No options or futures needed. This beats 95% of derivative traders over the long term.", recommended: true },
  { name: "Protective Put (Insurance)", emoji: "🛡️", risk: "medium" as const, desc: "Buy a put option on stocks you own. Like buying insurance — you pay a small premium but limit your maximum loss if prices crash.", recommended: false },
  { name: "Covered Call (Extra Income)", emoji: "💰", risk: "medium" as const, desc: "Sell call options on stocks you already own. You earn premium income but cap your upside. Only for experienced investors who own the underlying stock.", recommended: false },
];

export default function BeginnerDerivatives() {
  const [expandedType, setExpandedType] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── STRONG WARNING ── */}
      <div style={{
        ...card({ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.06))", border: "1px solid rgba(239,68,68,0.2)" }),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: "1.5rem" }}>&#9888;&#65039;</span>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: COLORS.red }}>Important Warning for Beginners</div>
            <div style={{ fontSize: "0.62rem", color: COLORS.amber, fontWeight: 600 }}>Read this before exploring derivatives</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "SEBI data: 93% of individual F&O traders incurred losses in FY24",
            "Retail traders lost a combined ₹51,000 crore in derivatives",
            "Derivatives use leverage — losses can exceed your investment",
            "This section is for LEARNING only — not a recommendation to trade",
          ].map((point, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: COLORS.red, fontSize: "0.72rem", flexShrink: 0 }}>&#9679;</span>
              <span style={{ fontSize: "0.72rem", color: COLORS.textSecondary, lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>
      </div>

      <AIExplanation
        emoji="🎓"
        text="Derivatives are financial contracts whose value is 'derived' from something else (stocks, indices, commodities). They're like betting on the direction of prices without actually owning the asset. While professionals use them for hedging (insurance), most retail traders lose money. Learn the concepts, but don't trade until you have 3+ years of investing experience."
      />

      {/* ── FUTURES & OPTIONS EXPLAINED ── */}
      <div>
        <SectionHeader emoji="📚" title="Understanding Derivatives" subtitle="Simple explanations with real-world stories" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DERIVATIVE_TYPES.map(dt => {
            const isOpen = expandedType === dt.name;
            return (
              <div key={dt.name} onClick={() => setExpandedType(isOpen ? null : dt.name)} style={{
                ...card({ padding: "20px", cursor: "pointer", transition: "all 0.2s" }),
                borderColor: isOpen ? `${dt.color}40` : COLORS.cardBorder,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${dt.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{dt.emoji}</div>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{dt.name}</div>
                      <RiskMeter level={dt.risk} />
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: COLORS.textDim, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>&#9660;</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, margin: 0 }}>{dt.oneLiner}</p>

                {isOpen && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.divider}`, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: `${dt.color}`, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>&#128214; Real-World Story</div>
                      <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.7, margin: 0, padding: "12px 14px", borderRadius: 10, background: "rgba(0,0,0,0.02)" }}>{dt.story}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: COLORS.accent, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>&#127758; Real-World Examples</div>
                      {dt.realWorld.map((ex, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                          <span style={{ color: COLORS.accent, fontSize: "0.62rem" }}>&#10003;</span>
                          <span style={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>{ex}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: COLORS.redSoft, border: "1px solid rgba(239,68,68,0.15)" }}>
                      <span style={{ fontSize: "0.72rem", color: COLORS.red, fontWeight: 600 }}>&#9888;&#65039; {dt.warning}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HEDGING = INSURANCE ── */}
      <div>
        <SectionHeader emoji="🛡️" title="Hedging = Insurance for Investments" subtitle="The ONLY legitimate use of derivatives for most people" />
        <AIExplanation text="Hedging means protecting your existing investments from losses. It's like buying car insurance — you pay a small premium to protect against a big loss. Professionals use derivatives for hedging, NOT for speculation." />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {HEDGING_EXAMPLES.map((ex, i) => (
            <div key={i} style={{ ...card({ padding: "16px" }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: "1.3rem" }}>{ex.emoji}</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{ex.title}</div>
              </div>
              <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>{ex.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHAT SHOULD BEGINNERS DO? ── */}
      <div>
        <SectionHeader emoji="🎯" title="What Should Beginners Do?" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {STRATEGIES_SIMPLIFIED.map(s => (
            <div key={s.name} style={{
              ...card({ padding: "16px" }),
              borderColor: s.recommended ? COLORS.accentBorder : COLORS.cardBorder,
              background: s.recommended ? COLORS.accentSoft : COLORS.card,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.1rem" }}>{s.emoji}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{s.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <RiskMeter level={s.risk} />
                  {s.recommended && <span style={{ fontSize: "0.5rem", padding: "2px 6px", borderRadius: 4, background: COLORS.accent, color: "#fff", fontWeight: 700 }}>RECOMMENDED</span>}
                </div>
              </div>
              <p style={{ fontSize: "0.72rem", color: COLORS.textSecondary, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div>
        <SectionHeader emoji="❓" title="Common Questions" />
        <Accordion items={[
          { title: "Can I make money trading options?", emoji: "💸", content: "Statistically, no. 93% of retail F&O traders lose money according to SEBI. The winners are usually institutional traders with sophisticated algorithms, deep pockets, and years of experience. If you still want to try: start paper trading first, never risk more than 2% of capital per trade, and have at least 3 years of investing experience." },
          { title: "What is lot size?", emoji: "📦", content: "In F&O, you can't buy 1 share — you must buy in 'lots.' For example, NIFTY lot size is 25. If NIFTY is at 24,000, one lot = ₹6,00,000 worth of NIFTY. With leverage (margin), you might only need ₹1-2 lakh to take this position. This leverage is what makes derivatives dangerous." },
          { title: "When should I learn derivatives?", emoji: "⏰", content: "NOT now. First: invest in stocks and mutual funds for 2-3 years. Understand market cycles, volatility, and your own risk tolerance. Then: study derivatives theory (Black-Scholes, Greeks, strategies). Finally: paper trade for 6 months before using real money. Most successful derivative traders have 5+ years of market experience." },
          { title: "What about crypto derivatives?", emoji: "₿", content: "Crypto derivatives are even MORE dangerous than equity derivatives. They're unregulated, operate 24/7 (no circuit breakers), and offer 100x leverage. Some exchanges have been scams. Avoid entirely as a beginner." },
        ]} />
      </div>

      <Disclaimer text="Derivatives are complex instruments with high risk. This is educational content only. Not a recommendation to trade." />
      <UpsellBanner text="Access institutional-grade derivatives intelligence and option chain analysis in Advanced Mode" />
    </div>
  );
}
