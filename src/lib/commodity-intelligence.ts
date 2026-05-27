// ═══════════════════════════════════════════════════════════════
// Global Commodities Intelligence — Institutional Data Models
// Bloomberg + Refinitiv + Goldman Sachs + CME Analytics
// ═══════════════════════════════════════════════════════════════

export interface CommodityBasicInfo {
  commodityName: string;
  commodityType: string;
  exchange: string;
  contractSymbol: string;
  spotPrice: number;
  futuresPrice: number;
  contractSize: string;
  tickSize: string;
  tickValue: string;
  lotSize: string;
  deliveryMechanism: string;
  expiryDate: string;
  marginRequirement: string;
  tradingHours: string;
  historicalVolatility: number;
  avgDailyVolume: string;
  openInterest: string;
  currency: string;
  unit: string;
  dayChange: number;
  dayChangePct: number;
  weekHigh: number;
  weekLow: number;
  yearHigh: number;
  yearLow: number;
  marketStructure: string;
}

export interface PriceDriver {
  driver: string;
  category: "supply" | "demand" | "macro" | "geopolitical" | "market_structure";
  impact: "positive" | "negative" | "neutral";
  strength: "high" | "medium" | "low";
  explanation: string;
  priceContribution: number;
}

export interface FundamentalAnalysis {
  supplyDemandBalance: string;
  inventoryLevel: string;
  inventoryTrend: string;
  productionForecast: string;
  consumptionForecast: string;
  importExportTrend: string;
  shippingCost: string;
  seasonalCycle: string;
  refineryUtilization: string;
  capacityExpansion: string;
  esgImpact: string;
  fundamentalFairValue: number;
  supplyStressScore: number;
  demandStrengthScore: number;
  inventoryTightnessScore: number;
  macroSensitivityScore: number;
}

export interface PriceDecomposition {
  supplyPremium: number;
  demandPremium: number;
  inflationPremium: number;
  geopoliticalRiskPremium: number;
  currencyImpact: number;
  freightCostImpact: number;
  weatherRiskPremium: number;
  financialSpeculationPremium: number;
  fundamentalFairValue: number;
  overUnderValued: string;
  demandShockScore: number;
  supplyShockScore: number;
  riskScore: number;
  priceExplanation: string;
}

export interface FuturesCurvePoint {
  month: string;
  price: number;
  change: number;
  volume: string;
  openInterest: string;
}

export interface FuturesCurveAnalysis {
  curveShape: string;
  contangoBackwardation: string;
  rollYield: number;
  steepness: string;
  inventoryImplication: string;
  storageEconomics: string;
  spreadOpportunities: string;
  curveData: FuturesCurvePoint[];
}

export interface TechnicalIndicator {
  indicator: string;
  value: number | string;
  signal: "buy" | "sell" | "neutral";
  explanation: string;
}

export interface QuantModel {
  model: string;
  result: string;
  confidence: number;
  interpretation: string;
}

export interface TechnicalAnalysis {
  trend: string;
  momentum: string;
  volatility: string;
  support: number[];
  resistance: number[];
  indicators: TechnicalIndicator[];
  quantModels: QuantModel[];
  technicalScore: number;
  technicalBias: string;
}

export interface RiskScenario {
  scenario: string;
  probability: number;
  estimatedImpact: number;
  resilience: string;
  explanation: string;
  category: "price" | "supply" | "demand" | "weather" | "geopolitical" | "regulatory" | "liquidity";
}

export interface RiskAnalysis {
  priceVolatilityRisk: number;
  supplyShockRisk: number;
  demandCollapseRisk: number;
  weatherRisk: number;
  geopoliticalRisk: number;
  liquidityRisk: number;
  currencyRisk: number;
  regulatoryRisk: number;
  esgRisk: number;
  transportationRisk: number;
  overallRiskScore: number;
  stressScenarios: RiskScenario[];
}

export interface InstitutionalPositioning {
  hedgeFundPositioning: string;
  cftcNetLong: string;
  etfFlows: string;
  producerHedging: string;
  commercialHedging: string;
  smartMoneyFlows: string;
  institutionalBias: string;
  sentimentScore: number;
  longShortRatio: number;
  speculativePositions: string;
  commercialPositions: string;
}

export interface HedgingStrategy {
  strategy: string;
  suitableFor: string;
  description: string;
  riskReduction: string;
  cost: string;
}

export interface DerivativesAnalysis {
  futuresExplanation: string;
  optionsExplanation: string;
  calendarSpreads: string;
  crackSpreads: string;
  crushSpreads: string;
  hedgingStrategies: HedgingStrategy[];
}

export interface CommodityNewsEvent {
  title: string;
  date: string;
  impact: "positive" | "negative" | "neutral";
  severity: "high" | "medium" | "low";
  category: string;
  explanation: string;
}

