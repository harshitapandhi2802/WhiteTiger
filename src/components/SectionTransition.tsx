"use client";
import React, { useEffect, useState } from "react";
import {
  TrendingUp, PieChart, Bitcoin, DollarSign, Layers, Flame,
  GitBranch, Building2, Globe,
} from "lucide-react";
import type { SectionId } from "@/components/SectionLandingGrid";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — SECTION TRANSITION
   Full-screen ~1.8s cinematic intro played when the user opens a
   section. Each section gets its own themed background animation
   (candlesticks / orbiting coins / pie / yield curve / skyline ...)
   so opening Stocks feels distinctly different from opening Crypto.
   ═══════════════════════════════════════════════════════════════ */

const SECTION_META: Record<SectionId, { label: string; tagline: string; color: string; gradient: string; icon: React.ReactNode; theme: ThemeKey; }> = {
  stocks:        { label: "Stocks",          tagline: "Live NSE/BSE prices · institutional AI reports",       color: "#4A9EFF", gradient: "from-[#0A1B3D] via-[#0A1326] to-[#0A0E1A]", icon: <TrendingUp size={56} />, theme: "candles" },
  mutualfunds:   { label: "Mutual Funds",    tagline: "~14,000 AMFI schemes · calculators · compare",        color: "#34D399", gradient: "from-[#0D3326] via-[#0E2018] to-[#0A0E1A]", icon: <PieChart size={56} />,  theme: "pie" },
  crypto:        { label: "Crypto",          tagline: "Live CoinDCX + CoinGecko · AI thesis per coin",         color: "#FB923C", gradient: "from-[#3D1F0A] via-[#26160A] to-[#0A0E1A]", icon: <Bitcoin size={56} />,   theme: "coins" },
  currency:      { label: "Forex",           tagline: "Live rates · RBI-aware FX intelligence",               color: "#22D3EE", gradient: "from-[#073A40] via-[#0A1F26] to-[#0A0E1A]", icon: <DollarSign size={56} />,theme: "fx" },
  debt:          { label: "Bonds",           tagline: "Live India 10Y G-Sec anchor · AI debt analysis",       color: "#A78BFA", gradient: "from-[#291A4D] via-[#1A1226] to-[#0A0E1A]", icon: <Layers size={56} />,    theme: "curve" },
  commodities:   { label: "Commodities",     tagline: "MCX + global crude/gold/copper · geopolitical lens",   color: "#FBBF24", gradient: "from-[#3D2D0A] via-[#26200A] to-[#0A0E1A]", icon: <Flame size={56} />,     theme: "bars" },
  derivatives:   { label: "Derivatives",     tagline: "Option chain · Greeks · PCR · futures",                color: "#F472B6", gradient: "from-[#3D0A2B] via-[#26101F] to-[#0A0E1A]", icon: <GitBranch size={56} />, theme: "greeks" },
  realestate:    { label: "Real Estate",     tagline: "India state → city → locality intelligence",           color: "#10b981", gradient: "from-[#063326] via-[#0A1F18] to-[#0A0E1A]", icon: <Building2 size={56} />, theme: "skyline" },
  international: { label: "Global Markets",  tagline: "25 world markets · indices + top stocks",              color: "#818CF8", gradient: "from-[#1A1F4D] via-[#13182E] to-[#0A0E1A]", icon: <Globe size={56} />,     theme: "globe" },
};

type ThemeKey = "candles" | "pie" | "coins" | "fx" | "curve" | "bars" | "greeks" | "skyline" | "globe" | "arrows" | "numbers";

