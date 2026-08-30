import { NextResponse } from "next/server";
import { cacheHeaders } from "@/lib/services/apiGuard";

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

// ─── Fallback articles when Gemini is rate-limited ───
const FALLBACK: Record<string, unknown[]> = {
  stocks: [
    { headline: "NIFTY 50 Maintains Bullish Momentum Near Key Resistance Levels", body: "NIFTY 50 continues to trade above 22,500 support, with strong DII buying cushioning any dips. Analysts target 23,200 on the upside. Banking and auto sectors lead the advance with 2-3% weekly gains.", category: "TECHNICAL", sentiment: "bullish", urgency: "high" },
    { headline: "FII Outflows Moderate as Dollar Index Softens Below 104", body: "Foreign institutional investors reduced net selling to ₹800 crore this week, down from ₹3,200 crore last week. The softening DXY provides relief to emerging market flows, with India remaining a preferred destination.", category: "FLOWS", sentiment: "neutral", urgency: "medium" },
    { headline: "RBI Holds Rates Steady, Signals Data-Dependent Future Path", body: "The Reserve Bank of India maintained repo rate at 6.5% for the eighth consecutive meeting. Governor Das emphasized inflation vigilance while acknowledging growth resilience. Bond yields remained stable at 7.08%.", category: "POLICY", sentiment: "neutral", urgency: "high" },
    { headline: "IT Sector Faces Margin Pressure Amid Delayed Deal Closures", body: "Top-tier IT companies report 50-100bps margin compression due to wage hikes and slower deal conversions. TCS and Infosys guide cautious FY25 revenue growth of 1-3% in constant currency terms.", category: "EARNINGS", sentiment: "bearish", urgency: "medium" },
    { headline: "Mid-Cap Valuations Stretch to 28x PE; Analysts Urge Caution", body: "NIFTY Midcap 100 trades at 28x forward PE, a 35% premium to its 5-year average. Fund managers warn of selective profit-booking while maintaining structural long-term bullishness on quality mid-caps.", category: "RISK", sentiment: "bearish", urgency: "high" },
    { headline: "Capital Goods and Defence Sectors Attract Record Institutional Allocation", body: "Mutual fund allocation to capital goods reached 8.2% of AUM, highest in a decade. Defence stocks see 40% YoY order book growth, with HAL and BEL leading institutional portfolios.", category: "STRATEGY", sentiment: "bullish", urgency: "medium" },
  ],
  commodities: [
    { headline: "Gold Surges Past $2,400 on Safe-Haven Demand Amid Geopolitical Tensions", body: "Spot gold climbed 1.8% to $2,420/oz as Middle East tensions escalate. Central bank buying from China and India continues at record pace. MCX gold trades at ₹72,500 per 10 grams.", category: "MACRO", sentiment: "bullish", urgency: "breaking" },
    { headline: "Crude Oil Steady Near $82 as OPEC+ Maintains Production Cuts", body: "Brent crude holds at $82.50/bbl after OPEC+ reaffirmed output cuts through Q3. US inventory draw of 3.2 million barrels supports prices. MCX crude trades at ₹6,850 per barrel.", category: "STRATEGY", sentiment: "neutral", urgency: "high" },
    { headline: "Silver Outperforms Gold with Industrial Demand Driving Rally", body: "Silver gained 3.2% this week to $31.50/oz, outperforming gold. Solar panel demand accounts for 14% of total silver consumption. The gold-silver ratio compressed to 76x from 82x.", category: "TECHNICAL", sentiment: "bullish", urgency: "medium" },
    { headline: "Natural Gas Prices Spike on Summer Cooling Demand Forecasts", body: "Henry Hub natural gas surged 8% to $2.90/MMBtu on above-normal temperature forecasts. US storage levels sit 15% above 5-year average but drawdowns are accelerating.", category: "DATA", sentiment: "bullish", urgency: "high" },
    { headline: "Copper Hits 2-Year High on China Stimulus and Green Energy Push", body: "LME copper reached $10,200/tonne, driven by China's infrastructure spending and global EV adoption. MCX copper at ₹850/kg. Supply constraints from Chilean mines add upward pressure.", category: "FLOWS", sentiment: "bullish", urgency: "high" },
    { headline: "Agricultural Commodities Mixed; Wheat Falls on Strong Harvest Outlook", body: "CBOT wheat dropped 4% on favorable US and EU harvest conditions. Conversely, cocoa prices remain elevated at $8,500/tonne due to West African supply disruptions.", category: "RISK", sentiment: "neutral", urgency: "medium" },
  ],
  crypto: [
    { headline: "Bitcoin Consolidates Above $67K as ETF Inflows Resume Strongly", body: "Bitcoin holds above $67,000 with spot ETF net inflows of $500 million this week. BlackRock's IBIT leads with $200 million daily. On-chain data shows decreasing exchange balances, suggesting accumulation.", category: "FLOWS", sentiment: "bullish", urgency: "high" },
    { headline: "Ethereum Eyes $4,000 as Layer-2 Activity Hits All-Time Highs", body: "ETH trades at $3,750 with Arbitrum and Base L2 networks processing 15 million daily transactions combined. EIP-4844 reduces L2 fees by 90%, driving massive user adoption.", category: "TECHNICAL", sentiment: "bullish", urgency: "medium" },
    { headline: "India Crypto Tax Collections Signal Growing Retail Participation", body: "India's 1% TDS on crypto transactions generated ₹800 crore in Q1 FY25, up 60% YoY. CoinDCX and WazirX report 45% increase in new user registrations despite regulatory uncertainty.", category: "DATA", sentiment: "neutral", urgency: "medium" },
    { headline: "Solana DeFi TVL Surpasses $5 Billion, Challenging Ethereum Dominance", body: "Solana's total value locked reached $5.2 billion, growing 180% YTD. Jupiter DEX processes $2 billion daily volume. SOL trades at $175, up 12% this month.", category: "STRATEGY", sentiment: "bullish", urgency: "high" },
    { headline: "SEC Delays Altcoin ETF Decisions; Market Awaits Regulatory Clarity", body: "The SEC postponed decisions on Solana and XRP spot ETFs to Q4. Meanwhile, Ethereum ETF staking inclusion remains under review. Market sentiment shows cautious optimism for eventual approvals.", category: "POLICY", sentiment: "neutral", urgency: "high" },
    { headline: "Bitcoin Halving Supply Shock Yet to Fully Impact Market Pricing", body: "Post-halving miner revenue dropped 45%, forcing operational efficiency. Historical patterns suggest 12-18 month lag before supply reduction fully reflects in price. Hash rate remains at all-time highs.", category: "MACRO", sentiment: "bullish", urgency: "medium" },
  ],
  currency: [
    { headline: "USD/INR Stabilizes Near 83.40 as RBI Intervenes to Cap Volatility", body: "The rupee trades in a tight 83.20-83.50 range with RBI actively managing forex reserves at $645 billion. Forward premiums decline to 1.8% annualized, reflecting reduced hedging demand.", category: "POLICY", sentiment: "neutral", urgency: "high" },
    { headline: "DXY Retreats Below 104 on Soft US Jobs Data; EM Currencies Rally", body: "The Dollar Index fell to 103.8 after US non-farm payrolls missed estimates at 175K vs 240K expected. Emerging market currencies gained 0.5-1% broadly against the greenback.", category: "MACRO", sentiment: "bullish", urgency: "breaking" },
    { headline: "EUR/USD Advances Toward 1.09 on ECB Rate Cut Divergence Narrative", body: "Euro strengthened to 1.0880 as markets price in delayed ECB cuts relative to the Fed. European PMI data shows manufacturing recovery, supporting the single currency.", category: "TECHNICAL", sentiment: "bullish", urgency: "medium" },
    { headline: "Carry Trade Activity Surges in JPY Pairs as BOJ Maintains Ultra-Low Rates", body: "USD/JPY trades above 155 as the Bank of Japan holds rates near zero. Carry trade positions in yen-funded strategies reach $18 billion, raising concerns of sharp unwind risks.", category: "RISK", sentiment: "bearish", urgency: "high" },
    { headline: "GBP/INR Crosses 106 on Strong UK Services PMI at 55.0", body: "Sterling surged against the rupee to 106.20 as UK services sector expansion accelerated. Bank of England rate cut expectations pushed to September, supporting GBP demand.", category: "DATA", sentiment: "neutral", urgency: "medium" },
    { headline: "RBI's Forward Book Shrinks to $22B; Rupee Defended Through Spot Sales", body: "RBI's outstanding net forward position contracted to $22 billion from $30 billion. The central bank shifted to spot market dollar sales to defend the 83.50 level.", category: "FLOWS", sentiment: "neutral", urgency: "high" },
  ],
  mutualfunds: [
    { headline: "SIP Flows Hit Record ₹20,000 Crore Monthly, Driven by Retail Investors", body: "Monthly SIP contributions crossed ₹20,000 crore for the first time, with 8.5 crore active SIP accounts. Small-cap and mid-cap funds attract 40% of new SIP registrations.", category: "FLOWS", sentiment: "bullish", urgency: "breaking" },
    { headline: "SEBI Tightens Small-Cap Fund Stress Testing After Liquidity Concerns", body: "SEBI mandated monthly stress test disclosures for small-cap and mid-cap funds. Top AMCs report 15-25 day liquidation timelines, alleviating some investor concerns about redemption risk.", category: "POLICY", sentiment: "neutral", urgency: "high" },
    { headline: "Large-Cap Funds Underperform Benchmarks; Index Funds Gain Market Share", body: "Only 35% of large-cap active funds beat NIFTY 50 over 3 years. Passive fund AUM grows 45% YoY to ₹9 lakh crore. Nifty 50 index funds now preferred by new investors.", category: "DATA", sentiment: "neutral", urgency: "medium" },
    { headline: "Flexi-Cap Category Sees Highest NFO Activity in FY25 First Quarter", body: "Six new flexi-cap fund NFOs launched in Q1, collectively raising ₹12,000 crore. Fund managers cite flexibility to navigate market cap rotations as key selling proposition.", category: "STRATEGY", sentiment: "bullish", urgency: "medium" },
    { headline: "Debt Fund Inflows Surge as Credit Spreads Compress to 5-Year Lows", body: "Corporate bond funds saw ₹18,000 crore inflows in May as AAA-rated spreads narrowed to 40bps over G-Sec. Duration funds benefit from rate cut expectations in H2 FY25.", category: "MACRO", sentiment: "bullish", urgency: "high" },
    { headline: "Multi-Asset Allocation Funds Emerge as Top Performer Category YTD", body: "Multi-asset funds delivered 14-18% returns YTD, outperforming pure equity categories. Gold and international equity allocations provided diversification alpha during market volatility.", category: "EARNINGS", sentiment: "bullish", urgency: "medium" },
  ],
  debt: [
    { headline: "India 10-Year G-Sec Yield Eases to 7.05% on Global Bond Rally", body: "Benchmark 10-year yield fell 8bps to 7.05% tracking US Treasury rally. JP Morgan index inclusion driving $2 billion passive FPI inflows into Indian government bonds since June.", category: "FLOWS", sentiment: "bullish", urgency: "high" },
    { headline: "RBI Conducts ₹50,000 Crore OMO Purchase to Manage Liquidity Deficit", body: "The central bank announced open market operations to inject ₹50,000 crore amid tightening system liquidity. Overnight rates rose to 6.75%, above the repo rate of 6.5%.", category: "POLICY", sentiment: "neutral", urgency: "breaking" },
    { headline: "Corporate Bond Issuance Hits ₹2 Lakh Crore in Q1; AAA Spreads Compress", body: "Primary corporate bond market sees robust activity with ₹2.1 lakh crore issuance in Q1. AAA-rated 3-year spreads at 35bps over G-Sec, lowest since 2019.", category: "DATA", sentiment: "bullish", urgency: "medium" },
    { headline: "US Treasury 10Y at 4.35%; Rate Cut Expectations Shift to September", body: "US 10-year yield stabilizes at 4.35% as Fed Chair signals patience on cuts. CME FedWatch shows 65% probability of September cut, down from 80% last month.", category: "MACRO", sentiment: "neutral", urgency: "high" },
    { headline: "State Development Loans Auction Sees Strong Demand; Cut-Off Yields Fall", body: "SDL auctions saw 2.5x bid-to-cover ratio with cut-off yields falling 10-15bps. State borrowing program remains on track at ₹4.2 lakh crore for H1 FY25.", category: "TECHNICAL", sentiment: "bullish", urgency: "medium" },
    { headline: "Credit Risk Funds See Outflows as NBFC Stress Concerns Resurface", body: "Credit risk category witnessed ₹2,400 crore outflows amid concerns over select NBFC asset quality. Fund managers increase allocation to AAA-rated papers, reducing portfolio yield by 30-50bps.", category: "RISK", sentiment: "bearish", urgency: "high" },
  ],
  international: [
    { headline: "S&P 500 Hits New Record Above 5,300 on AI Sector Momentum", body: "The S&P 500 reached 5,320 with technology and communication services sectors contributing 60% of YTD gains. NVIDIA's market cap surpasses $2.5 trillion, becoming third-largest globally.", category: "TECHNICAL", sentiment: "bullish", urgency: "high" },
    { headline: "European Markets Rally as ECB Signals June Rate Cut Probability Rising", body: "Euro Stoxx 50 gained 2.1% as ECB officials signal growing consensus for June rate reduction. German DAX hits all-time high at 18,900 led by industrial and automotive stocks.", category: "POLICY", sentiment: "bullish", urgency: "breaking" },
    { headline: "China Stimulus Measures Boost Hang Seng 8% in May; Property Focus", body: "Hong Kong's Hang Seng surged on Beijing's expanded property rescue package worth $42 billion. Chinese tech giants rally 10-15% as regulatory concerns ease. FII flows return to mainland.", category: "MACRO", sentiment: "bullish", urgency: "high" },
    { headline: "Japan's Nikkei Corrects 3% from Highs on Yen Intervention Concerns", body: "Nikkei 225 pulled back to 38,200 as BOJ intervention fears weigh on export-heavy stocks. USD/JPY retreated from 160 to 155 on suspected MOF intervention of $30 billion.", category: "RISK", sentiment: "bearish", urgency: "high" },
    { headline: "Global Fund Managers Rotate into Emerging Markets; India Tops Allocation", body: "BofA Global Fund Manager Survey shows EM allocation at 18-month high. India receives highest overweight at net +22%, followed by Brazil and Indonesia.", category: "FLOWS", sentiment: "bullish", urgency: "medium" },
    { headline: "US-China Trade Tensions Escalate with New Tech Export Restrictions", body: "Washington announced expanded chip export controls targeting Chinese AI companies. Semiconductor stocks dipped 2-3% globally. ASML and TSMC face revenue uncertainty from compliance requirements.", category: "RISK", sentiment: "bearish", urgency: "high" },
  ],
};

export async function GET(request: Request) {
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
    const fb = FALLBACK[tab] || FALLBACK.stocks;
    return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "fallback" });
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
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      // Rate limited or error — return fallback
      const fb = FALLBACK[tab] || FALLBACK.stocks;
      return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "fallback" });
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      const fb = FALLBACK[tab] || FALLBACK.stocks;
      return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "fallback" });
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
      const fb = FALLBACK[tab] || FALLBACK.stocks;
      return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "fallback" });
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
      const fb = FALLBACK[tab] || FALLBACK.stocks;
      return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "fallback" });
    }

    // Cache the result
    cache[tab] = { articles, ts: Date.now() };

    return NextResponse.json({ articles, generatedAt: new Date().toISOString() }, { headers: cacheHeaders(600) });
  } catch {
    // Any error — return fallback
    const fb = FALLBACK[tab] || FALLBACK.stocks;
    return NextResponse.json({ articles: fb, generatedAt: new Date().toISOString(), source: "fallback" });
  }
}
