"use client";
import { useEffect, useState } from "react";

interface TickerItem { sym: string; val: string; chg: string; up: boolean; }

const PLACEHOLDER: TickerItem[] = [
  { sym: "NIFTY 50",  val: "—", chg: "—", up: true },
  { sym: "SENSEX",    val: "—", chg: "—", up: true },
  { sym: "BANK NIFTY",val: "—", chg: "—", up: true },
  { sym: "BTC",       val: "—", chg: "—", up: true },
  { sym: "USD/INR",   val: "—", chg: "—", up: true },
  { sym: "GOLD",      val: "—", chg: "—", up: true },
  { sym: "10Y G-SEC", val: "—", chg: "—", up: true },
];

function fmt(n: number, prefix = "") { return prefix + n.toLocaleString("en-IN", { maximumFractionDigits: 2 }); }
function pct(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`; }

export default function MarketTicker() {
  // No more hardcoded prices — pull every value from the same live endpoints
  // the app uses, with a clear "—" placeholder if a feed is down.
  const [data, setData] = useState<TickerItem[]>(PLACEHOLDER);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [stocksR, cryptoR, forexR, yieldsR, commR] = await Promise.allSettled([
          fetch("/api/live-prices?type=stocks").then(r => r.json()),
          fetch("/api/live-prices?type=crypto").then(r => r.json()),
          fetch("/api/live-prices?type=forex").then(r => r.json()),
          fetch("/api/live-yields").then(r => r.json()),
          fetch("/api/live-prices?type=commodities").then(r => r.json()),
        ]);
        if (cancelled) return;
        const stocks = stocksR.status === "fulfilled" ? stocksR.value?.prices ?? {} : {};
        const crypto = cryptoR.status === "fulfilled" ? cryptoR.value?.prices ?? {} : {};
        const forex  = forexR.status === "fulfilled"  ? forexR.value?.prices ?? {}  : {};
        const yields = yieldsR.status === "fulfilled" ? yieldsR.value ?? {}        : {};
        const comm   = commR.status === "fulfilled"   ? commR.value?.prices ?? {}  : {};
        const items: TickerItem[] = [];
        const push = (sym: string, val: number | undefined | null, chg: number | undefined | null, valPrefix = "") => {
          if (val == null || !(val > 0)) return;
          items.push({ sym, val: fmt(val, valPrefix), chg: chg != null ? pct(chg) : "—", up: (chg ?? 0) >= 0 });
        };
        push("NIFTY 50",   stocks["NIFTY50"]?.price,   stocks["NIFTY50"]?.changePercent);
        push("SENSEX",     stocks["SENSEX"]?.price,    stocks["SENSEX"]?.changePercent);
        push("BANK NIFTY", stocks["BANKNIFTY"]?.price, stocks["BANKNIFTY"]?.changePercent);
        push("RELIANCE",   stocks["RELIANCE"]?.price,  stocks["RELIANCE"]?.changePercent, "₹");
        push("TCS",        stocks["TCS"]?.price,       stocks["TCS"]?.changePercent,       "₹");
        push("BTC",        crypto["BTC"]?.usd,         crypto["BTC"]?.change24h,           "$");
        push("ETH",        crypto["ETH"]?.usd,         crypto["ETH"]?.change24h,           "$");
        push("USD/INR",    forex["USDINR"]?.rate,      forex["USDINR"]?.change24h,         "₹");
        push("GOLD",       comm["GOLD"]?.price,        comm["GOLD"]?.changePercent,        "$");
        push("CRUDE",      comm["CRUDEOIL"]?.price,    comm["CRUDEOIL"]?.changePercent,    "$");
        if (yields.india10Y) items.push({ sym: "10Y G-SEC", val: `${yields.india10Y}%`, chg: "live", up: true });
        if (items.length > 0) setData(items);
      } catch { /* keep placeholder */ }
    })();
    return () => { cancelled = true; };
  }, []);

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
