import { NextResponse } from "next/server";
import { NEUTRAL_SYSTEM_INSTRUCTION } from "@/lib/neutral";
import { cacheHeaders } from "@/lib/services/apiGuard";
import { withAiAccess } from "@/lib/aiAccess";

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

// ─── In-memory cache: 10 min TTL per tab ───
const cache: Record<string, { articles: unknown[]; ts: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes


async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "stocks";
  const apiKey = process.env.GEMINI_API_KEY;

  // Return cached data if fresh
  const cached = cache[tab];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ articles: cached.articles, generatedAt: new Date(cached.ts).toISOString(), cached: true }, { headers: cacheHeaders(600) });
  }

  if (!apiKey) {
    // No API key — return fallback
    const fb: unknown[] = []; // never show the canned FALLBACK articles as news
    return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "unavailable" });
  }

  const topics = TOPICS_BY_TAB[tab] || TOPICS_BY_TAB.stocks;

  const prompt = `You are an elite institutional research analyst. Generate exactly 6 short market intelligence briefs.

Topic: ${topics}

Each object must have these exact keys:
- "headline": 8-12 word compelling headline
- "body": 2-3 sentence analysis with data points (40-60 words)
- "category": one of "MACRO", "FLOWS", "TECHNICAL", "POLICY", "EARNINGS", "RISK", "STRATEGY", "DATA"
- "sentiment": one of "bullish", "bearish", "neutral"
- "urgency": one of "breaking", "high", "medium"

Return ONLY a valid JSON array of 6 objects. Start with [ and end with ]. No other text.`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: NEUTRAL_SYSTEM_INSTRUCTION, contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      // Rate limited or error — return fallback
      const fb: unknown[] = []; // never show the canned FALLBACK articles as news
      return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "unavailable" });
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      const fb: unknown[] = []; // never show the canned FALLBACK articles as news
      return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "unavailable" });
    }

    let text = "";
    for (const part of parts) {
      if (part.text && !part.thought) text += part.text;
    }
    if (!text) {
      for (const part of parts) {
        if (part.text) text += part.text;
      }
    }

    if (!text) {
      const fb: unknown[] = []; // never show the canned FALLBACK articles as news
      return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "unavailable" });
    }

    // Clean and parse
    let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let articles: unknown[] = [];
    try {
      articles = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\[[\s\S]*\]/);
      if (m) articles = JSON.parse(m[0]);
    }

    if (!Array.isArray(articles) || articles.length === 0) {
      const fb: unknown[] = []; // never show the canned FALLBACK articles as news
      return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "unavailable" });
    }

    // Cache the result
    cache[tab] = { articles, ts: Date.now() };

    return NextResponse.json({ articles, generatedAt: new Date().toISOString() }, { headers: cacheHeaders(600) });
  } catch {
    // Any error — return fallback
    const fb: unknown[] = []; // never show the canned FALLBACK articles as news
    return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "unavailable" });
  }
}

// Signed-in users only (src/lib/aiAccess.ts).
export const GET = withAiAccess("none", handleGET);
