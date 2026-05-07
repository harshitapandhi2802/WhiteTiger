"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { TrendingUp, ArrowLeft, Search, AlertCircle, Zap, ChevronDown } from "lucide-react";
import { getUsage, incrementUsage, canAnalyze, remainingAnalyses } from "@/lib/usage";

const POPULAR_STOCKS = [
  { ticker: "RELIANCE.NS", name: "Reliance Industries" },
  { ticker: "TCS.NS", name: "TCS" },
  { ticker: "HDFCBANK.NS", name: "HDFC Bank" },
  { ticker: "INFY.NS", name: "Infosys" },
  { ticker: "ADANIENT.NS", name: "Adani Enterprises" },
  { ticker: "TATAMOTORS.NS", name: "Tata Motors" },
  { ticker: "WIPRO.NS", name: "Wipro" },
  { ticker: "ITC.NS", name: "ITC" },
];

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++}>{line.slice(4)}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <ul key={key++} style={{ margin: "0.2rem 0", paddingLeft: "1.4rem" }}>
          <li dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
        </ul>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.5rem 0" }} />);
    } else if (line.trim()) {
      elements.push(
        <p key={key++} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    }
  }
  return elements;
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code style='background:rgba(99,102,241,0.1);padding:2px 6px;border-radius:4px;font-size:0.85em'>$1</code>");
}

function getRatingBadge(analysis: string) {
  const upper = analysis.toUpperCase();
  if (upper.includes("STRONG BUY")) return { label: "STRONG BUY", cls: "badge-green" };
  if (upper.includes("STRONG SELL")) return { label: "STRONG SELL", cls: "badge-red" };
  if (upper.includes("## INVESTMENT RATING") && upper.includes("BUY")) return { label: "BUY", cls: "badge-green" };
  if (upper.includes("## INVESTMENT RATING") && upper.includes("SELL")) return { label: "SELL", cls: "badge-red" };
  if (upper.includes("## INVESTMENT RATING") && upper.includes("HOLD")) return { label: "HOLD", cls: "badge-yellow" };
  return null;
}

export default function AnalyzePage() {
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(3);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRemaining(remainingAnalyses());
  }, []);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;

    if (!canAnalyze()) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), companyName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      incrementUsage();
      setRemaining(remainingAnalyses());
      setAnalysis(data.analysis);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function selectPopular(s: { ticker: string; name: string }) {
    setTicker(s.ticker);
    setCompanyName(s.name);
  }

  const rating = analysis ? getRatingBadge(analysis) : null;

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <ArrowLeft size={16} />
          <div style={{ width: 28, height: 28, background: "var(--accent)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={15} color="white" />
          </div>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>MoonLight</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {remaining > 0 ? (
              <><span style={{ color: "var(--accent)", fontWeight: 600 }}>{remaining}</span> free {remaining === 1 ? "analysis" : "analyses"} left</>
            ) : (
              <span style={{ color: "var(--danger)" }}>Free limit reached</span>
            )}
          </span>
          <button
            onClick={() => setShowUpgrade(true)}
            className="btn-primary"
            style={{ padding: "7px 16px", fontSize: "0.85rem" }}
          >
            Upgrade to Pro
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Analyze Any Stock
          </h1>
          <p style={{ color: "var(--text-muted)" }}>Enter a NSE/BSE ticker to get your AI research report</p>
        </div>

        {/* Search form */}
        <div className="card" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <form onSubmit={handleAnalyze}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>
                  STOCK TICKER *
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. RELIANCE.NS, TCS.NS"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>
                  COMPANY NAME (optional)
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Reliance Industries"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !ticker.trim()}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Analyzing...
                  </>
                ) : (
                  <><Search size={16} /> Analyze</>
                )}
              </button>
            </div>
          </form>

          {/* Popular stocks */}
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 600 }}>POPULAR</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {POPULAR_STOCKS.map((s) => (
                <button
                  key={s.ticker}
                  onClick={() => selectPopular(s)}
                  style={{
                    background: ticker === s.ticker ? "var(--accent)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${ticker === s.ticker ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 6,
                    padding: "5px 12px",
                    color: ticker === s.ticker ? "white" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    transition: "all 0.15s",
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, marginBottom: "1.5rem" }}>
            <AlertCircle size={18} color="var(--danger)" />
            <span style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
              <div style={{ width: 36, height: 36, background: "var(--accent-glow)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={18} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>AI is analyzing {companyName || ticker}...</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Running DCF model · Scanning financials · Generating thesis</div>
              </div>
            </div>
            {[200, 300, 250, 180, 280].map((w, i) => (
              <div key={i} className="shimmer" style={{ height: 16, borderRadius: 8, marginBottom: 12, width: `${w}px`, maxWidth: "100%" }} />
            ))}
          </div>
        )}

        {/* Analysis result */}
        {analysis && !loading && (
          <div ref={resultsRef} className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 }}>AI RESEARCH REPORT</div>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>{companyName || ticker}</h2>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 2 }}>{ticker}</div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {rating && <span className={`badge ${rating.cls}`}>{rating.label}</span>}
                <span className="badge badge-purple">AI Analysis</span>
              </div>
            </div>
            <div className="prose-dark">{renderMarkdown(analysis)}</div>
            <div style={{ marginTop: "2rem", padding: "1rem", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: "0.78rem", color: "var(--text-muted)" }}>
              ⚠️ This analysis is for informational purposes only. Not SEBI-registered investment advice. Always do your own research before investing.
            </div>
          </div>
        )}

        {/* Upgrade modal */}
        {showUpgrade && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
            <div className="card" style={{ padding: "2.5rem", maxWidth: 460, width: "100%", position: "relative" }}>
              <button onClick={() => setShowUpgrade(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, background: "var(--accent-glow)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", border: "1px solid var(--border)" }}>
                  <Zap size={26} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Upgrade to Pro</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                  You've used all 3 free analyses this month. Get unlimited analyses, PDF upload, and more for just ₹299/month.
                </p>
                <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem", marginBottom: "1.5rem", textAlign: "left" }}>
                  {["Unlimited stock analyses", "PDF annual report analyzer", "Portfolio watchlist", "Priority support"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                      <ChevronDown size={14} color="var(--accent)" style={{ transform: "rotate(-90deg)" }} />
                      <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" style={{ width: "100%", fontSize: "1rem" }}>
                  Upgrade — ₹299/month →
                </button>
                <button onClick={() => setShowUpgrade(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginTop: "0.75rem", fontSize: "0.85rem" }}>
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
