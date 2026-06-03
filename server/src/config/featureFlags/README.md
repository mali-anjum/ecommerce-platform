# Feature flags (contributor guide)

One product config file on the client; the server enforces **API / expensive** flags only.

## File map

| File | You edit when… |
|------|----------------|
| `client/feature-flags.config.json` | Adding or toggling any flag (UI + server) |
| `defaults.ts` | Adding a flag the **server** must enforce (Postman-safe) |
| `loadFeatureFlags.ts` | Rarely — loader/cache only |
| `index.ts` | Rarely — public API (`isFeatureEnabled`) |
| `registerModules.ts` | Rarely — mounts whole routers when `{module}.enabled` is on |
| `server.ts` | Registering a new module router (see below) |

After editing JSON: `cd server && npm run sync:feature-flags` (or `npm run build`).

## Naming convention

- Master switch per area: `{module}.enabled` (e.g. `ai.enabled`, `payments.enabled`)
- Children: `{module}.something` — automatically **off** when `{module}.enabled` is off (no extra wiring)

## Checklist: UI-only flag (client)

Example: hide a widget, no new API cost.

1. Add `"myModule.widget": true` to `client/feature-flags.config.json`
2. In React: `import { isFeatureEnabled } from "@/lib/feature-flags"`
3. Use `isFeatureEnabled("myModule.widget")`
4. **Do not** add to `SERVER_FLAG_DEFAULTS`
5. Rebuild/restart **client**

## Checklist: API / expensive flag (client + server)

Example: LLM chat, payments, webhooks.

1. Add `"myModule.feature": true` to `client/feature-flags.config.json`
2. Add the same key + default to `SERVER_FLAG_DEFAULTS` in `defaults.ts`
3. Guard code:
   - Route: `requireFeatureFlag("myModule.feature")` or `requireModule("myModule")`
   - Service: `isFeatureEnabled("myModule.feature")`
4. `cd server && npm run sync:feature-flags` and restart server
5. Run `npm test -- --testPathPattern=featureFlags`

## Checklist: whole module (routes not mounted when off)

Example: `/api/ai` when `ai.enabled` is false.

1. Add `"yourModule.enabled": true` to JSON + `SERVER_FLAG_DEFAULTS`
2. In `server/src/server.ts`, add to `registerFeatureModuleRoutes(app, [{ module: "yourModule", path: "/api/...", router: yourRoutes }])`
3. Sync + restart server

## Existing examples in the repo

| Flag | Client | Server guard |
|------|--------|----------------|
| `ai.assistant.widget` | `AppShell.tsx` | — (UI only) |
| `ai.chat` | BFF + `useAssistantChat` | `aiRoutes.ts`, `AssistantService` |
| `ai.enabled` | sidebar | `registerFeatureModuleRoutes`, `requireModule("ai")` |
| `payments.paypal` / `payments.stripe` | checkout via `/api/order/methods` | `paymentMethod.ts` |

## Tests

```bash
cd server && npm test -- --testPathPattern=featureFlags
```

## Do not

- Rely on `process.cwd()` for config paths (production uses `server/feature-flags.config.json`)
- Put UI-only keys in `SERVER_FLAG_DEFAULTS` (they would still be ignored, but confuse reviewers)
- Skip `sync:feature-flags` before deploy — server must have an up-to-date copy of JSON
