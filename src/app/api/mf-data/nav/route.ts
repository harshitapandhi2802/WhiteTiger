import { NextRequest, NextResponse } from "next/server";
import { getSchemeHistory } from "@/lib/amfi-service";
import { parseMfapiHistory, trailingReturn, STANDARD_PERIODS, shiftDate, navOnOrBefore } from "@/lib/mf-returns";

export const maxDuration = 30;

/**
 * GET /api/mf-data/nav?code=119598
 * NAV history summary for one AMFI scheme code. Returns are date-based (see
 * src/lib/mf-returns.ts) — a missing period is null, never 0.
 */
export async function GET(req: NextRequest) {
  const code = Number(new URL(req.url).searchParams.get("code"));
  if (!Number.isInteger(code) || code <= 0) {
    return NextResponse.json({ error: "Scheme code required (e.g., ?code=119598)" }, { status: 400 });
  }

  try {
    const history = await getSchemeHistory(code);
    if (!history?.data?.length) {
      return NextResponse.json({ error: "Scheme not found or data unavailable" }, { status: 404 });
    }
    const { series, issues } = parseMfapiHistory(history.data);
    if (series.length < 2) return NextResponse.json({ error: "Not enough NAV history" }, { status: 404 });

    const latest = series[series.length - 1], prev = series[series.length - 2];
    const returns: Record<string, number | null> = {};
    for (const p of STANDARD_PERIODS.filter(p => ["1W", "1M", "3M", "6M", "1Y"].includes(p.label))) {
      const r = trailingReturn(series, p);
      returns[p.label] = r.absolutePct === null ? null : Math.round(r.absolutePct * 100) / 100;
    }
    // YTD: from the last NAV of the previous calendar year.
    const ytdStart = navOnOrBefore(series, `${+latest.date.slice(0, 4) - 1}-12-31`);
    returns.YTD = ytdStart ? Math.round((latest.nav / ytdStart.nav - 1) * 1e4) / 100 : null;

    const yearAgo = shiftDate(latest.date, { years: -1 });
    const lastYear = series.filter(p => p.date > yearAgo);
    const hasFullYear = series[0].date <= yearAgo;

    return NextResponse.json({
      success: true,
      meta: history.meta,
      latestNav: latest.nav,
      latestDate: latest.date,
      previousNavDate: prev.date,
      dayChange: Math.round((latest.nav - prev.nav) * 1e4) / 1e4,
      dayChangePct: Math.round((latest.nav / prev.nav - 1) * 1e4) / 100,
      returns,
      high52W: hasFullYear ? Math.max(...lastYear.map(p => p.nav)) : null,
      low52W: hasFullYear ? Math.min(...lastYear.map(p => p.nav)) : null,
      sparkline: series.slice(-30).map(d => d.nav),
      navHistory: series.slice(-90),
      totalDataPoints: series.length,
      dataQuality: { droppedPoints: issues.dropped, gapsOver10Days: issues.gaps.length },
      note: "latestDate is the NAV date published by AMFI, not today's date.",
    });
  } catch (err) {
    console.error("NAV API error:", err);
    return NextResponse.json({ error: "Failed to fetch NAV data", details: String(err) }, { status: 500 });
  }
}
