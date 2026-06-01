# Ecommerce Platform

A production-oriented, full-stack marketplace: a **Next.js** storefront and admin consoles backed by an **Express** API, **Prisma**, and **PostgreSQL**. The platform supports multi-role users (shoppers, sellers, super admins), catalog management, cart and wishlist, coupons, checkout with **Stripe** and **PayPal**, order tracking, and operational analytics.

---

## Table of contents

- [Features](#features)
- [AI commerce module](#ai-commerce-module)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [User roles and routes](#user-roles-and-routes)
- [API overview](#api-overview)
- [Database (Prisma)](#database-prisma)
- [Auth and cookies](#auth-and-cookies)
- [Payments](#payments)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Security](#security)

---

## Features

### Storefront (customers — role `USER`)

| Area | Capabilities |
|------|----------------|
| **Browse & search** | Product listing, product detail, brands, deals (discounted / timed offers), category navigation via catalog tree |
| **Cart** | Add/update/remove items with size and color variants; clear cart |
| **Wishlist** | Toggle products on a per-user wishlist; dedicated wishlist page |
| **Checkout** | Address book, coupon application, order creation, **Stripe Checkout** and **PayPal** payment flows with return/cancel pages |
| **Orders** | Order history, order detail, checkout success; track order (guest-friendly flow) |
| **Account** | Profile area, notifications page, help |
| **UX** | Responsive layout, site header (desktop/mobile), light/dark theme (Zustand + CSS variables) |

### Seller hub (role `SELLER`)

| Area | Capabilities |
|------|----------------|
| **Onboarding** | Register as seller (users can access `/seller/register` before becoming a seller) |
| **Products** | Add and list seller-owned products (images via Cloudinary) |
| **Sales** | View order lines attributed to the seller (`/seller/sales`) |

### Super admin (role `SUPER_ADMIN`)

| Area | Capabilities |
|------|----------------|
| **Dashboard** | Overview at `/super-admin` |
| **Products** | Create, list, update, delete catalog products; debug upload route for admins |
| **Categories** | Manage departments and subcategories (catalog structure) |
| **Orders** | List all orders, update status, tracking numbers, tracking events |
| **Users** | List users, activate/deactivate, change roles |
| **Coupons** | Create and delete promotional coupons |
| **Admins** | Admin user management UI |
| **Transactions** | Payment/transaction views for finance ops |
| **Analytics** | Dashboard plus focused views: global, sales, products, customers, marketing, operations |
| **Settings** | Feature banners and featured product configuration |

### Backend capabilities

- REST API under `/api/*` with consistent **`ApiResponse` / `ApiError`** JSON shape
- JWT access + refresh tokens in **httpOnly cookies**; role-based middleware (`USER`, `SELLER`, `SUPER_ADMIN`)
- **Prisma** data layer: users, sellers, departments/subcategories, products, cart, wishlist, coupons, addresses, orders, payments, shipments, tracking events
- **Cloudinary** for product and banner media
- **Stripe** Checkout + webhooks; **PayPal** orders + webhooks
- Optional **Nodemailer** SMTP for transactional email
- **Pino** logging on the server; structured proxy logging on the Next.js edge guard
- **Jest** tests on server and client (auth refresh, orders, payment providers, etc.)
- Docker Compose for local PostgreSQL

### Seed data (optional)

Running `npm run prisma:seed` in `server/` creates demo catalog data, banners, a **super admin** (`admin@gmail.com` / `123456`), and a demo seller account — for local development only.

---

## AI commerce module

The platform includes an **AI Sales + Support Automation** layer (assistant widget, recommendations, order support, leads, admin ops, analytics, human handoff).

**Documentation:** [`docs/ai/README.md`](docs/ai/README.md)

| Doc | Contents |
|-----|----------|
| [Feature tracker](docs/ai/FEATURE-TRACKER.md) | All AI tickets, APIs, models, file map |
| [Architecture](docs/ai/ARCHITECTURE.md) | Request flow, intent routing, analytics |

---

## Architecture

```text
┌─────────────┐     cookies + JSON      ┌──────────────────┐
│   Browser   │ ◄──────────────────────►│  Next.js (3012)  │
│             │                         │  App Router +    │
│             │                         │  /app/api/* BFF  │
└─────────────┘                         └────────┬─────────┘
                                                 │ server-side proxy
                                                 ▼
                                        ┌──────────────────┐
                                        │ Express (4001)   │
                                        │ /api/*           │
                                        └────────┬─────────┘
                                                 │ Prisma
                                                 ▼
                                        ┌──────────────────┐
                                        │   PostgreSQL     │
                                        └──────────────────┘
```

**Mental model:** The browser primarily talks to **Next.js**. Sensitive auth routes and many mutations go through **Next.js Route Handlers** (`client/src/app/api/...`), which forward to Express and rewrite **Set-Cookie** headers for the app origin. Catalog reads and some flows may call the API directly via `NEXT_PUBLIC_API_URL`. **Prisma runs only on the server** — never expose `DATABASE_URL` to the client.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI, Zustand, React Hook Form, Zod, Axios, Recharts |
| **Backend** | Express 4, TypeScript, Prisma 7, PostgreSQL (`pg` adapter) |
| **Auth** | bcryptjs, jose, jsonwebtoken, cookie-based JWT (access + refresh) |
| **Payments** | Stripe Checkout, PayPal REST + webhooks |
| **Media** | Cloudinary, Multer |
| **Email** | Nodemailer (optional) |
| **Edge / security** | Arcjet (optional, client), CORS with credentials on API |

---

## Repository layout

```text
ecommerce-platform/
├── client/                      # Next.js storefront + admin UIs
│   ├── src/app/                 # App Router (route groups: storefront, admin, common)
│   ├── src/app/api/             # BFF proxies to Express (auth, cart, orders, …)
│   ├── src/components/          # UI, layout, site-header, theme
│   ├── src/store/               # Zustand (cart, theme, auth-related state)
│   ├── src/proxy.ts             # Edge auth guard (role redirects)
│   └── .env.local               # Not committed — see .env.example
├── server/                      # Express API
│   ├── src/server.ts            # App entry, mounts /api/*
│   ├── src/routes/              # Route modules
│   ├── src/controllers/         # HTTP handlers
│   ├── src/services/            # Business logic (catalog, orders, payment providers)
│   ├── src/prisma/
│   │   ├── schema.prisma        # Source of truth for tables
│   │   ├── migrations/          # Versioned SQL (commit with schema changes)
│   │   └── seed.ts              # Demo data
│   ├── docker-compose.yml       # Local Postgres on port 5436
│   └── .env.local               # Not committed
├── docs/
│   └── ai/                      # AI module docs (feature tracker, architecture)
├── CLAUDE.md                    # Agent/contributor conventions
└── README.md                    # This file
```

| Concern | Location |
|---------|----------|
| HTTP API routes | `server/src/routes/*.ts` → `server/src/server.ts` |
| Env loading (server) | `server/src/config/loadEnv.ts` |
| Prisma client | `server/src/lib/prisma.ts` (dev singleton) |
| Payment providers | `server/src/services/payment/` |
| Next.js auth redirects | `client/src/proxy.ts` |
| API base URL (browser) | `NEXT_PUBLIC_API_URL` + `client/src/utils/routes/api.ts` |

---

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **PostgreSQL** (local via Docker Compose in `server/`, or any hosted instance)

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repo-url> ecommerce-platform
cd ecommerce-platform

cd server && npm install
cd ../client && npm install
```

### 2. Start PostgreSQL (optional Docker)

```bash
cd server
docker compose up -d
```

Default connection (matches `server/.env.example`):  
`postgresql://user:password@localhost:5436/nextecommerce?schema=public`

### 3. Environment files

```bash
cp server/.env.example server/.env.local
cp client/.env.example client/.env.local
```

Set at minimum:

- **`server/.env.local`:** `DATABASE_URL`, `JWT_SECRET`, `PORT=4001`
- **`client/.env.local`:** `NEXT_PUBLIC_API_URL=http://localhost:4001`, `DEV_URL=http://localhost:4001`, **`JWT_SECRET` identical to server**

Add Cloudinary, Stripe, and PayPal keys when testing uploads or payments (see [Environment variables](#environment-variables)).

### 4. Database

```bash
cd server
npm run prisma:migrate:deploy
npm run prisma:generate
npm run prisma:seed    # optional demo data
```

### 5. Run both apps (two terminals)

```bash
# Terminal A — API (http://localhost:4001)
cd server && npm run dev

# Terminal B — Next.js (http://localhost:3012)
cd client && npm run dev
```

Open **http://localhost:3012**. API root: **GET http://localhost:4001/**.

After seeding, sign in as super admin: **admin@gmail.com** / **123456**.

---

## Environment variables

### Server (`server/.env.example`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default `4001`) |
| `JWT_SECRET` | Must match client for token verification |
| `ACCESS_TOKEN_*` / `REFRESH_TOKEN_*` | Token signing and expiry |
| `COOKIE_DOMAIN` | Cookie domain (e.g. `localhost`) |
| `FRONTEND_URL` | Allowed CORS origin |
| `CLOUDINARY_*` | Image uploads |
| `STRIPE_*` | Checkout and webhooks |
| `PAYPAL_*` | Sandbox/live PayPal + return URLs |
| `SMTP_*` | Optional email |

### Client (`client/.env.example`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend origin **without** `/api` |
| `NEXT_PUBLIC_APP_URL` | App origin (e.g. `http://localhost:3012`) |
| `DEV_URL` / `BACKEND_URL` | Server-side proxy targets |
| `JWT_SECRET` | **Same as server** — required for `proxy.ts` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe.js |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal JS SDK |
| `ARCJET_KEY` | Optional rate limiting |

Never commit `.env.local` or production secrets.

---

## User roles and routes

| Role | Default home after login | Access |
|------|--------------------------|--------|
| `USER` | `/home` | Storefront, cart, checkout, wishlist, account |
| `SELLER` | `/seller` | Seller dashboard, products, sales |
| `SUPER_ADMIN` | `/super-admin` | Full admin + analytics |

`client/src/proxy.ts` enforces role-based redirects (e.g. shoppers cannot open super-admin URLs; sellers are blocked from admin-only paths).

**Public routes** (no valid session required): `/auth/login`, `/auth/register`, `/help`.

---

## API overview

Base path: **`/api`**. Responses use `{ success, message, data, statusCode }` on success; errors use `ApiError` with `success: false`.

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login, logout, refresh, heartbeat, `GET /me` |
| `/api/products` | Admin/seller CRUD, client listing, categories, product by id |
| `/api/catalog` | Department/subcategory tree and admin structure CRUD |
| `/api/sellers` | Seller registration, `GET /me` profile |
| `/api/users` | Super-admin user list, role and active status |
| `/api/cart` | Fetch, add, update quantity, remove, clear |
| `/api/wishlist` | List, toggle, remove item |
| `/api/coupon` | List coupons; super-admin create/delete |
| `/api/settings` | Feature banners, featured products |
| `/api/address` | CRUD shipping addresses (authenticated) |
| `/api/order` | Create/capture payment, user orders, admin order ops, seller sales, transactions, webhooks (`/webhooks/stripe`, `/webhooks/paypal`) |
| `/api/analytics` | Super-admin dashboard metrics |
| `/api/warm` | Warmup / health-style endpoint |

Payment webhooks are mounted **without** JWT — they validate provider signatures instead.

---

## Database (Prisma)

**Schema:** `server/src/prisma/schema.prisma`  
**Migrations:** `server/src/prisma/migrations/`

### Core models

- **User** — auth, role, cart, wishlist, orders, coupons
- **Department / Subcategory** — navigable catalog tree
- **Seller** — marketplace vendor linked to optional `User`
- **Product** — pricing, deals, stock, images, seller and subcategory relations
- **Cart / CartItem** — per-user cart with size/color uniqueness
- **Wishlist / WishlistItem**
- **Coupon / UserCoupon**
- **Address**, **Order**, **OrderItem**, **Payment**
- **OrderShipment**, **OrderTrackingEvent** — fulfillment and tracking
- **FeatureBanner**

### Workflows

| Task | Command |
|------|---------|
| Apply migrations after pull | `cd server && npm run prisma:migrate:deploy && npm run prisma:generate` |
| Create migration after schema edit | `npm run prisma:migrate:dev -- --name describe_change` |
| Regenerate client only | `npm run prisma:generate` |
| **Destructive local reset** | `npm run prisma:migrate:reset` (wipes data) |

Commit **`schema.prisma`** and new migration folders together. Prefer migrations over `db push` for shared environments.

**Production / CI:** `npm run prisma:migrate:deploy` (included in server `render-build` script).

---

## Auth and cookies

1. **Login/register** hit Express (often via Next.js `/api/auth/*` proxies).
2. Server sets **httpOnly** `accessToken` and `refreshToken` cookies.
3. **Access token** is short-lived; **refresh** rotates via `/api/auth/refresh-token`.
4. Next.js **`proxy.ts`** verifies the access token with `jose` and redirects by role.
5. If access is missing but refresh exists, the proxy allows the request so the client can silently refresh.

**Production:** Cookies are rewritten from the API host to the app host through Next route handlers so the browser only stores cookies for your storefront domain.

---

## Payments

| Method | Flow |
|--------|------|
| **Stripe** | Checkout Session → redirect to Stripe → `/stripe/return` or `/stripe/cancel` → webhook confirms capture |
| **PayPal** | Create order → approve in PayPal → `/paypal/return` or `/paypal/cancel` → capture + webhook |

Configure return URLs in server env to match your Next.js origin (default port **3012**). Order status progresses through enums such as `DRAFT`, `PENDING_PAYMENT`, `PROCESSING`, `SHIPPED`, `DELIVERED`, with matching `Payment` attempt rows per provider session.

---

## Scripts

### Client (`client/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server on port **3012** |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm test` | Jest |

### Server (`server/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Express with `tsx watch` (port **4001**) |
| `npm run build` | `prisma generate` + `tsc` |
| `npm run start` | `node dist/server.js` |
| `npm run prisma:*` | Generate, migrate dev/deploy/reset, seed |
| `npm run render-build` | CI/deploy: install, generate, build, migrate deploy |
| `npm test` | Jest |

---

## Testing

```bash
cd server && npm test
cd client && npm test
```

Run lint/build before merging substantial changes:

```bash
cd client && npm run lint && npm run build
cd server && npm run build
```

See **`CLAUDE.md`** for verification expectations on contributions.

---

## Deployment

- Deploy **client** and **server** separately.
- Point `NEXT_PUBLIC_API_URL` and production `BACKEND_URL` at the public API origin.
- Set secrets only in the hosting provider (Render, Vercel, etc.).
- Run **`prisma migrate deploy`** on each API release before or with code that depends on new columns (`render-build` automates this for the server package).
- Configure Stripe/PayPal webhooks to your public API URLs.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Prisma cannot connect | `DATABASE_URL`, Postgres running, Docker port `5436` |
| Auth redirect loops | `JWT_SECRET` **identical** on client and server |
| API calls wrong host | `NEXT_PUBLIC_API_URL`, `DEV_URL` match Express port |
| Types stale after pull | `cd server && npm run prisma:generate` |
| CORS errors | `FRONTEND_URL` and request `Origin` |
| Payments fail locally | Stripe/PayPal keys and return URLs use port **3012** |

---

## Contributing

Read **`CLAUDE.md`** for project laws: test discipline, env safety, route boundaries, and required checks before claiming a change is done.

---

## Security

- Do not commit credentials or `.env.local`.
- Keep `JWT_SECRET` and payment webhook secrets out of the client bundle (only `NEXT_PUBLIC_*` publishable keys belong in the browser).
- Validate env at startup on the server; fail fast on missing critical config in production paths.

---

## Package documentation

- **[client/README.md](./client/README.md)** — Next.js app structure, pages, BFF routes, frontend patterns
- **[server/README.md](./server/README.md)** — API layers, Prisma, services, webhooks, Docker
