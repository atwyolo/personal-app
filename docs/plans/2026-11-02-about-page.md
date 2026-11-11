---
tags: [plan, about]
status: done
date: 2026-11-02
updated: 2026-11-03
---

# Plan: About page

Build `/[locale]/about` as an interview: database tables and content first, then the page, then its client behavior. Each task ends green and staged. The checklist in this note is the ledger.

Related: [[2026-11-02-about-page-design]] (the spec, read it with this plan), [[About Page Handoff]], [[Content Model]], [[ADR-0003 Content Localization]], [[ADR-0007 Testing]].

## Global constraints

- **Stages, not commits.** Every task ends with `git add`. The owner commits.
- **Inline, one task at a time.** Discuss in Russian before a task when something is unclear.
- **TDD** for logic and client components with Vitest. Async Server Components and database-backed output are verified with Playwright, which never writes to the database.
- **Production database:** the exact SQL or command is shown to the owner and confirmed before every write. `drizzle-kit push` asks for confirmation in a terminal, so the owner runs it (`! npm run db:push`).
- **Definition of done for a task:** `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- **Conventions from `CLAUDE.md`:** `FC<Props>`, named exports, props destructured on the first line, Server Components by default, `src/shared/ui/Image.tsx` for images, no barrels, English in the repository.
- **Visual values** come from [[About Page Handoff]] and `docs/design/README.md`. They are not repeated here.

## Decisions made while planning

- **The label sits outside the `h2`** (Claude's call). The handoff puts it inside the bubble, not necessarily inside the heading. `question_title` is a `<p>` before the `h2` within the bubble, so the heading reads as the question alone.
- **Slices** (Claude's call): `src/widgets/about-hero`, `src/widgets/interview`, `src/features/question-nav`, `src/features/interview-reveal`. The feature slices are client leaves.
- **`back` lives in a new `Common` namespace** (Claude's call). A namespace named after one page would not fit six pages.

- **After the review (2026-11-02):** Task 3's tracker is gone: `BackLink` is a plain link home (owner's decision), so `in-site-navigation.ts` and `NavigationTracker.tsx` no longer exist. Task 4's chips scroll by themselves with `scroll={false}`, and neither `scroll-behavior` on `html` nor `data-scroll-behavior` is used. A chosen chip holds until a hand scroll, and the active chip is the section nearest to the top from below instead of the 40% line (owner's decisions). The tasks below keep their original text as the record of what was planned; the spec holds the result.

## Review focus

The cases most likely to bite a visitor that no behavior in the spec names. Each has a test in the task that owns the code.

1. **A deep link** such as `/en/about#results` opened fresh must land below the sticky bars, with the section visible, not waiting for a reveal. Task 4 and Task 5.
2. **Leaving the page and coming back** must not leave sections hidden: the route is kept in the DOM and its effects re-run. Task 5.
3. **A 320 px phone:** many or long chips scroll inside their row, and the page itself never scrolls sideways. Task 4.
4. **A locale without translations** (`/ru/about`) shows the English pairs under `lang="ru"`, and switching the language stays on About. Task 2.
5. **Reduced motion or no JavaScript at any moment:** nothing stays hidden. Task 5.

---

## Tasks

### Task 1: Database

**Files:**
- Create: `src/db/schema/about.ts`
- Modify: `src/db/schema/index.ts`, `src/db/schema/profile.ts`, `src/db/seed/data.ts`, `src/db/seed/index.ts`, `src/db/queries/home.ts`

**Interfaces:**
- Produces: `aboutPairs`, `aboutPairTranslations` (`aboutPairId`, `locale`, `linkText`, `questionTitle`, `questionMessage`, `answerTitle`, `answerMessage`); `HomeProfile.jobTitle: string`; `data.aboutPairs`.

There are no unit tests here: Vitest does not reach the database, and Playwright covers the output in Task 2 and Task 6. The proof is the SQL and the read in Step 8.

