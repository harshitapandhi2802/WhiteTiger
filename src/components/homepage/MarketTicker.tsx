"use client";

const TICKER_DATA = [
  { sym: "NIFTY 50", val: "23,719", chg: "+0.27%", up: true },
  { sym: "SENSEX", val: "75,415", chg: "+0.31%", up: true },
  { sym: "NASDAQ", val: "19,112", chg: "+0.54%", up: true },
  { sym: "BTC", val: "$107,420", chg: "+2.1%", up: true },
  { sym: "GOLD", val: "$3,312", chg: "+0.8%", up: true },
  { sym: "USD/INR", val: "₹85.68", chg: "-0.12%", up: false },
  { sym: "CRUDE OIL", val: "$61.2", chg: "+1.4%", up: true },
  { sym: "10Y BOND", val: "7.18%", chg: "-0.03%", up: false },
  { sym: "ETH", val: "$2,580", chg: "+1.8%", up: true },
  { sym: "SILVER", val: "$33.45", chg: "+0.6%", up: true },
];

export default function MarketTicker() {
  const items = [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];

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
