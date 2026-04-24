# CLAUDE.md

This file defines the project laws for AI agents working in this repository.

## Core Laws

1. Test harder, not less.
   - AI can write code faster, so verification must be stricter.
   - Never merge changes that have not been verified.
   - If a feature or bugfix has no test coverage, add coverage as part of the change whenever practical.
2. Do not claim success without evidence.
   - Run relevant checks and report what was run.
   - If a check cannot be run locally, explicitly say what remains unverified.
3. Protect secrets.
   - Never commit real credentials or tokens.
   - Keep `.env.local` and production secrets out of git.

## Project Stack

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Radix UI, Zustand
- Backend: Express, TypeScript, Prisma, PostgreSQL
- Integrations: Stripe, PayPal, Cloudinary, Nodemailer
- Shared validation/auth utilities: zod, jose, jsonwebtoken, cookie-based auth flow

## Development Rules

- Keep frontend code in `client/` and API/backend code in `server/`.
- Preserve existing API contracts unless the task explicitly includes an API change.
- Prefer small, focused changes over broad refactors.
- Follow existing naming and file structure conventions in each package.
- Use TypeScript types and zod schemas to enforce contracts at boundaries.

## Codebase Context (Read Before Editing)

- `server/src/server.ts` is the app composition root:
  - Loads env first (`import "./config/loadEnv"`), then registers middleware/routes.
  - Exposes API under `/api/*`.
  - Uses centralized error middleware and graceful Prisma shutdown.
- `server/src/config/loadEnv.ts` is the source of truth for env-file loading strategy.
  - Do not duplicate dotenv loading logic across random files.
  - Prefer reading validated env vars in config modules.
- `server/src/lib/prisma.ts` uses a global singleton pattern in development.
  - Keep this pattern to avoid multiple clients/pools during hot reload.
- `client/src/proxy.ts` handles auth and role redirects at the edge.
  - Keep logic explicit, deterministic, and defensive on invalid/expired tokens.

## Writing Style to Follow

- Use TypeScript everywhere; avoid `any` unless unavoidable and justified.
- Prefer clear and explicit code over clever shortcuts.
- Keep imports grouped and minimal; do not leave unused imports.
- Preserve semicolons, current quote style, and existing module structure in each file.
- Keep functions focused; extract tiny helpers only when it improves readability/testability.
- Add concise comments only for non-obvious decisions (not for trivial assignments).
- Fail fast on invalid required configuration in server startup/config modules.
- Avoid silent fallbacks for required secrets/keys in production code.

## Production-Ready Standards

- Security:
  - Validate required env vars before use.
  - Never log sensitive values (tokens, secrets, private keys).
  - Keep cookie/JWT/auth behavior strict and explicit.
- Reliability:
  - Prefer deterministic startup failure over latent runtime failure for missing critical config.
  - Reuse connection singletons for DB and external clients when appropriate.
- Maintainability:
  - Keep route/controller/service boundaries clear.
  - Avoid mixing unrelated concerns in one file.
- Performance:
  - Avoid repeated expensive initialization in request paths.
  - Keep middleware and auth checks lightweight and predictable.

## Verification Checklist (Required)

For every non-trivial change, run the closest relevant checks and include results:

- Frontend:
  - `cd client && npm run lint`
  - `cd client && npm run build` (for route/type/build verification on substantial UI changes)
- Backend:
  - `cd server && npm run build`
  - Run impacted runtime flows manually (auth, cart, order, payment, media upload), especially when no automated tests exist.
- Prisma/Data changes:
  - `cd server && npm run prisma:generate`
  - Run the relevant migration command when schema changes are included.

If something is skipped, state why and what risk remains.

## Change Reporting Format

When finishing work, include:

1. What changed (files and behavior)
2. What was verified (exact commands/checks)
3. What is still unverified (if anything)
