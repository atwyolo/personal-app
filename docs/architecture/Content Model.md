---
tags: [architecture, content]
updated: 2026-11-10
---

# Content Model

All content lives in `messages/` since 2026-11-04 ([[ADR-0015 Content in Files]], [[2026-11-04-content-in-files-design]]), all of it in Markdown since 2026-11-10 ([[ADR-0016 Metadata in Markdown]]). Until then it lived in Neon; the old tables are in git history (`src/db/schema/`, last in commit `be62e92`).

## Conventions

- **English is complete, other locales are partial.** Every file and every required field exists in `en`. Another locale holds only what it translates; anything it leaves out, or sets to `null` or an empty string, comes from English. A missing locale file means the English file.
- **Every locale translates the content** (2026-11-11, [[2026-11-11-content-translations-design]]): `meta.md`, `profile.md`, `about/*.md` and `experience/*.md` hold only translated fields; `skills.md` holds only the domain labels, the skill names stay English. URLs, the phone, the email, dates, `sort`, the `skills` lists and `company` live in `en` alone, so a change there reaches every language; `ru` alone sets `name`, `jobTitle`, `role` and its own `cvUrl`.
- **Tests never read this content** ([[ADR-0017 Test Content Fixtures]]): `contentRoot` is `CONTENT_ROOT` when set, and Playwright builds from the frozen fixtures in `e2e/content/`. Broken content fails `npm run build` through the schemas and the link check, never a test.
- **Store facts, not formatted strings:** dates as `"YYYY-MM-DD"`, the phone as E.164. Display strings (periods, durations, `wa.me` links) are computed at render time with `Intl` / next-intl.
- **Files live in Vercel Blob** (public store), uploaded by hand. Content holds absolute `https://` URLs only.
- **No alt-text fields:** each image uses an existing text as alt (the name, the company, the page title).
- **Validation:** strict Zod schemas in `src/content/schemas.ts` (an unknown field fails), applied after the merge. Errors name the file and the field and stop the build.
- **Order:** by `sort`, then by name or slug in code-point order (uppercase before lowercase), as the database's collation `C` did.

## `messages/<locale>.json`

Interface strings only: one root, `Pages` (`Common` with `Header`, `LocaleMenu`, `ThemeMenu`, `Contacts`, `Carousel`, `SkillRow`, `back`, `newTab`, then the interface texts of `Home`, `About`, `Skills`, `Experience`, and `NotFound` for the 404 page). Every locale translates them ([[Localization]]). These are next-intl messages, and only they reach the browser (`NextIntlClientProvider` in the root layout). Content, metadata included, lives in Markdown since 2026-11-10 ([[ADR-0016 Metadata in Markdown]]).

## Markdown files: `messages/<locale>/`

| File | Frontmatter | Body |
|---|---|---|
| `profile.md` | `name`, `headline`, `jobTitle`, `photoUrl`?, `cvUrl`?, `whatsappPhone` (E.164), `email`, `linkedinUrl` | Home's About tile: lead paragraph, bold results title, bullet list |
| `skills.md` | `domains`: `{ key, label }` in display order; `skills`: `{ name, level 1–10, domain, main?, top?, sort? }` | none |
| `experience/<slug>.md` | `company`, `role`?, `startDate`, `endDate`? (absent = present), `imageUrl`?, `sort`, `skills` (names from `skills.md`), `descriptionShort` | the full description on the Experience page, may be empty |
| `about/<slug>.md` | `sort`, `linkText`, `questionTitle`, `questionMessage`, `answerTitle` | the answer |
| `meta.md` | `Common`: `siteName`, `defaultTitle`, `iconIcoUrl`, `iconSvgUrl`, `iconPngUrl`, `appleTouchIconUrl`, `ogPlaceholderUrl`, `hiddenFromSearch`; `Home`, `About`, `Skills`, `Experience`: `title`, `description`, `ogImageUrl` | none: a body is ignored, but must still be allowed Markdown |

