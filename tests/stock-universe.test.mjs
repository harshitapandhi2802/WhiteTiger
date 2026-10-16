// Run with: npm test   (node --test, no extra dependencies)
// Set LIVE=1 to also compare against freshly downloaded NSE masters.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFiiDii } from "../src/lib/fiiDii.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MASTERS = path.join(ROOT, "data", "exchange-masters");
const universe = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/stock-universe.json"), "utf8"));
const stocks = universe.stocks;

// Independent CSV reader (deliberately not shared with the sync script).
function readCsv(file) {
  const text = fs.readFileSync(path.join(MASTERS, file), "utf8").replace(/^﻿/, "");
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true; else if (c === ",") { cells.push(cur.trim()); cur = ""; } else cur += c;
    }
    cells.push(cur.trim()); rows.push(cells);
  }
  const h = rows[0].map(x => x.trim());
  return rows.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}

const byIsin = new Map(stocks.filter(s => s.i).map(s => [s.i, s]));
const bySymbol = new Map(stocks.filter(s => s.s).map(s => [s.s, s]));
const byCode = new Map(stocks.filter(s => s.c).map(s => [s.c, s]));

// ── Coverage / reconciliation ─────────────────────────────────────
test("every NSE main-board security is present with matching ISIN and symbol", () => {
  const rows = readCsv("nse_EQUITY_L.csv");
  const missing = rows.filter(r => { const s = byIsin.get(r["ISIN NUMBER"]); return !s || s.s !== r.SYMBOL; });
  assert.equal(missing.length, 0, `missing/mismatched: ${missing.slice(0, 5).map(r => r.SYMBOL).join(", ")}`);
});

test("every NSE SME (Emerge) security is present", () => {
  const rows = readCsv("nse_SME_EQUITY_L.csv");
  const missing = rows.filter(r => { const s = byIsin.get(r.ISIN_NUMBER); return !s || s.s !== r.SYMBOL; });
  assert.equal(missing.length, 0, `missing: ${missing.slice(0, 5).map(r => r.SYMBOL).join(", ")}`);
});

test("every active BSE equity security is present with its scrip code", () => {
  const rows = readCsv("bse_Equity.csv").filter(r => r.Status === "Active");
  const missing = rows.filter(r => !byCode.has(r["Security Code"]));
  assert.equal(missing.length, 0, `missing BSE codes: ${missing.slice(0, 5).map(r => r["Security Code"]).join(", ")}`);
  const wrongIsin = rows.filter(r => /^IN[A-Z0-9]{10}$/.test(r["ISIN No"]) && byCode.get(r["Security Code"]).i !== r["ISIN No"]);
  assert.equal(wrongIsin.length, 0, "BSE code mapped to a different ISIN");
});

test("unique-company count equals |NSE ∪ BSE| by ISIN", () => {
  const isins = new Set();
  for (const r of readCsv("nse_EQUITY_L.csv")) isins.add(r["ISIN NUMBER"]);
  for (const r of readCsv("nse_SME_EQUITY_L.csv")) isins.add(r.ISIN_NUMBER);
  let noIsin = 0;
  for (const r of readCsv("bse_Equity.csv")) if (r.Status === "Active") { if (/^IN[A-Z0-9]{10}$/.test(r["ISIN No"])) isins.add(r["ISIN No"]); else noIsin++; }
  assert.equal(stocks.length, isins.size + noIsin);
});

// ── Duplicates / identity ─────────────────────────────────────────
test("no duplicate ISIN, NSE symbol or BSE scrip code", () => {
  const dup = (arr) => arr.length - new Set(arr).size;
  assert.equal(dup(stocks.filter(s => s.i).map(s => s.i)), 0, "duplicate ISIN");
  assert.equal(dup(stocks.filter(s => s.s).map(s => s.s)), 0, "duplicate NSE symbol");
  assert.equal(dup(stocks.filter(s => s.c).map(s => s.c)), 0, "duplicate BSE code");
});

test("dual-listed companies are one record carrying both identifiers", () => {
  const reliance = bySymbol.get("RELIANCE");
  assert.ok(reliance, "RELIANCE present");
  assert.equal(reliance.i, "INE002A01018");
  assert.equal(reliance.c, "500325");
  assert.equal(stocks.filter(s => s.i === "INE002A01018").length, 1);
});

test("every record has a valid quote identifier", () => {
  for (const s of stocks) {
    assert.ok(s.s || s.c, `${s.n} has neither NSE symbol nor BSE code`);
    if (!s.s) assert.match(s.c, /^\d{6}$/, `BSE-only ${s.n} needs a 6-digit scrip code`);
    if (s.i) assert.match(s.i, /^IN[A-Z0-9]{10}$/);
  }
});

// ── Known corrections from the audit ──────────────────────────────
test("symbol change: Tata Motors ISIN now trades as TMPV; TATAMOTORS is gone", () => {
  assert.equal(byIsin.get("INE155A01022")?.s, "TMPV");
  assert.equal(bySymbol.has("TATAMOTORS"), false);
});

test("wrong curated mappings are not carried forward", () => {
  assert.match(bySymbol.get("WESTLIFE").n, /Westlife Foodworld/i);
  assert.notEqual(bySymbol.get("WESTLIFE").y, "Paper");
  assert.match(bySymbol.get("SHANTIGEAR").n, /Shanthi Gears/i);
  assert.notEqual(bySymbol.get("SHANTIGEAR").y, "Education");
});

test("sector and cap class are never guessed", () => {
  for (const s of stocks) {
    assert.notEqual(s.y, "Other");
    if (s.y) assert.ok(s.z === "curated" || s.z === "nse-industry", `${s.n} sector without provenance`);
    if (s.k) assert.ok(["L", "M", "S", "U"].includes(s.k));
  }
});

