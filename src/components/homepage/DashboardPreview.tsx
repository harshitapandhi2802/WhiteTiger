"use client";
import { Reveal } from "./shared";

/* ── Miniature Sparkline SVG ── */
function Sparkline({ data, color, w = 80, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h * 0.8 - h * 0.1}`
  ).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <polygon fill={`url(#sg-${color.replace("#", "")})`} points={`0,${h} ${points} ${w},${h}`} />
    </svg>
  );
}

export default function DashboardPreview() {
  return (
    <section style={{
      padding: "80px clamp(20px, 5vw, 80px) 120px",
      position: "relative",
    }}>
      {/* Top glow */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 1000, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(74,158,255,0.06), transparent 70%)",
        pointerEvents: "none", filter: "blur(40px)",
      }} />

      <Reveal direction="scale">
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          background: "linear-gradient(145deg, rgba(13,17,27,0.95), rgba(18,22,36,0.9))",
          border: "1px solid rgba(74,158,255,0.1)",
          borderRadius: 28, padding: 32,
          boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 120px rgba(74,158,255,0.03)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Subtle inner glow */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(74,158,255,0.2), transparent)",
          }} />

          {/* Window controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 7 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f56" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#27c93f" }} />
            </div>
            <div style={{
              flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 10,
              padding: "10px 18px", fontSize: "0.75rem",
              color: "rgba(255,255,255,0.25)",
              border: "1px solid rgba(255,255,255,0.04)",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}>
              whitetiger-research.vercel.app/analyze
            </div>
          </div>

          {/* Tab bar */}
          <div style={{
            display: "flex", gap: 3, marginBottom: 20,
            background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 4, width: "fit-content",
          }}>
            {["Stocks", "Crypto", "Forex", "Real Estate", "Bonds", "F&O", "Tax", "Wealth"].map((t, i) => (
              <div key={t} style={{
                padding: "8px 18px", borderRadius: 10,
                fontSize: "0.72rem", fontWeight: 600,
                background: i === 0 ? "rgba(74,158,255,0.12)" : "transparent",
                color: i === 0 ? "#4A9EFF" : "rgba(255,255,255,0.25)",
                border: i === 0 ? "1px solid rgba(74,158,255,0.2)" : "1px solid transparent",
                transition: "all 0.3s",
              }}>{t}</div>
            ))}
          </div>

          {/* Top metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: "Current Price", value: "₹2,850.45", color: "#fff", data: [40, 42, 38, 45, 50, 48, 52, 55, 53, 58] },
              { label: "DCF Fair Value", value: "₹3,220.00", color: "#4A9EFF", data: [30, 33, 35, 34, 37, 40, 42, 44, 43, 46] },
              { label: "12M Target", value: "₹3,650.00", color: "#34D399", data: [20, 25, 22, 28, 32, 30, 35, 38, 40, 42] },
              { label: "AI Upside", value: "+28.1%", color: "#34D399", data: [10, 15, 18, 16, 22, 25, 28, 26, 30, 33] },
            ].map((c, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)", borderRadius: 16,
                padding: "18px 16px", border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                }}>
                  <div>
                    <div style={{
                      fontSize: "0.62rem", color: "rgba(255,255,255,0.25)",
                      fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                      marginBottom: 8,
                    }}>{c.label}</div>
                    <div style={{ fontSize: "1.35rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                  </div>
                  <Sparkline data={c.data} color={c.color} />
                </div>
              </div>
            ))}
          </div>

          {/* Risk scores */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 14 }}>
            {[
              { label: "Geopolitical Risk", score: "7.2/10", pct: 72, color: "#34D399" },
              { label: "Supply Chain", score: "8.5/10", pct: 85, color: "#34D399" },
              { label: "Commodity Exposure", score: "5.1/10", pct: 51, color: "#FBBF24" },
              { label: "Management Quality", score: "9.0/10", pct: 90, color: "#4A9EFF" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)", borderRadius: 16,
                padding: "18px 16px", border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{
                  fontSize: "0.62rem", color: "rgba(255,255,255,0.25)",
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                  marginBottom: 10,
                }}>{s.label}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.score}</div>
                <div style={{
                  height: 3, background: "rgba(255,255,255,0.04)",
                  borderRadius: 2, marginTop: 12, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${s.pct}%`,
                    background: `linear-gradient(90deg, ${s.color}80, ${s.color})`,
                    borderRadius: 2, transition: "width 1.5s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
