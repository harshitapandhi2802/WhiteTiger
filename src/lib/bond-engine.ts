// ═══════════════════════════════════════════════════════════════════════
// BOND INTELLIGENCE ENGINE v2.0
// AI Bond Copilot · Yield Curve Intelligence · Long-Duration Bonds
// Story Engine · Stock Market Impact · Economic Calendar · Education
// ═══════════════════════════════════════════════════════════════════════

function seededRng(seed: string | number) {
  let h = typeof seed === "number" ? seed : 0;
  if (typeof seed === "string") for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

// ─── Types ───────────────────────────────────────────────────────────

export type BondSection = typeof BOND_NAV_SECTIONS[number]["id"];

export interface SovereignYieldCard {
  country: string;
  flag: string;
  benchmark: string;
  yield10y: number;
  change1d: number;
  change1w: number;
  change1m: number;
  policyRate: number;
  centralBank: string;
  rating: string;
  debtToGdp: number;
  outlook: string;
  outlookColor: string;
}

export interface BondCopilotNarrative {
  marketMood: string;
  moodEmoji: string;
  moodColor: string;
  summary: string;
  beginnerSummary: string;
  keyDrivers: { driver: string; impact: "bullish" | "bearish" | "neutral"; explanation: string; beginnerTip: string }[];
  topPicks: { name: string; type: string; reason: string; yieldTag: string }[];
  avoidList: { name: string; reason: string }[];
  rateOutlook: string;
  globalView: string;
}

export interface YieldCurveAnalysis {
  shape: "Normal" | "Flat" | "Inverted" | "Humped";
  shapeColor: string;
  spread2s10s: number;
  spread3m10y: number;
  aiExplanation: string;
  beginnerExplanation: string;
  historicalContext: string;
  implications: { area: string; impact: string; direction: "positive" | "negative" | "neutral" }[];
  points: { tenor: string; yield: number; change1d: number }[];
}

export interface LongDurationBond {
  name: string;
  country: string;
  flag: string;
  tenor: string;
  yield: number;
  change1d: number;
  duration: number;
  convexity: number;
  inflationSensitivity: string;
  pensionExposure: string;
  aiInsight: string;
  beginnerNote: string;
}

export interface BondStory {
  headline: string;
  summary: string;
  impact: "bullish" | "bearish" | "neutral";
  category: string;
  timeAgo: string;
  beginnerExplanation: string;
}

export interface BondEquityImpact {
  factor: string;
  currentState: string;
  bondImpact: string;
  equityImpact: string;
  correlation: string;
  direction: "positive" | "negative" | "neutral";
  beginnerExplanation: string;
}

export interface EconomicEvent {
  date: string;
  event: string;
  country: string;
  flag: string;
  importance: "Critical" | "High" | "Medium";
  expectedImpact: string;
  previousValue: string;
  consensus: string;
  bondImplication: string;
}

export interface BondEducationTerm {
  term: string;
  category: "Basics" | "Yield" | "Risk" | "Strategy" | "Central Bank" | "Market";
  simpleExplanation: string;
  analogy: string;
  whyItMatters: string;
  example: string;
}

// ─── SOVEREIGN YIELD HERO ───────────────────────────────────────────

export function generateSovereignYields(): SovereignYieldCard[] {
  const rng = seededRng("sov-hero-v2");
  const r = (min: number, max: number) => +(min + rng() * (max - min)).toFixed(2);
  const ch = () => +(rng() * 0.08 - 0.04).toFixed(2);
  const outlooks = [
    { text: "Easing Cycle", color: "#10b981" },
    { text: "On Hold", color: "#f59e0b" },
    { text: "Tightening", color: "#ef4444" },
    { text: "Data Dependent", color: "#6b7280" },
  ];
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];

  return [
    { country: "India", flag: "\u{1f1ee}\u{1f1f3}", benchmark: "10Y G-Sec", yield10y: r(6.9, 7.25), change1d: ch(), change1w: +(rng() * 0.12 - 0.06).toFixed(2), change1m: +(rng() * 0.3 - 0.15).toFixed(2), policyRate: 6.50, centralBank: "RBI", rating: "BBB-", debtToGdp: 83, ...pick(outlooks).text ? { outlook: pick(outlooks).text, outlookColor: pick(outlooks).color } : { outlook: "On Hold", outlookColor: "#f59e0b" } },
    { country: "United States", flag: "\u{1f1fa}\u{1f1f8}", benchmark: "10Y UST", yield10y: r(4.1, 4.65), change1d: ch(), change1w: +(rng() * 0.15 - 0.08).toFixed(2), change1m: +(rng() * 0.4 - 0.2).toFixed(2), policyRate: r(4.75, 5.25), centralBank: "Federal Reserve", rating: "AA+", debtToGdp: 124, outlook: pick(outlooks).text, outlookColor: pick(outlooks).color },
    { country: "Germany", flag: "\u{1f1e9}\u{1f1ea}", benchmark: "10Y Bund", yield10y: r(2.2, 2.8), change1d: ch(), change1w: +(rng() * 0.1 - 0.05).toFixed(2), change1m: +(rng() * 0.25 - 0.12).toFixed(2), policyRate: r(3.5, 4.0), centralBank: "ECB", rating: "AAA", debtToGdp: 66, outlook: pick(outlooks).text, outlookColor: pick(outlooks).color },
    { country: "Japan", flag: "\u{1f1ef}\u{1f1f5}", benchmark: "10Y JGB", yield10y: r(0.8, 1.3), change1d: +(rng() * 0.04 - 0.02).toFixed(2), change1w: +(rng() * 0.08 - 0.04).toFixed(2), change1m: +(rng() * 0.15 - 0.08).toFixed(2), policyRate: r(0.1, 0.5), centralBank: "BoJ", rating: "A+", debtToGdp: 264, outlook: pick(outlooks).text, outlookColor: pick(outlooks).color },
    { country: "United Kingdom", flag: "\u{1f1ec}\u{1f1e7}", benchmark: "10Y Gilt", yield10y: r(4.0, 4.6), change1d: ch(), change1w: +(rng() * 0.12 - 0.06).toFixed(2), change1m: +(rng() * 0.35 - 0.18).toFixed(2), policyRate: r(4.5, 5.0), centralBank: "BoE", rating: "AA", debtToGdp: 101, outlook: pick(outlooks).text, outlookColor: pick(outlooks).color },
    { country: "China", flag: "\u{1f1e8}\u{1f1f3}", benchmark: "10Y CGB", yield10y: r(2.3, 2.8), change1d: +(rng() * 0.04 - 0.02).toFixed(2), change1w: +(rng() * 0.08 - 0.04).toFixed(2), change1m: +(rng() * 0.2 - 0.1).toFixed(2), policyRate: r(3.3, 3.7), centralBank: "PBoC", rating: "A+", debtToGdp: 77, outlook: pick(outlooks).text, outlookColor: pick(outlooks).color },
  ];
}

