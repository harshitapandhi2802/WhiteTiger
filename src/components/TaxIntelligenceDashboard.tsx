"use client";
import { useState, useMemo, useCallback } from "react";
import {
  calculatePersonalTax, calculateInvestmentTax, calculateGST,
  generateTaxCopilot, TAX_POLICY_UPDATES, TAX_NAV_SECTIONS, formatINR,
  getDaysUntil, TAX_CALENDAR_EVENTS, TAX_NEWS_FEED, INVESTMENT_TAX_FLOWS,
  generateTaxSavingInsights, getSlabComparisonData, OFFICIAL_TAX_SOURCES,
  type PersonalTaxInput, type InvestmentTaxInput, type GSTInput,
  type PersonalTaxReport, type InvestmentTaxReport, type GSTReport,
  type TaxCopilotNarrative, type TaxSection, type RegimeComparison,
} from "@/lib/tax-engine";

/* ═══════════════════════════════════════════════════════════════
   MOONLIGHT AI TAX INTELLIGENCE PLATFORM
   Personal Tax · Investment Tax · GST · Tax Savings · AI Copilot
   ═══════════════════════════════════════════════════════════════ */

/* ─── Utility: Score Ring ─── */
function ScoreRing({ value, label, color, size = 78 }: { value: number; label: string; color: string; size?: number }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, value) / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8eaf6" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ marginTop: -(size / 2) - 8, position: "relative" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 900, color }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", marginTop: (size / 2) - 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

