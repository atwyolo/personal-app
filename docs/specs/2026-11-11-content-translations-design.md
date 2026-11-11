---
tags: [spec, i18n, testing]
status: done
date: 2026-11-11
---

# Content Translations Design

Status: **done 2026-11-11**. Plan: [[2026-11-11-content-translations]].

Related: [[Localization]], [[Content Model]], [[2026-11-10-ui-translations-design]], [[ADR-0007 Testing]], [[ADR-0017 Test Content Fixtures]].

## Intent

The owner filled the English content (commit `d71b7f6`, 2026-11-11). The interface is translated into seven languages ([[2026-11-10-ui-translations-design]]); the content is not, so `/ru`, `/de` and the rest show a translated interface around English text. This change translates the content.

The e2e suite reads the real content: it hardcodes slugs, names, roles and counts of the content it was written against, and `e2e/meta-content.ts` reads `messages/en/meta.md`. Filling the content broke it, and every later edit would break it again. The owner's rule (2026-11-11): tests do not test the content, and editing the content never fails a test. So the e2e suite moves onto a frozen set of test content first.

## Goals

1. **Tests independent of the content.** No test reads `messages/**/*.md`. The e2e build reads its content from `e2e/content/`; adding, removing, renaming or rewording any file in `messages/` cannot fail `npm run test:run` or `npm run test:e2e`.
2. **Content in seven languages.** `ru`, `pt`, `es`, `de`, `fr`, `ja`, `pl` translate every content file in `messages/en/`; of `skills.md`, only the domain labels.

## Non-goals

- Skill names in `skills.md` stay English (owner). The domain labels were first left out too and then added by the owner the same day: see "Domain labels".
- Tests of the translations. The owner does not want content tested (2026-11-11); a forgotten field falls back to English by design.
- Build-time validation. The Zod schemas, the link check in Markdown, "no English counterpart" and "a skill of a job must be in `skills.md`" keep failing `npm run build` on broken content. They guard the deploy, not the code, and are not tests. The skill check keeps its unit test (owner).
- Fictional test content. The fixtures are the content the suite was written against; replacing the names in them is possible later and changes nothing here.
- Changing English content, the interface strings or the CV files.

## Anti-goals

- A test that passes because it skipped itself on the real content.
- A locale file that copies an English value: a copy silently overrides a later English edit (a new phone, a new cover).

## Part 1: test content fixtures

### The content root

`contentRoot` in `src/content/read.ts` is `path.resolve(process.env.CONTENT_ROOT)` when the variable is set, else `messages/` as now. Production and `npm run build` never set it. `CONTENT_ROOT` is a server variable (no `NEXT_PUBLIC_`); the content getters run at build time under `"use cache"`, so the e2e build prerenders from the fixtures.

Playwright's `webServer.env` sets `CONTENT_ROOT: "e2e/content"` for its build and server. `reuseExistingServer` stays as is: a server already running on port 3100 is reused, whatever its content (as today).

### The fixtures

`e2e/content/en/` holds the English content of commit `4b250f8` (the last commit with a green suite, 499 e2e tests): `profile.md`, `skills.md`, `meta.md`, `about/{who,how,results,scale,next,life}.md`, `experience/{epam,glovo,sony}.md`, byte for byte except the two image URLs below. No other locale has content files, which the "falls back to English" tests rely on. Their properties the suite needs (three jobs, one of them with an image, six interview pairs, the hero skills, null icons) come with them.

The fixtures are frozen: they change only together with a test that needs a new property.

The image tests load the fixtures' photo and Glovo cover through the image optimizer, so the fixtures need real files in Blob. They point at copies the tests own, `e2e/photo.jpg` (the current photo) and `e2e/cover-glovo.png` (the current Glovo cover), uploaded by the owner (owner, 2026-11-11: the old `glovo.png` is deleted; copy the new cover for the tests). Replacing or deleting a production file cannot touch the tests. The cover is 2400 × 800 where the old one was 1600 × 903.

### The tests

- `e2e/meta-content.ts` reads `e2e/content/<locale>/meta.md` instead of `messages/`.
- The tests that compare a page with "the content files" (`home page shows the profile from the content files`, `shows the jobs from the content files in their order`, the metadata tests) now compare it with the fixtures: they check that frontmatter reaches the page, which is the code's job. They stay (owner, 2026-11-11: "after the move to fixtures there is no need to delete them").
- Literals in the specs stay: they are the fixtures' values now.
- `e2e/messages.ts` keeps reading `messages/<locale>.json`: interface strings are not content, and the specs already take them from the files.

### Proof

