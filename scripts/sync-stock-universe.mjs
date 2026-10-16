#!/usr/bin/env node
/**
 * White Tiger — stock universe sync
 *
 * Rebuilds src/lib/stock-universe.json from the official exchange securities
 * masters, keyed on ISIN (the only identifier stable across NSE and BSE).
 *
 *   node scripts/sync-stock-universe.mjs            # rebuild from files in data/exchange-masters
 *   node scripts/sync-stock-universe.mjs --fetch    # re-download NSE files first
 *
 * Inputs (data/exchange-masters/):
 *   nse_EQUITY_L.csv       NSE main board  (archives.nseindia.com/content/equities/EQUITY_L.csv)
 *   nse_SME_EQUITY_L.csv   NSE Emerge/SME  (archives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv)
 *   bse_Equity.csv         BSE active equity — manual download from
 *                          bseindia.com/corporates/List_Scrips.html (Segment=Equity, Status=Active);
 *                          BSE's API rejects automated clients (HTTP 403).
 *   idx_*.csv              NSE index constituents: official industry + cap class
 *
 * Outputs:
 *   src/lib/stock-universe.json                       runtime universe
 *   data/exchange-masters/reconciliation-report.json  machine-readable audit
 *   docs/STOCK_UNIVERSE_AUDIT.md                      human-readable audit
 *   data/exchange-masters/lifecycle-history.json      additions / removals / renames over time
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MASTERS = path.join(ROOT, "data", "exchange-masters");
const OUT_UNIVERSE = path.join(ROOT, "src", "lib", "stock-universe.json");
const OUT_REPORT = path.join(MASTERS, "reconciliation-report.json");
const OUT_HISTORY = path.join(MASTERS, "lifecycle-history.json");
const OUT_MD = path.join(ROOT, "docs", "STOCK_UNIVERSE_AUDIT.md");
const CURATED = path.join(ROOT, "data", "curated-classification.json");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
const NSE_FILES = {
  "nse_EQUITY_L.csv": "https://archives.nseindia.com/content/equities/EQUITY_L.csv",
  "nse_SME_EQUITY_L.csv": "https://archives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv",
  "idx_nifty100.csv": "https://archives.nseindia.com/content/indices/ind_nifty100list.csv",
  "idx_niftymidcap150.csv": "https://archives.nseindia.com/content/indices/ind_niftymidcap150list.csv",
  "idx_niftysmallcap250.csv": "https://archives.nseindia.com/content/indices/ind_niftysmallcap250list.csv",
  "idx_niftymicrocap250.csv": "https://archives.nseindia.com/content/indices/ind_niftymicrocap250_list.csv",
  "idx_nifty500.csv": "https://archives.nseindia.com/content/indices/ind_nifty500list.csv",
  "idx_niftytotalmarket.csv": "https://archives.nseindia.com/content/indices/ind_niftytotalmarket_list.csv",
};
const ISIN_RE = /^IN[A-Z0-9]{10}$/;
const BSE_STALE_DAYS = 7;

// ── helpers ──────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function readTable(file) {
  const p = path.join(MASTERS, file);
  if (!fs.existsSync(p)) return null;
  const text = fs.readFileSync(p, "utf8").replace(/^﻿/, "");
  const rows = parseCsv(text).filter(r => r.some(c => c.trim() !== ""));
  const header = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}
const sha256 = f => crypto.createHash("sha256").update(fs.readFileSync(path.join(MASTERS, f))).digest("hex").slice(0, 16);
const mtime = f => fs.statSync(path.join(MASTERS, f)).mtime.toISOString().slice(0, 10);

function prettyName(raw) {
  let s = raw.replace(/\s+/g, " ").trim();
  if (s === s.toUpperCase()) s = s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
  return s.replace(/\bLimited\b/gi, "Ltd").replace(/\bPrivate\b/gi, "Pvt");
}
const STOP = new Set(["ltd", "limited", "india", "the", "of", "and", "corp", "corporation", "company", "co", "industries", "private", "pvt", "&"]);
const tokens = s => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(t => t && !STOP.has(t)));
const CONNECTORS = new Set(["and", "of", "the", "&", "for"]);
const initials = (s, dropStop) => s.replace(/[^A-Za-z ]/g, " ").split(/\s+/)
  .filter(w => w && !CONNECTORS.has(w.toLowerCase()) && !(dropStop && STOP.has(w.toLowerCase()))).map(w => w[0]).join("").toUpperCase();
/** A curated label is accepted only if it plausibly names the same company as the official record. */
function nameAgrees(curated, official) {
  const a = tokens(curated), b = tokens(official);
  for (const t of a) if (b.has(t)) return true;
  const c = curated.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (c.length < 3) return false;
  return [initials(official, false), initials(official, true)].some(ac => ac === c || ac.startsWith(c)) ||
    official.replace(/[^A-Za-z]/g, "").toUpperCase().startsWith(c);
}
// Reviewed by hand against official names: abbreviations/rebrands that share no token.
const REVIEWED_ALIASES = new Set(["PAYTM", "LICI", "EASYTRIP", "EASEMYTRIP", "GNFC", "DBCORP", "HEIDELBERG", "NDTV", "MCX"]);

