"use client";
import { useState, useMemo } from "react";
import { BEGINNER_STOCKS } from "@/app/beginner/data/stocks";
import { DAILY_CONCEPTS } from "@/app/beginner/data/concepts";
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES } from "@/app/beginner/data/glossary";
import { getGreeting, isMarketOpen, getMarketMood } from "@/app/beginner/utils/greeting";
import { useStockPrices } from "@/hooks/useMarketData";
import { COLORS, card, SectionHeader, AIExplanation, Disclaimer } from "./shared";
import { LearnTerm } from "./LearnTooltips";

/* ═══════════════════════════════════════════════════════════════
   BEGINNER HOME TAB
   Welcome header, market mood, daily concept, glossary,
   and quick overview for first-time investors.
   ═══════════════════════════════════════════════════════════════ */

function MoodGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180;
  const r = 80, cx = 100, cy = 90;
  const rad = (a: number) => ((a - 180) * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad(angle));
  const ny = cy + r * Math.sin(rad(angle));
  return (
    <svg viewBox="0 0 200 110" style={{ width: "100%", maxWidth: 240 }}>
      <defs>
        <linearGradient id="hMoodArc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ef4444" /><stop offset="25%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#f59e0b" /><stop offset="75%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="url(#hMoodArc)" strokeWidth="14" strokeLinecap="round" />
      <circle cx={nx} cy={ny} r="8" fill="#fff" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
      <circle cx={nx} cy={ny} r="4" fill="#059669" />
    </svg>
  );
}

