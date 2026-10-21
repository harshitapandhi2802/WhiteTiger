"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { RefreshCw, LineChart } from "lucide-react";
import type { ChainStrike, ParsedChain } from "@/lib/nse-chain";
import { daysToExpiry } from "@/lib/options";
import { Tip, num, rupees, tone } from "@/components/tools/ToolsShell";
import { BUILDER_IMPORT_KEY, type BuilderState } from "@/components/tools/builderHandoff";
import { newId } from "@/components/tools/workspace";

const OiChart = dynamic(() => import("@/components/tools/OiChart").then(m => m.OiChart), { ssr: false });

type ChainResponse =
  | ({ status: "ok"; underlying: string; label: string; expiry: string; expiries: string[]; lotSize: number | null; source: string; fetchedAt: number; dataTimeMs: number | null; stale?: boolean } & ParsedChain)
  | { status: "error"; message: string };

const UNDERLYINGS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "NIFTYNXT50"];

/** True during NSE's F&O session (Mon–Fri, 09:15–15:30 IST; holidays not checked). */
function marketOpen(now = Date.now()): boolean {
  const ist = new Date(now + 5.5 * 3_600_000);
  const day = ist.getUTCDay();
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return day >= 1 && day <= 5 && mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
}
const REFRESH_MS = 30_000;

interface Pick { strike: number; kind: "CE" | "PE"; side: "BUY" | "SELL"; ltp: number; iv: number | null }

