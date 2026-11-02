---
tags: [spec, about, database]
status: done
date: 2026-11-02
updated: 2026-11-03
---

# About Page Design

Status: **done, the page was closed on 2026-11-03.** Plan: [[2026-11-02-about-page]].

Related: [[About Page Handoff]] (visual contract), [[Data Model]], [[Rendering Strategy]], [[ADR-0002 Database and ORM]], [[ADR-0003 Content Localization]], [[ADR-0007 Testing]].

## Intent

`/[locale]/about` presents the extended bio as a short interview: the questions a recruiter would ask, answered as chat replies. The content lives in the database as an ordered, localized list of question and answer pairs, so the admin can manage it later.

## Scope

**In:**
- Two tables, a seed of the six pairs in `en`, a cached query.
- The route with its metadata and JSON-LD, the hero with the Back link, the sticky chips, the conversation, the reveal on scroll.

**Out:**
- **Rich text beyond today's renderer.** A separate stage brings the editor and the output together (owner's decision). `answer_message` goes through the existing `src/shared/ui/RichText.tsx` unchanged. Link marks, italic, underline and numbered lists show as plain text until then.
- **Admin.** Nothing is editable yet.
- **Other locales' content.** Only `en` rows exist; every locale falls back to them.
- **Contact buttons** under an answer (see below).
- **Translating the new UI strings.** `messages/en.json` only, as with the rest of the site.

## Decided by the owner

1. **Pairs have five text fields:** `link_text`, `question_title`, `question_message`, `answer_title`, `answer_message`. Only `answer_message` is rich text.
2. **`link_text` is the text of the sticky chip**; `question_title` is the upper, larger line of the question bubble. This replaces the handoff's single `title`, used in both places.
3. **`slug` is entered by hand** in a future admin field, never generated. The seed sets it explicitly.
4. **The page title and intro are not editable:** they stay in `messages`. The Page header block of [[Admin Handoff]] goes away.
5. **No extra items in messages.** No `show_contacts`, no contact buttons. A call to action becomes a link in `answer_message`, once the rich text stage exists. Until then the page has no call to action.
6. **The content starts in `en`,** with the wording of the design.
7. **`profile_translations` gets `job_title`,** the source of `jobTitle` in the JSON-LD. `headline` stays what it is, a line for the hero, with the years in it.

## Data

See [[Data Model]] for the conventions.

### `about_pairs`

| Column | Type | Notes |
|---|---|---|
| `id` | identity | |
| `slug` | text, not null, unique | `<section id>` and the chip's `#slug`. Not translated. |
| `sort` | integer, not null, default 0 | Reading order. |
| `created_at`, `updated_at` | timestamptz | Shared `timestamps`. |

### `about_pair_translations`

| Column | Type | Notes |
|---|---|---|
| `about_pair_id` | integer, `translationOf` | Cascades from `about_pairs`. |
| `locale` | `locale` enum | Primary key `(about_pair_id, locale)`. |
| `link_text` | text | |
| `question_title` | text | |
| `question_message` | text | |
| `answer_title` | text | |
| `answer_message` | jsonb, `RichTextDoc` | |
| `created_at`, `updated_at` | timestamptz | Shared `timestamps`. |

Check `about_pair_translations_en_complete`: for `en`, all five fields are not null. Other locales may leave any field null, with the per-field fallback of [[ADR-0003 Content Localization]].

### `profile_translations.job_title`

A new `text` column, nullable like the other fields of the table. It joins `profile_translations_en_complete`, so `en` always has it. `getProfile` returns it through `localized()` as `jobTitle`. The `en` value is `Senior Frontend Software Engineer`, in the database and in `src/db/seed/data.ts`.

### Query

`src/db/queries/about.ts`, `getAboutPairs(locale)`:
- `"use cache"`, `cacheLife("max")`, `cacheTag("about")`, as in `src/db/queries/home.ts`.
- Joins the `en` row and left-joins the requested locale, with `localized()` on all five fields.
- Orders by `sort`, then `id`, so equal `sort` values stay deterministic.
- Returns `{ slug, linkText, questionTitle, questionMessage, answerTitle, answerMessage }[]`.

An empty list is valid: the page shows the hero and no chips bar. It does not throw, unlike `getProfile`, because the handoff says to render however many pairs there are.

### Seed

`npm run db:seed` stops when the database has content, and it has. The pairs get their own guard inside `src/db/seed/index.ts`: the existing block keeps its check and its behavior, then a separate step inserts the pairs only when `about_pairs` is empty. One command works on an empty database and on this one, and nothing is ever overwritten.

