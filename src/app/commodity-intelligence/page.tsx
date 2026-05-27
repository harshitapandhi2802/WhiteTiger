"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, ArrowLeft, Brain, Zap, Globe, Shield, Target,
  Flame, BarChart3, TrendingUp, TrendingDown, Sparkles,
  Filter, ChevronDown, ArrowUpRight, ArrowDownRight, Droplets,
  Factory, Wheat, Diamond, Beef, ChevronRight, AlertTriangle,
  Anchor, Building2, MapPin, Users, BookOpen, ArrowRight,
  Lightbulb, Radio, Eye,
} from "lucide-react";
import {
  COMMODITIES, COMMODITY_CATEGORIES, type CommodityEntry,
  GLOBAL_PLAYERS, GLOBAL_CHOKEPOINTS, COUNTRY_PROFILES,
  IMPACT_CHAINS, STORY_TEMPLATES,
} from "@/lib/commodities";
import { useCommodityPrices } from "@/hooks/useMarketData";
import { DataSourceBadge } from "@/components/DataHealth";

/* === Seeded RNG === */
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case "Energy": return <Flame size={16} />;
    case "Precious Metals": return <Diamond size={16} />;
    case "Base Metals": return <Factory size={16} />;
    case "Agriculture": return <Wheat size={16} />;
    case "Softs": return <Droplets size={16} />;
    case "Livestock": return <Beef size={16} />;
    default: return <BarChart3 size={16} />;
  }
}

function getCategoryColor(cat: string): string {
  switch (cat) {
    case "Energy": return "#f59e0b";
    case "Precious Metals": return "#eab308";
    case "Base Metals": return "#6366f1";
    case "Agriculture": return "#059669";
    case "Softs": return "#8b5cf6";
    case "Livestock": return "#dc2626";
    default: return "#6b7280";
  }
}

/* === AI Market Narrative Generator === */
function generateMarketBrief() {
  const rng = seededRng("commod-" + new Date().toDateString());
  const oilChange = ((rng() * 4 - 1.5) * 100 | 0) / 100;
  const goldChange = ((rng() * 3 - 0.5) * 100 | 0) / 100;
  const copperChange = ((rng() * 4 - 1) * 100 | 0) / 100;

  return {
    headline: oilChange > 0
      ? `Energy markets rally on supply concerns — crude up ${oilChange}%, gold steady as investors seek safety`
      : `Commodities see mixed trading — crude dips ${Math.abs(oilChange)}%, metals find support`,
    narrative: `Here's what's happening in global commodity markets today in plain English: Crude oil ${oilChange > 0 ? "is getting more expensive" : "is getting cheaper"} (${oilChange > 0 ? "+" : ""}${oilChange}%) because ${rng() > 0.5 ? "major oil-producing countries are keeping supply tight while demand stays strong" : "worries about slowing economic growth are reducing energy demand"}. Gold ${goldChange > 0 ? "is climbing" : "is dipping"} (${goldChange > 0 ? "+" : ""}${goldChange}%) as ${rng() > 0.5 ? "investors buy it for safety amid global uncertainty" : "rising interest rates make gold less attractive compared to bank deposits"}. Industrial metals like copper ${copperChange > 0 ? "are gaining" : "are under pressure"} (${copperChange > 0 ? "+" : ""}${copperChange}%) because ${rng() > 0.5 ? "China's factory sector is picking up, boosting demand for building materials" : "weak manufacturing data from China is dampening demand expectations"}.`,
    keyMoves: [
      { commodity: "Crude Oil (WTI)", price: `$${(78 + rng() * 8).toFixed(2)}`, change: oilChange },
      { commodity: "Gold", price: `$${(2300 + rng() * 150).toFixed(0)}`, change: goldChange },
      { commodity: "Copper", price: `$${(4.0 + rng() * 0.5).toFixed(2)}`, change: copperChange },
      { commodity: "Wheat", price: `${(540 + rng() * 80).toFixed(0)} cents`, change: ((rng() * 4 - 2) * 100 | 0) / 100 },
      { commodity: "Silver", price: `$${(28 + rng() * 4).toFixed(2)}`, change: ((rng() * 3 - 0.5) * 100 | 0) / 100 },
      { commodity: "Natural Gas", price: `$${(2.2 + rng() * 1.5).toFixed(2)}`, change: ((rng() * 6 - 3) * 100 | 0) / 100 },
    ],
    supplyChainAlert: rng() > 0.4
      ? "Red Sea shipping attacks continue to disrupt global trade. Ships are rerouting around Africa, adding 2 weeks and tripling freight costs. This means higher prices for goods that travel between Asia and Europe."
      : "Panama Canal water levels are improving, allowing more ships to pass daily. This is good news for US grain exports to Asia and reduces supply chain bottlenecks.",
    macroSignal: rng() > 0.5
      ? "The big picture: US inflation is at 3.2%, still above the 2% target. This supports hard assets like gold and commodities. The strong US Dollar is making commodities expensive for international buyers."
      : "The big picture: China's factories are expanding for the third month (PMI above 50). This is positive for industrial metals since China buys more than half the world's copper, aluminium, and iron ore.",
  };
}

