---
tags: [plan, skills]
status: done
date: 2026-11-03
updated: 2026-11-03
---

# Plan: Skills page

Build `/[locale]/skills`: every skill in the HTML, a client explorer that filters it with a debounced search and domain chips. The metadata row first, then the shared pieces, then the explorer, then the page. The checklist in this note is the ledger: a task is ticked when its delta is staged.

Related: [[2026-11-03-skills-page-design]] (the spec, read it with this plan), [[Skills Page Handoff]], [[ADR-0014 Metadata in the Database]], [[ADR-0007 Testing]].

## Global constraints

- **Stages, not commits.** Every task ends with `git add`. The owner commits.
- **Inline, one task at a time.** Discuss in Russian before a task when something is unclear.
- **TDD** for logic and client components with Vitest. Database-backed output is verified with Playwright, which never writes to the database.
- **Production database:** the exact command is shown to the owner and confirmed before every write.
- **Definition of done for a task:** `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- **Conventions from `CLAUDE.md`:** `FC<Props>` arrow components with named exports, props destructured on the first line, hooks typed `Use<Name>Params` / `Use<Name>`, PascalCase files with JSX, no barrels, Server Components by default, English in the repository, boundaries lint.
- **Visual values** come from [[Skills Page Handoff]], `docs/design/README.md` and `docs/design/skills/prototype.dc.html`, except where the spec overrides them.
- **Next.js / Base UI:** read the installed docs before first use: `node_modules/next/dist/docs/` for the route, the shadcn `toggle-group` source and `@base-ui/react` toggle group types for the chips.

## Decisions made while planning

- **The explorer lives in the widget, not in `features`** (Claude's call; the spec said `src/features/skills-explorer/`). It renders `SkillRow`, which is a feature, and slices of one layer may not import each other. So: `src/widgets/skills/ui/SkillsExplorer.tsx` (`"use client"`) and `src/widgets/skills/lib/filter-skills.ts`, as Projects keeps its parts in `ui/`. Alternatives: move `SkillRow` to `shared/ui` (it reads messages, which `shared` does not), or let the explorer take server-rendered rows as children and hide them by index (couples markup and data by position).
- **The hero is composed in the view:** `SkillsPage` reads `SkillsPage` and `Common` messages and renders `PageHero` and the widget. A one-component widget for a hero adds nothing.
- **Single-select chips that cannot be emptied:** Base UI's toggle group lets a pressed item be unpressed; the adapter ignores a change to "nothing pressed", so exactly one chip stays pressed.
- **Message namespace of `SkillRow`:** `SkillRow` (`level`, `levelAria`).

## Rulings while building

- **Tasks 1–2:** one definition-of-done run for both. The first run of Task 1 failed in `build` and `e2e` because Task 2's test file was written while it ran (`Cannot find module './PageHero'` in the type check); the code of Task 1 was not involved. The rerun on both tasks passed. If wrong: none, the second run covers both deltas.

- **Task 4:** the `SearchField` unit test checks the `<search>` element, not the `search` role: jsdom's role table (`aria-query`) does not map `<search>` yet. The landmark role is checked in a real browser by `e2e/skills.spec.ts`. No explicit `role="search"`: browsers give the element that role already. If wrong: one attribute.
- **Task 4:** the shadcn CLI added `toggle.tsx` with `toggle-group.tsx`; no dependency changed (`package.json` and the lock file compared before and after).

- **Task 5:** the count is `role="status"` with `aria-live="polite"`, and the tests find it by that role instead of a test id: the role is the polite live region the spec asks for, and it is how a screen reader meets it. If wrong: one attribute.
- **Task 5:** the "All" chip's value is `*`, not an empty string: Base UI treats an empty toggle value as missing and gave the chip a generated id, so "All" filtered by a domain that does not exist (the test "filters by a domain at once" caught it with 0 rows). Domain keys are words, so `*` cannot collide. `ChipGroup` documents the rule. If wrong: one constant.
- **Task 5:** the explorer tests use `vi.useFakeTimers({ shouldAdvanceTime: true })`: with a frozen clock, user-event's own pauses never ended and five tests timed out. The 300 ms are still moved by hand; the assertion "unchanged right after typing" relies on typing four letters taking far less than 300 ms of real time. If wrong: a flaky test, never a wrong pass.
- **Task 5:** the aside is sticky at `top: 93px` (the 73 px site header plus the handoff's 20 px), as Projects pins its column at 73 px. If wrong: one class.
- **Task 8:** a `useIsStuck` hook was added (not in the plan's Interfaces): the panel is "stuck" when its top equals its own computed `top`, so the 64 px and 2 px offsets live only in CSS. If wrong: one hook to fold into the explorer.
- **Task 8:** the reduced-motion test checks `transition-property: none`, not `transition-duration: 0s`: `motion-reduce:transition-none` removes the property and leaves the duration, and no property means no transition. A sibling test checks `transition-property: top` without the preference, so the pair fails on either side.
- **Task 8:** the light-theme contrast helper finds the chip's background by walking up to the first opaque ancestor: the new panel is transparent on desktop and had become the "closest `bg-card`".
- **Task 8:** the stuck panel covers the tile's inner width, not the window's (changed from what Claude first proposed to the owner): a full-width bar would grow sideways at the moment it sticks. Reported to the owner.
- **Task 5:** the visible "Domain" label is `aria-hidden` and shown from `lg` only (the phone screens have none); the chip group carries the same name for screen readers.

- **Task 5:** one full e2e run failed `projects.spec.ts` › "recomputes the bars when the phone turns" (mobile): its 5 s predicate timed out. The Projects code was not touched; the test passed 10 of 10 alone and 219 of 219 in three parallel runs of its spec, and the full suite rerun passed 479 of 479. A flaky timing under the full suite's load, left as it is and reported to the owner. If wrong: a real regression on Projects rotation, which the next runs would show again.

- **Task 6:** Lighthouse locally on `/en/skills`: mobile 98, 100, 100; desktop 100, 100, 100 for performance, accessibility and best practices. SEO reads 50 and 54: `is-crawlable` is the site's own `noindex` while `hidden_from_search` is true, the canonical points to `localhost`, and `robots.txt` waits for Stage 8.
- **Task 6:** screenshots of the built page (desktop dark and light at 1120 px, phone dark at 360 px) compared with `docs/design/skills/screens/`: the layout, the chips, the two columns and the phone rows match.

## Review focus

The cases most likely to bite a visitor that no behavior in the spec names. Each has a test in the task that owns the code.

1. **Typing, then clearing before the pause ends:** the cleared field shows everything at once, and the pending query never lands afterwards. Task 3 and Task 5.
2. **Spaces and case:** `"  DOCK "` finds Docker and Docker Compose; a query of spaces alone filters nothing and keeps "41 skills". Task 3.
3. **A query that matches nothing inside a chosen domain:** the empty state names the query, the count reads "0 of N", and choosing "All" brings back the matches of the query in all domains. Task 5.
4. **Leaving and coming back:** the query and the chip survive a trip to Home and back through the navigation, with the list still filtered. Task 6.
5. **360 px:** no horizontal scroll; the chips wrap; a row keeps its name and "n/10" on one line. Task 6.

---

## Tasks

### Task 1: The metadata row

**Files:**
- Modify: `src/db/queries/meta.ts`, `src/db/seed/data.ts`

**Interfaces:**
- Produces: `type PageKey = "home" | "about" | "projects" | "skills"`; a `meta_pages` row `skills` with its `en` texts.

- [x] **Step 1:** add `"skills"` to `PageKey`, and to `data.meta.pages`: `{ key: "skills", title: "Skills — Mikhail Aleksandrov", description: "Every technology I work with as a frontend engineer, rated from 1 to 10: frameworks, tools and the core of the web." }` (owner's approval of the text, 2026-11-03).
- [x] **Step 2: Seed, after the owner confirms.** `npm run db:seed`. Expected: `Seeded metadata: 0 settings row, 0 settings texts, 1 pages, 1 page texts.`
- [x] **Step 3: Read it back** (read-only): the `skills` row and its `en` texts match Step 1; a second `db:seed` inserts nothing.
- [x] **Step 4: Run the definition of done** and stage the task's files.

### Task 2: `PageHero`, and About on it

**Files:**
- Create: `src/shared/ui/PageHero.tsx`, `src/shared/ui/PageHero.test.tsx`
- Modify: `src/widgets/about-hero/AboutHero.tsx`

**Interfaces:**
- Produces: `PageHero: FC<PageHeroProps>`, `interface PageHeroProps { backLabel: string; title: string; intro: string }`. Markup and classes are `AboutHero`'s today: the padding wrapper, `BackLink`, the `h1` and the intro paragraph.

- [x] **Step 1: Write the failing tests:** the `h1` named by `title`; the intro text; the Back link named by `backLabel` and pointing to `/` (as `BackLink.test.tsx` checks it, with its mocks).
- [x] **Step 2: Run them.** `npx vitest run src/shared/ui/PageHero.test.tsx`. Expected: FAIL, the module is missing.
- [x] **Step 3: Implement `PageHero`** by moving the markup out of `AboutHero`; `AboutHero` reads its messages and renders `PageHero`.
- [x] **Step 4: Run them.** Expected: PASS. Run the definition of done (`e2e/about.spec.ts` proves About did not change) and stage the task's files.

### Task 3: Filtering and the debounced value

**Files:**
- Create: `src/shared/lib/useDebouncedValue.ts`, `src/shared/lib/useDebouncedValue.test.ts`, `src/widgets/skills/lib/filter-skills.ts`, `src/widgets/skills/lib/filter-skills.test.ts`
- Modify: `src/db/queries/home.ts`

**Interfaces:**
- Produces:
  - `src/db/queries/home.ts`: `type SkillList = { domains: { key: string; label: string; count: number }[]; skills: { name: string; level: number; domain: string }[] }` (renamed from `HomeSkills`); `getSkills(locale): Promise<SkillList>` leaves out domains with a count of 0.
  - `useDebouncedValue<T>(params: UseDebouncedValueParams<T>): UseDebouncedValue<T>` with `interface UseDebouncedValueParams<T> { value: T; delay: number; isImmediate?: (value: T) => boolean }` and `interface UseDebouncedValue<T> { debouncedValue: T }`.
  - `filterSkills(skills: SkillList["skills"], filter: { query: string; domain: string | null }): SkillList["skills"]`; `domain: null` means all domains.

- [x] **Step 1: Write the failing tests for `filterSkills`:**
  - `"dock"` → Docker and Docker Compose, in their input order;
  - `"  DOCK "` → the same (trimmed, case-insensitive);
  - `"   "` and `""` → every skill;
  - domain `"tools"` with `""` → only the tools; with `"dock"` → only the tools that match;
  - a query matching nothing → `[]`;
  - the output keeps the input order for any filter.
- [x] **Step 2: Write the failing tests for `useDebouncedValue`** with `vi.useFakeTimers()` and `renderHook`:
  - the first value is returned at once;
  - a new value appears only after `delay` ms; at `delay - 1` the old one is still there;
  - each change restarts the wait (three changes 100 ms apart, the last lands 300 ms after the third);
  - with `isImmediate: (v) => v.trim() === ""`, an empty value lands at once, and a pending earlier value never lands after it;
  - unmounting clears the timer (no state update after unmount).
- [x] **Step 3: Run them.** `npx vitest run src/widgets/skills src/shared/lib/useDebouncedValue.test.ts`. Expected: FAIL, the modules are missing.
- [x] **Step 4: Implement both.** The hook keeps a `useState` and one `setTimeout` per change in an effect with a cleanup; an immediate value is set without a timer and cancels the pending one.
- [x] **Step 5: Run them.** Expected: PASS.
- [x] **Step 6: Change `getSkills`** (rename the type; filter out domains whose count is 0, after counting). Run the definition of done and stage the task's files.

### Task 4: Search field and chips adapters

**Files:**
- Create (CLI): `src/shared/shadcn/ui/input.tsx`, `src/shared/shadcn/ui/toggle-group.tsx` (and `toggle.tsx` if the CLI brings it), with `npx shadcn add input toggle-group`; check its output before keeping any new dependency.
- Create: `src/shared/ui/SearchField.tsx`, `src/shared/ui/SearchField.test.tsx`, `src/shared/ui/ChipGroup.tsx`, `src/shared/ui/ChipGroup.test.tsx`

**Interfaces:**
- Produces:
  - `SearchField: FC<SearchFieldProps>`, `interface SearchFieldProps { label: string; value: string; onValueChange: (value: string) => void; className?: string }`: a `<search>` element holding a visually hidden `<label>`, the search icon (`aria-hidden`) and an `<input type="search">`; the 44 px pill of the handoff with its focus ring.
  - `ChipGroup: FC<ChipGroupProps>`, `interface ChipGroupProps { label: string; items: { value: string; label: string; count: number }[]; value: string; onValueChange: (value: string) => void; className?: string }`: a single-select toggle group of filter chips (36 px pills, mono 12 px, the count at 70% opacity, the pressed chip `bg-selected text-selected-foreground`); `label` names the group.

- [x] **Step 1: Install the components** and read their source and the Base UI types (`value`, `onValueChange`, single selection).
- [x] **Step 2: Write the failing tests:**
  - `SearchField`: a `search` landmark; a searchbox named by `label`; typing calls `onValueChange` with the new text;
  - `ChipGroup`: a group named by `label`; each chip a button with `aria-pressed`, only the one matching `value` pressed; the chip's accessible name includes its label and count; clicking another chip calls `onValueChange` with its value; clicking the pressed chip does not call it with an empty value; arrow keys move the focus between chips, and `Tab` leaves the group after one stop.
- [x] **Step 3: Run them.** Expected: FAIL.
- [x] **Step 4: Implement both adapters.**
- [x] **Step 5: Run them.** Expected: PASS. Run the definition of done and stage the task's files.

### Task 5: The explorer

**Files:**
- Create: `src/widgets/skills/ui/SkillsExplorer.tsx`, `src/widgets/skills/ui/SkillsExplorer.test.tsx`
- Modify: `src/features/skill-row/SkillRow.tsx`, `src/features/skill-row/SkillRow.test.tsx`, `messages/en.json`

**Interfaces:**
- Consumes: `SkillList`, `filterSkills`, `useDebouncedValue`, `SearchField`, `ChipGroup`, `SkillRow`.
- Produces:
  - `SkillsExplorer: FC<SkillsExplorerProps>`, `interface SkillsExplorerProps { skills: SkillList["skills"]; domains: SkillList["domains"] }` (`"use client"`).
  - `SkillRow` gains `layout?: "home" | "list"` (default `"home"`, unchanged); `"list"` puts the name and "n/10" on the first line and the bar under them below `lg`, and uses `132px | 1fr | 40px` from `lg`.
  - Messages: new `SkillRow` namespace with `level` and `levelAria` (moved from `Home.skills`); new `SkillsPage` namespace: `title` "Skills", `intro`, `countAll` "{total} skills", `countFiltered` "{shown} of {total}", `search` "Search skills", `domain` "Domain", `all` "All", `noMatch` "No skills match “{query}”." (texts from `docs/design/shared/messages.en.json`).

- [x] **Step 1: Move the `SkillRow` messages** and update `SkillRow.tsx`. Its tests stay green unchanged.
- [x] **Step 2: Write the failing tests** for `SkillsExplorer`, with `NextIntlClientProvider` and fake timers, on a fixture of 5 skills in 3 domains:
  - all rows render as meters in the given order, the count reads "5 skills" in an element with `aria-live="polite"`;
  - typing "dock" leaves all rows until 300 ms pass, then only the matches, and the count reads "2 of 5";
  - typing "dock", then clearing before 300 ms: all rows at once, and still all rows after another 300 ms;
  - choosing a domain chip filters at once and the count reads "N of 5"; "All" brings everything back;
  - a query with no match inside a domain shows "No skills match “xyz”." and "0 of 5", and "All" with the same query shows its matches in all domains;
  - the rows' order never changes under any filter;
  - the chips show the domains' labels and counts, "All" first with the total.
- [x] **Step 3: Run them.** Expected: FAIL, the component is missing.
- [x] **Step 4: Implement `SkillsExplorer`:** the count row, the tile (aside with `SearchField`, the "Domain" label and `ChipGroup`; the list as `<ul>` of `SkillRow layout="list"`), the empty state. Layout and sizes from the handoff; the aside is sticky from `lg`.
- [x] **Step 5: Add the `layout` variant to `SkillRow`** with a unit test that the `"home"` default keeps today's classes and `"list"` sets the list's grid.
- [x] **Step 6: Run them.** Expected: PASS. Run the definition of done (`e2e/home-skills.spec.ts` proves Home did not change) and stage the task's files.

### Task 6: The page

**Files:**
- Create: `src/app/[locale]/skills/page.tsx`, `src/views/skills/SkillsPage.tsx`, `src/views/skills/metadata.ts`, `src/widgets/skills/Skills.tsx`, `e2e/skills.spec.ts`
- Modify: `e2e/metadata.spec.ts`

**Interfaces:**
- Consumes: `getSkills`, `getPageMeta(locale, "skills")`, `getSiteMeta`, `buildPageMetadata`, `PageHero`, `SkillsExplorer`.
- Produces: the route; `Skills: FC` (async Server Component: `getSkills(await getLocale())`, renders `SkillsExplorer`).

- [x] **Step 1: Write the failing e2e tests** in `e2e/skills.spec.ts`, importing from `./fixtures`; they read properties, not names, where the owner edits the data:
  - the hero: Back link to `/en`, the `h1` "Skills", the intro; no "All skills" label and no small "Skills" label;
  - every row is a meter; the levels never rise down the list; the count reads "N skills" with N equal to the number of rows and to Home's "Show all N skills";
  - Home's "Show all N skills" leads here;
  - typing the first three letters of the first skill's name: the list is unchanged before 300 ms (checked at once after typing) and filtered after; clearing shows every row;
  - a domain chip filters to its count, "All" restores the list;
  - a query that matches nothing shows the empty state;
  - leaving to Home through the navigation and coming back keeps the query and the filtered list;
  - at 360 px: no horizontal scroll, every chip inside the viewport, a row's name and "n/10" share a line;
  - at desktop width: two list columns, the aside sticky while the list scrolls;
  - `/ru/skills` renders under `lang="ru"` with the English labels.
  In `e2e/metadata.spec.ts`, add `{ locale: "en", key: "skills", path: "/skills" }` to `pages`.
- [x] **Step 2: Run them.** Expected: FAIL, `/en/skills` is a 404.
- [x] **Step 3: Implement** the route (one-line rendering comment: static, cached reads), the view (`PageHero` from messages, then `Skills`), the metadata (as `src/views/projects/metadata.ts` with `"skills"` and `/skills`), and the widget.
- [x] **Step 4: Run them.** Expected: PASS. Lighthouse locally on `/en/skills` (mobile and desktop) and report the numbers.
- [x] **Step 5: Run the definition of done** and stage the task's files.

### Task 7: Documents

**Files:**
- Modify: `docs/project/Roadmap.md`, `docs/architecture/Rendering Strategy.md`, `docs/architecture/Data Model.md`, `docs/design/README.md`, `docs/design/Skills Page Handoff.md`, `docs/specs/2026-11-03-skills-page-design.md`, `docs/Home.md`, `docs/journal/2026-11-03.md`, this plan

- [x] **Step 1:** Roadmap (Skills page done), Rendering Strategy (a row for `/[locale]/skills`), Data Model (`skills` in the `meta_pages` keys), design README (the Skills row's rendering: static, DB-backed), the handoff (a note pointing to the spec's corrections), the spec (status, and the explorer's place in the widget), `Home.md`, the journal, the plan's status.
- [x] **Step 2: Stage** the documents.

### Task 8: The sticky panel on phones (owner's request after the review)

Below `lg` the filter panel sticks under the header, as the aside does on desktop. Once stuck, scrolling down slides the search away and leaves the chips; scrolling up brings the search back. On phones the chips are always one swipeable row with a fade at the edge that still has chips beyond it (owner chose this over wrapping until stuck: the switch would change the panel's height and move the list).

**Files:**
- Create: `src/shared/lib/hide-on-scroll.ts`, `src/shared/lib/hide-on-scroll.test.ts`, `src/shared/lib/useHideOnScroll.ts`, `src/shared/ui/ScrollFade.tsx`, `src/shared/ui/ScrollFade.test.tsx`
- Modify: `src/shared/ui/ChipGroup.tsx`, `src/widgets/skills/ui/SkillsExplorer.tsx`, `e2e/skills.spec.ts`

**Interfaces:**
- `nextHideState(state: HideState, y: number, maxY: number, threshold: number): HideState` with `interface HideState { hidden: boolean; lastY: number; travel: number }`: `travel` sums the distance in the current direction and starts over when the direction turns; `hidden` turns true past `+threshold` and false past `-threshold`; a `y` outside `0..maxY` (iOS rubber band) changes nothing.
- `useHideOnScroll(params: UseHideOnScrollParams): UseHideOnScroll` with `{ threshold: number }` → `{ hidden: boolean }`, reading `window.scrollY` once per frame.
- `ScrollFade: FC<ScrollFadeProps>` with `{ children: ReactNode; className?: string }`: a horizontal scroller below `lg` that sets `data-fade-start` / `data-fade-end` while there is content beyond that edge and masks that edge with a gradient; nothing from `lg`.
- The panel carries `data-stuck` and `data-collapsed`; collapsed below `lg` means `top: 8px` instead of `64px`, so the search (44 px + 12 px gap) slides under the header while the panel's height in the flow stays the same.

**Decisions (Claude's calls, reported to the owner):**
- The panel's height never changes; only its sticky `top` moves. A change of height would move the list, the browser's scroll anchoring would move the page, and that would read as a scroll and could loop.
- 10 px of travel before a change; the rubber band at both ends is ignored.
- No collapse while the search has focus (the keyboard is open), and none while the panel is not stuck.
- Reduced motion: no transition.
- The stuck panel covers the tile's inner width, not the window's: a full-width bar would have to grow sideways at the moment it sticks.

- [x] **Step 1: Failing unit tests** for `nextHideState` (down past the threshold hides, up past it shows, 9 px of jitter changes nothing, a turn starts the travel over, `y < 0` and `y > maxY` change nothing) and for `ScrollFade` (with `scrollWidth`/`clientWidth`/`scrollLeft` defined on the element: overflowing at the start → only `data-fade-end`; scrolled to the middle → both; at the end → only `data-fade-start`; no overflow → neither).
- [x] **Step 2: Failing e2e tests** (mobile project): the chips share one line and the row scrolls sideways, with `data-fade-end` at first and `data-fade-start` only after a swipe to the end; the page still has no sideways scroll at 360 px; scrolling down past the panel keeps the chips right under the header and hides the search behind it; scrolling up shows the search again; 5 px down changes nothing; with the search focused, scrolling down keeps it visible; at the top of the page the panel is open. Desktop: the chips still wrap, the aside still sticks at 93 px.
- [x] **Step 3: Implement** the pure function, the hook, `ScrollFade`, the chips row and the panel.
- [x] **Step 4: Run the definition of done**, compare screenshots at 360 px, and stage.

## Final review

A fresh reviewer read the whole staged diff: no Critical, three Important, five Minor; "Ready to merge: With fixes". It confirmed the static prerender of all eight `/xx/skills`, the HTML without JavaScript, the FSD boundaries and the five Review focus cases.

- Final: fixed (Important): the search input kept shadcn's `outline-none`, so forced colors showed no focus. `outline-hidden` now — "shows the focus of the search in forced colors" RED ("Received: none") → GREEN.
- Final: fixed (Important, owner chose A): iOS Safari zooms into a field under 16 px. The search text is 16 px below `lg`, 15 px from `lg` — "keeps the search text at 16 px" RED → GREEN; "keeps the design's 15 px search text on desktop" guards the desktop.
- Final: fixed (Important, owner chose A): the chip count at 70% opacity gave 3.86:1 (3.41:1 under the pointer) in the light theme. It is `muted-foreground` now, the pressed chip keeps 70% of `selected-foreground` — "keeps the chip counts readable in the light theme" RED ("Received: 3.86") → GREEN.
- Final: fixed (owner's request): a long query without spaces widened the page at 360 px — "wraps a long query in the empty state" RED → GREEN.
- Final: changed (owner's decision): the filters reset when the page is hidden, instead of surviving a trip away. The reset sits in a layout effect's cleanup: `<Activity>` runs cleanups when it hides the route, and the React Compiler's `set-state-in-effect` rule forbids the reset in the effect body — "starts over with an empty search and the full list" RED → GREEN.
- Final: changed (owner's bug report): chip counts were static totals (Claude's call in the spec); they follow the applied query now, and a chip with no match stays with "0" (Claude's call) — "counts the matches of the query on every chip, after the same pause" RED → GREEN.
- Final: fixed (owner's request): test gaps — a query of spaces keeps "5 skills"; "All" stays pressed after a click on it; two e2e assertions that could not fail were removed.
- Final: minor (deferred, owner's choice): 1–4 px differences from the prototype (the bar's gap on desktop, the "Domain" label's padding, the empty state's size on desktop, the aside's gap on phones).
- Final: Ruling: radiogroup semantics for the chips — the handoff asks for a toggle group with `aria-pressed` — cost if wrong: a different announcement in screen readers.
- Final: Ruling: typing before hydration, a domain emptied while the route is hidden, a domain without an `en` label — outside this page or practically unreachable — cost if wrong: a stale chip until reload.
- Final: iOS simulator, iPhone 17, iOS 26.5, production build behind a no-store logging proxy; taps by the owner, because this session's host app has no Accessibility access for `cliclick` and `osascript`. A tap in the search: `font-size: 16px`, `visualViewport.scale` 1, twice. Control with the old 15 px injected by the proxy: `scale` 1.067, the visible width 377 of 402, and it stayed zoomed. A tap on "Tools": pressed, 13 rows, "13 of 42". Not tried: rotation (no way to turn the simulator without Accessibility access).
- Final: fixed (found in the iOS simulator, Task 8): while the panel folded, `stuck` and `collapsed` flipped 14 times in half a second. Safari reports a transitioning `top` at its end value (2 px) while the panel is still at 56 px, so `useIsStuck` saw it unstuck, the panel unfolded, then folded again. The unfolded offset now lives in `--stick-top` (64 px, 93 px from `lg`), which never transitions — "measures against the unfolded offset in --stick-top, not the transitioning top" RED → GREEN. After the fix, four scroll movements by the owner gave exactly four changes. Chromium reports the in-between value, so e2e never saw the loop. The test's first animation-frame mock returned 1 and hid every measurement after the first; it returns 0 now (in browsers the callback is always asynchronous).
- Final: iOS simulator, scrolling by the owner: the panel folds on the way down and unfolds on the way up; the rubber band at both ends changes nothing; the chips row fades at its end, at both edges in the middle and at its start at the end.

