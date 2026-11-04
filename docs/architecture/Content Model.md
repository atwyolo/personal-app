---
tags: [architecture, content]
updated: 2026-11-04
---

# Content Model

All content lives in `messages/` since 2026-11-04 ([[ADR-0015 Content in Files]], [[2026-11-04-content-in-files-design]]). Until then it lived in Neon; the old tables are in git history (`src/db/schema/`, last in commit `be62e92`).

## Conventions

- **English is complete, other locales are partial.** Every file and every required field exists in `en`. Another locale holds only what it translates; anything it leaves out, or sets to `null` or an empty string, comes from English. A missing locale file means the English file.
- **Store facts, not formatted strings:** dates as `"YYYY-MM-DD"`, the phone as E.164. Display strings (periods, durations, `wa.me` links) are computed at render time with `Intl` / next-intl.
- **Files live in Vercel Blob** (public store), uploaded by hand. Content holds absolute `https://` URLs only.
- **No alt-text fields:** each image uses an existing text as alt (the name, the company, the page title).
- **Validation:** strict Zod schemas in `src/content/schemas.ts` (an unknown field fails), applied after the merge. Errors name the file and the field and stop the build.
- **Order:** by `sort`, then by name or slug in code-point order (uppercase before lowercase), as the database's collation `C` did.

## `messages/<locale>.json`

```
Meta
  Common       siteName, defaultTitle, iconIcoUrl, iconSvgUrl, iconPngUrl, appleTouchIconUrl, ogPlaceholderUrl, hiddenFromSearch
  Home         title, description, ogImageUrl
  About        …
  Skills       …
  Experience   …
Pages
  Common       Header, LocaleMenu, ThemeMenu, Contacts, Carousel, SkillRow, back, newTab
  Home / About / Skills / Experience   interface texts of each page
```

- `Meta.Common`: `siteName` (`og:site_name`) and `defaultTitle` (the title of a page without one, e.g. 404) are required. The four icon URLs and `ogPlaceholderUrl` (1200 × 630) may be `null`; while the three browser icons are all `null`, pages carry the empty icon `data:,`, and `/favicon.ico` redirects (307) to `iconIcoUrl` or answers 404. `hiddenFromSearch: true` adds `noindex, nofollow` to every page.
- `Meta.<Page>`: `title` and `description` are full text, shown exactly as stored; `ogImageUrl` may be `null` (falls back to the placeholder). A page without its node fails the build. A new page adds its node and its key to `PageKey` in `src/content/meta.ts`.
- `Pages`: next-intl messages. Only `Pages` reaches the browser (`NextIntlClientProvider` in the root layout).

## Markdown files: `messages/<locale>/`

| File | Frontmatter | Body |
|---|---|---|
| `profile.md` | `name`, `headline`, `jobTitle`, `photoUrl`?, `cvUrl`?, `whatsappPhone` (E.164), `email`, `linkedinUrl` | Home's About tile: lead paragraph, bold results title, bullet list |
| `skills.md` | `domains`: `{ key, label }` in display order; `skills`: `{ name, level 1–10, domain, main?, top?, sort? }` | none |
| `experience/<slug>.md` | `company`, `role`?, `startDate`, `endDate`? (absent = present), `imageUrl`?, `sort`, `skills` (names from `skills.md`), `descriptionShort` | the full description on the Experience page, may be empty |
| `about/<slug>.md` | `sort`, `linkText`, `questionTitle`, `questionMessage`, `answerTitle` | the answer |

`?` marks optional fields. Notes:

- **Slug = file name.** It is the anchor (`/experience#glovo`, `/about#who`) and is never translated.
- **`skills.md`:** `main` puts a skill in the hero chips (by `sort`, then name); `top` puts it in "My top skills" on Home, without a limit. Skill lists sort by level desc, then `sort`, then name. A domain with no skills is hidden. A locale's `skills.md` translates domain labels; its lists merge by `key` and `name`, never by index, and an item English does not have fails.
- **`cvUrl`** is the Blob `downloadUrl` (`?download=1`), because `<a download>` is ignored cross-origin. A locale may set its own CV.
- **Cross-file checks:** every skill of a job exists in `skills.md`; every skill's domain exists; names and keys are unique.
- **Dates:** quote them (`"2021-03-01"`). An unquoted date, which YAML reads as a `Date`, is accepted and converted back.

## Markdown bodies

CommonMark only: paragraphs, **bold**, *italic*, links, bullet and numbered lists, hard line breaks, headings. Images, tables, code, block quotes, thematic breaks and raw HTML fail the build with the file and the line (`src/content/markdown.ts`), so the files stay portable to the CV repository and render on GitHub.

- **Links:** a page of the site without the locale (`[About](/about)`); a web address opens in a new tab and says so.
- **Headings:** the level in the file sets the size (`#` the largest); the element is shifted below the page's outline, so `#` inside an About answer, which sits under an `h2`, renders as `h3`.
- Google Docs: enable Markdown in Tools → Preferences, then Edit → Copy as Markdown. Styles "Heading 1–6" become `#`…`######`; font sizes and colors are not kept.

## Shared code

`src/content/`: `read.ts` (files, slugs), `localize.ts` (merge, `loadLocalized`), `markdown.ts` (allowed nodes, plain text), `schemas.ts`, `order.ts`, and one getter module per entity (`profile`, `skills`, `experience`, `about`, `meta`), each a pure `read*` plus a cached `get*`.

Related: [[Localization]], [[Rendering Strategy]]
