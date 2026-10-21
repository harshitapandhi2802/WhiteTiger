/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — UPSTOX OPTION CHAIN PARSER (pure)

   Turns the Upstox v2 Put/Call Option Chain response
   (GET https://api.upstox.com/v2/option/chain) into White Tiger's
   chain shape and derives PCR, max pain and ATM IV from it.
   Nothing here is estimated: a field Upstox doesn't send stays null.
   ═══════════════════════════════════════════════════════════════ */

import { pcr, maxPain } from "./options.ts";

export const UNDERLYINGS: Record<string, { key: string; label: string; step: number }> = {
  NIFTY: { key: "NSE_INDEX|Nifty 50", label: "NIFTY 50", step: 50 },
  BANKNIFTY: { key: "NSE_INDEX|Nifty Bank", label: "NIFTY BANK", step: 100 },
  FINNIFTY: { key: "NSE_INDEX|Nifty Fin Service", label: "NIFTY FIN SERVICE", step: 50 },
  MIDCPNIFTY: { key: "NSE_INDEX|NIFTY MID SELECT", label: "NIFTY MIDCAP SELECT", step: 25 },
  SENSEX: { key: "BSE_INDEX|SENSEX", label: "SENSEX", step: 100 },
};

export interface OptionSide {
  ltp: number | null;
  close: number | null;
  oi: number | null;
  prevOi: number | null;
  oiChange: number | null;
  volume: number | null;
  bid: number | null;
  ask: number | null;
  iv: number | null;    // percent, as Upstox reports it
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
}

export interface ChainStrike {
  strike: number;
  call: OptionSide | null;
  put: OptionSide | null;
}

export interface ParsedChain {
  spot: number | null;
  expiry: string | null;
  rows: ChainStrike[];
  pcr: number | null;
  maxPain: number | null;
  atmStrike: number | null;
  atmIv: number | null;     // average of ATM call and put IV, percent
  totalCallOi: number;
  totalPutOi: number;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

interface UpstoxSide {
  market_data?: Record<string, unknown>;
  option_greeks?: Record<string, unknown>;
}

function side(raw: UpstoxSide | undefined): OptionSide | null {
  if (!raw || !raw.market_data) return null;
  const m = raw.market_data;
  const g = raw.option_greeks ?? {};
  const oi = num(m.oi);
  const prevOi = num(m.prev_oi);
  return {
    ltp: num(m.ltp),
    close: num(m.close_price),
    oi,
    prevOi,
    oiChange: oi !== null && prevOi !== null ? oi - prevOi : null,
    volume: num(m.volume),
    bid: num(m.bid_price),
    ask: num(m.ask_price),
    iv: num(g.iv) && (g.iv as number) > 0 ? (g.iv as number) : null,
    delta: num(g.delta),
    gamma: num(g.gamma),
    theta: num(g.theta),
    vega: num(g.vega),
  };
}

export function parseUpstoxChain(json: unknown): ParsedChain {
  const data = (json as { data?: unknown })?.data;
  const items = Array.isArray(data) ? data : [];
  let spot: number | null = null;
  let expiry: string | null = null;

  const rows: ChainStrike[] = [];
  for (const it of items as Record<string, unknown>[]) {
    const strike = num(it.strike_price);
    if (strike === null) continue;
    spot ??= num(it.underlying_spot_price);
    expiry ??= typeof it.expiry === "string" ? it.expiry : null;
    rows.push({ strike, call: side(it.call_options as UpstoxSide), put: side(it.put_options as UpstoxSide) });
  }
  rows.sort((a, b) => a.strike - b.strike);

  const oiRows = rows.map(r => ({ strike: r.strike, callOi: r.call?.oi ?? 0, putOi: r.put?.oi ?? 0 }));
  const totalCallOi = oiRows.reduce((s, r) => s + r.callOi, 0);
  const totalPutOi = oiRows.reduce((s, r) => s + r.putOi, 0);

  let atmStrike: number | null = null;
  if (spot !== null && rows.length) {
    atmStrike = rows.reduce((best, r) => (Math.abs(r.strike - spot!) < Math.abs(best - spot!) ? r.strike : best), rows[0].strike);
  }
  const atm = rows.find(r => r.strike === atmStrike);
  const ivs = [atm?.call?.iv, atm?.put?.iv].filter((v): v is number => typeof v === "number");
  const atmIv = ivs.length ? ivs.reduce((a, b) => a + b, 0) / ivs.length : null;

  return {
    spot, expiry, rows,
    pcr: totalCallOi > 0 ? pcr(oiRows) : null,
    maxPain: totalCallOi + totalPutOi > 0 ? maxPain(oiRows) : null,
    atmStrike, atmIv, totalCallOi, totalPutOi,
  };
}

/** Unique, sorted expiry dates from the Upstox Option Contracts response. */
export function parseExpiries(json: unknown): string[] {
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  const set = new Set<string>();
  for (const c of data as Record<string, unknown>[]) {
    if (typeof c.expiry === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.expiry)) set.add(c.expiry);
  }
  return [...set].sort();
}

/** Lot size of the contracts for one expiry (Upstox sends lot_size per contract). */
export function parseLotSize(json: unknown, expiry: string): number | null {
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) return null;
  for (const c of data as Record<string, unknown>[]) {
    if (c.expiry === expiry && typeof c.lot_size === "number" && c.lot_size > 0) return c.lot_size;
  }
  return null;
}
