---
tags: [adr, content, i18n]
status: accepted
date: 2026-11-04
---

# ADR-0015 Content in Files

Supersedes [[ADR-0002 Database and ORM]], [[ADR-0003 Content Localization]], [[ADR-0004 Hand-written Admin]] and [[ADR-0014 Metadata in the Database]].

## Context
The owner changed the foundation of the site on 2026-11-04. The blog, the contact form and the admin leave the project; content changes only with a deploy (edit files, merge into `main`, Vercel builds). Without an admin, the database buys nothing and costs a driver, cache tags, a schema to sync, a seed and e2e tests against production data. Long texts are written in Google Docs and pasted as Markdown, and a later CV repository will assemble a Markdown CV from the same pieces.

Spec: [[2026-11-04-content-in-files-design]]. Plan: [[2026-11-04-content-in-files]].

## Decision
- **No database.** Vercel Blob keeps only binary files (photo, CV, images), uploaded by hand.
- **`messages/<locale>.json`** has two roots: `Meta` (`Common` with the site settings, then one node per page: `Home`, `About`, `Skills`, `Experience`) and `Pages` (interface texts: `Common`, then one node per page). Non-translatable values (URLs, `hiddenFromSearch`) live only in `en.json`.
- **Personal content is Markdown with YAML frontmatter** in `messages/<locale>/`: `profile.md`, `skills.md`, `experience/<slug>.md`, `about/<slug>.md`. The slug is the file name.
- **Localization, per field:** `en` holds every field; another locale's file holds only what it translates, merged over English field by field (lists by item key). A missing locale file means English. A locale file without an English counterpart fails the build.
- **Reading:** `src/content/` (outside the FSD layers) with `gray-matter`, strict Zod schemas and `fs.readFileSync` under `"use cache"` + `cacheLife("max")`, no tags. Every error names the file and the field.
- **Revalidation (owner, 2026-11-04):** `cacheLife("max")` as it is: a page is re-rendered in the background at most every 30 days after a visit (and synchronously after a year without visits). The files inside a deployment never change, so this only refreshes what depends on the clock: the duration of a running job. A profile that never revalidates was the alternative; it would freeze that duration at the last deploy.
- **Markdown:** CommonMark only (paragraphs, bold, italic, links, lists, hard breaks, headings), rendered on the server by `react-markdown` in `src/shared/ui/Markdown.tsx`. Anything else fails the build, so the files stay portable; the loader parses with GFM (`micromark-extension-gfm`) only to see and reject the tables, strikethrough, task lists and footnotes Google Docs emits. Nested lists are rejected too (owner). Text size comes from heading levels, shifted below the page's outline.
- **Runtime reads:** `outputFileTracingIncludes` puts `messages/**/*.md` into every server route, for renders at request time: the 404, and the background revalidation of every page.

## Alternatives
- **Keep Neon without an admin:** content edited with Drizzle Studio or SQL. Every change still needs a tool outside the editor, no review in pull requests, and the e2e suite stays tied to production data.
- **A headless CMS** (Sanity, Contentful, Payload): an editor and webhooks for free, but an external service, an account and a schema in someone else's system for a site edited by one person.
- **MDX:** React components inside the text. The files would no longer render on GitHub or in a CV built elsewhere.
- **`content-collections` or Velite:** typed Markdown collections as a build step. Less own code, but one more tool in the build chain and its integration with Next 16 and Cache Components; a hand-written loader of about two hundred lines keeps the whole path visible.
- **jsonb or JSON for rich text:** what the Tiptap editor produced. Not pasteable from Google Docs and not readable in a diff.

## Consequences
- New content needs a deploy; the 30-day revalidation re-reads the same files. `updateTag` and cache tags are gone.
- Git is the history, pull requests are the review, `git revert` is the undo.
- The build validates every file; a typo cannot reach production.
- The Blob store's URLs are typed into the files by hand. There is no upload form.
- e2e tests read the files they compare with and never touch a database.
- Names sort by code point, as the database's collation `C` did, so no list changed order in the move.
