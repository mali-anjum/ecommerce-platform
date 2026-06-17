# Environment variables guide

This project loads env files from **`client/`** and **`server/`** separately. Next.js reads `client/.env*`; Express reads `server/.env*` via `server/src/config/loadEnv.ts` → `envFiles.ts`.

## Which file loads when

| Runtime | `NODE_ENV` | Files tried (first existing wins; later files do **not** override) |
|---------|------------|-------------------------------------------------------------------|
| **Local dev** | `development` (default) | `.env.local` → `.env` |
| **Production** | `production` | `.env.production` → `.env` |
| **Tests** | `test` | `.env.test` → `.env` |

`override: false` in dotenv means the **first** file on disk wins per variable. Put values in the highest-priority file for that mode.

**Never commit real secrets.** Use `*.env.example` as templates. Set production values in **Vercel** (client) and **Render** (or your API host) dashboards.

---

## Architecture: how the pieces connect

```mermaid
flowchart LR
  Browser["Browser"]
  Next["Next.js client :3012"]
  BFF["Route handlers /api/*"]
  Express["Express API :4001"]
  DB["PostgreSQL"]

  Browser -->|"NEXT_PUBLIC_API_URL (optional direct)"| Express
  Browser --> Next
  Next --> BFF
  BFF -->|"BACKEND_URL prod / DEV_URL dev"| Express
  Express --> DB
```

| Layer | What it needs |
|-------|----------------|
| **Browser** | `NEXT_PUBLIC_*` only (bundled into JS) |
| **Next proxy (`proxy.ts`)** | `JWT_SECRET` (same as server) |
| **Next BFF (`/app/api/*`)** | `DEV_URL` / `BACKEND_URL` → Express origin |
| **Express** | `DATABASE_URL`, payments, Cloudinary, `FRONTEND_URL` for CORS |

### Local development (recommended)

1. `docker compose up -d` in `server/` → Postgres on **localhost:5436**
2. `server/.env.local`: `DATABASE_URL` → local Docker URL; **leave `COOKIE_DOMAIN` unset**
3. `client/.env.local`: `DEV_URL=http://localhost:4001`; **do not** point `DEV_URL` at production while using a local DB
4. `JWT_SECRET` **identical** in `client/.env.local` and `server/.env.local`
5. `NEXT_PUBLIC_API_URL=http://localhost:4001` for browser calls that hit Express directly

### Production (Vercel + Render pattern)

| Service | File / dashboard | Key URLs |
|---------|------------------|----------|
| **Next (Vercel)** | Project → Environment Variables | `NEXT_PUBLIC_APP_URL`, `BACKEND_URL`, `JWT_SECRET`, `NEXT_PUBLIC_*` |
| **API (Render)** | Service → Environment | `DATABASE_URL`, `FRONTEND_URL`, `COOKIE_DOMAIN`, payment secrets |

- **`BACKEND_URL`** (client, production): public Express origin, no `/api` suffix (e.g. `https://your-api.onrender.com`)
- **`NEXT_PUBLIC_API_URL`**: same origin for client-side `fetch`/axios to the API
- **`FRONTEND_URL`** (server): Vercel app URL for CORS and payment return URLs
- **`COOKIE_DOMAIN`**: API cookie domain in production (e.g. `.your-api.onrender.com`); **unset in local dev**

---

## Server variables (`server/`)

### Required for core app

