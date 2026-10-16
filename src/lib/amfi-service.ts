// ═══════════════════════════════════════════════════════════════════════
// AMFI DATA SERVICE — official NAVs from AMFI India
// Live:     https://www.amfiindia.com/spages/NAVAll.txt (parsed by header name)
// Metadata: src/lib/mf-master.json, built from AMFI's scheme master by
//           scripts/sync-mf-universe.mjs (category, plan, option, launch, min amount)
// Unit of record: the AMFI scheme code (one plan + option variant).
// ═══════════════════════════════════════════════════════════════════════
import { parseNavAll, parseAmfiDate } from "./amfi-parse";
import { classify, splitCategory, type Plan, type Option, type AssetClass } from "./mf-classify";
import masterFile from "./mf-master.json";

export type SchemeStatus = "active" | "nav-stale" | "nav-invalid" | "awaiting-first-nav" | "no-nav";

export interface AMFIScheme {
  schemeCode: number;
  isinGrowth: string;
  isinReinvestment: string;
  /** AMFI NAV name (the variant's full name). */
  schemeName: string;
  /** Base scheme name shared by all plans/options of the portfolio (from the scheme master). */
  baseName: string | null;
  /** Latest NAV; null when AMFI publishes none or an invalid value. */
  nav: number | null;
  /** ISO date of that NAV (this is the NAV date, not the current date). */
  navDate: string | null;
  amcName: string;
  schemeType: string;
  /** Category label exactly as AMFI publishes it. */
  schemeCategory: string;
  assetClass: AssetClass;
  subCategory: string;
  plan: Plan;
  option: Option;
  idcwType: string | null;
  idcwFrequency: string | null;
  optionDiscontinued: boolean;
  status: SchemeStatus;
  launchDate: string | null;
  closureDate: string | null;
  minInvestment: number | null;
  isins: string[];
}

export interface AMFIAmcSummary {
  name: string;
  slug: string;
  schemeCount: number;
  categories: string[];
  schemes: AMFIScheme[];
  lastUpdated: string;
}

export interface AMFIData {
  /** Schemes with a valid NAV (active + nav-stale). */
  schemes: AMFIScheme[];
  /** Every known scheme code, including those without a NAV (for search / status lookups). */
  allSchemes: AMFIScheme[];
  byCode: Map<number, AMFIScheme>;
  amcMap: Record<string, AMFIAmcSummary>;
  amcList: AMFIAmcSummary[];
  totalSchemes: number;
  activeSchemes: number;
  totalAMCs: number;
  lastFetched: string;
  /** Latest NAV date found in the file (ISO). */
  navDate: string;
  categories: string[];
  /** "live" = AMFI NAVAll fetched now; "snapshot" = AMFI unreachable, using the dated sync snapshot. */
  navSource: "live" | "snapshot";
  snapshotDate: string;
}

interface MasterRow {
  c: number; n: string; b: string | null; a: number; k: number; ac: number; sc: number; t: string;
  p: string; o: string; it: string | null; if: string | null; od: number; i: string[];
  mn: number | null; l: string | null; cl: string | null; s: SchemeStatus; nv: number | null; nd: string | null;
}
interface MasterFile { meta: { latestNavDate: string; generatedAt: string }; amcs: string[]; cats: string[]; subs: string[]; assetClasses: AssetClass[]; rows: MasterRow[] }
const MASTER = masterFile as unknown as MasterFile;
const MASTER_BY_CODE = new Map(MASTER.rows.map(r => [r.c, r]));
const PLAN: Record<string, Plan> = { D: "Direct", R: "Regular", U: "Unspecified" };
const OPTION: Record<string, Option> = { G: "Growth", I: "IDCW", B: "Bonus", U: "Unspecified" };
const TYPE: Record<string, string> = { O: "Open Ended", C: "Close Ended", I: "Interval Fund" };
const ACTIVE_WINDOW_DAYS = 7;

// ── In-memory cache ──
let cachedData: AMFIData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours (AMFI publishes NAVs in the evening IST)

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/mutual fund/gi, "mf")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

