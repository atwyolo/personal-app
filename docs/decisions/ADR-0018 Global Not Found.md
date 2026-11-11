---
tags: [adr, rendering, 404, i18n]
status: accepted
date: 2026-11-11
---

# ADR-0018 Global Not Found

## Context
Every 404 of the site answered with an empty `<html id="__next_error__">`: the page was drawn in the browser from the RSC payload, blank without JavaScript and a blank flash with it. With Cache Components (Next 16.4.5), a `notFound()` reached while prerendering takes Next's error-shell path, whether it comes from the `[locale]/[...rest]` catch-all (a fallback shell, ◐) or from a static route (○). The root layout sits in `[locale]` so that `next/root-params` gives the locale. The owner wants the 404 server-rendered and in the visitor's language, with texts from the messages files (2026-11-11).

## Decision
- `app/global-not-found.tsx` (`experimental.globalNotFound: true`) is the only 404. The catch-all and `[locale]/not-found.tsx` are gone: an unknown path matches no route.
- The whole document is wrapped in `<Suspense>`, which makes the route entirely dynamic (`ƒ /_not-found`). Its async component takes the locale from next-intl (`request.ts`: the root param when there is one, else `requestLocale`, read from the `X-NEXT-INTL-LOCALE` header that the Proxy sets; an unsupported value falls back to `en`) and renders `<html lang={locale}>`, the providers, the header and the page. The HTML arrives complete, status 404.
- The Proxy also handles paths with a dot, so `/wp-login.php` is redirected to `/{locale}/wp-login.php` by locale detection and gets the 404 in the visitor's language. `/api`, `/_next`, `/_vercel`, `/favicon.ico`, `/robots.txt` and `/sitemap.xml` are left alone.

## Alternatives (each built and measured on 2026-11-11)
- Reading `params` in the catch-all before `notFound()`: real HTML, but the stream has started, status 200.
- A pass-through `app/layout.tsx`: breaks `next/root-params`, the base of the i18n setup.
- A route group with its own `not-found.tsx`: the same empty shell.
- A Proxy `rewrite` with `status: 404` to a page that renders the 404: real HTML, but the status of the rewrite is ignored, 200.
- `global-not-found.tsx` with a static document and only the localized part in `<Suspense>`: 404 and the right language with JavaScript, but React streams the late part behind an inline script, so the page is blank without it.
- A static English `global-not-found.tsx`: real HTML and 404, but always English.

## Consequences
- Every 404 is a function call on Vercel (a request-time render). The page is light; bots that probe random paths cost invocations, not bandwidth.
- `experimental.globalNotFound` is documented as experimental in Next 16; an upgrade may change it. `e2e/not-found.spec.ts` checks the status, the language and the page with JavaScript disabled.
- No page calls `notFound()` today. A future one under `[locale]` has no `not-found.tsx` of its own; where it lands is untested and is decided with the first page that needs it.
- The 404 has no `robots` of its own beyond Next's `noindex`.
