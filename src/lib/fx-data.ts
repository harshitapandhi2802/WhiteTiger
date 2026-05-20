// ═══════════════════════════════════════════════════════════════════════
// FX DATA ENGINE — Institutional-Grade Global Currency Intelligence
// Bloomberg Terminal + Refinitiv + JPMorgan FX Strategy + BIS Research
// ═══════════════════════════════════════════════════════════════════════

/* ─── Seeded RNG for deterministic data ─── */
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

// ═══════════════════════════════════════════
// 1. CURRENCY PAIR INFORMATION
// ═══════════════════════════════════════════

export interface CurrencyPairInfo {
  pair: string;
  base: string;
  quote: string;
  pairType: "Major" | "Minor" | "Exotic" | "Cross";
  tickSize: number;
  pipValue: string;
  pipette: string;
  lotSizes: { standard: string; mini: string; micro: string; nano: string };
  contractSize: number;
  marginReq: string;
  maxLeverage: string;
  swapLong: number;
  swapShort: number;
  carryDirection: "Positive Long" | "Positive Short" | "Neutral";
  overnightFinancing: string;
  isCommodityCurrency: boolean;
  isReserveCurrency: boolean;
  isSafeHaven: boolean;
  tradingSessions: { session: string; hours: string; overlap: boolean; liquidityLevel: string }[];
  avgDailyVolume: string;
  historicalVol30d: number;
  currentVol: number;
  correlations: { asset: string; value: number }[];
}

const COMMODITY_CURRENCIES = ["AUD", "CAD", "NZD", "NOK", "RUB", "BRL", "ZAR", "CLP"];
const RESERVE_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "CNY"];
const SAFE_HAVENS = ["USD", "JPY", "CHF", "Gold"];

