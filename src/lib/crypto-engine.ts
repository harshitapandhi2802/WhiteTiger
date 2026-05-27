// ═══════════════════════════════════════════════════════════════════════
// CRYPTO INTELLIGENCE ENGINE v2.0
// AI Copilot · On-Chain Analytics · Market Stories · Heatmaps
// Macro Impact · Risk Engine · Derivatives/ETF · Education
// ═══════════════════════════════════════════════════════════════════════

function seededRng(seed: string | number) {
  let h = typeof seed === "number" ? seed : 0;
  if (typeof seed === "string") for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}

// ─── Types ───────────────────────────────────────────────────────────

export type CryptoSection = typeof CRYPTO_NAV_SECTIONS[number]["id"];

export interface TopCoinCard {
  name: string;
  symbol: string;
  category: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: string;
  volume24h: string;
  dominance?: number;
  sparkline: number[];
  aiSentiment: "Bullish" | "Bearish" | "Neutral";
  sentimentColor: string;
}

export interface CryptoCopilotNarrative {
  marketMood: string;
  moodEmoji: string;
  moodColor: string;
  summary: string;
  beginnerSummary: string;
  keyDrivers: { driver: string; impact: "bullish" | "bearish" | "neutral"; explanation: string; beginnerTip: string }[];
  topPicks: { name: string; symbol: string; reason: string; tag: string }[];
  avoidList: { name: string; reason: string }[];
  btcOutlook: string;
  altseasonSignal: string;
}

export interface CryptoStory {
  headline: string;
  summary: string;
  impact: "bullish" | "bearish" | "neutral";
  category: string;
  timeAgo: string;
  beginnerExplanation: string;
}

export interface OnChainMetric {
  name: string;
  value: string;
  change: string;
  changeDir: "up" | "down" | "flat";
  signal: "Bullish" | "Bearish" | "Neutral";
  signalColor: string;
  explanation: string;
  beginnerTip: string;
  icon: string;
}

export interface HeatmapSector {
  name: string;
  change24h: number;
  marketCap: string;
  coins: { name: string; symbol: string; change24h: number; size: number }[];
}

export interface CryptoMacroImpact {
  factor: string;
  currentState: string;
  cryptoImpact: string;
  affectedCoins: string[];
  direction: "positive" | "negative" | "neutral";
  beginnerExplanation: string;
}

export interface CryptoRiskMetric {
  name: string;
  value: number;
  maxValue: number;
  level: "Low" | "Medium" | "High" | "Extreme";
  levelColor: string;
  explanation: string;
  beginnerTip: string;
}

export interface DerivativeMetric {
  name: string;
  value: string;
  change: string;
  signal: "Bullish" | "Bearish" | "Neutral";
  explanation: string;
  beginnerTip: string;
}

export interface CryptoEducationTerm {
  term: string;
  category: "Basics" | "DeFi" | "Trading" | "On-Chain" | "Security" | "Ecosystem";
  simpleExplanation: string;
  analogy: string;
  whyItMatters: string;
  example: string;
}

export interface EcosystemCard {
  name: string;
  category: string;
  tvl: string;
  change7d: number;
  topProtocols: string[];
  aiSummary: string;
  color: string;
}

export interface RegulationEvent {
  headline: string;
  body: string;
  region: string;
  impact: "bullish" | "bearish" | "neutral";
  timeAgo: string;
  beginnerNote: string;
}

// ─── TOP COINS HERO ─────────────────────────────────────────────────

export function generateTopCoins(): TopCoinCard[] {
  const rng = seededRng("top-coins-v2");
  const r = (min: number, max: number) => +(min + rng() * (max - min)).toFixed(2);
  const spark = (base: number) => {
    const d: number[] = [];
    let v = base;
    for (let i = 0; i < 24; i++) { v += (rng() - 0.48) * base * 0.02; d.push(+v.toFixed(2)); }
    return d;
  };
  const sent = (): { aiSentiment: "Bullish" | "Bearish" | "Neutral"; sentimentColor: string } => {
    const v = rng();
    return v > 0.55 ? { aiSentiment: "Bullish", sentimentColor: "#10b981" } : v > 0.25 ? { aiSentiment: "Neutral", sentimentColor: "#f59e0b" } : { aiSentiment: "Bearish", sentimentColor: "#ef4444" };
  };

  return [
    { name: "Bitcoin", symbol: "BTC", category: "Layer 1", price: r(65000, 72000), change24h: r(-3, 5), change7d: r(-5, 8), marketCap: `$${r(1.28, 1.42)}T`, volume24h: `$${r(25, 45)}B`, dominance: r(50, 56), sparkline: spark(68000), ...sent() },
    { name: "Ethereum", symbol: "ETH", category: "Layer 1", price: r(3200, 3800), change24h: r(-4, 6), change7d: r(-6, 10), marketCap: `$${r(380, 460)}B`, volume24h: `$${r(12, 22)}B`, dominance: r(16, 19), sparkline: spark(3500), ...sent() },
    { name: "Solana", symbol: "SOL", category: "Layer 1", price: r(140, 195), change24h: r(-5, 8), change7d: r(-8, 15), marketCap: `$${r(62, 88)}B`, volume24h: `$${r(2.5, 6)}B`, sparkline: spark(165), ...sent() },
    { name: "BNB", symbol: "BNB", category: "Exchange", price: r(580, 660), change24h: r(-3, 4), change7d: r(-4, 6), marketCap: `$${r(87, 100)}B`, volume24h: `$${r(1.2, 3)}B`, sparkline: spark(620), ...sent() },
    { name: "XRP", symbol: "XRP", category: "Payments", price: r(0.52, 0.68), change24h: r(-4, 6), change7d: r(-6, 10), marketCap: `$${r(28, 37)}B`, volume24h: `$${r(1, 3)}B`, sparkline: spark(0.6), ...sent() },
    { name: "Cardano", symbol: "ADA", category: "Layer 1", price: r(0.42, 0.58), change24h: r(-5, 7), change7d: r(-8, 12), marketCap: `$${r(15, 21)}B`, volume24h: `$${r(0.4, 1.2)}B`, sparkline: spark(0.5), ...sent() },
    { name: "Dogecoin", symbol: "DOGE", category: "Meme", price: r(0.12, 0.18), change24h: r(-6, 10), change7d: r(-10, 18), marketCap: `$${r(17, 26)}B`, volume24h: `$${r(0.8, 2.5)}B`, sparkline: spark(0.15), ...sent() },
    { name: "Avalanche", symbol: "AVAX", category: "Layer 1", price: r(32, 48), change24h: r(-5, 8), change7d: r(-8, 14), marketCap: `$${r(12, 18)}B`, volume24h: `$${r(0.5, 1.5)}B`, sparkline: spark(40), ...sent() },
    { name: "Chainlink", symbol: "LINK", category: "Oracle", price: r(14, 22), change24h: r(-4, 7), change7d: r(-6, 12), marketCap: `$${r(8.5, 13)}B`, volume24h: `$${r(0.4, 1.2)}B`, sparkline: spark(18), ...sent() },
    { name: "Polkadot", symbol: "DOT", category: "Layer 0", price: r(6.5, 9.5), change24h: r(-5, 7), change7d: r(-8, 12), marketCap: `$${r(8.8, 13)}B`, volume24h: `$${r(0.3, 0.9)}B`, sparkline: spark(8), ...sent() },
    { name: "Polygon", symbol: "MATIC", category: "Layer 2", price: r(0.65, 0.95), change24h: r(-5, 8), change7d: r(-8, 14), marketCap: `$${r(6, 9.5)}B`, volume24h: `$${r(0.3, 0.8)}B`, sparkline: spark(0.8), ...sent() },
    { name: "Pepe", symbol: "PEPE", category: "Meme", price: r(0.0000085, 0.000018), change24h: r(-10, 20), change7d: r(-15, 30), marketCap: `$${r(3.5, 7.5)}B`, volume24h: `$${r(0.5, 2)}B`, sparkline: spark(0.000012), ...sent() },
  ];
}

