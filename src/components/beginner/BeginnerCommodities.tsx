"use client";
import { useState, useMemo } from "react";
import { useCommodityPrices } from "@/hooks/useMarketData";
import { COLORS, card, SectionHeader, AIExplanation, RiskMeter, Disclaimer, UpsellBanner, Accordion } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER COMMODITIES TAB
   Gold, oil, silver, food — how they affect daily life.
   ═══════════════════════════════════════════════════════════════ */

const COMMODITIES_DATA = [
  {
    symbol: "GOLD", name: "Gold", emoji: "🥇", color: "#f59e0b", unit: "/oz",
    risk: "low" as const,
    dailyImpact: "Gold prices affect jewellery costs, gold loan interest rates, and your mother's gold investment value.",
    whyItMoves: "Gold rises when: inflation is high, rupee weakens, global uncertainty increases, central banks buy gold. Gold falls when: stock markets rally strongly, interest rates rise.",
    investTip: "Best way for beginners: Sovereign Gold Bonds (SGBs) — you get 2.5% annual interest + gold price appreciation, and capital gains are tax-free at maturity.",
  },
  {
    symbol: "CRUDEOIL", name: "Crude Oil", emoji: "🛢️", color: "#64748b", unit: "/barrel",
    risk: "very-high" as const,
    dailyImpact: "Oil prices directly affect petrol, diesel, flight tickets, delivery charges, and almost everything you buy (because transportation costs go up).",
    whyItMoves: "Oil rises when: OPEC cuts production, wars in oil-producing regions, strong global demand. Oil falls when: global slowdown, OPEC increases supply, new green energy adoption.",
    investTip: "For beginners: Don't trade crude oil directly — it's extremely volatile. Instead, invest in oil company stocks like ONGC, Reliance, or IOC for indirect exposure.",
  },
  {
    symbol: "SILVER", name: "Silver", emoji: "🥈", color: "#94a3b8", unit: "/oz",
    risk: "medium" as const,
    dailyImpact: "Silver is both a precious metal and an industrial metal. It's used in electronics, solar panels, and medical devices. More volatile than gold.",
    whyItMoves: "Silver follows gold but with more volatility. Also rises when: industrial demand increases, solar energy boom. Falls when: economic slowdown reduces industrial demand.",
    investTip: "Silver is more volatile than gold — prices can swing 3-5% in a single day. For beginners, gold is a safer choice. If you want silver, use Silver ETFs.",
  },
  {
    symbol: "NATURALGAS", name: "Natural Gas", emoji: "🔥", color: "#06b6d4", unit: "/mmBtu",
    risk: "very-high" as const,
    dailyImpact: "Natural gas prices affect: cooking gas (PNG/CNG), electricity bills, fertilizer costs (which affect food prices). India imports a lot of natural gas.",
    whyItMoves: "Rises when: cold winters increase heating demand, supply disruptions, geopolitical tensions. Falls when: mild weather, increased production, LNG oversupply.",
    investTip: "Natural gas is one of the most volatile commodities. Not suitable for beginners to trade directly. GAIL India stock gives indirect exposure.",
  },
];

const DAILY_LIFE_IMPACTS = [
  { emoji: "🍞", item: "Food Prices", text: "When wheat, rice, and edible oil commodity prices rise, your grocery bill goes up within weeks.", connection: "Commodity → Wholesaler → Retailer → Your kitchen" },
  { emoji: "⛽", item: "Petrol/Diesel", text: "Crude oil price directly determines pump prices. A $10/barrel increase = roughly ₹5-7/litre increase.", connection: "Crude Oil → Refineries → Petrol Pumps → Your vehicle" },
  { emoji: "💍", item: "Jewellery", text: "Gold prices determine how much that wedding jewellery costs. A 10% gold price rise = 10%+ increase in jewellery bill.", connection: "Gold futures → Bullion dealers → Jewellers → Your purchase" },
  { emoji: "💡", item: "Electricity", text: "Natural gas and coal prices affect power generation costs, which eventually flow into your electricity bills.", connection: "Coal/Gas → Power Plants → Distribution → Your meter" },
  { emoji: "✈️", item: "Flight Tickets", text: "Jet fuel (from crude oil) is 30-40% of airline costs. When oil rises, airlines increase ticket prices.", connection: "Crude Oil → Jet Fuel → Airlines → Your ticket price" },
];

