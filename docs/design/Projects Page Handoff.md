---
tags: [design, handoff, projects]
status: approved
updated: 2026-11-03
---

# Projects Page Handoff

`/[locale]/projects` shows the full story of every place of work on one page. All jobs are in the HTML at once, so they are all indexed. The presentation is "scrollytelling": a pinned column tracks which job you are reading. Approved variant: **C v2** on the design canvas. The owner corrected it on 2026-11-03: the section "Changes since 2026-11-01" and the text below are older, and [[2026-11-03-projects-page-design]] wins where they differ.

See [[README]] for shared rules and files. Data: `experience` in `shared/content.ts`. Messages: the `Projects` namespace.

## Changes of 2026-11-03

- **Not shown:** the years in any form, above the `h2` and on the stage; the "What I did" heading.
- **The short description** is 16 px / 1.6, plain text, followed by the full description with no heading.
- **The image** moved: under the meta line below `lg`, on the stage above the name from `lg`, centered with the name and the role.
- **Omega-R** is gone from the database; three jobs remain. The label reads `Projects · 2021 — 2026`, and it is the `h1`.
- **Rendering:** static, as Home.

## Changes since 2026-11-01

- **"‹ Back" link**: on desktop it sits at the top of the sticky aside, above the label; on phone it sits in a row (padding 12 × 18 × 6 px) above the sticky progress bar. Style is in [[README]].
- **Content follows the admin** ("Experience" section). Each job now has:
  - a short description (`description`, the same text as the Home card);
  - a rich-text full description (`body`);
  - picked skills;
  - an image.
- **Removed:** the separate lead, the context paragraph, the two stat tiles and the "What I did" list. The screens still show them; ignore those blocks. The section content is listed below.
- **Naming**: the admin calls this page "Experience". See Open questions in [[README]].

## Scope and order

1. Route and data: a static page reading `experience`; one `<article id="{id}">` per job with an `h2`.
2. Desktop layout: a two-column split with a sticky aside.
3. Phone layout: a sticky progress bar.
4. Progress tracking: a small client component that only sets data attributes and CSS variables.
5. Anchors and links: the aside rows link to `#id`; Home links arrive at `/projects#id`.
6. Reduced motion, accessibility pass.

## Desktop (≥ lg)

Grid `minmax(0, .9fr) minmax(0, 1.1fr)`, no outer gutter: the page is a full-width split under the header.

**Aside (left), sticky**: `position: sticky; top: <header height>; height: calc(100dvh - header)`, `bg-card`, right border `card-border`, padding 40 × 40 × 32 × 48 px, vertical flex with gap 20 px.

- A mono label at the top: "Experience · 2019 — 2026" (the years come from the data).
- A **stage** that fills the free height. It stacks one block per job; only the active block is visible. The others are at opacity 0 with `translateY(24px)`, and the switch takes 0.45–0.55 s with ease-out. Each block holds:
  - the years in outline (for example "2023–24"): 118 px, weight 800, tracking −.05em, transparent fill, a 1.5 px stroke in `border`, decorative (`aria-hidden`);
  - the company name: 54 px, 700, tracking −.04em;
  - a mono line: role · duration.
- **Rows nav** at the bottom (`<nav aria-label="Places of work">`), one link per job:
  - Grid: index `01` (mono 12) · company (14 px) · period `11/2024 – 10/2026` (mono 12), with a 3 px progress track under the row.
  - The track fill is `brand`, and its width is the reading progress through that job's section (0–100%).
  - Rows are `muted-foreground`. The active row is `foreground` with its index in `brand`.
  - A click scrolls smoothly to the section.

**Main (right)**: the sections in order. Each section:

- padding 56 × 56 × 64 px, a bottom border in `card-border`, `min-height: 95dvh` so that every job gets a "screen";
- content, top to bottom, with a 16 px gap:
  - the years as a mono label;
  - `h2` with the company name, 34 px;
  - a mono meta line: role · period · duration;
  - the short description (`description`), 20 px / 1.45 (the old "lead" style);
  - the full description (`body`), rendered with the shared `<RichText>` component at 16 px / 1.6 in `foreground-soft`. Lists use the 8 px `deco` squares, like on Home;
  - `h3` "Skills" (mono 13 px uppercase, `muted-foreground`), then tag chips for the job's skills;
  - the company image: 200 px tall, radius 16, with the striped placeholder until real images exist.

## Phone

- **Sticky progress bar** under the header (`top: <header height>`): `bg-card`, a bottom border, padding 10 × 16 × 12 px.
  - Row 1: the active company (17 px, 600) on the left and its period (mono 12 px) on the right. It is `flex-wrap: wrap`, so on narrow screens the period moves to a second line under the name. The text crossfades when the active job changes.
  - Row 2: four 3 px segments with 4 px gaps, one per job, filled in `brand` with that job's reading progress.
- Sections are stacked below with padding 28 × 18 × 36 px. Same content as desktop, with the image at 130 px and the h2 at 30 px.

## Progress logic (client)

- **Active job:** the last section whose top is above 40% of the viewport height.
- **Progress per job:** `clamp((viewportTop + 0.4·vh − sectionTop) / sectionHeight, 0, 1)`.
- **Bottom of the page:** when the page is scrolled to the end, the last job becomes active and every progress bar is set to 1, because the last section can never reach the 40% line otherwise.
- Use one scroll listener throttled with `requestAnimationFrame`, or `IntersectionObserver` plus a scroll listener for the progress values. The component writes `data-active` on the stage and rows, and `--progress` on the bars. The content stays server-rendered.
- The aside rows are real `<a href="#id">` links. The client component only enhances them with smooth scrolling.
- Set `scroll-margin-top` on sections to the header height on desktop, and to header + progress bar on phone.

## Accessibility

- Every section is an `<article>` with an `h2`. The aside stage repeats the company name only visually: mark it `aria-hidden` to avoid reading it twice.
- On the active row link set `aria-current="true"`.
- With reduced motion, the crossfade becomes an instant swap; the progress bars may still update because they are not animated.

## Data notes

The page shows work experience, while the Data Model also has a separate `projects` entity. For now the Projects page reads `experience` with the extra fields `role`, `body` (rich text), a `skills` relation and `image`. Record this in [[Data Model]] / [[Open Questions]] at Stage 3, together with whether a separate "projects" list is still needed.

Owner TODOs in `content.ts`: roles, all Omega-R content, and company images.
