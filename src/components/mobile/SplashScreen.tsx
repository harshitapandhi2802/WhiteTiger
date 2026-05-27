"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Premium Splash Screen
   Cinematic app-opening experience with:
   • Animated tiger logo with glow
   • Market pulse lines
   • AI scanning effect
   • Smooth fade-out transition
   Duration: ~2.5 seconds
   ══════════════════════════════════════════════════════════════════ */

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"logo" | "pulse" | "text" | "exit">("logo");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation phases
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("pulse"), 400);
    const t2 = setTimeout(() => setPhase("text"), 1000);
    const t3 = setTimeout(() => setPhase("exit"), 2200);
    const t4 = setTimeout(() => onComplete(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  // Canvas market pulse animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let animId: number;

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // Subtle grid
      ctx!.strokeStyle = "rgba(74,158,255,0.03)";
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < 20; i++) {
        const y = (i / 20) * h;
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(w, y); ctx!.stroke();
      }

      // Market pulse lines
      const progress = Math.min(frame / 60, 1);
      if (progress > 0) {
        // Line 1 — main pulse
        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(74,158,255,${0.15 * progress})`;
        ctx!.lineWidth = 1.5;
        const endX = w * progress;
        for (let x = 0; x <= endX; x += 2) {
          const normalX = x / w;
          const y = h * 0.5
            + Math.sin(normalX * 8 + frame * 0.03) * 40
            + Math.sin(normalX * 15 + frame * 0.05) * 20
            + (normalX > 0.3 && normalX < 0.35 ? -60 : 0)
            + (normalX > 0.6 && normalX < 0.65 ? 50 : 0);
          x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
        }
        ctx!.stroke();

        // Line 2 — secondary
        ctx!.beginPath();
        ctx!.strokeStyle = `rgba(124,77,255,${0.08 * progress})`;
        ctx!.lineWidth = 1;
        for (let x = 0; x <= endX; x += 2) {
          const normalX = x / w;
          const y = h * 0.55 + Math.sin(normalX * 6 + frame * 0.02) * 30 + Math.cos(normalX * 12) * 15;
          x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
        }
        ctx!.stroke();

        // Scanning line
        const scanX = (frame * 3) % w;
        const scanGrad = ctx!.createLinearGradient(scanX - 60, 0, scanX + 60, 0);
        scanGrad.addColorStop(0, "transparent");
        scanGrad.addColorStop(0.5, `rgba(74,158,255,${0.12 * progress})`);
        scanGrad.addColorStop(1, "transparent");
        ctx!.fillStyle = scanGrad;
        ctx!.fillRect(scanX - 60, 0, 120, h);
      }

      // Floating particles
      for (let i = 0; i < 30; i++) {
        const px = ((i * 137.5 + frame * 0.3) % w);
        const py = ((i * 89.3 + Math.sin(frame * 0.01 + i) * 20) % h);
        const po = Math.sin(frame * 0.02 + i) * 0.15 + 0.15;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(74,158,255,${po * progress})`;
        ctx!.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx!.fill();
      }

      frame++;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0A0E1A",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: phase === "exit" ? 0 : 1,
      transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1)",
      pointerEvents: phase === "exit" ? "none" : "auto",
    }}>
      {/* Background canvas */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Radial glow behind logo */}
      <div style={{
        position: "absolute",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,158,255,0.12) 0%, transparent 70%)",
        filter: "blur(40px)",
        opacity: phase !== "logo" ? 1 : 0,
        transform: phase !== "logo" ? "scale(1)" : "scale(0.5)",
        transition: "all 1s cubic-bezier(0.16,1,0.3,1)",
      }} />

      {/* Logo */}
      <div style={{
        position: "relative", zIndex: 2,
        opacity: phase !== "logo" ? 1 : 0,
        transform: phase !== "logo" ? "scale(1) translateY(0)" : "scale(0.7) translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <Image
          src="/logo.png" alt="White Tiger" width={80} height={80}
          style={{
            borderRadius: 20,
            boxShadow: phase === "pulse" || phase === "text"
              ? "0 0 40px rgba(74,158,255,0.3), 0 0 80px rgba(74,158,255,0.1)"
              : "none",
            transition: "box-shadow 1s ease",
          }}
        />
      </div>

      {/* Brand text */}
      <div style={{
        position: "relative", zIndex: 2,
        marginTop: 24,
        opacity: phase === "text" || phase === "exit" ? 1 : 0,
        transform: phase === "text" || phase === "exit" ? "translateY(0)" : "translateY(10px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s",
        textAlign: "center",
      }}>
        <h1 style={{
          fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.04em",
          color: "#fff", marginBottom: 8,
        }}>
          White Tiger
        </h1>
        <p style={{
          fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
        }}>
          AI Investment Intelligence
        </p>
      </div>

      {/* Loading dots */}
      <div style={{
        position: "absolute", bottom: "12%",
        display: "flex", gap: 6, zIndex: 2,
        opacity: phase === "text" ? 1 : 0,
        transition: "opacity 0.4s",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#4A9EFF",
            animation: `splashDot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splashDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
