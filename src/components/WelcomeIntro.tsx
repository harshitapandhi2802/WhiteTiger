"use client";
import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles, TrendingUp, Globe, Brain, Shield } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — WELCOME INTRO (inside /analyze)
   Animated arrival experience that sits before the SectionLandingGrid.
   - Gradient hero text with shimmer
   - Floating ambient orbs
   - Live-pulsing market ticker (mock symbols, just for feel)
   - Stat highlights
   - Big "Start Analyzing" CTA
   ═══════════════════════════════════════════════════════════════ */

const TICKER = [
  { sym: "NIFTY 50", val: "24,820", chg: "+0.42%", up: true },
  { sym: "SENSEX", val: "81,420", chg: "+0.38%", up: true },
  { sym: "USD/INR", val: "₹83.42", chg: "-0.06%", up: false },
  { sym: "BTC", val: "$67,840", chg: "+1.18%", up: true },
  { sym: "GOLD", val: "$2,418/oz", chg: "+0.74%", up: true },
  { sym: "CRUDE", val: "$82.5/bbl", chg: "-0.31%", up: false },
  { sym: "10Y G-SEC", val: "6.92%", chg: "-2 bps", up: false },
  { sym: "RELIANCE", val: "₹1,350", chg: "+1.02%", up: true },
  { sym: "TCS", val: "₹4,184", chg: "+0.55%", up: true },
  { sym: "HDFCBANK", val: "₹1,712", chg: "+0.21%", up: true },
];

