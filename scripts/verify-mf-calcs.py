#!/usr/bin/env python3
"""
Independent re-implementation of White Tiger's MF return conventions, used to
cross-check src/lib/mf-returns.ts. Shares no code with the TypeScript engine.

Reads tests/fixtures/mfapi_<code>.json and writes tests/fixtures/mf-expected.json.
Conventions (same rules, separate implementation):
  - trailing start NAV = NAV on target date or closest earlier within 7 days
  - CAGR only for >= 365 days: (end/start)^(365/days) - 1
  - SIP: monthly on start day (clamped to month end), executed at NAV on/after due date (<=7 days),
    stamp duty 0.005% from 2020-07-01, valued at latest NAV, XIRR Act/365 via bisection
  - volatility: sample stdev of NAV-to-NAV returns * sqrt(observations per year)
"""
import json, math, calendar, datetime as dt, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIX = ROOT / "tests" / "fixtures"

def load(code):
    d = json.loads((FIX / f"mfapi_{code}.json").read_text())
    pts = {}
    for r in d["data"]:
        day, mon, yr = r["date"].split("-")
        nav = float(r["nav"])
        if nav > 0:
            pts.setdefault(dt.date(int(yr), int(mon), int(day)), nav)
    return sorted(pts.items())

def add_months(d, n):
    m = d.month - 1 + n
    y = d.year + m // 12
    m = m % 12 + 1
    return dt.date(y, m, min(d.day, calendar.monthrange(y, m)[1]))

def on_or_before(s, d, maxd=7):
    best = None
    for day, nav in s:
        if day <= d: best = (day, nav)
        else: break
    return best if best and (d - best[0]).days <= maxd else None

def on_or_after(s, d, maxd=7):
    for day, nav in s:
        if day >= d:
            return (day, nav) if (day - d).days <= maxd else None
    return None

def trailing(s, months=0, days=0):
    end = s[-1]
    target = add_months(end[0], -months) - dt.timedelta(days=days)
    if s[0][0] > target: return None
    st = on_or_before(s, target)
    if not st: return None
    n = (end[0] - st[0]).days
    g = end[1] / st[1]
    return {"start": st[0].isoformat(), "absolute": (g - 1) * 100, "cagr": (g ** (365 / n) - 1) * 100 if n >= 365 else None}

def npv(rate, flows, t0):
    return sum(a / (1 + rate) ** ((d - t0).days / 365) for d, a in flows)

def xirr_bisect(flows):
    t0 = flows[0][0]
    lo, hi = -0.9999, 10.0
    flo = npv(lo, flows, t0)
    for _ in range(400):
        mid = (lo + hi) / 2
        fm = npv(mid, flows, t0)
        if flo * fm < 0: hi = mid
        else: lo, flo = mid, fm
    return (lo + hi) / 2 * 100

def sip(s, amount, start):
    end = s[-1]
    units, flows, k = 0.0, [], 0
    while True:
        due = add_months(start, k); k += 1
        if due > end[0]: break
        ex = on_or_after(s, due)
        if not ex or ex[0] > end[0]: continue
        net = amount * (1 - 0.00005) if ex[0] >= dt.date(2020, 7, 1) else amount
        units += net / ex[1]
        flows.append((ex[0], -amount))
    value = units * end[1]
    invested = amount * len(flows)
    return {"installments": len(flows), "invested": invested, "value": value, "xirr": xirr_bisect(flows + [(end[0], value)])}

def risk(s, years):
    end = s[-1]
    target = add_months(end[0], -12 * years)
    st = on_or_before(s, target)
    w = [p for p in s if p[0] >= st[0]]
    rets = [w[i][1] / w[i - 1][1] - 1 for i in range(1, len(w))]
    yrs = (end[0] - w[0][0]).days / 365
    ppy = len(rets) / yrs
    mean = sum(rets) / len(rets)
    sd = math.sqrt(sum((r - mean) ** 2 for r in rets) / (len(rets) - 1))
    peak, mdd = w[0][1], 0.0
    for _, nav in w:
        peak = max(peak, nav); mdd = min(mdd, nav / peak - 1)
    return {"vol": sd * math.sqrt(ppy) * 100, "cagr": ((end[1] / w[0][1]) ** (1 / yrs) - 1) * 100, "mdd": mdd * 100, "obs": len(rets)}

out = {}
for code in ["122639", "118989", "119833"]:
    s = load(code)
    out[code] = {
        "latest": [s[-1][0].isoformat(), s[-1][1]],
        "1M": trailing(s, months=1), "6M": trailing(s, months=6), "1Y": trailing(s, months=12),
        "3Y": trailing(s, months=36), "5Y": trailing(s, months=60), "10Y": trailing(s, months=120),
        "sip_5k_from_2019-01-10": sip(s, 5000, dt.date(2019, 1, 10)),
        "risk_3y": risk(s, 3),
    }
(FIX / "mf-expected.json").write_text(json.dumps(out, indent=1))
print(json.dumps({c: {k: (v if not isinstance(v, dict) else {kk: (round(vv, 4) if isinstance(vv, float) else vv) for kk, vv in v.items()}) for k, v in o.items()} for c, o in out.items()}, indent=1)[:2500])