// ─── AI CRYPTO COPILOT ──────────────────────────────────────────────

export function generateCryptoCopilot(): CryptoCopilotNarrative {
  const rng = seededRng(Date.now().toString().slice(0, -4));
  const moods = [
    { mood: "Greed Mode — Risk On", emoji: "\u{1f7e2}", color: "#10b981" },
    { mood: "Cautious Optimism", emoji: "\u{1f7e1}", color: "#f59e0b" },
    { mood: "Fear & Uncertainty", emoji: "\u{1f534}", color: "#ef4444" },
    { mood: "Accumulation Phase", emoji: "\u{1f535}", color: "#3b82f6" },
  ];
  const m = moods[Math.floor(rng() * moods.length)];
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];

  return {
    marketMood: m.mood, moodEmoji: m.emoji, moodColor: m.color,
    summary: `Crypto markets are in ${m.mood.toLowerCase()}. Bitcoin is trading near $${(65000 + rng() * 7000).toFixed(0)} with ${rng() > 0.5 ? "increasing" : "stable"} institutional ETF flows. Ethereum's ecosystem activity remains strong with Layer-2 networks processing record transactions. Bitcoin dominance at ${(50 + rng() * 6).toFixed(1)}% suggests ${rng() > 0.5 ? "rotation into BTC" : "broadening into alts"}. Stablecoin market cap at $${(155 + rng() * 15).toFixed(0)}B — dry powder for the next move. On-chain data shows long-term holders ${rng() > 0.5 ? "accumulating" : "holding steady"}.`,
    beginnerSummary: `In simple terms: Bitcoin and other cryptocurrencies are digital money that runs on blockchain technology. Right now, big banks and hedge funds are buying Bitcoin through ETFs (like stock funds), which is making the market grow. If you're new, start by understanding Bitcoin and Ethereum before exploring smaller coins. Never invest more than you can afford to lose — crypto can drop 20-30% in a single day.`,
    keyDrivers: [
      { driver: "Bitcoin ETF Flows", impact: rng() > 0.4 ? "bullish" : "neutral", explanation: `Spot Bitcoin ETFs saw net ${rng() > 0.5 ? "inflows" : "outflows"} of $${(rng() * 500 + 50).toFixed(0)}M this week. BlackRock's IBIT ${rng() > 0.5 ? "leading with strong demand" : "seeing moderate activity"}.`, beginnerTip: "Bitcoin ETFs let traditional investors buy Bitcoin through their stock brokerage. Big inflows mean Wall Street is buying, which pushes the price up." },
      { driver: "Federal Reserve Policy", impact: pick(["bullish", "bearish", "neutral"] as const), explanation: `Fed ${rng() > 0.5 ? "signaling potential rate cuts" : "maintaining higher-for-longer stance"}. Crypto typically rallies in loose monetary environments.`, beginnerTip: "When the Fed cuts interest rates, people move money from savings to riskier assets like crypto. Rate cuts = usually good for crypto." },
      { driver: "Bitcoin Halving Impact", impact: "bullish", explanation: `Post-halving supply reduction continuing to tighten new BTC issuance. Historically, 12-18 months post-halving sees significant price appreciation.`, beginnerTip: "Bitcoin 'halving' means miners get half the reward for creating new Bitcoin. Less new supply + same demand = price tends to go up over time." },
      { driver: "Stablecoin Liquidity", impact: rng() > 0.5 ? "bullish" : "neutral", explanation: `Total stablecoin market cap at $${(155 + rng() * 15).toFixed(0)}B. ${rng() > 0.5 ? "Growing" : "Stable"} stablecoin supply indicates ${rng() > 0.5 ? "capital waiting to deploy" : "steady market conditions"}.`, beginnerTip: "Stablecoins (USDT, USDC) are crypto dollars. When people hold lots of stablecoins, it means they have 'dry powder' — money ready to buy crypto." },
      { driver: "Regulatory Landscape", impact: pick(["bullish", "bearish", "neutral"] as const), explanation: `${pick(["SEC clarity on crypto classification improving", "Global regulatory frameworks taking shape", "MiCA regulation in EU providing certainty"])}. Institutional participation growing as compliance frameworks mature.`, beginnerTip: "Regulations sound scary but they actually help crypto grow. When rules are clear, big institutions feel safe to invest, bringing more money into the market." },
    ],
    topPicks: [
      { name: "Bitcoin", symbol: "BTC", reason: "Institutional accumulation + ETF flows + post-halving supply dynamics", tag: `Dominance: ${(50 + rng() * 6).toFixed(1)}%` },
      { name: "Ethereum", symbol: "ETH", reason: "Layer-2 ecosystem growth + potential ETH ETF catalyst + deflationary after merge", tag: `ETH/BTC: ${(0.045 + rng() * 0.012).toFixed(4)}` },
      { name: "Solana", symbol: "SOL", reason: "Fastest-growing DeFi ecosystem + institutional interest + developer activity", tag: `TPS: ${(3000 + rng() * 2000).toFixed(0)}` },
    ],
    avoidList: [
      { name: "Low-cap meme coins without utility", reason: "95% of new meme coins go to zero within 6 months. The house always wins in casino crypto." },
      { name: "Leveraged positions in volatile markets", reason: "Funding rates are elevated. Liquidation cascades can wipe positions in minutes." },
    ],
    btcOutlook: `Bitcoin remains the anchor of the crypto ecosystem. Post-halving supply dynamics combined with ETF-driven demand create a structural supply-demand imbalance. The $${(60000 + rng() * 5000).toFixed(0)} level has strong on-chain support. Long-term holders control ${(70 + rng() * 8).toFixed(0)}% of supply. Target range: $${(70000 + rng() * 20000).toFixed(0)}-$${(90000 + rng() * 20000).toFixed(0)} over 6-12 months.`,
    altseasonSignal: `Bitcoin dominance at ${(50 + rng() * 6).toFixed(1)}% — ${rng() > 0.5 ? "altseason conditions forming as BTC consolidates" : "BTC still leading, alts to follow after BTC stabilizes"}. ${rng() > 0.5 ? "Layer-1 and DeFi tokens showing relative strength" : "Meme coin activity elevated but rotation expected into utility tokens"}.`,
  };
}

