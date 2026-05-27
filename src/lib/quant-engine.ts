// src/lib/quant-engine.ts
// Quantitative Analysis Engine for Derivatives Agent — v2.0
// GEX · Delta Exposure · Options Strategy Engine · VaR · Stress Testing · IV Regime · Smart Money

/* ─── Seeded Random for Deterministic Simulations ─── */
export function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/* ════════════════════════════════════════════════════════════════
   MARKET REGIME DETECTION
   ════════════════════════════════════════════════════════════════ */
export type MarketRegime =
  | "BULL_MARKET"
  | "BEAR_MARKET"
  | "SIDEWAYS"
  | "PANIC"
  | "HIGH_VOLATILITY"
  | "ACCUMULATION"
  | "DISTRIBUTION"
  | "GAMMA_SQUEEZE"
  | "VOL_CRUSH";

export interface RegimeSignals {
  regime: MarketRegime;
  confidence: number;
  description: string;
  beginnerDescription: string;
  color: string;
  icon: string;
}

export function detectMarketRegime(data: {
  spotChange: number;
  ivLevel: number;
  pcrRatio: number;
  oiTrend: number;
  volumeRatio: number;
  gex?: number;
}): RegimeSignals {
  const { spotChange, ivLevel, pcrRatio, oiTrend, volumeRatio, gex } = data;

  // Gamma Squeeze: extreme GEX negative + price surging
  if (gex && gex < -500 && spotChange > 1.5) {
    return {
      regime: "GAMMA_SQUEEZE", confidence: 88, icon: "🚀",
      description: "Dealer short gamma driving self-reinforcing rally. Delta hedging creating positive feedback loop. GEX deeply negative.",
      beginnerDescription: "A chain reaction is happening! Market makers are being forced to buy more and more as prices rise, pushing prices even higher. This is like a snowball rolling downhill — it accelerates on its own.",
      color: "#ff6f00",
    };
  }
  // Vol Crush: IV very high but dropping, price stabilizing
  if (ivLevel > 25 && Math.abs(spotChange) < 0.3 && volumeRatio < 0.8) {
    return {
      regime: "VOL_CRUSH", confidence: 72, icon: "🧊",
      description: "Implied volatility compressing. Premium sellers benefiting. Straddle/strangle writers in profit zone.",
      beginnerDescription: "The market was very nervous, but now it's calming down. Option prices are getting cheaper because the expected big move isn't happening. If you bought options, they're losing value. If you sold options, you're making money.",
      color: "#00897b",
    };
  }
  // Panic
  if (ivLevel > 30 && spotChange < -1.5 && volumeRatio > 1.8) {
    return {
      regime: "PANIC", confidence: 85, icon: "🔴",
      description: "Extreme fear detected. IV spiking with heavy selling pressure. Put buying surging.",
      beginnerDescription: "The market is in panic mode! Everyone is rushing to protect their investments by buying insurance (put options). Prices are falling sharply and fear is at extreme levels. This is like a fire sale — experienced traders often find opportunities here.",
      color: "#b71c1c",
    };
  }
  // High Volatility
  if (ivLevel > 25 && Math.abs(spotChange) > 1) {
    return {
      regime: "HIGH_VOLATILITY", confidence: 70, icon: "⚡",
      description: "Elevated volatility with large price swings. Hedging activity increasing.",
      beginnerDescription: "The market is swinging wildly in both directions. It's like stormy weather — there's a lot of energy and uncertainty. Option prices are expensive because everyone expects big moves to continue.",
      color: "#e65100",
    };
  }
  // Bull Market
  if (spotChange > 0.5 && oiTrend > 0 && ivLevel < 20) {
    return {
      regime: "BULL_MARKET", confidence: 75, icon: "🟢",
      description: "Sustained uptrend with institutional accumulation. Low fear environment.",
      beginnerDescription: "The market is in a happy, upward trend! Big investors are buying and fear is low. It's like a sunny day — everyone's optimistic. Options that bet on prices going higher (calls) are doing well.",
      color: "#1b5e20",
    };
  }
  // Bear Market
  if (spotChange < -0.5 && pcrRatio > 1.2) {
    return {
      regime: "BEAR_MARKET", confidence: 72, icon: "🔻",
      description: "Downtrend confirmed by put accumulation. Risk-off sentiment dominant.",
      beginnerDescription: "The market is heading down and big institutions are buying protection (puts). It's like people putting up umbrellas before a storm — they expect more rain. Defensive strategies work best here.",
      color: "#c62828",
    };
  }
  // Accumulation
  if (ivLevel < 15 && oiTrend > 0 && Math.abs(spotChange) < 0.3 && volumeRatio < 0.8) {
    return {
      regime: "ACCUMULATION", confidence: 65, icon: "🔍",
      description: "Quiet accumulation phase. Smart money building positions in low volatility.",
      beginnerDescription: "The market looks boring on the surface, but smart money is quietly building positions underneath. It's like a coiled spring — the calm usually comes before a big move. Option premiums are cheap right now.",
      color: "#1565c0",
    };
  }
  // Distribution
  if (oiTrend < 0 && volumeRatio > 1.3 && Math.abs(spotChange) < 0.5) {
    return {
      regime: "DISTRIBUTION", confidence: 68, icon: "📤",
      description: "Distribution detected. Institutions offloading positions despite stable prices.",
      beginnerDescription: "Big institutions are quietly selling their positions even though prices look stable. It's like people leaving a party one by one — the party isn't over yet, but the smart ones know it's winding down.",
      color: "#6a1b9a",
    };
  }
  // Sideways
  return {
    regime: "SIDEWAYS", confidence: 55, icon: "➡️",
    description: "Range-bound market. No clear directional conviction from institutional flows.",
    beginnerDescription: "The market is moving sideways like a car stuck in traffic. No clear direction. Option sellers love this because they collect premium while prices go nowhere. Buyers of options lose value daily in this regime.",
    color: "#546e7a",
  };
}

/* ════════════════════════════════════════════════════════════════
   POSITIONING PATTERN DETECTION
   ════════════════════════════════════════════════════════════════ */
export type PositionPattern = "LONG_BUILDUP" | "SHORT_BUILDUP" | "LONG_UNWINDING" | "SHORT_COVERING";

export interface PositionSignal {
  pattern: PositionPattern;
  label: string;
  description: string;
  beginnerDescription: string;
  color: string;
  strength: number;
  icon: string;
}

export function detectPositioning(data: {
  priceChange: number;
  oiChange: number;
}): PositionSignal {
  const { priceChange, oiChange } = data;

  if (priceChange > 0 && oiChange > 0) {
    return {
      pattern: "LONG_BUILDUP", label: "Long Build-up", icon: "📈",
      description: "Price rising + OI increasing = Fresh longs being created. Bullish signal.",
      beginnerDescription: "New buyers are entering the market AND prices are going up — this is the strongest bullish signal. Think of it like a restaurant that's both getting more popular AND raising prices. People really want in!",
      color: "#1b5e20",
      strength: Math.min(95, Math.abs(priceChange * 20) + Math.abs(oiChange * 0.001)),
    };
  }
  if (priceChange < 0 && oiChange > 0) {
    return {
      pattern: "SHORT_BUILDUP", label: "Short Build-up", icon: "📉",
      description: "Price falling + OI increasing = Fresh shorts being added. Bearish signal.",
      beginnerDescription: "New traders are betting prices will fall AND prices are actually falling — this is the strongest bearish signal. It's like more and more people betting against a team that's already losing.",
      color: "#b71c1c",
      strength: Math.min(95, Math.abs(priceChange * 20) + Math.abs(oiChange * 0.001)),
    };
  }
  if (priceChange < 0 && oiChange < 0) {
    return {
      pattern: "LONG_UNWINDING", label: "Long Unwinding", icon: "🔄",
      description: "Price falling + OI decreasing = Longs exiting positions. Weak bearish.",
      beginnerDescription: "People who bought earlier are now selling and leaving. The price is dropping because buyers are giving up, not because new sellers are attacking. Less aggressive than a short build-up.",
      color: "#e65100",
      strength: Math.min(90, Math.abs(priceChange * 15) + Math.abs(oiChange * 0.001)),
    };
  }
  return {
    pattern: "SHORT_COVERING", label: "Short Covering", icon: "🔃",
    description: "Price rising + OI decreasing = Shorts covering positions. Could accelerate upward.",
    beginnerDescription: "Traders who bet on prices falling are now buying back to close their bets because prices went up. This buying pushes prices even higher — like a domino effect. Can cause explosive short-term rallies!",
    color: "#2e7d32",
    strength: Math.min(90, Math.abs(priceChange * 15) + Math.abs(oiChange * 0.001)),
  };
}

