// ═══════════════════════════════════════════════════════════════════════
// BOND DATA ENGINE — Institutional-Grade Fixed Income Intelligence
// Bloomberg Terminal + BlackRock Aladdin + JPMorgan Fixed Income Research
// ═══════════════════════════════════════════════════════════════════════

function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

// ═══════════════════════════════════════════
// 1. BOND DETAILED INFO
// ═══════════════════════════════════════════

export interface BondDetailedInfo {
  symbol: string;
  name: string;
  issuer: string;
  country: string;
  bondType: "Sovereign" | "Corporate" | "Municipal" | "Quasi-Sovereign" | "Supranational";
  faceValue: number;
  couponRate: number;
  couponType: "Fixed" | "Floating" | "Zero Coupon" | "Inflation-Linked";
  couponFrequency: string;
  currentYield: number;
  ytm: number;
  ytw: number;
  cleanPrice: number;
  dirtyPrice: number;
  accruedInterest: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  maturityDate: string;
  creditRating: string;
  creditSpread: number; // bps
  oas: number; // bps
  zSpread: number; // bps
  dv01: number;
  liquidityScore: number; // 1-100
  bidAskSpread: string;
  tradingVolume: string;
  benchmarkYield: number;
  seniority: string;
  callable: boolean;
  putable: boolean;
  recoveryRate: number;
}

export function generateBondDetail(symbol: string, name: string, issuer: string, coupon: string, tenure: string, rating: string, yieldStr: string, category: string): BondDetailedInfo {
  const rng = seededRng(symbol);
  const couponVal = parseFloat(coupon) || 0;
  const yieldVal = parseFloat(yieldStr) || couponVal;
  const isSovereign = rating === "Sovereign" || category.includes("Government") || category.includes("Treasury");
  const isTBill = category.includes("Treasury Bill");

  const duration = isTBill ? +(rng() * 0.9 + 0.1).toFixed(2) : +(rng() * 8 + 1).toFixed(2);
  const price = +(95 + rng() * 10).toFixed(2);

  return {
    symbol, name, issuer,
    country: "India",
    bondType: isSovereign ? "Sovereign" : category.includes("State") ? "Quasi-Sovereign" : "Corporate",
    faceValue: 100,
    couponRate: couponVal,
    couponType: isTBill ? "Zero Coupon" : coupon.includes("floating") ? "Floating" : "Fixed",
    couponFrequency: isTBill ? "N/A" : "Semi-Annual",
    currentYield: +(couponVal / price * 100).toFixed(2),
    ytm: yieldVal,
    ytw: +(yieldVal - rng() * 0.2).toFixed(2),
    cleanPrice: price,
    dirtyPrice: +(price + rng() * 3).toFixed(2),
    accruedInterest: +(rng() * 3).toFixed(2),
    duration,
    modifiedDuration: +(duration / (1 + yieldVal / 200)).toFixed(2),
    convexity: +(duration * duration * 0.12 + rng() * 20).toFixed(1),
    maturityDate: tenure,
    creditRating: rating,
    creditSpread: isSovereign ? 0 : +(30 + rng() * 120).toFixed(0),
    oas: isSovereign ? 0 : +(25 + rng() * 100).toFixed(0),
    zSpread: isSovereign ? 0 : +(35 + rng() * 110).toFixed(0),
    dv01: +(duration * price / 10000).toFixed(4),
    liquidityScore: isSovereign ? +(75 + rng() * 25).toFixed(0) : +(30 + rng() * 50).toFixed(0),
    bidAskSpread: isSovereign ? `${(0.5 + rng() * 1.5).toFixed(1)} bps` : `${(2 + rng() * 8).toFixed(1)} bps`,
    tradingVolume: isSovereign ? `₹${(500 + rng() * 2000).toFixed(0)} Cr` : `₹${(20 + rng() * 200).toFixed(0)} Cr`,
    benchmarkYield: +(6.8 + rng() * 0.6).toFixed(2),
    seniority: "Senior Unsecured",
    callable: !isSovereign && rng() > 0.6,
    putable: rng() > 0.85,
    recoveryRate: isSovereign ? 95 : +(35 + rng() * 30).toFixed(0),
  };
}


// ═══════════════════════════════════════════
// 2. BOND GLOSSARY
// ═══════════════════════════════════════════

export interface BondTerm {
  term: string;
  abbr: string;
  category: "Pricing" | "Yield" | "Risk" | "Credit" | "Central Bank" | "Market Structure" | "Strategy" | "Derivatives";
  definition: string;
  significance: string;
  yieldImpact: string;
  priceImpact: string;
}

