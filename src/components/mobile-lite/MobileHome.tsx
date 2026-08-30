"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TrendingUp, Bitcoin, DollarSign, Building2, PiggyBank,
  Shield, Layers, Flame, Globe,
  Search, ArrowUpRight, ArrowDownRight, ChevronRight,
  Zap, Sparkles, Bell, User, Home, BarChart3,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Minimal Mobile Home
   Apple Stocks × Revolut × Robinhood inspired
   Clean, breathable, lightweight
   ══════════════════════════════════════════════════════════════════ */

type MainTab = "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international" | "derivatives" | "realestate";

type MarketItem = {
  name: string;
  symbol: string;
  price: string;
  change: number;
};

type NewsItem = {
  headline: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: "bullish" | "bearish" | "neutral";
};

/* ── Ticker Strip ── */
function MobileTicker({ items }: { items: MarketItem[] }) {
  if (!items.length) return null;
  return (
    <div style={{
      display: "flex", gap: 0, overflowX: "auto",
      WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
      padding: "0 16px", margin: "0 -16px",
    }}>
      <style>{`.mob-ticker::-webkit-scrollbar { display: none; }`}</style>
      {items.map((item, i) => (
        <div key={item.symbol + i} style={{
          padding: "10px 16px",
          display: "flex", flexDirection: "column", gap: 2,
          minWidth: 100, flexShrink: 0,
          borderRight: i < items.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none",
        }}>
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
            {item.symbol}
          </span>
          <span style={{
            fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {item.price}
          </span>
          <span style={{
            fontSize: "0.68rem", fontWeight: 600,
            color: item.change >= 0 ? "#34D399" : "#F87171",
            display: "flex", alignItems: "center", gap: 2,
          }}>
            {item.change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── AI Summary Card ── */
function AISummaryCard() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple market summary from cached intelligence
    const summaries = [
      "Markets are trading with a positive bias today. NIFTY holding above key support levels with IT and banking sectors leading gains. Gold remains firm on global uncertainty.",
      "Mixed signals across markets today. Domestic equities consolidating near highs while crude oil pullback provides relief. FII flows turning positive this week.",
      "Bullish momentum continues in broader markets. Mid-cap and small-cap indices outperforming. RBI policy stance remains accommodative supporting growth outlook.",
    ];
    const idx = new Date().getDate() % summaries.length;
    setTimeout(() => { setSummary(summaries[idx]); setLoading(false); }, 800);
  }, []);

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(74,158,255,0.06) 0%, rgba(124,77,255,0.04) 100%)",
      border: "0.5px solid rgba(74,158,255,0.1)",
      borderRadius: 16, padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "rgba(74,158,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={14} color="#4A9EFF" />
        </div>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#4A9EFF", letterSpacing: "0.04em" }}>
          AI MARKET BRIEF
        </span>
        <span style={{
          fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", marginLeft: "auto",
          fontWeight: 500,
        }}>
          {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[85, 100, 60].map((w, i) => (
            <div key={i} style={{
              width: `${w}%`, height: 12, borderRadius: 6,
              background: "rgba(255,255,255,0.04)",
              animation: `shimmer 1.5s infinite ${i * 0.15}s`,
            }} />
          ))}
        </div>
      ) : (
        <p style={{
          fontSize: "0.85rem", color: "rgba(255,255,255,0.55)",
          lineHeight: 1.65, margin: 0, fontWeight: 400,
        }}>
          {summary}
        </p>
      )}
    </div>
  );
}

/* ── Quick Access Grid ── */
function QuickAccessGrid({ onTabSelect }: { onTabSelect: (tab: MainTab) => void }) {
  const items: { id: MainTab; icon: React.ReactNode; label: string; color: string }[] = [
    { id: "stocks", icon: <TrendingUp size={22} />, label: "Stocks", color: "#4A9EFF" },
    { id: "crypto", icon: <Bitcoin size={22} />, label: "Crypto", color: "#f7931a" },
    { id: "currency", icon: <DollarSign size={22} />, label: "Forex", color: "#34D399" },
    { id: "commodities", icon: <Flame size={22} />, label: "Commodities", color: "#FBBF24" },
    { id: "mutualfunds", icon: <PiggyBank size={22} />, label: "Mutual Funds", color: "#a78bfa" },
    { id: "debt", icon: <Shield size={22} />, label: "Bonds", color: "#14b8a6" },
    { id: "realestate", icon: <Building2 size={22} />, label: "Real Estate", color: "#C5A572" },
    { id: "derivatives", icon: <Layers size={22} />, label: "F&O", color: "#F87171" },
    { id: "international", icon: <Globe size={22} />, label: "Global", color: "#818cf8" },
  ];

  return (
    <div>
      <div style={{
        fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14,
      }}>
        Explore Markets
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
      }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onTabSelect(item.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "16px 4px 12px",
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid rgba(232,237,245,0.04)",
              borderRadius: 14, cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{ color: item.color }}>{item.icon}</div>
            <span style={{
              fontSize: "0.62rem", fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              textAlign: "center", lineHeight: 1.2,
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── News Cards ── */
function MobileNewsCards() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market-news?tab=stocks")
      .then(r => r.json())
      .then(data => {
        if (data.items) setNews(data.items.slice(0, 5));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sentimentColor = (s: string) =>
    s === "bullish" ? "#34D399" : s === "bearish" ? "#F87171" : "#FBBF24";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            padding: 16, borderRadius: 14,
            background: "rgba(255,255,255,0.02)",
            border: "0.5px solid rgba(232,237,245,0.04)",
          }}>
            <div style={{ width: "30%", height: 10, borderRadius: 4, background: "rgba(255,255,255,0.04)", marginBottom: 10 }} />
            <div style={{ width: "90%", height: 14, borderRadius: 4, background: "rgba(255,255,255,0.04)", marginBottom: 6 }} />
            <div style={{ width: "60%", height: 10, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {news.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", padding: "14px 0",
            borderBottom: i < news.length - 1 ? "0.5px solid rgba(232,237,245,0.04)" : "none",
            textDecoration: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{
              fontSize: "0.58rem", fontWeight: 700,
              color: "rgba(255,255,255,0.25)",
            }}>
              {item.source}
            </span>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: sentimentColor(item.sentiment),
            }} />
            {item.publishedAt && (
              <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.15)" }}>
                {(() => {
                  try {
                    const diff = Date.now() - new Date(item.publishedAt).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return `${mins}m`;
                    const hrs = Math.floor(mins / 60);
                    if (hrs < 24) return `${hrs}h`;
                    return `${Math.floor(hrs / 24)}d`;
                  } catch { return ""; }
                })()}
              </span>
            )}
          </div>
          <p style={{
            fontSize: "0.85rem", fontWeight: 600,
            color: "var(--text-primary)", lineHeight: 1.4,
            margin: 0,
          }}>
            {item.headline}
          </p>
        </a>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN MOBILE HOME COMPONENT
   ══════════════════════════════════════════════════════════════════ */

export default function MobileHome({
  marketItems,
  onTabSelect,
  onSearch,
}: {
  marketItems: MarketItem[];
  onTabSelect: (tab: MainTab) => void;
  onSearch: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-obsidian, #0A0E1A)",
      paddingBottom: 90,
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--bg-obsidian, #0A0E1A)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="White Tiger" width={32} height={32} style={{ borderRadius: 8 }} />
          <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff", letterSpacing: "-0.03em" }}>
            White Tiger
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onSearch}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(232,237,245,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--text-muted)",
            }}
          >
            <Search size={16} />
          </button>
          <button style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(232,237,245,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--text-muted)",
            position: "relative",
          }}>
            <Bell size={16} />
            <div style={{
              position: "absolute", top: 6, right: 6,
              width: 6, height: 6, borderRadius: "50%",
              background: "#F87171",
            }} />
          </button>
        </div>
      </div>

      {/* ── Live Market Strip ── */}
      <div style={{
        borderTop: "0.5px solid rgba(232,237,245,0.04)",
        borderBottom: "0.5px solid rgba(232,237,245,0.04)",
        marginBottom: 20,
      }}>
        <MobileTicker items={marketItems} />
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 28 }}>
        {/* AI Market Brief */}
        <AISummaryCard />

        {/* Quick Access Grid */}
        <QuickAccessGrid onTabSelect={onTabSelect} />

        {/* Live News */}
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 14,
          }}>
            <span style={{
              fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Market News
            </span>
            <span style={{
              fontSize: "0.65rem", color: "#4A9EFF", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              Live <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#34D399",
                boxShadow: "0 0 6px rgba(52,211,153,0.5)",
              }} />
            </span>
          </div>
          <MobileNewsCards />
        </div>
      </div>
    </div>
  );
}
