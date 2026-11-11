---
tags: [spec, projects, database]
status: done
date: 2026-11-03
updated: 2026-11-03
---

# Projects Page Design

Status: **done, the page was closed on 2026-11-03.** Plan: [[2026-11-03-projects-page]].

Related: [[Experience Page Handoff]] (visual contract), [[Home Page Handoff]], [[Admin Handoff]], [[Content Model]], [[Rendering Strategy]], [[ADR-0002 Database and ORM]], [[ADR-0003 Content Localization]], [[ADR-0007 Testing]], [[2026-11-02-about-page-design]].

## Intent

`/[locale]/projects` tells the story of every place of work on one page. All jobs are in the HTML, so all of them are indexed. A pinned column on desktop and a sticky bar on phones show which job is being read and how far along the reader is. This page closes Stage 3 of the [[Roadmap]].

The content comes from the existing `experience` tables, so the admin can manage it later. Home keeps its short cards, and "Learn more" now leads to the matching job.

## Scope

**In:**
- The route with its metadata, the desktop split, the phone bar, the reading progress.
- `description_short` becomes plain text. Omega-R leaves the database. `role` and `description_full` get their content.
- Home follows: three cards, plain text on the card, "Learn more" to `/projects#slug`.

**Out:**
- **Rich text beyond today's renderer.** `description_full` goes through `src/shared/ui/RichText.tsx` unchanged.
- **Admin.** Nothing is editable yet.
- **Other locales' content.** Only `en` rows exist; every locale falls back to them.
- **Translating the new UI strings.** `messages/en.json` only, as with the rest of the site.
- **New company images.** Sony and EPAM show the placeholder until the admin exists.
- **JSON-LD.** The handoff does not ask for it, and About already describes the person.
- **A separate `projects` entity.** See [[Open Questions]].

## Decided by the owner

