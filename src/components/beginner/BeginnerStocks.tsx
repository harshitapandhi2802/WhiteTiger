"use client";
import { useState, useMemo, useCallback, useRef } from "react";
import { BEGINNER_STOCKS, PORTFOLIO_PRESETS, type BeginnerStock } from "@/app/beginner/data/stocks";
import { NSE_STOCKS, STOCK_SECTORS, MCAP_FILTERS, searchStocks, getStocksBySector, getStocksByMcap, type StockEntry } from "@/lib/stocks";
import { calculatePortfolioReturn } from "@/app/beginner/utils/calculations";
import { useStockPrices } from "@/hooks/useMarketData";
import { COLORS, card, SectionHeader, AIExplanation, RiskMeter, StatCard, Disclaimer, UpsellBanner, PillTabs } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER STOCKS TAB v5 — ALL 3000+ NSE STOCKS
   Full stock universe with search, sector/mcap filters,
   mini charts, fullscreen TradingView analysis, AI explanations.
   ═══════════════════════════════════════════════════════════════ */

/* ── Helper: extract clean symbol from ticker ──────────────────── */
function cleanSymbol(ticker: string) {
  return ticker.replace(".NS", "").replace(".BO", "");
}

/* ── Mini Sparkline Chart ──────────────────────────────────────── */
function MiniChart({ symbol, positive }: { symbol: string; positive: boolean }) {
  return (
    <div style={{ width: 100, height: 40, borderRadius: 8, overflow: "hidden", opacity: 0.85, flexShrink: 0 }}>
      <iframe
        src={`https://s.tradingview.com/embed-widget/mini-symbol-overview/?symbol=NSE:${symbol}&dateRange=1M&isTransparent=true&autosize=true&locale=en&trendLineColor=${encodeURIComponent(positive ? "#059669" : "#dc2626")}&underLineColor=${encodeURIComponent(positive ? "rgba(5,150,105,0.07)" : "rgba(220,38,38,0.07)")}&underLineBottomColor=${encodeURIComponent("rgba(0,0,0,0)")}`}
        style={{ width: 160, height: 80, border: "none", pointerEvents: "none", marginTop: -18, marginLeft: -28 }}
        loading="lazy"
        title={`${symbol} chart`}
      />
    </div>
  );
}

