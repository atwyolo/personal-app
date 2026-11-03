---
tags: [spec, skills]
status: done
date: 2026-11-03
updated: 2026-11-03
---

# Skills Page Design

Status: **done 2026-11-03.** Plan: [[2026-11-03-skills-page]].

Related: [[Skills Page Handoff]] (visual contract), `docs/design/README.md` (site-wide rules), [[Home Page Handoff]], [[Data Model]], [[Rendering Strategy]], [[ADR-0007 Testing]], [[2026-11-03-projects-page-design]].

## Intent

`/[locale]/skills` shows every skill with its level from 1 to 10. It is where "Show all N skills" on Home leads; today that link ends on the 404 page.

Two kinds of visitors, both equally important (owner, 2026-11-03):

1. **A recruiter with a question:** "does he know Docker, and how well?" They need the shortest path: the search field is visible at once, a few letters, and the row with its level.
2. **A curious visitor** who scrolls through the list. The strongest skills come first, and the domain chips narrow the list to one area.

Success: the recruiter finds any skill in seconds without reading the list; the browser makes no request after the page has loaded.

## Scope

**In:**
- The route with metadata, the hero, the count, the tile with the search, the domain chips and the list.
- `SkillsExplorer`, a client component that filters the server-rendered list.
- Home's "Show all N skills" starts working; nothing on Home changes.

