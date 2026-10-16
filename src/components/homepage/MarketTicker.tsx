"use client";
import { useLiveTicker, type TickerItem } from "@/hooks/useLiveTicker";

const PLACEHOLDER: TickerItem[] = [
  { sym: "NIFTY 50",  val: "—", chg: "—", up: true },
  { sym: "SENSEX",    val: "—", chg: "—", up: true },
  { sym: "BANK NIFTY",val: "—", chg: "—", up: true },
  { sym: "BTC",       val: "—", chg: "—", up: true },
  { sym: "USD/INR",   val: "—", chg: "—", up: true },
  { sym: "GOLD",      val: "—", chg: "—", up: true },
  { sym: "10Y G-SEC", val: "—", chg: "—", up: true },
];

export default function MarketTicker() {
  // No more hardcoded prices — pull every value from the same live endpoints
  // the app uses, with a clear "—" placeholder if a feed is down.
  const data = useLiveTicker() ?? PLACEHOLDER;

  const items = [...data, ...data, ...data];

  return (
    <div style={{
      overflow: "hidden",
      background: "rgba(10,14,26,0.6)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(74,158,255,0.06)",
      borderBottom: "1px solid rgba(74,158,255,0.06)",
      padding: "14px 0",
      position: "relative",
    }}>
      {/* Fade edges */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(90deg, rgba(10,14,26,1), transparent)", zIndex: 2, pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(-90deg, rgba(10,14,26,1), transparent)", zIndex: 2, pointerEvents: "none" }} />

      <div style={{
        display: "flex", gap: 48,
        animation: "tickerScroll 45s linear infinite",
        whiteSpace: "nowrap", width: "max-content",
      }}>
        {items.map((t, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            fontSize: "0.78rem",
          }}>
            <span style={{
              color: "rgba(255,255,255,0.35)", fontWeight: 600,
              letterSpacing: "0.02em",
            }}>{t.sym}</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>{t.val}</span>
            <span style={{
              color: t.up ? "#34D399" : "#F87171",
              fontWeight: 700, fontSize: "0.72rem",
              padding: "2px 8px", borderRadius: 6,
              background: t.up ? "rgba(52,211,153,0.08)" : "rgba(255,82,82,0.08)",
            }}>{t.chg}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
