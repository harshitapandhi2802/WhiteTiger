// Paper portfolio maths tests.  Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPositions, valuePositions, exposure } from "../src/lib/portfolio.ts";

const T = (symbol, side, qty, price, date, sector = "IT") => ({ symbol, name: symbol, sector, side, qty, price, date });
const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test("weighted-average cost and realised P&L", () => {
  const { positions, errors } = buildPositions([
    T("TCS", "BUY", 10, 3000, "2026-10-01"),
    T("TCS", "BUY", 10, 3200, "2026-10-05"),
    T("TCS", "SELL", 5, 3300, "2026-10-10"),
  ]);
  assert.deepEqual(errors, []);
  const p = positions[0];
  assert.equal(p.qty, 15);
  assert.equal(p.avgCost, 3100);
  assert.equal(p.realised, 1000);   // (3300 − 3100) × 5
  assert.equal(p.invested, 46500);
});

test("trades apply in date order; oversell is rejected", () => {
  const { positions, errors } = buildPositions([
    T("INFY", "SELL", 5, 1500, "2026-10-03"),
    T("INFY", "BUY", 5, 1400, "2026-10-01"),
    T("INFY", "SELL", 1, 1500, "2026-10-04"),
  ]);
  assert.equal(positions[0].qty, 0);
  assert.equal(positions[0].realised, 500);
  assert.equal(errors.length, 1);
});

test("valuation, weights, unpriced positions and concentration alerts", () => {
  const { positions } = buildPositions([
    T("A", "BUY", 10, 100, "2026-10-01", "IT"),
    T("B", "BUY", 10, 100, "2026-10-01", "IT"),
    T("C", "BUY", 10, 100, "2026-10-01", "Banking"),
  ]);
  const quotes = { A: { price: 200, change: 5, changePercent: 2.56 }, B: { price: 100, change: 0, changePercent: 0 }, C: { price: 100, change: -1, changePercent: -1 } };
  const { rows, totals } = valuePositions(positions, quotes);
  assert.equal(totals.value, 4000);
  assert.equal(totals.unrealised, 1000);
  assert.equal(totals.dayChange, 40);
  near(rows[0].weight, 0.5);
  const e = exposure(rows);
  assert.deepEqual(e.sectors.map(s => s.sector), ["IT", "Banking"]);
  near(e.sectors[0].weight, 0.75);
  near(e.effectiveHoldings, 1 / (0.25 + 0.0625 + 0.0625));
  assert.equal(e.alerts.length, 2); // A at 50%, IT at 75%

  const partial = valuePositions(positions, { A: quotes.A });
  assert.equal(partial.totals.value, null); // never total a portfolio with missing prices
  assert.equal(partial.totals.priced, 1);
});