// ─── AI BOND COPILOT ────────────────────────────────────────────────

export function generateBondCopilot(): BondCopilotNarrative {
  const rng = seededRng(Date.now().toString().slice(0, -4));
  const moods = [
    { mood: "Rate Cut Rally Mode", emoji: "\u{1f7e2}", color: "#10b981" },
    { mood: "Cautious — Watching Inflation", emoji: "\u{1f7e1}", color: "#f59e0b" },
    { mood: "Risk-Off — Flight to Safety", emoji: "\u{1f534}", color: "#ef4444" },
    { mood: "Range-Bound — Data Dependent", emoji: "⚪", color: "#6b7280" },
  ];
  const m = moods[Math.floor(rng() * moods.length)];

  return {
    marketMood: m.mood, moodEmoji: m.emoji, moodColor: m.color,
    summary: `Global fixed income markets are in ${m.mood.toLowerCase()} mode. India's 10Y G-Sec yield is trading near ${(6.9 + rng() * 0.35).toFixed(2)}%, with RBI maintaining an accommodative stance. US Treasury yields continue to influence global rate expectations. The JP Morgan GBI-EM index inclusion is driving structural FII demand for Indian government bonds. Credit spreads remain compressed, favoring sovereign over corporate exposure at current levels.`,
    beginnerSummary: `In simple terms: Government bonds are like IOUs from the government. When you buy a bond, you're lending money to the government and they pay you interest (called "yield"). Right now, Indian government bonds pay about 7% per year — much safer than stocks but with lower returns. Bond prices move opposite to interest rates: when RBI cuts rates, your existing bonds become more valuable.`,
    keyDrivers: [
      { driver: "RBI Monetary Policy", impact: rng() > 0.5 ? "bullish" : "neutral", explanation: `RBI repo rate at 6.50% with ${rng() > 0.5 ? "accommodative" : "neutral"} stance. Market pricing in ${(rng() * 3).toFixed(0)} rate cuts over next 12 months.`, beginnerTip: "When RBI cuts interest rates, existing bond prices go UP because they pay higher interest than new bonds." },
      { driver: "US Treasury Yields", impact: rng() > 0.5 ? "bearish" : "neutral", explanation: `10Y UST at ${(4.1 + rng() * 0.5).toFixed(2)}%. Higher US yields pull capital from emerging markets, pressuring Indian bond prices.`, beginnerTip: "US bonds compete with Indian bonds for investor money. When US bonds pay more, some investors shift there." },
      { driver: "Inflation Data", impact: rng() > 0.4 ? "bullish" : "bearish", explanation: `CPI inflation at ${(4 + rng() * 2.5).toFixed(1)}%. ${rng() > 0.5 ? "Within" : "Above"} RBI's 4% target band, ${rng() > 0.5 ? "supporting" : "delaying"} rate cut expectations.`, beginnerTip: "High inflation is bad for bonds because it eats into your interest earnings. RBI fights inflation by raising rates, which hurts bond prices." },
      { driver: "Government Borrowing", impact: rng() > 0.5 ? "bearish" : "neutral", explanation: `Gross borrowing at ~₹${(14 + rng() * 3).toFixed(0)} lakh Cr. Heavy supply puts upward pressure on yields.`, beginnerTip: "When the government borrows a lot, it issues many bonds. More supply = lower prices = higher yields." },
      { driver: "FII Bond Flows", impact: rng() > 0.4 ? "bullish" : "bearish", explanation: `FII net ${rng() > 0.5 ? "buying" : "selling"} ₹${(rng() * 12000).toFixed(0)} Cr MTD. JP Morgan index inclusion driving structural demand.`, beginnerTip: "Foreign investors buying Indian bonds pushes prices up and yields down. India's inclusion in global bond indices is attracting this money." },
    ],
    topPicks: [
      { name: "India 10Y G-Sec 7.18%", type: "Sovereign", reason: "Most liquid Indian bond; structural FII demand from index inclusion", yieldTag: `${(7.05 + rng() * 0.2).toFixed(2)}% YTM` },
      { name: "SDL Maharashtra 2033", type: "State Dev Loan", reason: "20-40 bps spread over G-Sec with sovereign guarantee; good carry", yieldTag: `${(7.35 + rng() * 0.15).toFixed(2)}% YTM` },
      { name: "RBI Floating Rate Bond", type: "RBI Bond", reason: "Floating rate protects against unexpected rate hikes; 35 bps over NSC", yieldTag: "8.05% (floating)" },
    ],
    avoidList: [
      { name: "Long-duration corporate bonds (AA rated)", reason: "Credit spreads are too tight for the risk. A credit event could cause 5-10% mark-to-market loss." },
      { name: "Short-term T-Bills for long-horizon", reason: "With rate cuts expected, locking in at current long-term yields offers better total return than rolling T-Bills." },
    ],
    rateOutlook: "RBI likely to deliver 50-75 bps of cuts over the next 12 months as inflation moderates. Front-end yields to drop faster than long-end. Optimal positioning: overweight 5-7Y segment for carry + capital gains.",
    globalView: "Global bond markets are transitioning from tightening to easing cycles. ECB and BoE have started cutting; Fed expected to follow. Japan remains the outlier with gradual tightening. EM bonds benefiting from the pivot narrative.",
  };
}

