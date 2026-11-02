---
tags: [design, handoff, home]
status: approved
updated: 2026-11-02
---

# Home Page Handoff

Approved design of the home page (`/[locale]`), ready to implement. Mobile-first, two themes, eight locales. The design was iterated in a Claude Design canvas; this note is the implementation contract.

Part of the site handoff, see [[README]] in this folder. Related: [[Roadmap]], [[Rendering Strategy]], [[Localization]], [[Data Model]], [[ADR-0005 UI Library]].

## Changes since 2026-11-01

- **Contact buttons use theme colors.**
  - WhatsApp, Mail and LinkedIn are identical card-style buttons with `brand` icons, with no brand colors.
  - Download CV stays the filled primary button.
  - See "Contacts and CV" below.
- **About block:**
  - it is one rich-text field, `profile.about`;
  - the desktop-only extra paragraph was removed;
  - desktop now shows the same "Read more" button as mobile.
- **Hero chips will come from Skills.** The admin no longer edits hero tags. The proposal is to use skills marked `main`; see Open questions.

## Changes since 2026-10-28

- **No footer.** The site has no footer on any page; the mobile prototype's footer line was removed.

- Blog preview cards show the post **topic** (Technical / Software / Hobby) as a badge before the date, same as on the Blog page.

- The Skills block became **My top skills**: no search, filter or counter; it shows only skills marked `featured`; "Show all N skills" links to the new `/skills` page.
- The nav gained **Skills** (between Projects and Blog).
- Experience links now point to the Projects page: `/projects#<company>` and `/projects`.

## Files

| File | What it is | Use |
|---|---|---|
| `home/screens/home-{mobile,desktop}-{dark,light}.png` | Full-page renders of the approved design (390 px and 1280 px) | Visual reference. The photo tile is blank only because the image did not load in the renderer. |
| `home/prototype.dc.html` | Source of the interactive prototype | Exact values (sizes, spacing, colors) when a screenshot is ambiguous. Not runnable outside the design tool; the top toolbar (device / theme / replay) is prototype-only. |
| `shared/tokens.css` | Color, radius and font tokens for both themes + the reveal animation | Merge into `src/app/globals.css`. |
| `shared/content.ts` | All copy and data shown on the page, typed | Move to `src/content/site.ts` as the static source until Stage 3 (shared by all pages). |
| `shared/messages.en.json` | UI strings for next-intl | Merge into `messages/en.json`; other locales start as copies (fallback to `en`). |

## Scope and order

This touches Roadmap stages 1 and 2. Suggested order, each step ending green (`lint`, `tsc`, `build`):

1. Tokens and fonts (`globals.css`, `layout.tsx`), `next-themes` provider. Fix the existing font mismatch: `layout.tsx` defines `--font-geist-sans`, but `@theme` reads `--font-sans`.
2. Header: sticky bar, nav, locale menu, theme menu, mobile menu trigger.
3. Hero + photo + contacts + About (static, server components).
4. Experience: desktop grid, mobile carousel.
5. Top skills block (static, server component).
6. Blog preview: desktop grid, mobile carousel.
7. Reveal animation, reduced-motion check, accessibility pass.
8. i18n wiring (`[locale]` segment, `generateStaticParams`), locale switcher navigation.

Rendering: home is **static** per locale (see [[Rendering Strategy]]). Everything interactive is a small client leaf; the page itself stays a Server Component.

## Breakpoints and grid

- Base (mobile, designed at 390 px): content padding 16 px, 2-column bento grid, gap 12 px. In practice every tile spans both columns; keep the 2-column grid for future half-width tiles.
- `lg` (≥ 1024 px, designed at 1280 px): container `max-width: 1200px`, side padding 40 px, 4-column grid, gap 16 px.
- 768–1023 px was not designed: use the mobile layout with the container capped at ~720 px and centered.

## Header (sticky, full width)

