"use client";
import { useState } from "react";
import { Reveal, SectionHeader } from "./shared";

const NEWS_ITEMS = [
  {
    category: "RBI Policy",
    title: "RBI holds repo rate at 6.5% — dovish stance signals future cuts",
    impact: "Bullish",
    color: "#34D399",
    aiExplain: "Lower interest rates make borrowing cheaper, boosting corporate earnings and equity markets.",
    time: "2h ago",
  },
  {
    category: "SEBI Update",
    title: "SEBI tightens F&O lot size rules — retail participation impact",
    impact: "Neutral",
    color: "#FBBF24",
    aiExplain: "Larger lot sizes reduce retail speculation but improve market stability and institutional confidence.",
    time: "4h ago",
  },
  {
    category: "Macro Signal",
    title: "US Fed signals rate pause — dollar weakens against emerging currencies",
    impact: "Bullish",
    color: "#34D399",
    aiExplain: "Weaker dollar means FII flows into Indian markets increase, supporting Nifty and mid-cap stocks.",
    time: "6h ago",
  },
  {
    category: "Earnings",
    title: "HDFC Bank Q4 results beat estimates — NII up 24% YoY",
    impact: "Bullish",
    color: "#34D399",
    aiExplain: "Strong NII growth indicates healthy lending margins. Banking sector outlook remains positive.",
    time: "8h ago",
  },
  {
    category: "Geopolitical",
    title: "India-UAE trade corridor expansion — $100B bilateral target by 2030",
    impact: "Bullish",
    color: "#34D399",
    aiExplain: "Enhanced trade corridors benefit logistics, infrastructure and export-oriented companies.",
    time: "12h ago",
  },
  {
    category: "FII Flows",
    title: "FIIs turn net buyers — ₹4,200 Cr inflow in equity markets this week",
    impact: "Bullish",
    color: "#34D399",
    aiExplain: "Sustained FII buying supports market momentum and indicates confidence in Indian growth story.",
    time: "1d ago",
  },
];

function NewsCard({ item, index }: { item: typeof NEWS_ITEMS[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Reveal delay={index * 60}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "24px 24px", borderRadius: 20,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(74,158,255,0.12)"; e.currentTarget.style.background = "rgba(74,158,255,0.03)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              padding: "4px 10px", borderRadius: 6,
              background: "rgba(74,158,255,0.08)",
              fontSize: "0.62rem", fontWeight: 700,
              color: "#4A9EFF", textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>{item.category}</span>
            <span style={{
              padding: "4px 10px", borderRadius: 6,
              background: `${item.color}10`,
              fontSize: "0.62rem", fontWeight: 700,
              color: item.color,
            }}>{item.impact}</span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)" }}>{item.time}</span>
        </div>

        <h4 style={{
          fontSize: "0.92rem", fontWeight: 700, color: "rgba(255,255,255,0.8)",
          lineHeight: 1.5, marginBottom: expanded ? 14 : 0,
        }}>{item.title}</h4>

        {/* AI Explanation */}
        <div style={{
          maxHeight: expanded ? 80 : 0, overflow: "hidden",
          transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{
            padding: "12px 14px", borderRadius: 12,
            background: "rgba(74,158,255,0.04)",
            border: "1px solid rgba(74,158,255,0.08)",
          }}>
            <div style={{
              fontSize: "0.62rem", fontWeight: 700, color: "#4A9EFF",
              marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>AI Insight</div>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              {item.aiExplain}
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export default function MarketNewsWall() {
  return (
    <section id="intelligence" style={{
      padding: "120px clamp(20px, 5vw, 80px)",
      position: "relative",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader
          label="Market Intelligence"
          title="AI-Curated News"
          titleAccent="& Signal Feed"
          subtitle="RBI policy, SEBI updates, macro signals, earnings, FII flows & geopolitical alerts — simplified by AI."
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: 16,
        }}>
          {NEWS_ITEMS.map((item, i) => (
            <NewsCard key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
