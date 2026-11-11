---
tags: [plan, 404]
status: done
date: 2026-11-11
---

# Plan: Not Found page

A server-rendered, localized 404 through `global-not-found.tsx`, with the static design of the handoff. The checklist in this note is the ledger: a task is ticked when its delta is staged.

**Goal:** every unknown URL answers 404 with real HTML in the URL's language, looking as [[Not Found Page Handoff]] shows, without motion.

**Architecture:** `app/global-not-found.tsx` renders the document with the theme outside a `<Suspense>` and the localized page inside it; next-intl's Proxy header gives the locale; the catch-all and `[locale]/not-found.tsx` go away.

**Tech stack:** Next 16.4 (Cache Components, `experimental.globalNotFound`), next-intl 4, Tailwind v4, Vitest, Playwright.

**Spec:** [[2026-11-11-not-found-page-design]] (read it with this plan).

## Global constraints

- Stages, not commits; inline, one task at a time; definition of done: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- No comments in code; FSD layers; components as `FC` with props destructured on the first line.
- Texts only from the messages files (`Pages.NotFound`) and `meta.md` (`NotFound.title`).
- No motion on the page.

## Review focus

- A theme flash on the 404: the theme script must run before the first paint, outside the `<Suspense>`.
- A 404 that becomes 200: anything that starts the stream before the 404 is decided (the status is set by the routing level; check it on every e2e run).
- `/robots.txt`, `/favicon.ico`, `/_next/*` must not be redirected by the wider matcher.
- An unsupported `X-NEXT-INTL-LOCALE` value must not throw `notFound()` inside the 404.
- The header's locale menu on a 404 leads to the same unknown path in another locale, which is again a 404.

## Tasks

- [x] Task 1: Texts and title
- [x] Task 2: Server-rendered localized 404
- [x] Task 3: The look
- [x] Task 4: Documentation

### Task 1: Texts and title

**Files:** `messages/*.json`, `messages/*/meta.md`, `e2e/content/en/meta.md`, `src/content/schemas.ts`, `src/content/meta.ts`, `src/content/meta.test.ts`, `e2e/meta-content.ts`.

**Interfaces:** Produces `getNotFoundMeta(locale: Locale): Promise<{ title: string }>` in `src/content/meta.ts`; `readMeta` returns `NotFound` too; `PageKey` unchanged.

- [x] **Step 1:** In `meta.test.ts`, "reads the NotFound title, falling back to English": a fixture tree with `NotFound.title` in `en` and another in `ru`; `readMeta(root, "ru").NotFound.title` is the Russian one, `readMeta(root, "de").NotFound.title` the English one. Plus "rejects a NotFound with a description" (strict schema).
- [x] **Step 2:** `npx vitest run src/content/meta.test.ts` → FAIL.
- [x] **Step 3:** `notFoundMetaSchema = z.strictObject({ title: text })` in `metaSchema`; `readMeta` returns `NotFound`; `getNotFoundMeta` cached like the others. Add `NotFound.title` to the eight `meta.md` files and to the e2e fixture.
- [x] **Step 4:** Same command → PASS.
- [x] **Step 5:** `Pages.NotFound` in the eight JSON files: `label`, `title`, `text`, `home`; `message` removed (the old page keeps building: it reads `title` for now). `npx vitest run src/shared/lib/i18n` → PASS.
- [x] **Step 6:** `git add`; tick.

**Task 1 notes:** the strict `NotFound` schema caught a description (mutation to `z.object` failed the test); 421 unit, 499 e2e, lint, type check, build. The old page reads `title` and the two old 404 e2e checks read `Pages.NotFound.title` until Task 2 moves them.

### Task 2: Server-rendered localized 404

**Files:** Create `src/app/global-not-found.tsx`, `src/views/not-found/NotFoundPage.tsx`; modify `next.config.ts`, `src/proxy.ts`, `src/shared/lib/i18n/request.ts`, `request.test.ts`, `src/app/[locale]/layout.tsx` (shared pieces), `e2e/metadata.spec.ts`, `e2e/i18n-routing.spec.ts`; delete `src/app/[locale]/[...rest]/`, `src/app/[locale]/not-found.tsx`.

**Interfaces:** `NotFoundPage: FC` (async server component, reads `getTranslations("Pages.NotFound")`).

