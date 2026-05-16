"use client";
import { useMemo, useState, useEffect, useRef } from "react";

/* ── Deterministic SVG Sparkline ── */
export function MiniSparkline({
  seed,
  positive = true,
  color,
  width = 80,
  height = 32,
}: {
  seed: string;
  positive?: boolean;
  color?: string;
  width?: number;
  height?: number;
}) {
  const strokeColor = color || (positive ? "#00c853" : "#f44336");

  const d = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h) + seed.charCodeAt(i);
      h |= 0;
    }
    const pts: number[] = [];
    let v = 50;
    for (let i = 0; i < 20; i++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      v += (h % 13) - 6;
      v = Math.max(8, Math.min(92, v));
      pts.push(v);
    }
    if (positive && pts[19] < pts[0]) pts.reverse();
    if (!positive && pts[19] > pts[0]) pts.reverse();

    const mn = Math.min(...pts),
      mx = Math.max(...pts),
      rng = mx - mn || 1;
    return pts
      .map((p, i) => {
        const x = (i / 19) * width;
        const y = height - 2 - ((p - mn) / rng) * (height - 4);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [seed, positive, width, height]);

  const fillPath = `${d} L${width},${height} L0,${height} Z`;
  const safeId = seed.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${safeId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sg-${safeId})`} />
      <path d={d} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── TradingView Chart for analysis results ── */
export function TradingViewChart({
  symbol,
  type,
}: {
  symbol: string;
  type: "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international" | "derivatives" | "realestate" | "wealth" | "tax";
}) {
  const tvSymbol = useMemo(() => {
    if (type === "international") return symbol;
    if (type === "stocks") return `NSE:${symbol.replace(".NS", "")}`;
    if (type === "crypto") {
      const cryptoMap: Record<string, string> = {
        BTC: "BINANCE:BTCUSDT", ETH: "BINANCE:ETHUSDT", SOL: "BINANCE:SOLUSDT",
        BNB: "BINANCE:BNBUSDT", XRP: "BINANCE:XRPUSDT", ADA: "BINANCE:ADAUSDT",
        DOGE: "BINANCE:DOGEUSDT", DOT: "BINANCE:DOTUSDT", MATIC: "BINANCE:MATICUSDT",
        AVAX: "BINANCE:AVAXUSDT", LINK: "BINANCE:LINKUSDT", UNI: "BINANCE:UNIUSDT",
        SHIB: "BINANCE:SHIBUSDT", PEPE: "BINANCE:PEPEUSDT", ARB: "BINANCE:ARBUSDT",
        OP: "BINANCE:OPUSDT", SUI: "BINANCE:SUIUSDT", NEAR: "BINANCE:NEARUSDT",
        INJ: "BINANCE:INJUSDT", ATOM: "BINANCE:ATOMUSDT",
      };
      return cryptoMap[symbol] || `BINANCE:${symbol}USDT`;
    }
    if (type === "currency") {
      const fxMap: Record<string, string> = {
        USDINR: "FX_IDC:USDINR", EURINR: "FX_IDC:EURINR", GBPINR: "FX_IDC:GBPINR",
        JPYINR: "FX_IDC:JPYINR", EURUSD: "FX:EURUSD", GBPUSD: "FX:GBPUSD",
        USDJPY: "FX:USDJPY", AUDINR: "FX_IDC:AUDINR", CADINR: "FX_IDC:CADINR",
        SGDINR: "FX_IDC:SGDINR", DXY: "TVC:DXY",
      };
      return fxMap[symbol] || `FX_IDC:${symbol}`;
    }
    if (type === "commodities") {
      const commMap: Record<string, string> = {
        GOLD: "MCX:GOLD1!", SILVER: "MCX:SILVER1!", CRUDEOIL: "MCX:CRUDEOIL1!",
        NATURALGAS: "MCX:NATURALGAS1!", COPPER: "MCX:COPPER1!",
        ALUMINIUM: "MCX:ALUMINIUM1!", ZINC: "MCX:ZINC1!", LEAD: "MCX:LEAD1!",
        NICKEL: "MCX:NICKEL1!", COTTON: "MCX:COTTON1!",
        BRENTCRUDEOIL: "NYMEX:BB1!", NYMEXCRUDE: "NYMEX:CL1!",
        PLATINUM: "COMEX:PL1!", PALLADIUM: "COMEX:PA1!",
      };
      return commMap[symbol] || `TVC:${symbol}`;
    }
    return null;
  }, [symbol, type]);

  if (!tvSymbol) return null;

  const url = `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${encodeURIComponent(tvSymbol)}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f7f8fa&theme=light&style=2&timezone=Asia%2FKolkata&withdateranges=1&showFloatingTooltip=1&locale=en`;

  return (
    <div className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="dashboard-card-title" style={{ margin: 0 }}>Live Chart — {symbol}</div>
        <span className="badge badge-purple" style={{ fontSize: "0.6rem" }}>TradingView</span>
      </div>
      <iframe
        src={url}
        style={{ width: "100%", height: 420, border: "none", display: "block", marginTop: 4 }}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}

/* ── Market Ticker Banner (static section) ── */
export function MarketTicker({
  items,
}: {
  items: { label: string; value: string; change?: number }[];
}) {
  if (items.length === 0) return null;
  return (
    <div style={{
      display: "flex",
      gap: 0,
      overflow: "hidden",
      background: "#1a1d29",
      borderRadius: 10,
      marginBottom: 20,
      padding: "0 4px",
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          flex: 1,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          borderRight: i < items.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}>
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{item.label}</span>
          <span style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 700 }}>{item.value}</span>
          {item.change != null && (
            <span style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: item.change >= 0 ? "#00e676" : "#ff5252",
              background: item.change >= 0 ? "rgba(0,230,118,0.12)" : "rgba(255,82,82,0.12)",
              padding: "2px 6px",
              borderRadius: 4,
            }}>
              {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Scrolling Ticker (CNBC-style infinite scroll) ── */
export function ScrollingTicker({
  items,
}: {
  items: { name: string; price: string; change: number; symbol: string }[];
}) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <div key={`${item.symbol}-${i}`} className="ticker-item">
            <span style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{item.name}</span>
            <span style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{item.price}</span>
            <span style={{
              fontSize: "0.72rem", fontWeight: 700,
              color: item.change >= 0 ? "#00e676" : "#ff5252",
              display: "flex", alignItems: "center", gap: 2,
            }}>
              {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Market Pulse Bar — scrolling intelligence headlines like CNBC lower-third ──
   Replaces the old TradingView ticker tape which was redundant with the top ScrollingTicker.
   Shows: tab-relevant key macro context + live intelligence headlines
*/

const PULSE_CONTEXT: Record<string, { icon: string; label: string; items: string[] }> = {
  stocks: { icon: "📊", label: "EQUITY PULSE", items: [
    "FII/DII flows drive near-term NIFTY direction — watch institutional activity closely",
    "India VIX below 14 signals low volatility regime — favorable for bulls",
    "Advance-Decline ratio key to confirming broad market participation",
    "Banking sector weight at 35% of NIFTY — HDFC Bank, ICICI Bank lead moves",
    "Q4 earnings season underway — IT sector margins under scrutiny",
    "RBI policy stance remains data-dependent — next MPC meeting critical",
  ]},
  commodities: { icon: "🛢️", label: "COMMODITY PULSE", items: [
    "OPEC+ production cuts support crude oil above $80/bbl through H2",
    "Central bank gold buying at record pace — China and India lead demand",
    "Silver outperforms gold on solar panel industrial demand surge",
    "Natural gas volatility rises on seasonal weather pattern shifts",
    "Copper supply tightening — Chilean mine disruptions add upward pressure",
    "MCX volumes up 22% YoY reflecting growing institutional participation",
  ]},
  crypto: { icon: "₿", label: "CRYPTO PULSE", items: [
    "Bitcoin ETF daily inflows averaging $200M — institutional accumulation phase",
    "Ethereum L2 ecosystem processing 15M daily transactions across Arbitrum and Base",
    "BTC dominance at 54% — altcoin season signals emerging below 50%",
    "India crypto TDS collections up 60% YoY — retail participation growing",
    "Post-halving supply shock historically takes 12-18 months for full price impact",
    "On-chain data shows exchange balances at 5-year lows — bullish signal",
  ]},
  currency: { icon: "💱", label: "FOREX PULSE", items: [
    "RBI actively managing USD/INR in 83-84 range — forex reserves at $645B",
    "DXY trajectory key for EM currencies — Fed rate path drives direction",
    "Carry trade positions in JPY pairs at $18B — unwind risk elevated",
    "EUR/USD range-bound as ECB vs Fed policy divergence narrows",
    "Forward premiums declining — reduced hedging demand from importers",
    "Capital account flows turning positive — NRI deposits and FDI improving",
  ]},
  mutualfunds: { icon: "📈", label: "MF PULSE", items: [
    "Monthly SIP flows crossed ₹20,000 crore — 8.5 crore active accounts",
    "Only 35% of large-cap active funds beat NIFTY 50 over 3 years",
    "Passive fund AUM grows 45% YoY — index investing gaining traction",
    "SEBI mandates stress testing for small-cap and mid-cap schemes",
    "Multi-asset allocation funds deliver 14-18% YTD — top performer category",
    "Debt fund inflows surge as credit spreads compress to 5-year lows",
  ]},
  debt: { icon: "🏦", label: "FIXED INCOME PULSE", items: [
    "India 10Y G-Sec at 7.05% — JP Morgan index inclusion driving FPI flows",
    "RBI OMO purchases inject liquidity amid tightening system conditions",
    "AAA corporate bond spreads at 35bps over G-Sec — lowest since 2019",
    "US 10Y at 4.35% — September rate cut probability at 65%",
    "SDL auctions see strong 2.5x bid-to-cover — state borrowing on track",
    "Duration strategy favored as rate cut cycle approaches",
  ]},
  international: { icon: "🌍", label: "GLOBAL PULSE", items: [
    "S&P 500 at record highs — AI sector driving 60% of YTD gains",
    "China stimulus package worth $42B boosts Hang Seng 8% in May",
    "ECB signals June rate cut — DAX at all-time high near 18,900",
    "Japan Nikkei corrects on yen intervention fears — BOJ policy key",
    "Global fund managers' EM allocation at 18-month high — India tops",
    "US-China tech export tensions create semiconductor supply uncertainty",
  ]},
};

export function MarketPulseBar({
  tab,
}: {
  tab: "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international";
}) {
  const ctx = PULSE_CONTEXT[tab] || PULSE_CONTEXT.stocks;
  const [headlines, setHeadlines] = useState<string[]>(ctx.items);
  const fetchedTab = useRef("");

  // Try to fetch live intelligence headlines
  useEffect(() => {
    if (fetchedTab.current === tab) return;
    fetchedTab.current = tab;
    fetch(`/api/intelligence?tab=${tab}`)
      .then(r => r.json())
      .then(d => {
        if (d.articles?.length) {
          setHeadlines(d.articles.map((a: { category: string; headline: string }) =>
            `[${a.category}] ${a.headline}`
          ));
        }
      })
      .catch(() => { /* keep fallback */ });
  }, [tab]);

  const doubled = [...headlines, ...headlines];

  return (
    <div style={{
      background: "linear-gradient(90deg, #1a1d29, #0f1923)",
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 16,
      position: "relative",
    }}>
      {/* Label badge */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 2,
        display: "flex", alignItems: "center",
        background: "linear-gradient(90deg, #1a1d29 80%, transparent)",
        paddingLeft: 14, paddingRight: 20,
      }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 800, color: "#fff",
          background: "linear-gradient(135deg, #2962ff, #448aff)",
          padding: "4px 10px", borderRadius: 5,
          letterSpacing: 0.8, whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          {ctx.icon} {ctx.label}
        </span>
      </div>
      {/* Scrolling headlines */}
      <div style={{ overflow: "hidden", padding: "10px 0", marginLeft: 160 }}>
        <div style={{
          display: "flex", gap: 0,
          animation: "pulseScroll 60s linear infinite",
          whiteSpace: "nowrap",
        }}>
          {doubled.map((h, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              paddingRight: 40, flexShrink: 0,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: i % 3 === 0 ? "#00e676" : i % 3 === 1 ? "#ffab00" : "#448aff",
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: "0.76rem", color: "rgba(255,255,255,0.85)",
                fontWeight: 500, letterSpacing: 0.2,
              }}>
                {h}
              </span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulseScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/* ── Live Chart Grid — grid of TradingView iframe charts ──
   IMPORTANT: Only use symbols verified to work in free TradingView widgetembed.
   NSE: individual stocks & indices DO NOT work (premium only).
   Verified working: BSE:SENSEX, TVC:GOLD, TVC:SILVER, TVC:USOIL, TVC:UKOIL, OANDA:*, BINANCE:*, FX:*, FX_IDC:*
   Note: CAPITALCOM:NIFTY50 is BROKEN — use BSE:SENSEX instead for Indian market index.
*/
const CHART_SETS: Record<string, { symbol: string; label: string }[]> = {
  stocks: [
    { symbol: "BSE:SENSEX", label: "SENSEX" },
    { symbol: "FX_IDC:USDINR", label: "USD/INR" },
    { symbol: "TVC:GOLD", label: "Gold" },
    { symbol: "OANDA:SPX500USD", label: "S&P 500" },
  ],
  commodities: [
    { symbol: "TVC:GOLD", label: "Gold" },
    { symbol: "TVC:SILVER", label: "Silver" },
    { symbol: "TVC:USOIL", label: "Crude Oil (WTI)" },
    { symbol: "TVC:UKOIL", label: "Brent Crude" },
  ],
  crypto: [
    { symbol: "BINANCE:BTCUSDT", label: "Bitcoin" },
    { symbol: "BINANCE:ETHUSDT", label: "Ethereum" },
    { symbol: "BINANCE:SOLUSDT", label: "Solana" },
    { symbol: "BINANCE:XRPUSDT", label: "XRP" },
  ],
  currency: [
    { symbol: "FX_IDC:USDINR", label: "USD/INR" },
    { symbol: "FX_IDC:EURINR", label: "EUR/INR" },
    { symbol: "FX:EURUSD", label: "EUR/USD" },
    { symbol: "FX:GBPUSD", label: "GBP/USD" },
  ],
  mutualfunds: [
    { symbol: "BSE:SENSEX", label: "SENSEX" },
    { symbol: "TVC:GOLD", label: "Gold" },
    { symbol: "FX_IDC:USDINR", label: "USD/INR" },
    { symbol: "OANDA:SPX500USD", label: "S&P 500" },
  ],
  debt: [
    { symbol: "TVC:GOLD", label: "Gold" },
    { symbol: "BSE:SENSEX", label: "SENSEX" },
    { symbol: "FX_IDC:USDINR", label: "USD/INR" },
    { symbol: "FX:EURUSD", label: "EUR/USD" },
  ],
  international: [
    { symbol: "OANDA:SPX500USD", label: "S&P 500" },
    { symbol: "OANDA:NAS100USD", label: "NASDAQ 100" },
    { symbol: "OANDA:UK100GBP", label: "FTSE 100" },
    { symbol: "OANDA:JP225USD", label: "Nikkei 225" },
  ],
};

export function LiveChartGrid({
  tab,
}: {
  tab: "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international";
}) {
  const charts = CHART_SETS[tab] || CHART_SETS.stocks;
  const [fullscreenChart, setFullscreenChart] = useState<{ symbol: string; label: string } | null>(null);

  return (
    <>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 16,
        marginBottom: 24,
      }}>
        {charts.map(c => {
          const url = `https://s.tradingview.com/widgetembed/?frameElementId=tv_${encodeURIComponent(c.symbol)}&symbol=${encodeURIComponent(c.symbol)}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f7f8fa&theme=light&style=2&timezone=Asia%2FKolkata&withdateranges=1&showFloatingTooltip=1&locale=en`;
          return (
            <div key={c.symbol} style={{
              borderRadius: 14, overflow: "hidden",
              border: "1px solid var(--border)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              background: "#fff",
              transition: "box-shadow 0.2s, transform 0.2s",
              cursor: "pointer",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
            >
              <div style={{
                padding: "10px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: "1px solid var(--border)",
                background: "linear-gradient(135deg, #fafbfc, #f5f6f8)",
              }}>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{c.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "#10b981", background: "rgba(16,185,129,0.08)", padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "livePulse 2s ease infinite" }} /> LIVE
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setFullscreenChart(c); }} style={{
                    background: "none", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer",
                    padding: "2px 6px", fontSize: "0.6rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3,
                  }} title="Expand chart">
                    ⛶ Expand
                  </button>
                </div>
              </div>
              <iframe
                src={url}
                style={{ width: "100%", height: 340, border: "none", display: "block" }}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          );
        })}
      </div>

      {/* ── Fullscreen Chart Modal ── */}
      {fullscreenChart && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)", display: "flex", flexDirection: "column",
          animation: "fadeInModal 0.25s ease",
        }} onClick={() => setFullscreenChart(null)}>
          <div style={{
            background: "#fff", margin: 20, borderRadius: 16, overflow: "hidden",
            flex: 1, display: "flex", flexDirection: "column",
            boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, #fafbfc, #f5f6f8)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>{fullscreenChart.label}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#10b981", background: "rgba(16,185,129,0.08)", padding: "3px 10px", borderRadius: 5 }}>LIVE</span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{fullscreenChart.symbol}</span>
              </div>
              <button onClick={() => setFullscreenChart(null)} style={{
                background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px",
                cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4,
              }}>
                ✕ Close
              </button>
            </div>
            {/* Full Chart */}
            <iframe
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_fs_${encodeURIComponent(fullscreenChart.symbol)}&symbol=${encodeURIComponent(fullscreenChart.symbol)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f7f8fa&theme=light&style=1&timezone=Asia%2FKolkata&withdateranges=1&showFloatingTooltip=1&locale=en&studies=MASimple%407%7CMASimple%4025%7CRSI%407&allow_symbol_change=1`}
              style={{ width: "100%", flex: 1, border: "none", display: "block", minHeight: 500 }}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
