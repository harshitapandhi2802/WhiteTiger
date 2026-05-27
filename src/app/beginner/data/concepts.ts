// ═══════════════════════════════════════════════════════════════
// BEGINNER MODE — DAILY CONCEPT CARDS
// One investing concept per day, simple language, no jargon.
// ═══════════════════════════════════════════════════════════════

export interface DailyConcept {
  day: number; // 0=Sunday, 1=Monday, ...
  title: string;
  emoji: string;
  question: string;
  explanation: string;
  analogy: string;
  funFact: string;
}

export const DAILY_CONCEPTS: DailyConcept[] = [
  {
    day: 0, // Sunday
    title: "Gold ETF",
    emoji: "🥇",
    question: "What is a Gold ETF?",
    explanation: "Own gold without the locker! A Gold ETF tracks the price of real gold and trades on the stock exchange just like a regular stock. You can buy a tiny fraction of gold starting from a few hundred rupees.",
    analogy: "Think of it like ordering gold online that sits safely in a vault, and you can sell it with one click anytime the market is open.",
    funFact: "India is the world's second largest consumer of gold. Gold ETFs let you invest in gold without worrying about purity or storage!",
  },
  {
    day: 1, // Monday
    title: "NIFTY 50",
    emoji: "📊",
    question: "What is NIFTY 50?",
    explanation: "NIFTY 50 is like a report card of India's top 50 companies. When people say 'the market is up today,' they usually mean the NIFTY 50 index went up. It covers companies from banking, IT, pharma, energy, and more.",
    analogy: "Imagine your college tracks the average marks of the top 50 students. If that average goes up, the college is doing well. NIFTY works the same way for India's stock market.",
    funFact: "NIFTY 50 was launched in 1996 at 1,000 points. Today it's above 20,000 — that's 20x growth in less than 30 years!",
  },
  {
    day: 2, // Tuesday
    title: "SIP",
    emoji: "💰",
    question: "What is SIP?",
    explanation: "SIP stands for Systematic Investment Plan. Instead of investing a big lump sum at once, you invest a fixed amount every month automatically. This way, you buy more when prices are low and less when they are high.",
    analogy: "Think of it like a monthly subscription — just like Netflix or Spotify, but instead of entertainment, you're subscribing to wealth building!",
    funFact: "If you started a SIP of just Rs 5,000 per month 15 years ago in NIFTY, your Rs 9 lakh investment would be worth around Rs 25+ lakh today!",
  },
  {
    day: 3, // Wednesday
    title: "P/E Ratio",
    emoji: "🔍",
    question: "What is P/E Ratio?",
    explanation: "P/E Ratio (Price-to-Earnings) tells you if a stock is cheap or expensive relative to how much profit the company makes. A lower P/E means the stock might be a better deal, and a higher P/E means you're paying more for each rupee of profit.",
    analogy: "Imagine two tea stalls both earn Rs 10,000/month. If one costs Rs 1 lakh to buy (P/E = 10) and the other costs Rs 3 lakh (P/E = 30), the first one gives you more value for your money.",
    funFact: "The average P/E of NIFTY 50 is around 20-22. When it goes above 25, the market is considered expensive. Below 15? It might be a good time to invest more!",
  },
  {
    day: 4, // Thursday
    title: "Mutual Funds",
    emoji: "🚌",
    question: "What are Mutual Funds?",
    explanation: "A Mutual Fund pools money from thousands of investors and a professional fund manager invests it in stocks, bonds, or other assets. You don't need to pick individual stocks — the expert does it for you.",
    analogy: "Imagine a bus where everyone pools money for fuel, and an experienced driver decides the best route. You sit back and enjoy the ride. That driver is the fund manager!",
    funFact: "There are over 1,500 mutual fund schemes in India! But most experts recommend starting with just 2-3 well-chosen funds.",
  },
  {
    day: 5, // Friday
    title: "Diversification",
    emoji: "🥚",
    question: "What is Diversification?",
    explanation: "Diversification means spreading your money across different types of investments instead of putting everything in one stock. If one investment falls, others might still be doing well, protecting your overall portfolio.",
    analogy: "The classic saying: Don't put all your eggs in one basket! If you drop that one basket, all eggs break. But if eggs are in 5 baskets, dropping one basket still leaves you with 4 baskets of eggs.",
    funFact: "Studies show that holding just 15-20 different stocks across sectors gives you nearly the same protection as holding 500 stocks!",
  },
  {
    day: 6, // Saturday
    title: "Demat Account",
    emoji: "🏦",
    question: "What is a Demat Account?",
    explanation: "A Demat (Dematerialized) Account is a digital locker for your stocks. Just like you need a bank account to store money, you need a Demat account to store your shares electronically. No physical certificates needed!",
    analogy: "Think of it like your phone's photo gallery — just as photos are stored digitally instead of printed albums, your shares are stored digitally instead of paper certificates.",
    funFact: "India had only 4 crore Demat accounts in 2020. By 2024, it crossed 15 crore! Young Indians are leading this investing revolution.",
  },
];
