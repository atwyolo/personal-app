---
tags: [project, launch, stage-8]
status: in-progress
date: 2026-11-11
---

# Launch Plan

The work left before the site opens to search engines: Stage 8 of [[Roadmap]] plus the findings of the measurements below. **Sections 1 and 2 are done** (2026-11-12): the owner's answers are in [[2026-11-11-launch-polish-design]], the work and its rulings in [[2026-11-11-launch-polish]], the numbers in [[2026-11-12]]. Section 3 is next.

Related: [[Roadmap]], [[Open Questions]], [[Rendering Strategy]], [[ADR-0018 Global Not Found]].

## Measurements (2026-11-11, before the 404 page)

Lighthouse 12.8.2 run locally against `https://www.mikhail-aleksandrov.com` (the PageSpeed Insights API had no quota left that day), mobile (simulated slow 4G, 4× CPU) and desktop presets:

| Page | Performance mobile / desktop | Accessibility | Best practices | SEO | Mobile LCP and its element |
|---|---|---|---|---|---|
| `/en` | 97 / 100 | 100 | 100 | 66 | 2.6 s, the photo |
| `/en/about` | 100 / 100 | 100 | 100 | 63 | 1.7 s, a paragraph |
| `/en/experience` | 97 / 100 | 100 | 100 | 66 | 2.6 s, the Glovo cover |
| `/en/skills` | 97 / 100 | 100 | 100 | 63 | 2.6 s, the intro paragraph |
| `/ru` | 96 / 100 | 100 (one failed audit) | 100 | 66 | 2.7 s, the photo |

- SEO fails only `is-crawlable` (`noindex` while `hiddenFromSearch` is `true`), which is intended.
- All 32 pages (8 locales × 4) answer 200; all 10 Blob files they reference answer 200.
- The site is live on `https://www.mikhail-aleksandrov.com`: the apex and `http` redirect (308) to `https://www`, `/` redirects (307) to the detected locale, HSTS is set; no other security headers.
- `/robots.txt` and `/sitemap.xml` answer 404; `/favicon.ico` answers 200 with an empty body although `Common.iconIcoUrl` is set.

The goal: 100 in all four categories on mobile and desktop for every page; SEO reaches 100 when `hiddenFromSearch` becomes `false`.

## 1. Work without open decisions

### Performance

1. **`/experience`: the first cover is the LCP but loads lazily** (`lcp-lazy-loaded`; load delay 1.7 s). Give the first job's image `priority` in both slots (the desktop stage and the mobile section): `loading="eager"` + `fetchPriority="high"` and React's preload link. The hidden slot of the other layout downloads too (tens of KB for a flat cover, to be measured; `sizes` can then shrink the hidden variant). Measure before and after.
2. **`/about` and `/skills`: render delay of the text LCP, 1–2 s** with no load time. Take a performance trace; suspects are the font swap and the reveal animations (`reveal`, `wipe`, `RevealOnce`).
3. **Home photo:** the optimizer serves about 12 KB more than the slot needs (`image-delivery-insight`); check `sizes` and the quality.
4. **Legacy JavaScript, 14 KB:** polyfills for `Array.prototype.at` and `.flat` in a shared chunk; likely a `browserslist` setting.
5. **Unused JavaScript, about 59 KB** across two chunks; inspect the bundle with an analyzer.
6. **`/skills` DOM, 1,040 elements:** the level bar renders ten segments per skill (about 630 elements); draw it with one element.

### Accessibility

7. **`/ru`, the CV button:** the visible text («Скачать резюме» + «PDF») is not inside the accessible name «Скачать резюме в PDF» (`label-content-name-mismatch`). Fix `Pages.Common.Contacts.downloadCvAria` in `ru.json`, check the other locales, and run the e2e check "keeps the visible text inside the accessible name" for every locale, not only `en`.

### SEO infrastructure

8. **`app/robots.ts`** allowing everything (a crawler blocked by `robots.txt` never sees the `noindex`), with the sitemap's URL; **`app/sitemap.ts`** with the 32 URLs and their `hreflang` alternates, without the 404. The Proxy already lets both paths through.

### Reliability and clean-up

9. **Stabilize** the flaky e2e test "recomputes the bars when the phone turns" ([[Open Questions]]).
10. **Delete the unused `create-next-app` files** in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`); they now answer 404 through the Proxy.
11. **Update [[Open Questions]] and [[Roadmap]]:** the domain is connected; Stage 7 (Deploy) is done.

## 2. Decisions for the owner

| # | Question | Claude's recommendation |
|---|---|---|
| 1 | `/favicon.ico` answers 200 with an empty body on Vercel: a static `src/app/favicon.ico` (Next's file convention), or a `rewrites` entry in `next.config.ts`? | The file: served as a static asset with the right headers; an exception to "files live in Blob". |
| 2 | Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` / `X-Frame-Options`, COOP. CSP? | The basic set without a strict CSP: a nonce-based CSP makes every page dynamic. |
| 3 | JSON-LD `Person` (name, job title, LinkedIn as `sameAs`, URL) on Home? | Yes: it helps the results for the owner's name. |
| 4 | A notice about the one-year `NEXT_LOCALE` cookie ([[Open Questions]]): a line in a footer, a page, or nothing? | Owner's call; the cookie is functional and tracks nothing. |
| 5 | Vercel Speed Insights (Core Web Vitals of real visitors, no behavioral analytics)? | Optional; the owner declined analytics before. |
| 6 | `/` redirects (307) to the detected locale, one round trip for anyone typing the bare domain (the owner's PageSpeed report measured `/`). Keep it, or serve English on `/` without a redirect? | Keep: standard for language detection; the alternative reworks the routing. |
| 7 | `theme-color` following the chosen theme (listed in Stage 8)? | Yes, a small change. |
| 8 | Skill domain chips do not wrap their text; a long label crosses the 240 px filter column. Allow wrapping, or cap the width? | Allow wrapping inside the chip. |
| 9 | The header's wipe-on-load animation also plays on the 404 page. Keep it, or skip it there? | Owner's call. |

## 3. Launch

1. Check the deployment: a 404 with `curl` (`<h1>` in the HTML, status 404), `og:image` on every page and locale, `/robots.txt` and `/sitemap.xml`, `/favicon.ico`, a new Lighthouse run of every page.
2. Set `Common.hiddenFromSearch` to `false` in `messages/en/meta.md` and deploy.
3. Search Console: verify the domain, submit `sitemap.xml`, request indexing.

## Later

Content of `Later / optional` in [[Roadmap]] (a Markdown CV in a separate repository, analytics) and the deferred minors listed in the plans stay out of this launch.
