"use client";
import { useState, useMemo } from "react";
import { calculateSIP, formatINR } from "@/app/beginner/utils/calculations";
import { COLORS, card, SectionHeader, AIExplanation, RiskMeter, StatCard, Disclaimer, UpsellBanner, Accordion, InfoQA } from "./shared";
import { LearnTerm } from "./LearnTooltips";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER MUTUAL FUNDS TAB
   "Wealth Building for Beginners"
   SIP calculator, beginner funds, AI recommendations.
   ═══════════════════════════════════════════════════════════════ */

const BEGINNER_FUNDS = [
  { name: "UTI Nifty 50 Index Fund", type: "Index Fund", risk: "medium" as const, returns: "12.5%", nav: "132.45", rating: 5, emoji: "📊", why: "Tracks India's top 50 companies. The simplest way to invest in the entire market. Very low cost (0.1% expense ratio)." },
  { name: "HDFC Balanced Advantage Fund", type: "Hybrid Fund", risk: "medium" as const, returns: "11.2%", nav: "387.20", rating: 4, emoji: "⚖️", why: "Automatically balances between stocks and bonds based on market conditions. Less risky than pure equity funds." },
  { name: "SBI Small Cap Fund", type: "Small Cap", risk: "high" as const, returns: "18.4%", nav: "168.90", rating: 4, emoji: "🚀", why: "Invests in smaller growing companies. Higher risk but potentially higher returns. Best for 7+ year investment horizon." },
  { name: "Axis Liquid Fund", type: "Liquid Fund", risk: "low" as const, returns: "6.8%", nav: "2,456.10", rating: 4, emoji: "💧", why: "Park emergency money here instead of savings account. Slightly better returns than FD, and you can withdraw anytime." },
  { name: "Parag Parikh Flexi Cap Fund", type: "Flexi Cap", risk: "medium" as const, returns: "15.1%", nav: "72.35", rating: 5, emoji: "🌍", why: "Invests in Indian + international stocks (Google, Alphabet, Microsoft). Great diversification across geographies." },
  { name: "ICICI Prudential Retirement Fund", type: "Retirement", risk: "medium" as const, returns: "13.2%", nav: "34.80", rating: 4, emoji: "🏖️", why: "Designed for retirement planning with 5-year lock-in. Automatic asset allocation based on your age." },
];