- [x] **Step 1: Write the schema.** Tables as in the spec, shaped like `src/db/schema/experience.ts`: `id()`, `translationOf(() => aboutPairs.id)`, `timestamps`, `primaryKey`, check `about_pair_translations_en_complete` on all five fields, `slug: text().notNull().unique()`, `sort: integer().notNull().default(0)`. Export from the index. Add `jobTitle: text()` to `profileTranslations` and leave `profile_translations_en_complete` as it is.
- [x] **Step 2: Check the types.** Run `npx tsc --noEmit`. Expected: no errors.
- [x] **Step 3: Push the additive schema.** The owner runs `! npm run db:push`. Expected SQL, and nothing else: `CREATE TABLE "about_pairs"`, `CREATE TABLE "about_pair_translations"` with its check and foreign key, `ALTER TABLE "profile_translations" ADD COLUMN "job_title" text`. The only `DROP` allowed is the known `..._pk` pair from [[ADR-0002 Database and ORM]], which recreates an unchanged composite key on a random subset of tables. Stop on any other `DROP`. Afterwards compare the keys with a read-only `pg_constraint` query, as the ADR says.
- [x] **Step 4: Fill the job title.** After confirmation, run once:
  ```sql
  UPDATE profile_translations SET job_title = 'Senior Frontend Software Engineer' WHERE locale = 'en';
  ```
  Expected: 1 row.
- [x] **Step 5: Tighten the check.** Add `${t.jobTitle} is not null` to `profile_translations_en_complete` in the schema. `push` never updates a changed check ([[ADR-0002 Database and ORM]]), so after confirmation run `drop constraint` + `add constraint` in one transaction, then confirm with a read-only `pg_get_constraintdef` query.
- [x] **Step 6: Add the seed.** In `src/db/seed/data.ts`: `jobTitle` in `profile.en`, and `aboutPairs`, an array of `{ slug, linkText, questionTitle, questionMessage, answerTitle, answerMessage }` from `aboutSections` in `docs/design/shared/content.ts`, mapped as the spec says. Placeholders, verbatim:

  | Slug | Field | Text |
  |---|---|---|
  | `who` | `answerMessage` | `Most recently at Glovo, Sony PlayStation and EPAM. [2–3 sentences: where you are based, how you got into frontend and what kind of products you enjoy building.]` |
  | `next` | `answerTitle` | `[One sentence: the role, team and product you want next.]` |
  | `next` | `answerMessage` | `[2–3 sentences: role, format (remote or relocation), domains that interest you.]` |
  | `life` | `answerTitle` | `[A human detail people remember.]` |
  | `life` | `answerMessage` | `[2–3 sentences: hobbies, languages you speak, where you live.]` |

  In `src/db/seed/index.ts`, move the current body into `seedContent()` with its guard and message unchanged, and add `seedAboutPairs()`: it returns when `about_pairs` has a row, otherwise inserts the pairs with `returning`, then the `en` translations. `main()` calls both. Two round trips are not one transaction: if the second fails, delete the rows of `about_pairs` and run again.
- [x] **Step 7: Run the seed.** After confirmation, `npm run db:seed`. Expected: "The database already has content..." and a line for 6 pairs.
- [x] **Step 8: Read it back.** `select count(*)` on both tables gives 6 and 6; `select job_title from profile_translations where locale = 'en'` gives the title. A second `npm run db:seed` inserts nothing.
- [x] **Step 9: Return the job title.** Add `jobTitle: localized(tr.jobTitle, en.jobTitle)` to `getProfile` and `jobTitle` to `HomeProfile`.
- [x] **Step 10: Run the definition of done** and `git add` the task's files.

### Task 2: The page without client behavior

**Files:**
- Create: `src/db/queries/about.ts`, `src/app/[locale]/about/page.tsx`, `src/views/about/AboutPage.tsx`, `src/views/about/metadata.ts`, `src/widgets/about-hero/AboutHero.tsx`, `src/widgets/interview/Interview.tsx`, `src/widgets/interview/ui/InterviewPair.tsx`, `src/shared/lib/initials.ts`, `src/shared/lib/initials.test.ts`, `e2e/about.spec.ts`
- Modify: `messages/en.json`, `e2e/home-motion.spec.ts`, `e2e/header.spec.ts`, `e2e/header-nav.spec.ts`

**Interfaces:**
- Consumes: the tables and `getProfile` from Task 1.
- Produces: `aboutCacheTags = { pairs: "about" } as const`; `type AboutPair = { slug: string; linkText: string; questionTitle: string; questionMessage: string; answerTitle: string; answerMessage: RichTextDoc }`; `getAboutPairs(locale: Locale): Promise<AboutPair[]>`; `getInitials(name: string): string`.

