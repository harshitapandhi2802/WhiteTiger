"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Reveal, SectionHeader } from "./shared";
import { Monitor, Smartphone, Download, Share2, Plus, Check, ArrowRight } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Download / Install App Section
   Detects device type, triggers native PWA install or shows guide
   ══════════════════════════════════════════════════════════════════ */

type Platform = "android" | "ios" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "desktop";
}

export default function DownloadApp() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());

    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    // Capture the beforeinstallprompt for Android/Desktop Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (platform === "ios") {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const result = await deferredPrompt.current.userChoice;
      if (result.outcome === "accepted") setInstalled(true);
      deferredPrompt.current = null;
    } else {
      // Fallback — direct to /analyze and let browser prompt
      router.push("/analyze");
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.02)",
    border: "0.5px solid rgba(232,237,245,0.06)",
    borderRadius: 20,
    padding: "40px 36px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 20,
    transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  };

  const iconCircle: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const btnBase: React.CSSProperties = {
    border: "none",
    borderRadius: 14,
    padding: "14px 36px",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
    letterSpacing: "-0.01em",
  };

  return (
    <section id="download" style={{ padding: "100px clamp(20px, 5vw, 80px)" }}>
      <Reveal>
        <SectionHeader
          label="GET THE APP"
          title="White Tiger, Everywhere"
          titleAccent="Install in seconds. No app store needed."
          subtitle="Experience institutional-grade intelligence as a native app on your phone or desktop — fast, offline-ready, and always one tap away."
        />
      </Reveal>

      <div style={{
        maxWidth: 960,
        margin: "60px auto 0",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
      }}>
        {/* ── Desktop Card ── */}
        <Reveal>
          <div
            style={cardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(74,158,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(74,158,255,0.15)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              e.currentTarget.style.borderColor = "rgba(232,237,245,0.06)";
              e.currentTarget.style.transform = "none";
            }}
            onClick={() => {
              if (platform === "desktop") handleInstall();
            }}
          >
            {/* Glow */}
            <div style={{
              position: "absolute", top: -40, right: -40, width: 160, height: 160,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(74,158,255,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ ...iconCircle, background: "rgba(74,158,255,0.08)" }}>
              <Monitor size={28} color="#4A9EFF" />
            </div>

            <div>
              <h3 style={{
                fontSize: "1.3rem", fontWeight: 700, color: "#fff",
                marginBottom: 8, letterSpacing: "-0.02em",
              }}>Desktop App</h3>
              <p style={{
                fontSize: "0.85rem", color: "rgba(255,255,255,0.35)",
                lineHeight: 1.7,
              }}>
                Works on Chrome, Edge & Brave. Runs in its own window with offline support.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 4 }}>
              {["Dedicated window — no tabs", "Keyboard shortcuts", "Offline access to cached data"].map((f) => (
                <div key={f} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: "0.8rem", color: "rgba(255,255,255,0.3)",
                }}>
                  <Check size={14} color="#34D399" />
                  {f}
                </div>
              ))}
            </div>

            <button
              style={{
                ...btnBase,
                background: installed && platform === "desktop"
                  ? "rgba(52,211,153,0.12)"
                  : "linear-gradient(135deg, #4A9EFF, #4A9EFF)",
                color: "#fff",
                boxShadow: installed && platform === "desktop"
                  ? "none"
                  : "0 6px 30px rgba(74,158,255,0.25)",
                width: "100%",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleInstall();
              }}
              onMouseEnter={(e) => {
                if (!installed || platform !== "desktop") {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 8px 36px rgba(74,158,255,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = installed && platform === "desktop" ? "none" : "0 6px 30px rgba(74,158,255,0.25)";
              }}
            >
              {installed && platform === "desktop" ? (
                <><Check size={16} /> Installed</>
              ) : (
                <><Download size={16} /> Install for Desktop</>
              )}
            </button>
          </div>
        </Reveal>

        {/* ── Phone Card ── */}
        <Reveal>
          <div
            style={cardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(124,77,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(124,77,255,0.15)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              e.currentTarget.style.borderColor = "rgba(232,237,245,0.06)";
              e.currentTarget.style.transform = "none";
            }}
            onClick={() => {
              if (platform === "android" || platform === "ios") handleInstall();
            }}
          >
            {/* Glow */}
            <div style={{
              position: "absolute", top: -40, left: -40, width: 160, height: 160,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,77,255,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ ...iconCircle, background: "rgba(124,77,255,0.08)" }}>
              <Smartphone size={28} color="#a78bfa" />
            </div>

            <div>
              <h3 style={{
                fontSize: "1.3rem", fontWeight: 700, color: "#fff",
                marginBottom: 8, letterSpacing: "-0.02em",
              }}>Phone App</h3>
              <p style={{
                fontSize: "0.85rem", color: "rgba(255,255,255,0.35)",
                lineHeight: 1.7,
              }}>
                Android &amp; iPhone. Add to home screen — feels like a native app from the store.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 4 }}>
              {["Full-screen — no browser bar", "Home screen icon with tiger logo", "Swipe navigation & bottom tabs"].map((f) => (
                <div key={f} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: "0.8rem", color: "rgba(255,255,255,0.3)",
                }}>
                  <Check size={14} color="#a78bfa" />
                  {f}
                </div>
              ))}
            </div>

            <button
              style={{
                ...btnBase,
                background: installed && (platform === "android" || platform === "ios")
                  ? "rgba(52,211,153,0.12)"
                  : "linear-gradient(135deg, #7c4dff, #a78bfa)",
                color: "#fff",
                boxShadow: installed && (platform === "android" || platform === "ios")
                  ? "none"
                  : "0 6px 30px rgba(124,77,255,0.25)",
                width: "100%",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (platform === "ios") {
                  setShowIOSGuide(true);
                } else {
                  handleInstall();
                }
              }}
              onMouseEnter={(e) => {
                if (!installed) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 8px 36px rgba(124,77,255,0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = installed ? "none" : "0 6px 30px rgba(124,77,255,0.25)";
              }}
            >
              {installed ? (
                <><Check size={16} /> Installed</>
              ) : platform === "ios" ? (
                <><Plus size={16} /> Add to Home Screen</>
              ) : (
                <><Download size={16} /> Install for Phone</>
              )}
            </button>
          </div>
        </Reveal>
      </div>

      {/* ── iOS Guide Modal ── */}
      {showIOSGuide && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            style={{
              background: "#14213D",
              border: "0.5px solid rgba(232,237,245,0.08)",
              borderRadius: 24,
              padding: "40px 36px",
              maxWidth: 400,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <Image src="/logo.png" alt="White Tiger" width={40} height={40} style={{ borderRadius: 10 }} />
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                  Install White Tiger
                </h3>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                  iPhone &amp; iPad
                </p>
              </div>
            </div>

            {[
              { step: 1, icon: <Share2 size={18} color="#4A9EFF" />, text: "Tap the Share button in Safari", sub: "Bottom toolbar — square with arrow pointing up" },
              { step: 2, icon: <Plus size={18} color="#4A9EFF" />, text: "Scroll down and tap \"Add to Home Screen\"", sub: "It may say \"Add to Dock\" on iPad" },
              { step: 3, icon: <Check size={18} color="#34D399" />, text: "Tap \"Add\" to confirm", sub: "White Tiger will appear on your home screen" },
            ].map(({ step, icon, text, sub }) => (
              <div key={step} style={{
                display: "flex", gap: 16, marginBottom: 20,
                padding: "16px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 14,
                border: "0.5px solid rgba(232,237,245,0.04)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "rgba(74,158,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.85rem", fontWeight: 700, color: "#4A9EFF",
                }}>
                  {step}
                </div>
                <div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff", marginBottom: 4 }}>{text}</p>
                  <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{sub}</p>
                </div>
              </div>
            ))}

            <button
              style={{
                ...btnBase,
                width: "100%", justifyContent: "center",
                background: "rgba(74,158,255,0.1)",
                color: "#4A9EFF",
                marginTop: 8,
              }}
              onClick={() => setShowIOSGuide(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Subtle note ── */}
      <Reveal>
        <p style={{
          textAlign: "center", marginTop: 40,
          fontSize: "0.78rem", color: "rgba(255,255,255,0.15)",
          maxWidth: 500, margin: "40px auto 0",
          lineHeight: 1.7,
        }}>
          Progressive Web App — installs directly from your browser. No app store download needed. Works on Chrome, Safari, Edge, Brave &amp; Firefox.
        </p>
      </Reveal>
    </section>
  );
}

/* ── Type for the beforeinstallprompt event (not in standard TS lib) ── */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
