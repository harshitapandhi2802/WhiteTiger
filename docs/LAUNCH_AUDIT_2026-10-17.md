# White Tiger launch audit, 17 Oct 2026

Method:
- I clicked through every tab in the running app (signed in, desktop).
- I scanned the code for numbers that are generated rather than fetched.
- I compared on-screen figures with the app's own live feeds (`/api/live-prices`, `/api/live-yields`).
- I called the AI routes (stock analysis, stock intelligence, gold) on a local production build.

Priorities: **P0** = fix or hide before public launch · **P1** = fix soon after · **P2** = polish.

---

## Already done (committed locally, not deployed)

**Real Estate and Global Markets now show "Coming soon"** everywhere they can be opened:
- the section grid and the two mobile menus
- direct `/real-estate/<city>` links
- the homepage world-map section, which is hidden

Copy that counted those two sections now describes the 7 live markets: homepage, sign-in screen, intro stats and the welcome email. To open a section later, remove it from `src/lib/comingSoon.ts`.

---

## Verdict by tab

| Tab | Prices / core data | "AI" & intelligence panels | Verdict |
|---|---|---|---|
| **Mutual Funds** | ✅ Real AMFI NAVs (14 Oct), returns independently verified by `scripts/verify-mf-calcs.py` | ✅ Honest "unverified estimate" labels | **Launch** (2 small fixes) |
| **Stocks** | ✅ Live NSE prices, FII/DII from NSE (dated) | ❌ AI analysis gives BUY/SELL, targets and stop-losses; outputs contradict each other | **Launch prices; fix analysis first** |
| **Commodities** | ✅ Live prices | ❌ "AI Commodity Brief · LIVE" contradicts the live cards; generated stories | **Launch prices; hide brief/stories** |
| **Crypto** | ✅ Live prices (CoinDCX/CoinGecko) | ❌ Copilot, stories, on-chain, heatmaps, risk, regulation are random numbers | **Launch prices; hide generated panels** |
| **Forex** | ✅ Live rates for majors | ❌ Copilot uses wrong macro numbers; random "AI trade ideas" with confidence % | **Launch rates; hide generated panels** |
| **Bonds** | ⚠️ "Live" India 10Y shown 7.11% vs live feed 7.39%; ~35 hard-coded yields | ❌ Copilot, stories, calendar generated | **Fix yields or label; hide generated panels** |
| **Derivatives** | ❌ Option chain simulated (NIFTY 24,993 vs real ~23,146); agent shows NIFTY 22,500 as LIVE | ❌ F&O trade calls ("consider going long", "Iron Condor 66% confidence") | **Make Coming soon** |
| Real Estate | Generated city data | Generated | ✅ Coming soon (done) |
| Global Markets | Partly live | Generated | ✅ Coming soon (done) |

---

## P0: launch blockers

### 1. Made-up numbers shown as live or AI output

17 files generate figures with `Math.random()` or a seeded random generator, and they are displayed as real data. The worst cases:

| Where | What users see | Reality | Code |
|---|---|---|---|
| Derivatives → Agent | "NIFTY SPOT 22,500 · LIVE", GEX, probabilities, Monte Carlo, smart-money signals | Real NIFTY 23,146.15; all values random | `src/lib/quant-engine.ts`, `src/app/api/derivatives-agent/route.ts` |
| Derivatives → Option chain | NIFTY spot 24,992.77 (+1.9%), full chain; small "SIMULATED" pill | NSE blocks the server, so it always falls back to generated data | `src/app/api/option-chain/route.ts` (`generateFallback`) |
| Crypto → AI Copilot | "Bitcoin is trading near $65,000–72,000" | Live BTC $98,383 | `src/lib/crypto-engine.ts` (`generateCryptoCopilot`) |
| Crypto → Stories / On-Chain / Heatmaps / Risk / Regulation / Ecosystems / Derivatives & ETF | Headlines with "3h ago", whale flows, Fear & Greed | Random | `crypto-engine.ts` (10 generators) |
| Forex → AI Copilot | "DXY ~105.2", "US 10Y 4.88%", "Brent $80", "VIX 27.1" | Live US 10Y 5.09%, WTI $99 | `src/lib/fx-data.ts`, `src/lib/forex-engine.ts` |
| Bonds → Sovereign yields ("Live benchmark…") | India 10Y 7.11%, India "Policy 6.5% · Tightening" | Live feed 7.39% | `src/lib/bond-engine.ts` (`generateSovereignYields`), `bond-data.ts` |
| Bonds → Copilot / Stories / Calendar / Bond↔Equity | Generated narratives | Random | `bond-engine.ts` |
| Commodities → "AI Commodity Brief · LIVE" | "crude +2.18%, gold +1.82%, copper +1.49%" | Live cards beside it: +1.07%, +0.26%, +0.26% | `src/app/commodity-intelligence/page.tsx` |
| Mobile home → "AI Market Brief" | "NIFTY holding above key support…" | 3 pre-written paragraphs rotated by date, with a fake loading delay | `src/components/mobile-lite/MobileHome.tsx` (`AISummaryCard`) |
| Stock detail → fallback data | Market cap, revenue, "RBI stance: accommodative/neutral" | Random when live fundamentals are missing | `src/app/api/stock-intelligence/route.ts` (`seededRng`) |

**Fastest fix:** hide these panels and keep the live prices and educational text. Don't try to make them real before launch.

### 2. Personalised buy/sell calls (SEBI Research Analyst / Investment Adviser risk)

