---
tags: [spec, content, i18n, architecture]
status: approved
date: 2026-11-04
updated: 2026-11-04
---

# Content in Files Design

Status: **approved by the owner 2026-11-04.** Plan: [[2026-11-04-content-in-files]].

Related: [[Content Model]], [[Localization]], [[Rendering Strategy]], [[ADR-0002 Database and ORM]], [[ADR-0003 Content Localization]], [[ADR-0004 Hand-written Admin]], [[ADR-0014 Metadata in the Database]], [[ADR-0007 Testing]], [[ADR-0013 Version Tracking]], [[Roadmap]].

## Intent

The owner changes the foundation of the site (2026-11-04). The site stops depending on a database. All content lives in files in the repository, and Vercel Blob keeps only binary files (photo, CV, images). New content arrives with a deploy. The owner edits the files by hand, merges into `main`, Vercel builds, and visitors see the new content. Nothing is read at request time that a build could not have read.

The blog, the contact page and the admin leave the project. Without an admin, a database adds cost and moving parts (an HTTP driver, cache tags, a schema to sync, e2e tests against production data) and buys nothing. Files in git give history, review in pull requests and diffs for free.

Long texts are written in Google Docs and pasted as Markdown. A later, separate project (another GitHub repository) will assemble a Markdown CV from the same pieces, so the Markdown must stay portable.

## Goals

- Every page (Home, About, Experience, Skills) and every piece of metadata renders from files only. No database code, driver, or environment variable remains.
- The blog is removed from the code: the list, the post page, the Home block, their shared code and tests.
- `/projects` becomes `/experience` (route, navigation label, metadata key, code names).
- The current database content moves into files without loss and is verified against the running site before the database is deleted.
- A typo in a content file (a bad date, a level of 11, a missing required field in `en`) fails the build with the file and the field named.

## Non-goals