/* ════════════════════════════════════════════════════════════════
   GEX (GAMMA EXPOSURE) ENGINE
   ════════════════════════════════════════════════════════════════ */
export interface GEXData {
  totalGEX: number;
  gexByStrike: { strike: number; gex: number; netGamma: number }[];
  flipZone: number;
  gammaWallStrike: number;
  dealerPositioning: "LONG_GAMMA" | "SHORT_GAMMA" | "NEUTRAL";
  dealerDescription: string;
  beginnerExplanation: string;
  gammaSqueezeProbability: number;
  volCrushProbability: number;
  expectedPinning: number;
  deltaExposure: number;
}

export function calculateGEX(chain: {
  strike: number;
  callOI: number;
  putOI: number;
  callVol: number;
  putVol: number;
}[], spotPrice: number, tick: number): GEXData {
  const rng = seededRng(tick + 777);

  // GEX per strike = (Call OI × Call Gamma - Put OI × Put Gamma) × Spot² × 0.01
  // We approximate gamma using distance from ATM
  const gexByStrike = chain.map(row => {
    const dist = Math.abs(row.strike - spotPrice) / spotPrice;
    const gammaApprox = Math.exp(-dist * dist * 500) * 0.001; // near ATM = higher gamma
    const callGamma = row.callOI * gammaApprox;
    const putGamma = row.putOI * gammaApprox;
    const netGamma = callGamma - putGamma; // dealers are short calls, long puts at the money
    const gex = netGamma * spotPrice * spotPrice * 0.01 / 1e6; // in millions
    return { strike: row.strike, gex: +gex.toFixed(2), netGamma: +netGamma.toFixed(0) };
  });

  const totalGEX = +gexByStrike.reduce((s, r) => s + r.gex, 0).toFixed(2);

  // Flip zone: strike where GEX changes sign
  let flipZone = spotPrice;
  for (let i = 1; i < gexByStrike.length; i++) {
    if (gexByStrike[i - 1].gex <= 0 && gexByStrike[i].gex > 0) {
      flipZone = gexByStrike[i].strike;
      break;
    }
  }

  // Gamma wall: strike with highest absolute GEX
  const gammaWallStrike = gexByStrike.reduce((best, r) =>
    Math.abs(r.gex) > Math.abs(best.gex) ? r : best, gexByStrike[0]).strike;

  // Dealer positioning
  const dealerPositioning: GEXData["dealerPositioning"] =
    totalGEX > 200 ? "LONG_GAMMA" : totalGEX < -200 ? "SHORT_GAMMA" : "NEUTRAL";

  const dealerDesc: Record<string, string> = {
    LONG_GAMMA: "Dealers are long gamma — they sell rallies and buy dips, suppressing volatility. Market likely to stay range-bound near gamma wall. Straddle sellers benefit.",
    SHORT_GAMMA: "Dealers are short gamma — they buy rallies and sell dips, AMPLIFYING moves. Any directional trigger could cause an outsized move. This is the environment where gamma squeezes happen.",
    NEUTRAL: "Dealer gamma exposure is balanced. Neither amplifying nor dampening moves. Normal market dynamics apply.",
  };

  const beginnerDesc: Record<string, string> = {
    LONG_GAMMA: "Imagine market makers acting like shock absorbers on a car — they smooth out the bumps. When they have 'long gamma,' every time prices move, they trade in a way that pushes prices BACK. This keeps the market calm and rangebound. Selling options (collecting rent) works well here.",
    SHORT_GAMMA: "Now imagine the shock absorbers are REVERSED — instead of smoothing bumps, they make them bigger! When market makers have 'short gamma,' their hedging actually amplifies price moves. A small push becomes a big move. This is when gamma squeezes and crashes happen. Dangerous but also where the biggest opportunities are.",
    NEUTRAL: "Market makers are neutral — they're neither calming the market nor amplifying it. Normal market forces are in control. Think of it as driving on a regular road — not super smooth, not super bumpy.",
  };

  // Gamma squeeze probability
  let gammaSqueezeProbability = 5;
  if (dealerPositioning === "SHORT_GAMMA") gammaSqueezeProbability += 25;
  if (totalGEX < -500) gammaSqueezeProbability += 15;
  gammaSqueezeProbability += (rng() - 0.5) * 8;
  gammaSqueezeProbability = Math.max(1, Math.min(85, Math.round(gammaSqueezeProbability)));

  // Vol crush probability (inverse — high when dealers are long gamma)
  let volCrushProbability = 15;
  if (dealerPositioning === "LONG_GAMMA") volCrushProbability += 30;
  if (totalGEX > 500) volCrushProbability += 20;
  volCrushProbability += (rng() - 0.5) * 8;
  volCrushProbability = Math.max(1, Math.min(85, Math.round(volCrushProbability)));

  // Expected pinning zone
  const expectedPinning = gammaWallStrike;

  // Delta exposure = net directional exposure
  const deltaExposure = chain.reduce((s, r) => {
    const delta = Math.max(0, 1 - Math.abs(r.strike - spotPrice) / spotPrice / 0.05);
    return s + (r.callOI * delta - r.putOI * delta) * spotPrice * 0.01;
  }, 0);

  return {
    totalGEX,
    gexByStrike,
    flipZone,
    gammaWallStrike,
    dealerPositioning,
    dealerDescription: dealerDesc[dealerPositioning],
    beginnerExplanation: beginnerDesc[dealerPositioning],
    gammaSqueezeProbability,
    volCrushProbability,
    expectedPinning,
    deltaExposure: +(deltaExposure / 1e6).toFixed(2),
  };
}

/* ════════════════════════════════════════════════════════════════
   IV REGIME & SKEW ANALYSIS
   ════════════════════════════════════════════════════════════════ */
export type IVRegime = "LOW_VOL" | "NORMAL_VOL" | "HIGH_VOL" | "EXTREME_VOL" | "VOL_CRUSH" | "VOL_EXPANSION";

export interface VolatilityIntelligence {
  ivRegime: IVRegime;
  ivRegimeLabel: string;
  ivRegimeColor: string;
  ivPercentile: number;
  ivRank: number;
  currentIV: number;
  historicalIV: number;
  ivPremium: number; // IV - HV = premium
  skewIndex: number; // put IV / call IV ratio, >1 = fear
  skewInterpretation: string;
  termStructure: "CONTANGO" | "BACKWARDATION" | "FLAT";
  termStructureDescription: string;
  volOfVol: number; // how much IV itself is moving
  probabilityCone: {
    days: number;
    upper1SD: number;
    lower1SD: number;
    upper2SD: number;
    lower2SD: number;
  }[];
  expectedMove: { daily: number; weekly: number; monthly: number };
  beginnerSummary: string;
}

