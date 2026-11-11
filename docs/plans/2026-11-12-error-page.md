---
tags: [plan, error]
status: done
date: 2026-11-12
---

# Plan: Error page

A localized, static Error page for `[locale]/error.tsx` and `global-error.tsx`, sharing its pieces with the 404, without the header; and a stricter favicon handler. The checklist in this note is the ledger: a task is ticked when its delta is staged.

**Goal:** any exception shows the site's "500" page in the visitor's language and theme, with one Reload button, instead of Next's white "Application error" screen.

**Architecture:** shared visual pieces in `src/shared/ui` (`StatusPage`, `StatusCode`, the pill style); one client view `src/views/error/ErrorContent.tsx` fed with texts by two thin boundaries; the header hidden by a `:has()` rule while the page is in the DOM.

**Tech stack:** Next 16.4 (error boundaries get `{ error, retry }`), React 19 (`<title>` hoisting), next-intl 4, Tailwind v4, Vitest + RTL, Playwright.

**Spec:** [[2026-11-12-error-page-design]] (read it with this plan).

## Global constraints

- Stages, not commits; inline, one task at a time; every task ends with `git add` of its delta and a tick here.
- Definition of done for every task: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- No comments in code; FSD layers and the boundaries lint; components as `FC` with props destructured on the first line; no barrel files.
- No motion: no tilt, no bob, no hover rotation, no spinner. The number is always "500".
- Never render `error.message`; the Error ID only from `error.digest`, only when set.
- No test-only code in `src/`.
- Texts only from `Pages.Error` (`metaTitle`, `label`, `title`, `text`, `errorId`, `reload`, `reloading`); the global dictionary is checked against them.

## Review focus

- **A value thrown that is not an `Error`** (a string, `null`): the page still renders, without an Error ID (Task 3 unit test "renders without an Error ID when the thrown value is not an Error").
- **A double click on Reload** reloads once: the button is disabled after the first click (Task 3 unit test "reloads once on a double click").
- **The header after the page leaves the DOM**: nothing keeps it hidden on a later page; the rule depends only on the page being present (Task 4 e2e "brings the header back after a reload").
- **A path whose first segment is not a locale** (`/wp-login.php`, `/`): `global-error` speaks English (Task 3 unit test of `getErrorLocale`).
- **A long translated title on a 320 px phone**: no horizontal scroll in `de` and `pl` (Task 4 e2e).

## Tasks

- [x] Task 1: Favicon guard
- [x] Task 2: Shared status pieces, the 404 rebuilt on them
- [x] Task 3: Error texts, `ErrorContent` and the global dictionary
- [x] Task 4: The two boundaries, the hidden header, e2e
- [x] Task 5: Documentation

### Task 1: Favicon guard

**Files:** `src/views/site-layout/favicon.ts`, `src/views/site-layout/favicon.test.ts`.

- [ ] **Step 1:** Tests: "throws when the icon is empty" (200, `content-type: image/x-icon`, empty body); "throws when the response is not an image" (200, `content-type: text/html`, a body). The existing "serves the bytes" test sends `content-type: image/vnd.microsoft.icon`.
- [ ] **Step 2:** `npx vitest run src/views/site-layout/favicon.test.ts` → the two new tests FAIL.
- [ ] **Step 3:** `loadIcon` throws when `content-type` does not start with `image/` or `byteLength === 0`, the URL in the message.
- [ ] **Step 4:** Same command → PASS. `npm run build`: `/favicon.ico` still STATIC with 2,439 bytes in `.next/server/app/favicon.ico.body`.
- [ ] **Step 5:** Definition of done; `git add`; tick.

### Task 2: Shared status pieces, the 404 rebuilt on them

**Files:** Create `src/shared/ui/StatusPage.tsx`, `src/shared/ui/StatusPage.test.tsx`, `src/shared/ui/StatusCode.tsx`, `src/shared/ui/StatusCode.test.tsx`, `src/shared/ui/status-pill.ts`; modify `src/views/not-found/NotFoundPage.tsx`.

**Interfaces (produces):**
- `StatusCode: FC<{ variant: "not-found" | "error" }>`: `aria-hidden="true"`, `data-status-code`; the 404 variant exactly as today's markup (`data-not-found-code` kept for the 404 tests); the error variant "5", "0", tile: `rotate-[8deg]`, `translate-y-[.04em]`, the `deco` square top left, the crack SVG of the spec, the chip of the prototype (`right:.04em; bottom:-.22em; .09em × .07em; rotate(24deg)`).
- `StatusPage: FC<StatusPageProps>` with `interface StatusPageProps { code: ReactNode; label: string; title: string; titleRef?: Ref<HTMLHeadingElement>; text: string; detail?: ReactNode; children: ReactNode; className?: string }`: today's `<main>` with the grid, the label, the `<h1>` (`tabIndex={-1}` when `titleRef` is given), the paragraph, `detail`, then `children`; `className` merged onto `<main>`.
- `statusPill: string` in `status-pill.ts`: the class list of today's "Back to home" link.

