import { NextResponse } from "next/server";
import { fetchLiveYields } from "@/lib/services/livePrice";
import { cacheHeaders } from "@/lib/services/apiGuard";

/**
 * Live sovereign benchmark yields (India/US G-Sec) from TradingView.
 * Used by the real-estate tab to link mortgage rates to the live 10Y G-Sec
 * and by any view needing a live rate anchor.
 */
export async function GET() {
  const yields = await fetchLiveYields();
  return NextResponse.json(yields, { headers: cacheHeaders(300) });
}