export const BOND_GLOSSARY: BondTerm[] = [
  { term: "Yield to Maturity", abbr: "YTM", category: "Yield", definition: "The total return anticipated if a bond is held until maturity, accounting for coupon payments and capital gain/loss.", significance: "The most comprehensive single measure of bond return — the IRR of all future cash flows.", yieldImpact: "YTM rises when bond prices fall; falls when prices rise.", priceImpact: "Inverse relationship: higher YTM = lower price. A 1% YTM rise on a 7-year bond causes ~6.5% price drop." },
  { term: "Yield to Worst", abbr: "YTW", category: "Yield", definition: "The lowest possible yield from a bond considering all call/put provisions.", significance: "Conservative yield measure used by institutional investors. Required for callable bonds.", yieldImpact: "YTW < YTM for callable bonds trading above par.", priceImpact: "Callable bonds are effectively capped at call price when yields drop significantly." },
  { term: "Option Adjusted Spread", abbr: "OAS", category: "Pricing", definition: "The spread over the benchmark yield curve after removing the value of embedded options.", significance: "The cleanest measure of credit risk compensation for bonds with embedded options.", yieldImpact: "Higher OAS = higher compensation for credit risk after adjusting for optionality.", priceImpact: "OAS widening causes bond prices to fall; tightening causes prices to rise." },
  { term: "Credit Default Swap", abbr: "CDS", category: "Credit", definition: "A derivative providing insurance against default. Buyer pays premium, seller pays notional on default.", significance: "Real-time market pricing of credit risk. CDS spreads are the purest credit risk indicator.", yieldImpact: "Rising CDS spreads lead credit spread widening, pushing yields higher.", priceImpact: "CDS spread increase of 100 bps typically causes 3-8% bond price decline depending on duration." },
  { term: "Dollar Value of 01", abbr: "DV01", category: "Risk", definition: "The change in bond price for a 1 basis point change in yield. Also called PVBP.", significance: "Primary risk metric for bond portfolio management. Used for hedging and position sizing.", yieldImpact: "Higher DV01 = greater sensitivity to yield changes.", priceImpact: "DV01 × yield change (bps) = approximate price change per ₹100 face value." },
  { term: "Secured Overnight Financing Rate", abbr: "SOFR", category: "Market Structure", definition: "Benchmark rate based on overnight Treasury repo transactions. Replaced LIBOR as the primary USD reference rate.", significance: "The foundation rate for all floating rate instruments and derivatives globally.", yieldImpact: "SOFR directly sets floating rate coupon payments. Higher SOFR = higher floating rate bond yields.", priceImpact: "SOFR changes affect short-end pricing and money market fund NAVs." },
  { term: "US Treasury", abbr: "UST", category: "Market Structure", definition: "Debt securities issued by the US government — the global risk-free benchmark.", significance: "UST yields set the floor for all global bond markets. The most liquid market in the world.", yieldImpact: "Rising UST yields pull all global yields higher through arbitrage and capital flows.", priceImpact: "10-year UST move of 50 bps causes 3-4% price change; ripples across all fixed income." },
  { term: "Government Securities", abbr: "G-Sec", category: "Market Structure", definition: "Bonds issued by the central/state governments. In India, includes dated securities and T-Bills.", significance: "India's G-Sec market is the benchmark for all INR fixed income. ~₹100 lakh crore outstanding.", yieldImpact: "G-Sec yields are directly set by RBI policy, auction results, and FII flows.", priceImpact: "India 10Y G-Sec is the primary benchmark. 25 bps yield move = ~1.7% price change." },
  { term: "Investment Grade", abbr: "IG", category: "Credit", definition: "Bonds rated BBB-/Baa3 or above. Considered safe for institutional investment.", significance: "IG bonds are eligible for most institutional mandates. Form the bulk of bond indices.", yieldImpact: "IG spreads typically range from 50-200 bps over government benchmarks.", priceImpact: "IG bonds have moderate credit risk but can still fall 5-15% during stress periods." },
  { term: "High Yield", abbr: "HY", category: "Credit", definition: "Bonds rated below BBB-/Baa3. Also called 'junk bonds'. Higher default risk, higher yield.", significance: "HY bonds behave like a mix of credit and equity. ~3-5% annual default rate historically.", yieldImpact: "HY spreads range from 300-800 bps; can blow out to 1000+ bps in crises.", priceImpact: "HY bonds can lose 20-40% during credit stress. Recovery rates average 40-50%." },
  { term: "Asset-Backed Securities", abbr: "ABS", category: "Market Structure", definition: "Bonds backed by pools of assets (auto loans, credit cards, student loans).", significance: "ABS provides diversified cash flows. $3T+ market globally. Key funding mechanism.", yieldImpact: "ABS spreads reflect underlying asset quality. AAA tranches yield 30-80 bps over benchmarks.", priceImpact: "Prepayment risk affects ABS pricing. Rising rates reduce prepayments, extending duration." },
  { term: "Mortgage-Backed Securities", abbr: "MBS", category: "Market Structure", definition: "Bonds backed by pools of residential mortgages. Agency MBS guaranteed by GSEs.", significance: "The largest US bond market after Treasuries. Fed's QE heavily impacted MBS pricing.", yieldImpact: "MBS spreads widened significantly during 2008 GFC (500+ bps) and during Fed QT.", priceImpact: "Negative convexity: MBS prices underperform when rates drop (prepayments increase)." },
  { term: "Collateralized Loan Obligation", abbr: "CLO", category: "Market Structure", definition: "Structured credit vehicle pooling leveraged loans into rated tranches.", significance: "$1T+ market. CLOs are the largest buyer of leveraged loans. Complex risk dynamics.", yieldImpact: "AAA CLO tranches yield SOFR + 130-170 bps. Equity tranches target 12-18% returns.", priceImpact: "CLO prices depend on underlying loan default rates, prepayments, and reinvestment risk." },
  { term: "Treasury Inflation-Protected Securities", abbr: "TIPS", category: "Market Structure", definition: "US government bonds with principal adjusted for CPI inflation.", significance: "TIPS provide real yield. TIPS breakeven = inflation expectation priced by the market.", yieldImpact: "TIPS real yield = nominal yield - inflation breakeven. Real yields drive asset allocation.", priceImpact: "TIPS outperform nominals when actual inflation exceeds breakeven at issuance." },
  { term: "Quantitative Tightening", abbr: "QT", category: "Central Bank", definition: "Central bank reducing balance sheet by letting bonds mature or actively selling them.", significance: "QT reduces liquidity, increases term premium, and puts upward pressure on yields.", yieldImpact: "Fed QT at $95B/month estimated to add 30-60 bps to 10-year yield.", priceImpact: "QT causes bonds to underperform as supply increases and demand from the central bank decreases." },
  { term: "Repurchase Agreement", abbr: "Repo", category: "Market Structure", definition: "Short-term borrowing using bonds as collateral. The plumbing of fixed income markets.", significance: "Repo market is ~$5T+ daily. Repo rate distortions signal funding stress.", yieldImpact: "Repo rate sets the effective floor for short-term yields.", priceImpact: "Repo market stress (e.g., Sep 2019) causes violent moves in short-term bond prices." },
  { term: "Basis Trade", abbr: "Basis", category: "Strategy", definition: "Exploiting the price difference between cash bonds and futures contracts.", significance: "Hedge funds use massive leverage in basis trades. Unwinding causes market disruption.", yieldImpact: "Basis trade crowding affects Treasury auction demand and pricing.", priceImpact: "Forced basis trade unwinding in March 2020 caused Treasury prices to gap down." },
  { term: "Carry Trade (Fixed Income)", abbr: "Carry", category: "Strategy", definition: "Buying longer-duration bonds funded by short-term borrowing to capture yield differential.", significance: "The most common institutional fixed income strategy. Profits from steep yield curves.", yieldImpact: "Carry trades flatten the yield curve by pushing down long rates and up short rates.", priceImpact: "Carry trade unwinding during curve inversions causes long bond prices to drop." },
  { term: "Curve Steepener", abbr: "Steepener", category: "Strategy", definition: "Trade profiting from the yield curve getting steeper (long rates rising faster than short rates).", significance: "Steepener trades are popular at the start of easing cycles.", yieldImpact: "Bull steepener: short rates fall faster. Bear steepener: long rates rise faster.", priceImpact: "Steepener profits when 2Y-10Y spread widens; short front-end, long back-end." },
  { term: "Flight to Safety", abbr: "Risk-Off", category: "Strategy", definition: "Capital flowing into safe government bonds during market stress, pushing yields down.", significance: "During crises, government bond yields can drop 50-100 bps in days.", yieldImpact: "Flight to safety compresses yields on safe-haven bonds (UST, Bunds, JGBs).", priceImpact: "10-year UST prices rose 8-12% during COVID flight to safety in March 2020." },
];