// ── Fabricated-data regression guards ─────────────────────────────
test("stock UI no longer fabricates prices, changes, flows or trends", () => {
  const files = ["src/components/stocks/StocksExplorer.tsx", "src/components/beginner/BeginnerStocks.tsx", "src/app/stocks/[symbol]/page.tsx", "src/app/stocks/page.tsx"];
  const banned = [/seededRng/, /Math\.abs\(h % 9000\)/, /\(h % 800\)/, /MiniSparkline seed=/, /fiidiiData/, /Math\.random/, /stock\.currentPrice/];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    for (const re of banned) assert.doesNotMatch(src, re, `${f} contains ${re}`);
  }
});

test("stock pages resolve by exact identifier only (no fuzzy fallback)", () => {
  const src = fs.readFileSync(path.join(ROOT, "src/app/stocks/[symbol]/page.tsx"), "utf8");
  assert.doesNotMatch(src, /resolveStock/);
  assert.match(src, /findStock\(symbol\)/);
});

// ── FII/DII integrity checks ──────────────────────────────────────
const sample = [
  { buyValue: "17428.61", category: "DII", date: "14-Oct-2026", netValue: "2670.44", sellValue: "14758.17" },
  { buyValue: "16381.85", category: "FII/FPI", date: "14-Oct-2026", netValue: "-1857.44", sellValue: "18239.29" },
];
test("FII/DII: parses a real NSE payload", () => {
  const r = parseFiiDii(sample);
  assert.equal(r.tradingDate, "14-Oct-2026");
  assert.equal(r.fii.net, -1857.44);
  assert.equal(r.dii.net, 2670.44);
});
test("FII/DII: rejects inconsistent net, missing rows, mismatched dates, junk", () => {
  assert.throws(() => parseFiiDii([{ ...sample[0], netValue: "999" }, sample[1]]), /net != buy - sell/);
  assert.throws(() => parseFiiDii([sample[0]]), /missing category/);
  assert.throws(() => parseFiiDii([sample[0], { ...sample[1], date: "13-Oct-2026" }]), /different dates/);
  assert.throws(() => parseFiiDii({ error: "blocked" }), /unexpected response shape/);
  assert.throws(() => parseFiiDii([{ ...sample[0], buyValue: "N/A" }, sample[1]]), /non-numeric/);
});

// ── Optional live staleness check ─────────────────────────────────
test("LIVE: bundled NSE master matches today's official file", { skip: process.env.LIVE !== "1" }, async () => {
  const res = await fetch("https://archives.nseindia.com/content/equities/EQUITY_L.csv", { headers: { "User-Agent": "Mozilla/5.0" } });
  assert.ok(res.ok, `HTTP ${res.status}`);
  const live = new Set((await res.text()).split(/\r?\n/).slice(1).map(l => l.split(",")[6]?.trim()).filter(Boolean));
  const notInApp = [...live].filter(i => !byIsin.has(i));
  assert.equal(notInApp.length, 0, `${notInApp.length} new NSE listings — run npm run sync:stocks:fetch`);
});

// ── Technicals math (src/lib/technicals.ts) ───────────────────────
import { computeTechnicals } from "../src/lib/technicals.ts";
test("technicals: SMA, 52w range and support/resistance from bars", () => {
  const bars = Array.from({ length: 260 }, (_, i) => ({ close: 100 + i, high: 101 + i, low: 99 + i }));
  const t = computeTechnicals(bars);
  assert.equal(t.sessions, 260);
  assert.equal(t.sma20, 349.5);           // mean of closes 340..359
  assert.equal(t.sma200, 259.5);          // mean of closes 160..359
  assert.equal(t.weekHigh52, 360);        // max high of last 252
  assert.equal(t.weekLow52, 107);         // min low of last 252 (bars 8..259)
  assert.equal(t.rsi, 100);               // monotonic rise → RSI 100
  assert.equal(t.resistance, 360);
  assert.equal(t.support, 339);
});
test("technicals: insufficient history yields nulls, never guesses", () => {
  const t = computeTechnicals([{ close: 10, high: 11, low: 9 }, { close: 10.5, high: 11, low: 10 }]);
  assert.equal(t.sma20, null); assert.equal(t.sma200, null); assert.equal(t.rsi, null); assert.equal(t.macd, null); assert.equal(t.atr, null);
});
test("technicals: drops non-finite / non-positive bars", () => {
  const t = computeTechnicals([{ close: NaN, high: 1, low: 1 }, { close: 0, high: 0, low: 0 }, { close: 5, high: 6, low: 4 }]);
  assert.equal(t.sessions, 1);
});

// ── Stock-intelligence route guards ───────────────────────────────
test("stock API: no fabricated price ranges, exchange-aware symbols, honest failure", () => {
  const src = fs.readFileSync(path.join(ROOT, "src/app/api/stock-intelligence/route.ts"), "utf8");
  assert.doesNotMatch(src, /price \* 1\.01|price \* 0\.99|price \* 1\.3|price \* 0\.7/, "fabricated day/52w range");
  assert.doesNotMatch(src, /tickers: \[`NSE:\$\{nseSymbol\}`\]/, "BSE-only stocks must not be queried as NSE:");
  assert.doesNotMatch(src, /"High\.All"|"Low\.All"/, "all-time high/low is not a 52-week range");
  assert.doesNotMatch(src, /dividend_yield_recent|price_book_fq/, "columns TradingView returns as null");
  assert.match(src, /live_quote_unavailable/, "must fail without a live quote");
});
