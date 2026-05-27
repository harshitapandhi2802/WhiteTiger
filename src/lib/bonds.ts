export interface BondEntry {
  name: string;
  symbol: string;
  category: string;
  type: string;
  tenure: string;
  coupon: string;
  rating: string;
  yieldApprox: string;
  issuer: string;
}

export const BOND_CATEGORIES = [
  "All", "Government Securities", "Treasury Bills", "State Dev Loans",
  "Corporate Bonds", "RBI Bonds", "Sovereign Gold Bonds", "Tax-Free Bonds",
  "Small Savings",
];

export const BONDS_LIST: BondEntry[] = [
  // Government Securities (G-Secs)
  { name: "10-Year Government Bond", symbol: "GSEC10Y", category: "Government Securities", type: "G-Sec", tenure: "10 Years", coupon: "7.18%", rating: "Sovereign", yieldApprox: "7.12%", issuer: "Government of India" },
  { name: "5-Year Government Bond", symbol: "GSEC5Y", category: "Government Securities", type: "G-Sec", tenure: "5 Years", coupon: "7.02%", rating: "Sovereign", yieldApprox: "6.95%", issuer: "Government of India" },
  { name: "2-Year Government Bond", symbol: "GSEC2Y", category: "Government Securities", type: "G-Sec", tenure: "2 Years", coupon: "6.78%", rating: "Sovereign", yieldApprox: "6.72%", issuer: "Government of India" },
  { name: "30-Year Government Bond", symbol: "GSEC30Y", category: "Government Securities", type: "G-Sec", tenure: "30 Years", coupon: "7.40%", rating: "Sovereign", yieldApprox: "7.35%", issuer: "Government of India" },
  { name: "7-Year Government Bond", symbol: "GSEC7Y", category: "Government Securities", type: "G-Sec", tenure: "7 Years", coupon: "7.10%", rating: "Sovereign", yieldApprox: "7.05%", issuer: "Government of India" },
  { name: "15-Year Government Bond", symbol: "GSEC15Y", category: "Government Securities", type: "G-Sec", tenure: "15 Years", coupon: "7.25%", rating: "Sovereign", yieldApprox: "7.20%", issuer: "Government of India" },

  // Treasury Bills
  { name: "91-Day Treasury Bill", symbol: "TBILL91", category: "Treasury Bills", type: "T-Bill", tenure: "91 Days", coupon: "Zero Coupon", rating: "Sovereign", yieldApprox: "6.65%", issuer: "RBI" },
  { name: "182-Day Treasury Bill", symbol: "TBILL182", category: "Treasury Bills", type: "T-Bill", tenure: "182 Days", coupon: "Zero Coupon", rating: "Sovereign", yieldApprox: "6.72%", issuer: "RBI" },
  { name: "364-Day Treasury Bill", symbol: "TBILL364", category: "Treasury Bills", type: "T-Bill", tenure: "364 Days", coupon: "Zero Coupon", rating: "Sovereign", yieldApprox: "6.80%", issuer: "RBI" },

  // State Development Loans
  { name: "Maharashtra SDL 2033", symbol: "SDLMH2033", category: "State Dev Loans", type: "SDL", tenure: "10 Years", coupon: "7.45%", rating: "Sovereign", yieldApprox: "7.40%", issuer: "Maharashtra" },
  { name: "Tamil Nadu SDL 2033", symbol: "SDLTN2033", category: "State Dev Loans", type: "SDL", tenure: "10 Years", coupon: "7.48%", rating: "Sovereign", yieldApprox: "7.42%", issuer: "Tamil Nadu" },
  { name: "Karnataka SDL 2033", symbol: "SDLKA2033", category: "State Dev Loans", type: "SDL", tenure: "10 Years", coupon: "7.42%", rating: "Sovereign", yieldApprox: "7.38%", issuer: "Karnataka" },
  { name: "Gujarat SDL 2028", symbol: "SDLGJ2028", category: "State Dev Loans", type: "SDL", tenure: "5 Years", coupon: "7.30%", rating: "Sovereign", yieldApprox: "7.25%", issuer: "Gujarat" },
  { name: "Rajasthan SDL 2035", symbol: "SDLRJ2035", category: "State Dev Loans", type: "SDL", tenure: "12 Years", coupon: "7.55%", rating: "Sovereign", yieldApprox: "7.50%", issuer: "Rajasthan" },

  // Corporate Bonds
  { name: "HDFC Bank NCD 2028", symbol: "HDFCNCD28", category: "Corporate Bonds", type: "Corporate", tenure: "5 Years", coupon: "7.85%", rating: "AAA", yieldApprox: "7.60%", issuer: "HDFC Bank" },
  { name: "ICICI Bank NCD 2027", symbol: "ICICINCD27", category: "Corporate Bonds", type: "Corporate", tenure: "4 Years", coupon: "7.75%", rating: "AAA", yieldApprox: "7.50%", issuer: "ICICI Bank" },
  { name: "SBI NCD 2029", symbol: "SBINCD29", category: "Corporate Bonds", type: "Corporate", tenure: "6 Years", coupon: "7.90%", rating: "AAA", yieldApprox: "7.65%", issuer: "SBI" },
  { name: "Reliance Industries NCD 2030", symbol: "RILNCD30", category: "Corporate Bonds", type: "Corporate", tenure: "7 Years", coupon: "7.95%", rating: "AAA", yieldApprox: "7.70%", issuer: "Reliance Industries" },
  { name: "NABARD Bond 2028", symbol: "NABARD28", category: "Corporate Bonds", type: "Corporate", tenure: "5 Years", coupon: "7.50%", rating: "AAA", yieldApprox: "7.35%", issuer: "NABARD" },
  { name: "PFC NCD 2029", symbol: "PFCNCD29", category: "Corporate Bonds", type: "Corporate", tenure: "6 Years", coupon: "8.05%", rating: "AAA", yieldApprox: "7.80%", issuer: "PFC" },
  { name: "REC NCD 2028", symbol: "RECNCD28", category: "Corporate Bonds", type: "Corporate", tenure: "5 Years", coupon: "8.00%", rating: "AAA", yieldApprox: "7.75%", issuer: "REC" },
  { name: "Tata Capital NCD 2027", symbol: "TATACAP27", category: "Corporate Bonds", type: "Corporate", tenure: "4 Years", coupon: "8.25%", rating: "AA+", yieldApprox: "8.00%", issuer: "Tata Capital" },
  { name: "Bajaj Finance NCD 2028", symbol: "BAJFIN28", category: "Corporate Bonds", type: "Corporate", tenure: "5 Years", coupon: "8.10%", rating: "AAA", yieldApprox: "7.85%", issuer: "Bajaj Finance" },
  { name: "Mahindra Finance NCD 2027", symbol: "MAHFIN27", category: "Corporate Bonds", type: "Corporate", tenure: "4 Years", coupon: "8.40%", rating: "AA+", yieldApprox: "8.15%", issuer: "Mahindra Finance" },

  // RBI Bonds
  { name: "RBI Floating Rate Savings Bond 2025", symbol: "RBIFRSB", category: "RBI Bonds", type: "RBI", tenure: "7 Years", coupon: "8.05% (floating)", rating: "Sovereign", yieldApprox: "8.05%", issuer: "RBI" },
  { name: "RBI 7.75% Savings Bond", symbol: "RBI775", category: "RBI Bonds", type: "RBI", tenure: "7 Years", coupon: "7.75%", rating: "Sovereign", yieldApprox: "7.75%", issuer: "RBI" },

  // Sovereign Gold Bonds
  { name: "Sovereign Gold Bond 2024-25 S1", symbol: "SGB2425S1", category: "Sovereign Gold Bonds", type: "SGB", tenure: "8 Years", coupon: "2.50%", rating: "Sovereign", yieldApprox: "2.50% + Gold", issuer: "RBI / Govt of India" },
  { name: "Sovereign Gold Bond 2023-24 S4", symbol: "SGB2324S4", category: "Sovereign Gold Bonds", type: "SGB", tenure: "8 Years", coupon: "2.50%", rating: "Sovereign", yieldApprox: "2.50% + Gold", issuer: "RBI / Govt of India" },
  { name: "Sovereign Gold Bond 2023-24 S2", symbol: "SGB2324S2", category: "Sovereign Gold Bonds", type: "SGB", tenure: "8 Years", coupon: "2.50%", rating: "Sovereign", yieldApprox: "2.50% + Gold", issuer: "RBI / Govt of India" },

  // Tax-Free Bonds
  { name: "IRFC Tax-Free Bond 2033", symbol: "IRFCTF33", category: "Tax-Free Bonds", type: "Tax-Free", tenure: "10 Years", coupon: "7.28%", rating: "AAA", yieldApprox: "7.28% (tax-free)", issuer: "IRFC" },
  { name: "NHAI Tax-Free Bond 2034", symbol: "NHAITF34", category: "Tax-Free Bonds", type: "Tax-Free", tenure: "15 Years", coupon: "7.35%", rating: "AAA", yieldApprox: "7.35% (tax-free)", issuer: "NHAI" },
  { name: "PFC Tax-Free Bond 2033", symbol: "PFCTF33", category: "Tax-Free Bonds", type: "Tax-Free", tenure: "10 Years", coupon: "7.22%", rating: "AAA", yieldApprox: "7.22% (tax-free)", issuer: "PFC" },
  { name: "REC Tax-Free Bond 2033", symbol: "RECTF33", category: "Tax-Free Bonds", type: "Tax-Free", tenure: "10 Years", coupon: "7.18%", rating: "AAA", yieldApprox: "7.18% (tax-free)", issuer: "REC" },
  { name: "HUDCO Tax-Free Bond 2034", symbol: "HUDCOTF34", category: "Tax-Free Bonds", type: "Tax-Free", tenure: "15 Years", coupon: "7.30%", rating: "AAA", yieldApprox: "7.30% (tax-free)", issuer: "HUDCO" },

  // Small Savings
  { name: "Public Provident Fund (PPF)", symbol: "PPF", category: "Small Savings", type: "SmallSavings", tenure: "15 Years", coupon: "7.10%", rating: "Sovereign", yieldApprox: "7.10%", issuer: "Govt of India" },
  { name: "National Savings Certificate (NSC)", symbol: "NSC", category: "Small Savings", type: "SmallSavings", tenure: "5 Years", coupon: "7.70%", rating: "Sovereign", yieldApprox: "7.70%", issuer: "Govt of India" },
  { name: "Sukanya Samriddhi Yojana", symbol: "SSY", category: "Small Savings", type: "SmallSavings", tenure: "21 Years", coupon: "8.20%", rating: "Sovereign", yieldApprox: "8.20%", issuer: "Govt of India" },
  { name: "Senior Citizens Savings Scheme", symbol: "SCSS", category: "Small Savings", type: "SmallSavings", tenure: "5 Years", coupon: "8.20%", rating: "Sovereign", yieldApprox: "8.20%", issuer: "Govt of India" },
  { name: "Kisan Vikas Patra (KVP)", symbol: "KVP", category: "Small Savings", type: "SmallSavings", tenure: "115 Months", coupon: "7.50%", rating: "Sovereign", yieldApprox: "7.50%", issuer: "Govt of India" },
  { name: "Post Office Monthly Income Scheme", symbol: "POMIS", category: "Small Savings", type: "SmallSavings", tenure: "5 Years", coupon: "7.40%", rating: "Sovereign", yieldApprox: "7.40%", issuer: "India Post" },
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
