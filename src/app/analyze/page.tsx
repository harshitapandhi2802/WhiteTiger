"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp, Search, AlertCircle, Zap, ChevronDown, Shield, Globe,
  Package, Users, Anchor, BarChart3, Target, Activity, FileText,
  X, Check, Layers, Flame, Bitcoin, Coins, Droplets, Factory,
  DollarSign, PiggyBank, ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react";
import { incrementUsage, canAnalyze, remainingAnalyses, getPlan, activatePlan } from "@/lib/usage";
import { searchStocks, type StockEntry } from "@/lib/stocks";
import { searchCommodities, MCX_COMMODITIES, COMMODITY_CATEGORIES, type CommodityEntry } from "@/lib/commodities";
import { searchCrypto, CRYPTO_LIST, CRYPTO_CATEGORIES, type CryptoEntry } from "@/lib/crypto";
import { searchCurrencies, CURRENCY_LIST, CURRENCY_CATEGORIES, type CurrencyEntry } from "@/lib/currencies";
import { searchMutualFunds, MUTUAL_FUNDS, MF_CATEGORIES, type MutualFundEntry } from "@/lib/mutualfunds";
import { searchBonds, BONDS_LIST, BOND_CATEGORIES, type BondEntry } from "@/lib/bonds";
import { INTL_INDICES, INTL_STOCKS, INTL_REGIONS, getIndicesByRegion, getStocksForIndex } from "@/lib/international";
import { ScoreGauge, ScenarioTable, TagList, renderMarkdown, getRatingBadge, getOutlookBadge } from "@/components/DashboardWidgets";
import { MiniSparkline, TradingViewChart, MarketTicker, ScrollingTicker, TradingViewTickerTape, LiveChartGrid } from "@/components/LiveCharts";
import { IntelligenceColumn } from "@/components/IntelligenceColumn";