- Surface `bg-card`, bottom border `card-border`. Height 64 px mobile, 72 px desktop. `position: sticky; top: 0`.
- Left: full name "Mikhail Aleksandrov", 600 weight, 17 px mobile / 20 px desktop, links to `/[locale]`.
- Desktop: nav Home · About · Projects · Skills · Blog · Contact (15 px, gap 28 px). Active item: `text-brand`, 600, underline in `deco`, 3 px thick, offset 8 px.
- Right controls, all in `text-brand`:
  - **Locale menu.** Mobile: 44 px round icon button showing the code ("EN"). Desktop: pill button, code + chevron-down.
  - **Theme menu.** Mobile: 44 px round button. Desktop: pill, icon + chevron. The icon shows the *resolved* theme: moon for dark, sun for light.
  - Mobile only: hamburger (44 px round, `text-foreground`). **The open menu was not designed** — use a shadcn Sheet from the right with the same six nav items, active item styled as on desktop.
- Menus (both): popover anchored bottom-right, 8 px gap, min-width 210 px, padding 6 px, radius 16 px, `bg-popover`, border `card-border`, soft shadow. Items 40 px tall, radius 10 px, hover `bg-accent`. Selected item: `text-brand` + check icon at the end.
  - Theme items: Dark, Light, System. System shows a mono hint "now dark/light" (`text-muted-foreground`, 11 px).
  - Locale items: native names (English, Русский, Português, Español, Deutsch, Français, 日本語, Polski) with the code as a mono hint.
  - Build with the Base UI menu from shadcn (`DropdownMenu` + `DropdownMenuRadioGroup`). Base UI uses the `render` prop, not `asChild`.
  - Theme: `next-themes` with `attribute="class"`, `enableSystem`, `defaultTheme="system"`. Render the icon only after mount, to avoid a hydration mismatch.
  - Locale: next-intl navigation `router.replace(pathname, { locale })`, keeping the current path.

## Section order

**Mobile:** hero → photo → contacts → About → Experience (carousel) → My top skills → Blog (carousel).

**Desktop:** a 4-column row with the photo and contacts in column 1 and the hero plus About in columns 2–4. Below it: Experience (4 cards), My top skills (full width), Blog (featured card spanning 2 columns plus 2 cards).

Section headers: a mono label (`Geist Mono`, 11 px mobile / 12 px desktop, uppercase, letter-spacing .08em, `text-muted-foreground`), with a count on the right where shown. Header padding is 12 px on top for mobile and 32 px for desktop.

### Tile (shared)

`bg-card`, 1 px border `card-border`, radius 20 px (mobile) / 24 px (desktop), padding 16–20 px mobile / 24–36 px desktop, vertical flex with gap 8–16 px. Image placeholders are striped (`placeholder` lines) with a dashed border and radius 14 px.

### Hero

- H1 "Mikhail Aleksandrov": 700 weight, tracking −.04em. Size 36 px with line-height 1 on mobile; 64 px with line-height .95 on desktop.
- Headline: "Senior Frontend Software Engineer, 8+ years", in `foreground-soft`, 16 / 20 px.
- Tag chips (React.js, Redux, Next.js, NestJS, TypeScript, Express; proposed source: skills marked `main`): mono 12–13 px, pill, border `card-border`, text `brand`, weight 500. Chips show **colored text only**, no fill, in both themes.

### Photo

Mobile: square (`aspect-ratio: 1`). Desktop: fills column 1 above the contacts, at least 380 px tall. `object-fit: cover; object-position: 50% 12%`. Use `next/image` with `priority`, since it is the LCP element.

### Contacts and CV (stacked, full tile width, gap 12 px)

All four buttons are 56 px tall, radius 16 px, label 17 px / 700, padding `0 16px 0 10px`, gap 12 px.

**WhatsApp, Mail and LinkedIn** are identical and themed:

- Surface: `bg-card`, a 1 px `card-border` border, label in `text-foreground`.
- Left: a 36 × 36 px box (no background) holding a 26 px outline icon in `text-brand` (chat bubble, envelope, "in" square).
- Right: an arrow-up-right icon, 18 px, in `text-brand`.
- Hover: the border turns `brand`, the button lifts 2 px with a soft shadow, and the arrow nudges 2 px up-right. Focus: a 2 px `brand` outline, offset 3 px.

| Button | Label | Link |
|---|---|---|
| WhatsApp | "WhatsApp" | `https://wa.me/37493310039`, `title` = phone |
| Mail | mailbox name "mikhail.aleksandrov.job" (the part before `@`, 16 px; may wrap at the dots on desktop) | `mailto:` |
| LinkedIn | "LinkedIn" | profile URL |

