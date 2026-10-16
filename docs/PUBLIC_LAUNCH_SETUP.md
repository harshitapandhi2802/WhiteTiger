# White Tiger: public launch setup

This branch (`public-launch`) opens White Tiger to everyone:

- **Homepage** (`/`): public, no login needed.
- **App** (`/analyze`): sign in with Google. Google confirms the email is real, so no fake addresses get saved.
- **Every sign-in is saved** in a Postgres database: name, email, first and last sign-in, number of sign-ins, opt-in, and welcome-email status.
- **Every new user gets one welcome email** from your Gmail. It thanks them, explains the free plan, has an "Upgrade for more AI analyses" box and an unsubscribe link. If sending fails (for example Gmail isn't set up yet), it retries on that person's next sign-in.
- **`/admin`**: a private list of all users with a "Download CSV" button. Only `ADMIN_EMAILS` (default: harshitapandhi2802@gmail.com) can open it; everyone else gets a 404.
- **Privacy Policy** updated with what is collected, why, where it's stored, and how to ask for deletion (DPDP Act 2023).
- **Undo switch:** set `NEXT_PUBLIC_PRIVATE_BETA=true` in Vercel and redeploy to bring back the old invite-only wall.

You need to do three setup steps yourself, because each one needs your own account. About 20 minutes in total.

---

## 1. Google sign-in: create a Client ID (~10 min)

1. Go to https://console.cloud.google.com/ and create or select a project, e.g. "White Tiger".
2. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: White Tiger. Support email: yours.
   - Authorised domain: `vercel.app` (or your own domain later).
   - Scopes: the default `email`, `profile`, `openid` are enough.
   - **Publish the app** (switch from "Testing" to "In production"). In Testing mode, only test users you list can sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorised JavaScript origins: `https://whitetiger-research.vercel.app` (and `http://localhost:3000` for local testing).
   - No redirect URI is needed: the app uses Google's one-tap button.
4. Copy the **Client ID**, which ends in `.apps.googleusercontent.com`. It is not secret.

## 2. Database: connect Neon Postgres from Vercel (~3 min)

1. Vercel dashboard → your project (currently named **moonlight-ideas**) → **Storage** → **Create Database** → **Neon (Postgres)** → free plan, region **Mumbai (ap-south-1)** if offered.
2. Connect it to the project for Production, Preview and Development.
3. Vercel adds `DATABASE_URL` automatically. The `wt_users` table is created on the first sign-in, so no migration is needed.

## 3. Welcome email: Gmail App Password (~5 min)

1. Google Account → **Security** → turn on **2-Step Verification** if it's off.
2. Google Account → **Security → App passwords** (or https://myaccount.google.com/apppasswords) → create one named "White Tiger".
3. Copy the 16-character password. **Treat it like a password: paste it only into Vercel, never into chat or code.**

Gmail allows about **500 emails a day**. When you get close to that, switch to Resend with your own domain.

## 4. Add environment variables in Vercel

Project → **Settings → Environment Variables** (Production):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the Client ID from step 1 |
| `DATABASE_URL` | added automatically by step 2 |
| `GMAIL_USER` | `harshitapandhi2802@gmail.com` |
| `GMAIL_APP_PASSWORD` | the app password from step 3 |
| `SESSION_SECRET` | a long random string. Generate one with `openssl rand -base64 32` |
| `ADMIN_EMAILS` | `harshitapandhi2802@gmail.com` (comma-separate to add more) |
| `APP_URL` | `https://whitetiger-research.vercel.app` (used for links in emails) |

Leave `NEXT_PUBLIC_PRIVATE_BETA` **unset**; that is what makes the app public.

## 5. Deploy and test

1. Merge `public-launch` into the branch you deploy (see the note below), then redeploy.
2. Open the site in a private window → `/analyze` → **Continue with Google**.
3. Check that the welcome email arrives in that Google account's inbox (and spam).
4. Open `/analyze` signed in as **harshitapandhi2802@gmail.com**, then go to `/admin`. You should see the user list. The yellow warnings at the top tell you if any setting is missing.

**Merge note:** your main folder `~/Desktop/WhiteTiger` has a lot of uncommitted work, and it is probably what's live. This branch was cut from the last commit (`a84f3b8`). Commit that work first, then merge `public-launch` into it. The files overlap only in `package.json` (new packages vs new scripts), which is an easy merge.

---

## Local testing (optional)

```bash
npm run db:local        # in-memory Postgres on port 5544 (data is lost when stopped)
```
```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5544/postgres SESSION_SECRET=dev npm run dev
```

Without a Google Client ID, the sign-in box shows a **"Continue with email (dev only)"** option. It only exists in development and is switched off in production.

Without the Gmail settings, the welcome email is printed in the terminal instead of being sent.

## AI usage limits (enforced on the server)

- **Every AI route needs a signed-in user.** Without the `wt_session` cookie the API answers 401 "Please sign in".
- **Analyses are counted per user per calendar month (India time)** in the `wt_usage` table, created automatically on first use. Free 5, Starter 20, Pro 100, Elite 300. Over the limit, the API answers 402 and the app opens the upgrade window. A failed analysis is not counted.
- **AI detail pages** (bond, FX, mutual fund and company intelligence) call the AI on page load, so they have a separate daily fair-use cap instead: Free 30, Starter 60, Pro 150, Elite 300 a day.
- **Paid plans** are read from a signed `wt_ent` cookie set at payment. The first account that uses a payment owns it (`wt_entitlements` table), so one purchase can't be shared.
- If `DATABASE_URL` or `SESSION_SECRET` is missing, AI analysis is switched off (fails closed) instead of running unmetered.
- The per-IP rate limits (5 a minute per route) still apply on top.
