"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, Search, AlertCircle, Zap, ChevronDown, Shield, Globe,
  Package, Users, Anchor, BarChart3, Target, Activity, FileText,
  X, Check, Layers, Flame, Bitcoin, Coins, Droplets, Factory
} from "lucide-react";
import { incrementUsage, canAnalyze, remainingAnalyses, getPlan, activatePlan } from "@/lib/usage";
import { searchStocks, type StockEntry } from "@/lib/stocks";
import { searchCommodities, MCX_COMMODITIES, COMMODITY_CATEGORIES, type CommodityEntry } from "@/lib/commodities";
import { searchCrypto, CRYPTO_LIST, CRYPTO_CATEGORIES, type CryptoEntry } from "@/lib/crypto";
import { ScoreGauge, ScenarioTable, TagList, renderMarkdown, getRatingBadge, getOutlookBadge } from "@/components/DashboardWidgets";

type MainTab = "stocks" | "commodities" | "crypto";
type ResultView = "dashboard" | "report";

declare global { interface Window { Razorpay: new (o: Record<string, unknown>) => { open: () => void }; } }

/* ══════════════════════════════════════════════════════════════ */
export default function AnalyzePage() {
  const [mainTab, setMainTab] = useState<MainTab>("stocks");
  const [resultView, setResultView] = useState<ResultView>("dashboard");

  // Stock state
  const [stockQuery, setStockQuery] = useState("");
  const [stockTicker, setStockTicker] = useState("");
  const [stockName, setStockName] = useState("");
  const [stockSuggestions, setStockSuggestions] = useState<StockEntry[]>([]);
  const [showStockDrop, setShowStockDrop] = useState(false);
  const [stockIdx, setStockIdx] = useState(-1);

  // Commodity state
  const [commQuery, setCommQuery] = useState("");
  const [commSymbol, setCommSymbol] = useState("");
  const [commSelected, setCommSelected] = useState<CommodityEntry | null>(null);
  const [commSuggestions, setCommSuggestions] = useState<CommodityEntry[]>([]);
  const [showCommDrop, setShowCommDrop] = useState(false);
  const [commIdx, setCommIdx] = useState(-1);
  const [commCategory, setCommCategory] = useState("All");

  // Crypto state
  const [cryptoQuery, setCryptoQuery] = useState("");
  const [cryptoSymbol, setCryptoSymbol] = useState("");
  const [cryptoSelected, setCryptoSelected] = useState<CryptoEntry | null>(null);
  const [cryptoSuggestions, setCryptoSuggestions] = useState<CryptoEntry[]>([]);
  const [showCryptoDrop, setShowCryptoDrop] = useState(false);
  const [cryptoIdx, setCryptoIdx] = useState(-1);
  const [cryptoCategory, setCryptoCategory] = useState("All");

  // Shared state
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [scores, setScores] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(5);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [analysisType, setAnalysisType] = useState<MainTab>("stocks");

  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRemaining(remainingAnalyses());
    setCurrentPlan(getPlan().plan);
    if (!document.getElementById("razorpay-script")) {
      const s = document.createElement("script");
      s.id = "razorpay-script"; s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowStockDrop(false); setShowCommDrop(false); setShowCryptoDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear results when switching tabs
  function switchMainTab(tab: MainTab) {
    setMainTab(tab);
    setAnalysis(""); setScores(null); setError("");
  }

  /* ── Stock search ── */
  const handleStockSearch = useCallback((val: string) => {
    setStockQuery(val);
    if (val.trim().length >= 1) {
      const r = searchStocks(val); setStockSuggestions(r); setShowStockDrop(r.length > 0); setStockIdx(-1);
    } else { setStockSuggestions([]); setShowStockDrop(false); }
  }, []);

  function selectStock(s: StockEntry) {
    setStockQuery(s.name); setStockTicker(s.ticker); setStockName(s.name); setShowStockDrop(false);
  }

  /* ── Commodity search ── */
  const handleCommSearch = useCallback((val: string) => {
    setCommQuery(val);
    if (val.trim().length >= 1) {
      const r = searchCommodities(val); setCommSuggestions(r); setShowCommDrop(r.length > 0); setCommIdx(-1);
    } else { setCommSuggestions([]); setShowCommDrop(false); }
  }, []);

  function selectCommodity(c: CommodityEntry) {
    setCommQuery(c.name); setCommSymbol(c.symbol); setCommSelected(c); setShowCommDrop(false);
  }

  /* ── Crypto search ── */
  const handleCryptoSearch = useCallback((val: string) => {
    setCryptoQuery(val);
    if (val.trim().length >= 1) {
      const r = searchCrypto(val); setCryptoSuggestions(r); setShowCryptoDrop(r.length > 0); setCryptoIdx(-1);
    } else { setCryptoSuggestions([]); setShowCryptoDrop(false); }
  }, []);

  function selectCrypto(c: CryptoEntry) {
    setCryptoQuery(c.name); setCryptoSymbol(c.symbol); setCryptoSelected(c); setShowCryptoDrop(false);
  }

  /* ── Analyze ── */
  async function handleAnalyze(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!canAnalyze()) { setShowUpgrade(true); return; }

    let url = ""; let body: Record<string, string> = {};

    if (mainTab === "stocks") {
      const t = stockTicker || stockQuery.trim().toUpperCase();
      if (!t) return;
      url = "/api/analyze";
      body = { ticker: t, companyName: stockName || stockQuery };
    } else if (mainTab === "commodities") {
      const sym = commSymbol || commQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-commodity";
      body = { symbol: sym, name: commSelected?.name || commQuery, category: commSelected?.category || "", exchange: commSelected?.exchange || "MCX", unit: commSelected?.unit || "" };
    } else {
      const sym = cryptoSymbol || cryptoQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-crypto";
      body = { symbol: sym, name: cryptoSelected?.name || cryptoQuery, category: cryptoSelected?.category || "", pair: cryptoSelected?.pair || sym + "/INR" };
    }

    setLoading(true); setError(""); setAnalysis(""); setScores(null); setAnalysisType(mainTab);

    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      incrementUsage(); setRemaining(remainingAnalyses());
      setAnalysis(data.analysis); setScores(data.scores); setResultView("dashboard");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  /* ── Payment ── */
  async function handlePayment(plan: string) {
    setPaymentLoading(plan); setPaymentSuccess("");
    try {
      const res = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount, currency: data.currency,
        name: "MoonLight", description: `${data.planName} Plan — ${data.analyses} analyses/month`,
        order_id: data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await fetch("/api/payment/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...response, plan }) });
          const vd = await v.json();
          if (vd.verified) { activatePlan(plan, response.razorpay_payment_id); setRemaining(remainingAnalyses()); setCurrentPlan(plan); setPaymentSuccess(data.planName); setTimeout(() => setShowUpgrade(false), 2000); }
          else setError("Payment verification failed.");
          setPaymentLoading("");
        },
        modal: { ondismiss: () => setPaymentLoading("") },
        theme: { color: "#2962ff" },
      };
      new window.Razorpay(options).open();
    } catch (err) { setError(err instanceof Error ? err.message : "Payment failed"); setPaymentLoading(""); }
  }

  // Filtered commodity list for browse
  const filteredComm = commCategory === "All" ? MCX_COMMODITIES : MCX_COMMODITIES.filter(c => c.category === commCategory);
  const filteredCrypto = cryptoCategory === "All" ? CRYPTO_LIST : CRYPTO_LIST.filter(c => c.category === cryptoCategory);

  const analysisName = analysisType === "stocks" ? (stockName || stockTicker) : analysisType === "commodities" ? (commSelected?.name || commSymbol) : (cryptoSelected?.name || cryptoSymbol);
  const analysisSymbol = analysisType === "stocks" ? stockTicker : analysisType === "commodities" ? commSymbol : cryptoSymbol;

  const rating = scores ? getRatingBadge((scores as Record<string, unknown>).investmentRating as string || (scores as Record<string, unknown>).rating as string || "") : analysis ? getRatingBadge(analysis) : null;
  const outlook = scores ? getOutlookBadge((scores as Record<string, unknown>).outlook as string || "") : null;

  const sc = (scores as Record<string, unknown>)?.scores as Record<string, number> | undefined;

  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "100vh" }}>
      {/* ── Navbar ── */}
      <div className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, background: "var(--accent)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>MoonLight</span>
          </Link>

          {/* Main Tabs */}
          <div style={{ display: "flex", gap: 2, marginLeft: 12, background: "var(--bg-secondary)", borderRadius: 8, padding: 3 }}>
            {([
              { id: "stocks" as MainTab, label: "Stocks", icon: <TrendingUp size={13} /> },
              { id: "commodities" as MainTab, label: "Commodities", icon: <Flame size={13} /> },
              { id: "crypto" as MainTab, label: "Crypto", icon: <Bitcoin size={13} /> },
            ]).map(t => (
              <button key={t.id} onClick={() => switchMainTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 16px", borderRadius: 6, border: "none",
                background: mainTab === t.id ? "#fff" : "transparent",
                color: mainTab === t.id ? "var(--accent)" : "var(--text-muted)",
                fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
                boxShadow: mainTab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {currentPlan !== "free" && <span className="badge badge-blue" style={{ textTransform: "uppercase" }}>{currentPlan}</span>}
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>{remaining}</span> left
          </span>
          {currentPlan === "free" && (
            <button onClick={() => setShowUpgrade(true)} className="btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
              <Zap size={13} /> Upgrade
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>

        {/* ══════ STOCKS TAB ══════ */}
        {mainTab === "stocks" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search stocks — company name or ticker (e.g. Reliance, TCS)"
                      value={stockQuery} onChange={e => handleStockSearch(e.target.value)}
                      onFocus={() => { if (stockSuggestions.length > 0) setShowStockDrop(true); }}
                      onKeyDown={e => {
                        if (!showStockDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setStockIdx(i => Math.min(i + 1, stockSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setStockIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && stockIdx >= 0) { e.preventDefault(); selectStock(stockSuggestions[stockIdx]); }
                        else if (e.key === "Escape") setShowStockDrop(false);
                      }}
                    />
                  </div>
                  {showStockDrop && (
                    <div className="search-dropdown">
                      {stockSuggestions.map((s, i) => (
                        <div key={s.ticker} className={`search-item ${i === stockIdx ? "active" : ""}`} onClick={() => selectStock(s)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{s.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.sector}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent)" }}>{s.ticker.replace(".NS", "")}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>NSE</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!stockTicker && !stockQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "stocks" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {stockTicker && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{stockName}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{stockTicker}</span>
                  <button onClick={() => { setStockTicker(""); setStockName(""); setStockQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ COMMODITIES TAB ══════ */}
        {mainTab === "commodities" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search commodities — Gold, Crude Oil, Aluminium, Brent, NYMEX..."
                      value={commQuery} onChange={e => handleCommSearch(e.target.value)}
                      onFocus={() => { if (commSuggestions.length > 0) setShowCommDrop(true); }}
                      onKeyDown={e => {
                        if (!showCommDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setCommIdx(i => Math.min(i + 1, commSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setCommIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && commIdx >= 0) { e.preventDefault(); selectCommodity(commSuggestions[commIdx]); }
                        else if (e.key === "Escape") setShowCommDrop(false);
                      }}
                    />
                  </div>
                  {showCommDrop && (
                    <div className="search-dropdown">
                      {commSuggestions.map((c, i) => (
                        <div key={c.symbol + i} className={`search-item ${i === commIdx ? "active" : ""}`} onClick={() => selectCommodity(c)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.category} · {c.unit}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent)" }}>{c.symbol}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{c.exchange}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!commSymbol && !commQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "commodities" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {commSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{commSelected.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{commSelected.symbol} · {commSelected.exchange}</span>
                  <button onClick={() => { setCommSymbol(""); setCommSelected(null); setCommQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              {/* Koyfin badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <Globe size={12} /> International market insights powered by Koyfin analytics
              </div>
            </div>

            {/* Category filter + Browse grid */}
            {!analysis && !loading && (
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {COMMODITY_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCommCategory(cat)} style={{
                      padding: "5px 14px", borderRadius: 6, border: "1px solid",
                      borderColor: commCategory === cat ? "var(--accent)" : "var(--border)",
                      background: commCategory === cat ? "var(--accent-light)" : "#fff",
                      color: commCategory === cat ? "var(--accent)" : "var(--text-muted)",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {filteredComm.map(c => (
                    <button key={c.symbol + c.exchange} onClick={() => selectCommodity(c)} className="card" style={{
                      padding: "14px 16px", textAlign: "left", cursor: "pointer", border: "1px solid var(--border)",
                      background: commSymbol === c.symbol ? "var(--accent-light)" : "#fff",
                    }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 2 }}>{c.name}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        <span>{c.symbol} · {c.exchange}</span>
                        <span>{c.unit}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ CRYPTO TAB ══════ */}
        {mainTab === "crypto" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search crypto — Bitcoin, Ethereum, Solana, PEPE..."
                      value={cryptoQuery} onChange={e => handleCryptoSearch(e.target.value)}
                      onFocus={() => { if (cryptoSuggestions.length > 0) setShowCryptoDrop(true); }}
                      onKeyDown={e => {
                        if (!showCryptoDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setCryptoIdx(i => Math.min(i + 1, cryptoSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setCryptoIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && cryptoIdx >= 0) { e.preventDefault(); selectCrypto(cryptoSuggestions[cryptoIdx]); }
                        else if (e.key === "Escape") setShowCryptoDrop(false);
                      }}
                    />
                  </div>
                  {showCryptoDrop && (
                    <div className="search-dropdown">
                      {cryptoSuggestions.map((c, i) => (
                        <div key={c.symbol} className={`search-item ${i === cryptoIdx ? "active" : ""}`} onClick={() => selectCrypto(c)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.category}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent)" }}>{c.symbol}</div>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{c.pair}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!cryptoSymbol && !cryptoQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "crypto" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {cryptoSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{cryptoSelected.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{cryptoSelected.symbol} · {cryptoSelected.pair}</span>
                  <button onClick={() => { setCryptoSymbol(""); setCryptoSelected(null); setCryptoQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              {/* CoinDCX badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <Coins size={12} /> Data insights powered by CoinDCX market intelligence
              </div>
            </div>

            {/* Category filter + Browse grid */}
            {!analysis && !loading && (
              <div>
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {CRYPTO_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCryptoCategory(cat)} style={{
                      padding: "5px 14px", borderRadius: 6, border: "1px solid",
                      borderColor: cryptoCategory === cat ? "var(--accent)" : "var(--border)",
                      background: cryptoCategory === cat ? "var(--accent-light)" : "#fff",
                      color: cryptoCategory === cat ? "var(--accent)" : "var(--text-muted)",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                  {filteredCrypto.map(c => (
                    <button key={c.symbol} onClick={() => selectCrypto(c)} className="card" style={{
                      padding: "14px 16px", textAlign: "left", cursor: "pointer", border: "1px solid var(--border)",
                      background: cryptoSymbol === c.symbol ? "var(--accent-light)" : "#fff",
                    }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 2 }}>{c.name}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        <span>{c.symbol}</span>
                        <span className="badge badge-gray" style={{ padding: "1px 6px", fontSize: "0.65rem" }}>{c.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--danger-bg)", border: "1px solid #ffd4d4", borderRadius: "var(--radius)", marginBottom: 20 }}>
            <AlertCircle size={16} color="var(--danger)" />
            <span style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{error}</span>
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }}><X size={14} /></button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, background: "var(--accent-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={18} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  Analyzing {analysisType === "stocks" ? (stockName || stockTicker) : analysisType === "commodities" ? (commSelected?.name || commSymbol) : (cryptoSelected?.name || cryptoSymbol)}...
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {analysisType === "stocks" && "Running 9 modules — DCF, geopolitics, supply chain, ownership, management..."}
                  {analysisType === "commodities" && "Scanning supply-demand, OPEC dynamics, trade routes, Koyfin correlations..."}
                  {analysisType === "crypto" && "Analyzing tokenomics, on-chain data, CoinDCX metrics, regulatory landscape..."}
                </div>
              </div>
            </div>
            {[220, 360, 300, 180, 340].map((w, i) => (
              <div key={i} className="shimmer" style={{ height: 14, borderRadius: 6, marginBottom: 10, width: `${w}px`, maxWidth: "100%" }} />
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {analysis && !loading && (
          <div ref={resultsRef}>
            {/* Header */}
            <div className="card" style={{ padding: "16px 24px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {analysisType === "stocks" ? "Stock Research" : analysisType === "commodities" ? "Commodity Research" : "Crypto Research"}
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{analysisName}</div>
                  </div>
                  <div style={{ height: 28, width: 1, background: "var(--border)" }} />
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{analysisSymbol}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {rating && <span className={`badge ${rating.cls}`}>{rating.label}</span>}
                  {outlook && <span className={`badge ${outlook.cls}`}>{outlook.label}</span>}
                  <span className="badge badge-blue">
                    {analysisType === "commodities" ? "Koyfin Insights" : analysisType === "crypto" ? "CoinDCX" : "AI Research"}
                  </span>
                </div>
              </div>
            </div>

            {/* View tabs */}
            <div className="tab-bar">
              {[
                { id: "dashboard" as ResultView, label: "Dashboard", icon: <BarChart3 size={14} /> },
                { id: "report" as ResultView, label: "Full Report", icon: <FileText size={14} /> },
              ].map(tab => (
                <button key={tab.id} className={`tab-item ${resultView === tab.id ? "active" : ""}`} onClick={() => setResultView(tab.id)}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Dashboard for all types */}
            {resultView === "dashboard" && scores && sc && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ── Price Summary Cards ── */}
                {(() => {
                  const s = scores as Record<string, unknown>;
                  if (analysisType === "stocks") {
                    const cards = [
                      { label: "Current Price", value: s.currentPrice ? `₹${Number(s.currentPrice).toLocaleString("en-IN")}` : "—", color: "var(--text-primary)" },
                      { label: "Fair Value (DCF)", value: s.fairValue ? `₹${Number(s.fairValue).toLocaleString("en-IN")}` : "—", color: "var(--accent)" },
                      { label: "12M Target", value: s.targetPrice ? `₹${Number(s.targetPrice).toLocaleString("en-IN")}` : "—", color: "var(--success)" },
                      { label: "Upside", value: s.upside ? `${Number(s.upside) > 0 ? "+" : ""}${s.upside}%` : "—", color: Number(s.upside) >= 0 ? "var(--success)" : "var(--danger)" },
                    ];
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                        {cards.map(c => (
                          <div key={c.label} className="dashboard-card" style={{ textAlign: "center", padding: 16 }}>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (analysisType === "commodities") {
                    const cards = [
                      { label: "Current Price", value: s.currentPrice ? `₹${Number(s.currentPrice).toLocaleString("en-IN")}` : "—", color: "var(--text-primary)" },
                      { label: "3M Target", value: s.targetPrice3M ? `₹${Number(s.targetPrice3M).toLocaleString("en-IN")}` : "—", color: "var(--accent)" },
                      { label: "12M Target", value: s.targetPrice12M ? `₹${Number(s.targetPrice12M).toLocaleString("en-IN")}` : "—", color: "var(--success)" },
                      { label: "Upside", value: s.upside ? `${Number(s.upside) > 0 ? "+" : ""}${s.upside}%` : "—", color: Number(s.upside) >= 0 ? "var(--success)" : "var(--danger)" },
                    ];
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                        {cards.map(c => (
                          <div key={c.label} className="dashboard-card" style={{ textAlign: "center", padding: 16 }}>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  /* crypto */
                  const cards = [
                    { label: "Price (USD)", value: s.currentPriceUSD ? `$${Number(s.currentPriceUSD).toLocaleString("en-US")}` : "—", color: "var(--text-primary)" },
                    { label: "Price (INR)", value: s.currentPriceINR ? `₹${Number(s.currentPriceINR).toLocaleString("en-IN")}` : "—", color: "var(--accent)" },
                    { label: "Market Cap", value: (s.marketCap as string) || "—", color: "var(--text-secondary)" },
                    { label: "Upside", value: s.upside ? `${Number(s.upside) > 0 ? "+" : ""}${s.upside}%` : "—", color: Number(s.upside) >= 0 ? "var(--success)" : "var(--danger)" },
                  ];
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                      {cards.map(c => (
                        <div key={c.label} className="dashboard-card" style={{ textAlign: "center", padding: 16 }}>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* ── Supply-Demand / On-Chain / Financials Card ── */}
                {(() => {
                  const s = scores as Record<string, unknown>;
                  if (analysisType === "commodities" && s.supplyDemand) {
                    const sd = s.supplyDemand as Record<string, string>;
                    return (
                      <div className="dashboard-card">
                        <div className="dashboard-card-title">Supply-Demand Balance <span className="badge badge-purple" style={{ marginLeft: 8 }}>Koyfin</span></div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                          {[
                            { label: "Global Production", value: sd.globalProduction || "—" },
                            { label: "Global Demand", value: sd.globalDemand || "—" },
                            { label: "Inventory Status", value: sd.inventoryStatus || "—" },
                            { label: "Market Balance", value: sd.marketBalance || "—" },
                          ].map(item => (
                            <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: item.value === "DEFICIT" || item.value === "LOW" ? "var(--danger)" : item.value === "SURPLUS" || item.value === "HIGH" ? "var(--success)" : "var(--text-primary)" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (analysisType === "crypto" && s.onChain) {
                    const oc = s.onChain as Record<string, string>;
                    return (
                      <div className="dashboard-card">
                        <div className="dashboard-card-title">On-Chain Analytics <span className="badge badge-blue" style={{ marginLeft: 8 }}>CoinDCX</span></div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                          {[
                            { label: "Active Addresses", value: oc.activeAddresses || "—" },
                            { label: "TVL", value: oc.tvl || "—" },
                            { label: "Daily Txns", value: oc.dailyTransactions || "—" },
                            { label: "Network Health", value: oc.networkHealth || "—" },
                          ].map(item => (
                            <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: item.value === "STRONG" ? "var(--success)" : item.value === "WEAK" ? "var(--danger)" : "var(--text-primary)" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (analysisType === "stocks" && s.financials) {
                    const f = s.financials as Record<string, number>;
                    const own = s.ownership as Record<string, number> | undefined;
                    return (
                      <>
                        <div className="dashboard-card">
                          <div className="dashboard-card-title">Financial Snapshot</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                            {[
                              { label: "Revenue CAGR", value: f.revenueCagr ? `${f.revenueCagr}%` : "—" },
                              { label: "EBITDA Margin", value: f.ebitdaMargin ? `${f.ebitdaMargin}%` : "—" },
                              { label: "D/E Ratio", value: f.debtToEquity != null ? String(f.debtToEquity) : "—" },
                              { label: "ROE", value: f.roe ? `${f.roe}%` : "—" },
                            ].map(item => (
                              <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {own && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">Ownership Structure</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                              {[
                                { label: "Promoter", pct: own.promoter, color: "var(--accent)" },
                                { label: "FII/FPI", pct: own.fii, color: "var(--success)" },
                                { label: "DII", pct: own.dii, color: "var(--warning)" },
                                { label: "Retail", pct: own.retail, color: "var(--text-muted)" },
                                { label: "Pledge", pct: own.pledge, color: "var(--danger)" },
                              ].map(item => (
                                <div key={item.label} style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: item.color }}>{item.pct != null ? `${item.pct}%` : "—"}</div>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>{item.label}</div>
                                  <div style={{ height: 4, background: "var(--border-light)", borderRadius: 4, marginTop: 6 }}>
                                    <div style={{ height: "100%", width: `${Math.min(item.pct || 0, 100)}%`, background: item.color, borderRadius: 4 }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  }
                  return null;
                })()}

                {/* ── Correlation Card (Crypto/Commodity) ── */}
                {(() => {
                  const s = scores as Record<string, unknown>;
                  if (analysisType === "crypto" && (s.btcCorrelation != null || s.ethCorrelation != null)) {
                    return (
                      <div className="dashboard-card">
                        <div className="dashboard-card-title">Market Correlations <span className="badge badge-blue" style={{ marginLeft: 8 }}>CoinDCX</span></div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {[
                            { label: "BTC Correlation", value: s.btcCorrelation as number },
                            { label: "ETH Correlation", value: s.ethCorrelation as number },
                          ].map(item => (
                            <div key={item.label} style={{ padding: 14, background: "var(--bg-secondary)", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>{item.label}</span>
                              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)" }}>{item.value != null ? item.value.toFixed(2) : "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Score meters — adaptive */}
                <div className="dashboard-card">
                  <div className="dashboard-card-title">
                    {analysisType === "stocks" ? "Risk & Quality Scores" : analysisType === "commodities" ? "Commodity Scores" : "Token Scores"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {Object.entries(sc).map(([key, val]) => {
                      const labelMap: Record<string, string> = {
                        geopoliticalRisk: "Geopolitical", commodityRisk: "Commodity Risk", supplyChainStability: "Supply Chain",
                        managementQuality: "Management", foreignOwnershipRisk: "FII Risk", tradeRouteRisk: "Trade Route",
                        pricingPower: "Pricing Power", indiaGrowthPotential: "India Growth",
                        supplyRisk: "Supply Risk", demandStrength: "Demand", volatility: "Volatility",
                        indiaExposure: "India Exposure", usdCorrelation: "USD Correlation", seasonality: "Seasonality",
                        technicalStrength: "Technicals",
                        technology: "Technology", tokenomics: "Tokenomics", adoption: "Adoption",
                        regulatoryRisk: "Regulatory Risk", liquidity: "Liquidity", developerActivity: "Dev Activity",
                        communityStrength: "Community", indiaSuitability: "India Fit",
                      };
                      const iconMap: Record<string, React.ReactNode> = {
                        geopoliticalRisk: <Globe size={14} />, commodityRisk: <Package size={14} />,
                        supplyChainStability: <Layers size={14} />, managementQuality: <Users size={14} />,
                        foreignOwnershipRisk: <Shield size={14} />, tradeRouteRisk: <Anchor size={14} />,
                        pricingPower: <TrendingUp size={14} />, indiaGrowthPotential: <Target size={14} />,
                        supplyRisk: <Factory size={14} />, demandStrength: <TrendingUp size={14} />,
                        volatility: <Activity size={14} />, indiaExposure: <Target size={14} />,
                        usdCorrelation: <Coins size={14} />, seasonality: <BarChart3 size={14} />,
                        technicalStrength: <BarChart3 size={14} />,
                        technology: <Layers size={14} />, tokenomics: <Coins size={14} />,
                        adoption: <Users size={14} />, regulatoryRisk: <Shield size={14} />,
                        liquidity: <Droplets size={14} />, developerActivity: <Activity size={14} />,
                        communityStrength: <Users size={14} />, indiaSuitability: <Target size={14} />,
                      };
                      const invertKeys = ["geopoliticalRisk", "commodityRisk", "foreignOwnershipRisk", "tradeRouteRisk", "supplyRisk", "volatility", "regulatoryRisk", "usdCorrelation"];
                      return (
                        <ScoreGauge key={key} score={typeof val === "number" ? val : 0} label={labelMap[key] || key} icon={iconMap[key] || <BarChart3 size={14} />} invertColor={invertKeys.includes(key)} />
                      );
                    })}
                  </div>
                </div>

                {/* Scenarios */}
                {(() => {
                  const scenariosRaw = (scores as Record<string, unknown>).scenarios as Record<string, Record<string, unknown>> | undefined;
                  if (!scenariosRaw) return null;
                  const s = scenariosRaw;
                  const rows = [
                    { label: "Bull", target: s.bull?.target ? `₹${Number(s.bull.target).toLocaleString("en-IN")}` : (s.bull?.targetINR ? `₹${Number(s.bull.targetINR).toLocaleString("en-IN")}` : `$${s.bull?.targetUSD || 0}`), probability: Number(s.bull?.probability || 0), trigger: String(s.bull?.trigger || ""), color: "var(--success)", bg: "var(--success-bg)" },
                    { label: "Base", target: s.base?.target ? `₹${Number(s.base.target).toLocaleString("en-IN")}` : (s.base?.targetINR ? `₹${Number(s.base.targetINR).toLocaleString("en-IN")}` : `$${s.base?.targetUSD || 0}`), probability: Number(s.base?.probability || 0), trigger: String(s.base?.trigger || ""), color: "var(--warning)", bg: "var(--warning-bg)" },
                    { label: "Bear", target: s.bear?.target ? `₹${Number(s.bear.target).toLocaleString("en-IN")}` : (s.bear?.targetINR ? `₹${Number(s.bear.targetINR).toLocaleString("en-IN")}` : `$${s.bear?.targetUSD || 0}`), probability: Number(s.bear?.probability || 0), trigger: String(s.bear?.trigger || ""), color: "var(--danger)", bg: "var(--danger-bg)" },
                  ];
                  return <ScenarioTable scenarios={rows} />;
                })()}

                {/* Extra info tags */}
                {((scores as Record<string, unknown>).topProducers || (scores as Record<string, unknown>).competitors || (scores as Record<string, unknown>).topImportCountries) ? (
                  <div className="dashboard-card">
                    <div className="dashboard-card-title">Key Intelligence</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <TagList title="Top Producers" items={((scores as Record<string, unknown>).topProducers as string[]) || []} icon={<Factory size={12} color="var(--accent)" />} />
                      <TagList title="Top Consumers" items={((scores as Record<string, unknown>).topConsumers as string[]) || []} icon={<Users size={12} color="var(--warning)" />} />
                      <TagList title="Import Countries" items={((scores as Record<string, unknown>).topImportCountries as string[]) || []} icon={<Globe size={12} color="var(--success)" />} />
                      <TagList title="Indian Companies" items={((scores as Record<string, unknown>).indianCompaniesExposed as string[]) || []} icon={<TrendingUp size={12} color="var(--accent)" />} />
                      <TagList title="Competitors" items={((scores as Record<string, unknown>).competitors as string[]) || []} icon={<Target size={12} color="var(--danger)" />} />
                      <TagList title="Correlated" items={((scores as Record<string, unknown>).correlatedCommodities as string[]) || ((scores as Record<string, unknown>).ecosystemTokens as string[]) || []} icon={<Activity size={12} color="var(--warning)" />} />
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {resultView === "dashboard" && !scores && (
              <div className="card" style={{ padding: 24, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)" }}>Dashboard data not available — view Full Report.</p>
              </div>
            )}

            {resultView === "report" && (
              <div className="card" style={{ padding: "24px 32px" }}>
                <div className="prose-light">{renderMarkdown(analysis)}</div>
              </div>
            )}

            <div style={{ marginTop: 14, padding: "12px 16px", background: "var(--warning-bg)", border: "1px solid #ffe0b2", borderRadius: "var(--radius)", fontSize: "0.76rem", color: "#bf6c00" }}>
              AI-generated for informational purposes only. Not SEBI-registered investment advice. Always do your own research.
            </div>
          </div>
        )}

        {/* Empty state */}
        {!analysis && !loading && !error && mainTab === "stocks" && (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, background: "var(--accent-light)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <TrendingUp size={22} color="var(--accent)" />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Search for a stock to analyze</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>120+ NSE stocks with institutional-grade research</p>
          </div>
        )}
      </div>

      {/* ── Upgrade Modal ── */}
      {showUpgrade && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ maxWidth: 800, width: "100%", position: "relative" }}>
            <button onClick={() => { setShowUpgrade(false); setPaymentSuccess(""); }} style={{ position: "absolute", top: -12, right: -12, width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "1px solid var(--border)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <X size={16} />
            </button>
            {paymentSuccess ? (
              <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, background: "var(--success-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Check size={28} color="var(--success)" />
                </div>
                <h3 style={{ color: "var(--success)", marginBottom: 6 }}>Payment Successful!</h3>
                <p style={{ color: "var(--text-muted)" }}>Your <strong>{paymentSuccess}</strong> plan is now active.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 32 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Choose Your Plan</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Stocks + Commodities + Crypto — all-in-one</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  {[
                    { id: "starter", name: "Starter", price: "₹199", count: 20, color: "#0097a7", features: ["Stocks + Commodities + Crypto", "Risk dashboards", "Priority support"] },
                    { id: "pro", name: "Pro", price: "₹499", count: 100, color: "#2962ff", popular: true, features: ["All Starter features", "Commodity heatmaps", "CoinDCX insights", "Supply chain maps"] },
                    { id: "elite", name: "Elite", price: "₹999", count: 300, color: "#e65100", features: ["All Pro features", "PDF upload", "Portfolio watchlist", "Dedicated support"] },
                  ].map(p => (
                    <div key={p.id} style={{ border: p.popular ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, position: "relative", boxShadow: p.popular ? "0 4px 20px rgba(41,98,255,0.12)" : "none" }}>
                      {p.popular && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "3px 12px", borderRadius: 4 }}>POPULAR</div>}
                      <div style={{ fontSize: "0.7rem", color: p.color, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>{p.name}</div>
                      <div style={{ fontSize: "1.8rem", fontWeight: 900 }}>{p.price}<span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></div>
                      <div style={{ background: `${p.color}12`, borderRadius: 6, padding: "6px 0", textAlign: "center", margin: "12px 0", fontSize: "0.85rem", fontWeight: 700, color: p.color }}>{p.count} analyses</div>
                      {p.features.map(f => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                          <Check size={13} color={p.color} /> {f}
                        </div>
                      ))}
                      <button onClick={() => handlePayment(p.id)} disabled={!!paymentLoading} className={p.popular ? "btn-primary" : "btn-ghost"} style={{ width: "100%", marginTop: 12 }}>
                        {paymentLoading === p.id ? "Processing..." : `Get ${p.name}`}
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <button onClick={() => setShowUpgrade(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.82rem" }}>Continue with Free (5/month)</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
