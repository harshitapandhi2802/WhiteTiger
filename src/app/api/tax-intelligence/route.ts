import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const profile = await req.json();

  if (!profile.country || !profile.investorCategory) {
    return NextResponse.json({ error: "Tax profile required" }, { status: 400 });
  }

  const prompt = `You are an institutional-grade Global Investment Tax Intelligence Engine combining: International tax advisor, Cross-border compliance analyst, Wealth management tax consultant, Portfolio tax strategist.

TAX INVESTOR PROFILE:
- Country of Residence: ${profile.country}
- Tax Residency: ${profile.taxResidency || profile.country}
- Citizenship: ${profile.citizenship || profile.country}
- Investor Category: ${profile.investorCategory}
- Income Bracket: ${profile.incomeBracket || "High"}
- Investment Horizon: ${profile.investmentHorizon || 10} years
- Domestic vs International: ${profile.domesticVsInternational || "Both"}
- Entity Structure: ${profile.entityStructure || "Individual"}

Generate a COMPLETE institutional-grade tax intelligence report. All recommendations must be LEGAL, TRANSPARENT, and COMPLIANT.

Respond with ONLY valid JSON (no markdown, no backticks):

{
  "classification": {
    "investorType": "<classified type>",
    "taxSensitivity": "<high|moderate|low>",
    "jurisdictionExposure": "<description>",
    "crossBorderComplexity": "<high|moderate|low>",
    "complianceScore": <1-100>,
    "profileSummary": "<2-3 sentence investor tax profile summary>"
  },
  "countryProfiles": [
    {
      "country": "<country name>",
      "flag": "<emoji flag>",
      "stcgRate": "<rate description>",
      "ltcgRate": "<rate description>",
      "dividendTax": "<rate description>",
      "interestTax": "<rate description>",
      "wealthTax": "<applicable or N/A>",
      "withholdingTax": "<rate>",
      "stt": "<applicable or N/A>",
      "treatyBenefits": "<description>",
      "taxEfficiencyScore": <1-100>,
      "keyNotes": "<1-2 sentence key tax notes>"
    }
  ],
  "assetTaxProfiles": [
    {
      "assetClass": "<asset class name>",
      "stcgRate": "<rate for ${profile.country} resident>",
      "ltcgRate": "<rate>",
      "holdingPeriod": "<STCG to LTCG threshold>",
      "dividendTax": "<rate>",
      "indexationBenefit": "<available/not available>",
      "withholdingTax": "<rate>",
      "taxLossHarvesting": "<eligible/not eligible>",
      "crossBorderTreatment": "<description>",
      "taxEfficiencyScore": <1-100>
    }
  ],
  "investorTypeTax": [
    {
      "investorType": "<type>",
      "tdsApplicability": "<description>",
      "treatyBenefits": "<description>",
      "complianceRequirements": "<description>",
      "keyTaxRules": ["<rule1>", "<rule2>", "<rule3>"],
      "optimizationStrategies": ["<strategy1>", "<strategy2>"]
    }
  ],
  "postTaxReturns": [
    {
      "scenario": "<investment scenario>",
      "grossReturn": <number pct>,
      "taxLiability": <number pct>,
      "effectiveTaxRate": <number pct>,
      "netPostTaxReturn": <number pct>,
      "inflationAdjusted": <number pct>,
      "taxDrag": <number pct>,
      "taxEfficiencyScore": <1-100>
    }
  ],
  "crossBorderAnalysis": [
    {
      "route": "<e.g. India → US Equities>",
      "withholdingTax": "<rate>",
      "capitalGainsTax": "<rate>",
      "doubleTaxation": "<exposure description>",
      "foreignTaxCredit": "<availability>",
      "effectiveTaxBurden": "<effective rate>",
      "efficiencyScore": <1-100>,
      "recommendation": "<1 sentence>"
    }
  ],
  "optimizations": [
    {
      "strategy": "<strategy name>",
      "category": "<structure|timing|jurisdiction|harvesting|allocation>",
      "potentialSaving": "<estimated saving>",
      "complexity": "<low|medium|high>",
      "description": "<1-2 sentences>",
      "legalBasis": "<regulatory reference>"
    }
  ],
  "alerts": [
    {
      "title": "<alert title>",
      "date": "<date>",
      "jurisdiction": "<country>",
      "impact": "<positive|negative|neutral>",
      "severity": "<high|medium|low>",
      "description": "<1-2 sentences>",
      "affectedInvestors": "<who is affected>"
    }
  ],
  "scenarios": [
    {
      "scenario": "<investment scenario>",
      "preTaxCAGR": <number>,
      "postTaxCAGR": <number>,
      "taxDragPct": <number>,
      "wealthAfter10Y": <number on 1Cr corpus>,
      "taxPaidOver10Y": <number>,
      "insight": "<1 sentence>"
    }
  ],
  "compliance": [
    {
      "obligation": "<obligation name>",
      "jurisdiction": "<country>",
      "deadline": "<deadline>",
      "riskLevel": "<high|medium|low>",
      "description": "<1 sentence>"
    }
  ],
  "jurisdictionComparisons": [
    {
      "metric": "<e.g. LTCG Tax Rate|Dividend Tax|Tax Efficiency>",
      "values": { "India": "<value>", "US": "<value>", "UAE": "<value>", "Singapore": "<value>", "UK": "<value>" }
    }
  ],
  "summary": {
    "estimatedTaxBurden": "<estimated annual tax burden string>",
    "effectiveTaxRate": <number pct>,
    "netPostTaxReturn": <number pct>,
    "taxEfficiencyScore": <1-100>,
    "bestJurisdiction": "<most tax-efficient jurisdiction>",
    "majorTaxRisks": ["<risk1>", "<risk2>", "<risk3>"],
    "complianceObligations": ["<obligation1>", "<obligation2>", "<obligation3>"],
    "optimizationStrategies": ["<strategy1>", "<strategy2>", "<strategy3>", "<strategy4>"],
    "verdict": "<2-3 sentence institutional tax advisory verdict>"
  }
}

REQUIREMENTS:
- 8-11 country profiles (focus on investor's residence + major investment destinations)
- 10-12 asset class tax profiles relevant to the investor
- 4-6 investor type tax frameworks
- 6-8 post-tax return scenarios
- 6-8 cross-border analysis routes
- 8-10 tax optimization strategies (all LEGAL and COMPLIANT)
- 6-8 recent tax alerts/regulatory changes (as of May 2026)
- 6-8 tax scenario simulations
- 6-8 compliance obligations
- 8-10 jurisdiction comparison metrics
- All rates must be realistic and current
- Include specific regulatory references where applicable
- NEVER recommend illegal tax evasion
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
      console.error("Gemini Tax Intelligence error:", err);
      return NextResponse.json({ error: `API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let intelligence;
    try {
      intelligence = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        intelligence = JSON.parse(jsonMatch[1]);
      } else {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          intelligence = JSON.parse(text.slice(start, end + 1));
        } else {
          throw new Error("Could not parse tax intelligence data");
        }
      }
    }

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      profile,
      ...intelligence,
    });
  } catch (err) {
    console.error("Tax Intelligence error:", err);
    return NextResponse.json({ error: "Failed to generate tax intelligence" }, { status: 500 });
  }
}
