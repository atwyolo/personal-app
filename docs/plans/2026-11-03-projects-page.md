---
tags: [plan, projects]
status: done
date: 2026-11-03
updated: 2026-11-03
---

# Plan: Projects page

Build `/[locale]/projects` on the `experience` tables: the database first, then Home, then the page and its reading progress. The checklist in this note is the ledger: a task is ticked when its delta is staged.

Related: [[2026-11-03-projects-page-design]] (the spec, read it with this plan), [[Experience Page Handoff]], [[Data Model]], [[ADR-0002 Database and ORM]], [[ADR-0007 Testing]].

## Global constraints

- **Stages, not commits.** Every task ends with `git add`. The owner commits.
- **Inline, one task at a time.** Discuss in Russian before a task when something is unclear.
- **TDD** for logic and client components with Vitest. Async Server Components and database-backed output are verified with Playwright, which never writes to the database.
- **Production database:** the exact SQL or command is shown to the owner and confirmed before every write. `drizzle-kit push` asks for confirmation in a terminal, so the owner runs it (`! npm run db:push`).
- **Definition of done for a task:** `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`. Tasks 1 and 2 share one run, at the end of Task 2 (owner's order of the work, see the spec).
- **Conventions from `CLAUDE.md`:** `FC<Props>`, named exports, props destructured on the first line, Server Components by default, `src/shared/ui/Image.tsx` for images, no barrels, English in the repository.
- **Next.js:** read the matching guide in `node_modules/next/dist/docs/` before a task that uses a Next API for the first time here.
- **Visual values** come from [[Experience Page Handoff]] and `docs/design/README.md`, except where the spec overrides them.

## Decisions made while planning

- **One DOM for the left column** (Claude's call). It is a `<div>`, not an `<aside>`: an `h1` inside a complementary landmark reads badly. It is never `display: none`, because the `h1` must exist on phones. Below `lg` it shows only `BackLink` (the phone's Back row) and the `sr-only` `h1`; the stage and the rows are `hidden lg:...`. So there is one Back link and one `h1` in the HTML. Alternative: a second Back link and `h1` in the phone column, which needs one of each hidden at every width.
- **The client wrapper delegates clicks** (Claude's call). Rows stay server-rendered `Link`s; the wrapper's `onClick` finds `a[data-job]`. Alternative: rows rendered by the client component, as chips are, which moves their markup and data out of the Server Component for one handler.
- **Data attributes are the contract** between the server markup and the client leaf: `data-job="<index>"` on every element that follows a job, `data-active` on the active ones, `--progress` on all of them.

## Rulings while building

- **Task 1, Step 6 runs after Task 2:** `db:push` needs the owner's terminal, and nothing in Task 2 depends on it. If wrong: one more run after any correction.
- **Task 2, e2e:** the blog carousel also has three slides now, so "1 of 3" matched both. The locators are scoped to the Experience carousel.
- **Task 2, e2e:** "stays on the card when the phone turns back to portrait" moved from card 3 to card 2. With three cards the browser's clamp alone lands on the last card, so the old test would pass with the restoring code removed.
- **Task 4:** the image uses `framed`, not the plain placeholder: the design's placeholder has the thin stripes and the dashed border of `framed`. Its 14 px radius sits inside the box's 16 px. If wrong: one prop.
- **Task 4:** the left column uses 73 px, not the 72 px of the spec: the header is 72 px plus its 1 px border, and the column's height must end at the window's bottom. The phone bar stays at `top-16`, as the chips of About, with its first pixel under the header's border.
- **Task 4:** a stacked `gap` would add 20 px to the 30 px under `BackLink`, so the column has no `gap`: the stage and the rows carry `mt-5`.
- **Task 4:** phones have no `min-height` on sections, as in the prototype; the handoff names it for desktop only.
- **Task 6:** a deep link is not held, against the spec's first text: the jump passes no other job, so the rule alone is right, and holding needs a way to tell a fresh link from a return. The spec is updated. If wrong: one line in the effect.
- **Task 6:** `useScrollHold` gained `release()`: a kept route returned with the old hold, so a row clicked before leaving stayed marked at the top of the page. `QuestionNav` has the same trait and does not call it: its hold on a chip is the owner's rule, and a return there restores the section.
- **Task 6:** the plan's "follows the restored position" test assumed Back restores the scroll position. In Chromium, Back to `#sony` lands on the anchor. The test now checks that the column agrees with the page.
- **Final review:** fixed with tests that failed first: the stage covered and swallowed clicks on the rows in a short window (`overflow-y-clip`, "leaves every row clickable from edge to edge"); a long name was cut at 1024 px (a fixed grid track, "keeps a long company name inside the column"); print kept the narrow column (`print:block`, "keeps the articles and drops what follows them"); an empty sticky bar and an empty `nav` with no jobs (`ProjectsColumn.test.tsx`). Checked by a run in Chromium, WebKit and Firefox.
- **Final review, for the owner:** the 40% line sits under the sticky bars at a window height of 300 px or less, and Back after a row click returns to the anchor, not to where the visitor had scrolled.
- **Owner's change after the review:** the big outline years are gone from the stage. `formatYearRange`, `ProjectJob.years`, and the overflow rules that existed for the years went with them. The tasks below keep their original text as the record of what was planned.
- **Owner's change after the review:** the image moved: under the role line below `lg`, on the stage above the name from `lg`. Print keeps the copy in the article, because print hides the column. The image gives way first in a short window: the owner asked for a centered block, not for a size there.

## Review focus

The cases most likely to bite a visitor that no behavior in the spec names. Each has a test in the task that owns the code.

1. **A deep link opened fresh on a phone,** `/en/projects#epam`, must land below the header and the bar with EPAM active, not job 0 from the server markup. Task 6.
2. **Leaving the page and coming back:** the kept route has zero-height sections while hidden, and the state must be right when it returns. Task 6.
3. **Windows that are not 1280 × 720:** a 1400 px tall desktop, and a phone turned to 844 × 390, where the sticky bars take a third of the height. Rows stay visible, the end of the page is still reached. Task 4 and Task 6.
4. **A locale without translations:** `/ru/projects` shows the English jobs under `lang="ru"`, and the language switch stays on Projects. Task 4.
5. **320 px and 1024 px:** the 118 px years and the long name "Sony PlayStation" never widen the page, and the phone bar wraps instead of overflowing. Task 4.

---

## Tasks

### Task 1: Database

**Files:**
- Modify: `src/db/schema/experience.ts`, `src/db/seed/data.ts`, `src/db/seed/index.ts`

**Interfaces:**
- Produces: `experienceTranslations.descriptionShort` as `text`; `data.experience` of three jobs, each with `role: string` and `descriptionFull: RichTextDoc`; `seedExperienceDetails(): Promise<void>`.

There are no unit tests here: Vitest does not reach the database. The proof is the read-back in Step 7, and `tsc` fails on Home until Task 2.

- [x] **Step 1: Change the schema.** `descriptionShort: text()`. Fix the `slug` comment to `/projects#glovo`.
- [x] **Step 2: Change the seed data.** Remove Omega-R. Add `role: "Senior Frontend Software Engineer"` to each job, and `descriptionFull` from `body` in `docs/design/shared/content.ts`, with `doc(bulletList([...]))`, word for word.
- [x] **Step 3: Change the seed.** `seedContent` inserts `role`, `descriptionFull`, and `descriptionShort: e.descriptionShort`. Add `seedExperienceDetails()`: reads `en` rows joined to `slug`; for each job in `data.experience` updates `role` where it is null and `description_full` where it is null, as two guarded updates in one `db.batch`; a slug missing from the database is skipped. `main()` calls it after `seedContent` and before `seedAboutPairs`. Log how many rows changed.
- [x] **Step 4: Convert the database.** After the owner confirms, run in one transaction, from a script in the scratchpad:
  ```sql
  DELETE FROM experience WHERE slug = 'omega-r';
  ALTER TABLE experience_translations
    ALTER COLUMN description_short TYPE text
    USING description_short #>> '{content,0,content,0,text}';
  ```
- [x] **Step 5: Run the seed.** After confirmation, `npm run db:seed`. Expected: "The database already has content...", then the details filled, then "About pairs already exist."
- [x] **Step 6: Check the schema.** The owner runs `! npm run db:push`. Expected: no change to `experience_translations` columns. The only `DROP` allowed is the known `..._pk` pair from [[ADR-0002 Database and ORM]]; decline and stop on anything else.
- [x] **Step 7: Read it back.** Three `experience` rows; `description_short` starts with "Built an AI-powered chat", "Helped build the", "Migrated an e-commerce" and contains no `{"type"`; `role` is set on all three; `description_full` has `bulletList` as its first node, with 4, 3 and 3 items. A second `npm run db:seed` changes nothing.
- [x] **Step 8: Stage** the task's files with `git add`.

### Task 2: Home

**Files:**
- Modify: `src/db/queries/home.ts`, `src/features/experience-card/ExperienceCard.tsx`, `src/widgets/experience/Experience.tsx`
- Test: `src/features/experience-card/ExperienceCard.test.tsx`, `e2e/home-experience.spec.ts`

**Interfaces:**
- Consumes: the schema of Task 1.
- Produces: `type Experience = { slug: string; company: string; role: string | null; startDate: string; endDate: string | null; today: string; imageUrl: string | null; descriptionShort: string; descriptionFull: RichTextDoc | null; skills: string[] }`; `getExperience(locale: Locale): Promise<Experience[]>`, cached as before.

- [x] **Step 1: Update the unit tests.** Fixture `descriptionShort: "Built a chat. Cut defects."`, with `role` and `descriptionFull: null`. "shows the description as plain text" finds that string. "links to the projects page" expects `/projects#glovo`, using the fixture's slug.
- [x] **Step 2: Run them.** `npx vitest run src/features/experience-card`. Expected: FAIL on the link, and on the description, because `toPlainText` throws on a string.
- [x] **Step 3: Update the query and the card.** `getExperience` gains `role` and `descriptionFull` through `localizedOptional`. `HomeExperience` becomes `Experience`. In the card, the string goes straight into the `<p>`, `whitespace-pre-line` goes, "Learn more" goes to `/projects#${slug}`.
- [x] **Step 4: Run them.** Expected: PASS.
- [x] **Step 5: Change the grid.** `lg:grid-cols-3` in `Experience.tsx`.
- [x] **Step 6: Measure `sizes`.** On a production build, read the image box at 1024, 1280 and 1600 px, and rewrite the desktop part of `sizes` and its comment. `object-cover` scales a wide file by the 180 px height only when the box is narrower than 16:9, so check whether the `max(...)` is still needed at 1024.
- [x] **Step 7: Update `e2e/home-experience.spec.ts`.** Names `["Glovo", "Sony PlayStation", "EPAM"]`; every "of 4" and "/ 4" to 3; `toHaveLength(3)`; the walk through positions ends at "3 / 3"; href `/de/projects#glovo` on "Learn more", `/de/projects` on "All experience"; the measured widths; the "four-column" text and the 404 comment. Tests that stop on card 3 stay meaningful, because card 3 is the last one now: rewrite their comments. Anything else counting four cards is found by the run.
- [x] **Step 8: Look at the Glovo crop** at 1280 and 1600 px and report it to the owner with a screenshot. Do not fix it (see the spec).
- [x] **Step 9: Run the definition of done** and stage the task's files.

### Task 3: Period helpers in `shared`

**Files:**
- Move: `src/features/experience-card/lib/period.ts` → `src/shared/lib/period.ts`, with `period.test.ts`
- Modify: `src/features/experience-card/ExperienceCard.tsx`

**Interfaces:**
- Produces, besides the moved `formatMonthYear` and `getDurationYears`:
  - `formatYearRange(startDate: string, endDate: string | null, today: string): string`
  - `getYearSpan(periods: { startDate: string; endDate: string | null }[], today: string): { from: number; to: number } | null`

- [x] **Step 1: Move the files** and update the import. Run `npx vitest run src/shared/lib/period.test.ts`. Expected: PASS.
- [x] **Step 2: Write the failing tests:**
  - `formatYearRange("2024-11-01", "2026-10-01", today)` → `"2024–26"` (en dash)
  - `formatYearRange("2024-01-01", "2024-06-01", today)` → `"2024"`
  - `formatYearRange("2025-03-01", null, "2026-11-03")` → `"2025–26"`
  - `getYearSpan` of the three jobs → `{ from: 2021, to: 2026 }`
  - `getYearSpan` with a running job and `today` `"2027-02-01"` → `to: 2027`
  - `getYearSpan([], today)` → `null`
- [x] **Step 3: Run them.** Expected: FAIL, the functions are missing.
- [x] **Step 4: Implement both,** reading the year from the string, as the file's other functions do.
- [x] **Step 5: Run them.** Expected: PASS. Run the definition of done and stage the task's files.

### Task 4: The page without client behavior

**Files:**
- Create: `src/app/[locale]/projects/page.tsx`, `src/views/projects/ProjectsPage.tsx`, `src/views/projects/metadata.ts`, `src/widgets/projects/Projects.tsx`, `src/widgets/projects/ui/ProjectsColumn.tsx`, `src/widgets/projects/ui/ProjectsBar.tsx`, `src/widgets/projects/ui/ProjectSection.tsx`, `e2e/projects.spec.ts`
- Modify: `messages/en.json`, `e2e/header-nav.spec.ts`, `e2e/header.spec.ts`, `e2e/home-experience.spec.ts`

**Interfaces:**
- Consumes: `getExperience`, `Experience`, the period helpers, `BackLink`, `RichText`, `Chip`, `Image`, `getLocaleAlternates`.
- Produces: the DOM contract for Task 6: `article[id="<slug>"]` with `tabIndex={-1}`; `data-job="<index>"` on stage blocks, row links, bar names and bar segments; `data-active` and `aria-current="true"` on job 0; `--progress` read by every bar. Until Task 6 the bars read a fallback of 0.

- [x] **Step 1: Write the failing e2e tests** in `e2e/projects.spec.ts`, importing from `./fixtures`:
  - `h2`s read Glovo, Sony PlayStation, EPAM; article ids `glovo`, `sony`, `epam`
  - `#glovo` shows "Senior Frontend Software Engineer · 11/2024 – 10/2026 · 2 years", `#sony` "... · 08/2023 – 11/2024 · 1.3 years", `#epam` "... · 07/2021 – 08/2023 · 2.2 years"
  - `#glovo` shows "Built an AI-powered chat for user support and set up frontend monitoring." and four `li` with "Built an AI-powered chat for user support." first
  - no article contains "What I did", and the first child of each article is its `h2`, so there is no years label above it
  - `h3` "Skills" and five chips in `#glovo`
  - one `h1` reading "Projects · 2021 — 2026" in both projects, visible on desktop and `sr-only` on mobile
  - desktop: the stage shows `2024–26` aria-hidden; `nav[aria-label="Places of work"]` has three links with `#glovo`, `#sony`, `#epam`, periods, `aria-current="true"` on the first
  - mobile: the stage and the rows are hidden; the bar is `aria-hidden` and sticks under the header
  - the title is `Projects — Mikhail Aleksandrov`, `link[rel="canonical"]` ends in `/en/projects`
  - the Back link's `href` is `/en`
  - **Review focus 4:** `/ru/projects` has `html[lang="ru"]` and the same `h2`s; the locale menu from `/en/projects` lands on `/ru/projects`
  - **Review focus 5:** at 320 px and at 1024 px, `scrollWidth` equals `clientWidth`
  - **Review focus 3:** at 1024 × 600 the last row is inside the window; at 844 × 390 the bar is under the header and the first `h2` is not covered
  - with JavaScript off: all three articles and all `li` are visible
- [x] **Step 2: Run them.** `npx playwright test e2e/projects.spec.ts --project=desktop`. Expected: FAIL with 404.
- [x] **Step 3: Add the messages.** The `Projects` namespace as the spec lists it, with `metaDescription` verbatim.
- [x] **Step 4: Build the route, the view and the metadata** on the pattern of About. The route comment: `// Rendering: static, one page per locale. Every read in the view is a "use cache" function, so the whole page joins the static shell at build time.`
- [x] **Step 5: Build `Projects`, `ProjectsColumn`, `ProjectsBar`, `ProjectSection`.** Layout per the handoff and the spec's section and "Layout rules". `ProjectsColumn` is the left column of "Decisions made while planning". Rows use the router `Link` from `@/shared/lib/i18n/navigation` with `replace` and `scroll={false}`. The image box is `relative overflow-hidden rounded-2xl` with `Image` not framed, `object-cover`, `sizes` of `(min-width: 1024px) calc(55vw - 112px), calc(100vw - 36px)`. With no jobs, the column shows the Back link and an `h1` with no years.
- [x] **Step 6: Run the e2e tests.** Expected: PASS on both Playwright projects.
- [x] **Step 7: Update the tests that treat `/projects` as a 404.** `e2e/home-experience.spec.ts` comment; `e2e/header.spec.ts:74` and `e2e/header-nav.spec.ts:105` keep the allowance for the sections that still lead to 404, with corrected comments. `e2e/header-nav.spec.ts:163` and `:219` follow "Projects" to a real page now: check that they still measure what they say.
- [x] **Step 8: Run the definition of done** and stage the task's files.

### Task 5: Extract the hold

**Files:**
- Create: `src/shared/lib/useScrollHold.ts`, `src/shared/lib/useScrollHold.test.ts`
- Modify: `src/features/question-nav/QuestionNav.tsx`

**Interfaces:**
- Produces: `useScrollHold(): UseScrollHold`, with `interface UseScrollHold { hold: () => void; isHeld: () => boolean }`. Both functions are stable.

- [x] **Step 1: Write the failing tests** with `renderHook`:
  - starts released
  - `hold()` holds; a `scroll` event alone keeps it held (the scroll a click started)
  - `wheel`, `touchmove`, `keydown`, `pointerdown`, each followed by `scroll`, release it (parameterized)
  - `pointerdown` with no `scroll` after it keeps it held
  - hand input before `hold()` does not count: `pointerdown`, `hold()`, `scroll` stays held
  - unmount removes the listeners
- [x] **Step 2: Run them.** Expected: FAIL, the module is missing.
- [x] **Step 3: Implement the hook,** moving `HAND_INPUT_EVENTS`, `heldRef`, `handInputRef` and the logic of `handleScroll` and `markHandInput` from `QuestionNav`. The hook owns its listeners. `hold()` clears the hand input mark.
- [x] **Step 4: Switch `QuestionNav` to the hook.** It keeps its own scroll and resize scheduling. Its behavior does not change.
- [x] **Step 5: Run the tests.** `npx vitest run src/shared/lib/useScrollHold.test.ts src/features/question-nav` and `npx playwright test e2e/about.spec.ts`. Expected: PASS, with no test of `QuestionNav` or About edited.
- [x] **Step 6: Run the definition of done** and stage the task's files.

### Task 6: Reading progress

**Files:**
- Create: `src/features/reading-progress/reading-state.ts`, `reading-state.test.ts`, `ReadingProgress.tsx`, `ReadingProgress.test.tsx`
- Modify: `src/widgets/projects/Projects.tsx`, `e2e/projects.spec.ts`

**Interfaces:**
- Consumes: `useScrollHold`, the DOM contract of Task 4.
- Produces: `getReadingState(params: ReadingStateParams): ReadingState`, with `interface ReadingStateParams { sections: { top: number; height: number }[]; viewportHeight: number; atPageEnd: boolean }` and `interface ReadingState { active: number; progress: number[] }`; `ReadingProgress: FC<{ className?: string; children: ReactNode }>`.

- [x] **Step 1: Write the failing tests of `getReadingState`,** with `viewportHeight: 1000`, so the line is at 400, and sections 800 tall:
  - tops `[100, 900, 1700]`: nothing above the line → active 0, progress `[0.375, 0, 0]`
  - tops `[-100, 700, 1500]` → active 0, progress `[0.625, 0, 0]`
  - tops `[-900, -100, 700]` → active 1, progress `[1, 0.625, 0]`
  - a top exactly at 400 is not above the line
  - `atPageEnd: true` → active 2, progress `[1, 1, 1]`
  - no sections → active 0, progress `[]`
- [x] **Step 2: Run them.** Expected: FAIL, the module is missing.
- [x] **Step 3: Implement `getReadingState`** and run the tests. Expected: PASS.
- [x] **Step 4: Write the failing component tests** on a fixture with three `article[id]` and `a[data-job]`:
  - a click on a row scrolls its own article, smooth, and focuses it
  - it jumps with reduced motion
  - a click with a modifier does nothing
  - it marks the clicked job at once: `data-active` and `aria-current` move
  - the article is looked up inside the wrapper, not in a copy elsewhere
- [x] **Step 5: Run them.** Expected: FAIL.
- [x] **Step 6: Implement `ReadingProgress`.** A `<div ref className onClick>` around `children`. One `requestAnimationFrame`-throttled update on `scroll` and `resize` reads the articles, calls `getReadingState`, writes `--progress` on every `[data-job]`, and, unless held, `data-active` and `aria-current`. `atPageEnd` is `scrollY + innerHeight >= scrollHeight - 1`. On mount, a `location.hash` matching an article calls `hold()` and marks that job. No React state. `Projects.tsx` wraps its content in it, with the grid classes passed as `className`.
- [x] **Step 7: Run the unit tests.** Expected: PASS.
- [x] **Step 8: Add the failing e2e tests,** then make them pass:
  - scrolling moves `aria-current` to Sony, then EPAM; the bars grow, read from `--progress`
  - at the end of the page every bar is at 1 and EPAM is active
  - a row click lands the `h2` below the header, adds no history entry, moves the focus, keeps the row held through the smooth scroll, and a hand scroll releases it
  - **Review focus 1:** `/en/projects#epam` opened fresh on both projects: the `h2` is below the header and the bar, EPAM is active; the bar shows EPAM on mobile
  - "Learn more" of Sony on Home lands on `#sony` the same way
  - **Review focus 2:** go to `/en/about` and back with the browser: the active job and the bars are right
  - **Review focus 3:** at 1000 × 1400 the end of the page sets everything; rotating 390 × 844 ↔ 844 × 390 recomputes the bars
  - reduced motion: the row click jumps, the stage swaps with no transition, the bars still update
  - the aside stays pinned while scrolling; the left column does not scroll
  - in print media the column and the bar are hidden
- [x] **Step 9: Run the definition of done** and stage the task's files.

### Task 7: Final checks

No code unless a check finds something.

- [x] **Step 1: Run the code review** of `git diff --cached` (`requesting-code-review`), then `receiving-code-review` for its findings. Each fix starts with a test that fails.
- [x] **Step 2: iOS simulator,** by the method of [[2026-10-30-home-motion]], production build: the sticky bar, a real swipe, rotation both ways, a deep link from Home.
- [x] **Step 3: Lighthouse** on `/en/projects`, mobile and desktop, locally. Report the numbers. The Vercel run waits for a deployment.
- [x] **Step 4: Both themes.** Compare with `docs/design/experience/screens/` in dark and light, minding the corrections.
- [x] **Step 5: End of the step.** Compare with `origin/develop` after `git fetch origin develop`, and ask the owner whether everything can be committed and whether to bump the version: the proposal is `minor`, `0.4.0`.
- [x] **Step 6: On the owner's yes,** bring the documentation up to date, as the spec's "Documentation" lists, and add this plan's result and the journal. Bump the version as answered, stage everything, and give the Conventional Commit message.
