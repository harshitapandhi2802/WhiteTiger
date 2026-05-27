"use client";
import { useMemo } from "react";
import { useStockPrices, useCryptoPrices, useForexRates } from "@/hooks/useMarketData";
import { COLORS } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   LIVE MARKET TICKER — Horizontal scrolling price strip
   Shows NIFTY, SENSEX, top stocks, BTC, Gold, USD/INR
   Continuously animated horizontal scroll.
   ═══════════════════════════════════════════════════════════════ */

interface TickerItem {
  label: string;
  price: string;
  change: number;
  emoji?: string;
}

export default function BeginnerMarketTicker() {
  const { data: stocks } = useStockPrices();
  const { data: crypto } = useCryptoPrices();
  const { data: forex } = useForexRates();

  const items: TickerItem[] = useMemo(() => {
    const list: TickerItem[] = [];

    // Indices
    if (stocks.NIFTY50?.price) list.push({ label: "NIFTY 50", price: stocks.NIFTY50.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }), change: stocks.NIFTY50.changePercent || 0 });
    if (stocks.SENSEX?.price) list.push({ label: "SENSEX", price: stocks.SENSEX.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }), change: stocks.SENSEX.changePercent || 0 });
    if (stocks.BANKNIFTY?.price) list.push({ label: "BANK NIFTY", price: stocks.BANKNIFTY.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }), change: stocks.BANKNIFTY.changePercent || 0 });

    // Top stocks
    const topStocks = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN"];
    for (const sym of topStocks) {
      const s = stocks[sym];
      if (s?.price) list.push({ label: sym, price: `${s.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, change: s.changePercent || 0 });
    }

    // Crypto
    if (crypto.BTC?.inr) list.push({ label: "BTC", price: `${(crypto.BTC.inr / 100000).toFixed(1)}L`, change: crypto.BTC.change24h || 0, emoji: "₿" });
    if (crypto.ETH?.inr) list.push({ label: "ETH", price: `${(crypto.ETH.inr / 1000).toFixed(1)}K`, change: crypto.ETH.change24h || 0 });

    // Forex
    if (forex.USDINR?.rate) list.push({ label: "USD/INR", price: forex.USDINR.rate.toFixed(2), change: forex.USDINR.change24h || 0 });

    // Fallback if no live data
    if (list.length === 0) {
      return [
        { label: "NIFTY 50", price: "23,655", change: -0.02 },
        { label: "SENSEX", price: "75,183", change: -0.18 },
        { label: "RELIANCE", price: "1,350", change: -0.74 },
        { label: "TCS", price: "2,327", change: -0.01 },
        { label: "BTC", price: "77.5L", change: 0.35, emoji: "₿" },
        { label: "USD/INR", price: "96.20", change: -0.39 },
      ];
    }
    return list;
  }, [stocks, crypto, forex]);

  // Double the items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div style={{
      width: "100%", overflow: "hidden",
      background: COLORS.bgWhite,
      borderBottom: `1px solid ${COLORS.cardBorder}`,
      padding: "8px 0",
    }}>
      <div className="ticker-scroll" style={{
        display: "flex", gap: 24, whiteSpace: "nowrap",
        animation: "tickerScroll 35s linear infinite",
        width: "max-content",
      }}>
        {doubled.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {item.emoji && <span style={{ fontSize: "0.75rem" }}>{item.emoji}</span>}
            <span style={{ fontSize: "0.68rem", fontWeight: 600, color: COLORS.textMuted }}>{item.label}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.textPrimary }}>{item.price}</span>
            <span style={{
              fontSize: "0.62rem", fontWeight: 700,
              color: item.change >= 0 ? COLORS.green : COLORS.red,
            }}>
              {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
            </span>
            <span style={{ color: COLORS.divider, fontSize: "0.6rem" }}>|</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketTickerStyles() {
  return (
    <style>{`
      @keyframes tickerScroll {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      .ticker-scroll:hover {
        animation-play-state: paused;
      }
    `}</style>
  );
}