export function calculateVolatilityIntelligence(data: {
  atmIV: number;
  ivPercentile: number;
  spotPrice: number;
  tick: number;
}): VolatilityIntelligence {
  const { atmIV, ivPercentile, spotPrice, tick } = data;
  const rng = seededRng(tick + 999);

  // IV Regime classification
  let ivRegime: IVRegime;
  let ivRegimeLabel: string;
  let ivRegimeColor: string;

  if (ivPercentile < 15) {
    ivRegime = "LOW_VOL";
    ivRegimeLabel = "Low Volatility Environment";
    ivRegimeColor = "#1565c0";
  } else if (ivPercentile < 40) {
    ivRegime = "NORMAL_VOL";
    ivRegimeLabel = "Normal Volatility";
    ivRegimeColor = "#2e7d32";
  } else if (ivPercentile < 70) {
    ivRegime = "VOL_EXPANSION";
    ivRegimeLabel = "Volatility Expanding";
    ivRegimeColor = "#e65100";
  } else if (ivPercentile < 85) {
    ivRegime = "HIGH_VOL";
    ivRegimeLabel = "High Volatility Alert";
    ivRegimeColor = "#c62828";
  } else {
    ivRegime = "EXTREME_VOL";
    ivRegimeLabel = "Extreme Volatility — Rare Event";
    ivRegimeColor = "#b71c1c";
  }

  const historicalIV = +(atmIV * (0.7 + rng() * 0.3)).toFixed(1);
  const ivPremium = +(atmIV - historicalIV).toFixed(1);
  const ivRank = Math.round(ivPercentile * (0.85 + rng() * 0.3));

  // Skew analysis
  const skewIndex = +(0.85 + rng() * 0.45).toFixed(2);
  let skewInterpretation: string;
  if (skewIndex > 1.15) {
    skewInterpretation = "Heavy put skew — market pricing in significant downside risk. Institutional hedging demand very high. Put spreads are expensive relative to call spreads.";
  } else if (skewIndex > 1.05) {
    skewInterpretation = "Moderate put skew — normal institutional hedging. Slightly more demand for downside protection than upside participation.";
  } else if (skewIndex > 0.95) {
    skewInterpretation = "Balanced skew — equal demand for calls and puts. Market has no extreme fear or greed embedded in option pricing.";
  } else {
    skewInterpretation = "Call skew — unusual. Market pricing in upside moves more than downside. Often seen before strong rallies or gamma squeezes.";
  }

  // Term structure
  const termStructureVal = rng();
  const termStructure = termStructureVal > 0.6 ? "CONTANGO" as const : termStructureVal > 0.3 ? "FLAT" as const : "BACKWARDATION" as const;
  const termStructureDesc: Record<string, string> = {
    CONTANGO: "Near-term IV < far-term IV. Normal market. Longer-dated options are pricier because more time = more uncertainty. Calendar spreads (sell near, buy far) may struggle.",
    BACKWARDATION: "Near-term IV > far-term IV. UNUSUAL — indicates an imminent event (earnings, expiry, news). The market is pricing a big move NOW rather than later. Often precedes sharp moves.",
    FLAT: "Term structure is flat — near and far-term IV similar. Transition period. Market is uncertain about timing of next big move.",
  };

  // Vol of vol
  const volOfVol = +(3 + rng() * 12).toFixed(1);

  // Probability cones
  const dailyVol = atmIV / Math.sqrt(252) / 100;
  const probabilityCone = [1, 3, 5, 7, 14, 21, 30].map(days => {
    const move = spotPrice * dailyVol * Math.sqrt(days);
    return {
      days,
      upper1SD: +(spotPrice + move).toFixed(0),
      lower1SD: +(spotPrice - move).toFixed(0),
      upper2SD: +(spotPrice + move * 2).toFixed(0),
      lower2SD: +(spotPrice - move * 2).toFixed(0),
    };
  });

  // Expected moves
  const expectedMove = {
    daily: +(spotPrice * dailyVol).toFixed(0),
    weekly: +(spotPrice * dailyVol * Math.sqrt(5)).toFixed(0),
    monthly: +(spotPrice * dailyVol * Math.sqrt(21)).toFixed(0),
  };

  // Beginner summary
  const beginnerSummary = ivPercentile > 70
    ? `Volatility is very high right now (${ivPercentile}th percentile). Options are EXPENSIVE. If you think the market will calm down, selling options could be profitable. But if a big event is coming, high volatility might be justified. The market expects a daily move of about ±${expectedMove.daily} points.`
    : ivPercentile < 30
    ? `Volatility is very low right now (${ivPercentile}th percentile). Options are CHEAP — like buying insurance when no one expects a disaster. If you think a big move is coming, buying options now gives you the best bang for your buck. Expected daily move is only about ±${expectedMove.daily} points.`
    : `Volatility is at normal levels (${ivPercentile}th percentile). Options are fairly priced. No extreme edge for buyers or sellers. Focus on your directional view rather than volatility bets. Expected daily move is about ±${expectedMove.daily} points.`;

  return {
    ivRegime, ivRegimeLabel, ivRegimeColor, ivPercentile, ivRank,
    currentIV: atmIV, historicalIV, ivPremium,
    skewIndex, skewInterpretation,
    termStructure, termStructureDescription: termStructureDesc[termStructure],
    volOfVol, probabilityCone, expectedMove,
    beginnerSummary,
  };
}

/* ════════════════════════════════════════════════════════════════
   AI OPTIONS STRATEGY ENGINE
   ════════════════════════════════════════════════════════════════ */
export interface OptionsStrategy {
  name: string;
  type: "BULLISH" | "BEARISH" | "NEUTRAL" | "VOLATILITY";
  legs: { action: "BUY" | "SELL"; type: "CALL" | "PUT"; strike: number; premium: number }[];
  maxProfit: string;
  maxLoss: string;
  breakeven: string;
  winProbability: number;
  riskReward: string;
  idealFor: string;
  beginnerExplanation: string;
  confidence: number;
  icon: string;
}

