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

import { parseUpstoxChain, parseExpiries, parseLotSize } from "../src/lib/upstox-chain.ts";

test("Upstox chain parser: documented response shape", () => {
  const leg = (ltp, oi, prev, iv) => ({
    instrument_key: "x",
    market_data: { ltp, volume: 1000, oi, close_price: ltp, bid_price: ltp - 0.5, bid_qty: 75, ask_price: ltp + 0.5, ask_qty: 75, prev_oi: prev },
    option_greeks: { vega: 10, theta: -5, gamma: 0.001, delta: 0.5, iv, pop: 50 },
  });
  const row = (strike, c, p) => ({ expiry: "2026-10-27", pcr: 1, strike_price: strike, underlying_key: "NSE_INDEX|Nifty 50", underlying_spot_price: 23140, call_options: c, put_options: p });
  const json = { status: "success", data: [
    row(23200, leg(60, 3000, 2500, 12), leg(110, 1000, 1200, 13)),
    row(23100, leg(110, 2000, 2000, 12.5), leg(70, 2000, 1500, 13.5)),
    row(23000, leg(180, 1000, 900, 13), leg(35, 3000, 2000, 14)),
  ] };
  const c = parseUpstoxChain(json);
  assert.deepEqual(c.rows.map(r => r.strike), [23000, 23100, 23200]);
  assert.equal(c.spot, 23140);
  assert.equal(c.atmStrike, 23100);
  assert.equal(c.atmIv, 13);
  assert.equal(c.totalCallOi, 6000);
  assert.equal(c.totalPutOi, 6000);
  assert.equal(c.pcr, 1);
  assert.equal(c.maxPain, 23100);
  assert.equal(c.rows[2].call.oiChange, 500);
  assert.equal(parseUpstoxChain({ status: "success", data: [] }).pcr, null);
});

test("Upstox expiries: unique, sorted, valid dates only", () => {
  assert.deepEqual(
    parseExpiries({ data: [{ expiry: "2026-11-03" }, { expiry: "2026-10-27" }, { expiry: "2026-10-27" }, { expiry: "bad" }] }),
    ["2026-10-27", "2026-11-03"],
  );
});

test("Upstox lot size comes from the contract for that expiry", () => {
  const json = { data: [{ expiry: "2026-10-27", lot_size: 65 }, { expiry: "2026-11-24", lot_size: 60 }] };
  assert.equal(parseLotSize(json, "2026-11-24"), 60);
  assert.equal(parseLotSize(json, "2026-12-29"), null);
});
