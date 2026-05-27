// ═══════════════════════════════════════════════════════════════════════
// MUTUAL FUND DATA ENGINE — Institutional-Grade Fund Intelligence
// Morningstar + Value Research + CRISIL + Bloomberg Fund Analytics
// ═══════════════════════════════════════════════════════════════════════

function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

// ═══════════════════════════════════════════
// 1. DETAILED FUND INFO
// ═══════════════════════════════════════════

export interface FundDetailedInfo {
  symbol: string;
  name: string;
  amc: string;
  category: string;
  benchmarkIndex: string;
  launchDate: string;
  fundManager: string;
  fundManagerExp: string;
  aum: string; // in Cr
  nav: number;
  expenseRatio: number; // %
  exitLoad: string;
  minInvestment: string;
  sipMin: string;
  lockIn: string;
  riskometer: string;
  investmentStyle: "Growth" | "Value" | "Blend" | "GARP";
  planType: string;
  turnoverRatio: number; // %
  // Returns
  return1m: number;
  return3m: number;
  return6m: number;
  return1y: number;
  return3y: number;
  return5y: number;
  return10y: number;
  sipReturn3y: number;
  sipReturn5y: number;
  // Risk metrics
  alpha: number;
  beta: number;
  sharpe: number;
  sortino: number;
  treynor: number;
  infoRatio: number;
  stdDev: number;
  maxDrawdown: number;
  downsideRisk: number;
  // Portfolio
  topHoldings: { name: string; weight: number; sector: string }[];
  sectorAllocation: { sector: string; weight: number }[];
  marketCapAlloc: { type: string; weight: number }[];
  equityPct: number;
  debtPct: number;
  cashPct: number;
  overseaPct: number;
  concentrationTop10: number;
  // Scores
  overallScore: number;
  fundamentalScore: number;
  consistencyScore: number;
  riskScore: number;
  valuationScore: number;
  sipSuitability: number;
  wealthCreation: number;
}

const FUND_MANAGERS: Record<string, { name: string; exp: string }> = {
  "SBI MF": { name: "R. Srinivasan", exp: "22 years" },
  "HDFC MF": { name: "Prashant Jain / Roshi Jain", exp: "28 years" },
  "ICICI Pru": { name: "Sankaran Naren", exp: "30 years" },
  "Axis MF": { name: "Jinesh Gopani / Shreyash Devalkar", exp: "20 years" },
  "Kotak MF": { name: "Harsha Upadhyaya", exp: "24 years" },
  "Mirae Asset": { name: "Neelesh Surana", exp: "26 years" },
  "DSP MF": { name: "Vinit Sambre", exp: "18 years" },
  "PPFAS MF": { name: "Rajeev Thakkar", exp: "25 years" },
  "UTI MF": { name: "Ajay Tyagi", exp: "22 years" },
  "Nippon India": { name: "Samir Rachh", exp: "27 years" },
  "Quant MF": { name: "Sanjeev Sharma", exp: "20 years" },
  "Canara Robeco": { name: "Shridatta Bhandwaldar", exp: "16 years" },
  "Motilal Oswal": { name: "Akash Singhania", exp: "18 years" },
  "Tata MF": { name: "Rahul Singh", exp: "22 years" },
  "Navi MF": { name: "Passive Strategy", exp: "Index" },
};

const BENCHMARKS: Record<string, string> = {
  "Large Cap": "Nifty 100 TRI",
  "Mid Cap": "Nifty Midcap 150 TRI",
  "Small Cap": "Nifty Smallcap 250 TRI",
  "Flexi Cap": "Nifty 500 TRI",
  "ELSS": "Nifty 500 TRI",
  "Index": "Nifty 50 TRI",
  "Hybrid": "CRISIL Hybrid 35+65 Aggressive",
  "Debt": "CRISIL Composite Bond Index",
  "Sectoral": "Nifty 500 TRI",
};

const SAMPLE_HOLDINGS = [
  { name: "HDFC Bank", sector: "Financial Services" },
  { name: "ICICI Bank", sector: "Financial Services" },
  { name: "Reliance Industries", sector: "Oil & Gas" },
  { name: "Infosys", sector: "Technology" },
  { name: "TCS", sector: "Technology" },
  { name: "Bharti Airtel", sector: "Telecom" },
  { name: "L&T", sector: "Capital Goods" },
  { name: "ITC", sector: "FMCG" },
  { name: "Axis Bank", sector: "Financial Services" },
  { name: "SBI", sector: "Financial Services" },
  { name: "Kotak Mahindra Bank", sector: "Financial Services" },
  { name: "Sun Pharma", sector: "Healthcare" },
  { name: "HUL", sector: "FMCG" },
  { name: "Maruti Suzuki", sector: "Automobile" },
  { name: "Power Grid Corp", sector: "Utilities" },
  { name: "NTPC", sector: "Utilities" },
  { name: "Wipro", sector: "Technology" },
  { name: "Bajaj Finance", sector: "Financial Services" },
  { name: "Asian Paints", sector: "Consumer Durables" },
  { name: "Titan Company", sector: "Consumer Durables" },
];

const SECTORS = ["Financial Services", "Technology", "Oil & Gas", "FMCG", "Healthcare", "Automobile", "Capital Goods", "Utilities", "Consumer Durables", "Telecom", "Metals", "Real Estate", "Chemicals"];

