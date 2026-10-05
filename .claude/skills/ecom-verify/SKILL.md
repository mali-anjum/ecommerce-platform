---
name: ecom-verify
description: Mandatory quality gate before claiming any change in this repo is done. Runs the right build, type, lint, and test commands for client/ and server/ in a memory-safe way, checks test strength, scans the diff for secrets and debug code, and produces the required change report. Use at the end of every task and before any commit or push.
---

# Verify — the gate before "done"

No change is done until this passes. Report exactly what ran and what did not.

## 1. Self-review the diff

```bash
git status --short
git diff
```

Check for and remove:
- `console.log`, `debugger`, commented-out code, TODOs you introduced
- `any`, `@ts-ignore`, `eslint-disable`, `.only`, `.skip`
- unused imports/variables, files unrelated to the task
- secrets: grep the diff

```bash
git diff | grep -nE "sk_live|sk_test_[A-Za-z0-9]{10}|whsec_|AKIA[0-9A-Z]{16}|-----BEGIN|(password|secret|token)\s*[:=]\s*['\"][^'\"]{8,}"
```

## 2. Run the checks (memory-safe)

This machine has limited RAM and the editor can crash under heavy parallel jobs. Run one heavy command at a time and use these flags.

**Server** (when anything in `server/` changed):
```bash
cd server && npm run build                 # prisma generate + tsc
cd server && npx jest --runInBand          # all tests, one process
cd server && npx jest --runInBand path/to/changed.test.ts   # fast loop while iterating
```

**Client** (when anything in `client/` changed):
```bash
cd client && npx eslint <changed files> --max-warnings 0   # changed files must be clean
cd client && npx tsc --noEmit                               # types
cd client && npx jest --runInBand
cd client && NODE_OPTIONS=--max-old-space-size=3072 npm run build   # for route/UI/config changes
```
`npm run lint` on the whole client has a pre-existing backlog of errors; do not add new ones — the files you touched must lint clean.

**Prisma** (schema changed): `cd server && npm run prisma:generate` and the migration from `ecom-prisma-change`.

## 3. Prove the tests are strict

For new logic, temporarily break the code (remove a check, flip a condition) and confirm at least one test fails; then restore and confirm green. If nothing fails, the tests are too weak — strengthen them. Tests must assert behaviour (status + body + DB call args), not just "was called".

## 4. Manual flows

If the change touches auth, cart, checkout/payment, orders, email, or uploads, list the manual flow to run (both apps running: `cd server && npm run dev`, `cd client && npm run dev`, open http://localhost:3012). If you could not run it, it goes under "unverified".

## 5. Report (required format)

```
1. What changed — files and behaviour, one line each
2. What was verified — exact commands and results (e.g. "server jest: 58 suites / 236 tests passed")
3. What is still unverified — and the risk
```

Never write "works" or "fixed" without a command result backing it. If a check fails, show the failure and fix it or say it remains.

## 6. Commits

Only commit/push when the user asks. Never commit `.env*` (except `.env.example`), build output, or `tsconfig.tsbuildinfo` noise you did not intend. Use a clear conventional message (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
