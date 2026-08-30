"use client";
import React, { useState } from "react";
import { Lock, LogIn, Mail, AlertTriangle } from "lucide-react";
import { AuthGate } from "@/components/auth/AuthGate";
import type { WtUser } from "@/lib/auth";
import { isAllowedEmail, BETA_CONTACT } from "@/lib/allowlist";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — PRIVATE BETA GATE
   Full-screen takeover shown when no signed-in user is present
   (or when the stored user's email is not on the allowlist).
   Cannot be dismissed — the only way past is sign-in with an
   allowed email.
   ═══════════════════════════════════════════════════════════════ */

const C = {
  bg: "radial-gradient(ellipse at 50% 0%, rgba(74,158,255,0.12), transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(167,139,250,0.10), transparent 55%), #0A0E1A",
  card: "#161B2E", soft: "#1B2138", border: "rgba(232,237,245,0.1)",
  text: "#E8ECF4", muted: "#8C99B0",
  accent: "#4A9EFF", purple: "#A78BFA", danger: "#F87171",
};

export function PrivateBetaGate({ rejectedEmail }: { rejectedEmail?: string | null }) {
  const [authOpen, setAuthOpen] = useState(false);

  const onAuthed = (u: WtUser) => {
    // AuthGate already validated against the allowlist before saving the
    // user; nothing more to do here — useUser() will re-render the parent
    // which will lift the gate.
    if (!isAllowedEmail(u.email)) return;
    setAuthOpen(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.text,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 20px", position: "relative", overflow: "hidden",
    }}>
      {/* Floating accent orbs (purely cosmetic) */}
      <div aria-hidden="true" style={{
        position: "absolute", top: "12%", left: "10%", width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,158,255,0.18), transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: "10%", right: "10%", width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)",
        filter: "blur(50px)", pointerEvents: "none",
      }} />

      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, position: "relative" }}>
        <span style={{ fontSize: "2rem" }}>🐯</span>
        <span style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.02em" }}>White Tiger</span>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 460, background: C.card,
        border: `1px solid ${C.border}`, borderRadius: 18, padding: "30px 28px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)", position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={18} color="#fff" />
          </div>
          <div>
            <div style={{
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.12em",
              color: C.accent, textTransform: "uppercase",
            }}>Private Beta · Invite Only</div>
            <h1 style={{ fontSize: "1.18rem", fontWeight: 900, margin: 0, letterSpacing: "-0.01em" }}>
              White Tiger is still being built.
            </h1>
          </div>
        </div>

        <p style={{ fontSize: "0.82rem", color: C.muted, lineHeight: 1.55, margin: "0 0 18px" }}>
          Access is currently limited to a small group of early testers.
          You&apos;ll need an invited account to enter the platform.
        </p>

        {/* If a non-allowlisted user just got bounced, explain why */}
        {rejectedEmail && (
          <div style={{
            display: "flex", gap: 8, padding: "10px 12px", marginBottom: 16,
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)",
            borderRadius: 10, fontSize: "0.72rem", color: C.danger, lineHeight: 1.5,
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              The account <strong style={{ color: "#fff" }}>{rejectedEmail}</strong> is not on the beta allowlist.
              Please sign in with an invited Google account.
            </div>
          </div>
        )}

        {/* Sign-in CTA */}
        <button onClick={() => setAuthOpen(true)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "12px 18px",
          background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, border: "none",
          borderRadius: 10, color: "#fff", fontSize: "0.9rem", fontWeight: 800,
          cursor: "pointer", boxShadow: "0 10px 30px rgba(74,158,255,0.3)",
        }}>
          <LogIn size={15} /> Sign in to continue
        </button>

        {/* Contact */}
        <div style={{
          marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`,
          fontSize: "0.7rem", color: C.muted, lineHeight: 1.5,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <Mail size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            Want a beta invite? Email{" "}
            <a href={`mailto:${BETA_CONTACT}`} style={{ color: C.accent, textDecoration: "none", fontWeight: 700 }}>
              {BETA_CONTACT}
            </a>
            {" "}with a short note about why you&apos;d like to try the platform.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 26, fontSize: "0.66rem", color: C.muted, textAlign: "center" }}>
        © {new Date().getFullYear()} White Tiger · Educational research — not investment advice.
      </div>

      {/* AuthGate (real sign-in UI) */}
      {authOpen && (
        <AuthGate
          onAuthed={onAuthed}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}

export default PrivateBetaGate;
