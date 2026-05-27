"use client";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.04)",
      padding: "48px clamp(20px, 5vw, 80px) 32px",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 40, marginBottom: 48,
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Image src="/logo.png" alt="White Tiger" width={36} height={36} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.02em" }}>White Tiger</span>
          </div>
          <p style={{
            fontSize: "0.85rem", color: "rgba(255,255,255,0.3)",
            lineHeight: 1.7, maxWidth: 280,
          }}>
            AI-powered global investment intelligence platform. Research beyond the numbers.
          </p>
        </div>

        {/* Product */}
        <div>
          <div style={{
            fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 18,
          }}>Product</div>
          {["Stocks", "Crypto", "Forex", "Commodities", "Derivatives"].map((t) => (
            <Link key={t} href="/analyze" style={{
              display: "block", fontSize: "0.85rem",
              color: "rgba(255,255,255,0.3)", textDecoration: "none",
              marginBottom: 10, transition: "color 0.2s",
            }}>{t}</Link>
          ))}
        </div>

        {/* Intelligence */}
        <div>
          <div style={{
            fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 18,
          }}>Intelligence</div>
          {["Real Estate", "Tax Planning", "Wealth Advisory", "Bonds", "Mutual Funds"].map((t) => (
            <Link key={t} href="/analyze" style={{
              display: "block", fontSize: "0.85rem",
              color: "rgba(255,255,255,0.3)", textDecoration: "none",
              marginBottom: 10, transition: "color 0.2s",
            }}>{t}</Link>
          ))}
        </div>

        {/* Company */}
        <div>
          <div style={{
            fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 18,
          }}>Legal</div>
          {["Terms of Service", "Privacy Policy", "Disclaimer"].map((t) => (
            <span key={t} style={{
              display: "block", fontSize: "0.85rem",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 10,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.04)",
        paddingTop: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>
          © 2025 White Tiger. Not SEBI-registered. For informational purposes only.
        </div>
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.15)" }}>
          Built with AI
        </div>
      </div>
    </footer>
  );
}