// ─── CRYPTO STORY ENGINE ────────────────────────────────────────────

export function generateCryptoStories(): CryptoStory[] {
  const rng = seededRng(Date.now().toString().slice(0, -4));
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const impacts: ("bullish" | "bearish" | "neutral")[] = ["bullish", "bearish", "neutral"];

  return [
    {
      headline: `Bitcoin ETF Daily Flows: ${pick(["$320M Net Inflow", "$180M Net Outflow", "$450M Record Inflow"])} — Institutional Momentum`,
      summary: `Spot Bitcoin ETFs saw ${pick(["strong institutional buying led by BlackRock IBIT", "net redemptions as short-term holders take profit", "mixed flows with rotation between ETF providers"])}. Total AUM across all spot BTC ETFs at $${(55 + rng() * 15).toFixed(0)}B.`,
      impact: pick(impacts), category: "ETF",
      timeAgo: `${Math.floor(rng() * 4 + 1)}h ago`,
      beginnerExplanation: "Bitcoin ETFs are investment funds that hold real Bitcoin. When big investors buy these funds, it means Wall Street is betting on Bitcoin's future.",
    },
    {
      headline: `Ethereum Network Activity ${pick(["Surges", "Dips", "Stabilizes"])} — Layer-2 ${pick(["Record Volume", "Gas Optimization", "DeFi Growth"])}`,
      summary: `Ethereum's Layer-2 networks (Arbitrum, Optimism, Base) processed ${(rng() * 5 + 2).toFixed(1)}M transactions today. ${pick(["Blob fees trending lower, improving L2 economics", "DeFi TVL approaching $50B across the ecosystem", "NFT activity recovering on Base and Blast"])}.`,
      impact: pick(impacts), category: "Ecosystem",
      timeAgo: `${Math.floor(rng() * 6 + 1)}h ago`,
      beginnerExplanation: "Layer-2 networks are like express lanes for Ethereum. They make transactions faster and cheaper while still using Ethereum's security.",
    },
    {
      headline: `Whale Alert: ${pick(["10,000 BTC Moved to Cold Storage", "50,000 ETH Withdrawn from Exchange", "Large USDT Transfer to Binance"])}`,
      summary: `On-chain tracking shows ${pick(["institutional wallets accumulating BTC from exchanges — bullish supply dynamics", "a major holder moving assets to long-term cold storage, reducing sell pressure", "significant stablecoin deposits to exchanges, suggesting upcoming buying activity"])}.`,
      impact: pick(impacts), category: "On-Chain",
      timeAgo: `${Math.floor(rng() * 8 + 1)}h ago`,
      beginnerExplanation: "A 'whale' is someone who holds huge amounts of crypto. When whales move coins to cold storage (offline wallets), it means they're planning to hold long-term, which is bullish.",
    },
    {
      headline: `${pick(["Fed Minutes Signal Rate Path", "US CPI Data Impacts Risk Assets", "Global Liquidity Conditions Shift"])} — Crypto Reacts`,
      summary: `${pick(["Softer-than-expected inflation data boosted risk appetite", "Fed officials hinting at fewer rate cuts pushed yields higher", "Global central bank liquidity expanding, benefiting risk assets"])}. Bitcoin ${pick(["rallied 3%", "dipped 2%", "remained range-bound"])} in response.`,
      impact: pick(impacts), category: "Macro",
      timeAgo: `${Math.floor(rng() * 12 + 1)}h ago`,
      beginnerExplanation: "Crypto moves with traditional markets more than people think. When the economy looks good and rates are low, investors feel comfortable buying risky assets like crypto.",
    },
    {
      headline: `${pick(["SEC Provides Clarity on Crypto Classification", "Hong Kong Approves New Crypto ETF", "EU MiCA Regulation Takes Effect"])}`,
      summary: `${pick(["The regulatory landscape continues to evolve, with clearer frameworks emerging globally", "Asian markets opening up to institutional crypto products", "European regulation providing compliance certainty for exchanges and custodians"])}.`,
      impact: pick(impacts), category: "Regulation",
      timeAgo: `${Math.floor(rng() * 24 + 1)}h ago`,
      beginnerExplanation: "Government rules about crypto keep changing. Clearer rules are actually good because they make big banks and funds more comfortable investing in crypto.",
    },
    {
      headline: `Solana DeFi TVL Hits $${(4 + rng() * 3).toFixed(1)}B — ${pick(["Jupiter Leading", "Marinade Staking Surge", "Raydium Volume Record"])}`,
      summary: `Solana's DeFi ecosystem continues rapid growth with ${pick(["DEX volumes exceeding $2B daily", "new protocols launching at record pace", "institutional staking products gaining traction"])}. Network uptime at ${(99 + rng() * 0.9).toFixed(1)}% over the past quarter.`,
      impact: pick(impacts), category: "DeFi",
      timeAgo: `${Math.floor(rng() * 18 + 1)}h ago`,
      beginnerExplanation: "DeFi means 'Decentralized Finance' — it's like banking without banks. TVL (Total Value Locked) shows how much money people have put into these crypto apps.",
    },
  ];
}

// ─── ON-CHAIN ANALYTICS ─────────────────────────────────────────────

