# White Tiger — BSE/NSE Coverage & Data Accuracy Audit

Audit date: **14 Oct 2026**. Every number below comes from a command run during the audit; nothing is estimated.
Detailed, regenerable universe figures: [`docs/STOCK_UNIVERSE_AUDIT.md`](STOCK_UNIVERSE_AUDIT.md)
(machine-readable: `data/exchange-masters/reconciliation-report.json`).

> The referenced `WhiteTiger_Platform_Audit.docx` was not on this machine, so the audit was done directly against the codebase and official exchange files.

---

## 1. Official eligible universe (dated reference files)

| Exchange file | Date | Rows |
|---|---|---|
| NSE main board — `EQUITY_L.csv` (archives.nseindia.com) | 14 Oct 2026 | 2,605 (EQ 2,348 · BE 227 · BZ 30) |
| NSE SME / Emerge — `SME_EQUITY_L.csv` | 14 Oct 2026 | 580 (SM 478 · ST 101 · SZ 1) |
| BSE active equity — `List_Scrips` download | **30 Aug 2026** (manual; BSE returns HTTP 403 to automated clients) | 4,979 |

| Universe (deduplicated by ISIN) | Companies |
|---|---|
| NSE-listed | 3,185 |
| BSE-listed | 4,979 |
| On both exchanges | 2,422 |
| NSE only | 763 |
| BSE only | 2,557 |
| **Unique companies, both exchanges** | **5,742** |

**Counting method.** One record per company, keyed by ISIN — the only identifier common to both exchanges. A dual-listed company is one record carrying its NSE symbol *and* BSE scrip code, so it is never counted twice. Two BSE rows have no ISIN (`523031` A D S Diagnostics, `531562` Pushpsons Industries); they are keyed by scrip code and counted.

## 2. Stocks in White Tiger before and after

| | Before | After |
|---|---|---|
| Entries in app | 5,128 (deduplicated by *name*, no ISINs stored) | 5,742 (deduplicated by ISIN) |
| Official companies represented | 5,094 | 5,742 |
| Coverage — combined | **88.71%** | 100% of the reference files |
| Coverage — NSE | **79.18%** | 100% |
| Coverage — BSE | 99.74% | 100% |

Why NSE coverage was low: the previous import kept only series `EQ`/`BE`, silently excluding all 30 `BZ` stocks and the entire NSE SME board (580).

## 3. Missing stocks added

**648** official companies were absent and are now present, verified by `tests/stock-universe.test.mjs` (every row of each master file is checked for a matching ISIN + symbol/scrip code).

## 4. Duplicates, wrong mappings, stale and inactive securities

| Issue | Count | Resolution |
|---|---|---|
| Hand-typed symbols not on any official master (renamed, demerged, delisted, or never existed) | 68 | Stale labels removed; companies still listed appear under their current symbol by ISIN. Example: `TATAMOTORS` → ISIN INE155A01022 now trades as **TMPV** (Tata Motors Passenger Vehicles). |
| Hand-typed labels pointing at a **different company** | 4 | `WESTLIFE` was labelled "West Coast Paper" (it is Westlife Foodworld); `SHANTIGEAR` "Shanti Educational" (Shanthi Gears); `HIRECT` "Hira Ferro Alloys" (Hirect Ltd); `RAJRATAN` "Raj Rayon Industries" (Rajratan Global Wire). Official names used; wrong sector labels discarded. |
| ETF labels resolving to unrelated mutual-fund rows | 5 | `NIFTYBEES`, `BANKBEES`, `JUNIORBEES`, `CPSEETF`, `SMALLCAP` rejected (ETFs are not in the equity masters). |
| Name-based duplicates / false merges | — | Eliminated by design: identity is ISIN; tests assert zero duplicate ISINs, NSE symbols and BSE codes. |
| Restricted segments | 258 NSE (BE/BZ/SZ); 982 companies restricted on at least one exchange (incl. BSE groups T/TS/XT/MT/MS/Z/ZP) | Kept (they are listed and tradable) but flagged `restricted` (trade-for-trade / non-compliance). |
| Suspended / delisted | — | The masters list only current securities. Each sync diffs against the previous universe by ISIN and records additions, removals (delisting), symbol changes and renames in `data/exchange-masters/lifecycle-history.json`. |

**Classification is no longer guessed.** Sector comes from NSE's official industry (748 stocks in NSE indices) or a hand-curated label that passed the name check (606); the remaining 4,840 show **"Unclassified"** instead of the previous default "Other". Cap class comes from NSE index membership (Nifty 100 / Midcap 150 / Smallcap 250 / Microcap 250) or SME-board listing; 189 hand-typed cap labels that contradicted the official index were overridden.

## 5. Coverage summary

| | Before | After |
|---|---|---|
| NSE | 79.18% | 100% of `EQUITY_L` + `SME_EQUITY_L` dated 14 Oct 2026 |
| BSE | 99.74% | 100% of the BSE file dated 30 Aug 2026 |
| Unique companies | 88.71% | 100% of the union |

