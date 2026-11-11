---
tags: [spec, metadata, database, seo]
status: done
date: 2026-11-03
updated: 2026-11-03
---

# Metadata Tables Design

Status: **done 2026-11-03.** Plan: [[2026-11-03-meta-tables]].

Related: [[Content Model]], [[Rendering Strategy]], [[ADR-0002 Database and ORM]], [[ADR-0003 Content Localization]], [[ADR-0007 Testing]], [[Admin Handoff]], [[2026-10-29-home-page-design]] (step 4, localized metadata), [[2026-11-03-skills-page-design]] (paused until this is done).

## Intent

The owner wants to correct every configurable piece of metadata without touching code: the title and description of any page, the image of its link preview, the site's icons, its name in link previews, and whether search engines may index the site at all. Today these live in three places: the database (Home's description), `messages/en.json` (About and Projects) and the code (titles assembled from the profile name, the template `favicon.ico`).

All of it moves to four tables with the `meta_` prefix. The admin edits them in Stage 6; until then the seed fills them and the owner changes them by hand.

Storing per-page SEO fields in the database is the common pattern of content-managed sites (Yoast in WordPress, the Payload SEO plugin, the Strapi SEO component). It is the variant A of the discussion of 2026-11-03.

## Scope

**In:**
- The four tables, their seed, their queries.
- Home, About and Projects read their title, description and preview image from the tables.
- The root layout reads the site-wide part: icons, the default title, the site name, `noindex` while the site is hidden.
- `/favicon.ico` follows the database.
- `profile_translations.meta_description` and the metadata messages go away.

**Out:**
- **Admin.** Stage 6. [[Admin Handoff]] has no metadata section yet; it needs one (see Documents to update).
- **The Skills, Blog and Contact pages.** Each adds its `meta_pages` row when it is built. The paused [[2026-11-03-skills-page-design]] takes its title and description from here instead of `SkillsPage.metaDescription`.
- **Blog post SEO.** Stage 4, as nullable fields on `post_translations`.
- **The icon files themselves.** The owner uploads them to Vercel Blob when ready; until then the URLs are null.
- **`robots.txt`, `sitemap.xml`, generated OG images, `theme-color`.** Stage 8; the rule for `robots.txt` is recorded below.
- **`manifest.webmanifest`** and its icons (owner, 2026-11-03).
- **Search Console verification.** By DNS once the domain exists; nothing in the database.

## Decided by the owner

1. **Four tables:** `meta_site_settings`, `meta_site_settings_translations`, `meta_pages`, `meta_page_translations`.
2. **Every text is stored as full text** exactly as it is shown: `Projects — Mikhail Aleksandrov`, not `Projects` plus a name added by code, and no placeholders or references to other rows.
3. **Pages store** `title` and `description`, translated, and `og_image_url`, not translated.
4. **Site settings store the modern full icon set** without the manifest icons: `.ico`, SVG, PNG 96, `apple-touch-icon`, and the OG placeholder. All of them nullable.
5. **`site_name` (`og:site_name`) and `default_title`** are site-wide and translated.
6. **`hidden_from_search`:** while true, every page carries `noindex, nofollow`. It is set to false after the domain is connected and the polish is done.
7. **Translated:** what people read as words (titles, descriptions, the site name). **Not translated:** URLs of files.

## Data

Conventions of [[Content Model]]: every table has `id` (except translations, keyed by `(<entity>_id, locale)`), `created_at`, `updated_at`; translation tables follow the shape described there, with a check that makes the `en` row complete and a per-field fallback to `en`.

### `meta_site_settings` (singleton, `CHECK (id = 1)`, as `profile`)

| Column | Type | Notes |
|---|---|---|
| `icon_ico_url` | text, nullable | `favicon.ico` holding 16, 32 and 48 px. Served at `/favicon.ico` through a redirect. |
| `icon_svg_url` | text, nullable | Vector icon for current browsers; may switch colors for dark mode with `@media` inside the SVG. |
| `icon_png_url` | text, nullable | 96 × 96: browsers without SVG icons; a multiple of 48, as Google Search asks. |
| `apple_touch_icon_url` | text, nullable | 180 × 180: "Add to Home Screen" and bookmarks on iOS. |
| `og_placeholder_url` | text, nullable | 1200 × 630: the link preview image of a page without its own. |
| `hidden_from_search` | boolean, not null, default `true` | `true` adds `noindex, nofollow` to every page. |