// ─── YIELD CURVE INTELLIGENCE ───────────────────────────────────────

export function analyzeYieldCurve(): YieldCurveAnalysis {
  const rng = seededRng("yc-analysis-v2");
  const baseRate = 6.5;
  const points = [
    { tenor: "3M", yield: +(baseRate - 0.05 + rng() * 0.2).toFixed(2), change1d: +(rng() * 0.04 - 0.02).toFixed(2) },
    { tenor: "6M", yield: +(baseRate + 0.05 + rng() * 0.2).toFixed(2), change1d: +(rng() * 0.04 - 0.02).toFixed(2) },
    { tenor: "1Y", yield: +(baseRate + 0.15 + rng() * 0.2).toFixed(2), change1d: +(rng() * 0.05 - 0.025).toFixed(2) },
    { tenor: "2Y", yield: +(baseRate + 0.25 + rng() * 0.25).toFixed(2), change1d: +(rng() * 0.06 - 0.03).toFixed(2) },
    { tenor: "3Y", yield: +(baseRate + 0.35 + rng() * 0.25).toFixed(2), change1d: +(rng() * 0.06 - 0.03).toFixed(2) },
    { tenor: "5Y", yield: +(baseRate + 0.45 + rng() * 0.3).toFixed(2), change1d: +(rng() * 0.07 - 0.035).toFixed(2) },
    { tenor: "7Y", yield: +(baseRate + 0.55 + rng() * 0.3).toFixed(2), change1d: +(rng() * 0.07 - 0.035).toFixed(2) },
    { tenor: "10Y", yield: +(baseRate + 0.6 + rng() * 0.35).toFixed(2), change1d: +(rng() * 0.08 - 0.04).toFixed(2) },
    { tenor: "15Y", yield: +(baseRate + 0.65 + rng() * 0.35).toFixed(2), change1d: +(rng() * 0.08 - 0.04).toFixed(2) },
    { tenor: "20Y", yield: +(baseRate + 0.7 + rng() * 0.4).toFixed(2), change1d: +(rng() * 0.08 - 0.04).toFixed(2) },
    { tenor: "30Y", yield: +(baseRate + 0.75 + rng() * 0.4).toFixed(2), change1d: +(rng() * 0.1 - 0.05).toFixed(2) },
  ];

  const spread2s10s = +(points[7].yield - points[3].yield).toFixed(2);
  const spread3m10y = +(points[7].yield - points[0].yield).toFixed(2);
  const shape = spread2s10s > 0.4 ? "Normal" : spread2s10s > 0.1 ? "Flat" : spread2s10s < -0.1 ? "Inverted" : "Humped";
  const shapeColor = shape === "Normal" ? "#10b981" : shape === "Flat" ? "#f59e0b" : shape === "Inverted" ? "#ef4444" : "#6366f1";

  return {
    shape, shapeColor, spread2s10s, spread3m10y,
    aiExplanation: shape === "Normal"
      ? "The yield curve is normally shaped — long-term bonds pay more than short-term ones. This is healthy and signals economic growth expectations. The 2s10s spread of " + spread2s10s + "% suggests moderate term premium."
      : shape === "Flat"
      ? "The yield curve is flattening — the gap between short and long-term rates is shrinking. This often precedes economic slowdowns or signals the market expects rate cuts soon."
      : shape === "Inverted"
      ? "WARNING: The yield curve is inverted — short-term rates exceed long-term rates. Historically, inversions have preceded recessions with 80%+ accuracy. This is a major risk signal."
      : "The curve shows a humped shape — medium-term yields are highest. This is unusual and suggests market uncertainty about the medium-term rate path.",
    beginnerExplanation: shape === "Normal"
      ? "Think of it like a bank FD: you get more interest for locking your money longer. A 10-year bond pays more than a 2-year bond. This is normal and healthy."
      : shape === "Flat"
      ? "Usually long-term bonds pay more, but right now short and long-term bonds pay almost the same. This means investors think interest rates will fall in the future."
      : shape === "Inverted"
      ? "Something unusual: short-term bonds pay MORE than long-term ones. This is like getting a higher FD rate for 1 year than for 10 years. It often signals economic trouble ahead."
      : "The yield curve has a bump in the middle — medium-term bonds pay the most. This means the market is confused about the future direction of interest rates.",
    historicalContext: "India's yield curve has been normally shaped for most of the past decade. The 2s10s spread averaged ~50 bps during 2019-2023. During COVID (March 2020), the curve steepened sharply as RBI cut rates aggressively. The curve flattened in 2022 when inflation spiked and RBI hiked rates.",
    implications: [
      { area: "Banking Sector", impact: shape === "Normal" ? "Healthy: banks borrow short and lend long, earning the spread" : "Squeezed: flatter curve compresses bank net interest margins", direction: shape === "Normal" ? "positive" : "negative" },
      { area: "Bond Fund Strategy", impact: shape === "Normal" ? "Duration funds benefit from carry; gilt funds well-positioned" : shape === "Flat" ? "Reduce duration; short-term funds outperform" : "Short-term funds are safest; avoid long duration", direction: shape === "Normal" ? "positive" : "negative" },
      { area: "Economic Growth", impact: shape === "Normal" ? "Signals continued expansion; credit growth supported" : shape === "Inverted" ? "Recession warning; credit tightening likely" : "Slowing momentum; watch for further flattening", direction: shape === "Normal" ? "positive" : shape === "Inverted" ? "negative" : "neutral" },
      { area: "RBI Policy", impact: spread2s10s > 0.4 ? "Room for tightening without inverting" : "Limited room to hike; market pricing rate cuts", direction: spread2s10s > 0.4 ? "neutral" : "positive" },
    ],
    points,
  };
}