White Tiger isn't SEBI-registered, but the app currently issues:
- **Stock analysis (`/api/analyze`)**: "Investment Rating: **BUY**", fair value ₹3,100, 12-month target ₹2,950, **stop loss ₹2,200** (TCS test).
- **Stock intelligence**: `aiOpportunityEngine` returns an **ideal entry zone, target zone and stop-loss**; bull/base/bear target prices; "Smart money accumulating".
- **Forex**: "AI TRADE IDEAS: GBP/USD **Long**, Confidence 88%" (random).
- **Derivatives**: "Long Build-up detected — **consider going long**", "AI recommends: **Iron Condor** (66% confidence)", "use wider stop losses".
- **Stocks → Smart Discovery**: "Value Picks — undervalued stocks", "Turnaround — potential recovery plays".

**Fix:**
- Change the AI prompts and outputs to neutral research: business overview, financials, risks, what to watch.
- Remove ratings, targets, entry zones and stop-losses everywhere.
- Rename Smart Discovery screens to factual filters ("Low P/E", "52-week high"). This is also the main **LEGAL** question from the ads audit.

### 3. Stock outputs contradict themselves

One TCS response (price ₹2,465) contained all of these:
- AI write-up: **BUY**, fair value **₹3,100**
- analyst consensus: **Sell**, target **₹2,736**
- "investment conclusion": fair value **₹770–981**
- DCF base case: **₹2,612**

Even as research, this undermines trust. Pick one valuation method and show its assumptions, or drop fair values.

### 4. "Trading on White Tiger — launching soon" banner (Stocks tab)

This implies a broking service, which requires SEBI stockbroker registration. Remove it.

---

## P1: fix soon after launch

| Issue | Where |
|---|---|
| NSE stock count disagrees: card "3,100+" vs "Full Stock Explorer — All 5742+ Stocks" vs homepage stats "3,100" | `SectionLandingGrid.tsx`, `StocksExplorer.tsx`, `homepage/StatsBar.tsx` |
| MF count: card "All ~14,000 AMFI schemes" vs page "8,640 active" | `SectionLandingGrid.tsx` |
| Homepage stats are stale: "48 Mutual Funds", "65 Commodities" (page says 41), "40 Crypto Tokens" (12 live), "30 Forex Pairs" (many without a price), "15s analysis time" (unmeasured) | `homepage/StatsBar.tsx` |
| Comparison table names **Zerodha and Groww** with ✗ marks (comparative claims, trademark risk under ASCI). Remove the named columns. | `homepage/ComparisonTable.tsx` |
| Percent formatting bug "+1.0717566602020998%" on every commodity card | `src/app/commodity-intelligence/page.tsx` |
| Forex: ~19 pairs show price "—" but the same change "▼ 0.08%" (fake) | `src/components/fx/FXPlatform.tsx` |
| Old brand "MOONLIGHT FOREX INTELLIGENCE TERMINAL · v2.0" visible | `FXPlatform.tsx` |
| Bonds: yield change shown in "bps" when the value is in %; ~35 bond yields hard-coded with no "indicative, as of" date | `components/bonds/BondsPlatform.tsx`, `bond-data.ts` |
| Crypto: sentiment labels contradict moves (ETH "BULLISH" at −1.9%); MATIC shown $0.820000 +5.1% (Polygon moved to POL in 2024) | `crypto-engine.ts` (`generateTopCoins`), `CryptoPlatform.tsx` |
| Crypto footer credits CoinMarketCap and Glassnode, which aren't used | `CryptoPlatform.tsx` |
| MF page "✓ SEBI Registered" badge reads like White Tiger is registered. Reword to "AMCs are SEBI-registered" or remove. | `src/app/mf-intelligence/page.tsx` |
| Stocks: sector cards show the same stock as top gainer and loser (e.g. "▲ Maruti ▼ Maruti") | `StocksExplorer.tsx` |
| Commodity units unlabelled (copper $6.57 is per lb; wheat 660.5 is US cents/bushel) | commodity page |

## P2: polish

- About page still says "eleven market verticals … real estate, tax, and wealth planning". Tax and Wealth tabs were removed in August.
- Terms page lists real estate among services.
- Stocks: MIDCAP / SMALLCAP / FINNIFTY show "data unavailable"; sectors Realty, PSU & Defence, Media, Chemicals and Others show no live data.
- Terms "Billing & Refunds" headings are empty until the GST and refund wording is decided.
- **LEGAL:** ASCI's crypto-ad disclaimer ("Crypto products and NFTs are unregulated…") may be needed wherever crypto is promoted.

---

## What's solid

- **Live prices** for stocks, indices, forex majors, commodities and crypto match the feeds.
- **FII/DII** comes from NSE, is dated and labelled provisional.
- **Mutual Funds:** AMFI universe, NAVs and returns are tested against an independent Python implementation (50 tests pass).
- **Sign-in, user database, welcome email and per-user AI limits** are tested live.

---

## Recommended plan for a fast, safe launch

1. **Derivatives → Coming soon.** Same switch as Real Estate; one line in `src/lib/comingSoon.ts`.
2. **Hide generated panels** in Crypto, Forex, Bonds and Commodities. Keep live prices, charts and educational text; hide the Copilot, Stories, On-chain, Heatmaps, Trade Ideas and generated yields. On mobile, remove the "AI Market Brief".
3. **Neutral AI research.** Rewrite the stock, currency, commodity and bond analysis prompts so they never output ratings, targets, entry zones or stop-losses. Strip those fields from the API responses.
4. **Remove** the "Trading on White Tiger" banner and the Zerodha/Groww comparison columns; fix the count mismatches and the percent formatting.
5. **Re-render the Reels.** Reel 1 says "9 market sections" and lists Real Estate and Global Markets; update it to the 7 (or 6) live markets.
