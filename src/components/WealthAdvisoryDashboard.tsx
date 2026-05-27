"use client";
import { useState, useCallback } from "react";
import type {
  InvestorProfile, WealthAdvisoryData, WealthSectionId,
  AssetAllocation, StressScenario, MacroOverlay,
} from "@/lib/wealth-advisory";
import { WEALTH_SECTIONS, ALLOCATION_COLORS } from "@/lib/wealth-advisory";

// ═══════════════════════════════════════════════
// Utility Components
// ═══════════════════════════════════════════════

function GaugeRing({ value, label, max = 100, size = 80 }: { value: number; label: string; max?: number; size?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 70 ? "#2e7d32" : pct >= 40 ? "#e65100" : "#c62828";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 6px" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8eaf6" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 70 ? "0.95rem" : "0.78rem", fontWeight: 800, color }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.58rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", flex: "1 1 140px", minWidth: 130 }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: accent || "#1a1a2e" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.6rem", color: "#888", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "#2962ff", h = 6 }: { value: number; max?: number; color?: string; h?: number }) {
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: "#e8eaf6", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", borderRadius: h, background: color, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: bg, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{text}</span>
  );
}

function formatINR(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

// ═══════════════════════════════════════════════
// Investor Profile Form
// ═══════════════════════════════════════════════

function InvestorProfileForm({ onSubmit, loading }: { onSubmit: (p: InvestorProfile) => void; loading: boolean }) {
  const [form, setForm] = useState<InvestorProfile>({
    age: 30, annualIncome: 1500000, monthlySavings: 50000,
    investmentCorpus: 2000000, existingInvestments: "",
    riskTolerance: "moderate", investmentExperience: "intermediate",
    timeHorizon: 15, financialGoals: "Long-term wealth creation and retirement planning",
    liabilities: "", emergencyFundMonths: 6, taxBracket: "30%",
  });

  const field = (label: string, key: keyof InvestorProfile, type: string, opts?: { min?: number; max?: number; step?: number; placeholder?: string }) => (
    <div style={{ flex: "1 1 200px", minWidth: 180 }}>
      <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</label>
      <input
        type={type} value={form[key] as string | number}
        onChange={e => setForm(p => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
        min={opts?.min} max={opts?.max} step={opts?.step} placeholder={opts?.placeholder}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e3e8",
          fontSize: "0.82rem", fontWeight: 600, background: "#fff", outline: "none",
          transition: "border 0.2s",
        }}
      />
    </div>
  );

  const select = (label: string, key: keyof InvestorProfile, options: { value: string; label: string }[]) => (
    <div style={{ flex: "1 1 200px", minWidth: 180 }}>
      <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</label>
      <select
        value={form[key] as string}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e3e8",
          fontSize: "0.82rem", fontWeight: 600, background: "#fff", outline: "none", cursor: "pointer",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e0e3e8", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", padding: "28px 28px 20px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00e676", boxShadow: "0 0 8px rgba(0,230,118,0.5)" }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.8 }}>AI Wealth Advisory Engine</span>
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: "0 0 6px" }}>Build Your Institutional Portfolio</h2>
        <p style={{ fontSize: "0.78rem", opacity: 0.7, margin: 0 }}>Private wealth advisory powered by macro intelligence, risk analytics, and institutional portfolio construction</p>
      </div>

      <div style={{ padding: "24px 28px", background: "#fff" }}>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
          {/* Section 1: Personal */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1a237e", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Personal & Financial Profile</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {field("Age", "age", "number", { min: 18, max: 85 })}
              {field("Annual Income (₹)", "annualIncome", "number", { min: 0, step: 100000 })}
              {field("Monthly Savings (₹)", "monthlySavings", "number", { min: 0, step: 10000 })}
              {field("Investment Corpus (₹)", "investmentCorpus", "number", { min: 10000, step: 100000 })}
            </div>
          </div>

          {/* Section 2: Risk & Experience */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1a237e", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Risk & Investment Profile</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {select("Risk Tolerance", "riskTolerance", [
                { value: "conservative", label: "Conservative" },
                { value: "moderate", label: "Moderate" },
                { value: "aggressive", label: "Aggressive" },
              ])}
              {select("Experience", "investmentExperience", [
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "experienced", label: "Experienced" },
              ])}
              {field("Time Horizon (years)", "timeHorizon", "number", { min: 1, max: 40 })}
              {field("Emergency Fund (months)", "emergencyFundMonths", "number", { min: 0, max: 24 })}
            </div>
          </div>

          {/* Section 3: Goals & Context */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1a237e", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Goals & Context</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {field("Financial Goals", "financialGoals", "text", { placeholder: "e.g., Retirement, Child education, Wealth creation" })}
              {field("Existing Investments", "existingInvestments", "text", { placeholder: "e.g., FDs, PPF, MFs, Stocks" })}
              {field("Liabilities", "liabilities", "text", { placeholder: "e.g., Home loan, Car loan" })}
              {select("Tax Bracket", "taxBracket", [
                { value: "0%", label: "No Tax" },
                { value: "5%", label: "5%" },
                { value: "20%", label: "20%" },
                { value: "30%", label: "30%" },
              ])}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px 28px", borderRadius: 12, border: "none",
            background: loading ? "#90a4ae" : "linear-gradient(135deg, #1a237e, #0d47a1)",
            color: "#fff", fontSize: "0.92rem", fontWeight: 800, cursor: loading ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "0 4px 16px rgba(26,35,126,0.3)", transition: "all 0.2s",
          }}>
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "wa-spin 0.8s linear infinite" }} />
                Generating Institutional Portfolio Advisory...
              </>
            ) : (
              <>🏛️ Generate AI Wealth Advisory Report</>
            )}
          </button>
        </form>
      </div>
      <style>{`@keyframes wa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Section Components
// ═══════════════════════════════════════════════

function ProfileSection({ data, profile }: { data: WealthAdvisoryData; profile: InvestorProfile }) {
  const cl = data.investorClassification;
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: 14, padding: "24px 28px", color: "#fff", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: "1.8rem" }}>👤</span>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Investor Classification</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{cl.category}</div>
          </div>
        </div>
        <div style={{ fontSize: "0.75rem", opacity: 0.85, lineHeight: 1.6, marginBottom: 16 }}>{cl.investorPersona}</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <GaugeRing value={cl.riskScore} label="Risk Score" />
          <GaugeRing value={cl.suitabilityScore} label="Suitability" />
          <GaugeRing value={cl.volatilityTolerance} label="Vol. Tolerance" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        <StatCard label="Age" value={profile.age} sub={`${profile.age < 30 ? "Growth Phase" : profile.age < 45 ? "Accumulation" : profile.age < 55 ? "Preservation" : "Income Phase"}`} />
        <StatCard label="Corpus" value={formatINR(profile.investmentCorpus)} accent="#1a237e" />
        <StatCard label="Monthly SIP" value={formatINR(profile.monthlySavings)} accent="#2e7d32" />
        <StatCard label="Horizon" value={`${profile.timeHorizon}Y`} />
        <StatCard label="Risk" value={profile.riskTolerance} />
        <StatCard label="Liquidity" value={cl.liquidityRequirement} />
      </div>
    </div>
  );
}

function AllocationSection({ allocations, corpus }: { allocations: AssetAllocation[]; corpus: number }) {
  const total = allocations.reduce((s, a) => s + a.allocationPct, 0);
  // Donut chart
  let cumPct = 0;
  const segments = allocations.map((a, i) => {
    const start = cumPct;
    cumPct += a.allocationPct;
    const color = ALLOCATION_COLORS[i % ALLOCATION_COLORS.length];
    return { ...a, start, color };
  });

  return (
    <div>
      {/* Donut + Legend */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
          <svg viewBox="0 0 42 42" style={{ width: "100%", transform: "rotate(-90deg)" }}>
            {segments.map((s, i) => (
              <circle key={i} cx="21" cy="21" r="15.5" fill="none" stroke={s.color} strokeWidth="5"
                strokeDasharray={`${s.allocationPct * 0.97} ${100 - s.allocationPct * 0.97}`}
                strokeDashoffset={`${-s.start * 0.97}`} />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1a1a2e" }}>{formatINR(corpus)}</div>
            <div style={{ fontSize: "0.58rem", color: "#999", fontWeight: 600 }}>TOTAL CORPUS</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {segments.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#444", flex: 1 }}>{s.assetClass}</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1a1a2e" }}>{s.allocationPct}%</span>
              <span style={{ fontSize: "0.65rem", color: "#888", minWidth: 70, textAlign: "right" }}>{formatINR(s.recommendedAmount)}</span>
            </div>
          ))}
          {total !== 100 && <div style={{ fontSize: "0.6rem", color: "#c62828" }}>Note: Total = {total.toFixed(1)}%</div>}
        </div>
      </div>

      {/* Detailed Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {segments.map((a, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6", borderLeft: `4px solid ${a.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1a1a2e" }}>{a.assetClass}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.92rem", fontWeight: 900, color: a.color }}>{a.allocationPct}%</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#888" }}>{formatINR(a.recommendedAmount)}</span>
              </div>
            </div>
            <div style={{ fontSize: "0.68rem", color: "#555", lineHeight: 1.5, marginBottom: 6 }}>{a.rationale}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge text={`Vol: ${a.volatilityOutlook}`} color={a.volatilityOutlook === "low" ? "#2e7d32" : a.volatilityOutlook === "high" ? "#c62828" : "#e65100"} bg={a.volatilityOutlook === "low" ? "#e8f5e9" : a.volatilityOutlook === "high" ? "#ffebee" : "#fff3e0"} />
              <Badge text={`Inflation: ${a.inflationHedge}`} color="#6d4c41" bg="#efebe9" />
              <Badge text={`Liq: ${a.liquidityProfile}`} color="#0d47a1" bg="#e3f2fd" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskSection({ data }: { data: WealthAdvisoryData }) {
  const r = data.riskAnalytics;
  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
        <GaugeRing value={Number(r.sharpeRatio.toFixed(2))} label="Sharpe Ratio" max={3} size={90} />
        <GaugeRing value={Number(r.sortinoRatio.toFixed(2))} label="Sortino Ratio" max={3} size={90} />
        <GaugeRing value={r.diversificationScore} label="Diversification" size={90} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        <StatCard label="Expected Return" value={`${r.expectedReturn.toFixed(1)}%`} accent="#2e7d32" sub="Annual" />
        <StatCard label="Volatility" value={`${r.volatility.toFixed(1)}%`} accent={r.volatility > 15 ? "#c62828" : "#e65100"} sub="Annual" />
        <StatCard label="Max Drawdown" value={`${r.maxDrawdown.toFixed(1)}%`} accent="#c62828" sub="Worst case" />
        <StatCard label="Downside Dev." value={`${r.downsideDeviation.toFixed(1)}%`} accent="#e65100" />
        <StatCard label="Real Return" value={`${r.inflationAdjustedReturn.toFixed(1)}%`} accent="#1a237e" sub="After inflation" />
        <StatCard label="Calmar Ratio" value={r.calmarRatio.toFixed(2)} />
      </div>
    </div>
  );
}

