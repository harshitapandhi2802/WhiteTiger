# White Tiger — Stock Universe Audit

Generated 2026-11-02T11:30:53.168Z by `scripts/sync-stock-universe.mjs`. Reproduce with `npm run sync:stocks`.

## 1. Official universe (dated reference files)
| Source file | File date | Rows | SHA-256 (16) |
|---|---|---|---|
| nse_EQUITY_L.csv | 2026-11-02 | 2635 | `556d439df3ef1948` |
| nse_SME_EQUITY_L.csv | 2026-11-02 | 582 | `d7734c7f92e65963` |
| bse_Equity.csv | 2026-11-02 | 4979 | `33f33901b336f4bf` |
| idx_nifty100.csv | 2026-11-02 | 100 | `0a53ad14c15e9ec2` |
| idx_niftymidcap150.csv | 2026-11-02 | 150 | `c99b7ef386cd421c` |
| idx_niftysmallcap250.csv | 2026-11-02 | 251 | `389658dd57517f8a` |
| idx_niftymicrocap250.csv | 2026-11-02 | 253 | `56695884f6a6482d` |
| idx_nifty500.csv | 2026-11-02 | 501 | `31b764a95cc03ad1` |
| idx_niftytotalmarket.csv | 2026-11-02 | 754 | `d43b076112ebe777` |

| Measure | Count |
|---|---|
| NSE main board rows | 2635 |
| NSE SME (Emerge) rows | 582 |
| BSE active equity rows | 4979 |
| **NSE-listed companies (unique ISIN)** | 3217 |
| **BSE-listed companies (unique ISIN)** | 4979 |
| Listed on both | 2429 |
| NSE only | 788 |
| BSE only | 2550 |
| **Unique companies, both exchanges (deduplicated by ISIN)** | **5767** |

Counting method: each company is one record keyed by ISIN. A company on both exchanges is counted once, carrying its NSE symbol *and* BSE scrip code. Records without a valid ISIN are keyed by exchange code (2 such BSE rows).

## 2. Before vs after
| | Before audit | After |
|---|---|---|
| Entries in app | 5128 (name-deduped) | 5767 (ISIN-deduped) |
| Official companies represented | 5094 | 5767 |
| Missing official companies | 648 | 0 |
| Combined coverage | 88.71% | 100% of the reference files |
| NSE coverage | 79.18% | 100% |
| BSE coverage | 99.74% | 100% |
| Symbols not on any official master | 22 | 0 (dropped) |

"100%" means: every row of the reference files above is present. It does **not** cover listings after the file dates, and the BSE file is a manual download (BSE blocks automated access).

