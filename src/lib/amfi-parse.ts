/**
 * Parser for AMFI's NAVAll.txt, shared by the sync script and the runtime service.
 * Columns are located by header name, so added/reordered columns (AMFI added
 * "Plan" and "Option" in 2026) cannot shift the NAV or date into the wrong field.
 */
export interface NavAllRow {
  code: string; isin1: string; isin2: string; name: string;
  planCol: string; optionCol: string; navRaw: string; date: string;
  /** Section heading the row sits under, e.g. "Equity Scheme - Large Cap Fund". */
  section: string;
  sectionType: string;
  amc: string;
}

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** "13-Oct-2026" → "2026-10-13". Null when unparseable. */
export function parseAmfiDate(s: string): string | null {
  const m = String(s || "").trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m || MONTHS[m[2].toLowerCase()] === undefined) return null;
  return new Date(Date.UTC(+m[3], MONTHS[m[2].toLowerCase()], +m[1])).toISOString().slice(0, 10);
}

export function parseNavAll(text: string): { header: string[]; rows: NavAllRow[] } {
  let header: string[] | null = null, section = "", sectionType = "", amc = "";
  const raw: { rec: Record<string, string>; section: string; sectionType: string; amc: string }[] = [];
  for (const l of text.split(/\r?\n/)) {
    const line = l.trim();
    if (!line) continue;
    if (/^Scheme Code;/i.test(line)) { header = line.split(";").map(h => h.trim()); continue; }
    if (line.includes(";")) {
      if (!header) throw new Error("NAVAll: data row before header");
      const p = line.split(";");
      raw.push({ rec: Object.fromEntries(header.map((h, i) => [h, (p[i] ?? "").trim()])), section, sectionType, amc });
      continue;
    }
    const sec = line.match(/^(Open Ended Schemes|Close Ended Schemes|Interval Fund Schemes)\s*\((.+)\)\s*$/i);
    if (sec) { sectionType = sec[1]; section = sec[2].trim(); } else amc = line;
  }
  if (!header) throw new Error("NAVAll: header not found");
  const h = header;
  const col = (want: string) => h.find(x => x.toLowerCase().startsWith(want.toLowerCase()));
  const C = { code: col("Scheme Code"), isin1: col("ISIN Div Payout"), isin2: col("ISIN Div Reinvestment"), name: col("Scheme Name"),
    plan: col("Plan"), option: col("Option"), nav: col("Net Asset Value"), date: col("Date") };
  for (const k of ["code", "name", "nav", "date"] as const) if (!C[k]) throw new Error(`NAVAll: missing column "${k}" in header`);
  const get = (rec: Record<string, string>, c?: string) => (c ? rec[c] ?? "" : "");
  return {
    header: h,
    rows: raw.map(({ rec, section, sectionType, amc }) => ({
      code: get(rec, C.code), isin1: get(rec, C.isin1), isin2: get(rec, C.isin2), name: get(rec, C.name),
      planCol: get(rec, C.plan), optionCol: get(rec, C.option), navRaw: get(rec, C.nav), date: get(rec, C.date),
      section, sectionType, amc,
    })),
  };
}
