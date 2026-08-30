import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/services/apiGuard";
import { fetchLiveStockPrice } from "@/lib/services/livePrice";

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "analyze", limit: 5, windowMs: 60000 });
  if (limited) return limited;
  const { ticker, companyName } = await req.json();

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  const name = companyName || ticker;

  // D1 — Ground the report in a LIVE price instead of the model's stale memory.
  const live = await fetchLiveStockPrice(ticker);
  const priceLine = live
    ? `- Current Market Price: ₹${live.price.toFixed(2)} (LIVE, from ${live.source} as of ${new Date(live.asOf).toISOString()}). Use THIS exact figure as the current price everywhere in your analysis; do not substitute a remembered price.`
    : `- Current Market Price: state that a live price could not be fetched and clearly label any price you use as an estimate.`;

  const prompt = `You are a senior equity research analyst at a top-tier Indian investment bank (Goldman Sachs / Morgan Stanley India caliber) with deep expertise in geopolitical risk, global macro, commodity markets, supply chain intelligence, and Indian markets.

Conduct an INSTITUTIONAL-GRADE comprehensive analysis for **${name}** (${ticker}) listed on NSE/BSE.

You MUST output your analysis in TWO parts:

**PART 1: DETAILED MARKDOWN ANALYSIS** covering ALL sections below.
**PART 2: A JSON SCORES BLOCK** at the very end, starting with \`\`\`json and ending with \`\`\`.

---

## PART 1: ANALYSIS

### 1. Investment Rating & Fair Value

Give one of: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
Explain in 2-3 sentences with macro/geopolitical context.

**Fair Value Estimate (DCF):**
- Fair Value: ₹[X] per share
${priceLine}
- Upside/Downside: [Z]% (compute from the live current price above)
- WACC: X% | Terminal Growth Rate: Y% | Horizon: 5 years
Brief DCF reasoning.

### 2. Business & Import Dependency

- Core business, sector, revenue drivers
- Key imported raw materials/products with source countries
- Current global trade conditions affecting imports
- Tariff exposure, sanctions risk, trade war impact
- Shipping disruptions, inflation impact, currency risks
- Supply concentration risk assessment

### 3. Commodity Exposure & Margin Impact

- Major commodities impacting the business (list each)
- How commodity price changes affect: Costs, EBITDA margins, Profitability, Cash flows
- Financial exposure under 3 scenarios: Bull (commodity prices drop 15%), Base, Bear (commodity prices rise 25%)
- For each scenario give: estimated EBITDA margin impact, revenue impact
- Pricing power assessment: can they pass costs to customers? Rate 1-10

### 4. Financial Snapshot

- Revenue CAGR (3-year)
- EBITDA margin range
- Debt-to-Equity ratio
- Return on Equity (ROE)
- P/E vs sector average
- Free Cash Flow trend
- Working capital days

### 5. Political & Geopolitical Risk

- India's relationship with countries connected to imports/exports
- Historical diplomatic alignment analysis
- Sanctions/conflict risks from key trading partners
- Political instability in source/destination countries
- US-India trade relations impact
- China factor: China+1 beneficiary or threat?
- Future geopolitical outlook (12-24 months)
- Geopolitical risk score: X/10 with reasoning

### 6. India Dependency & Future Demand

- How important is this company's products/commodities for India?
- Import dependency percentage
- Domestic demand outlook (3-5 years)
- Government initiatives impact: PLI, Make in India, EVs, infrastructure, semiconductors, defense, energy transition
- Long-term India growth potential assessment

### 7. Supply Chain & Hedging Analysis

- Supplier diversification assessment
- Alternate sourcing options
- Inventory strength (days of inventory)
- Commodity hedging status and strategy
- Currency hedging status
- Backward integration capability
- Working capital resilience
- Supply chain stability score: X/10

### 8. Port & Trade Route Strategic Analysis

- Key ports used for imports and exports
- Geopolitical importance of these ports
- Trade route risks: Red Sea, Strait of Hormuz, Malacca Strait exposure
- Piracy, blockade, or war risks on trade routes
- If export-oriented: destination port analysis
- Trade route risk score: X/10

### 9. Foreign Holding & Ownership Structure

- FII/FPI holding percentage and trend
- Promoter holding percentage and trend (increasing/decreasing)
- Domestic institutional ownership (DII)
- Retail participation level
- Pledge percentage if any
- Foreign ownership vulnerability assessment during global crises
- Ownership risk score: X/10

### 10. Management & Leadership Analysis

- Management quality and governance history
- Past controversies, legal issues, or political connections
- Reputation of promoters and leadership team
- Capital allocation track record
- Corporate governance rating
- Key strategic decisions in last 5 years
- Management quality score: X/10

### 11. Future Leadership & Succession

- Likely successor or next-gen leadership
- Successor background and experience
- Leadership style comparison (current vs successor)
- Strategic vision of incoming leadership
- Market perception of succession
- Impact on company growth and investor confidence

### 12. Investment Thesis

5-6 bullet points — specific segments, products, competitive advantages, and why NOW is/isn't good.

### 13. Key Catalysts (Next 12 months)

4-5 specific near-term triggers including domestic and global events.

### 14. Key Risks

6-8 concrete risks — at least 3 must be geopolitical/macro/supply-chain risks.

### 15. Smart Entry Strategy

- Ideal buy zone: ₹[X] – ₹[Y]
- Stop loss: ₹[Z]
- Target (12 months): ₹[W]
- Position sizing recommendation

### 16. Scenario Analysis

Present 3 scenarios in a table format:

| Scenario | Trigger | Revenue Impact | Margin Impact | Stock Price Target | Probability |
|----------|---------|---------------|---------------|-------------------|------------|
| Bull | [describe] | +X% | +Y bps | ₹[Z] | X% |
| Base | [describe] | X% | Y bps | ₹[Z] | X% |
| Bear | [describe] | -X% | -Y bps | ₹[Z] | X% |

### 17. Verdict

**Outlook: BULLISH / NEUTRAL / BEARISH**

One decisive paragraph for a strategic long-term Indian investor considering global macro, geopolitics, commodity cycles, and supply chain realities.

---

## PART 2: SCORES JSON

After your markdown analysis, output this EXACT JSON block with numerical scores. This is CRITICAL for rendering visual dashboards:

\`\`\`json
{
  "investmentRating": "STRONG BUY/BUY/HOLD/SELL/STRONG SELL",
  "outlook": "BULLISH/NEUTRAL/BEARISH",
  "fairValue": 0,
  "currentPrice": 0,
  "targetPrice": 0,
  "upside": 0,
  "scores": {
    "geopoliticalRisk": 0,
    "commodityRisk": 0,
    "supplyChainStability": 0,
    "managementQuality": 0,
    "foreignOwnershipRisk": 0,
    "tradeRouteRisk": 0,
    "pricingPower": 0,
    "indiaGrowthPotential": 0
  },
  "financials": {
    "revenueCagr": 0,
    "ebitdaMargin": 0,
    "debtToEquity": 0,
    "roe": 0,
    "pe": 0,
    "sectorPe": 0
  },
  "ownership": {
    "promoter": 0,
    "fii": 0,
    "dii": 0,
    "retail": 0,
    "pledge": 0
  },
  "scenarios": {
    "bull": { "probability": 0, "target": 0, "marginImpact": "" },
    "base": { "probability": 0, "target": 0, "marginImpact": "" },
    "bear": { "probability": 0, "target": 0, "marginImpact": "" }
  },
  "commodityExposure": [
    { "name": "commodity name", "impact": "HIGH/MEDIUM/LOW", "direction": "negative/positive/neutral" }
  ],
  "keyPorts": ["port1", "port2"],
  "tradeRoutes": ["route1", "route2"],
  "topImportCountries": ["country1", "country2"]
}
\`\`\`

All scores are 1-10 (1=worst/highest risk, 10=best/lowest risk). Fill ALL fields with realistic estimates. Be specific with numbers. Label estimates clearly. Write like a Goldman Sachs India institutional research note.`;

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
      } catch {
        // scores parsing failed, just use text
      }
    }

    // D1 — Authoritative override: force the live price into the scores and
    // recompute upside from it so the dashboard never shows a hallucinated price.
    if (scores && live) {
      scores.currentPrice = +live.price.toFixed(2);
      const tgt = Number(scores.targetPrice) || Number(scores.fairValue) || 0;
      if (tgt > 0) scores.upside = +(((tgt - live.price) / live.price) * 100).toFixed(1);
      scores.priceSource = live.source;
      scores.priceAsOf = live.asOf;
    }

    return NextResponse.json({
      analysis,
      scores,
      ticker,
      companyName,
      livePrice: live ? { price: +live.price.toFixed(2), changePercent: +live.changePercent.toFixed(2), source: live.source, asOf: live.asOf } : null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
