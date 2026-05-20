// ═══════════════════════════════════════════════════════════════
// FX Intelligence — Institutional-Grade Data Models & Helpers
// Bloomberg Terminal + JPMorgan FX Strategy Note style
// ═══════════════════════════════════════════════════════════════

export interface FXMarketOverview {
  currentRate: number;
  intradayChange: number;
  intradayChangePct: number;
  dailyHigh: number;
  dailyLow: number;
  weeklyPerf: number;
  monthlyPerf: number;
  ytdPerf: number;
  week52High: number;
  week52Low: number;
  volatility: { realized30d: number; implied1m: number; implied3m: number };
  liquidity: "deep" | "moderate" | "thin";
  bidAskSpread: string;
  institutionalSentiment: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
}

export interface TradingActivity {
  dailyVolume: string;
  spotActivity: string;
  futuresOI: string;
  optionsOI: string;
  majorSessions: string[];
  institutionalFlow: "net_buying" | "net_selling" | "balanced";
  centralBankParticipation: "active" | "moderate" | "minimal";
  retailVsInstitutional: { retail: number; institutional: number };
}

export interface MarketEvent {
  title: string;
  date: string;
  impact: "bullish" | "bearish" | "neutral";
  magnitude: "high" | "medium" | "low";
  explanation: string;
  futureImplication: string;
}

export interface CentralBankIntel {
  bank: string;
  currentRate: number;
  stance: "hawkish" | "neutral" | "dovish";
  lastAction: string;
  nextMeeting: string;
  forwardGuidance: string;
  ratePathExpected: string;
}

export interface BondYieldAnalysis {
  usTreasury10Y: number;
  domesticBond10Y: number;
  yieldSpread: number;
  spreadDirection: "widening" | "stable" | "narrowing";
  carryTradeScore: number;
  riskPremium: string;
  yieldCurveShape: "normal" | "flat" | "inverted";
}

export interface TechnicalLevel {
  label: string;
  value: number;
  type: "support" | "resistance" | "pivot" | "ma";
}

export interface TechnicalAnalysis {
  trend: "strong_bullish" | "bullish" | "neutral" | "bearish" | "strong_bearish";
  rsi: number;
  macd: { value: number; signal: number; histogram: number; interpretation: string };
  bollingerBands: { upper: number; middle: number; lower: number; position: string };
  fibonacci: { levels: { label: string; value: number }[] };
  movingAverages: { ma20: number; ma50: number; ma100: number; ma200: number };
  keyLevels: TechnicalLevel[];
  momentum: string;
  breakoutZones: { level: number; direction: "up" | "down"; probability: number }[];
}

export interface QuantModel {
  name: string;
  value: string;
  signal: "bullish" | "bearish" | "neutral";
  confidence: number;
  description: string;
}

export interface CorrelationEntry {
  asset: string;
  correlation: number;
  direction: "positive" | "negative" | "weak";
  significance: string;
}

export interface InstitutionalView {
  firm: string;
  outlook: "bullish" | "bearish" | "neutral";
  target: string;
  keyRisk: string;
  theme: string;
}

export interface SentimentEngine {
  overallScore: number;
  institutionalConfidence: number;
  fearGreed: number;
  riskAppetite: "risk_on" | "risk_off" | "neutral";
  safeHavenDemand: "high" | "moderate" | "low";
  speculativePositioning: "net_long" | "net_short" | "balanced";
}

export interface AIForecast {
  shortTerm: { outlook: string; range: string; confidence: number };
  mediumTerm: { outlook: string; range: string; confidence: number };
  longTerm: { outlook: string; range: string; confidence: number };
  scenarios: {
    bull: { target: number; probability: number; catalyst: string };
    base: { target: number; probability: number; catalyst: string };
    bear: { target: number; probability: number; catalyst: string };
  };
  catalysts: string[];
}