export function getOnChainMetrics(): OnChainMetric[] {
  const rng = seededRng("onchain-v2");
  const sig = (): { signal: "Bullish" | "Bearish" | "Neutral"; signalColor: string } => {
    const v = rng();
    return v > 0.55 ? { signal: "Bullish", signalColor: "#10b981" } : v > 0.25 ? { signal: "Neutral", signalColor: "#f59e0b" } : { signal: "Bearish", signalColor: "#ef4444" };
  };

  return [
    { name: "Exchange Net Flow (BTC)", value: `${rng() > 0.5 ? "-" : "+"}${(rng() * 8000 + 500).toFixed(0)} BTC`, change: `${rng() > 0.5 ? "Outflow" : "Inflow"} trend`, changeDir: rng() > 0.5 ? "down" : "up", ...sig(), explanation: "Net outflows from exchanges mean investors are moving BTC to cold storage — reducing sell pressure. Net inflows suggest potential selling ahead.", beginnerTip: "When people take their Bitcoin OFF exchanges, they're planning to hold it. This is bullish because there's less Bitcoin available to sell.", icon: "\u{1f3e6}" },
    { name: "Whale Wallet Activity", value: `${(rng() * 50 + 10).toFixed(0)} large txns/hr`, change: `${rng() > 0.5 ? "+" : "-"}${(rng() * 20 + 5).toFixed(0)}% vs avg`, changeDir: rng() > 0.5 ? "up" : "down", ...sig(), explanation: "Large wallet transactions (>$1M) indicate institutional or whale activity. Spikes often precede major price moves.", beginnerTip: "Whale transactions are like tracking what billionaire investors are doing. If they're buying, it's a positive signal.", icon: "\u{1f433}" },
    { name: "Long-Term Holder Supply", value: `${(70 + rng() * 8).toFixed(1)}%`, change: `${rng() > 0.3 ? "Increasing" : "Stable"}`, changeDir: rng() > 0.3 ? "up" : "flat", ...sig(), explanation: "Percentage of BTC supply held by addresses that haven't moved coins in 155+ days. Higher = more conviction, less sell pressure.", beginnerTip: "Long-term holders are the 'diamond hands' — people who don't panic sell. When they hold more Bitcoin, it means the strongest believers are accumulating.", icon: "\u{1f48e}" },
    { name: "Stablecoin Supply (Total)", value: `$${(155 + rng() * 15).toFixed(0)}B`, change: `${rng() > 0.5 ? "+" : ""}${(rng() * 3).toFixed(1)}% MoM`, changeDir: rng() > 0.4 ? "up" : "flat", ...sig(), explanation: "Growing stablecoin supply = more 'dry powder' available to buy crypto. USDT and USDC flows are leading indicators of market direction.", beginnerTip: "Stablecoins are crypto dollars. When their total supply grows, it means more money is sitting on the sidelines ready to buy Bitcoin and other cryptos.", icon: "\u{1f4b5}" },
    { name: "Miner Revenue & Hash Rate", value: `Hash: ${(600 + rng() * 100).toFixed(0)} EH/s`, change: `Revenue: $${(25 + rng() * 15).toFixed(0)}M/day`, changeDir: rng() > 0.5 ? "up" : "flat", ...sig(), explanation: "Higher hash rate = more security and miner confidence. Post-halving, miners need price appreciation to maintain profitability.", beginnerTip: "Hash rate measures how much computing power secures Bitcoin. More hash rate = more secure network = miners believe Bitcoin's future is bright.", icon: "⛏️" },
    { name: "Active Addresses (7D Avg)", value: `${(800 + rng() * 200).toFixed(0)}K/day`, change: `${rng() > 0.5 ? "+" : "-"}${(rng() * 8 + 1).toFixed(0)}% WoW`, changeDir: rng() > 0.5 ? "up" : "down", ...sig(), explanation: "Unique addresses interacting with the network daily. Growing active addresses = growing adoption and usage.", beginnerTip: "Active addresses are like counting how many people use a bank each day. More users = healthier network = usually bullish for the price.", icon: "\u{1f465}" },
    { name: "DeFi Total Value Locked", value: `$${(85 + rng() * 25).toFixed(0)}B`, change: `${rng() > 0.5 ? "+" : "-"}${(rng() * 5 + 0.5).toFixed(1)}% WoW`, changeDir: rng() > 0.5 ? "up" : "down", ...sig(), explanation: "Total value deposited in DeFi protocols. TVL growth shows confidence in decentralized financial applications.", beginnerTip: "TVL shows how much real money people have put into crypto apps for lending, borrowing, and trading. More money = more trust in the system.", icon: "\u{1f512}" },
    { name: "Fear & Greed Index", value: `${Math.floor(30 + rng() * 50)}`, change: rng() > 0.5 ? "Trending toward Greed" : "Trending toward Fear", changeDir: rng() > 0.5 ? "up" : "down", ...sig(), explanation: "Composite sentiment indicator (0=Extreme Fear, 100=Extreme Greed). Extreme fear often marks buying opportunities; extreme greed warns of correction.", beginnerTip: "When everyone is scared (low number), it's often a good time to buy. When everyone is greedy (high number), be careful — a drop may be coming.", icon: "\u{1f4ca}" },
  ];
}

// ─── HEATMAP SECTORS ────────────────────────────────────────────────