export function generateFundDetail(symbol: string, name: string, amc: string, category: string, riskLevel: string): FundDetailedInfo {
  const rng = seededRng(symbol);
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const fm = FUND_MANAGERS[amc] || { name: "Fund Manager", exp: "15 years" };
  const isDebt = category === "Debt";
  const isHybrid = category === "Hybrid";
  const isIndex = category === "Index";
  const isSmall = category === "Small Cap";
  const isMid = category === "Mid Cap";

  const nav = isDebt ? +(25 + rng() * 40).toFixed(2) : +(30 + rng() * 600).toFixed(2);
  const aumVal = isDebt ? (500 + rng() * 15000) : isSmall ? (5000 + rng() * 25000) : (2000 + rng() * 40000);

  const base1y = isDebt ? (6 + rng() * 3) : isHybrid ? (8 + rng() * 10) : isSmall ? (10 + rng() * 30) : isMid ? (10 + rng() * 25) : (8 + rng() * 18);
  const base3y = isDebt ? (6 + rng() * 2) : isHybrid ? (9 + rng() * 7) : (12 + rng() * 14);
  const base5y = isDebt ? (6.5 + rng() * 1.5) : isHybrid ? (10 + rng() * 5) : (12 + rng() * 10);

  // Generate top holdings
  const holdingsPool = [...SAMPLE_HOLDINGS].sort(() => rng() - 0.5);
  const topHoldings = holdingsPool.slice(0, 10).map((h, i) => ({
    name: h.name,
    weight: +(10 - i * 0.8 + (rng() - 0.5) * 2).toFixed(2),
    sector: h.sector,
  }));

  // Sector allocation
  const shuffledSectors = [...SECTORS].sort(() => rng() - 0.5);
  let remainingWeight = 100;
  const sectorAllocation = shuffledSectors.slice(0, 8).map((sector, i) => {
    const w = i < 7 ? +(5 + rng() * (i === 0 ? 25 : 15)).toFixed(1) : +remainingWeight.toFixed(1);
    remainingWeight -= w;
    return { sector, weight: Math.max(1, w) };
  });

  // Market cap allocation
  const largePct = isSmall ? +(rng() * 10).toFixed(1) : isMid ? +(5 + rng() * 20).toFixed(1) : category === "Large Cap" ? +(75 + rng() * 20).toFixed(1) : +(30 + rng() * 40).toFixed(1);
  const midPct = isSmall ? +(10 + rng() * 20).toFixed(1) : isMid ? +(60 + rng() * 25).toFixed(1) : +(10 + rng() * 25).toFixed(1);
  const smallPct = +(100 - +largePct - +midPct).toFixed(1);

  const alpha = isIndex ? +(rng() * 0.3 - 0.15).toFixed(2) : isDebt ? +(rng() * 1 - 0.2).toFixed(2) : +(rng() * 5 - 1).toFixed(2);
  const sharpe = isDebt ? +(0.8 + rng() * 1.5).toFixed(2) : +(0.3 + rng() * 1.8).toFixed(2);

  return {
    symbol, name, amc, category,
    benchmarkIndex: BENCHMARKS[category] || "Nifty 500 TRI",
    launchDate: `${2005 + Math.floor(rng() * 15)}-${String(Math.floor(rng() * 12) + 1).padStart(2, "0")}-01`,
    fundManager: fm.name,
    fundManagerExp: fm.exp,
    aum: `₹${aumVal.toFixed(0)} Cr`,
    nav,
    expenseRatio: isIndex ? +(0.05 + rng() * 0.15).toFixed(2) : isDebt ? +(0.2 + rng() * 0.5).toFixed(2) : +(0.3 + rng() * 1.2).toFixed(2),
    exitLoad: isDebt ? "Nil (after 3 months)" : category === "ELSS" ? "Nil (3Y lock-in)" : "1% if redeemed < 1Y",
    minInvestment: "₹500",
    sipMin: "₹500",
    lockIn: category === "ELSS" ? "3 Years" : "None",
    riskometer: riskLevel,
    investmentStyle: pick(["Growth", "Value", "Blend", "GARP"] as const),
    planType: "Direct - Growth",
    turnoverRatio: isIndex ? +(5 + rng() * 15).toFixed(0) : +(20 + rng() * 80).toFixed(0),
    // Returns
    return1m: +(rng() * 8 - 3).toFixed(2),
    return3m: +(rng() * 15 - 5).toFixed(2),
    return6m: +(rng() * 20 - 5).toFixed(2),
    return1y: +base1y.toFixed(2),
    return3y: +base3y.toFixed(2),
    return5y: +base5y.toFixed(2),
    return10y: +(base5y - 1 + rng() * 3).toFixed(2),
    sipReturn3y: +(base3y - 2 + rng() * 5).toFixed(2),
    sipReturn5y: +(base5y - 1 + rng() * 4).toFixed(2),
    // Risk
    alpha,
    beta: isDebt ? +(0.1 + rng() * 0.3).toFixed(2) : +(0.7 + rng() * 0.5).toFixed(2),
    sharpe,
    sortino: +(sharpe * (1.1 + rng() * 0.5)).toFixed(2),
    treynor: +(5 + rng() * 15).toFixed(2),
    infoRatio: +(rng() * 1.5 - 0.3).toFixed(2),
    stdDev: isDebt ? +(1 + rng() * 3).toFixed(2) : isHybrid ? +(5 + rng() * 6).toFixed(2) : +(10 + rng() * 10).toFixed(2),
    maxDrawdown: isDebt ? +(rng() * 5).toFixed(1) : isHybrid ? +(8 + rng() * 12).toFixed(1) : +(15 + rng() * 25).toFixed(1),
    downsideRisk: isDebt ? +(0.5 + rng() * 2).toFixed(2) : +(4 + rng() * 8).toFixed(2),
    // Portfolio
    topHoldings,
    sectorAllocation,
    marketCapAlloc: [
      { type: "Large Cap", weight: +largePct },
      { type: "Mid Cap", weight: +midPct },
      { type: "Small Cap", weight: Math.max(0, +smallPct) },
    ],
    equityPct: isDebt ? +(rng() * 5).toFixed(1) : isHybrid ? +(60 + rng() * 15).toFixed(1) : +(90 + rng() * 8).toFixed(1),
    debtPct: isDebt ? +(85 + rng() * 12).toFixed(1) : isHybrid ? +(20 + rng() * 15).toFixed(1) : +(rng() * 5).toFixed(1),
    cashPct: +(1 + rng() * 6).toFixed(1),
    overseaPct: amc === "PPFAS MF" ? +(15 + rng() * 20).toFixed(1) : +(rng() * 5).toFixed(1),
    concentrationTop10: +(35 + rng() * 30).toFixed(1),
    // Scores
    overallScore: +(55 + rng() * 40).toFixed(0),
    fundamentalScore: +(50 + rng() * 45).toFixed(0),
    consistencyScore: +(40 + rng() * 55).toFixed(0),
    riskScore: +(30 + rng() * 60).toFixed(0),
    valuationScore: +(40 + rng() * 50).toFixed(0),
    sipSuitability: +(50 + rng() * 45).toFixed(0),
    wealthCreation: +(45 + rng() * 50).toFixed(0),
  };
}


