"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Globe, CheckCircle, Star, TrendingUp, ArrowDown } from "lucide-react";

/* ── Live Stock Chart Canvas ─────────────────────────────────── */
function LiveChartCanvas() {
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

    // Generate a random-walk price series
    const makeSeries = (len: number, start: number, vol: number) => {
      const pts = [start];
      for (let i = 1; i < len; i++) {
        pts.push(Math.max(20, pts[i - 1] + (Math.random() - 0.47) * vol));
      }
      return pts;
    };

    const LINES = [
      { color: "#00ff88", glow: "#00ff88", series: makeSeries(120, 60, 4), yBase: 0.25, amp: 0.12, speed: 0.4 },
      { color: "#6366f1", glow: "#818cf8", series: makeSeries(120, 80, 6), yBase: 0.45, amp: 0.18, speed: 0.55 },
      { color: "#22d3ee", glow: "#22d3ee", series: makeSeries(120, 50, 3), yBase: 0.65, amp: 0.10, speed: 0.35 },
      { color: "#f59e0b", glow: "#f59e0b", series: makeSeries(120, 70, 5), yBase: 0.35, amp: 0.14, speed: 0.45 },
      { color: "#ef4444", glow: "#ef4444", series: makeSeries(120, 90, 7), yBase: 0.75, amp: 0.08, speed: 0.3 },
    ];

    let offset = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // subtle grid
      ctx.strokeStyle = "rgba(99,102,241,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      LINES.forEach((line) => {
        const pts = line.series;
        const len = pts.length;
        const minVal = Math.min(...pts);
        const maxVal = Math.max(...pts);
        const range = maxVal - minVal || 1;

        const baseY = H * line.yBase;
        const amplitude = H * line.amp;

        // push new point, shift series
        pts.push(Math.max(20, pts[pts.length - 1] + (Math.random() - 0.47) * 4));
        if (pts.length > 160) pts.shift();

        const segW = W / (len - 1);
        const shiftX = (offset * line.speed) % segW;

        // glow pass
        ctx.shadowColor = line.glow;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();

        for (let i = 0; i < len; i++) {
          const x = i * segW - shiftX;
          const norm = (pts[i] - minVal) / range;
          const y = baseY + amplitude * (1 - norm * 2);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        // bright top line
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        for (let i = 0; i < len; i++) {
          const x = i * segW - shiftX;
          const norm = (pts[i] - minVal) / range;
          const y = baseY + amplitude * (1 - norm * 2);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      offset += 0.8;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.35,
    }} />
  );
}

/* ── Floating Ticker Badges ──────────────────────────────────── */
const TICKERS = [
  { sym: "RELIANCE", price: "₹2,847", chg: "+1.4%", bull: true },
  { sym: "TCS", price: "₹3,612", chg: "+0.8%", bull: true },
  { sym: "HDFCBANK", price: "₹1,723", chg: "-0.3%", bull: false },
  { sym: "INFY", price: "₹1,489", chg: "+2.1%", bull: true },
  { sym: "ADANIENT", price: "₹2,940", chg: "+3.2%", bull: true },
  { sym: "WIPRO", price: "₹487", chg: "-1.1%", bull: false },
  { sym: "ITC", price: "₹448", chg: "+0.5%", bull: true },
  { sym: "TATAMOTORS", price: "₹896", chg: "+1.9%", bull: true },
  { sym: "SBIN", price: "₹762", chg: "-0.7%", bull: false },
  { sym: "BAJFINANCE", price: "₹7,240", chg: "+1.2%", bull: true },
];

function FloatingTickers() {
  const [items, setItems] = useState<{ id: number; ticker: typeof TICKERS[0]; left: number; duration: number; delay: number }[]>([]);
  const counter = useRef(0);

  const spawn = useCallback(() => {
    const t = TICKERS[Math.floor(Math.random() * TICKERS.length)];
    setItems((prev) => [
      ...prev.slice(-12),
      { id: counter.current++, ticker: t, left: 5 + Math.random() * 88, duration: 8 + Math.random() * 6, delay: 0 },
    ]);
  }, []);

  useEffect(() => {
    spawn();
    const iv = setInterval(spawn, 1800);
    return () => clearInterval(iv);
  }, [spawn]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            position: "absolute",
            left: `${item.left}%`,
            bottom: "-60px",
            animation: `floatUp ${item.duration}s ease-in forwards`,
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(10,10,20,0.75)",
            border: `1px solid ${item.ticker.bull ? "rgba(0,255,136,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: 8,
            padding: "5px 10px",
            backdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
            fontSize: 11,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{item.ticker.sym}</span>
          <span style={{ color: "#f0f0ff", fontWeight: 700 }}>{item.ticker.price}</span>
          <span style={{ color: item.ticker.bull ? "#00ff88" : "#ef4444", fontWeight: 700 }}>{item.ticker.chg}</span>
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0); }
          8%   { opacity: 1; }
          85%  { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-105vh); }
        }
      `}</style>
    </div>
  );
}

