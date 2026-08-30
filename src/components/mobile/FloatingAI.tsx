"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, X, TrendingUp, BookOpen, Lightbulb, ChevronRight } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Floating AI Assistant Button
   Premium expandable FAB with quick AI actions
   ══════════════════════════════════════════════════════════════════ */

export default function FloatingAI() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const actions = [
    { icon: <TrendingUp size={18} />, label: "Market Summary", desc: "Today's market overview", color: "#4A9EFF" },
    { icon: <BookOpen size={18} />, label: "Learn", desc: "Explain a concept", color: "#34D399" },
    { icon: <Lightbulb size={18} />, label: "AI Picks", desc: "Top investment ideas", color: "#FBBF24" },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 998,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            animation: "fadeIn 0.2s ease-out",
          }}
        />
      )}

      {/* Action menu */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 100, right: 20,
          zIndex: 999,
          display: "flex", flexDirection: "column", gap: 8,
          animation: "aiMenuIn 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}>
          {actions.map((a, i) => (
            <button
              key={a.label}
              onClick={() => { setOpen(false); router.push("/analyze"); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 18px",
                background: "var(--bg-midnight, #14213D)",
                border: "0.5px solid rgba(232,237,245,0.08)",
                borderRadius: 16,
                cursor: "pointer",
                animation: `aiItemIn 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both`,
                minWidth: 220,
                textAlign: "left",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `${a.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: a.color, flexShrink: 0,
              }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>{a.label}</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>{a.desc}</div>
              </div>
              <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
            </button>
          ))}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 28, right: 20,
          zIndex: 999,
          width: 56, height: 56,
          borderRadius: 18,
          border: "none",
          background: open
            ? "var(--bg-slate, #1F2A44)"
            : "linear-gradient(135deg, #4A9EFF, #1E5FBF)",
          boxShadow: open
            ? "none"
            : "0 8px 32px rgba(74,158,255,0.35), 0 0 0 1px rgba(74,158,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          transform: open ? "rotate(0deg)" : "rotate(0deg)",
        }}
      >
        {open ? (
          <X size={22} color="#fff" />
        ) : (
          <Zap size={22} color="#fff" />
        )}
      </button>

      {/* Bottom nav spacer — push FAB above bottom nav on mobile */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes aiMenuIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aiItemIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 768px) {
          /* Push FAB above bottom navigation */
          button[style*="bottom: 28px"][style*="right: 20px"] {
            bottom: 80px !important;
          }
        }
      `}</style>
    </>
  );
}
