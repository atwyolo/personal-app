---
tags: [spec, i18n]
status: done
date: 2026-11-10
---

# UI Translations Design

Status: **done 2026-11-10**. Plan: [[2026-11-10-ui-translations]].

Related: [[Localization]], [[Content Model]], [[ADR-0016 Metadata in Markdown]], [[ADR-0007 Testing]].

## Intent

Since [[ADR-0016 Metadata in Markdown]], `messages/en.json` holds only interface strings (`Pages`), and the owner considers it complete (2026-11-10). The other seven locales (`ru`, `pt`, `es`, `de`, `fr`, `ja`, `pl`) have empty files and show English everywhere. This change translates the interface strings into all seven, so the header, menus, buttons, labels and counters speak the visitor's language. Content (the Markdown in `messages/<locale>/`, metadata included) is not part of it and stays English through the per-field fallback.

## Goals

- `messages/<locale>.json` for each of the seven locales holds a translation of every string in `Pages`, except the keys listed under "Inherited keys".
- Every translation is valid ICU, uses the same arguments as English, and covers the plural categories its language needs for the values the site formats.
- The translations are checked by a unit test, so a broken message, a lost argument, a missing plural form, a typo in a key or a forgotten string fails `npm run test:run`.
- e2e tests that open a non-English locale take their expected strings from the messages files, not English literals.

## Non-goals

