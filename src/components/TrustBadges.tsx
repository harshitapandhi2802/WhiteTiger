"use client";
import React, { useState, useEffect } from "react";
import { Shield, Clock, AlertTriangle, Zap, Brain, Database, Wifi, WifiOff, Activity } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — INSTITUTIONAL TRUST COMPONENTS
   Reusable across ALL tabs for data transparency & credibility
   ═══════════════════════════════════════════════════════════════ */

// ─── DATA SOURCE TYPES ──────────────────────────────────────
export type DataSourceType =
  | "NSE" | "BSE" | "AMFI" | "RBI" | "SEBI" | "RERA" | "NHB"
  | "TradingView" | "Yahoo Finance" | "CoinDCX" | "CoinGecko"
  | "Google Finance" | "MFAPI" | "MCX"
  | "AI Estimate" | "Static" | "Calculated" | "User Input";

export type ConfidenceLevel = "high" | "medium" | "low" | "ai-estimated";
export type MarketSessionStatus = "open" | "pre-market" | "post-market" | "closed" | "holiday" | "delayed";

// ─── GLOBAL DISCLAIMER ──────────────────────────────────────
export function GlobalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
        borderRadius: 8, background: "rgba(251,191,36,0.06)",
        border: "1px solid rgba(251,191,36,0.12)", fontSize: "0.62rem",
        color: "var(--text-muted)", lineHeight: 1.4,
      }}>
        <AlertTriangle size={12} color="#FBBF24" style={{ flexShrink: 0 }} />
        AI-generated analysis. Not financial advice. Consult a SEBI-registered advisor.
      </div>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
      borderRadius: 10, background: "rgba(251,191,36,0.05)",
      border: "1px solid rgba(251,191,36,0.1)", fontSize: "0.72rem",
      color: "var(--text-muted)", lineHeight: 1.6,
    }}>
      <AlertTriangle size={16} color="#FBBF24" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <strong style={{ color: "#FBBF24" }}>Disclaimer:</strong> AI-generated analysis provided for educational and informational purposes only. This does not constitute financial advice, stock recommendations, or investment guidance. Always consult a SEBI-registered investment advisor before making financial decisions. Past performance does not guarantee future results. White Tiger is not a SEBI-registered entity.
      </div>
    </div>
  );
}

// ─── DATA SOURCE BADGE ──────────────────────────────────────
const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "NSE":           { bg: "rgba(52,211,153,0.08)", text: "#34D399", border: "rgba(52,211,153,0.2)" },
  "BSE":           { bg: "rgba(52,211,153,0.08)", text: "#34D399", border: "rgba(52,211,153,0.2)" },
  "AMFI":          { bg: "rgba(74,158,255,0.08)", text: "#4A9EFF", border: "rgba(74,158,255,0.2)" },
  "RBI":           { bg: "rgba(129,140,248,0.08)", text: "#818CF8", border: "rgba(129,140,248,0.2)" },
  "SEBI":          { bg: "rgba(129,140,248,0.08)", text: "#818CF8", border: "rgba(129,140,248,0.2)" },
  "TradingView":   { bg: "rgba(52,211,153,0.08)", text: "#34D399", border: "rgba(52,211,153,0.2)" },
  "Yahoo Finance": { bg: "rgba(74,158,255,0.08)", text: "#4A9EFF", border: "rgba(74,158,255,0.2)" },
  "CoinDCX":       { bg: "rgba(251,146,60,0.08)", text: "#FB923C", border: "rgba(251,146,60,0.2)" },
  "CoinGecko":     { bg: "rgba(251,146,60,0.08)", text: "#FB923C", border: "rgba(251,146,60,0.2)" },
  "AI Estimate":   { bg: "rgba(251,191,36,0.08)", text: "#FBBF24", border: "rgba(251,191,36,0.2)" },
  "Static":        { bg: "rgba(140,153,176,0.08)", text: "#8C99B0", border: "rgba(140,153,176,0.2)" },
  "Calculated":    { bg: "rgba(140,153,176,0.08)", text: "#8C99B0", border: "rgba(140,153,176,0.2)" },
};

export function DataSourceBadge({ source, size = "sm" }: { source: DataSourceType; size?: "xs" | "sm" | "md" }) {
  const c = SOURCE_COLORS[source] || SOURCE_COLORS["Static"];
  const icon = source === "AI Estimate" ? <Brain size={size === "xs" ? 9 : 11} /> :
    source === "Static" ? <Database size={size === "xs" ? 9 : 11} /> :
    <Zap size={size === "xs" ? 9 : 11} />;
  const fontSize = size === "xs" ? "0.55rem" : size === "sm" ? "0.62rem" : "0.72rem";
  const padding = size === "xs" ? "1px 6px" : size === "sm" ? "2px 8px" : "3px 10px";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding, borderRadius: 6,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {icon} {source}
    </span>
  );
}

// ─── TIMESTAMP BADGE ────────────────────────────────────────
export function TimestampBadge({
  timestamp, label = "Data as of", showRelative = true
}: { timestamp: number | string | null; label?: string; showRelative?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(t); }, []);

  if (!timestamp) return null;
  const ts = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
  if (isNaN(ts)) return null;

  const diff = now - ts;
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);

  let relative = "";
  if (secs < 10) relative = "just now";
  else if (secs < 60) relative = `${secs}s ago`;
  else if (mins < 60) relative = `${mins}m ago`;
  else if (hrs < 24) relative = `${hrs}h ago`;
  else relative = `${Math.floor(hrs / 24)}d ago`;

  const isStale = mins > 5;
  const dateStr = new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: "0.6rem", fontWeight: 600,
      color: isStale ? "#FBBF24" : "var(--text-muted)",
    }}>
      <Clock size={10} />
      {label} {dateStr}
      {showRelative && <span style={{ opacity: 0.7 }}>({relative})</span>}
      {isStale && <AlertTriangle size={10} color="#FBBF24" />}
    </span>
  );
}

