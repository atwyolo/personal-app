---
tags: [plan, content, i18n, architecture]
status: in-progress
date: 2026-11-04
updated: 2026-11-04
---

# Plan: Content in files

Remove the blog, move every page and all metadata from Neon into `messages/`, rename Projects to Experience, then remove the database from the code and, after the owner's confirmation, from Neon. The checklist in this note is the ledger: a task is ticked when its delta is staged.

**Goal:** the site renders from files only (`messages/<locale>.json` + `messages/<locale>/**.md`), with no database code.

**Architecture:** `src/content/` replaces `src/db/` outside the FSD layers. Server-only getters keep today's names and return shapes. Each reads Markdown with frontmatter (`gray-matter`), merges the locale over `en` per field, validates with Zod, and stays a `"use cache"` function without tags. Metadata comes from `Meta.*` of the merged messages. Markdown bodies render through `react-markdown` in `src/shared/ui/Markdown.tsx`.

**Tech stack:** Next 16 (Cache Components), next-intl 4, Zod 4, `gray-matter`, `react-markdown`, `unified` + `remark-parse`, Vitest, Playwright.

**Spec:** [[2026-11-04-content-in-files-design]] (read it with this plan).

Related: [[Data Model]], [[Localization]], [[Rendering Strategy]], [[ADR-0007 Testing]].

## Global constraints

- **Stages, not commits.** Every task ends with `git add` of its whole delta, new files included. The owner commits. At the end of each task, ask the owner per `CLAUDE.md` (agree, commit, version bump with level and resulting version against `origin/develop`).
- **One commit per task, no version bump (owner, 2026-11-04).** After each task the owner commits; the version question is not asked for this plan.
- **Inline, one task at a time**, explained in Russian in the chat.
- **TDD** for logic and client components (Vitest). Pages are verified with Playwright against a production build.
- **Definition of done for a task:** `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- **Conventions from `CLAUDE.md`:** named exports, `FC<Props>` with props destructured on the first line, no barrels, English in the repository, PascalCase for JSX files, kebab-case otherwise, a one-line rendering comment on every page file.
- **Portable Markdown:** CommonMark only. Allowed node types: `root`, `paragraph`, `text`, `strong`, `emphasis`, `link`, `list`, `listItem`, `break`, `heading`. Anything else fails the build with the file named.
- **Nothing visible changes** except the rename (navigation label and `<title>` say "Experience"; the page label stays `Projects · {from} — {to}`) and the removed Blog and Contact links.
- **Irreversible steps** (Task 10): the exact actions are shown to the owner and confirmed first.
- **Next.js docs to read first:** `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` ("Prerendering": `readFileSync` vs `await readFile`) before Task 6; `03-api-reference/05-config/01-next-config-js/output.md` (`outputFileTracingIncludes`) before Task 6.

## Decisions made while planning (Claude's calls, reported to the owner)

- **No `remark-gfm`.** Decision 14 lists only CommonMark elements, so GFM (tables, strikethrough, task lists, bare-URL autolinks) adds nothing allowed. YAGNI.
- **Dates in frontmatter:** a quoted `"2021-03-01"` is the documented form. An unquoted date, which YAML turns into a `Date`, is accepted too and converted back to `YYYY-MM-DD`, so the most likely typo does not fail the build.
- **`null` in a locale's messages means "fall back to `en`"**, as `null` meant in the translation tables. Booleans and numbers override. `mergeMessages` learns non-string leaves.
- **Runtime reads:** the getters read with `fs.readFileSync` under `"use cache"`. Unknown paths render the 404 at request time, and the layout's header reads the profile, so `messages/**/*.md` is added to every server trace with `outputFileTracingIncludes: { "/**": ["./messages/**/*.md"] }`. Verified in `.next/server/**/*.nft.json`.
- **Heading sizes** (no design exists): level 1 `text-xl lg:text-2xl`, level 2 `text-lg lg:text-xl`, levels 3–6 `text-base`, all `font-semibold text-foreground`. The element is `h{min(level + headingOffset, 6)}`.
- **Links:** `http(s)` links open in a new tab with `rel="noopener noreferrer"` and the visually hidden `Pages.Common.newTab` suffix. Others (`mailto:`, `#anchor`, `/path`) open in place.
- **Names after the rename (owner, 2026-11-04):** the Home block `src/widgets/experience` becomes `src/widgets/experience-cards` (`ExperienceCards`); the page widget `src/widgets/projects` becomes `src/widgets/experience` (`Experience`, `ExperienceSection`, `ExperienceBar`, `ExperienceColumn`, `experience-job.ts`); data attributes `data-projects-*` become `data-experience-*`; the view is `src/views/experience/ExperiencePage.tsx`. The feature `src/features/experience-card` keeps its name (one card of `experience-cards`). Claude's call: the data type `Experience` from the getters becomes `ExperienceEntry`, so it does not clash with the `Experience` component in the same files.
- **Baseline for "nothing visible changes":** a scratchpad Playwright script saves, per URL, the visible text of `<main>` and `<header>`, the `<head>` metadata (title, description, `og:*`, canonical, hreflang, robots, icons) and the JSON-LD. It runs before Task 1 and after Task 6; the diff must contain only the expected changes.

