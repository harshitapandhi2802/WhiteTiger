"use client";
import Link from "next/link";
import { TrendingUp, Globe, Shield, Zap, CheckCircle, Star, BarChart2, AlertTriangle } from "lucide-react";

const differentiators = [
  {
    icon: Globe,
    title: "Geopolitical Risk Analysis",
    tag: "Only on MoonLight",
    desc: "US tariffs, China+1 impact, PLI scheme tailwinds, Fed rate sensitivity — mapped to every stock. Zerodha and Groww show you charts. We tell you what's happening in Washington and Beijing that will move your portfolio.",
    highlight: true,
  },
  {
    icon: BarChart2,
    title: "AI-Powered DCF Valuation",
    tag: "Institutional grade",
    desc: "Fair value estimates using discounted cash flow models. The same framework used by Goldman Sachs and Morgan Stanley analysts — available to every retail investor instantly.",
    highlight: false,
  },
  {
    icon: TrendingUp,
    title: "Investment Thesis + Entry Strategy",
    tag: "Actionable",
    desc: "Not just 'buy' or 'sell' — you get the buy zone, stop loss, 12-month target, and position sizing guidance. Research that tells you exactly what to do.",
    highlight: false,
  },
  {
    icon: Shield,
    title: "Macro Risk Scoring",
    tag: "Unique",
    desc: "Every analysis includes a geopolitical sensitivity score — LOW / MEDIUM / HIGH — so you instantly know how exposed your stock is to global events before you invest.",
    highlight: false,
  },
];

const vsComparison = [
  { feature: "DCF Fair Value Estimate", ml: true, zerodha: false, groww: false },
  { feature: "Investment Thesis", ml: true, zerodha: false, groww: false },
  { feature: "Geopolitical Risk Analysis", ml: true, zerodha: false, groww: false },
  { feature: "US Tariff / China+1 Impact", ml: true, zerodha: false, groww: false },
  { feature: "PLI Scheme Beneficiary Check", ml: true, zerodha: false, groww: false },
  { feature: "Entry Zone + Stop Loss", ml: true, zerodha: false, groww: false },
  { feature: "Fed Rate Sensitivity", ml: true, zerodha: false, groww: false },
  { feature: "Buy/Sell/Hold Signal", ml: true, zerodha: true, groww: true },
  { feature: "Price Charts", ml: false, zerodha: true, groww: true },
];

