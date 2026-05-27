"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from "lucide-react";
import { CITIES_RE, generateSparkline, type CityRE } from "@/lib/realestate";

/* ═══════════════════════════════════════════════════════════════
   GLOBAL REAL ESTATE MARKETS — Interactive Market Cards
   Apple Stocks / TradingView / Bloomberg-inspired market tiles
   ═══════════════════════════════════════════════════════════════ */

/* ─── SVG Mini Sparkline Chart ─── */
function MiniTrendChart({ data, color, height = 48, width = 140, filled = true }: {
  data: number[]; color: string; height?: number; width?: number; filled?: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((v - min) / range) * (height - 2 * pad);
    return `${x},${y}`;
  }).join(" ");

  const fillPath = filled
    ? `M${pad},${height} L${points.split(" ").map((p, i) => (i === 0 ? p : ` L${p}`)).join("")} L${width - pad},${height} Z`
    : "";

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {filled && (
        <defs>
          <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
      )}
      {filled && (
        <path d={fillPath} fill={`url(#fill-${color.replace("#", "")})`} />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Glow dot at end */}
      {data.length > 0 && (() => {
        const lastX = pad + ((data.length - 1) / (data.length - 1)) * (width - 2 * pad);
        const lastY = height - pad - ((data[data.length - 1] - min) / range) * (height - 2 * pad);
        return (
          <>
            <circle cx={lastX} cy={lastY} r={4} fill={color} opacity={0.2}>
              <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
          </>
        );
      })()}
    </svg>
  );
}

/* ─── Sentiment Badge ─── */
function SentimentDot({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    "Very Bullish": "#00c853", Bullish: "#00c853", Neutral: "#ff9800", Bearish: "#ef5350",
    Surging: "#00c853", Rising: "#00c853", Stable: "#ff9800", Cooling: "#ef5350",
  };
  const c = colors[sentiment] || "#ff9800";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6,
      background: `${c}12`, fontSize: "0.58rem", fontWeight: 700, color: c,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: c,
        boxShadow: `0 0 6px ${c}`,
        animation: "glow-pulse 2s infinite",
      }} />
      {sentiment}
    </span>
  );
}

/* ─── Single Market Card ─── */
function MarketCard({ city, onClick, isSelected }: {
  city: CityRE; onClick: () => void; isSelected: boolean;
}) {
  const sparkData = useMemo(() => generateSparkline(city.name, city.priceAppreciation), [city.name, city.priceAppreciation]);
  const isUp = city.priceAppreciation >= 0;
  const trendColor = isUp ? "#00c853" : "#ef5350";
  const sentiment = city.priceAppreciation > 15 ? "Very Bullish" : city.priceAppreciation > 8 ? "Bullish" : city.priceAppreciation > 3 ? "Neutral" : "Bearish";
  const demandTrend = city.priceAppreciation > 15 ? "Surging" : city.priceAppreciation > 10 ? "Rising" : city.priceAppreciation > 5 ? "Stable" : "Cooling";

  return (
    <div
      onClick={onClick}
      className="re-market-card"
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        background: isSelected
          ? "linear-gradient(135deg, #0a1628, #122035)"
          : "#fff",
        border: isSelected ? "2px solid #2962ff" : "1px solid var(--border)",
        boxShadow: isSelected
          ? "0 12px 40px rgba(41,98,255,0.15)"
          : "0 1px 6px rgba(0,0,0,0.04)",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isSelected ? "translateY(-4px) scale(1.01)" : "none",
        position: "relative",
      }}
    >
      {/* Glowing top accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${trendColor}, ${trendColor}60, transparent)`,
        opacity: isSelected ? 1 : 0.6,
      }} />

      {/* Header Row */}
      <div style={{
        padding: "14px 16px 0",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "1.5rem" }}>{city.flag}</span>
          <div>
            <div style={{
              fontWeight: 900, fontSize: "0.92rem",
              color: isSelected ? "#fff" : "var(--text-primary)",
            }}>{city.name}</div>
            <div style={{
              fontSize: "0.62rem",
              color: isSelected ? "rgba(255,255,255,0.5)" : "var(--text-muted)",
            }}>{city.country}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: "1.05rem", fontWeight: 900, color: trendColor,
          }}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {isUp ? "+" : ""}{city.priceAppreciation}%
          </div>
          <div style={{
            fontSize: "0.55rem", fontWeight: 600,
            color: isSelected ? "rgba(255,255,255,0.4)" : "var(--text-muted)",
          }}>Price Growth</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div style={{ padding: "6px 16px 4px", overflow: "hidden" }}>
        <MiniTrendChart data={sparkData} color={trendColor} width={260} height={52} />
      </div>

      {/* Metrics Row */}
      <div style={{
        padding: "8px 16px 12px",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6,
      }}>
        <div>
          <div style={{
            fontSize: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
            color: isSelected ? "rgba(255,255,255,0.35)" : "var(--text-muted)",
          }}>Yield</div>
          <div style={{
            fontSize: "0.82rem", fontWeight: 800,
            color: isSelected ? "#00bcd4" : "#00897b",
          }}>{city.rentalYield}%</div>
        </div>
        <div>
          <div style={{
            fontSize: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
            color: isSelected ? "rgba(255,255,255,0.35)" : "var(--text-muted)",
          }}>Score</div>
          <div style={{
            fontSize: "0.82rem", fontWeight: 800,
            color: isSelected ? "#ffd740" : (city.investmentScore >= 85 ? "#00c853" : city.investmentScore >= 70 ? "#2962ff" : "#ff9800"),
          }}>{city.investmentScore}/100</div>
        </div>
        <div>
          <div style={{
            fontSize: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
            color: isSelected ? "rgba(255,255,255,0.35)" : "var(--text-muted)",
          }}>Risk</div>
          <div style={{
            fontSize: "0.82rem", fontWeight: 800,
            color: city.riskLevel === "Low" ? "#00c853" : city.riskLevel === "Medium" ? "#ff9800" : "#ef5350",
          }}>{city.riskLevel}</div>
        </div>
      </div>

      {/* Bottom: Sentiment + Demand */}
      <div style={{
        padding: "0 16px 12px",
        display: "flex", gap: 6, alignItems: "center",
      }}>
        <SentimentDot sentiment={sentiment} />
        <SentimentDot sentiment={demandTrend} />
      </div>
    </div>
  );
}

