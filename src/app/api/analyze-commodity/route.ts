import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { symbol, name, category, exchange, unit } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: "Commodity symbol is required" }, { status: 400 });
  }

  const commodityName = name || symbol;

  const prompt = `You are a senior commodity research analyst at a top-tier global trading house (Glencore / Trafigura / Vitol caliber) with deep expertise in MCX/NYMEX/LME commodity markets, geopolitical risk, OPEC dynamics, global supply chains, and Indian commodity markets.

Conduct an INSTITUTIONAL-GRADE comprehensive commodity analysis for **${commodityName}** (Symbol: ${symbol}, Exchange: ${exchange || "MCX"}, Category: ${category || "Commodity"}, Unit: ${unit || "₹"}).

Use insights from platforms like Koyfin for international market trends, supply-demand dynamics, and cross-commodity correlations.

You MUST output your analysis in TWO parts:

**PART 1: DETAILED MARKDOWN ANALYSIS**
**PART 2: A JSON SCORES BLOCK** at the very end.

---

## PART 1: ANALYSIS

### 1. Commodity Overview & Rating
- Give one of: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
- Current approximate price and 12-month price target
- What drives this commodity's price? Key demand/supply factors
- India's role: Is India a net importer or exporter? How much does India depend on this commodity?

### 2. Supply-Demand Dynamics
- Global production leaders and their current output trends
- Demand centers: Which countries/industries consume the most?
- Current inventory levels: LME/COMEX/MCX warehouses
- Production cuts, expansions, or disruptions
- Seasonal patterns affecting price

### 3. Oil Market Dynamics (if energy commodity)
If this is an oil/energy commodity, provide detailed analysis of:
- OPEC+ production decisions and compliance
- US shale production trends
- SPR (Strategic Petroleum Reserve) activity
- Refinery capacity and utilization
- Crack spreads and refining margins
- Brent-WTI spread analysis
- Dubai/Oman benchmark relevance for Asian markets
- LNG market dynamics (if natural gas)

### 4. Geopolitical & Macro Factors
- How do US-China trade tensions affect this commodity?
- Russia-Ukraine war impact on supply
- Middle East tensions: Red Sea, Strait of Hormuz, Iran sanctions
- India's trade policies: Import duties, strategic reserves, PLI schemes
- Central bank policies: How do US Fed/RBI rate decisions affect commodity prices?
- USD/INR impact on MCX prices
- Geopolitical risk score: X/10

### 5. India-Specific Analysis
- MCX trading volume and open interest trends
- India's import dependency for this commodity
- Domestic production capacity
- Government policies: PLI, Make in India, EV push, infrastructure spending
- Impact on Indian industries that use this commodity
- Key Indian companies exposed to this commodity

### 6. International Market Correlation (Koyfin-style Analysis)
- Correlation with USD (DXY index)
- Correlation with US 10Y Treasury yields
- Correlation with other commodities (cross-commodity analysis)
- Correlation with equity indices (Nifty, S&P 500)
- Volatility analysis: Historical vs implied volatility
- Term structure: Contango or backwardation?

### 7. Technical Analysis
- Key support and resistance levels
- Moving average analysis (50-day, 200-day)
- RSI and momentum indicators
- Volume trends
- Chart pattern identification

### 8. Scenario Analysis

| Scenario | Trigger | Price Target | Probability | Timeframe |
|----------|---------|-------------|------------|-----------|
| Bull | [describe] | [price] | X% | [months] |
| Base | [describe] | [price] | X% | [months] |
| Bear | [describe] | [price] | X% | [months] |

### 9. Trade Strategy
- Ideal entry zone
- Stop loss level
- Target (3-month and 12-month)
- Position sizing for MCX
- Hedging recommendations for Indian businesses

### 10. Key Risks
5-6 concrete risks including at least 2 geopolitical risks.

### 11. Verdict
**Medium-Term Outlook: BULLISH / NEUTRAL / BEARISH**
One decisive paragraph for an Indian commodity trader/investor.

---

## PART 2: SCORES JSON

\`\`\`json
{
  "rating": "STRONG BUY/BUY/HOLD/SELL/STRONG SELL",
  "outlook": "BULLISH/NEUTRAL/BEARISH",
  "currentPrice": 0,
  "targetPrice3M": 0,
  "targetPrice12M": 0,
  "upside": 0,
  "scores": {
    "geopoliticalRisk": 0,
    "supplyRisk": 0,
    "demandStrength": 0,
    "volatility": 0,
    "indiaExposure": 0,
    "usdCorrelation": 0,
    "seasonality": 0,
    "technicalStrength": 0
  },
  "supplyDemand": {
    "globalProduction": "",
    "globalDemand": "",
    "inventoryStatus": "HIGH/NORMAL/LOW",
    "marketBalance": "SURPLUS/BALANCED/DEFICIT"
  },
  "scenarios": {
    "bull": { "probability": 0, "target": 0, "trigger": "" },
    "base": { "probability": 0, "target": 0, "trigger": "" },
    "bear": { "probability": 0, "target": 0, "trigger": "" }
  },
  "topProducers": ["country1", "country2", "country3"],
  "topConsumers": ["country1", "country2", "country3"],
  "correlatedCommodities": ["commodity1", "commodity2"],
  "indianCompaniesExposed": ["company1", "company2"]
}
\`\`\`

All scores are 1-10. Fill ALL fields with realistic estimates. Be specific with numbers and current market data. Write like a Goldman Sachs commodities research note.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 12000, temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini error:", err);
      return NextResponse.json({ error: `Gemini API error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let analysis = text;
    let scores = null;

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        scores = JSON.parse(jsonMatch[1]);
        analysis = text.replace(/```json\s*[\s\S]*?\s*```/, "").trim();
      } catch { /* scores parsing failed */ }
    }

    return NextResponse.json({ analysis, scores, symbol, name: commodityName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Commodity analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
