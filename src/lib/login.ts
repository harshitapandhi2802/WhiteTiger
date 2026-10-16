/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — SHARED SIGN-IN COMPLETION (server-only)

   Called by /api/auth/google (production) and /api/auth/dev-login
   (local development only) once the identity is known:
     1. save / update the user in Postgres
     2. send the welcome email once, after the response (next/server after)
     3. set the signed wt_session cookie
   A database or mail outage never blocks the sign-in itself.
   ═══════════════════════════════════════════════════════════════ */

import { NextResponse, after } from "next/server";
import { dbConfigured, markWelcome, recordLogin } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/mailer";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export interface VerifiedIdentity {
  email: string;
  name?: string | null;
  picture?: string | null;
  googleSub?: string | null;
  provider: "google" | "email";
}

export async function completeLogin(id: VerifiedIdentity, marketingConsent: boolean): Promise<NextResponse> {
  const email = id.email.trim().toLowerCase();
  let saved = false;
  let isNew = false;

  if (dbConfigured()) {
    try {
      const r = await recordLogin({ ...id, email, marketingConsent });
      saved = true;
      isNew = r.isNew;
      if (!r.user.welcome_sent_at) {
        const who = { email, name: r.user.name };
        after(async () => {
          const res = await sendWelcomeEmail(who);
          try {
            await markWelcome(email, res.sent ? null : res.error || "unknown");
          } catch (e) {
            console.error("[login] markWelcome failed:", e);
          }
        });
      }
    } catch (e) {
      console.error("[login] could not save user:", e instanceof Error ? e.message : e);
    }
  } else {
    console.warn("[login] DATABASE_URL not set; user not saved:", email);
  }

  const res = NextResponse.json({
    user: { email, name: id.name ?? undefined, picture: id.picture ?? undefined, provider: id.provider, authedAt: new Date().toISOString() },
    isNew,
    saved,
  });
  const token = signSession(email);
  if (token) res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