export interface SmartInsight {
  text: string;
  type: "warning" | "opportunity" | "info" | "risk";
  urgency: "high" | "medium" | "low";
}

export interface FXIntelligenceData {
  pair: string;
  pairName: string;
  base: string;
  quote: string;
  generatedAt: string;
  overview: FXMarketOverview;
  trading: TradingActivity;
  events: MarketEvent[];
  centralBanks: CentralBankIntel[];
  bonds: BondYieldAnalysis;
  technicals: TechnicalAnalysis;
  quantModels: QuantModel[];
  correlations: CorrelationEntry[];
  institutionalViews: InstitutionalView[];
  sentiment: SentimentEngine;
  forecast: AIForecast;
  insights: SmartInsight[];
}

// Central bank mapping
export const CENTRAL_BANKS: Record<string, { name: string; fullName: string }> = {
  USD: { name: "Fed", fullName: "US Federal Reserve" },
  EUR: { name: "ECB", fullName: "European Central Bank" },
  GBP: { name: "BoE", fullName: "Bank of England" },
  JPY: { name: "BoJ", fullName: "Bank of Japan" },
  INR: { name: "RBI", fullName: "Reserve Bank of India" },
  CNY: { name: "PBoC", fullName: "People's Bank of China" },
  AUD: { name: "RBA", fullName: "Reserve Bank of Australia" },
  CAD: { name: "BoC", fullName: "Bank of Canada" },
  CHF: { name: "SNB", fullName: "Swiss National Bank" },
  NZD: { name: "RBNZ", fullName: "Reserve Bank of New Zealand" },
  SGD: { name: "MAS", fullName: "Monetary Authority of Singapore" },
  BRL: { name: "BCB", fullName: "Central Bank of Brazil" },
  ZAR: { name: "SARB", fullName: "South African Reserve Bank" },
  TRY: { name: "CBRT", fullName: "Central Bank of Turkey" },
  RUB: { name: "CBR", fullName: "Central Bank of Russia" },
  THB: { name: "BoT", fullName: "Bank of Thailand" },
  IDR: { name: "BI", fullName: "Bank Indonesia" },
  AED: { name: "CBUAE", fullName: "Central Bank of UAE" },
  SAR: { name: "SAMA", fullName: "Saudi Arabian Monetary Authority" },
};

// Currency symbols for display
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", INR: "₹",
  CNY: "¥", AUD: "A$", CAD: "C$", CHF: "CHF", NZD: "NZ$",
  SGD: "S$", BRL: "R$", ZAR: "R", TRY: "₺", RUB: "₽",
  THB: "฿", IDR: "Rp", AED: "د.إ", SAR: "﷼",
};

// Institutional research firms
export const RESEARCH_FIRMS = [
  "Goldman Sachs", "JPMorgan", "Morgan Stanley", "Bank of America",
  "Citi", "BlackRock", "Deutsche Bank", "UBS", "Barclays", "HSBC",
];

// Dashboard section definitions
export const FX_DASHBOARD_SECTIONS = [
  { id: "overview", label: "Market Overview", icon: "📊" },
  { id: "trading", label: "Trading Activity", icon: "📈" },
  { id: "events", label: "Market Events", icon: "📰" },
  { id: "centralbanks", label: "Central Banks", icon: "🏛️" },
  { id: "bonds", label: "Bond Yields", icon: "📋" },
  { id: "technicals", label: "Technicals", icon: "📐" },
  { id: "quant", label: "Quant Models", icon: "🧮" },
  { id: "correlations", label: "Correlations", icon: "🔗" },
  { id: "institutional", label: "Research", icon: "🏦" },
  { id: "sentiment", label: "Sentiment", icon: "🎯" },
  { id: "forecast", label: "AI Forecast", icon: "🤖" },
  { id: "insights", label: "Smart Alerts", icon: "⚡" },
] as const;

export type FXSectionId = typeof FX_DASHBOARD_SECTIONS[number]["id"];