export interface SeasonalPattern {
  month: string;
  historicalAvgReturn: number;
  trend: string;
  explanation: string;
}

export interface SeasonalAnalysis {
  strongMonths: string[];
  weakMonths: string[];
  currentSeasonalBias: string;
  patterns: SeasonalPattern[];
  cropCalendar: string;
  weatherCycle: string;
}

export interface AIForecast {
  shortTermTarget: number;
  shortTermTimeframe: string;
  mediumTermTarget: number;
  mediumTermTimeframe: string;
  longTermTarget: number;
  longTermTimeframe: string;
  confidence: number;
  aiForecastBias: string;
  supplyShockDetection: string;
  demandForecast: string;
  weatherImpactDetection: string;
  macroRegime: string;
  inflationImpact: string;
  commodityRotationSignal: string;
  aiRecommendation: string;
}

export interface CommodityIntelligenceData {
  basicInfo: CommodityBasicInfo;
  priceDrivers: PriceDriver[];
  fundamentals: FundamentalAnalysis;
  priceDecomposition: PriceDecomposition;
  futuresCurve: FuturesCurveAnalysis;
  technicals: TechnicalAnalysis;
  risk: RiskAnalysis;
  positioning: InstitutionalPositioning;
  derivatives: DerivativesAnalysis;
  newsEvents: CommodityNewsEvent[];
  seasonal: SeasonalAnalysis;
  aiForecast: AIForecast;
}

export const COMMODITY_DASHBOARD_SECTIONS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "drivers", label: "Price Drivers", icon: "⚡" },
  { id: "fundamentals", label: "Fundamentals", icon: "📋" },
  { id: "decomposition", label: "Price DNA", icon: "🧬" },
  { id: "futures", label: "Futures Curve", icon: "📈" },
  { id: "technicals", label: "Technicals", icon: "📉" },
  { id: "risk", label: "Risk Lab", icon: "🛡️" },
  { id: "positioning", label: "Positioning", icon: "🏦" },
  { id: "derivatives", label: "Derivatives", icon: "🔄" },
  { id: "news", label: "News & Events", icon: "📰" },
  { id: "seasonal", label: "Seasonal", icon: "🌦️" },
  { id: "forecast", label: "AI Forecast", icon: "🤖" },
] as const;

export type CommoditySectionId = typeof COMMODITY_DASHBOARD_SECTIONS[number]["id"];

export const COMMODITY_CLASSES = [
  "All Classes",
  "Energy",
  "Precious Metals",
  "Base Metals",
  "Agriculture",
  "Softs",
  "Livestock",
  "Industrial",
  "Battery Metals",
  "Carbon & Freight",
];

