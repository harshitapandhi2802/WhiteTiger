export interface IntlIndex {
  name: string;
  symbol: string;
  yahooSymbol: string;
  country: string;
  flag: string;
  region: string;
  rank: number; // Global rank by stock market capitalization
  marketCap: string; // Approximate market cap for display
}

export interface IntlStock {
  name: string;
  ticker: string;
  yahooSymbol: string;
  sector: string;
  index: string;
}

/* ── Top 25 Stock Markets by Market Capitalization (ranked) ──
   Source: World Federation of Exchanges / SIFMA Global Capital Markets 2024
*/
export const INTL_INDICES: IntlIndex[] = [
  // Rank 1-5
  { rank: 1, name: "S&P 500", symbol: "SPX", yahooSymbol: "^GSPC", country: "United States", flag: "🇺🇸", region: "Americas", marketCap: "$50.8T" },
  { rank: 2, name: "Shanghai Composite", symbol: "SSEC", yahooSymbol: "000001.SS", country: "China", flag: "🇨🇳", region: "Asia-Pacific", marketCap: "$8.7T" },
  { rank: 3, name: "Nikkei 225", symbol: "N225", yahooSymbol: "^N225", country: "Japan", flag: "🇯🇵", region: "Asia-Pacific", marketCap: "$6.5T" },
  { rank: 4, name: "SENSEX", symbol: "BSESN", yahooSymbol: "^BSESN", country: "India", flag: "🇮🇳", region: "Asia-Pacific", marketCap: "$5.3T" },
  { rank: 5, name: "Hang Seng", symbol: "HSI", yahooSymbol: "^HSI", country: "Hong Kong", flag: "🇭🇰", region: "Asia-Pacific", marketCap: "$4.4T" },
  // Rank 6-10
  { rank: 6, name: "FTSE 100", symbol: "FTSE", yahooSymbol: "^FTSE", country: "United Kingdom", flag: "🇬🇧", region: "Europe", marketCap: "$3.4T" },
  { rank: 7, name: "S&P/TSX", symbol: "TSX", yahooSymbol: "^GSPTSE", country: "Canada", flag: "🇨🇦", region: "Americas", marketCap: "$3.2T" },
  { rank: 8, name: "CAC 40", symbol: "CAC", yahooSymbol: "^FCHI", country: "France", flag: "🇫🇷", region: "Europe", marketCap: "$3.0T" },
  { rank: 9, name: "DAX", symbol: "DAX", yahooSymbol: "^GDAXI", country: "Germany", flag: "🇩🇪", region: "Europe", marketCap: "$2.4T" },
  { rank: 10, name: "TAIEX", symbol: "TWII", yahooSymbol: "^TWII", country: "Taiwan", flag: "🇹🇼", region: "Asia-Pacific", marketCap: "$2.3T" },
  // Rank 11-15
  { rank: 11, name: "KOSPI", symbol: "KS11", yahooSymbol: "^KS11", country: "South Korea", flag: "🇰🇷", region: "Asia-Pacific", marketCap: "$1.9T" },
  { rank: 12, name: "ASX 200", symbol: "AXJO", yahooSymbol: "^AXJO", country: "Australia", flag: "🇦🇺", region: "Asia-Pacific", marketCap: "$1.8T" },
  { rank: 13, name: "Euro Stoxx 50", symbol: "STOXX50", yahooSymbol: "^STOXX50E", country: "Eurozone", flag: "🇪🇺", region: "Europe", marketCap: "$1.7T" },
  { rank: 14, name: "Bovespa", symbol: "BVSP", yahooSymbol: "^BVSP", country: "Brazil", flag: "🇧🇷", region: "Americas", marketCap: "$1.1T" },
  { rank: 15, name: "SMI", symbol: "SMI", yahooSymbol: "^SSMI", country: "Switzerland", flag: "🇨🇭", region: "Europe", marketCap: "$1.7T" },
  // Rank 16-20
  { rank: 16, name: "AEX", symbol: "AEX", yahooSymbol: "^AEX", country: "Netherlands", flag: "🇳🇱", region: "Europe", marketCap: "$1.3T" },
  { rank: 17, name: "IBEX 35", symbol: "IBEX", yahooSymbol: "^IBEX", country: "Spain", flag: "🇪🇸", region: "Europe", marketCap: "$0.8T" },
  { rank: 18, name: "Straits Times", symbol: "STI", yahooSymbol: "^STI", country: "Singapore", flag: "🇸🇬", region: "Asia-Pacific", marketCap: "$0.7T" },
  { rank: 19, name: "FTSE MIB", symbol: "MIB", yahooSymbol: "FTSEMIB.MI", country: "Italy", flag: "🇮🇹", region: "Europe", marketCap: "$0.8T" },
  { rank: 20, name: "OMX Stockholm 30", symbol: "OMXS30", yahooSymbol: "^OMX", country: "Sweden", flag: "🇸🇪", region: "Europe", marketCap: "$0.9T" },
  // Rank 21-25
  { rank: 21, name: "JSE Top 40", symbol: "JTOPI", yahooSymbol: "^J200.JO", country: "South Africa", flag: "🇿🇦", region: "Americas", marketCap: "$0.7T" },
  { rank: 22, name: "Tadawul All Share", symbol: "TASI", yahooSymbol: "^TASI.SR", country: "Saudi Arabia", flag: "🇸🇦", region: "Asia-Pacific", marketCap: "$2.8T" },
  { rank: 23, name: "NIFTY 50", symbol: "NSEI", yahooSymbol: "^NSEI", country: "India", flag: "🇮🇳", region: "Asia-Pacific", marketCap: "$5.3T" },
  { rank: 24, name: "SET Index", symbol: "SETI", yahooSymbol: "^SET.BK", country: "Thailand", flag: "🇹🇭", region: "Asia-Pacific", marketCap: "$0.5T" },
  { rank: 25, name: "IDX Composite", symbol: "JKSE", yahooSymbol: "^JKSE", country: "Indonesia", flag: "🇮🇩", region: "Asia-Pacific", marketCap: "$0.6T" },
];

