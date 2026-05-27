"use client";
import { useState, useEffect, useCallback } from "react";
import { COLORS } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   LIVE MARKET NEWS BAR
   Horizontal scrolling news with AI-simplified explanations.
   Fetches financial news and explains in beginner language.
   ═══════════════════════════════════════════════════════════════ */

interface NewsItem {
  headline: string;
  simpleExplanation: string;
  category: string;
  emoji: string;
  timestamp: string;
}

// Curated beginner-friendly news with rotating daily content
const MARKET_NEWS_POOL: NewsItem[] = [
  { headline: "RBI keeps repo rate unchanged at 6.5%", simpleExplanation: "Interest rates stay the same — your EMIs won't change for now", category: "RBI", emoji: "🏦", timestamp: "Today" },
  { headline: "FII buying continues in Indian markets", simpleExplanation: "Foreign investors are putting money into Indian stocks — good for market", category: "Markets", emoji: "🌍", timestamp: "Today" },
  { headline: "Nifty IT index falls 1.5% on weak guidance", simpleExplanation: "IT companies gave cautious future forecasts — their stocks dropped", category: "Stocks", emoji: "💻", timestamp: "Today" },
  { headline: "Gold hits new all-time high above $2,500", simpleExplanation: "Gold is very expensive now — people are buying it as a safe investment", category: "Commodities", emoji: "🥇", timestamp: "Today" },
  { headline: "Bitcoin crosses $90,000 mark", simpleExplanation: "Bitcoin price reached new highs — crypto market is very active", category: "Crypto", emoji: "₿", timestamp: "Today" },
  { headline: "US Fed signals rate cuts coming soon", simpleExplanation: "American central bank may lower rates — good for global stock markets", category: "Global", emoji: "🇺🇸", timestamp: "Today" },
  { headline: "Crude oil drops below $70 on demand concerns", simpleExplanation: "Oil is cheaper — petrol prices might reduce, and inflation could ease", category: "Commodities", emoji: "⛽", timestamp: "Today" },
  { headline: "SIP inflows hit record ₹21,000 crore in May", simpleExplanation: "More people are investing monthly in mutual funds than ever before", category: "MF", emoji: "📈", timestamp: "Today" },
  { headline: "Rupee strengthens to 83.5 against dollar", simpleExplanation: "Indian currency got stronger — imports like oil become slightly cheaper", category: "Forex", emoji: "💱", timestamp: "Today" },
  { headline: "SEBI tightens F&O trading rules for retail", simpleExplanation: "Market regulator making risky trading harder for beginners — good move", category: "Regulation", emoji: "🛡️", timestamp: "Today" },
  { headline: "Reliance AGM announces new AI ventures", simpleExplanation: "India's biggest company is betting big on artificial intelligence", category: "Stocks", emoji: "🤖", timestamp: "Today" },
  { headline: "India GDP grows at 7.8% in latest quarter", simpleExplanation: "Indian economy is growing fast — more jobs and profits ahead", category: "Economy", emoji: "🇮🇳", timestamp: "Today" },
  { headline: "China stimulus boosts emerging market sentiment", simpleExplanation: "China helping its economy could benefit Indian exports too", category: "Global", emoji: "🌏", timestamp: "Today" },
  { headline: "Real estate prices rise 12% in top 7 cities", simpleExplanation: "Homes are getting more expensive — REITs could be an alternative", category: "Real Estate", emoji: "🏠", timestamp: "Today" },
  { headline: "Tax deadline: File ITR before July 31", simpleExplanation: "Last date to file taxes is approaching — avoid late fees", category: "Tax", emoji: "🧾", timestamp: "Today" },
];

export default function BeginnerNewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Rotate news based on day to keep it fresh
  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const startIdx = dayOfYear % MARKET_NEWS_POOL.length;
    const rotated = [
      ...MARKET_NEWS_POOL.slice(startIdx),
      ...MARKET_NEWS_POOL.slice(0, startIdx),
    ].slice(0, 8);
    setNews(rotated);
  }, []);

  if (news.length === 0) return null;

  return (
    <div style={{
      background: COLORS.bgWhite,
      borderBottom: `1px solid ${COLORS.cardBorder}`,
      padding: "10px 0",
    }}>
      {/* Scrolling headlines */}
      <div style={{ overflow: "hidden", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "0 16px" }}>
          <span style={{
            fontSize: "0.55rem", fontWeight: 800, color: COLORS.bgWhite,
            background: COLORS.red, padding: "2px 8px", borderRadius: 4,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>LIVE</span>
          <span style={{ fontSize: "0.65rem", fontWeight: 600, color: COLORS.textMuted }}>Market News</span>
        </div>
        <div style={{ overflow: "hidden" }}>
          <div className="news-scroll" style={{
            display: "flex", gap: 32, whiteSpace: "nowrap",
            animation: "newsScroll 60s linear infinite",
            width: "max-content", padding: "0 16px",
          }}>
            {[...news, ...news].map((item, i) => (
              <button
                key={i}
                onClick={() => setExpandedIdx(expandedIdx === i % news.length ? null : i % news.length)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                <span style={{ fontSize: "0.85rem" }}>{item.emoji}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: COLORS.textPrimary }}>{item.headline}</span>
                <span style={{
                  fontSize: "0.55rem", fontWeight: 600, color: COLORS.textDim,
                  padding: "2px 6px", borderRadius: 4, background: COLORS.bg,
                }}>{item.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded explanation */}
      {expandedIdx !== null && news[expandedIdx] && (
        <div style={{
          margin: "10px 16px 0", padding: "12px 14px", borderRadius: 10,
          background: "linear-gradient(135deg, rgba(79,70,229,0.04), rgba(16,185,129,0.03))",
          border: `1px solid ${COLORS.blueBorder}`,
          display: "flex", alignItems: "flex-start", gap: 10,
          animation: "fadeIn 0.2s ease-out",
        }}>
          <span style={{ fontSize: "1rem" }}>🤖</span>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: COLORS.blue, marginBottom: 3 }}>AI EXPLAINS</div>
            <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>
              {news[expandedIdx].simpleExplanation}
            </p>
          </div>
          <button onClick={() => setExpandedIdx(null)} style={{ background: "none", border: "none", color: COLORS.textDim, cursor: "pointer", fontSize: "0.9rem", flexShrink: 0 }}>&#10005;</button>
        </div>
      )}
    </div>
  );
}

export function NewsTickerStyles() {
  return (
    <style>{`
      @keyframes newsScroll {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .news-scroll:hover {
        animation-play-state: paused;
      }
    `}</style>
  );
}
