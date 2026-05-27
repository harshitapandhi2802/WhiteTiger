"use client";
import { useEffect, useRef, useState } from "react";

/* ── Scroll Reveal ── */
export function Reveal({
  children, delay = 0, direction = "up",
}: {
  children: React.ReactNode; delay?: number;
  direction?: "up" | "left" | "right" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const transforms: Record<string, string> = {
    up: "translateY(50px)", left: "translateX(-50px)",
    right: "translateX(50px)", scale: "scale(0.95)",
  };

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : transforms[direction],
      transition: `all 1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ── Animated Counter ── */
export function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.ceil(end / 50);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setVal(end); clearInterval(timer); } else setVal(start);
        }, 25);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

/* ── Section Header ── */
export function SectionHeader({
  label, title, titleAccent, subtitle, align = "center",
}: {
  label: string; title: string; titleAccent?: string;
  subtitle?: string; align?: "center" | "left";
}) {
  return (
    <Reveal>
      <div style={{ textAlign: align, marginBottom: 64, maxWidth: align === "center" ? 680 : undefined, margin: align === "center" ? "0 auto 64px" : undefined }}>
        <div style={{
          fontSize: "0.72rem", fontWeight: 700, color: "#4A9EFF",
          textTransform: "uppercase", letterSpacing: "0.2em",
          marginBottom: 16,
        }}>{label}</div>
        <h2 style={{
          fontSize: "clamp(2rem, 3.5vw, 3.2rem)", fontWeight: 800,
          letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: subtitle ? 20 : 0,
          color: "#fff",
        }}>
          {title}
          {titleAccent && (
            <>
              <br />
              <span style={{ color: "rgba(255,255,255,0.25)" }}>{titleAccent}</span>
            </>
          )}
        </h2>
        {subtitle && (
          <p style={{
            fontSize: "1.1rem", color: "rgba(255,255,255,0.35)",
            lineHeight: 1.8, letterSpacing: "-0.01em",
          }}>{subtitle}</p>
        )}
      </div>
    </Reveal>
  );
}
