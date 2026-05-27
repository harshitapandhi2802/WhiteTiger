"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./shared";

export default function CTASection() {
  return (
    <section style={{
      padding: "140px clamp(20px, 5vw, 80px)",
      textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      {/* Multi-layer glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,158,255,0.08) 0%, transparent 60%)",
        pointerEvents: "none", filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", top: "45%", left: "45%",
        transform: "translate(-50%, -50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,77,255,0.05) 0%, transparent 60%)",
        pointerEvents: "none", filter: "blur(50px)",
      }} />

      <Reveal>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontSize: "0.72rem", fontWeight: 700, color: "#4A9EFF",
            textTransform: "uppercase", letterSpacing: "0.2em",
            marginBottom: 20,
          }}>Ready to Begin</div>

          <h2 style={{
            fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 800,
            letterSpacing: "-0.03em", marginBottom: 20,
            lineHeight: 1.15,
          }}>
            The future of investing
            <br />
            <span style={{
              background: "linear-gradient(135deg, #4A9EFF, #7c4dff, #00e5ff)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>is intelligence.</span>
          </h2>

          <p style={{
            color: "rgba(255,255,255,0.35)", fontSize: "1.1rem",
            marginBottom: 44, maxWidth: 500, margin: "0 auto 44px",
            lineHeight: 1.8,
          }}>
            Join thousands of investors using AI-powered institutional-grade analysis across every asset class.
          </p>

          <Link href="/analyze">
            <button style={{
              background: "linear-gradient(135deg, #4A9EFF, #4A9EFF)",
              color: "#fff", border: "none", borderRadius: 16,
              padding: "20px 52px", fontWeight: 700, fontSize: "1.1rem",
              cursor: "pointer", display: "inline-flex",
              alignItems: "center", gap: 12,
              boxShadow: "0 8px 48px rgba(74,158,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
              letterSpacing: "-0.01em",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 56px rgba(74,158,255,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 48px rgba(74,158,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
            >
              Start Free Analysis <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
