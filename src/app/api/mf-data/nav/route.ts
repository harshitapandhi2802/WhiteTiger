import { NextRequest, NextResponse } from "next/server";
import { getSchemeHistory } from "@/lib/amfi-service";

export const maxDuration = 30;

/**
 * GET /api/mf-data/nav?code=119598
 * Returns historical NAV data for a specific scheme code
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Scheme code required (e.g., ?code=119598)" }, { status: 400 });
  }

  const schemeCode = parseInt(code, 10);
  if (isNaN(schemeCode)) {
    return NextResponse.json({ error: "Invalid scheme code" }, { status: 400 });
  }

  try {
    const history = await getSchemeHistory(schemeCode);
    if (!history) {
      return NextResponse.json({ error: "Scheme not found or data unavailable" }, { status: 404 });
    }

    // Parse and compute basic stats
    const navData = history.data
      .slice(0, 365) // Last 1 year of data
      .map(d => ({ date: d.date, nav: parseFloat(d.nav) }))
      .filter(d => !isNaN(d.nav));

    const latestNav = navData[0]?.nav || 0;
    const prevNav = navData[1]?.nav || latestNav;
    const dayChange = latestNav - prevNav;
    const dayChangePct = prevNav ? ((dayChange / prevNav) * 100) : 0;

    // Compute period returns
    const getNavAtOffset = (days: number) => {
      const entry = navData[Math.min(days, navData.length - 1)];
      return entry?.nav || latestNav;
    };

    const computeReturn = (startNav: number) =>
      startNav ? Number(((latestNav - startNav) / startNav * 100).toFixed(2)) : 0;

    const returns = {
      "1W": computeReturn(getNavAtOffset(5)),
      "1M": computeReturn(getNavAtOffset(22)),
      "3M": computeReturn(getNavAtOffset(66)),
      "6M": computeReturn(getNavAtOffset(132)),
      "1Y": computeReturn(getNavAtOffset(252)),
      "YTD": computeReturn(getNavAtOffset(Math.min(navData.length - 1, 120))), // approximate
    };

    // Compute 52W high/low
    const yearNavs = navData.slice(0, 252).map(d => d.nav);
    const high52W = Math.max(...yearNavs);
    const low52W = Math.min(...yearNavs);

    return NextResponse.json({
      success: true,
      meta: history.meta,
      latestNav,
      latestDate: navData[0]?.date,
      dayChange: Number(dayChange.toFixed(2)),
      dayChangePct: Number(dayChangePct.toFixed(2)),
      returns,
      high52W: Number(high52W.toFixed(2)),
      low52W: Number(low52W.toFixed(2)),
      sparkline: navData.slice(0, 30).reverse().map(d => d.nav), // 30-day sparkline
      navHistory: navData.slice(0, 90), // 90-day history
      totalDataPoints: history.data.length,
    });
  } catch (err) {
    console.error("NAV API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch NAV data", details: String(err) },
      { status: 500 }
    );
  }
}
