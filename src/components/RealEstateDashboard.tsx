"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Globe, AlertTriangle, Building2, MapPin, ArrowUpRight,
  ArrowDownRight, ChevronDown, Zap, Shield, Activity, BarChart3,
  DollarSign, Landmark, Factory, Brain, ChevronRight, Eye, Search,
  ArrowLeft, Star, Map, Home
} from "lucide-react";
import {
  COUNTRIES_RE, CITIES_RE, SECTORS_RE, CAPITAL_FLOWS, MACRO_CORRELATIONS,
  RISK_FACTORS, AI_INSIGHTS, INSTITUTIONAL_INDICATORS, RE_REGIONS,
  INFRA_PROJECTS, REITS, BUBBLE_METRICS, MORTGAGE_DATA, STOCK_IMPACTS,
  getCountriesByRegion, getTopOpportunities,
  INDIA_STATES, WORLD_REGIONS, INDIA_RE_STATS,
  getAllIndiaCities, getTopIndiaCities, getStateByCode,
  type CountryRE, type CityRE, type IndiaState, type IndiaCity, type WorldRegion
} from "@/lib/realestate";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — INDIA-FIRST REAL ESTATE INTELLIGENCE
   India as primary focus, World as secondary
   ═══════════════════════════════════════════════════════════════ */

type MainView = "landing" | "india" | "world" | "state-detail" | "city-detail" |
  "world-region" | "sectors" | "infra" | "reits" | "bubble" | "mortgage" | "stocks" | "capital" | "macro" | "risk" | "insights";

