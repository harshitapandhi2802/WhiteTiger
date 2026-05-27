import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { symbol, name, issuer, coupon, tenure, rating, category, yieldApprox } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: "Bond symbol required" }, { status: 400 });
  }

  const prompt = `You are a Bloomberg Terminal + BlackRock Aladdin + JPMorgan Fixed Income Research intelligence engine.

Generate a COMPLETE institutional-grade fixed income intelligence report for **${name || symbol}** (${symbol}).
Issuer: ${issuer || "Unknown"}, Coupon: ${coupon || "N/A"}, Tenure: ${tenure || "N/A"}, Rating: ${rating || "N/A"}, Category: ${category || "Bond"}, Yield: ${yieldApprox || "N/A"}.

You MUST respond with ONLY a valid JSON object (no markdown, no backticks, no explanation) matching this exact structure:

{
  "overview": {
    "currentPrice": <number - clean price around 95-105>,
    "yieldToMaturity": <number>,
    "currentYield": <number>,
    "priceChange1d": <number>,
    "priceChange1w": <number>,
    "priceChange1m": <number>,
    "yieldChange1d": <number like 0.02 or -0.03>,
    "yieldChange1w": <number>,
    "yieldChange1m": <number>,
    "duration": <number>,
    "convexity": <number>,
    "dv01": <number>,
    "creditSpread": <number in bps>,
    "liquidityScore": <number 1-100>,
    "tradingVolume": "<string like '₹1,200 Cr'>",
    "bidAskSpread": "<string like '1.2 bps'>"
  },
  "creditAnalysis": {
    "rating": "<string>",
    "outlook": "<stable|positive|negative|developing>",
    "defaultProbability": <number pct>,
    "recoveryRate": <number pct>,
    "cdsSpread": <number bps or 0 for sovereign>,
    "creditScore": <number 1-100>,
    "fundamentalStrength": "<strong|moderate|weak>",
    "keyRisks": ["<risk1>", "<risk2>", "<risk3>"],
    "peerComparison": "<string - how this bond compares to peers>"
  },
  "yieldCurveAnalysis": {
    "curveShape": "<normal|flat|inverted|humped>",
    "steepness2s10s": <number bps>,
    "butterFly5s10s30s": <number bps>,
    "rolldownReturn6m": "<string like '0.35% annualized'>",
    "carryReturn": "<string like '7.12% annualized'>",
    "relativeValue": "<cheap|fair|rich>",
    "interpretation": "<string - 1-2 sentences about what the curve is telling us>"
  },
  "centralBankAnalysis": {
    "bank": "<string - relevant central bank>",
    "currentRate": <number>,
    "stance": "<hawkish|dovish|neutral|data_dependent>",
    "lastAction": "<string>",
    "forwardGuidance": "<string>",
    "nextMeeting": "<string date>",
    "ratePathExpected": "<string like 'One more 25 bps cut expected by Q4'>",
    "liquidityConditions": "<surplus|deficit|balanced>",
    "qeQtStatus": "<string>"
  },
  "macroAnalysis": {
    "gdpGrowth": "<string like '6.8% YoY'>",
    "inflation": "<string like '4.2% CPI YoY'>",
    "fiscalDeficit": "<string like '5.1% of GDP'>",
    "currentAccount": "<string like '-1.2% of GDP'>",
    "fxReserves": "<string like '$650B'>",
    "debtToGdp": "<string like '83%'>",
    "governmentBorrowing": "<string>",
    "bondSupplyOutlook": "<heavy|moderate|light>",
    "macroVerdict": "<string - 1-2 sentences summarizing macro impact on this bond>"
  },
  "institutionalViews": [
    {
      "firm": "<bank name>",
      "outlook": "<bullish|bearish|neutral>",
      "targetYield": "<string like '7.05%'>",
      "theme": "<string - 1 sentence thesis>"
    }
  ],
  "tradeIdeas": [
    {
      "name": "<trade name>",
      "type": "<outright|relative_value|curve|spread|carry>",
      "direction": "<buy|sell|receive_fixed|pay_fixed>",
      "rationale": "<string - 1-2 sentences>",
      "risk": "<string>",
      "timeHorizon": "<string like '3-6 months'>"
    }
  ],
  "insights": [
    {
      "text": "<smart insight sentence>",
      "type": "<warning|opportunity|info|risk>",
      "urgency": "<high|medium|low>"
    }
  ]
}

REQUIREMENTS:
- Generate realistic data based on Indian fixed income market conditions as of May 2026
- Include 6-7 institutional views from major banks (Goldman Sachs, JPMorgan, Morgan Stanley, HSBC, Nomura, Barclays, Citi)
- Include 5-6 trade ideas relevant to this bond/category
- Include 8-10 smart AI insights
- For sovereign bonds: CDS spread should be near 0, default probability near 0
- For corporate bonds: include realistic credit metrics based on the rating
- Yield curve analysis should reflect current RBI policy cycle
- All numbers should be realistic and precise
- Output ONLY valid JSON, no markdown wrapping`;

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
          temperature: 0.6,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini Bond Intelligence error:", err);
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
          throw new Error("Could not parse intelligence data");
        }
      }
    }

    return NextResponse.json({
      success: true,
      symbol,
      bondName: name || symbol,
      issuer: issuer || "Unknown",
      generatedAt: new Date().toISOString(),
      ...intelligence,
    });
  } catch (err) {
    console.error("Bond Intelligence error:", err);
    return NextResponse.json({ error: "Failed to generate intelligence" }, { status: 500 });
  }
}
