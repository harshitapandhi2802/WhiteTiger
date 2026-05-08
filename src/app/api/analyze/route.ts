import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { ticker, companyName } = await req.json();

  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }

  const prompt = `You are a senior equity research analyst at a top-tier Indian investment bank with deep expertise in geopolitical risk, global macro, and Indian markets. Conduct a comprehensive analysis for **${companyName || ticker}** (${ticker}) listed on NSE/BSE.

Provide your analysis in the following structured format using markdown:

## Investment Rating
Give one of: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
Explain the rating in 2-3 sentences including geopolitical context.

## Fair Value Estimate (DCF)
- **Fair Value:** ₹[X] per share
- **Current Market Price:** ~₹[Y] (approximate, note this is an estimate)
- **Upside/Downside:** [Z]%
- **WACC:** X% | **Terminal Growth Rate:** Y% | **Horizon:** 5 years
Brief reasoning behind your DCF assumptions.

## Company Overview
2-3 sentences: what they do, market position, revenue model, and their strategic importance to India's economy.

## Investment Thesis
4-5 bullet points — be specific. Mention actual segments, products, competitive advantages, and why NOW is or isn't a good time.

## Financial Snapshot
- Revenue CAGR (3-year)
- EBITDA margin range
- Debt-to-Equity ratio
- Return on Equity (ROE)
- P/E vs sector average
- Free Cash Flow trend

## 🌍 Geopolitical & Macro Risk Analysis
This is critical. Analyze the following for this specific company:
- **US-India trade relations:** How do US tariffs, trade deals, or policy shifts affect this company's exports, imports, or valuation?
- **China factor:** Is this company a China+1 beneficiary or threatened by Chinese competition/supply chain dependency? Be specific.
- **India government policy:** How do PLI schemes, Make in India, Budget allocations, or SEBI regulations directly impact this company?
- **Global macro:** How do US Fed rate decisions, crude oil prices, and USD/INR exchange rate affect this stock specifically?
- **Geopolitical risk score:** Rate the geopolitical sensitivity as LOW / MEDIUM / HIGH with a 1-line reason.

## Key Catalysts (Next 12 months)
3-4 specific near-term triggers — include both domestic and global events that could move the stock.

## Key Risks
4-5 concrete risks — at least 2 must be geopolitical or macro risks specific to this company. No generic boilerplate.

## Smart Entry Strategy
- **Ideal buy zone:** ₹[X] – ₹[Y]
- **Stop loss:** ₹[Z]
- **Target (12 months):** ₹[W]
- **Position sizing note:** 1-2 lines on how much of a portfolio this deserves given its risk profile.

## Verdict
One decisive paragraph. What should a retail Indian investor do right now, considering the global macro environment?

---
Rules: Be specific with numbers. Clearly label estimates. Write like a Goldman Sachs India research note, not a Wikipedia summary. The geopolitical section is your USP — make it genuinely insightful.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response format" }, { status: 500 });
    }

    return NextResponse.json({ analysis: content.text, ticker, companyName });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Analysis error:", message);
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
