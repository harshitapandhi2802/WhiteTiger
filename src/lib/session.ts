/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — SERVER SESSION COOKIE (server-only)

   After a verified Google sign-in, the server sets an httpOnly cookie
   `wt_session` = base64url(payload).base64url(hmac). It lets server
   code (the /admin page, unsubscribe links) know who is signed in.
   Same HMAC approach as the plan entitlement token.
   ═══════════════════════════════════════════════════════════════ */

import crypto from "crypto";

export const SESSION_COOKIE = "wt_session";
export const SESSION_TTL_DAYS = 30;

export interface SessionPayload {
  email: string;
  exp: number; // epoch ms
}

function secret(): string {
  return process.env.SESSION_SECRET || process.env.ENTITLEMENT_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
}

function hmac(body: string): string {
  return crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function signSession(email: string, ttlDays = SESSION_TTL_DAYS): string | null {
  if (!secret()) return null;
  const payload: SessionPayload = { email: email.toLowerCase(), exp: Date.now() + ttlDays * 86_400_000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

export function verifySession(token: string | null | undefined): SessionPayload | null {
  if (!secret() || !token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!safeEqual(sig, hmac(body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!p.email || !p.exp || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

/** Token for one-click unsubscribe links (no expiry). */
export function unsubscribeToken(email: string): string {
  return hmac(`unsub:${email.toLowerCase()}`);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!secret() || !email || !token) return false;
  return safeEqual(token, unsubscribeToken(email));
}

/** Owner emails allowed into /admin. Comma-separated ADMIN_EMAILS env. */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "harshitapandhi2802@gmail.com")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_DAYS * 86_400,
};