export default function BeginnerMF() {
  const [sipAmount, setSipAmount] = useState(5000);
  const [sipReturn, setSipReturn] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  const sipResult = useMemo(() => calculateSIP(sipAmount, sipReturn, sipYears), [sipAmount, sipReturn, sipYears]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <AIExplanation
        emoji="🚌"
        text="Mutual Funds pool money from thousands of investors and a professional manager invests it for you. Think of it as hiring an expert driver for your investment journey. You don't need to pick stocks yourself — the fund manager does it. Start with just ₹500/month via SIP!"
      />

      {/* ── KEY CONCEPTS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { emoji: "💰", term: "SIP", desc: "Invest fixed amount monthly", detail: "Like Netflix subscription but for wealth" },
          { emoji: "🏷️", term: "NAV", desc: "Price per unit of fund", detail: "Changes daily based on performance" },
          { emoji: "📈", term: "CAGR", desc: "Average yearly return", detail: "Smooths out ups and downs" },
          { emoji: "💸", term: "Expense Ratio", desc: "Fund's annual fee", detail: "Lower is better (0.1% to 2%)" },
        ].map(c => (
          <div key={c.term} style={{ ...card({ padding: "14px" }) }}>
            <div style={{ fontSize: "1.1rem", marginBottom: 4 }}>{c.emoji}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.accent, marginBottom: 2 }}>{c.term}</div>
            <div style={{ fontSize: "0.68rem", color: COLORS.textPrimary, fontWeight: 600, marginBottom: 2 }}>{c.desc}</div>
            <div style={{ fontSize: "0.58rem", color: COLORS.textMuted }}>{c.detail}</div>
          </div>
        ))}
      </div>

      {/* ── SIP CALCULATOR ── */}
      <div style={{ ...card() }}>
        <SectionHeader emoji="📈" title="SIP Calculator" subtitle="See how your money can grow" />

        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
          {[
            { label: "Monthly SIP Amount", value: sipAmount, min: 500, max: 50000, step: 500, set: setSipAmount, fmt: (v: number) => `₹${v.toLocaleString("en-IN")}`, minLabel: "₹500", maxLabel: "₹50,000" },
            { label: "Expected Annual Return", value: sipReturn, min: 8, max: 18, step: 1, set: setSipReturn, fmt: (v: number) => `${v}%`, minLabel: "8%", maxLabel: "18%" },
            { label: "Investment Period", value: sipYears, min: 1, max: 30, step: 1, set: setSipYears, fmt: (v: number) => `${v} years`, minLabel: "1 yr", maxLabel: "30 yrs" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: "0.72rem", color: COLORS.textMuted, fontWeight: 600 }}>{s.label}</label>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.accent }}>{s.fmt(s.value)}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={e => s.set(+e.target.value)}
                style={{ width: "100%", accentColor: COLORS.accent, height: 6, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.52rem", color: COLORS.textGhost }}>
                <span>{s.minLabel}</span><span>{s.maxLabel}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <StatCard label="Invested" value={`₹${formatINR(sipResult.totalInvested)}`} />
          <StatCard label="Returns" value={`₹${formatINR(sipResult.estimatedReturns)}`} color="#34d399" />
          <StatCard label="Total Value" value={`₹${formatINR(sipResult.totalValue)}`} color={COLORS.accent} />
        </div>

        {/* Growth chart */}
        <div style={{ height: 80, marginBottom: 12 }}>
          <svg viewBox={`0 0 ${sipResult.chartData.length * 20} 80`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
            {(() => {
              const data = sipResult.chartData;
              const maxVal = Math.max(...data.map(d => d.value), 1);
              const investedPts = data.map((d, i) => `${i * 20},${80 - (d.invested / maxVal) * 72}`).join(" ");
              const valuePts = data.map((d, i) => `${i * 20},${80 - (d.value / maxVal) * 72}`).join(" ");
              const w = (data.length - 1) * 20;
              return (<>
                <defs><linearGradient id="mfSipGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <polygon points={`0,80 ${valuePts} ${w},80`} fill="url(#mfSipGrad)" />
                <polyline points={valuePts} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                <polyline points={investedPts} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />
              </>);
            })()}
          </svg>
        </div>

        <AIExplanation
          text={sipResult.totalValue >= 1e7
            ? `A ₹${sipAmount.toLocaleString("en-IN")} monthly SIP can make you a crorepati in ${sipYears} years! The power of compounding is real.`
            : `Your money grows ${Math.round(sipResult.totalValue / sipResult.totalInvested)}x with the power of compounding! Start early — even small amounts matter.`
          }
        />
        <Disclaimer text="Projected returns are estimates. Actual returns may vary." />
      </div>

      {/* ── RECOMMENDED FUNDS ── */}
      <div>
        <SectionHeader emoji="⭐" title="Beginner-Friendly Funds" subtitle="AI-picked funds for new investors" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BEGINNER_FUNDS.map(fund => (
            <div key={fund.name} style={{ ...card({ padding: "16px" }) }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.3rem" }}>{fund.emoji}</span>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>{fund.name}</div>
                    <span style={{ fontSize: "0.55rem", padding: "2px 6px", borderRadius: 4, background: COLORS.purpleSoft, color: COLORS.purple, fontWeight: 600 }}>{fund.type}</span>
                  </div>
                </div>
                <RiskMeter level={fund.risk} />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <div style={{ fontSize: "0.62rem", color: COLORS.textDim }}>Returns: <span style={{ color: COLORS.accent, fontWeight: 700 }}>{fund.returns}/yr</span></div>
                <div style={{ fontSize: "0.62rem", color: COLORS.textDim }}>NAV: <span style={{ fontWeight: 700, color: COLORS.textPrimary }}>₹{fund.nav}</span></div>
                <div style={{ fontSize: "0.62rem", color: COLORS.textDim }}>Rating: <span style={{ color: COLORS.amber }}>{"★".repeat(fund.rating)}{"☆".repeat(5 - fund.rating)}</span></div>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 8, background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}` }}>
                <p style={{ fontSize: "0.68rem", color: COLORS.accent, margin: 0, lineHeight: 1.5 }}>🤖 {fund.why}</p>
              </div>
            </div>
          ))}
        </div>
        <Disclaimer />
      </div>

      {/* ── FAQ ── */}
      <div>
        <SectionHeader emoji="❓" title="Common Questions" />
        <Accordion items={[
          { title: "What is the minimum amount to start?", emoji: "💵", content: "Most mutual funds allow SIP starting from just ₹500/month. Some even allow ₹100. You don't need lakhs to start — begin small and increase gradually." },
          { title: "Are mutual funds safe?", emoji: "🛡️", content: "Mutual funds are regulated by SEBI and managed by professionals. While equity funds have market risk, they've historically given good returns over 5+ years. Liquid and debt funds are relatively safer." },
          { title: "How do I choose a fund?", emoji: "🎯", content: "For beginners: Start with a NIFTY 50 Index Fund (low cost, tracks the market). Add a Flexi Cap fund for diversification. Keep it simple with 2-3 funds maximum." },
          { title: "When can I withdraw my money?", emoji: "🏧", content: "Open-ended funds: Withdraw anytime (1-3 business days). ELSS funds: 3-year lock-in (but save tax). Liquid funds: Same day or next day. No penalty for withdrawal after exit load period." },
        ]} />
      </div>

      <UpsellBanner text="Access detailed fund comparisons and institutional analysis in Advanced Mode" />
    </div>
  );
}
