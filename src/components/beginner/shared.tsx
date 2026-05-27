"use client";
import { useState, type CSSProperties } from "react";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER MODE — SHARED DESIGN SYSTEM v3
   Premium light theme. Apple-style simplicity.
   Calm, modern, educational.
   ═══════════════════════════════════════════════════════════════ */

// ─── Design Tokens — LIGHT THEME ──────────────────────────────
export const COLORS = {
  // Backgrounds
  bg: "#f8fafc",
  bgWhite: "#ffffff",
  card: "#ffffff",
  cardBorder: "rgba(0,0,0,0.06)",
  cardHover: "rgba(0,0,0,0.02)",
  cardShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
  cardShadowHover: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",

  // Accent — Emerald
  accent: "#059669",
  accentLight: "#10b981",
  accentSoft: "rgba(16,185,129,0.08)",
  accentBorder: "rgba(16,185,129,0.2)",

  // Purple
  purple: "#7c3aed",
  purpleSoft: "rgba(124,58,237,0.06)",
  purpleBorder: "rgba(124,58,237,0.12)",

  // Blue
  blue: "#4f46e5",
  blueSoft: "rgba(79,70,229,0.06)",
  blueBorder: "rgba(79,70,229,0.12)",

  // Status
  red: "#dc2626",
  redSoft: "rgba(220,38,38,0.06)",
  amber: "#d97706",
  amberSoft: "rgba(217,119,6,0.06)",
  green: "#059669",
  greenSoft: "rgba(5,150,105,0.06)",

  // Text
  textPrimary: "#0f172a",
  textSecondary: "#334155",
  textMuted: "#64748b",
  textDim: "#94a3b8",
  textGhost: "#cbd5e1",

  // Dividers
  divider: "rgba(0,0,0,0.06)",
  dividerLight: "rgba(0,0,0,0.03)",
} as const;

// ─── Card Style Helper ─────────────────────────────────────────
export function card(extra?: CSSProperties): CSSProperties {
  return {
    borderRadius: 16,
    padding: "20px",
    background: COLORS.card,
    border: `1px solid ${COLORS.cardBorder}`,
    boxShadow: COLORS.cardShadow,
    transition: "box-shadow 0.2s, border-color 0.2s",
    ...extra,
  };
}

// ─── Section Header ─────────────────────────────────────────────
export function SectionHeader({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "1.2rem" }}>{emoji}</span>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: COLORS.textPrimary, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontSize: "0.75rem", color: COLORS.textMuted, marginTop: 4, marginLeft: 32 }}>{subtitle}</p>}
    </div>
  );
}

// ─── AI Explanation Card ────────────────────────────────────────
export function AIExplanation({ text, emoji = "✨" }: { text: string; emoji?: string }) {
  return (
    <div style={{
      padding: "16px 18px", borderRadius: 14,
      background: "linear-gradient(135deg, rgba(16,185,129,0.04), rgba(79,70,229,0.03))",
      border: `1px solid ${COLORS.accentBorder}`,
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{emoji}</span>
      <p style={{ fontSize: "0.82rem", color: COLORS.textSecondary, fontWeight: 500, lineHeight: 1.7, margin: 0 }}>{text}</p>
    </div>
  );
}

// ─── "What This Means" Card ────────────────────────────────────
export function WhatThisMeansCard({ text, emoji = "💡" }: { text: string; emoji?: string }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(251,191,36,0.02))",
      border: "1px solid rgba(245,158,11,0.12)",
      display: "flex", gap: 10, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: COLORS.amber, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>What This Means For You</div>
        <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>{text}</p>
      </div>
    </div>
  );
}

