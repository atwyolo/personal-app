---
tags: [design, handoff, home]
status: approved
updated: 2026-11-01
---

# Home Page Handoff

Approved design of the home page (`/[locale]`), ready to implement. Mobile-first, two themes, eight locales. The design was iterated in a Claude Design canvas; this note is the implementation contract.

Part of the site handoff, see [[README]] in this folder. Related: [[Roadmap]], [[Rendering Strategy]], [[Localization]], [[Data Model]], [[ADR-0005 UI Library]].

## Changes since 2026-10-28

- **No footer.** The site has no footer on any page; the mobile prototype's footer line was removed.

- Blog preview cards show the post **topic** (Technical / Software / Hobby) as a badge before the date, same as on the Blog page.

- The Skills block became **My top skills**: no search, filter or counter; it shows only skills marked `top`; "Show all N skills" links to the new `/skills` page.
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
- Desktop: nav Home · About · Projects · Skills · Blog · Contact (15 px, gap 28 px). Active item: `text-brand`, 600, underline in `deco`, 3 px thick, offset 8 px. In the build the underline is one bar that slides between items, in the same place; a browser without anchor positioning keeps the plain underline (owner's decision, 2026-11-02, [[ADR-0012 Nav Indicator]]).
- Right controls, all in `text-brand`:
  - **Locale menu.** Mobile: 44 px round icon button showing the code ("EN"). Desktop: pill button, code + chevron-down.
  - **Theme menu.** Mobile: 44 px round button. Desktop: pill, icon + chevron. The icon shows the *resolved* theme: moon for dark, sun for light.
  - Mobile only: hamburger (44 px round, `text-foreground`). **The open menu was not designed** — use a shadcn Sheet from the right with the same six nav items, active item styled as on desktop.
- Menus (both): popover anchored bottom-right, 8 px gap, min-width 210 px, padding 6 px, radius 16 px, `bg-popover`, border `card-border`, soft shadow. Items 40 px tall, radius 10 px, hover `bg-accent`. Selected item: `text-brand` on the whole item, the hint included, + check icon at the end (owner's decision, 2026-11-02; the design left the hint muted). Focus keeps it.
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
- Tag chips (React.js, Redux, Next.js, NestJS, TypeScript, Express): mono 12–13 px, pill, border `card-border`, text `brand`, weight 500. Chips show **colored text only**, no fill, in both themes.

### Photo

Mobile: square (`aspect-ratio: 1`). Desktop: fills column 1 above the contacts, at least 380 px tall. `object-fit: cover; object-position: 50% 12%`. Use `next/image` with `priority`, since it is the LCP element.

### Contacts and CV (stacked, full tile width, gap 12 px)

Compact brand buttons, 56 px tall, radius 16 px, label 17 px / 700:

| Button | Background / text | Left mark | Label | Link |
|---|---|---|---|---|
| WhatsApp | `whatsapp` / `whatsapp-foreground`, `#188842` with white text (owner's decisions, 2026-10-30 and 2026-11-01; the tokens below keep the design's values) | white logo, no plate | "WhatsApp" | `https://wa.me/37493310039`, title = phone |
| Mail | `gmail` / white | 40 px envelope, red fill, white 2.5 px outline | mailbox name "mikhail.aleksandrov.job" (part before `@`, may wrap at dots on desktop) | `mailto:` |
| LinkedIn | `linkedin` / white | 36 px white plate, "in" glyph in `linkedin` | "LinkedIn" | profile URL |
| Download CV | `primary` / `primary-foreground` | download icon | "Download CV" + mono "PDF" on the right | `/cv/Mikhail_Aleksandrov_CV.pdf` with `download` |

Each button has an arrow-up-right icon on the right (CV: the "PDF" mark) and an `aria-label` from messages. Brand colors are the same in both themes. Icons are generic glyphs, not official logos; swap in brand-kit SVGs (or `simple-icons`) if wanted.

### About

- Label "About", then the lead paragraph: 17 px mobile, 20 px desktop.
- "A few results I'm proud of:" in 600 weight, followed by three bullet items. Each bullet is an 8 px square, radius 2 px, in `deco`.
- Mobile: a secondary pill button "Read more" linking to `/about`.
- Desktop: the extra paragraph from `content.ts` is shown instead, in `foreground-soft`, 16 px / 1.6.

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

A short list of skills marked `top` in the main skills list, without a limit (owner's decision, 2026-11-01; the layout is drawn for 1–20). No search, no domain filter and no "Top N of M" counter on the home page: the full explorer lives on the separate `/skills` page (designed separately).

- Section header: the mono label "My top skills", no count on the right.
- Data: `getTopSkills`, the `top boolean` column on `skills`, sorted by level desc, then `sort`, then name. `content.ts` and the prototype still call the flag `featured`.
- One tile.
  - Mobile: one column; each row has the name (500 weight) on its own line, then the 10-segment bar (8 px tall, 3 px gaps) and a mono "n/10" on one line (owner's decision, 2026-11-01; the prototype and the screens still show the value next to the name).
  - Desktop: padding 28 × 32 px; grid `repeat(auto-fill, minmax(320px, 1fr))` with gaps of 18 × 48 px, so 1–2 skills fill one row and 20 spread over three columns. Each row is a grid `150px | 1fr | 44px`: name, bar (10 px tall, 4 px gaps), "n/10".
- Bar segments are filled in `brand` up to the level; the rest use `placeholder`. Each row has `role="meter"` with `aria-valuenow` or an `aria-label` from messages.
- Button below the tile: a primary pill reading "Show all {total} skills", where the total is counted from the full list. It is a link to `/[locale]/skills`. Desktop: right-aligned, like "All experience". Mobile: full width.

### Blog preview

- Shows the 3 latest posts. The section header has no controls.
- Post card:
  - meta row: topic badge (mono 11 px, uppercase, `brand` text on `brand` at 14% opacity, radius 6 px, padding 5 × 8 px), then the date as a mono label formatted with next-intl `format.dateTime`. The label comes from `post_topic_translations`, not from messages (owner's decision, 2026-11-01);
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

The owner simplified the design's motion on 2026-11-01: one wipe on load, all at once, and never again until a reload. The stagger, the scroll-driven reveal and the `.reveal-load` class of the prototype and `tokens.css` are not used. See [[2026-10-30-home-motion]].

- Every block reveals with a full-cover shutter in `shutter` that slides off, with `transform: scaleX(1 → 0)` on `::after`.
- `.reveal` plays on page load for 0.7 s with `cubic-bezier(.75,0,.2,1)` after 150 ms, on every block at the same time. Links, the back button and a language switch do not start it; a reload does.
- It covers the header, hero, the photo, each contact button, About, each Experience card, the skills tile and each post card, on every width. Section headers, pills and carousel controls carry no class.
- Directions alternate: `.reveal` slides right, `.reveal-left` slides left.
- `overflow: clip`, not the `hidden` of `tokens.css`: `hidden` makes a block a scroll container, which stops any `view()` timeline inside it.
- All of it is wrapped in `prefers-reduced-motion: no-preference`. CSS is in `src/app/globals.css`.

## Accessibility checklist

- Touch targets ≥ 44 px for all buttons and carousel arrows.
- Visible focus: `ring` color, 3 px, as an outline on links and a box shadow on buttons, which keep an outline in forced colors mode.
- Icon-only buttons have labels; decorative icons `aria-hidden`.
- Contrast checked: `brand` on card is 6.7:1 in light and 12.7:1 in dark. Muted text is ≥ 5.5:1. Text on the contact buttons is ≥ 4.5:1. Yellow is never used for text.
- `lang` and `hreflang` come from the locale segment. Mobile menus trap focus (Sheet / Menu do this).

## Data and content

- Until Stage 3, read from `src/content/site.ts`. Keep component props in the shapes defined there, so swapping in Drizzle queries later doesn't touch the UI.
- The Data Model needs these additions; record them in [[Data Model]] when Stage 3 starts:
  - `experience`: `image`, a tag relation to `skills` (many-to-many), and `description` limited to 3 sentences (plain text is enough on the home page).
  - `posts`: `cover`, `tags` (a `tags` table plus `post_tags`).
  - `skills`: `top boolean default false` (drives "My top skills", done 2026-11-01).
  - `posts`: `topic_id`, see [[Data Model]] (done 2026-11-01).
- Owner TODOs (marked in `content.ts`): the photo file, the CV PDF, the Omega-R description, the experience tag lists, real skill levels (currently only 5 are set; the rest are placeholder 6), which skills are `top`, and real posts.

## Open questions (add to [[Open Questions]])

- The mobile menu (Sheet) contents and the tablet layout were not designed. Proposed defaults are above.
- Should the hero chips come from `topSkills` or stay a hand-picked list?

## Kickoff prompt for the Claude Code session

> Read `CLAUDE.md`, `docs/Home.md` and `docs/design/Home Page Handoff.md`, then look at the screenshots in `docs/design/home/screens/`. Implement the home page following the "Scope and order" section, one step at a time. Before each step, briefly explain the approach and the Next.js concepts involved, and wait for my OK. Use `tokens.css`, `content.ts` and `messages.en.json` from `docs/design/shared/` as the sources of truth. Use `docs/design/home/prototype.dc.html` only to look up exact values. Don't commit.
