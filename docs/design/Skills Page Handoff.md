---
tags: [design, handoff, skills]
status: approved
updated: 2026-11-03
---

# Skills Page Handoff

> Built on 2026-11-03 with the owner's corrections: no "Skills" label above the title, no "All skills" label above the tile, no URL sync, chip counts that follow the query, filters that reset when the visitor leaves, 16 px search text on phones, chip counts colored `muted-foreground` instead of 70% opacity, and on phones a sticky panel that folds the search while scrolling down, with the chips in one swipeable row. See [[2026-11-03-skills-page-design]].

`/[locale]/skills` shows the full skills list with search and domain filters. It is what "Show all N skills" on Home links to.

See [[README]] for shared rules and files. Data: `skills` and `skillDomains` in `shared/content.ts`. Messages: the `SkillsPage` namespace.

## Changes since 2026-11-01

- **"‹ Back" link** above the hero label (style in [[README]]).
- **Domains are data.** The admin can rename, add and delete them. Build the filter chips and their counts from `skillDomains` plus the skills in each domain, not from a fixed list. Domain names are localized content, not messages.
- **Skills have a `main` flag** besides `featured` ("Top"). It does not change this page yet; see Open questions in [[README]].

## Scope and order

1. Static route: hero, section header, and the full list rendered on the server (sorted).
2. Filter panel and list layout.
3. `SkillsExplorer`, a client component that holds the query and domain in state and hides rows that don't match.
4. Optional: sync the filters to `?q=&domain=` so a filtered view can be shared.

## Layout

- **Hero**: label "Skills", h1 "Skills", intro "Everything I work with, rated from 1 to 10. Search or filter by domain."
- **Section header**: the mono label "All skills" on the left; the count on the right: "41 skills", or "N of 41" while filtering.
- **Tile**: one `card` with a `card-border` border, radius 24, padding 28.
  - **Desktop**: grid `240px | 1fr` with a 32 px gap.
    - The aside is sticky (`top: 20px`) with a right border in `card-border` and 24 px right padding. It holds the search, the "Domain" label and the domain chips.
    - The list is a 2-column grid with gaps of 18 × 32 px. Each row is a grid `132px | 1fr | 40px`: the name (500), the 10-segment bar (10 px tall, 3 px gaps) and "n/10" in mono 12 `muted-foreground`.
  - **Phone**: a flex column with a 14 px gap: search, chips (wrapping), rows. Each row has the name and "n/10" on one line, with the bar below (8 px, 3 px gaps).
- **Search**: a 44 px pill with a `background` fill, a `card-border` border and a search icon. The visually hidden label is "Search skills". Focus: `brand` border plus a 3 px ring at 25%. Matching is a case-insensitive substring.
- **Domain chips**: All 41 · Core 5 · Frameworks 4 · Frontend 19 · Tools 13. The count follows the name in mono at 70% opacity. Single select; the active chip uses `selected`.
- **Order**: level descending, then the `sort` field, then name.
- **Empty state**: "No skills match “{query}”." in `foreground-soft`.

## Accessibility

- Each row has `role="meter"` with `aria-valuemin="1"`, `aria-valuemax="10"`, `aria-valuenow` and an `aria-label` such as "React: level 9 of 10".
- The chips form a toggle group (`aria-pressed`, or the Base UI toggle group).
- Announce count changes politely: `aria-live="polite"` on the count.

Owner TODOs: real levels for all skills (only 5 are set; the rest are placeholder 6).
