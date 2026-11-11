---
tags: [spec, 404, i18n, rendering]
status: done
date: 2026-11-11
---

# Not Found Page Design

Status: **done 2026-11-11**. Plan: [[2026-11-11-not-found-page]].

Related: [[Not Found Page Handoff]], [[Rendering Strategy]], [[Localization]], [[Content Model]], [[ADR-0018 Global Not Found]].

## Intent

The 404 page gets the design of [[Not Found Page Handoff]] and, first, real HTML. Today every 404 (`/en/xx`, `/wp-login.php`) answers with an empty `<html id="__next_error__">` and the page is drawn by the browser from the RSC payload: blank without JavaScript, a blank flash with it. A visitor who follows a broken link from a messenger sees an empty screen first.

## Findings (spikes, 2026-11-11, Next 16.4.5 with Cache Components)

- A `notFound()` reached while prerendering renders the error shell and leaves the page to the client. Seen with the `[locale]/[...rest]` catch-all (◐) and with a static `[locale]/404` route (○).
- Reading `params` before `notFound()` renders real HTML, but the stream has started: status 200.
- A pass-through `app/layout.tsx` breaks `next/root-params`, on which the locale rests.
- A `(site)` route group with its own `not-found.tsx` changes nothing.
- A Proxy `rewrite` to a page that renders the 404 serves real HTML, but the status of the rewrite is ignored: 200.
- `app/global-not-found.tsx` (`experimental.globalNotFound`) serves 404 with real HTML. With its localized part inside `<Suspense>`, reading the locale from the `X-NEXT-INTL-LOCALE` request header that next-intl's Proxy sets, it still serves 404 and speaks the URL's language.

## Goals

1. Every unknown URL answers **404 with server-rendered HTML** (heading, text, button and header present without JavaScript), in the language of the URL.
2. The page looks as the handoff shows, **fully static**: no tilt, no bob, no transitions on the tile.
3. A path outside any locale (`/wp-login.php`) reaches the same page in the visitor's language.

## Non-goals (owner, 2026-11-11)

- The "Requested: path" box.
- Any animation on the page (the tile's tilt and the corner square's bob).
- Moving focus to the h1 after client navigation (no page of the site does it).
- The sitemap, robots.txt and the rest of Stage 8.

## Decided by the owner (2026-11-11)

1. The page is static: no motion of any kind.
2. No requested path.
3. A path outside the locales shows the page in the visitor's language, not always English; every text comes from the messages files.
4. No focus management.
5. The architecture below, with its costs (a function call per 404, an experimental flag, `<html lang="en">`).

## Design

### Rendering ([[ADR-0018 Global Not Found]])

- `src/app/global-not-found.tsx` is the only 404. `next.config.ts` sets `experimental.globalNotFound: true`. `src/app/[locale]/[...rest]/` and `src/app/[locale]/not-found.tsx` are deleted: an unknown path matches no route.
- The file wraps the whole document in `<Suspense>` (an entirely dynamic route, as `generate-viewport.md` documents): an async server component resolves the locale and the messages and renders `<html lang={locale}>` with the fonts, `globals.css`, `NextIntlClientProvider`, `ThemeProvider`, `SiteLayout` and the page view. *(Changed in Task 2: a static `<html>` with only the localized part in `<Suspense>` streamed that part behind an inline script, blank without JavaScript.)*
- The locale: `src/shared/lib/i18n/request.ts` takes the root param first (pages under `[locale]`, static as now) and, when there is none, `requestLocale`, which next-intl reads from the `X-NEXT-INTL-LOCALE` header. An unsupported value falls back to the default locale, never to `notFound()` (the 404 cannot be not found).
- `<html lang>` is the page's locale.
- The page title comes from `meta.md` (`NotFound.title`, see "Content"). `noindex` is added by Next for 404 responses.
- Proxy: the matcher also covers paths with a dot, so `/wp-login.php` is redirected to `/{locale}/wp-login.php` by locale detection (cookie, `Accept-Language`, `en`). Excluded: `/api`, `/_next`, `/_vercel`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, and files with an extension under `/_next` (already excluded).

### Content

- `messages/<locale>.json`, `Pages.NotFound`: `label`, `title`, `text`, `home`, in all eight locales (the translation test requires it). `message` is removed. English from the handoff: "Error 404 · Page not found", "This page took a wrong turn", "The link may be broken, or the page has moved. Everything else is right where you left it.", "Back to home".
- `messages/<locale>/meta.md`, `NotFound.title`: "Page not found — Mikhail Aleksandrov" in English, «Страница не найдена — Михаил Александров» in Russian, the name in Latin elsewhere. A schema of its own (`title` only); `NotFound` has no description or preview image. The e2e fixture `e2e/content/en/meta.md` gains it with the test that reads it.

### Look (from the handoff, static)

- A view `src/views/not-found/NotFoundPage.tsx`, a server component. One `<main>` under the header, filling the rest of the viewport, content centered both ways, `text-align: center`; padding 40 × 40 × 56 px desktop, 28 × 20 × 40 px phone.
- Background grid, `aria-hidden`: 64 px squares (40 px on phone), 1 px `card-border` lines at 35% opacity, a radial mask at 50% / 42% fading out by 62%.
- "404", `aria-hidden`: Geist 800, 200 px / 1 (112 px on phone), letter-spacing −.06em, gap .06em, 34 px (24 px) above the label. The zero is a tile: .6em × .74em, radius .16em, `brand`, rotated −6°, shadow `0 .08em .16em -.06em rgba(0,0,0,.45)`; a hole 30% × 50% centered, radius .06em, `background`; a `deco` square .13em, radius .03em, at the top right (−.07em), still.
- Label: mono 12 px, letter-spacing .12em, uppercase, `brand`, 14 px above the h1.
- h1: 40 px / 1.1 (27 px on phone), letter-spacing −.03em, `text-wrap: balance`, max 620 px.
- Paragraph: 17 px / 1.55 (15.5 px on phone), `foreground-soft`, max 480 px, `text-wrap: pretty`, 14 px above.
- Button: next-intl `Link` to `/`, 30 px (26 px) above; a pill 52 px tall, padding `0 26px 0 20px`, `brand` with `background` text, Geist 700 16 px, an arrow-left icon 18 px, stroke 2.4, gap 10 px; hover: a `brand` glow shadow only, nothing moves (static page); focus: 2 px `brand` outline, offset 4 px; full width on phone.
- Header as everywhere: no active item, no Back link, no footer.

## Tests

- Unit (TDD): `request.ts` falls back to `requestLocale` without a root param and to the default locale for an unsupported value; the `NotFound` meta schema and getter.
- e2e (fixtures): status 404; with JavaScript disabled, the h1, the label, the text and the button are in the page; `/ru/…` and `/de/…` speak their language (texts from the messages files); `/wp-login.php` ends in a 404 in English (no cookie, `Accept-Language: en`) and in Russian with the `NEXT_LOCALE=ru` cookie; the title from the fixture's `meta.md`; `noindex`; the button leads to the home page of the locale; one `main`, one `h1`, the "404" hidden from assistive technology; the phone button spans the content width; no horizontal scroll at 320 px. The old 404 tests move to these.

## Left to the plan

File layout of the providers shared by the locale layout and the global 404, the exact Tailwind classes, the icon.