**Out:**
- **URL sync** (`?q=&domain=`, step 4 of the handoff). Nobody is expected to share a filtered view (owner, 2026-11-03).
- **Search by domain name, highlighting of the matched letters** (agreed with the owner, 2026-11-03).
- **Real levels.** Most skills hold the placeholder 6 from the seed; the owner sets real levels separately (handoff's owner TODO). They are public once this ships.
- **The `main` flag** has no effect on this page (handoff).
- **Admin, other locales' content, translating the new UI strings** (`messages/en.json` only, as on the rest of the site).
- **JSON-LD.** The handoff does not ask for it; About already describes the person.

## Decided by the owner

1. **All skills load at once.** The page gets the full list with the HTML; sorting and search happen without the network. The order is computed once, in SQL, while the page is built (`level desc → sort → name`, as the handoff and the existing `getSkills` already do); the client only hides rows and never reorders them. The owner confirmed this reading of "sort locally" on 2026-11-03.
2. **The search applies 300 ms after typing stops** (debounce). The input itself updates on every keystroke; only the query the list is filtered by waits.
3. **Corrections to the design:**
   - No small mono label "Skills" under the Back link; the hero is the Back link, the `h1` and the intro, as on About.
   - No mono label "All skills" above the tile. The count on the right stays alone in that row.
4. **No URL sync** (see Out).
5. **Matching** is a case-insensitive substring of the skill name, as in the handoff ("dock" finds Docker and Docker Compose). The search and the domain combine with AND.

## Data

No schema change. One database step: the seed adds the `skills` row of `meta_pages` with its `en` title and description (see Metadata); `seedMeta` inserts only missing rows, so the owner confirms one `npm run db:seed`.

`getSkills(locale)` in `src/db/queries/home.ts` already exists and is unused: it returns the domains with their localized labels and counts, and every skill with `name`, `level` and domain `key`, in the page's order, cached with `"use cache"`, `cacheLife("max")` and the `skills` tag. The page uses it as is, with two adjustments:

- **Domains without skills are left out** (Claude's call): a chip that can only show the empty state is noise. The admin can create an empty domain, so this is real.
- The type `HomeSkills` is renamed `SkillList`, as `HomeExperience` became `Experience`: it no longer serves Home only (Claude's call).

## Page

Visual contract: [[Skills Page Handoff]] and the site-wide rules of `docs/design/README.md`, including the screens in `docs/design/skills/screens/` and exact values from `prototype.dc.html`. Only the differences and the behavior are here.

**Top to bottom:**
1. `BackLink` to `/`, 30 px below it (site-wide rule).
2. `h1` "Skills" and the intro, styled as on About.
3. The count row: the count alone, right-aligned, mono label style. "41 skills"; while a filter is active, "N of 41". `aria-live="polite"`.
4. The tile: search, the "Domain" label and the chips in the aside (sticky on desktop), the list beside it; on phones, one column (search, chips, rows), as in the handoff.

**Behavior:**
- Typing changes the input at once. The filter applies 300 ms after the last keystroke.
- **Clearing the field applies at once** (Claude's call): the native clear button, `Escape` in Chromium and select-all-delete all mean "show everything again", and a 300 ms wait there only feels slow.
- **A chip click applies at once**; there is nothing to debounce.
- The query is trimmed before matching, so a stray space neither hides everything nor counts as a filter (from the prototype).
- The count reads "N of 41" whenever any filter is active: a query, a chip other than "All", or both (from the prototype).
- **Chip counts follow the applied query** (owner's correction of 2026-11-03, after Claude's first call of static totals): a chip shows how many skills choosing it would list for the query, after the same 300 ms pause; "All" counts every match. A chip with no match stays in place with "0" (Claude's call): chips that vanished would move the row on every letter.
- Empty state: "No skills match “{query}”." in `foreground-soft`, in place of the list. It names the debounced query, the one the list was filtered by. A long query without spaces wraps (`overflow-wrap: anywhere`) instead of widening the page.
- **The filters live only while the visitor is on the page** (owner's decision of 2026-11-03, replacing Claude's first call to keep them). Next keeps a left route mounted under `<Activity>` and runs effect cleanups when it hides it, so the explorer resets the query and the chip there; the page comes back with an empty search, "All" and the full list.
- With JavaScript off, or before hydration, the full sorted list is in the HTML; the search and the chips do nothing until the client component hydrates.

**Corrections after the final review (owner, 2026-11-03):**
- The search text is 16 px below `lg` and the design's 15 px from `lg`: iOS Safari zooms into a field with text under 16 px and stays zoomed.
- A chip's count is `muted-foreground`, not the design's 70% opacity, which gave 3.9:1 in the light theme (WCAG 1.4.3 asks 4.5:1 for 12 px). The pressed chip keeps 70% of `selected-foreground`, well above it.
- The search input has `outline-hidden`, so forced colors show its focus.

**The panel on phones (owner's request, 2026-11-03):**
- Below `lg` the search and the chips stick under the 64 px header, across the tile's inner width, on the tile's color, with a 1 px line under them while stuck.
- Once stuck, 10 px of scrolling down folds the panel: the search slides under the header and the chips stay 8 px below it; 10 px up unfolds it. Only the sticky `top` moves (64 px → 2 px), so the list never moves. Whether the panel is stuck is measured against `--stick-top`, the unfolded offset: Safari reports a transitioning `top` at its end value. The rubber band at either end of the page is ignored; the panel never folds while the search has focus or while it is not stuck. Reduced motion: no transition.
- The chips are always one swipeable row on phones (owner's choice over wrapping until stuck), with a 32 px fade at each edge that still has chips beyond it. From `lg` they wrap in the aside as before.

**Accessibility** (from the handoff):
- The search sits in a `<search>` landmark with a visually hidden label "Search skills".
- Each row is a `meter` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a label "React: level 9 of 10" (`SkillRow` already does this).
- The chips are a single-select toggle group; exactly one is always pressed ("All" by default).
- The count is announced politely; the debounce also keeps a screen reader from hearing a new count after every letter.

**Structure** (adapted FSD):
- `src/app/[locale]/skills/page.tsx`: route, re-exports the view and its metadata, with the one-line rendering comment.
- `src/views/skills/SkillsPage.tsx`, `src/views/skills/metadata.ts`.
- `src/widgets/skills/Skills.tsx`: Server Component; reads `getSkills` and passes the data to the explorer as props.
- `src/widgets/skills/ui/SkillsExplorer.tsx`: the client leaf with the count row, the tile, the search, the chips and the list; pure filtering in `src/widgets/skills/lib/filter-skills.ts`. In the widget, not in `features` (changed while planning): it renders `SkillRow`, a feature, and slices of one layer may not import each other.
- `src/shared/lib/useDebouncedValue.ts`: a generic hook, as `useScrollHold` is generic.
- `src/shared/ui/PageHero.tsx` (Claude's call): Back link, `h1`, intro. `AboutHero` and the Skills page are identical in structure, and Blog and Contact will need the same. About moves to it, so the hero is defined once. It is a plain component that takes `backLabel`, `title` and `intro` as props, as `BackLink` takes its label: `shared` does not read messages. `AboutHero` stays the async widget that reads `About` and `Common` and renders `PageHero`; the About tests and `e2e/about.spec.ts` must stay green.
- The search field and the chips are built on shadcn `input` and `toggle-group` (Base UI), wrapped in `src/shared/ui` adapters (Claude's call). The toggle group gives the keyboard behavior for free: one Tab stop for the group, arrows inside it. The alternative, plain `<button aria-pressed>`, needs no new components but gives one Tab stop per chip and its own focus handling.
- `SkillRow` keeps its markup and its `meter` semantics. Its two strings, `level` and `levelAria`, move from `Home.skills` to their own namespace, since two pages use them now (Claude's call).
- **`SkillRow` gains a layout variant for this page** (Claude's call, because the handoff is the visual contract). Below `lg`, the Skills handoff puts the name and "n/10" on the first line and the bar under them at full width; Home puts the name alone on the first line and the bar with "n/10" on the second. From `lg` the columns are `132px | 1fr | 40px` here and `150px | 1fr | 44px` on Home. Home does not change. The variant is CSS placement in the grid, not new markup; how exactly is left to the builder.

**Rendering:** static per locale, as Home and Projects: every read is a `"use cache"` function, so the page joins the static shell at build time, and an admin edit refreshes it through the `skills` tag. This replaces "static now, ISR once it reads the DB" in `docs/design/README.md`.

**Metadata** (changed 2026-11-03 by [[2026-11-03-meta-tables-design]]): a `meta_pages` row `skills` with its `en` title `Skills — Mikhail Aleksandrov` and description "Every technology I work with as a frontend engineer, rated from 1 to 10: frameworks, tools and the core of the web." (Claude's draft, the owner may reword), added by the seed; `skills` joins the `PageKey` type, and `src/views/skills/metadata.ts` reads it as the other pages do (`getPageMeta`, `getSiteMeta`, `buildPageMetadata`, alternates of `/skills`).

**Messages (`messages/en.json`):** a `SkillsPage` namespace from `docs/design/shared/messages.en.json`, without `label`, `sectionLabel` and `categories` (domain names are data; only "All" stays a message). No `metaTitle` or `metaDescription`: metadata lives in the database. `back` comes from `Common`.

## Tests

[[ADR-0007 Testing]]. The database is the production one; tests only read.

- **Vitest:** `filter-skills` (case, substring, AND with a domain, empty query); `useDebouncedValue` with fake timers (waits 300 ms, restarts on each change, an empty value applies at once); `SkillsExplorer` (typing then advancing timers filters the rows, the count text and its live region, chip switching, the empty state, the order never changes); `PageHero`.
- **Playwright** against the production build: the page lists every skill from the database in order; typing filters only after the pause; a chip filters; the empty state; Home's "Show all N skills" leads here; the layout at 360 px and at desktop width; Home's skill rows unchanged after the `SkillRow` variant and the message move; About unchanged after `PageHero`.
- Definition of done for every step: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Documents to update when the page is done

- [[Roadmap]]: a line for the Skills page, as for About and Projects.
- [[Open Questions]]: the Skills page question is answered.
- [[Rendering Strategy]]: a row for `/[locale]/skills`.
- `docs/design/README.md`: the Skills row's rendering.
- [[Skills Page Handoff]]: a note pointing to this spec for the corrections.

## Left to the builder

- Exact sizes, gaps and colors from the handoff and the prototype.
- How `SkillRow` takes its column widths on this page.
- The `<search>` element's exact markup and the icon inside the input.
- Step order inside the plan.
