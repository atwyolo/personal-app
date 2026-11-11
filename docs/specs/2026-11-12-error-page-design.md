---
tags: [spec, error, i18n, a11y]
status: done
date: 2026-11-12
---

# Error Page Design

Status: **done 2026-11-12**. Plan: [[2026-11-12-error-page]].

Related: [[Error Page Handoff]], [[Not Found Page Handoff]], [[2026-11-11-not-found-page-design]], [[ADR-0018 Global Not Found]], [[ADR-0019 Security Headers]], [[Localization]], [[Rendering Strategy]].

## Intent

Today the site has no `error.tsx` and no `global-error.tsx`. When a component throws, the visitor gets Next's default screen ("Application error: a client-side exception has occurred"), white, in English, with no header and no way back. Before the site opens to search engines, a failure must look like the rest of the site, speak the visitor's language and offer one obvious action: reload.

Also in this step: the `/favicon.ico` handler refuses an empty or non-image response at build time (a deferred minor of [[2026-11-11-launch-polish]]).

## When the page shows (findings, 2026-11-12)

- Every page is prerendered. A server render error fails the build, and a failing 30-day background revalidation keeps serving the old page. In practice the page shows for **exceptions in client components**: the menus, the skills explorer, the carousel, the reading progress, `ThemeColorSync`.
- Such errors happen after a 200 response, so the status and the metadata matter little; `error.digest` exists only for server errors, so the Error ID box will rarely show.
- `error.tsx` of a segment does not wrap that segment's own layout (Next docs, `error.md`). The header and its client parts live in the root layout `src/app/[locale]/layout.tsx`, so an exception in the header goes to `global-error.tsx`, not to `[locale]/error.tsx`.
- Whatever `global-error.tsx` imports ships in the initial JavaScript of every page: `_global-error.html` uses a subset of the home page's chunks.

## Goals

1. An exception under the root layout shows the Error page inside the site layout (theme, language): `src/app/[locale]/error.tsx`.
2. An exception in the root layout itself (the header included) shows the same page through `src/app/global-error.tsx`, in the visitor's language and theme.
3. **No header on the Error page** in either case (owner, 2026-11-12: after a failure the header has no use).
4. The page looks as [[Error Page Handoff]] shows, **without motion and without the header** (decisions 1 and 7).
5. The 404 page keeps its look and behaviour while both pages share their pieces.
6. A broken `iconIcoUrl` (empty body, not an image) fails the build.

## Non-goals

- Any animation: no tilt, no bob, no hover rotation of the icon, no spinner (owner).
- A soft recovery through `reset()`, `retry()` or `router.refresh()` (owner).
- Error reporting to a service (Sentry); the error goes to `console.error` only.
- Using this page for 404s.
- A check of misspelt content file names (owner: the files are edited, never recreated).

## Decided by the owner (2026-11-12)

1. **Static page.** As the 404: no motion of any kind. On a click the button label changes to "Reloading…", the button is disabled and `data-busy` is set; nothing spins. The big number is always "500", whatever the error.
2. **The button reloads the document**: `window.location.reload()`, nothing softer.
3. **`global-error.tsx` exists** and shows the same page, in the language of the first path segment (English when it is not a locale). Its texts come from a small dictionary in code, because importing the messages files would put every locale's messages into every page's JavaScript; a unit test fails when the dictionary differs from `Pages.Error` in `messages/<locale>.json`.
4. **Focus moves to the `<h1>`** when the page appears (`tabIndex={-1}`), unlike the 404: an error replaces the content in the middle of a visit, and without the move a screen reader would not notice.
5. **Shared pieces.** The layout, the grid, the number with its tile, the texts and the pill style move to `src/shared/ui`; the 404 is rebuilt on them under its existing tests.
7. **No header on the Error page** (2026-11-12, after the builder check asked how a static header would carry the name and the links in eight languages and fit a 320 px phone). `global-error.tsx` renders none. `[locale]/error.tsx` renders inside the root layout, whose header it cannot remove from its markup: the page carries `data-error-page`, the header gets `data-site-header`, and `globals.css` hides it with `:root:has([data-error-page]) [data-site-header] { display: none; }` (`:has()`: Chromium 105, Safari 15.4, Firefox 121). A reload brings the header back. The question of the header's active item disappears with it.
8. **Testing.** Unit tests for the content and the button; e2e tests trigger a real error by making a browser API throw through `page.addInitScript` (no test code in production), one for the page boundary and one for the global boundary.

## Design

### Where the code lives

