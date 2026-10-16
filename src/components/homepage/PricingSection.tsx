"use client";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Reveal, SectionHeader } from "./shared";
import { OwnerTodo } from "@/components/OwnerTodo";

// Paid feature lists mirror the in-app upgrade modal (src/app/analyze/page.tsx,
// "Upgrade Modal") so the homepage and checkout promise the same thing.
// Paid plans are one-time Razorpay payments that unlock 30 days
// (src/app/api/payment/route.ts, signEntitlement ttlDays = 30) — no auto-renewal.
// TODO(owner): "PDF upload" is listed in both places but no PDF upload feature
// exists in the codebase yet — ship it or drop it from both lists before launch.
const PLANS = [
  {
    name: "Free", price: "₹0", period: "no payment needed",
    analyses: 5, color: "#34D399", primary: false,
    features: ["DCF fair value", "Geopolitical risk scoring", "AI sentiment analysis"],
    cta: "Start Free",
  },
  {
    name: "Starter", price: "₹199", period: "one-time · 30 days access",
    analyses: 20, color: "#00e5ff", primary: false,
    features: ["Stocks + Commodities + Crypto", "Risk dashboards", "Priority support"],
    cta: "Get Starter",
  },
  {
    name: "Pro", price: "₹499", period: "one-time · 30 days access",
    analyses: 100, color: "#4A9EFF", primary: true,
    features: ["All Starter features", "Commodity heatmaps", "CoinDCX insights", "Supply chain maps"],
    cta: "Get Pro",
  },
  {
    name: "Elite", price: "₹999", period: "one-time · 30 days access",
    analyses: 300, color: "#7c4dff", primary: false,
    features: ["All Pro features", "PDF upload", "Portfolio watchlist", "Dedicated support"],
    cta: "Get Elite",
  },
];

// TODO(owner): decide whether the prices above include GST (and the rate /
// GSTIN if registered), then set the final line here. Until then nothing is
// shown in production and a TODO marker is shown in development.
const GST_NOTE: string | null = null;

export default function PricingSection() {
  return (
    <section id="pricing" style={{
      padding: "120px clamp(20px, 5vw, 80px)",
      position: "relative",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,158,255,0.03), transparent)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <SectionHeader
          label="Pricing"
          title="Start Free."
          titleAccent="Scale When Ready."
          subtitle="Paid plans are a one-time payment that unlocks 30 days of access. No subscription, no auto-renewal. Every plan includes AI-powered analysis."
        />

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16,
        }}>
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 80}>
              <div style={{
                border: plan.primary ? "1px solid rgba(74,158,255,0.25)" : "1px solid rgba(255,255,255,0.04)",
                borderRadius: 24, padding: "32px 24px", position: "relative",
                background: plan.primary ? "rgba(74,158,255,0.04)" : "rgba(255,255,255,0.015)",
                backdropFilter: "blur(20px)",
                boxShadow: plan.primary ? "0 8px 48px rgba(74,158,255,0.1)" : "none",
                transition: "all 0.4s",
              }}
                onMouseEnter={(e) => { if (!plan.primary) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-4px)"; } }}
                onMouseLeave={(e) => { if (!plan.primary) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "none"; } }}
              >
                <div style={{
                  fontSize: "0.7rem", color: plan.color, fontWeight: 700,
                  letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase",
                }}>{plan.name}</div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff" }}>{plan.price}</span>
                </div>
                <div style={{
                  fontSize: "0.78rem", color: "rgba(255,255,255,0.25)",
                  marginBottom: 24,
                }}>{plan.period}</div>

                <div style={{
                  background: `${plan.color}08`, borderRadius: 12,
                  padding: "10px 0", textAlign: "center", marginBottom: 24,
                  border: `1px solid ${plan.color}12`,
                }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: 800, color: plan.color }}>{plan.analyses}</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", marginLeft: 6 }}>analyses/mo</span>
                </div>

                {plan.features.map((f) => (
                  <div key={f} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    fontSize: "0.82rem", color: "rgba(255,255,255,0.45)",
                    marginBottom: 10,
                  }}>
                    <CheckCircle size={14} color={plan.color} /> {f}
                  </div>
                ))}

                <Link href="/analyze" style={{ textDecoration: "none" }}>
                  <button style={{
                    width: "100%", marginTop: 20, padding: "14px 0",
                    borderRadius: 14, fontWeight: 700, fontSize: "0.88rem",
                    cursor: "pointer",
                    background: plan.primary ? "linear-gradient(135deg, #4A9EFF, #4A9EFF)" : "rgba(255,255,255,0.04)",
                    color: "#fff",
                    border: plan.primary ? "none" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: plan.primary ? "0 4px 24px rgba(74,158,255,0.25)" : "none",
                    transition: "all 0.3s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
                  >{plan.cta}</button>
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <p style={{
          marginTop: 28, textAlign: "center",
          fontSize: "0.78rem", color: "rgba(255,255,255,0.35)",
        }}>
          Prices in INR. {GST_NOTE ?? <OwnerTodo>state whether prices include GST</OwnerTodo>}
        </p>
      </div>
    </section>
  );
}