export function getHeatmapSectors(): HeatmapSector[] {
  const rng = seededRng("heatmap-v2");
  const r = (min: number, max: number) => +(min + rng() * (max - min)).toFixed(1);

  return [
    { name: "Layer 1", change24h: r(-3, 5), marketCap: `$${r(1.8, 2.2)}T`, coins: [
      { name: "BTC", symbol: "BTC", change24h: r(-2, 4), size: 50 },
      { name: "ETH", symbol: "ETH", change24h: r(-3, 5), size: 25 },
      { name: "SOL", symbol: "SOL", change24h: r(-5, 8), size: 8 },
      { name: "ADA", symbol: "ADA", change24h: r(-5, 7), size: 4 },
      { name: "AVAX", symbol: "AVAX", change24h: r(-6, 9), size: 3 },
      { name: "DOT", symbol: "DOT", change24h: r(-5, 7), size: 3 },
      { name: "NEAR", symbol: "NEAR", change24h: r(-6, 10), size: 2 },
      { name: "TON", symbol: "TON", change24h: r(-4, 6), size: 3 },
      { name: "APT", symbol: "APT", change24h: r(-6, 10), size: 2 },
    ]},
    { name: "DeFi", change24h: r(-4, 6), marketCap: `$${r(80, 120)}B`, coins: [
      { name: "UNI", symbol: "UNI", change24h: r(-5, 8), size: 20 },
      { name: "AAVE", symbol: "AAVE", change24h: r(-4, 7), size: 18 },
      { name: "MKR", symbol: "MKR", change24h: r(-4, 6), size: 15 },
      { name: "LINK", symbol: "LINK", change24h: r(-5, 8), size: 25 },
      { name: "INJ", symbol: "INJ", change24h: r(-6, 10), size: 10 },
      { name: "JUP", symbol: "JUP", change24h: r(-7, 12), size: 12 },
    ]},
    { name: "Meme Coins", change24h: r(-8, 15), marketCap: `$${r(50, 80)}B`, coins: [
      { name: "DOGE", symbol: "DOGE", change24h: r(-8, 12), size: 35 },
      { name: "SHIB", symbol: "SHIB", change24h: r(-10, 15), size: 25 },
      { name: "PEPE", symbol: "PEPE", change24h: r(-12, 20), size: 20 },
      { name: "BONK", symbol: "BONK", change24h: r(-15, 25), size: 10 },
      { name: "FLOKI", symbol: "FLOKI", change24h: r(-12, 18), size: 10 },
    ]},
    { name: "Layer 2", change24h: r(-4, 7), marketCap: `$${r(18, 30)}B`, coins: [
      { name: "MATIC", symbol: "MATIC", change24h: r(-5, 8), size: 35 },
      { name: "ARB", symbol: "ARB", change24h: r(-6, 10), size: 30 },
      { name: "OP", symbol: "OP", change24h: r(-6, 10), size: 25 },
      { name: "IMX", symbol: "IMX", change24h: r(-7, 12), size: 10 },
    ]},
    { name: "AI & Data", change24h: r(-5, 10), marketCap: `$${r(12, 22)}B`, coins: [
      { name: "RENDER", symbol: "RENDER", change24h: r(-6, 12), size: 30 },
      { name: "FET", symbol: "FET", change24h: r(-7, 14), size: 25 },
      { name: "WLD", symbol: "WLD", change24h: r(-8, 16), size: 20 },
      { name: "GRT", symbol: "GRT", change24h: r(-6, 10), size: 15 },
      { name: "OCEAN", symbol: "OCEAN", change24h: r(-8, 14), size: 10 },
    ]},
    { name: "Payments", change24h: r(-3, 5), marketCap: `$${r(40, 55)}B`, coins: [
      { name: "XRP", symbol: "XRP", change24h: r(-4, 6), size: 50 },
      { name: "XLM", symbol: "XLM", change24h: r(-5, 7), size: 20 },
      { name: "LTC", symbol: "LTC", change24h: r(-4, 6), size: 30 },
    ]},
  ];
}

// ─── CRYPTO ↔ MACRO IMPACT ──────────────────────────────────────────

export function getCryptoMacroImpacts(): CryptoMacroImpact[] {
  const rng = seededRng("crypto-macro-v2");
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const dirs: ("positive" | "negative" | "neutral")[] = ["positive", "negative", "neutral"];

  return [
    { factor: "Federal Reserve Policy & Rates", currentState: `Fed Funds: ${(4.75 + rng() * 0.75).toFixed(2)}% | ${pick(["Easing expected", "Higher for longer", "Data dependent"])}`, cryptoImpact: "Rate cuts dramatically increase risk appetite. The 2020-21 crypto bull run was fueled by near-zero rates. Conversely, the 2022 bear market was driven by aggressive rate hikes.", affectedCoins: ["BTC", "ETH", "All alts"], direction: pick(dirs), beginnerExplanation: "Interest rates are like gravity for investments. When rates are low, money flows into risky assets like crypto. When rates are high, people prefer safe savings accounts." },
    { factor: "US Dollar Strength (DXY)", currentState: `DXY: ${(100 + rng() * 8).toFixed(1)} | ${pick(["Strengthening", "Weakening", "Range-bound"])}`, cryptoImpact: "Bitcoin is priced in USD globally. A weaker dollar makes Bitcoin relatively cheaper for international buyers, supporting demand. DXY and BTC have a -0.7 correlation historically.", affectedCoins: ["BTC", "ETH", "Stablecoins"], direction: pick(dirs), beginnerExplanation: "When the US dollar gets weaker, Bitcoin tends to go up. It's like a seesaw — dollar goes down, Bitcoin goes up (usually)." },
    { factor: "Global Liquidity (M2)", currentState: `Global M2: $${(92 + rng() * 8).toFixed(0)}T | ${pick(["Expanding", "Contracting", "Stable"])}`, cryptoImpact: "Bitcoin has a strong correlation with global money supply. When central banks print more money, some flows into crypto as an inflation hedge. M2 expansion was the primary driver of the 2020-21 bull run.", affectedCoins: ["BTC", "ETH", "Gold-correlated tokens"], direction: pick(dirs), beginnerExplanation: "When governments and central banks create more money, the prices of everything go up — including Bitcoin. More money in the system = more money flowing into crypto." },
    { factor: "Inflation Expectations", currentState: `US CPI: ${(2.5 + rng() * 2).toFixed(1)}% | ${pick(["Cooling", "Sticky", "Rising"])}`, cryptoImpact: "Bitcoin's 'digital gold' narrative strengthens during high inflation. However, unexpected inflation can trigger rate hikes (bearish). The key is inflation EXPECTATIONS vs reality.", affectedCoins: ["BTC", "ETH", "Gold tokens"], direction: pick(dirs), beginnerExplanation: "Some people buy Bitcoin to protect against inflation — like how people buy gold. If prices in the real world keep rising, Bitcoin becomes more attractive as a store of value." },
    { factor: "Banking Stress / Credit Risk", currentState: `${pick(["Banking sector stable", "Elevated credit concerns", "Regional bank stress"])}`, cryptoImpact: "Banking crises directly benefit Bitcoin's narrative. The March 2023 SVB collapse caused BTC to rally 40% in weeks as people questioned traditional banking. Bitcoin was literally created after the 2008 banking crisis.", affectedCoins: ["BTC", "Stablecoins", "DeFi tokens"], direction: pick(dirs), beginnerExplanation: "When banks have problems, people remember why Bitcoin was created — to be money without banks. Banking crises often make Bitcoin's price jump." },
  ];
}

// ─── RISK & VOLATILITY ENGINE ───────────────────────────────────────

