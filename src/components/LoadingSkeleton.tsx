"use client";

/* ═══════════════════════════════════════════════════════════════
   LOADING SKELETONS — Shimmer effects while data loads
   Used as fallback for dynamic imports and data fetching
   ═══════════════════════════════════════════════════════════════ */

function ShimmerBox({ width = "100%", height = 16, borderRadius = 6, style = {} }: {
  width?: string | number; height?: number; borderRadius?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width, height, borderRadius,
      background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)",
      backgroundSize: "200% 100%",
      animation: "wtShimmer 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

export function TabLoadingSkeleton({ label = "Loading..." }: { label?: string }) {
  return (
    <div style={{ padding: "20px 0" }}>
      {/* Header shimmer */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <ShimmerBox width={40} height={40} borderRadius={10} />
        <div style={{ flex: 1 }}>
          <ShimmerBox width="40%" height={20} style={{ marginBottom: 8 }} />
          <ShimmerBox width="60%" height={14} />
        </div>
      </div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ padding: 16, borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <ShimmerBox width="50%" height={12} style={{ marginBottom: 10 }} />
            <ShimmerBox width="70%" height={22} style={{ marginBottom: 6 }} />
            <ShimmerBox width="40%" height={12} />
          </div>
        ))}
      </div>
      {/* Card grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ padding: 18, borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <ShimmerBox width="60%" height={18} />
              <ShimmerBox width={48} height={32} borderRadius={8} />
            </div>
            <ShimmerBox width="100%" height={12} style={{ marginBottom: 8 }} />
            <ShimmerBox width="80%" height={12} style={{ marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <ShimmerBox width={60} height={20} borderRadius={10} />
              <ShimmerBox width={60} height={20} borderRadius={10} />
              <ShimmerBox width={60} height={20} borderRadius={10} />
            </div>
          </div>
        ))}
      </div>
      {/* Label */}
      <div style={{ textAlign: "center", marginTop: 24, fontSize: "0.75rem", color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}

export function ChartLoadingSkeleton() {
  return (
    <div style={{ padding: 20, borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
      <ShimmerBox width="30%" height={16} style={{ marginBottom: 16 }} />
      <ShimmerBox width="100%" height={200} borderRadius={10} />
    </div>
  );
}

export function SearchLoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, background: "var(--bg-card)" }}>
          <ShimmerBox width={36} height={36} borderRadius={8} />
          <div style={{ flex: 1 }}>
            <ShimmerBox width="50%" height={14} style={{ marginBottom: 6 }} />
            <ShimmerBox width="30%" height={12} />
          </div>
          <ShimmerBox width={60} height={20} borderRadius={6} />
        </div>
      ))}
    </div>
  );
}
