"use client";
import HeroSection from "@/components/homepage/HeroSection";
import MarketTicker from "@/components/homepage/MarketTicker";
import StatsBar from "@/components/homepage/StatsBar";
import DashboardPreview from "@/components/homepage/DashboardPreview";
import AIOverview from "@/components/homepage/AIOverview";
import RealEstateWorldMap from "@/components/homepage/RealEstateWorldMap";
import DerivativesAI from "@/components/homepage/DerivativesAI";
import MarketNewsWall from "@/components/homepage/MarketNewsWall";
import ComparisonTable from "@/components/homepage/ComparisonTable";
import PricingSection from "@/components/homepage/PricingSection";
import DownloadApp from "@/components/homepage/DownloadApp";
import CTASection from "@/components/homepage/CTASection";
import Footer from "@/components/homepage/Footer";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — LUXURY AI FINANCIAL INTELLIGENCE PLATFORM
   Premium dark theme · Smooth animations · Glassmorphism
   Inspired by Bloomberg × Apple × Stripe design language
   ══════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div style={{
      background: "#0A0E1A",
      color: "#E8EDF5",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflowX: "hidden",
      WebkitFontSmoothing: "antialiased",
    }}>
      {/* ── Global Animations ── */}
      <style>{`
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes livePulse { 0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(52,211,153,0.5); } 50% { opacity: 0.5; box-shadow: 0 0 4px rgba(52,211,153,0.2); } }
        @keyframes orbFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
        @keyframes luxuryGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes heroFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes mapPulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; } 50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
        @keyframes tooltipIn { from { opacity: 0; transform: translateX(-50%) translateY(6px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(74,158,255,0.3); color: #fff; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0A0E1A; }
        ::-webkit-scrollbar-thumb { background: rgba(74,158,255,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(74,158,255,0.25); }

        @media (max-width: 768px) {
          nav > div:last-child > a { display: none !important; }
        }
      `}</style>

      {/* ── Sections ── */}
      <HeroSection />
      <MarketTicker />
      <StatsBar />
      <DashboardPreview />
      <AIOverview />
      <RealEstateWorldMap />
      <DerivativesAI />
      <MarketNewsWall />
      <ComparisonTable />
      <PricingSection />
      <DownloadApp />
      <CTASection />
      <Footer />
    </div>
  );
}