- [x] **Step 1: Write the failing unit test** in `src/shared/lib/initials.test.ts`, table-driven: `"Mikhail Aleksandrov"` → `"MA"`, `"Михаил Александров"` → `"МА"`, `"Mikhail"` → `"M"`, `"  Mikhail   Aleksandrov  Jr"` → `"MA"`, `""` → `""`.
- [x] **Step 2: Run it.** `npx vitest run src/shared/lib/initials.test.ts`. Expected: FAIL, the module is missing.
- [x] **Step 3: Implement `getInitials`** and run the test. Expected: PASS.
- [x] **Step 4: Write the failing e2e tests** in `e2e/about.spec.ts`, importing from `./fixtures`, locating sections with `main section[id]`:
  - `/en/about` has `h1` "About me" and intro "A short interview with myself: the questions recruiters ask most, answered properly."
  - the `h2`s read, in order: "Who are you, in two sentences?", "How do you like to work?", "What results are you proud of?", "What kind of teams have you worked in?", "What are you looking for next?", "And outside of work?"
  - section ids in order: `who`, `how`, `results`, `scale`, `next`, `life`
  - `#results` holds three `li` with the deco bullet, and `#who` shows "Who I am" as its label and the avatar text "MA", with `aria-hidden` on the avatar
  - the page title is `About — Mikhail Aleksandrov`, and `link[rel="canonical"]` ends in `/en/about`
  - **Review focus 4:** `/ru/about` has `html[lang="ru"]` and the same English `h2`s; switching the language from `/en/about` through the locale menu lands on `/ru/about`
  - in the viewport of 320 px width, `document.documentElement.scrollWidth` equals `clientWidth` (bubbles do not overflow)
- [x] **Step 5: Run them.** `npx playwright test e2e/about.spec.ts --project=desktop`. Expected: FAIL with 404.
- [x] **Step 6: Implement the query.** `getAboutPairs` as the spec says, on the pattern of `getProfile`. Rows without an `en` translation drop out through the inner join.
- [x] **Step 7: Add the messages.** `About` (`metaTitle`, `label`, `title`, `intro`, `questionsNav`) from `docs/design/shared/messages.en.json`, `Common.back` as "Back".
- [x] **Step 8: Build the route, the view, the metadata, the hero and the conversation.** Route file on the pattern of `src/app/[locale]/page.tsx`, with the one-line rendering comment. `AboutPage` is `<main>`: `AboutHero`, `Interview`. `Interview` renders the sections from `getAboutPairs`, passing `getInitials(profile.name)`. `AboutHero` leaves a marked place for `BackLink`. An empty list renders the hero only.
- [x] **Step 9: Run the e2e tests.** Expected: PASS on both Playwright projects.
- [x] **Step 10: Update the tests that treat `/about` as a 404.**
  - `e2e/home-motion.spec.ts`: `leaveHome` now reaches a real page; fix the comment at "once per page load" and drop `allowedConsoleErrors` where no 404 remains.
  - `e2e/header.spec.ts:74`, `e2e/header-nav.spec.ts:105`: keep the allowance for the sections that still lead to 404, and correct the comments.
  - Run `npm run test:e2e` and fix what else the page changed.
- [x] **Step 11: Run the definition of done** and `git add` the task's files.

### Task 3: Back link

**Files:**
- Create: `src/shared/lib/in-site-navigation.ts`, `src/shared/lib/in-site-navigation.test.ts`, `src/shared/ui/NavigationTracker.tsx`, `src/shared/ui/NavigationTracker.test.tsx`, `src/shared/ui/BackLink.tsx`, `src/shared/ui/BackLink.test.tsx`
- Modify: `src/views/site-layout/SiteLayout.tsx`, `src/widgets/about-hero/AboutHero.tsx`, `e2e/about.spec.ts`

**Interfaces:**
- Produces: `markInSiteNavigation(): void`; `hasInSiteNavigation(): boolean`; `NavigationTracker: FC`; `BackLink: FC<{ href?: string; label: string }>`, `href` defaulting to `/`.

- [x] **Step 1: Write the failing tests.**
  - `hasInSiteNavigation()` is false until `markInSiteNavigation()` is called, then true.
  - `NavigationTracker`, with a mocked `usePathname`: the first render marks nothing; a rerender with another path marks navigation; a rerender with the same path marks nothing.
  - `BackLink` renders a link to `/` named by `label`, its chevron `aria-hidden`.
  - `BackLink` click without in-site navigation does not call `router.back()`, and the link goes on; with in-site navigation it calls `router.back()` once and prevents the default. A click with a modifier key is left to the browser.
