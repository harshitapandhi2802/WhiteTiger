"use client";
import { useMemo, useState } from "react";
import { calculateCharges, RATES, RATES_AS_OF, type Segment } from "@/lib/charges";
import { Tip, num, rupees, tone } from "@/components/tools/ToolsShell";

const SEGMENTS: { id: Segment; label: string; qtyLabel: string; priceLabel: string }[] = [
  { id: "delivery", label: "Equity delivery", qtyLabel: "Shares", priceLabel: "price" },
  { id: "intraday", label: "Equity intraday", qtyLabel: "Shares", priceLabel: "price" },
  { id: "futures", label: "Futures", qtyLabel: "Quantity (lots × lot size)", priceLabel: "price" },
  { id: "options", label: "Options", qtyLabel: "Quantity (lots × lot size)", priceLabel: "premium" },
];

const pct = (x: number) => `${+(x * 100).toFixed(5)}%`;

export default function ChargesCalculator() {
  const [segment, setSegment] = useState<Segment>("delivery");
  const [buy, setBuy] = useState("1000");
  const [sell, setSell] = useState("1050");
  const [qty, setQty] = useState("100");
  const [brokerage, setBrokerage] = useState("0");
  const [dp, setDp] = useState("0");

  const seg = SEGMENTS.find(s => s.id === segment)!;
  const valid = +buy >= 0 && +sell >= 0 && +qty > 0 && +brokerage >= 0;
  const c = useMemo(() => (valid ? calculateCharges({
    segment, buyPrice: +buy, sellPrice: +sell, quantity: +qty, brokeragePerOrder: +brokerage, dpCharge: +dp,
  }) : null), [valid, segment, buy, sell, qty, brokerage, dp]);
  const rate = RATES[segment];

  return (
    <>
      <h1>Charges Calculator</h1>
      <p className="wt-lede">
        Taxes and fees on one round trip (one buy, one sell) on NSE, and what&apos;s left of your profit.
        Statutory rates are as of {RATES_AS_OF}, including the higher F&amp;O STT from 1 April 2026.
        Brokerage depends on your broker, so enter your own.
      </p>

      <div className="wt-chips" style={{ marginBottom: 14 }}>
        {SEGMENTS.map(s => (
          <button key={s.id} className="wt-chip" aria-pressed={segment === s.id} onClick={() => setSegment(s.id)}>{s.label}</button>
        ))}
      </div>

      <div className="wt-grid wt-grid-side">
        <section className="wt-card">
          <h2>Trade</h2>
          <div className="wt-fields">
            <F id="ch-b" label={`Buy ${seg.priceLabel} (₹)`} value={buy} set={setBuy} />
            <F id="ch-s" label={`Sell ${seg.priceLabel} (₹)`} value={sell} set={setSell} />
            <F id="ch-q" label={seg.qtyLabel} value={qty} set={setQty} />
            <F id="ch-br" label="Brokerage per order (₹)" value={brokerage} set={setBrokerage} />
            {segment === "delivery" && <F id="ch-dp" label="DP charge on sell (₹)" value={dp} set={setDp} />}
          </div>
          <p className="wt-hint" style={{ marginTop: 10 }}>
            Many discount brokers charge ₹0 for delivery and up to ₹20 per executed order elsewhere; check yours.
            {segment === "delivery" && " The DP charge is levied per stock per day you sell, by your depository and broker."}
          </p>
        </section>

        <section className="wt-card" aria-live="polite">
          <h2>Breakdown</h2>
          {!c ? <div className="wt-banner wt-banner-warn">Enter non-negative prices and a quantity above zero.</div> : (
            <>
              <div className="wt-stats">
                <Stat label="Gross P&L" value={rupees(c.grossPnl)} cls={tone(c.grossPnl)} />
                <Stat label="Total charges" value={rupees(c.total)} />
                <Stat label="Net P&L" value={rupees(c.netPnl)} cls={tone(c.netPnl)} />
                <Stat label={`Breakeven move / unit`} value={rupees(c.breakevenMove)} tip="How far the price has to move in your favour just to cover these charges." />
              </div>
              <div className="wt-table-wrap" style={{ marginTop: 14 }}>
                <table className="wt-table">
                  <thead><tr><th>Charge</th><th>Rate</th><th>Amount</th></tr></thead>
                  <tbody>
                    <Row k="Turnover" r="buy + sell value" v={c.turnover} />
                    <Row k="Brokerage" r={`₹${num(+brokerage)} × orders`} v={c.brokerage} />
                    <Row k="STT" r={rate.sttBuy ? `${pct(rate.sttBuy)} buy + ${pct(rate.sttSell)} sell` : `${pct(rate.sttSell)} on sell${segment === "options" ? " premium" : ""}`} v={c.stt}
                      tip="Securities Transaction Tax, collected by the exchange for the government and rounded to the nearest rupee." />
                    <Row k="Exchange transaction" r={`${pct(rate.exchange)} of turnover`} v={c.exchange} />
                    <Row k="SEBI turnover fee" r="₹10 per crore" v={c.sebi} />
                    <Row k="Stamp duty" r={`${pct(rate.stampBuy)} on buy`} v={c.stamp} />
                    <Row k="GST" r="18% on brokerage + exchange + SEBI" v={c.gst} />
                    {segment === "delivery" && <Row k="DP charge" r="per scrip on sell" v={c.dp} />}
                    <tr><td style={{ fontWeight: 800 }}>Total</td><td /><td style={{ fontWeight: 800 }}>{rupees(c.total)}</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="wt-hint" style={{ marginTop: 10 }}>
                Brokers may round some charges differently on the contract note, so expect differences of a few paise.
                NSE&apos;s IPFT levy (₹0.01 per crore) is too small to show. Income tax on gains isn&apos;t included.
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function F({ id, label, value, set }: { id: string; label: string; value: string; set: (v: string) => void }) {
  return (
    <div className="wt-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="wt-input" inputMode="decimal" value={value} onChange={e => set(e.target.value)} />
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

function Row({ k, r, v, tip }: { k: string; r: string; v: number; tip?: string }) {
  return (
    <tr>
      <td><span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>{k}{tip && <Tip text={tip} />}</span></td>
      <td className="wt-muted">{r}</td>
      <td>{rupees(v)}</td>
    </tr>
  );
}