## Review focus

1. **A locale page with no locale files at all** (`/ru/about`, `/ja/experience`) must render the `en` content in full. Test: Task 3 (`loadLocalized` with no locale file) and Task 6 (e2e on `/ru`).
2. **A runtime render** (`/en/no-such-page`, which renders the header with the profile name) must not throw `ENOENT` on Vercel. Test: Task 6 trace check plus the e2e 404 test.
3. **A pasted Google Docs body** with escapes (`\.`, `\-`), hard breaks and a heading must render as text, not as literal backslashes or a rejected node. Test: Task 3 (`assertAllowedMarkdown` accepts it) and Task 4 (`Markdown` renders it).
4. **A Markdown body containing raw HTML** (`<img onerror>`) must fail the build, never render. Test: Task 3.
5. **An experience file naming a skill missing from `skills.md`** must fail the build with both names. Test: Task 3.

---

## Task 0: Baseline

**Files:** scratchpad only (`$SCRATCH/baseline/capture.ts`, `$SCRATCH/baseline/before.json`).

- [x] Run the definition of done on the current tree; everything is green. Record any pre-existing failure before going on. *Done: unit 376/376, e2e 585 passed / 131 skipped (viewport-specific), lint and tsc clean.*
- [x] Write `capture.ts`: it starts from a running `npm run start -- --port 3100` and visits `/en`, `/en/about`, `/en/projects`, `/en/skills`, `/ru`, `/ru/projects`, `/en/no-such-page`. For each it saves the fields listed under "Baseline" above to a JSON file named by its argument. It is run with `node --experimental-strip-types` from the project root, with `@playwright/test` resolved through `createRequire` on the project's `package.json`.
- [x] Run it, save `before.json`. Nothing is staged. *Done: 7 URLs; a second run gave an identical file, so the capture is deterministic. Ruling: the script is `capture.mjs` (plain JS, no type stripping needed) and also records the tag sequence of `<main>`, so a lost `<strong>` or list item shows up even when the text is intact.*

## Task 1: Remove the blog

**Files:**
- Delete: `src/app/[locale]/blog/**`, `src/views/blog/`, `src/views/post/`, `src/widgets/blog/`, `src/widgets/blog-list/`, `src/widgets/post/`, `src/features/post-card/`, `src/features/tag-search/`, `src/features/reading-progress/`, `src/schemas/`, `src/db/queries/blog.ts`, `e2e/blog.spec.ts`, `e2e/home-blog.spec.ts`, `e2e/post.spec.ts`.
- Delete if `grep -r` shows no other importer after the above: `src/shared/ui/Pagination.tsx`, `PageSizeSwitch.tsx`, `NavigationScope.tsx`, `Combobox.tsx`, `SegmentedLinks.tsx` (with tests), `src/shared/lib/page-range.ts` (with test), and any `src/shared/shadcn` file only `Combobox` used.
- Modify: `src/views/home/HomePage.tsx` (drop `<Blog />`), `src/db/queries/home.ts` (drop `getLatestPosts`, `PostPreview`, the `posts`/`postTopics` tags), `src/shared/lib/site-nav.ts` (drop `blog`, `contact`), `messages/en.json` (drop `BlogPage`, `Post`, `Home.blog`, `Header.nav.blog`, `Header.nav.contact`), `eslint.config.mjs` (drop the `actions` and `schemas` elements and their policies), `e2e/header.spec.ts`, `e2e/header-nav.spec.ts`, `e2e/metadata.spec.ts` (drop the `blog` row), `src/features/mobile-nav/MobileNav.test.tsx`, `src/shared/lib/metadata.ts` (drop `type: "article"`).
- `src/db/schema/posts.ts` and the seed stay until Task 8; nothing pushes the schema in between.