function fromMaster(m: MasterRow, nav: number | null, navDate: string | null, status: SchemeStatus): AMFIScheme {
  const category = MASTER.cats[m.k];
  return {
    schemeCode: m.c, isinGrowth: m.i[0] ?? "", isinReinvestment: m.i[1] ?? "", schemeName: m.n, baseName: m.b,
    nav, navDate, amcName: MASTER.amcs[m.a], schemeType: TYPE[m.t] ?? "Open Ended", schemeCategory: category,
    assetClass: MASTER.assetClasses[m.ac] ?? splitCategory(category).assetClass, subCategory: MASTER.subs[m.sc],
    plan: PLAN[m.p], option: OPTION[m.o], idcwType: m.it, idcwFrequency: m.if, optionDiscontinued: !!m.od,
    status, launchDate: m.l, closureDate: m.cl, minInvestment: m.mn, isins: m.i,
  };
}

/** Build the dataset from a NAVAll text (live) or, when null, from the dated sync snapshot. */
export function buildAMFIData(text: string | null): AMFIData {
  const all: AMFIScheme[] = [];
  const seen = new Set<number>();
  let latest = "";

  if (text) {
    const rows = parseNavAll(text).rows.filter(r => /^\d+$/.test(r.code));
    for (const r of rows) { const d = parseAmfiDate(r.date); if (d && d > latest) latest = d; }
    for (const r of rows) {
      const code = +r.code;
      if (seen.has(code)) continue;
      seen.add(code);
      const v = Number(r.navRaw.replace(/,/g, ""));
      const nav = Number.isFinite(v) && v > 0 ? v : null;
      const navDate = parseAmfiDate(r.date);
      const status: SchemeStatus = nav === null ? "nav-invalid" : navDate && days(navDate, latest) <= ACTIVE_WINDOW_DAYS ? "active" : "nav-stale";
      const m = MASTER_BY_CODE.get(code);
      if (m) {
        // Live NAV file wins for name, plan and option (they can change between syncs).
        const live = classify(r.planCol, r.optionCol, r.name, m.b ?? undefined);
        const s = fromMaster({ ...m, n: r.name || m.n }, nav, navDate, status);
        all.push({ ...s, plan: live.plan, option: live.option, idcwType: live.idcwType, idcwFrequency: live.idcwFrequency, optionDiscontinued: live.optionDiscontinued });
      } else {
        // New code since the last sync: classify from the live row alone.
        const cls = classify(r.planCol, r.optionCol, r.name);
        const { assetClass, subCategory } = splitCategory(r.section);
        all.push({
          schemeCode: code, isinGrowth: r.isin1, isinReinvestment: r.isin2, schemeName: r.name, baseName: null, nav, navDate,
          amcName: r.amc.replace(/\s+/g, " ").trim(), schemeType: r.sectionType.replace(/ Schemes$/, "").replace("Interval Fund", "Interval Fund"),
          schemeCategory: r.section, assetClass, subCategory, ...cls, status, launchDate: null, closureDate: null, minInvestment: null,
          isins: [r.isin1, r.isin2].filter(i => /^IN[A-Z0-9]{10}$/.test(i)),
        });
      }
    }
  } else {
    latest = MASTER.meta.latestNavDate;
    for (const m of MASTER.rows) if (m.nv !== null) { seen.add(m.c); all.push(fromMaster(m, m.nv, m.nd, m.s)); }
  }
  // Codes in the master without a NAV (wound up, merged, matured, or awaiting first NAV).
  for (const m of MASTER.rows) {
    if (seen.has(m.c)) continue;
    const status: SchemeStatus = m.s === "awaiting-first-nav" ? "awaiting-first-nav" : "no-nav";
    all.push(fromMaster(m, null, null, status));
  }

  const withNav = all.filter(s => s.nav !== null);
  const amcMap: Record<string, AMFIAmcSummary> = {};
  for (const s of withNav) {
    const key = s.amcName;
    if (!amcMap[key]) amcMap[key] = { name: key, slug: slugify(key), schemeCount: 0, categories: [], schemes: [], lastUpdated: latest };
    amcMap[key].schemeCount++;
    amcMap[key].schemes.push(s);
    if (!amcMap[key].categories.includes(s.schemeCategory)) amcMap[key].categories.push(s.schemeCategory);
  }
  const amcList = Object.values(amcMap).sort((a, b) => b.schemeCount - a.schemeCount);
  return {
    schemes: withNav, allSchemes: all, byCode: new Map(all.map(s => [s.schemeCode, s])),
    amcMap, amcList, totalSchemes: withNav.length, activeSchemes: withNav.filter(s => s.status === "active").length,
    totalAMCs: amcList.length, lastFetched: new Date().toISOString(), navDate: latest,
    categories: [...new Set(withNav.map(s => s.schemeCategory))].filter(Boolean).sort(),
    navSource: text ? "live" : "snapshot", snapshotDate: MASTER.meta.latestNavDate,
  };
}