const testimonials = [
  { name: "Vikram S.", role: "Retail Investor, Mumbai", text: "I finally understood how US Fed decisions were killing my IT stocks. MoonLight flagged it before I lost more money." },
  { name: "Priya M.", role: "NISM Certified Advisor", text: "The China+1 analysis on manufacturing stocks is something no other free tool gives. My clients ask me how I know this stuff." },
  { name: "Rohan K.", role: "MBA Student, Bangalore", text: "Used MoonLight to analyze Adani Ports for a case study. The geopolitical section alone was worth 10 pages of research." },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(10,10,15,0.95)", backdropFilter: "blur(10px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>MoonLight</span>
          <span className="badge badge-purple" style={{ marginLeft: 4 }}>Beta</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <a href="#compare" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>vs Zerodha</a>
          <a href="#pricing" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>Pricing</a>
          <Link href="/analyze">
            <button className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.9rem" }}>Try Free →</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "5rem 2rem 4rem", maxWidth: 860, margin: "0 auto" }}>
        <div className="badge badge-yellow" style={{ marginBottom: "1.5rem", display: "inline-flex" }}>
          <Globe size={12} />
          <span>Geopolitics-aware stock research — a first in India</span>
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)", fontWeight: 800, lineHeight: 1.12, color: "var(--text-primary)", margin: "0 0 1.5rem" }}>
          Zerodha shows you charts.<br />
          <span style={{ color: "var(--accent)" }}>MoonLight tells you why.</span>
        </h1>
        <p style={{ fontSize: "1.15rem", color: "var(--text-muted)", maxWidth: 600, margin: "0 auto 1.5rem", lineHeight: 1.75 }}>
          The only stock research tool in India that layers <strong style={{ color: "var(--text-primary)" }}>geopolitical risk</strong>, US-India trade dynamics, China+1 impact, and PLI tailwinds onto every analysis — alongside institutional-grade DCF valuations.
        </p>
        <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", maxWidth: 520, margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
          What a Goldman Sachs analyst spends a week on, MoonLight delivers in 60 seconds.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/analyze">
            <button className="btn-primary" style={{ padding: "14px 32px", fontSize: "1.05rem" }}>
              Analyze a Stock Free →
            </button>
          </Link>
          <a href="#compare">
            <button style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 28px", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}>
              See what others miss ↓
            </button>
          </a>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "1rem" }}>3 free analyses/month · No credit card</p>
      </section>

      {/* The thing nobody else does */}
      <section style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "3rem 2rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", justifyContent: "center" }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <span style={{ color: "var(--warning)", fontWeight: 700, fontSize: "0.9rem" }}>WHAT ZERODHA & GROWW DON'T TELL YOU</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", textAlign: "center" }}>
            {[
              { q: "Is your IT stock at risk from US tariffs on Indian services?", color: "var(--danger)" },
              { q: "Which pharma stocks benefit from US-China decoupling?", color: "var(--warning)" },
              { q: "How does Fed rate hike affect FII selling in your portfolio?", color: "var(--accent)" },
              { q: "Which companies are PLI scheme winners in next 2 years?", color: "var(--success)" },
            ].map((item) => (
              <div key={item.q} style={{ padding: "1.25rem", background: "var(--bg-primary)", borderRadius: 10, border: `1px solid ${item.color}30` }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>{item.q}</p>
                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", fontWeight: 700, color: item.color }}>MoonLight answers this</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: "5rem auto", padding: "0 2rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--text-primary)" }}>
          Research that actually reflects the world you live in
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem" }}>
          Markets don't move in isolation. Neither should your research.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {differentiators.map((f) => (
            <div key={f.title} className="card" style={{ padding: "1.75rem", border: f.highlight ? "1px solid var(--accent)" : undefined, position: "relative" }}>
              {f.highlight && (
                <div style={{ position: "absolute", top: -12, left: 20 }}>
                  <span className="badge badge-purple">{f.tag}</span>
                </div>
              )}
              <div style={{ width: 44, height: 44, background: f.highlight ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", border: "1px solid var(--border)" }}>
                <f.icon size={22} color={f.highlight ? "var(--accent)" : "var(--text-muted)"} />
              </div>
              {!f.highlight && <span className="badge badge-yellow" style={{ marginBottom: "0.75rem", display: "inline-flex" }}>{f.tag}</span>}
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)", fontSize: "1rem" }}>{f.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample analysis teaser */}
      <section style={{ maxWidth: 820, margin: "0 auto 5rem", padding: "0 2rem" }}>
        <div className="card" style={{ padding: "2rem", border: "1px solid rgba(99,102,241,0.35)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>SAMPLE ANALYSIS EXCERPT</div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Tata Motors · TATAMOTORS.NS</h3>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="badge badge-green">BUY</span>
              <span className="badge badge-purple">Fair Value: ₹1,080</span>
            </div>
          </div>
          <div className="prose-dark">
            <h2>🌍 Geopolitical &amp; Macro Risk Analysis</h2>
            <p><strong>US-India trade relations:</strong> Tata Motors' JLR exports to the US face <strong>minimal direct tariff risk</strong> as luxury vehicles from UK are subject to existing MFN rates. However, a potential US-UK FTA could reduce tariffs from 6.5% → 2.5%, acting as a significant earnings catalyst for JLR's North America segment (~28% of revenue).</p>
            <p><strong>China factor:</strong> JLR's China sales (~22% of volume) remain under pressure from BYD and NIO competition in the premium EV space. This is the single biggest geopolitical risk — a China EV price war could compress JLR margins by 200-300bps in FY26.</p>
            <p><strong>India PLI tailwind:</strong> Tata Motors is a direct PLI beneficiary under the Auto PLI scheme (₹25,938 Cr incentive pool). Expected to receive ₹800-1,200 Cr in PLI incentives by FY27, boosting EV segment margins.</p>
            <p><strong>Geopolitical Risk Score:</strong> <strong style={{ color: "var(--warning)" }}>MEDIUM</strong> — China JLR exposure is a real risk, offset by India EV dominance and PLI tailwinds.</p>
          </div>
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(99,102,241,0.05)", borderRadius: 8, border: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>This is just one section. Full analysis includes DCF, entry strategy, catalysts + more. </span>
            <Link href="/analyze" style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.85rem" }}>Run yours free →</Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section id="compare" style={{ maxWidth: 800, margin: "0 auto 5rem", padding: "0 2rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.75rem" }}>MoonLight vs the rest</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "2.5rem" }}>What you get that nowhere else provides</p>
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "1rem 1.25rem", textAlign: "left", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>FEATURE</th>
                <th style={{ padding: "1rem", textAlign: "center", color: "var(--accent)", fontSize: "0.85rem", fontWeight: 700 }}>MoonLight</th>
                <th style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Zerodha</th>
                <th style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Groww</th>
              </tr>
            </thead>
            <tbody>
              {vsComparison.map((row, i) => (
                <tr key={row.feature} style={{ borderBottom: i < vsComparison.length - 1 ? "1px solid var(--border)" : undefined, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "0.85rem 1.25rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>{row.feature}</td>
                  <td style={{ padding: "0.85rem", textAlign: "center" }}>{row.ml ? <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span> : <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>—</span>}</td>
                  <td style={{ padding: "0.85rem", textAlign: "center" }}>{row.zerodha ? <span style={{ color: "var(--text-muted)" }}>✓</span> : <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>—</span>}</td>
                  <td style={{ padding: "0.85rem", textAlign: "center" }}>{row.groww ? <span style={{ color: "var(--text-muted)" }}>✓</span> : <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 1000, margin: "0 auto 5rem", padding: "0 2rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 700, marginBottom: "2.5rem" }}>What investors are saying</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
          {testimonials.map((t) => (
            <div key={t.name} className="card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", gap: "2px", marginBottom: "0.75rem" }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ color: "#b0b0cc", fontSize: "0.9rem", lineHeight: 1.65, margin: "0 0 1rem" }}>"{t.text}"</p>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 800, margin: "0 auto 6rem", padding: "0 2rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.75rem" }}>Simple pricing</h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "2.5rem" }}>Less than a cup of coffee a week. More than what your broker gives you for free.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>FREE</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1.5rem" }}>₹0<span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>/mo</span></div>
            {["3 full analyses per month", "DCF fair value", "Investment thesis", "Geopolitical risk section", "Entry zone + stop loss"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.7rem" }}>
                <CheckCircle size={15} color="var(--success)" />
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{f}</span>
              </div>
            ))}
            <Link href="/analyze">
              <button className="btn-primary" style={{ width: "100%", marginTop: "1.5rem", background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                Start Free
              </button>
            </Link>
          </div>
          <div className="card" style={{ padding: "2rem", border: "1px solid var(--accent)", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
              <span className="badge badge-purple">Most Popular</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--accent)", marginBottom: "0.5rem", fontWeight: 600 }}>PRO</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1.5rem" }}>₹299<span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>/mo</span></div>
            {["Unlimited analyses", "Everything in Free", "PDF annual report upload", "Portfolio watchlist + alerts", "Sector macro dashboard", "Priority support"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.7rem" }}>
                <CheckCircle size={15} color="var(--accent)" />
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{f}</span>
              </div>
            ))}
            <Link href="/analyze">
              <button className="btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
                Go Pro — ₹299/mo →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
          Stop investing blind to global events
        </h2>
        <p style={{ color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 2rem", lineHeight: 1.7 }}>
          Every day you invest without geopolitical context, you're leaving money on the table. 3 free analyses. No card needed.
        </p>
        <Link href="/analyze">
          <button className="btn-primary" style={{ padding: "14px 36px", fontSize: "1.05rem" }}>Analyze Your First Stock →</button>
        </Link>
      </section>

      <footer style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.78rem" }}>
        © 2025 MoonLight · AI Stock Research · Not SEBI registered. For informational purposes only. Past performance is not indicative of future results.
      </footer>
    </div>
  );
}
