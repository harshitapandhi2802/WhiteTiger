"use client";
import { Globe, Anchor, Activity, Package, Users, Shield, TrendingUp, Target, Layers, BarChart3, Check } from "lucide-react";

/* ── Score Gauge ── */
export function ScoreGauge({ score, label, icon, invertColor }: { score: number; label: string; icon: React.ReactNode; invertColor?: boolean }) {
  const pct = (score / 10) * 100;
  let color: string;
  if (invertColor) {
    color = score <= 3 ? "var(--success)" : score <= 6 ? "var(--warning)" : "var(--danger)";
  } else {
    color = score >= 7 ? "var(--success)" : score >= 4 ? "var(--warning)" : "var(--danger)";
  }
  return (
    <div style={{ padding: 14, borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-card)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ color: "var(--text-muted)" }}>{icon}</div>
        <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>/10</span>
      </div>
      <div style={{ height: 4, background: "var(--border-light)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.8s ease-out" }} />
      </div>
    </div>
  );
}

/* ── Generic Scenario Table ── */
export function ScenarioTable({ scenarios }: { scenarios: { label: string; target: string; probability: number; trigger: string; color: string; bg: string }[] }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-title">Scenario Analysis</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Scenario", "Target", "Trigger", "Prob."].map(h => (
              <th key={h} style={{ textAlign: h === "Scenario" ? "left" : "right", padding: "8px", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.7rem", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.map(r => (
            <tr key={r.label} style={{ borderBottom: "1px solid var(--border-light)" }}>
              <td style={{ padding: "10px 8px", fontWeight: 600, color: r.color }}>{r.label}</td>
              <td style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600 }}>{r.target}</td>
              <td style={{ textAlign: "right", padding: "10px 8px", color: "var(--text-muted)", fontSize: "0.78rem", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.trigger}</td>
              <td style={{ textAlign: "right", padding: "10px 8px" }}>
                <span style={{ background: r.bg, color: r.color, padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontSize: "0.75rem" }}>{r.probability}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Country/Tag List ── */
export function TagList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (!items?.length) return null;
  return (
    <div>
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 5 }}>
          {icon} {item}
        </div>
      ))}
    </div>
  );
}

/* ── Markdown renderer ── */
export function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const data = tableRows.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c.trim())));
      elements.push(
        <div key={key++} style={{ overflowX: "auto", margin: "0.6rem 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead><tr style={{ borderBottom: "2px solid var(--border)" }}>
              {header.map((h, i) => <th key={i} style={{ textAlign: "left", padding: "8px", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase" }}>{h.trim()}</th>)}
            </tr></thead>
            <tbody>{data.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid var(--border-light)" }}>
                {row.map((cell, ci) => <td key={ci} style={{ padding: "8px", color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: fmtInline(cell.trim()) }} />)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
    inTable = false;
  };

  for (const line of lines) {
    if (line.trim().startsWith("|")) { inTable = true; tableRows.push(line.split("|").filter((_, i, a) => i > 0 && i < a.length - 1)); continue; }
    if (inTable) flushTable();
    if (line.startsWith("### ")) elements.push(<h3 key={key++}>{line.slice(4)}</h3>);
    else if (line.startsWith("## ")) elements.push(<h2 key={key++}>{line.slice(3)}</h2>);
    else if (line.startsWith("# ")) elements.push(<h2 key={key++} style={{ fontSize: "1.1rem" }}>{line.slice(2)}</h2>);
    else if (line.startsWith("- ") || line.startsWith("* ")) elements.push(<ul key={key++} style={{ margin: "0.2rem 0", paddingLeft: "1.3rem" }}><li dangerouslySetInnerHTML={{ __html: fmtInline(line.slice(2)) }} /></ul>);
    else if (line.startsWith("---")) elements.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid var(--border-light)", margin: "1.2rem 0" }} />);
    else if (line.trim()) elements.push(<p key={key++} dangerouslySetInnerHTML={{ __html: fmtInline(line) }} />);
  }
  if (inTable) flushTable();
  return elements;
}

function fmtInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

/* ── Badge helpers ── */
export function getRatingBadge(r: string) {
  const u = (r || "").toUpperCase();
  if (u.includes("STRONG BUY")) return { label: "STRONG BUY", cls: "badge-green" };
  if (u.includes("STRONG SELL")) return { label: "STRONG SELL", cls: "badge-red" };
  if (u.includes("BUY")) return { label: "BUY", cls: "badge-green" };
  if (u.includes("SELL")) return { label: "SELL", cls: "badge-red" };
  if (u.includes("HOLD")) return { label: "HOLD", cls: "badge-yellow" };
  return null;
}

export function getOutlookBadge(o: string) {
  const u = (o || "").toUpperCase();
  if (u.includes("BULLISH")) return { label: "BULLISH", cls: "badge-green" };
  if (u.includes("BEARISH")) return { label: "BEARISH", cls: "badge-red" };
  return { label: "NEUTRAL", cls: "badge-yellow" };
}
