# AI Feature Tracker

All tickets from the AI Commerce epic. **Status: implemented in codebase** (as of 2026-05-31).

Legend: ✅ Done · ⚠️ Partial (documented gap) · ➖ Optional / not built

---

## EPIC 1 — AI Shopping Assistant

### AI-001 — FAQ + Product Knowledge Assistant ✅

**Goal:** Answer policy, FAQ, and product questions using catalog + settings.

| Area | Implementation |
|------|----------------|
| Orchestration | `server/src/services/ai/assistant.service.ts` |
| Prompt / context | `promptBuilder.ts`, `contextLoader.ts` |
| Endpoint | `POST /api/ai/chat` |
| Client widget | `client/src/components/assistant/ShoppingAssistantWidget.tsx` |
| Proxy | `client/src/app/api/ai/chat/route.ts` |
| Mount | `client/src/components/common/organisms/AppShell.tsx` |
| Data | `Product`, `FaqItem`, `StorePolicySettings`, `KnowledgeBase`, coupons |

**Env:** `OPENAI_API_KEY` required for LLM-backed general/FAQ replies.

**Optional:** Streaming responses ➖ not implemented (marked optional in ticket).

---

### AI-002 — Product Recommendation Engine ✅

**Goal:** Suggest products by budget, category, and intent.

| Area | Implementation |
|------|----------------|
| Service | `server/src/services/ai/productRecommendations.ts` |
| Parser | `recommendationParser.ts`, `recommendationReply.ts` |
| Response shape | `{ intent: "product_recommendation", products: [...] }` |
| UI | `client/src/components/assistant/AssistantProductCards.tsx` |
| Tests | `__tests__/productRecommendations.test.ts`, `recommendationParser.test.ts` |

---

### AI-003 — Order Support Bot ✅

**Goal:** Track orders, delivery, cancel requests for authenticated users.

| Area | Implementation |
|------|----------------|
| Service | `server/src/services/ai/orderSupport.service.ts` |
| Parser | `orderSupportParser.ts` |
| Auth | `optionalAuthenticateJwt` on chat route |
| UI | `client/src/components/assistant/AssistantOrderCards.tsx` |
| Intents | `track_order`, `delivery_status`, `cancel_request`, `order_list` |

---

### AI-004 — Lead Capture System ✅

**Goal:** Detect buying intent and collect email / phone / requirement.

| Area | Implementation |
|------|----------------|
| Model | `Lead` (`LeadSource`: `AI` \| `MANUAL`) |
| Service | `leadCapture.service.ts`, `leadCaptureParser.ts` |
| Public API | `POST /api/leads` |
| Admin API | `GET /api/leads?source=` |
| Admin UI | `client/src/app/(admin)/super-admin/leads/page.tsx` |
| Store | `client/src/components/super-admin/state/useLeadsStore.ts` |

**Triggers:** e.g. “I want to buy”, “contact me”, “pricing?”

---

## EPIC 2 — AI Operations Panel (Admin)

### ADMIN-AI-001 — FAQ Management ✅

| Area | Implementation |
|------|----------------|
| Model | `FaqItem` (question, answer, href, sortOrder, isActive) |
| Admin UI | `/super-admin/ai/faq` → `FaqManagementPanel.tsx` |
| API | `GET/POST/PATCH/DELETE /api/ai/admin/faq` |

---

### ADMIN-AI-002 — Upload Knowledge Base (PDF / Docs) ✅

| Area | Implementation |
|------|----------------|
| Model | `KnowledgeBase` (`sourceType`: `PDF` \| `MANUAL`) |
| PDF extract | `pdf-parse` via `services/knowledge/pdfTextExtractor.ts` |
| Upload | `documentUploadMiddleware.ts` → Cloudinary or `server/uploads/knowledge-base/` |
| Admin UI | `/super-admin/ai/knowledge-base` → `KnowledgeBasePanel.tsx` |
| AI context | Injected in `contextLoader.ts` / `promptBuilder.ts` |

---

### ADMIN-AI-003 — Product Data Sync for AI ⚠️

| Area | Implementation |
|------|----------------|
| Index | `server/src/services/ai/productIndex/` (in-memory) |
| Warmup | `warmProductIndex()` in `server/src/server.ts` |
| Sync hooks | `productController`, `settingsController`, `order/fulfillment.ts` |
| Redis | ➖ Not implemented; in-memory index only (ticket allowed either) |

