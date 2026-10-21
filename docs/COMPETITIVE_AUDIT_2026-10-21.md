# White Tiger competitive audit, 21 Oct 2026

Compared with: **NiftyTrader** (niftytrader.in), **Dhan** (dhan.co), **Sensibull** (sensibull.com).

Method:
- I read each competitor's public home, feature and pricing pages on 21 Oct 2026, without logging in.
- Any feature only advertised in marketing copy is marked *advertised*, not confirmed.
- White Tiger's own status comes from its code and the 17 Oct launch audit (`docs/LAUNCH_AUDIT_2026-10-17.md`).

---

## 1. Feature matrix

Legend:
- ✅ offered, as stated on their public pages
- ◐ partial
- ✗ not offered
- *adv.* advertised only, not verifiable without login

| Area | NiftyTrader | Sensibull | Dhan | White Tiger (before) | Gap value |
|---|---|---|---|---|---|
| **Live option chain** (OI, Greeks, IV) | ✅ NSE/BSE/MCX | ✅ basic + advanced | ✅ in app | ✗ was simulated, now *coming soon* | **High** |
| PCR, max pain, OI change | ✅ (charts mostly Prime) | ✅ | ◐ | ✗ | **High** |
| Strategy builder + payoff | ✅ | ✅ (core product) | ✅ | ✗ | **High** |
| Options pricing / Greeks calculator | ✅ | ◐ inside builder | ✗ | ✗ | **High** (no data feed needed) |
| Draft / paper portfolio | ◐ simulator (paid) | ✅ Draft Portfolios | ◐ Draft Order | ✗ | **High** |
| Brokerage / charges calculator | ✗ | ✗ | ✅ | ✗ | **Medium** (no feed needed) |
| Watchlist | ✅ | ✅ | ✅ | ✅ stocks (browser storage) | Have |
| Price alerts | *adv.* | ✗ not stated | ✗ not stated | ✗ | Medium |
| Stock screener: price / sector / size | ✅ | ◐ F&O stocks | ✅ ScanX | ✅ Smart Discovery, sector, size | Have |
| Stock screener: fundamentals (P/E, ROE) | ✅ EOD | ✗ | ✅ | ✗ no licensed fundamentals feed | Blocked |
| FII/DII data | ✅ | ✅ | ✗ | ✅ from NSE, dated | Have |
| Charts | ✅ TradingView-style | ✅ TradingView | ✅ TradingView | ✅ TradingView widget | Have |
| Results / events calendar | ✅ | ✅ | ◐ corporate actions | ✗ | Blocked (NSE blocks servers) |
| Mutual funds | ✗ | ✗ | ✅ (to invest) | ✅ 8,600+ schemes, AMFI NAVs | **WT lead** |
| Bonds, small savings | ✗ | ✗ | ✗ | ✅ live 10Y, official rates | **WT lead** |
| Forex, crypto, commodities | ◐ MCX, crypto chain | ✗ | ◐ commodity | ✅ live | **WT lead** |
| AI research with sources | ◐ *adv.* AI coach | ✗ | ✅ fuzz (separate app) | ✅ neutral, no calls | **WT lead** |
| Beginner learning | ✅ links | ✅ courses | ✅ blog | ✅ Beginner Mode | Have |
| Unified search across assets | ◐ | ◐ | ✅ | ◐ search inside each tab | **Medium** |
| Trading / order execution | via brokers | via brokers | ✅ broker | ✗ (deliberately not a broker) | Out of scope |
| Price | Free + ₹449–549/mo | Free + ₹392–800/mo | Free platform, brokerage | Free 5 analyses/mo + paid | — |

**Where White Tiger is already ahead:**
- Multi-asset coverage: mutual funds, bonds, small savings, forex, crypto and commodities, all in one place.
- Neutral AI research.

**Where it falls behind:**
- Everything options traders use daily: the chain, payoff charts, paper trading and costs.

---