/* ── App Mockup ──────────────────────────────────────────────── */
function AppMockup() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(iv);
  }, []);

  const prices = ["₹3,240", "₹3,248", "₹3,231", "₹3,256", "₹3,243"];
  const currentPrice = prices[tick % prices.length];

  return (
    <div style={{
      width: 460, maxWidth: "88vw",
      background: "rgba(8,8,18,0.96)",
      border: "1px solid rgba(99,102,241,0.45)",
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 0 100px rgba(99,102,241,0.2), 0 60px 140px rgba(0,0,0,0.9)",
      fontSize: 13,
    }}>
      {/* Titlebar */}
      <div style={{ background: "rgba(99,102,241,0.1)", padding: "10px 16px", borderBottom: "1px solid rgba(99,102,241,0.18)", display: "flex", alignItems: "center", gap: 6 }}>
        {["#ff5f57","#febc2e","#28c840"].map((c) => (
          <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          moonlight-ideas.vercel.app/analyze
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9, color: "#00ff88", fontWeight: 700 }}>LIVE</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 18, height: 18, background: "#6366f1", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={10} color="white" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#f0f0ff" }}>MoonLight</span>
        </div>
        <span style={{ fontSize: 9, color: "#6366f1", fontWeight: 600 }}>3 free analyses left</span>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 6 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 7, padding: "7px 10px", fontSize: 11, color: "#f0f0ff", border: "1px solid rgba(99,102,241,0.35)" }}>
          RELIANCE.NS
        </div>
        <div style={{ background: "#6366f1", borderRadius: 7, padding: "7px 14px", fontSize: 10, color: "white", fontWeight: 700, display: "flex", alignItems: "center" }}>
          Analyze
        </div>
      </div>

      {/* Result */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>AI RESEARCH REPORT</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f0f0ff" }}>Reliance Industries</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>RELIANCE.NS · NSE</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{ background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.35)", borderRadius: 999, padding: "2px 9px", fontSize: 9, fontWeight: 800, color: "#00ff88" }}>
              STRONG BUY
            </div>
            <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 999, padding: "2px 9px", fontSize: 9, color: "#818cf8", fontWeight: 600, transition: "all 0.5s" }}>
              Fair Value {currentPrice}
            </div>
          </div>
        </div>

        {/* DCF */}
        <div style={{ background: "rgba(99,102,241,0.07)", borderRadius: 9, padding: "9px 11px", marginBottom: 8, border: "1px solid rgba(99,102,241,0.15)" }}>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", marginBottom: 5, fontWeight: 700, letterSpacing: "0.08em" }}>DCF VALUATION</div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {[["Fair Value", currentPrice, "#f0f0ff"], ["Upside", "+14.2%", "#00ff88"], ["WACC", "11.2%", "#818cf8"]].map(([k, v, c]) => (
              <div key={k}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: c, transition: "all 0.5s" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Geo risk */}
        <div style={{ background: "rgba(245,158,11,0.05)", borderRadius: 9, padding: "9px 11px", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em" }}>🌍 GEOPOLITICAL RISK</div>
            <div style={{ background: "rgba(0,255,136,0.12)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: 999, padding: "2px 7px", fontSize: 8, color: "#00ff88", fontWeight: 700 }}>LOW</div>
          </div>
          {[{ l: "US-India Trade", v: 85, c: "#00ff88" }, { l: "China Exposure", v: 22, c: "#ef4444" }, { l: "PLI Benefit", v: 91, c: "#6366f1" }].map((b) => (
            <div key={b.l} style={{ marginBottom: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>{b.l}</span>
                <span style={{ fontSize: 8, color: b.c, fontWeight: 700 }}>{b.v}%</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 999 }}>
                <div style={{ height: "100%", width: `${b.v}%`, background: b.c, borderRadius: 999, boxShadow: `0 0 6px ${b.c}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

/* ── Scroll-driven 3D Reveal ─────────────────────────────────── */
function ScrollReveal3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const scrolled = -el.getBoundingClientRect().top;
      const total = el.offsetHeight - window.innerHeight;
      setProgress(Math.min(1, Math.max(0, scrolled / total)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const rotX = 26 * (1 - progress);
  const rotY = -16 * (1 - progress);
  const scale = 0.76 + 0.24 * progress;
  const phase1 = Math.min(1, progress * 3);
  const phase2 = Math.min(1, Math.max(0, (progress - 0.38) * 3));
  const phase3 = Math.min(1, Math.max(0, (progress - 0.7) * 3));

  const labels = [
    { opacity: phase1 * (1 - phase2), tag: "SCROLL TO EXPLORE", tagColor: "#6366f1", title: "Your complete research\nreport. Instantly." },
    { opacity: phase2 * (1 - phase3), tag: "WHAT ZERODHA NEVER SHOWS", tagColor: "#f59e0b", title: "Geopolitical risk.\nMapped to every stock." },
    { opacity: phase3, tag: "INSTITUTIONAL GRADE", tagColor: "#00ff88", title: "Goldman Sachs methodology.\n60 seconds." },
  ];

  return (
    <div ref={containerRef} style={{ height: "300vh", position: "relative", zIndex: 1 }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* Radial glow */}
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(99,102,241,${0.08 + 0.06 * progress}) 0%, transparent 70%)`,
          transform: `scale(${0.7 + 0.6 * progress})`, pointerEvents: "none",
        }} />

        {/* Phase labels */}
        {labels.map((lb, i) => (
          <div key={i} style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", textAlign: "center", opacity: lb.opacity, transition: "opacity 0.25s", pointerEvents: "none", width: "90vw" }}>
            <div style={{ fontSize: "0.72rem", color: lb.tagColor, fontWeight: 800, letterSpacing: "0.15em", marginBottom: 10 }}>{lb.tag}</div>
            <div style={{ fontSize: "clamp(1.3rem, 3.5vw, 2rem)", fontWeight: 800, color: "#f0f0ff", lineHeight: 1.3, whiteSpace: "pre-line" }}>{lb.title}</div>
          </div>
        ))}

        {/* 3D Mockup */}
        <div style={{ perspective: "1400px" }}>
          <div style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
            transition: "transform 0.04s linear",
            filter: `drop-shadow(0 ${30*(1-progress)}px ${50*(1-progress)+20}px rgba(99,102,241,${0.28-0.12*progress}))`,
          }}>
            <AppMockup />
          </div>
        </div>

        {/* CTA at end */}
        <div style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", opacity: phase3, transition: "opacity 0.4s", textAlign: "center" }}>
          <Link href="/analyze">
            <button style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "13px 30px", color: "white", fontWeight: 700, fontSize: "1rem", cursor: "pointer", boxShadow: "0 0 30px rgba(99,102,241,0.5)" }}>
              Try it free →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Reveal on scroll ────────────────────────────────────────── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOn(true); }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: on ? 1 : 0, transform: on ? "translateY(0)" : "translateY(36px)", transition: `opacity 0.7s ${delay}s, transform 0.7s ${delay}s` }}>
      {children}
    </div>
  );
}

