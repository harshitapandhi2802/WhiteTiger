import { NextRequest, NextResponse } from "next/server";
import { completeLogin } from "@/lib/login";

/**
 * Local-development sign-in without Google (the email box in the sign-in
 * modal). Disabled in production, where only verified Google sign-in exists,
 * so every saved email address is real.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { email, name, marketingConsent } = (await req.json().catch(() => ({}))) as {
    email?: string; name?: string; marketingConsent?: boolean;
  };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  return completeLogin({ email, name: name || null, provider: "email" }, !!marketingConsent);
}