/* ═══ MAIN EXPORT: GlobalMarketsGrid ═══ */
export function GlobalMarketsGrid({ onSelectCity }: {
  onSelectCity: (city: CityRE) => void;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "growing" | "highyield" | "emerging">("all");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Auto-refresh simulation
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(iv);
  }, []);

  const allCities = useMemo(() => {
    let cities = [...CITIES_RE].sort((a, b) => b.investmentScore - a.investmentScore);
    if (filter === "growing") cities = cities.filter(c => c.priceAppreciation > 10);
    if (filter === "highyield") cities = cities.sort((a, b) => b.rentalYield - a.rentalYield);
    if (filter === "emerging") cities = cities.filter(c => c.priceAppreciation > 12 && c.riskLevel !== "Low");
    return cities;
  }, [filter]);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{
            fontSize: "1.2rem", fontWeight: 900, margin: 0,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: "1.3rem" }}>🌍</span>
            Global Real Estate Markets
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 10px", borderRadius: 20, fontSize: "0.6rem", fontWeight: 700,
              background: "rgba(0,200,83,0.08)", color: "#00c853",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#00c853",
                animation: "glow-pulse 2s infinite",
              }} />
              LIVE
            </span>
          </h2>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "3px 0 0" }}>
            Click any market to explore deep analytics with AI intelligence
          </p>
        </div>
      </div>

      {/* Filter Pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all" as const, label: "All Markets", icon: "🌐" },
          { id: "growing" as const, label: "Fast Growing (10%+)", icon: "🚀" },
          { id: "highyield" as const, label: "High Yield", icon: "💰" },
          { id: "emerging" as const, label: "Emerging Hotspots", icon: "🔥" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 16px", borderRadius: 20,
            border: filter === f.id ? "1.5px solid #1a73e8" : "1px solid var(--border)",
            background: filter === f.id ? "linear-gradient(135deg, #1a73e8, #4285f4)" : "#fff",
            color: filter === f.id ? "#fff" : "var(--text-muted)",
            fontSize: "0.74rem", fontWeight: 700, cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: filter === f.id ? "0 2px 10px rgba(26,115,232,0.25)" : "none",
          }}>
            <span style={{ fontSize: "0.85rem" }}>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {/* Market Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 14,
      }}>
        {allCities.map(city => (
          <MarketCard
            key={city.name}
            city={city}
            isSelected={selectedName === city.name}
            onClick={() => {
              setSelectedName(city.name);
              onSelectCity(city);
              const slug = city.name.toLowerCase().replace(/\s+/g, "-");
              router.push(`/real-estate/${slug}`);
            }}
          />
        ))}
      </div>

      <style>{`
        .re-market-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 28px rgba(0,0,0,0.08) !important;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
          50% { opacity: 0.5; box-shadow: 0 0 2px currentColor; }
        }
      `}</style>
    </div>
  );
}
