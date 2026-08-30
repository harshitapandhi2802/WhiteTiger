"use client";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Building2, MapPin, TrendingUp, ArrowUpRight, ArrowDownRight, Search, ChevronRight,
  ChevronLeft, Globe, IndianRupee, Calculator, Shield, Flame, Target, Activity,
  BarChart3, Layers, Zap, AlertTriangle, CheckCircle, Home, Factory, Landmark,
  Train, Plane, Star, Eye, X, Clock, Database, RefreshCw, Info, ChevronDown,
  Map, Compass, Navigation, Filter, Radio, Wifi, Award, TrendingDown,
  FileText, Users, Send, Mail, MailOpen, CheckSquare, XCircle, CircleDot,
  Briefcase, PieChart, GitBranch, ArrowRight, Phone, Inbox, Repeat, Settings,
  DollarSign, Building, Truck, GripHorizontal, Plus, MoreVertical,
} from "lucide-react";
import {
  INDIA_STATES, INDIA_RE_STATS, getAllIndiaCities, getTopIndiaCities,
  COUNTRIES_RE, CITIES_RE, WORLD_REGIONS, INFRA_PROJECTS, STOCK_IMPACTS,
  BUBBLE_METRICS, MORTGAGE_DATA, MACRO_ENGINE, REITS, INSTITUTIONAL_INDICATORS,
  AI_INSIGHTS, generateMarketData, generateCityGrowthIntelligence, generateRECopilot,
  generateREStories, generateSparkline, getLocalities,
  CRE_LENDERS, SAMPLE_DEALS, SAMPLE_QUOTES, SAMPLE_OUTREACH, DEAL_STATUSES, DEAL_STATUS_COLORS,
  getQuotesForDeal, getOutreachForDeal, matchLenders,
  type IndiaState, type IndiaCity, type CityRE, type CountryRE, type WorldRegion, type Locality,
  type CRELender, type CREDeal, type FinancingQuote, type OutreachRecord, type DealStatus,
} from "@/lib/realestate";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Real Estate Intelligence Platform
   Inspired by LEV · CRE Deal Management + Market Intelligence
   Discover · Finance · Pipeline · Deal Room · Intelligence
   ══════════════════════════════════════════════════════════════════ */

/* ── Design tokens ── */
const C = {
  bg: "#0A0E1A", card: "#14213D", card2: "#1A2744", border: "rgba(232,237,245,0.06)",
  accent: "#4A9EFF", gold: "#C5A572", success: "#34D399", danger: "#F87171",
  warn: "#FBBF24", purple: "#a78bfa", teal: "#2DD4BF", orange: "#FB923C",
  text: "#E8EDF5", muted: "rgba(255,255,255,0.35)", dim: "rgba(255,255,255,0.12)",
};

/* ── Heatmap helper ── */
const heatColor = (val: number, max: number) => {
  const t = Math.min(1, Math.max(0, val / max));
  if (t > 0.75) return C.success;
  if (t > 0.5) return C.accent;
  if (t > 0.25) return C.warn;
  return C.danger;
};