---

### ADMIN-AI-004 — Conversation Analytics Dashboard ✅

| Area | Implementation |
|------|----------------|
| Model | `AiConversationLog` |
| Logging | `conversationLogService.ts` on each chat |
| Conversion | `convertedToOrder` set in `applyPurchaseFulfillment` (48h window) |
| Admin UI | `/super-admin/ai/analytics` → `AiAnalyticsPanel.tsx` |
| API | `GET /api/ai/admin/analytics?period=7d\|30d\|90d` |

**Metrics:** most asked questions, chat→order conversion, AI leads, top product queries, intent breakdown.

---

## EPIC 3 — Admin Analytics Expansion

### ANALYTICS-001 — AI Metrics Integration ✅

| Area | Implementation |
|------|----------------|
| API | `GET /api/analytics/dashboard` includes `aiMetrics` |
| Fields | `chatUsageCount`, `conversionRate`, `topIntents`, period deltas |
| UI | KPI cards on `/super-admin` (analytics overview) |

---

### ANALYTICS-002 — Funnel Tracking ✅

| Area | Implementation |
|------|----------------|
| Model | `AnalyticsEvent` (`CHAT`, `PRODUCT_VIEW`, `CART_ADD`, `ORDER_COMPLETE`) |
| Service | `analyticsEventService.ts`, `funnelAnalyticsService.ts` |
| Public API | `POST /api/analytics/events` |
| Hooks | Chat controller, cart add, product page view, order fulfillment |
| Dashboard | `funnelTracking` on analytics dashboard + `FunnelTrackingPanel` |
| Session correlation | `sessionId` in `sessionStorage` (`client/src/lib/analytics/sessionId.ts`) |

---

## EPIC 4 — Conversation Engine (Core)

### CORE-AI-001 — Session Memory System ✅

| Area | Implementation |
|------|----------------|
| Model | `AiChatSession` (messages JSON, failureCount, openTicketId) |
| Store | `sessionMemory/sessionMemoryStore.ts` (DB + in-memory TTL cache) |
| Service | `sessionMemory/sessionMemoryService.ts` |
| Client | `sessionId` sent on every chat from widget |
| Redis | ➖ DB fallback only (no Redis dependency) |

---

### CORE-AI-002 — Intent Classifier Layer ✅

| Area | Implementation |
|------|----------------|
| Classifier | `intentClassifier.ts` |
| Intents | `FAQ`, `PRODUCT_SEARCH`, `ORDER_SUPPORT`, `LEAD`, `GENERAL_CHAT` |
| Routing | `assistant.service.ts` switch after handoff / open-ticket checks |
| Response | `classifiedIntent` on chat result + analytics metadata |
| Tests | `__tests__/intentClassifier.test.ts` |

---

### CORE-AI-003 — Human Handoff System ✅

| Area | Implementation |
|------|----------------|
| Model | `SupportTicket` (`status`: `OPEN` \| `CLOSED`, messages JSON) |
| Triggers | “talk to agent” phrases; 3+ failed replies per session |
| Services | `handoff.service.ts`, `supportTicket.service.ts`, `handoffParser.ts` |
| Admin API | `GET /api/ai/admin/support-tickets`, `PATCH .../close`, `POST .../reply` |
| Admin UI | `/super-admin/ai/support-tickets` |

---

## Prisma models (AI module)

| Model | Purpose |
|-------|---------|
| `FaqItem` | Admin-editable FAQ |
| `StorePolicySettings` | Shipping / returns / support email |
| `KnowledgeBase` | PDF/manual docs for AI context |
| `Lead` | CRM leads (AI or manual) |
| `AiConversationLog` | Per-message analytics |
| `AnalyticsEvent` | Funnel events |
| `AiChatSession` | Session memory + failure/ticket state |
| `SupportTicket` | Human escalation |

---

## Migrations

AI-related migrations under `server/src/prisma/migrations/`:

