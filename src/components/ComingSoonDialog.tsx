"use client";
import { Clock, X } from "lucide-react";
import { COMING_SOON_SECTIONS } from "@/lib/comingSoon";

/* Shown when someone opens a section that isn't launched yet. */
export function ComingSoonDialog({ section, onClose }: { section: string | null; onClose: () => void }) {
  if (!section) return null;
  const info = COMING_SOON_SECTIONS[section];
  if (!info) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="wt-coming-soon-title" onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,14,26,0.78)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "relative", width: "100%", maxWidth: 380, textAlign: "center",
        background: "#161B2E", border: "1px solid rgba(232,237,245,0.1)", borderRadius: 18,
        padding: "30px 26px 24px", color: "#E8ECF4", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: 12, right: 12, background: "transparent", border: "none",
          color: "#8C99B0", cursor: "pointer", padding: 4,
        }}><X size={18} /></button>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
          background: "rgba(74,158,255,0.12)", color: "#4A9EFF",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Clock size={24} /></div>
        <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.12em", color: "#4A9EFF", textTransform: "uppercase", marginBottom: 6 }}>
          Coming soon
        </div>
        <h2 id="wt-coming-soon-title" style={{ fontSize: "1.25rem", fontWeight: 900, margin: "0 0 8px" }}>{info.label}</h2>
        <p style={{ fontSize: "0.82rem", color: "#8C99B0", lineHeight: 1.55, margin: "0 0 20px" }}>
          {`${info.blurb} We're still checking the data for this section, so it isn't open yet.`}
        </p>
        <button onClick={onClose} style={{
          width: "100%", padding: "11px 16px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "#4A9EFF", color: "#fff", fontWeight: 800, fontSize: "0.86rem",
        }}>Got it</button>
      </div>
    </div>
  );
}

/* Small "Soon" pill for menus and cards. */
export function SoonBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span style={{
      display: "inline-block", fontSize: compact ? "0.5rem" : "0.56rem", fontWeight: 800,
      letterSpacing: "0.06em", textTransform: "uppercase", padding: compact ? "1px 5px" : "2px 7px",
      borderRadius: 99, background: "rgba(74,158,255,0.14)", color: "#4A9EFF",
      border: "1px solid rgba(74,158,255,0.3)", whiteSpace: "nowrap",
    }}>{compact ? "Soon" : "Coming soon"}</span>
  );
}
