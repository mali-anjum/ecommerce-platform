# Client — Next.js storefront & admin

The **client** package is a [Next.js 16](https://nextjs.org) application (App Router) that powers the public storefront, customer account flows, seller hub, and super-admin console. It talks to the Express API in `../server` through browser requests and through **Route Handlers** under `src/app/api/` that proxy auth-sensitive traffic and normalize cookies for the app origin.

**Monorepo root:** see [../README.md](../README.md) for full-stack setup, env vars, and deployment.

---

## Quick start

```bash
cd client
cp .env.example .env.local   # from repo root instructions
npm install
npm run dev
```

Open **http://localhost:3012** (this project pins port **3012**, not 3000).

Requires the API running at `NEXT_PUBLIC_API_URL` (default `http://localhost:4001`).

---

## Tech stack

| Category | Libraries |
|----------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 3, `tailwindcss-animate`, CVA, `clsx`, `tailwind-merge` |
| UI | Radix UI primitives (dialog, dropdown, tabs, toast, …) |
| Forms | React Hook Form, Zod, `@hookform/resolvers` |
| State | Zustand (`src/store/`) |
| HTTP | Axios |
| Auth (edge) | `jose` for JWT verification in `src/proxy.ts` |
| Charts | Recharts (admin analytics) |
| Payments (UI) | `@paypal/react-paypal-js`, Stripe publishable key via env |
| Security (optional) | `@arcjet/next` |

---

## Project structure

```text
client/
├── src/
│   ├── app/                    # App Router pages & layouts
│   │   ├── (storefront)/       # Shop: home, products, cart, checkout, deals, …
│   │   ├── (admin)/            # super-admin/* and seller/*
│   │   ├── (common)/           # auth, track-order, notifications
│   │   └── api/                # BFF route handlers → Express
│   ├── components/
│   │   ├── layout/site-header/ # Header, nav, mobile sheet, search hooks
│   │   ├── common/theme/       # Theme toggle, segmented control
│   │   └── ui/                 # shadcn-style primitives
│   ├── store/                  # Zustand stores (theme, cart-related, …)
│   ├── lib/theme/              # Theme types and DOM utilities
│   ├── utils/routes/           # API path helpers
│   └── proxy.ts                # Edge guard: JWT + role redirects
├── tailwind.config.ts
├── .env.example
└── package.json
```

---

## Route groups and pages

### Storefront `(storefront)/`

| Path | Purpose |
|------|---------|
| `/` | Root redirect / entry |
| `/home` | Main shop home (authenticated shoppers) |
| `/products` | Product grid / filters |
| `/products/[id]` | Product detail |
| `/brands` | Brand browsing |
| `/deals` | Discounted / deal products |
| `/cart` | Shopping cart |
| `/wishlist` | Saved items |
| `/checkout` | Checkout flow |
| `/checkout/success` | Post-purchase confirmation |
| `/account` | Customer account |
| `/help` | Help (public) |
| `/stripe/return`, `/stripe/cancel` | Stripe Checkout callbacks |
| `/paypal/return`, `/paypal/cancel` | PayPal callbacks |

### Seller `(admin)/seller/`

| Path | Purpose |
|------|---------|
| `/seller` | Seller dashboard |
| `/seller/register` | Become a seller (also allowed for `USER` role) |
| `/seller/products/add` | Create product |
| `/seller/products/list` | Manage listings |
| `/seller/sales` | Seller order lines |

### Super admin `(admin)/super-admin/`

| Path | Purpose |
|------|---------|
| `/super-admin` | Admin home |
| `/super-admin/products/add`, `.../list` | Product CRUD |
| `/super-admin/categories` | Catalog departments / subcategories |
| `/super-admin/orders` | Order management |
| `/super-admin/users` | User administration |
| `/super-admin/admins` | Admin accounts |
| `/super-admin/coupons/add`, `.../list` | Coupons |
| `/super-admin/transactions` | Payment transactions |
| `/super-admin/settings` | Site settings |
| `/super-admin/analytics/*` | global, sales, products, customers, marketing, operations |

### Common `(common)/`

| Path | Purpose |
|------|---------|
| `/auth/login`, `/auth/register` | Authentication (public) |
| `/track-order` | Order tracking |
| `/notifications` | Notifications UI |

---

## Authentication (`src/proxy.ts`)

Next.js uses **`proxy.ts`** (replacing the older root `middleware.ts` pattern in this repo) to:

1. Read `accessToken` / `refreshToken` cookies.
2. Verify the access JWT with `JWT_SECRET` (must match the server).
3. Redirect unauthenticated users to `/auth/login` (except public routes).
4. Redirect authenticated users away from login/register to role-specific homes:
   - `SUPER_ADMIN` → `/super-admin`
   - `SELLER` → `/seller`
   - `USER` → `/home`
5. Block cross-role URL access (e.g. shoppers cannot open `/super-admin`).

**Public routes:** `/auth/login`, `/auth/register`, `/help`.

Matcher excludes `api`, `_next/static`, `_next/image`, and `favicon.ico`.

---

## BFF API routes (`src/app/api/`)

Route Handlers proxy to Express so cookies and secrets stay server-side. Examples:

| Route | Backend |
|-------|---------|
| `/api/auth/login`, `register`, `logout`, `refresh-token`, `me`, `heartbeat` | `/api/auth/*` |
| `/api/cart/*` | `/api/cart/*` |
| `/api/wishlist/*` | `/api/wishlist/*` |
| `/api/order/*` | `/api/order/*` |
| `/api/users/*` | `/api/users/*` |
| `/api/analytics/dashboard` | `/api/analytics/dashboard` |
| `/api/catalog/tree`, `structure` | `/api/catalog/*` |
| `/api/warm` | `/api/warm` |

**Local direct call:** browser → `localhost:4001` → cookies on API host.  
**Production proxy:** browser → `yourapp.com/api/auth/login` → Next.js → backend → cookies rewritten for `yourapp.com`.

Use `DEV_URL` / `BACKEND_URL` in `.env.local` for server-side fetch targets.

---

## API response shape

The backend standardizes JSON responses. Handle them consistently in the UI:

**Success:**

```ts
{
  success: true,
  message: string,
  data: T,
  statusCode: number
}
```

**Error (`ApiError`):**

```ts
{
  success: false,
  message: string,
  data: null,
  statusCode: number,
  errors: unknown[]
}
```

Axios callers should read `response.data` and branch on `success` rather than assuming legacy `{ data: { success } }` nesting.

---

## Environment variables

Copy `client/.env.example` → `.env.local`.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_URL` | Yes | e.g. `http://localhost:4001` (no `/api` suffix) |
| `NEXT_PUBLIC_APP_URL` | Yes | e.g. `http://localhost:3012` |
| `DEV_URL` | Yes (dev) | Same as API for route handlers |
| `JWT_SECRET` | Yes | Must match **server** `JWT_SECRET` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For Stripe UI | |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | For PayPal buttons | |
| `BACKEND_URL` | Production | Public API origin for proxies |
| `ARCJET_KEY` | Optional | Rate limiting |

---

## Theme system

Light/dark (and related preferences) use:

- `src/store/useThemeStore.ts` — persisted preference
- `src/lib/theme/theme-utils.ts` — apply class/data attributes on `document.documentElement`
- `src/components/layout/ThemeInitializer.tsx` — hydrate theme on load
- `src/components/common/theme/*` — toggle UI (desktop segmented control, mobile menu rows)

Tailwind `darkMode` is configured in `tailwind.config.ts` (class strategy).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development on port **3012** |
| `npm run build` | Production build (typecheck + routes) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint (`eslint . --max-warnings 0`) |
| `npm test` | Jest (e.g. auth refresh, order route tests) |

---

## Verification

After substantive UI changes:

```bash
npm run lint
npm run build
```

---

## Roadmap (not yet implemented)

The codebase may evolve toward richer marketplace UX (multi-wishlist, guest checkout, store locator, live chat, PWA, etc.). Those items are **not** guaranteed in the current routes above—track them as product backlog, not current features.

---

## Related docs

- [Root README](../README.md) — architecture, Prisma, payments, deployment
- [Server README](../server/README.md) — REST API and data layer
- [CLAUDE.md](../CLAUDE.md) — contributor verification rules
