import { NextRequest, NextResponse } from "next/server";
import { listUsers } from "@/lib/db";
import { SESSION_COOKIE, isAdmin, verifySession } from "@/lib/session";

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV export of all signed-in users. Owner only. */
export async function GET(req: NextRequest) {
  const s = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!s || !isAdmin(s.email)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const users = await listUsers();
  const cols = ["email", "name", "provider", "first_login_at", "last_login_at", "login_count",
    "marketing_consent", "welcome_sent_at", "welcome_error", "unsubscribed_at"] as const;
  const lines = [cols.join(","), ...users.map((u) => cols.map((c) => csvCell(u[c])).join(","))];
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="whitetiger-users-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