The default is `true` (Claude's call): a fresh row or a missed seed keeps the site out of search. Closed by mistake is fixed with one flag; open by mistake leaves an unfinished site in search results for weeks.

### `meta_site_settings_translations`

| Column | Type | Notes |
|---|---|---|
| `site_name` | text | `og:site_name`. Required in `en`. |
| `default_title` | text | The title of any page that sets none: the 404 page today, which has no `<title>` at all now. Required in `en`. |

### `meta_pages`

| Column | Type | Notes |
|---|---|---|
| `key` | text unique | `home`, `about`, `projects` now; `skills`, `blog`, `contact` come with their pages. |
| `og_image_url` | text, nullable | The page's link preview image; null falls back to `og_placeholder_url`. |

`key` is text, not a Postgres enum (Claude's call): a new page adds a row, not a type change. The code names the keys in one union type, so a typo fails the type check.

### `meta_page_translations`

| Column | Type | Notes |
|---|---|---|
| `title` | text | Full `<title>`, `og:title`. Required in `en`. |
| `description` | text | `<meta name="description">`, `og:description`, about 160 characters. Required in `en`. Its length is validated by Zod in the admin, not in the database, as `meta_description` was. |

### `profile_translations.meta_description`

Dropped, and removed from the `profile_translations_en_complete` check. Its value becomes the `en` description of `home`.

### What is not stored, and why

| Item | Reason |
|---|---|
| `canonical`, `hreflang`, `og:url`, `og:locale`, `og:type`, `metadataBase` | Derived in code (`getLocaleAlternates`, `siteUrl`). Search engines cross-check `hreflang` between pages; a hand-edited typo silently disables the whole language group. |
| `og:image:alt` | The Data Model rule: no alt-text fields. The alt is the page's `title`. |
| `og:image` width and height | They would have to stay in sync with the file. |
| `keywords`, `author` | Ignored by Google / adds nothing. |
| Per-page `robots` | Not asked for. Next adds `noindex` to the 404 page itself. |
| `theme-color` | Must match the design tokens and follow the theme the visitor picked, not only the system one: code, Stage 8. |
| Search Console verification | DNS record once the domain exists. |
| JSON-LD | Profile data (`name`, `job_title`, LinkedIn), already in `profile`. |

## Seed

- `src/db/seed/data.ts` gains the `en` values. They reproduce what the pages render today, read from the live pages before writing (Claude's call), so moving to the tables changes nothing visible:
  - `home`: title `{name} — {headline}` as rendered now; description the current `meta_description`.
  - `about`: title `About — {name}`; description the current `About.intro`.
  - `projects`: title `Projects — {name}`; description the current `Projects.metaDescription`.
  - `site_name`: the profile name. `default_title`: the profile name (Claude's draft; the owner may reword).
  - All URLs null; `hidden_from_search` true.
- A `seedMeta` runs on every `db:seed`, after `seedContent`, like `seedAboutPairs`: it inserts the singleton, the pages and their `en` rows only where missing, never overwrites, and a second run changes nothing.
- `seedContent` stops writing `meta_description`.

## Database order

One database serves every environment, so each step's exact SQL or command is shown to the owner and confirmed first.

1. `npm run db:push` with the four new tables only. Additive: the deployed builds do not notice.
2. `npm run db:seed`: fills the tables.
3. The code switches to the tables (see Reading).
4. A read-only check for translated Home data: `SELECT locale, meta_description, headline FROM profile_translations WHERE locale <> 'en'`. The seed writes only `en` and the other message files are empty, so it is expected to return nothing; but a hand-written row would otherwise lose its description, and its Home title would fall back to `en`. If it returns rows, the transaction of step 5 first copies them into `meta_page_translations` for `home` and the same locale (`INSERT ... SELECT`): the description as is, the title as `{name} — {headline}` of that locale, as the page renders it today (Claude's call: carrying the data over costs one statement, losing it cannot be undone).
5. One-off transaction, because `db:push` skips changed checks ([[ADR-0002 Database and ORM]]): replace `profile_translations_en_complete` without `meta_description`, then drop the column. The exact SQL goes into the plan.
6. `npm run db:push` must report no changes.

After step 5 an older commit cannot be rebuilt and an old deployment cannot refresh its cache, as in [[2026-11-03-projects-page-design]]. The owner accepted the same situation then: no domain yet, the deployed builds do not matter.

## Reading

**Queries:** `src/db/queries/meta.ts`, `"use cache"`, `cacheLife("max")`, one new cache tag `meta`, so an admin edit refreshes every page with `updateTag("meta")`. Per-field fallback to `en` with the existing `localized` helper.
- `getSiteMeta(locale)`: the icons, the placeholder, the flag, `site_name`, `default_title`. A missing singleton fails the build, as `getProfile` does.
- `getPageMeta(locale, key)`: the page's title, description and image. **A missing row fails the build** (Claude's call): a page without its row is a bug, and a loud build error finds it before the visitors do. A silent fallback to `default_title` would hide it.

**Building `Metadata`:** a pure function in `src/shared/lib/` takes plain data (the page's meta, the site meta, the alternates) and returns Next's `Metadata` object. It imports no `db`, so `shared` stays below the database and the function is unit-tested. Every page's `metadata.ts` becomes: read the two queries, call the function. This also ends the repetition of `og:type`, `og:site_name` and `og:locale` in every file: `openGraph` replaces the layout's object as a whole, so the fields cannot live in the layout, but they can live in one function.

**Per page** (`home`, `about`, `projects`): `title`, `description`, `alternates`, and `openGraph` with `type: "website"`, the same title and description, `url`, `siteName` from `site_name`, `locale`, `alternateLocale`, and `images` from `og_image_url ?? og_placeholder_url` with the title as `alt`; no `images` when both are null.

**Root layout:** `src/app/[locale]/layout.tsx` re-exports `generateMetadata` from `src/views/site-layout/metadata.ts`, because `app` does not import `db` (the reason a title template was postponed on 2026-10-29). It returns:
- `metadataBase` and `other.app-version`, as today;
- `title: default_title`, no `template`: titles are full text. Built as a plain string: a layout's string `title` is the default of its children, and Next's types allow `title.default` only together with a `template` (ruling in [[2026-11-03-meta-tables]]);
- `icons` built only from the URLs that are set, in an order that lets each browser pick its format (exact order left to the builder), or the empty `data:,` icon while none of the three browser icons is set (see below);
- `robots: { index: false, follow: false }` while `hidden_from_search` is true; nothing otherwise.

Pages set no `robots`, so the layout's value reaches every page.

**`/favicon.ico`:** the template file `src/app/favicon.ico` is deleted. A route handler at `/favicon.ico` redirects to `icon_ico_url` with a temporary status (307, Claude's call: a permanent 308 is cached by browsers for good, and a new icon would never be picked up), or answers 404 while it is null; a site with no icon shows the browser's default one, which is harmless (owner, 2026-11-03). Browsers and bots request `/favicon.ico` directly when a page has no icon link, so the address must follow the database too. The handler sits where the boundaries lint allows it to reach the query, as the pages do through a view; the exact place is left to the builder.

**No icon set (owner, 2026-11-03):** while `icon_ico_url`, `icon_svg_url` and `icon_png_url` are all null, the layout emits `<link rel="icon" href="data:,">`, an empty icon. The browser then has its answer and never requests `/favicon.ico`: no network request, no 404 in the console in any engine, and a deterministic tag for the tests, instead of depending on how each browser reports a missing icon (the shared Playwright fixture fails on any console error, and Lighthouse's Best Practices counts them). As soon as one of the three URLs is set, the real links replace it. Clients that skip the HTML (bots, feed readers) still request `/favicon.ico` directly and get the handler's answer: 404 now, the redirect once the `.ico` exists. To verify while building: `metadataBase` leaves the absolute `data:,` URL untouched.

**Rendering stays static:** every read is a `"use cache"` function, so the metadata joins the static shell at build time, as Home's does today. Before the admin exists, a change in the tables reaches the site with the next deployment.

## Messages

- `About.metaTitle` and `Projects.metaDescription` are removed. `About.intro` stays: it is the visible hero text.
- `Projects.metaTitle` is also the visible fallback label in `src/widgets/projects/Projects.tsx` when no dates exist. It stays as a message, renamed to say what it is now (the name is left to the builder).

## Rules recorded for later stages

- **Stage 8, `robots.txt`:** while `hidden_from_search` is true, `robots.txt` must allow everything. `Disallow: /` stops crawlers from loading a page, so they never see its `noindex`, and a linked URL can still be indexed without its content.
- **Stage 8:** after the domain is connected, set `hidden_from_search` to false and request indexing in Search Console. A forgotten flag keeps a site out of search for months.
- **The flag is not access control.** Anyone with the link still sees the site. Files in Vercel Blob (the CV, the photo) live on another domain and do not get the page's `noindex`.
- **Vercel:** preview deployments already send `X-Robots-Tag: noindex`; the production deployment on `*.vercel.app` does not, which is why the flag matters now.

## Tests

[[ADR-0007 Testing]]. The database is the production one; tests only read.

- **Vitest:** the metadata builder: per-page fields, the image fallback chain and its alt, no `images` when both URLs are null, `robots` only while hidden, `icons` only from set URLs, the `data:,` icon when none is set, the default title.
- **Playwright** (`e2e/metadata.spec.ts` grows): on Home, About and Projects, `<title>`, the description and `og:*` match the database; `robots` matches `hidden_from_search` read from the database, never a hard-coded value, so flipping the flag does not break the suite; the 404 page has the default title; `/favicon.ico` answers according to the database; no console errors.
- Definition of done for every step: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Documents to update when this is done

- New ADR in `docs/decisions/`: metadata in the database, the four tables, the fallback and the `hidden_from_search` rule.
- [[Content Model]]: a "Metadata entities" section; `meta_description` leaves `profile_translations`.
- [[Rendering Strategy]]: the root layout reads cached metadata; the `meta` tag.
- [[Roadmap]]: this work as done; the two Stage 8 items above.
- [[Admin Handoff]]: a note that a metadata section is needed (site settings and per-page fields), to be designed before Stage 6.
- [[Open Questions]]: the admin's metadata section design.
- [[2026-11-03-skills-page-design]]: metadata from `meta_pages`, `SkillsPage.metaDescription` dropped.

## Left to the builder

- The order of icon links and their `type` and `sizes` attributes.
- Where the `/favicon.ico` handler lives within the boundaries rules.
- The new name of `Projects.metaTitle`.
- How the e2e suite reads the database (read-only).
- Step order inside the plan, keeping the database order above.
