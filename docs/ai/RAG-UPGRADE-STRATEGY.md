# RAG Upgrade Threshold Strategy

**Status:** Decision guide. Nothing here needs building yet (GitHub issue #23).
**Decision:** Keep keyword retrieval for now. Move through the ladder below only when a trigger in [Thresholds](#thresholds) fires. When vectors are needed, use **pgvector in the existing PostgreSQL**, not an external vector database.

---

## 1. How retrieval works today

The general/FAQ chat path (`runGeneralChat`) builds context with keyword relevance. It does not use embeddings.

| Source | Code | Candidates considered | Sent to the LLM |
|--------|------|-----------------------|-----------------|
| Products | `knowledge/loaders/LoadProducts.ts`, `productIndex/productIndexQuery.ts` | In-memory index: every sellable product. Prisma fallback: 24 `contains` matches | Top 8 by relevance (name ×3, brand/category ×2, description ×1), then sales. Description capped at 200 chars |
| FAQs | `knowledge/KnowledgeContextLoader.ts` | All active FAQs | Top 8 (FAQ intent) or top 5 (general) by keyword score |
| Knowledge base docs | `knowledge/loaders/LoadKnowledgeDocuments.ts` | **20 newest** active docs | Top 3 (FAQ) or 2 (general). Only matching paragraphs, ≤ 4,000 chars per doc and ≤ 8,000 chars total |
| Coupons | `knowledge/loaders/LoadCoupons.ts` | Active, in-window, uses left | Top 5, only when the message mentions savings |
| History | `knowledge/PromptBuilder.ts` | Session + client history | Last 8 messages, ≤ 1,000 chars each |

The shared matching logic (stop words, naive plural handling, weighted scoring, paragraph excerpts) lives in `server/src/services/ai/knowledge/relevance.ts`.

`PRODUCT_SEARCH` recommendations (`queryRecommendationsFromIndex`) and smart search use the same in-memory index with filters. The thresholds below apply to them too.

---

## 2. Where keyword retrieval fails

These cases fail by design. Use them as the core of the evaluation set in [§5](#5-how-to-measure).

| # | Failure | Example | Why it fails |
|---|---------|---------|--------------|
| F1 | Synonyms | "couch" when the catalog says "sofa" | No shared word |
| F2 | Paraphrase of a policy | "Can I send it back?" vs FAQ "Return policy" | "send" and "back" never appear in the FAQ |
| F3 | Need-based / semantic query | "something for a rainy hike" | The products say "waterproof jacket" |
| F4 | Misspellings | "labtop", "hedphones" | Exact substring match only |
| F5 | Irregular plurals and stemming | "knives" vs "knife", "running" vs "run" | `singularize()` only handles regular English plurals |
| F6 | Negation and attributes | "non-leather wallet" | "leather" boosts exactly the wrong items |
| F7 | Other languages | "zapatos para correr" | English stop words and English catalog text |
| F8 | Knowledge base beyond the newest 20 docs | A 2-year-old warranty PDF | Never even scored (candidate window) |
| F9 | Long PDFs without blank-line paragraphs | Extracted PDF text with single newlines | `excerptRelevant` cannot split it, so it falls back to the first 4,000 chars |
| F10 | Substring false positives | "pen" matches "pendant", "open" | `includes()` has no word boundaries |

F1–F3 are the cases only embeddings solve well. F4, F5 and F10 are solved more cheaply by PostgreSQL full-text and trigram search. F8 and F9 are configuration and chunking problems, not retrieval-model problems.

---

## 3. Upgrade ladder

Take the cheapest step that fixes the observed failures. Each step keeps the previous one as a fallback.

| Step | What | Fixes | Cost |
|------|------|-------|------|
| 0 (current) | Keyword relevance (`relevance.ts`) | — | None |
| 1 | Tune: synonym map for top missed queries, raise `CANDIDATE_DOCS`, split PDF text on headings | F1 (partly), F8, F9 | Hours, no infrastructure |
| 2 | **PostgreSQL full-text search**: `tsvector` column + GIN index, `ts_rank`, plus `pg_trgm` for typos | F4, F5, F10, catalog scale | One migration, no new service, no per-query cost |
| 3 | **pgvector hybrid search**: embeddings on products and KB chunks, merged with step 2 by reciprocal rank fusion | F1, F2, F3, F6, F7 | Migration + embedding API cost + re-embed on change |
| 4 | External vector DB | Only past pgvector's limits | New service, sync drift, data leaves the DB |

---

## 4. Thresholds

### Hard triggers: start the next step

Upgrade when **any one** of these is true:

| Area | Threshold | Go to |
|------|-----------|-------|
| Product catalog | > **2,000** active products, or the in-memory index makes up > 15% of API memory | Step 2 |
| Product catalog | > **10,000** active products | Step 2 now, plan step 3 |
| Knowledge base | > **20** active documents (the candidate window; older docs are invisible) | Step 1 (raise the window to ~50), then step 3 if it grows further |
| Knowledge base | Typical document > **20,000** characters (≈ 5+ PDF pages) | Step 3 with chunking |
| FAQs | > **100** active FAQs | Step 2 |
| Languages | Storefront supports a second language | Step 3 (multilingual embeddings) |

### Quality triggers: measured over 2 weeks of real traffic

| Signal | Threshold | Likely cause → step |
|--------|-----------|---------------------|
| "I do not have that information" replies on FAQ-intent chats | > **15%** | F2/F8 → step 1, then 3 |
| General chats that reference zero catalog products when asking for products | > **20%** | F1/F3 → step 3 |
| Human handoffs triggered by repeated assistant failures | Rising week over week | Investigate before scaling |
| Eval set recall@8 (see §5) | < **80%** | Depends on which F-cases miss |

The numbers are starting estimates for a store this size, not benchmarks. Revisit them after the first real measurement.

### Do not upgrade yet when

- The catalog is under 2,000 products, the KB has 20 docs or fewer, and quality triggers are green.
- The misses are mostly missing content (no FAQ exists for the question). Better retrieval does not fix that, so add the FAQ.

---

## 5. How to measure

1. **Eval set.** Collect ~50 real shopper questions (from `ConversationLog` / AI analytics), covering every F-case above. For each, record the expected product IDs, FAQ or doc. Keep the set in `server/src/services/ai/knowledge/__tests__/` as fixtures.
2. **Retrieval test.** Run the loaders against a seeded catalog and report recall@8 for products and hit-rate for FAQs/docs. This tests retrieval only, with no LLM call, so it is deterministic and free.
3. **Production signals.** Assistant fallback replies are already detected by `isAssistantFailureReply` and counted for handoff. Add the classified intent and a "no catalog match" flag to the conversation log, so the quality triggers can be read from the AI analytics dashboard.

---

## 6. Recommended design when step 3 is triggered

**pgvector in the existing PostgreSQL database.**

- **Schema:** `Product.embedding` and a new `KnowledgeChunk` table (`knowledgeBaseId`, `ordinal`, `content`, `embedding`). Prisma has no native vector type, so use `Unsupported("vector(1536)")` and query with `$queryRaw`. Follow `ecom-prisma-change` for the migration (`CREATE EXTENSION IF NOT EXISTS vector`, HNSW index with `vector_cosine_ops`).
- **Chunking:** KB text in ~500–800 token chunks with ~15% overlap, split on headings or paragraphs first.
- **Embeddings:** Use the configured LLM provider's embedding model (`config/ai`), so there is no new vendor. Embed on write, reusing the existing hooks: `scheduleProductIndexSync` for products and the knowledge base create/update/delete service for docs. Store the model name with each vector so a model change can trigger a re-embed.
- **Query:** Hybrid search. Run the step-2 keyword/full-text query and a vector top-k, then merge with reciprocal rank fusion. Keep the current keyword path as the fallback when embeddings are missing or the provider is down.
- **Flag:** Put it behind a new server flag (e.g. `ai.semanticRetrieval`), so it can be turned off without a deploy (see `ecom-ai-module`).
- **Prompt budget:** Keep the current caps (8 products, ≤ 8,000 doc chars). RAG should improve *which* context is sent, not increase *how much*.

### Why not an external vector database (Pinecone, Weaviate, Qdrant…)

- It adds another service to host, secure, monitor and pay for. pgvector reuses the existing database, backups and Prisma workflow.
- Two stores must be kept in sync. Deleted or archived products and changed prices can drift out of a separate index, while pgvector filters on `isActive`/`isArchived` in the same query.
- Product and policy data would leave the primary database.
- pgvector with HNSW comfortably handles hundreds of thousands to low millions of vectors, which is far beyond this store's catalog and KB size.

Reconsider an external store only if **all** of these hold: > ~1M vectors, vector queries measurably slow down the primary database, and a read replica does not fix it. Also confirm the production Postgres host supports the `vector` extension before step 3; most managed hosts do.

---

## 7. Decision checklist

Before starting an upgrade, answer in the PR description:

- [ ] Which trigger in §4 fired, with the numbers?
- [ ] Which F-cases from §2 are the misses, with examples from the eval set?
- [ ] Is this the cheapest step on the ladder that fixes them?
- [ ] Is the new path behind a feature flag, with keyword retrieval as the fallback?
- [ ] Do retrieval tests show recall@8 improves on the eval set?
