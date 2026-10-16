"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Calculator, GitCompare, Layers, AlertTriangle, X } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — MUTUAL FUND EXPLORER
   Browses the full AMFI scheme universe via /api/mf-data and compares
   schemes via /api/mf-scheme. No hand-typed fund lists or generated data.
   ═══════════════════════════════════════════════════════════════ */

type CalcTab = "sip" | "lumpsum" | "swp" | "xirr";

function fINR(n: number) { return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${n.toLocaleString("en-IN")}`; }

// ═══════════════════════════════════════════════════════════════
// CALCULATORS
// ═══════════════════════════════════════════════════════════════
function SIPCalculator() {
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(12);
  const totalInvested = monthly * years * 12;
  const r = rate / 100 / 12;
  const n = years * 12;
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const wealth = Math.round(fv);
  const gains = wealth - totalInvested;
  return (
    <div style={{ padding: "20px 24px" }}>
      <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>SIP Calculator</h4>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Monthly SIP (₹)</label>
          <input type="range" min={500} max={200000} step={500} value={monthly} onChange={e => setMonthly(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(monthly)}/month</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Duration (years)</label>
          <input type="range" min={1} max={40} value={years} onChange={e => setYears(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{years} years</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Expected Return (%)</label>
          <input type="range" min={4} max={25} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{rate}% p.a.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Invested</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--text-primary)" }}>{fINR(totalInvested)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Gains</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--success)" }}>{fINR(gains)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Corpus</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#8b5cf6" }}>{fINR(wealth)}</div>
        </div>
      </div>
    </div>
  );
}

function LumpsumCalculator() {
  const [amount, setAmount] = useState(500000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const fv = Math.round(amount * Math.pow(1 + rate / 100, years));
  const gains = fv - amount;
  return (
    <div style={{ padding: "20px 24px" }}>
      <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>Lumpsum Calculator</h4>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Investment Amount (₹)</label>
          <input type="range" min={10000} max={10000000} step={10000} value={amount} onChange={e => setAmount(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(amount)}</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Duration (years)</label>
          <input type="range" min={1} max={30} value={years} onChange={e => setYears(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{years} years</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Expected Return (%)</label>
          <input type="range" min={4} max={25} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{rate}% p.a.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Invested</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--text-primary)" }}>{fINR(amount)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Gains</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--success)" }}>{fINR(gains)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Final Value</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#8b5cf6" }}>{fINR(fv)}</div>
        </div>
      </div>
    </div>
  );
}

function SWPCalculator() {
  const [corpus, setCorpus] = useState(5000000);
  const [monthly, setMonthly] = useState(25000);
  const [rate, setRate] = useState(8);
  const r = rate / 100 / 12;
  const months = r > 0 ? Math.log(1 / (1 - (corpus * r) / monthly)) / Math.log(1 + r) : corpus / monthly;
  const years = Math.max(0, months / 12);
  const totalWithdrawn = monthly * Math.floor(months);
  return (
    <div style={{ padding: "20px 24px" }}>
      <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>SWP Calculator</h4>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Corpus (₹)</label>
          <input type="range" min={100000} max={50000000} step={100000} value={corpus} onChange={e => setCorpus(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(corpus)}</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Monthly Withdrawal (₹)</label>
          <input type="range" min={5000} max={500000} step={5000} value={monthly} onChange={e => setMonthly(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(monthly)}/month</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Expected Return (%)</label>
          <input type="range" min={4} max={15} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{rate}% p.a.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,158,255,0.06)", border: "1px solid rgba(74,158,255,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Corpus Lasts</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--accent)" }}>{isFinite(years) ? `${years.toFixed(1)} years` : "Forever ∞"}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Total Withdrawn</div>
          <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--success)" }}>{isFinite(totalWithdrawn) ? fINR(totalWithdrawn) : "∞"}</div>
        </div>
      </div>
    </div>
  );
}

function CAGRCalculator() {
  const [invested, setInvested] = useState(1200000);
  const [currentVal, setCurrentVal] = useState(1800000);
  const [years, setYears] = useState(5);
  const xirr = (Math.pow(currentVal / invested, 1 / years) - 1) * 100;
  return (
    <div style={{ padding: "20px 24px" }}>
      <h4 style={{ fontSize: "0.88rem", fontWeight: 800, margin: "0 0 6px", color: "var(--text-primary)" }}>Lump-sum CAGR Calculator</h4>
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 12 }}>Assumes the whole amount was invested at the start. For SIPs or irregular investments, use the XIRR shown on each fund page (it uses actual dates).</div>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Total Invested (₹)</label>
          <input type="range" min={10000} max={10000000} step={10000} value={invested} onChange={e => setInvested(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(invested)}</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Current Value (₹)</label>
          <input type="range" min={10000} max={50000000} step={10000} value={currentVal} onChange={e => setCurrentVal(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{fINR(currentVal)}</div>
        </div>
        <div>
          <label style={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Investment Period (years)</label>
          <input type="range" min={1} max={30} step={0.5} value={years} onChange={e => setYears(+e.target.value)} style={{ width: "100%" }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{years} years</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
        <div style={{ padding: "14px 16px", borderRadius: 10, background: xirr >= 0 ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${xirr >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"}` }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>CAGR</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, color: xirr >= 0 ? "var(--success)" : "var(--danger)" }}>{xirr.toFixed(2)}%</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontSize: "0.54rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Absolute Gain</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#8b5cf6" }}>{((currentVal / invested - 1) * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT — AMFI scheme universe browser + side-by-side compare
// ═══════════════════════════════════════════════════════════════
interface SchemeRow {
  schemeCode: number; schemeName: string; baseName: string | null; amcName: string; assetClass: string; subCategory: string;
  plan: string; option: string; idcwFrequency: string | null; status: string; nav: number | null; navDate: string | null;
}
interface Facet { value: string; count: number; assetClass?: string }
interface Facets { assetClasses: Facet[]; subCategories: (Facet & { assetClass: string })[]; amcs: Facet[]; plans: Facet[]; options: Facet[]; statuses: Facet[]; navDate: string; navSource: string }
interface CompareData {
  scheme: SchemeRow & { schemeCategory: string };
  performance: { asOfNavDate: string; trailing: { label: string; absolutePct: number | null; annualizedPct: number | null; annualized: boolean }[];
    sinceFirstNav: { annualizedPct: number | null; absolutePct: number | null; annualized: boolean; startDate: string | null };
    risk: { volatilityPct?: number; maxDrawdownPct?: number; sharpe?: number | null; reason?: string } } | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d: string | null | undefined) => (d ? `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : "—");
const fmtPct = (v: number | null | undefined) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`);
const STATUS_TEXT: Record<string, string> = { active: "Active", "nav-stale": "NAV not current", "nav-invalid": "Invalid NAV", "awaiting-first-nav": "Awaiting first NAV", "no-nav": "No NAV" };
const PAGE = 50;

function readCompare(): number[] { try { return JSON.parse(localStorage.getItem("wt_mf_compare") || "[]"); } catch { return []; } }
function writeCompare(list: number[]) { try { localStorage.setItem("wt_mf_compare", JSON.stringify(list)); } catch { /* storage unavailable */ } }

const selectStyle: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "0.76rem", minWidth: 0 };

export default function MFExplorer() {
  const router = useRouter();
  const [view, setView] = useState<"browse" | "compare" | "calculators">("browse");
  const [calcTab, setCalcTab] = useState<CalcTab>("sip");
  const [facets, setFacets] = useState<Facets | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [assetClass, setAssetClass] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [amc, setAmc] = useState("");
  const [plan, setPlan] = useState("Direct");
  const [option, setOption] = useState("Growth");
  const [status, setStatus] = useState("active");
  // Result pages are stored with the filter key they belong to; "loading" is derived, never set in an effect.
  const [result, setResult] = useState<{ key: string; rows: SchemeRow[]; total: number; error: string }>({ key: "", rows: [], total: 0, error: "" });
  const [moreLoading, setMoreLoading] = useState(false);
  const [facetError, setFacetError] = useState("");
  // MFExplorer is loaded client-only (ssr: false), so localStorage is safe to read during the first render.
  const [compare, setCompare] = useState<number[]>(readCompare);
  const [compareData, setCompareData] = useState<Record<number, CompareData | "error">>({});

  useEffect(() => {
    fetch("/api/mf-data?mode=facets").then(r => r.json()).then(j => { if (j.success) setFacets(j); }).catch(() => setFacetError("Could not load filters."));
  }, []);
  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const filterKey = useMemo(() => {
    const p = new URLSearchParams({ mode: "schemes", limit: String(PAGE), status });
    if (debouncedQ) p.set("q", debouncedQ);
    if (assetClass) p.set("assetClass", assetClass);
    if (subCategory) p.set("subCategory", subCategory);
    if (amc) p.set("amc", amc);
    if (plan) p.set("plan", plan);
    if (option) p.set("option", option);
    return p.toString();
  }, [debouncedQ, assetClass, subCategory, amc, plan, option, status]);

  const fetchPage = useCallback((key: string, offset: number) =>
    fetch(`/api/mf-data?${key}&offset=${offset}`).then(r => r.json()).then(j => {
      if (!j.success) throw new Error(j.error || "failed");
      return { rows: j.schemes as SchemeRow[], total: j.total as number };
    }), []);

  useEffect(() => {
    let cancel = false;
    fetchPage(filterKey, 0)
      .then(r => { if (!cancel) setResult({ key: filterKey, rows: r.rows, total: r.total, error: "" }); })
      .catch(() => { if (!cancel) setResult({ key: filterKey, rows: [], total: 0, error: "Scheme data is temporarily unavailable." }); });
    return () => { cancel = true; };
  }, [filterKey, fetchPage]);

  const loading = result.key !== filterKey;
  const rows = loading ? [] : result.rows;
  const total = loading ? 0 : result.total;
  const error = facetError || (loading ? "" : result.error);
  const loadMore = () => {
    setMoreLoading(true);
    fetchPage(filterKey, result.rows.length)
      .then(r => setResult(prev => (prev.key === filterKey ? { ...prev, rows: [...prev.rows, ...r.rows], total: r.total } : prev)))
      .catch(() => setResult(prev => ({ ...prev, error: "Could not load more schemes." })))
      .finally(() => setMoreLoading(false));
  };

  const toggleCompare = (code: number) => {
    const next = compare.includes(code) ? compare.filter(c => c !== code) : [...compare, code].slice(-4);
    setCompare(next); writeCompare(next);
  };

  useEffect(() => {
    if (view !== "compare") return;
    for (const code of compare) {
      if (compareData[code]) continue;
      fetch(`/api/mf-scheme?code=${code}`).then(r => r.json())
        .then(j => setCompareData(d => ({ ...d, [code]: j.success ? j : "error" })))
        .catch(() => setCompareData(d => ({ ...d, [code]: "error" })));
    }
  }, [view, compare, compareData]);

  const subOptions = useMemo(() => (facets?.subCategories ?? []).filter(s => !assetClass || s.assetClass === assetClass), [facets, assetClass]);
  const loaded = compare.map(c => compareData[c]).filter((d): d is CompareData => !!d && d !== "error");
  const mixedOptions = new Set(loaded.map(d => d.scheme.option)).size > 1;
  const mixedPlans = new Set(loaded.map(d => d.scheme.plan)).size > 1;
  const mixedDates = new Set(loaded.map(d => d.performance?.asOfNavDate).filter(Boolean)).size > 1;

  const tabBtn = (id: typeof view, label: string, icon: React.ReactNode) => (
    <button key={id} onClick={() => setView(id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: view === id ? "var(--accent)" : "var(--bg-card)", color: view === id ? "#fff" : "var(--text-primary)", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}>
      {icon} {label}
    </button>
  );

  return (
    <div>
      {/* Universe summary */}
      <div className="card" style={{ padding: "14px 18px", marginBottom: 14, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <Layers size={16} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
          {facets ? `${facets.statuses.find(s => s.value === "active")?.count.toLocaleString("en-IN") ?? "—"} active scheme codes from ${facets.amcs.length} AMCs` : "Loading AMFI universe…"}
        </span>
        {facets && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>NAVs as of {fmtDate(facets.navDate)} · source AMFI{facets.navSource === "snapshot" ? " (offline snapshot)" : ""}</span>}
        <span style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tabBtn("browse", "Browse", <Search size={13} />)}
          {tabBtn("compare", `Compare (${compare.length})`, <GitCompare size={13} />)}
          {tabBtn("calculators", "Calculators", <Calculator size={13} />)}
        </span>
      </div>

      {view === "browse" && (
        <>
          <div className="card" style={{ padding: "14px 18px", marginBottom: 14 }}>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="input-field" style={{ paddingLeft: 36 }} placeholder="Search by scheme name, AMC or AMFI code" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              <select style={selectStyle} value={assetClass} onChange={e => { setAssetClass(e.target.value); setSubCategory(""); }} aria-label="Asset class">
                <option value="">All asset classes</option>
                {facets?.assetClasses.map(f => <option key={f.value} value={f.value}>{f.value} ({f.count})</option>)}
              </select>
              <select style={selectStyle} value={subCategory} onChange={e => setSubCategory(e.target.value)} aria-label="Category">
                <option value="">All categories</option>
                {subOptions.map(f => <option key={`${f.assetClass}-${f.value}`} value={f.value}>{f.value} ({f.count})</option>)}
              </select>
              <select style={selectStyle} value={amc} onChange={e => setAmc(e.target.value)} aria-label="AMC">
                <option value="">All AMCs</option>
                {facets?.amcs.map(f => <option key={f.value} value={f.value}>{f.value} ({f.count})</option>)}
              </select>
              <select style={selectStyle} value={plan} onChange={e => setPlan(e.target.value)} aria-label="Plan">
                <option value="">All plans</option><option value="Direct">Direct</option><option value="Regular">Regular</option><option value="Unspecified">Not stated (e.g. ETFs)</option>
              </select>
              <select style={selectStyle} value={option} onChange={e => setOption(e.target.value)} aria-label="Option">
                <option value="">All options</option><option value="Growth">Growth</option><option value="IDCW">IDCW</option><option value="Bonus">Bonus</option><option value="Unspecified">Not stated</option>
              </select>
              <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value)} aria-label="Status">
                <option value="active">Active</option><option value="nav-stale">NAV not current</option><option value="awaiting-first-nav">Awaiting first NAV (NFO)</option><option value="no-nav">No NAV (wound up / merged)</option><option value="all">All statuses</option>
              </select>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 8 }}>
              Each row is one AMFI scheme code — a single plan and option with its own NAV. Results are listed alphabetically by AMC; ranking by returns isn&apos;t offered until returns are precomputed for every scheme.
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", fontSize: "0.72rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
              {loading && !rows.length ? "Loading…" : error || `${total.toLocaleString("en-IN")} matching scheme codes`}
            </div>
            {rows.map(s => (
              <div key={s.schemeCode} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                <button onClick={() => router.push(`/mf-intelligence/${s.schemeCode}`)} style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: 0, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>{s.schemeName}</div>
                  <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {s.amcName} · {s.subCategory} · {s.plan} · {s.option}{s.idcwFrequency ? ` (${s.idcwFrequency})` : ""} · AMFI {s.schemeCode}{s.status !== "active" ? ` · ${STATUS_TEXT[s.status]}` : ""}
                  </div>
                </button>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--text-primary)" }}>{s.nav !== null ? `₹${s.nav.toLocaleString("en-IN", { maximumFractionDigits: 4 })}` : "—"}</div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{s.navDate ? `NAV ${fmtDate(s.navDate)}` : ""}</div>
                </div>
                <button onClick={() => toggleCompare(s.schemeCode)} title={compare.includes(s.schemeCode) ? "Remove from compare" : "Add to compare (max 4)"} style={{ background: compare.includes(s.schemeCode) ? "var(--accent)" : "none", color: compare.includes(s.schemeCode) ? "#fff" : "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                  <GitCompare size={12} />
                </button>
              </div>
            ))}
            {rows.length < total && (
              <button onClick={loadMore} disabled={moreLoading} style={{ width: "100%", padding: 12, background: "none", border: "none", color: "var(--accent)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
                {moreLoading ? "Loading…" : `Show more (${(total - rows.length).toLocaleString("en-IN")} remaining)`}
              </button>
            )}
          </div>
        </>
      )}

      {view === "compare" && (
        <div className="card" style={{ padding: "16px 18px" }}>
          {compare.length < 2 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Add at least two schemes with the <GitCompare size={12} /> button (up to four).</div>
          ) : (
            <>
              {(mixedOptions || mixedPlans || mixedDates) && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", borderRadius: 8, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", fontSize: "0.74rem", color: "var(--text-primary)", marginBottom: 12 }}>
                  <AlertTriangle size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    {mixedOptions && <div>These schemes mix Growth and IDCW options. IDCW NAVs exclude payouts, so returns are not comparable — returns are hidden for the IDCW columns.</div>}
                    {mixedPlans && <div>These schemes mix Direct and Regular plans. Regular plans carry distributor commission, so their returns are lower for the same portfolio.</div>}
                    {mixedDates && <div>Latest NAV dates differ, so periods end on different days.</div>}
                  </div>
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8, color: "var(--text-muted)" }}></th>
                      {compare.map(c => {
                        const d = compareData[c];
                        return (
                          <th key={c} style={{ textAlign: "left", padding: 8, verticalAlign: "top", minWidth: 170 }}>
                            {d && d !== "error" ? <a href={`/mf-intelligence/${c}`} style={{ color: "var(--text-primary)" }}>{d.scheme.schemeName}</a> : d === "error" ? `AMFI ${c} (unavailable)` : `Loading ${c}…`}
                            <button onClick={() => toggleCompare(c)} style={{ marginLeft: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} aria-label="Remove"><X size={11} /></button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ["AMC", d => d.scheme.amcName], ["Category", d => d.scheme.subCategory], ["Plan / option", d => `${d.scheme.plan} · ${d.scheme.option}`],
                      ["NAV (date)", d => (d.scheme.nav !== null ? `₹${d.scheme.nav.toFixed(4)} (${fmtDate(d.scheme.navDate)})` : "—")],
                      ...["1Y", "3Y", "5Y", "10Y"].map(l => [`${l} return`, (d: CompareData) => {
                        if (d.scheme.option !== "Growth" && mixedOptions) return "Not comparable";
                        const r = d.performance?.trailing.find(t => t.label === l);
                        return r ? fmtPct(r.annualized ? r.annualizedPct : r.absolutePct) : "—";
                      }] as [string, (d: CompareData) => string]),
                      ["3Y volatility", d => (d.performance?.risk?.volatilityPct !== undefined ? `${d.performance.risk.volatilityPct.toFixed(2)}%` : "—")],
                      ["3Y max drawdown", d => (d.performance?.risk?.maxDrawdownPct !== undefined ? `${d.performance.risk.maxDrawdownPct.toFixed(2)}%` : "—")],
                      ["3Y Sharpe", d => (d.performance?.risk?.sharpe != null ? d.performance.risk.sharpe.toFixed(2) : "—")],
                      ["Returns to NAV of", d => fmtDate(d.performance?.asOfNavDate)],
                    ] as [string, (d: CompareData) => string][]).map(([label, f]) => (
                      <tr key={label} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: 8, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</td>
                        {compare.map(c => { const d = compareData[c]; return <td key={c} style={{ padding: 8, color: "var(--text-primary)" }}>{d && d !== "error" ? f(d) : "—"}</td>; })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 10 }}>
                Returns: absolute under 1 year, CAGR for 1 year and longer, ending at each scheme&apos;s latest AMFI NAV. Risk over the trailing 3 years; Sharpe uses SBI Overnight Fund&apos;s realised return as the risk-free proxy. Benchmark comparisons are not available yet.
              </div>
            </>
          )}
        </div>
      )}

      {view === "calculators" && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: "flex", gap: 6, padding: "12px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
            {([["sip", "SIP projection"], ["lumpsum", "Lump-sum projection"], ["swp", "SWP"], ["xirr", "Lump-sum CAGR"]] as [CalcTab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setCalcTab(id)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: calcTab === id ? "var(--accent)" : "transparent", color: calcTab === id ? "#fff" : "var(--text-primary)", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
          <div style={{ padding: "8px 24px 0", fontSize: "0.68rem", color: "var(--text-muted)" }}>
            Projections use the return rate you enter — they are not a fund&apos;s actual or expected return. For historical results on real NAVs, open any fund page.
          </div>
          {calcTab === "sip" && <SIPCalculator />}
          {calcTab === "lumpsum" && <LumpsumCalculator />}
          {calcTab === "swp" && <SWPCalculator />}
          {calcTab === "xirr" && <CAGRCalculator />}
        </div>
      )}
    </div>
  );
}