export function generateOptionsStrategies(data: {
  spotPrice: number;
  atmIV: number;
  ivPercentile: number;
  pcr: number;
  regime: MarketRegime;
  probabilities: ProbabilitySet;
  tick: number;
}): OptionsStrategy[] {
  const { spotPrice, atmIV, ivPercentile, pcr, regime, probabilities, tick } = data;
  const rng = seededRng(tick + 555);
  const strategies: OptionsStrategy[] = [];
  const gap = spotPrice > 40000 ? 100 : 50;
  const atmStrike = Math.round(spotPrice / gap) * gap;
  const premiumBase = spotPrice * (atmIV / 100) * Math.sqrt(7 / 365);

  // Strategy 1: Based on regime
  if (regime === "BULL_MARKET" || regime === "ACCUMULATION" || probabilities.bullish > 60) {
    strategies.push({
      name: "Bull Call Spread", type: "BULLISH", icon: "🐂",
      legs: [
        { action: "BUY", type: "CALL", strike: atmStrike, premium: +(premiumBase * 0.8).toFixed(0) },
        { action: "SELL", type: "CALL", strike: atmStrike + gap * 4, premium: +(premiumBase * 0.25).toFixed(0) },
      ],
      maxProfit: `₹${(gap * 4 - premiumBase * 0.55).toFixed(0)} per lot`,
      maxLoss: `₹${(premiumBase * 0.55).toFixed(0)} per lot (limited)`,
      breakeven: `${(atmStrike + premiumBase * 0.55).toFixed(0)}`,
      winProbability: Math.round(45 + rng() * 15),
      riskReward: `1:${((gap * 4) / (premiumBase * 0.55) - 1).toFixed(1)}`,
      idealFor: "Moderately bullish view with limited risk. Best when you expect a move up but want to cap your cost.",
      beginnerExplanation: "You're buying the right to profit if the stock goes up, while selling a higher-level right to reduce your cost. Think of it like buying a discount coupon for upside — you give up unlimited profit potential but pay much less. Your maximum loss is just what you paid upfront.",
      confidence: Math.round(60 + rng() * 20),
    });
  }

  if (regime === "BEAR_MARKET" || probabilities.bearish > 60) {
    strategies.push({
      name: "Bear Put Spread", type: "BEARISH", icon: "🐻",
      legs: [
        { action: "BUY", type: "PUT", strike: atmStrike, premium: +(premiumBase * 0.75).toFixed(0) },
        { action: "SELL", type: "PUT", strike: atmStrike - gap * 4, premium: +(premiumBase * 0.2).toFixed(0) },
      ],
      maxProfit: `₹${(gap * 4 - premiumBase * 0.55).toFixed(0)} per lot`,
      maxLoss: `₹${(premiumBase * 0.55).toFixed(0)} per lot (limited)`,
      breakeven: `${(atmStrike - premiumBase * 0.55).toFixed(0)}`,
      winProbability: Math.round(42 + rng() * 15),
      riskReward: `1:${((gap * 4) / (premiumBase * 0.55) - 1).toFixed(1)}`,
      idealFor: "Bearish view with controlled risk. Better than buying naked puts because it's cheaper.",
      beginnerExplanation: "You're betting the price will drop, but you've put a safety net under your bet. You buy downside protection and sell a cheaper version further down. Your max loss is locked — you can't lose more than what you paid. If the market drops, you profit up to a point.",
      confidence: Math.round(55 + rng() * 20),
    });
  }

  // Iron Condor — best in sideways/low vol
  if (regime === "SIDEWAYS" || regime === "VOL_CRUSH" || ivPercentile > 60) {
    const width = gap * 3;
    strategies.push({
      name: "Iron Condor", type: "NEUTRAL", icon: "🦅",
      legs: [
        { action: "SELL", type: "PUT", strike: atmStrike - width, premium: +(premiumBase * 0.2).toFixed(0) },
        { action: "BUY", type: "PUT", strike: atmStrike - width - gap * 2, premium: +(premiumBase * 0.08).toFixed(0) },
        { action: "SELL", type: "CALL", strike: atmStrike + width, premium: +(premiumBase * 0.2).toFixed(0) },
        { action: "BUY", type: "CALL", strike: atmStrike + width + gap * 2, premium: +(premiumBase * 0.08).toFixed(0) },
      ],
      maxProfit: `₹${(premiumBase * 0.24).toFixed(0)} per lot (premium collected)`,
      maxLoss: `₹${(gap * 2 - premiumBase * 0.24).toFixed(0)} per lot`,
      breakeven: `${(atmStrike - width - premiumBase * 0.12).toFixed(0)} / ${(atmStrike + width + premiumBase * 0.12).toFixed(0)}`,
      winProbability: Math.round(62 + rng() * 12),
      riskReward: `${((gap * 2) / (premiumBase * 0.24)).toFixed(1)}:1 risk, but high win rate`,
      idealFor: "Sideways markets with high IV. You profit when the market stays within a range. Best strategy when you expect NOTHING exciting to happen.",
      beginnerExplanation: "Imagine you're an insurance company. You're collecting premiums from both sides — people who fear the market going up too much AND people who fear it going down too much. As long as the market stays in a range (which it does ~65% of the time), you keep ALL the premium. It's like collecting rent!",
      confidence: Math.round(65 + rng() * 15),
    });
  }

  // Straddle — best in low IV expecting big move
  if (ivPercentile < 30 || regime === "ACCUMULATION" || probabilities.volatilityBreakout > 50) {
    strategies.push({
      name: "Long Straddle", type: "VOLATILITY", icon: "🎯",
      legs: [
        { action: "BUY", type: "CALL", strike: atmStrike, premium: +(premiumBase * 0.8).toFixed(0) },
        { action: "BUY", type: "PUT", strike: atmStrike, premium: +(premiumBase * 0.75).toFixed(0) },
      ],
      maxProfit: "Unlimited (in either direction)",
      maxLoss: `₹${(premiumBase * 1.55).toFixed(0)} per lot (total premium paid)`,
      breakeven: `${(atmStrike - premiumBase * 1.55).toFixed(0)} / ${(atmStrike + premiumBase * 1.55).toFixed(0)}`,
      winProbability: Math.round(30 + rng() * 15),
      riskReward: "Potentially unlimited reward for defined risk",
      idealFor: "When you expect a BIG move but don't know which direction. Best before earnings, budget, RBI policy, or any major event. Requires IV to be low (cheap entry).",
      beginnerExplanation: "You're betting that something BIG will happen, but you don't care which direction! You buy both an 'up bet' (call) and a 'down bet' (put) at the same price. If the market makes a huge move in either direction, one of your bets pays off big. If nothing happens, you lose both premiums. It's like buying tickets to both teams in a final — you want an exciting match, not a draw!",
      confidence: Math.round(50 + rng() * 20),
    });
  }

  // Jade Lizard — when vol is high, bullish lean
  if (ivPercentile > 50 && probabilities.bullish > 45) {
    strategies.push({
      name: "Jade Lizard", type: "BULLISH", icon: "🦎",
      legs: [
        { action: "SELL", type: "PUT", strike: atmStrike - gap * 2, premium: +(premiumBase * 0.35).toFixed(0) },
        { action: "SELL", type: "CALL", strike: atmStrike + gap * 3, premium: +(premiumBase * 0.18).toFixed(0) },
        { action: "BUY", type: "CALL", strike: atmStrike + gap * 5, premium: +(premiumBase * 0.06).toFixed(0) },
      ],
      maxProfit: `₹${(premiumBase * 0.47).toFixed(0)} per lot (total credit)`,
      maxLoss: `Downside: ₹${(atmStrike - gap * 2).toFixed(0)} assignment risk | Upside: ₹${(gap * 2 - premiumBase * 0.47).toFixed(0)}`,
      breakeven: `${(atmStrike - gap * 2 - premiumBase * 0.47).toFixed(0)}`,
      winProbability: Math.round(60 + rng() * 12),
      riskReward: "High win rate, defined upside risk, open downside risk",
      idealFor: "High IV environment with slight bullish bias. Collect rich premiums with NO upside risk (total credit > call spread width). Requires margin.",
      beginnerExplanation: "An advanced strategy where you collect premium from selling options on both sides, but structure it so you have ZERO risk if the market goes up! The trick is that the total premium you collect is more than the width of your call spread. If the market stays flat or goes up, you win. Only risk is a big drop.",
      confidence: Math.round(55 + rng() * 15),
    });
  }

  // Always ensure at least 2 strategies
  if (strategies.length < 2) {
    strategies.push({
      name: "Covered Call (Synthetic)", type: "NEUTRAL", icon: "🛡️",
      legs: [
        { action: "BUY", type: "CALL", strike: atmStrike, premium: +(premiumBase * 0.8).toFixed(0) },
        { action: "SELL", type: "CALL", strike: atmStrike + gap * 3, premium: +(premiumBase * 0.25).toFixed(0) },
      ],
      maxProfit: `₹${(gap * 3 + premiumBase * 0.25 - premiumBase * 0.8).toFixed(0)} per lot`,
      maxLoss: `₹${(premiumBase * 0.55).toFixed(0)} per lot`,
      breakeven: `${(atmStrike + premiumBase * 0.55).toFixed(0)}`,
      winProbability: Math.round(50 + rng() * 15),
      riskReward: `1:${((gap * 3) / (premiumBase * 0.55)).toFixed(1)}`,
      idealFor: "Moderate bullish outlook with income generation. Like earning rent on a position.",
      beginnerExplanation: "Buy a call option and sell a higher one to reduce your cost. You cap your upside but pay less to enter. If the market goes up moderately, you make money. If it goes up a LOT, you still profit but give up the extra. If it drops, you lose less than if you'd just bought the call outright.",
      confidence: Math.round(50 + rng() * 15),
    });
  }

  return strategies;
}

/* ════════════════════════════════════════════════════════════════
   PROBABILITY MODELS (Enhanced)
   ════════════════════════════════════════════════════════════════ */
export interface ProbabilitySet {
  bullish: number;
  bearish: number;
  volatilityBreakout: number;
  gammaSqueeze: number;
  crash: number;
  trendContinuation: number;
}

export function calculateProbabilities(data: {
  pcr: number;
  ivPercentile: number;
  spotChangePct: number;
  maxCallOIStrike: number;
  maxPutOIStrike: number;
  spotPrice: number;
  volumeRatio: number;
  tick: number;
}): ProbabilitySet {
  const { pcr, ivPercentile, spotChangePct, maxCallOIStrike, maxPutOIStrike, spotPrice, volumeRatio, tick } = data;
  const rng = seededRng(tick);

  let bullish = 50;
  if (pcr > 1) bullish += (pcr - 1) * 15;
  if (spotPrice > maxPutOIStrike) bullish += 8;
  if (spotChangePct > 0) bullish += spotChangePct * 5;
  bullish += (rng() - 0.5) * 5;

  let bearish = 100 - bullish;
  if (spotPrice > maxCallOIStrike) bearish += 10;
  bearish += (rng() - 0.5) * 5;

  let volBreakout = 20;
  if (ivPercentile > 80) volBreakout += 20;
  if (ivPercentile < 20) volBreakout += 15;
  if (volumeRatio > 1.5) volBreakout += 15;
  volBreakout += (rng() - 0.5) * 8;

  let gamma = 5;
  if (pcr < 0.6 && spotChangePct > 1) gamma = 25;
  if (pcr < 0.5 && spotChangePct > 1.5) gamma = 40;
  gamma += (rng() - 0.5) * 5;

  let crash = 3;
  if (ivPercentile > 85 && spotChangePct < -1) crash = 20;
  if (pcr > 1.5 && spotChangePct < -2) crash = 35;
  crash += (rng() - 0.5) * 3;

  let trend = 50;
  if (Math.abs(spotChangePct) > 0.5) trend = 55 + Math.abs(spotChangePct) * 5;
  trend += (rng() - 0.5) * 8;

  const clamp = (v: number) => Math.max(1, Math.min(99, Math.round(v)));
  return {
    bullish: clamp(bullish),
    bearish: clamp(bearish),
    volatilityBreakout: clamp(volBreakout),
    gammaSqueeze: clamp(gamma),
    crash: clamp(crash),
    trendContinuation: clamp(trend),
  };
}

