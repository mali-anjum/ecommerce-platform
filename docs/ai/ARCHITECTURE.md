# AI Module Architecture

How the AI commerce layer fits into the existing platform.

## System context

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js (client/)                       │
│  AppShell → ShoppingAssistantWidget                              │
│  Product page → trackProductView()                               │
│  Cart → sessionId on add-to-cart                                 │
│  Super-admin → AI Operations + analytics dashboards              │
└────────────────────────────┬────────────────────────────────────┘
                             │ cookies + /api/* proxies
┌────────────────────────────▼────────────────────────────────────┐
│                     Express (server/)                            │
│  /api/ai/*  /api/leads  /api/analytics/*                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   PostgreSQL            OpenAI API          Cloudinary
   (Prisma)              (optional)          (docs upload)
        │
   In-memory product index (warm on startup)
```

## Chat request flow

Every `POST /api/ai/chat` follows this pipeline:

```
1. Load session history     (AiChatSession / sessionMemoryService)
2. Open ticket?             → append user message, return handoff reply
3. Escalation check         → "talk to agent" OR failureCount >= 3
4. classifyIntent()         → FAQ | PRODUCT_SEARCH | ORDER_SUPPORT | LEAD | GENERAL_CHAT
5. Route to handler
6. Log AiConversationLog + AnalyticsEvent (CHAT)
7. Persist session turn     (user + assistant messages)
8. Update failureCount      (reset on success, increment on failure reply)
```

### Intent routing

| Classified intent | Handler | Legacy `intent` field |
|-------------------|---------|------------------------|
| `ORDER_SUPPORT` | `orderSupport.service.ts` | `order_support` |
| `LEAD` | `leadCapture.service.ts` | `lead_capture` |
| `PRODUCT_SEARCH` | `productRecommendations.ts` | `product_recommendation` |
| `FAQ` | OpenAI + FAQ/policy context | `general` |
| `GENERAL_CHAT` | OpenAI + full context | `general` |
| (handoff) | `handoff.service.ts` | `human_handoff` |

## Knowledge injection

`contextLoader.ts` assembles context for LLM paths:

- Active products (product index first, Prisma fallback)
- Public FAQs
- Store policies (`StorePolicySettings`)
- Active coupons
- Knowledge base documents (PDF text + manual entries)

`promptBuilder.ts` formats this into the system prompt.

## Product index (ADMIN-AI-003)

```
server startup → warmProductIndex()
                      │
product create/update/delete → scheduleProductIndexSync(id)
order fulfillment (stock)      → scheduleProductIndexSync(id)
featured products rebuild      → full rebuild
```

Storage: in-memory map in `productIndexStore.ts` (not Redis).

## Analytics & funnel

### Conversation log

Each chat → `AiConversationLog` (query, intent, userId).

On paid order → `markAiChatConversionsForUser` marks recent logs `convertedToOrder=true` (48h).

### Funnel events

| Stage | Event type | Where logged |
|-------|------------|--------------|
| Chat | `CHAT` | `aiController.postAiChat` |
| Product view | `PRODUCT_VIEW` | Client `trackProductView` → `/api/analytics/events` |
| Cart add | `CART_ADD` | `cartController.addToCart` |
| Order complete | `ORDER_COMPLETE` | `applyPurchaseFulfillment` |

Correlation key: `sessionId` (guest) or `userId` (logged in).

Dashboard aggregation: `fetchFunnelTrackingSummary` + `fetchAiMetricsSummary` → `/api/analytics/dashboard`.

## Session memory (CORE-AI-001)

- Client generates UUID → `sessionStorage` key `commerceSessionId`
- Server stores last 24 turns in `AiChatSession.messages`
- In-memory TTL cache avoids repeated DB reads
- Also tracks `failureCount` and `openTicketId`

## Human handoff (CORE-AI-003)

```
User: "talk to agent"
  → SupportTicket created (OPEN)
  → AiChatSession.openTicketId set
  → Further messages append to ticket (no AI loop)

Admin: /super-admin/ai/support-tickets
  → view thread, reply as agent, close ticket
```

## Auth model

| Surface | Auth |
|---------|------|
| Chat | Optional JWT (`optionalAuthenticateJwt`) — order support needs login |
| Leads POST | Public |
| Analytics events | Optional JWT |
| All `/api/ai/admin/*` | Super-admin JWT |
| Leads GET | Super-admin JWT |

## Extension points

| Future work | Hook |
|-------------|------|
| Streaming replies | `aiController.postAiChat` response |
| Redis product index | Replace `productIndexStore.ts` backend |
| Redis session memory | `sessionMemoryStore.ts` factory |
| LLM-based classifier | Replace rule engine in `intentClassifier.ts` |
| Agent realtime chat | WebSocket on `SupportTicket` |

## Dependencies between modules

```
assistant.service
  ├── intentClassifier
  ├── handoff.service → supportTicket.service
  ├── sessionMemory.service
  ├── orderSupport.service
  ├── leadCapture.service
  ├── productRecommendations → productIndex
  ├── contextLoader → productIndex, knowledge services
  └── promptBuilder → OpenAI

aiController
  ├── conversationLogService
  └── analyticsEventService
```