export default function OptionChainPage() {
  const router = useRouter();
  const [underlying, setUnderlying] = useState("NIFTY");
  const [stockInput, setStockInput] = useState("");
  const [expiry, setExpiry] = useState<string | null>(null);
  const [range, setRange] = useState(12);
  const [greeks, setGreeks] = useState(false);
  const [data, setData] = useState<ChainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [lagging, setLagging] = useState(false); // NSE data > 10 min old during market hours

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ underlying });
      if (expiry) q.set("expiry", expiry);
      const res = await fetch(`/api/fno/option-chain?${q}`, { cache: "no-store" });
      const body: ChainResponse = await res.json();
      setData(body);
      setLagging(body.status === "ok" && !body.stale && body.dataTimeMs !== null && marketOpen() && Date.now() - body.dataTimeMs > 10 * 60_000);
    } catch {
      setData({ status: "error", message: "Couldn't reach White Tiger's server." });
    } finally {
      setLoading(false);
    }
  }, [underlying, expiry]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount and when inputs change
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (data?.status !== "ok") return;
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, REFRESH_MS);
    return () => clearInterval(t);
  }, [data?.status, load]);

  const ok = data?.status === "ok" ? data : null;

  const rows = useMemo(() => {
    if (!ok || ok.atmStrike === null) return ok?.rows ?? [];
    const i = ok.rows.findIndex(r => r.strike === ok.atmStrike);
    return range >= 999 ? ok.rows : ok.rows.slice(Math.max(0, i - range), i + range + 1);
  }, [ok, range]);

  const maxOi = useMemo(() => Math.max(1, ...rows.flatMap(r => [r.call?.oi ?? 0, r.put?.oi ?? 0])), [rows]);

  const togglePick = (r: ChainStrike, kind: "CE" | "PE") => {
    const sideData = kind === "CE" ? r.call : r.put;
    if (!sideData?.ltp) return;
    setPicks(prev => {
      const i = prev.findIndex(p => p.strike === r.strike && p.kind === kind);
      if (i === -1) return [...prev, { strike: r.strike, kind, side: "BUY" as const, ltp: sideData.ltp!, iv: sideData.iv }].slice(0, 8);
      if (prev[i].side === "BUY") return prev.map((p, j): Pick => (j === i ? { ...p, side: "SELL" } : p));
      return prev.filter((_, j) => j !== i);
    });
  };

  const openBuilder = () => {
    if (!ok || !ok.spot) return;
    const state: BuilderState = {
      name: `${ok.label} ${ok.expiry}`,
      underlying: ok.underlying,
      spot: String(ok.spot),
      days: daysToExpiry(ok.expiry).toFixed(2),
      rate: "6.5",
      lotSize: String(ok.lotSize ?? 1),
      source: "chain",
      legs: picks.map(p => ({
        id: newId(), kind: p.kind, side: p.side, strike: String(p.strike), premium: String(p.ltp), lots: "1",
        iv: p.iv ? String(p.iv) : String(ok.atmIv ?? 14),
      })),
    };
    sessionStorage.setItem(BUILDER_IMPORT_KEY, JSON.stringify(state));
    router.push("/tools/strategy-builder");
  };

  return (
    <>
      <h1>Option Chain</h1>
      <p className="wt-lede">
        NSE&apos;s option chain for indices and F&amp;O stocks: open interest, change in OI, volume and implied volatility
        for every strike, with PCR, max pain and ATM IV. Click a premium to add that option to a strategy
        (click again to switch to sell, a third time to remove).
      </p>

      <div className="wt-chips" style={{ marginBottom: 12, alignItems: "center" }}>
        {UNDERLYINGS.map(u => (
          <button key={u} className="wt-chip" aria-pressed={underlying === u} onClick={() => { setUnderlying(u); setExpiry(null); setPicks([]); }}>{u}</button>
        ))}
        <form style={{ display: "flex", gap: 6 }} onSubmit={e => {
          e.preventDefault();
          const sym = stockInput.trim().toUpperCase();
          if (sym) { setUnderlying(sym); setExpiry(null); setPicks([]); }
        }}>
          <input aria-label="F&O stock symbol" className="wt-input" style={{ width: 150, padding: "6px 10px" }} placeholder="F&O stock, e.g. RELIANCE"
            value={stockInput} onChange={e => setStockInput(e.target.value)} />
          <button className="wt-btn wt-btn-sm" type="submit">Go</button>
        </form>
      </div>

      {data === null && <div className="wt-card"><p className="wt-hint">Loading the option chain…</p></div>}

      {data?.status === "error" && (
        <div className="wt-banner wt-banner-danger">
          The option chain is unavailable right now: {data.message}. Nothing is shown rather than old or estimated data.
          The other tools work without it: <Link href="/tools/strategy-builder" style={{ color: "inherit", textDecoration: "underline" }}>Strategy Builder</Link>.
          <button className="wt-btn wt-btn-sm" style={{ marginLeft: "auto" }} onClick={load}>Retry</button>
        </div>
      )}

      {ok && (
        <>
          {ok.stale && (
            <div className="wt-banner wt-banner-warn">
              The latest refresh from NSE failed, so this is the last good snapshot (fetched {new Date(ok.fetchedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST). Don&apos;t rely on it for live decisions.
            </div>
          )}
          {lagging && (
            <div className="wt-banner wt-banner-warn">
              NSE&apos;s data is from {ok.dataTime} IST, more than 10 minutes old during market hours.
            </div>
          )}
          <div className="wt-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <label className="wt-hint" htmlFor="ocx">Expiry</label>
              <select id="ocx" className="wt-select" style={{ width: "auto" }} value={ok.expiry} onChange={e => { setExpiry(e.target.value); setPicks([]); }}>
                {ok.expiries.map(d => <option key={d} value={d}>{new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</option>)}
              </select>
              <label className="wt-hint" htmlFor="ocr">Strikes</label>
              <select id="ocr" className="wt-select" style={{ width: "auto" }} value={range} onChange={e => setRange(+e.target.value)}>
                <option value={6}>ATM ± 6</option><option value={12}>ATM ± 12</option><option value={20}>ATM ± 20</option><option value={999}>All</option>
              </select>
              <button className="wt-chip" aria-pressed={greeks} onClick={() => setGreeks(g => !g)}>Greeks (calculated)</button>
              <button className="wt-btn wt-btn-sm" onClick={load} disabled={loading} style={{ marginLeft: "auto" }}>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh
              </button>
            </div>
            <div className="wt-stats">
              <Stat label={`${ok.label} spot`} value={rupees(ok.spot)} />
              <Stat label="PCR (OI)" value={num(ok.pcr)} tip="Put-call ratio: total put open interest ÷ total call open interest for this expiry. It describes positioning, not direction." />
              <Stat label="Max pain" value={ok.maxPain ? num(ok.maxPain, 0) : "—"} tip="The expiry price at which option buyers would collect the least in total, from current open interest. A reference level, not a forecast." />
              <Stat label="ATM IV" value={ok.atmIv ? `${num(ok.atmIv)}%` : "—"} tip="Average implied volatility of the at-the-money call and put, as reported by the broker feed." />
              <Stat label="NSE data time (IST)" value={ok.dataTime ? ok.dataTime.split(" ")[1] : "—"} tip={ok.dataTime ? `NSE timestamp: ${ok.dataTime}` : undefined} />
              <Stat label="Days to expiry" value={num(daysToExpiry(ok.expiry), 1)} />
            </div>
            <p className="wt-hint" style={{ marginTop: 10 }}>
              Source: {ok.source}, as of {ok.dataTime ?? "—"} IST; refreshes every 30 seconds while this page is open.
              OI and volume are in contracts, as NSE reports them; OI change is against the previous day.
              Greeks are calculated by White Tiger from NSE&apos;s IV (Black-Scholes, 6.5% rate); NSE doesn&apos;t publish them.
            </p>
          </div>

          {picks.length > 0 && (
            <div className="wt-banner wt-banner-info" style={{ alignItems: "center", flexWrap: "wrap" }}>
              <span>
                {picks.map(p => `${p.side === "BUY" ? "Buy" : "Sell"} ${num(p.strike, 0)} ${p.kind} @ ${num(p.ltp)}`).join(" · ")}
              </span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button className="wt-btn wt-btn-sm" onClick={() => setPicks([])}>Clear</button>
                <button className="wt-btn wt-btn-sm wt-btn-primary" onClick={openBuilder}><LineChart size={12} />Open in Strategy Builder</button>
              </span>
            </div>
          )}

          <div className="wt-table-wrap" style={{ maxHeight: "70vh" }}>
            <table className="wt-table">
              <thead>
                <tr>
                  <th>OI</th><th>Chg OI</th><th>Volume</th><th>IV</th>{greeks && <><th>Delta</th><th>Theta</th></>}<th>LTP</th>
                  <th className="wt-strike">Strike</th>
                  <th style={{ textAlign: "left" }}>LTP</th>{greeks && <><th>Delta</th><th>Theta</th></>}<th>IV</th><th>Volume</th><th>Chg OI</th><th>OI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const atm = r.strike === ok.atmStrike;
                  const callItm = ok.spot !== null && r.strike < ok.spot;
                  const putItm = ok.spot !== null && r.strike > ok.spot;
                  const pickC = picks.find(p => p.strike === r.strike && p.kind === "CE");
                  const pickP = picks.find(p => p.strike === r.strike && p.kind === "PE");
                  return (
                    <tr key={r.strike} className={atm ? "wt-atm" : ""}>
                      <OiCell v={r.call?.oi} max={maxOi} color="248,113,113" cls={callItm ? "wt-itm" : ""} />
                      <td className={`${tone(r.call?.oiChange)} ${callItm ? "wt-itm" : ""}`}>{fmtInt(r.call?.oiChange)}</td>
                      <td className={callItm ? "wt-itm" : ""}>{fmtInt(r.call?.volume)}</td>
                      <td className={callItm ? "wt-itm" : ""}>{num(r.call?.iv)}</td>
                      {greeks && <><td className={callItm ? "wt-itm" : ""}>{num(r.call?.delta, 2)}</td><td className={callItm ? "wt-itm" : ""}>{num(r.call?.theta)}</td></>}
                      <PremCell v={r.call?.ltp} pick={pickC} onClick={() => togglePick(r, "CE")} cls={callItm ? "wt-itm" : ""} />
                      <td className="wt-strike">{num(r.strike, 0)}</td>
                      <PremCell v={r.put?.ltp} pick={pickP} onClick={() => togglePick(r, "PE")} cls={putItm ? "wt-itm" : ""} left />
                      {greeks && <><td className={putItm ? "wt-itm" : ""}>{num(r.put?.delta, 2)}</td><td className={putItm ? "wt-itm" : ""}>{num(r.put?.theta)}</td></>}
                      <td className={putItm ? "wt-itm" : ""}>{num(r.put?.iv)}</td>
                      <td className={putItm ? "wt-itm" : ""}>{fmtInt(r.put?.volume)}</td>
                      <td className={`${tone(r.put?.oiChange)} ${putItm ? "wt-itm" : ""}`}>{fmtInt(r.put?.oiChange)}</td>
                      <OiCell v={r.put?.oi} max={maxOi} color="52,211,153" cls={putItm ? "wt-itm" : ""} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="wt-hint" style={{ marginTop: 6 }}>
            Calls on the left, puts on the right. Shaded cells are in the money. The highlighted row is the strike nearest the spot.
          </p>

          <div className="wt-card" style={{ marginTop: 16 }}>
            <h2>Open interest by strike</h2>
            <OiChart rows={rows} spot={ok.spot} maxPain={ok.maxPain} />
          </div>
        </>
      )}
    </>
  );
}

const fmtInt = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `${v > 0 ? "" : v < 0 ? "−" : ""}${Math.abs(v).toLocaleString("en-IN")}`;

function OiCell({ v, max, color, cls }: { v: number | null | undefined; max: number; color: string; cls: string }) {
  const pct = v ? Math.min(100, (v / max) * 100) : 0;
  return (
    <td className={cls} style={{ backgroundImage: `linear-gradient(to left, rgba(${color},0.18) ${pct}%, transparent ${pct}%)` }}>
      {fmtInt(v)}
    </td>
  );
}

function PremCell({ v, pick, onClick, cls, left }: { v: number | null | undefined; pick?: Pick; onClick: () => void; cls: string; left?: boolean }) {
  const label = pick ? (pick.side === "BUY" ? "B" : "S") : null;
  return (
    <td className={cls} style={{ textAlign: left ? "left" : "right", fontWeight: 700 }}>
      <button onClick={onClick} disabled={!v} aria-label={v ? `Premium ${v}. Add to strategy` : "No price"}
        style={{ all: "unset", cursor: v ? "pointer" : "default", padding: "2px 4px", borderRadius: 5, outline: pick ? `1px solid ${pick.side === "BUY" ? "#34D399" : "#F87171"}` : "none" }}>
        {num(v)}{label && <sup style={{ marginLeft: 3, color: pick!.side === "BUY" ? "#34D399" : "#F87171" }}>{label}</sup>}
      </button>
    </td>
  );
}

function Stat({ label, value, tip }: { label: string; value: string; tip?: string }) {
  return (
    <div className="wt-stat">
      <div className="wt-stat-label">{label}{tip && <Tip text={tip} />}</div>
      <div className="wt-stat-value">{value}</div>
    </div>
  );
}