1. **Rendering as on Home:** `"use cache"`, `cacheLife("max")`, `cacheTag` on the queries, `updateTag` from the admin. The route is static per locale. This replaces "ISR" in [[Roadmap]], [[Rendering Strategy]] and `docs/design/README.md`.
2. **The page is called Projects** in the navigation, the route and the admin. This closed the "Page name" question of `docs/design/README.md`. The tables stay `experience`.
3. **Corrections to the design.** Not shown in a section: the mono years label above the `h2`, the stat tiles, the lead sentence, the "What I did" heading. The big outline years in the aside are gone too (owner's decision of 2026-11-03, after seeing the page).
4. **`description_short` is a plain string.** It stands where the design's context paragraph stands, in that paragraph's style: 16 px / 1.6, `foreground-soft`. This replaces the handoff's 20 px.
5. **`description_full` follows with no heading,** rendered by `RichText`. Its demo content is the `body` of `docs/design/shared/content.ts`.
6. **Every job's `role` is `Senior Frontend Software Engineer`.**
7. **Omega-R is deleted from the database.** Three jobs remain: Glovo, Sony PlayStation, EPAM. The owner expects this to hold for now, not forever.
8. **"Learn more" leads to `/projects#slug`.** "All experience" stays `/projects`.
9. **The work starts with the database,** then Home, then the page. See "Order of the work".

## Data

### `experience_translations`

| Column | Change | Notes |
|---|---|---|
| `description_short` | `jsonb` → `text` | Up to 3 sentences, plain text. The check `experience_translations_en_complete` stays as it is. |
| `role` | none | Filled for the three jobs. Stays nullable: the admin has a "Role missing" badge. |
| `description_full` | none | Filled for the three jobs. |

The change matches the design: [[Home Page Handoff]] already calls the field plain text, and [[Admin Handoff]] gives it a plain counter of 320.

### Query

`getExperience` in `src/db/queries/home.ts` gains `role` and `descriptionFull` through `localizedOptional`, and `descriptionShort` becomes `string`. Both pages call the same function with the same cache tags, so one database read per locale serves both, and an admin edit refreshes both. `HomeExperience` is renamed `Experience`: it no longer describes Home alone.

### Seed

- `src/db/seed/data.ts`: Omega-R goes away. Each job gains `role` and `descriptionFull`, built with `doc` and `bulletList` from the `body` of `content.ts`.
- `seedContent` writes all of it, so an empty database gets the same result. `descriptionShort` goes in as a string.
- A new `seedExperienceDetails` runs on every `db:seed`, after `seedContent`, like `seedAboutPairs`. It fills `role` and `description_full` of the `en` rows only where they are null, so it never overwrites anything and a second run changes nothing.
- It matches jobs by `slug`. A job in `data.ts` that is missing from the database is skipped.

### Order of operations

There is one database for every environment, so each step's exact SQL or command is shown to the owner and confirmed first.

**`db:push` must not make the type change.** A plain cast of `jsonb` to `text` succeeds and stores the serialized document, `{"type":"doc",...}`, which would then show on the Home cards. The `USING` clause extracts the text. All four rows hold one paragraph with one text node (checked read-only on 2026-11-03).

1. Delete and convert, in one transaction:
   ```sql
   BEGIN;
   DELETE FROM experience WHERE slug = 'omega-r';
   ALTER TABLE experience_translations
     ALTER COLUMN description_short TYPE text
     USING description_short #>> '{content,0,content,0,text}';
   COMMIT;
   ```
   The foreign keys cascade to `experience_translations` and `experience_skills`. The `skills` rows stay: `React Native` and `Material UI` lose their only job but remain skills.
2. `npm run db:seed`, which fills `role` and `description_full`.
3. `npm run db:push` must report no changes. That confirms the schema and the database agree.

**Old code cannot read the new type.** `toPlainText` throws on a string (`"text" in node`). After step 1:
- Pages already served keep working, because they are prerendered.
- A rebuild of an older commit fails, and Vercel keeps the previous deployment.
- A background refresh of an old deployment's cache fails too. `cacheLife("max")` refreshes after 30 days, so this is far away.

The owner accepts this: no domain is connected yet, and the state of the deployed builds does not matter for now.

### Order of the work

The owner's decision of 2026-11-03: the database first, then Home, then the page.

1. **Database.** `src/db/schema/experience.ts`, `src/db/seed/data.ts` and `seedExperienceDetails` change first, because the seed and `db:push` run from them. Then the three steps above, each confirmed by the owner.
2. **Home.** `getExperience`, `ExperienceCard`, the three-column grid, "Learn more", and their tests.
3. **The page,** on the real data, in the handoff's order.

The first two parts form one step of the definition of done: the code cannot compile or build between them, because the schema's type already changed and Home still expects the old one. Every step after that passes all five checks.

## Page

The visual contract is [[Experience Page Handoff]] and the site-wide rules of `docs/design/README.md`. Only the differences and the structure are here. The handoff's "Changes since 2026-11-01" already removes the stats and the lists; the corrections above go further.

**Section, top to bottom, with a 16 px gap:**
1. `h2` company name, 34 px, 30 px on phones.
2. Mono meta line: role · period · duration. With no role: period · duration.
3. Below `lg` and in print: the company image, 130 px tall, radius 16, through `src/shared/ui/Image.tsx`.
4. `description_short`.
5. `description_full`, when it exists.
6. `h3` "Skills", then the tag chips, when the job has skills.

**Stage (owner's decision of 2026-11-03, after seeing the page):** from `lg` the image leaves the sections and stands on the stage above the company name, 200 px tall and as wide as the column. The image, the name and the role line are centered vertically as one block. In a short window the image shrinks first, so the name stays whole, and below a window height of 640 px it is hidden rather than left as a sliver. The two places need two copies of the image; the hidden one is lazy and `display: none`, so it is not fetched.

**`h1`:** the prototype has none. The aside's mono label is the `h1`: visually hidden below `lg`, where the aside is not shown (`sr-only lg:not-sr-only`).

**Label text:** `Projects · 2021 — 2026`. The years come from the data: the earliest start and the latest end.

**Structure:**
- `src/app/[locale]/projects/page.tsx`: route, with the one-line rendering comment.
- `src/views/projects/ProjectsPage.tsx`, `src/views/projects/metadata.ts`: composition and metadata.
- `src/widgets/projects/Projects.tsx` with `ui/` for the aside, the phone bar and the section. All Server Components.
- `src/features/reading-progress/`: the client leaf and its pure functions.
- `src/shared/lib/period.ts`: `formatMonthYear` and `getDurationYears` move here with their tests from `src/features/experience-card/lib/`, because a slice's internals are not importable from outside. New: the label's range.
- `src/shared/lib/useScrollHold.ts`: the "hold until the visitor scrolls by hand" logic, extracted from `QuestionNav`. See Claude's calls.

**Rendering:** static per locale. `generateStaticParams` already comes from the root layout. The route re-exports the view, as the other pages do.

**Metadata:** title `Projects — {name}`, description from the new `Projects.metaDescription`, `alternates` from `getLocaleAlternates(locale, "/projects")`, Open Graph as on About.

**Messages (`messages/en.json`):** a new `Projects` namespace from the design's `docs/design/shared/messages.en.json`, with these changes:
- `label` reads `Projects · {from} — {to}`.
- `stack` is renamed `skills`.
- `present` is added, for a job with no end date.
- `metaDescription` is added: "The full story of every place I have worked as a frontend engineer: the products, the results and the skills behind them."
- `progressAria` is dropped: the bars are decorative.

`back` comes from `Common`.

**Back link:** `BackLink` unchanged, 30 px below it (owner's rule of 2026-11-02). On phones the row's padding is 12 × 18 × 0, because that 30 px already comes from the link.

**Layout rules that keep the design working:**
- The stage stacks its blocks in one grid cell, so it keeps the height of the tallest and the rows do not move.
- On a short window the stage shrinks and clips; the rows stay visible.
- `sticky` needs no ancestor with `overflow: hidden`.
- Header heights: `top-16`, `lg:top-[72px]`, as in `QuestionNav`.
- In print: the aside and the bar are hidden, sections are one column without `min-height`.
- With JavaScript off: all sections read as an article, the first job stays active, rows are plain anchors.

## Reading progress

`src/features/reading-progress/` holds one client component that wraps the server-rendered aside, bar and sections.

**No React state on scroll.** It writes `data-active`, `aria-current` and `--progress` straight to the DOM, once a frame at most (`requestAnimationFrame`), so a scroll never re-renders anything. The server marks job 0 as active.

**Sections are looked up inside the wrapper,** by `article[id]`, because a page left behind stays in the DOM with the same ids ([[Rendering Strategy]]). Effects of a hidden route are cleaned up and rerun when it returns.

**Rules (the handoff's, as pure functions with Vitest tests):**
- **Active job:** the last section whose top is above 40% of the window's height.
- **Progress:** `clamp((0.4·vh − sectionTop) / sectionHeight, 0, 1)`, where `sectionTop` is relative to the window.
- **Bottom of the page:** the last job is active and every bar is at 1.

**Bars** scale with `transform: scaleX(var(--progress))` from the left, not `width`, so a scroll causes no layout.

**Rows** are real links to `#slug` through the router `Link` with `replace` and `scroll={false}`, as the chips of About are. A click scrolls the section with `scrollIntoView`, smooth unless motion is reduced, and moves the focus there. Articles have `tabIndex={-1}`.

**Hold:** a clicked row stays active until the visitor scrolls by hand, so the smooth scroll does not walk the rows in between. The bars keep following the page during the hold. Sections are at least 95dvh on desktop, the only place with rows, so at the end of the scroll the 40% rule agrees with the held row and nothing jumps when the hold ends. A deep link is not held: the jump passes no other job, so the rule alone is right. A hold ends when the route is left, because a kept route comes back with its refs.

**`scroll-margin-top`:** the header on desktop; the header plus the bar on phones, with a value that also covers the bar wrapped to two lines.

**Motion:** the stage's switch takes 0.5 s with ease-out, and it is an instant swap with reduced motion. The bars follow the scroll in both cases.

**Accessibility:** the stage and the phone bar are `aria-hidden`, because they repeat the articles. The aside's rows are the `<nav aria-label="Places of work">`, and the active link has `aria-current="true"`.

## Home

- `src/widgets/experience/Experience.tsx`: `lg:grid-cols-3` instead of `lg:grid-cols-4`. A fourth job would wrap to a second row until this changes back.
- `ExperienceCard`: the description is a plain string; `toPlainText` and `whitespace-pre-line` go away. "Learn more" goes to `/projects#${slug}`. `sizes` is recalculated for three columns.
- **Risk:** at three columns the desktop card is wider than 16:9, so `object-cover` crops `glovo.png` vertically. That is the crop the 2026-10-31 decision left for the admin on tablets ([[2026-10-30-home-experience]]). It is checked on a build and reported to the owner, not fixed here. The same file at 200 px tall on Projects is checked too.

## Tests

- **Vitest:** the active job and the progress, including the end of the page; the label's range; `useScrollHold`; `ExperienceCard` with a string and the new link; `period.ts` moved with its tests.
- **Playwright** (read-only):
  - One article per job in order, with the right content: no years label, no heading above the full description, `h1` present in both layouts.
  - Rows' text and hrefs; `aria-current` follows scrolling; the bars grow; the end of the page sets everything.
  - A row click lands below the header, keeps the row held, adds no history entry, moves the focus.
  - `/projects#sony` from Home lands below the header and the bar, and marks the right job.
  - The Back link goes home.
  - Sticky aside and bar; reduced motion; JavaScript off; both themes; desktop and mobile; no horizontal page scroll; hreflang.
  - After going to another page and back, the progress is right.
- **Existing tests that break:**
  - `e2e/home-experience.spec.ts`: names, every "of 4" and "/ 4", `toHaveLength(4)`, the `sizes` measurements, the steps through a fourth card, the link href, the comment about a 404.
  - `src/features/experience-card/ExperienceCard.test.tsx`: the rich text fixture, the link href.
  - Anything else that treats `/projects` as a 404 is to be found while building, as with `/about`.
- **iOS simulator** ([[2026-10-30-home-motion]] has the method): the sticky bar, a real swipe, rotation both ways, a deep link from Home.
- **Lighthouse** on `/en/projects`, locally, and on Vercel after a deployment.

## Documentation

Updated with the work:
- [[Content Model]]: the `slug` note (`/projects#glovo`), `role`, `description_short` as `text`, `description_full`.
- `src/db/schema/experience.ts`: the same `slug` comment.
- [[Experience Page Handoff]]: the corrections, Omega-R, the label, the static route.
- [[Home Page Handoff]]: three cards, the Omega-R TODO.
- [[Admin Handoff]]: the section is called Projects.
- `docs/design/README.md`: the "Page name" question closed, the anchors list, the rendering column.
- [[Rendering Strategy]]: the `/projects` row.
- [[Roadmap]]: Stage 3 done.
- [[Open Questions]]: is a separate `projects` list still needed, as [[Experience Page Handoff]] asks. [[Content Model]] keeps it under "Later stages" until that is answered.
- `docs/Home.md`, journal, this spec's status.

`docs/design/shared/content.ts` and the screens stay as delivered: they are the design package, and the seed is the source now.

## Accepted by the owner after the review

- **LCP on phones:** the Glovo image is the LCP element and stays lazy. Lighthouse holds at 95; an eager copy would cost desktop a second file.
- **The browser's Back after a row click** returns to the anchor, not to where the visitor had scrolled by hand.
- **The language switch** drops the anchor and the scroll position.
- **`glovo.png`** touches the top edge on Home at 2560 px, until a new export through the admin.
- **Windows of 300 px or less:** the 40% line sits under the sticky bars. The narrowest supported window is 360 px wide ([[Overview]]).

## Claude's calls

- **A direct `ALTER`,** not a new column. Alternative: add `summary text`, copy, switch the code, drop the old column after the merge. That has no window in which an old build fails, at the price of two schema passes and a field name the owner did not ask for. Nothing depends on those builds yet, so the window costs nothing here.
- **One `getExperience` for both pages.** Alternative: a separate query in `src/db/queries/projects.ts`, as About has. That repeats 30 lines of joins for a nearly identical result, and two cache entries of the same data. Home's cached result grows by `description_full`, which never reaches the browser, because the card does not render it.
- **A guarded seed step,** not a one-off `UPDATE`. An empty database gets the same content from one command.
- **The 40% rule, not About's.** About's rule marks the section nearest to the top from below, which suits short sections. Progress bars need one fixed line, and these sections are a screen tall.
- **The hold is extracted into a hook,** not copied. It took three rounds of tests to get right on About, and two copies would drift. The cost is that the change touches `QuestionNav`, which its existing tests cover.
- **The label reads Projects,** not the handoff's Experience: it is the page's `h1`, and it should match the title and the navigation. The Home block keeps its "Experience" heading, which names the block.
- **The bars are decorative.** Alternative: an accessible value per row through `progressAria`. A value changing on every scroll is noise, and the rows and articles already say everything.
- **`lg:grid-cols-3` is fixed,** not derived from the count. Alternative: `grid-flow-col auto-cols-fr`, which fits any count, but `sizes` depends on the number of columns anyway.
- **`React Native` and `Material UI` stay in `skills`:** they are the owner's skills, whichever job they came from.

## Left to the builder

File names inside `ui/`, the exact wrapper mechanics of the client leaf, the mapping of the handoff's pixel values to Tailwind, the phone bar's `scroll-margin-top` value, and the card's `sizes` values, which are measured.
