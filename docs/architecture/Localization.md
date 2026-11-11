---
tags: [architecture, i18n]
updated: 2026-11-10
---

# Localization

Two layers, two mechanisms:

1. **UI strings**: `next-intl`, one JSON file per locale in `messages/` with one root, `Pages` (interface texts), routed via `src/app/[locale]/`.
2. **Content** (profile, skills, experience, About pairs, metadata): Markdown files with frontmatter in `messages/<locale>/`, merged over English per field, see [[Content Model]].

## Locales

`en` (default and fallback), `ru`, `pt`, `es`, `de`, `fr`, `ja`, `pl`.

Chosen for job-market relevance: markets where the local language matters in hiring (DACH, France, Spain/LatAm, Brazil, Japan, Poland). English covers NL, Nordics, Israel, India, Singapore. Candidates for later: `it`, `nl`, `ko`, `zh`.

## Rules

- Adding a locale = one config entry + one messages file with the whole interface translated. Content may stay untranslated: without a `messages/<locale>/` folder every page shows the English content.
- URL prefix for every locale, including the default (`/en/...`), to keep routing uniform and caching simple.
- `lang` attribute and `hreflang` alternates come from the locale segment.
- Dates/numbers formatted with `Intl` through `next-intl` helpers, never by hand.
- A path without a locale (`/`, `/about`) is redirected by `src/proxy.ts`: `NEXT_LOCALE` cookie first, then `Accept-Language`, then `en` (owner's decision, 2026-10-29). An unknown locale (`/xx`) is treated as a path and ends in a 404 under `/en/xx`.
- `NEXT_LOCALE` is set only when the visitor picks a locale other than their browser language, and lives one year (owner's decision; see the privacy item in [[Open Questions]]).
- Every locale translates the whole interface since 2026-11-10 ([[2026-11-10-ui-translations-design]]); the content is translated since 2026-11-11 ([[2026-11-11-content-translations-design]]), the domain labels of `skills.md` included; skill names stay English. Each `messages/<locale>.json` holds every key of `en.json` except the inherited ones, which are the same in every language: `LocaleMenu.names.*` (endonyms), `Contacts.whatsapp`, `Contacts.linkedin`, `Contacts.pdf`, `Carousel.position`, `SkillRow.level`. They come from English; `src/shared/lib/i18n/load-messages.ts` deep-merges them over English: empty strings and `null` count as missing. The same holds per field for the Markdown files' frontmatter, where nested objects merge field by field and `false` and numbers override; a non-empty body replaces the English body.
- **Translation conventions** (owner, 2026-11-10): a neutral, standard interface. `pt` is Brazilian Portuguese, `es` neutral Spanish. Actions are infinitives (`ru`, `de`, `fr`, `es`, `pt`), imperatives in `pl`, the dictionary form in `ja` (sentences in です/ます). The CV is "CV" everywhere except `ru` («резюме»): only an English and a Russian file exist. Quotation marks and French no-break spaces follow each language. A counted noun gets a `plural` wherever the language inflects it, even when English does not.
- **Content conventions** (owner, 2026-11-11): the name is «Михаил Александров» in `ru` and "Mikhail Aleksandrov" elsewhere; the title is «Senior Frontend-разработчик» in `ru` and "Senior Frontend Engineer" elsewhere. The interview questions address the candidate politely (`вы`, `Sie`, `vous`, `usted`, `você`, `Pan`, です／ます). Technology names and established terms stay English. Numbers follow the language (decimal comma, French no-break spaces before `:` and `%`); Polish binds one-letter words (`i`, `w`, `z`, `o`, `u`, `a`) to the next word with a no-break space. Content translations have no test (owner): a missing field falls back to English.
- **`src/shared/lib/i18n/translations.test.ts`** checks every locale: no keys English lacks, every key but the inherited ones with a non-empty message, valid ICU (parsed with `@formatjs/icu-messageformat-parser`), the same argument names and `select` branches as English, every plural category `Intl.PluralRules` selects for 0 to 100 in steps of 0.1 (`getDurationYears` rounds to tenths), and a clean format with sample values. A new English string fails it until all seven locales translate it.
- e2e tests take interface strings for any locale from the messages files through `e2e/messages.ts` (`messagesFor(locale)(key, values)`), never from literals.
- The 404 page (`src/app/[locale]/not-found.tsx`) reads `Pages.NotFound`; the locale comes from `next/root-params`, so `/de/xx` speaks German.
- Only `Pages` reaches the browser: the root layout gives `NextIntlClientProvider` `{ Pages }`. Metadata is content (`meta.md`) and stays on the server.
- The locale is read from the root `[locale]` segment through `next/root-params` (next-intl's recommended setup with Cache Components), so every locale is prerendered.
- A language switch is client navigation with `router.replace`, not a full load: the root layout remounts, module state survives, attributes set on `<html>` by hand are cleared, and the old locale leaves no history entry (measured 2026-11-01).
- Config lives in `src/shared/lib/i18n/`: `routing.ts`, `request.ts`, `load-messages.ts`, `merge-messages.ts`, `navigation.ts` (locale-aware `Link`, `useRouter`), `app-config.d.ts` (typed locales and message keys).

## Fonts
- Geist / Geist Mono cover latin, latin-ext and cyrillic: every locale except `ja`. Preloaded: the Latin file of Geist only; Geist Mono is not preloaded, and cyrillic and the rest load on demand through `unicode-range`.
- `ja` uses the platform's Japanese UI font through a system stack (`--font-ja-system` in `src/app/globals.css`): Hiragino on Apple, Yu Gothic / Meiryo on Windows, Noto Sans CJK on Android. Chosen over Noto Sans JP via `next/font` to avoid a heavy CJK webfont (owner's decision, 2026-10-29).

Related: [[2026-11-10-ui-translations-design]], [[ADR-0015 Content in Files]], [[ADR-0016 Metadata in Markdown]], [[ADR-0003 Content Localization]] (superseded)
