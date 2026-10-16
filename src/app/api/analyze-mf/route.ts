/**
 * POST /api/analyze-mf  { schemeCode }
 *
 * AI commentary grounded in the verified scheme report (AMFI NAVs + mf-returns.ts).
 * The model writes prose only. Every number in the returned `scores` object is
 * filled server-side from the verified report — never taken from the model — and
 * fields without a verified source (AUM, expense ratio, holdings, peers, benchmark)
 * are null.
 */
import { NextRequest, NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/services/apiGuard";
import { buildSchemeReport } from "@/lib/mf-scheme-report";
import { getSchemeHistory } from "@/lib/amfi-service";
import { parseMfapiHistory, sip, shiftDate } from "@/lib/mf-returns";

type Trailing = { label: string; absolutePct: number | null; annualizedPct: number | null; annualized: boolean; startDate: string | null };
import { withAiAccess } from "@/lib/aiAccess";

async function handlePOST(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "analyze-mf", limit: 5, windowMs: 60000 });
  if (limited) return limited;
  const { schemeCode, symbol } = await req.json();
  const code = Number(schemeCode ?? symbol);
  if (!Number.isInteger(code) || code <= 0) {
    return NextResponse.json({ error: "Select a specific scheme (plan and option) from the search results first." }, { status: 400 });
  }

  const { status, body } = await buildSchemeReport(code);
  if (status !== 200) return NextResponse.json({ error: (body.error as string) || "Scheme not found" }, { status });
  const scheme = body.scheme as { schemeName: string; amcName: string; schemeCategory: string; plan: string; option: string; nav: number | null; navDate: string | null; launchDate: string | null; minInvestment: number | null; status: string };
  const perf = body.performance as null | {
    asOfNavDate: string; trailing: Trailing[]; sinceFirstNav: Trailing & { isSinceInception: boolean };
    rolling: Record<string, { median: number; min: number; max: number; pctPositive: number } | null> | null;
    risk: { volatilityPct?: number; maxDrawdownPct?: number; sharpe?: number | null; sortino?: number | null; riskFreeNote?: string; reason?: string };
    navOnlyCaveat: string | null;
  };

  // Real SIP outcomes: ₹10,000 monthly, started 1/3/5 years before the latest NAV.
  const sipReturns: Record<string, number | null> = { sip1Y: null, sip3Y: null, sip5Y: null };
  const sipXirr: Record<string, number | null> = { sip1Y: null, sip3Y: null, sip5Y: null };
  if (perf) {
    const hist = await getSchemeHistory(code);
    const series = hist ? parseMfapiHistory(hist.data).series : [];
    for (const y of [1, 3, 5]) {
      const start = shiftDate(perf.asOfNavDate, { years: -y });
      if (series.length && series[0].date <= start) {
        const r = sip(series, 10000, start);
        if (r) { sipReturns[`sip${y}Y`] = Math.round(r.value); sipXirr[`sip${y}Y`] = r.xirrPct; }
      }
    }
  }
  const ret = (label: string) => {
    const r = perf?.trailing.find(t => t.label === label);
    if (!r) return null;
    const v = r.annualized ? r.annualizedPct : r.absolutePct;
    return v === null ? null : Math.round(v * 100) / 100;
  };

  const facts = {
    scheme: { name: scheme.schemeName, amc: scheme.amcName, amfiCategory: scheme.schemeCategory, plan: scheme.plan, option: scheme.option,
      amfiSchemeCode: code, launchDate: scheme.launchDate, minimumInvestmentINR: scheme.minInvestment, status: scheme.status },
    nav: { value: scheme.nav, navDate: scheme.navDate, note: "Published by AMFI for that date; not a live price." },
    returnsPct: perf ? Object.fromEntries(perf.trailing.map(t => [t.label, { value: t.annualized ? t.annualizedPct : t.absolutePct, type: t.annualized ? "CAGR" : "absolute", fromNavDate: t.startDate }])) : null,
    sinceFirstNavPct: perf ? { cagr: perf.sinceFirstNav.annualizedPct, from: perf.sinceFirstNav.startDate, isSinceInception: perf.sinceFirstNav.isSinceInception } : null,
    rollingCagrPct: perf?.rolling ?? null,
    risk3y: perf?.risk ?? null,
    sip10kPerMonth: { finalValueINR: sipReturns, xirrPct: sipXirr },
    caveat: perf?.navOnlyCaveat ?? null,
    notAvailable: ["AUM", "expense ratio", "fund manager", "benchmark and benchmark returns", "category averages", "exit load", "portfolio holdings", "sector allocation", "credit quality", "riskometer", "peer rankings", "beta / alpha"],
  };

  const prompt = `You are writing an educational mutual fund note for Indian retail investors.

STRICT RULES
1. Use ONLY the figures in the FACTS JSON below. Do not state any other number, date, name or statistic about this fund.
2. For anything listed in "notAvailable", say plainly that verified data is not available. Never estimate it.
3. Do not give a buy/sell/hold recommendation or a rating, and do not predict future returns.
4. NAVs are dated: always say "as of <navDate>". Distinguish absolute returns (under 1 year) from CAGR.
5. If "caveat" is set, repeat it prominently.
6. General education (e.g. how Direct vs Regular plans or Growth vs IDCW differ) is fine, without fund-specific numbers.

FACTS
${JSON.stringify(facts, null, 1)}

Write markdown with these sections:
### 1. Scheme overview
### 2. Performance (trailing and since first NAV)
### 3. Consistency (rolling returns)
### 4. Risk (volatility, drawdown, Sharpe/Sortino — explain the risk-free proxy)
### 5. What a ₹10,000 monthly SIP would have become
### 6. Plan and option considerations
### 7. What we cannot assess yet (from notAvailable)
### 8. Questions an investor should ask before deciding

Then output exactly one JSON block:
\`\`\`json
{ "summary": "<2 sentences, facts only>",
  "scores": { "consistency": <1-10>, "riskManagement": <1-10>, "downsideProtection": <1-10>, "sipSuitability": <1-10> },
  "scoreBasis": "<one sentence naming which FACTS figures the scores rely on>" }
\`\`\`
Scores are judgements from the FACTS only; use null for any score the FACTS cannot support.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI analysis is not configured (GEMINI_API_KEY missing)." }, { status: 503 });

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 8000, temperature: 0.3 } }),
    });
    if (!res.ok) {
      console.error("Gemini error:", await res.text());
      return NextResponse.json({ error: "AI analysis is temporarily unavailable." }, { status: 502 });
    }
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let analysis = text;
    let model: { summary?: string; scores?: Record<string, number | null>; scoreBasis?: string } = {};
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try { model = JSON.parse(jsonMatch[1]); analysis = text.replace(/```json\s*[\s\S]*?\s*```/, "").trim(); } catch { /* keep prose */ }
    }
    const clampScore = (v: unknown) => (typeof v === "number" && v >= 1 && v <= 10 ? Math.round(v) : null);

    // Every number below comes from the verified report, not the model.
    const scores = {
      rating: null, outlook: null,
      currentNAV: scheme.nav, navDate: scheme.navDate, aum: null, expenseRatio: null,
      returns: { return1Y: ret("1Y"), return3Y: ret("3Y"), return5Y: ret("5Y"), return10Y: ret("10Y"), benchmarkReturn3Y: null, categoryAvgReturn3Y: null },
      sipReturns,
      scores: {
        consistency: clampScore(model.scores?.consistency), riskManagement: clampScore(model.scores?.riskManagement),
        downsideProtection: clampScore(model.scores?.downsideProtection), sipSuitability: clampScore(model.scores?.sipSuitability),
        fundManagerQuality: null, portfolioQuality: null, expenseEfficiency: null, alphaGeneration: null,
      },
      scoreBasis: model.scoreBasis ?? null,
      risk: { sharpeRatio: perf?.risk?.sharpe ?? null, standardDeviation: perf?.risk?.volatilityPct ?? null, beta: null, maxDrawdown: perf?.risk?.maxDrawdownPct ?? null, riskGrade: null },
      scenarios: null, topHoldings: [], topSectors: [], peerFunds: [],
      summary: model.summary ?? null,
      provenance: "Figures: AMFI NAVs and White Tiger calculations. Prose: AI-generated from those figures only.",
    };
    return NextResponse.json({ analysis, scores, symbol: String(code), name: scheme.schemeName });
  } catch (err: unknown) {
    console.error("MF analysis error:", err);
    return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
  }
}

// Signed-in users only; counts toward the monthly plan quota (src/lib/aiAccess.ts).
export const POST = withAiAccess("analysis", handlePOST);