- [ ] **Step 1:** Tests: `StatusCode` "hides the number from assistive technology"; "draws 4, the tile, 4 for not-found"; "draws 5, 0, then the cracked tile for error" (the third child holds an `svg path` with `d="M58 -2 L50 22 L62 34 L46 52 L58 66 L44 102"`). `StatusPage` "renders one main and one h1 with the texts"; "makes the title focusable from code only when a ref is given" (`tabindex="-1"`); "renders the detail and the action after the text".
- [ ] **Step 2:** `npx vitest run src/shared/ui/Status` → FAIL.
- [ ] **Step 3:** Implement; `NotFoundPage` renders `StatusPage` with `StatusCode variant="not-found"` and its `Link` with `statusPill`.
- [ ] **Step 4:** Same command → PASS; `npx playwright test e2e/not-found.spec.ts` → PASS unchanged; a screenshot of `/en/does-not-exist` at 1280 and 390 px before and after, compared.
- [ ] **Step 5:** Definition of done; `git add`; tick.

**Task 2 notes:** Screenshots of `/en/does-not-exist` at 1280 × 800 and 390 × 844, light and dark, before and after: byte-identical; 404 e2e 32/32. The `<h1>` of `StatusPage` carries `outline-none`: it is focusable only from code, never by Tab.

### Task 3: Error texts, `ErrorContent` and the global dictionary

**Files:** `messages/*.json` (8), create `src/views/error/ErrorContent.tsx`, `ErrorContent.test.tsx`, `src/views/error/error-texts.ts`, `error-texts.test.ts`.

