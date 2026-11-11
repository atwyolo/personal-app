---
tags: [adr, database]
status: superseded
date: 2026-10-26
updated: 2026-11-04
---

# ADR-0002 Database and ORM

**Superseded by [[ADR-0015 Content in Files]] (2026-11-04).** The site has no database since 2026-11-04: content lives in files in the repository.

## Context
Data should be dynamic and editable without redeploy. Vercel's filesystem is read-only at runtime, so file-based storage cannot be written. Must stay within free tiers.

## Decision
Neon Postgres provisioned through Vercel Marketplace (`vercel integration add neon`). Drizzle ORM with the `@neondatabase/serverless` HTTP driver; Drizzle Studio for ad-hoc data inspection.

**One database for everything** (amended 2026-10-28): local development, preview deployments and production all use the same Neon database. No Neon branch per environment and no branch per preview deployment.

**No migration files** (amended 2026-10-28): the schema in `src/db/schema/` is the source of truth and is synced with `drizzle-kit push`, run manually from the local machine. Nothing runs schema changes during the Vercel build.

## Alternatives
- Prisma 7: comparable now, but heavier client and a generate step; Drizzle is closer to SQL, which is better for learning.
- Supabase: brings auth/storage we do not need; we want to write auth ourselves.
- Local Postgres in Docker: diverges from production.
- Separate Neon branch for development and per preview deployment: isolates data, but adds environment juggling the owner does not want for a single-author site.
- `drizzle-kit generate` + `migrate` with committed SQL files: reviewable history of schema changes, needed for teams and multiple databases; overkill with one database and one author.

## Consequences
- Neon Free: 1 GB storage, 100 CU-hours/month, scale-to-zero after 5 min → first request after idle is slower; ISR hides this for public pages.
- Connection string via env var `DATABASE_URL`, injected by the Vercel integration into every environment and pulled locally with `vercel env pull`.
- Local dev and previews read and write production data. Test writes must be cleaned up by hand.
- `drizzle-kit push` applies changes immediately. Destructive changes (dropped or renamed columns) are confirmed interactively; read the prompt before accepting. Prefer additive changes: push the schema first, deploy code that uses it second.
- The seed script fills empty tables only and never truncates, so it cannot wipe content edited later in the admin.
- **Known drizzle-kit 0.31 bug (found 2026-10-29):** `push` may propose `DROP CONSTRAINT …_pk` + `ADD CONSTRAINT … PRIMARY KEY` for unchanged composite primary keys. Its Postgres introspection reads key columns without `ORDER BY`, so the order is random and a different subset of tables "changes" on each run ([drizzle-orm#6078](https://github.com/drizzle-team/drizzle-orm/issues/6078), [#6193](https://github.com/drizzle-team/drizzle-orm/issues/6193)). The real keys match the schema; the statements recreate the same key. Fixed only in the Drizzle v1 release candidate (drizzle-kit rewrite). Until we move to v1: read push output carefully, treat these pairs as noise, and verify constraints with a read-only `pg_constraint` query after a push.
- **`push` never updates a changed check constraint** (drizzle-kit 0.31, by design: `alteredCheckConstraints` are skipped when `action === "push"`). Checks are only added or dropped by name, because Postgres returns a normalized expression that never matches the schema source. To change a check's expression, run a one-off `drop constraint` + `add constraint` in one transaction (first used 2026-10-29 for `profile_translations_en_complete`), then confirm with a read-only `pg_get_constraintdef` query. The schema file stays the source of truth.