export function generatePairInfo(pair: string, base: string, quote: string): CurrencyPairInfo {
  const rng = seededRng(pair);
  const majors = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD"];
  const minors = ["EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "EUR/AUD", "GBP/CAD"];
  const pairType = majors.includes(pair) ? "Major" : minors.includes(pair) ? "Minor" : (base !== "USD" && quote !== "USD") ? "Cross" : "Exotic";

  const isJPY = quote === "JPY" || base === "JPY";
  const tickSize = isJPY ? 0.001 : 0.00001;
  const pipValue = isJPY ? "¥1,000 per pip (standard lot)" : "$10 per pip (standard lot)";

  const swapLong = +(rng() * 8 - 4).toFixed(2);
  const swapShort = +(rng() * 8 - 4).toFixed(2);

  return {
    pair, base, quote, pairType, tickSize,
    pipValue,
    pipette: isJPY ? "0.001 (3rd decimal)" : "0.00001 (5th decimal)",
    lotSizes: {
      standard: "100,000 units",
      mini: "10,000 units",
      micro: "1,000 units",
      nano: "100 units",
    },
    contractSize: 100000,
    marginReq: pairType === "Major" ? "2% (50:1)" : pairType === "Minor" ? "3.33% (30:1)" : "5% (20:1)",
    maxLeverage: pairType === "Major" ? "50:1" : pairType === "Minor" ? "30:1" : "20:1",
    swapLong, swapShort,
    carryDirection: swapLong > swapShort ? "Positive Long" : swapShort > swapLong ? "Positive Short" : "Neutral",
    overnightFinancing: `Long: ${swapLong > 0 ? "+" : ""}${swapLong} pips/night | Short: ${swapShort > 0 ? "+" : ""}${swapShort} pips/night`,
    isCommodityCurrency: COMMODITY_CURRENCIES.includes(base) || COMMODITY_CURRENCIES.includes(quote),
    isReserveCurrency: RESERVE_CURRENCIES.includes(base) || RESERVE_CURRENCIES.includes(quote),
    isSafeHaven: SAFE_HAVENS.includes(base) || SAFE_HAVENS.includes(quote),
    tradingSessions: [
      { session: "Sydney", hours: "22:00 - 07:00 UTC", overlap: false, liquidityLevel: "Low" },
      { session: "Tokyo", hours: "00:00 - 09:00 UTC", overlap: true, liquidityLevel: quote === "JPY" || base === "JPY" ? "High" : "Medium" },
      { session: "London", hours: "08:00 - 17:00 UTC", overlap: true, liquidityLevel: "Very High" },
      { session: "New York", hours: "13:00 - 22:00 UTC", overlap: true, liquidityLevel: "Very High" },
      { session: "London-NY Overlap", hours: "13:00 - 17:00 UTC", overlap: true, liquidityLevel: "Peak" },
    ],
    avgDailyVolume: pairType === "Major" ? `$${(120 + rng() * 180).toFixed(0)}B` : pairType === "Minor" ? `$${(20 + rng() * 60).toFixed(0)}B` : `$${(2 + rng() * 18).toFixed(0)}B`,
    historicalVol30d: +(5 + rng() * 15).toFixed(1),
    currentVol: +(4 + rng() * 18).toFixed(1),
    correlations: [
      { asset: "DXY", value: +(quote === "USD" ? 0.3 + rng() * 0.6 : -(0.3 + rng() * 0.6)).toFixed(2) },
      { asset: "Gold", value: +(rng() * 1.4 - 0.7).toFixed(2) },
      { asset: "S&P 500", value: +(rng() * 1.2 - 0.4).toFixed(2) },
      { asset: "US 10Y", value: +(rng() * 1.4 - 0.7).toFixed(2) },
      { asset: "Crude Oil", value: +(rng() * 1.2 - 0.5).toFixed(2) },
      { asset: "VIX", value: +(rng() * 0.6 - 0.8).toFixed(2) },
    ],
  };
}


// ═══════════════════════════════════════════
// 2. FX GLOSSARY — Institutional Terms
// ═══════════════════════════════════════════

export interface FXTerm {
  term: string;
  abbr: string;
  category: "Technical" | "Fundamental" | "Central Bank" | "Market Structure" | "Risk" | "Derivatives" | "Macro Theory" | "Indicator";
  definition: string;
  whyItMatters: string;
  currencyImpact: string;
  institutionalRelevance: string;
}

export const FX_GLOSSARY: FXTerm[] = [
  { term: "Pip (Percentage in Point)", abbr: "PIP", category: "Market Structure", definition: "The smallest standard price movement in a currency pair — 0.0001 for most pairs, 0.01 for JPY pairs.", whyItMatters: "Pips are the fundamental unit of measuring profit/loss and spread costs in FX trading.", currencyImpact: "Tight pip spreads indicate high liquidity; wide spreads signal stress or illiquidity.", institutionalRelevance: "Institutional desks measure execution quality in fractional pips (pipettes)." },
  { term: "Average True Range", abbr: "ATR", category: "Technical", definition: "A volatility indicator measuring the average range between high and low prices over a specified period.", whyItMatters: "ATR quantifies current volatility regime — critical for position sizing and stop-loss placement.", currencyImpact: "Rising ATR signals increasing currency volatility, often preceding major moves or regime shifts.", institutionalRelevance: "Used by prop desks and risk systems for dynamic position sizing and volatility-adjusted returns." },
  { term: "Relative Strength Index", abbr: "RSI", category: "Technical", definition: "A momentum oscillator measuring the speed and magnitude of price changes on a 0-100 scale.", whyItMatters: "RSI identifies overbought (>70) and oversold (<30) conditions, signaling potential reversals.", currencyImpact: "Extreme RSI readings in major pairs often precede 50-100 pip mean reversion moves.", institutionalRelevance: "Systematic funds use RSI as a core signal in mean-reversion and momentum strategies." },
  { term: "Moving Average Convergence Divergence", abbr: "MACD", category: "Technical", definition: "A trend-following momentum indicator showing the relationship between two exponential moving averages.", whyItMatters: "MACD crossovers and divergences signal trend changes and momentum shifts.", currencyImpact: "MACD histogram expansion in FX pairs confirms trend acceleration; contraction warns of exhaustion.", institutionalRelevance: "Used in CTA and systematic macro strategies for trend identification and timing." },
  { term: "Volume Weighted Average Price", abbr: "VWAP", category: "Technical", definition: "The average price weighted by volume, used as a benchmark for execution quality.", whyItMatters: "Institutional traders benchmark their execution against VWAP to measure market impact.", currencyImpact: "Price above VWAP indicates bullish intraday bias; below suggests bearish control.", institutionalRelevance: "Primary execution benchmark for bank FX desks; algorithms target VWAP for large orders." },
  { term: "US Dollar Index", abbr: "DXY", category: "Market Structure", definition: "A weighted index measuring the USD against a basket of six major currencies (EUR, JPY, GBP, CAD, SEK, CHF).", whyItMatters: "DXY is the primary gauge of broad USD strength — the most important single variable in FX.", currencyImpact: "Rising DXY pressures all non-USD currencies; falling DXY supports risk assets and EM FX.", institutionalRelevance: "Central banks, sovereign wealth funds, and macro funds use DXY as a core portfolio signal." },
  { term: "Overnight Index Swap", abbr: "OIS", category: "Derivatives", definition: "An interest rate swap where the floating leg is tied to an overnight rate index (e.g., SOFR, ESTR).", whyItMatters: "OIS rates price in central bank rate expectations — the purest measure of monetary policy outlook.", currencyImpact: "OIS spread changes between currencies directly drive carry trade attractiveness and FX flows.", institutionalRelevance: "Used for curve construction, hedging, and extracting market-implied central bank rate paths." },
  { term: "Non-Deliverable Forward", abbr: "NDF", category: "Derivatives", definition: "A forward contract settled in USD for currencies where physical delivery is restricted (e.g., CNY, INR, BRL).", whyItMatters: "NDFs provide price discovery and hedging for restricted EM currencies.", currencyImpact: "NDF premiums/discounts signal market stress, capital flow pressure, and intervention expectations.", institutionalRelevance: "Crucial for EM treasury desks; NDF-spot basis is a key indicator of FX market stress." },
  { term: "Credit Default Swap", abbr: "CDS", category: "Risk", definition: "A derivative contract providing insurance against sovereign or corporate default.", whyItMatters: "CDS spreads are the market's real-time pricing of credit/default risk.", currencyImpact: "Rising sovereign CDS spreads typically lead to currency depreciation by 1-3 months.", institutionalRelevance: "Macro hedge funds use CDS as both a risk indicator and a direct expression of country risk views." },
  { term: "Consumer Price Index", abbr: "CPI", category: "Indicator", definition: "A measure of the average change in prices paid by consumers for a basket of goods and services.", whyItMatters: "CPI is the primary inflation indicator — the dominant variable driving central bank policy.", currencyImpact: "Higher-than-expected CPI is currency positive (hawkish expectations); lower is currency negative.", institutionalRelevance: "CPI releases are the highest-impact economic events in FX; institutional desks pre-position around prints." },
  { term: "Producer Price Index", abbr: "PPI", category: "Indicator", definition: "Measures average price changes received by domestic producers for their output.", whyItMatters: "PPI is a leading indicator for CPI — pipeline inflation pressure signals future consumer price moves.", currencyImpact: "Rising PPI creates expectations of future CPI increases, supporting the currency.", institutionalRelevance: "Used in inflation models and as a leading input for central bank reaction function analysis." },
  { term: "Purchasing Managers Index", abbr: "PMI", category: "Indicator", definition: "A survey-based indicator of manufacturing and services activity. Above 50 = expansion, below 50 = contraction.", whyItMatters: "PMI is the most timely indicator of economic momentum — released before GDP.", currencyImpact: "PMI surprises cause 30-80 pip moves in major pairs; persistent trends signal GDP trajectory.", institutionalRelevance: "Macro strategists use PMI differentials between countries to forecast relative FX performance." },
  { term: "Gross Domestic Product", abbr: "GDP", category: "Fundamental", definition: "The total monetary value of all goods and services produced within a country's borders.", whyItMatters: "GDP is the broadest measure of economic health — the foundation of fundamental currency analysis.", currencyImpact: "GDP growth differentials between countries are the primary long-term driver of exchange rates.", institutionalRelevance: "IMF and World Bank GDP forecasts are core inputs to institutional FX valuation models." },
  { term: "Federal Open Market Committee", abbr: "FOMC", category: "Central Bank", definition: "The Federal Reserve's monetary policy committee that sets the federal funds rate.", whyItMatters: "FOMC decisions and statements are the single most important event in global FX markets.", currencyImpact: "FOMC rate decisions cause 50-200 pip moves in USD pairs; dot plots drive multi-week trends.", institutionalRelevance: "Every institutional FX desk globally positions around FOMC. The Fed's forward guidance shapes all USD crosses." },
  { term: "European Central Bank", abbr: "ECB", category: "Central Bank", definition: "The central bank for the euro area, responsible for monetary policy across 20 eurozone countries.", whyItMatters: "ECB policy drives EUR, the most traded currency globally with ~33% of FX turnover.", currencyImpact: "ECB rate differentials with the Fed are the dominant driver of EUR/USD.", institutionalRelevance: "ECB press conferences and staff projections are the key catalyst events for EUR positioning." },
  { term: "Bank of Japan", abbr: "BOJ", category: "Central Bank", definition: "Japan's central bank, known for ultra-loose monetary policy and yield curve control.", whyItMatters: "BOJ policy divergence from other G10 central banks has driven massive JPY moves.", currencyImpact: "BOJ policy shifts cause 300-500 pip moves in USD/JPY; intervention threats cap JPY weakness.", institutionalRelevance: "JPY carry trade is the largest single-currency carry trade globally; BOJ is the key variable." },
  { term: "Quantitative Tightening", abbr: "QT", category: "Central Bank", definition: "The process of reducing a central bank's balance sheet by letting bonds mature or actively selling them.", whyItMatters: "QT drains liquidity from the financial system, tightening financial conditions.", currencyImpact: "QT is generally currency positive — reducing liquidity supports the domestic currency.", institutionalRelevance: "QT pace and composition affect term premia, yield curves, and cross-currency basis swaps." },
  { term: "Quantitative Easing", abbr: "QE", category: "Central Bank", definition: "Central bank asset purchases to increase money supply and lower long-term interest rates.", whyItMatters: "QE is the most powerful unconventional monetary policy tool, deployed during crises.", currencyImpact: "QE is currency negative — increasing money supply devalues the domestic currency.", institutionalRelevance: "QE programs drive cross-currency basis swaps, repo rates, and global capital flows." },
  { term: "Basis Points", abbr: "bps", category: "Market Structure", definition: "One hundredth of a percentage point (0.01%). 100 bps = 1%.", whyItMatters: "The standard unit for measuring interest rate changes and yield spreads.", currencyImpact: "A 25 bps rate hike typically moves major pairs 30-100 pips depending on surprise factor.", institutionalRelevance: "All institutional fixed income and FX pricing is quoted in basis points." },
  { term: "Carry Trade", abbr: "Carry", category: "Macro Theory", definition: "Borrowing in a low-interest-rate currency to invest in a high-interest-rate currency for the yield differential.", whyItMatters: "Carry trades are the most popular institutional FX strategy — driving massive capital flows.", currencyImpact: "Carry trade buildup strengthens high-yielders; unwinding causes violent EM currency selloffs.", institutionalRelevance: "Real money, hedge funds, and retail all participate. JPY carry trade is a $1T+ global position." },
  { term: "Purchasing Power Parity", abbr: "PPP", category: "Macro Theory", definition: "The theory that exchange rates should adjust so identical goods cost the same across countries.", whyItMatters: "PPP provides a long-term 'fair value' anchor for currencies — the Big Mac Index is based on PPP.", currencyImpact: "Currencies trading far from PPP tend to mean-revert over 3-5 year horizons.", institutionalRelevance: "Used by sovereign wealth funds and long-term investors to identify undervalued currencies." },
  { term: "Interest Rate Parity", abbr: "IRP", category: "Macro Theory", definition: "The theory linking spot rates, forward rates, and interest rate differentials between two currencies.", whyItMatters: "IRP is the foundational no-arbitrage condition in FX — it prices forwards and swaps.", currencyImpact: "Violations of covered IRP (cross-currency basis) signal funding stress and safe-haven demand.", institutionalRelevance: "Bank treasury desks use IRP for pricing, hedging, and identifying relative value opportunities." },
  { term: "Real Effective Exchange Rate", abbr: "REER", category: "Macro Theory", definition: "The trade-weighted exchange rate adjusted for inflation differentials across trading partners.", whyItMatters: "REER measures true competitiveness — accounting for both nominal FX moves and inflation.", currencyImpact: "REER overvaluation signals currency vulnerability; undervaluation suggests appreciation potential.", institutionalRelevance: "Central banks, the IMF, and BIS use REER as the primary gauge of currency misalignment." },
  { term: "Nominal Effective Exchange Rate", abbr: "NEER", category: "Macro Theory", definition: "The trade-weighted average of a currency against a basket of partner currencies, without inflation adjustment.", whyItMatters: "NEER captures the broad direction of a currency against all its trading partners.", currencyImpact: "NEER depreciation improves export competitiveness but raises import costs.", institutionalRelevance: "Some central banks (e.g., MAS Singapore) use NEER as their primary monetary policy tool." },
  { term: "Dollar Smile Theory", abbr: "Dollar Smile", category: "Macro Theory", definition: "The theory that USD strengthens during both extreme risk-off (safe haven) and strong US growth (outperformance), weakening only during moderate global growth.", whyItMatters: "Explains the seemingly contradictory behavior of USD across different macro regimes.", currencyImpact: "USD weakens most during 'goldilocks' global growth when risk appetite favors EM and commodity FX.", institutionalRelevance: "Used by macro funds to construct regime-dependent FX strategies." },
];

export const FX_GLOSSARY_CATEGORIES = ["All", "Technical", "Fundamental", "Central Bank", "Market Structure", "Risk", "Derivatives", "Macro Theory", "Indicator"] as const;


// ═══════════════════════════════════════════
// 3. MACRO DRIVERS DATABASE
// ═══════════════════════════════════════════

export interface MacroDriver {
  name: string;
  category: "Macro" | "Central Bank" | "Market" | "Global Flows" | "Geopolitical" | "Country-Specific";
  importance: "Critical" | "High" | "Medium";
  currentState: string;
  impact: "Bullish" | "Bearish" | "Neutral";
  description: string;
}

export function generateMacroDrivers(base: string, quote: string): MacroDriver[] {
  const rng = seededRng(`${base}${quote}macro`);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const impacts: ("Bullish" | "Bearish" | "Neutral")[] = ["Bullish", "Bearish", "Neutral"];
  const importances: ("Critical" | "High" | "Medium")[] = ["Critical", "High", "Medium"];

  return [
    // Macroeconomic
    { name: "GDP Growth Differential", category: "Macro", importance: "Critical", currentState: `${base}: ${(1.5 + rng() * 3).toFixed(1)}% | ${quote}: ${(0.8 + rng() * 3.5).toFixed(1)}%`, impact: pick(impacts), description: `Relative economic growth between ${base} and ${quote} economies drives long-term FX fundamentals.` },
    { name: "Inflation Differential", category: "Macro", importance: "Critical", currentState: `${base} CPI: ${(1.5 + rng() * 4).toFixed(1)}% | ${quote} CPI: ${(1 + rng() * 5).toFixed(1)}%`, impact: pick(impacts), description: "Higher inflation erodes purchasing power, but may trigger hawkish central bank response." },
    { name: "Interest Rate Differential", category: "Macro", importance: "Critical", currentState: `Spread: ${(rng() * 6 - 2).toFixed(0)} bps favoring ${rng() > 0.5 ? base : quote}`, impact: pick(impacts), description: "Rate differentials drive carry trades and short-term capital flows between currencies." },
    { name: "Unemployment Rate", category: "Macro", importance: "High", currentState: `${base}: ${(3 + rng() * 4).toFixed(1)}% | ${quote}: ${(3 + rng() * 5).toFixed(1)}%`, impact: pick(impacts), description: "Labor market strength signals economic health and influences central bank policy stance." },
    { name: "Fiscal Deficit / Surplus", category: "Macro", importance: "High", currentState: `${base}: ${(rng() * -8).toFixed(1)}% of GDP | ${quote}: ${(rng() * -7).toFixed(1)}% of GDP`, impact: pick(impacts), description: "Fiscal deficits require bond issuance, affecting yields and currency demand." },
    { name: "Trade Balance", category: "Macro", importance: "High", currentState: `${base}: $${(rng() * 80 - 40).toFixed(0)}B | ${quote}: $${(rng() * 60 - 30).toFixed(0)}B`, impact: pick(impacts), description: "Trade surpluses create natural currency demand; deficits create selling pressure." },
    { name: "Industrial Production", category: "Macro", importance: "Medium", currentState: `MoM: ${(rng() * 3 - 1).toFixed(1)}% | YoY: ${(rng() * 6 - 2).toFixed(1)}%`, impact: pick(impacts), description: "Manufacturing output signals underlying economic strength and export competitiveness." },
    { name: "Retail Sales", category: "Macro", importance: "Medium", currentState: `MoM: ${(rng() * 2 - 0.5).toFixed(1)}%`, impact: pick(impacts), description: "Consumer spending drives 60-70% of GDP in developed economies." },
    // Central Bank
    { name: "Monetary Policy Stance", category: "Central Bank", importance: "Critical", currentState: `${base} CB: ${pick(["Hawkish", "Neutral", "Dovish"])} | ${quote} CB: ${pick(["Hawkish", "Neutral", "Dovish"])}`, impact: pick(impacts), description: "Central bank stance is the single most important near-term driver of exchange rates." },
    { name: "Forward Guidance", category: "Central Bank", importance: "Critical", currentState: pick(["Data-dependent", "Tightening bias", "Easing bias", "On hold"]), impact: pick(impacts), description: "Forward guidance shapes market expectations for future rate paths, driving FX positioning." },
    { name: "Balance Sheet Policy", category: "Central Bank", importance: "High", currentState: pick(["QT in progress", "QE active", "Balance sheet stable", "Tapering"]), impact: pick(impacts), description: "Quantitative easing/tightening affects liquidity, yields, and currency valuation." },
    { name: "FX Intervention Risk", category: "Central Bank", importance: "High", currentState: pick(["Low risk", "Moderate risk", "Verbal warnings issued", "Active intervention"]), impact: pick(impacts), description: "Central bank FX intervention can cause violent short-term reversals." },
    // Market Drivers
    { name: "Bond Yield Spread", category: "Market", importance: "Critical", currentState: `10Y spread: ${(rng() * 400 - 100).toFixed(0)} bps`, impact: pick(impacts), description: "Sovereign yield spreads drive carry trade flows and institutional asset allocation." },
    { name: "Dollar Index (DXY)", category: "Market", importance: "Critical", currentState: `${(95 + rng() * 15).toFixed(1)} | ${rng() > 0.5 ? "Trending Up" : "Trending Down"}`, impact: pick(impacts), description: "DXY is the single most important reference for USD strength across all pairs." },
    { name: "Equity Market Risk", category: "Market", importance: "High", currentState: `VIX: ${(12 + rng() * 25).toFixed(1)}`, impact: pick(impacts), description: "Equity volatility spills into FX via risk-on/risk-off dynamics and safe-haven flows." },
    { name: "Commodity Prices", category: "Market", importance: "High", currentState: `Oil: $${(60 + rng() * 40).toFixed(0)} | Gold: $${(1800 + rng() * 600).toFixed(0)}`, impact: pick(impacts), description: "Commodity prices directly impact commodity-exporter currencies and terms of trade." },
    // Global Flows
    { name: "FII / FDI Flows", category: "Global Flows", importance: "High", currentState: `Net ${rng() > 0.5 ? "inflows" : "outflows"}: $${(rng() * 15).toFixed(1)}B MTD`, impact: pick(impacts), description: "Foreign portfolio and direct investment flows create sustained FX demand/supply." },
    { name: "CFTC Speculative Positioning", category: "Global Flows", importance: "High", currentState: `Net ${rng() > 0.5 ? "long" : "short"} ${(rng() * 80).toFixed(0)}K contracts`, impact: pick(impacts), description: "CFTC positioning data reveals hedge fund consensus — extreme positions signal reversal risk." },
    { name: "Reserve Diversification", category: "Global Flows", importance: "Medium", currentState: pick(["Active diversification away from USD", "Stable reserves allocation", "Increasing USD allocation"]), impact: pick(impacts), description: "Central bank FX reserve shifts ($12T+ globally) create long-term currency trends." },
    // Geopolitical
    { name: "Geopolitical Risk", category: "Geopolitical", importance: pick(importances), currentState: pick(["Elevated — regional conflicts", "Moderate — trade tensions", "Low — stable geopolitics"]), impact: pick(impacts), description: "Geopolitical events trigger safe-haven flows (USD, JPY, CHF) and EM currency weakness." },
    { name: "Sanctions & Trade Wars", category: "Geopolitical", importance: "High", currentState: pick(["Active tariff disputes", "Sanctions affecting capital flows", "Trade normalization"]), impact: pick(impacts), description: "Trade restrictions alter comparative advantage, trade balances, and currency valuations." },
    { name: "Election / Political Risk", category: "Geopolitical", importance: "Medium", currentState: pick(["Upcoming elections creating uncertainty", "Post-election stability", "Policy uncertainty elevated"]), impact: pick(impacts), description: "Political transitions create FX volatility through policy uncertainty and capital flow shifts." },
    // Country-Specific
    { name: "Energy Import Dependency", category: "Country-Specific", importance: "Medium", currentState: `${quote} imports: ${(40 + rng() * 50).toFixed(0)}% of energy needs`, impact: pick(impacts), description: "Energy importers face currency pressure when oil prices rise due to deteriorating trade balance." },
    { name: "Tourism & Remittances", category: "Country-Specific", importance: "Medium", currentState: `${(rng() * 8).toFixed(1)}% of GDP`, impact: pick(impacts), description: "Tourism revenue and remittances provide structural FX inflows for many economies." },
  ];
}


// ═══════════════════════════════════════════
// 4. RISK ANALYSIS ENGINE
// ═══════════════════════════════════════════

export interface RiskFactor {
  name: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  probability: number; // 0-100
  impact: string;
  description: string;
  historicalPrecedent: string;
}

export interface StressScenario {
  name: string;
  type: "Bull" | "Bear" | "Tail";
  probability: number;
  impactPips: number;
  description: string;
  triggers: string[];
}

export function generateRiskAnalysis(pair: string, base: string, quote: string) {
  const rng = seededRng(`${pair}risk`);

  const risks: RiskFactor[] = [
    { name: "Currency Crisis", severity: "Critical", probability: +(2 + rng() * 8).toFixed(0), impact: `${(500 + rng() * 2000).toFixed(0)} pip devaluation`, description: "Sudden loss of confidence leading to a currency collapse — typically in EM currencies with weak fundamentals.", historicalPrecedent: "Turkish Lira 2021 (-44%), Argentine Peso 2018 (-50%), British Pound 2016 Brexit (-12%)" },
    { name: "Sovereign Default Risk", severity: "Critical", probability: +(1 + rng() * 5).toFixed(0), impact: "Complete currency dislocation", description: "Government inability to service debt obligations — historically triggers 30-70% currency depreciation.", historicalPrecedent: "Russia 1998, Argentina 2001, Greece 2012 (within eurozone)" },
    { name: "Liquidity Dry-Up", severity: "High", probability: +(5 + rng() * 15).toFixed(0), impact: `Spreads widen ${(5 + rng() * 20).toFixed(0)}x`, description: "Market liquidity evaporating during stress — bid-ask spreads widen dramatically, stops get skipped.", historicalPrecedent: "March 2020 COVID crash, Aug 2015 CNY devaluation, Jan 2015 CHF de-peg" },
    { name: "Flash Crash", severity: "High", probability: +(3 + rng() * 10).toFixed(0), impact: `${(200 + rng() * 800).toFixed(0)} pip spike/crash in minutes`, description: "Algorithmic cascading and thin liquidity causing extreme moves in seconds to minutes.", historicalPrecedent: "JPY Flash Crash Jan 2019 (+4% in 7 minutes), GBP Flash Crash Oct 2016 (-6.1% in 2 mins)" },
    { name: "Carry Trade Unwind", severity: "High", probability: +(8 + rng() * 20).toFixed(0), impact: `${(150 + rng() * 500).toFixed(0)} pip reversal`, description: "Mass unwinding of carry positions when risk appetite collapses — affects all high-yielding currencies.", historicalPrecedent: "2008 GFC carry unwind: JPY appreciated 30% in 3 months as carry trades reversed" },
    { name: "Capital Flight", severity: "High", probability: +(5 + rng() * 15).toFixed(0), impact: "Sustained multi-month depreciation", description: "Rapid outflow of capital due to political, economic, or regulatory triggers.", historicalPrecedent: "China 2015-16 ($1T in reserves spent defending CNY), Turkey 2018, India taper tantrum 2013" },
    { name: "Inflation Shock", severity: "Medium", probability: +(10 + rng() * 25).toFixed(0), impact: `Central bank forced to hike ${(50 + rng() * 200).toFixed(0)} bps`, description: "Unexpected inflation surge forcing aggressive monetary tightening — initially currency positive, then growth negative.", historicalPrecedent: "2022 global inflation shock: Fed hiked 525 bps in 16 months, USD rallied 28% (DXY)" },
    { name: "Volatility Shock (VIX Spike)", severity: "Medium", probability: +(15 + rng() * 25).toFixed(0), impact: "Safe haven flows intensify", description: "VIX spike above 30 triggers risk-off positioning — safe haven currencies (USD, JPY, CHF) strengthen.", historicalPrecedent: "COVID March 2020 (VIX hit 82), Volmageddon Feb 2018 (VIX tripled in 1 day)" },
    { name: "Dollar Shortage", severity: "Medium", probability: +(5 + rng() * 15).toFixed(0), impact: "USD strengthens broadly, EM currencies weaken", description: "Global shortage of USD funding — cross-currency basis swaps widen, creating funding stress.", historicalPrecedent: "2008 GFC, March 2020 — Fed had to open unlimited swap lines with major central banks" },
    { name: "Central Bank Policy Error", severity: "Medium", probability: +(10 + rng() * 20).toFixed(0), impact: `${(100 + rng() * 400).toFixed(0)} pip move`, description: "Central bank tightening into weakness or easing into inflation — creating policy credibility crisis.", historicalPrecedent: "ECB rate hike July 2008 (before Lehman), BOJ negative rates 2016 (backfired, JPY strengthened)" },
  ];

  const scenarios: StressScenario[] = [
    { name: "Global Risk Rally", type: "Bull", probability: +(20 + rng() * 15).toFixed(0), impactPips: +(100 + rng() * 300).toFixed(0), description: `${base} strengthens on global growth optimism and risk-on sentiment.`, triggers: ["US-China trade deal", "Global GDP upside surprise", "Fed dovish pivot", "Commodities rally"] },
    { name: "Central Bank Divergence", type: "Bull", probability: +(15 + rng() * 15).toFixed(0), impactPips: +(200 + rng() * 400).toFixed(0), description: `${base} central bank turns hawkish while ${quote} central bank stays dovish — yield differential widens.`, triggers: ["Surprise rate hike", "Inflation upside surprise", "Forward guidance hawkish shift"] },
    { name: "Recession / Slowdown", type: "Bear", probability: +(15 + rng() * 20).toFixed(0), impactPips: +(150 + rng() * 350).toFixed(0), description: `Economic contraction triggers safe-haven flows and risk asset selloff.`, triggers: ["Inverted yield curve persists", "PMI below 45", "Rising unemployment", "Credit tightening"] },
    { name: "Emerging Market Contagion", type: "Bear", probability: +(8 + rng() * 15).toFixed(0), impactPips: +(200 + rng() * 500).toFixed(0), description: "Financial stress in one EM spreads to others through shared investor base and risk repricing.", triggers: ["EM sovereign default", "Capital controls imposed", "USD funding stress", "Commodity price collapse"] },
    { name: "Black Swan — Geopolitical Crisis", type: "Tail", probability: +(3 + rng() * 7).toFixed(0), impactPips: +(500 + rng() * 1500).toFixed(0), description: "Unexpected geopolitical event causing extreme market dislocation and liquidity evaporation.", triggers: ["Military conflict escalation", "Major cyber attack on financial infrastructure", "Unexpected sovereign default", "Nuclear/energy crisis"] },
    { name: "Black Swan — Financial System Shock", type: "Tail", probability: +(2 + rng() * 5).toFixed(0), impactPips: +(800 + rng() * 2000).toFixed(0), description: "Systemic financial event — bank failure, clearing house default, or payment system disruption.", triggers: ["Major bank failure", "CCP default", "Payment system disruption", "Counterparty risk cascade"] },
  ];

  // Risk heatmap score (0-100)
  const riskScore = +(25 + rng() * 50).toFixed(0);

  return { risks, scenarios, riskScore };
}


// ═══════════════════════════════════════════
// 5. DERIVATIVES & HEDGING DATA
// ═══════════════════════════════════════════

export interface DerivativeInstrument {
  name: string;
  type: "Future" | "Option" | "Swap" | "Forward" | "NDF";
  description: string;
  institutionalUseCase: string;
  keyMetrics: string;
  riskProfile: string;
}

export interface HedgingStrategy {
  name: string;
  suitableFor: string;
  mechanism: string;
  pros: string[];
  cons: string[];
  costIndicator: "Low" | "Medium" | "High";
}

export const FX_DERIVATIVES: DerivativeInstrument[] = [
  { name: "FX Futures", type: "Future", description: "Standardized exchange-traded contracts to buy/sell a currency at a future date and predetermined price. Traded on CME, ICE, SGX.", institutionalUseCase: "Hedge known future FX exposures; speculate on currency direction with leverage.", keyMetrics: "Contract size, margin, expiry, open interest, daily settlement", riskProfile: "Marked-to-market daily. Margin calls possible. No counterparty risk (exchange-cleared)." },
  { name: "FX Options (Vanilla)", type: "Option", description: "The right (not obligation) to buy/sell a currency pair at a specified rate (strike) before expiry. Calls for buying base, puts for selling.", institutionalUseCase: "Protect downside while maintaining upside potential. Used for asymmetric hedging.", keyMetrics: "Delta, gamma, theta, vega, implied vol, risk reversal, butterfly", riskProfile: "Premium paid upfront. Maximum loss = premium for buyers. Unlimited risk for sellers." },
  { name: "Currency Swaps", type: "Swap", description: "Exchange of principal and interest payments in different currencies over a specified period.", institutionalUseCase: "Long-term funding in foreign currency. Cross-currency basis swap arbitrage.", keyMetrics: "Notional, tenor, fixed/floating rates, cross-currency basis", riskProfile: "Counterparty risk. Mark-to-market exposure grows with currency moves. Collateralized under CSA." },
  { name: "FX Forwards", type: "Forward", description: "Bilateral OTC contract to exchange currencies at a specified rate on a future date. Most common hedging tool.", institutionalUseCase: "Corporate treasury hedging of receivables/payables. Bank positioning for forward book.", keyMetrics: "Forward points, tenor, outright rate, mark-to-market", riskProfile: "Counterparty risk. Obligation to deliver. No margin calls typically." },
  { name: "Non-Deliverable Forwards (NDF)", type: "NDF", description: "Cash-settled forward for currencies where physical delivery is restricted (CNY, INR, BRL, KRW, TWD, etc.).", institutionalUseCase: "Hedge EM currency exposure where physical delivery is restricted. Price discovery.", keyMetrics: "NDF rate, fixing rate, settlement amount, tenor, NDF-spot basis", riskProfile: "Settlement risk on fixing. Counterparty risk. NDF basis can diverge significantly from onshore." },
];

export const HEDGING_STRATEGIES: HedgingStrategy[] = [
  { name: "Forward Contract Hedge", suitableFor: "Corporates with known future FX cash flows", mechanism: "Lock in a fixed exchange rate for a future date. Eliminates FX risk entirely.", pros: ["Zero premium cost", "Complete certainty on rate", "Simple to execute"], cons: ["No upside participation", "Obligation to deliver", "Mark-to-market P&L volatility"], costIndicator: "Low" },
  { name: "Protective Put (Insurance Hedge)", suitableFor: "Importers/exporters wanting downside protection with upside participation", mechanism: "Buy a put option on the currency pair. Protects below the strike price while allowing gains above.", pros: ["Unlimited upside", "Known maximum cost", "No obligation"], cons: ["Premium cost (2-5% typically)", "Time decay", "May expire worthless"], costIndicator: "High" },
  { name: "Risk Reversal (Collar)", suitableFor: "Corporates wanting low-cost protection within a range", mechanism: "Buy a protective option and simultaneously sell an option in the opposite direction to offset premium.", pros: ["Zero or low net cost", "Known worst-case rate", "Institutional standard"], cons: ["Capped upside", "Complexity", "Potential MTM exposure on sold option"], costIndicator: "Low" },
  { name: "Participating Forward", suitableFor: "Corporates wanting guaranteed rate with some upside", mechanism: "Combination of forward and option that guarantees a minimum rate while allowing partial participation in favorable moves.", pros: ["Guaranteed minimum rate", "Partial upside participation", "No premium typically"], cons: ["Worse guaranteed rate vs. outright forward", "Complex structure", "Partial upside only (50-75%)"], costIndicator: "Medium" },
  { name: "Cross-Currency Swap Hedge", suitableFor: "Institutions with long-term foreign currency debt or assets", mechanism: "Swap principal and interest payments between two currencies for the life of the exposure.", pros: ["Perfect long-term hedge", "Locks in funding cost", "Basis swap opportunity"], cons: ["Counterparty risk", "Complex documentation", "Collateral requirements (CSA)"], costIndicator: "Medium" },
  { name: "Dynamic Delta Hedging", suitableFor: "Banks, market makers, and sophisticated institutional desks", mechanism: "Continuously adjusting hedge ratio based on options delta as spot rate moves. Re-hedging in real-time.", pros: ["Precise risk management", "Captures gamma P&L", "Adapts to changing conditions"], cons: ["High transaction costs", "Requires continuous monitoring", "Model risk"], costIndicator: "High" },
];


// ═══════════════════════════════════════════
// 6. CURRENCY STRENGTH METER
// ═══════════════════════════════════════════

export interface CurrencyStrength {
  currency: string;
  score: number; // -100 to 100
  trend: "Strong Bull" | "Bull" | "Neutral" | "Bear" | "Strong Bear";
  momentum1d: number;
  momentum1w: number;
  momentum1m: number;
}

export function generateCurrencyStrength(): CurrencyStrength[] {
  const rng = seededRng("currency-strength-global");
  const currencies = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD", "CNY", "INR", "BRL", "ZAR", "TRY", "SGD", "SAR"];

  return currencies.map(c => {
    const score = +(rng() * 200 - 100).toFixed(0);
    const trend: CurrencyStrength["trend"] = score > 50 ? "Strong Bull" : score > 15 ? "Bull" : score > -15 ? "Neutral" : score > -50 ? "Bear" : "Strong Bear";
    return {
      currency: c,
      score,
      trend,
      momentum1d: +(rng() * 6 - 3).toFixed(2),
      momentum1w: +(rng() * 10 - 5).toFixed(2),
      momentum1m: +(rng() * 20 - 10).toFixed(2),
    };
  }).sort((a, b) => b.score - a.score);
}


// ═══════════════════════════════════════════
// 7. FX HEATMAP DATA
// ═══════════════════════════════════════════

export interface HeatmapCell {
  base: string;
  quote: string;
  change1d: number;
  change1w: number;
  change1m: number;
}

export function generateFXHeatmap(): HeatmapCell[] {
  const rng = seededRng("fx-heatmap");
  const currencies = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];
  const cells: HeatmapCell[] = [];

  for (const base of currencies) {
    for (const quote of currencies) {
      if (base === quote) continue;
      cells.push({
        base, quote,
        change1d: +(rng() * 2 - 1).toFixed(2),
        change1w: +(rng() * 4 - 2).toFixed(2),
        change1m: +(rng() * 8 - 4).toFixed(2),
      });
    }
  }
  return cells;
}