`?` marks optional fields. Notes:

- **`meta.md`:** every key is required in `en`, `null` included. `siteName` (`og:site_name`) and `defaultTitle` (the title of a page without one) are text. `NotFound` holds only `title`, the title of the 404 (2026-11-11). The four icon URLs and `ogPlaceholderUrl` (1200 × 630) may be `null`; while the three browser icons are all `null`, pages carry the empty icon `data:,`, and `/favicon.ico` serves the bytes of `iconIcoUrl`, fetched at build time (since 2026-11-11; a 307 to Blob before, which Vercel served as an empty 200: Vercel serves a prerendered route's body and drops the status and headers it stored, and sets the `content-type` from the extension). Without `iconIcoUrl` the handler answers 404 on `next start`; on Vercel that prerendered 404 would likely come out as the same empty 200. `hiddenFromSearch: true` adds `noindex, nofollow` to every page. A page's `title` and `description` are full text, shown exactly as stored; its `ogImageUrl` may be `null` (falls back to the placeholder). A new page adds its node to `metaSchema` in `src/content/schemas.ts` and its key to `PageKey` in `src/content/meta.ts`. A value with `: ` inside needs quotes.
- **Nested objects merge field by field** (`mergeFields` in `src/content/merge-fields.ts`): a locale's `meta.md` with only `Home.title` keeps the English `Home.description`.
- **Slug = file name.** It is the anchor (`/experience#glovo`, `/about#who`) and is never translated.
- **`skills.md`:** `main` puts a skill in the hero chips (by `sort`, then name); `top` puts it in "My top skills" on Home, without a limit. Skill lists sort by level desc, then `sort`, then name. A domain with no skills is hidden. A locale's `skills.md` translates domain labels; its lists merge by `key` and `name`, never by index, and an item English does not have fails.
- **`cvUrl`** is the Blob `downloadUrl` (`?download=1`), because `<a download>` is ignored cross-origin. A locale may set its own CV.
- **Cross-file checks:** every skill of a job exists in `skills.md`; every skill's domain exists; names and keys are unique.
- **YAML 1.2** (the `yaml` package): an unquoted date stays the string written, and `yes`, `no`, `on`, `off` or `NO` stay text; only `true` and `false` are booleans. Frontmatter is read only from the very first line of the file. A YAML syntax error names the file, line and column.
- **`endDate`** may not be before `startDate`.

## Markdown bodies

CommonMark only: paragraphs, **bold**, *italic*, links, bullet and numbered lists (not nested), hard line breaks, headings. Images, tables, strikethrough, task lists, footnotes, code, block quotes, thematic breaks, nested lists and raw HTML fail the build with the file and the line (`src/content/markdown.ts`, which parses with GFM to see what Google Docs emits), so the files stay portable to the CV repository and render on GitHub. A YAML syntax error names its file too.

- **Links:** a page of the site without the locale (`[About](/about)`, `/experience#glovo`), `#anchor`, `https://` or `http://` (a new tab, announced), `mailto:`, `tel:`. Anything else fails the build; `/en/about` fails with the hint to write `/about`.
- **Headings:** the level in the file sets the size (`#` the largest); the element is shifted below the page's outline, so `#` inside an About answer, which sits under an `h2`, renders as `h3`.
- Google Docs: enable Markdown in Tools → Preferences, then Edit → Copy as Markdown. Styles "Heading 1–6" become `#`…`######`; font sizes and colors are not kept.

## Shared code

`src/content/`: `read.ts` (files, frontmatter, slugs), `localize.ts` (`loadLocalized`), `merge-fields.ts` (the per-field merge, without `server-only`, shared with the e2e helpers), `markdown.ts` (allowed nodes and links), `schemas.ts`, `order.ts`, and one getter module per entity (`profile`, `skills`, `experience`, `about`, `meta`), each a pure `read*` plus a cached `get*`.

Related: [[Localization]], [[Rendering Strategy]]
