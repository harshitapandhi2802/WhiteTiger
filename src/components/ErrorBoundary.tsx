"use client";
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   ERROR BOUNDARY — Catches crashes in any tab component
   Prevents one broken tab from taking down the entire platform
   ═══════════════════════════════════════════════════════════════ */

interface Props { children: React.ReactNode; fallbackLabel?: string; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[WhiteTiger] ${this.props.fallbackLabel || "Component"} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "48px 24px", borderRadius: 16,
          background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.12)",
          textAlign: "center", minHeight: 200,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(248,113,113,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center", marginBottom: 16,
          }}>
            <AlertTriangle size={24} color="#F87171" />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {this.props.fallbackLabel || "Section"} Failed to Load
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: 400 }}>
            Something went wrong while loading this section. Your other tabs are unaffected.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 20px", borderRadius: 10,
              background: "rgba(74,158,255,0.1)", border: "1px solid rgba(74,158,255,0.2)",
              color: "#4A9EFF", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Try Again
          </button>
          {this.state.error && (
            <details style={{ marginTop: 12, fontSize: "0.65rem", color: "var(--text-muted)", maxWidth: 500 }}>
              <summary style={{ cursor: "pointer" }}>Error details</summary>
              <pre style={{ textAlign: "left", whiteSpace: "pre-wrap", marginTop: 8, padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.2)" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
