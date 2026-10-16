// Mutual fund universe, classification, parsing and calculation tests.  Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classify, splitCategory } from "../src/lib/mf-classify.ts";
import { parseNavAll, parseAmfiDate } from "../src/lib/amfi-parse.ts";
import {
  shiftDate, navOnOrBefore, navOnOrAfter, pointToPoint, trailingReturn, STANDARD_PERIODS, sinceFirstNav,
  rollingReturns, xirr, sip, lumpSum, riskMetrics, parseMfapiHistory, cleanSeries,
} from "../src/lib/mf-returns.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fx = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures", f), "utf8"));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`);

// ── AMFI parser (regression for the column-shift bug) ─────────────
const OLD_FORMAT = `Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
Open Ended Schemes(Equity Scheme - Large Cap Fund)
Some AMC Mutual Fund
100001;INF000A01001;-;Some Large Cap Fund - Direct Plan - Growth;123.45;13-Oct-2026`;
const NEW_FORMAT = `Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Plan;Option;Net Asset Value;Date
Open Ended Schemes(Equity Scheme - Large Cap Fund)
Some AMC Mutual Fund
100001;INF000A01001;-;Some Large Cap Fund;Direct Plan;Growth;123.45;13-Oct-2026`;

test("AMFI parser reads NAV and date by header name in both file formats", () => {
  for (const txt of [OLD_FORMAT, NEW_FORMAT]) {
    const { rows } = parseNavAll(txt);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].navRaw, "123.45");
    assert.equal(rows[0].date, "13-Oct-2026");
    assert.equal(rows[0].section, "Equity Scheme - Large Cap Fund");
    assert.equal(rows[0].amc, "Some AMC Mutual Fund");
  }
});
test("AMFI parser rejects a file without the NAV column", () => {
  assert.throws(() => parseNavAll("Scheme Code;Scheme Name;Date\n1;x;13-Oct-2026"), /missing column "nav"/);
});
test("AMFI dates parse to ISO without timezone drift", () => {
  assert.equal(parseAmfiDate("13-Oct-2026"), "2026-10-13");
  assert.equal(parseAmfiDate("1-Jan-2026"), "2026-01-01");
  assert.equal(parseAmfiDate("31/12/2026"), null);
});
test("the full downloaded NAVAll parses every row", () => {
  const p = path.join(ROOT, "data/amfi/NAVAll.txt");
  if (!fs.existsSync(p)) return;
  const { rows } = parseNavAll(fs.readFileSync(p, "utf8"));
  assert.ok(rows.length > 10000);
  assert.equal(rows.filter(r => !Number.isFinite(Number(r.navRaw))).length, 0, "non-numeric NAVs");
  assert.equal(rows.filter(r => !parseAmfiDate(r.date)).length, 0, "unparseable dates");
});

// ── Plan / option / category classification ───────────────────────
test("plan and option come from AMFI's columns when present", () => {
  assert.deepEqual(classify("Direct Plan", "Growth", "SBI OVERNIGHT FUND"), { plan: "Direct", option: "Growth", idcwType: null, idcwFrequency: null, optionDiscontinued: false });
  const c = classify("Regular Plan", "Monthly IDCW (Payout/Reinvestment)", "X Fund");
  assert.equal(c.plan, "Regular"); assert.equal(c.option, "IDCW"); assert.equal(c.idcwFrequency, "Monthly"); assert.equal(c.idcwType, "Payout/Reinvestment");
  assert.equal(classify("", "Discontinued Flexi IDCW", "X").optionDiscontinued, true);
});
test("title words are not mistaken for options", () => {
  const base = "Templeton India Dividend Yield Fund";
  assert.equal(classify("", "", `${base} - Direct Plan - Growth`, base).option, "Growth");
  assert.equal(classify("", "", "Nippon India Growth Fund - Direct Plan - IDCW Option", "Nippon India Growth Fund").option, "IDCW");
  assert.equal(classify("", "", "HDFC NIFTY 1D Rate Liquid ETF").plan, "Unspecified");
});
test("categories normalise to asset classes without a catch-all", () => {
  assert.deepEqual(splitCategory("Other Scheme - Index Funds"), { assetClass: "Index Fund", subCategory: "Index Funds" });
  assert.equal(splitCategory("Equity Schemes - ELSS- Tax Saver Fund").subCategory, "ELSS");
  assert.equal(splitCategory("Equity Scheme - ELSS").subCategory, "ELSS");
  assert.equal(splitCategory("Income/Debt Oriented Schemes - Liquid Fund").assetClass, "Debt");
  assert.equal(splitCategory("Exchange Traded Funds (ETFs) - Gold ETF").assetClass, "ETF");
  assert.equal(splitCategory("Other Scheme - FoF Overseas").assetClass, "Fund of Funds");
  assert.equal(splitCategory("Solution Oriented Scheme - Retirement Fund").assetClass, "Solution Oriented");
});

// ── Universe reconciliation (src/lib/mf-master.json vs AMFI files) ─
const master = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/mf-master.json"), "utf8"));
test("every AMFI NAV-file code is in the app universe, once", () => {
  const p = path.join(ROOT, "data/amfi/NAVAll.txt");
  if (!fs.existsSync(p)) return;
  const codes = new Set(master.rows.map(r => r.c));
  assert.equal(codes.size, master.rows.length, "duplicate scheme codes");
  const missing = parseNavAll(fs.readFileSync(p, "utf8")).rows.filter(r => /^\d+$/.test(r.code) && !codes.has(+r.code));
  assert.equal(missing.length, 0, `missing codes: ${missing.slice(0, 5).map(r => r.code)}`);
});
test("every code has exactly one plan and one option (no direct/regular or growth/IDCW mixing)", () => {
  for (const r of master.rows) {
    assert.ok(["D", "R", "U"].includes(r.p), `code ${r.c} plan ${r.p}`);
    assert.ok(["G", "I", "B", "U"].includes(r.o), `code ${r.c} option ${r.o}`);
  }
  const ppfas = master.rows.filter(r => (r.b || "") === "Parag Parikh Flexi Cap Fund" && r.s === "active");
  const combos = new Set(ppfas.map(r => r.p + r.o));
  assert.ok(combos.has("DG") && combos.has("RG") && combos.has("DI") && combos.has("RI"), "PPFAS variants");
  assert.equal(new Set(ppfas.map(r => r.c)).size, ppfas.length, "each variant has its own code");
});
test("statuses follow the documented rules", () => {
  const latest = master.meta.latestNavDate;
  for (const r of master.rows) {
    if (r.s === "active") { assert.ok(r.nv > 0 && r.nd, `active ${r.c} without valid NAV`); assert.ok((Date.parse(latest) - Date.parse(r.nd)) / 864e5 <= 7); }
    if (r.s === "nav-invalid") assert.equal(r.nv, null);
    if (r.s === "no-nav" || r.s === "awaiting-first-nav") assert.equal(r.nv, null);
  }
});

// ── Engine: dates and lookups ─────────────────────────────────────
test("calendar shifts clamp to month end", () => {
  assert.equal(shiftDate("2024-03-31", { months: -1 }), "2024-02-29");
  assert.equal(shiftDate("2023-03-31", { months: -1 }), "2023-02-28");
  assert.equal(shiftDate("2024-02-29", { years: -1 }), "2023-02-28");
  assert.equal(shiftDate("2026-10-13", { days: -7 }), "2026-10-06");
});
const S = [{ date: "2026-01-01", nav: 10 }, { date: "2026-01-02", nav: 11 }, { date: "2026-01-05", nav: 12 }, { date: "2026-02-01", nav: 13 }];
test("NAV lookups respect the 7-day limit and never extrapolate", () => {
  assert.deepEqual(navOnOrBefore(S, "2026-01-04"), { date: "2026-01-02", nav: 11 });
  assert.equal(navOnOrBefore(S, "2026-01-20"), null, "gap > 7 days");
  assert.deepEqual(navOnOrAfter(S, "2026-01-03"), { date: "2026-01-05", nav: 12 });
  assert.equal(navOnOrAfter(S, "2026-02-02"), null);
  assert.equal(navOnOrBefore(S, "2025-12-31"), null);
});

// ── Engine: returns ───────────────────────────────────────────────
test("CAGR uses actual days; sub-year periods are not annualised", () => {
  const r = pointToPoint({ date: "2020-01-01", nav: 100 }, { date: "2021-12-31", nav: 121 });
  near(r.annualizedPct, (Math.pow(1.21, 365 / 730) - 1) * 100, 1e-3, "2y CAGR");
  const short = pointToPoint({ date: "2026-01-01", nav: 100 }, { date: "2026-06-30", nav: 110 });
  assert.equal(short.annualized, false); assert.equal(short.annualizedPct, null); near(short.absolutePct, 10, 1e-9, "6m absolute");
});
test("insufficient history returns null with a reason", () => {
  const r = trailingReturn(S, STANDARD_PERIODS.find(p => p.label === "1Y"));
  assert.equal(r.absolutePct, null); assert.match(r.reason, /History starts/);
});
test("since-inception label requires the series to start at launch", () => {
  assert.equal(sinceFirstNav(S, "2026-01-01").isSinceInception, true);
  assert.equal(sinceFirstNav(S, "2013-01-01").isSinceInception, false);
});
test("rolling returns on constant growth equal that growth everywhere", () => {
  const pts = []; const g = Math.pow(1.12, 1 / 365);
  for (let i = 0; i <= 365 * 4; i++) pts.push({ date: shiftDate("2020-01-01", { days: i }), nav: 100 * Math.pow(g, i) });
  const r = rollingReturns(pts, 1, 30);
  near(r.min, 12, 0.05, "min"); near(r.max, 12, 0.05, "max"); assert.equal(r.pctPositive, 100);
});

// ── Engine: XIRR, SIP, lump sum ───────────────────────────────────
test("XIRR matches the Microsoft Excel documentation example (37.34%)", () => {
  const r = xirr([{ date: "2008-01-01", amount: -10000 }, { date: "2008-03-01", amount: 2750 }, { date: "2008-10-30", amount: 4250 }, { date: "2009-02-15", amount: 3250 }, { date: "2009-04-01", amount: 2750 }]);
  near(r * 100, 37.3362535, 1e-5, "XIRR");
});
test("XIRR is null without both an outflow and an inflow", () => {
  assert.equal(xirr([{ date: "2020-01-01", amount: -1 }, { date: "2021-01-01", amount: -1 }]), null);
});
test("SIP on a flat NAV before stamp duty returns exactly zero", () => {
  const flat = []; for (let i = 0; i < 400; i++) flat.push({ date: shiftDate("2018-01-01", { days: i }), nav: 50 });
  const r = sip(flat, 1000, "2018-01-05");
  assert.equal(r.installments.length, 13); near(r.absolutePct, 0, 1e-9, "abs"); near(r.xirrPct, 0, 1e-6, "xirr");
});
test("SIP deducts 0.005% stamp duty from July 2020", () => {
  const flat = []; for (let i = 0; i < 100; i++) flat.push({ date: shiftDate("2021-01-01", { days: i }), nav: 50 });
  const r = sip(flat, 1000, "2021-01-05");
  near(r.value, r.invested * (1 - 0.00005), 1e-6, "value after stamp duty");
});
test("SIP executes on the next available NAV after a holiday", () => {
  const r = sip(S, 100, "2026-01-03");
  assert.equal(r.installments[0].date, "2026-01-05");
});
test("lump sum CAGR only for holdings of a year or more", () => {
  const pts = [{ date: "2018-01-01", nav: 10 }, { date: "2018-06-01", nav: 11 }, { date: "2020-01-01", nav: 14.4 }];
  const r = lumpSum(pts, 10000, "2018-01-01");
  near(r.cagrPct, (Math.pow(1.44, 365 / 730) - 1) * 100, 1e-3, "lump CAGR");
  assert.equal(lumpSum(pts, 10000, "2018-01-01", "2018-06-01").cagrPct, null);
});

// ── Engine: risk ──────────────────────────────────────────────────
test("max drawdown, recovery and beta of a series against itself", () => {
  const navs = [100, 120, 90, 95, 130];
  const pts = []; for (let i = 0; i < 400; i++) pts.push({ date: shiftDate("2020-01-01", { days: i }), nav: navs[Math.min(4, Math.floor(i / 80))] });
  const r = riskMetrics(pts, 1, 5, pts);
  near(r.maxDrawdownPct, -25, 1e-6, "MDD"); assert.equal(r.drawdownRecovered !== null, true);
  near(r.beta, 1, 1e-9, "beta vs itself");
});
test("risk metrics refuse short windows and never estimate beta without a benchmark", () => {
  assert.match(riskMetrics(S, 3, 6).reason, /Fewer than 30/);
  const pts = []; for (let i = 0; i < 800; i++) pts.push({ date: shiftDate("2020-01-01", { days: i }), nav: 100 + i * 0.1 });
  const r = riskMetrics(pts, 2, null);
  assert.equal(r.beta, null); assert.equal(r.alphaPct, null); assert.equal(r.sharpe, null);
});

// ── Series hygiene ────────────────────────────────────────────────
test("history parsing drops invalid points and flags duplicates, gaps and jumps", () => {
  const { series, issues } = parseMfapiHistory([
    { date: "05-01-2026", nav: "12" }, { date: "02-01-2026", nav: "10" }, { date: "02-01-2026", nav: "10.5" },
    { date: "01-01-2026", nav: "0" }, { date: "bad", nav: "1" }, { date: "30-01-2026", nav: "20" },
  ]);
  assert.deepEqual(series.map(p => p.date), ["2026-01-02", "2026-01-05", "2026-01-30"]);
  assert.equal(issues.dropped, 2); assert.equal(issues.conflictingDuplicates, 1);
  assert.equal(issues.gaps.length, 1); assert.equal(issues.largeMoves.length, 1); // +20% exactly is not "above 20%"
  assert.equal(cleanSeries([]).series.length, 0);
});

// ── Independent cross-check on real AMFI NAV history ──────────────
const expected = fx("mf-expected.json");
for (const code of Object.keys(expected)) {
  test(`real data ${code}: engine matches the independent Python calculation`, () => {
    const { series } = parseMfapiHistory(fx(`mfapi_${code}.json`).data);
    const e = expected[code];
    assert.deepEqual([series.at(-1).date, series.at(-1).nav], e.latest);
    for (const label of ["1M", "6M", "1Y", "3Y", "5Y", "10Y"]) {
      const r = trailingReturn(series, STANDARD_PERIODS.find(p => p.label === label));
      if (e[label] === null) { assert.equal(r.absolutePct, null, label); continue; }
      assert.equal(r.startDate, e[label].start, `${label} start date`);
      near(r.absolutePct, e[label].absolute, 1e-3, `${label} absolute`);
      if (e[label].cagr !== null) near(r.annualizedPct, e[label].cagr, 1e-3, `${label} CAGR`);
    }
    const s = sip(series, 5000, "2019-01-10"), es = e["sip_5k_from_2019-01-10"];
    assert.equal(s.installments.length, es.installments); near(s.invested, es.invested, 1e-6, "invested");
    near(s.value, es.value, 0.01, "SIP value"); near(s.xirrPct, es.xirr, 1e-3, "SIP XIRR");
    const rk = riskMetrics(series, 3, null), er = e.risk_3y;
    assert.equal(rk.observations, er.obs); near(rk.volatilityPct, er.vol, 1e-3, "volatility");
    near(rk.annualizedReturnPct, er.cagr, 1e-3, "3y CAGR"); near(rk.maxDrawdownPct, er.mdd, 1e-3, "MDD");
  });
}

// ── Regression guards: no generated MF data reaches the UI ────────
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
test("no MF screen or API imports the removed generators or the hand-typed fund list", () => {
  for (const gone of ["src/lib/mf-data.ts", "src/lib/mf-engine.ts", "src/lib/mf-intelligence.ts", "src/lib/mutualfunds.ts", "src/components/mf/MFPlatform.tsx", "src/app/api/mf-intelligence/route.ts"])
    assert.equal(fs.existsSync(path.join(ROOT, gone)), false, `${gone} should be removed`);
  const files = ["src/components/mf/MFExplorer.tsx", "src/app/mf-intelligence/[fund]/page.tsx", "src/app/mf-intelligence/page.tsx",
    "src/app/analyze/page.tsx", "src/components/mobile-lite/MobileSearch.tsx", "src/components/beginner/BeginnerMF.tsx"];
  for (const f of files) {
    const src = read(f);
    assert.doesNotMatch(src, /@\/lib\/(mf-data|mf-engine|mf-intelligence|mutualfunds)"/, `${f} imports a removed module`);
    assert.doesNotMatch(src, /generateFundDetail|generateMFSparkline|seededRng|Math\.random/, `${f} generates data`);
  }
});
test("AI fund analysis takes every number from the verified report", () => {
  const src = read("src/app/api/analyze-mf/route.ts");
  assert.doesNotMatch(src, /realistic estimates/i);
  assert.match(src, /buildSchemeReport/);
  assert.match(src, /currentNAV: scheme\.nav/);
  assert.match(src, /aum: null, expenseRatio: null/);
});
test("NAV route uses date-based returns, never row offsets", () => {
  const src = read("src/app/api/mf-data/nav/route.ts");
  assert.doesNotMatch(src, /getNavAtOffset|navData\[Math\.min\(days/);
  assert.match(src, /trailingReturn/);
});
test("beginner featured funds carry AMFI codes and no hardcoded NAVs or ratings", () => {
  const src = read("src/components/beginner/BeginnerMF.tsx");
  assert.doesNotMatch(src, /nav: "\d|returns: "\d|rating: \d/);
  for (const m of src.matchAll(/code: (\d+)/g)) assert.ok(master.rows.some(r => r.c === +m[1] && r.s === "active" && r.p === "D" && r.o === "G"), `code ${m[1]} must be an active Direct-Growth scheme`);
});
