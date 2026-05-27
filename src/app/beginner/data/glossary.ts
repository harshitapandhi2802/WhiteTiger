// ═══════════════════════════════════════════════════════════════
// BEGINNER MODE — MARKET JARGON GLOSSARY
// Simple English + Hindi explanations with relatable emojis.
// ═══════════════════════════════════════════════════════════════

export interface GlossaryTerm {
  term: string;
  hindi: string;
  emoji: string;
  definition: string;
  category: "basics" | "trading" | "analysis" | "institutions";
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  { term: "Bull Market", hindi: "तेजी", emoji: "🐂", definition: "When stock prices are rising over time and investors feel confident. Think of a bull charging upward with its horns!", category: "basics" },
  { term: "Bear Market", hindi: "मंदी", emoji: "🐻", definition: "When stock prices keep falling and investors feel cautious. Like a bear swiping downward with its paw.", category: "basics" },
  { term: "IPO", hindi: "आईपीओ", emoji: "🎉", definition: "Initial Public Offering — when a private company sells shares to the public for the first time. It's like a company's debut on the stock exchange.", category: "basics" },
  { term: "SIP", hindi: "एसआईपी", emoji: "💰", definition: "Systematic Investment Plan — investing a fixed amount every month automatically. Like a subscription to wealth building.", category: "basics" },
  { term: "Mutual Fund", hindi: "म्यूचुअल फंड", emoji: "🚌", definition: "A pool of money from many investors, managed by a professional who invests it in stocks or bonds on your behalf.", category: "basics" },
  { term: "ETF", hindi: "ईटीएफ", emoji: "📦", definition: "Exchange Traded Fund — like a mutual fund, but it trades on the stock exchange like a regular share. You can buy/sell anytime.", category: "basics" },
  { term: "Dividend", hindi: "लाभांश", emoji: "🎁", definition: "A portion of company profits shared with shareholders. It's like getting pocket money just for owning the stock!", category: "basics" },
  { term: "P/E Ratio", hindi: "पी/ई अनुपात", emoji: "🔍", definition: "Price-to-Earnings ratio — tells if a stock is expensive or cheap compared to its profits. Lower P/E often means better value.", category: "analysis" },
  { term: "Market Cap", hindi: "मार्केट कैप", emoji: "📏", definition: "Total value of a company on the stock market. Calculated as share price multiplied by total number of shares.", category: "analysis" },
  { term: "Blue Chip", hindi: "ब्लू चिप", emoji: "💎", definition: "Large, well-established, financially stable companies. Like Reliance, TCS, HDFC Bank — the giants of Indian markets.", category: "basics" },
  { term: "Demat Account", hindi: "डीमैट खाता", emoji: "🏦", definition: "A digital locker for your stocks. You need one to buy or sell shares. Think of it as a bank account for investments.", category: "basics" },
  { term: "Portfolio", hindi: "पोर्टफोलियो", emoji: "🎒", definition: "Your collection of all investments — stocks, mutual funds, gold, etc. Like a backpack carrying all your financial assets.", category: "basics" },
  { term: "NAV", hindi: "एनएवी", emoji: "🏷️", definition: "Net Asset Value — the price of one unit of a mutual fund. It changes daily based on how the fund's investments perform.", category: "analysis" },
  { term: "AMC", hindi: "एएमसी", emoji: "🏢", definition: "Asset Management Company — the company that creates and manages mutual funds. Examples: SBI MF, HDFC AMC, ICICI Prudential.", category: "institutions" },
  { term: "SEBI", hindi: "सेबी", emoji: "🛡️", definition: "Securities and Exchange Board of India — the government body that protects investors and regulates the stock market. Like a referee!", category: "institutions" },
  { term: "NSE", hindi: "एनएसई", emoji: "🏛️", definition: "National Stock Exchange — India's largest stock exchange where NIFTY trades. Most stocks you hear about trade here.", category: "institutions" },
  { term: "BSE", hindi: "बीएसई", emoji: "🏛️", definition: "Bombay Stock Exchange — Asia's oldest stock exchange, home of the SENSEX index. Located in Mumbai's Dalal Street.", category: "institutions" },
  { term: "FII", hindi: "एफआईआई", emoji: "🌍", definition: "Foreign Institutional Investors — big foreign funds that invest in Indian markets. When FIIs buy, prices often go up.", category: "institutions" },
  { term: "DII", hindi: "डीआईआई", emoji: "🇮🇳", definition: "Domestic Institutional Investors — Indian mutual funds, insurance companies, and banks that invest in the market.", category: "institutions" },
  { term: "Stop Loss", hindi: "स्टॉप लॉस", emoji: "🛑", definition: "An automatic order to sell a stock if it falls below a certain price. Like setting a safety net to limit your losses.", category: "trading" },
  { term: "Intraday", hindi: "इंट्राडे", emoji: "⚡", definition: "Buying and selling a stock on the same day. Very risky for beginners — most experts advise against it when starting out.", category: "trading" },
  { term: "Delivery", hindi: "डिलीवरी", emoji: "📬", definition: "When you buy a stock and hold it for more than one day. The shares are 'delivered' to your Demat account. This is what beginners should do.", category: "trading" },
  { term: "NIFTY", hindi: "निफ्टी", emoji: "📊", definition: "An index tracking India's top 50 companies. When people say 'market is up,' they usually mean NIFTY went up.", category: "basics" },
  { term: "SENSEX", hindi: "सेंसेक्स", emoji: "📈", definition: "An index tracking 30 of India's biggest companies on BSE. Similar to NIFTY but follows fewer (and only the largest) companies.", category: "basics" },
  { term: "Rupee Cost Averaging", hindi: "रुपी कॉस्ट एवरेजिंग", emoji: "⚖️", definition: "When you invest regularly via SIP, you automatically buy more shares when prices are low and fewer when high. This averages out your cost over time.", category: "analysis" },
];

export const GLOSSARY_CATEGORIES = [
  { id: "all", label: "All Terms", emoji: "📚" },
  { id: "basics", label: "Basics", emoji: "🎯" },
  { id: "trading", label: "Trading", emoji: "⚡" },
  { id: "analysis", label: "Analysis", emoji: "🔍" },
  { id: "institutions", label: "Institutions", emoji: "🏛️" },
];