- The CV repository and its assembly script. This spec only keeps the Markdown portable for it (see Constraints).
- Translations. Only `en` content exists today. The fallback must work for other locales, but no translated content is written.
- A redirect from `/projects` to `/experience` (owner's choice, see Decided).
- New design or behaviour of any page. Pages look and behave as today; only the data source and the blog/contact links change.

## Anti-goals

- Visible regressions on Home, About, Experience or Skills after the switch: missing text, a lost bold or list item, a changed order, a broken image, a changed title or description. The only expected differences are the rename of decision 13 and the removed Blog and Contact links.
- Markdown that only this site understands (MDX components, custom directives, HTML blocks). It would break the CV reuse.
- Shipping all content to the browser through `NextIntlClientProvider`.
- Deleting the database before the owner confirms that the site works fully on files.

## Decided by the owner (2026-11-04)

1. **No database.** Content lives in files; Vercel Blob stays for binary files.
2. **Blog removed** from the current code: the list page, the post page, the Home block.
3. **Contact page (Stage 5) and admin (Stage 6) removed from the plan.** Content changes through a deploy.
4. **`messages/<locale>.json` has two root nodes:**
   - `Meta`: `Common`, `Home`, `About`, `Skills`, `Experience`. `Meta.Common` holds everything from `meta_site_settings` and its translations: site name, default title, the four icon URLs, the OG placeholder URL, `hiddenFromSearch`. Each page node holds title, description and OG image URL.
   - `Pages`: `Common`, `Home`, `About`, `Skills`, `Experience`. These are the interface texts that are not personal information. Examples: "About me" and the About intro, the header, navigation, language and theme menus, "Back", the labels of the contact buttons.
5. **The Projects page is renamed to Experience**, together with its route (`/experience`).
6. **Personal information lives in Markdown files**, rich text included: profile, skills, experience, About pairs. Structured fields go into YAML frontmatter, long text into the body.
7. **Parsing:** `gray-matter` + Zod + a hand-written loader in `src/content/`.
8. **Localization, variant A:** `en` holds every field. Other locales hold only translated fields. Fallback to `en` is per field, and per file when a locale's file is missing entirely.
9. **Migration:** the current database content is exported to the files, not rewritten by hand.
10. **The database is deleted** only after the move succeeds and the owner confirms the site works fully on the Markdown content.
11. **Publishing flow:** edit files → merge into `main` → Vercel build → visitors see it.
12. **Design handoffs** for Blog, Post, Contact and Admin are deleted from `docs/design/`.
13. **Rename scope:** the navigation label and the `<title>` say "Experience" ("Experience — Mikhail Aleksandrov"); the page label `Projects · {from} — {to}` and `labelWithoutYears` stay "Projects". The description stays as it is.
14. **Markdown set:** paragraphs, bold, italic, links, bullet and numbered lists, hard line breaks, headings. External links open in a new tab with `rel="noopener noreferrer"` and the `newTab` screen-reader suffix. Anything else (images, tables, code, block quotes, raw HTML) fails the build with the file named.
14a. **Text size comes from heading levels only** (owner, 2026-11-04). Markdown has no font size, and Google Docs' Markdown copy keeps only the "Heading 1–6" styles. Each Markdown heading level has its own size from the design tokens. At render time levels shift below the heading the text sits under, so a body never adds a second `h1` (e.g. `#` inside an About answer, which sits under an `h2`, renders as `h3`, `##` as `h4`, capped at `h6`). The visual size follows the level written in the file; the HTML element follows the context. Attribute or directive syntax for sizes is rejected: it breaks portable Markdown.
15. **Blog documents:** the blog's specs and plans stay with `status: dropped`; everything else of the blog is deleted. `src/db/` goes entirely. No database dump before the deletion.

## Content layout

### `messages/<locale>.json`

`en.json` is complete; other locales are partial and deep-merged over it by the existing `mergeMessages` (empty strings count as missing). Values that are never translated (URLs, `hiddenFromSearch`) live only in `en.json`.

```
Meta
  Common       siteName, defaultTitle, iconIcoUrl, iconSvgUrl, iconPngUrl, appleTouchIconUrl, ogPlaceholderUrl, hiddenFromSearch
  Home         title, description, ogImageUrl
  About        …
  Skills       …
  Experience   …
Pages
  Common       today's Common, Header, LocaleMenu, ThemeMenu, Contacts, Carousel, SkillRow, the 404 texts
  Home         today's Home
  About        today's About
  Skills       today's SkillsPage
  Experience   today's Projects
```

The mapping of today's namespaces into `Pages.*` is a proposal (builder's call within the rule "shared by several pages → `Common`"). `BlogPage` and `Post` are deleted, as are `Header.nav.blog` and `Header.nav.contact`. Nullable URLs (an icon not uploaded yet) are `null` in JSON. The builder checks that next-intl's message typing accepts `null` and booleans, and otherwise picks the nearest representation and records it.

### Markdown files

```
messages/
  en/
    profile.md
    skills.md
    experience/<slug>.md
    about/<slug>.md
  <locale>/ …   same paths, partial, optional
```

| File | Frontmatter | Body |
|---|---|---|
| `profile.md` | `name`, `headline`, `jobTitle`, `photoUrl`, `cvUrl`, `whatsappPhone` (E.164), `email`, `linkedinUrl` | Home's About text (today `about_short`): lead paragraph, bold results title, bullet list |
| `skills.md` | `domains`: list of `{ key, label }` in display order; `skills`: list of `{ name, level, domain, main, top, sort }` | none |
| `experience/<slug>.md` | `company`, `role` (optional), `startDate`, `endDate` (optional, missing = present), `imageUrl` (optional), `sort`, `skills` (names from `skills.md`, ordered), `descriptionShort` | full description (today `description_full`), may be empty |
| `about/<slug>.md` | `sort`, `linkText`, `questionTitle`, `questionMessage`, `answerTitle` | the answer (today `answer_message`) |