/* ════════════════════════════════════════════════════════════════
   MONTE CARLO SIMULATION (Enhanced)
   ════════════════════════════════════════════════════════════════ */
export interface MonteCarloResult {
  bestCase: { price: number; probability: number; returnPct: number };
  baseCase: { price: number; probability: number; returnPct: number };
  worstCase: { price: number; probability: number; returnPct: number };
  expectedMove: number;
  expectedMovePct: number;
  distribution: number[];
  var95: number;
  var99: number;
  cvar: number;
}

export function runMonteCarlo(
  spotPrice: number,
  iv: number,
  daysForward: number,
  seed: number,
): MonteCarloResult {
  const rng = seededRng(seed);
  const dt = daysForward / 365;
  const drift = 0.0001;
  const vol = iv * Math.sqrt(dt);
  const simulations = 200;
  const endPrices: number[] = [];

  for (let i = 0; i < simulations; i++) {
    const u1 = rng();
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
    const endPrice = spotPrice * Math.exp((drift - 0.5 * iv * iv) * dt + vol * z);
    endPrices.push(endPrice);
  }

  endPrices.sort((a, b) => a - b);

  const worstPrice = endPrices[Math.floor(simulations * 0.05)];
  const basePrice = endPrices[Math.floor(simulations * 0.50)];
  const bestPrice = endPrices[Math.floor(simulations * 0.95)];
  const expectedMove = spotPrice * vol;

  // VaR calculations
  const returns = endPrices.map(p => (p - spotPrice) / spotPrice * 100);
  const var95 = +returns[Math.floor(simulations * 0.05)].toFixed(2);
  const var99 = +returns[Math.floor(simulations * 0.01)].toFixed(2);
  const cvar = +(returns.slice(0, Math.floor(simulations * 0.05)).reduce((s, r) => s + r, 0) / Math.floor(simulations * 0.05)).toFixed(2);

  const distribution = [];
  for (let i = 0; i < 50; i++) {
    distribution.push(endPrices[Math.floor(i * simulations / 50)]);
  }

  return {
    bestCase: {
      price: +bestPrice.toFixed(2),
      probability: 10,
      returnPct: +((bestPrice - spotPrice) / spotPrice * 100).toFixed(2),
    },
    baseCase: {
      price: +basePrice.toFixed(2),
      probability: 60,
      returnPct: +((basePrice - spotPrice) / spotPrice * 100).toFixed(2),
    },
    worstCase: {
      price: +worstPrice.toFixed(2),
      probability: 10,
      returnPct: +((worstPrice - spotPrice) / spotPrice * 100).toFixed(2),
    },
    expectedMove: +expectedMove.toFixed(2),
    expectedMovePct: +(expectedMove / spotPrice * 100).toFixed(2),
    distribution,
    var95,
    var99,
    cvar,
  };
}

/* ════════════════════════════════════════════════════════════════
   STRESS TESTING ENGINE
   ════════════════════════════════════════════════════════════════ */
export interface StressScenario {
  name: string;
  description: string;
  spotImpact: number; // percentage
  ivImpact: number;
  portfolioImpact: string;
  historicalPrecedent: string;
  probability: number;
  severity: "low" | "medium" | "high" | "extreme";
  color: string;
}

export function runStressTests(spotPrice: number, atmIV: number, tick: number): StressScenario[] {
  const rng = seededRng(tick + 333);

  return [
    {
      name: "Black Swan Crash",
      description: "Sudden 10%+ market crash triggered by geopolitical shock or systemic failure",
      spotImpact: -(8 + rng() * 5),
      ivImpact: +(25 + rng() * 15),
      portfolioImpact: `Spot drops to ~₹${(spotPrice * 0.9).toFixed(0)}. IV spikes to ${(atmIV + 30).toFixed(0)}%+. Puts explode in value. Calls get crushed.`,
      historicalPrecedent: "COVID crash Mar 2020 (-38%), Kargil 1999 (-15%), 2008 GFC (-60% peak)",
      probability: Math.round(2 + rng() * 3),
      severity: "extreme",
      color: "#b71c1c",
    },
    {
      name: "Flash Crash & Recovery",
      description: "Rapid 5% crash followed by V-shaped recovery within hours",
      spotImpact: -(4 + rng() * 3),
      ivImpact: +(15 + rng() * 10),
      portfolioImpact: `Temporary drop to ~₹${(spotPrice * 0.95).toFixed(0)} then recovery. Stop losses get triggered. IV spike crushes short gamma positions.`,
      historicalPrecedent: "NIFTY flash crash Feb 2021 (-3.5%), US flash crash 2010 (-9%)",
      probability: Math.round(5 + rng() * 5),
      severity: "high",
      color: "#c62828",
    },
    {
      name: "Gradual Bear Market",
      description: "Slow 15-20% decline over 3-6 months with rising volatility",
      spotImpact: -(15 + rng() * 5),
      ivImpact: +(10 + rng() * 8),
      portfolioImpact: `Slow bleed to ~₹${(spotPrice * 0.83).toFixed(0)}. Death by a thousand cuts. Covered calls provide some cushion.`,
      historicalPrecedent: "2022 bear market (-18% from Jan high), 2018 NBFC crisis (-17%)",
      probability: Math.round(10 + rng() * 8),
      severity: "high",
      color: "#e65100",
    },
    {
      name: "Volatility Explosion",
      description: "IV doubles without proportional spot move — event-driven vol spike",
      spotImpact: -(2 + rng() * 3),
      ivImpact: +(atmIV * 0.8 + rng() * 10),
      portfolioImpact: `All options get expensive. Straddle buyers win big. Iron Condors get crushed. Vega exposure becomes dominant P&L driver.`,
      historicalPrecedent: "India VIX spike to 86 (Mar 2020), Election result uncertainty 2024",
      probability: Math.round(8 + rng() * 7),
      severity: "medium",
      color: "#6a1b9a",
    },
    {
      name: "Bull Run Acceleration",
      description: "Strong 5-8% rally driven by FII buying + short covering cascade",
      spotImpact: +(5 + rng() * 3),
      ivImpact: -(3 + rng() * 5),
      portfolioImpact: `Spot rallies to ~₹${(spotPrice * 1.07).toFixed(0)}. Call sellers get squeezed. IV drops (vol crush). Put sellers collect full premium.`,
      historicalPrecedent: "Post-election rally 2024 (+3% single day), Diwali rallies",
      probability: Math.round(12 + rng() * 8),
      severity: "medium",
      color: "#1b5e20",
    },
    {
      name: "Expiry Day Gamma Trap",
      description: "Extreme pinning or whipsaw on monthly expiry as gamma explodes",
      spotImpact: +(rng() > 0.5 ? 1 : -1) * (1 + rng() * 2),
      ivImpact: -(5 + rng() * 8),
      portfolioImpact: `Wild intraday swings near max pain ₹${(spotPrice * (0.99 + rng() * 0.02)).toFixed(0)}. Short-dated options see 50-80% intraday swings. Vol crushes to near zero by 3:30 PM.`,
      historicalPrecedent: "Monthly expiry moves — regular occurrence, especially when GEX is extreme",
      probability: Math.round(25 + rng() * 15),
      severity: "low",
      color: "#1565c0",
    },
  ].map(s => ({ ...s, spotImpact: +s.spotImpact.toFixed(1), ivImpact: +s.ivImpact.toFixed(1) })) as StressScenario[];
}

