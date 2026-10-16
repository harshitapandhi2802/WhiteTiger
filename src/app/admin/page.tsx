import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { dbConfigured, listUsers, type DbUser } from "@/lib/db";
import { mailerConfigured } from "@/lib/mailer";
import { SESSION_COOKIE, isAdmin, verifySession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users · White Tiger admin", robots: { index: false, follow: false } };

const C = { bg: "#0A0E1A", card: "#161B2E", border: "rgba(232,237,245,0.1)", text: "#E8ECF4", muted: "#8C99B0", accent: "#4A9EFF", ok: "#34D399", warn: "#FBBF24", bad: "#F87171" };

function fmt(d: Date | null) {
  return d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "—";
}

function welcomeCell(u: DbUser) {
  if (u.welcome_sent_at) return <span style={{ color: C.ok }}>Sent {fmt(u.welcome_sent_at)}</span>;
  if (u.welcome_error) return <span style={{ color: C.bad }} title={u.welcome_error}>Not sent</span>;
  return <span style={{ color: C.warn }}>Pending</span>;
}

/** Owner-only list of everyone who has signed in. Anyone else gets a 404. */
export default async function AdminPage() {
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || !isAdmin(session.email)) notFound();

  let users: DbUser[] = [];
  let dbError: string | null = null;
  if (dbConfigured()) {
    try {
      users = await listUsers();
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }
  const total = users.length;
  const last7 = countSince(users, 7);
  const optIn = users.filter((u) => u.marketing_consent && !u.unsubscribed_at).length;

  const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 12, color: C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "10px 12px", fontSize: 13, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, Segoe UI, Arial, sans-serif", padding: "32px clamp(16px, 4vw, 48px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>🐯 White Tiger users</h1>
            <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>Signed in as {session.email}. Only you can see this page.</p>
          </div>
          <a href="/api/admin/users" style={{ background: C.accent, color: "#fff", fontWeight: 700, fontSize: 14, padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}>Download CSV</a>
        </div>

        {!dbConfigured() && <Note color={C.warn}>DATABASE_URL is not set, so sign-ins are not being saved. Connect a Neon Postgres database in Vercel → Storage.</Note>}
        {dbError && <Note color={C.bad}>Database error: {dbError}</Note>}
        {!mailerConfigured() && <Note color={C.warn}>GMAIL_USER / GMAIL_APP_PASSWORD are not set, so welcome emails are not being sent.</Note>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {[["Total users", total], ["New in last 7 days", last7], ["Opted in to updates", optIn]].map(([l, v]) => (
            <div key={l as string} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", minWidth: 160 }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{v}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead><tr>
              {["Name", "Email", "First sign-in", "Last sign-in", "Sign-ins", "Welcome email", "Updates opt-in"].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} style={{ ...td, color: C.muted, textAlign: "center", padding: 28 }}>No sign-ins yet.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td style={td}>{u.name || "—"}</td>
                  <td style={td}><a href={`mailto:${u.email}`} style={{ color: C.accent, textDecoration: "none" }}>{u.email}</a></td>
                  <td style={td}>{fmt(u.first_login_at)}</td>
                  <td style={td}>{fmt(u.last_login_at)}</td>
                  <td style={td}>{u.login_count}</td>
                  <td style={td}>{welcomeCell(u)}</td>
                  <td style={td}>{u.unsubscribed_at ? <span style={{ color: C.muted }}>Unsubscribed</span> : u.marketing_consent ? <span style={{ color: C.ok }}>Yes</span> : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function countSince(users: DbUser[], days: number) {
  const cutoff = Date.now() - days * 86_400_000;
  return users.filter((u) => new Date(u.first_login_at).getTime() >= cutoff).length;
}

function Note({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ border: `1px solid ${color}55`, background: `${color}14`, color, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>{children}</div>;
}
