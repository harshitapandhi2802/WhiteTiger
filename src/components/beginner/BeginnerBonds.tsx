"use client";
import { useMemo } from "react";
import { useBondYields } from "@/hooks/useMarketData";
import { COLORS, card, SectionHeader, AIExplanation, RiskMeter, StatCard, Disclaimer, UpsellBanner, Accordion, InfoQA } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER BONDS TAB
   Visual storytelling about bonds, yields, RBI rates.
   "Bonds are basically loans given to governments."
   ═══════════════════════════════════════════════════════════════ */

const BOND_TYPES = [
  { name: "Government Bonds (G-Sec)", emoji: "🏛️", risk: "low" as const, returns: "7.0-7.5%", lock: "5-40 years", minInvest: "₹10,000", desc: "Loans to the Indian government. Safest investment possible — the government guarantees repayment. Returns are moderate but very reliable.", who: "Very conservative investors, retirees, or anyone wanting guaranteed returns." },
  { name: "RBI Floating Rate Bond", emoji: "🇮🇳", risk: "low" as const, returns: "8.05%", lock: "7 years", minInvest: "₹1,000", desc: "Special bonds from RBI where the interest rate changes with market conditions. Currently giving better returns than FDs. Zero default risk.", who: "Anyone looking for safe, inflation-beating returns. Great alternative to bank FDs." },
  { name: "Corporate Bonds (AAA)", emoji: "🏢", risk: "medium" as const, returns: "8-10%", lock: "1-5 years", minInvest: "₹10,000", desc: "Loans to top companies like HDFC, Reliance, TCS. Slightly higher returns than government bonds because there's a small chance the company could default (very rare for AAA-rated ones).", who: "Investors comfortable with slightly more risk for better returns." },
  { name: "Tax-Free Bonds", emoji: "🎁", risk: "low" as const, returns: "5.5-6%", lock: "10-20 years", minInvest: "₹1,000", desc: "Government-backed bonds where interest earned is completely tax-free. The effective return is actually higher than it looks because you don't pay tax on it.", who: "High-income earners in 30% tax bracket. The 6% tax-free equals 8.5% pre-tax return." },
  { name: "SGBs (Sovereign Gold Bonds)", emoji: "🥇", risk: "low" as const, returns: "2.5% + gold price", lock: "8 years", minInvest: "₹4,800", desc: "Government bonds linked to gold price. You earn 2.5% annual interest PLUS benefit from gold price appreciation. No making charges, no storage worries, and capital gains are tax-free at maturity.", who: "Anyone who wants gold exposure without physical gold hassle. Best way to invest in gold." },
];

const INFLATION_COMPARISON = [
  { label: "Savings Account", rate: 3.5, color: "#ef4444" },
  { label: "Bank FD (1yr)", rate: 6.5, color: "#f59e0b" },
  { label: "G-Sec Bond", rate: 7.2, color: COLORS.accent },
  { label: "RBI Bond", rate: 8.05, color: "#10b981" },
  { label: "Corporate Bond", rate: 9.0, color: "#34d399" },
];