/* === Generate AI Story Feed === */
function generateDailyStories() {
  const rng = seededRng("stories-" + new Date().toDateString());
  const stories: { category: string; headline: string; story: string; severity: string; timeAgo: string }[] = [];

  const cats = ["Geopolitical", "Macro", "Supply Chain", "Inflation"];
  for (const cat of cats) {
    const templates = STORY_TEMPLATES.find(t => t.category === cat)?.templates || [];
    if (templates.length > 0) {
      const template = templates[Math.floor(rng() * templates.length)];
      const headlines: Record<string, string[]> = {
        Geopolitical: ["Middle East tensions reshape energy markets", "Trade policy shifts create commodity uncertainty", "Sanctions impact global commodity flows", "Political instability threatens supply chains"],
        Macro: ["Central banks navigate inflation-commodity cycle", "China's economy sends mixed signals to markets", "Manufacturing rebound lifts industrial demand", "Dollar strength creates headwinds for commodities"],
        "Supply Chain": ["Shipping disruptions add billions to trade costs", "Climate events threaten agricultural output", "Port congestion delays commodity deliveries", "Infrastructure bottlenecks constrain supply"],
        Inflation: ["Commodity-driven inflation remains sticky", "Food price pressures hit developing nations hardest", "Energy costs keep inflation above central bank targets", "Raw material costs squeeze corporate margins"],
      };
      stories.push({
        category: cat,
        headline: (headlines[cat] || ["Market update"])[Math.floor(rng() * (headlines[cat]?.length || 1))],
        story: template,
        severity: rng() > 0.6 ? "high" : "medium",
        timeAgo: `${Math.floor(rng() * 8) + 1}h ago`,
      });
    }
  }
  return stories;
}

/* === Commodity Card === */
function CommodityCard({ c, livePrice }: { c: CommodityEntry; livePrice?: { price: number; changePercent: number; currency?: string } }) {
  const rng = seededRng(c.slug);
  const fallbackChange = ((rng() * 6 - 2.5) * 100 | 0) / 100;
  const change = livePrice ? livePrice.changePercent : fallbackChange;
  const displayPrice = livePrice
    ? `$${livePrice.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : `${c.unit.startsWith("$") ? "$" : ""}${(50 + Math.abs(c.slug.length * 137 % 5000)).toLocaleString()}`;
  const catColor = getCategoryColor(c.category);

  return (
    <Link href={`/commodities/${c.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 20px",
        transition: "all 0.2s", cursor: "pointer", height: "100%",
      }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; }}
         onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${catColor}12`, display: "flex", alignItems: "center", justifyContent: "center", color: catColor }}>
              {getCategoryIcon(c.category)}
            </div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{c.name}</div>
              <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>{c.exchange} · {c.symbol}</div>
            </div>
          </div>
          <span style={{ fontSize: "0.56rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${catColor}10`, color: catColor }}>{c.category}</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#1a1a2e" }}>
              {displayPrice}
              <span style={{ fontSize: "0.62rem", color: "#6b7280", fontWeight: 500, marginLeft: 4 }}>{c.unit.replace("$", "").replace("/", " per ")}</span>
              {livePrice && <span style={{ fontSize: "0.45rem", color: "#10b981", marginLeft: 4 }}>LIVE</span>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: change >= 0 ? "#059669" : "#dc2626" }}>
            {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change).toFixed(2)}%
          </div>
        </div>

        <div style={{ fontSize: "0.66rem", color: "#9ca3af", marginTop: 8, lineHeight: 1.4 }}>{c.description}</div>
      </div>
    </Link>
  );
}

