import React from "react";
import Link from "next/link";

/* Shared shell for Terms / Privacy / About — dark theme, readable column. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-obsidian, #0A0E1A)", color: "var(--text-primary, #E8ECF4)" }}>
      {/* Header */}
      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid var(--border, rgba(255,255,255,0.08))",
          position: "sticky", top: 0, background: "rgba(10,14,26,0.85)", backdropFilter: "blur(12px)", zIndex: 10,
        }}
      >
        <Link href="/analyze" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text-primary, #E8ECF4)" }}>
          <span style={{ fontSize: "1.3rem" }}>🐯</span>
          <span style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>White Tiger</span>
        </Link>
        <Link
          href="/analyze"
          style={{
            fontSize: "0.78rem", fontWeight: 600, color: "var(--accent, #4A9EFF)",
            textDecoration: "none", padding: "7px 14px", borderRadius: 8,
            border: "1px solid var(--border, rgba(255,255,255,0.08))",
          }}
        >
          ← Back to app
        </Link>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>{title}</h1>
        {updated && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted, #8C99B0)", marginBottom: 32 }}>
            Last updated: {updated}
          </p>
        )}
        <div style={{ fontSize: "0.92rem", lineHeight: 1.75, color: "var(--text-secondary, #B8C0D0)" }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border, rgba(255,255,255,0.08))",
          padding: "24px", textAlign: "center", fontSize: "0.75rem",
          color: "var(--text-muted, #8C99B0)",
        }}
      >
        <div style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <Link href="/about" style={{ color: "var(--text-muted, #8C99B0)", textDecoration: "none" }}>About</Link>
          <Link href="/terms" style={{ color: "var(--text-muted, #8C99B0)", textDecoration: "none" }}>Terms</Link>
          <Link href="/privacy" style={{ color: "var(--text-muted, #8C99B0)", textDecoration: "none" }}>Privacy</Link>
        </div>
        © {new Date().getFullYear()} White Tiger. For educational use only — not investment advice.
      </footer>
    </div>
  );
}

/* Section heading helper */
export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary, #E8ECF4)", margin: "28px 0 10px" }}>
      {children}
    </h2>
  );
}
