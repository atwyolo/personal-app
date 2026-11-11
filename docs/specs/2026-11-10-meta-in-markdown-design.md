---
tags: [spec, content, i18n]
status: done
date: 2026-11-10
---

# Metadata in Markdown Design

Status: **done 2026-11-10**. Plan: [[2026-11-10-meta-in-markdown]].

Related: [[Content Model]], [[Localization]], [[Rendering Strategy]], [[ADR-0015 Content in Files]], [[2026-11-04-content-in-files-design]].

## Intent

The owner draws one line through `messages/` (2026-11-10): **all content lives in Markdown files, JSON holds only interface strings.** Today page titles, descriptions and the site settings sit in the `Meta` root of `messages/<locale>.json`, next to the interface texts of `Pages`, while every other piece of content (profile, skills, experience, About) is Markdown with frontmatter. The owner counts the whole `Meta` node as content, so it moves to its own Markdown file with the same structure. After the move, `messages/<locale>.json` is purely next-intl interface messages, and every content file goes through one loader, one merge rule and strict Zod schemas.

## Goals

- `messages/<locale>/meta.md` holds everything that is in `Meta` today, in the same structure: the nodes `Common`, `Home`, `About`, `Skills`, `Experience` with the same fields.
- `Meta` is removed from every `messages/<locale>.json`. The JSON files keep only the `Pages` root.
- Metadata is read through `loadLocalized` like the other content files: per-field fallback to English, strict Zod schemas, errors that name the file and the field.
- `mergeFields` merges nested objects recursively, so a locale can translate one field of a node (`Home.title`) and inherit the rest from English.
- Every page renders exactly the same `<head>` as before the move.

## Non-goals

- Translating metadata. No locale has metadata today; the fallback must work, no translated `meta.md` is written.
- Changing `Pages`: its keys, its root node and every `useTranslations("Pages.…")` call stay as they are.
- New metadata fields or behaviour (JSON-LD, new icons, per-locale icons).

## Anti-goals

- Any change in the rendered metadata: title, description, `og:*`, icons, `robots`, canonical, hreflang, the app version, `/favicon.ico`.
- Losing the owner's uncommitted edit of `Meta.Home` (title and description, "6+ years"): `meta.md` carries the working-copy values, not the committed ones.
- Metadata reaching the browser. It stays server-only, as today.
- A second merge implementation for metadata next to `mergeFields`.

## Decided by the owner (2026-11-10)

1. Everything inside the `Meta` node is content and moves to Markdown; `Pages` is interface text and stays in JSON.
2. One file, `meta.md`, with a structure close to the current `Meta` node.
3. `mergeFields` becomes recursive for nested objects.
4. The proposals played back and confirmed in the chat: file name `meta.md`, PascalCase node keys, `Pages` root kept, a new ADR next to ADR-0015.

## The file

`messages/en/meta.md`, frontmatter only:

```yaml
---
Common:
  siteName: Mikhail Aleksandrov
  defaultTitle: Mikhail Aleksandrov
  iconIcoUrl: null
  iconSvgUrl: null
  iconPngUrl: null
  appleTouchIconUrl: null
  ogPlaceholderUrl: null
  hiddenFromSearch: true
Home:
  title: …
  description: …
  ogImageUrl: null
About:
  title: …
  description: …
  ogImageUrl: null
Skills: …
Experience: …
---
```

- **Name `meta.md`**, lowercase like `profile.md` and `skills.md`.
- **Node keys stay PascalCase** (`Common`, `Home`, …): they match `PageKey` in `src/content/meta.ts`, which the views already pass, so no mapping is needed. Field names stay camelCase, as today.
- **Values move unchanged**, including the `null`s. Fields keep today's rules: `siteName`, `defaultTitle`, `title`, `description` are non-empty text; the URLs are `https://` or `null`; `hiddenFromSearch` is a YAML boolean (`true`/`false` only, YAML 1.2).
- **Every key is required in `en`**, `null` included, as in the JSON today. A missing node or field in `en` fails the build, naming the file and the field (`messages/en/meta.md: Home.description: …`). An unknown node or field fails too (strict schemas).
- **Another locale** (`messages/ru/meta.md`) may hold any subset of nodes and fields. Anything it leaves out, sets to `null` or to an empty string comes from English, as in the other content files. A missing locale file means English.
- **The body** is ignored, as in `skills.md`.
- **Quoting:** titles contain `—` and descriptions contain `’` and `,`; plain YAML scalars allow both, but a value with `: ` or a leading special character needs quotes. The builder writes valid YAML 1.2 and keeps the text byte-identical to the JSON.