- [x] Update the navigation tests first: `MobileNav.test.tsx` expects `["Home", "About", "Projects", "Skills"]`; `header.spec.ts` expects the same labels and `["/de", "/de/about", "/de/projects", "/de/skills"]`; the mobile-menu click test follows "Skills" to `/en/skills` instead of "Blog"; `header-nav.spec.ts` samples `["Skills", "About"]` and loops over `["About", "Projects", "Skills"]`. Run: they fail.
- [x] Delete and modify as listed. Run `npx tsc --noEmit` and `npm run lint` until clean; every remaining import error points at blog code to remove, never at code to keep.
- [x] Definition of done. Stage the delta (`git add -A src e2e messages eslint.config.mjs`). *Done: unit 256/256, e2e 491 passed / 123 skipped, lint, tsc and build clean.*
  - Ruling: `src/features/reading-progress` stays: the Projects page uses it too, so it was not blog-only. Cost if wrong: none, `tsc` proved the use.
  - Ruling: also deleted as blog-only, proved by `grep`: `ChipLinks` (+ test) and the generated `shadcn/ui/input-group.tsx` and `textarea.tsx`, which only `Combobox` used. Cost if wrong: `npx shadcn add input-group` restores them.
  - Ruling: `Chip` lost its link mode (`href`, `selected`): only the blog's tag filter used it. Cost if wrong: a few lines to restore from git.
  - Ruling: the e2e test "mobile navigation to a missing page" became "mobile navigation" and follows Skills: every remaining nav item has a page, so no 404 is expected. The desktop indicator's interruption test goes Skills → About instead of Contact → About (the farthest item now).

## Task 2: `Pages` namespace and narrow client messages

**Files:**
- Modify: `messages/en.json`, every `useTranslations` / `getTranslations` call (listed by `grep -rn "Translations(" src`), tests that render with `messages`, `src/app/[locale]/layout.tsx`, `src/shared/lib/i18n/merge-messages.ts` + test.
- Create: `src/shared/lib/i18n/load-messages.ts` (moved out of `request.ts`).

**Interfaces:**
- Produces: `loadMessages(locale: Locale): Promise<MessagesTree>` and `loadMergedMessages(locale: Locale): Promise<MessagesTree>` in `load-messages.ts`; `MessagesTree` leaves are `string | number | boolean | null | MessagesTree`.

Key mapping (`messages/en.json` root becomes `{ "Pages": { … } }`; `Meta` arrives in Task 5):

| Today | Becomes |
|---|---|
| `Common.*` | `Pages.Common.*` |
| `Header`, `LocaleMenu`, `ThemeMenu`, `Contacts`, `Carousel`, `SkillRow` | `Pages.Common.<same>` |
| `Home` | `Pages.Home` |
| `About` | `Pages.About` |
| `SkillsPage` | `Pages.Skills` |
| `Projects` | `Pages.Experience` |

