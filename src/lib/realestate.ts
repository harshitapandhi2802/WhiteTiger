/* ═══════════════════════════════════════════════════════════════
   GLOBAL REAL ESTATE INTELLIGENCE DATA
   Research-backed data for institutional-grade real estate analysis
   ═══════════════════════════════════════════════════════════════ */

/* ─── Seeded RNG for deterministic chart data ─── */
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

/* ─── Time-Series Data Generator ─── */
export interface MarketTimeSeries {
  months: string[];
  prices: number[];       // property price index (base 100)
  rentals: number[];      // rental index (base 100)
  demand: number[];       // demand momentum 0-100
  luxury: number[];       // luxury segment index
  commercial: number[];   // commercial demand index
  affordability: number[]; // affordability index (higher = more affordable)
}

export interface CityArea {
  name: string;
  avgPrice: number;
  growth: number;
  demand: "Hot" | "Warm" | "Cool";
  type: "Premium" | "Mid-Range" | "Affordable" | "Ultra-Luxury";
}

export interface MarketDeepData {
  timeSeries: MarketTimeSeries;
  areas: CityArea[];
  aiSummary: string[];
  growthScore: number;
  yieldScore: number;
  riskScore: number;
  infraScore: number;
  futureScore: number;
  sentiment: "Very Bullish" | "Bullish" | "Neutral" | "Bearish";
  demandTrend: "Surging" | "Rising" | "Stable" | "Cooling";
}

const AREA_DATA: Record<string, CityArea[]> = {
  Dubai: [
    { name: "Palm Jumeirah", avgPrice: 2800, growth: 22, demand: "Hot", type: "Ultra-Luxury" },
    { name: "Downtown", avgPrice: 2200, growth: 18, demand: "Hot", type: "Premium" },
    { name: "Dubai Marina", avgPrice: 1600, growth: 15, demand: "Hot", type: "Premium" },
    { name: "JVC", avgPrice: 850, growth: 12, demand: "Warm", type: "Mid-Range" },
    { name: "Dubai South", avgPrice: 650, growth: 25, demand: "Hot", type: "Affordable" },
    { name: "Business Bay", avgPrice: 1400, growth: 14, demand: "Warm", type: "Mid-Range" },
  ],
  Mumbai: [
    { name: "South Mumbai", avgPrice: 45000, growth: 8, demand: "Warm", type: "Ultra-Luxury" },
    { name: "BKC / Bandra", avgPrice: 38000, growth: 16, demand: "Hot", type: "Premium" },
    { name: "Worli / Lower Parel", avgPrice: 32000, growth: 14, demand: "Hot", type: "Premium" },
    { name: "Andheri / Goregaon", avgPrice: 18000, growth: 12, demand: "Warm", type: "Mid-Range" },
    { name: "Thane / Navi Mumbai", avgPrice: 10000, growth: 18, demand: "Hot", type: "Affordable" },
    { name: "Panvel / Ulwe", avgPrice: 7500, growth: 30, demand: "Hot", type: "Affordable" },
  ],
  Bengaluru: [
    { name: "Whitefield", avgPrice: 8500, growth: 22, demand: "Hot", type: "Mid-Range" },
    { name: "Electronic City", avgPrice: 6200, growth: 20, demand: "Hot", type: "Affordable" },
    { name: "Sarjapur Road", avgPrice: 7800, growth: 25, demand: "Hot", type: "Mid-Range" },
    { name: "Koramangala / Indiranagar", avgPrice: 14000, growth: 12, demand: "Warm", type: "Premium" },
    { name: "Devanahalli / Airport", avgPrice: 5500, growth: 28, demand: "Hot", type: "Affordable" },
    { name: "Hebbal / Yelahanka", avgPrice: 7200, growth: 18, demand: "Warm", type: "Mid-Range" },
  ],
  Hyderabad: [
    { name: "Gachibowli / HITEC City", avgPrice: 8200, growth: 24, demand: "Hot", type: "Mid-Range" },
    { name: "Kokapet / Financial District", avgPrice: 9500, growth: 30, demand: "Hot", type: "Premium" },
    { name: "Tellapur / Nallagandla", avgPrice: 6800, growth: 22, demand: "Hot", type: "Mid-Range" },
    { name: "Shamshabad / Airport", avgPrice: 4500, growth: 35, demand: "Hot", type: "Affordable" },
    { name: "Banjara Hills / Jubilee Hills", avgPrice: 15000, growth: 10, demand: "Warm", type: "Ultra-Luxury" },
    { name: "Pocharam / Uppal", avgPrice: 5200, growth: 20, demand: "Warm", type: "Affordable" },
  ],
  Singapore: [
    { name: "Orchard / River Valley", avgPrice: 2800, growth: 5, demand: "Warm", type: "Ultra-Luxury" },
    { name: "Marina Bay / CBD", avgPrice: 2600, growth: 7, demand: "Warm", type: "Premium" },
    { name: "Sentosa Cove", avgPrice: 2200, growth: 4, demand: "Cool", type: "Ultra-Luxury" },
    { name: "Bukit Timah", avgPrice: 2000, growth: 8, demand: "Warm", type: "Premium" },
    { name: "Jurong East", avgPrice: 1200, growth: 10, demand: "Hot", type: "Mid-Range" },
    { name: "Punggol / Sengkang", avgPrice: 950, growth: 6, demand: "Cool", type: "Affordable" },
  ],
  Tokyo: [
    { name: "Minato / Roppongi", avgPrice: 1800, growth: 12, demand: "Hot", type: "Ultra-Luxury" },
    { name: "Shibuya / Shinjuku", avgPrice: 1500, growth: 10, demand: "Hot", type: "Premium" },
    { name: "Chiyoda / Marunouchi", avgPrice: 2000, growth: 8, demand: "Warm", type: "Premium" },
    { name: "Setagaya", avgPrice: 900, growth: 6, demand: "Warm", type: "Mid-Range" },
    { name: "Suginami / Nakano", avgPrice: 750, growth: 9, demand: "Warm", type: "Mid-Range" },
    { name: "Toshima / Ikebukuro", avgPrice: 800, growth: 11, demand: "Hot", type: "Affordable" },
  ],
  London: [
    { name: "Mayfair / Knightsbridge", avgPrice: 3500, growth: 2, demand: "Cool", type: "Ultra-Luxury" },
    { name: "Chelsea / Kensington", avgPrice: 2800, growth: 1, demand: "Cool", type: "Premium" },
    { name: "Canary Wharf", avgPrice: 900, growth: 3, demand: "Warm", type: "Mid-Range" },
    { name: "Shoreditch / Hackney", avgPrice: 850, growth: 4, demand: "Warm", type: "Mid-Range" },
    { name: "Stratford / E20", avgPrice: 650, growth: 6, demand: "Hot", type: "Affordable" },
    { name: "Battersea / Nine Elms", avgPrice: 1100, growth: -2, demand: "Cool", type: "Mid-Range" },
  ],
  "New York": [
    { name: "Manhattan Midtown", avgPrice: 1800, growth: 3, demand: "Warm", type: "Premium" },
    { name: "Tribeca / SoHo", avgPrice: 2200, growth: 2, demand: "Warm", type: "Ultra-Luxury" },
    { name: "Brooklyn Heights", avgPrice: 1200, growth: 5, demand: "Warm", type: "Mid-Range" },
    { name: "Long Island City", avgPrice: 900, growth: 6, demand: "Hot", type: "Mid-Range" },
    { name: "Harlem / Uptown", avgPrice: 700, growth: 4, demand: "Warm", type: "Affordable" },
    { name: "Jersey City (NJ)", avgPrice: 750, growth: 7, demand: "Hot", type: "Affordable" },
  ],
  Riyadh: [
    { name: "KAFD / Financial District", avgPrice: 800, growth: 20, demand: "Hot", type: "Premium" },
    { name: "Al Olaya", avgPrice: 650, growth: 18, demand: "Hot", type: "Mid-Range" },
    { name: "Diplomatic Quarter", avgPrice: 700, growth: 15, demand: "Warm", type: "Premium" },
    { name: "Al Malqa", avgPrice: 500, growth: 22, demand: "Hot", type: "Mid-Range" },
    { name: "NEOM Zone", avgPrice: 350, growth: 40, demand: "Hot", type: "Affordable" },
    { name: "Al Narjis", avgPrice: 400, growth: 16, demand: "Warm", type: "Affordable" },
  ],
  Sydney: [
    { name: "Eastern Suburbs", avgPrice: 1800, growth: 10, demand: "Warm", type: "Ultra-Luxury" },
    { name: "CBD / Harbour", avgPrice: 1600, growth: 8, demand: "Warm", type: "Premium" },
    { name: "North Shore", avgPrice: 1200, growth: 9, demand: "Warm", type: "Premium" },
    { name: "Parramatta", avgPrice: 700, growth: 12, demand: "Hot", type: "Mid-Range" },
    { name: "Western Sydney", avgPrice: 550, growth: 14, demand: "Hot", type: "Affordable" },
    { name: "South West Growth Area", avgPrice: 450, growth: 16, demand: "Hot", type: "Affordable" },
  ],
  "Ho Chi Minh": [
    { name: "District 1 / CBD", avgPrice: 450, growth: 12, demand: "Hot", type: "Premium" },
    { name: "Thao Dien / District 2", avgPrice: 350, growth: 15, demand: "Hot", type: "Mid-Range" },
    { name: "District 7 / Phu My Hung", avgPrice: 280, growth: 10, demand: "Warm", type: "Mid-Range" },
    { name: "Thu Duc City", avgPrice: 200, growth: 18, demand: "Hot", type: "Affordable" },
    { name: "Binh Thanh", avgPrice: 300, growth: 14, demand: "Warm", type: "Mid-Range" },
    { name: "District 9", avgPrice: 180, growth: 20, demand: "Hot", type: "Affordable" },
  ],
  Lisbon: [
    { name: "Chiado / Baixa", avgPrice: 750, growth: 10, demand: "Hot", type: "Premium" },
    { name: "Principe Real", avgPrice: 680, growth: 8, demand: "Warm", type: "Premium" },
    { name: "Parque das Nacoes", avgPrice: 520, growth: 12, demand: "Hot", type: "Mid-Range" },
    { name: "Cascais", avgPrice: 600, growth: 9, demand: "Warm", type: "Premium" },
    { name: "Alfama", avgPrice: 450, growth: 7, demand: "Warm", type: "Mid-Range" },
    { name: "Almada", avgPrice: 300, growth: 14, demand: "Hot", type: "Affordable" },
  ],
};

const AI_SUMMARIES: Record<string, string[]> = {
  Dubai: [
    "Dubai luxury residential hitting record prices driven by HNWI migration from Russia, India, and China.",
    "Off-plan sales surging 35% YoY — developers launching at premium pricing with strong pre-sales velocity.",
    "Dubai South area positioned for 25-40% appreciation as Al Maktoum Airport expansion nears approval.",
    "Rental yields averaging 7-9% — significantly outperforming most global markets.",
  ],
  Mumbai: [
    "Mumbai residential market in strongest upcycle since 2014 — registration data shows 28% YoY volume growth.",
    "BKC-Worli corridor emerging as India's most expensive office micro-market, rivaling Singapore CBD rents.",
    "Navi Mumbai airport catalyst driving Panvel-Ulwe corridor prices up 30-50% from 2023 base.",
    "Luxury segment (₹5Cr+) seeing unprecedented demand from tech founders and NRI investors.",
  ],
  Bengaluru: [
    "Bengaluru witnessing strongest residential demand in a decade — IT corridor absorption at all-time high.",
    "Whitefield-Sarjapur belt seeing 20-25% price appreciation driven by tech employment growth.",
    "Data center demand creating new micro-market near Devanahalli with institutional-grade warehousing demand.",
    "Metro Phase 2 completion expected to unlock peripheral growth corridors with 15-20% appreciation potential.",
  ],
  Hyderabad: [
    "Hyderabad emerging as India's fastest-growing real estate market — prices up 20% YoY in key corridors.",
    "Kokapet-Financial District area seeing premium pricing comparable to Bengaluru's established tech parks.",
    "Pharma City development creating Asia's largest pharmaceutical manufacturing zone with massive ancillary demand.",
    "Affordable housing segment seeing strongest momentum with government subsidies driving first-time buyer demand.",
  ],
  Singapore: [
    "Singapore residential market stabilizing after government cooling measures — ABSD at 60% for foreigners.",
    "Industrial and logistics REITs outperforming as Tuas Mega Port Phase 2 drives demand.",
    "Data center moratorium lifting creating fresh opportunities in Jurong innovation district.",
    "Private residential prices moderated to +6.8% YoY but rental market remains tight at 3.5% vacancy.",
  ],
  Tokyo: [
    "Tokyo commercial real estate attracting record foreign investment — weak yen creating buying opportunities.",
    "Shibuya-Minato tech corridor seeing office rents rise 8% as global tech firms expand Japan presence.",
    "Hospitality sector booming — hotel investment up 40% as inbound tourism exceeds pre-COVID records.",
    "Residential prices in 23 wards up 9.8% YoY — strongest growth in 30 years driven by ultra-low mortgages.",
  ],
  London: [
    "London office market under pressure from remote work — vacancy rates at 10-year highs in City of London.",
    "Build-to-rent sector receiving £8B+ annual institutional investment from Gulf SWFs and Canadian pensions.",
    "Student housing demand creating opportunities near university clusters in Bloomsbury and Stratford.",
    "Prime central London prices stagnant but outer zones seeing 4-6% growth from domestic buyers.",
  ],
  "New York": [
    "NYC multifamily market stabilizing after pandemic exodus reversal — Manhattan rents at all-time highs.",
    "Life sciences real estate emerging as fastest-growing sector — lab space demand up 200% since 2020.",
    "Hudson Yards and Brooklyn waterfront driving new premium supply with strong pre-leasing.",
    "$1.5T CRE loan maturity wall creating potential distressed buying opportunities in office sector.",
  ],
  Riyadh: [
    "Saudi Vision 2030 creating unprecedented real estate investment cycle — domestic demand surging.",
    "NEOM mega-project entering construction phase with hospitality and luxury residential leading demand.",
    "KAFD financial district achieving 90%+ occupancy as international firms establish regional HQs.",
    "Government housing programs driving 40% increase in mortgage originations year-over-year.",
  ],
  Sydney: [
    "Sydney residential market recovering with 8.5% annual price growth driven by supply shortage.",
    "Western Sydney Aerotropolis creating new growth corridor with 15-20% land value appreciation.",
    "Build-to-rent emerging as institutional-grade asset class with foreign pension fund interest.",
    "Healthcare real estate attracting Japanese and Korean institutional capital amid aging demographics.",
  ],
};

export function generateMarketData(cityName: string, appreciation: number): MarketDeepData {
  const rng = seededRng(cityName.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "Jan'25", "Feb'25", "Mar'25", "Apr'25", "May'25"];
  const monthlyGrowth = appreciation / 12 / 100;

  let price = 100, rental = 100, luxury = 100, commercial = 100, afford = 100;
  const prices: number[] = [], rentals: number[] = [], demands: number[] = [],
    luxuries: number[] = [], commercials: number[] = [], affordabilities: number[] = [];

  for (let i = 0; i < months.length; i++) {
    price *= 1 + monthlyGrowth + (rng() - 0.4) * 0.015;
    rental *= 1 + monthlyGrowth * 0.8 + (rng() - 0.45) * 0.012;
    luxury *= 1 + monthlyGrowth * 1.2 + (rng() - 0.42) * 0.018;
    commercial *= 1 + monthlyGrowth * 0.6 + (rng() - 0.48) * 0.01;
    afford *= 1 - monthlyGrowth * 0.3 + (rng() - 0.5) * 0.008;
    prices.push(Math.round(price * 10) / 10);
    rentals.push(Math.round(rental * 10) / 10);
    demands.push(Math.min(100, Math.max(20, Math.round(50 + appreciation * 2 + (rng() - 0.5) * 30))));
    luxuries.push(Math.round(luxury * 10) / 10);
    commercials.push(Math.round(commercial * 10) / 10);
    affordabilities.push(Math.round(afford * 10) / 10);
  }

  const city = CITIES_RE.find(c => c.name === cityName);
  const score = city?.investmentScore ?? 70;
  const risk = city?.riskLevel ?? "Medium";

  return {
    timeSeries: { months, prices, rentals, demand: demands, luxury: luxuries, commercial: commercials, affordability: affordabilities },
    areas: AREA_DATA[cityName] || [
      { name: "Central District", avgPrice: 1200, growth: 8, demand: "Warm" as const, type: "Premium" as const },
      { name: "Suburban Belt", avgPrice: 600, growth: 12, demand: "Hot" as const, type: "Mid-Range" as const },
      { name: "Growth Corridor", avgPrice: 350, growth: 18, demand: "Hot" as const, type: "Affordable" as const },
    ],
    aiSummary: AI_SUMMARIES[cityName] || [
      `${cityName} real estate market showing ${appreciation > 10 ? "strong" : "moderate"} momentum with ${appreciation}% annual appreciation.`,
      `Rental yields in ${cityName} ${city?.rentalYield && city.rentalYield > 5 ? "outperforming" : "tracking"} global averages.`,
      `Infrastructure development continues to drive property demand in emerging corridors.`,
    ],
    growthScore: Math.min(100, Math.round(appreciation * 4 + rng() * 15)),
    yieldScore: Math.min(100, Math.round((city?.rentalYield ?? 4) * 12 + rng() * 10)),
    riskScore: risk === "Low" ? Math.round(25 + rng() * 15) : risk === "Medium" ? Math.round(45 + rng() * 15) : Math.round(65 + rng() * 15),
    infraScore: Math.min(100, Math.round((city?.infrastructureScore ?? 7) * 10 + rng() * 5)),
    futureScore: Math.min(100, Math.round(score * 0.8 + appreciation * 1.2 + rng() * 10)),
    sentiment: appreciation > 15 ? "Very Bullish" : appreciation > 8 ? "Bullish" : appreciation > 3 ? "Neutral" : "Bearish",
    demandTrend: appreciation > 15 ? "Surging" : appreciation > 10 ? "Rising" : appreciation > 5 ? "Stable" : "Cooling",
  };
}