export default function BeginnerHome() {
  const { data: liveStocks } = useStockPrices();
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategory, setGlossaryCategory] = useState("all");
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  const niftyChange = useMemo(() => liveStocks["NIFTY50"]?.changePercent || 0.45, [liveStocks]);
  const niftyPrice = useMemo(() => liveStocks["NIFTY50"]?.price || 24850, [liveStocks]);
  const sensexPrice = useMemo(() => liveStocks["SENSEX"]?.price || 81200, [liveStocks]);
  const sensexChange = useMemo(() => liveStocks["SENSEX"]?.changePercent || 0.38, [liveStocks]);
  const mood = useMemo(() => getMarketMood(niftyChange), [niftyChange]);
  const greeting = useMemo(() => getGreeting(), []);
  const marketStatus = useMemo(() => isMarketOpen(), []);
  const todayConcept = useMemo(() => DAILY_CONCEPTS.find(c => c.day === new Date().getDay()) || DAILY_CONCEPTS[0], []);

  const topMovers = useMemo(() => {
    return BEGINNER_STOCKS.map(s => {
      const live = liveStocks[s.ticker];
      return { ...s, currentPrice: live?.price || s.currentPrice, changePercent: live?.changePercent ?? s.changePercent };
    }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 4);
  }, [liveStocks]);

  const filteredGlossary = useMemo(() => {
    return GLOSSARY_TERMS.filter(t => {
      if (glossaryCategory !== "all" && t.category !== glossaryCategory) return false;
      if (glossarySearch.trim()) {
        const q = glossarySearch.toLowerCase();
        return t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
      }
      return true;
    });
  }, [glossarySearch, glossaryCategory]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── WELCOME HEADER ── */}
      <div>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 900, marginBottom: 2 }}>
          {greeting}, Investor! <span role="img" aria-label="wave">&#128075;</span>
        </h1>
        <p style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>Here&apos;s what&apos;s happening in the markets today</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: marketStatus.color, boxShadow: marketStatus.open ? `0 0 8px ${marketStatus.color}` : "none" }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: marketStatus.color }}>{marketStatus.label}</span>
          <span style={{ fontSize: "0.62rem", color: COLORS.textDim }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* ── MARKET MOOD ── */}
      <div style={{ ...card({ textAlign: "center", padding: "28px 20px" }) }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Market Mood Today</div>
        <MoodGauge score={mood.score} />
        <div style={{ fontSize: "2rem", marginBottom: 4 }}>{mood.emoji}</div>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: mood.color, marginBottom: 6 }}>{mood.label}</div>
        <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.6, maxWidth: 360, margin: "0 auto 20px" }}>{mood.message}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "NIFTY 50", value: niftyPrice, change: niftyChange },
            { label: "SENSEX", value: sensexPrice, change: sensexChange },
          ].map(idx => (
            <div key={idx.label} style={{ padding: "14px 12px", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.cardBorder}` }}>
              <div style={{ fontSize: "0.55rem", color: COLORS.textDim, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>{idx.label}</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 900 }}>{idx.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: idx.change >= 0 ? COLORS.accent : COLORS.red }}>
                {idx.change >= 0 ? "▲" : "▼"} {Math.abs(idx.change).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
        <Disclaimer />
      </div>

      {/* ── AI DAILY EXPLANATION ── */}
      <AIExplanation
        emoji="🧠"
        text={mood.score >= 50
          ? `Markets are positive today because major sectors like banking and IT are showing green. ${niftyChange > 1 ? "FII buying is supporting the rally." : "This is a normal positive day — stay invested and let compounding work."}`
          : `Markets are slightly down today — this is perfectly normal. ${niftyChange < -1 ? "Global uncertainty is weighing on sentiments." : "Small dips happen regularly and often recover within days."} Don't panic — long-term investors benefit from buying during dips.`
        }
      />

      {/* ── TOP MOVERS TODAY ── */}
      <div>
        <SectionHeader emoji="🔥" title="Top Movers Today" subtitle="Stocks making the biggest moves right now" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {topMovers.map(s => (
            <div key={s.ticker} style={{ ...card({ padding: "14px" }) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.sectorColor}15`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.72rem", color: s.sectorColor }}>{s.name[0]}</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>{s.name}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 900 }}>&#8377;{s.currentPrice.toLocaleString("en-IN")}</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: s.changePercent >= 0 ? COLORS.accent : COLORS.red }}>
                  {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DAILY CONCEPT ── */}
      <div style={{
        ...card({ background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(79,70,229,0.02))", border: `1px solid ${COLORS.purpleBorder}` }),
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: "1.3rem" }}>{todayConcept.emoji}</span>
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, color: COLORS.purple, textTransform: "uppercase", letterSpacing: "0.08em" }}>Today&apos;s Concept</div>
            <div style={{ fontSize: "1rem", fontWeight: 800 }}>{todayConcept.question}</div>
          </div>
        </div>
        <p style={{ fontSize: "0.82rem", color: COLORS.textSecondary, lineHeight: 1.7, marginBottom: 12 }}>{todayConcept.explanation}</p>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: COLORS.bg, marginBottom: 12 }}>
          <div style={{ fontSize: "0.62rem", color: COLORS.purple, fontWeight: 700, marginBottom: 4 }}>&#128161; Think of it like...</div>
          <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.6, margin: 0 }}>{todayConcept.analogy}</p>
        </div>
        <div style={{ padding: "10px 14px", borderRadius: 10, background: COLORS.accentSoft, border: `1px solid ${COLORS.accentBorder}` }}>
          <p style={{ fontSize: "0.72rem", color: COLORS.accent, margin: 0, fontWeight: 600 }}>&#127919; {todayConcept.funFact}</p>
        </div>
      </div>

      {/* ── MARKET JARGON GLOSSARY ── */}
      <div>
        <SectionHeader emoji="📖" title="Market Jargon Decoded" subtitle="Tap any term for a simple explanation" />
        <div style={{ marginBottom: 12 }}>
          <input type="text" value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)} placeholder="Search terms..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: COLORS.bg, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textPrimary, fontSize: "0.78rem", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {GLOSSARY_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setGlossaryCategory(cat.id)} style={{
              padding: "6px 12px", borderRadius: 20, border: "1px solid",
              borderColor: glossaryCategory === cat.id ? COLORS.accent : COLORS.cardBorder,
              background: glossaryCategory === cat.id ? COLORS.accentSoft : "transparent",
              color: glossaryCategory === cat.id ? COLORS.accent : COLORS.textMuted,
              fontSize: "0.62rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
            }}>{cat.emoji} {cat.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredGlossary.slice(0, 12).map(term => {
            const isOpen = expandedTerms.has(term.term);
            return (
              <div key={term.term} onClick={() => {
                const next = new Set(expandedTerms);
                isOpen ? next.delete(term.term) : next.add(term.term);
                setExpandedTerms(next);
              }} style={{
                ...card({ padding: "12px 14px", cursor: "pointer", transition: "all 0.2s" }),
                borderColor: isOpen ? COLORS.accentBorder : COLORS.cardBorder,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1rem" }}>{term.emoji}</span>
                    <div>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{term.term}</span>
                      <span style={{ fontSize: "0.62rem", color: COLORS.textDim, marginLeft: 6 }}>({term.hindi})</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: COLORS.textDim, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>&#9660;</span>
                </div>
                {isOpen && (
                  <p style={{ fontSize: "0.78rem", color: COLORS.textSecondary, lineHeight: 1.7, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.divider}` }}>
                    {term.definition}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
