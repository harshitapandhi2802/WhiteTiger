"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ChevronLeft, TrendingUp, ArrowUpRight } from "lucide-react";
import { searchStocks, type StockEntry } from "@/lib/stocks";
import { searchCrypto, type CryptoEntry } from "@/lib/crypto";
import { searchCommodities, type CommodityEntry } from "@/lib/commodities";
import { searchCurrencies, type CurrencyEntry } from "@/lib/currencies";
import { searchMutualFunds, type MutualFundEntry } from "@/lib/mutualfunds";

/* ══════════════════════════════════════════════════════════════════
   WHITE TIGER — Mobile Search
   Universal search across all asset classes
   ══════════════════════════════════════════════════════════════════ */

type SearchResult = {
  name: string;
  symbol: string;
  type: string;
  typeColor: string;
  href: string;
};

export default function MobileSearch({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    if (val.trim().length < 2) { setResults([]); return; }

    const all: SearchResult[] = [];

    // Stocks
    searchStocks(val).slice(0, 5).forEach((s: StockEntry) => {
      const slug = s.ticker.replace(".NS", "").toLowerCase().replace(/[^a-z0-9]/g, "-");
      all.push({ name: s.name, symbol: s.ticker.replace(".NS", ""), type: "Stock", typeColor: "#4A9EFF", href: `/stocks/${slug}` });
    });

    // Crypto
    searchCrypto(val).slice(0, 3).forEach((c: CryptoEntry) => {
      all.push({ name: c.name, symbol: c.symbol, type: "Crypto", typeColor: "#f7931a", href: `/analyze` });
    });

    // Commodities
    searchCommodities(val).slice(0, 3).forEach((c: CommodityEntry) => {
      const slug = c.name.toLowerCase().replace(/\s+/g, "-").replace(/[()&]/g, "");
      all.push({ name: c.name, symbol: c.symbol, type: "Commodity", typeColor: "#FBBF24", href: `/commodities/${slug}` });
    });

    // Currencies
    searchCurrencies(val).slice(0, 3).forEach((c: CurrencyEntry) => {
      const slug = c.pair.toLowerCase().replace("/", "-");
      all.push({ name: c.name, symbol: c.pair, type: "Forex", typeColor: "#34D399", href: `/currency/${slug}` });
    });

    // Mutual Funds
    searchMutualFunds(val).slice(0, 3).forEach((f: MutualFundEntry) => {
      const slug = f.symbol.toLowerCase().replace(/[^a-z0-9]/g, "-");
      all.push({ name: f.name, symbol: f.symbol, type: "MF", typeColor: "#a78bfa", href: `/mutualfunds/${slug}` });
    });

    setResults(all);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-obsidian, #0A0E1A)",
      paddingBottom: 90,
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10,
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--bg-obsidian, #0A0E1A)",
        borderBottom: "0.5px solid rgba(232,237,245,0.04)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", padding: 4, flexShrink: 0,
        }}>
          <ChevronLeft size={22} />
        </button>
        <div style={{
          flex: 1, position: "relative",
          display: "flex", alignItems: "center",
        }}>
          <Search size={16} style={{
            position: "absolute", left: 12,
            color: "rgba(255,255,255,0.25)",
          }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search stocks, crypto, forex..."
            style={{
              width: "100%", padding: "12px 12px 12px 38px",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(232,237,245,0.06)",
              borderRadius: 12,
              color: "#fff", fontSize: "0.92rem",
              outline: "none",
            }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }} style={{
              position: "absolute", right: 10,
              background: "rgba(255,255,255,0.08)", border: "none",
              width: 22, height: 22, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.4)",
            }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: "8px 20px" }}>
        {query.length < 2 && (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <Search size={32} color="rgba(255,255,255,0.08)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>
              Search across all markets
            </p>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.12)", marginTop: 4 }}>
              Stocks · Crypto · Forex · Commodities · MFs
            </p>
          </div>
        )}

        {results.length > 0 && results.map((r, i) => (
          <a
            key={r.symbol + r.type + i}
            href={r.href}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 0", textDecoration: "none",
              borderBottom: i < results.length - 1 ? "0.5px solid rgba(232,237,245,0.04)" : "none",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${r.typeColor}10`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <TrendingUp size={18} color={r.typeColor} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "0.88rem", fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {r.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                  {r.symbol}
                </span>
                <span style={{
                  fontSize: "0.55rem", fontWeight: 700, color: r.typeColor,
                  background: `${r.typeColor}12`, padding: "1px 6px", borderRadius: 4,
                }}>
                  {r.type}
                </span>
              </div>
            </div>
            <ArrowUpRight size={14} color="rgba(255,255,255,0.15)" />
          </a>
        ))}

        {query.length >= 2 && results.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.2)" }}>
              No results found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