- The slug is the file name. It is the anchor (`/experience#glovo`, `/about#who`) and is never translated.
- Field names in the table are a proposal: camelCase, matching today's TypeScript types. Dates are `YYYY-MM-DD` strings in quotes, so YAML does not turn them into `Date` objects.
- **Localization merge.** A locale's file is merged over the `en` file of the same path, field by field. A locale's body replaces the `en` body when it is non-empty. A locale file whose `en` counterpart does not exist is an error. In `skills.md`, a locale translates only domain labels: lists are merged by `key` (domains) or `name` (skills), never by index. Non-translatable fields (`level`, `startDate`, URLs) in a locale file are allowed but redundant. Whether the loader rejects them is left to the builder (see Left to the builder).
- Zod validates the merged result per locale, so `en` must be complete and other locales may be partial.
- Cross-file checks fail the build: every `experience.skills` entry exists in `skills.md`; every skill's `domain` exists in `domains`; slugs and skill names are unique.

## Reading the content

- `src/content/` is a new top-level folder outside the FSD layers. It replaces `src/db/` in the boundaries config with the same import rules (features may import it only with `import type`).
- The loader is server-only (`import "server-only"`). It exposes the same shapes today's queries return (`getProfile`, `getExperience`, `getSkills`, `getTopSkills`, `getAboutPairs`, plus the metadata reads), so widgets change as little as possible.
- **Rendering.** Under Cache Components, `fs.readFileSync` and module imports are predictable and prerendered automatically, while `await readFile()` inside a component must be cached or suspended (`node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`, "Prerendering"). Experience computes `today` (a running job's end) and must stay inside `"use cache"` for that. Cache tags and `updateTag` go away; `cacheLife("max")` stays wherever `"use cache"` stays. Every route stays static, as today.
- **Runtime reads.** Some outputs may render at request time (the 404 of an unknown path through `[...rest]`, `/favicon.ico`). If the loader reads files at runtime, those files must reach the Vercel function bundle (`outputFileTracingIncludes`), or the data must be resolved at build time (for example, imported). The builder picks one and proves it on a production build.
- **Markdown rendering.** The allowed set is decision 14; the loader walks the parsed tree (mdast) and rejects any other node type at build time. Bodies render with `react-markdown` on the server (no `"use client"`), mapped onto the current typography (today's `RichText` classes). `RichText.tsx`, `rich-text.ts` and the Tiptap JSON types go away. Plain-text needs (meta descriptions, JSON-LD) get a plain-text helper over the Markdown.
- **Client messages.** `NextIntlClientProvider` today receives every message. With `Meta` in the same file, the provider receives only `Pages` (or narrower), so metadata never reaches the client bundle.

## Migration

1. A one-off export script reads the current database (read-only) and writes `messages/en/**.md` and the `Meta` values of `messages/en.json`. The script lives in the session scratchpad, not in the repository (Claude's call: the database leaves the code, so the script would be dead code). Tiptap JSON is converted to Markdown. The stored content uses only paragraphs, bold and bullet lists (checked 2026-11-04), which convert without loss.
2. Rows only for the blog (`posts`, `post_topics`, their translations, `meta_pages` row `blog`) are not exported. The `projects` meta row becomes `Meta.Experience`.
3. Only `en` rows exist in the database (checked 2026-11-04, apart from post topics). No locale folders are created.
4. Blog rows are not dumped (owner): they disappear with the database.
5. Verification: before the pages switch to files, the e2e suite is green on the database. After the switch, the same assertions pass on files. Text-level checks compare each page's visible text and metadata before and after (the builder chooses how, e.g. a saved snapshot of the built HTML per page and locale).

## Removal

- **Blog:** `src/app/[locale]/blog/**`, `src/views/blog`, `src/views/post`, `src/widgets/blog`, `src/widgets/blog-list`, `src/widgets/post`, `src/features/post-card`, `src/features/tag-search`, `src/features/reading-progress`, `src/schemas/blog-list.ts`, `e2e/blog.spec.ts`, `e2e/home-blog.spec.ts`, `e2e/post.spec.ts`. Shared code used only by them (likely `Pagination`, `PageSizeSwitch`, `page-range`, `NavigationScope`, `Combobox`, `SegmentedLinks`, and the `@/schemas` folder if it ends up empty) goes too. The builder proves each is unused before deleting it.
- **Navigation:** `blog` and `contact` leave `siteNav`; `projects` becomes `experience`.
- **Database:** `src/db/`, `drizzle.config.ts`, `e2e/meta-db.ts`, scripts `db:push`, `db:seed` and `db:studio`, dependencies `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, and `@next/env` if nothing else uses it. `DATABASE_URL` leaves `.env.local` handling. e2e tests that read the database read the content files instead.
- **The Neon database and its Vercel integration** are deleted last, as a separate step. The owner confirms first, and the exact actions are shown before they run (project rule for irreversible steps).

## Constraints

- Project rules in `CLAUDE.md` apply: FSD boundaries, component style, Server Components by default, one-line rendering comment per page, staging instead of commits, the definition of done (`test:run`, `test:e2e`, `lint`, `tsc`, `build`).
- **Portable Markdown:** CommonMark + GFM only, no HTML blocks, no MDX. Paths stay stable and predictable (`messages/<locale>/<section>/<slug>.md`), because the future CV repository will read them from this public repository.
- Blob URLs stay as they are; `images.remotePatterns` keeps allowing only the project's store.
- Site behaviour stays the same: `hiddenFromSearch` is `true`, so pages carry `noindex, nofollow`, and `/favicon.ico` follows `Meta.Common.iconIcoUrl` as it followed the database.

## Documents to update

- New ADR: content in files (supersedes [[ADR-0002 Database and ORM]], [[ADR-0003 Content Localization]], [[ADR-0004 Hand-written Admin]], [[ADR-0014 Metadata in the Database]]). [[ADR-0006 Forms]] and [[ADR-0007 Testing]] (database writes in e2e) are updated.
- [[Content Model]] becomes a content model of the files. [[Localization]] and [[Rendering Strategy]] are updated (no tags, no blog, no contact, no admin rows).
- Blog specs and plans ([[2026-11-03-blog-list-design]], [[2026-11-04-post-page-design]], [[2026-10-30-home-blog]], [[2026-11-03-blog-list]], [[2026-11-04-post-page]]) get `status: dropped` and a one-line note pointing to this spec.
- [[Roadmap]]: the blog stage and its notes, Stage 5, Stage 6 and the Rich text stage are removed or marked dropped; Stage 7 loses Neon; Stage 8 keeps the `hiddenFromSearch` step (now a file edit).
- [[Open Questions]]: questions about the admin, drafts, uploads, contact notifications, a second admin user and the separate `projects` table are closed.
- [[Overview]]: scope and constraints (no Neon limits).
- `CLAUDE.md` Stack, Conventions and Commands sections (Data, Admin, Forms, mutations, `db:*`), and `README.md` if it mentions them.
- Design handoffs for Blog, Post, Contact and Admin are deleted with their folders in `docs/design/` (owner, 2026-11-04; git keeps the history). `docs/design/README.md` and links to them are updated.

## Claude's calls (for the owner to check)

- The export script lives in the session scratchpad, not in the repository.
- No redirect from `/projects` to `/experience`: the site is hidden from search and has no external links to it.
- `docs/design/Projects Page Handoff.md` and `docs/design/projects/` are renamed to `Experience Page Handoff.md` and `docs/design/experience/`, with links updated.
- `cvUrl` stays translatable: a locale's `profile.md` may set its own CV, as `profile_translations.cv_url` allowed.
- Name clash (decided by the owner, 2026-11-04): the Home block `src/widgets/experience` becomes `src/widgets/experience-cards`, and the page widget (today `src/widgets/projects`) becomes `src/widgets/experience`.

## Left to the builder

- The exact key mapping of today's namespaces into `Pages.*`, and of `Meta.*` field names.
- How to compare the site before and after the migration.
- Whether the loader reads with `readFileSync` or async reads under `"use cache"`, and how files reach runtime outputs.
- Whether redundant non-translatable fields in a locale file are a warning, an error, or allowed.
- Order of steps in the plan. Suggested: (1) remove the blog, (2) content layer + export + switch pages + rename to Experience, (3) remove the database from the code, (4) documents, (5) delete the Neon database after the owner's confirmation.
