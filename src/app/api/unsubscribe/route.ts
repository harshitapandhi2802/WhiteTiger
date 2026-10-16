import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, unsubscribe } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/session";

function page(title: string, msg: string, status = 200) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${title} · White Tiger</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0E1A;color:#E8EDF5;font-family:Inter,Segoe UI,Arial,sans-serif;padding:20px;">
<div style="max-width:420px;text-align:center;background:#161B2E;border:1px solid rgba(232,237,245,0.1);border-radius:16px;padding:28px;">
<h1 style="font-size:20px;margin:0 0 10px;">${title}</h1><p style="color:#8C99B0;line-height:1.6;margin:0 0 18px;">${msg}</p>
<a href="/" style="color:#4A9EFF;font-weight:700;text-decoration:none;">Back to White Tiger</a></div></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handle(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("e") || "";
  const token = req.nextUrl.searchParams.get("t") || "";
  if (!verifyUnsubscribeToken(email, token)) {
    return page("Link not valid", "This unsubscribe link is invalid or incomplete. Reply to any White Tiger email and we'll remove you.", 400);
  }
  if (!dbConfigured()) return page("Try again later", "We couldn't update your preferences right now. Please reply to the email instead.", 503);
  try {
    await unsubscribe(email);
  } catch (e) {
    console.error("[unsubscribe]", e);
    return page("Try again later", "We couldn't update your preferences right now. Please reply to the email instead.", 500);
  }
  return page("You're unsubscribed", "You won't receive marketing emails from White Tiger any more. You can still sign in and use the app.");
}

export const GET = handle;
// RFC 8058 one-click unsubscribe (Gmail's "Unsubscribe" button) uses POST.
export const POST = handle;
