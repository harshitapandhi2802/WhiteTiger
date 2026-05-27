export interface MutualFundEntry {
  name: string;
  symbol: string;
  category: string;
  amc: string;
  riskLevel: "Low" | "Moderate" | "High" | "Very High";
}

export const MUTUAL_FUNDS: MutualFundEntry[] = [
  // ── Large Cap ──
  { name: "SBI Bluechip Fund", symbol: "SBI-BLUECHIP", category: "Large Cap", amc: "SBI MF", riskLevel: "High" },
  { name: "Mirae Asset Large Cap Fund", symbol: "MIRAE-LC", category: "Large Cap", amc: "Mirae Asset", riskLevel: "High" },
  { name: "Axis Bluechip Fund", symbol: "AXIS-BLUECHIP", category: "Large Cap", amc: "Axis MF", riskLevel: "High" },
  { name: "ICICI Pru Bluechip Fund", symbol: "ICICI-BLUECHIP", category: "Large Cap", amc: "ICICI Pru", riskLevel: "High" },
  { name: "Canara Robeco Bluechip Fund", symbol: "CANARA-BLUECHIP", category: "Large Cap", amc: "Canara Robeco", riskLevel: "High" },

  // ── Mid Cap ──
  { name: "Kotak Emerging Equity Fund", symbol: "KOTAK-EMERGING", category: "Mid Cap", amc: "Kotak MF", riskLevel: "Very High" },
  { name: "HDFC Mid-Cap Opportunities", symbol: "HDFC-MIDCAP", category: "Mid Cap", amc: "HDFC MF", riskLevel: "Very High" },
  { name: "Axis Midcap Fund", symbol: "AXIS-MIDCAP", category: "Mid Cap", amc: "Axis MF", riskLevel: "Very High" },
  { name: "DSP Midcap Fund", symbol: "DSP-MIDCAP", category: "Mid Cap", amc: "DSP MF", riskLevel: "Very High" },
  { name: "SBI Magnum Midcap Fund", symbol: "SBI-MIDCAP", category: "Mid Cap", amc: "SBI MF", riskLevel: "Very High" },

  // ── Small Cap ──
  { name: "SBI Small Cap Fund", symbol: "SBI-SMALLCAP", category: "Small Cap", amc: "SBI MF", riskLevel: "Very High" },
  { name: "Nippon India Small Cap Fund", symbol: "NIPPON-SMALLCAP", category: "Small Cap", amc: "Nippon India", riskLevel: "Very High" },
  { name: "Axis Small Cap Fund", symbol: "AXIS-SMALLCAP", category: "Small Cap", amc: "Axis MF", riskLevel: "Very High" },
  { name: "Kotak Small Cap Fund", symbol: "KOTAK-SMALLCAP", category: "Small Cap", amc: "Kotak MF", riskLevel: "Very High" },
  { name: "Quant Small Cap Fund", symbol: "QUANT-SMALLCAP", category: "Small Cap", amc: "Quant MF", riskLevel: "Very High" },

  // ── Flexi Cap ──
  { name: "Parag Parikh Flexi Cap Fund", symbol: "PPFAS-FLEXI", category: "Flexi Cap", amc: "PPFAS MF", riskLevel: "Very High" },
  { name: "HDFC Flexi Cap Fund", symbol: "HDFC-FLEXICAP", category: "Flexi Cap", amc: "HDFC MF", riskLevel: "Very High" },
  { name: "UTI Flexi Cap Fund", symbol: "UTI-FLEXICAP", category: "Flexi Cap", amc: "UTI MF", riskLevel: "Very High" },
  { name: "Kotak Flexicap Fund", symbol: "KOTAK-FLEXICAP", category: "Flexi Cap", amc: "Kotak MF", riskLevel: "Very High" },
  { name: "Canara Robeco Flexi Cap Fund", symbol: "CANARA-FLEXICAP", category: "Flexi Cap", amc: "Canara Robeco", riskLevel: "Very High" },

  // ── ELSS (Tax Saving) ──
  { name: "Mirae Asset Tax Saver Fund", symbol: "MIRAE-ELSS", category: "ELSS", amc: "Mirae Asset", riskLevel: "Very High" },
  { name: "Axis Long Term Equity Fund", symbol: "AXIS-ELSS", category: "ELSS", amc: "Axis MF", riskLevel: "Very High" },
  { name: "Quant Tax Plan", symbol: "QUANT-ELSS", category: "ELSS", amc: "Quant MF", riskLevel: "Very High" },
  { name: "SBI Long Term Equity Fund", symbol: "SBI-ELSS", category: "ELSS", amc: "SBI MF", riskLevel: "Very High" },
  { name: "DSP Tax Saver Fund", symbol: "DSP-ELSS", category: "ELSS", amc: "DSP MF", riskLevel: "Very High" },

  // ── Index Funds ──
  { name: "UTI Nifty 50 Index Fund", symbol: "UTI-NIFTY50", category: "Index", amc: "UTI MF", riskLevel: "High" },
  { name: "HDFC Index Nifty 50 Fund", symbol: "HDFC-NIFTY50", category: "Index", amc: "HDFC MF", riskLevel: "High" },
  { name: "Motilal Oswal Nifty Midcap 150", symbol: "MOTILAL-MIDCAP150", category: "Index", amc: "Motilal Oswal", riskLevel: "Very High" },
  { name: "Motilal Oswal Nifty Smallcap 250", symbol: "MOTILAL-SC250", category: "Index", amc: "Motilal Oswal", riskLevel: "Very High" },
  { name: "Navi Nifty 50 Index Fund", symbol: "NAVI-NIFTY50", category: "Index", amc: "Navi MF", riskLevel: "High" },
  { name: "Motilal Oswal S&P 500 Index", symbol: "MOTILAL-SP500", category: "Index", amc: "Motilal Oswal", riskLevel: "Very High" },
  { name: "Motilal Oswal Nasdaq 100 FOF", symbol: "MOTILAL-NASDAQ", category: "Index", amc: "Motilal Oswal", riskLevel: "Very High" },

  // ── Hybrid / Balanced ──
  { name: "ICICI Pru Balanced Advantage", symbol: "ICICI-BAF", category: "Hybrid", amc: "ICICI Pru", riskLevel: "High" },
  { name: "HDFC Balanced Advantage Fund", symbol: "HDFC-BAF", category: "Hybrid", amc: "HDFC MF", riskLevel: "High" },
  { name: "SBI Equity Hybrid Fund", symbol: "SBI-HYBRID", category: "Hybrid", amc: "SBI MF", riskLevel: "High" },
  { name: "Kotak Equity Hybrid Fund", symbol: "KOTAK-HYBRID", category: "Hybrid", amc: "Kotak MF", riskLevel: "High" },

  // ── Debt ──
  { name: "HDFC Short Term Debt Fund", symbol: "HDFC-STDEBT", category: "Debt", amc: "HDFC MF", riskLevel: "Low" },
  { name: "SBI Magnum Medium Duration", symbol: "SBI-MEDDUR", category: "Debt", amc: "SBI MF", riskLevel: "Moderate" },
  { name: "ICICI Pru All Seasons Bond", symbol: "ICICI-BOND", category: "Debt", amc: "ICICI Pru", riskLevel: "Moderate" },
  { name: "Axis Banking & PSU Debt Fund", symbol: "AXIS-BPSU", category: "Debt", amc: "Axis MF", riskLevel: "Low" },
  { name: "Kotak Corporate Bond Fund", symbol: "KOTAK-CORPBOND", category: "Debt", amc: "Kotak MF", riskLevel: "Low" },

  // ── Sectoral / Thematic ──
  { name: "ICICI Pru Technology Fund", symbol: "ICICI-TECH", category: "Sectoral", amc: "ICICI Pru", riskLevel: "Very High" },
  { name: "SBI Healthcare Opportunities", symbol: "SBI-HEALTH", category: "Sectoral", amc: "SBI MF", riskLevel: "Very High" },
  { name: "Nippon India Pharma Fund", symbol: "NIPPON-PHARMA", category: "Sectoral", amc: "Nippon India", riskLevel: "Very High" },
  { name: "Quant Infrastructure Fund", symbol: "QUANT-INFRA", category: "Sectoral", amc: "Quant MF", riskLevel: "Very High" },
  { name: "ICICI Pru India Opportunities", symbol: "ICICI-OPPORTUNITIES", category: "Sectoral", amc: "ICICI Pru", riskLevel: "Very High" },
  { name: "Tata Digital India Fund", symbol: "TATA-DIGITAL", category: "Sectoral", amc: "Tata MF", riskLevel: "Very High" },
  { name: "Quant Manufacturing Fund", symbol: "QUANT-MANUFACTURING", category: "Sectoral", amc: "Quant MF", riskLevel: "Very High" },
  { name: "ICICI Pru Banking & Fin", symbol: "ICICI-BANKING", category: "Sectoral", amc: "ICICI Pru", riskLevel: "Very High" },
];

export const MF_CATEGORIES = [
  "All",
  "Large Cap",
  "Mid Cap",
  "Small Cap",
  "Flexi Cap",
  "ELSS",
  "Index",
  "Hybrid",
  "Debt",
  "Sectoral",
];

export function searchMutualFunds(query: string, limit = 8): MutualFundEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: { fund: MutualFundEntry; score: number }[] = [];

  for (const f of MUTUAL_FUNDS) {
    const name = f.name.toLowerCase();
    const sym = f.symbol.toLowerCase();
    const cat = f.category.toLowerCase();
    const amc = f.amc.toLowerCase();

    let score = 0;
    if (name === q || sym === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (sym.startsWith(q)) score = 75;
    else if (amc.startsWith(q)) score = 70;
    else if (name.includes(q)) score = 50;
    else if (sym.includes(q) || amc.includes(q)) score = 45;
    else if (cat.includes(q)) score = 25;
    else {
      const words = q.split(/\s+/);
      const matched = words.filter(w => name.includes(w) || sym.includes(w) || amc.includes(w));
      if (matched.length > 0) score = 10 + matched.length * 15;
    }
    if (score > 0) results.push({ fund: f, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit).map(r => r.fund);
}
