# White Tiger — Mutual Fund Universe Audit

Generated 2026-10-15T08:33:02.059Z by `scripts/sync-mf-universe.mjs` (reproduce: `npm run sync:mf`). Latest NAV date in AMFI file: **2026-10-14**.

## Sources
| File | Date | SHA-256 (16) | URL |
|---|---|---|---|
| NAVAll.txt | 2026-10-14 | `85194a93e40fa856` | https://www.amfiindia.com/spages/NAVAll.txt |
| SchemeData.csv | 2026-10-14 | `3f51a196d7a28e7a` | https://portal.amfiindia.com/DownloadSchemeData_Po.aspx?mf=0 |

## Counting method
- **Scheme code** (AMFI code) = one plan + option variant, e.g. *Direct – Growth*. This is the unit for NAVs and returns.
- **Portfolio** = codes sharing AMC + base scheme name (all plans/options of one fund).
- **Status**: `active` = valid NAV dated within 7 days of the latest NAV date; `nav-invalid` = AMFI lists a zero/negative NAV; `nav-stale` = has a NAV but older (typically matured fixed-maturity plans or suspended schemes); `awaiting-first-nav` = in the master, no NAV yet, launched within 60 days (NFO); `no-nav` = in the master but no NAV published (wound up, merged or matured).

## Universe
| Measure | Count |
|---|---|
| Codes in NAV file | 14375 |
| Codes in scheme master | 16452 |
| Codes in both | 14375 |
| NAV file only | 0 |
| Master only (no NAV) | 2077 |
| **All codes (union)** | **16452** |
| **Active codes** | **8639** |
| Portfolios (all) | 3752 |
| **Active portfolios** | **2162** |
| AMCs (all / with active codes) | 58 / 54 |

| Status | Codes |
|---|---|
| active | 8639 |
| nav-stale | 5495 |
| no-nav | 1996 |
| nav-invalid | 241 |
| awaiting-first-nav | 81 |

### Active codes by plan
| Plan | Codes |
|---|---|
| Regular | 4087 |
| Direct | 4056 |
| Unspecified | 496 |

### Active codes by option
| Option | Codes |
|---|---|
| IDCW | 4475 |
| Growth | 3589 |
| Unspecified | 509 |
| Bonus | 66 |

### Active codes by asset class
| Asset class | Codes |
|---|---|
| Debt | 2712 |
| Equity | 2452 |
| Index Fund | 1298 |
| Hybrid | 909 |
| Fund of Funds | 756 |
| ETF | 360 |
| Solution Oriented | 152 |

### Active codes by category (AMFI labels normalised; raw label kept per scheme)
| Category | Codes |
|---|---|
| Equity — Sectoral/Thematic | 1026 |
| Index Fund — Index Funds | 998 |
| Debt — Liquid Fund | 404 |
| Fund of Funds — FoF Domestic | 336 |
| Debt — Overnight Fund | 285 |
| Fund of Funds — Fund of Funds Scheme (Domestic) | 246 |
| Equity — ELSS | 237 |
| Debt — Ultra Short to Short Term Fund | 236 |
| Index Fund — Equity Funds | 226 |
| ETF — Other ETFs | 213 |
| Debt — Money Market Fund | 201 |
| Equity — Flexi Cap Fund | 188 |
| Debt — Ultra Short Term Fund | 185 |
| Hybrid — Arbitrage Fund | 182 |
| Debt — Corporate Bond Fund | 167 |
| Hybrid — Aggressive Hybrid Fund | 161 |
| Debt — Short Term Fund | 159 |
| Equity — Large Cap Fund | 158 |
| Debt — Dynamic Term Fund | 156 |
| Hybrid — Balanced Advantage / Dynamic Asset Allocation | 155 |
| Equity — Large & Mid Cap Fund | 150 |
| Hybrid — Multi Asset Allocation | 148 |
| Debt — Banking and PSU Fund | 143 |
| Equity — Small Cap Fund | 142 |
| Debt — Gilt Fund | 139 |
| Equity — Mid Cap Fund | 135 |
| Hybrid — Equity Savings | 131 |
| Equity — Multi Cap Fund | 128 |
| Hybrid — Conservative Hybrid Fund | 114 |
| Equity — Focused Fund | 114 |
| Solution Oriented — Retirement Fund | 106 |
| Equity — Value Fund | 104 |
| Fund of Funds — FoF Overseas | 104 |
| Debt — Income (legacy category) | 102 |
| Debt — Floating Interest Rates Fund | 100 |
| Debt — Medium to Long Term Fund | 91 |
| Debt — Credit Risk Fund | 86 |
| Debt — Medium Term Fund | 79 |
| ETF — Equity ETF | 78 |
| Fund of Funds — Fund of Funds investing overseas | 70 |
| Index Fund — Debt Funds | 70 |
| Debt — Long Term Fund | 64 |
| Equity — Dividend Yield Fund | 50 |
| Debt — Ultra Short Duration Fund | 40 |
| Solution Oriented — Children's Fund | 37 |
| Debt — 10-year Constant Maturity Gilt Fund | 36 |
| ETF — Gold ETF | 25 |
| ETF — Other ETF | 24 |
| Equity — Contra Fund | 20 |
| Debt — Short Duration Fund | 18 |
| Hybrid — Balanced Hybrid Fund | 18 |
| ETF — Debt ETF | 10 |
| ETF — Silver ETF | 7 |
| Debt — Other Debt Scheme | 5 |
| Debt — Medium Duration Fund | 4 |
| Debt — Dynamic Bond | 4 |
| Debt — Fixed Term Plan | 4 |
| Index Fund — Hybrid Fund | 4 |
| Debt — Sectoral/Thematic | 4 |
| Solution Oriented — Life Cycle Fund with Maturity of 10 Years | 3 |
| Solution Oriented — Life Cycle Fund with Maturity of 15 Years | 3 |
| Solution Oriented — Life Cycle Fund with Maturity of 5 Years | 3 |
| ETF — ETFs investing overseas | 2 |
| ETF — Hybrid ETF | 1 |

