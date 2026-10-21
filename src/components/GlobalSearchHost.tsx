"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";

/* Lightweight host for the unified search: listens for Ctrl/⌘ K, "/" and
   openGlobalSearch(), and only then loads the search (and its stock list). */

export const OPEN_EVENT = "wt-open-search";
export const openGlobalSearch = () => window.dispatchEvent(new Event(OPEN_EVENT));

const GlobalSearch = dynamic(() => import("./GlobalSearch").then(m => m.GlobalSearch), { ssr: false });

export function GlobalSearchHost() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (loaded) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); setLoaded(true); }
    };
    const onOpen = () => setLoaded(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN_EVENT, onOpen); };
  }, [loaded]);
  return loaded ? <GlobalSearch defaultOpen /> : null;
}

/** Visible search trigger for headers. */
export function SearchButton({ compact = false }: { compact?: boolean }) {
  return (
    <button onClick={openGlobalSearch} aria-label="Search White Tiger"
      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: compact ? "7px 9px" : "7px 12px", borderRadius: 9, border: "1px solid rgba(232,237,245,0.1)", background: "rgba(255,255,255,0.03)", color: "#8C99B0", fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>
      <Search size={14} />{!compact && <>Search <kbd style={{ fontSize: "0.65rem", border: "1px solid rgba(232,237,245,0.15)", borderRadius: 4, padding: "0 4px" }}>⌘K</kbd></>}
    </button>
  );
}
