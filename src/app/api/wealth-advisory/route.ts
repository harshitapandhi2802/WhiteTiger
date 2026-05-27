import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const profile = await req.json();

  if (!profile.age || !profile.investmentCorpus) {
    return NextResponse.json({ error: "Investor profile required" }, { status: 400 });
  }

  const prompt = `You are an institutional-grade AI Wealth Advisory Engine combining: Private wealth strategist, Macro investment analyst, Risk management committee, Portfolio construction engine.

INVESTOR PROFILE:
- Age: ${profile.age}
- Annual Income: ₹${profile.annualIncome?.toLocaleString() || "Not specified"}
- Monthly Savings: ₹${profile.monthlySavings?.toLocaleString() || "Not specified"}
- Investment Corpus: ₹${profile.investmentCorpus?.toLocaleString()}
- Existing Investments: ${profile.existingInvestments || "None specified"}
- Risk Tolerance: ${profile.riskTolerance || "moderate"}
- Investment Experience: ${profile.investmentExperience || "intermediate"}
- Time Horizon: ${profile.timeHorizon || 10} years
- Financial Goals: ${profile.financialGoals || "Wealth accumulation"}
- Liabilities: ${profile.liabilities || "None"}
- Emergency Fund: ${profile.emergencyFundMonths || 6} months
- Tax Bracket: ${profile.taxBracket || "30%"}

Generate a COMPLETE institutional-grade wealth advisory report. Do NOT include crypto or direct real estate.

Respond with ONLY valid JSON (no markdown, no backticks):

{
  "investorClassification": {
    "category": "<Conservative|Moderate|Growth|Aggressive Growth|Income-Focused|Capital Preservation|Long-Term Wealth Accumulation>",
    "riskScore": <1-100>,
    "suitabilityScore": <1-100>,
    "volatilityTolerance": <1-100>,
    "liquidityRequirement": "<high|moderate|low>",
    "investorPersona": "<2-3 sentence description of this investor's profile>"
  },
  "assetAllocations": [
    {
      "assetClass": "<Domestic Equities|International Equities|Government Bonds|Corporate Bonds|Treasury/Liquid|Gold & Precious Metals|ETFs|Index Funds|Dividend Stocks|Commodities|Cash & Liquid>",
      "allocationPct": <number>,
      "recommendedAmount": <number in INR>,
      "rationale": "<1-2 sentences institutional rationale>",
      "riskReturn": "<expected risk-return description>",
      "volatilityOutlook": "<low|moderate|high>",
      "economicCycleSuitability": "<1 sentence>",
      "inflationHedge": "<weak|moderate|strong>",
      "liquidityProfile": "<high|moderate|low>"
    }
  ],
  "riskAnalytics": {
    "expectedReturn": <number annual pct>,
    "volatility": <number annual pct>,
    "sharpeRatio": <number>,
    "downsideDeviation": <number pct>,
    "maxDrawdown": <number negative pct>,
    "diversificationScore": <1-100>,
    "inflationAdjustedReturn": <number pct>,
    "sortinoRatio": <number>,
    "calmarRatio": <number>
  },
  "equityBreakdown": [
    {
      "segment": "<Large Cap|Mid Cap|Small Cap|International Developed|International EM|Growth|Value|Dividend>",
      "allocation": <pct of equity portion>,
      "rationale": "<1 sentence>",
      "sectors": ["<sector1>", "<sector2>", "<sector3>"]
    }
  ],
  "fixedIncomeStrategy": {
    "duration": "<short|medium|long>",
    "yieldCurvePosition": "<description>",
    "govtVsCorporate": "<e.g. 60% govt / 40% corporate>",
    "creditQuality": "<description>",
    "interestRateSensitivity": "<low|moderate|high>",
    "incomeGeneration": "<description>"
  },
  "goldDefensive": {
    "goldAllocationPct": <number>,
    "rationale": "<1-2 sentences>",
    "inflationHedge": "<description>",
    "crisisProtection": "<description>",
    "correlationBenefit": "<description>",
    "safeHavenDemand": "<description>"
  },
  "macroOverlays": [
    {
      "factor": "<Interest Rates|Inflation|GDP Growth|Bond Yields|Currency|Geopolitical|Liquidity|Equity Valuations>",
      "currentState": "<description>",
      "impact": "<bullish|bearish|neutral>",
      "allocationImplication": "<1 sentence>"
    }
  ],
  "stressScenarios": [
    {
      "scenario": "<Global Recession|High Inflation|Equity Crash|Rising Rates|Falling Rates|Banking Crisis|Commodity Shock|Geopolitical Escalation|Currency Crisis>",
      "portfolioImpact": <negative pct>,
      "resilience": "<strong|moderate|weak>",
      "vulnerableSegments": "<description>",
      "defensiveStrengths": "<description>"
    }
  ],
  "institutionalViews": [
    {
      "firm": "<BlackRock|Goldman Sachs|JPMorgan|Morgan Stanley|Vanguard|Fidelity|Bridgewater>",
      "equityOutlook": "<1 sentence>",
      "bondOutlook": "<1 sentence>",
      "goldOutlook": "<1 sentence>",
      "keyTheme": "<1 sentence>"
    }
  ],
  "wealthRoadmap": {
    "retirementCorpus": <number>,
    "yearsToGoal": <number>,
    "monthlyRequiredSIP": <number>,
    "goalProbability": <0-100>,
    "passiveIncomePotential": <monthly passive income number>,
    "projections": [
      { "year": <number>, "projectedValue": <number>, "sipGrowth": <number>, "totalInvested": <number> }
    ]
  },
  "rebalancing": [
    {
      "action": "<description>",
      "urgency": "<high|medium|low>",
      "rationale": "<1 sentence>"
    }
  ],
  "committeeSummary": {
    "portfolioQualityScore": <1-100>,
    "riskSuitabilityScore": <1-100>,
    "diversificationScore": <1-100>,
    "sustainabilityScore": <1-100>,
    "majorStrengths": ["<strength1>", "<strength2>", "<strength3>"],
    "keyRisks": ["<risk1>", "<risk2>", "<risk3>"],
    "tacticalOpportunities": ["<opp1>", "<opp2>", "<opp3>"],
    "recommendedActions": ["<action1>", "<action2>", "<action3>", "<action4>"]
  }
}

REQUIREMENTS:
- 8-11 asset class allocations that sum to 100%
- recommendedAmount for each = allocationPct * investmentCorpus / 100
- 6-8 equity breakdown segments
- 8 macro overlay factors
- 9 stress scenarios
- 7 institutional views
- 5-8 rebalancing recommendations
- 10 wealth projection data points (years 1,2,3,5,7,10,15,20,25,30 - up to time horizon)
- All numbers must be realistic for Indian markets
- Use current May 2026 macro conditions
- Institutional tone throughout
- Output ONLY valid JSON`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 16000,
          temperature: 0.5,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini Wealth Advisory error:", err);
      return NextResponse.json({ error: `API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let advisory;
    try {
      advisory = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        advisory = JSON.parse(jsonMatch[1]);
      } else {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          advisory = JSON.parse(text.slice(start, end + 1));
        } else {
          throw new Error("Could not parse advisory data");
        }
      }
    }

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      profile,
      ...advisory,
    });
  } catch (err) {
    console.error("Wealth Advisory error:", err);
    return NextResponse.json({ error: "Failed to generate advisory" }, { status: 500 });
  }
}