## 2. Data constraints (decide what is buildable)

| Need | Source | Status |
|---|---|---|
| Live option chain, OI, Greeks, IV | **Upstox Option Chain API** (`GET /v2/option/chain`), with a long-lived *analytics token*. The owner is getting a broker API. | Wired. **Needs `UPSTOX_ACCESS_TOKEN`** to go live. |
| Redistribution rights for F&O data | Broker API terms and exchange data-vendor licensing | **LEGAL:** broker APIs are licensed for the account holder. Showing their data to the public may need an NSE data licence or a licensed vendor (TrueData, Global Datafeeds). Confirm before switching on. |
| Black-Scholes Greeks, payoff, costs | Pure maths with user inputs | No feed needed. Built and tested. |
| Statutory charges (STT, stamp, SEBI, GST, NSE fees) | Finance Act 2026 (STT on futures 0.05%, options 0.15% from 1 Apr 2026); NSE transaction charges in force since 1 Mar 2026 (cross-checked with zerodha.com/charges, 21 Oct 2026) | Built. Rates are in one dated table. |
| Fundamentals for a screener | Needs a licensed fundamentals feed | Blocked |
| Earnings / corporate-events calendar | NSE corporate filings block server requests | Blocked |

---

## 3. Prioritised plan

| # | Feature | Value | Cost | Data |
|---|---|---|---|---|
| 1 | Options calculator: price, Greeks, implied volatility | High | Low | None needed |
| 2 | Strategy builder: multi-leg, payoff chart, breakevens, max profit/loss, scenarios, templates | High | Medium | None needed (user premiums); fills from chain when live |
| 3 | Live option chain with PCR, max pain, OI change, ATM IV, data timestamp | High | Medium | Upstox token |
| 4 | Charges calculator: delivery, intraday, futures, options | Medium | Low | Dated statutory table |
| 5 | Paper portfolio: positions, live P&L, sector exposure, concentration alerts, trade journal | High | Medium | Live NSE quotes |
| 6 | Unified search across all assets (Ctrl/⌘ K) | Medium | Low | Existing lists |
| 7 | Tools hub and entry points from the section grid | Medium | Low | — |
| — | Fundamentals screener, events calendar, price alerts by push/email | — | — | Blocked or deferred |

The results are in section 4, filled in after testing.

---

## 4. Results (tested 21 Oct 2026)

Status key: **New** (built and tested) · **Improved** · **Partial** · **Blocked** · **Working** (already existed, unchanged).

