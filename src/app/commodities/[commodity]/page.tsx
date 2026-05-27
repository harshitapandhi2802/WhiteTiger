"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Brain, TrendingUp, TrendingDown, Globe, Shield,
  Target, BarChart3, Eye, Sparkles, Activity, Flame,
  Users, ChevronRight, AlertTriangle, Anchor, Lightbulb,
  Radio, Layers, Factory, Truck, Building2, MapPin,
  BookOpen, Zap, ArrowRight, ChevronDown,
} from "lucide-react";
import { getCommodityBySlug, GLOBAL_PLAYERS, GLOBAL_CHOKEPOINTS, COUNTRY_PROFILES, IMPACT_CHAINS } from "@/lib/commodities";

/* === Types === */
interface StoryItem {
  category: string;
  headline: string;
  story: string;
  severity: string;
  timeAgo: string;
}

interface CommodityData {
  success: boolean; slug: string; name: string; category: string; unit: string;
  price: { current: number; change: number; dayHigh: number; dayLow: number; weekHigh52: number; weekLow52: number; openInterest: string; volume24h: string };
  aiNarrative: string;
  whyThisMatters: string;
  globalCompanies: { name: string; country: string; role: string; marketShare: string }[];
  countryShares: { country: string; productionShare: number; exportShare: number; reserveShare: number }[];
  impactChain: { step: string; effect: string }[];
  storyFeed: StoryItem[];
  supplyDemand: { globalProduction: string; globalConsumption: string; surplus: string; inventoryDays: number; inventoryChange: string; topProducers: { country: string; share: number; trend: string }[]; topConsumers: { country: string; share: number; trend: string }[] };
  futuresAnalysis: { structure: string; structureExplanation: string; spread1m3m: number; spread1m12m: number; rollYield: number; curve: { month: string; price: number; monthsOut: number }[] };
  geopoliticalEvents: { event: string; severity: string; impact: number; detail: string }[];
  shippingRoutes: { route: string; status: string; volumeShare: string; detail: string }[];
  stockImpact: { sector: string; impact: string; detail: string; stocks: string[]; whyMatters?: string }[];
  smartMoney: { netSpeculativePosition: string; positionSize: string; weeklyChange: string; hedgeFundSentiment: string; etfFlows: string; producerHedging: string; cftcInsight: string };
  riskAssessment: { overallRisk: string; risks: { type: string; level: string; detail: string }[] };
  seasonalPattern: { month: string; avgReturn: number; currentYear: number }[];
  macroCorrelation: { usDollar: number; sp500: number; bonds: number; inflation: number; vix: number; chinaGdp: number };
  priceForecast: { shortTerm: ForecastEntry; mediumTerm: ForecastEntry; longTerm: ForecastEntry };
  topProducers: string[]; topConsumers: string[]; keyDrivers: string[];
}
interface ForecastEntry { direction: string; target: number; timeframe: string; confidence: number }

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Low: { bg: "#f0fdf4", text: "#059669" }, Moderate: { bg: "#fffbeb", text: "#d97706" }, High: { bg: "#fef2f2", text: "#dc2626" },
    Open: { bg: "#f0fdf4", text: "#059669" }, Disrupted: { bg: "#fef2f2", text: "#dc2626" }, "Elevated Risk": { bg: "#fffbeb", text: "#d97706" }, Restricted: { bg: "#fffbeb", text: "#d97706" },
    Bullish: { bg: "#f0fdf4", text: "#059669" }, Neutral: { bg: "#f8fafc", text: "#6b7280" }, Bearish: { bg: "#fef2f2", text: "#dc2626" },
  };
  const c = colors[level] || colors["Moderate"];
  return <span style={{ padding: "3px 10px", borderRadius: 5, fontSize: "0.66rem", fontWeight: 700, background: c.bg, color: c.text, textTransform: "uppercase" }}>{level}</span>;
}

