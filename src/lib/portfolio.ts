/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — PAPER PORTFOLIO MATHS (pure)

   Positions from a list of paper trades using weighted-average cost
   (the method Indian brokers show for holdings), plus exposure and
   concentration measures. No orders are ever placed.
   ═══════════════════════════════════════════════════════════════ */

export interface PaperTrade {
  symbol: string;   // quote key (NSE symbol or BSE scrip code)
  name: string;
  sector: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  date: string;     // YYYY-MM-DD
  note?: string;    // journal: why this trade
}

export interface Position {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avgCost: number;
  invested: number;     // qty × avgCost
  realised: number;     // booked P&L from sells
}

export interface Quote { price: number; change: number; changePercent: number }

export interface ValuedPosition extends Position {
  ltp: number | null;
  value: number | null;
  unrealised: number | null;
  unrealisedPct: number | null;
  dayChange: number | null;
  weight: number | null; // share of portfolio market value, 0–1
}

/** Trades are applied in date order (stable for the same date). Sells can't exceed holdings. */
export function buildPositions(trades: PaperTrade[]): { positions: Position[]; errors: string[] } {
  const sorted = trades.map((t, i) => ({ t, i })).sort((a, b) => a.t.date.localeCompare(b.t.date) || a.i - b.i).map(x => x.t);
  const book = new Map<string, Position>();
  const errors: string[] = [];
  for (const t of sorted) {
    if (!(t.qty > 0) || !(t.price > 0)) { errors.push(`${t.symbol} on ${t.date}: quantity and price must be positive`); continue; }
    const p = book.get(t.symbol) ?? { symbol: t.symbol, name: t.name, sector: t.sector, qty: 0, avgCost: 0, invested: 0, realised: 0 };
    if (t.side === "BUY") {
      const cost = p.qty * p.avgCost + t.qty * t.price;
      p.qty += t.qty;
      p.avgCost = cost / p.qty;
    } else {
      if (t.qty > p.qty + 1e-9) { errors.push(`${t.symbol} on ${t.date}: sell of ${t.qty} is more than the ${p.qty} held`); continue; }
      p.realised += (t.price - p.avgCost) * t.qty;
      p.qty -= t.qty;
      if (p.qty < 1e-9) { p.qty = 0; p.avgCost = 0; }
    }
    p.invested = p.qty * p.avgCost;
    book.set(t.symbol, p);
  }
  return { positions: [...book.values()], errors };
}

export function valuePositions(positions: Position[], quotes: Record<string, Quote>): {
  rows: ValuedPosition[];
  totals: { invested: number; value: number | null; unrealised: number | null; realised: number; dayChange: number | null; priced: number; open: number };
} {
  const open = positions.filter(p => p.qty > 0);
  const rows: ValuedPosition[] = positions.map(p => {
    const q = p.qty > 0 ? quotes[p.symbol] : undefined;
    const value = q ? q.price * p.qty : null;
    return {
      ...p,
      ltp: q?.price ?? null,
      value,
      unrealised: value !== null ? value - p.invested : null,
      unrealisedPct: value !== null && p.invested > 0 ? (value - p.invested) / p.invested : null,
      dayChange: q ? q.change * p.qty : null,
      weight: null,
    };
  });
  const priced = rows.filter(r => r.qty > 0 && r.value !== null);
  const allPriced = priced.length === open.length;
  const value = allPriced ? priced.reduce((s, r) => s + r.value!, 0) : null;
  if (value && value > 0) for (const r of priced) r.weight = r.value! / value;
  return {
    rows,
    totals: {
      invested: open.reduce((s, p) => s + p.invested, 0),
      value,
      unrealised: value !== null ? value - open.reduce((s, p) => s + p.invested, 0) : null,
      realised: positions.reduce((s, p) => s + p.realised, 0),
      dayChange: allPriced ? priced.reduce((s, r) => s + r.dayChange!, 0) : null,
      priced: priced.length,
      open: open.length,
    },
  };
}

export const STOCK_LIMIT = 0.25;  // one stock above 25% of the portfolio
export const SECTOR_LIMIT = 0.40; // one sector above 40%

export function exposure(rows: ValuedPosition[]): {
  sectors: { sector: string; weight: number }[];
  effectiveHoldings: number | null; // 1 / Σ w², the "effective number" of equal-weight stocks
  alerts: string[];
} {
  const weighted = rows.filter(r => r.weight !== null && r.weight > 0);
  if (weighted.length === 0) return { sectors: [], effectiveHoldings: null, alerts: [] };
  const bySector = new Map<string, number>();
  for (const r of weighted) bySector.set(r.sector, (bySector.get(r.sector) ?? 0) + r.weight!);
  const sectors = [...bySector.entries()].map(([sector, weight]) => ({ sector, weight })).sort((a, b) => b.weight - a.weight);
  const alerts: string[] = [];
  for (const r of weighted) if (r.weight! > STOCK_LIMIT) alerts.push(`${r.name} is ${(r.weight! * 100).toFixed(1)}% of the portfolio (above ${STOCK_LIMIT * 100}%).`);
  for (const s of sectors) if (s.weight > SECTOR_LIMIT && s.sector !== "Unclassified") alerts.push(`${s.sector} is ${(s.weight * 100).toFixed(1)}% of the portfolio (above ${SECTOR_LIMIT * 100}%).`);
  const hhi = weighted.reduce((s, r) => s + r.weight! ** 2, 0);
  return { sectors, effectiveHoldings: hhi > 0 ? 1 / hhi : null, alerts };
}
