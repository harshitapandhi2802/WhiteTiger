import Link from "next/link";

/* Full-page "Coming soon" used by route layouts for pages not launched yet. */
export function ComingSoonPage({ title, blurb }: { title: string; blurb: string }) {
  return (
    <main style={{
      minHeight: "100vh", background: "#0A0E1A", color: "#E8ECF4", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Inter, Segoe UI, Arial, sans-serif",
    }}>
      <div style={{
        maxWidth: 400, textAlign: "center", background: "#161B2E", border: "1px solid rgba(232,237,245,0.1)",
        borderRadius: 18, padding: "30px 26px",
      }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.12em", color: "#4A9EFF", textTransform: "uppercase", marginBottom: 6 }}>
          Coming soon
        </div>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 900, margin: "0 0 8px" }}>{title}</h1>
        <p style={{ fontSize: "0.84rem", color: "#8C99B0", lineHeight: 1.55, margin: "0 0 20px" }}>
          {`${blurb} We're still checking the data for this page, so it isn't open yet.`}
        </p>
        <Link href="/analyze" style={{
          display: "inline-block", padding: "11px 20px", borderRadius: 10, background: "#4A9EFF",
          color: "#fff", fontWeight: 800, fontSize: "0.86rem", textDecoration: "none",
        }}>Back to White Tiger</Link>
      </div>
    </main>
  );
}