/**
 * Fetch and parse AMFI NAV data (6-hour cache). If AMFI is unreachable, serves the
 * dated sync snapshot with navSource="snapshot" — never an empty or invented dataset.
 */
export async function getAMFIData(): Promise<AMFIData> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) return cachedData;
  try {
    const res = await fetch("https://www.amfiindia.com/spages/NAVAll.txt", {
      next: { revalidate: 21600 },
      headers: { "User-Agent": "WhiteTiger-Research/1.0" },
    });
    if (!res.ok) throw new Error(`AMFI fetch failed: ${res.status}`);
    const text = await res.text();
    const data = buildAMFIData(text);
    if (data.totalSchemes < 1000) throw new Error(`AMFI file parsed to only ${data.totalSchemes} schemes`);
    cachedData = data;
    cacheTimestamp = now;
    return cachedData;
  } catch (err) {
    console.error("AMFI live fetch failed; using snapshot:", err);
    if (cachedData) return cachedData;
    cachedData = buildAMFIData(null);
    cacheTimestamp = now - CACHE_TTL + 15 * 60 * 1000; // retry live in 15 minutes
    return cachedData;
  }
}

/**
 * Get historical NAV data for a scheme from mfapi.in
 * This is a free community API wrapping AMFI data
 */
export async function getSchemeHistory(schemeCode: number): Promise<{
  meta: { fund_house: string; scheme_type: string; scheme_category: string; scheme_code: number; scheme_name: string };
  data: { date: string; nav: string }[];
} | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      next: { revalidate: 86400 }, // 24hr cache for historical data
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const STATUS_RANK: Record<SchemeStatus, number> = { active: 0, "awaiting-first-nav": 1, "nav-stale": 2, "nav-invalid": 3, "no-nav": 4 };

/**
 * Search every known scheme code by name, AMC, scheme code or ISIN.
 * Exact code/ISIN matches rank first; active schemes rank above inactive ones.
 */
export function searchSchemes(data: AMFIData, query: string, limit = 50, opts: { includeInactive?: boolean } = {}): AMFIScheme[] {
  const q = query.trim().toLowerCase();
  const pool = opts.includeInactive ? data.allSchemes : data.allSchemes.filter(s => s.status === "active");
  if (!q) return pool.slice(0, limit);
  const words = q.split(/\s+/).filter(Boolean);
  const results: { scheme: AMFIScheme; score: number }[] = [];
  for (const s of pool) {
    const name = s.schemeName.toLowerCase(), base = (s.baseName ?? "").toLowerCase(), amc = s.amcName.toLowerCase();
    let score = 0;
    if (String(s.schemeCode) === q || s.isins.some(i => i.toLowerCase() === q)) score = 200;
    else if (name === q || base === q) score = 100;
    else if (name.startsWith(q) || base.startsWith(q)) score = 80;
    else if (amc.startsWith(q)) score = 60;
    else if (name.includes(q) || base.includes(q)) score = 50;
    else {
      const hay = `${name} ${base} ${amc} ${s.subCategory.toLowerCase()}`;
      if (words.length > 1 && words.every(w => hay.includes(w))) score = 30 + words.length;
    }
    if (score > 0) results.push({ scheme: s, score: score - STATUS_RANK[s.status] * 5 });
  }
  return results.sort((x, y) => y.score - x.score || x.scheme.schemeName.localeCompare(y.scheme.schemeName)).slice(0, limit).map(r => r.scheme);
}

export interface SchemeFilter {
  assetClass?: string; subCategory?: string; category?: string; amcName?: string;
  plan?: string; option?: string; schemeType?: string; status?: string; search?: string;
}

