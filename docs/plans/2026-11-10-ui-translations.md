---
tags: [plan, i18n]
status: done
date: 2026-11-10
---

# Plan: UI translations

Translate `Pages` of `messages/en.json` into `ru`, `pt`, `es`, `de`, `fr`, `ja`, `pl`, move the 404 sentence into the messages, guard the translations with a unit test, and make e2e tests on other locales read their strings from the messages files. The checklist in this note is the ledger: a task is ticked when its delta is staged.

**Goal:** every interface string, the 404 page included, in the visitor's language, checked by tests that do not break when a translation is reworded.

**Architecture:** the 404 page reads `Pages.NotFound` with `getTranslations`. A Vitest test parses every message with `@formatjs/icu-messageformat-parser` and checks keys, arguments and plural forms against English and CLDR. An e2e helper merges `en.json` with the locale's file and formats through next-intl's `createTranslator`.

**Tech stack:** Next 16 (Cache Components), next-intl 4, `@formatjs/icu-messageformat-parser` 3.5.22 (new devDependency), Vitest, Playwright.

**Spec:** [[2026-11-10-ui-translations-design]] (read it with this plan).

Related: [[Localization]], [[ADR-0007 Testing]].

## Global constraints

- **Stages, not commits.** Every task ends with `git add` of its whole delta. The owner commits; the commit question (and the version) comes once, after Task 4.
- **Inline, one task at a time**, explained in Russian in the chat.
- **Definition of done for a task:** `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- **No comments in code**, named exports, no barrels, English in the repository, kebab-case for non-JSX files.
- **Tone:** a neutral, standard interface (owner). Conventions, CV wording, quotation marks, French spacing and plural rules exactly as in the spec's "Translation conventions".
- **Inherited keys** (absent from every locale file): `Pages.Common.LocaleMenu.names.*`, `Pages.Common.Contacts.whatsapp`, `Pages.Common.Contacts.linkedin`, `Pages.Common.Contacts.pdf`, `Pages.Common.Carousel.position`, `Pages.Common.SkillRow.level`.
- **English arguments** (the full set, from parsing `en.json`): `code`, `phone`, `email`, `name`, `query` (strings), `theme` (`select`: `dark`, `other`), `current`, `total`, `shown`, `level`, `from`, `to` (numbers), `years` (`plural`, fractional to tenths).
- **Next.js docs to read first:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md` before Task 1.

## Decisions made while planning (Claude's calls, reported to the owner)

- **Order: e2e first, translations second.** Task 2 moves the e2e tests to the messages files while the locales are still empty (the merged tree equals English, so they stay green); Task 3 then adds the translations without a red e2e run in between. The other order would leave the suite red for a whole task.
- **The e2e helper takes full key paths** (`"Pages.Common.Header.nav.home"`) through a translator without a namespace: one helper for every spec, no per-namespace factories.
- **`not-found.tsx` stays a Next special file with an inline component**, now `async`: it is two elements and one string, below the size where a view in `src/views/` pays off.

## Rulings during execution

- **Task 2/3:** two e2e tests the plan's grep could not see used English strings after a switch to another locale (`expectBelowBars` in `about.spec.ts`, the language button in `i18n-routing.spec.ts`); the first run with translations showed them, and they now read `messagesFor`. Cost if wrong: none, the suite is green.
- **Task 3:** `showAll` in `ru` and `pl` puts the count in parentheses ("Показать все навыки (42)") instead of a `plural`: the noun stays in one form and the count stays visible. `countAll` uses a `plural` in every language that inflects the noun except `de`, where "1 Kenntnis" reads worse than the plain "{total} Kenntnisse" English also uses.

## Final review (2026-11-10)

A fresh reviewer read the staged diff, code and translations. No Critical findings.

