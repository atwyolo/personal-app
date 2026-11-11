---
tags: [design, handoff, error]
status: approved
updated: 2026-11-12
---

# Error Page Handoff

Shown when rendering fails. It has a large "500" whose last zero is a **cracked** accent tile, a short message, the error ID, and one primary button that reloads the page. It is built on the same layout as [[Not Found Page Handoff]]. Implement 404 first and reuse its pieces.

See [[README]] for shared rules and tokens. Messages: the `Error` namespace in `shared/messages.error.en.json`; merge it into `messages/en.json`.

## Files

| File | What it is |
|---|---|
| `error/screens/desktop-{dark,light}-1.png` | Desktop, 1120 × 700 frame |
| `error/screens/phone-{dark,light}-1.png` | Phone, 360 × 700 frame |
| `error/prototype.dc.html` | Prototype source, for exact values only |

## Where it is used (Next.js App Router)

1. **`src/app/[locale]/error.tsx`**: the main case.
   - It must be a Client Component (`"use client"`) and receives `{ error, reset }`.
   - It renders inside the locale layout, so the header, theme and next-intl work. Use `useTranslations("Error")`.
   - Log the error in `useEffect` (`console.error(error)`, or Sentry when it is added).
2. **`src/app/global-error.tsx`**: the fallback when the root layout itself fails.
   - It replaces the root layout, so it renders its own `<html>` and `<body>`. Import `globals.css` so the tokens are available.
   - It **cannot** rely on the header component, providers or next-intl. Render the same content with a static header (the name plus plain `<a>` nav links) or with no header.
   - Pick the strings from a small in-file dictionary by the first path segment (`/ru/...` → ru). English is the fallback.
   - Default to the dark theme: the theme script may not have run.
3. Do **not** use this page for 404s; `notFound()` renders the Not Found page.

## Layout

Same as 404: the header has no active item, there is no Back link and no footer, the content is centered in the space under the header, and there is the decorative grid. Only these parts differ.

### The "500"

- `aria-hidden="true"`. Font: Geist 800, 200 px / 1 (112 px on phone), letter-spacing −.06em, in `text-foreground`.
- **The last zero is the tile:**
  - it has the same size, radius, `bg-brand` color, hole and shadow as on 404;
  - it is rotated **+8°** (404 uses −6°) and dropped .04em lower;
  - the `deco` square sits in the **top-left** corner, with the same 2.4 s bob.
- **Crack:**
  - an inline SVG over the tile (`viewBox="0 0 100 100"`, `preserveAspectRatio="none"`, `overflow: visible`);
  - path `M58 -2 L50 22 L62 34 L46 52 L58 66 L44 102`;
  - stroke `background` color, width 5, round caps and joins. It reads as a crack through the tile and its hole.
- **Tilt toward the cursor** on desktop, the same as 404 (`rotateX` / `rotateY` up to 28°). Skip it on touch and with reduced motion.

### Text

- **Label**: "Error 500 · Something went wrong", in the same style as on 404.
- **h1**: "Something broke on my side", `text-wrap: balance` (two balanced lines on phone).
- **Paragraph**: "It's not you. Reload the page, and if it keeps happening, try again in a few minutes."
- **Error ID box** (the same dashed mono box as the 404 path):
  - "Error ID:" followed by `error.digest` in a 500-weight span (`foreground-soft`).
  - Show it only when `digest` exists, which is in production. It is safe to show, because it is a hash and not the message.
  - Never show `error.message`.

### Reload button

- The same pill as "Back to home": 52 px, `bg-brand`, text in the `background` color, Geist 700 16 px, a 20 px left padding. It is a `<button type="button">`.
- Icon: a circular arrow (18 px, stroke 2.4) before "Reload page".
  - On hover, the icon rotates −40°.
  - Focus: a 2 px `brand` outline, offset 4 px.
- **Click:**
  - set `data-busy` and change the label to "Reloading…";
  - the icon spins at 0.8 s per turn (no spin with reduced motion);
  - then call `window.location.reload()`.
  - The button is disabled while busy. In the prototype it resets after 1.6 s, because the page cannot reload there.
- Why a full reload and not `reset()`: `reset()` only re-renders the segment and often fails again on the same data. A full reload is what the button promises. Optionally try `startTransition(() => { router.refresh(); reset(); })` first, and fall back to `location.reload()` if the error repeats.
- On phone it is full width.

## Accessibility and SEO

- One `<main>` and one `<h1>`; the big number is hidden from screen readers.
- After the error renders, move focus to the h1, so screen readers announce it.
- The busy label change is announced: the button has `aria-live="polite"` on its label span.
- Metadata title "Something went wrong — Mikhail Aleksandrov", `robots: noindex`. Next.js returns status 500 for server errors automatically.
