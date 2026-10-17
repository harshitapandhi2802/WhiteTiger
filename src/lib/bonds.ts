export interface BondEntry {
  name: string;
  symbol: string;
  category: string;
  type: string;
  tenure: string;
  coupon: string;
  rating: string;
  /** Rate or yield shown on the card. "LIVE" = use the live India 10Y yield. */
  yieldApprox: string;
  issuer: string;
  /** One-line fact shown under the card (source / as-of / how it works). */
  note?: string;
}

/* Every figure below is either live (10Y G-Sec), an official rate with its
   period, or described as market-linked. No invented securities or yields.
   Verified 17 Oct 2026:
   - Small savings: Ministry of Finance rates for 1 Oct–31 Dec 2026 (Q3 FY27).
   - Floating Rate Savings Bonds 2020 (Taxable): NSC rate + 0.35% = 8.05% for Jul–Dec 2026.
   - SGB: no new tranche since 2023-24 Series IV (Feb 2024); existing series pay 2.5%. */
export const SMALL_SAVINGS_PERIOD = "Oct–Dec 2026";

export const BOND_CATEGORIES = [
  "All", "Government Securities", "Treasury Bills", "State Dev Loans",
  "Corporate Bonds", "RBI Bonds", "Sovereign Gold Bonds", "Tax-Free Bonds",
  "Small Savings",
];

const MARKET = "Market-linked";
const SS_NOTE = `Official rate for ${SMALL_SAVINGS_PERIOD}, set quarterly by the Ministry of Finance`;

