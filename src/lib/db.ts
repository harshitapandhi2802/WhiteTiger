/* ═══════════════════════════════════════════════════════════════
   WHITE TIGER — USER DATABASE (Postgres, server-only)

   Stores everyone who signs in. Uses DATABASE_URL (set automatically
   when a Neon Postgres database is connected from the Vercel
   dashboard; POSTGRES_URL is accepted too). The table is created on
   first use, so no migration step is needed.
   ═══════════════════════════════════════════════════════════════ */

import postgres from "postgres";

export interface DbUser {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  provider: string;
  first_login_at: Date;
  last_login_at: Date;
  login_count: number;
  marketing_consent: boolean;
  welcome_sent_at: Date | null;
  welcome_error: string | null;
  unsubscribed_at: Date | null;
}

let client: postgres.Sql | null = null;
let schemaReady: Promise<void> | null = null;

export function dbConfigured(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function sql(): postgres.Sql {
  if (!client) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    // prepare:false keeps it compatible with Neon's pooled (pgbouncer) URL.
    client = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 10, prepare: false });
  }
  return client;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = sql()`
      CREATE TABLE IF NOT EXISTS wt_users (
        id                BIGSERIAL PRIMARY KEY,
        email             TEXT NOT NULL UNIQUE,
        name              TEXT,
        picture           TEXT,
        google_sub        TEXT,
        provider          TEXT NOT NULL DEFAULT 'google',
        first_login_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_login_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        login_count       INTEGER NOT NULL DEFAULT 1,
        marketing_consent BOOLEAN NOT NULL DEFAULT false,
        welcome_sent_at   TIMESTAMPTZ,
        welcome_error     TEXT,
        unsubscribed_at   TIMESTAMPTZ
      )`.then(() => undefined).catch((e) => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

export interface LoginInput {
  email: string;
  name?: string | null;
  picture?: string | null;
  googleSub?: string | null;
  provider: "google" | "email";
  marketingConsent?: boolean;
}

/** Insert a new user or record another login. `isNew` is true on first sign-in. */
export async function recordLogin(input: LoginInput): Promise<{ user: DbUser; isNew: boolean }> {
  await ensureSchema();
  const email = input.email.trim().toLowerCase();
  const rows = await sql()<(DbUser & { inserted: boolean })[]>`
    INSERT INTO wt_users (email, name, picture, google_sub, provider, marketing_consent)
    VALUES (${email}, ${input.name ?? null}, ${input.picture ?? null}, ${input.googleSub ?? null},
            ${input.provider}, ${!!input.marketingConsent})
    ON CONFLICT (email) DO UPDATE SET
      name              = COALESCE(EXCLUDED.name, wt_users.name),
      picture           = COALESCE(EXCLUDED.picture, wt_users.picture),
      google_sub        = COALESCE(EXCLUDED.google_sub, wt_users.google_sub),
      last_login_at     = now(),
      login_count       = wt_users.login_count + 1,
      marketing_consent = wt_users.marketing_consent OR EXCLUDED.marketing_consent
    RETURNING *, (xmax = 0) AS inserted`;
  const { inserted, ...user } = rows[0];
  return { user: user as DbUser, isNew: inserted };
}

export async function markWelcome(email: string, error: string | null): Promise<void> {
  await ensureSchema();
  if (error) {
    await sql()`UPDATE wt_users SET welcome_error = ${error.slice(0, 500)} WHERE email = ${email.toLowerCase()}`;
  } else {
    await sql()`UPDATE wt_users SET welcome_sent_at = now(), welcome_error = NULL WHERE email = ${email.toLowerCase()}`;
  }
}

export async function unsubscribe(email: string): Promise<boolean> {
  await ensureSchema();
  const r = await sql()`
    UPDATE wt_users SET unsubscribed_at = COALESCE(unsubscribed_at, now()), marketing_consent = false
    WHERE email = ${email.toLowerCase()}`;
  return r.count > 0;
}

export async function listUsers(): Promise<DbUser[]> {
  await ensureSchema();
  return sql()<DbUser[]>`
    SELECT id, email, name, picture, provider, first_login_at, last_login_at, login_count,
           marketing_consent, welcome_sent_at, welcome_error, unsubscribed_at
    FROM wt_users ORDER BY first_login_at DESC`;
}
