# AI Commerce Priorities 1–6 — What They Do

This page explains **all six AI priorities** in simple words, then lists how to turn them on and verify them in your project.

All six run on the **server** (Express + Prisma). The Next.js shop and admin pages only call the API — they do not run the AI models themselves.

---

## Quick overview

| # | Name | In one sentence |
|---|------|-----------------|
| **P1** | AI Sales Agent | Watches how visitors browse and can show offers or capture leads when they look ready to buy. |
| **P2** | Setup recommendations | On a product page, suggests extra items that “complete the setup” (e.g. camera + tripod). |
| **P3** | Customer support chat | Floating assistant: FAQs, product help, order tracking, and optional AI replies. |
| **P4** | Review analyzer | Reads customer reviews and groups themes (quality, shipping, etc.) for the admin dashboard. |
| **P5** | SEO generator | Writes product title, meta description, keywords, and description for search engines. |
| **P6** | Smart search | Understands natural language search (budget, use case) and ranks products better. |

---

## P1 — AI Sales & Lead Generation

**What it does for your business**

- Tracks what a visitor looks at (products, categories, time on site).
- Scores how “ready to buy” they seem.
- Can show a **sales offer** or message on the storefront when intent is high.
- Can queue **follow-up emails** (if SMTP is configured).
- Admins see a **Sales Agent** dashboard: signals, offers, and performance.

**Who uses it**

- **Shoppers:** see timely offers while browsing (when the feature is on).
- **Super admin:** `/super-admin/ai/sales-agent` to review and manage the agent.

**Feature flag:** `ai.salesAgent` (and usually `ai.enabled`)

**Main code:** `server/src/services/ai/sales/`

**API examples:** `/api/ai/sales/*`, `/api/ai/admin/sales-agent`

**Needs AI (LLM)?** Sometimes — buying-intent summaries can use your configured provider (`openai`, `gemini`, or `llama`). Scoring and rules work without it.

**Optional env:** SMTP settings if you want the email queue to send messages.

---

## P2 — AI Product / Setup Recommendations

**What it does for your business**

- On a **product detail page**, shows a block like “Complete your setup.”
- Looks at the product you are viewing (and optionally what you recently viewed).
- Suggests **related accessories** in other categories (not the same product again).
- Example: viewing a DSLR → tripod, memory card, camera bag.

**Who uses it**

- **Shoppers:** product page → **AI Recommended Setup** section.
- No separate admin page required; it uses your live product catalog.

**Feature flag:** `ai.productRecommendations`

**Main code:** `server/src/services/ai/recommendations/` (e.g. `SetupRecommendationService`)

**API:** `GET /api/ai/recommendations/setup?productId=...`

**Needs AI (LLM)?** Optional — rule-based suggestions work; LLM improves titles and category ideas when configured.

---

## P3 — AI Customer Support

**What it does for your business**

- **Shopping assistant widget** on the store (chat bubble).
- Answers **FAQs** and store policies using your FAQ, knowledge base, and product data.
- Helps with **orders**: “Where is my order?”, delivery status, cancel requests (logged-in user or guest with order id + email).
- Can suggest **products** when the shopper asks for recommendations in chat.
- Can **capture leads** when someone wants to buy or be contacted.
- Can **hand off to a human** after certain phrases or repeated failed replies.

**Who uses it**

- **Shoppers:** `ShoppingAssistantWidget` on the storefront.
- **Super admin:** FAQ, knowledge base, support tickets, conversation analytics (related AI ops pages).

**Feature flags:** `ai.chat`, `ai.orderSupport` (plus `ai.enabled`, widget flag `ai.assistant.widget` on client)

**Main code:** `AssistantService`, `GeneralChatService`, `OrderSupportService`, intent classifier

**API:** `POST /api/ai/chat`

**Needs AI (LLM)?**

- **Order support** (database lookups): works **without** an API key.
- **FAQ / general chat**: needs the active LLM provider configured (see [LLM-PROVIDERS.md](./LLM-PROVIDERS.md)).

---

## P4 — AI Review Analyzer

**What it does for your business**

- Customers can **submit reviews** on products (rating + text).
- The system **classifies** each review into themes (e.g. build quality, shipping, value) and sentiment (positive / neutral / negative).
- **Super admin** gets a report: top complaints, trends, and a short narrative summary across many reviews.

**Who uses it**

- **Shoppers:** Reviews tab on the product page; submit via storefront API.
- **Super admin:** `/super-admin/ai/review-analyzer`

**Feature flag:** `ai.reviewAnalyzer`

**Main code:** `server/src/services/ai/reviews/` (`ReviewThemeClassifier`, `ReviewAnalyzerService`)

**API:** `GET/POST /api/ai/admin/review-analyzer`, `GET/POST /api/reviews/product/:productId`

**Database:** `ProductReview` model (migration `20260604200000_product_reviews_analyzer`)

**Needs AI (LLM)?** Optional — keyword rules always run; LLM improves batch classification when configured.

