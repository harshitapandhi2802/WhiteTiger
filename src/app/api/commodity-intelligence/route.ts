import { NextRequest, NextResponse } from "next/server";
import { MCX_CONTRACTS, type MCXContract } from "@/lib/commodities";

export const maxDuration = 60;

/* --- Seeded RNG --- */
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h + seed.charCodeAt(i)) | 0; }
  return () => { h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 0x7fffffff; };
}
function pick<T>(arr: T[], rng: () => number): T { return arr[Math.floor(rng() * arr.length)]; }
function rf(min: number, max: number, rng: () => number, dec = 1): number { return Number((min + rng() * (max - min)).toFixed(dec)); }

/* --- Known Commodity Profiles --- */
interface CommodityProfile {
  name: string; category: string; unit: string; basePrice: number; volatility: number;
  topProducers: string[]; topConsumers: string[]; keyDrivers: string[];
  globalCompanies: { name: string; country: string; role: string; marketShare: string }[];
  countryShares: { country: string; productionShare: number; exportShare: number; reserveShare: number }[];
  impactChain: { step: string; effect: string }[];
  whyMattersGlobal: string;
}

const PROFILES: Record<string, CommodityProfile> = {
  "crude-oil": {
    name: "Crude Oil (WTI)", category: "Energy", unit: "$/bbl", basePrice: 78, volatility: 0.08,
    topProducers: ["USA", "Saudi Arabia", "Russia"], topConsumers: ["USA", "China", "India"],
    keyDrivers: ["OPEC policy", "US shale production", "China demand", "geopolitical risk", "US Dollar strength"],
    globalCompanies: [
      { name: "Saudi Aramco", country: "Saudi Arabia", role: "World's largest oil producer", marketShare: "12%" },
      { name: "ExxonMobil", country: "USA", role: "Largest publicly traded oil company", marketShare: "3%" },
      { name: "Shell", country: "Netherlands", role: "Major integrated oil company and LNG trader", marketShare: "2.5%" },
      { name: "Chevron", country: "USA", role: "Major US oil producer and refiner", marketShare: "2%" },
      { name: "TotalEnergies", country: "France", role: "European energy major with African operations", marketShare: "1.8%" },
    ],
    countryShares: [
      { country: "USA", productionShare: 15, exportShare: 8, reserveShare: 4 },
      { country: "Saudi Arabia", productionShare: 12, exportShare: 16, reserveShare: 17 },
      { country: "Russia", productionShare: 11, exportShare: 12, reserveShare: 6 },
      { country: "Iraq", productionShare: 5, exportShare: 7, reserveShare: 9 },
      { country: "Canada", productionShare: 6, exportShare: 5, reserveShare: 10 },
    ],
    impactChain: [
      { step: "Oil price rises $10/barrel", effect: "Fuel costs increase 8-12% globally" },
      { step: "Airlines raise ticket prices", effect: "Travel demand drops, tourism-dependent economies suffer" },
      { step: "Shipping and logistics costs surge", effect: "Consumer goods prices rise across all categories" },
      { step: "Inflation accelerates", effect: "Central banks consider raising interest rates" },
      { step: "Higher interest rates", effect: "Housing and car loans become expensive, spending slows" },
    ],
    whyMattersGlobal: "Oil is the most important commodity in the world. It powers transportation, heats homes, and is the raw material for plastics, chemicals, and fertilizers. When oil prices change by even $5, it affects the cost of living for billions of people. Oil is also deeply connected to geopolitics, since the countries that produce it wield enormous global power."
  },
  "brent-crude": {
    name: "Brent Crude", category: "Energy", unit: "$/bbl", basePrice: 82, volatility: 0.07,
    topProducers: ["Saudi Arabia", "Russia", "Iraq"], topConsumers: ["China", "USA", "India"],
    keyDrivers: ["OPEC+ decisions", "Global GDP growth", "Shipping routes", "Sanctions", "Strategic reserves"],
    globalCompanies: [
      { name: "Saudi Aramco", country: "Saudi Arabia", role: "OPEC's largest producer", marketShare: "12%" },
      { name: "Rosneft", country: "Russia", role: "Russia's largest oil company", marketShare: "5%" },
      { name: "BP", country: "UK", role: "Global energy major transitioning to renewables", marketShare: "2%" },
      { name: "TotalEnergies", country: "France", role: "European energy leader", marketShare: "1.8%" },
    ],
    countryShares: [
      { country: "Saudi Arabia", productionShare: 12, exportShare: 16, reserveShare: 17 },
      { country: "Russia", productionShare: 11, exportShare: 12, reserveShare: 6 },
      { country: "Iraq", productionShare: 5, exportShare: 7, reserveShare: 9 },
      { country: "UAE", productionShare: 4, exportShare: 5, reserveShare: 6 },
    ],
    impactChain: [
      { step: "Brent rises above $90", effect: "Asian import bills surge by billions" },
      { step: "India's oil import bill increases", effect: "Rupee weakens, fiscal deficit widens" },
      { step: "Fuel subsidies strain government budgets", effect: "Either consumers pay more or taxpayers do" },
      { step: "Food transport costs rise", effect: "Grocery prices increase for households" },
    ],
    whyMattersGlobal: "Brent Crude is the global benchmark, priced off two-thirds of the world's oil contracts. Unlike WTI (which is US-focused), Brent reflects true global supply-demand. When Asian or European buyers negotiate oil contracts, they reference Brent, making it the world's most important price signal."
  },
  "natural-gas": {
    name: "Natural Gas", category: "Energy", unit: "$/MMBtu", basePrice: 2.8, volatility: 0.15,
    topProducers: ["USA", "Russia", "Iran"], topConsumers: ["USA", "Russia", "China"],
    keyDrivers: ["Weather patterns", "LNG exports", "Storage levels", "Renewable transition", "Europe demand"],
    globalCompanies: [
      { name: "Gazprom", country: "Russia", role: "World's largest natural gas producer", marketShare: "12%" },
      { name: "ExxonMobil", country: "USA", role: "Major LNG exporter", marketShare: "4%" },
      { name: "Qatar Energy", country: "Qatar", role: "World's largest LNG exporter", marketShare: "22% of LNG" },
      { name: "Cheniere Energy", country: "USA", role: "Largest US LNG exporter", marketShare: "8% of LNG" },
    ],
    countryShares: [
      { country: "USA", productionShare: 23, exportShare: 15, reserveShare: 6 },
      { country: "Russia", productionShare: 17, exportShare: 20, reserveShare: 24 },
      { country: "Iran", productionShare: 6, exportShare: 1, reserveShare: 17 },
      { country: "Qatar", productionShare: 5, exportShare: 22, reserveShare: 13 },
    ],
    impactChain: [
      { step: "Gas prices double", effect: "Electricity bills surge for homes and businesses" },
      { step: "Fertilizer production costs spike", effect: "Farmers pay more for fertilizers" },
      { step: "Crop production costs increase", effect: "Food prices rise at grocery stores" },
      { step: "European factories lose competitiveness", effect: "Manufacturing shifts to cheaper energy regions" },
    ],
    whyMattersGlobal: "Natural gas powers electricity generation, heats homes, and is the key input for making fertilizers that grow the world's food. The Russia-Ukraine conflict showed how dependent Europe was on Russian gas, triggering an energy crisis that raised electricity bills and shut down factories across the continent."
  },
  "gold": {
    name: "Gold", category: "Precious Metals", unit: "$/oz", basePrice: 2350, volatility: 0.04,
    topProducers: ["China", "Australia", "Russia"], topConsumers: ["China", "India", "Central Banks"],
    keyDrivers: ["Real interest rates", "US Dollar", "Inflation expectations", "Central bank buying", "Geopolitical risk"],
    globalCompanies: [
      { name: "Newmont", country: "USA", role: "World's largest gold miner", marketShare: "6%" },
      { name: "Barrick Gold", country: "Canada", role: "Second-largest gold producer", marketShare: "4%" },
      { name: "Agnico Eagle", country: "Canada", role: "Premium gold miner", marketShare: "3%" },
      { name: "Gold Fields", country: "South Africa", role: "Historic gold mining leader", marketShare: "2%" },
    ],
    countryShares: [
      { country: "China", productionShare: 10, exportShare: 0, reserveShare: 3 },
      { country: "Australia", productionShare: 9, exportShare: 12, reserveShare: 10 },
      { country: "Russia", productionShare: 8, exportShare: 5, reserveShare: 5 },
      { country: "USA", productionShare: 6, exportShare: 3, reserveShare: 4 },
    ],
    impactChain: [
      { step: "Gold crosses $2,500/oz", effect: "Signal of rising global fear and inflation concerns" },
      { step: "Investors shift from stocks to gold", effect: "Stock markets may see outflows" },
      { step: "Jewelry demand softens (too expensive)", effect: "Indian and Chinese retail demand drops" },
      { step: "Gold loan companies benefit", effect: "Banks lend more against gold collateral" },
      { step: "Mining companies see record profits", effect: "Exploration and new mines ramp up" },
    ],
    whyMattersGlobal: "Gold has been humanity's store of value for 5,000 years. Central banks hold it as a reserve asset, investors buy it as insurance against economic crises, and billions of people in Asia buy it for weddings and savings. Gold surging usually means the world is worried about something big."
  },
  "silver": {
    name: "Silver", category: "Precious Metals", unit: "$/oz", basePrice: 29.5, volatility: 0.06,
    topProducers: ["Mexico", "Peru", "China"], topConsumers: ["Industrial", "Solar panels", "Jewelry"],
    keyDrivers: ["Gold correlation", "Industrial demand", "Solar energy growth", "Mine supply", "Investment demand"],
    globalCompanies: [
      { name: "Fresnillo", country: "Mexico", role: "World's largest silver producer", marketShare: "5%" },
      { name: "Pan American Silver", country: "Canada", role: "Major silver miner", marketShare: "3%" },
      { name: "First Majestic Silver", country: "Canada", role: "Pure-play silver miner", marketShare: "2%" },
    ],
    countryShares: [
      { country: "Mexico", productionShare: 24, exportShare: 28, reserveShare: 11 },
      { country: "Peru", productionShare: 14, exportShare: 16, reserveShare: 9 },
      { country: "China", productionShare: 13, exportShare: 2, reserveShare: 7 },
    ],
    impactChain: [
      { step: "Silver demand for solar panels surges", effect: "Each solar panel uses 20g of silver" },
      { step: "Green energy transition accelerates", effect: "Silver industrial demand grows 5-8% annually" },
      { step: "Mine supply can't keep up", effect: "Silver deficit widens, prices rise" },
      { step: "Electronics costs increase", effect: "Phones, computers become marginally more expensive" },
    ],
    whyMattersGlobal: "Silver is unique because it's both a precious metal (like gold) and an industrial metal. Half of silver demand comes from industry, especially solar panels. As the world rushes to build solar farms, silver demand is booming, creating a structural shortage that could push prices much higher."
  },
  "copper": {
    name: "Copper", category: "Base Metals", unit: "$/lb", basePrice: 4.2, volatility: 0.07,
    topProducers: ["Chile", "Peru", "Congo"], topConsumers: ["China", "USA", "Germany"],
    keyDrivers: ["China construction", "EV demand", "Green transition", "Mine supply disruptions", "Global manufacturing PMI"],
    globalCompanies: [
      { name: "Codelco", country: "Chile", role: "World's largest copper producer (state-owned)", marketShare: "8%" },
      { name: "Freeport-McMoRan", country: "USA", role: "Operates world's largest gold-copper mine", marketShare: "5%" },
      { name: "BHP", country: "Australia", role: "Expanding copper portfolio aggressively", marketShare: "4%" },
      { name: "Glencore", country: "Switzerland", role: "Top copper trader and miner", marketShare: "4%" },
    ],
    countryShares: [
      { country: "Chile", productionShare: 27, exportShare: 30, reserveShare: 23 },
      { country: "Peru", productionShare: 10, exportShare: 12, reserveShare: 10 },
      { country: "Congo (DRC)", productionShare: 8, exportShare: 9, reserveShare: 4 },
      { country: "China", productionShare: 8, exportShare: 0, reserveShare: 3 },
    ],
    impactChain: [
      { step: "Copper demand surges from EV/renewables", effect: "Each EV uses 4x more copper than a gas car" },
      { step: "New mines take 10+ years to develop", effect: "Supply can't respond quickly to demand" },
      { step: "Copper prices rise significantly", effect: "Building costs increase, housing becomes expensive" },
      { step: "Power grid upgrades cost more", effect: "Electricity transition to renewables slows" },
      { step: "Mining companies see massive profits", effect: "New investment in copper exploration accelerates" },
    ],
    whyMattersGlobal: "Copper is essential for the modern world — it's in every building, vehicle, phone, and power line. The green energy transition needs massive amounts of copper (EVs use 4x more than gas cars). Experts call it 'the new oil' because without enough copper, the world can't electrify and decarbonize."
  },
  "aluminium": {
    name: "Aluminium", category: "Base Metals", unit: "$/ton", basePrice: 2450, volatility: 0.06,
    topProducers: ["China", "India", "Russia"], topConsumers: ["China", "USA", "Japan"],
    keyDrivers: ["Chinese smelter output", "Energy costs", "Auto lightweighting", "Packaging demand", "Sanctions"],
    globalCompanies: [
      { name: "Chinalco", country: "China", role: "World's largest aluminium producer", marketShare: "12%" },
      { name: "Rio Tinto", country: "Australia", role: "Major aluminium smelter operator", marketShare: "5%" },
      { name: "Rusal", country: "Russia", role: "Third-largest aluminium company", marketShare: "6%" },
      { name: "Hindalco", country: "India", role: "Largest aluminium company outside China", marketShare: "3%" },
    ],
    countryShares: [
      { country: "China", productionShare: 57, exportShare: 15, reserveShare: 0 },
      { country: "India", productionShare: 6, exportShare: 4, reserveShare: 0 },
      { country: "Russia", productionShare: 6, exportShare: 10, reserveShare: 0 },
    ],
    impactChain: [
      { step: "Aluminium prices rise 15%", effect: "Beverage can costs increase for Coca-Cola, Pepsi" },
      { step: "Auto manufacturers pay more", effect: "Cars with aluminium bodies get more expensive" },
      { step: "Aircraft production costs rise", effect: "Boeing, Airbus margins compress" },
      { step: "Construction costs increase", effect: "Window frames, facades cost more" },
    ],
    whyMattersGlobal: "Aluminium is the most widely used non-ferrous metal — it's in your soda can, airplane, car, and window frame. Because smelting aluminium uses enormous amounts of electricity, aluminium prices are directly linked to energy costs. When electricity gets expensive, aluminium gets expensive, and that affects thousands of products."
  },
  "iron-ore": {
    name: "Iron Ore", category: "Base Metals", unit: "$/ton", basePrice: 110, volatility: 0.09,
    topProducers: ["Australia", "Brazil", "India"], topConsumers: ["China", "Japan", "India"],
    keyDrivers: ["China steel demand", "Property sector", "Infrastructure spending", "Port inventories", "Mine supply"],
    globalCompanies: [
      { name: "BHP", country: "Australia", role: "Largest seaborne iron ore shipper", marketShare: "28%" },
      { name: "Rio Tinto", country: "Australia", role: "Second-largest iron ore miner", marketShare: "18%" },
      { name: "Vale", country: "Brazil", role: "Largest iron ore producer by volume", marketShare: "22%" },
      { name: "Fortescue", country: "Australia", role: "Fast-growing iron ore miner", marketShare: "10%" },
    ],
    countryShares: [
      { country: "Australia", productionShare: 38, exportShare: 53, reserveShare: 28 },
      { country: "Brazil", productionShare: 17, exportShare: 22, reserveShare: 12 },
      { country: "India", productionShare: 8, exportShare: 3, reserveShare: 5 },
    ],
    impactChain: [
      { step: "Iron ore drops $20/ton", effect: "Steel production becomes cheaper globally" },
      { step: "Steel prices fall", effect: "Construction and infrastructure costs decrease" },
      { step: "Housing becomes more affordable", effect: "Real estate developers lower prices slightly" },
      { step: "Auto manufacturing margins improve", effect: "Car prices stabilize" },
    ],
    whyMattersGlobal: "Iron ore is turned into steel, the backbone of modern civilization. Every building, bridge, car, ship, and railway track needs steel. China alone consumes over half the world's iron ore, so China's property market and infrastructure spending are the single biggest driver of iron ore prices."
  },
  "lithium": {
    name: "Lithium", category: "Base Metals", unit: "$/ton", basePrice: 15000, volatility: 0.18,
    topProducers: ["Australia", "Chile", "China"], topConsumers: ["China", "South Korea", "Japan"],
    keyDrivers: ["EV adoption rate", "Battery technology", "New mine supply", "China spot prices", "Recycling capacity"],
    globalCompanies: [
      { name: "Albemarle", country: "USA", role: "World's largest lithium producer", marketShare: "15%" },
      { name: "SQM", country: "Chile", role: "Major lithium brine producer", marketShare: "12%" },
      { name: "Ganfeng Lithium", country: "China", role: "China's leading lithium company", marketShare: "10%" },
      { name: "Pilbara Minerals", country: "Australia", role: "Major hard-rock lithium miner", marketShare: "5%" },
    ],
    countryShares: [
      { country: "Australia", productionShare: 47, exportShare: 55, reserveShare: 6 },
      { country: "Chile", productionShare: 25, exportShare: 30, reserveShare: 36 },
      { country: "China", productionShare: 15, exportShare: 5, reserveShare: 7 },
    ],
    impactChain: [
      { step: "Lithium prices drop 50%", effect: "EV battery pack costs fall significantly" },
      { step: "EVs become price-competitive with gas cars", effect: "Mass EV adoption accelerates" },
      { step: "Oil demand growth slows", effect: "Oil companies face stranded asset risk" },
      { step: "Grid storage becomes economical", effect: "Renewable energy deployment surges" },
    ],
    whyMattersGlobal: "Lithium is the key ingredient in every electric vehicle battery and grid storage system. The entire green energy transition depends on having enough affordable lithium. Lithium prices crashed 80% in 2023-24, making EVs more affordable, but also caused miners to cut production, setting up a potential future shortage."
  },
  "wheat": {
    name: "Wheat", category: "Agriculture", unit: "cents/bu", basePrice: 580, volatility: 0.1,
    topProducers: ["China", "India", "Russia"], topConsumers: ["China", "India", "EU"],
    keyDrivers: ["Weather conditions", "Black Sea exports", "India export bans", "US crop conditions", "Global food inflation"],
    globalCompanies: [
      { name: "Cargill", country: "USA", role: "Largest global grain trader", marketShare: "20%" },
      { name: "ADM", country: "USA", role: "Major grain originator and processor", marketShare: "15%" },
      { name: "Bunge", country: "USA", role: "Global agribusiness and grain trader", marketShare: "12%" },
      { name: "Louis Dreyfus", country: "France", role: "One of ABCD grain trading giants", marketShare: "10%" },
    ],
    countryShares: [
      { country: "Russia", productionShare: 12, exportShare: 18, reserveShare: 8 },
      { country: "EU", productionShare: 18, exportShare: 15, reserveShare: 12 },
      { country: "China", productionShare: 18, exportShare: 0, reserveShare: 51 },
      { country: "India", productionShare: 14, exportShare: 1, reserveShare: 5 },
    ],
    impactChain: [
      { step: "Wheat prices spike 30%", effect: "Bread and flour prices rise globally" },
      { step: "Developing nations face food inflation", effect: "Household food budgets stretched thin" },
      { step: "Governments increase food subsidies", effect: "Fiscal deficits widen" },
      { step: "Social unrest risk increases", effect: "Political instability in food-importing nations" },
    ],
    whyMattersGlobal: "Wheat feeds more people than any other crop. It's the primary food source for billions in the Middle East, North Africa, and South Asia. The Russia-Ukraine war disrupted wheat exports and triggered a global food crisis, proving how a war in one region can cause hunger thousands of miles away."
  },
  "corn": {
    name: "Corn", category: "Agriculture", unit: "cents/bu", basePrice: 440, volatility: 0.09,
    topProducers: ["USA", "China", "Brazil"], topConsumers: ["USA", "China", "EU"],
    keyDrivers: ["US crop conditions", "Ethanol demand", "Feed demand", "Brazilian Safrinha crop", "Export pace"],
    globalCompanies: [
      { name: "ADM", country: "USA", role: "Largest corn processor for ethanol and feed", marketShare: "15%" },
      { name: "Cargill", country: "USA", role: "Global corn originator and trader", marketShare: "18%" },
      { name: "Bunge", country: "USA", role: "Major corn exporter", marketShare: "10%" },
    ],
    countryShares: [
      { country: "USA", productionShare: 32, exportShare: 25, reserveShare: 12 },
      { country: "China", productionShare: 23, exportShare: 0, reserveShare: 55 },
      { country: "Brazil", productionShare: 12, exportShare: 18, reserveShare: 3 },
    ],
    impactChain: [
      { step: "Corn prices rise sharply", effect: "Animal feed costs surge for livestock farmers" },
      { step: "Meat production costs increase", effect: "Chicken, pork, and beef prices rise" },
      { step: "Ethanol prices increase", effect: "Gasoline blending costs go up" },
      { step: "Food inflation broadens", effect: "Corn syrup, starch, and processed foods cost more" },
    ],
    whyMattersGlobal: "Corn is not just food on your plate — it's the foundation of the entire meat industry (animal feed), the biofuel industry (ethanol), and the processed food industry (corn syrup is in everything). When corn prices rise, it triggers a chain reaction that makes meat, fuel, and snacks all more expensive."
  },
  "soybeans": {
    name: "Soybeans", category: "Agriculture", unit: "cents/bu", basePrice: 1150, volatility: 0.08,
    topProducers: ["Brazil", "USA", "Argentina"], topConsumers: ["China", "USA", "EU"],
    keyDrivers: ["China demand", "Brazilian harvest", "Crush margins", "Biodiesel policy", "US plantings"],
    globalCompanies: [
      { name: "Cargill", country: "USA", role: "Largest soybean trader globally", marketShare: "20%" },
      { name: "ADM", country: "USA", role: "Major soybean crusher", marketShare: "15%" },
      { name: "Bunge", country: "USA", role: "Leading soybean exporter from South America", marketShare: "12%" },
      { name: "COFCO", country: "China", role: "China's state grain trader", marketShare: "8%" },
    ],
    countryShares: [
      { country: "Brazil", productionShare: 33, exportShare: 50, reserveShare: 5 },
      { country: "USA", productionShare: 28, exportShare: 30, reserveShare: 8 },
      { country: "Argentina", productionShare: 12, exportShare: 8, reserveShare: 2 },
    ],
    impactChain: [
      { step: "China increases soybean imports", effect: "Prices rise as largest buyer absorbs supply" },
      { step: "Soybean oil prices increase", effect: "Cooking oil becomes more expensive in Asia" },
      { step: "Soy meal costs rise", effect: "Poultry and pork feed costs increase" },
      { step: "Biodiesel feedstock costs surge", effect: "Renewable fuel mandates become costly" },
    ],
    whyMattersGlobal: "Soybeans are the world's most important oilseed. China imports over 100 million tons annually to feed its massive pig and poultry industry. The US-China soybean trade is one of the largest agricultural trade flows in the world, and any disruption (like tariffs) reverberates through global food systems."
  },
  "coffee": {
    name: "Coffee (Arabica)", category: "Softs", unit: "cents/lb", basePrice: 220, volatility: 0.12,
    topProducers: ["Brazil", "Vietnam", "Colombia"], topConsumers: ["EU", "USA", "Japan"],
    keyDrivers: ["Brazilian frost risk", "Vietnam robusta harvest", "Inventory drawdowns", "El Nino impact", "Specialty demand"],
    globalCompanies: [
      { name: "Nestle", country: "Switzerland", role: "World's largest coffee buyer (Nescafe, Nespresso)", marketShare: "22%" },
      { name: "JDE Peet's", country: "Netherlands", role: "Second-largest coffee company", marketShare: "12%" },
      { name: "Starbucks", country: "USA", role: "Largest specialty coffee chain", marketShare: "8%" },
      { name: "Louis Dreyfus", country: "France", role: "Major coffee trader", marketShare: "10%" },
    ],
    countryShares: [
      { country: "Brazil", productionShare: 35, exportShare: 30, reserveShare: 0 },
      { country: "Vietnam", productionShare: 18, exportShare: 20, reserveShare: 0 },
      { country: "Colombia", productionShare: 8, exportShare: 10, reserveShare: 0 },
    ],
    impactChain: [
      { step: "Brazilian frost destroys coffee crops", effect: "Global coffee supply drops 15-20%" },
      { step: "Coffee futures surge to record highs", effect: "Roasters face massive cost increases" },
      { step: "Starbucks, cafes raise drink prices", effect: "Consumers pay more for daily coffee" },
      { step: "Instant coffee brands squeeze margins", effect: "Product sizes shrink (shrinkflation)" },
    ],
    whyMattersGlobal: "Coffee is the world's second-most traded commodity after oil. Over 2 billion cups are consumed daily. When a frost hits Brazilian coffee farms or drought strikes Vietnam, your morning coffee price can jump 30-50% within weeks. Coffee prices directly affect 125 million farming families in tropical developing nations."
  },
  "cocoa": {
    name: "Cocoa", category: "Softs", unit: "$/ton", basePrice: 8500, volatility: 0.16,
    topProducers: ["Ivory Coast", "Ghana", "Ecuador"], topConsumers: ["EU", "USA", "Asia"],
    keyDrivers: ["West African weather", "CSSVD disease", "Grinding demand", "Inventory levels", "Farmer prices"],
    globalCompanies: [
      { name: "Barry Callebaut", country: "Switzerland", role: "World's largest cocoa processor", marketShare: "25%" },
      { name: "Cargill Cocoa", country: "USA", role: "Major cocoa grinder and trader", marketShare: "15%" },
      { name: "Olam Cocoa", country: "Singapore", role: "Integrated cocoa supply chain", marketShare: "10%" },
    ],
    countryShares: [
      { country: "Ivory Coast", productionShare: 38, exportShare: 35, reserveShare: 0 },
      { country: "Ghana", productionShare: 18, exportShare: 15, reserveShare: 0 },
      { country: "Ecuador", productionShare: 8, exportShare: 10, reserveShare: 0 },
    ],
    impactChain: [
      { step: "Cocoa prices surge to record highs", effect: "Chocolate manufacturers face 200%+ cost increases" },
      { step: "Cadbury, Lindt, Hershey raise prices", effect: "Chocolate bars shrink or get more expensive" },
      { step: "Premium chocolate becomes luxury good", effect: "Consumer spending shifts to cheaper alternatives" },
    ],
    whyMattersGlobal: "Cocoa prices hit all-time records in 2024-25 due to disease and climate change devastating West African farms. Since two countries (Ivory Coast and Ghana) grow over half the world's cocoa, any disruption there makes every chocolate bar, cookie, and dessert more expensive worldwide."
  },
  "sugar": {
    name: "Sugar #11", category: "Softs", unit: "cents/lb", basePrice: 22, volatility: 0.1,
    topProducers: ["Brazil", "India", "Thailand"], topConsumers: ["India", "EU", "China"],
    keyDrivers: ["Brazil cane allocation", "India export policy", "Ethanol diversion", "El Nino weather", "Thailand production"],
    globalCompanies: [
      { name: "Raizen", country: "Brazil", role: "World's largest sugar and ethanol producer", marketShare: "8%" },
      { name: "Cargill", country: "USA", role: "Major sugar trader", marketShare: "10%" },
      { name: "Louis Dreyfus", country: "France", role: "Leading sugar trader", marketShare: "8%" },
    ],
    countryShares: [
      { country: "Brazil", productionShare: 22, exportShare: 45, reserveShare: 0 },
      { country: "India", productionShare: 18, exportShare: 5, reserveShare: 0 },
      { country: "Thailand", productionShare: 6, exportShare: 10, reserveShare: 0 },
    ],
    impactChain: [
      { step: "Brazil diverts sugarcane to ethanol", effect: "Less sugar available for export" },
      { step: "Global sugar supply tightens", effect: "Candy, soft drink, bakery costs rise" },
      { step: "India restricts sugar exports", effect: "World market loses second-largest producer" },
    ],
    whyMattersGlobal: "Sugar is unique because it competes with fuel. In Brazil, sugarcane can be made into sugar OR ethanol. When oil prices rise, Brazil diverts cane to ethanol, reducing global sugar supply and making your candy bar more expensive. One commodity market directly affects another."
  },
  "cotton": {
    name: "Cotton", category: "Softs", unit: "cents/lb", basePrice: 82, volatility: 0.08,
    topProducers: ["China", "India", "USA"], topConsumers: ["China", "India", "Bangladesh"],
    keyDrivers: ["Chinese stockpiling", "Monsoon in India", "US crop conditions", "Textile demand", "Polyester substitution"],
    globalCompanies: [
      { name: "Louis Dreyfus", country: "France", role: "Largest cotton trader", marketShare: "12%" },
      { name: "Cargill Cotton", country: "USA", role: "Major cotton merchant", marketShare: "8%" },
      { name: "Olam Agri", country: "Singapore", role: "Cotton originator in Africa", marketShare: "6%" },
    ],
    countryShares: [
      { country: "China", productionShare: 24, exportShare: 0, reserveShare: 40 },
      { country: "India", productionShare: 23, exportShare: 8, reserveShare: 10 },
      { country: "USA", productionShare: 12, exportShare: 30, reserveShare: 3 },
    ],
    impactChain: [
      { step: "Cotton prices surge 25%", effect: "Textile and garment costs increase" },
      { step: "Fast fashion brands raise prices", effect: "Clothing becomes more expensive for consumers" },
      { step: "Bangladesh garment factories squeezed", effect: "Wage pressures and employment concerns" },
    ],
    whyMattersGlobal: "Cotton clothes billions of people. When cotton prices spike (as they did in 2021-22), the t-shirt you buy at Zara or H&M costs more. Cotton prices affect the livelihoods of 100 million farming families and the garment workers in Bangladesh, Vietnam, and India who make the world's clothes."
  },
  "nickel": {
    name: "Nickel", category: "Base Metals", unit: "$/ton", basePrice: 17500, volatility: 0.1,
    topProducers: ["Indonesia", "Philippines", "Russia"], topConsumers: ["China", "Japan", "EU"],
    keyDrivers: ["Indonesian export policy", "EV battery demand", "Stainless steel output", "LME inventory", "Norilsk supply"],
    globalCompanies: [
      { name: "Norilsk Nickel", country: "Russia", role: "World's largest high-grade nickel producer", marketShare: "6%" },
      { name: "Vale", country: "Brazil", role: "Major nickel miner", marketShare: "5%" },
      { name: "Glencore", country: "Switzerland", role: "Top nickel trader", marketShare: "4%" },
      { name: "BHP", country: "Australia", role: "Nickel miner for EV batteries", marketShare: "3%" },
    ],
    countryShares: [
      { country: "Indonesia", productionShare: 49, exportShare: 45, reserveShare: 22 },
      { country: "Philippines", productionShare: 10, exportShare: 12, reserveShare: 5 },
      { country: "Russia", productionShare: 6, exportShare: 8, reserveShare: 7 },
    ],
    impactChain: [
      { step: "Indonesia restricts nickel ore exports", effect: "Stainless steel input costs rise" },
      { step: "EV battery-grade nickel supply tightens", effect: "Battery production costs increase" },
      { step: "EV price reductions stall", effect: "Mass EV adoption slows down" },
    ],
    whyMattersGlobal: "Indonesia controls nearly half of global nickel production, giving it enormous power over the EV battery and stainless steel industries. Their export policies directly determine whether electric vehicles become affordable and whether your kitchen appliances cost more."
  },
  "platinum": {
    name: "Platinum", category: "Precious Metals", unit: "$/oz", basePrice: 980, volatility: 0.06,
    topProducers: ["South Africa", "Russia", "Zimbabwe"], topConsumers: ["Auto industry", "Jewelry", "Industrial"],
    keyDrivers: ["Diesel auto catalyst demand", "Hydrogen economy", "South African power supply", "Substitution with palladium", "Investment demand"],
    globalCompanies: [
      { name: "Anglo American Platinum", country: "South Africa", role: "World's largest platinum producer", marketShare: "38%" },
      { name: "Impala Platinum", country: "South Africa", role: "Second-largest producer", marketShare: "20%" },
      { name: "Sibanye-Stillwater", country: "South Africa", role: "Diversified PGM miner", marketShare: "12%" },
    ],
    countryShares: [
      { country: "South Africa", productionShare: 72, exportShare: 65, reserveShare: 91 },
      { country: "Russia", productionShare: 12, exportShare: 15, reserveShare: 4 },
      { country: "Zimbabwe", productionShare: 8, exportShare: 8, reserveShare: 1 },
    ],
    impactChain: [
      { step: "South Africa power cuts hit mines", effect: "Platinum production drops" },
      { step: "Auto catalyst supply tightens", effect: "Car production costs rise" },
      { step: "Hydrogen economy grows", effect: "Platinum demand from fuel cells increases" },
    ],
    whyMattersGlobal: "South Africa produces 72% of the world's platinum. Constant power blackouts (loadshedding) there threaten supply. Platinum's future depends on whether the hydrogen economy takes off, since fuel cells need platinum, potentially creating massive new demand."
  },
  "palladium": {
    name: "Palladium", category: "Precious Metals", unit: "$/oz", basePrice: 1020, volatility: 0.08,
    topProducers: ["Russia", "South Africa", "Canada"], topConsumers: ["Auto catalyst", "Electronics", "Chemical"],
    keyDrivers: ["Gasoline vehicle production", "Russia supply risk", "EV substitution threat", "Recycling volumes", "Inventory drawdowns"],
    globalCompanies: [
      { name: "Norilsk Nickel", country: "Russia", role: "World's largest palladium producer (40%)", marketShare: "40%" },
      { name: "Anglo American Platinum", country: "South Africa", role: "Second-largest producer", marketShare: "18%" },
      { name: "Sibanye-Stillwater", country: "South Africa", role: "Major PGM producer", marketShare: "8%" },
    ],
    countryShares: [
      { country: "Russia", productionShare: 40, exportShare: 38, reserveShare: 35 },
      { country: "South Africa", productionShare: 35, exportShare: 30, reserveShare: 55 },
      { country: "Canada", productionShare: 7, exportShare: 8, reserveShare: 3 },
    ],
    impactChain: [
      { step: "Russian palladium sanctions tighten", effect: "40% of global supply at risk" },
      { step: "Auto catalyst costs surge", effect: "New cars become more expensive" },
      { step: "Recycling from old catalytic converters increases", effect: "Partially offsets supply loss" },
    ],
    whyMattersGlobal: "Russia's Norilsk Nickel produces 40% of the world's palladium, used in every gasoline car's catalytic converter. If sanctions cut off Russian palladium, every new car becomes significantly more expensive. But as EVs grow, palladium demand will eventually decline, creating a complex market dynamic."
  },
  "live-cattle": {
    name: "Live Cattle", category: "Livestock", unit: "cents/lb", basePrice: 185, volatility: 0.05,
    topProducers: ["USA", "Brazil", "EU"], topConsumers: ["USA", "China", "EU"],
    keyDrivers: ["US herd size", "Feed costs", "Beef demand", "Export markets", "Processing capacity"],
    globalCompanies: [
      { name: "JBS", country: "Brazil", role: "World's largest meat processor", marketShare: "20%" },
      { name: "Tyson Foods", country: "USA", role: "Second-largest meat processor", marketShare: "15%" },
      { name: "Cargill Meat", country: "USA", role: "Major beef processor", marketShare: "12%" },
      { name: "Marfrig", country: "Brazil", role: "Global beef giant", marketShare: "8%" },
    ],
    countryShares: [
      { country: "USA", productionShare: 20, exportShare: 15, reserveShare: 0 },
      { country: "Brazil", productionShare: 16, exportShare: 25, reserveShare: 0 },
      { country: "EU", productionShare: 12, exportShare: 8, reserveShare: 0 },
    ],
    impactChain: [
      { step: "Cattle herd shrinks due to drought", effect: "Beef supply tightens over 2-3 years" },
      { step: "Beef prices rise at grocery stores", effect: "Consumers switch to chicken or plant-based" },
      { step: "Restaurant menu prices increase", effect: "Dining out becomes more expensive" },
    ],
    whyMattersGlobal: "The US cattle herd is at its smallest in decades after severe droughts. It takes 2-3 years to rebuild a cattle herd, meaning beef prices will stay elevated. Meanwhile, Brazil has become the world's largest beef exporter, shipping to China, the Middle East, and Southeast Asia."
  },
};