export default function BeginnerBonds() {
  const { data: liveBonds } = useBondYields();

  const indiaYield = useMemo(() => {
    const india = liveBonds["IN_10Y"];
    return india?.yield || 7.18;
  }, [liveBonds]);

  const usYield = useMemo(() => {
    const us = liveBonds["US_10Y"];
    return us?.yield || 4.25;
  }, [liveBonds]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <AIExplanation
        emoji="🏛️"
        text="Bonds are basically loans. When you buy a bond, you're lending money to the government or a company. In return, they pay you regular interest (like rent on your money) and return your principal at maturity. Bonds are safer than stocks but give lower returns. They're the foundation of a balanced portfolio."
      />

      {/* ── VISUAL STORYTELLING ── */}
      <div style={{ ...card({ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.04))", border: `1px solid ${COLORS.accentBorder}` }) }}>
        <h3 style={{ fontSize: "0.88rem", fontWeight: 800, marginBottom: 14, color: COLORS.accent }}>&#128161; How Bonds Work — A Simple Story</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { step: "1", emoji: "🤝", text: "You lend ₹10,000 to the Government of India" },
            { step: "2", emoji: "📅", text: "Government promises to pay you 7.2% interest every year" },
            { step: "3", emoji: "💰", text: "You receive ₹720 every year as interest income" },
            { step: "4", emoji: "🎯", text: "After the bond matures (say 10 years), you get your ₹10,000 back" },
            { step: "5", emoji: "🧮", text: "Total earned: ₹10,000 (principal) + ₹7,200 (interest) = ₹17,200" },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, flexShrink: 0 }}>{s.step}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1rem" }}>{s.emoji}</span>
                <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.4 }}>{s.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LIVE YIELDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ ...card({ textAlign: "center" }) }}>
          <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>🇮🇳</div>
          <div style={{ fontSize: "0.6rem", color: COLORS.textDim, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>India 10-Year Bond</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.accent }}>{indiaYield.toFixed(2)}%</div>
          <div style={{ fontSize: "0.58rem", color: COLORS.textMuted, marginTop: 2 }}>Annual yield</div>
        </div>
        <div style={{ ...card({ textAlign: "center" }) }}>
          <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>🇺🇸</div>
          <div style={{ fontSize: "0.6rem", color: COLORS.textDim, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>US 10-Year Bond</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.blue }}>{usYield.toFixed(2)}%</div>
          <div style={{ fontSize: "0.58rem", color: COLORS.textMuted, marginTop: 2 }}>Annual yield</div>
        </div>
      </div>

      {/* ── INFLATION BATTLE ── */}
      <div style={{ ...card() }}>
        <SectionHeader emoji="⚔️" title="Can Bonds Beat Inflation?" subtitle="Current inflation in India: ~5-6%" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {INFLATION_COMPARISON.map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "0.68rem", color: COLORS.textMuted, width: 120, flexShrink: 0 }}>{item.label}</span>
              <div style={{ flex: 1, height: 20, borderRadius: 4, background: "rgba(0,0,0,0.03)", overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${(item.rate / 10) * 100}%`, height: "100%", borderRadius: 4, background: item.color, transition: "width 0.8s ease" }} />
                {/* Inflation line */}
                <div style={{ position: "absolute", left: "55%", top: 0, bottom: 0, width: 2, background: "#ef444480", borderRight: "1px dashed #ef4444" }} />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: item.color, width: 40 }}>{item.rate}%</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <div style={{ width: 12, height: 2, background: "#ef4444" }} />
            <span style={{ fontSize: "0.55rem", color: COLORS.textDim }}>Inflation (~5.5%)</span>
          </div>
        </div>
        <AIExplanation text="Anything below the red inflation line means you're actually LOSING money in real terms. Savings accounts barely keep up with inflation. Bonds and FDs usually beat inflation, giving you real returns." />
      </div>

      {/* ── BOND TYPES ── */}
      <div>
        <SectionHeader emoji="📋" title="Types of Bonds in India" subtitle="Tap to learn which one is right for you" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BOND_TYPES.map(bond => (
            <div key={bond.name} style={{ ...card({ padding: "16px" }) }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.3rem" }}>{bond.emoji}</span>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>{bond.name}</div>
                </div>
                <RiskMeter level={bond.risk} />
              </div>
              <p style={{ fontSize: "0.72rem", color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{bond.desc}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {[
                  { l: "Returns", v: bond.returns },
                  { l: "Lock-in", v: bond.lock },
                  { l: "Min. Invest", v: bond.minInvest },
                ].map(tag => (
                  <span key={tag.l} style={{ fontSize: "0.55rem", padding: "3px 8px", borderRadius: 6, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textDim }}>
                    {tag.l}: <span style={{ color: COLORS.accent, fontWeight: 700 }}>{tag.v}</span>
                  </span>
                ))}
              </div>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: COLORS.purpleSoft, border: `1px solid ${COLORS.purpleBorder}` }}>
                <span style={{ fontSize: "0.62rem", color: COLORS.purple, fontWeight: 600 }}>&#128100; Best for: {bond.who}</span>
              </div>
            </div>
          ))}
        </div>
        <Disclaimer />
      </div>

      {/* ── FAQ ── */}
      <div>
        <SectionHeader emoji="❓" title="Bond Questions Answered" />
        <Accordion items={[
          { title: "Why do bond prices fall when interest rates rise?", emoji: "📉", content: "Imagine you own a bond paying 7%. If new bonds start paying 8%, nobody wants your 7% bond at full price. So its price drops to make the effective yield competitive. This is called 'interest rate risk.' It only matters if you sell before maturity — if you hold till maturity, you get your full principal back." },
          { title: "How do I buy bonds in India?", emoji: "🛒", content: "RBI Retail Direct: Open a free account at rbiretaildirect.org.in to buy G-Secs and T-Bills directly from RBI. Stock exchanges: Buy corporate bonds and SGBs through your Demat account. Mutual funds: Invest in debt mutual funds which hold a basket of bonds." },
          { title: "Bonds vs FDs — which is better?", emoji: "⚖️", content: "FDs: Simple, guaranteed returns, bank deposit insurance up to ₹5L. Bonds: Often higher returns, tax advantages (SGBs, tax-free bonds), tradeable on exchanges. For beginners: FDs are simpler. For higher returns and tax savings: explore bonds." },
        ]} />
      </div>

      <UpsellBanner text="Access global bond intelligence and yield curve analysis in Advanced Mode" />
    </div>
  );
}