export const BONDS_LIST: BondEntry[] = [
  // Government Securities (G-Secs)
  { name: "10-Year G-Sec (benchmark)", symbol: "GSEC10Y", category: "Government Securities", type: "G-Sec", tenure: "10 Years", coupon: "Fixed, varies by issue", rating: "Sovereign", yieldApprox: "LIVE", issuer: "Government of India", note: "Live benchmark yield (TradingView)" },
  { name: "Government Securities (5–40 years)", symbol: "GSEC", category: "Government Securities", type: "G-Sec", tenure: "5–40 Years", coupon: "Fixed, varies by issue", rating: "Sovereign", yieldApprox: MARKET, issuer: "Government of India", note: "Buy directly via RBI Retail Direct or through a broker" },

  // Treasury Bills
  { name: "Treasury Bills (91 / 182 / 364-day)", symbol: "TBILL", category: "Treasury Bills", type: "T-Bill", tenure: "91–364 Days", coupon: "Zero coupon (issued at a discount)", rating: "Sovereign", yieldApprox: MARKET, issuer: "Government of India", note: "Yields are set at weekly RBI auctions" },

  // State Development Loans
  { name: "State Development Loans (SDLs)", symbol: "SDL", category: "State Dev Loans", type: "SDL", tenure: "Mostly 5–30 Years", coupon: "Fixed, varies by issue", rating: "State government", yieldApprox: MARKET, issuer: "State governments", note: "Usually yield slightly more than G-Secs of similar maturity" },

  // Corporate Bonds
  { name: "PSU bonds (e.g. NABARD, PFC, REC)", symbol: "PSUBOND", category: "Corporate Bonds", type: "Corporate", tenure: "Varies by issue", coupon: "Fixed, varies by issue", rating: "Mostly AAA", yieldApprox: MARKET, issuer: "Public sector companies", note: "Check the credit rating and yield of the specific issue" },
  { name: "Corporate NCDs (banks, NBFCs, companies)", symbol: "NCD", category: "Corporate Bonds", type: "Corporate", tenure: "Varies by issue", coupon: "Fixed, varies by issue", rating: "AAA to below investment grade", yieldApprox: MARKET, issuer: "Companies", note: "Higher yields usually mean higher credit risk" },

  // RBI Bonds
  { name: "Floating Rate Savings Bonds 2020 (Taxable)", symbol: "FRSB2020", category: "RBI Bonds", type: "RBI", tenure: "7 Years", coupon: "8.05% (NSC rate + 0.35%)", rating: "Sovereign", yieldApprox: "8.05%", issuer: "Government of India (via RBI)", note: "Rate for Jul–Dec 2026; resets every 6 months; interest is taxable" },

  // Sovereign Gold Bonds
  { name: "Sovereign Gold Bond 2023-24 Series IV", symbol: "SGB2324S4", category: "Sovereign Gold Bonds", type: "SGB", tenure: "8 Years", coupon: "2.50% a year on issue price", rating: "Sovereign", yieldApprox: "2.50% + gold price", issuer: "Government of India (via RBI)", note: "Last new SGB issue (Feb 2024); trades on NSE/BSE" },
  { name: "Sovereign Gold Bond 2023-24 Series II", symbol: "SGB2324S2", category: "Sovereign Gold Bonds", type: "SGB", tenure: "8 Years", coupon: "2.50% a year on issue price", rating: "Sovereign", yieldApprox: "2.50% + gold price", issuer: "Government of India (via RBI)", note: "No new SGB issues since Feb 2024; existing series trade on NSE/BSE" },

  // Tax-Free Bonds
  { name: "Tax-free PSU bonds (secondary market)", symbol: "TAXFREE", category: "Tax-Free Bonds", type: "Tax-Free", tenure: "10–20 Years at issue", coupon: "Fixed, varies by issue (interest tax-free)", rating: "Mostly AAA", yieldApprox: MARKET, issuer: "IRFC, NHAI, PFC, REC, HUDCO and others", note: "No new issues in recent years; buy and sell on NSE/BSE" },

  // Small Savings (official rates, 1 Oct – 31 Dec 2026)
  { name: "Public Provident Fund (PPF)", symbol: "PPF", category: "Small Savings", type: "SmallSavings", tenure: "15 Years", coupon: "7.1%", rating: "Sovereign", yieldApprox: "7.1%", issuer: "Government of India", note: SS_NOTE },
  { name: "National Savings Certificate (NSC)", symbol: "NSC", category: "Small Savings", type: "SmallSavings", tenure: "5 Years", coupon: "7.7%", rating: "Sovereign", yieldApprox: "7.7%", issuer: "Government of India", note: SS_NOTE },
  { name: "Sukanya Samriddhi Yojana", symbol: "SSY", category: "Small Savings", type: "SmallSavings", tenure: "21 Years", coupon: "8.2%", rating: "Sovereign", yieldApprox: "8.2%", issuer: "Government of India", note: SS_NOTE },
  { name: "Senior Citizens Savings Scheme", symbol: "SCSS", category: "Small Savings", type: "SmallSavings", tenure: "5 Years", coupon: "8.2%", rating: "Sovereign", yieldApprox: "8.2%", issuer: "Government of India", note: SS_NOTE },
  { name: "Kisan Vikas Patra (KVP)", symbol: "KVP", category: "Small Savings", type: "SmallSavings", tenure: "115 Months (doubles money)", coupon: "7.5%", rating: "Sovereign", yieldApprox: "7.5%", issuer: "Government of India", note: SS_NOTE },
  { name: "Post Office Monthly Income Scheme", symbol: "POMIS", category: "Small Savings", type: "SmallSavings", tenure: "5 Years", coupon: "7.4%", rating: "Sovereign", yieldApprox: "7.4%", issuer: "India Post (Government of India)", note: SS_NOTE },
];

export function searchBonds(query: string): BondEntry[] {
  const q = query.toLowerCase();
  return BONDS_LIST
    .map(b => {
      let score = 0;
      if (b.symbol.toLowerCase() === q) score += 100;
      if (b.name.toLowerCase().startsWith(q)) score += 50;
      if (b.name.toLowerCase().includes(q)) score += 25;
      if (b.symbol.toLowerCase().includes(q)) score += 20;
      if (b.issuer.toLowerCase().includes(q)) score += 15;
      if (b.category.toLowerCase().includes(q)) score += 10;
      if (b.type.toLowerCase().includes(q)) score += 10;
      return { ...b, score };
    })
    .filter(b => b.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