export function SectionTransition({ sectionId, onComplete, durationMs = 1800 }: { sectionId: SectionId; onComplete: () => void; durationMs?: number }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0); // 0=entering, 1=showing, 2=exiting
  useEffect(() => {
    const a = setTimeout(() => setStage(1), 80);
    const b = setTimeout(() => setStage(2), Math.max(400, durationMs - 400));
    const c = setTimeout(() => onComplete(), durationMs);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, [onComplete, durationMs]);

  const meta = SECTION_META[sectionId];
  if (!meta) { onComplete(); return null; }

  const showOpacity = stage === 1 ? 1 : 0;
  const showScale = stage === 1 ? 1 : 0.92;

  return (
    <div role="dialog" aria-modal="true" style={{
      position: "fixed", inset: 0, zIndex: 200, overflow: "hidden",
      background: `radial-gradient(ellipse at 50% 35%, ${meta.color}22, transparent 60%), radial-gradient(ellipse at 80% 85%, ${meta.color}1A, transparent 60%), #050813`,
      opacity: stage === 2 ? 0 : 1,
      transition: "opacity 0.4s ease-out",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      color: "#fff",
    }}>
      {/* Themed background animation */}
      <ThemedBackground theme={meta.theme} color={meta.color} active={stage === 1} />

      {/* Subtle vignette */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        pointerEvents: "none",
      }} />

      {/* Center content */}
      <div style={{
        position: "relative", zIndex: 2, textAlign: "center", padding: "0 20px",
        opacity: showOpacity, transform: `scale(${showScale}) translateY(${stage === 1 ? 0 : 12}px)`,
        transition: "opacity 0.55s cubic-bezier(0.2,0.7,0.3,1), transform 0.55s cubic-bezier(0.2,0.7,0.3,1)",
      }}>
        {/* Glowing icon ring */}
        <div style={{
          position: "relative", width: 140, height: 140, margin: "0 auto 24px",
        }}>
          {/* Pulsing outer rings */}
          {[0, 1, 2].map(i => (
            <div key={i} aria-hidden="true" style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: `1.5px solid ${meta.color}55`,
              animation: `wtTransitionPulse 1.8s ease-out infinite ${i * 0.45}s`,
            }} />
          ))}
          {/* Solid disc */}
          <div style={{
            position: "absolute", inset: 18, borderRadius: "50%",
            background: `linear-gradient(135deg, ${meta.color}, ${meta.color}66)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
            boxShadow: `0 0 60px ${meta.color}88, 0 0 120px ${meta.color}55, inset 0 0 24px rgba(255,255,255,0.1)`,
            animation: "wtIconBob 1.6s ease-in-out infinite",
          }}>
            {meta.icon}
          </div>
        </div>

        {/* Label */}
        <div style={{
          fontSize: "0.74rem", fontWeight: 800, letterSpacing: "0.32em",
          color: meta.color, textTransform: "uppercase", marginBottom: 10, opacity: 0.85,
        }}>
          Loading
        </div>
        <h1 style={{
          margin: 0, fontSize: "clamp(2.4rem, 6vw, 4rem)", fontWeight: 900,
          letterSpacing: "-0.03em", lineHeight: 1,
          background: `linear-gradient(135deg, #fff 0%, ${meta.color} 100%)`,
          backgroundClip: "text", WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {meta.label}
        </h1>
        <p style={{
          margin: "14px 0 0", fontSize: "0.92rem",
          color: "rgba(232,237,245,0.6)", maxWidth: 540, marginInline: "auto", lineHeight: 1.5,
        }}>
          {meta.tagline}
        </p>

        {/* Progress bar */}
        <div style={{
          width: 240, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99,
          margin: "30px auto 0", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)`,
            animation: `wtTransitionFill ${durationMs - 200}ms cubic-bezier(0.3,0.6,0.4,1) forwards`,
            transformOrigin: "left",
          }} />
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes wtTransitionPulse {
          0%   { transform: scale(0.9);  opacity: 0.7; }
          80%  { transform: scale(1.6);  opacity: 0; }
          100% { transform: scale(1.6);  opacity: 0; }
        }
        @keyframes wtIconBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-4px) rotate(-2deg); }
        }
        @keyframes wtTransitionFill {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes wtCandleRise { 0% { transform: scaleY(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: scaleY(1); opacity: 1; } }
        @keyframes wtFloat { 0%, 100% { transform: translateY(0) rotate(var(--rot,0deg)); } 50% { transform: translateY(-22px) rotate(var(--rot,0deg)); } }
        @keyframes wtCoinOrbit { 0% { transform: rotate(0deg) translateX(var(--r,180px)) rotate(0deg); } 100% { transform: rotate(360deg) translateX(var(--r,180px)) rotate(-360deg); } }
        @keyframes wtDrawCurve { 0% { stroke-dashoffset: 1000; } 100% { stroke-dashoffset: 0; } }
        @keyframes wtSliceIn { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
        @keyframes wtBarsRise { 0% { transform: scaleY(0); } 100% { transform: scaleY(1); } }
        @keyframes wtNumberStream { 0% { transform: translateY(120%); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-120%); opacity: 0; } }
        @keyframes wtFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wtGlobeRotate { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
        @keyframes wtArrowRise { 0% { transform: translateY(60px); opacity: 0; } 60% { opacity: 1; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THEMED BACKGROUND PER SECTION
   Each theme renders its own decorative SVG/HTML overlay.
   ═══════════════════════════════════════════════════════════════ */
function ThemedBackground({ theme, color, active }: { theme: ThemeKey; color: string; active: boolean }) {
  const wrap: React.CSSProperties = {
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
    opacity: active ? 1 : 0, transition: "opacity 0.4s ease-out",
  };
  switch (theme) {
    case "candles":  return <CandlesBg color={color} style={wrap} />;
    case "coins":    return <CoinsBg color={color} style={wrap} />;
    case "fx":       return <FxBg color={color} style={wrap} />;
    case "pie":      return <PieBg color={color} style={wrap} />;
    case "curve":    return <CurveBg color={color} style={wrap} />;
    case "bars":     return <BarsBg color={color} style={wrap} />;
    case "greeks":   return <GreeksBg color={color} style={wrap} />;
    case "skyline":  return <SkylineBg color={color} style={wrap} />;
    case "globe":    return <GlobeBg color={color} style={wrap} />;
    case "arrows":   return <ArrowsBg color={color} style={wrap} />;
    case "numbers":  return <NumbersBg color={color} style={wrap} />;
    default:         return null;
  }
}

/* ─── Stocks: candlestick chart rising ─────────────────────────── */
function CandlesBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const candles = Array.from({ length: 22 }, (_, i) => {
    const h = 40 + Math.sin(i * 0.9) * 30 + (i / 22) * 60;
    const up = Math.sin(i * 1.4) > 0.1;
    return { h, up, delay: i * 0.04 };
  });
  return (
    <div style={style}>
      <div style={{ position: "absolute", bottom: "10%", left: 0, right: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12 }}>
        {candles.map((c, i) => (
          <div key={i} style={{
            width: 14, height: c.h, borderRadius: 3,
            background: c.up ? "#34D399" : "#F87171", opacity: 0.55,
            transformOrigin: "bottom",
            animation: `wtCandleRise 1.2s cubic-bezier(0.2,0.7,0.3,1) both ${c.delay}s`,
          }} />
        ))}
      </div>
      {/* Trend line */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.35 }} viewBox="0 0 600 400" preserveAspectRatio="none">
        <path d="M 0 320 L 80 290 L 160 240 L 240 220 L 320 180 L 400 150 L 480 120 L 600 80" stroke={color} strokeWidth="2.5" fill="none" strokeDasharray="800" style={{ animation: "wtDrawCurve 1.4s ease-out both" }} />
      </svg>
    </div>
  );
}

/* ─── Crypto: orbiting coin symbols ────────────────────────────── */
function CoinsBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const coins = [
    { sym: "₿", r: 200, dur: 18 }, { sym: "Ξ", r: 270, dur: 22 }, { sym: "◎", r: 330, dur: 26 },
    { sym: "₮", r: 240, dur: 20 }, { sym: "Ð", r: 300, dur: 24 },
  ];
  return (
    <div style={style}>
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0 }}>
        {coins.map((c, i) => (
          <div key={i} style={{
            position: "absolute", width: 44, height: 44, borderRadius: "50%",
            background: `radial-gradient(circle, ${color}cc, ${color}33)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: "1.4rem",
            transform: `translate(-50%,-50%)`, boxShadow: `0 0 20px ${color}88`,
            ["--r" as string]: `${c.r}px`,
            animation: `wtCoinOrbit ${c.dur}s linear infinite ${i * -3}s`,
          }}>{c.sym}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── Forex: floating currency pairs ───────────────────────────── */
function FxBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const pairs = ["USD/INR", "EUR/USD", "GBP/JPY", "USD/JPY", "EUR/INR", "AUD/USD", "USD/CAD", "GBP/INR"];
  return (
    <div style={style}>
      {pairs.map((p, i) => {
        const top = 8 + ((i * 13) % 80);
        const left = 6 + ((i * 17) % 86);
        const rot = ((i * 11) % 14) - 7;
        return (
          <div key={i} style={{
            position: "absolute", top: `${top}%`, left: `${left}%`,
            color: color, fontWeight: 800, fontSize: "1.1rem",
            opacity: 0.35, letterSpacing: "0.02em",
            ["--rot" as string]: `${rot}deg`,
            animation: `wtFloat ${5 + i % 4}s ease-in-out infinite ${i * 0.2}s, wtFadeIn 0.8s ease-out both ${i * 0.05}s`,
            transform: `rotate(${rot}deg)`,
          }}>{p}</div>
        );
      })}
    </div>
  );
}

/* ─── MF: pie chart slices ─────────────────────────────────────── */
function PieBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const slices = [
    { from: 0, to: 30, color: "#34D399" }, { from: 30, to: 55, color: "#4A9EFF" },
    { from: 55, to: 80, color: "#FBBF24" }, { from: 80, to: 100, color: "#A78BFA" },
  ];
  return (
    <div style={style}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 480, height: 480, animation: "wtSliceIn 1s cubic-bezier(0.2,0.7,0.3,1) both", opacity: 0.18 }}>
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          {slices.map((s, i) => {
            const a0 = (s.from / 100) * 2 * Math.PI - Math.PI / 2;
            const a1 = (s.to / 100) * 2 * Math.PI - Math.PI / 2;
            const x0 = 100 + 90 * Math.cos(a0), y0 = 100 + 90 * Math.sin(a0);
            const x1 = 100 + 90 * Math.cos(a1), y1 = 100 + 90 * Math.sin(a1);
            const large = s.to - s.from > 50 ? 1 : 0;
            return <path key={i} d={`M 100 100 L ${x0} ${y0} A 90 90 0 ${large} 1 ${x1} ${y1} Z`} fill={s.color} opacity={0.85} />;
          })}
          <circle cx="100" cy="100" r="40" fill="transparent" stroke={color} strokeWidth="1.5" opacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Bonds: yield curve ───────────────────────────────────────── */
