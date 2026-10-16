/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — WELCOME EMAIL (server-only)

   Sent once to every new user after their first sign-in, from the
   owner's Gmail via SMTP + a Gmail App Password:
     GMAIL_USER          e.g. harshitapandhi2802@gmail.com
     GMAIL_APP_PASSWORD  16-char app password (Google Account →
                         Security → 2-Step Verification → App passwords)
   Without those env vars nothing is sent; in development the email is
   rendered and logged to the server console instead.
   ═══════════════════════════════════════════════════════════════ */

import nodemailer, { type Transporter } from "nodemailer";
import { unsubscribeToken } from "@/lib/session";

export const APP_URL = (process.env.APP_URL || "https://whitetiger-research.vercel.app").replace(/\/$/, "");

export function mailerConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let transport: Transporter | null = null;
function getTransport(): Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return transport;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function unsubscribeUrl(email: string): string {
  return `${APP_URL}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}

export function welcomeEmail(user: { email: string; name?: string | null }) {
  const first = (user.name || "").trim().split(/\s+/)[0] || "there";
  const appLink = `${APP_URL}/analyze`;
  const plansLink = `${APP_URL}/#pricing`;
  const unsub = unsubscribeUrl(user.email);
  const subject = `Thanks for trying White Tiger, ${first}!`;

  const text = [
    `Hi ${first},`,
    ``,
    `Thanks for signing in to White Tiger, my AI research app for Indian and global markets.`,
    ``,
    `On the free plan you can:`,
    `- Explore 9 market sections: stocks, mutual funds, forex, bonds, commodities, derivatives, real estate, global markets and crypto`,
    `- Run 5 AI analyses every month`,
    `- See where the data comes from: sources are named on screen`,
    ``,
    `Want more? Upgrade for more AI analyses each month and extra tools. Paid plans start at Rs 199 for 30 days' access (one-time payment, no auto-renewal).`,
    `See plans: ${plansLink}`,
    ``,
    `Open White Tiger: ${appLink}`,
    ``,
    `Questions or feedback? Just reply to this email. It comes straight to me.`,
    ``,
    `Harshita`,
    `Founder, White Tiger`,
    ``,
    `---`,
    `White Tiger provides educational research only and is not investment advice. White Tiger is not registered with SEBI. AI output can be wrong; please verify before making any decision.`,
    `You're receiving this because you signed in at ${APP_URL}. Unsubscribe: ${unsub}`,
  ].join("\n");

  const btn = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" style="display:inline-block;padding:12px 22px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;${
      primary ? "background:#1A7FD6;color:#ffffff;" : "background:#EEF3FF;color:#1A7FD6;"
    }">${label}</a>`;

  const html = `<!doctype html><html><body style="margin:0;background:#F4F6FB;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0C1122;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FB;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#0A0E1A;padding:22px 28px;">
  <img src="${APP_URL}/icon-96.png" width="40" height="40" alt="" style="vertical-align:middle;border-radius:10px;">
  <span style="color:#ffffff;font-size:20px;font-weight:800;vertical-align:middle;margin-left:10px;">White Tiger</span>
</td></tr>
<tr><td style="padding:28px;">
  <h1 style="margin:0 0 12px;font-size:22px;">Hi ${esc(first)}, thanks for trying White Tiger!</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3A4560;">You're in. White Tiger puts your markets in one AI research app, built for Indian investors.</p>
  <p style="margin:0 0 8px;font-size:15px;font-weight:700;">On the free plan you can:</p>
  <ul style="margin:0 0 18px;padding-left:20px;font-size:15px;line-height:1.7;color:#3A4560;">
    <li>Explore <b>9 market sections</b>: stocks, mutual funds, forex, bonds, commodities, derivatives, real estate, global markets and crypto</li>
    <li>Run <b>5 AI analyses</b> every month</li>
    <li>See where the data comes from: sources are named on screen</li>
  </ul>
  <p style="margin:0 0 22px;">${btn(appLink, "Open White Tiger", true)}</p>
  <div style="background:#F4F0FF;border-radius:12px;padding:16px 18px;margin:0 0 22px;">
    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#5B35D5;">Want more?</p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3A4560;">Upgrade for more AI analyses each month and extra tools. Paid plans start at <b>₹199 for 30 days' access</b> (one-time payment, no auto-renewal).</p>
    ${btn(plansLink, "See plans", false)}
  </div>
  <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#3A4560;">Questions or feedback? Just reply to this email. It comes straight to me.</p>
  <p style="margin:16px 0 0;font-size:15px;">Harshita<br><span style="color:#6B7690;">Founder, White Tiger</span></p>
</td></tr>
<tr><td style="padding:18px 28px;background:#F8F9FC;font-size:12px;line-height:1.6;color:#6B7690;">
  White Tiger provides educational research only and is not investment advice. White Tiger is not registered with SEBI. AI output can be wrong; please verify before making any decision.<br><br>
  You're receiving this because you signed in at ${esc(APP_URL.replace(/^https?:\/\//, ""))}. <a href="${unsub}" style="color:#6B7690;">Unsubscribe</a>
</td></tr>
</table></td></tr></table></body></html>`;

  return { subject, text, html, unsub };
}

/** Send the welcome email. Never throws; returns what happened. */
export async function sendWelcomeEmail(user: { email: string; name?: string | null }): Promise<{ sent: boolean; error?: string }> {
  const msg = welcomeEmail(user);
  if (!mailerConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[welcome-email] (not sent, GMAIL_* not set) to=${user.email} subject="${msg.subject}"\n${msg.text}`);
    }
    return { sent: false, error: "mailer-not-configured" };
  }
  try {
    const from = process.env.GMAIL_USER!;
    await getTransport().sendMail({
      from: { name: "Harshita from White Tiger", address: from },
      replyTo: from,
      to: user.email,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      headers: {
        "List-Unsubscribe": `<${msg.unsub}>, <mailto:${from}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return { sent: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[welcome-email] send failed:", error);
    return { sent: false, error };
  }
}
