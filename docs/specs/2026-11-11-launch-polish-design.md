---
tags: [spec, launch, stage-8, performance, seo, security, a11y]
status: done
date: 2026-11-11
---

# Launch Polish Design

Status: **done 2026-11-12**. Plan: [[2026-11-11-launch-polish]].

Related: [[Launch Plan]], [[Roadmap]], [[Open Questions]], [[Rendering Strategy]], [[Localization]], [[Content Model]], [[ADR-0011 Inline CSS]], [[ADR-0017 Test Content Fixtures]], [[ADR-0018 Global Not Found]].

## Intent

The site is live on `https://www.mikhail-aleksandrov.com` but hidden from search engines (`Common.hiddenFromSearch: true`). This spec covers everything that must be true before it opens: sections 1 and 2 of [[Launch Plan]]. Section 3 of that note (the final checks, flipping `hiddenFromSearch`, Search Console) follows once this work is deployed, and is not part of this spec.

The bar is the owner's: 100 in all four Lighthouse categories on mobile and desktop for every page (SEO reaches 100 only once `hiddenFromSearch` is `false`, because `noindex` fails `is-crawlable`), no broken responses at well-known URLs, and nothing that undoes the static rendering of the pages.

## Goals

1. **Static stays static.** Every page that is prerendered today stays prerendered and cached by the CDN. No change may make a page dynamic.
2. **Well-known URLs answer correctly:** `/favicon.ico` with the icon's bytes, `/robots.txt`, `/sitemap.xml`.
3. **Lighthouse 100** in Performance, Accessibility and Best Practices on mobile and desktop for `/en`, `/en/about`, `/en/experience`, `/en/skills` and the same four pages of `/ru`, measured on a Vercel deployment, not locally ([[ADR-0011 Inline CSS]]: local measurements do not decide network questions). **Amended by the owner (2026-11-12):** on mobile, the pages whose LCP is an image (`/`, `/experience`) may score 97–100: Lighthouse's simulation counts the framework's ~210 KB of JavaScript against the LCP whenever it finishes before the image in the real, fast load, which is chance; removing the menus (a spike) did not make it stable. Everything else stays at 100.
4. **The owner's nine decisions** below are implemented.
5. **The test suite is reliable:** the known flaky test is stable.

## Non-goals

- Flipping `hiddenFromSearch`, Search Console, the final checks: [[Launch Plan]] section 3, after this work.
- Real-user monitoring (Vercel Speed Insights), analytics of any kind (decision 5).
- A strict, nonce-based CSP (decision 2).
- Changing the URL scheme (`localePrefix`) or the language detection on `/` (decision 6).
- A privacy page, a footer, a cookie banner (decision 4).
- The deferred minors listed in older plans, the Markdown CV, the `hreflang` of the CV link ([[Open Questions]]).

## Measurements this starts from

From [[Launch Plan]] (Lighthouse 12.8.2 against production, 2026-11-11):

| Page | Performance mobile / desktop | Mobile LCP and its element |
|---|---|---|
| `/en` | 97 / 100 | 2.6 s, the photo |
| `/en/about` | 100 / 100 | 1.7 s, a paragraph |
| `/en/experience` | 97 / 100 | 2.6 s, the Glovo cover (lazy-loaded) |
| `/en/skills` | 97 / 100 | 2.6 s, the intro paragraph |
| `/ru` | 96 / 100 | 2.7 s, the photo |

Accessibility is 100 everywhere except `/ru` (one failed audit); Best Practices is 100 everywhere.

## Decided by the owner (2026-11-11)

### 1. `/favicon.ico`: the route handler serves the icon's bytes

**Finding.** `src/app/favicon.ico/route.ts` redirects (307) to `Common.iconIcoUrl`. It reads no request data, so Next prerenders it at build time into `favicon.ico.meta` (`{"status":307,"headers":{"location":…}}`) and an empty `favicon.ico.body`. `next start` honours the `.meta`; Vercel serves the empty `.body` as a static file: status 200, empty body, `etag` `d41d8cd98f00b204e9800998ecf8427e` (the MD5 of an empty string).

**Decision.** The handler fetches the file at `iconIcoUrl` and returns its bytes as the body (`Content-Type: image/x-icon`). Prerendered at build, it becomes a static file with real content, served by the CDN, with no redirect. The URL stays in `meta.md`; the file stays in Blob. With `iconIcoUrl: null` the handler still answers 404. If the fetch fails or answers non-2xx, the build fails rather than shipping a broken icon.