**Download CV** is the primary action:

- `bg-primary text-primary-foreground` (border in the same color).
- A download icon on the left, "Download CV", and a mono "PDF" mark on the right.
- Link: `/cv/Mikhail_Aleksandrov_CV.pdf` with `download`.

Every button has an `aria-label` from messages.

Contrast (WCAG AA needs 4.5:1 for text and 3:1 for icons):

| Element | Dark | Light |
|---|---|---|
| Label | 14.2:1 | 18.2:1 |
| Icon and arrow (`brand` on card) | 12.7:1 | 6.7:1 |

The icons are generic glyphs, not official logos.

### About

- Label "About", then the lead paragraph: 17 px mobile, 20 px desktop.
- "A few results I'm proud of:" in 600 weight, followed by three bullet items. Each bullet is an 8 px square, radius 2 px, in `deco`.
- The text comes from one rich-text field (`profile.about`, edited in the admin): the lead paragraph, a bold line and a bullet list. Render it with the shared `<RichText>` component. Here `<ul>` items use the 8 px `deco` squares, and `<strong>` paragraphs are 600 weight.
- A secondary pill button "Read more" linking to `/about`, on both mobile and desktop.

### Experience

- Card content:
  - image placeholder: 140 px tall on mobile, 180 px on desktop;
  - company name: 18 / 20 px, 600;
  - mono period line `MM/YYYY – MM/YYYY · N years`. Compute the duration in years with one decimal and format it with next-intl (`{years, plural, …}`);
  - description of up to 3 sentences: 14 px / 1.5, `foreground-soft`;
  - 3–5 skill tags as chips;
  - "Learn more →" link at the bottom (`mt-auto`).
- Link style, shared with "Read more →" in the blog: `text-brand`, 600 weight, underline in `deco`, 2 px thick, offset 5 px.
- Desktop: a 4-column grid with equal-height cards, then a primary pill "All experience" aligned right below the grid. "Learn more" links go to `/[locale]/projects#<company-id>` (the Projects page holds the full story of every job); "All experience" goes to `/[locale]/projects`.
- Mobile: a **carousel** (see below), then a full-width primary pill "All experience". The section header has no link.

### My top skills (static)

A short list of the skills marked `featured` ("Top" in the admin) in the main skills list. There is no upper limit. No search, no domain filter and no "Top N of M" counter on the home page: the full explorer lives on the separate `/skills` page (designed separately).

- Section header: the mono label "My top skills", no count on the right.
- Data: `topSkills` from `content.ts` (skills with `featured: true`, sorted by level desc, then `sort`, then name). Later: a `featured boolean` column on `skills`.
- One tile.
  - Mobile: one column; each row has the name (500 weight) and a mono "n/10" on one line, with the 10-segment bar below (8 px tall, 3 px gaps).
  - Desktop: padding 28 × 32 px; grid `repeat(auto-fill, minmax(320px, 1fr))` with gaps of 18 × 48 px, so 1–2 skills fill one row and 20 spread over three columns. Each row is a grid `150px | 1fr | 44px`: name, bar (10 px tall, 4 px gaps), "n/10".
- Bar segments are filled in `brand` up to the level; the rest use `placeholder`. Each row has `role="meter"` with `aria-valuenow` or an `aria-label` from messages.
- Button below the tile: a primary pill reading "Show all {total} skills", where the total is counted from the full list. It is a link to `/[locale]/skills`. Desktop: right-aligned, like "All experience". Mobile: full width.

### Blog preview

- Shows the 3 latest posts. The section header has no controls.
- Post card:
  - meta row: topic badge (mono 11 px, uppercase, `brand` text on `brand` at 14% opacity, radius 6 px, padding 5 × 8 px), then the date as a mono label formatted with next-intl `format.dateTime`;
  - title (h3): 17–19 px mobile, 18 px desktop; the featured card uses 22 px;
  - excerpt: 2–3 sentences, 15 px / 1.55, `foreground-soft`;
  - tag chips **under the text** (several per post);
  - "Read more →" link.
- Desktop: a 4-column grid, then a primary pill "All posts" aligned right.
  - The first post spans 2 columns: a 220 px wide cover on the left, content on the right.
  - The other two posts are single-column cards without a cover.