// ─── LONG-DURATION BOND INTELLIGENCE ────────────────────────────────

export function getLongDurationBonds(): LongDurationBond[] {
  const rng = seededRng("long-dur-v2");
  const r = (min: number, max: number) => +(min + rng() * (max - min)).toFixed(2);
  return [
    {
      name: "India 30Y G-Sec", country: "India", flag: "\u{1f1ee}\u{1f1f3}", tenor: "30Y",
      yield: r(7.3, 7.6), change1d: +(rng() * 0.1 - 0.05).toFixed(2), duration: r(16, 19), convexity: r(350, 450),
      inflationSensitivity: "A 1% surprise inflation increase causes ~2.5% price decline. India's long bonds are highly sensitive to CPI prints.",
      pensionExposure: "Indian insurance companies (LIC, EPFO) are natural buyers. ALM matching creates structural demand floor.",
      aiInsight: "India's 30Y segment offers attractive carry for liability-driven investors. The term premium of ~30 bps over 10Y compensates for duration risk. FII interest growing post-index inclusion.",
      beginnerNote: "This bond matures in 30 years. It pays the highest interest but its price swings wildly when interest rates change. Only for very long-term investors or institutions.",
    },
    {
      name: "US Treasury 30Y Bond", country: "United States", flag: "\u{1f1fa}\u{1f1f8}", tenor: "30Y",
      yield: r(4.3, 4.8), change1d: +(rng() * 0.08 - 0.04).toFixed(2), duration: r(17, 20), convexity: r(400, 500),
      inflationSensitivity: "TIPS breakeven at ~2.4% implies market expects moderate inflation. Real yields are deeply positive — unusual historically.",
      pensionExposure: "US pension funds ($30T+ in assets) are the largest natural buyers. Duration matching requirements create persistent demand.",
      aiInsight: "30Y UST offers the highest nominal yield since 2007. Real yields above 2% are historically rare and attractive. Key risk: US fiscal trajectory with $35T+ national debt.",
      beginnerNote: "The 30-year US Treasury is the gold standard of safe bonds. It's used as a benchmark globally. Very sensitive to inflation expectations.",
    },
    {
      name: "UK Gilt 50Y", country: "United Kingdom", flag: "\u{1f1ec}\u{1f1e7}", tenor: "50Y",
      yield: r(4.2, 4.7), change1d: +(rng() * 0.12 - 0.06).toFixed(2), duration: r(25, 30), convexity: r(800, 1100),
      inflationSensitivity: "UK 50Y Gilt is extremely duration-sensitive. The September 2022 crisis showed 25%+ price drops in days when yields spiked.",
      pensionExposure: "UK defined-benefit pension schemes hold ~£2.5T in gilts for liability matching. LDI strategies amplified the 2022 crisis.",
      aiInsight: "Post-LDI crisis, 50Y Gilt yields normalized but structural demand from pensions remains. Extreme duration risk requires careful sizing.",
      beginnerNote: "A 50-year bond is extremely long. Small interest rate changes cause huge price swings. The UK pension crisis of 2022 was caused by these ultra-long bonds.",
    },
    {
      name: "Austria 100Y Bond", country: "Austria", flag: "\u{1f1e6}\u{1f1f9}", tenor: "100Y",
      yield: r(2.8, 3.4), change1d: +(rng() * 0.15 - 0.08).toFixed(2), duration: r(40, 50), convexity: r(2000, 2800),
      inflationSensitivity: "Extreme: 1% yield rise causes ~45% price decline. The 2020 Austrian century bond fell 75% from its peak when rates rose.",
      pensionExposure: "European pension and insurance firms bought heavily at issuance. Duration matching for 50Y+ liabilities drives demand.",
      aiInsight: "The Austrian century bond is a barometer of global rate expectations. Issued at 0.88% yield in 2020, it fell from €140 to €35 by 2023 as rates normalized. Now stabilizing but still carries extreme duration risk.",
      beginnerNote: "A 100-year bond! Your great-grandchildren would see it mature. These exist because some investors (pension funds) have very long-term obligations. Extremely risky for regular investors.",
    },
    {
      name: "Japan 30Y JGB", country: "Japan", flag: "\u{1f1ef}\u{1f1f5}", tenor: "30Y",
      yield: r(1.8, 2.3), change1d: +(rng() * 0.06 - 0.03).toFixed(2), duration: r(19, 23), convexity: r(450, 550),
      inflationSensitivity: "Japan exiting deflation makes JGBs vulnerable. BoJ's yield curve control policy kept yields artificially low for years.",
      pensionExposure: "Japan's GPIF (world's largest pension fund, $1.4T) holds significant JGB positions. BoJ holds ~55% of all JGBs outstanding.",
      aiInsight: "Japan's normalization story is the biggest risk to global bonds. If JGB yields rise materially, it could trigger capital repatriation, pushing global yields higher. Key tail risk for 2024-25.",
      beginnerNote: "Japanese bonds have had near-zero yields for decades. Now yields are rising as Japan fights inflation for the first time in 30 years. This has global implications.",
    },
  ];
}

