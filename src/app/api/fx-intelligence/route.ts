import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { symbol, pair, name, base, quote, category } = await req.json();

  if (!symbol || !pair) {
    return NextResponse.json({ error: "Currency pair required" }, { status: 400 });
  }

  const prompt = `You are a Bloomberg Terminal + JPMorgan FX Strategy + Macro Research intelligence engine.

Generate a COMPLETE institutional-grade FX intelligence dashboard for **${pair}** (${name || symbol}).
Base currency: ${base || pair.split("/")[0]}, Quote currency: ${quote || pair.split("/")[1]}, Category: ${category || "Forex"}.

You MUST respond with ONLY a valid JSON object (no markdown, no backticks, no explanation) matching this exact structure:

{
  "overview": {
    "currentRate": <number - current approximate exchange rate>,
    "intradayChange": <number>,
    "intradayChangePct": <number>,
    "dailyHigh": <number>,
    "dailyLow": <number>,
    "weeklyPerf": <number pct>,
    "monthlyPerf": <number pct>,
    "ytdPerf": <number pct>,
    "week52High": <number>,
    "week52Low": <number>,
    "volatility": { "realized30d": <number>, "implied1m": <number>, "implied3m": <number> },
    "liquidity": "<deep|moderate|thin>",
    "bidAskSpread": "<string like '0.02 pips'>",
    "institutionalSentiment": "<strong_buy|buy|neutral|sell|strong_sell>"
  },
  "trading": {
    "dailyVolume": "<string like '$180B'>",
    "spotActivity": "<string description>",
    "futuresOI": "<string like '$45B'>",
    "optionsOI": "<string like '$22B'>",
    "majorSessions": ["<session1>", "<session2>"],
    "institutionalFlow": "<net_buying|net_selling|balanced>",
    "centralBankParticipation": "<active|moderate|minimal>",
    "retailVsInstitutional": { "retail": <number 0-100>, "institutional": <number 0-100> }
  },
  "events": [
    {
      "title": "<event title>",
      "date": "<date string>",
      "impact": "<bullish|bearish|neutral>",
      "magnitude": "<high|medium|low>",
      "explanation": "<why it moved the pair - 1-2 sentences>",
      "futureImplication": "<expected future impact - 1 sentence>"
    }
  ],
  "centralBanks": [
    {
      "bank": "<central bank short name>",
      "currentRate": <number>,
      "stance": "<hawkish|neutral|dovish>",
      "lastAction": "<description>",
      "nextMeeting": "<date>",
      "forwardGuidance": "<1-2 sentences>",
      "ratePathExpected": "<description>"
    }
  ],
  "bonds": {
    "usTreasury10Y": <number>,
    "domesticBond10Y": <number>,
    "yieldSpread": <number>,
    "spreadDirection": "<widening|stable|narrowing>",
    "carryTradeScore": <1-10>,
    "riskPremium": "<description>",
    "yieldCurveShape": "<normal|flat|inverted>"
  },
  "technicals": {
    "trend": "<strong_bullish|bullish|neutral|bearish|strong_bearish>",
    "rsi": <number>,
    "macd": { "value": <number>, "signal": <number>, "histogram": <number>, "interpretation": "<string>" },
    "bollingerBands": { "upper": <number>, "middle": <number>, "lower": <number>, "position": "<above_upper|upper_half|middle|lower_half|below_lower>" },
    "fibonacci": { "levels": [{ "label": "<23.6%|38.2%|50%|61.8%|78.6%>", "value": <number> }] },
    "movingAverages": { "ma20": <number>, "ma50": <number>, "ma100": <number>, "ma200": <number> },
    "keyLevels": [{ "label": "<string>", "value": <number>, "type": "<support|resistance|pivot|ma>" }],
    "momentum": "<description>",
    "breakoutZones": [{ "level": <number>, "direction": "<up|down>", "probability": <0-100> }]
  },
  "quantModels": [
    {
      "name": "<model name like GARCH|VaR|IRP|PPP|Carry Trade|Macro Sensitivity|FX Beta>",
      "value": "<result string>",
      "signal": "<bullish|bearish|neutral>",
      "confidence": <0-100>,
      "description": "<1-2 sentence explanation>"
    }
  ],
  "correlations": [
    {
      "asset": "<DXY|Gold|Crude Oil|S&P 500|US Bonds|EM FX|Bitcoin|CRB Index>",
      "correlation": <number -1 to 1>,
      "direction": "<positive|negative|weak>",
      "significance": "<1 sentence>"
    }
  ],
  "institutionalViews": [
    {
      "firm": "<Goldman Sachs|JPMorgan|Morgan Stanley|Bank of America|Citi|BlackRock|IMF>",
      "outlook": "<bullish|bearish|neutral>",
      "target": "<target rate string>",
      "keyRisk": "<1 sentence>",
      "theme": "<1 sentence positioning theme>"
    }
  ],
  "sentiment": {
    "overallScore": <1-100>,
    "institutionalConfidence": <1-100>,
    "fearGreed": <1-100>,
    "riskAppetite": "<risk_on|risk_off|neutral>",
    "safeHavenDemand": "<high|moderate|low>",
    "speculativePositioning": "<net_long|net_short|balanced>"
  },
  "forecast": {
    "shortTerm": { "outlook": "<1-2 sentences>", "range": "<rate range>", "confidence": <0-100> },
    "mediumTerm": { "outlook": "<1-2 sentences>", "range": "<rate range>", "confidence": <0-100> },
    "longTerm": { "outlook": "<1-2 sentences>", "range": "<rate range>", "confidence": <0-100> },
    "scenarios": {
      "bull": { "target": <number>, "probability": <0-100>, "catalyst": "<1 sentence>" },
      "base": { "target": <number>, "probability": <0-100>, "catalyst": "<1 sentence>" },
      "bear": { "target": <number>, "probability": <0-100>, "catalyst": "<1 sentence>" }
    },
    "catalysts": ["<catalyst1>", "<catalyst2>", "<catalyst3>", "<catalyst4>", "<catalyst5>"]
  },
  "insights": [
    {
      "text": "<smart insight sentence>",
      "type": "<warning|opportunity|info|risk>",
      "urgency": "<high|medium|low>"
    }
  ]
}

REQUIREMENTS:
- Generate AT LEAST 8 recent market events with real macro context
- Include BOTH central banks for the pair (e.g., Fed + RBI for USD/INR)
- Generate 7-8 quant models (GARCH, VaR, IRP, PPP, Carry Trade, Macro Sensitivity, FX Beta to Oil, FX Beta to DXY)
- Include 8 cross-asset correlations
- Include views from 7 institutional firms
- Generate 8-10 smart AI insights
- All data should be realistic and based on current macro conditions as of May 2026
- Technical levels should be realistic for the current rate
- Use precise numbers, not placeholders
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
      console.error("Gemini FX Intelligence error:", err);
      return NextResponse.json({ error: `API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let intelligence;
    try {
      // Try direct parse first (responseMimeType should give us clean JSON)
      intelligence = JSON.parse(text);
    } catch {
      // Fallback: extract JSON from markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        intelligence = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find the JSON object
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
      pair,
      pairName: name || pair,
      base: base || pair.split("/")[0],
      quote: quote || pair.split("/")[1],
      generatedAt: new Date().toISOString(),
      ...intelligence,
    });
  } catch (err) {
    console.error("FX Intelligence error:", err);
    return NextResponse.json({ error: "Failed to generate intelligence" }, { status: 500 });
  }
}