// ─── Risk Meter ─────────────────────────────────────────────────
export function RiskMeter({ level }: { level: "low" | "medium" | "high" | "very-high" }) {
  const config = {
    low: { bars: 1, color: COLORS.green, label: "Low Risk" },
    medium: { bars: 2, color: COLORS.amber, label: "Medium Risk" },
    high: { bars: 3, color: "#ea580c", label: "High Risk" },
    "very-high": { bars: 4, color: COLORS.red, label: "Very High" },
  }[level];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: 4, height: 8 + i * 3, borderRadius: 2,
            background: i <= config.bars ? config.color : "rgba(0,0,0,0.08)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: config.color }}>{config.label}</span>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────
export function StatCard({ label, value, color, subtext }: { label: string; value: string; color?: string; subtext?: string }) {
  return (
    <div style={{
      padding: "14px 12px", borderRadius: 12,
      background: COLORS.bgWhite, border: `1px solid ${COLORS.cardBorder}`,
      boxShadow: COLORS.cardShadow, textAlign: "center", flex: 1,
    }}>
      <div style={{ fontSize: "0.58rem", color: COLORS.textDim, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 900, color: color || COLORS.textPrimary }}>{value}</div>
      {subtext && <div style={{ fontSize: "0.6rem", color: COLORS.textMuted, marginTop: 2 }}>{subtext}</div>}
    </div>
  );
}

// ─── Info Card (question-answer style) ──────────────────────────
export function InfoQA({ question, answer }: { question: string; answer: string }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      background: COLORS.bgWhite, border: `1px solid ${COLORS.cardBorder}`,
      boxShadow: COLORS.cardShadow,
    }}>
      <div style={{ fontSize: "0.7rem", color: COLORS.textDim, marginBottom: 4 }}>{question}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.5 }}>{answer}</div>
    </div>
  );
}

// ─── Pill Tabs ──────────────────────────────────────────────────
export function PillTabs({ tabs, active, onSelect }: { tabs: { id: string; label: string; emoji?: string }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onSelect(tab.id)} style={{
          padding: "7px 14px", borderRadius: 20, border: "1px solid",
          borderColor: active === tab.id ? COLORS.accent : COLORS.cardBorder,
          background: active === tab.id ? COLORS.accentSoft : COLORS.bgWhite,
          color: active === tab.id ? COLORS.accent : COLORS.textMuted,
          fontSize: "0.68rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          transition: "all 0.2s", boxShadow: active === tab.id ? "none" : COLORS.cardShadow,
        }}>
          {tab.emoji && <span style={{ marginRight: 4 }}>{tab.emoji}</span>}{tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Expandable Accordion ───────────────────────────────────────
export function Accordion({ items }: { items: { title: string; emoji?: string; content: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{
          ...card({ padding: "14px 18px", cursor: "pointer" }),
          borderColor: openIdx === i ? COLORS.accentBorder : COLORS.cardBorder,
          boxShadow: openIdx === i ? COLORS.cardShadowHover : COLORS.cardShadow,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {item.emoji && <span style={{ fontSize: "1.1rem" }}>{item.emoji}</span>}
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary }}>{item.title}</span>
            </div>
            <span style={{ fontSize: "0.72rem", color: COLORS.textDim, transform: openIdx === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>&#9660;</span>
          </div>
          {openIdx === i && (
            <p style={{ fontSize: "0.82rem", color: COLORS.textSecondary, lineHeight: 1.7, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.divider}` }}>
              {item.content}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Disclaimer ─────────────────────────────────────────────────
export function Disclaimer({ text }: { text?: string }) {
  return (
    <p style={{ fontSize: "0.55rem", color: COLORS.textDim, marginTop: 12, textAlign: "center" }}>
      {text || "For learning purposes only. Not investment advice."}
    </p>
  );
}

// ─── Upsell Banner ──────────────────────────────────────────────
export function UpsellBanner({ text }: { text: string }) {
  return (
    <div style={{
      textAlign: "center", marginTop: 16, padding: "16px 20px", borderRadius: 14,
      background: "linear-gradient(135deg, rgba(79,70,229,0.04), rgba(99,102,241,0.02))",
      border: `1px solid ${COLORS.blueBorder}`,
    }}>
      <a href="/analyze" style={{ fontSize: "0.75rem", color: COLORS.blue, textDecoration: "none", fontWeight: 600 }}>
        {text} &#8594;
      </a>
    </div>
  );
}
