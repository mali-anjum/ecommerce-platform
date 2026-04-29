# Ecommerce Platform

Full-stack ecommerce: **Next.js** storefront + **Express** API with **Prisma** and **PostgreSQL**.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Radix UI, Zustand  
- **Backend:** Express, TypeScript, Prisma, PostgreSQL  
- **Integrations:** Stripe, PayPal, Cloudinary, Nodemailer  
- **Auth / validation:** zod, jose, jsonwebtoken, cookie-based JWT flow  

## Project structure

```text
ecommerce-platform/
├── client/                 # Next.js app (storefront, seller hub, super-admin)
│   ├── src/app/            # App Router pages
│   ├── src/proxy.ts        # Auth redirects (Next.js "proxy" / edge guard)
│   └── .env.local          # Client secrets & API URL (not committed)
├── server/                 # Express API
│   ├── src/server.ts       # App entry: routes under /api/*
│   ├── src/prisma/
│   │   ├── schema.prisma   # Database models (source of truth for tables)
│   │   ├── migrations/     # SQL migrations (commit these with schema changes)
│   │   └── seed.ts         # Optional demo data
│   └── .env.local          # DATABASE_URL, JWT_SECRET, etc.
├── CLAUDE.md               # Contributor rules (tests, env, conventions)
└── README.md               # This file
```

**Quick mental model:** The browser talks to **Next.js**, which calls the **Express** API (`NEXT_PUBLIC_API_URL`, usually `http://localhost:4001`). Prisma runs **only on the server**; never expose `DATABASE_URL` to the client.

---

## Prerequisites

- **Node.js** 20+  
- **npm** 10+  
- **PostgreSQL** reachable via a connection string (`DATABASE_URL`)

---

## Complete local setup (from zero → running)

Do these steps once per machine. Order matters where noted.

### 1. Clone and install

```bash
git clone <your-repo-url> ecommerce-platform
cd ecommerce-platform

cd server && npm install
cd ../client && npm install
```

### 2. PostgreSQL

Create an empty database (any name). Example:

```bash
createdb nextecommerce
# or use Docker / cloud host — you only need the connection URL
```

### 3. Environment files

```bash
cp server/.env.example server/.env.local
cp client/.env.example client/.env.local
```

Edit **`server/.env.local`**:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public` |
| `JWT_SECRET` | Strong random string; **must match** `JWT_SECRET` in **`client/.env.local`** for middleware / proxy |
| `PORT` | Default `4001` (must match URLs below if you change it) |

Edit **`client/.env.local`**:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend origin **without** `/api`, e.g. `http://localhost:4001` |
| `DEV_URL` | Same API origin for server-side proxies (`http://localhost:4001`) |
| `JWT_SECRET` | **Same value as server** — required for Next.js auth checks |

Never commit real `.env.local` files or production secrets.

### 4. Database schema + Prisma client + optional seed

From **`server/`**:

```bash
cd server

npm run prisma:migrate:deploy   # applies every migration in src/prisma/migrations/
npm run prisma:generate        # generates @prisma/client

npm run prisma:seed            # optional: demo admin, catalog sample data, demo seller
```

- First run on an **empty** DB: `migrate:deploy` creates all tables from migration history.  
- **`prisma:seed`** is optional and safe to skip in production if you do not want demo rows.

### 5. Run both apps

Use **two terminals**:

```bash
# Terminal A — API (default http://localhost:4001)
cd server && npm run dev

# Terminal B — Next.js (default http://localhost:3012)
cd client && npm run dev
```

Open **`http://localhost:3012`**. The API health check is **`GET http://localhost:4001/`** (root route).

### 6. Verify quickly

- Client loads without console errors pointing at wrong API host.  
- Login / register flows hit your local API (Network tab → requests to `:4001`).  
- If auth redirects behave oddly, confirm **`JWT_SECRET`** matches on client and server.

---

## Understanding where things live

| Concern | Location |
|---------|----------|
| HTTP API routes | `server/src/routes/*.ts`, mounted in `server/src/server.ts` |
| Env loading (server) | `server/src/config/loadEnv.ts` |
| Prisma client singleton | `server/src/lib/prisma.ts` |
| Product / catalog logic | `server/src/controllers/`, `server/src/services/catalogService.ts` |
| Next auth redirects | `client/src/proxy.ts` |
| API base URL in browser | `client` env `NEXT_PUBLIC_API_URL` + `client/src/utils/routes/api.ts` |

For day-to-day coding rules (tests, lint, Prisma), see **`CLAUDE.md`**.

---

## Database (Prisma) — workflows that keep your data safe

**Schema file:** `server/src/prisma/schema.prisma`  
**Migrations:** `server/src/prisma/migrations/` (version-controlled SQL)

### Golden rules

