---
name: ecom-debug
description: Systematic debugging workflow for this repo — reproduce, locate the failing layer (browser → Next.js BFF/proxy.ts → Express → service → Prisma/Postgres → Stripe/PayPal/Cloudinary/LLM), find the root cause, fix with a regression test. Use for any bug report, error message, failing test, crash, auth/redirect loop, 4xx/5xx response, or "it doesn't work".
---

# Debug — root cause first, then fix

Never patch symptoms. A fix without a reproduced cause and a regression test is a guess.

## 1. Reproduce

- Get the exact error, URL, request, user role, and steps. Read the full stack trace.
- Reproduce with the smallest thing possible, in this order of preference:
  1. A failing Jest test (`npx jest --runInBand path/to/file.test.ts -t "name"`)
  2. A direct API call: `curl -i http://localhost:4001/api/...` (add `-H "Authorization: Bearer <token>"` only with a local test user's token — never paste real user tokens into the transcript)
  3. The UI (both apps running: `cd server && npm run dev`, `cd client && npm run dev`, http://localhost:3012)
- If you cannot reproduce, say so and gather more evidence; do not guess-fix.

## 2. Locate the failing layer

Follow the request path and check each hop:

| Layer | Where to look | Typical causes |
|---|---|---|
| Browser | DevTools Network/Console | wrong BFF path, missing `credentials`, hydration error |
| Edge guard | `client/src/proxy.ts` | redirect loop: `JWT_SECRET` differs between client and server, expired token, role mismatch |
| BFF route | `client/src/app/api/**/route.ts`, `lib/api/proxyWithAuth.ts` | missing cookie forward, `await params` missing, timeout (504), wrong `API_ROUTES` |
| Express middleware | `authenticateJwt`, role guards, `validate`, feature flags | 401 token/claims, 403 role/seller profile, 400 zod issues, 404 when a flag/module is off |
| Controller/service | `server/src/controllers`, `server/src/services` | ownership filter, null handling, wrong status, unhandled promise |
| Prisma/DB | `server/src/prisma/schema.prisma` | client not regenerated (`npm run prisma:generate`), migration not applied, unique/foreign key violation (`P2002`, `P2003`, `P2025`) |
| External | Stripe/PayPal/Cloudinary/Resend or SMTP/LLM | missing env var, sandbox vs live keys, webhook secret, return URL port (3012) |

Logs: server uses pino (`LOG_LEVEL=debug` in your local env to see more); client uses `src/lib/logger.ts`. Errors are also reported to Sentry — use the `sentry-fix-issues` skill for production issues.

See the README "Troubleshooting" table for known symptom → cause pairs.

## 3. Prove the cause

State the root cause in one sentence and the evidence (log line, failing assertion, query result). If two causes are plausible, add a temporary check to tell them apart; remove it afterwards.

## 4. Fix + regression test

- Write the failing test first (it must fail for the right reason), then fix, then confirm it passes.
- Fix at the layer that is wrong — do not add a client workaround for a server bug.
- Keep the fix minimal; no unrelated refactors.
- Remove any temporary logging. Never leave logs that print tokens, cookies, or bodies.

## 5. Memory-safe

Run one heavy command at a time; Jest with `--runInBand`; target the single test file while iterating.

Then run `ecom-verify`, and in the report include: symptom, root cause, fix, and the regression test name.
