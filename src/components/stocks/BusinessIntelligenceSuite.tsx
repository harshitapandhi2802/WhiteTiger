"use client";
import React, { useState, useCallback, useMemo } from "react";
import {
  Building2, Globe2, Users2, Brain, Layers, TrendingUp, Shield,
  Factory, Package, Target, AlertTriangle, CheckCircle2, XCircle,
  Sparkles, RefreshCw, Info, ChevronRight, Award,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — BUSINESS INTELLIGENCE SUITE
   5-tab institutional-grade company research layer that sits on
   top of /stocks/[symbol]. Inspired by what an analyst would build
   on top of annual reports — not copied from any one platform.

   Every visible number is AI-generated from public-filings memory;
   the suite makes that provenance explicit so users always know
   what they're looking at (matches the audit data-accuracy bar).
   ═══════════════════════════════════════════════════════════════ */

// ─── DESIGN TOKENS ──────────────────────────────────────────────
const C = {
  bg: "#0F1322", card: "#161B2E", soft: "#1B2138", border: "rgba(232,237,245,0.08)",
  text: "#E8ECF4", muted: "#8C99B0", dim: "rgba(232,237,245,0.4)",
  accent: "#4A9EFF", success: "#34D399", warn: "#FBBF24", danger: "#F87171", purple: "#A78BFA",
};

const SEG_COLORS = ["#4A9EFF", "#A78BFA", "#34D399", "#FBBF24", "#F87171", "#22D3EE", "#F472B6", "#FB923C"];

// ─── TYPES (mirror API shape) ───────────────────────────────────
interface Dossier {
  snapshot?: { founded?: string; headquarters?: string; ceo?: string; employees?: string; sector?: string; industry?: string; marketCap?: string; listingDate?: string; fyEnd?: string };
  revenueBreakdown?: { fiscalYear?: string; totalRevenue?: string; bySegment?: { name: string; percent: number; growthYoY?: number; color?: string }[]; byGeography?: { region: string; percent: number }[]; byProduct?: { category: string; percent: number }[] };
  businessSegments?: { name: string; revenueContribution: number; growthRate: number; marginProfile?: string; strategicImportance?: string; description?: string }[];
  productPortfolio?: { flagshipProducts?: string[]; keyBrands?: string[]; services?: string[] };
  subsidiaries?: { name: string; ownership: number; business: string; contribution?: string }[];
  globalPresence?: { countriesServed?: string[]; manufacturingLocations?: string[]; revenueByRegion?: { region: string; percent: number }[] };
  industry?: { name?: string; sizeINR?: string; cagr5y?: number; growthDrivers?: string[]; keyRisks?: string[]; valueChain?: { stage: string; description?: string; companyPresence?: boolean }[]; marketShare?: { companyShare?: number; ranking?: number; totalPlayers?: number; topPlayers?: { name: string; share: number }[] }; trends?: { type: string; description: string; impact: string }[]; outlook?: { bull?: string; base?: string; bear?: string } };
  competitors?: { ticker: string; name: string; revenueCr?: number; profitCr?: number; ebitdaMargin?: number; roe?: number; roce?: number; debtEquity?: number; pe?: number; strengthScore?: number }[];
  ownership?: { promoter?: number; fii?: number; dii?: number; public?: number; pledge?: number; changeQoQ?: { promoter?: number; fii?: number; dii?: number }; smartMoney?: { fiiActivity?: string; mfActivity?: string; conviction?: string; recentMoves?: string[] } };
  scores?: { businessQuality?: number; managementQuality?: number; competitiveAdvantage?: number; financialStrength?: number; growthPotential?: number; companyScore?: number };
  moat?: { brand?: number; cost?: number; network?: number; switching?: number; distribution?: number; ip?: number; explanation?: string };
  supplyChain?: { keySuppliers?: string[]; keyCustomers?: string[]; concentrationRisk?: string; description?: string };
  risks?: { type: string; severity: string; description: string }[];
  thesis?: { whyBuy?: string[]; whyAvoid?: string[]; keyTriggers?: string[]; majorRisks?: string[] };
}

interface APIResponse {
  success: boolean;
  ticker: string;
  companyName: string;
  generatedAt: string;
  dossier: Dossier;
  livePrice?: { price: number; source: string; asOf: string } | null;
  dataNote?: string;
  cached?: boolean;
}

type SubTab = "business" | "industry" | "competitors" | "ownership" | "ai";

// ─── ATOMS ──────────────────────────────────────────────────────
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 };
const tinyLabel: React.CSSProperties = { fontSize: "0.5rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" };

