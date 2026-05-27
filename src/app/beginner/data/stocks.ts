// ═══════════════════════════════════════════════════════════════
// BEGINNER MODE — TOP 10 STOCKS DATA
// Curated blue-chip stocks safe for first-time investors.
// Prices are approximate defaults; replaced by live API later.
// ═══════════════════════════════════════════════════════════════

export interface BeginnerStock {
  name: string;
  ticker: string;
  sector: string;
  sectorColor: string;
  description: string;
  currentPrice: number;
  changePercent: number;
  oneYearReturn: number;
  threeYearReturn: number;
  aiVerdict: "good" | "watch" | "risky";
  verdictText: string;
  healthScores: {
    companyHealth: "good" | "neutral" | "bad";
    growthPotential: "good" | "neutral" | "bad";
    riskLevel: "good" | "neutral" | "bad";
    dividendPayout: "good" | "neutral" | "bad";
    expertOpinion: "good" | "neutral" | "bad";
  };
  revenue: string;
  profit: string;
  peRatio: number;
  peVerdict: string;
  tradingViewSymbol: string;
  aiSummary: string;
}

export const BEGINNER_STOCKS: BeginnerStock[] = [
  {
    name: "Reliance Industries",
    ticker: "RELIANCE",
    sector: "Oil & Gas",
    sectorColor: "#f59e0b",
    description: "India's biggest company. It runs Jio (your phone network), Reliance Retail (stores), and a massive oil refining business. Almost everyone in India uses something made by Reliance.",
    currentPrice: 1420,
    changePercent: 0.85,
    oneYearReturn: 14.2,
    threeYearReturn: 42.5,
    aiVerdict: "good",
    verdictText: "Strong for long-term holding",
    healthScores: { companyHealth: "good", growthPotential: "good", riskLevel: "good", dividendPayout: "neutral", expertOpinion: "good" },
    revenue: "9.5 Lakh Crore",
    profit: "79,000 Crore",
    peRatio: 28,
    peVerdict: "Fair price for a company this large",
    tradingViewSymbol: "NSE:RELIANCE",
    aiSummary: "White Tiger says: A solid choice for beginners who can hold for 3+ years. Reliance is well-diversified across energy, telecom, and retail.",
  },
  {
    name: "Tata Consultancy Services",
    ticker: "TCS",
    sector: "IT Services",
    sectorColor: "#6366f1",
    description: "India's largest IT company and part of the Tata Group. TCS builds software for banks, hospitals, and businesses around the world. Think of it as India's tech backbone.",
    currentPrice: 3780,
    changePercent: -0.32,
    oneYearReturn: 8.5,
    threeYearReturn: 35.2,
    aiVerdict: "good",
    verdictText: "Stable blue-chip pick",
    healthScores: { companyHealth: "good", growthPotential: "neutral", riskLevel: "good", dividendPayout: "good", expertOpinion: "good" },
    revenue: "2.4 Lakh Crore",
    profit: "46,000 Crore",
    peRatio: 31,
    peVerdict: "Slightly premium, but TCS is worth it for stability",
    tradingViewSymbol: "NSE:TCS",
    aiSummary: "White Tiger says: One of the safest stocks in India. Great for beginners who want steady, reliable growth without too much excitement.",
  },
  {
    name: "HDFC Bank",
    ticker: "HDFCBANK",
    sector: "Banking",
    sectorColor: "#2962ff",
    description: "India's most trusted private bank. From savings accounts to home loans, HDFC Bank serves crores of Indians. It's known for being well-managed and profitable.",
    currentPrice: 1820,
    changePercent: 1.15,
    oneYearReturn: 18.7,
    threeYearReturn: 28.3,
    aiVerdict: "good",
    verdictText: "India's strongest bank",
    healthScores: { companyHealth: "good", growthPotential: "good", riskLevel: "good", dividendPayout: "good", expertOpinion: "good" },
    revenue: "3.8 Lakh Crore",
    profit: "60,000 Crore",
    peRatio: 21,
    peVerdict: "Reasonably priced for India's best bank",
    tradingViewSymbol: "NSE:HDFCBANK",
    aiSummary: "White Tiger says: If you could only pick one bank stock, most experts would say HDFC Bank. Strong fundamentals and trusted management.",
  },
  {
    name: "Infosys",
    ticker: "INFY",
    sector: "IT Services",
    sectorColor: "#6366f1",
    description: "Co-founded by Narayana Murthy, Infosys is India's second-largest IT company. It helps global companies go digital, from cloud computing to AI solutions.",
    currentPrice: 1580,
    changePercent: 0.42,
    oneYearReturn: 11.3,
    threeYearReturn: 29.8,
    aiVerdict: "good",
    verdictText: "Reliable IT leader",
    healthScores: { companyHealth: "good", growthPotential: "good", riskLevel: "good", dividendPayout: "good", expertOpinion: "good" },
    revenue: "1.6 Lakh Crore",
    profit: "28,000 Crore",
    peRatio: 27,
    peVerdict: "Fair value for a growing tech company",
    tradingViewSymbol: "NSE:INFY",
    aiSummary: "White Tiger says: A quality IT stock that pays good dividends. Strong pick for beginners looking for a mix of growth and income.",
  },
  {
    name: "ITC Limited",
    ticker: "ITC",
    sector: "FMCG",
    sectorColor: "#10b981",
    description: "Known for cigarettes, but ITC is much more — Aashirvaad atta, Bingo chips, Sunfeast biscuits, Classmate notebooks, and luxury hotels. A true multi-business giant.",
    currentPrice: 465,
    changePercent: 0.28,
    oneYearReturn: 9.8,
    threeYearReturn: 68.5,
    aiVerdict: "good",
    verdictText: "Great dividend stock",
    healthScores: { companyHealth: "good", growthPotential: "neutral", riskLevel: "good", dividendPayout: "good", expertOpinion: "good" },
    revenue: "70,000 Crore",
    profit: "20,500 Crore",
    peRatio: 27,
    peVerdict: "Fair value with excellent dividend payouts",
    tradingViewSymbol: "NSE:ITC",
    aiSummary: "White Tiger says: ITC is a favourite for dividend lovers. It pays one of the highest dividends among large-cap stocks. Hold and collect!",
  },
  {
    name: "State Bank of India",
    ticker: "SBIN",
    sector: "Banking",
    sectorColor: "#2962ff",
    description: "India's oldest and largest government bank. SBI has branches in almost every village and town. If India grows, SBI grows — it's that simple.",
    currentPrice: 830,
    changePercent: -0.55,
    oneYearReturn: 22.4,
    threeYearReturn: 95.2,
    aiVerdict: "good",
    verdictText: "Affordable blue-chip bank",
    healthScores: { companyHealth: "good", growthPotential: "good", riskLevel: "neutral", dividendPayout: "neutral", expertOpinion: "good" },
    revenue: "4.2 Lakh Crore",
    profit: "62,000 Crore",
    peRatio: 10,
    peVerdict: "Very affordable compared to private banks",
    tradingViewSymbol: "NSE:SBIN",
    aiSummary: "White Tiger says: A great entry point for first-time investors. SBI stock is affordable and has shown strong growth recently.",
  },
  {
    name: "Bharti Airtel",
    ticker: "BHARTIARTL",
    sector: "Telecom",
    sectorColor: "#ef4444",
    description: "India's second-largest telecom company. Airtel provides mobile, broadband, and DTH services. With 5G rollout and growing data usage, telecom is a sunrise sector.",
    currentPrice: 1720,
    changePercent: 0.92,
    oneYearReturn: 35.8,
    threeYearReturn: 110.5,
    aiVerdict: "good",
    verdictText: "5G growth story",
    healthScores: { companyHealth: "good", growthPotential: "good", riskLevel: "neutral", dividendPayout: "neutral", expertOpinion: "good" },
    revenue: "1.5 Lakh Crore",
    profit: "12,000 Crore",
    peRatio: 75,
    peVerdict: "Expensive, but telecom is growing fast in India",
    tradingViewSymbol: "NSE:BHARTIARTL",
    aiSummary: "White Tiger says: A bet on India's digital future. The stock is not cheap, but Airtel is the strongest private telecom player.",
  },
  {
    name: "Larsen & Toubro",
    ticker: "LT",
    sector: "Infrastructure",
    sectorColor: "#f97316",
    description: "India's biggest construction and engineering company. From metro lines to defence systems to smart cities, L&T builds the infrastructure India needs.",
    currentPrice: 3550,
    changePercent: 0.15,
    oneYearReturn: 12.6,
    threeYearReturn: 72.1,
    aiVerdict: "good",
    verdictText: "India's infrastructure backbone",
    healthScores: { companyHealth: "good", growthPotential: "good", riskLevel: "neutral", dividendPayout: "neutral", expertOpinion: "good" },
    revenue: "2.3 Lakh Crore",
    profit: "15,000 Crore",
    peRatio: 35,
    peVerdict: "Fairly valued for India's infra boom",
    tradingViewSymbol: "NSE:LT",
    aiSummary: "White Tiger says: If you believe India will keep building roads, metros, and smart cities, L&T is the company that does it all.",
  },
  {
    name: "Maruti Suzuki",
    ticker: "MARUTI",
    sector: "Automobiles",
    sectorColor: "#8b5cf6",
    description: "India's car king. From Swift to Baleno to Brezza, almost every other car on Indian roads is a Maruti. They dominate the affordable car market.",
    currentPrice: 12400,
    changePercent: -0.18,
    oneYearReturn: 16.2,
    threeYearReturn: 55.3,
    aiVerdict: "good",
    verdictText: "Market leader in cars",
    healthScores: { companyHealth: "good", growthPotential: "good", riskLevel: "good", dividendPayout: "neutral", expertOpinion: "good" },
    revenue: "1.4 Lakh Crore",
    profit: "13,500 Crore",
    peRatio: 30,
    peVerdict: "Fairly priced for India's car market leader",
    tradingViewSymbol: "NSE:MARUTI",
    aiSummary: "White Tiger says: India's roads are getting more cars every year, and Maruti sells the most. A solid long-term story.",
  },
  {
    name: "Titan Company",
    ticker: "TITAN",
    sector: "Consumer",
    sectorColor: "#ec4899",
    description: "The company behind Tanishq jewellery, Titan watches, and Fastrack. Part of the Tata Group. As India's middle class grows and buys more, Titan benefits.",
    currentPrice: 3380,
    changePercent: 1.32,
    oneYearReturn: 19.5,
    threeYearReturn: 48.7,
    aiVerdict: "good",
    verdictText: "Premium consumer brand",
    healthScores: { companyHealth: "good", growthPotential: "good", riskLevel: "good", dividendPayout: "neutral", expertOpinion: "good" },
    revenue: "51,000 Crore",
    profit: "3,800 Crore",
    peRatio: 85,
    peVerdict: "Premium pricing because Titan grows fast and consistently",
    tradingViewSymbol: "NSE:TITAN",
    aiSummary: "White Tiger says: Titan is for patient investors. It looks expensive, but quality companies often stay expensive. Tanishq is unstoppable.",
  },
];

// Pre-set portfolio allocations
export const PORTFOLIO_PRESETS = {
  conservative: [
    { ticker: "HDFCBANK", allocation: 2500 },
    { ticker: "TCS", allocation: 2000 },
    { ticker: "ITC", allocation: 2000 },
    { ticker: "SBIN", allocation: 1500 },
    { ticker: "INFY", allocation: 2000 },
  ],
  balanced: [
    { ticker: "RELIANCE", allocation: 2000 },
    { ticker: "HDFCBANK", allocation: 2000 },
    { ticker: "INFY", allocation: 1500 },
    { ticker: "BHARTIARTL", allocation: 1500 },
    { ticker: "ITC", allocation: 1000 },
    { ticker: "TITAN", allocation: 1000 },
    { ticker: "SBIN", allocation: 1000 },
  ],
  growth: [
    { ticker: "BHARTIARTL", allocation: 2500 },
    { ticker: "TITAN", allocation: 2000 },
    { ticker: "RELIANCE", allocation: 2000 },
    { ticker: "LT", allocation: 1500 },
    { ticker: "MARUTI", allocation: 2000 },
  ],
};