/* ── Fullscreen Stock Analysis Modal ──────────────────────────── */
function StockAnalysis({ stock, livePrice, liveChange, onClose }: {
  stock: BeginnerStock | { name: string; ticker: string; sector: string; sectorColor: string; tradingViewSymbol: string; description?: string; aiSummary?: string };
  livePrice: number;
  liveChange: number;
  onClose: () => void;
}) {
  const [timeframe, setTimeframe] = useState("1D");
  const timeframes = ["1H", "4H", "1D", "1W", "1M", "3M", "1Y"];
  const intervalMap: Record<string, string> = { "1H": "60", "4H": "240", "1D": "D", "1W": "W", "1M": "M", "3M": "M", "1Y": "M" };
  const rangeMap: Record<string, string> = { "1H": "1D", "4H": "5D", "1D": "3M", "1W": "6M", "1M": "12M", "3M": "36M", "1Y": "60M" };
  const isBeginner = "aiVerdict" in stock;
  const sColor = stock.sectorColor || COLORS.accent;

  const scoreEmoji = (s: "good" | "neutral" | "bad") => s === "good" ? "😊" : s === "neutral" ? "😐" : "😟";
  const scoreLabel = (s: "good" | "neutral" | "bad") => s === "good" ? "Strong" : s === "neutral" ? "Average" : "Needs Work";
  const scoreColor = (s: "good" | "neutral" | "bad") => s === "good" ? COLORS.accent : s === "neutral" ? COLORS.amber : COLORS.red;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "stretch", justifyContent: "center",
      padding: "12px",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 1200, borderRadius: 20,
        background: "#ffffff", overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "row",
        animation: "stockModalIn 0.3s ease-out",
      }}>
        {/* ── LEFT: Chart Area (75%) ── */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", borderRight: `1px solid ${COLORS.divider}` }}>
          <div style={{
            padding: "16px 24px", borderBottom: `1px solid ${COLORS.divider}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: `${sColor}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem", fontWeight: 800, color: sColor,
              }}>{stock.name[0]}</div>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: COLORS.textPrimary }}>{stock.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.68rem", color: COLORS.textDim }}>{stock.ticker}</span>
                  <span style={{ fontSize: "0.55rem", padding: "2px 8px", borderRadius: 6, background: `${sColor}15`, color: sColor, fontWeight: 600 }}>{stock.sector}</span>
                </div>
              </div>
              <div style={{ marginLeft: 12 }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: COLORS.textPrimary }}>
                  &#8377;{livePrice > 0 ? livePrice.toLocaleString("en-IN") : (isBeginner ? (stock as BeginnerStock).currentPrice.toLocaleString("en-IN") : "...")}
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: liveChange >= 0 ? COLORS.accent : COLORS.red }}>
                  {liveChange >= 0 ? "▲" : "▼"} {Math.abs(liveChange).toFixed(2)}%
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.bg, border: "none", cursor: "pointer", fontSize: "1.1rem", color: COLORS.textDim }}>&#10005;</button>
          </div>

          <div style={{ padding: "10px 24px", display: "flex", gap: 6, borderBottom: `1px solid ${COLORS.dividerLight}` }}>
            {timeframes.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid",
                borderColor: timeframe === tf ? sColor : COLORS.cardBorder,
                background: timeframe === tf ? `${sColor}10` : "transparent",
                color: timeframe === tf ? sColor : COLORS.textMuted,
                fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
              }}>{tf}</button>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <iframe
              key={`${stock.tradingViewSymbol}-${timeframe}`}
              src={`https://s.tradingview.com/widgetembed/?symbol=${stock.tradingViewSymbol}&interval=${intervalMap[timeframe] || "D"}&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=ffffff&studies=MASimple%7B20%7D&theme=light&style=1&timezone=Asia%2FKolkata&withdateranges=1&showpopupbutton=0&locale=en&range=${rangeMap[timeframe] || "3M"}`}
              style={{ width: "100%", height: "100%", border: "none" }}
              loading="eager"
              title={`${stock.name} chart`}
            />
          </div>
        </div>

        {/* ── RIGHT: AI Analysis (25%) ── */}
        <div style={{
          flex: 1, minWidth: 280, maxWidth: 360, overflowY: "auto", padding: "20px",
          display: "flex", flexDirection: "column", gap: 16, background: COLORS.bg,
        }}>
          {isBeginner && (stock as BeginnerStock).description && (
            <div>
              <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>What does this company do?</h3>
              <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.65, margin: 0, padding: "12px 14px", borderRadius: 12, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
                {(stock as BeginnerStock).description}
              </p>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {isBeginner ? "Why is this stock moving?" : "AI Analysis"}
            </h3>
            <AIExplanation emoji="🤖" text={
              isBeginner ? (stock as BeginnerStock).aiSummary :
              `${stock.name} is a ${stock.sector} company listed on NSE. ${liveChange >= 0 ? "The stock is trading higher today — this could be driven by positive sector sentiment or company-specific news." : "The stock is trading lower today. This could be due to broader market weakness or profit-booking."} Always research thoroughly before investing.`
            } />
          </div>

          {isBeginner && (
            <div>
              <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Health Check</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {([
                  ["Company", (stock as BeginnerStock).healthScores.companyHealth],
                  ["Growth", (stock as BeginnerStock).healthScores.growthPotential],
                  ["Safety", (stock as BeginnerStock).healthScores.riskLevel],
                  ["Dividend", (stock as BeginnerStock).healthScores.dividendPayout],
                  ["Experts", (stock as BeginnerStock).healthScores.expertOpinion],
                ] as [string, "good" | "neutral" | "bad"][]).map(([label, score]) => (
                  <div key={label} style={{ padding: "10px 12px", borderRadius: 10, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1.2rem" }}>{scoreEmoji(score)}</span>
                    <div>
                      <div style={{ fontSize: "0.55rem", color: COLORS.textDim, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: scoreColor(score) }}>{scoreLabel(score)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <StatCard label="Price" value={`₹${livePrice > 0 ? livePrice.toLocaleString("en-IN") : "..."}`} />
            <StatCard label="Change" value={`${liveChange >= 0 ? "+" : ""}${liveChange.toFixed(2)}%`} color={liveChange >= 0 ? COLORS.accent : COLORS.red} />
          </div>

          {isBeginner && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <StatCard label="1Y Return" value={`${(stock as BeginnerStock).oneYearReturn >= 0 ? "+" : ""}${(stock as BeginnerStock).oneYearReturn}%`} color={(stock as BeginnerStock).oneYearReturn >= 0 ? COLORS.accent : COLORS.red} />
                <StatCard label="3Y Return" value={`${(stock as BeginnerStock).threeYearReturn >= 0 ? "+" : ""}${(stock as BeginnerStock).threeYearReturn}%`} color={(stock as BeginnerStock).threeYearReturn >= 0 ? COLORS.accent : COLORS.red} />
              </div>
              <div>
                <h3 style={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Financials</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { q: "Revenue", a: `₹${(stock as BeginnerStock).revenue}` },
                    { q: "Profit", a: `₹${(stock as BeginnerStock).profit}` },
                    { q: "P/E Ratio", a: `${(stock as BeginnerStock).peRatio} — ${(stock as BeginnerStock).peVerdict}` },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
                      <div style={{ fontSize: "0.55rem", color: COLORS.textDim, fontWeight: 600, marginBottom: 2 }}>{item.q}</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>{item.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isBeginner && (
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "#ffffff", border: `1px solid ${COLORS.cardBorder}` }}>
              <div style={{ fontSize: "0.62rem", color: COLORS.textDim, fontWeight: 600, marginBottom: 8 }}>RISK LEVEL</div>
              <RiskMeter level={(stock as BeginnerStock).aiVerdict === "good" ? "low" : (stock as BeginnerStock).aiVerdict === "watch" ? "medium" : "high"} />
            </div>
          )}

          <div style={{
            padding: "14px 16px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(251,191,36,0.02))",
            border: "1px solid rgba(245,158,11,0.12)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: "0.85rem" }}>&#128161;</span>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, color: COLORS.amber, textTransform: "uppercase" }}>What This Means For You</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.65, margin: 0 }}>
              {isBeginner
                ? (stock as BeginnerStock).verdictText
                : `${stock.name} is in the ${stock.sector} sector. ${liveChange >= 0 ? "The stock is moving up — if you own it, your investment is growing today." : "The stock is down — short-term dips are normal. Long-term investors usually recover."} Always diversify and never put all your money in one stock.`
              }
            </p>
          </div>
          <Disclaimer text="AI-generated insight. Not investment advice." />
        </div>
      </div>

      <style>{`
        @keyframes stockModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function BeginnerStocks() {
  const { data: liveStocks } = useStockPrices();
  const [selectedStock, setSelectedStock] = useState<{ stock: BeginnerStock | { name: string; ticker: string; sector: string; sectorColor: string; tradingViewSymbol: string }; price: number; change: number } | null>(null);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [portfolioPreset, setPortfolioPreset] = useState<"conservative" | "balanced" | "growth">("balanced");

  // ── All stocks search + browse ──
  const [searchQuery, setSearchQuery] = useState("");
  const [allStocksSector, setAllStocksSector] = useState("All");
  const [allStocksMcap, setAllStocksMcap] = useState("All");
  const [visibleCount, setVisibleCount] = useState(30);
  const searchTimeout = useRef<NodeJS.Timeout>(undefined);

  // Curated beginner stocks with live prices
  const stocks = useMemo(() => {
    return BEGINNER_STOCKS.map(s => {
      const live = liveStocks[s.ticker];
      return live && live.price > 0 ? { ...s, currentPrice: live.price, changePercent: Math.round(live.changePercent * 100) / 100 } : s;
    });
  }, [liveStocks]);

  const sectors = useMemo(() => {
    const set = new Set(BEGINNER_STOCKS.map(s => s.sector));
    return [{ id: "all", label: "All", emoji: "📊" }, ...Array.from(set).map(s => ({ id: s, label: s, emoji: "🏷️" }))];
  }, []);

  const filteredBeginner = useMemo(() => sectorFilter === "all" ? stocks : stocks.filter(s => s.sector === sectorFilter), [stocks, sectorFilter]);

  const portfolioResult = useMemo(() => {
    const preset = PORTFOLIO_PRESETS[portfolioPreset];
    const returns: Record<string, number> = {};
    BEGINNER_STOCKS.forEach(s => { returns[s.ticker] = s.oneYearReturn; });
    return calculatePortfolioReturn(preset, returns);
  }, [portfolioPreset]);

  // All NSE stocks — filtered + searched
  const allStocksFiltered = useMemo(() => {
    if (searchQuery.trim()) {
      return searchStocks(searchQuery, 50);
    }
    let list = allStocksSector !== "All" ? getStocksBySector(allStocksSector) : NSE_STOCKS;
    if (allStocksMcap !== "All") {
      const mcapMap: Record<string, string> = { "Large Cap": "large", "Mid Cap": "mid", "Small Cap": "small", "SME/Micro": "sme" };
      list = list.filter(s => s.mcapType === mcapMap[allStocksMcap]);
    }
    return list;
  }, [searchQuery, allStocksSector, allStocksMcap]);

  const visibleStocks = useMemo(() => allStocksFiltered.slice(0, visibleCount), [allStocksFiltered, visibleCount]);

  // Open any stock in analysis modal
  const openStock = useCallback((entry: StockEntry) => {
    const sym = cleanSymbol(entry.ticker);
    const live = liveStocks[sym];
    setSelectedStock({
      stock: {
        name: entry.name,
        ticker: sym,
        sector: entry.sector,
        sectorColor: sectorColors[entry.sector] || "#3b82f6",
        tradingViewSymbol: `NSE:${sym}`,
      },
      price: live?.price || 0,
      change: live?.changePercent || 0,
    });
  }, [liveStocks]);

  const openBeginnerStock = useCallback((stock: BeginnerStock) => {
    const live = liveStocks[stock.ticker];
    setSelectedStock({
      stock,
      price: live?.price || stock.currentPrice,
      change: live?.changePercent ?? stock.changePercent,
    });
  }, [liveStocks]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {selectedStock && (
        <StockAnalysis
          stock={selectedStock.stock}
          livePrice={selectedStock.price}
          liveChange={selectedStock.change}
          onClose={() => setSelectedStock(null)}
        />
      )}

      <AIExplanation
        emoji="📊"
        text="Stocks represent ownership in a company. When you buy a stock, you own a tiny piece of that business. If the company grows, your investment grows too. Start with blue-chip stocks — they're large, stable companies with proven track records."
      />

      {/* ═══════ CURATED BEGINNER STOCKS ═══════ */}
      <div>
        <SectionHeader emoji="🏆" title="Top Stocks for Beginners" subtitle="Curated blue-chip companies — tap for fullscreen analysis" />
        <div style={{ marginBottom: 14 }}>
          <PillTabs tabs={sectors} active={sectorFilter} onSelect={setSectorFilter} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredBeginner.map(stock => {
            const live = liveStocks[stock.ticker];
            const price = live?.price || stock.currentPrice;
            const change = live?.changePercent ?? stock.changePercent;
            const vc = stock.aiVerdict === "good" ? { l: "Good for Long Term", c: COLORS.accent, b: COLORS.accentSoft }
              : stock.aiVerdict === "watch" ? { l: "Wait & Watch", c: COLORS.amber, b: COLORS.amberSoft }
              : { l: "Risky Now", c: COLORS.red, b: COLORS.redSoft };
            return (
              <div key={stock.ticker}
                onClick={() => openBeginnerStock(stock)}
                style={{
                  ...card({ padding: "18px 20px", cursor: "pointer" }),
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: `${stock.sectorColor}12`, color: stock.sectorColor,
                    fontWeight: 800, fontSize: "1rem",
                  }}>{stock.name[0]}</div>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: 2 }}>{stock.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.55rem", fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: `${stock.sectorColor}12`, color: stock.sectorColor }}>{stock.sector}</span>
                      <RiskMeter level={stock.aiVerdict === "good" ? "low" : stock.aiVerdict === "watch" ? "medium" : "high"} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MiniChart symbol={stock.ticker} positive={change >= 0} />
                  <div style={{ textAlign: "right", minWidth: 90 }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>&#8377;{price.toLocaleString("en-IN")}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: change >= 0 ? COLORS.accent : COLORS.red }}>
                      {change >= 0 ? "▲" : "▼"}{Math.abs(change).toFixed(2)}%
                    </div>
                    <span style={{ fontSize: "0.48rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: vc.b, color: vc.c }}>{vc.l}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Disclaimer />
      </div>

      {/* ═══════ ALL 3000+ NSE STOCKS ═══════ */}
      <div>
        <SectionHeader emoji="🔍" title={`All NSE Stocks (${NSE_STOCKS.length.toLocaleString()}+)`} subtitle="Browse or search every stock on the National Stock Exchange" />

        {/* Search bar */}
        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setVisibleCount(30); }}
            placeholder="Search by company name or symbol (e.g. Zomato, IRCTC, Adani)..."
            style={{
              width: "100%", padding: "14px 18px", borderRadius: 14,
              background: "#ffffff", border: `1px solid ${COLORS.cardBorder}`,
              color: COLORS.textPrimary, fontSize: "0.92rem", fontWeight: 600,
              outline: "none", boxSizing: "border-box",
              boxShadow: COLORS.cardShadow,
            }}
          />
        </div>

        {/* Sector filter */}
        <div style={{ marginBottom: 10, overflowX: "auto", display: "flex", gap: 6, paddingBottom: 4 }}>
          {["All", "Banking", "IT", "FMCG", "Auto", "Pharma", "Oil & Gas", "Power", "Metals", "NBFC", "Telecom", "Infrastructure", "Defense", "Chemicals", "Insurance", "Railways", "Real Estate"].map(sec => (
            <button key={sec} onClick={() => { setAllStocksSector(sec); setVisibleCount(30); setSearchQuery(""); }} style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid",
              borderColor: allStocksSector === sec ? COLORS.accent : COLORS.cardBorder,
              background: allStocksSector === sec ? COLORS.accentSoft : "#fff",
              color: allStocksSector === sec ? COLORS.accent : COLORS.textMuted,
              fontSize: "0.65rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.2s", flexShrink: 0,
            }}>{sec}</button>
          ))}
        </div>

        {/* Market cap filter */}
        <div style={{ marginBottom: 16, display: "flex", gap: 6 }}>
          {MCAP_FILTERS.map(mcap => (
            <button key={mcap} onClick={() => { setAllStocksMcap(mcap); setVisibleCount(30); }} style={{
              padding: "6px 12px", borderRadius: 8, border: "1px solid",
              borderColor: allStocksMcap === mcap ? COLORS.purple : COLORS.cardBorder,
              background: allStocksMcap === mcap ? COLORS.purpleSoft : "#fff",
              color: allStocksMcap === mcap ? COLORS.purple : COLORS.textMuted,
              fontSize: "0.62rem", fontWeight: 600, cursor: "pointer",
            }}>{mcap}</button>
          ))}
        </div>

        {/* Count */}
        <div style={{ fontSize: "0.68rem", color: COLORS.textDim, marginBottom: 10, fontWeight: 600 }}>
          Showing {Math.min(visibleCount, allStocksFiltered.length)} of {allStocksFiltered.length.toLocaleString()} stocks
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* Stock list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visibleStocks.map(entry => {
            const sym = cleanSymbol(entry.ticker);
            const live = liveStocks[sym];
            const price = live?.price || 0;
            const change = live?.changePercent || 0;
            const color = sectorColors[entry.sector] || "#3b82f6";
            const mcapLabel = entry.mcapType === "large" ? "Large Cap" : entry.mcapType === "mid" ? "Mid Cap" : entry.mcapType === "small" ? "Small Cap" : "SME";

            return (
              <div key={entry.ticker}
                onClick={() => openStock(entry)}
                style={{
                  ...card({ padding: "16px 20px", cursor: "pointer" }),
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: `${color}12`, color: color,
                    fontWeight: 800, fontSize: "0.88rem",
                  }}>{entry.name[0]}</div>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>{entry.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: "0.55rem", color: COLORS.textDim, fontWeight: 600 }}>{sym}</span>
                      <span style={{ fontSize: "0.48rem", fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: `${color}10`, color }}>{entry.sector}</span>
                      <span style={{ fontSize: "0.48rem", fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: COLORS.purpleSoft, color: COLORS.purple }}>{mcapLabel}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Mini chart */}
                  <MiniChart symbol={sym} positive={change >= 0} />

                  <div style={{ textAlign: "right", minWidth: 85 }}>
                    {price > 0 ? (
                      <>
                        <div style={{ fontSize: "1rem", fontWeight: 900 }}>&#8377;{price.toLocaleString("en-IN")}</div>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: change >= 0 ? COLORS.accent : COLORS.red }}>
                          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: "0.72rem", color: COLORS.textDim }}>Tap to view</div>
                    )}
                  </div>

                  <div style={{ fontSize: "0.65rem", color: COLORS.accent, fontWeight: 600 }}>&#8594;</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load more */}
        {visibleCount < allStocksFiltered.length && (
          <button onClick={() => setVisibleCount(v => v + 30)} style={{
            width: "100%", padding: "14px", borderRadius: 14, marginTop: 12,
            background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`,
            color: COLORS.accent, fontSize: "0.82rem", fontWeight: 700,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            Load More Stocks ({allStocksFiltered.length - visibleCount} remaining)
          </button>
        )}
      </div>

      {/* ═══════ PORTFOLIO BUILDER ═══════ */}
      <div style={{ ...card({ padding: "28px" }) }}>
        <SectionHeader emoji="🎯" title="Build Your First Portfolio" subtitle="Practice investing without real money" />
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {(["conservative", "balanced", "growth"] as const).map(p => (
            <button key={p} onClick={() => setPortfolioPreset(p)} style={{
              flex: 1, padding: "14px 10px", borderRadius: 14, border: "1px solid",
              borderColor: portfolioPreset === p ? COLORS.accent : COLORS.cardBorder,
              background: portfolioPreset === p ? COLORS.accentSoft : COLORS.card,
              color: portfolioPreset === p ? COLORS.accent : COLORS.textMuted,
              fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
            }}>{p === "conservative" ? "🛡️" : p === "balanced" ? "⚖️" : "🚀"} {p}</button>
          ))}
        </div>
        <div style={{ padding: "20px", borderRadius: 16, background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`, textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", color: COLORS.textDim, marginBottom: 6 }}>If you invested &#8377;10,000 one year ago</div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: COLORS.accent }}>&#8377;{portfolioResult.currentValue.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: portfolioResult.returnPercent >= 0 ? COLORS.accent : COLORS.red, marginTop: 4 }}>
            {portfolioResult.returnPercent >= 0 ? "+" : ""}{portfolioResult.returnPercent}% return
          </div>
        </div>
        <Disclaimer text="Past performance shown. Not investment advice. Simulated results only." />
      </div>

      <UpsellBanner text="Access institutional-grade analysis tools in Advanced Mode" />
    </div>
  );
}

/* ── Sector color mapping ──────────────────────────────────────── */
const sectorColors: Record<string, string> = {
  "Banking": "#1e40af", "IT": "#7c3aed", "FMCG": "#059669", "Auto": "#dc2626",
  "Pharma": "#0891b2", "Oil & Gas": "#b45309", "Power": "#eab308", "Infrastructure": "#6b7280",
  "Metals": "#78716c", "NBFC": "#4f46e5", "Telecom": "#0ea5e9", "Insurance": "#8b5cf6",
  "Defense": "#475569", "Chemicals": "#f59e0b", "Consumer": "#ec4899", "Cement": "#a1a1aa",
  "Tech": "#6366f1", "Renewable Energy": "#22c55e", "Railways": "#ef4444", "Real Estate": "#14b8a6",
  "Electronics": "#3b82f6", "Capital Goods": "#f97316", "Healthcare": "#06b6d4", "Textiles": "#a855f7",
  "Logistics": "#64748b", "Media": "#e11d48", "Aviation": "#0284c7", "Retail": "#d946ef",
  "Fertilizers": "#16a34a", "Paints": "#f43f5e", "Sugar": "#fbbf24", "Paper": "#a3a3a3",
  "Hospitality": "#fb923c", "Education": "#8b5cf6", "Fintech": "#2563eb", "Mining": "#92400e",
  "EMS": "#0d9488", "ETF": "#6366f1",
};
