"use client";
import { useState, useMemo } from "react";
import { COLORS, card, SectionHeader, AIExplanation, WhatThisMeansCard, StatCard, Disclaimer, UpsellBanner, Accordion, PillTabs } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER TAX TAB v2 — AI-POWERED TAX & SAVINGS ASSISTANT
   Interactive calculators, visual savings, regime comparison,
   tax-saving investments, AI explanations.
   ═══════════════════════════════════════════════════════════════ */

/* ── Tax Slabs ───────────────────────────────────────────────── */
const TAX_SLABS_NEW = [
  { range: "₹0 - ₹3L", rate: 0, color: "#10b981", label: "0%" },
  { range: "₹3L - ₹7L", rate: 5, color: "#34d399", label: "5%" },
  { range: "₹7L - ₹10L", rate: 10, color: "#f59e0b", label: "10%" },
  { range: "₹10L - ₹12L", rate: 15, color: "#f97316", label: "15%" },
  { range: "₹12L - ₹15L", rate: 20, color: "#ef4444", label: "20%" },
  { range: "Above ₹15L", rate: 30, color: "#dc2626", label: "30%" },
];

const TAX_SLABS_OLD = [
  { range: "₹0 - ₹2.5L", rate: 0, color: "#10b981", label: "0%" },
  { range: "₹2.5L - ₹5L", rate: 5, color: "#34d399", label: "5%" },
  { range: "₹5L - ₹10L", rate: 20, color: "#f59e0b", label: "20%" },
  { range: "Above ₹10L", rate: 30, color: "#dc2626", label: "30%" },
];

/* ── Tax Saving Investments ──────────────────────────────────── */
interface TaxSavingOption {
  name: string; emoji: string; section: string; limit: string;
  lockIn: string; returns: string; risk: "Low" | "Medium" | "High";
  bestFor: string; howItWorks: string; taxBenefit: string;
  color: string;
}

const TAX_SAVING_OPTIONS: TaxSavingOption[] = [
  { name: "ELSS Mutual Funds", emoji: "📈", section: "80C", limit: "₹1.5 lakh", lockIn: "3 years", returns: "12-15%", risk: "High", bestFor: "Best tax-saving option. Shortest lock-in with highest potential returns.", howItWorks: "Invest in equity mutual funds specifically designed for tax saving. Your money grows with the stock market while saving you tax.", taxBenefit: "Deduction up to ₹1.5L from taxable income under Section 80C", color: "#059669" },
  { name: "PPF (Public Provident Fund)", emoji: "🏦", section: "80C", limit: "₹1.5 lakh", lockIn: "15 years", returns: "7.1%", risk: "Low", bestFor: "Guaranteed returns + tax-free interest + tax-free maturity. Triple tax benefit!", howItWorks: "Government-backed savings scheme. Deposit money, earn fixed interest, withdraw after 15 years. Interest is compounded annually.", taxBenefit: "EEE — Exempt-Exempt-Exempt. Investment, interest, and maturity all tax-free!", color: "#4f46e5" },
  { name: "NPS (National Pension)", emoji: "👴", section: "80CCD(1B)", limit: "₹50,000 extra", lockIn: "Till retirement", returns: "9-12%", risk: "Medium", bestFor: "Additional ₹50K deduction ABOVE the 80C limit. Best for long-term retirement planning.", howItWorks: "Government pension scheme with equity + debt allocation. You choose your risk level. 60% can be withdrawn at 60, rest goes to annuity.", taxBenefit: "Extra ₹50,000 deduction beyond ₹1.5L of 80C. Total: ₹2L tax benefit!", color: "#7c3aed" },
  { name: "Health Insurance", emoji: "🏥", section: "80D", limit: "₹25,000-₹1L", lockIn: "Annual", returns: "N/A", risk: "Low", bestFor: "Essential protection + tax saving. Don't skip this — medical emergencies can wipe out savings.", howItWorks: "Pay premium for health coverage. If hospitalized, insurance covers the bills. Preventive health checkup of ₹5,000 also deductible.", taxBenefit: "₹25K self/family + ₹50K parents (if senior) = up to ₹1L deduction under 80D", color: "#ef4444" },
  { name: "Home Loan Interest", emoji: "🏠", section: "24(b)", limit: "₹2 lakh", lockIn: "N/A", returns: "Tax benefit", risk: "Low", bestFor: "If you have a home loan, this is automatic. Interest paid reduces your taxable income.", howItWorks: "The interest portion of your home loan EMI is deductible. Principal repayment falls under 80C. Both together save significant tax.", taxBenefit: "Up to ₹2L deduction on interest + ₹1.5L on principal under 80C", color: "#f59e0b" },
  { name: "Tax-Saving FD", emoji: "💳", section: "80C", limit: "₹1.5 lakh", lockIn: "5 years", returns: "6.5-7.5%", risk: "Low", bestFor: "For ultra-conservative investors who want fixed returns with tax benefit. Interest is taxable though.", howItWorks: "Fixed deposit with 5-year lock-in period at your bank. Interest rate fixed at deposit time. Can't break before maturity.", taxBenefit: "Investment deductible under 80C, but interest earned is taxable at your slab rate", color: "#06b6d4" },
];

