# AI Commerce Module — Documentation

This folder documents the **AI Sales + Support Automation System** built on top of the ecommerce platform. It spans both `client/` and `server/` — that is why docs live at the repo root under `docs/ai/` rather than inside a single package.

## Start here

| Document | Purpose |
|----------|---------|
| [FEATURE-TRACKER.md](./FEATURE-TRACKER.md) | Ticket-by-ticket status, APIs, models, and file map |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Request flow, intent routing, analytics, and data relationships |

## What this module is

Not a standalone chatbot. It is an **AI commerce operating layer**:

- **Sales intelligence** — product recommendations from catalog + budget intent
- **Support automation** — order tracking, policies, FAQs
- **Lead generation** — capture buying intent into CRM
- **Admin intelligence** — conversation analytics, funnel tracking, human handoff

## Quick orientation

```
Storefront                         Admin (super-admin)
──────────                         ───────────────────
ShoppingAssistantWidget            AI Operations sidebar
  → POST /api/ai/chat                → FAQ, Documents, Analytics, Support tickets
  → sessionId (sessionStorage)       → Leads dashboard
  → product/order cards in chat      → Main analytics overview (aiMetrics + funnel)
```

## Prerequisites to run AI features

1. Apply Prisma migrations (see [FEATURE-TRACKER.md](./FEATURE-TRACKER.md#migrations)).
2. Set `OPENAI_API_KEY` in server env for general/FAQ LLM replies (other flows work without it).
3. Run `server` on `/api/*` and `client` with `NEXT_PUBLIC_API_URL` pointing at the API origin.

## Verification

```bash
cd server && npm test -- --testPathPattern="services/ai|funnelAnalytics|conversationLog|aiMetrics"
cd server && npm run build
```

## Related project docs

- [CLAUDE.md](../../CLAUDE.md) — agent rules and stack overview
- [README.md](../../README.md) — full platform setup