// ─── BOND STORY ENGINE ──────────────────────────────────────────────

export function generateBondStories(): BondStory[] {
  const rng = seededRng(Date.now().toString().slice(0, -4));
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const impacts: ("bullish" | "bearish" | "neutral")[] = ["bullish", "bearish", "neutral"];

  return [
    {
      headline: `RBI ${pick(["Holds Repo Rate", "Signals Rate Cut", "Surprises with 25 bps Cut"])} — Bond Markets React`,
      summary: `The RBI monetary policy committee ${pick(["maintained", "changed"])} the repo rate, with the stance remaining ${pick(["accommodative", "neutral"])}. India 10Y G-Sec yield ${pick(["fell 5 bps", "rose 3 bps", "was little changed"])} in response.`,
      impact: pick(impacts), category: "Central Bank",
      timeAgo: `${Math.floor(rng() * 4 + 1)}h ago`,
      beginnerExplanation: "RBI's interest rate decisions directly affect bond prices. A rate cut means existing bonds become more valuable because new bonds will pay less.",
    },
    {
      headline: `US Treasury 10Y Yield Hits ${(4.1 + rng() * 0.5).toFixed(2)}% — Global Impact`,
      summary: `US Treasury yields ${pick(["surged", "dipped", "stabilized"])} as markets digested ${pick(["stronger-than-expected jobs data", "cooling inflation", "Fed commentary"])}. Emerging market bonds ${pick(["sold off", "rallied", "were mixed"])} in sympathy.`,
      impact: pick(impacts), category: "Global",
      timeAgo: `${Math.floor(rng() * 6 + 1)}h ago`,
      beginnerExplanation: "US Treasury yields are like the 'gravity' of global bond markets. When US yields rise, bond yields everywhere tend to follow.",
    },
    {
      headline: `India CPI Inflation at ${(4 + rng() * 2.5).toFixed(1)}% — ${pick(["Within", "Above"])} RBI Target`,
      summary: `Consumer price inflation ${pick(["eased", "accelerated", "held steady"])}, ${pick(["supporting", "complicating"])} the case for monetary easing. Food prices remain the key variable.`,
      impact: pick(impacts), category: "Macro",
      timeAgo: `${Math.floor(rng() * 12 + 1)}h ago`,
      beginnerExplanation: "Inflation eats into bond returns. If you earn 7% on a bond but inflation is 6%, your real gain is only 1%. RBI targets 4% inflation.",
    },
    {
      headline: `G-Sec Auction: ₹${(25000 + rng() * 15000).toFixed(0)} Cr — ${pick(["Strong Demand", "Devolved Partially", "Well Received"])}`,
      summary: `The weekly government securities auction saw ${pick(["robust", "tepid", "mixed"])} demand. Bid-to-cover ratio at ${(1.5 + rng() * 2).toFixed(1)}x. ${pick(["Banks", "FIIs", "Insurance companies"])} were the primary bidders.`,
      impact: pick(impacts), category: "Supply",
      timeAgo: `${Math.floor(rng() * 24 + 1)}h ago`,
      beginnerExplanation: "The government regularly sells new bonds through auctions. If many people want to buy (high demand), it pushes bond prices up and yields down.",
    },
    {
      headline: `FII Bond Flows: Net ${pick(["Inflows", "Outflows"])} of ₹${(rng() * 8000 + 1000).toFixed(0)} Cr This Week`,
      summary: `Foreign institutional investors ${pick(["continued buying", "turned net sellers of", "remained cautious on"])} Indian government bonds. JP Morgan GBI-EM index inclusion continues to drive ${pick(["structural inflows", "benchmark-tracking demand"])}.`,
      impact: pick(impacts), category: "Flows",
      timeAgo: `${Math.floor(rng() * 48 + 1)}h ago`,
      beginnerExplanation: "When foreign investors buy Indian bonds, it pushes prices up. India being included in global bond indices means automatic buying by large global funds.",
    },
    {
      headline: `Oil Prices ${pick(["Surge Past", "Retreat Below"])} $${(70 + rng() * 25).toFixed(0)}/bbl — Fiscal Impact`,
      summary: `Crude oil price movements are ${pick(["raising concerns about", "easing pressure on"])} India's fiscal deficit and current account. Bond markets ${pick(["reacted negatively", "shrugged off", "rallied on"])} the development.`,
      impact: pick(impacts), category: "Macro",
      timeAgo: `${Math.floor(rng() * 36 + 1)}h ago`,
      beginnerExplanation: "India imports most of its oil. Higher oil prices = bigger import bill = wider fiscal deficit = more government borrowing = more bond supply = potentially higher yields.",
    },
  ];
}

