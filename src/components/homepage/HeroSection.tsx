"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, ChevronDown } from "lucide-react";

/* ── Financial Canvas — subtle particle + wave animation ── */
function FinanceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let animId: number;
    let mouse = { x: w / 2, y: h / 2 };

    const particles: {
      x: number; y: number; vx: number; vy: number;
      r: number; o: number; color: string; baseO: number;
    }[] = [];

    const colors = ["#4A9EFF", "#4A9EFF", "#7BB8FF", "#7c4dff", "#00e5ff"];
    for (let i = 0; i < 100; i++) {
      const o = Math.random() * 0.4 + 0.05;
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 2 + 0.3, o, baseO: o,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let phase = 0;

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // Radial gradient glow at top-left
      const rg1 = ctx!.createRadialGradient(w * 0.2, h * 0.15, 0, w * 0.2, h * 0.15, w * 0.5);
      rg1.addColorStop(0, "rgba(74,158,255,0.06)");
      rg1.addColorStop(1, "transparent");
      ctx!.fillStyle = rg1;
      ctx!.fillRect(0, 0, w, h);

      // Radial gradient glow at bottom-right
      const rg2 = ctx!.createRadialGradient(w * 0.8, h * 0.85, 0, w * 0.8, h * 0.85, w * 0.4);
      rg2.addColorStop(0, "rgba(124,77,255,0.04)");
      rg2.addColorStop(1, "transparent");
      ctx!.fillStyle = rg2;
      ctx!.fillRect(0, 0, w, h);

      // Subtle grid
      ctx!.strokeStyle = "rgba(74,158,255,0.025)";
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < 25; i++) {
        const y = (i / 25) * h;
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(w, y); ctx!.stroke();
      }
      for (let i = 0; i < 35; i++) {
        const x = (i / 35) * w;
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, h); ctx!.stroke();
      }

      // Primary wave
      phase += 0.005;
      ctx!.beginPath();
      ctx!.strokeStyle = "rgba(74,158,255,0.08)";
      ctx!.lineWidth = 1.5;
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.55 + Math.sin(x * 0.002 + phase) * 100 + Math.sin(x * 0.005 + phase * 1.3) * 50;
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // Fill under wave
      const grd = ctx!.createLinearGradient(0, h * 0.4, 0, h);
      grd.addColorStop(0, "rgba(74,158,255,0.03)");
      grd.addColorStop(1, "rgba(74,158,255,0)");
      ctx!.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.55 + Math.sin(x * 0.002 + phase) * 100 + Math.sin(x * 0.005 + phase * 1.3) * 50;
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.lineTo(w, h); ctx!.lineTo(0, h); ctx!.closePath();
      ctx!.fillStyle = grd; ctx!.fill();

      // Secondary wave
      ctx!.beginPath();
      ctx!.strokeStyle = "rgba(124,77,255,0.05)";
      ctx!.lineWidth = 1;
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.6 + Math.sin(x * 0.003 + phase * 0.6) * 70 + Math.cos(x * 0.004 + phase * 1.1) * 35;
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.stroke();

      // Particles with mouse interaction
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        // Mouse proximity glow
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        p.o = dist < 200 ? p.baseO + (1 - dist / 200) * 0.3 : p.baseO;

        ctx!.globalAlpha = p.o;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      });

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(74,158,255,${0.04 * (1 - dist / 100)})`;
            ctx!.lineWidth = 0.4;
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    const onMouse = (e: MouseEvent) => { mouse = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMouse); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

/* ── Floating Market Orbs ── */
function FloatingOrbs() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Top-left orb */}
      <div style={{
        position: "absolute", top: "8%", left: "5%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,158,255,0.08) 0%, transparent 70%)",
        animation: "orbFloat 8s ease-in-out infinite",
        filter: "blur(40px)",
      }} />
      {/* Bottom-right orb */}
      <div style={{
        position: "absolute", bottom: "10%", right: "8%",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,77,255,0.06) 0%, transparent 70%)",
        animation: "orbFloat 10s ease-in-out infinite reverse",
        filter: "blur(50px)",
      }} />
      {/* Center orb */}
      <div style={{
        position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,229,255,0.03) 0%, transparent 60%)",
        animation: "orbFloat 12s ease-in-out infinite",
        filter: "blur(60px)",
      }} />
    </div>
  );
}

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <section style={{
      position: "relative", minHeight: "100vh",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <FinanceCanvas />
      <FloatingOrbs />

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(10,14,26,0.2) 0%, rgba(10,14,26,0.6) 70%, rgba(10,14,26,0.95) 100%)",
      }} />

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 60 ? "rgba(10,14,26,0.85)" : "transparent",
        backdropFilter: scrollY > 60 ? "blur(24px) saturate(1.5)" : "none",
        borderBottom: scrollY > 60 ? "1px solid rgba(74,158,255,0.08)" : "1px solid transparent",
        padding: "0 clamp(20px, 4vw, 60px)", height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/logo.png" alt="White Tiger" width={40} height={40} style={{ borderRadius: 10 }} />
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.03em", color: "#fff" }}>White Tiger</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {["Features", "Intelligence", "Pricing", "Download"].map((t) => (
            <a key={t} href={`#${t.toLowerCase()}`} style={{
              color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", fontWeight: 500,
              textDecoration: "none", transition: "color 0.3s", letterSpacing: "-0.01em",
            }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.45)")}
            >{t}</a>
          ))}
          <Link href="/analyze">
            <button style={{
              background: "rgba(255,255,255,0.06)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
              padding: "10px 28px", fontWeight: 600, fontSize: "0.88rem",
              cursor: "pointer", backdropFilter: "blur(10px)",
              transition: "all 0.3s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,158,255,0.15)"; e.currentTarget.style.borderColor = "rgba(74,158,255,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >Open Terminal</button>
          </Link>
        </div>
      </nav>

      {/* ── Hero Content ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "100px clamp(20px, 5vw, 80px) 60px",
        position: "relative", zIndex: 2,
      }}>
        <div style={{ maxWidth: 860, textAlign: "center" }}>
          {/* Status badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.12)",
            borderRadius: 50, padding: "10px 24px", marginBottom: 40,
            animation: "heroFadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.2s both",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#34D399", boxShadow: "0 0 8px rgba(52,211,153,0.5)",
              animation: "livePulse 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.02em" }}>
              AI-Powered Global Investment Intelligence
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2.8rem, 6vw, 5.2rem)", fontWeight: 800,
            lineHeight: 1.05, letterSpacing: "-0.04em",
            marginBottom: 28,
            animation: "heroFadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.4s both",
          }}>
            <span style={{ color: "#fff" }}>The Future of</span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #4A9EFF 0%, #7c4dff 40%, #00e5ff 80%, #34D399 100%)",
              backgroundSize: "300% 300%",
              animation: "luxuryGradient 6s ease infinite",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Financial Intelligence
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: "clamp(1rem, 1.3vw, 1.25rem)",
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.8, maxWidth: 600, margin: "0 auto 48px",
            letterSpacing: "-0.01em",
            animation: "heroFadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.6s both",
          }}>
            Stocks, crypto, forex, real estate, derivatives, tax intelligence &amp; wealth advisory — all powered by institutional-grade AI in one ecosystem.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
            animation: "heroFadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.8s both",
          }}>
            <Link href="/analyze">
              <button style={{
                background: "linear-gradient(135deg, #4A9EFF, #4A9EFF)",
                color: "#fff", border: "none", borderRadius: 16,
                padding: "18px 44px", fontWeight: 700, fontSize: "1.05rem",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 8px 40px rgba(74,158,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                letterSpacing: "-0.01em",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 48px rgba(74,158,255,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(74,158,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
              >
                Start Free Analysis <ArrowRight size={18} />
              </button>
            </Link>

            <a href="#features">
              <button style={{
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
                padding: "18px 44px", fontWeight: 600, fontSize: "1.05rem",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                backdropFilter: "blur(12px)", transition: "all 0.4s",
                letterSpacing: "-0.01em",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <Play size={16} /> Explore Platform
              </button>
            </a>
          </div>

          {/* Trust line */}
          <p style={{
            marginTop: 28, fontSize: "0.82rem",
            color: "rgba(255,255,255,0.2)", letterSpacing: "0.01em",
            animation: "heroFadeUp 1s cubic-bezier(0.16,1,0.3,1) 1s both",
          }}>
            5 free analyses · No credit card · 3,000+ NSE stocks · Real-time prices
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        animation: "float 4s ease-in-out infinite", zIndex: 2,
      }}>
        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Explore</span>
        <ChevronDown size={16} color="rgba(255,255,255,0.2)" />
      </div>
    </section>
  );
}
