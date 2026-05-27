"use client";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { COLORS } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   LEARN WHILE USING — TOOLTIP SYSTEM
   Click any highlighted term → see AI explanation.
   Works across all beginner tabs.
   ═══════════════════════════════════════════════════════════════ */

// ─── Knowledge Base ─────────────────────────────────────────────
const LEARN_ENTRIES: Record<string, { emoji: string; short: string; detail: string }> = {
  "Market Cap": {
    emoji: "📏",
    short: "Total value of a company on the stock market",
    detail: "Calculated as share price × total number of shares. Companies are classified as Large Cap (>₹20,000 Cr), Mid Cap (₹5,000–20,000 Cr), or Small Cap (<₹5,000 Cr).",
  },
  "P/E Ratio": {
    emoji: "🔍",
    short: "Is the stock cheap or expensive?",
    detail: "Price-to-Earnings ratio. If a stock has P/E of 20, it means you pay ₹20 for every ₹1 of profit. Lower P/E = potentially better value. NIFTY 50 average is around 20-22.",
  },
  "SIP": {
    emoji: "💰",
    short: "Invest a fixed amount every month automatically",
    detail: "Systematic Investment Plan. Like a monthly subscription to wealth building. You buy more units when prices are low and fewer when high — this is called Rupee Cost Averaging.",
  },
  "NAV": {
    emoji: "🏷️",
    short: "Price of one unit of a mutual fund",
    detail: "Net Asset Value changes daily based on how the fund's investments perform. When you invest in a MF, you buy units at the current NAV.",
  },
  "Inflation": {
    emoji: "📈",
    short: "Rising prices that reduce your money's value",
    detail: "If inflation is 6% and your savings earn 4%, you're actually losing 2% purchasing power. This is why investing is important — to beat inflation.",
  },
  "Dividend": {
    emoji: "🎁",
    short: "Company shares its profits with you",
    detail: "Some companies pay dividends regularly — like pocket money for owning the stock. Dividend yield tells you how much % of the stock price you get as dividends annually.",
  },
  "Bull Market": {
    emoji: "🐂",
    short: "Markets are rising — investors feel confident",
    detail: "Named after a bull charging upward with its horns. A bull market means stock prices have risen 20%+ from recent lows. India has been in a long-term bull market.",
  },
  "Bear Market": {
    emoji: "🐻",
    short: "Markets are falling — investors feel cautious",
    detail: "Named after a bear swiping downward. A bear market means prices have dropped 20%+ from recent highs. These are temporary and recover over time.",
  },
  "Volatility": {
    emoji: "🎢",
    short: "How much prices swing up and down",
    detail: "High volatility = big price swings (risky but potentially rewarding). Low volatility = stable prices (safer but slower growth). Crypto is very volatile, bonds are not.",
  },
  "Yield": {
    emoji: "🌾",
    short: "The return you earn from an investment",
    detail: "For bonds, yield is the interest rate you earn. For stocks, dividend yield is the annual dividend divided by stock price. Higher yield = more income.",
  },
  "Liquidity": {
    emoji: "💧",
    short: "How easily you can buy or sell something",
    detail: "Cash is the most liquid asset. Large-cap stocks are highly liquid (easy to sell). Real estate is illiquid (hard to sell quickly). Higher liquidity = lower risk.",
  },
  "CAGR": {
    emoji: "📊",
    short: "Average annual growth rate of your investment",
    detail: "Compound Annual Growth Rate. If you invested ₹1 lakh and it became ₹2 lakh in 5 years, the CAGR is about 14.9%. It smooths out the yearly ups and downs.",
  },
  "Rupee Cost Averaging": {
    emoji: "⚖️",
    short: "SIP automatically averages your buying price",
    detail: "When markets are down, your SIP buys more units. When up, it buys fewer. Over time, this averages out your cost and reduces the risk of bad timing.",
  },
  "Demat Account": {
    emoji: "🏦",
    short: "Digital locker for your stocks",
    detail: "Like a bank account stores money, a Demat account stores your shares electronically. You need one to buy/sell stocks in India. Zerodha, Groww, Upstox offer free ones.",
  },
  "SEBI": {
    emoji: "🛡️",
    short: "India's stock market regulator",
    detail: "Securities and Exchange Board of India protects investors and regulates exchanges, mutual funds, and brokers. Think of it as the referee of Indian markets.",
  },
  "Hedge": {
    emoji: "🛡️",
    short: "Protecting your investments from losses",
    detail: "Like insurance for your portfolio. If you own stocks, you might buy options to protect against a fall. Professionals hedge to reduce risk, not to make profit.",
  },
  "Options": {
    emoji: "📋",
    short: "Contract to buy/sell at a future date",
    detail: "An option gives you the RIGHT (not obligation) to buy or sell a stock at a set price before a deadline. Very risky for beginners — 90% of option traders lose money.",
  },
  "Futures": {
    emoji: "📅",
    short: "Agreement to buy/sell at a set future price",
    detail: "Unlike options, futures are OBLIGATIONS — you must buy/sell at the agreed price on the expiry date. Used by farmers to lock in crop prices and by traders to speculate.",
  },
  "Forex": {
    emoji: "💱",
    short: "Trading currencies like USD/INR",
    detail: "Foreign Exchange is the world's largest market. When you travel abroad or import goods, you deal with forex. The USD/INR rate affects everything from petrol to iPhone prices.",
  },
  "GST": {
    emoji: "🧾",
    short: "Tax on goods and services in India",
    detail: "Goods & Services Tax replaced many indirect taxes. Rates are 5%, 12%, 18%, or 28%. It's already included in prices you pay. Businesses collect and remit it to the government.",
  },
  "Capital Gains": {
    emoji: "💹",
    short: "Profit you make when selling an investment",
    detail: "Short-term (<1 year for stocks) gains are taxed at 15%. Long-term (>1 year) gains above ₹1 lakh are taxed at 10%. This applies to stocks, mutual funds, and property.",
  },
  "ETF": {
    emoji: "📦",
    short: "A basket of stocks you can trade like one stock",
    detail: "Exchange Traded Fund. Like a mutual fund but trades on the stock exchange in real-time. NIFTY 50 ETF gives you exposure to all 50 top companies in one purchase.",
  },
  "Blockchain": {
    emoji: "⛓️",
    short: "Digital ledger that records crypto transactions",
    detail: "A chain of blocks, each containing transaction data. It's decentralized (no single authority controls it) and transparent. Bitcoin and Ethereum run on different blockchains.",
  },
  "Rental Yield": {
    emoji: "🏠",
    short: "Annual rent income as % of property value",
    detail: "If a ₹50 lakh property earns ₹2 lakh rent/year, rental yield is 4%. In India, yields are typically 2-4%. Compare this to FD rates to evaluate property investments.",
  },
};