// ─── BOND ↔ STOCK MARKET IMPACT ENGINE ──────────────────────────────

export function getBondEquityImpacts(): BondEquityImpact[] {
  const rng = seededRng("bond-eq-v2");
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const dirs: ("positive" | "negative" | "neutral")[] = ["positive", "negative", "neutral"];

  return [
    {
      factor: "Yield-Equity Correlation", currentState: `10Y G-Sec at ${(7 + rng() * 0.3).toFixed(2)}% | Nifty PE at ${(20 + rng() * 5).toFixed(1)}x`,
      bondImpact: "Rising yields reduce bond prices through discounting mechanism",
      equityImpact: "Higher yields increase equity discount rates, reducing fair values. Growth stocks hit hardest.",
      correlation: "Negative in tightening cycles (bonds fall, stocks fall). Positive in risk-off (bonds rally, stocks fall).",
      direction: pick(dirs),
      beginnerExplanation: "When bond yields rise, stocks often fall because investors can get better 'safe' returns from bonds. It's like bonds and stocks competing for your money.",
    },
    {
      factor: "Credit Spread Indicator", currentState: `AAA spread: ${(40 + rng() * 30).toFixed(0)} bps | High yield: ${(200 + rng() * 200).toFixed(0)} bps`,
      bondImpact: "Widening spreads signal credit stress; corporate bond prices fall",
      equityImpact: "Credit spread widening is a leading indicator of equity market corrections. Financials hit first.",
      correlation: "Credit spreads lead equity markets by 1-3 months. Spread blow-outs preceded every major equity crash.",
      direction: pick(dirs),
      beginnerExplanation: "Credit spreads measure how much extra interest risky companies pay vs the government. When this gap widens, it's a warning sign for both bond and stock investors.",
    },
    {
      factor: "RBI Rate Path vs Equity Earnings", currentState: `Repo: 6.50% | Nifty EPS growth: ${(10 + rng() * 15).toFixed(0)}%`,
      bondImpact: "Rate cuts drive bond prices higher through capital appreciation",
      equityImpact: "Rate cuts support equity valuations by lowering discount rates. Banking and real estate benefit most.",
      correlation: "Rate cuts are bullish for BOTH bonds and stocks. Best environment: falling rates + rising earnings.",
      direction: "positive",
      beginnerExplanation: "When RBI cuts rates, it's usually good for both your bond and stock investments. Companies borrow cheaper (good for stocks) and existing bonds become more valuable.",
    },
    {
      factor: "Global Risk Sentiment", currentState: `VIX: ${(14 + rng() * 16).toFixed(1)} | ${pick(["Risk-on", "Risk-off", "Mixed"])} environment`,
      bondImpact: "Risk-off drives flight to government bonds; yields drop sharply",
      equityImpact: "Risk-off causes equity selloffs, especially in emerging markets. FII outflows accelerate.",
      correlation: "Government bonds and equities move in opposite directions during crises. This is why bonds hedge equity portfolios.",
      direction: pick(dirs),
      beginnerExplanation: "When markets are scared, investors sell stocks and buy government bonds for safety. This is why holding some bonds protects your portfolio during stock market crashes.",
    },
    {
      factor: "Rupee-Bond-Equity Nexus", currentState: `USD/INR: ₹${(83 + rng() * 4).toFixed(2)} | FII equity: ${pick(["net buyer", "net seller"])}`,
      bondImpact: "Weak rupee triggers FII bond selling; RBI may intervene in forex and bond markets",
      equityImpact: "Weak rupee boosts IT/pharma earnings but hurts import-dependent sectors and sentiment",
      correlation: "Rupee depreciation tends to be negative for both bonds (FII selling) and broader equity (sentiment). IT sector is the exception.",
      direction: pick(dirs),
      beginnerExplanation: "When the rupee weakens, foreign investors lose on currency when selling Indian assets. This makes them sell both bonds and stocks, pushing both lower.",
    },
  ];
}

// ─── ECONOMIC CALENDAR ──────────────────────────────────────────────

