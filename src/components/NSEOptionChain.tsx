"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ════════════════════════════════════════════════════
   NSE OPTION CHAIN — Sensibull-style Live UI
   • Real-time NSE data via /api/option-chain
   • Searchable F&O stocks
   • Expiry tabs with DTE
   • Professional option chain table
   • PCR / Max Pain / ATM IV / IV Percentile footer
   ════════════════════════════════════════════════════ */

interface ChainRow {
  strike: number;
  isATM: boolean;
  ce: { oi: number; oiChange: number; oiChangePct: number; ltp: number; change: number; changePct: number; volume: number; iv: number } | null;
  pe: { oi: number; oiChange: number; oiChangePct: number; ltp: number; change: number; changePct: number; volume: number; iv: number } | null;
}

interface ChainData {
  symbol: string;
  name: string;
  isLive: boolean;
  expiryDates: string[];
  selectedExpiry: string;
  daysToExpiry: number;
  spotPrice: number;
  spotChange: number;
  spotChangePct: number;
  timestamp: string;
  chain: ChainRow[];
  summary: { pcr: number; maxPain: number; atmIV: number; ivPercentile: number; totalCEOI: number; totalPEOI: number };
}

interface StockItem { symbol: string; name: string; type: string }

function formatOI(oi: number): string {
  if (oi >= 10000000) return (oi / 10000000).toFixed(2) + "Cr";
  if (oi >= 100000) return (oi / 100000).toFixed(2);
  if (oi >= 1000) return (oi / 1000).toFixed(1) + "K";
  return String(oi);
}

function formatLTP(price: number): string {
  if (price >= 10000) return price.toFixed(0);
  if (price >= 100) return price.toFixed(1);
  return price.toFixed(2);
}