// ═══════════════════════════════════════════
// 8. QUANTITATIVE MODELS REFERENCE
// ═══════════════════════════════════════════

export interface QuantModelRef {
  name: string;
  formula: string;
  interpretation: string;
  institutionalUseCase: string;
  strengths: string[];
  weaknesses: string[];
}

export const QUANT_MODELS: QuantModelRef[] = [
  { name: "Interest Rate Differential (IRD)", formula: "FX Direction ~ f(i_base - i_quote)", interpretation: "Higher interest rates attract capital flows, strengthening the domestic currency. The rate differential is the primary short-to-medium term driver.", institutionalUseCase: "Carry trade construction, forward pricing, central bank policy impact analysis.", strengths: ["Strong empirical relationship", "Real-time data available", "Foundation of FX pricing"], weaknesses: ["Forward-looking rates matter more than current", "Breaks down during risk-off events", "Credit risk can offset rate advantage"] },
  { name: "Purchasing Power Parity (PPP)", formula: "S_ppp = P_domestic / P_foreign", interpretation: "Exchange rates should adjust so identical goods cost the same across countries. Currencies trading below PPP are 'undervalued'.", institutionalUseCase: "Long-term fair value estimation, REER analysis, strategic asset allocation.", strengths: ["Strong long-run anchor (3-5 year horizon)", "Intuitive and transparent", "Published by IMF, OECD"], weaknesses: ["Very poor short-term predictor", "Ignores capital flows", "Non-traded goods bias"] },
  { name: "Uncovered Interest Rate Parity (UIP)", formula: "E(S_t+1)/S_t = (1 + i_d) / (1 + i_f)", interpretation: "The expected change in the exchange rate should equal the interest rate differential. In practice, this is violated — giving rise to the 'forward premium puzzle'.", institutionalUseCase: "Carry trade justification (UIP violation), risk premium analysis.", strengths: ["Theoretical foundation for FX pricing", "Allows extraction of risk premia"], weaknesses: ["Empirically rejected — the 'forward premium puzzle'", "Carry trades exploit this violation"] },
  { name: "GARCH Volatility Model", formula: "sigma_t^2 = omega + alpha * epsilon_(t-1)^2 + beta * sigma_(t-1)^2", interpretation: "Models time-varying volatility with volatility clustering — high vol periods tend to be followed by high vol.", institutionalUseCase: "Risk management, VaR calculation, options pricing, position sizing.", strengths: ["Captures volatility clustering", "Adapts to market conditions", "Standard in risk management"], weaknesses: ["Backward-looking", "Normal distribution assumption", "Doesn't predict direction"] },
  { name: "Value at Risk (VaR)", formula: "VaR_alpha = mu - z_alpha * sigma * sqrt(t)", interpretation: "The maximum expected loss at a given confidence level over a specified time horizon.", institutionalUseCase: "Regulatory capital calculation, risk limit setting, portfolio risk monitoring.", strengths: ["Single risk number", "Widely understood", "Regulatory standard (Basel III)"], weaknesses: ["Doesn't measure tail risk", "Assumes normal distribution", "Backward-looking"] },
  { name: "Carry Trade Model", formula: "Return = (i_high - i_low) + (S_t+1 - S_t) / S_t", interpretation: "Total return = interest rate pickup + spot rate change. Profitable when UIP is violated and FX depreciation < rate differential.", institutionalUseCase: "Constructing carry portfolios, risk-adjusted return optimization.", strengths: ["Historically profitable (Sharpe ~0.5)", "Intuitive", "Captures risk premium"], weaknesses: ["Crash risk (negative skew)", "Unwinds violently in risk-off", "Requires leverage for meaningful returns"] },
  { name: "Monte Carlo Simulation", formula: "S_t = S_0 * exp((mu - 0.5*sigma^2)*t + sigma*W_t)", interpretation: "Simulates thousands of possible future price paths to estimate probability distributions of outcomes.", institutionalUseCase: "Options pricing, risk scenario analysis, portfolio stress testing.", strengths: ["Handles complex payoffs", "Captures full distribution", "Flexible assumptions"], weaknesses: ["Computationally expensive", "Sensitive to input assumptions", "Model risk"] },
  { name: "Regime Switching Model", formula: "S_t = f(State_t) where State in {Bull, Bear, Crisis}", interpretation: "FX markets alternate between distinct regimes (e.g., carry-friendly, risk-off, trending) with different statistical properties.", institutionalUseCase: "Dynamic strategy selection, regime-aware hedging, macro regime identification.", strengths: ["Captures non-linear dynamics", "Adapts to market structure changes", "Realistic"], weaknesses: ["Regime identification lag", "Overfitting risk", "Complex implementation"] },
];