export const BOND_GLOSSARY_CATEGORIES = ["All", "Pricing", "Yield", "Risk", "Credit", "Central Bank", "Market Structure", "Strategy", "Derivatives"] as const;


// ═══════════════════════════════════════════
// 3. YIELD CURVE DATA
// ═══════════════════════════════════════════

export interface YieldCurvePoint {
  tenor: string;
  yield: number;
  change1d: number;
  change1w: number;
  change1m: number;
}

export function generateYieldCurve(country: string = "India"): YieldCurvePoint[] {
  const rng = seededRng(`yc-${country}`);
  const isIndia = country === "India";
  const baseRate = isIndia ? 6.5 : 4.5;
  return [
    { tenor: "1M", yield: +(baseRate - 0.15 + rng() * 0.2).toFixed(2), change1d: +(rng() * 0.06 - 0.03).toFixed(2), change1w: +(rng() * 0.12 - 0.06).toFixed(2), change1m: +(rng() * 0.3 - 0.15).toFixed(2) },
    { tenor: "3M", yield: +(baseRate - 0.05 + rng() * 0.2).toFixed(2), change1d: +(rng() * 0.06 - 0.03).toFixed(2), change1w: +(rng() * 0.12 - 0.06).toFixed(2), change1m: +(rng() * 0.3 - 0.15).toFixed(2) },
    { tenor: "6M", yield: +(baseRate + 0.05 + rng() * 0.2).toFixed(2), change1d: +(rng() * 0.06 - 0.03).toFixed(2), change1w: +(rng() * 0.12 - 0.06).toFixed(2), change1m: +(rng() * 0.3 - 0.15).toFixed(2) },
    { tenor: "1Y", yield: +(baseRate + 0.15 + rng() * 0.2).toFixed(2), change1d: +(rng() * 0.06 - 0.03).toFixed(2), change1w: +(rng() * 0.12 - 0.06).toFixed(2), change1m: +(rng() * 0.3 - 0.15).toFixed(2) },
    { tenor: "2Y", yield: +(baseRate + 0.25 + rng() * 0.25).toFixed(2), change1d: +(rng() * 0.08 - 0.04).toFixed(2), change1w: +(rng() * 0.15 - 0.08).toFixed(2), change1m: +(rng() * 0.35 - 0.18).toFixed(2) },
    { tenor: "3Y", yield: +(baseRate + 0.35 + rng() * 0.25).toFixed(2), change1d: +(rng() * 0.08 - 0.04).toFixed(2), change1w: +(rng() * 0.15 - 0.08).toFixed(2), change1m: +(rng() * 0.35 - 0.18).toFixed(2) },
    { tenor: "5Y", yield: +(baseRate + 0.45 + rng() * 0.3).toFixed(2), change1d: +(rng() * 0.1 - 0.05).toFixed(2), change1w: +(rng() * 0.2 - 0.1).toFixed(2), change1m: +(rng() * 0.4 - 0.2).toFixed(2) },
    { tenor: "7Y", yield: +(baseRate + 0.55 + rng() * 0.3).toFixed(2), change1d: +(rng() * 0.1 - 0.05).toFixed(2), change1w: +(rng() * 0.2 - 0.1).toFixed(2), change1m: +(rng() * 0.4 - 0.2).toFixed(2) },
    { tenor: "10Y", yield: +(baseRate + 0.6 + rng() * 0.35).toFixed(2), change1d: +(rng() * 0.1 - 0.05).toFixed(2), change1w: +(rng() * 0.2 - 0.1).toFixed(2), change1m: +(rng() * 0.4 - 0.2).toFixed(2) },
    { tenor: "15Y", yield: +(baseRate + 0.65 + rng() * 0.35).toFixed(2), change1d: +(rng() * 0.1 - 0.05).toFixed(2), change1w: +(rng() * 0.2 - 0.1).toFixed(2), change1m: +(rng() * 0.4 - 0.2).toFixed(2) },
    { tenor: "20Y", yield: +(baseRate + 0.7 + rng() * 0.4).toFixed(2), change1d: +(rng() * 0.1 - 0.05).toFixed(2), change1w: +(rng() * 0.2 - 0.1).toFixed(2), change1m: +(rng() * 0.4 - 0.2).toFixed(2) },
    { tenor: "30Y", yield: +(baseRate + 0.75 + rng() * 0.4).toFixed(2), change1d: +(rng() * 0.12 - 0.06).toFixed(2), change1w: +(rng() * 0.25 - 0.12).toFixed(2), change1m: +(rng() * 0.5 - 0.25).toFixed(2) },
  ];
}


