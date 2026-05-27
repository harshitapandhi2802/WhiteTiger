"use client";
import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CITIES_RE, COUNTRIES_RE, SECTORS_RE, INFRA_PROJECTS, STOCK_IMPACTS,
  BUBBLE_METRICS, CAPITAL_FLOWS, MORTGAGE_DATA, AI_INSIGHTS, REITS,
  generateMarketData, generateSparkline,
  generateCityGrowthIntelligence, GLOBAL_POWER_MAP, POWER_MAP_CATEGORIES,
  generateREStories, generateRECopilot, MACRO_ENGINE,
  type CityRE, type CountryRE, type CityArea,
  type CityGrowthIntelligence, type PowerMapCity, type REStory, type RECopilotNarrative, type MacroFactor,
} from "@/lib/realestate";

/* ═══════════════════════════════════════════════════════════════
   FULL-SCREEN REAL ESTATE INTELLIGENCE PAGE
   /real-estate/[location] — Immersive city/country terminal
   ═══════════════════════════════════════════════════════════════ */

/* ─── Resolve location slug to city or country ─── */
function resolveLocation(slug: string): { city?: CityRE; country?: CountryRE; name: string } {
  const decoded = decodeURIComponent(slug).toLowerCase().replace(/-/g, " ");
  const city = CITIES_RE.find(c => c.name.toLowerCase() === decoded);
  if (city) return { city, name: city.name };
  const country = COUNTRIES_RE.find(c => c.name.toLowerCase() === decoded || c.code.toLowerCase() === decoded);
  if (country) {
    // For countries, try to find the primary city
    const primaryCity = CITIES_RE.find(c => c.countryCode === country.code);
    return { country, city: primaryCity, name: country.name };
  }
  // Fuzzy match
  const fuzzyCity = CITIES_RE.find(c => c.name.toLowerCase().includes(decoded) || decoded.includes(c.name.toLowerCase()));
  if (fuzzyCity) return { city: fuzzyCity, name: fuzzyCity.name };
  return { name: decoded };
}

/* ─── SVG Interactive Chart (Full Width) ─── */
function FullChart({ data, labels, color, title, height = 220 }: {
  data: number[]; labels: string[]; color: string; title: string; height?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const min = Math.min(...data) * 0.97;
  const max = Math.max(...data) * 1.03;
  const range = max - min || 1;
  const w = 700, pad = 40;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - 2 * pad),
    y: height - pad - ((v - min) / range) * (height - 2 * pad),
    v,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`;
  const uid = `fc-${color.replace("#", "")}-${title.replace(/\s/g, "")}`;

  return (
    <div>
      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        {title}
      </div>
      <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = height - pad - f * (height - 2 * pad);
          return (
            <g key={f}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e5e7ed" strokeWidth={0.5} />
              <text x={pad - 6} y={y + 4} textAnchor="end" fill="#aaa" fontSize={9}>{(min + f * range).toFixed(1)}</text>
            </g>
          );
        })}
        {labels.filter((_, i) => i % 3 === 0).map((label, li) => {
          const idx = li * 3;
          if (idx >= points.length) return null;
          return <text key={`${label}-${li}`} x={points[idx].x} y={height - 10} textAnchor="middle" fill="#aaa" fontSize={9}>{label}</text>;
        })}
        <path d={areaD} fill={`url(#${uid})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: "crosshair" }}>
            <rect x={p.x - 12} y={0} width={24} height={height} fill="transparent" />
            {hoverIdx === i && (
              <>
                <line x1={p.x} y1={pad / 2} x2={p.x} y2={height - pad} stroke={color} strokeWidth={1} strokeDasharray="4,4" opacity={0.4} />
                <circle cx={p.x} cy={p.y} r={5} fill={color} stroke="#fff" strokeWidth={2.5} />
                <rect x={p.x - 28} y={p.y - 26} width={56} height={20} rx={6} fill="#0d1117" />
                <text x={p.x} y={p.y - 13} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={700}>{p.v.toFixed(1)}</text>
              </>
            )}
          </g>
        ))}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={5} fill={color}>
          <animate attributeName="r" values="5;8;5" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

/* ─── Score Ring Gauge ─── */
function ScoreRing({ value, label, color, size = 90 }: {
  value: number; label: string; color: string; size?: number;
}) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8eaed" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div style={{ marginTop: -(size / 2) - 10, position: "relative" }}>
        <div style={{ fontSize: "1.3rem", fontWeight: 900, color }}>{value}</div>
      </div>
      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", marginTop: (size / 2) - 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