## 3. Mapping corrections
- Hand-typed symbols **not present on the official masters**: **68**. Their stale labels are discarded; any company still listed appears under its current official symbol (matched by ISIN), e.g. TATAMOTORS → TMPV.
  - `AARTISURFA` — "Aarti Surfactants"
  - `ADANITRANS` — "Adani Transmission"
  - `AEGISCHEM` — "Aegis Logistics"
  - `AKZOINDIA` — "Akzo Nobel India"
  - `AMARAJABAT` — "Amara Raja Energy"
  - `AMIORG` — "Ami Organics"
  - `ARCHEAN` — "Archean Chemical"
  - `AROHAN` — "Arohan Financial"
  - `ASIRVAD` — "Asirvad Micro Finance"
  - `ATFL` — "Agro Tech Foods"
  - `BFRX` — "Bharat FIH"
  - `BHARATBIJ` — "Bharat Bijlee"
  - `BIRET` — "Brookfield India REIT"
  - `CENTURYTEX` — "Century Textiles (Paper)"
  - `CIGNITITEC` — "CIGNITI Technologies"
  - `ELINELEX` — "Elin Electronics"
  - `EMBASSY` — "Embassy Office Parks REIT"
  - `EPCIND` — "EPC Industrie"
  - `FRETAIL` — "Future Supply Chain"
  - `GATI` — "Gati"
  - `GDL` — "Gateway Distriparks"
  - `GET&D` — "GE T&D India"
  - `GMRINFRA` — "GMR Airports"
  - `GOLDBEES` — "Gold ETF (Nippon)"
  - `GSPL` — "Gujarat State Petronet"
  - `GUJGASLTD` — "Gujarat Gas"
  - `HITACHIIN` — "Hitachi India"
  - `IBREALEST` — "Indiabulls Real Estate"
  - `IIFLSEC` — "IIFL Securities"
  - `INDIAPEST` — "India Pesticides"
  - `ITDCEM` — "ITD Cementation"
  - `JBCHEPHARM` — "JB Chemicals"
  - `KALPATPOWR` — "Kalpataru Power"
  - `KALYANISTR` — "Kalyani Steels"
  - `LAXMIMACH` — "Lakshmi Machine Works"
  - `LIQUIDBEES` — "Liquid ETF (Nippon)"
  - `LTFH` — "L&T Finance"
  - `LTIM` — "LTIMindtree"
  - `MAJESCO` — "Majesco"
  - `MEGH` — "Meghmani Organics"
  - `MIDCPNIFTY` — "Nifty Midcap 150 ETF"
  - `MINDAIND` — "Minda Industries"
  - `MINDSPACE` — "Mindspace REIT"
  - `MMYT` — "MakeMyTrip"
  - `NAVKAR` — "Navkar Corporation"
  - `NBVENTURES` — "Nava Bharat Ventures"
  - `NIITTECH` — "NIIT Technologies"
  - `NXST` — "Nexus Select Trust"
  - `PAUSHAK` — "Paushak"
  - `SAVITR` — "Savita Oil Technologies"
  - `SEQUENT` — "Sequent Scientific"
  - `SESHASAYEE` — "Seshasayee Paper"
  - `SHALPAINT` — "Shalimar Paints"
  - `SHANTIEDU` — "Shanti Edutech"
  - `SIGNATUREG` — "Signature Global"
  - `SILVERBEES` — "Silver ETF (Nippon)"
  - `SINCLAIRS` — "Sinclairs Hotels"
  - `SUNDRMCLAY` — "Sundaram Clayton"
  - `SUVENPHAR` — "Suven Pharma"
  - `TATACOFFEE` — "Tata Coffee (now Tata Consumer)"
  - `TATAMOTORS` — "Tata Motors"
  - `TCNSBRANDS` — "TCNS Clothing"
  - `THDC` — "THDC India"
  - `TIPSINDLTD` — "Tips Industries"
  - `TV18BRDCST` — "TV18 Broadcast"
  - `UJJIVAN` — "Ujjivan Financial"
  - `WABCOINDIA` — "Wabco India"
  - `WEBSOLENER` — "Websol Energy"
- Curated labels that **named a different company** than the official record (sector label discarded, official name used): **9**
  - `BANKBEES`: curated "Bank Nifty ETF (Nippon)" ≠ official "Reliance Mutual Fund-Permitted"
  - `CPSEETF`: curated "CPSE ETF" ≠ official "Nippon India Mutual Fund"
  - `HIRECT`: curated "Hira Ferro Alloys" ≠ official "Hirect Limited"
  - `JUNIORBEES`: curated "Next 50 ETF (ICICI)" ≠ official "Reliance Mutual Fund-Permitted"
  - `NIFTYBEES`: curated "Nifty 50 ETF (Nippon)" ≠ official "Reliance Mutual Fund-Permitted"
  - `RAJRATAN`: curated "Raj Rayon Industries" ≠ official "Rajratan Global Wire Limited"
  - `SHANTIGEAR`: curated "Shanti Educational" ≠ official "Shanthi Gears Limited"
  - `SMALLCAP`: curated "Nifty Smallcap 250 ETF" ≠ official "Mirae Asset Mutual Fund"
  - `WESTLIFE`: curated "West Coast Paper" ≠ official "WESTLIFE FOODWORLD LIMITED"
- Curated classification applied after verification: 606
- Curated vs NSE-index cap conflicts (official index wins): 190

## 4. Classification coverage
| | Count |
|---|---|
| NSE series | BE: 228, BZ: 42, EQ: 2365, SM: 481, ST: 99, SZ: 2 |
| With NSE official industry | 747 |
| With cap class (NSE index membership or verified curated) | 901 |
| Sector unclassified (shown as "Unclassified", never guessed) | 4866 |

## 5. Lifecycle
```json
{"added":26,"removed":1,"symbolChanged":3,"renamed":8}
```