Limits of the "100%": it is coverage of the dated files. NSE files are re-fetched automatically; the BSE file must be re-downloaded by hand, so BSE listings after 30 Aug 2026 are missing until then (the sync prints a staleness warning).

## 6. Data-accuracy findings, fixes and tests

### Fabricated data that was shown as real (fixed)

| Where | What it showed | Now |
|---|---|---|
| Stocks explorer list | Price and % change for every stock without a live quote were **derived from a hash of the ticker** (₹50–₹9,050) | "—" until a real quote exists |
| Sector cards | Random % changes, random top gainer/loser, seeded sparklines | Averages over stocks with live quotes only, with "live for N of M" coverage |
| Institutional flows panel | Random FII/DII net, "long %", delivery %, put/call ratio — labelled **"NSE"** with a "just now" timestamp | Real NSE provisional FII/DII (`/api/fii-dii`), with trading date |
| "AI Market Intelligence" | Two canned paragraphs chosen by Nifty's sign ("FIIs are net buyers", "RSI at 58") — no AI involved | "Market Snapshot" assembled only from measured values |
| Stock detail page — price | For stocks the old code couldn't quote (all BSE-only), a **generated price, market cap, P/E, EPS** that changed between requests (NSDL: ₹3,836.77 shown vs ₹753.40 actual) | Real quote via exchange-correct symbol, or an honest "temporarily unavailable" page |
| Stock detail page — verdicts | **BUY / SELL / HOLD** badge and "WT Score" derived from seeded random numbers | Hidden; replaced by the live-quote source and time |
| Stock detail page — 10 sections | Random scores, invented news items ("Management announces ₹X Cr capex"), invented quarterly results, shareholding, FII activity, entry/stop-loss zones | Withheld with a "coming soon — verified data" card. The code is kept behind a provenance flag so each section can be re-enabled once wired to a real source. |
| Stock detail — technicals | SMAs/support/resistance were random values scaled to the price (Reliance SMA-200 shown ₹904; actual ₹1,348.77) | TradingView's computed indicators; fallback computed from 1-year price history (`src/lib/technicals.ts`) |
| Stock detail — day range / 52-week | Day high/low = price × 1.01 / 0.99; 52-week mapped to **all-time** high/low; fallbacks of price × 1.3 / 0.7 | Provider values or "—" |
| Stock detail — P/B, dividend yield | Requested columns that TradingView returns as **null for every stock**, so P/B and yield were never real (Reliance yield shown 0%) | Correct columns: Reliance P/B 1.76, yield 0.51% |
| Beginner stocks | Fallback to hard-coded prices (e.g. ₹1,420) shown as current | Live price or "—" |
| Stock page lookup | Unknown URLs fuzzy-matched to the wrong company (`/stocks/tata` opened whichever name contained "tata") or invented a stock | Exact NSE symbol / BSE code / ISIN only; otherwise "not found" |
| BSE-only stocks everywhere | Queried as `NSE:<scrip code>` (never valid), labelled "NSE" | `BSE:<id>` (TradingView), `.BO` (Yahoo), `:BOM` (Google); exchange labels and official links per exchange |

### Live cross-checks performed (14 Oct 2026)

| Check | Result |
|---|---|
| `/api/fii-dii` vs NSE `fiidiiTradeReact` fetched independently | All six figures identical (FII/FPI net −₹1,857.44 Cr, DII net +₹2,670.44 Cr) |
| Reliance quote in app vs Yahoo Finance direct | ₹1,174.60 both |
| Reliance & NSDL: app's P/E, EPS, P/B, yield, market cap, 52-week range, SMA/RSI/ATR/MACD vs raw TradingView response | Identical |
| NSDL (BSE-only, code 544467) | Before: generated ₹3,836.77. After: ₹753.40 live via `BSE:NSDL` |

### Automated tests — `npm test` (19 tests: 18 pass, 0 fail, 1 opt-in live test skipped by default; it passed when run with `LIVE=1`)

- Every NSE main-board, NSE SME and BSE row present with matching ISIN/symbol/code; unique count = |NSE ∪ BSE| by ISIN
- No duplicate ISIN / NSE symbol / BSE code; dual-listed companies are single records with both identifiers
- Known corrections hold (TMPV, Westlife, Shanthi Gears); sector/cap never guessed
- Regression guards: the stock UI and stock API contain none of the fabrication patterns (these guards match 31 sites in the pre-audit code)
- FII/DII parser rejects inconsistent net (≠ buy − sell), missing rows, mismatched dates and non-numeric values
- Technicals math (SMA, RSI, 52-week, support/resistance) and null handling
- `LIVE=1`: bundled NSE master matches today's official file

Also: `tsc --noEmit` clean; `next build` succeeds; ESLint error counts on touched files are unchanged or lower (StocksExplorer 3 → 2; stock page 2 → 2; stock API 0 → 0; new files 0). One `set-state-in-effect` lint error in `analyze/page.tsx` comes from the earlier Simple/Pro toggle and matches five pre-existing instances of the same pattern.