function PctBadge({ value, small = false }: { value: number; small?: boolean }) {
  if (value === 0) return <span style={{ fontSize: small ? "0.46rem" : "0.52rem", color: "#999" }}>0.00%</span>;
  const color = value > 0 ? "#00897b" : "#e53935";
  return (
    <span style={{ fontSize: small ? "0.46rem" : "0.52rem", fontWeight: 600, color }}>
      {value > 0 ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

/* ─── OI Strength Bars between rows ─── */
function OIBar({ ceOI, peOI, maxOI }: { ceOI: number; peOI: number; maxOI: number }) {
  const cePct = maxOI > 0 ? (ceOI / maxOI) * 100 : 0;
  const pePct = maxOI > 0 ? (peOI / maxOI) * 100 : 0;
  return (
    <div style={{ display: "flex", height: 3, gap: 1, margin: "0 4px" }}>
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <div style={{
          width: `${cePct}%`, height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, transparent, #ef5350)",
          transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ width: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{
          width: `${pePct}%`, height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, #43a047, transparent)",
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

export function NSEOptionChain() {
  const [symbol, setSymbol] = useState("NIFTY");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<StockItem[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [data, setData] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const expiryScrollRef = useRef<HTMLDivElement>(null);

  // Fetch option chain data
  const fetchChain = useCallback(async (sym?: string, exp?: string) => {
    try {
      const s = sym || symbol;
      const params = new URLSearchParams({ symbol: s });
      if (exp) params.set("expiry", exp);
      const res = await fetch(`/api/option-chain?${params}`);
      const json = await res.json();
      setData(json);
      if (!exp && json.selectedExpiry) setSelectedExpiry(json.selectedExpiry);
    } catch (e) {
      console.error("Option chain fetch error:", e);
    }
  }, [symbol]);

  // Initial load + auto-refresh
  useEffect(() => {
    setLoading(true);
    fetchChain().finally(() => setLoading(false));
    const interval = setInterval(() => { setRefreshing(true); fetchChain(symbol, selectedExpiry).finally(() => setRefreshing(false)); }, 30000);
    return () => clearInterval(interval);
  }, [symbol, fetchChain, selectedExpiry]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/option-chain?action=search&q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        setSearchResults(json.stocks || []);
      } catch { setSearchResults([]); }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectStock = (s: StockItem) => {
    setSymbol(s.symbol);
    setSearchQuery("");
    setShowSearch(false);
    setSelectedExpiry("");
    setLoading(true);
    fetchChain(s.symbol).finally(() => setLoading(false));
  };

  const handleExpiryChange = (exp: string) => {
    setSelectedExpiry(exp);
    setRefreshing(true);
    fetchChain(symbol, exp).finally(() => setRefreshing(false));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChain(symbol, selectedExpiry).finally(() => setRefreshing(false));
  };

  const maxOI = data ? Math.max(...data.chain.flatMap(r => [r.ce?.oi || 0, r.pe?.oi || 0]), 1) : 1;

  // Format expiry for display
  const formatExpiry = (exp: string, dte?: number) => {
    const parts = exp.split("-");
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      if (dte !== undefined && dte >= 0) {
        if (dte <= 30) return `${day} ${month} (${dte}D)`;
        const months = Math.round(dte / 30);
        return `${day} ${month} (${months}M)`;
      }
      return `${day} ${month}`;
    }
    return exp;
  };

  // Calculate DTE for each expiry
  const getExpiryDTE = (exp: string) => {
    try {
      const parts = exp.split("-");
      const monthMap: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
      const dateStr = `${parts[2]}-${monthMap[parts[1]] || "01"}-${parts[0]}`;
      const d = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return Math.max(0, Math.ceil((d.getTime() - today.getTime()) / 86400000));
    } catch { return 0; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ═══ SEARCH HEADER ═══ */}
      <div ref={searchRef} style={{ padding: "8px 10px 6px", borderBottom: "1px solid #eee", position: "relative" }}>
        {!showSearch ? (
          <button onClick={() => setShowSearch(true)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", background: "#f8f9fa", border: "1px solid #e8e8e8",
            borderRadius: 8, cursor: "pointer", textAlign: "left",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: "0.78rem", color: "#1a1a2e" }}>{data?.symbol || symbol}</span>
                {data && (
                  <>
                    <span style={{ fontWeight: 700, fontSize: "0.72rem", color: data.spotChange >= 0 ? "#00897b" : "#e53935" }}>
                      {data.spotPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                    <span style={{ fontSize: "0.56rem", fontWeight: 600, color: data.spotChangePct >= 0 ? "#00897b" : "#e53935" }}>
                      {data.spotChange >= 0 ? "+" : ""}{data.spotChange.toFixed(2)} ({data.spotChangePct >= 0 ? "+" : ""}{data.spotChangePct.toFixed(2)}%)
                    </span>
                  </>
                )}
              </div>
              <div style={{ fontSize: "0.48rem", color: "#999", marginTop: 1 }}>{data?.name}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {data?.isLive && (
                <span style={{
                  fontSize: "0.4rem", fontWeight: 800, color: "#00897b", background: "#e8f5e9",
                  padding: "1px 4px", borderRadius: 3, letterSpacing: 0.5,
                  display: "flex", alignItems: "center", gap: 2,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00c853", animation: "nse-blink 2s infinite" }} />
                  LIVE
                </span>
              )}
              {!data?.isLive && data && (
                <span style={{ fontSize: "0.4rem", fontWeight: 700, color: "#ff9800", background: "#fff8e1", padding: "1px 4px", borderRadius: 3 }}>SIM</span>
              )}
            </div>
          </button>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "#f8f9fa", borderRadius: 8, border: "1px solid #2962ff" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#2962ff" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                autoFocus
                placeholder="Search F&O stocks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, border: "none", background: "transparent", outline: "none",
                  fontSize: "0.72rem", color: "#1a1a2e", fontWeight: 600,
                }}
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} style={{
                background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: "0.7rem", fontWeight: 700, padding: "2px 4px",
              }}>✕</button>
            </div>
            {searchResults.length > 0 && (
              <div style={{
                position: "absolute", left: 10, right: 10, top: "100%",
                background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100,
                maxHeight: 240, overflowY: "auto",
              }}>
                {searchResults.map(s => (
                  <button key={s.symbol} onClick={() => handleSelectStock(s)} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", border: "none", borderBottom: "1px solid #f5f5f5",
                    background: "#fff", cursor: "pointer", textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0f4ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.72rem", color: "#1a1a2e" }}>{s.symbol}</div>
                      <div style={{ fontSize: "0.52rem", color: "#999" }}>{s.name}</div>
                    </div>
                    <span style={{
                      fontSize: "0.42rem", fontWeight: 700, letterSpacing: 0.5,
                      color: s.type === "index" ? "#2962ff" : "#666",
                      background: s.type === "index" ? "#e8eeff" : "#f5f5f5",
                      padding: "2px 6px", borderRadius: 3,
                    }}>{s.type.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ EXPIRY TABS ═══ */}
      {data && (
        <div ref={expiryScrollRef} style={{
          display: "flex", gap: 4, padding: "6px 10px",
          overflowX: "auto", borderBottom: "1px solid #eee",
          scrollbarWidth: "none",
        }}>
          {data.expiryDates.map(exp => {
            const isSelected = exp === selectedExpiry;
            const dte = getExpiryDTE(exp);
            return (
              <button key={exp} onClick={() => handleExpiryChange(exp)} style={{
                padding: "4px 10px", borderRadius: 16, whiteSpace: "nowrap",
                border: isSelected ? "1.5px solid #2962ff" : "1px solid #e0e0e0",
                background: isSelected ? "#eef2ff" : "#fff",
                color: isSelected ? "#2962ff" : "#666",
                fontWeight: isSelected ? 700 : 500, fontSize: "0.56rem",
                cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
              }}>
                {formatExpiry(exp, dte)}
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ LOADING STATE ═══ */}
      {loading && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20 }}>
          <div style={{ width: 24, height: 24, border: "3px solid #e8eeff", borderTopColor: "#2962ff", borderRadius: "50%", animation: "deriv-spin 0.7s linear infinite" }} />
          <span style={{ fontSize: "0.62rem", color: "#999", fontWeight: 600 }}>Loading Option Chain...</span>
        </div>
      )}

      {/* ═══ OPTION CHAIN TABLE ═══ */}
      {!loading && data && (
        <>
          {/* Table Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 52px 1fr 1fr",
            padding: "6px 6px 4px", borderBottom: "2px solid #e8e8e8",
            background: "#fafbfc", position: "sticky", top: 0, zIndex: 5,
          }}>
            <div style={{ textAlign: "center", fontSize: "0.48rem", fontWeight: 700, color: "#888" }}>
              <div>CE OI</div>
              <div style={{ fontSize: "0.38rem", color: "#bbb" }}>(in Lakh)</div>
            </div>
            <div style={{ textAlign: "center", fontSize: "0.48rem", fontWeight: 700, color: "#888" }}>Call LTP</div>
            <div style={{ textAlign: "center", fontSize: "0.48rem", fontWeight: 700, color: "#555" }}>
              Strike
              <span style={{ fontSize: "0.5rem", marginLeft: 2 }}>↑</span>
            </div>
            <div style={{ textAlign: "center", fontSize: "0.48rem", fontWeight: 700, color: "#888" }}>Put LTP</div>
            <div style={{ textAlign: "center", fontSize: "0.48rem", fontWeight: 700, color: "#888" }}>
              <div>PE OI</div>
              <div style={{ fontSize: "0.38rem", color: "#bbb" }}>(in Lakh)</div>
            </div>
          </div>

          {/* Table Body */}
          <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.08) transparent" }}>
            {data.chain.map((row, i) => (
              <div key={row.strike}>
                {/* Main Row */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 52px 1fr 1fr",
                  padding: "0 6px",
                  background: row.isATM ? "rgba(41,98,255,0.04)" : i % 2 === 0 ? "#fff" : "#fafbfc",
                  borderLeft: row.isATM ? "3px solid #2962ff" : "3px solid transparent",
                  transition: "background 0.2s",
                }}>
                  {/* CE OI */}
                  <div style={{ textAlign: "center", padding: "6px 2px 1px" }}>
                    <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#1a1a2e", fontVariantNumeric: "tabular-nums" }}>
                      {formatOI(row.ce?.oi || 0)}
                    </div>
                    <PctBadge value={row.ce?.oiChangePct || 0} small />
                  </div>

                  {/* Call LTP */}
                  <div style={{ textAlign: "center", padding: "6px 2px 1px" }}>
                    <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#1a1a2e", fontVariantNumeric: "tabular-nums" }}>
                      {formatLTP(row.ce?.ltp || 0)}
                    </div>
                    <PctBadge value={row.ce?.changePct || 0} small />
                  </div>

                  {/* Strike */}
                  <div style={{
                    textAlign: "center", padding: "6px 2px 1px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      fontWeight: 800, fontSize: "0.68rem",
                      color: row.isATM ? "#fff" : "#333",
                      background: row.isATM ? "#1a1a2e" : "transparent",
                      padding: row.isATM ? "3px 8px" : "3px 4px",
                      borderRadius: row.isATM ? 5 : 0,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {row.strike.toLocaleString()}
                    </span>
                  </div>

                  {/* Put LTP */}
                  <div style={{ textAlign: "center", padding: "6px 2px 1px" }}>
                    <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#1a1a2e", fontVariantNumeric: "tabular-nums" }}>
                      {formatLTP(row.pe?.ltp || 0)}
                    </div>
                    <PctBadge value={row.pe?.changePct || 0} small />
                  </div>

                  {/* PE OI */}
                  <div style={{ textAlign: "center", padding: "6px 2px 1px" }}>
                    <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#1a1a2e", fontVariantNumeric: "tabular-nums" }}>
                      {formatOI(row.pe?.oi || 0)}
                    </div>
                    <PctBadge value={row.pe?.oiChangePct || 0} small />
                  </div>
                </div>

                {/* OI Strength Bar Between Rows */}
                {i < data.chain.length - 1 && (
                  <OIBar ceOI={row.ce?.oi || 0} peOI={row.pe?.oi || 0} maxOI={maxOI} />
                )}
              </div>
            ))}
          </div>

          {/* ═══ SUMMARY FOOTER ═══ */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr",
            borderTop: "2px solid #e0e0e0", background: "#fafbfc",
          }}>
            <div style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #eee" }}>
              <div style={{ fontSize: "0.44rem", fontWeight: 700, color: "#888", letterSpacing: 0.3 }}>PCR</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: data.summary.pcr > 1 ? "#00897b" : data.summary.pcr < 0.7 ? "#e53935" : "#1a1a2e" }}>
                {data.summary.pcr.toFixed(2)}
              </div>
            </div>
            <div style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #eee" }}>
              <div style={{ fontSize: "0.44rem", fontWeight: 700, color: "#888", letterSpacing: 0.3 }}>Max Pain</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#7b1fa2" }}>
                {data.summary.maxPain.toLocaleString()}
              </div>
            </div>
            <div style={{ padding: "8px 6px", textAlign: "center", borderRight: "1px solid #eee" }}>
              <div style={{ fontSize: "0.44rem", fontWeight: 700, color: "#888", letterSpacing: 0.3 }}>ATM IV</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#e65100" }}>
                {data.summary.atmIV.toFixed(2)}
              </div>
            </div>
            <div style={{ padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: "0.44rem", fontWeight: 700, color: "#888", letterSpacing: 0.3 }}>IV Percentile</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 3 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: data.summary.ivPercentile > 70 ? "#e53935" : data.summary.ivPercentile > 40 ? "#e65100" : "#00897b" }}>
                  {data.summary.ivPercentile.toFixed(2)}
                </span>
                <span style={{
                  fontSize: "0.38rem", fontWeight: 700, letterSpacing: 0.3,
                  color: data.summary.ivPercentile > 70 ? "#e53935" : data.summary.ivPercentile > 40 ? "#e65100" : "#00897b",
                }}>
                  {data.summary.ivPercentile > 80 ? "Very High" : data.summary.ivPercentile > 60 ? "High" : data.summary.ivPercentile > 40 ? "Moderate" : "Low"}
                </span>
              </div>
            </div>
          </div>

          {/* Refresh Bar */}
          <div style={{
            padding: "4px 10px", borderTop: "1px solid #eee",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#f8f9fa",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {refreshing && <div style={{ width: 8, height: 8, border: "1.5px solid #ddd", borderTopColor: "#2962ff", borderRadius: "50%", animation: "deriv-spin 0.6s linear infinite" }} />}
              <span style={{ fontSize: "0.42rem", color: "#bbb" }}>
                {data.timestamp ? `Updated: ${data.timestamp}` : "Auto-refresh 30s"}
              </span>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} style={{
              background: "none", border: "1px solid #e0e0e0", borderRadius: 4,
              padding: "2px 6px", cursor: refreshing ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: 3,
              color: "#888", fontSize: "0.44rem", fontWeight: 600,
            }}>
              <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                style={{ animation: refreshing ? "deriv-spin 0.7s linear infinite" : "none" }}>
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Refresh
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes nse-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes deriv-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        div::-webkit-scrollbar { width: 4px; height: 4px; }
        div::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