// ═══════════════════════════════════════════
// 9. AI FEATURES SPEC
// ═══════════════════════════════════════════

export interface AIFeature {
  name: string;
  icon: string;
  description: string;
  capability: string;
  dataSources: string[];
}

export const AI_FEATURES: AIFeature[] = [
  { name: "AI Currency Forecasting", icon: "🤖", description: "ML-powered exchange rate predictions using ensemble models (LSTM, XGBoost, Transformer).", capability: "Generates 1D/1W/1M/3M forecasts with confidence intervals and scenario probabilities.", dataSources: ["Historical price data", "Macro indicators", "Central bank speeches", "Options implied vol"] },
  { name: "Sentiment Analysis Engine", icon: "📰", description: "NLP analysis of news, social media, and research reports to gauge market sentiment.", capability: "Real-time sentiment scoring for each currency pair with topic decomposition.", dataSources: ["Reuters/Bloomberg news", "Twitter/X", "Reddit", "Institutional research notes"] },
  { name: "Central Bank Speech Analyzer", icon: "🏛️", description: "AI parsing of central bank communications to detect policy shifts before the market.", capability: "Hawkish/dovish scoring, keyword evolution tracking, policy surprise detection.", dataSources: ["FOMC minutes", "ECB press conferences", "BOJ statements", "Fed speeches"] },
  { name: "Geopolitical Risk Engine", icon: "🌍", description: "Monitors and quantifies geopolitical risks with currency impact assessment.", capability: "Real-time geopolitical risk index with FX impact probabilities.", dataSources: ["News wires", "Satellite imagery", "Trade data", "Sanctions databases"] },
  { name: "Correlation Detection AI", icon: "🔗", description: "Dynamic correlation analysis that detects regime changes in cross-asset relationships.", capability: "Alerts when correlations break down or new relationships emerge.", dataSources: ["FX prices", "Equities", "Bonds", "Commodities", "Crypto", "Volatility surfaces"] },
  { name: "Smart Alert System", icon: "⚡", description: "Context-aware alerts combining technical, fundamental, and flow signals.", capability: "Prioritized alerts with actionable context — not just price alerts.", dataSources: ["Price feeds", "Order flow", "Options markets", "Economic calendar", "News"] },
  { name: "Macro Regime Classifier", icon: "📊", description: "ML model identifying the current macro regime (risk-on, risk-off, carry, trending, ranging).", capability: "Real-time regime classification with strategy recommendations per regime.", dataSources: ["Yield curves", "VIX", "Credit spreads", "PMI data", "USD index"] },
  { name: "Liquidity Stress Detector", icon: "🚨", description: "Monitors market microstructure for early signs of liquidity deterioration.", capability: "Early warning system for flash crash conditions and spread blowouts.", dataSources: ["Order book depth", "Bid-ask spreads", "Cross-currency basis", "Repo rates"] },
];


