"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus, Trash2, Save, FolderOpen } from "lucide-react";
import {
  analyseStrategy, blackScholes, payoffAtExpiry, payoffBeforeExpiry, type Leg, type OptionType,
} from "@/lib/options";
import { Tip, num, rupees, tone } from "@/components/tools/ToolsShell";
import { listItems, saveItem, deleteItem, newId, WorkspaceError, type SavedItem } from "@/components/tools/workspace";
import { BUILDER_IMPORT_KEY, type BuilderState, type UiLeg } from "@/components/tools/builderHandoff";

const PayoffChart = dynamic(() => import("@/components/tools/PayoffChart").then(m => m.PayoffChart), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   STRATEGY BUILDER
   Legs come from the user, a template (theoretical premiums) or the
   live option chain (market premiums, via sessionStorage handoff).
   ═══════════════════════════════════════════════════════════════ */

const MAX_LEGS = 8;
const leg = (p: Partial<UiLeg>): UiLeg => ({ id: newId(), kind: "CE", side: "BUY", strike: "", premium: "", lots: "1", iv: "14", ...p });

type Template = { name: string; note: string; legs: [UiLeg["side"], OptionType, number][] }; // offset in strike steps
const TEMPLATES: Template[] = [
  { name: "Long call", note: "Gains if the price rises; risk limited to the premium.", legs: [["BUY", "CE", 0]] },
  { name: "Long put", note: "Gains if the price falls; risk limited to the premium.", legs: [["BUY", "PE", 0]] },
  { name: "Bull call spread", note: "Cheaper than a long call, with capped profit.", legs: [["BUY", "CE", 0], ["SELL", "CE", 4]] },
  { name: "Bear put spread", note: "Cheaper than a long put, with capped profit.", legs: [["BUY", "PE", 0], ["SELL", "PE", -4]] },
  { name: "Long straddle", note: "Gains from a big move either way; loses if the price stays put.", legs: [["BUY", "CE", 0], ["BUY", "PE", 0]] },
  { name: "Short straddle", note: "Gains if the price stays put; loss is unlimited on a big move.", legs: [["SELL", "CE", 0], ["SELL", "PE", 0]] },
  { name: "Long strangle", note: "Like a straddle with out-of-the-money options: cheaper, needs a bigger move.", legs: [["BUY", "CE", 4], ["BUY", "PE", -4]] },
  { name: "Iron condor", note: "Gains in a range; both profit and loss are capped.", legs: [["BUY", "PE", -8], ["SELL", "PE", -4], ["SELL", "CE", 4], ["BUY", "CE", 8]] },
];

const DEFAULT: BuilderState = {
  name: "", underlying: "NIFTY", spot: "23150", days: "7", rate: "6.5", lotSize: "1", source: "manual",
  legs: [leg({ side: "BUY", kind: "CE", strike: "23150", premium: "", iv: "14" })],
};

export default function StrategyBuilder() {
  const [s, setS] = useState<BuilderState>(DEFAULT);
  const [step, setStep] = useState("50");
  const [tplIv, setTplIv] = useState("14");
  const [scenario, setScenario] = useState({ move: 0, daysOn: 0, ivShift: 0 });
  const [saved, setSaved] = useState<SavedItem<BuilderState>[] | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Hand-off from the option chain page.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BUILDER_IMPORT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(BUILDER_IMPORT_KEY);
      const imported = JSON.parse(raw) as BuilderState;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage only exists in the browser
      if (Array.isArray(imported.legs)) setS({ ...DEFAULT, ...imported, legs: imported.legs.map(l => ({ ...l, id: newId() })) });
    } catch { /* ignore a bad hand-off */ }
  }, []);

  const set = <K extends keyof BuilderState>(k: K, v: BuilderState[K]) => setS(p => ({ ...p, [k]: v }));
  const setLeg = (id: string, patch: Partial<UiLeg>) => setS(p => ({ ...p, legs: p.legs.map(l => (l.id === id ? { ...l, ...patch } : l)) }));

  const spot = +s.spot, days = +s.days, r = +s.rate / 100, lotSize = Math.max(1, Math.round(+s.lotSize || 1));

  // Legs that have every number filled in; option premiums may be blank (filled from the model).
  const legs: Leg[] = useMemo(() => s.legs.flatMap(l => {
    const strike = +l.strike, lots = +l.lots, iv = +l.iv / 100;
    if (!(strike > 0) || !(lots > 0)) return [];
    let premium = l.premium === "" ? NaN : +l.premium;
    if (l.kind === "FUT") premium = 0;
    else if (!Number.isFinite(premium) && spot > 0 && iv > 0) {
      premium = blackScholes({ type: l.kind, S: spot, K: strike, T: days / 365, r, sigma: iv }).price;
    }
    if (!Number.isFinite(premium) || premium < 0) return [];
    return [{ kind: l.kind, side: l.side, strike, premium, lots, lotSize, iv: l.kind === "FUT" ? undefined : iv }];
  }), [s.legs, spot, days, r, lotSize]);

  const complete = legs.length === s.legs.length && legs.length > 0 && spot > 0;
  const stats = useMemo(() => (complete ? analyseStrategy(legs, { spot, daysLeft: days, r }) : null), [complete, legs, spot, days, r]);

  const chart = useMemo(() => {
    if (!complete) return [];
    const strikes = legs.map(l => l.strike);
    // Frame the strikes and spot with some room either side (at least ±3% of spot).
    const minX = Math.min(spot, ...strikes), maxX = Math.max(spot, ...strikes);
    const pad = Math.max((maxX - minX) * 0.6, spot * 0.03);
    const lo = Math.max(0, minX - pad), hi = maxX + pad;
    const n = 120;
    const daysLeft = Math.max(0, days - scenario.daysOn);
    return Array.from({ length: n + 1 }, (_, i) => {
      const x = lo + ((hi - lo) * i) / n;
      return {
        spot: Math.round(x * 100) / 100,
        expiry: Math.round(payoffAtExpiry(legs, x)),
        today: daysLeft > 0 ? Math.round(payoffBeforeExpiry(legs, x, daysLeft, r, scenario.ivShift / 100)) : null,
      };
    });
  }, [complete, legs, spot, days, r, scenario.daysOn, scenario.ivShift]);

  const scenarioPnl = useMemo(() => {
    if (!complete) return null;
    const x = spot * (1 + scenario.move / 100);
    const daysLeft = Math.max(0, days - scenario.daysOn);
    return daysLeft > 0 ? payoffBeforeExpiry(legs, x, daysLeft, r, scenario.ivShift / 100) : payoffAtExpiry(legs, x);
  }, [complete, legs, spot, days, r, scenario]);

  const applyTemplate = (t: Template) => {
    const st = +step || 50;
    const atm = Math.round(spot / st) * st;
    const iv = +tplIv / 100;
    setS(p => ({
      ...p, source: "template", name: t.name,
      legs: t.legs.map(([side, kind, off]) => {
        const strike = atm + off * st;
        const prem = spot > 0 && iv > 0 ? blackScholes({ type: kind, S: spot, K: strike, T: days / 365, r, sigma: iv }).price : 0;
        return leg({ side, kind, strike: String(strike), premium: prem.toFixed(2), iv: tplIv });
      }),
    }));
  };

  const loadSaved = useCallback(async () => {
    try { setSaved(await listItems<BuilderState>("strategy")); }
    catch (e) { setSaved([]); setSaveMsg(e instanceof WorkspaceError && e.status === 401 ? "Sign in to save and load strategies." : (e as Error).message); }
  }, []);

  const save = async () => {
    const name = s.name.trim() || `${s.underlying} strategy`;
    try {
      await saveItem("strategy", newId(), { ...s, name });
      setSaveMsg(`Saved “${name}”.`);
      loadSaved();
    } catch (e) {
      setSaveMsg(e instanceof WorkspaceError && e.status === 401 ? "Sign in to save strategies." : (e as Error).message);
    }
  };

  const unitLabel = lotSize === 1 ? "per unit; set the lot size to see rupees per position" : `${lotSize} units per lot`;

  return (
    <>
      <h1>Strategy Builder</h1>
      <p className="wt-lede">
        Combine option and futures legs to see what you could make or lose. Enter market premiums for real
        figures, or start from a template, whose premiums come from the Black-Scholes model.
        You can also pick legs straight from the <Link href="/tools/option-chain" style={{ color: "var(--accent)" }}>option chain</Link>.
      </p>

      {s.source === "template" && (
        <div className="wt-banner wt-banner-info">
          Template premiums are theoretical (Black-Scholes at {tplIv}% volatility), not market prices. Replace them with
          the premiums in the option chain before relying on the numbers.
        </div>
      )}

      <div className="wt-grid wt-grid-side">
        <section className="wt-card">
          <h2>Setup</h2>
          <div className="wt-fields">
            <F id="sb-u" label="Underlying" value={s.underlying} set={v => set("underlying", v)} text />
            <F id="sb-spot" label="Underlying price (₹)" value={s.spot} set={v => set("spot", v)} />
            <F id="sb-days" label="Days to expiry" value={s.days} set={v => set("days", v)} />
            <F id="sb-lot" label="Lot size (units)" value={s.lotSize} set={v => set("lotSize", v)}
              tip="Units in one lot. NSE revises lot sizes from time to time; check the current size on nseindia.com or with your broker." />
            <F id="sb-rate" label="Interest rate (%)" value={s.rate} set={v => set("rate", v)} />
            <F id="sb-step" label="Strike gap (₹)" value={step} set={setStep} tip="Distance between strikes, used by templates. NIFTY 50, BANK NIFTY 100." />
          </div>

          <h3>Templates</h3>
          <div className="wt-chips">
            {TEMPLATES.map(t => (
              <button key={t.name} className="wt-chip" title={t.note} onClick={() => applyTemplate(t)}>{t.name}</button>
            ))}
          </div>
          <div className="wt-field" style={{ marginTop: 8, maxWidth: 180 }}>
            <label htmlFor="sb-tiv">Template volatility (%)</label>
            <input id="sb-tiv" className="wt-input" inputMode="decimal" value={tplIv} onChange={e => setTplIv(e.target.value)} />
          </div>
          <p className="wt-hint" style={{ marginTop: 8 }}>Templates show how common structures behave. They are not suggestions to trade.</p>

          <h3>Save</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input aria-label="Strategy name" className="wt-input" style={{ flex: 1, minWidth: 140 }} placeholder="Name" value={s.name} onChange={e => set("name", e.target.value)} />
            <button className="wt-btn" onClick={save} disabled={!complete}><Save size={14} />Save</button>
            <button className="wt-btn" onClick={loadSaved}><FolderOpen size={14} />Saved</button>
          </div>
          {saveMsg && <p className="wt-hint" style={{ marginTop: 6 }}>{saveMsg}</p>}
          {saved && saved.length > 0 && (
            <ul style={{ listStyle: "none", marginTop: 8, display: "grid", gap: 6 }}>
              {saved.map(it => (
                <li key={it.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button className="wt-btn wt-btn-sm" style={{ flex: 1, justifyContent: "flex-start" }}
                    onClick={() => setS({ ...DEFAULT, ...it.data, legs: it.data.legs.map(l => ({ ...l, id: newId() })) })}>
                    {it.data.name} <span className="wt-muted">· {new Date(it.updated_at).toLocaleDateString("en-IN")}</span>
                  </button>
                  <button className="wt-btn wt-btn-sm" aria-label={`Delete ${it.data.name}`}
                    onClick={async () => { await deleteItem("strategy", it.id); loadSaved(); }}><Trash2 size={12} /></button>
                </li>
              ))}
            </ul>
          )}
          {saved && saved.length === 0 && !saveMsg && <p className="wt-hint" style={{ marginTop: 6 }}>No saved strategies yet.</p>}
        </section>

        <section className="wt-card">
          <h2 style={{ justifyContent: "space-between" }}>
            <span>Legs</span>
            <button className="wt-btn wt-btn-sm" disabled={s.legs.length >= MAX_LEGS}
              onClick={() => set("legs", [...s.legs, leg({ strike: s.spot })])}><Plus size={12} />Add leg</button>
          </h2>
          <div className="wt-leg wt-hint" style={{ borderTop: "none", paddingTop: 0 }} aria-hidden>
            <span>Side</span><span>Type</span><span>Strike / price</span><span>Premium (₹)</span><span>Lots</span><span />
          </div>
          {s.legs.map(l => (
            <div key={l.id} className="wt-leg">
              <select aria-label="Buy or sell" className="wt-select" value={l.side} onChange={e => setLeg(l.id, { side: e.target.value as UiLeg["side"] })}
                style={{ color: l.side === "BUY" ? "var(--success)" : "var(--danger)" }}>
                <option value="BUY">Buy</option><option value="SELL">Sell</option>
              </select>
              <select aria-label="Instrument" className="wt-select" value={l.kind} onChange={e => setLeg(l.id, { kind: e.target.value as UiLeg["kind"] })}>
                <option value="CE">CE</option><option value="PE">PE</option><option value="FUT">FUT</option>
              </select>
              <input aria-label="Strike, or futures entry price" className="wt-input" inputMode="decimal" value={l.strike} onChange={e => setLeg(l.id, { strike: e.target.value })} />
              {l.kind === "FUT"
                ? <span className="wt-hint" style={{ alignSelf: "center" }}>—</span>
                : <input aria-label="Premium per unit" className="wt-input" inputMode="decimal" placeholder="model" value={l.premium} onChange={e => setLeg(l.id, { premium: e.target.value })} />}
              <input aria-label="Lots" className="wt-input" inputMode="numeric" value={l.lots} onChange={e => setLeg(l.id, { lots: e.target.value })} />
              <button className="wt-btn wt-btn-sm" aria-label="Remove leg" onClick={() => set("legs", s.legs.filter(x => x.id !== l.id))}><Trash2 size={12} /></button>
              {l.kind !== "FUT" && (
                <label className="wt-hint" style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6 }}>
                  IV %
                  <input aria-label="Implied volatility percent" className="wt-input" style={{ width: 72, padding: "4px 6px" }} inputMode="decimal" value={l.iv} onChange={e => setLeg(l.id, { iv: e.target.value })} />
                  <span>used for the before-expiry line, Greeks, and the premium when you leave it blank</span>
                </label>
              )}
            </div>
          ))}
          {!complete && <div className="wt-banner wt-banner-warn" style={{ marginTop: 10 }}>Fill in the underlying price and every leg&apos;s strike and lots to see results.</div>}

          {stats && (
            <>
              <h3>Summary <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>({unitLabel})</span></h3>
              <div className="wt-stats">
                <Stat label={stats.netPremium >= 0 ? "Net credit" : "Net debit"} value={rupees(Math.abs(stats.netPremium))}
                  tip="Premium received (credit) or paid (debit) across all legs at entry." />
                <Stat label="Max profit" value={stats.maxProfit === null ? "Unlimited" : rupees(stats.maxProfit)} cls={stats.maxProfit === null ? "wt-pos" : tone(stats.maxProfit)} />
                <Stat label="Max loss" value={stats.maxLoss === null ? "Unlimited" : rupees(stats.maxLoss)} cls={stats.maxLoss === null ? "wt-neg" : tone(stats.maxLoss)} />
                <Stat label="Breakeven(s)" value={stats.breakevens.length ? stats.breakevens.map(b => num(b, 0)).join(" · ") : "None"}
                  tip="Underlying prices at expiry where the position neither makes nor loses money." />
              </div>
              {stats.greeks && (
                <div className="wt-stats" style={{ marginTop: 10 }}>
                  <Stat label="Net delta" value={num(stats.greeks.delta, 2)} tip="Approximate ₹ change in the position for a ₹1 rise in the underlying." />
                  <Stat label="Net gamma" value={num(stats.greeks.gamma, 4)} tip="How fast net delta changes as the underlying moves." />
                  <Stat label="Theta / day" value={rupees(stats.greeks.theta)} cls={tone(stats.greeks.theta)} tip="Daily time decay of the whole position if nothing else changes." />
                  <Stat label="Vega / 1 pt" value={rupees(stats.greeks.vega)} tip="Change in value for a 1-point rise in implied volatility." />
                </div>
              )}

              <h3>Payoff</h3>
              <p className="wt-hint" style={{ marginBottom: 6 }}>
                <span style={{ color: "#34D399" }}>━</span> at expiry &nbsp;
                <span style={{ color: "#A78BFA" }}>┅</span> {scenario.daysOn === 0 ? "today" : `in ${scenario.daysOn} day(s)`} (model) &nbsp;
                <span style={{ color: "#FBBF24" }}>┊</span> breakeven
              </p>
              <PayoffChart data={chart} spot={spot} breakevens={stats.breakevens}
                todayLabel={scenario.daysOn === 0 ? "Today (model)" : `In ${scenario.daysOn} day(s)`} />

              <h3>What if</h3>
              <div className="wt-fields">
                <Slider label={`Underlying move: ${scenario.move > 0 ? "+" : ""}${scenario.move}%`} min={-10} max={10} step={0.5} value={scenario.move}
                  set={v => setScenario(p => ({ ...p, move: v }))} />
                <Slider label={`Days from now: ${scenario.daysOn}`} min={0} max={Math.max(0, Math.floor(days))} step={1} value={scenario.daysOn}
                  set={v => setScenario(p => ({ ...p, daysOn: v }))} />
                <Slider label={`Volatility change: ${scenario.ivShift > 0 ? "+" : ""}${scenario.ivShift} pts`} min={-10} max={10} step={0.5} value={scenario.ivShift}
                  set={v => setScenario(p => ({ ...p, ivShift: v }))} />
                <div className="wt-stat">
                  <div className="wt-stat-label">P&amp;L at ₹{num(spot * (1 + scenario.move / 100), 0)}</div>
                  <div className={`wt-stat-value ${tone(scenarioPnl)}`}>{rupees(scenarioPnl)}</div>
                </div>
              </div>
              <p className="wt-hint" style={{ marginTop: 10 }}>
                Before-expiry values use Black-Scholes with each leg&apos;s IV and leave out brokerage and taxes
                (see the <Link href="/tools/charges" style={{ color: "var(--accent)" }}>charges calculator</Link>). Margin isn&apos;t estimated here; your broker&apos;s SPAN calculator gives the exact figure.
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function F({ id, label, value, set, tip, text }: { id: string; label: string; value: string; set: (v: string) => void; tip?: string; text?: boolean }) {
  return (
    <div className="wt-field">
      <label htmlFor={id} style={{ display: "flex", gap: 4, alignItems: "center" }}>{label}{tip && <Tip text={tip} />}</label>
      <input id={id} className="wt-input" inputMode={text ? "text" : "decimal"} value={value} onChange={e => set(e.target.value)} />
    </div>
  );
}

function Stat({ label, value, tip, cls = "" }: { label: string; value: string; tip?: string; cls?: string }) {
  return (
    <div className="wt-stat">
      <div className="wt-stat-label">{label}{tip && <Tip text={tip} />}</div>
      <div className={`wt-stat-value ${cls}`}>{value}</div>
    </div>
  );
}

function Slider({ label, min, max, step, value, set }: { label: string; min: number; max: number; step: number; value: number; set: (v: number) => void }) {
  return (
    <div className="wt-field">
      <label>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(+e.target.value)} aria-label={label} style={{ accentColor: "#4A9EFF" }} />
    </div>
  );
}
