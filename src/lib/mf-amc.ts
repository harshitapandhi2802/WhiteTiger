// ═══════════════════════════════════════════════════════════════════════
// AMC DIRECTORY — Institutional-Grade AMC Intelligence Engine
// Covers all major Indian Asset Management Companies
// ═══════════════════════════════════════════════════════════════════════

function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

export interface AMCData {
  name: string;
  slug: string;
  parentCompany: string;
  aum: string;
  aumNumeric: number; // in Cr for sorting
  marketShare: number;
  numSchemes: number;
  equityAUM: string;
  debtAUM: string;
  hybridAUM: string;
  etfAUM: string;
  yearsOfOperation: number;
  category: "Large" | "Mid" | "Small" | "Boutique";
  expenseCompetitiveness: "Very Low" | "Low" | "Average" | "High";
  historicalConsistency: "Excellent" | "Good" | "Average" | "Below Average";
  ownershipStructure: string;
  ceo: string;
  cio: string;
  // Generated scores
  amcScore: number;
  performanceConsistency: number;
  riskControl: number;
  costEfficiency: number;
  managerStability: number;
  fundQuality: number;
  scaleGovernance: number;
  // Features
  topFunds: string[];
  strengths: string[];
  weaknesses: string[];
}

const AMC_RAW: Omit<AMCData, "amcScore" | "performanceConsistency" | "riskControl" | "costEfficiency" | "managerStability" | "fundQuality" | "scaleGovernance">[] = [
  { name: "SBI Mutual Fund", slug: "sbi-mf", parentCompany: "SBI (State Bank of India)", aum: "₹10.5L Cr", aumNumeric: 1050000, marketShare: 16.8, numSchemes: 152, equityAUM: "₹4.2L Cr", debtAUM: "₹3.8L Cr", hybridAUM: "₹1.5L Cr", etfAUM: "₹1.0L Cr", yearsOfOperation: 37, category: "Large", expenseCompetitiveness: "Low", historicalConsistency: "Good", ownershipStructure: "SBI + AMUNDI (France) JV", ceo: "Shamsher Singh", cio: "Navneet Munot (prev)", topFunds: ["SBI Bluechip", "SBI Small Cap", "SBI Magnum Midcap", "SBI ELSS"], strengths: ["Largest AUM", "Strong brand trust", "Wide distribution"], weaknesses: ["Large fund sizes limit agility", "Some underperformers"] },
  { name: "HDFC Mutual Fund", slug: "hdfc-mf", parentCompany: "HDFC Bank + Abrdn", aum: "₹7.8L Cr", aumNumeric: 780000, marketShare: 12.5, numSchemes: 124, equityAUM: "₹3.5L Cr", debtAUM: "₹2.5L Cr", hybridAUM: "₹1.2L Cr", etfAUM: "₹0.6L Cr", yearsOfOperation: 25, category: "Large", expenseCompetitiveness: "Average", historicalConsistency: "Good", ownershipStructure: "HDFC Bank (subsidiary)", ceo: "Navneet Munot", cio: "Chirag Setalvad", topFunds: ["HDFC Flexi Cap", "HDFC Mid-Cap Opportunities", "HDFC Balanced Advantage", "HDFC Short Term Debt"], strengths: ["Consistent value approach", "Strong fixed income", "Experienced team"], weaknesses: ["Higher expense ratios", "Value bias can underperform in growth markets"] },
  { name: "ICICI Prudential MF", slug: "icici-pru-mf", parentCompany: "ICICI Bank + Prudential plc", aum: "₹8.2L Cr", aumNumeric: 820000, marketShare: 13.1, numSchemes: 145, equityAUM: "₹3.8L Cr", debtAUM: "₹2.8L Cr", hybridAUM: "₹1.1L Cr", etfAUM: "₹0.5L Cr", yearsOfOperation: 31, category: "Large", expenseCompetitiveness: "Average", historicalConsistency: "Good", ownershipStructure: "ICICI Bank + Prudential plc JV", ceo: "Nimesh Shah", cio: "S. Naren", topFunds: ["ICICI Pru Bluechip", "ICICI Pru BAF", "ICICI Pru Technology", "ICICI Pru Value Discovery"], strengths: ["Diversified product range", "Strong risk management", "Innovation leader"], weaknesses: ["Complex product lineup", "Some sectoral funds volatile"] },
  { name: "Kotak Mutual Fund", slug: "kotak-mf", parentCompany: "Kotak Mahindra Bank", aum: "₹5.2L Cr", aumNumeric: 520000, marketShare: 8.3, numSchemes: 98, equityAUM: "₹2.5L Cr", debtAUM: "₹1.8L Cr", hybridAUM: "₹0.6L Cr", etfAUM: "₹0.3L Cr", yearsOfOperation: 26, category: "Large", expenseCompetitiveness: "Low", historicalConsistency: "Excellent", ownershipStructure: "Kotak Mahindra Bank (100%)", ceo: "Nilesh Shah", cio: "Harsha Upadhyaya", topFunds: ["Kotak Emerging Equity", "Kotak Flexicap", "Kotak Equity Hybrid", "Kotak Small Cap"], strengths: ["Consistent performance", "Low-cost leader", "Prudent management"], weaknesses: ["Conservative approach may miss rallies"] },
  { name: "Nippon India MF", slug: "nippon-india-mf", parentCompany: "Nippon Life Insurance (Japan)", aum: "₹5.5L Cr", aumNumeric: 550000, marketShare: 8.8, numSchemes: 112, equityAUM: "₹2.8L Cr", debtAUM: "₹1.5L Cr", hybridAUM: "₹0.7L Cr", etfAUM: "₹0.5L Cr", yearsOfOperation: 28, category: "Large", expenseCompetitiveness: "Average", historicalConsistency: "Good", ownershipStructure: "Nippon Life Insurance (Japan) — 100%", ceo: "Sundeep Sikka", cio: "Sailesh Raj Bhan", topFunds: ["Nippon India Small Cap", "Nippon India Large Cap", "Nippon India Pharma"], strengths: ["Strong small-cap track record", "Global parentage", "Wide distribution"], weaknesses: ["Fund manager changes", "Some large fund sizes"] },
  { name: "Axis Mutual Fund", slug: "axis-mf", parentCompany: "Axis Bank + Schroders", aum: "₹3.2L Cr", aumNumeric: 320000, marketShare: 5.1, numSchemes: 82, equityAUM: "₹1.5L Cr", debtAUM: "₹1.2L Cr", hybridAUM: "₹0.3L Cr", etfAUM: "₹0.2L Cr", yearsOfOperation: 15, category: "Mid", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "Axis Bank + Schroder Investment Mgmt", ceo: "B. Gopkumar", cio: "Ashish Naik", topFunds: ["Axis Bluechip", "Axis Midcap", "Axis Small Cap", "Axis ELSS"], strengths: ["Quality-growth focused", "Strong brand", "Consistent equity"], weaknesses: ["Key manager departure risk", "Underperformance in value cycles"] },
  { name: "Mirae Asset MF", slug: "mirae-asset-mf", parentCompany: "Mirae Asset (South Korea)", aum: "₹2.1L Cr", aumNumeric: 210000, marketShare: 3.4, numSchemes: 52, equityAUM: "₹1.4L Cr", debtAUM: "₹0.4L Cr", hybridAUM: "₹0.2L Cr", etfAUM: "₹0.1L Cr", yearsOfOperation: 16, category: "Mid", expenseCompetitiveness: "Very Low", historicalConsistency: "Excellent", ownershipStructure: "Mirae Asset Global (Korea) — 100%", ceo: "Swarup Mohanty", cio: "Neelesh Surana", topFunds: ["Mirae Asset Large Cap", "Mirae Asset ELSS", "Mirae Asset Emerging Bluechip"], strengths: ["Best-in-class expense ratios", "Consistent alpha generation", "Growth-at-reasonable-price"], weaknesses: ["Limited product range", "Smaller brand awareness"] },
  { name: "DSP Mutual Fund", slug: "dsp-mf", parentCompany: "DSP Group (India)", aum: "₹1.8L Cr", aumNumeric: 180000, marketShare: 2.9, numSchemes: 65, equityAUM: "₹1.0L Cr", debtAUM: "₹0.5L Cr", hybridAUM: "₹0.2L Cr", etfAUM: "₹0.1L Cr", yearsOfOperation: 28, category: "Mid", expenseCompetitiveness: "Low", historicalConsistency: "Good", ownershipStructure: "DSP Group (independent Indian)", ceo: "Kalpen Parekh", cio: "Vinit Sambre", topFunds: ["DSP Midcap", "DSP Tax Saver", "DSP Flexi Cap", "DSP Small Cap"], strengths: ["Research-driven", "Transparent communication", "Strong midcap expertise"], weaknesses: ["Smaller scale", "Less brand recognition"] },
  { name: "Parag Parikh MF (PPFAS)", slug: "ppfas-mf", parentCompany: "PPFAS (India)", aum: "₹0.95L Cr", aumNumeric: 95000, marketShare: 1.5, numSchemes: 12, equityAUM: "₹0.75L Cr", debtAUM: "₹0.15L Cr", hybridAUM: "₹0.05L Cr", etfAUM: "₹0L Cr", yearsOfOperation: 11, category: "Boutique", expenseCompetitiveness: "Very Low", historicalConsistency: "Excellent", ownershipStructure: "PPFAS — Founder-led (Parag Parikh legacy)", ceo: "Neil Parag Parikh", cio: "Rajeev Thakkar", topFunds: ["Parag Parikh Flexi Cap", "PPFAS Liquid", "PPFAS Tax Saver"], strengths: ["Cult-status flexi cap fund", "Founder-led conviction", "International diversification", "Lowest expenses"], weaknesses: ["Very concentrated product line", "Single fund dominance risk"] },
  { name: "Aditya Birla Sun Life MF", slug: "absl-mf", parentCompany: "Aditya Birla Group + Sun Life (Canada)", aum: "₹3.8L Cr", aumNumeric: 380000, marketShare: 6.1, numSchemes: 105, equityAUM: "₹1.8L Cr", debtAUM: "₹1.4L Cr", hybridAUM: "₹0.4L Cr", etfAUM: "₹0.2L Cr", yearsOfOperation: 30, category: "Large", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "Aditya Birla Capital + Sun Life JV", ceo: "A. Balasubramanian", cio: "Mahesh Patil", topFunds: ["ABSL Frontline Equity", "ABSL Tax Relief 96", "ABSL Corporate Bond"], strengths: ["Wide product range", "Strong fixed income", "Long track record"], weaknesses: ["Inconsistent equity performance", "Higher expenses"] },
  { name: "UTI Mutual Fund", slug: "uti-mf", parentCompany: "SBI + LIC + PNB + BoB", aum: "₹3.0L Cr", aumNumeric: 300000, marketShare: 4.8, numSchemes: 95, equityAUM: "₹1.2L Cr", debtAUM: "₹1.0L Cr", hybridAUM: "₹0.5L Cr", etfAUM: "₹0.3L Cr", yearsOfOperation: 61, category: "Large", expenseCompetitiveness: "Low", historicalConsistency: "Average", ownershipStructure: "T. Rowe Price + SBI + LIC + PNB + BoB", ceo: "Imtaiyazur Rahman", cio: "V. Srivatsa", topFunds: ["UTI Flexi Cap", "UTI Nifty 50 Index", "UTI Mastershare"], strengths: ["Oldest AMC in India", "Strong index fund range", "Government backing"], weaknesses: ["Legacy image", "Slower innovation"] },
  { name: "Tata Mutual Fund", slug: "tata-mf", parentCompany: "Tata Sons", aum: "₹1.6L Cr", aumNumeric: 160000, marketShare: 2.6, numSchemes: 72, equityAUM: "₹0.9L Cr", debtAUM: "₹0.4L Cr", hybridAUM: "₹0.2L Cr", etfAUM: "₹0.1L Cr", yearsOfOperation: 29, category: "Mid", expenseCompetitiveness: "Low", historicalConsistency: "Good", ownershipStructure: "Tata Sons (100%)", ceo: "Prathit Bhobe", cio: "Rahul Singh", topFunds: ["Tata Digital India", "Tata Mid Cap Growth", "Tata Equity PE"], strengths: ["Tata brand trust", "Strong sectoral funds", "Reasonable costs"], weaknesses: ["Smaller scale", "Limited product variety"] },
  { name: "Motilal Oswal MF", slug: "motilal-oswal-mf", parentCompany: "Motilal Oswal Financial", aum: "₹1.1L Cr", aumNumeric: 110000, marketShare: 1.8, numSchemes: 42, equityAUM: "₹0.7L Cr", debtAUM: "₹0.1L Cr", hybridAUM: "₹0.1L Cr", etfAUM: "₹0.2L Cr", yearsOfOperation: 14, category: "Mid", expenseCompetitiveness: "Low", historicalConsistency: "Good", ownershipStructure: "Motilal Oswal Financial — Listed", ceo: "Navin Agarwal", cio: "Siddharth Bothra", topFunds: ["Motilal Oswal Nifty Midcap 150", "Motilal Oswal S&P 500", "Motilal Oswal Nasdaq 100"], strengths: ["Best passive/index fund range", "International index expertise", "Research-driven"], weaknesses: ["Smaller active fund range", "Higher TER on some"] },
  { name: "Quant Mutual Fund", slug: "quant-mf", parentCompany: "Quant Group (India)", aum: "₹0.95L Cr", aumNumeric: 95000, marketShare: 1.5, numSchemes: 28, equityAUM: "₹0.8L Cr", debtAUM: "₹0.1L Cr", hybridAUM: "₹0.05L Cr", etfAUM: "₹0L Cr", yearsOfOperation: 12, category: "Boutique", expenseCompetitiveness: "Average", historicalConsistency: "Good", ownershipStructure: "Quant Money Managers (promoter-led)", ceo: "Sandeep Tandon", cio: "Sandeep Tandon", topFunds: ["Quant Small Cap", "Quant Active", "Quant Infrastructure", "Quant ELSS"], strengths: ["Contrarian approach", "Strong recent performance", "High-conviction bets"], weaknesses: ["Key-man risk", "High turnover portfolio", "Rapid AUM growth concern"] },
  { name: "Bandhan Mutual Fund", slug: "bandhan-mf", parentCompany: "Bandhan Financial Holdings", aum: "₹0.9L Cr", aumNumeric: 90000, marketShare: 1.4, numSchemes: 55, equityAUM: "₹0.3L Cr", debtAUM: "₹0.4L Cr", hybridAUM: "₹0.15L Cr", etfAUM: "₹0.05L Cr", yearsOfOperation: 8, category: "Small", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "Bandhan Financial Holdings (prev. IDFC MF)", ceo: "Vishal Kapoor", cio: "Suyash Choudhary", topFunds: ["Bandhan Flexi Cap", "Bandhan Core Equity", "Bandhan Corporate Bond"], strengths: ["Good fixed income team", "Growing equity track record"], weaknesses: ["Brand transition", "Smaller scale"] },
  { name: "Franklin Templeton MF", slug: "franklin-templeton-mf", parentCompany: "Franklin Templeton (USA)", aum: "₹0.7L Cr", aumNumeric: 70000, marketShare: 1.1, numSchemes: 58, equityAUM: "₹0.35L Cr", debtAUM: "₹0.2L Cr", hybridAUM: "₹0.1L Cr", etfAUM: "₹0.05L Cr", yearsOfOperation: 28, category: "Mid", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "Franklin Templeton (USA) — 100%", ceo: "Sanjay Sapre", cio: "Anand Radhakrishnan", topFunds: ["Franklin India Bluechip", "Franklin India Prima", "Franklin India Feeder US"], strengths: ["Global research backing", "Strong equity pedigree"], weaknesses: ["Debt crisis legacy (2020)", "Reduced brand trust"] },
  { name: "Edelweiss Mutual Fund", slug: "edelweiss-mf", parentCompany: "Edelweiss Financial", aum: "₹0.5L Cr", aumNumeric: 50000, marketShare: 0.8, numSchemes: 38, equityAUM: "₹0.2L Cr", debtAUM: "₹0.15L Cr", hybridAUM: "₹0.1L Cr", etfAUM: "₹0.05L Cr", yearsOfOperation: 16, category: "Small", expenseCompetitiveness: "Low", historicalConsistency: "Average", ownershipStructure: "Edelweiss Financial — Listed", ceo: "Radhika Gupta", cio: "Trideep Bhattacharya", topFunds: ["Edelweiss BAF", "Edelweiss Mid Cap", "Edelweiss Flexi Cap"], strengths: ["Dynamic balanced advantage", "Rising star CEO", "Innovation focus"], weaknesses: ["Smaller scale", "Limited track record in some categories"] },
  { name: "Canara Robeco MF", slug: "canara-robeco-mf", parentCompany: "Canara Bank + Robeco (Netherlands)", aum: "₹1.0L Cr", aumNumeric: 100000, marketShare: 1.6, numSchemes: 44, equityAUM: "₹0.6L Cr", debtAUM: "₹0.25L Cr", hybridAUM: "₹0.1L Cr", etfAUM: "₹0.05L Cr", yearsOfOperation: 31, category: "Mid", expenseCompetitiveness: "Low", historicalConsistency: "Good", ownershipStructure: "Canara Bank + Robeco (Netherlands) JV", ceo: "Rajnish Narula", cio: "Shridatta Bhandwaldar", topFunds: ["Canara Robeco Bluechip", "Canara Robeco Flexi Cap", "Canara Robeco ELSS"], strengths: ["Consistent alpha generation", "Under-the-radar quality", "Low expense ratios"], weaknesses: ["Low brand awareness", "Limited distribution reach"] },
  { name: "HSBC Mutual Fund", slug: "hsbc-mf", parentCompany: "HSBC Holdings (UK)", aum: "₹0.8L Cr", aumNumeric: 80000, marketShare: 1.3, numSchemes: 48, equityAUM: "₹0.35L Cr", debtAUM: "₹0.3L Cr", hybridAUM: "₹0.1L Cr", etfAUM: "₹0.05L Cr", yearsOfOperation: 22, category: "Mid", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "HSBC Global Asset Mgmt — 100%", ceo: "Tushar Pradhan", cio: "Neelotpal Sahai", topFunds: ["HSBC Flexi Cap", "HSBC Small Cap", "HSBC Value Fund"], strengths: ["Global research access", "Improving track record"], weaknesses: ["Lower brand recall in MF space", "Inconsistent past"] },
  { name: "Invesco Mutual Fund", slug: "invesco-mf", parentCompany: "Invesco (USA)", aum: "₹0.6L Cr", aumNumeric: 60000, marketShare: 1.0, numSchemes: 36, equityAUM: "₹0.3L Cr", debtAUM: "₹0.2L Cr", hybridAUM: "₹0.08L Cr", etfAUM: "₹0.02L Cr", yearsOfOperation: 16, category: "Small", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "Invesco Ltd (USA) — 100%", ceo: "Saurabh Nanavati", cio: "Taher Badshah", topFunds: ["Invesco India Contra", "Invesco India Midcap", "Invesco India Flexi Cap"], strengths: ["Contrarian investing philosophy", "Global backing"], weaknesses: ["Smaller brand", "Limited scheme range"] },
  { name: "WhiteOak Capital MF", slug: "whiteoak-mf", parentCompany: "WhiteOak Capital (India)", aum: "₹0.45L Cr", aumNumeric: 45000, marketShare: 0.7, numSchemes: 16, equityAUM: "₹0.35L Cr", debtAUM: "₹0.08L Cr", hybridAUM: "₹0.02L Cr", etfAUM: "₹0L Cr", yearsOfOperation: 4, category: "Boutique", expenseCompetitiveness: "Low", historicalConsistency: "Good", ownershipStructure: "Prashant Khemka (Founder) — ex Goldman Sachs CIO", ceo: "Aashish Somaiyaa", cio: "Prashant Khemka", topFunds: ["WhiteOak Flexi Cap", "WhiteOak Large & Mid Cap", "WhiteOak Mid Cap"], strengths: ["Pedigreed CIO (ex-Goldman Sachs)", "Research-driven", "Clean start with best practices"], weaknesses: ["Very new", "Limited track record", "Small AUM"] },
  { name: "PGIM India MF", slug: "pgim-mf", parentCompany: "Prudential Financial (USA)", aum: "₹0.35L Cr", aumNumeric: 35000, marketShare: 0.6, numSchemes: 28, equityAUM: "₹0.15L Cr", debtAUM: "₹0.12L Cr", hybridAUM: "₹0.05L Cr", etfAUM: "₹0.03L Cr", yearsOfOperation: 13, category: "Small", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "PGIM (Prudential Financial USA) — 100%", ceo: "Ajit Menon", cio: "Aniruddha Naha", topFunds: ["PGIM India Midcap Opportunities", "PGIM India Flexi Cap"], strengths: ["Strong midcap fund", "Global research access"], weaknesses: ["Very small scale", "Limited brand"] },
  { name: "LIC Mutual Fund", slug: "lic-mf", parentCompany: "LIC of India", aum: "₹0.45L Cr", aumNumeric: 45000, marketShare: 0.7, numSchemes: 42, equityAUM: "₹0.15L Cr", debtAUM: "₹0.2L Cr", hybridAUM: "₹0.08L Cr", etfAUM: "₹0.02L Cr", yearsOfOperation: 35, category: "Small", expenseCompetitiveness: "Average", historicalConsistency: "Below Average", ownershipStructure: "LIC of India — 100%", ceo: "T. S. Ramakrishnan", cio: "Yogesh Patil", topFunds: ["LIC MF Large & Mid Cap", "LIC MF Flexi Cap"], strengths: ["LIC brand and distribution", "Government backing"], weaknesses: ["Poor performance track record", "Slow innovation"] },
  { name: "JM Financial MF", slug: "jm-mf", parentCompany: "JM Financial Group", aum: "₹0.2L Cr", aumNumeric: 20000, marketShare: 0.3, numSchemes: 22, equityAUM: "₹0.1L Cr", debtAUM: "₹0.06L Cr", hybridAUM: "₹0.03L Cr", etfAUM: "₹0.01L Cr", yearsOfOperation: 30, category: "Boutique", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "JM Financial Group — Indian private", ceo: "Asit Bhatia", cio: "Satish Ramanathan", topFunds: ["JM Flexicap", "JM Value Fund"], strengths: ["Long legacy", "Resurgent performance"], weaknesses: ["Very small scale", "Limited awareness"] },
  { name: "Union Mutual Fund", slug: "union-mf", parentCompany: "Union Bank of India + KBC (Belgium)", aum: "₹0.18L Cr", aumNumeric: 18000, marketShare: 0.3, numSchemes: 24, equityAUM: "₹0.08L Cr", debtAUM: "₹0.06L Cr", hybridAUM: "₹0.03L Cr", etfAUM: "₹0.01L Cr", yearsOfOperation: 13, category: "Small", expenseCompetitiveness: "Average", historicalConsistency: "Average", ownershipStructure: "Union Bank of India + KBC Asset Mgmt (Belgium)", ceo: "Vinay Paharia", cio: "Vinay Paharia", topFunds: ["Union Flexi Cap", "Union Balanced Advantage"], strengths: ["Bank-backed distribution"], weaknesses: ["Very small scale", "Limited track record"] },
];