| Feature | Status | How it was verified |
|---|---|---|
| Options calculator (`/tools/options-calculator`): Black-Scholes price, Greeks, implied volatility | **New** | Unit tests match Hull Ex. 15.6 (call 4.76, put 0.81) and Hull Ch. 19 Greeks (Δ 0.522, Γ 0.066, Θ −4.31/yr, vega 12.1, ρ 8.91). Put-call parity holds. In the browser, IV mode recovered 14.00% from the model price. |
| Strategy builder (`/tools/strategy-builder`): up to 8 legs (CE/PE/FUT), payoff at expiry and before it, breakevens, max profit/loss, net Greeks, what-if sliders, 8 templates, save/load | **New** | Exact payoff maths tested (bull call spread, short straddle, iron condor, lot sizing). In the browser, an iron condor showed credit ₹101.49, max loss ₹98.51 and breakevens 22,849 / 23,451. Template premiums are labelled theoretical. |
| Live option chain (`/tools/option-chain`, `/api/fno/option-chain`): OI, change in OI, volume, IV, delta, theta, PCR, max pain, ATM IV, lot size, OI-by-strike chart, timestamps, stale warning, 30 s refresh, pick legs → builder | **Partial: needs broker token** | Parser tested against Upstox's documented response (PCR, max pain, ATM, OI change, expiries, lot size). Without a token the route returns `not_connected` with no fallback data, which was checked. The UI was tested with a mocked response, including the hand-off to the builder (short straddle credit ₹8,580 at 30 per lot). **Not yet tested against live Upstox data.** |
| Charges calculator (`/tools/charges`): delivery, intraday, futures, options | **New** | Hand-computed test cases. Uses FY26-27 rates: STT futures 0.05% and options 0.15% (from 1 Apr 2026), NSE fees from 1 Mar 2026, stamp duty, SEBI fee, GST. |
| Paper portfolio (`/tools/paper-portfolio`): paper trades, weighted-average cost, live P&L, today's change, realised P&L, sector exposure, concentration alerts (stock > 25%, sector > 40%), effective number of holdings, trade journal, saved to the account | **New** | Unit tests cover average cost, realised P&L, date ordering, oversell rejection, and a refusal to total a portfolio with missing prices. In the browser: live prices, P&L arithmetic, the oversell block, and a sell booking ₹87 realised. |
| Saved workspace (`/api/workspace`, table `wt_workspace`) | **New** | Signed-in only (401 otherwise). Kinds, ids and size (20 KB) are validated. Limited to 200 items per kind. Delete was tested against a local Postgres. |
| Live quotes for any NSE/BSE stock (`/api/quotes`) | **New** | Returned live RELIANCE and TCS. NSE symbol and BSE code resolve to the same stock, and unknown ids are ignored. |
| Unified search (Ctrl/⌘ K or "/", plus header buttons) across stocks, 8,600+ funds, crypto, forex, commodities, bonds and tools | **New** | Exact matches rank first ("gold" → Commodities). Enter opens the result. Mutual funds come from the server. The search loads only when opened, so it adds no weight to pages. |
| Deep links `/analyze?section=<id>` | **New** | Opened Commodities directly from search. Coming-soon sections still show the coming-soon dialog. |
| Entry points: Tools tile on the section grid, Tools link in the Markets header (wide screens), search button | **New** | No header overlap at 1024 px (checked). |
| Mobile | **New pages pass** | No horizontal scroll at 375 px. Forms stack to one column and tables scroll inside their card. |
| Watchlist, sector/size screens, FII/DII, TradingView charts, MF, bonds, forex, crypto, commodities | **Working** | Unchanged. |
| Fundamentals screener (P/E, ROE, debt) | **Blocked** | Needs a licensed fundamentals feed. |
| Results / corporate-events calendar | **Blocked** | NSE blocks server requests. Needs a licensed feed or BSE corporate-announcements API terms. |
| Price alerts by push, email or WhatsApp | **Deferred** | Needs a background job and notification channel. In-app concentration alerts exist. |
| SPAN margin estimate | **Blocked** | Needs NSE SPAN files or a broker margin API. The builder points users to their broker. |
| Live Derivatives section in Markets (`derivatives` in the coming-soon list) | **Unchanged: Coming soon** | Its old generated data is still in the code. The new Tools replace it, so keep it closed. |

### Test totals

- `npm test`: 71 tests, 70 pass, 1 skipped (live network). This adds 20 new tests for options, the chain parser, charges and the portfolio.
- `npm run build` passes.
- The new files are lint-clean. The repo's existing lint errors are unchanged.

### To switch on the live option chain

1. Create an Upstox developer app and generate an **Analytics Token**: read-only market data, with no daily login.
2. Add it to Vercel: `vercel env add UPSTOX_ACCESS_TOKEN production` (and `preview`), then redeploy.
3. Open `/tools/option-chain`. NIFTY should load with a source line reading "Upstox". Check spot, PCR and a few strikes against the Upstox app.
4. **LEGAL first:** broker API data is licensed to the account holder. Showing it to all White Tiger users is redistribution of exchange data. Confirm Upstox's terms and NSE's data-vendor rules, or use a licensed vendor, before making it public.

### Not changed on purpose

- Existing tabs and their layouts.
- AI routes and the neutral-research guard.
- Pricing.
- No trading or order placement: White Tiger stays a research platform, not a broker.
