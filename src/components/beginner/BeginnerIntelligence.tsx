"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { COLORS } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER MARKET INTELLIGENCE PANEL
   Live AI-powered market news sidebar — simplified for beginners.
   Shows RBI/SEBI updates, market flows, earnings, macro news,
   sector highlights, and risk signals with "What This Means" cards.
   ═══════════════════════════════════════════════════════════════ */

type Article = {
  headline: string;
  body: string;
  category: string;
  sentiment: "bullish" | "bearish" | "neutral";
  urgency: "breaking" | "high" | "medium";
};

type BeginnerArticle = Article & {
  whatThisMeans: string;
};

// Map beginner tab IDs to intelligence API tabs
const TAB_MAP: Record<string, string> = {
  home: "stocks",
  stocks: "stocks",
  mf: "mutualfunds",
  crypto: "crypto",
  forex: "currency",
  bonds: "debt",
  commodities: "commodities",
  realestate: "stocks",
  tax: "stocks",
  derivatives: "stocks",
};

// Beginner-friendly category labels + colors
const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  MACRO: { label: "Economy", emoji: "🌍", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
  FLOWS: { label: "Money Flow", emoji: "💸", color: "#2962ff", bg: "rgba(41,98,255,0.08)" },
  TECHNICAL: { label: "Market Trend", emoji: "📈", color: "#0097a7", bg: "rgba(0,151,167,0.08)" },
  POLICY: { label: "RBI / SEBI", emoji: "🏛️", color: "#e65100", bg: "rgba(230,81,0,0.08)" },
  EARNINGS: { label: "Company News", emoji: "🏢", color: "#2e7d32", bg: "rgba(46,125,50,0.08)" },
  RISK: { label: "Risk Alert", emoji: "⚠️", color: "#c62828", bg: "rgba(198,40,40,0.08)" },
  STRATEGY: { label: "Smart Move", emoji: "🎯", color: "#7b1fa2", bg: "rgba(123,31,162,0.08)" },
  DATA: { label: "Key Data", emoji: "📊", color: "#455a64", bg: "rgba(69,90,100,0.08)" },
};

const SENTIMENT_CONFIG = {
  bullish: { label: "Positive", color: "#059669", bg: "rgba(5,150,105,0.08)", icon: "😊" },
  bearish: { label: "Negative", color: "#dc2626", bg: "rgba(220,38,38,0.08)", icon: "😟" },
  neutral: { label: "Neutral", color: "#d97706", bg: "rgba(217,119,6,0.08)", icon: "😐" },
};

// Generate beginner-friendly "What This Means" from article data
function generateWhatThisMeans(article: Article): string {
  const templates: Record<string, Record<string, string>> = {
    MACRO: {
      bullish: "Good news for the economy! This could mean your investments may grow. Stay invested.",
      bearish: "The economy is facing some headwinds. Don't panic — these cycles are normal. Long-term investors usually recover.",
      neutral: "The economy is in a wait-and-watch phase. No action needed — just keep your SIPs running.",
    },
    FLOWS: {
      bullish: "Big investors are putting money into the market — a sign of confidence. Good time to stay invested.",
      bearish: "Some big investors are pulling money out. This can cause short-term drops, but it's usually temporary.",
      neutral: "Money flows are balanced right now. The market is in a steady state — no rush to act.",
    },
    TECHNICAL: {
      bullish: "Market charts are showing positive patterns. Prices have been moving up consistently.",
      bearish: "Markets are showing some weakness in charts. Short-term traders might worry, but long-term investors can stay calm.",
      neutral: "Markets are moving sideways — no clear direction yet. This is normal and happens regularly.",
    },
    POLICY: {
      bullish: "Government or RBI decisions are helping the market. This usually means stable growth ahead.",
      bearish: "New regulations or policies might create some uncertainty. Markets usually adjust within a few weeks.",
      neutral: "RBI/SEBI is taking a measured approach. No big changes expected — your investments are likely unaffected.",
    },
    EARNINGS: {
      bullish: "Companies are reporting good profits. Strong earnings usually push stock prices higher over time.",
      bearish: "Some companies are seeing lower profits. If you own these stocks, review but don't panic sell.",
      neutral: "Earnings are mixed — some companies doing well, others not. Diversification helps protect you here.",
    },
    RISK: {
      bullish: "A potential risk has been managed well. Markets are resilient and bouncing back.",
      bearish: "There's a risk to watch out for. Don't make sudden moves — review your portfolio calmly if needed.",
      neutral: "Some risks on the horizon, but nothing alarming. Just keep an eye on your investments.",
    },
    STRATEGY: {
      bullish: "Smart investors are positioning for growth in specific areas. Consider if this aligns with your goals.",
      bearish: "Some sectors are seeing cautious moves. Not every area is suitable for beginners right now.",
      neutral: "Market experts suggest a balanced approach. This is good advice for beginners too — stay diversified.",
    },
    DATA: {
      bullish: "The latest data points are encouraging. Numbers support a positive market outlook.",
      bearish: "Recent data shows some concerning trends. But remember — data changes every month/quarter.",
      neutral: "Data is neither strongly positive nor negative. Markets are processing this information.",
    },
  };

  const catTemplates = templates[article.category] || templates.MACRO;
  return catTemplates[article.sentiment] || catTemplates.neutral;
}