// ═══════════════════════════════════════════
// 2. MF GLOSSARY
// ═══════════════════════════════════════════

export interface MFTerm {
  term: string;
  abbr: string;
  category: "Returns" | "Risk" | "Portfolio" | "Regulatory" | "Strategy" | "Cost" | "Structure";
  definition: string;
  significance: string;
  investorImpact: string;
}

export const MF_GLOSSARY: MFTerm[] = [
  { term: "Net Asset Value", abbr: "NAV", category: "Returns", definition: "The per-unit market value of all securities held by the fund minus liabilities, divided by units outstanding.", significance: "NAV is the price at which you buy/sell MF units. It reflects daily portfolio valuation.", investorImpact: "A high NAV doesn't mean expensive — it means the fund has compounded well over time. Always compare returns, not NAV." },
  { term: "Compound Annual Growth Rate", abbr: "CAGR", category: "Returns", definition: "Annualized return assuming profits are reinvested. Smooths out volatility over the period.", significance: "The standard measure for comparing fund performance across different time periods.", investorImpact: "5Y CAGR > 15% for equity funds is excellent. Compare with benchmark CAGR for alpha assessment." },
  { term: "Expense Ratio", abbr: "ER", category: "Cost", definition: "Annual fee charged by the AMC for managing the fund, expressed as a percentage of AUM.", significance: "Directly reduces returns. SEBI caps ER based on AUM slabs. Direct plans have lower ER.", investorImpact: "0.5% ER difference compounds to ~12-15% lower corpus over 20 years. Always prefer Direct plans." },
  { term: "Standard Deviation", abbr: "SD", category: "Risk", definition: "Measures the volatility of fund returns around the mean. Higher SD = more volatile.", significance: "Primary risk metric. Small cap SD ~18-22%, Large cap SD ~12-15%, Debt SD ~2-4%.", investorImpact: "If you can't stomach 20%+ drawdowns, avoid funds with SD > 18%. Match SD to your risk tolerance." },
  { term: "Sharpe Ratio", abbr: "SR", category: "Risk", definition: "Risk-adjusted return: (Fund Return - Risk-Free Rate) / Standard Deviation.", significance: "Sharpe > 1 is good, > 1.5 is excellent. Compares reward per unit of total risk taken.", investorImpact: "Choose funds with higher Sharpe over peers — they deliver better returns for the risk taken." },
  { term: "Alpha", abbr: "α", category: "Risk", definition: "Excess return generated by the fund manager above the benchmark return, after adjusting for risk.", significance: "Positive alpha = fund manager is adding value. Negative alpha = you're better off with an index fund.", investorImpact: "Consistently positive alpha over 5Y justifies paying higher expense ratio for active funds." },
  { term: "Beta", abbr: "β", category: "Risk", definition: "Sensitivity of fund returns to benchmark movements. Beta = 1 means moves in line with market.", significance: "Beta > 1 = aggressive (amplifies market moves). Beta < 1 = defensive (dampens moves).", investorImpact: "In bull markets, high beta funds outperform. In bear markets, low beta funds protect capital." },
  { term: "Sortino Ratio", abbr: "Sortino", category: "Risk", definition: "Like Sharpe but only penalizes downside volatility, not upside. More relevant for asymmetric returns.", significance: "Sortino > 2 is excellent. Better than Sharpe for equity funds where upside volatility is desired.", investorImpact: "Prefer funds with high Sortino — they generate returns while limiting the downside." },
  { term: "Maximum Drawdown", abbr: "Max DD", category: "Risk", definition: "The largest peak-to-trough decline in NAV. Measures worst-case historical loss.", significance: "Max DD of 30% means the fund lost 30% from its peak at some point.", investorImpact: "Can you handle a 30% temporary loss? If not, choose funds with Max DD < 20%." },
  { term: "Rolling Returns", abbr: "Rolling", category: "Returns", definition: "Returns calculated over overlapping periods (e.g., every 1Y return for the last 10Y).", significance: "Much better than point-to-point returns. Shows consistency across market cycles.", investorImpact: "A fund with 90%+ positive rolling 3Y returns is highly reliable for SIP investors." },
  { term: "Systematic Investment Plan", abbr: "SIP", category: "Strategy", definition: "Investing a fixed amount at regular intervals. Automates rupee cost averaging.", significance: "SIP in equity MFs has created massive wealth for Indian retail investors over 10-20Y horizons.", investorImpact: "SIP returns often beat lumpsum returns in volatile markets due to rupee cost averaging." },
  { term: "Assets Under Management", abbr: "AUM", category: "Structure", definition: "Total market value of all investments managed by the fund.", significance: "Larger AUM = more stable but harder to generate alpha. Very large AUM is a drag for small/mid cap funds.", investorImpact: "Avoid small cap funds with AUM > ₹25,000 Cr — they can't deploy capital efficiently." },
  { term: "Exit Load", abbr: "Exit Load", category: "Cost", definition: "Fee charged when you redeem units before a specified period (usually 1 year).", significance: "Discourages short-term trading. Typically 1% if redeemed within 1 year for equity funds.", investorImpact: "Plan to hold equity MFs for 3Y+ minimum. ELSS has a mandatory 3Y lock-in." },
  { term: "Information Ratio", abbr: "IR", category: "Risk", definition: "Measures consistency of alpha generation: Alpha / Tracking Error.", significance: "IR > 0.5 is good, > 1 is exceptional. Shows if the manager consistently beats the benchmark.", investorImpact: "High IR funds justify their expense ratio — the manager reliably adds value." },
  { term: "Tracking Error", abbr: "TE", category: "Risk", definition: "Standard deviation of the difference between fund return and benchmark return.", significance: "For index funds, lower TE is better (means fund closely tracks the index). For active funds, moderate TE is expected.", investorImpact: "Choose index funds with TE < 0.5%. For active funds, TE of 3-6% is normal." },
  { term: "Portfolio Turnover Ratio", abbr: "PTR", category: "Portfolio", definition: "Percentage of portfolio holdings replaced during a year. High turnover = active trading.", significance: "High PTR (>100%) means the manager is churning aggressively. Adds transaction costs.", investorImpact: "PTR > 100% may indicate a short-term trading approach. Long-term funds typically have PTR of 20-50%." },
  { term: "Equity Linked Savings Scheme", abbr: "ELSS", category: "Regulatory", definition: "Tax-saving mutual fund with 3-year lock-in. Qualifies for Section 80C deduction up to ₹1.5 lakh.", significance: "Best tax-saving instrument for equity exposure. Shortest lock-in among 80C options.", investorImpact: "ELSS gives tax benefit + equity growth. 3Y lock-in enforces discipline. Best for long-term." },
  { term: "Balanced Advantage Fund", abbr: "BAF", category: "Strategy", definition: "Dynamic asset allocation fund that adjusts equity-debt mix based on market valuations.", significance: "Automatically reduces equity in expensive markets and increases in cheap markets.", investorImpact: "Ideal for conservative investors wanting equity exposure with built-in downside protection." },
];

