"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Mail, Shield, Sparkles, ArrowRight } from "lucide-react";
import { setUser, userFromGoogleJwt, userFromEmail, type WtUser } from "@/lib/auth";
import { isAllowedEmail, BETA_CONTACT } from "@/lib/allowlist";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — AUTH GATE MODAL
   Shown when a guest user clicks a gated section. Primary path is
   "Sign in with Google" via Google Identity Services. Email entry
   is the always-available fallback so the gate works even before
   Google OAuth credentials are configured.

   To enable real Google sign-in, set NEXT_PUBLIC_GOOGLE_CLIENT_ID
   in your Vercel env vars (from console.cloud.google.com →
   APIs & Services → Credentials → OAuth 2.0 Client ID, web app).
   ═══════════════════════════════════════════════════════════════ */

interface GoogleIdentityWindow extends Window {
  google?: {
    accounts: {
      id: {
        initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void;
        renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        prompt?: () => void;
      };
    };
  };
}

const C = {
  bg: "rgba(10,14,26,0.78)", card: "#161B2E", soft: "#1B2138",
  border: "rgba(232,237,245,0.1)", text: "#E8ECF4", muted: "#8C99B0",
  accent: "#4A9EFF", purple: "#A78BFA", success: "#34D399", danger: "#F87171",
};

const GOOGLE_GSI_SRC = "https://accounts.google.com/gsi/client";

export function AuthGate({
  targetSection,
  onAuthed,
  onClose,
}: {
  targetSection?: { label: string; color: string };
  onAuthed: (user: WtUser) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();

  // Load the Google Identity Services script once.
  useEffect(() => {
    if (!clientId) return;
    if (document.getElementById("wt-gsi-script")) {
      if ((window as GoogleIdentityWindow).google?.accounts?.id) setGsiReady(true);
      return;
    }
    const s = document.createElement("script");
    s.id = "wt-gsi-script";
    s.src = GOOGLE_GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => setGsiReady(true);
    document.head.appendChild(s);
  }, [clientId]);

  const handleGoogleCredential = useCallback((credential: string) => {
    const u = userFromGoogleJwt(credential);
    if (!u) { setError("Could not read Google sign-in. Please try email."); return; }
    if (!isAllowedEmail(u.email)) {
      setError(`Sorry — ${u.email} is not on the private-beta allowlist. Email ${BETA_CONTACT} to request access.`);
      return;
    }
    setUser(u);
    onAuthed(u);
  }, [onAuthed]);

  // Initialize + render the Google sign-in button.
  useEffect(() => {
    if (!gsiReady || !clientId || !googleBtnRef.current) return;
    const g = (window as GoogleIdentityWindow).google;
    if (!g) return;
    try {
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => handleGoogleCredential(r.credential),
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      googleBtnRef.current.innerHTML = "";
      g.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard", theme: "filled_blue", size: "large",
        text: "continue_with", shape: "rectangular", logo_alignment: "left",
        width: 320,
      });
    } catch {
      // Silent — fall back to email entry.
    }
  }, [gsiReady, clientId, handleGoogleCredential]);

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Please enter a valid email."); return; }
    if (!isAllowedEmail(trimmed)) {
      setError(`Sorry — ${trimmed} is not on the private-beta allowlist. Email ${BETA_CONTACT} to request access.`);
      return;
    }
    const u = userFromEmail(trimmed, name);
    setUser(u);
    onAuthed(u);
  };

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: "fixed", inset: 0, background: C.bg, backdropFilter: "blur(8px)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.card, borderRadius: 18, padding: 28, width: "100%", maxWidth: 420,
        border: `1px solid ${C.border}`, boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        color: C.text, position: "relative",
      }}>
        {/* Close */}
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: 14, right: 14, background: "transparent",
          border: "none", color: C.muted, cursor: "pointer", padding: 4, borderRadius: 6,
        }}><X size={18} /></button>

        {/* Logo + title */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{
            width: 56, height: 56, margin: "0 auto 14px", borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.8rem",
          }}>🐯</div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Welcome to White Tiger
          </h2>
          <p style={{ fontSize: "0.78rem", color: C.muted, margin: "6px 0 0", lineHeight: 1.5 }}>
            {targetSection ? <>Sign in to open <strong style={{ color: targetSection.color }}>{targetSection.label}</strong> and the rest of the platform.</>
              : "Sign in or create an account in seconds."}
          </p>
        </div>

        {mode === "choose" ? (
          <>
            {/* Google button area */}
            <div style={{ marginBottom: 14, minHeight: 44, display: "flex", justifyContent: "center" }}>
              {clientId ? (
                gsiReady
                  ? <div ref={googleBtnRef} />
                  : <div style={{ height: 44, display: "flex", alignItems: "center", color: C.muted, fontSize: "0.78rem" }}>Loading Google sign-in…</div>
              ) : (
                <button
                  onClick={() => setError("Google sign-in is not configured yet — please continue with email below.")}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    width: "100%", padding: "11px 16px", background: "#fff", border: "none",
                    borderRadius: 8, color: "#1a1a2e", fontSize: "0.86rem", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <GoogleG /> Continue with Google
                </button>
              )}
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 14px" }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: "0.6rem", color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            {/* Email option */}
            <button onClick={() => { setError(null); setMode("email"); }} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 16px", background: C.soft, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
            }}>
              <Mail size={14} /> Continue with email
            </button>

            {error && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, fontSize: "0.7rem", color: C.danger }}>
                {error}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              autoFocus type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={{
                padding: "11px 14px", borderRadius: 8, background: C.soft,
                border: `1px solid ${C.border}`, color: C.text, fontSize: "0.86rem", outline: "none",
              }}
            />
            <input
              type="text" placeholder="Your name (optional)" value={name}
              onChange={e => setName(e.target.value)}
              style={{
                padding: "11px 14px", borderRadius: 8, background: C.soft,
                border: `1px solid ${C.border}`, color: C.text, fontSize: "0.86rem", outline: "none",
              }}
            />
            <button type="submit" style={{
              padding: "11px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, color: "#fff",
              fontSize: "0.86rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              Continue <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => { setError(null); setMode("choose"); }} style={{
              background: "transparent", border: "none", color: C.muted,
              cursor: "pointer", fontSize: "0.74rem", marginTop: 4,
            }}>← Back to all options</button>
            {error && (
              <div style={{ padding: "8px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, fontSize: "0.7rem", color: C.danger }}>
                {error}
              </div>
            )}
          </form>
        )}

        {/* Trust line */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.62rem", color: C.muted, lineHeight: 1.5 }}>
          <Shield size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>By continuing you agree to our <a href="/terms" style={{ color: C.accent }}>Terms</a> and <a href="/privacy" style={{ color: C.accent }}>Privacy Policy</a>. White Tiger is educational research — not investment advice.</span>
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  // Google "G" mark — official multicolor.
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09a6.97 6.97 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

export default AuthGate;
