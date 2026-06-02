# OAuth module

Social sign-in (Google, Facebook, GitHub, Microsoft, Apple) using [Arctic](https://arcticjs.dev/) on Express.

## Layout

```text
oauth/
  index.ts                 # Public API — import from here only
  oauthService.ts          # Facade (OAuthService / oauthService)
  oauthFactory.ts          # Maps route slug → provider class
  providers/               # One file per identity provider
  internal/                # Shared implementation (do not import from outside oauth/)
  __tests__/
```

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| Files | camelCase | `oauthService.ts` |
| Classes | PascalCase | `OAuthService`, `GoogleOAuthProvider` |
| Singleton | camelCase | `oauthService` |
| Route slug | lowercase | `"google"` → `/api/auth/google` |
| DB enum | UPPER_SNAKE | `"GOOGLE"` |

## Usage (controllers / routes)

```ts
import { oauthService } from "../services/oauth";

oauthService.start("google", res);
await oauthService.handleCallback("google", req, res);
```

## Add a new provider

1. Add enum value in Prisma `OAuthProvider` if needed.
2. Create `providers/{slug}OAuthProvider.ts` extending `BaseOAuthProvider`.
3. Register in `oauthFactory.ts` switch + `getConfiguredProviders` list.
4. Add `mapProviderId` entry in `internal/oauthAccountService.ts`.
5. Wire routes in `authRoutes.ts` (see `oauthProviderController.ts`).
6. Add tests under `__tests__/`.

## Flow

```text
GET /api/auth/google
  → OAuthService.start
  → GoogleOAuthProvider (BaseOAuthProvider.start)
  → oauthConfig (state cookie, redirect URI)

GET /api/auth/google/callback
  → fetchProfile (provider)
  → oauthAccountService.findOrCreateUserFromOAuth
  → tokenService.issueSessionForUser
  → oauthExchangeStore → redirect to Next.js BFF
```
