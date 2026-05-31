# Server — Express API & data layer

The **server** package is a TypeScript **Express** application that exposes a REST API under `/api/*`, persists data with **Prisma 7** and **PostgreSQL**, and integrates **Cloudinary**, **Stripe**, **PayPal**, and optional **Nodemailer**.

**Monorepo root:** see [../README.md](../README.md) for full-stack setup and feature overview.

---

## Quick start

```bash
cd server
cp .env.example .env.local
npm install

# Optional: Postgres via Docker (port 5436 on host)
docker compose up -d

npm run prisma:migrate:deploy
npm run prisma:generate
npm run prisma:seed    # optional: admin@gmail.com / 123456

npm run dev
```

API default: **http://localhost:4001**  
Health: **GET /** → `Hello from E-Commerce backend`

---

## Tech stack

| Category | Libraries |
|----------|-----------|
| Runtime | Node.js, Express 4, TypeScript |
| ORM | Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`) |
| Auth | bcryptjs, jsonwebtoken, jose, cookie-parser |
| Validation | Zod (request schemas in routes/middleware) |
| Uploads | Multer → Cloudinary |
| Payments | Stripe SDK, PayPal REST, webhook controllers |
| Logging | Pino (+ pino-pretty in dev) |
| Testing | Jest, ts-jest |

---

## Project structure

```text
server/
├── src/
│   ├── server.ts              # App composition root (load env first)
│   ├── config/
│   │   ├── loadEnv.ts         # Single source of truth for dotenv
│   │   └── cloudinary.ts
│   ├── lib/prisma.ts          # Prisma singleton (dev hot-reload safe)
│   ├── routes/                # Express routers mounted in server.ts
│   ├── controllers/           # HTTP request/response
│   ├── services/              # Business logic
│   │   ├── catalogService.ts
│   │   ├── payment/           # Factory + Stripe/PayPal providers
│   │   └── order/
│   ├── middleware/            # auth, upload, error handler, validation
│   ├── utils/                 # ApiError, ApiResponse, helpers
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       └── seed.ts
├── docker-compose.yml         # Postgres 13 → host :5436
├── .env.example
└── package.json
```

### Layering convention

| Layer | Responsibility |
|-------|----------------|
| **Routes** | HTTP verbs, middleware chain, Zod validation |
| **Controllers** | Parse request, call services, send `ApiResponse` |
| **Services** | Business rules, Prisma transactions, external APIs |
| **Middleware** | JWT auth, role checks (`isSuperAdmin`, `attachSellerProfile`), Multer |

Upload and payment provider details stay in services—not duplicated across controllers.

---

## Application entry (`src/server.ts`)

1. `import "./config/loadEnv"` — env loaded before anything else.
2. CORS with `credentials: true` and configurable `FRONTEND_URL`.
3. `express.json()`, `cookie-parser`.
4. Mount routers under `/api/*`.
5. Central `errorHandler` middleware.
6. 404 → `ApiError` JSON.
7. Graceful `SIGINT` → `prisma.$disconnect()`.

**Default port:** `process.env.PORT || 3001` (set `PORT=4001` in `.env.local` to match the client docs).

---

## API routes

| Mount | Module | Highlights |
|-------|--------|------------|
| `/api/auth` | `authRoutes` | register, login, logout, refresh-token, heartbeat, `GET /me` |
| `/api/products` | `productRoutes` | Admin/seller CRUD + Multer uploads; public `fetch-client-products`, `categories`, `/:id` |
| `/api/catalog` | `catalogRoutes` | `GET /tree`, `GET /structure`; super-admin department/subcategory CRUD |
| `/api/sellers` | `sellerRoutes` | `POST /register`, `GET /me` |
| `/api/users` | `userRoutes` | Super-admin list users, patch role/status |
| `/api/coupon` | `couponRoutes` | List; super-admin create/delete |
| `/api/settings` | `settingRoutes` | Feature banners, featured products |
| `/api/cart` | `cartRoutes` | fetch, add, update, remove, clear |
| `/api/wishlist` | `wishlistRoutes` | list, toggle, remove |
| `/api/address` | `addressRoutes` | CRUD addresses |
| `/api/order` | `orderRoutes` | Payments, webhooks, admin/seller/user order APIs |
| `/api/analytics` | `analyticsRoutes` | `GET /dashboard` (super-admin) |
| `/api/warm` | `warm` | Warmup |

### Order & payments (`orderRoutes`)

- **Webhooks (no JWT):** `POST /webhooks/stripe`, `POST /webhooks/paypal`, generic `POST /webhooks/:provider`
- **Authenticated:** `POST /create-order`, `POST /capture-order`, `GET /methods`
- **User:** `GET /get-all-orders`, `GET /:orderId`
- **Super admin:** all orders, status updates, tracking, transactions
- **Seller:** `GET /seller/my-sales` (with `attachSellerProfile`)

Payment logic is routed through `services/payment/payment.factory.ts` and provider modules under `services/payment/providers/`.

---

## Authentication

- Passwords hashed with **bcryptjs**.
- **Access** and **refresh** tokens issued on login/register; refresh token stored on `User.refreshToken`.
- `authenticateJwt` middleware reads the access token from cookies (or Authorization header where applicable).
- Role guards: `isSuperAdmin`, seller profile attachment for marketplace endpoints.

Roles (`enum Role`): `USER`, `SELLER`, `SUPER_ADMIN`.

---

## Data model (Prisma)

**Schema file:** `src/prisma/schema.prisma`

| Model | Purpose |
|-------|---------|
| `User` | Account, role, refresh token, relations |
| `Department`, `Subcategory` | Catalog hierarchy |
| `Seller` | Vendor profile (optional link to `User`) |
| `Product` | Catalog SKU: price, deals, stock, images, seller |
| `Cart`, `CartItem` | Per-user cart (unique per product/size/color) |
| `Wishlist`, `WishlistItem` | Saved products |
| `Coupon`, `UserCoupon` | Promotions |
| `Address` | Shipping addresses |
| `Order`, `OrderItem` | Orders with status and payment summary |
| `Payment` | Per-attempt provider session (Stripe/PayPal refs) |
| `OrderShipment`, `OrderTrackingEvent` | Fulfillment timeline |
| `FeatureBanner` | Homepage banners |

**Order status** includes: `DRAFT`, `PENDING_PAYMENT`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, payment failure states, etc.

**Payment methods:** `CREDIT_CARD`, `PAYPAL`, `STRIPE`.

---

## Prisma commands

| npm script | When to use |
|------------|-------------|
| `prisma:generate` | After schema/migration changes; part of `build` |
| `prisma:migrate:dev` | Local schema edit → new migration |
| `prisma:migrate:deploy` | Apply committed migrations (CI, prod, after git pull) |
| `prisma:migrate:reset` | **Dev only** — wipe DB and reapply |
| `prisma:seed` | Demo catalog, admin user, seller |

```bash
# After editing schema.prisma
npm run prisma:migrate:dev -- --name add_feature_x
# Commit schema.prisma + new migration folder
```

---

## Docker PostgreSQL

`docker-compose.yml` runs Postgres 13:

| Setting | Value |
|---------|--------|
| Host port | `5436` → container `5432` |
| User / password / DB | `user` / `password` / `nextecommerce` |

Example `DATABASE_URL`:

```text
postgresql://user:password@localhost:5436/nextecommerce?schema=public
```

---

## Environment variables

See `.env.example` for the full list. Critical groups:

| Group | Variables |
|-------|-----------|
| Core | `DATABASE_URL`, `PORT`, `NODE_ENV`, `JWT_SECRET`, token expiry, `COOKIE_DOMAIN`, `FRONTEND_URL` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, return/cancel URLs |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, checkout base URL |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |

PayPal/Stripe return URLs must point at the **Next.js** origin (e.g. `http://localhost:3012/...`), not the API port.

---

## Response format

**Success — `ApiResponse`:**

```ts
{ success: true, message: string, data: T, statusCode: number }
```

**Error — `ApiError`:**

```ts
{ success: false, message: string, data: null, statusCode: number, errors: unknown[] }
```

The global `errorHandler` serializes thrown `ApiError` instances consistently.

---

## Seed data

`npm run prisma:seed` creates:

- Catalog departments/subcategories and sample products (from constants + generators)
- Feature banners
- Super admin: **admin@gmail.com** / **123456**
- Demo seller linked to the same credentials pattern

Use only in local/staging environments.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | `tsx watch src/server.ts` |
| `npm run build` | `prisma generate` + `tsc` → `dist/` |
| `npm run start` | `node dist/server.js` |
| `npm run render-build` | CI: install, generate, build, `migrate deploy` |
| `npm test` | Jest (controllers, payment providers, payment method registry) |

---

## Testing

```bash
npm test
```

Notable suites:

- `services/payment/providers/__tests__/stripe.service.test.ts`
- `services/payment/providers/__tests__/paypal.service.test.ts`
- `controllers/__tests__/productController.test.ts`

Run `npm run build` before merging API changes.

---

## Deployment notes

- Set all secrets in the host environment (Render, Railway, etc.).
- Use `npm run render-build` or equivalent: **generate → build → migrate deploy**.
- Register Stripe/PayPal webhooks against your public `/api/order/webhooks/*` URLs.
- Ensure CORS `FRONTEND_URL` matches the deployed Next.js origin.

---

## Architecture goals (maintainer notes)

The codebase favors:

- **Separation of concerns** — controllers thin, services testable
- **Single upload/payment abstraction** — change Cloudinary or Stripe in one place
- **Zod validation** at route boundaries
- **Deterministic startup** — missing critical env should fail in config modules, not at random runtime

---

## Related docs

- [Root README](../README.md)
- [Client README](../client/README.md)
- [CLAUDE.md](../CLAUDE.md)
