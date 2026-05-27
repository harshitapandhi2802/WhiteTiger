"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Reveal, SectionHeader } from "./shared";

/* ═══════════════════════════════════════════════════════
   COUNTRY DATA — lat/lng for globe projection
   ═══════════════════════════════════════════════════════ */
const COUNTRIES = [
  { name: "India", lat: 20.6, lng: 79, growth: "+8.2%", yield: "3.4%", color: "#34D399" },
  { name: "UAE", lat: 24, lng: 54, growth: "+12.1%", yield: "5.8%", color: "#4A9EFF" },
  { name: "USA", lat: 39.8, lng: -98.6, growth: "+4.5%", yield: "4.2%", color: "#4A9EFF" },
  { name: "Singapore", lat: 1.35, lng: 103.8, growth: "+6.3%", yield: "3.1%", color: "#00e5ff" },
  { name: "UK", lat: 55.4, lng: -3.4, growth: "+3.8%", yield: "4.5%", color: "#7BB8FF" },
  { name: "Japan", lat: 36.2, lng: 138.3, growth: "+5.1%", yield: "3.8%", color: "#7c4dff" },
  { name: "Canada", lat: 56.1, lng: -106.3, growth: "+3.2%", yield: "4.0%", color: "#FBBF24" },
  { name: "Australia", lat: -25.3, lng: 133.8, growth: "+5.7%", yield: "4.3%", color: "#F87171" },
  { name: "Saudi Arabia", lat: 23.9, lng: 45, growth: "+9.4%", yield: "5.2%", color: "#34D399" },
];

/* ═══════════════════════════════════════════════════════
   ROTATING 3D GLOBE — Pure Canvas, no Three.js needed
   ═══════════════════════════════════════════════════════ */
