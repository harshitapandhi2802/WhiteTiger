// /src/lib/commodities.ts

export interface CommodityEntry {
  name: string;
  slug: string;
  symbol: string;
  category: "Energy" | "Precious Metals" | "Base Metals" | "Agriculture" | "Softs" | "Livestock";
  unit: string;
  exchange: string;
  description: string;
}

export const COMMODITY_CATEGORIES = [
  "All", "Energy", "Precious Metals", "Base Metals", "Agriculture", "Softs", "Livestock"
] as const;

export const COMMODITIES: CommodityEntry[] = [
  // ── Energy ──
  { name: "Crude Oil (WTI)", slug: "crude-oil", symbol: "CL", category: "Energy", unit: "$/bbl", exchange: "NYMEX", description: "West Texas Intermediate crude oil benchmark" },
  { name: "Brent Crude", slug: "brent-crude", symbol: "BZ", category: "Energy", unit: "$/bbl", exchange: "ICE", description: "Global crude oil benchmark" },
  { name: "Natural Gas", slug: "natural-gas", symbol: "NG", category: "Energy", unit: "$/MMBtu", exchange: "NYMEX", description: "Henry Hub natural gas futures" },
  { name: "Heating Oil", slug: "heating-oil", symbol: "HO", category: "Energy", unit: "$/gal", exchange: "NYMEX", description: "Refined petroleum product" },
  { name: "Gasoline (RBOB)", slug: "gasoline", symbol: "RB", category: "Energy", unit: "$/gal", exchange: "NYMEX", description: "Reformulated blendstock for oxygenate blending" },
  { name: "Coal", slug: "coal", symbol: "MTF", category: "Energy", unit: "$/ton", exchange: "ICE", description: "Thermal coal benchmark" },
  { name: "Uranium", slug: "uranium", symbol: "UX", category: "Energy", unit: "$/lb", exchange: "CME", description: "Nuclear fuel commodity" },
  { name: "Ethanol", slug: "ethanol", symbol: "EH", category: "Energy", unit: "$/gal", exchange: "CBOT", description: "Biofuel commodity" },

  // ── Precious Metals ──
  { name: "Gold", slug: "gold", symbol: "GC", category: "Precious Metals", unit: "$/oz", exchange: "COMEX", description: "Safe haven and inflation hedge" },
  { name: "Silver", slug: "silver", symbol: "SI", category: "Precious Metals", unit: "$/oz", exchange: "COMEX", description: "Industrial and precious metal" },
  { name: "Platinum", slug: "platinum", symbol: "PL", category: "Precious Metals", unit: "$/oz", exchange: "NYMEX", description: "Auto catalyst and investment metal" },
  { name: "Palladium", slug: "palladium", symbol: "PA", category: "Precious Metals", unit: "$/oz", exchange: "NYMEX", description: "Key catalyst metal for vehicles" },
  { name: "Rhodium", slug: "rhodium", symbol: "RH", category: "Precious Metals", unit: "$/oz", exchange: "OTC", description: "Rarest precious metal" },

  // ── Base Metals ──
  { name: "Copper", slug: "copper", symbol: "HG", category: "Base Metals", unit: "$/lb", exchange: "COMEX", description: "Industrial bellwether — Dr. Copper" },
  { name: "Aluminium", slug: "aluminium", symbol: "AL", category: "Base Metals", unit: "$/ton", exchange: "LME", description: "Most traded base metal by volume" },
  { name: "Zinc", slug: "zinc", symbol: "ZN", category: "Base Metals", unit: "$/ton", exchange: "LME", description: "Galvanizing and alloy metal" },
  { name: "Nickel", slug: "nickel", symbol: "NI", category: "Base Metals", unit: "$/ton", exchange: "LME", description: "Stainless steel and EV battery key input" },
  { name: "Tin", slug: "tin", symbol: "SN", category: "Base Metals", unit: "$/ton", exchange: "LME", description: "Electronics solder and plating" },
  { name: "Lead", slug: "lead", symbol: "PB", category: "Base Metals", unit: "$/ton", exchange: "LME", description: "Battery and industrial metal" },
  { name: "Iron Ore", slug: "iron-ore", symbol: "FE", category: "Base Metals", unit: "$/ton", exchange: "SGX", description: "Steelmaking raw material" },
  { name: "Lithium", slug: "lithium", symbol: "LI", category: "Base Metals", unit: "$/ton", exchange: "OTC", description: "EV battery critical mineral" },
  { name: "Cobalt", slug: "cobalt", symbol: "CO", category: "Base Metals", unit: "$/ton", exchange: "LME", description: "Battery cathode essential metal" },
  { name: "Rare Earths", slug: "rare-earths", symbol: "REE", category: "Base Metals", unit: "$/kg", exchange: "OTC", description: "Critical for electronics and defense" },

  // ── Agriculture ──
  { name: "Wheat", slug: "wheat", symbol: "ZW", category: "Agriculture", unit: "cents/bu", exchange: "CBOT", description: "Global staple grain" },
  { name: "Corn", slug: "corn", symbol: "ZC", category: "Agriculture", unit: "cents/bu", exchange: "CBOT", description: "Feed grain and ethanol feedstock" },
  { name: "Soybeans", slug: "soybeans", symbol: "ZS", category: "Agriculture", unit: "cents/bu", exchange: "CBOT", description: "Oilseed for food and feed" },
  { name: "Rice", slug: "rice", symbol: "ZR", category: "Agriculture", unit: "$/cwt", exchange: "CBOT", description: "Staple food for half the world" },
  { name: "Palm Oil", slug: "palm-oil", symbol: "FCPO", category: "Agriculture", unit: "MYR/ton", exchange: "BMD", description: "Most consumed vegetable oil globally" },
  { name: "Soybean Oil", slug: "soybean-oil", symbol: "ZL", category: "Agriculture", unit: "cents/lb", exchange: "CBOT", description: "Edible oil and biodiesel feedstock" },
  { name: "Canola", slug: "canola", symbol: "RS", category: "Agriculture", unit: "CAD/ton", exchange: "ICE", description: "Rapeseed oil crop" },
  { name: "Oats", slug: "oats", symbol: "ZO", category: "Agriculture", unit: "cents/bu", exchange: "CBOT", description: "Feed and food grain" },

  // ── Softs ──
  { name: "Coffee (Arabica)", slug: "coffee", symbol: "KC", category: "Softs", unit: "cents/lb", exchange: "ICE", description: "Premium coffee variety" },
  { name: "Cocoa", slug: "cocoa", symbol: "CC", category: "Softs", unit: "$/ton", exchange: "ICE", description: "Chocolate raw material" },
  { name: "Sugar #11", slug: "sugar", symbol: "SB", category: "Softs", unit: "cents/lb", exchange: "ICE", description: "Raw sugar world benchmark" },
  { name: "Cotton", slug: "cotton", symbol: "CT", category: "Softs", unit: "cents/lb", exchange: "ICE", description: "Textile fiber commodity" },
  { name: "Orange Juice", slug: "orange-juice", symbol: "OJ", category: "Softs", unit: "cents/lb", exchange: "ICE", description: "Frozen concentrated OJ" },
  { name: "Rubber", slug: "rubber", symbol: "RU", category: "Softs", unit: "JPY/kg", exchange: "TOCOM", description: "Tire and industrial input" },
  { name: "Lumber", slug: "lumber", symbol: "LBS", category: "Softs", unit: "$/mbf", exchange: "CME", description: "Construction material" },

  // ── Livestock ──
  { name: "Live Cattle", slug: "live-cattle", symbol: "LE", category: "Livestock", unit: "cents/lb", exchange: "CME", description: "Beef market benchmark" },
  { name: "Lean Hogs", slug: "lean-hogs", symbol: "HE", category: "Livestock", unit: "cents/lb", exchange: "CME", description: "Pork futures benchmark" },
  { name: "Feeder Cattle", slug: "feeder-cattle", symbol: "GF", category: "Livestock", unit: "cents/lb", exchange: "CME", description: "Young cattle for feedlots" },
];

