// ═══════════════════════════════════════════════════════════════
// AI Wealth Advisory Engine — Institutional-Grade Data Models
// Private Wealth Advisory + Macro Allocation + Risk Analytics
// ═══════════════════════════════════════════════════════════════

export interface InvestorProfile {
  age: number;
  annualIncome: number;
  monthlySavings: number;
  investmentCorpus: number;
  existingInvestments: string;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  investmentExperience: "beginner" | "intermediate" | "experienced";
  timeHorizon: number; // years
  financialGoals: string;
  liabilities: string;
  emergencyFundMonths: number;
  taxBracket: string;
}

export interface InvestorClassification {
  category: string;
  riskScore: number;
  suitabilityScore: number;
  volatilityTolerance: number;
  liquidityRequirement: string;
  investorPersona: string;
}

export interface AssetAllocation {
  assetClass: string;
  allocationPct: number;
  recommendedAmount: number;
  rationale: string;
  riskReturn: string;
  volatilityOutlook: string;
  economicCycleSuitability: string;
  inflationHedge: string;
  liquidityProfile: string;
  color: string;
}

export interface RiskAnalytics {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  downsideDeviation: number;
  maxDrawdown: number;
  diversificationScore: number;
  inflationAdjustedReturn: number;
  sortinoRatio: number;
  calmarRatio: number;
}

export interface EquityBreakdown {
  segment: string;
  allocation: number;
  rationale: string;
  sectors: string[];
}

export interface FixedIncomeStrategy {
  duration: string;
  yieldCurvePosition: string;
  govtVsCorporate: string;
  creditQuality: string;
  interestRateSensitivity: string;
  incomeGeneration: string;
}

export interface GoldDefensiveAllocation {
  goldAllocationPct: number;
  rationale: string;
  inflationHedge: string;
  crisisProtection: string;
  correlationBenefit: string;
  safeHavenDemand: string;
}

export interface MacroOverlay {
  factor: string;
  currentState: string;
  impact: string;
  allocationImplication: string;
}

export interface StressScenario {
  scenario: string;
  portfolioImpact: number;
  resilience: string;
  vulnerableSegments: string;
  defensiveStrengths: string;
}

export interface InstitutionalView {
  firm: string;
  equityOutlook: string;
  bondOutlook: string;
  goldOutlook: string;
  keyTheme: string;
}

export interface WealthProjection {
  year: number;
  projectedValue: number;
  sipGrowth: number;
  totalInvested: number;
}

export interface WealthRoadmap {
  retirementCorpus: number;
  yearsToGoal: number;
  monthlyRequiredSIP: number;
  goalProbability: number;
  passiveIncomePotential: number;
  projections: WealthProjection[];
}

export interface RebalancingRecommendation {
  action: string;
  urgency: "high" | "medium" | "low";
  rationale: string;
}

export interface InvestmentCommitteeSummary {
  portfolioQualityScore: number;
  riskSuitabilityScore: number;
  diversificationScore: number;
  sustainabilityScore: number;
  majorStrengths: string[];
  keyRisks: string[];
  tacticalOpportunities: string[];
  recommendedActions: string[];
}

export interface WealthAdvisoryData {
  investorClassification: InvestorClassification;
  assetAllocations: AssetAllocation[];
  riskAnalytics: RiskAnalytics;
  equityBreakdown: EquityBreakdown[];
  fixedIncomeStrategy: FixedIncomeStrategy;
  goldDefensive: GoldDefensiveAllocation;
  macroOverlays: MacroOverlay[];
  stressScenarios: StressScenario[];
  institutionalViews: InstitutionalView[];
  wealthRoadmap: WealthRoadmap;
  rebalancing: RebalancingRecommendation[];
  committeeSummary: InvestmentCommitteeSummary;
}

export const WEALTH_SECTIONS = [
  { id: "profile", label: "Investor Profile", icon: "👤" },
  { id: "allocation", label: "Portfolio", icon: "📊" },
  { id: "risk", label: "Risk Analytics", icon: "🛡️" },
  { id: "equity", label: "Equity Strategy", icon: "📈" },
  { id: "fixedincome", label: "Fixed Income", icon: "📋" },
  { id: "gold", label: "Gold & Defense", icon: "🥇" },
  { id: "macro", label: "Macro Overlay", icon: "🌍" },
  { id: "stress", label: "Stress Tests", icon: "⚡" },
  { id: "institutional", label: "Research", icon: "🏦" },
  { id: "roadmap", label: "Wealth Roadmap", icon: "🗺️" },
  { id: "rebalance", label: "Rebalancing", icon: "🔄" },
  { id: "committee", label: "IC Summary", icon: "📝" },
] as const;

export type WealthSectionId = typeof WEALTH_SECTIONS[number]["id"];

export const ALLOCATION_COLORS = [
  "#2962ff", "#e65100", "#2e7d32", "#7c3aed", "#00897b",
  "#d32f2f", "#1565c0", "#f9a825", "#6d4c41", "#455a64", "#e91e63",
];
