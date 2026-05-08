import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
- **US-India trade relations:** How do US tariffs, trade deals, or policy shifts affect this company?
- **China factor:** Is this company a China+1 beneficiary or threatened by Chinese competition?
- **India government policy:** How do PLI schemes, Make in India, or Budget allocations impact this company?
- **Global macro:** How do US Fed rate decisions, crude oil prices, and USD/INR affect this stock?
- **Geopolitical risk score:** LOW / MEDIUM / HIGH with a 1-line reason.

## Key Catalysts (Next 12 months)
3-4 specific near-term triggers including domestic and global events.

## Key Risks
4-5 concrete risks — at least 2 must be geopolitical or macro risks.

## Smart Entry Strategy
- **Ideal buy zone:** ₹[X] – ₹[Y]
- **Stop loss:** ₹[Z]
- **Target (12 months):** ₹[W]
- **Position sizing note:** 1-2 lines on portfolio allocation.

## Verdict
One decisive paragraph for a retail Indian investor considering the global macro environment.

---
Be specific with numbers. Label estimates clearly. Write like a Goldman Sachs India research note.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const text = response.text ?? "";
    return NextResponse.json({ analysis: text, ticker, companyName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Analysis error:", msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
