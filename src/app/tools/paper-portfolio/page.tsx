"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, RefreshCw, AlertTriangle, LogIn } from "lucide-react";
import { searchStocks, quoteKey, type StockEntry } from "@/lib/stocks";
import { buildPositions, valuePositions, exposure, type PaperTrade, type Quote } from "@/lib/portfolio";
import { Tip, num, rupees, tone } from "@/components/tools/ToolsShell";
import { listItems, saveItem, deleteItem, newId, WorkspaceError, type SavedItem } from "@/components/tools/workspace";

/* Paper portfolio: paper trades saved to the user's account, valued at live prices. */

const REFRESH_MS = 60_000;
const today = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

export default function PaperPortfolio() {
  const [trades, setTrades] = useState<SavedItem<PaperTrade>[] | null>(null);
  const [authNeeded, setAuthNeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [quoteMeta, setQuoteMeta] = useState<{ at: number; source: string; failed: boolean } | null>(null);

  // New trade form
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState<StockEntry | null>(null);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setTrades(await listItems<PaperTrade>("position"));
      setAuthNeeded(false);
    } catch (e) {
      if (e instanceof WorkspaceError && e.status === 401) setAuthNeeded(true);
      else setError((e as Error).message);
      setTrades([]);
    }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount and when inputs change
  useEffect(() => { load(); }, [load]);

  const { positions, errors } = useMemo(() => buildPositions((trades ?? []).map(t => t.data)), [trades]);
  const openSymbols = useMemo(() => positions.filter(p => p.qty > 0).map(p => p.symbol), [positions]);

  const refreshQuotes = useCallback(async () => {
    if (openSymbols.length === 0) return;
    try {
      const res = await fetch(`/api/quotes?ids=${encodeURIComponent(openSymbols.join(","))}`, { cache: "no-store" });
      const body = await res.json();
      setQuotes(body.quotes || {});
      setQuoteMeta({ at: body.fetchedAt, source: body.source, failed: !res.ok });
    } catch {
      setQuoteMeta(m => ({ at: m?.at ?? 0, source: m?.source ?? "", failed: true }));
    }
  }, [openSymbols]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch live prices for the current holdings
    refreshQuotes();
    const t = setInterval(() => { if (document.visibilityState === "visible") refreshQuotes(); }, REFRESH_MS);
    return () => clearInterval(t);
  }, [refreshQuotes]);

  const { rows, totals } = useMemo(() => valuePositions(positions, quotes), [positions, quotes]);
  const exp = useMemo(() => exposure(rows), [rows]);
  const suggestions = useMemo(() => (query.length >= 2 && !stock ? searchStocks(query, 8) : []), [query, stock]);

  const addTrade = async () => {
    if (!stock || !(+qty > 0) || !(+price > 0)) return;
    const trade: PaperTrade = {
      symbol: quoteKey(stock), name: stock.name, sector: stock.sector, side, qty: Math.round(+qty), price: +price, date,
      ...(note.trim() ? { note: note.trim().slice(0, 500) } : {}),
    };
    const check = buildPositions([...(trades ?? []).map(t => t.data), trade]);
    if (check.errors.length > errors.length) { setError(check.errors[check.errors.length - 1]); return; }
    setSaving(true);
    try {
      await saveItem("position", newId(), trade);
      setStock(null); setQuery(""); setQty(""); setPrice(""); setNote(""); setError(null);
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  if (authNeeded) {
    return (
      <>
        <h1>Paper Portfolio</h1>
        <div className="wt-card">
          <h2><LogIn size={18} />Sign in to keep a paper portfolio</h2>
          <p className="wt-lede">Your paper trades and journal are saved to your account, so they&apos;re there on any device.</p>
          <Link className="wt-btn wt-btn-primary" href="/analyze">Sign in with Google</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Paper Portfolio</h1>
      <p className="wt-lede">
        Practise and track ideas without real money. Record paper trades with a note on why you made them; White Tiger
        values them at live prices and flags concentration. Nothing here places an order.
      </p>

      {error && <div className="wt-banner wt-banner-danger">{error}</div>}

      <div className="wt-grid wt-grid-side">
        <section className="wt-card">
          <h2>Record a paper trade</h2>
          <div className="wt-field" style={{ position: "relative" }}>
            <label htmlFor="pp-q">Stock</label>
            <input id="pp-q" className="wt-input" placeholder="Search name or NSE symbol" value={stock ? `${stock.name} (${quoteKey(stock)})` : query}
              onChange={e => { setStock(null); setQuery(e.target.value); }} autoComplete="off" />
            {suggestions.length > 0 && (
              <ul role="listbox" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, listStyle: "none", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, marginTop: 4, maxHeight: 260, overflowY: "auto" }}>
                {suggestions.map(s => (
                  <li key={s.ticker}>
                    <button className="wt-btn" style={{ width: "100%", justifyContent: "space-between", border: "none", borderRadius: 0, background: "transparent" }}
                      onClick={() => { setStock(s); setQuery(""); }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                      <span className="wt-muted">{quoteKey(s)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="wt-fields" style={{ marginTop: 10 }}>
            <div className="wt-field">
              <label htmlFor="pp-side">Side</label>
              <select id="pp-side" className="wt-select" value={side} onChange={e => setSide(e.target.value as "BUY" | "SELL")}>
                <option value="BUY">Buy</option><option value="SELL">Sell</option>
              </select>
            </div>
            <div className="wt-field">
              <label htmlFor="pp-date">Date</label>
              <input id="pp-date" type="date" className="wt-input" value={date} max={today()} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="wt-field">
              <label htmlFor="pp-qty">Quantity</label>
              <input id="pp-qty" className="wt-input" inputMode="numeric" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="wt-field">
              <label htmlFor="pp-price">Price (₹)</label>
              <input id="pp-price" className="wt-input" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="wt-field" style={{ marginTop: 10 }}>
            <label htmlFor="pp-note">Journal note (optional)</label>
            <textarea id="pp-note" className="wt-input" rows={3} maxLength={500} placeholder="Why this trade? What would change your mind?" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          {stock && quotes[quoteKey(stock)] && (
            <button className="wt-btn wt-btn-sm" style={{ marginTop: 8 }} onClick={() => setPrice(String(quotes[quoteKey(stock)].price))}>
              Use live price ₹{num(quotes[quoteKey(stock)].price)}
            </button>
          )}
          <button className="wt-btn wt-btn-primary" style={{ marginTop: 12, width: "100%" }} disabled={!stock || !(+qty > 0) || !(+price > 0) || saving} onClick={addTrade}>
            <Plus size={14} />{saving ? "Saving…" : "Add paper trade"}
          </button>
        </section>

        <section className="wt-card">
          <h2 style={{ justifyContent: "space-between" }}>
            <span>Holdings</span>
            <button className="wt-btn wt-btn-sm" onClick={refreshQuotes}><RefreshCw size={12} />Prices</button>
          </h2>
          {trades === null ? <p className="wt-hint">Loading…</p> : totals.open === 0 ? (
            <p className="wt-hint">No open paper positions yet. Record a trade to start.</p>
          ) : (
            <>
              {quoteMeta?.failed && <div className="wt-banner wt-banner-warn">Live prices couldn&apos;t be refreshed. Values may be out of date.</div>}
              {totals.priced < totals.open && (
                <div className="wt-banner wt-banner-warn">No live price for {totals.open - totals.priced} holding(s), so portfolio totals aren&apos;t shown.</div>
              )}
              <div className="wt-stats">
                <Stat label="Invested" value={rupees(totals.invested)} />
                <Stat label="Current value" value={rupees(totals.value)} />
                <Stat label="Unrealised P&L" value={rupees(totals.unrealised)} cls={tone(totals.unrealised)} />
                <Stat label="Today" value={rupees(totals.dayChange)} cls={tone(totals.dayChange)} />
                <Stat label="Realised P&L" value={rupees(totals.realised)} cls={tone(totals.realised)} />
              </div>

              <div className="wt-table-wrap" style={{ marginTop: 14 }}>
                <table className="wt-table">
                  <thead><tr><th>Stock</th><th>Qty</th><th>Avg cost</th><th>LTP</th><th>Value</th><th>P&amp;L</th><th>Weight</th></tr></thead>
                  <tbody>
                    {rows.filter(r => r.qty > 0).map(r => (
                      <tr key={r.symbol}>
                        <td><Link href={`/stocks/${r.symbol.toLowerCase().replace(/[^a-z0-9]/g, "-")}`} style={{ color: "var(--text-primary)" }}>{r.name}</Link><div className="wt-muted" style={{ fontSize: "0.68rem" }}>{r.sector}</div></td>
                        <td>{r.qty}</td>
                        <td>{num(r.avgCost)}</td>
                        <td>{num(r.ltp)}</td>
                        <td>{rupees(r.value, 0)}</td>
                        <td className={tone(r.unrealised)}>{rupees(r.unrealised, 0)}<div style={{ fontSize: "0.68rem" }}>{r.unrealisedPct !== null ? `${num(r.unrealisedPct * 100)}%` : ""}</div></td>
                        <td>{r.weight !== null ? `${num(r.weight * 100, 1)}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {quoteMeta && !quoteMeta.failed && (
                <p className="wt-hint" style={{ marginTop: 6 }}>Prices: {quoteMeta.source}, updated {new Date(quoteMeta.at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST. Refreshes every minute.</p>
              )}

              {exp.sectors.length > 0 && (
                <>
                  <h3>Exposure</h3>
                  {exp.alerts.map(a => (
                    <div key={a} className="wt-banner wt-banner-warn" style={{ marginBottom: 8 }}><AlertTriangle size={14} />{a}</div>
                  ))}
                  <div style={{ display: "grid", gap: 6 }}>
                    {exp.sectors.map(s => (
                      <div key={s.sector} style={{ display: "grid", gridTemplateColumns: "minmax(0,140px) 1fr 52px", gap: 8, alignItems: "center", fontSize: "0.8rem" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.sector}</span>
                        <span style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
                          <span style={{ display: "block", height: "100%", width: `${s.weight * 100}%`, borderRadius: 4, background: "var(--accent)" }} />
                        </span>
                        <span style={{ textAlign: "right" }}>{num(s.weight * 100, 1)}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="wt-hint" style={{ marginTop: 8, display: "flex", gap: 4, alignItems: "center" }}>
                    Effective number of holdings: <strong>{num(exp.effectiveHoldings, 1)}</strong>
                    <Tip text="1 ÷ the sum of squared weights. Ten equal positions score 10; one dominant position pulls it towards 1. Higher means more diversified." />
                    · Alerts trigger above 25% in one stock or 40% in one sector.
                  </p>
                </>
              )}
            </>
          )}
        </section>
      </div>

      {trades && trades.length > 0 && (
        <section className="wt-card" style={{ marginTop: 16 }}>
          <h2>Trade journal</h2>
          {errors.length > 0 && <div className="wt-banner wt-banner-warn">{errors.join(" ")}</div>}
          <div className="wt-table-wrap">
            <table className="wt-table">
              <thead><tr><th>Date</th><th>Stock</th><th>Side</th><th>Qty</th><th>Price</th><th style={{ textAlign: "left" }}>Note</th><th /></tr></thead>
              <tbody>
                {[...trades].sort((a, b) => b.data.date.localeCompare(a.data.date)).map(t => (
                  <tr key={t.id}>
                    <td>{t.data.date}</td>
                    <td>{t.data.name}</td>
                    <td className={t.data.side === "BUY" ? "wt-pos" : "wt-neg"}>{t.data.side === "BUY" ? "Buy" : "Sell"}</td>
                    <td>{t.data.qty}</td>
                    <td>{num(t.data.price)}</td>
                    <td style={{ textAlign: "left", whiteSpace: "normal", minWidth: 200 }} className="wt-muted">{t.data.note || "—"}</td>
                    <td>
                      <button className="wt-btn wt-btn-sm" aria-label={`Delete trade in ${t.data.name}`}
                        onClick={async () => { await deleteItem("position", t.id); load(); }}><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="wt-stat">
      <div className="wt-stat-label">{label}</div>
      <div className={`wt-stat-value ${cls}`}>{value}</div>
    </div>
  );
}
