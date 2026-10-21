/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — OPTIONS MATHS (pure, no data feed)

   Black-Scholes(-Merton) prices and Greeks for European options
   (NSE index and stock options are European), implied volatility,
   multi-leg payoff analysis, PCR and max pain.

   Conventions:
     • T in years, r and q as decimals (0.065 = 6.5%), sigma decimal.
     • theta is per calendar day, vega and rho per 1 percentage point.
     • Payoffs are in rupees for the whole position (lots × lot size).
   Verified against Hull, "Options, Futures and Other Derivatives",
   in tests/options.test.mjs.
   ═══════════════════════════════════════════════════════════════ */

export type OptionType = "CE" | "PE";
export type Side = "BUY" | "SELL";

/** Standard normal CDF (West 2005, double-precision Hart algorithm). */
export function normCdf(x: number): number {
  const z = Math.abs(x);
  let c: number;
  if (z > 37) {
    c = 0;
  } else {
    const e = Math.exp(-z * z / 2);
    if (z < 7.07106781186547) {
      let n = 3.52624965998911e-2 * z + 0.700383064443688;
      n = n * z + 6.37396220353165;
      n = n * z + 33.912866078383;
      n = n * z + 112.079291497871;
      n = n * z + 221.213596169931;
      n = n * z + 220.206867912376;
      let d = 8.83883476483184e-2 * z + 1.75566716318264;
      d = d * z + 16.064177579207;
      d = d * z + 86.7807322029461;
      d = d * z + 296.564248779674;
      d = d * z + 637.333633378831;
      d = d * z + 793.826512519948;
      d = d * z + 440.413735824752;
      c = e * n / d;
    } else {
      let f = z + 0.65;
      f = z + 4 / f;
      f = z + 3 / f;
      f = z + 2 / f;
      f = z + 1 / f;
      c = e / f / 2.506628274631;
    }
  }
  return x <= 0 ? c : 1 - c;
}

export function normPdf(x: number): number {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

export interface BsInput {
  type: OptionType;
  S: number;      // spot / underlying
  K: number;      // strike
  T: number;      // years to expiry
  r: number;      // risk-free rate, continuous, decimal
  sigma: number;  // volatility, decimal
  q?: number;     // dividend yield, decimal
}

export interface Greeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // per calendar day
  vega: number;  // per 1 vol point
  rho: number;   // per 1 rate point
}

/** Value at expiry (T = 0) or with no volatility: intrinsic, discounted forward. */
function degenerate({ type, S, K, T, r, q = 0 }: BsInput): Greeks {
  const fwd = S * Math.exp(-q * T);
  const pvK = K * Math.exp(-r * T);
  const itm = type === "CE" ? fwd > pvK : pvK > fwd;
  const price = Math.max(0, type === "CE" ? fwd - pvK : pvK - fwd);
  const delta = itm ? (type === "CE" ? Math.exp(-q * T) : -Math.exp(-q * T)) : 0;
  return { price, delta, gamma: 0, theta: 0, vega: 0, rho: 0 };
}

export function blackScholes(input: BsInput): Greeks {
  const { type, S, K, T, r, sigma, q = 0 } = input;
  if (!(S > 0) || !(K > 0)) throw new Error("Spot and strike must be positive");
  if (T <= 0 || sigma <= 0) return degenerate(input);

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + sigma * sigma / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const dq = Math.exp(-q * T);
  const dr = Math.exp(-r * T);
  const pdf = normPdf(d1);

  let price: number, delta: number, thetaYr: number, rho: number;
  if (type === "CE") {
    price = S * dq * normCdf(d1) - K * dr * normCdf(d2);
    delta = dq * normCdf(d1);
    thetaYr = -S * dq * pdf * sigma / (2 * sqrtT) - r * K * dr * normCdf(d2) + q * S * dq * normCdf(d1);
    rho = K * T * dr * normCdf(d2);
  } else {
    price = K * dr * normCdf(-d2) - S * dq * normCdf(-d1);
    delta = -dq * normCdf(-d1);
    thetaYr = -S * dq * pdf * sigma / (2 * sqrtT) + r * K * dr * normCdf(-d2) - q * S * dq * normCdf(-d1);
    rho = -K * T * dr * normCdf(-d2);
  }
  return {
    price,
    delta,
    gamma: dq * pdf / (S * sigma * sqrtT),
    theta: thetaYr / 365,
    vega: S * dq * pdf * sqrtT / 100,
    rho: rho / 100,
  };
}