/* ─── Mini Sparkline ─── */
function Spark({ data, color, w = 120, h = 36 }: { data: number[]; color: string; w?: number; h?: number }) {
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Property Segment Card ─── */
const SEGMENTS = [
  { name: "Residential", icon: "🏠", desc: "Housing, apartments, villas, gated communities", color: "#2962ff" },
  { name: "Commercial Office", icon: "🏢", desc: "IT parks, co-working, Grade A office spaces", color: "#00695c" },
  { name: "Retail", icon: "🏬", desc: "Malls, high-street retail, mixed-use developments", color: "#e65100" },
  { name: "Warehousing & Logistics", icon: "🏭", desc: "Warehouses, fulfillment centers, cold storage", color: "#1565c0" },
  { name: "Luxury", icon: "💎", desc: "Ultra-premium residences, branded properties", color: "#7c3aed" },
  { name: "Data Centers & REITs", icon: "🖥️", desc: "Digital infrastructure, listed real estate trusts", color: "#c62828" },
];

/* ═══════════════════ MAIN PAGE COMPONENT ═══════════════════ */
export default function RealEstateLocationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params.location as string) || "";
  const { city, country, name } = resolveLocation(slug);

  const [activeSection, setActiveSection] = useState("copilot");
  const [chartType, setChartType] = useState<"prices" | "rentals" | "luxury" | "commercial" | "affordability">("prices");
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"beginner" | "institutional">("beginner");
  const [expandedGrowth, setExpandedGrowth] = useState<string | null>(null);
  const [powerMapFilter, setPowerMapFilter] = useState("all");
  const [expandedStory, setExpandedStory] = useState<number | null>(null);
  const [expandedMacro, setExpandedMacro] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Build data from city (primary) or country
  const effectiveCity = city;
  const appreciation = effectiveCity?.priceAppreciation ?? country?.priceAppreciation ?? 8;
  const deepData = useMemo(() => generateMarketData(effectiveCity?.name ?? name, appreciation), [effectiveCity, name, appreciation]);
  const sparkData = useMemo(() => generateSparkline(effectiveCity?.name ?? name, appreciation), [effectiveCity, name, appreciation]);

  // NEW: AI intelligence engines
  const growthIntel = useMemo(() => generateCityGrowthIntelligence(effectiveCity?.name ?? name), [effectiveCity, name]);
  const stories = useMemo(() => generateREStories(effectiveCity?.name ?? name), [effectiveCity, name]);
  const copilot = useMemo(() => generateRECopilot(effectiveCity?.name ?? name), [effectiveCity, name]);

  const flag = effectiveCity?.flag ?? country?.flag ?? "🌍";
  const displayName = effectiveCity?.name ?? country?.name ?? name;
  const countryName = effectiveCity?.country ?? country?.region ?? "";
  const rentalYield = effectiveCity?.rentalYield ?? country?.rentalYield ?? 4;
  const investmentScore = effectiveCity?.investmentScore ?? country?.investmentScore ?? 70;
  const riskLevel = effectiveCity?.riskLevel ?? country?.risk ?? "Medium";
  const currencySymbol = effectiveCity?.currency === "INR" ? "₹" : effectiveCity?.currency === "JPY" ? "¥" : effectiveCity?.currency === "GBP" ? "£" : effectiveCity?.currency === "SGD" ? "S$" : effectiveCity?.currency === "AUD" ? "A$" : effectiveCity?.currency === "AED" ? "AED " : "$";

  const sentColor = deepData.sentiment === "Very Bullish" ? "#00c853" : deepData.sentiment === "Bullish" ? "#00c853" : deepData.sentiment === "Neutral" ? "#ff9800" : "#ef5350";

  // Related infra
  const infra = INFRA_PROJECTS.filter(p =>
    (effectiveCity && p.impactCities.includes(effectiveCity.name)) ||
    (country && p.country === country.name) ||
    p.name.toLowerCase().includes(displayName.toLowerCase())
  );

  // Related stocks
  const stocks = effectiveCity?.countryCode === "IN" ? STOCK_IMPACTS : STOCK_IMPACTS.slice(0, 3);

  // Bubble data
  const bubble = BUBBLE_METRICS.find(b => b.city === displayName);

  // Related capital flows
  const flows = CAPITAL_FLOWS.filter(f =>
    f.destination.toLowerCase().includes(displayName.toLowerCase()) ||
    f.source.toLowerCase().includes(displayName.toLowerCase()) ||
    (country && (f.destination.includes(country.name) || f.source.includes(country.name)))
  );

  // Related mortgage
  const mortgage = MORTGAGE_DATA.find(m =>
    (effectiveCity && m.country === effectiveCity.country) || (country && m.country === country.name)
  );

  // Related REITs
  const reits = REITS.filter(r =>
    (effectiveCity && r.country === effectiveCity.country) || (country && r.country === country.name)
  );

  // Cities in this country (for country pages)
  const countryCities = country ? CITIES_RE.filter(c => c.countryCode === country.code) : [];

  // Chart data map
  const charts = {
    prices: { d: deepData.timeSeries.prices, c: "#2962ff", t: "Property Price Index (Base 100)" },
    rentals: { d: deepData.timeSeries.rentals, c: "#00897b", t: "Rental Growth Index" },
    luxury: { d: deepData.timeSeries.luxury, c: "#7c3aed", t: "Luxury Segment Performance" },
    commercial: { d: deepData.timeSeries.commercial, c: "#e65100", t: "Commercial Demand Index" },
    affordability: { d: deepData.timeSeries.affordability, c: "#c62828", t: "Affordability Index (↑ = more affordable)" },
  };

  const navSections = [
    { id: "copilot", label: "AI Copilot", icon: "🧠" },
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "growth", label: "Growth Engine", icon: "🔬" },
    { id: "charts", label: "Price Charts", icon: "📈" },
    { id: "areas", label: "Area Heatmap", icon: "🗺️" },
    { id: "powermap", label: "Power Map", icon: "🌐" },
    { id: "stories", label: "AI Stories", icon: "📰" },
    { id: "infra", label: "Infrastructure", icon: "🚧" },
    { id: "segments", label: "Property Segments", icon: "🏗️" },
    { id: "scores", label: "Investment Scores", icon: "🎯" },
    { id: "stocks", label: "Stock Impact", icon: "💹" },
    { id: "macro", label: "Macro Engine", icon: "🏦" },
    { id: "intelligence", label: "AI Intelligence", icon: "🤖" },
  ];

  if (!effectiveCity && !country) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 40 }}>
        <div style={{ fontSize: "3rem" }}>🏠</div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 900 }}>Market Not Found</h1>
        <p style={{ color: "var(--text-muted)" }}>No data available for &quot;{name}&quot;</p>
        <Link href="/analyze" style={{ padding: "10px 24px", borderRadius: 12, background: "#2962ff", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem" }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f9fa",
      opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease",
    }}>

      {/* ═══════════════ CINEMATIC HERO ═══════════════ */}
      <div style={{
        background: "linear-gradient(135deg, #0a0f1c 0%, #0d1f2d 30%, #1a3a2a 60%, #0a1628 100%)",
        padding: "0 0 32px", position: "relative", overflow: "hidden",
      }}>
        {/* Animated grid overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        {/* Gradient glow */}
        <div style={{
          position: "absolute", top: -100, right: -100, width: 400, height: 400,
          borderRadius: "50%", background: `radial-gradient(circle, ${sentColor}15, transparent 70%)`,
          filter: "blur(60px)",
        }} />

        {/* Top nav bar */}
        <div style={{
          position: "relative", padding: "16px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <Link href="/analyze" style={{
            display: "flex", alignItems: "center", gap: 8,
            color: "rgba(255,255,255,0.6)", textDecoration: "none",
            fontSize: "0.82rem", fontWeight: 600,
            padding: "6px 16px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            transition: "all 0.2s",
          }}>
            ← White Tiger Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 14px", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700,
              background: `${sentColor}18`, color: sentColor,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: sentColor, boxShadow: `0 0 8px ${sentColor}`, animation: "pulse-glow 2s infinite" }} />
              {deepData.sentiment}
            </span>
            {/* Beginner / Institutional toggle */}
            <div style={{
              display: "flex", borderRadius: 20, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
              {(["beginner", "institutional"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: "4px 14px", border: "none", cursor: "pointer",
                  fontSize: "0.65rem", fontWeight: 700, textTransform: "capitalize",
                  background: mode === m ? "rgba(41,98,255,0.6)" : "rgba(255,255,255,0.04)",
                  color: mode === m ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: "all 0.2s",
                }}>
                  {m === "beginner" ? "🎓 " : "🏛️ "}{m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ position: "relative", padding: "40px 40px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40 }}>
            {/* Left: Title + summary */}
            <div style={{ flex: 1, maxWidth: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: "3rem", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>{flag}</span>
                <div>
                  <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
                    {displayName}
                  </h1>
                  <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.45)", fontWeight: 500, marginTop: 4 }}>
                    {countryName}{effectiveCity ? ` · ${effectiveCity.hotSectors.join(" · ")}` : ""}
                  </div>
                </div>
              </div>

              {/* AI one-liner */}
              <div style={{
                padding: "12px 18px", borderRadius: 12, marginBottom: 20,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, fontStyle: "italic",
              }}>
                🤖 {deepData.aiSummary[0]}
              </div>

              {/* Key Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "Price Growth", value: `+${appreciation}%`, color: "#00c853" },
                  { label: "Rental Yield", value: `${rentalYield}%`, color: "#00bcd4" },
                  { label: "Investment Score", value: `${investmentScore}/100`, color: "#ffd740" },
                  { label: "Demand Trend", value: deepData.demandTrend, color: deepData.demandTrend === "Surging" ? "#00c853" : "#ff9800" },
                  { label: "Risk Level", value: riskLevel, color: riskLevel === "Low" ? "#00c853" : riskLevel === "Medium" ? "#ff9800" : "#ef5350" },
                  { label: "Future Score", value: `${deepData.futureScore}/100`, color: "#7c3aed" },
                ].map(m => (
                  <div key={m.label} style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{m.label}</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 900, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live sparkline */}
            <div style={{
              width: 320, padding: "20px 24px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Property Price Trend
              </div>
              <HeroSparkline data={sparkData} color="#00c853" />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.3)" }}>24M Change</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: appreciation >= 0 ? "#00c853" : "#ef5350" }}>
                    {appreciation >= 0 ? "+" : ""}{appreciation}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.3)" }}>Momentum</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffd740" }}>{deepData.demandTrend}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.3)" }}>Avg $/sqft</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>
                    {effectiveCity ? `${currencySymbol}${effectiveCity.avgPriceSqft.toLocaleString()}` : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation — Sticky */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", gap: 4, padding: "12px 40px 0",
          overflowX: "auto", background: "linear-gradient(135deg, #0a0f1c, #0d1f2d)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          {navSections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "10px 18px", borderRadius: "12px 12px 0 0",
              border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: activeSection === s.id ? "#f8f9fa" : "rgba(255,255,255,0.04)",
              color: activeSection === s.id ? "var(--text-primary, #1a1a2e)" : "rgba(255,255,255,0.5)",
              fontSize: "0.78rem", fontWeight: 700,
              transition: "all 0.2s",
              borderBottom: activeSection === s.id ? "none" : "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontSize: "0.9rem" }}>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════ CONTENT BODY ═══════════════ */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px 60px" }}>

        {/* ═══ AI COPILOT ═══ */}
        {activeSection === "copilot" && (
          <div>
            {/* Copilot Hero Card */}
            <div style={{
              borderRadius: 18, overflow: "hidden", marginBottom: 24,
              background: "linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d2137 100%)",
              border: "1px solid rgba(41,98,255,0.2)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            }}>
              <div style={{ padding: "28px 32px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: "1.5rem" }}>🧠</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#fff" }}>
                      AI Real Estate Copilot — {displayName}
                    </h2>
                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      Continuous intelligence · Updated every 5 min · {mode === "beginner" ? "Beginner Mode" : "Institutional Mode"}
                    </div>
                  </div>
                </div>

                {/* Main Narrative */}
                <div style={{
                  padding: "18px 22px", borderRadius: 14, marginBottom: 16,
                  background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "1.3rem" }}>{copilot.moodEmoji}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: copilot.moodColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Market Mood: {copilot.marketMood}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", lineHeight: 1.5, marginBottom: 10 }}>
                    {copilot.headline}
                  </div>
                  <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>
                    {mode === "beginner" ? copilot.beginnerStory : copilot.institutionalBrief}
                  </div>
                </div>

                {/* Opportunities Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                  {copilot.opportunities.map((opp, i) => {
                    const colors = ["#00c853", "#2962ff", "#ff9800", "#7c3aed", "#00bcd4"];
                    const c = colors[i % colors.length];
                    return (
                      <div key={i} style={{
                        padding: "14px 18px", borderRadius: 12,
                        background: `${c}08`, border: `1px solid ${c}20`,
                      }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: c, marginBottom: 6, textTransform: "uppercase" }}>
                          Opportunity {i + 1}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                          {opp}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Items */}
              <div style={{
                padding: "16px 32px 24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(255,255,255,0.4)", marginBottom: 10, textTransform: "uppercase" }}>
                  🎯 Recommended Actions
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {copilot.actionItems.map((action, i) => (
                    <div key={i} style={{
                      padding: "8px 16px", borderRadius: 10,
                      background: "rgba(0,200,83,0.08)", border: "1px solid rgba(0,200,83,0.15)",
                      fontSize: "0.78rem", fontWeight: 700, color: "#69f0ae",
                    }}>
                      ✅ {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Warning */}
            {copilot.riskWarning && (
              <div style={{
                borderRadius: 16, padding: "20px 24px", marginBottom: 20,
                background: "rgba(239,83,80,0.03)", border: "1px solid rgba(239,83,80,0.12)",
              }}>
                <h3 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 12px", color: "#ef5350" }}>
                  ⚠️ Risk Warning
                </h3>
                <div style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: "rgba(239,83,80,0.04)", borderLeft: "3px solid #ef5350",
                  fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6,
                }}>
                  {copilot.riskWarning}
                </div>
              </div>
            )}

            {/* Copilot Composite Scores Quick View */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "24px 28px",
              border: "1px solid var(--border)", marginBottom: 20,
            }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 16px" }}>
                📊 AI Composite Scores
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {[
                  { label: "Growth", value: growthIntel.growthScore, color: "#00c853" },
                  { label: "Future", value: growthIntel.futurePotentialScore, color: "#7c3aed" },
                  { label: "Smart Money", value: growthIntel.smartMoneyScore, color: "#2962ff" },
                  { label: "Infra Momentum", value: growthIntel.infraMomentumScore, color: "#00897b" },
                  { label: "Bubble Risk", value: growthIntel.bubbleRiskScore, color: "#ffd740" },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <ScoreRing value={s.value} label={s.label} color={s.color} size={82} />
                  </div>
                ))}
              </div>
            </div>

            {/* Beginner Summary */}
            {mode === "beginner" && (
              <div style={{
                background: "linear-gradient(135deg, rgba(41,98,255,0.04), rgba(124,58,237,0.04))",
                borderRadius: 16, padding: "20px 24px",
                border: "1px solid rgba(41,98,255,0.1)",
              }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 10px", color: "#2962ff" }}>
                  🎓 What This Means for You
                </h3>
                <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {growthIntel.beginnerSummary}
                </div>
              </div>
            )}
            {mode === "institutional" && (
              <div style={{
                background: "#fff", borderRadius: 16, padding: "20px 24px",
                border: "1px solid var(--border)",
              }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 10px" }}>
                  🏛️ Investment Verdict
                </h3>
                <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {growthIntel.investmentVerdict}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ OVERVIEW ═══ */}
        {activeSection === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
            {/* Left column */}
            <div>
              {/* Quick chart */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--border)", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                <FullChart data={charts.prices.d} labels={deepData.timeSeries.months} color="#2962ff" title="Property Price Trend" height={200} />
              </div>

              {/* AI Insights */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--border)", marginBottom: 20 }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
                  🤖 AI Market Intelligence
                </h3>
                {deepData.aiSummary.map((insight, i) => (
                  <div key={i} style={{
                    padding: "10px 16px", marginBottom: 8, borderRadius: 10,
                    background: i === 0 ? "rgba(124,58,237,0.04)" : "var(--bg-secondary)",
                    borderLeft: `3px solid ${i === 0 ? "#7c3aed" : "#e5e7ed"}`,
                    fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6,
                  }}>
                    {insight}
                  </div>
                ))}
              </div>

              {/* Country cities (for country pages) */}
              {countryCities.length > 1 && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--border)", marginBottom: 20 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 14px" }}>🏙️ Key Cities</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                    {countryCities.map(c => {
                      const sc = c.investmentScore >= 85 ? "#00c853" : c.investmentScore >= 70 ? "#2962ff" : "#ff9800";
                      const sp = generateSparkline(c.name, c.priceAppreciation);
                      return (
                        <Link key={c.name} href={`/real-estate/${c.name.toLowerCase().replace(/\s+/g, "-")}`} style={{
                          padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border)",
                          textDecoration: "none", color: "inherit", display: "block",
                          transition: "all 0.2s",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{c.flag} {c.name}</div>
                              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Score: <strong style={{ color: sc }}>{c.investmentScore}</strong></div>
                            </div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#00833a" }}>+{c.priceAppreciation}%</div>
                          </div>
                          <Spark data={sp} color={sc} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top areas */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 900, margin: "0 0 14px" }}>🗺️ Top Growth Areas</h3>
                {deepData.areas.sort((a, b) => b.growth - a.growth).slice(0, 4).map(area => {
                  const dc = area.demand === "Hot" ? "#00c853" : area.demand === "Warm" ? "#ff9800" : "#78909c";
                  return (
                    <div key={area.name} style={{
                      padding: "10px 14px", marginBottom: 8, borderRadius: 10,
                      border: "1px solid var(--border)", borderLeft: `4px solid ${dc}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem" }}>{area.name}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{area.type} · {currencySymbol}{area.avgPrice.toLocaleString()}/sqft</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700, background: `${dc}12`, color: dc }}>
                          {area.demand === "Hot" ? "🔥" : "☀️"} {area.demand}
                        </span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 900, color: "#00833a" }}>+{area.growth}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right sidebar */}
            <div>
              {/* Investment Scores */}
              <div style={{ background: "#fff", borderRadius: 16, padding: "20px 20px", border: "1px solid var(--border)", marginBottom: 16 }}>
                <h4 style={{ fontSize: "0.82rem", fontWeight: 800, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Investment Scores</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <ScoreRing value={deepData.growthScore} label="Growth" color="#00c853" size={78} />
                  <ScoreRing value={deepData.yieldScore} label="Yield" color="#00897b" size={78} />
                  <ScoreRing value={100 - deepData.riskScore} label="Safety" color={deepData.riskScore < 40 ? "#00c853" : "#ff9800"} size={78} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                  <ScoreRing value={deepData.infraScore} label="Infra" color="#2962ff" size={78} />
                  <ScoreRing value={deepData.futureScore} label="Future" color="#7c3aed" size={78} />
                </div>
              </div>

              {/* Bubble Risk */}
              {bubble && (
                <div style={{
                  borderRadius: 16, padding: "16px 20px", marginBottom: 16,
                  background: bubble.riskLevel === "Extreme" ? "rgba(213,0,0,0.04)" : bubble.riskLevel === "High" ? "rgba(255,23,68,0.04)" : "#fff",
                  border: `1px solid ${bubble.riskLevel === "Low" ? "var(--border)" : bubble.riskLevel === "Moderate" ? "#ff980020" : "#ff174420"}`,
                }}>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 800, margin: "0 0 10px", color: "var(--text-muted)" }}>⚠️ Bubble Risk</h4>
                  {[
                    { label: "Risk Level", value: bubble.riskLevel, color: bubble.riskLevel === "Low" ? "#00c853" : bubble.riskLevel === "Moderate" ? "#ff9800" : "#ef5350" },
                    { label: "Overvaluation", value: `${bubble.overvaluation}%`, color: bubble.overvaluation > 15 ? "#c62828" : "#00833a" },
                    { label: "Speculation", value: `${bubble.speculationIndex}/100`, color: bubble.speculationIndex > 60 ? "#c62828" : "#ff9800" },
                    { label: "Correction Prob", value: `${bubble.correctionProbability}%`, color: bubble.correctionProbability > 30 ? "#c62828" : "#ff9800" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border-light, #eee)" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.label}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Mortgage */}
              {mortgage && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", border: "1px solid var(--border)", marginBottom: 16 }}>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 800, margin: "0 0 10px", color: "var(--text-muted)" }}>🏠 Mortgage Snapshot</h4>
                  <div style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: 4 }}>{mortgage.rate}%</div>
                  <div style={{ fontSize: "0.68rem", color: mortgage.trend === "Falling" ? "#00833a" : "#c62828", fontWeight: 700, marginBottom: 8 }}>
                    {mortgage.trend === "Falling" ? "📉" : "📈"} {mortgage.trend} · {mortgage.change3M >= 0 ? "+" : ""}{mortgage.change3M}% (3M)
                  </div>
                  <div style={{
                    padding: "8px 12px", borderRadius: 8, fontSize: "0.72rem", lineHeight: 1.5,
                    color: "var(--text-muted)", background: "var(--bg-secondary)",
                  }}>
                    {mortgage.rationale}
                  </div>
                  <div style={{
                    marginTop: 8, textAlign: "center", padding: "6px 12px", borderRadius: 20,
                    background: mortgage.buyRecommendation === "Buy" ? "#e8faf0" : "#fff8e8",
                    color: mortgage.buyRecommendation === "Buy" ? "#00833a" : "#e65100",
                    fontSize: "0.78rem", fontWeight: 800,
                  }}>
                    {mortgage.buyRecommendation === "Buy" ? "✅" : "⏳"} {mortgage.buyRecommendation}
                  </div>
                </div>
              )}

              {/* Smart Money Flows */}
              {flows.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", border: "1px solid var(--border)" }}>
                  <h4 style={{ fontSize: "0.82rem", fontWeight: 800, margin: "0 0 10px", color: "var(--text-muted)" }}>💰 Capital Flows</h4>
                  {flows.slice(0, 3).map((f, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: i < flows.length - 1 ? "1px solid var(--border-light, #eee)" : "none" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, marginBottom: 2 }}>
                        {f.source} → {f.destination}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{f.sector}</span>
                        <span style={{ fontSize: "0.78rem", fontWeight: 900 }}>{f.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ CITY GROWTH INTELLIGENCE ═══ */}
        {activeSection === "growth" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 4px" }}>
              🔬 City Growth Intelligence Engine — {displayName}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 6 }}>
              10 dimensions of analysis · 5 composite scores · AI-powered
            </p>
            {mode === "beginner" && (
              <div style={{
                padding: "10px 16px", borderRadius: 10, marginBottom: 16,
                background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)",
                fontSize: "0.78rem", color: "#1a73e8", lineHeight: 1.6,
              }}>
                🎓 <strong>How to read:</strong> Each dimension shows WHY this city is growing (or not). Click any card to see the full breakdown.
              </div>
            )}

            {/* WHY narrative cards */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24,
            }}>
              <div style={{
                padding: "18px 22px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(0,200,83,0.04), transparent)",
                border: "1px solid rgba(0,200,83,0.12)",
              }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#00c853", textTransform: "uppercase", marginBottom: 8 }}>
                  Why {displayName} is Growing
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {growthIntel.whyGrowing}
                </div>
              </div>
              <div style={{
                padding: "18px 22px", borderRadius: 14,
                background: "linear-gradient(135deg, rgba(41,98,255,0.04), transparent)",
                border: "1px solid rgba(41,98,255,0.12)",
              }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#2962ff", textTransform: "uppercase", marginBottom: 8 }}>
                  Why {displayName} Matters Globally
                </div>
                <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  {growthIntel.whyImportant}
                </div>
              </div>
            </div>

            {/* Composite Scores Bar */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "24px 28px", marginBottom: 20,
              border: "1px solid var(--border)",
            }}>
              <h3 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 18px", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                Composite AI Scores
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
                {[
                  { label: "Growth", value: growthIntel.growthScore, color: "#00c853" },
                  { label: "Future Potential", value: growthIntel.futurePotentialScore, color: "#7c3aed" },
                  { label: "Smart Money", value: growthIntel.smartMoneyScore, color: "#2962ff" },
                  { label: "Infra Momentum", value: growthIntel.infraMomentumScore, color: "#00897b" },
                  { label: "Bubble Risk", value: growthIntel.bubbleRiskScore, color: "#ffd740" },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)" }}>{s.label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 900, color: s.color }}>{s.value}</span>
                    </div>
                    <div style={{ height: 8, background: "#e5e7ed", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        width: `${s.value}%`,
                        background: `linear-gradient(90deg, ${s.color}, ${s.color}80)`,
                        transition: "width 1.2s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 10 Dimension Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
              {([
                { name: "Job Creation", ...growthIntel.jobCreation },
                { name: "Migration", ...growthIntel.migration },
                { name: "Infrastructure", ...growthIntel.infrastructure },
                { name: "Startup Ecosystem", ...growthIntel.startupEcosystem },
                { name: "Commercial Demand", ...growthIntel.commercialDemand },
                { name: "Affordability", ...growthIntel.affordability },
                { name: "Luxury Demand", ...growthIntel.luxuryDemand },
                { name: "Rental Market", ...growthIntel.rentalMarket },
                { name: "Traffic Expansion", ...growthIntel.trafficExpansion },
                { name: "Metro Growth", ...growthIntel.metroGrowth },
              ] as Array<{ name: string; score: number; trend: string; insight: string; beginnerTip: string }>).map(dim => {
                const isOpen = expandedGrowth === dim.name;
                const sc = dim.score >= 80 ? "#00c853" : dim.score >= 60 ? "#2962ff" : dim.score >= 40 ? "#ff9800" : "#ef5350";
                return (
                  <div key={dim.name} style={{
                    borderRadius: 14, overflow: "hidden", background: "#fff",
                    border: isOpen ? `2px solid ${sc}` : "1px solid var(--border)",
                    transition: "all 0.3s",
                  }}>
                    <button onClick={() => setExpandedGrowth(isOpen ? null : dim.name)} style={{
                      width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
                      background: isOpen ? `${sc}05` : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${sc}10`, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.95rem", fontWeight: 900, color: sc,
                      }}>
                        {dim.score}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>{dim.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>
                          Trend: <strong style={{ color: dim.trend === "Accelerating" ? "#00c853" : dim.trend === "Stable" ? "#ff9800" : "#ef5350" }}>{dim.trend}</strong>
                        </div>
                      </div>
                      <span style={{
                        fontSize: "1.2rem", transition: "transform 0.3s",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: "var(--text-muted)",
                      }}>▾</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 20px 18px", borderTop: `1px solid ${sc}10` }}>
                        <div style={{
                          padding: "12px 16px", borderRadius: 10, marginTop: 10,
                          background: "var(--bg-secondary)", fontSize: "0.82rem",
                          color: "var(--text-secondary)", lineHeight: 1.7,
                        }}>
                          {dim.insight}
                        </div>
                        {mode === "beginner" && dim.beginnerTip && (
                          <div style={{
                            padding: "10px 14px", borderRadius: 8, marginTop: 8,
                            background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)",
                            fontSize: "0.75rem", color: "#1a73e8", lineHeight: 1.6,
                          }}>
                            🎓 <strong>Beginner tip:</strong> {dim.beginnerTip}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PRICE CHARTS ═══ */}
        {activeSection === "charts" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { id: "prices" as const, label: "Property Prices", icon: "📈" },
                { id: "rentals" as const, label: "Rental Growth", icon: "🏠" },
                { id: "luxury" as const, label: "Luxury Segment", icon: "💎" },
                { id: "commercial" as const, label: "Commercial", icon: "🏢" },
                { id: "affordability" as const, label: "Affordability", icon: "💰" },
              ].map(cv => (
                <button key={cv.id} onClick={() => setChartType(cv.id)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 20px", borderRadius: 24,
                  border: chartType === cv.id ? `2px solid ${charts[cv.id].c}` : "1px solid var(--border)",
                  background: chartType === cv.id ? `${charts[cv.id].c}08` : "#fff",
                  color: chartType === cv.id ? charts[cv.id].c : "var(--text-muted)",
                  fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                  boxShadow: chartType === cv.id ? `0 2px 12px ${charts[cv.id].c}20` : "none",
                }}>
                  <span>{cv.icon}</span> {cv.label}
                </button>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", border: "1px solid var(--border)" }}>
              <FullChart data={charts[chartType].d} labels={deepData.timeSeries.months} color={charts[chartType].c} title={charts[chartType].t} height={280} />
            </div>
            {/* Demand bar */}
            <div style={{ marginTop: 16, padding: "14px 24px", borderRadius: 12, background: "#fff", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>Demand Momentum</span>
              <div style={{ flex: 1, height: 10, background: "#e5e7ed", borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 5, width: `${deepData.timeSeries.demand[deepData.timeSeries.demand.length - 1]}%`, background: "linear-gradient(90deg, #2962ff, #00c853)", transition: "width 1s" }} />
              </div>
              <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#2962ff" }}>{deepData.timeSeries.demand[deepData.timeSeries.demand.length - 1]}/100</span>
            </div>
            {/* Multi-chart comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              {(["rentals", "luxury", "commercial", "affordability"] as const).filter(k => k !== chartType).slice(0, 2).map(k => (
                <div key={k} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border)" }}>
                  <FullChart data={charts[k].d} labels={deepData.timeSeries.months} color={charts[k].c} title={charts[k].t} height={160} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ AREA HEATMAP ═══ */}
        {activeSection === "areas" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>🗺️ Area-Wise Intelligence — {displayName}</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>Explore growth hotspots, premium zones, and high-demand areas</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {deepData.areas.sort((a, b) => b.growth - a.growth).map(area => {
                const dc = area.demand === "Hot" ? "#00c853" : area.demand === "Warm" ? "#ff9800" : "#78909c";
                const tc = area.type === "Ultra-Luxury" ? "#7c3aed" : area.type === "Premium" ? "#1a73e8" : area.type === "Mid-Range" ? "#00897b" : "#e65100";
                return (
                  <div key={area.name} style={{
                    padding: "18px 22px", borderRadius: 14, background: "#fff",
                    border: "1px solid var(--border)", borderLeft: `5px solid ${dc}`,
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{area.name}</div>
                        <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.6rem", fontWeight: 700, background: `${tc}10`, color: tc }}>{area.type}</span>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.6rem", fontWeight: 700, background: `${dc}10`, color: dc }}>
                            {area.demand === "Hot" ? "🔥" : area.demand === "Warm" ? "☀️" : "❄️"} {area.demand}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#00833a" }}>+{area.growth}%</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>YoY Growth</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--bg-secondary)" }}>
                      <div>
                        <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg Price</div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 800 }}>{currencySymbol}{area.avgPrice.toLocaleString()}/sqft</div>
                      </div>
                      <div style={{ flex: 1, height: 6, background: "#e5e7ed", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(100, area.growth * 2.5)}%`, background: `linear-gradient(90deg, ${dc}, ${dc}60)` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ GLOBAL POWER MAP ═══ */}
        {activeSection === "powermap" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>🌐 Global Real Estate Power Map</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Top cities ranked by category — fastest growing, luxury hubs, commercial powerhouses
            </p>

            {/* Category filter pills */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {POWER_MAP_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setPowerMapFilter(cat.id)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 16px", borderRadius: 20,
                  border: powerMapFilter === cat.id ? "1.5px solid #2962ff" : "1px solid var(--border)",
                  background: powerMapFilter === cat.id ? "linear-gradient(135deg, #2962ff, #4285f4)" : "#fff",
                  color: powerMapFilter === cat.id ? "#fff" : "var(--text-muted)",
                  fontSize: "0.74rem", fontWeight: 700, cursor: "pointer",
                  boxShadow: powerMapFilter === cat.id ? "0 2px 10px rgba(41,98,255,0.2)" : "none",
                  transition: "all 0.2s",
                }}>
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Power Map Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
              {GLOBAL_POWER_MAP
                .filter(pm => powerMapFilter === "all" || pm.categories.includes(powerMapFilter))
                .map((pm, i) => {
                  const isCurrent = pm.city === displayName;
                  const rankColors = ["#ffd740", "#c0c0c0", "#cd7f32", "#2962ff", "#00897b"];
                  const trendC = pm.trend === "Rising" ? "#00c853" : pm.trend === "Stable" ? "#ff9800" : "#ef5350";
                  return (
                    <div key={pm.city} style={{
                      padding: "20px 24px", borderRadius: 14,
                      background: isCurrent ? "linear-gradient(135deg, #0a1628, #122035)" : "#fff",
                      border: isCurrent ? "2px solid #2962ff" : "1px solid var(--border)",
                      color: isCurrent ? "#fff" : "inherit",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: `${rankColors[Math.min(i, 4)]}15`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 900, fontSize: "0.88rem",
                            color: rankColors[Math.min(i, 4)],
                          }}>
                            #{pm.globalRank}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                              {pm.flag} {pm.city}
                            </div>
                            <div style={{
                              fontSize: "0.62rem",
                              color: isCurrent ? "rgba(255,255,255,0.4)" : "var(--text-muted)",
                            }}>
                              {pm.keyMetric}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 180 }}>
                          {pm.categories.slice(0, 2).map(cat => (
                            <span key={cat} style={{
                              padding: "2px 8px", borderRadius: 6, fontSize: "0.55rem", fontWeight: 700,
                              background: cat.includes("Growing") || cat.includes("Growth") ? "rgba(0,200,83,0.08)" : cat.includes("Luxury") ? "rgba(124,58,237,0.08)" : cat.includes("Hub") ? "rgba(41,98,255,0.08)" : "rgba(255,152,0,0.08)",
                              color: cat.includes("Growing") || cat.includes("Growth") ? "#00c853" : cat.includes("Luxury") ? "#7c3aed" : cat.includes("Hub") ? "#2962ff" : "#ff9800",
                            }}>
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{
                        fontSize: "0.78rem", lineHeight: 1.6, marginBottom: 12,
                        color: isCurrent ? "rgba(255,255,255,0.65)" : "var(--text-muted)",
                      }}>
                        {pm.whyImportant}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{
                          padding: "4px 12px", borderRadius: 8, fontSize: "0.68rem", fontWeight: 700,
                          background: `${trendC}10`, color: trendC,
                        }}>
                          {pm.trend === "Rising" ? "📈" : pm.trend === "Stable" ? "➡️" : "📉"} {pm.trend}
                        </span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: isCurrent ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                          Global Rank #{pm.globalRank}
                        </span>
                      </div>
                      {isCurrent && (
                        <div style={{
                          marginTop: 10, padding: "6px 12px", borderRadius: 8,
                          background: "rgba(41,98,255,0.15)", textAlign: "center",
                          fontSize: "0.68rem", fontWeight: 700, color: "#82b1ff",
                        }}>
                          📍 You are viewing this market
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ═══ AI STORIES ═══ */}
        {activeSection === "stories" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>📰 AI Story Engine — {displayName}</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>
              AI-generated narratives explaining market dynamics, infrastructure impact, and investment opportunities
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {stories.map((story, i) => {
                const isOpen = expandedStory === i;
                const catColors: Record<string, string> = {
                  Infrastructure: "#2962ff", "City Growth": "#00c853", Luxury: "#7c3aed",
                  Affordability: "#ef5350", Macro: "#ff9800", "Smart Money": "#00897b",
                  Migration: "#1a73e8", Commercial: "#e65100",
                };
                const sc = catColors[story.category] || "#2962ff";
                const sentC = story.sentiment === "Bullish" ? "#00c853" : story.sentiment === "Bearish" ? "#ef5350" : "#ff9800";

                return (
                  <div key={i} style={{
                    borderRadius: 14, overflow: "hidden", background: "#fff",
                    border: isOpen ? `2px solid ${sc}` : "1px solid var(--border)",
                    transition: "all 0.3s",
                  }}>
                    <button onClick={() => setExpandedStory(isOpen ? null : i)} style={{
                      width: "100%", padding: "18px 24px", display: "flex", alignItems: "flex-start", gap: 14,
                      background: isOpen ? `${sc}04` : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: `${sc}08`, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.3rem",
                      }}>
                        {story.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700, background: `${sc}10`, color: sc }}>{story.category}</span>
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700, background: `${sentC}10`, color: sentC }}>{story.sentiment}</span>
                          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>{story.timestamp}</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 4 }}>{story.title}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                          {story.body.slice(0, 120)}...
                        </div>
                      </div>
                      <span style={{
                        fontSize: "1.2rem", transition: "transform 0.3s", flexShrink: 0,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: "var(--text-muted)",
                      }}>▾</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 24px 20px", borderTop: `1px solid ${sc}10` }}>
                        <div style={{
                          padding: "14px 18px", borderRadius: 12, marginTop: 12,
                          background: "var(--bg-secondary)",
                          fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.8,
                        }}>
                          {story.body}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ INFRASTRUCTURE ═══ */}
        {activeSection === "infra" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>🚧 Infrastructure Impact Engine</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>How metros, airports, highways, and smart cities are driving property prices</p>
            {infra.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", background: "#fff", borderRadius: 16, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>🏗️</div>
                <div style={{ color: "var(--text-muted)" }}>No tracked infrastructure projects for {displayName} yet.</div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {infra.map((p, i) => {
                const sc = p.status === "Operational" ? "#00c853" : p.status === "Under Construction" ? "#ff9800" : "#2962ff";
                const typeC: Record<string, string> = { Metro: "#1565c0", Airport: "#0d47a1", Highway: "#00695c", "Smart City": "#6a1b9a", "Industrial Corridor": "#e65100", Rail: "#c62828", Port: "#00838f" };
                return (
                  <div key={i} style={{ padding: "20px 24px", borderRadius: 14, background: "#fff", border: "1px solid var(--border)", borderLeft: `5px solid ${typeC[p.type] || "#666"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 5 }}>{p.flag} {p.name}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ padding: "2px 10px", borderRadius: 8, fontSize: "0.65rem", fontWeight: 700, background: `${typeC[p.type]}12`, color: typeC[p.type] }}>{p.type}</span>
                          <span style={{ padding: "2px 10px", borderRadius: 8, fontSize: "0.65rem", fontWeight: 700, background: `${sc}12`, color: sc }}>{p.status}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Investment</div>
                        <div style={{ fontSize: "1rem", fontWeight: 900 }}>{p.investment}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 12px" }}>{p.description}</p>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(0,131,58,0.06)", fontSize: "0.78rem", fontWeight: 800, color: "#00833a" }}>📈 {p.priceImpact}</span>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Completion: <strong>{p.completion}</strong></span>
                      {p.impactCities.map(c => (
                        <Link key={c} href={`/real-estate/${c.toLowerCase().replace(/\s+/g, "-")}`} style={{ padding: "2px 10px", borderRadius: 8, fontSize: "0.65rem", fontWeight: 700, background: "rgba(26,115,232,0.06)", color: "#1a73e8", textDecoration: "none" }}>{c}</Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PROPERTY SEGMENTS ═══ */}
        {activeSection === "segments" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>🏗️ Property Segment Analytics</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>Expandable analytics for each real estate segment</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SEGMENTS.map(seg => {
                const isExpanded = expandedSegment === seg.name;
                const sector = SECTORS_RE.find(s => s.name.toLowerCase().includes(seg.name.toLowerCase().split(" ")[0]));
                return (
                  <div key={seg.name} style={{
                    borderRadius: 14, overflow: "hidden", background: "#fff",
                    border: isExpanded ? `2px solid ${seg.color}` : "1px solid var(--border)",
                    transition: "all 0.3s",
                  }}>
                    <button onClick={() => setExpandedSegment(isExpanded ? null : seg.name)} style={{
                      width: "100%", padding: "16px 24px", display: "flex", alignItems: "center", gap: 14,
                      background: isExpanded ? `${seg.color}06` : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                    }}>
                      <span style={{ fontSize: "1.6rem" }}>{seg.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{seg.name}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{seg.desc}</div>
                      </div>
                      {sector && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: "0.65rem", fontWeight: 700, background: sector.outlook === "Bullish" ? "#e8faf0" : "#fff8e8", color: sector.outlook === "Bullish" ? "#00833a" : "#e65100" }}>
                            {sector.outlook}
                          </span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#00833a" }}>{sector.growth5Y}% 5Y</span>
                        </div>
                      )}
                      <span style={{
                        fontSize: "1.2rem", transition: "transform 0.3s",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }}>▾</span>
                    </button>
                    {isExpanded && sector && (
                      <div style={{ padding: "0 24px 20px", borderTop: `1px solid ${seg.color}15` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16, marginBottom: 14 }}>
                          {[
                            { l: "Global Yield", v: `${sector.globalYield}%`, c: "#00897b" },
                            { l: "5Y Growth", v: `${sector.growth5Y}%`, c: "#00833a" },
                            { l: "Risk", v: sector.riskLevel, c: sector.riskLevel === "Low" ? "#00c853" : "#ff9800" },
                            { l: "Momentum", v: sector.momentum, c: sector.momentum === "Strong" ? "#00c853" : "#ff9800" },
                          ].map(m => (
                            <div key={m.l} style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "10px 14px" }}>
                              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 3 }}>{m.l}</div>
                              <div style={{ fontSize: "0.92rem", fontWeight: 800, color: m.c }}>{m.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          <strong>Key Driver:</strong> {sector.keyDriver} · <strong>Top Markets:</strong> {sector.topMarkets.join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ INVESTMENT SCORES ═══ */}
        {activeSection === "scores" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>🎯 Investment Score Analysis</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>AI-generated composite scores across 5 dimensions</p>
            <div style={{ background: "#fff", borderRadius: 16, padding: "32px 40px", border: "1px solid var(--border)", marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                <ScoreRing value={deepData.growthScore} label="Growth" color="#00c853" size={100} />
                <ScoreRing value={deepData.yieldScore} label="Rental Yield" color="#00897b" size={100} />
                <ScoreRing value={100 - deepData.riskScore} label="Safety" color={deepData.riskScore < 40 ? "#00c853" : "#ff9800"} size={100} />
                <ScoreRing value={deepData.infraScore} label="Infrastructure" color="#2962ff" size={100} />
                <ScoreRing value={deepData.futureScore} label="Future Potential" color="#7c3aed" size={100} />
              </div>
            </div>
            {/* Score bars */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px 32px", border: "1px solid var(--border)" }}>
              {[
                { label: "Growth Momentum", value: deepData.growthScore, color: "#00c853", desc: "Based on price appreciation, transaction volume, and market velocity" },
                { label: "Rental Yield Attractiveness", value: deepData.yieldScore, color: "#00897b", desc: "Comparing rental returns to global benchmarks and risk-free rates" },
                { label: "Risk Assessment (lower = safer)", value: deepData.riskScore, color: deepData.riskScore < 40 ? "#00c853" : deepData.riskScore < 60 ? "#ff9800" : "#ef5350", desc: "Currency risk, political stability, regulatory environment, bubble metrics" },
                { label: "Infrastructure Development", value: deepData.infraScore, color: "#2962ff", desc: "Metro connectivity, airport proximity, smart city investments, industrial corridors" },
                { label: "Future Growth Potential", value: deepData.futureScore, color: "#7c3aed", desc: "AI-projected 5-year outlook based on demographics, urbanization, and capital flows" },
              ].map(s => (
                <div key={s.label} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{s.label}</span>
                    <span style={{ fontSize: "0.88rem", fontWeight: 900, color: s.color }}>{s.value}/100</span>
                  </div>
                  <div style={{ height: 10, background: "#e5e7ed", borderRadius: 5, overflow: "hidden", marginBottom: 3 }}>
                    <div style={{ height: "100%", borderRadius: 5, width: `${s.value}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}80)`, transition: "width 1.2s ease" }} />
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STOCK IMPACT ═══ */}
        {activeSection === "stocks" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>💹 Real Estate → Stock Market Impact</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>
              How {displayName} real estate trends affect listed companies
            </p>
            {/* AI Summary Box */}
            <div style={{
              padding: "16px 22px", borderRadius: 14, marginBottom: 20,
              background: "linear-gradient(135deg, rgba(41,98,255,0.04), transparent)",
              border: "1px solid rgba(41,98,255,0.12)",
            }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, lineHeight: 1.6 }}>
                🤖 {appreciation > 10
                  ? `Strong ${displayName} housing demand is driving significant revenue growth for construction materials, banking, and infrastructure companies. Cement volumes, mortgage disbursements, and paint demand are all at multi-year highs.`
                  : `${displayName} real estate activity is moderate. Banking and infrastructure stocks may see gradual benefits from steady property transaction volumes.`}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {stocks.map(si => {
                const sc = si.currentSignal === "Bullish" ? "#00c853" : si.currentSignal === "Bearish" ? "#ef5350" : "#ff9800";
                return (
                  <div key={si.sector} style={{
                    padding: "20px 24px", borderRadius: 14, background: "#fff",
                    border: "1px solid var(--border)", borderLeft: `5px solid ${sc}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "1.5rem" }}>{si.icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "1rem" }}>{si.sector}</div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                            RE Correlation: <strong style={{ color: si.reCorrelation > 0.7 ? "#00c853" : "#ff9800" }}>{si.reCorrelation.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                      <span style={{ padding: "5px 16px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 800, background: `${sc}12`, color: sc }}>{si.currentSignal}</span>
                    </div>
                    {/* Flow diagram */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 14px", borderRadius: 10, background: "var(--bg-secondary)" }}>
                      <span style={{ fontSize: "0.9rem" }}>🏠</span>
                      <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${sc}, ${sc}30)`, position: "relative" }}>
                        <div style={{ position: "absolute", right: -4, top: -4, width: 10, height: 10, borderRadius: "50%", background: sc }} />
                      </div>
                      <span style={{ fontSize: "0.9rem" }}>{si.icon}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>RE Activity → {si.sector} Revenue</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                      {si.stocks.map(s => {
                        const ic = s.impact === "Positive" ? "#00c853" : s.impact === "Negative" ? "#ef5350" : "#ff9800";
                        return (
                          <div key={s.ticker} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border-light, #eee)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{s.name}</span>
                              <span style={{ padding: "2px 10px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: `${ic}10`, color: ic }}>{s.impact}</span>
                            </div>
                            <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 3 }}>{s.ticker}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{s.reason}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ MACRO ENGINE ═══ */}
        {activeSection === "macro" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>🏦 Real Estate Macro Intelligence Engine</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>
              How interest rates, inflation, RBI policy, and urbanization affect {displayName} property markets
            </p>

            {mode === "beginner" && (
              <div style={{
                padding: "12px 18px", borderRadius: 12, marginBottom: 20,
                background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)",
                fontSize: "0.82rem", color: "#1a73e8", lineHeight: 1.6,
              }}>
                🎓 <strong>Why macro matters:</strong> When interest rates go up, home loans get expensive and property demand falls. When inflation rises, construction costs increase. These macro forces move entire markets.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MACRO_ENGINE.map(macro => {
                const isOpen = expandedMacro === macro.name;
                const dirC = macro.impactOnRE === "Positive" ? "#00c853" : macro.impactOnRE === "Negative" ? "#ef5350" : "#ff9800";
                const trendC = macro.trend === "Rising" ? "#ef5350" : macro.trend === "Falling" ? "#00c853" : "#ff9800";

                return (
                  <div key={macro.name} style={{
                    borderRadius: 14, overflow: "hidden", background: "#fff",
                    border: isOpen ? `2px solid ${dirC}` : "1px solid var(--border)",
                    transition: "all 0.3s",
                  }}>
                    <button onClick={() => setExpandedMacro(isOpen ? null : macro.name)} style={{
                      width: "100%", padding: "18px 24px", display: "flex", alignItems: "center", gap: 14,
                      background: isOpen ? `${dirC}04` : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `${dirC}08`, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.5rem",
                      }}>
                        {macro.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 4 }}>{macro.name}</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{
                            padding: "2px 10px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700,
                            background: `${dirC}10`, color: dirC,
                          }}>
                            {macro.impactOnRE === "Positive" ? "↑ Positive" : macro.impactOnRE === "Negative" ? "↓ Negative" : "↔ Mixed"} for RE
                          </span>
                          <span style={{
                            padding: "2px 10px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700,
                            background: `${trendC}10`, color: trendC,
                          }}>
                            📊 {macro.trend}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", marginRight: 8 }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-primary)" }}>{macro.currentValue}</div>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Current</div>
                      </div>
                      <span style={{
                        fontSize: "1.2rem", transition: "transform 0.3s",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        color: "var(--text-muted)",
                      }}>▾</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 24px 20px", borderTop: `1px solid ${dirC}10` }}>
                        {/* Impact explanation */}
                        <div style={{
                          padding: "14px 18px", borderRadius: 10, marginTop: 12,
                          background: "var(--bg-secondary)",
                          fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7,
                        }}>
                          <strong>How it affects {displayName}:</strong> {macro.explanation}
                        </div>

                        {/* Beginner explanation */}
                        {mode === "beginner" && (
                          <div style={{
                            padding: "10px 14px", borderRadius: 8, marginTop: 10,
                            background: "rgba(41,98,255,0.04)", border: "1px solid rgba(41,98,255,0.08)",
                            fontSize: "0.75rem", color: "#1a73e8", lineHeight: 1.6,
                          }}>
                            🎓 <strong>In simple terms:</strong> {macro.beginnerTip}
                          </div>
                        )}

                        {/* Affected cities */}
                        {macro.affectedCities.length > 0 && (
                          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)" }}>Affected:</span>
                            {macro.affectedCities.map(c => (
                              <span key={c} style={{
                                padding: "3px 10px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700,
                                background: c === displayName ? "rgba(41,98,255,0.1)" : "var(--bg-secondary)",
                                color: c === displayName ? "#2962ff" : "var(--text-muted)",
                                border: c === displayName ? "1px solid rgba(41,98,255,0.2)" : "none",
                              }}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ AI INTELLIGENCE ═══ */}
        {activeSection === "intelligence" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 6px" }}>🤖 AI Real Estate Intelligence Feed</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>Live AI-generated insights for {displayName} and related markets</p>

            {/* Primary city insights */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                {displayName} Intelligence
              </h3>
              {deepData.aiSummary.map((insight, i) => {
                const colors = ["#7c3aed", "#2962ff", "#00897b", "#e65100"];
                return (
                  <div key={i} style={{
                    padding: "14px 20px", marginBottom: 10, borderRadius: 12,
                    background: "#fff", border: "1px solid var(--border)",
                    borderLeft: `4px solid ${colors[i % colors.length]}`,
                    fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6,
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: `${colors[i % colors.length]}08`, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "0.72rem", fontWeight: 800, color: colors[i % colors.length],
                    }}>{i + 1}</span>
                    <div>{insight}</div>
                  </div>
                );
              })}
            </div>

            {/* Global insights */}
            <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Global Market Intelligence
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
              {AI_INSIGHTS.map((ins, i) => {
                const tc = ins.type === "opportunity" ? "#00c853" : ins.type === "risk" ? "#ef5350" : ins.type === "trend" ? "#2962ff" : "#ff9800";
                return (
                  <div key={i} style={{
                    padding: "16px 20px", borderRadius: 12, background: "#fff",
                    border: "1px solid var(--border)", borderLeft: `4px solid ${tc}`,
                  }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700, background: `${tc}12`, color: tc, textTransform: "uppercase" }}>{ins.type}</span>
                      <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>{ins.region} · {ins.timestamp}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: 6 }}>{ins.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{ins.body.slice(0, 120)}...</div>
                  </div>
                );
              })}
            </div>

            {/* REITs if available */}
            {reits.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  📊 Related REITs
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {reits.map(r => (
                    <div key={r.ticker} style={{
                      padding: "14px 18px", borderRadius: 12, background: "#fff",
                      border: "1px solid var(--border)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{r.flag} {r.name}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{r.ticker} · {r.type}</div>
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 800, color: r.change >= 0 ? "#00833a" : "#c62828" }}>
                          {r.change >= 0 ? "+" : ""}{r.change}%
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "6px 8px" }}>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Yield</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#00695c" }}>{r.dividendYield}%</div>
                        </div>
                        <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "6px 8px" }}>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>Occ</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800 }}>{r.occupancy}%</div>
                        </div>
                        <div style={{ background: "var(--bg-secondary)", borderRadius: 6, padding: "6px 8px" }}>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>P/NAV</div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: r.pNav > 1 ? "#c62828" : "#00833a" }}>{r.pNav.toFixed(2)}x</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ ANIMATIONS ═══ */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
        }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
    </div>
  );
}

/* ─── Hero Sparkline (wider, for dark background) ─── */
function HeroSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 280, h = 70;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pad = 4;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - mn) / rng) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(" ");

  const fillPath = `M${pad},${h} L${points.split(" ").map((p, i) => (i === 0 ? p : ` L${p}`)).join("")} L${w - pad},${h} Z`;

  return (
    <svg width={w} height={h} style={{ display: "block", width: "100%" }}>
      <defs>
        <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#hero-fill)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const lastParts = points.split(" ").pop()?.split(",");
        if (!lastParts) return null;
        return (
          <>
            <circle cx={Number(lastParts[0])} cy={Number(lastParts[1])} r={5} fill={color} opacity={0.3}>
              <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={Number(lastParts[0])} cy={Number(lastParts[1])} r={3} fill={color} />
          </>
        );
      })()}
    </svg>
  );
}