// ═══════════════════════════════════════════
// 4. RISK ANALYSIS
// ═══════════════════════════════════════════

export interface BondRisk {
  name: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  probability: number;
  impact: string;
  description: string;
  historicalEvent: string;
}

export function generateBondRisks(symbol: string, rating: string): BondRisk[] {
  const rng = seededRng(`risk-${symbol}`);
  const isSov = rating === "Sovereign";
  return [
    { name: "Interest Rate Risk", severity: "Critical", probability: +(40 + rng() * 30).toFixed(0), impact: `${(3 + rng() * 8).toFixed(1)}% price drop per 100 bps yield rise`, description: "Bond prices fall when yields rise. Duration amplifies this effect for longer-maturity bonds.", historicalEvent: "2022 US rate shock: 10Y UST lost 17% as Fed hiked 525 bps" },
    { name: "Inflation Risk", severity: "High", probability: +(25 + rng() * 30).toFixed(0), impact: "Real returns turn negative", description: "Unexpected inflation erodes the real value of fixed coupon payments and principal.", historicalEvent: "2022 global inflation shock — real yields on 10Y bonds turned deeply negative" },
    { name: "Credit Risk", severity: isSov ? "Low" : "High", probability: isSov ? +(1 + rng() * 3).toFixed(0) : +(5 + rng() * 15).toFixed(0), impact: isSov ? "Minimal for sovereign" : `${(5 + rng() * 25).toFixed(0)}% haircut on default`, description: isSov ? "Sovereign default risk in INR is effectively zero for India." : "Risk that the issuer fails to make coupon or principal payments.", historicalEvent: isSov ? "India has never defaulted on INR-denominated sovereign debt" : "IL&FS default 2018 — caused ₹91,000 Cr in losses across Indian credit markets" },
    { name: "Liquidity Risk", severity: isSov ? "Low" : "Medium", probability: +(10 + rng() * 20).toFixed(0), impact: "Bid-ask spreads widen 3-10x", description: "Inability to sell bonds at fair value due to thin trading. Off-the-run bonds are especially illiquid.", historicalEvent: "March 2020 — even US Treasury liquidity dried up during COVID panic" },
    { name: "Reinvestment Risk", severity: "Medium", probability: +(20 + rng() * 25).toFixed(0), impact: "Lower realized total return vs. YTM", description: "Risk that coupon payments are reinvested at lower rates when rates fall.", historicalEvent: "Post-2008 ZIRP environment — maturing bonds could only reinvest at near-zero rates" },
    { name: "Sovereign/Country Risk", severity: "Medium", probability: +(5 + rng() * 15).toFixed(0), impact: "Currency depreciation + spread widening", description: "Risk from fiscal deterioration, political instability, or policy uncertainty.", historicalEvent: "India taper tantrum 2013: 10Y G-Sec yields spiked 150 bps; INR fell 20%" },
    { name: "Downgrade Risk", severity: isSov ? "Low" : "Medium", probability: isSov ? +(2 + rng() * 5).toFixed(0) : +(8 + rng() * 18).toFixed(0), impact: "Spreads widen 50-200 bps on downgrade", description: "Risk of credit rating downgrade forcing institutional selling and spread widening.", historicalEvent: "Moody's downgraded India outlook to Negative in 2020; bond markets saw 30 bps selloff" },
    { name: "Duration / Convexity Risk", severity: "High", probability: +(30 + rng() * 30).toFixed(0), impact: "Non-linear losses in rate shocks", description: "For large yield moves, duration alone understates losses — convexity matters.", historicalEvent: "UK Gilt crisis Sep 2022: 30Y Gilt yields rose 150 bps in 3 days, prices collapsed 25%" },
    { name: "Fiscal Dominance Risk", severity: "Medium", probability: +(15 + rng() * 20).toFixed(0), impact: "Crowding out + higher term premium", description: "Excessive government borrowing crowds out private credit and pushes up yields.", historicalEvent: "India FY24 gross borrowing at ₹15.4 lakh crore — record G-Sec supply pressure" },
  ];
}