/* ─── Number Input with Label ─── */
function NumField({ label, value, onChange, placeholder, hint }: {
  label: string; value: number; onChange: (v: number) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div style={{ flex: "1 1 200px", minWidth: 170 }}>
      <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>{label}</label>
      <input
        type="number" min={0} value={value || ""} placeholder={placeholder || "0"}
        onChange={e => onChange(Number(e.target.value) || 0)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)",
          fontSize: "0.88rem", fontWeight: 700, background: "#fff",
        }}
      />
      {hint && <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

/* ─── Expandable Card ─── */
function ExpandCard({ title, subtitle, icon, color, children, defaultOpen }: {
  title: string; subtitle?: string; icon: string; color: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden", background: "#fff",
      border: open ? `2px solid ${color}` : "1px solid var(--border)",
      transition: "all 0.3s", marginBottom: 12,
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "16px 22px", display: "flex", alignItems: "center", gap: 12,
        background: open ? `${color}05` : "transparent", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ fontSize: "1.3rem" }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>{title}</div>
          {subtitle && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</div>}
        </div>
        <span style={{ fontSize: "1.2rem", transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-muted)" }}>▾</span>
      </button>
      {open && <div style={{ padding: "0 22px 20px", borderTop: `1px solid ${color}10` }}>{children}</div>}
    </div>
  );
}

/* ─── Slab Table ─── */
function SlabTable({ regime }: { regime: RegimeComparison }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
        <thead>
          <tr style={{ background: "var(--bg-secondary)" }}>
            <th style={{ padding: "8px 14px", textAlign: "left", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Slab</th>
            <th style={{ padding: "8px 14px", textAlign: "center", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Rate</th>
            <th style={{ padding: "8px 14px", textAlign: "right", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Amount</th>
            <th style={{ padding: "8px 14px", textAlign: "right", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Tax</th>
          </tr>
        </thead>
        <tbody>
          {regime.slabs.map((sl, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "8px 14px", fontWeight: 600 }}>{sl.slab}</td>
              <td style={{ padding: "8px 14px", textAlign: "center", fontWeight: 700, color: sl.rate === 0 ? "#00c853" : sl.rate <= 10 ? "#ff9800" : "#c62828" }}>{sl.rate}%</td>
              <td style={{ padding: "8px 14px", textAlign: "right" }}>{formatINR(sl.taxableAmount)}</td>
              <td style={{ padding: "8px 14px", textAlign: "right", fontWeight: 700, color: sl.tax > 0 ? "#c62828" : "#00c853" }}>{formatINR(sl.tax)}</td>
            </tr>
          ))}
          <tr style={{ background: "var(--bg-secondary)", fontWeight: 800 }}>
            <td style={{ padding: "8px 14px" }}>Cess (4%)</td>
            <td colSpan={2}></td>
            <td style={{ padding: "8px 14px", textAlign: "right", color: "#c62828" }}>{formatINR(regime.cess)}</td>
          </tr>
          <tr style={{ background: "#0d47a1", color: "#fff", fontWeight: 800 }}>
            <td style={{ padding: "10px 14px" }}>Total Tax</td>
            <td style={{ padding: "10px 14px", textAlign: "center" }}>{regime.effectiveRate}% eff.</td>
            <td></td>
            <td style={{ padding: "10px 14px", textAlign: "right", fontSize: "1rem" }}>{formatINR(regime.totalTax)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function TaxIntelligenceDashboard() {
  const [activeSection, setActiveSection] = useState<TaxSection>("copilot");
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");

  // Personal Tax State
  const [personalInput, setPersonalInput] = useState<PersonalTaxInput>({
    annualSalary: 0, businessIncome: 0, rentalIncome: 0, foreignIncome: 0, otherIncome: 0,
    age: "below60", section80C: 0, section80D: 0, section80E: 0, nps80CCD: 0, hra: 0, homeLoan: 0, otherDeductions: 0,
  });
  const [personalReport, setPersonalReport] = useState<PersonalTaxReport | null>(null);

  // Investment Tax State
  const [investInput, setInvestInput] = useState<InvestmentTaxInput>({
    stockSTCG: 0, stockLTCG: 0, mfEquitySTCG: 0, mfEquityLTCG: 0, mfDebtGains: 0,
    foIncome: 0, cryptoGains: 0, commodityGains: 0, dividendIncome: 0, reitIncome: 0,
  });
  const [investReport, setInvestReport] = useState<InvestmentTaxReport | null>(null);

  // GST State
  const [gstInput, setGstInput] = useState<GSTInput>({ annualTurnover: 0, gstCategory: "services", exports: 0, inputCredits: 0 });
  const [gstReport, setGstReport] = useState<GSTReport | null>(null);

  // Policy filter
  const [policyFilter, setPolicyFilter] = useState("All");

  // Live Dashboard State
  const [calendarFilter, setCalendarFilter] = useState<"All" | "ITR" | "GST" | "TDS" | "Advance Tax" | "Audit">("All");
  const [newsFilter, setNewsFilter] = useState("All");
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [liveDashTab, setLiveDashTab] = useState<"news" | "calendar" | "slabs" | "flows" | "insights" | "sources">("news");

  // Copilot
  const copilot = useMemo(() => generateTaxCopilot(personalReport, investReport), [personalReport, investReport]);

  const savingInsights = useMemo(() => generateTaxSavingInsights(personalReport, investReport), [personalReport, investReport]);
  const slabComparison = useMemo(() => getSlabComparisonData(), []);
  const upcomingEvents = useMemo(() =>
    TAX_CALENDAR_EVENTS
      .map(e => ({ ...e, daysLeft: getDaysUntil(e.date) }))
      .filter(e => e.daysLeft > -7)
      .sort((a, b) => a.daysLeft - b.daysLeft),
    []);

  const handlePersonalCalc = useCallback(() => {
    const r = calculatePersonalTax(personalInput);
    setPersonalReport(r);
  }, [personalInput]);

  const handleInvestCalc = useCallback(() => {
    const r = calculateInvestmentTax(investInput);
    setInvestReport(r);
  }, [investInput]);

  const handleGSTCalc = useCallback(() => {
    const r = calculateGST(gstInput);
    setGstReport(r);
  }, [gstInput]);

  const pf = (key: keyof PersonalTaxInput) => (v: number) => setPersonalInput(p => ({ ...p, [key]: v }));
  const invf = (key: keyof InvestmentTaxInput) => (v: number) => setInvestInput(p => ({ ...p, [key]: v }));

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 4px 28px rgba(0,0,0,0.06)" }}>
      {/* ═══ HERO HEADER ═══ */}
      <div style={{
        background: "linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d2137 100%)",
        padding: "24px 28px 16px", color: "#fff", position: "relative",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.5rem" }}>🧠</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900 }}>AI Tax Intelligence</h2>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 10px", borderRadius: 20, fontSize: "0.55rem", fontWeight: 700,
                    background: "rgba(0,200,83,0.12)", color: "#69f0ae",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#69f0ae", animation: "tax-pulse 2s infinite" }} />
                    FY 2025-26
                  </span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  Personal Tax · Investment Tax · GST · Tax Savings · Policy Updates
                </div>
              </div>
            </div>
            {/* Mode Toggle */}
            <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
              {(["beginner", "advanced"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: "5px 14px", border: "none", cursor: "pointer",
                  fontSize: "0.62rem", fontWeight: 700, textTransform: "capitalize",
                  background: mode === m ? "rgba(41,98,255,0.6)" : "rgba(255,255,255,0.04)",
                  color: mode === m ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                }}>
                  {m === "beginner" ? "🎓" : "🏛️"} {m}
                </button>
              ))}
            </div>
          </div>

          {/* Copilot Quick Summary */}
          {(personalReport || investReport) && (
            <div style={{
              padding: "10px 16px", borderRadius: 10, marginBottom: 8,
              background: `${copilot.moodColor}12`, border: `1px solid ${copilot.moodColor}25`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 700, color: copilot.moodColor }}>
                {copilot.moodEmoji} {copilot.headline}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SECTION NAV ═══ */}
      <div style={{
        display: "flex", gap: 4, padding: "10px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)", overflowX: "auto",
      }}>
        {TAX_NAV_SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 16px", borderRadius: 10, whiteSpace: "nowrap",
            border: activeSection === sec.id ? "1.5px solid #0d47a1" : "1px solid transparent",
            background: activeSection === sec.id ? "#e3f2fd" : "transparent",
            color: activeSection === sec.id ? "#0d47a1" : "var(--text-muted)",
            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: "0.82rem" }}>{sec.icon}</span> {sec.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ padding: "24px 28px", minHeight: 400, background: "#fff" }}>

        {/* ═══ AI COPILOT ═══ */}
        {activeSection === "copilot" && (
          <div>
            <div style={{
              borderRadius: 16, padding: "24px 28px", marginBottom: 20,
              background: "linear-gradient(135deg, #0a1628, #1a2744)", color: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: "1.5rem" }}>🧠</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900 }}>AI Tax Copilot</h3>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)" }}>Your personal AI CA + tax advisor</div>
                </div>
              </div>

              <div style={{ padding: "14px 18px", borderRadius: 12, background: `${copilot.moodColor}12`, border: `1px solid ${copilot.moodColor}25`, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: "1.1rem" }}>{copilot.moodEmoji}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: copilot.moodColor, textTransform: "uppercase" }}>
                    Tax Health: {copilot.mood}
                  </span>
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff", lineHeight: 1.6 }}>{copilot.headline}</div>
              </div>

              <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 16 }}>
                {copilot.summary}
              </div>

              {copilot.keyActions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#69f0ae", textTransform: "uppercase", marginBottom: 8 }}>🎯 Key Actions</div>
                  {copilot.keyActions.map((a, i) => (
                    <div key={i} style={{ padding: "8px 14px", marginBottom: 4, borderRadius: 8, background: "rgba(0,200,83,0.06)", border: "1px solid rgba(0,200,83,0.12)", fontSize: "0.78rem", color: "#69f0ae" }}>
                      ✅ {a}
                    </div>
                  ))}
                </div>
              )}

              {copilot.warnings.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#ff8a80", textTransform: "uppercase", marginBottom: 8 }}>⚠️ Warnings</div>
                  {copilot.warnings.map((w, i) => (
                    <div key={i} style={{ padding: "8px 14px", marginBottom: 4, borderRadius: 8, background: "rgba(239,83,80,0.06)", border: "1px solid rgba(239,83,80,0.12)", fontSize: "0.78rem", color: "#ff8a80" }}>
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {copilot.opportunities.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#82b1ff", textTransform: "uppercase", marginBottom: 8 }}>💡 Opportunities</div>
                  {copilot.opportunities.map((o, i) => (
                    <div key={i} style={{ padding: "8px 14px", marginBottom: 4, borderRadius: 8, background: "rgba(41,98,255,0.06)", border: "1px solid rgba(41,98,255,0.12)", fontSize: "0.78rem", color: "#82b1ff" }}>
                      {o}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick start cards */}
            {!personalReport && !investReport && (
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 14px" }}>🚀 Get Started — Calculate Your Taxes</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {[
                    { id: "personal" as TaxSection, icon: "💼", title: "Income Tax", desc: "Calculate personal income tax, compare old vs new regime, get deduction tips", color: "#0d47a1" },
                    { id: "investment" as TaxSection, icon: "📈", title: "Investment Tax", desc: "Stock gains, mutual funds, F&O, crypto — know your exact investment tax", color: "#00695c" },
                    { id: "gst" as TaxSection, icon: "🏪", title: "GST Calculator", desc: "Estimate GST liability, understand slabs, compliance calendar", color: "#e65100" },
                  ].map(card => (
                    <button key={card.id} onClick={() => setActiveSection(card.id)} style={{
                      padding: "20px 22px", borderRadius: 14, border: `1px solid ${card.color}20`,
                      background: `${card.color}04`, cursor: "pointer", textAlign: "left",
                      transition: "all 0.2s",
                    }}>
                      <div style={{ fontSize: "2rem", marginBottom: 8 }}>{card.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 4, color: card.color }}>{card.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{card.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary if reports exist */}
            {(personalReport || investReport) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {personalReport && (
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "rgba(13,71,161,0.04)", border: "1px solid rgba(13,71,161,0.12)" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0d47a1", textTransform: "uppercase", marginBottom: 8 }}>💼 Income Tax Summary</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0d47a1", marginBottom: 4 }}>{formatINR(personalReport[personalReport.recommended === "old" ? "oldRegime" : "newRegime"].totalTax)}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {personalReport.recommended === "old" ? "Old" : "New"} regime · {personalReport[personalReport.recommended === "old" ? "oldRegime" : "newRegime"].effectiveRate}% effective
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#00c853", fontWeight: 700, marginTop: 6 }}>
                      💰 Saving ₹{personalReport.savings.toLocaleString()} vs other regime
                    </div>
                  </div>
                )}
                {investReport && investReport.items.length > 0 && (
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "rgba(0,105,92,0.04)", border: "1px solid rgba(0,105,92,0.12)" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#00695c", textTransform: "uppercase", marginBottom: 8 }}>📈 Investment Tax Summary</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#00695c", marginBottom: 4 }}>{formatINR(investReport.totalTax)}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {investReport.effectiveRate}% effective · {investReport.items.length} categories
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#00c853", fontWeight: 700, marginTop: 6 }}>
                      Net returns: {formatINR(investReport.netReturns)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ PERSONAL INCOME TAX ═══ */}
        {activeSection === "personal" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>💼 Personal Income Tax Calculator</h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Calculate taxes under old & new regime · AI suggests the best option
            </p>

            {mode === "beginner" && (
              <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.78rem", color: "#1a73e8", lineHeight: 1.6 }}>
                🎓 <strong>How it works:</strong> Enter your income below. The AI will calculate your tax under both old and new regimes and tell you which one saves more money.
              </div>
            )}

            <ExpandCard title="Income Details" subtitle="Enter your annual income from all sources" icon="💰" color="#0d47a1" defaultOpen>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <NumField label="Annual Salary (CTC)" value={personalInput.annualSalary} onChange={pf("annualSalary")} placeholder="e.g. 1500000" hint="Gross salary before deductions" />
                <NumField label="Business Income" value={personalInput.businessIncome} onChange={pf("businessIncome")} hint="Freelancing, consulting, etc." />
                <NumField label="Rental Income" value={personalInput.rentalIncome} onChange={pf("rentalIncome")} hint="Monthly rent × 12" />
                <NumField label="Foreign Income" value={personalInput.foreignIncome} onChange={pf("foreignIncome")} hint="Income from outside India" />
                <NumField label="Other Income" value={personalInput.otherIncome} onChange={pf("otherIncome")} hint="FD interest, gifts, etc." />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)" }}>Age Category</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {([["below60", "Below 60"], ["60to80", "60-80 (Senior)"], ["above80", "80+ (Super Senior)"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setPersonalInput(p => ({ ...p, age: val }))} style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                      border: personalInput.age === val ? "1.5px solid #0d47a1" : "1px solid var(--border)",
                      background: personalInput.age === val ? "#e3f2fd" : "#fff",
                      color: personalInput.age === val ? "#0d47a1" : "var(--text-muted)",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </ExpandCard>

            <ExpandCard title="Deductions (Old Regime)" subtitle="These deductions reduce taxable income under the old regime" icon="📋" color="#00695c">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <NumField label="80C (ELSS, PPF, EPF, LIC)" value={personalInput.section80C} onChange={pf("section80C")} hint="Max ₹1,50,000" />
                <NumField label="80D (Health Insurance)" value={personalInput.section80D} onChange={pf("section80D")} hint="Max ₹25K (self) + ₹25K (parents)" />
                <NumField label="80CCD(1B) NPS" value={personalInput.nps80CCD} onChange={pf("nps80CCD")} hint="Extra ₹50,000 for NPS" />
                <NumField label="80E (Education Loan Interest)" value={personalInput.section80E} onChange={pf("section80E")} hint="No upper limit" />
                <NumField label="HRA Exemption" value={personalInput.hra} onChange={pf("hra")} hint="Based on rent paid" />
                <NumField label="Home Loan Interest (Sec 24)" value={personalInput.homeLoan} onChange={pf("homeLoan")} hint="Max ₹2,00,000" />
                <NumField label="Other Deductions" value={personalInput.otherDeductions} onChange={pf("otherDeductions")} hint="80G donations, etc." />
              </div>
            </ExpandCard>

            <button onClick={handlePersonalCalc} style={{
              width: "100%", padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #0d47a1, #1565c0)", color: "#fff",
              fontSize: "0.92rem", fontWeight: 800, marginBottom: 24,
              boxShadow: "0 4px 16px rgba(13,71,161,0.3)",
            }}>
              🧠 Calculate Tax & Get AI Insights
            </button>

            {/* ─── RESULTS ─── */}
            {personalReport && (
              <div>
                {/* Recommendation Banner */}
                <div style={{
                  padding: "16px 22px", borderRadius: 14, marginBottom: 20,
                  background: "linear-gradient(135deg, #00c853, #00e676)", color: "#fff",
                }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", marginBottom: 6, opacity: 0.8 }}>🏆 AI Recommendation</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: 4 }}>
                    {personalReport.recommended === "old" ? "Old" : "New"} Tax Regime saves you {formatINR(personalReport.savings)}
                  </div>
                  <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                    Effective tax rate: {personalReport[personalReport.recommended === "old" ? "oldRegime" : "newRegime"].effectiveRate}% · Monthly take-home: {formatINR(personalReport[personalReport.recommended === "old" ? "oldRegime" : "newRegime"].monthlyTakeHome)}
                  </div>
                </div>

                {/* Side-by-side comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {[personalReport.oldRegime, personalReport.newRegime].map(regime => {
                    const isRecommended = regime.regime === personalReport.recommended;
                    return (
                      <div key={regime.regime} style={{
                        borderRadius: 14, overflow: "hidden",
                        border: isRecommended ? "2px solid #00c853" : "1px solid var(--border)",
                        position: "relative",
                      }}>
                        {isRecommended && (
                          <div style={{ position: "absolute", top: 8, right: 8, padding: "3px 10px", borderRadius: 20, background: "#00c853", color: "#fff", fontSize: "0.58rem", fontWeight: 800 }}>
                            ✅ RECOMMENDED
                          </div>
                        )}
                        <div style={{ padding: "16px 20px", background: isRecommended ? "#e8f5e9" : "var(--bg-secondary)" }}>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                            {regime.label}
                          </div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: isRecommended ? "#00833a" : "#0d47a1" }}>
                            {formatINR(regime.totalTax)}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                            Effective rate: {regime.effectiveRate}% · Take-home: {formatINR(regime.takeHome)}
                          </div>
                        </div>
                        <div style={{ padding: "12px 20px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                            <div style={{ padding: "6px 10px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                              <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Deductions</div>
                              <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>{formatINR(regime.totalDeductions)}</div>
                            </div>
                            <div style={{ padding: "6px 10px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                              <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Monthly Tax</div>
                              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#c62828" }}>{formatINR(regime.monthlyTax)}</div>
                            </div>
                          </div>
                          <SlabTable regime={regime} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Insights */}
                {personalReport.aiInsights.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 800, margin: "0 0 10px" }}>🤖 AI Tax Insights</h3>
                    {personalReport.aiInsights.map((insight, i) => (
                      <div key={i} style={{
                        padding: "10px 16px", marginBottom: 6, borderRadius: 10,
                        background: "rgba(124,58,237,0.04)", borderLeft: "3px solid #7c3aed",
                        fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6,
                      }}>
                        {insight}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ INVESTMENT TAX ═══ */}
        {activeSection === "investment" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>📈 Investment & Market Taxation</h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Stocks · Mutual Funds · F&O · Crypto · Commodities · Dividends · REITs
            </p>

            {mode === "beginner" && (
              <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(0,105,92,0.04)", border: "1px solid rgba(0,105,92,0.08)", fontSize: "0.78rem", color: "#00695c", lineHeight: 1.6 }}>
                🎓 <strong>How it works:</strong> Enter your gains/losses from each investment type. The AI will calculate exact tax for each category and show you how to reduce it.
              </div>
            )}

            <ExpandCard title="Stock Market Gains" subtitle="Short-term and long-term equity capital gains" icon="📊" color="#0d47a1" defaultOpen>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <NumField label="Stock STCG (< 1 year)" value={investInput.stockSTCG} onChange={invf("stockSTCG")} hint="Taxed at 20%" />
                <NumField label="Stock LTCG (> 1 year)" value={investInput.stockLTCG} onChange={invf("stockLTCG")} hint="12.5% above ₹1.25L exempt" />
              </div>
            </ExpandCard>

            <ExpandCard title="Mutual Fund Gains" subtitle="Equity MF and Debt MF taxation" icon="📋" color="#7c3aed">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <NumField label="Equity MF STCG" value={investInput.mfEquitySTCG} onChange={invf("mfEquitySTCG")} hint="< 12 months, taxed at 20%" />
                <NumField label="Equity MF LTCG" value={investInput.mfEquityLTCG} onChange={invf("mfEquityLTCG")} hint="> 12 months, 12.5% above ₹1.25L" />
                <NumField label="Debt MF Gains" value={investInput.mfDebtGains} onChange={invf("mfDebtGains")} hint="Taxed at slab rates (no indexation)" />
              </div>
            </ExpandCard>

            <ExpandCard title="F&O, Crypto & Commodities" subtitle="Derivatives and alternative investments" icon="⚡" color="#e65100">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <NumField label="F&O Net Profit" value={investInput.foIncome} onChange={invf("foIncome")} hint="Business income — slab rates" />
                <NumField label="Crypto Gains" value={investInput.cryptoGains} onChange={invf("cryptoGains")} hint="Flat 30% + 1% TDS" />
                <NumField label="Commodity Trading" value={investInput.commodityGains} onChange={invf("commodityGains")} hint="Business income — slab rates" />
              </div>
            </ExpandCard>

            <ExpandCard title="Dividends & REIT Income" subtitle="Passive income from stocks and real estate" icon="💰" color="#00695c">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <NumField label="Dividend Income" value={investInput.dividendIncome} onChange={invf("dividendIncome")} hint="Taxed at slab rates since 2020" />
                <NumField label="REIT / InvIT Income" value={investInput.reitIncome} onChange={invf("reitIncome")} hint="Mixed taxation" />
              </div>
            </ExpandCard>

            <button onClick={handleInvestCalc} style={{
              width: "100%", padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #00695c, #00897b)", color: "#fff",
              fontSize: "0.92rem", fontWeight: 800, marginBottom: 24,
              boxShadow: "0 4px 16px rgba(0,105,92,0.3)",
            }}>
              📈 Calculate Investment Tax
            </button>

            {/* Results */}
            {investReport && investReport.items.length > 0 && (
              <div>
                {/* Summary bar */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20,
                }}>
                  {[
                    { label: "Total Gains", value: formatINR(investReport.totalGains), color: "#0d47a1" },
                    { label: "Total Tax", value: formatINR(investReport.totalTax), color: "#c62828" },
                    { label: "Net Returns", value: formatINR(investReport.netReturns), color: "#00c853" },
                    { label: "Effective Rate", value: `${investReport.effectiveRate}%`, color: "#e65100" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "14px 18px", borderRadius: 12, background: `${m.color}06`, border: `1px solid ${m.color}15` }}>
                      <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 900, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Item cards */}
                {investReport.items.map((item, i) => (
                  <div key={i} style={{
                    padding: "16px 20px", borderRadius: 12, marginBottom: 10,
                    background: "#fff", border: "1px solid var(--border)",
                    borderLeft: `4px solid ${item.taxAmount > 0 ? "#c62828" : "#00c853"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.3rem" }}>{item.icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>{item.category}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Holding: {item.holding} · Rate: {item.taxRate}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: item.amount >= 0 ? "#00833a" : "#c62828" }}>{formatINR(item.amount)}</div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#c62828" }}>Tax: {formatINR(item.taxAmount)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 6 }}>
                      {item.explanation}
                    </div>
                    {mode === "beginner" && (
                      <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.72rem", color: "#1a73e8", lineHeight: 1.5 }}>
                        🎓 {item.beginnerTip}
                      </div>
                    )}
                  </div>
                ))}

                {/* AI Insights */}
                {investReport.aiInsights.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 800, margin: "0 0 10px" }}>🤖 Investment Tax Insights</h3>
                    {investReport.aiInsights.map((insight, i) => (
                      <div key={i} style={{ padding: "10px 16px", marginBottom: 6, borderRadius: 10, background: "rgba(0,105,92,0.04)", borderLeft: "3px solid #00695c", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {insight}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ GST ═══ */}
        {activeSection === "gst" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>🏪 GST Intelligence</h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Estimate GST liability · Understand slabs · Compliance calendar
            </p>

            <ExpandCard title="Business Details" subtitle="Enter your annual business figures" icon="🏢" color="#e65100" defaultOpen>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <NumField label="Annual Turnover" value={gstInput.annualTurnover} onChange={v => setGstInput(p => ({ ...p, annualTurnover: v }))} hint="Total revenue for FY" />
                <NumField label="Exports" value={gstInput.exports} onChange={v => setGstInput(p => ({ ...p, exports: v }))} hint="Zero-rated under GST" />
                <NumField label="Input Tax Credits" value={gstInput.inputCredits} onChange={v => setGstInput(p => ({ ...p, inputCredits: v }))} hint="GST paid on purchases" />
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)" }}>Business Type</label>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  {([["goods", "Goods"], ["services", "Services"], ["both", "Both"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setGstInput(p => ({ ...p, gstCategory: val }))} style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                      border: gstInput.gstCategory === val ? "1.5px solid #e65100" : "1px solid var(--border)",
                      background: gstInput.gstCategory === val ? "#fff3e0" : "#fff",
                      color: gstInput.gstCategory === val ? "#e65100" : "var(--text-muted)",
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </ExpandCard>

            <button onClick={handleGSTCalc} style={{
              width: "100%", padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #e65100, #ff6d00)", color: "#fff",
              fontSize: "0.92rem", fontWeight: 800, marginBottom: 24,
              boxShadow: "0 4px 16px rgba(230,81,0,0.3)",
            }}>
              🏪 Calculate GST
            </button>

            {gstReport && (
              <div>
                {/* Registration Status */}
                <div style={{
                  padding: "16px 22px", borderRadius: 14, marginBottom: 16,
                  background: gstReport.isRegistrationRequired ? "rgba(230,81,0,0.04)" : "rgba(0,200,83,0.04)",
                  border: `1px solid ${gstReport.isRegistrationRequired ? "rgba(230,81,0,0.15)" : "rgba(0,200,83,0.15)"}`,
                }}>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: gstReport.isRegistrationRequired ? "#e65100" : "#00833a", marginBottom: 4 }}>
                    {gstReport.isRegistrationRequired ? "⚠️ GST Registration Required" : "✅ GST Registration Optional"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Threshold: {gstReport.registrationThreshold} for {gstInput.gstCategory}
                  </div>
                </div>

                {/* GST Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(230,81,0,0.04)", border: "1px solid rgba(230,81,0,0.12)" }}>
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Estimated GST</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#e65100" }}>{formatINR(gstReport.estimatedGST)}</div>
                  </div>
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(0,105,92,0.04)", border: "1px solid rgba(0,105,92,0.12)" }}>
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Input Credits</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#00695c" }}>{formatINR(gstInput.inputCredits)}</div>
                  </div>
                  <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(198,40,40,0.04)", border: "1px solid rgba(198,40,40,0.12)" }}>
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Net GST Payable</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#c62828" }}>{formatINR(gstReport.netGST)}</div>
                  </div>
                </div>

                {/* GST Slabs */}
                <h3 style={{ fontSize: "0.92rem", fontWeight: 800, margin: "0 0 10px" }}>GST Rate Structure</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {gstReport.gstSlabs.map((slab, i) => (
                    <div key={i} style={{
                      padding: "12px 18px", borderRadius: 10, background: "#fff", border: "1px solid var(--border)",
                      borderLeft: `4px solid ${slab.rate === 0 ? "#00c853" : slab.rate <= 5 ? "#ff9800" : slab.rate <= 12 ? "#e65100" : "#c62828"}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.88rem" }}>{slab.slab}</span>
                        <span style={{ fontWeight: 800, color: slab.rate === 0 ? "#00c853" : "#e65100" }}>{slab.rate}%</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{slab.description}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>Examples: {slab.examples}</div>
                    </div>
                  ))}
                </div>

                {/* Compliance Calendar */}
                <h3 style={{ fontSize: "0.92rem", fontWeight: 800, margin: "0 0 10px" }}>📅 Compliance Calendar</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                    <thead>
                      <tr style={{ background: "#e65100", color: "#fff" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.62rem", textTransform: "uppercase" }}>Task</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "0.62rem", textTransform: "uppercase" }}>Frequency</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "0.62rem", textTransform: "uppercase" }}>Deadline</th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "0.62rem", textTransform: "uppercase" }}>Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstReport.complianceCalendar.map((c, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 700 }}>{c.task}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center" }}>{c.frequency}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#e65100" }}>{c.deadline}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontSize: "0.65rem", color: "#c62828" }}>{c.penalty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* AI Insights */}
                {gstReport.aiInsights.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    {gstReport.aiInsights.map((insight, i) => (
                      <div key={i} style={{ padding: "10px 16px", marginBottom: 6, borderRadius: 10, background: "rgba(230,81,0,0.04)", borderLeft: "3px solid #e65100", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {insight}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAX SAVINGS ═══ */}
        {activeSection === "savings" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>💰 AI Tax Saving Engine</h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Smart investment recommendations to legally reduce your tax burden
            </p>

            {mode === "beginner" && (
              <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(0,200,83,0.04)", border: "1px solid rgba(0,200,83,0.08)", fontSize: "0.78rem", color: "#00833a", lineHeight: 1.6 }}>
                🎓 <strong>Key idea:</strong> The Indian government WANTS you to invest and save. It rewards you with tax deductions. The more smartly you invest, the less tax you pay.
              </div>
            )}

            {/* Deduction Suggestions (if personal report exists) */}
            {personalReport && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 12px" }}>📋 Your Deduction Optimization</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                  {personalReport.deductionSuggestions.filter(d => d.potential > 0).map((d, i) => (
                    <div key={i} style={{ padding: "16px 20px", borderRadius: 12, background: "#fff", border: "1px solid var(--border)", borderLeft: "4px solid #00c853" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>Section {d.section}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{d.description}</div>
                        </div>
                        <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: "0.62rem", fontWeight: 700, background: "#e8f5e9", color: "#00833a" }}>
                          Limit: {d.maxLimit}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, padding: "6px 10px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Used</div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>{formatINR(d.currentUsed)}</div>
                        </div>
                        <div style={{ flex: 1, padding: "6px 10px", borderRadius: 8, background: "#e8f5e9" }}>
                          <div style={{ fontSize: "0.5rem", color: "#00833a" }}>Untapped Potential</div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#00833a" }}>{formatINR(d.potential)}</div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 6, background: "#e5e7ed", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${d.potential > 0 ? (d.currentUsed / (d.currentUsed + d.potential)) * 100 : 100}%`, background: "linear-gradient(90deg, #00c853, #69f0ae)" }} />
                      </div>
                      {mode === "beginner" && (
                        <div style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(41,98,255,0.04)", fontSize: "0.68rem", color: "#1a73e8", lineHeight: 1.5 }}>
                          🎓 {d.beginnerTip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tax Saving Instruments */}
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 12px" }}>🏆 Top Tax-Saving Instruments</h3>
            {(personalReport?.taxSavingPlan ?? [
              { name: "ELSS Mutual Funds", section: "80C", maxDeduction: "₹1,50,000", lockIn: "3 years", returns: "12-15% avg", risk: "High" as const, bestFor: "Wealth creation + tax saving", beginnerTip: "ELSS funds invest in stocks but save tax. 3-year lock-in is the shortest among all 80C options." },
              { name: "PPF", section: "80C", maxDeduction: "₹1,50,000", lockIn: "15 years", returns: "7.1%", risk: "Low" as const, bestFor: "Safe long-term savings", beginnerTip: "PPF is like a government FD that also saves tax. Returns are tax-free!" },
              { name: "NPS", section: "80CCD(1B)", maxDeduction: "₹50,000 extra", lockIn: "Until 60", returns: "8-10%", risk: "Medium" as const, bestFor: "Retirement + extra deduction", beginnerTip: "NPS gives ₹50,000 EXTRA deduction beyond 80C." },
              { name: "Health Insurance", section: "80D", maxDeduction: "₹25K-₹1L", lockIn: "Annual", returns: "Risk coverage", risk: "Low" as const, bestFor: "Health + tax saving", beginnerTip: "Health insurance premium saves tax AND protects from emergencies." },
              { name: "Home Loan", section: "24(b)+80C", maxDeduction: "₹3.5L total", lockIn: "Loan tenure", returns: "Property appreciation", risk: "Medium" as const, bestFor: "Home buyers", beginnerTip: "Both principal and interest deductible. Can reduce taxable income by up to ₹3.5L!" },
            ]).map((item, i) => {
              const riskC = item.risk === "Low" ? "#00c853" : item.risk === "Medium" ? "#ff9800" : "#ef5350";
              return (
                <div key={i} style={{
                  padding: "16px 20px", borderRadius: 12, marginBottom: 10,
                  background: "#fff", border: "1px solid var(--border)",
                  borderLeft: `4px solid ${riskC}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>{item.name}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.55rem", fontWeight: 700, background: "#e3f2fd", color: "#0d47a1" }}>Sec {item.section}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.55rem", fontWeight: 700, background: `${riskC}10`, color: riskC }}>{item.risk} Risk</span>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.55rem", fontWeight: 700, background: "#f3e5f5", color: "#7c3aed" }}>Lock-in: {item.lockIn}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0d47a1" }}>{item.maxDeduction}</div>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Max Deduction</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div style={{ padding: "6px 10px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                      <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Expected Returns</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 800 }}>{item.returns}</div>
                    </div>
                    <div style={{ padding: "6px 10px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                      <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Best For</div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)" }}>{item.bestFor}</div>
                    </div>
                  </div>
                  {mode === "beginner" && (
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.72rem", color: "#1a73e8", lineHeight: 1.5 }}>
                      🎓 {item.beginnerTip}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ POLICY UPDATES ═══ */}
        {activeSection === "policy" && (
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 4px" }}>🏛️ Tax Policy & Budget Intelligence</h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16 }}>
              How Union Budget, RBI, CBDT, and SEBI decisions affect your taxes and investments
            </p>

            {/* Category Filter */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
              {["All", "Budget", "RBI", "CBDT", "GST Council", "SEBI"].map(cat => (
                <button key={cat} onClick={() => setPolicyFilter(cat)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                  border: policyFilter === cat ? "1.5px solid #0d47a1" : "1px solid var(--border)",
                  background: policyFilter === cat ? "#e3f2fd" : "#fff",
                  color: policyFilter === cat ? "#0d47a1" : "var(--text-muted)",
                  transition: "all 0.2s",
                }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TAX_POLICY_UPDATES
                .filter(p => policyFilter === "All" || p.category === policyFilter)
                .map((update, i) => {
                  const impC = update.impact === "Positive" ? "#00c853" : update.impact === "Negative" ? "#c62828" : "#ff9800";
                  return (
                    <ExpandCard key={i} title={update.title} subtitle={`${update.date} · ${update.category}`} icon={update.icon} color={impC}>
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: `${impC}10`, color: impC }}>
                            {update.impact === "Positive" ? "📈 Positive" : update.impact === "Negative" ? "📉 Negative" : "➡️ Neutral"}
                          </span>
                          <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                            {update.affectedTaxpayers}
                          </span>
                        </div>
                        <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--bg-secondary)", fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 10 }}>
                          {update.detail}
                        </div>
                        {mode === "beginner" && (
                          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.75rem", color: "#1a73e8", lineHeight: 1.6 }}>
                            🎓 <strong>In simple terms:</strong> {update.beginnerExplanation}
                          </div>
                        )}
                      </div>
                    </ExpandCard>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         LIVE TAX INTELLIGENCE DASHBOARD — Always Visible Below
         ═══════════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: "2px solid var(--border)", background: "linear-gradient(180deg, #f8f9ff 0%, #fff 100%)" }}>
        {/* Dashboard Header */}
        <div style={{
          padding: "20px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.4rem" }}>📡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                Live Tax Intelligence Dashboard
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 10px", borderRadius: 20, fontSize: "0.55rem", fontWeight: 700,
                  background: "rgba(0,200,83,0.08)", color: "#00c853",
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00c853", animation: "tax-pulse 2s infinite" }} />
                  LIVE
                </span>
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                Real-time tax updates · Official sources · AI-powered insights
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Sub-Nav */}
        <div style={{ display: "flex", gap: 4, padding: "12px 28px", overflowX: "auto" }}>
          {([
            { id: "news" as const, label: "Tax News Feed", icon: "📰" },
            { id: "calendar" as const, label: "Tax Calendar", icon: "📅" },
            { id: "slabs" as const, label: "Slab Comparison", icon: "📊" },
            { id: "flows" as const, label: "Investment Tax Flows", icon: "🔄" },
            { id: "insights" as const, label: "AI Saving Tips", icon: "💡" },
            { id: "sources" as const, label: "Official Sources", icon: "🏛️" },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setLiveDashTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 10, whiteSpace: "nowrap",
              border: liveDashTab === tab.id ? "1.5px solid #0d47a1" : "1px solid var(--border)",
              background: liveDashTab === tab.id ? "linear-gradient(135deg, #0d47a1, #1565c0)" : "#fff",
              color: liveDashTab === tab.id ? "#fff" : "var(--text-muted)",
              fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              boxShadow: liveDashTab === tab.id ? "0 2px 10px rgba(13,71,161,0.2)" : "none",
            }}>
              <span style={{ fontSize: "0.8rem" }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "0 28px 24px", minHeight: 300 }}>

          {/* ═══ TAX NEWS FEED ═══ */}
          {liveDashTab === "news" && (
            <div>
              {/* Filter */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {["All", "Income Tax", "GST", "Capital Gains", "RBI", "Budget", "SEBI", "Crypto"].map(cat => (
                  <button key={cat} onClick={() => setNewsFilter(cat)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
                    border: newsFilter === cat ? "1.5px solid #0d47a1" : "1px solid var(--border)",
                    background: newsFilter === cat ? "#e3f2fd" : "#fff",
                    color: newsFilter === cat ? "#0d47a1" : "var(--text-muted)",
                  }}>
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TAX_NEWS_FEED
                  .filter(n => newsFilter === "All" || n.category === newsFilter)
                  .map((news, i) => {
                    const impC = news.impact === "Positive" ? "#00c853" : news.impact === "Negative" ? "#c62828" : "#ff9800";
                    return (
                      <div key={i} style={{
                        padding: "16px 20px", borderRadius: 14, background: "#fff",
                        border: "1px solid var(--border)", borderLeft: `4px solid ${impC}`,
                        transition: "all 0.2s",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: "0.88rem", lineHeight: 1.4, marginBottom: 4 }}>{news.title}</div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span style={{ fontSize: "0.85rem" }}>{news.sourceIcon}</span>
                              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)" }}>{news.source}</span>
                              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>·</span>
                              <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{news.timestamp}</span>
                              <span style={{ padding: "1px 8px", borderRadius: 6, fontSize: "0.55rem", fontWeight: 700, background: `${impC}10`, color: impC }}>
                                {news.impact === "Positive" ? "📈" : news.impact === "Negative" ? "📉" : "➡️"} {news.impact}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>
                          {news.summary}
                        </div>
                        {/* AI "What This Means" */}
                        <div style={{
                          padding: "10px 14px", borderRadius: 10,
                          background: "linear-gradient(135deg, rgba(41,98,255,0.04), rgba(124,58,237,0.04))",
                          border: "1px solid rgba(41,98,255,0.08)",
                        }}>
                          <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <span>🤖</span> AI: What This Means For You
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#1a73e8", lineHeight: 1.6 }}>
                            {news.aiExplanation}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ═══ TAX CALENDAR ═══ */}
          {liveDashTab === "calendar" && (
            <div>
              {/* Filter */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {(["All", "ITR", "GST", "TDS", "Advance Tax", "Audit"] as const).map(cat => (
                  <button key={cat} onClick={() => setCalendarFilter(cat)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
                    border: calendarFilter === cat ? "1.5px solid #c62828" : "1px solid var(--border)",
                    background: calendarFilter === cat ? "#ffebee" : "#fff",
                    color: calendarFilter === cat ? "#c62828" : "var(--text-muted)",
                  }}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Urgent Banner */}
              {upcomingEvents.filter(e => e.daysLeft <= 30 && e.daysLeft > 0).length > 0 && (
                <div style={{
                  padding: "12px 18px", borderRadius: 12, marginBottom: 16,
                  background: "linear-gradient(135deg, #c62828, #e53935)", color: "#fff",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: "1.3rem" }}>⏰</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>
                      {upcomingEvents.filter(e => e.daysLeft <= 30 && e.daysLeft > 0).length} deadline(s) within 30 days!
                    </div>
                    <div style={{ fontSize: "0.68rem", opacity: 0.8 }}>
                      Don&#39;t miss these — penalties apply for late compliance
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcomingEvents
                  .filter(e => calendarFilter === "All" || e.category === calendarFilter)
                  .map((event, i) => {
                    const urgentColor = event.daysLeft <= 7 ? "#c62828" : event.daysLeft <= 30 ? "#e65100" : event.daysLeft <= 90 ? "#ff9800" : "#00c853";
                    const priorityC = event.priority === "Critical" ? "#c62828" : event.priority === "High" ? "#e65100" : "#ff9800";
                    return (
                      <div key={i} style={{
                        padding: "14px 18px", borderRadius: 12, background: "#fff",
                        border: "1px solid var(--border)", borderLeft: `4px solid ${urgentColor}`,
                        display: "flex", alignItems: "flex-start", gap: 14,
                      }}>
                        {/* Countdown Circle */}
                        <div style={{
                          minWidth: 60, height: 60, borderRadius: 12,
                          background: `${urgentColor}08`, border: `2px solid ${urgentColor}`,
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        }}>
                          <div style={{ fontSize: "1.2rem", fontWeight: 900, color: urgentColor, lineHeight: 1 }}>
                            {event.daysLeft <= 0 ? "!" : event.daysLeft}
                          </div>
                          <div style={{ fontSize: "0.5rem", fontWeight: 700, color: urgentColor }}>
                            {event.daysLeft <= 0 ? "OVERDUE" : event.daysLeft === 1 ? "DAY" : "DAYS"}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: "1.1rem" }}>{event.icon}</span>
                            <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{event.title}</span>
                            <span style={{ padding: "1px 8px", borderRadius: 6, fontSize: "0.52rem", fontWeight: 800, background: `${priorityC}10`, color: priorityC }}>
                              {event.priority}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>
                            📆 {new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            <span style={{ marginLeft: 8, padding: "1px 6px", borderRadius: 4, fontSize: "0.55rem", fontWeight: 700, background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                              {event.category}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{event.description}</div>
                          <div style={{ fontSize: "0.65rem", color: "#c62828", marginTop: 4 }}>⚠️ Penalty: {event.penalty}</div>
                          {mode === "beginner" && (
                            <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, background: "rgba(41,98,255,0.04)", fontSize: "0.68rem", color: "#1a73e8", lineHeight: 1.5 }}>
                              🎓 {event.beginnerTip}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ═══ SLAB COMPARISON VISUALIZATION ═══ */}
          {liveDashTab === "slabs" && (
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 6px" }}>📊 Old vs New Regime — Tax Slab Comparison</h3>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 16 }}>
                FY 2025-26 · Visual comparison of tax rates at each income slab
              </p>

              {mode === "beginner" && (
                <div style={{ padding: "10px 16px", borderRadius: 10, marginBottom: 16, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.78rem", color: "#1a73e8", lineHeight: 1.6 }}>
                  🎓 <strong>How to read:</strong> Blue bars = old regime rates, Green bars = new regime rates. Where green is shorter, the new regime charges less tax. Most people below ₹12L pay zero under the new regime!
                </div>
              )}

              {/* Bar Chart */}
              <div style={{ padding: "16px 20px", borderRadius: 14, background: "#fff", border: "1px solid var(--border)", marginBottom: 20 }}>
                {slabComparison.map((slab, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, minWidth: 120 }}>{slab.slab}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {slab.difference < 0 && (
                          <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#00c853", padding: "1px 6px", borderRadius: 4, background: "#e8f5e9" }}>
                            ↓ {Math.abs(slab.difference)}% less
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#0d47a1", minWidth: 28 }}>Old</span>
                      <div style={{ flex: 1, height: 14, background: "#e8eaf6", borderRadius: 7, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 7, transition: "width 1s ease",
                          width: `${(slab.oldRate / 30) * 100}%`,
                          background: "linear-gradient(90deg, #0d47a1, #1976d2)",
                        }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0d47a1", minWidth: 30, textAlign: "right" }}>{slab.oldRate}%</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
                      <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#00833a", minWidth: 28 }}>New</span>
                      <div style={{ flex: 1, height: 14, background: "#e8f5e9", borderRadius: 7, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 7, transition: "width 1s ease",
                          width: `${(slab.newRate / 30) * 100}%`,
                          background: "linear-gradient(90deg, #00c853, #69f0ae)",
                        }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#00833a", minWidth: 30, textAlign: "right" }}>{slab.newRate}%</span>
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div style={{ display: "flex", gap: 16, marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: "linear-gradient(90deg, #0d47a1, #1976d2)" }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 700 }}>Old Regime</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: "linear-gradient(90deg, #00c853, #69f0ae)" }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 700 }}>New Regime (FY 2025-26)</span>
                  </div>
                </div>
              </div>

              {/* Key Takeaways */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {[
                  { icon: "🏆", title: "Income ≤ ₹12L", detail: "Zero tax under new regime (Section 87A rebate)", color: "#00c853" },
                  { icon: "⚖️", title: "₹5L – ₹12L Range", detail: "New regime has much lower rates (5-10% vs 20-30%)", color: "#2962ff" },
                  { icon: "📋", title: "Above ₹24L", detail: "Both regimes charge 30% — old regime wins if you have large deductions", color: "#e65100" },
                  { icon: "💡", title: "Break-even Point", detail: "New regime wins unless old regime deductions exceed ~₹3.75L", color: "#7c3aed" },
                ].map((tip, i) => (
                  <div key={i} style={{ padding: "14px 18px", borderRadius: 12, background: `${tip.color}04`, border: `1px solid ${tip.color}15` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: "1.1rem" }}>{tip.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: "0.82rem", color: tip.color }}>{tip.title}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{tip.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ INVESTMENT TAX FLOW EXPLAINERS ═══ */}
          {liveDashTab === "flows" && (
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 6px" }}>🔄 Investment Tax — How Each Asset is Taxed</h3>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 16 }}>
                Visual step-by-step flow showing exactly how tax works for each investment type
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {INVESTMENT_TAX_FLOWS.map((flow, fi) => {
                  const isOpen = expandedFlow === flow.assetClass;
                  return (
                    <div key={fi} style={{
                      borderRadius: 14, overflow: "hidden", background: "#fff",
                      border: isOpen ? `2px solid ${flow.color}` : "1px solid var(--border)",
                      transition: "all 0.3s",
                    }}>
                      <button onClick={() => setExpandedFlow(isOpen ? null : flow.assetClass)} style={{
                        width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
                        background: isOpen ? `${flow.color}05` : "transparent", border: "none", cursor: "pointer", textAlign: "left",
                      }}>
                        <span style={{ fontSize: "1.5rem" }}>{flow.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>{flow.assetClass}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{flow.taxSummary}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: flow.color, padding: "3px 10px", borderRadius: 8, background: `${flow.color}08` }}>
                            {flow.exemption || "No exemption"}
                          </div>
                        </div>
                        <span style={{ fontSize: "1.2rem", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-muted)", marginLeft: 8 }}>▾</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 20px 20px" }}>
                          {/* Flow Steps */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 14 }}>
                            {flow.steps.map((step, si) => (
                              <div key={si} style={{ display: "flex", alignItems: "stretch", gap: 12 }}>
                                {/* Connector line + dot */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 20 }}>
                                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: step.color, border: "3px solid #fff", boxShadow: `0 0 0 2px ${step.color}`, zIndex: 1, flexShrink: 0 }} />
                                  {si < flow.steps.length - 1 && (
                                    <div style={{ width: 2, flex: 1, background: `linear-gradient(${step.color}, ${flow.steps[si + 1].color})` }} />
                                  )}
                                </div>
                                <div style={{ padding: "2px 0 16px", flex: 1 }}>
                                  <div style={{ fontWeight: 800, fontSize: "0.82rem", color: step.color, marginBottom: 2 }}>{step.label}</div>
                                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{step.detail}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pro Tip */}
                          <div style={{
                            padding: "10px 14px", borderRadius: 10,
                            background: `${flow.color}06`, border: `1px solid ${flow.color}15`,
                          }}>
                            <div style={{ fontSize: "0.6rem", fontWeight: 800, color: flow.color, textTransform: "uppercase", marginBottom: 3 }}>💡 Pro Tip</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{flow.proTip}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ AI TAX SAVING INSIGHTS ═══ */}
          {liveDashTab === "insights" && (
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 6px" }}>💡 AI Tax Saving Insights</h3>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 16 }}>
                Personalized strategies to legally minimize your tax outgo
              </p>

              {!personalReport && (
                <div style={{ padding: "12px 18px", borderRadius: 10, marginBottom: 16, background: "rgba(255,152,0,0.04)", border: "1px solid rgba(255,152,0,0.12)", fontSize: "0.78rem", color: "#e65100", lineHeight: 1.6 }}>
                  💡 <strong>Tip:</strong> Calculate your personal tax first (Income Tax tab) for personalized saving recommendations!
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {savingInsights.map((insight, i) => {
                  const diffC = insight.difficulty === "Easy" ? "#00c853" : insight.difficulty === "Medium" ? "#ff9800" : "#7c3aed";
                  return (
                    <div key={i} style={{
                      padding: "18px 22px", borderRadius: 14, background: "#fff",
                      border: "1px solid var(--border)", borderTop: `3px solid ${insight.color}`,
                      transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "1.4rem" }}>{insight.icon}</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>{insight.title}</div>
                            <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                              <span style={{ padding: "1px 8px", borderRadius: 6, fontSize: "0.55rem", fontWeight: 700, background: `${diffC}10`, color: diffC }}>
                                {insight.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{
                          padding: "4px 12px", borderRadius: 8,
                          background: "linear-gradient(135deg, #00c853, #69f0ae)", color: "#fff",
                          fontSize: "0.72rem", fontWeight: 800,
                        }}>
                          {insight.potentialSaving}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
                        {insight.description}
                      </div>
                      {mode === "beginner" && (
                        <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)", fontSize: "0.72rem", color: "#1a73e8", lineHeight: 1.5 }}>
                          🎓 {insight.beginnerTip}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ OFFICIAL SOURCES ═══ */}
          {liveDashTab === "sources" && (
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 6px" }}>🏛️ Official Government Tax Portals</h3>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 16 }}>
                Direct links to authentic tax information from Indian government sources
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {OFFICIAL_TAX_SOURCES.map((src, i) => (
                  <div key={i} style={{
                    padding: "18px 22px", borderRadius: 14, background: "#fff",
                    border: "1px solid var(--border)", borderTop: `3px solid ${src.color}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${src.color}08`, fontSize: "1.5rem",
                      }}>
                        {src.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>{src.name}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{src.description}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {src.services.map((svc, si) => (
                        <span key={si} style={{
                          padding: "3px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700,
                          background: `${src.color}06`, color: src.color,
                        }}>
                          {svc}
                        </span>
                      ))}
                    </div>
                    <div style={{
                      padding: "8px 12px", borderRadius: 8, background: "var(--bg-secondary)",
                      fontSize: "0.68rem", fontWeight: 700, color: src.color,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      🔗 {src.url}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{ padding: "10px 28px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0d47a1" }} />
          <span style={{ fontSize: "0.56rem", color: "#aaa", fontWeight: 600, letterSpacing: 0.5 }}>MOONLIGHT AI TAX INTELLIGENCE · FY 2025-26</span>
        </div>
        <span style={{ fontSize: "0.52rem", color: "#bbb" }}>Not legal/tax advice. Consult a CA for your specific situation.</span>
      </div>

      <style>{`
        @keyframes tax-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
        }
      `}</style>
    </div>
  );
}
