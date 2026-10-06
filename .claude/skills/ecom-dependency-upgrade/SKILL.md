---
name: ecom-dependency-upgrade
description: Safe, memory-friendly workflow for updating npm packages in client/ and server/ — patch/minor batches, one major upgrade at a time with changelog review, deprecation fixes, audit, and verification. Use when updating packages, fixing deprecation warnings, resolving npm audit findings, or upgrading Next.js, React, Prisma, Express, Stripe, Sentry, jose, ESLint, or TypeScript.
---

# Dependency upgrades

## 1. Survey

```bash
cd server && npm outdated
cd client && npm outdated
cd server && npm audit --omit=dev
cd client && npm audit --omit=dev
```

Split into: **patch/minor** (safe batch) and **major** (one at a time).

## 2. Patch/minor batch

```bash
npm update            # within declared ranges
```
Then run the package's checks (step 5). Commit separately from majors.

## 3. Majors — one package per change

- Read the official migration guide/changelog first. Use the matching skill when one exists:
  - Prisma → `prisma-upgrade-v7`, `prisma-cli`
  - Stripe → `upgrade-stripe`, `stripe-best-practices`
  - Next.js → `vercel:next-upgrade`, `vercel:nextjs`
  - Sentry → `sentry-nextjs-sdk`
- Install the exact major: `npm install <pkg>@<major>`; peers together (e.g. `react` + `react-dom` + `@types/react`).
- Fix every type error and deprecation the upgrade causes. Search for removed APIs with grep rather than waiting for runtime failures.
- Never use `npm audit fix --force` (it jumps majors blindly) and never `--legacy-peer-deps` to hide a real conflict without saying so.

## 4. Deprecations

- Treat deprecation warnings in build/test output as work items. Fix the call site using the replacement API from the package docs.
- Next.js 16 specifics already applied here: `middleware.ts` → `src/proxy.ts`; async `params`/`cookies()`; `instrumentation-client.ts` for Sentry client init.

## 5. Verify (memory-safe, one at a time)

```bash
cd server && npm run build && npx jest --runInBand
cd client && npx tsc --noEmit && npx jest --runInBand
cd client && NODE_OPTIONS=--max-old-space-size=3072 npm run build
```
Plus the runtime flows the package affects (payments for Stripe/PayPal, uploads for Cloudinary, auth for jose/jsonwebtoken).

## 6. Commit

Commit `package.json` **and** `package-lock.json` together. Message lists each major with old → new version. Report anything deferred (majors not done) and why.
