"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TrendingUp, CheckCircle, Star, ArrowRight, BarChart3, Globe, Shield, Layers, Zap, Users, Target, Search } from "lucide-react";

/* ── Animated counter ── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.ceil(end / 40);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setVal(end); clearInterval(timer); }
          else setVal(start);
        }, 30);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val.toLocaleString("en-IN")}{suffix}</span>;
}

/* ── Scroll reveal ── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `all 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: "#fff", color: "#1a1d29" }}>
      {/* ── Navbar ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7ed", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, background: "#2962ff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>MoonLight</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#features" style={{ color: "#4a5068", fontSize: "0.88rem", fontWeight: 500, textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ color: "#4a5068", fontSize: "0.88rem", fontWeight: 500, textDecoration: "none" }}>Pricing</a>
          <Link href="/analyze">
            <button style={{ background: "#2962ff", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
              Open App
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "80px 32px 60px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#e8eeff", borderRadius: 20, padding: "5px 16px", fontSize: "0.78rem", fontWeight: 600, color: "#2962ff", marginBottom: 24 }}>
          <Zap size={13} /> India&apos;s first AI-powered multi-asset research platform
        </div>

        <h1 style={{ fontSize: "3.2rem", fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em" }}>
          Stocks · Commodities · Crypto<br />
          <span style={{ color: "#2962ff" }}>Research Beyond the Numbers</span>
        </h1>

        <p style={{ fontSize: "1.15rem", color: "#4a5068", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 32px" }}>
          Institutional-grade analysis across NSE stocks, MCX commodities, and crypto — with geopolitical risk, Koyfin insights, CoinDCX data, and supply chain intelligence.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/analyze">
            <button style={{ background: "#2962ff", color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(41,98,255,0.25)" }}>
              Start Analyzing <ArrowRight size={18} />
            </button>
          </Link>
          <a href="#features">
            <button style={{ background: "transparent", color: "#1a1d29", border: "1px solid #e5e7ed", borderRadius: 8, padding: "14px 32px", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}>
              See Features
            </button>
          </a>
        </div>

        <p style={{ marginTop: 16, color: "#8c91a5", fontSize: "0.82rem" }}>5 free analyses · No credit card required</p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginTop: 48, padding: "24px 0", borderTop: "1px solid #f0f1f5", borderBottom: "1px solid #f0f1f5" }}>
          {[
            { value: 120, suffix: "+", label: "NSE Stocks" },
            { value: 65, suffix: "+", label: "MCX Commodities" },
            { value: 40, suffix: "+", label: "Crypto Tokens" },
            { value: 15, suffix: "s", label: "Analysis Time" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#2962ff" }}><Counter end={s.value} suffix={s.suffix} /></div>
              <div style={{ fontSize: "0.78rem", color: "#8c91a5", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── App Preview ── */}
      <Reveal>
        <section style={{ maxWidth: 1000, margin: "0 auto 60px", padding: "0 32px" }}>
          <div style={{ background: "#f7f8fa", border: "1px solid #e5e7ed", borderRadius: 16, padding: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
            {/* Mock top bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f" }} />
              </div>
              <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "6px 12px", fontSize: "0.75rem", color: "#8c91a5", border: "1px solid #e5e7ed" }}>
                moonlight-ideas.vercel.app/analyze
              </div>
            </div>
            {/* Mock tab bar */}
            <div style={{ display: "flex", gap: 2, marginBottom: 12, background: "#f0f1f5", borderRadius: 6, padding: 3, width: "fit-content" }}>
              {["Stocks", "Commodities", "Crypto"].map((t, i) => (
                <div key={t} style={{ padding: "5px 16px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 600, background: i === 0 ? "#fff" : "transparent", color: i === 0 ? "#2962ff" : "#8c91a5", boxShadow: i === 0 ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>{t}</div>
              ))}
            </div>
            {/* Mock dashboard */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Current", value: "₹2,850", color: "#1a1d29" },
                { label: "Fair Value", value: "₹3,220", color: "#2962ff" },
                { label: "12M Target", value: "₹3,650", color: "#00c853" },
                { label: "Upside", value: "+28.1%", color: "#00c853" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid #e5e7ed", textAlign: "center" }}>
                  <div style={{ fontSize: "0.68rem", color: "#8c91a5", fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              {[
                { label: "Geopolitical", score: "7/10", color: "#00c853" },
                { label: "Supply Chain", score: "8/10", color: "#00c853" },
                { label: "Commodity Risk", score: "5/10", color: "#ff9800" },
                { label: "Management", score: "9/10", color: "#00c853" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 8, padding: 14, border: "1px solid #e5e7ed" }}>
                  <div style={{ fontSize: "0.68rem", color: "#8c91a5", fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.score}</div>
                  <div style={{ height: 4, background: "#f0f1f5", borderRadius: 2, marginTop: 8 }}>
                    <div style={{ height: "100%", width: `${parseInt(s.score) * 10}%`, background: s.color, borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── What Makes Us Different ── */}
      <section id="features" style={{ padding: "60px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 12 }}>What Zerodha & Groww Don&apos;t Show You</h2>
            <p style={{ color: "#4a5068", fontSize: "1rem", maxWidth: 550, margin: "0 auto" }}>
              Most platforms stop at P/E and charts. We analyze what actually moves markets — across stocks, commodities, and crypto.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { icon: <Globe size={22} />, title: "Geopolitical Intelligence", desc: "US-India trade, China+1, OPEC dynamics, sanctions risk — scored across all asset classes." },
            { icon: <Layers size={22} />, title: "Supply-Demand Analytics", desc: "Koyfin-powered commodity analytics, on-chain crypto data, and supply chain mapping for stocks." },
            { icon: <BarChart3 size={22} />, title: "MCX & Oil Markets", desc: "Crude oil, Brent, NYMEX, gold, metals — complete MCX coverage with international benchmarks." },
            { icon: <Search size={22} />, title: "CoinDCX Crypto Insights", desc: "40+ tokens with tokenomics, on-chain analytics, whale movements, and INR trading strategies." },
            { icon: <Shield size={22} />, title: "Risk Scoring Engine", desc: "8+ proprietary risk scores per asset — geopolitical, commodity, regulatory, volatility, and more." },
            { icon: <Target size={22} />, title: "India-First Analysis", desc: "MCX pricing, Indian tax strategy, RBI/SEBI impact, PLI schemes — built for Indian investors." },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={{ padding: 24, border: "1px solid #e5e7ed", borderRadius: 12, transition: "box-shadow 0.2s", background: "#fff" }}>
                <div style={{ width: 44, height: 44, background: "#e8eeff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#2962ff", marginBottom: 14 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: "#4a5068", fontSize: "0.85rem", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Comparison ── */}
      <Reveal>
        <section style={{ padding: "60px 32px", background: "#f7f8fa" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, textAlign: "center", marginBottom: 32 }}>MoonLight vs Others</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7ed" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#8c91a5", fontWeight: 600 }}>Feature</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#2962ff", fontWeight: 700 }}>MoonLight</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#8c91a5", fontWeight: 600 }}>Zerodha</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#8c91a5", fontWeight: 600 }}>Groww</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["AI Research Report", true, false, false],
                  ["Stocks + Commodities + Crypto", true, false, false],
                  ["MCX Oil & Metal Analysis", true, false, false],
                  ["Koyfin Commodity Insights", true, false, false],
                  ["CoinDCX Crypto Analytics", true, false, false],
                  ["Geopolitical Risk Scoring", true, false, false],
                  ["Supply Chain Mapping", true, false, false],
                  ["Basic Financials", true, true, true],
                ].map(([feature, ml, z, g], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f1f5" }}>
                    <td style={{ padding: "10px 16px", color: "#1a1d29", fontWeight: 500 }}>{feature as string}</td>
                    <td style={{ textAlign: "center", padding: "10px 16px" }}>{ml ? <CheckCircle size={16} color="#00c853" /> : <span style={{ color: "#ccc" }}>—</span>}</td>
                    <td style={{ textAlign: "center", padding: "10px 16px" }}>{z ? <CheckCircle size={16} color="#00c853" /> : <span style={{ color: "#ccc" }}>—</span>}</td>
                    <td style={{ textAlign: "center", padding: "10px 16px" }}>{g ? <CheckCircle size={16} color="#00c853" /> : <span style={{ color: "#ccc" }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Reveal>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "60px 32px", maxWidth: 950, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>Simple Pricing</h2>
            <p style={{ color: "#4a5068" }}>Start free. Upgrade when you need more.</p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { name: "Free", price: "₹0", period: "forever", analyses: 5, color: "#00c853", features: ["DCF fair value", "Geopolitical risk", "Entry zone + stop loss"], cta: "Start Free", primary: false },
            { name: "Starter", price: "₹199", period: "/month", analyses: 20, color: "#0097a7", features: ["Everything in Free", "Risk dashboards", "Priority support"], cta: "Get Starter", primary: false },
            { name: "Pro", price: "₹499", period: "/month", analyses: 100, color: "#2962ff", features: ["Commodity heatmaps", "Supply chain maps", "Ownership analysis", "Everything below"], cta: "Get Pro", primary: true },
            { name: "Elite", price: "₹999", period: "/month", analyses: 300, color: "#e65100", features: ["PDF report upload", "Portfolio watchlist", "Dedicated support", "Everything below"], cta: "Get Elite", primary: false },
          ].map((plan, i) => (
            <Reveal key={i} delay={i * 60}>
              <div style={{
                border: plan.primary ? "2px solid #2962ff" : "1px solid #e5e7ed",
                borderRadius: 12,
                padding: 24,
                position: "relative",
                background: "#fff",
                boxShadow: plan.primary ? "0 4px 24px rgba(41,98,255,0.1)" : "none",
              }}>
                {plan.primary && (
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#2962ff", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "3px 12px", borderRadius: 4, textTransform: "uppercase" }}>Most Popular</div>
                )}
                <div style={{ fontSize: "0.72rem", color: plan.color, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>{plan.name}</div>
                <div style={{ fontSize: "2rem", fontWeight: 900, marginBottom: 2 }}>{plan.price}</div>
                <div style={{ fontSize: "0.8rem", color: "#8c91a5", marginBottom: 16 }}>{plan.period}</div>
                <div style={{ background: `${plan.color}12`, borderRadius: 6, padding: "6px 0", textAlign: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 900, color: plan.color }}>{plan.analyses}</span>
                  <span style={{ fontSize: "0.78rem", color: "#8c91a5", marginLeft: 4 }}>analyses/mo</span>
                </div>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#4a5068", marginBottom: 6 }}>
                    <CheckCircle size={13} color={plan.color} /> {f}
                  </div>
                ))}
                <Link href="/analyze">
                  <button style={{
                    width: "100%", marginTop: 16, padding: "10px 0", borderRadius: 6, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
                    background: plan.primary ? "#2962ff" : "transparent",
                    color: plan.primary ? "#fff" : "#1a1d29",
                    border: plan.primary ? "none" : "1px solid #e5e7ed",
                  }}>{plan.cta}</button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <Reveal>
        <section style={{ padding: "60px 32px", background: "#f7f8fa" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, textAlign: "center", marginBottom: 32 }}>What Investors Say</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { name: "Rohit S.", text: "The commodity tab with Koyfin insights is a game-changer. I tracked aluminium trends before MCX moved.", rating: 5 },
                { name: "Priya K.", text: "Stocks, crypto, and commodities in one place. The CoinDCX integration makes crypto analysis effortless.", rating: 5 },
                { name: "Arjun M.", text: "The oil market analysis with Brent-WTI spread and OPEC data is better than any paid research.", rating: 5 },
              ].map((t, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e5e7ed", borderRadius: 10, padding: 20 }}>
                  <div style={{ display: "flex", gap: 2, marginBottom: 10 }}>
                    {Array(t.rating).fill(0).map((_, j) => <Star key={j} size={14} fill="#ff9800" color="#ff9800" />)}
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "#4a5068", lineHeight: 1.6, marginBottom: 12 }}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#1a1d29" }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 32px", textAlign: "center" }}>
        <Reveal>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 12 }}>Ready to invest smarter?</h2>
          <p style={{ color: "#4a5068", fontSize: "1rem", marginBottom: 24 }}>Stocks, commodities, and crypto — all analyzed with geopolitical intelligence, Koyfin data, and CoinDCX insights.</p>
          <Link href="/analyze">
            <button style={{ background: "#2962ff", color: "#fff", border: "none", borderRadius: 8, padding: "14px 36px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(41,98,255,0.25)" }}>
              Start Free Analysis <ArrowRight size={18} />
            </button>
          </Link>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #e5e7ed", padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, background: "#2962ff", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={13} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>MoonLight</span>
        </div>
        <div style={{ fontSize: "0.78rem", color: "#8c91a5" }}>
          Not SEBI-registered. For informational purposes only.
        </div>
      </footer>
    </div>
  );
}
