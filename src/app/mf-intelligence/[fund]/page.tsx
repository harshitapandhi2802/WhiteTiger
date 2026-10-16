"use client";
/* ═══════════════════════════════════════════════════════════════
   /mf-intelligence/[fund] — one AMFI scheme code (one plan + option).
   Every number comes from /api/mf-scheme (AMFI NAVs + src/lib/mf-returns.ts).
   Nothing is estimated: unavailable data is labelled as such.
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { sip, lumpSum, shiftDate, type NavPoint, type PeriodReturn, type RollingStats } from "@/lib/mf-returns";

interface Scheme {
  schemeCode: number; schemeName: string; baseName: string | null; nav: number | null; navDate: string | null; amcName: string;
  schemeType: string; schemeCategory: string; assetClass: string; subCategory: string; plan: string; option: string;
  idcwType: string | null; idcwFrequency: string | null; optionDiscontinued: boolean; status: string;
  launchDate: string | null; closureDate: string | null; minInvestment: number | null; isins: string[];
}
interface Sibling { schemeCode: number; schemeName: string; plan: string; option: string; idcwFrequency: string | null; status: string; nav: number | null; navDate: string | null }
interface Risk {
  windowStart: string; windowEnd: string; observations: number; annualizedReturnPct: number; volatilityPct: number; downsideDeviationPct: number;
  maxDrawdownPct: number; drawdownPeak: string; drawdownTrough: string; drawdownRecovered: string | null;
  riskFreePct: number | null; sharpe: number | null; sortino: number | null; beta: number | null; alphaPct: number | null; benchmarkNote: string; riskFreeNote?: string;
}
interface Performance {
  asOfNavDate: string; firstNavDate: string; observations: number; trailing: PeriodReturn[];
  sinceFirstNav: PeriodReturn & { isSinceInception: boolean }; rolling: Record<string, RollingStats | null> | null;
  risk: Risk | { reason: string }; navOnlyCaveat: string | null; methodology: string;
  dataQuality: { reconciliation: { status: string; detail?: string }; droppedPoints: number; gapsOver10Days: number; largestGap: { from: string; to: string; days: number } | null; movesOver20Pct: { date: string; changePct: number }[]; latestNavAgeDays: number };
  sources: { navHistory: string; latestNav: string; retrievedAt: string };
}
interface SchemeResponse {
  success: boolean; error?: string; scheme: Scheme; siblings: Sibling[]; history?: [string, number][];
  amfi: { nav: number | null; navDate: string | null; fileLatestNavDate: string; source: string; snapshotDate: string };
  performance: Performance | null; performanceNote?: string; unavailable: Record<string, string>; documents: { label: string; url: string }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d: string | null | undefined) => (d ? `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : "—");
const fmtPct = (v: number | null | undefined, dp = 2) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(dp)}%`);
const fmtINR = (v: number, dp = 0) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: dp, minimumFractionDigits: dp })}`;
const pctColor = (v: number | null | undefined) => (v === null || v === undefined ? "#6b7280" : v >= 0 ? "#059669" : "#dc2626");

const STATUS_LABEL: Record<string, { text: string; bg: string; color: string }> = {
  active: { text: "Active", bg: "#ecfdf5", color: "#047857" },
  "nav-stale": { text: "NAV not current", bg: "#fffbeb", color: "#b45309" },
  "nav-invalid": { text: "Invalid NAV", bg: "#fef2f2", color: "#b91c1c" },
  "awaiting-first-nav": { text: "Awaiting first NAV", bg: "#eff6ff", color: "#1d4ed8" },
  "no-nav": { text: "No NAV published", bg: "#f3f4f6", color: "#4b5563" },
};
const UNAVAILABLE_LABELS: Record<string, string> = {
  expenseRatio: "Expense ratio (TER)", aum: "AUM", fundManager: "Fund manager", benchmark: "Benchmark", exitLoad: "Exit load",
  portfolioHoldings: "Top holdings", sectorAllocation: "Sector allocation", creditQuality: "Credit quality", duration: "Duration / YTM", riskometer: "Riskometer",
};

const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 20px", marginBottom: 16 };
const h2: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 800, color: "#111827", margin: "0 0 12px" };
const th: React.CSSProperties = { textAlign: "left", fontSize: "0.68rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", padding: "8px 10px", borderBottom: "1px solid #e5e7eb" };
const td: React.CSSProperties = { fontSize: "0.82rem", color: "#111827", padding: "9px 10px", borderBottom: "1px solid #f3f4f6" };
const note: React.CSSProperties = { fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.5, marginTop: 8 };

function Badge({ children, bg = "#f3f4f6", color = "#374151" }: { children: React.ReactNode; bg?: string; color?: string }) {
  return <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: bg, color, whiteSpace: "nowrap" }}>{children}</span>;
}

function NavChart({ points }: { points: NavPoint[] }) {
  if (points.length < 2) return <div style={note}>Not enough NAV history to chart.</div>;
  const W = 760, H = 220, P = 8;
  const min = Math.min(...points.map(p => p.nav)), max = Math.max(...points.map(p => p.nav));
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - min) / (max - min || 1)) * (H - 2 * P);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.nav).toFixed(1)}`).join(" ");
  const up = points.at(-1)!.nav >= points[0].nav;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label="NAV history chart">
        <path d={d} fill="none" stroke={up ? "#059669" : "#dc2626"} strokeWidth={1.6} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#6b7280" }}>
        <span>{fmtDate(points[0].date)} · ₹{points[0].nav.toFixed(2)}</span>
        <span>Low ₹{min.toFixed(2)} · High ₹{max.toFixed(2)}</span>
        <span>{fmtDate(points.at(-1)!.date)} · ₹{points.at(-1)!.nav.toFixed(2)}</span>
      </div>
    </div>
  );
}

function SearchFallback({ query }: { query: string }) {
  const [results, setResults] = useState<Scheme[] | null>(null);
  useEffect(() => {
    fetch(`/api/mf-data?mode=search&inactive=1&limit=15&q=${encodeURIComponent(query)}`)
      .then(r => r.json()).then(j => setResults(j.results ?? [])).catch(() => setResults([]));
  }, [query]);
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", padding: "40px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={card}>
          <h1 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 6px" }}>Which scheme did you mean?</h1>
          <div style={{ ...note, marginTop: 0 }}>Funds are identified by their AMFI scheme code, because each plan (Direct/Regular) and option (Growth/IDCW) has its own NAV. Pick the exact variant below.</div>
          {results === null && <div style={note}>Searching AMFI schemes for &ldquo;{query}&rdquo;…</div>}
          {results?.length === 0 && <div style={note}>No AMFI scheme matches &ldquo;{query}&rdquo;. <Link href="/analyze">Search mutual funds</Link></div>}
          {results?.map(s => (
            <Link key={s.schemeCode} href={`/mf-intelligence/${s.schemeCode}`} style={{ display: "block", padding: "10px 0", borderBottom: "1px solid #f3f4f6", textDecoration: "none", color: "#111827" }}>
              <div style={{ fontSize: "0.84rem", fontWeight: 700 }}>{s.schemeName}</div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: 2 }}>{s.amcName} · {s.plan} · {s.option}{s.idcwFrequency ? ` (${s.idcwFrequency})` : ""} · AMFI {s.schemeCode} · {STATUS_LABEL[s.status]?.text}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FundPage() {
  const { fund } = useParams<{ fund: string }>();
  const slug = decodeURIComponent(fund ?? "");
  const code = /^\d+$/.test(slug) ? slug : null;
  const [resp, setResp] = useState<SchemeResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [range, setRange] = useState<"1Y" | "3Y" | "5Y" | "ALL">("3Y");
  const [sipAmt, setSipAmt] = useState(5000);
  const [sipStart, setSipStart] = useState("");
  const [lumpAmt, setLumpAmt] = useState(100000);
  const [lumpStart, setLumpStart] = useState("");
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancel = false;
    fetch(`/api/mf-scheme?code=${code}&history=1`).then(r => r.json())
      .then(j => {
        if (cancel) return;
        if (j.success) setResp(j); else setFailed(true);
        try { setInCompare((JSON.parse(localStorage.getItem("wt_mf_compare") || "[]") as number[]).includes(+code)); } catch { /* storage unavailable */ }
      })
      .catch(() => { if (!cancel) setFailed(true); });
    return () => { cancel = true; };
  }, [code]);

  const series: NavPoint[] = useMemo(() => (resp?.history ?? []).map(([date, nav]) => ({ date, nav })), [resp]);
  const lastDate = series.at(-1)?.date;
  // Calculators default to 5 years before the latest NAV (or the first NAV, if history is shorter).
  const defaultStart = useMemo(() => {
    if (!lastDate || !series.length) return "";
    const fiveY = shiftDate(lastDate, { years: -5 });
    return fiveY > series[0].date ? fiveY : series[0].date;
  }, [lastDate, series]);
  const sipFrom = sipStart || defaultStart, lumpFrom = lumpStart || defaultStart;

  const chartPoints = useMemo(() => {
    if (!lastDate || range === "ALL") return series;
    const from = shiftDate(lastDate, { years: -({ "1Y": 1, "3Y": 3, "5Y": 5 }[range]) });
    return series.filter(p => p.date >= from);
  }, [series, range, lastDate]);
  const sipResult = useMemo(() => (sipFrom && series.length ? sip(series, sipAmt, sipFrom) : null), [series, sipAmt, sipFrom]);
  const lumpResult = useMemo(() => (lumpFrom && series.length ? lumpSum(series, lumpAmt, lumpFrom) : null), [series, lumpAmt, lumpFrom]);

  if (!code) return <SearchFallback query={slug.replace(/-/g, " ")} />;
  if (failed) return <SearchFallback query={slug} />;
  if (!resp) return <div style={{ minHeight: "100vh", background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: "0.9rem" }}>Loading AMFI data for scheme {code}…</div>;

  const { scheme: s, performance: perf, amfi } = resp;
  const st = STATUS_LABEL[s.status] ?? STATUS_LABEL["no-nav"];
  const isGrowth = s.option === "Growth";
  const toggleCompare = () => {
    try {
      const list = JSON.parse(localStorage.getItem("wt_mf_compare") || "[]") as number[];
      const next = list.includes(s.schemeCode) ? list.filter(c => c !== s.schemeCode) : [...list, s.schemeCode].slice(-4);
      localStorage.setItem("wt_mf_compare", JSON.stringify(next));
      setInCompare(next.includes(s.schemeCode));
    } catch { /* storage unavailable */ }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4a148c, #6a1b9a, #7c3aed)", color: "#fff", padding: "22px 16px 26px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Link href="/analyze" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.74rem", textDecoration: "none" }}>← Mutual funds</Link>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "8px 0 6px", lineHeight: 1.3 }}>{s.schemeName}</h1>
          <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>{s.amcName} · {s.assetClass} · {s.subCategory} · {s.schemeType}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <Badge bg="rgba(255,255,255,0.15)" color="#fff">{s.plan} plan</Badge>
            <Badge bg="rgba(255,255,255,0.15)" color="#fff">{s.option}{s.idcwFrequency ? ` · ${s.idcwFrequency}` : ""}{s.idcwType ? ` · ${s.idcwType}` : ""}</Badge>
            <Badge bg={st.bg} color={st.color}>{st.text}</Badge>
            {s.optionDiscontinued && <Badge bg="#fef2f2" color="#b91c1c">Option discontinued by AMC</Badge>}
            <Badge bg="rgba(255,255,255,0.15)" color="#fff">AMFI {s.schemeCode}</Badge>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.66rem", opacity: 0.7, textTransform: "uppercase", fontWeight: 700 }}>NAV</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 900 }}>{s.nav !== null ? `₹${s.nav.toLocaleString("en-IN", { maximumFractionDigits: 4 })}` : "—"}</div>
            </div>
            <div style={{ fontSize: "0.76rem", opacity: 0.85, paddingBottom: 6 }}>
              as of <strong>{fmtDate(s.navDate)}</strong> (AMFI{amfi.source === "snapshot" ? `, offline snapshot of ${fmtDate(amfi.snapshotDate)}` : ""})
              <div style={{ opacity: 0.75, fontSize: "0.68rem" }}>NAVs are published once per business day — this is not a live price.</div>
            </div>
            <button onClick={toggleCompare} style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.4)", background: inCompare ? "#fff" : "transparent", color: inCompare ? "#6a1b9a" : "#fff", fontWeight: 700, fontSize: "0.74rem", cursor: "pointer" }}>
              {inCompare ? "✓ In compare list" : "+ Add to compare"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "18px 16px 40px" }}>
        {s.status !== "active" && (
          <div style={{ ...card, background: "#fffbeb", borderColor: "#fde68a", fontSize: "0.8rem", color: "#92400e" }}>
            {s.status === "nav-stale" && <>The latest NAV for this code is dated {fmtDate(s.navDate)}, older than AMFI&apos;s current NAV date ({fmtDate(amfi.fileLatestNavDate)}). The scheme may have matured, been wound up or suspended.</>}
            {s.status === "nav-invalid" && <>AMFI lists a zero or invalid NAV for this code. Returns are not calculated.</>}
            {s.status === "no-nav" && <>AMFI publishes no NAV for this code (wound up, merged or matured).</>}
            {s.status === "awaiting-first-nav" && <>Recently launched (NFO); AMFI has not published a NAV yet.</>}
          </div>
        )}

        {/* Facts */}
        <div style={card}>
          <h2 style={h2}>Scheme facts (AMFI scheme master)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, fontSize: "0.8rem" }}>
            {[
              ["AMFI category", s.schemeCategory], ["Launch date", fmtDate(s.launchDate)],
              ["Minimum investment", s.minInvestment !== null ? fmtINR(s.minInvestment) : "—"],
              ...(s.closureDate ? [["Closure / maturity", fmtDate(s.closureDate)]] : []),
              ["ISIN(s)", s.isins.join(", ") || "—"], ["Scheme type", s.schemeType],
            ].map(([k, v]) => (
              <div key={k as string}><div style={{ fontSize: "0.66rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{k}</div><div style={{ color: "#111827", fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>{v}</div></div>
            ))}
          </div>
        </div>

        {!perf ? (
          <div style={card}><h2 style={h2}>Performance</h2><div style={note}>{resp.performanceNote}</div></div>
        ) : (
          <>
            {perf.navOnlyCaveat && <div style={{ ...card, background: "#fff7ed", borderColor: "#fed7aa", fontSize: "0.78rem", color: "#9a3412" }}>{perf.navOnlyCaveat}</div>}

            {/* Chart */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h2 style={{ ...h2, margin: 0 }}>NAV history</h2>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["1Y", "3Y", "5Y", "ALL"] as const).map(r => (
                    <button key={r} onClick={() => setRange(r)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: range === r ? "#6a1b9a" : "#fff", color: range === r ? "#fff" : "#374151", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>{r}</button>
                  ))}
                </div>
              </div>
              <NavChart points={chartPoints} />
            </div>

            {/* Returns */}
            <div style={card}>
              <h2 style={h2}>Returns (to NAV of {fmtDate(perf.asOfNavDate)})</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>Period</th><th style={th}>From NAV date</th><th style={th}>Return</th><th style={th}>Type</th></tr></thead>
                  <tbody>
                    {perf.trailing.map(r => (
                      <tr key={r.label}>
                        <td style={td}>{r.label}</td>
                        <td style={td}>{r.startDate ? `${fmtDate(r.startDate)} · ₹${r.startNav!.toFixed(4)}` : <span style={{ color: "#9ca3af" }}>{r.reason}</span>}</td>
                        <td style={{ ...td, fontWeight: 800, color: pctColor(r.annualized ? r.annualizedPct : r.absolutePct) }}>{fmtPct(r.annualized ? r.annualizedPct : r.absolutePct)}</td>
                        <td style={{ ...td, color: "#6b7280" }}>{r.startDate ? (r.annualized ? "CAGR" : "Absolute") : ""}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={td}>{perf.sinceFirstNav.isSinceInception ? "Since inception" : "Since first NAV in history"}</td>
                      <td style={td}>{fmtDate(perf.sinceFirstNav.startDate)}{perf.sinceFirstNav.startNav ? ` · ₹${perf.sinceFirstNav.startNav.toFixed(4)}` : ""}</td>
                      <td style={{ ...td, fontWeight: 800, color: pctColor(perf.sinceFirstNav.annualized ? perf.sinceFirstNav.annualizedPct : perf.sinceFirstNav.absolutePct) }}>{fmtPct(perf.sinceFirstNav.annualized ? perf.sinceFirstNav.annualizedPct : perf.sinceFirstNav.absolutePct)}</td>
                      <td style={{ ...td, color: "#6b7280" }}>{perf.sinceFirstNav.annualized ? "CAGR" : "Absolute"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={note}>{perf.methodology} Benchmark and category-average comparisons are not shown: no verified benchmark (TRI) series is connected yet.</div>
            </div>

            {/* Rolling */}
            {perf.rolling && (
              <div style={card}>
                <h2 style={h2}>Rolling returns (CAGR)</h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Window", "Observations", "Worst", "Median", "Best", "% positive", "Latest"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {Object.entries(perf.rolling).map(([w, r]) => (
                      <tr key={w}>
                        <td style={td}>{w}</td>
                        {r ? <>
                          <td style={td}>{r.count}</td><td style={{ ...td, color: pctColor(r.min) }}>{fmtPct(r.min)}</td><td style={td}>{fmtPct(r.median)}</td>
                          <td style={{ ...td, color: pctColor(r.max) }}>{fmtPct(r.max)}</td><td style={td}>{r.pctPositive.toFixed(1)}%</td><td style={td}>{fmtPct(r.latest)}</td>
                        </> : <td style={{ ...td, color: "#9ca3af" }} colSpan={6}>Not enough history</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={note}>Each observation is the CAGR over the window ending on that NAV date, sampled weekly.</div>
              </div>
            )}

            {/* Risk */}
            <div style={card}>
              <h2 style={h2}>Risk (trailing 3 years)</h2>
              {"reason" in perf.risk ? <div style={note}>{perf.risk.reason}</div> : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                    {[
                      ["Annualised volatility", `${perf.risk.volatilityPct.toFixed(2)}%`],
                      ["Downside deviation", `${perf.risk.downsideDeviationPct.toFixed(2)}%`],
                      ["Max drawdown", `${perf.risk.maxDrawdownPct.toFixed(2)}%`],
                      ["Sharpe ratio", perf.risk.sharpe?.toFixed(2) ?? "—"],
                      ["Sortino ratio", perf.risk.sortino?.toFixed(2) ?? "—"],
                      ["Beta / Alpha", "Unavailable"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: "0.64rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{k}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={note}>
                    Window {fmtDate(perf.risk.windowStart)} – {fmtDate(perf.risk.windowEnd)}, {perf.risk.observations} NAV-to-NAV returns.
                    Max drawdown from {fmtDate(perf.risk.drawdownPeak)} to {fmtDate(perf.risk.drawdownTrough)}{perf.risk.drawdownRecovered ? `, recovered ${fmtDate(perf.risk.drawdownRecovered)}` : ", not yet recovered"}.
                    {" "}{perf.risk.riskFreeNote} {perf.risk.benchmarkNote}.
                  </div>
                </>
              )}
            </div>

            {/* Calculators */}
            <div style={card}>
              <h2 style={h2}>What would an investment have returned?</h2>
              {!isGrowth && <div style={{ ...note, marginTop: 0, color: "#9a3412" }}>Calculated on IDCW NAV, which excludes payouts — results understate the actual return.</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                {[{ title: "Monthly SIP", amt: sipAmt, setAmt: setSipAmt, start: sipFrom, setStart: setSipStart, res: sipResult, rate: sipResult?.xirrPct, rateLabel: "XIRR" },
                  { title: "Lump sum", amt: lumpAmt, setAmt: setLumpAmt, start: lumpFrom, setStart: setLumpStart, res: lumpResult, rate: lumpResult?.cagrPct ?? lumpResult?.absolutePct, rateLabel: lumpResult?.cagrPct != null ? "CAGR" : "Absolute" }].map(c => (
                  <div key={c.title} style={{ background: "#faf5ff", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.84rem", marginBottom: 8 }}>{c.title}</div>
                    <label style={{ fontSize: "0.7rem", color: "#6b7280", display: "block" }}>Amount (₹)
                      <input type="number" min={100} step={100} value={c.amt} onChange={e => c.setAmt(Math.max(0, +e.target.value))} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", marginTop: 2 }} />
                    </label>
                    <label style={{ fontSize: "0.7rem", color: "#6b7280", display: "block", marginTop: 8 }}>Start date
                      <input type="date" min={series[0]?.date} max={lastDate} value={c.start} onChange={e => c.setStart(e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb", marginTop: 2 }} />
                    </label>
                    {c.res ? (
                      <div style={{ marginTop: 10, fontSize: "0.8rem", lineHeight: 1.7 }}>
                        <div>Invested <strong>{fmtINR(c.res.invested)}</strong>{c.title === "Monthly SIP" ? ` in ${c.res.installments.length} instalments` : ` on ${fmtDate(c.res.installments[0].date)}`}</div>
                        <div>Value on {fmtDate(c.res.valueDate)}: <strong>{fmtINR(c.res.value)}</strong></div>
                        <div>{c.rateLabel}: <strong style={{ color: pctColor(c.rate) }}>{fmtPct(c.rate ?? null)}</strong></div>
                      </div>
                    ) : <div style={note}>Choose a start date inside the NAV history.</div>}
                  </div>
                ))}
              </div>
              <div style={note}>Purchases use the NAV on or after each date; 0.005% stamp duty applied from July 2020. Exit loads and taxes are not included. Past performance does not indicate future returns.</div>
            </div>
          </>
        )}

        {/* Other variants */}
        {resp.siblings.length > 0 && (
          <div style={card}>
            <h2 style={h2}>Other plans and options of this scheme</h2>
            <div style={note}>Each has its own NAV and returns. Direct plans have lower expenses than Regular; IDCW NAVs fall when income is paid out.</div>
            {resp.siblings.map(v => (
              <Link key={v.schemeCode} href={`/mf-intelligence/${v.schemeCode}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid #f3f4f6", textDecoration: "none", color: "#111827", fontSize: "0.8rem" }}>
                <span>{v.plan} · {v.option}{v.idcwFrequency ? ` (${v.idcwFrequency})` : ""} <span style={{ color: "#9ca3af" }}>· AMFI {v.schemeCode}</span></span>
                <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>{v.nav !== null ? `₹${v.nav.toFixed(4)} · ${fmtDate(v.navDate)}` : STATUS_LABEL[v.status]?.text}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Not available */}
        <div style={card}>
          <h2 style={h2}>Not yet available from a verified source</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.keys(resp.unavailable).map(k => <Badge key={k}>{UNAVAILABLE_LABELS[k] ?? k}</Badge>)}
          </div>
          <div style={note}>These are not published in AMFI&apos;s NAV or scheme-master files, so we don&apos;t show them rather than estimate them. Official documents:</div>
          {resp.documents.map(d => <div key={d.url} style={{ fontSize: "0.78rem", marginTop: 4 }}><a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: "#6a1b9a" }}>{d.label} ↗</a></div>)}
        </div>

        {/* Data quality & sources */}
        {perf && (
          <div style={{ ...card, background: "#f9fafb" }}>
            <h2 style={h2}>Data quality and sources</h2>
            <div style={{ fontSize: "0.74rem", color: "#4b5563", lineHeight: 1.7 }}>
              <div>Latest NAV: {perf.sources.latestNav} · History: {perf.sources.navHistory} · {perf.observations.toLocaleString("en-IN")} NAVs from {fmtDate(perf.firstNavDate)}</div>
              <div>Reconciliation with AMFI: {perf.dataQuality.reconciliation.status}{perf.dataQuality.reconciliation.detail ? ` — ${perf.dataQuality.reconciliation.detail}` : ""}</div>
              <div>Gaps over 10 days: {perf.dataQuality.gapsOver10Days}{perf.dataQuality.largestGap ? ` (largest ${perf.dataQuality.largestGap.days} days, ${fmtDate(perf.dataQuality.largestGap.from)} – ${fmtDate(perf.dataQuality.largestGap.to)})` : ""} · Invalid points dropped: {perf.dataQuality.droppedPoints}</div>
              {perf.dataQuality.movesOver20Pct.length > 0 && <div style={{ color: "#b45309" }}>Single-day NAV moves over 20% (possible corporate action — check before comparing): {perf.dataQuality.movesOver20Pct.slice(0, 5).map(m => `${fmtDate(m.date)} (${fmtPct(m.changePct)})`).join(", ")}</div>}
              <div>Retrieved {new Date(perf.sources.retrievedAt).toLocaleString("en-IN")}</div>
            </div>
          </div>
        )}
        <div style={{ ...note, textAlign: "center" }}>Educational information, not investment advice. Mutual fund investments are subject to market risks; read all scheme-related documents carefully.</div>
      </div>
    </div>
  );
}