### Active codes by AMC
| AMC | Codes |
|---|---|
| ICICI Prudential Asset Management Company Limited | 519 |
| Nippon Life India Asset Management Limited | 510 |
| SBI Funds Management Limited | 465 |
| Kotak Mahindra Asset Management Company Limited. | 426 |
| Bandhan AMC Limited | 406 |
| UTI Asset Mgmt. Co. Ltd. | 395 |
| Aditya Birla Sun Life AMC Limited | 393 |
| Axis Asset Management Co. Ltd. | 385 |
| Tata Asset Management Private Limited | 363 |
| DSP Asset Managers Private Limited | 351 |
| HDFC Asset Management Company Limited | 348 |
| Edelweiss Asset Management Limited | 298 |
| Mirae Asset Investment Managers (India) Pvt. Ltd | 276 |
| Invesco Asset Management (India) Private Limited | 247 |
| HSBC Asset Management (India) Private Ltd. | 232 |
| Baroda BNP Paribas Asset Management India Private Limited | 223 |
| LIC Mutual Fund Asset Management Limited | 220 |
| Motilal Oswal Asset Management Company Limited | 218 |
| Groww Asset Management Limited | 216 |
| Franklin Templeton Asset Management (India) Private Limited | 187 |
| Sundaram Asset Management Company Ltd | 176 |
| Union Asset Management Company Private Limited | 140 |
| Bank of India Investment Managers Private Limited | 138 |
| Canara Robeco Asset Management Company Limited | 130 |
| quant Money Managers Limited | 129 |
| JM Financial Asset Management Limited | 123 |
| Mahindra Manulife Investment Management Pvt Ltd | 120 |
| PGIM India Asset Management Private Limite | 118 |
| ITI Asset Management Limited | 108 |
| Bajaj Finserv Asset Management Limited | 108 |
| Navi AMC Limited | 72 |
| WhiteOak Capital Asset Management Limited | 70 |
| Wealth Company Asset Management Holdings Private Limited | 49 |
| 360 ONE Asset Management Limited | 45 |
| Trust Asset Management Private Limited | 45 |
| Quantum Asset Management Company Private Limited | 44 |
| Shriram Asset Management Co. Ltd. | 39 |
| Taurus Asset Management Company Limited | 34 |
| Helios Capital Asset Management (India) Pvt. Ltd. | 34 |
| Jio BlackRock Asset Management Private Limited | 33 |
| Samco Asset Management Private Limited | 29 |
| PPFAS Asset Management Pvt. Ltd. | 28 |
| NJ Asset Management Private Limited | 25 |
| Zerodha Asset Management Private Limited | 23 |
| Abakkus Investment Managers Private Limited | 19 |
| Angel One Asset Management Company Limited | 16 |
| Old Bridge Asset Management Private Limited | 12 |
| Capitalmind Asset Management Private Limited | 12 |
| AlphaGrep Investment Management Private Limited | 12 |
| Choice AMC Private Limited | 10 |
| ASK ASSET MANAGEMENT PRIVATE LIMITED | 8 |
| Unifi Asset Management Private Limited | 6 |
| Monarch Networth Asset Management Private Limited | 4 |
| Lakshya Asset Management Private Limited | 2 |

## Before the audit
- Live AMFI integration: **0 schemes** (parser broken by the file-format change).
- Hand-typed list: **49** funds, **0** with AMFI codes; 23 names match a current AMFI scheme name exactly.
- Names with no exact match in today's master (renamed or mistyped): "SBI Bluechip Fund", "Axis Bluechip Fund", "ICICI Pru Bluechip Fund", "Canara Robeco Bluechip Fund", "Kotak Emerging Equity Fund", "HDFC Mid-Cap Opportunities", "SBI Magnum Midcap Fund", "Kotak Flexicap Fund", "Mirae Asset Tax Saver Fund", "Axis Long Term Equity Fund", "Quant Tax Plan", "SBI Long Term Equity Fund", "DSP Tax Saver Fund", "HDFC Index Nifty 50 Fund", "Motilal Oswal Nifty Midcap 150", "Motilal Oswal Nifty Smallcap 250", "Motilal Oswal Nasdaq 100 FOF", "ICICI Pru Balanced Advantage", "SBI Equity Hybrid Fund", "Kotak Equity Hybrid Fund", "HDFC Short Term Debt Fund", "SBI Magnum Medium Duration", "ICICI Pru All Seasons Bond", "ICICI Pru Technology Fund", "ICICI Pru India Opportunities", "ICICI Pru Banking & Fin"

## Data-quality checks
```json
{
 "nonNumericNav": 0,
 "nonPositiveNav": 241,
 "badDate": 0,
 "duplicateCodes": 0,
 "isinConflicts": 8,
 "categoryMismatch": 0,
 "masterDuplicateRows": 0
}
```
Category mismatches compare the master's category with the NAV file's section heading for the same code.

## Lifecycle since previous sync
```json
{"added":0,"removed":0,"renamed":0,"statusChanged":0}
```
