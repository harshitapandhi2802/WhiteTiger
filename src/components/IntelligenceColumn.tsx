"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type NewsItem = {
  headline: string;
  body: string;
  source: string;
  sourceIcon: string;
  url: string;
  category: string;
  publishedAt: string;
  sentiment: "bullish" | "bearish" | "neutral";
};

type MainTab = "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international" | "derivatives" | "realestate";

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  RBI:   { bg: "rgba(230,81,0,0.10)", color: "#e65100" },
  SEBI:  { bg: "rgba(21,101,192,0.10)", color: "#1565c0" },
  ET:    { bg: "rgba(41,98,255,0.08)", color: "#2962ff" },
  MC:    { bg: "rgba(0,150,136,0.10)", color: "#009688" },
  LM:    { bg: "rgba(244,67,54,0.08)", color: "#f44336" },
  GN:    { bg: "rgba(66,133,244,0.08)", color: "#4285f4" },
};

const SENTIMENT_CONFIG = {
  bullish:  { color: "#2e7d32", bg: "rgba(46,125,50,0.10)", icon: "▲" },
  bearish:  { color: "#c62828", bg: "rgba(198,40,40,0.10)", icon: "▼" },
  neutral:  { color: "#e65100", bg: "rgba(230,81,0,0.10)", icon: "●" },
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export function IntelligenceColumn({ tab }: { tab: MainTab }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchedTab = useRef("");
  const animRef = useRef<number | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/market-news?tab=${tab}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.items?.length) {
        setItems(data.items);
        setSources(data.sources || []);
        setLastUpdate(
          new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        );
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (fetchedTab.current !== tab) {
      fetchedTab.current = tab;
      fetchNews();
    }
    const interval = setInterval(fetchNews, 15 * 60 * 1000); // refresh every 15 min
    return () => clearInterval(interval);
  }, [tab, fetchNews]);

  // Auto-scroll
  const isPaused = useRef(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;

    let lastTime = 0;
    const speed = 0.35;

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
  }, [items]);

  // Duplicate for seamless loop
  const displayItems = items.length > 0 ? [...items, ...items] : [];

  return (
    <div style={{
      background: "var(--bg-midnight, #14213D)",
      borderRadius: 14,
      border: "0.5px solid var(--border, rgba(232,237,245,0.08))",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 500,
      maxHeight: 800,
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px 10px",
        borderBottom: "0.5px solid var(--border, rgba(232,237,245,0.08))",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: loading ? "#ff9800" : "#34D399",
              boxShadow: loading ? "0 0 6px rgba(255,152,0,0.5)" : "0 0 6px rgba(52,211,153,0.5)",
              animation: loading ? "intel-pulse 1.5s infinite" : "none",
            }} />
            <span style={{
              fontSize: "0.7rem", fontWeight: 800,
              color: "var(--text-primary, #E8EDF5)",
              letterSpacing: 1, textTransform: "uppercase",
            }}>
              Market Intelligence
            </span>
          </div>
          <button
            onClick={fetchNews}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid var(--border, rgba(232,237,245,0.08))",
              borderRadius: 6,
              padding: "3px 8px",
              cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
              color: "var(--text-muted, rgba(255,255,255,0.4))",
              fontSize: "0.6rem", fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{
              animation: loading ? "intel-spin 1s linear infinite" : "none",
            }}>
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {loading ? "..." : "Refresh"}
          </button>
        </div>

        {/* Source badges */}
        {sources.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>
              Sources:
            </span>
            {sources.map(s => {
              const iconMap: Record<string, string> = {
                "Economic Times": "ET", Moneycontrol: "MC", Mint: "LM",
                "Google News": "GN", RBI: "RBI", SEBI: "SEBI",
              };
              const key = iconMap[s] || "GN";
              const cfg = SOURCE_COLORS[key] || SOURCE_COLORS.GN;
              return (
                <span key={s} style={{
                  fontSize: "0.5rem", fontWeight: 700,
                  color: cfg.color, background: cfg.bg,
                  padding: "1px 5px", borderRadius: 3,
                  letterSpacing: 0.3,
                }}>
                  {s}
                </span>
              );
            })}
            {lastUpdate && (
              <span style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>
                {lastUpdate} IST
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrolling content */}
      <div
        ref={scrollRef}
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
        style={{
          flex: 1,
          overflowY: "hidden",
          padding: "6px 10px",
          scrollbarWidth: "none",
        }}
      >
        {/* Loading shimmer */}
        {loading && items.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                width: "100%", borderRadius: 10, padding: 14,
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid var(--border, rgba(232,237,245,0.06))",
              }}>
                <div style={{ width: "40%", height: 10, borderRadius: 4, background: "rgba(255,255,255,0.05)", marginBottom: 8, animation: `intel-shimmer 1.5s infinite ${i * 0.2}s` }} />
                <div style={{ width: "90%", height: 14, borderRadius: 4, background: "rgba(255,255,255,0.05)", marginBottom: 6, animation: `intel-shimmer 1.5s infinite ${i * 0.2 + 0.1}s` }} />
                <div style={{ width: "70%", height: 10, borderRadius: 4, background: "rgba(255,255,255,0.05)", animation: `intel-shimmer 1.5s infinite ${i * 0.2 + 0.2}s` }} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary, #E8EDF5)", marginBottom: 4 }}>Feed Unavailable</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>Tap refresh to retry</div>
          </div>
        )}

        {/* News items */}
        {displayItems.map((item, i) => {
          const sentCfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
          const srcKey = item.sourceIcon || "GN";
          const srcCfg = SOURCE_COLORS[srcKey] || SOURCE_COLORS.GN;
          const ago = timeAgo(item.publishedAt);

          return (
            <a
              key={`${item.headline}-${i}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "10px 12px",
                marginBottom: 8,
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid var(--border, rgba(232,237,245,0.06))",
                transition: "all 0.2s",
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(74,158,255,0.04)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(74,158,255,0.12)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.02)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border, rgba(232,237,245,0.06))";
              }}
            >
              {/* Top row: Source + Category + Sentiment + Time */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                {/* Source badge */}
                <span style={{
                  fontSize: "0.5rem", fontWeight: 800,
                  color: srcCfg.color, background: srcCfg.bg,
                  padding: "2px 5px", borderRadius: 3,
                  letterSpacing: 0.3,
                }}>
                  {item.source}
                </span>

                {/* Category */}
                <span style={{
                  fontSize: "0.5rem", fontWeight: 700,
                  color: "rgba(255,255,255,0.4)",
                  background: "rgba(255,255,255,0.04)",
                  padding: "2px 5px", borderRadius: 3,
                  letterSpacing: 0.5, textTransform: "uppercase",
                }}>
                  {item.category}
                </span>

                {/* Sentiment */}
                <span style={{
                  fontSize: "0.5rem", fontWeight: 700,
                  color: sentCfg.color, background: sentCfg.bg,
                  padding: "2px 5px", borderRadius: 3,
                  display: "flex", alignItems: "center", gap: 2,
                }}>
                  {sentCfg.icon} {item.sentiment.toUpperCase()}
                </span>

                {/* Time ago */}
                {ago && (
                  <span style={{
                    fontSize: "0.48rem", color: "rgba(255,255,255,0.2)",
                    marginLeft: "auto", fontWeight: 500,
                  }}>
                    {ago}
                  </span>
                )}
              </div>

              {/* Headline */}
              <div style={{
                fontSize: "0.78rem", fontWeight: 700,
                color: "var(--text-primary, #E8EDF5)",
                lineHeight: 1.35, marginBottom: 4,
              }}>
                {item.headline}
              </div>

              {/* Body */}
              <div style={{
                fontSize: "0.67rem",
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.5, fontWeight: 400,
              }}>
                {item.body}
              </div>

              {/* Read more arrow */}
              <div style={{
                fontSize: "0.55rem", color: "#4A9EFF",
                marginTop: 6, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 3,
              }}>
                Read full article →
              </div>
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: "7px 16px",
        borderTop: "0.5px solid var(--border, rgba(232,237,245,0.08))",
        background: "rgba(255,255,255,0.01)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4A9EFF" }} />
        <span style={{
          fontSize: "0.56rem",
          color: "rgba(255,255,255,0.2)",
          fontWeight: 600, letterSpacing: 0.5,
        }}>
          WHITE TIGER RESEARCH · LIVE FEEDS
        </span>
      </div>

      <style>{`
        @keyframes intel-shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes intel-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes intel-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
