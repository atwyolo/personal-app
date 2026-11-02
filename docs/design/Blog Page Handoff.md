---
tags: [design, handoff, blog]
status: approved
updated: 2026-11-02
---

# Blog Page Handoff

`/[locale]/blog` lists posts with a topic filter, tag search with multiple selection, and date sorting. For now it shows the same 3 demo posts as Home.

See [[README]] for shared rules and files. Data: `latestPosts` and `postTopics` in `shared/content.ts` (posts have `topic` and `tags`). Messages: the `Blog` namespace.

## Changes since 2026-11-01

- **"‹ Back" link** above the hero label (style in [[README]]).
- **Topics are data.** The admin can rename, add and delete them. `postTopics` is now `{ id, name }[]`. Build the topic chips and counts from it; topic names are localized content (the `Blog.topics.*` messages are only a fallback).
- Cards link to the new post page `/[locale]/blog/[slug]` ([[Post Page Handoff]]).

## Scope and order

1. ISR route: hero plus the full post list rendered on the server.
2. Desktop layout: sticky filter panel, list header, post cards.
3. `BlogFilters`, a client component: topic, tags and sort. It filters and sorts the server-rendered cards.
4. The tag combobox with suggestions, the selected-tag chips and Reset.
5. Phone: the collapsible sticky panel.
6. Sync the state to search params: `?topic=technical&tags=react,jest&sort=old`. Restore it on load and push it with `router.replace` (no scroll).

## Desktop layout

- **Hero**: label "Blog", h1 "Blog", intro "Notes on frontend engineering, software teams and things I do for fun."
- Grid `260px | 1fr`, gap 32 px, padding 24 × 64 × 56 px.
- **Filter panel (left)**: sticky at `top: 20px`. A `card` tile with a `card-border` border, radius 24, padding 22, and 20 px between groups.
  - **Topic**: a mono label, then chips with counts: All 3 · Technical 2 · Software 1 · Hobby 0. Single select; the active chip uses `selected`.
  - **Tags**: a mono label, then the tag search field, then the selected tags.
- **Main (right)**:
  - **List header**: the count on the left ("3 posts", or "N of 3 posts" while filtering; mono label style), and on the right a segmented control for **Sort by date**: Newest | Oldest. It is a pill with a `card` fill and a `card-border` border; the active segment uses `selected`.
  - **Post cards**, 16 px apart: a `card` tile, radius 24, padding 16, grid `220px | 1fr` with a 24 px gap.
    - Left: the cover, at least 200 px tall.
    - Right:
      - a meta row: the **topic badge** (mono 11 px uppercase, `brand` text on `brand` at 14% opacity, radius 6, padding 5 × 8), then the date as a mono label;
      - the title `h2`, 22 px / 1.25;
      - the excerpt, 15 px / 1.55, `foreground-soft`;
      - tag buttons;
      - "Read more →".

## Tag search (combobox)

- The field is a 44 px pill with a tag icon, the placeholder "Search by tag", and a "×" that clears the typed text (visible only while there is text).
- No tag list is shown by default. While typing, a **suggestions popover** opens under the field:
  - It holds the tags that contain the query, excluding tags already selected. Each row shows the tag name on the left and its post count on the right ("1 post", "3 posts").
  - Popover: `card` with a `card-border` border, radius 16, padding 6, a soft shadow; rows 40 px tall, mono 14 px; hover and the active row get an 8% `foreground` tint and `brand` text.
  - Keyboard: ↑ ↓ move the active row, Enter picks it, Esc closes. Mouse: pick on `mousedown`, so the field's blur doesn't close the popover first.
  - When nothing matches, show "No matching tags".
- **Picking a tag** adds it to the selection, clears the field and closes the popover.
- **Selected tags** sit under the field: chips with a `brand` fill and `primary-foreground` text, each with a round "×" that removes it. On the right of the chips there is a **Reset** link (`brand`, `deco` underline) that clears all selected tags. The row exists only while at least one tag is selected.
- Clicking a tag on a post card toggles that tag in the selection. Selected tags on cards are filled with `brand`.
- Build it with the Base UI Combobox from shadcn if it fits; otherwise use an input with `role="combobox"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`, and a listbox.

## Filtering rules

- Shown posts = topic matches (or "All") **and** (no tags selected **or** the post has **any** of the selected tags).
- Sorting applies to the visible list: Newest = `publishedAt` descending.
- Topic counts show totals per topic. They do not change with the tag selection.
- **Empty state**: a dashed-border block: "No posts here yet" plus a hint. With "Hobby" selected and no tags, the hint is "Hobby posts are coming soon."; otherwise "Try another topic or tag.". A "Reset filters" link resets the topic and the tags.

## Phone

- **Order**: hero, filter panel, list header (count left, sort right), then **all** matching posts in a single column. There is no carousel on this page. Cards stack: the cover (140 px) on top, then the content.
- **Filter panel**: a `card` tile, radius 20, padding 16. It holds:
  1. **Topic row**: one line that scrolls horizontally (`overflow-x: auto`, hidden scrollbar). The row bleeds to the panel's edges: negative margin and matching inner padding equal to the panel padding. When chips overflow, show **edge fades**: a 36 px gradient from `card` to transparent on the side that has hidden chips (right at the start, both sides after scrolling, left at the end). A chip cut by the edge is the second hint that the row scrolls.
  2. **Selected tags row** (only when tags are selected): chips plus Reset, as on desktop, with 10 px above.
  3. **Tag search field**, inside a collapsible wrapper with 12 px above.
- **Sticky behaviour** (the panel is `position: sticky; top: <header height>`):
  1. **Scrolling down**: when the panel reaches the header it sticks. While stuck it becomes full-bleed: the margin cancels the page gutter, the radius is 0, there are no side and top borders, padding is 10 × 14, and there is a soft bottom shadow. It **collapses**: the search wrapper animates to zero height (`grid-template-rows: 1fr → 0fr`, 0.28 s) and fades out. The topic row and the selected-tags row stay visible.
  2. **Scrolling up while stuck**: the panel stays stuck and **expands**, so the search field slides back in.
  3. **Scrolling down again**: it collapses.
  4. **Back at the top** (the panel no longer stuck): the normal block, expanded.
  - Ignore direction changes smaller than about 6 px. Don't collapse while the tag input has focus, because typing opens the keyboard and the popover.
  - **Set `overflow-anchor: none`** on the scroll container. Otherwise the browser's scroll anchoring compensates for the panel's height change, which reads as a scroll in the opposite direction and makes the panel flicker.
  - Detect "stuck" with an `IntersectionObserver` on a 1 px sentinel placed just before the panel, or by comparing the panel's top with the header's bottom. Use a rAF-throttled scroll listener for the direction. Write `data-stuck` and `data-collapsed` on the panel and style from those.

## Accessibility

- The topic chips and the sort control are toggle groups with `aria-pressed`, or radio semantics.
- The list count uses `aria-live="polite"`.
- Each selected-tag chip has `aria-label="Remove tag {tag}"`.
- Post cards are `<article>` elements, and each title links to `/blog/[slug]`.

## Data notes

- Add `posts.topic`: an enum `technical | software | hobby`, extensible. Add tags as a `tags` table plus `post_tags`, so counts come from a join.
- Topic labels live in messages (`Blog.topics.*`), not in the DB, until topics need to be editable in the admin.

Owner TODOs: real posts. Confirm how Technical and Software differ: currently Technical means hands-on technical deep dives, and Software means team process and engineering practice.