/* ════════════════════════════════════════════════════════════════
   SMART MONEY SIGNAL DETECTION (Enhanced)
   ════════════════════════════════════════════════════════════════ */
export interface SmartMoneyAlert {
  id: string;
  type: "CALL_WRITING" | "PUT_ACCUMULATION" | "INSTITUTIONAL_HEDGE" | "WHALE_ACTIVITY" | "UNUSUAL_OPTION" | "VOL_POSITIONING" | "GAMMA_SQUEEZE" | "SHORT_COVERING" | "BLOCK_TRADE" | "DARK_POOL" | "SWEEP_ORDER";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  beginnerExplanation: string;
  institutionalExplanation: string;
  timestamp: number;
  color: string;
  estimatedValue?: string;
}

export function generateSmartMoneyAlerts(data: {
  pcr: number;
  pcrChange: number;
  ivPercentile: number;
  spotChangePct: number;
  maxCallOI: number;
  maxPutOI: number;
  maxCallOIStrike: number;
  maxPutOIStrike: number;
  spotPrice: number;
  totalVolume: number;
  avgVolume: number;
  tick: number;
}): SmartMoneyAlert[] {
  const alerts: SmartMoneyAlert[] = [];
  const { pcr, pcrChange, ivPercentile, spotChangePct, maxCallOIStrike, maxPutOIStrike, spotPrice, totalVolume, avgVolume, tick } = data;
  const rng = seededRng(tick);
  const ts = Date.now();

  // Aggressive call writing
  if (pcr < 0.7 && spotPrice > maxCallOIStrike * 0.98) {
    alerts.push({
      id: `cw-${tick}`, type: "CALL_WRITING", severity: "high",
      title: `Heavy Call Writing at ${maxCallOIStrike}`,
      message: `Aggressive call writing near ${maxCallOIStrike}. This level = strong resistance.`,
      beginnerExplanation: "Big traders are selling 'up bets' (call options) at this price — they're betting the price WON'T go higher. When the biggest players in the market draw a line in the sand, the market often respects it. This price level is like a glass ceiling.",
      institutionalExplanation: `Concentrated call OI at ${maxCallOIStrike} with PCR ${pcr.toFixed(2)}. Dealer short gamma here. Delta hedging creates negative feedback — expect pinning. Break above triggers gamma squeeze.`,
      timestamp: ts, color: "#e65100",
      estimatedValue: `~₹${(data.maxCallOI * 0.15).toFixed(0)}Cr notional`,
    });
  }

  // Put accumulation
  if (pcr > 1.2 && pcrChange > 0.1) {
    alerts.push({
      id: `pa-${tick}`, type: "PUT_ACCUMULATION", severity: "high",
      title: "Heavy Institutional Put Buying",
      message: `PCR surging to ${pcr.toFixed(2)} (+${pcrChange.toFixed(2)}). Institutional hedging detected.`,
      beginnerExplanation: "Think of put options as 'insurance policies' for big investors. Right now, there's a RUSH to buy this insurance — more than usual. When the smart money buys lots of protection, they might know something we don't. Or they could just be cautious.",
      institutionalExplanation: `PCR expansion to ${pcr.toFixed(2)}, delta +${pcrChange.toFixed(2)}. Systematic hedging flow. Put skew steepening. Monitor gamma acceleration below ${maxPutOIStrike}. Tail risk hedging or directional positioning.`,
      timestamp: ts, color: "#c62828",
    });
  }

  // Vol breakout probability
  if (ivPercentile > 80) {
    alerts.push({
      id: `vb-${tick}`, type: "VOL_POSITIONING", severity: "critical",
      title: "Volatility at Extreme Levels",
      message: `IV Percentile at ${ivPercentile}%. Mean reversion or breakout imminent.`,
      beginnerExplanation: "Market fear is at extreme levels. Options are VERY expensive. Historically, when fear reaches these levels, one of two things happens: either the big scary event actually happens (prices crash), or everyone calms down and option prices collapse. It's a coin flip with high stakes.",
      institutionalExplanation: `IV percentile ${ivPercentile}% — elevated implied vol. Straddle pricing expanded. If realized vol < implied, vol crush incoming. If spot breaks range, gamma-driven acceleration. Vega-neutral strategies underperform.`,
      timestamp: ts, color: "#b71c1c",
    });
  }

  // Block trade detection
  if (totalVolume > avgVolume * 2.2) {
    alerts.push({
      id: `bt-${tick}`, type: "BLOCK_TRADE", severity: "critical",
      title: "Block Trade Activity Detected",
      message: `Volume ${(totalVolume / avgVolume).toFixed(1)}x above average. Institutional block orders identified.`,
      beginnerExplanation: "A 'block trade' is when a massive order comes through — we're talking the big fish, hedge funds and banks. When they make moves this large, the market often follows in the same direction. It's like seeing elephants run — you probably want to get out of the way (or follow them).",
      institutionalExplanation: `Block flow detected: volume ${(totalVolume / avgVolume).toFixed(1)}x avg. Likely algorithmic sweep or institutional accumulation. Cross-reference with OI change for directional conviction. Check OTM strikes for hidden directional bets.`,
      timestamp: ts, color: "#6a1b9a",
      estimatedValue: `~₹${(totalVolume * spotPrice * 0.001 / 1e7).toFixed(0)}Cr estimated block value`,
    });
  }

  // Short covering
  if (spotChangePct > 1 && pcr > 1) {
    alerts.push({
      id: `sc-${tick}`, type: "SHORT_COVERING", severity: "medium",
      title: "Short Covering Rally",
      message: `Price surging ${spotChangePct.toFixed(2)}% with elevated PCR. Short squeeze in progress.`,
      beginnerExplanation: "Traders who bet on the market going DOWN are panicking because it's going UP. They're being forced to buy back their positions to cut losses, which pushes prices even higher. It's a domino effect — each person covering their short forces the next one to cover too!",
      institutionalExplanation: `Spot rally ${spotChangePct.toFixed(2)}% vs elevated PCR = short squeeze mechanics. Stop cascade likely. OI decline confirms covering. Gamma flip potential at ${maxCallOIStrike}.`,
      timestamp: ts, color: "#2e7d32",
    });
  }

  // Unusual volume
  if (totalVolume > avgVolume * 1.8) {
    alerts.push({
      id: `uv-${tick}`, type: "UNUSUAL_OPTION", severity: "medium",
      title: "Unusual Options Activity",
      message: `Volume ${(totalVolume / avgVolume).toFixed(1)}x above average. Smart money is moving.`,
      beginnerExplanation: "Options trading is MUCH busier than normal. When activity spikes like this, it usually means someone with deep pockets and inside knowledge is making a big bet. Watch which direction (calls vs puts) has more activity — that's where the smart money is leaning.",
      institutionalExplanation: `Volume/avg ratio at ${(totalVolume / avgVolume).toFixed(1)}x. Check sweep vs block composition. OTM call accumulation = directional bullish. OTM put accumulation = hedging or directional bearish.`,
      timestamp: ts, color: "#1565c0",
    });
  }

  // Gamma squeeze
  if (pcr < 0.5 && spotChangePct > 1.5) {
    alerts.push({
      id: `gs-${tick}`, type: "GAMMA_SQUEEZE", severity: "critical",
      title: "Gamma Squeeze Conditions Active!",
      message: "Low PCR + rapid price rise = dealers forced-buying. Self-reinforcing rally!",
      beginnerExplanation: "This is the rarest and most explosive setup in options! Market makers are caught on the wrong side and are being FORCED to buy more and more as prices rise. Each buy pushes prices higher, which forces more buying. Think GameStop 2021 — the same mechanics are forming here.",
      institutionalExplanation: `Sub-0.5 PCR + momentum = dealer short gamma forced delta hedging. Self-reinforcing loop: spot↑ → delta hedge buy → spot↑. GEX flip zone critical. Vanna amplification possible if vol also rising.`,
      timestamp: ts, color: "#ff6f00",
    });
  }

  // Sweep order detection (simulated)
  if (rng() > 0.6) {
    const sweepDirection = rng() > 0.5 ? "CALL" : "PUT";
    const sweepStrike = Math.round((spotPrice * (sweepDirection === "CALL" ? 1.02 : 0.98)) / 50) * 50;
    alerts.push({
      id: `sw-${tick}`, type: "SWEEP_ORDER", severity: "high",
      title: `${sweepDirection} Sweep at ${sweepStrike}`,
      message: `Aggressive ${sweepDirection.toLowerCase()} buying sweep across multiple exchanges. ${sweepDirection === "CALL" ? "Bullish" : "Bearish"} conviction.`,
      beginnerExplanation: `A 'sweep order' means someone is buying ${sweepDirection.toLowerCase()} options so aggressively that they're hitting every available seller simultaneously. It's like someone walking into multiple shops and buying everything in stock. They REALLY want this position and don't want to wait.`,
      institutionalExplanation: `Multi-exchange ${sweepDirection.toLowerCase()} sweep at ${sweepStrike}. Size suggests institutional conviction. Sweeps indicate urgency — willing to pay higher prices across venues rather than waiting for fills. Directional ${sweepDirection === "CALL" ? "bullish" : "bearish"} signal.`,
      timestamp: ts - Math.floor(rng() * 300000), color: sweepDirection === "CALL" ? "#1565c0" : "#c62828",
      estimatedValue: `~₹${(5 + Math.floor(rng() * 25))}Cr`,
    });
  }

  // Dark pool activity (simulated)
  if (rng() > 0.65) {
    alerts.push({
      id: `dp-${tick}`, type: "DARK_POOL", severity: "medium",
      title: "Dark Pool Print Detected",
      message: "Large off-exchange block executed. Size suggests institutional activity not visible on public order book.",
      beginnerExplanation: "A 'dark pool' is a private exchange where big institutions trade secretly so they don't move the market. We just detected a large trade there. It's like finding out a celebrity was quietly buying up property in your neighborhood — they're trying not to attract attention.",
      institutionalExplanation: "Off-exchange block detected. Size exceeds typical retail flow. Dark pool prints often precede directional moves as institutions accumulate/distribute before showing hand on lit exchanges.",
      timestamp: ts - Math.floor(rng() * 600000), color: "#37474f",
      estimatedValue: `~₹${(10 + Math.floor(rng() * 40))}Cr`,
    });
  }

  // Ensure at least 3 alerts
  const ambient = [
    {
      id: `amb1-${tick}`, type: "INSTITUTIONAL_HEDGE" as const, severity: "low" as const,
      title: "Routine Institutional Hedging",
      message: "Steady PCR indicates normal hedging. No unusual stress.",
      beginnerExplanation: "Everything is normal. Big institutions are managing their risk as usual. No special action needed — think of it as a regular check-up showing everything's healthy.",
      institutionalExplanation: "PCR within normal range. Dealer gamma balanced. IV-RV spread stable. Standard roll activity in near-term expiries.",
      timestamp: ts, color: "#546e7a",
    },
    {
      id: `amb2-${tick}`, type: "WHALE_ACTIVITY" as const, severity: "low" as const,
      title: "Whale Position Monitor",
      message: "Tracking large trader positions. No abnormal activity detected.",
      beginnerExplanation: "We're watching the biggest traders ('whales') in the market. Right now, they're not doing anything unusual. It's like watching a quiet ocean — no big waves expected.",
      institutionalExplanation: "Large trader positioning within normal bands. OI concentration ratios stable. No unusual skew or term structure anomalies.",
      timestamp: ts, color: "#37474f",
    },
    {
      id: `amb3-${tick}`, type: "VOL_POSITIONING" as const, severity: "low" as const,
      title: "Volatility Surface Stable",
      message: "IV term structure and skew within normal parameters. No dislocations.",
      beginnerExplanation: "The 'price of fear' in the options market is normal. Options are neither too expensive nor too cheap. No red flags.",
      institutionalExplanation: "Vol surface stable. 25-delta risk reversals within 1-sigma bands. Calendar spread pricing normal. No convexity dislocations.",
      timestamp: ts, color: "#546e7a",
    },
  ];
  while (alerts.length < 3) {
    alerts.push(ambient[alerts.length]);
  }

  return alerts;
}

