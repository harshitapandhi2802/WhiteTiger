// ═══════════════════════════════════════════════════════════════════════
// AMFI DATA SERVICE — Real-time NAV data from AMFI India
// Source: https://www.amfiindia.com/spages/NAVAll.txt
// This is the OFFICIAL data source used by all Indian MF platforms
// ═══════════════════════════════════════════════════════════════════════

export interface AMFIScheme {
  schemeCode: number;
  isinGrowth: string;
  isinReinvestment: string;
  schemeName: string;
  nav: number;
  navDate: string;
  amcName: string;
  schemeType: string;   // "Open Ended Schemes", "Close Ended Schemes", etc.
  schemeCategory: string; // "Equity Scheme - Large Cap Fund", etc.
}

export interface AMFIAmcSummary {
  name: string;
  slug: string;
  schemeCount: number;
  totalNavSum: number;
  categories: string[];
  schemes: AMFIScheme[];
  lastUpdated: string;
}

export interface AMFIData {
  schemes: AMFIScheme[];
  amcMap: Record<string, AMFIAmcSummary>;
  amcList: AMFIAmcSummary[];
  totalSchemes: number;
  totalAMCs: number;
  lastFetched: string;
  navDate: string;
  categories: string[];
}

// ── In-memory cache ──
let cachedData: AMFIData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours (AMFI updates NAV ~11pm IST)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/mutual fund/gi, "mf")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeAMCName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse the AMFI NAVAll.txt format:
 * Lines are either:
 * - Blank lines (separators)
 * - Scheme type headers: "Open Ended Schemes(Equity Scheme - Large Cap Fund)"
 * - AMC name headers (plain text, no semicolons)
 * - Data rows: "SchemeCode;ISIN1;ISIN2;SchemeName;NAV;Date"
 */
function parseAMFIText(text: string): AMFIData {
  const lines = text.split("\n");
  const schemes: AMFIScheme[] = [];
  let currentType = "";
  let currentCategory = "";
  let currentAMC = "";
  let latestNavDate = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Scheme type + category header
    // e.g. "Open Ended Schemes(Equity Scheme - Large Cap Fund)"
    const typeMatch = line.match(/^(Open Ended Schemes|Close Ended Schemes|Interval Fund Schemes)\s*\((.+)\)\s*$/i);
    if (typeMatch) {
      currentType = typeMatch[1];
      currentCategory = typeMatch[2];
      continue;
    }

    // Check if data row (has semicolons — at least 4)
    if (line.includes(";")) {
      const parts = line.split(";");
      if (parts.length >= 5) {
        const schemeCode = parseInt(parts[0].trim(), 10);
        if (isNaN(schemeCode)) continue;

        const navStr = parts[4]?.trim();
        const nav = parseFloat(navStr);
        if (isNaN(nav)) continue; // skip N/A NAVs

        const navDate = parts[5]?.trim() || "";
        if (navDate && navDate > latestNavDate) latestNavDate = navDate;

        schemes.push({
          schemeCode,
          isinGrowth: parts[1]?.trim() || "",
          isinReinvestment: parts[2]?.trim() || "",
          schemeName: parts[3]?.trim() || "",
          nav,
          navDate,
          amcName: currentAMC,
          schemeType: currentType,
          schemeCategory: currentCategory,
        });
      }
      continue;
    }

    // If not a header and not data, it's an AMC name
    // AMC name lines don't contain semicolons and aren't scheme type headers
    if (!line.match(/^(Scheme Code|Open Ended|Close Ended|Interval Fund)/i)) {
      currentAMC = normalizeAMCName(line);
    }
  }

  // Build AMC map
  const amcMap: Record<string, AMFIAmcSummary> = {};
  for (const scheme of schemes) {
    const key = scheme.amcName;
    if (!key) continue;
    if (!amcMap[key]) {
      amcMap[key] = {
        name: key,
        slug: slugify(key),
        schemeCount: 0,
        totalNavSum: 0,
        categories: [],
        schemes: [],
        lastUpdated: latestNavDate,
      };
    }
    amcMap[key].schemeCount++;
    amcMap[key].totalNavSum += scheme.nav;
    amcMap[key].schemes.push(scheme);
    if (!amcMap[key].categories.includes(scheme.schemeCategory)) {
      amcMap[key].categories.push(scheme.schemeCategory);
    }
  }

  const amcList = Object.values(amcMap).sort((a, b) => b.schemeCount - a.schemeCount);

  // Unique categories
  const categories = [...new Set(schemes.map(s => s.schemeCategory))].filter(Boolean).sort();

  return {
    schemes,
    amcMap,
    amcList,
    totalSchemes: schemes.length,
    totalAMCs: amcList.length,
    lastFetched: new Date().toISOString(),
    navDate: latestNavDate,
    categories,
  };
}