## Merge rule

`mergeFields(en, locale, lists)` in `src/content/localize.ts` gains one case: when both the English value and the locale value are plain objects (not arrays, not `null`), they merge recursively by the same rules. Everything else stays: missing values (`null`, `undefined`, `""`) are skipped, lists named in `lists` merge by item key, any other value replaces the English one.

The other content files have no nested objects outside lists, so their behaviour does not change.

## Code

- `src/content/schemas.ts`: the site schema and the page schema move here from `meta.ts`, plus a `metaSchema` (a strict object of `Common` and the four pages).
- `src/content/meta.ts`: a pure `readMeta(root, locale)` on `loadLocalized` and the cached getters `getSiteMeta(locale)` and `getPageMeta(locale, key)` keep their signatures and return types, so the five `metadata.ts` views and `favicon.ts` do not change. `meta.ts` stops importing `load-messages` and `merge-messages`.
- `messages/en.json`: `Meta` removed. The other locale JSON files have no `Meta` today; nothing changes in them.
- `next.config.ts` already traces `messages/**/*.md` into every route, so the 404 and `/favicon.ico` find `meta.md` at request time.
- `src/shared/lib/i18n/merge-messages.ts` now serves only `Pages`, which holds strings: `MessageLeaf` narrows to `string | null`, and the tests under "non-string leaves (metadata in Meta.*)" in `merge-messages.test.ts` give way to one test for `null`. `null` and an empty string still mean untranslated, as the locale convention in [[Content Model]] promises for every file.
- `e2e/meta-content.ts` reads `meta.md` (English, plus the locale file when it exists, merged by the same rule) instead of the JSON. `e2e/metadata.spec.ts` keeps comparing pages with the content file, not with literals.

## Tests

- Vitest: `meta.test.ts` moves to content trees from `test-tree.ts` (as `skills.test.ts` does): reads the settings and a page; a missing node in `en` fails with the file and the field; a relative icon URL fails; a locale overrides one field of a node and inherits the rest. `localize.test.ts` covers the recursive merge, including a nested `null` that keeps the English value.
- Playwright: `metadata.spec.ts` passes unchanged on the new source.
- The definition of done from `CLAUDE.md`: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Documentation

- New ADR-0016 "Metadata in Markdown", amending ADR-0015 (which said `messages/<locale>.json` has two roots). ADR-0015 gets a line pointing to it.
- `Content Model`: the JSON section shrinks to `Pages`; `meta.md` joins the Markdown table with its rules; the merge rule mentions nested objects.
- `Localization` and `Rendering Strategy`: `Meta` in the messages becomes `meta.md`.
- `CLAUDE.md` (Stack, Content): `<locale>.json` holds `Pages` only, `meta.md` joins the list of Markdown files.
- `docs/Home.md`: the spec, the plan and the ADR. Journal entry for the day.

## Claude's calls (for the owner to check)

- Explicit `null`s and every key required in `en`, as in the JSON today, rather than optional fields as in `profile.md`: keeps the structure the owner asked for.
- The body of `meta.md` is ignored, as in `skills.md`.
- The getters keep their signatures, so no view changes.
- `mergeMessages` narrows to `string | null` leaves once `Meta` leaves the JSON: numbers and booleans existed only for `Meta`. `null` stays, because the locale convention promises that `null` falls back to English in every file (corrected during Task 3; the first draft dropped it).

## Left to the builder

- How `meta.ts` validates (one `metaSchema` for the whole file, or the two schemas per node) as long as errors name the file and the field path.
- How the e2e helper reads and merges the Markdown without importing `server-only` modules from `src/content`.
- Test names and fixture shapes.