const CAP_FROM_INDEX = { idx_nifty100: "L", idx_niftymidcap150: "M", idx_niftysmallcap250: "S", idx_niftymicrocap250: "U" };
const CAP_FROM_CURATED = { large: "L", mid: "M", small: "S", sme: "U" };

// ── fetch (NSE only) ─────────────────────────────────────────────
async function fetchNse() {
  for (const [file, url] of Object.entries(NSE_FILES)) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const body = await res.text();
    if (!res.ok || body.trim().startsWith("<")) throw new Error(`Fetch failed for ${file}: HTTP ${res.status}`);
    fs.writeFileSync(path.join(MASTERS, file), body);
    console.log(`fetched ${file} (${body.length} bytes)`);
  }
}

// ── main ─────────────────────────────────────────────────────────
async function main() {
  if (process.argv.includes("--fetch")) await fetchNse();

  const nseMain = readTable("nse_EQUITY_L.csv");
  const nseSme = readTable("nse_SME_EQUITY_L.csv");
  const bseAll = readTable("bse_Equity.csv");
  if (!nseMain || !nseSme || !bseAll) throw new Error("Missing master file(s) in data/exchange-masters");

  const warnings = [];
  const bseAgeDays = Math.round((Date.now() - fs.statSync(path.join(MASTERS, "bse_Equity.csv")).mtimeMs) / 864e5);
  if (bseAgeDays > BSE_STALE_DAYS) warnings.push(`BSE master is ${bseAgeDays} days old (file dated ${mtime("bse_Equity.csv")}); listings after that date are missing until it is re-downloaded manually.`);

  // 1. Merge by ISIN
  const byKey = new Map();
  const noIsin = [];
  const get = (isin, fallbackKey) => {
    const key = isin && ISIN_RE.test(isin) ? isin : fallbackKey;
    if (!byKey.has(key)) byKey.set(key, { i: ISIN_RE.test(isin || "") ? isin : null });
    return byKey.get(key);
  };

  for (const r of nseMain) {
    const rec = get(r["ISIN NUMBER"], `NSE:${r.SYMBOL}`);
    Object.assign(rec, { s: r.SYMBOL, r: r.SERIES, n: rec.n || r["NAME OF COMPANY"], b: "M", ln: r["DATE OF LISTING"] });
  }
  for (const r of nseSme) {
    const rec = get(r.ISIN_NUMBER, `NSE:${r.SYMBOL}`);
    Object.assign(rec, { s: r.SYMBOL, r: r.SERIES, n: rec.n || r.NAME_OF_COMPANY, b: "S", ln: r.DATE_OF_LISTING });
  }
  let bseSkipped = 0;
  for (const r of bseAll) {
    if (r.Status !== "Active") { bseSkipped++; continue; }
    const rec = get(r["ISIN No"], `BSE:${r["Security Code"]}`);
    if (!rec.i) noIsin.push({ exchange: "BSE", code: r["Security Code"], id: r["Security Id"], name: r["Security Name"] });
    Object.assign(rec, { c: r["Security Code"], d: r["Security Id"], g: r.Group });
    rec.n = rec.n || r["Issuer Name"] || r["Security Name"];
    if (!rec.b) rec.b = r.Group.startsWith("M") ? "S" : "M";
  }

  // 2. Official industry + cap class from NSE index constituents
  const industryBySym = new Map(), capBySym = new Map();
  for (const f of ["idx_niftytotalmarket.csv", "idx_nifty500.csv"]) {
    for (const r of readTable(f) || []) if (r.Symbol && r.Industry) industryBySym.set(r.Symbol, r.Industry);
  }
  for (const [f, cap] of Object.entries(CAP_FROM_INDEX)) {
    for (const r of readTable(f + ".csv") || []) if (r.Symbol && !capBySym.has(r.Symbol)) capBySym.set(r.Symbol, cap);
  }

  // 3. Curated overlay — only where the symbol exists officially AND the name agrees
  const curated = fs.existsSync(CURATED) ? JSON.parse(fs.readFileSync(CURATED, "utf8")) : {};
  const bySymbol = new Map([...byKey.values()].filter(x => x.s).map(x => [x.s, x]));
  const byBseId = new Map([...byKey.values()].filter(x => x.d).map(x => [x.d, x]));
  const overlay = { applied: 0, symbolNotOfficial: [], nameMismatch: [], capConflicts: 0, resolvedViaBseId: 0 };
  for (const [sym, c] of Object.entries(curated)) {
    let rec = bySymbol.get(sym);
    if (!rec && byBseId.has(sym)) { rec = byBseId.get(sym); overlay.resolvedViaBseId++; }
    if (!rec) { overlay.symbolNotOfficial.push({ symbol: sym, name: c.name, src: c.src }); continue; }
    const official = rec.n;
    if (!nameAgrees(c.name, official) && !REVIEWED_ALIASES.has(sym)) {
      overlay.nameMismatch.push({ symbol: sym, curatedName: c.name, officialName: official }); continue;
    }
    rec.cs = c.sector;
    rec.cc = CAP_FROM_CURATED[c.cap] || null;
    overlay.applied++;
  }

  // 4. Resolve final fields
  const stocks = [];
  for (const rec of byKey.values()) {
    const out = { i: rec.i, n: prettyName(rec.n) };
    if (rec.s) { out.s = rec.s; out.r = rec.r; }
    if (rec.c) { out.c = rec.c; out.d = rec.d; out.g = rec.g; }
    out.b = rec.b || "M";
    const industry = rec.s && industryBySym.get(rec.s);
    const indexCap = rec.s && capBySym.get(rec.s);
    if (industry) out.x = industry;
    if (indexCap) out.k = indexCap;
    else if (rec.cc) out.k = rec.cc;
    if (indexCap && rec.cc && indexCap !== rec.cc) overlay.capConflicts++;
    if (rec.cs) { out.y = rec.cs; out.z = "curated"; }
    else if (industry) { out.y = industry; out.z = "nse-industry"; }
    stocks.push(out);
  }
  stocks.sort((a, b) => a.n.localeCompare(b.n));

  // 5. Counts
  const has = (f) => stocks.filter(f).length;
  const counts = {
    nseMainRows: nseMain.length, nseSmeRows: nseSme.length, bseActiveRows: bseAll.length - bseSkipped,
    nseListed: has(s => s.s), bseListed: has(s => s.c), both: has(s => s.s && s.c),
    nseOnly: has(s => s.s && !s.c), bseOnly: has(s => s.c && !s.s),
    uniqueCompanies: stocks.length, withoutIsin: noIsin.length,
    nseSeries: Object.fromEntries([...new Set(stocks.filter(s => s.r).map(s => s.r))].sort().map(r => [r, has(s => s.r === r)])),
    withOfficialIndustry: has(s => s.x), withCapClass: has(s => s.k), unclassifiedSector: has(s => !s.y),
  };

  // 6. Baseline (pre-audit app) coverage, measured against the official ISIN universe
  let baseline = null;
  const oldNse = path.join(ROOT, "src/lib/nse-equity-list.json"), oldBse = path.join(ROOT, "src/lib/bse-equity-list.json");
  const curatedBak = path.join(MASTERS, "stocks.ts.pre-audit.bak");
  if (fs.existsSync(oldNse) && fs.existsSync(oldBse)) {
    const nseSyms = new Set(JSON.parse(fs.readFileSync(oldNse, "utf8")).map(x => x.s));
    const bseCodes = new Set(JSON.parse(fs.readFileSync(oldBse, "utf8")).map(x => x.c));
    if (fs.existsSync(curatedBak)) for (const m of fs.readFileSync(curatedBak, "utf8").matchAll(/ticker:\s*"([^"]+)\.NS"/g)) nseSyms.add(m[1]);
    const covered = stocks.filter(s => (s.s && nseSyms.has(s.s)) || (s.c && bseCodes.has(s.c)));
    const nseCovered = stocks.filter(s => s.s && nseSyms.has(s.s)).length;
    const bseCovered = stocks.filter(s => s.c && (bseCodes.has(s.c) || (s.s && nseSyms.has(s.s)))).length;
    const phantom = [...nseSyms].filter(sym => !bySymbol.has(sym) && !byBseId.has(sym));
    baseline = {
      appEntriesBefore: nseSyms.size + bseCodes.size,
      officialCompaniesRepresented: covered.length,
      missingOfficialCompanies: stocks.length - covered.length,
      coveragePct: +(100 * covered.length / stocks.length).toFixed(2),
      nseCoveragePct: +(100 * nseCovered / counts.nseListed).toFixed(2),
      bseCoveragePct: +(100 * bseCovered / counts.bseListed).toFixed(2),
      phantomSymbolsNotOnAnyExchangeMaster: phantom.length,
      measuredAt: new Date().toISOString(),
    };
  } else if (fs.existsSync(OUT_REPORT)) {
    // Legacy lists are retired; carry the pre-audit measurement forward unchanged.
    baseline = JSON.parse(fs.readFileSync(OUT_REPORT, "utf8")).baseline ?? null;
  }

  // 7. Lifecycle diff vs previous universe
  let history = fs.existsSync(OUT_HISTORY) ? JSON.parse(fs.readFileSync(OUT_HISTORY, "utf8")) : { events: [] };
  const prev = fs.existsSync(OUT_UNIVERSE) ? JSON.parse(fs.readFileSync(OUT_UNIVERSE, "utf8")) : null;
  const today = new Date().toISOString().slice(0, 10);
  let lifecycle = { firstRun: !prev };
  if (prev) {
    const pm = new Map(prev.stocks.filter(s => s.i).map(s => [s.i, s]));
    const cm = new Map(stocks.filter(s => s.i).map(s => [s.i, s]));
    const added = [...cm.keys()].filter(k => !pm.has(k));
    const removed = [...pm.keys()].filter(k => !cm.has(k));
    const symbolChanged = [...cm.keys()].filter(k => pm.has(k) && pm.get(k).s && cm.get(k).s && pm.get(k).s !== cm.get(k).s)
      .map(k => ({ isin: k, from: pm.get(k).s, to: cm.get(k).s }));
    const renamed = [...cm.keys()].filter(k => pm.has(k) && pm.get(k).n !== cm.get(k).n).map(k => ({ isin: k, from: pm.get(k).n, to: cm.get(k).n }));
    lifecycle = { added: added.length, removed: removed.length, symbolChanged: symbolChanged.length, renamed: renamed.length };
    if (added.length || removed.length || symbolChanged.length || renamed.length) {
      history.events.push({ date: today, added: added.map(k => ({ isin: k, name: cm.get(k).n })), delisted: removed.map(k => ({ isin: k, name: pm.get(k).n, lastSymbol: pm.get(k).s || pm.get(k).c })), symbolChanged, renamed });
    }
  }

  // 8. Write outputs
  const sources = Object.fromEntries(["nse_EQUITY_L.csv", "nse_SME_EQUITY_L.csv", "bse_Equity.csv", ...Object.keys(NSE_FILES).filter(f => f.startsWith("idx_"))]
    .filter(f => fs.existsSync(path.join(MASTERS, f))).map(f => [f, { fileDate: mtime(f), sha256: sha256(f), rows: (readTable(f) || []).length }]));
  const meta = { generatedAt: new Date().toISOString(), counts, sources, note: "Keyed by ISIN. NSE/SME/BSE official masters; sector/cap precedence documented in scripts/sync-stock-universe.mjs." };
  fs.writeFileSync(OUT_UNIVERSE, JSON.stringify({ meta, stocks }));
  fs.writeFileSync(OUT_HISTORY, JSON.stringify(history, null, 1));
  const report = { generatedAt: meta.generatedAt, warnings, counts, baseline, overlay, lifecycle, sources, bseWithoutIsin: noIsin };
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 1));
  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_MD, renderMarkdown(report));

  console.log(JSON.stringify({ counts, baseline, overlay: { ...overlay, symbolNotOfficial: overlay.symbolNotOfficial.length, nameMismatch: overlay.nameMismatch.length }, lifecycle, warnings }, null, 1));
  console.log(`\nwrote ${path.relative(ROOT, OUT_UNIVERSE)} (${(fs.statSync(OUT_UNIVERSE).size / 1024).toFixed(0)} KB)`);
}