- [x] Tests in `merge-messages.test.ts`: `null` in overrides keeps the fallback value; `false` overrides `true`; a number overrides; a `null` fallback leaf is replaced by an override object or string. Run: fail.
- [x] Widen `MessagesTree` and make `mergeMessages` pass the tests. Move `loadMessages` and the merge into `load-messages.ts`; `request.ts` calls `loadMergedMessages`.
- [x] Move the keys as in the table and update every namespace string. `AppConfig` types keep checking the keys; `tsc` lists any missed call.
- [x] Layout: `const messages = await getMessages();` and `<NextIntlClientProvider messages={{ Pages: messages.Pages }}>`. A test is not practical here; Task 5 verifies in the build output that `Meta` is absent from client chunks.
- [x] Definition of done (all e2e green: no visible change). Stage. *Done: unit 261/261, e2e 491 passed / 123 skipped, lint, tsc and build clean. The baseline diff shows only Task 1's removals (Blog and Contact in the header, the Blog block on Home).*
  - Ruling: "a string replaces a null fallback" passed before the change (the string branch already did it); kept as a guard of the new `null` handling. Cost if wrong: none.
  - Ruling: added `load-messages.test.ts` (a locale with no translations gets the full English tree), not in the plan: the moved loader had no test of its own. It passed at once, being a move of tested code. Cost if wrong: none.

## Task 3: Content core

**Files:**
- Create: `src/content/read.ts`, `src/content/localize.ts`, `src/content/markdown.ts`, `src/content/schemas.ts`, with colocated tests and fixtures under `src/content/__fixtures__/messages/{en,ru}/…`.
- Modify: `package.json` (dependencies `gray-matter`, `unified`, `remark-parse`; versions from `npm view`, latest stable), `eslint.config.mjs` (element `content` for `src/content`, same policies as `db`; `src/content/**/__fixtures__` ignored by boundaries).

**Interfaces (all server-side, `import "server-only"` in every non-test file except `schemas.ts`):**
- `readContentFile(root: string, locale: Locale, path: string): ContentFile | null` with `ContentFile = { data: Record<string, unknown>; body: string; file: string }`. Reads `<root>/<locale>/<path>` with `fs.readFileSync`; `null` when the file does not exist; `file` is the repository-relative path, used in every error.
- `mergeFields<T extends Record<string, unknown>>(en: T, locale: Partial<T> | undefined, lists?: Record<string, string>): T`: per-field merge; `null`, `undefined` and `""` fall back; `lists` maps a field name to the key that identifies its items (`{ domains: "key", skills: "name" }`), merged by that key, never by index.
- `loadLocalized<S extends z.ZodType>(params: { root: string; locale: Locale; path: string; schema: S; lists?: Record<string, string> }): z.infer<S> & { body: string; slug: string }`: reads `en` (missing `en` throws `Content file missing: messages/en/<path>`), merges the locale file if present (a body replaces the `en` body only when non-empty), validates with `schema`, and throws `Invalid content in <file>: <field path>: <message>` on failure. `slug` is the file name without `.md`.
- `listSlugs(root: string, dir: string): string[]` lists `en/<dir>/*.md`.
- `assertAllowedMarkdown(source: string, file: string): void` walks the `remark-parse` tree and throws `Unsupported Markdown "<type>" in <file>, line <n>` for any type outside the allowed list.
- `markdownToPlainText(source: string): string`: text content, blocks joined by `\n`.
- Zod schemas `profileSchema`, `skillsSchema`, `experienceSchema`, `aboutPairSchema` with the frontmatter fields of the spec's table; dates as `isoDate` (`z.iso.date()` or a `Date` converted to `YYYY-MM-DD`); `whatsappPhone` E.164 (`/^\+[1-9]\d{6,14}$/`); `level` integer 1–10; URLs `https://` or absent.

- [x] Write the failing tests:
  - `loadLocalized` with no `ru` file returns the `en` data (Review focus 1).
  - A `ru` file with only `name` keeps every other `en` field and the `en` body.
  - A `ru` file whose `en` counterpart is missing throws.
  - Skills: a `ru` `skills.md` with `domains: [{ key: "core", label: "Основа" }]` changes only that label, whatever the order.
  - An `en` level of 11 throws with `messages/en/skills.md` and `skills.3.level` in the message.
  - An unquoted YAML date becomes `"2021-03-01"`.
  - `assertAllowedMarkdown` accepts `"# Title\n\nLine one  \nline two \\- escaped\n\n1. a\n2. *b* **c** [d](https://x.dev)"` (Review focus 3) and rejects `"<img src=x onerror=alert(1)>"` with `"html"` (Review focus 4), `"![a](b.png)"` with `"image"`, `"> q"` with `"blockquote"`, a fenced code block with `"code"`.
  - `markdownToPlainText("Lead.\n\n**Results:**\n\n- One\n- Two")` is `"Lead.\nResults:\nOne\nTwo"`.
