"use client";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";

export interface PayoffPoint { spot: number; expiry: number; today: number | null }

const compact = (v: number) => {
  const a = Math.abs(v);
  const s = a >= 1e7 ? `${(a / 1e7).toFixed(1)}Cr` : a >= 1e5 ? `${(a / 1e5).toFixed(1)}L` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}K` : a.toFixed(0);
  return `${v < 0 ? "−" : ""}₹${s}`;
};

export function PayoffChart({ data, spot, breakevens, todayLabel }: {
  data: PayoffPoint[]; spot: number; breakevens: number[]; todayLabel: string;
}) {
  return (
    <div style={{ width: "100%", height: 320 }} role="img" aria-label="Payoff chart: profit or loss against the underlying price">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="rgba(232,237,245,0.06)" />
          <XAxis dataKey="spot" type="number" domain={["dataMin", "dataMax"]} tick={{ fill: "#8C99B0", fontSize: 11 }}
            tickFormatter={(v: number) => Math.round(v).toLocaleString("en-IN")} />
          <YAxis tick={{ fill: "#8C99B0", fontSize: 11 }} tickFormatter={compact} width={64} />
          <Tooltip
            contentStyle={{ background: "#14213D", border: "1px solid rgba(232,237,245,0.12)", borderRadius: 8, fontSize: 12 }}
            labelFormatter={(v) => `Underlying ₹${Number(v).toLocaleString("en-IN")}`}
            formatter={(v, name) => [typeof v === "number" ? compact(v) : "—", name === "expiry" ? "At expiry" : todayLabel]}
          />
          <ReferenceLine y={0} stroke="rgba(232,237,245,0.35)" />
          <ReferenceLine x={spot} stroke="#4A9EFF" strokeDasharray="4 4" label={{ value: "Spot", fill: "#4A9EFF", fontSize: 11, position: "top" }} />
          {breakevens.map(b => <ReferenceLine key={b} x={b} stroke="#FBBF24" strokeDasharray="2 4" />)}
          <Line type="linear" dataKey="expiry" stroke="#34D399" strokeWidth={2.2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="today" stroke="#A78BFA" strokeWidth={1.6} strokeDasharray="5 4" dot={false} isAnimationActive={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
