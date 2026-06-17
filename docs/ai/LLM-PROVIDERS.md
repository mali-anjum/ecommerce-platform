# Multi-LLM Provider Architecture (OpenAI · Gemini · Llama)

Brief for implementers (human or AI). **All LLM calls stay on the server** — never in the Next.js client.

---

## Goal

Switch the active LLM by editing **one config value** (no code changes):

```json
// client/feature-flags.config.json  →  synced to server/feature-flags.config.json
{
  "ai": {
    "llmProvider": "openai"
  },
  "flags": { ... }
}
```

Allowed values: `"openai"` | `"gemini"` | `"llama"`.

Every AI module (chat, sales intent, SEO, smart search, reviews, setup recommendations) uses the **same provider abstraction**, not direct `OpenAI` imports.

---

## Where things live (server only)

```
server/src/config/ai/
  ai.ts                    # Public API: isAiConfigured, getLlmModel, completeChat
  llmConfig.ts             # Reads llmProvider from feature-flags.config.json
  providers/
    types.ts               # LlmProviderId, messages, completion types
    openaiProvider.ts      # OpenAI SDK
    geminiProvider.ts      # Google Gemini REST
    llamaProvider.ts       # Ollama / OpenAI-compatible local API
    index.ts               # resolveProvider(), completeChat()
```

**Do not** add LLM keys or provider logic under `client/`. Client only keeps feature flags for UI (widget on/off). BFF routes proxy to Express; Express runs the model.

---

## Config & env

| Provider | Config key | Required env | Optional env |
|----------|------------|--------------|--------------|
| `openai` | `ai.llmProvider: "openai"` | `OPENAI_API_KEY` | `OPENAI_MODEL` (default `gpt-4o-mini`) |
| `gemini` | `ai.llmProvider: "gemini"` | `GEMINI_API_KEY` | `GEMINI_MODEL` (default `gemini-2.0-flash`) |
| `llama` | `ai.llmProvider: "llama"` | — (local) | `LLAMA_BASE_URL` (default `http://127.0.0.1:11434/v1`), `LLAMA_MODEL` (default `llama3.2`), `LLAMA_API_KEY` (optional dummy for Ollama) |

After editing JSON: `cd server && npm run sync:feature-flags` (or `npm run build`).

Module feature flags (`ai.chat`, `ai.smartSearch`, etc.) still **gate routes**. `llmProvider` only picks **which API** runs when LLM is needed.

---

## Provider contract

```typescript
type LlmChatMessage = { role: "system" | "user" | "assistant"; content: string };

type LlmCompletionRequest = {
  messages: LlmChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

// Returns assistant text or throws if misconfigured
completeChat(request: LlmCompletionRequest): Promise<string>;
```

Each provider file implements `isConfigured(): boolean` and `completeChat(...)`.

**Fallback rule (already used in services):** If `!isAiConfigured()`, use deterministic rule-based output — do not fail storefront flows.

---

## Modules that must use `completeChat` (not raw OpenAI)

| Module | File |
|--------|------|
| General / FAQ chat | `services/ai/chat/GeneralChatService.ts` |
| Sales buying intent | `services/ai/sales/BuyingIntentAnalyzer.ts` |
| Setup intent | `services/ai/recommendations/SetupIntentAnalyzer.ts` |
| Review themes (batch) | `services/ai/reviews/ReviewThemeClassifier.ts` |
| Smart search intent refine | `services/ai/search/SmartSearchService.ts` |
| SEO generator | `services/ai/seo/SeoContentGeneratorService.ts` |

Import from `config/ai` only:

```typescript
import { completeChat, getLlmModel, isAiConfigured } from "../../../config/ai";
```

---

## Llama / Ollama notes

Ollama exposes an **OpenAI-compatible** HTTP API. The Llama provider uses the `openai` npm package with:

- `baseURL = process.env.LLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1"`
- `apiKey = process.env.LLAMA_API_KEY ?? "ollama"`

Run locally: `ollama pull llama3.2` then set `"llmProvider": "llama"`.

---

## Gemini notes

Uses `generativelanguage.googleapis.com` REST (`generateContent`). System + user messages are flattened into the Gemini contents format. No extra npm package required (fetch).

---

## Testing

```bash
cd server && npm test -- --testPathPattern="llmProvider|services/ai"
```

Mock `completeChat` / `isAiConfigured` in unit tests (same pattern as today).

Manual smoke per provider:

1. Set `ai.llmProvider` in JSON + sync flags.
2. Set matching env keys.
3. `POST /api/ai/chat` with a FAQ question.
4. `POST /api/ai/search` with a natural-language query.
5. Super-admin SEO generate.

---

## What not to do

- Do not call OpenAI/Gemini/Ollama from `client/src`.
- Do not duplicate provider logic inside each service — one `providers/` folder only.
- Do not store API keys in `feature-flags.config.json` — env only.
- Do not remove rule-based fallbacks when LLM is off.

---

## Relation to AI priorities 1–6

| Priority | Uses LLM? |
|----------|-----------|
| P1 Sales | Optional (buying intent) |
| P2 Setup recs | Optional (setup intent) |
| P3 Support | Optional (FAQ/general; orders are DB) |
| P4 Reviews | Optional (theme classifier) |
| P5 SEO | Optional (copy generation) |
| P6 Smart search | Optional (intent refine) |

Changing `llmProvider` affects all optional LLM paths consistently.
