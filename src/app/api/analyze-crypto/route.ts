import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/services/apiGuard";

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "analyze-crypto", limit: 5, windowMs: 60000 });
  if (limited) return limited;
  const { symbol, name, category, pair } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: "Crypto symbol is required" }, { status: 400 });
  }

  const cryptoName = name || symbol;

  const prompt = `You are a senior cryptocurrency research analyst at a top-tier digital asset fund (a]16z Crypto / Paradigm / Pantera Capital caliber) with deep expertise in blockchain technology, DeFi, tokenomics, on-chain analytics, and Indian crypto markets (CoinDCX, WazirX ecosystem).

Conduct an INSTITUTIONAL-GRADE comprehensive crypto analysis for **${cryptoName}** (Symbol: ${symbol}, Category: ${category || "Crypto"}, Trading Pair: ${pair || symbol + "/INR"}).

Use insights relevant to CoinDCX trading pairs and Indian crypto investors. Consider Indian tax regulations (30% crypto tax + 1% TDS).

You MUST output your analysis in TWO parts:

**PART 1: DETAILED MARKDOWN ANALYSIS**
**PART 2: A JSON SCORES BLOCK** at the very end.

---

## PART 1: ANALYSIS

### 1. Token Overview & Rating
- Give one of: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
- Current approximate price in both USD and INR
- Market cap ranking and dominance
- What is this project? Core value proposition in 2-3 sentences
- Category: ${category || "Crypto"} — why does this category matter?

### 2. Tokenomics & Supply Analysis
- Total supply vs circulating supply
- Inflation/deflation mechanism
- Token unlock schedule (any upcoming unlocks?)
- Staking yield if applicable
- Token utility: governance, gas, staking, fees
- Concentration: Top wallet holdings

### 3. Technology & Development
- Blockchain architecture and consensus mechanism
- TPS (transactions per second) and scalability
- Recent protocol upgrades or roadmap milestones
- Developer activity: GitHub commits, active developers
- Ecosystem: Number of dApps, TVL (Total Value Locked)
- Competitive advantages vs similar projects

### 4. On-Chain Analytics
- Active addresses trend (30-day, 90-day)
- Transaction volume trends
- Whale wallet movements
- Exchange inflows/outflows (buying or selling pressure)
- Network revenue/fees trend
- NVT ratio analysis

### 5. Market Dynamics
- Current market cycle position: accumulation/markup/distribution/markdown
- Bitcoin dominance impact
- Correlation with BTC and ETH
- Institutional adoption signals
- ETF status (if applicable)
- Trading volume on CoinDCX vs global exchanges

### 6. India-Specific Analysis
- CoinDCX availability and trading pair liquidity
- Indian retail sentiment and adoption
- 30% crypto tax impact on trading strategy
- 1% TDS impact on frequent trading
- RBI and SEBI regulatory stance
- Best accumulation strategy for Indian investors considering tax

### 7. Geopolitical & Macro Impact
- US SEC regulatory actions affecting this token
- Global regulatory trends (EU MiCA, Japan, Singapore)
- Impact of US Fed rate decisions on crypto markets
- Correlation with traditional risk assets
- De-dollarization narrative relevance
- Geopolitical risk score: X/10

### 8. Technical Analysis
- Key support and resistance levels (in USD and INR)
- Moving averages: 50-day, 200-day
- RSI and MACD signals
- Volume profile
- Key Fibonacci levels

### 9. Scenario Analysis

| Scenario | Trigger | Price Target (USD) | INR Target | Probability | Timeframe |
|----------|---------|-------------------|-----------|------------|-----------|
| Bull | [describe] | $[X] | ₹[Y] | X% | [months] |
| Base | [describe] | $[X] | ₹[Y] | X% | [months] |
| Bear | [describe] | $[X] | ₹[Y] | X% | [months] |

### 10. CoinDCX Trading Strategy
- Ideal entry zone (INR)
- Stop loss (INR)
- Target 3M and 12M (INR)
- DCA (Dollar Cost Averaging) recommendation
- Portfolio allocation suggestion (% of crypto portfolio)
- Tax-efficient strategy for Indian investors

### 11. Key Risks
5-6 concrete risks including regulatory, technical, and market risks.

### 12. Verdict
**Outlook: BULLISH / NEUTRAL / BEARISH**
One decisive paragraph for an Indian crypto investor on CoinDCX.

---

## PART 2: SCORES JSON

\`\`\`json
{
  "rating": "STRONG BUY/BUY/HOLD/SELL/STRONG SELL",
  "outlook": "BULLISH/NEUTRAL/BEARISH",
  "currentPriceUSD": 0,
  "currentPriceINR": 0,
  "targetPriceUSD": 0,
  "targetPriceINR": 0,
  "upside": 0,
  "marketCap": "",
  "marketCapRank": 0,
  "scores": {
    "technology": 0,
    "tokenomics": 0,
    "adoption": 0,
    "regulatoryRisk": 0,
    "liquidity": 0,
    "developerActivity": 0,
    "communityStrength": 0,
    "indiaSuitability": 0
  },
  "onChain": {
    "activeAddresses": "",
    "tvl": "",
    "dailyTransactions": "",
    "networkHealth": "STRONG/MODERATE/WEAK"
  },
  "scenarios": {
    "bull": { "probability": 0, "targetUSD": 0, "targetINR": 0, "trigger": "" },
    "base": { "probability": 0, "targetUSD": 0, "targetINR": 0, "trigger": "" },
    "bear": { "probability": 0, "targetUSD": 0, "targetINR": 0, "trigger": "" }
  },
  "competitors": ["token1", "token2", "token3"],
  "ecosystemTokens": ["token1", "token2"],
  "btcCorrelation": 0,
  "ethCorrelation": 0
}
\`\`\`

All scores are 1-10. Fill ALL fields with realistic estimates. Be specific with current market data. Write like a Messari or Delphi Digital institutional research note.`;

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

    return NextResponse.json({ analysis, scores, symbol, name: cryptoName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Crypto analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
