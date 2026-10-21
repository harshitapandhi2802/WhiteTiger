"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchStocks, stockSlug, quoteKey } from "@/lib/stocks";
import { searchCrypto } from "@/lib/crypto";
import { searchCurrencies } from "@/lib/currencies";
import { searchCommodities } from "@/lib/commodities";
import { searchBonds } from "@/lib/bonds";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — UNIFIED SEARCH (Ctrl/⌘ K, or "/" outside inputs)
   One box for stocks, mutual funds, crypto, forex, commodities,
   bonds and tools. Open it from anywhere with openGlobalSearch().
   ═══════════════════════════════════════════════════════════════ */

import { OPEN_EVENT } from "./GlobalSearchHost";

interface Result { group: string; title: string; sub: string; href: string }

const TOOL_RESULTS: Result[] = [
  { group: "Tools", title: "Option Chain", sub: "OI, PCR, max pain, IV", href: "/tools/option-chain" },
  { group: "Tools", title: "Strategy Builder", sub: "Payoff, breakevens, Greeks", href: "/tools/strategy-builder" },
  { group: "Tools", title: "Options Calculator", sub: "Black-Scholes price, Greeks, IV", href: "/tools/options-calculator" },
  { group: "Tools", title: "Paper Portfolio", sub: "Paper trades, live P&L, journal", href: "/tools/paper-portfolio" },
  { group: "Tools", title: "Charges Calculator", sub: "STT, stamp duty, GST, fees", href: "/tools/charges" },
];

const section = (id: string) => `/analyze?section=${id}`;

export function GlobalSearch({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [funds, setFunds] = useState<{ term: string; results: Result[] }>({ term: "", results: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const openFresh = () => { setQ(""); setActive(0); setOpen(true); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); openFresh(); }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => openFresh();
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN_EVENT, onOpen); };
  }, []);


  // Mutual funds are searched on the server (8,600+ schemes).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/mf-data?mode=search&limit=5&q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const body = await res.json();
        setFunds({ term, results: (body.results || []).map((s: { schemeCode: number; schemeName: string; amcName: string }) => ({
          group: "Mutual funds", title: s.schemeName, sub: s.amcName, href: `/mf-intelligence/${s.schemeCode}`,
        })) });
      } catch { /* aborted or offline: show the other results */ }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim();
    if (!term) return TOOL_RESULTS;
    const lc = term.toLowerCase();
    const all: Result[] = [
      ...searchStocks(term, 6).map(s => ({ group: "Stocks", title: s.name, sub: `${quoteKey(s)} · ${s.sector}`, href: `/stocks/${stockSlug(s)}` })),
      ...(funds.term === term ? funds.results : []),
      ...searchCrypto(term, 3).map(c => ({ group: "Crypto", title: c.name, sub: c.symbol, href: section("crypto") })),
      ...searchCurrencies(term, 3).map(c => ({ group: "Forex", title: c.name, sub: c.pair, href: section("currency") })),
      ...searchCommodities(term, 3).map(c => ({ group: "Commodities", title: c.name, sub: `${c.exchange} · ${c.unit}`, href: section("commodities") })),
      ...searchBonds(term).slice(0, 3).map(b => ({ group: "Bonds", title: b.name, sub: b.category, href: section("debt") })),
      ...TOOL_RESULTS.filter(t => `${t.title} ${t.sub}`.toLowerCase().includes(lc)),
    ];
    // Groups with an exact name or symbol match come first ("gold" → Commodities: Gold).
    const exact = (r: Result) => r.title.toLowerCase() === lc || r.sub.split(" · ")[0].toLowerCase() === lc;
    const groups = [...new Set(all.map(r => r.group))];
    const first = groups.filter(g => all.some(r => r.group === g && exact(r)));
    return [...first, ...groups.filter(g => !first.includes(g))].flatMap(g => all.filter(r => r.group === g));
  }, [q, funds]);


  const go = (r: Result) => { setOpen(false); router.push(r.href); };

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Search White Tiger" onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(5,8,16,0.7)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "10vh 16px 16px" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 620, background: "#14213D", border: "1px solid rgba(232,237,245,0.1)", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(232,237,245,0.08)" }}>
          <Search size={18} color="#8C99B0" />
          <input ref={inputRef} autoFocus value={q} onChange={e => { setQ(e.target.value); setActive(0); }} placeholder="Search stocks, funds, crypto, forex, commodities, bonds, tools"
            aria-label="Search" aria-activedescendant={results[active] ? `gs-${active}` : undefined}
            onKeyDown={e => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(results.length - 1, a + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
              if (e.key === "Enter" && results[active]) go(results[active]);
            }}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#E8EDF5", fontSize: "1rem" }} />
          <button onClick={() => setOpen(false)} aria-label="Close search" style={{ all: "unset", cursor: "pointer", color: "#8C99B0", display: "flex" }}><X size={18} /></button>
        </div>
        <ul role="listbox" style={{ listStyle: "none", maxHeight: "60vh", overflowY: "auto", padding: 6, margin: 0 }}>
          {results.length === 0 && <li style={{ padding: 16, color: "#8C99B0", fontSize: "0.85rem" }}>No matches.</li>}
          {results.map((r, i) => {
            const header = i === 0 || results[i - 1].group !== r.group ? r.group : null;
            return (
              <li key={`${r.group}-${r.href}-${r.title}`}>
                {header && <div style={{ padding: "8px 10px 4px", fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5C6680" }}>{header}</div>}
                <button id={`gs-${i}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(r)}
                  style={{ all: "unset", boxSizing: "border-box", width: "100%", display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 10px", borderRadius: 8, cursor: "pointer", background: i === active ? "rgba(74,158,255,0.12)" : "transparent" }}>
                  <span style={{ color: "#E8EDF5", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                  <span style={{ color: "#8C99B0", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "45%" }}>{r.sub}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(232,237,245,0.08)", fontSize: "0.7rem", color: "#5C6680" }}>
          ↑ ↓ to move · Enter to open · Esc to close · Ctrl/⌘ K from anywhere
        </div>
      </div>
    </div>
  );
}
