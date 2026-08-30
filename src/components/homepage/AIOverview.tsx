"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BarChart3, Globe, Shield, Zap, Building2,
  Landmark, ArrowRight,
} from "lucide-react";
import { Reveal, SectionHeader } from "./shared";

const FEATURES = [
  {
    icon: <BarChart3 size={26} />, color: "#4A9EFF",
    title: "Stock Intelligence",
    desc: "3,100+ NSE stocks with DCF valuation, geopolitical scoring, supply chain mapping & AI-driven entry zones.",
    metrics: ["DCF Fair Value", "8+ Risk Scores", "AI Sentiment"],
  },
  {
    icon: <Zap size={26} />, color: "#7c4dff",
    title: "Crypto Analytics",
    desc: "40+ tokens with live prices, tokenomics deep-dives, on-chain analytics & INR trading strategies.",
    metrics: ["Live Prices", "On-chain Data", "DeFi Scores"],
  },
  {
    icon: <Globe size={26} />, color: "#00e5ff",
    title: "Forex Intelligence",
    desc: "30+ currency pairs with RBI policy analysis, carry trade scoring & central bank divergence tracking.",
    metrics: ["RBI Intel", "Carry Trade", "Flow Analysis"],
  },
  {
    icon: <Building2 size={26} />, color: "#34D399",
    title: "Real Estate AI",
    desc: "Global property intelligence across 9 countries with city-level growth signals, yield heatmaps & affordability analysis.",
    metrics: ["City Heatmaps", "Yield Data", "Growth Signals"],
  },
  {
    icon: <Landmark size={26} />, color: "#FBBF24",
    title: "Bonds & Debt",
    desc: "Government securities, corporate bonds & fixed-income instruments with yield curve analysis and credit ratings.",
    metrics: ["Yield Curves", "Credit Risk", "Duration"],
  },
  {
    icon: <Shield size={26} />, color: "#4A9EFF",
    title: "Derivatives Agent",
    desc: "AI quant analysis for F&O with option chain intelligence, volatility heatmaps & IV percentile tracking.",
    metrics: ["Option Chain", "IV Analysis", "Strategy AI"],
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Reveal delay={index * 60}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: "36px 32px", borderRadius: 24,
          background: hovered
            ? `linear-gradient(135deg, ${feature.color}08, ${feature.color}04)`
            : "rgba(255,255,255,0.02)",
          border: `1px solid ${hovered ? feature.color + "20" : "rgba(255,255,255,0.04)"}`,
          backdropFilter: "blur(20px)",
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          transform: hovered ? "translateY(-6px)" : "none",
          cursor: "default",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow effect on hover */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 120, height: 120, borderRadius: "50%",
          background: `radial-gradient(circle, ${feature.color}10, transparent)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.5s",
          pointerEvents: "none",
        }} />

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `${feature.color}10`,
          border: `1px solid ${feature.color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24, color: feature.color,
          transition: "all 0.4s",
          transform: hovered ? "scale(1.05)" : "none",
        }}>
          {feature.icon}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: "1.15rem", fontWeight: 700, color: "#fff",
          marginBottom: 12, letterSpacing: "-0.02em",
        }}>{feature.title}</h3>

        {/* Description */}
        <p style={{
          fontSize: "0.88rem", color: "rgba(255,255,255,0.4)",
          lineHeight: 1.75, marginBottom: 20,
        }}>{feature.desc}</p>

        {/* Metric pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {feature.metrics.map((m) => (
            <span key={m} style={{
              padding: "4px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.7rem", fontWeight: 600,
              color: "rgba(255,255,255,0.35)",
            }}>{m}</span>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export default function AIOverview() {
  return (
    <section id="features" style={{
      padding: "120px clamp(20px, 5vw, 80px)",
      position: "relative",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,158,255,0.04), transparent 60%)",
        pointerEvents: "none", filter: "blur(60px)",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <SectionHeader
          label="AI Platform"
          title="Eight Asset Classes."
          titleAccent="One Intelligence Layer."
          subtitle="Every market, every asset, every signal — analyzed by institutional-grade AI and delivered in seconds."
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>

        {/* CTA */}
        <Reveal delay={200}>
          <div style={{ textAlign: "center", marginTop: 64 }}>
            <Link href="/analyze">
              <button style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "14px 36px",
                fontWeight: 600, fontSize: "0.92rem",
                cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 10,
                transition: "all 0.4s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,158,255,0.1)"; e.currentTarget.style.borderColor = "rgba(74,158,255,0.2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                Explore All Features <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
