// ═══════════════════════════════════════════════════════════════════════
// MUTUAL FUND INTELLIGENCE ENGINE v2.0
// AI Copilot · SIP Simulator · Goal Planner · Fund Comparison
// Suitability Engine · Market Impact · Beginner Explanations
// ═══════════════════════════════════════════════════════════════════════

function seededRng(seed: string | number) {
  let h = typeof seed === "number" ? seed : 0;
  if (typeof seed === "string") for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

// ─── Types ───────────────────────────────────────────────────────────

export type InvestorProfile = "beginner" | "aggressive" | "conservative" | "retirement" | "tax-saver";

export interface MFCopilotNarrative {
  marketMood: string;
  moodEmoji: string;
  moodColor: string;
  summary: string;
  beginnerSummary: string;
  keyDrivers: { driver: string; impact: "positive" | "negative" | "neutral"; explanation: string; beginnerTip: string }[];
  topPicks: { name: string; category: string; reason: string; returnTag: string }[];
  avoidList: { name: string; reason: string }[];
  sipAdvice: string;
  marketOutlook: string;
}

export interface SIPProjection {
  year: number;
  invested: number;
  value: number;
  inflationAdjusted: number;
  gains: number;
}

export interface GoalPlan {
  goalName: string;
  targetAmount: number;
  yearsToGoal: number;
  monthlySIP: number;
  expectedReturn: number;
  projectedCorpus: number;
  shortfall: number;
  suggestedFunds: { name: string; allocation: number; reason: string }[];
  successProbability: number;
}

export interface FundComparison {
  metrics: { label: string; fundA: string | number; fundB: string | number; winner: "A" | "B" | "tie"; beginnerExplanation: string }[];
  verdict: string;
  radarA: number[];
  radarB: number[];
  radarLabels: string[];
}

export interface SuitabilityResult {
  profile: InvestorProfile;
  profileLabel: string;
  profileDescription: string;
  riskTolerance: number;
  suggestedAllocation: { category: string; weight: number; color: string }[];
  recommendedFunds: { name: string; category: string; match: number; reason: string }[];
  sipStrategy: string;
  warnings: string[];
}

export interface BeginnerExplanation {
  metric: string;
  value: string;
  simpleExplanation: string;
  emoji: string;
  verdict: "good" | "average" | "poor";
  verdictColor: string;
}

export interface MarketImpactInsight {
  factor: string;
  currentState: string;
  impactOnMF: string;
  affectedCategories: string[];
  direction: "positive" | "negative" | "neutral";
  beginnerExplanation: string;
}

export interface CuratedList {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  bgGradient: string;
  funds: { name: string; category: string; amc: string; return1y: number; return3y: number; riskLevel: string; aiRating: number; sipMin: string; badge?: string }[];
}

// ─── CURATED LISTS ──────────────────────────────────────────────────

export function generateCuratedLists(): CuratedList[] {
  const rng = seededRng("curated-lists-v2");
  const r = (min: number, max: number) => +(min + rng() * (max - min)).toFixed(1);

  return [
    {
      id: "top-rated", title: "Top Rated Funds", subtitle: "Highest AI-rated across all categories", emoji: "🏆",
      color: "#f59e0b", bgGradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      funds: [
        { name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", amc: "PPFAS MF", return1y: r(18, 28), return3y: r(16, 22), riskLevel: "Very High", aiRating: 94, sipMin: "₹1,000", badge: "Gold" },
        { name: "Mirae Asset Large Cap Fund", category: "Large Cap", amc: "Mirae Asset", return1y: r(14, 22), return3y: r(14, 18), riskLevel: "High", aiRating: 91, sipMin: "₹500" },
        { name: "Kotak Emerging Equity Fund", category: "Mid Cap", amc: "Kotak MF", return1y: r(20, 32), return3y: r(18, 24), riskLevel: "Very High", aiRating: 90, sipMin: "₹500" },
        { name: "HDFC Mid-Cap Opportunities", category: "Mid Cap", amc: "HDFC MF", return1y: r(18, 30), return3y: r(16, 22), riskLevel: "Very High", aiRating: 89, sipMin: "₹500", badge: "Silver" },
        { name: "SBI Small Cap Fund", category: "Small Cap", amc: "SBI MF", return1y: r(22, 38), return3y: r(20, 28), riskLevel: "Very High", aiRating: 88, sipMin: "₹500" },
      ],
    },
    {
      id: "best-sip", title: "Best SIP Funds", subtitle: "Ideal for long-term wealth building via SIP", emoji: "💰",
      color: "#10b981", bgGradient: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
      funds: [
        { name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", amc: "PPFAS MF", return1y: r(18, 26), return3y: r(16, 22), riskLevel: "Very High", aiRating: 95, sipMin: "₹1,000", badge: "Best SIP" },
        { name: "Canara Robeco Bluechip Fund", category: "Large Cap", amc: "Canara Robeco", return1y: r(14, 20), return3y: r(13, 17), riskLevel: "High", aiRating: 88, sipMin: "₹500" },
        { name: "Kotak Flexicap Fund", category: "Flexi Cap", amc: "Kotak MF", return1y: r(16, 24), return3y: r(14, 20), riskLevel: "Very High", aiRating: 87, sipMin: "₹500" },
        { name: "DSP Midcap Fund", category: "Mid Cap", amc: "DSP MF", return1y: r(18, 28), return3y: r(16, 22), riskLevel: "Very High", aiRating: 86, sipMin: "₹500" },
        { name: "ICICI Pru Bluechip Fund", category: "Large Cap", amc: "ICICI Pru", return1y: r(14, 20), return3y: r(13, 17), riskLevel: "High", aiRating: 85, sipMin: "₹500" },
      ],
    },
    {
      id: "tax-saving", title: "Tax Saving Funds (ELSS)", subtitle: "Save up to ₹46,800 tax under Section 80C", emoji: "🧾",
      color: "#6366f1", bgGradient: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
      funds: [
        { name: "Quant Tax Plan", category: "ELSS", amc: "Quant MF", return1y: r(20, 35), return3y: r(18, 26), riskLevel: "Very High", aiRating: 91, sipMin: "₹500", badge: "Top ELSS" },
        { name: "Mirae Asset Tax Saver Fund", category: "ELSS", amc: "Mirae Asset", return1y: r(16, 24), return3y: r(14, 20), riskLevel: "Very High", aiRating: 89, sipMin: "₹500" },
        { name: "Axis Long Term Equity Fund", category: "ELSS", amc: "Axis MF", return1y: r(12, 20), return3y: r(12, 18), riskLevel: "Very High", aiRating: 84, sipMin: "₹500" },
        { name: "SBI Long Term Equity Fund", category: "ELSS", amc: "SBI MF", return1y: r(14, 22), return3y: r(13, 19), riskLevel: "Very High", aiRating: 83, sipMin: "₹500" },
        { name: "DSP Tax Saver Fund", category: "ELSS", amc: "DSP MF", return1y: r(14, 22), return3y: r(13, 18), riskLevel: "Very High", aiRating: 82, sipMin: "₹500" },
      ],
    },
    {
      id: "beginner", title: "Beginner-Friendly Funds", subtitle: "Low complexity, proven track record, easy to understand", emoji: "🌱",
      color: "#06b6d4", bgGradient: "linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)",
      funds: [
        { name: "UTI Nifty 50 Index Fund", category: "Index", amc: "UTI MF", return1y: r(12, 18), return3y: r(12, 16), riskLevel: "High", aiRating: 90, sipMin: "₹500", badge: "Start Here" },
        { name: "ICICI Pru Balanced Advantage", category: "Hybrid", amc: "ICICI Pru", return1y: r(10, 16), return3y: r(10, 14), riskLevel: "High", aiRating: 88, sipMin: "₹500" },
        { name: "HDFC Balanced Advantage Fund", category: "Hybrid", amc: "HDFC MF", return1y: r(10, 16), return3y: r(10, 14), riskLevel: "High", aiRating: 86, sipMin: "₹500" },
        { name: "Canara Robeco Bluechip Fund", category: "Large Cap", amc: "Canara Robeco", return1y: r(14, 20), return3y: r(13, 17), riskLevel: "High", aiRating: 85, sipMin: "₹500" },
        { name: "Navi Nifty 50 Index Fund", category: "Index", amc: "Navi MF", return1y: r(12, 18), return3y: r(12, 16), riskLevel: "High", aiRating: 84, sipMin: "₹500" },
      ],
    },
    {
      id: "high-growth", title: "High Growth Funds", subtitle: "Aggressive wealth creation for long-term investors", emoji: "🚀",
      color: "#ef4444", bgGradient: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
      funds: [
        { name: "Quant Small Cap Fund", category: "Small Cap", amc: "Quant MF", return1y: r(25, 45), return3y: r(22, 32), riskLevel: "Very High", aiRating: 88, sipMin: "₹500", badge: "High Alpha" },
        { name: "Nippon India Small Cap Fund", category: "Small Cap", amc: "Nippon India", return1y: r(22, 38), return3y: r(20, 28), riskLevel: "Very High", aiRating: 87, sipMin: "₹500" },
        { name: "SBI Small Cap Fund", category: "Small Cap", amc: "SBI MF", return1y: r(22, 36), return3y: r(20, 28), riskLevel: "Very High", aiRating: 86, sipMin: "₹500" },
        { name: "Axis Small Cap Fund", category: "Small Cap", amc: "Axis MF", return1y: r(20, 34), return3y: r(18, 26), riskLevel: "Very High", aiRating: 84, sipMin: "₹500" },
        { name: "Motilal Oswal Midcap Fund", category: "Mid Cap", amc: "Motilal Oswal", return1y: r(20, 32), return3y: r(18, 24), riskLevel: "Very High", aiRating: 83, sipMin: "₹500" },
      ],
    },
    {
      id: "low-risk", title: "Low Risk Funds", subtitle: "Capital preservation with steady returns", emoji: "🛡️",
      color: "#059669", bgGradient: "linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)",
      funds: [
        { name: "HDFC Short Term Debt Fund", category: "Debt", amc: "HDFC MF", return1y: r(6, 8), return3y: r(6, 7.5), riskLevel: "Low", aiRating: 90, sipMin: "₹500", badge: "Safe" },
        { name: "Kotak Corporate Bond Fund", category: "Debt", amc: "Kotak MF", return1y: r(6.5, 8), return3y: r(6, 7.5), riskLevel: "Low", aiRating: 88, sipMin: "₹500" },
        { name: "Axis Banking & PSU Debt Fund", category: "Debt", amc: "Axis MF", return1y: r(6, 7.5), return3y: r(6, 7), riskLevel: "Low", aiRating: 87, sipMin: "₹500" },
        { name: "ICICI Pru Balanced Advantage", category: "Hybrid", amc: "ICICI Pru", return1y: r(10, 15), return3y: r(10, 14), riskLevel: "High", aiRating: 86, sipMin: "₹500" },
        { name: "SBI Equity Hybrid Fund", category: "Hybrid", amc: "SBI MF", return1y: r(10, 16), return3y: r(10, 14), riskLevel: "High", aiRating: 84, sipMin: "₹500" },
      ],
    },
    {
      id: "retirement", title: "Retirement Funds", subtitle: "Build your retirement corpus with discipline", emoji: "🏖️",
      color: "#8b5cf6", bgGradient: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
      funds: [
        { name: "HDFC Balanced Advantage Fund", category: "Hybrid", amc: "HDFC MF", return1y: r(10, 16), return3y: r(10, 14), riskLevel: "High", aiRating: 89, sipMin: "₹500", badge: "Ideal" },
        { name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", amc: "PPFAS MF", return1y: r(18, 26), return3y: r(16, 22), riskLevel: "Very High", aiRating: 94, sipMin: "₹1,000" },
        { name: "UTI Nifty 50 Index Fund", category: "Index", amc: "UTI MF", return1y: r(12, 18), return3y: r(12, 16), riskLevel: "High", aiRating: 88, sipMin: "₹500" },
        { name: "ICICI Pru Balanced Advantage", category: "Hybrid", amc: "ICICI Pru", return1y: r(10, 16), return3y: r(10, 14), riskLevel: "High", aiRating: 87, sipMin: "₹500" },
        { name: "HDFC Short Term Debt Fund", category: "Debt", amc: "HDFC MF", return1y: r(6, 8), return3y: r(6, 7.5), riskLevel: "Low", aiRating: 86, sipMin: "₹500" },
      ],
    },
  ];
}

// ─── AI COPILOT ─────────────────────────────────────────────────────

export function generateMFCopilot(): MFCopilotNarrative {
  const rng = seededRng(Date.now().toString().slice(0, -4));
  const moods = [
    { mood: "Cautiously Optimistic", emoji: "🟡", color: "#f59e0b" },
    { mood: "Bullish", emoji: "🟢", color: "#10b981" },
    { mood: "Risk-Off Defensive", emoji: "🔴", color: "#ef4444" },
    { mood: "Neutral — Data Watching", emoji: "⚪", color: "#6b7280" },
  ];
  const m = moods[Math.floor(rng() * moods.length)];

  return {
    marketMood: m.mood, moodEmoji: m.emoji, moodColor: m.color,
    summary: `Indian mutual fund markets are in a ${m.mood.toLowerCase()} phase. Monthly SIP flows continue at record levels above ₹25,000 Cr, providing strong domestic demand. Large-cap valuations are near fair value while small-cap segments remain elevated. The RBI's accommodative stance supports debt fund prospects. Flexi-cap and balanced advantage funds offer the best risk-adjusted positioning for current conditions.`,
    beginnerSummary: `In simple terms: Indian mutual funds are doing reasonably well right now. Regular investors putting money through SIP are in a good position. If you're just starting out, consider index funds or balanced advantage funds — they automatically adjust between stocks and bonds based on market conditions. Don't try to time the market; instead, invest consistently every month.`,
    keyDrivers: [
      { driver: "RBI Rate Decision", impact: rng() > 0.5 ? "positive" : "neutral", explanation: "RBI held repo rate at 6.50% with accommodative stance. Rate cuts expected in coming quarters.", beginnerTip: "When RBI cuts rates, both stock and bond fund values tend to go up." },
      { driver: "SIP Flow Record", impact: "positive", explanation: `Monthly SIP inflows at ₹${(24000 + rng() * 4000).toFixed(0)} Cr — all-time high. Domestic institutional demand remains strong.`, beginnerTip: "More people investing through SIP means steady demand for stocks, which helps fund values." },
      { driver: "FII Activity", impact: rng() > 0.4 ? "negative" : "positive", explanation: `Foreign investors are net ${rng() > 0.4 ? "sellers" : "buyers"} this month. Global risk appetite is ${rng() > 0.5 ? "low" : "moderate"}.`, beginnerTip: "Foreign investors buying or selling large amounts can temporarily move the market." },
      { driver: "Market Valuations", impact: "neutral", explanation: `Nifty 50 PE at ${(20 + rng() * 5).toFixed(1)}x. Large caps fairly valued, small caps stretched. Selective approach recommended.`, beginnerTip: "PE ratio tells you how expensive stocks are. Lower is generally better for new investors." },
      { driver: "Corporate Earnings", impact: "positive", explanation: "Q4 earnings season showing broad-based recovery. Banking and IT sectors leading growth. Margin improvement visible.", beginnerTip: "When companies make more profit, their stock prices and your fund values tend to go up." },
    ],
    topPicks: [
      { name: "Parag Parikh Flexi Cap", category: "Flexi Cap", reason: "Global diversification + consistent alpha generation", returnTag: `${(16 + rng() * 8).toFixed(1)}% 3Y CAGR` },
      { name: "UTI Nifty 50 Index Fund", category: "Index", reason: "Lowest cost market exposure, ideal for beginners", returnTag: `${(12 + rng() * 6).toFixed(1)}% 3Y CAGR` },
      { name: "ICICI Pru Balanced Advantage", category: "Hybrid", reason: "Dynamic asset allocation protects in downturns", returnTag: `${(10 + rng() * 5).toFixed(1)}% 3Y CAGR` },
    ],
    avoidList: [
      { name: "Thematic / Sectoral NFOs", reason: "Most thematic funds launch near sector peaks. Historical data shows 70% underperform within 3 years of launch." },
      { name: "Small Cap Lumpsum Entry", reason: "Small cap valuations are stretched. SIP only — never invest lumpsum at elevated levels." },
    ],
    sipAdvice: "Continue your SIPs without interruption. If you have surplus cash, consider deploying it into large-cap or flexi-cap funds over 3-4 months rather than lumpsum. For new investors, start with ₹5,000/month in an index fund and increase by 10% annually.",
    marketOutlook: "6-12 month outlook remains constructive for disciplined investors. Expect 12-15% returns from diversified equity funds. Debt funds could deliver 7-8% as rate cuts materialize. Stay invested, stay diversified, and increase SIPs annually.",
  };
}

// ─── SIP SIMULATOR ──────────────────────────────────────────────────

export function simulateSIP(monthly: number, years: number, expectedReturn: number): SIPProjection[] {
  const monthlyRate = expectedReturn / 100 / 12;
  const inflationRate = 0.06; // 6% annual
  const projections: SIPProjection[] = [];

  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    const invested = monthly * months;
    // FV of annuity formula
    const value = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const inflationAdjusted = value / Math.pow(1 + inflationRate, y);
    projections.push({
      year: y,
      invested: Math.round(invested),
      value: Math.round(value),
      inflationAdjusted: Math.round(inflationAdjusted),
      gains: Math.round(value - invested),
    });
  }
  return projections;
}

// ─── GOAL PLANNER ───────────────────────────────────────────────────

export function planGoal(goalName: string, targetAmount: number, yearsToGoal: number): GoalPlan {
  const rng = seededRng(goalName);
  const expectedReturn = yearsToGoal >= 10 ? 12 : yearsToGoal >= 5 ? 10 : 7;
  const monthlyRate = expectedReturn / 100 / 12;
  const months = yearsToGoal * 12;

  // Required monthly SIP to reach target
  const monthlySIP = Math.ceil(targetAmount / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)));
  const projectedCorpus = monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

  const fundSuggestions = yearsToGoal >= 10
    ? [
        { name: "Parag Parikh Flexi Cap", allocation: 40, reason: "Core holding for long-term wealth creation" },
        { name: "UTI Nifty 50 Index Fund", allocation: 30, reason: "Low-cost market exposure" },
        { name: "SBI Small Cap Fund", allocation: 20, reason: "High growth potential for 10Y+ horizon" },
        { name: "HDFC Short Term Debt Fund", allocation: 10, reason: "Stability and liquidity buffer" },
      ]
    : yearsToGoal >= 5
    ? [
        { name: "Canara Robeco Bluechip Fund", allocation: 40, reason: "Stable large-cap growth" },
        { name: "HDFC Balanced Advantage Fund", allocation: 35, reason: "Dynamic allocation manages risk" },
        { name: "Kotak Corporate Bond Fund", allocation: 25, reason: "Predictable returns for medium-term" },
      ]
    : [
        { name: "HDFC Short Term Debt Fund", allocation: 50, reason: "Capital preservation for short horizon" },
        { name: "ICICI Pru Balanced Advantage", allocation: 30, reason: "Moderate equity exposure" },
        { name: "Axis Banking & PSU Debt Fund", allocation: 20, reason: "High safety, decent yield" },
      ];

  return {
    goalName, targetAmount, yearsToGoal, monthlySIP, expectedReturn,
    projectedCorpus: Math.round(projectedCorpus),
    shortfall: Math.max(0, targetAmount - Math.round(projectedCorpus)),
    suggestedFunds: fundSuggestions,
    successProbability: Math.min(98, 65 + yearsToGoal * 2 + Math.floor(rng() * 10)),
  };
}

// ─── SUITABILITY ENGINE ─────────────────────────────────────────────

export function getSuitability(profile: InvestorProfile): SuitabilityResult {
  const profiles: Record<InvestorProfile, SuitabilityResult> = {
    beginner: {
      profile: "beginner", profileLabel: "Beginner Investor", profileDescription: "New to investing. Prefers simplicity, safety, and guided recommendations. Best to start with index funds and balanced funds.",
      riskTolerance: 35,
      suggestedAllocation: [
        { category: "Index Funds", weight: 40, color: "#3b82f6" },
        { category: "Balanced Advantage", weight: 30, color: "#10b981" },
        { category: "Large Cap", weight: 20, color: "#6366f1" },
        { category: "Debt Funds", weight: 10, color: "#f59e0b" },
      ],
      recommendedFunds: [
        { name: "UTI Nifty 50 Index Fund", category: "Index", match: 95, reason: "Simplest way to invest in India's top 50 companies. Zero fund manager risk." },
        { name: "ICICI Pru Balanced Advantage", category: "Hybrid", match: 90, reason: "Automatically adjusts between stocks and bonds. Great for beginners." },
        { name: "Canara Robeco Bluechip Fund", category: "Large Cap", match: 85, reason: "Consistent performer with low volatility. Easy to hold during downturns." },
        { name: "HDFC Short Term Debt Fund", category: "Debt", match: 80, reason: "For your emergency fund portion. Better than FD, very low risk." },
      ],
      sipStrategy: "Start with ₹5,000/month. Split: ₹2,000 in Index Fund, ₹1,500 in Balanced Advantage, ₹1,000 in Large Cap, ₹500 in Debt Fund. Increase by 10% every year.",
      warnings: ["Avoid small cap and sectoral funds for now.", "Don't check NAV daily — it causes anxiety.", "Stay invested for minimum 3-5 years."],
    },
    aggressive: {
      profile: "aggressive", profileLabel: "Aggressive Growth Investor", profileDescription: "High risk tolerance, long investment horizon (10Y+). Focused on maximum wealth creation through equity exposure.",
      riskTolerance: 85,
      suggestedAllocation: [
        { category: "Small Cap", weight: 30, color: "#ef4444" },
        { category: "Mid Cap", weight: 25, color: "#f97316" },
        { category: "Flexi Cap", weight: 25, color: "#8b5cf6" },
        { category: "International", weight: 15, color: "#06b6d4" },
        { category: "Cash / Debt", weight: 5, color: "#6b7280" },
      ],
      recommendedFunds: [
        { name: "Quant Small Cap Fund", category: "Small Cap", match: 92, reason: "Highest alpha generation in small cap space. Aggressive but rewarding." },
        { name: "Kotak Emerging Equity Fund", category: "Mid Cap", match: 90, reason: "Consistent mid-cap outperformer with strong stock selection." },
        { name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", match: 88, reason: "Global diversification adds unique alpha source." },
        { name: "Motilal Oswal Nasdaq 100 FOF", category: "International", match: 82, reason: "Exposure to global tech leaders for long-term growth." },
      ],
      sipStrategy: "Invest ₹25,000+/month across 4-5 funds. Step-up SIP by 15% annually. Consider lumpsum deployment during market corrections of 10%+.",
      warnings: ["Be prepared for 30-40% drawdowns in bear markets.", "Never panic-sell during corrections.", "This allocation is NOT suitable for goals within 5 years."],
    },
    conservative: {
      profile: "conservative", profileLabel: "Conservative Investor", profileDescription: "Low risk tolerance. Prioritizes capital preservation over growth. Prefers debt-heavy allocation with limited equity.",
      riskTolerance: 25,
      suggestedAllocation: [
        { category: "Debt Funds", weight: 45, color: "#10b981" },
        { category: "Balanced Advantage", weight: 25, color: "#3b82f6" },
        { category: "Large Cap / Index", weight: 20, color: "#6366f1" },
        { category: "Gold / Others", weight: 10, color: "#f59e0b" },
      ],
      recommendedFunds: [
        { name: "HDFC Short Term Debt Fund", category: "Debt", match: 95, reason: "Low volatility, consistent returns. Better than FD." },
        { name: "ICICI Pru Balanced Advantage", category: "Hybrid", match: 88, reason: "Managed equity exposure with automatic risk management." },
        { name: "Canara Robeco Bluechip Fund", category: "Large Cap", match: 82, reason: "Low-volatility equity exposure through blue-chip stocks." },
        { name: "Kotak Corporate Bond Fund", category: "Debt", match: 90, reason: "AAA-rated bond portfolio. Very safe with decent returns." },
      ],
      sipStrategy: "₹10,000/month split: ₹4,500 Debt, ₹2,500 BAF, ₹2,000 Large Cap, ₹1,000 Gold fund. Increase 5-8% annually.",
      warnings: ["Your real returns may barely beat inflation.", "Consider gradually increasing equity as you get comfortable.", "Debt funds have tax implications — hold for 3Y+ for LTCG benefit."],
    },
    retirement: {
      profile: "retirement", profileLabel: "Retirement Planner", profileDescription: "Building a corpus for retirement (15-25 years away). Needs a blend of growth and stability that shifts over time.",
      riskTolerance: 55,
      suggestedAllocation: [
        { category: "Flexi Cap", weight: 35, color: "#8b5cf6" },
        { category: "Index Fund", weight: 25, color: "#3b82f6" },
        { category: "Balanced Advantage", weight: 20, color: "#10b981" },
        { category: "Debt / Liquid", weight: 15, color: "#f59e0b" },
        { category: "International", weight: 5, color: "#06b6d4" },
      ],
      recommendedFunds: [
        { name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", match: 94, reason: "Best all-weather fund for long-term retirement corpus building." },
        { name: "UTI Nifty 50 Index Fund", category: "Index", match: 90, reason: "Core allocation — no fund manager risk, lowest cost." },
        { name: "HDFC Balanced Advantage Fund", category: "Hybrid", match: 86, reason: "Dynamic allocation suitable for retirement glide path." },
        { name: "Axis Banking & PSU Debt Fund", category: "Debt", match: 82, reason: "Safe debt allocation for near-retirement portion." },
      ],
      sipStrategy: "₹20,000/month. Step-up 12% annually. Shift 5% from equity to debt every 5 years as retirement approaches.",
      warnings: ["Start early — even a 5-year delay can reduce corpus by 40%.", "Don't withdraw before retirement except for emergencies.", "Review allocation every 2-3 years."],
    },
    "tax-saver": {
      profile: "tax-saver", profileLabel: "Tax-Saving Investor", profileDescription: "Primary goal is Section 80C tax saving with ₹1.5 lakh annual limit. ELSS offers shortest lock-in (3 years) among 80C options.",
      riskTolerance: 60,
      suggestedAllocation: [
        { category: "ELSS", weight: 70, color: "#6366f1" },
        { category: "Flexi Cap", weight: 20, color: "#8b5cf6" },
        { category: "Debt", weight: 10, color: "#10b981" },
      ],
      recommendedFunds: [
        { name: "Quant Tax Plan", category: "ELSS", match: 92, reason: "Highest returns in ELSS category. Aggressive but rewarding." },
        { name: "Mirae Asset Tax Saver Fund", category: "ELSS", match: 90, reason: "Consistent large-cap biased ELSS. Lower volatility." },
        { name: "Axis Long Term Equity Fund", category: "ELSS", match: 85, reason: "Quality-focused portfolio with good downside protection." },
        { name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", match: 88, reason: "Beyond tax saving — core wealth builder for long-term." },
      ],
      sipStrategy: "₹12,500/month in ELSS = ₹1.5L annual 80C limit covered. Add ₹5,000 in Flexi Cap for wealth beyond tax saving.",
      warnings: ["ELSS has 3-year mandatory lock-in — don't invest money you need sooner.", "Tax saving should NOT be the only reason to invest in MF.", "After 80C limit is filled, switch to Flexi Cap or Index funds."],
    },
  };

  return profiles[profile];
}

// ─── BEGINNER EXPLANATIONS ──────────────────────────────────────────

export function getBeginnerExplanations(fund: {
  nav: number; expenseRatio: number; sharpe: number; aum: string;
  return1y: number; return3y: number; return5y: number;
  stdDev: number; maxDrawdown: number; alpha: number; beta: number;
  category: string;
}): BeginnerExplanation[] {
  const isDebt = fund.category === "Debt";
  return [
    {
      metric: "NAV", value: `₹${fund.nav.toFixed(2)}`,
      simpleExplanation: `This is the price of one unit of this fund. A high NAV doesn't mean the fund is expensive — it means the fund has grown well over time. Think of it like a stock price.`,
      emoji: "💵", verdict: "good", verdictColor: "#10b981",
    },
    {
      metric: "Expense Ratio", value: `${fund.expenseRatio}%`,
      simpleExplanation: fund.expenseRatio < 0.5
        ? "Very low fees! For every ₹10,000 invested, the fund charges less than ₹50/year. This is excellent."
        : fund.expenseRatio < 1
        ? "Moderate fees. The fund charges around ₹" + Math.round(fund.expenseRatio * 100) + " per ₹10,000 invested per year. This is acceptable for actively managed funds."
        : "Relatively high fees. Consider checking if a Direct plan or Index fund alternative offers better value.",
      emoji: fund.expenseRatio < 0.5 ? "✅" : fund.expenseRatio < 1 ? "🟡" : "🔴",
      verdict: fund.expenseRatio < 0.5 ? "good" : fund.expenseRatio < 1 ? "average" : "poor",
      verdictColor: fund.expenseRatio < 0.5 ? "#10b981" : fund.expenseRatio < 1 ? "#f59e0b" : "#ef4444",
    },
    {
      metric: "Sharpe Ratio", value: fund.sharpe.toString(),
      simpleExplanation: fund.sharpe > 1.2
        ? "Excellent! This fund generates strong returns relative to the risk it takes. Like getting A+ marks with moderate study effort."
        : fund.sharpe > 0.8
        ? "Good. The fund gives decent returns for the risk taken. Not exceptional, but solid."
        : "Below average. The fund isn't compensating you well enough for the risk. Consider alternatives.",
      emoji: fund.sharpe > 1.2 ? "🏆" : fund.sharpe > 0.8 ? "👍" : "⚠️",
      verdict: fund.sharpe > 1.2 ? "good" : fund.sharpe > 0.8 ? "average" : "poor",
      verdictColor: fund.sharpe > 1.2 ? "#10b981" : fund.sharpe > 0.8 ? "#f59e0b" : "#ef4444",
    },
    {
      metric: "1-Year Return", value: `${fund.return1y > 0 ? "+" : ""}${fund.return1y}%`,
      simpleExplanation: fund.return1y > 20
        ? "Very strong returns over the last year! But remember, past performance doesn't guarantee future results. This year's winner may not repeat next year."
        : fund.return1y > 10
        ? "Solid returns for the past year. This is a healthy growth rate that beats inflation comfortably."
        : fund.return1y > 0
        ? "Modest positive returns. While not spectacular, staying positive is good. Check 3Y and 5Y returns for a better picture."
        : "Negative returns over the past year. Don't panic — equity markets go through cycles. If your SIP is running, this is actually buying units at a discount.",
      emoji: fund.return1y > 20 ? "🔥" : fund.return1y > 10 ? "📈" : fund.return1y > 0 ? "➡️" : "📉",
      verdict: fund.return1y > 15 ? "good" : fund.return1y > 5 ? "average" : "poor",
      verdictColor: fund.return1y > 15 ? "#10b981" : fund.return1y > 5 ? "#f59e0b" : "#ef4444",
    },
    {
      metric: "AUM", value: fund.aum,
      simpleExplanation: `This is the total money managed by this fund. Large AUM (₹10,000+ Cr) means many investors trust this fund. Very large AUM in small-cap funds can be a concern as it becomes harder to deploy capital.`,
      emoji: "🏦", verdict: "good", verdictColor: "#10b981",
    },
    {
      metric: "Max Drawdown", value: `-${fund.maxDrawdown}%`,
      simpleExplanation: `At its worst, this fund dropped ${fund.maxDrawdown}% from its peak. ${
        fund.maxDrawdown < 15
          ? "This is relatively mild — the fund handles bad times well."
          : fund.maxDrawdown < 30
          ? "This is moderate. During market crashes, expect temporary losses of this magnitude."
          : "This is significant. Only invest if you can stomach seeing your money drop by this much temporarily."
      }`,
      emoji: fund.maxDrawdown < 15 ? "🛡️" : fund.maxDrawdown < 30 ? "⚠️" : "🔴",
      verdict: fund.maxDrawdown < 15 ? "good" : fund.maxDrawdown < 30 ? "average" : "poor",
      verdictColor: fund.maxDrawdown < 15 ? "#10b981" : fund.maxDrawdown < 30 ? "#f59e0b" : "#ef4444",
    },
    {
      metric: "Alpha", value: `${fund.alpha > 0 ? "+" : ""}${fund.alpha}%`,
      simpleExplanation: fund.alpha > 2
        ? "The fund manager is adding significant value! The fund beats its benchmark by a good margin after adjusting for risk."
        : fund.alpha > 0
        ? "Slight outperformance over the benchmark. The fund manager is adding modest value."
        : "The fund is underperforming its benchmark. You might be better off with an index fund at lower cost.",
      emoji: fund.alpha > 2 ? "⭐" : fund.alpha > 0 ? "👌" : "👎",
      verdict: fund.alpha > 2 ? "good" : fund.alpha > 0 ? "average" : "poor",
      verdictColor: fund.alpha > 2 ? "#10b981" : fund.alpha > 0 ? "#f59e0b" : "#ef4444",
    },
  ];
}

// ─── MARKET IMPACT ENGINE ──────────────────────────────────────────

export function getMarketImpacts(): MarketImpactInsight[] {
  const rng = seededRng(Date.now().toString().slice(0, -4));
  const impacts: ("positive" | "negative" | "neutral")[] = ["positive", "negative", "neutral"];
  const pick = () => impacts[Math.floor(rng() * impacts.length)];
  return [
    {
      factor: "Interest Rate Changes", currentState: `RBI Repo Rate: ${(6 + rng() * 0.75).toFixed(2)}% | Stance: Accommodative`,
      impactOnMF: "Rate cuts boost both equity (lower cost of capital) and debt fund (bond price appreciation) NAVs. Duration funds benefit most.", affectedCategories: ["Debt", "Hybrid", "Large Cap"],
      direction: pick(), beginnerExplanation: "When RBI cuts interest rates, companies borrow cheaper (good for stocks) and existing bond prices go up (good for debt funds). It's win-win for MF investors.",
    },
    {
      factor: "Inflation Trend", currentState: `CPI: ${(4 + rng() * 2.5).toFixed(1)}% | ${rng() > 0.5 ? "Above" : "Within"} RBI target`,
      impactOnMF: "High inflation erodes real returns and delays rate cuts. Equity funds with pricing power perform better. Debt fund returns may fall below inflation.", affectedCategories: ["All equity", "Debt", "Gold"],
      direction: pick(), beginnerExplanation: "Inflation is like a silent tax on your money. If inflation is 6% and your fund returns 8%, your real gain is only 2%. That's why equity funds matter — they historically beat inflation.",
    },
    {
      factor: "Sector Rotation", currentState: `Leading: ${rng() > 0.5 ? "Banking & Finance" : "IT & Technology"} | Lagging: ${rng() > 0.5 ? "FMCG" : "Auto"}`,
      impactOnMF: "Sector rotation impacts thematic and sectoral fund performance. Diversified funds automatically adjust. Timing sectoral bets is extremely difficult.", affectedCategories: ["Sectoral", "Thematic", "Flexi Cap"],
      direction: "neutral", beginnerExplanation: "Different sectors take turns performing well. That's why diversified funds (flexi cap, index) are better than betting on one sector — you automatically own the winners.",
    },
    {
      factor: "Global Events", currentState: `US Fed: ${rng() > 0.5 ? "Holding rates" : "Signaling cuts"} | Geopolitical: ${rng() > 0.5 ? "Elevated tension" : "Moderate calm"}`,
      impactOnMF: "Global uncertainty triggers FII selling in Indian markets, impacting large-cap and banking funds. International funds provide diversification.", affectedCategories: ["Large Cap", "International", "Banking"],
      direction: pick(), beginnerExplanation: "When global markets are worried, foreign investors pull money from India temporarily. Your SIP actually benefits — you buy more units at lower prices during these dips.",
    },
    {
      factor: "Rupee Movement", currentState: `USD/INR: ₹${(83 + rng() * 4).toFixed(2)} | ${rng() > 0.5 ? "Weakening" : "Stable"}`,
      impactOnMF: "Weak rupee benefits IT and pharma (export earners) but hurts oil marketing companies. International fund returns get a boost from weaker rupee.", affectedCategories: ["IT Sector", "Pharma", "International"],
      direction: pick(), beginnerExplanation: "When the rupee weakens, your international fund investments become worth more in rupee terms. IT companies also benefit because they earn in dollars.",
    },
  ];
}

// ─── NAV SECTIONS FOR PLATFORM ─────────────────────────────────────

export const MF_NAV_SECTIONS = [
  { id: "discover", label: "Discover", emoji: "🔍" },
  { id: "copilot", label: "AI Copilot", emoji: "🤖" },
  { id: "simulator", label: "SIP Simulator", emoji: "📊" },
  { id: "goals", label: "Goal Planner", emoji: "🎯" },
  { id: "suitability", label: "For You", emoji: "👤" },
  { id: "compare", label: "Compare", emoji: "⚖️" },
  { id: "insights", label: "Market Insights", emoji: "🌍" },
  { id: "learn", label: "Learn", emoji: "📚" },
] as const;

export type MFSection = typeof MF_NAV_SECTIONS[number]["id"];