The suite runs green with the real content as it is now (it differs from the fixtures everywhere). Then a mutation: delete `messages/en/about/who.md` and rename `messages/en/experience/glovo.md`; `npm run test:run` and `npm run test:e2e` stay green; restore.

### Records

[[ADR-0017 Test Content Fixtures]] records the decision; [[ADR-0007 Testing]] points to it from its consequence about content.

## Part 2: translations

### Files

For each of `ru`, `pt`, `es`, `de`, `fr`, `ja`, `pl`: `meta.md`, `profile.md`, `about/{who,motivation,skills,scale,next}.md`, `experience/{glovo,sony,freshdirect}.md`. Not `skills.md`.

### Fields

A locale file holds only what it translates. A field whose translation equals English is left out (fallback). Never in a locale file: URLs (`photoUrl`, `imageUrl`, `linkedinUrl`, the icons, `ogImageUrl`, `ogPlaceholderUrl`), `whatsappPhone`, `email`, dates, `sort`, `skills` lists, `company`, `hiddenFromSearch`. The one exception is `cvUrl` in `ru` (decision 6).

| File | Translated fields |
|---|---|
| `meta.md` | `Common.siteName`, `Common.defaultTitle` (`ru` only); `title`, `description` of `Home`, `About`, `Skills`, `Experience` |
| `profile.md` | `name` (`ru` only), `headline`, `jobTitle` (`ru` only), body; `cvUrl` (`ru` only) |
| `about/*.md` | `linkText`, `questionTitle`, `questionMessage`, `answerTitle`, body |
| `experience/*.md` | `role` (`ru` only), `descriptionShort`, body |

### Decided by the owner (2026-11-11)

1. Translate, do not copy: only translated fields, per the convention in [[Content Model]].
2. The name: «Михаил Александров» in `ru`, "Mikhail Aleksandrov" everywhere else.
3. The title: "Senior Frontend Engineer" everywhere except `ru`, where it is «Senior Frontend-разработчик» (`jobTitle`, the `role` of the senior jobs, in `headline` and the page titles). FreshDirect's "Frontend Engineer" is «Frontend-разработчик» in `ru`.
4. The interview questions address the candidate politely: `ru` «вы», `de` «Sie», `fr` «vous», `es` «usted», `pt` «você» (Brazilian), `pl` «Pan» or an impersonal form, `ja` です／ます.
5. Everything except `skills.md` is translated, `about/skills.md` included (its bold labels "Languages:", "Testing:" too).
6. `ru` downloads the Russian CV: `cvUrl: https://5iyco5bcxydlbyja.public.blob.vercel-storage.com/CV/Mikhail_Aleksandrov_Frontend_CV_RU.pdf?download=1`. `?download=1` is Claude's addition: the `downloadUrl` form the Content Model requires, because `<a download>` is ignored cross-origin.

### Translation rules (Claude's calls)

- Technology names, products, companies and established terms stay in English: React, SSR, SSG, Core Web Vitals, LCP, CI/CD, A/B testing, Lighthouse, SOLID, DRY, KISS, WCAG 2.1 AA, AI, LLM, Generative AI, MCP. A language's usual short form is fine around them (`A/B-Tests`, `тесты A/B`).
- Variants as in the interface: `pt` Brazilian, `es` neutral (no *vosotros*).
- Numbers follow the language: decimal comma where the language uses it (`2,4 s`, `3,7 MB`), French no-break spaces before `:` and `%` and between number and unit; ranges with an en dash (`5–6`, `92–95`); `6+`.
- The voice of the English text: first person, professional, the same facts, no added claims. Japanese uses 私 and です／ます in the answers.
- Markdown structure is kept: bold labels, lists, `\` hard breaks, the link `[FreshDirect](/experience#freshdirect)`.
- YAML: a value containing `: ` or starting with a special character is quoted, as in English.

### Domain labels

Added by the owner after the four tasks (2026-11-11): a locale's `skills.md` holds only `domains`, the labels of the nine domains (`languages`, `frameworks`, `build`, `styling`, `testing`, `backend`, `devops`, `ai`, `tools`), merged with English by `key`; the skills come from English. A label equal to English is left out (DevOps everywhere). The labels match the bold labels of the locale's `about/skills.md`. German keeps "Frameworks & State": "Frameworks & State-Management" crossed the 240 px filter column at 1024 px (Claude's call; its `about/skills.md` label follows).

### Verification

- `npm run build` (the content validation) and the definition of done.
- Every page in every locale on the production server at 320 and 390 px: no horizontal scroll (long German and Polish words), checked by a throwaway script, not a committed test.
- A reread of each language for accuracy against English.

## Left to the plan

The order of the tasks, the exact wording of each translation, the throwaway overflow script.