export function getEconomicCalendar(): EconomicEvent[] {
  const rng = seededRng("econ-cal-v2");
  const r = (min: number, max: number) => +(min + rng() * (max - min)).toFixed(1);

  return [
    { date: "This Week", event: "RBI Monetary Policy Decision", country: "India", flag: "\u{1f1ee}\u{1f1f3}", importance: "Critical", expectedImpact: "25 bps cut to 6.25% expected by 60% of analysts", previousValue: "6.50%", consensus: "6.25-6.50%", bondImplication: "Rate cut = bond prices rally. Hold or surprise hike = sharp selloff. The most important event for Indian bond markets." },
    { date: "This Week", event: "US Non-Farm Payrolls", country: "United States", flag: "\u{1f1fa}\u{1f1f8}", importance: "Critical", expectedImpact: "Strong data delays Fed cuts; weak data accelerates them", previousValue: `${(150 + rng() * 100).toFixed(0)}K`, consensus: `${(160 + rng() * 80).toFixed(0)}K`, bondImplication: "Strong jobs data pushes US yields higher, pulling Indian yields up. Weak data is bullish for global bonds." },
    { date: "Next Week", event: "India CPI Inflation", country: "India", flag: "\u{1f1ee}\u{1f1f3}", importance: "Critical", expectedImpact: `Inflation ${rng() > 0.5 ? "expected to moderate" : "may remain elevated"}`, previousValue: `${r(4, 6.5)}%`, consensus: `${r(4, 5.5)}%`, bondImplication: "Below 4.5%: bullish, supports rate cuts. Above 5.5%: bearish, delays easing cycle." },
    { date: "Next Week", event: "G-Sec Weekly Auction", country: "India", flag: "\u{1f1ee}\u{1f1f3}", importance: "High", expectedImpact: `₹${(25000 + rng() * 10000).toFixed(0)} Cr notional across 3 securities`, previousValue: `Bid/cover: ${(1.8 + rng() * 1.5).toFixed(1)}x`, consensus: "Moderate demand expected", bondImplication: "Strong auction = yields stabilize/fall. Devolved auction (undersubscribed) = immediate yield spike of 3-8 bps." },
    { date: "This Month", event: "FOMC Meeting (Federal Reserve)", country: "United States", flag: "\u{1f1fa}\u{1f1f8}", importance: "Critical", expectedImpact: `Market pricing ${(rng() * 3).toFixed(0)} cuts by year-end`, previousValue: `${(4.75 + rng() * 0.75).toFixed(2)}%`, consensus: `${rng() > 0.5 ? "Hold" : "25 bps cut"}`, bondImplication: "Fed decisions set the tone for global rate expectations. Hawkish surprise = global bond selloff. Dovish = rally." },
    { date: "This Month", event: "India GDP Growth (Quarterly)", country: "India", flag: "\u{1f1ee}\u{1f1f3}", importance: "High", expectedImpact: `Growth at ${r(6, 8)}% expected`, previousValue: `${r(6, 8)}%`, consensus: `${r(6.5, 7.5)}%`, bondImplication: "Strong GDP: mixed for bonds (good credit quality but may delay rate cuts). Weak GDP: bullish for bonds (rate cuts more likely)." },
    { date: "This Month", event: "ECB Rate Decision", country: "Germany", flag: "\u{1f1ea}\u{1f1fa}", importance: "High", expectedImpact: `${rng() > 0.5 ? "25 bps cut expected" : "Hold expected"}`, previousValue: `${(3.5 + rng() * 0.5).toFixed(2)}%`, consensus: `${rng() > 0.5 ? "Cut" : "Hold"}`, bondImplication: "ECB cuts support global easing narrative. Holds or hawkish stance pushes Bund yields higher, rippling to EM bonds." },
    { date: "This Month", event: "BoJ Policy Meeting", country: "Japan", flag: "\u{1f1ef}\u{1f1f5}", importance: "High", expectedImpact: `Potential YCC adjustment or rate ${rng() > 0.5 ? "hike" : "hold"}`, previousValue: `${(0.1 + rng() * 0.3).toFixed(2)}%`, consensus: "Hold, with hawkish guidance", bondImplication: "BoJ normalization is the key tail risk for global bonds. Any surprise tightening can trigger JGB selling and global yield spillovers." },
  ];
}

// ─── BOND EDUCATION ENGINE ──────────────────────────────────────────

