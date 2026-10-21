/**
 * Saved research for the signed-in user: paper positions, option
 * strategies and journal notes.
 *
 *   GET    /api/workspace?kind=position
 *   POST   /api/workspace   { kind, id, data }
 *   DELETE /api/workspace?kind=position&id=abc
 *
 * Signed-in only (wt_session cookie). Nothing here places orders.
 */
import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, listWorkspace, saveWorkspace, deleteWorkspace, WORKSPACE_KINDS, WORKSPACE_LIMIT } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { rateLimitResponse } from "@/lib/services/apiGuard";

const MAX_BYTES = 20_000;
const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function auth(req: NextRequest) {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}

const kindOk = (k: unknown): k is string => typeof k === "string" && (WORKSPACE_KINDS as readonly string[]).includes(k);

function guard(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "workspace", limit: 120, windowMs: 60_000 });
  if (limited) return { error: limited };
  if (!dbConfigured()) return { error: NextResponse.json({ error: "Saving isn't available right now." }, { status: 503 }) };
  const s = auth(req);
  if (!s) return { error: NextResponse.json({ error: "Sign in to save your research." }, { status: 401 }) };
  return { email: s.email };
}

export async function GET(req: NextRequest) {
  const g = guard(req);
  if (g.error) return g.error;
  const kind = req.nextUrl.searchParams.get("kind");
  if (!kindOk(kind)) return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  const items = await listWorkspace(g.email!, kind);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const g = guard(req);
  if (g.error) return g.error;
  const text = await req.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ error: "Too large" }, { status: 413 });
  let body: { kind?: unknown; id?: unknown; data?: unknown };
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!kindOk(body.kind) || typeof body.id !== "string" || !ID_RE.test(body.id) || !body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }
  const ok = await saveWorkspace(g.email!, body.kind, body.id, body.data as Record<string, unknown>);
  if (!ok) return NextResponse.json({ error: `You can save up to ${WORKSPACE_LIMIT} items of each kind.` }, { status: 409 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const g = guard(req);
  if (g.error) return g.error;
  const kind = req.nextUrl.searchParams.get("kind");
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!kindOk(kind) || !ID_RE.test(id)) return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  await deleteWorkspace(g.email!, kind, id);
  return NextResponse.json({ ok: true });
}