export default function BeginnerCommodities() {
  const { data: livePrices } = useCommodityPrices();
  const [expandedCommodity, setExpandedCommodity] = useState<string | null>(null);

  const commodities = useMemo(() => {
    return COMMODITIES_DATA.map(c => {
      const live = livePrices[c.symbol];
      return { ...c, price: live?.price || 0, change: live?.changePercent || 0 };
    });
  }, [livePrices]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <AIExplanation
        emoji="🌾"
        text="Commodities are raw materials that power the world — gold, oil, silver, wheat, cotton. Their prices affect everything from your grocery bill to flight tickets. Understanding commodities helps you see why everyday prices change and how to protect your wealth against inflation."
      />

      {/* ── COMMODITY CARDS ── */}
      <div>
        <SectionHeader emoji="📦" title="Key Commodities" subtitle="Live prices with real-world explanations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {commodities.map(c => {
            const isOpen = expandedCommodity === c.symbol;
            return (
              <div key={c.symbol} onClick={() => setExpandedCommodity(isOpen ? null : c.symbol)} style={{
                ...card({ padding: "16px", cursor: "pointer", transition: "all 0.2s" }),
                borderColor: isOpen ? `${c.color}40` : COLORS.cardBorder,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>{c.emoji}</div>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800 }}>{c.name}</div>
                      <RiskMeter level={c.risk} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {c.price > 0 ? (
                      <>
                        <div style={{ fontSize: "1rem", fontWeight: 900 }}>${c.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: "0.62rem", color: COLORS.textDim }}>{c.unit}</div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: c.change >= 0 ? COLORS.accent : COLORS.red }}>
                          {c.change >= 0 ? "▲" : "▼"} {Math.abs(c.change).toFixed(2)}%
                        </div>
                      </>
                    ) : <div style={{ fontSize: "0.72rem", color: COLORS.textDim }}>Loading...</div>}
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.divider}`, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: COLORS.accent, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>&#127968; How it affects your life</div>
                      <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>{c.dailyImpact}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.62rem", color: COLORS.amber, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>&#128200; Why it moves</div>
                      <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>{c.whyItMoves}</p>
                    </div>
                    <AIExplanation emoji="💡" text={c.investTip} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Disclaimer />
      </div>

      {/* ── DAILY LIFE IMPACT CHAIN ── */}
      <div>
        <SectionHeader emoji="🔗" title="From Market to Your Pocket" subtitle="How commodity prices reach you" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DAILY_LIFE_IMPACTS.map((item, i) => (
            <div key={i} style={{ ...card({ padding: "16px" }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: "1.3rem" }}>{item.emoji}</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{item.item}</div>
              </div>
              <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{item.text}</p>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.02)", border: `1px solid ${COLORS.cardBorder}` }}>
                <div style={{ fontSize: "0.58rem", color: COLORS.textDim, fontWeight: 600, marginBottom: 2 }}>THE CHAIN:</div>
                <div style={{ fontSize: "0.65rem", color: COLORS.accent, fontWeight: 600 }}>{item.connection}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div>
        <SectionHeader emoji="❓" title="Common Questions" />
        <Accordion items={[
          { title: "Should I invest in gold?", emoji: "🥇", content: "Yes! Gold is a great inflation hedge and portfolio diversifier. Allocate 10-15% of your portfolio to gold. Best options: Sovereign Gold Bonds (SGBs) — 2.5% annual interest + gold returns + tax-free capital gains at maturity. Gold ETFs are the second best option." },
          { title: "Can I trade commodities directly?", emoji: "📊", content: "Yes, through MCX (Multi Commodity Exchange) via your broker. But commodity futures trading involves leverage and is very risky. For beginners: invest in commodity ETFs or stocks of commodity companies instead of trading futures directly." },
          { title: "Why is gold considered safe?", emoji: "🛡️", content: "Gold has been valued for 5,000+ years. It holds value during wars, recessions, and currency crises. When everything else falls, gold usually rises. Indian families hold about 25,000 tonnes of gold — it's deeply cultural and financial." },
        ]} />
      </div>

      <UpsellBanner text="Access real-time commodity intelligence and MCX analytics in Advanced Mode" />
    </div>
  );
}