function RotatingGlobe({ activeCountry }: { activeCountry: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.42;

    ctx.clearRect(0, 0, W, H);

    rotationRef.current += 0.002;
    const rot = rotationRef.current;

    // ── Globe atmosphere glow ──
    const atmo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.4);
    atmo.addColorStop(0, "rgba(74,158,255,0.06)");
    atmo.addColorStop(0.5, "rgba(74,158,255,0.02)");
    atmo.addColorStop(1, "transparent");
    ctx.fillStyle = atmo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // ── Globe body ──
    const grd = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R);
    grd.addColorStop(0, "rgba(20,28,50,0.95)");
    grd.addColorStop(0.7, "rgba(10,15,30,0.98)");
    grd.addColorStop(1, "rgba(10,14,26,1)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // ── Globe rim highlight ──
    ctx.strokeStyle = "rgba(74,158,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow at top-left
    const ig = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, 0, cx, cy, R);
    ig.addColorStop(0, "rgba(74,158,255,0.08)");
    ig.addColorStop(0.4, "transparent");
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // ── Latitude lines (parallels) ──
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (lat * Math.PI) / 180;
      const r = R * Math.cos(phi);
      const y = cy - R * Math.sin(phi);
      ctx.strokeStyle = "rgba(74,158,255,0.05)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, y, r, r * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── Longitude lines (meridians) — rotating ──
    for (let i = 0; i < 12; i++) {
      const lng = (i * 30 * Math.PI) / 180 + rot;
      const cosLng = Math.cos(lng);
      const sinLng = Math.sin(lng);

      ctx.strokeStyle = "rgba(74,158,255,0.04)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let t = -90; t <= 90; t += 2) {
        const phi = (t * Math.PI) / 180;
        const x3d = Math.cos(phi) * sinLng;
        const y3d = Math.sin(phi);
        const z3d = Math.cos(phi) * cosLng;
        if (z3d < -0.05) continue; // behind globe
        const px = cx + x3d * R;
        const py = cy - y3d * R;
        if (t === -90 || z3d < 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // ── Country dots ──
    const toScreen = (lat: number, lng: number) => {
      const phi = (lat * Math.PI) / 180;
      const lambda = (lng * Math.PI) / 180 + rot;
      const x3d = Math.cos(phi) * Math.sin(lambda);
      const y3d = Math.sin(phi);
      const z3d = Math.cos(phi) * Math.cos(lambda);
      return {
        x: cx + x3d * R,
        y: cy - y3d * R,
        z: z3d,
        visible: z3d > -0.1,
      };
    };

    // Connection arcs between countries
    const pairs = [[0, 1], [0, 3], [2, 4], [2, 6], [5, 3], [1, 8]];
    pairs.forEach(([a, b]) => {
      const pA = toScreen(COUNTRIES[a].lat, COUNTRIES[a].lng);
      const pB = toScreen(COUNTRIES[b].lat, COUNTRIES[b].lng);
      if (!pA.visible || !pB.visible) return;
      const alpha = Math.min(pA.z, pB.z) * 0.15;
      if (alpha < 0.02) return;
      ctx.strokeStyle = `rgba(74,158,255,${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      // Curved arc
      const midX = (pA.x + pB.x) / 2;
      const midY = (pA.y + pB.y) / 2 - 20;
      ctx.moveTo(pA.x, pA.y);
      ctx.quadraticCurveTo(midX, midY, pB.x, pB.y);
      ctx.stroke();
    });

    // Draw each country
    COUNTRIES.forEach((c) => {
      const p = toScreen(c.lat, c.lng);
      if (!p.visible) return;

      const alpha = Math.max(0.15, Math.min(1, p.z * 1.2));
      const isActive = activeCountry === c.name;
      const dotR = isActive ? 6 : 4;

      // Pulse ring
      if (isActive) {
        ctx.strokeStyle = `${c.color}40`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14 + Math.sin(Date.now() * 0.003) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Glow
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, dotR * 4);
      glow.addColorStop(0, `${c.color}${Math.round(alpha * 30).toString(16).padStart(2, "0")}`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotR * 4, 0, Math.PI * 2);
      ctx.fill();

      // Dot
      ctx.globalAlpha = alpha;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label
      if (alpha > 0.5) {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.font = `${isActive ? "700" : "500"} ${isActive ? 11 : 9}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(c.name, p.x, p.y + dotR + 14);
      }
    });

    animRef.current = requestAnimationFrame(draw);
  }, [activeCountry]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%", height: "100%",
        position: "absolute", inset: 0,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SECTION
   ═══════════════════════════════════════════════════════ */
export default function RealEstateWorldMap() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section style={{
      padding: "120px clamp(20px, 5vw, 80px)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background accents */}
      <div style={{
        position: "absolute", top: "30%", left: "10%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(74,158,255,0.03), transparent)",
        filter: "blur(60px)", pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <SectionHeader
          label="Global Intelligence"
          title="Real Estate Across"
          titleAccent="9 Countries & 50+ Cities"
          subtitle="AI-powered property intelligence with city-level growth signals, yield heatmaps & affordability analysis."
        />

        {/* Globe Container */}
        <Reveal direction="scale">
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: 700,
            aspectRatio: "1/1",
            margin: "0 auto",
          }}>
            <RotatingGlobe activeCountry={active} />
          </div>
        </Reveal>

        {/* Country cards strip */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14, marginTop: 40,
        }}>
          {COUNTRIES.map((c, i) => (
            <Reveal key={c.name} delay={i * 50}>
              <div
                onMouseEnter={() => setActive(c.name)}
                onMouseLeave={() => setActive(null)}
                style={{
                  padding: "18px 18px", borderRadius: 18,
                  background: active === c.name ? "rgba(74,158,255,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${active === c.name ? "rgba(74,158,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                  transform: active === c.name ? "translateY(-2px)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: c.color, boxShadow: `0 0 8px ${c.color}40`,
                  }} />
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>{c.name}</div>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Growth</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#34D399" }}>{c.growth}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Yield</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#4A9EFF" }}>{c.yield}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