function generateAMCScores(raw: typeof AMC_RAW[0]): AMCData {
  const rng = seededRng(raw.slug + "2026");
  const base = raw.category === "Large" ? 68 : raw.category === "Mid" ? 62 : raw.category === "Boutique" ? 58 : 55;
  const consistencyBonus = raw.historicalConsistency === "Excellent" ? 15 : raw.historicalConsistency === "Good" ? 8 : raw.historicalConsistency === "Average" ? 0 : -5;
  const costBonus = raw.expenseCompetitiveness === "Very Low" ? 12 : raw.expenseCompetitiveness === "Low" ? 7 : raw.expenseCompetitiveness === "Average" ? 0 : -5;
  const scaleBonus = Math.min(10, raw.aumNumeric / 100000);
  const yearBonus = Math.min(6, raw.yearsOfOperation / 8);

  const performanceConsistency = Math.min(98, Math.round(base + consistencyBonus + rng() * 10));
  const riskControl = Math.min(98, Math.round(base + consistencyBonus * 0.8 + rng() * 12));
  const costEfficiency = Math.min(98, Math.round(55 + costBonus + rng() * 15));
  const managerStability = Math.min(98, Math.round(base + yearBonus + rng() * 12));
  const fundQuality = Math.min(98, Math.round(base + consistencyBonus + costBonus * 0.3 + rng() * 8));
  const scaleGovernance = Math.min(98, Math.round(55 + scaleBonus + yearBonus + rng() * 10));

  const amcScore = Math.round(
    performanceConsistency * 0.25 +
    riskControl * 0.15 +
    costEfficiency * 0.10 +
    managerStability * 0.15 +
    fundQuality * 0.20 +
    scaleGovernance * 0.15
  );

  return { ...raw, amcScore, performanceConsistency, riskControl, costEfficiency, managerStability, fundQuality, scaleGovernance };
}

export const AMC_DIRECTORY: AMCData[] = AMC_RAW.map(generateAMCScores).sort((a, b) => b.aumNumeric - a.aumNumeric);

export function getAMCBySlug(slug: string): AMCData | undefined {
  return AMC_DIRECTORY.find(a => a.slug === slug);
}

export function getAMCsByCategory(category: AMCData["category"]): AMCData[] {
  return AMC_DIRECTORY.filter(a => a.category === category);
}

export function searchAMCs(query: string): AMCData[] {
  if (!query.trim()) return AMC_DIRECTORY;
  const q = query.toLowerCase();
  return AMC_DIRECTORY.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.parentCompany.toLowerCase().includes(q) ||
    a.slug.includes(q)
  );
}
