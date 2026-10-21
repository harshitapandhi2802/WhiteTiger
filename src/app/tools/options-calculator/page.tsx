"use client";
import { useMemo, useState } from "react";
import { blackScholes, impliedVol, type OptionType } from "@/lib/options";
import { Tip, num, rupees } from "@/components/tools/ToolsShell";

/* Black-Scholes calculator: price + Greeks, or implied volatility from a premium. */

const EXPLAIN = {
  delta: "How much the option price moves for a ₹1 move in the underlying. Also a rough guide to the chance of finishing in the money.",
  gamma: "How much delta changes for a ₹1 move in the underlying. Highest for at-the-money options near expiry.",
  theta: "Value the option loses per calendar day if nothing else changes (time decay).",
  vega: "Change in option price for a 1-point change in implied volatility (e.g. 14% → 15%).",
  rho: "Change in option price for a 1-point change in interest rates. Usually small for short-dated options.",
};

export default function OptionsCalculator() {
  const [mode, setMode] = useState<"price" | "iv">("price");
  const [type, setType] = useState<OptionType>("CE");
  const [spot, setSpot] = useState("23150");
  const [strike, setStrike] = useState("23200");
  const [days, setDays] = useState("7");
  const [vol, setVol] = useState("14");
  const [rate, setRate] = useState("6.5");
  const [div, setDiv] = useState("0");
  const [premium, setPremium] = useState("120");

  const result = useMemo(() => {
    const S = +spot, K = +strike, T = +days / 365, r = +rate / 100, q = +div / 100;
    if (!(S > 0) || !(K > 0) || !(+days >= 0)) return { error: "Enter a positive spot, strike and days to expiry." };
    if (mode === "iv") {
      const iv = impliedVol(+premium, { type, S, K, T, r, q });
      if (iv === null) return { error: "No volatility gives that premium: it is below intrinsic value or above the theoretical maximum, or expiry has passed." };
      return { iv, g: blackScholes({ type, S, K, T, r, q, sigma: iv }) };
    }
    if (!(+vol > 0)) return { error: "Enter a volatility above 0%." };
    return { g: blackScholes({ type, S, K, T, r, q, sigma: +vol / 100 }) };
  }, [mode, type, spot, strike, days, vol, rate, div, premium]);

  const intrinsic = Math.max(0, type === "CE" ? +spot - +strike : +strike - +spot);

  return (
    <>
      <h1>Options Calculator</h1>
      <p className="wt-lede">
        Theoretical value and Greeks of a European option (NSE index and stock options are European) using
        the Black-Scholes model, or the implied volatility behind a premium you see in the market.
      </p>

      <div className="wt-grid wt-grid-side">
        <section className="wt-card">
          <div className="wt-chips" style={{ marginBottom: 14 }}>
            <button className="wt-chip" aria-pressed={mode === "price"} onClick={() => setMode("price")}>Price &amp; Greeks</button>
            <button className="wt-chip" aria-pressed={mode === "iv"} onClick={() => setMode("iv")}>Implied volatility</button>
          </div>
          <div className="wt-fields">
            <div className="wt-field">
              <label htmlFor="oc-type">Option</label>
              <select id="oc-type" className="wt-select" value={type} onChange={e => setType(e.target.value as OptionType)}>
                <option value="CE">Call (CE)</option>
                <option value="PE">Put (PE)</option>
              </select>
            </div>
            <Field id="oc-days" label="Days to expiry" value={days} set={setDays} />
            <Field id="oc-spot" label="Underlying price (₹)" value={spot} set={setSpot} />
            <Field id="oc-strike" label="Strike (₹)" value={strike} set={setStrike} />
            {mode === "price"
              ? <Field id="oc-vol" label="Volatility (% a year)" value={vol} set={setVol} />
              : <Field id="oc-prem" label="Market premium (₹)" value={premium} set={setPremium} />}
            <Field id="oc-rate" label="Interest rate (%)" value={rate} set={setRate} />
            <Field id="oc-div" label="Dividend yield (%)" value={div} set={setDiv} />
          </div>
          <p className="wt-hint" style={{ marginTop: 12 }}>
            The rate is an input, not a live figure: 6.5% is close to recent short-term Indian rates.
            Index option volatility is usually read from India VIX or the option chain.
          </p>
        </section>

        <section className="wt-card" aria-live="polite">
          <h2>Result</h2>
          {"error" in result ? (
            <div className="wt-banner wt-banner-warn">{result.error}</div>
          ) : (
            <>
              <div className="wt-stats">
                {mode === "iv" && result.iv !== undefined && (
                  <Stat label="Implied volatility" value={`${num(result.iv * 100)}%`} />
                )}
                <Stat label={mode === "iv" ? "Model price at that IV" : "Theoretical price"} value={rupees(result.g.price)} />
                <Stat label="Intrinsic value" value={rupees(intrinsic)} />
                <Stat label="Time value" value={rupees(Math.max(0, result.g.price - intrinsic))} />
              </div>
              <h3>Greeks (per unit)</h3>
              <div className="wt-stats">
                <Stat label="Delta" tip={EXPLAIN.delta} value={num(result.g.delta, 4)} />
                <Stat label="Gamma" tip={EXPLAIN.gamma} value={num(result.g.gamma, 6)} />
                <Stat label="Theta / day" tip={EXPLAIN.theta} value={rupees(result.g.theta)} />
                <Stat label="Vega / 1 pt" tip={EXPLAIN.vega} value={rupees(result.g.vega)} />
                <Stat label="Rho / 1 pt" tip={EXPLAIN.rho} value={rupees(result.g.rho)} />
              </div>
              <p className="wt-hint" style={{ marginTop: 14 }}>
                The model assumes constant volatility and rates and no early exercise. Real premiums also reflect
                demand, liquidity and volatility skew, so market prices can differ from the theoretical value.
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function Field({ id, label, value, set }: { id: string; label: string; value: string; set: (v: string) => void }) {
  return (
    <div className="wt-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="wt-input" inputMode="decimal" value={value} onChange={e => set(e.target.value)} />
    </div>
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
