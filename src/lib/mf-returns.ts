/**
 * Mutual fund return and risk calculations on a single scheme code's NAV series.
 * Pure and dependency-free (unit tested in tests/mf-returns.test.mjs).
 *
 * Conventions
 * - Dates are ISO "YYYY-MM-DD" (calendar dates; no time zone involved).
 * - Trailing return start NAV: NAV on the start date, else the closest earlier NAV
 *   within MAX_LOOKBACK_DAYS (holidays/weekends). Otherwise: insufficient history.
 * - Periods under one year are absolute returns; one year or longer are CAGR on actual
 *   days elapsed: (end/start)^(365/days) - 1.
 * - Purchases (SIP instalments, lump sums) execute at the NAV on or after the purchase
 *   date. Stamp duty of 0.005% applies to purchases from 2020-07-01 (Indian Stamp Act).
 *   Exit loads and taxes are not modelled.
 * - IDCW options: NAV falls when income is distributed, so NAV-based returns understate
 *   total return. Callers must label them and never compare them with Growth options.
 * - Nothing here fills gaps or invents values: missing inputs produce null with a reason.
 */
export interface NavPoint { date: string; nav: number }
export interface Flow { date: string; amount: number }

export const MAX_LOOKBACK_DAYS = 7;
const STAMP_DUTY_FROM = "2020-07-01";
const STAMP_DUTY_RATE = 0.00005;

// ── dates ─────────────────────────────────────────────────────────
const toUtc = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const daysBetween = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / 864e5);
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Calendar shift; month/year shifts clamp to month end (31-Mar minus 1 month = 28/29-Feb). */
export function shiftDate(d: string, { years = 0, months = 0, days = 0 }: { years?: number; months?: number; days?: number }): string {
  let y = +d.slice(0, 4), m = +d.slice(5, 7) - 1 + months + years * 12;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const day = Math.min(+d.slice(8, 10), lastDay);
  return iso(Date.UTC(y, m, day) + days * 864e5);
}

// ── series hygiene ────────────────────────────────────────────────
export interface SeriesIssues { dropped: number; duplicateDates: number; conflictingDuplicates: number; gaps: { from: string; to: string; days: number }[]; largeMoves: { date: string; changePct: number }[] }

/** mfapi.in history ({date:"dd-mm-yyyy", nav:"…"}, newest first) → ascending clean series. */
export function parseMfapiHistory(raw: { date: string; nav: string | number }[]): { series: NavPoint[]; issues: SeriesIssues } {
  const pts: NavPoint[] = [];
  let dropped = 0;
  for (const r of raw ?? []) {
    const m = String(r.date).match(/^(\d{2})-(\d{2})-(\d{4})$/);
    const nav = typeof r.nav === "number" ? r.nav : parseFloat(String(r.nav));
    if (!m || !Number.isFinite(nav) || nav <= 0) { dropped++; continue; }
    pts.push({ date: `${m[3]}-${m[2]}-${m[1]}`, nav });
  }
  return cleanSeries(pts, dropped);
}

export function cleanSeries(points: NavPoint[], alreadyDropped = 0, gapDays = 10, moveThresholdPct = 20): { series: NavPoint[]; issues: SeriesIssues } {
  const sorted = [...points].filter(p => Number.isFinite(p.nav) && p.nav > 0 && /^\d{4}-\d{2}-\d{2}$/.test(p.date))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const dropped = alreadyDropped + (points.length - sorted.length);
  const series: NavPoint[] = [];
  let duplicateDates = 0, conflictingDuplicates = 0;
  for (const p of sorted) {
    const last = series[series.length - 1];
    if (last && last.date === p.date) { duplicateDates++; if (last.nav !== p.nav) conflictingDuplicates++; continue; }
    series.push(p);
  }
  const gaps: SeriesIssues["gaps"] = [], largeMoves: SeriesIssues["largeMoves"] = [];
  for (let i = 1; i < series.length; i++) {
    const d = daysBetween(series[i - 1].date, series[i].date);
    if (d > gapDays) gaps.push({ from: series[i - 1].date, to: series[i].date, days: d });
    const ch = (series[i].nav / series[i - 1].nav - 1) * 100;
    if (Math.abs(ch) > moveThresholdPct) largeMoves.push({ date: series[i].date, changePct: Math.round(ch * 100) / 100 });
  }
  return { series, issues: { dropped, duplicateDates, conflictingDuplicates, gaps, largeMoves } };
}