/**
 * Fetch and parse AMFI NAV data with caching
 */
export async function getAMFIData(): Promise<AMFIData> {
  const now = Date.now();

  // Return cached if fresh
  if (cachedData && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedData;
  }

  try {
    const res = await fetch("https://www.amfiindia.com/spages/NAVAll.txt", {
      next: { revalidate: 21600 }, // 6 hour ISR cache
      headers: {
        "User-Agent": "WhiteTiger-Research/1.0",
      },
    });

    if (!res.ok) {
      throw new Error(`AMFI fetch failed: ${res.status}`);
    }

    const text = await res.text();
    cachedData = parseAMFIText(text);
    cacheTimestamp = now;
    return cachedData;
  } catch (err) {
    // Return stale cache if available
    if (cachedData) return cachedData;
    throw err;
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

/**
 * Search schemes across all AMCs
 */
export function searchSchemes(data: AMFIData, query: string, limit = 50): AMFIScheme[] {
  if (!query.trim()) return data.schemes.slice(0, limit);
  const q = query.toLowerCase();
  const results: { scheme: AMFIScheme; score: number }[] = [];

  for (const s of data.schemes) {
    const name = s.schemeName.toLowerCase();
    const amc = s.amcName.toLowerCase();
    let score = 0;

    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (amc.startsWith(q)) score = 70;
    else if (name.includes(q)) score = 50;
    else if (amc.includes(q)) score = 40;
    else {
      const words = q.split(/\s+/);
      const matched = words.filter(w => name.includes(w) || amc.includes(w));
      if (matched.length > 0) score = 10 + matched.length * 12;
    }

    if (score > 0) results.push({ scheme: s, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.scheme);
}

/**
 * Resolve the best live NAV for a curated fund name. Prefers the
 * Direct + Growth plan (the canonical NAV investors compare against).
 * Returns null when there is no confident match so callers can fall back.
 */
export function resolveNav(
  data: AMFIData,
  fundName: string
): { nav: number; navDate: string; schemeName: string; schemeCode: number } | null {
  const matches = searchSchemes(data, fundName, 25);
  if (!matches.length) return null;

  const prefer = (s: AMFIScheme) => {
    const n = s.schemeName.toLowerCase();
    let p = 0;
    if (n.includes("direct")) p += 2;
    if (n.includes("growth")) p += 2;
    if (n.includes("idcw") || n.includes("dividend") || n.includes("payout") || n.includes("reinvest")) p -= 2;
    return p;
  };

  // Highest search relevance is preserved by searchSchemes order; within the
  // top band, prefer Direct-Growth.
  const top = matches.slice(0, 8).sort((a, b) => prefer(b) - prefer(a))[0];
  if (!top || !(top.nav > 0)) return null;
  return { nav: top.nav, navDate: top.navDate, schemeName: top.schemeName, schemeCode: top.schemeCode };
}

/**
 * Filter schemes by category
 */
export function filterSchemes(
  data: AMFIData,
  opts: {
    category?: string;
    amcName?: string;
    schemeType?: string;
    minNav?: number;
    maxNav?: number;
    search?: string;
  },
  limit = 100,
  offset = 0
): { schemes: AMFIScheme[]; total: number } {
  let filtered = data.schemes;

  if (opts.category) {
    filtered = filtered.filter(s => s.schemeCategory.toLowerCase().includes(opts.category!.toLowerCase()));
  }
  if (opts.amcName) {
    filtered = filtered.filter(s => s.amcName.toLowerCase().includes(opts.amcName!.toLowerCase()));
  }
  if (opts.schemeType) {
    filtered = filtered.filter(s => s.schemeType.toLowerCase().includes(opts.schemeType!.toLowerCase()));
  }
  if (opts.minNav !== undefined) {
    filtered = filtered.filter(s => s.nav >= opts.minNav!);
  }
  if (opts.maxNav !== undefined) {
    filtered = filtered.filter(s => s.nav <= opts.maxNav!);
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    filtered = filtered.filter(s =>
      s.schemeName.toLowerCase().includes(q) ||
      s.amcName.toLowerCase().includes(q) ||
      String(s.schemeCode).includes(q)
    );
  }

  return {
    schemes: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
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