- Translating content: `messages/<locale>/*.md`, including `meta.md`. Pages under `/de` etc. will show a German interface with English content and an English `<title>`; that is the designed fallback.
- The Russian CV itself: the owner uploads it to Blob and sets `cvUrl` in `messages/ru/profile.md` later (`Content Model`: "A locale may set its own CV").
- `hreflang` on the CV link: an idea recorded in [[Open Questions]] (it needs the loader to know the CV's language, a code change).
- Changing English strings. The only change to `en.json` is the 404 sentence moving in (see "The 404 page"). One observation for later: `countAll` ("{total} skills") has no plural in English; the total is never 1 today.

## Anti-goals

- A translation that reads as personal or marketing copy. The owner wants a neutral, standard interface (2026-11-10).
- A label that promises the visitor a document in their language when the file is English.
- e2e tests that break when a translation is reworded.

## Decided by the owner (2026-11-10)

1. All seven locales are translated now.
2. **Tone: a neutral, standard interface** in every language, like the controls of large platforms (LinkedIn, Google): infinitives or nouns rather than addressing the visitor, and where a language's UI convention addresses the visitor, its standard form.
3. **CV:** two files are planned, Russian for `ru` and English for every other locale. So the label says "CV" in every locale except `ru`, where it says «резюме»; no "(in English)" note in the label or in `aria-label`. «Резюме» goes in now, before the Russian file exists: the owner fills in the content the same day, so the gap does not matter.
4. `@formatjs/icu-messageformat-parser` is added as a devDependency for the translation test (it is already installed as a dependency of next-intl, at 3.5.22).
5. e2e tests on non-English locales read their expected strings from the messages files.
6. **The 404 page is part of the interface** and is translated too.

## Translation conventions

- **Variants:** `pt` is Brazilian Portuguese (the target market in [[Localization]]); `es` is neutral Spanish, understood in Spain and Latin America (no *vosotros*, no regionalisms).
- **Actions:** the language's standard UI form: infinitive in `ru`, `de`, `fr`, `es`, `pt` ("Открыть меню", "Menü öffnen", "Ouvrir le menu", "Abrir menú", "Abrir menu"), imperative in `pl` ("Otwórz menu", as Polish platform UIs do), plain dictionary form in `ja` for controls ("メニューを開く"), polite です/ます form for sentences (`About.intro`, `Skills.intro`).
- **CV:** "CV" everywhere except `ru` («резюме»): `de` "CV herunterladen", `fr` "Télécharger le CV", `es` "Descargar CV", `pt` "Baixar CV", `pl` "Pobierz CV", `ja` "CVをダウンロード", `ru` "Скачать резюме". The `aria-label` keeps the word "PDF" as English does.
- **Brands and codes stay as written:** WhatsApp, LinkedIn, PDF, the locale code in `triggerAria`.
- **Quotation marks** in `Skills.noMatch` follow the language: `ru` «…», `de` „…“, `fr` « … » (with no-break spaces inside), `es` «…», `pt` “…”, `pl` „…”, `ja` 「…」.
- **French spacing:** a no-break space (U+00A0) before `:`, and inside « ».
- **Plurals:** where the language inflects a counted noun, the message uses `plural` even when English uses a plain argument (`countAll`, `showAll` in `ru` and `pl`, for example). `duration` gets a fractional value (`getDurationYears` rounds to tenths: `0.9`, `1.3`, `2.5`), and for fractions CLDR selects `other` in `ru` and `pl` and `one` below 2 in `fr` and `pt`: the forms must read correctly for them ("2,5 года", "2,5 roku", "1,5 an", "1,5 ano").
- **Numbers** are formatted by next-intl (`#` and plain numeric arguments), so "2,5" in `ru`, `de`, `fr` comes for free; translations never write digits.

## The 404 page

`src/app/[locale]/not-found.tsx` hard-codes "This page does not exist." The sentence moves to `en.json` as `Pages.NotFound.message`, unchanged, and the page reads it with `getTranslations("Pages.NotFound")` (the locale comes from `next/root-params` through `src/shared/lib/i18n/request.ts`; the page gets no `params`). The heading "404" stays a literal. Both ways to the page, an unknown path (`/de/xx`, through the catch-all `[...rest]`) and `notFound()`, show the sentence in the URL's locale. The file stays a Next special file (`not-found.tsx`), default-exported as today; if it grows into a view, it moves to `src/views/` per `CLAUDE.md`, which is left to the builder.

## Inherited keys

A locale omits these keys and inherits them from English, because they are the same in every language:

- `Pages.Common.LocaleMenu.names.*`: endonyms, each language names itself.
- `Pages.Common.Contacts.whatsapp`, `Pages.Common.Contacts.linkedin`, `Pages.Common.Contacts.pdf`: brand names and the file type.
- `Pages.Common.Carousel.position` (`{current} / {total}`) and `Pages.Common.SkillRow.level` (`{level}/10`): no words.

Every other key is present in every locale file.

## The translation test

`src/shared/lib/i18n/translations.test.ts`, one `describe` per locale, reading `messages/<locale>.json` and `messages/en.json`:

1. **No unknown keys:** every key path in the locale file exists in English.
2. **Complete:** every English key path is in the locale file with a non-empty message, except the inherited keys above (an empty string or `null` would silently fall back to English).
3. **Valid ICU:** every message parses with `@formatjs/icu-messageformat-parser`.
4. **Same arguments:** the set of argument names in each message equals English's (types may differ: a plain `{total}` in English may be a `plural` in Russian).
5. **Select branches:** every `select` has the same option keys as in English.
6. **Plural forms:** every `plural` covers each category that `Intl.PluralRules(locale)` selects for the values 0 to 100 in steps of 0.1 (`getDurationYears` rounds to tenths); `other` is always present. This requires `few` and `many` in `ru` and `pl`, and does not demand `fr`'s `many`, which CLDR reserves for millions.
7. **Formats:** each message formats with sample arguments through next-intl's `createTranslator` for that locale without an error.

Inherited keys and the list of them live in the test file.

## Tests that change

- `src/shared/lib/i18n/load-messages.test.ts`: "a locale without translations equals English" no longer holds. It becomes: the merged tree of every locale has the same key paths as English.
- e2e tests that open `/ru` or `/de` and find elements by English text: `header.spec.ts` (navigation names, "Open menu", "Main navigation"), `home-about.spec.ts`, `home-experience.spec.ts`, `home-skills.spec.ts` (section and link names on `/de`), `skills.spec.ts` (`/ru/skills` heading and the "All" chip), and any other the e2e run reveals. They get their strings from a helper in `e2e/` that merges `en.json` with the locale's file and formats with `createTranslator`. Tests about content fallback (`/ru/about`, `/ru/experience` showing English pairs and jobs) keep their English content literals.
- Component tests that import `messages/en.json` stay as they are.
- e2e: a new check that `/de/xx` (or another non-English locale) shows the 404 sentence of that locale under its `lang`.

## Documentation

- `Localization`: every locale has its interface translated; the conventions above in short; the inherited keys; the translation test.
- `Open Questions`: `hreflang` on the CV link.
- `docs/Home.md`: the spec and the plan. Journal entry.

## Left to the builder

- The wording of each translation within the conventions above.
- The sample arguments for the format check and how the test walks the key tree.
- The e2e helper's name and shape.
