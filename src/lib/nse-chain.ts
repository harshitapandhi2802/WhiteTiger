/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — NSE OPTION CHAIN PARSER (pure)

   Turns NSE's website option-chain response
   (GET https://www.nseindia.com/api/option-chain-v3) into White Tiger's
   chain shape and derives PCR, max pain and ATM IV from it.

   NSE publishes LTP, OI, change in OI, volume, IV and best bid/ask but
   no Greeks. Delta, gamma, theta and vega here are CALCULATED by White
   Tiger with Black-Scholes from NSE's IV (labelled so in the UI).
   A field NSE doesn't send stays null — nothing is estimated.
   ═══════════════════════════════════════════════════════════════ */

import { pcr, maxPain, blackScholes } from "./options.ts";

/** NSE index option underlyings (type=Indices). F&O stocks use type=Equity. */
export const NSE_INDICES: Record<string, { label: string }> = {
  NIFTY: { label: "NIFTY 50" },
  BANKNIFTY: { label: "NIFTY BANK" },
  FINNIFTY: { label: "NIFTY FIN SERVICE" },
  MIDCPNIFTY: { label: "NIFTY MIDCAP SELECT" },
  NIFTYNXT50: { label: "NIFTY NEXT 50" },
};

export const NSE_SYMBOL_RE = /^[A-Z0-9&-]{1,20}$/;

export interface OptionSide {
  ltp: number | null;
  change: number | null;
  oi: number | null;          // contracts, as NSE reports
  oiChange: number | null;
  volume: number | null;      // contracts traded today
  bid: number | null;
  ask: number | null;
  iv: number | null;          // percent, from NSE
  delta: number | null;       // calculated
  gamma: number | null;       // calculated
  theta: number | null;       // calculated, ₹ per day per unit
  vega: number | null;        // calculated, ₹ per 1 IV point per unit
}

export interface ChainStrike {
  strike: number;
  call: OptionSide | null;
  put: OptionSide | null;
}

export interface ParsedChain {
  spot: number | null;
  expiry: string | null;      // YYYY-MM-DD
  dataTime: string | null;    // NSE's own timestamp, e.g. "21-Oct-2026 15:40:00" (IST)
  rows: ChainStrike[];
  pcr: number | null;
  maxPain: number | null;
  atmStrike: number | null;
  atmIv: number | null;       // average of ATM call and put IV, percent
  totalCallOi: number;
  totalPutOi: number;
}

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/** "27-Oct-2026" → "2026-10-27"; null if not that format. */
export function nseDateToIso(d: unknown): string | null {
  if (typeof d !== "string") return null;
  const m = d.match(/^(\d{2})-([A-Z][a-z]{2})-(\d{4})$/);
  return m && MONTHS[m[2]] ? `${m[3]}-${MONTHS[m[2]]}-${m[1]}` : null;
}

/** "2026-10-27" → "27-Oct-2026" (the format NSE's API expects). */
export function isoToNseDate(iso: string): string | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const mon = Object.entries(MONTHS).find(([, v]) => v === m[2])?.[0];
  return mon ? `${m[3]}-${mon}-${m[1]}` : null;
}

/** Upcoming expiries from NSE's option-chain-contract-info response, as ISO dates. */
export function parseNseExpiries(json: unknown): string[] {
  const list = (json as { expiryDates?: unknown })?.expiryDates;
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(nseDateToIso).filter((d): d is string => !!d))].sort();
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const pos = (v: unknown): number | null => { const n = num(v); return n !== null && n > 0 ? n : null; };

interface GreekCtx { spot: number | null; T: number; r: number }

function side(raw: Record<string, unknown> | undefined, type: "CE" | "PE", strike: number, ctx: GreekCtx): OptionSide | null {
  if (!raw || typeof raw !== "object") return null;
  const iv = pos(raw.impliedVolatility);
  let g: { delta: number; gamma: number; theta: number; vega: number } | null = null;
  if (iv !== null && ctx.spot && ctx.T > 0) {
    g = blackScholes({ type, S: ctx.spot, K: strike, T: ctx.T, r: ctx.r, sigma: iv / 100 });
  }
  return {
    ltp: pos(raw.lastPrice),
    change: num(raw.change),
    oi: num(raw.openInterest),
    oiChange: num(raw.changeinOpenInterest),
    volume: num(raw.totalTradedVolume),
    bid: pos(raw.buyPrice1),
    ask: pos(raw.sellPrice1),
    iv,
    delta: g?.delta ?? null,
    gamma: g?.gamma ?? null,
    theta: g?.theta ?? null,
    vega: g?.vega ?? null,
  };
}

/**
 * Parse one expiry of NSE's option-chain-v3 response.
 * `now` and `r` are used only for the calculated Greeks.
 */
export function parseNseChain(json: unknown, opts: { now?: Date; r?: number } = {}): ParsedChain {
  const records = (json as { records?: Record<string, unknown> })?.records ?? {};
  const items = Array.isArray(records.data) ? (records.data as Record<string, unknown>[]) : [];
  const spot = pos(records.underlyingValue);
  const dataTime = typeof records.timestamp === "string" ? records.timestamp : null;

  let expiry: string | null = null;
  for (const it of items) { expiry = nseDateToIso(it.expiryDates); if (expiry) break; }

  const now = opts.now ?? new Date();
  const T = expiry ? Math.max(0, new Date(`${expiry}T15:30:00+05:30`).getTime() - now.getTime()) / (365 * 86_400_000) : 0;
  const ctx: GreekCtx = { spot, T, r: opts.r ?? 0.065 };

  const rows: ChainStrike[] = [];
  for (const it of items) {
    const strike = pos(it.strikePrice);
    if (strike === null) continue;
    rows.push({
      strike,
      call: side(it.CE as Record<string, unknown>, "CE", strike, ctx),
      put: side(it.PE as Record<string, unknown>, "PE", strike, ctx),
    });
  }
  rows.sort((a, b) => a.strike - b.strike);

  const oiRows = rows.map(r => ({ strike: r.strike, callOi: r.call?.oi ?? 0, putOi: r.put?.oi ?? 0 }));
  const totalCallOi = oiRows.reduce((s, r) => s + r.callOi, 0);
  const totalPutOi = oiRows.reduce((s, r) => s + r.putOi, 0);

  let atmStrike: number | null = null;
  if (spot !== null && rows.length) {
    atmStrike = rows.reduce((best, r) => (Math.abs(r.strike - spot) < Math.abs(best - spot) ? r.strike : best), rows[0].strike);
  }
  const atm = rows.find(r => r.strike === atmStrike);
  const ivs = [atm?.call?.iv, atm?.put?.iv].filter((v): v is number => typeof v === "number");

  return {
    spot, expiry, dataTime, rows,
    pcr: totalCallOi > 0 ? pcr(oiRows) : null,
    maxPain: totalCallOi + totalPutOi > 0 ? maxPain(oiRows) : null,
    atmStrike,
    atmIv: ivs.length ? ivs.reduce((a, b) => a + b, 0) / ivs.length : null,
    totalCallOi, totalPutOi,
  };
}

/** NSE's "21-Oct-2026 15:40:00" (IST) → epoch ms, or null. */
export function nseTimestampMs(ts: string | null): number | null {
  if (!ts) return null;
  const m = ts.match(/^(\d{2}-[A-Z][a-z]{2}-\d{4}) (\d{2}:\d{2}:\d{2})$/);
  const iso = m ? nseDateToIso(m[1]) : null;
  if (!iso) return null;
  const t = new Date(`${iso}T${m![2]}+05:30`).getTime();
  return Number.isFinite(t) ? t : null;
}