export const MF_GLOSSARY_CATEGORIES = ["All", "Returns", "Risk", "Portfolio", "Regulatory", "Strategy", "Cost", "Structure"] as const;


// ═══════════════════════════════════════════
// 3. FUND RISK ANALYSIS
// ═══════════════════════════════════════════

export interface MFRisk {
  name: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  probability: number;
  impact: string;
  description: string;
  mitigation: string;
}

export function generateMFRisks(symbol: string, category: string, riskLevel: string): MFRisk[] {
  const rng = seededRng(`mfr-${symbol}`);
  const isDebt = category === "Debt";
  const isSmall = category === "Small Cap";
  return [
    { name: "Market Risk", severity: isDebt ? "Low" : isSmall ? "Critical" : "High", probability: +(isDebt ? 15 + rng() * 15 : 30 + rng() * 30).toFixed(0), impact: isDebt ? "NAV may fluctuate 2-5% in volatile periods" : `NAV can drop ${isSmall ? "30-50" : "15-30"}% in bear markets`, description: "Risk of loss due to broad market decline affecting portfolio holdings.", mitigation: "SIP investing averages out market volatility. Stay invested for 5Y+ minimum." },
    { name: "Concentration Risk", severity: "Medium", probability: +(15 + rng() * 20).toFixed(0), impact: "Top 10 holdings comprise 35-65% of portfolio", description: "Over-reliance on few stocks/sectors can amplify losses if those positions decline.", mitigation: "Choose diversified funds with top-10 concentration below 50%. Multi-cap/flexi-cap funds are inherently diversified." },
    { name: "Fund Manager Risk", severity: "Medium", probability: +(10 + rng() * 15).toFixed(0), impact: "Performance may deteriorate if key manager exits", description: "Active fund performance depends heavily on the fund manager's skill and judgment.", mitigation: "Prefer funds managed by teams rather than star managers. Check manager tenure before investing." },
    { name: "Liquidity Risk", severity: isSmall ? "High" : isDebt ? "Medium" : "Low", probability: +(isSmall ? 20 + rng() * 20 : 5 + rng() * 15).toFixed(0), impact: isSmall ? "May face difficulty selling small cap positions quickly" : "Redemption pressure may force selling at unfavorable prices", description: "Risk of not being able to liquidate holdings without significant price impact.", mitigation: isSmall ? "Avoid small cap funds with AUM > ₹25,000 Cr. Check portfolio liquidity." : "Choose funds with adequate AUM and liquid holdings." },
    { name: "Style Drift Risk", severity: "Medium", probability: +(10 + rng() * 15).toFixed(0), impact: "Fund may deviate from its stated investment mandate", description: "Fund manager may shift strategy (e.g., large cap fund buying mid caps) without clear communication.", mitigation: "Monitor monthly portfolio disclosures. Check if market cap allocation matches the fund's stated category." },
    { name: "Valuation Risk", severity: isSmall ? "High" : "Medium", probability: +(15 + rng() * 25).toFixed(0), impact: "Overvalued holdings may correct sharply", description: "Portfolio may hold stocks trading at elevated valuations relative to fundamentals.", mitigation: "Check portfolio PE ratio vs benchmark PE. Prefer funds with PE below market average." },
    ...(isDebt ? [
      { name: "Credit Risk", severity: "High" as const, probability: +(10 + rng() * 20).toFixed(0), impact: "Default by issuers can cause NAV to fall sharply", description: "Risk that bond issuers in the portfolio may default on interest or principal payments.", mitigation: "Choose funds investing primarily in AAA/sovereign bonds. Avoid credit risk funds unless you understand the risk." },
      { name: "Interest Rate Risk", severity: "High" as const, probability: +(20 + rng() * 25).toFixed(0), impact: "Rising rates cause bond prices and NAV to fall", description: "Debt fund NAV is inversely related to interest rate movements. Longer duration = higher sensitivity.", mitigation: "In rising rate environments, prefer short duration / liquid funds. In falling rate environments, longer duration funds benefit." },
    ] : [
      { name: "Sector Concentration Risk", severity: "Medium" as const, probability: +(15 + rng() * 20).toFixed(0), impact: "Overweight sectors may underperform", description: "Heavy allocation to specific sectors (e.g., Banking 30%+) creates cyclical vulnerability.", mitigation: "Diversify across funds with different sector tilts. Check sector allocation monthly." },
      { name: "Small/Mid Cap Volatility", severity: isSmall || category === "Mid Cap" ? "High" as const : "Low" as const, probability: +(isSmall ? 30 + rng() * 25 : 10 + rng() * 15).toFixed(0), impact: isSmall ? "Can drop 40-60% in sharp corrections" : "May underperform in risk-off environments", description: "Small and mid cap stocks are inherently more volatile and less liquid than large caps.", mitigation: "Allocate max 20-25% of equity portfolio to small caps. SIP is mandatory, never lumpsum at peaks." },
    ]),
  ];
}