// ═══════════════════════════════════════════
// 5. MACRO DRIVERS
// ═══════════════════════════════════════════

export interface BondDriver {
  name: string;
  category: "Macro" | "Central Bank" | "Market" | "Credit" | "Geopolitical" | "Global";
  importance: "Critical" | "High" | "Medium";
  currentState: string;
  impact: "Bullish" | "Bearish" | "Neutral"; // Bullish = yield declining / price up
  description: string;
}

export function generateBondDrivers(symbol: string): BondDriver[] {
  const rng = seededRng(`drv-${symbol}`);
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const impacts: ("Bullish" | "Bearish" | "Neutral")[] = ["Bullish", "Bearish", "Neutral"];
  return [
    { name: "RBI Repo Rate", category: "Central Bank", importance: "Critical", currentState: `${(6 + rng() * 0.75).toFixed(2)}% | ${pick(["On hold", "Easing bias", "Data-dependent"])}`, impact: pick(impacts), description: "RBI's key policy rate directly sets the floor for short-term G-Sec yields." },
    { name: "CPI Inflation", category: "Macro", importance: "Critical", currentState: `${(3.5 + rng() * 3).toFixed(1)}% YoY`, impact: pick(impacts), description: "Inflation above RBI's 4% target forces hawkish response, pushing yields higher." },
    { name: "GDP Growth", category: "Macro", importance: "High", currentState: `${(5.5 + rng() * 2.5).toFixed(1)}% YoY`, impact: pick(impacts), description: "Strong growth supports credit quality but may push yields higher via inflation expectations." },
    { name: "Fiscal Deficit", category: "Macro", importance: "Critical", currentState: `${(4.5 + rng() * 2).toFixed(1)}% of GDP`, impact: pick(impacts), description: "Higher deficits mean more G-Sec supply, pushing yields up (supply-driven pressure)." },
    { name: "G-Sec Supply / Auction Calendar", category: "Market", importance: "Critical", currentState: `₹${(12 + rng() * 6).toFixed(0)} lakh Cr gross borrowing`, impact: pick(impacts), description: "Weekly G-Sec auctions are the primary supply event. Devolved auctions signal weak demand." },
    { name: "FII Bond Flows", category: "Market", importance: "High", currentState: `Net ${rng() > 0.5 ? "inflows" : "outflows"}: ₹${(rng() * 15000).toFixed(0)} Cr MTD`, impact: pick(impacts), description: "Foreign investor flows (especially post JP Morgan GBI-EM inclusion) drive sentiment." },
    { name: "US Treasury Yields", category: "Global", importance: "Critical", currentState: `10Y UST: ${(3.8 + rng() * 1.2).toFixed(2)}%`, impact: pick(impacts), description: "Rising US yields attract capital away from EM bonds, pushing India yields higher." },
    { name: "RBI OMO / LTRO", category: "Central Bank", importance: "High", currentState: pick(["OMO purchases announced", "Liquidity neutral", "Surplus liquidity being absorbed"]), impact: pick(impacts), description: "RBI's open market operations directly affect bond supply/demand and system liquidity." },
    { name: "Oil Prices", category: "Global", importance: "High", currentState: `Brent: $${(65 + rng() * 35).toFixed(0)}/bbl`, impact: pick(impacts), description: "India imports 85%+ of crude oil. Higher oil = higher fiscal deficit = higher yields." },
    { name: "USD/INR", category: "Global", importance: "High", currentState: `₹${(82 + rng() * 6).toFixed(2)}`, impact: pick(impacts), description: "INR depreciation raises import costs, widens CAD, and pressures RBI to tighten." },
    { name: "Bank SLR Demand", category: "Market", importance: "High", currentState: pick(["Strong — banks building SLR buffers", "Moderate — meeting requirements", "Weak — banks reducing bond holdings"]), impact: pick(impacts), description: "Banks hold ~28% SLR (vs 18% requirement). SLR buying is the largest structural demand for G-Secs." },
    { name: "Global Risk Sentiment", category: "Geopolitical", importance: "Medium", currentState: pick(["Risk-on — EM flows positive", "Risk-off — flight to safety", "Mixed — selective EM allocation"]), impact: pick(impacts), description: "Global risk events drive flows between safe-haven bonds and EM debt." },
    { name: "Credit Events / Defaults", category: "Credit", importance: "High", currentState: pick(["No major defaults", "Elevated corporate stress", "Sector-specific concerns"]), impact: pick(impacts), description: "Corporate defaults (like IL&FS 2018) cause contagion across the entire credit market." },
  ];
}


