---
tags: [architecture, i18n]
updated: 2026-11-04
---

# Localization

Two layers, two mechanisms:

1. **UI strings and metadata**: `next-intl`, one JSON file per locale in `messages/` with two roots, `Pages` (interface texts) and `Meta` (titles, descriptions, site settings), routed via `src/app/[locale]/`.
2. **Content** (profile, skills, experience, About pairs): Markdown files with frontmatter in `messages/<locale>/`, merged over English per field, see [[Content Model]].

## Locales

`en` (default and fallback), `ru`, `pt`, `es`, `de`, `fr`, `ja`, `pl`.

Chosen for job-market relevance: markets where the local language matters in hiring (DACH, France, Spain/LatAm, Brazil, Japan, Poland). English covers NL, Nordics, Israel, India, Singapore. Candidates for later: `it`, `nl`, `ko`, `zh`.

## Rules

- Adding a locale = one config entry + one messages file. Content may stay untranslated: without a `messages/<locale>/` folder every page shows the English content.
- URL prefix for every locale, including the default (`/en/...`), to keep routing uniform and caching simple.
- `lang` attribute and `hreflang` alternates come from the locale segment.
- Dates/numbers formatted with `Intl` through `next-intl` helpers, never by hand.
- A path without a locale (`/`, `/about`) is redirected by `src/proxy.ts`: `NEXT_LOCALE` cookie first, then `Accept-Language`, then `en` (owner's decision, 2026-10-29). An unknown locale (`/xx`) is treated as a path and ends in a 404 under `/en/xx`.
- `NEXT_LOCALE` is set only when the visitor picks a locale other than their browser language, and lives one year (owner's decision; see the privacy item in [[Open Questions]]).
- `messages/en.json` is the only complete messages file. Other locales contain only translated keys; `src/shared/lib/i18n/load-messages.ts` deep-merges them over English: empty strings and `null` count as missing, booleans and numbers override. The same holds per field for the Markdown files' frontmatter; a non-empty body replaces the English body.
- Only `Pages` reaches the browser: the root layout gives `NextIntlClientProvider` `{ Pages }`, so `Meta` stays on the server.
- The locale is read from the root `[locale]` segment through `next/root-params` (next-intl's recommended setup with Cache Components), so every locale is prerendered.
- A language switch is client navigation with `router.replace`, not a full load: the root layout remounts, module state survives, attributes set on `<html>` by hand are cleared, and the old locale leaves no history entry (measured 2026-11-01).
- Config lives in `src/shared/lib/i18n/`: `routing.ts`, `request.ts`, `load-messages.ts`, `merge-messages.ts`, `navigation.ts` (locale-aware `Link`, `useRouter`), `app-config.d.ts` (typed locales and message keys).

## Fonts
- Geist / Geist Mono cover latin, latin-ext and cyrillic: every locale except `ja`. Preloaded: the Latin file of Geist only; Geist Mono is not preloaded, and cyrillic and the rest load on demand through `unicode-range`.
- `ja` uses the platform's Japanese UI font through a system stack (`--font-ja-system` in `src/app/globals.css`): Hiragino on Apple, Yu Gothic / Meiryo on Windows, Noto Sans CJK on Android. Chosen over Noto Sans JP via `next/font` to avoid a heavy CJK webfont (owner's decision, 2026-10-29).

Related: [[ADR-0015 Content in Files]], [[ADR-0003 Content Localization]] (superseded)
