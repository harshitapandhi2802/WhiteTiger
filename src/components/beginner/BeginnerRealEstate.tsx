"use client";
import { useState, useMemo } from "react";
import { COLORS, card, SectionHeader, AIExplanation, WhatThisMeansCard, RiskMeter, StatCard, Disclaimer, UpsellBanner, Accordion, PillTabs } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER REAL ESTATE TAB v2 — GLOBAL AI PROPERTY INTELLIGENCE
   Countries → Cities → City Analysis
   Interactive heatmap, AI explanations, growth charts.
   ═══════════════════════════════════════════════════════════════ */

/* ── Country Data ────────────────────────────────────────────── */
interface CityData {
  name: string; emoji: string; growthScore: number; rentalYield: string;
  avgPrice: string; affordability: "High" | "Medium" | "Low";
  migration: "Rising" | "Stable" | "Declining"; infraProjects: string[];
  investScore: number; trend: "up" | "stable" | "down";
  aiSummary: string; localities: { name: string; growth: string; price: string }[];
  priceHistory: number[];
}

interface CountryData {
  name: string; flag: string; code: string; color: string;
  heatScore: number; affordability: "High" | "Medium" | "Low";
  rentalYield: string; growthSentiment: "Bullish" | "Neutral" | "Bearish";
  infraScore: number; avgGrowth: string;
  mortgageRate: string; currency: string;
  aiSummary: string; keyFacts: string[];
  cities: CityData[];
  priceIndex: number[];
}