export function getBondEducation(): BondEducationTerm[] {
  return [
    { term: "What is a Bond?", category: "Basics", simpleExplanation: "A bond is simply a loan. When you buy a government bond, you're lending money to the government. They promise to pay you interest (coupon) regularly and return your money (face value) on a specific date (maturity).", analogy: "Think of it like an FD at a bank, but instead of the bank, you're lending to the government or a company. The 'coupon' is like your FD interest rate.", whyItMatters: "Bonds are the backbone of the financial system. Governments, companies, and banks all borrow through bonds. Understanding bonds helps you make better investment decisions.", example: "If you buy a 10-year government bond with 7.18% coupon at face value of ₹100, you'll receive ₹7.18 every year for 10 years, plus your ₹100 back at the end." },
    { term: "Yield", category: "Yield", simpleExplanation: "Yield is the actual return you earn on a bond at its current market price. If a bond's price goes up, the yield goes down (and vice versa). It's not the same as the coupon rate!", analogy: "Imagine you buy a ₹100 bond paying 7% coupon for ₹95 (at a discount). Your yield is higher than 7% because you paid less but still get the same interest. That's yield.", whyItMatters: "Yield tells you what you'll actually earn, not what the bond was originally designed to pay. It's the single most important number in bond investing.", example: "Bond A: 7% coupon, price ₹105 → yield = 6.67%. Bond B: 7% coupon, price ₹95 → yield = 7.37%. Same coupon, different yields because of different prices." },
    { term: "Duration", category: "Risk", simpleExplanation: "Duration tells you how sensitive a bond's price is to interest rate changes. Higher duration = bigger price swings when rates change. A duration of 7 means if rates rise 1%, the bond price falls about 7%.", analogy: "Duration is like the 'volatility dial' of a bond. Short-duration bonds are like a calm lake. Long-duration bonds are like ocean waves — small changes create big movements.", whyItMatters: "If you expect interest rates to fall, buy long-duration bonds (big price gains). If rates might rise, stick to short-duration (less damage). Duration is how you manage bond portfolio risk.", example: "Bond A (duration 2): Rates rise 1% → price falls ~2%. Bond B (duration 15): Rates rise 1% → price falls ~15%. Same rate change, very different outcomes." },
    { term: "Yield Curve", category: "Market", simpleExplanation: "The yield curve is a graph showing yields for different maturities (3 months, 1 year, 5 years, 10 years, 30 years). Normally it slopes upward — you get paid more for lending longer. When it inverts (slopes down), it often predicts recessions.", analogy: "It's like a term deposit rate card: usually, longer FDs pay more. If a bank offered 8% for 1 year but only 6% for 5 years, you'd know something strange is happening. That's an inverted yield curve.", whyItMatters: "The yield curve is one of the most powerful economic indicators. An inverted curve has preceded every US recession in the last 50 years. Central banks and investors watch it obsessively.", example: "Normal curve: 1Y = 6.5%, 5Y = 7.0%, 10Y = 7.2%. Inverted curve: 1Y = 7.5%, 5Y = 7.0%, 10Y = 6.8%. The second pattern is a warning sign." },
    { term: "Credit Rating", category: "Basics", simpleExplanation: "A credit rating is like a report card for borrowers. AAA is the best (safest), going down to D (default/failed to pay). Government bonds are 'Sovereign' rated — the safest within their country.", analogy: "Just like a person with an 800 credit score gets the cheapest home loan, a AAA-rated company borrows at lower rates than a BB-rated one. The rating tells you how likely they are to repay.", whyItMatters: "Lower-rated bonds pay higher yields to compensate for higher risk. A downgrade from AA to A can cause 5-15% price drops overnight. Ratings drive institutional investment rules.", example: "Government of India: Sovereign (safest in INR). HDFC Bank: AAA (excellent). Tata Capital: AA+ (very good). A small company: BBB (adequate but watch carefully)." },
    { term: "Repo Rate", category: "Central Bank", simpleExplanation: "The repo rate is the interest rate at which RBI lends money to banks overnight. It's the 'master switch' for all interest rates in the economy. When RBI changes the repo rate, all other rates follow.", analogy: "RBI is like the central water supply. The repo rate is the main valve. When RBI opens it (cuts rate), money flows more freely and cheaply. When RBI tightens it (hikes rate), borrowing becomes expensive for everyone.", whyItMatters: "Every time RBI changes the repo rate, it affects your EMI, FD rates, bond prices, and stock markets. A 25 bps (0.25%) cut can move billions in bond values.", example: "If RBI cuts repo from 6.50% to 6.25%: Your home loan EMI decreases, FD rates fall, bond prices rise (great for existing bond holders), and stock markets usually rally." },
    { term: "G-Sec (Government Security)", category: "Basics", simpleExplanation: "G-Secs are bonds issued by the Government of India. They are the safest INR investment because the government can always print rupees to repay. They come in different maturities from 91 days to 40 years.", analogy: "G-Secs are like a super-safe FD with the government. The difference: FDs have a fixed price (₹100), but G-Sec prices change daily based on demand and interest rates.", whyItMatters: "G-Secs set the benchmark for all other interest rates in India. Corporate bond rates, home loan rates, and FD rates are all influenced by G-Sec yields. The 10Y G-Sec yield is India's most important rate.", example: "The 10Y G-Sec with 7.18% coupon is currently the benchmark. Banks must hold at least 18% of deposits in G-Secs (SLR requirement). Total G-Sec market size: ~₹100 lakh crore." },
    { term: "Spread", category: "Strategy", simpleExplanation: "A spread is the difference in yield between two bonds. It tells you how much extra return you earn for taking on additional risk. The most common spread compares corporate bonds to government bonds.", analogy: "If a government bond yields 7% and a corporate bond yields 8%, the spread is 1% (100 bps). That extra 1% is your 'payment' for the risk that the company might not repay.", whyItMatters: "Spreads tell you if the extra risk is worth taking. When spreads are very tight (small), you're not being paid enough for credit risk. When spreads blow out (wide), it might be a buying opportunity.", example: "AAA corporate spread over G-Sec: ~40-60 bps (low risk, low extra return). AA rated: ~80-120 bps. BBB rated: ~200-400 bps. IL&FS default caused spreads to blow out to 500+ bps in 2018." },
  ];
}

// ─── NAV SECTIONS FOR PLATFORM ─────────────────────────────────────

export const BOND_NAV_SECTIONS = [
  { id: "overview", label: "Overview", emoji: "\u{1f30d}" },
  { id: "copilot", label: "AI Copilot", emoji: "\u{1f916}" },
  { id: "yieldcurve", label: "Yield Curve", emoji: "\u{1f4c8}" },
  { id: "longduration", label: "30Y/50Y/100Y", emoji: "\u{1f3db}️" },
  { id: "stories", label: "Market Stories", emoji: "\u{1f4f0}" },
  { id: "impact", label: "Bond ↔ Equity", emoji: "⚡" },
  { id: "calendar", label: "Eco Calendar", emoji: "\u{1f4c5}" },
  { id: "learn", label: "Learn Bonds", emoji: "\u{1f4da}" },
] as const;