1. **Prefer migrations, not ad-hoc SQL**, so every environment can replay the same steps.  
2. **`npm run prisma:migrate:dev`** creates a **new** migration from schema changes and applies it — **existing rows stay** when you add nullable columns, defaults, or new tables (normal additive changes).  
3. **`npm run prisma:migrate:reset`** **deletes all data** and reapplies migrations — use **only** on disposable local databases.  
4. **`npm run prisma:migrate:deploy`** applies **pending** migrations **without** creating new ones — use after **git pull** or on production.

### You changed tables / columns (`schema.prisma`)

```bash
cd server

# Creates migration + applies + regenerates client (keeps data for typical additive changes)
npm run prisma:migrate:dev -- --name short_description_of_change

# Commit BOTH:
#   - server/src/prisma/schema.prisma
#   - the new folder under server/src/prisma/migrations/
```

If Prisma reports destructive changes (e.g. dropping a column), review the generated SQL under `migrations/` before committing.

### You only pulled code from git (someone else changed the schema)

```bash
cd server
npm run prisma:migrate:deploy   # applies any new migration folders you did not have
npm run prisma:generate
```

Your **existing data remains**; new migrations run as **ALTER** statements, not a full wipe.

### You only need to refresh the TypeScript client (no schema change)

```bash
cd server && npm run prisma:generate
```

### Production / CI

```bash
cd server
npm run prisma:migrate:deploy
npm run prisma:generate
```

The **`render-build`** script in `server/package.json` already runs generate, build, and migrate deploy in a sensible order for deploys.

### NPM scripts reference (`server/package.json`)

| Script | When to use |
|--------|-------------|
| `npm run prisma:generate` | After schema or migration changes; part of `npm run build` |
| `npm run prisma:migrate:dev` | You edited `schema.prisma` — creates + applies migration locally |
| `npm run prisma:migrate:deploy` | Apply committed migrations (teammate’s branch, staging, prod) |
| `npm run prisma:migrate:reset` | **Dev only** — full reset + optional seed |
| `npm run prisma:seed` | Insert demo data (idempotent checks where implemented) |

---

## Team workflow: merging schema changes without losing data

1. **Before switching branches / pulling:** commit or stash your work.  
2. **`git pull`** — you receive new files under `server/src/prisma/migrations/` if teammates added migrations.  
3. Run **`npm run prisma:migrate:deploy`** in `server/` — your DB catches up **without** wiping existing rows (unless a migration explicitly drops data).  
4. Run **`npm run prisma:generate`** if the pull changed Prisma types.  
5. If **two people created different migrations** for the same period, resolve **git conflicts** in `schema.prisma` and migration folders first, then run **`migrate dev`** once locally to produce a single consistent history if needed (coordinate with your team).

Avoid **`prisma db push`** for shared/production workflows if this repo standardizes on **migrate** — push can drift from `migrations/` and confuse deploys.

---

## Scripts (short reference)

### Client (`client/package.json`)

- `npm run dev` — Next.js dev server (port **3012** in this project)  
- `npm run build` — Production build  
- `npm run start` — Start production server  
- `npm run lint` — ESLint (requires project ESLint config)  

### Server (`server/package.json`)

- `npm run dev` — Express with `tsx watch` (default port **4001**)  
- `npm run build` — `prisma generate` + TypeScript compile  
- `npm run start` — Run compiled `dist/server.js`  
- `npm run prisma:*` — See table above  
- `npm test` — Jest tests  

---

## API overview (`/api/*`)

- `/api/auth` — register, login, refresh, logout  
- `/api/products` — catalog, admin/seller product CRUD  
- `/api/catalog` — departments / categories tree  
- `/api/sellers` — seller registration / profile  
- `/api/coupon`, `/api/settings`, `/api/cart`, `/api/address`, `/api/order`  
- `/api/warm` — warmup / health-style route  

---

## Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| Prisma “cannot connect” | `DATABASE_URL` in `server/.env.local`; Postgres running; firewall / Docker port |
| `migrate deploy` fails | Pending migration broken — read error SQL; never force-push broken migrations to `main` without a fix migration |
| Client 401 / redirect loops | **`JWT_SECRET`** identical on **client** and **server** `.env.local` |
| API calls go to wrong host | **`NEXT_PUBLIC_API_URL`** and **`DEV_URL`** match your Express port |
| Types out of date after pull | `cd server && npm run prisma:generate` |

---

## Deployment notes

- Deploy **client** and **server** separately; point the client’s **`NEXT_PUBLIC_API_URL`** (and production **`BACKEND_URL`**) at the public API origin.  
- On the server host, set **`DATABASE_URL`** and secrets in the platform’s env UI — do not commit them.  
- Run **`prisma migrate deploy`** on release (included in **`render-build`** for this repo).  
- After schema changes, always **deploy migrations before or with** the new API version that depends on new columns.

---

## Security reminder

Do not commit real credentials. Keep `.env.local` out of git and store production secrets only in your hosting provider.