// ═══════════════════════════════════════════
// 6. QUANTITATIVE MODELS
// ═══════════════════════════════════════════

export interface BondQuantModel {
  name: string;
  formula: string;
  interpretation: string;
  institutionalUse: string;
  strengths: string[];
  weaknesses: string[];
}

export const BOND_QUANT_MODELS: BondQuantModel[] = [
  { name: "Modified Duration", formula: "ΔP/P ≈ -D_mod × Δy", interpretation: "Modified duration estimates the percentage price change for a 1% change in yield. A bond with D_mod = 6 will lose ~6% if yields rise 100 bps.", institutionalUse: "Portfolio duration targeting, immunization, hedging, and DV01 risk management.", strengths: ["Simple and intuitive", "Primary risk metric globally", "Easily hedgeable"], weaknesses: ["Linear approximation — fails for large yield moves", "Assumes parallel yield curve shifts", "Ignores convexity for large moves"] },
  { name: "Convexity Adjustment", formula: "ΔP/P ≈ -D_mod × Δy + 0.5 × Convexity × (Δy)²", interpretation: "Convexity captures the curvature of the price-yield relationship. Positive convexity means bonds perform better than duration predicts in both directions.", institutionalUse: "Accurate pricing of large yield moves, option pricing, portfolio construction.", strengths: ["Captures non-linear price behavior", "Always beneficial for bondholders", "Critical for long-duration bonds"], weaknesses: ["Complex calculation", "Convexity premium may be overpriced", "Changes with yield level"] },
  { name: "Nelson-Siegel Yield Curve Model", formula: "y(τ) = β₀ + β₁(1-e^(-τ/λ))/(τ/λ) + β₂((1-e^(-τ/λ))/(τ/λ) - e^(-τ/λ))", interpretation: "Parsimonious 4-parameter model decomposing the yield curve into level (β₀), slope (β₁), and curvature (β₂).", institutionalUse: "Yield curve fitting, interpolation, relative value analysis, central bank curve modeling.", strengths: ["Smooth, well-behaved curves", "Economically interpretable parameters", "Standard at central banks"], weaknesses: ["Cannot fit humped curves well", "Limited flexibility vs. spline models", "Assumes specific functional form"] },
  { name: "Vasicek Interest Rate Model", formula: "dr = κ(θ - r)dt + σdW", interpretation: "Mean-reverting stochastic process where rates are pulled toward long-run mean θ at speed κ.", institutionalUse: "Bond pricing, term structure modeling, interest rate derivative pricing.", strengths: ["Analytically tractable", "Mean reversion is realistic", "Closed-form bond pricing"], weaknesses: ["Allows negative rates (pre-negative rate era, this was a bug)", "Constant volatility", "One-factor model — oversimplified"] },
  { name: "Value at Risk (Bond VaR)", formula: "VaR = Portfolio Value × D_mod × σ_yield × z_α × √t", interpretation: "Maximum expected loss at a given confidence level. A 99% 1-day VaR of ₹5 Cr means 99% chance of losing less than ₹5 Cr.", institutionalUse: "Regulatory capital (Basel III), risk limits, portfolio risk monitoring.", strengths: ["Single risk number", "Regulatory standard", "Comparable across portfolios"], weaknesses: ["Underestimates tail risk", "Assumes normal distribution", "Backward-looking"] },
  { name: "Merton Structural Credit Model", formula: "Equity = Call(Assets, Debt, σ_A, T) where Default occurs when Assets < Debt at maturity", interpretation: "Models a firm's equity as a call option on its assets with strike = face value of debt. Distance to default measures credit risk.", institutionalUse: "Corporate bond pricing, PD estimation, credit rating validation.", strengths: ["Links equity and credit markets", "Theoretically elegant", "Provides PD estimates"], weaknesses: ["Assumes simple capital structure", "Asset value unobservable", "Static maturity assumption"] },
  { name: "Credit Spread Decomposition", formula: "Spread = Default Premium + Liquidity Premium + Term Premium + Risk Premium", interpretation: "Decomposes the total credit spread into its economic components to identify relative value.", institutionalUse: "Relative value analysis, mispricing detection, portfolio allocation.", strengths: ["Identifies cheapness/richness", "Separates systematic vs idiosyncratic", "Actionable trading signal"], weaknesses: ["Components hard to measure precisely", "Model-dependent", "Changes through cycles"] },
];


// ═══════════════════════════════════════════
// 7. DERIVATIVES & HEDGING
// ═══════════════════════════════════════════

export interface BondDerivative {
  name: string;
  type: string;
  description: string;
  institutionalUse: string;
  riskProfile: string;
}

