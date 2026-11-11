---
tags: [adr, security, headers]
status: accepted
date: 2026-11-11
---

# ADR-0019 Security Headers

## Context

Until 2026-11-11 the site sent no security header of its own; Vercel adds HSTS (`max-age=63072000`). The site has no forms, no sign-in, no user input and no cookie of value; its Markdown is written by the owner and `react-markdown` renders no raw HTML. The pages are prerendered and cached by the CDN, and that must stay so ([[2026-11-11-launch-polish-design]]).

A strict CSP needs a nonce per response, which makes every page dynamic and is incompatible with Partial Prerendering (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`). Next inlines the RSC payload and `next-themes` inlines its script, so a CSP that keeps the pages static needs `'unsafe-inline'` in `script-src`; experimental SRI covers external scripts only.

## Decision

`headers()` in `next.config.ts` sends, on every path, the headers built by `buildSecurityHeaders` in `src/shared/lib/security-headers.ts` (owner, 2026-11-11):

- `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: <Blob origin>; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. `next dev` adds `'unsafe-eval'` to `script-src` for React's development tooling.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`.

No `upgrade-insecure-requests`: over `http://localhost` it would rewrite every subresource to `https` and break `next start` and the e2e run; HSTS and the all-`https` sources cover production. No HSTS `preload`: hard to undo and binding on every subdomain.

The policy is the same on previews, so a preview shows what production will. The Vercel Toolbar, which Vercel injects into the previews a browser opens (`https://vercel.live/_next-live/feedback/feedback.js`), was blocked by it and failed Lighthouse's `errors-in-console` (Best Practices 93 on the preview); the `x-vercel-skip-toolbar` header did not stop the injection. The owner turned the toolbar off for previews in the project settings (2026-11-11).

## Alternatives

- **Nothing:** the site could be framed by any page.
- **The basic headers without a CSP:** no `frame-ancestors`, `base-uri` or `object-src`.
- **A nonce-based CSP:** real protection against injected scripts, but every page dynamic, no Partial Prerendering, no CDN cache.
- **Experimental SRI with a CSP:** still needs `'unsafe-inline'` for the inline scripts, behind an experimental flag.

## Consequences

- The CSP does not stop an injected inline script; it stops framing, `<base>` injection, plugins, and loading from or sending to a host outside the list.
- Every new external resource (a script, an image host, an API, Vercel Speed Insights' endpoint is same-origin and needs nothing) needs an entry in `buildSecurityHeaders`. The console check of `e2e/fixtures.ts` fails any page with a violation, and `e2e/security-headers.spec.ts` opens every page of every locale.
- The Vercel Toolbar is off for previews (project settings). Turning it back on needs `https://vercel.live` in the policy of previews, or a blocked script in every preview's console.
- Lighthouse's "Trust and Safety" diagnostics still flag the CSP as not effective against XSS (`'unsafe-inline'`); they do not count towards the score.
