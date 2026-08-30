"use client";
import { useState } from "react";
import {
  TrendingUp, Bitcoin, DollarSign, Building2, PiggyBank,
  Shield, Layers, Flame, Globe,
  ChevronLeft, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Mobile Markets Tab
   Clean scrollable list of all market categories
   ══════════════════════════════════════════════════════════════════ */

type MainTab = "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international" | "derivatives" | "realestate";

const MARKETS: { id: MainTab; icon: React.ReactNode; label: string; desc: string; color: string }[] = [
  { id: "stocks", icon: <TrendingUp size={22} />, label: "Stocks", desc: "NSE · 3,000+ stocks", color: "#4A9EFF" },
  { id: "crypto", icon: <Bitcoin size={22} />, label: "Crypto", desc: "BTC · ETH · 100+ coins", color: "#f7931a" },
  { id: "currency", icon: <DollarSign size={22} />, label: "Forex", desc: "USD/INR · 50+ pairs", color: "#34D399" },
  { id: "commodities", icon: <Flame size={22} />, label: "Commodities", desc: "Gold · Oil · Metals", color: "#FBBF24" },
  { id: "mutualfunds", icon: <PiggyBank size={22} />, label: "Mutual Funds", desc: "500+ funds · SIP ready", color: "#a78bfa" },
  { id: "debt", icon: <Shield size={22} />, label: "Bonds", desc: "G-Sec · Corporate · Tax-free", color: "#14b8a6" },
  { id: "international", icon: <Globe size={22} />, label: "Global Markets", desc: "S&P 500 · NASDAQ · DAX", color: "#818cf8" },
  { id: "realestate", icon: <Building2 size={22} />, label: "Real Estate", desc: "Cities · REITs · Trends", color: "#C5A572" },
  { id: "derivatives", icon: <Layers size={22} />, label: "F&O", desc: "Options · Futures · IV", color: "#F87171" },
];

export default function MobileMarkets({
  onTabSelect,
  onBack,
}: {
  onTabSelect: (tab: MainTab) => void;
  onBack: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-obsidian, #0A0E1A)",
      paddingBottom: 90,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--bg-obsidian, #0A0E1A)",
        borderBottom: "0.5px solid rgba(232,237,245,0.04)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", padding: 4,
        }}>
          <ChevronLeft size={22} />
        </button>
        <h1 style={{
          fontSize: "1.1rem", fontWeight: 800, color: "#fff",
          margin: 0, letterSpacing: "-0.02em",
        }}>
          Markets
        </h1>
      </div>

      {/* Market list */}
      <div style={{ padding: "8px 20px" }}>
        {MARKETS.map((market, i) => (
          <button
            key={market.id}
            onClick={() => onTabSelect(market.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              width: "100%", padding: "16px 0",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: i < MARKETS.length - 1 ? "0.5px solid rgba(232,237,245,0.04)" : "none",
              textAlign: "left",
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${market.color}10`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: market.color, flexShrink: 0,
            }}>
              {market.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: "0.92rem", fontWeight: 700, color: "#fff",
                marginBottom: 2,
              }}>
                {market.label}
              </div>
              <div style={{
                fontSize: "0.72rem", color: "rgba(255,255,255,0.3)",
                fontWeight: 500,
              }}>
                {market.desc}
              </div>
            </div>
            <ArrowUpRight size={16} color="rgba(255,255,255,0.15)" />
          </button>
        ))}
      </div>
    </div>
  );
}
