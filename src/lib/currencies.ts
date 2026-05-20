export interface CurrencyEntry {
  name: string;
  symbol: string;
  pair: string;
  category: string;
  base: string;
  quote: string;
}

export const CURRENCY_LIST: CurrencyEntry[] = [
  // ── Major INR Pairs ──
  { name: "US Dollar / Indian Rupee", symbol: "USDINR", pair: "USD/INR", category: "Major INR", base: "USD", quote: "INR" },
  { name: "Euro / Indian Rupee", symbol: "EURINR", pair: "EUR/INR", category: "Major INR", base: "EUR", quote: "INR" },
  { name: "British Pound / Indian Rupee", symbol: "GBPINR", pair: "GBP/INR", category: "Major INR", base: "GBP", quote: "INR" },
  { name: "Japanese Yen / Indian Rupee", symbol: "JPYINR", pair: "JPY/INR", category: "Major INR", base: "JPY", quote: "INR" },
  { name: "Chinese Yuan / Indian Rupee", symbol: "CNYINR", pair: "CNY/INR", category: "Major INR", base: "CNY", quote: "INR" },
  { name: "Australian Dollar / Indian Rupee", symbol: "AUDINR", pair: "AUD/INR", category: "Major INR", base: "AUD", quote: "INR" },
  { name: "Canadian Dollar / Indian Rupee", symbol: "CADINR", pair: "CAD/INR", category: "Major INR", base: "CAD", quote: "INR" },
  { name: "Singapore Dollar / Indian Rupee", symbol: "SGDINR", pair: "SGD/INR", category: "Major INR", base: "SGD", quote: "INR" },
  { name: "Swiss Franc / Indian Rupee", symbol: "CHFINR", pair: "CHF/INR", category: "Major INR", base: "CHF", quote: "INR" },
  { name: "UAE Dirham / Indian Rupee", symbol: "AEDINR", pair: "AED/INR", category: "Major INR", base: "AED", quote: "INR" },
  { name: "Saudi Riyal / Indian Rupee", symbol: "SARINR", pair: "SAR/INR", category: "Major INR", base: "SAR", quote: "INR" },

  // ── Global Major Pairs ──
  { name: "Euro / US Dollar", symbol: "EURUSD", pair: "EUR/USD", category: "Global Major", base: "EUR", quote: "USD" },
  { name: "British Pound / US Dollar", symbol: "GBPUSD", pair: "GBP/USD", category: "Global Major", base: "GBP", quote: "USD" },
  { name: "US Dollar / Japanese Yen", symbol: "USDJPY", pair: "USD/JPY", category: "Global Major", base: "USD", quote: "JPY" },
  { name: "Australian Dollar / US Dollar", symbol: "AUDUSD", pair: "AUD/USD", category: "Global Major", base: "AUD", quote: "USD" },
  { name: "US Dollar / Canadian Dollar", symbol: "USDCAD", pair: "USD/CAD", category: "Global Major", base: "USD", quote: "CAD" },
  { name: "US Dollar / Swiss Franc", symbol: "USDCHF", pair: "USD/CHF", category: "Global Major", base: "USD", quote: "CHF" },
  { name: "New Zealand Dollar / US Dollar", symbol: "NZDUSD", pair: "NZD/USD", category: "Global Major", base: "NZD", quote: "USD" },

  // ── Emerging Market ──
  { name: "US Dollar / Chinese Yuan", symbol: "USDCNY", pair: "USD/CNY", category: "Emerging", base: "USD", quote: "CNY" },
  { name: "US Dollar / Russian Ruble", symbol: "USDRUB", pair: "USD/RUB", category: "Emerging", base: "USD", quote: "RUB" },
  { name: "US Dollar / Brazilian Real", symbol: "USDBRL", pair: "USD/BRL", category: "Emerging", base: "USD", quote: "BRL" },
  { name: "US Dollar / South African Rand", symbol: "USDZAR", pair: "USD/ZAR", category: "Emerging", base: "USD", quote: "ZAR" },
  { name: "US Dollar / Turkish Lira", symbol: "USDTRY", pair: "USD/TRY", category: "Emerging", base: "USD", quote: "TRY" },
  { name: "US Dollar / Thai Baht", symbol: "USDTHB", pair: "USD/THB", category: "Emerging", base: "USD", quote: "THB" },
  { name: "US Dollar / Indonesian Rupiah", symbol: "USDIDR", pair: "USD/IDR", category: "Emerging", base: "USD", quote: "IDR" },

  // ── Cross Rates ──
  { name: "Euro / British Pound", symbol: "EURGBP", pair: "EUR/GBP", category: "Cross", base: "EUR", quote: "GBP" },
  { name: "Euro / Japanese Yen", symbol: "EURJPY", pair: "EUR/JPY", category: "Cross", base: "EUR", quote: "JPY" },
  { name: "British Pound / Japanese Yen", symbol: "GBPJPY", pair: "GBP/JPY", category: "Cross", base: "GBP", quote: "JPY" },
  { name: "Australian Dollar / Japanese Yen", symbol: "AUDJPY", pair: "AUD/JPY", category: "Cross", base: "AUD", quote: "JPY" },

  // ── DXY ──
  { name: "US Dollar Index (DXY)", symbol: "DXY", pair: "DXY", category: "Index", base: "USD", quote: "Index" },
];

export const CURRENCY_CATEGORIES = [
  "All",
  "Major INR",
  "Global Major",
  "Emerging",
  "Cross",
  "Index",
];

export function searchCurrencies(query: string, limit = 8): CurrencyEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: { currency: CurrencyEntry; score: number }[] = [];

  for (const c of CURRENCY_LIST) {
    const name = c.name.toLowerCase();
    const sym = c.symbol.toLowerCase();
    const pair = c.pair.toLowerCase();
    const cat = c.category.toLowerCase();

    let score = 0;
    if (name === q || sym === q || pair === q) score = 100;
    else if (sym.startsWith(q)) score = 85;
    else if (pair.startsWith(q)) score = 80;
    else if (name.startsWith(q)) score = 75;
    else if (name.includes(q)) score = 50;
    else if (sym.includes(q) || pair.includes(q)) score = 45;
    else if (cat.includes(q)) score = 20;
    else {
      const words = q.split(/\s+/);
      const matched = words.filter(w => name.includes(w) || sym.includes(w) || pair.includes(w));
      if (matched.length > 0) score = 10 + matched.length * 15;
    }
    if (score > 0) results.push({ currency: c, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit).map(r => r.currency);
}
