// ═══════════════════════════════════════════════════════════════
// Mutual Fund Intelligence — Institutional Data Models
// Morningstar + Value Research + Bloomberg Fund Analytics
// ═══════════════════════════════════════════════════════════════

export interface MFBasicInfo {
  fundName: string;
  amcName: string;
  category: string;
  launchDate: string;
  benchmark: string;
  aum: string;
  expenseRatio: string;
  exitLoad: string;
  minInvestment: string;
  sipMinimum: string;
  lockIn: string;
  fundManager: string;
  fundManagerExp: string;
  riskometer: string;
  investmentObjective: string;
  fundStyle: string;
  nav: number;
}

export interface MFReturns {
  period: string;
  fundReturn: number;
  benchmarkReturn: number;
  categoryAvg: number;
  alpha: number;
}

export interface MFHolding {
  stock: string;
  weightage: number;
  sector: string;
  pe: number;
  roe: number;
  outlook: string;
}

export interface MFSectorAllocation {
  sector: string;
  allocation: number;
  change: string;
}

export interface MFRiskMetrics {
  beta: number;
  alpha: number;
  sharpeRatio: number;
  sortinoRatio: number;
  standardDeviation: number;
  maxDrawdown: number;
  informationRatio: number;
  treynorRatio: number;
  downsideRisk: number;
  var95: number;
}

export interface MFFundManagerAnalysis {
  name: string;
  experience: string;
  trackRecord: string;
  investmentStyle: string;
  alphaGeneration: string;
  riskManagement: string;
  consistency: string;
  managerScore: number;
  consistencyScore: number;
  riskMgmtScore: number;
  reliabilityScore: number;
}

export interface MFInvestorPerspective {
  wealthCreationScore: number;
  sipSuitabilityScore: number;
  retirementScore: number;
  aggressiveScore: number;
  conservativeScore: number;
  longTermQualityScore: number;
  valuationComfort: string;
  downsideRisk: string;
  portfolioStrength: string;
  concentrationRisk: string;
  crashResilience: string;
  marketCycleOutlook: string;
  investorVerdict: string;
}

export interface MFAIScore {
  overallScore: number;
  fundamentalScore: number;
  riskScore: number;
  valuationScore: number;
  stabilityScore: number;
  compoundingScore: number;
  alphaScore: number;
  expenseEfficiency: number;
  managerQuality: number;
  rank: number;
  categoryRank: number;
}

export interface MFMacroLinkage {
  factor: string;
  currentState: string;
  fundImpact: string;
  direction: "positive" | "negative" | "neutral";
}

export interface MFStressScenario {
  scenario: string;
  estimatedImpact: number;
  resilience: string;
  explanation: string;
}

export interface MFPerformanceDriver {
  driver: string;
  contribution: string;
  direction: "positive" | "negative" | "neutral";
}

export interface MFNewsEvent {
  title: string;
  date: string;
  impact: "positive" | "negative" | "neutral";
  severity: "high" | "medium" | "low";
  explanation: string;
}

export interface MFIntelligenceData {
  basicInfo: MFBasicInfo;
  returns: MFReturns[];
  topHoldings: MFHolding[];
  sectorAllocation: MFSectorAllocation[];
  marketCapAllocation: { segment: string; allocation: number }[];
  riskMetrics: MFRiskMetrics;
  fundManager: MFFundManagerAnalysis;
  investorPerspective: MFInvestorPerspective;
  aiScores: MFAIScore;
  macroLinkages: MFMacroLinkage[];
  stressScenarios: MFStressScenario[];
  performanceDrivers: MFPerformanceDriver[];
  newsEvents: MFNewsEvent[];
  sipProjection: { year: number; invested: number; value: number }[];
  fundamentalExplanation: string;
  aiRecommendation: string;
}

export const MF_DASHBOARD_SECTIONS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "returns", label: "Returns", icon: "📈" },
  { id: "portfolio", label: "Portfolio", icon: "💼" },
  { id: "risk", label: "Risk", icon: "🛡️" },
  { id: "manager", label: "Fund Manager", icon: "👤" },
  { id: "investor", label: "Investor View", icon: "🎯" },
  { id: "scores", label: "AI Scores", icon: "🤖" },
  { id: "macro", label: "Macro Link", icon: "🌍" },
  { id: "stress", label: "Stress Test", icon: "⚡" },
  { id: "drivers", label: "Drivers", icon: "🔍" },
  { id: "news", label: "News", icon: "📰" },
  { id: "sip", label: "SIP Planner", icon: "💰" },
] as const;

