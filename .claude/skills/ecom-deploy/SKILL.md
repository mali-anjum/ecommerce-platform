---
name: ecom-deploy
description: Release and deployment checklist for this repo — server (Express API on Render or similar, prisma migrate deploy) and client (Next.js on Vercel), environment variables in the hosting provider, webhooks, CORS, and post-deploy smoke checks and rollback. Use when deploying, preparing a release, changing env vars, adding a new required secret, or debugging a production-only failure.
---

# Deploy and release

Client and server deploy separately. Secrets live **only** in the hosting provider's environment settings — never in git, never in GitHub repository files. (There are no GitHub Actions in this repo, so GitHub secrets are not used.)

## Before deploying

1. `main` is green locally (`ecom-verify`): server build + tests, client tests + build.
2. New env vars are documented in `server/.env.example` / `client/.env.example` (names and safe placeholder values only) and added in the host dashboards **before** the code that needs them ships.
3. Migrations are backward compatible with the currently running code (see `ecom-prisma-change`): new columns nullable or defaulted; no drops of columns the old code still reads.
4. Breaking API changes: deploy the server first (supporting old and new), then the client.

## Server (Express API)

- Build command: `npm run render-build` → install, `prisma generate`, `tsc`, `prisma migrate deploy`.
- Start command: `npm start` (`node dist/server.js`).
- Required env (set in host): `DATABASE_URL`, `JWT_SECRET` (identical to the client's), `FRONTEND_URL` (CORS), Stripe/PayPal keys and webhook secrets, Cloudinary, email (`RESEND_API_KEY` + `SMTP_FROM` with a Resend-verified domain), LLM provider keys as used. See `server/.env.example` and `docs/ENVIRONMENT.md`.
- Webhooks registered at the public URL: `/api/order/webhooks/stripe`, `/api/order/webhooks/paypal`.

## Client (Next.js on Vercel)

- Build: `npm run build`. Env: `NEXT_PUBLIC_API_URL` / `BACKEND_URL` pointing at the public API, `JWT_SECRET` (same as server, server-only — never `NEXT_PUBLIC_`), Sentry vars. See `client/.env.example`.
- Only `NEXT_PUBLIC_*` reaches the browser; none of those may be secret.
- The `vercel:*` skills (`vercel:deploy`, `vercel:env`, `vercel:status`, `vercel:deployments-cicd`) help when the Vercel CLI/connector is authorized.

## After deploying — smoke test

- `GET <api>/api/warm` responds.
- Register/login → access a protected page (cookies set, no redirect loop).
- Browse products → add to cart → checkout in **sandbox** mode through payment success.
- Admin: open `/super-admin`, product list loads.
- Sentry shows no new error spike.

## Rollback

- Client: promote the previous Vercel deployment.
- Server: redeploy the previous commit. Migrations are not auto-reverted — that is why they must be backward compatible. Never run `migrate reset` on production.

## Report

List what was deployed (commit), env vars added (names only), migrations applied, smoke results, and anything not checked.