export function getCryptoRiskMetrics(): CryptoRiskMetric[] {
  const rng = seededRng("risk-v2");
  const level = (v: number, thresholds: number[]): { level: "Low" | "Medium" | "High" | "Extreme"; levelColor: string } => {
    if (v >= thresholds[2]) return { level: "Extreme", levelColor: "#ef4444" };
    if (v >= thresholds[1]) return { level: "High", levelColor: "#f97316" };
    if (v >= thresholds[0]) return { level: "Medium", levelColor: "#f59e0b" };
    return { level: "Low", levelColor: "#10b981" };
  };

  const fgi = Math.floor(20 + rng() * 60);
  const vol = Math.floor(40 + rng() * 40);
  const liq = Math.floor(15 + rng() * 50);
  const lev = Math.floor(20 + rng() * 50);
  const exch = Math.floor(10 + rng() * 40);
  const stab = Math.floor(5 + rng() * 30);

  return [
    { name: "Fear & Greed Index", value: fgi, maxValue: 100, ...level(fgi, [40, 60, 80]), explanation: fgi > 60 ? "Market is greedy — potential correction risk is elevated. Be cautious with new entries." : fgi < 30 ? "Extreme fear — historically the best time to buy. Markets tend to overreact to negative news." : "Neutral sentiment — market is balanced between fear and greed.", beginnerTip: "This is like a mood ring for crypto. Low numbers (fear) = potential buying opportunity. High numbers (greed) = be careful, prices might drop." },
    { name: "30-Day Volatility", value: vol, maxValue: 100, ...level(vol, [35, 55, 75]), explanation: `BTC 30-day realized volatility at ${vol}%. ${vol > 60 ? "Elevated volatility creates both risk and opportunity. Position sizing is critical." : "Moderate volatility — typical market conditions."}`, beginnerTip: "Volatility measures how wildly prices swing. High volatility means big potential gains OR big potential losses. Reduce your position sizes when volatility is high." },
    { name: "Liquidation Risk", value: liq, maxValue: 100, ...level(liq, [25, 50, 70]), explanation: `${liq > 50 ? "High open interest and leverage in derivatives. Liquidation cascades possible." : "Moderate leverage levels. Market is not overcrowded in one direction."}`, beginnerTip: "Liquidation happens when leveraged traders get 'wiped out.' High liquidation risk means the market could crash suddenly as forced selling cascades." },
    { name: "Leverage / Funding Rate", value: lev, maxValue: 100, ...level(lev, [30, 50, 70]), explanation: `Funding rates are ${lev > 50 ? "elevated — longs are paying shorts. Market is overcrowded on the bullish side." : "neutral — balanced positioning between longs and shorts."}`, beginnerTip: "Funding rates show if more people are betting 'up' or 'down.' When too many bet 'up,' the market often drops to liquidate them." },
    { name: "Exchange Risk", value: exch, maxValue: 100, ...level(exch, [20, 40, 60]), explanation: `${exch > 40 ? "Some exchange-related concerns flagged. Ensure assets are on reputable, regulated platforms." : "Exchange risk is contained. Major platforms operating normally."}`, beginnerTip: "Not all crypto exchanges are safe. Use well-known exchanges and consider moving large holdings to your own wallet (hardware wallet is best)." },
    { name: "Stablecoin Risk", value: stab, maxValue: 100, ...level(stab, [15, 35, 55]), explanation: `USDT/USDC peg stability: ${stab < 20 ? "Excellent — stablecoins trading at par." : "Minor deviations detected. Monitor closely."}`, beginnerTip: "Stablecoins should always be worth exactly $1. If they lose their peg (go below $1), it can cause massive panic across all crypto markets." },
  ];
}

// ─── DERIVATIVES & ETF INTELLIGENCE ─────────────────────────────────

export function getDerivativeMetrics(): DerivativeMetric[] {
  const rng = seededRng("deriv-v2");
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const sigs: ("Bullish" | "Bearish" | "Neutral")[] = ["Bullish", "Bearish", "Neutral"];

  return [
    { name: "BTC Spot ETF Daily Flow", value: `${rng() > 0.5 ? "+" : "-"}$${(rng() * 400 + 50).toFixed(0)}M`, change: `${rng() > 0.5 ? "3rd consecutive inflow day" : "Outflow after 5-day streak"}`, signal: pick(sigs), explanation: "Spot Bitcoin ETF flows are the single most important demand indicator. BlackRock IBIT alone has attracted $20B+ since launch.", beginnerTip: "ETF flows show how much money Wall Street is putting into Bitcoin. Consistent inflows = strong institutional demand = price support." },
    { name: "BTC Futures Open Interest", value: `$${(30 + rng() * 15).toFixed(0)}B`, change: `${rng() > 0.5 ? "+" : "-"}${(rng() * 5 + 1).toFixed(1)}% WoW`, signal: pick(sigs), explanation: "Rising OI with rising price = new money entering long positions (bullish). Rising OI with falling price = new shorts opening (bearish).", beginnerTip: "Open Interest shows how many 'bets' are active in the futures market. More bets = more potential for big price moves (up or down)." },
    { name: "BTC Perpetual Funding Rate", value: `${(rng() * 0.06 - 0.01).toFixed(4)}%/8hr`, change: pick(["Positive — longs paying shorts", "Negative — shorts paying longs", "Near zero — balanced"]), signal: pick(sigs), explanation: "Positive funding = longs are dominant and paying shorts to maintain positions. Extremely positive funding often precedes corrections.", beginnerTip: "Funding rate is like rent for holding a leveraged position. When it's very high, it means too many people are betting 'up' — and the market often drops to punish them." },
    { name: "Options Max Pain", value: `$${(62000 + rng() * 10000).toFixed(0)}`, change: `Expiry: ${pick(["This Friday", "Next Friday", "Month-end"])}`, signal: pick(sigs), explanation: "Max pain is the price where the most options expire worthless. Markets tend to gravitate toward max pain near expiry.", beginnerTip: "Max pain is the price where the most options traders lose money. The market often moves toward this price right before options expire." },
    { name: "Liquidation Heatmap", value: `$${(rng() * 300 + 50).toFixed(0)}M/24hr`, change: `${rng() > 0.5 ? "Longs" : "Shorts"} dominating liquidations`, signal: pick(sigs), explanation: "Liquidation clusters act as magnets for price. Market makers and large traders target these levels to trigger cascading stops.", beginnerTip: "Liquidations happen when leveraged traders can't afford their positions anymore. Large liquidation events cause sudden, violent price swings." },
    { name: "ETH Spot ETF Status", value: pick(["Trading Live", "Strong Inflows", "Moderate Activity"]), change: `Net flow: ${rng() > 0.5 ? "+" : "-"}$${(rng() * 100 + 10).toFixed(0)}M this week`, signal: pick(sigs), explanation: "Ethereum ETF flows lag Bitcoin ETFs but provide important institutional demand signal for the second-largest crypto asset.", beginnerTip: "Just like Bitcoin has ETFs, Ethereum now has them too. ETF flows show whether big investors are interested in ETH specifically." },
  ];
}

// ─── ECOSYSTEM INTELLIGENCE ─────────────────────────────────────────