/* === Section Nav Pill === */
function NavPill({ label, target, active, onClick }: { label: string; target: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer",
      fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
      background: active ? "#1a1a2e" : "#fff", color: active ? "#fff" : "#6b7280",
      boxShadow: active ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
      transition: "all 0.2s",
    }}>{label}</button>
  );
}

/* ===================================================
   MAIN PAGE
   =================================================== */
export default function CommodityIntelligencePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showAI, setShowAI] = useState(true);
  const [activeSection, setActiveSection] = useState("brief");
  const [expandedStory, setExpandedStory] = useState<number | null>(null);
  const [expandedChain, setExpandedChain] = useState<number | null>(null);

  // Live commodity prices
  const { data: liveCommodities, source: commSource, isStale: commStale, lastUpdated: commUpdated } = useCommodityPrices();

  const marketBrief = useMemo(() => {
    const base = generateMarketBrief();
    // Override keyMoves prices with live data where available
    if (Object.keys(liveCommodities).length > 0) {
      const commMap: Record<string, string> = {
        "Crude Oil (WTI)": "CRUDEOIL", "Gold": "GOLD", "Silver": "SILVER", "Copper": "COPPER",
        "Natural Gas": "NATURALGAS", "Wheat": "WHEAT",
      };
      base.keyMoves = base.keyMoves.map(d => {
        const apiKey = commMap[d.commodity];
        const live = apiKey ? liveCommodities[apiKey] : undefined;
        if (live && live.price > 0) {
          return { ...d, price: `$${live.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, change: live.changePercent };
        }
        return d;
      });
    }
    return base;
  }, [liveCommodities]);
  const dailyStories = useMemo(() => generateDailyStories(), []);

  const filtered = useMemo(() => {
    let items = COMMODITIES;
    if (category !== "All") items = items.filter(c => c.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, category]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: COMMODITIES.length };
    for (const c of COMMODITIES) { counts[c.category] = (counts[c.category] || 0) + 1; }
    return counts;
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #0f0f23, #1a1a2e)", color: "#fff", padding: "18px 40px", position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
        <div style={{ maxWidth: 1260, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/analyze" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem" }}>
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.15rem", fontWeight: 800 }}>AI Global Commodities Intelligence</span>
                <span style={{ fontSize: "0.6rem", padding: "3px 8px", borderRadius: 5, background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,179,8,0.2))", color: "#fbbf24", fontWeight: 700 }}>MACRO AI</span>
              </div>
              <div style={{ fontSize: "0.66rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{COMMODITIES.length} commodities · {GLOBAL_PLAYERS.length} global players · {GLOBAL_CHOKEPOINTS.length} strategic chokepoints</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setShowAI(!showAI)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid rgba(245,158,11,0.3)", background: showAI ? "rgba(245,158,11,0.15)" : "transparent", color: showAI ? "#fbbf24" : "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 }}>
              <Brain size={13} /> AI {showAI ? "ON" : "OFF"}
            </button>
            <div style={{ position: "relative", width: 300 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search commodities..."
                style={{ width: "100%", padding: "9px 14px 9px 34px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: "0.8rem", outline: "none" }} />
            </div>
          </div>
        </div>
      </header>

      {/* Section Nav Pills */}
      {showAI && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 40px", position: "sticky", top: 68, zIndex: 40 }}>
          <div style={{ maxWidth: 1260, margin: "0 auto", display: "flex", gap: 8, overflowX: "auto" }}>
            {[
              { id: "brief", label: "AI Market Brief" },
              { id: "stories", label: "Story Feed" },
              { id: "power-map", label: "Global Power Map" },
              { id: "chokepoints", label: "Strategic Chokepoints" },
              { id: "impact", label: "Impact Flows" },
              { id: "commodities", label: "All Commodities" },
            ].map(s => (
              <NavPill key={s.id} label={s.label} target={s.id} active={activeSection === s.id} onClick={() => scrollTo(s.id)} />
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1260, margin: "0 auto", padding: "24px 40px" }}>

        {/* ============ AI MARKET BRIEF ============ */}
        {showAI && (
          <section id="brief" style={{ marginBottom: 32 }}>
            <div style={{ background: "linear-gradient(135deg, #0f0f23, #1a1035)", borderRadius: 16, padding: "26px 30px", color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #f59e0b, #eab308)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Brain size={17} style={{ color: "#fff" }} />
                  </div>
                  <span style={{ fontSize: "0.88rem", fontWeight: 800 }}>AI Commodity Brief</span>
                  <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                    <Radio size={9} style={{ color: "#4ade80", animation: "pulse 2s ease infinite" }} />
                    <span style={{ fontSize: "0.6rem", color: "#4ade80", fontWeight: 600 }}>LIVE</span>
                  </div>
                </div>

                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fbbf24", marginBottom: 10, lineHeight: 1.4 }}>{marketBrief.headline}</div>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.65, margin: "0 0 16px" }}>{marketBrief.narrative}</p>

                {/* Key Moves Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16 }}>
                  {marketBrief.keyMoves.map((m, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: 3 }}>{m.commodity}</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#fff" }}>{m.price}</div>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: m.change >= 0 ? "#4ade80" : "#f87171", marginTop: 2 }}>{m.change > 0 ? "+" : ""}{m.change}%</div>
                    </div>
                  ))}
                </div>

                {/* Supply Chain Alert + Macro Signal */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div style={{ fontSize: "0.66rem", fontWeight: 700, color: "#fbbf24", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <Globe size={12} /> Supply Chain Alert
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{marketBrief.supplyChainAlert}</div>
                  </div>
                  <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <div style={{ fontSize: "0.66rem", fontWeight: 700, color: "#a5b4fc", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <BarChart3 size={12} /> Macro Signal
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{marketBrief.macroSignal}</div>
                  </div>
                </div>
              </div>
              <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
            </div>
          </section>
        )}

        {/* ============ AI STORY FEED ============ */}
        {showAI && (
          <section id="stories" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <BookOpen size={18} style={{ color: "#f59e0b" }} />
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>AI Commodity Story Feed</h2>
              <span style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 600 }}>Stories that explain why commodities are moving</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {dailyStories.map((story, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px", cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => setExpandedStory(expandedStory === i ? null : i)}
                  onMouseOver={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)"; }}
                  onMouseOut={e => { e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: "0.56rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: story.severity === "high" ? "#fef2f2" : "#fffbeb", color: story.severity === "high" ? "#dc2626" : "#d97706", textTransform: "uppercase" }}>{story.category}</span>
                    <span style={{ fontSize: "0.6rem", color: "#9ca3af" }}>{story.timeAgo}</span>
                  </div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1a1a2e", marginBottom: 8, lineHeight: 1.4 }}>{story.headline}</div>
                  {expandedStory === i && (
                    <div style={{ fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.6, marginTop: 8, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                      {story.story}
                    </div>
                  )}
                  <div style={{ fontSize: "0.62rem", color: "#6366f1", fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    {expandedStory === i ? "Show less" : "Read analysis"} <ChevronRight size={10} style={{ transform: expandedStory === i ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ GLOBAL COMMODITY POWER MAP ============ */}
        {showAI && (
          <section id="power-map" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Globe size={18} style={{ color: "#6366f1" }} />
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Global Commodity Power Map</h2>
              <span style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 600 }}>Who controls the world's resources</span>
            </div>

            {/* Country Profiles */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={14} style={{ color: "#059669" }} /> Commodity Superpowers
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {COUNTRY_PROFILES.slice(0, 8).map((cp, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #eff6ff, #f0f9ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800, color: "#2563eb" }}>{cp.flag.slice(0, 2)}</div>
                      <div>
                        <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1a1a2e" }}>{cp.country}</div>
                        <div style={{ fontSize: "0.58rem", color: "#6b7280" }}>{cp.geopoliticalInfluence}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                      {cp.dominantCommodities.map((dc, j) => (
                        <span key={j} style={{ fontSize: "0.56rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#f3f4f6", color: "#374151" }}>{dc.commodity} ({dc.globalShare})</span>
                      ))}
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <Lightbulb size={12} style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }} />
                        <div style={{ fontSize: "0.7rem", color: "#4b5563", lineHeight: 1.5 }}>{cp.whyMatters}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Players */}
            <div>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#374151", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={14} style={{ color: "#6366f1" }} /> Global Commodity Giants
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {GLOBAL_PLAYERS.slice(0, 12).map((gp, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px 18px", transition: "all 0.2s" }}
                    onMouseOver={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.04)"; }}
                    onMouseOut={e => { e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1a1a2e" }}>{gp.name}</div>
                        <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>{gp.country} · {gp.type}</div>
                      </div>
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#6366f110", color: "#6366f1" }}>{gp.marketShare}</span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#4b5563", marginBottom: 8 }}>{gp.description}</div>
                    <div style={{ background: "#fffbeb", borderRadius: 6, padding: "8px 10px", border: "1px solid #fef3c7" }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#d97706", marginBottom: 2 }}>WHY THIS MATTERS</div>
                      <div style={{ fontSize: "0.64rem", color: "#92400e", lineHeight: 1.45 }}>{gp.whyMatters}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============ STRATEGIC CHOKEPOINTS ============ */}
        {showAI && (
          <section id="chokepoints" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Anchor size={18} style={{ color: "#0ea5e9" }} />
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Strategic Chokepoints & Trade Routes</h2>
              <span style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 600 }}>Where global commodity trade can be disrupted</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {GLOBAL_CHOKEPOINTS.map((cp, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${cp.riskLevel === "high" ? "#fecaca" : cp.riskLevel === "medium" ? "#fed7aa" : "#e5e7eb"}`, padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1a1a2e" }}>{cp.name}</div>
                      <div style={{ fontSize: "0.62rem", color: "#6b7280" }}>{cp.location}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#374151" }}>{cp.globalTradeShare}</span>
                      <span style={{ fontSize: "0.56rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", background: cp.riskLevel === "high" ? "#fef2f2" : cp.riskLevel === "medium" ? "#fffbeb" : "#f0fdf4", color: cp.riskLevel === "high" ? "#dc2626" : cp.riskLevel === "medium" ? "#d97706" : "#059669" }}>
                        {cp.riskLevel} risk
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#4b5563", marginBottom: 8 }}>{cp.description}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                    {cp.commoditiesAffected.slice(0, 4).map((c, j) => (
                      <Link key={j} href={`/commodities/${c}`} style={{ fontSize: "0.56rem", fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#f3f4f6", color: "#6366f1", textDecoration: "none" }}>{c.replace(/-/g, " ")}</Link>
                    ))}
                  </div>
                  <div style={{ background: "#fffbeb", borderRadius: 6, padding: "8px 10px", border: "1px solid #fef3c7" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <Lightbulb size={11} style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }} />
                      <div style={{ fontSize: "0.66rem", color: "#92400e", lineHeight: 1.5 }}>{cp.whyMatters}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ IMPACT FLOW CHAINS ============ */}
        {showAI && (
          <section id="impact" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Zap size={18} style={{ color: "#dc2626" }} />
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Commodity Impact Flow Chains</h2>
              <span style={{ fontSize: "0.6rem", color: "#6b7280", fontWeight: 600 }}>How commodity price changes ripple through the economy</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {IMPACT_CHAINS.map((chain, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px 22px", cursor: "pointer" }}
                  onClick={() => setExpandedChain(expandedChain === i ? null : i)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #fef2f2, #fff1f2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TrendingUp size={15} style={{ color: "#dc2626" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#1a1a2e" }}>{chain.trigger}</div>
                      <Link href={`/commodities/${chain.triggerCommodity}`} style={{ fontSize: "0.6rem", color: "#6366f1", textDecoration: "none" }}>View {chain.triggerCommodity.replace(/-/g, " ")} analysis →</Link>
                    </div>
                  </div>

                  {/* Flow Steps */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {chain.steps.slice(0, expandedChain === i ? chain.steps.length : 4).map((step, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: `hsl(${j * 40}, 70%, 95%)`, border: `2px solid hsl(${j * 40}, 70%, 60%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 800, color: `hsl(${j * 40}, 70%, 40%)` }}>{j + 1}</div>
                          {j < (expandedChain === i ? chain.steps.length - 1 : 3) && <div style={{ width: 2, height: 12, background: "#e5e7eb" }} />}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#374151", fontWeight: 600 }}>{step.event}</div>
                        <ArrowRight size={10} style={{ color: "#9ca3af", flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>

                  {expandedChain === i && (
                    <div style={{ background: "#fffbeb", borderRadius: 8, padding: "10px 12px", marginTop: 10, border: "1px solid #fef3c7" }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#d97706", marginBottom: 4 }}>WHY THIS MATTERS</div>
                      <div style={{ fontSize: "0.68rem", color: "#92400e", lineHeight: 1.5 }}>{chain.whyMatters}</div>
                    </div>
                  )}

                  <div style={{ fontSize: "0.62rem", color: "#6366f1", fontWeight: 600, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    {expandedChain === i ? "Show less" : `See full chain (${chain.steps.length} steps)`} <ChevronRight size={10} style={{ transform: expandedChain === i ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============ CATEGORY FILTERS + COMMODITY GRID ============ */}
        <section id="commodities">
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {COMMODITY_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600,
                background: category === cat ? "#1a1a2e" : "#fff", color: category === cat ? "#fff" : "#6b7280",
                boxShadow: category !== cat ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}>
                {cat !== "All" && <span style={{ color: category === cat ? "#fff" : getCategoryColor(cat) }}>{getCategoryIcon(cat)}</span>}
                {cat} {categoryCounts[cat] ? `(${categoryCounts[cat]})` : ""}
              </button>
            ))}
            <div style={{ marginLeft: "auto", fontSize: "0.74rem", color: "#6b7280", fontWeight: 600, display: "flex", alignItems: "center" }}>
              {filtered.length} commodities
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {filtered.map(c => {
              // Map commodity symbol to live price API key
              const symMap: Record<string, string> = {
                CL: "CRUDEOIL", BZ: "BRENTCRUDEOIL", NG: "NATURALGAS",
                GC: "GOLD", SI: "SILVER", PL: "PLATINUM", PA: "PALLADIUM",
                HG: "COPPER", AL: "ALUMINIUM",
                CT: "COTTON", ZW: "WHEAT", ZC: "CORN", ZS: "SOYBEAN",
                SB: "SUGAR", KC: "COFFEE", CC: "COCOA",
              };
              const apiKey = symMap[c.symbol];
              const lp = apiKey ? liveCommodities[apiKey] : undefined;
              return <CommodityCard key={c.slug} c={c} livePrice={lp ? { price: lp.price, changePercent: lp.changePercent, currency: lp.currency } : undefined} />;
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>No commodities found</div>
              <div style={{ fontSize: "0.82rem" }}>Try a different search or category.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