/**
 * Implied volatility from a market premium. Returns null when the premium
 * is outside the no-arbitrage range (below intrinsic or above the bound).
 */
export function impliedVol(premium: number, input: Omit<BsInput, "sigma">): number | null {
  const { type, S, K, T, r, q = 0 } = input;
  if (!(premium > 0) || T <= 0) return null;
  const lower = degenerate({ ...input, sigma: 0 }).price;
  const upper = type === "CE" ? S * Math.exp(-q * T) : K * Math.exp(-r * T);
  if (premium < lower - 1e-9 || premium >= upper) return null;

  let lo = 1e-4, hi = 5; // 0.01% to 500%
  if (blackScholes({ ...input, sigma: hi }).price < premium) return null;
  let sigma = 0.3;
  for (let i = 0; i < 100; i++) {
    const g = blackScholes({ type, S, K, T, r, q, sigma });
    const diff = g.price - premium;
    if (Math.abs(diff) < 1e-7) return sigma;
    if (diff > 0) hi = sigma; else lo = sigma;
    const vegaRaw = g.vega * 100;
    const next = vegaRaw > 1e-8 ? sigma - diff / vegaRaw : NaN;
    sigma = next > lo && next < hi ? next : (lo + hi) / 2; // Newton, falling back to bisection
  }
  return sigma;
}

/* ─── Multi-leg strategies ───────────────────────────────────── */

export interface Leg {
  kind: OptionType | "FUT";
  side: Side;
  strike: number;   // for FUT: the entry price
  premium: number;  // per unit, entry price paid / received (0 for FUT)
  lots: number;
  lotSize: number;
  iv?: number;      // decimal; used for before-expiry values
}

const qty = (l: Leg) => l.lots * l.lotSize * (l.side === "BUY" ? 1 : -1);

/** Rupee P&L of one leg if the underlying settles at S on expiry. */
export function legPayoff(l: Leg, S: number): number {
  if (l.kind === "FUT") return qty(l) * (S - l.strike);
  const intrinsic = l.kind === "CE" ? Math.max(0, S - l.strike) : Math.max(0, l.strike - S);
  return qty(l) * (intrinsic - l.premium);
}

export function payoffAtExpiry(legs: Leg[], S: number): number {
  return legs.reduce((sum, l) => sum + legPayoff(l, S), 0);
}

/** Rupee P&L before expiry, valuing option legs with Black-Scholes. */
export function payoffBeforeExpiry(
  legs: Leg[], S: number, daysLeft: number, r: number, ivShift = 0,
): number {
  const T = Math.max(0, daysLeft) / 365;
  return legs.reduce((sum, l) => {
    if (l.kind === "FUT") return sum + qty(l) * (S - l.strike);
    const sigma = Math.max(0.0001, (l.iv ?? 0) + ivShift);
    const value = blackScholes({ type: l.kind, S, K: l.strike, T, r, sigma }).price;
    return sum + qty(l) * (value - l.premium);
  }, 0);
}

export interface StrategyStats {
  netPremium: number;          // + = credit received, − = debit paid (rupees)
  maxProfit: number | null;    // null = unlimited
  maxLoss: number | null;      // null = unlimited (as a negative number otherwise)
  breakevens: number[];
  greeks: { delta: number; gamma: number; theta: number; vega: number } | null;
}

/**
 * Payoff at expiry is piecewise linear with kinks only at strikes, so the
 * exact max/min sit at S = 0, at a strike, or run off to infinity.
 */
