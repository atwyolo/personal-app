---
tags: [adr, i18n]
status: superseded
date: 2026-10-26
updated: 2026-11-04
---

# ADR-0003 Content Localization

**Superseded by [[ADR-0015 Content in Files]] (2026-11-04).** Content is localized per field in Markdown files under `messages/<locale>/`, with the same per-field fallback to English that the translation tables gave.

## Context
Eight locales from day one, content edited in a custom admin, fallback to English required.

## Decision
- UI strings: `next-intl` with `[locale]` route segment.
- DB content: one translation table per entity, keyed by `(entity_id, locale)`. See [[Content Model]] and [[Localization]].

## Alternatives
- `jsonb {locale: value}` columns: simplest, but explicitly rejected by the owner; weak constraints, awkward queries, no per-locale indexes.
- Columns per locale (`title_en`, `title_ru`, …): schema changes for each new locale.
- Payload CMS built-in localization: rejected together with Payload (see [[ADR-0004 Hand-written Admin]]).

## Consequences
- Queries join the translation table with a fallback to `en`; a small query helper will encapsulate it.
- Admin edits one locale at a time with a visible fallback indicator.
