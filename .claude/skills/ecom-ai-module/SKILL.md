---
name: ecom-ai-module
description: How to work on the AI commerce module (assistant chat, recommendations, order support, lead capture, human handoff, sales agent, review analyzer, SEO generator, smart search, knowledge base) and on feature flags in this repo. Use when touching server/src/services/ai, aiRoutes, client assistant/sales-agent/recommendations components, docs/ai, or feature-flags.config.json.
---

# AI module and feature flags

## Read first

- `docs/ai/README.md` → start here
- `docs/ai/ARCHITECTURE.md` → request flow, intent routing, knowledge injection, auth model
- `docs/ai/FEATURE-TRACKER.md` → every AI feature with its endpoints, files, and status
- `docs/ai/LLM-PROVIDERS.md` → provider selection (`ai.llmProvider` in `client/feature-flags.config.json`)
- `server/src/config/featureFlags/README.md` → flag checklists

## Feature flags

- Single source: `client/feature-flags.config.json`. Server copy is synced by `npm run sync:feature-flags` (runs automatically in `dev` and `build`).
- UI-only flag → JSON + `isFeatureEnabled()` on the client. Do **not** add to server defaults.
- API/expensive flag → JSON + `SERVER_FLAG_DEFAULTS` in `server/src/config/featureFlags/defaults.ts` + guard with `requireFeatureFlag("x.y")` on the route or `isFeatureEnabled` in the service.
- Whole module → `{module}.enabled` + `registerFeatureModuleRoutes` in `server/src/server.ts`.
- Every new AI endpoint must be behind `requireModule("ai")` and its own feature flag, so it can be switched off without a deploy.

## LLM code rules

- Treat all LLM output as untrusted input: parse with zod / the existing parsers (`handoffParser`, `recommendationParser`, `leadCaptureParser`, `orderSupportParser`, `smartSearchIntentParser`) and fall back safely on parse failure.
- Never let the model decide prices, stock, order status, refunds, or user identity — look those up in the DB using the authenticated `req.user`.
- Never put secrets, other users' data, or raw tokens into prompts. Only include the current user's own orders/cart.
- Prompt construction lives in the prompt builder (`promptBuilder` tests exist); keep prompts deterministic and testable.
- Set timeouts and handle provider errors/rate limits; return a friendly fallback, report with `sentryTracker`.
- Do not render LLM text as HTML without sanitizing.
- Rate-limit or feature-flag anything that costs money per call.

## Tests

`server/src/services/ai/__tests__/` has one test per parser/service — mock the LLM provider and test parsing, fallbacks, and the business rules. Add a test for every new parser/intent. Do not call real LLM APIs in tests.

## Docs

When adding or changing an AI feature, update `docs/ai/FEATURE-TRACKER.md` (endpoint, files, flag, status) in the same change.

Then run `ecom-verify`.