export function getEcosystems(): EcosystemCard[] {
  const rng = seededRng("eco-v2");
  const r = (min: number, max: number) => +(min + rng() * (max - min)).toFixed(1);

  return [
    { name: "Ethereum Ecosystem", category: "Smart Contracts", tvl: `$${r(45, 60)}B`, change7d: r(-3, 5), topProtocols: ["Lido", "AAVE", "Uniswap", "MakerDAO", "EigenLayer"], aiSummary: "Ethereum remains the dominant smart contract platform with the deepest DeFi liquidity. Layer-2 adoption accelerating with Base, Arbitrum, and Optimism driving transaction volume.", color: "#627eea" },
    { name: "Solana Ecosystem", category: "High-Performance", tvl: `$${r(4, 8)}B`, change7d: r(-5, 10), topProtocols: ["Jupiter", "Raydium", "Marinade", "Jito", "Orca"], aiSummary: "Solana is the fastest-growing ecosystem by developer activity and user adoption. DePIN narrative and meme coin activity driving engagement. Network reliability vastly improved.", color: "#9945ff" },
    { name: "BNB Chain", category: "Exchange Chain", tvl: `$${r(5, 8)}B`, change7d: r(-3, 5), topProtocols: ["PancakeSwap", "Venus", "Alpaca", "Biswap"], aiSummary: "BNB Chain benefits from Binance's massive user base. Focus shifting to opBNB (Layer-2) for cheaper transactions. Gaming and DeFi remain core use cases.", color: "#f3ba2f" },
    { name: "Arbitrum", category: "Layer 2", tvl: `$${r(10, 16)}B`, change7d: r(-4, 7), topProtocols: ["GMX", "Aave", "Uniswap", "Radiant", "Camelot"], aiSummary: "Arbitrum leads the Layer-2 race with highest TVL. Strong DeFi ecosystem centered around GMX derivatives. ARB token incentives driving protocol adoption.", color: "#28a0f0" },
    { name: "Bitcoin DeFi", category: "Bitcoin Layer", tvl: `$${r(1, 3)}B`, change7d: r(-5, 15), topProtocols: ["Lightning Network", "Stacks", "Ordinals/BRC-20", "RGB"], aiSummary: "Bitcoin DeFi is the newest frontier. Ordinals brought NFTs to Bitcoin, BRC-20 tokens emerged, and Layer-2 solutions like Stacks are building smart contracts on Bitcoin.", color: "#f7931a" },
    { name: "AI & DePIN", category: "Infrastructure", tvl: `$${r(2, 5)}B`, change7d: r(-6, 12), topProtocols: ["Render", "Filecoin", "Helium", "Akash", "Bittensor"], aiSummary: "AI tokens and Decentralized Physical Infrastructure (DePIN) are the hottest narratives. Render provides GPU computing, Filecoin does storage, Helium does wireless. Real utility driving adoption.", color: "#8b5cf6" },
  ];
}

// ─── REGULATION & NEWS ──────────────────────────────────────────────

export function getRegulationEvents(): RegulationEvent[] {
  const rng = seededRng(Date.now().toString().slice(0, -4));
  const pick = <T,>(a: T[]): T => a[Math.floor(rng() * a.length)];
  const impacts: ("bullish" | "bearish" | "neutral")[] = ["bullish", "bearish", "neutral"];

  return [
    { headline: `US SEC ${pick(["Approves New Crypto Product", "Issues Guidance on Token Classification", "Drops Case Against Major Exchange"])}`, body: `The SEC's ${pick(["constructive approach", "evolving stance", "recent decision"])} signals ${pick(["growing acceptance of crypto in traditional finance", "continued regulatory scrutiny but with clearer frameworks", "a potential pivot toward more crypto-friendly policy"])}.`, region: "United States", impact: pick(impacts), timeAgo: `${Math.floor(rng() * 24 + 1)}h ago`, beginnerNote: "The SEC is the US financial regulator. Their decisions about crypto affect the entire global market because the US is the largest financial market." },
    { headline: `EU MiCA Framework ${pick(["Fully Implemented", "Sees First Enforcement", "Drives Exchange Compliance"])}`, body: `Europe's Markets in Crypto-Assets regulation ${pick(["provides the clearest regulatory framework globally", "is forcing exchanges to obtain proper licensing", "creates opportunities for compliant crypto businesses"])}.`, region: "European Union", impact: pick(impacts), timeAgo: `${Math.floor(rng() * 48 + 1)}h ago`, beginnerNote: "MiCA is Europe's crypto rulebook. Clear rules actually help crypto grow because companies know exactly what they can and can't do." },
    { headline: `India ${pick(["Reviews Crypto Tax Framework", "SEBI Proposes Crypto Oversight", "RBI Issues Digital Rupee Update"])}`, body: `India's regulatory landscape ${pick(["continues to evolve with focus on 30% tax and 1% TDS", "may see changes as SEBI takes over crypto regulation from RBI", "shows progress with CBDC pilot reaching new milestones"])}.`, region: "India", impact: pick(impacts), timeAgo: `${Math.floor(rng() * 72 + 1)}h ago`, beginnerNote: "In India, crypto profits are taxed at 30% with 1% TDS on every transaction. These rules affect how profitable crypto trading is for Indian investors." },
    { headline: `Hong Kong & Singapore ${pick(["Approve New Crypto ETFs", "Expand Licensing Framework", "See Record Institutional Activity"])}`, body: `Asian financial hubs ${pick(["continue to position themselves as crypto-friendly jurisdictions", "are attracting global crypto firms with clear regulations", "are seeing growing institutional participation in digital assets"])}.`, region: "Asia Pacific", impact: pick(impacts), timeAgo: `${Math.floor(rng() * 96 + 1)}h ago`, beginnerNote: "Hong Kong and Singapore are competing to become Asia's crypto capitals. Their friendly policies attract major crypto companies and investors." },
  ];
}

// ─── EDUCATION ENGINE ───────────────────────────────────────────────

