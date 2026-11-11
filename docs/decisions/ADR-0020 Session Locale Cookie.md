---
tags: [adr, i18n, privacy]
status: accepted
date: 2026-11-11
---

# ADR-0020 Session Locale Cookie

## Context

On 2026-10-29 the owner chose a one-year `NEXT_LOCALE` cookie (`localeCookie: { maxAge: 60 * 60 * 24 * 365 }` in `src/shared/lib/i18n/routing.ts`). [[Open Questions]] kept a privacy item: under ePrivacy a cookie that keeps a chosen interface language is exempt from consent, but the Article 29 Working Party (Opinion 04/2012) expects visitors to be told about such a cookie when it is persistent; a session one is exempt outright.

next-intl sets the cookie on every document request whose locale differs from the browser's `Accept-Language`, not only after a pick in the locale menu (`node_modules/next-intl/dist/esm/production/middleware/syncCookie.js`). With `localePrefix: "always"` every internal link carries its locale, so the cookie only decides paths without one: the bare domain typed on a later visit.

## Decision

The `maxAge` is removed, so next-intl's default applies: a session cookie (owner, 2026-11-11). No notice, footer or privacy page is added.

## Alternatives

- **Keep the one-year cookie without a notice:** the open privacy item stays.
- **A one-line notice in the locale menu:** keeps a year of memory; strings in eight locales; a visitor who arrives by a link gets the cookie without opening the menu.
- **No cookie (`localeCookie: false`):** a site with no cookie at all; a manual choice on the bare domain is never remembered.

## Consequences

- A language picked against the browser's is forgotten when the browser session ends (browsers that restore sessions may keep it longer); the next visit to `/` detects the language from `Accept-Language` again.
- The privacy item of [[Open Questions]] is closed.
- `e2e/i18n-routing.spec.ts` checks the cookie has no expiry.