function renderMarkdown(r) {
  const c = r.counts, b = r.baseline;
  const L = [];
  L.push(`# White Tiger — Stock Universe Audit`, ``, `Generated ${r.generatedAt} by \`scripts/sync-stock-universe.mjs\`. Reproduce with \`npm run sync:stocks\`.`, ``);
  if (r.warnings.length) L.push(`## Warnings`, ...r.warnings.map(w => `- ${w}`), ``);
  L.push(`## 1. Official universe (dated reference files)`, `| Source file | File date | Rows | SHA-256 (16) |`, `|---|---|---|---|`,
    ...Object.entries(r.sources).map(([f, s]) => `| ${f} | ${s.fileDate} | ${s.rows} | \`${s.sha256}\` |`), ``,
    `| Measure | Count |`, `|---|---|`,
    `| NSE main board rows | ${c.nseMainRows} |`, `| NSE SME (Emerge) rows | ${c.nseSmeRows} |`, `| BSE active equity rows | ${c.bseActiveRows} |`,
    `| **NSE-listed companies (unique ISIN)** | ${c.nseListed} |`, `| **BSE-listed companies (unique ISIN)** | ${c.bseListed} |`,
    `| Listed on both | ${c.both} |`, `| NSE only | ${c.nseOnly} |`, `| BSE only | ${c.bseOnly} |`,
    `| **Unique companies, both exchanges (deduplicated by ISIN)** | **${c.uniqueCompanies}** |`, ``,
    `Counting method: each company is one record keyed by ISIN. A company on both exchanges is counted once, carrying its NSE symbol *and* BSE scrip code. Records without a valid ISIN are keyed by exchange code (${c.withoutIsin} such BSE rows).`, ``);
  if (b) L.push(`## 2. Before vs after`, `| | Before audit | After |`, `|---|---|---|`,
    `| Entries in app | ${b.appEntriesBefore} (name-deduped) | ${c.uniqueCompanies} (ISIN-deduped) |`,
    `| Official companies represented | ${b.officialCompaniesRepresented} | ${c.uniqueCompanies} |`,
    `| Missing official companies | ${b.missingOfficialCompanies} | 0 |`,
    `| Combined coverage | ${b.coveragePct}% | 100% of the reference files |`,
    `| NSE coverage | ${b.nseCoveragePct}% | 100% |`, `| BSE coverage | ${b.bseCoveragePct}% | 100% |`,
    `| Symbols not on any official master | ${b.phantomSymbolsNotOnAnyExchangeMaster} | 0 (dropped) |`, ``,
    `"100%" means: every row of the reference files above is present. It does **not** cover listings after the file dates, and the BSE file is a manual download (BSE blocks automated access).`, ``);
  L.push(`## 3. Mapping corrections`, `- Hand-typed symbols **not present on the official masters**: **${r.overlay.symbolNotOfficial.length}**. Their stale labels are discarded; any company still listed appears under its current official symbol (matched by ISIN), e.g. TATAMOTORS → TMPV.`,
    ...r.overlay.symbolNotOfficial.map(x => `  - \`${x.symbol}\` — "${x.name}"`),
    `- Curated labels that **named a different company** than the official record (sector label discarded, official name used): **${r.overlay.nameMismatch.length}**`,
    ...r.overlay.nameMismatch.map(x => `  - \`${x.symbol}\`: curated "${x.curatedName}" ≠ official "${x.officialName}"`),
    `- Curated classification applied after verification: ${r.overlay.applied}`, `- Curated vs NSE-index cap conflicts (official index wins): ${r.overlay.capConflicts}`, ``);
  L.push(`## 4. Classification coverage`, `| | Count |`, `|---|---|`, `| NSE series | ${Object.entries(c.nseSeries).map(([k, v]) => `${k}: ${v}`).join(", ")} |`,
    `| With NSE official industry | ${c.withOfficialIndustry} |`, `| With cap class (NSE index membership or verified curated) | ${c.withCapClass} |`,
    `| Sector unclassified (shown as "Unclassified", never guessed) | ${c.unclassifiedSector} |`, ``);
  L.push(`## 5. Lifecycle`, "```json", JSON.stringify(r.lifecycle), "```", ``);
  return L.join("\n");
}

main().catch(e => { console.error(e); process.exit(1); });
