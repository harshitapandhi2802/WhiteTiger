"use client";
import { Reveal, Counter } from "./shared";

const STATS = [
  { value: 3100, suffix: "+", label: "NSE Stocks" },
  { value: 65, suffix: "+", label: "Commodities" },
  { value: 40, suffix: "+", label: "Crypto Tokens" },
  { value: 30, suffix: "+", label: "Forex Pairs" },
  { value: 48, suffix: "+", label: "Mutual Funds" },
  { value: 15, suffix: "s", label: "Analysis Time" },
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
