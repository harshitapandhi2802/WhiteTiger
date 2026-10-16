/**
 * Builds the verified report for one AMFI scheme code (one plan + option variant).
 * Used by /api/mf-scheme and /api/analyze-mf so the UI and the AI see identical figures.
 * Everything returned is official AMFI data or computed from AMFI NAVs with mf-returns.ts;
 * fields with no verified source are null with a note.
 */
import { getAMFIData, getSchemeHistory, siblingSchemes } from "./amfi-service";
import {
  parseMfapiHistory, trailingReturn, STANDARD_PERIODS, sinceFirstNav, rollingReturns, riskMetrics,
  navOnOrBefore, daysBetween, type NavPoint,
} from "./mf-returns";

/** Risk-free proxy: SBI Overnight Fund — Direct Plan — Growth (AMFI 119833). Its realised return over the same window. */
export const RISK_FREE_PROXY_CODE = 119833;

const UNAVAILABLE = "Not published in AMFI's NAV or scheme-master files; not yet connected to a verified source.";

export type SchemeReportResult = { status: number; body: Record<string, unknown> };

export async function buildSchemeReport(code: number, opts: { includeHistory?: boolean } = {}): Promise<SchemeReportResult> {
  const data = await getAMFIData();
  const scheme = data.byCode.get(code);
  if (!scheme) return { status: 404, body: { success: false, error: "Unknown AMFI scheme code" } };

  const siblings = siblingSchemes(data, scheme).map(s => ({
    schemeCode: s.schemeCode, schemeName: s.schemeName, plan: s.plan, option: s.option,
    idcwFrequency: s.idcwFrequency, status: s.status, nav: s.nav, navDate: s.navDate,
  }));
  const base = {
    success: true as const,
    scheme,
    siblings,
    amfi: { nav: scheme.nav, navDate: scheme.navDate, fileLatestNavDate: data.navDate, source: data.navSource, snapshotDate: data.snapshotDate },
    unavailable: {
      expenseRatio: UNAVAILABLE, aum: UNAVAILABLE, fundManager: UNAVAILABLE, benchmark: UNAVAILABLE, exitLoad: UNAVAILABLE,
      portfolioHoldings: UNAVAILABLE, sectorAllocation: UNAVAILABLE, creditQuality: UNAVAILABLE, duration: UNAVAILABLE, riskometer: UNAVAILABLE,
    },
    documents: [
      { label: "Scheme offer documents (SID / KIM) — SEBI filings", url: "https://www.sebi.gov.in/filings/mutual-funds.html" },
      { label: "NAV history — AMFI", url: "https://www.amfiindia.com/net-asset-value/nav-history" },
    ],
  };

  const hist = await getSchemeHistory(code);
  if (!hist?.data?.length) {
    return { status: 200, body: { ...base, performance: null, performanceNote: "NAV history is unavailable from mfapi.in right now; returns are not shown rather than estimated." } };
  }

  // History (mfapi.in republishes AMFI NAVs) reconciled with today's AMFI file.
  const { series: raw, issues } = parseMfapiHistory(hist.data);
  const series: NavPoint[] = [...raw];
  const last = series.at(-1);
  const reconciliation: { status: string; detail?: string } = { status: "match" };
  if (scheme.nav !== null && scheme.navDate && last) {
    if (scheme.navDate > last.date) {
      series.push({ date: scheme.navDate, nav: scheme.nav });
      reconciliation.status = "appended-amfi";
      reconciliation.detail = `History ended ${last.date}; AMFI's ${scheme.navDate} NAV appended.`;
    } else if (scheme.navDate === last.date && Math.abs(scheme.nav - last.nav) > 1e-6) {
      series[series.length - 1] = { date: scheme.navDate, nav: scheme.nav };
      reconciliation.status = "mismatch-amfi-used";
      reconciliation.detail = `History NAV ${last.nav} differs from AMFI ${scheme.nav} for ${scheme.navDate}; AMFI value used.`;
    } else if (scheme.navDate < last.date) {
      reconciliation.status = "history-newer";
      reconciliation.detail = `History has ${last.date}; AMFI file shows ${scheme.navDate}.`;
    }
  }

  const isGrowth = scheme.option === "Growth";
  const trailing = STANDARD_PERIODS.map(p => trailingReturn(series, p));
  const si = sinceFirstNav(series, scheme.launchDate);
  const rolling = isGrowth ? { "1Y": rollingReturns(series, 1, 7), "3Y": rollingReturns(series, 3, 7), "5Y": rollingReturns(series, 5, 7) } : null;

  let risk: unknown = { reason: "Not computed for IDCW/Bonus options: NAV drops on payouts, so volatility and drawdown would be misstated." };
  if (isGrowth) {
    let rfPct: number | null = null, rfNote = "Risk-free proxy unavailable; Sharpe and Sortino not computed.";
    const prelim = riskMetrics(series, 3, null);
    if ("windowStart" in prelim) {
      const rfHist = code === RISK_FREE_PROXY_CODE ? { data: hist.data } : await getSchemeHistory(RISK_FREE_PROXY_CODE);
      if (rfHist?.data?.length) {
        const rf = parseMfapiHistory(rfHist.data).series;
        const a = navOnOrBefore(rf, prelim.windowStart), b = navOnOrBefore(rf, prelim.windowEnd);
        if (a && b && b.date > a.date) {
          rfPct = Math.round((Math.pow(b.nav / a.nav, 365 / daysBetween(a.date, b.date)) - 1) * 1e6) / 1e4;
          rfNote = `Risk-free proxy: SBI Overnight Fund (Direct, Growth; AMFI ${RISK_FREE_PROXY_CODE}) realised ${rfPct}% p.a. over the same window.`;
        }
      }
    }
    const r = riskMetrics(series, 3, rfPct);
    risk = "windowStart" in r ? { ...r, riskFreeNote: rfNote } : r;
  }

  const performance = {
    asOfNavDate: series.at(-1)!.date,
    firstNavDate: series[0].date,
    observations: series.length,
    trailing, sinceFirstNav: si, rolling, risk,
    navOnlyCaveat: isGrowth ? null : "IDCW/Bonus NAV excludes distributions; these returns understate total return and must not be compared with Growth options.",
    dataQuality: {
      reconciliation, droppedPoints: issues.dropped, duplicateDates: issues.duplicateDates, conflictingDuplicates: issues.conflictingDuplicates,
      gapsOver10Days: issues.gaps.length, largestGap: issues.gaps.sort((x, y) => y.days - x.days)[0] ?? null,
      movesOver20Pct: issues.largeMoves,
      latestNavAgeDays: daysBetween(series.at(-1)!.date, data.navDate),
    },
    methodology: "Trailing returns use the NAV on the start date or the previous NAV within 7 days; periods under 1 year are absolute, 1 year and longer are CAGR on actual days. Rolling returns step weekly. Risk uses every NAV observation in the last 3 years, annualised by observations per year.",
    sources: { navHistory: "mfapi.in (republishes AMFI NAVs)", latestNav: "AMFI NAVAll.txt", retrievedAt: new Date().toISOString() },
  };

  return { status: 200, body: { ...base, performance, ...(opts.includeHistory ? { history: series.map(p => [p.date, p.nav]) } : {}) } };
}
