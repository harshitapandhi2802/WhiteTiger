/**
 * GET /api/mf-scheme?code=<AMFI scheme code>[&history=1]
 * Verified report for one scheme code — see src/lib/mf-scheme-report.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { cacheHeaders, rateLimitResponse } from "@/lib/services/apiGuard";
import { buildSchemeReport } from "@/lib/mf-scheme-report";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "mf-scheme", limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const { searchParams } = new URL(req.url);
  const code = Number(searchParams.get("code"));
  if (!Number.isInteger(code) || code <= 0) return NextResponse.json({ success: false, error: "A numeric AMFI scheme code is required" }, { status: 400 });
  const { status, body } = await buildSchemeReport(code, { includeHistory: searchParams.get("history") === "1" });
  return NextResponse.json(body, { status, headers: status === 200 ? cacheHeaders(900) : undefined });
}
