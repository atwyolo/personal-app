---
tags: [plan, content, i18n]
status: done
date: 2026-11-10
---

# Plan: Metadata in Markdown

Move the `Meta` node of `messages/<locale>.json` into `messages/<locale>/meta.md`, read it through `loadLocalized` with a recursive `mergeFields`, and leave the JSON with `Pages` only. The checklist in this note is the ledger: a task is ticked when its delta is staged.

**Goal:** all content in Markdown, JSON holds interface strings only, with no visible change in any page's `<head>`.

**Architecture:** `mergeFields` moves to a module without `server-only` and learns nested objects. `src/content/meta.ts` becomes a pure `readMeta(root, locale)` on `loadLocalized` plus the two cached getters with unchanged signatures. The e2e helper reads `meta.md` with the same `mergeFields`.

**Tech stack:** Next 16 (Cache Components), Zod 4, `yaml` 2, next-intl 4, Vitest, Playwright.

**Spec:** [[2026-11-10-meta-in-markdown-design]] (read it with this plan).

Related: [[Content Model]], [[Localization]], [[ADR-0015 Content in Files]], [[ADR-0007 Testing]].

## Global constraints

- **Stages, not commits.** Every task ends with `git add` of its whole delta, new files included. The owner commits.
- **Inline, one task at a time**, explained in Russian in the chat.
- **TDD** with Vitest for `mergeFields`, `readMeta` and `mergeMessages`; metadata in pages is verified by `e2e/metadata.spec.ts`.
- **Definition of done for a task:** `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- **Conventions from `CLAUDE.md`:** no comments in code, named exports, no barrels, English in the repository, kebab-case for non-JSX files.
- **No change in rendered metadata:** title, description, `og:*`, icons, `robots`, canonical, hreflang, app version, `/favicon.ico`.
- **The owner's working-copy `Meta.Home`** ("6+ years", with `’`) is what moves into `meta.md`, byte for byte.
- **Getters keep their signatures:** `getSiteMeta(locale: Locale): Promise<SiteMeta>`, `getPageMeta(locale: Locale, key: PageKey): Promise<PageMeta>`, `PageKey = "Home" | "About" | "Skills" | "Experience"` stays exported from `src/content/meta.ts`.

## Decisions made while planning (Claude's calls, reported to the owner)

- **`mergeFields` moves to `src/content/merge-fields.ts`, without `import "server-only"`.** The e2e helper runs in plain Node, where `server-only` throws, and the spec rules out a second merge implementation. `localize.ts` imports it from there; its tests move along. Alternative: an own deep merge in `e2e/meta-content.ts`, which is exactly the duplicate the spec forbids.
- **`lists` applies at the top level only.** Recursion into nested objects passes no `lists`; no content file has a keyed list inside a nested object.
- **The e2e helper splits the frontmatter itself** (a regex for the first `---` block, then `yaml`'s `parse`), as `e2e/meta-content.ts` read JSON itself before. Extracting the splitter from `read.ts` too would widen the change for a test helper.
- **One step, one commit.** Tasks are staged one by one and reported; the commit question (and the version bump) comes once, after Task 4. Proposed bump: `patch`, nothing visible changes.

## Rulings during execution

- **Task 3:** the spec and the first draft of this plan dropped `null` from `mergeMessages`. `Content Model` promises that `null` in any locale file falls back to English, and without the branch a `null` in `ru.json` would reach next-intl as a missing message. Ruling: `MessageLeaf = string | null`, the `null` skip stays, pinned by `treats null in the locale as untranslated` (RED, then GREEN). Cost if wrong: one line of dead tolerance.
- **Task 3:** `isTree` keeps its `value !== null` guard, so a `null` never reaches `Object.entries`.

## Final review (2026-11-10)

A fresh reviewer read the staged diff: no Critical or Important findings. Five stale or imprecise doc lines (ADR-0007, Content Model twice, Localization, Open Questions' date) were fixed as part of Task 4.

- Minor (deferred): `PageKey` in `src/content/meta.ts` is written by hand next to `metaSchema`; `Exclude<keyof Meta, "Common">` would derive it, but `e2e/meta-content.ts` keeps its own copy anyway, and `tsc` catches a mismatch.
- Minor (deferred): `e2e/meta-content.ts` copies the frontmatter regex of `read.ts` without its `match.index === 0` check; a malformed file fails the build first.
- Not judged: a keyed list inside a nested object would be replaced whole, since recursion passes no `lists`; no file has one.

## Review focus

- A locale `meta.md` with `false` for `hiddenFromSearch`: `false` must override English `true`, not count as missing. Pinned in Task 1.
- A locale node written empty (`Home:` → `null`): the whole English node is kept. Pinned in Task 1.
- A locale `meta.md` with a node English does not have (`Blog:`): the build fails naming the locale file. Pinned in Task 2.
- `hiddenFromSearch: yes` or `"true"`: a string, so the build fails instead of hiding or showing the site by accident. Pinned in Task 2.
- Text drift in the move (`—`, `’`, quoting): `metadata.spec.ts` compares pages with the new file, so it cannot see a changed string. Pinned by the one-off comparison in Task 2, Step 4.

---

## Tasks

- [x] Task 1: Recursive `mergeFields` in its own module
- [x] Task 2: `meta.md` and the loader
- [x] Task 3: `mergeMessages` for strings only
- [x] Task 4: Documentation

### Task 1: Recursive `mergeFields` in its own module

**Files:**
- Create: `src/content/merge-fields.ts`, `src/content/merge-fields.test.ts`
- Modify: `src/content/localize.ts` (remove `mergeFields`, import it), `src/content/localize.test.ts` (move the three `mergeFields` tests out)

**Interfaces:**
- Produces: `mergeFields<T extends Record<string, unknown>>(en: T, locale: Record<string, unknown> | undefined, lists?: Record<string, string>): T` from `@/content/merge-fields`, no `server-only`.

- [ ] **Step 1:** Move the `describe("mergeFields")` block from `localize.test.ts` to `merge-fields.test.ts` (importing from `./merge-fields`) and add:

```ts
it("merges nested objects field by field", () => {
  const merged = mergeFields({ Home: { title: "Home", description: "About me", ogImageUrl: null } }, { Home: { title: "Главная" } });
  expect(merged).toEqual({ Home: { title: "Главная", description: "About me", ogImageUrl: null } });
});