const COUNTRIES: CountryData[] = [
  {
    name: "India", flag: "🇮🇳", code: "IN", color: "#f97316",
    heatScore: 82, affordability: "Medium", rentalYield: "2.5-4.5%",
    growthSentiment: "Bullish", infraScore: 78, avgGrowth: "+10-15%/yr",
    mortgageRate: "8.5-9.5%", currency: "INR",
    aiSummary: "India's real estate market is booming with rapid urbanization, IT sector growth, and massive infrastructure investments. Smart city projects and metro expansions are driving property prices in tier-1 and tier-2 cities.",
    keyFacts: ["World's fastest growing major economy", "$1.3T real estate market by 2030", "100+ smart city projects underway", "RERA regulation improves transparency"],
    priceIndex: [100, 103, 106, 108, 112, 118, 125, 130],
    cities: [
      { name: "Mumbai", emoji: "🏙️", growthScore: 78, rentalYield: "2.5-3.5%", avgPrice: "₹15,000-25,000/sqft", affordability: "Low", migration: "Rising", infraProjects: ["Metro Line 3 (Aqua Line)", "Coastal Road Phase 2", "Trans-Harbour Link", "Navi Mumbai Airport"], investScore: 82, trend: "up", aiSummary: "India's financial capital with premium property prices. Navi Mumbai and Thane offer better value. Coastal Road and metro expansion are game-changers for western suburbs.", localities: [{ name: "Andheri West", growth: "+12%", price: "₹22,000/sqft" }, { name: "Thane", growth: "+15%", price: "₹12,000/sqft" }, { name: "Navi Mumbai", growth: "+18%", price: "₹10,000/sqft" }], priceHistory: [100, 102, 105, 108, 112, 116, 120, 125] },
      { name: "Bangalore", emoji: "💻", growthScore: 90, rentalYield: "3-4.5%", avgPrice: "₹8,000-15,000/sqft", affordability: "Medium", migration: "Rising", infraProjects: ["Namma Metro Phase 2", "Peripheral Ring Road", "Satellite Town Ring Road", "IT Corridor Expansion"], investScore: 92, trend: "up", aiSummary: "India's Silicon Valley with the highest rental yields among metros. IT sector drives demand. North Bangalore and Whitefield are top investment zones with metro connectivity coming.", localities: [{ name: "Whitefield", growth: "+14%", price: "₹9,500/sqft" }, { name: "North Bangalore", growth: "+20%", price: "₹7,000/sqft" }, { name: "Electronic City", growth: "+12%", price: "₹6,500/sqft" }], priceHistory: [100, 105, 110, 114, 120, 128, 136, 145] },
      { name: "Hyderabad", emoji: "⭐", growthScore: 92, rentalYield: "3.5-5%", avgPrice: "₹6,000-12,000/sqft", affordability: "High", migration: "Rising", infraProjects: ["Metro Phase 2", "Regional Ring Road", "Pharma City", "IT Investment Region"], investScore: 95, trend: "up", aiSummary: "Fastest appreciating real estate market in India. Pharma and IT sectors drive massive demand. Lower prices than Bangalore make it the best value metro for investors.", localities: [{ name: "Gachibowli", growth: "+18%", price: "₹10,000/sqft" }, { name: "Kompally", growth: "+22%", price: "₹5,500/sqft" }, { name: "Shamshabad", growth: "+25%", price: "₹4,500/sqft" }], priceHistory: [100, 108, 115, 122, 132, 142, 155, 168] },
      { name: "Pune", emoji: "🎓", growthScore: 80, rentalYield: "3-4%", avgPrice: "₹6,000-10,000/sqft", affordability: "High", migration: "Rising", infraProjects: ["Pune Metro", "Ring Road", "Hinjewadi IT Expansion", "PCMC Growth Corridor"], investScore: 85, trend: "up", aiSummary: "Affordable IT hub near Mumbai. Hinjewadi and Wakad are IT hotspots. Excellent for first-time buyers and young professionals.", localities: [{ name: "Hinjewadi", growth: "+15%", price: "₹8,000/sqft" }, { name: "Wakad", growth: "+12%", price: "₹7,500/sqft" }, { name: "Kharadi", growth: "+14%", price: "₹9,000/sqft" }], priceHistory: [100, 104, 108, 112, 117, 123, 130, 138] },
      { name: "Delhi NCR", emoji: "🏛️", growthScore: 70, rentalYield: "2-3%", avgPrice: "₹5,000-18,000/sqft", affordability: "Medium", migration: "Stable", infraProjects: ["Jewar Airport", "Dwarka Expressway", "RRTS Corridor", "Metro Phase 4"], investScore: 75, trend: "stable", aiSummary: "Wide price variation across Delhi, Noida, Gurgaon, and Greater Noida. Jewar Airport is transforming Greater Noida. Gurgaon remains premium with corporate demand.", localities: [{ name: "Gurgaon Sec 82-84", growth: "+10%", price: "₹12,000/sqft" }, { name: "Noida Expressway", growth: "+15%", price: "₹7,000/sqft" }, { name: "Greater Noida West", growth: "+20%", price: "₹4,500/sqft" }], priceHistory: [100, 101, 103, 105, 108, 111, 115, 118] },
      { name: "Chennai", emoji: "🏖️", growthScore: 75, rentalYield: "3-3.5%", avgPrice: "₹5,000-10,000/sqft", affordability: "High", migration: "Stable", infraProjects: ["Metro Phase 2", "Port City", "IT Corridor Extension", "Outer Ring Road"], investScore: 78, trend: "up", aiSummary: "Underrated market with steady growth. Strong industrial base with auto and IT sectors. OMR corridor and Porur are emerging hotspots.", localities: [{ name: "OMR", growth: "+12%", price: "₹8,000/sqft" }, { name: "Porur", growth: "+10%", price: "₹6,000/sqft" }, { name: "Tambaram", growth: "+8%", price: "₹5,000/sqft" }], priceHistory: [100, 103, 106, 109, 113, 117, 122, 128] },
    ],
  },
  {
    name: "UAE", flag: "🇦🇪", code: "AE", color: "#10b981",
    heatScore: 90, affordability: "Low", rentalYield: "5-8%",
    growthSentiment: "Bullish", infraScore: 95, avgGrowth: "+12-20%/yr",
    mortgageRate: "4-5%", currency: "AED",
    aiSummary: "UAE offers some of the highest rental yields globally. Dubai is the hottest market with zero income tax, world-class infrastructure, and massive foreign investment. Golden visa programs boost long-term demand.",
    keyFacts: ["Zero income tax on property", "Golden Visa for property investors", "5-8% rental yields (among highest globally)", "Tourism-driven short-term rental demand"],
    priceIndex: [100, 108, 118, 125, 135, 148, 160, 175],
    cities: [
      { name: "Dubai", emoji: "🏗️", growthScore: 95, rentalYield: "5-8%", avgPrice: "AED 1,200-3,500/sqft", affordability: "Medium", migration: "Rising", infraProjects: ["Dubai Creek Tower", "Palm Jebel Ali", "Al Maktoum Airport Expansion", "Dubai Metro Blue Line"], investScore: 94, trend: "up", aiSummary: "World's hottest property market. Zero income tax, golden visa, and tourism create massive demand. Downtown, Marina, and JVC are top areas. Short-term rentals (Airbnb) offer 8-12% yields.", localities: [{ name: "Dubai Marina", growth: "+18%", price: "AED 2,200/sqft" }, { name: "JVC", growth: "+25%", price: "AED 1,100/sqft" }, { name: "Downtown", growth: "+15%", price: "AED 3,000/sqft" }], priceHistory: [100, 110, 120, 128, 140, 155, 170, 185] },
      { name: "Abu Dhabi", emoji: "🏛️", growthScore: 80, rentalYield: "6-7%", avgPrice: "AED 900-2,000/sqft", affordability: "Medium", migration: "Rising", infraProjects: ["Saadiyat Island Cultural District", "Yas Bay", "Midfield Terminal", "Abu Dhabi Metro"], investScore: 82, trend: "up", aiSummary: "More affordable than Dubai with strong government-backed development. Saadiyat Island and Yas Island are premium destinations. Growing expat demand.", localities: [{ name: "Saadiyat Island", growth: "+15%", price: "AED 1,800/sqft" }, { name: "Yas Island", growth: "+12%", price: "AED 1,200/sqft" }, { name: "Al Reem Island", growth: "+10%", price: "AED 1,000/sqft" }], priceHistory: [100, 105, 110, 115, 122, 130, 138, 145] },
    ],
  },
  {
    name: "USA", flag: "🇺🇸", code: "US", color: "#4f46e5",
    heatScore: 65, affordability: "Low", rentalYield: "3-5%",
    growthSentiment: "Neutral", infraScore: 82, avgGrowth: "+3-6%/yr",
    mortgageRate: "6.5-7.5%", currency: "USD",
    aiSummary: "The world's largest real estate market is experiencing a correction after 2021-22 highs. High mortgage rates have cooled demand, but Sun Belt cities still see growth. REITs offer easy exposure without buying property.",
    keyFacts: ["World's largest real estate market", "High mortgage rates cooling demand", "Sun Belt cities outperforming", "REIT market worth $1.3 trillion"],
    priceIndex: [100, 110, 120, 125, 122, 118, 120, 122],
    cities: [
      { name: "Austin", emoji: "🤠", growthScore: 72, rentalYield: "3.5-5%", avgPrice: "$350-500/sqft", affordability: "Medium", migration: "Rising", infraProjects: ["Project Connect Light Rail", "Tesla Gigafactory Expansion", "New Samsung Fab"], investScore: 78, trend: "stable", aiSummary: "Tech hub with Tesla, Apple, and Google campuses. Prices corrected from 2022 highs, making it more accessible. Strong job market drives long-term demand.", localities: [{ name: "Downtown", growth: "+5%", price: "$450/sqft" }, { name: "Round Rock", growth: "+8%", price: "$280/sqft" }, { name: "Cedar Park", growth: "+7%", price: "$250/sqft" }], priceHistory: [100, 115, 130, 135, 128, 125, 127, 130] },
      { name: "Miami", emoji: "🏖️", growthScore: 80, rentalYield: "4-6%", avgPrice: "$400-800/sqft", affordability: "Low", migration: "Rising", infraProjects: ["Brightline High-Speed Rail", "Brickell City Centre Expansion", "Port Miami Modernization"], investScore: 82, trend: "up", aiSummary: "Hot market driven by domestic migration from high-tax states and foreign investment from Latin America. Brickell is the new finance hub. Short-term rental yields are excellent.", localities: [{ name: "Brickell", growth: "+12%", price: "$650/sqft" }, { name: "Wynwood", growth: "+10%", price: "$500/sqft" }, { name: "Doral", growth: "+8%", price: "$350/sqft" }], priceHistory: [100, 108, 118, 128, 135, 140, 148, 155] },
    ],
  },
  {
    name: "Singapore", flag: "🇸🇬", code: "SG", color: "#ef4444",
    heatScore: 75, affordability: "Low", rentalYield: "3-4%",
    growthSentiment: "Neutral", infraScore: 98, avgGrowth: "+5-8%/yr",
    mortgageRate: "3.5-4.5%", currency: "SGD",
    aiSummary: "One of the most expensive property markets globally. Government cooling measures (ABSD tax for foreigners = 60%) make it tough for foreign investors, but the local market remains strong with limited land supply.",
    keyFacts: ["60% stamp duty for foreign buyers", "Very limited land supply", "World-class infrastructure", "Strong rental demand from expats"],
    priceIndex: [100, 104, 108, 113, 118, 122, 126, 130],
    cities: [
      { name: "Singapore City", emoji: "🏢", growthScore: 72, rentalYield: "3-4%", avgPrice: "SGD 1,800-3,500/sqft", affordability: "Low", migration: "Rising", infraProjects: ["Cross Island Line", "Greater Southern Waterfront", "Jurong Lake District", "Changi T5"], investScore: 70, trend: "stable", aiSummary: "Ultra-premium market with strong fundamentals. District 9-10 (Orchard, River Valley) are the most expensive. HDB resale market offers more affordable entry for citizens.", localities: [{ name: "Orchard", growth: "+5%", price: "SGD 3,200/sqft" }, { name: "Jurong East", growth: "+8%", price: "SGD 1,600/sqft" }, { name: "Punggol", growth: "+6%", price: "SGD 1,400/sqft" }], priceHistory: [100, 103, 107, 112, 116, 120, 124, 128] },
    ],
  },
  {
    name: "UK", flag: "🇬🇧", code: "GB", color: "#6366f1",
    heatScore: 58, affordability: "Low", rentalYield: "3.5-5.5%",
    growthSentiment: "Neutral", infraScore: 80, avgGrowth: "+2-5%/yr",
    mortgageRate: "5-6%", currency: "GBP",
    aiSummary: "London remains a global real estate hub but prices have stagnated. Northern cities like Manchester and Birmingham offer better yields. Student housing and BTL (buy-to-let) are popular strategies.",
    keyFacts: ["London prices flattening", "Northern cities outperforming", "Strong student housing demand", "Stamp duty reforms impacting market"],
    priceIndex: [100, 102, 104, 105, 106, 108, 110, 112],
    cities: [
      { name: "London", emoji: "📷", growthScore: 55, rentalYield: "3-4%", avgPrice: "£500-1,200/sqft", affordability: "Low", migration: "Stable", infraProjects: ["Crossrail 2 (proposed)", "HS2 Terminal", "Nine Elms Regeneration", "Canary Wharf Expansion"], investScore: 60, trend: "stable", aiSummary: "Global financial capital but prices have plateaued. East London and Zones 3-4 offer better value. Strong rental demand from professionals.", localities: [{ name: "Canary Wharf", growth: "+3%", price: "£750/sqft" }, { name: "Stratford", growth: "+6%", price: "£550/sqft" }, { name: "Croydon", growth: "+4%", price: "£400/sqft" }], priceHistory: [100, 101, 103, 104, 105, 107, 109, 111] },
      { name: "Manchester", emoji: "⚽", growthScore: 78, rentalYield: "5-7%", avgPrice: "£200-400/sqft", affordability: "High", migration: "Rising", infraProjects: ["HS2 Terminal", "Airport Expansion", "Salford Quays Development", "Northern Powerhouse Rail"], investScore: 82, trend: "up", aiSummary: "UK's hottest property market outside London. Strong university sector, growing tech scene, and HS2 connectivity drive demand. Much more affordable than London with better yields.", localities: [{ name: "City Centre", growth: "+8%", price: "£380/sqft" }, { name: "Salford", growth: "+10%", price: "£280/sqft" }, { name: "Ancoats", growth: "+12%", price: "£350/sqft" }], priceHistory: [100, 105, 110, 114, 119, 125, 131, 138] },
    ],
  },
  {
    name: "Japan", flag: "🇯🇵", code: "JP", color: "#dc2626",
    heatScore: 70, affordability: "Medium", rentalYield: "3-5%",
    growthSentiment: "Bullish", infraScore: 92, avgGrowth: "+5-10%/yr",
    mortgageRate: "1-2%", currency: "JPY",
    aiSummary: "Japan's property market is experiencing a resurgence after decades of stagnation. Weak yen makes it attractive for foreign investors. Tokyo and Osaka are seeing strong demand, especially in luxury segments.",
    keyFacts: ["Ultra-low mortgage rates (1-2%)", "Weak yen attracts foreign buyers", "No restrictions on foreign ownership", "Tokyo property prices at 30-year highs"],
    priceIndex: [100, 103, 107, 112, 118, 125, 133, 140],
    cities: [
      { name: "Tokyo", emoji: "🗼", growthScore: 82, rentalYield: "3-4.5%", avgPrice: "¥50,000-120,000/sqft", affordability: "Medium", migration: "Stable", infraProjects: ["Maglev Shinkansen (Tokyo-Nagoya)", "Shibuya Redevelopment", "Takanawa Gateway", "Olympic Legacy Sites"], investScore: 80, trend: "up", aiSummary: "World's largest metropolitan area. Property prices are at 30-year highs but still 30% below 1990 bubble peak. Minato, Shibuya, and Chuo wards are premium.", localities: [{ name: "Minato", growth: "+10%", price: "¥110,000/sqft" }, { name: "Shibuya", growth: "+8%", price: "¥90,000/sqft" }, { name: "Ota (Kamata)", growth: "+12%", price: "¥55,000/sqft" }], priceHistory: [100, 104, 109, 115, 122, 130, 138, 145] },
    ],
  },
  {
    name: "Canada", flag: "🇨🇦", code: "CA", color: "#ef4444",
    heatScore: 55, affordability: "Low", rentalYield: "3-4.5%",
    growthSentiment: "Bearish", infraScore: 78, avgGrowth: "+1-3%/yr",
    mortgageRate: "5-6.5%", currency: "CAD",
    aiSummary: "Canadian market cooling after years of overheating. High mortgage rates and government measures against foreign buyers have slowed growth. Toronto and Vancouver remain expensive, but Calgary and Ottawa offer value.",
    keyFacts: ["Foreign buyer ban until 2027", "High mortgage rates slowing market", "Immigration drives rental demand", "Calgary and Ottawa outperforming"],
    priceIndex: [100, 115, 125, 130, 128, 125, 123, 122],
    cities: [
      { name: "Toronto", emoji: "🏢", growthScore: 50, rentalYield: "3-4%", avgPrice: "CAD 800-1,200/sqft", affordability: "Low", migration: "Stable", infraProjects: ["Ontario Line (subway)", "Eglinton Crosstown LRT", "Waterfront Redevelopment"], investScore: 55, trend: "down", aiSummary: "Canada's largest market undergoing correction. Prices down 15% from 2022 peak. Condo oversupply in downtown area. Suburban markets more resilient.", localities: [{ name: "Downtown Core", growth: "-3%", price: "CAD 1,100/sqft" }, { name: "North York", growth: "+2%", price: "CAD 850/sqft" }, { name: "Scarborough", growth: "+4%", price: "CAD 650/sqft" }], priceHistory: [100, 118, 130, 135, 128, 122, 118, 116] },
    ],
  },
  {
    name: "Australia", flag: "🇦🇺", code: "AU", color: "#f59e0b",
    heatScore: 72, affordability: "Low", rentalYield: "3.5-5%",
    growthSentiment: "Neutral", infraScore: 85, avgGrowth: "+4-7%/yr",
    mortgageRate: "5.5-6.5%", currency: "AUD",
    aiSummary: "Australian housing has rebounded despite high rates, driven by record immigration and housing shortage. Sydney and Melbourne are expensive, but Brisbane and Perth offer better value and growth potential.",
    keyFacts: ["Severe housing shortage", "Record immigration driving demand", "Brisbane Olympics 2032 boost", "Perth emerging as investment hotspot"],
    priceIndex: [100, 108, 115, 118, 115, 118, 124, 130],
    cities: [
      { name: "Sydney", emoji: "🎬", growthScore: 68, rentalYield: "3-4%", avgPrice: "AUD 800-1,500/sqft", affordability: "Low", migration: "Rising", infraProjects: ["Sydney Metro West", "Western Sydney Airport", "WestConnex Motorway"], investScore: 65, trend: "up", aiSummary: "Most expensive Australian city. Western Sydney is the growth frontier with the new airport. North Shore and Eastern Suburbs are premium.", localities: [{ name: "Parramatta", growth: "+8%", price: "AUD 700/sqft" }, { name: "Blacktown", growth: "+10%", price: "AUD 500/sqft" }, { name: "Eastern Suburbs", growth: "+5%", price: "AUD 1,400/sqft" }], priceHistory: [100, 108, 115, 118, 114, 118, 125, 132] },
    ],
  },
  {
    name: "Saudi Arabia", flag: "🇸🇦", code: "SA", color: "#059669",
    heatScore: 85, affordability: "Medium", rentalYield: "5-7%",
    growthSentiment: "Bullish", infraScore: 88, avgGrowth: "+10-18%/yr",
    mortgageRate: "5-6%", currency: "SAR",
    aiSummary: "Saudi Arabia's Vision 2030 is transforming the real estate landscape. NEOM, The Line, and Riyadh's expansion plan are driving unprecedented investment. Foreign investors can now own property in designated areas.",
    keyFacts: ["Vision 2030 mega-projects", "NEOM and The Line projects", "Riyadh population target: 15M by 2030", "New foreign ownership rules"],
    priceIndex: [100, 105, 112, 120, 130, 142, 155, 170],
    cities: [
      { name: "Riyadh", emoji: "🏙️", growthScore: 88, rentalYield: "5-7%", avgPrice: "SAR 3,000-7,000/sqft", affordability: "Medium", migration: "Rising", infraProjects: ["Riyadh Metro (6 lines)", "King Salman Park", "KAFD Financial District", "Diriyah Gate"], investScore: 90, trend: "up", aiSummary: "Capital city with massive government investment. Population expected to nearly double by 2030. Office and residential demand exploding as companies relocate their regional HQs here.", localities: [{ name: "KAFD", growth: "+20%", price: "SAR 6,500/sqft" }, { name: "Al Malqa", growth: "+15%", price: "SAR 4,000/sqft" }, { name: "North Riyadh", growth: "+18%", price: "SAR 3,500/sqft" }], priceHistory: [100, 108, 118, 128, 140, 155, 170, 185] },
    ],
  },
];