- [x] **Step 1:** `request.test.ts`: with the root param mocked to `undefined` and `requestLocale` resolving to `"ru"`, the config's locale is `ru`; with `"xx"`, it is `en` and `notFound` is not called; with the root param `"de"`, `requestLocale` is not read.
- [x] **Step 2:** `npx vitest run src/shared/lib/i18n/request.test.ts` → FAIL. Implement; → PASS.
- [x] **Step 3:** e2e in a new `e2e/not-found.spec.ts` (the 404 tests of `metadata.spec.ts` and `i18n-routing.spec.ts` move here): status 404 for `/en/does-not-exist`, `/xx` (after the redirect) and `/wp-login.php`; with `javaScriptEnabled: false`, the h1, label, text and button of `messagesFor("en")`; `/ru/x` and `/de/x` in their language (`main[lang]`); `/wp-login.php` with the `NEXT_LOCALE=ru` cookie in Russian; the title from `e2e/content/en/meta.md`; `noindex`; the button leads to `/ru` from `/ru/x`; `/robots.txt` and `/favicon.ico` are not redirected.
- [x] **Step 4:** `npm run build && npx playwright test e2e/not-found.spec.ts` → FAIL (empty shell, old texts).
- [x] **Step 5:** Implement: the flag, `global-not-found.tsx` (document, fonts, `globals.css`, theme outside, localized part in `<Suspense>`, `generateMetadata` or a `<title>` if metadata cannot read the header), the view with semantic markup only, the Proxy matcher, deletions. Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md` first.
- [x] **Step 6:** Same command → PASS; definition of done; `git add`; tick.

**Task 2 notes:**
- `request.ts`: root param first, then `requestLocale`, an unsupported request locale falls back to `en` (5 unit tests, two RED first).
- `e2e/not-found.spec.ts` replaces the 404 tests of `metadata.spec.ts` and `i18n-routing.spec.ts`; 16 of 22 failed before (the empty shell), all pass after.
- Ruling: the localized part inside `<Suspense>` under a static `<html>` (the spec's plan) left the page blank without JavaScript: React inserts late Suspense content with an inline script. The whole document is wrapped in `<Suspense>` instead (`generate-viewport.md` documents it for an entirely dynamic route): `/_not-found` is `ƒ`, the HTML arrives complete, and `<html lang>` is the page's locale. Cost if wrong: none found; the theme script is part of the same document.
- Ruling: `robots: null` in the 404's metadata, so only Next's `noindex` remains instead of two robots tags.
- Ruling: the comments in `src/proxy.ts` removed (the no-comments rule; the matcher's comment had become wrong).
- `src/app/fonts.ts` shares the fonts of the locale layout and the global 404; the 404's metadata lives in `src/views/not-found/metadata.ts` (the boundaries lint forbids `app` → `content`).
- Definition of done: 425 unit, 505 e2e, lint, type check, build.

### Task 3: The look

**Files:** `src/views/not-found/NotFoundPage.tsx`, maybe an arrow icon in `src/shared/ui`, `e2e/not-found.spec.ts`.

- [x] **Step 1:** e2e: one `main`, one `h1`, the "404" `aria-hidden`; the content centered in the viewport under the header (desktop); the phone button as wide as the content box; no horizontal scroll at 320 px; the button's focus outline 2 px. → FAIL.
- [x] **Step 2:** The handoff's values as Tailwind classes; no animation, no transition on the tile; hover only adds the glow.
- [x] **Step 3:** → PASS; screenshots at 1120 and 360 px, light and dark, compared with the handoff by eye; definition of done; `git add`; tick.

**Task 3 notes:**
- 8 look checks (one `main`, one `h1`, the "404" `aria-hidden`, centered under the header, 2 px focus outline offset 4 px, the phone button across the content width, no sideways scroll at 320 px); 6 failed before, all pass after.
- Screenshots at 1120 × 700 and 360 × 700, light and dark, match the handoff.
- Ruling: the button stretches below `sm` (640 px) and is centered from there; type sizes and paddings switch at `lg` like every page. The handoff has a phone and a desktop frame only; a full-width pill across a 700 px tablet column looked accidental. Cost if wrong: one class.
- Ruling: hover adds only the glow, without transition or lift (the owner's "no motion").
- Definition of done: 425 unit, 513 e2e, lint, type check, build.

### Task 4: Documentation

- [x] ADR-0018 Global Not Found (the spikes, the costs); [[Rendering Strategy]] (the 404), [[Localization]] (the 404's locale), [[Content Model]] (`NotFound.title`), [[Roadmap]], [[Open Questions]], `docs/Home.md`, the journal; spec and plan to `done`. Definition of done; `git add`; tick; the commit question.
