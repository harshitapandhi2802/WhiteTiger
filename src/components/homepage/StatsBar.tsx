"use client";
import { Reveal, Counter } from "./shared";

const STATS = [
  // Counts verified against the data files on 17 Oct 2026 (launch audit).
  { value: 3100, suffix: "+", label: "NSE Stocks" },
  { value: 8600, suffix: "+", label: "Active MF Schemes" },
  { value: 40, suffix: "+", label: "Commodities" },
  { value: 10, suffix: "+", label: "Live Crypto Prices" },
  { value: 12, suffix: "", label: "Live Forex Pairs" },
  { value: 5, suffix: "", label: "Free AI Analyses / mo" },
];

export default function StatsBar() {
  return (
    <section style={{
      padding: "56px clamp(20px, 5vw, 80px)",
      borderTop: "1px solid rgba(74,158,255,0.06)",
      borderBottom: "1px solid rgba(74,158,255,0.06)",
      background: "rgba(74,158,255,0.015)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 20,
        textAlign: "center",
      }}>
        {STATS.map((s, i) => (
          <Reveal key={i} delay={i * 60}>
            <div>
              <div style={{
                fontSize: "2.2rem", fontWeight: 800,
                background: "linear-gradient(135deg, #4A9EFF, #7c4dff)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <div style={{
                fontSize: "0.75rem", color: "rgba(255,255,255,0.3)",
                fontWeight: 500, marginTop: 6, letterSpacing: "0.03em",
              }}>{s.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
