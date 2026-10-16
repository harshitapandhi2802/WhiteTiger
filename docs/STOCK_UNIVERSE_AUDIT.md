# White Tiger — Stock Universe Audit

Generated 2026-10-14T15:24:18.702Z by `scripts/sync-stock-universe.mjs`. Reproduce with `npm run sync:stocks`.

## Warnings
- BSE master is 45 days old (file dated 2026-08-30); listings after that date are missing until it is re-downloaded manually.

## 1. Official universe (dated reference files)
| Source file | File date | Rows | SHA-256 (16) |
|---|---|---|---|
| nse_EQUITY_L.csv | 2026-10-14 | 2605 | `83154043b3431346` |
| nse_SME_EQUITY_L.csv | 2026-10-14 | 580 | `39718036197085fb` |
| bse_Equity.csv | 2026-08-30 | 4979 | `33f33901b336f4bf` |
| idx_nifty100.csv | 2026-10-14 | 100 | `0a53ad14c15e9ec2` |
| idx_niftymidcap150.csv | 2026-10-14 | 150 | `3fe5312472d11302` |
| idx_niftysmallcap250.csv | 2026-10-14 | 251 | `48ed754ed01486a3` |
| idx_niftymicrocap250.csv | 2026-10-14 | 254 | `974ff2493bbb8b71` |
| idx_nifty500.csv | 2026-10-14 | 501 | `2959bf206239284e` |
| idx_niftytotalmarket.csv | 2026-10-14 | 755 | `692caee1b8e4fd11` |

| Measure | Count |
|---|---|
| NSE main board rows | 2605 |
| NSE SME (Emerge) rows | 580 |
| BSE active equity rows | 4979 |
| **NSE-listed companies (unique ISIN)** | 3185 |
| **BSE-listed companies (unique ISIN)** | 4979 |
| Listed on both | 2422 |
| NSE only | 763 |
| BSE only | 2557 |
| **Unique companies, both exchanges (deduplicated by ISIN)** | **5742** |

Counting method: each company is one record keyed by ISIN. A company on both exchanges is counted once, carrying its NSE symbol *and* BSE scrip code. Records without a valid ISIN are keyed by exchange code (2 such BSE rows).

## 2. Before vs after
| | Before audit | After |
|---|---|---|
| Entries in app | 5128 (name-deduped) | 5742 (ISIN-deduped) |
| Official companies represented | 5094 | 5742 |
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
| NSE series | BE: 227, BZ: 30, EQ: 2348, SM: 478, ST: 101, SZ: 1 |
| With NSE official industry | 748 |
| With cap class (NSE index membership or verified curated) | 902 |
| Sector unclassified (shown as "Unclassified", never guessed) | 4840 |

## 5. Lifecycle
```json
{"added":0,"removed":0,"symbolChanged":0,"renamed":0}
```
