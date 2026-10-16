#!/usr/bin/env node
/**
 * White Tiger — mutual fund universe sync (AMFI)
 *
 *   node scripts/sync-mf-universe.mjs           # rebuild from files in data/amfi
 *   node scripts/sync-mf-universe.mjs --fetch   # re-download AMFI files first
 *
 * Sources (AMFI, the industry body that publishes official NAVs):
 *   data/amfi/NAVAll.txt     https://www.amfiindia.com/spages/NAVAll.txt  (every scheme code with a NAV)
 *   data/amfi/SchemeData.csv https://portal.amfiindia.com/DownloadSchemeData_Po.aspx?mf=0  (scheme master)
 *
 * Unit of record: the AMFI scheme code. Each code is one plan + option variant
 * (e.g. Direct-Growth). Codes sharing AMC + base scheme name form one underlying
 * portfolio; both counts are reported.
 *
 * Outputs:
 *   src/lib/mf-master.json                server-side scheme master (metadata + classification)
 *   data/amfi/mf-reconciliation-report.json
 *   data/amfi/mf-lifecycle-history.json   additions / disappearances / renames between syncs
 *   docs/MF_UNIVERSE_AUDIT.md
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { classify, splitCategory, ASSET_CLASSES } from "../src/lib/mf-classify.ts";
import { parseNavAll, parseAmfiDate } from "../src/lib/amfi-parse.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "data", "amfi");
const OUT_MASTER = path.join(ROOT, "src", "lib", "mf-master.json");
const OUT_REPORT = path.join(DIR, "mf-reconciliation-report.json");
const OUT_HISTORY = path.join(DIR, "mf-lifecycle-history.json");
const OUT_MD = path.join(ROOT, "docs", "MF_UNIVERSE_AUDIT.md");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
const SOURCES = {
  "NAVAll.txt": "https://www.amfiindia.com/spages/NAVAll.txt",
  "SchemeData.csv": "https://portal.amfiindia.com/DownloadSchemeData_Po.aspx?mf=0",
};
const ACTIVE_WINDOW_DAYS = 7;   // NAV older than this vs the file's latest NAV date => not current
const NFO_WINDOW_DAYS = 60;     // no NAV yet and launched within this window => awaiting first NAV

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

function parseCsvLine(line) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur); return out.map(s => s.trim());
}

const sha = f => crypto.createHash("sha256").update(fs.readFileSync(path.join(DIR, f))).digest("hex").slice(0, 16);
const mdate = f => fs.statSync(path.join(DIR, f)).mtime.toISOString().slice(0, 10);
const norm = s => s.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
const isinsOf = s => (String(s || "").match(/IN[A-Z0-9]{10}/g) || []);

async function fetchAll() {
  for (const [file, url] of Object.entries(SOURCES)) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    const body = await res.text();
    if (!res.ok || body.trim().startsWith("<")) throw new Error(`Fetch failed ${file}: HTTP ${res.status}`);
    fs.writeFileSync(path.join(DIR, file), body);
    console.log(`fetched ${file} (${body.length} bytes)`);
  }
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  if (process.argv.includes("--fetch")) await fetchAll();

  const nav = parseNavAll(fs.readFileSync(path.join(DIR, "NAVAll.txt"), "utf8"));
  const masterLines = fs.readFileSync(path.join(DIR, "SchemeData.csv"), "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(l => l.trim());
  const mh = parseCsvLine(masterLines[0]);
  const mi = (w) => mh.findIndex(h => h.toLowerCase().startsWith(w.toLowerCase()));
  const MI = { amc: mi("AMC"), code: mi("Code"), name: mi("Scheme Name"), type: mi("Scheme Type"), cat: mi("Scheme Category"),
    navName: mi("Scheme NAV Name"), min: mi("Scheme Minimum Amount"), launch: mi("Launch Date"), closure: mi("Closure Date"), isin: mi("ISIN") };
  for (const [k, v] of Object.entries(MI)) if (v < 0) throw new Error(`SchemeData: missing column ${k}`);
  const master = new Map();
  let masterDupes = 0;
  for (const line of masterLines.slice(1)) {
    const p = parseCsvLine(line);
    const code = p[MI.code];
    if (!/^\d+$/.test(code)) continue;
    if (master.has(code)) { masterDupes++; continue; }
    master.set(code, { amc: p[MI.amc], base: p[MI.name], type: p[MI.type], cat: p[MI.cat], navName: p[MI.navName],
      min: p[MI.min], launch: parseAmfiDate(p[MI.launch]), closure: parseAmfiDate(p[MI.closure]), isins: isinsOf(p[MI.isin]) });
  }

  // Validate NAV rows
  const issues = { nonNumericNav: [], nonPositiveNav: [], badDate: [], duplicateCodes: [], isinConflicts: [], categoryMismatch: [] };
  const navByCode = new Map();
  for (const r of nav.rows) {
    if (!/^\d+$/.test(r.code)) continue;
    if (navByCode.has(r.code)) { issues.duplicateCodes.push(r.code); continue; }
    const v = Number(r.navRaw.replace(/,/g, ""));
    const d = parseAmfiDate(r.date);
    if (!Number.isFinite(v)) issues.nonNumericNav.push({ code: r.code, value: r.navRaw });
    else if (v <= 0) issues.nonPositiveNav.push({ code: r.code, value: r.navRaw });
    if (!d) issues.badDate.push({ code: r.code, value: r.date });
    navByCode.set(r.code, { ...r, nav: Number.isFinite(v) && v > 0 ? v : null, navDate: d });
  }
  const latestNavDate = [...navByCode.values()].map(r => r.navDate).filter(Boolean).sort().at(-1);

  // Merge: every code from either file
  const allCodes = [...new Set([...navByCode.keys(), ...master.keys()])].sort((a, b) => +a - +b);
  const amcs = [], amcIdx = new Map(), cats = [], catIdx = new Map(), subs = [], subIdx = new Map();
  const idx = (arr, map, v) => { if (!map.has(v)) { map.set(v, arr.length); arr.push(v); } return map.get(v); };
  const isinSeen = new Map();
  const records = [];
  for (const code of allCodes) {
    const n = navByCode.get(code), m = master.get(code);
    const navName = n?.name || m?.navName || "";
    const base = m?.base || "";
    const cls = classify(n?.planCol ?? "", n?.optionCol ?? "", navName, base);
    const category = m?.cat || n?.section || "Unclassified";
    if (m?.cat && n?.section && norm(m.cat) !== norm(n.section)) issues.categoryMismatch.push({ code, master: m.cat, navFile: n.section });
    const isins = [...new Set([...(n ? [n.isin1, n.isin2].filter(i => /^IN[A-Z0-9]{10}$/.test(i)) : []), ...(m?.isins ?? [])])];
    for (const i of isins) {
      if (isinSeen.has(i) && isinSeen.get(i) !== code) issues.isinConflicts.push({ isin: i, codes: [isinSeen.get(i), code] });
      else isinSeen.set(i, code);
    }
    let status;
    if (n && n.nav === null) status = "nav-invalid";
    else if (n) status = n.navDate && daysBetween(n.navDate, latestNavDate) <= ACTIVE_WINDOW_DAYS ? "active" : "nav-stale";
    else status = m?.launch && daysBetween(m.launch, latestNavDate) <= NFO_WINDOW_DAYS ? "awaiting-first-nav" : "no-nav";
    const amcName = m?.amc || n?.amc || "Unknown";
    records.push({
      c: +code, n: navName, b: base || null, a: idx(amcs, amcIdx, amcName), k: idx(cats, catIdx, category),
      ac: ASSET_CLASSES.indexOf(splitCategory(category).assetClass), sc: idx(subs, subIdx, splitCategory(category).subCategory),
      t: (m?.type || (n?.section ? "" : "")).startsWith("Close") ? "C" : (m?.type || "").startsWith("Interval") ? "I" : "O",
      p: cls.plan[0], o: cls.option[0], it: cls.idcwType, if: cls.idcwFrequency, od: cls.optionDiscontinued ? 1 : 0,
      i: isins, mn: m?.min && /^\d+(\.\d+)?$/.test(m.min) ? +m.min : null, l: m?.launch ?? null,
      cl: m?.type?.startsWith("Close") ? m?.closure ?? null : null,
      s: status, nv: n?.nav ?? null, nd: n?.navDate ?? null,
    });
  }

  // Portfolios = AMC + base scheme name (plans/options of one portfolio share these)
  const portKey = r => `${r.a}|${norm(r.b || r.n.replace(/\s*-\s*(direct|regular).*$/i, ""))}`;
  const portfolios = new Map();
  for (const r of records) { const k = portKey(r); portfolios.set(k, (portfolios.get(k) || 0) + 1); }
  const activeRecs = records.filter(r => r.s === "active");
  const activePortfolios = new Set(activeRecs.map(portKey));

  const count = (arr, f) => arr.reduce((m, r) => { const k = f(r); m[k] = (m[k] || 0) + 1; return m; }, {});
  const counts = {
    navFileCodes: navByCode.size, masterCodes: master.size, unionCodes: records.length,
    inBoth: allCodes.filter(c => navByCode.has(c) && master.has(c)).length,
    navOnly: allCodes.filter(c => navByCode.has(c) && !master.has(c)).length,
    masterOnly: allCodes.filter(c => !navByCode.has(c) && master.has(c)).length,
    byStatus: count(records, r => r.s), amcs: amcs.length, activeAmcs: new Set(activeRecs.map(r => r.a)).size,
    portfolios: portfolios.size, activePortfolios: activePortfolios.size,
    activeByPlan: count(activeRecs, r => ({ D: "Direct", R: "Regular", U: "Unspecified" })[r.p]),
    activeByOption: count(activeRecs, r => ({ G: "Growth", I: "IDCW", B: "Bonus", U: "Unspecified" })[r.o]),
    activeByAssetClass: count(activeRecs, r => ASSET_CLASSES[r.ac]),
    activeBySubCategory: count(activeRecs, r => `${ASSET_CLASSES[r.ac]} — ${subs[r.sc]}`),
    activeByAmc: count(activeRecs, r => amcs[r.a]),
    latestNavDate,
  };

  // Baseline: what the app had before (hand-typed list in src/lib/mutualfunds.ts; live AMFI parser returned 0)
  let baseline = null;
  const handList = path.join(ROOT, "data", "amfi", "mutualfunds.pre-audit.txt");
  if (fs.existsSync(handList)) {
    const names = [...fs.readFileSync(handList, "utf8").matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
    const baseNames = new Map(records.filter(r => r.b && r.s === "active").map(r => [norm(r.b), r.b]));
    const matched = names.filter(nm => baseNames.has(norm(nm)) || [...baseNames.keys()].some(b => b === norm(nm) + " fund"));
    baseline = {
      handTypedFunds: names.length, withAmfiCodes: 0, liveAmfiParserSchemes: 0,
      exactNameMatchesToActivePortfolios: matched.length,
      unmatchedNames: names.filter(nm => !matched.includes(nm)),
      note: "Before the audit the AMFI parser read NAV from the wrong column (file format added Plan/Option columns) and returned 0 schemes; the UI used 49 hand-typed funds with no AMFI codes.",
    };
  } else if (fs.existsSync(OUT_REPORT)) baseline = JSON.parse(fs.readFileSync(OUT_REPORT, "utf8")).baseline ?? null;

  // Lifecycle diff vs previous master
  const today = new Date().toISOString().slice(0, 10);
  const history = fs.existsSync(OUT_HISTORY) ? JSON.parse(fs.readFileSync(OUT_HISTORY, "utf8")) : { events: [] };
  let lifecycle = { firstRun: true };
  if (fs.existsSync(OUT_MASTER)) {
    const prev = JSON.parse(fs.readFileSync(OUT_MASTER, "utf8"));
    const pm = new Map(prev.rows.map(r => [r.c, r])), cm = new Map(records.map(r => [r.c, r]));
    const added = [...cm.keys()].filter(c => !pm.has(c)), removed = [...pm.keys()].filter(c => !cm.has(c));
    const renamed = [...cm.keys()].filter(c => pm.has(c) && pm.get(c).n !== cm.get(c).n).map(c => ({ code: c, from: pm.get(c).n, to: cm.get(c).n }));
    const statusChanged = [...cm.keys()].filter(c => pm.has(c) && pm.get(c).s !== cm.get(c).s).map(c => ({ code: c, from: pm.get(c).s, to: cm.get(c).s }));
    lifecycle = { added: added.length, removed: removed.length, renamed: renamed.length, statusChanged: statusChanged.length };
    if (added.length || removed.length || renamed.length || statusChanged.length) {
      history.events.push({ date: today, added: added.map(c => ({ code: c, name: cm.get(c).n })), removed: removed.map(c => ({ code: c, name: pm.get(c).n })), renamed, statusChanged });
    }
  }

  const sources = Object.fromEntries(Object.keys(SOURCES).map(f => [f, { url: SOURCES[f], fileDate: mdate(f), sha256: sha(f) }]));
  const meta = { generatedAt: new Date().toISOString(), latestNavDate, sources, activeWindowDays: ACTIVE_WINDOW_DAYS,
    legend: { p: "plan D/R/U", o: "option G/I/B/U", s: "status", t: "type O/C/I", nv: "NAV at sync (runtime uses live AMFI)" } };
  fs.writeFileSync(OUT_MASTER, JSON.stringify({ meta, amcs, cats, subs, assetClasses: ASSET_CLASSES, rows: records }));
  fs.writeFileSync(OUT_HISTORY, JSON.stringify(history, null, 1));
  const report = { generatedAt: meta.generatedAt, sources, counts, baseline, lifecycle,
    issues: { ...Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, Array.isArray(v) ? v.length : v])), masterDuplicateRows: masterDupes },
    issueSamples: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.slice(0, 15)])) };
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 1));
  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_MD, renderMd(report));
  console.log(JSON.stringify({ counts: { ...counts, activeBySubCategory: undefined, activeByAmc: undefined }, issues: report.issues, lifecycle, baseline: baseline && { ...baseline, unmatchedNames: baseline.unmatchedNames.length } }, null, 1));
  console.log(`wrote ${path.relative(ROOT, OUT_MASTER)} (${(fs.statSync(OUT_MASTER).size / 1024).toFixed(0)} KB)`);
}

function table(obj, h1, h2 = "Codes") {
  return [`| ${h1} | ${h2} |`, "|---|---|", ...Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`)].join("\n");
}
function renderMd(r) {
  const c = r.counts, b = r.baseline;
  return [
    `# White Tiger — Mutual Fund Universe Audit`, ``,
    `Generated ${r.generatedAt} by \`scripts/sync-mf-universe.mjs\` (reproduce: \`npm run sync:mf\`). Latest NAV date in AMFI file: **${c.latestNavDate}**.`, ``,
    `## Sources`, `| File | Date | SHA-256 (16) | URL |`, `|---|---|---|---|`,
    ...Object.entries(r.sources).map(([f, s]) => `| ${f} | ${s.fileDate} | \`${s.sha256}\` | ${s.url} |`), ``,
    `## Counting method`,
    `- **Scheme code** (AMFI code) = one plan + option variant, e.g. *Direct – Growth*. This is the unit for NAVs and returns.`,
    `- **Portfolio** = codes sharing AMC + base scheme name (all plans/options of one fund).`,
    `- **Status**: \`active\` = valid NAV dated within ${7} days of the latest NAV date; \`nav-invalid\` = AMFI lists a zero/negative NAV; \`nav-stale\` = has a NAV but older (typically matured fixed-maturity plans or suspended schemes); \`awaiting-first-nav\` = in the master, no NAV yet, launched within 60 days (NFO); \`no-nav\` = in the master but no NAV published (wound up, merged or matured).`, ``,
    `## Universe`, `| Measure | Count |`, `|---|---|`,
    `| Codes in NAV file | ${c.navFileCodes} |`, `| Codes in scheme master | ${c.masterCodes} |`, `| Codes in both | ${c.inBoth} |`, `| NAV file only | ${c.navOnly} |`, `| Master only (no NAV) | ${c.masterOnly} |`,
    `| **All codes (union)** | **${c.unionCodes}** |`, `| **Active codes** | **${c.byStatus.active ?? 0}** |`,
    `| Portfolios (all) | ${c.portfolios} |`, `| **Active portfolios** | **${c.activePortfolios}** |`, `| AMCs (all / with active codes) | ${c.amcs} / ${c.activeAmcs} |`, ``,
    table(c.byStatus, "Status"), ``,
    `### Active codes by plan`, table(c.activeByPlan, "Plan"), ``, `### Active codes by option`, table(c.activeByOption, "Option"), ``,
    `### Active codes by asset class`, table(c.activeByAssetClass, "Asset class"), ``,
    `### Active codes by category (AMFI labels normalised; raw label kept per scheme)`, table(c.activeBySubCategory, "Category"), ``,
    `### Active codes by AMC`, table(c.activeByAmc, "AMC"), ``,
    b ? [`## Before the audit`, `- Live AMFI integration: **${b.liveAmfiParserSchemes} schemes** (parser broken by the file-format change).`,
      `- Hand-typed list: **${b.handTypedFunds}** funds, **${b.withAmfiCodes}** with AMFI codes; ${b.exactNameMatchesToActivePortfolios} names match a current AMFI scheme name exactly.`,
      `- Names with no exact match in today's master (renamed or mistyped): ${b.unmatchedNames.map(n => `"${n}"`).join(", ")}`, ``].join("\n") : "",
    `## Data-quality checks`, "```json", JSON.stringify(r.issues, null, 1), "```",
    `Category mismatches compare the master's category with the NAV file's section heading for the same code.`, ``,
    `## Lifecycle since previous sync`, "```json", JSON.stringify(r.lifecycle), "```", ``,
  ].join("\n");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch(e => { console.error(e); process.exit(1); });