// ═══════════════════════════════════════════
// 10. DATA SOURCES REFERENCE
// ═══════════════════════════════════════════

export interface DataSource {
  name: string;
  category: "Premium" | "Free" | "Institutional";
  type: "Real-time" | "Delayed" | "EOD" | "Historical";
  apiAvailable: boolean;
  coverage: string;
  cost: string;
}

export const DATA_SOURCES: DataSource[] = [
  { name: "Bloomberg Terminal", category: "Institutional", type: "Real-time", apiAvailable: true, coverage: "Full FX, fixed income, equities, commodities. Most comprehensive.", cost: "$24,000/year" },
  { name: "Refinitiv Eikon", category: "Institutional", type: "Real-time", apiAvailable: true, coverage: "FX, fixed income, trade data, economic indicators.", cost: "$22,000/year" },
  { name: "CME Group", category: "Premium", type: "Real-time", apiAvailable: true, coverage: "FX futures, options, CFTC positioning, settlement prices.", cost: "$500-2,000/month" },
  { name: "BIS (Bank for International Settlements)", category: "Free", type: "Historical", apiAvailable: true, coverage: "Triennial FX survey, effective exchange rates, credit data.", cost: "Free" },
  { name: "IMF Data", category: "Free", type: "Historical", apiAvailable: true, coverage: "COFER reserves, WEO forecasts, balance of payments, exchange rates.", cost: "Free" },
  { name: "FRED (St. Louis Fed)", category: "Free", type: "EOD", apiAvailable: true, coverage: "US macro data, exchange rates, yields, monetary aggregates.", cost: "Free" },
  { name: "TradingEconomics", category: "Premium", type: "Delayed", apiAvailable: true, coverage: "196 countries, 20M+ indicators, forecasts.", cost: "$39-499/month" },
  { name: "Alpha Vantage", category: "Free", type: "Delayed", apiAvailable: true, coverage: "FX rates, crypto, stocks, technical indicators.", cost: "Free (5 calls/min)" },
  { name: "OANDA", category: "Premium", type: "Real-time", apiAvailable: true, coverage: "FX rates, order book, historical data, trading.", cost: "Free-$100/month" },
  { name: "ECB Statistical Data", category: "Free", type: "EOD", apiAvailable: true, coverage: "Euro reference rates, monetary statistics, balance of payments.", cost: "Free" },
  { name: "Federal Reserve (FRED/H.10)", category: "Free", type: "EOD", apiAvailable: true, coverage: "Official US exchange rates, monetary policy data.", cost: "Free" },
  { name: "Investing.com", category: "Free", type: "Delayed", apiAvailable: false, coverage: "Global FX, economic calendar, technical analysis.", cost: "Free" },
];


