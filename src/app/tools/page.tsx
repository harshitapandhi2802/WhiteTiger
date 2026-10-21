import Link from "next/link";
import { Table2, LineChart, Calculator, Briefcase, Receipt } from "lucide-react";

const CARDS = [
  {
    href: "/tools/option-chain", icon: <Table2 size={20} />, title: "Option Chain", badge: ["NSE data", "wt-badge-live"],
    text: "NSE's chain for NIFTY, BANK NIFTY, FIN NIFTY, MIDCAP SELECT, NIFTY NEXT 50 and F&O stocks: OI, change in OI, volume and IV by strike, plus PCR, max pain and ATM IV.",
  },
  {
    href: "/tools/strategy-builder", icon: <LineChart size={20} />, title: "Strategy Builder", badge: ["Calculator", "wt-badge-calc"],
    text: "Combine up to 8 option and futures legs. See the payoff at expiry and before it, breakevens, maximum profit and loss, net Greeks, and what-if scenarios.",
  },
  {
    href: "/tools/options-calculator", icon: <Calculator size={20} />, title: "Options Calculator", badge: ["Calculator", "wt-badge-calc"],
    text: "Theoretical price and Greeks from Black-Scholes, or the implied volatility behind a market premium. Each Greek is explained in plain English.",
  },
  {
    href: "/tools/paper-portfolio", icon: <Briefcase size={20} />, title: "Paper Portfolio", badge: ["Live prices", "wt-badge-live"],
    text: "Track stock positions without real money: live P&L, sector exposure, concentration warnings and a trade journal. Saved to your account.",
  },
  {
    href: "/tools/charges", icon: <Receipt size={20} />, title: "Charges Calculator", badge: ["Calculator", "wt-badge-calc"],
    text: "STT, exchange fees, SEBI fee, stamp duty and GST for delivery, intraday, futures and options trades, using the rates in force in 2026.",
  },
];

export default function ToolsHub() {
  return (
    <>
      <h1>Tools</h1>
      <p className="wt-lede">
        Analysis tools for traders and investors. The calculators run on numbers you enter, so they work at any time.
        The option chain and paper portfolio use live market data and show when it was last updated.
      </p>
      <div className="wt-hub">
        {CARDS.map(c => (
          <Link key={c.href} href={c.href} className="wt-card">
            <h2 style={{ justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--accent)" }}>{c.icon}</span>{c.title}
              </span>
              <span className={`wt-badge ${c.badge[1]}`}>{c.badge[0]}</span>
            </h2>
            <p className="wt-hint" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{c.text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