function CurveBg({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <div style={style}>
      <svg viewBox="0 0 800 400" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4 }}>
        {/* grid */}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1="0" y1={80 * (i + 1)} x2="800" y2={80 * (i + 1)} stroke="rgba(255,255,255,0.05)" />
        ))}
        {/* curve */}
        <path d="M 60 320 C 160 300, 240 240, 360 200 S 580 160, 740 130" stroke={color} strokeWidth="3.5" fill="none" strokeDasharray="2000" style={{ animation: "wtDrawCurve 1.4s ease-out both" }} />
        {[60, 200, 360, 540, 740].map((x, i) => {
          const y = [320, 250, 200, 170, 130][i];
          return <circle key={i} cx={x} cy={y} r="6" fill={color} style={{ animation: `wtFadeIn 0.6s ease-out both ${0.6 + i * 0.12}s` }} />;
        })}
      </svg>
    </div>
  );
}

/* ─── Commodities: vertical bars ───────────────────────────────── */
function BarsBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const bars = Array.from({ length: 18 }, (_, i) => {
    const h = 80 + Math.abs(Math.sin(i * 0.7)) * 180;
    return { h, delay: i * 0.05 };
  });
  return (
    <div style={style}>
      <div style={{ position: "absolute", bottom: "8%", left: 0, right: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 14 }}>
        {bars.map((b, i) => (
          <div key={i} style={{
            width: 24, height: b.h, borderRadius: 6,
            background: `linear-gradient(180deg, ${color}, ${color}66)`, opacity: 0.4,
            transformOrigin: "bottom",
            animation: `wtBarsRise 0.9s cubic-bezier(0.2,0.7,0.3,1) both ${b.delay}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Derivatives: greek letters ───────────────────────────────── */
function GreeksBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const greeks = ["Δ", "Γ", "θ", "ν", "ρ", "σ", "λ"];
  return (
    <div style={style}>
      {greeks.map((g, i) => {
        const top = 10 + ((i * 19) % 72);
        const left = 8 + ((i * 23) % 84);
        const size = 2 + (i % 3) * 0.8;
        return (
          <div key={i} style={{
            position: "absolute", top: `${top}%`, left: `${left}%`,
            color, fontWeight: 700, fontSize: `${size}rem`, opacity: 0.3,
            ["--rot" as string]: "0deg",
            animation: `wtFloat ${6 + (i % 3)}s ease-in-out infinite ${i * 0.3}s, wtFadeIn 0.7s ease-out both ${i * 0.08}s`,
          }}>{g}</div>
        );
      })}
    </div>
  );
}

/* ─── Real Estate: city skyline ────────────────────────────────── */
function SkylineBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const buildings = Array.from({ length: 24 }, (_, i) => {
    const h = 60 + (Math.sin(i * 0.8) + 1) * 90;
    const w = 30 + (i % 3) * 12;
    return { h, w, delay: i * 0.04 };
  });
  return (
    <div style={style}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, opacity: 0.45 }}>
        {buildings.map((b, i) => (
          <div key={i} style={{
            width: b.w, height: b.h, background: `linear-gradient(180deg, ${color}99, ${color}44)`,
            transformOrigin: "bottom",
            animation: `wtBarsRise 1s cubic-bezier(0.2,0.7,0.3,1) both ${b.delay}s`,
            position: "relative",
          }}>
            {/* windows */}
            {Array.from({ length: Math.floor(b.h / 18) }).map((_, j) => (
              <div key={j} style={{ position: "absolute", left: 4, right: 4, top: 6 + j * 18, height: 4, background: "#FFF", opacity: (j + i) % 3 === 0 ? 0.55 : 0.15 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Global Markets: rotating world dots ──────────────────────── */
function GlobeBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const dots = Array.from({ length: 60 }, (_, i) => {
    const phi = (Math.acos(2 * ((i + 0.5) / 60) - 1));
    const theta = i * 2.39996323;
    return {
      x: 50 + 38 * Math.sin(phi) * Math.cos(theta),
      y: 50 + 38 * Math.cos(phi),
      o: 0.3 + 0.5 * Math.abs(Math.sin(phi)),
    };
  });
  return (
    <div style={style}>
      <div style={{
        position: "absolute", top: "50%", left: "50%", width: 460, height: 460,
        transform: "translate(-50%,-50%)", animation: "wtGlobeRotate 28s linear infinite", opacity: 0.35,
      }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="38" fill="none" stroke={`${color}66`} strokeWidth="0.4" />
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="0.9" fill={color} opacity={d.o} />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─── Wealth: ascending arrows + target ────────────────────────── */
function ArrowsBg({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <div style={style}>
      <svg viewBox="0 0 800 400" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
        {[0, 1, 2, 3].map(i => (
          <g key={i} style={{ animation: `wtArrowRise 1.1s cubic-bezier(0.2,0.7,0.3,1) both ${i * 0.13}s` }}>
            <path d={`M ${100 + i * 130} 320 L ${230 + i * 130} ${180 - i * 20} L ${210 + i * 130} ${190 - i * 20} M ${230 + i * 130} ${180 - i * 20} L ${228 + i * 130} ${204 - i * 20}`}
              stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        ))}
        <circle cx="700" cy="100" r="22" fill="none" stroke={color} strokeWidth="2.5" />
        <circle cx="700" cy="100" r="10" fill={color} opacity="0.7" />
      </svg>
    </div>
  );
}

/* ─── Tax: streaming numbers ───────────────────────────────────── */
function NumbersBg({ color, style }: { color: string; style: React.CSSProperties }) {
  const cols = 14;
  return (
    <div style={style}>
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-around", overflow: "hidden" }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} style={{ position: "relative", width: 30, height: "100%" }}>
            {Array.from({ length: 8 }).map((_, r) => (
              <div key={r} style={{
                position: "absolute", top: `${(r * 14) - 10}%`, color, opacity: 0.18,
                fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem", fontWeight: 700,
                animation: `wtNumberStream ${4 + (c % 4)}s linear infinite ${(c * 0.13 + r * 0.5)}s`,
              }}>
                {((c * 7 + r * 3) % 10)}{((c * 11 + r * 17) % 10)}{((c * 5 + r * 13) % 10)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SectionTransition;