export type MFSectionId = typeof MF_DASHBOARD_SECTIONS[number]["id"];

export const AMC_LIST = [
  "All AMCs", "SBI MF", "ICICI Prudential MF", "HDFC MF", "Nippon India MF",
  "Kotak MF", "Axis MF", "DSP MF", "Parag Parikh MF", "Mirae Asset MF",
  "UTI MF", "Aditya Birla SL MF", "Motilal Oswal MF", "Quant MF",
  "Tata MF", "Franklin Templeton", "Edelweiss MF", "Canara Robeco MF",
  "Bandhan MF", "HSBC MF", "Invesco MF", "Sundaram MF", "Mahindra Manulife MF", "LIC MF",
];

export const MF_CATEGORIES = [
  "All Categories", "Large Cap", "Mid Cap", "Small Cap", "Flexi Cap", "Multi Cap",
  "ELSS", "Index Fund", "ETF", "Sectoral/Thematic", "Banking", "Pharma", "Technology",
  "Infrastructure", "International", "Debt", "Liquid", "Corporate Bond",
  "Dynamic Bond", "Hybrid", "Balanced Advantage", "Arbitrage", "Gold", "FoF",
];

// Popular funds for the heatmap / quick access
export const POPULAR_FUNDS = [
  { name: "SBI Small Cap Fund", amc: "SBI MF", category: "Small Cap", symbol: "SBI_SC" },
  { name: "Parag Parikh Flexi Cap Fund", amc: "Parag Parikh MF", category: "Flexi Cap", symbol: "PPFAS_FC" },
  { name: "HDFC Mid Cap Opportunities", amc: "HDFC MF", category: "Mid Cap", symbol: "HDFC_MC" },
  { name: "Quant Small Cap Fund", amc: "Quant MF", category: "Small Cap", symbol: "QUANT_SC" },
  { name: "Mirae Asset Large Cap Fund", amc: "Mirae Asset MF", category: "Large Cap", symbol: "MIRAE_LC" },
  { name: "ICICI Pru Bluechip Fund", amc: "ICICI Prudential MF", category: "Large Cap", symbol: "ICICI_BC" },
  { name: "Axis Small Cap Fund", amc: "Axis MF", category: "Small Cap", symbol: "AXIS_SC" },
  { name: "Nippon India Small Cap Fund", amc: "Nippon India MF", category: "Small Cap", symbol: "NIP_SC" },
  { name: "Kotak Emerging Equity Fund", amc: "Kotak MF", category: "Mid Cap", symbol: "KOT_EE" },
  { name: "DSP Mid Cap Fund", amc: "DSP MF", category: "Mid Cap", symbol: "DSP_MC" },
  { name: "Motilal Oswal Midcap Fund", amc: "Motilal Oswal MF", category: "Mid Cap", symbol: "MO_MC" },
  { name: "SBI Contra Fund", amc: "SBI MF", category: "Contra", symbol: "SBI_CON" },
  { name: "Canara Robeco Bluechip", amc: "Canara Robeco MF", category: "Large Cap", symbol: "CR_BC" },
  { name: "UTI Flexi Cap Fund", amc: "UTI MF", category: "Flexi Cap", symbol: "UTI_FC" },
  { name: "HDFC Balanced Advantage", amc: "HDFC MF", category: "Balanced Advantage", symbol: "HDFC_BAF" },
  { name: "Tata Digital India Fund", amc: "Tata MF", category: "Sectoral/Thematic", symbol: "TATA_DIG" },
  { name: "ICICI Pru Technology Fund", amc: "ICICI Prudential MF", category: "Technology", symbol: "ICICI_TECH" },
  { name: "SBI PSU Fund", amc: "SBI MF", category: "Sectoral/Thematic", symbol: "SBI_PSU" },
  { name: "Quant Flexi Cap Fund", amc: "Quant MF", category: "Flexi Cap", symbol: "QUANT_FC" },
  { name: "Aditya Birla SL Frontline Equity", amc: "Aditya Birla SL MF", category: "Large Cap", symbol: "ABSL_FE" },
  { name: "Franklin India Flexi Cap", amc: "Franklin Templeton", category: "Flexi Cap", symbol: "FT_FC" },
  { name: "Edelweiss Mid Cap Fund", amc: "Edelweiss MF", category: "Mid Cap", symbol: "EDEL_MC" },
  { name: "Bandhan Small Cap Fund", amc: "Bandhan MF", category: "Small Cap", symbol: "BAND_SC" },
  { name: "HSBC Small Cap Fund", amc: "HSBC MF", category: "Small Cap", symbol: "HSBC_SC" },
];