// ═══════════════════════════════════════════
// 4. MACRO DRIVERS FOR MF
// ═══════════════════════════════════════════

export interface MFDriver {
  name: string;
  category: "Macro" | "Market" | "Regulatory" | "Global" | "Flow" | "Sentiment";
  importance: "Critical" | "High" | "Medium";
  currentState: string;
  impact: "Positive" | "Negative" | "Neutral";
  description: string;
}

export function generateMFDrivers(category: string): MFDriver[] {
  const rng = seededRng(`mfdrv-${category}`);
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const impacts: ("Positive" | "Negative" | "Neutral")[] = ["Positive", "Negative", "Neutral"];
  return [
    { name: "RBI Monetary Policy", category: "Macro", importance: "Critical", currentState: `Repo Rate: ${(6 + rng() * 0.75).toFixed(2)}% | ${pick(["Neutral stance", "Easing bias", "Data-dependent"])}`, impact: pick(impacts), description: "Rate cuts boost equity and debt fund NAVs. Rate hikes pressure both." },
    { name: "Domestic Equity Flows (DII)", category: "Flow", importance: "Critical", currentState: `Monthly SIP: ₹${(18000 + rng() * 8000).toFixed(0)} Cr | ${pick(["Record inflows", "Stable flows", "Slight moderation"])}`, impact: pick(impacts), description: "SIP flows provide consistent demand for equity markets, supporting fund NAVs." },
    { name: "FII/FPI Flows", category: "Flow", importance: "High", currentState: `Net ${rng() > 0.5 ? "buying" : "selling"}: ₹${(rng() * 20000).toFixed(0)} Cr MTD`, impact: pick(impacts), description: "FPI flows significantly impact large cap funds and market-wide sentiment." },
    { name: "GDP Growth", category: "Macro", importance: "High", currentState: `${(5.5 + rng() * 2.5).toFixed(1)}% YoY | ${pick(["Above trend", "At trend", "Moderating"])}`, impact: pick(impacts), description: "Strong GDP growth supports corporate earnings, driving equity fund returns." },
    { name: "Corporate Earnings Season", category: "Market", importance: "Critical", currentState: pick(["Nifty EPS growth 12-15% YoY", "Earnings beat expectations", "Mixed results — financials strong", "Broad-based earnings recovery"]), impact: pick(impacts), description: "Quarterly earnings directly drive stock prices and mutual fund NAVs." },
    { name: "Market Valuation (PE Ratio)", category: "Market", importance: "High", currentState: `Nifty PE: ${(18 + rng() * 8).toFixed(1)}x | ${pick(["Fair value zone", "Slightly expensive", "Attractive for SIP", "Above long-term average"])}`, impact: pick(impacts), description: "Market PE ratio determines future return potential. High PE = lower forward returns." },
    { name: "Inflation (CPI)", category: "Macro", importance: "High", currentState: `${(3.5 + rng() * 3).toFixed(1)}% YoY | ${pick(["Within RBI target", "Above comfort zone", "Moderating trend"])}`, impact: pick(impacts), description: "High inflation erodes real returns and forces RBI to maintain tight policy." },
    { name: "Global Markets & US Fed", category: "Global", importance: "High", currentState: `US Fed: ${pick(["Rate cut expected", "On hold", "Data-dependent"])} | S&P 500: ${pick(["Near all-time highs", "Consolidating", "Correction mode"])}`, impact: pick(impacts), description: "Global risk sentiment and US interest rates impact FPI flows and Indian market direction." },
    { name: "SEBI Regulatory Changes", category: "Regulatory", importance: "Medium", currentState: pick(["True-to-label norms enforced", "Expense ratio rationalization", "New MF categories proposed", "Stress testing norms for small caps"]), impact: pick(impacts), description: "SEBI regulations on expense ratios, portfolio disclosure, and fund categorization affect fund operations." },
    { name: "Rupee & Oil Prices", category: "Global", importance: "Medium", currentState: `USD/INR: ₹${(82 + rng() * 6).toFixed(2)} | Brent: $${(65 + rng() * 30).toFixed(0)}/bbl`, impact: pick(impacts), description: "Weak rupee and high oil prices pressure India's current account and corporate margins." },
    { name: "Retail Investor Sentiment", category: "Sentiment", importance: "Medium", currentState: pick(["Strong — new demat accounts at record pace", "Moderating — profit booking by retail", "Cautious optimism", "FOMO-driven inflows in small caps"]), impact: pick(impacts), description: "Retail investor behavior drives flows into specific fund categories and can create bubbles." },
  ];
}


