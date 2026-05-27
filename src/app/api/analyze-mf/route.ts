import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { symbol, name, category, amc, riskLevel } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: "Mutual fund identifier is required" }, { status: 400 });
  }

  const fundName = name || symbol;

  const prompt = `You are a senior mutual fund research analyst at a top-tier Indian wealth management firm (Motilal Oswal / IIFL Wealth / Kotak Private caliber) with deep expertise in Indian mutual funds, SEBI regulations, portfolio construction, SIP strategies, and tax-efficient investing.

Conduct an INSTITUTIONAL-GRADE comprehensive mutual fund analysis for **${fundName}** (Symbol: ${symbol}, Category: ${category || "Equity"}, AMC: ${amc || "Unknown"}, Risk Level: ${riskLevel || "High"}).

You MUST output your analysis in TWO parts:

**PART 1: DETAILED MARKDOWN ANALYSIS**
**PART 2: A JSON SCORES BLOCK** at the very end.

---

## PART 1: ANALYSIS

### 1. Fund Overview & Rating
- Give one of: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
- Current NAV (approximate)
- AUM (Assets Under Management)
- Expense ratio
- Fund category and benchmark index
- Fund manager name and tenure
- Why this fund? Core investment thesis

### 2. Performance Analysis
- 1Y, 3Y, 5Y, 10Y returns (CAGR)
- Comparison with benchmark returns
- Comparison with category average
- Rolling returns analysis (consistency)
- Best/worst year performance
- SIP returns: ₹10,000/month for 1Y, 3Y, 5Y
- Risk-adjusted returns: Sharpe ratio, Sortino ratio

### 3. Portfolio Analysis
- Top 10 holdings and their weightage
- Sector allocation breakdown
- Market cap allocation (large/mid/small %)
- Portfolio turnover ratio
- Concentration risk assessment
- Cash holding percentage
- Overlap with popular index funds

### 4. Fund Manager Assessment
- Fund manager experience and track record
- Investment style: growth/value/blend
- Stock-picking history
- Sector rotation strategy
- Consistency of outperformance
- Fund manager changes history

### 5. Risk Analysis
- Standard deviation
- Beta vs benchmark
- Maximum drawdown (last 5 years)
- Downside capture ratio
- Upside capture ratio
- Value at Risk (VaR)
- Risk grade: ${riskLevel || "High"}

### 6. Tax Efficiency & Cost Analysis
- LTCG tax implications (12.5% above ₹1.25 lakh)
- STCG tax implications (20%)
- Exit load structure
- Direct vs Regular plan expense difference
- Total cost of ownership analysis
- Tax harvesting opportunities

### 7. SIP Strategy
- Best SIP amount for different goals
- Ideal SIP tenure recommendation
- SIP top-up strategy
- Lump sum vs SIP analysis for current market
- Step-up SIP recommendation
- Monthly vs weekly SIP comparison

### 8. Scenario Analysis

| Scenario | Market Condition | Expected 1Y Return | Probability |
|----------|-----------------|-------------------|------------|
| Bull | [describe] | X% | X% |
| Base | [describe] | X% | X% |
| Bear | [describe] | X% | X% |

### 9. Peer Comparison
Compare with 3-4 similar category funds on returns, risk, expense ratio, and consistency.

### 10. Key Risks
5-6 concrete risks including market risk, concentration risk, and regulatory risks.

### 11. Verdict
**Outlook: BULLISH / NEUTRAL / BEARISH**
One decisive paragraph for an Indian retail investor considering this fund for long-term wealth creation.

---

## PART 2: SCORES JSON

\`\`\`json
{
  "rating": "STRONG BUY/BUY/HOLD/SELL/STRONG SELL",
  "outlook": "BULLISH/NEUTRAL/BEARISH",
  "currentNAV": 0,
  "aum": "",
  "expenseRatio": 0,
  "returns": {
    "return1Y": 0,
    "return3Y": 0,
    "return5Y": 0,
    "return10Y": 0,
    "benchmarkReturn3Y": 0,
    "categoryAvgReturn3Y": 0
  },
  "sipReturns": {
    "sip1Y": 0,
    "sip3Y": 0,
    "sip5Y": 0
  },
  "scores": {
    "consistency": 0,
    "riskManagement": 0,
    "fundManagerQuality": 0,
    "portfolioQuality": 0,
    "expenseEfficiency": 0,
    "alphaGeneration": 0,
    "downsideProtection": 0,
    "sipSuitability": 0
  },
  "risk": {
    "sharpeRatio": 0,
    "standardDeviation": 0,
    "beta": 0,
    "maxDrawdown": 0,
    "riskGrade": "LOW/MODERATE/HIGH/VERY HIGH"
  },
  "scenarios": {
    "bull": { "probability": 0, "expectedReturn": 0, "trigger": "" },
    "base": { "probability": 0, "expectedReturn": 0, "trigger": "" },
    "bear": { "probability": 0, "expectedReturn": 0, "trigger": "" }
  },
  "topHoldings": ["stock1", "stock2", "stock3", "stock4", "stock5"],
  "topSectors": ["sector1", "sector2", "sector3"],
  "peerFunds": ["fund1", "fund2", "fund3"]
}
\`\`\`

All scores are 1-10. Fill ALL fields with realistic estimates. Write like a Morningstar India analyst research note.`;

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

    return NextResponse.json({ analysis, scores, symbol, name: fundName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("MF analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