export const BOND_DERIVATIVES: BondDerivative[] = [
  { name: "Interest Rate Swap (IRS)", type: "Swap", description: "Exchange fixed rate payments for floating rate (or vice versa). Most traded fixed income derivative globally.", institutionalUse: "Duration management, ALM hedging, converting floating to fixed exposure. Indian OIS market is MIBOR-based.", riskProfile: "Counterparty risk (mitigated by central clearing). Mark-to-market P&L volatility." },
  { name: "Credit Default Swap (CDS)", type: "Credit Derivative", description: "Insurance against default. Buyer pays premium, seller pays notional amount upon credit event.", institutionalUse: "Hedging credit exposure, speculating on credit quality, extracting market-implied PD.", riskProfile: "Counterparty risk. Jump-to-default risk for sellers. Basis risk vs cash bonds." },
  { name: "Bond Futures (10Y G-Sec Future)", type: "Future", description: "Standardized exchange-traded contract on notional 10Y G-Sec. Traded on NSE in India.", institutionalUse: "Duration hedging, curve trading, basis trading, speculative positioning.", riskProfile: "Margin calls. Delivery risk (CTD bond selection). Basis risk vs cash portfolio." },
  { name: "Overnight Index Swap (OIS)", type: "Swap", description: "Swap of fixed rate vs overnight floating rate (MIBOR in India, SOFR in US).", institutionalUse: "Pricing central bank rate expectations. Money market hedging. Discount curve construction.", riskProfile: "Minimal credit risk (overnight settlement). Rate reset risk." },
  { name: "Swaption", type: "Option", description: "Option to enter an interest rate swap at a specified future date and rate.", institutionalUse: "Hedging callable bond exposure. Expressing views on rate volatility. ALM optimization.", riskProfile: "Premium paid upfront. Theta decay. Vega exposure to rate volatility." },
  { name: "Forward Rate Agreement (FRA)", type: "Forward", description: "OTC contract fixing an interest rate for a future period. Settled based on rate differential.", institutionalUse: "Locking in borrowing/lending rates. Hedging short-term rate exposure.", riskProfile: "Counterparty risk. Settlement based on reference rate fixing." },
];


// ═══════════════════════════════════════════
// 8. AI FEATURES & DATA SOURCES
// ═══════════════════════════════════════════

export interface BondAIFeature {
  name: string;
  icon: string;
  description: string;
  capability: string;
}

export const BOND_AI_FEATURES: BondAIFeature[] = [
  { name: "AI Yield Forecasting", icon: "📈", description: "ML models predicting yield movements using macro data, central bank signals, and market microstructure.", capability: "1D/1W/1M yield forecasts with confidence intervals for all G-Sec tenors." },
  { name: "Credit Default Prediction", icon: "⚠️", description: "AI system monitoring corporate health indicators to predict defaults 6-12 months ahead.", capability: "Default probability scoring for all rated Indian corporates with sector-level contagion mapping." },
  { name: "Bond Mispricing Detection", icon: "💡", description: "Relative value engine identifying bonds trading cheap/rich vs fair value models.", capability: "Real-time Z-score alerts for spread mispricing across the G-Sec and corporate curve." },
  { name: "Yield Curve AI Model", icon: "📊", description: "Neural network fitting and forecasting the entire yield curve dynamics.", capability: "Nelson-Siegel parameter forecasting, curve shape prediction, butterfly trade identification." },
  { name: "Central Bank Speech Analyzer", icon: "🏛️", description: "NLP parsing of RBI governor speeches, minutes, and policy statements.", capability: "Hawkish/dovish scoring, policy surprise detection, rate path probability extraction." },
  { name: "Sovereign Crisis Early Warning", icon: "🚨", description: "Multi-factor model monitoring fiscal, monetary, and external vulnerability indicators.", capability: "Country-level risk scoring with 6-month forward-looking crisis probability." },
  { name: "AI Duration Optimizer", icon: "⚡", description: "Portfolio duration optimization engine balancing return, risk, and liability matching.", capability: "Optimal duration positioning based on macro regime, carry, and rolldown analysis." },
  { name: "Macro Regime Detector", icon: "🔄", description: "Regime switching model classifying current macro environment for bond strategy selection.", capability: "Real-time regime classification: tightening, easing, crisis, goldilocks, stagflation." },
];

export interface BondDataSource {
  name: string;
  category: "Premium" | "Free" | "Institutional";
  coverage: string;
  cost: string;
}

export const BOND_DATA_SOURCES: BondDataSource[] = [
  { name: "Bloomberg Terminal", category: "Institutional", coverage: "Full global fixed income: pricing, analytics, news, research.", cost: "$24,000/yr" },
  { name: "CCIL (India)", category: "Free", coverage: "Indian G-Sec trading data, repo rates, auction results.", cost: "Free" },
  { name: "RBI Weekly Statistical Supplement", category: "Free", coverage: "G-Sec yields, money market rates, forex reserves.", cost: "Free" },
  { name: "FRED (St. Louis Fed)", category: "Free", coverage: "US Treasury yields, SOFR, macro data, historical series.", cost: "Free" },
  { name: "TRACE (FINRA)", category: "Premium", coverage: "US corporate bond trade prices (post-trade transparency).", cost: "Varies" },
  { name: "ICE Data Services", category: "Institutional", coverage: "Bond pricing, indices, reference data. ICE BofA indices.", cost: "$10-50K/yr" },
  { name: "Refinitiv Eikon", category: "Institutional", coverage: "Fixed income pricing, curves, analytics, news.", cost: "$22,000/yr" },
  { name: "S&P Global / Moody's / Fitch", category: "Premium", coverage: "Credit ratings, research, default studies, transition matrices.", cost: "$5-50K/yr" },
  { name: "BIS Statistics", category: "Free", coverage: "Global debt securities, central bank policy rates, credit-to-GDP.", cost: "Free" },
  { name: "TradingEconomics", category: "Premium", coverage: "Government bond yields for 50+ countries, macro indicators.", cost: "$39-499/mo" },
];