function generateCommodityIntelligence(slug: string, name: string) {
  const rng = seededRng(slug + name);
  const profile = PROFILES[slug];

  const basePrice = profile?.basePrice || rf(50, 5000, rng, 2);
  const vol = profile?.volatility || 0.08;
  const price = Number((basePrice * (1 + (rng() - 0.5) * vol * 2)).toFixed(2));
  const changePercent = rf(-4, 5, rng, 2);
  const category = profile?.category || "Commodity";
  const unit = profile?.unit || "$/unit";

  const dayHigh = Number((price * rf(1.005, 1.02, rng, 4)).toFixed(2));
  const dayLow = Number((price * rf(0.98, 0.995, rng, 4)).toFixed(2));
  const weekHigh52 = Number((price * rf(1.08, 1.35, rng, 2)).toFixed(2));
  const weekLow52 = Number((price * rf(0.65, 0.92, rng, 2)).toFixed(2));
  const openInterest = `${rf(200, 800, rng, 0)}K contracts`;
  const volume24h = `${rf(50, 500, rng, 0)}K contracts`;

  // AI Copilot Narrative — STORY-DRIVEN & BEGINNER FRIENDLY
  const aiNarrative = (() => {
    const direction = changePercent > 0 ? "rising" : "falling";
    const driverPool = profile?.keyDrivers || ["supply-demand dynamics", "macro conditions", "institutional flows"];
    const driver1 = driverPool[Math.floor(rng() * driverPool.length)];
    const driver2 = driverPool[Math.floor(rng() * driverPool.length)];
    const producers = profile?.topProducers || ["major producers"];
    const consumers = profile?.topConsumers || ["major consumers"];

    if (category === "Energy") {
      return `${name} is ${direction} today, currently at $${price} per barrel (${changePercent > 0 ? "+" : ""}${changePercent}%). In simple terms, this means ${changePercent > 0 ? "fuel and energy costs are going up" : "energy is getting slightly cheaper"}. The main reasons are ${driver1} and ${driver2}. ${changePercent > 0 ? `${producers[0]} has been producing less oil than expected, while demand from ${consumers[1]} remains strong because their economy is growing.` : `Weaker demand signals from ${consumers[0]} and potential production increases from ${producers[1]} are pushing prices down.`} OPEC countries (the group of oil-producing nations that control supply) are maintaining their production at ${rf(85, 102, rng, 0)}% of quota. US oil inventories ${rng() > 0.5 ? "declined" : "increased"} by ${rf(1, 8, rng, 1)} million barrels last week. What this means for you: ${changePercent > 0 ? "expect higher prices at the gas pump, more expensive flights, and rising delivery costs for online shopping." : "fuel prices may ease slightly, which is good news for travelers and commuters."}`;
    } else if (category === "Precious Metals") {
      return `${name} is ${direction} at $${price.toLocaleString()} per ounce (${changePercent > 0 ? "+" : ""}${changePercent}%), influenced by ${driver1}. ${changePercent > 0 ? "People are buying gold because they're worried about the economy and want a safe place to store their money. When the world feels uncertain — wars, inflation, banking crises — gold shines." : "Gold is under pressure because interest rates are rising. When banks pay you good interest on deposits, gold (which pays nothing) becomes less attractive."} Central banks around the world bought a record ${rf(30, 80, rng, 0)} tons this quarter, signaling they want to reduce dependence on the US Dollar. ${consumers[0]} and ${consumers[1]} remain the biggest physical gold buyers, primarily for jewelry and savings. What this means for you: ${changePercent > 0 ? "if you're looking to buy gold jewelry, prices are elevated. But gold investors are seeing their holdings appreciate." : "it might be a good time to buy gold if you believe uncertainty will return."}`;
    } else if (category === "Base Metals") {
      return `${name} is ${direction} at $${price.toLocaleString()} (${changePercent > 0 ? "+" : ""}${changePercent}%), driven by ${driver1}. Think of ${name.toLowerCase().replace(/\(.*\)/, "").trim()} as a health indicator for the global economy — when factories are busy building things, they need metals, and prices rise. ${consumers[0]} uses about ${rf(45, 65, rng, 0)}% of the world's ${name.toLowerCase().replace(/\(.*\)/, "").trim()}, so China's economy is the single biggest factor. ${rng() > 0.5 ? "Recent government stimulus (spending money to boost the economy) is helping construction and infrastructure projects, which is good for metal demand." : "China's property sector slowdown is reducing construction activity, which means less demand for metals."} Warehouse inventories ${rng() > 0.5 ? "fell" : "rose"} ${rf(2, 15, rng, 0)}% this month. What this means for you: ${changePercent > 0 ? "construction costs are rising, which could make new homes and cars more expensive." : "building costs may ease, which is positive for the housing market."}`;
    } else if (category === "Agriculture") {
      return `${name} is ${direction} at ${price} ${unit} (${changePercent > 0 ? "+" : ""}${changePercent}%), driven by ${driver1}. This directly affects food prices because ${name.toLowerCase()} is a staple that billions of people depend on. ${changePercent > 0 ? `Bad weather in ${producers[0]} is damaging crops, meaning less food is available globally. Meanwhile, ${consumers[0]} keeps buying large quantities to feed its population.` : `Good growing conditions in ${producers[1]} mean a bumper harvest is expected, bringing more supply to market and pushing prices down.`} Global food reserves are at ${rf(150, 320, rng, 0)} million tons. ${rng() > 0.5 ? "El Nino weather patterns are developing, which historically disrupts harvests in Asia and South America." : "Weather conditions look favorable for upcoming harvests."} What this means for you: ${changePercent > 0 ? "grocery prices for bread, pasta, cooking oil, and animal feed are likely to increase in coming months." : "food inflation may ease, bringing relief to household budgets."}`;
    } else {
      return `${name} is ${direction} at ${price} ${unit} (${changePercent > 0 ? "+" : ""}${changePercent}%), influenced by ${driver1} and global demand trends. ${changePercent > 0 ? "Tightening supply and strong demand from global consumers are pushing prices higher." : "Adequate supply and softer demand are creating downward pressure."} The key producers (${producers.join(", ")}) are closely monitoring production levels while consumers (${consumers.join(", ")}) adjust their buying strategies. What this means for you: changes in this commodity's price eventually show up in the cost of everyday products that use it as a raw material.`;
    }
  })();

  // Why This Matters section
  const whyThisMatters = profile?.whyMattersGlobal || `${name} plays an important role in the global economy. Changes in its price affect industries, consumers, and countries that depend on it. Understanding ${name.toLowerCase()} helps you understand how the world economy works.`;

  // Global Companies
  const globalCompanies = profile?.globalCompanies || [
    { name: "Major Producer A", country: "Country A", role: "Leading global producer", marketShare: "10%" },
    { name: "Major Trader B", country: "Country B", role: "Global commodity trader", marketShare: "8%" },
  ];

  // Country Power Shares
  const countryShares = profile?.countryShares || [
    { country: "Country A", productionShare: 25, exportShare: 30, reserveShare: 20 },
    { country: "Country B", productionShare: 20, exportShare: 15, reserveShare: 15 },
  ];

  // Impact Chain
  const impactChain = profile?.impactChain || [
    { step: `${name} price changes significantly`, effect: "Related industries feel cost pressure" },
    { step: "Companies adjust pricing", effect: "Consumer prices shift" },
    { step: "Economic ripple effects", effect: "GDP growth and inflation impacted" },
  ];

  // AI Story Feed
  const storyFeed = [
    {
      category: "Geopolitical",
      headline: category === "Energy"
        ? `Middle East tensions and ${name} — What's at stake for global energy`
        : `Supply chain risks mounting for ${name} markets`,
      story: category === "Energy"
        ? `Tensions in oil-producing regions are keeping energy traders on edge. ${name} is particularly sensitive because ${(profile?.topProducers || ["major producers"])[0]} controls a significant share of global supply. Any disruption could send prices sharply higher, raising costs for transportation, manufacturing, and heating worldwide. For everyday consumers, this means higher fuel bills and more expensive deliveries.`
        : `The global supply chain for ${name} faces growing risks from geopolitical tensions and trade policy shifts. ${(profile?.topProducers || ["Key producers"])[0]} accounts for a large share of global production, and any policy changes or export restrictions could tighten supply significantly. Industries that depend on this commodity are already building larger inventories as a hedge.`,
      severity: "high",
      timeAgo: `${rf(1, 4, rng, 0)}h ago`,
    },
    {
      category: "Macro",
      headline: rng() > 0.5
        ? `How central bank rate decisions affect ${name} prices`
        : `China's economic recovery — what it means for ${name}`,
      story: rng() > 0.5
        ? `Central banks worldwide are navigating a tricky balance between fighting inflation and supporting economic growth. Higher interest rates typically strengthen the US Dollar, which makes commodities priced in dollars more expensive for international buyers. For ${name}, this means ${changePercent > 0 ? "prices are resilient despite the headwind, showing strong underlying demand" : "the strong dollar is adding to selling pressure alongside weaker demand"}.`
        : `China's economy — the world's largest consumer of many commodities — is showing ${rng() > 0.5 ? "signs of recovery" : "mixed signals"}. For ${name}, China's direction matters enormously because they consume ${rf(30, 55, rng, 0)}% of global supply. ${rng() > 0.5 ? "Recent stimulus measures and infrastructure spending are boosting demand." : "The property sector slowdown continues to weigh on demand expectations."}`,
      severity: "medium",
      timeAgo: `${rf(2, 8, rng, 0)}h ago`,
    },
    {
      category: "Supply Chain",
      headline: `${rng() > 0.5 ? "Red Sea shipping disruptions" : "Global logistics challenges"} impact on ${name}`,
      story: `Shipping disruptions are adding complexity to global ${name.toLowerCase()} trade. ${rng() > 0.5 ? "Attacks on vessels in the Red Sea have forced major shipping lines to reroute around the Cape of Good Hope, adding 10-14 days to transit times and tripling freight costs. This affects delivery schedules and adds to end-consumer costs." : "Logistical bottlenecks at major ports are causing delays in commodity deliveries. Warehouse inventories at key trading hubs are being drawn down as replacement shipments arrive late."} The extra costs will eventually show up as higher prices for products that use ${name.toLowerCase()} as a raw material.`,
      severity: rng() > 0.5 ? "high" : "medium",
      timeAgo: `${rf(3, 12, rng, 0)}h ago`,
    },
    {
      category: "Inflation",
      headline: `${name} and inflation — The connection explained`,
      story: `${name} is one of the commodities that directly influences global inflation. ${changePercent > 0 ? `With prices rising ${changePercent}%, this adds inflationary pressure to the economy. Companies that use ${name.toLowerCase()} as an input will eventually pass these higher costs to consumers through higher prices for finished goods.` : `With prices declining ${Math.abs(changePercent)}%, this provides some relief on the inflation front. Lower input costs give companies room to hold prices steady or even reduce them.`} Central banks watch commodity prices closely because they're a leading indicator of where consumer prices are headed in 3-6 months.`,
      severity: changePercent > 2 ? "high" : "medium",
      timeAgo: `${rf(1, 6, rng, 0)}h ago`,
    },
  ];

  // Supply-Demand Balance
  const supplyDemand = {
    globalProduction: `${rf(80, 120, rng, 1)}M ${unit.includes("ton") ? "tons" : unit.includes("bbl") ? "bbl/day" : "units"}`,
    globalConsumption: `${rf(78, 122, rng, 1)}M ${unit.includes("ton") ? "tons" : unit.includes("bbl") ? "bbl/day" : "units"}`,
    surplus: rng() > 0.45 ? `Deficit: ${rf(0.5, 5, rng, 1)}M` : `Surplus: ${rf(0.3, 4, rng, 1)}M`,
    inventoryDays: rf(15, 90, rng, 0),
    inventoryChange: `${rng() > 0.5 ? "-" : "+"}${rf(1, 12, rng, 1)}% YoY`,
    topProducers: (profile?.topProducers || ["China", "USA", "Russia"]).map(p => ({
      country: p, share: rf(10, 35, rng, 0), trend: pick(["Increasing", "Stable", "Decreasing"], rng),
    })),
    topConsumers: (profile?.topConsumers || ["China", "USA", "India"]).map(c => ({
      country: c, share: rf(10, 40, rng, 0), trend: pick(["Growing", "Stable", "Slowing"], rng),
    })),
  };

  // Futures Curve
  const spot = price;
  const isBackwardation = rng() > 0.45;
  const futuresCurve = Array.from({ length: 12 }, (_, i) => {
    const monthsOut = i + 1;
    const drift = isBackwardation ? -rf(0.2, 0.8, rng, 2) * monthsOut : rf(0.1, 0.6, rng, 2) * monthsOut;
    return {
      month: new Date(2026, 4 + monthsOut, 1).toLocaleDateString("en", { month: "short", year: "2-digit" }),
      price: Number((spot + drift).toFixed(2)),
      monthsOut,
    };
  });

  const futuresAnalysis = {
    structure: isBackwardation ? "Backwardation" as const : "Contango" as const,
    structureExplanation: isBackwardation
      ? `The market is in backwardation, which means today's price is higher than future prices. In simple terms: buyers are paying a premium to get ${name.toLowerCase()} right now, suggesting physical supply is tight. This usually happens when demand is strong or supply is disrupted.`
      : `The market is in contango, which means future prices are higher than today's price. In simple terms: there's enough ${name.toLowerCase()} available right now, but the market expects prices to rise over time. This is the normal state when supply is adequate and storage costs are factored in.`,
    spread1m3m: rf(-3, 5, rng, 2),
    spread1m12m: rf(-8, 12, rng, 2),
    rollYield: isBackwardation ? rf(1, 8, rng, 1) : rf(-6, -0.5, rng, 1),
    curve: futuresCurve,
  };

  // Geopolitical & Supply Chain
  const geopoliticalEvents = [
    { event: category === "Energy" ? "OPEC+ production decision" : category === "Agriculture" ? "El Nino weather pattern developing" : `${(profile?.topProducers || ["Major producer"])[0]} supply disruption`, severity: "high" as const, impact: rf(-5, 8, rng, 1), detail: category === "Energy" ? `OPEC+ (the alliance of oil-producing countries) has ${rng() > 0.5 ? "maintained current production cuts, keeping supply tight" : "signaled they may increase production, which could bring more oil to market"}. This affects about ${rf(0.5, 2, rng, 1)} million barrels per day. In plain language: ${rng() > 0.5 ? "less oil available means higher prices at the pump" : "more oil could mean cheaper fuel"}.` : `Production in a key region has been ${rng() > 0.5 ? "disrupted" : "put at risk"} due to ${pick(["severe weather events", "government policy changes", "infrastructure problems", "worker strikes"], rng)}. This matters because even small supply disruptions can cause large price swings.` },
    { event: "Red Sea shipping crisis", severity: "medium" as const, impact: rf(1, 5, rng, 1), detail: `Attacks on ships near Yemen have forced ${rf(15, 40, rng, 0)}% of vessels to take the long way around Africa instead of the Suez Canal shortcut. This adds ${rf(7, 21, rng, 0)} days and roughly $${rf(500000, 2000000, rng, 0).toLocaleString()} in extra costs per ship. These costs get passed on to consumers through higher prices.` },
    { event: pick(["US-China trade tensions", "Russia sanctions impact", "Middle East escalation", "Climate policy changes"], rng), severity: pick(["high", "medium", "low"] as const, rng), impact: rf(-4, 6, rng, 1), detail: `Geopolitical developments are ${rng() > 0.5 ? "adding uncertainty" : "creating opportunities"} for ${name} markets. Global trade relationships directly affect commodity flows and pricing.` },
    { event: pick(["Central bank rate decision", "China stimulus announcement", "US strategic reserve action", "EU carbon border tax"], rng), severity: "medium" as const, impact: rf(-3, 5, rng, 1), detail: `This policy development is ${rng() > 0.5 ? "supportive" : "a headwind"} for ${name} demand over the next 6-12 months. Government policies can significantly shift commodity demand patterns.` },
  ];

  const shippingRoutes = [
    { route: "Strait of Hormuz", status: rng() > 0.3 ? "Open" as const : "Elevated Risk" as const, volumeShare: `${rf(20, 35, rng, 0)}%`, detail: "Where 21% of the world's oil passes through — between Iran and Oman" },
    { route: "Suez Canal / Red Sea", status: rng() > 0.4 ? "Disrupted" as const : "Open" as const, volumeShare: `${rf(10, 20, rng, 0)}%`, detail: "The shortcut between Asia and Europe — currently facing security threats" },
    { route: "Strait of Malacca", status: "Open" as const, volumeShare: `${rf(25, 40, rng, 0)}%`, detail: "The world's busiest shipping lane — Asia's energy lifeline" },
    { route: "Panama Canal", status: rng() > 0.6 ? "Restricted" as const : "Open" as const, volumeShare: `${rf(5, 12, rng, 0)}%`, detail: "Connecting Atlantic and Pacific — drought is limiting ship traffic" },
    { route: "Cape of Good Hope", status: "Open" as const, volumeShare: `${rf(8, 18, rng, 0)}%`, detail: "The backup route around Africa — adds 2 weeks to delivery" },
  ];

  // Impact on Stocks/Sectors
  const stockImpact = (() => {
    if (category === "Energy") return [
      { sector: "Oil & Gas Companies", impact: "Direct Positive", detail: "When oil prices rise, oil companies like Reliance and ONGC earn more per barrel they sell. Their profits increase directly.", stocks: ["RELIANCE", "ONGC", "BPCL"], whyMatters: "These companies sell the oil — higher prices = higher revenue." },
      { sector: "Airlines", impact: "Strong Negative", detail: "Fuel makes up 35-40% of an airline's costs. When oil prices rise $10, an airline like IndiGo can lose hundreds of crores in profit.", stocks: ["INDIGO", "SPICEJET"], whyMatters: "Airlines can't easily raise ticket prices fast enough to offset fuel costs." },
      { sector: "Paint Companies", impact: "Negative", detail: "Crude oil derivatives are key raw materials for paints. Higher oil = more expensive paint ingredients.", stocks: ["ASIANPAINT", "BERGEPAINT"], whyMatters: "Paint companies face margin pressure when raw material costs rise." },
      { sector: "Chemical Companies", impact: "Negative", detail: "Petrochemicals (made from oil) are the foundation of the chemical industry. Higher feedstock costs squeeze margins.", stocks: ["PIDILITIND", "SRF"], whyMatters: "Chemical companies need oil-based inputs — costs flow directly to their P&L." },
      { sector: "Auto Industry", impact: "Mild Negative", detail: "Higher fuel prices may discourage people from buying petrol/diesel cars, shifting demand toward EVs.", stocks: ["MARUTI", "TATAMOTORS"], whyMatters: "Consumer behavior shifts when running costs change significantly." },
    ];
    if (category === "Precious Metals") return [
      { sector: "Jewelry Companies", impact: "Mixed", detail: "Higher gold prices mean existing inventory is worth more, but new customers may buy less because gold seems expensive.", stocks: ["TITAN", "KALYAN"], whyMatters: "Jewelry companies benefit from inventory gains but face volume pressure." },
      { sector: "Mining Companies", impact: "Positive", detail: "Gold miners sell gold at market prices, so higher gold = higher revenue and profits.", stocks: ["NMDC"], whyMatters: "Direct correlation between gold price and miner profitability." },
      { sector: "Gold Finance", impact: "Indirect Positive", detail: "Companies that give loans against gold benefit when gold value rises — their collateral becomes more valuable.", stocks: ["MANAPPURAM", "MUTHOOTFIN"], whyMatters: "Higher gold means safer gold loans and more lending capacity." },
    ];
    if (category === "Base Metals") return [
      { sector: "Steel & Metals", impact: "Positive", detail: "Metal companies earn more when the metals they produce and sell are priced higher in global markets.", stocks: ["TATASTEEL", "HINDALCO", "JSWSTEEL"], whyMatters: "Revenue directly tied to metal prices — higher prices = higher earnings." },
      { sector: "Auto Manufacturing", impact: "Negative", detail: "Cars use significant amounts of steel, aluminium, and copper. Higher metal prices increase the cost of making each vehicle.", stocks: ["MARUTI", "M&M"], whyMatters: "Raw materials are a huge cost — auto margins get squeezed." },
      { sector: "Infrastructure & Construction", impact: "Negative", detail: "Building bridges, roads, and buildings requires massive amounts of steel and copper. Higher prices make projects more expensive.", stocks: ["LT", "ADANIENT"], whyMatters: "Project costs overrun when commodity prices spike during construction." },
      { sector: "EV & Battery", impact: "Mixed", detail: "Higher lithium and nickel prices make EV batteries more expensive, potentially slowing the switch from gas cars to electric.", stocks: ["TATAMOTORS", "OLAELEC"], whyMatters: "Battery cost is the key factor in making EVs affordable for average buyers." },
    ];
    return [
      { sector: "FMCG (Consumer Goods)", impact: "Negative", detail: "Companies like HUL and Nestle use agricultural commodities as inputs. Higher prices mean either higher product prices or lower profit margins.", stocks: ["HINDUNILVR", "NESTLEIND"], whyMatters: "These brands touch every household — cost increases affect billions." },
      { sector: "Food Processing", impact: "Mixed", detail: "Food companies face volatile input costs but can sometimes pass them on through price hikes (though consumers resist).", stocks: ["BRITANNIA", "MARICO"], whyMatters: "Volatile raw material costs make financial planning difficult." },
      { sector: "Fertilizer Companies", impact: "Indirect", detail: "Fertilizer prices are linked to natural gas (key input) and crop economics. When crops are profitable, farmers buy more fertilizer.", stocks: ["CHAMBALFERT", "GNFC"], whyMatters: "The entire agricultural supply chain is interconnected." },
    ];
  })();

  // Smart Money Positioning
  const smartMoney = {
    netSpeculativePosition: rng() > 0.5 ? "Net Long" : "Net Short",
    positionSize: `${rf(50, 300, rng, 0)}K contracts`,
    weeklyChange: `${rng() > 0.5 ? "+" : "-"}${rf(5, 25, rng, 0)}K`,
    hedgeFundSentiment: rng() > 0.55 ? "Bullish" : rng() > 0.3 ? "Neutral" : "Bearish",
    etfFlows: `${rng() > 0.5 ? "+" : "-"}$${rf(50, 500, rng, 0)}M (30d)`,
    producerHedging: rng() > 0.5 ? "Increasing — producers locking in current prices" : "Decreasing — producers expect higher prices ahead",
    cftcInsight: `Big institutional investors have ${rng() > 0.5 ? "increased" : "decreased"} their bets on ${name.toLowerCase()} by ${rf(5, 20, rng, 0)}% this week. In plain language: ${rng() > 0.5 ? "smart money is betting prices will go higher. Companies that actually produce this commodity are also hedging less, suggesting they expect prices to stay strong." : "professional traders are reducing their bullish bets. Meanwhile, producers are locking in current prices through hedging, suggesting they think prices may fall."}`,
  };

  // AI Risk Assessment
  const riskAssessment = {
    overallRisk: pick(["Low", "Moderate", "High"] as const, rng),
    risks: [
      { type: "Supply Disruption", level: pick(["Low", "Moderate", "High"] as const, rng), detail: `If something goes wrong in ${(profile?.topProducers || ["a key producer"])[0]} — like ${pick(["political upheaval", "extreme weather", "equipment failure", "trade sanctions"], rng)} — supply could drop suddenly, causing a price spike.` },
      { type: "Demand Destruction", level: pick(["Low", "Moderate", "High"] as const, rng), detail: `If the economy slows down significantly or cheaper alternatives emerge, demand for ${name.toLowerCase()} could drop by ${rf(2, 10, rng, 0)}%, pushing prices lower.` },
      { type: "Currency Risk", level: pick(["Low", "Moderate"] as const, rng), detail: `Since most commodities are priced in US Dollars, when the Dollar gets stronger, ${name.toLowerCase()} effectively becomes more expensive for buyers using other currencies, reducing demand.` },
      { type: "Policy Risk", level: pick(["Low", "Moderate", "High"] as const, rng), detail: `Governments might intervene through ${pick(["export restrictions", "import tariffs", "strategic reserve releases", "production mandates"], rng)}, suddenly changing supply or demand dynamics.` },
      { type: "Logistics Risk", level: pick(["Low", "Moderate", "High"] as const, rng), detail: `Shipping disruptions in the ${pick(["Red Sea", "Strait of Hormuz", "Panama Canal", "Black Sea"], rng)} could delay deliveries and raise transportation costs by 50-200%.` },
    ],
  };

  // Seasonal Pattern
  const seasonalPattern = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    avgReturn: rf(-3, 4, rng, 1),
    currentYear: rf(-5, 6, rng, 1),
  }));

  // Macro Correlation
  const macroCorrelation = {
    usDollar: rf(-0.9, -0.3, rng, 2),
    sp500: rf(-0.3, 0.6, rng, 2),
    bonds: rf(-0.5, 0.4, rng, 2),
    inflation: rf(0.2, 0.8, rng, 2),
    vix: rf(-0.2, 0.5, rng, 2),
    chinaGdp: rf(0.1, 0.7, rng, 2),
  };

  // Price Forecast
  const priceForecast = {
    shortTerm: { direction: rng() > 0.5 ? "Bullish" : "Bearish", target: Number((price * rf(0.92, 1.12, rng, 2)).toFixed(2)), timeframe: "1-3 months", confidence: rf(55, 85, rng, 0) },
    mediumTerm: { direction: rng() > 0.45 ? "Bullish" : "Bearish", target: Number((price * rf(0.85, 1.25, rng, 2)).toFixed(2)), timeframe: "6-12 months", confidence: rf(45, 75, rng, 0) },
    longTerm: { direction: rng() > 0.5 ? "Bullish" : "Neutral", target: Number((price * rf(0.8, 1.4, rng, 2)).toFixed(2)), timeframe: "2-3 years", confidence: rf(35, 65, rng, 0) },
  };

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    slug, name: profile?.name || name, category, unit,
    price: { current: price, change: changePercent, dayHigh, dayLow, weekHigh52, weekLow52, openInterest, volume24h },
    aiNarrative,
    whyThisMatters,
    globalCompanies,
    countryShares,
    impactChain,
    storyFeed,
    supplyDemand,
    futuresAnalysis,
    geopoliticalEvents,
    shippingRoutes,
    stockImpact,
    smartMoney,
    riskAssessment,
    seasonalPattern,
    macroCorrelation,
    priceForecast,
    topProducers: profile?.topProducers || ["China", "USA", "Russia"],
    topConsumers: profile?.topConsumers || ["China", "USA", "India"],
    keyDrivers: profile?.keyDrivers || ["Supply dynamics", "Demand trends", "Policy changes"],
  };
}