// ── lookups ───────────────────────────────────────────────────────
function lastIndexOnOrBefore(s: NavPoint[], d: string): number {
  let lo = 0, hi = s.length - 1, ans = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (s[mid].date <= d) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans;
}
export function navOnOrBefore(s: NavPoint[], d: string, maxDays = MAX_LOOKBACK_DAYS): NavPoint | null {
  const i = lastIndexOnOrBefore(s, d);
  return i >= 0 && daysBetween(s[i].date, d) <= maxDays ? s[i] : null;
}
export function navOnOrAfter(s: NavPoint[], d: string, maxDays = MAX_LOOKBACK_DAYS): NavPoint | null {
  const i = lastIndexOnOrBefore(s, d);
  const j = i >= 0 && s[i].date === d ? i : i + 1;
  return j < s.length && daysBetween(d, s[j].date) <= maxDays ? s[j] : null;
}

// ── point-to-point ────────────────────────────────────────────────
export interface PeriodReturn {
  label: string; startDate: string | null; endDate: string | null; startNav: number | null; endNav: number | null;
  absolutePct: number | null; annualizedPct: number | null; annualized: boolean; reason?: string;
}
const pct = (x: number) => Math.round(x * 1e6) / 1e4; // fraction → % with 4 dp

export function pointToPoint(start: NavPoint, end: NavPoint, label = ""): PeriodReturn {
  const days = daysBetween(start.date, end.date);
  const growth = end.nav / start.nav;
  const annualized = days >= 365;
  return { label, startDate: start.date, endDate: end.date, startNav: start.nav, endNav: end.nav,
    absolutePct: pct(growth - 1), annualizedPct: annualized ? pct(Math.pow(growth, 365 / days) - 1) : null, annualized };
}

export const STANDARD_PERIODS: { label: string; shift: { years?: number; months?: number; days?: number } }[] = [
  { label: "1W", shift: { days: -7 } }, { label: "1M", shift: { months: -1 } }, { label: "3M", shift: { months: -3 } },
  { label: "6M", shift: { months: -6 } }, { label: "1Y", shift: { years: -1 } }, { label: "3Y", shift: { years: -3 } },
  { label: "5Y", shift: { years: -5 } }, { label: "10Y", shift: { years: -10 } },
];

/** Trailing return ending at the latest NAV (not "today"). */
export function trailingReturn(s: NavPoint[], period: { label: string; shift: { years?: number; months?: number; days?: number } }): PeriodReturn {
  const empty = (reason: string): PeriodReturn => ({ label: period.label, startDate: null, endDate: s.at(-1)?.date ?? null, startNav: null, endNav: s.at(-1)?.nav ?? null, absolutePct: null, annualizedPct: null, annualized: false, reason });
  if (s.length < 2) return empty("Not enough NAV history");
  const end = s[s.length - 1];
  const target = shiftDate(end.date, period.shift);
  if (s[0].date > target) return empty(`History starts ${s[0].date}`);
  const start = navOnOrBefore(s, target);
  if (!start) return empty(`No NAV within ${MAX_LOOKBACK_DAYS} days before ${target}`);
  return pointToPoint(start, end, period.label);
}