/* ── Capital Gains Rules ─────────────────────────────────────── */
const CAPITAL_GAINS_RULES = [
  { asset: "Stocks (Listed)", emoji: "📊", stcg: "< 1 year → 20%", ltcg: "> 1 year → 12.5% (above ₹1.25L)", stcgRate: 20, ltcgRate: 12.5 },
  { asset: "Equity Mutual Funds", emoji: "🚌", stcg: "< 1 year → 20%", ltcg: "> 1 year → 12.5% (above ₹1.25L)", stcgRate: 20, ltcgRate: 12.5 },
  { asset: "Debt Mutual Funds", emoji: "📄", stcg: "Any period → Slab rate", ltcg: "No LTCG benefit (slab rate)", stcgRate: 30, ltcgRate: 30 },
  { asset: "Crypto", emoji: "₿", stcg: "Any period → 30% flat", ltcg: "30% flat (no deductions allowed)", stcgRate: 30, ltcgRate: 30 },
  { asset: "Real Estate", emoji: "🏠", stcg: "< 2 years → Slab rate", ltcg: "> 2 years → 12.5% (no indexation)", stcgRate: 30, ltcgRate: 12.5 },
  { asset: "Gold / SGBs", emoji: "🥇", stcg: "< specified → Slab rate", ltcg: "SGBs: Tax-free at maturity!", stcgRate: 30, ltcgRate: 0 },
];

/* ── Tax Calendar ────────────────────────────────────────────── */
const TAX_CALENDAR = [
  { month: "Jun 15", event: "Advance Tax — 1st installment (15%)", emoji: "💰", status: "upcoming" },
  { month: "Jul 31", event: "ITR Filing Deadline (non-audit)", emoji: "📝", status: "important" },
  { month: "Sep 15", event: "Advance Tax — 2nd installment (45%)", emoji: "💰", status: "upcoming" },
  { month: "Oct 31", event: "ITR Filing Deadline (audit cases)", emoji: "📋", status: "upcoming" },
  { month: "Dec 15", event: "Advance Tax — 3rd installment (75%)", emoji: "💰", status: "upcoming" },
  { month: "Dec 31", event: "Belated/Revised ITR Deadline", emoji: "⚠️", status: "warning" },
  { month: "Mar 15", event: "Advance Tax — Final installment (100%)", emoji: "💰", status: "upcoming" },
  { month: "Mar 31", event: "Last day for tax-saving investments", emoji: "🎯", status: "important" },
];

/* ── Did You Know Cards ──────────────────────────────────────── */
const DID_YOU_KNOW = [
  { tip: "If your income is ₹7L or less under New Regime, you pay ZERO tax thanks to Section 87A rebate!", emoji: "🤯" },
  { tip: "You can claim up to ₹2 lakh total tax benefit with 80C (₹1.5L) + NPS 80CCD (₹50K) combined.", emoji: "💡" },
  { tip: "SGB (Sovereign Gold Bonds) gains are completely TAX FREE if held till maturity (8 years)!", emoji: "🥇" },
  { tip: "Tax-loss harvesting: Sell losing stocks to offset gains and reduce your capital gains tax bill legally.", emoji: "📉" },
  { tip: "Standard Deduction of ₹75,000 is available under New Regime — no investment needed!", emoji: "🎁" },
  { tip: "Employer NPS contribution (up to 14% of salary) is tax-free — check if your company offers it.", emoji: "🏢" },
];

/* ── Calculator Functions ────────────────────────────────────── */
function calcNewRegimeTax(income: number, stdDeduction = 75000): { tax: number; cess: number; total: number } {
  const taxable = Math.max(0, income - stdDeduction);
  let tax = 0;
  if (taxable > 1500000) tax += (taxable - 1500000) * 0.30;
  const t15 = Math.min(Math.max(taxable - 1200000, 0), 300000);
  tax += t15 * 0.20;
  const t12 = Math.min(Math.max(taxable - 1000000, 0), 200000);
  tax += t12 * 0.15;
  const t10 = Math.min(Math.max(taxable - 700000, 0), 300000);
  tax += t10 * 0.10;
  const t7 = Math.min(Math.max(taxable - 300000, 0), 400000);
  tax += t7 * 0.05;
  // Section 87A rebate — taxable income up to ₹7L
  if (taxable <= 700000) tax = 0;
  // Marginal relief for income slightly above ₹7L
  if (taxable > 700000 && taxable <= 750000) {
    const normalTax = tax;
    const marginalTax = taxable - 700000;
    tax = Math.min(normalTax, marginalTax);
  }
  const cess = Math.round(tax * 0.04);
  return { tax: Math.round(tax), cess, total: Math.round(tax + cess) };
}

