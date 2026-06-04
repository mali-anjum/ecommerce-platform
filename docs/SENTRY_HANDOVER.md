# Sentry handover checklist

Production error monitoring uses **Sentry** with a shared `sentryTracker()` utility on the client and server. Unknown failures are normalized inside `sentryTracker()` before reporting.

## 1. Create Sentry projects

1. Sign up at [https://sentry.io](https://sentry.io).
2. Create two projects (recommended):
   - **Node/Express** → `server` DSN
   - **Next.js** → `client` DSN (or one DSN for both if you prefer a single project)
3. Copy each DSN into deployment env vars (see below).

## 2. Environment variables

### Server (`server/.env.production` or host env)

| Variable | Required | Notes |
|----------|----------|--------|
| `SENTRY_DSN` | Yes (staging/prod) | From Sentry project settings |
| `SENTRY_ENVIRONMENT` | Yes | `production` or `staging` |
| `SENTRY_RELEASE` | Recommended | Git SHA or deploy id |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional | Default `0.1` |
| `SENTRY_ENABLED` | Optional | Set `true` to test Sentry in local dev |

### Client (`client/.env.production` or Vercel env)

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes (staging/prod) | Browser + must be public |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Yes | Match server environment name |
| `SENTRY_RELEASE` | Recommended | Same value as server release |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Optional | Source map upload on build |

**Local development:** Sentry is **off** when `NODE_ENV=development` and `SENTRY_ENABLED` is not `true`.

## 3. What is wired automatically

| Layer | Hook |
|-------|------|
| Express | `errorHandler` → `sentryTracker` |
| Express | `unhandledRejection` / `uncaughtException` |
| Express | Feature module bootstrap failures |
| Next.js | `instrumentation.ts` + `onRequestError` |
| Next.js | `app/error.tsx`, `app/global-error.tsx` |
| BFF routes | `sentryTracker()` in `app/api/**/route.ts` catch blocks |
| Axios | `http`, `adminApi`, auth store (5xx) |
| Proxies | `proxyWithAuth` failures |

## 4. Using `sentryTracker` in new code

```ts
import { sentryTracker } from "@/lib/monitoring"; // client
// import { sentryTracker } from "../lib/monitoring"; // server

try {
  // ...
} catch (error) {
  sentryTracker(error, { source: "checkout", route: "/checkout" });
  throw error;
}
```

**Reporting:** every call to `sentryTracker()` sends an event when Sentry is enabled (staging/production). Use Sentry issue filters/alerts to tune noise in the dashboard.

## 5. Pre-handover verification (1–2 weeks in staging)

- [ ] Trigger a test error on server (`throw new Error("sentry-test-server")` in a dev-only route) and confirm it appears in Sentry.
- [ ] Trigger a test error on client (temporary button calling `throw new Error("sentry-test-client")`) and confirm the event.
- [ ] Complete a checkout path in staging; confirm no unexpected flood of 4xx events.
- [ ] Configure Sentry alerts: **New issue** and **Regression** for `production`.
- [ ] Add team email/Slack notification channel.
- [ ] Set `SENTRY_RELEASE` in CI/CD for each deploy.
- [ ] (Optional) Enable Session Replay in Sentry with strict PII masking for checkout.

## 6. Security

- Never send passwords, tokens, or card data in `extra` context.
- `beforeSend` scrubs common sensitive field names.
- Use Sentry’s data scrubbing rules in the project settings as a second layer.

## 7. Files reference

- Server: `server/src/lib/monitoring/`
- Client: `client/src/lib/monitoring/`
- Next config: `client/sentry.client.config.ts`, `sentry.server.config.ts`, `instrumentation.ts`