/* ── Reusable atoms ── */
const Badge = ({ children, color = C.accent, bg }: { children: React.ReactNode; color?: string; bg?: string }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 8, fontSize: "0.68rem", fontWeight: 700, color, background: bg || `${color}15`, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>{children}</span>
);
const ScoreRing = ({ score, size = 48, label, color }: { score: number; size?: number; label?: string; color?: string }) => {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, fill = c * (1 - score / 100);
  const col = color || (score >= 75 ? C.success : score >= 50 ? C.warn : C.danger);
  return (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={3.5} strokeDasharray={c} strokeDashoffset={fill} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill="#fff" fontSize={size * 0.3} fontWeight={800} style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>{score}</text>
    </svg>
    {label && <span style={{ fontSize: "0.6rem", color: C.muted, textAlign: "center", lineHeight: 1.1 }}>{label}</span>}
  </div>);
};
const Src = ({ s }: { s: string }) => (<span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.6rem", color: C.dim, padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.025)", border: `0.5px solid ${C.border}` }}><Database size={8} />{s}</span>);
const Time = () => (<span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.6rem", color: C.dim }}><Clock size={8} />{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST</span>);
const Spark = ({ data, color = C.success, w = 80, h = 22 }: { data: number[]; color?: string; w?: number; h?: number }) => {
  if (!data.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * h}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" /></svg>;
};

const cb: React.CSSProperties = { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 16, padding: 18, position: "relative", overflow: "hidden" };
const btn = (active: boolean, color: string): React.CSSProperties => ({ padding: "6px 14px", borderRadius: 10, fontSize: "0.72rem", fontWeight: 600, border: `1px solid ${active ? `${color}50` : C.border}`, background: active ? `${color}12` : "rgba(255,255,255,0.02)", color: active ? color : C.muted, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" });
const hoverCard = (e: React.MouseEvent, enter: boolean) => {
  const t = e.currentTarget as HTMLElement;
  t.style.borderColor = enter ? `${C.accent}40` : C.border;
  t.style.transform = enter ? "translateY(-2px)" : "none";
};

/* ══════════════════════════════════════════════════════════════════
   TAB 1: DISCOVER — Map-First Property & Market Intelligence
   ══════════════════════════════════════════════════════════════════ */

type MapLayer = "investment" | "appreciation" | "yield" | "demand" | "infra" | "affordability" | "risk";

const STATE_GEO: Record<string, { x: number; y: number; r: number }> = {
  MH: { x: 135, y: 310, r: 22 }, KA: { x: 145, y: 388, r: 18 }, TS: { x: 195, y: 340, r: 16 },
  DL: { x: 195, y: 128, r: 20 }, TN: { x: 190, y: 430, r: 17 }, GJ: { x: 75, y: 228, r: 18 },
  RJ: { x: 115, y: 170, r: 20 }, KL: { x: 148, y: 455, r: 12 }, PB: { x: 162, y: 92, r: 12 },
  UP: { x: 245, y: 158, r: 22 }, WB: { x: 310, y: 225, r: 14 }, GA: { x: 112, y: 362, r: 8 },
  HR: { x: 178, y: 110, r: 10 }, AP: { x: 198, y: 378, r: 15 }, MP: { x: 195, y: 235, r: 20 },
  OD: { x: 270, y: 285, r: 14 }, JH: { x: 285, y: 208, r: 12 }, AS: { x: 368, y: 138, r: 12 },
  UK: { x: 220, y: 88, r: 10 },
};

const INFRA_CORRIDORS = [
  { from: "MH", to: "GJ", label: "DMIC", color: C.gold },
  { from: "MH", to: "KA", label: "NH-48", color: C.accent },
  { from: "KA", to: "TS", label: "IT Corridor", color: C.teal },
  { from: "DL", to: "MH", label: "Bullet Train", color: C.orange },
  { from: "DL", to: "UP", label: "Jewar Corridor", color: C.success },
  { from: "TN", to: "KA", label: "NH-44", color: C.accent },
];

const MAP_LAYERS: { id: MapLayer; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "investment", label: "Investment", icon: <Target size={11} />, color: C.accent },
  { id: "appreciation", label: "Growth", icon: <TrendingUp size={11} />, color: C.success },
  { id: "yield", label: "Yield", icon: <IndianRupee size={11} />, color: C.gold },
  { id: "demand", label: "Demand", icon: <Flame size={11} />, color: C.danger },
  { id: "infra", label: "Infra", icon: <Train size={11} />, color: C.teal },
  { id: "affordability", label: "Afford.", icon: <Home size={11} />, color: C.purple },
  { id: "risk", label: "Risk", icon: <Shield size={11} />, color: C.warn },
];

function IndiaGeoMap({ layer, onStateClick, hoveredState, setHoveredState }: {
  layer: MapLayer; onStateClick: (code: string) => void; hoveredState: string | null; setHoveredState: (s: string | null) => void;
}) {
  const getVal = useCallback((s: IndiaState): number => {
    switch (layer) {
      case "investment": return s.investmentScore;
      case "appreciation": return s.appreciation * 4;
      case "yield": return s.rentalYield * 20;
      case "demand": return s.demandTrend === "Surging" ? 90 : s.demandTrend === "Rising" ? 70 : 45;
      case "infra": return s.investmentScore * 0.8;
      case "affordability": return Math.max(0, 100 - s.avgPriceSqft / 300);
      case "risk": return s.riskLevel === "Low" ? 85 : s.riskLevel === "Medium" ? 50 : 20;
      default: return s.investmentScore;
    }
  }, [layer]);
  const indiaPath = "M190,22 L215,12 L255,22 L280,40 L295,60 L275,78 L260,100 L290,112 L330,118 L360,108 L385,95 L395,108 L385,135 L365,155 L340,168 L320,195 L300,228 L285,265 L270,295 L248,325 L225,358 L205,388 L192,415 L178,440 L165,448 L152,438 L142,415 L130,385 L118,355 L105,325 L92,295 L78,258 L62,225 L52,195 L55,165 L72,138 L92,112 L118,92 L140,72 L160,50 Z";
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 400, margin: "0 auto" }}>
      <svg viewBox="0 0 440 480" style={{ width: "100%", height: "auto" }}>
        <defs>
          <radialGradient id="mapG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={C.accent} stopOpacity={0.08} /><stop offset="100%" stopColor="transparent" /></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <ellipse cx="220" cy="260" rx="200" ry="240" fill="url(#mapG)" />
        <path d={indiaPath} fill="rgba(74,158,255,0.04)" stroke="rgba(74,158,255,0.12)" strokeWidth={1.2} />
        {INFRA_CORRIDORS.map((c, i) => {
          const f = STATE_GEO[c.from], t = STATE_GEO[c.to];
          if (!f || !t) return null;
          return <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={c.color} strokeWidth={1} strokeOpacity={0.2} strokeDasharray="4 4"><animate attributeName="stroke-dashoffset" from="8" to="0" dur="2s" repeatCount="indefinite" /></line>;
        })}
        {INDIA_STATES.map(s => {
          const geo = STATE_GEO[s.code]; if (!geo) return null;
          const val = getVal(s), col = heatColor(val, 100), isH = hoveredState === s.code, sc = isH ? 1.3 : 1;
          return (
            <g key={s.code} style={{ cursor: "pointer" }} onClick={() => onStateClick(s.code)} onMouseEnter={() => setHoveredState(s.code)} onMouseLeave={() => setHoveredState(null)}>
              {s.demandTrend === "Surging" && <circle cx={geo.x} cy={geo.y} r={geo.r * 1.8} fill={col} opacity={0.08}><animate attributeName="r" values={`${geo.r * 1.2};${geo.r * 2};${geo.r * 1.2}`} dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.12;0.02;0.12" dur="3s" repeatCount="indefinite" /></circle>}
              <circle cx={geo.x} cy={geo.y} r={geo.r * sc} fill={`${col}20`} stroke={col} strokeWidth={isH ? 2.5 : 1.5} style={{ transition: "all 0.3s" }} />
              <text x={geo.x} y={geo.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={isH ? 11 : 9} fontWeight={700} style={{ pointerEvents: "none" }}>{Math.round(val)}</text>
              {isH && <text x={geo.x} y={geo.y - geo.r - 6} textAnchor="middle" fill={col} fontSize={10} fontWeight={700}>{s.name}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DiscoverTab({ onCityClick }: { onCityClick: (c: IndiaCity) => void }) {
  const [layer, setLayer] = useState<MapLayer>("investment");
  const [search, setSearch] = useState("");
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selState, setSelState] = useState<IndiaState | null>(null);
  const [selCity, setSelCity] = useState<IndiaCity | null>(null);
  const [selLoc, setSelLoc] = useState<Locality | null>(null);
  const [aiMode, setAiMode] = useState<"simple" | "advanced">("simple");
  const [loan, setLoan] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  // Live prices for the real-estate-linked NSE stocks shown in the sidebar
  const [liveStocks, setLiveStocks] = useState<Record<string, { price: number; changePercent: number }>>({});
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/live-prices?type=stocks", { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { if (d?.prices) setLiveStocks(d.prices); })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);
  const topCities = useMemo(() => getTopIndiaCities(6), []);

  const filteredCities = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return getAllIndiaCities().filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)).slice(0, 6);
  }, [search]);

  const hovSt = hoveredState ? INDIA_STATES.find(s => s.code === hoveredState) : null;
  const localities = selCity ? getLocalities(selCity.name) : [];

  // LOCALITY VIEW
  if (selLoc && selCity) {
    const sp = generateSparkline(selLoc.name + selLoc.city, selLoc.appreciation);
    const fc = selLoc.futureGrowthProb > 75 ? C.success : selLoc.futureGrowthProb > 50 ? C.accent : C.warn;
    return (
      <div>
        <button onClick={() => setSelLoc(null)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `0.5px solid ${C.border}`, cursor: "pointer", marginBottom: 14, fontSize: "0.75rem", color: C.muted }}><ChevronLeft size={13} /> {selLoc.city}</button>
        <div style={{ ...cb, marginBottom: 16, padding: 24, background: `linear-gradient(135deg, ${C.card}, rgba(74,158,255,0.05))` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", margin: 0 }}>{selLoc.name}</h2>
              <div style={{ fontSize: "0.75rem", color: C.muted }}>{selLoc.city} · {selLoc.type}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <Badge color={selLoc.aiRecommendation === "Strong Buy" ? C.success : selLoc.aiRecommendation === "Buy" ? C.accent : C.warn}>{selLoc.aiRecommendation}</Badge>
                <Badge color={selLoc.demandTrend === "Hot" ? C.danger : C.warn}>{selLoc.demandTrend}</Badge>
              </div>
            </div>
            <Spark data={sp} w={120} h={40} color={selLoc.appreciation > 15 ? C.success : C.accent} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 18 }}>
            {[{ l: "₹/sqft", v: `₹${selLoc.avgPriceSqft.toLocaleString("en-IN")}`, c: "#fff" }, { l: "Growth", v: `+${selLoc.appreciation}%`, c: C.success }, { l: "Yield", v: `${selLoc.rentalYield}%`, c: C.gold }, { l: "Infra", v: `${selLoc.infraScore}/10`, c: C.teal }, { l: "Liquidity", v: `${selLoc.liquidityScore}/10`, c: C.purple }, { l: "Future", v: `${selLoc.futureGrowthProb}%`, c: fc }].map(m => (
              <div key={m.l} style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.025)" }}><div style={{ fontSize: "0.55rem", color: C.dim, marginBottom: 2 }}>{m.l}</div><div style={{ fontSize: "0.95rem", fontWeight: 700, color: m.c }}>{m.v}</div></div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ ...cb, border: `0.5px solid ${C.accent}20` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Zap size={15} color={C.accent} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>AI Verdict</span></div>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{selLoc.aiReason}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "center" }}>
              <ScoreRing score={Math.min(100, selLoc.appreciation * 4)} size={52} label="Growth" color={C.success} />
              <ScoreRing score={Math.min(100, selLoc.rentalYield * 18)} size={52} label="Yield" color={C.gold} />
              <ScoreRing score={selLoc.infraScore * 10} size={52} label="Infra" color={C.teal} />
              <ScoreRing score={selLoc.futureGrowthProb} size={52} label="Future" color={fc} />
            </div>
          </div>
          <div style={{ ...cb }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Compass size={15} color={C.gold} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Neighborhood</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.02)", textAlign: "center" }}><div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.accent }}>{selLoc.schools}</div><div style={{ fontSize: "0.6rem", color: C.muted }}>Schools</div></div>
              <div style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.02)", textAlign: "center" }}><div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.danger }}>{selLoc.hospitals}</div><div style={{ fontSize: "0.6rem", color: C.muted }}>Hospitals</div></div>
            </div>
            {selLoc.nearbyInfra.map(inf => (<div key={inf} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}><CheckCircle size={12} color={C.success} /> {inf}</div>))}
          </div>
        </div>
      </div>
    );
  }

  // CITY VIEW
  if (selCity) {
    const md = generateMarketData(selCity.name, selCity.appreciation);
    const copilot = generateRECopilot(selCity.name);
    const growth = generateCityGrowthIntelligence(selCity.name);
    const spark = generateSparkline(selCity.name, selCity.appreciation);
    const infra = INFRA_PROJECTS.filter(p => p.impactCities.includes(selCity.name));
    const mr = rate / 12 / 100, mn = tenure * 12;
    const emi = loan * mr * Math.pow(1 + mr, mn) / (Math.pow(1 + mr, mn) - 1);

    return (
      <div>
        <button onClick={() => { setSelCity(null); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `0.5px solid ${C.border}`, cursor: "pointer", marginBottom: 14, fontSize: "0.75rem", color: C.muted }}><ChevronLeft size={13} /> {selState ? selState.name : "Map"}</button>
        {/* Hero */}
        <div style={{ ...cb, marginBottom: 16, padding: 22, background: `linear-gradient(135deg, ${C.card}, rgba(74,158,255,0.04))` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: "1.4rem" }}>🇮🇳</span><div><h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", margin: 0 }}>{selCity.name}</h2><div style={{ fontSize: "0.72rem", color: C.muted }}>{selCity.state} · Tier {selCity.tier} · {selCity.population}</div></div></div>
              <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>{selCity.hotSectors.map(s => <Badge key={s} color={C.gold}>{s}</Badge>)}<Badge color={selCity.demandTrend === "Surging" ? C.success : C.accent}>{selCity.demandTrend}</Badge></div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}><Spark data={spark} w={90} h={32} /><ScoreRing score={selCity.investmentScore} size={60} label="Score" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginTop: 16 }}>
            {[{ l: "Avg Price", v: `₹${selCity.avgPriceSqft.toLocaleString("en-IN")}/sqft`, c: "#fff" }, { l: "Growth", v: `+${selCity.appreciation}%`, c: C.success }, { l: "Yield", v: `${selCity.rentalYield}%`, c: C.gold }, { l: "Total Return", v: `${(selCity.appreciation + selCity.rentalYield).toFixed(1)}%`, c: C.accent }].map(m => (
              <div key={m.l} style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.025)" }}><div style={{ fontSize: "0.52rem", color: C.dim }}>{m.l}</div><div style={{ fontSize: "0.92rem", fontWeight: 700, color: m.c }}>{m.v}</div></div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 14 }}>
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Localities */}
            {localities.length > 0 && (<div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Navigation size={15} color={C.accent} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Locality Intelligence</span><Badge color={C.accent}>{localities.length} zones</Badge></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>{localities.map(loc => (
                <button key={loc.name} onClick={() => setSelLoc(loc)} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `0.5px solid ${C.border}`, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }} onMouseEnter={e => hoverCard(e, true)} onMouseLeave={e => hoverCard(e, false)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>{loc.name}</span><Badge color={loc.aiRecommendation === "Strong Buy" ? C.success : loc.aiRecommendation === "Buy" ? C.accent : C.warn}>{loc.aiRecommendation}</Badge></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 4 }}>
                    <div><div style={{ fontSize: "0.48rem", color: C.dim }}>₹/sqft</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>₹{loc.avgPriceSqft.toLocaleString("en-IN")}</div></div>
                    <div><div style={{ fontSize: "0.48rem", color: C.dim }}>Growth</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.success }}>+{loc.appreciation}%</div></div>
                    <div><div style={{ fontSize: "0.48rem", color: C.dim }}>Yield</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.gold }}>{loc.rentalYield}%</div></div>
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{loc.aiReason}</div>
                </button>
              ))}</div></div>)}
            {/* Infra */}
            {infra.length > 0 && (<div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Train size={15} color={C.teal} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Infrastructure</span></div>
              {infra.map(p => (<div key={p.name} style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.02)", marginBottom: 6, borderLeft: `2px solid ${p.status === "Operational" ? C.success : C.accent}` }}><div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>{p.name}</div><div style={{ fontSize: "0.62rem", color: C.muted }}>{p.investment} · <span style={{ color: C.success }}>{p.priceImpact}</span></div></div>))}</div>)}
            {/* AI Strategist */}
            <div style={{ ...cb, border: `0.5px solid ${C.accent}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Zap size={15} color={C.accent} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>AI Strategist</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>{(["simple", "advanced"] as const).map(m => (<button key={m} onClick={() => setAiMode(m)} style={{ ...btn(aiMode === m, C.accent), padding: "4px 10px", fontSize: "0.6rem" }}>{m === "simple" ? "Simple" : "Pro"}</button>))}</div>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: `${copilot.moodColor}08`, border: `0.5px solid ${copilot.moodColor}20`, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: "1.2rem" }}>{copilot.moodEmoji}</span><div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: copilot.moodColor }}>{copilot.marketMood}</div></div></div>
              {aiMode === "simple" ? <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{copilot.beginnerStory}</p> : (
                <div><p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5, fontFamily: "monospace" }}>{copilot.institutionalBrief}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginTop: 10 }}><ScoreRing score={growth.growthScore} size={42} label="Growth" /><ScoreRing score={growth.futurePotentialScore} size={42} label="Future" /><ScoreRing score={growth.smartMoneyScore} size={42} label="Smart$" /><ScoreRing score={growth.infraMomentumScore} size={42} label="Infra" /><ScoreRing score={growth.bubbleRiskScore} size={42} label="Bubble" color={growth.bubbleRiskScore > 60 ? C.danger : C.success} /></div></div>)}
            </div>
            {/* EMI */}
            <div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Calculator size={15} color={C.accent} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>EMI Calculator</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div><label style={{ fontSize: "0.62rem", color: C.muted, display: "block", marginBottom: 3 }}>Loan: ₹{(loan / 100000).toFixed(0)}L</label><input type="range" min={500000} max={50000000} step={500000} value={loan} onChange={e => setLoan(+e.target.value)} style={{ width: "100%", accentColor: C.accent }} /></div>
                  <div><label style={{ fontSize: "0.62rem", color: C.muted, display: "block", marginBottom: 3 }}>Rate: {rate}%</label><input type="range" min={6} max={14} step={0.1} value={rate} onChange={e => setRate(+e.target.value)} style={{ width: "100%", accentColor: C.accent }} /></div>
                  <div><label style={{ fontSize: "0.62rem", color: C.muted, display: "block", marginBottom: 3 }}>Tenure: {tenure}yr</label><input type="range" min={5} max={30} step={1} value={tenure} onChange={e => setTenure(+e.target.value)} style={{ width: "100%", accentColor: C.accent }} /></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ padding: "12px 14px", borderRadius: 12, background: `${C.accent}10`, border: `1px solid ${C.accent}25`, textAlign: "center" }}><div style={{ fontSize: "0.6rem", color: C.muted }}>Monthly EMI</div><div style={{ fontSize: "1.3rem", fontWeight: 800, color: C.accent }}>₹{Math.round(emi).toLocaleString("en-IN")}</div></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div style={{ padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.02)", textAlign: "center" }}><div style={{ fontSize: "0.52rem", color: C.dim }}>Interest</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.danger }}>₹{((emi * mn - loan) / 100000).toFixed(1)}L</div></div>
                    <div style={{ padding: 8, borderRadius: 8, background: `${C.success}06`, textAlign: "center" }}><div style={{ fontSize: "0.52rem", color: C.dim }}>Min Income</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.success }}>₹{Math.round(emi / 0.4).toLocaleString("en-IN")}</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Target size={14} color={C.gold} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>Score</span></div><div style={{ display: "flex", gap: 10, justifyContent: "center" }}><ScoreRing score={selCity.investmentScore} size={56} label="Overall" /><ScoreRing score={Math.min(100, Math.round(selCity.appreciation * 4))} size={46} label="Growth" color={C.success} /><ScoreRing score={Math.min(100, Math.round(selCity.rentalYield * 18))} size={46} label="Yield" color={C.gold} /></div></div>
            <div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><BarChart3 size={14} color={C.accent} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>RE Stocks</span>{Object.keys(liveStocks).length > 0 && <span style={{ fontSize: "0.5rem", fontWeight: 800, padding: "1px 5px", borderRadius: 3, background: "rgba(52,211,153,0.14)", color: C.success }}>LIVE</span>}</div>{STOCK_IMPACTS.slice(0, 4).map(s => {
              const lead = s.stocks[0];
              const lp = lead ? liveStocks[lead.ticker] : undefined;
              return (
              <div key={s.sector} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `0.5px solid ${C.border}` }}>
                <span>{s.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#fff" }}>{s.sector}</div>
                  {lp && <div style={{ fontSize: "0.56rem", color: C.muted }}>{lead.ticker} ₹{lp.price.toLocaleString("en-IN")} <span style={{ color: lp.changePercent >= 0 ? C.success : C.danger, fontWeight: 700 }}>{lp.changePercent >= 0 ? "+" : ""}{lp.changePercent.toFixed(2)}%</span></div>}
                </div>
                <Badge color={s.currentSignal === "Bullish" ? C.success : C.warn}>{s.currentSignal}</Badge>
              </div>
            );})}</div>
            <div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><AlertTriangle size={14} color={C.warn} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>Bubble Risk</span></div>{BUBBLE_METRICS.filter(b => b.flag === "🇮🇳").map(b => (<div key={b.city} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `0.5px solid ${C.border}` }}><span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff", flex: 1 }}>{b.city}</span><Badge color={b.riskLevel === "Low" ? C.success : b.riskLevel === "Moderate" ? C.warn : C.danger}>{b.riskLevel}</Badge></div>))}</div>
            <div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Landmark size={14} color={C.purple} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>India REITs</span></div>{REITS.filter(r => r.country === "India").map(r => (<div key={r.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `0.5px solid ${C.border}` }}><div style={{ flex: 1 }}><div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#fff" }}>{r.name}</div><div style={{ fontSize: "0.55rem", color: C.muted }}>Yield {r.dividendYield}%</div></div><span style={{ fontSize: "0.72rem", fontWeight: 700, color: r.change > 0 ? C.success : C.danger }}>₹{r.price}</span></div>))}</div>
          </div>
        </div>
      </div>
    );
  }

  // STATE VIEW
  if (selState) {
    return (
      <div>
        <button onClick={() => setSelState(null)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `0.5px solid ${C.border}`, cursor: "pointer", marginBottom: 14, fontSize: "0.75rem", color: C.muted }}><ChevronLeft size={13} /> India Map</button>
        <div style={{ ...cb, marginBottom: 16, padding: 22, background: `linear-gradient(135deg, ${C.card}, rgba(74,158,255,0.05))` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div><h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>🇮🇳 {selState.name}</h2><div style={{ fontSize: "0.72rem", color: C.muted }}>{selState.capital} · {selState.type}</div><p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginTop: 8, maxWidth: 550 }}>{selState.aiSummary}</p><div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>{selState.keyDrivers.map(d => <Badge key={d} color={C.gold}>{d}</Badge>)}</div></div>
            <ScoreRing score={selState.investmentScore} size={68} label="Score" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginTop: 16 }}>
            {[{ l: "Avg Price", v: `₹${selState.avgPriceSqft.toLocaleString("en-IN")}/sqft` }, { l: "Growth", v: `+${selState.appreciation}%` }, { l: "Yield", v: `${selState.rentalYield}%` }, { l: "Demand", v: selState.demandTrend }].map(m => (<div key={m.l} style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.025)" }}><div style={{ fontSize: "0.52rem", color: C.dim }}>{m.l}</div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>{m.v}</div></div>))}
          </div>
        </div>
        <h3 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", marginBottom: 10 }}>Cities in {selState.name}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>{selState.majorCities.map(city => {
          const sp = generateSparkline(city.name, city.appreciation);
          return (<button key={city.slug} onClick={() => setSelCity(city)} style={{ ...cb, cursor: "pointer", textAlign: "left", transition: "all 0.2s", padding: 14 }} onMouseEnter={e => hoverCard(e, true)} onMouseLeave={e => hoverCard(e, false)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><div style={{ flex: 1 }}><div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>{city.name}</div><div style={{ fontSize: "0.6rem", color: C.muted }}>Tier {city.tier} · {city.population}</div></div><Spark data={sp} w={55} h={18} /><ScoreRing score={city.investmentScore} size={36} /></div>
            <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.4, marginBottom: 6 }}>{city.aiOneLiner}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}><div><div style={{ fontSize: "0.48rem", color: C.dim }}>₹/sqft</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>₹{city.avgPriceSqft.toLocaleString("en-IN")}</div></div><div><div style={{ fontSize: "0.48rem", color: C.dim }}>Growth</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.success }}>+{city.appreciation}%</div></div><div><div style={{ fontSize: "0.48rem", color: C.dim }}>Yield</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.gold }}>{city.rentalYield}%</div></div></div>
          </button>);
        })}</div>
      </div>
    );
  }

  // MAP HOME
  return (
    <div>
      {/* Hero */}
      <div style={{ ...cb, marginBottom: 14, padding: "18px 22px", background: `linear-gradient(135deg, ${C.card}, rgba(74,158,255,0.06))` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: "1.3rem" }}>🇮🇳</span>
          <div style={{ flex: 1 }}><h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: 0 }}>India Real Estate Intelligence</h2><div style={{ fontSize: "0.65rem", color: C.muted }}>{INDIA_STATES.length} states · {getAllIndiaCities().length}+ cities · Locality-level depth</div></div>
          <Src s={INDIA_RE_STATS.dataSource} /><Time />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
          {[{ l: "Industry", v: INDIA_RE_STATS.industrySize }, { l: "GDP", v: INDIA_RE_STATS.gdpContribution }, { l: "Growth", v: INDIA_RE_STATS.annualGrowth }, { l: "RERA", v: "1.12L+" }, { l: "Home Loans", v: INDIA_RE_STATS.homeLoansOutstanding }, { l: "Mortgage", v: INDIA_RE_STATS.avgMortgageRate }].map(s => (<div key={s.l} style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.025)" }}><div style={{ fontSize: "0.5rem", color: C.dim }}>{s.l}</div><div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>{s.v}</div></div>))}
        </div>
      </div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
        <input placeholder="Search any city, state, or locality..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 12, border: `0.5px solid ${C.border}`, background: C.card, color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
        {filteredCities.length > 0 && (<div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: C.card2, border: `0.5px solid ${C.border}`, borderRadius: 12, marginTop: 4, padding: 6, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
          {filteredCities.map(c => (<button key={c.slug} onClick={() => { setSelCity(c); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: "#fff", textAlign: "left" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}><MapPin size={13} color={C.accent} /><div style={{ flex: 1 }}><div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: "0.6rem", color: C.muted }}>{c.state} · +{c.appreciation}%</div></div><ChevronRight size={13} color={C.muted} /></button>))}
        </div>)}
      </div>
      {/* Map + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, marginBottom: 16 }}>
        <div style={{ ...cb, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Map size={15} color={C.accent} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Geo-Intelligence Map</span></div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>{MAP_LAYERS.map(l => (<button key={l.id} onClick={() => setLayer(l.id)} style={{ ...btn(layer === l.id, l.color), display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", fontSize: "0.6rem" }}>{l.icon} {l.label}</button>))}</div>
          <IndiaGeoMap layer={layer} onStateClick={code => { const st = INDIA_STATES.find(s => s.code === code); if (st) setSelState(st); }} hoveredState={hoveredState} setHoveredState={setHoveredState} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8, fontSize: "0.58rem", color: C.muted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: C.success }} /> High</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent }} /> Good</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: C.warn }} /> Moderate</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: C.danger }} /> Low</span>
          </div>
          {hovSt && (<div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: `${C.accent}08`, border: `0.5px solid ${C.accent}20` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>{hovSt.name}</span><ScoreRing score={hovSt.investmentScore} size={32} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, fontSize: "0.65rem" }}>
              <div><span style={{ color: C.dim, fontSize: "0.5rem", display: "block" }}>₹/sqft</span><span style={{ fontWeight: 700, color: "#fff" }}>{hovSt.avgPriceSqft.toLocaleString("en-IN")}</span></div>
              <div><span style={{ color: C.dim, fontSize: "0.5rem", display: "block" }}>Growth</span><span style={{ fontWeight: 700, color: C.success }}>+{hovSt.appreciation}%</span></div>
              <div><span style={{ color: C.dim, fontSize: "0.5rem", display: "block" }}>Yield</span><span style={{ fontWeight: 700, color: C.gold }}>{hovSt.rentalYield}%</span></div>
              <div><span style={{ color: C.dim, fontSize: "0.5rem", display: "block" }}>Demand</span><span style={{ fontWeight: 700, color: hovSt.demandTrend === "Surging" ? C.success : C.accent }}>{hovSt.demandTrend}</span></div>
            </div>
          </div>)}
        </div>
        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}><Award size={14} color={C.gold} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>Top Cities</span></div>
            {topCities.map((c, i) => (<button key={c.slug} onClick={() => setSelCity(c)} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "6px 8px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 800, color: i < 3 ? C.gold : C.dim, width: 16 }}>#{i + 1}</span><div style={{ flex: 1 }}><div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff" }}>{c.name}</div><div style={{ fontSize: "0.55rem", color: C.muted }}>{c.state}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: "0.68rem", fontWeight: 700, color: C.success }}>+{c.appreciation}%</div></div>
            </button>))}
          </div>
          <div style={{ ...cb }}><div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}><Activity size={14} color={C.purple} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.82rem" }}>Macro</span></div>
            {MACRO_ENGINE.slice(0, 3).map(m => (<div key={m.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `0.5px solid ${C.border}` }}><span style={{ fontSize: "0.8rem" }}>{m.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#fff" }}>{m.name}</div><div style={{ fontSize: "0.55rem", color: C.muted }}>{m.currentValue}</div></div><Badge color={m.impactOnRE === "Positive" ? C.success : m.impactOnRE === "Negative" ? C.danger : C.warn}>{m.impactOnRE}</Badge></div>))}
          </div>
        </div>
      </div>
      {/* All States Grid */}
      <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}><Layers size={13} color={C.accent} style={{ verticalAlign: "middle" }} /> All States</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>{[...INDIA_STATES].sort((a, b) => b.investmentScore - a.investmentScore).map(st => (
        <button key={st.code} onClick={() => setSelState(st)} style={{ ...cb, cursor: "pointer", textAlign: "left", transition: "all 0.2s", padding: 14 }} onMouseEnter={e => hoverCard(e, true)} onMouseLeave={e => hoverCard(e, false)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}><div><div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>{st.name}</div><div style={{ fontSize: "0.58rem", color: C.muted }}>{st.capital} · {st.majorCities.length} cities</div></div><ScoreRing score={st.investmentScore} size={34} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}><div><div style={{ fontSize: "0.48rem", color: C.dim }}>₹/sqft</div><div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fff" }}>{st.avgPriceSqft.toLocaleString("en-IN")}</div></div><div><div style={{ fontSize: "0.48rem", color: C.dim }}>Growth</div><div style={{ fontSize: "0.68rem", fontWeight: 700, color: C.success }}>+{st.appreciation}%</div></div><div><div style={{ fontSize: "0.48rem", color: C.dim }}>Demand</div><div style={{ fontSize: "0.68rem", fontWeight: 700, color: st.demandTrend === "Surging" ? C.success : C.accent }}>{st.demandTrend}</div></div></div>
        </button>
      ))}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB 2: FINANCE — Lender Matching + Quote Matrix (LEV Core)
   ══════════════════════════════════════════════════════════════════ */
function FinanceTab() {
  const [sub, setSub] = useState<"lenders" | "quotes" | "rates">("lenders");
  const [lenderType, setLenderType] = useState("All");
  const [selDealForQuotes, setSelDealForQuotes] = useState("D001");
  const [india10Y, setIndia10Y] = useState<number | null>(null);
  const quotes = getQuotesForDeal(selDealForQuotes);
  const outreach = getOutreachForDeal(selDealForQuotes);

  // Link Indian mortgage context to the live 10Y G-Sec benchmark.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/live-yields", { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { if (typeof d?.india10Y === "number") setIndia10Y(d.india10Y); })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const filteredLenders = lenderType === "All" ? CRE_LENDERS : CRE_LENDERS.filter(l => l.type === lenderType);
  const lenderTypes = ["All", "Bank", "NBFC", "HFC", "PE Fund", "Foreign Bank", "DFI"];

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {([{ id: "lenders" as const, l: "Lender Database", i: <Building2 size={13} />, n: CRE_LENDERS.length }, { id: "quotes" as const, l: "Quote Matrix", i: <FileText size={13} />, n: quotes.length }, { id: "rates" as const, l: "Market Rates", i: <TrendingUp size={13} />, n: MORTGAGE_DATA.length }] as const).map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ ...btn(sub === t.id, C.accent), display: "flex", alignItems: "center", gap: 5 }}>{t.i} {t.l} <span style={{ fontSize: "0.6rem", color: C.dim }}>({t.n})</span></button>
        ))}
        <div style={{ marginLeft: "auto" }}><Src s="RBI · NHB · LEV" /><Time /></div>
      </div>

      {/* LENDER DATABASE */}
      {sub === "lenders" && (<div>
        <div style={{ ...cb, marginBottom: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Building2 size={18} color={C.accent} /><div style={{ flex: 1 }}><h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", margin: 0 }}>Lender Intelligence</h3><div style={{ fontSize: "0.65rem", color: C.muted }}>{CRE_LENDERS.length} active lenders · AI-ranked by deal fit</div></div></div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{lenderTypes.map(t => (<button key={t} onClick={() => setLenderType(t)} style={{ ...btn(lenderType === t, C.accent), fontSize: "0.65rem", padding: "4px 10px" }}>{t}</button>))}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10 }}>{filteredLenders.map(l => (
          <div key={l.id} style={{ ...cb, padding: 16, transition: "all 0.2s" }} onMouseEnter={e => hoverCard(e, true)} onMouseLeave={e => hoverCard(e, false)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: "1.3rem" }}>{l.logo}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff" }}>{l.name}</div><div style={{ fontSize: "0.6rem", color: C.muted }}>{l.flag} {l.country} · {l.type}</div></div>
              <div style={{ display: "flex", gap: 1 }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} fill={i < l.rating ? C.gold : "transparent"} color={i < l.rating ? C.gold : C.dim} />)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.025)" }}><div style={{ fontSize: "0.48rem", color: C.dim }}>Rate</div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: C.accent }}>{l.interestRange}</div></div>
              <div style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.025)" }}><div style={{ fontSize: "0.48rem", color: C.dim }}>LTV</div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>{l.ltv}%</div></div>
              <div style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.025)" }}><div style={{ fontSize: "0.48rem", color: C.dim }}>Speed</div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: l.speed === "Fast" ? C.success : l.speed === "Medium" ? C.warn : C.danger }}>{l.speed}</div></div>
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 8 }}>{l.speciality}</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>{l.products.slice(0, 4).map(p => <Badge key={p} color={C.muted}>{p}</Badge>)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6rem", color: C.dim }}><span>Loan: {l.minLoan} - {l.maxLoan}</span><span>· {l.activeDeals} active deals</span>{l.contactAvailable && <Badge color={C.success}><Phone size={9} /> Contact</Badge>}</div>
          </div>
        ))}</div>
      </div>)}

      {/* QUOTE MATRIX */}
      {sub === "quotes" && (<div>
        <div style={{ ...cb, marginBottom: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><FileText size={18} color={C.gold} /><div style={{ flex: 1 }}><h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", margin: 0 }}>Quote Comparison Matrix</h3><div style={{ fontSize: "0.65rem", color: C.muted }}>AI-extracted terms · Side-by-side comparison</div></div></div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{SAMPLE_DEALS.filter(d => d.quotesReceived > 0).map(d => (<button key={d.id} onClick={() => setSelDealForQuotes(d.id)} style={{ ...btn(selDealForQuotes === d.id, C.accent), fontSize: "0.65rem", padding: "4px 10px" }}>{d.propertyName.split(" ").slice(0, 2).join(" ")}</button>))}</div>
        </div>
        {/* Quote cards */}
        {quotes.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(quotes.length, 3)}, 1fr)`, gap: 10 }}>{quotes.map((q, qi) => (
            <div key={q.id} style={{ ...cb, padding: 16, borderTop: `3px solid ${qi === 0 ? C.success : qi === 1 ? C.accent : C.warn}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff" }}>{q.lenderName}</div><div style={{ fontSize: "0.6rem", color: C.muted }}>{q.lenderType}</div></div>
                <ScoreRing score={q.aiScore} size={42} label="AI" color={q.aiScore > 85 ? C.success : q.aiScore > 70 ? C.accent : C.warn} />
              </div>
              {[{ l: "Loan Amount", v: q.loanAmount }, { l: "Interest Rate", v: `${q.interestRate}% ${q.rateType}` }, { l: "LTV", v: `${q.ltv}%` }, { l: "Tenure", v: q.tenure }, { l: "Amortization", v: q.amortization }, { l: "IO Period", v: q.ioPeriod }, { l: "Prepayment", v: q.prepaymentPenalty }, { l: "Recourse", v: q.recourse }, { l: "Processing Fee", v: q.processingFee }, { l: "Disbursal", v: q.disbursalTime }].map(row => (
                <div key={row.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `0.5px solid ${C.border}` }}>
                  <span style={{ fontSize: "0.65rem", color: C.muted }}>{row.l}</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#fff" }}>{row.v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: `${C.accent}08`, border: `0.5px solid ${C.accent}20` }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: C.accent, marginBottom: 2 }}>AI Analysis</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{q.aiReason}</div>
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
                <Badge color={q.status === "Accepted" ? C.success : q.status === "Under Review" ? C.warn : C.muted}>{q.status}</Badge>
                <Badge color={C.dim}>Exp {q.expiryDate}</Badge>
              </div>
            </div>
          ))}</div>
        ) : <div style={{ ...cb, textAlign: "center", padding: 40, color: C.muted }}>No quotes received for this deal yet.</div>}
        {/* Outreach tracking */}
        {outreach.length > 0 && (<div style={{ ...cb, marginTop: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Send size={15} color={C.accent} /><span style={{ fontWeight: 700, color: "#fff", fontSize: "0.85rem" }}>Lender Outreach Tracker</span><Badge color={C.accent}>{outreach.length} contacted</Badge></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 6 }}>{outreach.map(o => {
            const sc = o.status === "Term Sheet" ? C.success : o.status === "Interested" ? C.accent : o.status === "Replied" ? C.warn : o.status === "Passed" ? C.danger : o.status === "Opened" ? C.purple : o.status === "No Response" ? C.dim : C.muted;
            const icon = o.status === "Term Sheet" ? <CheckSquare size={12} /> : o.status === "Interested" ? <Star size={12} /> : o.status === "Replied" ? <MailOpen size={12} /> : o.status === "Passed" ? <XCircle size={12} /> : o.status === "Opened" ? <Eye size={12} /> : <Mail size={12} />;
            return (<div key={o.lenderId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.02)", borderLeft: `2px solid ${sc}` }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff" }}>{o.lenderName}</div><div style={{ fontSize: "0.58rem", color: C.muted }}>{o.notes}</div></div>
              <Badge color={sc}>{icon} {o.status}</Badge>
            </div>);
          })}</div>
        </div>)}
      </div>)}

      {/* MARKET RATES */}
      {sub === "rates" && (<div>
        <div style={{ ...cb, marginBottom: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={18} color={C.success} /><div><h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", margin: 0 }}>Global Mortgage Rates</h3><div style={{ fontSize: "0.65rem", color: C.muted }}>Indicative country rates · AI buy/wait recommendations</div></div></div>
            {india10Y != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(52,211,153,0.12)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success }} />
                <span style={{ fontSize: "0.66rem", fontWeight: 700, color: C.success }}>LIVE India 10Y G-Sec {india10Y}%</span>
                <span style={{ fontSize: "0.6rem", color: C.muted }}>· home-loan floor ≈ {(india10Y + 2.4).toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>{MORTGAGE_DATA.map(m => (
          <div key={m.country} style={{ ...cb, padding: 16, borderLeft: `3px solid ${m.buyRecommendation === "Buy" ? C.success : m.buyRecommendation === "Wait" ? C.warn : C.danger}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: "1.2rem" }}>{m.flag}</span><div style={{ flex: 1 }}><div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff" }}>{m.country}</div></div><Badge color={m.buyRecommendation === "Buy" ? C.success : m.buyRecommendation === "Wait" ? C.warn : C.danger}>{m.buyRecommendation}</Badge></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div><div style={{ fontSize: "0.48rem", color: C.dim }}>Rate</div><div style={{ fontSize: "0.88rem", fontWeight: 800, color: C.accent }}>{m.rate}%</div></div>
              <div><div style={{ fontSize: "0.48rem", color: C.dim }}>3M Chg</div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: m.change3M < 0 ? C.success : C.danger }}>{m.change3M > 0 ? "+" : ""}{m.change3M}%</div></div>
              <div><div style={{ fontSize: "0.48rem", color: C.dim }}>CB Rate</div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>{m.centralBankRate}%</div></div>
              <div><div style={{ fontSize: "0.48rem", color: C.dim }}>LTV</div><div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>{m.ltvRatio}%</div></div>
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{m.rationale}</div>
          </div>
        ))}</div>
      </div>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB 3: PIPELINE — Kanban Deal Management (LEV Track)
   ══════════════════════════════════════════════════════════════════ */
function PipelineTab() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const dealsByStatus = useMemo(() => {
    const map: Record<DealStatus, CREDeal[]> = {} as Record<DealStatus, CREDeal[]>;
    DEAL_STATUSES.forEach(s => { map[s] = SAMPLE_DEALS.filter(d => d.status === s); });
    return map;
  }, []);
  const totalValue = SAMPLE_DEALS.reduce((a, d) => a + parseFloat(d.dealSize.replace(/[₹Cr,]/g, "")), 0);

  return (
    <div>
      <div style={{ ...cb, marginBottom: 14, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <GitBranch size={18} color={C.accent} />
          <div style={{ flex: 1 }}><h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", margin: 0 }}>Deal Pipeline</h3><div style={{ fontSize: "0.65rem", color: C.muted }}>{SAMPLE_DEALS.length} active deals · ₹{totalValue.toFixed(0)}Cr total value</div></div>
          <div style={{ display: "flex", gap: 4 }}><button onClick={() => setView("kanban")} style={{ ...btn(view === "kanban", C.accent), fontSize: "0.65rem", padding: "4px 10px" }}>Kanban</button><button onClick={() => setView("list")} style={{ ...btn(view === "list", C.accent), fontSize: "0.65rem", padding: "4px 10px" }}>List</button></div>
        </div>
        {/* Pipeline stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 6 }}>
          {DEAL_STATUSES.filter(s => s !== "Dead").map(s => {
            const deals = dealsByStatus[s];
            const val = deals.reduce((a, d) => a + parseFloat(d.dealSize.replace(/[₹Cr,]/g, "")), 0);
            return (<div key={s} style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.025)", borderLeft: `3px solid ${DEAL_STATUS_COLORS[s]}` }}>
              <div style={{ fontSize: "0.52rem", color: C.dim }}>{s}</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>{deals.length} <span style={{ fontSize: "0.6rem", fontWeight: 400, color: C.muted }}>· ₹{val.toFixed(0)}Cr</span></div>
            </div>);
          })}
        </div>
      </div>

      {/* Kanban View */}
      {view === "kanban" && (<div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10 }}>
        {DEAL_STATUSES.filter(s => s !== "Dead").map(status => (
          <div key={status} style={{ minWidth: 260, flex: "0 0 260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "6px 10px", borderRadius: 8, background: `${DEAL_STATUS_COLORS[status]}12` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: DEAL_STATUS_COLORS[status] }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>{status}</span>
              <span style={{ fontSize: "0.6rem", color: C.muted, marginLeft: "auto" }}>{dealsByStatus[status].length}</span>
            </div>
            {dealsByStatus[status].map(deal => (
              <div key={deal.id} style={{ ...cb, padding: 12, marginBottom: 8, borderLeft: `3px solid ${DEAL_STATUS_COLORS[deal.status]}`, cursor: "pointer" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", marginBottom: 3 }}>{deal.propertyName}</div>
                <div style={{ fontSize: "0.6rem", color: C.muted, marginBottom: 6 }}>{deal.city}, {deal.state}</div>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}><Badge color={C.accent}>{deal.assetType}</Badge><Badge color={deal.priority === "High" ? C.danger : deal.priority === "Medium" ? C.warn : C.muted}>{deal.priority}</Badge></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  <div><div style={{ fontSize: "0.48rem", color: C.dim }}>Deal Size</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff" }}>{deal.dealSize}</div></div>
                  <div><div style={{ fontSize: "0.48rem", color: C.dim }}>Cap Rate</div><div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.gold }}>{deal.capRate}%</div></div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: "0.58rem", color: C.dim }}>
                  <span><Send size={9} /> {deal.lendersContacted} contacted</span>
                  <span><FileText size={9} /> {deal.quotesReceived} quotes</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>)}

      {/* List View */}
      {view === "list" && (<div style={{ ...cb, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Property", "City", "Type", "Size", "Cap Rate", "Status", "Lenders", "Quotes"].map(h => (
              <th key={h} style={{ padding: "10px 12px", fontSize: "0.62rem", fontWeight: 700, color: C.muted, textAlign: "left", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{SAMPLE_DEALS.filter(d => d.status !== "Dead").map(d => (
            <tr key={d.id} style={{ borderBottom: `0.5px solid ${C.border}` }}>
              <td style={{ padding: "10px 12px" }}><div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }}>{d.propertyName}</div><div style={{ fontSize: "0.55rem", color: C.muted }}>{d.address}</div></td>
              <td style={{ padding: "10px 12px", fontSize: "0.72rem", color: "#fff" }}>{d.city}</td>
              <td style={{ padding: "10px 12px" }}><Badge color={C.accent}>{d.assetType}</Badge></td>
              <td style={{ padding: "10px 12px", fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>{d.dealSize}</td>
              <td style={{ padding: "10px 12px", fontSize: "0.78rem", fontWeight: 700, color: C.gold }}>{d.capRate}%</td>
              <td style={{ padding: "10px 12px" }}><Badge color={DEAL_STATUS_COLORS[d.status]}>{d.status}</Badge></td>
              <td style={{ padding: "10px 12px", fontSize: "0.72rem", color: "#fff", textAlign: "center" }}>{d.lendersContacted}</td>
              <td style={{ padding: "10px 12px", fontSize: "0.72rem", color: "#fff", textAlign: "center" }}>{d.quotesReceived}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB 4: INTELLIGENCE — AI Insights + Macro + Global
   ══════════════════════════════════════════════════════════════════ */
function IntelligenceTab() {
  const [sub, setSub] = useState<"insights" | "macro" | "global" | "reits">("insights");

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {([{ id: "insights" as const, l: "AI Insights", i: <Zap size={13} /> }, { id: "macro" as const, l: "Macro Engine", i: <Activity size={13} /> }, { id: "global" as const, l: "Global Markets", i: <Globe size={13} /> }, { id: "reits" as const, l: "REITs", i: <Landmark size={13} /> }] as const).map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{ ...btn(sub === t.id, C.accent), display: "flex", alignItems: "center", gap: 5 }}>{t.i} {t.l}</button>
        ))}
        <div style={{ marginLeft: "auto" }}><Src s="Bloomberg · RBI" /></div>
      </div>

      {/* AI INSIGHTS */}
      {sub === "insights" && (<div>
        <div style={{ ...cb, marginBottom: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Zap size={18} color={C.accent} /><div><h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", margin: 0 }}>AI Market Intelligence</h3><div style={{ fontSize: "0.65rem", color: C.muted }}>Real-time AI-generated insights across global RE markets</div></div></div>
        </div>
        {/* Institutional Indicators */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: 14 }}>{INSTITUTIONAL_INDICATORS.map(ind => (
          <div key={ind.name} style={{ ...cb, padding: "10px 12px" }}>
            <div style={{ fontSize: "0.52rem", color: C.dim, marginBottom: 2 }}>{ind.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff" }}>{ind.value}</span><span style={{ fontSize: "0.62rem", fontWeight: 600, color: ind.change > 0 ? C.success : C.danger }}>{ind.change > 0 ? "+" : ""}{ind.change}{ind.unit === "bps" ? "bps" : "%"}</span></div>
            <div style={{ fontSize: "0.52rem", color: C.dim }}>{ind.significance}</div>
          </div>
        ))}</div>
        {/* Insights */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>{AI_INSIGHTS.map((ins, i) => (
          <div key={i} style={{ ...cb, padding: 14, borderLeft: `3px solid ${ins.type === "opportunity" ? C.success : ins.type === "risk" ? C.danger : ins.type === "alert" ? C.orange : C.warn}` }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}><Badge color={ins.type === "opportunity" ? C.success : ins.type === "risk" ? C.danger : ins.type === "alert" ? C.orange : C.warn}>{ins.type}</Badge><span style={{ fontSize: "0.55rem", color: C.dim }}>{ins.region} · {ins.timestamp}</span></div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{ins.title}</div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{ins.body.slice(0, 140)}...</div>
          </div>
        ))}</div>
      </div>)}

      {/* MACRO ENGINE */}
      {sub === "macro" && (<div>
        <div style={{ ...cb, marginBottom: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Activity size={18} color={C.purple} /><div><h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", margin: 0 }}>Macro Intelligence Engine</h3><div style={{ fontSize: "0.65rem", color: C.muted }}>How macroeconomic factors impact real estate markets</div></div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 10 }}>{MACRO_ENGINE.map(m => (
          <div key={m.name} style={{ ...cb, padding: 16, borderLeft: `3px solid ${m.impactOnRE === "Positive" ? C.success : m.impactOnRE === "Negative" ? C.danger : C.warn}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: "1.2rem" }}>{m.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff" }}>{m.name}</div><div style={{ fontSize: "0.72rem", color: C.accent, fontWeight: 700 }}>{m.currentValue} <span style={{ color: m.trend === "Falling" ? C.success : m.trend === "Rising" ? C.danger : C.muted }}>({m.trend})</span></div></div><Badge color={m.impactOnRE === "Positive" ? C.success : m.impactOnRE === "Negative" ? C.danger : C.warn}>{m.impactOnRE} on RE</Badge></div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 6 }}>{m.explanation}</div>
            <div style={{ padding: "8px 10px", borderRadius: 8, background: `${C.accent}06`, border: `0.5px solid ${C.accent}15` }}><div style={{ fontSize: "0.6rem", fontWeight: 700, color: C.accent, marginBottom: 2 }}>For Beginners</div><div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{m.beginnerTip}</div></div>
          </div>
        ))}</div>
      </div>)}

      {/* GLOBAL MARKETS */}
      {sub === "global" && (<div>
        <div style={{ ...cb, marginBottom: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Globe size={18} color={C.accent} /><div><h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", margin: 0 }}>Global Real Estate Markets</h3><div style={{ fontSize: "0.65rem", color: C.muted }}>{COUNTRIES_RE.length} countries · {CITIES_RE.length} cities</div></div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>{WORLD_REGIONS.map(r => {
          const ctrs = COUNTRIES_RE.filter(c => r.countries.includes(c.code));
          return (<div key={r.id} style={{ ...cb, borderLeft: `3px solid ${r.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: "1.1rem" }}>{r.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff" }}>{r.name}</div><div style={{ fontSize: "0.6rem", color: C.muted }}>{ctrs.length} countries</div></div></div>
            <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.4, marginBottom: 6 }}>{r.description}</p>
            <div style={{ fontSize: "0.65rem", color: C.accent, marginBottom: 8 }}>{r.keyInsight}</div>
            {ctrs.sort((a, b) => b.investmentScore - a.investmentScore).map(c => (
              <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `0.5px solid ${C.border}` }}>
                <span style={{ fontSize: "0.9rem" }}>{c.flag}</span><span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fff", flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: c.priceAppreciation > 0 ? C.success : C.danger }}>{c.priceAppreciation > 0 ? "+" : ""}{c.priceAppreciation}%</span>
                <span style={{ fontSize: "0.62rem", color: C.gold }}>{c.rentalYield}%</span>
                <ScoreRing score={c.investmentScore} size={28} />
              </div>
            ))}
          </div>);
        })}</div>
      </div>)}

      {/* REITs */}
      {sub === "reits" && (<div>
        <div style={{ ...cb, marginBottom: 14, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Landmark size={18} color={C.purple} /><div><h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", margin: 0 }}>Global REIT Monitor</h3><div style={{ fontSize: "0.65rem", color: C.muted }}>{REITS.length} REITs · Real-time pricing</div></div></div>
        </div>
        <div style={{ ...cb, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["REIT", "Type", "Price", "Change", "Yield", "Occupancy", "P/NAV", "Debt", "Risk"].map(h => (
                <th key={h} style={{ padding: "10px 12px", fontSize: "0.6rem", fontWeight: 700, color: C.muted, textAlign: "left", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{REITS.map(r => (
              <tr key={r.ticker} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                <td style={{ padding: "8px 12px" }}><div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }}>{r.flag} {r.name}</div><div style={{ fontSize: "0.55rem", color: C.muted }}>{r.ticker}</div></td>
                <td style={{ padding: "8px 12px" }}><Badge color={C.muted}>{r.type}</Badge></td>
                <td style={{ padding: "8px 12px", fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>{r.currency === "INR" ? "₹" : r.currency === "USD" ? "$" : r.currency}{r.price}</td>
                <td style={{ padding: "8px 12px", fontSize: "0.72rem", fontWeight: 700, color: r.change > 0 ? C.success : C.danger }}>{r.change > 0 ? "+" : ""}{r.change}%</td>
                <td style={{ padding: "8px 12px", fontSize: "0.72rem", fontWeight: 700, color: C.gold }}>{r.dividendYield}%</td>
                <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#fff" }}>{r.occupancy}%</td>
                <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: r.pNav < 1 ? C.success : C.warn }}>{r.pNav}x</td>
                <td style={{ padding: "8px 12px", fontSize: "0.72rem", color: "#fff" }}>{r.debtRatio}%</td>
                <td style={{ padding: "8px 12px" }}><Badge color={r.riskLevel === "Low" ? C.success : r.riskLevel === "Medium" ? C.warn : C.danger}>{r.riskLevel}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN ORCHESTRATOR — LEV-Style Module Navigation
   ══════════════════════════════════════════════════════════════════ */
type MainModule = "discover" | "finance" | "pipeline" | "intelligence";

export default function RealEstateExplorer() {
  const [mod, setMod] = useState<MainModule>("discover");

  const MODULES: { id: MainModule; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { id: "discover", label: "Discover", icon: <Map size={15} />, color: "#4A9EFF", desc: "Map + Markets" },
    { id: "finance", label: "Finance", icon: <Building2 size={15} />, color: "#C5A572", desc: "Lenders + Quotes" },
    { id: "pipeline", label: "Pipeline", icon: <GitBranch size={15} />, color: "#34D399", desc: "Deal Tracker" },
    { id: "intelligence", label: "Intelligence", icon: <Zap size={15} />, color: "#a78bfa", desc: "AI + Macro" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Module tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center" }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setMod(m.id)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12,
            background: mod === m.id ? `${m.color}12` : "rgba(255,255,255,0.02)",
            border: `1.5px solid ${mod === m.id ? `${m.color}50` : C.border}`,
            cursor: "pointer", transition: "all 0.2s",
            fontSize: "0.88rem", fontWeight: 700, color: mod === m.id ? "#fff" : C.muted,
          }}>
            <span style={{ color: mod === m.id ? m.color : C.muted }}>{m.icon}</span>
            {m.label}
            <span style={{ fontSize: "0.58rem", fontWeight: 400, color: C.dim }}>{m.desc}</span>
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <Src s="Indicative · RBI-linked" /><Time />
        </div>
      </div>

      {/* Provenance banner — real-estate metrics are indicative model estimates */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", marginBottom: 14,
        borderRadius: 10, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)",
        fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.45,
      }}>
        <Info size={13} color="#FBBF24" style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ color: "#FBBF24" }}>Indicative data.</strong> Property prices, yields and appreciation are model estimates, not a live property-portal feed. <strong style={{ color: "#fff" }}>Mortgage rates and listed real-estate stocks below are linked to live market data.</strong> Verify specifics with RERA/NHB before transacting.
        </span>
      </div>

      {/* Content */}
      {mod === "discover" && <DiscoverTab onCityClick={() => {}} />}
      {mod === "finance" && <FinanceTab />}
      {mod === "pipeline" && <PipelineTab />}
      {mod === "intelligence" && <IntelligenceTab />}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 1fr 310px"], div[style*="gridTemplateColumns: 1fr 300px"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