export default function BeginnerIntelligence({ activeTab }: { activeTab: string }) {
  const [articles, setArticles] = useState<BeginnerArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const fetchedTab = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiTab = TAB_MAP[activeTab] || "stocks";

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/intelligence?tab=${apiTab}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.articles?.length) {
        const enriched: BeginnerArticle[] = data.articles.map((a: Article) => ({
          ...a,
          whatThisMeans: generateWhatThisMeans(a),
        }));
        setArticles(enriched);
        setLastUpdate(
          new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        );
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [apiTab]);

  useEffect(() => {
    if (fetchedTab.current !== apiTab) {
      fetchedTab.current = apiTab;
      setExpandedIdx(null);
      fetchArticles();
    }
    const interval = setInterval(fetchArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiTab, fetchArticles]);

  // Auto-scroll when not expanded and not on mobile open
  const isPaused = useRef(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || articles.length === 0 || expandedIdx !== null) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = 0;
    const speed = 0.3;

    const tick = (time: number) => {
      if (!isPaused.current && el) {
        const delta = lastTime ? (time - lastTime) : 16;
        lastTime = time;
        el.scrollTop += speed * (delta / 16);
        if (el.scrollTop >= el.scrollHeight / 2) {
          el.scrollTop = 0;
        }
      } else {
        lastTime = time;
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [articles, expandedIdx]);

  const displayArticles = articles.length > 0 ? [...articles, ...articles] : [];

  const sidebarContent = (
    <div style={{
      background: "#ffffff",
      borderRadius: 16,
      border: `1px solid ${COLORS.cardBorder}`,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 400,
      maxHeight: "calc(100vh - 180px)",
      boxShadow: COLORS.cardShadow,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${COLORS.divider}`,
        background: "linear-gradient(135deg, rgba(5,150,105,0.03), rgba(79,70,229,0.02))",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: loading ? "#d97706" : "#059669",
              boxShadow: loading ? "0 0 6px rgba(217,119,6,0.5)" : "0 0 6px rgba(5,150,105,0.5)",
              animation: loading ? "biPulse 1.5s infinite" : "none",
            }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textPrimary, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Market Buzz
            </span>
            <span style={{ fontSize: "0.82rem" }}>&#x2728;</span>
          </div>
          <button onClick={fetchArticles} disabled={loading} style={{
            background: COLORS.bg, border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 8, padding: "4px 10px", cursor: loading ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: 4,
            color: COLORS.textDim, fontSize: "0.58rem", fontWeight: 600, transition: "all 0.2s",
          }}>
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{
              animation: loading ? "biSpin 1s linear infinite" : "none",
            }}>
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {loading ? "..." : "Refresh"}
          </button>
        </div>
        {lastUpdate && (
          <span style={{ fontSize: "0.55rem", color: COLORS.textDim, fontWeight: 500 }}>
            Updated {lastUpdate} IST
          </span>
        )}
        <p style={{ fontSize: "0.6rem", color: COLORS.textMuted, margin: "6px 0 0", lineHeight: 1.5 }}>
          AI-curated market news, simplified for you. Tap any card to learn what it means.
        </p>
      </div>

      {/* Scrolling content */}
      <div
        ref={scrollRef}
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
        style={{
          flex: 1,
          overflowY: expandedIdx !== null ? "auto" : "hidden",
          padding: "8px 10px",
          scrollbarWidth: "none",
        }}
      >
        {/* Loading shimmer */}
        {loading && articles.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                borderRadius: 12, padding: 14,
                background: COLORS.bg, border: `1px solid ${COLORS.dividerLight}`,
              }}>
                <div style={{ width: "35%", height: 10, borderRadius: 4, background: "#e2e8f0", marginBottom: 8, animation: `biShimmer 1.5s infinite ${i * 0.15}s` }} />
                <div style={{ width: "85%", height: 13, borderRadius: 4, background: "#e2e8f0", marginBottom: 6, animation: `biShimmer 1.5s infinite ${i * 0.15 + 0.1}s` }} />
                <div style={{ width: "65%", height: 10, borderRadius: 4, background: "#e2e8f0", animation: `biShimmer 1.5s infinite ${i * 0.15 + 0.2}s` }} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ textAlign: "center", padding: 30, color: COLORS.textDim }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>&#128225;</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>Feed Unavailable</div>
            <div style={{ fontSize: "0.62rem", color: COLORS.textDim }}>Tap refresh to try again</div>
          </div>
        )}

        {/* Article cards */}
        {displayArticles.map((article, i) => {
          const realIdx = i % articles.length;
          const isExpanded = expandedIdx === realIdx;
          const cat = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.DATA;
          const sent = SENTIMENT_CONFIG[article.sentiment] || SENTIMENT_CONFIG.neutral;
          const isBreaking = article.urgency === "breaking";
          const isHigh = article.urgency === "high";

          return (
            <div
              key={`${article.headline}-${i}`}
              onClick={() => {
                setExpandedIdx(isExpanded ? null : realIdx);
                isPaused.current = true;
              }}
              style={{
                padding: "12px 14px",
                marginBottom: 8,
                borderRadius: 14,
                background: isExpanded ? "rgba(5,150,105,0.02)" : "#ffffff",
                border: `1px solid ${isExpanded ? COLORS.accentBorder : isBreaking ? "rgba(198,40,40,0.15)" : COLORS.cardBorder}`,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: isExpanded ? "0 2px 12px rgba(5,150,105,0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {/* Tags row */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "0.55rem", fontWeight: 700, color: cat.color,
                  background: cat.bg, padding: "3px 8px", borderRadius: 6,
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  {cat.emoji} {cat.label}
                </span>
                <span style={{
                  fontSize: "0.55rem", fontWeight: 700, color: sent.color,
                  background: sent.bg, padding: "3px 8px", borderRadius: 6,
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  {sent.icon} {sent.label}
                </span>
                {isBreaking && (
                  <span style={{
                    fontSize: "0.48rem", fontWeight: 800, color: "#fff",
                    background: "#dc2626", padding: "2px 7px", borderRadius: 6,
                    letterSpacing: 0.5, animation: "biPulse 2s infinite",
                  }}>
                    BREAKING
                  </span>
                )}
                {isHigh && !isBreaking && (
                  <span style={{
                    fontSize: "0.48rem", fontWeight: 700, color: "#d97706",
                    background: "rgba(217,119,6,0.08)", padding: "2px 7px", borderRadius: 6,
                  }}>
                    IMPORTANT
                  </span>
                )}
              </div>

              {/* Headline */}
              <div style={{
                fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary,
                lineHeight: 1.4, marginBottom: 4,
              }}>
                {article.headline}
              </div>

              {/* Body */}
              <div style={{
                fontSize: "0.68rem", color: COLORS.textMuted,
                lineHeight: 1.55, marginBottom: isExpanded ? 0 : 4,
              }}>
                {article.body}
              </div>

              {/* Expand hint */}
              {!isExpanded && (
                <div style={{ fontSize: "0.55rem", color: COLORS.accent, fontWeight: 600, marginTop: 4 }}>
                  &#128161; Tap to understand what this means for you
                </div>
              )}

              {/* What This Means — expanded */}
              {isExpanded && (
                <div style={{
                  marginTop: 10, padding: "12px 14px", borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(217,119,6,0.04), rgba(245,158,11,0.02))",
                  border: "1px solid rgba(217,119,6,0.12)",
                  animation: "biFadeIn 0.25s ease-out",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: "0.85rem" }}>&#128161;</span>
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      What This Means For You
                    </span>
                  </div>
                  <p style={{
                    fontSize: "0.72rem", color: COLORS.textSecondary,
                    lineHeight: 1.65, margin: 0,
                  }}>
                    {article.whatThisMeans}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 16px",
        borderTop: `1px solid ${COLORS.divider}`,
        background: COLORS.bg,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.accent }} />
        <span style={{ fontSize: "0.55rem", color: COLORS.textDim, fontWeight: 600, letterSpacing: 0.5 }}>
          MOONLIGHT AI RESEARCH
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      <div className="bi-sidebar-desktop" style={{
        width: 300,
        minWidth: 280,
        flexShrink: 0,
        position: "sticky",
        top: 110,
        alignSelf: "flex-start",
        height: "fit-content",
      }}>
        {sidebarContent}
      </div>

      {/* ── MOBILE TOGGLE BUTTON (hidden on desktop) ── */}
      <button
        className="bi-mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          position: "fixed", bottom: 80, right: 76, zIndex: 199,
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg, #059669, #10b981)",
          border: "none", color: "#fff", fontSize: "1.1rem",
          boxShadow: "0 4px 16px rgba(5,150,105,0.35)",
          cursor: "pointer",
          display: "none", // shown via CSS media query
          alignItems: "center", justifyContent: "center",
        }}
      >
        {isMobileOpen ? "✕" : "📊"}
      </button>

      {/* ── MOBILE BOTTOM SHEET (hidden on desktop via CSS) ── */}
      {isMobileOpen && (
        <div
          className="bi-mobile-overlay"
          style={{
            position: "fixed", inset: 0, zIndex: 250,
            background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
          }}
          onClick={e => { if (e.target === e.currentTarget) setIsMobileOpen(false); }}
        >
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            maxHeight: "80vh",
            borderRadius: "20px 20px 0 0",
            overflow: "hidden",
            animation: "biSlideUp 0.3s ease-out",
          }}>
            {/* Drag handle */}
            <div style={{
              background: "#ffffff", padding: "10px 0 4px", textAlign: "center",
              borderBottom: "none",
              borderRadius: "20px 20px 0 0",
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: COLORS.textGhost, margin: "0 auto" }} />
            </div>
            <div style={{ maxHeight: "calc(80vh - 20px)", overflow: "hidden" }}>
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function IntelligenceStyles() {
  return (
    <style>{`
      @keyframes biShimmer {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      @keyframes biPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes biSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes biFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes biSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      /* Desktop: show sidebar, hide mobile toggle + overlay */
      @media (min-width: 1024px) {
        .bi-sidebar-desktop { display: block !important; }
        .bi-mobile-toggle { display: none !important; }
        .bi-mobile-overlay { display: none !important; }
      }
      /* Tablet/Mobile: hide sidebar, show toggle */
      @media (max-width: 1023px) {
        .bi-sidebar-desktop { display: none !important; }
        .bi-mobile-toggle { display: flex !important; }
      }
      /* Hide scrollbar in intelligence panel */
      .bi-sidebar-desktop div::-webkit-scrollbar { display: none; }
    `}</style>
  );
}