/* ════════════════════════════════════════════════════════════════
   AI COPILOT NARRATIVE ENGINE
   ════════════════════════════════════════════════════════════════ */
export interface CopilotNarrative {
  headline: string;
  summary: string;
  beginnerStory: string;
  institutionalBrief: string;
  actionItems: string[];
  riskWarning: string;
  marketMood: string;
  moodEmoji: string;
  moodColor: string;
}

export function generateCopilotNarrative(data: {
  symbol: string;
  spotPrice: number;
  spotChangePct: number;
  regime: RegimeSignals;
  positioning: PositionSignal;
  probabilities: ProbabilitySet;
  pcr: number;
  atmIV: number;
  ivPercentile: number;
  gex: GEXData;
  strategies: OptionsStrategy[];
}): CopilotNarrative {
  const { symbol, spotPrice, spotChangePct, regime, positioning, probabilities, pcr, atmIV, ivPercentile, gex, strategies } = data;

  const bullish = probabilities.bullish > 55;
  const bearish = probabilities.bearish > 55;
  const topStrategy = strategies[0];

  // Market mood
  let marketMood: string;
  let moodEmoji: string;
  let moodColor: string;

  if (regime.regime === "PANIC") {
    marketMood = "Fearful"; moodEmoji = "😰"; moodColor = "#b71c1c";
  } else if (regime.regime === "BULL_MARKET") {
    marketMood = "Optimistic"; moodEmoji = "😊"; moodColor = "#1b5e20";
  } else if (regime.regime === "GAMMA_SQUEEZE") {
    marketMood = "Explosive"; moodEmoji = "🚀"; moodColor = "#ff6f00";
  } else if (regime.regime === "ACCUMULATION") {
    marketMood = "Quietly Confident"; moodEmoji = "🤫"; moodColor = "#1565c0";
  } else if (regime.regime === "DISTRIBUTION") {
    marketMood = "Cautiously Exiting"; moodEmoji = "🚪"; moodColor = "#6a1b9a";
  } else if (regime.regime === "HIGH_VOLATILITY") {
    marketMood = "Nervous"; moodEmoji = "⚡"; moodColor = "#e65100";
  } else if (regime.regime === "VOL_CRUSH") {
    marketMood = "Relaxing"; moodEmoji = "😌"; moodColor = "#00897b";
  } else {
    marketMood = "Indecisive"; moodEmoji = "🤷"; moodColor = "#546e7a";
  }

  const headline = `${symbol} at ${spotPrice.toLocaleString("en-IN")} — ${regime.regime.replace(/_/g, " ")} regime with ${positioning.label}`;

  const summary = `${symbol} is ${spotChangePct >= 0 ? "up" : "down"} ${Math.abs(spotChangePct)}% with ${positioning.label.toLowerCase()} detected. PCR at ${pcr.toFixed(2)} signals ${pcr > 1.2 ? "institutional hedging demand" : pcr < 0.7 ? "aggressive call activity" : "balanced sentiment"}. IV at ${atmIV}% (${ivPercentile}th percentile) — ${ivPercentile > 70 ? "options are expensive" : ivPercentile < 30 ? "options are cheap" : "options are fairly priced"}. Dealers are ${gex.dealerPositioning.replace(/_/g, " ").toLowerCase()}, ${gex.dealerPositioning === "SHORT_GAMMA" ? "amplifying moves" : gex.dealerPositioning === "LONG_GAMMA" ? "dampening moves" : "neutral"}.`;

  const beginnerStory = bullish
    ? `Good news for ${symbol}! The market is trending upward and big institutions are building positions. Think of it like a popular restaurant — more and more people are lining up to get in. The \"fear meter\" (IV) is ${ivPercentile > 70 ? "high, meaning options are expensive to buy" : ivPercentile < 30 ? "low, meaning options are on sale" : "normal"}. ${topStrategy ? `The AI recommends a ${topStrategy.name} — ${topStrategy.beginnerExplanation.split('.')[0]}.` : ""}`
    : bearish
    ? `Caution on ${symbol}! The market is under pressure and institutional traders are buying protection. It's like seeing umbrellas going up before a storm — the smart money is getting defensive. ${topStrategy ? `Consider a ${topStrategy.name} to protect yourself or profit from the decline.` : ""}`
    : `${symbol} is in a wait-and-see mode. The market is like a tennis match at deuce — could go either way. ${ivPercentile > 60 ? "Options are expensive right now, which favors sellers (collecting premium)." : "Options are affordable, which favors buyers (paying premium for big moves)."} ${topStrategy ? `The AI's top pick: ${topStrategy.name}.` : ""}`;

  const institutionalBrief = `${symbol} ${spotChangePct >= 0 ? "+" : ""}${spotChangePct}% | ${regime.regime} | ${positioning.pattern} | PCR ${pcr.toFixed(2)} | ATM IV ${atmIV}% (${ivPercentile}%ile) | GEX ${gex.totalGEX > 0 ? "+" : ""}${gex.totalGEX}M (${gex.dealerPositioning}) | Gamma wall ${gex.gammaWallStrike} | Flip zone ${gex.flipZone} | Squeeze prob ${gex.gammaSqueezeProbability}% | ${topStrategy ? `Top strategy: ${topStrategy.name} (${topStrategy.confidence}% confidence)` : "No clear edge"}`;

  const actionItems = [
    `${positioning.label} detected — ${positioning.pattern === "LONG_BUILDUP" ? "consider going long" : positioning.pattern === "SHORT_BUILDUP" ? "consider defensive positioning" : positioning.pattern === "SHORT_COVERING" ? "ride the momentum but tighten stops" : "reduce position size"}`,
    `GEX is ${gex.dealerPositioning === "SHORT_GAMMA" ? "negative — moves will be amplified. Use wider stop losses" : gex.dealerPositioning === "LONG_GAMMA" ? "positive — market likely to stay range-bound near " + gex.gammaWallStrike : "neutral — normal volatility dynamics"}`,
    `IV at ${ivPercentile}th percentile — ${ivPercentile > 70 ? "SELL premium (options expensive)" : ivPercentile < 30 ? "BUY premium (options cheap)" : "fair value, no vol edge"}`,
    topStrategy ? `AI recommends: ${topStrategy.name} (${topStrategy.confidence}% confidence)` : "No high-conviction strategy in current conditions",
  ];

  const riskWarning = gex.dealerPositioning === "SHORT_GAMMA"
    ? "ELEVATED RISK: Dealer short gamma means moves can accelerate rapidly in either direction. Size positions conservatively and use wider stops."
    : ivPercentile > 80
    ? "HIGH VOLATILITY: Options are very expensive. Selling premium has edge but tail risk is elevated. Use defined-risk strategies only."
    : "Standard risk parameters apply. Follow position sizing rules.";

  return {
    headline, summary, beginnerStory, institutionalBrief,
    actionItems, riskWarning, marketMood, moodEmoji, moodColor,
  };
}

