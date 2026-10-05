---
name: ecom-backend-feature
description: How to add or change Express API endpoints in server/ the way this repo does it — route → zod validation → asyncHandler controller → service → Prisma, with ApiResponse/ApiError, role middleware, feature flags, logging, and Jest tests. Use for any work in server/src/routes, controllers, services, validations, or middleware.
---

# Backend feature (server/)

Stack: Express 5, TypeScript, Prisma 7 (PostgreSQL), zod, jose/jsonwebtoken, pino, Jest + ts-jest.

## Layering (keep boundaries clear)

```
routes/xRoutes.ts        → wiring only: middleware order + controller
validations/xSchema.ts   → zod schemas for request bodies
controllers/xController.ts → HTTP only: read req, call service, send ApiResponse
services/x/...           → business logic + Prisma; no req/res
lib/prisma.ts            → the ONLY Prisma client (global singleton) — import { prisma }
```

Register new routers in `server/src/server.ts` under `/api/*`. Whole optional modules use `registerFeatureModuleRoutes` (see `ecom-ai-module`).

## Route template

Follow `server/src/routes/reviewRoutes.ts`:

```ts
router.get("/product/:productId", getProductReviews);
router.post("/", authenticateJwt, validate(createProductReviewSchema), postProductReview);
```

Middleware order: feature flag → `authenticateJwt` (or `optionalAuthenticateJwt`) → role guard (`isSuperAdmin`, `requireSellerOrSuperAdmin`, `attachSellerProfile`) → `validate(schema)` → upload middleware → controller.

## Controller template

Follow `server/src/controllers/productReviewController.ts`:

- Wrap in `asyncHandler` so thrown errors reach `errHandler`.
- Get the user with `requireUserId(req)` — never from `req.body`.
- Read the validated body from `req.validatedData` (typed via the schema), not raw `req.body`.
- Throw `ApiError` / `NotFoundError` / `UnauthorizedError` / `ValidationError` from `utils/ApiError.ts`; do not hand-build error JSON.
- Respond with `res.status(code).json(new ApiResponse(code, data, "Message"))`.

## Service rules

- Pure functions or small classes taking plain typed input (`{ userId, productId, ... }`).
- Use `select`/`include` to fetch only needed fields; never return `password`, token hashes, or provider secrets.
- Multi-step writes that must succeed together go in `prisma.$transaction`.
- Ownership checks live here: a SELLER may only touch rows with their `sellerId`; a USER only their own cart/orders/addresses.
- Compute money (prices, totals, discounts, coupons) on the server from DB values. Never trust client prices.
- Avoid N+1 queries; batch with `findMany({ where: { id: { in: ids } } })`.

## Validation rules

- Every write endpoint has a zod schema in `src/validations/`. Use `.trim()`, `.min/.max`, `.uuid()`, `z.coerce.number().int()` as in `reviewSchema.ts`.
- Validate route params and query strings too (inline zod or explicit checks → 400).

## Logging and errors

- Use `logger` from `utils/logger.ts` (pino) — no `console.log` in new code.
- Never log tokens, cookies, passwords, full request bodies, card/payment payloads, or uploaded file contents. Log ids and counts.
- Report unexpected errors with `sentryTracker(error, { source: "..." })` from `lib/monitoring`.

## Config

- Env is loaded once by `src/config/loadEnv.ts`. Read env vars in `src/config/*` modules and fail fast when a required one is missing. No silent fallbacks for secrets.

## Tests (required)

- Location: `src/<area>/__tests__/<name>.test.ts` (jest `testMatch: **/__tests__/**/*.test.ts`).
- Mock Prisma with `jest.mock("../../lib/prisma", () => ({ prisma: { model: { findUnique: jest.fn(), ... } } }))` and mock `../../lib/monitoring` to keep output clean. See `src/middleware/__tests__/sellerMiddleware.test.ts`.
- Cover: success, 400 validation, 401 no auth, 403 wrong role / not owner, 404 missing, and the business edge cases.
- Assert on status code **and** response body, and that Prisma was called with the expected `where` (proves ownership filtering).

Then run `ecom-verify`.
