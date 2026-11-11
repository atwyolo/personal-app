---
tags: [plan, home]
status: done
date: 2026-10-30
updated: 2026-11-01
---

# Plan: Home top skills block

Replace the temporary Skills dump with "My top skills", the block from the design of 2026-10-31: a static list of the skills marked `top`, and a link to the future `/skills` page. This replaces the earlier `SkillsExplorer` plan: search, domain chips and the "Top N of M" counter move to `/skills`, which is designed separately.

Related: [[2026-10-29-home-page-design]], [[Home Page Handoff]], [[Content Model]]. Previous: [[2026-10-30-home-experience]]. Next: [[2026-10-30-home-blog]].

## Decisions

- **Column `top` (owner's decision).** `boolean NOT NULL DEFAULT false` on `skills`. The handoff calls it `featured`; the owner's name wins and the handoff is corrected. `main` stays: it drives the hero chips.
- **No limit (owner's decision).** Every skill marked `top` is shown. The "1–20" in the handoff describes the layout, not a rule.
- **Starting set (owner's decision).** The eight skills from the design with their current levels: React, Next.js, TypeScript, Redux Toolkit, Nest.js, GraphQL, Jest, Tailwind. The owner corrects the data in the admin. GraphQL, Jest and Tailwind show the placeholder level 6 until then.
- **`getSkills` stays as it is (owner's decision).** The `/skills` page needs it. The home page gets a new `getTopSkills`, so `getSkills` has no caller until that page exists.
- **Experience links stay on `/projects` (owner's decision).** The design's `/projects#<company>` comes with the Projects page.
- **The `/skills` link leads to the 404 page until the page exists,** as `site-nav.ts` already says for other pages (owner's earlier decision). Applies to the nav item and to the button.
- **The bar and the value always share a line (owner's decision).** Below `lg` the handoff put the value on the name's line; the handoff is corrected. The value column is 44 px wide on every breakpoint, so all bars are equally long.
- **The meter runs from 1 to 10 (owner's decision),** like the `skills_level_range` check: level 0 does not exist.
- **The total comes from the database** (Claude's call). The design shows 41, the database has 42.
- **No block without marked skills** (Claude's call). An empty tile reads as a broken page.
- **The explorer's messages leave `Home.skills`** (Claude's call), matching `docs/design/shared/messages.en.json`. `/skills` gets its own namespace from its own design.
- **The value is right-aligned below `lg`** (Claude's call), so the list ends at the padding of the tile. From `lg` it stays left-aligned in its column, like the prototype.
- **Server only** (Claude's call). The block has no state, so it adds no client JavaScript.

## Tasks

### Task 1: Skill row (S)

`features/skill-row/SkillRow.tsx`, synchronous, gets `skill: { name, level }` as a prop. One DOM on every breakpoint, in the order name, bar, value.

- [x] The row has `role="meter"`, `aria-valuenow`, `aria-valuemin={1}`, `aria-valuemax={10}` and the `levelAria` label.
- [x] Ten segments: filled up to the level in `brand`, the rest in `placeholder`. Levels 1 and 10 are covered. `aria-valuetext` is "n/10", so no screen reader turns the 1–10 range into a percentage.
- [x] Below `lg`: the name on its own line, 15 px, then the bar and "n/10" on one line, 6 px between the lines. Bar 8 px tall, 3 px gaps.
- [x] From `lg`: grid `150px | 1fr | 44px`, gap 14 px. Bar 10 px tall, 4 px gaps.

Verify: `SkillRow.test.tsx`, test first. Depends on: nothing. `Home.skills` messages change here.

### Task 2: Skills in the navigation (XS)

`shared/lib/site-nav.ts`, `Header.nav.skills`, between Projects and Blog. The header and the mobile menu share the list.

- [x] Six items in the header and in the mobile menu.

Verify: `MobileNav.test.tsx` and `e2e/header.spec.ts`, updated first. Depends on: nothing.

### Task 3: The `top` column (S)

`src/db/schema/skills.ts`, `src/db/seed/data.ts`, [[Content Model]].

- [x] The schema and the seed mark the eight skills.
- [x] **Production database, confirmed by the owner first:** the column, then the eight rows, in one transaction (2026-11-01). There is one database, and the seed never runs on it again.

Verify: a read-only query shows 8 of 42 rows marked (done). Depends on: nothing.

### Task 4: The block replaces the dump (M)

`getTopSkills` in `src/db/queries/home.ts`, `widgets/top-skills/TopSkills.tsx`, wired into `HomePage`; the dump's Skills section goes away.

`getTopSkills(): Promise<{ skills: { name: string; level: number }[]; total: number }>`, cached with `cacheLife("max")` and the `skills` tag. No locale: tech names are not translated. Order: level desc, `sort`, `name`. Rows and total come in one `db.batch`.

- [x] A section labelled by `SectionHeader` "My top skills", no count.
- [x] One tile with a list. Below `lg`: 20 px padding, 14 px gap. From `lg`: 28 × 32 px padding, `repeat(auto-fill, minmax(320px, 1fr))`, gaps 18 × 48 px.
- [x] A primary pill "Show all {total} skills" to `/skills`, right-aligned from `lg`, full width below it.
- [x] Without marked skills the section is not rendered.

Verify: `e2e/home-skills.spec.ts` against the database (order, levels, the total matches the database, three columns at 1280, one on mobile, the bar and the value on one line on mobile, the link keeps the locale, the page does not widen at 390, 720, 1024 and 1280). Screenshots in both themes. Depends on: tasks 1 and 3.

## Checkpoint

- [x] Definition of done from `CLAUDE.md` is green (run on 2026-11-01, on the commit that adds the Blog block).
- [x] Mobile and desktop screenshots in both themes match the handoff.
- [x] Spec, Data Model, handoff and journal updated.
- [x] The owner reviewed the block before Blog starts (accepted by the owner, 2026-11-01).

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Code reading `top` reaches production before the column | High, the build fails | Task 3 runs before task 4; the column is additive, so the deployed code keeps working |
| A long name, such as "React Testing Library", does not fit the 150 px column | Low | It wraps inside the column: measured at 48 px tall, no overflow, on both breakpoints |
| `role="meter"` hides the text inside the row from a screen reader | Low | Intended: the label carries both the name and the level |
| The owner's cached home page shows the old block after a deploy | Low | The tag and the build refresh the cached data; a browser reload is enough |