**Rejected:** a static `src/app/favicon.ico` (the icon in two places, and Next adds a duplicate `<link rel="icon">`); `redirects()` or `rewrites()` in `next.config.ts` (the Blob URL duplicated in the config, a round trip or a proxy); a dynamic handler with `await connection()` (a function call per request); removing the handler (404 for every client that does not read HTML).

### 2. Security headers: a basic set plus a CSP without nonces

Set in `headers()` of `next.config.ts` for every path (Vercel applies them to static responses too; the Proxy does not run on `_next/static`):

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://5iyco5bcxydlbyja.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` |
| `X-Frame-Options` | `DENY` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

`'unsafe-inline'` in `script-src` is unavoidable without nonces: Next inlines the RSC payload (`self.__next_f.push(…)`) and `next-themes` inlines its script. A nonce makes every page dynamic (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`), which breaks goal 1; experimental SRI covers external scripts only and still needs `'unsafe-inline'`. The policy still forbids framing, `<base>` injection, plugins, and loading or sending anything to a host outside the list.

The values in the table are the target; the builder adjusts the list of sources to what the pages actually load (for example the Blob host if images are requested from it directly, `data:` for the empty icon), and only by adding what a real page needs. `next dev` needs `'unsafe-eval'` for React's development tooling: added only when `NODE_ENV` is `development`.

**Preview deployments (Claude's call).** The CSP is the same in every environment, so a preview shows exactly what production will. The Vercel Toolbar, which Vercel injects into previews from `https://vercel.live`, is blocked by it; the `x-vercel-skip-toolbar: 1` header did not stop the injection in a browser, so the owner turned the toolbar off for previews in the project settings (2026-11-11). If the previews are protected by Vercel Authentication, measurements send `x-vercel-protection-bypass` with the project's Protection Bypass for Automation secret (the owner creates it; it never enters the repository).

`upgrade-insecure-requests` is left out (Claude's call, 2026-11-11): on `next start` over `http://localhost` it would rewrite every subresource to `https` and break the e2e run, and in production HSTS and the all-`https` sources already cover it.

HSTS stays as Vercel sets it (`max-age=63072000`); no `preload` (hard to undo, binds every subdomain).

**Rejected:** nothing (no frame protection); the basic set without CSP; a nonce CSP; SRI.

### 3. JSON-LD: `WebSite` and `Person` on Home, one `Person` across the site

- **Home** gets a `@graph` with two nodes:
  - `WebSite`: `name` = `Common.siteName`, `url` = the site root (`siteUrl`), `inLanguage` = the locale.
  - `Person`: `@id` = `<siteUrl>/#person`, `name`, `jobTitle`, `url` = the site root, `image` = `photoUrl`, `sameAs` = the LinkedIn URL. In a locale whose `name` differs from English (today `ru`), `alternateName` holds the English name.
- **About** keeps `ProfilePage`; its `mainEntity` is the same `Person`, with the same `@id`.
- The `Person` is built in one place in `src/shared/lib/json-ld.ts`, used by both views, serialized with `serializeJsonLd`.
- No `email`, no phone (owner).

The `WebSite` name is a hint for the site name in Google results, which Google reads from the domain's home page; `/` redirects to `/en` (decision 6), so the effect is likely but not guaranteed.

### 4. The `NEXT_LOCALE` cookie becomes a session cookie

`localeCookie: { maxAge: 60 * 60 * 24 * 365 }` in `src/shared/lib/i18n/routing.ts` is removed, so next-intl's default applies: a session cookie. This replaces the owner's one-year decision of 2026-10-29. A session cookie that keeps a choice of interface language needs neither consent nor a notice under ePrivacy, so the privacy item of [[Open Questions]] closes without a notice, a footer or a page.

**Finding to fix in [[Localization]].** The cookie is set not only when the visitor picks a language: next-intl sets it on every document request whose locale differs from the browser's `Accept-Language` (and updates it when it differs from the cookie), so opening a link to `/ru` in an English browser sets it too (`node_modules/next-intl/dist/esm/production/middleware/syncCookie.js`).

**Rejected:** nothing (a long-lived cookie without notice); a one-line notice in the locale menu; no cookie at all (`localeCookie: false`).

### 5. No Vercel Speed Insights for now

Real-user metrics are deferred: a portfolio's small traffic gives a p75 that jumps with every slow phone, and the owner declined analytics before. Recorded as a deferred decision; enabling it later is a package, one component in the root layout and a switch in the dashboard (its script and endpoint live under `/_vercel/`, same origin, so the CSP of decision 2 would not change).

### 6. `/` keeps redirecting (307) to the detected locale

Measured: `/` costs one extra round trip (about 0.2 s on a good connection) for anyone typing the bare domain. Kept: language detection on `/` stays, URLs stay `/<locale>/…`. The owner points the links in the CV and on LinkedIn at locale URLs (`/en`, `/ru`); that is outside the code. Lighthouse runs measure `/<locale>/…` pages.

**Rejected:** `localePrefix: "as-needed"` with or without detection (rework of every URL, link, test and the sitemap for one round trip on the bare domain).

### 7. `theme-color` follows the chosen theme

- The `viewport` export of the site layout (and of `global-not-found.tsx`) emits two tags: `media="(prefers-color-scheme: light)"` with the light header colour, `media="(prefers-color-scheme: dark)"` with the dark one. The colour is the header's background, `--card`: `#ffffff` and `#181e3b`.
- A small client component next to `ThemeProvider` in `src/app/_providers/` renders `null` and, when `resolvedTheme` of `next-themes` changes, sets both tags to the colour of the chosen theme, so a manual choice opposite to the system wins. The colours come from one constant in TypeScript, not from the computed `--card` (Claude's call, 2026-11-11): a child's effect runs before `next-themes` puts the class on `<html>`, so the computed value could still be the old theme's.
- The hex values of the static tags duplicate `globals.css`; a unit test fails if they drift apart.
- No inline script before first paint: a visitor whose manual choice differs from the system sees the system colour until hydration.

### 8. Skill domain chips wrap their text on desktop

In the 240 px filter column (`lg`), a chip's label may wrap: `ChipGroup` overrides the shadcn toggle's `whitespace-nowrap` and fixed height at `lg` only (`whitespace-normal`, `h-auto`, `min-h-9`, vertical padding, a break inside a single long word). `rounded-full` stays. The mobile row (`max-lg:w-max max-lg:flex-nowrap`, horizontal scroll) does not change. The generated `src/shared/shadcn/ui/toggle.tsx` is not edited.

### 9. No header wipe on the 404 page

`global-not-found.tsx` renders `<html data-revealed="">`, so the CSS selector `:root:not([data-revealed]) .reveal::after` never matches and the header shows at once, without JavaScript. `RevealOnce` finds no `wipe` animation there and marks the page revealed at once, which is harmless. The return to the home page from the 404 is a full load (another root layout) and plays the wipe there, as any entry to the site does.

## Work without open decisions ([[Launch Plan]] section 1)

Each performance item is measured before and after on a Vercel preview deployment; a change that does not move its metric is not kept.

**Preview deployments (owner, 2026-11-11).** Claude deploys previews from the working tree with `npx vercel deploy` (sources uploaded, built on Vercel; not `--prebuilt`, whose system variables differ), never with `--prod`. The Vercel CLI runs through `npx` and is not added to `package.json`. The owner logs in once with `npx vercel login`. Before the first deploy, a `.vercelignore` (Claude's call) keeps local files out of the upload: `.env*` (`.env.local` exists and would otherwise reach the build, since the CLI's default ignore list does not cover it), `test-results/`, `playwright-report/`, `e2e/` build output and the other ignored artifacts, so a preview is built from what the repository holds plus the staged and unstaged changes, nothing else.

**Measurement protocol (Claude's call).** Lighthouse CLI run locally against the deployment's URL (the PageSpeed Insights API ran out of quota before), mobile and desktop presets, five runs per page, the median reported. A change "moves its metric" when the median of the metric it targets (LCP, TBT, DOM size, transferred bytes) improves by more than the spread of the five runs before it. If a page cannot reach 100 without changing the designed look or motion, the work stops there and the owner decides; Claude does not accept 99 on its own.

1. **`/experience`, LCP lazy-loaded:** the first job's cover is the LCP but loads lazily (load delay 1.7 s). It gets `priority` in both of its slots (the desktop stage and the mobile section): eager loading, `fetchPriority="high"`, the preload link. The slot of the other layout downloads too: measure its cost and, if it matters, narrow its `sizes`.
2. **`/about` and `/skills`, text LCP render delay of 1–2 s:** take a performance trace first; the suspects are the font swap and the reveal animations (`reveal`, `wipe`, `RevealOnce`). The fix follows the trace and may not change the designed motion without the owner.
3. **Home photo:** about 12 KB more than the slot needs (`image-delivery-insight`); correct `sizes` and check the quality.
4. **Legacy JavaScript, 14 KB** (polyfills for `Array.prototype.at` and `.flat` in a shared chunk): find the source (a `browserslist` setting, a dependency shipping transpiled code) before choosing a fix. No `browserslist` is set in the project today.
5. **Unused JavaScript, about 59 KB in two chunks:** inspect the bundle with an analyzer; act only on what belongs to the project.
6. **`/skills` DOM, 1,040 elements:** the level bar draws ten segments per skill (about 630 elements). It becomes one element with the same look.
7. **Accessible name of the CV button:** the visible text must be inside the accessible name (`label-content-name-mismatch`, WCAG 2.5.3). Today only `en` matches (`Download CV PDF`): `ru` «Скачать резюме в PDF» against the visible «Скачать резюме» + «PDF», and `de`, `es`, `fr`, `ja`, `pl`, `pt` the same way. Claude's call: the button drops its `aria-label` and `Pages.Common.Contacts.downloadCvAria` leaves every locale file, so the accessible name is the visible text («Скачать резюме PDF») and cannot drift from it again. The e2e test "keeps the visible text inside the accessible name of every control" (`e2e/home-a11y.spec.ts`) runs for every locale, not only `en`.
8. **`app/robots.ts`:** allows everything (a crawler that may not load a page never sees its `noindex`) and names the sitemap. **`app/sitemap.ts`:** the 32 page URLs (8 locales × 4 pages), each with its `hreflang` alternates and `x-default`, no 404. Both use `siteUrl`. The Proxy already lets both paths through.
9. **The flaky e2e test** "recomputes the bars when the phone turns" (`e2e/experience.spec.ts`, fails about once in three parallel runs): find the cause with `systematic-debugging` and fix the cause, not the timeout.
10. **Delete the `create-next-app` files** in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
11. **Docs:** [[Open Questions]] (the domain is connected; the favicon, the cookie notice and the flaky test resolved), [[Roadmap]] (Stage 7 done), [[Localization]] (the session cookie and when it is set), [[Content Model]] (`/favicon.ico` serves the bytes), [[Rendering Strategy]] (`/robots.txt`, `/sitemap.xml`, `/favicon.ico`), [[Launch Plan]] (sections 1 and 2 done).

## ADRs

- **ADR-0019 Security Headers:** decision 2.
- **ADR-0020 Session Locale Cookie:** decision 4, replacing the one-year cookie of 2026-10-29.
- **ADR-0021 Real User Monitoring:** decision 5, deferred.

## Testing

Per [[ADR-0007 Testing]] and [[ADR-0017 Test Content Fixtures]]: Vitest for logic and client components, Playwright on the production build of the fixtures for rendered pages. No test reads `messages/`.

- `/favicon.ico` (Claude's call): the handler is unit-tested with a mocked `fetch` (bytes and `Content-Type` passed through, 404 without `iconIcoUrl`, a thrown error on a failed fetch). The e2e fixture keeps `iconIcoUrl: null`, so the e2e build needs no new Blob file and no network at build time, and checks the 404. The real bytes on Vercel are checked with `curl` on the preview and again in [[Launch Plan]] section 3.
- Headers: every header of decision 2 on a page, on `/favicon.ico` and on a static asset. The console check of `e2e/fixtures.ts` already fails any page with a CSP violation, so every page of every locale is covered.
- JSON-LD: Home carries `WebSite` and `Person` with the `@id`; About's `mainEntity` has the same `@id`; `alternateName` appears in `ru` only; no `email`, no `telephone`.
- Cookie: after a locale switch, `NEXT_LOCALE` has no `expires` (session cookie); the existing redirect of `/` to the chosen locale still works.
- `theme-color`: two tags with `media`; after switching the theme against the system, both carry the chosen theme's colour; unit test of the colour constants against `globals.css`.
- Chips: a fixture `skills.md` holds a long domain label; at 1024 px no chip crosses the filter column; at 390 px the chip row still scrolls horizontally on one line.
- 404: `<html>` has `data-revealed`, the header runs no `wipe` animation.
- `robots.txt` and `sitemap.xml`: content, 32 URLs, alternates, no 404 URL.
- CV button: the accessible-name test for every locale.
- Flaky test: 20 runs in a row of `e2e/experience.spec.ts` with parallel workers, no failure.
- Lighthouse on a preview deployment of every page listed in goal 3, mobile and desktop, before and after; numbers go to the journal.

Definition of done for every step: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Left to the builder

- The order of the work and how it splits into plan tasks (performance items depend on measurements, so they come after the infrastructure items).
- The exact Tailwind utilities of the chip override.
- The tool for the bundle analysis and the performance trace.
- The fix of each performance item, within the rule that the designed look and motion do not change without the owner.
