"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type Article = {
  headline: string;
  body: string;
  category: string;
  sentiment: "bullish" | "bearish" | "neutral";
  urgency: "breaking" | "high" | "medium";
};

type MainTab = "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international";

const CATEGORY_COLORS: Record<string, string> = {
  MACRO: "#6366f1",
  FLOWS: "#2962ff",
  TECHNICAL: "#00bcd4",
  POLICY: "#ff6f00",
  EARNINGS: "#00c853",
  RISK: "#f44336",
  STRATEGY: "#9c27b0",
  DATA: "#607d8b",
};

const SENTIMENT_CONFIG = {
  bullish: { color: "#00c853", bg: "rgba(0,200,83,0.08)", icon: "▲" },
  bearish: { color: "#f44336", bg: "rgba(244,67,54,0.08)", icon: "▼" },
  neutral: { color: "#ff9800", bg: "rgba(255,152,0,0.08)", icon: "●" },
};

const URGENCY_CONFIG = {
  breaking: { color: "#f44336", label: "BREAKING" },
  high: { color: "#ff6f00", label: "PRIORITY" },
  medium: { color: "#607d8b", label: "" },
};

export function IntelligenceColumn({ tab }: { tab: MainTab }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchedTab = useRef<string>("");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/intelligence?tab=${tab}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.articles?.length) {
        setArticles(data.articles);
        setLastUpdate(
          new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })
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
      fetchArticles();
    }
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchArticles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tab, fetchArticles]);

  return (
    <div style={{
      background: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 500,
      maxHeight: 800,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(135deg, rgba(41,98,255,0.08), rgba(99,102,241,0.05))",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: loading ? "#ff9800" : "#00c853",
              boxShadow: loading ? "0 0 6px #ff9800" : "0 0 6px #00c853",
              animation: loading ? "pulse 1.5s infinite" : "none",
            }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#e6e8eb", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Institutional Intelligence
            </span>
          </div>
          <button
            onClick={fetchArticles}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "3px 8px",
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.62rem",
              fontWeight: 600,
            }}
          >
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{
              animation: loading ? "spin 1s linear infinite" : "none",
            }}>
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {loading ? "Updating..." : "Refresh"}
          </button>
        </div>
        {lastUpdate && (
          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
            Last updated: {lastUpdate} IST
          </span>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 10px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.1) transparent",
      }}>
        {loading && articles.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, padding: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: "100%", height: 90, borderRadius: 10,
                background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)",
                backgroundSize: "200% 100%",
                animation: `shimmer 1.5s infinite ${i * 0.3}s`,
              }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.4)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}>Feed Unavailable</div>
            <div style={{ fontSize: "0.65rem" }}>Tap refresh to retry</div>
          </div>
        )}

        {articles.map((article, i) => {
          const catColor = CATEGORY_COLORS[article.category] || "#607d8b";
          const sentCfg = SENTIMENT_CONFIG[article.sentiment] || SENTIMENT_CONFIG.neutral;
          const urgCfg = URGENCY_CONFIG[article.urgency] || URGENCY_CONFIG.medium;

          return (
            <div key={i} style={{
              padding: "12px 14px",
              marginBottom: 8,
              borderRadius: 10,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
              transition: "all 0.2s",
              cursor: "default",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.04)";
            }}
            >
              {/* Tags row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "0.55rem", fontWeight: 700, color: catColor,
                  background: `${catColor}15`, padding: "2px 7px", borderRadius: 4,
                  letterSpacing: 0.5, textTransform: "uppercase",
                }}>
                  {article.category}
                </span>
                <span style={{
                  fontSize: "0.55rem", fontWeight: 700, color: sentCfg.color,
                  background: sentCfg.bg, padding: "2px 7px", borderRadius: 4,
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  {sentCfg.icon} {article.sentiment.toUpperCase()}
                </span>
                {urgCfg.label && (
                  <span style={{
                    fontSize: "0.5rem", fontWeight: 800, color: "#fff",
                    background: urgCfg.color, padding: "2px 7px", borderRadius: 4,
                    letterSpacing: 0.5,
                    animation: article.urgency === "breaking" ? "pulse 2s infinite" : "none",
                  }}>
                    {urgCfg.label}
                  </span>
                )}
              </div>

              {/* Headline */}
              <div style={{
                fontSize: "0.82rem", fontWeight: 700, color: "#e6e8eb",
                lineHeight: 1.35, marginBottom: 6,
              }}>
                {article.headline}
              </div>

              {/* Body */}
              <div style={{
                fontSize: "0.7rem", color: "rgba(255,255,255,0.5)",
                lineHeight: 1.55, fontWeight: 400,
              }}>
                {article.body}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#2962ff" }} />
        <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: 0.5 }}>
          MOONLIGHT RESEARCH DESK
        </span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