// ═══════════════════════════════════════════
// 5. QUANT MODELS
// ═══════════════════════════════════════════

export interface MFQuantModel {
  name: string;
  formula: string;
  interpretation: string;
  institutionalUse: string;
  strengths: string[];
  weaknesses: string[];
}

export const MF_QUANT_MODELS: MFQuantModel[] = [
  { name: "Capital Asset Pricing Model (CAPM)", formula: "E(R) = Rf + β × (Rm - Rf)", interpretation: "Expected return of a fund based on its systematic risk (beta). A fund with beta=1.2 should return 1.2x the market excess return.", institutionalUse: "Fund performance evaluation, expected return calculation, alpha measurement.", strengths: ["Simple and intuitive", "Standard academic model", "Quantifies systematic risk"], weaknesses: ["Assumes single risk factor", "Beta instability", "Ignores size/value factors"] },
  { name: "Fama-French Three-Factor Model", formula: "R - Rf = α + β₁(Rm-Rf) + β₂(SMB) + β₃(HML)", interpretation: "Decomposes fund returns into market, size (SMB), and value (HML) factors. True alpha remains after controlling for these exposures.", institutionalUse: "Active fund evaluation, factor attribution, style analysis, manager skill assessment.", strengths: ["Explains 90%+ of portfolio return variation", "Identifies style exposures", "True alpha measurement"], weaknesses: ["Factor definitions vary", "Backward-looking", "Doesn't capture momentum"] },
  { name: "Jensen's Alpha", formula: "α = Rp - [Rf + βp(Rm - Rf)]", interpretation: "Excess return earned above what CAPM predicts for the fund's level of risk. Positive alpha = manager skill.", institutionalUse: "Fund manager skill assessment, active vs passive decision, performance attribution.", strengths: ["Direct measure of manager value-add", "Risk-adjusted", "Easy to interpret"], weaknesses: ["Depends on beta estimation", "Assumes CAPM is correct", "Time-period sensitive"] },
  { name: "Treynor Ratio", formula: "Treynor = (Rp - Rf) / βp", interpretation: "Reward per unit of systematic risk. Higher = better risk-adjusted return for diversified investors.", institutionalUse: "Comparing funds within the same category, portfolio allocation decisions.", strengths: ["Uses systematic risk only", "Better for diversified portfolios", "Comparable across categories"], weaknesses: ["Only considers systematic risk", "Beta estimation issues", "Not suitable for standalone funds"] },
  { name: "Monte Carlo Simulation (MF Returns)", formula: "Simulate N scenarios: NAV_T = NAV_0 × exp[(μ - σ²/2)T + σ√T × Z]", interpretation: "Simulates thousands of possible NAV paths to estimate probability distribution of future returns.", institutionalUse: "SIP return projection, goal planning, retirement corpus estimation, probability of meeting targets.", strengths: ["Captures full return distribution", "Accounts for path dependency", "Probabilistic output"], weaknesses: ["Assumes return distribution", "Parameter sensitivity", "Computationally intensive"] },
  { name: "Value at Risk (Fund VaR)", formula: "VaR = NAV × σ × z_α × √t", interpretation: "Maximum expected loss at a given confidence level. 95% monthly VaR of 8% means 95% chance of losing less than 8% in a month.", institutionalUse: "Risk budgeting, portfolio risk management, regulatory compliance for AMCs.", strengths: ["Single risk number", "Easy to communicate", "Industry standard"], weaknesses: ["Underestimates tail risk", "Assumes normality", "Not coherent risk measure"] },
  { name: "Information Ratio", formula: "IR = (Rp - Rb) / σ(Rp - Rb) = Alpha / Tracking Error", interpretation: "Measures consistency of outperformance. IR > 0.5 is good, > 1 is exceptional.", institutionalUse: "Active fund evaluation, manager selection, fee justification for active management.", strengths: ["Measures alpha consistency", "Adjusts for active risk", "Best metric for active funds"], weaknesses: ["Benchmark dependency", "Time-period sensitive", "Tracking error can be noisy"] },
  { name: "Capture Ratio (Up/Down)", formula: "Up Capture = Fund Return (up months) / Benchmark Return (up months) × 100", interpretation: "Upside capture of 110% and downside capture of 80% means the fund captures more upside and protects in downside.", institutionalUse: "Asymmetric return analysis, defensive fund identification, bear market resilience.", strengths: ["Intuitive interpretation", "Captures asymmetry", "Practical for investors"], weaknesses: ["Depends on market regime classification", "Month-level granularity", "Sample size issues"] },
];