/** From the first available NAV. Labelled since-inception only if the series starts within 7 days of the launch date. */
export function sinceFirstNav(s: NavPoint[], launchDate?: string | null): PeriodReturn & { isSinceInception: boolean } {
  if (s.length < 2) return { ...trailingReturn(s, { label: "SI", shift: {} }), isSinceInception: false };
  const r = pointToPoint(s[0], s[s.length - 1], "SI");
  const isSinceInception = !!launchDate && Math.abs(daysBetween(launchDate, s[0].date)) <= 7;
  return { ...r, isSinceInception };
}

// ── rolling returns ───────────────────────────────────────────────
export interface RollingStats { windowYears: number; count: number; min: number; max: number; mean: number; median: number; pctPositive: number; latest: number; firstEnd: string; lastEnd: string }

/** CAGR (or absolute for windows < 1y) for every month-end-ish observation date with a full window behind it. */
export function rollingReturns(s: NavPoint[], windowYears: number, stepDays = 1): RollingStats | null {
  if (s.length < 2) return null;
  const vals: { end: string; v: number }[] = [];
  let lastUsed = "";
  for (let i = 0; i < s.length; i++) {
    const end = s[i];
    if (lastUsed && daysBetween(lastUsed, end.date) < stepDays) continue;
    const target = shiftDate(end.date, { years: -windowYears });
    if (target < s[0].date) continue;
    const start = navOnOrBefore(s, target);
    if (!start) continue;
    const r = pointToPoint(start, end);
    const v = r.annualized ? r.annualizedPct! : r.absolutePct!;
    vals.push({ end: end.date, v }); lastUsed = end.date;
  }
  if (!vals.length) return null;
  const xs = vals.map(x => x.v).sort((a, b) => a - b);
  const mid = xs.length >> 1;
  const r2 = (x: number) => Math.round(x * 100) / 100;
  return { windowYears, count: xs.length, min: r2(xs[0]), max: r2(xs.at(-1)!), mean: r2(xs.reduce((a, b) => a + b, 0) / xs.length),
    median: r2(xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2), pctPositive: r2((100 * xs.filter(x => x > 0).length) / xs.length),
    latest: r2(vals.at(-1)!.v), firstEnd: vals[0].end, lastEnd: vals.at(-1)!.end };
}