// ─── LearnTerm Component ────────────────────────────────────────
export function LearnTerm({ term, children }: { term: string; children?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);
  const entry = LEARN_ENTRIES[term];

  // Close on outside click
  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  if (!entry) return <span>{children || term}</span>;

  return (
    <span ref={ref} style={{ position: "relative", display: "inline" }}>
      <span
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        style={{
          color: COLORS.accent, fontWeight: 600, cursor: "pointer",
          borderBottom: `1px dashed ${COLORS.accent}`,
          transition: "opacity 0.2s",
        }}
      >
        {children || term}
      </span>
      {show && (
        <div style={{
          position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
          width: 280, marginBottom: 8, zIndex: 500,
          padding: "14px 16px", borderRadius: 14,
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
          animation: "tooltipFadeIn 0.2s ease-out",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: "1.1rem" }}>{entry.emoji}</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.textPrimary }}>{term}</span>
          </div>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, color: COLORS.accent, marginBottom: 6, lineHeight: 1.4 }}>
            {entry.short}
          </p>
          <p style={{ fontSize: "0.68rem", color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
            {entry.detail}
          </p>
          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: -6, left: "50%",
            width: 12, height: 12, background: "#ffffff",
            borderRight: "1px solid rgba(0,0,0,0.08)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            transform: "translateX(-50%) rotate(45deg)",
          }} />
        </div>
      )}
    </span>
  );
}

// ─── Tooltip Animation Styles (inject once) ─────────────────────
export function LearnTooltipStyles() {
  return (
    <style>{`
      @keyframes tooltipFadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(4px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `}</style>
  );
}
