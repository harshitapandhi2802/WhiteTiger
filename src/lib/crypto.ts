export interface CryptoEntry {
  name: string;
  symbol: string;
  category: string;
  pair: string;
}

export const CRYPTO_LIST: CryptoEntry[] = [
  // ── Top Cryptos ──
  { name: "Bitcoin", symbol: "BTC", category: "Layer 1", pair: "BTC/INR" },
  { name: "Ethereum", symbol: "ETH", category: "Layer 1", pair: "ETH/INR" },
  { name: "Binance Coin", symbol: "BNB", category: "Exchange", pair: "BNB/INR" },
  { name: "Solana", symbol: "SOL", category: "Layer 1", pair: "SOL/INR" },
  { name: "Ripple (XRP)", symbol: "XRP", category: "Payments", pair: "XRP/INR" },
  { name: "Cardano", symbol: "ADA", category: "Layer 1", pair: "ADA/INR" },
  { name: "Dogecoin", symbol: "DOGE", category: "Meme", pair: "DOGE/INR" },
  { name: "Polkadot", symbol: "DOT", category: "Layer 0", pair: "DOT/INR" },
  { name: "Polygon (MATIC)", symbol: "MATIC", category: "Layer 2", pair: "MATIC/INR" },
  { name: "Avalanche", symbol: "AVAX", category: "Layer 1", pair: "AVAX/INR" },
  { name: "Chainlink", symbol: "LINK", category: "Oracle", pair: "LINK/INR" },
  { name: "Uniswap", symbol: "UNI", category: "DeFi", pair: "UNI/INR" },
  { name: "Litecoin", symbol: "LTC", category: "Payments", pair: "LTC/INR" },
  { name: "Toncoin", symbol: "TON", category: "Layer 1", pair: "TON/INR" },
  { name: "Shiba Inu", symbol: "SHIB", category: "Meme", pair: "SHIB/INR" },
  { name: "Tron", symbol: "TRX", category: "Layer 1", pair: "TRX/INR" },
  { name: "Cosmos", symbol: "ATOM", category: "Layer 0", pair: "ATOM/INR" },
  { name: "Near Protocol", symbol: "NEAR", category: "Layer 1", pair: "NEAR/INR" },
  { name: "Stellar", symbol: "XLM", category: "Payments", pair: "XLM/INR" },
  { name: "Aptos", symbol: "APT", category: "Layer 1", pair: "APT/INR" },
  { name: "Sui", symbol: "SUI", category: "Layer 1", pair: "SUI/INR" },
  { name: "Render", symbol: "RENDER", category: "AI", pair: "RENDER/INR" },
  { name: "Injective", symbol: "INJ", category: "DeFi", pair: "INJ/INR" },
  { name: "Arbitrum", symbol: "ARB", category: "Layer 2", pair: "ARB/INR" },
  { name: "Optimism", symbol: "OP", category: "Layer 2", pair: "OP/INR" },
  { name: "Filecoin", symbol: "FIL", category: "Storage", pair: "FIL/INR" },
  { name: "Aave", symbol: "AAVE", category: "DeFi", pair: "AAVE/INR" },
  { name: "Maker", symbol: "MKR", category: "DeFi", pair: "MKR/INR" },
  { name: "The Graph", symbol: "GRT", category: "Infrastructure", pair: "GRT/INR" },
  { name: "Pepe", symbol: "PEPE", category: "Meme", pair: "PEPE/INR" },
  { name: "Fetch.ai", symbol: "FET", category: "AI", pair: "FET/INR" },
  { name: "Hedera", symbol: "HBAR", category: "Layer 1", pair: "HBAR/INR" },
  { name: "VeChain", symbol: "VET", category: "Supply Chain", pair: "VET/INR" },
  { name: "Algorand", symbol: "ALGO", category: "Layer 1", pair: "ALGO/INR" },
  { name: "Internet Computer", symbol: "ICP", category: "Layer 1", pair: "ICP/INR" },
  { name: "Kaspa", symbol: "KAS", category: "Layer 1", pair: "KAS/INR" },
  { name: "Worldcoin", symbol: "WLD", category: "AI", pair: "WLD/INR" },
  { name: "Jupiter", symbol: "JUP", category: "DeFi", pair: "JUP/INR" },
  { name: "Bonk", symbol: "BONK", category: "Meme", pair: "BONK/INR" },
  { name: "Floki", symbol: "FLOKI", category: "Meme", pair: "FLOKI/INR" },
];

export const CRYPTO_CATEGORIES = [
  "All",
  "Layer 1",
  "Layer 2",
  "DeFi",
  "Meme",
  "AI",
  "Payments",
  "Oracle",
  "Exchange",
  "Infrastructure",
];

export function searchCrypto(query: string, limit = 8): CryptoEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: { crypto: CryptoEntry; score: number }[] = [];

  for (const c of CRYPTO_LIST) {
    const name = c.name.toLowerCase();
    const sym = c.symbol.toLowerCase();
    const cat = c.category.toLowerCase();

    let score = 0;
    if (name === q || sym === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (sym.startsWith(q)) score = 75;
    else if (name.includes(q)) score = 50;
    else if (sym.includes(q)) score = 45;
    else if (cat.includes(q)) score = 25;
    else {
      const words = q.split(/\s+/);
      const matched = words.filter(w => name.includes(w) || sym.includes(w));
      if (matched.length > 0) score = 10 + matched.length * 15;
    }
    if (score > 0) results.push({ crypto: c, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit).map(r => r.crypto);
}