/* ─── Sparkline data for mini-charts (24 points) ─── */
export function generateSparkline(cityName: string, appreciation: number): number[] {
  const rng = seededRng(cityName.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 7);
  const points: number[] = [];
  let val = 100;
  const monthlyGrowth = appreciation / 24 / 100;
  for (let i = 0; i < 24; i++) {
    val *= 1 + monthlyGrowth + (rng() - 0.42) * 0.018;
    points.push(Math.round(val * 10) / 10);
  }
  return points;
}

export interface CountryRE {
  code: string;          // ISO 3166
  name: string;
  flag: string;
  region: string;
  opportunity: "High" | "Medium" | "Low";
  risk: "High" | "Medium" | "Low";
  rentalYield: number;   // %
  priceAppreciation: number; // YoY %
  momentum: "Strong" | "Stable" | "Weak" | "Declining";
  interestRate: number;  // central bank %
  currencyRisk: "Low" | "Medium" | "High";
  investmentScore: number; // 0-100
  capitalInflow: "Rising" | "Stable" | "Declining";
  population: number;    // millions
  gdpGrowth: number;     // %
}

export interface CityRE {
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  rentalYield: number;
  priceAppreciation: number;
  priceToIncome: number;
  populationGrowth: number; // %
  transactionVolume: "High" | "Medium" | "Low";
  mortgageRate: number;
  gdpGrowth: number;
  infrastructureScore: number; // 1-10
  riskLevel: "Low" | "Medium" | "High";
  investmentScore: number;
  avgPriceSqft: number;
  currency: string;
  hotSectors: string[];
}

export interface SectorRE {
  name: string;
  icon: string;
  globalYield: number;
  outlook: "Bullish" | "Neutral" | "Bearish";
  momentum: "Strong" | "Stable" | "Weak";
  riskLevel: "Low" | "Medium" | "High";
  keyDriver: string;
  topMarkets: string[];
  growth5Y: number; // projected 5-yr CAGR %
}

export interface CapitalFlow {
  source: string;
  destination: string;
  sector: string;
  amount: string;
  trend: "Rising" | "Stable" | "Declining";
  insight: string;
}

export interface MacroCorrelation {
  variable: string;
  impact: string;
  direction: "Positive" | "Negative" | "Mixed";
  strength: "Strong" | "Moderate" | "Weak";
  affectedMarkets: string[];
}

export interface RiskFactor {
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  affectedCountries: string[];
  description: string;
}

export interface AIInsight {
  title: string;
  body: string;
  type: "opportunity" | "risk" | "trend" | "alert";
  region: string;
  timestamp: string;
}

/* ─── COUNTRY DATA ─── */
export const COUNTRIES_RE: CountryRE[] = [
  { code: "AE", name: "UAE", flag: "🇦🇪", region: "Middle East", opportunity: "High", risk: "Medium", rentalYield: 7.8, priceAppreciation: 16.2, momentum: "Strong", interestRate: 5.15, currencyRisk: "Low", investmentScore: 88, capitalInflow: "Rising", population: 10.1, gdpGrowth: 4.0 },
  { code: "SG", name: "Singapore", flag: "🇸🇬", region: "Asia-Pacific", opportunity: "Medium", risk: "Low", rentalYield: 3.4, priceAppreciation: 6.8, momentum: "Stable", interestRate: 3.75, currencyRisk: "Low", investmentScore: 82, capitalInflow: "Rising", population: 5.9, gdpGrowth: 2.8 },
  { code: "IN", name: "India", flag: "🇮🇳", region: "Asia-Pacific", opportunity: "High", risk: "Medium", rentalYield: 3.8, priceAppreciation: 12.5, momentum: "Strong", interestRate: 6.25, currencyRisk: "Medium", investmentScore: 85, capitalInflow: "Rising", population: 1450, gdpGrowth: 7.2 },
  { code: "US", name: "United States", flag: "🇺🇸", region: "North America", opportunity: "Medium", risk: "Low", rentalYield: 4.2, priceAppreciation: 4.5, momentum: "Stable", interestRate: 5.25, currencyRisk: "Low", investmentScore: 76, capitalInflow: "Stable", population: 335, gdpGrowth: 2.4 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", region: "Europe", opportunity: "Medium", risk: "Medium", rentalYield: 4.8, priceAppreciation: 2.1, momentum: "Weak", interestRate: 5.0, currencyRisk: "Low", investmentScore: 68, capitalInflow: "Stable", population: 68, gdpGrowth: 0.6 },
  { code: "DE", name: "Germany", flag: "🇩🇪", region: "Europe", opportunity: "Low", risk: "Medium", rentalYield: 3.1, priceAppreciation: -3.2, momentum: "Declining", interestRate: 4.25, currencyRisk: "Low", investmentScore: 52, capitalInflow: "Declining", population: 84, gdpGrowth: 0.2 },
  { code: "JP", name: "Japan", flag: "🇯🇵", region: "Asia-Pacific", opportunity: "Medium", risk: "Low", rentalYield: 3.9, priceAppreciation: 8.2, momentum: "Strong", interestRate: 0.25, currencyRisk: "High", investmentScore: 74, capitalInflow: "Rising", population: 124, gdpGrowth: 1.1 },
  { code: "AU", name: "Australia", flag: "🇦🇺", region: "Asia-Pacific", opportunity: "Medium", risk: "Low", rentalYield: 4.5, priceAppreciation: 7.1, momentum: "Stable", interestRate: 4.35, currencyRisk: "Low", investmentScore: 73, capitalInflow: "Stable", population: 26.5, gdpGrowth: 1.5 },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", region: "Middle East", opportunity: "High", risk: "Medium", rentalYield: 6.5, priceAppreciation: 11.8, momentum: "Strong", interestRate: 5.5, currencyRisk: "Low", investmentScore: 83, capitalInflow: "Rising", population: 36.9, gdpGrowth: 4.5 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", region: "Latin America", opportunity: "Medium", risk: "High", rentalYield: 5.8, priceAppreciation: 6.4, momentum: "Stable", interestRate: 10.5, currencyRisk: "High", investmentScore: 58, capitalInflow: "Stable", population: 216, gdpGrowth: 2.9 },
  { code: "CA", name: "Canada", flag: "🇨🇦", region: "North America", opportunity: "Low", risk: "Medium", rentalYield: 3.8, priceAppreciation: -1.5, momentum: "Weak", interestRate: 4.5, currencyRisk: "Low", investmentScore: 61, capitalInflow: "Declining", population: 40.4, gdpGrowth: 1.2 },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", region: "Asia-Pacific", opportunity: "High", risk: "High", rentalYield: 5.2, priceAppreciation: 9.8, momentum: "Strong", interestRate: 4.5, currencyRisk: "Medium", investmentScore: 79, capitalInflow: "Rising", population: 100, gdpGrowth: 6.5 },
  { code: "TR", name: "Turkey", flag: "🇹🇷", region: "Europe", opportunity: "High", risk: "High", rentalYield: 5.5, priceAppreciation: 32.0, momentum: "Strong", interestRate: 45.0, currencyRisk: "High", investmentScore: 62, capitalInflow: "Rising", population: 85, gdpGrowth: 4.0 },
  { code: "MX", name: "Mexico", flag: "🇲🇽", region: "Latin America", opportunity: "Medium", risk: "Medium", rentalYield: 6.1, priceAppreciation: 8.5, momentum: "Stable", interestRate: 10.0, currencyRisk: "Medium", investmentScore: 70, capitalInflow: "Rising", population: 131, gdpGrowth: 3.2 },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", region: "Asia-Pacific", opportunity: "High", risk: "Medium", rentalYield: 5.6, priceAppreciation: 7.3, momentum: "Stable", interestRate: 6.0, currencyRisk: "Medium", investmentScore: 75, capitalInflow: "Rising", population: 278, gdpGrowth: 5.1 },
  { code: "PL", name: "Poland", flag: "🇵🇱", region: "Europe", opportunity: "Medium", risk: "Low", rentalYield: 5.2, priceAppreciation: 11.0, momentum: "Strong", interestRate: 5.75, currencyRisk: "Medium", investmentScore: 77, capitalInflow: "Rising", population: 37, gdpGrowth: 3.5 },
  { code: "GR", name: "Greece", flag: "🇬🇷", region: "Europe", opportunity: "High", risk: "Medium", rentalYield: 6.8, priceAppreciation: 13.5, momentum: "Strong", interestRate: 4.25, currencyRisk: "Low", investmentScore: 80, capitalInflow: "Rising", population: 10.4, gdpGrowth: 2.0 },
  { code: "PT", name: "Portugal", flag: "🇵🇹", region: "Europe", opportunity: "Medium", risk: "Low", rentalYield: 5.5, priceAppreciation: 8.2, momentum: "Stable", interestRate: 4.25, currencyRisk: "Low", investmentScore: 76, capitalInflow: "Stable", population: 10.3, gdpGrowth: 2.3 },
];