- Fixed: an empty string or `null` in a locale counted as translated, while the merge silently showed English. The completeness check now treats it as missing (a `"back": ""` mutation passed before, fails now).
- Fixed: `select` branches were not compared with English; `systemNow` without its `dark` branch passed. New check "keeps the select branches of English" (the mutation passed before, fails now).
- Fixed: wording in `pl` (`linkedinAria`, `navLabel`, `learnMore`), `pt` (`learnMore`, `Skills.intro`), `es` (`showAll` had lost "all"), `de` (`experience.all`, `Skills.intro`, carousel buttons), `fr` (`About.intro`: «entretien»), toward the standard UI wording of each language.
- Minor (deferred): the French no-break-space test pins one key; a general rule for every `fr` message would cover the rest.
- Minor (deferred): `en.json` itself is not parsed by the translation test (component tests cover it in part).
- Minor (deferred): `e2e/messages.ts` has no `onError: throw`, so a mistyped key shows up as a locator timeout.
- Minor (deferred): `home-skills.spec.ts` finds the link by `href`, not by role; `skills.spec.ts` builds a regex from a translation without escaping.
- Minor (deferred): the test parses with `@formatjs/icu-messageformat-parser` 3.5.22, the runtime's `intl-messageformat` bundles 3.5.18.
- Raised to the owner and fixed at their request: `aria-roledescription` in `src/shared/ui/Carousel.tsx` was hard-coded English ("carousel", "slide"), read out as is by screen readers on every locale. It now comes from `Pages.Common.Carousel.roleCarousel` and `roleSlide`, translated in all seven locales, pinned by a component test on `ru` (RED, then GREEN).

## Review focus

- A message that is valid ICU but drops an argument (`"Показать все навыки"` without `{total}`): caught by the argument check in Task 3.
- `ru` / `pl` `duration` for 1.3, 2.5, 21, 22, 25 years: the right noun form each time ("1,3 года", "21 год", "22 года", "25 лет"). Pinned in Task 3.
- A no-break space typed as a plain space in `fr` (`Langue : {code}`): pinned by a test on the exact code point in Task 3.
- The 404 page under `/ru` and `/de`, reached through the catch-all: the sentence in the URL's language under its `lang`. Pinned in Task 2.
- A key misspelled in a locale file (`Header.navLable`): caught by the unknown-key check in Task 3.

---

## Tasks

- [x] Task 1: The 404 sentence in the messages
- [x] Task 2: e2e strings from the messages files
- [x] Task 3: The translation test and seven translations
- [x] Task 4: Documentation

### Task 1: The 404 sentence in the messages

**Files:**
- Modify: `messages/en.json` (add `Pages.NotFound.message`: `"This page does not exist."`, after `Pages.Experience`), `src/app/[locale]/not-found.tsx`
- Test: `e2e/metadata.spec.ts` (the `404 page` block)

**Interfaces:**
- Produces: `Pages.NotFound.message` in `en.json`.

- [ ] **Step 1:** In the `404 page` describe of `e2e/metadata.spec.ts`, add `shows the sentence from the messages file`: read `Pages.NotFound.message` from `messages/en.json` (plain `JSON.parse` for now; Task 2 swaps in the helper), go to `/en/no-such-page`, expect the `main` paragraph to have that text.
- [ ] **Step 2:** `npm run build && npx playwright test e2e/metadata.spec.ts -g "sentence"` → FAIL (`Pages.NotFound` is undefined).
- [ ] **Step 3:** Add the key; `not-found.tsx` becomes `async`, reads `getTranslations("Pages.NotFound")` from `next-intl/server` and renders `t("message")`. The `404` heading stays.
- [ ] **Step 4:** Same command → PASS. Then the definition of done.
- [ ] **Step 5:** `git add messages/en.json "src/app/[locale]/not-found.tsx" e2e/metadata.spec.ts`; tick Task 1.

### Task 2: e2e strings from the messages files

**Files:**
- Create: `e2e/messages.ts`
- Modify: `e2e/metadata.spec.ts`, `e2e/header.spec.ts`, `e2e/home-about.spec.ts`, `e2e/home-experience.spec.ts`, `e2e/home-skills.spec.ts`, `e2e/skills.spec.ts`, and every other spec that opens a locale other than `en` and finds an element by an interface string

**Interfaces:**
- Consumes: `mergeMessages` from `@/shared/lib/i18n/merge-messages`, `Locale` from `@/shared/lib/locales`.
- Produces: `messagesFor(locale: Locale): (key: string, values?: Record<string, string | number>) => string` in `e2e/messages.ts`: merges `messages/en.json` with `messages/<locale>.json` (read with `readFileSync`), returns `createTranslator({ locale, messages })` from `next-intl` with full key paths.