// ─── CONFIDENCE CHIP ────────────────────────────────────────
export function ConfidenceChip({ level, showLabel = true }: { level: ConfidenceLevel; showLabel?: boolean }) {
  const config: Record<ConfidenceLevel, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    "high":         { color: "#34D399", bg: "rgba(52,211,153,0.08)", label: "High Confidence",     icon: <Shield size={11} /> },
    "medium":       { color: "#4A9EFF", bg: "rgba(74,158,255,0.08)", label: "Medium Confidence",   icon: <Activity size={11} /> },
    "low":          { color: "#FBBF24", bg: "rgba(251,191,36,0.08)", label: "Low Confidence",      icon: <AlertTriangle size={11} /> },
    "ai-estimated": { color: "#818CF8", bg: "rgba(129,140,248,0.08)", label: "AI Estimated",       icon: <Brain size={11} /> },
  };
  const c = config[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
      borderRadius: 6, background: c.bg, color: c.color,
      fontSize: "0.6rem", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {c.icon} {showLabel && c.label}
    </span>
  );
}

// ─── MARKET STATUS INDICATOR ────────────────────────────────
export function MarketStatusIndicator({ status, exchange = "NSE" }: { status?: MarketSessionStatus; exchange?: string }) {
  const [autoStatus, setAutoStatus] = useState<MarketSessionStatus>("closed");

  useEffect(() => {
    function computeStatus(): MarketSessionStatus {
      const now = new Date();
      const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const day = ist.getDay();
      const hours = ist.getHours();
      const mins = ist.getMinutes();
      const time = hours * 60 + mins;

      if (day === 0 || day === 6) return "closed";
      if (time >= 555 && time < 570) return "pre-market"; // 9:15-9:30
      if (time >= 570 && time < 930) return "open";       // 9:30-15:30
      if (time >= 930 && time < 960) return "post-market"; // 15:30-16:00
      return "closed";
    }
    setAutoStatus(computeStatus());
    const t = setInterval(() => setAutoStatus(computeStatus()), 60000);
    return () => clearInterval(t);
  }, []);

  const s = status || autoStatus;
  const config: Record<MarketSessionStatus, { color: string; bg: string; label: string; pulse: boolean }> = {
    "open":        { color: "#34D399", bg: "rgba(52,211,153,0.08)", label: `${exchange} Market Open`, pulse: true },
    "pre-market":  { color: "#FBBF24", bg: "rgba(251,191,36,0.08)", label: `${exchange} Pre-Market`, pulse: true },
    "post-market": { color: "#FB923C", bg: "rgba(251,146,60,0.08)", label: `${exchange} Post-Market`, pulse: false },
    "closed":      { color: "#8C99B0", bg: "rgba(140,153,176,0.08)", label: `${exchange} Closed — Last Close`, pulse: false },
    "holiday":     { color: "#8C99B0", bg: "rgba(140,153,176,0.08)", label: `${exchange} Holiday — Last Close`, pulse: false },
    "delayed":     { color: "#FBBF24", bg: "rgba(251,191,36,0.08)", label: "Delayed Data", pulse: false },
  };
  const c = config[s];

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
      borderRadius: 20, background: c.bg, fontSize: "0.65rem", fontWeight: 700, color: c.color,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: c.color,
        boxShadow: c.pulse ? `0 0 6px ${c.color}` : "none",
        animation: c.pulse ? "wtPulse 2s infinite" : "none",
      }} />
      {c.label}
    </div>
  );
}

// ─── STALE DATA WARNING ─────────────────────────────────────
export function StaleDataWarning({ lastUpdated, thresholdMs = 300000 }: { lastUpdated: number; thresholdMs?: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);

  const diff = now - lastUpdated;
  if (diff < thresholdMs) return null;

  const mins = Math.floor(diff / 60000);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
      borderRadius: 10, background: "rgba(248,113,113,0.06)",
      border: "1px solid rgba(248,113,113,0.15)", fontSize: "0.72rem",
      color: "#F87171", fontWeight: 600,
    }}>
      <WifiOff size={14} />
      Data may be stale ({mins}m since last update). Refresh or check your connection.
    </div>
  );
}

// ─── DATA TYPE SEPARATOR ────────────────────────────────────
export function DataTypeLabel({ type }: { type: "live" | "static" | "ai" }) {
  const config = {
    live:   { color: "#34D399", bg: "rgba(52,211,153,0.06)", label: "LIVE DATA", icon: <Wifi size={10} /> },
    static: { color: "#8C99B0", bg: "rgba(140,153,176,0.06)", label: "STATIC DATA", icon: <Database size={10} /> },
    ai:     { color: "#818CF8", bg: "rgba(129,140,248,0.06)", label: "AI INSIGHT", icon: <Brain size={10} /> },
  };
  const c = config[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
      borderRadius: 4, background: c.bg, color: c.color,
      fontSize: "0.55rem", fontWeight: 800, letterSpacing: "0.06em",
    }}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── TRUST FOOTER (for bottom of each tab) ──────────────────
export function TrustFooter({ sources, lastUpdated }: { sources: DataSourceType[]; lastUpdated?: number }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10, marginTop: 24,
      padding: "16px 20px", borderRadius: 12,
      background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Data Sources:</span>
        {sources.map(s => <DataSourceBadge key={s} source={s} size="xs" />)}
      </div>
      {lastUpdated && <TimestampBadge timestamp={lastUpdated} />}
      <GlobalDisclaimer compact />
    </div>
  );
}
