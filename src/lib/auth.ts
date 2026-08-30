/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — CLIENT AUTH
   Lightweight account-style gating for the section landing page.

   Sign-in via Google Identity Services (real Google button + JWT
   claims decode for name/email/picture). Email fallback when no
   Google Client ID is configured so the gate works immediately.

   Auth state lives in localStorage as a JSON blob. This is a UX
   gate, not a security control — paid features and analysis quotas
   are still enforced by the server-side rate limit + signed
   entitlement system shipped in Phase 1.
   ═══════════════════════════════════════════════════════════════ */

const USER_KEY = "wt_user";

export interface WtUser {
  email: string;
  name?: string;
  picture?: string;
  provider: "google" | "email";
  authedAt: string; // ISO
}

/** Read the current logged-in user from localStorage, or null. */
export function getUser(): WtUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as WtUser;
    if (!u?.email) return null;
    return u;
  } catch {
    return null;
  }
}

/** Persist a user as logged in. */
export function setUser(user: WtUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent("wt-auth-change"));
  } catch { /* ignore quota errors */ }
}

/** Log the user out. */
export function clearUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent("wt-auth-change"));
  } catch { /* ignore */ }
}

/** Decode the payload of a Google ID token (claims only, no signature check). */
export function decodeGoogleJwt(jwt: string): { email?: string; name?: string; picture?: string; sub?: string } | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    // base64url → base64
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Convenience: turn a Google JWT into a WtUser. */
export function userFromGoogleJwt(jwt: string): WtUser | null {
  const claims = decodeGoogleJwt(jwt);
  if (!claims?.email) return null;
  return {
    email: claims.email,
    name: claims.name,
    picture: claims.picture,
    provider: "google",
    authedAt: new Date().toISOString(),
  };
}

export function userFromEmail(email: string, name?: string): WtUser {
  return {
    email: email.trim().toLowerCase(),
    name: name?.trim(),
    provider: "email",
    authedAt: new Date().toISOString(),
  };
}

/** React hook that re-renders when auth state changes (login / logout). */
import { useEffect, useState } from "react";
export function useUser(): WtUser | null {
  const [u, setU] = useState<WtUser | null>(null);
  useEffect(() => {
    setU(getUser());
    const onChange = () => setU(getUser());
    window.addEventListener("wt-auth-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("wt-auth-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return u;
}
