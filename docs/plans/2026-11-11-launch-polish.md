---
tags: [plan, launch, stage-8]
status: done
date: 2026-11-11
---

# Plan: Launch polish

Everything [[Launch Plan]] sections 1 and 2 ask for before the site opens to search engines. The checklist in this note is the ledger: a task is ticked when its delta is staged.

**Goal:** the owner's nine decisions implemented, the well-known URLs answering correctly, Lighthouse 100 on every page, a reliable test suite, all without making a single page dynamic.

**Architecture:** headers in `next.config.ts`; `robots.ts`, `sitemap.ts` and the favicon handler as prerendered route files; JSON-LD built in `src/shared/lib/json-ld.ts`; `theme-color` as static `viewport` tags plus a client leaf in `src/app/_providers/`; performance work measured on Vercel previews deployed from the working tree.

**Tech stack:** Next 16.4 (Cache Components), next-intl 4, next-themes, Tailwind v4, Vitest, Playwright, Lighthouse 12.8.2, Vercel CLI through `npx`.

**Spec:** [[2026-11-11-launch-polish-design]] (read it with this plan).

## Global constraints

- Stages, not commits; inline, one task at a time. Every task ends with `git add` of its whole delta and a tick here.
- Definition of done for every task: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- No comments in code; FSD layers and boundaries lint; components as `FC` with props destructured on the first line; no barrel files.
- No page becomes dynamic: after every task `npm run build` lists the same routes as `○`/`◐` as before Task 1.
- No test reads `messages/` ([[ADR-0017 Test Content Fixtures]]); e2e reads `e2e/content/`.
- Previews only: `npx vercel deploy`, never `--prod`, never `--prebuilt`.
- Lighthouse: `lighthouse@12.8.2`, mobile (default) and `--preset=desktop`, five runs per page, the median; every run sends `x-vercel-protection-bypass` (the previews are protected); the Vercel Toolbar is off for previews (owner, 2026-11-11), `x-vercel-skip-toolbar: 1` is still sent but did not stop it. Pages: `/en`, `/en/about`, `/en/experience`, `/en/skills`, `/ru`, `/ru/about`, `/ru/experience`, `/ru/skills`.
- A performance change stays only if the median of its target metric improves by more than the spread of the five runs before it. A page that cannot reach 100 without changing the designed look or motion stops the work: the owner decides.

## Review focus

- **A CSP violation on a page no test opens with a feature in use**, e.g. the locale or theme menu open, a Markdown link, the Experience progress bars: Task 3 opens both menus and walks every page of every locale in the console check.
- **A static route turning dynamic** through `headers()`, the favicon `fetch` or the async Home view: Task 2 and Task 4 compare the build's route table with Task 1's.
- **The favicon fetch at build time on Vercel** (Blob reachable, bytes not empty, the right type): Task 11 checks it with `curl` on the preview.
- **A wrapped chip changing the mobile row**: Task 7 checks the 390 px row is still one scrolling line.
- **The theme-color tags after a client navigation** (the root layout keeps its `<head>`): Task 6 switches the theme, navigates, and checks the tags again.

## Tasks

- [x] Task 1: Preview pipeline and the baseline
- [x] Task 2: Well-known URLs: favicon, robots, sitemap
- [x] Task 3: Security headers
- [x] Task 4: JSON-LD on Home and About
- [x] Task 5: Session locale cookie
- [x] Task 6: theme-color
- [x] Task 7: Skill chips wrap on desktop
- [x] Task 8: No header wipe on the 404
- [x] Task 9: Accessible name of the CV button
- [x] Task 10: The flaky "phone turns" test
- [x] Task 11: Infrastructure on a preview
- [x] Task 12: `/experience` LCP
- [x] Task 13: Text LCP render delay on `/about` and `/skills`
- [x] Task 14: Home photo bytes
- [x] Task 15: Legacy JavaScript
- [x] Task 16: Unused JavaScript
- [x] Task 17: The skill level bar as one element
- [x] Task 18: Final measurement and documentation

### Task 1: Preview pipeline and the baseline

**Task 1 notes:** baseline on preview `personal-jxk873nc4` (code of `5100a4b`), 80 runs, no failure; the previews are protected (Vercel Authentication), the bypass secret lives outside the repository. Medians in the journal (Task 18).

**Files:** Create `.vercelignore`; delete `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`. Throwaway scripts live in the session's scratchpad, not in the repository.

**Interfaces:** Produces the baseline route table (`npm run build` output, kept in the scratchpad) and the baseline Lighthouse medians (in the journal, Task 18).