export const GLOBAL_COMMODITIES = [
  // Energy
  { name: "Crude Oil WTI", symbol: "CL", class: "Energy", exchange: "NYMEX", unit: "$/bbl" },
  { name: "Brent Crude", symbol: "BZ", class: "Energy", exchange: "ICE", unit: "$/bbl" },
  { name: "Dubai Crude", symbol: "DC", class: "Energy", exchange: "DME", unit: "$/bbl" },
  { name: "Natural Gas", symbol: "NG", class: "Energy", exchange: "NYMEX", unit: "$/MMBtu" },
  { name: "LNG (JKM)", symbol: "JKM", class: "Energy", exchange: "ICE", unit: "$/MMBtu" },
  { name: "Heating Oil", symbol: "HO", class: "Energy", exchange: "NYMEX", unit: "$/gal" },
  { name: "RBOB Gasoline", symbol: "RB", class: "Energy", exchange: "NYMEX", unit: "$/gal" },
  { name: "Coal (Newcastle)", symbol: "NCF", class: "Energy", exchange: "ICE", unit: "$/mt" },
  { name: "Uranium (U3O8)", symbol: "UX", class: "Energy", exchange: "CME", unit: "$/lb" },
  { name: "Ethanol", symbol: "EH", class: "Energy", exchange: "CBOT", unit: "$/gal" },
  // Precious Metals
  { name: "Gold", symbol: "GC", class: "Precious Metals", exchange: "COMEX", unit: "$/oz" },
  { name: "Silver", symbol: "SI", class: "Precious Metals", exchange: "COMEX", unit: "$/oz" },
  { name: "Platinum", symbol: "PL", class: "Precious Metals", exchange: "NYMEX", unit: "$/oz" },
  { name: "Palladium", symbol: "PA", class: "Precious Metals", exchange: "NYMEX", unit: "$/oz" },
  { name: "Rhodium", symbol: "RH", class: "Precious Metals", exchange: "OTC", unit: "$/oz" },
  // Base Metals
  { name: "Copper", symbol: "HG", class: "Base Metals", exchange: "COMEX/LME", unit: "$/lb" },
  { name: "Aluminum", symbol: "ALI", class: "Base Metals", exchange: "LME", unit: "$/mt" },
  { name: "Zinc", symbol: "ZN", class: "Base Metals", exchange: "LME", unit: "$/mt" },
  { name: "Nickel", symbol: "NI", class: "Base Metals", exchange: "LME", unit: "$/mt" },
  { name: "Lead", symbol: "PB", class: "Base Metals", exchange: "LME", unit: "$/mt" },
  { name: "Tin", symbol: "SN", class: "Base Metals", exchange: "LME", unit: "$/mt" },
  { name: "Iron Ore", symbol: "FEF", class: "Base Metals", exchange: "SGX/DCE", unit: "$/mt" },
  { name: "Steel (HRC)", symbol: "HRC", class: "Base Metals", exchange: "CME/LME", unit: "$/mt" },
  // Agriculture
  { name: "Wheat", symbol: "ZW", class: "Agriculture", exchange: "CBOT", unit: "¢/bu" },
  { name: "Corn", symbol: "ZC", class: "Agriculture", exchange: "CBOT", unit: "¢/bu" },
  { name: "Soybean", symbol: "ZS", class: "Agriculture", exchange: "CBOT", unit: "¢/bu" },
  { name: "Soybean Oil", symbol: "ZL", class: "Agriculture", exchange: "CBOT", unit: "¢/lb" },
  { name: "Soybean Meal", symbol: "ZM", class: "Agriculture", exchange: "CBOT", unit: "$/st" },
  { name: "Rice", symbol: "ZR", class: "Agriculture", exchange: "CBOT", unit: "$/cwt" },
  { name: "Oats", symbol: "ZO", class: "Agriculture", exchange: "CBOT", unit: "¢/bu" },
  { name: "Palm Oil", symbol: "FCPO", class: "Agriculture", exchange: "BMD", unit: "MYR/mt" },
  { name: "Canola", symbol: "RS", class: "Agriculture", exchange: "ICE", unit: "CAD/mt" },
  // Softs
  { name: "Sugar #11", symbol: "SB", class: "Softs", exchange: "ICE", unit: "¢/lb" },
  { name: "Coffee Arabica", symbol: "KC", class: "Softs", exchange: "ICE", unit: "¢/lb" },
  { name: "Coffee Robusta", symbol: "RC", class: "Softs", exchange: "ICE", unit: "$/mt" },
  { name: "Cocoa", symbol: "CC", class: "Softs", exchange: "ICE", unit: "$/mt" },
  { name: "Cotton", symbol: "CT", class: "Softs", exchange: "ICE", unit: "¢/lb" },
  { name: "Orange Juice", symbol: "OJ", class: "Softs", exchange: "ICE", unit: "¢/lb" },
  { name: "Rubber", symbol: "TF", class: "Softs", exchange: "TOCOM/SGX", unit: "¥/kg" },
  { name: "Lumber", symbol: "LBS", class: "Softs", exchange: "CME", unit: "$/mbf" },
  // Livestock
  { name: "Live Cattle", symbol: "LE", class: "Livestock", exchange: "CME", unit: "¢/lb" },
  { name: "Lean Hogs", symbol: "HE", class: "Livestock", exchange: "CME", unit: "¢/lb" },
  { name: "Feeder Cattle", symbol: "GF", class: "Livestock", exchange: "CME", unit: "¢/lb" },
  // Industrial
  { name: "Crude Palm Kernel Oil", symbol: "CPKO", class: "Industrial", exchange: "BMD", unit: "MYR/mt" },
  // Battery Metals
  { name: "Lithium Carbonate", symbol: "LTH", class: "Battery Metals", exchange: "CME/GFEX", unit: "$/mt" },
  { name: "Cobalt", symbol: "CO", class: "Battery Metals", exchange: "LME", unit: "$/mt" },
  { name: "Manganese", symbol: "MN", class: "Battery Metals", exchange: "OTC", unit: "$/mt" },
  { name: "Rare Earth (NdPr)", symbol: "NDPR", class: "Battery Metals", exchange: "OTC", unit: "$/kg" },
  // Carbon & Freight
  { name: "EU Carbon (EUA)", symbol: "EUA", class: "Carbon & Freight", exchange: "ICE", unit: "EUR/mt" },
  { name: "California Carbon (CCA)", symbol: "CCA", class: "Carbon & Freight", exchange: "ICE", unit: "$/mt" },
  { name: "Baltic Dry Index", symbol: "BDI", class: "Carbon & Freight", exchange: "Baltic Exchange", unit: "Index" },
  { name: "Freight (Capesize)", symbol: "C5TC", class: "Carbon & Freight", exchange: "Baltic Exchange", unit: "$/day" },
];
