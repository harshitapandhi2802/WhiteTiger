// ═══════════════════════════════════════════════════════════════════════
// MOONLIGHT FOREX INTELLIGENCE ENGINE v2.0
// AI Copilot · Currency Converter · Macro Intelligence · Story Feed
// Market Clocks · Travel FX · Technical Analysis · Market Impact
// ═══════════════════════════════════════════════════════════════════════

/* ─── Seeded RNG ─── */
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

// ═══════════════════════════════════════════
// 1. CURRENCY CONVERTER ENGINE
// ═══════════════════════════════════════════

export interface ConversionRate {
  from: string;
  to: string;
  rate: number;
  inverse: number;
  change24h: number;
  change1w: number;
  change1m: number;
  high52w: number;
  low52w: number;
  sparkline: number[];
  aiExplanation: string;
  lastUpdated: string;
}

interface CurrencyBase {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const CONVERTER_CURRENCIES: CurrencyBase[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", flag: "🇨🇭" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
];

// Base rates vs USD (approximate realistic rates)
const BASE_RATES_VS_USD: Record<string, number> = {
  USD: 1, EUR: 0.921, GBP: 0.792, JPY: 157.5, INR: 85.2, CHF: 0.882,
  AUD: 1.536, CAD: 1.372, CNY: 7.245, AED: 3.673, SGD: 1.342, NZD: 1.671,
  SAR: 3.75, BRL: 5.12, ZAR: 18.35, TRY: 38.42, THB: 34.8, KRW: 1378,
  MXN: 17.15, HKD: 7.82,
};

export function getConversionRate(from: string, to: string): ConversionRate {
  const rng = seededRng(`${from}${to}conv`);
  const fromUSD = BASE_RATES_VS_USD[from] || 1;
  const toUSD = BASE_RATES_VS_USD[to] || 1;
  const rate = toUSD / fromUSD;
  const noise = 1 + (rng() - 0.5) * 0.008; // ±0.4% jitter
  const finalRate = rate * noise;

  const spark: number[] = [];
  let v = finalRate * (1 - (rng() - 0.45) * 0.03);
  for (let i = 0; i < 30; i++) {
    v += (rng() - 0.48) * finalRate * 0.004;
    spark.push(+v.toFixed(6));
  }

  const explanations: Record<string, string> = {
    USDINR: "USD/INR influenced by RBI intervention, FII flows, and oil import demand. India's strong GDP growth provides structural INR support, but current account deficit creates selling pressure.",
    EURUSD: "EUR/USD driven by ECB-Fed policy divergence. ECB rate cuts weaker euro; US yield advantage supports dollar. Trade balance and energy prices key factors.",
    GBPUSD: "GBP/USD reflects BoE policy stance and UK economic outlook. Brexit trade dynamics, services sector strength, and relative inflation drive direction.",
    USDJPY: "USD/JPY primarily driven by US-Japan yield differential. BoJ policy normalization vs Fed rate path creates the dominant dynamic. Carry trade flows amplify moves.",
  };
  const pairKey = `${from}${to}`;
  const aiExplanation = explanations[pairKey] ||
    `${from}/${to} movement driven by relative interest rate differentials, economic growth outlook, and central bank policy divergence between the two economies. Trade flows and risk sentiment also play significant roles.`;

  return {
    from, to, rate: +finalRate.toFixed(6), inverse: +(1 / finalRate).toFixed(6),
    change24h: +((rng() - 0.48) * 1.2).toFixed(2),
    change1w: +((rng() - 0.45) * 2.5).toFixed(2),
    change1m: +((rng() - 0.42) * 4).toFixed(2),
    high52w: +(finalRate * (1 + rng() * 0.08)).toFixed(6),
    low52w: +(finalRate * (1 - rng() * 0.08)).toFixed(6),
    sparkline: spark, aiExplanation,
    lastUpdated: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════
// 2. AI FOREX COPILOT
// ═══════════════════════════════════════════

export interface ForexCopilotNarrative {
  headline: string;
  marketMood: string;
  moodEmoji: string;
  moodColor: string;
  summary: string;
  keyDrivers: { driver: string; impact: string; direction: "Bullish USD" | "Bearish USD" | "Neutral"; icon: string }[];
  centralBankWatch: string;
  riskSentiment: string;
  tradeIdeas: { pair: string; direction: "Long" | "Short"; rationale: string; confidence: number }[];
  beginnerSummary: string;
}

export function generateForexCopilot(): ForexCopilotNarrative {
  const rng = seededRng(`copilot-${new Date().toDateString()}`);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const moods = [
    { mood: "Risk-On Rally", emoji: "🟢", color: "#00c853" },
    { mood: "Cautious Optimism", emoji: "🟡", color: "#ff9800" },
    { mood: "Risk-Off Defensive", emoji: "🔴", color: "#c62828" },
    { mood: "Range-Bound Consolidation", emoji: "🔵", color: "#2962ff" },
    { mood: "Dollar Dominance", emoji: "💪", color: "#0d47a1" },
    { mood: "EM Stress Building", emoji: "⚠️", color: "#e65100" },
  ];
  const moodObj = pick(moods);

  const headlines = [
    "Dollar Index (DXY) tests key resistance as US yields climb; EM currencies under pressure",
    "Central bank divergence driving G10 FX volatility higher; carry trades in focus",
    "Global risk appetite improving as inflation fears ease; commodity currencies rally",
    "USD consolidating near 104 on DXY; markets await FOMC minutes for policy guidance",
    "JPY weakens past 157 as BOJ maintains dovish stance; intervention risk rising",
    "EUR/USD range-bound between 1.08-1.10 as ECB and Fed paths converge",
  ];

  return {
    headline: pick(headlines),
    marketMood: moodObj.mood,
    moodEmoji: moodObj.emoji,
    moodColor: moodObj.color,
    summary: `Global FX markets are in a ${moodObj.mood.toLowerCase()} regime. The US Dollar Index is trading around ${(103 + rng() * 4).toFixed(1)}, with the greenback ${rng() > 0.5 ? "gaining" : "losing"} ground against most G10 pairs. Central bank policy divergence remains the primary driver, with the Fed's rate path relative to ECB and BOJ creating the dominant macro backdrop. Risk sentiment is ${rng() > 0.5 ? "tilting positive" : "turning cautious"} as markets digest the latest economic data.`,
    keyDrivers: [
      { driver: "US Treasury Yields", impact: `10Y at ${(4.1 + rng() * 0.8).toFixed(2)}% — ${rng() > 0.5 ? "rising" : "falling"}, supporting ${rng() > 0.5 ? "USD" : "risk assets"}`, direction: rng() > 0.5 ? "Bullish USD" : "Bearish USD", icon: "📊" },
      { driver: "Fed Rate Expectations", impact: `Markets pricing ${Math.floor(1 + rng() * 3)} rate cuts by year-end — ${rng() > 0.5 ? "more dovish" : "less dovish"} than last week`, direction: rng() > 0.5 ? "Bearish USD" : "Bullish USD", icon: "🏛️" },
      { driver: "Oil Prices (Brent)", impact: `Brent at $${(72 + rng() * 18).toFixed(0)}/bbl — ${rng() > 0.5 ? "rising" : "falling"}, impacting commodity FX and INR`, direction: "Neutral", icon: "🛢️" },
      { driver: "China Economic Data", impact: `PMI at ${(48 + rng() * 5).toFixed(1)} — ${rng() > 0.5 ? "above" : "below"} expectations, affecting AUD and EM FX`, direction: rng() > 0.5 ? "Bearish USD" : "Bullish USD", icon: "🇨🇳" },
      { driver: "Geopolitical Risk", impact: pick(["Trade tensions elevated", "Regional conflicts impacting safe havens", "Election uncertainty in major economies", "Sanctions risk re-emerging"]), direction: pick(["Bullish USD", "Bearish USD", "Neutral"]), icon: "🌍" },
      { driver: "Risk Appetite (VIX)", impact: `VIX at ${(13 + rng() * 15).toFixed(1)} — ${rng() > 0.6 ? "elevated volatility" : "calm markets"}`, direction: rng() > 0.6 ? "Bullish USD" : "Bearish USD", icon: "📈" },
    ],
    centralBankWatch: pick([
      "Fed speakers this week suggest data-dependent stance. ECB likely to cut 25bps at next meeting. BOJ maintaining ultra-loose but verbal intervention increasing.",
      "FOMC minutes due Wednesday — markets watching for QT taper signals. RBI held rates at 6.0% citing inflation concerns. BOE split between hawks and doves.",
      "Central bank divergence at peak: Fed holding rates while ECB and BOC cut. This is widening yield spreads and supporting USD. Watch for any shift in guidance.",
    ]),
    riskSentiment: pick([
      "Risk-on: Equities at ATH, credit spreads tight, VIX subdued. Carry trades performing well — AUD/JPY and MXN/JPY favored.",
      "Risk-off building: VIX creeping higher, EM spreads widening. USD and JPY benefiting from safe-haven flows.",
      "Mixed: DM equities positive but EM under pressure. Selective risk-on in high-yield EM carry, but defensive positioning in G10.",
    ]),
    tradeIdeas: [
      { pair: pick(["EUR/USD", "GBP/USD", "AUD/USD"]), direction: pick(["Long", "Short"]), rationale: pick(["Policy divergence favors position", "Technical breakout above key resistance", "Seasonal pattern and carry support", "Mean reversion from oversold levels"]), confidence: Math.floor(60 + rng() * 30) },
      { pair: pick(["USD/JPY", "USD/INR", "USD/CAD"]), direction: pick(["Long", "Short"]), rationale: pick(["Yield differential widening", "Central bank intervention risk — fade the move", "Commodity price tailwind", "Capital flow dynamics shifting"]), confidence: Math.floor(55 + rng() * 35) },
      { pair: pick(["EUR/GBP", "AUD/JPY", "USD/CHF"]), direction: pick(["Long", "Short"]), rationale: pick(["Relative rate path divergence", "Risk sentiment shifting", "Macro data surprise potential", "Valuation extreme on REER basis"]), confidence: Math.floor(50 + rng() * 30) },
    ],
    beginnerSummary: "In simple terms: The US dollar is the most important currency in the world. When US interest rates are high, money flows to the US, making the dollar stronger. Right now, central banks around the world are at different stages — some cutting rates, some holding. This difference is the main driver of currency movements. If you're an Indian investor or traveler, watch RBI decisions and oil prices — they directly affect how many rupees you need per dollar.",
  };
}

// ═══════════════════════════════════════════
// 3. CENTRAL BANK INTELLIGENCE ENGINE
// ═══════════════════════════════════════════

export interface CentralBankProfile {
  name: string;
  abbr: string;
  flag: string;
  currency: string;
  currentRate: string;
  rateChange: string;
  stance: "Hawkish" | "Neutral" | "Dovish";
  stanceColor: string;
  nextMeeting: string;
  forwardGuidance: string;
  inflationTarget: string;
  currentInflation: string;
  balanceSheet: string;
  keyOfficials: string;
  aiAnalysis: string;
  beginnerExplanation: string;
  currencyImpact: string;
}

export function generateCentralBankIntel(): CentralBankProfile[] {
  const rng = seededRng(`cb-intel-${new Date().toDateString()}`);
  return [
    {
      name: "Federal Reserve", abbr: "Fed", flag: "🇺🇸", currency: "USD",
      currentRate: "5.25-5.50%", rateChange: "Held (since Jul 2023)",
      stance: "Hawkish", stanceColor: "#c62828",
      nextMeeting: "Jun 11-12, 2026", forwardGuidance: "Data-dependent; inflation must show sustained progress toward 2%",
      inflationTarget: "2.0% (PCE)", currentInflation: `${(2.5 + rng() * 1).toFixed(1)}% (Core PCE)`,
      balanceSheet: "$7.4T (QT ongoing, ~$60B/month runoff)",
      keyOfficials: "Chair Jerome Powell, Gov. Christopher Waller, NY Fed Pres. John Williams",
      aiAnalysis: "The Fed remains in a restrictive stance, keeping rates at 5.25-5.50%. Markets are pricing 2-3 cuts by year-end but the Fed is pushing back. The key tension is between cooling labor market data and sticky services inflation. QT continues but at a slower pace.",
      beginnerExplanation: "The Federal Reserve controls the US dollar's interest rate. When rates are high (like now at 5.5%), the dollar becomes attractive because you earn more interest holding dollars. This makes USD strong against other currencies.",
      currencyImpact: "Hawkish Fed = Strong USD. Every 25bps rate cut expectation change moves EUR/USD ~50 pips. USD strength pressures EM currencies and commodity prices.",
    },
    {
      name: "Reserve Bank of India", abbr: "RBI", flag: "🇮🇳", currency: "INR",
      currentRate: "6.00%", rateChange: "Cut 25bps (Apr 2025)",
      stance: "Neutral", stanceColor: "#ff9800",
      nextMeeting: "Jun 4-6, 2026", forwardGuidance: "Accommodative stance; focused on growth while monitoring inflation",
      inflationTarget: "4% (±2%)", currentInflation: `${(4.2 + rng() * 1.5).toFixed(1)}% (CPI)`,
      balanceSheet: "FX Reserves: ~$640B",
      keyOfficials: "Governor Sanjay Malhotra, Deputy Gov. Michael Patra",
      aiAnalysis: "RBI has shifted to an accommodative stance, cutting rates to support growth. INR stability maintained through active FX intervention — RBI buys/sells dollars to smooth volatility. India's strong growth (~7% GDP) and improving current account provide structural support.",
      beginnerExplanation: "RBI controls the rupee. When RBI cuts rates, it means borrowing becomes cheaper but the rupee might weaken. RBI also buys and sells dollars to keep the rupee stable — that's why INR doesn't move as wildly as other currencies.",
      currencyImpact: "RBI rate cuts can weaken INR, but active intervention limits moves. USD/INR typically trades in tight 0.5-1% monthly ranges due to RBI management.",
    },
    {
      name: "European Central Bank", abbr: "ECB", flag: "🇪🇺", currency: "EUR",
      currentRate: "3.50%", rateChange: "Cut 25bps (Mar 2025)",
      stance: "Dovish", stanceColor: "#2962ff",
      nextMeeting: "Jun 5, 2026", forwardGuidance: "Gradual easing cycle; data-dependent pace of cuts",
      inflationTarget: "2.0% (HICP)", currentInflation: `${(2.0 + rng() * 0.8).toFixed(1)}% (Core HICP)`,
      balanceSheet: "€6.5T (QT ongoing)",
      keyOfficials: "President Christine Lagarde, Chief Economist Philip Lane",
      aiAnalysis: "ECB is ahead of the Fed in the cutting cycle, having already delivered multiple cuts. This rate differential is a key driver of EUR/USD weakness. Eurozone growth remains sluggish, justifying continued easing. Watch for any hawkish surprises from inflation data.",
      beginnerExplanation: "The ECB controls interest rates for all eurozone countries. They've been cutting rates because the European economy is growing slowly. Lower ECB rates vs higher Fed rates make euros less attractive than dollars — that's why EUR/USD has been under pressure.",
      currencyImpact: "Dovish ECB = Weaker EUR. Each ECB rate cut widens the yield gap with the US, pressuring EUR/USD lower. But the rate is partially priced in.",
    },
    {
      name: "Bank of Japan", abbr: "BOJ", flag: "🇯🇵", currency: "JPY",
      currentRate: "0.50%", rateChange: "Hiked 25bps (Jan 2025)",
      stance: "Dovish", stanceColor: "#2962ff",
      nextMeeting: "Jun 12-13, 2026", forwardGuidance: "Gradual normalization; monitoring wage growth and inflation sustainability",
      inflationTarget: "2.0%", currentInflation: `${(2.5 + rng() * 1).toFixed(1)}% (Core CPI)`,
      balanceSheet: "~¥750T ($4.8T) — largest relative to GDP globally",
      keyOfficials: "Governor Kazuo Ueda",
      aiAnalysis: "BOJ is in early normalization mode after decades of ultra-loose policy. The massive US-Japan yield gap keeps JPY weak and carry trades profitable. Key risk: faster BOJ normalization could trigger violent JPY short-covering and carry trade unwind.",
      beginnerExplanation: "Japan had near-zero interest rates for decades. They're slowly raising them, but at 0.5% vs 5.5% in the US, the gap is enormous. This makes borrowing in yen cheap to invest in dollars — the 'carry trade' — keeping yen weak.",
      currencyImpact: "BOJ policy normalization is the biggest wildcard in FX. Each BOJ rate hike can cause 200-500 pip JPY rallies as carry trades unwind.",
    },
    {
      name: "Bank of England", abbr: "BoE", flag: "🇬🇧", currency: "GBP",
      currentRate: "4.50%", rateChange: "Cut 25bps (Feb 2025)",
      stance: "Neutral", stanceColor: "#ff9800",
      nextMeeting: "Jun 19, 2026", forwardGuidance: "Gradual and careful approach to easing",
      inflationTarget: "2.0%", currentInflation: `${(2.8 + rng() * 1).toFixed(1)}% (CPI)`,
      balanceSheet: "£815B (QT via bond sales)",
      keyOfficials: "Governor Andrew Bailey",
      aiAnalysis: "BoE is navigating sticky UK services inflation against weak growth — the classic stagflation dilemma. Rate cuts are proceeding slower than ECB due to inflation persistence. GBP supported by relatively high rates but vulnerable to growth disappointment.",
      beginnerExplanation: "The Bank of England controls the pound's interest rate. UK inflation has been stubbornly high, so they're cutting rates very slowly. This keeps the pound relatively strong compared to the euro, but it means the UK economy is struggling.",
      currencyImpact: "BoE hawkishness relative to ECB supports EUR/GBP downside. But GBP/USD dependent on Fed-BoE rate gap.",
    },
    {
      name: "People's Bank of China", abbr: "PBOC", flag: "🇨🇳", currency: "CNY",
      currentRate: "3.45% (1Y LPR)", rateChange: "Cut 10bps (Oct 2024)",
      stance: "Dovish", stanceColor: "#2962ff",
      nextMeeting: "Monthly fixing (20th)", forwardGuidance: "Supportive monetary policy; targeted easing for property and SMEs",
      inflationTarget: "~3%", currentInflation: `${(0.2 + rng() * 1).toFixed(1)}% (CPI — near deflation)`,
      balanceSheet: "$3.2T FX reserves",
      keyOfficials: "Governor Pan Gongsheng",
      aiAnalysis: "PBOC is in easing mode to combat deflation and property crisis. CNY managed via daily fixing and capital controls. The key tension: easing to support growth vs preventing CNY depreciation and capital outflows. PBOC has massive FX reserves to defend CNY if needed.",
      beginnerExplanation: "China's central bank keeps the yuan tightly controlled. Unlike free-floating currencies, PBOC sets a daily 'fixing rate' and only allows the yuan to move 2% around it. They're cutting rates to help the economy but trying not to let the yuan fall too much.",
      currencyImpact: "PBOC easing = mild CNY weakness, but managed. USD/CNY breakout above 7.35 would signal significant stress. PBOC intervention keeps moves orderly.",
    },
  ];
}

// ═══════════════════════════════════════════
// 4. FOREX STORY FEED ENGINE
// ═══════════════════════════════════════════

export interface ForexStory {
  title: string;
  category: "Macro" | "Central Bank" | "Geopolitical" | "Technical" | "Flow" | "EM" | "India";
  icon: string;
  timestamp: string;
  summary: string;
  aiInsight: string;
  affectedPairs: string[];
  sentiment: "Bullish" | "Bearish" | "Neutral";
  impact: "High" | "Medium" | "Low";
  beginnerTakeaway: string;
}

export function generateForexStories(): ForexStory[] {
  return [
    { title: "Dollar Index Tests 105 as US Yields Surge on Hot Jobs Data", category: "Macro", icon: "💪", timestamp: "2 hours ago", summary: "DXY surged to 104.8 after Non-Farm Payrolls came in at 272K vs 180K expected. US 10-year yield spiked 12bps to 4.58%. Markets repriced Fed cuts from 3 to 2 for 2026.", aiInsight: "Strong payrolls reduce Fed cut urgency. USD rally has room to extend if CPI also surprises hot. Key level: DXY 105.50 (200-day MA) — break above confirms bullish trend.", affectedPairs: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/INR"], sentiment: "Bullish", impact: "High", beginnerTakeaway: "More US jobs = stronger dollar. The Fed won't cut rates if the economy is too strong, making USD more attractive." },
    { title: "ECB Cuts Rates to 3.25% — Lagarde Signals More Easing Ahead", category: "Central Bank", icon: "🏛️", timestamp: "5 hours ago", summary: "ECB delivered a widely expected 25bps cut and signaled continued easing. Lagarde emphasized downside risks to growth and inflation approaching target. EUR/USD fell 40 pips.", aiInsight: "ECB-Fed divergence widening further. EUR/USD path of least resistance is lower toward 1.06 support. But positioning is already stretched short EUR — watch for mean reversion squeeze.", affectedPairs: ["EUR/USD", "EUR/GBP", "EUR/JPY"], sentiment: "Bearish", impact: "High", beginnerTakeaway: "ECB cutting rates makes the euro weaker because investors earn less holding euros. Money flows to higher-yielding currencies like USD." },
    { title: "BOJ's Ueda Hints at July Rate Hike — JPY Surges 150 Pips", category: "Central Bank", icon: "🇯🇵", timestamp: "8 hours ago", summary: "Governor Ueda surprised markets by suggesting conditions may warrant a rate adjustment 'in the near term.' USD/JPY dropped from 158.50 to 157.00 as carry trades partially unwound.", aiInsight: "This is a significant shift in BOJ rhetoric. If July hike materializes, USD/JPY could test 150 as $1T+ carry trade positions get squeezed. Watch spring wage negotiations for confirmation.", affectedPairs: ["USD/JPY", "EUR/JPY", "AUD/JPY"], sentiment: "Bearish", impact: "High", beginnerTakeaway: "When Japan raises rates, the yen gets stronger because investors start unwinding 'carry trades' — borrowing cheap yen to invest in higher-yielding currencies." },
    { title: "Oil Surges Past $85 — INR and Emerging Markets Under Pressure", category: "Geopolitical", icon: "🛢️", timestamp: "1 day ago", summary: "Brent crude jumped 4% on OPEC+ production cut extension. India imports 85% of its oil, putting pressure on current account deficit. USD/INR tested 85.50.", aiInsight: "Higher oil = wider Indian current account deficit = INR weakness. But RBI has $640B in reserves to smooth volatility. USD/INR likely capped at 86.00 due to intervention. Watch for RBI dollar sales.", affectedPairs: ["USD/INR", "USD/TRY", "USD/ZAR", "USD/BRL"], sentiment: "Bearish", impact: "High", beginnerTakeaway: "India imports most of its oil. When oil prices rise, India needs more dollars to buy oil, which pushes the rupee weaker against the dollar." },
    { title: "China's PMI Drops Below 48 — CNY Breaks 7.30 Handle", category: "EM", icon: "🇨🇳", timestamp: "1 day ago", summary: "Manufacturing PMI fell to 47.8, signaling accelerating contraction. PBOC set a stronger daily fixing, but USD/CNY broke above 7.30 for the first time since Nov 2023. AUD/USD fell in sympathy.", aiInsight: "China slowdown has contagion effects: AUD (China's #1 trade partner) weakens, commodity currencies suffer, and EM risk premium rises. PBOC will likely cut rates further, but this could accelerate capital outflows.", affectedPairs: ["USD/CNY", "AUD/USD", "NZD/USD", "USD/SGD"], sentiment: "Bearish", impact: "Medium", beginnerTakeaway: "China is the world's factory. When China's economy slows, countries that sell to China (like Australia) see their currencies weaken too." },
    { title: "Swiss Franc Rallies as Safe Haven — Gold Hits Record", category: "Flow", icon: "🏔️", timestamp: "2 days ago", summary: "CHF and gold surged simultaneously as geopolitical tensions escalated. USD/CHF fell to 0.875, the lowest in 3 months. Gold broke above $2,400/oz.", aiInsight: "Classic risk-off playbook: CHF + JPY + Gold + US Treasuries all rallying together. This pattern suggests institutional desks are reducing risk. Watch VIX — above 20 would confirm broad risk-off.", affectedPairs: ["USD/CHF", "EUR/CHF", "GBP/CHF"], sentiment: "Bullish", impact: "Medium", beginnerTakeaway: "Switzerland is seen as financially safe. When the world gets scary, investors buy Swiss francs and gold as 'safe havens' — pushing CHF higher." },
    { title: "RBI Holds Rate at 6.00% — INR Stable on FX Intervention", category: "India", icon: "🇮🇳", timestamp: "3 days ago", summary: "RBI kept repo rate unchanged at 6.00% as expected, maintaining accommodative stance. USD/INR remained in tight 85.00-85.50 range as RBI actively managed both sides.", aiInsight: "RBI's managed float keeps INR artificially stable. This is good for importers/exporters planning but masks underlying pressure. Forward premiums suggest market expects gradual INR depreciation of 2-3% annually.", affectedPairs: ["USD/INR", "EUR/INR", "GBP/INR"], sentiment: "Neutral", impact: "Medium", beginnerTakeaway: "RBI actively buys and sells dollars to keep the rupee stable. That's why INR doesn't move wildly like other currencies — the central bank acts like a shock absorber." },
    { title: "GBP/USD Technical Breakout — Tests 1.2800 Resistance", category: "Technical", icon: "📊", timestamp: "3 days ago", summary: "Cable broke above 1.2750 descending trendline resistance on strong UK services PMI data. RSI turned bullish above 55. Next resistance at 1.2800-1.2850.", aiInsight: "Technical breakout confirmed with above-average volume. If 1.2800 is cleared, next target is 1.2950 (61.8% Fib retracement). Risk: US CPI this week could reverse the move if hot.", affectedPairs: ["GBP/USD", "EUR/GBP"], sentiment: "Bullish", impact: "Low", beginnerTakeaway: "When a currency pair breaks above a key level that previously acted as a ceiling, it often signals more upside ahead — like breaking through a resistance barrier." },
  ];
}

// ═══════════════════════════════════════════
// 5. GLOBAL MARKET CLOCKS & SESSIONS
// ═══════════════════════════════════════════

export interface MarketSession {
  city: string;
  flag: string;
  timezone: string;
  utcOffset: number; // hours
  openHour: number;  // local hour
  closeHour: number;
  activePairs: string[];
  peakVolatility: string;
  color: string;
}

export const MARKET_SESSIONS: MarketSession[] = [
  { city: "Sydney", flag: "🇦🇺", timezone: "AEST (UTC+10)", utcOffset: 10, openHour: 7, closeHour: 16, activePairs: ["AUD/USD", "NZD/USD", "AUD/JPY"], peakVolatility: "Low — mainly AUD/NZD pairs", color: "#00695c" },
  { city: "Tokyo", flag: "🇯🇵", timezone: "JST (UTC+9)", utcOffset: 9, openHour: 9, closeHour: 18, activePairs: ["USD/JPY", "EUR/JPY", "AUD/JPY"], peakVolatility: "Medium — JPY pairs active", color: "#c62828" },
  { city: "Singapore", flag: "🇸🇬", timezone: "SGT (UTC+8)", utcOffset: 8, openHour: 8, closeHour: 17, activePairs: ["USD/SGD", "USD/CNY", "USD/INR"], peakVolatility: "Medium — Asian FX hub", color: "#e65100" },
  { city: "Dubai", flag: "🇦🇪", timezone: "GST (UTC+4)", utcOffset: 4, openHour: 8, closeHour: 17, activePairs: ["USD/AED", "USD/SAR", "Gold"], peakVolatility: "Moderate — bridge between Asia and Europe", color: "#ff6f00" },
  { city: "London", flag: "🇬🇧", timezone: "GMT/BST (UTC+0/+1)", utcOffset: 1, openHour: 8, closeHour: 17, activePairs: ["EUR/USD", "GBP/USD", "EUR/GBP"], peakVolatility: "Very High — 43% of global FX volume", color: "#0d47a1" },
  { city: "New York", flag: "🇺🇸", timezone: "EST (UTC-5)", utcOffset: -5, openHour: 8, closeHour: 17, activePairs: ["EUR/USD", "USD/JPY", "USD/CAD"], peakVolatility: "Very High — US data releases", color: "#1565c0" },
];

export function getSessionStatus(session: MarketSession): { isOpen: boolean; status: string; color: string } {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const localHour = (utcHour + session.utcOffset + 24) % 24;

  const isOpen = localHour >= session.openHour && localHour < session.closeHour;
  if (isOpen) {
    if (localHour < session.openHour + 2) return { isOpen: true, status: "Opening", color: "#ff9800" };
    if (localHour >= session.closeHour - 1) return { isOpen: true, status: "Closing Soon", color: "#e65100" };
    return { isOpen: true, status: "Open", color: "#00c853" };
  }
  return { isOpen: false, status: "Closed", color: "#757575" };
}

// ═══════════════════════════════════════════
// 6. TECHNICAL ANALYSIS ENGINE
// ═══════════════════════════════════════════

export interface TechnicalIndicator {
  name: string;
  abbr: string;
  value: number;
  signal: "Buy" | "Sell" | "Neutral";
  signalColor: string;
  description: string;
  beginnerTip: string;
}

export interface TechnicalAnalysisReport {
  pair: string;
  overallSignal: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  overallColor: string;
  buyCount: number;
  sellCount: number;
  neutralCount: number;
  indicators: TechnicalIndicator[];
  supportLevels: number[];
  resistanceLevels: number[];
  pivotPoint: number;
  trendStrength: number;
  volatility: number;
}

export function generateTechnicalAnalysis(pair: string, base: string, quote: string): TechnicalAnalysisReport {
  const rng = seededRng(`tech-${pair}`);
  const isJPY = quote === "JPY";
  const basePrice = BASE_RATES_VS_USD[quote] ? (BASE_RATES_VS_USD[quote] / (BASE_RATES_VS_USD[base] || 1)) : 1;
  const priceScale = isJPY ? 0.5 : (basePrice > 10 ? 0.3 : 0.005);

  const signal = (v: number): "Buy" | "Sell" | "Neutral" => v > 0.6 ? "Buy" : v < 0.4 ? "Sell" : "Neutral";
  const sigColor = (s: string) => s === "Buy" ? "#00c853" : s === "Sell" ? "#c62828" : "#ff9800";

  const indicators: TechnicalIndicator[] = [
    (() => { const v = +(30 + rng() * 40).toFixed(1); const s = v > 70 ? "Sell" : v < 30 ? "Buy" : "Neutral"; return { name: "Relative Strength Index", abbr: "RSI (14)", value: v, signal: s, signalColor: sigColor(s), description: `RSI at ${v}. ${v > 70 ? "Overbought — potential reversal down" : v < 30 ? "Oversold — potential reversal up" : "Neutral zone — no strong signal"}.`, beginnerTip: "RSI measures if a currency has been bought too much (>70) or sold too much (<30). Extreme readings often mean a reversal is coming." }; })(),
    (() => { const v = +((rng() - 0.5) * 0.02).toFixed(5); const s = v > 0 ? "Buy" : v < 0 ? "Sell" : "Neutral"; return { name: "MACD", abbr: "MACD (12,26,9)", value: +v.toFixed(5), signal: s, signalColor: sigColor(s), description: `MACD is ${v > 0 ? "positive — bullish momentum" : "negative — bearish momentum"}. ${Math.abs(v) > 0.01 ? "Strong signal." : "Weak signal — wait for confirmation."}`, beginnerTip: "MACD shows if a trend is getting stronger or weaker. When MACD crosses above zero, it's a buy signal. Below zero is a sell signal." }; })(),
    (() => { const rsi = rng(); const s = signal(rsi); return { name: "Stochastic Oscillator", abbr: "Stoch (14,3,3)", value: +(rsi * 100).toFixed(1), signal: s, signalColor: sigColor(s), description: `Stochastic at ${(rsi * 100).toFixed(1)}. ${rsi > 0.8 ? "Overbought territory" : rsi < 0.2 ? "Oversold territory" : "Neutral"}.`, beginnerTip: "Like RSI but more sensitive. Values above 80 suggest the pair is overbought (might fall); below 20 suggests oversold (might rise)." }; })(),
    (() => { const rsi = rng(); const s = signal(rsi); return { name: "Moving Average (50)", abbr: "MA50", value: +(basePrice * (0.99 + rng() * 0.02)).toFixed(4), signal: s, signalColor: sigColor(s), description: `Price is ${rsi > 0.5 ? "above" : "below"} the 50-day moving average — ${rsi > 0.5 ? "bullish" : "bearish"} short-term trend.`, beginnerTip: "The 50-day average smooths out price noise. If the current price is above it, the short-term trend is up. Below it means the trend is down." }; })(),
    (() => { const rsi = rng(); const s = signal(rsi); return { name: "Moving Average (200)", abbr: "MA200", value: +(basePrice * (0.97 + rng() * 0.06)).toFixed(4), signal: s, signalColor: sigColor(s), description: `Price is ${rsi > 0.5 ? "above" : "below"} the 200-day moving average — ${rsi > 0.5 ? "bullish" : "bearish"} long-term trend.`, beginnerTip: "The 200-day average defines the big trend. Price above it = long-term uptrend. Below it = downtrend. Institutional traders watch this closely." }; })(),
    (() => { const v = +(0.3 + rng() * 1.5).toFixed(2); const s = v > 1.0 ? "Sell" : v < 0.6 ? "Buy" : "Neutral"; return { name: "Average True Range", abbr: "ATR (14)", value: v, signal: s as "Buy" | "Sell" | "Neutral", signalColor: sigColor(s), description: `ATR at ${v}%. ${v > 1.2 ? "High volatility — wider stops needed" : v < 0.5 ? "Low volatility — potential breakout building" : "Normal volatility"}.`, beginnerTip: "ATR tells you how much a pair typically moves each day. High ATR = big daily swings. Low ATR = small, calm movements. Use it to set stop-losses." }; })(),
    (() => { const v = rng(); const s = v > 0.55 ? "Buy" : v < 0.45 ? "Sell" : "Neutral"; return { name: "Bollinger Bands", abbr: "BB (20,2)", value: +(v * 100).toFixed(0), signal: s, signalColor: sigColor(s), description: `Price is ${v > 0.8 ? "near upper band — potential reversal" : v < 0.2 ? "near lower band — potential bounce" : "within bands — trending"}.`, beginnerTip: "Bollinger Bands create a channel around price. When price touches the upper band, it might fall back. Near the lower band, it might bounce up." }; })(),
    (() => { const v = rng(); const s = v > 0.5 ? "Buy" : "Sell"; return { name: "Ichimoku Cloud", abbr: "Ichimoku", value: +(v * 100).toFixed(0), signal: s, signalColor: sigColor(s), description: `Price is ${v > 0.5 ? "above the cloud — bullish" : "below the cloud — bearish"}. ${v > 0.7 || v < 0.3 ? "Strong trend." : "Weak signal — near cloud edge."}`, beginnerTip: "Ichimoku creates a colored 'cloud' on the chart. Price above the cloud = uptrend. Below = downtrend. Inside the cloud = no clear direction." }; })(),
  ];

  const buyCount = indicators.filter(i => i.signal === "Buy").length;
  const sellCount = indicators.filter(i => i.signal === "Sell").length;
  const neutralCount = indicators.filter(i => i.signal === "Neutral").length;

  let overallSignal: TechnicalAnalysisReport["overallSignal"];
  let overallColor: string;
  if (buyCount >= 6) { overallSignal = "Strong Buy"; overallColor = "#00833a"; }
  else if (buyCount >= 4) { overallSignal = "Buy"; overallColor = "#00c853"; }
  else if (sellCount >= 6) { overallSignal = "Strong Sell"; overallColor = "#b71c1c"; }
  else if (sellCount >= 4) { overallSignal = "Sell"; overallColor = "#c62828"; }
  else { overallSignal = "Neutral"; overallColor = "#ff9800"; }

  const pivot = basePrice * (1 + (rng() - 0.5) * 0.01);
  return {
    pair, overallSignal, overallColor, buyCount, sellCount, neutralCount,
    indicators,
    supportLevels: [+(pivot - priceScale * 3).toFixed(4), +(pivot - priceScale * 2).toFixed(4), +(pivot - priceScale).toFixed(4)],
    resistanceLevels: [+(pivot + priceScale).toFixed(4), +(pivot + priceScale * 2).toFixed(4), +(pivot + priceScale * 3).toFixed(4)],
    pivotPoint: +pivot.toFixed(4),
    trendStrength: Math.floor(30 + rng() * 60),
    volatility: +(5 + rng() * 20).toFixed(1),
  };
}

// ═══════════════════════════════════════════
// 7. TRAVEL & BUSINESS FX ENGINE
// ═══════════════════════════════════════════

export interface TravelConversion {
  category: string;
  icon: string;
  amountINR: number;
  amountForeign: string;
  description: string;
  tip: string;
}

export function generateTravelInsights(targetCurrency: string): TravelConversion[] {
  const rate = (BASE_RATES_VS_USD[targetCurrency] || 1) / (BASE_RATES_VS_USD["INR"] || 85.2);
  const fmt = (v: number) => v < 0.01 ? v.toFixed(6) : v < 1 ? v.toFixed(4) : v < 100 ? v.toFixed(2) : v.toFixed(0);

  return [
    { category: "Daily Hotel Budget", icon: "🏨", amountINR: 8000, amountForeign: fmt(8000 * rate), description: "Mid-range hotel per night", tip: "Book in advance for better rates. Consider Airbnb for longer stays." },
    { category: "Meal Cost", icon: "🍽️", amountINR: 1500, amountForeign: fmt(1500 * rate), description: "Restaurant meal for two", tip: "Local eateries offer authentic food at 30-50% less than tourist areas." },
    { category: "Monthly Rent", icon: "🏠", amountINR: 60000, amountForeign: fmt(60000 * rate), description: "1BHK apartment in city center", tip: "Rental costs vary hugely by city. Use numbeo.com for accurate cost of living data." },
    { category: "University Semester", icon: "🎓", amountINR: 2500000, amountForeign: fmt(2500000 * rate), description: "Typical international tuition per semester", tip: "Lock in exchange rates with a forward contract for known future payments. INR depreciation of 3-4% annually adds ~₹1L to annual costs." },
    { category: "Import Shipment", icon: "📦", amountINR: 500000, amountForeign: fmt(500000 * rate), description: "Small business import order", tip: "Use hedging instruments (forwards) for large imports. Bank rates include 1-3% markup — negotiate or use forex services." },
    { category: "NRI Remittance", icon: "💸", amountINR: 100000, amountForeign: fmt(100000 * rate), description: "Monthly family remittance", tip: "Compare services like Wise, Remitly vs bank wire transfers. Specialist services save 1-3% on exchange rates." },
    { category: "Emergency Medical", icon: "🏥", amountINR: 300000, amountForeign: fmt(300000 * rate), description: "Emergency hospital visit abroad", tip: "Always buy travel insurance covering medical expenses. A single hospital visit in the US can cost ₹10-50 lakhs." },
    { category: "Shopping Budget", icon: "🛍️", amountINR: 50000, amountForeign: fmt(50000 * rate), description: "Weekly shopping budget", tip: "Use a zero-forex-markup card (like Niyo, Fi) abroad. Regular cards charge 2-3.5% forex markup." },
  ];
}

// ═══════════════════════════════════════════
// 8. FOREX ↔ GLOBAL MARKET IMPACT
// ═══════════════════════════════════════════

export interface MarketImpactLink {
  title: string;
  icon: string;
  fxDirection: string;
  marketImpact: string;
  mechanism: string;
  example: string;
  affectedPairs: string[];
  color: string;
  beginnerExplanation: string;
}

export const FOREX_MARKET_IMPACTS: MarketImpactLink[] = [
  { title: "Strong USD → Stock Markets", icon: "📈", fxDirection: "USD ↑", marketImpact: "US Stocks ↓ (multinationals), EM Stocks ↓↓", mechanism: "Strong dollar reduces overseas revenue for US companies and increases USD-denominated debt burden for EM companies.", example: "When DXY rose from 100 to 114 in 2022, S&P 500 fell 25% and MSCI EM fell 30%.", affectedPairs: ["DXY", "EUR/USD", "USD/EM pairs"], color: "#c62828", beginnerExplanation: "When the dollar gets stronger, American companies that sell abroad earn less (in dollar terms). It's also harder for poorer countries to repay dollar loans." },
  { title: "Weak JPY → Japanese Stocks", icon: "🇯🇵", fxDirection: "JPY ↓", marketImpact: "Nikkei 225 ↑", mechanism: "Weak yen boosts Japanese exporter earnings (Toyota, Sony) as overseas revenue translates to more yen.", example: "USD/JPY rising from 100 to 150 helped Nikkei rally from 28,000 to 40,000 (2023-2024).", affectedPairs: ["USD/JPY", "EUR/JPY"], color: "#00695c", beginnerExplanation: "Japan exports a lot of cars and electronics. When the yen is weak, a $30,000 car earns more yen for Toyota — boosting their profits and stock price." },
  { title: "Oil Prices → INR & Commodity FX", icon: "🛢️", fxDirection: "Oil ↑", marketImpact: "INR ↓, CAD ↑, NOK ↑, RUB ↑", mechanism: "Oil importers (India, Japan) face wider trade deficits = weaker currency. Oil exporters (Canada, Norway, Russia) benefit from higher revenue.", example: "2022 oil spike to $130 pushed USD/INR from 74 to 83. Meanwhile, CAD strengthened 5%.", affectedPairs: ["USD/INR", "USD/CAD", "USD/NOK"], color: "#e65100", beginnerExplanation: "India buys 85% of its oil from abroad. When oil prices rise, India needs more dollars to buy oil, pushing the rupee weaker. Canada sells oil, so higher prices = stronger Canadian dollar." },
  { title: "Bond Yields → Currency Flows", icon: "📊", fxDirection: "US Yields ↑", marketImpact: "USD ↑, EM currencies ↓, Gold ↓", mechanism: "Higher US yields attract global capital to US bonds, increasing dollar demand. Higher yields also increase the opportunity cost of holding non-yielding gold.", example: "US 10Y rising from 3.5% to 5% in 2023 pushed DXY from 100 to 107, gold from $2,050 to $1,800.", affectedPairs: ["EUR/USD", "USD/JPY", "Gold/USD"], color: "#0d47a1", beginnerExplanation: "When US government bonds pay more interest, everyone wants to buy them — needing dollars to do so. This pushes the dollar up and other currencies down." },
  { title: "Risk Sentiment → Safe Havens", icon: "🏔️", fxDirection: "Fear ↑", marketImpact: "USD ↑, JPY ↑, CHF ↑, Gold ↑", mechanism: "During crises, capital flows to safe havens. The US dollar benefits from its reserve currency status. JPY benefits from carry trade unwind.", example: "COVID March 2020: DXY spiked to 103, USD/JPY briefly fell to 102, gold hit $2,075.", affectedPairs: ["USD/CHF", "USD/JPY", "Gold/USD"], color: "#7c3aed", beginnerExplanation: "When bad news hits, investors panic and move money to 'safe' places — US dollars, Swiss francs, Japanese yen, and gold. These are like financial bomb shelters." },
  { title: "Inflation → Currency Purchasing Power", icon: "📈", fxDirection: "High Inflation", marketImpact: "Currency ↓ (long-term), ↑ (short-term if rate hike)", mechanism: "High inflation erodes purchasing power (currency negative), but may trigger rate hikes (currency positive short-term). Net effect depends on central bank response.", example: "Turkey's 85% inflation in 2022 caused TRY to collapse 40%. But UK inflation caused BoE hikes, supporting GBP initially.", affectedPairs: ["USD/TRY", "GBP/USD", "EUR/USD"], color: "#ff6f00", beginnerExplanation: "If prices in a country are rising fast (inflation), each unit of currency buys less. But if the central bank raises interest rates to fight inflation, the currency can actually get stronger temporarily." },
  { title: "Trade Wars → Tariff Impact", icon: "🌐", fxDirection: "Tariffs ↑", marketImpact: "Target country currency ↓, USD ↑ (safe haven), Commodity FX ↓", mechanism: "Tariffs reduce trade volumes, hurt exporter earnings, and create uncertainty — triggering safe haven demand.", example: "US-China trade war 2018-19: CNY fell from 6.30 to 7.18, AUD fell 10%, DXY rose 8%.", affectedPairs: ["USD/CNY", "AUD/USD", "USD/MXN"], color: "#c62828", beginnerExplanation: "When countries impose tariffs on each other's goods, it hurts trade. The country being targeted usually sees its currency fall because investors worry about its economy." },
  { title: "Global Growth → EM & Commodity FX", icon: "🌍", fxDirection: "Growth ↑", marketImpact: "EM currencies ↑, AUD ↑, NZD ↑, USD ↓", mechanism: "Strong global growth drives commodity demand (supporting exporters), increases risk appetite (capital flows to EM), and reduces safe-haven demand (USD weakens).", example: "2020-21 recovery: MSCI EM FX index rose 12%, AUD/USD rallied from 0.57 to 0.80, DXY fell from 103 to 89.", affectedPairs: ["AUD/USD", "NZD/USD", "USD/ZAR", "USD/BRL"], color: "#00c853", beginnerExplanation: "When the world economy is growing well, investors feel confident and move money to riskier, higher-yielding countries. This strengthens emerging market currencies and weakens the dollar." },
];

// ═══════════════════════════════════════════
// 9. FOREX NAVIGATION SECTIONS
// ═══════════════════════════════════════════

export type ForexSection =
  | "copilot" | "converter" | "strength" | "macro" | "stories"
  | "technicals" | "calendar" | "impact" | "travel" | "clocks"
  | "risk" | "heatmap";

export const FOREX_NAV_SECTIONS: { id: ForexSection; label: string; icon: string }[] = [
  { id: "copilot", label: "AI Copilot", icon: "🧠" },
  { id: "converter", label: "Converter", icon: "💱" },
  { id: "strength", label: "Strength", icon: "💪" },
  { id: "macro", label: "Central Banks", icon: "🏛️" },
  { id: "stories", label: "Story Feed", icon: "📰" },
  { id: "technicals", label: "Technicals", icon: "📊" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "impact", label: "FX Impact", icon: "🌐" },
  { id: "travel", label: "Travel FX", icon: "✈️" },
  { id: "clocks", label: "Market Clocks", icon: "🕐" },
  { id: "heatmap", label: "Heatmap", icon: "🗺️" },
  { id: "risk", label: "Risk", icon: "⚠️" },
];
