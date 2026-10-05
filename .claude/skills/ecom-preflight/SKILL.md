---
name: ecom-preflight
description: Mandatory first step before writing or changing ANY code in this ecommerce repo (client/ Next.js or server/ Express). Classifies the change, loads the right project and vendor skills, sets boundaries, and plans tests before editing. Use at the start of every feature, bugfix, refactor, upgrade, or review task.
---

# Preflight — run before touching code

This is the gate that keeps AI-written code production quality. Do every step, in order, before the first edit. Keep it short for tiny changes, but never skip it.

## 1. Understand before editing

- Re-read the task. If a requirement is genuinely ambiguous and changes what you build, ask; otherwise pick the conventional option and state it.
- Read the files you will change **and** one sibling that already does the same thing (e.g. another route/controller/store). Copy its conventions; do not invent new ones.
- Check `git status` so you do not overwrite or mix in the user's unrelated uncommitted work.

## 2. Classify the change and load skills

Load every row that applies (use the Skill tool):

| Change touches | Project skill | Vendor skill(s) to also consult |
|---|---|---|
| Express route/controller/service/validation | `ecom-backend-feature` | `prisma-client-api` for queries |
| Next.js page/component/store/BFF route | `ecom-frontend-feature` | `vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines` (UI) |
| `schema.prisma`, migrations, seed | `ecom-prisma-change` | `prisma-cli`, `prisma-client-api`, `prisma-upgrade-v7` |
| Checkout, Stripe, PayPal, webhooks, orders/payments | `ecom-payments` | `stripe-best-practices`, `upgrade-stripe` (version bumps) |
| Auth, cookies, JWT, roles, secrets, uploads, user input | `ecom-security-review` | — |
| AI module, LLM, feature flags | `ecom-ai-module` | — |
| Sentry setup or production errors | — | `sentry-nextjs-sdk`, `sentry-fix-issues` |
| **Always, before claiming done** | `ecom-verify` | — |

## 3. Hard boundaries (never cross without explicit user approval)

- Never read out, log, print, commit, or paste secrets. Never edit `.env*` files except `.env.example`.
- Never change an existing API contract (path, method, request shape, response `{ success, message, data, statusCode }`, status codes) unless the task asks for it.
- Never run destructive commands: `prisma migrate reset`, `db push --force-reset`, `git push --force`, `git reset --hard`, dropping tables, deleting user data.
- Never weaken auth: no skipping `authenticateJwt`, no trusting client-sent `userId`/`role`/price, no disabling webhook signature checks.
- Never add `any`, `// @ts-ignore`, `eslint-disable`, or `.skip`/`.only` in tests to make something pass. Fix the cause.
- Never add a dependency when the repo already has one that does the job (zod, axios, zustand, jose, pino, lodash).
- Keep the change focused: no drive-by refactors, renames, or reformatting outside the task.

## 4. Plan the tests first

Write down (to yourself) before coding:
- Which existing tests cover this area (`**/__tests__/**/*.test.ts` in `server/src` and `client/src`).
- Which new tests you will add: happy path, validation failure, unauthenticated (401), wrong role (403), not found (404), and the edge cases specific to the change.
- What can only be checked manually (payment, email, upload) — you must report these as unverified.

## 5. Then implement, then run `ecom-verify`

Do not report success until `ecom-verify` has run and its report format is used.
