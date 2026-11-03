---
tags: [adr, metadata, database, seo]
status: accepted
date: 2026-11-03
---

# ADR-0014 Metadata in the Database

## Context
The owner wants to correct every configurable piece of metadata without touching code: the title and description of any page, its link preview image, the site's icons, the site name in link previews, and whether search engines may index the site (2026-11-03). Before this, metadata lived in three places: `profile_translations.meta_description` (Home), `messages/en.json` (About and Projects), and the code (titles assembled from the profile name, the template `src/app/favicon.ico`). The production deployment on `*.vercel.app` was open to indexing.

Spec: [[2026-11-03-meta-tables-design]]. Plan: [[2026-11-03-meta-tables]].

## Decision

### Four tables with the `meta_` prefix (owner's names)
- `meta_site_settings`, a singleton (`CHECK (id = 1)`): `icon_ico_url`, `icon_svg_url`, `icon_png_url`, `apple_touch_icon_url`, `og_placeholder_url`, all nullable, and `hidden_from_search boolean NOT NULL DEFAULT true`.
- `meta_site_settings_translations`: `site_name` and `default_title`, required in `en`.
- `meta_pages`: `key` (unique text: `home`, `about`, `projects`; a page adds its row when it is built) and `og_image_url`.
- `meta_page_translations`: `title` and `description`, required in `en`.

The rules of [[ADR-0003 Content Localization]] apply: what people read as words is translated with a per-field fallback to `en`; URLs of files are not.

### Full text, no references (owner's decision)
A stored title is exactly what the tab and the search result show (`Projects — Mikhail Aleksandrov`). No code adds a name or a separator, there is no `title.template`, and no text refers to another row.

### Reading
- `getSiteMeta(locale)` and `getPageMeta(locale, key)` in `src/db/queries/meta.ts` are `"use cache"` functions with the tag `meta`. The pages stay static; the admin will refresh them with `updateTag("meta")`.
- A missing row throws, so the build fails instead of shipping a page with a generic title (fail fast).
- Pure builders in `src/shared/lib/metadata.ts` turn the rows into Next's `Metadata`. Each page builds its whole `openGraph`, because a page's `openGraph` replaces the layout's as a whole.
- The root layout re-exports `generateMetadata` from `src/views/site-layout/metadata.ts`, because `app` does not import `db`. It sets the default title (a string title in a layout is the default of its children), the icons, and `robots: noindex, nofollow` while the site is hidden.

### Icons
- Every icon URL is optional. While none of the three browser icons is set, the layout emits `<link rel="icon" href="data:,">`, so no browser requests `/favicon.ico` (owner's decision).
- `/favicon.ico` is a route handler: a 307 redirect to `icon_ico_url`, or an empty 404 while it is null. It serves clients that skip the HTML. 307, because browsers keep a 308 forever.
- The order of the links is `.ico` (`sizes="32x32"`), PNG 96, SVG; with `sizes="any"` on the `.ico` Chromium would prefer it over the SVG. No manifest icons (owner's decision).

### `hidden_from_search`
True by default: closed by mistake costs one flag, open by mistake leaves an unfinished site in search results. It is set to false after the domain is connected and the polish is done (Stage 8). While it is true, a future `robots.txt` must allow everything: a crawler that may not load a page never sees its `noindex`.

## Alternatives
- **Messages (`messages/*.json`):** versioned in git and typed, but every correction needs a deployment, and Home already read the database: two sources.
- **Columns on existing entities** (`profile_translations.about_meta_description`, ...): no new tables, but Skills and Projects have no row of their own, and `profile` turns into a catch-all.
- **Defaults in messages, overrides in the database:** works before the admin exists, but two sources of truth for every text.
- **Title as the page part only, or a template with `{name}`:** one place for the name, but the admin would not show what the tab shows, and Home needs a different shape. Full text chosen by the owner.
- **Icons as Next file conventions** (`src/app/icon.png`): hashed URLs and correct tags for free, but a new icon needs a deployment. The owner wants it editable.
- **`NOT NULL` icon URLs:** the tab always has an icon, but the site could not run before the files exist. The owner chose optional URLs and the empty icon.
- **Search Console verification and `theme-color` in the table:** verification goes through DNS once the domain exists; `theme-color` must follow the design tokens and the visitor's chosen theme, so it is code (Stage 8).

## Consequences
- One place for every editable piece of metadata, and the admin (Stage 6) gets one section for it; [[Admin Handoff]] has no design for it yet.
- A new page needs its `meta_pages` row and its key in `PageKey` before its first build.
- `profile_translations.meta_description` is gone (dropped in a one-off transaction, because `db:push` does not compare changed checks). An older commit can no longer be built.
- The foreign key of `meta_site_settings_translations` has an explicit name: the generated one had 68 characters, Postgres cuts names to 63, and drizzle-kit would have recreated it on every push. Long table names need explicit constraint names.
- The database guards the data itself: URLs are `null` or `https://...`, texts are never blank. Hand-written SQL and the admin get the same rules; the admin's Zod schema adds the user-facing messages.
- Until the owner uploads icons the tab shows the browser's default icon, and link previews have no image.
- A change in the tables reaches the site with the next deployment until the admin calls `updateTag`.