const VS_ROWS = [
  ["DCF Fair Value Estimate", true, false, false],
  ["Geopolitical Risk Analysis", true, false, false],
  ["US Tariff / China+1 Impact", true, false, false],
  ["PLI Scheme Beneficiary Check", true, false, false],
  ["Entry Zone + Stop Loss", true, false, false],
  ["Fed Rate Sensitivity", true, false, false],
  ["Investment Thesis", true, false, false],
  ["Buy / Sell Signal", true, true, true],
  ["Price Charts", false, true, true],
] as [string, boolean, boolean, boolean][];

/* ── PAGE ────────────────────────────────────────────────────── */
export default function Page() {
  return (
    <div style={{ background: "#06060f", color: "#f0f0ff", minHeight: "100vh", overflowX: "hidden" }}>
      <LiveChartCanvas />
      <FloatingTickers />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0.9rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(6,6,15,0.75)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "#6366f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={15} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.05rem" }}>MoonLight</span>
          <span style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 999, padding: "2px 8px", fontSize: "0.68rem", color: "#818cf8", fontWeight: 700 }}>BETA</span>
        </div>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a href="#compare" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: "0.875rem" }}>vs Zerodha</a>
          <a href="#pricing" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: "0.875rem" }}>Pricing</a>
          <Link href="/analyze">
            <button style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "8px 20px", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem", boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}>
              Try Free →
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "7rem 2rem 5rem" }}>
        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(0,255,136,0.07)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: 999, padding: "6px 14px", fontSize: "0.72rem", fontWeight: 700, color: "#00ff88", letterSpacing: "0.08em", marginBottom: "1.75rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88", animation: "pulse 1.5s infinite" }} />
          LIVE MARKET DATA · GEOPOLITICS-AWARE · FIRST IN INDIA
        </div>

        <h1 style={{ fontSize: "clamp(2.6rem, 7.5vw, 5.2rem)", fontWeight: 900, lineHeight: 1.06, margin: "0 0 1.5rem", letterSpacing: "-0.03em" }}>
          Zerodha shows<br />you charts.<br />
          <span style={{ background: "linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            MoonLight tells
          </span><br />
          <span style={{ background: "linear-gradient(135deg,#6366f1,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            you why.
          </span>
        </h1>

        <p style={{ fontSize: "clamp(0.95rem, 2vw, 1.15rem)", color: "rgba(255,255,255,0.45)", maxWidth: 540, margin: "0 auto 2.5rem", lineHeight: 1.8 }}>
          The only stock research tool in India that layers{" "}
          <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>geopolitical risk</span>,
          US tariffs, China+1 impact &amp; PLI tailwinds onto institutional-grade DCF valuations.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/analyze">
            <button style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: 10, padding: "14px 32px", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "1rem", boxShadow: "0 0 40px rgba(99,102,241,0.45)", letterSpacing: "0.01em" }}>
              Analyze a Stock Free →
            </button>
          </Link>
          <a href="#compare">
            <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 24px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.95rem" }}>
              See vs Zerodha ↓
            </button>
          </a>
        </div>

        <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.22)", fontSize: "0.78rem" }}>
          3 free analyses · No credit card required
        </p>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: "0.68rem", animation: "bounce 2s infinite" }}>
          scroll<ArrowDown size={13} />
        </div>
      </section>

      {/* 3D SCROLL REVEAL */}
      <ScrollReveal3D />

      {/* WHAT OTHERS MISS */}
      <section style={{ position: "relative", zIndex: 2, maxWidth: 1000, margin: "0 auto", padding: "6rem 2rem" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 800, marginBottom: "0.6rem" }}>
            Questions your broker never answers
          </h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", marginBottom: "3rem", fontSize: "0.9rem" }}>
            MoonLight answers all of these. In every single analysis.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "1.25rem" }}>
          {[
            { q: "Is your IT stock at risk from US tariffs on Indian services?", c: "#ef4444", delay: 0 },
            { q: "Which pharma stocks benefit from US-China decoupling?", c: "#f59e0b", delay: 0.1 },
            { q: "How does a Fed rate hike affect FII selling in your holdings?", c: "#6366f1", delay: 0.2 },
            { q: "Which companies are PLI scheme winners in the next 2 years?", c: "#00ff88", delay: 0.3 },
          ].map((item) => (
            <Reveal key={item.q} delay={item.delay}>
              <div style={{ background: "rgba(255,255,255,0.018)", border: `1px solid ${item.c}28`, borderRadius: 14, padding: "1.5rem", height: "100%", backdropFilter: "blur(12px)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.c, marginBottom: "1rem", boxShadow: `0 0 12px ${item.c}` }} />
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", lineHeight: 1.65, margin: "0 0 1rem" }}>{item.q}</p>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: item.c }}>MoonLight answers this ↗</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section id="compare" style={{ position: "relative", zIndex: 2, maxWidth: 760, margin: "0 auto", padding: "0 2rem 6rem" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 800, marginBottom: "0.6rem" }}>MoonLight vs the rest</h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", marginBottom: "2.5rem", fontSize: "0.9rem" }}>Other apps give you data. We give you insight.</p>
          <div style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(12px)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <th style={{ padding: "1rem 1.25rem", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", fontWeight: 600 }}>FEATURE</th>
                  <th style={{ padding: "1rem", textAlign: "center", color: "#818cf8", fontSize: "0.85rem", fontWeight: 700 }}>MoonLight</th>
                  <th style={{ padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>Zerodha</th>
                  <th style={{ padding: "1rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>Groww</th>
                </tr>
              </thead>
              <tbody>
                {VS_ROWS.map(([feat, ml, z, g], i) => (
                  <tr key={String(feat)} style={{ borderBottom: i < VS_ROWS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                    <td style={{ padding: "0.8rem 1.25rem", fontSize: "0.84rem", color: "rgba(255,255,255,0.5)" }}>{feat}</td>
                    <td style={{ textAlign: "center" }}>{ml ? <span style={{ color: "#00ff88", fontWeight: 700 }}>✓</span> : <span style={{ color: "rgba(255,255,255,0.12)" }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>{z ? <span style={{ color: "rgba(255,255,255,0.4)" }}>✓</span> : <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>{g ? <span style={{ color: "rgba(255,255,255,0.4)" }}>✓</span> : <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ position: "relative", zIndex: 2, maxWidth: 1000, margin: "0 auto", padding: "0 2rem 6rem" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 800, marginBottom: "2.5rem" }}>What investors are saying</h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: "1.25rem" }}>
          {[
            { name: "Vikram S.", role: "Retail Investor, Mumbai", text: "I finally understood how US Fed decisions were killing my IT stocks. MoonLight flagged it before I lost more money.", delay: 0 },
            { name: "Priya M.", role: "NISM Certified Advisor", text: "The China+1 analysis on manufacturing stocks is something no other free tool gives. My clients ask me how I know this.", delay: 0.1 },
            { name: "Rohan K.", role: "MBA Student, Bangalore", text: "Used MoonLight to analyze Adani Ports for a case study. The geopolitical section alone was worth 10 pages of research.", delay: 0.2 },
          ].map((t) => (
            <Reveal key={t.name} delay={t.delay}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.5rem", backdropFilter: "blur(12px)" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: "0.75rem" }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.65, margin: "0 0 1rem" }}>"{t.text}"</p>
                <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{t.name}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>{t.role}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ position: "relative", zIndex: 2, maxWidth: 760, margin: "0 auto", padding: "0 2rem 8rem" }}>
        <Reveal>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 800, marginBottom: "0.6rem" }}>Simple pricing</h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", marginBottom: "2.5rem", fontSize: "0.9rem" }}>Less than a cup of coffee a week.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "2rem", backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem", fontWeight: 700, letterSpacing: "0.1em" }}>FREE</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: "1.5rem" }}>₹0<span style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/mo</span></div>
              {["3 full analyses/month", "DCF fair value", "Geopolitical risk section", "Entry zone + stop loss"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.7rem" }}>
                  <CheckCircle size={14} color="#00ff88" />
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.45)" }}>{f}</span>
                </div>
              ))}
              <Link href="/analyze">
                <button style={{ width: "100%", marginTop: "1.5rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "11px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                  Start Free
                </button>
              </Link>
            </div>
            <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.45)", borderRadius: 16, padding: "2rem", backdropFilter: "blur(12px)", position: "relative" }}>
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#6366f1", borderRadius: 999, padding: "3px 14px", fontSize: "0.7rem", fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 0 20px rgba(99,102,241,0.5)" }}>
                MOST POPULAR
              </div>
              <div style={{ fontSize: "0.72rem", color: "#818cf8", marginBottom: "0.5rem", fontWeight: 700, letterSpacing: "0.1em" }}>PRO</div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: "1.5rem" }}>₹299<span style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/mo</span></div>
              {["Unlimited analyses", "Everything in Free", "PDF annual report upload", "Portfolio watchlist + alerts", "Sector macro dashboard"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.7rem" }}>
                  <CheckCircle size={14} color="#6366f1" />
                  <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>{f}</span>
                </div>
              ))}
              <Link href="/analyze">
                <button style={{ width: "100%", marginTop: "1.5rem", background: "#6366f1", border: "none", borderRadius: 9, padding: "11px", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem", boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}>
                  Go Pro — ₹299/mo →
                </button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FINAL CTA */}
      <section style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "5rem 2rem 6rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <Reveal>
          <div style={{ width: 56, height: 56, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <Globe size={26} color="#818cf8" />
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 900, marginBottom: "1rem", lineHeight: 1.2 }}>
            Stop investing blind<br />to global events.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: "2.5rem", lineHeight: 1.7, maxWidth: 420, margin: "0 auto 2.5rem" }}>
            Every day without geopolitical context, you're leaving money on the table.
          </p>
          <Link href="/analyze">
            <button style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", borderRadius: 12, padding: "16px 40px", color: "white", fontWeight: 700, fontSize: "1.1rem", cursor: "pointer", boxShadow: "0 0 50px rgba(99,102,241,0.4)" }}>
              Analyze Your First Stock →
            </button>
          </Link>
        </Reveal>
      </section>

      <footer style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.18)", fontSize: "0.74rem" }}>
        © 2025 MoonLight · AI Stock Research · Not SEBI registered. For informational purposes only.
      </footer>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(7px)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