type MainTab = "stocks" | "commodities" | "crypto" | "currency" | "mutualfunds" | "debt" | "international";
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

  // Currency state
  const [currQuery, setCurrQuery] = useState("");
  const [currSymbol, setCurrSymbol] = useState("");
  const [currSelected, setCurrSelected] = useState<CurrencyEntry | null>(null);
  const [currSuggestions, setCurrSuggestions] = useState<CurrencyEntry[]>([]);
  const [showCurrDrop, setShowCurrDrop] = useState(false);
  const [currIdx, setCurrIdx] = useState(-1);
  const [currCategory, setCurrCategory] = useState("All");

  // Mutual Fund state
  const [mfQuery, setMfQuery] = useState("");
  const [mfSymbol, setMfSymbol] = useState("");
  const [mfSelected, setMfSelected] = useState<MutualFundEntry | null>(null);
  const [mfSuggestions, setMfSuggestions] = useState<MutualFundEntry[]>([]);
  const [showMfDrop, setShowMfDrop] = useState(false);
  const [mfIdx, setMfIdx] = useState(-1);
  const [mfCategory, setMfCategory] = useState("All");

  // Debt/Bond state
  const [debtQuery, setDebtQuery] = useState("");
  const [debtSymbol, setDebtSymbol] = useState("");
  const [debtSelected, setDebtSelected] = useState<BondEntry | null>(null);
  const [debtSuggestions, setDebtSuggestions] = useState<BondEntry[]>([]);
  const [showDebtDrop, setShowDebtDrop] = useState(false);
  const [debtIdx, setDebtIdx] = useState(-1);
  const [debtCategory, setDebtCategory] = useState("All");

  // International state
  const [intlRegion, setIntlRegion] = useState<string>("All");
  const [intlExpandedIndex, setIntlExpandedIndex] = useState<string | null>(null);
  const [intlPrices, setIntlPrices] = useState<Record<string, { price: number; change: number; changePercent: number; name: string; currency: string }>>({});

  // Live prices
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, { usd: number; inr: number; change24h: number }>>({});
  const [forexPrices, setForexPrices] = useState<Record<string, { rate: number; change24h: number }>>({});
  const [stockPrices, setStockPrices] = useState<Record<string, { price: number; change: number; changePercent: number; name: string }>>({});
  const [commodityPrices, setCommodityPrices] = useState<Record<string, { price: number; change: number; changePercent: number; name: string; currency: string }>>({});
  const [mfPrices, setMfPrices] = useState<Record<string, { nav: number; date: string; name: string }>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [forexLoading, setForexLoading] = useState(false);

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
        setShowStockDrop(false); setShowCommDrop(false); setShowCryptoDrop(false); setShowCurrDrop(false); setShowMfDrop(false); setShowDebtDrop(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch live crypto prices
  const fetchCryptoPrices = useCallback(async () => {
    setPricesLoading(true);
    try {
      const res = await fetch("/api/live-prices?type=crypto");
      if (res.ok) {
        const data = await res.json();
        setCryptoPrices(data.prices || {});
      }
    } catch { /* silent fail */ }
    setPricesLoading(false);
  }, []);

  // Fetch live stock prices (for ticker + browse cards)
  const fetchStockPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/live-prices?type=stocks");
      if (res.ok) {
        const data = await res.json();
        if (data.prices && Object.keys(data.prices).length > 0) {
          setStockPrices(data.prices);
        }
      }
    } catch { /* silent fail */ }
  }, []);

  const fetchCommodityPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/live-prices?type=commodities");
      if (res.ok) {
        const data = await res.json();
        if (data.prices && Object.keys(data.prices).length > 0) {
          setCommodityPrices(data.prices);
        }
      }
    } catch { /* silent fail */ }
  }, []);

  const fetchMfPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/live-prices?type=mf");
      if (res.ok) {
        const data = await res.json();
        if (data.prices && Object.keys(data.prices).length > 0) {
          setMfPrices(data.prices);
        }
      }
    } catch { /* silent fail */ }
  }, []);

  const fetchIntlPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/live-prices?type=international");
      if (res.ok) {
        const data = await res.json();
        if (data.prices && Object.keys(data.prices).length > 0) {
          setIntlPrices(prev => ({ ...prev, ...data.prices }));
        }
      }
    } catch { /* silent fail */ }
  }, []);

  const fetchIntlStockPrices = useCallback(async (indexSymbol: string) => {
    const stocks = getStocksForIndex(indexSymbol);
    if (stocks.length === 0) return;
    const symbols = stocks.map(s => s.yahooSymbol).join(",");
    try {
      const res = await fetch(`/api/live-prices?type=intl-stocks&symbols=${encodeURIComponent(symbols)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.prices && Object.keys(data.prices).length > 0) {
          setIntlPrices(prev => ({ ...prev, ...data.prices }));
        }
      }
    } catch { /* silent fail */ }
  }, []);

  useEffect(() => {
    fetchStockPrices();
    fetchCryptoPrices();
    fetchCommodityPrices();
    fetchMfPrices();
    fetchForexPrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch live forex prices
  const fetchForexPrices = useCallback(async () => {
    setForexLoading(true);
    try {
      const res = await fetch("/api/live-prices?type=forex");
      if (res.ok) {
        const data = await res.json();
        setForexPrices(data.prices || {});
      }
    } catch { /* silent fail */ }
    setForexLoading(false);
  }, []);

  useEffect(() => {
    if (mainTab === "crypto") fetchCryptoPrices();
    if (mainTab === "currency") fetchForexPrices();
    if (mainTab === "commodities") fetchCommodityPrices();
    if (mainTab === "mutualfunds") fetchMfPrices();
    if (mainTab === "international") fetchIntlPrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab]);

  // Auto-refresh prices when on respective tabs
  useEffect(() => {
    if (mainTab !== "crypto") return;
    const interval = setInterval(fetchCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, [mainTab, fetchCryptoPrices]);

  useEffect(() => {
    if (mainTab !== "currency") return;
    const interval = setInterval(fetchForexPrices, 300000);
    return () => clearInterval(interval);
  }, [mainTab, fetchForexPrices]);

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

  /* ── Currency search ── */
  const handleCurrSearch = useCallback((val: string) => {
    setCurrQuery(val);
    if (val.trim().length >= 1) {
      const r = searchCurrencies(val); setCurrSuggestions(r); setShowCurrDrop(r.length > 0); setCurrIdx(-1);
    } else { setCurrSuggestions([]); setShowCurrDrop(false); }
  }, []);

  function selectCurrency(c: CurrencyEntry) {
    setCurrQuery(c.name); setCurrSymbol(c.symbol); setCurrSelected(c); setShowCurrDrop(false);
  }

  /* ── MF search ── */
  const handleMfSearch = useCallback((val: string) => {
    setMfQuery(val);
    if (val.trim().length >= 1) {
      const r = searchMutualFunds(val); setMfSuggestions(r); setShowMfDrop(r.length > 0); setMfIdx(-1);
    } else { setMfSuggestions([]); setShowMfDrop(false); }
  }, []);

  function selectMf(f: MutualFundEntry) {
    setMfQuery(f.name); setMfSymbol(f.symbol); setMfSelected(f); setShowMfDrop(false);
  }

  /* ── Debt search ── */
  const handleDebtSearch = useCallback((val: string) => {
    setDebtQuery(val);
    if (val.trim().length >= 1) {
      const r = searchBonds(val); setDebtSuggestions(r); setShowDebtDrop(r.length > 0); setDebtIdx(-1);
    } else { setDebtSuggestions([]); setShowDebtDrop(false); }
  }, []);

  function selectDebt(b: BondEntry) {
    setDebtQuery(b.name); setDebtSymbol(b.symbol); setDebtSelected(b); setShowDebtDrop(false);
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
    } else if (mainTab === "crypto") {
      const sym = cryptoSymbol || cryptoQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-crypto";
      body = { symbol: sym, name: cryptoSelected?.name || cryptoQuery, category: cryptoSelected?.category || "", pair: cryptoSelected?.pair || sym + "/INR" };
    } else if (mainTab === "currency") {
      const sym = currSymbol || currQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-currency";
      body = { symbol: sym, name: currSelected?.name || currQuery, category: currSelected?.category || "", pair: currSelected?.pair || sym, base: currSelected?.base || "", quote: currSelected?.quote || "" };
    } else if (mainTab === "mutualfunds") {
      const sym = mfSymbol || mfQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-mf";
      body = { symbol: sym, name: mfSelected?.name || mfQuery, category: mfSelected?.category || "", amc: mfSelected?.amc || "", riskLevel: mfSelected?.riskLevel || "" };
    } else {
      const sym = debtSymbol || debtQuery.trim().toUpperCase();
      if (!sym) return;
      url = "/api/analyze-debt";
      body = { symbol: sym, name: debtSelected?.name || debtQuery, category: debtSelected?.category || "", type: debtSelected?.type || "", tenure: debtSelected?.tenure || "", coupon: debtSelected?.coupon || "", rating: debtSelected?.rating || "", issuer: debtSelected?.issuer || "" };
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

  // Filtered lists for browse
  const filteredComm = commCategory === "All" ? MCX_COMMODITIES : MCX_COMMODITIES.filter(c => c.category === commCategory);
  const filteredCrypto = cryptoCategory === "All" ? CRYPTO_LIST : CRYPTO_LIST.filter(c => c.category === cryptoCategory);
  const filteredCurr = currCategory === "All" ? CURRENCY_LIST : CURRENCY_LIST.filter(c => c.category === currCategory);
  const filteredMf = mfCategory === "All" ? MUTUAL_FUNDS : MUTUAL_FUNDS.filter(f => f.category === mfCategory);
  const filteredDebt = debtCategory === "All" ? BONDS_LIST : BONDS_LIST.filter(b => b.category === debtCategory);

  const analysisName = analysisType === "stocks" ? (stockName || stockTicker) : analysisType === "commodities" ? (commSelected?.name || commSymbol) : analysisType === "crypto" ? (cryptoSelected?.name || cryptoSymbol) : analysisType === "currency" ? (currSelected?.name || currSymbol) : analysisType === "mutualfunds" ? (mfSelected?.name || mfSymbol) : (debtSelected?.name || debtSymbol);
  const analysisSymbol = analysisType === "stocks" ? stockTicker : analysisType === "commodities" ? commSymbol : analysisType === "crypto" ? cryptoSymbol : analysisType === "currency" ? currSymbol : analysisType === "mutualfunds" ? mfSymbol : debtSymbol;

  const rating = scores ? getRatingBadge((scores as Record<string, unknown>).investmentRating as string || (scores as Record<string, unknown>).rating as string || "") : analysis ? getRatingBadge(analysis) : null;
  const outlook = scores ? getOutlookBadge((scores as Record<string, unknown>).outlook as string || "") : null;

  const sc = (scores as Record<string, unknown>)?.scores as Record<string, number> | undefined;

  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "100vh" }}>
      {/* ── Scrolling Ticker ── */}
      <ScrollingTicker items={[
        ...(Object.keys(stockPrices).length > 0
          ? Object.entries(stockPrices).slice(0, 10).map(([sym, d]) => ({ name: d.name, symbol: sym, price: `₹${d.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, change: d.changePercent }))
          : []
        ),
        ...(Object.keys(commodityPrices).length > 0
          ? ["GOLD", "CRUDEOIL", "SILVER", "NATURALGAS"].filter(s => commodityPrices[s]).map(s => ({
              name: commodityPrices[s].name, symbol: s,
              price: `$${commodityPrices[s].price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
              change: commodityPrices[s].changePercent,
            }))
          : []
        ),
        ...(Object.keys(cryptoPrices).length > 0
          ? ["BTC", "ETH", "SOL", "BNB", "XRP"].filter(s => cryptoPrices[s]).map(s => ({
              name: s === "BTC" ? "Bitcoin" : s === "ETH" ? "Ethereum" : s === "SOL" ? "Solana" : s === "BNB" ? "BNB" : "XRP",
              symbol: s,
              price: `$${cryptoPrices[s].usd?.toLocaleString("en-US") || "0"}`,
              change: cryptoPrices[s].change24h || 0,
            }))
          : []
        ),
        ...(Object.keys(forexPrices).length > 0
          ? ["USDINR", "EURUSD", "GBPUSD"].filter(s => forexPrices[s]).map(s => ({
              name: s, symbol: s,
              price: s.includes("INR") ? `₹${forexPrices[s].rate.toFixed(2)}` : `$${forexPrices[s].rate.toFixed(4)}`,
              change: forexPrices[s].change24h || 0,
            }))
          : []
        ),
      ]} />

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
          <div style={{ display: "flex", gap: 2, marginLeft: 12, background: "var(--bg-secondary)", borderRadius: 10, padding: 3 }}>
            {([
              { id: "stocks" as MainTab, label: "Stocks", icon: <TrendingUp size={14} />, color: "#2962ff" },
              { id: "commodities" as MainTab, label: "Commodities", icon: <Flame size={14} />, color: "#e65100" },
              { id: "crypto" as MainTab, label: "Crypto", icon: <Bitcoin size={14} />, color: "#f7931a" },
              { id: "currency" as MainTab, label: "Forex", icon: <DollarSign size={14} />, color: "#00897b" },
              { id: "mutualfunds" as MainTab, label: "MF", icon: <PiggyBank size={14} />, color: "#7c3aed" },
              { id: "debt" as MainTab, label: "Bonds", icon: <Shield size={14} />, color: "#00897b" },
              { id: "international" as MainTab, label: "Global", icon: <Globe size={14} />, color: "#0d47a1" },
            ]).map(t => (
              <button key={t.id} onClick={() => switchMainTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 18px", borderRadius: 8, border: "none",
                background: mainTab === t.id ? "#fff" : "transparent",
                color: mainTab === t.id ? t.color : "var(--text-muted)",
                fontWeight: mainTab === t.id ? 700 : 600, fontSize: "0.84rem", cursor: "pointer",
                boxShadow: mainTab === t.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
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
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: 24, display: "flex", gap: 20 }}>
        {/* Left: Intelligence Column (desktop only) */}
        <div className="intel-sidebar" style={{ width: 300, minWidth: 280, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 20 }}>
            <IntelligenceColumn tab={mainTab} />
          </div>
        </div>

        {/* Center: Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

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
                <TradingViewTickerTape tab="commodities" />
                <LiveChartGrid tab="commodities" />
                <MarketTicker items={
                  Object.keys(commodityPrices).length > 0
                    ? ["GOLD", "SILVER", "CRUDEOIL", "COPPER", "NATURALGAS"].filter(s => commodityPrices[s]).map(s => ({
                        label: s === "CRUDEOIL" ? "CRUDE OIL" : s === "NATURALGAS" ? "NAT GAS" : s,
                        value: `$${commodityPrices[s].price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
                        change: commodityPrices[s].changePercent,
                      }))
                    : [{ label: "Loading...", value: "—" }]
                } />
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {COMMODITY_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCommCategory(cat)} style={{
                      padding: "6px 16px", borderRadius: 20, border: "1px solid",
                      borderColor: commCategory === cat ? "var(--accent)" : "var(--border)",
                      background: commCategory === cat ? "var(--accent)" : "#fff",
                      color: commCategory === cat ? "#fff" : "var(--text-muted)",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                  {filteredComm.map(c => {
                    const liveComm = commodityPrices[c.symbol] || commodityPrices[c.symbol.toUpperCase()];
                    const isPositive = liveComm ? liveComm.changePercent >= 0 : c.name.charCodeAt(0) % 3 !== 0;
                    return (
                      <button key={c.symbol + c.exchange} onClick={() => selectCommodity(c)} className="card" style={{
                        padding: 0, textAlign: "left", cursor: "pointer", overflow: "hidden",
                        border: commSymbol === c.symbol ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: "#fff", transition: "all 0.2s",
                      }}>
                        <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 3 }}>{c.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>{c.symbol}</span>
                              <span className="badge badge-gray" style={{ padding: "1px 6px", fontSize: "0.58rem" }}>{c.exchange}</span>
                            </div>
                          </div>
                          <MiniSparkline seed={c.symbol + c.exchange} positive={isPositive} width={64} height={28} />
                        </div>
                        <div style={{ padding: "0 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {liveComm ? (
                            <>
                              <span style={{ fontSize: "1rem", fontWeight: 800 }}>${liveComm.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                              <span style={{
                                fontSize: "0.72rem", fontWeight: 700,
                                color: isPositive ? "var(--success)" : "var(--danger)",
                                background: isPositive ? "var(--success-bg)" : "var(--danger-bg)",
                                padding: "2px 6px", borderRadius: 6,
                              }}>
                                {isPositive ? "▲" : "▼"} {Math.abs(liveComm.changePercent).toFixed(2)}%
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="badge badge-purple" style={{ padding: "2px 8px", fontSize: "0.62rem" }}>{c.category}</span>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>{c.unit}</span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
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
              {/* CoinDCX badge + refresh */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  <Coins size={12} /> Live prices powered by CoinDCX & CoinGecko
                </div>
                <button onClick={fetchCryptoPrices} disabled={pricesLoading} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem" }}>
                  <RefreshCw size={11} className={pricesLoading ? "spinning" : ""} /> Refresh
                </button>
              </div>
            </div>

            {/* Category filter + Browse grid */}
            {!analysis && !loading && (
              <div>
                <TradingViewTickerTape tab="crypto" />
                <LiveChartGrid tab="crypto" />
                {/* Live market ticker */}
                {Object.keys(cryptoPrices).length > 0 && (
                  <MarketTicker items={[
                    { label: "BTC", value: `₹${(cryptoPrices.BTC?.inr || 0).toLocaleString("en-IN")}`, change: cryptoPrices.BTC?.change24h || 0 },
                    { label: "ETH", value: `₹${(cryptoPrices.ETH?.inr || 0).toLocaleString("en-IN")}`, change: cryptoPrices.ETH?.change24h || 0 },
                    { label: "SOL", value: `₹${(cryptoPrices.SOL?.inr || 0).toLocaleString("en-IN")}`, change: cryptoPrices.SOL?.change24h || 0 },
                    { label: "BNB", value: `₹${(cryptoPrices.BNB?.inr || 0).toLocaleString("en-IN")}`, change: cryptoPrices.BNB?.change24h || 0 },
                    { label: "XRP", value: `₹${(cryptoPrices.XRP?.inr || 0).toFixed(2)}`, change: cryptoPrices.XRP?.change24h || 0 },
                  ]} />
                )}
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {CRYPTO_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCryptoCategory(cat)} style={{
                      padding: "6px 16px", borderRadius: 20, border: "1px solid",
                      borderColor: cryptoCategory === cat ? "var(--accent)" : "var(--border)",
                      background: cryptoCategory === cat ? "var(--accent)" : "#fff",
                      color: cryptoCategory === cat ? "#fff" : "var(--text-muted)",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                  {filteredCrypto.map(c => {
                    const price = cryptoPrices[c.symbol];
                    const isPositive = price ? price.change24h >= 0 : true;
                    return (
                      <button key={c.symbol} onClick={() => selectCrypto(c)} className="card" style={{
                        padding: 0, textAlign: "left", cursor: "pointer", overflow: "hidden",
                        border: cryptoSymbol === c.symbol ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: "#fff", transition: "all 0.2s",
                      }}>
                        <div style={{ padding: "14px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{c.name}</span>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{c.symbol}</span>
                            </div>
                            <span className="badge badge-gray" style={{ padding: "1px 6px", fontSize: "0.58rem" }}>{c.category}</span>
                          </div>
                          <MiniSparkline seed={c.symbol} positive={isPositive} width={64} height={28} />
                        </div>
                        <div style={{ padding: "6px 16px 12px" }}>
                          {price ? (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                              <div>
                                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                                  ₹{price.inr.toLocaleString("en-IN", { maximumFractionDigits: price.inr < 1 ? 6 : 2 })}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>
                                  ${price.usd.toLocaleString("en-US", { maximumFractionDigits: price.usd < 1 ? 6 : 2 })}
                                </div>
                              </div>
                              <span style={{
                                fontSize: "0.82rem", fontWeight: 700,
                                color: isPositive ? "var(--success)" : "var(--danger)",
                                background: isPositive ? "var(--success-bg)" : "var(--danger-bg)",
                                padding: "3px 8px", borderRadius: 6,
                                display: "flex", alignItems: "center", gap: 3,
                              }}>
                                {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                {Math.abs(price.change24h).toFixed(2)}%
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div className="shimmer" style={{ width: 80, height: 16, borderRadius: 4 }} />
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{c.pair}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ CURRENCY TAB ══════ */}
        {mainTab === "currency" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search forex — USD/INR, EUR/USD, Yen, Dollar..."
                      value={currQuery} onChange={e => handleCurrSearch(e.target.value)}
                      onFocus={() => { if (currSuggestions.length > 0) setShowCurrDrop(true); }}
                      onKeyDown={e => {
                        if (!showCurrDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setCurrIdx(i => Math.min(i + 1, currSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setCurrIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && currIdx >= 0) { e.preventDefault(); selectCurrency(currSuggestions[currIdx]); }
                        else if (e.key === "Escape") setShowCurrDrop(false);
                      }}
                    />
                  </div>
                  {showCurrDrop && (
                    <div className="search-dropdown">
                      {currSuggestions.map((c, i) => (
                        <div key={c.symbol} className={`search-item ${i === currIdx ? "active" : ""}`} onClick={() => selectCurrency(c)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{c.category}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--accent)" }}>{c.pair}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!currSymbol && !currQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "currency" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {currSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{currSelected.pair}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{currSelected.name}</span>
                  <button onClick={() => { setCurrSymbol(""); setCurrSelected(null); setCurrQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <DollarSign size={12} /> RBI reference rates · NSE currency futures · Central bank policy analysis
              </div>
            </div>

            {!analysis && !loading && (
              <div>
                <TradingViewTickerTape tab="currency" />
                <LiveChartGrid tab="currency" />
                {/* Forex Market Ticker */}
                {Object.keys(forexPrices).length > 0 ? (
                  <MarketTicker items={[
                    { label: "USD/INR", value: `₹${(forexPrices.USDINR?.rate || 0).toFixed(2)}`, change: forexPrices.USDINR?.change24h || 0 },
                    { label: "EUR/INR", value: `₹${(forexPrices.EURINR?.rate || 0).toFixed(2)}`, change: forexPrices.EURINR?.change24h || 0 },
                    { label: "GBP/INR", value: `₹${(forexPrices.GBPINR?.rate || 0).toFixed(2)}`, change: forexPrices.GBPINR?.change24h || 0 },
                    { label: "EUR/USD", value: `$${(forexPrices.EURUSD?.rate || 0).toFixed(4)}`, change: forexPrices.EURUSD?.change24h || 0 },
                    { label: "USD/JPY", value: `¥${(forexPrices.USDJPY?.rate || 0).toFixed(2)}`, change: forexPrices.USDJPY?.change24h || 0 },
                  ]} />
                ) : (
                  <MarketTicker items={[{ label: "Loading forex rates...", value: "—" }]} />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CURRENCY_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setCurrCategory(cat)} style={{
                        padding: "6px 16px", borderRadius: 20, border: "1px solid",
                        borderColor: currCategory === cat ? "var(--accent)" : "var(--border)",
                        background: currCategory === cat ? "var(--accent)" : "#fff",
                        color: currCategory === cat ? "#fff" : "var(--text-muted)",
                        fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                      }}>{cat}</button>
                    ))}
                  </div>
                  <button onClick={fetchForexPrices} disabled={forexLoading} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem" }}>
                    <RefreshCw size={12} className={forexLoading ? "spinning" : ""} /> Refresh Rates
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                  {filteredCurr.map(c => {
                    const fxPrice = forexPrices[c.symbol];
                    const isPositive = fxPrice ? fxPrice.change24h >= 0 : c.name.charCodeAt(0) % 2 === 0;
                    return (
                      <button key={c.symbol} onClick={() => selectCurrency(c)} className="card" style={{
                        padding: 0, textAlign: "left", cursor: "pointer", overflow: "hidden",
                        border: currSymbol === c.symbol ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: "#fff", transition: "all 0.2s",
                      }}>
                        <div style={{ padding: "14px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--accent)", marginBottom: 2 }}>{c.pair}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.name}</div>
                          </div>
                          <MiniSparkline seed={c.symbol} positive={isPositive} width={64} height={28} />
                        </div>
                        <div style={{ padding: "4px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {fxPrice ? (
                            <>
                              <span style={{ fontSize: "1rem", fontWeight: 800 }}>
                                {c.quote === "INR" ? "₹" : c.quote === "JPY" ? "¥" : "$"}{fxPrice.rate.toFixed(c.quote === "JPY" ? 2 : 4)}
                              </span>
                              <span className="badge badge-gray" style={{ padding: "2px 8px", fontSize: "0.62rem" }}>{c.category}</span>
                            </>
                          ) : (
                            <span className="badge badge-gray" style={{ padding: "2px 8px", fontSize: "0.62rem" }}>{c.category}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ MUTUAL FUNDS TAB ══════ */}
        {mainTab === "mutualfunds" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search funds — SBI Bluechip, Parag Parikh, ELSS, Index..."
                      value={mfQuery} onChange={e => handleMfSearch(e.target.value)}
                      onFocus={() => { if (mfSuggestions.length > 0) setShowMfDrop(true); }}
                      onKeyDown={e => {
                        if (!showMfDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setMfIdx(i => Math.min(i + 1, mfSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setMfIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && mfIdx >= 0) { e.preventDefault(); selectMf(mfSuggestions[mfIdx]); }
                        else if (e.key === "Escape") setShowMfDrop(false);
                      }}
                    />
                  </div>
                  {showMfDrop && (
                    <div className="search-dropdown">
                      {mfSuggestions.map((f, i) => (
                        <div key={f.symbol} className={`search-item ${i === mfIdx ? "active" : ""}`} onClick={() => selectMf(f)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{f.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{f.amc} · {f.category}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span className={`badge ${f.riskLevel === "Low" ? "badge-green" : f.riskLevel === "Moderate" ? "badge-yellow" : "badge-red"}`} style={{ fontSize: "0.62rem" }}>{f.riskLevel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!mfSymbol && !mfQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "mutualfunds" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {mfSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span className="badge badge-blue">{mfSelected.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{mfSelected.amc}</span>
                  <span className={`badge ${mfSelected.riskLevel === "Low" ? "badge-green" : mfSelected.riskLevel === "Moderate" ? "badge-yellow" : "badge-red"}`}>{mfSelected.riskLevel} Risk</span>
                  <button onClick={() => { setMfSymbol(""); setMfSelected(null); setMfQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <PiggyBank size={12} /> Morningstar-grade analysis · SIP strategy · Tax-efficient investing
              </div>
            </div>

            {!analysis && !loading && (
              <div>
                <TradingViewTickerTape tab="mutualfunds" />
                <LiveChartGrid tab="mutualfunds" />
                <MarketTicker items={
                  Object.keys(stockPrices).length > 0
                    ? [
                        ...(stockPrices.NIFTY50 ? [{ label: "NIFTY 50", value: stockPrices.NIFTY50.price.toLocaleString("en-IN"), change: stockPrices.NIFTY50.changePercent }] : []),
                        ...(stockPrices.SENSEX ? [{ label: "SENSEX", value: stockPrices.SENSEX.price.toLocaleString("en-IN"), change: stockPrices.SENSEX.changePercent }] : []),
                        ...(stockPrices.BANKNIFTY ? [{ label: "BANK NIFTY", value: stockPrices.BANKNIFTY.price.toLocaleString("en-IN"), change: stockPrices.BANKNIFTY.changePercent }] : []),
                        ...(commodityPrices.GOLD ? [{ label: "GOLD", value: `$${commodityPrices.GOLD.price.toLocaleString("en-US")}`, change: commodityPrices.GOLD.changePercent }] : []),
                      ]
                    : [{ label: "Loading...", value: "—" }]
                } />
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {MF_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setMfCategory(cat)} style={{
                      padding: "6px 16px", borderRadius: 20, border: "1px solid",
                      borderColor: mfCategory === cat ? "var(--accent)" : "var(--border)",
                      background: mfCategory === cat ? "var(--accent)" : "#fff",
                      color: mfCategory === cat ? "#fff" : "var(--text-muted)",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {filteredMf.map(f => {
                    const riskColor = f.riskLevel === "Low" ? "#00c853" : f.riskLevel === "Moderate" ? "#ff9800" : "#f44336";
                    const isPositive = f.riskLevel !== "Very High";
                    const mfKey = f.symbol.replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
                    const liveMf = mfPrices[mfKey];
                    return (
                      <button key={f.symbol} onClick={() => selectMf(f)} className="card" style={{
                        padding: 0, textAlign: "left", cursor: "pointer", overflow: "hidden",
                        border: mfSymbol === f.symbol ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: "#fff", transition: "all 0.2s",
                        borderTop: `3px solid ${riskColor}`,
                      }}>
                        <div style={{ padding: "12px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 3, lineHeight: 1.3 }}>{f.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{f.amc}</div>
                          </div>
                          <MiniSparkline seed={f.symbol} positive={isPositive} color={riskColor} width={56} height={24} />
                        </div>
                        <div style={{ padding: "6px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {liveMf ? (
                            <>
                              <span style={{ fontSize: "0.92rem", fontWeight: 800 }}>NAV ₹{liveMf.nav.toFixed(2)}</span>
                              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{liveMf.date}</span>
                            </>
                          ) : (
                            <>
                              <span className="badge badge-gray" style={{ padding: "2px 8px", fontSize: "0.62rem" }}>{f.category}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor }} />
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: riskColor }}>{f.riskLevel} Risk</span>
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ DEBT / BONDS TAB ══════ */}
        {mainTab === "debt" && (
          <div>
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
              <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div ref={searchRef} className="search-container" style={{ flex: 1 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" style={{ paddingLeft: 38 }} placeholder="Search bonds — G-Sec, T-Bills, Corporate Bonds, PPF, SGB..."
                      value={debtQuery} onChange={e => handleDebtSearch(e.target.value)}
                      onFocus={() => { if (debtSuggestions.length > 0) setShowDebtDrop(true); }}
                      onKeyDown={e => {
                        if (!showDebtDrop) return;
                        if (e.key === "ArrowDown") { e.preventDefault(); setDebtIdx(i => Math.min(i + 1, debtSuggestions.length - 1)); }
                        else if (e.key === "ArrowUp") { e.preventDefault(); setDebtIdx(i => Math.max(i - 1, 0)); }
                        else if (e.key === "Enter" && debtIdx >= 0) { e.preventDefault(); selectDebt(debtSuggestions[debtIdx]); }
                        else if (e.key === "Escape") setShowDebtDrop(false);
                      }}
                    />
                  </div>
                  {showDebtDrop && (
                    <div className="search-dropdown">
                      {debtSuggestions.map((b, i) => (
                        <div key={b.symbol} className={`search-item ${i === debtIdx ? "active" : ""}`} onClick={() => selectDebt(b)}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{b.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.issuer} · {b.tenure}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#00897b" }}>{b.yieldApprox}</div>
                            <span className="badge badge-green" style={{ fontSize: "0.6rem" }}>{b.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn-primary" disabled={loading || (!debtSymbol && !debtQuery.trim())} style={{ whiteSpace: "nowrap" }}>
                  {loading && analysisType === "debt" ? <><div className="spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} /> Analyzing...</> : <><Search size={15} /> Analyze</>}
                </button>
              </form>
              {debtSelected && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-blue">{debtSelected.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>{debtSelected.issuer} · {debtSelected.tenure}</span>
                  <span className="badge badge-green">{debtSelected.rating}</span>
                  <span className="badge badge-purple">{debtSelected.yieldApprox}</span>
                  <button onClick={() => { setDebtSymbol(""); setDebtSelected(null); setDebtQuery(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={14} /></button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                <Shield size={12} /> RBI monetary policy · CCIL trading data · Credit analysis · Tax-efficient investing
              </div>
            </div>

            {!analysis && !loading && (
              <div>
                <TradingViewTickerTape tab="debt" />
                <LiveChartGrid tab="debt" />
                <MarketTicker items={[
                  { label: "INDIA 10Y", value: "Live", change: 0 },
                  { label: "INDIA 2Y", value: "Live", change: 0 },
                  { label: "US 10Y", value: "Live", change: 0 },
                  ...(stockPrices.NIFTY50 ? [{ label: "NIFTY 50", value: stockPrices.NIFTY50.price.toLocaleString("en-IN"), change: stockPrices.NIFTY50.changePercent }] : []),
                  ...(forexPrices.USDINR ? [{ label: "USD/INR", value: `₹${forexPrices.USDINR.rate.toFixed(2)}`, change: forexPrices.USDINR.change24h }] : []),
                ]} />
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {BOND_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setDebtCategory(cat)} style={{
                      padding: "6px 16px", borderRadius: 20, border: "1px solid",
                      borderColor: debtCategory === cat ? "#00897b" : "var(--border)",
                      background: debtCategory === cat ? "#00897b" : "#fff",
                      color: debtCategory === cat ? "#fff" : "var(--text-muted)",
                      fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    }}>{cat}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {filteredDebt.map(b => {
                    const ratingColor = b.rating === "Sovereign" ? "#00897b" : b.rating === "AAA" ? "#2962ff" : b.rating === "AA+" ? "#7c3aed" : "#ff9800";
                    return (
                      <button key={b.symbol} onClick={() => selectDebt(b)} className="card" style={{
                        padding: 0, textAlign: "left", cursor: "pointer", overflow: "hidden",
                        border: debtSymbol === b.symbol ? "2px solid #00897b" : "1px solid var(--border)",
                        background: "#fff", transition: "all 0.2s",
                        borderLeft: `4px solid ${ratingColor}`,
                      }}>
                        <div style={{ padding: "12px 16px 6px" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: 4, lineHeight: 1.3 }}>{b.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 6 }}>{b.issuer} · {b.tenure}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div style={{ background: "rgba(0,137,123,0.08)", padding: "4px 10px", borderRadius: 6 }}>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Yield </span>
                              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#00897b" }}>{b.yieldApprox}</span>
                            </div>
                            <div style={{ background: "rgba(0,137,123,0.08)", padding: "4px 10px", borderRadius: 6 }}>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Coupon </span>
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{b.coupon}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: "6px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="badge badge-gray" style={{ padding: "2px 8px", fontSize: "0.62rem" }}>{b.category}</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: ratingColor, display: "flex", alignItems: "center", gap: 4 }}>
                            <Shield size={10} /> {b.rating}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── International Markets Tab ── */}
        {mainTab === "international" && (
          <div>
            <TradingViewTickerTape tab="international" />
            <LiveChartGrid tab="international" />

            {/* Region Filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {INTL_REGIONS.map(r => (
                <button key={r} onClick={() => { setIntlRegion(r); setIntlExpandedIndex(null); }} style={{
                  padding: "8px 20px", borderRadius: 24, border: "1px solid",
                  borderColor: intlRegion === r ? "#1a73e8" : "var(--border)",
                  background: intlRegion === r ? "linear-gradient(135deg, #1a73e8, #4285f4)" : "#fff",
                  color: intlRegion === r ? "#fff" : "var(--text-muted)",
                  fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                  boxShadow: intlRegion === r ? "0 2px 8px rgba(26,115,232,0.3)" : "none",
                }}>{r === "All" ? "🌍 All Regions" : r === "Americas" ? "🌎 Americas" : r === "Europe" ? "🌍 Europe" : "🌏 Asia-Pacific"}</button>
              ))}
            </div>

            {/* Index Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {getIndicesByRegion(intlRegion).map(idx => {
                const p = intlPrices[idx.yahooSymbol];
                const isExpanded = intlExpandedIndex === idx.symbol;
                const stocks = getStocksForIndex(idx.symbol);
                const changeColor = p && p.change >= 0 ? "#00c853" : "#ff1744";
                const changeIcon = p && p.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />;

                return (
                  <div key={idx.symbol} className="card" style={{
                    overflow: "hidden", border: isExpanded ? "2px solid #1a73e8" : "1px solid var(--border)",
                    transition: "all 0.25s", boxShadow: isExpanded ? "0 4px 20px rgba(26,115,232,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    {/* Index Header */}
                    <button onClick={() => {
                      const next = isExpanded ? null : idx.symbol;
                      setIntlExpandedIndex(next);
                      if (next) fetchIntlStockPrices(next);
                    }} style={{
                      width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: isExpanded ? "linear-gradient(135deg, rgba(26,115,232,0.04), rgba(66,133,244,0.08))" : "#fff",
                      border: "none", cursor: "pointer", transition: "background 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ fontSize: "1.6rem" }}>{idx.flag}</span>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>{idx.name}</div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>
                            {idx.country} · {idx.symbol}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {p ? (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                              {p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", color: changeColor, fontSize: "0.82rem", fontWeight: 700 }}>
                              {changeIcon}
                              {p.change >= 0 ? "+" : ""}{p.change.toFixed(2)} ({p.changePercent >= 0 ? "+" : ""}{p.changePercent.toFixed(2)}%)
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                            <div className="shimmer" style={{ width: 80, height: 16, borderRadius: 4 }} />
                            <div className="shimmer" style={{ width: 60, height: 12, borderRadius: 4 }} />
                          </div>
                        )}
                        <ChevronDown size={18} style={{
                          color: "var(--text-muted)", transition: "transform 0.25s",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        }} />
                      </div>
                    </button>

                    {/* Expanded Stocks */}
                    {isExpanded && stocks.length > 0 && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", background: "rgba(0,0,0,0.01)" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                          Top Constituents
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                          {stocks.map(stk => {
                            const sp = intlPrices[stk.yahooSymbol];
                            const sChangeColor = sp && sp.change >= 0 ? "#00c853" : "#ff1744";
                            return (
                              <div key={stk.ticker} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "10px 14px", borderRadius: 10, background: "#fff",
                                border: "1px solid var(--border)", transition: "box-shadow 0.15s",
                              }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>{stk.name}</div>
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{stk.ticker} · {stk.sector}</div>
                                </div>
                                {sp ? (
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", fontVariantNumeric: "tabular-nums" }}>
                                      {sp.currency === "INR" ? "₹" : sp.currency === "GBP" ? "£" : sp.currency === "EUR" ? "€" : sp.currency === "JPY" ? "¥" : sp.currency === "HKD" ? "HK$" : sp.currency === "KRW" ? "₩" : sp.currency === "CNY" ? "¥" : sp.currency === "BRL" ? "R$" : sp.currency === "AUD" ? "A$" : sp.currency === "SGD" ? "S$" : sp.currency === "TWD" ? "NT$" : sp.currency === "CHF" ? "CHF " : "$"}
                                      {sp.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: sChangeColor }}>
                                      {sp.changePercent >= 0 ? "+" : ""}{sp.changePercent.toFixed(2)}%
                                    </div>
                                  </div>
                                ) : (
                                  <div className="shimmer" style={{ width: 60, height: 14, borderRadius: 4 }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {isExpanded && stocks.length === 0 && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        No constituent data available for this index
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Refresh hint */}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <RefreshCw size={12} /> Prices update every 2 min · Data from Google Finance · Charts by TradingView
            </div>
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
                  Analyzing {analysisType === "stocks" ? (stockName || stockTicker) : analysisType === "commodities" ? (commSelected?.name || commSymbol) : analysisType === "crypto" ? (cryptoSelected?.name || cryptoSymbol) : analysisType === "currency" ? (currSelected?.name || currSymbol) : (mfSelected?.name || mfSymbol)}...
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {analysisType === "stocks" && "Running 9 modules — DCF, geopolitics, supply chain, ownership, management..."}
                  {analysisType === "commodities" && "Scanning supply-demand, OPEC dynamics, trade routes, Koyfin correlations..."}
                  {analysisType === "crypto" && "Analyzing tokenomics, on-chain data, CoinDCX metrics, regulatory landscape..."}
                  {analysisType === "currency" && "Analyzing central bank policies, carry trades, RBI stance, macro fundamentals..."}
                  {analysisType === "mutualfunds" && "Analyzing NAV performance, portfolio quality, fund manager track record, SIP strategy..."}
                  {analysisType === "debt" && "Analyzing yield curve, RBI policy impact, credit risk, duration sensitivity, tax efficiency..."}
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
                      {analysisType === "stocks" ? "Stock Research" : analysisType === "commodities" ? "Commodity Research" : analysisType === "crypto" ? "Crypto Research" : analysisType === "currency" ? "Forex Research" : analysisType === "mutualfunds" ? "Mutual Fund Research" : "Debt & Bond Research"}
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
                    {analysisType === "commodities" ? "Koyfin Insights" : analysisType === "crypto" ? "CoinDCX" : analysisType === "currency" ? "RBI · NSE Forex" : analysisType === "mutualfunds" ? "Morningstar Grade" : analysisType === "debt" ? "CCIL · RBI Policy" : "AI Research"}
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
                      { label: "Current Price", value: s.currentPrice ? `₹${Number(s.currentPrice).toLocaleString("en-IN")}` : "—", color: "var(--text-primary)", cls: "accent" },
                      { label: "Fair Value (DCF)", value: s.fairValue ? `₹${Number(s.fairValue).toLocaleString("en-IN")}` : "—", color: "var(--accent)", cls: "purple" },
                      { label: "12M Target", value: s.targetPrice ? `₹${Number(s.targetPrice).toLocaleString("en-IN")}` : "—", color: "var(--success)", cls: "success" },
                      { label: "Upside", value: s.upside ? `${Number(s.upside) > 0 ? "+" : ""}${s.upside}%` : "—", color: Number(s.upside) >= 0 ? "var(--success)" : "var(--danger)", cls: Number(s.upside) >= 0 ? "success" : "danger" },
                    ];
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                        {cards.map(c => (
                          <div key={c.label} className={`dash-card-gradient ${c.cls}`} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (analysisType === "commodities") {
                    const cards = [
                      { label: "Current Price", value: s.currentPrice ? `₹${Number(s.currentPrice).toLocaleString("en-IN")}` : "—", color: "var(--text-primary)", cls: "warning" },
                      { label: "3M Target", value: s.targetPrice3M ? `₹${Number(s.targetPrice3M).toLocaleString("en-IN")}` : "—", color: "var(--accent)", cls: "accent" },
                      { label: "12M Target", value: s.targetPrice12M ? `₹${Number(s.targetPrice12M).toLocaleString("en-IN")}` : "—", color: "var(--success)", cls: "success" },
                      { label: "Upside", value: s.upside ? `${Number(s.upside) > 0 ? "+" : ""}${s.upside}%` : "—", color: Number(s.upside) >= 0 ? "var(--success)" : "var(--danger)", cls: Number(s.upside) >= 0 ? "success" : "danger" },
                    ];
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                        {cards.map(c => (
                          <div key={c.label} className={`dash-card-gradient ${c.cls}`} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (analysisType === "currency") {
                    const cards = [
                      { label: "Current Rate", value: s.currentRate ? String(Number(s.currentRate).toFixed(4)) : "—", color: "var(--text-primary)" },
                      { label: "3M Target", value: s.target3M ? String(Number(s.target3M).toFixed(4)) : "—", color: "var(--accent)" },
                      { label: "12M Target", value: s.target12M ? String(Number(s.target12M).toFixed(4)) : "—", color: "var(--success)" },
                      { label: "52W Change", value: s.change52W ? `${Number(s.change52W) > 0 ? "+" : ""}${s.change52W}%` : "—", color: Number(s.change52W) >= 0 ? "var(--success)" : "var(--danger)" },
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
                  if (analysisType === "mutualfunds") {
                    const ret = s.returns as Record<string, number> | undefined;
                    const cards = [
                      { label: "Current NAV", value: s.currentNAV ? `₹${Number(s.currentNAV).toLocaleString("en-IN")}` : "—", color: "var(--text-primary)" },
                      { label: "AUM", value: (s.aum as string) || "—", color: "var(--accent)" },
                      { label: "3Y Return", value: ret?.return3Y ? `${ret.return3Y}%` : "—", color: "var(--success)" },
                      { label: "Expense Ratio", value: s.expenseRatio ? `${s.expenseRatio}%` : "—", color: "var(--text-secondary)" },
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
                  if (analysisType === "debt") {
                    const yc = s.yieldComparison as Record<string, number> | undefined;
                    const rbiP = s.rbiPolicy as Record<string, unknown> | undefined;
                    const cards = [
                      { label: "Current Price", value: s.currentPrice ? `₹${Number(s.currentPrice).toFixed(2)}` : "—", color: "var(--text-primary)" },
                      { label: "Yield (YTM)", value: s.ytm ? `${s.ytm}%` : "—", color: "#00897b" },
                      { label: "Modified Duration", value: s.modifiedDuration ? `${s.modifiedDuration}` : "—", color: "var(--accent)" },
                      { label: "Credit Rating", value: (s.creditRating as string) || "—", color: "#7c3aed" },
                    ];
                    return (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                          {cards.map(c => (
                            <div key={c.label} className="dash-card-gradient teal" style={{ textAlign: "center" }}>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{c.label}</div>
                              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.color }}>{c.value}</div>
                            </div>
                          ))}
                        </div>
                        {rbiP && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">RBI Policy Dashboard</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                              {[
                                { label: "Repo Rate", value: rbiP.repoRate != null ? `${rbiP.repoRate}%` : "—" },
                                { label: "Policy Stance", value: (rbiP.stance as string) || "—" },
                                { label: "Expected Change", value: (rbiP.expectedRateChange as string) || "—" },
                                { label: "CPI Inflation", value: rbiP.inflationRate != null ? `${rbiP.inflationRate}%` : "—" },
                              ].map(item => (
                                <div key={item.label} style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: String(item.value).includes("HAWKISH") ? "var(--danger)" : String(item.value).includes("DOVISH") || String(item.value).includes("ACCOMMODATIVE") ? "var(--success)" : "var(--text-primary)" }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {yc && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">Yield Comparison</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                              {[
                                { label: "This Instrument", value: s.ytm ? `${s.ytm}%` : "—", color: "#00897b" },
                                { label: "Bank FD Rate", value: yc.fdRate ? `${yc.fdRate}%` : "—", color: "var(--text-secondary)" },
                                { label: "G-Sec Benchmark", value: yc.gsecBenchmark ? `${yc.gsecBenchmark}%` : "—", color: "var(--accent)" },
                                { label: "Debt MF Return", value: yc.debtMfReturn ? `${yc.debtMfReturn}%` : "—", color: "#7c3aed" },
                              ].map(item => (
                                <div key={item.label} style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: item.color }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
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

                {/* ── TradingView Live Chart ── */}
                <TradingViewChart symbol={analysisSymbol || ""} type={analysisType} />

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
                  if (analysisType === "currency" && s.centralBanks) {
                    const cb = s.centralBanks as Record<string, unknown>;
                    return (
                      <div className="dashboard-card">
                        <div className="dashboard-card-title">Central Bank Dashboard</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                          {[
                            { label: "Base CB Rate", value: cb.baseCBRate != null ? `${cb.baseCBRate}%` : "—" },
                            { label: "Quote CB Rate", value: cb.quoteCBRate != null ? `${cb.quoteCBRate}%` : "—" },
                            { label: "Rate Differential", value: cb.rateDifferential != null ? `${Number(cb.rateDifferential).toFixed(2)}%` : "—" },
                            { label: "Base Stance", value: (cb.baseStance as string) || "—" },
                            { label: "Quote Stance", value: (cb.quoteStance as string) || "—" },
                          ].map(item => (
                            <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: String(item.value).includes("HAWKISH") ? "var(--danger)" : String(item.value).includes("DOVISH") ? "var(--success)" : "var(--text-primary)" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (analysisType === "mutualfunds" && s.returns) {
                    const ret = s.returns as Record<string, number>;
                    const sip = s.sipReturns as Record<string, number> | undefined;
                    const risk = s.risk as Record<string, unknown> | undefined;
                    return (
                      <>
                        <div className="dashboard-card">
                          <div className="dashboard-card-title">Performance Returns (CAGR)</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                            {[
                              { label: "1Y Return", value: ret.return1Y ? `${ret.return1Y}%` : "—", color: (ret.return1Y || 0) >= 0 ? "var(--success)" : "var(--danger)" },
                              { label: "3Y Return", value: ret.return3Y ? `${ret.return3Y}%` : "—", color: (ret.return3Y || 0) >= 0 ? "var(--success)" : "var(--danger)" },
                              { label: "5Y Return", value: ret.return5Y ? `${ret.return5Y}%` : "—", color: (ret.return5Y || 0) >= 0 ? "var(--success)" : "var(--danger)" },
                              { label: "10Y Return", value: ret.return10Y ? `${ret.return10Y}%` : "—", color: (ret.return10Y || 0) >= 0 ? "var(--success)" : "var(--danger)" },
                              { label: "Benchmark 3Y", value: ret.benchmarkReturn3Y ? `${ret.benchmarkReturn3Y}%` : "—", color: "var(--text-muted)" },
                              { label: "Category Avg 3Y", value: ret.categoryAvgReturn3Y ? `${ret.categoryAvgReturn3Y}%` : "—", color: "var(--text-muted)" },
                            ].map(item => (
                              <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: item.color }}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {sip && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">SIP Returns (₹10,000/month)</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                              {[
                                { label: "1 Year SIP", value: sip.sip1Y ? `₹${Number(sip.sip1Y).toLocaleString("en-IN")}` : "—" },
                                { label: "3 Year SIP", value: sip.sip3Y ? `₹${Number(sip.sip3Y).toLocaleString("en-IN")}` : "—" },
                                { label: "5 Year SIP", value: sip.sip5Y ? `₹${Number(sip.sip5Y).toLocaleString("en-IN")}` : "—" },
                              ].map(item => (
                                <div key={item.label} style={{ padding: 14, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--success)" }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {risk && (
                          <div className="dashboard-card">
                            <div className="dashboard-card-title">Risk Metrics</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                              {[
                                { label: "Sharpe Ratio", value: risk.sharpeRatio != null ? String(risk.sharpeRatio) : "—" },
                                { label: "Std Deviation", value: risk.standardDeviation != null ? `${risk.standardDeviation}%` : "—" },
                                { label: "Beta", value: risk.beta != null ? String(risk.beta) : "—" },
                                { label: "Max Drawdown", value: risk.maxDrawdown != null ? `${risk.maxDrawdown}%` : "—" },
                              ].map(item => (
                                <div key={item.label} style={{ padding: 10, background: "var(--bg-secondary)", borderRadius: 6, textAlign: "center" }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
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
                    {analysisType === "stocks" ? "Risk & Quality Scores" : analysisType === "commodities" ? "Commodity Scores" : analysisType === "crypto" ? "Token Scores" : analysisType === "currency" ? "Currency Scores" : analysisType === "mutualfunds" ? "Fund Quality Scores" : "Bond Quality Scores"}
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
                        centralBankDivergence: "CB Divergence", carryAttractiveness: "Carry Trade",
                        macroFundamentals: "Macro Strength", liquiditySentiment: "Liquidity",
                        indiaImpact: "India Impact",
                        consistency: "Consistency", riskManagement: "Risk Mgmt",
                        fundManagerQuality: "Fund Manager", portfolioQuality: "Portfolio",
                        expenseEfficiency: "Expense Ratio", alphaGeneration: "Alpha",
                        downsideProtection: "Downside Prot.", sipSuitability: "SIP Fit",
                        creditQuality: "Credit Quality", yieldAttractiveness: "Yield",
                        interestRateSensitivity: "Rate Sensitivity", taxEfficiency: "Tax Efficiency",
                        inflationProtection: "Inflation Prot.", reinvestmentRisk: "Reinvest Risk",
                        portfolioFit: "Portfolio Fit", liquidityScore: "Liquidity",
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
                        centralBankDivergence: <Globe size={14} />, carryAttractiveness: <Coins size={14} />,
                        macroFundamentals: <BarChart3 size={14} />, liquiditySentiment: <Droplets size={14} />,
                        indiaImpact: <Target size={14} />,
                        consistency: <BarChart3 size={14} />, riskManagement: <Shield size={14} />,
                        fundManagerQuality: <Users size={14} />, portfolioQuality: <Layers size={14} />,
                        expenseEfficiency: <Coins size={14} />, alphaGeneration: <TrendingUp size={14} />,
                        downsideProtection: <Shield size={14} />, sipSuitability: <PiggyBank size={14} />,
                        creditQuality: <Shield size={14} />, yieldAttractiveness: <TrendingUp size={14} />,
                        interestRateSensitivity: <Activity size={14} />, taxEfficiency: <Coins size={14} />,
                        inflationProtection: <Shield size={14} />, reinvestmentRisk: <Activity size={14} />,
                        portfolioFit: <Layers size={14} />, liquidityScore: <Droplets size={14} />,
                      };
                      const invertKeys = ["geopoliticalRisk", "commodityRisk", "foreignOwnershipRisk", "tradeRouteRisk", "supplyRisk", "volatility", "regulatoryRisk", "usdCorrelation", "interestRateSensitivity", "reinvestmentRisk"];
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

        {/* Empty state — Stocks */}
        {!analysis && !loading && !error && mainTab === "stocks" && (
          <div>
            <TradingViewTickerTape tab="stocks" />
            {/* Live Running Charts */}
            <LiveChartGrid tab="stocks" />
            <MarketTicker items={
              Object.keys(stockPrices).length > 0
                ? [
                    ...(stockPrices.NIFTY50 ? [{ label: "NIFTY 50", value: stockPrices.NIFTY50.price.toLocaleString("en-IN"), change: stockPrices.NIFTY50.changePercent }] : []),
                    ...(stockPrices.SENSEX ? [{ label: "SENSEX", value: stockPrices.SENSEX.price.toLocaleString("en-IN"), change: stockPrices.SENSEX.changePercent }] : []),
                    ...(stockPrices.BANKNIFTY ? [{ label: "BANK NIFTY", value: stockPrices.BANKNIFTY.price.toLocaleString("en-IN"), change: stockPrices.BANKNIFTY.changePercent }] : []),
                    ...(forexPrices.USDINR ? [{ label: "USD/INR", value: `₹${forexPrices.USDINR.rate.toFixed(2)}`, change: forexPrices.USDINR.change24h }] : []),
                  ]
                : [{ label: "Loading...", value: "—" }]
            } />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {[
                { name: "Reliance Industries", ticker: "RELIANCE.NS", sector: "Energy" },
                { name: "TCS", ticker: "TCS.NS", sector: "IT" },
                { name: "HDFC Bank", ticker: "HDFCBANK.NS", sector: "Banking" },
                { name: "Infosys", ticker: "INFY.NS", sector: "IT" },
                { name: "ICICI Bank", ticker: "ICICIBANK.NS", sector: "Banking" },
                { name: "Bharti Airtel", ticker: "BHARTIARTL.NS", sector: "Telecom" },
                { name: "SBI", ticker: "SBIN.NS", sector: "Banking" },
                { name: "ITC", ticker: "ITC.NS", sector: "FMCG" },
                { name: "Wipro", ticker: "WIPRO.NS", sector: "IT" },
                { name: "Asian Paints", ticker: "ASIANPAINT.NS", sector: "Consumer" },
                { name: "HUL", ticker: "HINDUNILVR.NS", sector: "FMCG" },
                { name: "Adani Ports", ticker: "ADANIPORTS.NS", sector: "Infrastructure" },
              ].map(s => {
                const sym = s.ticker.replace(".NS", "");
                const livePrice = stockPrices[sym];
                const change = livePrice?.changePercent || 0;
                return (
                  <button key={s.ticker} onClick={() => { setStockQuery(s.name); setStockTicker(s.ticker); setStockName(s.name); }} className="card" style={{
                    padding: 0, textAlign: "left", cursor: "pointer",
                    border: stockTicker === s.ticker ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: "#fff", overflow: "hidden", transition: "all 0.2s",
                  }}>
                    <div style={{ padding: "14px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 2 }}>{livePrice?.name || s.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600 }}>{sym}</span>
                          <span className="badge badge-gray" style={{ padding: "1px 6px", fontSize: "0.58rem" }}>{s.sector}</span>
                        </div>
                      </div>
                      <MiniSparkline seed={s.ticker} positive={change >= 0} width={64} height={28} />
                    </div>
                    <div style={{ padding: "0 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {livePrice ? (
                        <>
                          <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>₹{livePrice.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                          <span style={{
                            fontSize: "0.78rem", fontWeight: 700,
                            color: change >= 0 ? "var(--success)" : "var(--danger)",
                            background: change >= 0 ? "var(--success-bg)" : "var(--danger-bg)",
                            padding: "2px 8px", borderRadius: 6,
                            display: "flex", alignItems: "center", gap: 2,
                          }}>
                            {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            {Math.abs(change).toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <div className="shimmer" style={{ width: 100, height: 18, borderRadius: 4 }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 16 }}>
              Showing top stocks — search above for 120+ NSE stocks with institutional-grade AI analysis
            </p>
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
    </div>
  );
}