export function getCryptoEducation(): CryptoEducationTerm[] {
  return [
    { term: "What is Bitcoin?", category: "Basics", simpleExplanation: "Bitcoin is digital money that works without any bank or government. It was created in 2009 by someone called 'Satoshi Nakamoto.' Only 21 million Bitcoin will ever exist — no one can print more. You can send it to anyone in the world in minutes.", analogy: "Think of Bitcoin like digital gold. Just like gold is scarce (limited amount on Earth), Bitcoin is scarce (only 21 million). Just like gold doesn't need a bank to be valuable, Bitcoin doesn't either.", whyItMatters: "Bitcoin started the entire crypto revolution. It's the largest cryptocurrency by market cap ($1T+) and is now traded on Wall Street through ETFs. Understanding Bitcoin is step 1 of understanding crypto.", example: "If you bought 1 Bitcoin for $100 in 2010, it would be worth $68,000+ today. But it also dropped 80% from $69K to $16K during the 2022 crash. High reward, high risk." },
    { term: "What is Blockchain?", category: "Basics", simpleExplanation: "A blockchain is a digital record book that everyone can see but nobody can cheat on. Every transaction is recorded in 'blocks' that are chained together. Once written, records can't be changed or deleted.", analogy: "Imagine a Google Sheet that the whole world can see, but nobody can edit past entries. Every 10 minutes, a new row is added with all recent transactions. That's basically blockchain.", whyItMatters: "Blockchain is the technology behind ALL cryptocurrencies. It's also being used for supply chain tracking, voting, medical records, and more. Understanding blockchain helps you evaluate which crypto projects have real value.", example: "When you send Bitcoin to a friend, the transaction is recorded on the blockchain. Thousands of computers worldwide verify it. No bank needed, no intermediary, just math and code." },
    { term: "What is DeFi?", category: "DeFi", simpleExplanation: "DeFi (Decentralized Finance) means doing banking stuff without banks. You can lend, borrow, trade, and earn interest using crypto apps (called 'protocols') that run on blockchain. No paperwork, no approval process, open 24/7.", analogy: "Imagine a bank that's run entirely by computer code, with no CEO, no employees, and no closing hours. You deposit money and the code automatically gives you interest. That's DeFi.", whyItMatters: "DeFi has $90B+ locked in protocols. It's creating a parallel financial system that's accessible to anyone with an internet connection. The best DeFi tokens (AAVE, UNI, MKR) are like owning stock in these 'robot banks.'", example: "On Aave (a DeFi protocol), you can deposit ETH and earn 3-5% interest. Or borrow stablecoins against your ETH at 2-4% interest. All without any bank approval or credit check." },
    { term: "What is a Wallet?", category: "Security", simpleExplanation: "A crypto wallet is like a digital safe for your crypto. It holds your 'private keys' — secret codes that prove you own your crypto. There are 'hot wallets' (online, convenient) and 'cold wallets' (offline, more secure).", analogy: "Your wallet is like the key to a lockbox. The lockbox (blockchain) holds your crypto. If someone gets your key (private key), they can take your crypto. If you lose your key, your crypto is gone forever.", whyItMatters: "Security is everything in crypto. Billions have been lost to hacks and scams. The saying 'not your keys, not your coins' means if your crypto is on an exchange, you don't truly own it.", example: "A hardware wallet like Ledger or Trezor costs $70-200 and is the safest way to store crypto. For smaller amounts, MetaMask (browser wallet) or Phantom (for Solana) work well." },
    { term: "What is Gas?", category: "Basics", simpleExplanation: "Gas is the fee you pay to use a blockchain network. Just like you pay a taxi driver to take you somewhere, you pay 'gas' to the network to process your transaction. Ethereum gas can be expensive ($1-50+), while Solana gas is cheap ($0.001).", analogy: "Gas fees are like postage stamps for the blockchain. Just like sending a heavy package costs more postage, complex transactions (like DeFi swaps) cost more gas than simple transfers.", whyItMatters: "High gas fees can make small transactions unprofitable. This is why Layer-2 networks (Arbitrum, Base) and alternative chains (Solana) exist — they offer cheaper transactions.", example: "Sending ETH might cost $2 in gas on Ethereum Layer-1, but only $0.01 on Arbitrum (Layer-2). A complex DeFi transaction might cost $15 on Ethereum but $0.003 on Solana." },
    { term: "What is Staking?", category: "DeFi", simpleExplanation: "Staking is like putting your crypto in a savings account. You 'lock up' your coins to help secure the blockchain network, and in return, you earn rewards (interest). ETH staking yields ~3-5% per year.", analogy: "It's similar to a fixed deposit. You deposit your crypto for a period, and you earn interest. The difference is that your crypto is actually being used to validate transactions and keep the network running.", whyItMatters: "Staking is one of the safest ways to earn passive income in crypto. Ethereum alone has $100B+ staked. It's important to understand staking when evaluating Layer-1 tokens.", example: "If you stake 10 ETH ($35,000) at 4% APY, you earn 0.4 ETH (~$1,400) per year in rewards. Lido and Rocket Pool are popular staking services that don't require running your own server." },
    { term: "What is Market Cap?", category: "Trading", simpleExplanation: "Market cap = price per coin × total coins in circulation. It tells you the total value of a cryptocurrency. Bitcoin's market cap is ~$1.3T, making it the 10th most valuable asset in the world.", analogy: "If a company's stock price is $100 and there are 1 million shares, the market cap is $100M. Same for crypto: if Bitcoin costs $68K and there are 19.7M in circulation, market cap = ~$1.34T.", whyItMatters: "Market cap is more useful than price for comparing cryptos. A $0.01 coin isn't 'cheap' if there are 100 billion coins (market cap = $1B). Always check market cap, not just price.", example: "Bitcoin: $1.3T market cap (safe, established). Ethereum: $400B (large, trusted). Random meme coin: $50M market cap (extremely risky, could go to zero easily)." },
    { term: "What is a Halving?", category: "On-Chain", simpleExplanation: "Bitcoin halving happens every ~4 years. It cuts the reward miners get for creating new Bitcoin blocks in half. This makes new Bitcoin harder to get — reducing supply. Historically, halvings lead to bull markets.", analogy: "Imagine a gold mine that automatically produces less gold every 4 years. With less new gold coming to market but the same (or growing) demand, the price naturally goes up.", whyItMatters: "The halving is one of the most important events in crypto. Past halvings (2012, 2016, 2020) were followed by massive bull runs within 12-18 months. The 2024 halving reduced block rewards from 6.25 to 3.125 BTC.", example: "After the 2020 halving, Bitcoin went from $8,500 to $69,000 (+700%). After the 2016 halving, it went from $650 to $20,000 (+3,000%). Past performance doesn't guarantee future results, but the pattern is notable." },
  ];
}

// ─── NAV SECTIONS ───────────────────────────────────────────────────

export const CRYPTO_NAV_SECTIONS = [
  { id: "overview", label: "Markets", emoji: "\u{1f4b0}" },
  { id: "copilot", label: "AI Copilot", emoji: "\u{1f916}" },
  { id: "stories", label: "Market Stories", emoji: "\u{1f4f0}" },
  { id: "onchain", label: "On-Chain", emoji: "\u{1f517}" },
  { id: "heatmap", label: "Heatmaps", emoji: "\u{1f525}" },
  { id: "macro", label: "Crypto ↔ Macro", emoji: "\u{1f30d}" },
  { id: "risk", label: "Risk Engine", emoji: "\u{1f6e1}️" },
  { id: "derivatives", label: "Derivatives & ETF", emoji: "\u{1f4ca}" },
  { id: "ecosystem", label: "Ecosystems", emoji: "\u{1f310}" },
  { id: "regulation", label: "Regulation", emoji: "\u{1f3db}️" },
] as const;

export type CryptoSectionExtra = CryptoSection | "learn";