function EquitySection({ data }: { data: WealthAdvisoryData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.equityBreakdown.map((eq, i) => (
        <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1a1a2e" }}>{eq.segment}</span>
            <span style={{ fontSize: "1rem", fontWeight: 900, color: "#2962ff" }}>{eq.allocation}%</span>
          </div>
          <div style={{ marginBottom: 6 }}><ProgressBar value={eq.allocation} color={ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]} h={5} /></div>
          <div style={{ fontSize: "0.68rem", color: "#555", marginBottom: 6 }}>{eq.rationale}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {eq.sectors.map(s => (
              <span key={s} style={{ fontSize: "0.58rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#e8eaf6", color: "#283593" }}>{s}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FixedIncomeSection({ data }: { data: WealthAdvisoryData }) {
  const fi = data.fixedIncomeStrategy;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Duration Strategy", value: fi.duration },
          { label: "Yield Curve", value: fi.yieldCurvePosition },
          { label: "Govt vs Corporate", value: fi.govtVsCorporate },
          { label: "Credit Quality", value: fi.creditQuality },
          { label: "Rate Sensitivity", value: fi.interestRateSensitivity },
          { label: "Income Generation", value: fi.incomeGeneration },
        ].map(item => (
          <div key={item.label} style={{ padding: 14, borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#333", lineHeight: 1.4 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoldSection({ data }: { data: WealthAdvisoryData }) {
  const g = data.goldDefensive;
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #f9a825, #ff8f00)", borderRadius: 14, padding: "20px 24px", color: "#fff", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "2rem" }}>🥇</span>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 600, opacity: 0.8, textTransform: "uppercase" }}>Gold & Precious Metals Allocation</div>
            <div style={{ fontSize: "2rem", fontWeight: 900 }}>{g.goldAllocationPct}%</div>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Rationale", value: g.rationale, icon: "📊" },
          { label: "Inflation Hedge", value: g.inflationHedge, icon: "🛡️" },
          { label: "Crisis Protection", value: g.crisisProtection, icon: "⚡" },
          { label: "Correlation Benefit", value: g.correlationBenefit, icon: "🔗" },
          { label: "Safe Haven Demand", value: g.safeHavenDemand, icon: "🏦" },
        ].map(item => (
          <div key={item.label} style={{ padding: 14, borderRadius: 10, background: "#fffde7", border: "1px solid #fff9c4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span>{item.icon}</span>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#f57f17", textTransform: "uppercase" }}>{item.label}</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#555", lineHeight: 1.4 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MacroSection({ overlays }: { overlays: MacroOverlay[] }) {
  const impactColor = { bullish: "#2e7d32", bearish: "#c62828", neutral: "#e65100" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {overlays.map((m, i) => (
        <div key={i} style={{
          padding: "14px 16px", borderRadius: 10, background: "#fff",
          border: "1px solid #eef0f2", borderLeft: `4px solid ${impactColor[m.impact as keyof typeof impactColor] || "#888"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1a1a2e" }}>{m.factor}</span>
            <Badge text={m.impact} color={impactColor[m.impact as keyof typeof impactColor] || "#888"} bg={m.impact === "bullish" ? "#e8f5e9" : m.impact === "bearish" ? "#ffebee" : "#fff3e0"} />
          </div>
          <div style={{ fontSize: "0.68rem", color: "#666", marginBottom: 4 }}><strong>Current:</strong> {m.currentState}</div>
          <div style={{ fontSize: "0.65rem", color: "#2962ff", fontWeight: 600 }}>Allocation: {m.allocationImplication}</div>
        </div>
      ))}
    </div>
  );
}

function StressSection({ scenarios }: { scenarios: StressScenario[] }) {
  const resColor = { strong: "#2e7d32", moderate: "#e65100", weak: "#c62828" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {scenarios.map((s, i) => (
        <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1a1a2e" }}>{s.scenario}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 900, color: "#c62828" }}>{s.portfolioImpact}%</span>
              <Badge text={s.resilience} color={resColor[s.resilience as keyof typeof resColor] || "#888"} bg={s.resilience === "strong" ? "#e8f5e9" : s.resilience === "weak" ? "#ffebee" : "#fff3e0"} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ flex: 1 }}><ProgressBar value={Math.abs(s.portfolioImpact)} max={50} color="#c62828" h={4} /></div>
          </div>
          <div style={{ fontSize: "0.65rem", color: "#c62828", marginBottom: 3 }}><strong>Vulnerable:</strong> {s.vulnerableSegments}</div>
          <div style={{ fontSize: "0.65rem", color: "#2e7d32" }}><strong>Defensive:</strong> {s.defensiveStrengths}</div>
        </div>
      ))}
    </div>
  );
}

function InstitutionalSection({ views }: { views: WealthAdvisoryData["institutionalViews"] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {views.map((v, i) => (
        <div key={i} style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1a237e", marginBottom: 8 }}>{v.firm}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 6 }}>
            <div><div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase" }}>Equity</div><div style={{ fontSize: "0.68rem", color: "#333" }}>{v.equityOutlook}</div></div>
            <div><div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase" }}>Bonds</div><div style={{ fontSize: "0.68rem", color: "#333" }}>{v.bondOutlook}</div></div>
            <div><div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#999", textTransform: "uppercase" }}>Gold</div><div style={{ fontSize: "0.68rem", color: "#333" }}>{v.goldOutlook}</div></div>
          </div>
          <div style={{ fontSize: "0.62rem", color: "#2962ff", fontWeight: 600 }}>Theme: {v.keyTheme}</div>
        </div>
      ))}
    </div>
  );
}

function RoadmapSection({ data, profile }: { data: WealthAdvisoryData; profile: InvestorProfile }) {
  const rm = data.wealthRoadmap;
  const maxProj = Math.max(...(rm.projections || []).map(p => p.projectedValue), 1);
  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Retirement Corpus" value={formatINR(rm.retirementCorpus)} accent="#1a237e" />
        <StatCard label="Years to Goal" value={rm.yearsToGoal} />
        <StatCard label="Monthly SIP Needed" value={formatINR(rm.monthlyRequiredSIP)} accent="#2e7d32" />
        <StatCard label="Goal Probability" value={`${rm.goalProbability}%`} accent={rm.goalProbability >= 70 ? "#2e7d32" : "#e65100"} />
        <StatCard label="Passive Income" value={formatINR(rm.passiveIncomePotential)} accent="#7c3aed" sub="Monthly (at goal)" />
      </div>

      {/* Projection chart */}
      {rm.projections && rm.projections.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, background: "#f8f9ff", border: "1px solid #e8eaf6" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: 14 }}>Wealth Growth Projection</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
            {rm.projections.map((p, i) => {
              const h = (p.projectedValue / maxProj) * 140;
              const invH = (p.totalInvested / maxProj) * 140;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ fontSize: "0.5rem", fontWeight: 700, color: "#1a237e" }}>{formatINR(p.projectedValue)}</div>
                  <div style={{ width: "100%", position: "relative" }}>
                    <div style={{ height: h, background: "linear-gradient(to top, #1a237e, #3f51b5)", borderRadius: "4px 4px 0 0", position: "relative" }}>
                      <div style={{ position: "absolute", bottom: 0, width: "100%", height: invH, background: "rgba(255,255,255,0.3)", borderRadius: "0 0 4px 4px" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "#888", fontWeight: 600 }}>Y{p.year}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "#1a237e" }} />
              <span style={{ fontSize: "0.58rem", color: "#888" }}>Projected Value</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(26,35,126,0.3)" }} />
              <span style={{ fontSize: "0.58rem", color: "#888" }}>Total Invested</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RebalanceSection({ data }: { data: WealthAdvisoryData }) {
  const urgColor = { high: { c: "#c62828", bg: "#ffebee" }, medium: { c: "#e65100", bg: "#fff3e0" }, low: { c: "#2e7d32", bg: "#e8f5e9" } };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.rebalancing.map((r, i) => {
        const u = urgColor[r.urgency] || urgColor.medium;
        return (
          <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: u.bg, border: `1px solid ${u.c}22`, borderLeft: `4px solid ${u.c}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Badge text={r.urgency} color={u.c} bg={`${u.c}15`} />
            </div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#333", marginBottom: 3 }}>{r.action}</div>
            <div style={{ fontSize: "0.65rem", color: "#666" }}>{r.rationale}</div>
          </div>
        );
      })}
    </div>
  );
}

function CommitteeSection({ data }: { data: WealthAdvisoryData }) {
  const cs = data.committeeSummary;
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: 14, padding: "24px 28px", color: "#fff", marginBottom: 16 }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>AI Investment Committee Verdict</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <GaugeRing value={cs.portfolioQualityScore} label="Quality" size={90} />
          <GaugeRing value={cs.riskSuitabilityScore} label="Risk Fit" size={90} />
          <GaugeRing value={cs.diversificationScore} label="Diversification" size={90} />
          <GaugeRing value={cs.sustainabilityScore} label="Sustainability" size={90} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { title: "Major Strengths", items: cs.majorStrengths, icon: "💪", color: "#2e7d32", bg: "#e8f5e9" },
          { title: "Key Risks", items: cs.keyRisks, icon: "⚠️", color: "#c62828", bg: "#ffebee" },
          { title: "Tactical Opportunities", items: cs.tacticalOpportunities, icon: "💡", color: "#e65100", bg: "#fff3e0" },
          { title: "Recommended Actions", items: cs.recommendedActions, icon: "✅", color: "#1a237e", bg: "#e8eaf6" },
        ].map(section => (
          <div key={section.title} style={{ padding: 14, borderRadius: 10, background: section.bg, border: `1px solid ${section.color}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span>{section.icon}</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: section.color, textTransform: "uppercase" }}>{section.title}</span>
            </div>
            {section.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4, fontSize: "0.68rem", color: "#444", lineHeight: 1.4 }}>
                <span style={{ color: section.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
// Main Dashboard Component
// ═══════════════════════════════════════════════

export default function WealthAdvisoryDashboard() {
  const [data, setData] = useState<WealthAdvisoryData | null>(null);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<WealthSectionId>("profile");

  const generateAdvisory = useCallback(async (p: InvestorProfile) => {
    setLoading(true);
    setError("");
    setProfile(p);
    try {
      const res = await fetch("/api/wealth-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const result = await res.json();
      setData(result as WealthAdvisoryData);
      setActiveSection("profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate advisory");
    } finally {
      setLoading(false);
    }
  }, []);

  // Show form if no data yet
  if (!data && !loading) {
    return (
      <div>
        <InvestorProfileForm onSubmit={generateAdvisory} loading={loading} />
        {error && (
          <div style={{ textAlign: "center", padding: 20, color: "#c62828", fontSize: "0.82rem", fontWeight: 600 }}>{error}</div>
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ borderRadius: 16, border: "1px solid #e0e3e8", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0f3460)", padding: "28px", color: "#fff" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.8, marginBottom: 6 }}>AI Wealth Advisory Engine</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900 }}>Generating Your Portfolio...</div>
        </div>
        <div style={{ padding: "60px 28px", textAlign: "center", background: "#fff" }}>
          <div style={{ width: 56, height: 56, border: "3px solid #e8eaf6", borderTopColor: "#1a237e", borderRadius: "50%", margin: "0 auto 20px", animation: "wa-spin 0.8s linear infinite" }} />
          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>Building Institutional Portfolio</div>
          <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: 16 }}>Analyzing {profile?.age}-year-old {profile?.riskTolerance} investor with {formatINR(profile?.investmentCorpus || 0)} corpus</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {["Risk Profiling", "Asset Allocation", "Macro Analysis", "Stress Testing", "Wealth Projection"].map((s, i) => (
              <span key={s} style={{ fontSize: "0.58rem", fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "#e8eaf6", color: "#283593", animation: `wa-shimmer 2s infinite ${i * 0.3}s` }}>{s}</span>
            ))}
          </div>
        </div>
        <style>{`@keyframes wa-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes wa-shimmer{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      </div>
    );
  }

  if (!data || !profile) return null;

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e0e3e8", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00e676", boxShadow: "0 0 8px rgba(0,230,118,0.5)" }} />
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.8 }}>AI Wealth Advisory Engine</span>
          </div>
          <button onClick={() => { setData(null); setProfile(null); }} style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer",
            fontSize: "0.72rem", fontWeight: 600,
          }}>
            New Analysis
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 900 }}>{data.investorClassification.category} Portfolio</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.62rem", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,0.1)" }}>Age: {profile.age}</span>
          <span style={{ fontSize: "0.62rem", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,0.1)" }}>Corpus: {formatINR(profile.investmentCorpus)}</span>
          <span style={{ fontSize: "0.62rem", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,0.1)" }}>Risk: {profile.riskTolerance}</span>
          <span style={{ fontSize: "0.62rem", padding: "3px 10px", borderRadius: 4, background: "rgba(255,255,255,0.1)" }}>Horizon: {profile.timeHorizon}Y</span>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{
        display: "flex", gap: 4, padding: "10px 16px",
        borderBottom: "1px solid #e5e7eb", background: "#f8f9ff",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {WEALTH_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid",
              borderColor: activeSection === sec.id ? "#1a237e" : "transparent",
              background: activeSection === sec.id ? "#e8eaf6" : "transparent",
              color: activeSection === sec.id ? "#1a237e" : "#666",
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
      <div style={{ padding: "20px 24px", minHeight: 400, background: "#fff" }}>
        {activeSection === "profile" && <ProfileSection data={data} profile={profile} />}
        {activeSection === "allocation" && <AllocationSection allocations={data.assetAllocations} corpus={profile.investmentCorpus} />}
        {activeSection === "risk" && <RiskSection data={data} />}
        {activeSection === "equity" && <EquitySection data={data} />}
        {activeSection === "fixedincome" && <FixedIncomeSection data={data} />}
        {activeSection === "gold" && <GoldSection data={data} />}
        {activeSection === "macro" && <MacroSection overlays={data.macroOverlays} />}
        {activeSection === "stress" && <StressSection scenarios={data.stressScenarios} />}
        {activeSection === "institutional" && <InstitutionalSection views={data.institutionalViews} />}
        {activeSection === "roadmap" && <RoadmapSection data={data} profile={profile} />}
        {activeSection === "rebalance" && <RebalanceSection data={data} />}
        {activeSection === "committee" && <CommitteeSection data={data} />}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 24px", borderTop: "1px solid #e5e7eb", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1a237e" }} />
        <span style={{ fontSize: "0.56rem", color: "#aaa", fontWeight: 600, letterSpacing: 0.5 }}>MOONLIGHT AI WEALTH ADVISORY ENGINE</span>
      </div>
    </div>
  );
}