// ═══════════════════════════════════════════
// 6. AI FEATURES & DATA SOURCES
// ═══════════════════════════════════════════

export interface MFAIFeature {
  name: string;
  icon: string;
  description: string;
  capability: string;
}

export const MF_AI_FEATURES: MFAIFeature[] = [
  { name: "AI Fund Ranking Engine", icon: "🏆", description: "Multi-factor AI model ranking funds using returns, risk, consistency, portfolio quality, and manager skill.", capability: "Real-time ranking of 1000+ schemes across 15+ factors with daily updates." },
  { name: "AI SIP Optimizer", icon: "📈", description: "ML model predicting optimal SIP dates, step-up amounts, and category allocation for goal-based investing.", capability: "Personalized SIP strategy with Monte Carlo simulations for goal probability estimation." },
  { name: "AI Portfolio Rebalancer", icon: "⚖️", description: "Dynamic rebalancing engine that adjusts fund allocation based on market conditions and risk tolerance.", capability: "Quarterly rebalancing recommendations with tax-efficient switching between categories." },
  { name: "AI Fund Recommendation", icon: "🎯", description: "Personalized fund recommendations based on investor profile, goals, risk appetite, and market conditions.", capability: "Top 5 fund picks for each investor profile with detailed rationale and expected returns." },
  { name: "AI Crash Detector", icon: "🚨", description: "Early warning system monitoring market breadth, volatility, FII flows, and macro indicators.", capability: "Crash probability score with automated SIP continuation/pause recommendations." },
  { name: "AI Sector Rotation", icon: "🔄", description: "Macro regime detection model identifying which sectors are likely to outperform in current conditions.", capability: "Sector allocation overlay for sectoral/thematic fund selection with 3-6 month outlook." },
  { name: "AI Risk Profiler", icon: "🧠", description: "Behavioral finance-powered risk assessment that goes beyond standard questionnaires.", capability: "True risk tolerance score incorporating loss aversion, regret sensitivity, and financial capacity." },
  { name: "AI NAV Predictor", icon: "🔮", description: "Ensemble model combining fundamental, technical, and flow-based signals for short-term NAV direction.", capability: "1-week NAV direction prediction with 65%+ accuracy for top 50 funds." },
];

export interface MFDataSource {
  name: string;
  category: "Free" | "Premium" | "Institutional";
  coverage: string;
  cost: string;
}

export const MF_DATA_SOURCES: MFDataSource[] = [
  { name: "AMFI India", category: "Free", coverage: "Daily NAV data for all MF schemes in India. Official industry body data.", cost: "Free" },
  { name: "Value Research Online", category: "Free", coverage: "Fund ratings, returns, portfolio, peer comparison. India's leading MF research.", cost: "Free (Premium: ₹2,500/yr)" },
  { name: "Morningstar India", category: "Premium", coverage: "Institutional-grade fund analytics, ratings, manager research, portfolio X-ray.", cost: "$10-50K/yr (Institutional)" },
  { name: "CRISIL Fund Rankings", category: "Premium", coverage: "Quarterly fund rankings based on NAV performance across market cycles.", cost: "Varies" },
  { name: "ACE Mutual Fund", category: "Institutional", coverage: "Complete Indian MF database — AUM, portfolio, transactions, flows.", cost: "₹50K-5L/yr" },
  { name: "NSE / BSE", category: "Free", coverage: "ETF/Index fund NAV, market data, index composition.", cost: "Free" },
  { name: "SEBI", category: "Free", coverage: "Regulatory filings, scheme documents (SID/SAI), AMC disclosures.", cost: "Free" },
  { name: "RBI", category: "Free", coverage: "Interest rates, monetary policy, liquidity data — critical for debt fund analysis.", cost: "Free" },
  { name: "Bloomberg Terminal", category: "Institutional", coverage: "Global fund analytics, flow data, factor models, portfolio analytics.", cost: "$24,000/yr" },
  { name: "Moneycontrol / ET Money", category: "Free", coverage: "Fund comparison, SIP calculators, portfolio tracking tools.", cost: "Free" },
];


