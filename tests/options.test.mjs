// Options maths and charges tests.  Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { normCdf, blackScholes, impliedVol, analyseStrategy, payoffAtExpiry, pcr, maxPain, daysToExpiry } from "../src/lib/options.ts";
import { calculateCharges } from "../src/lib/charges.ts";

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`);

test("normal CDF matches tables", () => {
  near(normCdf(0), 0.5, 1e-12, "N(0)");
  near(normCdf(1.96), 0.9750021048517795, 1e-12, "N(1.96)");
  near(normCdf(-1), 0.15865525393145707, 1e-12, "N(-1)");
});

test("Black-Scholes prices: Hull Example 15.6", () => {
  // S=42, K=40, r=10%, sigma=20%, T=0.5 → call 4.76, put 0.81
  const base = { S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 };
  near(blackScholes({ ...base, type: "CE" }).price, 4.7594, 1e-3, "call");
  near(blackScholes({ ...base, type: "PE" }).price, 0.8086, 1e-3, "put");
});

test("Greeks: Hull Chapter 19 example", () => {
  // S=49, K=50, r=5%, sigma=20%, T=20 weeks
  const g = blackScholes({ type: "CE", S: 49, K: 50, r: 0.05, sigma: 0.2, T: 0.3846 });
  near(g.price, 2.40, 0.01, "price");
  near(g.delta, 0.522, 0.001, "delta");
  near(g.gamma, 0.066, 0.001, "gamma");
  near(g.theta * 365, -4.31, 0.01, "theta per year");
  near(g.vega * 100, 12.1, 0.05, "vega per 100%");
  near(g.rho * 100, 8.91, 0.01, "rho per 100%");
});

test("put-call parity holds", () => {
  const b = { S: 23150, K: 23000, r: 0.065, sigma: 0.14, T: 7 / 365 };
  const c = blackScholes({ ...b, type: "CE" }).price;
  const p = blackScholes({ ...b, type: "PE" }).price;
  near(c - p, b.S - b.K * Math.exp(-b.r * b.T), 1e-6, "C - P = S - K e^-rT");
});

test("implied volatility round-trips and rejects impossible premiums", () => {
  const b = { type: "PE", S: 23150, K: 23000, r: 0.065, T: 10 / 365 };
  const price = blackScholes({ ...b, sigma: 0.17 }).price;
  near(impliedVol(price, b), 0.17, 1e-6, "IV");
  assert.equal(impliedVol(0.0, b), null);
  assert.equal(impliedVol(30000, b), null);
});

const L = (kind, side, strike, premium) => ({ kind, side, strike, premium, lots: 1, lotSize: 1 });

test("bull call spread: limited profit and loss", () => {
  const s = analyseStrategy([L("CE", "BUY", 100, 5), L("CE", "SELL", 110, 2)]);
  assert.equal(s.netPremium, -3);
  assert.equal(s.maxProfit, 7);
  assert.equal(s.maxLoss, -3);
  assert.deepEqual(s.breakevens, [103]);
});

test("short straddle: unlimited loss, two breakevens", () => {
  const s = analyseStrategy([L("CE", "SELL", 100, 5), L("PE", "SELL", 100, 5)]);
  assert.equal(s.netPremium, 10);
  assert.equal(s.maxProfit, 10);
  assert.equal(s.maxLoss, null);
  assert.deepEqual(s.breakevens, [90, 110]);
});

test("long call and lot sizing", () => {
  const leg = { kind: "CE", side: "BUY", strike: 23000, premium: 120, lots: 2, lotSize: 75 };
  const s = analyseStrategy([leg]);
  assert.equal(s.maxProfit, null);
  assert.equal(s.maxLoss, -18000);
  assert.deepEqual(s.breakevens, [23120]);
  assert.equal(payoffAtExpiry([leg], 23300), (300 - 120) * 150);
});

test("iron condor", () => {
  const s = analyseStrategy([
    L("PE", "BUY", 90, 1), L("PE", "SELL", 95, 3), L("CE", "SELL", 105, 3), L("CE", "BUY", 110, 1),
  ]);
  assert.equal(s.maxProfit, 4);
  assert.equal(s.maxLoss, -1);
  assert.deepEqual(s.breakevens, [91, 109]);
});

test("PCR and max pain", () => {
  const rows = [
    { strike: 100, callOi: 10, putOi: 30 },
    { strike: 110, callOi: 20, putOi: 20 },
    { strike: 120, callOi: 30, putOi: 10 },
  ];
  assert.equal(pcr(rows), 1);
  assert.equal(maxPain(rows), 110);
  assert.equal(pcr([{ strike: 1, callOi: 0, putOi: 5 }]), null);
});

test("days to expiry counts to 15:30 IST", () => {
  near(daysToExpiry("2026-10-27", new Date("2026-10-26T10:00:00Z")), 1, 1e-9, "one day");
  assert.equal(daysToExpiry("2026-10-01", new Date("2026-10-21T00:00:00Z")), 0);
});

test("charges: equity delivery (hand-computed)", () => {
  const c = calculateCharges({ segment: "delivery", buyPrice: 100, sellPrice: 110, quantity: 1000, brokeragePerOrder: 0 });
  assert.equal(c.stt, 210);
  assert.equal(c.exchange, 6.45);
  assert.equal(c.sebi, 0.21);
  assert.equal(c.stamp, 15);
  assert.equal(c.gst, 1.2);
  assert.equal(c.total, 232.86);
  assert.equal(c.netPnl, 10000 - 232.86);
});

test("charges: options round trip with ₹20 brokerage (hand-computed)", () => {
  const c = calculateCharges({ segment: "options", buyPrice: 100, sellPrice: 120, quantity: 75, brokeragePerOrder: 20 });
  assert.equal(c.brokerage, 40);
  assert.equal(c.stt, 14);        // 0.15% of ₹9,000 = 13.5 → ₹14
  assert.equal(c.exchange, 5.86); // 0.03553% of ₹16,500
  assert.equal(c.sebi, 0.02);
  assert.equal(c.stamp, 0.23);    // 0.003% of ₹7,500
  assert.equal(c.gst, 8.26);      // 18% of (40 + 5.86 + 0.02)
  assert.equal(c.total, 68.37);
});

test("charges: futures STT is 0.05% of sell value", () => {
  const c = calculateCharges({ segment: "futures", buyPrice: 23000, sellPrice: 23100, quantity: 75, brokeragePerOrder: 0 });
  assert.equal(c.stt, Math.round(23100 * 75 * 0.0005));
});

import fs from "node:fs";
import { parseNseChain, parseNseExpiries, nseDateToIso, isoToNseDate, nseTimestampMs } from "../src/lib/nse-chain.ts";

const nseFixture = (f) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8"));

test("NSE chain parser: real option-chain-v3 snapshot (NIFTY, 21 Oct 2026)", () => {
  const c = parseNseChain(nseFixture("nse-option-chain-v3.json"), { now: new Date("2026-10-21T10:10:00Z") });
  assert.equal(c.spot, 22811.35);
  assert.equal(c.expiry, "2026-10-27");
  assert.equal(c.dataTime, "21-Oct-2026 15:40:00");
  assert.deepEqual(c.rows.map(r => r.strike), [22650, 22700, 22750, 22800, 22850, 22900, 22950]);
  assert.equal(c.totalCallOi, 473973);  // independently summed
  assert.equal(c.totalPutOi, 345302);
  near(c.pcr, 0.7285267304255728, 1e-12, "PCR");
  assert.equal(c.maxPain, 22800);
  assert.equal(c.atmStrike, 22800);
  near(c.atmIv, (9.42 + 19.21) / 2, 1e-12, "ATM IV");
  const atm = c.rows.find(r => r.strike === 22800);
  assert.equal(atm.call.oiChange, 82793);
  // Calculated Greeks: call delta in (0,1), put delta in (−1,0), put-call delta gap ≈ 1 only with equal IVs, so just bounds.
  assert.ok(atm.call.delta > 0 && atm.call.delta < 1);
  assert.ok(atm.put.delta < 0 && atm.put.delta > -1);
  assert.ok(atm.call.theta < 0);
});

test("NSE chain parser: empty or junk input yields no numbers", () => {
  const c = parseNseChain({ records: { data: [] } });
  assert.equal(c.pcr, null);
  assert.equal(c.maxPain, null);
  assert.equal(c.spot, null);
  assert.equal(parseNseChain(null).rows.length, 0);
});

test("NSE dates and expiries", () => {
  assert.equal(nseDateToIso("27-Oct-2026"), "2026-10-27");
  assert.equal(nseDateToIso("2026-10-27"), null);
  assert.equal(isoToNseDate("2026-11-03"), "03-Nov-2026");
  assert.deepEqual(parseNseExpiries(nseFixture("nse-contract-info.json")).slice(0, 2), ["2026-10-27", "2026-11-03"]);
  assert.equal(nseTimestampMs("21-Oct-2026 15:40:00"), Date.parse("2026-10-21T10:10:00Z"));
});