/** Exact-match filters (case-insensitive; subCategory accepts "a|b" for any of several). status defaults to "active"; pass "all" for every code. */
export function filterSchemes(data: AMFIData, opts: SchemeFilter, limit = 100, offset = 0): { schemes: AMFIScheme[]; total: number } {
  const eq = (a: string | null | undefined, b?: string) => !b || (a ?? "").toLowerCase() === b.toLowerCase();
  const status = opts.status ?? "active";
  const q = opts.search?.trim().toLowerCase();
  const filtered = data.allSchemes.filter(s =>
    (status === "all" || s.status === status) &&
    eq(s.assetClass, opts.assetClass) && (!opts.subCategory || opts.subCategory.split("|").some(v => eq(s.subCategory, v))) && eq(s.amcName, opts.amcName) &&
    eq(s.plan, opts.plan) && eq(s.option, opts.option) &&
    (!opts.category || s.schemeCategory.toLowerCase().includes(opts.category.toLowerCase())) &&
    (!opts.schemeType || s.schemeType.toLowerCase().includes(opts.schemeType.toLowerCase())) &&
    (!q || s.schemeName.toLowerCase().includes(q) || (s.baseName ?? "").toLowerCase().includes(q) || String(s.schemeCode) === q)
  ).sort((x, y) => x.amcName.localeCompare(y.amcName) || (x.baseName ?? x.schemeName).localeCompare(y.baseName ?? y.schemeName) || x.schemeCode - y.schemeCode);
  return { schemes: filtered.slice(offset, offset + limit), total: filtered.length };
}

/** Other plans/options of the same portfolio (same AMC + base scheme name). */
export function siblingSchemes(data: AMFIData, scheme: AMFIScheme): AMFIScheme[] {
  if (!scheme.baseName) return [];
  return data.allSchemes.filter(s => s.schemeCode !== scheme.schemeCode && s.amcName === scheme.amcName && s.baseName === scheme.baseName);
}

// ── AMC enrichment data (for AMCs we have curated info about) ──
export interface AMCEnrichment {
  parentCompany: string;
  ceo: string;
  cio: string;
  ownershipStructure: string;
  founded: number;
  aumEstimate: string;    // Latest known AUM
  aumNumeric: number;     // In crores for sorting
  marketSharePct: number;
  strengths: string[];
  weaknesses: string[];
  category: "Large" | "Mid" | "Small" | "Boutique";
}

