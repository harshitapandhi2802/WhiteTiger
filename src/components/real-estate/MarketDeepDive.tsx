"use client";
import { useState, useMemo } from "react";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Shield, Building2,
  MapPin, Brain, ChevronRight, Factory, BarChart3, X, AlertTriangle
} from "lucide-react";
import {
  CITIES_RE, INFRA_PROJECTS, STOCK_IMPACTS, BUBBLE_METRICS,
  generateMarketData, type CityRE, type MarketDeepData, type CityArea,
} from "@/lib/realestate";

/* ═══════════════════════════════════════════════════════════════
   MARKET DEEP DIVE — Full City Analytics Page
   Interactive charts, AI insights, heatmaps, investment scores
   ═══════════════════════════════════════════════════════════════ */

/* ─── SVG Interactive Chart ─── */
function InteractiveChart({ data, labels, color, title, height = 180 }: {
  data: number[]; labels: string[]; color: string; title: string; height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const min = Math.min(...data) * 0.98;
  const max = Math.max(...data) * 1.02;
  const range = max - min || 1;
  const w = 500, pad = 30;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - 2 * pad),
    y: height - pad - ((v - min) / range) * (height - 2 * pad),
    v,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {title}
      </div>
      <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id={`cg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = height - pad - f * (height - 2 * pad);
          const val = (min + f * range).toFixed(1);
          return (
            <g key={f}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="var(--border-light, #eee)" strokeWidth={0.5} />
              <text x={pad - 4} y={y + 3} textAnchor="end" fill="#999" fontSize={8}>{val}</text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.filter((_, i) => i % 4 === 0).map((label, li) => {
          const idx = li * 4;
          if (idx >= points.length) return null;
          return (
            <text key={label} x={points[idx].x} y={height - 8} textAnchor="middle" fill="#999" fontSize={8}>{label}</text>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#cg-${color.replace("#", "")})`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover interaction zones */}
        {points.map((p, i) => (
          <g key={i}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ cursor: "crosshair" }}
          >
            <rect x={p.x - 10} y={0} width={20} height={height} fill="transparent" />
            {hoverIdx === i && (
              <>
                <line x1={p.x} y1={pad / 2} x2={p.x} y2={height - pad} stroke={color} strokeWidth={0.8} strokeDasharray="3,3" opacity={0.5} />
                <circle cx={p.x} cy={p.y} r={4} fill={color} stroke="#fff" strokeWidth={2} />
                <rect x={p.x - 22} y={p.y - 22} width={44} height={16} rx={4} fill="#1a1a2e" />
                <text x={p.x} y={p.y - 11} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={700}>{p.v.toFixed(1)}</text>
              </>
            )}
          </g>
        ))}

        {/* End dot */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={color}>
          <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

/* ─── Gauge/Score Ring ─── */
function ScoreRing({ value, label, color, size = 72 }: {
  value: number; label: string; color: string; size?: number;
}) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e8e8" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ marginTop: -size / 2 - 8, position: "relative" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 900, color }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", marginTop: size / 2 - 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

/* ─── Area Heatmap Card ─── */
function AreaHeatCard({ area, currencySymbol }: { area: CityArea; currencySymbol: string }) {
  const demandColors = { Hot: "#00c853", Warm: "#ff9800", Cool: "#78909c" };
  const typeColors = { "Ultra-Luxury": "#7c3aed", Premium: "#1a73e8", "Mid-Range": "#00897b", Affordable: "#e65100" };
  const dc = demandColors[area.demand];
  const tc = typeColors[area.type];

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      background: "#fff", border: "1px solid var(--border)",
      borderLeft: `4px solid ${dc}`,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{area.name}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <span style={{ padding: "1px 7px", borderRadius: 4, fontSize: "0.55rem", fontWeight: 700, background: `${tc}12`, color: tc }}>{area.type}</span>
            <span style={{ padding: "1px 7px", borderRadius: 4, fontSize: "0.55rem", fontWeight: 700, background: `${dc}12`, color: dc }}>
              {area.demand === "Hot" ? "🔥" : area.demand === "Warm" ? "☀️" : "❄️"} {area.demand}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#00833a" }}>+{area.growth}%</div>
          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>YoY Growth</div>
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 10px", borderRadius: 8, background: "var(--bg-secondary)",
      }}>
        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg Price:</span>
        <span style={{ fontSize: "0.85rem", fontWeight: 800 }}>{currencySymbol}{area.avgPrice.toLocaleString()}/sqft</span>
        {/* Mini bar */}
        <div style={{ flex: 1, height: 4, background: "#e5e7ed", borderRadius: 2, overflow: "hidden", marginLeft: 4 }}>
          <div style={{
            height: "100%", borderRadius: 2,
            width: `${Math.min(100, area.growth * 3)}%`,
            background: `linear-gradient(90deg, ${dc}, ${dc}60)`,
          }} />
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN EXPORT: MarketDeepDive ═══ */
export function MarketDeepDive({ city, onClose }: {
  city: CityRE; onClose: () => void;
}) {
  const [chartView, setChartView] = useState<"prices" | "rentals" | "luxury" | "commercial" | "affordability">("prices");
  const data = useMemo(() => generateMarketData(city.name, city.priceAppreciation), [city.name, city.priceAppreciation]);

  const currencySymbol = city.currency === "INR" ? "₹" : city.currency === "AED" ? "AED " : city.currency === "JPY" ? "¥" : city.currency === "GBP" ? "£" : city.currency === "SGD" ? "S$" : city.currency === "AUD" ? "A$" : "$";

  const chartDataMap = {
    prices: { d: data.timeSeries.prices, c: "#2962ff", t: "Property Price Index" },
    rentals: { d: data.timeSeries.rentals, c: "#00897b", t: "Rental Growth Index" },
    luxury: { d: data.timeSeries.luxury, c: "#7c3aed", t: "Luxury Segment Index" },
    commercial: { d: data.timeSeries.commercial, c: "#e65100", t: "Commercial Demand Index" },
    affordability: { d: data.timeSeries.affordability, c: "#c62828", t: "Affordability Index" },
  };

  const cityInfra = INFRA_PROJECTS.filter(p => p.impactCities.includes(city.name) || p.country === city.country);
  const cityBubble = BUBBLE_METRICS.find(b => b.city === city.name);

  // Find relevant stock impacts (for Indian cities show all, otherwise show general)
  const relevantStocks = city.countryCode === "IN" ? STOCK_IMPACTS : STOCK_IMPACTS.slice(0, 2);

  const sentColor = data.sentiment === "Very Bullish" ? "#00c853" : data.sentiment === "Bullish" ? "#00c853" : data.sentiment === "Neutral" ? "#ff9800" : "#ef5350";

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "2px solid #1a73e820",
      boxShadow: "0 16px 64px rgba(0,0,0,0.08)",
      background: "#fff",
      animation: "deepdive-enter 0.4s ease-out",
      marginBottom: 24,
    }}>
      {/* ═══ HERO HEADER ═══ */}
      <div style={{
        padding: "24px 28px 20px",
        background: "linear-gradient(135deg, #0a1628 0%, #1a2d45 50%, #0d2818 100%)",
        color: "#fff", position: "relative",
      }}>
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />

        <div style={{ position: "relative" }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Market Deep Dive
              </span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 10px", borderRadius: 12, fontSize: "0.58rem", fontWeight: 700,
                background: `${sentColor}20`, color: sentColor,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: sentColor, animation: "glow-pulse 2s infinite" }} />
                {data.sentiment}
              </span>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8, padding: "6px 14px", color: "#fff",
              fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              transition: "background 0.2s",
            }}>
              <X size={14} /> Close
            </button>
          </div>

          {/* City Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: "2.2rem" }}>{city.flag}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900 }}>{city.name}</h2>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>{city.country} · {city.hotSectors.join(" · ")}</div>
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {[
              { label: "Price Growth", value: `+${city.priceAppreciation}%`, color: "#00c853" },
              { label: "Rental Yield", value: `${city.rentalYield}%`, color: "#00bcd4" },
              { label: "Score", value: `${city.investmentScore}/100`, color: "#ffd740" },
              { label: "Demand", value: data.demandTrend, color: data.demandTrend === "Surging" ? "#00c853" : "#ff9800" },
              { label: "Risk", value: city.riskLevel, color: city.riskLevel === "Low" ? "#00c853" : "#ff9800" },
            ].map(m => (
              <div key={m.label} style={{
                padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT BODY ═══ */}
      <div style={{ padding: "20px 24px" }}>

        {/* 1. INTERACTIVE PRICE CHARTS */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart3 size={18} color="#2962ff" /> Price & Trend Analysis
            </h3>
          </div>

          {/* Chart type selector */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { id: "prices" as const, label: "Property Prices", icon: "📈" },
              { id: "rentals" as const, label: "Rental Growth", icon: "🏠" },
              { id: "luxury" as const, label: "Luxury Segment", icon: "💎" },
              { id: "commercial" as const, label: "Commercial", icon: "🏢" },
              { id: "affordability" as const, label: "Affordability", icon: "💰" },
            ].map(cv => (
              <button key={cv.id} onClick={() => setChartView(cv.id)} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 14px", borderRadius: 20,
                border: chartView === cv.id ? `1.5px solid ${chartDataMap[cv.id].c}` : "1px solid var(--border)",
                background: chartView === cv.id ? `${chartDataMap[cv.id].c}08` : "#fff",
                color: chartView === cv.id ? chartDataMap[cv.id].c : "var(--text-muted)",
                fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: "0.8rem" }}>{cv.icon}</span> {cv.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div style={{
            padding: "16px 18px", borderRadius: 12,
            border: "1px solid var(--border)", background: "#fafbfc",
          }}>
            <InteractiveChart
              data={chartDataMap[chartView].d}
              labels={data.timeSeries.months}
              color={chartDataMap[chartView].c}
              title={chartDataMap[chartView].t}
              height={200}
            />
          </div>

          {/* Demand momentum bar */}
          <div style={{
            marginTop: 12, padding: "10px 16px", borderRadius: 10,
            background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Demand Momentum</span>
            <div style={{ flex: 1, height: 8, background: "#e5e7ed", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                width: `${data.timeSeries.demand[data.timeSeries.demand.length - 1]}%`,
                background: `linear-gradient(90deg, #2962ff, #00c853)`,
                transition: "width 1s ease",
              }} />
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: 900, color: "#2962ff", whiteSpace: "nowrap" }}>
              {data.timeSeries.demand[data.timeSeries.demand.length - 1]}/100
            </span>
          </div>
        </div>

        {/* 2. AI MARKET SUMMARY */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <Brain size={18} color="#7c3aed" /> AI Market Intelligence
          </h3>
          <div style={{
            borderRadius: 12, overflow: "hidden",
            border: "1px solid rgba(124,58,237,0.15)",
            background: "linear-gradient(135deg, rgba(124,58,237,0.03), transparent)",
          }}>
            {data.aiSummary.map((insight, i) => (
              <div key={i} style={{
                padding: "12px 18px",
                borderBottom: i < data.aiSummary.length - 1 ? "1px solid rgba(124,58,237,0.08)" : "none",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(124,58,237,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 800, color: "#7c3aed",
                  marginTop: 1,
                }}>{i + 1}</span>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{insight}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. AREA-WISE HEATMAP */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={18} color="#e65100" /> Area-Wise Heatmap — {city.name}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {data.areas.sort((a, b) => b.growth - a.growth).map(area => (
              <AreaHeatCard key={area.name} area={area} currencySymbol={currencySymbol} />
            ))}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: 10, padding: "8px 14px", borderRadius: 8,
            background: "var(--bg-secondary)", display: "flex", gap: 14, alignItems: "center",
            fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600,
          }}>
            <span>Demand:</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00c853" }} /> Hot
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff9800" }} /> Warm
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#78909c" }} /> Cool
            </span>
          </div>
        </div>

        {/* 4. INFRASTRUCTURE IMPACT */}
        {cityInfra.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <Factory size={18} color="#0d47a1" /> Infrastructure Impact
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cityInfra.slice(0, 4).map((p, i) => {
                const statusColor = p.status === "Operational" ? "#00c853" : p.status === "Under Construction" ? "#ff9800" : "#2962ff";
                return (
                  <div key={i} style={{
                    padding: "12px 16px", borderRadius: 10,
                    border: "1px solid var(--border)", background: "#fff",
                    borderLeft: `4px solid ${statusColor}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{p.flag} {p.name}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                          <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: "0.55rem", fontWeight: 700, background: `${statusColor}12`, color: statusColor }}>{p.status}</span>
                          <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: "0.55rem", fontWeight: 700, background: "rgba(0,0,0,0.04)", color: "var(--text-muted)" }}>{p.type}</span>
                        </div>
                      </div>
                      <div style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(0,131,58,0.06)", fontSize: "0.72rem", fontWeight: 800, color: "#00833a" }}>
                        {p.priceImpact.split(" ")[0]}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{p.description.slice(0, 120)}...</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. REAL ESTATE INVESTMENT SCORE — Gauges */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <Shield size={18} color="#2962ff" /> Investment Score Analysis
          </h3>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12,
            padding: "24px 20px", borderRadius: 14,
            background: "linear-gradient(135deg, #fafbfc, #f0f2f5)",
            border: "1px solid var(--border)",
          }}>
            <ScoreRing value={data.growthScore} label="Growth" color="#00c853" />
            <ScoreRing value={data.yieldScore} label="Yield" color="#00897b" />
            <ScoreRing value={100 - data.riskScore} label="Safety" color={data.riskScore < 40 ? "#00c853" : data.riskScore < 60 ? "#ff9800" : "#ef5350"} />
            <ScoreRing value={data.infraScore} label="Infra" color="#2962ff" />
            <ScoreRing value={data.futureScore} label="Future" color="#7c3aed" />
          </div>

          {/* Radar-style summary */}
          <div style={{
            marginTop: 10, padding: "12px 18px", borderRadius: 10,
            background: "#fff", border: "1px solid var(--border)",
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8,
          }}>
            {[
              { label: "Growth Score", value: data.growthScore, color: "#00c853" },
              { label: "Yield Score", value: data.yieldScore, color: "#00897b" },
              { label: "Risk Score", value: data.riskScore, color: data.riskScore < 40 ? "#00c853" : "#ef5350" },
              { label: "Infra Score", value: data.infraScore, color: "#2962ff" },
              { label: "Future Score", value: data.futureScore, color: "#7c3aed" },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ height: 6, background: "#e5e7ed", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${s.value}%`,
                    background: `linear-gradient(90deg, ${s.color}, ${s.color}80)`,
                    transition: "width 1s ease",
                  }} />
                </div>
                <div style={{ fontSize: "0.68rem", fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}/100</div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. STOCK MARKET IMPACT */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={18} color="#2962ff" /> Stock Market Impact — {city.name}
          </h3>
          <div style={{
            padding: "14px 18px", borderRadius: 12,
            background: "linear-gradient(135deg, rgba(41,98,255,0.03), transparent)",
            border: "1px solid rgba(41,98,255,0.1)", marginBottom: 10,
          }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.6 }}>
              {city.priceAppreciation > 10
                ? `Strong ${city.name} housing demand may benefit construction, banking, and building materials stocks. RE activity in ${city.name} is at multi-year highs.`
                : `${city.name} real estate market showing moderate activity. Select banking and infrastructure stocks may see indirect benefits from stable property demand.`}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {relevantStocks.slice(0, 3).map(si => {
              const sc = si.currentSignal === "Bullish" ? "#00c853" : "#ff9800";
              return (
                <div key={si.sector} style={{
                  padding: "12px 16px", borderRadius: 10,
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${sc}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: "1.1rem" }}>{si.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>{si.sector}</span>
                    <span style={{
                      padding: "1px 8px", borderRadius: 8, fontSize: "0.55rem", fontWeight: 700,
                      background: `${sc}12`, color: sc, marginLeft: "auto",
                    }}>{si.currentSignal}</span>
                  </div>
                  {si.stocks.slice(0, 2).map(s => (
                    <div key={s.ticker} style={{
                      padding: "4px 0", fontSize: "0.72rem", color: "var(--text-muted)",
                      display: "flex", justifyContent: "space-between",
                    }}>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 700,
                        color: s.impact === "Positive" ? "#00833a" : "#e65100",
                      }}>{s.impact}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bubble Risk Warning (if applicable) */}
        {cityBubble && cityBubble.riskLevel !== "Low" && (
          <div style={{
            padding: "14px 18px", borderRadius: 12, marginBottom: 16,
            background: cityBubble.riskLevel === "Extreme" ? "rgba(213,0,0,0.04)" : cityBubble.riskLevel === "High" ? "rgba(255,23,68,0.04)" : "rgba(255,152,0,0.04)",
            border: `1px solid ${cityBubble.riskLevel === "Extreme" ? "#d5000020" : cityBubble.riskLevel === "High" ? "#ff174420" : "#ff980020"}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <AlertTriangle size={14} color={cityBubble.riskLevel === "Extreme" ? "#d50000" : "#ff9800"} />
              <span style={{ fontWeight: 800, fontSize: "0.82rem" }}>Bubble Risk: {cityBubble.riskLevel}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Overvaluation: {cityBubble.overvaluation}% · Speculation Index: {cityBubble.speculationIndex}/100 · Correction Probability: {cityBubble.correctionProbability}%
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes deepdive-enter {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
