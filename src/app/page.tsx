"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Globe, CheckCircle, Star, TrendingUp, ArrowDown } from "lucide-react";

/* ─── Starfield Canvas ─────────────────────────────────────────── */
function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.15 + 0.03,
      opacity: Math.random() * 0.7 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() / 1000;
      stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
        const alpha = s.opacity * (0.7 + 0.3 * Math.sin(t + s.pulse));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,180,255,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.6 }}
    />
  );
}

/* ─── App Mockup (mini rendered UI) ──────────────────────────── */
function AppMockup() {
  return (
    <div style={{
      width: 480, maxWidth: "90vw",
      background: "rgba(12,12,24,0.95)",
      border: "1px solid rgba(99,102,241,0.5)",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 0 80px rgba(99,102,241,0.25), 0 40px 120px rgba(0,0,0,0.8)",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Titlebar */}
      <div style={{ background: "rgba(99,102,241,0.12)", padding: "12px 18px", borderBottom: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>moonlight-ideas.vercel.app/analyze</div>
      </div>

      {/* Nav strip */}
      <div style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 20, background: "#6366f1", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={11} color="white" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f0f0ff" }}>MoonLight</span>
        </div>
        <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 600 }}>3 free analyses left</div>
      </div>

      {/* Search row */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f0f0ff", border: "1px solid rgba(99,102,241,0.3)" }}>
          RELIANCE.NS
        </div>
        <div style={{ background: "#6366f1", borderRadius: 8, padding: "8px 14px", fontSize: 11, color: "white", fontWeight: 600 }}>Analyze</div>
      </div>

      {/* Result card */}
      <div style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>AI RESEARCH REPORT</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f0ff" }}>Reliance Industries</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>RELIANCE.NS · NSE</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#10b981" }}>BUY</div>
            <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 999, padding: "3px 10px", fontSize: 10, color: "#6366f1", fontWeight: 600 }}>₹3,240 fair value</div>
          </div>
        </div>

        {/* DCF mini */}
        <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: "10px 12px", marginBottom: 10, border: "1px solid rgba(99,102,241,0.15)" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontWeight: 600 }}>DCF VALUATION</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {[["Fair Value", "₹3,240"], ["Upside", "+14%"], ["WACC", "11.2%"]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: k === "Upside" ? "#10b981" : "#f0f0ff" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Geopolitical section */}
        <div style={{ background: "rgba(245,158,11,0.06)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>🌍 GEOPOLITICAL RISK</div>
            <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: 9, color: "#10b981", fontWeight: 700 }}>LOW</div>
          </div>
          {[
            { label: "US-India Trade", value: 85, color: "#10b981" },
            { label: "China Exposure", value: 22, color: "#ef4444" },
            { label: "PLI Benefit", value: 90, color: "#6366f1" },
          ].map((bar) => (
            <div key={bar.label} style={{ marginBottom: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{bar.label}</span>
                <span style={{ fontSize: 9, color: bar.color }}>{bar.value}%</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 999 }}>
                <div style={{ height: "100%", width: `${bar.value}%`, background: bar.color, borderRadius: 999, opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Scroll-driven 3D Section ───────────────────────────────── */
function ScrollMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0 → 1

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      setProgress(Math.min(1, Math.max(0, scrolled / total)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Interpolate transforms
  const rotX = 28 - 28 * progress;          // 28° → 0°
  const rotY = -18 + 18 * progress;          // -18° → 0°
  const scale = 0.78 + 0.22 * progress;      // 0.78 → 1.0
  const translateY = 40 - 40 * progress;     // 40px → 0px
  const shadowOpacity = 0.3 - 0.15 * progress;

  // Text phases
  const phase1 = Math.min(1, progress * 3);           // 0→0.33 scroll
  const phase2 = Math.min(1, Math.max(0, (progress - 0.4) * 3)); // 0.4→0.73
  const phase3 = Math.min(1, Math.max(0, (progress - 0.7) * 3)); // 0.7→1.0

  return (
    <div ref={containerRef} style={{ height: "320vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          transform: `scale(${0.8 + 0.4 * progress})`,
          transition: "transform 0.1s",
          pointerEvents: "none",
        }} />

        {/* Floating label — phase 1 */}
        <div style={{
          position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)",
          textAlign: "center",
          opacity: phase1 * (1 - phase2),
          transition: "opacity 0.3s",
        }}>
          <div style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.9rem)", color: "#6366f1", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>
            SCROLL TO EXPLORE
          </div>
          <div style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", fontWeight: 800, color: "#f0f0ff", lineHeight: 1.3 }}>
            Your complete research<br />report. Instantly.
          </div>
        </div>

        {/* Floating label — phase 2 */}
        <div style={{
          position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)",
          textAlign: "center",
          opacity: phase2 * (1 - phase3),
          transition: "opacity 0.3s",
          whiteSpace: "nowrap",
        }}>
          <div style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.9rem)", color: "#f59e0b", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>
            WHAT ZERODHA NEVER SHOWS
          </div>
          <div style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", fontWeight: 800, color: "#f0f0ff", lineHeight: 1.3 }}>
            Geopolitical risk.<br />Mapped to every stock.
          </div>
        </div>

        {/* Floating label — phase 3 */}
        <div style={{
          position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)",
          textAlign: "center",
          opacity: phase3,
          transition: "opacity 0.3s",
          whiteSpace: "nowrap",
        }}>
          <div style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.9rem)", color: "#10b981", fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>
            INSTITUTIONAL GRADE
          </div>
          <div style={{ fontSize: "clamp(1.2rem, 3vw, 1.8rem)", fontWeight: 800, color: "#f0f0ff", lineHeight: 1.3 }}>
            DCF valuation in 60 seconds.<br />Goldman Sachs methodology.
          </div>
        </div>

        {/* The 3D Mockup */}
        <div style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}>
          <div style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale}) translateY(${translateY}px)`,
            transition: "transform 0.05s linear",
            filter: `drop-shadow(0 ${30 * (1 - progress)}px ${60 * (1 - progress) + 20}px rgba(99,102,241,${shadowOpacity}))`,
          }}>
            <AppMockup />
          </div>
        </div>

        {/* Bottom CTA appears at end */}
        <div style={{
          position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)",
          opacity: phase3,
          transition: "opacity 0.4s",
          textAlign: "center",
        }}>
          <Link href="/analyze">
            <button style={{
              background: "#6366f1", color: "white", border: "none", borderRadius: 10,
              padding: "13px 32px", fontWeight: 700, fontSize: "1rem", cursor: "pointer",
              boxShadow: "0 0 30px rgba(99,102,241,0.5)",
            }}>
              Try it free →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Section reveal on scroll ───────────────────────────────── */
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ─── Comparison Table ───────────────────────────────────────── */
const vsRows = [
  ["DCF Fair Value Estimate", true, false, false],
  ["Geopolitical Risk Analysis", true, false, false],
  ["US Tariff / China+1 Impact", true, false, false],
  ["PLI Scheme Beneficiary Check", true, false, false],
  ["Entry Zone + Stop Loss", true, false, false],
  ["Fed Rate Sensitivity", true, false, false],
  ["Investment Thesis", true, false, false],
  ["Buy/Sell Signal", true, true, true],
  ["Price Charts", false, true, true],
] as const;

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Page() {
  return (
    <div style={{ background: "#07070f", color: "#f0f0ff", minHeight: "100vh", overflowX: "hidden" }}>
      <Starfield />

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(7,7,15,0.7)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99,102,241,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "#6366f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>MoonLight</span>
          <span style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: "0.7rem", color: "#6366f1", fontWeight: 700 }}>BETA</span>
        </div>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a href="#compare" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.875rem" }}>vs Zerodha</a>
          <a href="#pricing" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.875rem" }}>Pricing</a>
          <Link href="/analyze">
            <button style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "8px 20px", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
              Try Free →
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "6rem 2rem 4rem" }}>
        <RevealSection>
          <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 999, padding: "5px 16px", fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", marginBottom: "1.5rem", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Globe size={12} /> GEOPOLITICS-AWARE · FIRST IN INDIA
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", fontWeight: 900, lineHeight: 1.08, margin: "0 0 1.5rem", letterSpacing: "-0.02em" }}>
            Zerodha shows<br />
            you charts.<br />
            <span style={{ color: "#6366f1", WebkitTextStroke: "0px" }}>MoonLight tells</span><br />
            <span style={{ color: "#6366f1" }}>you why.</span>
          </h1>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.5)", maxWidth: 560, margin: "0 auto 2.5rem", lineHeight: 1.8 }}>
            The only stock research tool in India that layers <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>geopolitical risk</span>, US tariffs, China+1 impact &amp; PLI tailwinds onto institutional-grade DCF valuations.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/analyze">
              <button style={{
                background: "#6366f1", border: "none", borderRadius: 10, padding: "14px 32px",
                color: "white", fontWeight: 700, cursor: "pointer", fontSize: "1.05rem",
                boxShadow: "0 0 40px rgba(99,102,241,0.4)",
              }}>
                Analyze a Stock Free →
              </button>
            </Link>
          </div>
          <div style={{ marginTop: "1rem", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
            3 free analyses · No credit card
          </div>
        </RevealSection>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: "0.7rem", animation: "bounce 2s infinite" }}>
          <span>scroll</span>
          <ArrowDown size={14} />
        </div>
      </section>

      {/* ── SCROLL 3D SECTION ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ScrollMockup />
      </div>

      {/* ── WHAT OTHERS MISS ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "6rem 2rem" }}>
        <RevealSection>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 800, marginBottom: "0.75rem" }}>
            Questions your broker never answers
          </h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: "3rem", fontSize: "0.95rem" }}>
            MoonLight answers all of these. In every analysis.
          </p>
        </RevealSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          {[
            { q: "Is your IT stock at risk from US tariffs on Indian services?", color: "#ef4444", delay: 0 },
            { q: "Which pharma stocks benefit from US-China decoupling?", color: "#f59e0b", delay: 0.1 },
            { q: "How does a Fed rate hike affect FII selling in your holdings?", color: "#6366f1", delay: 0.2 },
            { q: "Which companies are PLI scheme winners in the next 2 years?", color: "#10b981", delay: 0.3 },
          ].map((item) => (
            <RevealSection key={item.q} delay={item.delay}>
              <div style={{
                background: "rgba(255,255,255,0.02)", border: `1px solid ${item.color}30`,
                borderRadius: 14, padding: "1.5rem", height: "100%",
                backdropFilter: "blur(10px)",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, marginBottom: "1rem", boxShadow: `0 0 10px ${item.color}` }} />
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.65, margin: "0 0 1rem" }}>{item.q}</p>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: item.color }}>MoonLight answers this ↗</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section id="compare" style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "2rem 2rem 6rem" }}>
        <RevealSection>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 800, marginBottom: "0.75rem" }}>MoonLight vs the rest</h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: "2.5rem", fontSize: "0.95rem" }}>
            Other apps give you data. We give you insight.
          </p>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(10px)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ padding: "1rem 1.25rem", textAlign: "left", color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", fontWeight: 600 }}>FEATURE</th>
                  <th style={{ padding: "1rem", textAlign: "center", color: "#6366f1", fontSize: "0.85rem", fontWeight: 700 }}>MoonLight</th>
                  <th style={{ padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>Zerodha</th>
                  <th style={{ padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>Groww</th>
                </tr>
              </thead>
              <tbody>
                {vsRows.map(([feat, ml, z, g], i) => (
                  <tr key={String(feat)} style={{ borderBottom: i < vsRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                    <td style={{ padding: "0.8rem 1.25rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>{feat}</td>
                    <td style={{ textAlign: "center" }}>{ml ? <span style={{ color: "#10b981", fontWeight: 700, fontSize: "1rem" }}>✓</span> : <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>{z ? <span style={{ color: "rgba(255,255,255,0.4)" }}>✓</span> : <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>{g ? <span style={{ color: "rgba(255,255,255,0.4)" }}>✓</span> : <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RevealSection>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "0 2rem 6rem" }}>
        <RevealSection>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 800, marginBottom: "2.5rem" }}>What investors are saying</h2>
        </RevealSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {[
            { name: "Vikram S.", role: "Retail Investor, Mumbai", text: "I finally understood how US Fed decisions were killing my IT stocks. MoonLight flagged it before I lost more money.", delay: 0 },
            { name: "Priya M.", role: "NISM Certified Advisor", text: "The China+1 analysis on manufacturing stocks is something no other free tool gives. My clients ask me how I know this stuff.", delay: 0.1 },
            { name: "Rohan K.", role: "MBA Student, Bangalore", text: "Used MoonLight to analyze Adani Ports for a case study. The geopolitical section alone was worth 10 pages of research.", delay: 0.2 },
          ].map((t) => (
            <RevealSection key={t.name} delay={t.delay}>
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.5rem", backdropFilter: "blur(10px)" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: "0.75rem" }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", lineHeight: 1.65, margin: "0 0 1rem" }}>"{t.text}"</p>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{t.name}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>{t.role}</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", padding: "0 2rem 8rem" }}>
        <RevealSection>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 800, marginBottom: "0.75rem" }}>Simple pricing</h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: "2.5rem", fontSize: "0.95rem" }}>
            Less than a cup of coffee a week.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Free */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "2rem", backdropFilter: "blur(10px)" }}>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem", fontWeight: 700, letterSpacing: "0.1em" }}>FREE</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: "1.5rem" }}>₹0<span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/mo</span></div>
              {["3 full analyses/month", "DCF fair value", "Geopolitical risk section", "Entry zone + stop loss"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.7rem" }}>
                  <CheckCircle size={14} color="#10b981" />
                  <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}>{f}</span>
                </div>
              ))}
              <Link href="/analyze">
                <button style={{ width: "100%", marginTop: "1.5rem", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, padding: "12px", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                  Start Free
                </button>
              </Link>
            </div>
            {/* Pro */}
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.5)", borderRadius: 16, padding: "2rem", backdropFilter: "blur(10px)", position: "relative" }}>
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#6366f1", borderRadius: 999, padding: "3px 14px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}>
                MOST POPULAR
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6366f1", marginBottom: "0.5rem", fontWeight: 700, letterSpacing: "0.1em" }}>PRO</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: "1.5rem" }}>₹299<span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/mo</span></div>
              {["Unlimited analyses", "Everything in Free", "PDF annual report upload", "Portfolio watchlist + alerts", "Sector macro dashboard"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.7rem" }}>
                  <CheckCircle size={14} color="#6366f1" />
                  <span style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)" }}>{f}</span>
                </div>
              ))}
              <Link href="/analyze">
                <button style={{ width: "100%", marginTop: "1.5rem", background: "#6366f1", border: "none", borderRadius: 9, padding: "12px", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}>
                  Go Pro — ₹299/mo →
                </button>
              </Link>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "5rem 2rem 6rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <RevealSection>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ width: 60, height: 60, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <Globe size={28} color="#6366f1" />
            </div>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: "1rem", lineHeight: 1.2 }}>
              Stop investing blind<br />to global events.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "2.5rem", lineHeight: 1.7 }}>
              Every day without geopolitical context, you're leaving money on the table. 3 free analyses. No card needed.
            </p>
            <Link href="/analyze">
              <button style={{
                background: "#6366f1", border: "none", borderRadius: 12, padding: "16px 40px",
                color: "white", fontWeight: 700, fontSize: "1.1rem", cursor: "pointer",
                boxShadow: "0 0 50px rgba(99,102,241,0.4)",
              }}>
                Analyze Your First Stock →
              </button>
            </Link>
          </div>
        </RevealSection>
      </section>

      <footer style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
        © 2025 MoonLight · AI Stock Research · Not SEBI registered. For informational purposes only.
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}