- [ ] **Step 1:** `.vercelignore`: `.env*`, `.next/`, `node_modules/`, `test-results/`, `playwright-report/`, `blob-report/`, `coverage/`, `*.tsbuildinfo`, `.DS_Store`.
- [ ] **Step 2:** Delete the five `public/` files; `grep -rn "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" src e2e` → nothing.
- [ ] **Step 3:** `npm run build`; save the route table to the scratchpad.
- [ ] **Step 4:** The owner runs `! npx vercel login`. Then `npx vercel deploy` (the preview URL is printed). `curl -sI <url>/en`: a `401` means Vercel Authentication is on; then the owner creates the Protection Bypass for Automation secret and exports it as `VERCEL_AUTOMATION_BYPASS_SECRET` in the shell, never in a file of the repository.
- [ ] **Step 5:** A scratchpad script runs Lighthouse five times per page and preset (pages and headers in Global constraints) and prints per page the medians of the four scores, LCP, TBT, CLS, the LCP element, and the spread. Run it on the preview: this is the baseline.
- [ ] **Step 6:** `git add -A .vercelignore public`; tick.

### Task 2: Well-known URLs: favicon, robots, sitemap

**Files:** Modify `src/views/site-layout/favicon.ts`; create `src/views/site-layout/favicon.test.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/shared/lib/sitemap.ts`, `src/shared/lib/sitemap.test.ts`; modify `e2e/not-found.spec.ts` (favicon checks) and `e2e/metadata.spec.ts` (robots, sitemap).

**Interfaces:**
- Produces `GET(): Promise<Response>` in `favicon.ts` (unchanged signature).
- Produces `sitePaths: readonly ["", "/about", "/experience", "/skills"]` and `buildSitemap(base: URL): MetadataRoute.Sitemap` in `src/shared/lib/sitemap.ts`.