### Unresolved — fabricated data still present outside the stock module

These were found but **not** fixed in this pass:

- **Mutual funds** (`src/lib/mf-data.ts`): fund returns, AUM, holdings, sector split, alpha/Sharpe, manager, launch date are seeded-random. mfapi.in NAV history (already used for NAVs) can produce real returns.
- **Bonds** (`bond-data.ts`, `bond-engine.ts`), **real estate** (`realestate.ts`), **FX** details (`fx-data.ts`, `forex-engine.ts`), **crypto** rankings (`crypto-engine.ts`), **derivatives** widgets (`IndianDerivatives.tsx`, `GlobalDerivatives.tsx`, `/api/option-chain` silent fallback), **commodity intelligence** (`Math.random`), and `MiniSparkline` uses outside the stock module.
- Stock-page sections now withheld need real sources (financial statements, shareholding, corporate actions, news) before re-enabling.
- Corporate actions / adjusted price history (splits, bonuses, dividends) are not stored yet.

## 7. Data-source limitations and recommended actions

| Limitation | Impact | Recommended action |
|---|---|---|
| BSE blocks automated access (HTTP 403) | BSE universe updated only when the file is re-downloaded | Refresh `data/exchange-masters/bse_Equity.csv` monthly; or license BSE data |
| TradingView scanner, Yahoo Finance, Google Finance and nseindia.com JSON are **unofficial endpoints**, not licensed feeds | Can change or block without notice (Yahoo returned HTTP 429 during this audit); terms of use may not permit commercial redistribution | Before public launch, move quotes and fundamentals to an authorised vendor (NSE/BSE data licensing, or a licensed reseller) |
| Bulk live-price poller covers a fixed registry, not all 5,742 stocks | Explorer shows "—" for untracked stocks; the stock page fetches each quote on demand | Licensed snapshot feed for the whole universe |
| Hand-maintained `STOCK_PROFILES` (e.g. Reliance market cap 19.2 lakh Cr vs live 15.79 lakh Cr) | Now feeds only withheld sections | Replace with filings-based fundamentals |
| Index-based sector/cap classification covers ~750–900 stocks | 4,840 "Unclassified" | Use AMFI's half-yearly market-cap list and an industry master |
| Stock universe JSON is bundled (627 KB; 152 KB gzipped) | Larger client bundle | Serve search from an API route |

## 8. Files, configuration, deployment

**New**
- `scripts/sync-stock-universe.mjs` — ISIN reconciliation, verification, reports, lifecycle diff
- `src/lib/stock-universe.json` — generated universe (5,742 records)
- `src/lib/fiiDii.ts`, `src/lib/technicals.ts` — pure, tested modules
- `src/app/api/fii-dii/route.ts` — real NSE FII/DII endpoint (5-min cache, never estimates)
- `tests/stock-universe.test.mjs` — 19 tests, no new dependencies (`node --test`)
- `data/exchange-masters/*` — dated official files, reconciliation report, lifecycle history, pre-audit backups
- `data/curated-classification.json` — hand labels, applied only after verification
- `.github/workflows/stock-universe-sync.yml` — weekly NSE sync → tests → PR
- `docs/DATA_ACCURACY_AUDIT.md`, `docs/STOCK_UNIVERSE_AUDIT.md`

**Changed**
- `src/lib/stocks.ts` — thin loader over the verified universe; adds `findStock`, `quoteKey`, `stockSlug`, exchange identifiers
- `src/app/api/stock-intelligence/route.ts` — exchange-aware quotes, correct columns, real technicals, provenance, no generated fallback
- `src/app/stocks/[symbol]/page.tsx` — exact lookup, unavailable/not-found states, live-only hero, withheld sections
- `src/components/stocks/StocksExplorer.tsx`, `src/components/beginner/BeginnerStocks.tsx`, `src/components/mobile-lite/MobileSearch.tsx`, `src/app/analyze/page.tsx`
- `src/app/stocks/page.tsx` — duplicate explorer retired; redirects to `/analyze`
- **Removed:** `src/lib/nse-equity-list.json`, `src/lib/bse-equity-list.json` (superseded)

**Database / migrations:** none — the app has no database; the universe is a versioned JSON file.

**Configuration:** no new environment variables or API keys.

**Operations**
```bash
npm run sync:stocks:fetch   # re-download NSE files, rebuild universe + reports
npm run sync:stocks         # rebuild from files already in data/exchange-masters
npm test                    # reconciliation + accuracy tests
LIVE=1 npm test             # also compare against today's NSE file
```
BSE refresh: download from bseindia.com/corporates/List_Scrips.html (Segment = Equity, Status = Active), save as `data/exchange-masters/bse_Equity.csv`, then `npm run sync:stocks`.

**GitHub Actions:** enable *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests* for the weekly sync PR. NSE occasionally blocks cloud IPs; if the job fails at the fetch step, run the sync locally.

**Deploy:** commit, push, and redeploy as usual — no extra steps.
