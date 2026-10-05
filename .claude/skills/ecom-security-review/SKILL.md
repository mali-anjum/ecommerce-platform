---
name: ecom-security-review
description: Security checklist for this repo covering JWT/cookie auth, roles (USER, SELLER, SUPER_ADMIN), ownership checks, input validation, uploads, secrets, logging, and dependency changes. Use when touching auth, middleware, user input, file uploads, env/config, or before shipping any change that exposes a new endpoint.
---

# Security review

Run this checklist against the diff (`git diff` and new files). Every "no" is a bug to fix before finishing.

## Auth model (know it before changing it)

- Access token: HS256 JWT signed with `JWT_SECRET` (`jsonwebtoken` in `server/src/services/auth/tokenService.ts`), claims `userId`, `email`, `role`. Short-lived.
- Refresh token: random UUID stored **hashed**; it is not a JWT.
- Both are httpOnly cookies (`server/src/config/cookies.ts`). Bearer header is accepted as a fallback for API clients.
- Server verification: `server/src/utils/auth/accessToken.ts` (`verifyAccessToken` pins HS256 and requires all claims) used by `authenticateJwt` / `optionalAuthenticateJwt`.
- Client edge guard: `client/src/proxy.ts` (jose) for redirects only — the server is the real authority.
- Roles: `USER`, `SELLER`, `SUPER_ADMIN` (`server/src/constants/roles.ts`).

## Checklist

**Authentication / authorization**
- [ ] Every non-public endpoint has `authenticateJwt`.
- [ ] Admin endpoints have `isSuperAdmin`; seller endpoints `requireSellerOrSuperAdmin` + `attachSellerProfile`.
- [ ] Ownership enforced in the service `where` clause (userId / sellerId), not only in the UI. No IDOR: changing an id in the URL cannot reach another user's data.
- [ ] `userId` and `role` come from `req.user`, never from body/query.
- [ ] JWT verification keeps the algorithm pinned and claims validated; cookie flags (`httpOnly`, `secure` in prod, `sameSite`) unchanged or stricter.

**Input**
- [ ] All bodies validated with zod (`validate(schema)`); params/query checked.
- [ ] No raw SQL with string interpolation (`$queryRawUnsafe`); use Prisma or tagged `$queryRaw`.
- [ ] Uploads go through `uploadMiddleware` / `documentUploadMiddleware` with type and size limits.
- [ ] No user-controlled URLs fetched server-side without an allowlist (SSRF).
- [ ] No `dangerouslySetInnerHTML` with user/LLM content without sanitizing.

**Secrets and logging**
- [ ] No secrets, tokens, or keys in code, tests, fixtures, logs, or commits. `.env*` stays untracked (only `.env.example`).
- [ ] Required secrets fail fast when missing (no `|| "default-secret"`).
- [ ] Logs contain ids/counts only — never tokens, cookies, passwords, payment payloads, or PII beyond what is needed.
- [ ] Only `NEXT_PUBLIC_*` values are exposed to the browser, and none of them are secret.

**Responses**
- [ ] Errors use `ApiError`; no stack traces or internal messages leak in production.
- [ ] Responses never include `password`, token hashes, or provider secrets (use Prisma `select`).
- [ ] Sensitive endpoints (login, register, reset) keep `authRateLimiter`.

**Dependencies**
- [ ] New packages are necessary, maintained, and installed with a lockfile update; run `npm audit --omit=dev` and report new high/critical issues.

## Tests

For new protected endpoints add tests for: no token → 401, wrong role → 403, other user's resource → 403/404. For auth changes extend `server/src/middleware/__tests__/authMiddleware.test.ts`.
