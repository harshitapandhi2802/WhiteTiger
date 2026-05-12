import { NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const TOPICS_BY_TAB: Record<string, string> = {
  stocks:
    "Indian equity markets (NSE/BSE), NIFTY 50 outlook, FII/DII flows, sectoral rotation, large-cap moves, earnings season impact, RBI policy implications for equities",
  commodities:
    "Global commodity markets — gold, silver, crude oil, natural gas, copper, aluminium. OPEC decisions, MCX trends, supply-demand dynamics, geopolitical commodity risks",
  crypto:
    "Cryptocurrency markets — Bitcoin dominance, Ethereum ecosystem, DeFi trends, regulatory developments (SEC, India crypto tax), institutional adoption, on-chain metrics, altcoin rotations",
  currency:
    "Forex markets — USD/INR outlook, DXY index, RBI interventions, carry trade dynamics, emerging market currencies, central bank rate decisions (Fed, ECB, BOJ, RBI)",
  mutualfunds:
    "Indian mutual fund industry — SIP flows, AUM trends, category performance (large-cap, mid-cap, small-cap, flexi-cap, debt), NFO analysis, SEBI regulations, AMFI data",
  debt:
    "Fixed income & bond markets — Indian G-Sec yields, US Treasury yields, corporate bonds, RBI OMOs, liquidity conditions, credit spreads, sovereign ratings, inflation-linked bonds",
  international:
    "Global equity markets — S&P 500, NASDAQ, European indices (DAX, FTSE), Asian markets (Nikkei, Hang Seng, Shanghai), geopolitical risks, global macro trends, cross-border capital flows",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "stocks";
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const topics = TOPICS_BY_TAB[tab] || TOPICS_BY_TAB.stocks;
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `You are an elite institutional research analyst at a top-tier global investment bank. Generate exactly 6 short, punchy institutional-grade market intelligence briefs for today (${today}).

Topic focus: ${topics}

For each brief, provide a JSON object with these fields:
- "headline": A compelling 8-12 word headline (Bloomberg/Reuters style)
- "body": A 2-3 sentence institutional-grade analysis (40-60 words). Include specific data points, percentages, or figures where relevant. Write in present tense, authoritative tone.
- "category": One of ["MACRO","FLOWS","TECHNICAL","POLICY","EARNINGS","RISK","STRATEGY","DATA"]
- "sentiment": One of ["bullish","bearish","neutral"]
- "urgency": One of ["breaking","high","medium"]

Return ONLY a JSON array of 6 objects. No markdown, no explanation. Example format:
[{"headline":"...","body":"...","category":"MACRO","sentiment":"bullish","urgency":"high"}]

Make each brief unique, covering different angles. Use real-world context and current market themes. Be specific — cite plausible index levels, percentage moves, fund flows in crores/billions.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 2000 },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Gemini API error" }, { status: 502 });
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid response format" }, { status: 502 });
    }

    const articles = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ articles, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Intelligence API error:", err);
    return NextResponse.json({ error: "Failed to generate intelligence" }, { status: 500 });
  }
}