- `src/shared/ui/StatusPage.tsx`: `<main>` with the decorative grid and the centred column; props for the code element, the label, the title (rendered as `<h1>`, with an optional ref and `tabIndex` for decision 4), the text, an optional detail line (the Error ID box) and the action (children). No hooks, no `"use client"`: the server 404 and the client error pages both render it.
- `src/shared/ui/StatusCode.tsx`: the big number, `aria-hidden`, with a `variant: "not-found" | "error"` prop. `not-found`: "4", tile, "4", tile at −6°, the `deco` square top right. `error`: "5", "0", tile, tile at +8° and `.04em` lower, the `deco` square top left, the crack SVG over the tile (`viewBox="0 0 100 100"`, `preserveAspectRatio="none"`, `overflow: visible`, path `M58 -2 L50 22 L62 34 L46 52 L58 66 L44 102`, stroke `var(--background)`, width 5, round caps and joins), and the small chip of the prototype if it shows in the screenshots.
- The pill style of "Back to home" becomes shared (a class list or a small component in `src/shared/ui`), used by the 404 link and the reload button.
- `src/views/error/ErrorContent.tsx` (`"use client"`): the Error page's content, marked `data-error-page`, from texts passed as props (`label`, `title`, `text`, `errorId`, `reload`, `reloading`, `metaTitle`) and the `digest`: the `<title>` and `<meta name="robots" content="noindex">` elements (React 19 hoists them), the `StatusPage`, the Error ID box only when `digest` is set (never `error.message`), the reload button, the focus on the h1, `console.error(error)` in an effect.
- `src/app/[locale]/error.tsx`: reads the texts with `useTranslations("Pages.Error")` and renders `ErrorContent`.
- `src/app/global-error.tsx`: its own `<html lang>` and `<body>`, `globals.css`, `fontVariables`; the theme of the visitor (the `theme` key of `localStorage`, otherwise `prefers-color-scheme`) computed during the first client render, so there is no flash (Claude's call); `dark` when rendered on the server, as the handoff says, with `suppressHydrationWarning` on `<html>`; no header; `ErrorContent` with the texts of the dictionary.
- `src/widgets/header/Header.tsx`: `data-site-header` on the `<header>`; the rule in `globals.css`.
- `src/views/error/error-texts.ts` (or next to `global-error.tsx`, as the boundaries lint allows): the dictionary `Record<Locale, ErrorTexts>` and `getErrorLocale(pathname: string): Locale`.

The builder places the pieces where `eslint-plugin-boundaries` accepts them and adjusts the names to the layer rules; the split (shared visual pieces, one client content component, two thin boundaries) is the decision.

### Texts

`metaTitle` lives in `Pages.Error`, not in `meta.md`: a client error boundary cannot read `meta.md`, so this is a deliberate exception to [[ADR-0016 Metadata in Markdown]], recorded in [[Content Model]] (Claude's call).


- `Pages.Error` in the eight `messages/<locale>.json`, keys of `docs/design/shared/messages.error.en.json`: `metaTitle`, `label`, `title`, `text`, `errorId`, `reload`, `reloading`. English as in the handoff; the other seven translated by Claude in the style of the existing `Pages.NotFound` translations (French no-break spaces before `:`, Polish one-letter words bound to the next word, `metaTitle` with the locale's form of the name: «Михаил Александров» in `ru`, "Mikhail Aleksandrov" elsewhere). The translation test covers the new keys.
- The global dictionary holds the same eight objects.

### The reload button

`<button type="button">` in the pill style, the circular-arrow icon (18 px, stroke 2.4) before the label; the label in a span with `aria-live="polite"`. On click: `data-busy`, `disabled`, the label becomes `reloading`, then `window.location.reload()`. Full width on phones, as the 404 link.

### Favicon guard

`loadIcon` in `src/views/site-layout/favicon.ts` throws when the response is not OK (as now), when its `content-type` does not start with `image/`, or when the body is empty.

## Testing

- Unit: `StatusCode` both variants (the error variant has the crack path, the tile is the third glyph); `ErrorContent` (texts, Error ID only with a digest and never the message, button busy state and `location.reload` called once, focus on the h1, `<title>` and `noindex`); `getErrorLocale` (`/ru/x` → `ru`, `/xx` → `en`, `/` → `en`); the dictionary equals `Pages.Error` of every `messages/<locale>.json`; favicon: an empty body and a `text/html` response both throw.
- e2e (fixtures build): the page boundary: an error in a page component on `/en/about` (the builder picks the browser API and proves it reaches `[locale]/error.tsx`) shows no header (the site header is in the DOM but hidden), the h1 focused, "500", no Error ID, the button reloads the page; the same in `ru`. The global boundary: an error in a root-layout client component (for example `MutationObserver`, used by `ThemeColorSync`) shows no header and the page in the URL's language, with the visitor's stored theme. No horizontal scroll at 320 px. The console guard of `e2e/fixtures.ts` allows the provoked error only in these tests.
- The 404 e2e tests pass unchanged after the refactor.

Definition of done: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`; the route table unchanged except the boundaries Next adds.

## Left to the builder

- The browser API each e2e test breaks, proven to reach the intended boundary.
- The exact props and names of the shared components, within the layer rules.
- Whether the pill style is a class constant or a component.
- The prototype's exact values (`docs/design/error/prototype.dc.html`) for the Error ID box and the crack's chip.
