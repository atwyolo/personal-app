---
tags: [design, handoff, about]
status: approved
updated: 2026-11-02
---

# About Page Handoff

`/[locale]/about` presents the extended bio as a short **interview**. Each section heading is a question a recruiter would ask, and the answer appears as a chat reply. Approved variant: **C (Interview)** on the design canvas.

See [[README]] for shared rules and files. Data: `aboutSections` in `shared/content.ts`. Messages: the `About` namespace.

## Changes since 2026-11-01

- **"‹ Back" link** above the hero label (style in [[README]]).
- **The pairs are data, not a fixed six.** The admin can add, delete and reorder question–answer pairs. Each pair has `link_text` (chip label), `question_title` (the upper, larger line of the question bubble), `question_message` (the h2), `answer_title` (the first line, shown larger) and `answer_message` (rich text). Render however many there are (owner's decision of 2026-11-02, replacing a single `title` for the chip and the label).
- **The "results" section is ordinary rich text now:** its bullets live in its `answer_message`, not in `profile.about.results`.
- **No contact buttons** (owner's decision of 2026-11-02). Messages hold no extra items: a call to action becomes a link in `answer_message`, once rich text gets its own stage.

## Scope and order

1. Static route: hero plus one `<section id>` per entry in `aboutSections`.
2. Question and answer bubbles (server components).
3. Sticky question chips (client: active state, smooth scroll, auto-scrolling the chip row).
4. Reveal on scroll (CSS, or a tiny observer), with reduced motion respected.

## Layout

- **Hero**: no label (owner's decision of 2026-11-02), h1 "About me" (56 px desktop, 36 px phone), and an intro of at most 640 px: "A short interview with myself: the questions recruiters ask most, answered properly."
- **Question chips bar**, sticky under the header:
  - `bg-background` with a bottom border, padding 12 × 48 px (desktop) and 10 × 14 px (phone).
  - One chip per section, labelled with `link_text` (Who I am, How I work, …): mono 12 px, a pill with a `card-border` outline.
  - The active chip is `bg-foreground text-background`.
  - The row scrolls horizontally with the scrollbar hidden. When the active chip changes, scroll it into view.
  - Clicking a chip smooth-scrolls to its section, offset by the header and the bar.
- **Conversation column**: `max-width: 820px`, centered; padding 8 × 48 × 64 px on desktop and 8 × 14 × 40 px on phone; 28 px between sections (22 px on phone).

## Section (`<section class="qa" id="{id}">`)

- **Question = `h2`**, right-aligned bubble:
  - max width 70% (85% on phone), padding 14 × 18 px, radius `20 20 6 20`;
  - `bg-primary text-primary-foreground`: brand fill, so lime in dark and blue in light;
  - inside: `question_title` at 18 px / 600 (16 px on phone), then `question_message` at 14 px / 400 (13 px on phone): the larger line is the title (owner's decision of 2026-11-02, replacing a small mono label over a large question). The title stays outside the `h2`.
- **Answer**, left-aligned, max width 88% (100% on phone):
  - an avatar, a 40 px circle (32 px on phone), with a `card` fill, a `card-border` border and the initials "MA" in `brand` mono. Swap in the real photo later;
  - a bubble: `card` with a `card-border` border, radius `20 20 20 6`, padding 18 × 20 px, and a 12 px gap between its parts:
    - `answer_title`: 19 px / 1.45 / 500 (16 px on phone);
    - `answer_message` with `<RichText>`: paragraphs at 16 px / 1.7 in `foreground-soft`, lists with `deco` squares.

## Motion

- When a section's top crosses 85% of the viewport, the question fades up (opacity 0→1, `translateY 16px→0`, 0.45–0.5 s). The answer follows 350 ms later.
- With reduced motion, or without JS, everything is visible immediately. Do not hide content in the server HTML: start hidden only after hydration, for example with a `data-js` attribute on `<html>`.
- **Active chip** (owner's decision of 2026-11-02): the section nearest to the top of the visible page from below, measured from the bottom of the chips bar; a section that has gone above it no longer counts. Sections near the end cannot rise that far, so only a click marks their chips. A chip the visitor chose, or the target of a deep link, stays active until the visitor scrolls by hand.

## Accessibility and SEO

- Each section is a landmark-free `<section>` with its `h2`; the order of questions is the reading order.
- The avatar is decorative (`aria-hidden`); the bubble text carries the content.
- Chips are links `<a href="#id">` inside `<nav aria-label="Questions">`; the active one gets `aria-current="true"`.
- Use JSON-LD `ProfilePage` + `Person` (name, jobTitle, sameAs: LinkedIn).

Owner TODOs in `content.ts`: where you are based, what you're looking for, outside of work. The questions themselves can be reworded freely.
