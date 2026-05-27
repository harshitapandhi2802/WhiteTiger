// src/app/api/derivatives-agent/route.ts
// Derivatives Agent API v2.0 — AI Copilot + GEX + Strategy Engine + Vol Intelligence + Stress Testing
import { NextResponse } from "next/server";
import {
  detectMarketRegime,
  detectPositioning,
  calculateProbabilities,
  runMonteCarlo,
  generateSmartMoneyAlerts,
  calculateQuantScores,
  generateCorrelations,
  calculateSupportResistance,
  calculateGEX,
  calculateVolatilityIntelligence,
  generateOptionsStrategies,
  generateCopilotNarrative,
  runStressTests,
  seededRng,
} from "@/lib/quant-engine";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "NIFTY";
  const tick = Date.now();

  try {
    // 1. Fetch option chain data
    const baseUrl = req.headers.get("host")?.includes("localhost")
      ? "http://localhost:3000"
      : `https://${req.headers.get("host")}`;

    let chainData: any = null;
    try {
      const res = await fetch(`${baseUrl}/api/option-chain?symbol=${symbol}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) chainData = await res.json();
    } catch {
      // Will use generated data
    }

    // 2. Core data extraction
    const rng = seededRng(tick);
    const spotPrice = chainData?.spotPrice || (symbol === "NIFTY" ? 22500 : symbol === "BANKNIFTY" ? 48200 : 21800);
    const spotChange = chainData?.spotChange || (rng() - 0.48) * spotPrice * 0.015;
    const spotChangePct = chainData?.spotChangePct || +(spotChange / spotPrice * 100).toFixed(2);

    const chain = chainData?.chain || generateFallbackChain(symbol, spotPrice, tick);
    const totalCallOI = chain.reduce((s: number, r: any) => s + (r.ce?.oi || r.callOI || 0), 0);
    const totalPutOI = chain.reduce((s: number, r: any) => s + (r.pe?.oi || r.putOI || 0), 0);
    const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : 1;

    const totalCallVol = chain.reduce((s: number, r: any) => s + (r.ce?.volume || r.callVol || 0), 0);
    const totalPutVol = chain.reduce((s: number, r: any) => s + (r.pe?.volume || r.putVol || 0), 0);

    let maxCallOI = 0, maxCallOIStrike = spotPrice, maxPutOI = 0, maxPutOIStrike = spotPrice;
    chain.forEach((r: any) => {
      const coi = r.ce?.oi || r.callOI || 0;
      const poi = r.pe?.oi || r.putOI || 0;
      if (coi > maxCallOI) { maxCallOI = coi; maxCallOIStrike = r.strike; }
      if (poi > maxPutOI) { maxPutOI = poi; maxPutOIStrike = r.strike; }
    });

    const ivPercentile = chainData?.summary?.ivPercentile || Math.round(40 + rng() * 50);
    const atmIV = chainData?.summary?.atmIV || +(12 + rng() * 18).toFixed(1);
    const oiChange = (rng() - 0.45) * totalCallOI * 0.05;
    const volumeRatio = 0.8 + rng() * 1.2;

    // 3. Normalize chain for quant engines
    const normalizedChain = chain.map((r: any) => ({
      strike: r.strike,
      callOI: r.ce?.oi || r.callOI || 0,
      putOI: r.pe?.oi || r.putOI || 0,
      callVol: r.ce?.volume || r.callVol || 0,
      putVol: r.pe?.volume || r.putVol || 0,
    }));

    // 4. GEX Engine (NEW)
    const gex = calculateGEX(normalizedChain, spotPrice, tick);

    // 5. Market Regime (enhanced with GEX)
    const regime = detectMarketRegime({
      spotChange: spotChangePct,
      ivLevel: atmIV,
      pcrRatio: pcr,
      oiTrend: oiChange,
      volumeRatio,
      gex: gex.totalGEX,
    });

    // 6. Positioning
    const positioning = detectPositioning({ priceChange: spotChangePct, oiChange });

    // 7. Probabilities
    const probabilities = calculateProbabilities({
      pcr, ivPercentile, spotChangePct,
      maxCallOIStrike, maxPutOIStrike, spotPrice,
      volumeRatio, tick,
    });

    // 8. Monte Carlo + VaR
    const monteCarlo = runMonteCarlo(spotPrice, atmIV / 100, 7, tick);

    // 9. Smart Money Alerts (enhanced)
    const alerts = generateSmartMoneyAlerts({
      pcr, pcrChange: (rng() - 0.5) * 0.3,
      ivPercentile, spotChangePct,
      maxCallOI, maxPutOI, maxCallOIStrike, maxPutOIStrike,
      spotPrice, totalVolume: totalCallVol + totalPutVol,
      avgVolume: (totalCallVol + totalPutVol) * (0.5 + rng() * 0.5),
      tick,
    });

    // 10. Quant Scores
    const quantScores = calculateQuantScores({
      spotChangePct, volumeRatio, ivPercentile,
      oiChangePct: oiChange / (totalCallOI || 1) * 100,
      pcr, tick,
    });

    // 11. Correlations
    const correlations = generateCorrelations(tick);

    // 12. Support/Resistance
    const supportResistance = calculateSupportResistance(normalizedChain, spotPrice);

    // 13. Volatility Intelligence (NEW)
    const volatilityIntelligence = calculateVolatilityIntelligence({ atmIV, ivPercentile, spotPrice, tick });

    // 14. AI Options Strategy Engine (NEW)
    const strategies = generateOptionsStrategies({
      spotPrice, atmIV, ivPercentile, pcr,
      regime: regime.regime, probabilities, tick,
    });

    // 15. AI Copilot Narrative (NEW)
    const copilot = generateCopilotNarrative({
      symbol, spotPrice, spotChangePct,
      regime, positioning, probabilities,
      pcr, atmIV, ivPercentile, gex, strategies,
    });

    // 16. Stress Tests (NEW)
    const stressTests = runStressTests(spotPrice, atmIV, tick);

    // Return everything
    return NextResponse.json({
      symbol,
      spotPrice,
      spotChange: +spotChange.toFixed(2),
      spotChangePct,
      timestamp: new Date().toISOString(),
      pcr: +pcr.toFixed(2),
      ivPercentile,
      atmIV,
      totalCallOI,
      totalPutOI,
      regime,
      positioning,
      probabilities,
      monteCarlo,
      alerts,
      quantScores,
      correlations,
      supportResistance,
      // v2.0 additions
      gex,
      volatilityIntelligence,
      strategies,
      copilot,
      stressTests,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Agent analysis failed", details: error.message },
      { status: 500 }
    );
  }
}

/* ─── Fallback chain generator ─── */
function generateFallbackChain(symbol: string, spotPrice: number, tick: number) {
  const rng = seededRng(tick + spotPrice);
  const strikeGap = symbol === "BANKNIFTY" ? 100 : 50;
  const atmStrike = Math.round(spotPrice / strikeGap) * strikeGap;
  const chain = [];

  for (let i = -15; i <= 15; i++) {
    const strike = atmStrike + i * strikeGap;
    const dist = Math.abs(i);
    const oiBase = Math.max(100, 500000 * Math.exp(-dist * 0.3));

    chain.push({
      strike,
      callOI: Math.floor(oiBase * (0.6 + rng() * 0.8)),
      putOI: Math.floor(oiBase * (0.5 + rng() * 0.9)),
      callVol: Math.floor(oiBase * 0.1 * (0.5 + rng())),
      putVol: Math.floor(oiBase * 0.1 * (0.5 + rng())),
    });
  }

  return chain;
}