// ═══════════════════════════════════════════
// 7. SPARKLINE & FUND COMPARISON
// ═══════════════════════════════════════════

export function generateMFSparkline(symbol: string, points: number = 30): number[] {
  const rng = seededRng(`mfspark-${symbol}`);
  const data: number[] = [];
  let val = 40 + rng() * 30;
  for (let i = 0; i < points; i++) {
    val += (rng() - 0.45) * 3;
    val = Math.max(10, Math.min(95, val));
    data.push(+val.toFixed(2));
  }
  return data;
}


// ═══════════════════════════════════════════
// 8. FUND CATEGORY INSIGHTS
// ═══════════════════════════════════════════

export interface CategoryInsight {
  category: string;
  avgReturn1y: number;
  avgReturn3y: number;
  avgReturn5y: number;
  topFund: string;
  totalAum: string;
  numSchemes: number;
  sipTrend: string;
  outlook: string;
}

export function getCategoryInsights(): CategoryInsight[] {
  const rng = seededRng("cat-insights");
  return [
    { category: "Large Cap", avgReturn1y: +(12 + rng() * 8).toFixed(1), avgReturn3y: +(12 + rng() * 5).toFixed(1), avgReturn5y: +(13 + rng() * 4).toFixed(1), topFund: "Mirae Asset Large Cap", totalAum: `₹${(2 + rng() * 1.5).toFixed(1)} Lakh Cr`, numSchemes: 31, sipTrend: "Stable inflows", outlook: "Attractive after recent correction. Quality large caps trading at reasonable valuations." },
    { category: "Mid Cap", avgReturn1y: +(15 + rng() * 15).toFixed(1), avgReturn3y: +(15 + rng() * 8).toFixed(1), avgReturn5y: +(14 + rng() * 5).toFixed(1), topFund: "Kotak Emerging Equity", totalAum: `₹${(1.5 + rng() * 1).toFixed(1)} Lakh Cr`, numSchemes: 28, sipTrend: "Strong inflows", outlook: "Selective opportunities. SEBI stress testing concerns for larger AUM funds." },
    { category: "Small Cap", avgReturn1y: +(18 + rng() * 25).toFixed(1), avgReturn3y: +(18 + rng() * 12).toFixed(1), avgReturn5y: +(15 + rng() * 8).toFixed(1), topFund: "Nippon India Small Cap", totalAum: `₹${(1.8 + rng() * 1.2).toFixed(1)} Lakh Cr`, numSchemes: 26, sipTrend: "Record inflows — caution warranted", outlook: "Frothy valuations in many pockets. SIP discipline essential, avoid lumpsum at peaks." },
    { category: "Flexi Cap", avgReturn1y: +(14 + rng() * 12).toFixed(1), avgReturn3y: +(14 + rng() * 6).toFixed(1), avgReturn5y: +(13 + rng() * 5).toFixed(1), topFund: "Parag Parikh Flexi Cap", totalAum: `₹${(2.5 + rng() * 1.5).toFixed(1)} Lakh Cr`, numSchemes: 37, sipTrend: "Consistent inflows", outlook: "Best category for core allocation. Fund managers can navigate across market caps." },
    { category: "ELSS", avgReturn1y: +(13 + rng() * 12).toFixed(1), avgReturn3y: +(13 + rng() * 7).toFixed(1), avgReturn5y: +(13 + rng() * 5).toFixed(1), topFund: "Quant Tax Plan", totalAum: `₹${(1.2 + rng() * 0.8).toFixed(1)} Lakh Cr`, numSchemes: 38, sipTrend: "Seasonal — peaks in Jan-Mar", outlook: "Best tax-saving option for equity investors. 3Y lock-in enforces healthy discipline." },
    { category: "Index", avgReturn1y: +(12 + rng() * 8).toFixed(1), avgReturn3y: +(12 + rng() * 4).toFixed(1), avgReturn5y: +(12 + rng() * 3).toFixed(1), topFund: "UTI Nifty 50 Index", totalAum: `₹${(3 + rng() * 2).toFixed(1)} Lakh Cr`, numSchemes: 180, sipTrend: "Fastest growing category", outlook: "Passive investing gaining traction in India. Low cost + market return = hard to beat for most investors." },
    { category: "Hybrid", avgReturn1y: +(10 + rng() * 8).toFixed(1), avgReturn3y: +(10 + rng() * 4).toFixed(1), avgReturn5y: +(10 + rng() * 3).toFixed(1), topFund: "ICICI Pru Balanced Advantage", totalAum: `₹${(4 + rng() * 2).toFixed(1)} Lakh Cr`, numSchemes: 35, sipTrend: "Preferred by conservative investors", outlook: "Dynamic asset allocation provides automatic rebalancing. Good for first-time equity investors." },
    { category: "Debt", avgReturn1y: +(6 + rng() * 3).toFixed(1), avgReturn3y: +(6 + rng() * 2).toFixed(1), avgReturn5y: +(6.5 + rng() * 1.5).toFixed(1), topFund: "HDFC Short Term Debt", totalAum: `₹${(8 + rng() * 4).toFixed(1)} Lakh Cr`, numSchemes: 300, sipTrend: "Institutional dominated", outlook: "Attractive in falling rate environment. Short duration preferred for safety." },
  ];
}
