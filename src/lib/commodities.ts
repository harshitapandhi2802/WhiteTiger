export interface CommodityEntry {
  name: string;
  symbol: string;
  category: string;
  exchange: string;
  unit: string;
}

export const MCX_COMMODITIES: CommodityEntry[] = [
  // ── Oil & Energy ──
  { name: "Crude Oil", symbol: "CRUDEOIL", category: "Energy", exchange: "MCX", unit: "₹/barrel" },
  { name: "Crude Oil Mini", symbol: "CRUDEOILM", category: "Energy", exchange: "MCX", unit: "₹/barrel" },
  { name: "Natural Gas", symbol: "NATURALGAS", category: "Energy", exchange: "MCX", unit: "₹/mmBtu" },
  { name: "Natural Gas Mini", symbol: "NATGASMINI", category: "Energy", exchange: "MCX", unit: "₹/mmBtu" },
  // International Oil Benchmarks (for analysis context)
  { name: "Brent Crude", symbol: "BRENT", category: "Energy", exchange: "ICE", unit: "$/barrel" },
  { name: "WTI Crude (NYMEX)", symbol: "WTI", category: "Energy", exchange: "NYMEX", unit: "$/barrel" },
  { name: "Dubai Crude", symbol: "DUBAI", category: "Energy", exchange: "DME", unit: "$/barrel" },
  { name: "OPEC Basket", symbol: "OPEC", category: "Energy", exchange: "OPEC", unit: "$/barrel" },
  { name: "Heating Oil", symbol: "HEATINGOIL", category: "Energy", exchange: "NYMEX", unit: "$/gallon" },
  { name: "Gasoline (RBOB)", symbol: "RBOB", category: "Energy", exchange: "NYMEX", unit: "$/gallon" },

  // ── Precious Metals ──
  { name: "Gold", symbol: "GOLD", category: "Precious Metals", exchange: "MCX", unit: "₹/10g" },
  { name: "Gold Mini", symbol: "GOLDM", category: "Precious Metals", exchange: "MCX", unit: "₹/10g" },
  { name: "Gold Guinea", symbol: "GOLDGUINEA", category: "Precious Metals", exchange: "MCX", unit: "₹/8g" },
  { name: "Gold Petal", symbol: "GOLDPETAL", category: "Precious Metals", exchange: "MCX", unit: "₹/1g" },
  { name: "Silver", symbol: "SILVER", category: "Precious Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Silver Mini", symbol: "SILVERM", category: "Precious Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Silver Micro", symbol: "SILVERMIC", category: "Precious Metals", exchange: "MCX", unit: "₹/kg" },

  // ── Base Metals ──
  { name: "Aluminium", symbol: "ALUMINIUM", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Aluminium Mini", symbol: "ALUMINI", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Copper", symbol: "COPPER", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Copper Mini", symbol: "COPPERM", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Zinc", symbol: "ZINC", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Zinc Mini", symbol: "ZINCMINI", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Lead", symbol: "LEAD", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Lead Mini", symbol: "LEADMINI", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Nickel", symbol: "NICKEL", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },
  { name: "Nickel Mini", symbol: "NICKELM", category: "Base Metals", exchange: "MCX", unit: "₹/kg" },

  // ── Agricultural / Agri ──
  { name: "Cotton", symbol: "COTTON", category: "Agriculture", exchange: "MCX", unit: "₹/bale" },
  { name: "Mentha Oil", symbol: "MENTHAOIL", category: "Agriculture", exchange: "MCX", unit: "₹/kg" },
  { name: "Crude Palm Oil", symbol: "CPO", category: "Agriculture", exchange: "MCX", unit: "₹/10kg" },
  { name: "Castor Seed", symbol: "CASTORSEED", category: "Agriculture", exchange: "NCDEX", unit: "₹/quintal" },
  { name: "Turmeric", symbol: "TURMERIC", category: "Agriculture", exchange: "NCDEX", unit: "₹/quintal" },
  { name: "Jeera (Cumin)", symbol: "JEERA", category: "Agriculture", exchange: "NCDEX", unit: "₹/quintal" },
  { name: "Coriander", symbol: "DHANIYA", category: "Agriculture", exchange: "NCDEX", unit: "₹/quintal" },
  { name: "Soybean", symbol: "SOYBEAN", category: "Agriculture", exchange: "NCDEX", unit: "₹/quintal" },
  { name: "Mustard Seed", symbol: "RMSEED", category: "Agriculture", exchange: "NCDEX", unit: "₹/quintal" },
  { name: "Guarseed", symbol: "GUARSEED", category: "Agriculture", exchange: "NCDEX", unit: "₹/quintal" },
  { name: "Guar Gum", symbol: "GUARGUM", category: "Agriculture", exchange: "NCDEX", unit: "₹/quintal" },

  // ── International Commodities (for analysis) ──
  { name: "Iron Ore", symbol: "IRONORE", category: "Industrial", exchange: "SGX", unit: "$/tonne" },
  { name: "Steel (HRC)", symbol: "STEELHRC", category: "Industrial", exchange: "LME", unit: "$/tonne" },
  { name: "Tin", symbol: "TIN", category: "Base Metals", exchange: "LME", unit: "$/tonne" },
  { name: "Platinum", symbol: "PLATINUM", category: "Precious Metals", exchange: "NYMEX", unit: "$/oz" },
  { name: "Palladium", symbol: "PALLADIUM", category: "Precious Metals", exchange: "NYMEX", unit: "$/oz" },
  { name: "Lithium", symbol: "LITHIUM", category: "Industrial", exchange: "Global", unit: "$/tonne" },
  { name: "Cobalt", symbol: "COBALT", category: "Industrial", exchange: "LME", unit: "$/tonne" },
  { name: "Uranium", symbol: "URANIUM", category: "Energy", exchange: "Global", unit: "$/lb" },
  { name: "Coal", symbol: "COAL", category: "Energy", exchange: "ICE", unit: "$/tonne" },
];

export const COMMODITY_CATEGORIES = [
  "All",
  "Energy",
  "Precious Metals",
  "Base Metals",
  "Agriculture",
  "Industrial",
];

export function searchCommodities(query: string, limit = 8): CommodityEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: { commodity: CommodityEntry; score: number }[] = [];

  for (const c of MCX_COMMODITIES) {
    const name = c.name.toLowerCase();
    const sym = c.symbol.toLowerCase();
    const cat = c.category.toLowerCase();

    let score = 0;
    if (name === q || sym === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (sym.startsWith(q)) score = 75;
    else if (name.includes(q)) score = 50;
    else if (sym.includes(q)) score = 45;
    else if (cat.includes(q)) score = 20;
    else {
      const words = q.split(/\s+/);
      const matched = words.filter(w => name.includes(w) || sym.includes(w) || cat.includes(w));
      if (matched.length > 0) score = 10 + matched.length * 15;
    }
    if (score > 0) results.push({ commodity: c, score });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit).map(r => r.commodity);
}