- [ ] **Step 1:** Write `e2e/messages.ts`. Swap the `JSON.parse` of Task 1 for `messagesFor("en")("Pages.NotFound.message")` and add `shows the sentence in the URL's language` for `/ru/no-such-page` and `/de/no-such-page`: `html[lang]` is the locale, the paragraph has `messagesFor(locale)("Pages.NotFound.message")`.
- [ ] **Step 2:** In the listed specs, replace every English interface literal used on `/ru` or `/de` with `messagesFor(locale)(key, values)`. A regex over a formatted string (`/^Show all \d+ skills$/`) becomes the formatted string for the counted value or a check of the role and `href` without the name. Content literals (company names, About questions, the person's name) stay.
- [ ] **Step 3:** `grep -nE 'goto\(.?/(ru|pt|es|de|fr|ja|pl)' e2e/*.ts` and read each hit: every interface string on those pages comes from `messagesFor`.
- [ ] **Step 4:** Definition of done; the e2e suite passes with the locales still empty.
- [ ] **Step 5:** `git add e2e`; tick Task 2.

### Task 3: The translation test and seven translations

**Files:**
- Create: `src/shared/lib/i18n/translations.test.ts`
- Modify: `package.json`, `package-lock.json` (`npm install -D @formatjs/icu-messageformat-parser@3.5.22`), `messages/{ru,pt,es,de,fr,ja,pl}.json`, `src/shared/lib/i18n/load-messages.test.ts`

**Interfaces:**
- Consumes: `locales` from `@/shared/lib/locales`; `parse` and `TYPE` from `@formatjs/icu-messageformat-parser`; `createTranslator` from `next-intl`.

- [ ] **Step 1:** Install the devDependency. Write `translations.test.ts`: for each locale but `en`, the six checks of the spec's "The translation test", with `INHERITED` (the list in Global constraints) in the file. Sample values for the format check: strings `code: "DE"`, `phone: "+1 555 0100"`, `email: "a@b.dev"`, `name: "React"`, `query: "x"`, `theme: "dark"`; numbers `2` for the rest, and `years` at each of `0.9`, `1`, `1.3`, `2.5`, `5`, `21`, `22`, `25`. Plus pinned cases:

```ts
it.each([
  ["ru", 1.3, "1,3 года"], ["ru", 21, "21 год"], ["ru", 22, "22 года"], ["ru", 25, "25 лет"],
  ["pl", 1, "1 rok"], ["pl", 2.5, "2,5 roku"], ["pl", 22, "22 lata"], ["pl", 25, "25 lat"],
  ["fr", 1.5, "1,5 an"], ["de", 2.5, "2,5 Jahre"], ["ja", 3, "3年"],
])("%s formats %s years as %s", (locale, years, text) => {
  expect(messagesFor(locale)("Pages.Home.experience.duration", { years })).toBe(text);
});

it("puts a no-break space before the colon in French", () => {
  expect(read("fr").Pages.Common.LocaleMenu.triggerAria).toBe("Langue : {code}");
});
```

(`messagesFor` and `read` here are small local helpers of the test file, not the e2e helper.)
- [ ] **Step 2:** `npx vitest run src/shared/lib/i18n/translations.test.ts` → FAIL: the completeness check lists every key for all seven locales; the pinned cases fail.
- [ ] **Step 3:** Change `load-messages.test.ts`: "gives every locale the key paths of English" (the merged tree of each locale has exactly English's key paths).
- [ ] **Step 4:** Write `ru.json`, run the test file, fix until the `ru` block is green; then `de`, `fr`, `es`, `pt`, `pl`, `ja` the same way. Each file holds `Pages` with every key but the inherited ones, in English's key order, and `Pages.NotFound.message`.
- [ ] **Step 5:** Definition of done; e2e stays green (it reads the new translations through `messagesFor`).
- [ ] **Step 6:** `git add package.json package-lock.json messages src/shared/lib/i18n`; tick Task 3.

### Task 4: Documentation

**Files:**
- Modify: `docs/architecture/Localization.md` (every locale translates the interface; conventions in short; inherited keys; the translation test; the 404 page), `docs/project/Open Questions.md` (`hreflang` on the CV link), `docs/architecture/Content Model.md` (`Pages.NotFound` in the JSON section), `docs/Home.md`, `docs/journal/2026-11-10.md` (append), this plan and the spec (`status: done`)

- [ ] **Step 1:** Update the notes; `grep -rn "Only \`en\` has messages\|fall back to it" docs` finds no statement that only English has interface strings, except in notes that describe the past.
- [ ] **Step 2:** `git add docs`; tick Task 4. Then the commit question and the version, per `CLAUDE.md`.