export function analyseStrategy(legs: Leg[], opts?: { spot?: number; daysLeft?: number; r?: number }): StrategyStats {
  if (legs.length === 0) return { netPremium: 0, maxProfit: 0, maxLoss: 0, breakevens: [], greeks: null };

  const netPremium = legs.reduce((s, l) => s + (l.kind === "FUT" ? 0 : -qty(l) * l.premium), 0);
  const points = [...new Set([0, ...legs.map(l => l.strike)])].sort((a, b) => a - b);
  const values = points.map(S => payoffAtExpiry(legs, S));

  // Slope beyond the highest strike: + for every net long call / long future unit.
  const top = points[points.length - 1];
  const slopeUp = payoffAtExpiry(legs, top + 1) - payoffAtExpiry(legs, top);
  const EPS = 1e-6;

  const finiteMax = Math.max(...values);
  const finiteMin = Math.min(...values);
  const maxProfit = slopeUp > EPS ? null : finiteMax;
  const maxLoss = slopeUp < -EPS ? null : finiteMin;

  // Breakevens: sign changes between consecutive kink points, then beyond the top.
  const breakevens: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]];
    const [va, vb] = [values[i], values[i + 1]];
    if (Math.abs(va) < EPS && i > 0) continue; // counted as previous segment's end
    if (Math.abs(vb) < EPS) { breakevens.push(b); continue; }
    if (va * vb < 0) breakevens.push(a + (b - a) * (-va) / (vb - va));
  }
  const vTop = values[values.length - 1];
  if (Math.abs(slopeUp) > EPS && vTop * slopeUp < 0) breakevens.push(top - vTop / slopeUp);

  let greeks: StrategyStats["greeks"] = null;
  const { spot, daysLeft, r = 0.065 } = opts ?? {};
  if (spot && spot > 0 && daysLeft !== undefined && legs.every(l => l.kind === "FUT" || (l.iv ?? 0) > 0)) {
    greeks = { delta: 0, gamma: 0, theta: 0, vega: 0 };
    const T = Math.max(0, daysLeft) / 365;
    for (const l of legs) {
      if (l.kind === "FUT") { greeks.delta += qty(l); continue; }
      const g = blackScholes({ type: l.kind, S: spot, K: l.strike, T, r, sigma: l.iv! });
      greeks.delta += qty(l) * g.delta;
      greeks.gamma += qty(l) * g.gamma;
      greeks.theta += qty(l) * g.theta;
      greeks.vega += qty(l) * g.vega;
    }
  }

  return {
    netPremium,
    maxProfit,
    maxLoss,
    breakevens: breakevens.map(b => Math.round(b * 100) / 100),
    greeks,
  };
}

/* ─── Option-chain analytics ─────────────────────────────────── */

export interface ChainRow {
  strike: number;
  callOi: number;
  putOi: number;
}

/** Put/call ratio by open interest. Null when there is no call OI. */
export function pcr(rows: ChainRow[]): number | null {
  const calls = rows.reduce((s, r) => s + r.callOi, 0);
  const puts = rows.reduce((s, r) => s + r.putOi, 0);
  return calls > 0 ? puts / calls : null;
}

/**
 * Max pain: the expiry price at which option writers pay out least, i.e.
 * the strike X minimising Σ callOI(K)·max(0, X−K) + putOI(K)·max(0, K−X).
 */
export function maxPain(rows: ChainRow[]): number | null {
  if (rows.length === 0) return null;
  let best: number | null = null;
  let bestPain = Infinity;
  for (const { strike: X } of rows) {
    let pain = 0;
    for (const r of rows) {
      pain += r.callOi * Math.max(0, X - r.strike) + r.putOi * Math.max(0, r.strike - X);
    }
    if (pain < bestPain) { bestPain = pain; best = X; }
  }
  return best;
}

/** Days from now to an expiry date (YYYY-MM-DD), counting to 15:30 IST on expiry day. */
export function daysToExpiry(expiry: string, now = new Date()): number {
  const end = new Date(`${expiry}T15:30:00+05:30`).getTime();
  return Math.max(0, (end - now.getTime()) / 86_400_000);
}