// Curated enrichment for top AMCs (supplementing live AMFI data)
export const AMC_ENRICHMENT: Record<string, AMCEnrichment> = {
  "SBI Funds Management Limited": { parentCompany: "SBI + AMUNDI (France) JV", ceo: "Shamsher Singh", cio: "D P Singh", ownershipStructure: "SBI + AMUNDI JV", founded: 1987, aumEstimate: "₹11.4L Cr", aumNumeric: 1140000, marketSharePct: 15.2, strengths: ["Largest AUM", "Strong brand trust", "Wide distribution network"], weaknesses: ["Large fund sizes limit agility", "Some category underperformers"], category: "Large" },
  "HDFC Asset Management Company Limited": { parentCompany: "HDFC Bank (subsidiary)", ceo: "Navneet Munot", cio: "Chirag Setalvad", ownershipStructure: "HDFC Bank (100%)", founded: 1999, aumEstimate: "₹7.9L Cr", aumNumeric: 790000, marketSharePct: 10.5, strengths: ["Consistent value approach", "Strong fixed income", "Experienced team"], weaknesses: ["Higher expense ratios on some schemes", "Value bias can underperform in growth markets"], category: "Large" },
  "ICICI Prudential Asset Management Company Limited": { parentCompany: "ICICI Bank + Prudential plc", ceo: "Nimesh Shah", cio: "S. Naren", ownershipStructure: "ICICI Bank + Prudential plc JV", founded: 1993, aumEstimate: "₹8.8L Cr", aumNumeric: 880000, marketSharePct: 11.7, strengths: ["Diversified product range", "Strong risk management", "Innovation leader"], weaknesses: ["Complex product lineup", "Some sectoral funds volatile"], category: "Large" },
  "Kotak Mahindra Asset Management Company Limited": { parentCompany: "Kotak Mahindra Bank", ceo: "Nilesh Shah", cio: "Harsha Upadhyaya", ownershipStructure: "Kotak Mahindra Bank (100%)", founded: 1998, aumEstimate: "₹5.0L Cr", aumNumeric: 500000, marketSharePct: 6.7, strengths: ["Consistent performance", "Prudent management", "Low-cost leader"], weaknesses: ["Conservative approach may miss rallies"], category: "Large" },
  "Nippon Life India Asset Management Limited": { parentCompany: "Nippon Life Insurance (Japan)", ceo: "Sundeep Sikka", cio: "Sailesh Raj Bhan", ownershipStructure: "Nippon Life Insurance (Japan) — 100%", founded: 1995, aumEstimate: "₹5.8L Cr", aumNumeric: 580000, marketSharePct: 7.7, strengths: ["Strong small-cap track record", "Global parentage", "Wide distribution"], weaknesses: ["Fund manager transitions", "Some large fund sizes limit agility"], category: "Large" },
  "Aditya Birla Sun Life AMC Limited": { parentCompany: "Aditya Birla Group + Sun Life (Canada)", ceo: "A. Balasubramanian", cio: "Mahesh Patil", ownershipStructure: "Aditya Birla Capital + Sun Life JV", founded: 1994, aumEstimate: "₹3.7L Cr", aumNumeric: 370000, marketSharePct: 4.9, strengths: ["Wide product range", "Strong fixed income team", "Long track record"], weaknesses: ["Inconsistent equity performance", "Higher expenses on some schemes"], category: "Large" },
  "Axis Asset Management Company Ltd.": { parentCompany: "Axis Bank + Schroders", ceo: "B. Gopkumar", cio: "Ashish Naik", ownershipStructure: "Axis Bank + Schroder Investment Management", founded: 2009, aumEstimate: "₹3.0L Cr", aumNumeric: 300000, marketSharePct: 4.0, strengths: ["Quality-growth focused", "Strong brand", "Consistent equity"], weaknesses: ["Key manager departure risk", "Underperformance in value cycles"], category: "Mid" },
  "UTI Asset Management Company Private Limited": { parentCompany: "T. Rowe Price + SBI + LIC + PNB + BoB", ceo: "Imtaiyazur Rahman", cio: "V. Srivatsa", ownershipStructure: "T. Rowe Price + SBI + LIC + PNB + BoB", founded: 1963, aumEstimate: "₹3.1L Cr", aumNumeric: 310000, marketSharePct: 4.1, strengths: ["Oldest AMC in India", "Strong index fund range", "Government backing"], weaknesses: ["Legacy image", "Slower innovation"], category: "Large" },
  "DSP Investment Managers Private Limited": { parentCompany: "DSP Group (India)", ceo: "Kalpen Parekh", cio: "Vinit Sambre", ownershipStructure: "DSP Group (independent Indian)", founded: 1996, aumEstimate: "₹1.8L Cr", aumNumeric: 180000, marketSharePct: 2.4, strengths: ["Research-driven", "Transparent communication", "Strong midcap expertise"], weaknesses: ["Smaller scale", "Less brand recognition"], category: "Mid" },
  "Mirae Asset Investment Managers (India) Private Limited": { parentCompany: "Mirae Asset Global (South Korea)", ceo: "Swarup Mohanty", cio: "Neelesh Surana", ownershipStructure: "Mirae Asset Global (Korea) — 100%", founded: 2008, aumEstimate: "₹2.0L Cr", aumNumeric: 200000, marketSharePct: 2.7, strengths: ["Best-in-class expense ratios", "Consistent alpha generation", "Growth-at-reasonable-price"], weaknesses: ["Limited product range", "Smaller brand awareness"], category: "Mid" },
  "Tata Asset Management Limited": { parentCompany: "Tata Sons", ceo: "Prathit Bhobe", cio: "Rahul Singh", ownershipStructure: "Tata Sons (100%)", founded: 1995, aumEstimate: "₹1.6L Cr", aumNumeric: 160000, marketSharePct: 2.1, strengths: ["Tata brand trust", "Strong sectoral funds", "Reasonable costs"], weaknesses: ["Smaller scale", "Limited product variety"], category: "Mid" },
  "PPFAS Asset Management Pvt. Ltd.": { parentCompany: "PPFAS (India)", ceo: "Neil Parag Parikh", cio: "Rajeev Thakkar", ownershipStructure: "PPFAS — Founder-led (Parag Parikh legacy)", founded: 2013, aumEstimate: "₹0.95L Cr", aumNumeric: 95000, marketSharePct: 1.3, strengths: ["Cult-status flexi cap fund", "Founder-led conviction", "International diversification", "Lowest expenses"], weaknesses: ["Very concentrated product line", "Single fund dominance risk"], category: "Boutique" },
  "Motilal Oswal Asset Management Company Limited": { parentCompany: "Motilal Oswal Financial", ceo: "Navin Agarwal", cio: "Siddharth Bothra", ownershipStructure: "Motilal Oswal Financial — Listed", founded: 2010, aumEstimate: "₹1.1L Cr", aumNumeric: 110000, marketSharePct: 1.5, strengths: ["Best passive/index fund range", "International index expertise", "Research-driven"], weaknesses: ["Smaller active fund range"], category: "Mid" },
  "Quant Money Managers Limited": { parentCompany: "Quant Group (India)", ceo: "Sandeep Tandon", cio: "Sandeep Tandon", ownershipStructure: "Quant Money Managers (promoter-led)", founded: 2012, aumEstimate: "₹0.95L Cr", aumNumeric: 95000, marketSharePct: 1.3, strengths: ["Contrarian approach", "Strong recent performance", "High-conviction bets"], weaknesses: ["Key-man risk", "High turnover portfolio", "Rapid AUM growth concern"], category: "Boutique" },
  "Canara Robeco Asset Management Company Limited": { parentCompany: "Canara Bank + Robeco (Netherlands)", ceo: "Rajnish Narula", cio: "Shridatta Bhandwaldar", ownershipStructure: "Canara Bank + Robeco (Netherlands) JV", founded: 1993, aumEstimate: "₹1.0L Cr", aumNumeric: 100000, marketSharePct: 1.3, strengths: ["Consistent alpha generation", "Under-the-radar quality", "Low expense ratios"], weaknesses: ["Low brand awareness", "Limited distribution reach"], category: "Mid" },
  "Franklin Templeton Asset Management (India) Private Limited": { parentCompany: "Franklin Templeton (USA)", ceo: "Sanjay Sapre", cio: "Anand Radhakrishnan", ownershipStructure: "Franklin Templeton (USA) — 100%", founded: 1996, aumEstimate: "₹0.7L Cr", aumNumeric: 70000, marketSharePct: 0.9, strengths: ["Global research backing", "Strong equity pedigree"], weaknesses: ["Debt crisis legacy (2020)", "Reduced brand trust"], category: "Mid" },
  "Bandhan AMC Limited": { parentCompany: "Bandhan Financial Holdings", ceo: "Vishal Kapoor", cio: "Suyash Choudhary", ownershipStructure: "Bandhan Financial Holdings (prev. IDFC MF)", founded: 2016, aumEstimate: "₹0.85L Cr", aumNumeric: 85000, marketSharePct: 1.1, strengths: ["Good fixed income team", "Growing equity track record"], weaknesses: ["Brand transition phase", "Smaller scale"], category: "Small" },
  "Edelweiss Asset Management Limited": { parentCompany: "Edelweiss Financial", ceo: "Radhika Gupta", cio: "Trideep Bhattacharya", ownershipStructure: "Edelweiss Financial — Listed", founded: 2008, aumEstimate: "₹0.5L Cr", aumNumeric: 50000, marketSharePct: 0.7, strengths: ["Dynamic balanced advantage", "Rising star CEO", "Innovation focus"], weaknesses: ["Smaller scale", "Limited track record in some categories"], category: "Small" },
  "HSBC Asset Management (India) Private Ltd.": { parentCompany: "HSBC Holdings (UK)", ceo: "Tushar Pradhan", cio: "Neelotpal Sahai", ownershipStructure: "HSBC Global Asset Mgmt — 100%", founded: 2002, aumEstimate: "₹0.75L Cr", aumNumeric: 75000, marketSharePct: 1.0, strengths: ["Global research access", "Improving track record"], weaknesses: ["Lower brand recall in MF space", "Inconsistent past"], category: "Small" },
  "Invesco Asset Management Company Pvt Ltd.": { parentCompany: "Invesco (USA)", ceo: "Saurabh Nanavati", cio: "Taher Badshah", ownershipStructure: "Invesco Ltd (USA) — 100%", founded: 2008, aumEstimate: "₹0.55L Cr", aumNumeric: 55000, marketSharePct: 0.7, strengths: ["Contrarian investing philosophy", "Global backing"], weaknesses: ["Smaller brand", "Limited scheme range"], category: "Small" },
  "WhiteOak Capital Asset Management Limited": { parentCompany: "WhiteOak Capital (India)", ceo: "Aashish Somaiyaa", cio: "Prashant Khemka", ownershipStructure: "Prashant Khemka (Founder) — ex Goldman Sachs CIO", founded: 2021, aumEstimate: "₹0.45L Cr", aumNumeric: 45000, marketSharePct: 0.6, strengths: ["Pedigreed CIO (ex-Goldman Sachs)", "Research-driven", "Clean start"], weaknesses: ["Very new", "Limited track record"], category: "Boutique" },
  "LIC Mutual Fund Asset Management Limited": { parentCompany: "LIC of India", ceo: "T. S. Ramakrishnan", cio: "Yogesh Patil", ownershipStructure: "LIC of India — 100%", founded: 1989, aumEstimate: "₹0.4L Cr", aumNumeric: 40000, marketSharePct: 0.5, strengths: ["LIC brand and distribution", "Government backing"], weaknesses: ["Poor performance track record", "Slow innovation"], category: "Small" },
  "JM Financial Asset Management Limited": { parentCompany: "JM Financial Group", ceo: "Asit Bhatia", cio: "Satish Ramanathan", ownershipStructure: "JM Financial Group — Indian private", founded: 1994, aumEstimate: "₹0.2L Cr", aumNumeric: 20000, marketSharePct: 0.3, strengths: ["Long legacy", "Resurgent performance"], weaknesses: ["Very small scale", "Limited awareness"], category: "Boutique" },
  "PGIM India Asset Management Private Limited": { parentCompany: "Prudential Financial (USA)", ceo: "Ajit Menon", cio: "Aniruddha Naha", ownershipStructure: "PGIM (Prudential Financial USA) — 100%", founded: 2010, aumEstimate: "₹0.35L Cr", aumNumeric: 35000, marketSharePct: 0.5, strengths: ["Strong midcap fund", "Global research access"], weaknesses: ["Very small scale", "Limited brand"], category: "Small" },
  "Union Asset Management Company Private Limited": { parentCompany: "Union Bank of India + KBC (Belgium)", ceo: "Vinay Paharia", cio: "Vinay Paharia", ownershipStructure: "Union Bank of India + KBC Asset Mgmt (Belgium)", founded: 2011, aumEstimate: "₹0.18L Cr", aumNumeric: 18000, marketSharePct: 0.2, strengths: ["Bank-backed distribution", "Growing product range"], weaknesses: ["Very small scale", "Limited track record"], category: "Small" },
  "Baroda BNP Paribas Asset Management India Pvt. Ltd.": { parentCompany: "Bank of Baroda + BNP Paribas", ceo: "Suresh Soni", cio: "Sanjay Chawla", ownershipStructure: "Bank of Baroda + BNP Paribas JV", founded: 1992, aumEstimate: "₹0.55L Cr", aumNumeric: 55000, marketSharePct: 0.7, strengths: ["Strong PSU bank distribution", "French global research via BNP"], weaknesses: ["Lower brand recall", "Inconsistent performance"], category: "Small" },
  "Sundaram Asset Management Company Limited": { parentCompany: "Sundaram Finance Group", ceo: "S. Vidhya Shankar", cio: "S. Bharath", ownershipStructure: "Sundaram Finance Group (Chennai-based)", founded: 1996, aumEstimate: "₹0.75L Cr", aumNumeric: 75000, marketSharePct: 0.9, strengths: ["Strong South India distribution", "Consistent small/midcap performance"], weaknesses: ["Limited national brand recall", "Smaller product range"], category: "Small" },
  "Groww Asset Management Limited": { parentCompany: "Groww (Billionbrains Garage Ventures)", ceo: "Harsh Jain", cio: "Anupam Tiwari", ownershipStructure: "Groww — Fintech (venture-backed)", founded: 2023, aumEstimate: "₹0.2L Cr", aumNumeric: 20000, marketSharePct: 0.3, strengths: ["Massive digital distribution platform", "Very low expense ratios", "Tech-forward"], weaknesses: ["Very new AMC", "No long-term track record", "Passive-heavy"], category: "Boutique" },
  "Bajaj Finserv Asset Management Limited": { parentCompany: "Bajaj Finserv Group", ceo: "Ganesh Mohan", cio: "Nimesh Chandan", ownershipStructure: "Bajaj Finserv Ltd (100%)", founded: 2023, aumEstimate: "₹0.25L Cr", aumNumeric: 25000, marketSharePct: 0.3, strengths: ["Strong Bajaj brand", "Experienced CIO from Canara Robeco"], weaknesses: ["Very new AMC", "Limited track record"], category: "Boutique" },
};

