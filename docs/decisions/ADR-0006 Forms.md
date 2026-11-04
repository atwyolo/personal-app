---
tags: [adr, forms]
status: accepted
date: 2026-10-26
updated: 2026-11-04
---

# ADR-0006 Forms

**No forms remain (2026-11-04):** the contact page and the admin left the plan ([[ADR-0015 Content in Files]]), and `src/actions/` and `src/schemas/` are gone. The decision stands for any future form.

## Context
Public contact form and many admin forms; validation must match on client and server.

## Decision
React Hook Form + Zod via `@hookform/resolvers`. Each form has one Zod schema in `src/schemas/`, imported by both the client form and the Server Action. Server Actions live in `src/actions/`. They return `{ ok, errors }`: `ok: true` on success, `ok: false` with `errors` keyed by field name on failure (changed from `{ ok, data } | { ok, fieldErrors, formError }` on 2026-10-29; the exact type is defined with the first form). The client maps `errors` back into RHF with `setError`.

## Alternatives
- Plain `useActionState` + native validation: enough for one form, painful for an admin with dozens.
- TanStack Form: capable, smaller ecosystem; shadcn's form helpers target RHF.

## Consequences
- shadcn `Field`/`Form` components wrap RHF; keep that integration in one shared component.
- `src/actions/` and `src/schemas/` sit outside the Feature-Sliced layers: any layer may import them, and the boundaries lint puts no import-order rules on them.
- Progressive enhancement is partial: forms still post without JS, but client-side UX needs hydration.
