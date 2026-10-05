---
name: ecom-prisma-change
description: Safe workflow for changing the database in this repo — editing server/src/prisma/schema.prisma, creating migrations, seeding, and regenerating the Prisma 7 client. Use whenever a model, field, relation, index, enum, or migration changes.
---

# Prisma / database change (server/)

Schema: `server/src/prisma/schema.prisma`. Migrations: `server/src/prisma/migrations/`. Seed: `server/src/prisma/seed.ts`. Client singleton: `server/src/lib/prisma.ts` (keep the global singleton pattern).

Consult `prisma-cli` and `prisma-client-api` for command/API details; `prisma-upgrade-v7` for any version issue.

## Rules

- Always go through a migration. Never use `prisma db push` against shared or production databases.
- Never run `npm run prisma:migrate:reset` or anything that drops data unless the user explicitly asks — it wipes the local DB.
- Prefer additive, backward-compatible changes:
  - New column → nullable or with a `@default`, then backfill, then tighten in a later migration.
  - Renames → add new, copy, switch code, remove old later (Prisma generates drop+add for renames, which loses data).
- Add `@@index` for new foreign keys and fields used in `where`/`orderBy`.
- Choose `onDelete` deliberately for every relation (orders and payments must never cascade-delete from users/products).
- Money fields: keep the existing type used by `Product`/`Order` — do not mix Float and Decimal.
- Read the generated SQL in the new migration folder before accepting it. Look for `DROP`, data loss warnings, and non-null columns without defaults.

## Commands (run from server/)

```bash
npm run prisma:migrate:dev -- --name <short_snake_case_name>   # create + apply locally
npm run prisma:generate                                        # regenerate client
npm run build                                                  # type-check against new client
npx jest --runInBand                                           # tests
```

Production applies migrations with `npm run prisma:migrate:deploy` (already part of `render-build`).

## After the change

- Update `seed.ts` if new required fields exist.
- Update services that select/return the model; never expose sensitive columns.
- Update the "Core models" section in `README.md` / `server/README.md` when a model is added.
- Commit `schema.prisma` **and** the migration folder together.

Then run `ecom-verify`.