**Interfaces (produces):**
- `interface ErrorTexts { metaTitle: string; label: string; title: string; text: string; errorId: string; reload: string; reloading: string }` and `errorTexts: Record<Locale, ErrorTexts>`, `getErrorLocale(pathname: string): Locale` in `error-texts.ts`.
- `ErrorContent: FC<{ error: unknown; texts: ErrorTexts }>` (`"use client"`): `data-error-page` on its root; `<title>{metaTitle}</title>` and `<meta name="robots" content="noindex" />`; `StatusPage` with `StatusCode variant="error"`; the Error ID box (dashed mono, prototype's `.path` values) only when `error` is an object with a string `digest`; the `<button type="button">` in `statusPill` with the `RotateCwIcon` (18 px, stroke 2.4) and the label in `<span aria-live="polite">`; on click `data-busy`, `disabled`, label `reloading`, `window.location.reload()`; focus on the h1 and `console.error(error)` in an effect.

- [ ] **Step 1:** `Pages.Error` in `messages/en.json` from `docs/design/shared/messages.error.en.json`; the seven translations (French no-break spaces, Polish one-letter words bound, `metaTitle` with «Михаил Александров» in `ru`). `npx vitest run src/shared/lib/i18n` → PASS (the translation test covers the keys).
- [ ] **Step 2:** Tests in `error-texts.test.ts`: "matches Pages.Error of every messages file" (reads `messages/<locale>.json` with `mergeMessages` over English, compares with `errorTexts[locale]`); `getErrorLocale`: `/ru/about` → `ru`, `/de` → `de`, `/xx/a` → `en`, `/wp-login.php` → `en`, `/` → `en`.
- [ ] **Step 3:** Tests in `ErrorContent.test.tsx` (mock `window.location.reload`): "shows the texts and a hidden 500"; "shows the Error ID only with a digest" (`{ digest: "7f3a9c21" }` shows `7f3a9c21`; an `Error` without digest shows no box); "never shows the message" (`new Error("secret")`); "renders without an Error ID when the thrown value is not an Error" (`"boom"`, `null`); "moves focus to the title"; "turns the button busy and reloads" (label `Reloading…`, `disabled`, `data-busy`, `reload` called once); "reloads once on a double click"; "sets the title and noindex" (`document.title`, `meta[name=robots]`); "logs the error" (`console.error` spied).
- [ ] **Step 4:** `npx vitest run src/views/error` → FAIL.
- [ ] **Step 5:** Implement.
- [ ] **Step 6:** Same command → PASS.
- [ ] **Step 7:** Definition of done; `git add`; tick.

**Task 3 notes:** The forms of address follow the existing translations (`Sie`, `usted`, `você`, `vous`, `вас`; `Państwa` in Polish, as the interview's `Pan` is gendered); French uses U+00A0 before the colon, Polish binds `a` to the next word. `errorTexts` was generated from the messages files and is guarded by the comparison test. Ruling: no `isLocale` helper exists, `getErrorLocale` finds the segment in `locales`; cost if wrong: none.

### Task 4: The two boundaries, the hidden header, e2e

**Files:** create `src/app/[locale]/error.tsx`, `src/app/global-error.tsx`, `e2e/error.spec.ts`; modify `src/widgets/header/Header.tsx` (`data-site-header`), `src/app/globals.css` (the rule).

**Interfaces (consumes):** `ErrorContent`, `errorTexts`, `getErrorLocale`, `ErrorTexts` from Task 3; `fontVariables` from `src/app/fonts.ts`.

- `[locale]/error.tsx`: `"use client"`, `{ error }`, `useTranslations("Pages.Error")` into `ErrorTexts`, renders `ErrorContent`.
- `global-error.tsx`: `"use client"`, `{ error }`; `<html lang={locale} className={...fontVariables, theme} suppressHydrationWarning>`; locale from `getErrorLocale(window.location.pathname)` on the client, `en` on the server; theme from `localStorage.getItem("theme")` (`light`/`dark`, otherwise `matchMedia("(prefers-color-scheme: dark)")`), `dark` on the server; imports `./globals.css`; `<body>` with `ErrorContent` and the dictionary's texts.
- `globals.css`: `:root:has([data-error-page]) [data-site-header] { display: none; }` in the components layer.

- [ ] **Step 1:** Find the browser APIs: a scratchpad experiment on the e2e build proves which API, made to throw in `addInitScript`, reaches `[locale]/error.tsx` from a page component (e.g. `IntersectionObserver` on `/en/about`, unless `next/link` reaches it first) and which reaches `global-error.tsx` from the root layout (e.g. `MutationObserver`, used by `ThemeColorSync`). Ruling in the notes.
- [ ] **Step 2:** `e2e/error.spec.ts` (`allowedConsoleErrors` for the provoked error only): page boundary — "shows the 500 page without the header" (`main[data-error-page]`, the h1 text from `messagesFor("en")`, `[data-site-header]` hidden, focus on the h1, no Error ID, title `metaTitle`, `noindex`); "speaks the language of the URL" (`/ru/about`); "reloads the page" (click, the URL is the same, the button showed `Reloading…`); "brings the header back after a reload" (without the sabotage after the reload, the header is visible). Global boundary — "shows the 500 page in the URL's language without any header" (`/de/...`: `html[lang=de]`, the German h1); "keeps the visitor's stored theme" (`localStorage` theme `dark` with an OS light scheme → `html.dark`). Both: no horizontal scroll at 320 px in `de` and `pl`.
- [ ] **Step 3:** `npx playwright test e2e/error.spec.ts` → FAIL (Next's default screen).
- [ ] **Step 4:** Implement the boundaries, the attribute and the rule.
- [ ] **Step 5:** Same command → PASS; screenshots of both boundaries, light and dark, 1280 and 390 px, against `docs/design/error/screens/` for the owner.
- [ ] **Step 6:** Definition of done; the route table as before plus the boundaries; `git add`; tick.

**Task 4 notes:** Ruling: the page boundary is triggered by a throwing `ResizeObserver` on `/<locale>/skills` (`ScrollFade`) and the global one by a throwing `MutationObserver` (`ThemeColorSync`, the only user); `IntersectionObserver` was rejected because `next/link` uses it in the header, inside the root layout. The sabotage runs once (a `sessionStorage` flag), so Reload brings back the real page. Ruling: the page-boundary test asserts the header is in the DOM *and* hidden — `toBeHidden()` alone also passes when the global boundary removed the header; mutation check: without the `:has()` rule the test fails. Ruling: the expectation "500" became the three glyphs `5`, `0` and the empty tile — the tile carries no text. Ruling: the prototype's `.chip` CSS has no element in the prototype's markup and no trace in the screenshots; the fragment it drew below the tile was removed; cost if wrong: none. Before RED, Next 16's default screen read "This page couldn’t load". `global-error.tsx` reads the theme and the locale during render in the browser (`dark` and `en` on the server), so there is no flash.

### Task 5: Documentation

- [ ] **Step 1:** [[Content Model]] (`Pages.Error`, `metaTitle` as the exception to [[ADR-0016 Metadata in Markdown]]); [[Rendering Strategy]] (the error boundaries, when they show); [[Localization]] (the global dictionary and its test); [[Roadmap]] (error boundary done; `loading.tsx` not needed, Suspense streaming not needed: every route is static); spec and plan status; `docs/Home.md`; journal [[2026-11-12]].
- [ ] **Step 2:** `git add`; tick. Then the final review and the end-of-step question to the owner.

**Final review** (fresh reviewer, Opus, on `git diff --cached`): no Critical. Final: fixed `localStorage` throwing a `SecurityError` where site data is blocked, inside the last-resort boundary — `readTheme` moved to `src/views/error/read-theme.ts` with a try/catch; "follows the system when the storage is blocked" RED (`SecurityError`) → GREEN, suite 487/487. Final: fixed (re-graded from Minor: a test that cannot fail guards nothing) the 320 px check, which `<main>`'s `overflow-hidden` made blind — it now asserts the h1 is not clipped and the h1 and the button end inside the screen; mutation `whitespace-nowrap` on the h1 fails all three. Final: fixed (re-graded from Minor: a possible flaky test) the race of `click()` then `waitForEvent("load")` — `Promise.all`.
Final: minor (deferred): a prerendered `_global-error` document served and hydrated would show English first and log a hydration mismatch (texts differ, `suppressHydrationWarning` covers `<html>` only); unreachable today, every route being static.
Final: minor (deferred): a reload cancelled with Esc or Stop leaves the button disabled on "Reloading…"; F5 still works.
Final: minor (deferred): the `:has()` rule sits in `@layer components`, so a future display utility on the `<header>` would win; the e2e test guards it.