export const INTL_STOCKS: IntlStock[] = [
  // S&P 500 / NASDAQ — US
  { name: "Apple", ticker: "AAPL", yahooSymbol: "AAPL", sector: "Technology", index: "SPX" },
  { name: "Microsoft", ticker: "MSFT", yahooSymbol: "MSFT", sector: "Technology", index: "SPX" },
  { name: "NVIDIA", ticker: "NVDA", yahooSymbol: "NVDA", sector: "Technology", index: "SPX" },
  { name: "Amazon", ticker: "AMZN", yahooSymbol: "AMZN", sector: "Consumer", index: "SPX" },
  { name: "Alphabet", ticker: "GOOGL", yahooSymbol: "GOOGL", sector: "Technology", index: "SPX" },
  { name: "Meta", ticker: "META", yahooSymbol: "META", sector: "Technology", index: "SPX" },
  { name: "Tesla", ticker: "TSLA", yahooSymbol: "TSLA", sector: "Auto", index: "SPX" },
  { name: "Berkshire", ticker: "BRK.B", yahooSymbol: "BRK-B", sector: "Finance", index: "SPX" },
  { name: "JPMorgan", ticker: "JPM", yahooSymbol: "JPM", sector: "Finance", index: "SPX" },
  { name: "Visa", ticker: "V", yahooSymbol: "V", sector: "Finance", index: "SPX" },
  // FTSE 100 — UK
  { name: "Shell", ticker: "SHEL.L", yahooSymbol: "SHEL.L", sector: "Energy", index: "FTSE" },
  { name: "AstraZeneca", ticker: "AZN.L", yahooSymbol: "AZN.L", sector: "Pharma", index: "FTSE" },
  { name: "HSBC", ticker: "HSBA.L", yahooSymbol: "HSBA.L", sector: "Banking", index: "FTSE" },
  { name: "Unilever", ticker: "ULVR.L", yahooSymbol: "ULVR.L", sector: "Consumer", index: "FTSE" },
  { name: "BP", ticker: "BP.L", yahooSymbol: "BP.L", sector: "Energy", index: "FTSE" },
  // DAX — Germany
  { name: "SAP", ticker: "SAP.DE", yahooSymbol: "SAP.DE", sector: "Technology", index: "DAX" },
  { name: "Siemens", ticker: "SIE.DE", yahooSymbol: "SIE.DE", sector: "Industrial", index: "DAX" },
  { name: "Allianz", ticker: "ALV.DE", yahooSymbol: "ALV.DE", sector: "Insurance", index: "DAX" },
  { name: "Mercedes-Benz", ticker: "MBG.DE", yahooSymbol: "MBG.DE", sector: "Auto", index: "DAX" },
  { name: "Deutsche Telekom", ticker: "DTE.DE", yahooSymbol: "DTE.DE", sector: "Telecom", index: "DAX" },
  // Nikkei 225 — Japan
  { name: "Toyota", ticker: "7203.T", yahooSymbol: "7203.T", sector: "Auto", index: "N225" },
  { name: "Sony", ticker: "6758.T", yahooSymbol: "6758.T", sector: "Technology", index: "N225" },
  { name: "Keyence", ticker: "6861.T", yahooSymbol: "6861.T", sector: "Industrial", index: "N225" },
  { name: "SoftBank", ticker: "9984.T", yahooSymbol: "9984.T", sector: "Technology", index: "N225" },
  { name: "Mitsubishi UFJ", ticker: "8306.T", yahooSymbol: "8306.T", sector: "Banking", index: "N225" },
  // Hang Seng — Hong Kong
  { name: "Tencent", ticker: "0700.HK", yahooSymbol: "0700.HK", sector: "Technology", index: "HSI" },
  { name: "Alibaba", ticker: "9988.HK", yahooSymbol: "9988.HK", sector: "Technology", index: "HSI" },
  { name: "AIA Group", ticker: "1299.HK", yahooSymbol: "1299.HK", sector: "Insurance", index: "HSI" },
  { name: "Meituan", ticker: "3690.HK", yahooSymbol: "3690.HK", sector: "Technology", index: "HSI" },
  { name: "HSBC HK", ticker: "0005.HK", yahooSymbol: "0005.HK", sector: "Banking", index: "HSI" },
  // KOSPI — South Korea
  { name: "Samsung", ticker: "005930.KS", yahooSymbol: "005930.KS", sector: "Technology", index: "KS11" },
  { name: "SK Hynix", ticker: "000660.KS", yahooSymbol: "000660.KS", sector: "Semiconductor", index: "KS11" },
  { name: "Hyundai Motor", ticker: "005380.KS", yahooSymbol: "005380.KS", sector: "Auto", index: "KS11" },
  { name: "LG Energy", ticker: "373220.KS", yahooSymbol: "373220.KS", sector: "Energy", index: "KS11" },
  // Shanghai — China
  { name: "Kweichow Moutai", ticker: "600519.SS", yahooSymbol: "600519.SS", sector: "Consumer", index: "SSEC" },
  { name: "ICBC", ticker: "601398.SS", yahooSymbol: "601398.SS", sector: "Banking", index: "SSEC" },
  { name: "PetroChina", ticker: "601857.SS", yahooSymbol: "601857.SS", sector: "Energy", index: "SSEC" },
  // ASX 200 — Australia
  { name: "BHP Group", ticker: "BHP.AX", yahooSymbol: "BHP.AX", sector: "Mining", index: "AXJO" },
  { name: "Commonwealth Bank", ticker: "CBA.AX", yahooSymbol: "CBA.AX", sector: "Banking", index: "AXJO" },
  { name: "CSL Limited", ticker: "CSL.AX", yahooSymbol: "CSL.AX", sector: "Biotech", index: "AXJO" },
  // CAC 40 — France
  { name: "LVMH", ticker: "MC.PA", yahooSymbol: "MC.PA", sector: "Luxury", index: "CAC" },
  { name: "TotalEnergies", ticker: "TTE.PA", yahooSymbol: "TTE.PA", sector: "Energy", index: "CAC" },
  { name: "L'Oréal", ticker: "OR.PA", yahooSymbol: "OR.PA", sector: "Consumer", index: "CAC" },
  // Bovespa — Brazil
  { name: "Petrobras", ticker: "PETR4.SA", yahooSymbol: "PETR4.SA", sector: "Energy", index: "BVSP" },
  { name: "Vale", ticker: "VALE3.SA", yahooSymbol: "VALE3.SA", sector: "Mining", index: "BVSP" },
  { name: "Itaú Unibanco", ticker: "ITUB4.SA", yahooSymbol: "ITUB4.SA", sector: "Banking", index: "BVSP" },
  // SENSEX — India (for expanded view)
  { name: "Reliance", ticker: "RELIANCE.NS", yahooSymbol: "RELIANCE.NS", sector: "Energy", index: "BSESN" },
  { name: "TCS", ticker: "TCS.NS", yahooSymbol: "TCS.NS", sector: "IT", index: "BSESN" },
  { name: "HDFC Bank", ticker: "HDFCBANK.NS", yahooSymbol: "HDFCBANK.NS", sector: "Banking", index: "BSESN" },
  { name: "Infosys", ticker: "INFY.NS", yahooSymbol: "INFY.NS", sector: "IT", index: "BSESN" },
  { name: "ICICI Bank", ticker: "ICICIBANK.NS", yahooSymbol: "ICICIBANK.NS", sector: "Banking", index: "BSESN" },
  // NIFTY 50 — India
  { name: "Bharti Airtel", ticker: "BHARTIARTL.NS", yahooSymbol: "BHARTIARTL.NS", sector: "Telecom", index: "NSEI" },
  { name: "ITC", ticker: "ITC.NS", yahooSymbol: "ITC.NS", sector: "FMCG", index: "NSEI" },
  { name: "SBI", ticker: "SBIN.NS", yahooSymbol: "SBIN.NS", sector: "Banking", index: "NSEI" },
  // TAIEX — Taiwan
  { name: "TSMC", ticker: "2330.TW", yahooSymbol: "2330.TW", sector: "Semiconductor", index: "TWII" },
  { name: "Hon Hai", ticker: "2317.TW", yahooSymbol: "2317.TW", sector: "Technology", index: "TWII" },
  { name: "MediaTek", ticker: "2454.TW", yahooSymbol: "2454.TW", sector: "Semiconductor", index: "TWII" },
  // Saudi Arabia — Tadawul
  { name: "Saudi Aramco", ticker: "2222.SR", yahooSymbol: "2222.SR", sector: "Energy", index: "TASI" },
  { name: "Al Rajhi Bank", ticker: "1120.SR", yahooSymbol: "1120.SR", sector: "Banking", index: "TASI" },
  // S&P/TSX — Canada
  { name: "Royal Bank of Canada", ticker: "RY.TO", yahooSymbol: "RY.TO", sector: "Banking", index: "TSX" },
  { name: "Shopify", ticker: "SHOP.TO", yahooSymbol: "SHOP.TO", sector: "Technology", index: "TSX" },
  { name: "Toronto-Dominion", ticker: "TD.TO", yahooSymbol: "TD.TO", sector: "Banking", index: "TSX" },
  // SMI — Switzerland
  { name: "Nestlé", ticker: "NESN.SW", yahooSymbol: "NESN.SW", sector: "Consumer", index: "SMI" },
  { name: "Roche", ticker: "ROG.SW", yahooSymbol: "ROG.SW", sector: "Pharma", index: "SMI" },
  { name: "Novartis", ticker: "NOVN.SW", yahooSymbol: "NOVN.SW", sector: "Pharma", index: "SMI" },
  // AEX — Netherlands
  { name: "ASML", ticker: "ASML.AS", yahooSymbol: "ASML.AS", sector: "Semiconductor", index: "AEX" },
  { name: "Shell NL", ticker: "SHELL.AS", yahooSymbol: "SHELL.AS", sector: "Energy", index: "AEX" },
];

// Countries list derived from indices (unique countries, sorted by rank)
export const INTL_COUNTRIES: string[] = (() => {
  const seen = new Set<string>();
  const countries: string[] = [];
  for (const idx of INTL_INDICES) {
    if (!seen.has(idx.country)) {
      seen.add(idx.country);
      countries.push(idx.country);
    }
  }
  return countries;
})();

export const INTL_REGIONS = ["All", "Americas", "Europe", "Asia-Pacific"] as const;

export function getStocksForIndex(indexSymbol: string): IntlStock[] {
  return INTL_STOCKS.filter(s => s.index === indexSymbol);
}

export function getIndicesByRegion(region: string): IntlIndex[] {
  if (region === "All") return INTL_INDICES;
  return INTL_INDICES.filter(i => i.region === region);
}

export function getIndicesByCountry(country: string): IntlIndex[] {
  if (country === "All") return INTL_INDICES;
  return INTL_INDICES.filter(i => i.country === country);
}
