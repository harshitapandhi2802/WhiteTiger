"use client";
// Live cross-asset ticker values, pulled from the same endpoints the app uses
// (/api/live-prices, /api/live-yields). Returns null until a feed responds, so
// callers show a "—" placeholder instead of hard-coded prices.

import { useEffect, useState } from "react";

export interface TickerItem { sym: string; val: string; chg: string; up: boolean; }

function fmt(n: number, prefix = "") { return prefix + n.toLocaleString("en-IN", { maximumFractionDigits: 2 }); }
function pct(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`; }

export function useLiveTicker(): TickerItem[] | null {
  const [data, setData] = useState<TickerItem[] | null>(null);

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

  return data;
}