export function getCommodityBySlug(slug: string): CommodityEntry | undefined {
  return COMMODITIES.find(c => c.slug === slug);
}

export function getCommoditiesByCategory(category: string): CommodityEntry[] {
  if (category === "All") return COMMODITIES;
  return COMMODITIES.filter(c => c.category === category);
}

// Backward compatibility aliases for analyze/page.tsx
export const MCX_COMMODITIES = COMMODITIES;

/* ═══════════════════════════════════════════
   MCX CONTRACT REGISTRY — India's Multi Commodity Exchange
   Every tradeable contract with full identification
   ═══════════════════════════════════════════ */

export interface MCXContract {
  commodity: string;
  exchange: "MCX";
  symbol: string;           // MCX contract symbol
  slug: string;
  category: "Energy" | "Bullion" | "Base Metals" | "Agri";
  lotSize: string;
  unit: string;
  currency: "INR";
  tickSize: number;
  contractMultiplier: number;
  settlementType: "Cash" | "Delivery";
  tradingHours: string;
  /** TradingView ticker for live price */
  tvTicker: string;
  /** Yahoo Finance ticker (if available) */
  yahooTicker?: string;
  /** Reference global ticker for fair-value calc */
  globalRef?: string;
  /** Whether FX conversion applies */
  fxSensitive: boolean;
}

