---
name: ecom-testing
description: How to write strict, meaningful Jest tests in this repo for server (Express controllers, middleware, services, Prisma mocks) and client (BFF route handlers, proxy.ts, stores, utils), including mocking patterns, what cases to cover, and mutation-checking that tests catch bugs. Use when adding or improving tests, raising coverage, or when a change has no tests.
---

# Testing — tests that actually catch bugs

Both packages: Jest 30 + ts-jest, node environment, files at `src/**/__tests__/*.test.ts`. Always run with `--runInBand` (limited RAM).

```bash
cd server && npx jest --runInBand src/path/__tests__/file.test.ts   # one file
cd server && npx jest --runInBand -t "partial test name"             # by name
cd server && npx jest --runInBand                                    # all
cd server && npx jest --runInBand --coverage --collectCoverageFrom='src/<area>/**/*.ts'   # coverage for one area
```
(Same commands in `client/`.)

## What every test file should cover

For an endpoint/middleware/service, at minimum:
- Happy path — assert status **and** response body **and** the DB/service call arguments.
- Validation failure → 400 with the field name.
- No auth → 401; wrong role → 403; another user's/seller's resource → 403 or 404.
- Not found → 404.
- The business edge cases (zero/negative quantity, out of stock, expired coupon, duplicate webhook, etc.).
- Error path: dependency throws → correct status, no sensitive data in response or logs.

## Server patterns

- Mock Prisma at the module boundary:
  ```ts
  jest.mock("../../lib/prisma", () => ({
    prisma: { seller: { findUnique: jest.fn() } },
  }));
  ```
- Mock monitoring to keep output clean: `jest.mock("../../lib/monitoring", () => ({ sentryTracker: jest.fn() }));`
- Build `req`/`res`/`next` as small typed fakes (`res.status` returns `res`, `res.json` is `jest.fn()`). Examples: `src/middleware/__tests__/sellerMiddleware.test.ts`, `src/middleware/__tests__/authMiddleware.test.ts` (signs real JWTs with jose to test auth for real).
- Mock external SDKs (Stripe, PayPal, Cloudinary, LLM providers) — never hit real services. Examples: `src/services/payment/providers/__tests__/`.
- Env: set `process.env.X` in `beforeEach`, restore in `afterEach`. To unset, use `Reflect.deleteProperty(process.env, "X")` — assigning `undefined` stores the string `"undefined"`.

## Client patterns

- BFF routes: replace `global.fetch` with `jest.fn().mockResolvedValue(new Response(...))`, restore in `afterEach`, call the exported `GET`/`POST` with a `NextRequest`. Example: `src/app/api/auth/login/__tests__/route.test.ts`.
- Edge guard: `src/__tests__/proxy.test.ts` — add a case for every role/route rule you change.
- Stores/utils: test pure functions directly; mock `axios` for store actions.
- No DOM testing library is installed; keep component logic in hooks/utils so it is testable in node.

## Rules

- No `.only`, `.skip`, `xit`, or commented-out tests in commits.
- No snapshot tests for logic; assert explicit values.
- Tests are independent: reset mocks in `beforeEach` (`jest.clearAllMocks()`), no shared mutable state, no order dependence.
- No real network, DB, timers, or randomness — use fakes, `jest.useFakeTimers()`, and the seeded helpers.
- Test names describe behaviour: `"returns 403 when a SELLER has no seller profile"`.

## Mutation check (required for new logic)

Temporarily break the code under test (remove a guard, flip a comparison, return early). At least one test must fail. Restore and re-run green. If nothing failed, the tests are too weak — add the missing assertion.