---

## P5 — AI SEO Content Generator

**What it does for your business**

- Admin enters a product name (and optional category, brand, tone).
- AI drafts **SEO title**, **meta description**, **keywords**, and a **product description**.
- You can **apply** the draft to the product form or save fields on the product.
- The live storefront can use those fields in page metadata for Google and social previews.

**Who uses it**

- **Super admin / seller:** **Add Product** or **Edit Product** → Step 3 **SEO & discovery**
- AI **Generate with AI** button appears when `ai.seoGenerator` is enabled

**Feature flag:** `ai.seoGenerator` (controls inline AI button only; manual SEO fields always available on the form)

**Main code:** `ProductFormSeoSection`, `server/src/services/ai/seo/SeoContentGeneratorService.ts`

**API:** `POST /api/ai/admin/seo-generator` (called from the product form, not a separate admin page)

**Database:** Product fields `seoTitle`, `metaDescription`, `seoKeywords` (migration `20260604210000_product_seo_fields`)

**Needs AI (LLM)?** Optional — rule-based fallback generates basic copy if no API key; LLM gives richer copy when configured.

---

## P6 — AI Smart Search

**What it does for your business**

- Shoppers search in **normal language**, not only exact product names.
- Examples: “wireless mouse under $50 for FPS games” → understands budget, features, and use case.
- Results are **ranked** for relevance; the products page can show a short **AI intent banner** explaining what was understood.

**Who uses it**

- **Shoppers:** header search → products listing with `smart=1` (e.g. `/products?search=...&smart=1`).

**Feature flag:** `ai.smartSearch`

**Main code:** `server/src/services/ai/search/` (`SmartSearchIntentParser`, `SmartSearchService`)

**API:** `POST /api/ai/search`

**Needs AI (LLM)?** Optional — rule-based parsing works; LLM refines intent when configured.

---

## How priorities fit together

```text
Visitor on store
    │
    ├─ P6 Smart search ─────────────► finds products from natural language
    ├─ P2 Setup block on product ───► suggests accessories
    ├─ P1 Sales agent ──────────────► scores intent, may show offer
    └─ P3 Chat widget ──────────────► FAQ, orders, recommendations, leads

Admin (super-admin)
    ├─ P1 Sales agent dashboard
    ├─ P4 Review analyzer
    ├─ P5 SEO generator
    └─ P3-related: FAQ, knowledge base, tickets, analytics
```

They share the same **product index** and **feature flags**. Turning a flag off hides that feature without deleting code.

---

## Feature flags (`client/feature-flags.config.json`)

| Flag | Priority | What it controls |
|------|----------|------------------|
| `ai.enabled` | All | Master switch for AI module |
| `ai.salesAgent` | P1 | Sales signals and offers |
| `ai.productRecommendations` | P2 | Setup recommendations on product page |
| `ai.chat` | P3 | Assistant chat (FAQ, general) |
| `ai.orderSupport` | P3 | Order tracking in chat |
| `ai.reviewAnalyzer` | P4 | Review themes and admin report |
| `ai.seoGenerator` | P5 | SEO draft generator |
| `ai.smartSearch` | P6 | Natural-language product search |

**LLM vendor (all priorities that use AI):** top-level `"ai": { "llmProvider": "openai" }` — change to `gemini` or `llama` and sync. See [LLM-PROVIDERS.md](./LLM-PROVIDERS.md).

After editing flags:

```bash
cd server && npm run sync:feature-flags
```

Then restart the server.

---

## Database

```bash
cd server && npm run prisma:migrate:deploy   # or prisma:migrate:dev locally
cd server && npm run prisma:seed             # demo products + review samples (optional)
```

Migrations mainly for P1, P4, P5:

- `20260604120000_sales_agent_offers`
- `20260604180000_sales_agent_full`
- `20260604200000_product_reviews_analyzer`
- `20260604210000_product_seo_fields`

---

## Verification commands

```bash
# AI unit tests
cd server && npm test -- --testPathPattern="services/ai|config/ai"

# Builds
cd server && npm run build
cd client && npm run build

# HTTP smoke (server on :4001)
bash server/scripts/verify-ai-priorities-http.sh
```

---

## Manual smoke (about 5 minutes)

1. **P6:** Search: `I need a wireless mouse under $50 for FPS games` → products list + AI banner.
2. **P3:** Open assistant → `Where is my order?` (signed in) or guest order ID + email.
3. **P2:** Open any product → **AI Recommended Setup** section.
4. **P1:** Browse products → sales offer may appear; admin → **Sales agent** dashboard.
5. **P4:** Super admin → **Review analyzer** → see top complaints / themes.
6. **P5:** Add Product → Step 3 → **Generate with AI** (when flag on) → **Create product**.

---

## More detail

- Full ticket map: [FEATURE-TRACKER.md](./FEATURE-TRACKER.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Switching OpenAI / Gemini / Llama: [LLM-PROVIDERS.md](./LLM-PROVIDERS.md)