| Migration | Adds |
|-----------|------|
| `20260531140000_ai_faq_and_store_policies` | FAQ + store policies |
| `20260531180000_add_leads` | Lead table |
| `20260531200000_add_knowledge_base` | KnowledgeBase |
| `20260531210000_add_ai_conversation_log` | AiConversationLog |
| `20260531220000_analytics_events_and_ai_sessions` | AnalyticsEvent, AiChatSession |
| `20260531230000_support_tickets_and_intent_handoff` | SupportTicket, session extensions |

Apply:

```bash
cd server && npm run prisma:migrate:dev
```

---

## API reference (AI module)

### Public / storefront

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/ai/chat` | Optional JWT | Main assistant |
| GET | `/api/ai/faq` | None | Public FAQ list |
| GET | `/api/ai/policies` | None | Store policies |
| POST | `/api/leads` | None | Create lead |
| POST | `/api/analytics/events` | Optional JWT | Funnel event |

### Super-admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ai/admin/faq` | List FAQ |
| POST/PATCH/DELETE | `/api/ai/admin/faq` | FAQ CRUD |
| GET/POST/PATCH/DELETE | `/api/ai/admin/knowledge-base` | Documents |
| POST | `/api/ai/admin/knowledge-base/upload` | PDF upload |
| PUT | `/api/ai/admin/policies` | Store policies |
| GET | `/api/ai/admin/analytics` | AI conversation dashboard |
| GET | `/api/ai/admin/support-tickets` | Handoff tickets |
| PATCH | `/api/ai/admin/support-tickets/:id/close` | Close ticket |
| POST | `/api/ai/admin/support-tickets/:id/reply` | Agent reply |
| GET | `/api/leads` | Leads list |
| GET | `/api/analytics/dashboard` | Commerce + `aiMetrics` + `funnelTracking` |

---

## Admin UI routes

| Path | Feature |
|------|---------|
| `/super-admin/ai/faq` | FAQ management |
| `/super-admin/ai/knowledge-base` | Document upload |
| `/super-admin/ai/analytics` | Conversation analytics |
| `/super-admin/ai/support-tickets` | Human handoff queue |
| `/super-admin/leads` | CRM leads |
| `/super-admin/knowledge` | Store policies (links to FAQ page) |
| `/super-admin` | Overview with AI KPIs + funnel panel |

Sidebar: **AI Operations** in `SuperAdminSidebar.tsx`.

---

## Key file map

### Server (`server/src/`)

```
services/ai/
  assistant.service.ts      # Main orchestrator
  intentClassifier.ts       # CORE-AI-002
  handoff.service.ts        # CORE-AI-003
  supportTicket.service.ts
  conversationLogService.ts
  aiAnalyticsService.ts
  productRecommendations.ts
  orderSupport.service.ts
  leadCapture.service.ts
  promptBuilder.ts
  contextLoader.ts
  sessionMemory/
  productIndex/
controllers/
  aiController.ts
  aiAnalyticsController.ts
  supportTicketController.ts
  knowledgeBaseController.ts
  leadController.ts
  analyticsEventController.ts
routes/
  aiRoutes.ts
  leadRoutes.ts
  analyticsRoutes.ts
```

### Client (`client/src/`)

```
components/assistant/
  ShoppingAssistantWidget.tsx
  AssistantProductCards.tsx
  AssistantOrderCards.tsx
components/super-admin/ai/organisms/
  FaqManagementPanel.tsx
  KnowledgeBasePanel.tsx
  AiAnalyticsPanel.tsx
lib/analytics/
  sessionId.ts
  trackEvent.ts
lib/assistant/types.ts
app/api/ai/chat/route.ts
app/api/analytics/events/route.ts
app/api/leads/route.ts
```

---

## Environment variables

| Variable | Required for | Package |
|----------|--------------|---------|
| `OPENAI_API_KEY` | General/FAQ LLM chat | server |
| `OPENAI_MODEL` | Model override (optional) | server |
| `NEXT_PUBLIC_API_URL` | Client → API | client |
| Cloudinary vars | PDF/doc upload to cloud | server |

See `server/src/config/ai.ts` for AI config.

---

## Test coverage

```bash
cd server && npm test -- --testPathPattern="services/ai|funnelAnalytics|conversationLog|aiMetrics"
```

Covers: parsers, recommendations, order support, lead capture, intent classifier, handoff, session memory, product index, analytics utils.
