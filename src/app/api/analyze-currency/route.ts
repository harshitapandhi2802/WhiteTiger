import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/services/apiGuard";

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "analyze-currency", limit: 5, windowMs: 60000 });
  if (limited) return limited;
  const { symbol, name, category, pair, base, quote } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: "Currency pair is required" }, { status: 400 });
  }

  const currencyName = name || pair || symbol;

  const prompt = `You are a senior FX strategist at a top-tier global bank (JPMorgan / Goldman Sachs / Deutsche Bank caliber) with deep expertise in forex markets, central bank policies, carry trades, macro economics, and Indian rupee dynamics (RBI interventions, NDF markets, FBIL fixing).

Conduct an INSTITUTIONAL-GRADE comprehensive currency analysis for **${currencyName}** (Symbol: ${symbol}, Pair: ${pair || symbol}, Category: ${category || "Forex"}, Base: ${base || ""}, Quote: ${quote || ""}).

Focus on Indian forex market context — NSE currency futures, RBI policy, NDF-onshore spread, and impact on Indian importers/exporters.

You MUST output your analysis in TWO parts:

**PART 1: DETAILED MARKDOWN ANALYSIS**
**PART 2: A JSON SCORES BLOCK** at the very end.

---

## PART 1: ANALYSIS

### 1. Currency Overview & Rating
- Give one of: STRONG BUY / BUY / HOLD / SELL / STRONG SELL (from base currency perspective)
- Current approximate exchange rate
- 52-week range
- YTD performance
- What drives this pair? Key fundamental factors

### 2. Central Bank Policy Analysis
- Base currency central bank: current rate, stance (hawkish/dovish), forward guidance
- Quote currency central bank: current rate, stance, forward guidance
- Interest rate differential and carry trade attractiveness
- Expected rate path for next 12 months
- Impact of US Fed policy on this pair

### 3. RBI & Indian Forex Policy (if INR pair)
- RBI's current stance on rupee management
- Forex reserves adequacy
- NDF vs onshore spread analysis
- RBI intervention patterns
- FBIL reference rate dynamics
- Capital flow trends (FII/FDI)

### 4. Macro Fundamentals
- GDP growth differential between base and quote economies
- Trade balance and current account dynamics
- Inflation differentials
- Terms of trade analysis
- Fiscal deficit impact
- Employment data trends

### 5. Geopolitical Risk Assessment
- Trade war risks affecting this pair
- Sanctions or diplomatic tensions
- Commodity price linkages (if commodity currency)
- Safe haven flows analysis
- Election/political risks
- Geopolitical risk score: X/10

### 6. Technical Analysis
- Key support and resistance levels
- Moving average analysis (50-day, 200-day)
- RSI and momentum indicators
- Bollinger Band analysis
- Key Fibonacci retracement levels
- Trend direction and strength

### 7. India Impact Analysis
- How does this pair movement affect Indian economy?
- Impact on Indian importers and exporters
- Impact on IT sector (if USD pair)
- Oil import bill impact
- Remittance flow impact
- NSE currency futures trading strategy

### 8. Scenario Analysis

| Scenario | Trigger | Rate Target | Probability | Timeframe |
|----------|---------|------------|------------|-----------|
| Bull (base strengthens) | [describe] | [rate] | X% | [months] |
| Base | [describe] | [rate] | X% | [months] |
| Bear (base weakens) | [describe] | [rate] | X% | [months] |

### 9. Trading Strategy
- Ideal entry zone
- Stop loss level
- 3-month and 12-month targets
- Hedging recommendation for Indian businesses
- Carry trade assessment
- Best instruments: spot, futures, options

### 10. Key Risks
5-6 concrete risks including central bank surprises, geopolitical events, and policy changes.

### 11. Verdict
**Outlook: BULLISH / NEUTRAL / BEARISH** (for base currency)
One decisive paragraph for an Indian forex trader/hedger.

---

## PART 2: SCORES JSON

\`\`\`json
{
  "rating": "STRONG BUY/BUY/HOLD/SELL/STRONG SELL",
  "outlook": "BULLISH/NEUTRAL/BEARISH",
  "currentRate": 0,
  "target3M": 0,
  "target12M": 0,
  "change52W": 0,
  "scores": {
    "centralBankDivergence": 0,
    "carryAttractiveness": 0,
    "geopoliticalRisk": 0,
    "volatility": 0,
    "technicalStrength": 0,
    "macroFundamentals": 0,
    "indiaImpact": 0,
    "liquiditySentiment": 0
  },
  "centralBanks": {
    "baseCBRate": 0,
    "quoteCBRate": 0,
    "rateDifferential": 0,
    "baseStance": "HAWKISH/NEUTRAL/DOVISH",
    "quoteStance": "HAWKISH/NEUTRAL/DOVISH"
  },
  "scenarios": {
    "bull": { "probability": 0, "target": 0, "trigger": "" },
    "base": { "probability": 0, "target": 0, "trigger": "" },
    "bear": { "probability": 0, "target": 0, "trigger": "" }
  },
  "correlatedPairs": ["pair1", "pair2"],
  "impactedSectors": ["sector1", "sector2"],
  "impactedIndianCompanies": ["company1", "company2"]
}
\`\`\`

All scores are 1-10. Fill ALL fields with realistic estimates. Write like a JPMorgan FX research note.`;

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

    return NextResponse.json({ analysis, scores, symbol, name: currencyName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Currency analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
