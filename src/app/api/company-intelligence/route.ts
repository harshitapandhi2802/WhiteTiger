import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse, cacheHeaders } from "@/lib/services/apiGuard";
import { fetchLiveStockPrice } from "@/lib/services/livePrice";

export const maxDuration = 60;

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — COMPANY INTELLIGENCE API
   Returns a structured Business Intelligence dossier for a ticker:
   snapshot, revenue mix, segments, subsidiaries, industry, peers,
   ownership, AI scores, moat, supply chain, risks, thesis.

   AI-generated from the model's public-filings knowledge and grounded
   in a LIVE current price where one resolves. Every field is labelled
   as an AI estimate in the UI — never presented as live exchange data
   beyond price/sector/marketCap when actually fetched.
   ═══════════════════════════════════════════════════════════════ */

interface CachedDossier { data: unknown; ts: number; }
const cache = new Map<string, CachedDossier>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h — BI rarely changes day-to-day

function buildPrompt(ticker: string, name: string, livePriceLine: string) {
  return `You are a senior equity research analyst preparing an INSTITUTIONAL-GRADE Business Intelligence dossier for **${name}** (${ticker}) — an NSE/BSE listed Indian company.

${livePriceLine}

Use your knowledge of the company's most recently disclosed annual report, investor presentations and exchange filings. Where you do not have a specific figure, give a realistic estimate clearly within the bounds of public commentary — DO NOT fabricate company-specific numbers you have no basis for.

Output ONLY a single valid JSON object matching the schema below. No prose, no markdown, no backticks.

{
  "snapshot": {
    "founded": "<year>",
    "headquarters": "<city, country>",
    "ceo": "<full name + designation>",
    "employees": "<approx count or range, e.g. '~200,000'>",
    "sector": "<sector>",
    "industry": "<industry>",
    "marketCap": "<e.g. '₹19.2L Cr' — use the live one provided above if given>",
    "listingDate": "<NSE listing year or date>",
    "fyEnd": "<e.g. 'March (Indian FY)'>"
  },

  "revenueBreakdown": {
    "fiscalYear": "<most recent reported, e.g. 'FY24'>",
    "totalRevenue": "<e.g. '₹9.52L Cr'>",
    "bySegment": [ { "name": "<segment>", "percent": <0-100>, "growthYoY": <number>, "color": "<hex like #4A9EFF>" } ],
    "byGeography": [ { "region": "<India/US/Europe/RoW>", "percent": <0-100> } ],
    "byProduct": [ { "category": "<product/service category>", "percent": <0-100> } ]
  },

  "businessSegments": [
    {
      "name": "<segment>",
      "revenueContribution": <percent>,
      "growthRate": <percent yoy>,
      "marginProfile": "<e.g. '15-18% EBITDA'>",
      "strategicImportance": "<Core | Growth | Emerging | Mature>",
      "description": "<one-line strategic role>"
    }
  ],

  "productPortfolio": {
    "flagshipProducts": [ "<product 1>", "<product 2>", "..." ],
    "keyBrands": [ "<brand 1>", "..." ],
    "services": [ "<service 1>", "..." ]
  },

  "subsidiaries": [
    { "name": "<subsidiary>", "ownership": <percent>, "business": "<line>", "contribution": "<role/material to consolidated revenue>" }
  ],

  "globalPresence": {
    "countriesServed": [ "<country>", "..." ],
    "manufacturingLocations": [ "<location>", "..." ],
    "revenueByRegion": [ { "region": "<region>", "percent": <0-100> } ]
  },

  "industry": {
    "name": "<industry name>",
    "sizeINR": "<e.g. '₹8L Cr'>",
    "cagr5y": <percent>,
    "growthDrivers": [ "<driver>", "..." ],
    "keyRisks": [ "<risk>", "..." ],
    "valueChain": [ { "stage": "<Raw Materials | Manufacturing | Distribution | Consumer | ...>", "description": "<short>", "companyPresence": <true|false> } ],
    "marketShare": {
      "companyShare": <percent>,
      "ranking": <integer 1..N>,
      "totalPlayers": <integer>,
      "topPlayers": [ { "name": "<peer>", "share": <percent> } ]
    },
    "trends": [ { "type": "Regulatory|Technology|Demand|Global", "description": "<short>", "impact": "Positive|Negative|Neutral" } ],
    "outlook": { "bull": "<one paragraph>", "base": "<one paragraph>", "bear": "<one paragraph>" }
  },

  "competitors": [
    {
      "ticker": "<NSE ticker>",
      "name": "<company>",
      "revenueCr": <number in Cr>,
      "profitCr": <number in Cr>,
      "ebitdaMargin": <percent>,
      "roe": <percent>,
      "roce": <percent>,
      "debtEquity": <number>,
      "pe": <number>,
      "strengthScore": <0-100>
    }
  ],

  "ownership": {
    "promoter": <percent>,
    "fii": <percent>,
    "dii": <percent>,
    "public": <percent>,
    "pledge": <percent>,
    "changeQoQ": { "promoter": <number>, "fii": <number>, "dii": <number> },
    "smartMoney": {
      "fiiActivity": "<one-line read on FII flow>",
      "mfActivity": "<one-line read on MF accumulation>",
      "conviction": "High|Medium|Low",
      "recentMoves": [ "<short bullet>", "..." ]
    }
  },

  "scores": {
    "businessQuality": <0-100>,
    "managementQuality": <0-100>,
    "competitiveAdvantage": <0-100>,
    "financialStrength": <0-100>,
    "growthPotential": <0-100>,
    "companyScore": <0-100>
  },

  "moat": {
    "brand": <0-10>,
    "cost": <0-10>,
    "network": <0-10>,
    "switching": <0-10>,
    "distribution": <0-10>,
    "ip": <0-10>,
    "explanation": "<2-3 sentence paragraph on the company's economic moat>"
  },

  "supplyChain": {
    "keySuppliers": [ "<supplier or category>", "..." ],
    "keyCustomers": [ "<customer or segment>", "..." ],
    "concentrationRisk": "High|Medium|Low",
    "description": "<one-line on dependency risk>"
  },

  "risks": [
    { "type": "Regulatory|Currency|Commodity|Debt|Industry|Management", "severity": "High|Medium|Low", "description": "<concrete risk for this company>" }
  ],

  "thesis": {
    "whyBuy": [ "<bullet>", "..." ],
    "whyAvoid": [ "<bullet>", "..." ],
    "keyTriggers": [ "<bullet>", "..." ],
    "majorRisks": [ "<bullet>", "..." ]
  }
}

Length guidance: include 3-6 business segments, up to 5 subsidiaries, 3-5 peers (closest competitors), 4-7 risks, 4-7 items per thesis list. Keep descriptions concise (one or two lines).`;
}

