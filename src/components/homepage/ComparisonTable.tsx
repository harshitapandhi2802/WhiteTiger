"use client";
import { CheckCircle } from "lucide-react";
import { Reveal, SectionHeader } from "./shared";

const ROWS: [string, boolean, boolean, boolean][] = [
  ["AI Research Reports", true, false, false],
  ["8 Asset Classes", true, false, false],
  ["Live Crypto Prices", true, false, false],
  ["Forex & Central Bank Intel", true, false, false],
  ["Geopolitical Risk Scoring", true, false, false],
  ["MCX Oil & Metal Analysis", true, false, false],
  ["Derivatives AI Agent", true, false, false],
  ["8+ Risk Scores Per Asset", true, false, false],
  ["Basic Financials", true, true, true],
];

export default function ComparisonTable() {
  return (
    <section style={{
      padding: "120px clamp(20px, 5vw, 80px)",
      background: "rgba(74,158,255,0.015)",
      borderTop: "1px solid rgba(74,158,255,0.06)",
      borderBottom: "1px solid rgba(74,158,255,0.06)",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <SectionHeader
          label="Why White Tiger"
          title="What Others"
          titleAccent="Don't Show You"
          subtitle="Most platforms stop at P/E ratios and basic charts. We analyze what actually moves markets."
        />

        <Reveal>
          <div style={{
            background: "rgba(255,255,255,0.02)", borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ textAlign: "left", padding: "18px 24px", color: "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: "0.82rem" }}>Feature</th>
                  <th style={{ textAlign: "center", padding: "18px 24px", fontWeight: 800, fontSize: "0.82rem" }}>
                    <span style={{
                      background: "linear-gradient(135deg, #4A9EFF, #7c4dff)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}>White Tiger</span>
                  </th>
                  <th style={{ textAlign: "center", padding: "18px 24px", color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: "0.82rem" }}>Zerodha</th>
                  <th style={{ textAlign: "center", padding: "18px 24px", color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: "0.82rem" }}>Groww</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([feature, ml, z, g], i) => (
                  <tr key={i} style={{
                    borderBottom: i < ROWS.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  }}>
                    <td style={{
                      padding: "14px 24px", color: "rgba(255,255,255,0.55)",
                      fontWeight: 500, fontSize: "0.85rem",
                    }}>{feature}</td>
                    <td style={{ textAlign: "center", padding: "14px 24px" }}>
                      {ml ? <CheckCircle size={16} color="#34D399" /> : <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>}
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 24px" }}>
                      {z ? <CheckCircle size={16} color="rgba(52,211,153,0.4)" /> : <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>}
                    </td>
                    <td style={{ textAlign: "center", padding: "14px 24px" }}>
                      {g ? <CheckCircle size={16} color="rgba(52,211,153,0.4)" /> : <span style={{ color: "rgba(255,255,255,0.1)" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