/* ════════════════════════════════════════════════════════════════
   QUANT METRICS
   ════════════════════════════════════════════════════════════════ */
export interface QuantScores {
  momentum: number;
  liquidity: number;
  volatility: number;
  institutionalAccumulation: number;
  riskAdjustedStrength: number;
  relativeVolatilityRank: number;
}

export function calculateQuantScores(data: {
  spotChangePct: number;
  volumeRatio: number;
  ivPercentile: number;
  oiChangePct: number;
  pcr: number;
  tick: number;
}): QuantScores {
  const { spotChangePct, volumeRatio, ivPercentile, oiChangePct, pcr, tick } = data;
  const rng = seededRng(tick);
  const jitter = () => (rng() - 0.5) * 6;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));

  return {
    momentum: clamp(spotChangePct * 25 + jitter(), -100, 100),
    liquidity: clamp(volumeRatio * 40 + 20 + jitter(), 0, 100),
    volatility: clamp(ivPercentile + jitter(), 0, 100),
    institutionalAccumulation: clamp(
      (oiChangePct > 0 ? oiChangePct * 10 : 0) + (pcr > 0.8 ? 20 : 0) + 30 + jitter(), 0, 100
    ),
    riskAdjustedStrength: clamp(50 + spotChangePct * 10 - ivPercentile * 0.3 + jitter(), 0, 100),
    relativeVolatilityRank: clamp(ivPercentile + jitter() * 2, 0, 100),
  };
}

/* ════════════════════════════════════════════════════════════════
   CORRELATION ENGINE
   ════════════════════════════════════════════════════════════════ */
export interface CorrelationPair {
  label: string;
  assetA: string;
  assetB: string;
  correlation: number;
  interpretation: string;
}

export function generateCorrelations(tick: number): CorrelationPair[] {
  const rng = seededRng(tick * 7);
  const j = () => (rng() - 0.5) * 0.08;

  return [
    { label: "NIFTY vs BANKNIFTY", assetA: "NIFTY", assetB: "BANKNIFTY", correlation: +(0.92 + j()).toFixed(2), interpretation: "Highly correlated — banking drives broad market." },
    { label: "NIFTY vs VIX", assetA: "NIFTY", assetB: "India VIX", correlation: +(-0.82 + j()).toFixed(2), interpretation: "Strong inverse — fear rises as market falls." },
    { label: "NIFTY vs DXY", assetA: "NIFTY", assetB: "Dollar Index", correlation: +(-0.45 + j()).toFixed(2), interpretation: "Strong dollar pressures Indian equities via FII flows." },
    { label: "NIFTY vs Crude", assetA: "NIFTY", assetB: "Brent Crude", correlation: +(-0.38 + j()).toFixed(2), interpretation: "Rising oil = higher import bill = market pressure." },
    { label: "NIFTY vs Gold", assetA: "NIFTY", assetB: "Gold", correlation: +(-0.15 + j()).toFixed(2), interpretation: "Weak inverse — gold is a mild safe haven." },
    { label: "IV vs Spot", assetA: "ATM IV", assetB: "Spot Price", correlation: +(-0.68 + j()).toFixed(2), interpretation: "IV rises in selloffs — fear premium in options." },
    { label: "Futures OI vs Spot", assetA: "Futures OI", assetB: "Spot Price", correlation: +(0.55 + j()).toFixed(2), interpretation: "OI + price = buildup. OI - price = unwinding." },
    { label: "FII vs NIFTY", assetA: "FII Net", assetB: "NIFTY", correlation: +(0.72 + j()).toFixed(2), interpretation: "FII buying drives rallies, selling drives corrections." },
  ];
}

/* ════════════════════════════════════════════════════════════════
   SUPPORT/RESISTANCE FROM OPTION CHAIN
   ════════════════════════════════════════════════════════════════ */
export interface SupportResistance {
  supports: { level: number; strength: number; type: string }[];
  resistances: { level: number; strength: number; type: string }[];
  maxPain: number;
  gammaWall: number;
}

export function calculateSupportResistance(chain: {
  strike: number;
  callOI: number;
  putOI: number;
  callVol: number;
  putVol: number;
}[], spotPrice: number): SupportResistance {
  let minPain = Infinity;
  let maxPain = chain[0]?.strike || 0;
  chain.forEach(row => {
    const pain = chain.reduce((s, o) =>
      s + Math.max(0, o.strike - row.strike) * o.callOI + Math.max(0, row.strike - o.strike) * o.putOI, 0);
    if (pain < minPain) { minPain = pain; maxPain = row.strike; }
  });

  const supports = chain
    .filter(r => r.strike < spotPrice && r.putOI > 0)
    .sort((a, b) => b.putOI - a.putOI)
    .slice(0, 3)
    .map(r => ({ level: r.strike, strength: Math.min(100, Math.round(r.putOI / 1000)), type: "Put OI Wall" }));

  const resistances = chain
    .filter(r => r.strike > spotPrice && r.callOI > 0)
    .sort((a, b) => b.callOI - a.callOI)
    .slice(0, 3)
    .map(r => ({ level: r.strike, strength: Math.min(100, Math.round(r.callOI / 1000)), type: "Call OI Wall" }));

  const nearATM = chain
    .filter(r => Math.abs(r.strike - spotPrice) / spotPrice < 0.03)
    .sort((a, b) => (b.callOI + b.putOI) - (a.callOI + a.putOI));
  const gammaWall = nearATM[0]?.strike || maxPain;

  return { supports, resistances, maxPain, gammaWall };
}