function calcOldRegimeTax(income: number, deductions80C: number, deductions80D: number, hra: number, nps: number, homeLoan: number): { tax: number; cess: number; total: number } {
  const stdDeduction = 50000;
  const total80C = Math.min(deductions80C, 150000);
  const total80D = Math.min(deductions80D, 100000);
  const totalNPS = Math.min(nps, 50000);
  const totalHL = Math.min(homeLoan, 200000);
  const taxable = Math.max(0, income - stdDeduction - total80C - total80D - hra - totalNPS - totalHL);
  let tax = 0;
  if (taxable > 1000000) tax += (taxable - 1000000) * 0.30;
  const t5to10 = Math.min(Math.max(taxable - 500000, 0), 500000);
  tax += t5to10 * 0.20;
  const t2to5 = Math.min(Math.max(taxable - 250000, 0), 250000);
  tax += t2to5 * 0.05;
  if (taxable <= 500000) tax = 0; // Rebate
  const cess = Math.round(tax * 0.04);
  return { tax: Math.round(tax), cess, total: Math.round(tax + cess) };
}

/* ── Visual Progress Bar ─────────────────────────────────────── */
function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 4 }}>
      {label && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: "0.58rem", color: COLORS.textDim }}>{label}</span>
        <span style={{ fontSize: "0.58rem", fontWeight: 700, color }}>{Math.round(pct)}%</span>
      </div>}
      <div style={{ height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}cc)`, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

/* ── Tax Savings Ring Chart ──────────────────────────────────── */
function SavingsRing({ saved, total, size = 120 }: { saved: number; total: number; size?: number }) {
  const pct = total > 0 ? Math.min((saved / total) * 100, 100) : 0;
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.accent} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ position: "relative", marginTop: -size * 0.65, textAlign: "center", marginBottom: size * 0.15 }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.accent }}>₹{(saved / 1000).toFixed(0)}K</div>
        <div style={{ fontSize: "0.52rem", color: COLORS.textDim }}>Saved of ₹{(total / 1000).toFixed(0)}K</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function BeginnerTax() {
  const [activeSection, setActiveSection] = useState("calculator");
  const [salary, setSalary] = useState(1000000);
  const [deductions80C, setDeductions80C] = useState(150000);
  const [deductions80D, setDeductions80D] = useState(25000);
  const [hra, setHra] = useState(0);
  const [nps, setNps] = useState(50000);
  const [homeLoan, setHomeLoan] = useState(0);
  const [taxInvestPage, setTaxInvestPage] = useState<TaxSavingOption | null>(null);
  const [capitalGainsProfit, setCapitalGainsProfit] = useState(200000);
  const [holdingPeriod, setHoldingPeriod] = useState<"short" | "long">("long");
  const [didYouKnowIdx, setDidYouKnowIdx] = useState(0);

  // Calculations
  const newRegime = useMemo(() => calcNewRegimeTax(salary), [salary]);
  const oldRegime = useMemo(() => calcOldRegimeTax(salary, deductions80C, deductions80D, hra, nps, homeLoan), [salary, deductions80C, deductions80D, hra, nps, homeLoan]);
  const savings = Math.max(0, newRegime.total - oldRegime.total);
  const betterRegime = oldRegime.total <= newRegime.total ? "Old" : "New";
  const totalDeductions = Math.min(deductions80C, 150000) + Math.min(deductions80D, 100000) + Math.min(nps, 50000) + hra + Math.min(homeLoan, 200000);
  const maxPossibleDeductions = 150000 + 100000 + 50000 + 200000; // 5L max

  const sectionTabs = [
    { id: "calculator", label: "Calculator", emoji: "🧮" },
    { id: "savings", label: "Tax Savings", emoji: "💰" },
    { id: "capgains", label: "Capital Gains", emoji: "💹" },
    { id: "calendar", label: "Calendar", emoji: "📅" },
  ];

  // Fullscreen Tax Saving Investment Page
  if (taxInvestPage) {
    const opt = taxInvestPage;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setTaxInvestPage(null)}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 700, maxHeight: "90vh", background: "#fff", borderRadius: 20, overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
          {/* Header */}
          <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${opt.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{opt.emoji}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>{opt.name}</h2>
                <span style={{ fontSize: "0.65rem", padding: "3px 8px", borderRadius: 6, background: COLORS.purpleSoft, color: COLORS.purple, fontWeight: 600 }}>Section {opt.section}</span>
              </div>
            </div>
            <button onClick={() => setTaxInvestPage(null)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${COLORS.cardBorder}`, background: COLORS.card, cursor: "pointer", fontSize: "1rem" }}>✕</button>
          </div>

          <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Quick Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10 }}>
              <StatCard label="Max Limit" value={opt.limit} color={opt.color} />
              <StatCard label="Lock-in" value={opt.lockIn} color={COLORS.amber} />
              <StatCard label="Expected Returns" value={opt.returns} color={COLORS.accent} />
              <StatCard label="Risk Level" value={opt.risk} color={opt.risk === "Low" ? COLORS.accent : opt.risk === "Medium" ? COLORS.amber : COLORS.red} />
            </div>

            {/* How It Works */}
            <div style={{ ...card({ background: `linear-gradient(135deg, ${opt.color}08, ${opt.color}03)`, border: `1px solid ${opt.color}20` }) }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 8 }}>🔧 How It Works</div>
              <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 }}>{opt.howItWorks}</p>
            </div>

            {/* Tax Benefit */}
            <div style={{ ...card({ background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}` }) }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 8, color: COLORS.accent }}>💰 Tax Benefit</div>
              <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.7, margin: 0 }}>{opt.taxBenefit}</p>
            </div>

            {/* AI Recommendation */}
            <AIExplanation emoji="🤖" text={opt.bestFor} />

            {/* Tax Saving Impact */}
            <div style={{ ...card() }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 12 }}>📊 Tax Saving Impact (at ₹10L income)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: "14px", borderRadius: 12, background: COLORS.redSoft, textAlign: "center" }}>
                  <div style={{ fontSize: "0.52rem", color: COLORS.textDim, marginBottom: 4 }}>Without This Investment</div>
                  <div style={{ fontSize: "1rem", fontWeight: 900, color: COLORS.red }}>₹{(calcNewRegimeTax(1000000).total).toLocaleString("en-IN")}</div>
                </div>
                <div style={{ padding: "14px", borderRadius: 12, background: COLORS.greenSoft, textAlign: "center" }}>
                  <div style={{ fontSize: "0.52rem", color: COLORS.textDim, marginBottom: 4 }}>With This Investment</div>
                  <div style={{ fontSize: "1rem", fontWeight: 900, color: COLORS.accent }}>₹{(calcOldRegimeTax(1000000, opt.section === "80C" ? 150000 : 0, opt.section === "80D" ? 25000 : 0, 0, opt.section === "80CCD(1B)" ? 50000 : 0, opt.section === "24(b)" ? 200000 : 0).total).toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>

            <WhatThisMeansCard text={
              opt.risk === "Low"
                ? `${opt.name} is perfect for beginners who want guaranteed safety with tax benefits. Your money is completely safe while you save tax.`
                : opt.risk === "Medium"
                ? `${opt.name} has moderate risk but offers better returns than fixed options. Great if you can stay invested for the full lock-in period.`
                : `${opt.name} invests in the stock market, so returns can vary. But historically, it has given the best returns among all tax-saving options. Start with a monthly SIP to reduce risk.`
            } />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero */}
      <AIExplanation
        emoji="🧾"
        text="Taxes are simpler than they seem! As a salaried person, your employer deducts TDS automatically. The key is knowing which deductions you can claim to legally reduce your tax. Smart tax planning can save you ₹50,000 - ₹2,00,000 every year. This dashboard makes it easy."
      />

      {/* Did You Know — rotating */}
      <div onClick={() => setDidYouKnowIdx((didYouKnowIdx + 1) % DID_YOU_KNOW.length)} style={{ ...card({ padding: "16px 20px", cursor: "pointer", background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(79,70,229,0.02))", border: `1px solid ${COLORS.purpleBorder}` }), display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.purpleSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>{DID_YOU_KNOW[didYouKnowIdx].emoji}</div>
        <div>
          <div style={{ fontSize: "0.55rem", color: COLORS.purple, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Did You Know? (Tap for more)</div>
          <div style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.5 }}>{DID_YOU_KNOW[didYouKnowIdx].tip}</div>
        </div>
      </div>

      {/* Section Tabs */}
      <PillTabs tabs={sectionTabs} active={activeSection} onSelect={setActiveSection} />

      {/* ═══ CALCULATOR SECTION ═══ */}
      {activeSection === "calculator" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tax Calculator */}
          <div style={{ ...card() }}>
            <SectionHeader emoji="🧮" title="Smart Tax Calculator" subtitle="Compare Old vs New Regime instantly" />

            {/* Salary Slider */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: "0.72rem", color: COLORS.textMuted, fontWeight: 600 }}>Annual Income (CTC)</label>
                <span style={{ fontSize: "1rem", fontWeight: 900, color: COLORS.accent }}>₹{salary.toLocaleString("en-IN")}</span>
              </div>
              <input type="range" min={300000} max={5000000} step={50000} value={salary} onChange={e => setSalary(+e.target.value)}
                style={{ width: "100%", accentColor: COLORS.accent, height: 6, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.52rem", color: COLORS.textGhost }}>
                <span>₹3L</span><span>₹50L</span>
              </div>
            </div>

            {/* Deduction Sliders (for Old Regime) */}
            <div style={{ padding: "14px", borderRadius: 12, background: "rgba(0,0,0,0.02)", marginBottom: 16 }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, marginBottom: 10, color: COLORS.textPrimary }}>📋 Your Deductions (affects Old Regime)</div>
              {[
                { label: "80C (ELSS, PPF, LIC, etc.)", value: deductions80C, set: setDeductions80C, max: 150000, color: COLORS.accent },
                { label: "80D (Health Insurance)", value: deductions80D, set: setDeductions80D, max: 100000, color: "#ef4444" },
                { label: "80CCD (NPS extra)", value: nps, set: setNps, max: 50000, color: "#7c3aed" },
                { label: "HRA Exemption", value: hra, set: setHra, max: 300000, color: "#f59e0b" },
                { label: "Home Loan Interest (24b)", value: homeLoan, set: setHomeLoan, max: 200000, color: "#06b6d4" },
              ].map(d => (
                <div key={d.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: "0.6rem", color: COLORS.textMuted }}>{d.label}</span>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: d.color }}>₹{d.value.toLocaleString("en-IN")}</span>
                  </div>
                  <input type="range" min={0} max={d.max} step={5000} value={d.value} onChange={e => d.set(+e.target.value)}
                    style={{ width: "100%", accentColor: d.color, height: 4, cursor: "pointer" }} />
                </div>
              ))}
              <ProgressBar value={totalDeductions} max={maxPossibleDeductions} color={COLORS.accent} label={`Deductions used: ₹${(totalDeductions / 100000).toFixed(1)}L of ₹${(maxPossibleDeductions / 100000).toFixed(0)}L`} />
            </div>

            {/* Results — Side by Side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: "18px", borderRadius: 14, background: betterRegime === "New" ? COLORS.greenSoft : COLORS.card, border: `2px solid ${betterRegime === "New" ? COLORS.accent : COLORS.cardBorder}`, textAlign: "center" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", marginBottom: 6 }}>New Regime</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.red, marginBottom: 4 }}>₹{newRegime.total.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: "0.55rem", color: COLORS.textMuted }}>Tax: ₹{newRegime.tax.toLocaleString("en-IN")} + Cess: ₹{newRegime.cess.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: "0.52rem", color: COLORS.textDim, marginTop: 4 }}>Monthly: ₹{Math.round(newRegime.total / 12).toLocaleString("en-IN")}</div>
                {betterRegime === "New" && <div style={{ marginTop: 8, fontSize: "0.55rem", padding: "3px 8px", borderRadius: 6, background: COLORS.accent, color: "#fff", fontWeight: 700, display: "inline-block" }}>Better Choice</div>}
              </div>
              <div style={{ padding: "18px", borderRadius: 14, background: betterRegime === "Old" ? COLORS.greenSoft : COLORS.card, border: `2px solid ${betterRegime === "Old" ? COLORS.accent : COLORS.cardBorder}`, textAlign: "center" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", marginBottom: 6 }}>Old Regime</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.red, marginBottom: 4 }}>₹{oldRegime.total.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: "0.55rem", color: COLORS.textMuted }}>Tax: ₹{oldRegime.tax.toLocaleString("en-IN")} + Cess: ₹{oldRegime.cess.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: "0.52rem", color: COLORS.textDim, marginTop: 4 }}>Monthly: ₹{Math.round(oldRegime.total / 12).toLocaleString("en-IN")}</div>
                {betterRegime === "Old" && <div style={{ marginTop: 8, fontSize: "0.55rem", padding: "3px 8px", borderRadius: 6, background: COLORS.accent, color: "#fff", fontWeight: 700, display: "inline-block" }}>Better Choice</div>}
              </div>
            </div>

            {/* Savings Highlight */}
            {savings > 0 && (
              <div style={{ padding: "14px 18px", borderRadius: 12, background: "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.04))", border: `1px solid ${COLORS.accentBorder}`, textAlign: "center" }}>
                <span style={{ fontSize: "0.65rem", color: COLORS.textMuted }}>You save </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 900, color: COLORS.accent }}>₹{savings.toLocaleString("en-IN")}</span>
                <span style={{ fontSize: "0.65rem", color: COLORS.textMuted }}> with {betterRegime} Regime</span>
              </div>
            )}

            {/* AI advice */}
            <div style={{ marginTop: 14 }}>
              <AIExplanation text={
                salary <= 750000 ? "At your income level, both regimes result in zero or very low tax thanks to rebates. Focus on building your savings and emergency fund first."
                : salary <= 1200000 && totalDeductions < 200000 ? "With fewer deductions, the New Regime is likely better for you. It offers lower rates without the complexity of managing investments for tax saving."
                : salary <= 1200000 ? "Your deductions are making the Old Regime competitive. Maximize your 80C investments (ELSS, PPF) and health insurance to save more."
                : `At ₹${(salary / 100000).toFixed(0)}L income, deductions matter a lot! Maximize: 80C (₹1.5L) + NPS (₹50K) + 80D (₹25K+) + HRA/Home Loan. This could save you ₹${Math.round(savings / 1000)}K+ per year.`
              } />
            </div>
          </div>

          {/* Tax Slabs Visual */}
          <div style={{ ...card() }}>
            <SectionHeader emoji="📋" title="Tax Slabs Comparison" subtitle="FY 2025-26" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: COLORS.accent, marginBottom: 8 }}>New Regime</div>
                {TAX_SLABS_NEW.map(s => (
                  <div key={s.range} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "0.6rem", color: COLORS.textSecondary }}>{s.range}</span>
                    <span style={{ fontSize: "0.6rem", fontWeight: 800, color: s.color }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: COLORS.blue, marginBottom: 8 }}>Old Regime</div>
                {TAX_SLABS_OLD.map(s => (
                  <div key={s.range} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "0.6rem", color: COLORS.textSecondary }}>{s.range}</span>
                    <span style={{ fontSize: "0.6rem", fontWeight: 800, color: s.color }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Salary Breakup Visualizer */}
          <div style={{ ...card() }}>
            <SectionHeader emoji="📊" title="Your Salary Breakup" subtitle="See where your money goes" />
            {(() => {
              const tax = betterRegime === "New" ? newRegime.total : oldRegime.total;
              const takeHome = salary - tax;
              const monthly = Math.round(takeHome / 12);
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <StatCard label="Gross Salary" value={`₹${(salary / 100000).toFixed(1)}L`} />
                    <StatCard label="Total Tax" value={`₹${(tax / 1000).toFixed(0)}K`} color={COLORS.red} />
                    <StatCard label="Take Home" value={`₹${(takeHome / 100000).toFixed(1)}L`} color={COLORS.accent} subtext={`₹${monthly.toLocaleString("en-IN")}/mo`} />
                  </div>
                  <ProgressBar value={takeHome} max={salary} color={COLORS.accent} label="Take-home percentage" />
                  <ProgressBar value={tax} max={salary} color={COLORS.red} label="Tax percentage" />
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══ TAX SAVINGS SECTION ═══ */}
      {activeSection === "savings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Savings Overview */}
          <div style={{ ...card({ background: "linear-gradient(135deg, rgba(5,150,105,0.04), rgba(16,185,129,0.02))", border: `1px solid ${COLORS.accentBorder}` }), textAlign: "center" }}>
            <SectionHeader emoji="💰" title="Your Tax Savings Potential" subtitle="How much you could save this year" />
            <SavingsRing saved={totalDeductions} total={maxPossibleDeductions} />
            <div style={{ marginTop: 8, fontSize: "0.72rem", color: COLORS.textSecondary }}>
              {totalDeductions < maxPossibleDeductions * 0.5 ? "You're leaving money on the table! Increase your tax-saving investments." : totalDeductions < maxPossibleDeductions * 0.8 ? "Good progress! A few more investments and you'll maximize your savings." : "Excellent! You're almost at maximum tax-saving capacity!"}
            </div>
          </div>

          {/* Tax Saving Options */}
          <div>
            <SectionHeader emoji="📈" title="Tax-Saving Investments" subtitle="Tap any option for detailed analysis" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TAX_SAVING_OPTIONS.map(opt => (
                <div key={opt.name} onClick={() => setTaxInvestPage(opt)} style={{ ...card({ padding: "18px", cursor: "pointer" }), borderLeft: `4px solid ${opt.color}`, transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${opt.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{opt.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>{opt.name}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: "0.52rem", padding: "2px 6px", borderRadius: 4, background: COLORS.purpleSoft, color: COLORS.purple, fontWeight: 600 }}>§{opt.section}</span>
                        <span style={{ fontSize: "0.52rem", padding: "2px 6px", borderRadius: 4, background: opt.risk === "Low" ? COLORS.greenSoft : opt.risk === "Medium" ? COLORS.amberSoft : COLORS.redSoft, color: opt.risk === "Low" ? COLORS.accent : opt.risk === "Medium" ? COLORS.amber : COLORS.red, fontWeight: 600 }}>{opt.risk} Risk</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 900, color: COLORS.accent }}>{opt.returns}</div>
                      <div style={{ fontSize: "0.52rem", color: COLORS.textDim }}>Expected</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "0.52rem", padding: "3px 8px", borderRadius: 6, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textDim }}>Limit: <span style={{ fontWeight: 700, color: COLORS.textPrimary }}>{opt.limit}</span></span>
                    <span style={{ fontSize: "0.52rem", padding: "3px 8px", borderRadius: 6, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textDim }}>Lock-in: <span style={{ fontWeight: 700, color: COLORS.textPrimary }}>{opt.lockIn}</span></span>
                  </div>
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: `${opt.color}08`, border: `1px solid ${opt.color}15` }}>
                    <span style={{ fontSize: "0.62rem", color: COLORS.textSecondary }}>🤖 {opt.bestFor}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: "0.6rem", color: COLORS.blue, fontWeight: 600, textAlign: "right" }}>View Full Analysis →</div>
                </div>
              ))}
            </div>
          </div>

          <WhatThisMeansCard text="Start with ELSS if you're young (3-year lock-in, highest returns). Add PPF for guaranteed safety. Don't forget health insurance — it saves tax AND protects your family. NPS gives an extra ₹50K deduction above the ₹1.5L 80C limit." />
        </div>
      )}

      {/* ═══ CAPITAL GAINS SECTION ═══ */}
      {activeSection === "capgains" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AIExplanation emoji="💹" text="Capital Gains Tax is the tax you pay on profits from selling investments. The rate depends on two things: what you sold and how long you held it. Holding longer usually means lower tax. Understanding this helps you plan when to sell." />

          {/* Quick Estimator */}
          <div style={{ ...card() }}>
            <SectionHeader emoji="🧮" title="Capital Gains Estimator" subtitle="Calculate tax on your investment profits" />
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.65rem", color: COLORS.textMuted }}>Profit Amount</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.accent }}>₹{capitalGainsProfit.toLocaleString("en-IN")}</span>
              </div>
              <input type="range" min={10000} max={2000000} step={10000} value={capitalGainsProfit} onChange={e => setCapitalGainsProfit(+e.target.value)}
                style={{ width: "100%", accentColor: COLORS.accent, height: 5, cursor: "pointer" }} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={() => setHoldingPeriod("short")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${holdingPeriod === "short" ? COLORS.red : COLORS.cardBorder}`, background: holdingPeriod === "short" ? COLORS.redSoft : COLORS.card, color: holdingPeriod === "short" ? COLORS.red : COLORS.textMuted, fontWeight: 700, fontSize: "0.68rem", cursor: "pointer" }}>Short-Term</button>
              <button onClick={() => setHoldingPeriod("long")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${holdingPeriod === "long" ? COLORS.accent : COLORS.cardBorder}`, background: holdingPeriod === "long" ? COLORS.greenSoft : COLORS.card, color: holdingPeriod === "long" ? COLORS.accent : COLORS.textMuted, fontWeight: 700, fontSize: "0.68rem", cursor: "pointer" }}>Long-Term</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { asset: "Stocks", rate: holdingPeriod === "short" ? 20 : 12.5, exempt: holdingPeriod === "long" ? 125000 : 0 },
                { asset: "Crypto", rate: 30, exempt: 0 },
                { asset: "Real Estate", rate: holdingPeriod === "short" ? 30 : 12.5, exempt: 0 },
              ].map(a => {
                const taxableAmt = Math.max(0, capitalGainsProfit - a.exempt);
                const tax = Math.round(taxableAmt * a.rate / 100);
                return (
                  <div key={a.asset} style={{ padding: "12px", borderRadius: 10, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, textAlign: "center" }}>
                    <div style={{ fontSize: "0.55rem", color: COLORS.textDim, marginBottom: 4 }}>{a.asset}</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 900, color: COLORS.red }}>₹{tax.toLocaleString("en-IN")}</div>
                    <div style={{ fontSize: "0.48rem", color: COLORS.textGhost }}>{a.rate}% tax</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Capital Gains Rules */}
          <div>
            <SectionHeader emoji="📋" title="Capital Gains Tax Rules" subtitle="FY 2025-26 (Budget 2024 updates)" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CAPITAL_GAINS_RULES.map(rule => (
                <div key={rule.asset} style={{ ...card({ padding: "16px" }) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "1.1rem" }}>{rule.emoji}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800 }}>{rule.asset}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: COLORS.redSoft, fontSize: "0.62rem", color: COLORS.textSecondary }}>
                      <span style={{ fontWeight: 700, color: COLORS.red }}>STCG: </span>{rule.stcg}
                    </div>
                    <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: COLORS.greenSoft, fontSize: "0.62rem", color: COLORS.textSecondary }}>
                      <span style={{ fontWeight: 700, color: COLORS.accent }}>LTCG: </span>{rule.ltcg}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <WhatThisMeansCard text="Pro tip: Hold stocks for over 1 year to get LTCG rates (12.5% vs 20%). Book profits up to ₹1.25 lakh every year — they're completely tax-free! This is called 'tax harvesting' and smart investors do it every March." />
        </div>
      )}

      {/* ═══ CALENDAR SECTION ═══ */}
      {activeSection === "calendar" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AIExplanation emoji="📅" text="Never miss a tax deadline! Late ITR filing attracts a penalty of ₹5,000 (₹1,000 if income < ₹5L). Missing advance tax deadlines means interest charges. Here's your annual tax calendar." />

          <div style={{ ...card() }}>
            <SectionHeader emoji="🗓️" title="Tax Calendar FY 2025-26" subtitle="Important dates and deadlines" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TAX_CALENDAR.map((event, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: event.status === "important" ? "rgba(239,68,68,0.04)" : event.status === "warning" ? "rgba(245,158,11,0.04)" : COLORS.card, border: `1px solid ${event.status === "important" ? "rgba(239,68,68,0.15)" : event.status === "warning" ? "rgba(245,158,11,0.15)" : COLORS.cardBorder}` }}>
                  <div style={{ width: 50, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 900, color: event.status === "important" ? COLORS.red : event.status === "warning" ? COLORS.amber : COLORS.textPrimary }}>{event.month.split(" ")[0]}</div>
                    <div style={{ fontSize: "0.52rem", color: COLORS.textDim }}>{event.month.split(" ")[1]}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: COLORS.textPrimary }}>{event.event}</div>
                  </div>
                  <span style={{ fontSize: "1rem" }}>{event.emoji}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GST Quick Guide */}
          <div style={{ ...card() }}>
            <SectionHeader emoji="🏷️" title="GST Quick Guide" subtitle="Goods and Services Tax basics" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { rate: "0%", items: "Essential food, healthcare, education", color: "#10b981" },
                { rate: "5%", items: "Packaged food, economy travel, small restaurants", color: "#34d399" },
                { rate: "12%", items: "Business class travel, processed food, IT services", color: "#f59e0b" },
                { rate: "18%", items: "Most services, electronics, branded clothing", color: "#f97316" },
                { rate: "28%", items: "Luxury cars, tobacco, cement, AC restaurants", color: "#dc2626" },
              ].map(g => (
                <div key={g.rate} style={{ padding: "12px", borderRadius: 10, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: g.color, marginBottom: 4 }}>{g.rate}</div>
                  <div style={{ fontSize: "0.58rem", color: COLORS.textMuted, lineHeight: 1.4 }}>{g.items}</div>
                </div>
              ))}
            </div>
          </div>

          <WhatThisMeansCard text="Mark July 31 on your calendar — that's the ITR filing deadline. Start your tax-saving investments before March 31 to claim deductions for the current year. Most salaried people can file ITR in 15 minutes on the Income Tax e-filing portal." />
        </div>
      )}

      {/* ── FAQ ── */}
      <div>
        <SectionHeader emoji="❓" title="Tax Questions Answered" />
        <Accordion items={[
          { title: "Old Regime vs New Regime — which is better?", emoji: "⚖️", content: "New Regime: Lower tax rates, fewer deductions. Best if you don't have home loan or many investments. Old Regime: Higher rates but allows deductions (80C, 80D, HRA, home loan interest). Best if you have ₹3L+ in deductions. Use the calculator above to find your best option!" },
          { title: "What is TDS and why is it deducted?", emoji: "✂️", content: "Tax Deducted at Source — your employer cuts tax from your salary before paying you. It's not extra tax — it's advance payment of your income tax. When you file ITR, you can claim refund if excess TDS was deducted. Think of it as a pay-as-you-earn system." },
          { title: "Do I need to file ITR even if TDS is deducted?", emoji: "📝", content: "Yes! If your income exceeds ₹3 lakh, you must file. Even if no tax is due, filing ITR is useful for: visa applications, loan approvals, claiming TDS refunds, and carrying forward losses. Use the Income Tax e-filing portal — it's free and takes 15 minutes." },
          { title: "How can I save tax on stock market profits?", emoji: "📊", content: "Hold stocks >1 year for LTCG rate (12.5% instead of 20%). Book profits up to ₹1.25L yearly — they're tax-free! Use tax-loss harvesting: sell losing stocks to offset gains. Invest in ELSS for 80C deduction. SGBs offer tax-free gold gains at maturity." },
          { title: "What deductions can I claim as a salaried person?", emoji: "💼", content: "80C: Up to ₹1.5L (ELSS, PPF, LIC, home loan principal). 80D: ₹25K-₹1L (health insurance). 80CCD: Extra ₹50K (NPS). 24(b): ₹2L (home loan interest). HRA: Actual rent-based exemption. Standard Deduction: ₹50K (old) or ₹75K (new) — automatic!" },
        ]} />
      </div>

      <Disclaimer text="Tax rules may change with each budget. Consult a Chartered Accountant for personalized advice. Rates shown are for FY 2025-26." />
      <UpsellBanner text="Access AI-powered tax optimization, regime comparison, and automated ITR insights in Advanced Mode" />
    </div>
  );
}