- [ ] **Step 1:** `favicon.test.ts` (mock `@/content/meta` and global `fetch`): "serves the bytes of iconIcoUrl" (body equals the mocked bytes, status 200, `content-type: image/x-icon`); "answers 404 without an icon" (`iconIcoUrl: null`, no fetch made); "throws when the icon cannot be fetched" (fetch answers 404 → `GET()` rejects).
- [ ] **Step 2:** `npx vitest run src/views/site-layout/favicon.test.ts` → FAIL.
- [ ] **Step 3:** `GET` fetches `iconIcoUrl`, throws on a non-OK response, returns `new Response(await response.arrayBuffer(), { headers: { "content-type": "image/x-icon" } })`.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** `sitemap.test.ts`: "lists every page of every locale" (32 entries, `url` absolute on the given base, e.g. `https://example.com/ru/about`); "gives every entry its alternates" (`alternates.languages` holds the 8 locales and `x-default`, absolute: `x-default` of `/about` is `https://example.com/about`); "has no 404 and no lastModified".
- [ ] **Step 6:** `npx vitest run src/shared/lib/sitemap.test.ts` → FAIL.
- [ ] **Step 7:** `buildSitemap` from `locales`, `sitePaths` and `getLocaleAlternates`, turning its relative paths absolute with `new URL(path, base).href`. `src/app/sitemap.ts`: default export returning `buildSitemap(siteUrl)`. `src/app/robots.ts`: default export returning `{ rules: { userAgent: "*", allow: "/" }, sitemap: new URL("/sitemap.xml", siteUrl).href }`.
- [ ] **Step 8:** Same command → PASS.
- [ ] **Step 9:** e2e: `/favicon.ico` answers 404 (the fixture's `iconIcoUrl` is `null`); `/robots.txt` answers 200 with `Allow: /` and `Sitemap: http://localhost:3100/sitemap.xml`; `/sitemap.xml` answers 200 with 32 `<loc>` and `hreflang="x-default"` alternates. `npx playwright test e2e/not-found.spec.ts e2e/metadata.spec.ts` → PASS.
- [ ] **Step 10:** `npm run build`: `/favicon.ico`, `/robots.txt`, `/sitemap.xml` are `○`; every other route as in Task 1.
- [ ] **Step 11:** Definition of done; `git add`; tick.

**Task 2 notes:** Ruling: the icon `fetch` moved into a `"use cache"` helper (`loadIcon`, `cacheLife("max")`) — with Cache Components a network request stops the prerender and the first build left `/favicon.ico` out of `prerender-manifest.json` (dynamic) — verified by the manifest (`renderingMode: STATIC`, body 2439 bytes); cost if wrong: one function call per favicon request. The route table no longer prints the Revalidate/Expire columns once `robots.txt` and `sitemap.xml` (no revalidation) join it; the manifest still gives every page 2592000 / 31536000.

### Task 3: Security headers

**Files:** Create `src/shared/lib/security-headers.ts`, `src/shared/lib/security-headers.test.ts`, `e2e/security-headers.spec.ts`, `docs/decisions/ADR-0019 Security Headers.md`; modify `next.config.ts`.

**Interfaces:** Produces `buildSecurityHeaders(params: { development: boolean }): { key: string; value: string }[]` in `security-headers.ts`; `next.config.ts` imports it by a relative path and returns `[{ source: "/:path*", headers: buildSecurityHeaders({ development: process.env.NODE_ENV === "development" }) }]` from `headers()`.

- [ ] **Step 1:** `security-headers.test.ts`: "sets the six headers" (keys of the spec's table); "builds the CSP of the spec" (the exact string of the spec's table, without `upgrade-insecure-requests`); "adds 'unsafe-eval' to script-src only in development".
- [ ] **Step 2:** `npx vitest run src/shared/lib/security-headers.test.ts` → FAIL.
- [ ] **Step 3:** Implement; the Blob origin comes from the same constant as `images.remotePatterns` if one exists, otherwise both use one new constant in `security-headers.ts`.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** `e2e/security-headers.spec.ts`: the six headers on `/en`, on `/favicon.ico` and on a `/_next/static/` asset taken from the page; "has no CSP violation with the menus open": every page of every locale, open the locale menu and the theme menu (desktop) or the mobile menu (mobile); the console check of `e2e/fixtures.ts` fails on a violation.
- [ ] **Step 6:** `npx playwright test e2e/security-headers.spec.ts` → PASS; then the full e2e run → PASS (every page under the console check with the CSP on).
- [ ] **Step 7:** `npm run dev`, open `/en`: no CSP error in the console (the development policy).
- [ ] **Step 8:** ADR-0019 from the template: context (no headers but HSTS), decision (the table, no nonce, no `upgrade-insecure-requests`, same policy on previews, the toolbar blocked there), alternatives (none, basic set, nonce, SRI), consequences (a new external resource needs the CSP; the console check guards it).
- [ ] **Step 9:** Definition of done (route table unchanged); `git add`; tick.

**Task 3 notes:** Ruling: the Blob origin lives in `src/shared/lib/blob-origin.ts`, imported by a relative path from `next.config.ts` (`@/` does not resolve there) and by `security-headers.ts` — one source for `remotePatterns` and `img-src`; cost if wrong: none. Ruling: the menus are opened on `/en` only, the 32 pages are loaded and scrolled — the menus are the same in every locale; cost if wrong: a locale-specific menu violation goes unseen. Finding: no page loads an image from Blob directly (every image goes through `/_next/image`), so removing Blob from `img-src` breaks nothing in e2e; kept for the icons linked from `<head>`, checked on the preview (Task 11). Mutation check: without `'unsafe-inline'` in `script-src` all 34 tests of `e2e/security-headers.spec.ts` fail. `next dev` (the owner's server on :3000): `'unsafe-eval'` present, no console error on four pages.

### Task 4: JSON-LD on Home and About

**Files:** Modify `src/shared/lib/json-ld.ts`, `src/shared/lib/json-ld.test.ts`, `src/views/home/HomePage.tsx`, `src/views/about/AboutPage.tsx`, `e2e/about.spec.ts`; create `e2e/structured-data.spec.ts` (or extend `e2e/home.spec.ts`).

**Interfaces:** Produces in `json-ld.ts`:
- `personId(base: URL): string` → `` `${new URL("/", base).href}#person` ``
- `interface BuildPersonJsonLdParams { base: URL; name: string; englishName: string; jobTitle: string; photoUrl: string | null; linkedinUrl: string }`
- `buildPersonJsonLd(params: BuildPersonJsonLdParams): Record<string, unknown>`: `@type: "Person"`, `@id`, `name`, `jobTitle`, `url` (site root), `image` (only when `photoUrl`), `sameAs: [linkedinUrl]`, `alternateName: englishName` only when it differs from `name`.
- `buildHomeJsonLd(params: { person: Record<string, unknown>; siteName: string; locale: Locale; base: URL }): Record<string, unknown>`: `@context` and `@graph: [WebSite, person]`, `WebSite` with `name`, `url` (site root), `inLanguage`.

- [ ] **Step 1:** Unit tests: "gives the person a stable id on the site root"; "adds alternateName only when the name differs from English"; "leaves image out without a photo"; "never carries email or telephone"; "puts WebSite and Person into one graph".
- [ ] **Step 2:** `npx vitest run src/shared/lib/json-ld.test.ts` → FAIL.
- [ ] **Step 3:** Implement. `HomePage` becomes async: `getLocale`, `getProfile(locale)`, `getProfile("en")` for `englishName`, `getSiteMeta(locale)`; renders the script first in `<main>`, as About does. `AboutPage` uses `buildPersonJsonLd` as `mainEntity`.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** e2e from the fixture's `profile.md` and `meta.md`: Home has one JSON-LD script whose `@graph` holds `WebSite` (`name` = `siteName`) and `Person` with `@id` `http://localhost:3100/#person`; About's `mainEntity["@id"]` is the same; no `email`, no `telephone` anywhere; `/ru` (fixture has English only) has no `alternateName`. → PASS.
- [ ] **Step 6:** Definition of done; Home still `◐`/`○` as in Task 1; `git add`; tick.

### Task 5: Session locale cookie

**Files:** Modify `src/shared/lib/i18n/routing.ts`, `e2e/i18n-routing.spec.ts`, `docs/architecture/Localization.md`; create `docs/decisions/ADR-0020 Session Locale Cookie.md`.

- [ ] **Step 1:** In `e2e/i18n-routing.spec.ts` replace the one-year assertion (line 66) with `expect(cookie!.expires).toBe(-1)` (a session cookie). Add "sets the cookie on a link to another language, not only on a pick": a context with `Accept-Language: en` opens `/ru`, the cookie is `ru`.
- [ ] **Step 2:** `npx playwright test e2e/i18n-routing.spec.ts` → the session assertion FAILS.
- [ ] **Step 3:** Remove `localeCookie: { maxAge: … }` from `routing.ts`.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** `Localization.md`: a session cookie, set on every document request whose locale differs from `Accept-Language` or from the cookie. ADR-0020: replaces the one-year decision of 2026-10-29; reasons (no notice needed, narrow benefit with `localePrefix: "always"`); alternatives (notice in the locale menu, no cookie).
- [ ] **Step 6:** Definition of done; `git add`; tick.

### Task 6: theme-color

**Files:** Create `src/shared/lib/theme-colors.ts`, `src/shared/lib/theme-colors.test.ts`, `src/app/_providers/ThemeColorSync.tsx`, `src/app/_providers/ThemeColorSync.test.tsx`; modify `src/shared/lib/metadata.ts` (+ test), `src/views/site-layout/metadata.ts`, `src/views/not-found/metadata.ts`, `src/app/[locale]/layout.tsx`, `src/app/global-not-found.tsx`, `src/app/_providers/ThemeProvider.tsx`, `e2e/theme.spec.ts`.

**Interfaces:**
- `themeColors: { light: "#ffffff"; dark: "#181e3b" }` in `theme-colors.ts`.
- `buildSiteViewport(): Viewport` in `metadata.ts` → `{ themeColor: [{ media: "(prefers-color-scheme: light)", color: themeColors.light }, { media: "(prefers-color-scheme: dark)", color: themeColors.dark }] }`; both `metadata.ts` views export `viewport = buildSiteViewport()`, re-exported by the layout and by `global-not-found.tsx` (check `global-not-found` accepts `viewport` in `node_modules/next/dist/docs/` first).
- `ThemeColorSync: FC` renders `null`; on `resolvedTheme` change sets `content` of every `meta[name="theme-color"]` to `themeColors[resolvedTheme]`. Rendered inside `NextThemesProvider` in `ThemeProvider.tsx`.

- [ ] **Step 1:** `theme-colors.test.ts`: "matches --card of globals.css in both themes" (reads `src/app/globals.css`, takes `--card` from the `:root` and the `.dark` blocks).
- [ ] **Step 2:** `ThemeColorSync.test.tsx` (mock `next-themes`' `useTheme`): "sets both tags to the dark colour when the resolved theme is dark"; "follows a change of theme"; "does nothing before the theme is resolved".
- [ ] **Step 3:** `metadata.test.ts`: "emits theme-color for both schemes".
- [ ] **Step 4:** `npx vitest run src/shared/lib src/app/_providers` → FAIL.
- [ ] **Step 5:** Implement.
- [ ] **Step 6:** Same command → PASS.
- [ ] **Step 7:** e2e in `theme.spec.ts`: two `theme-color` tags with the media queries; with OS dark and a stored light choice both tags read `#ffffff`; after switching the theme in the menu both read the new colour; after a client navigation to `/en/about` they still do; the 404 page has the tags. → PASS.
- [ ] **Step 8:** Definition of done; `git add`; tick.

**Task 6 notes:** Ruling: `ThemeColorSync` also watches `<head>` with a `MutationObserver` (`childList`) — the e2e test found that a client navigation replaces the `theme-color` tags with fresh ones carrying the system colours while `resolvedTheme` does not change; unit test "re-applies the colour when a navigation replaces the tags" RED→GREEN; cost if wrong: an observer per page that fires on head changes. The HTML test reads the tags with JavaScript disabled instead of matching a string: Next writes `content` before `media`. `global-not-found.tsx` accepts the `viewport` export (the 404 test passes).

### Task 7: Skill chips wrap on desktop

**Files:** Modify `src/shared/ui/ChipGroup.tsx`, `e2e/content/en/skills.md`, `e2e/skills.spec.ts`.

- [ ] **Step 1:** Fixture: the `tools` domain label becomes `Tools, Build Systems and Developer Experience`. `grep -rn "Tools" e2e` and fix any literal that is not read from the fixture.
- [ ] **Step 2:** e2e: "keeps every chip inside the filter column" (desktop, 1024×800: each chip's right edge ≤ the column's right edge); "keeps the mobile chips on one scrolling line" (mobile: all chips share one `y`, the row's `scrollWidth` > `clientWidth`).
- [ ] **Step 3:** `npx playwright test e2e/skills.spec.ts` → the desktop test FAILS.
- [ ] **Step 4:** `ChipGroup` item, `lg` only: `lg:h-auto lg:whitespace-normal lg:py-2 lg:text-left wrap-break-word`, keeping `min-h-9` and `rounded-full`. No edit to `src/shared/shadcn/`.
- [ ] **Step 5:** Same command → PASS; screenshot at 1024 px for the owner.
- [ ] **Step 6:** Definition of done; `git add`; tick.

**Task 7 notes:** Ruling: the desktop chip becomes `inline-block` with `max-w-full shrink` and `py-[9px]` — the shadcn item carries `shrink-0`, so the label never had a reason to wrap, and as a flex container it put the count in its own column beside the wrapped label; `inline-block` lets the count follow the text, `9px` keeps a one-line chip at 36 px (16 + 18 + 2 borders, asserted); cost if wrong: on desktop the gap before the count is a space (about 7 px in the mono font) instead of the 4 px flex gap. The fixture label is quoted: a comma separates pairs in a YAML flow mapping.

### Task 8: No header wipe on the 404

**Files:** Modify `src/app/global-not-found.tsx`, `e2e/not-found.spec.ts`.

- [ ] **Step 1:** e2e: "shows the header at once": on `/en/does-not-exist`, `<html>` has `data-revealed` in the server HTML (request without JavaScript) and `document.getAnimations()` holds no `wipe`.
- [ ] **Step 2:** `npx playwright test e2e/not-found.spec.ts` → FAIL.
- [ ] **Step 3:** `<html … data-revealed="">` in `global-not-found.tsx`.
- [ ] **Step 4:** Same command → PASS; `e2e/home-motion.spec.ts` still PASSES (the wipe on normal pages).
- [ ] **Step 5:** Definition of done; `git add`; tick.

### Task 9: Accessible name of the CV button

**Files:** Modify `src/widgets/contacts/ui/ContactLink.tsx` (`label` optional), `src/widgets/contacts/ui/ContactList.tsx`, `messages/*.json` (8 files, `Pages.Common.Contacts.downloadCvAria` removed), `e2e/home-a11y.spec.ts`, and any unit test that reads the key.

- [ ] **Step 1:** e2e: the test "keeps the visible text inside the accessible name of every control" loops over `locales` (`/<locale>` each). The fixture has English only, so every locale renders the interface strings of its own `<locale>.json` with the English content: the test sees the mismatch in `ru` and the others.
- [ ] **Step 2:** `npx playwright test e2e/home-a11y.spec.ts` → FAIL for every locale but `en`.
- [ ] **Step 3:** The CV link renders without `aria-label`; `ContactLink` sets `aria-label` only when `label` is given; the key leaves the eight JSON files; the translation test still passes.
- [ ] **Step 4:** Same command → PASS. The accessible name of the CV link in every locale is `downloadCv` + space + `pdf` from `messagesFor(locale)` (`e2e/messages.ts`), e.g. «Скачать резюме PDF» (assert with `getByRole("link", { name: … })`).
- [ ] **Step 5:** Definition of done; `git add`; tick.

**Task 9 notes:** `ContactList.test.tsx` read the CV's name from `aria-label`; it now reads the accessible name (label or text), plus "names the CV button by its visible text, without an aria-label".

### Task 10: The flaky "phone turns" test

**Files:** `e2e/experience.spec.ts` and whatever the cause is in; [[Open Questions]].

- [ ] **Step 1:** `superpowers:systematic-debugging`. Reproduce: `npx playwright test e2e/experience.spec.ts --project=mobile --repeat-each=20`; collect the failing assertion and the trace.
- [ ] **Step 2:** Name the cause with evidence (a race between `setViewportSize` and the resize handling, or a bug in the component) before changing anything. A bug in the component gets a failing unit or e2e test first.
- [ ] **Step 3:** Fix the cause; no longer timeout, no retry.
- [ ] **Step 4:** `npx playwright test e2e/experience.spec.ts --repeat-each=20` → no failure.
- [ ] **Step 5:** Remove the item from [[Open Questions]]. Definition of done; `git add`; tick.


**Task 10 notes:** Cause, from a failing run under load: after the turns the page sat exactly at its end (`scrollY` 1418 + `innerHeight` 844 = `scrollHeight` 2262), where `getReadingState` fills every bar (`[1, 1, 1]`), while the test's own formula (`getExpectedProgress`) knew nothing of the page-end rule and expected `[1, 1, 0.244]`. The component was right; the test's oracle was incomplete, and whether the browser left the scroll at the end after the resize depended on timing. Ruling: the oracle now reads the geometry from the page and computes with `getReadingState` itself — the formula and the page-end rule are unit-tested in `reading-state.test.ts`, so the e2e test checks the wiring; cost if wrong: a bug inside `getReadingState` is caught by its unit tests only. RED made deterministic first: "finishes everything at the end of the page" also runs `expectProgressToMatchPage` and failed on every mobile run with the old oracle. `--repeat-each=20` of the whole spec: 1500 passed, 0 failed.

### Task 11: Infrastructure on a preview

- [ ] **Step 1:** `npx vercel deploy`.
- [ ] **Step 2:** `curl` with the measurement headers: `/favicon.ico` 200, `content-type: image/x-icon`, `content-length` equal to the Blob file's (2439 today), `etag` not `d41d8cd9…`; the six security headers on `/en` and on `/favicon.ico`; `/robots.txt`, `/sitemap.xml` 200 with the preview's own production URL inside (`VERCEL_PROJECT_PRODUCTION_URL`); `/en/does-not-exist` 404 with `data-revealed`.
- [ ] **Step 3:** Open the preview in Chrome DevTools: no console errors on the eight pages with the menus open; theme-color on the Android emulation; the CV button's accessible name in `ru`.
- [ ] **Step 4:** Lighthouse script on the preview: Accessibility and Best Practices 100 on every page and preset. A drop is fixed here before any performance work.
- [ ] **Step 5:** Nothing to stage unless a fix was needed; tick.


**Task 11 notes:** Preview `personal-9727guogz`, rechecked on the final `personal-id3ivg33q`: `/favicon.ico` answers 200 with 2,439 bytes, byte for byte the Blob file (`cmp`), ICO signature `00 00 01 00`, `etag` `df9ab207…` (not the empty-string `d41d8cd9…`); Vercel sets `content-type: image/vnd.microsoft.icon` from the extension, not the handler's `image/x-icon` (both are ICO types). The six security headers on `/en` and on `/favicon.ico`; `NEXT_LOCALE` without `Expires`; `robots.txt` and `sitemap.xml` (32 URLs) name `https://www.mikhail-aleksandrov.com` through `VERCEL_PROJECT_PRODUCTION_URL`; `/en/does-not-exist` 404 with `data-revealed`; `theme-color` and JSON-LD in the HTML; the `ru` CV link named «Скачать резюме PDF». Console on the eight pages with the menus open: no error but the Vercel Toolbar's blocked script, after which the owner turned the toolbar off for previews (it applies to new deployments only). Lighthouse on `personal-lqagan36w`: Accessibility and Best Practices 100 on all 16 page and preset pairs; SEO is not measurable on a protected preview (its `robots.txt` request gets the login redirect). Nothing staged.

### Tasks 12–17: performance

Each of these tasks follows one loop: **measure** (the Task 1 baseline or the last preview) → **name the cause** from the Lighthouse JSON or a trace → **change** → **deploy a preview** → **measure** → keep it if the target metric moved more than the spread, otherwise revert → definition of done → `git add` → tick. The look and the motion do not change without the owner.

### Task 12: `/experience` LCP

**Files:** `src/widgets/experience/ui/ExperienceColumn.tsx`, `src/widgets/experience/ui/ExperienceSection.tsx`, `src/widgets/experience/Experience.tsx`, possibly `src/shared/ui/Image.tsx`.

- [ ] **Step 1:** The first job's image gets `priority` in both slots (the adapter sets `loading="eager"` and `fetchPriority="high"`). Check `node_modules/next/dist/docs/` for `next/image`'s `preload` in Next 16 and add it through the adapter if the preload link is not emitted. Target: LCP on `/en/experience` mobile, `lcp-lazy-loaded` gone.
- [ ] **Step 2:** Measure the bytes of the hidden slot (desktop's mobile image and the reverse) in the network panel; if more than ~20 KB, narrow its `sizes`.
- [ ] **Step 3:** e2e: the first cover has `loading="eager"`, the others `lazy`.
- [ ] **Step 4:** The loop.


**Task 12 notes:** On the preview with Tasks 2–10 (Task 11's run), `/en/experience` and `/ru/experience` mobile: 97, LCP 2587 ms (spread 12) and 2596 ms (155), `lcp-lazy-loaded` failed: the LCP is the mobile section's Glovo cover with `loading="lazy"`. With the first job's cover `eager` + `fetchpriority="high"` in both slots: `lcp-lazy-loaded` passes; medians 2561 ms (spread 1353) and 2597 ms (1200), score 97. Cause of the two modes, from the five runs: Lantern's simulated LCP follows the bytes that finished before the LCP paint in the fast, real load — 76–103 KB of scripts and one font give 1.5–1.7 s, 233–236 KB of scripts and both fonts give 2.6 s — and which side of ~540 ms they land on is chance. The lever is the JavaScript and font bytes (Tasks 15, 16), not the image. Ruling: `eager` + `fetchpriority` stay though the lab median did not move — a lazy LCP image is a real defect for real visitors, and the audit now passes; cost if wrong: the hidden slot's cover (2–3 KB) loads on every device. Ruling: `preload` through `next/image` tried and reverted — medians 2583 ms and 2587 ms, no move; Next's docs advise against it for an LCP that depends on the viewport, and it loads both covers on every device. The `/favicon`-style links in `<head>` load the icons from Blob directly (Lantern lists the Blob origin), which confirms the Blob entry in `img-src`.

### Task 13: Text LCP render delay on `/about` and `/skills`

- [ ] **Step 1:** A Performance trace (DevTools, slow 4G, 4× CPU) on the preview for both pages; name what delays the LCP paragraph (the font swap, the `reveal`/`wipe` shutter over it, `RevealOnce`, a script).
- [ ] **Step 2:** If the cause is the designed motion, stop and bring the trace and the options to the owner. Otherwise fix it.
- [ ] **Step 3:** The loop. Target: LCP render delay on both pages, mobile.

**Task 13 notes:** No change. On the preview of Task 11, 39 of the 40 runs of `/en/about`, `/ru/about`, `/en/skills`, `/ru/skills` (mobile and desktop) score 100, mobile LCP 1.23–1.69 s; one `/ru/about` run scores 99 (LCP 1.99 s, the script race of Task 12). The 1–2 s render delay of [[Launch Plan]] is not there on the current code. Ruling: nothing to keep a change for, by the spec's rule; cost if wrong: none measurable.

### Task 14: Home photo bytes

**Files:** `src/widgets/profile-photo/ProfilePhoto.tsx`.

- [ ] **Step 1:** From `image-delivery-insight`, compare the served width with the slot's CSS width × DPR at the three breakpoints of `sizes`; correct `sizes` (and the quality only if `sizes` is right).
- [ ] **Step 2:** The loop. Target: the bytes of the photo and LCP on `/en` mobile.

**Task 14 notes:** No change. The mobile preset is 412 px wide at DPR 1.75; the slot `calc(100vw - 32px)` is 380 CSS px, about 665 device px, and the browser picks the 750 w variant of `deviceSizes` (the next smaller, 640, would be soft). `image-delivery-insight` compares the 750 × 750 file with the 378 × 378 CSS size, without the DPR, hence its 12 KiB. Ruling: `sizes` and quality 85 stay; cost if wrong: about 3 KB on a 412 px phone if a `deviceSizes` step near 680 were added. Insights do not count towards the score.

### Task 15: Legacy JavaScript

- [ ] **Step 1:** From the Lighthouse `legacy-javascript` details, find the chunk and the module that ships `Array.prototype.at` / `.flat` polyfills (`.next/static/chunks` with source maps, or `next experimental-analyze`).
- [ ] **Step 2:** Report the source to the owner before fixing if the fix is a dependency change or a `browserslist`; otherwise fix. The loop. Target: the `legacy-javascript` bytes.

**Task 15 notes:** No change. The flagged chunk is the framework's (React DOM and Next's runtime); the polyfills are Next's own `polyfill-module` (module 66849): 1,378 bytes before compression, each one guarded (`"trimStart" in String.prototype || …`), shipped to every browser. Lighthouse's 14 KiB is an estimate from signatures. The `core-js` bundle is Next's separate `nomodule` script, which modern browsers skip. Ruling: no alias over a framework file for an unscored insight worth about 600 bytes gzipped; cost if wrong: those bytes. No `browserslist` is needed.

### Task 16: Unused JavaScript

- [ ] **Step 1:** Inspect the two chunks (`next experimental-analyze` or source maps) and name what is unused on which page.
- [ ] **Step 2:** Act only on the project's own code (a client component that could be a server one, an import pulling a whole module); report framework chunks without changing them. The loop. Target: `unused-javascript` bytes.


**Task 16 notes:** The two flagged chunks: React DOM and Next's runtime (framework, untouched), and Base UI Menu with floating-ui (the locale and theme menus, about 53 KB on the wire, needed only when a menu opens). Spike (throwaway, never staged): the header without both menus, on a preview, mobile medians of five runs — `/en/experience` 98 (2440 ms), `/ru/experience` 100 (1838 ms, spread 1207), `/en` 100 (1532 ms, spread 1057), `/ru` 98 (2146 ms), against 97, 97, 98, 98 before; scripts before the LCP fell only from 236 to 210 KB, because Base UI and floating-ui are shared with the mobile menu. Even without the menus the image-LCP pages jump between 97 and 100. Owner (2026-11-12): accept 97–100 on mobile for the pages whose LCP is an image; no lazy menus. No code change.

### Task 17: The skill level bar as one element

**Files:** `src/features/skill-row/SkillRow.tsx` (+ test), the CSS it needs in `globals.css` if a utility is not enough.

- [ ] **Step 1:** Before changing: Playwright screenshots of a `SkillRow` with level 6 in both layouts, light and dark, 1× and 2× DPR, into the scratchpad.
- [ ] **Step 2:** `SkillRow.test.tsx`: "draws the bar as one element" (the bar has no children); the `meter` role and its values unchanged.
- [ ] **Step 3:** One element, ten segments drawn by CSS (gradients or a mask on a `--level` custom property), same gaps, heights and colours; the 2 px corner of each segment kept as far as the technique allows: compare the screenshots, show the owner any visible difference.
- [ ] **Step 4:** DOM size of `/en/skills` before and after (Lighthouse `dom-size`). The loop.


**Task 17 notes:** No change. On the preview of Task 11, `dom-size` passes on every `/skills` run (score 1), TBT is 0–2 ms, style and layout take about 100 ms on the 4× throttled CPU. One element keeping the 2 px corner of each of ten segments needs layered CSS masks with compositing that differs between Chromium, WebKit and Firefox; without them the corners go square. Ruling: the ten segments stay — no metric to move, and the look would change or carry cross-engine risk; cost if wrong: about 630 elements on `/skills`. The before screenshots (both layouts, both themes, 1× and 2×) stay in the session's scratchpad only.

### Task 18: Final measurement and documentation

- [ ] **Step 1:** Lighthouse script on the last preview, every page and preset: the table goes into the journal next to the baseline.
- [ ] **Step 2:** ADR-0021 Real User Monitoring (deferred: why, how to enable later, CSP unaffected).
- [ ] **Step 3:** Docs: [[Open Questions]] (domain connected; favicon, cookie notice resolved), [[Roadmap]] (Stage 7 done, Stage 8 progress), [[Content Model]] (`/favicon.ico` serves the bytes), [[Rendering Strategy]] (`/robots.txt`, `/sitemap.xml`, `/favicon.ico`), [[Launch Plan]] (sections 1 and 2 done), [[2026-11-11-launch-polish-design]] status, this plan's status, `docs/Home.md` (spec, plan, ADRs), the journal.
- [ ] **Step 4:** Definition of done; `git add`; tick. Then the end-of-step question to the owner (commit, version bump).

**Task 18 notes:** Final preview `personal-id3ivg33q`, 80 runs: Accessibility and Best Practices 100 everywhere; Performance 100 on 14 of 16 page and preset pairs, `/en` mobile 98 and `/ru/experience` mobile 97 (the accepted band). Table in [[2026-11-12]]. Ruling: CLS on `/ru/skills` desktop rose from 0.014 to 0.043 with the wrapping chips (Geist Mono swaps in after the first paint and moves a line break inside a Russian chip) and stays — under the 0.1 "good" threshold, score 100, and preloading the font would add 23 KB of high-priority bytes to every page; cost if wrong: a small shift of the skill list on a Russian desktop's first load.

**Final review** (fresh reviewer, Opus, on `git diff --cached`): no Critical. Final: fixed the missing record of the favicon on Vercel — Task 11 notes and [[2026-11-12]] now carry the curl evidence (bytes identical to Blob, Vercel's own `content-type`). Final: fixed two inaccuracies about the favicon (re-graded from Minor: the docs are the project's facts) — [[Rendering Strategy]] said "fetched once" (it revalidates with the pages, every 30 days), [[Content Model]] promised a 404 without an icon that Vercel would likely serve as an empty 200.
Final: minor (deferred): `favicon.ts` serves a 200 with an empty body or a non-ICO file as an icon; a `byteLength === 0` guard would close it in code.
Final: minor (deferred): `HomePage.tsx` and `AboutPage.tsx` map the profile to `buildPersonJsonLd` the same way (views may not import each other).
Final: minor (deferred): style nits — an extra blank line in `HomePage.tsx` imports, a double blank line in `e2e/theme.spec.ts`, inline `import("@playwright/test").Page` in two specs, `lg:` utilities spliced between `font-mono` and `text-xs` in `ChipGroup.tsx`.
Final: minor (deferred): `docs/project/Open Questions.md` frontmatter still says `updated: 2026-11-11`.
Final: minor (deferred): `e2e/security-headers.spec.ts` does not assert the headers on the dynamic 404 response.
