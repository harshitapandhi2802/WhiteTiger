"use client";
import { Home, BarChart3, Zap, Search, User } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Clean Bottom Navigation
   Apple-style minimal tab bar
   ══════════════════════════════════════════════════════════════════ */

type MobileView = "home" | "markets" | "ai" | "search" | "profile";

export default function BottomNav({
  active,
  onChange,
}: {
  active: MobileView;
  onChange: (view: MobileView) => void;
}) {
  const tabs: { id: MobileView; icon: React.ReactNode; label: string }[] = [
    { id: "home", icon: <Home size={20} strokeWidth={active === "home" ? 2.5 : 1.8} />, label: "Home" },
    { id: "markets", icon: <BarChart3 size={20} strokeWidth={active === "markets" ? 2.5 : 1.8} />, label: "Markets" },
    { id: "ai", icon: <Zap size={20} strokeWidth={active === "ai" ? 2.5 : 1.8} />, label: "AI" },
    { id: "search", icon: <Search size={20} strokeWidth={active === "search" ? 2.5 : 1.8} />, label: "Search" },
    { id: "profile", icon: <User size={20} strokeWidth={active === "profile" ? 2.5 : 1.8} />, label: "Profile" },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(10,14,26,0.92)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderTop: "0.5px solid rgba(232,237,245,0.06)",
      padding: "6px 0 env(safe-area-inset-bottom, 8px)",
      display: "flex", justifyContent: "space-around",
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 0", minWidth: 56,
              color: isActive ? "#4A9EFF" : "rgba(255,255,255,0.3)",
              transition: "color 0.2s",
              position: "relative",
            }}
          >
            {/* Active dot */}
            {isActive && (
              <div style={{
                position: "absolute", top: 0,
                width: 4, height: 4, borderRadius: "50%",
                background: "#4A9EFF",
              }} />
            )}
            {tab.icon}
            <span style={{
              fontSize: "0.58rem",
              fontWeight: isActive ? 700 : 500,
              letterSpacing: "0.01em",
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