export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "company-intelligence", limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  let body: { ticker?: string; companyName?: string; force?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const ticker = (body.ticker || "").trim().toUpperCase();
  if (!ticker) return NextResponse.json({ error: "Ticker required" }, { status: 400 });
  const name = (body.companyName || ticker).trim();

  // Cache hit?
  const cacheKey = ticker;
  const hit = cache.get(cacheKey);
  if (!body.force && hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json(
      { success: true, ticker, generatedAt: new Date(hit.ts).toISOString(), cached: true, dossier: hit.data, provenance: "ai-estimate" },
      { headers: cacheHeaders(3600) }
    );
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI service not configured" }, { status: 503 });

    // Ground in a live price so the snapshot's marketCap line can be sane.
    const live = await fetchLiveStockPrice(ticker);
    const priceLine = live
      ? `LIVE GROUNDING — Current price ₹${live.price.toFixed(2)} (from ${live.source}, ${new Date(live.asOf).toISOString()}). Anchor marketCap and any price-derived references to this figure.`
      : `No live price was available — treat any market-cap figure as a recent estimate and round conservatively.`;

    const prompt = buildPrompt(ticker, name, priceLine);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 16000, temperature: 0.55, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini company-intelligence error:", err.slice(0, 500));
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let dossier: unknown;
    try {
      dossier = JSON.parse(text);
    } catch {
      // Try to extract JSON object even if wrapped
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try { dossier = JSON.parse(text.slice(start, end + 1)); }
        catch { return NextResponse.json({ error: "AI returned malformed JSON" }, { status: 502 }); }
      } else {
        return NextResponse.json({ error: "AI returned malformed JSON" }, { status: 502 });
      }
    }

    cache.set(cacheKey, { data: dossier, ts: Date.now() });

    return NextResponse.json({
      success: true,
      ticker,
      companyName: name,
      generatedAt: new Date().toISOString(),
      cached: false,
      dossier,
      // Provenance — every field in the dossier is AI-generated from public-filings
      // knowledge. The live price (where shown) is the only field that is live.
      provenance: "ai-estimate",
      livePrice: live ? { price: +live.price.toFixed(2), source: live.source, asOf: live.asOf } : null,
      dataNote: "Business Intelligence is AI-generated from public filings. Verify specific figures (CEO, AUM, segment mix, ownership) against the company's latest annual report / NSE filings before deciding.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Company intelligence error:", msg);
    return NextResponse.json({ error: "Company intelligence generation failed" }, { status: 500 });
  }
}