// ═══════════════════════════════════════════
// SPARKLINE GENERATOR FOR FX CHARTS
// ═══════════════════════════════════════════

export function generateFXSparkline(pair: string, points: number = 30): number[] {
  const rng = seededRng(`spark-${pair}`);
  const data: number[] = [];
  let val = 50 + rng() * 50;
  for (let i = 0; i < points; i++) {
    val += (rng() - 0.48) * 3;
    val = Math.max(10, Math.min(95, val));
    data.push(+val.toFixed(2));
  }
  return data;
}


// ═══════════════════════════════════════════
// ECONOMIC CALENDAR ENTRIES
// ═══════════════════════════════════════════

export interface EconEvent {
  date: string;
  time: string;
  country: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  previous: string;
  forecast: string;
  actual: string;
}

export function generateEconCalendar(base: string, quote: string): EconEvent[] {
  const rng = seededRng(`econ-${base}${quote}`);
  const events: EconEvent[] = [
    { date: "May 14", time: "08:30", country: "US", event: "CPI (YoY)", impact: "High", previous: "3.5%", forecast: "3.3%", actual: `${(3 + rng() * 1).toFixed(1)}%` },
    { date: "May 14", time: "10:00", country: "US", event: "Michigan Consumer Sentiment", impact: "Medium", previous: "77.2", forecast: "76.8", actual: `${(74 + rng() * 6).toFixed(1)}` },
    { date: "May 15", time: "02:00", country: "UK", event: "GDP (QoQ)", impact: "High", previous: "0.3%", forecast: "0.2%", actual: `${(rng() * 0.6).toFixed(1)}%` },
    { date: "May 15", time: "08:30", country: "US", event: "Retail Sales (MoM)", impact: "High", previous: "0.7%", forecast: "0.4%", actual: `${(rng() * 0.8).toFixed(1)}%` },
    { date: "May 16", time: "03:30", country: "AU", event: "Employment Change", impact: "High", previous: "32.6K", forecast: "25.0K", actual: `${(15 + rng() * 25).toFixed(1)}K` },
    { date: "May 16", time: "08:30", country: "US", event: "Initial Jobless Claims", impact: "Medium", previous: "228K", forecast: "225K", actual: `${(215 + rng() * 25).toFixed(0)}K` },
    { date: "May 17", time: "01:30", country: "JP", event: "GDP (QoQ)", impact: "High", previous: "0.1%", forecast: "0.3%", actual: `${(rng() * 0.5).toFixed(1)}%` },
    { date: "May 18", time: "14:00", country: "US", event: "FOMC Minutes", impact: "High", previous: "-", forecast: "-", actual: "-" },
    { date: "May 19", time: "04:00", country: "EU", event: "ECB Policy Decision", impact: "High", previous: "3.75%", forecast: "3.50%", actual: `${(3.25 + rng() * 0.75).toFixed(2)}%` },
    { date: "May 20", time: "06:00", country: "IN", event: "RBI Policy Rate", impact: "High", previous: "6.50%", forecast: "6.25%", actual: `${(6 + rng() * 0.75).toFixed(2)}%` },
  ];
  return events;
}