- [x] **Step 2: Run them.** Expected: FAIL, the modules are missing.
- [x] **Step 3: Implement.** A module-level flag. `NavigationTracker` compares the pathname in an effect and returns `null`; mount it in `SiteLayout` beside `RevealOnce`. `BackLink` uses `useRouter` and the router `Link`, styled as the README's Back link.
- [x] **Step 4: Run them.** Expected: PASS.
- [x] **Step 5: Add e2e tests.** Opened directly, Back on `/en/about` goes to `/en`. From `/en` through "Read more" to About, Back returns to `/en` with the home page visible. Clicking it on the home-to-About path does not reload the page.
- [x] **Step 6: Use `BackLink` in `AboutHero`** with `Common.back`, and run the definition of done, then `git add`.

### Task 4: Question chips

**Files:**
- Create: `src/features/question-nav/active-section.ts`, `src/features/question-nav/active-section.test.ts`, `src/features/question-nav/QuestionNav.tsx`, `src/features/question-nav/QuestionNav.test.tsx`
- Modify: `src/widgets/interview/Interview.tsx`, `src/app/globals.css`, `src/app/[locale]/layout.tsx`, `e2e/about.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  interface ActiveSectionParams {
    /** Top of each section relative to the viewport, in px, in reading order. */
    sectionTops: number[];
    viewportHeight: number;
    /** Distance from the viewport's bottom to the document's bottom, in px. */
    distanceToBottom: number;
  }
  getActiveSection(params: ActiveSectionParams): number
  ```
  `QuestionNav: FC<{ label: string; items: { slug: string; linkText: string }[] }>`.

- [x] **Step 1: Write the failing unit test**, table-driven, with a viewport of 1000 and `distanceToBottom: 200` unless stated. Tops `[0, 500, 900]` → `0`. Tops `[100, 399, 900]` → `1` (above the 400 line). Tops `[100, 400, 900]` → `0` (exactly on the line is not above). Tops `[500, 900, 1300]` → `0` (nothing above the line yet). Tops `[-900, -100, 900]` with `distanceToBottom: 0` → `2` (the bottom of the page). `sectionTops: []` → `0`.
- [x] **Step 2: Run it.** Expected: FAIL.
- [x] **Step 3: Implement `getActiveSection`.** Treat `distanceToBottom <= 1` as the bottom: fractional scroll positions leave a sub-pixel gap.
- [x] **Step 4: Write the failing component test.** `QuestionNav` renders a `nav` named by `label`, one link per item with `href` ending `#slug`, and the first item with `aria-current="true"`. Mock the router `Link` only if rendering it requires it.
- [x] **Step 5: Implement `QuestionNav`.** The router `Link` with `replace`. A scroll listener with `passive: true` batched by `requestAnimationFrame`, reading the section tops by `slug`, removed on cleanup. When the active item changes, scroll the row itself with `row.scrollTo({ left, behavior })`, never `scrollIntoView`, which also moves the page. `behavior` is `auto` under reduced motion. The bar and its chips follow the handoff, with the scrollbar hidden.
- [x] **Step 6: Connect it.** `Interview` renders `QuestionNav` before the sections, only when there are pairs. Sections get `scroll-margin-top` for the header plus the bar. `globals.css`: `scroll-behavior: smooth` on `html` under `prefers-reduced-motion: no-preference`. The root layout's `<html>`: `data-scroll-behavior="smooth"`.
- [x] **Step 7: Add e2e tests.**
  - chip texts in order: "Who I am", "How I work", "Results I'm proud of", "Teams and scale", "What I'm looking for", "Outside of work"
  - the bar stays under the header after scrolling, at `top` 72 px on desktop and 64 px on mobile
  - after a click on "Teams and scale", the URL ends in `#scale`, the section's `h2` is below the bar's bottom edge and in the viewport, and that chip has `aria-current="true"`
  - at the bottom of the page the last chip is active
  - `history.length` does not grow after three chip clicks
  - the chip, a link to another page, then `page.goBack()`: the URL ends in `#scale` and the About `h1` is visible
  - after three chip clicks, `BackLink` leaves the page
  - **Review focus 1:** opening `/en/about#results` fresh puts the section's `h2` below the bar
  - after a language switch the left page stays in the DOM with the same ids (`cacheComponents`), found in Task 2: a chip click on `/ru/about` still scrolls the visible section, and the active chip follows the visible sections. `QuestionNav` looks sections up inside its own conversation, never through `document.getElementById`
  - **Review focus 3:** at 320 px the row scrolls (`scrollWidth > clientWidth`), the page does not, and the active chip is fully inside the row after scrolling to the end
  - without JavaScript (`javaScriptEnabled: false`) the chips are links and the click moves to the section
