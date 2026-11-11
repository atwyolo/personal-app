---
tags: [plan, metadata, database, seo]
status: done
date: 2026-11-03
updated: 2026-11-03
---

# Plan: Metadata tables

Move every configurable piece of metadata into four `meta_` tables, make Home, About, Projects and the root layout read them, and drop the old sources. The checklist in this note is the ledger: a task is ticked when its delta is staged.

Related: [[2026-11-03-meta-tables-design]] (the spec, read it with this plan), [[Content Model]], [[ADR-0002 Database and ORM]], [[ADR-0003 Content Localization]], [[ADR-0007 Testing]], [[Rendering Strategy]].

## Global constraints

- **Stages, not commits.** Every task ends with `git add`. The owner commits.
- **Inline, one task at a time.** Discuss in Russian before a task when something is unclear.
- **TDD** for logic with Vitest. Database-backed output is verified with Playwright, which never writes to the database.
- **Production database:** the exact SQL or command is shown to the owner and confirmed before every write. `drizzle-kit push` asks for confirmation in a terminal, so the owner runs it (`! npm run db:push`).
- **Definition of done for a task:** `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- **Conventions from `CLAUDE.md`:** named exports, no barrels, English in the repository, `@/*` imports, boundaries lint (`app` imports only views and `shared`; `shared` never imports `db`).
- **Next.js:** read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (`title`, `robots`, `icons`, merging) before Task 2, and `03-api-reference/03-file-conventions/route.md` before Task 3.
- **Full text everywhere:** stored titles and descriptions are shown exactly as stored; no code adds a name or a separator.

## Decisions made while planning

- **Column names of the translation keys:** `settings_id` and `page_id`, as `skill_domain_translations` uses `domain_id` rather than the full entity name (Claude's call).
- **One pure module for both builders:** `src/shared/lib/metadata.ts` exports `buildPageMetadata` and `buildSiteMetadata`. Its input types are its own, so `shared` does not import `db`; the query results match them structurally (Claude's call).
- **Icon order** (Claude's call, after the widely used "How to Favicon" practice): `.ico` with `sizes: "32x32"`, then PNG with `sizes: "96x96"`, then SVG with `type: "image/svg+xml"`; apple icon with `sizes: "180x180"`. The `.ico` must not say `sizes="any"`, or Chromium prefers it over the SVG.
- **`/favicon.ico` handler:** `src/app/favicon.ico/route.ts` re-exports `GET` from `src/views/site-layout/favicon.ts`, as routes re-export a view's metadata; the proxy matcher already skips paths with a dot (Claude's call).
- **e2e reads the database** through `e2e/meta-db.ts`, which imports `src/db/load-env` and `src/db` (no `server-only` there) and only selects (Claude's call).
- **`Projects.metaTitle` is renamed `Projects.labelWithoutYears`**: it is the visible label when no job has dates (Claude's call).

## Rulings while building

- **Task 2, Step 5:** one query per function, not a `db.batch`: each read is a single `select` with two joins, so a batch would wrap one statement. If wrong: none, the result is the same.
- **Task 2, Step 8:** the page e2e tests pass on the old code too, by design: the seed reproduced the old values, so "nothing visible changed" is exactly what they prove. The RED step of this task is the unit suite of `buildPageMetadata`. If wrong: a broken read would still be caught, because the tests compare with the database, not with the old code.

- **Task 3, Step 1:** the default title is a plain string in the layout, not `{ default }`: Next's types accept `default` only together with `template`, and the docs define a layout's string `title` as the default of its child segments. If wrong: one line, and the 404 e2e test would catch it.
- **Task 3, Step 6:** no assertion on requests to `/favicon.ico`. A probe showed headless Chromium never requests a favicon, with or without an icon link, so the assertion would pass against broken code. The proof is the single `data:,` link: by the HTML standard a browser falls back to `/favicon.ico` only when a page has no icon link. If wrong: a real browser could still request it, which costs one 404 in the network panel.
- **Task 3, Step 7:** the 404 response's server HTML carries only Next's own `noindex`; our `robots` and title appear in the DOM, as the app version always did there (the existing 404 tests already read the DOM). Search engines read 404 by its status, not by its tags.

- **Task 3, Step 7:** the build's route table does not list `/favicon.ico`, but the manifests do, and the response proves it: an empty 404 body with `x-nextjs-cache: HIT` (prerendered), against Next's own 71 KB 404 page for a missing route. The e2e test now also asserts the empty body; with `route.ts` removed it failed ("Received length: 71966"), with the route it passes. If wrong: none, the test tells the two apart.

- **Task 4, Step 4:** the check push showed a new pair for `meta_site_settings_translations`: the generated foreign key name had 68 characters, Postgres cut it to 63, and drizzle-kit would recreate the key on every push. The schema now declares the key with `foreignKey({ name: "meta_site_settings_translations_settings_id_fk" })` instead of `translationOf`, and the database key was renamed with `ALTER TABLE … RENAME CONSTRAINT` (owner's confirmation). The next push showed only the known `_pk` pairs. If wrong: none, the key's definition did not change.

## Review focus

The cases most likely to bite that no behavior in the spec names. Each has a test in the task that owns the code.

1. **A locale without translations,** `/ru/projects`: the English title, description and site name under `lang="ru"`, with `og:locale` `ru`. Task 2.
2. **The 404 page:** it has the default title, and while the site is hidden it carries `noindex` too. Task 3.
3. **A partial icon set,** e.g. only the SVG: real links, no `data:,`; and the opposite, none set: exactly one `data:,` link and no request to `/favicon.ico`. Task 3 (unit) and Task 3 (e2e for today's state).
4. **The flag reaches every page:** no page's metadata overrides `robots` (Next replaces nested fields by the last segment that defines them). Task 3.
5. **No image anywhere:** no `og:image` tag at all, never one with an empty `content`. Task 2.

---

## Tasks

### Task 1: Tables and seed

**Files:**
- Create: `src/db/schema/meta.ts`
- Modify: `src/db/schema/index.ts`, `src/db/seed/data.ts`, `src/db/seed/index.ts`

**Interfaces:**
- Produces (Drizzle, camelCase keys, snake_case columns):
  - `metaSiteSettings`: `id` (integer, default 1, `CHECK meta_site_settings_singleton`), `iconIcoUrl`, `iconSvgUrl`, `iconPngUrl`, `appleTouchIconUrl`, `ogPlaceholderUrl` (text, nullable), `hiddenFromSearch` (boolean, not null, default true), timestamps.
  - `metaSiteSettingsTranslations`: `settingsId` (`translationOf(() => metaSiteSettings.id)`), `locale`, `siteName`, `defaultTitle` (text); primary key `(settings_id, locale)`; `CHECK meta_site_settings_translations_en_complete`: `locale <> 'en' or (site_name is not null and default_title is not null)`.
  - `metaPages`: `id()`, `key` (text, unique, not null), `ogImageUrl` (text, nullable), timestamps.
  - `metaPageTranslations`: `pageId`, `locale`, `title`, `description`; primary key `(page_id, locale)`; `CHECK meta_page_translations_en_complete` on both.
  - `data.meta`: `{ site: { siteName: string; defaultTitle: string }; pages: { key: "home" | "about" | "projects"; title: string; description: string }[] }`.
  - `seedMeta(): Promise<void>`.

There are no unit tests here: Vitest does not reach the database. The proof is the read-back in Step 6.

- [x] **Step 1: Write the schema** in `src/db/schema/meta.ts` after the pattern of `profile.ts`, and export it from `index.ts`. Comments on each table say what it holds and why the singleton check exists.
- [x] **Step 2: Read today's values** from a production build (`npm run build && npm run start`): `<title>` and `<meta name="description">` of `/en`, `/en/about`, `/en/projects`. Expected: `Mikhail Aleksandrov — Senior Frontend Software Engineer, 8+ years`, `About — Mikhail Aleksandrov`, `Projects — Mikhail Aleksandrov`, and the descriptions from `profile_translations.meta_description`, `About.intro` and `Projects.metaDescription`. Any difference: the live value wins.
- [x] **Step 3: Write `data.meta`** with those values word for word; `siteName` and `defaultTitle` are `Mikhail Aleksandrov`.
- [x] **Step 4: Write `seedMeta()`** and call it in `main()` after `seedAboutPairs`. It inserts the singleton with `onConflictDoNothing()`, then its `en` translation, then each page missing by `key` and its `en` translation, each with `onConflictDoNothing()`. URLs stay null, `hidden_from_search` takes its default. Log what was inserted.
- [x] **Step 5: Create the tables.** The owner runs `! npm run db:push`. Expected: four `CREATE TABLE` statements, their checks and keys, nothing else. The only `DROP` allowed is the known `..._pk` pair from [[ADR-0002 Database and ORM]]; decline and stop on anything else. Then, after confirmation, `npm run db:seed`.
- [x] **Step 6: Read it back** (read-only script in the scratchpad): one settings row, `hidden_from_search = true`, all URLs null, one `en` translation; three pages with their `en` rows matching Step 2. A second `npm run db:seed` inserts nothing.
- [x] **Step 7: Run the definition of done** and stage the task's files.

### Task 2: Page metadata from the tables

**Files:**
- Create: `src/db/queries/meta.ts`, `src/shared/lib/metadata.ts`, `src/shared/lib/metadata.test.ts`, `e2e/meta-db.ts`
- Modify: `src/views/home/metadata.ts`, `src/views/about/metadata.ts`, `src/views/projects/metadata.ts`, `src/widgets/projects/Projects.tsx`, `messages/en.json`, `e2e/metadata.spec.ts`

**Interfaces:**
- Consumes: the tables of Task 1, `localized`, `localizedOptional`, `getLocaleAlternates`, `LocaleAlternates`, `locales`.
- Produces:
  - `src/db/queries/meta.ts` (`server-only`, `"use cache"`, `cacheLife("max")`, `cacheTag(metaCacheTags.meta)`):
    - `metaCacheTags = { meta: "meta" } as const`
    - `type PageKey = "home" | "about" | "projects"`
    - `type SiteMeta = { siteName: string; defaultTitle: string; iconIcoUrl: string | null; iconSvgUrl: string | null; iconPngUrl: string | null; appleTouchIconUrl: string | null; ogPlaceholderUrl: string | null; hiddenFromSearch: boolean }`
    - `type PageMeta = { title: string; description: string; ogImageUrl: string | null }`
    - `getSiteMeta(locale: Locale): Promise<SiteMeta>`: throws `"Site metadata is missing. Run \`npm run db:seed\`."` without the row.
    - `getPageMeta(locale: Locale, key: PageKey): Promise<PageMeta>`: throws ``Metadata of page "${key}" is missing. Run `npm run db:seed`.`` without the row.
  - `src/shared/lib/metadata.ts`:
    - `buildPageMetadata(input: { page: PageMetadataInput; site: { siteName: string; ogPlaceholderUrl: string | null }; locale: Locale; alternates: LocaleAlternates }): Metadata`, where `PageMetadataInput = { title: string; description: string; ogImageUrl: string | null }`.
  - `e2e/meta-db.ts`: `readSiteMeta(): Promise<{ siteName: string; defaultTitle: string; hiddenFromSearch: boolean; iconIcoUrl: string | null; iconSvgUrl: string | null; iconPngUrl: string | null; appleTouchIconUrl: string | null; ogPlaceholderUrl: string | null }>` and `readPageMeta(key: string): Promise<{ title: string; description: string; ogImageUrl: string | null }>`, both for `en`.

- [x] **Step 1: Write the failing unit tests** in `metadata.test.ts` for `buildPageMetadata`, with `page = { title: "Projects — M. A.", description: "D", ogImageUrl: null }`, `site = { siteName: "M. A.", ogPlaceholderUrl: null }`, locale `ru`, alternates of `/projects`:
  - `title` and `description` are the page's, unchanged;
  - `alternates` is passed through;
  - `openGraph` has `type: "website"`, the same title and description, `url` = `alternates.canonical`, `siteName: "M. A."`, `locale: "ru"`, `alternateLocale` = the seven other locales;
  - no `images` key when both URLs are null;
  - `images: [{ url: placeholder, alt: title }]` when only the placeholder is set;
  - the page's own image wins over the placeholder, with the title as `alt`;
  - `robots` is absent (the layout owns it).
- [x] **Step 2: Run them.** `npx vitest run src/shared/lib/metadata.test.ts`. Expected: FAIL, the module is missing.
- [x] **Step 3: Implement `buildPageMetadata`.**
- [x] **Step 4: Run them.** Expected: PASS.
- [x] **Step 5: Write `src/db/queries/meta.ts`.** One `db.batch` per function: settings with its `en` and requested translations through two aliases, or the page by `key` the same way; `localized` for the required texts.
- [x] **Step 6: Switch the three `metadata.ts` files** to `getPageMeta` + `getSiteMeta` + `buildPageMetadata`. Home no longer reads `getProfile`; About and Projects no longer read messages there.
- [x] **Step 7: Messages.** Remove `About.metaTitle` and `Projects.metaDescription`; rename `Projects.metaTitle` to `Projects.labelWithoutYears` and update `Projects.tsx`.
- [x] **Step 8: Write `e2e/meta-db.ts`** and rewrite `e2e/metadata.spec.ts` to expect the database's values instead of literals. For `/en`, `/en/about`, `/en/projects` and `/ru/projects`: `<title>`, the description, `og:title`, `og:description`, `og:site_name`, `og:locale`, canonical and hreflang as today; `og:image` matches `ogImageUrl ?? ogPlaceholderUrl`, or `meta[property="og:image"]` has count 0 when both are null. The `app-version` tests stay.
- [x] **Step 9: Run the definition of done.** Expected: the titles and descriptions are the ones read in Task 1, Step 2: nothing visible changed. Stage the task's files.

### Task 3: Site-wide metadata and `/favicon.ico`

**Files:**
- Create: `src/views/site-layout/metadata.ts`, `src/views/site-layout/favicon.ts`, `src/app/favicon.ico/route.ts`
- Delete: `src/app/favicon.ico`
- Modify: `src/app/[locale]/layout.tsx`, `src/shared/lib/metadata.ts`, `src/shared/lib/metadata.test.ts`, `e2e/metadata.spec.ts`

**Interfaces:**
- Consumes: `getSiteMeta`, `SiteMeta`, `siteUrl`, `appVersion`, `readSiteMeta`.
- Produces:
  - `buildSiteMetadata(input: { defaultTitle: string; iconIcoUrl: string | null; iconSvgUrl: string | null; iconPngUrl: string | null; appleTouchIconUrl: string | null; hiddenFromSearch: boolean }): Metadata` (no `metadataBase` or `other`: the view adds them).
  - `generateMetadata(): Promise<Metadata>` in `src/views/site-layout/metadata.ts`, re-exported by the layout instead of the static `metadata`.
  - `GET(): Promise<Response>` in `src/views/site-layout/favicon.ts`: `Response.redirect(iconIcoUrl, 307)`, or `new Response(null, { status: 404 })` while null. It reads `getSiteMeta("en")`: the icon has no translation.

- [x] **Step 1: Write the failing unit tests** for `buildSiteMetadata`:
  - `title` is `{ default: defaultTitle }` with no `template`;
  - `robots` is `{ index: false, follow: false }` when hidden, absent when not;
  - all three browser icons null: `icons.icon` is `"data:,"` and nothing else, whatever `appleTouchIconUrl` is; the apple icon is still listed when set;
  - only the SVG set: `icons.icon` is exactly `[{ url: svg, type: "image/svg+xml" }]`, no `data:,`;
  - all set: `icons.icon` in the order `.ico` (`sizes: "32x32"`), PNG (`type: "image/png"`, `sizes: "96x96"`), SVG; `icons.apple` is `[{ url, sizes: "180x180" }]`;
  - apple null: no `apple` key.
- [x] **Step 2: Run them.** Expected: FAIL.
- [x] **Step 3: Implement `buildSiteMetadata`.** Run the tests. Expected: PASS.
- [x] **Step 4: Write `src/views/site-layout/metadata.ts`** (locale from `getLocale()`, `getSiteMeta`, `buildSiteMetadata`, plus `metadataBase: siteUrl` and `other: { "app-version": appVersion }`), and replace the layout's `metadata` with `export { generateMetadata } from "@/views/site-layout/metadata";`. Keep the layout's comment on `metadataBase` and the version, moved to the view.
- [x] **Step 5: Write the handler.** `src/views/site-layout/favicon.ts` and `src/app/favicon.ico/route.ts` with its one-line rendering comment, decided after reading the route handler guide: whether `GET` is prerendered with a `"use cache"` read under `cacheComponents`, and how an admin edit would refresh it. Delete `src/app/favicon.ico`.
- [x] **Step 6: Write the e2e tests** in `e2e/metadata.spec.ts`, against `readSiteMeta()` (they follow the code here: Playwright needs the production build of Steps 4–5):
  - on `/en`, `/en/about`, `/en/projects` and the 404 page, `meta[name="robots"]` contains `noindex` and `nofollow` exactly when `hiddenFromSearch` is true, and is absent otherwise. The 404 page may carry Next's own `noindex`; assert there only when hidden;
  - the 404 page's title is `defaultTitle` (in the DOM, as the version test does);
  - with no browser icon in the database: exactly one `link[rel="icon"]`, with `href="data:,"`, and the page makes no request to `/favicon.ico` (`page.on("request")`); otherwise the links follow the database;
  - `GET /favicon.ico` (`request.get`, `maxRedirects: 0`): 404 while `iconIcoUrl` is null, 307 with `location` equal to it otherwise.
  None of them hard-codes the flag or a URL: setting them later must not break the suite.
- [x] **Step 7: Run the definition of done.** Check `data:,` in the built HTML (`curl` the page): `metadataBase` must leave it as is. Stage the task's files, including the deletion.

### Task 4: Drop `profile_translations.meta_description`

**Files:**
- Modify: `src/db/schema/profile.ts`, `src/db/queries/home.ts`, `src/db/seed/data.ts`, `src/db/seed/index.ts`

**Interfaces:**
- Produces: `HomeProfile` without `metaDescription`; `profile_translations_en_complete` without `meta_description`.

- [x] **Step 1: Remove the field** from the schema and its check, from `getProfile` and `HomeProfile`, and from the seed. `npx tsc --noEmit` passes: Task 2 left no reader.
- [x] **Step 2: Check for translated Home data** (read-only, after showing the query): `SELECT locale, name, headline, meta_description FROM profile_translations WHERE locale <> 'en';`. Expected: no rows.
- [x] **Step 3: Show the owner the transaction and run it after confirmation:**
  ```sql
  BEGIN;
  ALTER TABLE profile_translations DROP CONSTRAINT profile_translations_en_complete;
  ALTER TABLE profile_translations DROP COLUMN meta_description;
  ALTER TABLE profile_translations ADD CONSTRAINT profile_translations_en_complete
    CHECK (locale <> 'en' OR (name IS NOT NULL AND headline IS NOT NULL AND job_title IS NOT NULL AND about_short IS NOT NULL));
  COMMIT;
  ```
  If Step 2 returned rows, the transaction first copies them, before `DROP COLUMN`: for each such locale, an `INSERT INTO meta_page_translations (page_id, locale, title, description)` for `home`, the title as `coalesce(name, en name) || ' — ' || coalesce(headline, en headline)` and the description as `meta_description`, `ON CONFLICT DO NOTHING`. The exact statement is shown with the rows it found.
- [x] **Step 4: Check the schema.** The owner runs `! npm run db:push`. Expected: no changes apart from the known `_pk` pair.
- [x] **Step 5: Run the definition of done** and stage the task's files.

### Task 5: Documents

**Files:**
- Create: `docs/decisions/ADR-0014 Metadata in the Database.md` (from `docs/templates/`)
- Modify: `docs/architecture/Data Model.md`, `docs/architecture/Rendering Strategy.md`, `docs/project/Roadmap.md`, `docs/project/Open Questions.md`, `docs/design/Admin Handoff.md`, `docs/specs/2026-11-03-skills-page-design.md`, `docs/specs/2026-11-03-meta-tables-design.md`, `docs/Home.md`, `docs/journal/2026-11-03.md`

- [x] **Step 1: ADR-0014:** the four tables, full text, translated texts and untranslated URLs, the fail-fast reads, `hidden_from_search` and its `robots.txt` rule, the alternatives (messages, columns on `profile`, overrides, templates).
- [x] **Step 2: The rest,** as listed in the spec's "Documents to update", plus the plan and spec statuses, the links in `Home.md`, and the journal.
- [x] **Step 3: Stage** the documents.

## Final review

A fresh reviewer read the whole staged diff against the spec and this plan: no Critical, no Important findings, "Ready to merge: Yes". It confirmed the five Review focus cases in the built HTML (`.next/server/app/ru/projects.html`, `noindex` and `data:,` in the static `<head>`) and the `meta` cache tag on the prerendered `/favicon.ico`.

- Final: fixed (documentation, required before a commit by `CLAUDE.md`): the spec said `title: { default }`; the home page spec still described `meta_description` as current.
- Final: Ruling: Next's own 404 for dotted paths the proxy skips (`/wp-login.php`) carries only Next's `noindex` — unchanged by this work, a 404 status is not indexed — cost if wrong: none.
- Final: Ruling: `cacheLife("max")` may pull a database edit after 30 days without a deployment — the project-wide pattern, and a fresher page is what the owner wants — cost if wrong: none.
- Final: Ruling: `data:,` is verified in Chromium only — the owner's decision; by the HTML standard any icon link stops the `/favicon.ico` fallback — cost if wrong: one 404 request in WebKit or Firefox.
- Final: Ruling: the `/favicon.ico` handler lives in `views` — `app` may not import `db`, and routes already re-export views — cost if wrong: a move of one file.
- Final: fixed at the owner's request: `/ru/projects` e2e compared with English rows. `e2e/meta-db.ts` reads the requested locale with the site's per-field fallback (`localized`).
- Final: fixed at the owner's request: an empty string instead of `null` skipped the fallbacks, and a relative `icon_ico_url` would make `Response.redirect` throw at build. Four checks guard the data now, for hand-written SQL and the future admin alike (owner chose the database over code-side guards): `meta_site_settings_urls_absolute` and `meta_pages_og_image_url_absolute` (`null` or `^https://`), `meta_site_settings_translations_not_blank` and `meta_page_translations_not_blank` (`btrim(...) <> ''`; `null` still means "fall back to en"). A read-only count found no violating rows before the push; the push added exactly these four. Zod in the admin stays as the user-facing layer.
- Final: fixed at the owner's request: the seed and `e2e/meta-db.ts` take `PageKey` with `import type`, so the union exists once.
- Final: fixed at the owner's request: the builder's spread comes first in `src/views/site-layout/metadata.ts`, so it cannot replace `metadataBase` or `app-version`.
- Final: fixed at the owner's request: `SiteMetadataInput`/`input` became `BuildSiteMetadataParams`/`params`, as `buildPageMetadata` names its input. `PageMetadataInput` stays: it is the shape of the `page` field, not a function's parameters.