| Variable | Where to get it | Notes |
|----------|-----------------|-------|
| `DATABASE_URL` | [Neon](https://neon.tech), [Supabase](https://supabase.com), or Docker: `postgresql://user:password@localhost:5436/nextecommerce?schema=public` | Prisma connection string |
| `PORT` | You choose | Default `4001`; must match client `DEV_URL` port |
| `NODE_ENV` | `development` / `production` | Controls env file selection |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | **Must match `client` `JWT_SECRET`** |
| `FRONTEND_URL` | Your Next origin | e.g. `http://localhost:3012` or Vercel URL; CORS + redirects |

### Media (required for uploads)

| Variable | Where to get it |
|----------|-----------------|
| `CLOUDINARY_CLOUD_NAME` | [Cloudinary Dashboard](https://console.cloudinary.com) → Product environment |
| `CLOUDINARY_API_KEY` | Same |
| `CLOUDINARY_API_SECRET` | Same |

### Payments — Stripe (optional but needed for card checkout)

| Variable | Where to get it |
|----------|-----------------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Dashboard → Webhooks → endpoint `https://<api>/api/order/webhooks/stripe` |
| `STRIPE_CHECKOUT_BASE_URL` | Your Next app URL (checkout return pages) |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | Optional; default under `STRIPE_CHECKOUT_BASE_URL` |

Client needs matching **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** (publishable key, same Stripe account).

### Payments — PayPal (optional)

| Variable | Where to get it |
|----------|-----------------|
| `PAYPAL_MODE` | `sandbox` or `live` |
| `PAYPAL_CLIENT_ID` | [PayPal Developer](https://developer.paypal.com/dashboard/applications) |
| `PAYPAL_CLIENT_SECRET` | Same app |
| `PAYPAL_RETURN_URL` / `PAYPAL_CANCEL_URL` | `{NEXT_APP}/paypal/return` and `/paypal/cancel` |
| `PAYPAL_WEBHOOK_ID` | PayPal webhooks (production reliability) |
| `PAYPAL_LOCALE` | BCP-47, e.g. `en-US` |

Client: **`NEXT_PUBLIC_PAYPAL_CLIENT_ID`** = same client id as server.

### Email (optional)

| Variable | Where to get it |
|----------|-----------------|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Gmail App Password, SendGrid, Resend SMTP, etc. |
| `EMAIL_FROM` | Verified sender address |

### OAuth (optional)

Configure per provider in Google Cloud / Meta / GitHub / Microsoft / Apple. Set `*_CLIENT_ID`, `*_CLIENT_SECRET`, and `*_REDIRECT_URI` (or rely on defaults from `BACKEND_PUBLIC_URL` + `/api/auth/oauth/.../callback`).

Also set matching vars on **client** if using OAuth UI flows (`GOOGLE_CLIENT_ID`, etc.).

### AI shopping assistant (optional)

Active vendor: `client/feature-flags.config.json` → `ai.llmProvider` (`openai` | `gemini` | `llama`). Run `cd server && npm run sync:feature-flags` after edits. See [docs/ai/LLM-PROVIDERS.md](./ai/LLM-PROVIDERS.md).

| Variable | Provider | Where to get it |
|----------|----------|-----------------|
| `OPENAI_API_KEY` | openai | [OpenAI API keys](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | openai | Optional; default `gpt-4o-mini` |
| `GEMINI_API_KEY` | gemini | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | gemini | Optional; default `gemini-2.0-flash` |
| `LLAMA_BASE_URL` | llama | Ollama OpenAI-compatible API (default `http://127.0.0.1:11434/v1`) |
| `LLAMA_MODEL` | llama | Optional; default `llama3.2` |
| `LLAMA_API_KEY` | llama | Optional for local Ollama |

### Sentry (optional, staging/production)

| Variable | Where to get it |
|----------|-----------------|
| `SENTRY_DSN` | [Sentry](https://sentry.io) → Project → Client Keys (DSN) — **separate project for API recommended** |
| `SENTRY_ENVIRONMENT` | e.g. `production`, `staging` |
| `SENTRY_ENABLED` | `true` to force on in dev |
| `SENTRY_RELEASE` | Git SHA or deploy id |
| `SENTRY_TRACES_SAMPLE_RATE` | `0`–`1`, default `0.1` |

### Production-only cookies

| Variable | Where to get it |
|----------|-----------------|
| `COOKIE_DOMAIN` | Leading dot + API host, e.g. `.your-api.onrender.com` when API sets cookies on that domain |

**Leave unset in local dev** so cookies work on `localhost:3012` via the Next proxy.

### Legacy / unused in code paths today

`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY`, etc. appear in `.env.example` for compatibility; **runtime auth uses `JWT_SECRET`** in `tokenService` and middleware. You can keep them aligned with `JWT_SECRET` or omit after cleanup.

### Other server vars

| Variable | Purpose |
|----------|---------|
| `BACKEND_PUBLIC_URL` | Public API URL for OAuth callback defaults |
| `APP_NAME` | PayPal brand name |
| `LOG_ENABLED` / `LOG_LEVEL` | Pino logging |
| `DATABASE_POOL_MAX` / `DATABASE_CONNECTION_TIMEOUT_MS` | Prisma pool tuning |
| `FEATURE_FLAGS_CONFIG_PATH` | Override path to feature flags JSON |
| `CARD_PAYMENT_*` | Example card gateway stub |

---

## Client variables (`client/`)

### Public (browser)

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_API_URL` | Express origin, no trailing slash, no `/api` |
| `NEXT_PUBLIC_APP_URL` | Next site origin (Stripe/PayPal return alignment) |
| `NEXT_PUBLIC_APP_NAME` | Display name |
| `NEXT_PUBLIC_APP_ENV` | `development` / `production` (logging, Sentry gating) |
| `NEXT_PUBLIC_LOG_LEVEL` | `debug` / `info` / `error` |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal app (sandbox/live) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry browser/Next project DSN |

### Server-only in Next (not exposed to browser)

| Variable | Where to get it |
|----------|-----------------|
| `JWT_SECRET` | **Same as server** — `proxy.ts` verifies cookies |
| `DEV_URL` | Local Express `http://localhost:4001` (dev BFF proxy) |
| `DEVE_URL` | Legacy alias for `DEV_URL` |
| `BACKEND_URL` | Production Express URL (required when `NODE_ENV=production`) |
| `ARCJET_KEY` | [Arcjet](https://arcjet.com) dashboard (rate limiting) |
| `SENTRY_DSN` / `SENTRY_*` | Server-side Next Sentry; build: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |

### OAuth on client (optional)

Mirror provider client ids/secrets used in Next route handlers for OAuth bridge (see `client/.env.example`).

---

## Deployment checklist

### Vercel (client)

Set **Production** (and Preview if needed):

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_ENV=production`
- `BACKEND_URL` = Render API URL
- `JWT_SECRET` = same as API
- Payment public keys, Sentry `NEXT_PUBLIC_*`, `ARCJET_KEY`

### Render (server)

- `NODE_ENV=production`
- `DATABASE_URL` from Neon
- `FRONTEND_URL` = Vercel URL
- `COOKIE_DOMAIN` = API cookie domain
- All payment, Cloudinary, SMTP, `JWT_SECRET`, Sentry `SENTRY_DSN`

### Webhooks (must use public API URL)

- Stripe: `https://<api-host>/api/order/webhooks/stripe`
- PayPal: configure in PayPal developer dashboard

---

## Quick copy commands

```bash
# Server local template
cp server/.env.example server/.env.local

# Client local template
cp client/.env.example client/.env.local

# Edit secrets, then start
cd server && docker compose up -d && npm run dev
cd client && npm run dev
```

See also: root `README.md` → [Environment variables](../README.md#environment-variables).
