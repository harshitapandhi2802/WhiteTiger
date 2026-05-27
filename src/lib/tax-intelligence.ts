// ═══════════════════════════════════════════════════════════════
// Global Investment Tax Intelligence — Institutional Data Models
// Cross-Border Tax Advisory + Post-Tax Return Analytics
// ═══════════════════════════════════════════════════════════════

export interface TaxInvestorProfile {
  country: string;
  taxResidency: string;
  citizenship: string;
  investorCategory: string;
  incomeBracket: string;
  investmentHorizon: number;
  domesticVsInternational: string;
  entityStructure: string;
}

export interface TaxProfileClassification {
  investorType: string;
  taxSensitivity: "high" | "moderate" | "low";
  jurisdictionExposure: string;
  crossBorderComplexity: "high" | "moderate" | "low";
  complianceScore: number;
  profileSummary: string;
}

export interface CountryTaxProfile {
  country: string;
  flag: string;
  stcgRate: string;
  ltcgRate: string;
  dividendTax: string;
  interestTax: string;
  wealthTax: string;
  withholdingTax: string;
  stt: string;
  treatyBenefits: string;
  taxEfficiencyScore: number;
  keyNotes: string;
}

export interface AssetTaxProfile {
  assetClass: string;
  stcgRate: string;
  ltcgRate: string;
  holdingPeriod: string;
  dividendTax: string;
  indexationBenefit: string;
  withholdingTax: string;
  taxLossHarvesting: string;
  crossBorderTreatment: string;
  taxEfficiencyScore: number;
}

export interface InvestorTypeTax {
  investorType: string;
  tdsApplicability: string;
  treatyBenefits: string;
  complianceRequirements: string;
  keyTaxRules: string[];
  optimizationStrategies: string[];
}

export interface PostTaxReturn {
  scenario: string;
  grossReturn: number;
  taxLiability: number;
  effectiveTaxRate: number;
  netPostTaxReturn: number;
  inflationAdjusted: number;
  taxDrag: number;
  taxEfficiencyScore: number;
}

export interface CrossBorderAnalysis {
  route: string;
  withholdingTax: string;
  capitalGainsTax: string;
  doubleTaxation: string;
  foreignTaxCredit: string;
  effectiveTaxBurden: string;
  efficiencyScore: number;
  recommendation: string;
}

export interface TaxOptimization {
  strategy: string;
  category: "structure" | "timing" | "jurisdiction" | "harvesting" | "allocation";
  potentialSaving: string;
  complexity: "low" | "medium" | "high";
  description: string;
  legalBasis: string;
}

export interface TaxAlert {
  title: string;
  date: string;
  jurisdiction: string;
  impact: "positive" | "negative" | "neutral";
  severity: "high" | "medium" | "low";
  description: string;
  affectedInvestors: string;
}

export interface TaxScenarioSimulation {
  scenario: string;
  preTaxCAGR: number;
  postTaxCAGR: number;
  taxDragPct: number;
  wealthAfter10Y: number;
  taxPaidOver10Y: number;
  insight: string;
}

export interface ComplianceItem {
  obligation: string;
  jurisdiction: string;
  deadline: string;
  riskLevel: "high" | "medium" | "low";
  description: string;
}

export interface JurisdictionComparison {
  metric: string;
  values: Record<string, string>;
}

export interface TaxAdvisorySummary {
  estimatedTaxBurden: string;
  effectiveTaxRate: number;
  netPostTaxReturn: number;
  taxEfficiencyScore: number;
  bestJurisdiction: string;
  majorTaxRisks: string[];
  complianceObligations: string[];
  optimizationStrategies: string[];
  verdict: string;
}

export interface TaxIntelligenceData {
  classification: TaxProfileClassification;
  countryProfiles: CountryTaxProfile[];
  assetTaxProfiles: AssetTaxProfile[];
  investorTypeTax: InvestorTypeTax[];
  postTaxReturns: PostTaxReturn[];
  crossBorderAnalysis: CrossBorderAnalysis[];
  optimizations: TaxOptimization[];
  alerts: TaxAlert[];
  scenarios: TaxScenarioSimulation[];
  compliance: ComplianceItem[];
  jurisdictionComparisons: JurisdictionComparison[];
  summary: TaxAdvisorySummary;
}

export const TAX_SECTIONS = [
  { id: "profile", label: "Tax Profile", icon: "👤" },
  { id: "countries", label: "Country Tax", icon: "🌍" },
  { id: "assets", label: "Asset Tax", icon: "📊" },
  { id: "investor", label: "Investor Type", icon: "🏦" },
  { id: "posttax", label: "Post-Tax Returns", icon: "💰" },
  { id: "crossborder", label: "Cross-Border", icon: "✈️" },
  { id: "optimize", label: "Optimization", icon: "⚡" },
  { id: "alerts", label: "Tax Alerts", icon: "🔔" },
  { id: "scenarios", label: "Simulations", icon: "🧮" },
  { id: "compliance", label: "Compliance", icon: "📋" },
  { id: "compare", label: "Compare", icon: "⚖️" },
  { id: "summary", label: "Advisory", icon: "📝" },
] as const;

export type TaxSectionId = typeof TAX_SECTIONS[number]["id"];

export const INVESTOR_CATEGORIES = [
  "Retail Investor", "HNI", "NRI", "FII", "DII",
  "Family Office", "Corporate Treasury", "Foreign Investor",
];

export const COUNTRIES = [
  "India", "United States", "United Kingdom", "UAE", "Singapore",
  "Hong Kong", "Switzerland", "Canada", "Australia", "Germany", "Japan",
];