// ── XIRR ──────────────────────────────────────────────────────────
/** Annualised internal rate of return for dated cash flows (Act/365). Negative = invest, positive = value received. */
export function xirr(flows: Flow[]): number | null {
  if (flows.length < 2 || !flows.some(f => f.amount < 0) || !flows.some(f => f.amount > 0)) return null;
  const t0 = flows[0].date;
  const ts = flows.map(f => daysBetween(t0, f.date) / 365);
  const npv = (r: number) => flows.reduce((s, f, i) => s + f.amount / Math.pow(1 + r, ts[i]), 0);
  const dnpv = (r: number) => flows.reduce((s, f, i) => s - (ts[i] * f.amount) / Math.pow(1 + r, ts[i] + 1), 0);
  let r = 0.1;
  for (let i = 0; i < 100; i++) {
    const f = npv(r), d = dnpv(r);
    if (!Number.isFinite(f) || !Number.isFinite(d) || d === 0) break;
    const next = r - f / d;
    if (next <= -0.999999 || !Number.isFinite(next)) break;
    if (Math.abs(next - r) < 1e-10) return next;
    r = next;
  }
  // Bisection fallback on a wide bracket.
  let lo = -0.9999, hi = 10, flo = npv(lo), fhi = npv(hi);
  if (!(flo * fhi < 0)) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2, fm = npv(mid);
    if (Math.abs(fm) < 1e-9 || hi - lo < 1e-12) return mid;
    if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

// ── SIP and lump sum ──────────────────────────────────────────────
const afterStampDuty = (amount: number, date: string) => (date >= STAMP_DUTY_FROM ? amount * (1 - STAMP_DUTY_RATE) : amount);

export interface InvestmentResult {
  invested: number; units: number; value: number; valueDate: string; valueNav: number;
  absolutePct: number; xirrPct: number | null; installments: { date: string; nav: number; amount: number; units: number }[];
  skipped: string[];
}

/** Monthly SIP on `dayOfMonth` from startDate until endDate (default: latest NAV). */
export function sip(s: NavPoint[], amount: number, startDate: string, opts: { endDate?: string; dayOfMonth?: number } = {}): InvestmentResult | null {
  if (!(amount > 0) || s.length < 2) return null;
  const end = opts.endDate ? navOnOrBefore(s, opts.endDate) : s[s.length - 1];
  if (!end) return null;
  const dom = opts.dayOfMonth ?? +startDate.slice(8, 10);
  const installments: InvestmentResult["installments"] = [], skipped: string[] = [];
  for (let k = 0; ; k++) {
    const base = shiftDate(startDate, { months: k });
    const y = +base.slice(0, 4), m = +base.slice(5, 7) - 1;
    const due = iso(Date.UTC(y, m, Math.min(dom, new Date(Date.UTC(y, m + 1, 0)).getUTCDate())));
    if (due > end.date) break;
    const exec = navOnOrAfter(s, due);
    if (!exec || exec.date > end.date) { skipped.push(due); continue; }
    installments.push({ date: exec.date, nav: exec.nav, amount, units: afterStampDuty(amount, exec.date) / exec.nav });
  }
  if (!installments.length) return null;
  const units = installments.reduce((a, b) => a + b.units, 0);
  const invested = amount * installments.length;
  const value = units * end.nav;
  const flows: Flow[] = [...installments.map(i => ({ date: i.date, amount: -i.amount })), { date: end.date, amount: value }];
  const r = xirr(flows);
  return { invested, units, value, valueDate: end.date, valueNav: end.nav, absolutePct: pct(value / invested - 1),
    xirrPct: r === null ? null : pct(r), installments, skipped };
}

export function lumpSum(s: NavPoint[], amount: number, startDate: string, endDate?: string): (InvestmentResult & { cagrPct: number | null }) | null {
  if (!(amount > 0) || s.length < 2) return null;
  const buy = navOnOrAfter(s, startDate);
  const end = endDate ? navOnOrBefore(s, endDate) : s[s.length - 1];
  if (!buy || !end || end.date <= buy.date) return null;
  const units = afterStampDuty(amount, buy.date) / buy.nav;
  const value = units * end.nav;
  const days = daysBetween(buy.date, end.date);
  return { invested: amount, units, value, valueDate: end.date, valueNav: end.nav, absolutePct: pct(value / amount - 1),
    cagrPct: days >= 365 ? pct(Math.pow(value / amount, 365 / days) - 1) : null,
    xirrPct: (() => { const r = xirr([{ date: buy.date, amount: -amount }, { date: end.date, amount: value }]); return r === null ? null : pct(r); })(),
    installments: [{ date: buy.date, nav: buy.nav, amount, units }], skipped: [] };
}

// ── risk ──────────────────────────────────────────────────────────
export interface RiskMetrics {
  windowStart: string; windowEnd: string; observations: number; periodsPerYear: number;
  annualizedReturnPct: number; volatilityPct: number; downsideDeviationPct: number;
  maxDrawdownPct: number; drawdownPeak: string; drawdownTrough: string; drawdownRecovered: string | null;
  riskFreePct: number | null; sharpe: number | null; sortino: number | null;
  beta: number | null; alphaPct: number | null; benchmarkNote: string;
}

/**
 * Risk statistics over the trailing `years` window using every NAV observation.
 * riskFreePct: annual risk-free return for the same window (null → Sharpe/Sortino null).
 * benchmark: same-window benchmark series (null → beta/alpha null; never estimated).
 */
export function riskMetrics(s: NavPoint[], years: number, riskFreePct: number | null, benchmark: NavPoint[] | null = null): RiskMetrics | { reason: string } {
  if (s.length < 30) return { reason: "Fewer than 30 NAV observations" };
  const end = s[s.length - 1];
  const target = shiftDate(end.date, { years: -years });
  if (s[0].date > target) return { reason: `History starts ${s[0].date}; ${years}-year window not available` };
  const startIdx = lastIndexOnOrBefore(s, target);
  if (startIdx < 0 || daysBetween(s[startIdx].date, target) > MAX_LOOKBACK_DAYS) return { reason: `No NAV near ${target}` };
  const w = s.slice(startIdx);
  const rets = w.slice(1).map((p, i) => p.nav / w[i].nav - 1);
  const elapsedYears = daysBetween(w[0].date, end.date) / 365;
  const ppy = rets.length / elapsedYears;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1));
  const vol = sd * Math.sqrt(ppy);
  const cagr = Math.pow(end.nav / w[0].nav, 1 / elapsedYears) - 1;
  const rfPeriodic = riskFreePct === null ? 0 : Math.pow(1 + riskFreePct / 100, 1 / ppy) - 1;
  const downside = Math.sqrt(rets.reduce((a, r) => a + Math.min(0, r - rfPeriodic) ** 2, 0) / rets.length) * Math.sqrt(ppy);

  let peak = w[0], mdd = 0, mddPeak = w[0].date, mddTrough = w[0].date;
  for (const p of w) {
    if (p.nav > peak.nav) peak = p;
    const dd = p.nav / peak.nav - 1;
    if (dd < mdd) { mdd = dd; mddPeak = peak.date; mddTrough = p.date; }
  }
  const peakNav = w.find(p => p.date === mddPeak)!.nav;
  const recovered = w.find(p => p.date > mddTrough && p.nav >= peakNav)?.date ?? null;

  let beta: number | null = null, alphaPct: number | null = null;
  if (benchmark && benchmark.length > 30) {
    const pairs: [number, number][] = [];
    for (let i = 1; i < w.length; i++) {
      const b0 = navOnOrBefore(benchmark, w[i - 1].date, 0), b1 = navOnOrBefore(benchmark, w[i].date, 0);
      if (b0 && b1) pairs.push([w[i].nav / w[i - 1].nav - 1, b1.nav / b0.nav - 1]);
    }
    if (pairs.length > 30) {
      const mf = pairs.reduce((a, p) => a + p[0], 0) / pairs.length, mb = pairs.reduce((a, p) => a + p[1], 0) / pairs.length;
      const cov = pairs.reduce((a, p) => a + (p[0] - mf) * (p[1] - mb), 0) / (pairs.length - 1);
      const varb = pairs.reduce((a, p) => a + (p[1] - mb) ** 2, 0) / (pairs.length - 1);
      beta = varb > 0 ? Math.round((cov / varb) * 1000) / 1000 : null;
      const bStart = navOnOrBefore(benchmark, w[0].date), bEnd = navOnOrBefore(benchmark, end.date);
      if (beta !== null && bStart && bEnd && riskFreePct !== null) {
        const bCagr = Math.pow(bEnd.nav / bStart.nav, 1 / elapsedYears) - 1, rf = riskFreePct / 100;
        alphaPct = pct(cagr - (rf + beta * (bCagr - rf)));
      }
    }
  }
  const r2 = (x: number) => Math.round(x * 100) / 100;
  return {
    windowStart: w[0].date, windowEnd: end.date, observations: rets.length, periodsPerYear: Math.round(ppy * 10) / 10,
    annualizedReturnPct: pct(cagr), volatilityPct: pct(vol), downsideDeviationPct: pct(downside),
    maxDrawdownPct: pct(mdd), drawdownPeak: mddPeak, drawdownTrough: mddTrough, drawdownRecovered: recovered,
    riskFreePct, sharpe: riskFreePct === null || vol === 0 ? null : r2((cagr - riskFreePct / 100) / vol),
    sortino: riskFreePct === null || downside === 0 ? null : r2((cagr - riskFreePct / 100) / downside),
    beta, alphaPct, benchmarkNote: benchmark ? "Computed against supplied benchmark series" : "No verified benchmark series available — beta/alpha not computed",
  };
}
