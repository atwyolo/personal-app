---
tags: [design, handoff]
updated: 2026-11-02
---

# Design handoff

These are the approved designs for the whole site, ready to implement: seven public pages and the admin panel.

- Every public page is mobile-first and has dark and light themes.
- Pages are localized through next-intl. Copy is in English; other locales fall back to `en`.

## Pages and order

| # | Page | Route | Spec | Rendering |
|---|---|---|---|---|
| 1 | Home | `/[locale]` | [[Home Page Handoff]] | static |
| 2 | Projects (work experience) | `/[locale]/projects` | [[Projects Page Handoff]] | static now, ISR once it reads the DB |
| 3 | About | `/[locale]/about` | [[About Page Handoff]] | static |
| 4 | Skills | `/[locale]/skills` | [[Skills Page Handoff]] | static now, ISR once it reads the DB |
| 5 | Blog list | `/[locale]/blog` | [[Blog Page Handoff]] | ISR |
| 6 | Blog post | `/[locale]/blog/[slug]` | [[Post Page Handoff]] | ISR, `generateStaticParams` |
| 7 | Contact | `/[locale]/contact` | [[Contact Page Handoff]] | static page + a Server Action |
| 8 | Admin | `/admin` (not localized) | [[Admin Handoff]] | dynamic, behind auth |

Build order:

1. **Home** first. It introduces the tokens, the header with the locale and theme menus, tiles, chips and buttons that every other page reuses.
2. **The public pages** in table order.
3. **Admin** last. It edits exactly the fields the pages read, so build it once the content shapes are settled (Stage 3, DB).

## What changed since the 2026-11-01 package

- **New pages:** Contact, Blog post (with a typography reference board) and Admin.
- **Home: contact buttons now use theme colors.** WhatsApp, Mail and LinkedIn are identical card-style buttons with icons in `brand`; Download CV stays the filled primary button. There are no brand-color tokens any more. The About page's contact buttons follow the same style.
- **Home: About block** is one rich-text field. The desktop-only extra paragraph is gone; desktop shows a "Read more" button like mobile.
- **"‹ Back" link** on every inner page. It is an accent text link, the same everywhere; see Site-wide rules.
- **Content shapes follow the admin.** `shared/content.ts` was updated:
  - Experience: `description` plus a rich-text `body` and skills. The `lead`, `context`, `stats` and `achievements` fields were removed.
  - About pairs: `answerTitle` plus a rich-text `answerBody`, and any number of pairs.
  - Skills: a new `main` flag; `featured` ("Top") has no limit.
  - Skill domains and blog topics are editable lists.
  - Contact form: `message` is required, and the old optional subject is gone.
- **Messages:** new namespaces `Common`, `ContactPage` and `Post`.
- **Tokens:** `success` was added; `destructive` is set to the design's error red.

## Shared files (`shared/`)

| File | Use |
|---|---|
| `tokens.css` | Colors for both themes, radii, fonts, and the reveal animation. Merge into `src/app/globals.css`. |
| `content.ts` | All copy and data for every page, typed. Move to `src/content/site.ts`; it is the static source until Stage 3 (DB). Field names match the admin forms. |
| `messages.en.json` | UI strings for next-intl, one namespace per page. Merge into `messages/en.json`. |

### What each page folder holds

- **`prototype.dc.html`:** the prototype source. Use it only to look up exact values. It does not run outside the design tool, and its top toolbar is prototype-only.
- **`screens/`:** PNG renders.
  - `desktop-dark-1…5.png` and `phone-dark-1…5.png` show the page scrolled from top (1) to bottom (5).
  - `*-light-1.png` shows the light theme.
  - Home has full-page renders instead.
  - Admin has one render per section; see its spec.
  - The photo tile is blank in all renders because uploaded images do not load in the renderer.
- **`post/` only:** it also holds `typography.dc.html` and `screens-typography/`. That board labels every text element with its size, line height, weight and color.

## Site-wide rules

- **Header**, sticky on every page.
  - Nav: Home · About · Projects · Skills · Blog · Contact.
  - The active item is `text-brand` with a `deco` underline.
  - Some prototype screens predate the Skills item; the six-item nav is correct.
- **No footer** on any page. Pages end with their last section.
- **"‹ Back" link**, the first element in the content of every inner page (Projects, About, Skills, Blog, Post, Contact).
  - A chevron-left icon (16 px) and "Back".
  - `text-brand`, 600 weight, 15 px, underlined with a 2 px `deco` line offset 5 px. Min height 32 px.
  - On hover, the chevron moves 3 px left.
  - It is a real link with a sensible default (`/` for top-level pages, `/blog` for a post). A small client enhancement uses `router.back()` when the previous history entry is on this site.
  - On Projects (desktop) it sits at the top of the sticky aside. On phone it sits in a row above the sticky progress bar.
- **Section labels** are mono, uppercase, 11–12 px, `muted-foreground`.
- **Page heroes:** a mono label, an h1 at 56 px desktop / 36 px phone, and a one-line intro.
- **Sticky side panels** (Skills, Blog, Contact) sit at `top: 20px` inside the content column on desktop. On phone they become normal blocks above the list. Blog and Contact add the collapsing behaviour described in their specs.
- **Chips:**
  - Filter chips are pills, 36 px tall, mono 12 px. An active filter is `bg-selected text-selected-foreground`.
  - Tag chips are `brand` text on a `card-border` outline. An active tag is filled with `brand`.
- **Links** like "Read more →" / "Learn more →" are `text-brand`, 600 weight, with a 2 px `deco` underline offset 5 px.
- **Contact buttons** (Home, About) are themed:
  - `bg-card`, a 1 px `card-border` border and `text-foreground`.
  - The icon is in `brand`, and the arrow-up-right is in `brand`.
  - On hover, the border turns `brand`.
  - Download CV is the filled `primary` button.
- **Anchors:** every work place has an id (`glovo`, `sony`, `epam`, `omega-r`), and Home links to `/projects#<id>`. Anchored sections need `scroll-margin-top` equal to the header height (plus any sticky bar).
- **Motion** respects `prefers-reduced-motion`: reveals and progress animations are skipped, and content is visible immediately.
- **All text is server-rendered.** Filters and scroll effects are small client components layered on top. With JavaScript off, every page still reads as a plain article or list.
- **Rich text** from the admin (Tiptap) is stored as sanitized HTML. It is rendered with one shared `<RichText>` component whose styles match the post typography (scaled down outside posts).

## Open questions

- **Page name.** The admin calls the page "Experience", while the site nav and route say "Projects". Pick one name for the nav, the route and the admin.
- **"Main" skills.** The admin has a "Main" flag next to "Top". The proposal is that it drives the hero chips on Home (the admin no longer edits hero tags). Note that "Express", currently a hero chip, is not in the skills list.

## Kickoff prompt (one page at a time)

> Read `CLAUDE.md`, `docs/Home.md`, `docs/design/README.md` and `docs/design/<Page> Page Handoff.md`, then look at the screenshots in `docs/design/<page>/screens/`. Implement the page following its "Scope and order" section, one step at a time. Before each step, briefly explain the approach and the Next.js concepts involved, and wait for my OK. Use `docs/design/shared/` as the source of truth for tokens, content and messages. Use the page's `prototype.dc.html` only to look up exact values. Don't commit.