export function RealEstateDashboard() {
  const router = useRouter();
  const [view, setView] = useState<MainView>("landing");
  const [selectedState, setSelectedState] = useState<IndiaState | null>(null);
  const [selectedCity, setSelectedCity] = useState<IndiaCity | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<WorldRegion | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const topIndiaCities = useMemo(() => getTopIndiaCities(8), []);
  const allIndiaCities = useMemo(() => getAllIndiaCities(), []);

  const filteredStates = useMemo(() => {
    if (!searchQuery) return INDIA_STATES;
    const q = searchQuery.toLowerCase();
    return INDIA_STATES.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.capital.toLowerCase().includes(q) ||
      s.majorCities.some(c => c.name.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Navigation helpers
  const goLanding = () => { setView("landing"); setSelectedState(null); setSelectedCity(null); setSelectedRegion(null); setSearchQuery(""); };
  const goIndia = () => { setView("india"); setSelectedState(null); setSelectedCity(null); setSearchQuery(""); };
  const goWorld = () => { setView("world"); setSelectedRegion(null); setExpandedCountry(null); };
  const goState = (state: IndiaState) => { setSelectedState(state); setSelectedCity(null); setView("state-detail"); };
  const goCity = (city: IndiaCity) => { setSelectedCity(city); setView("city-detail"); };
  const goRegion = (region: WorldRegion) => { setSelectedRegion(region); setView("world-region"); };

  // Back button logic
  const getBackAction = () => {
    switch (view) {
      case "india": return { label: "Home", action: goLanding };
      case "world": return { label: "Home", action: goLanding };
      case "state-detail": return { label: "India", action: goIndia };
      case "city-detail": return { label: selectedState?.name || "India", action: selectedState ? () => goState(selectedState) : goIndia };
      case "world-region": return { label: "World", action: goWorld };
      default: return { label: "Home", action: goLanding };
    }
  };

  return (
    <div style={{ minHeight: "100%" }}>
      {/* ═══ BREADCRUMB / BACK ═══ */}
      {view !== "landing" && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={getBackAction().action} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px",
            borderRadius: 20, border: "1px solid var(--border)", background: "var(--bg-card)",
            fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", color: "var(--text-secondary)",
          }}>
            <ArrowLeft size={14} /> {getBackAction().label}
          </button>
          {view === "state-detail" && selectedState && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>/ {selectedState.name}</span>
          )}
          {view === "city-detail" && selectedCity && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              / {selectedCity.state} / {selectedCity.name}
            </span>
          )}
          {view === "world-region" && selectedRegion && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>/ {selectedRegion.name}</span>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          LANDING — India (Primary) + World (Secondary)
          ═══════════════════════════════════════════════════════ */}
      {view === "landing" && (
        <>
          {/* Hero */}
          <div style={{
            borderRadius: 16, overflow: "hidden", marginBottom: 20,
            background: "linear-gradient(135deg, #0a1628 0%, #1a2a3a 40%, #0d2838 100%)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: 0, opacity: 0.04,
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
            <div style={{ position: "relative", padding: "28px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#34D399",
                  boxShadow: "0 0 8px #34D399", animation: "pulse 2s infinite",
                }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Real Estate Intelligence Engine
                </span>
              </div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", margin: "0 0 8px", lineHeight: 1.2 }}>
                Property Market Intelligence
              </h1>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
                AI-powered real estate analysis across {INDIA_STATES.length} Indian states, {allIndiaCities.length}+ cities, and {WORLD_REGIONS.length} global regions. Where should your money go?
              </p>

              {/* Quick Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
                {[
                  { label: "India Market Size", value: INDIA_RE_STATS.industrySize, sub: `${INDIA_RE_STATS.annualGrowth} growth`, color: "#34D399" },
                  { label: "Top State", value: INDIA_RE_STATS.topPerformingState, sub: "Highest appreciation", color: "#4A9EFF" },
                  { label: "Avg Mortgage Rate", value: INDIA_RE_STATS.avgMortgageRate, sub: "Home loans", color: "#FBBF24" },
                  { label: "RERA Projects", value: "1.12L+", sub: "Registered projects", color: "#818CF8" },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 900, color: "#fff", marginBottom: 2 }}>{s.value}</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: s.color }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── INDIA (Primary Card) + WORLD (Secondary Card) ── */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* India Card — Large, Primary */}
            <div onClick={goIndia} style={{
              borderRadius: 16, overflow: "hidden", cursor: "pointer",
              background: "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)",
              border: "1px solid rgba(74,158,255,0.2)", position: "relative",
              transition: "all 0.3s", minHeight: 220,
            }}>
              <div style={{
                position: "absolute", top: 12, right: 16,
                fontSize: "4rem", opacity: 0.08, lineHeight: 1,
              }}>
                IN
              </div>
              <div style={{ padding: "28px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: "2.5rem" }}>🇮🇳</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>India</h2>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{INDIA_STATES.length} States & UTs · {allIndiaCities.length}+ Cities</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 16px" }}>
                  Complete India real estate intelligence — state-by-state analysis, city-level deep dives, investment scores, AI growth predictions, and infrastructure impact mapping.
                </p>

                {/* Top India Cities Strip */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {topIndiaCities.slice(0, 6).map(c => (
                    <span key={c.slug} style={{
                      padding: "4px 10px", borderRadius: 8, fontSize: "0.68rem", fontWeight: 700,
                      background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)",
                    }}>
                      {c.name} <span style={{ color: "#34D399" }}>+{c.appreciation}%</span>
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>MARKET SIZE</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#34D399" }}>{INDIA_RE_STATS.industrySize}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>GDP SHARE</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#4A9EFF" }}>{INDIA_RE_STATS.gdpContribution}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>AVG YIELD</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#FBBF24" }}>{INDIA_RE_STATS.avgRentalYield}</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: "#4A9EFF", fontSize: "0.78rem", fontWeight: 700 }}>
                    Explore India <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* World Card — Secondary */}
            <div onClick={goWorld} style={{
              borderRadius: 16, overflow: "hidden", cursor: "pointer",
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              border: "1px solid rgba(129,140,248,0.2)", position: "relative",
              transition: "all 0.3s", minHeight: 220,
            }}>
              <div style={{
                position: "absolute", top: 12, right: 16,
                fontSize: "3rem", opacity: 0.08, lineHeight: 1,
              }}>
                WORLD
              </div>
              <div style={{ padding: "28px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: "2rem" }}>🌍</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#fff" }}>World</h2>
                    <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>{WORLD_REGIONS.length} Regions · {COUNTRIES_RE.length} Countries</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 16px" }}>
                  Global markets organized by region — Asia-Pacific, Middle East, Europe, Americas.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {WORLD_REGIONS.slice(0, 4).map(r => (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", borderRadius: 8,
                      background: "rgba(255,255,255,0.05)",
                    }}>
                      <span style={{ fontSize: "1rem" }}>{r.icon}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", flex: 1 }}>{r.name}</span>
                      <span style={{ fontSize: "0.6rem", color: r.color, fontWeight: 600 }}>{r.countries.length} countries</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#818CF8", fontSize: "0.75rem", fontWeight: 700, marginTop: 12 }}>
                  Explore Global <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* ── TOP INDIA CITIES — Quick Cards ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  Top Indian Cities by Investment Score
                </h2>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "2px 0 0" }}>AI-ranked cities with highest growth + yield combination</p>
              </div>
              <button onClick={goIndia} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 20,
                background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.15)",
                color: "#4A9EFF", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
              }}>All States <ChevronRight size={14} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {topIndiaCities.map((city, i) => {
                const scoreColor = city.investmentScore >= 85 ? "#34D399" : city.investmentScore >= 70 ? "#4A9EFF" : "#FBBF24";
                return (
                  <div key={city.slug} onClick={() => { goCity(city); setSelectedState(INDIA_STATES.find(s => s.name === city.state) || null); }} style={{
                    borderRadius: 14, overflow: "hidden", cursor: "pointer",
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    transition: "all 0.25s",
                  }}>
                    <div style={{
                      padding: "14px 16px 10px",
                      background: `linear-gradient(135deg, ${scoreColor}08, transparent)`,
                      borderBottom: `2px solid ${scoreColor}20`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          {i === 0 && <span style={{ fontSize: "0.55rem", fontWeight: 800, padding: "1px 6px", borderRadius: 4, background: "#FBBF24", color: "#000", marginBottom: 4, display: "inline-block" }}>#1</span>}
                          <div style={{ fontWeight: 900, fontSize: "1rem", color: "var(--text-primary)" }}>{city.name}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{city.state} · Tier {city.tier}</div>
                        </div>
                        <div style={{
                          padding: "6px 10px", borderRadius: 10,
                          background: `${scoreColor}15`, textAlign: "center",
                        }}>
                          <div style={{ fontSize: "1.15rem", fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{city.investmentScore}</div>
                          <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>SCORE</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "10px 16px 14px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Growth</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#34D399" }}>+{city.appreciation}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Yield</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#4A9EFF" }}>{city.rentalYield}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg/sqft</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>{city.avgPriceSqft > 9999 ? `${(city.avgPriceSqft / 1000).toFixed(1)}K` : city.avgPriceSqft.toLocaleString("en-IN")}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{city.aiOneLiner.slice(0, 70)}...</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── EXPLORE MORE — Nav Grid ── */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 900, margin: "0 0 12px", color: "var(--text-muted)" }}>Intelligence Modules</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {[
                { id: "sectors" as MainView, label: "Sectors", icon: "🏢", color: "#34D399" },
                { id: "infra" as MainView, label: "Infrastructure", icon: "🚧", color: "#4A9EFF" },
                { id: "reits" as MainView, label: "REIT Analytics", icon: "🏛", color: "#818CF8" },
                { id: "bubble" as MainView, label: "Bubble Detector", icon: "⚠", color: "#F87171" },
                { id: "mortgage" as MainView, label: "Mortgage Engine", icon: "🏠", color: "#FBBF24" },
                { id: "stocks" as MainView, label: "Stock Impact", icon: "📊", color: "#4A9EFF" },
                { id: "capital" as MainView, label: "Capital Flows", icon: "💰", color: "#34D399" },
                { id: "insights" as MainView, label: "AI Insights", icon: "🧠", color: "#818CF8" },
              ].map(nav => (
                <button key={nav.id} onClick={() => setView(nav.id)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "12px 14px",
                  borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)",
                  cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                }}>
                  <span style={{ fontSize: "1.1rem" }}>{nav.icon}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: nav.color }}>{nav.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          INDIA DASHBOARD — States + Stats + Heatmap
          ═══════════════════════════════════════════════════════ */}
      {view === "india" && (
        <>
          {/* India Hero Bar */}
          <div style={{
            borderRadius: 14, padding: "22px 28px", marginBottom: 20,
            background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0, opacity: 0.03,
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: "2rem" }}>🇮🇳</span>
                <div>
                  <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>India Real Estate Intelligence</h1>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                    {INDIA_STATES.length} states · {allIndiaCities.length}+ cities · Live data from NHB, RBI, RERA
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {[
                  { label: "Market Size", value: INDIA_RE_STATS.industrySize, color: "#34D399" },
                  { label: "GDP Share", value: INDIA_RE_STATS.gdpContribution, color: "#4A9EFF" },
                  { label: "Annual Growth", value: INDIA_RE_STATS.annualGrowth, color: "#34D399" },
                  { label: "RERA Projects", value: "1.12L+", color: "#FBBF24" },
                  { label: "Home Loans", value: "₹27.2L Cr", color: "#818CF8" },
                  { label: "Avg Rate", value: INDIA_RE_STATS.avgMortgageRate, color: "#FB923C" },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <div style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
            borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
            marginBottom: 16,
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search states or cities... (e.g. Mumbai, Karnataka, Goa)"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: "0.82rem", color: "var(--text-primary)",
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{
                background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6,
                padding: "2px 8px", color: "var(--text-muted)", fontSize: "0.68rem", cursor: "pointer",
              }}>Clear</button>
            )}
          </div>

          {/* ── STATE GRID ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredStates.sort((a, b) => b.investmentScore - a.investmentScore).map(state => {
              const scoreColor = state.investmentScore >= 85 ? "#34D399" : state.investmentScore >= 70 ? "#4A9EFF" : state.investmentScore >= 55 ? "#FBBF24" : "#8C99B0";
              const trendColor = state.demandTrend === "Surging" ? "#34D399" : state.demandTrend === "Rising" ? "#4A9EFF" : state.demandTrend === "Stable" ? "#FBBF24" : "#F87171";
              return (
                <div key={state.code} onClick={() => goState(state)} style={{
                  borderRadius: 14, overflow: "hidden", cursor: "pointer",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  transition: "all 0.2s", borderLeft: `4px solid ${scoreColor}`,
                }}>
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto auto auto", alignItems: "center", gap: 16 }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 2 }}>{state.name}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{state.capital} · {state.majorCities.length} cities · {state.type}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Score</div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 900, color: scoreColor }}>{state.investmentScore}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Growth</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#34D399" }}>+{state.appreciation}%</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Yield</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4A9EFF" }}>{state.rentalYield}%</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Avg/sqft</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)" }}>{state.avgPriceSqft > 9999 ? `${(state.avgPriceSqft / 1000).toFixed(0)}K` : `${(state.avgPriceSqft / 1000).toFixed(1)}K`}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 10, fontSize: "0.62rem", fontWeight: 700,
                          background: `${trendColor}15`, color: trendColor,
                        }}>{state.demandTrend}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 10, fontSize: "0.62rem", fontWeight: 700,
                          background: state.riskLevel === "Low" ? "rgba(52,211,153,0.12)" : state.riskLevel === "Medium" ? "rgba(251,191,36,0.12)" : "rgba(248,113,113,0.12)",
                          color: state.riskLevel === "Low" ? "#34D399" : state.riskLevel === "Medium" ? "#FBBF24" : "#F87171",
                        }}>{state.riskLevel} Risk</span>
                      </div>
                    </div>

                    {/* Key Drivers Tags */}
                    <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                      {state.keyDrivers.slice(0, 4).map(d => (
                        <span key={d} style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 600,
                          background: "rgba(74,158,255,0.08)", color: "#4A9EFF",
                        }}>{d}</span>
                      ))}
                      <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        View Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          STATE DETAIL — Full Analysis + City Grid
          ═══════════════════════════════════════════════════════ */}
      {view === "state-detail" && selectedState && (
        <>
          {/* State Hero */}
          <div style={{
            borderRadius: 14, overflow: "hidden", marginBottom: 20,
            background: "linear-gradient(135deg, #0F2027, #203A43)",
            border: "1px solid rgba(74,158,255,0.15)",
          }}>
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>{selectedState.name}</h1>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                    Capital: {selectedState.capital} · {selectedState.type} · {selectedState.majorCities.length} major cities
                  </p>
                </div>
                <div style={{
                  padding: "10px 18px", borderRadius: 14, textAlign: "center",
                  background: "rgba(255,255,255,0.08)",
                }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: selectedState.investmentScore >= 80 ? "#34D399" : "#4A9EFF", lineHeight: 1 }}>{selectedState.investmentScore}</div>
                  <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>SCORE</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Appreciation", value: `+${selectedState.appreciation}%`, color: "#34D399" },
                  { label: "Rental Yield", value: `${selectedState.rentalYield}%`, color: "#4A9EFF" },
                  { label: "Avg Price/sqft", value: `₹${selectedState.avgPriceSqft.toLocaleString("en-IN")}`, color: "#FBBF24" },
                  { label: "Demand Trend", value: selectedState.demandTrend, color: selectedState.demandTrend === "Surging" ? "#34D399" : "#4A9EFF" },
                  { label: "Risk Level", value: selectedState.riskLevel, color: selectedState.riskLevel === "Low" ? "#34D399" : "#FBBF24" },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              <div style={{
                padding: "14px 18px", borderRadius: 12,
                background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Brain size={14} color="#4A9EFF" />
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4A9EFF", textTransform: "uppercase" }}>AI Analysis</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{selectedState.aiSummary}</p>
              </div>

              {/* Infra Highlight */}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Factory size={14} color="#FBBF24" />
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>{selectedState.infraHighlight}</span>
              </div>

              {/* Key Drivers */}
              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {selectedState.keyDrivers.map(d => (
                  <span key={d} style={{
                    padding: "4px 12px", borderRadius: 8, fontSize: "0.68rem", fontWeight: 700,
                    background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
                  }}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── CITIES IN THIS STATE ── */}
          <h2 style={{ fontSize: "1.15rem", fontWeight: 900, margin: "0 0 14px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={18} color="#4A9EFF" /> Cities in {selectedState.name}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {selectedState.majorCities.sort((a, b) => b.investmentScore - a.investmentScore).map(city => {
              const sc = city.investmentScore >= 80 ? "#34D399" : city.investmentScore >= 65 ? "#4A9EFF" : "#FBBF24";
              return (
                <div key={city.slug} onClick={() => goCity(city)} style={{
                  borderRadius: 14, overflow: "hidden", cursor: "pointer",
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  transition: "all 0.2s",
                }}>
                  <div style={{
                    padding: "16px 20px",
                    borderLeft: `4px solid ${sc}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: "1rem", color: "var(--text-primary)" }}>{city.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Tier {city.tier} · Pop: {city.population}</div>
                      </div>
                      <div style={{
                        padding: "6px 12px", borderRadius: 10,
                        background: `${sc}15`, textAlign: "center",
                      }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: sc, lineHeight: 1 }}>{city.investmentScore}</div>
                        <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", fontWeight: 600 }}>SCORE</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <MiniStat label="Growth" value={`+${city.appreciation}%`} color="#34D399" />
                      <MiniStat label="Yield" value={`${city.rentalYield}%`} color="#4A9EFF" />
                      <MiniStat label="Avg/sqft" value={`₹${city.avgPriceSqft.toLocaleString("en-IN")}`} color="var(--text-primary)" />
                    </div>

                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 8 }}>{city.aiOneLiner}</div>

                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {city.hotSectors.map(s => (
                        <span key={s} style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 600,
                          background: "rgba(74,158,255,0.08)", color: "#4A9EFF",
                        }}>{s}</span>
                      ))}
                      <span style={{
                        marginLeft: "auto", padding: "2px 8px", borderRadius: 6, fontSize: "0.58rem", fontWeight: 700,
                        background: city.demandTrend === "Surging" ? "rgba(52,211,153,0.12)" : city.demandTrend === "Rising" ? "rgba(74,158,255,0.12)" : "rgba(251,191,36,0.12)",
                        color: city.demandTrend === "Surging" ? "#34D399" : city.demandTrend === "Rising" ? "#4A9EFF" : "#FBBF24",
                      }}>{city.demandTrend}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          CITY DETAIL — Deep Dive
          ═══════════════════════════════════════════════════════ */}
      {view === "city-detail" && selectedCity && (
        <>
          <div style={{
            borderRadius: 14, overflow: "hidden", marginBottom: 20,
            background: "linear-gradient(135deg, #0F2027, #203A43)",
            border: "1px solid rgba(74,158,255,0.2)",
          }}>
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>{selectedCity.name}</h1>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                    {selectedCity.state} · Tier {selectedCity.tier} · Population: {selectedCity.population}
                  </p>
                </div>
                <div style={{
                  padding: "12px 20px", borderRadius: 14, textAlign: "center",
                  background: selectedCity.investmentScore >= 80 ? "rgba(52,211,153,0.15)" : "rgba(74,158,255,0.15)",
                }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: selectedCity.investmentScore >= 80 ? "#34D399" : "#4A9EFF", lineHeight: 1 }}>{selectedCity.investmentScore}</div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>INVESTMENT SCORE</div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Price Appreciation", value: `+${selectedCity.appreciation}%`, sub: "Year-over-Year", color: "#34D399" },
                  { label: "Rental Yield", value: `${selectedCity.rentalYield}%`, sub: "Annual", color: "#4A9EFF" },
                  { label: "Avg Price/sqft", value: `₹${selectedCity.avgPriceSqft.toLocaleString("en-IN")}`, sub: "Current", color: "#FBBF24" },
                  { label: "Demand Trend", value: selectedCity.demandTrend, sub: "Current Phase", color: selectedCity.demandTrend === "Surging" ? "#34D399" : "#4A9EFF" },
                ].map(m => (
                  <div key={m.label} style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.06)", border: `1px solid ${m.color}20`,
                  }}>
                    <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: m.color, marginBottom: 2 }}>{m.value}</div>
                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>{m.sub}</div>
                  </div>
                ))}
              </div>

              {/* AI One-Liner */}
              <div style={{
                padding: "14px 18px", borderRadius: 12,
                background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)",
                marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Brain size={14} color="#4A9EFF" />
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4A9EFF", textTransform: "uppercase" }}>AI Intelligence</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, fontWeight: 600 }}>{selectedCity.aiOneLiner}</p>
              </div>

              {/* Hot Sectors */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Hot Sectors:</span>
                {selectedCity.hotSectors.map(s => (
                  <span key={s} style={{
                    padding: "4px 12px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700,
                    background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)",
                  }}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Investment Calculator Snippet */}
          <div style={{
            borderRadius: 14, padding: "20px 24px", marginBottom: 20,
            background: "var(--bg-card)", border: "1px solid var(--border)",
          }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1rem", fontWeight: 900, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={18} color="#FBBF24" /> Quick Investment Snapshot
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)" }}>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>1 Cr Property Value in 5 Years</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#34D399" }}>
                  ₹{((1 * Math.pow(1 + selectedCity.appreciation / 100, 5))).toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>At {selectedCity.appreciation}% CAGR</div>
              </div>
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.12)" }}>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Annual Rental Income (1 Cr)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#4A9EFF" }}>
                  ₹{(selectedCity.rentalYield * 1000).toFixed(0)}/month
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>At {selectedCity.rentalYield}% yield</div>
              </div>
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)" }}>
                <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Cost for 1000 sqft</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#FBBF24" }}>
                  ₹{(selectedCity.avgPriceSqft * 1000 / 100000).toFixed(1)}L
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>At ₹{selectedCity.avgPriceSqft}/sqft avg</div>
              </div>
            </div>
          </div>

          {/* Link to Full City Page */}
          <button onClick={() => router.push(`/real-estate/${selectedCity.slug}`)} style={{
            width: "100%", padding: "14px 24px", borderRadius: 12,
            background: "linear-gradient(135deg, #4A9EFF, #818CF8)", border: "none",
            color: "#fff", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Eye size={16} /> View Full {selectedCity.name} Market Report <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          WORLD — Region Cards
          ═══════════════════════════════════════════════════════ */}
      {view === "world" && (
        <>
          <div style={{
            borderRadius: 14, padding: "22px 28px", marginBottom: 20,
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            border: "1px solid rgba(129,140,248,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: "2rem" }}>🌍</span>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>Global Real Estate Intelligence</h1>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                  {WORLD_REGIONS.length} regions · {COUNTRIES_RE.length} countries · {CITIES_RE.length} cities tracked
                </p>
              </div>
            </div>
          </div>

          {/* Region Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {WORLD_REGIONS.map(region => {
              const regionCountries = COUNTRIES_RE.filter(c => region.countries.includes(c.code));
              const avgScore = regionCountries.length > 0
                ? Math.round(regionCountries.reduce((sum, c) => sum + c.investmentScore, 0) / regionCountries.length)
                : 0;
              return (
                <div key={region.id} onClick={() => goRegion(region)} style={{
                  borderRadius: 14, overflow: "hidden", cursor: "pointer",
                  background: "var(--bg-card)", border: `1px solid ${region.color}25`,
                  transition: "all 0.2s",
                  borderLeft: `4px solid ${region.color}`,
                }}>
                  <div style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: "1.8rem" }}>{region.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: "1.05rem", color: "var(--text-primary)" }}>{region.name}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{region.countries.length} countries</div>
                      </div>
                      {avgScore > 0 && (
                        <div style={{
                          padding: "4px 10px", borderRadius: 8,
                          background: `${region.color}15`, textAlign: "center",
                        }}>
                          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: region.color }}>{avgScore}</div>
                          <div style={{ fontSize: "0.45rem", color: "var(--text-muted)", fontWeight: 600 }}>AVG</div>
                        </div>
                      )}
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{region.description}</p>
                    <div style={{
                      padding: "8px 12px", borderRadius: 8,
                      background: `${region.color}08`, border: `1px solid ${region.color}15`,
                    }}>
                      <div style={{ fontSize: "0.55rem", color: region.color, fontWeight: 700, marginBottom: 2 }}>KEY INSIGHT</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{region.keyInsight}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: region.color, fontSize: "0.72rem", fontWeight: 700, marginTop: 10 }}>
                      Explore Region <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          WORLD REGION DETAIL — Country List with Expandable Cities
          ═══════════════════════════════════════════════════════ */}
      {view === "world-region" && selectedRegion && (
        <>
          <div style={{
            borderRadius: 14, padding: "20px 24px", marginBottom: 20,
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            border: `1px solid ${selectedRegion.color}20`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: "2rem" }}>{selectedRegion.icon}</span>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#fff" }}>{selectedRegion.name}</h1>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{selectedRegion.description}</p>
              </div>
            </div>
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: `${selectedRegion.color}08`, border: `1px solid ${selectedRegion.color}15`,
              fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: 8,
            }}>
              <Brain size={14} color={selectedRegion.color} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {selectedRegion.keyInsight}
            </div>
          </div>

          {/* Country List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {COUNTRIES_RE.filter(c => selectedRegion.countries.includes(c.code)).sort((a, b) => b.investmentScore - a.investmentScore).map(c => {
              const isExpanded = expandedCountry === c.code;
              const cities = CITIES_RE.filter(ct => ct.countryCode === c.code);
              return (
                <div key={c.code} style={{
                  borderRadius: 14, overflow: "hidden",
                  background: "var(--bg-card)", border: isExpanded ? `2px solid ${selectedRegion.color}` : "1px solid var(--border)",
                  transition: "all 0.2s",
                }}>
                  <button onClick={() => setExpandedCountry(isExpanded ? null : c.code)} style={{
                    width: "100%", padding: "14px 20px", display: "grid",
                    gridTemplateColumns: "auto 1fr repeat(4, auto) 24px",
                    alignItems: "center", gap: 14, background: isExpanded ? `${selectedRegion.color}06` : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                  }}>
                    <span style={{ fontSize: "1.5rem" }}>{c.flag}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>{c.name}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{c.region}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Score</div>
                      <div style={{ fontSize: "1rem", fontWeight: 900, color: c.investmentScore >= 80 ? "#34D399" : c.investmentScore >= 65 ? "#4A9EFF" : "#FBBF24" }}>{c.investmentScore}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Yield</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4A9EFF" }}>{c.rentalYield}%</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontWeight: 600 }}>Growth</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: c.priceAppreciation >= 0 ? "#34D399" : "#F87171" }}>
                        {c.priceAppreciation >= 0 ? "+" : ""}{c.priceAppreciation}%
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 10, fontSize: "0.62rem", fontWeight: 700,
                        background: c.opportunity === "High" ? "rgba(52,211,153,0.12)" : c.opportunity === "Medium" ? "rgba(74,158,255,0.12)" : "rgba(248,113,113,0.12)",
                        color: c.opportunity === "High" ? "#34D399" : c.opportunity === "Medium" ? "#4A9EFF" : "#F87171",
                      }}>{c.opportunity}</span>
                    </div>
                    <ChevronDown size={16} style={{
                      color: "var(--text-muted)", transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }} />
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginBottom: 16 }}>
                        <MiniStat label="Interest Rate" value={`${c.interestRate}%`} color="#FB923C" />
                        <MiniStat label="GDP Growth" value={`${c.gdpGrowth}%`} color="#34D399" />
                        <MiniStat label="Capital Inflow" value={c.capitalInflow} color={c.capitalInflow === "Rising" ? "#34D399" : "#FBBF24"} />
                        <MiniStat label="Momentum" value={c.momentum} color={c.momentum === "Strong" ? "#34D399" : "#FBBF24"} />
                        <MiniStat label="Currency Risk" value={c.currencyRisk} color={c.currencyRisk === "Low" ? "#34D399" : c.currencyRisk === "Medium" ? "#FBBF24" : "#F87171"} />
                        <MiniStat label="Population" value={c.population > 100 ? `${(c.population / 1000).toFixed(1)}B` : `${c.population}M`} color="#4A9EFF" />
                      </div>
                      {cities.length > 0 && (
                        <>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Key Cities</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                            {cities.map(ct => (
                              <SmallWorldCityCard key={ct.name} city={ct} onSelect={() => router.push(`/real-estate/${ct.name.toLowerCase().replace(/\s+/g, "-")}`)} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          SUB-VIEWS — Sectors, Infra, REITs, Bubble, Mortgage, Stocks, Capital, Macro, Risk, Insights
          ═══════════════════════════════════════════════════════ */}

      {/* ═══ SECTORS ═══ */}
      {view === "sectors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <Building2 size={20} color="#34D399" /> Property Sectors — Global View
          </h2>
          {SECTORS_RE.map(s => {
            const outlookColor = s.outlook === "Bullish" ? "#34D399" : s.outlook === "Neutral" ? "#FBBF24" : "#F87171";
            return (
              <div key={s.name} style={{
                borderRadius: 14, padding: "18px 22px", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderLeft: `4px solid ${outlookColor}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: "1.8rem" }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{s.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.keyDriver}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 700, background: `${outlookColor}15`, color: outlookColor }}>{s.outlook}</span>
                    <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 700, background: s.momentum === "Strong" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)", color: s.momentum === "Strong" ? "#34D399" : "#FBBF24" }}>{s.momentum}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <MiniStat label="Global Yield" value={`${s.globalYield}%`} color="#4A9EFF" />
                  <MiniStat label="5Y Growth" value={`${s.growth5Y}%`} color="#34D399" />
                  <MiniStat label="Risk" value={s.riskLevel} color={s.riskLevel === "Low" ? "#34D399" : s.riskLevel === "Medium" ? "#FBBF24" : "#F87171"} />
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Top Markets</div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>{s.topMarkets.join(", ")}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ INFRASTRUCTURE ═══ */}
      {view === "infra" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <Factory size={20} color="#4A9EFF" /> Infrastructure Impact Engine
          </h2>
          {INFRA_PROJECTS.map((p, i) => {
            const statusColor = p.status === "Operational" ? "#34D399" : p.status === "Under Construction" ? "#FBBF24" : p.status === "Phase 2" ? "#4A9EFF" : "#818CF8";
            const typeColors: Record<string, string> = { Metro: "#4A9EFF", Airport: "#818CF8", Highway: "#34D399", "Smart City": "#818CF8", "Industrial Corridor": "#FB923C", Rail: "#F87171", Port: "#4A9EFF" };
            return (
              <div key={i} style={{
                borderRadius: 14, padding: "18px 22px", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderLeft: `4px solid ${typeColors[p.type] || "#8C99B0"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "1.1rem" }}>{p.flag}</span>
                      <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>{p.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: `${typeColors[p.type] || "#8C99B0"}15`, color: typeColors[p.type] || "#8C99B0" }}>{p.type}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: `${statusColor}15`, color: statusColor }}>{p.status}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600 }}>Investment</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--text-primary)" }}>{p.investment}</div>
                  </div>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 10px" }}>{p.description}</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(52,211,153,0.08)", fontSize: "0.75rem", fontWeight: 700, color: "#34D399" }}>
                    {p.priceImpact}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Completion: {p.completion}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {p.impactCities.map(c => (
                      <span key={c} style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 600, background: "rgba(74,158,255,0.08)", color: "#4A9EFF" }}>{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ REITS ═══ */}
      {view === "reits" && (
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <Landmark size={20} color="#818CF8" /> REIT Analytics — Global
          </h2>
          <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid var(--border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-slate)" }}>
                  {["REIT", "Type", "Price", "Chg", "Div Yield", "Occ", "P/NAV", "Debt", "Mkt Cap", "Risk"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: h === "REIT" ? "left" : "right", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REITS.map(r => {
                  const typeColors: Record<string, string> = { Office: "#4A9EFF", Retail: "#FB923C", Industrial: "#34D399", Residential: "#818CF8", Diversified: "#4A9EFF", "Data Center": "#F87171", Healthcare: "#34D399" };
                  return (
                    <tr key={r.ticker} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "1rem" }}>{r.flag}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{r.name}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{r.ticker}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.62rem", fontWeight: 700, background: `${typeColors[r.type] || "#8C99B0"}15`, color: typeColors[r.type] || "#8C99B0" }}>{r.type}</span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, fontFamily: "monospace", color: "var(--text-primary)" }}>{r.currency === "JPY" ? "¥" : r.currency === "INR" ? "₹" : r.currency === "HKD" ? "HK$" : r.currency === "SGD" ? "S$" : "$"}{r.price.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: r.change >= 0 ? "#34D399" : "#F87171" }}>{r.change >= 0 ? "+" : ""}{r.change}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#4A9EFF" }}>{r.dividendYield}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>{r.occupancy}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: r.pNav > 1 ? "#F87171" : "#34D399" }}>{r.pNav.toFixed(2)}x</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>{r.debtRatio}%</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)" }}>{r.marketCap}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: r.riskLevel === "Low" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)", color: r.riskLevel === "Low" ? "#34D399" : "#FBBF24" }}>{r.riskLevel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ BUBBLE DETECTOR ═══ */}
      {view === "bubble" && (
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <AlertTriangle size={20} color="#F87171" /> AI Bubble Detector
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BUBBLE_METRICS.sort((a, b) => b.correctionProbability - a.correctionProbability).map(b => {
              const riskColors: Record<string, string> = { Extreme: "#F87171", High: "#FB923C", Moderate: "#FBBF24", Low: "#34D399" };
              const rc = riskColors[b.riskLevel] || "#8C99B0";
              return (
                <div key={b.city} style={{
                  borderRadius: 14, padding: "18px 22px", background: "var(--bg-card)",
                  border: "1px solid var(--border)", borderLeft: `4px solid ${rc}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "1.2rem" }}>{b.flag}</span>
                      <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{b.city}</span>
                      <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 800, background: `${rc}15`, color: rc }}>{b.riskLevel} Risk</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>Correction Prob</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: b.correctionProbability > 30 ? "#F87171" : "#FB923C" }}>{b.correctionProbability}%</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                    <MiniStat label="Overvaluation" value={`${b.overvaluation > 0 ? "+" : ""}${b.overvaluation}%`} color={b.overvaluation > 15 ? "#F87171" : "#34D399"} />
                    <MiniStat label="Price/Income" value={`${b.affordability}x`} color={b.affordability > 15 ? "#F87171" : "#34D399"} />
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>Speculation</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${b.speculationIndex}%`, height: "100%", background: b.speculationIndex > 60 ? "#F87171" : b.speculationIndex > 35 ? "#FBBF24" : "#34D399", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-primary)" }}>{b.speculationIndex}</span>
                      </div>
                    </div>
                    <MiniStat label="Vacancy" value={b.vacancyTrend} color={b.vacancyTrend === "Rising" ? "#F87171" : "#34D399"} />
                    <MiniStat label="Credit Growth" value={`${b.creditGrowth > 0 ? "+" : ""}${b.creditGrowth}%`} color={b.creditGrowth > 20 ? "#F87171" : "#34D399"} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MORTGAGE ═══ */}
      {view === "mortgage" && (
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <DollarSign size={20} color="#FBBF24" /> Mortgage & Affordability Engine
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MORTGAGE_DATA.map(m => {
              const recColor = m.buyRecommendation === "Buy" ? "#34D399" : m.buyRecommendation === "Wait" ? "#FBBF24" : "#F87171";
              return (
                <div key={m.country} style={{
                  borderRadius: 14, padding: "18px 22px", background: "var(--bg-card)",
                  border: "1px solid var(--border)", borderLeft: `4px solid ${recColor}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "1.5rem" }}>{m.flag}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{m.country}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Central Bank: {m.centralBankRate}%</div>
                      </div>
                    </div>
                    <span style={{ padding: "6px 16px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 800, background: `${recColor}15`, color: recColor }}>
                      {m.buyRecommendation}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>Mortgage Rate</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-primary)" }}>{m.rate}%</div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: m.change3M <= 0 ? "#34D399" : "#F87171" }}>{m.change3M <= 0 ? "" : "+"}{m.change3M}% (3M)</div>
                    </div>
                    <MiniStat label="Affordability" value={`${m.affordabilityIndex}`} color={m.affordabilityIndex > 75 ? "#34D399" : m.affordabilityIndex > 50 ? "#FBBF24" : "#F87171"} />
                    <MiniStat label="Avg Loan" value={m.avgLoan} color="var(--text-primary)" />
                    <MiniStat label="Trend" value={m.trend} color={m.trend === "Falling" ? "#34D399" : "#F87171"} />
                  </div>
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: `${recColor}06`, border: `1px solid ${recColor}15`, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>
                    {m.rationale}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ STOCK IMPACT ═══ */}
      {view === "stocks" && (
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <TrendingUp size={20} color="#4A9EFF" /> Real Estate x Stock Market Impact
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
            How real estate trends affect listed companies across sectors.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {STOCK_IMPACTS.map(si => {
              const signalColor = si.currentSignal === "Bullish" ? "#34D399" : si.currentSignal === "Bearish" ? "#F87171" : "#FBBF24";
              return (
                <div key={si.sector} style={{
                  borderRadius: 14, padding: "18px 22px", background: "var(--bg-card)",
                  border: "1px solid var(--border)", borderLeft: `4px solid ${signalColor}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "1.5rem" }}>{si.icon}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{si.sector}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>RE Correlation: <strong style={{ color: si.reCorrelation > 0.7 ? "#34D399" : "#FBBF24" }}>{si.reCorrelation.toFixed(2)}</strong></div>
                      </div>
                    </div>
                    <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 800, background: `${signalColor}15`, color: signalColor }}>{si.currentSignal}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                    {si.stocks.map(s => {
                      const ic = s.impact === "Positive" ? "#34D399" : s.impact === "Negative" ? "#F87171" : "#FBBF24";
                      return (
                        <div key={s.ticker} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-primary)" }}>{s.name}</span>
                            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700, background: `${ic}15`, color: ic }}>{s.impact}</span>
                          </div>
                          <div style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>{s.ticker}</div>
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

      {/* ═══ CAPITAL FLOWS ═══ */}
      {view === "capital" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <Landmark size={20} color="#34D399" /> Institutional Capital Flow Tracker
          </h2>
          {CAPITAL_FLOWS.map((f, i) => (
            <div key={i} style={{
              borderRadius: 14, padding: "16px 20px", background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ padding: "6px 12px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, background: "rgba(74,158,255,0.08)", color: "#4A9EFF" }}>{f.source}</div>
                  <ArrowUpRight size={16} color="var(--text-muted)" />
                  <div style={{ padding: "6px 12px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700, background: "rgba(52,211,153,0.08)", color: "#34D399" }}>{f.destination} — {f.sector}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 900, color: "var(--text-primary)" }}>{f.amount}</span>
                  <span style={{
                    padding: "3px 8px", borderRadius: 10, fontSize: "0.62rem", fontWeight: 700,
                    background: f.trend === "Rising" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                    color: f.trend === "Rising" ? "#34D399" : "#FBBF24",
                  }}>{f.trend}</span>
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5, fontStyle: "italic" }}>{f.insight}</div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MACRO ENGINE ═══ */}
      {view === "macro" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <Activity size={20} color="#FB923C" /> Macro x Real Estate Correlation Engine
          </h2>
          {MACRO_CORRELATIONS.map((m, i) => {
            const dirColor = m.direction === "Positive" ? "#34D399" : m.direction === "Negative" ? "#F87171" : "#FBBF24";
            return (
              <div key={i} style={{
                borderRadius: 14, padding: "16px 20px", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderLeft: `4px solid ${dirColor}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>{m.variable}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: "0.65rem", fontWeight: 700, background: `${dirColor}15`, color: dirColor }}>{m.direction}</span>
                    <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: "0.65rem", fontWeight: 700, background: m.strength === "Strong" ? "rgba(74,158,255,0.1)" : "rgba(255,255,255,0.05)", color: m.strength === "Strong" ? "#4A9EFF" : "var(--text-muted)" }}>{m.strength}</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 8 }}>{m.impact}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {m.affectedMarkets.map(mk => (
                    <span key={mk} style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 600, background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}>{mk}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ RISK ENGINE ═══ */}
      {view === "risk" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <AlertTriangle size={20} color="#F87171" /> Global Real Estate Risk Engine
          </h2>
          {RISK_FACTORS.map((r, i) => {
            const sevColor = r.severity === "Critical" ? "#F87171" : r.severity === "High" ? "#FB923C" : r.severity === "Medium" ? "#FBBF24" : "#34D399";
            return (
              <div key={i} style={{
                borderRadius: 14, padding: "16px 20px", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderLeft: `4px solid ${sevColor}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>{r.type} Risk</div>
                  <span style={{ padding: "4px 12px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 800, background: `${sevColor}15`, color: sevColor, border: `1px solid ${sevColor}30` }}>{r.severity}</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 8 }}>{r.description}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {r.affectedCountries.map(c => (
                    <span key={c} style={{ padding: "3px 10px", borderRadius: 8, fontSize: "0.65rem", fontWeight: 700, background: "rgba(248,113,113,0.08)", color: "#F87171" }}>{c}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ AI INSIGHTS ═══ */}
      {view === "insights" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 8, color: "var(--text-primary)" }}>
            <Brain size={20} color="#818CF8" /> AI-Powered Real Estate Intelligence
          </h2>
          {AI_INSIGHTS.map((ins, i) => {
            const typeColor = ins.type === "opportunity" ? "#34D399" : ins.type === "risk" ? "#F87171" : ins.type === "trend" ? "#4A9EFF" : "#FBBF24";
            return (
              <div key={i} style={{
                borderRadius: 14, padding: "18px 22px", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderLeft: `4px solid ${typeColor}`,
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: "0.6rem", fontWeight: 700, background: `${typeColor}15`, color: typeColor, textTransform: "uppercase" }}>{ins.type}</span>
                  <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{ins.region} · {ins.timestamp}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: 8, color: "var(--text-primary)" }}>{ins.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{ins.body}</div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
    </div>
  );
}

/* ─── SUB-COMPONENTS ─── */

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function SmallWorldCityCard({ city, onSelect }: { city: CityRE; onSelect: () => void }) {
  const scoreColor = city.investmentScore >= 85 ? "#34D399" : city.investmentScore >= 70 ? "#4A9EFF" : "#FBBF24";
  return (
    <div onClick={onSelect} style={{
      borderRadius: 14, padding: "14px 18px", background: "var(--bg-card)",
      border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-primary)" }}>{city.flag} {city.name}</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{city.country}</div>
        </div>
        <div style={{ padding: "4px 12px", borderRadius: 10, fontWeight: 900, fontSize: "0.85rem", background: `${scoreColor}15`, color: scoreColor }}>{city.investmentScore}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        <MiniStat label="Yield" value={`${city.rentalYield}%`} color="#4A9EFF" />
        <MiniStat label="Growth" value={`+${city.priceAppreciation}%`} color="#34D399" />
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {city.hotSectors.map(s => (
          <span key={s} style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 600, background: "rgba(74,158,255,0.08)", color: "#4A9EFF" }}>{s}</span>
        ))}
      </div>
    </div>
  );
}