/* ── Heatmap score color ─────────────────────────────────────── */
function heatColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 65) return "#f59e0b";
  if (score >= 50) return "#f97316";
  return "#dc2626";
}

function heatLabel(score: number): string {
  if (score >= 80) return "Hot Market";
  if (score >= 65) return "Warm Market";
  if (score >= 50) return "Cooling";
  return "Cold Market";
}

function trendArrow(t: "up" | "stable" | "down") {
  return t === "up" ? "↗️" : t === "stable" ? "↔️" : "↘️";
}

/* ── Mini Sparkline (SVG) ────────────────────────────────────── */
function Sparkline({ data, color, width = 80, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  const isUp = data[data.length - 1] > data[0];
  const c = isUp ? color : "#dc2626";
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${data.join("")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity={0.15} />
          <stop offset="100%" stopColor={c} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#sg-${data.join("")})`} />
      <polyline points={points} fill="none" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Score Ring ───────────────────────────────────────────────── */
function ScoreRing({ score, size = 48, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = heatColor(score);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={size * 0.3} fontWeight={800} fill={color} style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>{score}</text>
      </svg>
      {label && <span style={{ fontSize: "0.5rem", color: COLORS.textDim, fontWeight: 600 }}>{label}</span>}
    </div>
  );
}

/* ── Fullscreen City Analysis Modal ──────────────────────────── */
function CityAnalysisModal({ city, country, onClose }: { city: CityData; country: CountryData; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 900, maxHeight: "90vh", background: "#fff", borderRadius: 20, overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>{city.emoji}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900 }}>{city.name}</h2>
              <span style={{ fontSize: "0.68rem", color: COLORS.textMuted }}>{country.flag} {country.name} · {country.currency}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${COLORS.cardBorder}`, background: COLORS.card, cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>

        <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Score Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
            <StatCard label="Growth Score" value={`${city.growthScore}/100`} color={heatColor(city.growthScore)} />
            <StatCard label="Rental Yield" value={city.rentalYield} color={COLORS.accent} />
            <StatCard label="Invest Score" value={`${city.investScore}/100`} color={heatColor(city.investScore)} />
            <StatCard label="Affordability" value={city.affordability} color={city.affordability === "High" ? COLORS.accent : city.affordability === "Medium" ? COLORS.amber : COLORS.red} />
          </div>

          {/* Price Trend Chart */}
          <div style={{ ...card({ padding: "20px" }) }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>📈 Price Trend (8 quarters)</div>
              <span style={{ fontSize: "0.62rem", color: COLORS.accent, fontWeight: 700 }}>{trendArrow(city.trend)} {city.avgPrice}</span>
            </div>
            <Sparkline data={city.priceHistory} color={country.color} width={400} height={60} />
          </div>

          {/* AI Summary */}
          <AIExplanation emoji="🤖" text={city.aiSummary} />

          {/* Infrastructure Projects */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 10 }}>🚧 Infrastructure Projects</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {city.infraProjects.map(p => (
                <div key={p} style={{ padding: "10px 14px", borderRadius: 10, background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`, fontSize: "0.72rem", color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.6rem" }}>✅</span> {p}
                </div>
              ))}
            </div>
          </div>

          {/* Top Localities */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 10 }}>📍 Top Localities</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {city.localities.map(loc => (
                <div key={loc.name} style={{ ...card({ padding: "14px 16px" }), display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>{loc.name}</div>
                    <div style={{ fontSize: "0.62rem", color: COLORS.textMuted }}>{loc.price}</div>
                  </div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: loc.growth.startsWith("-") ? COLORS.red : COLORS.accent }}>{loc.growth}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What This Means */}
          <WhatThisMeansCard text={
            city.investScore >= 85
              ? `${city.name} is one of the strongest investment destinations right now. High migration, infrastructure development, and growing demand make it attractive for both rental income and capital appreciation.`
              : city.investScore >= 70
              ? `${city.name} offers moderate investment potential. Look for emerging localities near infrastructure projects for the best value. Consider rental demand before investing.`
              : `${city.name} is currently in a slow phase. Consider waiting for better entry points or focus on high-yield rental areas. The market may take time to appreciate significantly.`
          } />

          {/* Key Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ padding: "12px", borderRadius: 10, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, fontSize: "0.65rem" }}>
              <span style={{ color: COLORS.textDim }}>Migration:</span>{" "}
              <span style={{ fontWeight: 700, color: city.migration === "Rising" ? COLORS.accent : city.migration === "Declining" ? COLORS.red : COLORS.amber }}>{city.migration}</span>
            </div>
            <div style={{ padding: "12px", borderRadius: 10, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, fontSize: "0.65rem" }}>
              <span style={{ color: COLORS.textDim }}>Mortgage Rate:</span>{" "}
              <span style={{ fontWeight: 700 }}>{country.mortgageRate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Fullscreen Country Modal ────────────────────────────────── */
function CountryModal({ country, onClose, onCityClick }: { country: CountryData; onClose: () => void; onCityClick: (city: CityData) => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 920, maxHeight: "90vh", background: "#fff", borderRadius: 20, overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${COLORS.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "2rem" }}>{country.flag}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900 }}>{country.name} Real Estate</h2>
              <span style={{ fontSize: "0.68rem", color: COLORS.textMuted }}>Currency: {country.currency} · Mortgage: {country.mortgageRate}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${COLORS.cardBorder}`, background: COLORS.card, cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>

        <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Country Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10 }}>
            <div style={{ textAlign: "center", padding: 14, borderRadius: 12, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }}>
              <ScoreRing score={country.heatScore} size={52} />
              <div style={{ fontSize: "0.52rem", color: COLORS.textDim, fontWeight: 600, marginTop: 4 }}>Heat Score</div>
            </div>
            <StatCard label="Rental Yield" value={country.rentalYield} color={COLORS.accent} />
            <StatCard label="Avg Growth" value={country.avgGrowth} color={country.growthSentiment === "Bullish" ? COLORS.accent : country.growthSentiment === "Bearish" ? COLORS.red : COLORS.amber} />
            <StatCard label="Infra Score" value={`${country.infraScore}/100`} color={heatColor(country.infraScore)} />
            <StatCard label="Sentiment" value={country.growthSentiment} color={country.growthSentiment === "Bullish" ? COLORS.accent : country.growthSentiment === "Bearish" ? COLORS.red : COLORS.amber} />
          </div>

          {/* Price Index */}
          <div style={{ ...card({ padding: "20px" }) }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 12 }}>📈 Property Price Index (8 quarters)</div>
            <Sparkline data={country.priceIndex} color={country.color} width={400} height={60} />
          </div>

          {/* AI Summary */}
          <AIExplanation emoji="🤖" text={country.aiSummary} />

          {/* Key Facts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {country.keyFacts.map(f => (
              <div key={f} style={{ padding: "10px 14px", borderRadius: 10, background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`, fontSize: "0.68rem", color: COLORS.textSecondary, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: "0.55rem" }}>✨</span> {f}
              </div>
            ))}
          </div>

          {/* Cities */}
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, marginBottom: 14 }}>🏙️ Top Cities</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {country.cities.map(city => (
                <div key={city.name} onClick={() => onCityClick(city)} style={{ ...card({ padding: "18px", cursor: "pointer" }), borderLeft: `3px solid ${heatColor(city.investScore)}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "1.3rem" }}>{city.emoji}</span>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>{city.name}</div>
                        <div style={{ fontSize: "0.58rem", color: COLORS.textMuted }}>{city.avgPrice}</div>
                      </div>
                    </div>
                    <ScoreRing score={city.investScore} size={40} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    <span style={{ fontSize: "0.52rem", padding: "3px 7px", borderRadius: 6, background: COLORS.accentSoft, color: COLORS.accent, fontWeight: 600 }}>Yield: {city.rentalYield}</span>
                    <span style={{ fontSize: "0.52rem", padding: "3px 7px", borderRadius: 6, background: city.trend === "up" ? COLORS.greenSoft : city.trend === "down" ? COLORS.redSoft : COLORS.amberSoft, color: city.trend === "up" ? COLORS.accent : city.trend === "down" ? COLORS.red : COLORS.amber, fontWeight: 600 }}>{trendArrow(city.trend)} {city.trend}</span>
                  </div>
                  <Sparkline data={city.priceHistory} color={heatColor(city.investScore)} width={200} height={28} />
                  <div style={{ marginTop: 8, fontSize: "0.62rem", color: COLORS.blue, fontWeight: 600 }}>View Analysis →</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function BeginnerRealEstate() {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [heatFilter, setHeatFilter] = useState<"growth" | "yield" | "afford" | "infra">("growth");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const sortedCountries = useMemo(() => {
    return [...COUNTRIES].sort((a, b) => {
      if (heatFilter === "growth") return b.heatScore - a.heatScore;
      if (heatFilter === "yield") return parseFloat(b.rentalYield) - parseFloat(a.rentalYield);
      if (heatFilter === "infra") return b.infraScore - a.infraScore;
      return a.affordability === "High" ? -1 : b.affordability === "High" ? 1 : 0;
    });
  }, [heatFilter]);

  const heatFilterTabs = [
    { id: "growth", label: "Growth", emoji: "📈" },
    { id: "yield", label: "Yield", emoji: "💰" },
    { id: "afford", label: "Affordability", emoji: "🏠" },
    { id: "infra", label: "Infrastructure", emoji: "🚧" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Modals */}
      {selectedCity && selectedCountry && (
        <CityAnalysisModal city={selectedCity} country={selectedCountry} onClose={() => setSelectedCity(null)} />
      )}
      {selectedCountry && !selectedCity && (
        <CountryModal country={selectedCountry} onClose={() => setSelectedCountry(null)} onCityClick={c => setSelectedCity(c)} />
      )}

      {/* Hero AI Explanation */}
      <AIExplanation
        emoji="🌍"
        text="Real estate is the world's largest asset class worth over $380 trillion. This dashboard helps you explore property markets across countries and cities, understand growth drivers, and discover where smart money is flowing — all explained in simple language."
      />

      {/* ── GLOBAL HEATMAP ── */}
      <div>
        <SectionHeader emoji="🗺️" title="Global Real Estate Heatmap" subtitle="See which markets are hot, warm, or cooling" />
        <PillTabs tabs={heatFilterTabs} active={heatFilter} onSelect={id => setHeatFilter(id as typeof heatFilter)} />
        <div style={{ marginTop: 14, ...card({ padding: "20px", background: "linear-gradient(135deg, rgba(5,150,105,0.02), rgba(79,70,229,0.02))" }) }}>
          {/* Visual Heatmap Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, marginBottom: 16 }}>
            {sortedCountries.map(c => {
              const score = heatFilter === "growth" ? c.heatScore : heatFilter === "infra" ? c.infraScore : heatFilter === "yield" ? Math.round(parseFloat(c.rentalYield) * 10) : c.affordability === "High" ? 85 : c.affordability === "Medium" ? 55 : 30;
              const bgColor = heatColor(score);
              const isHovered = hoveredCountry === c.code;
              return (
                <div
                  key={c.code}
                  onClick={() => setSelectedCountry(c)}
                  onMouseEnter={() => setHoveredCountry(c.code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  style={{
                    padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                    background: `linear-gradient(135deg, ${bgColor}15, ${bgColor}08)`,
                    border: `2px solid ${isHovered ? bgColor : bgColor + "30"}`,
                    textAlign: "center", transition: "all 0.25s",
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    boxShadow: isHovered ? `0 4px 16px ${bgColor}30` : "none",
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{c.flag}</div>
                  <div style={{ fontSize: "0.62rem", fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 800, color: bgColor, padding: "2px 6px", borderRadius: 6, background: `${bgColor}15`, display: "inline-block" }}>
                    {score}
                  </div>
                  {isHovered && (
                    <div style={{ marginTop: 6, fontSize: "0.5rem", color: COLORS.textMuted }}>
                      {heatLabel(score)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 8, borderTop: `1px solid ${COLORS.divider}` }}>
            {[{ c: "#059669", l: "Hot (80+)" }, { c: "#f59e0b", l: "Warm (65-79)" }, { c: "#f97316", l: "Cooling (50-64)" }, { c: "#dc2626", l: "Cold (<50)" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: x.c }} />
                <span style={{ fontSize: "0.52rem", color: COLORS.textDim }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COUNTRY CARDS ── */}
      <div>
        <SectionHeader emoji="🌏" title="Explore Countries" subtitle="Tap any country for detailed city-level analysis" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {COUNTRIES.map(c => (
            <div
              key={c.code}
              onClick={() => setSelectedCountry(c)}
              style={{
                ...card({ padding: "20px", cursor: "pointer" }),
                borderLeft: `4px solid ${c.color}`,
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.8rem" }}>{c.flag}</span>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 800 }}>{c.name}</div>
                    <div style={{ fontSize: "0.6rem", color: COLORS.textMuted }}>{c.cities.length} cities · {c.currency}</div>
                  </div>
                </div>
                <ScoreRing score={c.heatScore} size={44} />
              </div>

              {/* Mini chart */}
              <div style={{ marginBottom: 12 }}>
                <Sparkline data={c.priceIndex} color={c.color} width={220} height={30} />
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{ fontSize: "0.52rem", padding: "3px 8px", borderRadius: 6, background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}`, color: COLORS.accent, fontWeight: 600 }}>💰 {c.rentalYield}</span>
                <span style={{ fontSize: "0.52rem", padding: "3px 8px", borderRadius: 6, background: c.growthSentiment === "Bullish" ? COLORS.greenSoft : c.growthSentiment === "Bearish" ? COLORS.redSoft : COLORS.amberSoft, color: c.growthSentiment === "Bullish" ? COLORS.accent : c.growthSentiment === "Bearish" ? COLORS.red : COLORS.amber, fontWeight: 600 }}>{c.growthSentiment}</span>
                <span style={{ fontSize: "0.52rem", padding: "3px 8px", borderRadius: 6, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textDim, fontWeight: 600 }}>{c.avgGrowth}</span>
              </div>

              {/* Affordability bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: "0.55rem", color: COLORS.textDim }}>Affordability</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.06)" }}>
                  <div style={{ width: c.affordability === "High" ? "80%" : c.affordability === "Medium" ? "50%" : "25%", height: "100%", borderRadius: 2, background: c.affordability === "High" ? COLORS.accent : c.affordability === "Medium" ? COLORS.amber : COLORS.red, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: "0.52rem", fontWeight: 700, color: c.affordability === "High" ? COLORS.accent : c.affordability === "Medium" ? COLORS.amber : COLORS.red }}>{c.affordability}</span>
              </div>

              <div style={{ fontSize: "0.62rem", color: COLORS.blue, fontWeight: 600, textAlign: "right" }}>Explore {c.name} →</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RENTAL YIELD EXPLAINED ── */}
      <div style={{ ...card({ background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.04))", border: `1px solid ${COLORS.accentBorder}` }) }}>
        <SectionHeader emoji="🧮" title="Understanding Rental Yield" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {[
            { step: "1", text: "You buy a flat for ₹50 lakh" },
            { step: "2", text: "You rent it out for ₹15,000/month = ₹1.8 lakh/year" },
            { step: "3", text: "Rental Yield = (₹1.8L ÷ ₹50L) × 100 = 3.6%" },
            { step: "4", text: "Total return = Rental Yield (3.6%) + Price Appreciation (8-12%)" },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: COLORS.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 800, color: COLORS.accent, flexShrink: 0 }}>{s.step}</div>
              <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{s.text}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <AIExplanation text="In India, rental yields are typically 2-4%. The real money in real estate comes from price appreciation over 5-10 years. Location and infrastructure development are the biggest drivers. In Dubai, yields can reach 5-8% making it one of the best markets for rental income." />
        </div>
      </div>

      {/* ── COMPARISON TABLE ── */}
      <div>
        <SectionHeader emoji="⚖️" title="Real Estate vs Other Investments" />
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, auto)", gap: 0, minWidth: 500, fontSize: "0.62rem" }}>
            {["Investment", "Returns", "Liquidity", "Min. Amount", "Effort", "Risk"].map(h => (
              <div key={h} style={{ padding: "10px 12px", background: "rgba(0,0,0,0.03)", fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", fontSize: "0.52rem", borderBottom: `1px solid ${COLORS.cardBorder}` }}>{h}</div>
            ))}
            {[
              { label: "Stocks", returns: "12-15%", liquidity: "High (sell anytime)", minInvest: "₹500", effort: "Low", risk: "Medium" },
              { label: "Real Estate", returns: "8-12%", liquidity: "Very Low (months)", minInvest: "₹20L+", effort: "High", risk: "Low-Medium" },
              { label: "REITs", returns: "8-12%", liquidity: "High (listed)", minInvest: "₹300", effort: "Low", risk: "Medium" },
              { label: "Gold", returns: "8-10%", liquidity: "Medium", minInvest: "₹1,000", effort: "Low", risk: "Low" },
              { label: "FD", returns: "6-7%", liquidity: "Low (penalty)", minInvest: "₹1,000", effort: "None", risk: "Very Low" },
            ].map(row => (
              [row.label, row.returns, row.liquidity, row.minInvest, row.effort, row.risk].map((val, i) => (
                <div key={`${row.label}-${i}`} style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.cardBorder}`, color: i === 0 ? COLORS.textPrimary : COLORS.textSecondary, fontWeight: i === 0 ? 700 : 400 }}>{val}</div>
              ))
            ))}
          </div>
        </div>
      </div>

      {/* ── BEGINNER TIPS ── */}
      <WhatThisMeansCard text="For beginners: Start with REITs (Real Estate Investment Trusts) — they let you invest in real estate with just ₹300-500. India has 4 REITs: Embassy, Mindspace, Brookfield, and Nexus Select Trust. You get rental income as dividends and property appreciation — without the hassle of buying property." />

      {/* ── FAQ ── */}
      <div>
        <SectionHeader emoji="❓" title="Common Questions" />
        <Accordion items={[
          { title: "Is buying a house a good investment?", emoji: "🏠", content: "It depends on your situation. For living: Yes, owning saves rent and gives stability. As investment: Returns are good (8-12% total) but the money is locked for years. You need ₹20L+ upfront and pay EMIs for 15-20 years. Stocks and MFs give similar returns with much more liquidity." },
          { title: "What about REITs?", emoji: "🏢", content: "REITs (Real Estate Investment Trusts) let you invest in real estate with just ₹300-500. They own office buildings and malls, and pay 90% of rent income as dividends. Think of it as a mutual fund for real estate. India has 4 REITs: Embassy, Mindspace, Brookfield, Nexus Select Trust." },
          { title: "Should I invest in Dubai or India?", emoji: "🌍", content: "Dubai offers higher rental yields (5-8%) and zero income tax, but requires larger capital. Indian property is better for first-time buyers with growing appreciation potential. For small investors, Indian REITs or SIPs in real estate funds are the best starting point." },
          { title: "How does infrastructure impact property prices?", emoji: "🚇", content: "Infrastructure like metro lines, airports, and highways can boost property prices 20-50% in surrounding areas. Properties within 2km of a new metro station typically see 15-25% appreciation over 2-3 years. Always look for areas with upcoming infrastructure projects." },
        ]} />
      </div>

      <UpsellBanner text="Access AI real estate analytics, live price tracking, and city growth predictions in Advanced Mode" />
    </div>
  );
}