export function WelcomeIntro({ onStart, userName }: { onStart: () => void; userName?: string }) {
  // gentle entrance sequence
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      position: "relative", overflow: "hidden", minHeight: "calc(100vh - 60px)",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "40px 20px 32px",
      background: "radial-gradient(ellipse at 50% -10%, rgba(74,158,255,0.15), transparent 60%), radial-gradient(ellipse at 80% 110%, rgba(167,139,250,0.12), transparent 55%), #0A0E1A",
      color: "#E8ECF4",
    }}>
      {/* Ambient floating orbs */}
      <div aria-hidden="true" style={{
        position: "absolute", top: "10%", left: "8%", width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,158,255,0.22), transparent 70%)",
        filter: "blur(40px)", animation: "wtOrb 9s ease-in-out infinite", pointerEvents: "none",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: "12%", right: "10%", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,250,0.20), transparent 70%)",
        filter: "blur(50px)", animation: "wtOrb 11s ease-in-out infinite 1.5s", pointerEvents: "none",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", top: "50%", right: "26%", width: 180, height: 180, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,211,153,0.16), transparent 70%)",
        filter: "blur(40px)", animation: "wtOrb 13s ease-in-out infinite 2s", pointerEvents: "none",
      }} />

      {/* Top pill */}
      <div style={{
        opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        display: "flex", justifyContent: "center", marginBottom: 22,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
          borderRadius: 99, background: "rgba(74,158,255,0.08)",
          border: "1px solid rgba(74,158,255,0.22)",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: "#34D399",
            animation: "wtLivePulse 2s ease-in-out infinite", boxShadow: "0 0 10px #34D399",
          }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#4A9EFF", letterSpacing: "0.04em" }}>
            AI-POWERED CROSS-ASSET INTELLIGENCE · LIVE
          </span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", maxWidth: 880, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <h1 style={{
          fontSize: "clamp(2.2rem, 6vw, 4.2rem)", fontWeight: 900, letterSpacing: "-0.035em",
          lineHeight: 1.05, margin: 0,
          opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 0.7s 0.05s ease-out, transform 0.7s 0.05s ease-out",
        }}>
          {userName ? <>Welcome back, <span style={{ background: "linear-gradient(135deg, #4A9EFF 0%, #A78BFA 50%, #34D399 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "wtShimmer 5s linear infinite" }}>{userName.split(" ")[0]}</span>.</>
            : <>Markets, decoded by <span style={{
              background: "linear-gradient(135deg, #4A9EFF 0%, #A78BFA 40%, #34D399 70%, #FBBF24 100%)",
              backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "wtShimmer 6s linear infinite",
            }}>AI</span>.</>}
        </h1>
        <p style={{
          fontSize: "clamp(0.92rem, 1.6vw, 1.1rem)", color: "rgba(232,237,245,0.65)",
          lineHeight: 1.6, maxWidth: 640, margin: "18px auto 0",
          opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.7s 0.18s ease-out, transform 0.7s 0.18s ease-out",
        }}>
          Eleven asset classes. Live prices grounded in real exchange feeds. Institutional-grade AI reports.
          Every number labelled with where it came from.
        </p>

        {/* Feature pills */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 26,
          opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.7s 0.32s ease-out, transform 0.7s 0.32s ease-out",
        }}>
          {[
            { icon: <Brain size={13} />, label: "AI thesis per asset", color: "#A78BFA" },
            { icon: <TrendingUp size={13} />, label: "Live exchange data", color: "#4A9EFF" },
            { icon: <Globe size={13} />, label: "India + 25 global markets", color: "#34D399" },
            { icon: <Shield size={13} />, label: "Provenance on every number", color: "#FBBF24" },
          ].map((p, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px",
              borderRadius: 99, background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(232,237,245,0.08)", fontSize: "0.72rem", fontWeight: 700, color: p.color,
            }}>{p.icon}{p.label}</span>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 38, display: "flex", justifyContent: "center",
          opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.7s 0.45s ease-out, transform 0.7s 0.45s ease-out",
        }}>
          <button onClick={onStart} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "16px 32px", borderRadius: 14, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #4A9EFF 0%, #A78BFA 100%)",
            color: "#fff", fontSize: "1.02rem", fontWeight: 800, letterSpacing: "0.005em",
            boxShadow: "0 12px 40px rgba(74,158,255,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset",
            transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 18px 50px rgba(74,158,255,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(74,158,255,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset"; }}
          >
            <Sparkles size={17} /> Start Analyzing <ArrowRight size={18} />
          </button>
        </div>
        <div style={{
          marginTop: 14, fontSize: "0.7rem", color: "rgba(232,237,245,0.4)",
          opacity: show ? 1 : 0, transition: "opacity 1.2s 0.7s ease-out",
        }}>
          Free to start · Educational research, not investment advice
        </div>
      </div>

      {/* Live ticker strip */}
      <div style={{
        marginTop: 50, position: "relative", overflow: "hidden", maxWidth: 1100, marginInline: "auto",
        borderTop: "1px solid rgba(232,237,245,0.06)", borderBottom: "1px solid rgba(232,237,245,0.06)",
        padding: "12px 0", background: "rgba(255,255,255,0.015)",
        opacity: show ? 1 : 0, transition: "opacity 1s 0.6s ease-out",
      }}>
        <div style={{ display: "flex", gap: 36, animation: "wtTickerScroll 38s linear infinite", whiteSpace: "nowrap" }}>
          {[...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "rgba(232,237,245,0.85)" }}>{t.sym}</span>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "rgba(232,237,245,0.55)" }}>{t.val}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: t.up ? "#34D399" : "#F87171" }}>
                {t.up ? "▲" : "▼"} {t.chg}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(232,237,245,0.15)" }} />
            </div>
          ))}
        </div>
        {/* Fade edges */}
        <div aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: "linear-gradient(to right, #0A0E1A, transparent)", pointerEvents: "none" }} />
        <div aria-hidden="true" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: "linear-gradient(to left, #0A0E1A, transparent)", pointerEvents: "none" }} />
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 14, maxWidth: 900, margin: "30px auto 0", position: "relative", zIndex: 2,
        opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.9s 0.85s ease-out, transform 0.9s 0.85s ease-out",
      }}>
        {[
          { v: "11", l: "Asset classes" },
          { v: "~14k", l: "AMFI MF schemes" },
          { v: "722", l: "NSE stocks" },
          { v: "25", l: "Global markets" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(232,237,245,0.06)",
            borderRadius: 12, padding: "14px 16px", textAlign: "center",
          }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #4A9EFF, #A78BFA)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{s.v}</div>
            <div style={{ fontSize: "0.62rem", color: "rgba(232,237,245,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes wtOrb { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-26px) scale(1.06); } }
        @keyframes wtShimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes wtLivePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.92); } }
        @keyframes wtTickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
      `}</style>
    </div>
  );
}

export default WelcomeIntro;
