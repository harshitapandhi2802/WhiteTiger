/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — PRIVATE-BETA ALLOWLIST

   Controls who can sign in and use the app while it is in private
   beta. Anyone whose email isn't in this set is shown the beta gate
   and cannot enter the platform — including users who already had
   a stored session from before the gate was added.

   To add or remove beta testers, edit this file and redeploy.
   ═══════════════════════════════════════════════════════════════ */

const ALLOWED_EMAILS_RAW: string[] = [
  "harshitapandhi2802@gmail.com",
  "nipuntalwar330@gmail.com",
];

export const ALLOWED_EMAILS = new Set(ALLOWED_EMAILS_RAW.map((e) => e.toLowerCase().trim()));

/** True only if the email is on the private-beta allowlist. */
export function isAllowedEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  return ALLOWED_EMAILS.has(email.toLowerCase().trim());
}

/** Used in UI copy when surfacing a friendly support email. */
export const BETA_CONTACT = "harshitapandhi2802@gmail.com";
