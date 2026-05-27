"use client";
import { Reveal, SectionHeader } from "./shared";

/* ── Mini Volatility Heatmap ── */
function VolHeatmap() {
  const rows = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "INFY"];
  const cols = ["1W", "2W", "1M", "3M", "6M"];
  const data = [
    [18, 22, 25, 20, 16],
    [24, 28, 32, 26, 20],
    [14, 18, 20, 16, 12],
    [12, 15, 18, 14, 11],
    [16, 20, 24, 19, 15],
  ];

  const heatColor = (v: number) => {
    if (v < 15) return "rgba(52,211,153,0.15)";
    if (v < 22) return "rgba(255,171,64,0.15)";
    return "rgba(255,82,82,0.15)";
  };
  const textColor = (v: number) => {
    if (v < 15) return "#34D399";
    if (v < 22) return "#FBBF24";
    return "#F87171";
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.04)", padding: 24,
      overflow: "hidden",
    }}>
      <div style={{
        fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)",
        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
      }}>IV Percentile Heatmap</div>

      <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", gap: 4 }}>
        {/* Header */}
        <div />
        {cols.map((c) => (
          <div key={c} style={{
            textAlign: "center", fontSize: "0.6rem", fontWeight: 600,
            color: "rgba(255,255,255,0.25)", padding: "6px 0",
          }}>{c}</div>
        ))}
        {/* Rows */}
        {rows.map((r, ri) => (
          <>
            <div key={`l-${r}`} style={{
              fontSize: "0.68rem", fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              display: "flex", alignItems: "center",
            }}>{r}</div>
            {data[ri].map((v, ci) => (
              <div key={`${ri}-${ci}`} style={{
                textAlign: "center", padding: "8px 4px",
                borderRadius: 8, fontSize: "0.7rem", fontWeight: 700,
                background: heatColor(v), color: textColor(v),
              }}>{v}%</div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}

/* ── Option Chain Preview ── */
function OptionChainPreview() {
  const strikes = [
    { strike: 23600, callOI: "12.4L", callVol: "8.2L", putOI: "8.1L", putVol: "5.6L", pcr: 0.65 },
    { strike: 23650, callOI: "15.8L", callVol: "10.1L", putOI: "11.2L", putVol: "7.3L", pcr: 0.71 },
    { strike: 23700, callOI: "22.3L", callVol: "14.5L", putOI: "18.6L", putVol: "11.8L", pcr: 0.83 },
    { strike: 23750, callOI: "18.1L", callVol: "12.0L", putOI: "24.5L", putVol: "15.2L", pcr: 1.35 },
    { strike: 23800, callOI: "10.2L", callVol: "6.8L", putOI: "20.1L", putVol: "12.4L", pcr: 1.97 },
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.04)", padding: 24,
      overflow: "hidden",
    }}>
      <div style={{
        fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)",
        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16,
      }}>NIFTY Option Chain</div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem" }}>
          <thead>
            <tr>
              {["Call OI", "Call Vol", "Strike", "Put OI", "Put Vol", "PCR"].map((h) => (
                <th key={h} style={{
                  padding: "8px 10px", textAlign: "center",
                  color: "rgba(255,255,255,0.25)", fontWeight: 600,
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strikes.map((s) => (
              <tr key={s.strike}>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#F87171", fontWeight: 600 }}>{s.callOI}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "rgba(255,255,255,0.35)" }}>{s.callVol}</td>
                <td style={{
                  padding: "8px 10px", textAlign: "center",
                  fontWeight: 800, color: "#fff",
                  background: s.strike === 23700 ? "rgba(74,158,255,0.08)" : "transparent",
                  borderRadius: 6,
                }}>{s.strike}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "#34D399", fontWeight: 600 }}>{s.putOI}</td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: "rgba(255,255,255,0.35)" }}>{s.putVol}</td>
                <td style={{
                  padding: "8px 10px", textAlign: "center", fontWeight: 700,
                  color: s.pcr > 1 ? "#34D399" : "#F87171",
                }}>{s.pcr.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DerivativesAI() {
  return (
    <section style={{
      padding: "120px clamp(20px, 5vw, 80px)",
      background: "rgba(124,77,255,0.015)",
      borderTop: "1px solid rgba(124,77,255,0.06)",
      borderBottom: "1px solid rgba(124,77,255,0.06)",
      position: "relative",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "50%", right: "10%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,77,255,0.04), transparent)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <SectionHeader
          label="AI Derivatives Agent"
          title="Institutional-Grade"
          titleAccent="F&O Intelligence"
          subtitle="AI quant analysis with option chain intelligence, volatility heatmaps, IV percentile tracking & strategy generation."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Reveal delay={0}>
            <OptionChainPreview />
          </Reveal>
          <Reveal delay={100}>
            <VolHeatmap />
          </Reveal>
        </div>

        {/* Feature pills */}
        <Reveal delay={200}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 10,
            justifyContent: "center", marginTop: 40,
          }}>
            {[
              "Max Pain Analysis", "IV Rank & Percentile", "OI Build-up Detection",
              "Strategy Builder", "Greeks Dashboard", "Futures Basis Tracking",
            ].map((f) => (
              <span key={f} style={{
                padding: "10px 20px", borderRadius: 12,
                background: "rgba(124,77,255,0.06)",
                border: "1px solid rgba(124,77,255,0.1)",
                fontSize: "0.78rem", fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
              }}>{f}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
