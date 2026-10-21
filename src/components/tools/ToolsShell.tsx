"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { SearchButton } from "@/components/GlobalSearchHost";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — TOOLS SHELL
   Shared header, tool switcher and disclaimer for /tools/*.
   ═══════════════════════════════════════════════════════════════ */

export const TOOLS = [
  { href: "/tools/option-chain", label: "Option Chain" },
  { href: "/tools/strategy-builder", label: "Strategy Builder" },
  { href: "/tools/options-calculator", label: "Options Calculator" },
  { href: "/tools/paper-portfolio", label: "Paper Portfolio" },
  { href: "/tools/charges", label: "Charges Calculator" },
];

export function ToolsShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="wt-tools">
      <header className="wt-tools-top">
        <Link href="/tools" className="wt-tools-brand" aria-label="White Tiger tools home">
          <Image src="/logo.png" alt="" width={26} height={26} />
          <span>Tools</span>
        </Link>
        <nav className="wt-tools-nav" aria-label="Tools">
          {TOOLS.map(t => (
            <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>{t.label}</Link>
          ))}
        </nav>
        <SearchButton compact />
        <Link href="/analyze" className="wt-tools-back">← Markets</Link>
      </header>
      <main className="wt-page">
        {children}
        <p className="wt-footer-note">
          These tools are for education and research. They don&apos;t place orders, and White Tiger is not a
          SEBI-registered investment adviser or research analyst. Options can lose their entire value and
          writing options can lose more than the premium received. Check figures with your broker before you trade.
        </p>
      </main>
    </div>
  );
}

/** Small (i) icon with an explanation on hover or focus. */
export function Tip({ text }: { text: string }) {
  return (
    <span className="wt-tip" tabIndex={0} aria-label={text}>
      <Info size={12} />
      <span role="tooltip">{text}</span>
    </span>
  );
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹ with Indian grouping; null → "—". */
export function rupees(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  if (Math.abs(v) < (decimals === 0 ? 0.5 : 0.005)) v = 0; // no "−₹0.00"
  const f = decimals === 0 ? inr0 : inr;
  return `${v < 0 ? "−" : ""}₹${f.format(Math.abs(v))}`;
}

export function num(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(v);
}

export const tone = (v: number | null | undefined) => (v === null || v === undefined ? "" : v > 0 ? "wt-pos" : v < 0 ? "wt-neg" : "");
