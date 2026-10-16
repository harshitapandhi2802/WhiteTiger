/**
 * Parsing + integrity checks for NSE's FII/DII trading-activity payload
 * (nseindia.com/api/fiidiiTradeReact). Dependency-free so it can be unit tested.
 */
export interface Flow { buy: number; sell: number; net: number }
export interface FiiDiiFlows { tradingDate: string; fii: Flow; dii: Flow }

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new Error(`non-numeric value: ${String(v)}`);
  return n;
};

/** Throws on any unexpected shape or internally inconsistent figures, so callers never show bad data. */
export function parseFiiDii(raw: unknown): FiiDiiFlows {
  if (!Array.isArray(raw)) throw new Error("unexpected response shape");
  const pick = (re: RegExp) => {
    const row = raw.find((r: { category?: unknown }) => typeof r?.category === "string" && re.test(r.category));
    if (!row) throw new Error(`missing category ${re}`);
    const f: Flow = { buy: num(row.buyValue), sell: num(row.sellValue), net: num(row.netValue) };
    if (f.buy < 0 || f.sell < 0) throw new Error("negative gross value");
    // net must equal buy - sell (rounding tolerance 1 crore)
    if (Math.abs(f.buy - f.sell - f.net) > 1) throw new Error("net != buy - sell");
    return { flow: f, date: String(row.date) };
  };
  const fii = pick(/^FII/i), dii = pick(/^DII/i);
  if (fii.date !== dii.date) throw new Error("FII and DII rows have different dates");
  return { tradingDate: fii.date, fii: fii.flow, dii: dii.flow };
}
