---
tags: [design, handoff, 404]
status: approved
updated: 2026-11-11
---

# Not Found (404) Page Handoff

Shown for any URL that does not exist. It has a large "404" whose zero is an accent tile, a short message, the requested path, and one primary button back to the home page.

See [[README]] for shared rules and tokens (`shared/tokens.css`). Messages: the new `NotFound` namespace in `shared/messages.not-found.en.json`; merge it into `messages/en.json`.

## Files

| File | What it is |
|---|---|
| `not-found/screens/desktop-{dark,light}-1.png` | Desktop, 1120 × 700 frame |
| `not-found/screens/phone-{dark,light}-1.png` | Phone, 360 × 700 frame |
| `not-found/prototype.dc.html` | Prototype source, for exact values only |

## Routing (Next.js App Router + next-intl)

1. **`src/app/[locale]/not-found.tsx`**: the page itself. It renders inside the locale layout, so the header and theme work as usual. Set the metadata title to "Page not found — Mikhail Aleksandrov" and `robots: { index: false }`.
2. **`src/app/[locale]/[...rest]/page.tsx`**: a catch-all that only calls `notFound()`. Without it, unknown paths under a locale never reach the localized `not-found.tsx`. This is the pattern next-intl documents.
3. **`src/app/not-found.tsx`** (root): a fallback for requests outside any locale. It renders the same component with the default locale, or redirects to `/en/...`, whichever fits the middleware.
4. Any page that loads data (`/experience#id`, a future `/blog/[slug]`) calls `notFound()` when the item is missing.
5. The status code is 404 automatically. There is no client-side redirect.

## Layout

- **Header** as on every page. No nav item is active. There is no Back link (the page is not "inside" anything) and no footer.
- **Content** is centered horizontally and vertically in the space under the header (`min-height: 100%` of the viewport minus the header, a flex column, `text-align: center`). Padding is 40 × 40 × 56 px on desktop and 28 × 20 × 40 px on phone.
- **Background grid** (decorative, `aria-hidden`):
  - 64 px squares (40 px on phone) drawn with 1 px `card-border` lines at 35% opacity;
  - a radial mask centered at 50% / 42% fades it out by 62%.

### The "404"

- `aria-hidden="true"`, because the real heading below says the same.
- Font: Geist 800, 200 px / 1 (112 px on phone), letter-spacing −.06em, `text-foreground`, gap .06em. It is 34 px above the label (24 px on phone).
- **The zero is a tile**, not a glyph:
  - size .6em × .74em, radius .16em, `bg-brand`, rotated −6°, with a soft shadow (`0 .08em .16em -.06em rgba(0,0,0,.45)`);
  - the hole is a centered rectangle, 30% × 50% of the tile, radius .06em, in `bg-background`;
  - top-right corner: a .13em square in `deco`, radius .03em, that bobs up .05em on a 2.4 s ease-in-out loop.
- **Tilt (desktop only):** on `mousemove` over the content area, the tile rotates toward the cursor.
  - It uses `perspective(600px) rotateX(-dy·28deg) rotateY(dx·28deg)`, where `dx` and `dy` are the cursor's offset from the tile center divided by the content size, with a 0.25 s ease-out.
  - On `mouseleave` it resets.
  - Skip it on touch devices (`(hover: none)`) and with `prefers-reduced-motion`; the bob animation stops too.
  - This is a small client component; everything else is server-rendered.

### Text and button

- **Label:** mono 12 px, letter-spacing .12em, uppercase, `text-brand`, 14 px above the heading. Text: "Error 404 · Page not found".
- **h1:** 40 px / 1.1 (27 px on phone), letter-spacing −.03em, `text-wrap: balance`, max width 620 px. Text: "This page took a wrong turn".
- **Paragraph:** 17 px / 1.55 (15.5 px on phone), `foreground-soft`, max width 480 px, `text-wrap: pretty`, 14 px above. Text: "The link may be broken, or the page has moved. Everything else is right where you left it."
- **Requested path:** an inline box 18 px below.
  - Mono 13 px, `muted-foreground`, padding 7 × 12 px, radius 10, 1 px dashed `card-border`.
  - Text: "Requested:" and then the path in `<s>`, in `foreground-soft`.
  - It wraps anywhere for long URLs.
  - Get the path with `usePathname()` (client) or the `x-pathname` header set in middleware. Show only the path, never the query string. Omit the box if the path is unknown.
- **Button "Back to home":**
  - A `<Link href="/">` with next-intl's `Link`, so it keeps the current locale.
  - A pill 52 px tall, padding `0 26px 0 20px`, `bg-brand`, text in `bg-background` color, Geist 700 16 px. An arrow-left icon (18 px, stroke 2.4) before the label, gap 10 px. 30 px above (26 px on phone).
  - Hover: it lifts 2 px with a `brand` glow shadow, and the arrow moves 3 px left.
  - Focus: a 2 px `brand` outline, offset 4 px.
  - On phone it stretches to the full content width.
  - Contrast: the dark theme is lime with navy text (14.2:1); the light theme is blue with off-white text (6.1:1).

## Accessibility and SEO

- One `<main>` and one `<h1>`. The big number is hidden from screen readers, and the label carries "Error 404".
- Move focus to the h1 on client navigations that end here, the same as other pages.
- `noindex`. Do not add the page to the sitemap.