it("keeps the English value for a nested null, undefined or empty string", () => {
  const merged = mergeFields({ Common: { a: "A", b: "B", c: "C" } }, { Common: { a: null, b: "", c: undefined } });
  expect(merged).toEqual({ Common: { a: "A", b: "B", c: "C" } });
});

it("keeps the whole English node when the locale writes it empty", () => {
  expect(mergeFields({ Home: { title: "Home" } }, { Home: null })).toEqual({ Home: { title: "Home" } });
});

it("lets false override true inside a node", () => {
  expect(mergeFields({ Common: { hiddenFromSearch: true } }, { Common: { hiddenFromSearch: false } })).toEqual({
    Common: { hiddenFromSearch: false },
  });
});

it("replaces an English scalar with a locale object and the reverse, leaving the check to the schema", () => {
  expect(mergeFields({ a: "A" }, { a: { b: "B" } })).toEqual({ a: { b: "B" } });
  expect(mergeFields({ a: { b: "B" } }, { a: "A" })).toEqual({ a: "A" });
});

it("does not mutate its arguments", () => {
  const en = { Home: { title: "Home" } };
  const ru = { Home: { title: "Главная" } };
  mergeFields(en, ru);
  expect(en).toEqual({ Home: { title: "Home" } });
  expect(ru).toEqual({ Home: { title: "Главная" } });
});
```

- [ ] **Step 2:** `npx vitest run src/content/merge-fields.test.ts` → FAIL (module not found).
- [ ] **Step 3:** Move `mergeFields` to `merge-fields.ts` and add the case: when both values are plain objects (`typeof === "object"`, not `null`, not an array), recurse without `lists`. `localize.ts` imports it.
- [ ] **Step 4:** `npm run test:run` → PASS, including the untouched `localize.test.ts` and the loaders' tests.
- [ ] **Step 5:** `npm run lint && npx tsc --noEmit` → clean. `git add src/content/merge-fields.ts src/content/merge-fields.test.ts src/content/localize.ts src/content/localize.test.ts`; tick Task 1.

### Task 2: `meta.md` and the loader

**Files:**
- Create: `messages/en/meta.md`
- Modify: `src/content/schemas.ts`, `src/content/meta.ts`, `src/content/meta.test.ts`, `src/content/fixtures.ts`, `messages/en.json` (remove `Meta`), `e2e/meta-content.ts`

**Interfaces:**
- Consumes: `mergeFields` from Task 1; `loadLocalized` and `contentRoot` as they are.
- Produces: in `schemas.ts`, `siteMetaSchema`, `pageMetaSchema`, `metaSchema` (strict `{ Common, Home, About, Skills, Experience }`); in `meta.ts`, `readMeta(root: string, locale: Locale): Meta` with `type Meta = z.infer<typeof metaSchema>`, plus `SiteMeta`, `PageMeta`, `PageKey` and the two getters, signatures unchanged. `readSiteMeta` and `readPageMeta` (the pure functions over `MessagesTree`) are removed.

- [ ] **Step 1:** In `fixtures.ts` add `metaMd`: a full English `meta.md` in block style with two-space indents (the test values from today's `meta.test.ts`: `siteName: Mike`, `iconSvgUrl: https://a.dev/icon.svg`, the other URLs `null`, `hiddenFromSearch: true`, and all four pages). Rewrite `meta.test.ts` on `writeContentTree`:

```ts
it("reads the site settings and every page", () => {
  const meta = readMeta(writeContentTree({ "en/meta.md": metaMd }), "en");
  expect(meta.Common.iconSvgUrl).toBe("https://a.dev/icon.svg");
  expect(meta.About).toEqual({ title: "About — Mike", description: "Interview.", ogImageUrl: null });
});

it("translates one field of a page and inherits the rest", () => {
  const root = writeContentTree({ "en/meta.md": metaMd, "ru/meta.md": "---\nAbout:\n  title: Обо мне — Майк\n---\n" });
  expect(readMeta(root, "ru").About).toEqual({ title: "Обо мне — Майк", description: "Interview.", ogImageUrl: null });
});

it("fails on a page missing in English, naming the file and the node", () => {
  const root = writeContentTree({ "en/meta.md": metaMd.replace(/^Skills:\n(  .*\n)+/m, "") });
  expect(() => readMeta(root, "en")).toThrow(/en\/meta\.md: Skills:/);
});

it("rejects a relative icon URL", () => {
  const root = writeContentTree({ "en/meta.md": metaMd.replace("https://a.dev/icon.svg", "/icon.svg") });
  expect(() => readMeta(root, "en")).toThrow(/en\/meta\.md: Common\.iconSvgUrl:/);
});

it("rejects hiddenFromSearch written as yes", () => {
  const root = writeContentTree({ "en/meta.md": metaMd.replace("hiddenFromSearch: true", "hiddenFromSearch: yes") });
  expect(() => readMeta(root, "en")).toThrow(/Common\.hiddenFromSearch/);
});

it("rejects a node English does not have, naming the translation", () => {
  const root = writeContentTree({ "en/meta.md": metaMd, "ru/meta.md": "---\nBlog:\n  title: Блог\n---\n" });
  expect(() => readMeta(root, "ru")).toThrow(/ru\/meta\.md/);
});
```

- [ ] **Step 2:** `npx vitest run src/content/meta.test.ts` → FAIL (`readMeta` not exported).
- [ ] **Step 3:** Move the two schemas into `schemas.ts` (URLs as `httpsUrl.nullable()`, text as `text`) and add `metaSchema`. Rewrite `meta.ts`: `readMeta` calls `loadLocalized({ root, locale, path: "meta.md", schema: metaSchema })` and returns the five nodes without `body`/`slug`; each getter keeps `"use cache"` + `cacheLife("max")` and returns its node of `readMeta(contentRoot, locale)`. Drop the imports of `load-messages` and `merge-messages`.
- [ ] **Step 4:** Create `messages/en/meta.md` from the working-copy `Meta` of `messages/en.json` (frontmatter only, node order as in the JSON). Before touching the JSON, prove the text is identical:

```bash
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {parse} from 'yaml'; import {isDeepStrictEqual} from 'node:util'; const md=readFileSync('messages/en/meta.md','utf8').split(/^---\s*$/m)[1]; const json=JSON.parse(readFileSync('messages/en.json','utf8')).Meta; console.log(isDeepStrictEqual(parse(md), json) ? 'identical' : 'DIFFERENT')"
```

Expected: `identical`.
- [ ] **Step 5:** Remove `Meta` from `messages/en.json`. Rewrite `e2e/meta-content.ts`: read `messages/en/meta.md` and, for another locale, `messages/<locale>/meta.md` when it exists; parse each frontmatter with `yaml`; merge with `mergeFields` from `@/content/merge-fields`. `SiteMetaRow`, `PageMetaRow`, `PageKey`, `readSiteMeta(locale)`, `readPageMeta(key, locale)` keep their signatures, so `metadata.spec.ts` does not change.
- [ ] **Step 6:** `npm run test:run`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test:e2e` → all green; `metadata.spec.ts` passes unchanged, including the 404 page and `/favicon.ico`.
- [ ] **Step 7:** `git add messages/en/meta.md messages/en.json src/content/schemas.ts src/content/meta.ts src/content/meta.test.ts src/content/fixtures.ts e2e/meta-content.ts`; tick Task 2.

### Task 3: `mergeMessages` for strings only

**Files:**
- Modify: `src/shared/lib/i18n/merge-messages.ts`, `src/shared/lib/i18n/merge-messages.test.ts`

**Interfaces:**
- Produces: `MessageLeaf = string | null`; `MessagesTree` and `mergeMessages` otherwise unchanged.

- [x] **Step 1:** Remove the `describe("non-string leaves (metadata in Meta.*)")` block and add `treats null in the locale as untranslated` on the string fixture. The other tests (fallback, translated strings, empty string as untranslated, no mutation) stay.
- [x] **Step 2:** Narrow `MessageLeaf` to `string | null`. `null` and an empty string are still skipped.
- [ ] **Step 3:** `npm run test:run`, `npx tsc --noEmit` (shows every place that relied on non-string leaves; after Task 2 there should be none), `npm run lint`, `npm run build`, `npm run test:e2e` → green.
- [ ] **Step 4:** `git add src/shared/lib/i18n/merge-messages.ts src/shared/lib/i18n/merge-messages.test.ts`; tick Task 3.

### Task 4: Documentation

Done when the owner answers that the feature is ready to commit (`CLAUDE.md`, "End of a step and the commit").

**Files:**
- Create: `docs/decisions/ADR-0016 Metadata in Markdown.md` (from `docs/templates/ADR Template.md`), `docs/journal/2026-11-10.md`
- Modify: `docs/decisions/ADR-0015 Content in Files.md` (a line: amended by ADR-0016), `docs/architecture/Content Model.md`, `docs/architecture/Localization.md`, `docs/architecture/Rendering Strategy.md`, `docs/project/Roadmap.md` (Stage 8: `hiddenFromSearch` now in `messages/en/meta.md`), `docs/Home.md` (spec, plan, ADR, journal), `CLAUDE.md` (Stack, Content), this plan and the spec (`status: done`)

- [ ] **Step 1:** Write the ADR (context: the owner's line between content and interface strings; decision: `meta.md`, recursive `mergeFields`, JSON with `Pages` only; alternatives: keep `Meta` in JSON, one file per page, metadata in each page's own content file).
- [ ] **Step 2:** Update the notes above. `grep -rn "Meta\.\|en\.json" docs CLAUDE.md` shows no statement that metadata lives in JSON, except in done or superseded notes that describe the past.
- [ ] **Step 3:** `git add docs CLAUDE.md`; tick Task 4. Then the version bump and the commit message, per `CLAUDE.md`.
