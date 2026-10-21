"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Legend, CartesianGrid } from "recharts";
import type { ChainStrike } from "@/lib/nse-chain";

const compact = (v: number) => (v >= 1e7 ? `${(v / 1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v));

export function OiChart({ rows, spot, maxPain }: { rows: ChainStrike[]; spot: number | null; maxPain: number | null }) {
  const data = rows.map(r => ({ strike: r.strike, call: r.call?.oi ?? 0, put: r.put?.oi ?? 0 }));
  return (
    <div style={{ width: "100%", height: 280 }} role="img" aria-label="Bar chart of call and put open interest by strike">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(232,237,245,0.06)" vertical={false} />
          <XAxis dataKey="strike" tick={{ fill: "#8C99B0", fontSize: 10 }} />
          <YAxis tick={{ fill: "#8C99B0", fontSize: 10 }} tickFormatter={compact} width={48} />
          <Tooltip contentStyle={{ background: "#14213D", border: "1px solid rgba(232,237,245,0.12)", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => (typeof v === "number" ? v.toLocaleString("en-IN") : v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="call" name="Call OI" fill="#F87171" />
          <Bar dataKey="put" name="Put OI" fill="#34D399" />
          {spot !== null && <ReferenceLine x={rows.reduce((b, r) => (Math.abs(r.strike - spot) < Math.abs(b - spot) ? r.strike : b), rows[0]?.strike ?? 0)} stroke="#4A9EFF" strokeDasharray="4 4" label={{ value: "ATM", fill: "#4A9EFF", fontSize: 10, position: "top" }} />}
          {maxPain !== null && <ReferenceLine x={maxPain} stroke="#FBBF24" strokeDasharray="2 4" label={{ value: "Max pain", fill: "#FBBF24", fontSize: 10, position: "insideTopRight" }} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