The content is `aboutSections` from `docs/design/shared/content.ts`, in `src/db/seed/data.ts`:
- `id` becomes `slug`: `who`, `how`, `results`, `scale`, `next`, `life`. Array order becomes `sort`.
- `title` fills both `link_text` and `question_title`.
- `question` fills `question_message`, `answerTitle` fills `answer_title`.
- `answerBody` is rewritten from HTML to `RichTextDoc` with `doc`, `paragraph` and `bulletList` from `src/shared/lib/rich-text.ts`.
- `showContacts` is dropped.
- Where `content.ts` says `TODO(owner): ...`, the seed uses the text of the approved screens, in brackets: for example `[2–3 sentences: hobbies, languages you speak, where you live.]`.

### Order of operations

The database changes run before the code that reads them is deployed: a build would fail on a missing table or column, on the home page too, because `getProfile` selects `job_title`.

The check cannot be tightened in one step, because the existing `en` row has no `job_title` yet and the constraint validates existing rows. So, in this order:

1. `db:push` with the two new tables and the nullable column, and the check unchanged.
2. `UPDATE` of the `en` row with the job title.
3. A one-off `drop constraint` + `add constraint` in one transaction: `push` never updates a changed check ([[ADR-0002 Database and ORM]]).
4. The seed for the pairs.

All of it is additive for the running deployments: they do not read the new tables or the column. There is one database for every environment, so the exact SQL of each step is shown to the owner and confirmed first.

## Page

The visual contract is [[About Page Handoff]] and the site-wide rules of `docs/design/README.md`. Only the differences and the structure are here.

**Differences from the handoff:** chips use `link_text`; the bubble's larger upper line is `question_title`, with `question_message` under it, smaller; no hero label; no contact buttons; no call to action for now.

**The README says rich text is stored as sanitized HTML.** The project stores Tiptap JSON (`CLAUDE.md`, [[Data Model]]), which wins.

**Rendering:** static per locale, `generateStaticParams` already comes from the root layout. The route file re-exports the view, as `src/app/[locale]/page.tsx` does.