- Mobile: a carousel, then a full-width primary pill "All posts". Only the first post has a 150 px cover.

### Mobile carousel (shared by Experience and Blog)

- Shows one card per view. Use CSS scroll-snap (`overflow-x: auto; scroll-snap-type: x mandatory`, card `flex: 0 0 100%`, `scroll-snap-align: start`, gap 12 px) with a hidden scrollbar. No carousel library is needed.
- Controls sit **above** the track, right under the section header, all in `text-brand`:
  - the position "1 / 4" on the left, in mono, 600 weight;
  - previous and next buttons on the right: 44 px round, border and icon in `brand`, at 35% opacity and inactive at the ends.
- Arrows scroll to the neighbouring card with smooth behaviour. Touch swipe updates the position through a scroll listener: index = `round(scrollLeft / (clientWidth + gap))`.
- Cards in one track share the height of the tallest one.
- Accessibility: the region gets `aria-roledescription="carousel"` and a label; each slide gets `aria-label="{n} of {total}"`; arrows have `aria-label`s from messages.
- It is a small `"use client"` component taking server-rendered children.

## Motion: accent wipe

- Every tile and carousel reveals with a full-cover shutter in `shutter` that slides off, with `transform: scaleX(1 → 0)` on `::after`.
- Directions alternate tile by tile: even index slides right (`data-dir="r"`), odd slides left (`data-dir="l"`). Set this server-side from the render index; no JS is needed.
- First screen (`.reveal-load`): plays on load for 0.7 s with `cubic-bezier(.75,0,.2,1)`, staggered by `--i × 110 ms + 150 ms`. Covers hero, photo, contacts and About.
- Everything below (`.reveal`): scroll-driven with `animation-timeline: view()` and range `entry 15% → entry 100%`. Browsers without support show the tiles immediately.
- Carousels animate as one block, so the cards inside them carry no reveal class.
- All of it is wrapped in `prefers-reduced-motion: no-preference`. CSS is in `tokens.css`.

## Accessibility checklist

- Touch targets ≥ 44 px for all buttons and carousel arrows.
- Visible focus: `ring` color, 3 px.
- Icon-only buttons have labels; decorative icons `aria-hidden`.
- Contrast checked: `brand` on card is 6.7:1 in light and 12.7:1 in dark. Muted text is ≥ 5.5:1. Contact buttons: label ≥ 14:1, icons ≥ 6.7:1 (see above). Yellow is never used for text.
- `lang` and `hreflang` come from the locale segment. Mobile menus trap focus (Sheet / Menu do this).

## Data and content

- Until Stage 3, read from `src/content/site.ts`. Keep component props in the shapes defined there, so swapping in Drizzle queries later doesn't touch the UI.
- The Data Model needs these additions; record them in [[Data Model]] when Stage 3 starts:
  - `experience`: `image`, a relation to `skills` (many-to-many), `description` (the short description, up to 3 sentences, plain text), and `body` (rich text, Projects page).
  - `posts`: `cover`, `tags` (a `tags` table plus `post_tags`).
  - `skills`: `featured boolean default false` ("Top", drives "My top skills") and `main boolean default false`.
  - `profile`: `about` as rich text.
- Owner TODOs (marked in `content.ts`): the photo file, the CV PDF, the Omega-R description, the experience tag lists, real skill levels (currently only 5 are set; the rest are placeholder 6), which skills are `featured`, and real posts.

## Open questions (add to [[Open Questions]])

- The mobile menu (Sheet) contents and the tablet layout were not designed. Proposed defaults are above.
- Hero chips: proposed source is the skills marked `main` (the admin dropped the hero tags field). Confirm, and add "Express" to the skills list if it should stay.

## Kickoff prompt for the Claude Code session

> Read `CLAUDE.md`, `docs/Home.md` and `docs/design/Home Page Handoff.md`, then look at the screenshots in `docs/design/home/screens/`. Implement the home page following the "Scope and order" section, one step at a time. Before each step, briefly explain the approach and the Next.js concepts involved, and wait for my OK. Use `tokens.css`, `content.ts` and `messages.en.json` from `docs/design/shared/` as the sources of truth. Use `docs/design/home/prototype.dc.html` only to look up exact values. Don't commit.
