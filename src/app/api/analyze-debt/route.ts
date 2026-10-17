import { NextRequest, NextResponse } from "next/server";
import { NEUTRAL_SYSTEM_INSTRUCTION } from "@/lib/neutral";
import { rateLimitResponse } from "@/lib/services/apiGuard";
import { withAiAccess } from "@/lib/aiAccess";
import { BONDS_LIST } from "@/lib/bonds";
import { fetchLiveYields } from "@/lib/services/livePrice";

async function handlePOST(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "analyze-debt", limit: 5, windowMs: 60000 });
  if (limited) return limited;
  const { symbol, name, category, type, tenure, coupon, rating, issuer } = await req.json();

  if (!symbol) {
    return NextResponse.json({ error: "Bond/debt instrument identifier is required" }, { status: 400 });
  }

  const bondName = name || symbol;

  // Verified facts only: catalogue entry (official rates with period) + live 10Y G-Sec.
  const entry = BONDS_LIST.find(b => b.symbol === symbol);
  const live = await fetchLiveYields().catch(() => null);
  const live10 = live?.india10Y && live.india10Y > 0 ? live.india10Y : null;
  const officialRate = entry && /^\d/.test(entry.yieldApprox) ? parseFloat(entry.yieldApprox) : null;
  const instrumentRate = entry?.yieldApprox === "LIVE" ? live10 : officialRate;
  const facts = [
    `- Instrument: ${bondName} (${category || entry?.category || "Fixed income"}), issuer: ${issuer || entry?.issuer || "n/a"}, tenure: ${tenure || entry?.tenure || "n/a"}`,
    `- Coupon / interest: ${coupon || entry?.coupon || "varies by issue"}`,
    `- Credit: ${rating || entry?.rating || "n/a"}`,
    instrumentRate != null
      ? `- Current ${entry?.yieldApprox === "LIVE" ? "yield" : "rate"}: ${instrumentRate}% (${entry?.note || "verified"})`
      : `- Current yield: market-linked; no live quote is available for this analysis`,
    live10 != null ? `- Live India 10-year G-Sec benchmark yield: ${live10}% (TradingView, as of ${live?.asOf})` : `- Live 10-year G-Sec yield: unavailable right now`,
  ].join("\n");

  const prompt = `Write a clear, neutral explainer on the Indian fixed-income instrument **${bondName}** for retail readers in India.

VERIFIED FACTS (the only current numbers you may state):
${facts}

RULES
- Use ONLY the numbers in VERIFIED FACTS for current yields, rates or prices. Do not state any other current yield, price, repo rate, inflation figure, FD rate, fund return or historical range — describe them in words and say where the reader can check (RBI, FBIL, NSE/BSE, India Post, their broker or bank).
- Do not forecast interest rates or prices. Do not recommend buying, selling or holding, and do not say who should invest.
- Indian tax rules for debt changed in 2023–2024 (for example, indexation was removed for most debt investments). Describe tax treatment generally and tell the reader to check current rules.
- Illustrative calculations are allowed only if clearly labelled "illustration".

You MUST output TWO parts:

**PART 1: MARKDOWN EXPLAINER**

### 1. What This Instrument Is
### 2. How Returns Work (coupon, yield, and how price moves when interest rates change)
### 3. Interest-Rate Sensitivity (qualitative; one labelled illustration is fine)
### 4. Credit and Liquidity
### 5. Tax Treatment (general; verify current rules)
### 6. How to Buy or Hold It in India
### 7. Compared With Alternatives (bank FDs, debt mutual funds, small-savings schemes — qualitative)
### 8. Key Risks (5-6 concrete risks)
### 9. What to Check Before Investing

**PART 2: SCORES JSON** at the very end:

\`\`\`json
{
  "creditRating": "",
  "scores": {
    "creditQuality": 0,
    "liquidityScore": 0,
    "interestRateSensitivity": 0,
    "taxEfficiency": 0,
    "inflationProtection": 0,
    "reinvestmentRisk": 0
  },
  "alternatives": ["instrument1", "instrument2", "instrument3"]
}
\`\`\`

Scores are 1-10 descriptive characteristics of the instrument (not recommendations).`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: NEUTRAL_SYSTEM_INSTRUCTION, contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8000, temperature: 0.3 },
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

    // Only verified numbers reach the screen: drop any AI-estimated prices, yields,
    // durations, policy rates or comparisons, then add the verified ones.
    const verified: Record<string, unknown> = {};
    if (scores && typeof scores === "object") {
      const sc = scores as Record<string, unknown>;
      if (sc.scores) verified.scores = sc.scores;
      if (Array.isArray(sc.alternatives)) verified.alternatives = sc.alternatives;
    }
    verified.creditRating = rating || entry?.rating || (scores as Record<string, unknown> | null)?.creditRating || "";
    if (instrumentRate != null) verified.ytm = instrumentRate;
    if (live10 != null) verified.yieldComparison = { gsecBenchmark: live10 };

    return NextResponse.json({ analysis, scores: verified, symbol, name: bondName, facts: { instrumentRate, live10, asOf: live?.asOf ?? null } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Debt analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}

// Signed-in users only; counts toward the monthly plan quota (src/lib/aiAccess.ts).
export const POST = withAiAccess("analysis", handlePOST);
