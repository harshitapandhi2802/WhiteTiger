"use client";
import { useMemo, useEffect, useRef } from "react";

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
  type: "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international";
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

/* ── TradingView Ticker Tape Widget (live real-time prices) ──
   IMPORTANT: Only use symbol codes verified to work in the ticker-tape widget.
   Many MCX:, TVC:, SP:, DJ:, INDEX: codes DON'T work and show red error icons.
   Verified working exchanges: NSE:, BSE:, BINANCE:, FX:, FX_IDC:, OANDA:, CAPITALCOM:, FOREXCOM:, CURRENCYCOM:
*/
const TV_SYMBOL_SETS: Record<string, { symbols: { proName: string; title: string }[] }> = {
  stocks: {
    symbols: [
      { proName: "NSE:NIFTY", title: "NIFTY 50" },
      { proName: "BSE:SENSEX", title: "SENSEX" },
      { proName: "NSE:BANKNIFTY", title: "BANK NIFTY" },
      { proName: "NSE:RELIANCE", title: "Reliance" },
      { proName: "NSE:TCS", title: "TCS" },
      { proName: "NSE:HDFCBANK", title: "HDFC Bank" },
      { proName: "NSE:INFY", title: "Infosys" },
      { proName: "NSE:ICICIBANK", title: "ICICI Bank" },
      { proName: "NSE:BHARTIARTL", title: "Airtel" },
      { proName: "NSE:SBIN", title: "SBI" },
      { proName: "NSE:ITC", title: "ITC" },
      { proName: "NSE:TATAMOTORS", title: "Tata Motors" },
      { proName: "FX_IDC:USDINR", title: "USD/INR" },
    ],
  },
  commodities: {
    symbols: [
      { proName: "OANDA:XAUUSD", title: "Gold" },
      { proName: "OANDA:XAGUSD", title: "Silver" },
      { proName: "OANDA:WTICOUSD", title: "Crude Oil (WTI)" },
      { proName: "OANDA:BCOUSD", title: "Brent Crude" },
      { proName: "OANDA:NATGASUSD", title: "Natural Gas" },
      { proName: "OANDA:XCUUSD", title: "Copper" },
      { proName: "OANDA:XPTUSD", title: "Platinum" },
      { proName: "OANDA:XPDUSD", title: "Palladium" },
      { proName: "OANDA:WHEATUSD", title: "Wheat" },
      { proName: "FX_IDC:USDINR", title: "USD/INR" },
    ],
  },
  crypto: {
    symbols: [
      { proName: "BINANCE:BTCUSDT", title: "Bitcoin" },
      { proName: "BINANCE:ETHUSDT", title: "Ethereum" },
      { proName: "BINANCE:SOLUSDT", title: "Solana" },
      { proName: "BINANCE:BNBUSDT", title: "BNB" },
      { proName: "BINANCE:XRPUSDT", title: "XRP" },
      { proName: "BINANCE:DOGEUSDT", title: "Dogecoin" },
      { proName: "BINANCE:ADAUSDT", title: "Cardano" },
      { proName: "BINANCE:AVAXUSDT", title: "Avalanche" },
      { proName: "BINANCE:DOTUSDT", title: "Polkadot" },
      { proName: "BINANCE:SUIUSDT", title: "SUI" },
    ],
  },
  currency: {
    symbols: [
      { proName: "FX_IDC:USDINR", title: "USD/INR" },
      { proName: "FX_IDC:EURINR", title: "EUR/INR" },
      { proName: "FX_IDC:GBPINR", title: "GBP/INR" },
      { proName: "FX:EURUSD", title: "EUR/USD" },
      { proName: "FX:GBPUSD", title: "GBP/USD" },
      { proName: "FX:USDJPY", title: "USD/JPY" },
      { proName: "FX:AUDUSD", title: "AUD/USD" },
      { proName: "FX:USDCHF", title: "USD/CHF" },
    ],
  },
  mutualfunds: {
    symbols: [
      { proName: "NSE:NIFTY", title: "NIFTY 50" },
      { proName: "BSE:SENSEX", title: "SENSEX" },
      { proName: "NSE:BANKNIFTY", title: "BANK NIFTY" },
      { proName: "OANDA:XAUUSD", title: "Gold" },
      { proName: "FX_IDC:USDINR", title: "USD/INR" },
      { proName: "NSE:RELIANCE", title: "Reliance" },
      { proName: "NSE:TCS", title: "TCS" },
      { proName: "NSE:HDFCBANK", title: "HDFC Bank" },
    ],
  },
  debt: {
    symbols: [
      { proName: "CAPITALCOM:US10Y", title: "US 10Y Yield" },
      { proName: "CAPITALCOM:US02Y", title: "US 2Y Yield" },
      { proName: "OANDA:XAUUSD", title: "Gold" },
      { proName: "NSE:NIFTY", title: "NIFTY 50" },
      { proName: "BSE:SENSEX", title: "SENSEX" },
      { proName: "FX_IDC:USDINR", title: "USD/INR" },
      { proName: "FX:EURUSD", title: "EUR/USD" },
    ],
  },
  international: {
    symbols: [
      { proName: "OANDA:SPX500USD", title: "S&P 500" },
      { proName: "OANDA:NAS100USD", title: "NASDAQ 100" },
      { proName: "OANDA:UK100GBP", title: "FTSE 100" },
      { proName: "OANDA:DE30EUR", title: "DAX 30" },
      { proName: "OANDA:JP225USD", title: "Nikkei 225" },
      { proName: "OANDA:HK33HKD", title: "Hang Seng" },
      { proName: "OANDA:AU200AUD", title: "ASX 200" },
      { proName: "NSE:NIFTY", title: "NIFTY 50" },
      { proName: "FX_IDC:USDINR", title: "USD/INR" },
      { proName: "FX:EURUSD", title: "EUR/USD" },
    ],
  },
};