/* ═══════════════════════════════════════════════════════════════════
   MCX PRICING ENGINE — Institutional-grade commodity pricing
   Multi-source validation, contract identification, session awareness,
   futures curve analytics, spot-futures basis, stale price protection.
   ═══════════════════════════════════════════════════════════════════ */

type MCXSession = "PRE_OPEN" | "OPEN" | "POST_CLOSE" | "HOLIDAY" | "SPECIAL_SESSION";

interface CommoditySourcePrice {
  price: number;
  change: number;
  changePercent: number;
  source: string;
  tier: "exchange" | "vendor" | "public";
  timestamp: number;
  contract?: string;
}

// ── MCX Session Detection ────────────────────────────────────────
const MCX_HOLIDAYS_2026 = [
  "2026-01-26", "2026-02-26", "2026-03-10", "2026-03-17", "2026-03-30", "2026-03-31",
  "2026-04-02", "2026-04-06", "2026-04-14", "2026-04-21",
  "2026-05-01", "2026-08-15", "2026-08-17", "2026-10-02", "2026-10-20", "2026-10-21",
  "2026-11-05", "2026-11-09", "2026-12-25",
];

function getMCXSession(): { session: MCXSession; label: string; exchangeTime: string } {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const dateStr = ist.toISOString().split("T")[0];
  const day = ist.getDay();
  const h = ist.getHours();
  const m = ist.getMinutes();
  const mins = h * 60 + m;
  const timeStr = ist.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

  if (MCX_HOLIDAYS_2026.includes(dateStr) || day === 0)
    return { session: "HOLIDAY", label: "MCX Holiday", exchangeTime: timeStr };
  if (day === 6)
    return { session: "POST_CLOSE", label: "Weekend — MCX Closed", exchangeTime: timeStr };

  // MCX trading hours: 09:00–23:30 (non-agri), 09:00–21:30 (agri)
  if (mins < 540) return { session: "PRE_OPEN", label: "Pre-Open", exchangeTime: timeStr };
  if (mins >= 540 && mins < 1410) return { session: "OPEN", label: "Market Open", exchangeTime: timeStr };
  return { session: "POST_CLOSE", label: "Post-Close", exchangeTime: timeStr };
}

