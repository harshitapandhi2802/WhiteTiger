/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — PRIVATE-BETA ALLOWLIST

   Controls who can sign in and use the app while it is in private
   beta. Anyone whose email isn't in this set is shown the beta gate
   and cannot enter the platform — including users who already had
   a stored session from before the gate was added.

   To add or remove beta testers, edit this file and redeploy.

   PUBLIC LAUNCH: the allowlist only applies while private beta is on.
   Set NEXT_PUBLIC_PRIVATE_BETA=true in Vercel to lock the app again;
   when unset, anyone with a verified Google account can sign in.
   ═══════════════════════════════════════════════════════════════ */

export const PRIVATE_BETA = process.env.NEXT_PUBLIC_PRIVATE_BETA === "true";

const ALLOWED_EMAILS_RAW: string[] = [
  "harshitapandhi2802@gmail.com",
  "nipuntalwar330@gmail.com",
];

export const ALLOWED_EMAILS = new Set(ALLOWED_EMAILS_RAW.map((e) => e.toLowerCase().trim()));

/** True if the email may use the app: anyone when public, allowlist only during private beta. */
export function isAllowedEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  if (!PRIVATE_BETA) return true;
  return ALLOWED_EMAILS.has(email.toLowerCase().trim());
}

/** Used in UI copy when surfacing a friendly support email. */
export const BETA_CONTACT = "harshitapandhi2802@gmail.com";
