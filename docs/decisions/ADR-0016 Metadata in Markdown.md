---
tags: [adr, content, i18n]
status: accepted
date: 2026-11-10
---

# ADR-0016 Metadata in Markdown

Amends [[ADR-0015 Content in Files]], which gave `messages/<locale>.json` two roots, `Meta` and `Pages`.

## Context
The owner draws one line through `messages/` (2026-11-10): content lives in Markdown, JSON holds interface strings only. Page titles, descriptions and the site settings were the only content left in JSON, read through next-intl's merged messages and a parser of their own in `src/content/meta.ts`, while every other content file went through `loadLocalized` and the schemas in `src/content/schemas.ts`.

Spec: [[2026-11-10-meta-in-markdown-design]]. Plan: [[2026-11-10-meta-in-markdown]].

## Decision
- **`messages/<locale>/meta.md`**, frontmatter only, holds what `Meta` held, in the same structure: `Common` (site name, default title, icon URLs, OG placeholder, `hiddenFromSearch`) and one node per page (`Home`, `About`, `Skills`, `Experience`: `title`, `description`, `ogImageUrl`). Node keys stay PascalCase to match `PageKey`; every key, `null` included, is required in `en`.
- **`messages/<locale>.json` keeps only `Pages`.** It is next-intl's interface text and nothing else; `mergeMessages` narrows to `string | null` leaves.
- **`mergeFields` merges nested objects recursively**, so a locale can translate one field of a node and inherit the rest. It lives in `src/content/merge-fields.ts` without `server-only`, so the e2e helper merges by the same rule.
- The getters `getSiteMeta` and `getPageMeta` keep their signatures; no view changed.

## Alternatives
- **Keep `Meta` in JSON:** works, but leaves one kind of content outside the loader, its schemas and its error messages, and mixes content with interface strings.
- **One file per page** (`meta/home.md`, …): smaller files, but five files for fifteen short values, and the site settings would need a file of their own anyway.
- **Metadata in each page's own content file** (the Home title in `profile.md`, the Skills title in `skills.md`): close to the text it describes, but About and Experience are folders of files with no page-level file to hold it.
- **A shallow merge with whole nodes in a locale:** a translator would copy `description` and `ogImageUrl` just to change `title`, and a later English change would not reach them.

## Consequences
- All content goes through one loader: strict Zod schemas, errors that name the file and the field, per-field fallback to English.
- A locale translates metadata by adding `messages/<locale>/meta.md` with only the fields it changes.
- `yes`/`no` in `hiddenFromSearch` fail the build (YAML 1.2 reads them as strings), as any typo in the other content files does.
