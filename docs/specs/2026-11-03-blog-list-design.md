---
tags: [spec, blog]
status: done
date: 2026-11-03
updated: 2026-11-03
---

# Blog List Design

Status: **done 2026-11-04.** Plan: [[2026-11-03-blog-list]], whose "Rulings while building" record every change made while building. The first of two Stage 4 specs (owner, 2026-11-03): this one covers the data changes and the list `/[locale]/blog`; the second covers the post page `/[locale]/blog/[slug]` and the view counter.

Related: [[Blog Page Handoff]] (visual contract, with its "Overrides" section), `docs/design/README.md` (site-wide rules), [[2026-11-03-skills-page-design]] (the filter panel's behavior), [[Data Model]], [[Rendering Strategy]], [[ADR-0007 Testing]], [[Roadmap]].

## Intent

`/[locale]/blog` lists every published post with a topic filter, a tag filter, date sorting and pagination. Home's "All posts" leads here; today that link ends on the 404 page.

The list will grow: unlike the skills, posts are not all sent with the page. Filtering, sorting and paging happen on the server, and the whole state lives in the URL, so any view of the list can be shared, bookmarked and opened again in the same state (owner, 2026-11-03).

Success: a shared link opens in its state at once, with no flash of the default list; every control works as a plain link before hydration; Back in the browser walks through the states the visitor went through.

## Scope

**In:**
- Data: `post_translations.excerpt` → `content_short` (plain text), `body` → `content_full`; eight more demo posts; Home's cards read `content_short`.
- The route with metadata, the hero, the filter panel (topics, tag search, selected tags), the list header (count, sort), the cards, the empty state, pagination and the page-size control.
- Deep links: parsing, validation, fallback, history.

**Out:**
- The post page, `content_full`'s content, read time, JSON-LD, the view counter: the second spec.
- New `RichText` marks or nodes (the Rich text stage).
- Admin, other locales' content, translating the new UI strings (`messages/en.json` only, as on the rest of the site).
- A sitemap (Stage 8).

## Decided by the owner (2026-11-03)

1. **Rendering:** a static shell plus a list rendered on the server from `searchParams`; no Route Handler for the list (option B over "static page + `GET` Route Handler"). No time-based revalidation: data reads are `"use cache"` with tags, refreshed by `updateTag` from the admin.
2. **Deep links.** Topic, tags, sort, page and page size live in the query string in a readable form.
3. **Restore all or nothing.** A link whose state can be restored completely opens in that state. Any link that cannot be restored completely opens the default state (all topics, no tags, newest first, page 1, 10 per page), and the address is replaced with the clean `/[locale]/blog`, silently, with no notice.
4. **Unknown parameters are ignored** (`utm_*`, `fbclid`, ...): they neither break a link nor count as state. A valid combination with no posts is valid: it shows the empty state.
5. **History:** every change of the state adds a history entry (topic, a tag added or removed, sort, page, page size). The only `replace` is the fallback of point 3, so Back never returns to a broken address. The page's "‹ Back" link still leads to `/`.
6. **Changing topic, tags, sort or page size resets the page to 1.**
7. **Loading:** on a first visit the panel and the list hold skeletons until they stream in. Once a list is shown, a change keeps the old list in place, slightly dimmed, until the new one replaces it at once. **While a change is pending, further clicks on the controls are ignored** (owner, after the builder check); nothing is shown optimistically: the clicked chip or tag shows its new state with the server's answer.
8. **Counts are faceted and follow every request.** Each filter's counts apply all the other filters but not itself:
   - a topic chip counts the posts of that topic that match the selected tags; "All" counts the posts that match the selected tags in every topic;
   - a tag's count (in the suggestions) counts the posts with that tag in the selected topic.
   A topic whose count drops to 0 stays in place with "0".
9. **Topics with no published posts at all are hidden** (as empty domains on Skills). The handoff's "Hobby posts are coming soon." hint goes; the empty state has one hint, "Try another topic or tag.".
10. **Tags in the URL are written as stored**, matched exactly and case-sensitively (the owner first asked for a slug column, then withdrew it). The data model of tags does not change.
11. **The filter panel behaves as on Skills**, on desktop and on phones, with its folding mechanism: only the sticky `top` moves, so the list never moves. This needs the tag search at the top of the panel, so the order is **search → topics → selected tags** (owner, after the builder check, over the handoff's order with the search last; see Page).
12. **Pagination** under the list, the look of MUI's "Rounded pagination" without borders, in the site's tokens: square buttons with rounded corners, the current page filled. 10 posts per page by default.
13. **Page size:** "10 | 20 | 50", bottom right of the pagination row (below it on phones), all three visible at once, in the same square style as the pagination.
14. **Demo posts:** eight more (eleven in all), text repeated from the three existing ones; see Data.

## URL

```
/en/blog                                              default state
/en/blog?topic=technical
/en/blog?topic=technical&tags=React,Team%20process&sort=oldest&page=2&per=20
```

| Parameter | Values | Default (never written) |
|---|---|---|
| `topic` | a topic's `key` | all topics |
| `tags` | tags as stored, comma-separated, in selection order | none |
| `sort` | `newest`, `oldest` | `newest` |
| `page` | integer ≥ 1 | `1` |
| `per` | `10`, `20`, `50` | `10` |

- **Defaults are never written,** so each state has exactly one address (Claude's call): `?page=1&sort=newest` is never produced. A link that spells out a default (`?page=1`) is still valid and opens; the address is not rewritten.
- **The query string is built by our own function, not `URLSearchParams.toString()`,** which encodes commas as `%2C` (Claude's call). Values go through `encodeURIComponent`, with commas between tags left as they are. Parameters are written in the table's order.
- A tag that contains a comma cannot be written; none exists. The admin's tag schema will forbid commas (Stage 6).
- Repeated or empty values are invalid: `tags=React,React`, `tags=`, `page=0`, `page=1.5`, `per=30`, `sort=asc`, two `topic` parameters.

**Restorable** means all of these hold:
1. The shape is valid (one Zod schema in `src/schemas/`, used on the server).
2. `topic`, if present, is a visible topic (one with published posts) in this locale.
3. Every tag in `tags` belongs to at least one published post in this locale.
4. `page` is at most the page count for the filters and the page size. A filter combination with no posts has one page (the empty state), so only `page=1` is valid for it.

Otherwise the state is the default, and a small client component replaces the address with `/[locale]/blog` (`router.replace`, `scroll: false`). A server `redirect()` is not used: inside a streamed `<Suspense>` boundary it becomes an extra client navigation (Claude's call).

**Locale switch:** the locale menu replaces the path without the query, so switching the language lands on the default list in the new locale (Claude's call: keep the current behavior). Topics are locale-independent, but tags are per locale, and the switcher would otherwise need to know about the blog.

## Data

### Rename and retype (one-off, owner confirms the exact SQL first)

`post_translations`:
- `excerpt jsonb` → `content_short text`. The value becomes the plain text of the current document (each `en` row holds one paragraph of plain text today; the builder checks that every row has this shape before running, and stops if one does not). Required in `en`.
- `body jsonb` → `content_full jsonb`, nullable, unchanged otherwise. Filled with the design's demo article by the second spec.
- The check `post_translations_en_complete` is recreated with `content_short` in place of `excerpt`.

**In place, as the first step of the plan** (owner, after the builder check, over an expand/contract sequence). Until this branch is merged, code on `main`, `develop` and other branches reads columns that no longer exist, so their builds and previews fail; the deployed site keeps working (Home is static). The owner accepted this window: builds outside this branch do not matter now. ADR-0002's "prefer additive changes" is set aside for this one change.

`drizzle-kit push` cannot tell a rename from a drop plus an add, and a cast of `jsonb` to `text` would store the serialized JSON. So, as with `description_short` ([[ADR-0002 Database and ORM]]), the change runs as one transaction of hand-written SQL with `USING`, shown to the owner first; afterwards `push` must show no change for these columns. Playwright may write to the database now ([[ADR-0007 Testing]]), but this step is not a test: it changes production data and needs the owner's confirmation.

The Drizzle schema, the seed and every reader move to the new names. `RichTextDoc` stays the type of `content_full`.

### Eight more demo posts

In `src/db/seed/data.ts`, beside the three existing posts:
- Slugs `demo-post-4` … `demo-post-11`; titles and `content_short` repeated from the three posts in turn (allowed by the owner).
- Distinct `published_at` dates, two to three weeks apart, going back from August 2026, so sorting is visible.
- Topics: Technical and Software, about evenly; **Hobby keeps no posts**, so the page shows a hidden topic.
- Tags from one pool (`React`, `Next.js`, `TypeScript`, `Testing`, `Jest`, `SEO`, `Team process` and a few more), so counts range from 1 to 5–6.
- Status `published`, `en` translations only, as the existing posts. No covers: the Blob store holds no post images, so the card shows `Image`'s placeholder (this corrects Claude's earlier "some with covers"; real covers come with real posts).

The existing database already holds content, and `seedContent` fills only an empty database. A new seed step inserts the posts whose slug is missing, with their `en` translations, as `seedExperienceDetails` and `seedAboutPairs` add to a filled database; the owner confirms one `npm run db:seed`.

With eleven posts: 10 per page gives two pages, the second with one post; 20 and 50 give one page.

### Reads

New `src/db/queries/blog.ts`. Every read is `"use cache"` with `cacheLife("max")` and the tags `posts` and `post-topics`; localized fields fall back to `en` as in `getLatestPosts`, tags included (a post's tags are its translation's tags, or the `en` tags when the translation has none).

**Only a restorable state reaches a cached read with filter arguments** (Claude's call). Cached functions are keyed by their arguments; validating against the database first keeps an arbitrary URL from creating cache entries. The order:
1. A catalog read per locale: the visible topics, every tag of published posts, and the total number of published posts. Checks 2 and 3 above run against it.
2. A facets read per (locale, topic, tags): the topic counts, the tag counts, and the number of matching posts, which gives the page count for check 4.
3. A page read per (locale, topic, tags, sort, page, per): the cards of that page.

Matching: topic equals (or all) **and** (no tags, or the post has **any** of the selected tags), as in the handoff's filtering rules. `newest` is `published_at desc`, `oldest` is `published_at asc`; ties break by `id` so pages never overlap. How the SQL is written (array operators, `unnest`, a GIN index or none for eleven posts) is left to the builder.

## Page

Visual contract: [[Blog Page Handoff]] and the site-wide rules of `docs/design/README.md`, including `docs/design/blog/screens/` and exact values from `prototype.dc.html`. Only the differences and the behavior are here.

**Top to bottom:**
1. `PageHero`: `BackLink` to `/`, `h1` "Blog", the intro (Claude's call: no mono label "Blog" above the title, as on About and Skills, which dropped theirs).
2. Desktop: the grid `260px | 1fr`. The filter panel in the aside, sticky as on Skills; the main column with the list header, the cards and the pagination row.
3. Phone: one column; the panel, the list header, the cards, the pagination row.

**The filter panel**, top to bottom, on every width (decision 11):
- **The tag search** at the top. Its label is visually hidden ("Search by tag"), as the Skills search.
- **Topic:** a mono label (desktop), then single-select chips with counts: "All" first, then the visible topics in their `sort` order. The active chip uses `selected`.
- **Selected tags** under the topics. On desktop the handoff's "Tags" label moves here, above the chips, so the panel reads search, topics, selected tags at every width (Claude's call: one DOM order for both layouts keeps the reading and focus order equal to the visual one, WCAG 1.3.2 and 2.4.3; the alternative, the handoff's order on desktop with CSS `order` on phones, splits them).
- **The tag search** is a combobox, as the handoff describes: suggestions while typing, tags containing the query (case-insensitive), already selected tags excluded, each with its faceted count; a tag whose count is 0 in the selected topic is left out of the suggestions (Claude's call: picking it adds no post, since tags combine with "any"; unlike the topic row, the suggestions are a filtered list with no layout to keep, and such a tag stays valid in a URL); ↑ ↓, Enter, Esc; "No matching tags". The suggestions come with the server's answer, so typing makes no request. Picking a tag adds it (a new URL), clears the field and closes the popover. Built on shadcn `combobox` (Base UI) if it fits, as the handoff suggests; otherwise the ARIA combobox pattern it lists.
- **Selected tags:** chips with a "×" (`aria-label` "Remove tag {tag}") and a Reset link that removes all tags; the row exists only while a tag is selected.

**On phones the panel behaves as the Skills panel** ([[2026-11-03-skills-page-design]], "The panel on phones"): sticky under the 64 px header; scrolling down folds it by moving only its sticky `top`, so the search slides under the header and the topic chips and the selected tags stay visible; scrolling up unfolds it; the topic chips are one swipeable row with edge fades. The panel never folds while the tag search has focus. Whether Skills' implementation (`useIsStuck`, `useHideOnScroll`, the `--stick-top` property) is shared or adapted is left to the builder.

**The list header:** the count on the left, `aria-live="polite"`: "11 posts" in the default state, "3 of 11 posts" whenever a filter is active (handoff strings). The page number is not repeated there (Claude's call): the pagination shows it. The sort control "Newest | Oldest" on the right, as in the handoff.

**Cards** as in the handoff (desktop `220px | 1fr`, phone cover on top). The text is `content_short`. Each tag on a card toggles that tag in the selection; selected tags are filled with `brand`. The title links to `/blog/[slug]`, which ends on the 404 page until the second spec. How the list card relates to Home's `PostCard` (a variant or its own feature) is left to the builder; Home's cards must not change visibly.

**Empty state** (handoff): a dashed block, "No posts here yet", "Try another topic or tag.", and "Reset filters", a link to the default state.

**The pagination row:**
- Shown only when there is more than one page (Claude's call). The page-size control is shown whenever there are more posts than the smallest page size, so with one page of 11 posts at 20 the visitor can still go back to 10 (Claude's call).
- Built on shadcn `pagination` in `src/shared/shadcn`, wrapped by a `src/shared/ui` adapter that renders `next/link` and takes translated labels as props; shadcn's hard-coded English strings are not used.
- The numbers follow MUI's rule: one sibling on each side of the current page, one boundary page at each end, ellipses between, and a constant number of items, so the row keeps its width (`1 2 3 4 5 … 12`, `1 … 5 6 7 … 12`, `1 … 8 9 10 11 12`). A pure function, built test-first.
- Previous and next are chevrons without text, with translated `aria-label`s; at the first and the last page they are inactive (not links).
- Item size: 32 px from `lg` as in MUI, 40 px below `lg` for touch (Claude's call; WCAG 2.5.8 asks 24 px, Apple's guideline is 44).
- "10 | 20 | 50" uses the same squares; the active size is filled.

**Every control is a link to its state** (Claude's call): the topic chips, the sort segments, the tags on cards, the selected tags' "×" and Reset, "Reset filters", the page numbers and the page sizes are `<a href>` built on the server with the URL function. They work before hydration and without JavaScript, open in a new tab, and are crawlable. The current item carries `aria-current` (`page` for the pagination, `true` for the others). The tag search, which needs typing, is the only control that navigates with `router.push`.

**Navigation and loading:**
- Every state change is a client navigation that adds a history entry, with `scroll: false`.
- **One pending flag for the whole list:** while any control's navigation is pending, the list, its header and the pagination row are dimmed and carry `aria-busy="true"`, and every control ignores clicks (decision 7). The controls are not made `inert` or `disabled`: that would drop the focus from the clicked control to the page (Claude's call). They keep their look with `cursor: progress`; the tag search stays typeable, but picking a suggestion waits too. Navigations are React transitions, so an already shown `<Suspense>` boundary keeps the old list instead of returning to its fallback. Plain links do not expose a shared pending flag (`useLinkStatus` is per link), so the controls need one client wrapper that runs the navigation in `startTransition`; a click with a modifier key, or a middle click, is left to the browser. How exactly is left to the builder.
- After a change of page or page size, the view scrolls to the list header and moves focus to it (`tabIndex={-1}`), so a screen reader hears the new state. Other changes keep the scroll position and the focus.
- The skeleton is the fallback of one `<Suspense>` boundary around the panel's content and the list (Claude's call: both depend on the URL, and one boundary reveals them together): the search field, the "Topic" label with skeleton chips, the list header, three skeleton cards and no pagination, sized like the real ones so nothing jumps. With `prefers-reduced-motion` it does not pulse.

**Accessibility** (handoff plus the above): the topic chips and the sort are groups of links with `aria-current`; the count is announced politely; the pagination is a `<nav>` with a translated label; each card is an `<article>`.

**Structure** (adapted FSD; the builder may refine it while planning):
- `src/app/[locale]/blog/page.tsx`: the route, re-exports the view and its metadata, with the one-line rendering comment ("static shell + dynamic list from `searchParams`").
- `src/views/blog/BlogPage.tsx`, `src/views/blog/metadata.ts`.
- `src/schemas/blog-list.ts` (name for the builder): the Zod schema of the query, the default state, and the function that builds a URL from a state. Shared by the server and the client.
- `src/db/queries/blog.ts`: the three reads.
- A widget for the list; Home's `src/widgets/blog` stays Home's block (it may be renamed, e.g. `home-blog`, if the builder prefers).
- Generic pieces in `src/shared/ui` and `src/shared/lib`: the pagination adapter, the page-range function.

**Rendering:** the static shell holds the hero, the panel's frame and the skeletons; the list region reads `searchParams` inside `<Suspense>`, as in the Next 16 guide `optimizing-the-static-shell.md`. The page has no `loading.tsx`. This replaces "ISR" for the blog in `docs/design/README.md` and [[Rendering Strategy]] (already done).

**Metadata:** a `meta_pages` row `blog`, added by the seed, with the `en` title `Blog — Mikhail Aleksandrov` and the description "Notes on frontend engineering, software teams and things I do for fun." (the handoff's intro; the owner may reword); `blog` joins the `PageKey` type. One title and description for every state of the list (Claude's call). The canonical URL is the clean `/[locale]/blog`; the alternates are `/blog` per locale.

**Messages (`messages/en.json`):** a `BlogPage` namespace from the handoff's `Blog` namespace, without `metaTitle`, `label`, `topics` other than `all` (topic names are data) and `emptyHobby`. New strings: the pagination's label, "Go to page {page}", "Previous page", "Next page", and the page-size label ("Posts per page"). `back` comes from `Common`. Home's `Home.blog` strings stay.

## Tests

[[ADR-0007 Testing]]. Playwright may write to the database during development; nothing here needs to.

- **Vitest:** the query schema and the URL function (every invalid case in the URL section, defaults omitted, commas not encoded, spaces and non-ASCII encoded, the parameter order, a round trip); the page-range function (the three shapes above, small counts with no ellipsis, one page); the pagination adapter (links, `aria-current`, inactive ends, labels); the tag combobox (filtering suggestions, excluded selected tags, keyboard, empty message); the pending dimming wrapper.
- **Playwright** against the production build:
  - the default list: count, order, 10 cards and two pages;
  - each control changes the URL and the list: topic, a tag from the search, a tag on a card, "×", Reset, sort, page, page size; the page resets to 1 on a filter change;
  - faceted counts after choosing a tag; Hobby is not shown;
  - a full deep link opens in its state; partly invalid links (an unknown topic, one unknown tag of two, `page=3`, `per=30`) open the default and end on `/en/blog`; `utm_source` is ignored;
  - Back walks the states and does not return to a replaced address;
  - the empty state and "Reset filters";
  - the controls are links before hydration (their `href`s);
  - the phone panel at 390 px: sticks, folds, the chip row scrolls;
  - Home: the cards still show their text, now from `content_short`; "All posts" leads here.
- Definition of done for every step: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Documents to update when the list is done

- [[Roadmap]]: a line for the Blog list; Stage 4 stays open until the second spec.
- [[Data Model]]: `content_short` and `content_full` applied; drop "not applied yet".
- [[Rendering Strategy]]: the blog row as built.
- [[Open Questions]]: the tag suggestions question is answered (they come with the server's answer).
- [[Blog Page Handoff]]: point its "Overrides" to this spec.

## Left to the builder

- Exact sizes, gaps and colors from the handoff and the prototype; the pagination's and the page-size control's colors from the tokens (`selected` for the filled item).
- The SQL of the three reads and whether an index helps.
- Sharing or adapting the Skills panel's code.
- The client wrapper behind the shared pending flag.
- Whether the list card is a `PostCard` variant.
- Step order inside the plan.