function Donut({ data, size = 140 }: { data: { name: string; percent: number; color?: string }[]; size?: number }) {
  const total = Math.max(1, data.reduce((a, b) => a + (b.percent || 0), 0));
  const r = size / 2 - 8, cx = size / 2, cy = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.12} />
      {data.map((d, i) => {
        const pct = (d.percent || 0) / total;
        const dash = pct * 2 * Math.PI * r;
        const gap = 2 * Math.PI * r - dash;
        const rot = (acc / total) * 360 - 90;
        acc += d.percent || 0;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color || SEG_COLORS[i % SEG_COLORS.length]} strokeWidth={size * 0.12}
            strokeDasharray={`${dash} ${gap}`} transform={`rotate(${rot} ${cx} ${cy})`} strokeLinecap="butt" />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={C.text} fontSize={size * 0.13} fontWeight={800}>{data.length}</text>
      <text x={cx} y={cy + size * 0.1} textAnchor="middle" fill={C.muted} fontSize={size * 0.07} fontWeight={700}>SEGMENTS</text>
    </svg>
  );
}

function Bar({ value, color = C.accent, max = 100 }: { value: number; color?: string; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.4s ease-out" }} />
    </div>
  );
}

function ScoreRing({ value, label, size = 64, color }: { value: number; label: string; size?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const c = color || (pct >= 70 ? C.success : pct >= 50 ? C.warn : C.danger);
  return (
    <div style={{ textAlign: "center", minWidth: size }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.6" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={c} strokeWidth="2.6" strokeDasharray={`${pct * 0.97} 100`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.26, fontWeight: 900, color: c }}>{Math.round(value)}</div>
      </div>
      <div style={{ marginTop: 4, fontSize: "0.55rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

function Chip({ children, color = C.accent, fill }: { children: React.ReactNode; color?: string; fill?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6,
      background: fill || `${color}1F`, color, fontSize: "0.6rem", fontWeight: 800, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(74,158,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>{icon}</div>
      <div>
        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: "0.66rem", color: C.muted, fontWeight: 600 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ─── TAB: BUSINESS INTELLIGENCE ─────────────────────────────────
function BusinessTab({ d, ticker }: { d: Dossier; ticker: string }) {
  const segments = d.revenueBreakdown?.bySegment || [];
  const geos = d.revenueBreakdown?.byGeography || [];
  const segData = segments.map((s, i) => ({ ...s, color: s.color || SEG_COLORS[i % SEG_COLORS.length] }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Snapshot */}
      <div style={card}>
        <SectionTitle icon={<Building2 size={15} />} title="Company Snapshot" subtitle={`${ticker} · institutional profile`} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {[
            { l: "Founded", v: d.snapshot?.founded },
            { l: "Headquarters", v: d.snapshot?.headquarters },
            { l: "CEO", v: d.snapshot?.ceo },
            { l: "Employees", v: d.snapshot?.employees },
            { l: "Sector", v: d.snapshot?.sector },
            { l: "Industry", v: d.snapshot?.industry },
            { l: "Market Cap", v: d.snapshot?.marketCap },
            { l: "Listed", v: d.snapshot?.listingDate },
          ].filter(x => x.v).map(x => (
            <div key={x.l} style={{ background: C.soft, borderRadius: 8, padding: "10px 12px" }}>
              <div style={tinyLabel}>{x.l}</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: C.text, marginTop: 3 }}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue breakdown */}
      {segData.length > 0 && (
        <div style={card}>
          <SectionTitle icon={<Layers size={15} />} title="Revenue Breakdown" subtitle={`${d.revenueBreakdown?.fiscalYear || "Latest reported"} · ${d.revenueBreakdown?.totalRevenue || ""}`} />
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20, alignItems: "center" }}>
            <Donut data={segData} size={160} />
            <div style={{ display: "grid", gap: 8 }}>
              {segData.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                  <div style={{ flex: 1, fontSize: "0.74rem", fontWeight: 700, color: C.text }}>{s.name}</div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 800, color: C.text, minWidth: 50, textAlign: "right" }}>{s.percent}%</div>
                  {typeof s.growthYoY === "number" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: s.growthYoY >= 0 ? C.success : C.danger, minWidth: 50, textAlign: "right" }}>
                      {s.growthYoY >= 0 ? "+" : ""}{s.growthYoY}% yoy
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {geos.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <div style={{ ...tinyLabel, marginBottom: 8 }}>By Geography</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {geos.map((g, i) => (
                  <div key={i} style={{ background: C.soft, padding: "8px 12px", borderRadius: 8, minWidth: 100 }}>
                    <div style={{ fontSize: "0.6rem", color: C.muted, fontWeight: 700 }}>{g.region}</div>
                    <div style={{ fontSize: "0.84rem", fontWeight: 800, color: C.accent }}>{g.percent}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Business segments */}
      {(d.businessSegments?.length ?? 0) > 0 && (
        <div style={card}>
          <SectionTitle icon={<Target size={15} />} title="Business Segments" subtitle="Strategic role of each unit" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {d.businessSegments!.map((s, i) => {
              const importColor = s.strategicImportance === "Core" ? C.accent : s.strategicImportance === "Growth" ? C.success : s.strategicImportance === "Emerging" ? C.purple : C.muted;
              return (
                <div key={i} style={{ background: C.soft, borderRadius: 10, padding: 12, borderLeft: `3px solid ${importColor}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: C.text }}>{s.name}</div>
                    {s.strategicImportance && <Chip color={importColor}>{s.strategicImportance}</Chip>}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                    <div><div style={tinyLabel}>Revenue</div><div style={{ fontSize: "0.78rem", fontWeight: 800, color: C.accent }}>{s.revenueContribution}%</div></div>
                    <div><div style={tinyLabel}>Growth</div><div style={{ fontSize: "0.78rem", fontWeight: 800, color: s.growthRate >= 0 ? C.success : C.danger }}>{s.growthRate >= 0 ? "+" : ""}{s.growthRate}%</div></div>
                    {s.marginProfile && <div><div style={tinyLabel}>Margin</div><div style={{ fontSize: "0.74rem", fontWeight: 700, color: C.text }}>{s.marginProfile}</div></div>}
                  </div>
                  {s.description && <div style={{ fontSize: "0.66rem", color: C.muted, lineHeight: 1.5 }}>{s.description}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product portfolio */}
      {(d.productPortfolio?.flagshipProducts?.length || d.productPortfolio?.keyBrands?.length || d.productPortfolio?.services?.length) ? (
        <div style={card}>
          <SectionTitle icon={<Package size={15} />} title="Product Portfolio" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              { l: "Flagship Products", v: d.productPortfolio?.flagshipProducts, color: C.accent },
              { l: "Brands", v: d.productPortfolio?.keyBrands, color: C.purple },
              { l: "Services", v: d.productPortfolio?.services, color: C.success },
            ].filter(x => x.v && x.v.length > 0).map(x => (
              <div key={x.l}>
                <div style={{ ...tinyLabel, marginBottom: 6, color: x.color }}>{x.l}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {x.v!.map(item => <Chip key={item} color={x.color} fill={C.soft}>{item}</Chip>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Subsidiaries */}
      {(d.subsidiaries?.length ?? 0) > 0 && (
        <div style={card}>
          <SectionTitle icon={<Building2 size={15} />} title="Key Subsidiaries" />
          <div style={{ display: "grid", gap: 8 }}>
            {d.subsidiaries!.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: C.soft, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: C.text }}>{s.name}</div>
                  <div style={{ fontSize: "0.64rem", color: C.muted }}>{s.business}{s.contribution ? ` · ${s.contribution}` : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={tinyLabel}>Owned</div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 900, color: C.accent }}>{s.ownership}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global presence */}
      {(d.globalPresence?.countriesServed?.length || d.globalPresence?.manufacturingLocations?.length) ? (
        <div style={card}>
          <SectionTitle icon={<Globe2 size={15} />} title="Global Presence" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {d.globalPresence!.countriesServed && d.globalPresence!.countriesServed.length > 0 && (
              <div>
                <div style={{ ...tinyLabel, marginBottom: 6 }}>Countries Served ({d.globalPresence!.countriesServed.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {d.globalPresence!.countriesServed!.slice(0, 30).map(c => <Chip key={c} color={C.accent} fill={C.soft}>{c}</Chip>)}
                </div>
              </div>
            )}
            {d.globalPresence!.manufacturingLocations && d.globalPresence!.manufacturingLocations.length > 0 && (
              <div>
                <div style={{ ...tinyLabel, marginBottom: 6 }}><Factory size={10} style={{ display: "inline", marginRight: 4 }} />Manufacturing</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {d.globalPresence!.manufacturingLocations!.slice(0, 20).map(c => <Chip key={c} color={C.success} fill={C.soft}>{c}</Chip>)}
                </div>
              </div>
            )}
          </div>
          {d.globalPresence!.revenueByRegion && d.globalPresence!.revenueByRegion.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <div style={{ ...tinyLabel, marginBottom: 8 }}>Revenue Concentration</div>
              <div style={{ display: "grid", gap: 6 }}>
                {d.globalPresence!.revenueByRegion!.map(r => (
                  <div key={r.region}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", marginBottom: 3 }}>
                      <span style={{ color: C.text, fontWeight: 700 }}>{r.region}</span>
                      <span style={{ color: C.accent, fontWeight: 800 }}>{r.percent}%</span>
                    </div>
                    <Bar value={r.percent} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── TAB: INDUSTRY INTELLIGENCE ─────────────────────────────────
function IndustryTab({ d }: { d: Dossier }) {
  const ind = d.industry || {};
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Overview */}
      <div style={card}>
        <SectionTitle icon={<TrendingUp size={15} />} title={`Industry: ${ind.name || "—"}`} subtitle="Sizing, growth and structural forces" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <div style={{ background: C.soft, padding: 12, borderRadius: 8 }}>
            <div style={tinyLabel}>Industry Size</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: C.accent, marginTop: 3 }}>{ind.sizeINR || "—"}</div>
          </div>
          <div style={{ background: C.soft, padding: 12, borderRadius: 8 }}>
            <div style={tinyLabel}>5Y CAGR</div>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: (ind.cagr5y ?? 0) >= 0 ? C.success : C.danger, marginTop: 3 }}>{ind.cagr5y != null ? `${ind.cagr5y >= 0 ? "+" : ""}${ind.cagr5y}%` : "—"}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          <div>
            <div style={{ ...tinyLabel, color: C.success, marginBottom: 6 }}>Growth Drivers</div>
            {(ind.growthDrivers || []).map((g, i) => (
              <div key={i} style={{ display: "flex", gap: 6, fontSize: "0.7rem", color: C.text, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                <CheckCircle2 size={11} color={C.success} style={{ marginTop: 3, flexShrink: 0 }} />{g}
              </div>
            ))}
          </div>
          <div>
            <div style={{ ...tinyLabel, color: C.danger, marginBottom: 6 }}>Key Risks</div>
            {(ind.keyRisks || []).map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 6, fontSize: "0.7rem", color: C.text, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                <AlertTriangle size={11} color={C.danger} style={{ marginTop: 3, flexShrink: 0 }} />{r}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Value chain */}
      {(ind.valueChain?.length ?? 0) > 0 && (
        <div style={card}>
          <SectionTitle icon={<Layers size={15} />} title="Industry Value Chain" subtitle="Where the company operates" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 0, alignItems: "stretch" }}>
            {ind.valueChain!.map((v, i) => (
              <React.Fragment key={i}>
                <div style={{
                  flex: 1, minWidth: 130, padding: "12px 14px", borderRadius: 8,
                  background: v.companyPresence ? "rgba(74,158,255,0.12)" : C.soft,
                  border: v.companyPresence ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    {v.companyPresence && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />}
                    <div style={{ fontSize: "0.72rem", fontWeight: 800, color: v.companyPresence ? C.accent : C.text }}>{v.stage}</div>
                  </div>
                  {v.description && <div style={{ fontSize: "0.62rem", color: C.muted, lineHeight: 1.4 }}>{v.description}</div>}
                </div>
                {i < ind.valueChain!.length - 1 && <ChevronRight size={14} color={C.muted} style={{ alignSelf: "center", margin: "0 4px" }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Market share */}
      {ind.marketShare && (
        <div style={card}>
          <SectionTitle icon={<Award size={15} />} title="Market Share" subtitle={ind.marketShare.ranking ? `Ranked #${ind.marketShare.ranking}${ind.marketShare.totalPlayers ? ` of ${ind.marketShare.totalPlayers}` : ""}` : undefined} />
          {typeof ind.marketShare.companyShare === "number" && (
            <div style={{ background: C.soft, padding: 14, borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.text }}>This company</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 900, color: C.accent }}>{ind.marketShare.companyShare}%</span>
              </div>
              <Bar value={ind.marketShare.companyShare} color={C.accent} />
            </div>
          )}
          <div style={{ display: "grid", gap: 6 }}>
            {(ind.marketShare.topPlayers || []).map((p, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", marginBottom: 3 }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>{p.name}</span>
                  <span style={{ color: C.muted, fontWeight: 800 }}>{p.share}%</span>
                </div>
                <Bar value={p.share} color={C.purple} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends */}
      {(ind.trends?.length ?? 0) > 0 && (
        <div style={card}>
          <SectionTitle icon={<Sparkles size={15} />} title="Industry Trends" subtitle="AI-extracted from public commentary" />
          <div style={{ display: "grid", gap: 8 }}>
            {ind.trends!.map((t, i) => {
              const col = t.impact === "Positive" ? C.success : t.impact === "Negative" ? C.danger : C.muted;
              return (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.soft, borderRadius: 8, borderLeft: `3px solid ${col}` }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 90 }}>
                    <Chip color={col}>{t.type}</Chip>
                    <Chip color={col}>{t.impact}</Chip>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: C.text, lineHeight: 1.5 }}>{t.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outlook scenarios */}
      {ind.outlook && (
        <div style={card}>
          <SectionTitle icon={<Target size={15} />} title="Future Outlook" subtitle="Bull · Base · Bear" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {[
              { label: "Bull", body: ind.outlook.bull, color: C.success },
              { label: "Base", body: ind.outlook.base, color: C.accent },
              { label: "Bear", body: ind.outlook.bear, color: C.danger },
            ].filter(s => s.body).map(s => (
              <div key={s.label} style={{ background: C.soft, padding: 12, borderRadius: 10, borderTop: `3px solid ${s.color}` }}>
                <div style={{ ...tinyLabel, color: s.color }}>{s.label} Case</div>
                <div style={{ fontSize: "0.7rem", color: C.text, lineHeight: 1.55, marginTop: 6 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB: COMPETITORS ───────────────────────────────────────────
function CompetitorsTab({ d, ticker }: { d: Dossier; ticker: string }) {
  const peers = d.competitors || [];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={card}>
        <SectionTitle icon={<Users2 size={15} />} title="Peer Comparison" subtitle={`${ticker} vs nearest ${peers.length} competitors`} />
        {peers.length === 0 ? (
          <div style={{ textAlign: "center", color: C.muted, padding: 24, fontSize: "0.8rem" }}>No peer data available.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Company", "Revenue (Cr)", "Profit (Cr)", "EBITDA %", "ROE %", "ROCE %", "D/E", "PE", "Strength"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: "0.6rem", color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {peers.map((p, i) => {
                  const isThis = p.ticker?.toUpperCase() === ticker.toUpperCase();
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: isThis ? "rgba(74,158,255,0.05)" : "transparent" }}>
                      <td style={{ padding: "10px", fontWeight: 800, color: isThis ? C.accent : C.text }}>
                        {p.ticker} {isThis && <Chip color={C.accent}>YOU</Chip>}<br/>
                        <span style={{ fontSize: "0.6rem", fontWeight: 600, color: C.muted }}>{p.name}</span>
                      </td>
                      <td style={{ padding: "10px", color: C.text, fontWeight: 700 }}>{p.revenueCr?.toLocaleString("en-IN") || "—"}</td>
                      <td style={{ padding: "10px", color: C.text, fontWeight: 700 }}>{p.profitCr?.toLocaleString("en-IN") || "—"}</td>
                      <td style={{ padding: "10px", color: C.text, fontWeight: 700 }}>{p.ebitdaMargin ?? "—"}</td>
                      <td style={{ padding: "10px", color: C.success, fontWeight: 700 }}>{p.roe ?? "—"}</td>
                      <td style={{ padding: "10px", color: C.success, fontWeight: 700 }}>{p.roce ?? "—"}</td>
                      <td style={{ padding: "10px", color: (p.debtEquity ?? 0) > 1 ? C.danger : C.text, fontWeight: 700 }}>{p.debtEquity ?? "—"}</td>
                      <td style={{ padding: "10px", color: C.text, fontWeight: 700 }}>{p.pe ?? "—"}</td>
                      <td style={{ padding: "10px", minWidth: 100 }}>
                        {typeof p.strengthScore === "number" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 900, color: p.strengthScore >= 70 ? C.success : p.strengthScore >= 50 ? C.warn : C.danger, minWidth: 22 }}>{p.strengthScore}</span>
                            <div style={{ flex: 1 }}><Bar value={p.strengthScore} color={p.strengthScore >= 70 ? C.success : p.strengthScore >= 50 ? C.warn : C.danger} /></div>
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB: OWNERSHIP ─────────────────────────────────────────────
function OwnershipTab({ d }: { d: Dossier }) {
  const o = d.ownership || {};
  const buckets = [
    { label: "Promoter", value: o.promoter ?? 0, color: C.purple, change: o.changeQoQ?.promoter },
    { label: "FII", value: o.fii ?? 0, color: C.accent, change: o.changeQoQ?.fii },
    { label: "DII", value: o.dii ?? 0, color: C.success, change: o.changeQoQ?.dii },
    { label: "Public", value: o.public ?? 0, color: C.warn },
  ];
  const total = Math.max(1, buckets.reduce((a, b) => a + b.value, 0));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Stacked ownership bar */}
      <div style={card}>
        <SectionTitle icon={<Users2 size={15} />} title="Shareholding Pattern" subtitle="Latest reported quarter" />
        <div style={{ display: "flex", height: 22, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
          {buckets.map(b => (
            <div key={b.label} title={`${b.label}: ${b.value}%`} style={{ background: b.color, width: `${(b.value / total) * 100}%`, display: "flex", alignItems: "center", justifyContent: "center", color: "#0F1322", fontSize: "0.6rem", fontWeight: 900 }}>
              {b.value >= 10 ? `${b.value}%` : ""}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginTop: 12 }}>
          {buckets.map(b => (
            <div key={b.label} style={{ background: C.soft, padding: "10px 12px", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
                <div style={{ ...tinyLabel }}>{b.label}</div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
                <div style={{ fontSize: "1rem", fontWeight: 900, color: C.text }}>{b.value}%</div>
                {typeof b.change === "number" && (
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, color: b.change >= 0 ? C.success : C.danger }}>
                    {b.change >= 0 ? "▲" : "▼"} {Math.abs(b.change)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {typeof o.pledge === "number" && o.pledge > 0 && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: 8, fontSize: "0.66rem", color: C.danger, fontWeight: 700 }}>
            ⚠ Promoter pledge: {o.pledge}% — monitor for governance risk.
          </div>
        )}
      </div>

      {/* Smart money */}
      {o.smartMoney && (
        <div style={card}>
          <SectionTitle icon={<Sparkles size={15} />} title="Smart Money Activity" subtitle={`Conviction: ${o.smartMoney.conviction || "—"}`} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {o.smartMoney.fiiActivity && (
              <div style={{ background: C.soft, padding: 12, borderRadius: 8, borderLeft: `3px solid ${C.accent}` }}>
                <div style={{ ...tinyLabel, color: C.accent, marginBottom: 4 }}>FII Activity</div>
                <div style={{ fontSize: "0.72rem", color: C.text, lineHeight: 1.5 }}>{o.smartMoney.fiiActivity}</div>
              </div>
            )}
            {o.smartMoney.mfActivity && (
              <div style={{ background: C.soft, padding: 12, borderRadius: 8, borderLeft: `3px solid ${C.success}` }}>
                <div style={{ ...tinyLabel, color: C.success, marginBottom: 4 }}>Mutual Fund Activity</div>
                <div style={{ fontSize: "0.72rem", color: C.text, lineHeight: 1.5 }}>{o.smartMoney.mfActivity}</div>
              </div>
            )}
          </div>
          {(o.smartMoney.recentMoves?.length ?? 0) > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ ...tinyLabel, marginBottom: 6 }}>Recent Moves</div>
              <div style={{ display: "grid", gap: 4 }}>
                {o.smartMoney.recentMoves!.map((m, i) => (
                  <div key={i} style={{ fontSize: "0.68rem", color: C.text, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>• {m}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TAB: AI ANALYST ────────────────────────────────────────────
function AITab({ d }: { d: Dossier }) {
  const s = d.scores || {};
  const moat = d.moat || {};
  const moatItems = [
    { l: "Brand", v: moat.brand },
    { l: "Cost", v: moat.cost },
    { l: "Network", v: moat.network },
    { l: "Switching", v: moat.switching },
    { l: "Distribution", v: moat.distribution },
    { l: "IP/Patents", v: moat.ip },
  ].filter(x => typeof x.v === "number");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* White Tiger Company Score + 5 sub-scores */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${C.card}, rgba(74,158,255,0.05))` }}>
        <SectionTitle icon={<Brain size={15} />} title="White Tiger Company Score" subtitle="Weighted composite of five quality dimensions" />
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          {typeof s.companyScore === "number" && (
            <div style={{ textAlign: "center" }}>
              <ScoreRing value={s.companyScore} label="Company Score" size={120} />
            </div>
          )}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, minWidth: 280 }}>
            {[
              { l: "Business Quality", v: s.businessQuality },
              { l: "Management", v: s.managementQuality },
              { l: "Competitive Edge", v: s.competitiveAdvantage },
              { l: "Financial Strength", v: s.financialStrength },
              { l: "Growth Potential", v: s.growthPotential },
            ].filter(x => typeof x.v === "number").map(x => (
              <ScoreRing key={x.l} value={x.v!} label={x.l} size={64} />
            ))}
          </div>
        </div>
      </div>

      {/* Moat analysis */}
      {(moatItems.length > 0 || moat.explanation) && (
        <div style={card}>
          <SectionTitle icon={<Shield size={15} />} title="Economic Moat" subtitle="Sources of durable competitive advantage" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
            {moatItems.map(x => (
              <div key={x.l} style={{ background: C.soft, padding: 10, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={tinyLabel}>{x.l}</div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 900, color: (x.v! >= 7 ? C.success : x.v! >= 4 ? C.warn : C.danger) }}>{x.v}/10</div>
                </div>
                <Bar value={x.v! * 10} color={x.v! >= 7 ? C.success : x.v! >= 4 ? C.warn : C.danger} />
              </div>
            ))}
          </div>
          {moat.explanation && (
            <div style={{ background: C.soft, padding: 12, borderRadius: 8, fontSize: "0.74rem", color: C.text, lineHeight: 1.6, borderLeft: `3px solid ${C.accent}` }}>
              {moat.explanation}
            </div>
          )}
        </div>
      )}

      {/* Supply chain */}
      {d.supplyChain && (d.supplyChain.keySuppliers?.length || d.supplyChain.keyCustomers?.length) && (
        <div style={card}>
          <SectionTitle icon={<Factory size={15} />} title="Supply Chain Intelligence" subtitle={d.supplyChain.concentrationRisk ? `Concentration risk: ${d.supplyChain.concentrationRisk}` : undefined} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 10, alignItems: "stretch" }}>
            <div style={{ background: C.soft, padding: 12, borderRadius: 8 }}>
              <div style={{ ...tinyLabel, color: C.accent, marginBottom: 6 }}>Suppliers</div>
              {(d.supplyChain.keySuppliers || []).map(x => <div key={x} style={{ fontSize: "0.66rem", color: C.text, padding: "3px 0" }}>• {x}</div>)}
            </div>
            <ChevronRight size={18} color={C.muted} style={{ alignSelf: "center" }} />
            <div style={{ background: "rgba(74,158,255,0.1)", border: `1.5px solid ${C.accent}`, padding: 12, borderRadius: 8 }}>
              <div style={{ ...tinyLabel, color: C.accent, marginBottom: 6 }}>Company</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: C.text }}>Value capture</div>
              {d.supplyChain.description && <div style={{ fontSize: "0.62rem", color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{d.supplyChain.description}</div>}
            </div>
            <ChevronRight size={18} color={C.muted} style={{ alignSelf: "center" }} />
            <div style={{ background: C.soft, padding: 12, borderRadius: 8 }}>
              <div style={{ ...tinyLabel, color: C.success, marginBottom: 6 }}>Customers</div>
              {(d.supplyChain.keyCustomers || []).map(x => <div key={x} style={{ fontSize: "0.66rem", color: C.text, padding: "3px 0" }}>• {x}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Risks */}
      {(d.risks?.length ?? 0) > 0 && (
        <div style={card}>
          <SectionTitle icon={<AlertTriangle size={15} />} title="Risk Intelligence" subtitle="Top company-specific risks" />
          <div style={{ display: "grid", gap: 8 }}>
            {d.risks!.map((r, i) => {
              const col = r.severity === "High" ? C.danger : r.severity === "Medium" ? C.warn : C.success;
              return (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.soft, borderRadius: 8, borderLeft: `3px solid ${col}` }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 90 }}>
                    <Chip color={col}>{r.type}</Chip>
                    <Chip color={col}>{r.severity}</Chip>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: C.text, lineHeight: 1.5 }}>{r.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Investment thesis */}
      {d.thesis && (
        <div style={card}>
          <SectionTitle icon={<Target size={15} />} title="Investment Thesis" subtitle="A balanced view — for education only, not investment advice" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)", padding: 12, borderRadius: 10 }}>
              <div style={{ ...tinyLabel, color: C.success, marginBottom: 6 }}><CheckCircle2 size={11} style={{ display: "inline", marginRight: 4 }} />Why Buy</div>
              {(d.thesis.whyBuy || []).map((x, i) => <div key={i} style={{ fontSize: "0.7rem", color: C.text, padding: "4px 0" }}>• {x}</div>)}
            </div>
            <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.18)", padding: 12, borderRadius: 10 }}>
              <div style={{ ...tinyLabel, color: C.danger, marginBottom: 6 }}><XCircle size={11} style={{ display: "inline", marginRight: 4 }} />Why Avoid</div>
              {(d.thesis.whyAvoid || []).map((x, i) => <div key={i} style={{ fontSize: "0.7rem", color: C.text, padding: "4px 0" }}>• {x}</div>)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: C.soft, padding: 12, borderRadius: 10, borderLeft: `3px solid ${C.accent}` }}>
              <div style={{ ...tinyLabel, color: C.accent, marginBottom: 6 }}>Key Triggers to Watch</div>
              {(d.thesis.keyTriggers || []).map((x, i) => <div key={i} style={{ fontSize: "0.7rem", color: C.text, padding: "4px 0" }}>• {x}</div>)}
            </div>
            <div style={{ background: C.soft, padding: 12, borderRadius: 10, borderLeft: `3px solid ${C.warn}` }}>
              <div style={{ ...tinyLabel, color: C.warn, marginBottom: 6 }}>Major Risks</div>
              {(d.thesis.majorRisks || []).map((x, i) => <div key={i} style={{ fontSize: "0.7rem", color: C.text, padding: "4px 0" }}>• {x}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT COMPONENT ─────────────────────────────────────────────
export function BusinessIntelligenceSuite({ ticker, companyName }: { ticker: string; companyName?: string }) {
  const [tab, setTab] = useState<SubTab>("business");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<APIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/company-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, companyName, force }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || "Failed");
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [ticker, companyName]);

  const TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { id: "business", label: "Business", icon: <Building2 size={13} /> },
    { id: "industry", label: "Industry", icon: <TrendingUp size={13} /> },
    { id: "competitors", label: "Competitors", icon: <Users2 size={13} /> },
    { id: "ownership", label: "Ownership", icon: <Users2 size={13} /> },
    { id: "ai", label: "AI Analyst", icon: <Brain size={13} /> },
  ], []);

  const d = data?.dossier;
  const ts = data?.generatedAt ? new Date(data.generatedAt) : null;

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: 18, border: `1px solid ${C.border}`, marginBottom: 22, color: C.text }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.01em" }}>Business Intelligence Suite</div>
            <div style={{ fontSize: "0.66rem", color: C.muted, fontWeight: 600 }}>
              {ts ? `Generated ${ts.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })} · AI from public filings` : "Deep company research, on demand"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!data && !loading && (
            <button onClick={() => load()} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, border: "none",
              borderRadius: 10, color: "#fff", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer",
            }}>
              <Sparkles size={13} /> Generate
            </button>
          )}
          {data && (
            <button onClick={() => load(true)} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.muted, fontSize: "0.68rem", fontWeight: 700, cursor: loading ? "wait" : "pointer",
            }}>
              <RefreshCw size={11} className={loading ? "spinning" : ""} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Tab nav */}
      {data && (
        <div style={{ display: "flex", gap: 4, padding: 3, background: C.card, borderRadius: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, minWidth: 90, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "8px 12px", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: "0.7rem", fontWeight: 800, transition: "all 0.15s",
              background: tab === t.id ? `linear-gradient(135deg, ${C.accent}, ${C.purple})` : "transparent",
              color: tab === t.id ? "#fff" : C.muted,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
      )}

      {/* Provenance banner */}
      {data && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 14,
          background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 8,
          fontSize: "0.64rem", color: C.muted, lineHeight: 1.45,
        }}>
          <Info size={12} color={C.purple} style={{ flexShrink: 0 }} />
          <span><strong style={{ color: C.purple }}>AI Insight.</strong> {data.dataNote || "Business Intelligence is AI-generated from public filings — verify specific figures against the company's annual report / NSE filings before deciding."}</span>
        </div>
      )}

      {/* Body */}
      {!data && !loading && !error && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
          <Brain size={36} color={C.accent} style={{ opacity: 0.6, marginBottom: 10 }} />
          <div style={{ fontSize: "0.86rem", fontWeight: 700, color: C.text, marginBottom: 4 }}>Deep company research, generated on demand</div>
          <div style={{ fontSize: "0.7rem", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Click <strong style={{ color: C.text }}>Generate</strong> to build a Bloomberg-style dossier: business segments, revenue breakdown, industry positioning, peer comparison, ownership, moat analysis, supply chain, risks and a balanced investment thesis — all in one click.
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
          <RefreshCw size={22} className="spinning" color={C.accent} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: C.text }}>Generating institutional dossier for {ticker}…</div>
          <div style={{ fontSize: "0.66rem", marginTop: 4 }}>This takes ~10-30 seconds.</div>
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: "center", padding: 24, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: 10 }}>
          <AlertTriangle size={20} color={C.danger} style={{ marginBottom: 8 }} />
          <div style={{ fontSize: "0.78rem", color: C.text, fontWeight: 700 }}>Could not generate intelligence: {error}</div>
          <button onClick={() => load()} style={{ marginTop: 10, padding: "7px 14px", background: C.danger, border: "none", borderRadius: 8, color: "#fff", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>Try Again</button>
        </div>
      )}

      {data && d && (
        <div>
          {tab === "business" && <BusinessTab d={d} ticker={ticker} />}
          {tab === "industry" && <IndustryTab d={d} />}
          {tab === "competitors" && <CompetitorsTab d={d} ticker={ticker} />}
          {tab === "ownership" && <OwnershipTab d={d} />}
          {tab === "ai" && <AITab d={d} />}
        </div>
      )}
    </div>
  );
}

export default BusinessIntelligenceSuite;