export const MCX_CONTRACTS: MCXContract[] = [
  // ── Energy ──
  { commodity: "Crude Oil", exchange: "MCX", symbol: "CRUDEOIL", slug: "crude-oil-mcx", category: "Energy", lotSize: "100 barrels", unit: "₹/bbl", currency: "INR", tickSize: 1, contractMultiplier: 100, settlementType: "Cash", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:CRUDEOIL1!", globalRef: "NYMEX:CL1!", fxSensitive: true },
  { commodity: "Natural Gas", exchange: "MCX", symbol: "NATURALGAS", slug: "natural-gas-mcx", category: "Energy", lotSize: "1250 MMBtu", unit: "₹/MMBtu", currency: "INR", tickSize: 0.1, contractMultiplier: 1250, settlementType: "Cash", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:NATURALGAS1!", globalRef: "NYMEX:NG1!", fxSensitive: true },

  // ── Bullion ──
  { commodity: "Gold", exchange: "MCX", symbol: "GOLD", slug: "gold-mcx", category: "Bullion", lotSize: "100 grams", unit: "₹/10g", currency: "INR", tickSize: 1, contractMultiplier: 100, settlementType: "Delivery", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:GOLD1!", globalRef: "COMEX:GC1!", fxSensitive: true },
  { commodity: "Gold Mini", exchange: "MCX", symbol: "GOLDM", slug: "gold-mini-mcx", category: "Bullion", lotSize: "10 grams", unit: "₹/10g", currency: "INR", tickSize: 1, contractMultiplier: 10, settlementType: "Delivery", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:GOLDM1!", globalRef: "COMEX:GC1!", fxSensitive: true },
  { commodity: "Gold Guinea", exchange: "MCX", symbol: "GOLDGUINEA", slug: "gold-guinea-mcx", category: "Bullion", lotSize: "8 grams", unit: "₹/gram", currency: "INR", tickSize: 1, contractMultiplier: 8, settlementType: "Delivery", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:GOLDGUINEA1!", globalRef: "COMEX:GC1!", fxSensitive: true },
  { commodity: "Gold Petal", exchange: "MCX", symbol: "GOLDPETAL", slug: "gold-petal-mcx", category: "Bullion", lotSize: "1 gram", unit: "₹/gram", currency: "INR", tickSize: 1, contractMultiplier: 1, settlementType: "Delivery", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:GOLDPETAL1!", globalRef: "COMEX:GC1!", fxSensitive: true },
  { commodity: "Silver", exchange: "MCX", symbol: "SILVER", slug: "silver-mcx", category: "Bullion", lotSize: "30 kg", unit: "₹/kg", currency: "INR", tickSize: 1, contractMultiplier: 30, settlementType: "Delivery", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:SILVER1!", globalRef: "COMEX:SI1!", fxSensitive: true },
  { commodity: "Silver Mini", exchange: "MCX", symbol: "SILVERM", slug: "silver-mini-mcx", category: "Bullion", lotSize: "5 kg", unit: "₹/kg", currency: "INR", tickSize: 1, contractMultiplier: 5, settlementType: "Delivery", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:SILVERM1!", globalRef: "COMEX:SI1!", fxSensitive: true },
  { commodity: "Silver Micro", exchange: "MCX", symbol: "SILVERMIC", slug: "silver-micro-mcx", category: "Bullion", lotSize: "1 kg", unit: "₹/kg", currency: "INR", tickSize: 1, contractMultiplier: 1, settlementType: "Delivery", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:SILVERMIC1!", globalRef: "COMEX:SI1!", fxSensitive: true },

  // ── Base Metals ──
  { commodity: "Copper", exchange: "MCX", symbol: "COPPER", slug: "copper-mcx", category: "Base Metals", lotSize: "2500 kg", unit: "₹/kg", currency: "INR", tickSize: 0.05, contractMultiplier: 2500, settlementType: "Delivery", tradingHours: "09:00–23:30 IST", tvTicker: "MCX:COPPER1!", globalRef: "COMEX:HG1!", fxSensitive: true },
  { commodity: "Zinc", exchange: "MCX", symbol: "ZINC", slug: "zinc-mcx", category: "Base Metals", lotSize: "5000 kg", unit: "₹/kg", currency: "INR", tickSize: 0.05, contractMultiplier: 5000, settlementType: "Delivery", tradingHours: "09:00–23:00 IST", tvTicker: "MCX:ZINC1!", globalRef: "LME:ZINC", fxSensitive: true },
  { commodity: "Aluminium", exchange: "MCX", symbol: "ALUMINIUM", slug: "aluminium-mcx", category: "Base Metals", lotSize: "5000 kg", unit: "₹/kg", currency: "INR", tickSize: 0.05, contractMultiplier: 5000, settlementType: "Delivery", tradingHours: "09:00–23:00 IST", tvTicker: "MCX:ALUMINIUM1!", globalRef: "LME:ALUMINIUM", fxSensitive: true },
  { commodity: "Lead", exchange: "MCX", symbol: "LEAD", slug: "lead-mcx", category: "Base Metals", lotSize: "5000 kg", unit: "₹/kg", currency: "INR", tickSize: 0.05, contractMultiplier: 5000, settlementType: "Delivery", tradingHours: "09:00–23:00 IST", tvTicker: "MCX:LEAD1!", globalRef: "LME:LEAD", fxSensitive: true },
  { commodity: "Nickel", exchange: "MCX", symbol: "NICKEL", slug: "nickel-mcx", category: "Base Metals", lotSize: "1500 kg", unit: "₹/kg", currency: "INR", tickSize: 0.1, contractMultiplier: 1500, settlementType: "Delivery", tradingHours: "09:00–23:00 IST", tvTicker: "MCX:NICKEL1!", globalRef: "LME:NICKEL", fxSensitive: true },

  // ── Agri (when active) ──
  { commodity: "Cotton", exchange: "MCX", symbol: "COTTON", slug: "cotton-mcx", category: "Agri", lotSize: "25 bales", unit: "₹/bale", currency: "INR", tickSize: 10, contractMultiplier: 25, settlementType: "Delivery", tradingHours: "09:00–21:30 IST", tvTicker: "MCX:COTTON1!", fxSensitive: false },
  { commodity: "Kapas", exchange: "MCX", symbol: "KAPAS", slug: "kapas-mcx", category: "Agri", lotSize: "200 kg (4 maunds)", unit: "₹/20kg", currency: "INR", tickSize: 0.1, contractMultiplier: 200, settlementType: "Delivery", tradingHours: "09:00–21:30 IST", tvTicker: "MCX:KAPAS1!", fxSensitive: false },
];

export function getMCXContract(symbol: string): MCXContract | undefined {
  return MCX_CONTRACTS.find(c => c.symbol === symbol.toUpperCase());
}

export function getMCXBySlug(slug: string): MCXContract | undefined {
  return MCX_CONTRACTS.find(c => c.slug === slug);
}

export function getMCXByCategory(category: string): MCXContract[] {
  return MCX_CONTRACTS.filter(c => c.category === category);
}

export function searchCommodities(query: string, limit = 12): CommodityEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return COMMODITIES.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.symbol.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q)
  ).slice(0, limit);
}

/* ═══════════════════════════════════════════
   GLOBAL COMMODITY POWER MAP DATA
   ═══════════════════════════════════════════ */

export interface GlobalPlayer {
  name: string;
  country: string;
  type: "producer" | "trader" | "miner" | "refiner" | "state";
  commodities: string[];
  marketShare: string;
  revenue: string;
  description: string;
  whyMatters: string;
}

export const GLOBAL_PLAYERS: GlobalPlayer[] = [
  { name: "Saudi Aramco", country: "Saudi Arabia", type: "state", commodities: ["crude-oil", "brent-crude", "natural-gas"], marketShare: "12% of global oil", revenue: "$535B", description: "World's largest oil company by production and reserves", whyMatters: "When Aramco decides to produce more or less oil, it directly affects global fuel prices. Since Saudi Arabia leads OPEC, their production decisions can raise or lower gasoline prices worldwide." },
  { name: "ExxonMobil", country: "USA", type: "producer", commodities: ["crude-oil", "brent-crude", "natural-gas"], marketShare: "3% of global oil", revenue: "$344B", description: "Largest publicly traded oil company by market cap", whyMatters: "ExxonMobil's investment decisions signal where the energy industry is headed. When they invest billions in new oil fields, it means they expect oil demand to stay strong for decades." },
  { name: "Shell", country: "Netherlands", type: "producer", commodities: ["crude-oil", "natural-gas", "brent-crude"], marketShare: "2.5% of global oil", revenue: "$316B", description: "Global energy and petrochemical giant", whyMatters: "Shell is the world's largest LNG trader. Their shipping and trading decisions affect natural gas prices across Europe and Asia." },
  { name: "Glencore", country: "Switzerland", type: "trader", commodities: ["copper", "cobalt", "zinc", "nickel", "coal", "crude-oil"], marketShare: "50% of global zinc trade", revenue: "$217B", description: "World's largest commodity trading house", whyMatters: "Glencore controls massive shares of global metals trading. When they stockpile or release copper and zinc, it moves prices for the entire construction and manufacturing industry." },
  { name: "BHP Group", country: "Australia", type: "miner", commodities: ["iron-ore", "copper", "nickel", "coal"], marketShare: "28% of seaborne iron ore", revenue: "$53B", description: "World's largest mining company by market cap", whyMatters: "BHP's iron ore shipments to China directly determine steel prices globally. When their mines face disruptions, steel costs rise, making everything from cars to buildings more expensive." },
  { name: "Rio Tinto", country: "Australia", type: "miner", commodities: ["iron-ore", "aluminium", "copper", "lithium"], marketShare: "18% of seaborne iron ore", revenue: "$54B", description: "Second-largest metals and mining corporation", whyMatters: "Rio Tinto's aluminium smelters and iron ore mines are critical for the global supply chain. Their operations influence the cost of aircraft, beverage cans, and construction materials." },
  { name: "Vale", country: "Brazil", type: "miner", commodities: ["iron-ore", "nickel", "copper", "cobalt"], marketShare: "22% of seaborne iron ore", revenue: "$42B", description: "World's largest iron ore producer by volume", whyMatters: "Vale ships massive iron ore volumes from Brazil to China. Any disruption at their mines (like the 2019 dam disaster) can spike steel prices globally within days." },
  { name: "Gazprom", country: "Russia", type: "state", commodities: ["natural-gas", "crude-oil"], marketShare: "12% of global gas", revenue: "$118B", description: "Russia's state gas giant with world's largest reserves", whyMatters: "Gazprom controls Europe's gas pipelines. When Russia reduces gas flow, European energy prices surge, increasing heating costs and factory energy bills across the continent." },
  { name: "Codelco", country: "Chile", type: "state", commodities: ["copper"], marketShare: "8% of global copper", revenue: "$16B", description: "World's largest copper producer (state-owned)", whyMatters: "Copper is essential for electric vehicles, power grids, and electronics. Codelco's production levels directly affect the cost of the global green energy transition." },
  { name: "Freeport-McMoRan", country: "USA", type: "miner", commodities: ["copper", "gold"], marketShare: "5% of global copper", revenue: "$22B", description: "Operates world's largest gold and copper mine (Grasberg)", whyMatters: "Freeport's Grasberg mine in Indonesia is the world's largest gold and copper deposit. Any operational issues there ripple through electronics and construction supply chains." },
  { name: "Newmont", country: "USA", type: "miner", commodities: ["gold", "silver", "copper"], marketShare: "6% of global gold", revenue: "$18B", description: "World's largest gold mining company", whyMatters: "As the top gold miner, Newmont's production costs set a floor for gold prices. When mining costs rise, gold prices typically follow, affecting jewelry markets and central bank reserves." },
  { name: "Archer Daniels Midland", country: "USA", type: "trader", commodities: ["soybeans", "corn", "wheat", "palm-oil", "soybean-oil"], marketShare: "15% of global grain trade", revenue: "$93B", description: "One of the 'ABCD' grain trading giants", whyMatters: "ADM helps feed the world by moving grain from American farms to global markets. Their trading decisions influence bread prices in Egypt and cooking oil prices in India." },
  { name: "Cargill", country: "USA", type: "trader", commodities: ["soybeans", "corn", "wheat", "palm-oil", "live-cattle", "cocoa", "sugar", "cotton"], marketShare: "20% of global grain trade", revenue: "$177B", description: "World's largest private commodity trader", whyMatters: "Cargill touches nearly every food commodity on Earth. They influence what farmers plant, how food is processed, and ultimately what you pay at the grocery store." },
  { name: "Barrick Gold", country: "Canada", type: "miner", commodities: ["gold", "copper"], marketShare: "4% of global gold", revenue: "$11B", description: "Second-largest gold mining company globally", whyMatters: "Barrick's mines across Africa, Americas, and Middle East make them a key indicator of gold supply health. Their production guidance moves gold futures markets." },
  { name: "Norilsk Nickel", country: "Russia", type: "miner", commodities: ["nickel", "palladium", "platinum", "copper"], marketShare: "6% of global nickel, 40% of palladium", revenue: "$16B", description: "World's largest palladium and high-grade nickel producer", whyMatters: "Norilsk produces 40% of the world's palladium, essential for car exhaust catalysts. Sanctions or supply disruptions there can make new cars significantly more expensive." },
  { name: "Albemarle", country: "USA", type: "miner", commodities: ["lithium"], marketShare: "15% of global lithium", revenue: "$9B", description: "World's largest lithium producer for EV batteries", whyMatters: "Every Tesla, BYD, and electric vehicle needs lithium batteries. Albemarle's production directly determines how fast and how cheaply the world can switch to electric vehicles." },
  { name: "Louis Dreyfus", country: "France", type: "trader", commodities: ["wheat", "corn", "soybeans", "rice", "coffee", "sugar", "cotton"], marketShare: "10% of global grain trade", revenue: "$60B", description: "One of the 'ABCD' agricultural commodity traders", whyMatters: "Louis Dreyfus moves agricultural commodities across continents. Their logistics network determines whether crops from Brazil reach dinner tables in Asia affordably." },
];

export interface Chokepoint {
  name: string;
  location: string;
  commoditiesAffected: string[];
  globalTradeShare: string;
  riskLevel: "low" | "medium" | "high";
  description: string;
  whyMatters: string;
}

export const GLOBAL_CHOKEPOINTS: Chokepoint[] = [
  { name: "Strait of Hormuz", location: "Persian Gulf", commoditiesAffected: ["crude-oil", "brent-crude", "natural-gas"], globalTradeShare: "21% of global oil", riskLevel: "high", description: "Narrow passage between Iran and Oman connecting Persian Gulf to Arabian Sea", whyMatters: "One-fifth of all oil consumed worldwide passes through this narrow strait. If it were blocked even briefly, oil prices would spike dramatically and fuel costs would surge at every gas station globally." },
  { name: "Strait of Malacca", location: "Southeast Asia", commoditiesAffected: ["crude-oil", "brent-crude", "palm-oil", "natural-gas", "iron-ore", "copper"], globalTradeShare: "25% of global trade", riskLevel: "medium", description: "Busiest shipping lane connecting Indian Ocean to Pacific", whyMatters: "This is the main highway for oil tankers heading to China, Japan, and South Korea. Nearly all of East Asia's energy imports flow through this narrow strait between Malaysia and Indonesia." },
  { name: "Suez Canal", location: "Egypt", commoditiesAffected: ["crude-oil", "brent-crude", "natural-gas", "wheat", "iron-ore"], globalTradeShare: "12% of global trade", riskLevel: "high", description: "Man-made canal connecting Mediterranean to Red Sea", whyMatters: "The Suez Canal is the shortcut between Europe and Asia. When it's disrupted (like the 2021 Ever Given blockage), shipping costs skyrocket and delivery times double, raising prices on everything from oil to consumer goods." },
  { name: "Panama Canal", location: "Central America", commoditiesAffected: ["soybeans", "corn", "natural-gas", "crude-oil"], globalTradeShare: "5% of global trade", riskLevel: "medium", description: "Canal connecting Atlantic and Pacific oceans", whyMatters: "US grain exports to Asia flow through Panama. Recent droughts have limited how many ships can pass daily, delaying soybean and corn deliveries and raising food prices in importing countries." },
  { name: "Bab el-Mandeb", location: "Red Sea", commoditiesAffected: ["crude-oil", "brent-crude", "natural-gas", "coffee"], globalTradeShare: "9% of seaborne oil", riskLevel: "high", description: "Strait between Yemen and Djibouti, gateway to Red Sea", whyMatters: "Houthi attacks near this strait have forced ships to take the long route around Africa, adding weeks to delivery times and hundreds of millions in extra fuel costs. This directly increases oil and goods prices." },
  { name: "Turkish Straits", location: "Turkey", commoditiesAffected: ["crude-oil", "wheat", "corn", "soybeans"], globalTradeShare: "3% of global oil", riskLevel: "medium", description: "Bosphorus and Dardanelles connecting Black Sea to Mediterranean", whyMatters: "Russian and Ukrainian grain exports to the world pass through these straits. The Russia-Ukraine conflict showed how blocking grain shipments here can trigger food crises in Africa and the Middle East." },
  { name: "Cape of Good Hope", location: "South Africa", commoditiesAffected: ["crude-oil", "brent-crude", "iron-ore", "coal"], globalTradeShare: "Alternative route", riskLevel: "low", description: "Southern tip of Africa, used when Suez/Red Sea disrupted", whyMatters: "When Red Sea shipping becomes dangerous, vessels reroute around Africa. This adds 10-14 extra days and massive fuel costs, which get passed to consumers through higher prices for everything shipped between Asia and Europe." },
];

export interface CountryPowerProfile {
  country: string;
  flag: string;
  dominantCommodities: { commodity: string; role: string; globalShare: string }[];
  keyCompanies: string[];
  geopoliticalInfluence: string;
  whyMatters: string;
}

export const COUNTRY_PROFILES: CountryPowerProfile[] = [
  { country: "Saudi Arabia", flag: "SA", dominantCommodities: [{ commodity: "Crude Oil", role: "Producer & Exporter", globalShare: "12%" }, { commodity: "Natural Gas", role: "Producer", globalShare: "3%" }], keyCompanies: ["Saudi Aramco", "SABIC"], geopoliticalInfluence: "OPEC leader, swing producer", whyMatters: "Saudi Arabia is like the central bank of oil. When they decide to pump more or less, it affects fuel prices at every gas station worldwide, airline ticket prices, and inflation in every economy." },
  { country: "Russia", flag: "RU", dominantCommodities: [{ commodity: "Natural Gas", role: "Exporter", globalShare: "17%" }, { commodity: "Crude Oil", role: "Producer", globalShare: "11%" }, { commodity: "Palladium", role: "Producer", globalShare: "40%" }, { commodity: "Wheat", role: "Exporter", globalShare: "18%" }], keyCompanies: ["Gazprom", "Rosneft", "Norilsk Nickel"], geopoliticalInfluence: "Energy superpower, sanctions target", whyMatters: "Russia supplies energy to Europe and food to the Middle East. Sanctions on Russia disrupted global energy markets and triggered a food crisis in developing nations that depend on Russian wheat." },
  { country: "China", flag: "CN", dominantCommodities: [{ commodity: "Rare Earths", role: "Producer", globalShare: "60%" }, { commodity: "Aluminium", role: "Producer", globalShare: "57%" }, { commodity: "Steel", role: "Consumer", globalShare: "53%" }], keyCompanies: ["CNPC", "Sinopec", "Chinalco"], geopoliticalInfluence: "World's largest commodity consumer", whyMatters: "China buys more raw materials than any other country. When China's economy slows down, demand for copper, iron ore, and oil drops globally, pulling down prices. When China stimulates its economy, commodity prices surge worldwide." },
  { country: "Australia", flag: "AU", dominantCommodities: [{ commodity: "Iron Ore", role: "Exporter", globalShare: "53%" }, { commodity: "Lithium", role: "Producer", globalShare: "47%" }, { commodity: "Coal", role: "Exporter", globalShare: "29%" }], keyCompanies: ["BHP", "Rio Tinto", "Fortescue"], geopoliticalInfluence: "China's key raw material supplier", whyMatters: "Australia is the world's quarry. Over half the iron ore that makes steel globally comes from Australian mines. If Australia's exports to China are disrupted, steel prices spike, making buildings, cars, and infrastructure more expensive." },
  { country: "USA", flag: "US", dominantCommodities: [{ commodity: "Crude Oil", role: "Producer", globalShare: "15%" }, { commodity: "Natural Gas", role: "Producer", globalShare: "23%" }, { commodity: "Corn", role: "Producer", globalShare: "32%" }, { commodity: "Soybeans", role: "Producer", globalShare: "28%" }], keyCompanies: ["ExxonMobil", "Chevron", "ADM", "Cargill"], geopoliticalInfluence: "Shale revolution changed global energy", whyMatters: "America went from importing oil to being the world's largest producer thanks to shale drilling. US decisions on oil exports, grain sales, and LNG shipping reshape global commodity markets and geopolitical power." },
  { country: "Chile", flag: "CL", dominantCommodities: [{ commodity: "Copper", role: "Producer", globalShare: "27%" }, { commodity: "Lithium", role: "Producer", globalShare: "25%" }], keyCompanies: ["Codelco", "SQM"], geopoliticalInfluence: "Copper and lithium gatekeeper", whyMatters: "Chile produces more copper than any country. Since copper is essential for electric vehicles, power grids, and electronics, Chile's mining output directly affects the pace and cost of the global green energy transition." },
  { country: "Brazil", flag: "BR", dominantCommodities: [{ commodity: "Iron Ore", role: "Exporter", globalShare: "17%" }, { commodity: "Soybeans", role: "Exporter", globalShare: "33%" }, { commodity: "Coffee", role: "Producer", globalShare: "35%" }, { commodity: "Sugar", role: "Producer", globalShare: "22%" }], keyCompanies: ["Vale", "Petrobras", "JBS"], geopoliticalInfluence: "Agricultural and mining superpower", whyMatters: "Brazil feeds the world and supplies its iron. One-third of the soybeans eaten globally come from Brazil. A frost in Brazilian coffee regions can double your morning coffee price within weeks." },
  { country: "India", flag: "IN", dominantCommodities: [{ commodity: "Gold", role: "Consumer", globalShare: "25%" }, { commodity: "Coal", role: "Consumer", globalShare: "12%" }, { commodity: "Rice", role: "Producer & Exporter", globalShare: "40%" }], keyCompanies: ["Coal India", "ONGC", "Tata Steel"], geopoliticalInfluence: "Rising demand center, policy influencer", whyMatters: "India is the world's second-largest gold buyer and a major food exporter. When India bans rice or wheat exports (as it did in 2022-23), food prices spike across Africa, the Middle East, and Southeast Asia." },
];

/* ═══ Impact Flow Chains ═══ */
export interface ImpactChain {
  trigger: string;
  triggerCommodity: string;
  steps: { event: string; emoji: string }[];
  whyMatters: string;
}

export const IMPACT_CHAINS: ImpactChain[] = [
  { trigger: "Oil Prices Rise", triggerCommodity: "crude-oil", steps: [{ event: "Fuel costs increase", emoji: "gas pump" }, { event: "Airlines raise ticket prices", emoji: "airplane" }, { event: "Shipping costs surge", emoji: "ship" }, { event: "Consumer goods become expensive", emoji: "shopping cart" }, { event: "Inflation rises", emoji: "chart increasing" }, { event: "Central bank raises interest rates", emoji: "bank" }, { event: "Stock market volatility increases", emoji: "chart decreasing" }], whyMatters: "Oil is the lifeblood of the global economy. When oil prices rise, it creates a chain reaction that increases the cost of almost everything, from your Uber ride to the food on your plate." },
  { trigger: "Gold Prices Surge", triggerCommodity: "gold", steps: [{ event: "Investors seek safety", emoji: "shield" }, { event: "Jewelry demand softens", emoji: "ring" }, { event: "Gold loan values increase", emoji: "bank" }, { event: "Mining stocks rally", emoji: "chart increasing" }, { event: "Dollar weakens", emoji: "dollar" }, { event: "Other commodities rise", emoji: "chart increasing" }], whyMatters: "Gold rising usually means investors are scared about the economy or inflation. It's a barometer of global fear and uncertainty." },
  { trigger: "Copper Prices Jump", triggerCommodity: "copper", steps: [{ event: "EV battery costs rise", emoji: "battery" }, { event: "Construction costs increase", emoji: "building" }, { event: "Power grid upgrades become expensive", emoji: "zap" }, { event: "Green transition slows", emoji: "leaf" }, { event: "Mining companies profit", emoji: "chart increasing" }, { event: "Manufacturing margins compress", emoji: "factory" }], whyMatters: "Copper is called 'Dr. Copper' because it predicts economic health. Rising copper prices mean the world is building and growing, but also make housing and EVs more expensive." },
  { trigger: "Wheat Prices Spike", triggerCommodity: "wheat", steps: [{ event: "Bread prices increase globally", emoji: "bread" }, { event: "Food inflation rises", emoji: "chart increasing" }, { event: "Developing nations face crisis", emoji: "world" }, { event: "Social unrest risk grows", emoji: "warning" }, { event: "Government subsidies increase", emoji: "bank" }, { event: "Fiscal deficits widen", emoji: "chart decreasing" }], whyMatters: "Wheat is the most political commodity. Rising wheat prices have historically triggered revolutions and social upheaval in countries where bread is a staple food." },
  { trigger: "Natural Gas Surges", triggerCommodity: "natural-gas", steps: [{ event: "Electricity bills rise", emoji: "zap" }, { event: "Fertilizer costs surge", emoji: "chemistry" }, { event: "Food production costs increase", emoji: "tractor" }, { event: "Factory energy bills spike", emoji: "factory" }, { event: "Manufacturing moves to cheaper regions", emoji: "truck" }, { event: "European competitiveness falls", emoji: "chart decreasing" }], whyMatters: "Natural gas powers electricity and makes fertilizers. When gas prices spike, it's not just your heating bill that goes up, it's the cost of growing food and running every factory." },
  { trigger: "Lithium Prices Collapse", triggerCommodity: "lithium", steps: [{ event: "EV battery costs drop", emoji: "battery" }, { event: "Electric vehicles become cheaper", emoji: "car" }, { event: "EV adoption accelerates", emoji: "chart increasing" }, { event: "Oil demand outlook weakens", emoji: "oil" }, { event: "Mining companies cut production", emoji: "mining" }, { event: "Future supply tightens", emoji: "warning" }], whyMatters: "Lithium price swings directly determine when electric vehicles become affordable for average consumers. Cheap lithium accelerates the end of the gasoline era." },
];

/* ═══ Story Templates ═══ */
export interface StoryTemplate {
  category: string;
  templates: string[];
}

export const STORY_TEMPLATES: StoryTemplate[] = [
  { category: "Geopolitical", templates: [
    "Tensions in the Middle East are pushing oil prices higher as traders worry about potential supply disruptions. When conflict threatens major oil-producing regions, energy costs rise globally, affecting everything from gasoline to plastics.",
    "Trade tensions between the US and China are creating uncertainty for industrial metals. Tariffs on copper and aluminium imports could raise manufacturing costs and slow factory output in both countries.",
    "Sanctions on Russian energy exports continue to reshape global trade routes. European countries are scrambling for alternative natural gas supplies, driving up LNG prices across Asia.",
    "Political instability in major mining regions of Africa is threatening cobalt and copper supply. These metals are critical for smartphone batteries and electric vehicles.",
  ]},
  { category: "Macro", templates: [
    "Central banks worldwide are raising interest rates to fight inflation, which typically strengthens the US Dollar and puts pressure on commodity prices. When borrowing becomes expensive, construction slows and demand for metals drops.",
    "China's economic recovery is the single biggest factor for global commodity demand right now. As the world's largest consumer of copper, iron ore, and soybeans, even a small pickup in Chinese activity boosts prices worldwide.",
    "Global manufacturing data shows factory activity expanding for the third month. This is positive for industrial metals like copper and aluminium, which are used heavily in manufacturing.",
    "The US Federal Reserve signaled it may cut interest rates later this year. Lower rates typically weaken the Dollar, making commodities cheaper for international buyers and supporting prices.",
  ]},
  { category: "Supply Chain", templates: [
    "Red Sea shipping disruptions are forcing container ships to take the longer route around Africa, adding 10-14 days to delivery times. Freight costs have tripled, which will eventually show up as higher prices at stores.",
    "A severe drought in the Panama Canal region is limiting the number of ships that can pass through daily. This bottleneck is delaying grain shipments from the US to Asia and natural gas to Europe.",
    "Australian port workers are threatening to strike, which could halt iron ore shipments to China. Australia supplies over half of China's iron ore needs, so any disruption would spike steel prices.",
    "Record-breaking heat waves in South America are threatening coffee and soybean crops. Climate change is making agricultural commodity prices more volatile and unpredictable.",
  ]},
  { category: "Inflation", templates: [
    "Food prices are rising globally as agricultural commodities like wheat, corn, and palm oil all trade above their 5-year averages. This is hitting household budgets hardest in developing nations where food makes up a larger share of spending.",
    "Energy costs remain the biggest driver of global inflation. With crude oil above $80/barrel and natural gas prices elevated, central banks are finding it hard to bring inflation back to target.",
    "Gold is reaching record highs as investors seek protection against persistent inflation. Central banks are also buying gold at the fastest pace in decades, reducing their reliance on the US Dollar.",
    "Rising commodity prices are squeezing corporate profit margins. Companies from airlines to food producers are struggling to pass higher raw material costs to consumers without losing market share.",
  ]},
];