- [x] **Step 8: Run the definition of done** and `git add` the task's files.

### Task 5: Reveal on scroll

**Files:**
- Create: `src/features/interview-reveal/InterviewReveal.tsx`, `src/features/interview-reveal/InterviewReveal.test.tsx`
- Modify: `src/widgets/interview/Interview.tsx`, `src/widgets/interview/ui/InterviewPair.tsx`, `src/app/globals.css`, `e2e/about.spec.ts`

**Interfaces:**
- Produces: `InterviewReveal: FC<{ children: ReactNode }>`: wraps the conversation, sets `data-reveal` on its element after hydration when motion is allowed, and sets `data-revealed` on each section as it crosses 85% of the viewport.

- [x] **Step 1: Write the failing component test.** With a stub `IntersectionObserver` and `matchMedia`: motion allowed sets `data-reveal` and observes every `section`; the observer callback sets `data-revealed` on that section and stops observing it; reduced motion sets no `data-reveal` and creates no observer; a missing `IntersectionObserver` sets no `data-reveal`.
- [x] **Step 2: Run it.** Expected: FAIL.
- [x] **Step 3: Implement.** A layout effect. It marks sections already above the 85% line synchronously, before `data-reveal` goes on, because the observer's first callback comes after a paint and they would flash hidden. They appear without the fade. `rootMargin: "0px 0px -15% 0px"` for the line. A section that jumped past the viewport upwards counts as revealed too. Cleanup disconnects the observer and removes `data-reveal`. The component also takes `className`: it is the conversation's column.
- [x] **Step 4: Add the CSS** in `globals.css`, under `prefers-reduced-motion: no-preference` and scoped to `[data-reveal]`: the question fades up by 16 px over 0.45 s, the answer follows after 350 ms. The hidden state exists only under `[data-reveal] section:not([data-revealed])`.
- [x] **Step 5: Run the component test.** Expected: PASS.
- [x] **Step 6: Add e2e tests.**
  - a section below the fold has `opacity: 0` before scrolling and `1` after
  - **Review focus 5:** with `reducedMotion: "reduce"` every section is visible at once and has no `data-reveal`; with JavaScript off every `h2` is visible
  - **Review focus 1:** opening `/en/about#next` fresh shows that section and all above it at `opacity: 1`
  - **Review focus 2:** About, then Home through the header, then the browser's Back: every section in view is at `opacity: 1`
- [x] **Step 7: Run the definition of done** and `git add` the task's files.

### Task 6: JSON-LD

**Files:**
- Create: `src/shared/lib/json-ld.ts`, `src/shared/lib/json-ld.test.ts`
- Modify: `src/views/about/AboutPage.tsx`, `e2e/about.spec.ts`

**Interfaces:**
- Consumes: `HomeProfile.jobTitle`, `contacts.linkedin.href`.
- Produces: `serializeJsonLd(data: object): string`.

- [x] **Step 1: Write the failing unit test.** `serializeJsonLd({ name: "a</script><script>alert(1)</script>" })` contains no `<` and `JSON.parse` of it gives the original object back.
- [x] **Step 2: Run it.** Expected: FAIL.
- [x] **Step 3: Implement** as in the Next JSON-LD guide: `JSON.stringify(data).replace(/</g, "\\u003c")`.
- [x] **Step 4: Write the failing e2e test.** `/en/about` has one `script[type="application/ld+json"]`; parsed, `@type` is `ProfilePage`, `mainEntity["@type"]` is `Person`, `mainEntity.name` is "Mikhail Aleksandrov", `mainEntity.jobTitle` is "Senior Frontend Software Engineer", and `mainEntity.sameAs` holds the LinkedIn URL.
- [x] **Step 5: Render the script in `AboutPage`** with `dangerouslySetInnerHTML` and `serializeJsonLd`.
- [x] **Step 6: Run the definition of done** and `git add` the task's files.

### Task 7: Review and hand over

- [x] **Step 1: Run `requesting-code-review`** on `git diff --cached`, then `receiving-code-review` for the findings.
- [x] **Step 2: Check it by eye** in both themes, on desktop and on a phone, and in the iOS simulator: sticky bars, smooth scrolling and rotation are the risky parts.
- [x] **Step 3: Run Lighthouse** on `/en/about`: the page adds two client leaves.
- [x] **Step 4: Ask the owner** whether it can be committed and which version to raise. The rest of the documentation from the spec's list, the version and the commit message follow the end-of-step rule in `CLAUDE.md`.