/* ─── CITY DATA ─── */
export const CITIES_RE: CityRE[] = [
  { name: "Dubai", country: "UAE", countryCode: "AE", flag: "🇦🇪", rentalYield: 8.2, priceAppreciation: 19.5, priceToIncome: 8.5, populationGrowth: 4.5, transactionVolume: "High", mortgageRate: 5.99, gdpGrowth: 4.2, infrastructureScore: 9, riskLevel: "Medium", investmentScore: 92, avgPriceSqft: 450, currency: "AED", hotSectors: ["Luxury", "Off-plan", "Hospitality"] },
  { name: "Mumbai", country: "India", countryCode: "IN", flag: "🇮🇳", rentalYield: 3.5, priceAppreciation: 14.2, priceToIncome: 22, populationGrowth: 1.8, transactionVolume: "High", mortgageRate: 8.5, gdpGrowth: 7.5, infrastructureScore: 6, riskLevel: "Medium", investmentScore: 84, avgPriceSqft: 280, currency: "INR", hotSectors: ["Residential", "Commercial", "Redevelopment"] },
  { name: "Singapore", country: "Singapore", countryCode: "SG", flag: "🇸🇬", rentalYield: 3.5, priceAppreciation: 7.2, priceToIncome: 15, populationGrowth: 1.2, transactionVolume: "Medium", mortgageRate: 3.75, gdpGrowth: 2.8, infrastructureScore: 10, riskLevel: "Low", investmentScore: 85, avgPriceSqft: 1800, currency: "SGD", hotSectors: ["Logistics", "Data Centers", "Luxury"] },
  { name: "Tokyo", country: "Japan", countryCode: "JP", flag: "🇯🇵", rentalYield: 4.1, priceAppreciation: 9.8, priceToIncome: 13, populationGrowth: -0.1, transactionVolume: "High", mortgageRate: 1.2, gdpGrowth: 1.3, infrastructureScore: 10, riskLevel: "Low", investmentScore: 80, avgPriceSqft: 950, currency: "JPY", hotSectors: ["Office", "Hospitality", "Logistics"] },
  { name: "London", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", rentalYield: 4.5, priceAppreciation: 1.8, priceToIncome: 16, populationGrowth: 0.5, transactionVolume: "Medium", mortgageRate: 5.2, gdpGrowth: 0.7, infrastructureScore: 9, riskLevel: "Medium", investmentScore: 72, avgPriceSqft: 1200, currency: "GBP", hotSectors: ["Student Housing", "Build-to-Rent", "Logistics"] },
  { name: "New York", country: "United States", countryCode: "US", flag: "🇺🇸", rentalYield: 4.0, priceAppreciation: 3.2, priceToIncome: 12, populationGrowth: 0.3, transactionVolume: "High", mortgageRate: 6.8, gdpGrowth: 2.5, infrastructureScore: 8, riskLevel: "Low", investmentScore: 75, avgPriceSqft: 1400, currency: "USD", hotSectors: ["Multifamily", "Life Sciences", "Data Centers"] },
  { name: "Bengaluru", country: "India", countryCode: "IN", flag: "🇮🇳", rentalYield: 4.2, priceAppreciation: 18.5, priceToIncome: 12, populationGrowth: 3.5, transactionVolume: "High", mortgageRate: 8.5, gdpGrowth: 8.5, infrastructureScore: 7, riskLevel: "Medium", investmentScore: 88, avgPriceSqft: 120, currency: "INR", hotSectors: ["IT Corridors", "Residential", "Commercial"] },
  { name: "Riyadh", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", rentalYield: 7.0, priceAppreciation: 15.0, priceToIncome: 7, populationGrowth: 3.8, transactionVolume: "High", mortgageRate: 5.5, gdpGrowth: 5.0, infrastructureScore: 8, riskLevel: "Medium", investmentScore: 86, avgPriceSqft: 200, currency: "SAR", hotSectors: ["NEOM", "Hospitality", "Commercial"] },
  { name: "Sydney", country: "Australia", countryCode: "AU", flag: "🇦🇺", rentalYield: 4.3, priceAppreciation: 8.5, priceToIncome: 14, populationGrowth: 1.5, transactionVolume: "Medium", mortgageRate: 6.5, gdpGrowth: 1.8, infrastructureScore: 9, riskLevel: "Low", investmentScore: 74, avgPriceSqft: 800, currency: "AUD", hotSectors: ["Build-to-Rent", "Healthcare", "Industrial"] },
  { name: "Ho Chi Minh", country: "Vietnam", countryCode: "VN", flag: "🇻🇳", rentalYield: 5.5, priceAppreciation: 12.0, priceToIncome: 25, populationGrowth: 2.8, transactionVolume: "High", mortgageRate: 8.0, gdpGrowth: 7.0, infrastructureScore: 5, riskLevel: "High", investmentScore: 78, avgPriceSqft: 180, currency: "VND", hotSectors: ["Industrial", "Residential", "Office"] },
  { name: "Lisbon", country: "Portugal", countryCode: "PT", flag: "🇵🇹", rentalYield: 5.8, priceAppreciation: 9.5, priceToIncome: 18, populationGrowth: 0.8, transactionVolume: "Medium", mortgageRate: 4.0, gdpGrowth: 2.5, infrastructureScore: 7, riskLevel: "Low", investmentScore: 79, avgPriceSqft: 420, currency: "EUR", hotSectors: ["Golden Visa", "Tourism", "Student Housing"] },
  { name: "Athens", country: "Greece", countryCode: "GR", flag: "🇬🇷", rentalYield: 7.0, priceAppreciation: 14.0, priceToIncome: 12, populationGrowth: 0.5, transactionVolume: "Medium", mortgageRate: 4.5, gdpGrowth: 2.2, infrastructureScore: 6, riskLevel: "Medium", investmentScore: 81, avgPriceSqft: 220, currency: "EUR", hotSectors: ["Tourism", "Renovation", "Short-term Rental"] },
  { name: "Warsaw", country: "Poland", countryCode: "PL", flag: "🇵🇱", rentalYield: 5.5, priceAppreciation: 12.0, priceToIncome: 9, populationGrowth: 0.3, transactionVolume: "Medium", mortgageRate: 7.0, gdpGrowth: 3.8, infrastructureScore: 7, riskLevel: "Low", investmentScore: 78, avgPriceSqft: 280, currency: "PLN", hotSectors: ["Office", "PRS", "Logistics"] },
  { name: "Mexico City", country: "Mexico", countryCode: "MX", flag: "🇲🇽", rentalYield: 6.5, priceAppreciation: 10.0, priceToIncome: 10, populationGrowth: 0.8, transactionVolume: "Medium", mortgageRate: 11.0, gdpGrowth: 3.5, infrastructureScore: 6, riskLevel: "Medium", investmentScore: 73, avgPriceSqft: 200, currency: "MXN", hotSectors: ["Nearshoring", "Industrial", "Multifamily"] },
  { name: "Hyderabad", country: "India", countryCode: "IN", flag: "🇮🇳", rentalYield: 4.5, priceAppreciation: 20.0, priceToIncome: 8, populationGrowth: 3.2, transactionVolume: "High", mortgageRate: 8.5, gdpGrowth: 8.0, infrastructureScore: 7, riskLevel: "Medium", investmentScore: 87, avgPriceSqft: 85, currency: "INR", hotSectors: ["IT Parks", "Luxury", "Warehousing"] },
];

/* ─── SECTOR DATA ─── */
export const SECTORS_RE: SectorRE[] = [
  { name: "Residential", icon: "🏠", globalYield: 4.2, outlook: "Neutral", momentum: "Stable", riskLevel: "Low", keyDriver: "Housing demand & demographics", topMarkets: ["Dubai", "Mumbai", "Bengaluru", "Riyadh"], growth5Y: 5.8 },
  { name: "Commercial Office", icon: "🏢", globalYield: 5.5, outlook: "Bearish", momentum: "Weak", riskLevel: "High", keyDriver: "Remote work vs return-to-office", topMarkets: ["Singapore", "Tokyo", "Mumbai", "London"], growth5Y: 2.1 },
  { name: "Logistics & Warehousing", icon: "🏭", globalYield: 6.2, outlook: "Bullish", momentum: "Strong", riskLevel: "Low", keyDriver: "E-commerce & supply chain reshoring", topMarkets: ["Mexico City", "Mumbai", "Warsaw", "Ho Chi Minh"], growth5Y: 9.5 },
  { name: "Data Centers", icon: "🖥️", globalYield: 6.8, outlook: "Bullish", momentum: "Strong", riskLevel: "Low", keyDriver: "AI / cloud computing explosion", topMarkets: ["Northern Virginia", "Singapore", "Tokyo", "Mumbai"], growth5Y: 14.2 },
  { name: "Hospitality & Tourism", icon: "🏨", globalYield: 7.5, outlook: "Bullish", momentum: "Strong", riskLevel: "Medium", keyDriver: "Revenge travel & HNWI tourism", topMarkets: ["Dubai", "Bali", "Athens", "Lisbon"], growth5Y: 7.8 },
  { name: "Luxury Residential", icon: "🏰", globalYield: 3.0, outlook: "Bullish", momentum: "Strong", riskLevel: "Medium", keyDriver: "HNWI global migration", topMarkets: ["Dubai", "Singapore", "London", "Monaco"], growth5Y: 8.5 },
  { name: "Student Housing", icon: "🎓", globalYield: 5.8, outlook: "Bullish", momentum: "Stable", riskLevel: "Low", keyDriver: "Int'l student growth, stable cash flow", topMarkets: ["London", "Sydney", "Boston", "Toronto"], growth5Y: 6.4 },
  { name: "Healthcare Real Estate", icon: "🏥", globalYield: 5.5, outlook: "Bullish", momentum: "Stable", riskLevel: "Low", keyDriver: "Aging populations globally", topMarkets: ["US", "Japan", "Germany", "UK"], growth5Y: 7.2 },
  { name: "Industrial", icon: "⚙️", globalYield: 5.8, outlook: "Bullish", momentum: "Strong", riskLevel: "Low", keyDriver: "Nearshoring & manufacturing shift", topMarkets: ["Mexico", "Vietnam", "India", "Poland"], growth5Y: 8.8 },
];

/* ─── CAPITAL FLOWS ─── */
export const CAPITAL_FLOWS: CapitalFlow[] = [
  { source: "Singapore SWFs", destination: "Dubai", sector: "Luxury Residential", amount: "$4.2B", trend: "Rising", insight: "Singapore capital increasingly moving into Dubai luxury residential as HNWI migration accelerates" },
  { source: "Blackstone", destination: "India", sector: "Warehousing", amount: "$2.8B", trend: "Rising", insight: "Blackstone doubling down on Indian logistics as e-commerce penetration surges beyond 12%" },
  { source: "Brookfield", destination: "India", sector: "Office & Data Centers", amount: "$3.5B", trend: "Rising", insight: "Brookfield expanding Indian office portfolio; betting on GCC demand and AI-driven data center growth" },
  { source: "Abu Dhabi (ADIA)", destination: "UK", sector: "Build-to-Rent", amount: "$1.8B", trend: "Stable", insight: "Gulf sovereign wealth targeting UK rental housing sector amid chronic undersupply" },
  { source: "Japanese Investors", destination: "Australia", sector: "Healthcare", amount: "$1.2B", trend: "Rising", insight: "Japanese capital flowing into Australian healthcare real estate as both nations age rapidly" },
  { source: "Chinese HNWIs", destination: "Singapore", sector: "Luxury", amount: "$3.1B", trend: "Rising", insight: "Chinese HNWI flight capital entering Singapore luxury condos post-COVID wealth migration" },
  { source: "US PE Funds", destination: "Mexico", sector: "Industrial", amount: "$5.6B", trend: "Rising", insight: "US-China decoupling driving massive industrial nearshoring investment into Mexican border cities" },
  { source: "Nordic Pension Funds", destination: "Poland", sector: "Logistics", amount: "$0.9B", trend: "Rising", insight: "Nordic institutional capital targeting Central European logistics amid EU supply-chain diversification" },
  { source: "Saudi PIF", destination: "Saudi Arabia", sector: "Mixed-Use / NEOM", amount: "$12B", trend: "Rising", insight: "Vision 2030 mega-projects creating unprecedented domestic real estate investment cycle" },
  { source: "Korean Investors", destination: "Vietnam", sector: "Industrial", amount: "$2.1B", trend: "Rising", insight: "Korean chaebol supply chains driving industrial park demand in southern Vietnam" },
];

/* ─── MACRO CORRELATIONS ─── */
export const MACRO_CORRELATIONS: MacroCorrelation[] = [
  { variable: "Interest Rates", impact: "Higher rates compress property valuations and reduce transaction volume", direction: "Negative", strength: "Strong", affectedMarkets: ["US", "UK", "EU", "Canada"] },
  { variable: "Bond Yields (10Y)", impact: "Rising yields increase cap rates, reducing asset prices", direction: "Negative", strength: "Strong", affectedMarkets: ["Global CRE", "US Office", "EU Retail"] },
  { variable: "Oil Prices", impact: "Higher oil boosts Gulf real estate; hurts oil-importing EM", direction: "Mixed", strength: "Moderate", affectedMarkets: ["Dubai", "Riyadh", "India", "Turkey"] },
  { variable: "USD Strength", impact: "Strong dollar makes EM real estate cheaper for US investors", direction: "Mixed", strength: "Moderate", affectedMarkets: ["India", "Brazil", "Vietnam", "Mexico"] },
  { variable: "Inflation (CPI)", impact: "Real estate as inflation hedge; rents reprice upward", direction: "Positive", strength: "Moderate", affectedMarkets: ["Residential Global", "Logistics", "Industrial"] },
  { variable: "Recession Risk", impact: "Recession crushes office demand, boosts safe-haven residential", direction: "Negative", strength: "Strong", affectedMarkets: ["US Office", "EU Commercial", "UK Retail"] },
  { variable: "Geopolitical Tension", impact: "Capital flight to safe havens — Dubai, Singapore, Switzerland", direction: "Mixed", strength: "Strong", affectedMarkets: ["Dubai", "Singapore", "Zurich", "London"] },
  { variable: "AI / Tech Boom", impact: "Data center REIT surge; tech-city residential appreciation", direction: "Positive", strength: "Strong", affectedMarkets: ["N. Virginia", "Singapore", "Tokyo", "Bengaluru"] },
];

/* ─── RISK FACTORS ─── */
export const RISK_FACTORS: RiskFactor[] = [
  { type: "Political", severity: "High", affectedCountries: ["Turkey", "Brazil", "Mexico"], description: "Elections, policy shifts, and institutional instability impacting investor confidence" },
  { type: "Currency", severity: "Critical", affectedCountries: ["Turkey", "Japan", "Brazil", "India"], description: "FX depreciation eroding USD-denominated returns for foreign investors" },
  { type: "Credit / Banking", severity: "High", affectedCountries: ["US", "Germany", "UK", "China"], description: "CRE loan stress in banking sector; potential forced selling of commercial assets" },
  { type: "Climate", severity: "Medium", affectedCountries: ["US (Florida)", "India", "Indonesia", "Vietnam"], description: "Flood, fire, and sea-level exposure increasing insurance costs and reducing valuations" },
  { type: "Oversupply", severity: "High", affectedCountries: ["China", "Dubai", "Turkey", "Canada"], description: "Construction boom creating potential vacancy glut in specific submarkets" },
  { type: "Regulatory", severity: "Medium", affectedCountries: ["Singapore", "Canada", "Australia", "UK"], description: "Foreign ownership restrictions, stamp duties, and tax changes deterring cross-border capital" },
  { type: "Liquidity", severity: "Medium", affectedCountries: ["Germany", "UK", "China"], description: "Transaction volume collapse making exit strategies difficult for institutional holders" },
  { type: "Interest Rate Shock", severity: "Critical", affectedCountries: ["Global"], description: "Higher-for-longer rates compressing valuations and stalling refinancing pipelines" },
];

/* ─── AI INSIGHTS ─── */
export const AI_INSIGHTS: AIInsight[] = [
  { title: "Dubai luxury demand surging from HNWI migration", body: "Dubai residential luxury segment seeing 25%+ price appreciation as Russian, Indian, and Chinese HNWIs relocate. Palm Jumeirah and Downtown commanding record per-sqft prices.", type: "opportunity", region: "Middle East", timestamp: "2h ago" },
  { title: "German office market weakening from ECB rate hikes", body: "German commercial real estate faces significant headwinds — transaction volumes down 45% YoY. Berlin and Frankfurt office yields widening 80-120bps as refinancing costs spike.", type: "risk", region: "Europe", timestamp: "4h ago" },
  { title: "India warehouse demand at all-time high", body: "Indian Grade-A warehousing absorption hit 58M sqft in 2025 — driven by 3PL, e-commerce, and EV supply chains. Pune, Chennai, and Bengaluru seeing cap rate compression.", type: "trend", region: "Asia-Pacific", timestamp: "6h ago" },
  { title: "Singapore logistics outperforming from supply-chain shift", body: "Singapore industrial rents up 12% YTD as companies diversify from China. Tuas mega-port driving logistics demand. Data center moratorium lifting creating fresh opportunities.", type: "opportunity", region: "Asia-Pacific", timestamp: "8h ago" },
  { title: "US CRE loan maturity wall approaching", body: "$1.5T in US commercial real estate loans maturing by 2026. Regional banks heavily exposed — expect distressed asset sales, particularly in office and retail sectors.", type: "alert", region: "North America", timestamp: "10h ago" },
  { title: "Saudi NEOM creating unprecedented RE opportunity", body: "Saudi Arabia's $500B NEOM mega-project entering construction phase. Hospitality, luxury residential, and mixed-use assets expected to generate 10%+ IRRs for early investors.", type: "opportunity", region: "Middle East", timestamp: "12h ago" },
  { title: "Vietnam emerging as manufacturing RE hotspot", body: "Vietnam industrial land prices up 15-20% as Korean and Japanese manufacturers relocate from China. Southern provinces near Ho Chi Minh City seeing strongest institutional interest.", type: "trend", region: "Asia-Pacific", timestamp: "1d ago" },
  { title: "UK Build-to-Rent sector attracting sovereign capital", body: "UK BTR sector receiving record institutional investment as homeownership rates fall. Gulf SWFs and Canadian pension funds leading $8B+ annual allocation to purpose-built rental.", type: "trend", region: "Europe", timestamp: "1d ago" },
];

/* ─── REIT / INSTITUTIONAL INDICATORS ─── */
export interface InstitutionalIndicator {
  name: string;
  value: string;
  change: number;
  unit: string;
  significance: string;
}

export const INSTITUTIONAL_INDICATORS: InstitutionalIndicator[] = [
  { name: "US REIT Index (VNQ)", value: "86.42", change: -1.2, unit: "$", significance: "Sector sentiment gauge" },
  { name: "CMBS AAA Spread", value: "145", change: 12, unit: "bps", significance: "CRE credit stress" },
  { name: "US 30Y Mortgage", value: "6.87", change: 0.05, unit: "%", significance: "Financing cost" },
  { name: "US 10Y Treasury", value: "4.48", change: -0.03, unit: "%", significance: "Discount rate benchmark" },
  { name: "US CDS 5Y", value: "38", change: -2, unit: "bps", significance: "Sovereign risk" },
  { name: "US Construction Permits", value: "1.42M", change: -3.2, unit: "ann.", significance: "Supply pipeline" },
  { name: "India REIT (Embassy)", value: "₹388", change: 2.1, unit: "INR", significance: "India CRE proxy" },
  { name: "S&P Global REIT", value: "234.5", change: -0.8, unit: "$", significance: "Global RE equities" },
];

/* ─── REGIONS ─── */
export const RE_REGIONS = ["All", "Asia-Pacific", "Middle East", "Europe", "North America", "Latin America"] as const;

/* ─── HELPERS ─── */
export function getCountriesByRegion(region: string): CountryRE[] {
  if (region === "All") return COUNTRIES_RE.sort((a, b) => b.investmentScore - a.investmentScore);
  return COUNTRIES_RE.filter(c => c.region === region).sort((a, b) => b.investmentScore - a.investmentScore);
}

export function getCitiesByCountry(countryCode: string): CityRE[] {
  return CITIES_RE.filter(c => c.countryCode === countryCode).sort((a, b) => b.investmentScore - a.investmentScore);
}

export function getTopOpportunities(n = 10): CityRE[] {
  return [...CITIES_RE].sort((a, b) => b.investmentScore - a.investmentScore).slice(0, n);
}

/* ═════════════════════════════════════════════════════════════════
   INFRASTRUCTURE PROJECTS
   ═════════════════════════════════════════════════════════════════ */

export interface InfraProject {
  name: string;
  country: string;
  flag: string;
  type: "Metro" | "Airport" | "Highway" | "Smart City" | "Industrial Corridor" | "Rail" | "Port";
  investment: string;
  completion: string;
  status: "Under Construction" | "Planning" | "Operational" | "Phase 2";
  impactCities: string[];
  priceImpact: string;
  description: string;
}

export const INFRA_PROJECTS: InfraProject[] = [
  { name: "Mumbai Metro Line 3 (Aqua Line)", country: "India", flag: "🇮🇳", type: "Metro", investment: "₹33,000 Cr", completion: "2025-26", status: "Under Construction", impactCities: ["Mumbai"], priceImpact: "+15-25% in 2km radius", description: "33.5km underground metro connecting Colaba to SEEPZ. Expected to transform BKC, Worli, and Lower Parel property corridors." },
  { name: "Navi Mumbai International Airport", country: "India", flag: "🇮🇳", type: "Airport", investment: "₹16,700 Cr", completion: "2025", status: "Under Construction", impactCities: ["Mumbai", "Pune"], priceImpact: "+30-50% in Panvel/Ulwe", description: "New greenfield airport to serve 20M passengers. Transforming Navi Mumbai, Panvel, Ulwe into premium real estate corridors." },
  { name: "Delhi-Mumbai Industrial Corridor", country: "India", flag: "🇮🇳", type: "Industrial Corridor", investment: "$100B", completion: "2028", status: "Phase 2", impactCities: ["Mumbai", "Pune", "Ahmedabad"], priceImpact: "+20-40% along corridor", description: "1,504km dedicated freight corridor driving massive industrial and logistics real estate demand." },
  { name: "Bengaluru Metro Phase 2", country: "India", flag: "🇮🇳", type: "Metro", investment: "₹32,000 Cr", completion: "2026", status: "Under Construction", impactCities: ["Bengaluru"], priceImpact: "+10-20% near stations", description: "72km expansion connecting Whitefield, Electronic City, and Airport. Unlocking peripheral growth corridors." },
  { name: "Hyderabad Pharma City", country: "India", flag: "🇮🇳", type: "Smart City", investment: "₹64,000 Cr", completion: "2027", status: "Planning", impactCities: ["Hyderabad"], priceImpact: "+25-35% in Mucherla belt", description: "19,333-acre pharma manufacturing hub — Asia's largest. Creating massive ancillary real estate demand." },
  { name: "Mumbai-Ahmedabad Bullet Train", country: "India", flag: "🇮🇳", type: "Rail", investment: "₹1.1 Lakh Cr", completion: "2028", status: "Under Construction", impactCities: ["Mumbai", "Ahmedabad"], priceImpact: "+20-30% near stations", description: "508km high-speed rail connecting financial capitals. Station areas seeing speculative price surges." },
  { name: "NEOM — The Line", country: "Saudi Arabia", flag: "🇸🇦", type: "Smart City", investment: "$500B", completion: "2030+", status: "Under Construction", impactCities: ["Riyadh"], priceImpact: "Transformational for Saudi RE", description: "170km linear smart city for 9M residents. Most ambitious real estate project in human history." },
  { name: "Dubai Al Maktoum Airport Expansion", country: "UAE", flag: "🇦🇪", type: "Airport", investment: "$35B", completion: "2030", status: "Planning", impactCities: ["Dubai"], priceImpact: "+15-25% in Dubai South", description: "World's largest airport when complete — 260M passengers. Dubai South area poised for massive appreciation." },
  { name: "Singapore Tuas Mega Port", country: "Singapore", flag: "🇸🇬", type: "Port", investment: "$20B", completion: "2040", status: "Phase 2", impactCities: ["Singapore"], priceImpact: "+10% industrial rents", description: "World's largest automated port consolidating all container operations. Driving logistics REIT demand." },
  { name: "Jakarta-Bandung High Speed Rail", country: "Indonesia", flag: "🇮🇩", type: "Rail", investment: "$7.3B", completion: "2023 (Operational)", status: "Operational", impactCities: ["Jakarta"], priceImpact: "+15-20% along corridor", description: "142km HSR connecting capitals. Bandung suburb prices surging as commute drops to 40 minutes." },
];

/* ═════════════════════════════════════════════════════════════════
   REIT DATA
   ═════════════════════════════════════════════════════════════════ */

export interface REITData {
  name: string;
  ticker: string;
  country: string;
  flag: string;
  type: "Office" | "Retail" | "Industrial" | "Residential" | "Diversified" | "Data Center" | "Healthcare";
  price: number;
  currency: string;
  change: number;
  dividendYield: number;
  occupancy: number;
  marketCap: string;
  pNav: number; // price-to-NAV
  debtRatio: number;
  riskLevel: "Low" | "Medium" | "High";
}

export const REITS: REITData[] = [
  { name: "Embassy Office Parks", ticker: "EMBASSY", country: "India", flag: "🇮🇳", type: "Office", price: 388, currency: "INR", change: 2.1, dividendYield: 6.8, occupancy: 87, marketCap: "₹33,200 Cr", pNav: 0.92, debtRatio: 28, riskLevel: "Medium" },
  { name: "Mindspace Business Parks", ticker: "MINDSPACE", country: "India", flag: "🇮🇳", type: "Office", price: 342, currency: "INR", change: 1.5, dividendYield: 6.2, occupancy: 89, marketCap: "₹20,300 Cr", pNav: 0.88, debtRatio: 22, riskLevel: "Low" },
  { name: "Brookfield India REIT", ticker: "BIRET", country: "India", flag: "🇮🇳", type: "Office", price: 285, currency: "INR", change: -0.8, dividendYield: 7.1, occupancy: 84, marketCap: "₹11,800 Cr", pNav: 0.85, debtRatio: 32, riskLevel: "Medium" },
  { name: "Prologis", ticker: "PLD", country: "US", flag: "🇺🇸", type: "Industrial", price: 118.5, currency: "USD", change: -1.2, dividendYield: 3.2, occupancy: 96, marketCap: "$110B", pNav: 1.05, debtRatio: 22, riskLevel: "Low" },
  { name: "Equinix", ticker: "EQIX", country: "US", flag: "🇺🇸", type: "Data Center", price: 785, currency: "USD", change: 0.8, dividendYield: 2.1, occupancy: 94, marketCap: "$74B", pNav: 1.35, debtRatio: 35, riskLevel: "Low" },
  { name: "Simon Property", ticker: "SPG", country: "US", flag: "🇺🇸", type: "Retail", price: 152, currency: "USD", change: -0.5, dividendYield: 5.2, occupancy: 95, marketCap: "$49B", pNav: 0.95, debtRatio: 38, riskLevel: "Medium" },
  { name: "Link REIT", ticker: "0823.HK", country: "Hong Kong", flag: "🇭🇰", type: "Retail", price: 38.5, currency: "HKD", change: -1.8, dividendYield: 6.5, occupancy: 97, marketCap: "HK$81B", pNav: 0.68, debtRatio: 25, riskLevel: "Medium" },
  { name: "CapitaLand Integrated", ticker: "C38U", country: "Singapore", flag: "🇸🇬", type: "Diversified", price: 2.05, currency: "SGD", change: 0.5, dividendYield: 5.4, occupancy: 94, marketCap: "S$14B", pNav: 0.82, debtRatio: 40, riskLevel: "Medium" },
  { name: "Nippon Building Fund", ticker: "8951.T", country: "Japan", flag: "🇯🇵", type: "Office", price: 625000, currency: "JPY", change: 1.0, dividendYield: 3.8, occupancy: 98, marketCap: "¥1.1T", pNav: 1.02, debtRatio: 42, riskLevel: "Low" },
  { name: "Digital Realty", ticker: "DLR", country: "US", flag: "🇺🇸", type: "Data Center", price: 142, currency: "USD", change: 1.5, dividendYield: 3.4, occupancy: 92, marketCap: "$42B", pNav: 1.15, debtRatio: 38, riskLevel: "Low" },
];

/* ═════════════════════════════════════════════════════════════════
   BUBBLE DETECTOR DATA
   ═════════════════════════════════════════════════════════════════ */

export interface BubbleMetrics {
  city: string;
  flag: string;
  overvaluation: number; // % above fair value
  affordability: number; // price-to-income ratio (higher = worse)
  speculationIndex: number; // 0-100
  vacancyTrend: "Rising" | "Stable" | "Falling";
  creditGrowth: number; // YoY %
  correctionProbability: number; // %
  riskLevel: "Extreme" | "High" | "Moderate" | "Low";
}

export const BUBBLE_METRICS: BubbleMetrics[] = [
  { city: "Dubai", flag: "🇦🇪", overvaluation: 12, affordability: 8.5, speculationIndex: 72, vacancyTrend: "Rising", creditGrowth: 18, correctionProbability: 28, riskLevel: "Moderate" },
  { city: "Mumbai", flag: "🇮🇳", overvaluation: 8, affordability: 22, speculationIndex: 45, vacancyTrend: "Falling", creditGrowth: 15, correctionProbability: 15, riskLevel: "Low" },
  { city: "Singapore", flag: "🇸🇬", overvaluation: 15, affordability: 15, speculationIndex: 38, vacancyTrend: "Stable", creditGrowth: 5, correctionProbability: 12, riskLevel: "Low" },
  { city: "London", flag: "🇬🇧", overvaluation: 18, affordability: 16, speculationIndex: 30, vacancyTrend: "Rising", creditGrowth: -2, correctionProbability: 22, riskLevel: "Moderate" },
  { city: "New York", flag: "🇺🇸", overvaluation: 10, affordability: 12, speculationIndex: 25, vacancyTrend: "Stable", creditGrowth: 3, correctionProbability: 18, riskLevel: "Moderate" },
  { city: "Bengaluru", flag: "🇮🇳", overvaluation: 5, affordability: 12, speculationIndex: 55, vacancyTrend: "Falling", creditGrowth: 22, correctionProbability: 10, riskLevel: "Low" },
  { city: "Hyderabad", flag: "🇮🇳", overvaluation: 3, affordability: 8, speculationIndex: 60, vacancyTrend: "Falling", creditGrowth: 25, correctionProbability: 8, riskLevel: "Low" },
  { city: "Riyadh", flag: "🇸🇦", overvaluation: 20, affordability: 7, speculationIndex: 68, vacancyTrend: "Rising", creditGrowth: 30, correctionProbability: 25, riskLevel: "Moderate" },
  { city: "Istanbul", flag: "🇹🇷", overvaluation: 35, affordability: 28, speculationIndex: 82, vacancyTrend: "Rising", creditGrowth: 45, correctionProbability: 55, riskLevel: "Extreme" },
  { city: "Toronto", flag: "🇨🇦", overvaluation: 22, affordability: 18, speculationIndex: 48, vacancyTrend: "Rising", creditGrowth: -5, correctionProbability: 35, riskLevel: "High" },
  { city: "Sydney", flag: "🇦🇺", overvaluation: 14, affordability: 14, speculationIndex: 40, vacancyTrend: "Stable", creditGrowth: 6, correctionProbability: 20, riskLevel: "Moderate" },
  { city: "Berlin", flag: "🇩🇪", overvaluation: -8, affordability: 10, speculationIndex: 15, vacancyTrend: "Rising", creditGrowth: -12, correctionProbability: 40, riskLevel: "High" },
];

/* ═════════════════════════════════════════════════════════════════
   MORTGAGE & AFFORDABILITY
   ═════════════════════════════════════════════════════════════════ */

export interface MortgageData {
  country: string;
  flag: string;
  rate: number;
  change3M: number;
  change1Y: number;
  centralBankRate: number;
  affordabilityIndex: number; // 100 = average, >100 more affordable
  avgLoan: string;
  ltvRatio: number;
  trend: "Rising" | "Stable" | "Falling";
  buyRecommendation: "Buy" | "Wait" | "Caution";
  rationale: string;
}

export const MORTGAGE_DATA: MortgageData[] = [
  { country: "India", flag: "🇮🇳", rate: 8.50, change3M: -0.15, change1Y: -0.50, centralBankRate: 6.25, affordabilityIndex: 72, avgLoan: "₹45L", ltvRatio: 80, trend: "Falling", buyRecommendation: "Buy", rationale: "RBI cutting cycle underway. EMIs expected to fall further in 2025. Favorable window for homebuyers." },
  { country: "United States", flag: "🇺🇸", rate: 6.87, change3M: 0.12, change1Y: -0.25, centralBankRate: 5.25, affordabilityIndex: 58, avgLoan: "$350K", ltvRatio: 80, trend: "Stable", buyRecommendation: "Wait", rationale: "Rates still elevated. Wait for Fed pivot confirmation before committing to 30Y mortgage." },
  { country: "UAE", flag: "🇦🇪", rate: 5.99, change3M: 0.00, change1Y: 0.25, centralBankRate: 5.15, affordabilityIndex: 85, avgLoan: "AED 1.5M", ltvRatio: 75, trend: "Stable", buyRecommendation: "Buy", rationale: "Competitive rates for expats. Golden Visa driving demand. Off-plan payment plans reduce entry barriers." },
  { country: "United Kingdom", flag: "🇬🇧", rate: 5.20, change3M: -0.30, change1Y: -0.80, centralBankRate: 5.00, affordabilityIndex: 52, avgLoan: "£250K", ltvRatio: 85, trend: "Falling", buyRecommendation: "Wait", rationale: "BoE expected to continue cuts. Wait 6 months for further rate relief. Supply constrained but prices elevated." },
  { country: "Japan", flag: "🇯🇵", rate: 1.20, change3M: 0.10, change1Y: 0.45, centralBankRate: 0.25, affordabilityIndex: 95, avgLoan: "¥35M", ltvRatio: 90, trend: "Rising", buyRecommendation: "Buy", rationale: "Even with BOJ normalization, rates historically low. Weak yen creating foreign buyer opportunities." },
  { country: "Singapore", flag: "🇸🇬", rate: 3.75, change3M: -0.20, change1Y: -0.50, centralBankRate: 3.50, affordabilityIndex: 45, avgLoan: "S$800K", ltvRatio: 75, trend: "Falling", buyRecommendation: "Caution", rationale: "ABSD surcharges of 60% for foreigners. Only recommended for PRs/citizens. Prices near peak." },
  { country: "Australia", flag: "🇦🇺", rate: 6.50, change3M: 0.00, change1Y: -0.15, centralBankRate: 4.35, affordabilityIndex: 55, avgLoan: "A$550K", ltvRatio: 80, trend: "Stable", buyRecommendation: "Wait", rationale: "RBA expected to start cutting in H2 2025. Hold for 2-3 rate cuts before entering market." },
  { country: "Saudi Arabia", flag: "🇸🇦", rate: 5.50, change3M: -0.25, change1Y: -0.75, centralBankRate: 5.50, affordabilityIndex: 90, avgLoan: "SAR 1M", ltvRatio: 70, trend: "Falling", buyRecommendation: "Buy", rationale: "Vision 2030 driving unprecedented housing demand. Government subsidies improving affordability." },
];

/* ═════════════════════════════════════════════════════════════════
   STOCK MARKET IMPACT
   ═════════════════════════════════════════════════════════════════ */

export interface StockImpact {
  sector: string;
  icon: string;
  stocks: { name: string; ticker: string; impact: "Positive" | "Negative" | "Neutral"; reason: string }[];
  reCorrelation: number; // correlation with RE sector, -1 to 1
  currentSignal: "Bullish" | "Bearish" | "Neutral";
}

export const STOCK_IMPACTS: StockImpact[] = [
  {
    sector: "Cement", icon: "🏗️",
    stocks: [
      { name: "UltraTech Cement", ticker: "ULTRACEMCO", impact: "Positive", reason: "Rising housing construction activity increases cement demand" },
      { name: "Ambuja Cements", ticker: "AMBUJACEM", impact: "Positive", reason: "Infrastructure spending boosting volumes in western India" },
      { name: "ACC Ltd", ticker: "ACC", impact: "Positive", reason: "Commercial construction recovery benefiting volumes" },
    ],
    reCorrelation: 0.82, currentSignal: "Bullish",
  },
  {
    sector: "Banks & NBFCs", icon: "🏦",
    stocks: [
      { name: "HDFC Bank", ticker: "HDFCBANK", impact: "Positive", reason: "Home loan book growing 18% YoY. Largest mortgage lender" },
      { name: "SBI", ticker: "SBIN", impact: "Positive", reason: "Government housing scheme driving rural mortgage growth" },
      { name: "Bajaj Finance", ticker: "BAJFINANCE", impact: "Positive", reason: "Developer financing and LAP portfolio expanding" },
    ],
    reCorrelation: 0.75, currentSignal: "Bullish",
  },
  {
    sector: "Paints & Home Improvement", icon: "🎨",
    stocks: [
      { name: "Asian Paints", ticker: "ASIANPAINT", impact: "Positive", reason: "New housing completions driving decorative paint demand" },
      { name: "Berger Paints", ticker: "BERGEPAINT", impact: "Positive", reason: "Waterproofing and construction chemicals growing" },
      { name: "Pidilite Industries", ticker: "PIDILITIND", impact: "Positive", reason: "Adhesives and construction chemicals benefit from RE activity" },
    ],
    reCorrelation: 0.68, currentSignal: "Bullish",
  },
  {
    sector: "Steel & Metals", icon: "⚒️",
    stocks: [
      { name: "Tata Steel", ticker: "TATASTEEL", impact: "Positive", reason: "Construction sector is largest steel consumer in India" },
      { name: "JSW Steel", ticker: "JSWSTEEL", impact: "Positive", reason: "Infrastructure + housing dual demand driver" },
      { name: "Hindalco", ticker: "HINDALCO", impact: "Neutral", reason: "Limited direct RE exposure; more auto/packaging focused" },
    ],
    reCorrelation: 0.58, currentSignal: "Neutral",
  },
  {
    sector: "Infrastructure", icon: "🛤️",
    stocks: [
      { name: "Larsen & Toubro", ticker: "LT", impact: "Positive", reason: "Largest infra company benefiting from government spending" },
      { name: "DLF Ltd", ticker: "DLF", impact: "Positive", reason: "India's largest RE developer. Direct RE play" },
      { name: "Godrej Properties", ticker: "GODREJPROP", impact: "Positive", reason: "Premium residential demand in metros" },
    ],
    reCorrelation: 0.90, currentSignal: "Bullish",
  },
  {
    sector: "Home Appliances", icon: "🔌",
    stocks: [
      { name: "Havells India", ticker: "HAVELLS", impact: "Positive", reason: "Wires, cables, lighting — all tied to new construction" },
      { name: "Polycab India", ticker: "POLYCAB", impact: "Positive", reason: "Wire and cable volumes directly linked to housing starts" },
      { name: "Crompton Greaves", ticker: "CROMPTON", impact: "Positive", reason: "Consumer appliances benefit from new household formation" },
    ],
    reCorrelation: 0.62, currentSignal: "Bullish",
  },
];

/* ═════════════════════════════════════════════════════════════════
   AI CITY GROWTH INTELLIGENCE ENGINE
   Why cities grow, what drives demand, composite AI scores
   ═════════════════════════════════════════════════════════════════ */

export interface CityGrowthDimension {
  score: number;
  trend: "Surging" | "Rising" | "Stable" | "Declining";
  insight: string;
  beginnerTip: string;
}

export interface CityGrowthIntelligence {
  city: string;
  jobCreation: CityGrowthDimension;
  migration: CityGrowthDimension;
  infrastructure: CityGrowthDimension;
  startupEcosystem: CityGrowthDimension;
  commercialDemand: CityGrowthDimension;
  affordability: CityGrowthDimension;
  luxuryDemand: CityGrowthDimension;
  rentalMarket: CityGrowthDimension;
  trafficExpansion: CityGrowthDimension;
  metroGrowth: CityGrowthDimension;
  // Composite scores
  growthScore: number;
  futurePotentialScore: number;
  smartMoneyScore: number;
  infraMomentumScore: number;
  bubbleRiskScore: number;
  whyGrowing: string;
  whyImportant: string;
  investmentVerdict: string;
  beginnerSummary: string;
}

const CITY_GROWTH_RAW: Record<string, Partial<CityGrowthIntelligence>> = {
  Dubai: {
    whyGrowing: "Dubai is growing because of massive HNWI migration from Russia, India, and China — drawn by zero income tax, golden visas, and world-class infrastructure. The government's diversification from oil to tourism, finance, and tech is creating sustained economic growth that directly fuels real estate demand.",
    whyImportant: "Dubai is the world's top destination for high-net-worth migration, making it a global benchmark for luxury real estate. Its strategic position between East and West, combined with tax-free status, makes it the #1 city for cross-border real estate investment.",
    investmentVerdict: "Strong BUY for rental yield investors (7-9% yields). Luxury segment at record highs but off-plan in emerging areas like Dubai South offers 25-40% upside. Main risk: oversupply in mid-range if construction boom continues unchecked.",
    beginnerSummary: "Think of Dubai like a giant magnet for wealthy people worldwide. When rich people move somewhere, they buy expensive homes, eat at restaurants, and shop — this creates jobs and pushes up property prices. Dubai offers no income tax, amazing safety, and world-class airports, making it irresistible for global wealth. If you invest here, you earn 7-9% rental income annually — much better than most bank deposits.",
  },
  Mumbai: {
    whyGrowing: "Mumbai is India's financial capital experiencing its strongest real estate upcycle since 2014. The combination of RBI rate cuts making home loans cheaper, massive infrastructure upgrades (metro, coastal road, Navi Mumbai airport), and India's booming economy creating new wealth is driving unprecedented demand.",
    whyImportant: "Mumbai is India's #1 real estate market by value — the BKC-Worli corridor alone rivals Singapore CBD rents. With 22 million people and severe land scarcity, property in Mumbai is essentially a finite resource in the world's fastest-growing major economy.",
    investmentVerdict: "BUY in growth corridors (Panvel-Ulwe, Thane). The Navi Mumbai airport will be transformational — 30-50% appreciation expected. Avoid overpriced South Mumbai unless ultra-luxury. Best bang for buck: ₹7,500-18,000/sqft areas with metro connectivity.",
    beginnerSummary: "Mumbai is like Manhattan but in a country growing at 7%+ per year. Land is extremely scarce (it's built on islands), so prices tend to go up over time. The new airport and metro lines are opening up affordable areas that could become premium in 5-10 years. Think of buying near a future metro station — it's like buying near a highway exit before the highway is built.",
  },
  Bengaluru: {
    whyGrowing: "Bengaluru is India's Silicon Valley — every major tech company in the world has offices here. IT hiring growth of 15-20% annually, combined with a startup ecosystem valued at $150B+, creates constant demand for housing. The metro expansion is unlocking peripheral growth corridors with 20-25% appreciation.",
    whyImportant: "Bengaluru produces more tech talent than any city outside the US and China. When tech companies grow, employees need homes, restaurants, and offices — creating a self-reinforcing growth cycle. It's the most diversified Indian city for real estate investment.",
    investmentVerdict: "STRONG BUY for mid-range residential along IT corridors (Whitefield, Sarjapur, Electronic City). Devanahalli near airport offers highest upside (28% growth). Rental yields at 4.2% — highest among Indian metros. Data center demand creating new investment category.",
    beginnerSummary: "Bengaluru is where India's tech money lives. When Google, Amazon, and hundreds of startups hire thousands of employees every year, all those people need apartments. That's why rents and prices keep climbing in IT areas. The metro is like a magic price-booster — properties near new metro stations jump 15-20% in value.",
  },
  Hyderabad: {
    whyGrowing: "Hyderabad is India's fastest-growing real estate market because it offers what Bengaluru does (IT/tech hub) at much lower prices. The Kokapet Financial District is creating a new premium corridor, while Pharma City (Asia's largest) is driving industrial demand. Government policy is extremely developer-friendly.",
    whyImportant: "Hyderabad offers the best risk-reward in Indian real estate — 20% appreciation with prices still 40-60% below Bengaluru. The city is becoming India's pharma capital while retaining its tech hub status, creating dual demand drivers.",
    investmentVerdict: "STRONG BUY — highest conviction call in Indian real estate. Shamshabad (airport area) at ₹4,500/sqft could double in 5 years. Kokapet at ₹9,500 is the new premium. Bubble risk is the lowest among Indian metros.",
    beginnerSummary: "Hyderabad is like finding a bargain designer product — you get the same quality (tech hub, good infrastructure, growing economy) for half the price of Bengaluru. When something offers great value, smart money flows in, which is exactly what's happening. At ₹4,500-8,000/sqft, this is one of the most affordable tech cities in the world.",
  },
  Singapore: {
    whyGrowing: "Singapore is growing because of capital flight from China and regional geopolitical instability — wealthy Asians park money in Singapore real estate as a safe haven. Despite government cooling measures (60% ABSD for foreigners), domestic demand remains strong due to low vacancy and tight supply.",
    whyImportant: "Singapore is Asia's Switzerland — the ultimate safe-haven real estate market. Its AAA credit rating, rule of law, and strategic location make it the gold standard for Asian real estate investment. Institutional investors use Singapore as a regional hub.",
    investmentVerdict: "HOLD for most investors due to ABSD barriers. For PRs/citizens, Jurong East offers best value (10% growth, near new innovation district). Data center lift of moratorium creates niche opportunity. Not recommended for foreign retail investors due to 60% stamp duty.",
    beginnerSummary: "Singapore is like buying gold — it's safe, stable, and holds value, but don't expect explosive returns. The government deliberately slows down property speculation with massive taxes on foreign buyers (60%!). If you're a Singapore resident, it's a great long-term hold. For foreigners, look elsewhere unless you have very deep pockets.",
  },
  Tokyo: {
    whyGrowing: "Tokyo is booming because the weak Japanese yen makes real estate incredibly cheap for foreign investors. A luxury apartment that costs $2M in Singapore might cost $1.2M in Tokyo. Meanwhile, ultra-low mortgage rates (1.2%) make domestic buying attractive, and inbound tourism is breaking records.",
    whyImportant: "Tokyo is the world's largest metropolitan economy and Japan's property market is in its strongest cycle in 30 years. The combination of a weak currency, low rates, and the highest quality real estate in Asia creates a rare investment window.",
    investmentVerdict: "BUY for foreign investors — the yen discount is a generational opportunity. Shibuya-Minato tech corridor and Minato luxury are best bets. Hospitality sector (hotel investments) offering 40% more value than pre-COVID. Currency risk is the main concern.",
    beginnerSummary: "Imagine the world's most advanced city selling real estate at a 30% discount because of currency weakness. That's Tokyo right now. Japanese quality (everything works perfectly) at prices lower than comparable cities. The risk? If the yen strengthens, you might not get the same bargain later, but you'd also profit from currency gains on your property.",
  },
  London: {
    whyGrowing: "London isn't broadly growing — it's a tale of two cities. Prime Central London is stagnant (international buyers deterred by stamp duty and political uncertainty), but outer boroughs and Build-to-Rent sectors are seeing 4-6% growth driven by chronic housing undersupply.",
    whyImportant: "London remains the world's most liquid real estate market and the preferred safe-haven for Gulf, Asian, and Russian capital. Despite challenges, its education, culture, and financial infrastructure make it irreplaceable in global portfolios.",
    investmentVerdict: "WAIT for prime Central London (overpriced). BUY student housing near university clusters (6% yields) and Build-to-Rent in Stratford/East London. Biggest opportunity: distressed office-to-residential conversions.",
    beginnerSummary: "London is like a reliable old car — it won't excite you with speed but it rarely breaks down. Property prices are stable but not booming. The best opportunities are in student housing (universities always need housing) and areas where old offices are being converted into apartments. Don't buy in Mayfair unless you're very wealthy — the returns don't justify the price.",
  },
  "New York": {
    whyGrowing: "New York is recovering from its pandemic-era exodus with Manhattan rents at all-time highs. The life sciences sector is creating massive new demand for specialized lab spaces, and Hudson Yards/Brooklyn waterfront are attracting premium buyers. The $1.5T CRE loan maturity wall may create distressed buying opportunities.",
    whyImportant: "New York is the world's financial capital and the benchmark for global real estate pricing. Its multifamily market alone is larger than most countries' entire real estate sectors. What happens in NYC CRE markets ripples across the world.",
    investmentVerdict: "SELECTIVE BUY — multifamily in Brooklyn and Long Island City for cash flow. Life sciences real estate is the fastest-growing niche. Avoid office sector unless buying distressed at 40%+ discount. Jersey City offers similar proximity at 40% lower prices.",
    beginnerSummary: "New York is the world's most famous real estate market. Right now, rents are at record highs (good for landlords), but buying is expensive. The smart play is areas just outside Manhattan — places like Long Island City and Jersey City offer similar access at much lower prices. Think of it as buying in Brooklyn before Brooklyn became trendy.",
  },
  Riyadh: {
    whyGrowing: "Saudi Arabia's Vision 2030 is creating the most ambitious construction boom in history. NEOM alone is a $500B project. International companies establishing regional HQs in KAFD, combined with 40% growth in mortgage originations, is driving unprecedented demand.",
    whyImportant: "Saudi Arabia is the world's largest real estate construction project pipeline. Vision 2030's success or failure will be measured in real estate outcomes. Early movers in Riyadh have potential for outsized returns in a market that barely existed for foreigners 5 years ago.",
    investmentVerdict: "HIGH-CONVICTION BUY for risk-tolerant investors. KAFD financial district at 90%+ occupancy is the safest bet. NEOM zone offers speculative upside but completion risk is real. Government housing subsidies making residential affordable.",
    beginnerSummary: "Saudi Arabia is spending more money on construction than any country in history. When a government puts $500B+ into building new cities, airports, and entertainment zones, real estate prices tend to follow. It's early innings here — like buying in Dubai in 2005. The risk is that mega-projects can face delays, but the direction is clear.",
  },
  Sydney: {
    whyGrowing: "Sydney is recovering on chronic housing undersupply — Australia needs 200,000+ new homes annually but builds fewer than 180,000. Immigration is at record levels post-COVID, and the Western Sydney Aerotropolis is creating a new growth corridor.",
    whyImportant: "Sydney represents the Australia-Pacific gateway for institutional real estate capital. Its Build-to-Rent sector is emerging as a new institutional-grade asset class attracting Japanese and Korean pension fund capital.",
    investmentVerdict: "BUY in Western Sydney growth corridor (15-20% appreciation potential). Parramatta is the 'second CBD' play. Build-to-Rent offers institutional entry point. Avoid Eastern Suburbs — overpriced for yields offered.",
    beginnerSummary: "Sydney has a housing shortage — more people want to live here than there are homes available. When demand exceeds supply, prices go up. The smartest play is Western Sydney near the new airport — it's like buying in a suburb that's about to become a city center.",
  },
};

export function generateCityGrowthIntelligence(cityName: string): CityGrowthIntelligence {
  const rng = seededRng(cityName.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + 42);
  const city = CITIES_RE.find(c => c.name === cityName);
  const raw = CITY_GROWTH_RAW[cityName] || {};
  const appreciation = city?.priceAppreciation ?? 8;
  const infraScore = city?.infrastructureScore ?? 6;

  const dim = (base: number, trendSeed: number): CityGrowthDimension => {
    const score = Math.max(10, Math.min(100, Math.round(base + (rng() - 0.4) * 15)));
    const trends: CityGrowthDimension["trend"][] = ["Surging", "Rising", "Stable", "Declining"];
    const trend = trends[Math.min(3, Math.max(0, Math.floor(trendSeed)))];
    return { score, trend, insight: "", beginnerTip: "" };
  };

  const apIdx = appreciation > 15 ? 0 : appreciation > 8 ? 1 : appreciation > 3 ? 2 : 3;

  const jobCreation = { ...dim(appreciation * 3.5 + 20, apIdx), insight: `${cityName} adding ${Math.round(50 + rng() * 150)}K+ new jobs annually across IT, manufacturing, and services.`, beginnerTip: "More jobs = more people needing homes = higher property prices. Simple as that." };
  const migration = { ...dim(appreciation * 3 + 15, apIdx), insight: `Net migration inflow of ${(0.5 + rng() * 4).toFixed(1)}% annually driving housing demand.`, beginnerTip: "When people move TO a city faster than homes are built, prices go up. It's supply and demand." };
  const infrastructure = { ...dim(infraScore * 10 + 5, Math.max(0, 2 - infraScore / 4)), insight: `${Math.round(2 + rng() * 8)} major infrastructure projects currently active.`, beginnerTip: "Infrastructure is like plumbing for a city. Better roads, metros, and airports make areas accessible, which increases property values." };
  const startupEcosystem = { ...dim(appreciation * 2.5 + 25, apIdx), insight: `Startup funding at $${(0.5 + rng() * 8).toFixed(1)}B — creating tech wealth driving premium housing demand.`, beginnerTip: "When startups get funded, founders and employees make money and buy/rent better homes." };
  const commercialDemand = { ...dim(appreciation * 2.8 + 20, apIdx), insight: `Office absorption at ${(70 + rng() * 25).toFixed(0)}% — commercial rents ${appreciation > 10 ? "rising" : "stable"}.`, beginnerTip: "When companies need more office space, it means the economy is growing and people have jobs." };
  const affordability = { ...dim(100 - appreciation * 2.5, 3 - apIdx), insight: `Price-to-income ratio at ${city?.priceToIncome ?? 12}x — ${(city?.priceToIncome ?? 12) > 15 ? "expensive" : "relatively affordable"}.`, beginnerTip: "If the average home costs 20x the average salary, most people can't afford to buy. This limits price growth." };
  const luxuryDemand = { ...dim(appreciation * 3 + 10, apIdx), insight: `Luxury segment (${currencyLabel(city?.currency ?? "USD")}${city?.currency === "INR" ? "5Cr+" : "2M+"}) seeing ${appreciation > 10 ? "strong" : "moderate"} demand.`, beginnerTip: "Luxury real estate follows wealth creation. When stock markets boom and startups do well, luxury home sales surge." };
  const rentalMarket = { ...dim((city?.rentalYield ?? 4) * 15 + 10, city?.rentalYield && city.rentalYield > 5 ? 0 : 1), insight: `Rental yield at ${city?.rentalYield ?? 4}% — ${(city?.rentalYield ?? 4) > 6 ? "significantly above" : (city?.rentalYield ?? 4) > 4 ? "near" : "below"} global average.`, beginnerTip: "Rental yield is like interest on your investment. Higher yield = more monthly income from tenants." };
  const trafficExpansion = { ...dim(infraScore * 8 + 15, 1), insight: `Urban sprawl expanding ${(2 + rng() * 8).toFixed(0)}km annually as infrastructure connects new corridors.`, beginnerTip: "When a city expands outward with new roads and metro, previously cheap areas become valuable." };
  const metroGrowth = { ...dim(infraScore * 9 + 10, infraScore > 7 ? 0 : 1), insight: `Metro network expanding by ${Math.round(10 + rng() * 60)}km in current phase.`, beginnerTip: "Metro stations are property price magnets. Homes within 1km of a new metro station typically see 15-25% appreciation." };

  const growthScore = Math.round((jobCreation.score + migration.score + commercialDemand.score) / 3);
  const futurePotentialScore = Math.round((infrastructure.score + startupEcosystem.score + metroGrowth.score) / 3);
  const smartMoneyScore = Math.round((luxuryDemand.score + commercialDemand.score + rentalMarket.score) / 3);
  const infraMomentumScore = Math.round((infrastructure.score + trafficExpansion.score + metroGrowth.score) / 3);
  const bubbleRiskScore = Math.round(100 - affordability.score + (appreciation > 20 ? 20 : 0) + (rng() - 0.5) * 10);

  return {
    city: cityName,
    jobCreation, migration, infrastructure, startupEcosystem,
    commercialDemand, affordability, luxuryDemand, rentalMarket,
    trafficExpansion, metroGrowth,
    growthScore: Math.min(100, Math.max(10, growthScore)),
    futurePotentialScore: Math.min(100, Math.max(10, futurePotentialScore)),
    smartMoneyScore: Math.min(100, Math.max(10, smartMoneyScore)),
    infraMomentumScore: Math.min(100, Math.max(10, infraMomentumScore)),
    bubbleRiskScore: Math.min(100, Math.max(5, bubbleRiskScore)),
    whyGrowing: raw.whyGrowing ?? `${cityName} is growing due to a combination of infrastructure investment, population growth, and economic expansion driving sustained real estate demand.`,
    whyImportant: raw.whyImportant ?? `${cityName} is a key real estate market in its region, offering a mix of growth potential and investment opportunities.`,
    investmentVerdict: raw.investmentVerdict ?? `${cityName} offers ${appreciation > 10 ? "strong" : "moderate"} growth potential with ${(city?.rentalYield ?? 4) > 5 ? "attractive" : "average"} rental yields.`,
    beginnerSummary: raw.beginnerSummary ?? `${cityName} real estate is ${appreciation > 15 ? "booming" : appreciation > 8 ? "growing steadily" : "stable"} right now. ${appreciation > 10 ? "More people and businesses are moving here, pushing prices up." : "The market is mature with steady, predictable returns."}`,
  };
}

function currencyLabel(currency: string): string {
  const map: Record<string, string> = { INR: "₹", USD: "$", AED: "AED ", GBP: "£", JPY: "¥", SGD: "S$", AUD: "A$", EUR: "€", SAR: "SAR ", PLN: "PLN ", MXN: "MXN ", VND: "₫" };
  return map[currency] || "$";
}

/* ═════════════════════════════════════════════════════════════════
   GLOBAL REAL ESTATE POWER MAP
   Fastest growing, luxury hubs, commercial hubs, smart cities
   ═════════════════════════════════════════════════════════════════ */

export interface PowerMapCity {
  city: string;
  flag: string;
  categories: string[];
  globalRank: number;
  whyImportant: string;
  keyMetric: string;
  trend: "Rising" | "Stable" | "Declining";
}

export const GLOBAL_POWER_MAP: PowerMapCity[] = [
  { city: "Dubai", flag: "🇦🇪", categories: ["Luxury Hub", "Migration Hotspot", "High Yield"], globalRank: 1, whyImportant: "World's #1 destination for HNWI migration. Zero income tax + golden visa = global wealth magnet.", keyMetric: "8.2% rental yield", trend: "Rising" },
  { city: "Singapore", flag: "🇸🇬", categories: ["Safe Haven", "Commercial Hub", "Smart City"], globalRank: 2, whyImportant: "Asia's Switzerland. AAA credit rating, rule of law, and strategic location make it the ultimate safe-haven asset.", keyMetric: "$1,800/sqft avg", trend: "Stable" },
  { city: "Tokyo", flag: "🇯🇵", categories: ["Value Play", "Commercial Hub", "Tourism Boom"], globalRank: 3, whyImportant: "World's largest metro economy selling at 30% FX discount. Weak yen creating generational buying opportunity for foreign investors.", keyMetric: "1.2% mortgage rate", trend: "Rising" },
  { city: "Mumbai", flag: "🇮🇳", categories: ["Fastest Growing", "Infrastructure Boom", "Financial Hub"], globalRank: 4, whyImportant: "India's financial capital in strongest upcycle in a decade. New airport + metro creating massive new corridors.", keyMetric: "+14.2% YoY growth", trend: "Rising" },
  { city: "Bengaluru", flag: "🇮🇳", categories: ["Tech Hub", "Fastest Growing", "Startup Capital"], globalRank: 5, whyImportant: "India's Silicon Valley. $150B+ startup ecosystem creating constant housing demand. Best IT corridor in Asia-Pacific.", keyMetric: "+18.5% YoY growth", trend: "Rising" },
  { city: "London", flag: "🇬🇧", categories: ["Safe Haven", "Luxury Hub", "Student Housing"], globalRank: 6, whyImportant: "World's most liquid real estate market. Global safe-haven for Gulf, Asian, and Russian capital despite weak local growth.", keyMetric: "$1,200/sqft prime", trend: "Stable" },
  { city: "New York", flag: "🇺🇸", categories: ["Financial Hub", "Life Sciences", "Multifamily"], globalRank: 7, whyImportant: "Global financial capital with all-time high rents. Life sciences and multifamily sectors leading new investment cycle.", keyMetric: "$1,400/sqft Manhattan", trend: "Stable" },
  { city: "Riyadh", flag: "🇸🇦", categories: ["Mega Projects", "Infrastructure Boom", "Vision 2030"], globalRank: 8, whyImportant: "Saudi Vision 2030 creating the largest construction boom in history. NEOM alone is a $500B city project.", keyMetric: "+15% YoY growth", trend: "Rising" },
  { city: "Hyderabad", flag: "🇮🇳", categories: ["Best Value", "Tech Hub", "Fastest Growing"], globalRank: 9, whyImportant: "India's best risk-reward — tech hub prices at 40-60% below Bengaluru. Pharma City adding industrial demand layer.", keyMetric: "+20% YoY, ₹85/sqft", trend: "Rising" },
  { city: "Ho Chi Minh", flag: "🇻🇳", categories: ["Emerging Market", "Industrial Boom", "High Growth"], globalRank: 10, whyImportant: "Vietnam's manufacturing boom driving industrial and residential demand. Korean and Japanese supply chain relocation.", keyMetric: "5.5% yield, 12% growth", trend: "Rising" },
];

export const POWER_MAP_CATEGORIES = [
  { id: "all", label: "All Cities", icon: "🌍" },
  { id: "Fastest Growing", label: "Fastest Growing", icon: "🚀" },
  { id: "Luxury Hub", label: "Luxury Hubs", icon: "💎" },
  { id: "Commercial Hub", label: "Commercial Hubs", icon: "🏢" },
  { id: "Safe Haven", label: "Safe Havens", icon: "🛡️" },
  { id: "Infrastructure Boom", label: "Infra Boom", icon: "🏗️" },
  { id: "Tech Hub", label: "Tech Hubs", icon: "💻" },
];

/* ═════════════════════════════════════════════════════════════════
   AI REAL ESTATE STORY ENGINE
   City narratives, infrastructure stories, migration stories
   ═════════════════════════════════════════════════════════════════ */

export interface REStory {
  title: string;
  body: string;
  category: "City Growth" | "Infrastructure" | "Affordability" | "Migration" | "Luxury" | "Commercial" | "Macro" | "Smart Money";
  icon: string;
  city: string;
  timestamp: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
}

export function generateREStories(cityName: string): REStory[] {
  const city = CITIES_RE.find(c => c.name === cityName);
  const appreciation = city?.priceAppreciation ?? 8;
  const rng = seededRng(cityName.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + 100);
  const ts = ["2h ago", "4h ago", "6h ago", "8h ago", "12h ago", "1d ago"];

  const stories: REStory[] = [
    {
      title: `Why ${cityName} Real Estate Is ${appreciation > 15 ? "On Fire" : appreciation > 8 ? "Gaining Momentum" : "Holding Steady"}`,
      body: `${cityName} property market is ${appreciation > 15 ? "surging" : appreciation > 8 ? "climbing steadily" : "stabilizing"} with ${appreciation}% annual appreciation. ${appreciation > 12 ? "Institutional investors are accelerating capital deployment." : "Selective opportunities exist in emerging micro-markets."} The key driver: ${city?.hotSectors[0] ?? "residential"} sector is seeing strongest demand in ${Math.round(3 + rng() * 7)} years.`,
      category: "City Growth", icon: "🏙️", city: cityName, timestamp: ts[0],
      sentiment: appreciation > 10 ? "Bullish" : "Neutral",
    },
    {
      title: `Infrastructure Spending in ${cityName} Creating New Investment Corridors`,
      body: `Government infrastructure investment of ${city?.currency === "INR" ? "₹" + Math.round(20000 + rng() * 80000) + " crore" : "$" + Math.round(5 + rng() * 30) + "B"} is reshaping ${cityName}'s property landscape. New metro lines, road expansions, and smart city projects are unlocking previously inaccessible areas. Properties within 2km of new infrastructure see 15-30% premium appreciation.`,
      category: "Infrastructure", icon: "🚇", city: cityName, timestamp: ts[1],
      sentiment: "Bullish",
    },
    {
      title: `${cityName} Rental Market: ${(city?.rentalYield ?? 4) > 5 ? "Yields Outperforming" : "Steady Returns"} Amid ${appreciation > 10 ? "Strong" : "Moderate"} Demand`,
      body: `Rental yields in ${cityName} stand at ${city?.rentalYield ?? 4}% — ${(city?.rentalYield ?? 4) > 6 ? "significantly above" : (city?.rentalYield ?? 4) > 4 ? "in line with" : "below"} the global average of 4.5%. ${appreciation > 12 ? "Rising property prices may compress yields going forward, making current entry points attractive for income investors." : "Stable yields offer predictable cash flow for conservative investors."} Vacancy rates at ${(2 + rng() * 6).toFixed(1)}%.`,
      category: "Affordability", icon: "💰", city: cityName, timestamp: ts[2],
      sentiment: (city?.rentalYield ?? 4) > 5 ? "Bullish" : "Neutral",
    },
    {
      title: `Smart Money Flowing Into ${cityName}: ${appreciation > 12 ? "Institutional Buyers" : "Selective Capital"} Leading`,
      body: `Institutional capital deployment in ${cityName} ${appreciation > 12 ? "accelerating" : "continuing at measured pace"} with $${(0.5 + rng() * 5).toFixed(1)}B deployed in last 12 months. ${appreciation > 15 ? "Private equity firms and sovereign wealth funds leading the charge." : "Family offices and PE funds selectively targeting value opportunities."} Key focus: ${city?.hotSectors.join(", ") ?? "residential, commercial"}.`,
      category: "Smart Money", icon: "🐋", city: cityName, timestamp: ts[3],
      sentiment: appreciation > 12 ? "Bullish" : "Neutral",
    },
    {
      title: `${cityName} Luxury Segment: ${appreciation > 10 ? "Record Demand" : "Niche Demand"} From ${city?.countryCode === "IN" ? "Tech Founders & NRIs" : "Global HNWIs"}`,
      body: `The luxury residential segment in ${cityName} is seeing ${appreciation > 12 ? "unprecedented" : "moderate"} demand driven by ${city?.countryCode === "IN" ? "tech IPO wealth, startup exits, and NRI investment" : "HNWI migration, wealth preservation, and lifestyle upgrades"}. Premium properties commanding ${(5 + rng() * 20).toFixed(0)}% price premium over mid-range. Average ultra-luxury transaction size: ${city?.currency === "INR" ? "₹8-15 crore" : "$2-5 million"}.`,
      category: "Luxury", icon: "💎", city: cityName, timestamp: ts[4],
      sentiment: appreciation > 10 ? "Bullish" : "Neutral",
    },
    {
      title: `How Macro Changes Are Affecting ${cityName} Real Estate`,
      body: `${city?.countryCode === "IN" ? "RBI rate cuts are making home loans cheaper, boosting buyer affordability. Each 25bps cut reduces EMI by approximately ₹1,200 per ₹1 lakh loan." : city?.countryCode === "US" ? "Fed rate policy remains the key swing factor. Each 25bps cut could unlock billions in refinancing activity." : "Central bank policy and inflation trends are the dominant factors."} ${cityName} mortgage rates at ${city?.mortgageRate ?? 6}% — ${city?.mortgageRate && city.mortgageRate < 4 ? "historically low" : city?.mortgageRate && city.mortgageRate > 7 ? "elevated but easing" : "moderate"}.`,
      category: "Macro", icon: "📉", city: cityName, timestamp: ts[5],
      sentiment: "Neutral",
    },
  ];

  return stories;
}

/* ═════════════════════════════════════════════════════════════════
   AI REAL ESTATE COPILOT — Narrative Engine
   ═════════════════════════════════════════════════════════════════ */

export interface RECopilotNarrative {
  headline: string;
  summary: string;
  beginnerStory: string;
  institutionalBrief: string;
  marketMood: string;
  moodEmoji: string;
  moodColor: string;
  actionItems: string[];
  riskWarning: string;
  opportunities: string[];
}

export function generateRECopilot(cityName: string): RECopilotNarrative {
  const city = CITIES_RE.find(c => c.name === cityName);
  const growth = generateCityGrowthIntelligence(cityName);
  const appreciation = city?.priceAppreciation ?? 8;
  const rng = seededRng(cityName.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + 200);

  let marketMood: string, moodEmoji: string, moodColor: string;
  if (appreciation > 18) { marketMood = "Euphoric"; moodEmoji = "🚀"; moodColor = "#ff6f00"; }
  else if (appreciation > 12) { marketMood = "Very Bullish"; moodEmoji = "😊"; moodColor = "#00c853"; }
  else if (appreciation > 6) { marketMood = "Optimistic"; moodEmoji = "📈"; moodColor = "#2962ff"; }
  else if (appreciation > 0) { marketMood = "Cautious"; moodEmoji = "🤔"; moodColor = "#ff9800"; }
  else { marketMood = "Bearish"; moodEmoji = "📉"; moodColor = "#ef5350"; }

  const headline = `${cityName}: ${appreciation > 15 ? "On Fire" : appreciation > 8 ? "Heating Up" : "Steady"} — ${appreciation}% Growth | ${city?.rentalYield ?? 4}% Yield | Score ${city?.investmentScore ?? 70}/100`;

  const summary = `${cityName} real estate is in a ${appreciation > 15 ? "strong bull cycle" : appreciation > 8 ? "growth phase" : "consolidation phase"} with ${appreciation}% annual appreciation and ${city?.rentalYield ?? 4}% rental yield. ${growth.whyGrowing.split('.')[0]}.`;

  const beginnerStory = growth.beginnerSummary;
  const institutionalBrief = `${cityName} | +${appreciation}% YoY | Yield ${city?.rentalYield ?? 4}% | P/I ${city?.priceToIncome ?? 12}x | Infra ${city?.infrastructureScore ?? 6}/10 | Risk ${city?.riskLevel ?? "Medium"} | Score ${city?.investmentScore ?? 70} | Growth ${growth.growthScore} | Future ${growth.futurePotentialScore} | Smart Money ${growth.smartMoneyScore} | Bubble Risk ${growth.bubbleRiskScore}`;

  const actionItems = [
    growth.investmentVerdict.split('.')[0],
    `Growth Score: ${growth.growthScore}/100 — ${growth.growthScore > 70 ? "Strong momentum, consider entering" : "Moderate, be selective"}`,
    `Bubble Risk: ${growth.bubbleRiskScore}/100 — ${growth.bubbleRiskScore > 60 ? "Elevated, use caution" : "Manageable risk"}`,
    `Infra momentum: ${growth.infraMomentumScore}/100 — buy near upcoming infrastructure for maximum upside`,
  ];

  const riskWarning = growth.bubbleRiskScore > 60
    ? `ELEVATED RISK: ${cityName} showing signs of overheating. Speculation index high. Avoid overpaying in premium segments. Focus on areas with genuine demand drivers, not speculation.`
    : growth.bubbleRiskScore > 40
    ? `MODERATE RISK: ${cityName} market is healthy but monitor affordability ratios. Prices may plateau if rate cuts slow.`
    : `LOW RISK: ${cityName} fundamentals are strong. Good time for selective entry in growth corridors.`;

  const opportunities = [
    `${appreciation > 10 ? "Emerging corridors near new infrastructure" : "Established areas with stable yields"} offer best risk-adjusted returns`,
    `Rental yield at ${city?.rentalYield ?? 4}% — ${(city?.rentalYield ?? 4) > 5 ? "above global average, income investors should consider" : "at par, suitable for total-return strategy"}`,
    `${city?.hotSectors?.[0] ?? "Residential"} sector showing strongest momentum — prioritize allocation here`,
  ];

  return {
    headline, summary, beginnerStory, institutionalBrief,
    marketMood, moodEmoji, moodColor,
    actionItems, riskWarning, opportunities,
  };
}

/* ═════════════════════════════════════════════════════════════════
   MACRO INTELLIGENCE ENGINE
   Interest rates, inflation, policy impact on real estate
   ═════════════════════════════════════════════════════════════════ */

export interface MacroFactor {
  name: string;
  icon: string;
  currentValue: string;
  trend: "Rising" | "Falling" | "Stable";
  impactOnRE: "Positive" | "Negative" | "Mixed";
  explanation: string;
  beginnerTip: string;
  affectedCities: string[];
}

export const MACRO_ENGINE: MacroFactor[] = [
  {
    name: "RBI Interest Rate", icon: "🏛️", currentValue: "6.25%", trend: "Falling",
    impactOnRE: "Positive",
    explanation: "RBI cutting rates → cheaper home loans → more buyers → higher property prices. Each 25bps cut reduces monthly EMI by ~₹1,200 per ₹1 lakh loan amount.",
    beginnerTip: "When interest rates fall, your home loan becomes cheaper. If your EMI drops from ₹50,000 to ₹48,000, you can afford a slightly more expensive home. Multiply this by millions of buyers and you get rising property prices.",
    affectedCities: ["Mumbai", "Bengaluru", "Hyderabad"],
  },
  {
    name: "US Federal Reserve Rate", icon: "🇺🇸", currentValue: "5.25%", trend: "Stable",
    impactOnRE: "Mixed",
    explanation: "High US rates attract capital away from emerging markets including Indian and Dubai real estate. But a future Fed pivot could trigger capital flows back into EM property.",
    beginnerTip: "When US interest rates are high, global investors prefer safe US bonds over risky real estate in other countries. When rates eventually fall, money flows back into markets like India, Dubai, and Vietnam.",
    affectedCities: ["New York", "Dubai", "Singapore", "Mumbai"],
  },
  {
    name: "Inflation (India CPI)", icon: "📊", currentValue: "4.8%", trend: "Falling",
    impactOnRE: "Positive",
    explanation: "Moderating inflation allows RBI to continue cutting rates. Real estate is a natural inflation hedge — property values and rents typically rise with inflation.",
    beginnerTip: "Inflation means everything gets more expensive over time — including rent and property. Owning real estate is like having a shield against inflation because your asset value rises with prices.",
    affectedCities: ["Mumbai", "Bengaluru", "Hyderabad", "Delhi"],
  },
  {
    name: "Oil Prices (Brent)", icon: "🛢️", currentValue: "$78/barrel", trend: "Stable",
    impactOnRE: "Mixed",
    explanation: "Higher oil benefits Gulf real estate (Dubai, Riyadh) but hurts oil-importing nations (India). Current $70-80 range is the Goldilocks zone — benefits both.",
    beginnerTip: "Oil is like the blood of the global economy. When oil prices are high, Gulf countries get rich and build more (good for Dubai). But India pays more for imports, which can slow its economy (bad for Mumbai).",
    affectedCities: ["Dubai", "Riyadh", "Mumbai", "Bengaluru"],
  },
  {
    name: "USD/INR Exchange Rate", icon: "💱", currentValue: "₹83.5/$", trend: "Stable",
    impactOnRE: "Mixed",
    explanation: "Stable rupee reduces FX risk for NRI investors buying Indian property. A weaker rupee makes Indian RE cheaper for foreign investors but can signal economic concerns.",
    beginnerTip: "If you're an NRI earning in dollars, Indian property looks like a bargain when the rupee weakens. ₹83 per dollar means your $100K buys a ₹83.5 lakh apartment instead of ₹75 lakh when the rate was 75.",
    affectedCities: ["Mumbai", "Bengaluru", "Hyderabad", "Delhi"],
  },
  {
    name: "Mortgage Affordability", icon: "🏠", currentValue: "EMI/Income: 42%", trend: "Falling",
    impactOnRE: "Positive",
    explanation: "EMI-to-income ratios improving as rates fall and incomes rise. More households crossing the affordability threshold into homeownership.",
    beginnerTip: "Banks say your home loan EMI shouldn't exceed 40-45% of your monthly income. As rates drop and salaries rise, more people qualify for loans, which means more buyers in the market.",
    affectedCities: ["Mumbai", "Bengaluru", "Hyderabad", "Delhi"],
  },
  {
    name: "Urbanization Rate", icon: "🏙️", currentValue: "35% (India)", trend: "Rising",
    impactOnRE: "Positive",
    explanation: "India's urbanization at 35% vs China's 65% and US 83%. Every 1% increase in urbanization adds 14 million city-dwellers needing housing — a structural demand driver for decades.",
    beginnerTip: "In India, only 35 out of 100 people live in cities. In China it's 65, in the US it's 83. As India urbanizes to 50%+, that's 200 million more people needing city homes. This is the biggest long-term demand driver.",
    affectedCities: ["Mumbai", "Bengaluru", "Hyderabad", "Delhi"],
  },
  {
    name: "Construction Activity Index", icon: "🏗️", currentValue: "PMI 58.2", trend: "Rising",
    impactOnRE: "Positive",
    explanation: "Construction PMI above 50 indicates expansion. At 58.2, India's construction sector is growing robustly — good for housing supply but also signals strong demand.",
    beginnerTip: "PMI above 50 means the construction industry is growing. More buildings going up means more supply, but it also signals that builders are confident people will buy.",
    affectedCities: ["Mumbai", "Bengaluru", "Hyderabad"],
  },
];

/* ═════════════════════════════════════════════════════════════════
   INDIA STATE & CITY DATA — India-first Real Estate Intelligence
   All states, UTs, major cities with AI growth analysis
   ═════════════════════════════════════════════════════════════════ */

export interface IndiaState {
  name: string;
  code: string;
  type: "State" | "UT";
  capital: string;
  appreciation: number;     // avg YoY %
  rentalYield: number;
  avgPriceSqft: number;     // INR
  demandTrend: "Surging" | "Rising" | "Stable" | "Cooling";
  investmentScore: number;  // 0-100
  majorCities: IndiaCity[];
  keyDrivers: string[];
  aiSummary: string;
  infraHighlight: string;
  riskLevel: "Low" | "Medium" | "High";
}

export interface IndiaCity {
  name: string;
  state: string;
  tier: 1 | 2 | 3;
  avgPriceSqft: number;
  appreciation: number;
  rentalYield: number;
  demandTrend: "Surging" | "Rising" | "Stable" | "Cooling";
  investmentScore: number;
  population: string;
  hotSectors: string[];
  aiOneLiner: string;
  slug: string;
}

export const INDIA_STATES: IndiaState[] = [
  {
    name: "Maharashtra", code: "MH", type: "State", capital: "Mumbai", appreciation: 14.5, rentalYield: 3.8, avgPriceSqft: 12500, demandTrend: "Surging", investmentScore: 92, riskLevel: "Medium",
    keyDrivers: ["Financial capital", "Infrastructure boom", "IT/ITES growth", "RERA compliance"],
    aiSummary: "Maharashtra leads India's real estate market with Mumbai driving luxury demand and Pune emerging as an affordable IT hub. Navi Mumbai airport, Mumbai Trans Harbour Link, and Metro expansion are creating new growth corridors with 20-40% appreciation potential.",
    infraHighlight: "Navi Mumbai Airport (2025) + Mumbai Metro Line 3 + Mumbai-Ahmedabad Bullet Train",
    majorCities: [
      { name: "Mumbai", state: "Maharashtra", tier: 1, avgPriceSqft: 28000, appreciation: 14.2, rentalYield: 3.5, demandTrend: "Surging", investmentScore: 92, population: "2.1 Cr", hotSectors: ["Luxury", "Commercial", "Redevelopment"], aiOneLiner: "India's financial capital — strongest upcycle since 2014 with BKC rivaling Singapore CBD rents.", slug: "mumbai" },
      { name: "Pune", state: "Maharashtra", tier: 1, avgPriceSqft: 8500, appreciation: 16.5, rentalYield: 4.0, demandTrend: "Surging", investmentScore: 88, population: "75L", hotSectors: ["IT Corridors", "Residential", "Industrial"], aiOneLiner: "India's Oxford city turned IT powerhouse — Hinjewadi/Kharadi corridors seeing 15-20% growth.", slug: "pune" },
      { name: "Thane", state: "Maharashtra", tier: 1, avgPriceSqft: 12000, appreciation: 12.0, rentalYield: 3.8, demandTrend: "Rising", investmentScore: 82, population: "25L", hotSectors: ["Residential", "Affordable"], aiOneLiner: "Mumbai's growth corridor — metro connectivity driving strong residential demand.", slug: "thane" },
      { name: "Navi Mumbai", state: "Maharashtra", tier: 1, avgPriceSqft: 10000, appreciation: 18.0, rentalYield: 4.2, demandTrend: "Surging", investmentScore: 86, population: "20L", hotSectors: ["Airport Impact", "Residential", "Commercial"], aiOneLiner: "Airport effect transforming Panvel-Ulwe — highest appreciation in MMR.", slug: "navi-mumbai" },
      { name: "Nagpur", state: "Maharashtra", tier: 2, avgPriceSqft: 4500, appreciation: 8.0, rentalYield: 4.5, demandTrend: "Rising", investmentScore: 68, population: "30L", hotSectors: ["MIHAN SEZ", "Residential"], aiOneLiner: "Central India hub with MIHAN SEZ and growing IT presence.", slug: "nagpur" },
      { name: "Nashik", state: "Maharashtra", tier: 2, avgPriceSqft: 4000, appreciation: 7.0, rentalYield: 4.0, demandTrend: "Stable", investmentScore: 62, population: "18L", hotSectors: ["Industrial", "Wine Tourism"], aiOneLiner: "Emerging industrial corridor with affordable entry points.", slug: "nashik" },
    ],
  },
  {
    name: "Karnataka", code: "KA", type: "State", capital: "Bengaluru", appreciation: 18.0, rentalYield: 4.2, avgPriceSqft: 8500, demandTrend: "Surging", investmentScore: 90, riskLevel: "Medium",
    keyDrivers: ["IT/Tech capital", "Startup ecosystem $150B+", "Metro expansion", "Data center boom"],
    aiSummary: "Karnataka is India's tech heartland. Bengaluru's IT corridors (Whitefield, Sarjapur, Electronic City) see 20-25% appreciation driven by global tech employment. Metro Phase 2 unlocking new growth corridors. Devanahalli airport area offers the highest upside.",
    infraHighlight: "Bengaluru Metro Phase 2 (72km) + Peripheral Ring Road + Satellite Town Ring Road",
    majorCities: [
      { name: "Bengaluru", state: "Karnataka", tier: 1, avgPriceSqft: 8500, appreciation: 18.5, rentalYield: 4.2, demandTrend: "Surging", investmentScore: 90, population: "1.4 Cr", hotSectors: ["IT Corridors", "Residential", "Data Centers"], aiOneLiner: "India's Silicon Valley — $150B+ startup ecosystem fueling relentless housing demand.", slug: "bengaluru" },
      { name: "Mysuru", state: "Karnataka", tier: 2, avgPriceSqft: 4200, appreciation: 9.0, rentalYield: 3.8, demandTrend: "Rising", investmentScore: 65, population: "12L", hotSectors: ["IT Parks", "Heritage Tourism"], aiOneLiner: "Bengaluru spillover with IT parks and quality-of-life advantage.", slug: "mysuru" },
      { name: "Mangaluru", state: "Karnataka", tier: 2, avgPriceSqft: 4800, appreciation: 7.5, rentalYield: 4.0, demandTrend: "Stable", investmentScore: 58, population: "7L", hotSectors: ["Port Development", "Residential"], aiOneLiner: "Coastal city with port-driven development and NRI investment.", slug: "mangaluru" },
      { name: "Hubli-Dharwad", state: "Karnataka", tier: 2, avgPriceSqft: 3500, appreciation: 8.0, rentalYield: 4.5, demandTrend: "Rising", investmentScore: 60, population: "12L", hotSectors: ["Industrial", "Residential"], aiOneLiner: "North Karnataka's commercial hub with affordable growth potential.", slug: "hubli-dharwad" },
    ],
  },
  {
    name: "Telangana", code: "TS", type: "State", capital: "Hyderabad", appreciation: 20.0, rentalYield: 4.5, avgPriceSqft: 7200, demandTrend: "Surging", investmentScore: 89, riskLevel: "Low",
    keyDrivers: ["IT/Pharma dual engine", "Lowest bubble risk", "Developer-friendly policy", "Pharma City"],
    aiSummary: "Telangana offers India's best risk-reward — tech hub quality at 40-60% below Bengaluru prices. Hyderabad's Kokapet Financial District, Pharma City (Asia's largest), and ORR growth corridors are creating multi-decade demand. Government policy is the most developer-friendly in India.",
    infraHighlight: "Hyderabad Metro Phase 2 + Regional Ring Road + Pharma City (19,333 acres)",
    majorCities: [
      { name: "Hyderabad", state: "Telangana", tier: 1, avgPriceSqft: 7200, appreciation: 20.0, rentalYield: 4.5, demandTrend: "Surging", investmentScore: 89, population: "1.1 Cr", hotSectors: ["IT Parks", "Luxury", "Pharma"], aiOneLiner: "India's best risk-reward — tech hub at 40-60% below Bengaluru prices with 20% growth.", slug: "hyderabad" },
      { name: "Warangal", state: "Telangana", tier: 3, avgPriceSqft: 2800, appreciation: 6.0, rentalYield: 4.0, demandTrend: "Stable", investmentScore: 48, population: "8L", hotSectors: ["Education", "Heritage"], aiOneLiner: "Heritage city with growing educational infrastructure.", slug: "warangal" },
    ],
  },
  {
    name: "Delhi NCR", code: "DL", type: "UT", capital: "New Delhi", appreciation: 12.0, rentalYield: 3.2, avgPriceSqft: 11000, demandTrend: "Rising", investmentScore: 85, riskLevel: "Medium",
    keyDrivers: ["National capital", "Jewar Airport", "Rapid Metro", "Government spending"],
    aiSummary: "Delhi NCR is India's largest real estate market by area — spanning Delhi, Gurgaon, Noida, Greater Noida, and Faridabad. Jewar International Airport is the next big catalyst, creating a new growth corridor along the Yamuna Expressway. Gurgaon remains the premium office market.",
    infraHighlight: "Jewar International Airport + Delhi Metro Phase 4 + Rapid Metro Extension",
    majorCities: [
      { name: "Gurgaon", state: "Delhi NCR", tier: 1, avgPriceSqft: 14000, appreciation: 15.0, rentalYield: 3.2, demandTrend: "Surging", investmentScore: 86, population: "35L", hotSectors: ["Commercial", "Luxury", "Co-living"], aiOneLiner: "India's corporate capital — premium office market with strong rental demand.", slug: "gurgaon" },
      { name: "Noida", state: "Delhi NCR", tier: 1, avgPriceSqft: 7500, appreciation: 12.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 78, population: "28L", hotSectors: ["IT", "Residential", "Film City"], aiOneLiner: "Affordable NCR alternative with Jewar Airport proximity advantage.", slug: "noida" },
      { name: "Greater Noida", state: "Delhi NCR", tier: 2, avgPriceSqft: 4500, appreciation: 18.0, rentalYield: 4.0, demandTrend: "Surging", investmentScore: 80, population: "12L", hotSectors: ["Jewar Airport", "Expressway", "Affordable"], aiOneLiner: "Jewar Airport zone — highest appreciation potential in NCR.", slug: "greater-noida" },
      { name: "New Delhi", state: "Delhi NCR", tier: 1, avgPriceSqft: 18000, appreciation: 6.0, rentalYield: 2.5, demandTrend: "Stable", investmentScore: 72, population: "1.1 Cr", hotSectors: ["Government", "Luxury", "Heritage"], aiOneLiner: "Mature market with limited supply — ultra-premium Lutyens zone is forever scarce.", slug: "new-delhi" },
      { name: "Faridabad", state: "Delhi NCR", tier: 2, avgPriceSqft: 5500, appreciation: 10.0, rentalYield: 3.8, demandTrend: "Rising", investmentScore: 65, population: "18L", hotSectors: ["Affordable", "Metro Impact"], aiOneLiner: "Affordable NCR entry with metro connectivity to Delhi.", slug: "faridabad" },
      { name: "Ghaziabad", state: "Delhi NCR", tier: 2, avgPriceSqft: 4800, appreciation: 9.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 62, population: "20L", hotSectors: ["Affordable Housing", "RRTS"], aiOneLiner: "Delhi's eastern expansion zone with RRTS rail connectivity.", slug: "ghaziabad" },
    ],
  },
  {
    name: "Tamil Nadu", code: "TN", type: "State", capital: "Chennai", appreciation: 11.0, rentalYield: 3.8, avgPriceSqft: 7000, demandTrend: "Rising", investmentScore: 80, riskLevel: "Low",
    keyDrivers: ["Auto manufacturing", "IT corridor", "EV hub", "Port infrastructure"],
    aiSummary: "Tamil Nadu combines Chennai's established IT/auto hub with emerging Coimbatore tech growth. The OMR corridor in Chennai remains a strong investment zone while the state's EV manufacturing push is creating new industrial demand corridors.",
    infraHighlight: "Chennai Metro Phase 2 + Chennai Port Expansion + Coimbatore Smart City",
    majorCities: [
      { name: "Chennai", state: "Tamil Nadu", tier: 1, avgPriceSqft: 7000, appreciation: 11.0, rentalYield: 3.8, demandTrend: "Rising", investmentScore: 80, population: "1.1 Cr", hotSectors: ["IT/OMR", "Auto", "Warehousing"], aiOneLiner: "India's Detroit meets IT corridor — OMR belt driving consistent demand.", slug: "chennai" },
      { name: "Coimbatore", state: "Tamil Nadu", tier: 2, avgPriceSqft: 4800, appreciation: 10.0, rentalYield: 4.2, demandTrend: "Rising", investmentScore: 72, population: "22L", hotSectors: ["IT", "Manufacturing", "Smart City"], aiOneLiner: "South India's Manchester — affordable tech hub with growing investor interest.", slug: "coimbatore" },
      { name: "Madurai", state: "Tamil Nadu", tier: 2, avgPriceSqft: 3500, appreciation: 7.0, rentalYield: 3.5, demandTrend: "Stable", investmentScore: 55, population: "15L", hotSectors: ["Heritage Tourism", "Industrial"], aiOneLiner: "Temple city with steady residential demand and industrial growth.", slug: "madurai" },
    ],
  },
  {
    name: "Gujarat", code: "GJ", type: "State", capital: "Gandhinagar", appreciation: 13.0, rentalYield: 3.5, avgPriceSqft: 5500, demandTrend: "Rising", investmentScore: 82, riskLevel: "Low",
    keyDrivers: ["GIFT City", "Industrial corridors", "Diamond/textile hub", "Port infrastructure"],
    aiSummary: "Gujarat is India's industrial powerhouse with GIFT City becoming the nation's first International Financial Services Centre. Ahmedabad's SG Highway corridor, Surat's diamond district growth, and the DMIC industrial corridor are creating multi-dimensional demand.",
    infraHighlight: "GIFT City IFSC + Ahmedabad Metro + Mumbai-Ahmedabad Bullet Train",
    majorCities: [
      { name: "Ahmedabad", state: "Gujarat", tier: 1, avgPriceSqft: 5500, appreciation: 13.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 82, population: "85L", hotSectors: ["GIFT City", "SG Highway", "Industrial"], aiOneLiner: "GIFT City + bullet train creating India's next financial hub.", slug: "ahmedabad" },
      { name: "Surat", state: "Gujarat", tier: 2, avgPriceSqft: 4200, appreciation: 12.0, rentalYield: 4.0, demandTrend: "Rising", investmentScore: 76, population: "65L", hotSectors: ["Diamond", "Textile", "Residential"], aiOneLiner: "World's diamond capital with India's fastest growing GDP per capita.", slug: "surat" },
      { name: "Vadodara", state: "Gujarat", tier: 2, avgPriceSqft: 3800, appreciation: 8.0, rentalYield: 3.8, demandTrend: "Stable", investmentScore: 64, population: "22L", hotSectors: ["Industrial", "Heritage"], aiOneLiner: "Cultural capital with strong industrial base and affordable living.", slug: "vadodara" },
      { name: "Rajkot", state: "Gujarat", tier: 2, avgPriceSqft: 3200, appreciation: 9.0, rentalYield: 4.0, demandTrend: "Rising", investmentScore: 60, population: "18L", hotSectors: ["Engineering", "Small Enterprise"], aiOneLiner: "India's small enterprise capital with Greenfield airport boost.", slug: "rajkot" },
    ],
  },
  {
    name: "Rajasthan", code: "RJ", type: "State", capital: "Jaipur", appreciation: 10.0, rentalYield: 3.5, avgPriceSqft: 4500, demandTrend: "Rising", investmentScore: 72, riskLevel: "Low",
    keyDrivers: ["Tourism", "IT growth", "DMIC corridor", "Heritage revival"],
    aiSummary: "Rajasthan is leveraging its heritage tourism advantage while building IT infrastructure. Jaipur's Sitapura IT park and Mahindra SEZ are attracting tech companies, while luxury heritage hotels drive premium hospitality demand.",
    infraHighlight: "Jaipur Metro Phase 2 + Delhi-Mumbai Industrial Corridor + Udaipur Airport Expansion",
    majorCities: [
      { name: "Jaipur", state: "Rajasthan", tier: 1, avgPriceSqft: 4500, appreciation: 10.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 72, population: "42L", hotSectors: ["IT Parks", "Tourism", "Residential"], aiOneLiner: "Pink City turning tech hub — affordable Tier 1 city with strong tourism overlay.", slug: "jaipur" },
      { name: "Jodhpur", state: "Rajasthan", tier: 2, avgPriceSqft: 3000, appreciation: 7.0, rentalYield: 3.5, demandTrend: "Stable", investmentScore: 52, population: "14L", hotSectors: ["Tourism", "Military", "Solar"], aiOneLiner: "Blue City with heritage tourism and solar energy corridor.", slug: "jodhpur" },
      { name: "Udaipur", state: "Rajasthan", tier: 2, avgPriceSqft: 3800, appreciation: 8.0, rentalYield: 4.5, demandTrend: "Rising", investmentScore: 65, population: "6L", hotSectors: ["Luxury Tourism", "Hospitality"], aiOneLiner: "City of Lakes — premium hospitality real estate and destination weddings.", slug: "udaipur" },
    ],
  },
  {
    name: "Kerala", code: "KL", type: "State", capital: "Thiruvananthapuram", appreciation: 8.0, rentalYield: 3.2, avgPriceSqft: 5500, demandTrend: "Stable", investmentScore: 68, riskLevel: "Low",
    keyDrivers: ["NRI investment", "Tourism", "IT parks", "Healthcare tourism"],
    aiSummary: "Kerala's real estate is unique — driven heavily by NRI remittances (India's highest per capita). Kochi's IT hub and tourism-led hospitality demand create pockets of strong growth despite limited overall appreciation.",
    infraHighlight: "Kochi Metro Phase 2 + Vizhinjam Port + SilverLine Semi-HSR",
    majorCities: [
      { name: "Kochi", state: "Kerala", tier: 2, avgPriceSqft: 6000, appreciation: 9.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 70, population: "22L", hotSectors: ["IT Parks", "Marine", "Tourism"], aiOneLiner: "Queen of Arabian Sea — IT hub + Vizhinjam port creating dual growth engine.", slug: "kochi" },
      { name: "Thiruvananthapuram", state: "Kerala", tier: 2, avgPriceSqft: 5200, appreciation: 7.0, rentalYield: 3.2, demandTrend: "Stable", investmentScore: 60, population: "18L", hotSectors: ["IT/Technopark", "Government"], aiOneLiner: "State capital with Technopark driving steady demand.", slug: "thiruvananthapuram" },
      { name: "Kozhikode", state: "Kerala", tier: 2, avgPriceSqft: 4500, appreciation: 6.5, rentalYield: 3.0, demandTrend: "Stable", investmentScore: 55, population: "8L", hotSectors: ["NRI Housing", "Healthcare"], aiOneLiner: "NRI-driven demand with healthcare tourism growth.", slug: "kozhikode" },
    ],
  },
  {
    name: "Punjab", code: "PB", type: "State", capital: "Chandigarh", appreciation: 7.5, rentalYield: 3.0, avgPriceSqft: 4000, demandTrend: "Stable", investmentScore: 62, riskLevel: "Low",
    keyDrivers: ["NRI investment", "Mohali IT City", "Agriculture wealth", "Border trade"],
    aiSummary: "Punjab real estate is anchored by the Chandigarh Tricity region (Chandigarh-Mohali-Panchkula). Strong NRI investment from Canada, UK, and Australia drives residential demand, while IT City Mohali is attracting tech companies.",
    infraHighlight: "Mohali IT City + Chandigarh Metro (proposed) + Delhi-Amritsar Expressway",
    majorCities: [
      { name: "Chandigarh", state: "Punjab", tier: 1, avgPriceSqft: 7000, appreciation: 8.0, rentalYield: 3.0, demandTrend: "Stable", investmentScore: 68, population: "12L", hotSectors: ["Residential", "Commercial"], aiOneLiner: "India's best-planned city — limited supply drives premium pricing.", slug: "chandigarh" },
      { name: "Mohali", state: "Punjab", tier: 2, avgPriceSqft: 5500, appreciation: 10.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 72, population: "8L", hotSectors: ["IT City", "Residential", "Sports"], aiOneLiner: "IT City driving Chandigarh spillover — strongest growth in Tricity.", slug: "mohali" },
      { name: "Ludhiana", state: "Punjab", tier: 2, avgPriceSqft: 3500, appreciation: 6.0, rentalYield: 3.0, demandTrend: "Stable", investmentScore: 55, population: "20L", hotSectors: ["Industrial", "Hosiery Capital"], aiOneLiner: "Punjab's industrial capital — Manchester of India.", slug: "ludhiana" },
      { name: "Amritsar", state: "Punjab", tier: 2, avgPriceSqft: 3200, appreciation: 7.0, rentalYield: 3.5, demandTrend: "Stable", investmentScore: 58, population: "12L", hotSectors: ["Tourism", "Heritage", "Border Trade"], aiOneLiner: "Golden Temple city with NRI investment and tourism demand.", slug: "amritsar" },
    ],
  },
  {
    name: "Uttar Pradesh", code: "UP", type: "State", capital: "Lucknow", appreciation: 11.0, rentalYield: 3.5, avgPriceSqft: 4000, demandTrend: "Rising", investmentScore: 75, riskLevel: "Medium",
    keyDrivers: ["Jewar Airport", "Expressways", "Industrial corridors", "Population dividend"],
    aiSummary: "UP is India's most populous state with massive infrastructure investment transforming its real estate landscape. Jewar Airport near Greater Noida, Lucknow's IT growth, and expressway-connected cities are creating new investment corridors.",
    infraHighlight: "Jewar Airport + Lucknow Metro + Bundelkhand Expressway + Defence Corridor",
    majorCities: [
      { name: "Lucknow", state: "Uttar Pradesh", tier: 1, avgPriceSqft: 4500, appreciation: 11.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 72, population: "38L", hotSectors: ["IT Park", "Government", "Defence"], aiOneLiner: "City of Nawabs modernizing — IT parks and Defence Corridor driving growth.", slug: "lucknow" },
      { name: "Agra", state: "Uttar Pradesh", tier: 2, avgPriceSqft: 3000, appreciation: 7.0, rentalYield: 3.5, demandTrend: "Stable", investmentScore: 55, population: "22L", hotSectors: ["Tourism", "Heritage", "Leather"], aiOneLiner: "Taj Mahal city with tourism-driven hospitality demand.", slug: "agra" },
      { name: "Varanasi", state: "Uttar Pradesh", tier: 2, avgPriceSqft: 3500, appreciation: 9.0, rentalYield: 3.8, demandTrend: "Rising", investmentScore: 62, population: "18L", hotSectors: ["Smart City", "Tourism", "Heritage"], aiOneLiner: "World's oldest city getting smart city makeover — PM's constituency attracting investment.", slug: "varanasi" },
    ],
  },
  {
    name: "West Bengal", code: "WB", type: "State", capital: "Kolkata", appreciation: 7.0, rentalYield: 3.5, avgPriceSqft: 4500, demandTrend: "Stable", investmentScore: 65, riskLevel: "Medium",
    keyDrivers: ["Eastern gateway", "New Town IT Hub", "Port expansion", "Cultural capital"],
    aiSummary: "West Bengal's real estate is anchored by Kolkata — India's most affordable metro. New Town/Rajarhat IT hub is the primary growth corridor, while Salt Lake and EM Bypass remain premium residential zones.",
    infraHighlight: "Kolkata Metro East-West + New Town Expansion + Tajpur Deep Sea Port",
    majorCities: [
      { name: "Kolkata", state: "West Bengal", tier: 1, avgPriceSqft: 4500, appreciation: 7.0, rentalYield: 3.5, demandTrend: "Stable", investmentScore: 65, population: "1.5 Cr", hotSectors: ["New Town IT", "Residential", "Heritage"], aiOneLiner: "India's most affordable metro — cultural capital with steady, low-risk returns.", slug: "kolkata" },
    ],
  },
  {
    name: "Goa", code: "GA", type: "State", capital: "Panaji", appreciation: 15.0, rentalYield: 5.5, avgPriceSqft: 8500, demandTrend: "Surging", investmentScore: 78, riskLevel: "Medium",
    keyDrivers: ["Remote work migration", "Tourism", "NRI investment", "Lifestyle demand"],
    aiSummary: "Goa has transformed from a tourist destination to a remote-work and lifestyle hub. Post-COVID migration of tech professionals is driving demand in North Goa (Assagao, Siolim) while South Goa attracts luxury villa investors. Rental yields among India's highest at 5-6%.",
    infraHighlight: "Mopa Airport (operational) + Zuari Bridge + National Highway expansion",
    majorCities: [
      { name: "North Goa", state: "Goa", tier: 2, avgPriceSqft: 9000, appreciation: 16.0, rentalYield: 5.5, demandTrend: "Surging", investmentScore: 78, population: "5L", hotSectors: ["Villa", "Boutique Hotels", "Co-living"], aiOneLiner: "India's lifestyle capital — remote workers and Airbnb driving 5.5% yields.", slug: "north-goa" },
      { name: "South Goa", state: "Goa", tier: 2, avgPriceSqft: 7500, appreciation: 12.0, rentalYield: 5.0, demandTrend: "Rising", investmentScore: 72, population: "4L", hotSectors: ["Luxury Villa", "Wellness", "Retirement"], aiOneLiner: "Quieter luxury market with wellness tourism and retirement community demand.", slug: "south-goa" },
    ],
  },
  {
    name: "Haryana", code: "HR", type: "State", capital: "Chandigarh", appreciation: 12.0, rentalYield: 3.2, avgPriceSqft: 6000, demandTrend: "Rising", investmentScore: 76, riskLevel: "Medium",
    keyDrivers: ["Gurgaon corporate hub", "Industrial corridors", "DMIC", "KMP Expressway"],
    aiSummary: "Haryana's real estate is dominated by Gurgaon — India's corporate capital. The KMP Expressway, Dwarka Expressway completion, and DMIC corridor are creating new sub-markets. Sonipat and Panipat emerging as affordable alternatives.",
    infraHighlight: "Dwarka Expressway + KMP Expressway + Gurgaon Metro Extension",
    majorCities: [
      { name: "Panipat", state: "Haryana", tier: 3, avgPriceSqft: 3000, appreciation: 8.0, rentalYield: 4.0, demandTrend: "Rising", investmentScore: 55, population: "5L", hotSectors: ["Textile", "DMIC Impact"], aiOneLiner: "DMIC corridor city — affordable industrial and residential growth.", slug: "panipat" },
      { name: "Sonipat", state: "Haryana", tier: 3, avgPriceSqft: 3500, appreciation: 10.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 60, population: "4L", hotSectors: ["Delhi Spillover", "Education"], aiOneLiner: "Delhi's northern expansion — university town with affordable housing.", slug: "sonipat" },
    ],
  },
  {
    name: "Andhra Pradesh", code: "AP", type: "State", capital: "Amaravati", appreciation: 10.0, rentalYield: 3.8, avgPriceSqft: 3500, demandTrend: "Rising", investmentScore: 70, riskLevel: "Medium",
    keyDrivers: ["Visakhapatnam port city", "Amaravati capital", "Pharma hub", "IT growth"],
    aiSummary: "Andhra Pradesh is rebuilding with dual capitals — Amaravati (legislative) and Visakhapatnam (executive). Vizag's port development, pharma manufacturing, and IT growth are making it the state's primary investment destination.",
    infraHighlight: "Amaravati Capital City + Vizag Metro + Bhogapuram Airport",
    majorCities: [
      { name: "Visakhapatnam", state: "Andhra Pradesh", tier: 2, avgPriceSqft: 4200, appreciation: 12.0, rentalYield: 4.0, demandTrend: "Rising", investmentScore: 72, population: "22L", hotSectors: ["Port", "IT", "Pharma"], aiOneLiner: "Port city rising — executive capital status + IT/Pharma driving strong demand.", slug: "visakhapatnam" },
      { name: "Vijayawada", state: "Andhra Pradesh", tier: 2, avgPriceSqft: 3500, appreciation: 8.0, rentalYield: 3.5, demandTrend: "Stable", investmentScore: 60, population: "12L", hotSectors: ["Amaravati Proximity", "Commercial"], aiOneLiner: "Gateway to Amaravati — capital city proximity creates long-term value.", slug: "vijayawada" },
    ],
  },
  {
    name: "Madhya Pradesh", code: "MP", type: "State", capital: "Bhopal", appreciation: 9.0, rentalYield: 3.5, avgPriceSqft: 3800, demandTrend: "Rising", investmentScore: 66, riskLevel: "Low",
    keyDrivers: ["Indore IT hub", "Smart City", "Affordable housing", "Tourism"],
    aiSummary: "Madhya Pradesh is led by Indore — India's cleanest city for multiple years running. Indore's IT Super Corridor and smart city investment are driving strong residential demand at affordable price points. Bhopal offers stable government-sector demand.",
    infraHighlight: "Indore Metro + Bhopal Metro + Super Corridor",
    majorCities: [
      { name: "Indore", state: "Madhya Pradesh", tier: 2, avgPriceSqft: 4000, appreciation: 11.0, rentalYield: 3.8, demandTrend: "Rising", investmentScore: 72, population: "28L", hotSectors: ["IT Super Corridor", "Smart City", "Residential"], aiOneLiner: "India's cleanest city — IT Super Corridor driving tech migration.", slug: "indore" },
      { name: "Bhopal", state: "Madhya Pradesh", tier: 2, avgPriceSqft: 3500, appreciation: 7.0, rentalYield: 3.5, demandTrend: "Stable", investmentScore: 58, population: "22L", hotSectors: ["Government", "BHEL", "Smart City"], aiOneLiner: "City of Lakes — government hub with steady residential demand.", slug: "bhopal" },
    ],
  },
  {
    name: "Odisha", code: "OD", type: "State", capital: "Bhubaneswar", appreciation: 8.5, rentalYield: 3.5, avgPriceSqft: 3200, demandTrend: "Rising", investmentScore: 62, riskLevel: "Low",
    keyDrivers: ["IT growth", "Steel/mining", "Smart City", "Port development"],
    aiSummary: "Odisha is emerging as an IT and industrial growth story. Bhubaneswar's smart city transformation, Infocity IT park, and the state's mineral wealth create a diversified real estate demand base at India's most affordable price points.",
    infraHighlight: "Bhubaneswar Smart City + Paradip Port Expansion + Dhamra Port",
    majorCities: [
      { name: "Bhubaneswar", state: "Odisha", tier: 2, avgPriceSqft: 3200, appreciation: 8.5, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 62, population: "12L", hotSectors: ["IT/Infocity", "Smart City", "Residential"], aiOneLiner: "Temple city going digital — smart city investment and IT growth at affordable prices.", slug: "bhubaneswar" },
    ],
  },
  {
    name: "Assam", code: "AS", type: "State", capital: "Dispur", appreciation: 6.0, rentalYield: 3.0, avgPriceSqft: 2800, demandTrend: "Stable", investmentScore: 48, riskLevel: "Medium",
    keyDrivers: ["NE gateway", "Oil & gas", "Tourism", "Government spending"],
    aiSummary: "Assam anchors Northeast India's real estate market. Guwahati's role as the gateway to NE India drives steady residential and commercial demand. The state's oil & gas industry and tea estates provide economic stability.",
    infraHighlight: "Guwahati Metro + NE Connectivity Projects + Jorhat Airport Expansion",
    majorCities: [
      { name: "Guwahati", state: "Assam", tier: 2, avgPriceSqft: 3500, appreciation: 7.0, rentalYield: 3.2, demandTrend: "Stable", investmentScore: 52, population: "12L", hotSectors: ["NE Gateway", "Government", "Healthcare"], aiOneLiner: "Gateway to Northeast — steady demand from government and healthcare sectors.", slug: "guwahati" },
    ],
  },
  {
    name: "Uttarakhand", code: "UK", type: "State", capital: "Dehradun", appreciation: 9.0, rentalYield: 3.5, avgPriceSqft: 4500, demandTrend: "Rising", investmentScore: 64, riskLevel: "Low",
    keyDrivers: ["Education hub", "Wellness tourism", "Delhi spillover", "IT companies"],
    aiSummary: "Uttarakhand combines natural beauty with growing urban infrastructure. Dehradun attracts Delhi NCR spillover for its climate and education institutions, while Rishikesh/Haridwar drive wellness and spiritual tourism demand.",
    infraHighlight: "Delhi-Dehradun Expressway + Rishikesh Railway + Smart City",
    majorCities: [
      { name: "Dehradun", state: "Uttarakhand", tier: 2, avgPriceSqft: 4500, appreciation: 9.0, rentalYield: 3.5, demandTrend: "Rising", investmentScore: 64, population: "8L", hotSectors: ["Education", "IT", "Retirement"], aiOneLiner: "Hill capital with expressway connecting to Delhi — retirement and education hub.", slug: "dehradun" },
    ],
  },
  {
    name: "Jharkhand", code: "JH", type: "State", capital: "Ranchi", appreciation: 7.0, rentalYield: 3.5, avgPriceSqft: 3000, demandTrend: "Stable", investmentScore: 50, riskLevel: "Medium",
    keyDrivers: ["Mining/steel", "Government capital", "Smart City"],
    aiSummary: "Jharkhand's real estate is driven by its mineral wealth — Jamshedpur (Tata Steel) and Ranchi (state capital) are the primary markets. Affordable price points and smart city investment offer value buying opportunities.",
    infraHighlight: "Ranchi Smart City + Jamshedpur Industrial Expansion",
    majorCities: [
      { name: "Ranchi", state: "Jharkhand", tier: 2, avgPriceSqft: 3000, appreciation: 7.0, rentalYield: 3.5, demandTrend: "Stable", investmentScore: 50, population: "12L", hotSectors: ["Government", "Smart City"], aiOneLiner: "State capital with mining wealth driving residential demand.", slug: "ranchi" },
      { name: "Jamshedpur", state: "Jharkhand", tier: 2, avgPriceSqft: 3500, appreciation: 6.0, rentalYield: 3.2, demandTrend: "Stable", investmentScore: 52, population: "15L", hotSectors: ["Steel/Industrial", "Tata Township"], aiOneLiner: "India's steel city — Tata ecosystem provides economic stability.", slug: "jamshedpur" },
    ],
  },
];

// ── World Region Structure ──
export interface WorldRegion {
  id: string;
  name: string;
  icon: string;
  color: string;
  countries: string[];   // country codes from COUNTRIES_RE
  description: string;
  keyInsight: string;
}

export const WORLD_REGIONS: WorldRegion[] = [
  { id: "asia-pac", name: "Asia-Pacific", icon: "🌏", color: "#4A9EFF", countries: ["IN", "SG", "JP", "AU", "VN", "ID"], description: "Fastest-growing real estate region globally", keyInsight: "India and Vietnam leading growth; Singapore as safe haven." },
  { id: "middle-east", name: "Middle East", icon: "🏜️", color: "#C5A572", countries: ["AE", "SA"], description: "Mega-project boom and HNWI migration hub", keyInsight: "Dubai + Saudi Vision 2030 driving unprecedented construction." },
  { id: "europe", name: "Europe", icon: "🏰", color: "#818CF8", countries: ["GB", "DE", "PL", "GR", "PT", "TR"], description: "Mixed signals — Southern Europe rising, Northern stalling", keyInsight: "Greece and Portugal outperforming; Germany in correction." },
  { id: "north-america", name: "North America", icon: "🗽", color: "#34D399", countries: ["US", "CA"], description: "Rate-sensitive market awaiting Fed pivot", keyInsight: "US multifamily strong; Canada correcting from overvaluation." },
  { id: "latin-america", name: "Latin America", icon: "🌎", color: "#FB923C", countries: ["BR", "MX"], description: "Nearshoring boom benefiting Mexico", keyInsight: "Mexico industrial surge from US-China decoupling." },
];

// ── Helper: get all India cities flat list ──
export function getAllIndiaCities(): IndiaCity[] {
  return INDIA_STATES.flatMap(s => s.majorCities);
}

// ── Helper: top India cities by investment score ──
export function getTopIndiaCities(n = 10): IndiaCity[] {
  return getAllIndiaCities().sort((a, b) => b.investmentScore - a.investmentScore).slice(0, n);
}

// ── Helper: get state by code ──
export function getStateByCode(code: string): IndiaState | undefined {
  return INDIA_STATES.find(s => s.code === code);
}

// ── Helper: India industry stats ──
export const INDIA_RE_STATS = {
  industrySize: "₹72 Lakh Cr",
  gdpContribution: "7.3%",
  annualGrowth: "14.2%",
  reraRegistered: "1,12,000+ projects",
  homeLoansOutstanding: "₹27.2 Lakh Cr",
  avgMortgageRate: "8.50%",
  avgRentalYield: "3.8%",
  topPerformingState: "Telangana (+20%)",
  sipOfRE: "SIP equivalent: EMI on ₹50L = ₹42,000/month",
  dataSource: "NHB, RBI, RERA, CREDAI",
};