/**
 * Explicit mapping from AMFI feed names → enrichment keys
 * AMFI uses "SBI Mutual Fund" but enrichment uses "SBI Funds Management Limited"
 */
const AMFI_TO_ENRICHMENT: Record<string, string> = {
  "SBI Mutual Fund": "SBI Funds Management Limited",
  "HDFC Mutual Fund": "HDFC Asset Management Company Limited",
  "ICICI Prudential Mutual Fund": "ICICI Prudential Asset Management Company Limited",
  "Kotak Mahindra Mutual Fund": "Kotak Mahindra Asset Management Company Limited",
  "Nippon India Mutual Fund": "Nippon Life India Asset Management Limited",
  "Aditya Birla Sun Life Mutual Fund": "Aditya Birla Sun Life AMC Limited",
  "Axis Mutual Fund": "Axis Asset Management Company Ltd.",
  "UTI Mutual Fund": "UTI Asset Management Company Private Limited",
  "DSP Mutual Fund": "DSP Investment Managers Private Limited",
  "Mirae Asset Mutual Fund": "Mirae Asset Investment Managers (India) Private Limited",
  "Tata Mutual Fund": "Tata Asset Management Limited",
  "PPFAS Mutual Fund": "PPFAS Asset Management Pvt. Ltd.",
  "Motilal Oswal Mutual Fund": "Motilal Oswal Asset Management Company Limited",
  "Quant Mutual Fund": "Quant Money Managers Limited",
  "Canara Robeco Mutual Fund": "Canara Robeco Asset Management Company Limited",
  "Franklin Templeton Mutual Fund": "Franklin Templeton Asset Management (India) Private Limited",
  "Bandhan Mutual Fund": "Bandhan AMC Limited",
  "Edelweiss Mutual Fund": "Edelweiss Asset Management Limited",
  "HSBC Mutual Fund": "HSBC Asset Management (India) Private Ltd.",
  "Invesco Mutual Fund": "Invesco Asset Management Company Pvt Ltd.",
  "WhiteOak Capital Mutual Fund": "WhiteOak Capital Asset Management Limited",
  "LIC Mutual Fund": "LIC Mutual Fund Asset Management Limited",
  "JM Financial Mutual Fund": "JM Financial Asset Management Limited",
  "PGIM India Mutual Fund": "PGIM India Asset Management Private Limited",
  "Union Mutual Fund": "Union Asset Management Company Private Limited",
  "Baroda BNP Paribas Mutual Fund": "Baroda BNP Paribas Asset Management India Pvt. Ltd.",
  "Sundaram Mutual Fund": "Sundaram Asset Management Company Limited",
  "Groww Mutual Fund": "Groww Asset Management Limited",
  "Bajaj Finserv Mutual Fund": "Bajaj Finserv Asset Management Limited",
};