// ═══════════════════════════════════════════
// 9. SPARKLINE GENERATOR
// ═══════════════════════════════════════════

export function generateBondSparkline(symbol: string, points: number = 30): number[] {
  const rng = seededRng(`bspark-${symbol}`);
  const data: number[] = [];
  let val = 40 + rng() * 30;
  for (let i = 0; i < points; i++) {
    val += (rng() - 0.48) * 2.5;
    val = Math.max(10, Math.min(90, val));
    data.push(+val.toFixed(2));
  }
  return data;
}


// ═══════════════════════════════════════════
// 10. GLOBAL BOND MARKETS
// ═══════════════════════════════════════════

export interface GlobalBondMarket {
  country: string;
  flag: string;
  benchmark: string;
  yield10y: number;
  change1d: number;
  change1m: number;
  debtToGdp: number;
  rating: string;
  centralBank: string;
  policyRate: number;
}

export function getGlobalBondMarkets(): GlobalBondMarket[] {
  const rng = seededRng("global-bonds");
  return [
    { country: "United States", flag: "🇺🇸", benchmark: "10Y UST", yield10y: +(4.1 + rng() * 0.8).toFixed(2), change1d: +(rng() * 0.08 - 0.04).toFixed(2), change1m: +(rng() * 0.4 - 0.2).toFixed(2), debtToGdp: 124, rating: "AA+", centralBank: "Federal Reserve", policyRate: +(4.75 + rng() * 0.75).toFixed(2) },
    { country: "India", flag: "🇮🇳", benchmark: "10Y G-Sec", yield10y: +(6.9 + rng() * 0.4).toFixed(2), change1d: +(rng() * 0.06 - 0.03).toFixed(2), change1m: +(rng() * 0.3 - 0.15).toFixed(2), debtToGdp: 83, rating: "BBB-", centralBank: "RBI", policyRate: +(6.25 + rng() * 0.5).toFixed(2) },
    { country: "Germany", flag: "🇩🇪", benchmark: "10Y Bund", yield10y: +(2.2 + rng() * 0.6).toFixed(2), change1d: +(rng() * 0.06 - 0.03).toFixed(2), change1m: +(rng() * 0.3 - 0.15).toFixed(2), debtToGdp: 66, rating: "AAA", centralBank: "ECB", policyRate: +(3.5 + rng() * 0.5).toFixed(2) },
    { country: "United Kingdom", flag: "🇬🇧", benchmark: "10Y Gilt", yield10y: +(4.0 + rng() * 0.6).toFixed(2), change1d: +(rng() * 0.08 - 0.04).toFixed(2), change1m: +(rng() * 0.35 - 0.18).toFixed(2), debtToGdp: 101, rating: "AA", centralBank: "BoE", policyRate: +(4.5 + rng() * 0.5).toFixed(2) },
    { country: "Japan", flag: "🇯🇵", benchmark: "10Y JGB", yield10y: +(0.8 + rng() * 0.5).toFixed(2), change1d: +(rng() * 0.04 - 0.02).toFixed(2), change1m: +(rng() * 0.15 - 0.08).toFixed(2), debtToGdp: 264, rating: "A+", centralBank: "BoJ", policyRate: +(0.1 + rng() * 0.4).toFixed(2) },
    { country: "China", flag: "🇨🇳", benchmark: "10Y CGB", yield10y: +(2.3 + rng() * 0.5).toFixed(2), change1d: +(rng() * 0.04 - 0.02).toFixed(2), change1m: +(rng() * 0.2 - 0.1).toFixed(2), debtToGdp: 77, rating: "A+", centralBank: "PBoC", policyRate: +(3.3 + rng() * 0.4).toFixed(2) },
    { country: "Brazil", flag: "🇧🇷", benchmark: "10Y NTN-B", yield10y: +(11 + rng() * 2).toFixed(2), change1d: +(rng() * 0.12 - 0.06).toFixed(2), change1m: +(rng() * 0.5 - 0.25).toFixed(2), debtToGdp: 88, rating: "BB", centralBank: "BCB", policyRate: +(11 + rng() * 2).toFixed(2) },
    { country: "South Africa", flag: "🇿🇦", benchmark: "10Y SA Gov", yield10y: +(9.5 + rng() * 1.5).toFixed(2), change1d: +(rng() * 0.1 - 0.05).toFixed(2), change1m: +(rng() * 0.4 - 0.2).toFixed(2), debtToGdp: 73, rating: "BB-", centralBank: "SARB", policyRate: +(7.5 + rng() * 1).toFixed(2) },
  ];
}
