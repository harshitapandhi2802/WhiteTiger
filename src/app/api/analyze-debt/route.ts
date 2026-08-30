import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/services/apiGuard";

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "analyze-debt", limit: 5, windowMs: 60000 });
  if (limited) return limited;
  const { symbol, name, category, type, tenure, coupon, rating, issuer } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: "Bond/debt instrument identifier is required" }, { status: 400 });
  }

  const bondName = name || symbol;

  const prompt = `You are a senior fixed-income strategist at a top-tier Indian institution (SBI DFHI / ICICI Securities Primary Dealership / IDBI Capital caliber) with deep expertise in Indian debt markets, RBI monetary policy, G-Sec auctions, corporate bond markets, credit analysis, and yield curve dynamics.

Conduct an INSTITUTIONAL-GRADE comprehensive debt instrument analysis for **${bondName}** (Symbol: ${symbol}, Category: ${category || "Government Securities"}, Type: ${type || "G-Sec"}, Tenure: ${tenure || ""}, Coupon: ${coupon || ""}, Rating: ${rating || "Sovereign"}, Issuer: ${issuer || "Government of India"}).

Focus on the Indian fixed-income market context — RBI policy, FBIL benchmarks, CCIL trading, and impact on Indian retail and institutional investors.

You MUST output your analysis in TWO parts:

**PART 1: DETAILED MARKDOWN ANALYSIS**
**PART 2: A JSON SCORES BLOCK** at the very end.

---

## PART 1: ANALYSIS

### 1. Instrument Overview & Rating
- Give one of: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
- Current approximate price/NAV
- Yield to Maturity (YTM)
- Coupon rate and payment frequency
- Credit rating and outlook
- Residual maturity
- Why this instrument? Core investment thesis

### 2. Yield Analysis
- Current YTM vs similar maturity instruments
- Spread over G-Sec benchmark
- Historical yield range (1Y)
- Yield curve positioning
- Real yield (adjusted for inflation)
- Comparison with FD rates of major banks
- Tax-adjusted yield (for applicable slab)

### 3. RBI Policy & Interest Rate Outlook
- Current repo rate and stance
- Expected rate trajectory (next 12 months)
- Inflation targeting framework compliance
- Liquidity management (LAF, MSF, SDF)
- Impact of RBI operations on this instrument
- Global rate environment impact (US Fed, ECB)

### 4. Credit Risk Assessment
- Issuer credit profile
- Rating agency views (CRISIL, ICRA, CARE, Fitch)
- Default probability assessment
- Recovery rate estimation
- Sector-specific risks
- Fiscal health of issuer (if government)

### 5. Duration & Sensitivity Analysis
- Modified duration
- Macaulay duration
- Convexity
- Price sensitivity to 25bps rate change
- Key rate duration
- DV01 (Dollar Value of 01)

### 6. Tax Efficiency
- Tax treatment of interest income
- Capital gains tax implications (LTCG vs STCG)
- Indexation benefit (if applicable)
- Comparison with tax-free alternatives
- Optimal holding period for tax efficiency
- Section 80C benefit (if applicable)

### 7. Portfolio Strategy
- Role in portfolio (core/satellite/tactical)
- Ideal allocation percentage
- Ladder strategy recommendation
- Duration matching for goals
- Reinvestment risk assessment
- Comparison with debt mutual funds

### 8. Scenario Analysis

| Scenario | Rate Change | Price Impact | Probability |
|----------|------------|-------------|------------|
| Rate Cut 50bps | [describe] | +X% | X% |
| Status Quo | [describe] | X% | X% |
| Rate Hike 25bps | [describe] | -X% | X% |

### 9. Alternatives Comparison
Compare with 3-4 alternative instruments (FD, debt MF, other bonds) on yield, risk, liquidity, and tax efficiency.

### 10. Key Risks
5-6 concrete risks including interest rate risk, credit risk, liquidity risk, reinvestment risk, and inflation risk.

### 11. Verdict
**Outlook: BULLISH / NEUTRAL / BEARISH** (on bond prices / yields)
One decisive paragraph for an Indian retail investor considering this instrument for portfolio diversification and income generation.

---

## PART 2: SCORES JSON

\`\`\`json
{
  "rating": "STRONG BUY/BUY/HOLD/SELL/STRONG SELL",
  "outlook": "BULLISH/NEUTRAL/BEARISH",
  "currentPrice": 0,
  "ytm": 0,
  "couponRate": 0,
  "creditRating": "",
  "modifiedDuration": 0,
  "scores": {
    "creditQuality": 0,
    "yieldAttractiveness": 0,
    "liquidityScore": 0,
    "interestRateSensitivity": 0,
    "taxEfficiency": 0,
    "inflationProtection": 0,
    "reinvestmentRisk": 0,
    "portfolioFit": 0
  },
  "rbiPolicy": {
    "repoRate": 0,
    "stance": "HAWKISH/NEUTRAL/DOVISH/ACCOMMODATIVE",
    "expectedRateChange": "",
    "inflationRate": 0
  },
  "scenarios": {
    "bull": { "probability": 0, "priceImpact": 0, "trigger": "" },
    "base": { "probability": 0, "priceImpact": 0, "trigger": "" },
    "bear": { "probability": 0, "priceImpact": 0, "trigger": "" }
  },
  "yieldComparison": {
    "fdRate": 0,
    "gsecBenchmark": 0,
    "debtMfReturn": 0,
    "inflationRate": 0
  },
  "alternatives": ["instrument1", "instrument2", "instrument3"],
  "suitableFor": ["profile1", "profile2"]
}
\`\`\`

All scores are 1-10. Fill ALL fields with realistic estimates. Write like an ICICI Securities Primary Dealership research note.`;

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

    return NextResponse.json({ analysis, scores, symbol, name: bondName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Debt analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
