# White Tiger — Mutual Fund Coverage & Accuracy Audit

Audit date: **14–15 Oct 2026**. Every figure below comes from a command run during the audit.
Regenerable detail: [`docs/MF_UNIVERSE_AUDIT.md`](MF_UNIVERSE_AUDIT.md) · machine-readable: `data/amfi/mf-reconciliation-report.json`.

> `WhiteTiger_Platform_Audit.docx` was not found on this machine; the audit was done against the codebase and AMFI's official files.

---

## 1. Eligible scheme universe (dated sources)

| Source (AMFI) | File date | SHA-256 (16) |
|---|---|---|
| `NAVAll.txt` — every scheme code with a published NAV | 14 Oct 2026 | `85194a93e40fa856` |
| `SchemeData.csv` — scheme master (category, launch, minimum, ISINs) | 14 Oct 2026 | `3f51a196d7a28e7a` |

**Counting method.** The unit is the **AMFI scheme code**: one plan + option variant (e.g. *Direct – Growth*) with its own NAV. Codes sharing AMC + base scheme name form one **underlying portfolio**.

| Measure | Count |
|---|---|
| Codes in NAV file | 14,375 |
| Codes in scheme master | 16,452 (all NAV-file codes are in it) |
| **Active codes** (valid NAV dated within 7 days of AMFI's latest NAV date, 14 Oct 2026) | **8,639** |
| NAV not current (`nav-stale`; mostly matured fixed-maturity plans) | 5,495 |
| AMFI lists zero/negative NAV (`nav-invalid`) | 241 |
| In master, no NAV published (`no-nav`: wound up, merged, matured) | 1,996 |
| Launched within 60 days, awaiting first NAV (NFOs) | 81 |
| **Active underlying portfolios** | **2,162** (3,752 incl. inactive) |
| AMCs with active codes | 54 (58 incl. inactive) |

Active codes by plan: Direct 4,056 · Regular 4,087 · not stated 496 (mostly ETFs, single-plan schemes).
By option: Growth 3,589 · IDCW 4,475 · Bonus 66 · not stated 509.
By asset class: Debt 2,712 · Equity 2,452 · Index Fund 1,298 · Hybrid 909 · Fund of Funds 756 · ETF 360 · Solution Oriented 152.
Per-AMC and per-category tables: `docs/MF_UNIVERSE_AUDIT.md`.

## 2. Schemes in White Tiger before and after

| | Before | After |
|---|---|---|
| Live AMFI integration | **0 schemes** — parser broken (see §3) | 8,639 active codes (16,452 searchable incl. inactive) |
| Hand-typed fund list used by the MF tab, search and detail pages | 49 names, **0 with AMFI codes** | Removed |
| Hand-typed names matching a current AMFI scheme name exactly | 23 of 49 | — |
| Coverage of active portfolios | ≤ 23 / 2,162 (~1.1%), all with generated numbers | 2,162 / 2,162 of the dated files |
| Coverage of active codes | 0 / 8,639 | 8,639 / 8,639 |

"100%" means every code in the dated AMFI files is present. Coverage by AMC, category, plan and option is 100% of those files by construction, and the tests prove it (every NAV-file code present, once).

## 3. Defects found and corrected

| Defect | Effect | Fix |
|---|---|---|
| AMFI added *Plan* and *Option* columns to `NAVAll.txt`; the parser read NAV from fixed column 5 | Every row parsed as NaN and was dropped: **0 schemes**, 0 AMCs on every MF screen | Header-based parser (`src/lib/amfi-parse.ts`), shared by runtime and sync; regression test with both file formats |
| NAV dates compared as strings ("13-Oct-2026") | Wrong "latest NAV date" | ISO dates throughout |
| Fund pages (`/mf-intelligence/[fund]`, `/mutualfunds/[symbol]`) generated NAV, returns, AUM, holdings, sector split, fund manager, alpha/Sharpe and news from a seeded random generator | Invented figures for real funds | Rebuilt on AMFI data; generators deleted |
| NAV history route computed "1Y" as 252 rows back | Wrong for any fund with weekend NAVs or gaps — SBI Overnight showed **3.73%** "1-year" (really ~9 months) vs correct **5.21%**; missing data showed as 0% | Date-based engine; missing = null |
| "XIRR calculator" computed CAGR on a single lump sum | Overstated SIP returns | Relabelled *Lump-sum CAGR*; real XIRR on fund pages |
| AI analysis prompt: "Fill ALL fields with realistic estimates" (NAV, AUM, expense ratio, holdings, manager, returns, BUY/SELL) | Model-invented numbers shown as data | Grounded in the verified report; all numbers filled server-side; no rating |
| Beginner tab: hardcoded NAVs (Parag Parikh "72.35" vs actual 89.58), returns and star ratings | Stale/unsourced figures | Live NAV + date + computed 3Y CAGR; ratings removed; ambiguous "ICICI Prudential Retirement Fund" (4 different schemes) dropped |
| Category tiles filtered by one raw AMFI label | Missed schemes filed under AMFI's other spelling (e.g. Banking & PSU 16 → **143**, Large Cap 104 → **158**); Floater, Gilt-10Y, Medium-to-Long, Dynamic Bond tiles showed **0** | Normalised categories + four legacy labels verified against scheme names |
| Industry AUM / SIP flows / folios labelled "Source: AMFI Reports" | Hand-entered estimates presented as AMFI data | Labelled "Unverified estimate (date)"; AMC count now live |
| Static category tips labelled "AI Insight" with return claims ("12–15% CAGR", "6–8% expected returns") | Unsupported numbers styled as analysis | Relabelled "Category guide", numeric claims removed; gilt rule corrected to SEBI's 80% minimum |
| Old slugs (e.g. "sbi-bluechip") fuzzy-matched to some fund | Wrong or stale fund | Exact AMFI code only; otherwise a scheme picker. "SBI Bluechip Fund" has no current AMFI match and is shown as such |

Removed (unreachable or fabricating; recoverable from git): `src/lib/mf-data.ts`, `mf-engine.ts`, `mf-intelligence.ts`, `mutualfunds.ts`, `src/components/mf/MFPlatform.tsx`, `src/app/api/mf-intelligence/route.ts`.

Hand-typed names with no exact current AMFI match (renamed, merged, or mistyped — not guessed): SBI Bluechip Fund, Axis Bluechip Fund, ICICI Pru Bluechip Fund, Canara Robeco Bluechip Fund, Kotak Emerging Equity Fund, HDFC Mid-Cap Opportunities, SBI Magnum Midcap Fund, Kotak Flexicap Fund, Mirae Asset Tax Saver Fund, Axis Long Term Equity Fund, Quant Tax Plan, SBI Long Term Equity Fund, DSP Tax Saver Fund, HDFC Index Nifty 50 Fund, Motilal Oswal Nifty Midcap 150, Motilal Oswal Nifty Smallcap 250, Motilal Oswal Nasdaq 100 FOF, ICICI Pru Balanced Advantage, SBI Equity Hybrid Fund, Kotak Equity Hybrid Fund, HDFC Short Term Debt Fund, SBI Magnum Medium Duration, ICICI Pru All Seasons Bond, ICICI Pru Technology Fund, ICICI Pru India Opportunities, ICICI Pru Banking & Fin.

## 4. Data-quality findings in AMFI's own files (reported, not altered)

| Check | Result |
|---|---|
| Non-numeric NAVs / unparseable dates / duplicate codes | 0 / 0 / 0 |
| Zero or negative NAVs | 241 codes → status `nav-invalid`, excluded from returns |
| ISIN shared by two codes | 8 (all Nippon India, e.g. INF204KA1UU2 on 131348 and 131537) — both codes kept, flagged |
| Category mismatch between master and NAV-file heading | 0 |
| Plan/option classification: sync vs live runtime | Identical across all 8,639 active codes |

## 5. NAV accuracy and freshness

- **Latest NAV** comes from AMFI's `NAVAll.txt`, fetched live (6-hour cache). If AMFI is unreachable, the dated sync snapshot is served and labelled "offline snapshot of <date>" — never an empty or invented dataset.
- Every NAV is shown **with its NAV date** and the note that NAVs are published once per business day, not a live price.
- **History** comes from mfapi.in (which republishes AMFI NAVs). It is reconciled with AMFI per request: a newer AMFI NAV is appended, and a same-date mismatch uses AMFI's value and is flagged. Spot check (5 schemes, 13 Oct 2026): mfapi.in latest NAV and date matched AMFI exactly for all five.
- Each scheme page reports gaps over 10 days, dropped invalid points and single-day moves over 20% (possible corporate actions).

## 6. Return calculations and independent verification

Engine: `src/lib/mf-returns.ts` (pure, tested). Conventions:
- **Trailing:** NAV on the start date, or the previous NAV within 7 days. Under 1 year → absolute; 1 year or more → CAGR on actual days.
- **Since inception:** only labelled so if the history starts within 7 days of the launch date. Otherwise "since first NAV in history (date)".
- **Rolling:** CAGR for every window, sampled weekly.
- **SIP / lump sum:** buy at the NAV on or after each date; 0.005% stamp duty from July 2020. Exit loads and taxes are excluded.
- **XIRR:** Act/365, Newton's method with a bisection fallback.
- **Risk:** every NAV-to-NAV return over 3 years, annualised by observations per year. Max drawdown includes peak, trough and recovery dates. Sharpe and Sortino use a **measured** risk-free return: SBI Overnight Fund (Direct, Growth; AMFI 119833) over the same window, 5.995% p.a. for the window ending 13 Oct 2026.
- **Beta and alpha** are computed only against a supplied benchmark series. None is connected yet, so they show as unavailable.
- **IDCW and Bonus options:** NAV-only returns are labelled as excluding payouts. Risk metrics and rolling returns are withheld, and comparisons are blocked against Growth options.

**Independent cross-check.** `scripts/verify-mf-calcs.py` is a separate Python implementation, sharing no code with the engine. It reproduces the conventions on real AMFI histories saved as test fixtures:

| Scheme (Direct – Growth) | 3Y CAGR | 5Y CAGR | 10Y CAGR | ₹5,000 SIP from 10 Jan 2019: value / XIRR | 3Y volatility | 3Y max drawdown |
|---|---|---|---|---|---|---|
| Parag Parikh Flexi Cap (122639) | 12.1279% | 10.5867% | 16.7541% | ₹8,84,857.77 / 16.0111% | 9.7585% | −10.9773% |
| HDFC Mid Cap (118989) | 15.4356% | 16.4906% | 16.7125% | ₹10,60,419.95 / 20.5473% | 14.8297% | −16.7584% |
| SBI Overnight (119833) | 5.9950% | 5.7092% | 5.3446% | ₹5,82,017.11 / 5.4599% | 0.1021% | 0.00% |

The TypeScript engine matches the Python results for every value, including 1M/6M/1Y, start dates, instalment counts and observation counts, within 0.001 percentage points (₹0.01 for SIP values). These are tests in `tests/mf.test.mjs`.

Other calculation tests:
- XIRR reproduces Microsoft Excel's documented example (37.3362535%).
- Month-end date clamping (31 Mar − 1M = 28/29 Feb).
- The 7-day lookback limit, with no extrapolation.
- Insufficient history returns null with a reason.
- A flat NAV gives a SIP XIRR of exactly 0.
- Stamp duty is applied.
- SIP purchases execute after holidays.
- Rolling returns on constant growth.
- Max drawdown and recovery.
- Beta of a series against itself is 1.
- Short windows are refused.
- Duplicate, gap and jump detection.

**Test suite:** `npm test` gives 51 tests: 50 pass, 0 fail, 1 skipped (the opt-in live stock check from the earlier stock audit). `tsc` is clean and `next build` succeeds. Lint: all new MF files have 0 errors. Rewritten MF files have the same or fewer errors than before (MFExplorer 2 → 0, fund page 1 → 0, AMC browser 1 → 1). The exception is `analyze/page.tsx` (5 → 6); the extra error is the Simple/Pro toggle added in an earlier session, not this MF work.

## 7. Unavailable data, discrepancies and limitations

| Item | Status | Recommended action |
|---|---|---|
| Expense ratio (TER), AUM, fund manager, benchmark, exit load, riskometer | Not in AMFI's NAV/master files; shown as "not yet available from a verified source" | AMFI TER disclosures, AMFI AAUM data, AMC SID/KIM/factsheets |
| Portfolio holdings, sector allocation, credit quality, duration/YTM | Same | AMC monthly portfolio disclosures (SEBI-mandated) |
| Benchmark / TRI series, category averages, beta/alpha, ranking by returns | Not connected; never estimated | Licensed index data (NSE Indices TRI); precomputed returns store for ranking |
| IDCW distribution history | Not available → IDCW returns are NAV-only and labelled | AMC IDCW history |
| Merger mapping (old code → successor) | AMFI files don't link them; the sync records disappearances and renames in `data/amfi/mf-lifecycle-history.json` | SEBI/AMC merger notices |
| Legacy debt labels "Long Term Fund", "Ultra Short to Short Term Fund", "Medium Term Fund" | Ambiguous; kept under AMFI's own labels, so Low Duration and Long Duration tiles show only correctly labelled schemes | Map once AMC scheme documents confirm |
| mfapi.in | Community service, not an official API; can lag or be unavailable (then returns are hidden, not estimated) | Store AMFI NAV history daily, or use a licensed feed |
| Industry AUM / SIP flows / folios; AMC CEO/CIO/AUM | Hand-maintained, now labelled as unverified estimates | Replace with AMFI monthly data |
| Monthly scheme-master refresh | Runtime handles daily NAVs, new codes and status changes; master metadata refreshes monthly | Enable the workflow below |
| `/analyze` MF tab | Behind sign-in; verified by type-check, build and API tests, not clicked through visually | — |

## 8. Files, configuration and deployment

**New:**
- `src/lib/amfi-parse.ts`, `mf-classify.ts`, `mf-returns.ts`, `mf-scheme-report.ts`
- `src/lib/mf-master.json` (generated)
- `src/app/api/mf-scheme/route.ts`
- `scripts/sync-mf-universe.mjs`, `scripts/verify-mf-calcs.py`
- `tests/mf.test.mjs` and `tests/fixtures/*`
- `data/amfi/*.json`
- `.github/workflows/mf-universe-sync.yml`
- this report and `docs/MF_UNIVERSE_AUDIT.md`

**Rewritten or changed:**
- `src/lib/amfi-service.ts`
- `src/app/api/mf-data/route.ts`, `mf-data/nav/route.ts`, `analyze-mf/route.ts`
- `src/app/mf-intelligence/[fund]/page.tsx` + `layout.tsx`, `src/app/mf-intelligence/page.tsx`
- `src/app/mutualfunds/[symbol]/page.tsx` (now redirects)
- `src/components/mf/MFExplorer.tsx`, `beginner/BeginnerMF.tsx`, `mobile-lite/MobileSearch.tsx`
- MF parts of `src/app/analyze/page.tsx`
- `package.json`, `.gitignore`

**Removed:** see §3.

**Database / migrations:** none (the app has no database; the scheme master is a versioned JSON file).
**Configuration:** no new environment variables. `GEMINI_API_KEY` is still required for AI analysis; without it the route returns a clear 503.

**Operations:**
```bash
npm run sync:mf:fetch   # re-download AMFI files, rebuild master + reports
npm run verify:mf       # independent Python cross-check (regenerates expected values)
npm test
```
Raw AMFI downloads are gitignored (their dates and hashes are in the report). For the monthly PR, enable *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests*.
**Deploy:** commit, push and redeploy as usual.
