/**
 * Technical indicators computed from real daily OHLC history.
 * Pure and dependency-free (unit tested in tests/).
 */
export interface Bar { high: number; low: number; close: number }
export interface Technicals {
  sma20: number | null; sma50: number | null; sma200: number | null;
  rsi: number | null; atr: number | null; macd: number | null;
  support: number | null; resistance: number | null;
  weekHigh52: number | null; weekLow52: number | null;
  sessions: number;
}

const round = (n: number) => Math.round(n * 100) / 100;
const sma = (xs: number[], n: number) => (xs.length >= n ? round(xs.slice(-n).reduce((a, b) => a + b, 0) / n) : null);

function ema(xs: number[], n: number): number[] {
  const k = 2 / (n + 1);
  const out: number[] = [];
  xs.forEach((x, i) => out.push(i === 0 ? x : x * k + out[i - 1] * (1 - k)));
  return out;
}

/** Wilder's RSI(14). */
function rsi(closes: number[], n = 14): number | null {
  if (closes.length <= n) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgG = gain / n, avgL = loss / n;
  for (let i = n + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgG = (avgG * (n - 1) + Math.max(d, 0)) / n;
    avgL = (avgL * (n - 1) + Math.max(-d, 0)) / n;
  }
  if (avgL === 0) return 100;
  return round(100 - 100 / (1 + avgG / avgL));
}

/** Wilder's ATR(14). */
function atr(bars: Bar[], n = 14): number | null {
  if (bars.length <= n) return null;
  const tr = bars.slice(1).map((b, i) => Math.max(b.high - b.low, Math.abs(b.high - bars[i].close), Math.abs(b.low - bars[i].close)));
  let a = tr.slice(0, n).reduce((x, y) => x + y, 0) / n;
  for (let i = n; i < tr.length; i++) a = (a * (n - 1) + tr[i]) / n;
  return round(a);
}

/** Bars must be oldest-first, one per trading session, with no gaps filled in. */
export function computeTechnicals(bars: Bar[]): Technicals {
  const clean = bars.filter(b => [b.high, b.low, b.close].every(v => Number.isFinite(v) && v > 0));
  const closes = clean.map(b => b.close);
  const last252 = clean.slice(-252);
  const last20 = clean.slice(-20);
  const macd = closes.length >= 26 ? round(ema(closes, 12).at(-1)! - ema(closes, 26).at(-1)!) : null;
  return {
    sma20: sma(closes, 20), sma50: sma(closes, 50), sma200: sma(closes, 200),
    rsi: rsi(closes), atr: atr(clean), macd,
    support: last20.length ? round(Math.min(...last20.map(b => b.low))) : null,
    resistance: last20.length ? round(Math.max(...last20.map(b => b.high))) : null,
    weekHigh52: last252.length ? round(Math.max(...last252.map(b => b.high))) : null,
    weekLow52: last252.length ? round(Math.min(...last252.map(b => b.low))) : null,
    sessions: clean.length,
  };
}
