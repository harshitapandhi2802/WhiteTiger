import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { rateLimitResponse } from "@/lib/services/apiGuard";
import { isAllowedEmail } from "@/lib/allowlist";
import { completeLogin } from "@/lib/login";

// Google's public signing keys for ID tokens (cached by jose).
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/** Verify a Google Identity Services credential server-side, then sign the user in. */
export async function POST(req: NextRequest) {
  const limited = rateLimitResponse(req, { scope: "auth", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
  if (!clientId) {
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 503 });
  }

  let body: { credential?: string; marketingConsent?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.credential) return NextResponse.json({ error: "Missing credential." }, { status: 400 });

  let claims;
  try {
    const { payload } = await jwtVerify(body.credential, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    claims = payload as { email?: string; email_verified?: boolean; name?: string; picture?: string; sub?: string };
  } catch {
    return NextResponse.json({ error: "Google sign-in could not be verified. Please try again." }, { status: 401 });
  }

  if (!claims.email || claims.email_verified !== true) {
    return NextResponse.json({ error: "Your Google account email is not verified." }, { status: 401 });
  }
  if (!isAllowedEmail(claims.email)) {
    return NextResponse.json({ error: "This account is not on the private-beta list." }, { status: 403 });
  }

  return completeLogin(
    { email: claims.email, name: claims.name, picture: claims.picture, googleSub: claims.sub, provider: "google" },
    !!body.marketingConsent,
  );
}
