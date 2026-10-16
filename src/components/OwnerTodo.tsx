/* Visible marker for copy the owner still has to decide (pricing, GST,
   refunds). Shown in development only so it can't ship to production;
   search the codebase for "OwnerTodo" to find every open item. */
import type { ReactNode } from "react";

export function OwnerTodo({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 6,
      border: "1px dashed #F59E0B", background: "rgba(245,158,11,0.12)",
      color: "#F59E0B", fontSize: "0.78em", fontWeight: 700,
    }}>
      TODO (owner): {children}
    </span>
  );
}