- [x] Run: fail. Implement. Run: pass.
- [x] Definition of done. Stage. *Done: 30 new tests (unit 291/291), e2e 491 passed / 123 skipped, lint, tsc and build clean.*
  - Ruling: `mdast-util-from-markdown` (+ `@types/mdast`, dev) instead of `unified` + `remark-parse`: the loader only needs the syntax tree, and that package is the parser `remark-parse` wraps, so one dependency instead of two and the same tree `react-markdown` builds. Cost if wrong: swap one import.
  - Ruling: `mergeFields` and `loadLocalized` live in `localize.ts`, `readContentFile` and `listSlugs` in `read.ts`; `listSlugs` also rejects a locale file with no English counterpart (the spec's rule, which `loadLocalized` alone cannot see). Cost if wrong: a move.
  - Ruling: a locale list item whose key English lacks throws (`domains: no English item with key "cor"`), the item-level form of the same rule. Cost if wrong: a translation typo stops the build instead of being ignored.
  - Ruling: schemas are `z.strictObject`, so a misspelt optional field (`endDat`) fails instead of being dropped. Cost if wrong: none found.
  - Ruling: tests build their files in a temporary folder (`test-tree.ts`) instead of `__fixtures__/`: each test shows the files it reads. Error messages name the file relative to the working directory, so the tests match the path's tail.
  - Ruling: Vitest maps `server-only` to its empty `react-server` entry (`vitest.config.mts`), as the Next.js testing guide does for Jest.

## Task 4: `Markdown` component

**Files:**
- Create: `src/shared/ui/Markdown.tsx`, `src/shared/ui/Markdown.test.tsx`.
- Modify: `package.json` (dependency `react-markdown`).

**Interfaces:**
- Produces: `Markdown: FC<MarkdownProps>` with `interface MarkdownProps { source: string; headingOffset?: number; className?: string }`. Same wrapper and list and bold styling as today's `RichText` default size (the `post` size is not ported). Not a client component; reads `Pages.Common.newTab` with `useTranslations`. `skipHtml` is on, as a second guard.

- [x] Failing tests (rendered inside `NextIntlClientProvider` with `en` messages): two paragraphs → two `<p>`; `**b**` → `<strong>` with `font-semibold`; `- a` → `<ul>` with the bullet classes; `1. a` → `<ol>`; `# T` with `headingOffset={2}` → an `<h3>` with the level-1 size classes; `###### T` with `headingOffset={2}` → `<h6>`; `[x](https://a.dev)` → `target="_blank"`, `rel="noopener noreferrer"` and the `(opens in a new tab)` text; `[x](/en/about)` → no `target`; a raw `<img>` in the source renders no `img`; the escaped `\-` renders as `-` (Review focus 3).
- [x] Run: fail. Implement with `react-markdown`'s `components`. Run: pass.
- [x] Definition of done. Stage. *Done: 10 new tests (unit 301/301), e2e 491 passed / 123 skipped, lint, tsc and build clean.*
  - Ruling: links render through the existing `shared/ui/Link` (router for site paths, a new tab for web addresses); `Link.tsx` now exports `isWebHref` so `Markdown` adds the hidden "(opens in a new tab)" exactly when `Link` opens one. Site links in content are written without the locale (`/about`), since one file serves every locale. Cost if wrong: an author writing `/en/about` gets `/en/en/about`; the loader could reject it later.
  - Ruling: the square markers are set on `ul` for its items (`*:` variant), because in react-markdown 10 an `li` cannot tell which list holds it; numbered lists use `list-decimal` with brand-colored mono numbers (Claude's call, no design). The test asserts the list's class instead of the item's. Cost if wrong: a styling tweak.

## Task 5: Export the database to files

**Files:**
- Scratchpad: `$SCRATCH/export/export.ts` (read-only queries, project modules through `createRequire`).
- Create: `messages/en/profile.md`, `messages/en/skills.md`, `messages/en/experience/<slug>.md` (3), `messages/en/about/<slug>.md` (6).
- Modify: `messages/en.json` (add `Meta`).

`Meta` shape in `en.json`:

```json
"Meta": {
  "Common": { "siteName": "…", "defaultTitle": "…", "iconIcoUrl": null, "iconSvgUrl": null, "iconPngUrl": null, "appleTouchIconUrl": null, "ogPlaceholderUrl": null, "hiddenFromSearch": true },
  "Home": { "title": "…", "description": "…", "ogImageUrl": null },
  "About": { … }, "Skills": { … },
  "Experience": { "title": "Projects — Mikhail Aleksandrov", "description": "<today's projects description>", "ogImageUrl": null }
}
```

`Meta.Experience` holds today's `projects` row unchanged; its title becomes "Experience — …" in Task 7, so the Task 6 baseline diff stays empty.

- [x] Show the owner the script's queries (all `select`). Run it. Tiptap JSON → Markdown: `paragraph` → text + blank line, `bold` mark → `**…**`, `bulletList`/`listItem` → `- …`; any other node type stops the script.
- [x] Each written body passes `assertAllowedMarkdown`; each file passes `loadLocalized` with its schema (a scratch check run through Vitest's `--dir` on a temporary test, or `tsx`, then deleted).
- [x] Read the files: field order as in the spec's table, readable YAML, no `null` noise (absent optional fields are omitted).
- [x] Definition of done (nothing reads the files yet, so all green). Stage `messages/`. *Done: 11 Markdown files and `Meta` in `en.json`; unit 301/301, e2e 491 passed / 123 skipped, lint, tsc and build clean. `Meta` keys are in no client chunk and no prerendered HTML/RSC file, while `Pages` strings are in 32 of 47 HTML files (Task 2's check).*
  - Ruling: the script also checks every conversion by parsing the Markdown back with the site's parser and comparing the blocks and bold marks with the Tiptap document; a mismatch stops it. Dates are read as `::text` so no time zone touches them.
  - Ruling: YAML is dumped without line folding (`lineWidth: -1`) and with lists of objects in flow style (`- {name: React, level: 9, …}`), one skill per line. Cost if wrong: formatting only.
  - Ruling: Markdown-significant characters in text are escaped, so the placeholders read `\[2–3 sentences…\]` in the files and `[2–3 sentences…]` on the site. Cost if wrong: the owner removes the backslashes when replacing the placeholders.

## Task 6: Read pages and metadata from files

**Files:**
- Create: `src/content/profile.ts`, `src/content/skills.ts`, `src/content/experience.ts`, `src/content/about.ts`, `src/content/meta.ts`, with tests over the fixtures; `e2e/meta-content.ts`.
- Modify: every importer of `@/db/queries/*` (list: `grep -rln "@/db" src`), `src/widgets/about/About.tsx`, `src/widgets/interview/ui/InterviewPair.tsx`, `src/widgets/projects/ui/ProjectSection.tsx` (`RichText` → `Markdown`, with `headingOffset` 1 under the About section heading, 2 under the `h2` question and under a job's `h2`), `e2e/metadata.spec.ts`, `next.config.ts` (`outputFileTracingIncludes`).
- Delete: `src/shared/ui/RichText.tsx` + test. `src/shared/lib/rich-text.ts` stays until Task 8: the seed and the db schema still import its types.

**Interfaces** (same names and shapes as `src/db/queries/*`, so widgets change only their import path and the rich-text fields):
- `getProfile(locale): Promise<HomeProfile>` with `aboutShort: string` (Markdown); `getExperience(locale): Promise<ExperienceEntry[]>` (today's `Experience` type, renamed) with `descriptionFull: string | null` (empty body → `null`), sorted by `sort`; `getSkills(locale): Promise<SkillList>`; `getTopSkills(): Promise<HomeTopSkills>`; `getAboutPairs(locale): Promise<AboutPair[]>` with `answerMessage: string`, sorted by `sort` then slug.
- `getSiteMeta(locale): Promise<SiteMeta>` and `getPageMeta(locale, key: PageKey): Promise<PageMeta>` with `type PageKey = "Home" | "About" | "Skills" | "Experience"` (the Projects page reads `"Experience"` already), reading `Meta.*` from `loadMergedMessages` and validating with Zod.
- Every getter: `"use cache"` + `cacheLife("max")`, no `cacheTag`. The content root is `path.join(process.cwd(), "messages")`. Cross-file checks run inside `getExperience` and `getSkills` (skills exist, domains exist; unique names).
- `e2e/meta-content.ts`: `readPageMeta(key, locale)` and `readSiteMeta(locale)` with the same return types as `e2e/meta-db.ts`, reading the messages files through `mergeMessages`.

- [x] Failing tests over the fixtures: the getters' shapes; `getExperience` rejects a job whose skill `Vue` is missing from `skills.md`, naming `Vue` and the job file (Review focus 5); `getTopSkills` orders by level desc, then `sort`, then name; `getPageMeta("ru", "About")` falls back to `en` per field.
- [x] Implement the getters; switch every import; replace `RichText` with `Markdown`; switch `metadata.spec.ts` to `meta-content.ts`.
- [x] Add `outputFileTracingIncludes`. After `npm run build`: `grep -l "messages/en/profile.md" .next/server/app/**/*.nft.json` lists the `[locale]` routes, including `[...rest]` (Review focus 2). `grep -rl "hiddenFromSearch" .next/static` finds nothing (client messages are narrowed).
- [x] Definition of done, plus a new e2e test: `/ru/about` shows the first `en` question (Review focus 1).
- [x] Rerun the baseline script into `after.json`; `diff` shows no change. Stage. *Done: unit 308/308, e2e 493 passed / 123 skipped, lint, tsc and build clean; all 11 Markdown files are in the trace of every server route, `[...rest]` and `/favicon.ico` included. Against the database-backed capture after Task 2, the only difference is `li > p` becoming `li` in lists.*
  - Ruling: every getter is split into a pure `read*(root, locale)` (tested on temporary trees) and a `"use cache"` wrapper reading `messages/`; `fixtures.ts` holds the shared test files. Cost if wrong: none.
  - Ruling: `headingOffset` is 2 at all three call sites (Home's About tile, an About answer, a job's description): each text sits under an `h2`. The plan's 1 for the About tile was a slip. Cost if wrong: a heading level.
  - Ruling: ties in names sort by code point (`byCodePoint` in `order.ts`), not `localeCompare`: the database's collation `C` put `RTK Query` before `React` and `styled-components` last, and the first capture caught `localeCompare` reordering the Skills page. Test: "breaks ties by name in code-point order" RED with `localeCompare`, GREEN with the fix. Cost if wrong: a natural, case-insensitive order is one line away if the owner prefers it.
  - Ruling: tight Markdown lists render `li` without an inner `p` (CommonMark), where Tiptap had `li > p`. The text is the same and the `li` is the flex container with the marker, so the layout does not change. Cost if wrong: a visual check of the lists.
  - Finding (not caused by this task): `e2e/projects.spec.ts` "recomputes the bars when the phone turns" fails about once in three parallel runs of the spec, on the committed database-backed version too (checked with the Task 6 work stashed). Reported to the owner; not fixed here.
  - Ruling: comments that named the database, the `meta_` tables, the admin or cache tags now describe the files. `e2e/meta-db.ts` stays unused until Task 8 removes `src/db`.

## Task 7: Projects becomes Experience

**Files:**
- Move: `src/app/[locale]/projects/` → `src/app/[locale]/experience/`; `src/views/projects/` → `src/views/experience/` (`ExperiencePage`); `src/widgets/experience/` → `src/widgets/experience-cards/` first, then `src/widgets/projects/` → `src/widgets/experience/`, with the names from "Decisions"; `e2e/projects.spec.ts` → `e2e/experience.spec.ts`; `docs/design/Projects Page Handoff.md` → `Experience Page Handoff.md`, `docs/design/projects/` → `docs/design/experience/` (with `git mv`).
- Modify: `site-nav.ts` (`{ key: "experience", href: "/experience" }`), `Pages.Common.Header.nav.experience = "Experience"`, `Meta.Experience.title` = `"Experience — Mikhail Aleksandrov"` (and `og:title` with it), `ExperienceCard`'s "Learn more" link (`/experience#<slug>`), every e2e and unit test naming `/projects` or the nav label, `docs/design/README.md` links.

- [ ] Update tests first: navigation labels `["Home", "About", "Experience", "Skills"]` and hrefs `/de/experience`; the page tests at `/en/experience` keep the `h1` `"Projects · 2021 — 2026"`; the metadata test expects the title `"Experience — Mikhail Aleksandrov"`; `/en/projects` returns 404 (no redirect). Run: fail.
- [ ] Rename and move. `grep -rni "projects" src e2e` leaves only the `Pages.Experience` label texts and their tests.
- [ ] Definition of done. Rerun the baseline script: the only differences from `before.json` are the nav label, the URL and the `<title>`/`og:title` of the Experience page. Stage.

## Task 8: Remove the database from the code

**Files:**
- Delete: `src/db/`, `drizzle.config.ts`, `e2e/meta-db.ts`, `src/shared/lib/rich-text.ts` + test.
- Modify: `package.json` (drop `db:*` scripts and `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`; `@next/env` only if `grep` shows no other user), `package-lock.json` via `npm uninstall`, `eslint.config.mjs` (drop the `db` element; `content` keeps its rules).

- [ ] `grep -rn "DATABASE_URL\|@/db\|drizzle\|neon" src e2e *.ts *.mjs package.json` returns nothing.
- [ ] Definition of done. Stage. The owner removes `DATABASE_URL` from `.env.local` when they want (the file is not versioned).

## Task 9: Documents

- [ ] New `docs/decisions/ADR-0015 Content in Files.md` from the template: context, decision (the spec's decisions), alternatives (database kept without admin; a headless CMS; MDX; `content-collections`/Velite), consequences. ADR-0002, 0003, 0004 and 0014 get `status: superseded` and a line pointing to ADR-0015; ADR-0006 notes that no forms remain; ADR-0007 drops database writes.
- [ ] `docs/architecture/Data Model.md` becomes `Content Model.md`: the files, their fields, merge and validation rules. `Localization.md` and `Rendering Strategy.md` updated (no tags, no blog, contact or admin rows, the runtime 404 and the trace include).
- [ ] `Roadmap.md`, `Open Questions.md`, `Overview.md` updated as listed in the spec. The blog's specs and plans get `status: dropped` and a line pointing to the spec. Blog, Post, Contact and Admin handoffs and their folders are deleted with `git rm`.
- [ ] `CLAUDE.md`: Stack (Data, i18n content, Forms, Admin), Conventions (`src/content` instead of `src/db`, `src/actions`, `src/schemas`, mutations), Commands (no `db:*`), the e2e note in Tests. `README.md` gets a short project section only if it describes the database (it does not today: no change).
- [ ] `docs/journal/2026-11-04.md` gets today's summary; `docs/Home.md` links the spec, the plan, ADR-0015 and the renamed notes. The spec and this plan get `status: done` once Task 10 is decided.
- [ ] Stage `docs/ CLAUDE.md`.

## Task 10: Delete the Neon database (owner-gated)

- [ ] After the staged work is committed, merged and deployed, the owner checks the production site on files and confirms.
- [ ] Show the owner the exact actions: Vercel dashboard → project → Storage → the Neon database → remove the connection and delete the database; then Vercel → Settings → Environment Variables: remove `DATABASE_URL` and the other `PG*`/`POSTGRES_*`/`NEON_*` variables the integration added. Nothing runs without the confirmation.
- [ ] Record the date in the Roadmap (Stage 7) and the journal; stage.
