---
tags: [adr, ui]
status: accepted
date: 2026-11-02
---

# ADR-0012 Nav Indicator

## Context
The owner asked for the highlight of the desktop navigation to slide from one item to the next instead of jumping (2026-11-02), on the condition that a browser without the feature keeps today's behavior.

The highlight was a `text-decoration` on the current link, so nothing could travel between items. The header is a Server Component, the first load is 225 KB of JS, and mobile Lighthouse stopped at 98 after work on exactly that budget ([[2026-10-30-home-motion]]).

## Decision
CSS Anchor Positioning. One server-rendered bar in the `nav`, anchored to the link with `aria-current="page"`, with a transition on `left` and `right`: 0.3 s, the easing of the accent wipe. No new JavaScript.

All of its behavior sits inside `@supports (anchor-name: ...) and (left: anchor(left))`, so the underline on `NavLink` stays the base and a browser without the feature gets the old look. Outside the condition there is only a rule that hides the bar; the DOM of such a browser still holds the hidden span and `data-label`.

The bar is a border, because forced colors mode and printing drop backgrounds, and it has `z-index: -1`, because it takes the same 3 px as the focus ring of the current link.

Each item reserves the width of its semibold label through `::after`, otherwise the items around the current one move by up to 3.7 px while the bar slides. `visibility: hidden` keeps that label out of the accessible name, and `::after` keeps it out of `textContent`, which a hidden copy in the DOM would not do.

## Alternatives
- **React `<ViewTransition>`:** the route the stack offers, but a document-wide transition on every navigation for a 3 px bar. A new transition skips the running one, so a second click jumps, and clicks during the transition need their own care.
- **Measuring in JavaScript** (`offsetLeft`, `ResizeObserver`): works everywhere, but adds a client component, has no position before hydration, and has to follow font swaps and locale changes.
- **`motion` with `layoutId`:** the popular choice, at the cost of a new dependency and tens of KB of JS, against the work above.
- **Base UI `Tabs.Indicator`:** a tab semantic on links that are not tabs.
- **Keeping Firefox on the underline** with `not (-moz-appearance: none)` in the condition: the literal reading of the owner's condition, but it is engine detection, and someone has to remove it by hand once Firefox is fixed. Rejected by the owner.

## Consequences
- Three states, measured on 2026-11-02:
  - **Sliding:** Chromium 156, WebKit 27.2, Safari 26.5, although caniuse lists Safari 26.0–26.6 as partial. Chrome from 125, Safari from 26 by the tables.
  - **Bar without the slide:** Firefox 157. It positions the bar and does not run a transition on `anchor()`, see Bugzilla 1924226. `@supports` cannot see this, so Firefox takes the anchored branch: the bar jumps as the underline did, and the items stay in place. It should start sliding when that bug is fixed. Accepted by the owner on 2026-11-02.
  - **The old underline:** every browser without anchor positioning, such as Chrome below 125, Safari below 26, Firefox below 147. Run in Chromium and in Safari 26.5 with the condition disabled.
- Support tables list a property, not its animation: run the feature in all three engines.
- The navigation is 13 px wider at 1280 px, because every item holds its semibold width.
- The bar starts when the route commits, not on the click. A prefetched page shows no delay; a slow one does.
- A transition needs a mounted element, so a language switch places the bar without moving it, because it remounts the root layout.
- The mobile menu keeps the underline: it is a list that closes on navigation.
- jsdom has no layout, so the behavior is tested in `e2e/header-nav.spec.ts`. That file disables the condition in the HTML to run the fallback branch, with a replacement of the same length, because the RSC stream counts its rows in bytes.
- If the pages get view transitions later, the bar stays as it is, or moves to them as a named element.