**Structure:**
- `src/app/[locale]/about/page.tsx`: route, with the one-line rendering comment.
- `src/views/about/AboutPage.tsx`, `src/views/about/metadata.ts`: composition and metadata. `AboutPage` passes the locale-resolved data down.
- `src/widgets/about/About.tsx` is the home block and stays. The page's widgets take names that do not collide with it.
- `src/shared/ui/BackLink.tsx`: every inner page needs it, so it starts in `shared`. It is a plain server-rendered link to `/`, never a step in the history (owner's decision after the review): the visitor must not leave the site through it. This drops the README's `router.back()` enhancement.
- A client leaf for the chips, and a client leaf for the reveal. Everything else is a Server Component.
- JSON-LD `ProfilePage` + `Person` in a `<script type="application/ld+json">` rendered by the view: `name`, `jobTitle` and `sameAs` from `getProfile(locale)`, where `sameAs` is the LinkedIn URL. Serialized with `<` escaped, because database text ends up inside a script tag.

**Metadata:** title `About — {name}`, description `About.intro`, `alternates` from `getLocaleAlternates(locale, "/about")`.

**Messages (`messages/en.json`):**
- New namespace `About`, from the design's `docs/design/shared/messages.en.json`: `metaTitle`, `label`, `title`, `intro`, `questionsNav`. `avatarAlt` is not needed: the avatar is decorative.
- `back` joins a shared namespace, because all inner pages use it.

**Avatar:** initials derived from `profile.name`, the first letter of the first two words. A translated name then gives its own initials.

**Chips:**
- Links to `#slug` in `<nav aria-label={questionsNav}>`, through the router `Link` from `@/shared/lib/i18n/navigation` with `replace`. Server-rendered, so they are plain anchors without JavaScript. `src/shared/ui/Link.tsx` does not fit: it carries the text link's look.
- Going through the router keeps the history entry usable: a plain anchor writes an entry the router knows nothing about. `replace` keeps chips out of the history, so Back leaves the page instead of walking the chips.
- `sticky` under the header: `top-16`, `lg:top-[72px]`, the header's heights.
- Sections get `scroll-margin-top` of the header plus the bar.
- A chip's `Link` has `scroll={false}`: the router records the address, and the chip's click scrolls its own section with `scrollIntoView`, smooth unless motion is reduced, then moves the focus there, because the router leaves the focus alone. Sections have `tabIndex={-1}`. Without JavaScript the anchor jumps natively.
- The active chip is the section nearest to the top of the visible page from below, measured from the bottom of the sticky row: a section that has gone above it no longer counts (owner's decision, replacing the handoff's 40% line and its rule for the bottom of the page). Sections near the end cannot rise that far, so their chips are marked only by a click, which the owner accepted. Once every section has gone above, the last one stays. This choice is a pure function with Vitest tests. The active chip scrolls into view inside its row only, without moving the page.
- A chip the visitor chose, or the target of a deep link, stays active until the visitor scrolls by hand (owner's decision). `wheel`, `touchmove`, `keydown` and `pointerdown` mark the intent, and the next `scroll` confirms it, so a press that moves nothing changes nothing, and neither does the scroll a chip starts itself.

**Reveal on scroll:** per the handoff. Hiding starts only after hydration, through an attribute set by the client leaf, so the server HTML shows everything. It is off with reduced motion and in print.
- Before hiding starts, the first pass reveals everything above the bottom of the window and the target of a deep link with what precedes it. Hiding is instant, so nothing fades out.
- When the last section enters the window, everything left is revealed: on a tall window it can never rise to the 85% line.

**`cacheComponents` keeps a left route in the DOM** with `display: none` ([[Rendering Strategy]]). Effects of a hidden route are cleaned up, and tests must not match its hidden `h1`.

## Tests

- **Vitest:** the active-section function, the initials, the JSON-LD escaping.
- **Playwright** (read-only, against the seeded pairs): the page renders one section per pair in order; the question is an `h2` in reading order; chip text and hrefs; `aria-current` follows scrolling; a chip click lands below the sticky bars; a chip click adds no history entry; after a chip, going to another page and pressing the browser's Back shows About at the same section; `BackLink` goes home after several chip clicks, and from a page reached through the browser's Back; the chosen chip stays active on a section that cannot rise to the top, through a press that scrolls nothing, and follows the page again after a hand scroll; the last chip is not reached by scrolling alone; sticky behavior; reduced motion; JavaScript off shows everything; both themes; desktop and mobile; hreflang and JSON-LD.
- **Existing tests that treat `/about` as a 404:**
  - `e2e/home-motion.spec.ts`: the `allowedConsoleErrors` comment at the "once per page load" block no longer holds for this link.
  - `e2e/header-nav.spec.ts`, `e2e/header.spec.ts`: sections that lead to the 404 page, where the comment names About.
  - Anything else `/about` reaches is to be found while building.

## Documentation

Updated with the work:
- [[Data Model]]: the new tables, `job_title`, and `about_full` removed.
- [[About Page Handoff]]: `link_text` and `question_title`, no contact buttons.
- [[Admin Handoff]]: no Page header block, new Link text and Slug fields, a Job title field in the Home form, the "Needs answer" badge (see below).
- `docs/design/README.md`: the "About contact buttons" open question closed.
- [[Roadmap]]: the About page done, and a new stage for rich text in the editor and the output.
- [[Open Questions]]: About leaves the "no stage" question.
- `docs/Home.md`, journal.

## Claude's calls

- **`job_title` is required in `en`,** so the JSON-LD never lacks it. Alternative: an optional field, which needs no staged change to the check, but then the page must handle a missing value that never occurs. Its value is the `headline` without ", 8+ years".
- **Strict `en` check.** All five fields are required in `en`, so a pair on the site is always complete. The admin's "Needs answer" badge implies saving a pair without an answer. That is settled at the admin stage: drafts there would need a nullable field or a status.
- **Fallback stays per field**, as in the rest of the project, although a partly translated pair mixes languages inside the conversation. Alternative: fall back by row for this entity.
- **Own guard in the seed**, not a second script. Alternative: `db:seed:about`, simpler now, but an empty database would then need two commands.
- **The page is not in `src/db/queries/home.ts`:** that file and its cache tags describe the home page.
- **Brackets in the placeholders:** the screens show them, and they read as unfinished on purpose. They are public once deployed, because the database is shared.
- **`BackLink` in `shared/ui`**, ahead of a second user, because the README names six pages that need it.
- **Chips do not enter the history.** Alternative: `push`, so the browser's Back walks the chips.
- **Smooth scrolling belongs to the chips, not to `html`.** The first version set `scroll-behavior: smooth` site-wide, and the review measured the cost: the browser's position restore on Back and Forward animated across the whole site, because `data-scroll-behavior` only covers link navigation. A `popstate` listener could have undone that, at the price of more code for the same result.

## Left to the builder

Component and file names beyond those above, the exact observer or scroll mechanics of the client leaves, and the mapping of the handoff's pixel values to Tailwind.
