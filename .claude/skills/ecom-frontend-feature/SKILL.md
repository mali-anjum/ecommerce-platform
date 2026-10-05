---
name: ecom-frontend-feature
description: How to build or change UI in client/ the way this repo does it — Next.js 16 App Router route groups, atomic component folders, Zustand stores, BFF API routes that proxy to Express with auth cookies, proxy.ts role guard, feature flags, Sentry, and Jest tests. Use for any work in client/src (pages, components, stores, hooks, app/api routes).
---

# Frontend feature (client/)

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI, Zustand, axios, zod, Jest + ts-jest.

## Where things go

| What | Where |
|---|---|
| Pages | `src/app/(storefront)/…`, `src/app/(admin)/seller/…`, `src/app/(admin)/super-admin/…`, `src/app/(common)/…` |
| BFF API routes (browser → Next → Express) | `src/app/api/<area>/…/route.ts` |
| Feature components | `src/components/<area>/<feature>/{atoms,molecules,organisms,screen,hooks,state,types,utils}` with an `index.ts` barrel |
| Shared UI primitives | `src/components/ui/` (Radix-based) |
| Backend URLs | `src/lib/routes/api.ts` (`API_ROUTES`) — no hard-coded URLs |
| Proxy helpers | `src/lib/api/proxyWithAuth.ts`, `adminApiClient.ts` |
| Edge auth / role redirects | `src/proxy.ts` (Next 16 name for middleware) |
| Feature flags | `isFeatureEnabled()` from `@/lib/feature-flags`, keys in `client/feature-flags.config.json` |

Pick the folder by copying the nearest existing feature (e.g. `components/storefront/cart/`).

## BFF route rules

- Prefer `proxyWithAuth(request, { method, backendPath, body })` — it handles missing backend URL, missing token (401), 10s timeout (504), and Sentry.
- Pass through the backend status and body; do not reshape the `{ success, message, data, statusCode }` contract.
- Validate incoming body/params with zod before forwarding; `encodeURIComponent` path params.
- Dynamic route params are async in Next 16: `{ params }: { params: Promise<{ id: string }> }` then `await params`.
- Never log cookies, tokens, or full bodies. Use `sentryTracker(error, { source: "api-route", route, method })`.

## Components and state

- Server Components by default; add `"use client"` only for interactivity/state/effects.
- Zustand store per feature in `state/`, typed interface, async actions set `isLoading`/`error`, and errors go to `sentryTracker`. Persist only non-sensitive UI state.
- Do not derive state in `useEffect` + `setState`; compute during render or with `useMemo`. Do not call `setState` synchronously inside effects (lint rule `react-hooks/set-state-in-effect`).
- No `any`. Type props in `types/` or next to the component.
- Use `next/image` for images and `next/link` for navigation.
- Accessibility: real `<button>`/`<a>`, labels for inputs, `alt` text, keyboard reachable, visible focus. Loading and empty states for every async view.
- Never trust the client for price, role, or ownership — the server decides.

## Auth on the client

- Tokens live in httpOnly cookies; never read/store them in JS, localStorage, or Zustand.
- `src/proxy.ts` must stay deterministic and fail closed on invalid/expired tokens. If you change role routing, add a case to `src/__tests__/proxy.test.ts`.

## Tests (required for logic)

- `src/**/__tests__/*.test.ts` (node environment; no DOM testing library installed).
- Test pure logic you add: utils, store actions (mock axios), BFF route handlers (mock `fetch`, build a `NextRequest`). See `src/app/api/auth/login/__tests__/route.test.ts`.

## Skills to consult

`vercel-react-best-practices` (performance, waterfalls, bundle size), `vercel-composition-patterns` (component APIs), `web-design-guidelines` (UI/a11y review).

Then run `ecom-verify`.