export function TradingViewTickerTape({
  tab,
}: {
  tab: "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<string>("");

  useEffect(() => {
    if (!containerRef.current || loadedRef.current === tab) return;
    loadedRef.current = tab;
    containerRef.current.innerHTML = "";

    const symbols = TV_SYMBOL_SETS[tab]?.symbols || TV_SYMBOL_SETS.stocks.symbols;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    script.textContent = JSON.stringify({
      symbols,
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    wrapper.appendChild(inner);
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);
  }, [tab]);

  return (
    <div
      ref={containerRef}
      style={{
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 16,
      }}
    />
  );
}

/* ── Live Chart Grid — grid of TradingView iframe charts that ACTUALLY work ── */
const CHART_SETS: Record<string, { symbol: string; label: string }[]> = {
  stocks: [
    { symbol: "NSE:NIFTY", label: "NIFTY 50" },
    { symbol: "BSE:SENSEX", label: "SENSEX" },
    { symbol: "NSE:BANKNIFTY", label: "BANK NIFTY" },
    { symbol: "NSE:RELIANCE", label: "Reliance" },
    { symbol: "NSE:TCS", label: "TCS" },
    { symbol: "NSE:HDFCBANK", label: "HDFC Bank" },
  ],
  commodities: [
    { symbol: "TVC:GOLD", label: "Gold" },
    { symbol: "TVC:SILVER", label: "Silver" },
    { symbol: "TVC:USOIL", label: "Crude Oil" },
    { symbol: "TVC:UKOIL", label: "Brent Crude" },
    { symbol: "NYMEX:NG1!", label: "Natural Gas" },
    { symbol: "COMEX:HG1!", label: "Copper" },
  ],
  crypto: [
    { symbol: "BINANCE:BTCUSDT", label: "Bitcoin" },
    { symbol: "BINANCE:ETHUSDT", label: "Ethereum" },
    { symbol: "BINANCE:SOLUSDT", label: "Solana" },
    { symbol: "BINANCE:BNBUSDT", label: "BNB" },
    { symbol: "BINANCE:XRPUSDT", label: "XRP" },
    { symbol: "BINANCE:DOGEUSDT", label: "Dogecoin" },
  ],
  currency: [
    { symbol: "FX_IDC:USDINR", label: "USD/INR" },
    { symbol: "FX_IDC:EURINR", label: "EUR/INR" },
    { symbol: "FX_IDC:GBPINR", label: "GBP/INR" },
    { symbol: "FX:EURUSD", label: "EUR/USD" },
    { symbol: "FX:GBPUSD", label: "GBP/USD" },
    { symbol: "FX:USDJPY", label: "USD/JPY" },
  ],
  mutualfunds: [
    { symbol: "NSE:NIFTY", label: "NIFTY 50" },
    { symbol: "BSE:SENSEX", label: "SENSEX" },
    { symbol: "NSE:BANKNIFTY", label: "BANK NIFTY" },
    { symbol: "TVC:GOLD", label: "Gold" },
    { symbol: "FX_IDC:USDINR", label: "USD/INR" },
    { symbol: "CBOE:TNX", label: "US 10Y Yield" },
  ],
  debt: [
    { symbol: "CBOE:TNX", label: "US 10Y Yield" },
    { symbol: "CBOE:IRX", label: "US 13W Yield" },
    { symbol: "TVC:GOLD", label: "Gold" },
    { symbol: "NSE:NIFTY", label: "NIFTY 50" },
    { symbol: "FX_IDC:USDINR", label: "USD/INR" },
    { symbol: "BSE:SENSEX", label: "SENSEX" },
  ],
  international: [
    { symbol: "OANDA:SPX500USD", label: "S&P 500" },
    { symbol: "OANDA:NAS100USD", label: "NASDAQ 100" },
    { symbol: "XETR:DAX", label: "DAX" },
    { symbol: "TVC:NI225", label: "Nikkei 225" },
    { symbol: "TVC:HSI", label: "Hang Seng" },
    { symbol: "NSE:NIFTY", label: "NIFTY 50" },
  ],
};

export function LiveChartGrid({
  tab,
}: {
  tab: "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international";
}) {
  const charts = CHART_SETS[tab] || CHART_SETS.stocks;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
      gap: 12,
      marginBottom: 20,
    }}>
      {charts.map(c => {
        const url = `https://s.tradingview.com/widgetembed/?frameElementId=tv_${encodeURIComponent(c.symbol)}&symbol=${encodeURIComponent(c.symbol)}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f7f8fa&theme=light&style=2&timezone=Asia%2FKolkata&withdateranges=1&showFloatingTooltip=1&locale=en&hidevolume=1`;
        return (
          <div key={c.symbol} style={{
            borderRadius: 12, overflow: "hidden",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            background: "#fff",
          }}>
            <div style={{
              padding: "10px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid var(--border)",
              background: "linear-gradient(135deg, #fafbfc, #f5f6f8)",
            }}>
              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>{c.label}</span>
              <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)", background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: 4 }}>LIVE</span>
            </div>
            <iframe
              src={url}
              style={{ width: "100%", height: 260, border: "none", display: "block" }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        );
      })}
    </div>
  );
}
