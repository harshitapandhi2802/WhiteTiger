"use client";
import React from "react";
import {
  TrendingUp, PieChart, Bitcoin, DollarSign, Layers, Flame,
  GitBranch, Building2, Globe, Sparkles, LogIn,
} from "lucide-react";
import type { WtUser } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — SECTION LANDING GRID
   Replaces the "drop straight into Stocks" default with a clean
   one-glance dashboard of every section. Reduces cognitive load
   for first-time users and creates a natural gating point for
   sign-in / sign-up.
   ═══════════════════════════════════════════════════════════════ */

export type SectionId =
  | "stocks" | "mutualfunds" | "crypto" | "currency" | "debt"
  | "commodities" | "derivatives" | "realestate"
  | "international";

export interface SectionDef {
  id: SectionId;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  highlights: string[];
}

export const SECTIONS: SectionDef[] = [
  { id: "stocks", label: "Stocks", color: "#4A9EFF", icon: <TrendingUp size={22} />,
    tagline: "Live NSE/BSE prices + institutional AI reports + Business Intelligence Suite",
    highlights: ["722 NSE stocks", "Live price grounded AI", "5-tab BI Suite"] },
  { id: "mutualfunds", label: "Mutual Funds", color: "#34D399", icon: <PieChart size={22} />,
    tagline: "All ~14,000 AMFI schemes, live NAVs, calculators, compare and peer rank",
    highlights: ["Live AMFI NAVs", "SIP / Lumpsum / SWP", "Fund vs benchmark"] },
  { id: "crypto", label: "Crypto", color: "#FB923C", icon: <Bitcoin size={22} />,
    tagline: "Live prices from CoinDCX + CoinGecko, AI thesis per coin",
    highlights: ["20s live refresh", "Macro & on-chain context", "INR + USD"] },
  { id: "currency", label: "Forex", color: "#22D3EE", icon: <DollarSign size={22} />,
    tagline: "Live rates, RBI-aware FX intelligence, carry & DXY signals",
    highlights: ["Live rates", "RBI policy lens", "Carry & DXY"] },
  { id: "debt", label: "Bonds", color: "#A78BFA", icon: <Layers size={22} />,
    tagline: "Live India 10Y G-Sec anchor + AI debt analysis",
    highlights: ["Live G-Sec curve", "Yield-to-maturity", "Credit lens"] },
  { id: "commodities", label: "Commodities", color: "#FBBF24", icon: <Flame size={22} />,
    tagline: "MCX + global crude/gold/copper with geopolitical overlays",
    highlights: ["Live MCX & global", "Geopolitical lens", "Supply-chain reads"] },
  { id: "derivatives", label: "Derivatives", color: "#F472B6", icon: <GitBranch size={22} />,
    tagline: "Option chain, Greeks, PCR — futures across India + global",
    highlights: ["Live option chain", "Greeks & IV", "F&O strategies"] },
  { id: "realestate", label: "Real Estate", color: "#10b981", icon: <Building2 size={22} />,
    tagline: "India state → city → locality intelligence, mortgages linked to G-Sec",
    highlights: ["17 states · 40+ cities", "Live mortgage anchor", "REITs & RE stocks"] },
  { id: "international", label: "Global Markets", color: "#818CF8", icon: <Globe size={22} />,
    tagline: "25 world markets by market cap — indices + top stocks per country",
    highlights: ["25 countries", "Top stocks per index", "Cross-asset macro"] },
];

const C = {
  bg: "transparent", card: "var(--bg-midnight, #161B2E)", soft: "rgba(255,255,255,0.02)",
  border: "var(--border, rgba(232,237,245,0.08))", text: "var(--text-primary, #E8ECF4)",
  muted: "var(--text-muted, #8C99B0)", dim: "rgba(232,237,245,0.4)",
};

export function SectionLandingGrid({ onPick, user }: { onPick: (id: SectionId) => void; user: WtUser | null }) {
  return (
    <div style={{ padding: "20px 16px 40px", maxWidth: 1240, margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "rgba(74,158,255,0.08)", border: "1px solid rgba(74,158,255,0.18)", fontSize: "0.66rem", fontWeight: 700, color: "#4A9EFF", marginBottom: 14 }}>
          <Sparkles size={11} /> AI-powered cross-asset intelligence
        </div>
        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, color: C.text, letterSpacing: "-0.025em", margin: "0 0 10px" }}>
          {user?.name ? `Welcome back, ${user.name.split(" ")[0]}.` : "What do you want to analyze today?"}
        </h1>
        <p style={{ fontSize: "0.92rem", color: C.muted, margin: 0, maxWidth: 620, marginInline: "auto", lineHeight: 1.55 }}>
          Pick a market. Every section runs the same depth of AI analysis — grounded in live prices, with provenance on every number.
        </p>
        {!user && (
          <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.7rem", color: C.muted }}>
            <LogIn size={12} /> Sign in opens up every section — takes 5 seconds.
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 14,
      }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className="card card-interactive"
            style={{
              textAlign: "left", padding: "20px 18px", borderRadius: 14,
              background: C.card, border: `1px solid ${C.border}`, color: C.text,
              cursor: "pointer", position: "relative", overflow: "hidden",
            }}
          >
            {/* Accent rail */}
            <div aria-hidden="true" style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${s.color}, transparent)`,
            }} />
            {/* Icon + label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${s.color}1A`, color: s.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>{s.label}</div>
                <div style={{ fontSize: "0.62rem", color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Explore
                </div>
              </div>
            </div>
            {/* Tagline */}
            <p style={{ fontSize: "0.72rem", color: C.muted, lineHeight: 1.5, margin: "0 0 12px", minHeight: 32 }}>
              {s.tagline}
            </p>
            {/* Highlights */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {s.highlights.map(h => (
                <span key={h} style={{
                  fontSize: "0.58rem", fontWeight: 700, padding: "3px 8px",
                  borderRadius: 5, background: C.soft, color: C.dim,
                  border: `1px solid ${C.border}`,
                }}>
                  {h}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Footnote */}
      <div style={{
        marginTop: 28, padding: "14px 18px", borderRadius: 12,
        background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
        fontSize: "0.7rem", color: C.muted, lineHeight: 1.55, textAlign: "center",
      }}>
        Educational research only — not investment advice. Live data wherever a source exists; clearly labelled when it doesn&apos;t.
      </div>
    </div>
  );
}

export default SectionLandingGrid;