function SectionHeading({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "2px solid #1a1a2e", display: "flex", alignItems: "flex-start", gap: 12 }}>
      {icon && <div style={{ color: "#f59e0b", marginTop: 2 }}>{icon}</div>}
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "0.76rem", color: "#6b7280", margin: "4px 0 0", lineHeight: 1.4 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* === Nav Pill === */
function NavPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
      fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap",
      background: active ? "#1a1a2e" : "#fff", color: active ? "#fff" : "#6b7280",
      boxShadow: active ? "none" : "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.2s",
    }}>{label}</button>
  );
}

/* ===================================================
   MAIN PAGE
   =================================================== */
export default function CommodityDetailPage({ params }: { params: Promise<{ commodity: string }> }) {
  const { commodity } = use(params);
  const entry = getCommodityBySlug(commodity);
  const [data, setData] = useState<CommodityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("copilot");
  const [expandedStory, setExpandedStory] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/commodity-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: commodity, name: entry?.name || commodity }),
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [commodity, entry?.name]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Related global players for this commodity
  const relatedPlayers = GLOBAL_PLAYERS.filter(gp => gp.commodities.includes(commodity));
  // Related chokepoints
  const relatedChokepoints = GLOBAL_CHOKEPOINTS.filter(cp => cp.commoditiesAffected.includes(commodity));
  // Related impact chain
  const relatedChain = IMPACT_CHAINS.find(ic => ic.triggerCommodity === commodity);
  // Related countries
  const relatedCountries = COUNTRY_PROFILES.filter(cp => cp.dominantCommodities.some(dc => dc.commodity.toLowerCase().includes(commodity.replace(/-/g, " "))));

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 50, height: 50, border: "3px solid rgba(245,158,11,0.15)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: 700 }}>AI Analyzing {entry?.name || commodity}...</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.74rem" }}>Generating global intelligence report...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) return <div style={{ minHeight: "100vh", background: "#fff", padding: 40, color: "#111" }}>Error loading data.</div>;

  const isPositive = data.price.change >= 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #0f0f23, #1a1a2e)", color: "#fff", padding: "20px 40px", position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
        <div style={{ maxWidth: 1260, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/commodity-intelligence" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem" }}>
              <ArrowLeft size={14} /> Commodities
            </Link>
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{data.name}</div>
              <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.4)" }}>{data.category} · {entry?.exchange || "Global"} · {entry?.symbol || data.slug.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{data.unit.includes("$") ? "$" : ""}{data.price.current.toLocaleString()} <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{data.unit}</span></div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isPositive ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {isPositive ? "+" : ""}{data.price.change}%
              </div>
            </div>
            <RiskBadge level={data.smartMoney.hedgeFundSentiment} />
          </div>
        </div>
      </header>

      {/* Section Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "8px 40px", position: "sticky", top: 78, zIndex: 40 }}>
        <div style={{ maxWidth: 1260, margin: "0 auto", display: "flex", gap: 6, overflowX: "auto" }}>
          {[
            { id: "copilot", label: "AI Copilot" },
            { id: "why-matters", label: "Why This Matters" },
            { id: "stories", label: "Story Feed" },
            { id: "global-players", label: "Global Players" },
            { id: "impact-flow", label: "Impact Flow" },
            { id: "supply", label: "Supply-Demand" },
            { id: "futures", label: "Futures" },
            { id: "geopolitical", label: "Geopolitical" },
            { id: "stocks", label: "Stock Impact" },
            { id: "smart-money", label: "Smart Money" },
            { id: "forecast", label: "Forecast" },
          ].map(s => (
            <NavPill key={s.id} label={s.label} active={activeSection === s.id} onClick={() => scrollTo(s.id)} />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1260, margin: "0 auto", padding: "28px 40px 80px" }}>

        {/* ============ AI COPILOT ============ */}
        <section id="copilot" style={{ marginBottom: 32 }}>
          <div style={{ background: "linear-gradient(135deg, #0f0f23, #1a1035)", borderRadius: 16, padding: "28px 32px", color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #eab308)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={18} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>AI Commodity Copilot</div>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)" }}>Plain-English intelligence for {data.name}</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <Radio size={9} style={{ color: "#4ade80", animation: "pulse 2s ease infinite" }} />
                  <span style={{ fontSize: "0.6rem", color: "#4ade80", fontWeight: 600 }}>LIVE</span>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "20px 24px", border: "1px solid rgba(245,158,11,0.1)" }}>
                <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.7 }}>{data.aiNarrative}</p>
              </div>
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
          </div>
        </section>

        {/* ============ WHY THIS MATTERS ============ */}
        <section id="why-matters" style={{ marginBottom: 32 }}>
          <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", borderRadius: 16, padding: "24px 28px", border: "1px solid #fde68a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lightbulb size={17} style={{ color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#92400e" }}>Why {data.name} Matters</div>
                <div style={{ fontSize: "0.62rem", color: "#a16207" }}>Understanding the global significance</div>
              </div>
            </div>
            <p style={{ fontSize: "0.86rem", color: "#78350f", lineHeight: 1.7, margin: 0 }}>{data.whyThisMatters}</p>
          </div>
        </section>

        {/* Quick Stats */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1, background: "#e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            {[
              { label: "Day High", value: `${data.price.dayHigh}` },
              { label: "Day Low", value: `${data.price.dayLow}` },
              { label: "52W High", value: `${data.price.weekHigh52}` },
              { label: "52W Low", value: `${data.price.weekLow52}` },
              { label: "Open Interest", value: data.price.openInterest },
              { label: "Volume", value: data.price.volume24h },
              { label: "Curve", value: data.futuresAnalysis.structure },
              { label: "Inventory", value: `${data.supplyDemand.inventoryDays}d` },
            ].map((m, i) => (
              <div key={i} style={{ background: "#fff", padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: "0.56rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#1a1a2e" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ AI STORY FEED ============ */}
        <section id="stories" style={{ marginBottom: 32 }}>
          <SectionHeading title="AI Story Feed" subtitle={`What's driving ${data.name} markets right now — explained simply`} icon={<BookOpen size={18} />} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {data.storyFeed.map((story, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 20px", cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => setExpandedStory(expandedStory === i ? null : i)}
                onMouseOver={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)"; }}
                onMouseOut={e => { e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.56rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: story.severity === "high" ? "#fef2f2" : "#fffbeb", color: story.severity === "high" ? "#dc2626" : "#d97706", textTransform: "uppercase" }}>{story.category}</span>
                  <span style={{ fontSize: "0.6rem", color: "#9ca3af" }}>{story.timeAgo}</span>
                </div>
                <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1a1a2e", marginBottom: 6, lineHeight: 1.4 }}>{story.headline}</div>
                {expandedStory === i && (
                  <div style={{ fontSize: "0.76rem", color: "#4b5563", lineHeight: 1.6, marginTop: 8, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>{story.story}</div>
                )}
                <div style={{ fontSize: "0.62rem", color: "#6366f1", fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                  {expandedStory === i ? "Show less" : "Read full story"} <ChevronRight size={10} style={{ transform: expandedStory === i ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ GLOBAL PLAYERS ============ */}
        <section id="global-players" style={{ marginBottom: 32 }}>
          <SectionHeading title="Global Players & Market Power" subtitle={`Companies and countries that control ${data.name} markets`} icon={<Building2 size={18} />} />

          {/* Companies from API */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 12 }}>Key Global Companies</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {data.globalCompanies.map((gc, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1a1a2e" }}>{gc.name}</div>
                      <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>{gc.country}</div>
                    </div>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#6366f110", color: "#6366f1" }}>{gc.marketShare}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#4b5563" }}>{gc.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Global Players from lib (with "Why Matters") */}
          {relatedPlayers.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 12 }}>Deeper Intelligence</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {relatedPlayers.slice(0, 6).map((gp, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1a1a2e" }}>{gp.name}</div>
                        <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>{gp.country} · {gp.type} · Revenue: {gp.revenue}</div>
                      </div>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#6366f110", color: "#6366f1" }}>{gp.marketShare}</span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#4b5563", marginBottom: 8 }}>{gp.description}</div>
                    <div style={{ background: "#fffbeb", borderRadius: 6, padding: "8px 10px", border: "1px solid #fef3c7" }}>
                      <div style={{ fontSize: "0.56rem", fontWeight: 700, color: "#d97706", marginBottom: 2 }}>WHY THIS MATTERS</div>
                      <div style={{ fontSize: "0.64rem", color: "#92400e", lineHeight: 1.45 }}>{gp.whyMatters}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Country Market Shares */}
          <div>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 12 }}>Country Market Shares</div>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 0, padding: "10px 20px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Country</div>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "center" }}>Production</div>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "center" }}>Exports</div>
                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "center" }}>Reserves</div>
              </div>
              {data.countryShares.map((cs, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 0, padding: "12px 20px", borderBottom: i < data.countryShares.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a1a2e" }}>{cs.country}</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(cs.productionShare * 2, 100)}%`, height: "100%", background: "#059669", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669" }}>{cs.productionShare}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(cs.exportShare * 2, 100)}%`, height: "100%", background: "#6366f1", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6366f1" }}>{cs.exportShare}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(cs.reserveShare * 2, 100)}%`, height: "100%", background: "#f59e0b", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b" }}>{cs.reserveShare}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Related Countries */}
          {relatedCountries.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {relatedCountries.slice(0, 3).map((cp, i) => (
                <div key={i} style={{ background: "#fffbeb", borderRadius: 10, padding: "12px 16px", border: "1px solid #fef3c7", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <MapPin size={12} style={{ color: "#d97706" }} />
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#92400e" }}>{cp.country} — {cp.geopoliticalInfluence}</span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#78350f", lineHeight: 1.5 }}>{cp.whyMatters}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ============ IMPACT FLOW ============ */}
        <section id="impact-flow" style={{ marginBottom: 32 }}>
          <SectionHeading title={`How ${data.name} Affects the Economy`} subtitle="Step-by-step chain reaction when prices change" icon={<Zap size={18} />} />

          {/* API Impact Chain */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "24px 28px", marginBottom: 16 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: 16 }}>Price Change Ripple Effect</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {data.impactChain.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "stretch", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 36 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, hsl(${i * 50}, 70%, 50%), hsl(${i * 50 + 20}, 70%, 45%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
                    {i < data.impactChain.length - 1 && <div style={{ width: 2, flex: 1, background: `linear-gradient(180deg, hsl(${i * 50}, 70%, 80%), hsl(${(i + 1) * 50}, 70%, 80%))`, minHeight: 20 }} />}
                  </div>
                  <div style={{ paddingBottom: i < data.impactChain.length - 1 ? 16 : 0, flex: 1 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>{step.step}</div>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.4 }}>{step.effect}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lib Impact Chain (if exists) */}
          {relatedChain && (
            <div style={{ background: "linear-gradient(135deg, #fef2f2, #fff1f2)", borderRadius: 14, padding: "20px 24px", border: "1px solid #fecaca" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#991b1b", marginBottom: 12 }}>{relatedChain.trigger} — Full Economic Chain Reaction</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {relatedChain.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: "#fff", color: "#991b1b", border: "1px solid #fecaca" }}>{step.event}</span>
                    {i < relatedChain.steps.length - 1 && <ArrowRight size={12} style={{ color: "#dc2626" }} />}
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#d97706", marginBottom: 4 }}>WHY THIS MATTERS</div>
                <div style={{ fontSize: "0.72rem", color: "#78350f", lineHeight: 1.5 }}>{relatedChain.whyMatters}</div>
              </div>
            </div>
          )}

          {/* Related Chokepoints */}
          {relatedChokepoints.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Anchor size={14} style={{ color: "#0ea5e9" }} /> Strategic Chokepoints Affecting {data.name}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {relatedChokepoints.map((cp, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${cp.riskLevel === "high" ? "#fecaca" : "#e5e7eb"}`, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a1a2e" }}>{cp.name}</div>
                      <span style={{ fontSize: "0.56rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", background: cp.riskLevel === "high" ? "#fef2f2" : "#fffbeb", color: cp.riskLevel === "high" ? "#dc2626" : "#d97706" }}>{cp.riskLevel}</span>
                    </div>
                    <div style={{ fontSize: "0.66rem", color: "#6b7280", marginBottom: 6 }}>{cp.location} · {cp.globalTradeShare} of global trade</div>
                    <div style={{ fontSize: "0.66rem", color: "#78350f", lineHeight: 1.4, background: "#fffbeb", borderRadius: 6, padding: "6px 8px" }}>{cp.whyMatters}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ============ SUPPLY-DEMAND ============ */}
        <section id="supply" style={{ marginBottom: 32 }}>
          <SectionHeading title="Supply-Demand Balance" subtitle="Who produces it, who consumes it, and is there enough?" icon={<Factory size={18} />} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
            {[
              { label: "Global Production", value: data.supplyDemand.globalProduction, color: "#059669", explain: "How much is being made/extracted worldwide" },
              { label: "Global Consumption", value: data.supplyDemand.globalConsumption, color: "#6366f1", explain: "How much the world is using" },
              { label: "Balance", value: data.supplyDemand.surplus, color: data.supplyDemand.surplus.includes("Deficit") ? "#dc2626" : "#059669", explain: data.supplyDemand.surplus.includes("Deficit") ? "Demand exceeds supply — prices tend to rise" : "Supply exceeds demand — prices may soften" },
            ].map((m, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "18px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "0.62rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: "0.58rem", color: "#9ca3af", marginTop: 4 }}>{m.explain}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 12 }}>Top Producers</div>
              {data.supplyDemand.topProducers.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a1a2e" }}>{p.country}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a1a2e" }}>{p.share}%</span>
                    <span style={{ fontSize: "0.62rem", color: p.trend === "Increasing" ? "#059669" : p.trend === "Decreasing" ? "#dc2626" : "#6b7280" }}>{p.trend}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 12 }}>Top Consumers</div>
              {data.supplyDemand.topConsumers.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a1a2e" }}>{c.country}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a1a2e" }}>{c.share}%</span>
                    <span style={{ fontSize: "0.62rem", color: c.trend === "Growing" ? "#059669" : c.trend === "Slowing" ? "#dc2626" : "#6b7280" }}>{c.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FUTURES CURVE ============ */}
        <section id="futures" style={{ marginBottom: 32 }}>
          <SectionHeading title="Futures Curve Analytics" subtitle="Is the market expecting prices to rise or fall?" icon={<Activity size={18} />} />
          <div style={{ background: data.futuresAnalysis.structure === "Backwardation" ? "linear-gradient(135deg, #fef2f2, #fff1f2)" : "linear-gradient(135deg, #eff6ff, #f0f9ff)", borderRadius: 14, padding: "20px 24px", border: `1px solid ${data.futuresAnalysis.structure === "Backwardation" ? "#fecaca" : "#bfdbfe"}`, marginBottom: 16 }}>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: data.futuresAnalysis.structure === "Backwardation" ? "#dc2626" : "#2563eb", marginBottom: 8 }}>
              Market in {data.futuresAnalysis.structure}
            </div>
            <p style={{ fontSize: "0.82rem", color: "#4b5563", lineHeight: 1.55, margin: 0 }}>{data.futuresAnalysis.structureExplanation}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>1M-3M Spread</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: data.futuresAnalysis.spread1m3m > 0 ? "#dc2626" : "#059669" }}>{data.futuresAnalysis.spread1m3m > 0 ? "+" : ""}{data.futuresAnalysis.spread1m3m}%</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>1M-12M Spread</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: data.futuresAnalysis.spread1m12m > 0 ? "#dc2626" : "#059669" }}>{data.futuresAnalysis.spread1m12m > 0 ? "+" : ""}{data.futuresAnalysis.spread1m12m}%</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Roll Yield (Ann.)</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: data.futuresAnalysis.rollYield > 0 ? "#059669" : "#dc2626" }}>{data.futuresAnalysis.rollYield > 0 ? "+" : ""}{data.futuresAnalysis.rollYield}%</div>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.futuresAnalysis.curve.length}, 1fr)`, gap: 1, background: "#e5e7eb" }}>
              {data.futuresAnalysis.curve.map((f, i) => (
                <div key={i} style={{ background: "#fff", padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.58rem", color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>{f.month}</div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: f.price > data.price.current ? "#dc2626" : "#059669" }}>{f.price.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ GEOPOLITICAL ============ */}
        <section id="geopolitical" style={{ marginBottom: 32 }}>
          <SectionHeading title="Geopolitical & Supply Chain Intelligence" subtitle="Events, shipping disruptions, and their real-world impact" icon={<Globe size={18} />} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} style={{ color: "#dc2626" }} /> Active Events
              </div>
              {data.geopoliticalEvents.map((e, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: i < data.geopoliticalEvents.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a1a2e" }}>{e.event}</span>
                    <RiskBadge level={e.severity === "high" ? "High" : e.severity === "medium" ? "Moderate" : "Low"} />
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.5 }}>{e.detail}</div>
                  <div style={{ fontSize: "0.66rem", fontWeight: 700, color: e.impact > 0 ? "#059669" : "#dc2626", marginTop: 4 }}>Price impact: {e.impact > 0 ? "+" : ""}{e.impact}%</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Anchor size={14} style={{ color: "#0ea5e9" }} /> Shipping Route Status
              </div>
              {data.shippingRoutes.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < data.shippingRoutes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a1a2e" }}>{r.route}</div>
                    <div style={{ fontSize: "0.64rem", color: "#6b7280" }}>{r.detail}</div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.66rem", color: "#6b7280" }}>{r.volumeShare}</span>
                    <RiskBadge level={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ STOCK IMPACT ============ */}
        <section id="stocks" style={{ marginBottom: 32 }}>
          <SectionHeading title={`How ${data.name} Affects Indian Stocks`} subtitle="Which sectors and companies benefit or suffer when prices change" icon={<BarChart3 size={18} />} />
          <div style={{ display: "grid", gap: 12 }}>
            {data.stockImpact.map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1a1a2e" }}>{s.sector}</span>
                  <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: s.impact.includes("Positive") ? "#f0fdf4" : s.impact.includes("Negative") ? "#fef2f2" : "#fffbeb", color: s.impact.includes("Positive") ? "#059669" : s.impact.includes("Negative") ? "#dc2626" : "#d97706" }}>{s.impact}</span>
                </div>
                <div style={{ fontSize: "0.76rem", color: "#4b5563", lineHeight: 1.5, marginBottom: 8 }}>{s.detail}</div>
                {s.whyMatters && (
                  <div style={{ background: "#fffbeb", borderRadius: 6, padding: "8px 10px", border: "1px solid #fef3c7", marginBottom: 10 }}>
                    <div style={{ fontSize: "0.56rem", fontWeight: 700, color: "#d97706", marginBottom: 2 }}>WHY THIS MATTERS</div>
                    <div style={{ fontSize: "0.64rem", color: "#92400e", lineHeight: 1.45 }}>{s.whyMatters}</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  {s.stocks.map((st, j) => (
                    <Link key={j} href={`/stocks/${st.toLowerCase()}`} style={{ fontSize: "0.64rem", fontWeight: 700, color: "#6366f1", background: "#6366f110", padding: "3px 8px", borderRadius: 4, textDecoration: "none" }}>{st}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ SMART MONEY & RISK ============ */}
        <section id="smart-money" style={{ marginBottom: 32 }}>
          <SectionHeading title="Smart Money & Risk Assessment" subtitle="What professional investors are doing and key risks to watch" icon={<Eye size={18} />} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 14 }}>Institutional Positioning</div>
              {[
                { label: "Net Position", value: data.smartMoney.netSpeculativePosition },
                { label: "Position Size", value: data.smartMoney.positionSize },
                { label: "Weekly Change", value: data.smartMoney.weeklyChange },
                { label: "Hedge Fund View", value: data.smartMoney.hedgeFundSentiment },
                { label: "ETF Flows (30d)", value: data.smartMoney.etfFlows },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{ fontSize: "0.76rem", color: "#6b7280" }}>{item.label}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{item.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: "0.72rem", color: "#4b5563", lineHeight: 1.5 }}>
                <Lightbulb size={11} style={{ color: "#f59e0b", marginRight: 4, verticalAlign: "middle" }} />
                {data.smartMoney.cftcInsight}
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151" }}>Risk Assessment</span>
                <RiskBadge level={data.riskAssessment.overallRisk} />
              </div>
              {data.riskAssessment.risks.map((r, i) => (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: i < data.riskAssessment.risks.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a1a2e" }}>{r.type}</span>
                    <RiskBadge level={r.level} />
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#6b7280", lineHeight: 1.4 }}>{r.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FORECAST & MACRO ============ */}
        <section id="forecast" style={{ marginBottom: 32 }}>
          <SectionHeading title="AI Price Forecast & Macro Correlation" subtitle="Where prices might be headed and what drives them" icon={<Target size={18} />} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 14 }}>Price Forecast</div>
              {(["shortTerm", "mediumTerm", "longTerm"] as const).map((tf, i) => {
                const f = data.priceForecast[tf];
                return (
                  <div key={i} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: i < 2 ? "1px solid #f3f4f6" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1a1a2e" }}>{f.timeframe}</span>
                      <RiskBadge level={f.direction} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: f.direction === "Bullish" ? "#059669" : f.direction === "Bearish" ? "#dc2626" : "#6b7280" }}>{data.unit.includes("$") ? "$" : ""}{f.target.toLocaleString()}</span>
                      <span style={{ fontSize: "0.66rem", color: "#6b7280" }}>Confidence: {f.confidence}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 6 }}>Macro Correlation</div>
              <div style={{ fontSize: "0.62rem", color: "#9ca3af", marginBottom: 14 }}>How {data.name} moves relative to other assets</div>
              {[
                { label: "US Dollar (DXY)", value: data.macroCorrelation.usDollar, explain: "Negative = commodity falls when Dollar rises" },
                { label: "S&P 500", value: data.macroCorrelation.sp500, explain: "Positive = moves with stock market" },
                { label: "US Bonds", value: data.macroCorrelation.bonds, explain: "Relationship with safe-haven bonds" },
                { label: "Inflation (CPI)", value: data.macroCorrelation.inflation, explain: "Positive = good inflation hedge" },
                { label: "VIX (Fear Index)", value: data.macroCorrelation.vix, explain: "Positive = rises when markets are fearful" },
                { label: "China GDP", value: data.macroCorrelation.chinaGdp, explain: "Positive = benefits from China growth" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 5 ? "1px solid #f3f4f6" : "none" }}>
                  <div>
                    <span style={{ fontSize: "0.76rem", color: "#374151" }}>{c.label}</span>
                    <div style={{ fontSize: "0.56rem", color: "#9ca3af" }}>{c.explain}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.abs(c.value) * 100}%`, height: "100%", background: c.value > 0 ? "#059669" : "#dc2626", borderRadius: 3, marginLeft: c.value < 0 ? "auto" : 0 }} />
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: c.value > 0 ? "#059669" : "#dc2626", minWidth: 40, textAlign: "right" }}>{c.value > 0 ? "+" : ""}{c.value.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "2px solid #1a1a2e", paddingTop: 24, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <Brain size={16} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a1a2e" }}>White Tiger Global Commodity Intelligence Engine</span>
          </div>
          <div style={{ fontSize: "0.66rem", color: "#9ca3af" }}>AI-generated analysis for educational purposes. Not trading advice.</div>
        </footer>
      </div>
    </div>
  );
}