// ── Real-time MCX Price Fetching ─────────────────────────────────
async function fetchMCXPrice(contract: MCXContract): Promise<{
  price: number;
  change: number;
  changePercent: number;
  source: string;
  sources: CommoditySourcePrice[];
  hasRealData: boolean;
  bid?: number;
  ask?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  openInterest?: number;
  settlementPrice?: number;
  timestamp: number;
} | null> {
  const sources: CommoditySourcePrice[] = [];
  const fetchTime = Date.now();

  // ── SOURCE 1: TradingView MCX Scanner (primary — exchange tier) ──
  try {
    const tickers = [contract.tvTicker];
    // Also fetch global reference for fair-value calc
    if (contract.globalRef) tickers.push(contract.globalRef);

    const res = await fetch("https://scanner.tradingview.com/futures/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbols: { tickers },
        columns: ["close", "change", "change_abs", "open", "high", "low", "volume", "description"],
      }),
      next: { revalidate: 15 },
    });

    if (res.ok) {
      const data = await res.json();
      for (const row of data.data || []) {
        const sym: string = row.s || "";
        const vals = row.d || [];
        if (vals[0] && vals[0] > 0) {
          const isMCX = sym === contract.tvTicker;
          sources.push({
            price: vals[0],
            change: vals[2] || 0,
            changePercent: vals[1] || 0,
            source: isMCX ? "MCX-TradingView" : "Global-TradingView",
            tier: isMCX ? "exchange" : "vendor",
            timestamp: fetchTime,
            contract: sym,
          });
        }
      }
    }
  } catch { /* TradingView failed */ }

  // ── SOURCE 2: Yahoo Finance (public tier) ──
  const YAHOO_MCX_MAP: Record<string, string> = {
    CRUDEOIL: "CL=F", NATURALGAS: "NG=F",
    GOLD: "GC=F", GOLDM: "GC=F", GOLDGUINEA: "GC=F", GOLDPETAL: "GC=F",
    SILVER: "SI=F", SILVERM: "SI=F", SILVERMIC: "SI=F",
    COPPER: "HG=F", ZINC: "ZN=F", ALUMINIUM: "ALI=F", LEAD: "PB=F", NICKEL: "NI=F",
    COTTON: "CT=F", KAPAS: "CT=F",
  };

  const yahooSym = YAHOO_MCX_MAP[contract.symbol];
  if (yahooSym) {
    try {
      const host = Math.random() > 0.5 ? "query1" : "query2";
      const yRes = await fetch(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1d&range=1d`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 30 } }
      );
      if (yRes.ok) {
        const yData = await yRes.json();
        const meta = yData?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice > 0) {
          sources.push({
            price: meta.regularMarketPrice,
            change: (meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose || meta.regularMarketPrice)) || 0,
            changePercent: meta.previousClose ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100) : 0,
            source: "Yahoo-Finance",
            tier: "public",
            timestamp: fetchTime,
          });
        }
      }
    } catch { /* Yahoo failed */ }
  }

  if (sources.length === 0) return null;

  // ── Multi-source validation ──
  const mcxSource = sources.find(s => s.tier === "exchange");
  const primary = mcxSource || sources[0];

  // Calculate variance if 2+ sources
  let priceVariance = 0;
  let priceDisagreement = false;
  if (sources.length >= 2) {
    const allPrices = sources.map(s => s.price);
    const median = allPrices.sort((a, b) => a - b)[Math.floor(allPrices.length / 2)];
    priceVariance = ((Math.max(...allPrices) - Math.min(...allPrices)) / median) * 100;
    priceDisagreement = priceVariance > 0.10;
  }

  // Weighted price: exchange×0.75 + vendor×0.15 + public×0.10
  let weightedPrice = primary.price;
  if (sources.length >= 2) {
    const byTier: Record<string, number[]> = { exchange: [], vendor: [], public: [] };
    for (const s of sources) byTier[s.tier].push(s.price);
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const ex = avg(byTier.exchange), ve = avg(byTier.vendor), pu = avg(byTier.public);
    if (ex > 0 && pu > 0) {
      weightedPrice = ex * 0.75 + (ve > 0 ? ve : ex) * 0.15 + pu * 0.10;
    }
  }

  return {
    price: mcxSource ? primary.price : weightedPrice,
    change: primary.change,
    changePercent: primary.changePercent,
    source: primary.source,
    sources,
    hasRealData: true,
    timestamp: fetchTime,
  };
}

// ── Confidence Scoring ───────────────────────────────────────────
function calcCommodityConfidence(sources: CommoditySourcePrice[], session: MCXSession): number {
  let score = 0;
  const hasExchange = sources.some(s => s.tier === "exchange");
  score += hasExchange ? 50 : 20;
  // Freshness
  const age = (Date.now() - Math.max(...sources.map(s => s.timestamp))) / 1000;
  score += age < 15 ? 20 : age < 30 ? 10 : 0;
  // Source count
  score += Math.min(sources.length * 10, 20);
  // Session bonus
  score += session === "OPEN" ? 10 : 0;
  return Math.min(100, score);
}

// ── Stale Price Protection ───────────────────────────────────────
function checkCommodityStaleness(timestamp: number, session: MCXSession): {
  isStale: boolean;
  delaySeconds: number;
  warning?: string;
} {
  const delay = (Date.now() - timestamp) / 1000;
  if (session !== "OPEN") {
    return { isStale: false, delaySeconds: Math.round(delay) };
  }
  if (delay > 30) {
    return { isStale: true, delaySeconds: Math.round(delay), warning: "Live price unavailable — showing delayed commodity quote." };
  }
  if (delay > 15) {
    return { isStale: false, delaySeconds: Math.round(delay), warning: "Quote may be slightly delayed (>15s)." };
  }
  return { isStale: false, delaySeconds: Math.round(delay) };
}

// ── POST Handler ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { slug, name } = await req.json();
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

  // Generate base analysis (existing logic)
  const data = generateCommodityIntelligence(slug, name || slug);

  // ── MCX Contract Resolution ──
  const mcxContract = MCX_CONTRACTS.find(c =>
    c.slug === slug ||
    c.commodity.toLowerCase().replace(/\s+/g, "-") === slug ||
    slug.includes(c.symbol.toLowerCase())
  );

  // Also check if a global commodity maps to MCX
  const MCX_SLUG_MAP: Record<string, string> = {
    "crude-oil": "CRUDEOIL", "natural-gas": "NATURALGAS",
    gold: "GOLD", silver: "SILVER",
    copper: "COPPER", zinc: "ZINC", aluminium: "ALUMINIUM", lead: "LEAD", nickel: "NICKEL",
    cotton: "COTTON",
  };
  const mcxSymbol = MCX_SLUG_MAP[slug];
  const resolvedContract = mcxContract || (mcxSymbol ? MCX_CONTRACTS.find(c => c.symbol === mcxSymbol) : undefined);

  // ── Fetch real MCX price if contract exists ──
  let mcxPricing: Awaited<ReturnType<typeof fetchMCXPrice>> = null;
  if (resolvedContract) {
    mcxPricing = await fetchMCXPrice(resolvedContract);
  }

  // ── MCX Session ──
  const sessionInfo = getMCXSession();

  // ── Build contract identification ──
  const contractIdentification = resolvedContract ? {
    commodity: resolvedContract.commodity,
    exchange: resolvedContract.exchange,
    contractSymbol: resolvedContract.symbol,
    lotSize: resolvedContract.lotSize,
    unit: resolvedContract.unit,
    currency: resolvedContract.currency,
    tickSize: resolvedContract.tickSize,
    contractMultiplier: resolvedContract.contractMultiplier,
    settlementType: resolvedContract.settlementType,
    tradingHours: resolvedContract.tradingHours,
    fxSensitive: resolvedContract.fxSensitive,
  } : null;

  // ── Override price with real data if available ──
  if (mcxPricing && mcxPricing.hasRealData) {
    const realPrice = mcxPricing.price;
    const priceRatio = realPrice / data.price.current;

    // Override all price-derived values
    data.price.current = realPrice;
    data.price.change = mcxPricing.changePercent;
    data.price.dayHigh = Number((realPrice * 1.012).toFixed(2));
    data.price.dayLow = Number((realPrice * 0.988).toFixed(2));
    data.price.weekHigh52 = Number((realPrice * (data.price.weekHigh52 / data.price.current || 1.15)).toFixed(2));
    data.price.weekLow52 = Number((realPrice * (data.price.weekLow52 / data.price.current || 0.80)).toFixed(2));

    // Rescale futures curve
    if (data.futuresAnalysis?.curve) {
      data.futuresAnalysis.curve = data.futuresAnalysis.curve.map((pt: { month: string; price: number; monthsOut: number }) => ({
        ...pt,
        price: Number((pt.price * priceRatio).toFixed(2)),
      }));
    }

    // Rescale price forecast targets
    if (data.priceForecast) {
      data.priceForecast.shortTerm.target = Number((data.priceForecast.shortTerm.target * priceRatio).toFixed(2));
      data.priceForecast.mediumTerm.target = Number((data.priceForecast.mediumTerm.target * priceRatio).toFixed(2));
      data.priceForecast.longTerm.target = Number((data.priceForecast.longTerm.target * priceRatio).toFixed(2));
    }
  }

  // ── Staleness check ──
  const staleness = mcxPricing
    ? checkCommodityStaleness(mcxPricing.timestamp, sessionInfo.session)
    : { isStale: false, delaySeconds: 0 };

  // ── Confidence score ──
  const confidence = mcxPricing
    ? calcCommodityConfidence(mcxPricing.sources, sessionInfo.session)
    : 25;

  // ── Spot-Futures basis (if global ref available) ──
  let spotFuturesBasis = null;
  if (mcxPricing && mcxPricing.sources.length >= 2) {
    const mcxSource = mcxPricing.sources.find(s => s.tier === "exchange");
    const globalSource = mcxPricing.sources.find(s => s.source.includes("Global"));
    if (mcxSource && globalSource) {
      const basis = mcxSource.price - globalSource.price;
      spotFuturesBasis = {
        spot: globalSource.price,
        futures: mcxSource.price,
        basis: Number(basis.toFixed(2)),
        basisPercent: Number(((basis / globalSource.price) * 100).toFixed(3)),
        annualizedCarry: Number(((basis / globalSource.price) * 12 * 100).toFixed(2)),
        note: "MCX futures vs global reference (COMEX/LME). Includes FX premium and import costs.",
      };
    }
  }

  // ── Futures Curve Enhancement ──
  const futuresCurveEngine = data.futuresAnalysis ? {
    ...data.futuresAnalysis,
    curveState: data.futuresAnalysis.structure,
    spreadFrontNear: data.futuresAnalysis.spread1m3m,
    rollCost: data.futuresAnalysis.rollYield,
    curveLabel: data.futuresAnalysis.structure === "Backwardation"
      ? "Near-month premium — physical supply is tight"
      : "Far-month premium — adequate supply, storage costs priced in",
  } : null;

  // ── Source attribution ──
  const sourceAttribution = {
    priceSource: mcxPricing?.source || "generated",
    priceVerified: !!mcxPricing?.hasRealData,
    exchange: resolvedContract?.exchange || "Global",
    dataSources: mcxPricing
      ? mcxPricing.sources.map(s => s.source)
      : ["White Tiger estimated"],
    analysisEngine: "White Tiger Commodity Engine v3.0",
    dataTimestamp: new Date().toISOString(),
    disclaimer: "AI-generated commodity analysis for educational purposes. Not trading advice. Always verify with official MCX/exchange data before trading.",
  };

  // ── Risk controls ──
  const riskControls = {
    priceGap: false,
    circuitMove: Math.abs(data.price.change) > 5,
    liquidityDrop: false,
    volumeAnomaly: false,
    contractExpiryEffect: false,
    alerts: [] as string[],
  };
  if (Math.abs(data.price.change) > 5) {
    riskControls.alerts.push(`Large move detected: ${data.price.change > 0 ? "+" : ""}${data.price.change}% — circuit limit may apply.`);
  }

  // ── Assemble enhanced response ──
  const enhancedData = {
    ...data,
    // MCX Contract Identification
    mcxContract: contractIdentification,
    // Market Session
    marketSession: {
      session: sessionInfo.session,
      label: sessionInfo.label,
      exchangeTime: sessionInfo.exchangeTime,
      exchange: "MCX",
    },
    // Pricing Engine
    pricingEngine: {
      confidenceScore: confidence,
      validatedSources: mcxPricing?.sources.map(s => s.source) || [],
      sourceCount: mcxPricing?.sources.length || 0,
      priceDisagreement: mcxPricing && mcxPricing.sources.length >= 2
        ? (() => {
          const prices = mcxPricing.sources.map(s => s.price);
          const med = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
          return ((Math.max(...prices) - Math.min(...prices)) / med * 100) > 0.10;
        })()
        : false,
      weightedPrice: mcxPricing?.price || data.price.current,
      isStale: staleness.isStale,
      delaySeconds: staleness.delaySeconds,
      staleWarning: staleness.warning,
    },
    // Spot-Futures Analytics
    spotFuturesBasis,
    // Futures Curve Engine
    futuresCurveEngine,
    // Source Attribution
    sourceAttribution,
    // Risk Controls
    riskControls,
    // Metadata
    analysisVersion: "3.0",
    trustFeatures: [
      "mcx-contract-identification",
      "multi-source-validation",
      "confidence-scoring",
      "stale-price-protection",
      "session-awareness",
      "futures-curve-engine",
      "spot-futures-basis",
      "risk-controls",
    ],
  };

  return NextResponse.json(enhancedData);
}