/**
 * Find enrichment data for an AMC name from AMFI feed
 * Uses explicit mapping first, then careful fuzzy matching
 */
export function findEnrichment(amfiAmcName: string): AMCEnrichment | null {
  // Direct match on enrichment key
  if (AMC_ENRICHMENT[amfiAmcName]) return AMC_ENRICHMENT[amfiAmcName];

  // Explicit AMFI → enrichment mapping
  const mappedKey = AMFI_TO_ENRICHMENT[amfiAmcName];
  if (mappedKey && AMC_ENRICHMENT[mappedKey]) return AMC_ENRICHMENT[mappedKey];

  // No fuzzy matching — rely only on explicit mapping above
  // This prevents cross-AMC matches (e.g. "Sundaram" → "Sun Life")
  return null;
}

// ── Industry-level constants (updated periodically) ──
export const INDUSTRY_STATS = {
  // Source: AMFI Monthly Data — May 2026 estimates
  // These are approximate and should be validated against latest AMFI releases
  asOf: "May 2026",
  isEstimate: true,
  totalAUM: "₹75L+ Cr",
  totalAUMNote: "Computed from live AMFI data + industry reports",
  monthlySIPFlows: "₹26,632 Cr",
  sipFlowsMonth: "Apr 2026",
  totalFolios: "22.8 Cr",
  uniqueInvestors: "5.3 Cr",
  totalAMCs: "44",
  afiRegistered: "Yes — SEBI Registered",
  dataSource: "AMFI India (amfiindia.com)",
  disclaimer: "NAV data sourced from AMFI. AUM figures from latest AMFI monthly reports. Past performance does not guarantee future results.",
};
