"use client";
// ═══════════════════════════════════════════════════════════════════════════
// DATA HEALTH COMPONENTS
// Visual indicators for data source, staleness, and system health.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { useDataHealth } from "@/hooks/useMarketData";
import { getSourceColor, getSourceLabel } from "@/hooks/useMarketData";

/** Inline badge showing data source and freshness */
export function DataSourceBadge({
  source,
  isStale,
  lastUpdated,
  compact = false,
}: {
  source: string;
  isStale: boolean;
  lastUpdated: number;
  compact?: boolean;
}) {
  const color = getSourceColor(source);
  const label = getSourceLabel(source);
  const age = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : 0;
  const ageStr = age < 60 ? `${age}s ago` : age < 3600 ? `${Math.floor(age / 60)}m ago` : `${Math.floor(age / 3600)}h ago`;

  if (compact) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: "0.55rem", color: isStale ? "#f97316" : "#64748b",
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: isStale ? "#f97316" : color }} />
        {label}
      </span>
    );
  }

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 6,
      background: isStale ? "#451a0320" : `${color}15`,
      border: `1px solid ${isStale ? "#f9731630" : `${color}30`}`,
      fontSize: "0.6rem", color: isStale ? "#f97316" : color,
      fontWeight: 600,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isStale ? "#f97316" : color,
        boxShadow: isStale ? "none" : `0 0 6px ${color}60`,
        animation: isStale ? "none" : "pulse 2s infinite",
      }} />
      {label}
      {lastUpdated > 0 && (
        <span style={{ opacity: 0.7, fontWeight: 400 }}>{ageStr}</span>
      )}
      {isStale && <span style={{ fontWeight: 400 }}>STALE</span>}
    </div>
  );
}

/** Floating health monitor (expandable) */
export function DataHealthMonitor() {
  const [expanded, setExpanded] = useState(false);
  const health = useDataHealth();
  const types = Object.keys(health);

  const overallStatus = types.some(t => health[t].status === "offline")
    ? "degraded"
    : types.every(t => health[t].status === "healthy")
    ? "healthy"
    : "degraded";

  const statusColor = overallStatus === "healthy" ? "#10b981" : overallStatus === "degraded" ? "#f59e0b" : "#ef4444";

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 9000,
          width: 36, height: 36, borderRadius: "50%",
          background: "#0f172a", border: `2px solid ${statusColor}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 12px ${statusColor}40`,
          transition: "all 0.2s",
        }}
        title="Data Health Monitor"
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor }} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 9000,
      width: 320, borderRadius: 12, background: "#0f172a",
      border: "1px solid #1e293b", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid #1e293b",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, boxShadow: `0 0 8px ${statusColor}60` }} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f8fafc" }}>Data Health</span>
          <span style={{
            fontSize: "0.55rem", fontWeight: 600, padding: "2px 6px", borderRadius: 4,
            background: `${statusColor}20`, color: statusColor, textTransform: "uppercase",
          }}>{overallStatus}</span>
        </div>
        <button onClick={() => setExpanded(false)} style={{
          background: "none", border: "none", color: "#64748b", cursor: "pointer",
          fontSize: "0.75rem", padding: 2,
        }}>✕</button>
      </div>

      {/* Feed Status */}
      <div style={{ padding: "8px 14px", maxHeight: 300, overflowY: "auto" }}>
        {types.map(type => {
          const h = health[type];
          const sc = h.status === "healthy" ? "#10b981" : h.status === "degraded" ? "#f59e0b" : "#ef4444";
          const age = h.lastUpdate ? Math.floor((Date.now() - h.lastUpdate) / 1000) : 0;
          return (
            <div key={type} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 0", borderBottom: "1px solid #1e293b20",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#f8fafc", textTransform: "capitalize" }}>{type}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.55rem", color: "#64748b" }}>
                  {h.source !== "none" ? getSourceLabel(h.source) : "—"}
                </span>
                {h.latencyMs > 0 && (
                  <span style={{ fontSize: "0.5rem", color: h.latencyMs > 3000 ? "#f97316" : "#64748b" }}>
                    {h.latencyMs}ms
                  </span>
                )}
                {h.errorCount > 0 && (
                  <span style={{ fontSize: "0.5rem", color: "#ef4444", fontWeight: 600 }}>
                    {h.errorCount} err
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: "6px 14px", borderTop: "1px solid #1e293b",
        fontSize: "0.5rem", color: "#475569", textAlign: "center",
      }}>
        Auto-refreshing · NSE · CoinDCX · Yahoo Finance · Google Finance
      </div>
    </div>
  );
}

/** Loading skeleton for price cards */
export function PriceSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          padding: "16px", borderRadius: 12,
          background: "var(--card-bg, #fff)",
          border: "1px solid var(--border, #e2e8f0)",
        }}>
          <div style={{
            width: "60%", height: 12, borderRadius: 4,
            background: "linear-gradient(90deg, #e2e8f020, #e2e8f040, #e2e8f020)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            marginBottom: 8,
          }} />
          <div style={{
            width: "40%", height: 20, borderRadius: 4,
            background: "linear-gradient(90deg, #e2e8f020, #e2e8f040, #e2e8f020)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            marginBottom: 4,
          }} />
          <div style={{
            width: "30%", height: 10, borderRadius: 4,
            background: "linear-gradient(90deg, #e2e8f020, #e2e8f040, #e2e8f020)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }} />
        </div>
      ))}
    </div>
  );
}

/** Error state with retry button */
export function DataError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      padding: "20px 24px", borderRadius: 12, textAlign: "center",
      background: "#fef2f220", border: "1px solid #fecaca40",
    }}>
      <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>{"⚠️"}</div>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>
        Data Unavailable
      </div>
      <div style={{ fontSize: "0.68rem", color: "#64748b", marginBottom: 12 }}>
        {message}
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          padding: "6px 16px", borderRadius: 8, border: "1px solid #ef4444",
          background: "transparent", color: "#ef4444", fontSize: "0.7rem",
          fontWeight: 600, cursor: "pointer",
        }}>
          Retry
        </button>
      )}
    </div>
  );
}
